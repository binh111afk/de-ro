/**
 * Bảng vẽ — vẽ cảnh lên canvas. Nét vẽ tay bằng roughjs, nét bút bằng perfect-freehand
 * (hai thư viện MIT mà Excalidraw cũng dùng). Cách tổ chức học theo `renderer/` và
 * `packages/element/src/renderElement.ts`, `shape.ts` của Excalidraw (MIT).
 */
import rough from 'roughjs'
import type { Drawable, Options } from 'roughjs/bin/core'
import { getStroke } from 'perfect-freehand'
import {
  centerOf, fontOf, handlePositions, isLinear, LINE_HEIGHT, localBounds, unionBounds,
  type Bounds, type El, type Paper, type PenKind, type Pt,
} from './scene'

export interface View {
  scrollX: number
  scrollY: number
  zoom: number
}

const gen = rough.generator()
const cache = new Map<string, { ver: number; d: Drawable[] | Path2D }>()

function roughOptions(e: El): Options {
  const sw = e.strokeWidth
  return {
    seed: e.seed,
    roughness: e.roughness,
    bowing: 1,
    stroke: e.stroke,
    strokeWidth: sw,
    fill: e.fill === 'transparent' ? undefined : e.fill,
    fillStyle: e.fillStyle,
    fillWeight: sw / 2,
    hachureGap: sw * 4,
    strokeLineDash: e.strokeStyle === 'dashed' ? [8, 8 + sw] : e.strokeStyle === 'dotted' ? [1.5, 6 + sw] : undefined,
    disableMultiStroke: e.strokeStyle !== 'solid',
    preserveVertices: e.roughness < 1,
  }
}

function arrowHead(a: Pt, b: Pt, sw: number): [Pt, Pt] {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  const len = Math.min(Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.5, 18 + sw * 2)
  const spread = Math.PI / 8
  return [
    [b[0] - len * Math.cos(ang - spread), b[1] - len * Math.sin(ang - spread)],
    [b[0] - len * Math.cos(ang + spread), b[1] - len * Math.sin(ang + spread)],
  ]
}

export function svgPathFromStroke(s: number[][]): string {
  if (!s.length) return ''
  const d: (string | number)[] = ['M', s[0][0], s[0][1], 'Q']
  for (let i = 0; i < s.length; i++) {
    const [x0, y0] = s[i]
    const [x1, y1] = s[(i + 1) % s.length]
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  d.push('Z')
  return d.join(' ')
}

/** hình dạng (đã tính, đặt ở gốc toạ độ của phần tử) — lưu cache theo ver */
function shapeOf(e: El): Drawable[] | Path2D {
  const hit = cache.get(e.id)
  if (hit && hit.ver === e.ver) return hit.d
  const o = roughOptions(e)
  let d: Drawable[] | Path2D
  switch (e.kind) {
    case 'rectangle':
      d = [gen.rectangle(0, 0, e.w, e.h, o)]
      break
    case 'ellipse':
      d = [gen.ellipse(e.w / 2, e.h / 2, e.w, e.h, o)]
      break
    case 'diamond':
      d = [gen.polygon([[e.w / 2, 0], [e.w, e.h / 2], [e.w / 2, e.h], [0, e.h / 2]], o)]
      break
    case 'line':
    case 'arrow': {
      const pts = e.points ?? []
      const lo = { ...o, fill: undefined }
      d = [gen.linearPath(pts, lo)]
      if (e.kind === 'arrow' && pts.length >= 2) {
        const b = pts[pts.length - 1]
        const [l, r] = arrowHead(pts[pts.length - 2], b, e.strokeWidth)
        d.push(gen.linearPath([l, b, r], { ...lo, strokeLineDash: undefined }))
      }
      break
    }
    case 'freedraw': {
      const pr = e.pen === 'highlight' ? undefined : e.pressures
      const pts = (e.points ?? []).map((p, i) => [p[0], p[1], pr?.[i] ?? 0.5])
      const outline = penOutline(pts, { pen: e.pen ?? 'ball', width: e.strokeWidth, sharp: e.tipSharp, sens: e.tipSens, real: !!pr })
      d = new Path2D(svgPathFromStroke(outline))
      break
    }
    default:
      d = []
  }
  cache.set(e.id, { ver: e.ver, d })
  return d
}

/** đặc tính từng loại ngòi: độ thon theo lực, cỡ, độ vuốt nhọn hai đầu */
const PEN_TRAITS: Record<PenKind, { thin: number; size: number; taper: number; smooth: number }> = {
  fountain: { thin: 0.72, size: 2.6, taper: 7, smooth: 0.6 },
  ball: { thin: 0.45, size: 2.2, taper: 3, smooth: 0.6 },
  brush: { thin: 0.88, size: 4.4, taper: 11, smooth: 0.75 },
  pencil: { thin: 0.25, size: 2.4, taper: 2, smooth: 0.55 },
  marker: { thin: 0.12, size: 2.8, taper: 0, smooth: 0.6 },
  highlight: { thin: 0, size: 2.6, taper: 0, smooth: 0.6 },
}

/** đường viền nét bút; pts = [x, y, lực nhấn]. Dùng cho cả bảng vẽ lẫn ô xem trước kiểu bút */
export function penOutline(pts: number[][], o: { pen: PenKind; width: number; sharp?: number; sens?: number; real: boolean }) {
  const t = PEN_TRAITS[o.pen]
  const sens = o.sens ?? 0.5, sharp = o.sharp ?? 0.5
  const size = o.width * t.size
  const thinning = o.pen === 'highlight' ? 0 : Math.max(-0.95, Math.min(0.95, t.thin * (0.3 + 1.4 * sens)))
  const taper = t.taper ? sharp * size * t.taper : 0
  const cap = o.pen !== 'highlight'
  return getStroke(pts, {
    size,
    thinning,
    smoothing: t.smooth,
    streamline: o.real ? 0.35 : 0.5,
    simulatePressure: !o.real && thinning > 0,
    start: { cap, taper },
    end: { cap, taper },
    last: true,
  })
}

/** bút chì: tô bằng mẫu hạt li ti cùng màu để ra vân chì (lưu theo màu) */
const grain = new Map<string, CanvasPattern | null>()
function pencilFill(ctx: CanvasRenderingContext2D, color: string) {
  if (grain.has(color)) return grain.get(color)!
  const c = document.createElement('canvas')
  c.width = c.height = 48
  const g = c.getContext('2d')!
  g.fillStyle = color
  for (let i = 0; i < 48 * 48 * 0.85; i++) {
    g.globalAlpha = 0.5 + Math.random() * 0.5
    g.fillRect(Math.floor(Math.random() * 48), Math.floor(Math.random() * 48), 1, 1)
  }
  const pat = ctx.createPattern(c, 'repeat')
  grain.set(color, pat)
  return pat
}

/** ảnh đã nạp (theo src); nạp xong thì báo để vẽ lại */
const images = new Map<string, HTMLImageElement>()
let onImageLoad: (() => void) | null = null
export function setImageLoadHandler(fn: (() => void) | null) { onImageLoad = fn }
function imageOf(src: string) {
  let img = images.get(src)
  if (!img) {
    img = new Image()
    img.onload = () => onImageLoad?.()
    img.src = src
    images.set(src, img)
  }
  return img
}

export function drawElement(ctx: CanvasRenderingContext2D, rc: ReturnType<typeof rough.canvas>, e: El) {
  ctx.save()
  ctx.globalAlpha = e.opacity / 100
  if (e.angle) {
    const [cx, cy] = centerOf(e)
    ctx.translate(cx, cy)
    ctx.rotate(e.angle)
    ctx.translate(-cx, -cy)
  }
  ctx.translate(e.x, e.y)
  if (e.kind === 'image') {
    const img = e.src ? imageOf(e.src) : null
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, e.w, e.h)
    else {
      ctx.fillStyle = '#f1efec'
      ctx.fillRect(0, 0, e.w, e.h)
    }
  } else if (e.kind === 'text') {
    ctx.font = fontOf(e.fontSize)
    ctx.fillStyle = e.stroke
    ctx.textBaseline = 'top'
    const lh = e.fontSize * LINE_HEIGHT
    ;(e.text ?? '').split('\n').forEach((line, i) => ctx.fillText(line, 0, i * lh + (lh - e.fontSize) / 2))
  } else {
    if (e.kind === 'freedraw' && e.strokeStyle !== 'solid') {
      // nét bút đứt / chấm: vẽ đường cong trơn qua các điểm rồi đặt mẫu gạch (đường viền của perfect-freehand không gạch được)
      const pts = e.points ?? []
      const w = e.strokeWidth * 1.8
      ctx.strokeStyle = e.stroke
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.setLineDash(e.strokeStyle === 'dashed' ? [w * 3, w * 2.5] : [0.01, w * 2])
      if (e.pen === 'highlight') ctx.globalCompositeOperation = 'multiply'
      ctx.beginPath()
      ctx.moveTo(pts[0]?.[0] ?? 0, pts[0]?.[1] ?? 0)
      for (let i = 1; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]
        ctx.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      }
      const last = pts[pts.length - 1]
      if (last) ctx.lineTo(last[0], last[1])
      ctx.stroke()
      ctx.restore()
      return
    }
    const s = shapeOf(e)
    if (s instanceof Path2D) {
      ctx.fillStyle = (e.pen === 'pencil' && pencilFill(ctx, e.stroke)) || e.stroke
      if (e.pen === 'highlight') ctx.globalCompositeOperation = 'multiply'
      ctx.fill(s)
    } else for (const d of s) rc.draw(d)
  }
  ctx.restore()
}

export interface LaserTrail {
  pts: Pt[]
  ts: number[]
}

export interface Overlay {
  selected: El[]
  marquee: Bounds | null
  hiddenId: string | null
  paper: Paper
  lasso: Pt[] | null
  laser: LaserTrail[]
  eraser: { p: Pt; r: number } | null
}

export const LASER_LIFE = 1000

/** nền giấy: kẻ ô / kẻ dòng / chấm, vẽ theo toạ độ cảnh để cuộn và phóng to theo */
function drawPaper(ctx: CanvasRenderingContext2D, paper: Paper, view: View, w: number, h: number) {
  if (paper === 'plain') return
  const step = paper === 'lines' ? 32 : 24
  if (step * view.zoom < 6) return
  const x0 = -view.scrollX, y0 = -view.scrollY
  const x1 = x0 + w / view.zoom, y1 = y0 + h / view.zoom
  const sx = Math.floor(x0 / step) * step, sy = Math.floor(y0 / step) * step
  ctx.save()
  if (paper === 'dots') {
    ctx.fillStyle = '#c9c4be'
    const r = 1.3 / view.zoom
    for (let x = sx; x <= x1; x += step)
      for (let y = sy; y <= y1; y += step) {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
  } else {
    ctx.strokeStyle = paper === 'lines' ? '#d6e4f0' : '#ebe7e2'
    ctx.lineWidth = 1 / view.zoom
    ctx.beginPath()
    for (let y = sy; y <= y1; y += step) { ctx.moveTo(x0, y); ctx.lineTo(x1, y) }
    if (paper === 'grid') for (let x = sx; x <= x1; x += step) { ctx.moveTo(x, y0); ctx.lineTo(x, y1) }
    ctx.stroke()
  }
  ctx.restore()
}

const ACCENT = '#b4532a'

function drawHandle(ctx: CanvasRenderingContext2D, p: Pt, zoom: number, round = false) {
  const s = 8 / zoom
  ctx.beginPath()
  if (round) ctx.arc(p[0], p[1], s / 2, 0, Math.PI * 2)
  else ctx.rect(p[0] - s / 2, p[1] - s / 2, s, s)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.stroke()
}

export function render(
  canvas: HTMLCanvasElement,
  els: El[],
  view: View,
  overlay: Overlay,
) {
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const z = view.zoom * dpr
  ctx.setTransform(z, 0, 0, z, view.scrollX * z, view.scrollY * z)

  drawPaper(ctx, overlay.paper, view, canvas.width / dpr, canvas.height / dpr)

  const rc = rough.canvas(canvas)
  for (const e of els) if (e.id !== overlay.hiddenId) drawElement(ctx, rc, e)

  // khung chọn
  ctx.lineWidth = 1 / view.zoom
  ctx.strokeStyle = ACCENT
  const sel = overlay.selected
  for (const e of sel) {
    if (isLinear(e) && sel.length === 1) continue
    ctx.save()
    if (e.angle) {
      const [cx, cy] = centerOf(e)
      ctx.translate(cx, cy)
      ctx.rotate(e.angle)
      ctx.translate(-cx, -cy)
    }
    const [x1, y1, x2, y2] = localBounds(e)
    const pad = 4 / view.zoom
    ctx.setLineDash(sel.length > 1 ? [4 / view.zoom, 4 / view.zoom] : [])
    ctx.strokeRect(x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2)
    ctx.restore()
  }
  ctx.setLineDash([])

  if (sel.length === 1) {
    const e = sel[0]
    if (isLinear(e)) {
      const pts = e.points ?? []
      for (const p of [pts[0], pts[pts.length - 1]]) if (p) drawHandle(ctx, [e.x + p[0], e.y + p[1]], view.zoom, true)
    } else {
      ctx.save()
      if (e.angle) {
        const [cx, cy] = centerOf(e)
        ctx.translate(cx, cy)
        ctx.rotate(e.angle)
        ctx.translate(-cx, -cy)
      }
      const hs = handlePositions(localBounds(e), view.zoom, true)
      for (const [k, p] of Object.entries(hs)) drawHandle(ctx, p as Pt, view.zoom, k === 'rot')
      ctx.restore()
    }
  } else if (sel.length > 1) {
    const b = unionBounds(sel)!
    const pad = 6 / view.zoom
    ctx.strokeRect(b[0] - pad, b[1] - pad, b[2] - b[0] + pad * 2, b[3] - b[1] + pad * 2)
    for (const p of Object.values(handlePositions(b, view.zoom, false))) drawHandle(ctx, p as Pt, view.zoom)
  }

  if (overlay.lasso && overlay.lasso.length > 1) {
    ctx.save()
    ctx.beginPath()
    overlay.lasso.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
    ctx.closePath()
    ctx.fillStyle = 'rgba(180, 83, 42, 0.06)'
    ctx.fill()
    ctx.setLineDash([5 / view.zoom, 4 / view.zoom])
    ctx.stroke()
    ctx.restore()
  }

  // bút laser: quầng đỏ mềm + lõi sáng, đuôi thon và mờ dần theo tuổi từng điểm, đầu có chấm sáng
  const now = performance.now()
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const segs = (tr: LaserTrail, pass: (a: number) => void) => {
    const P = tr.pts
    for (let i = 1; i < P.length; i++) {
      const a = 1 - (now - tr.ts[i]) / LASER_LIFE
      if (a <= 0) continue
      // đoạn cong qua trung điểm để vệt trơn, không gãy khúc
      const m0: Pt = i > 1 ? [(P[i - 2][0] + P[i - 1][0]) / 2, (P[i - 2][1] + P[i - 1][1]) / 2] : P[0]
      const m1: Pt = [(P[i - 1][0] + P[i][0]) / 2, (P[i - 1][1] + P[i][1]) / 2]
      ctx.beginPath()
      ctx.moveTo(m0[0], m0[1])
      ctx.quadraticCurveTo(P[i - 1][0], P[i - 1][1], m1[0], m1[1])
      pass(a)
      ctx.stroke()
    }
  }
  const lz = view.zoom
  ctx.shadowColor = 'rgba(255, 45, 45, 0.85)'
  ctx.shadowBlur = 14 * dpr
  for (const tr of overlay.laser) segs(tr, (a) => { ctx.strokeStyle = `rgba(255, 59, 48, ${0.55 * a})`; ctx.lineWidth = (3 + 6 * a) / lz })
  ctx.shadowBlur = 0
  for (const tr of overlay.laser) segs(tr, (a) => { ctx.strokeStyle = `rgba(255, 236, 232, ${a})`; ctx.lineWidth = (1 + 1.6 * a) / lz })
  for (const tr of overlay.laser) {
    const last = tr.pts[tr.pts.length - 1]
    if (!last || now - tr.ts[tr.ts.length - 1] > 120) continue
    const g = ctx.createRadialGradient(last[0], last[1], 0, last[0], last[1], 9 / lz)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,90,80,0.9)')
    g.addColorStop(1, 'rgba(255,59,48,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(last[0], last[1], 9 / lz, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  if (overlay.eraser) {
    const { p, r } = overlay.eraser
    ctx.save()
    ctx.beginPath()
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fill()
    ctx.strokeStyle = '#78716c'
    ctx.lineWidth = 1 / view.zoom
    ctx.stroke()
    ctx.restore()
  }

  if (overlay.marquee) {
    const [x1, y1, x2, y2] = overlay.marquee
    ctx.fillStyle = 'rgba(180, 83, 42, 0.08)'
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
  }
}

export function dropFromCache(id: string) {
  cache.delete(id)
}
