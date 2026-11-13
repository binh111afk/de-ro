/**
 * Bảng vẽ — dựng hình của công cụ vẽ (SVG từ `renderTool`) thành phần tử gốc của bảng:
 * đường / mũi tên / hình tròn / chữ có chỉ số, gom thành một nhóm giữ ToolDoc để bấm đúp sửa lại.
 * Một bộ chuyển chung cho mọi công cụ (thay vì mỗi công cụ một hàm dựng): SVG của các công cụ
 * chỉ dùng path, line, rect, circle, text/tspan, marker, clipPath; phần nào không chuyển được
 * (vùng tô bằng pattern + mask như miền gạch của biểu đồ Ven) thì cắt riêng phần đó thành ảnh nhỏ.
 * Chạy trên trình duyệt: cần DOM để lấy ma trận biến đổi, độ dài đường cong và kiểu đã tính.
 */
import { DEFAULT_STYLE, measureText, newId, newSeed, type El, type Pt, type StrokeStyle } from './scene'

const SKIP = new Set(['defs', 'marker', 'pattern', 'clipPath', 'mask', 'desc', 'style', 'title', 'metadata'])
/** bước lấy mẫu đường cong (đơn vị SVG) */
const STEP = 2.5

export interface ImportOpts {
  /** bề ngang muốn đặt trên bảng; toạ độ SVG được nhân theo tỉ lệ này */
  width: number
  /** góc trên trái trên bảng */
  x: number
  y: number
  /** ToolDoc (JSON) — ghi vào phần tử đầu để bấm đúp sửa lại */
  tool?: string
}

export function svgToElements(svgText: string, o: ImportOpts): El[] {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const src = doc.documentElement as unknown as SVGSVGElement
  if (src.tagName !== 'svg') return []
  // gắn tạm vào trang (ẩn) để trình duyệt tính ma trận, độ dài path, kiểu kế thừa
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;pointer-events:none'
  const svg = document.importNode(src, true) as SVGSVGElement
  host.appendChild(svg)
  document.body.appendChild(host)
  try {
    return convert(svg, svgText, o)
  } finally {
    host.remove()
  }
}

function convert(svg: SVGSVGElement, svgText: string, o: ImportOpts): El[] {
  const vb = svg.viewBox.baseVal
  const vw = vb && vb.width ? vb.width : svg.width.baseVal.value
  const vh = vb && vb.height ? vb.height : svg.height.baseVal.value
  const vx = vb?.x ?? 0, vy = vb?.y ?? 0
  const k = o.width / vw
  const rootInv = svg.getScreenCTM()?.inverse()
  /** ma trận từ hệ toạ độ của phần tử sang toạ độ viewBox */
  const ctm = (el: SVGGraphicsElement) => {
    const m = el.getScreenCTM()
    return m && rootInv ? rootInv.multiply(m) : new DOMMatrix()
  }
  const toBoard = (m: DOMMatrix, x: number, y: number): Pt => {
    const p = new DOMPoint(x, y).matrixTransform(m)
    return [o.x + (p.x - vx) * k, o.y + (p.y - vy) * k]
  }
  const scaleOf = (m: DOMMatrix) => Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k

  const out: El[] = []
  const group = newId()
  const base = (): El => ({
    ...DEFAULT_STYLE, id: newId(), seed: newSeed(), kind: 'line', x: 0, y: 0, w: 0, h: 0, angle: 0, ver: 0,
    roughness: 0, groupId: group,
  })

  const walk = (node: Element) => {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName
      if (SKIP.has(tag)) continue
      if (tag === 'g' || tag === 'a') { walk(el); continue }
      const g = el as SVGGraphicsElement
      const cs = getComputedStyle(g)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      // phần tô bằng pattern / mask / clip không phải hình chữ nhật: cắt thành ảnh nhỏ
      if (needsImage(svg, g, cs)) { const im = imagePiece(g, svgText, vx, vy, vw, vh); if (im) out.push(finishImage(im)); continue }
      const m = ctm(g)
      const sw = parseFloat(cs.strokeWidth) || 1
      const stroke = paint(cs.stroke)
      const hatch = cs.fill.startsWith('url(') ? hatchOf(svg, cs.fill) : null
      const fill = hatch ?? paint(cs.fill)
      const style: Partial<El> = {
        stroke: stroke ?? 'transparent',
        fill: fill ?? 'transparent',
        fillStyle: hatch ? 'hachure' : 'solid',
        strokeWidth: stroke ? Math.max(0.5, sw * scaleOf(m)) : 1,
        strokeStyle: dashOf(cs.strokeDasharray, sw),
        dash: dashArr(cs.strokeDasharray, scaleOf(m)),
        opacity: Math.round(100 * (parseFloat(cs.opacity) || 1)),
      }
      if (!stroke && !fill && tag !== 'text') continue
      const clip = clipRect(g, ctm, toBoard)
      if (tag === 'text') { out.push(...textEls(g as SVGTextElement, cs, m)); continue }
      if (tag === 'rect') {
        const r = g as SVGRectElement
        const x = r.x.baseVal.value, y = r.y.baseVal.value, w = r.width.baseVal.value, h = r.height.baseVal.value
        // nền trắng phủ cả hình: bỏ
        if (!stroke && fill && /^#?f{3,6}$|white|rgb\(255, 255, 255\)/i.test(fill) && w >= vw * 0.95 && h >= vh * 0.95) continue
        poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]].map(([a, b]) => toBoard(m, a, b)), style, null)
        continue
      }
      if (tag === 'circle' || tag === 'ellipse') {
        const c = g as SVGCircleElement & SVGEllipseElement
        const cx = c.cx.baseVal.value, cy = c.cy.baseVal.value
        const rx = tag === 'circle' ? c.r.baseVal.value : c.rx.baseVal.value
        const ry = tag === 'circle' ? c.r.baseVal.value : c.ry.baseVal.value
        if (!m.b && !m.c && !clip) {
          const [x1, y1] = toBoard(m, cx - rx, cy - ry), [x2, y2] = toBoard(m, cx + rx, cy + ry)
          out.push({ ...base(), ...style, kind: 'ellipse', x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) })
        } else {
          const n = 48
          const pts = Array.from({ length: n + 1 }, (_, i) => toBoard(m, cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)))
          poly(pts, style, clip)
        }
        continue
      }
      // các đoạn (toạ độ của phần tử) của line / polyline / path
      let subs: { pts: Pt[]; closed: boolean; straight: boolean }[] = []
      if (tag === 'line') {
        const l = g as SVGLineElement
        subs = [{ pts: [[l.x1.baseVal.value, l.y1.baseVal.value], [l.x2.baseVal.value, l.y2.baseVal.value]], closed: false, straight: true }]
      } else if (tag === 'polyline' || tag === 'polygon') {
        const pts = Array.from((g as SVGPolylineElement).points).map((p) => [p.x, p.y] as Pt)
        if (tag === 'polygon' && pts.length) pts.push(pts[0])
        subs = [{ pts, closed: tag === 'polygon', straight: true }]
      } else if (tag === 'path') subs = pathPoints(g as SVGPathElement)
      else continue
      subs.forEach((s) => {
        const pts = s.pts.map(([a, b]) => toBoard(m, a, b))
        // tô màu đường hở (miền dưới đồ thị…): một hình chỉ có nền, khép kín; nét vẽ riêng
        if (fill && !s.closed && pts.length > 2) {
          poly([...pts, pts[0]], { ...style, stroke: 'transparent' }, clip)
          if (stroke) poly(pts, { ...style, fill: 'transparent' }, clip)
        } else poly(pts, s.closed ? style : { ...style, fill: 'transparent' }, clip)
      })
      // đầu mũi tên: dựng đúng hình marker của SVG (tam giác tô đặc…) tại đầu / cuối / đỉnh giữa
      const mk = (v: string) => (v && v !== 'none' ? markerOf(svg, v) : null)
      const mStart = mk(cs.markerStart), mMid = mk(cs.markerMid), mEnd = mk(cs.markerEnd)
      const live = subs.filter((s) => s.pts.length > 1)
      const first = live[0], last = live[live.length - 1]
      const ang = (a: Pt, b: Pt) => Math.atan2(b[1] - a[1], b[0] - a[0])
      if (mStart && first) placeMarker(mStart, first.pts[0], ang(first.pts[0], first.pts[1]), true, sw, m, stroke)
      if (mEnd && last) { const p = last.pts, n = p.length; placeMarker(mEnd, p[n - 1], ang(p[n - 2], p[n - 1]), false, sw, m, stroke) }
      if (mMid) for (const s of live) {
        if (!s.straight) continue
        for (let i = 1; i < s.pts.length - 1; i++) {
          const a = ang(s.pts[i - 1], s.pts[i]), b = ang(s.pts[i], s.pts[i + 1])
          placeMarker(mMid, s.pts[i], Math.atan2(Math.sin(a) + Math.sin(b), Math.cos(a) + Math.cos(b)), false, sw, m, stroke)
        }
      }
    }
  }

  /** vẽ một marker tại điểm p (toạ độ phần tử), hướng theo góc a */
  const placeMarker = (mk: Marker, p: Pt, a: number, atStart: boolean, sw: number, m: DOMMatrix, stroke: string | null) => {
    const rot = mk.orient === 'auto-start-reverse' && atStart ? a + Math.PI : mk.orient === 'auto' || mk.orient === 'auto-start-reverse' ? a : (parseFloat(mk.orient) || 0) * Math.PI / 180
    const u = mk.userSpace ? 1 : sw
    const cos = Math.cos(rot), sin = Math.sin(rot)
    const map = ([x, y]: Pt): Pt => {
      const dx = (x - mk.refX) * mk.sx * u, dy = (y - mk.refY) * mk.sy * u
      return toBoard(m, p[0] + dx * cos - dy * sin, p[1] + dx * sin + dy * cos)
    }
    for (const sh of mk.shapes) {
      const fillC = sh.fill === 'context-stroke' ? stroke : sh.fill
      const strokeC = sh.stroke === 'context-stroke' ? stroke : sh.stroke
      if (!fillC && !strokeC) continue
      poly(sh.pts.map(map), {
        fill: fillC ?? 'transparent', stroke: strokeC ?? 'transparent', fillStyle: 'solid',
        strokeWidth: strokeC ? Math.max(0.5, sh.sw * mk.sx * u * scaleOf(m)) : 1, strokeStyle: 'solid',
      }, null)
    }
  }

  /** đường nhiều điểm (đã ở toạ độ bảng); cắt theo khung clip nếu có */
  const poly = (pts: Pt[], style: Partial<El>, clip: [number, number, number, number] | null) => {
    if (pts.length < 2) return
    const closed = pts.length > 3 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.01
    const runs = clip && !closed ? clipPolyline(pts, clip) : [pts]
    for (const run of runs) {
      if (run.length < 2) continue
      if (closed) run[run.length - 1] = [run[0][0], run[0][1]]
      const xs = run.map((p) => p[0]), ys = run.map((p) => p[1])
      const x = Math.min(...xs), y = Math.min(...ys)
      out.push({
        ...base(), ...style, kind: 'line', x, y,
        w: Math.max(...xs) - x, h: Math.max(...ys) - y,
        points: run.map(([a, b]) => [a - x, b - y] as Pt),
      })
    }
  }

  const textEls = (t: SVGTextElement, cs: CSSStyleDeclaration, m: DOMMatrix): El[] => {
    const fs0 = parseFloat(cs.fontSize) || 16
    const sc = scaleOf(m)
    const fontSize = fs0 * sc
    const text = textMarkup(t, fs0)
    if (!text.trim()) return []
    const anchor = cs.textAnchor
    const align = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left'
    const serif = /serif/i.test(cs.fontFamily) && !/sans-serif/i.test(cs.fontFamily)
    const italic = cs.fontStyle === 'italic' || lettersItalic(t)
    const font = serif ? 'serif' : undefined
    const bold = (parseInt(cs.fontWeight) || 400) >= 600
    const { w, h } = measureText(text, fontSize, { font, italic, bold })
    const x0 = t.x.baseVal.numberOfItems ? t.x.baseVal.getItem(0).value : 0
    const y0 = t.y.baseVal.numberOfItems ? t.y.baseVal.getItem(0).value : 0
    // điểm neo (đường chân chữ) trên bảng; góc xoay lấy từ ma trận
    const [ax, ay] = toBoard(m, x0, y0)
    const angle = Math.atan2(m.b, m.a)
    const k2 = align === 'center' ? 0.5 : align === 'right' ? 1 : 0
    // khung chữ của bảng: mép trên cách chân chữ ≈ 1 cỡ chữ (xem drawElement: textBaseline top + lề 0,125)
    let x = ax - w * k2, y = ay - fontSize
    if (angle) {
      // xoay quanh tâm khung: dời tâm về đúng chỗ sau khi xoay quanh điểm neo
      const cx = w * (0.5 - k2), cy = h / 2 - fontSize
      const rx = cx * Math.cos(angle) - cy * Math.sin(angle), ry = cx * Math.sin(angle) + cy * Math.cos(angle)
      x = ax + rx - w / 2; y = ay + ry - h / 2
    }
    return [{
      ...base(), kind: 'text', x, y, w, h, angle, text, fontSize, align: align === 'left' ? undefined : align,
      font, italic: italic || undefined, bold: bold || undefined, stroke: paint(cs.fill) ?? '#111', fill: 'transparent', strokeWidth: 1,
    }]
  }

  const finishImage = (im: { src: string; x: number; y: number; w: number; h: number }): El => ({
    ...base(), kind: 'image', src: im.src,
    x: o.x + (im.x - vx) * k, y: o.y + (im.y - vy) * k, w: im.w * k, h: im.h * k,
  })

  walk(svg)
  if (out.length && o.tool) out[0].tool = o.tool
  return out
}

interface Marker {
  refX: number; refY: number; sx: number; sy: number; orient: string; userSpace: boolean
  shapes: { pts: Pt[]; fill: string | null; stroke: string | null; sw: number }[]
}
const markerCache = new WeakMap<Element, Marker | null>()
/** đọc marker theo url(#id): khung, điểm neo, các hình bên trong (toạ độ của marker) */
function markerOf(svg: SVGSVGElement, ref: string): Marker | null {
  const id = /url\(["']?#([^"')]+)/.exec(ref)?.[1]
  const el = id ? svg.querySelector(`#${CSS.escape(id)}`) : null
  if (!el || el.tagName !== 'marker') return null
  if (markerCache.has(el)) return markerCache.get(el)!
  const mk = el as SVGMarkerElement
  const mw = mk.markerWidth.baseVal.value || 3, mh = mk.markerHeight.baseVal.value || 3
  const vb = mk.viewBox.baseVal
  const s = vb && vb.width && vb.height ? Math.min(mw / vb.width, mh / vb.height) : 1
  const shapes: Marker['shapes'] = []
  for (const c of Array.from(mk.children)) {
    const cs = getComputedStyle(c)
    const raw = (v: string, attr: string | null) => (attr === 'context-stroke' ? 'context-stroke' : paint(v))
    const sh = { fill: raw(cs.fill, c.getAttribute('fill')), stroke: raw(cs.stroke, c.getAttribute('stroke')), sw: parseFloat(cs.strokeWidth) || 1 }
    if (c.tagName === 'path') for (const sp of pathPoints(c as SVGPathElement)) shapes.push({ ...sh, pts: sp.pts })
    else if (c.tagName === 'polygon' || c.tagName === 'polyline') {
      const pts = Array.from((c as SVGPolygonElement).points).map((p) => [p.x, p.y] as Pt)
      if (c.tagName === 'polygon' && pts.length) pts.push(pts[0])
      shapes.push({ ...sh, pts })
    } else if (c.tagName === 'circle') {
      const ci = c as SVGCircleElement
      const cx = ci.cx.baseVal.value, cy = ci.cy.baseVal.value, r = ci.r.baseVal.value
      shapes.push({ ...sh, pts: Array.from({ length: 25 }, (_, i) => [cx + r * Math.cos((i / 24) * 2 * Math.PI), cy + r * Math.sin((i / 24) * 2 * Math.PI)] as Pt) })
    }
  }
  const v: Marker = {
    refX: mk.refX.baseVal.value, refY: mk.refY.baseVal.value, sx: s, sy: s,
    orient: el.getAttribute('orient') ?? '0', userSpace: el.getAttribute('markerUnits') === 'userSpaceOnUse', shapes,
  }
  markerCache.set(el, v)
  return v
}

/** pattern chỉ gồm nét thẳng (gạch chéo) → màu nét, để tô bằng kiểu gạch của bảng; khác thì null */
function hatchOf(svg: SVGSVGElement, ref: string): string | null {
  const id = /url\(["']?#([^"')]+)/.exec(ref)?.[1]
  const el = id ? svg.querySelector(`#${CSS.escape(id)}`) : null
  if (!el || el.tagName !== 'pattern' || !el.children.length) return null
  // bỏ nền (hình chữ nhật) của pattern; còn lại phải toàn nét thẳng
  const kids = Array.from(el.children).filter((k) => k.tagName !== 'rect')
  if (!kids.length || !kids.every((k) => k.tagName === 'line' || k.tagName === 'path')) return null
  return paint(getComputedStyle(kids[0]).stroke) ?? null
}

/** màu nét / nền; null = không vẽ */
function paint(v: string): string | null {
  if (!v || v === 'none' || v.startsWith('url(')) return null
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(v)
  if (m) {
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null
    return '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('')
  }
  return v
}

/** mẫu nét đứt của SVG (đơn vị SVG) → đơn vị bảng */
function dashArr(v: string, k: number): number[] | undefined {
  if (!v || v === 'none') return undefined
  const a = v.split(/[\s,]+/).map(parseFloat).filter((n) => Number.isFinite(n) && n >= 0)
  if (!a.length || a.every((n) => !n)) return undefined
  return (a.length % 2 ? [...a, ...a] : a).map((n) => Math.max(0.5, n * k))
}

function dashOf(v: string, sw: number): StrokeStyle {
  if (!v || v === 'none') return 'solid'
  const first = parseFloat(v)
  return first <= sw * 1.6 ? 'dotted' : 'dashed'
}

/** phần tử phải cắt thành ảnh: nền pattern, có mask, hoặc clip không phải hình chữ nhật */
function needsImage(svg: SVGSVGElement, g: SVGGraphicsElement, cs: CSSStyleDeclaration) {
  if ((cs.fill.startsWith('url(') && !hatchOf(svg, cs.fill)) || cs.stroke.startsWith('url(')) return true
  for (let e: Element | null = g; e && e.tagName !== 'svg'; e = e.parentElement) {
    if (e.getAttribute('mask')) return true
    const cp = e.getAttribute('clip-path')
    if (cp && !clipRectOf(e)) return true
  }
  return false
}

/** clipPath chỉ gồm một hình chữ nhật → [x, y, w, h] (toạ độ của phần tử dùng clip) */
function clipRectOf(e: Element): [number, number, number, number] | null {
  const id = /url\(["']?#([^"')]+)/.exec(e.getAttribute('clip-path') ?? '')?.[1]
  const cp = id ? e.ownerDocument.getElementById(id) : null
  if (!cp || cp.children.length !== 1 || cp.children[0].tagName !== 'rect') return null
  const r = cp.children[0] as SVGRectElement
  return [r.x.baseVal.value, r.y.baseVal.value, r.width.baseVal.value, r.height.baseVal.value]
}

/** khung cắt (toạ độ bảng) của phần tử: clip hình chữ nhật trên chính nó hoặc nhóm cha */
function clipRect(
  g: SVGGraphicsElement,
  ctm: (el: SVGGraphicsElement) => DOMMatrix,
  toBoard: (m: DOMMatrix, x: number, y: number) => Pt,
): [number, number, number, number] | null {
  for (let e: Element | null = g; e && e.tagName !== 'svg'; e = e?.parentElement ?? null) {
    const r = clipRectOf(e)
    if (!r) continue
    const m = ctm(e as SVGGraphicsElement)
    const a = toBoard(m, r[0], r[1]), b = toBoard(m, r[0] + r[2], r[1] + r[3])
    return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]
  }
  return null
}

/** cắt đường nhiều điểm theo khung: trả các đoạn liền nằm trong khung (Liang–Barsky từng đoạn) */
function clipPolyline(pts: Pt[], [x1, y1, x2, y2]: [number, number, number, number]): Pt[][] {
  const runs: Pt[][] = []
  let cur: Pt[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
    const dx = bx - ax, dy = by - ay
    let t0 = 0, t1 = 1, ok = true
    for (const [p, q] of [[-dx, ax - x1], [dx, x2 - ax], [-dy, ay - y1], [dy, y2 - ay]]) {
      if (p === 0) { if (q < 0) { ok = false; break } continue }
      const r = q / p
      if (p < 0) { if (r > t1) { ok = false; break } if (r > t0) t0 = r }
      else { if (r < t0) { ok = false; break } if (r < t1) t1 = r }
    }
    if (!ok) { if (cur.length) runs.push(cur); cur = []; continue }
    const a: Pt = [ax + dx * t0, ay + dy * t0], b: Pt = [ax + dx * t1, ay + dy * t1]
    if (!cur.length) cur.push(a)
    cur.push(b)
    if (t1 < 1) { runs.push(cur); cur = [] }
  }
  if (cur.length) runs.push(cur)
  return runs
}

/** các đoạn con của path → điểm (toạ độ của path). Đoạn chỉ gồm thẳng thì lấy đúng đỉnh, có cong thì lấy mẫu */
function pathPoints(p: SVGPathElement): { pts: Pt[]; closed: boolean; straight: boolean }[] {
  const d = p.getAttribute('d') ?? ''
  const cmds = [...d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)].map((m) => ({
    c: m[1],
    n: (m[2].match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []).map(Number),
  }))
  // tách đoạn con theo M/m; theo dõi điểm hiện tại để đoạn con có cong dựng lại thành path tuyệt đối riêng
  const out: { pts: Pt[]; closed: boolean; straight: boolean }[] = []
  let cx = 0, cy = 0
  let sub: { start: Pt; pts: Pt[]; curved: string; bent: boolean; closed: boolean } | null = null
  const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  p.parentNode!.appendChild(tmp)
  const flush = () => {
    if (!sub) return
    let pts = sub.pts
    if (sub.bent) {
      // có lệnh cong: lấy mẫu đều theo độ dài trên path riêng của đoạn con (bắt đầu bằng M tuyệt đối)
      tmp.setAttribute('d', `M${sub.start[0]} ${sub.start[1]}${sub.curved}`)
      const total = tmp.getTotalLength()
      const n = Math.max(2, Math.ceil(total / STEP))
      pts = []
      for (let i = 0; i <= n; i++) { const q = tmp.getPointAtLength((total * i) / n); pts.push([q.x, q.y]) }
    }
    if (sub.closed && pts.length > 2) pts.push([pts[0][0], pts[0][1]])
    pts = dedupe(pts)
    if (pts.length > 1) out.push({ pts, closed: sub.closed && pts.length > 3, straight: !sub.bent })
    sub = null
  }
  try {
    for (const { c, n } of cmds) {
      const rel = c === c.toLowerCase()
      const C = c.toUpperCase()
      if (C === 'M') {
        flush()
        for (let i = 0; i + 1 < n.length; i += 2) {
          cx = (rel ? cx : 0) + n[i]; cy = (rel ? cy : 0) + n[i + 1]
          if (!i) sub = { start: [cx, cy], pts: [[cx, cy]], curved: '', bent: false, closed: false }
          else { sub!.pts.push([cx, cy]); sub!.curved += ` L${cx} ${cy}` }
        }
        continue
      }
      if (!sub) sub = { start: [cx, cy], pts: [[cx, cy]], curved: '', bent: false, closed: false }
      const s = sub
      if (C === 'Z') {
        s.closed = true
        if (s.bent) s.curved += ' Z'
        ;[cx, cy] = s.start
        flush()
        continue
      }
      if (C === 'L' || C === 'H' || C === 'V') {
        const step = C === 'L' ? 2 : 1
        for (let i = 0; i + step - 1 < n.length; i += step) {
          if (C === 'L') { cx = (rel ? cx : 0) + n[i]; cy = (rel ? cy : 0) + n[i + 1] }
          else if (C === 'H') cx = (rel ? cx : 0) + n[i]
          else cy = (rel ? cy : 0) + n[i]
          s.pts.push([cx, cy])
          s.curved += ` L${cx} ${cy}`
        }
        continue
      }
      // lệnh cong: ghi nguyên văn (đổi sang tuyệt đối cho chắc) để trình duyệt tính
      const per = { C: 6, S: 4, Q: 4, T: 2, A: 7 }[C] ?? 2
      for (let i = 0; i + per - 1 < n.length; i += per) {
        const g = n.slice(i, i + per)
        if (rel) {
          if (C === 'A') { g[5] += cx; g[6] += cy }
          else for (let j = 0; j < per; j += 2) { g[j] += cx; g[j + 1] += cy }
        }
        s.bent = true
        s.curved += ` ${C}${g.join(' ')}`
        cx = g[per - 2]; cy = g[per - 1]
      }
    }
    flush()
  } finally {
    tmp.remove()
  }
  return out
}

function dedupe(pts: Pt[]): Pt[] {
  return pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1e-3)
}

/** mọi chữ cái (không tính chỉ số) đều nằm trong tspan nghiêng: V₁, p₁ = p₃, T (phút) không tính */
function lettersItalic(t: SVGTextElement): boolean {
  let it = 0, up = 0
  for (const n of Array.from(t.childNodes)) {
    const letters = (n.textContent ?? '').replace(/[^\p{L}]/gu, '').length
    if (!letters) continue
    const italic = n instanceof SVGTSpanElement && getComputedStyle(n).fontStyle === 'italic'
    if (italic) it += letters
    else up += letters
  }
  return it > 0 && up === 0
}

/** nội dung chữ → cú pháp chữ của bảng: tspan cỡ nhỏ lệch lên = ^{..}, lệch xuống = _{..}; ký tự _ ^ gốc được thoát */
function textMarkup(t: SVGTextElement, fs0: number): string {
  const esc = (s: string) => s.replace(/[_^]/g, (c) => '\\' + c)
  let out = '', off = 0
  for (const n of Array.from(t.childNodes)) {
    if (n.nodeType === 3) { out += esc(n.textContent ?? ''); continue }
    if (!(n instanceof SVGTSpanElement)) continue
    const dy = n.dy.baseVal.numberOfItems ? n.dy.baseVal.getItem(0).value : 0
    off += dy
    const bs = n.getAttribute('baseline-shift')
    const fs = parseFloat(getComputedStyle(n).fontSize) || fs0
    const s = esc(n.textContent ?? '')
    const small = fs < fs0 * 0.9
    if (bs === 'super' || (small && off < -0.5)) out += `^{${s}}`
    else if (bs === 'sub' || (small && off > 0.5)) out += `_{${s}}`
    else out += s
  }
  return out
}

/** cắt một phần tử thành ảnh SVG nhỏ, giữ nguyên defs (pattern, clip, mask) */
function imagePiece(g: SVGGraphicsElement, svgText: string, vx: number, vy: number, vw: number, vh: number) {
  let b: DOMRect
  try { b = g.getBBox() } catch { return null }
  if (!b.width && !b.height) return null
  // khung trong toạ độ viewBox (phần tử trong nhóm có biến đổi thì lấy cả hình cho chắc)
  const x = Math.max(vx, b.x - 2), y = Math.max(vy, b.y - 2)
  const w = Math.min(vx + vw, b.x + b.width + 2) - x, h = Math.min(vy + vh, b.y + b.height + 2) - y
  if (w <= 0 || h <= 0) return null
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = doc.documentElement
  // giữ phần tử này (cùng các nhóm cha) + defs/mask/clip; bỏ các hình khác
  const keepPath = new Set<Element>()
  const path: number[] = []
  for (let e: Element = g; e.tagName !== 'svg' && e.parentElement; e = e.parentElement) {
    path.unshift(Array.from(e.parentElement.children).indexOf(e))
  }
  let cur: Element = root
  keepPath.add(cur)
  for (const i of path) { cur = cur.children[i]; keepPath.add(cur) }
  const prune = (node: Element) => {
    for (const c of Array.from(node.children)) {
      if (SKIP.has(c.tagName)) continue
      if (!keepPath.has(c)) c.remove()
      else prune(c)
    }
  }
  prune(root)
  root.setAttribute('viewBox', `${x} ${y} ${w} ${h}`)
  root.setAttribute('width', String(w))
  root.setAttribute('height', String(h))
  const s = new XMLSerializer().serializeToString(root)
  return { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s), x, y, w, h }
}
