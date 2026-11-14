/**
 * Bảng vẽ — vẽ cảnh lên canvas. Nét vẽ tay bằng roughjs, nét bút bằng perfect-freehand
 * (hai thư viện MIT mà Excalidraw cũng dùng). Cách tổ chức học theo `renderer/` và
 * `packages/element/src/renderElement.ts`, `shape.ts` của Excalidraw (MIT).
 */
import rough from 'roughjs'
import type { Drawable, Options } from 'roughjs/bin/core'
import { getStroke } from 'perfect-freehand'
import {
  centerOf, fontOf, handlePositions, isDarkPaper, isLinear, LINE_HEIGHT, localBounds, paperBg, unionBounds,
  type Bounds, type El, type Paper, type PenKind, type Pt,
  isClosedStroke, closedLoop, regionHoles, textRuns, lineWidth, SUB_SCALE, runFont,
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
    fill: e.fill === 'transparent' || e.fillStyle === 'glass' ? undefined : e.fill,
    fillStyle: e.fillStyle === 'glass' ? 'solid' : e.fillStyle,
    fillWeight: sw / 2,
    hachureGap: sw * 4,
    strokeLineDash: e.strokeStyle !== 'solid' && e.dash ? e.dash : e.strokeStyle === 'dashed' ? [8, 8 + sw] : e.strokeStyle === 'dotted' ? [1.5, 6 + sw] : undefined,
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
      const path = new Path2D(svgPathFromStroke(outline))
      if (e.pen === 'chalk' && outline.length > 2) {
        const step = Math.max(1, Math.floor(outline.length / 180))
        const spread = Math.max(1.2, e.strokeWidth * 0.9)
        let s = (e.seed || 1) >>> 0
        const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
        for (let i = 0; i < outline.length; i += step) {
          if (rnd() < 0.35) continue
          const [ox, oy] = outline[i]
          const dx = (rnd() - 0.5) * spread * 2
          const dy = (rnd() - 0.5) * spread * 2
          const sz = 1 + rnd() * 1.4
          path.rect(ox + dx, oy + dy, sz, sz)
        }
      }
      d = path
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
  fountain: { thin: 0.6, size: 2.6, taper: 7, smooth: 0.5 },
  ball: { thin: 0.4, size: 2.2, taper: 3, smooth: 0.5 },
  brush: { thin: 0.7, size: 4.4, taper: 11, smooth: 0.55 },
  pencil: { thin: 0.25, size: 2.4, taper: 2, smooth: 0.5 },
  marker: { thin: 0.12, size: 2.8, taper: 0, smooth: 0.5 },
  chalk: { thin: 0.08, size: 2.8, taper: 0.5, smooth: 0.45 },
  highlight: { thin: 0, size: 2.6, taper: 0, smooth: 0.5 },
}

const easeOutSine = (t: number) => Math.sin((t * Math.PI) / 2)

function pathLength(pts: number[][]) {
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return len
}

/** đường viền nét bút; pts = [x, y, lực nhấn]. Dùng cho cả bảng vẽ lẫn ô xem trước kiểu bút */
export function penOutline(pts: number[][], o: { pen: PenKind; width: number; sharp?: number; sens?: number; real: boolean }) {
  const t = PEN_TRAITS[o.pen]
  // bút thật: đa số bảng vẽ báo lực rất nhỏ khi đặt bút nhẹ → nét mảnh tới mức phải nhấn mạnh mới thấy.
  // Nâng đường cong lực: chạm nhẹ đã ra nét rõ, nhấn mạnh vẫn dày hơn.
  if (o.real) pts = pts.map(([x, y, p]) => [x, y, 0.35 + 0.65 * Math.sqrt(Math.max(0, Math.min(1, p ?? 0.5)))])
  const sens = o.sens ?? 0.5, sharp = o.sharp ?? 0.5
  // bút máy, bút lông: tự tính độ dày từng điểm thay cho giả lập lực của perfect-freehand
  // (giả lập đó chỉ theo tốc độ, ra nét gần như đều → trông như bút bi)
  const shaped = o.pen === 'fountain' || o.pen === 'brush'
  if (shaped && pts.length > 2) pts = o.pen === 'fountain' ? nibPressure(pts, o.real) : brushPressure(pts, o.real, sens)
  const size = o.width * t.size
  // độ đổi dày theo lực nhấn vừa phải (Excalidraw: 0,6) — quá mạnh thì mép nét lồi lõm, trông lem
  // bút máy / bút lông đã tự tính độ dày mượt → cho đổi dày mạnh hơn mới ra dáng nét thanh nét đậm
  const thinning = shaped ? (o.pen === 'fountain' ? 0.9 : 0.75 + 0.15 * sens) : o.pen === 'highlight' ? 0 : Math.max(-0.85, Math.min(0.85, t.thin * (0.4 + 1.2 * sens)))
  // vuốt nhọn không dài quá nét: nét ngắn / chấm bút không bị vuốt mất
  // (vuốt nhọn dù chỉ 0,0001px cũng làm perfect-freehand bỏ mất chấm, nên dưới 1px thì tắt hẳn)
  const tp = t.taper ? Math.min(sharp * size * t.taper, pathLength(pts) * 0.35) : 0
  const taper = tp < 1 ? 0 : tp
  const cap = o.pen !== 'highlight'
  return getStroke(pts, {
    size,
    thinning,
    smoothing: t.smooth,
    easing: easeOutSine,
    streamline: 0.5,
    simulatePressure: !o.real && !shaped && thinning > 0,
    start: { cap, taper },
    end: { cap, taper },
    last: true,
  })
}

/** hướng nét tại từng điểm (rad), lấy theo đoạn dài ~6px để không rung theo từng pixel */
function directions(pts: number[][]): number[] {
  const n = pts.length, out: number[] = new Array(n)
  for (let i = 0; i < n; i++) {
    let a = i, b = i
    while (a > 0 && Math.hypot(pts[i][0] - pts[a][0], pts[i][1] - pts[a][1]) < 3) a--
    while (b < n - 1 && Math.hypot(pts[b][0] - pts[i][0], pts[b][1] - pts[i][1]) < 3) b++
    out[i] = Math.atan2(pts[b][1] - pts[a][1], pts[b][0] - pts[a][0])
  }
  return out
}
/** làm mượt dãy số (trung bình trượt hai chiều) */
function smoothArr(v: number[], k: number) {
  let a = v.slice()
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < a.length; i++) a[i] = a[i - 1] + (a[i] - a[i - 1]) * k
    for (let i = a.length - 2; i >= 0; i--) a[i] = a[i + 1] + (a[i] - a[i + 1]) * k
  }
  return a
}
/** bút máy: ngòi dẹt nghiêng 45° — nét đi dọc ngòi thì mảnh, đi ngang ngòi thì đậm (nét sổ xuống đậm, nét hất lên mảnh) */
function nibPressure(pts: number[][], real: boolean): number[][] {
  const NIB = -Math.PI / 4
  const dir = directions(pts)
  const w = smoothArr(dir.map((a) => 0.04 + 0.96 * Math.abs(Math.sin(a - NIB)) ** 1.3), 0.5)
  return pts.map(([x, y, p], i) => [x, y, real ? w[i] * (0.6 + 0.4 * (p ?? 0.5)) : w[i]])
}
/** bút lông: đi chậm thì loe đậm, đi nhanh thì vuốt mảnh; bút thật thì theo lực nhấn là chính */
function brushPressure(pts: number[][], real: boolean, sens: number): number[][] {
  if (real) return pts
  const n = pts.length
  const sp = new Array(n).fill(0)
  for (let i = 1; i < n; i++) sp[i] = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  sp[0] = sp[1]
  const s = smoothArr(sp, 0.25)
  const k = 4 + 6 * (1 - sens)
  return pts.map(([x, y], i) => [x, y, Math.max(0.12, Math.min(1, 1.05 - s[i] / k))])
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

/** bút phấn: mẫu hạt thưa và to hơn bút chì để tạo lỗ hổng lấm tấm như phấn trên bảng */
const chalkGrain = new Map<string, CanvasPattern | null>()
function chalkFill(ctx: CanvasRenderingContext2D, color: string) {
  if (chalkGrain.has(color)) return chalkGrain.get(color)!
  const S = 64
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = color
  let s = 2463534242
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296 }
  for (let i = 0; i < S * S * 0.48; i++) {
    g.globalAlpha = 0.35 + rnd() * 0.65
    const w = rnd() < 0.35 ? 2 : 1.5
    const h = rnd() < 0.3 ? 2 : 1.5
    g.fillRect(Math.floor(rnd() * S), Math.floor(rnd() * S), w, h)
  }
  const pat = ctx.createPattern(c, 'repeat')
  chalkGrain.set(color, pat)
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

function rgba(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/** nền kính: lớp màu trong suốt + vệt sáng chéo từ góc trên trái + viền sáng mảnh phía trong */
/** vùng tô được của hình (toạ độ trong hình, trước khi xoay); null nếu hình không tô được */
export function fillPath(e: El): Path2D | null {
  const p = new Path2D()
  if (e.kind === 'line') {
    const lp = closedLoop(e)
    if (!lp) return null
    lp.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
    p.closePath()
  } else if (e.kind === 'freedraw') {
    const lp = closedLoop(e)
    if (!lp) return null
    if (e.region) {
      for (const ring of [lp, ...regionHoles(e)]) {
        ring.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)))
        p.closePath()
      }
    } else {
      // nét bút được làm mượt nên bo góc → vùng tô cũng bo: chia lại viền thành điểm cách đều ~4px
      // rồi lấy trung bình trượt (±3 điểm ≈ 12px) dọc viền, để màu không lòi ra ngoài nét ở góc
      const STEP = 4
      const even: Pt[] = [lp[0]]
      let carry = 0
      for (let i = 1; i <= lp.length; i++) {
        const a = lp[i - 1], b = lp[i % lp.length]
        const seg = Math.hypot(b[0] - a[0], b[1] - a[1])
        let t = STEP - carry
        while (t <= seg) { even.push([a[0] + ((b[0] - a[0]) * t) / seg, a[1] + ((b[1] - a[1]) * t) / seg]); t += STEP }
        carry = seg - (t - STEP)
      }
      const R = even.length > 12 ? 3 : 0
      const ring: Pt[] = even.map((_, i) => {
        let x = 0, y = 0
        for (let k = -R; k <= R; k++) { const q = even[(i + k + even.length) % even.length]; x += q[0]; y += q[1] }
        return [x / (2 * R + 1), y / (2 * R + 1)]
      })
      const lpS = ring
      const n = lpS.length
      const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      const m0 = mid(lpS[n - 1], lpS[0])
      p.moveTo(m0[0], m0[1])
      for (let i = 0; i < n; i++) {
        const c = lpS[i], m = mid(c, lpS[(i + 1) % n])
        p.quadraticCurveTo(c[0], c[1], m[0], m[1])
      }
      p.closePath()
    }
  } else if (e.kind === 'rectangle') p.rect(0, 0, e.w, e.h)
  else if (e.kind === 'ellipse') p.ellipse(e.w / 2, e.h / 2, Math.abs(e.w / 2), Math.abs(e.h / 2), 0, 0, Math.PI * 2)
  else if (e.kind === 'diamond') {
    p.moveTo(e.w / 2, 0); p.lineTo(e.w, e.h / 2); p.lineTo(e.w / 2, e.h); p.lineTo(0, e.h / 2); p.closePath()
  } else return null
  return p
}

/** mảng màu có lỗ tô theo quy tắc chẵn–lẻ để lỗ được chừa trống */
export const fillRule = (e: El): CanvasFillRule => (e.holes?.length ? 'evenodd' : 'nonzero')

function drawGlass(ctx: CanvasRenderingContext2D, e: El) {
  const p = fillPath(e)
  if (!p) return
  ctx.save()
  ctx.fillStyle = rgba(e.fill, 0.42)
  ctx.fill(p, fillRule(e))
  ctx.clip(p, fillRule(e))
  const g = ctx.createLinearGradient(0, 0, e.w * 0.7, e.h * 0.9)
  g.addColorStop(0, 'rgba(255,255,255,0.65)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.12)')
  g.addColorStop(0.36, 'rgba(255,255,255,0)')
  g.addColorStop(1, rgba(e.fill, 0.25))
  ctx.fillStyle = g
  ctx.fill(p, fillRule(e))
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 3
  ctx.stroke(p)
  ctx.restore()
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
    // trang PDF: tờ giấy trắng có bóng đổ nổi trên nền xám (như trình đọc PDF)
    if (e.page) {
      // bóng giả bằng vài lớp viền mờ (không dùng shadowBlur: trên điện thoại Android
      // vùng bóng lớn làm hỏng canvas, cả bảng thành màu đen)
      for (let i = 1; i <= 4; i++) {
        ctx.fillStyle = `rgba(0, 0, 0, ${0.05 - i * 0.01})`
        ctx.fillRect(-i, -i + 2, e.w + 2 * i, e.h + 2 * i)
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, e.w, e.h)
    }
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, e.w, e.h)
    else {
      ctx.fillStyle = '#f1efec'
      ctx.fillRect(0, 0, e.w, e.h)
    }
  } else if (e.kind === 'text') {
    ctx.fillStyle = e.stroke
    ctx.textBaseline = 'top'
    const lh = e.fontSize * LINE_HEIGHT
    ;(e.text ?? '').split('\n').forEach((line, i) => {
      const y = i * lh + (lh - e.fontSize) / 2
      let x = e.align && e.align !== 'left' ? (e.w - lineWidth(line, e.fontSize, e)) * (e.align === 'center' ? 0.5 : 1) : 0
      for (const r of textRuns(line)) {
        const fs = r.lv ? e.fontSize * SUB_SCALE : e.fontSize
        ctx.font = fontOf(fs, runFont(r, e))
        // chỉ số trên nâng lên, dưới hạ xuống so với dòng chữ thường
        ctx.fillText(r.t, x, y + (r.lv === 1 ? -e.fontSize * 0.12 : r.lv === -1 ? e.fontSize * 0.45 : 0))
        x += ctx.measureText(r.t).width
      }
    })
  } else {
    if (e.fill !== 'transparent' && isClosedStroke(e)) {
      // nét vẽ tay khép kín: tô nền trước rồi mới vẽ nét lên trên
      if (e.fillStyle === 'glass') drawGlass(ctx, e)
      else if (e.fillStyle === 'solid') {
        ctx.fillStyle = e.fill
        ctx.fill(fillPath(e)!, fillRule(e))
      } else {
        // gạch chéo: rough không biết lỗ → cắt theo vùng (chừa lỗ) rồi gạch cả vòng ngoài
        ctx.save()
        ctx.clip(fillPath(e)!, fillRule(e))
        rc.polygon(closedLoop(e)!, { ...roughOptions(e), stroke: 'none', fill: e.fill, fillStyle: 'hachure' })
        ctx.restore()
      }
    }
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
    if (e.fillStyle === 'glass' && e.fill !== 'transparent') drawGlass(ctx, e)
    const s = shapeOf(e)
    if (s instanceof Path2D) {
      ctx.fillStyle = (e.pen === 'pencil' && pencilFill(ctx, e.stroke)) || (e.pen === 'chalk' && chalkFill(ctx, e.stroke)) || e.stroke
      if (e.pen === 'highlight') ctx.globalCompositeOperation = 'multiply'
      ctx.fill(s)
    } else for (const d of s) rc.draw(d)
  }
  ctx.restore()
}

export interface LaserTrail {
  pts: Pt[]
  ts: number[]
  /** màu (#rrggbb) và hệ số độ dày lúc vẽ vệt này */
  color?: string
  size?: number
}

/** '#rrggbb' → 'r, g, b' để ghép vào rgba() */
function rgbOf(hex = '#ff3b30') {
  const n = parseInt(hex.slice(1, 7), 16) || 0xff3b30
  return `${n >> 16}, ${(n >> 8) & 255}, ${n & 255}`
}

export type Guide =
  | { kind: 'align'; axis: 'x' | 'y'; pos: number; from: number; to: number; marks: Pt[] }
  | { kind: 'gap'; axis: 'x' | 'y'; pos: number; from: number; to: number; label: string }

export interface Overlay {
  selected: El[]
  marquee: Bounds | null
  hiddenId: string | null
  paper: Paper
  lasso: Pt[] | null
  laser: LaserTrail[]
  eraser: { p: Pt; r: number } | null
  /** đường gióng căn thẳng hàng / cách đều khi kéo hình */
  guides?: Guide[]
  /** thùng sơn / kéo màu: hình sẽ được tô khi bấm/thả — xem trước màu + viền nhấp nháy */
  fillHover?: { el: El; color: string } | null
  /** màu đang lan ra từ điểm bấm: vẽ bản cũ, rồi bản mới trong vòng tròn bán kính r */
  spread?: { id: string; prev: El; p: Pt; r: number } | null
}

export const LASER_LIFE = 1000

let chalkBoardTex: CanvasPattern | null | undefined
function boardTexture(ctx: CanvasRenderingContext2D) {
  if (chalkBoardTex !== undefined) return chalkBoardTex
  const S = 512
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  let s = 135792468
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  // vài vệt loang phấn mờ rất nhẹ (lặp qua biên ô để không lộ đường nối)
  for (let i = 0; i < 18; i++) {
    const x = rnd() * S, y = rnd() * S, r = 60 + rnd() * 120
    const a = 0.005 + rnd() * 0.007
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      if (x + ox + r < 0 || x + ox - r > S || y + oy + r < 0 || y + oy - r > S) continue
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
      gr.addColorStop(0, `rgba(255,255,255,${a})`)
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, S, S)
    }
  }
  // bụi phấn li ti cố định theo toạ độ cảnh
  g.fillStyle = '#ffffff'
  for (let i = 0; i < 900; i++) {
    g.globalAlpha = 0.02 + rnd() * 0.035
    const sz = rnd() < 0.25 ? 1.5 : 1
    g.fillRect(Math.floor(rnd() * S), Math.floor(rnd() * S), sz, sz)
  }
  chalkBoardTex = ctx.createPattern(c, 'repeat')
  return chalkBoardTex
}

/** nền giấy: kẻ ô / kẻ dòng / chấm / bảng đen / bảng xanh, vẽ theo toạ độ cảnh để cuộn và phóng to theo */
export function drawPaper(ctx: CanvasRenderingContext2D, paper: Paper, view: View, w: number, h: number) {
  if (paper === 'plain') return
  if (isDarkPaper(paper)) {
    const x0 = -view.scrollX, y0 = -view.scrollY
    const vw = w / view.zoom, vh = h / view.zoom
    ctx.save()
    ctx.fillStyle = paperBg(paper)
    ctx.fillRect(x0 - 1, y0 - 1, vw + 2, vh + 2)
    const tex = boardTexture(ctx)
    if (tex) {
      ctx.fillStyle = tex
      ctx.fillRect(x0 - 1, y0 - 1, vw + 2, vh + 2)
    }
    ctx.restore()
    return
  }
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

/** biểu tượng ổ khoá nhỏ ở góc khung chọn khi hình đang bị khoá */
function drawLockBadge(ctx: CanvasRenderingContext2D, x: number, y: number, zoom: number) {
  ctx.save()
  const s = 14 / zoom
  ctx.translate(x - s / 2, y - s / 2)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#78716c'
  ctx.lineWidth = 1.2 / zoom
  ctx.beginPath()
  ctx.roundRect(0, 0, s, s, 3 / zoom)
  ctx.fill()
  ctx.stroke()
  // thân ổ khoá + quai khoá
  const u = s / 14
  ctx.beginPath()
  ctx.rect(3.5 * u, 6.5 * u, 7 * u, 4.8 * u)
  ctx.fillStyle = '#78716c'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(7 * u, 6 * u, 2.2 * u, Math.PI, 0)
  ctx.stroke()
  ctx.restore()
}

export function render(
  canvas: HTMLCanvasElement,
  els: El[],
  view: View,
  overlay: Overlay,
) {
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  const dark = isDarkPaper(overlay.paper)
  const accent = dark ? '#f08c5c' : ACCENT
  // bảng ghi chú PDF: nền xám quanh các trang thay cho kiểu giấy
  const pdfMode = els.some((e) => e.page)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = pdfMode ? (dark ? '#1f2322' : '#e9e9ec') : paperBg(overlay.paper)
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const z = view.zoom * dpr
  ctx.setTransform(z, 0, 0, z, view.scrollX * z, view.scrollY * z)

  if (!pdfMode) drawPaper(ctx, overlay.paper, view, canvas.width / dpr, canvas.height / dpr)

  const rc = rough.canvas(canvas)
  const sp = overlay.spread
  for (const e of els) {
    if (e.id === overlay.hiddenId) continue
    if (sp && e.id === sp.id) {
      drawElement(ctx, rc, sp.prev)
      ctx.save()
      ctx.beginPath()
      ctx.arc(sp.p[0], sp.p[1], sp.r, 0, Math.PI * 2)
      ctx.clip()
      drawElement(ctx, rc, e)
      ctx.restore()
    } else drawElement(ctx, rc, e)
  }
  const fh = overlay.fillHover
  const fp = fh && fillPath(fh.el)
  if (fh && fp) {
    const e = fh.el
    ctx.save()
    const [cx, cy] = centerOf(e)
    ctx.translate(cx, cy)
    ctx.rotate(e.angle)
    ctx.translate(-cx, -cy)
    ctx.translate(e.x, e.y)
    ctx.fillStyle = fh.color === 'transparent' ? (dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)') : rgba(fh.color, 0.35)
    ctx.fill(fp, fillRule(e))
    ctx.strokeStyle = accent
    ctx.lineWidth = 2.5 / view.zoom
    ctx.setLineDash([6 / view.zoom, 4 / view.zoom])
    ctx.lineDashOffset = -(performance.now() / 40) % 1000 / view.zoom
    ctx.stroke(fp)
    ctx.restore()
  }

  // khung chọn
  const sel = overlay.selected
  const anyLocked = sel.some((e) => e.locked)
  ctx.lineWidth = 1 / view.zoom
  ctx.strokeStyle = anyLocked ? (dark ? '#a8a29e' : '#78716c') : accent
  // hình trong nhóm: chỉ khung chung của cả vùng chọn, không khung từng phần tử (nhóm công cụ có hàng chục nét)
  for (const e of sel) {
    if (isLinear(e) && sel.length === 1 && !anyLocked) continue
    if (e.groupId && sel.length > 1) continue
    ctx.save()
    if (e.angle) {
      const [cx, cy] = centerOf(e)
      ctx.translate(cx, cy)
      ctx.rotate(e.angle)
      ctx.translate(-cx, -cy)
    }
    const [x1, y1, x2, y2] = localBounds(e)
    const pad = 4 / view.zoom
    ctx.setLineDash(sel.length > 1 || anyLocked ? [4 / view.zoom, 4 / view.zoom] : [])
    ctx.strokeRect(x1 - pad, y1 - pad, x2 - x1 + pad * 2, y2 - y1 + pad * 2)
    ctx.restore()
  }
  ctx.setLineDash([])

  if (sel.length === 1) {
    const e = sel[0]
    if (anyLocked) {
      ctx.save()
      if (e.angle) {
        const [cx, cy] = centerOf(e)
        ctx.translate(cx, cy)
        ctx.rotate(e.angle)
        ctx.translate(-cx, -cy)
      }
      const [, y1, x2] = localBounds(e)
      const pad = 4 / view.zoom
      drawLockBadge(ctx, x2 + pad, y1 - pad, view.zoom)
      ctx.restore()
    } else if (isLinear(e)) {
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
    if (anyLocked) ctx.setLineDash([4 / view.zoom, 4 / view.zoom])
    ctx.strokeRect(b[0] - pad, b[1] - pad, b[2] - b[0] + pad * 2, b[3] - b[1] + pad * 2)
    ctx.setLineDash([])
    if (anyLocked) drawLockBadge(ctx, b[2] + pad, b[1] - pad, view.zoom)
    else for (const p of Object.values(handlePositions(b, view.zoom, false))) drawHandle(ctx, p as Pt, view.zoom)
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
  for (const tr of overlay.laser) {
    const rgb = rgbOf(tr.color), k = tr.size ?? 1
    ctx.shadowColor = `rgba(${rgb}, 0.85)`
    ctx.shadowBlur = 14 * k * dpr
    segs(tr, (a) => { ctx.strokeStyle = `rgba(${rgb}, ${0.55 * a})`; ctx.lineWidth = ((3 + 6 * a) * k) / lz })
    ctx.shadowBlur = 0
    // lõi sáng: màu laser pha trắng
    segs(tr, (a) => { ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * a})`; ctx.lineWidth = ((1 + 1.6 * a) * k) / lz })
  }
  for (const tr of overlay.laser) {
    const last = tr.pts[tr.pts.length - 1]
    if (!last || now - tr.ts[tr.ts.length - 1] > 120) continue
    const rgb = rgbOf(tr.color), r = (9 * (tr.size ?? 1)) / lz
    const g = ctx.createRadialGradient(last[0], last[1], 0, last[0], last[1], r)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, `rgba(${rgb},0.9)`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(last[0], last[1], r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  if (overlay.eraser) {
    const { p, r } = overlay.eraser
    ctx.save()
    ctx.beginPath()
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2)
    ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.5)'
    ctx.fill()
    ctx.strokeStyle = dark ? '#e7e5e4' : '#78716c'
    ctx.lineWidth = 1 / view.zoom
    ctx.stroke()
    ctx.restore()
  }

  if (overlay.marquee) {
    const [x1, y1, x2, y2] = overlay.marquee
    ctx.fillStyle = dark ? 'rgba(240, 140, 92, 0.14)' : 'rgba(180, 83, 42, 0.08)'
    ctx.strokeStyle = accent
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
  }

  if (overlay.guides?.length) {
    ctx.save()
    const z = view.zoom
    ctx.strokeStyle = '#ff3b30'
    ctx.fillStyle = '#ff3b30'
    ctx.lineWidth = 1 / z
    const mr = 3 / z
    const tick = 4 / z
    for (const g of overlay.guides) {
      ctx.beginPath()
      if (g.kind === 'align') {
        if (g.axis === 'x') { ctx.moveTo(g.pos, g.from); ctx.lineTo(g.pos, g.to) }
        else { ctx.moveTo(g.from, g.pos); ctx.lineTo(g.to, g.pos) }
        for (const [mx, my] of g.marks) {
          ctx.moveTo(mx - mr, my - mr); ctx.lineTo(mx + mr, my + mr)
          ctx.moveTo(mx - mr, my + mr); ctx.lineTo(mx + mr, my - mr)
        }
        ctx.stroke()
      } else {
        if (g.axis === 'x') {
          ctx.moveTo(g.from, g.pos); ctx.lineTo(g.to, g.pos)
          ctx.moveTo(g.from, g.pos - tick); ctx.lineTo(g.from, g.pos + tick)
          ctx.moveTo(g.to, g.pos - tick); ctx.lineTo(g.to, g.pos + tick)
        } else {
          ctx.moveTo(g.pos, g.from); ctx.lineTo(g.pos, g.to)
          ctx.moveTo(g.pos - tick, g.from); ctx.lineTo(g.pos + tick, g.from)
          ctx.moveTo(g.pos - tick, g.to); ctx.lineTo(g.pos + tick, g.to)
        }
        ctx.stroke()
        const mx = g.axis === 'x' ? (g.from + g.to) / 2 : g.pos
        const my = g.axis === 'x' ? g.pos : (g.from + g.to) / 2
        ctx.font = `500 ${10 / z}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const tw = ctx.measureText(g.label).width + 6 / z
        const th = 14 / z
        ctx.fillStyle = '#ff3b30'
        ctx.fillRect(mx - tw / 2, my - th / 2, tw, th)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(g.label, mx, my)
      }
    }
    ctx.restore()
  }
}

/**
 * Nét bút đang vẽ: vẽ riêng lên canvas trong suốt nằm trên (như NewElementCanvas của Excalidraw),
 * mỗi lần bút di chỉ vẽ lại đúng một nét thay vì cả bảng.
 */
export function renderLive(canvas: HTMLCanvasElement, e: El | null, view: View) {
  // không dùng { desynchronized: true }: trên Android canvas đó bị ghép như lớp đục (bỏ kênh alpha)
  // → lớp trong suốt này thành tấm đen che kín bảng
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!e) return
  const z = view.zoom * (window.devicePixelRatio || 1)
  ctx.setTransform(z, 0, 0, z, view.scrollX * z, view.scrollY * z)
  drawElement(ctx, rough.canvas(canvas), e)
}

export function dropFromCache(id: string) {
  cache.delete(id)
}
