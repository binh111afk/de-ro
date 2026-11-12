/**
 * Hình học kiểu SGK, vẽ ra SVG nét đen:
 * - Phẳng: tam giác, tứ giác, đường tròn theo mẫu; tuỳ chọn đường cao, trung
 *   tuyến, đường chéo, đường tròn ngoại tiếp; kí hiệu góc vuông, cạnh bằng nhau.
 * - Không gian: hình biểu diễn theo phép chiếu song song (trục sâu xiên 45°,
 *   co 1/2), cạnh khuất nét đứt; hình vuông/chữ nhật thành hình bình hành,
 *   đường tròn thành elip — đúng quy ước SGK Toán 11.
 */

export type Geo2dShape =
  | 'triangle'
  | 'right-triangle'
  | 'isosceles'
  | 'equilateral'
  | 'square'
  | 'rectangle'
  | 'parallelogram'
  | 'trapezoid'
  | 'rhombus'
  | 'circle'
  | 'inscribed-triangle'
  | 'free'

export interface Geo2dSpec {
  shape: Geo2dShape
  /** tên đỉnh, theo thứ tự đỉnh của hình (đường tròn: tâm) */
  names: string[]
  altitude: boolean
  median: boolean
  diagonals: boolean
  circumcircle: boolean
  /** kí hiệu góc vuông, cạnh bằng nhau */
  marks: boolean
  /** dựng thêm (xem geoConstruct.ts), mỗi dòng một lệnh */
  extras?: string
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

export type Geo3dShape =
  | 'pyramid3'
  | 'pyramid3-sa'
  | 'pyramid3-regular'
  | 'pyramid4'
  | 'pyramid4-sa'
  | 'pyramid4-regular'
  | 'tetrahedron'
  | 'prism3'
  | 'box'
  | 'cube'
  | 'cone'
  | 'cylinder'
  | 'sphere'

export interface Geo3dSpec {
  shape: Geo3dShape
  names: string[]
  /** đường cao SO / SH (chóp), trục OO' (trụ, nón) */
  height: boolean
  /** đường chéo đáy AC, BD */
  diagonals: boolean
  /** kí hiệu góc vuông */
  marks: boolean
  /** tỉ lệ chiều cao, 0.6–1.6 */
  tall: number
  /** dựng thêm (xem geoConstruct.ts), mỗi dòng một lệnh */
  extras?: string
  /** vẽ mặt cầu ngoại tiếp khối (tâm = trọng tâm các đỉnh, đúng với hộp, lập phương, lăng trụ/chóp đều) */
  circumsphere?: boolean
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

import { construct as construct0, extractCoords, type Construction } from './geoConstruct'
import { richTextToSvg } from './table'

/** lỗi dựng thêm của lần vẽ gần nhất (modal hiện cho giáo viên) */
let lastErrors: Array<{ line: number; msg: string }> = []
/** điểm và đoạn đã vẽ (toạ độ viewBox) — để bấm/kéo trên ảnh xem trước */
export interface GeoPick {
  /** x, y: toạ độ viewBox; v: toạ độ thật (2D = x, y; 3D = toạ độ không gian) */
  points: Array<{ name: string; x: number; y: number; v: number[] }>
  segs: Array<{ a: string; b: string }>
  /** tam giác (tên 3 đỉnh) để menu bấm đỉnh: đường cao, trung tuyến, phân giác */
  tris: string[][]
  /** tên các điểm gốc (đỉnh mẫu, điểm theo toạ độ) — hiện nút chỉnh cạnh */
  origins?: string[]
}
let lastPick: GeoPick = { points: [], segs: [], tris: [] }
const isHidden = (n: string | undefined) => !!n && n.startsWith('#')
const FILL = '#000' // tô thiết diện: đen rất nhạt (in trắng đen vẫn thấy)
const construct: typeof construct0 = (t, k, o) => {
  const c = construct0(t, k, o)
  lastErrors = c.errors
  return c
}
type GeoImage = { svg: string; width: number; height: number; errors?: Array<{ line: number; msg: string }>; pick?: GeoPick }

type P2 = [number, number]
type P3 = [number, number, number]

export const GEO2D_SHAPES: Array<{ id: Geo2dShape; label: string; names: string[] }> = [
  { id: 'triangle', label: 'Tam giác', names: ['A', 'B', 'C'] },
  { id: 'right-triangle', label: 'Tam giác vuông tại A', names: ['A', 'B', 'C'] },
  { id: 'isosceles', label: 'Tam giác cân tại A', names: ['A', 'B', 'C'] },
  { id: 'equilateral', label: 'Tam giác đều', names: ['A', 'B', 'C'] },
  { id: 'square', label: 'Hình vuông', names: ['A', 'B', 'C', 'D'] },
  { id: 'rectangle', label: 'Hình chữ nhật', names: ['A', 'B', 'C', 'D'] },
  { id: 'parallelogram', label: 'Hình bình hành', names: ['A', 'B', 'C', 'D'] },
  { id: 'rhombus', label: 'Hình thoi', names: ['A', 'B', 'C', 'D'] },
  { id: 'trapezoid', label: 'Hình thang (AB ∥ CD)', names: ['A', 'B', 'C', 'D'] },
  { id: 'circle', label: 'Đường tròn tâm O', names: ['O', 'A'] },
  { id: 'inscribed-triangle', label: 'Tam giác nội tiếp đường tròn', names: ['A', 'B', 'C', 'O'] },
  { id: 'free', label: 'Tự do', names: [] },
]

export const GEO3D_SHAPES: Array<{ id: Geo3dShape; label: string; names: string[] }> = [
  { id: 'pyramid3', label: 'Hình chóp S.ABC', names: ['S', 'A', 'B', 'C', 'H'] },
  { id: 'pyramid3-sa', label: 'Chóp S.ABC, SA ⊥ (ABC)', names: ['S', 'A', 'B', 'C'] },
  { id: 'pyramid3-regular', label: 'Chóp tam giác đều S.ABC', names: ['S', 'A', 'B', 'C', 'O'] },
  { id: 'pyramid4', label: 'Chóp S.ABCD đáy hình bình hành', names: ['S', 'A', 'B', 'C', 'D', 'O'] },
  { id: 'pyramid4-sa', label: 'Chóp S.ABCD, SA ⊥ (ABCD)', names: ['S', 'A', 'B', 'C', 'D', 'O'] },
  { id: 'pyramid4-regular', label: 'Chóp tứ giác đều S.ABCD', names: ['S', 'A', 'B', 'C', 'D', 'O'] },
  { id: 'tetrahedron', label: 'Tứ diện ABCD', names: ['A', 'B', 'C', 'D'] },
  { id: 'prism3', label: "Lăng trụ đứng ABC.A'B'C'", names: ['A', 'B', 'C', "A'", "B'", "C'"] },
  { id: 'box', label: "Hình hộp chữ nhật ABCD.A'B'C'D'", names: ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"] },
  { id: 'cube', label: "Hình lập phương ABCD.A'B'C'D'", names: ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"] },
  { id: 'cone', label: 'Hình nón', names: ['S', 'O', 'A'] },
  { id: 'cylinder', label: 'Hình trụ', names: ['O', "O'", 'A'] },
  { id: 'sphere', label: 'Mặt cầu', names: ['O'] },
]

/* ------------------------------------------------------------------ *
 * Tiện ích vẽ
 * ------------------------------------------------------------------ */

const STROKE = '#222'
const FONT = `font-family="'Times New Roman',serif" font-size="19" font-style="italic"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]]
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]]
const mul = (a: P2, k: number): P2 => [a[0] * k, a[1] * k]
const len = (a: P2) => Math.hypot(a[0], a[1])
const unit = (a: P2): P2 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l]
}
const mid = (a: P2, b: P2): P2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const f1 = (n: number) => n.toFixed(1)

/** chân đường vuông góc từ p xuống đường ab */
function foot(p: P2, a: P2, b: P2): P2 {
  const ab = sub(b, a)
  const t = ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)
  return add(a, mul(ab, t))
}

/** khoảng cách từ p tới đoạn ab */
function distToSeg(p: P2, a: P2, b: P2): number {
  const ab = sub(b, a)
  const l2 = ab[0] ** 2 + ab[1] ** 2 || 1
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2))
  return len(sub(p, add(a, mul(ab, t))))
}

/** tâm đường tròn ngoại tiếp */
function circumcenter(a: P2, b: P2, c: P2): P2 {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]))
  const sq = (p: P2) => p[0] ** 2 + p[1] ** 2
  return [
    (sq(a) * (b[1] - c[1]) + sq(b) * (c[1] - a[1]) + sq(c) * (a[1] - b[1])) / d,
    (sq(a) * (c[0] - b[0]) + sq(b) * (a[0] - c[0]) + sq(c) * (b[0] - a[0])) / d,
  ]
}

/** kí hiệu góc vuông tại `at`, hai cạnh hướng về u và v */
function rightMark(at: P2, u: P2, v: P2, size = 11): string {
  const du = mul(unit(sub(u, at)), size)
  const dv = mul(unit(sub(v, at)), size)
  const p1 = add(at, du)
  const p2 = add(add(at, du), dv)
  const p3 = add(at, dv)
  return `<path d="M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}" fill="none" stroke="${STROKE}" stroke-width="1.1"/>`
}

/** gạch kí hiệu cạnh bằng nhau (count gạch) ở giữa đoạn ab */
function tick(a: P2, b: P2, count = 1): string {
  const m = mid(a, b)
  const d = unit(sub(b, a))
  const n: P2 = [-d[1], d[0]]
  let path = ''
  for (let i = 0; i < count; i++) {
    const c = add(m, mul(d, (i - (count - 1) / 2) * 5))
    const p = add(c, mul(n, 6))
    const q = add(c, mul(n, -6))
    path += `M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}`
  }
  return `<path d="${path}" stroke="${STROKE}" stroke-width="1.2"/>`
}

const seg = (a: P2, b: P2, dashed = false, w = 1.6) =>
  `<path d="M${f1(a[0])} ${f1(a[1])}L${f1(b[0])} ${f1(b[1])}" stroke="${STROKE}" stroke-width="${w}"${dashed ? ' stroke-dasharray="6 4"' : ''} fill="none" stroke-linecap="round"/>`

/** nhãn đỉnh đặt ra phía ngoài, theo hướng từ `center` tới điểm */
function label(p: P2, name: string, center: P2, dist = 15): string {
  if (!name) return ''
  let dir = unit(sub(p, center))
  if (len(sub(p, center)) < 1e-6) dir = [0.7, 0.7]
  const q = add(p, mul(dir, dist))
  return `<text x="${f1(q[0])}" y="${f1(q[1] + 6)}" ${FONT} text-anchor="middle" data-lbl="pt:${esc(name)}">${esc(name)}</text>`
}

const dot = (p: P2) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.2" fill="${STROKE}"/>`

/** khung SVG bao trọn nội dung (+ lề) */
function frame(parts: string[], pts: P2[], desc: string, extra = 0): { svg: string; width: number; height: number } {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const pad = 34 + extra
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const w = Math.max(...xs) - Math.min(...xs) + 2 * pad
  const h = Math.max(...ys) - Math.min(...ys) + 2 * pad
  const W = Math.round(w)
  const H = Math.round(h)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(minX)} ${f1(minY)} ${f1(w)} ${f1(h)}" width="${W}" height="${H}">` +
    desc +
    `<rect x="${f1(minX)}" y="${f1(minY)}" width="${f1(w)}" height="${f1(h)}" fill="#fff"/>` +
    parts.join('') +
    `</svg>`
  return { svg, width: W, height: H }
}

/* ------------------------------------------------------------------ *
 * Hình phẳng
 * ------------------------------------------------------------------ */

const LABEL_FONT = `font-family="'Times New Roman',serif" font-size="15"`

function outward2(p: P2, q: P2, center: P2, preferDown = false): P2 {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const l = Math.hypot(dx, dy) || 1
  let n: P2 = [-dy / l, dx / l]
  const m = mid(p, q)
  const dotP = (m[0] - center[0]) * n[0] + (m[1] - center[1]) * n[1]
  if (Math.abs(dotP) > 1e-3) {
    if (dotP < 0) n = [-n[0], -n[1]]
  } else if (preferDown) {
    if (n[1] < -1e-6 || (Math.abs(n[1]) <= 1e-6 && n[0] < 0)) n = [-n[0], -n[1]]
  } else if (n[1] > 1e-6 || (Math.abs(n[1]) <= 1e-6 && n[0] > 0)) {
    n = [-n[0], -n[1]]
  }
  return n
}

function dimNormal(p: P2, q: P2, center: P2, side?: 'up' | 'down' | 'left' | 'right'): P2 {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const l = Math.hypot(dx, dy) || 1
  const n1: P2 = [-dy / l, dx / l]
  const n2: P2 = [dy / l, -dx / l]
  if (!side) return outward2(p, q, center, true)
  const pick = (score: (n: P2) => number) => {
    const s1 = score(n1)
    const s2 = score(n2)
    if (Math.abs(s1 - s2) < 1e-4) return outward2(p, q, center, true)
    return s1 > s2 ? n1 : n2
  }
  if (side === 'up') return pick((n) => -n[1])
  if (side === 'down') return pick((n) => n[1])
  if (side === 'left') return pick((n) => -n[0])
  return pick((n) => n[0])
}

const isNearRight = (at: P2, u: P2, v: P2) => {
  const du = unit(sub(u, at))
  const dv = unit(sub(v, at))
  return Math.abs(du[0] * dv[0] + du[1] * dv[1]) < 0.03
}

function shape2d(shape: Geo2dShape): P2[] {
  // toạ độ màn hình (y hướng xuống), đơn vị px
  switch (shape) {
    case 'triangle':
      return [[150, 40], [40, 260], [330, 260]]
    case 'right-triangle':
      return [[60, 60], [60, 270], [360, 270]]
    case 'isosceles':
      return [[200, 30], [80, 280], [320, 280]]
    case 'equilateral': {
      const s = 280
      return [[200, 270 - (s * Math.sqrt(3)) / 2], [200 - s / 2, 270], [200 + s / 2, 270]]
    }
    // tứ giác: A trên-trái, đi theo chiều kim đồng hồ (hình bình hành: A dưới-trái như SGK)
    case 'square':
      return [[60, 50], [300, 50], [300, 290], [60, 290]]
    case 'rectangle':
      return [[40, 40], [380, 40], [380, 220], [40, 220]]
    case 'parallelogram':
      return [[40, 230], [320, 230], [400, 50], [120, 50]]
    case 'rhombus':
      return [[60, 160], [210, 260], [360, 160], [210, 60]]
    case 'trapezoid':
      return [[110, 60], [290, 60], [380, 240], [30, 240]]
    case 'circle':
      return [[200, 160], [200 + 130 * Math.cos(-0.5), 160 + 130 * Math.sin(-0.5)]]
    case 'inscribed-triangle': {
      const c: P2 = [200, 170]
      const r = 140
      const at = (deg: number): P2 => [c[0] + r * Math.cos((deg * Math.PI) / 180), c[1] + r * Math.sin((deg * Math.PI) / 180)]
      return [at(-100), at(150), at(25), c]
    }
    case 'free':
      return []
  }
}

export function renderGeo2dSvg(spec: Geo2dSpec, desc: string): GeoImage {
  lastErrors = []
  lastPick = { points: [], segs: [], tris: [] }
  return { ...renderGeo2d(spec, desc), errors: lastErrors, pick: lastPick }
}

const TEMPLATE_SCALE = 50

function renderGeo2d(spec: Geo2dSpec, desc: string) {
  if (spec.shape === 'free') {
    const c = construct(spec.extras ?? '', new Map())
    if (!c.points.length) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">${desc}<rect x="0" y="0" width="320" height="240" fill="#fff"/></svg>`
      return { svg, width: 320, height: 240 }
    }
    const boundPts: P2[] = c.points.map((q) => q.p as P2)
    for (const ci of c.circles) boundPts.push([ci.c[0] - ci.r, ci.c[1] - ci.r], [ci.c[0] + ci.r, ci.c[1] + ci.r])
    const xs = boundPts.map((p) => p[0])
    const ys = boundPts.map((p) => p[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = maxX - minX
    const spanY = maxY - minY
    const scale =
      spanX < 1e-9 && spanY < 1e-9
        ? TEMPLATE_SCALE
        : Math.min(spanX > 1e-9 ? 300 / spanX : Infinity, spanY > 1e-9 ? 230 / spanY : Infinity)
    const toPx = (v: P2): P2 => [(v[0] - minX) * scale, (maxY - v[1]) * scale]
    const visPts = c.points.filter((q) => !q.hidden).map((q) => toPx(q.p as P2))
    const center: P2 = visPts.length
      ? mul(visPts.reduce((s, p) => add(s, p), [0, 0] as P2), 1 / visPts.length)
      : [0, 0]
    const parts: string[] = []
    const all: P2[] = [...visPts]
    renderExtras2d(c, new Map(), [], center, parts, all, [], undefined, toPx, scale, true)
    return frame(parts, all, desc)
  }

  const rawPts = shape2d(spec.shape)
  const ox = Math.min(...rawPts.map((p) => p[0]))
  const oy = Math.max(...rawPts.map((p) => p[1]))
  const toMath = (p: P2): P2 => [(p[0] - ox) / TEMPLATE_SCALE, (oy - p[1]) / TEMPLATE_SCALE]
  const toPx = (v: P2): P2 => [ox + v[0] * TEMPLATE_SCALE, oy - v[1] * TEMPLATE_SCALE]

  const names = spec.names
  const baseNames =
    spec.shape === 'circle'
      ? [names[0] ?? 'O', names[1]].filter(Boolean)
      : spec.shape === 'inscribed-triangle'
        ? names.slice(0, 3)
        : names
  const overrides = spec.extras ? extractCoords(spec.extras) : new Map<string, P2>()
  const ptsMath = rawPts.map(toMath)
  let overridden = false
  baseNames.forEach((n, i) => {
    if (n && i < ptsMath.length && overrides.has(n)) {
      ptsMath[i] = overrides.get(n)!
      overridden = true
    }
  })

  const pts = overridden ? ptsMath.map(toPx) : rawPts
  const parts: string[] = []
  const known = new Map<string, number[]>()
  const know = (n: string | undefined, p: P2) => n && !known.has(n) && known.set(n, p)
  const pairs: Array<[string, string]> = []

  if (spec.shape === 'circle') {
    const [o, a] = pts
    const all: P2[] = [...pts]
    const r = len(sub(a, o))
    parts.push(`<circle cx="${f1(o[0])}" cy="${f1(o[1])}" r="${f1(r)}" fill="none" stroke="${STROKE}" stroke-width="1.6"/>`)
    parts.push(seg(o, a, false, 1.3), dot(o), dot(a), label(o, names[0] ?? 'O', add(o, [-1, -1])), label(a, names[1] ?? '', o))
    all.push([o[0] - r, o[1] - r], [o[0] + r, o[1] + r])
    know(names[0] ?? 'O', ptsMath[0])
    know(names[1], ptsMath[1])
    if (names[1]) pairs.push([names[0] ?? 'O', names[1]])
    const c = construct(spec.extras ?? '', known)
    renderExtras2d(c, known, baseNames, o, parts, all, pairs, undefined, toPx, TEMPLATE_SCALE, false)
    return frame(parts, all, desc)
  }

  const poly = spec.shape === 'inscribed-triangle' ? pts.slice(0, 3) : pts
  const polyMath = spec.shape === 'inscribed-triangle' ? ptsMath.slice(0, 3) : ptsMath
  const centerPts = overridden ? poly : pts
  const center: P2 = mul(centerPts.reduce((s, p) => add(s, p), [0, 0] as P2), 1 / centerPts.length)
  const all: P2[] = [...(overridden ? poly : pts)]
  const d = poly.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`).join('') + 'Z'
  parts.push(`<path d="${d}" fill="none" stroke="${STROKE}" stroke-width="1.6" stroke-linejoin="round"/>`)

  const isTri = poly.length === 3
  const [A, B, C] = poly
  // đường tròn ngoại tiếp (tam giác) — luôn có với "nội tiếp"
  if (isTri && (spec.circumcircle || spec.shape === 'inscribed-triangle')) {
    const o = circumcenter(A, B, C)
    const r = len(sub(A, o))
    if (Number.isFinite(r) && Number.isFinite(o[0]) && Number.isFinite(o[1])) {
      parts.push(`<circle cx="${f1(o[0])}" cy="${f1(o[1])}" r="${f1(r)}" fill="none" stroke="${STROKE}" stroke-width="1.4"/>`)
      parts.push(dot(o), label(o, names[3] ?? 'O', add(o, [0, -1]), 14))
      know(names[3] ?? 'O', toMath(o))
      all.push([o[0] - r, o[1] - r], [o[0] + r, o[1] + r])
    }
  }
  if (isTri && spec.altitude) {
    const h = foot(A, B, C)
    parts.push(seg(A, h, false, 1.3), dot(h), label(h, 'H', A))
    know('H', toMath(h))
    pairs.push([names[0], 'H'])
    if (spec.marks) parts.push(rightMark(h, A, C))
  }
  if (isTri && spec.median) {
    const m = mid(B, C)
    parts.push(seg(A, m, false, 1.3), dot(m), label(m, 'M', A))
    know('M', toMath(m))
    pairs.push([names[0], 'M'])
    if (spec.marks) parts.push(tick(B, m, 2), tick(m, C, 2))
  }
  if (!isTri && spec.diagonals) {
    parts.push(seg(poly[0], poly[2], false, 1.3), seg(poly[1], poly[3], false, 1.3))
    pairs.push([names[0], names[2]], [names[1], names[3]])
    // giao điểm hai đường chéo
    const [p, q, r, s] = poly
    const den = (p[0] - r[0]) * (q[1] - s[1]) - (p[1] - r[1]) * (q[0] - s[0])
    if (Math.abs(den) > 1e-6) {
      const t = ((p[0] - q[0]) * (q[1] - s[1]) - (p[1] - q[1]) * (q[0] - s[0])) / den
      const o: P2 = [p[0] + t * (r[0] - p[0]), p[1] + t * (r[1] - p[1])]
      parts.push(dot(o), label(o, 'O', add(o, [0, -1]), 14))
      know('O', toMath(o))
    }
  }
  if (spec.marks) {
    if (spec.shape === 'right-triangle' && (!overridden || isNearRight(A, B, C))) parts.push(rightMark(A, B, C))
    if (spec.shape === 'isosceles') parts.push(tick(A, B), tick(A, C))
    if (spec.shape === 'equilateral') parts.push(tick(A, B), tick(B, C), tick(C, A))
    if (spec.shape === 'square' || spec.shape === 'rectangle') {
      poly.forEach((p, i) => {
        const u = poly[(i + 1) % 4]
        const v = poly[(i + 3) % 4]
        if (!overridden || isNearRight(p, u, v)) parts.push(rightMark(p, u, v))
      })
      if (spec.shape === 'square') poly.forEach((p, i) => parts.push(tick(p, poly[(i + 1) % 4])))
    }
    if (spec.shape === 'rhombus') poly.forEach((p, i) => parts.push(tick(p, poly[(i + 1) % 4])))
  }
  poly.forEach((p, i) => parts.push(label(p, names[i] ?? '', center)))
  polyMath.forEach((p, i) => know(names[i], p))
  poly.forEach((_, i) => pairs.push([names[i], names[(i + 1) % poly.length]]))
  const tri = isTri ? names.slice(0, 3) : undefined
  const c = construct(spec.extras ?? '', known, { triangle: tri })
  renderExtras2d(c, known, baseNames, center, parts, all, pairs, tri, toPx, TEMPLATE_SCALE, false)
  return frame(parts, all, desc)
}

/** vẽ phần dựng thêm của hình phẳng */
function renderExtras2d(
  c: Construction,
  known: Map<string, number[]>,
  baseNames: string[],
  center: P2,
  parts: string[],
  all: P2[],
  pairs: Array<[string, string]>,
  triangle: string[] | undefined,
  toPx: (v: P2) => P2,
  scale: number,
  isFree: boolean,
) {
  const every = new Map(known)
  c.points.forEach((q) => every.set(q.name, q.p))
  const extSegs: Array<[string, string]> = c.extends.map((e) => [e.a, e.b])
  const allSegPairs = [...pairs, ...c.segs.map((g) => [g.a, g.b] as [string, string]), ...extSegs]
    .filter(([a, b]) => a && b && !isHidden(a) && !isHidden(b) && every.has(a) && every.has(b))
    .map(([a, b]) => ({ a, b }))
  const origins = [...new Set([...baseNames, ...c.coords])].filter((n) => !isHidden(n) && every.has(n))
  lastPick = {
    points: [...every]
      .filter(([name]) => !isHidden(name))
      .map(([name, v]) => {
        const px = toPx(v as P2)
        return { name, x: px[0], y: px[1], v }
      }),
    segs: allSegPairs,
    tris: triangle && triangle.every(Boolean) ? [triangle] : [],
    origins,
  }
  const at = (n: string) => toPx(every.get(n) as P2)
  // tô nằm dưới mọi nét (ngay sau nền)
  for (const f of [...c.fills].reverse()) {
    const d = f.map((n, i) => `${i ? 'L' : 'M'}${f1(at(n)[0])} ${f1(at(n)[1])}`).join('') + 'Z'
    parts.unshift(`<path d="${d}" fill="${FILL}" fill-opacity="0.1" stroke="none"/>`)
  }
  if (c.dims.length) {
    parts.unshift(
      `<defs><marker id="geo-dim-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${STROKE}"/></marker></defs>`,
    )
  }
  for (const ci of c.circles) {
    const [x, y] = toPx(ci.c as P2)
    const r = ci.r * scale
    parts.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="none" stroke="${STROKE}" stroke-width="1.4"/>`)
    all.push([x - r, y - r], [x + r, y + r])
  }

  // đoạn kéo dài (~15% khung hình hiện tại)
  const figXs = all.length ? all.map((p) => p[0]) : [0]
  const figYs = all.length ? all.map((p) => p[1]) : [0]
  const extDist = 0.15 * Math.max(Math.max(...figXs) - Math.min(...figXs), Math.max(...figYs) - Math.min(...figYs), 200)
  const freeSegsPx: Array<[P2, P2]> = []
  for (const e of c.extends) {
    const pa = at(e.a)
    const pb = at(e.b)
    const dir = unit(sub(pb, pa))
    const pStart = e.mode === 'both' ? sub(pa, mul(dir, extDist)) : pa
    const pEnd = add(pb, mul(dir, extDist))
    parts.push(seg(pStart, pEnd, e.dashed === true, 1.4))
    all.push(pStart, pEnd)
    freeSegsPx.push([pStart, pEnd])
  }

  for (const g of c.segs) {
    const pa = at(g.a)
    const pb = at(g.b)
    parts.push(seg(pa, pb, g.dashed === true, isFree ? 1.5 : 1.3))
    freeSegsPx.push([pa, pb])
  }
  for (const r of c.rights) {
    const ra = at(r.at)
    const ru = at(r.u)
    const rv = at(r.v)
    parts.push(rightMark(ra, ru, rv))
    const du = mul(unit(sub(ru, ra)), 11)
    const dv = mul(unit(sub(rv, ra)), 11)
    freeSegsPx.push([add(ra, du), add(add(ra, du), dv)], [add(add(ra, du), dv), add(ra, dv)])
  }
  c.equals.forEach((grp, k) => grp.forEach(([a, b]) => parts.push(tick(at(a), at(b), k + 1))))

  const placedLabels: P2[] = []
  // đường kích thước: hai vạch gióng ngắn, đoạn nét đứt song song, mũi tên hai đầu, chữ ở giữa
  for (const dm of c.dims) {
    const pa = at(dm.a)
    const pb = at(dm.b)
    const n = dimNormal(pa, pb, center, dm.side)
    const off = 32
    const t1 = add(pa, mul(n, 4))
    const t2 = add(pa, mul(n, off + 5))
    const q1 = add(pb, mul(n, 4))
    const q2 = add(pb, mul(n, off + 5))
    const p2 = add(pa, mul(n, off))
    const p3 = add(pb, mul(n, off))
    parts.push(
      `<path d="M${f1(t1[0])} ${f1(t1[1])}L${f1(t2[0])} ${f1(t2[1])}M${f1(q1[0])} ${f1(q1[1])}L${f1(q2[0])} ${f1(q2[1])}" stroke="${STROKE}" stroke-width="1" fill="none"/>`,
    )
    parts.push(
      `<path d="M${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}" stroke="${STROKE}" stroke-width="1.1" stroke-dasharray="5 4" fill="none" marker-start="url(#geo-dim-arr)" marker-end="url(#geo-dim-arr)"/>`,
    )
    freeSegsPx.push([t1, t2], [q1, q2], [p2, p3])
    all.push(t2, q2, p2, p3)
    if (dm.text) {
      const m = mid(p2, p3)
      const estW = Math.max(18, dm.text.length * 8)
      parts.push(`<text x="${f1(m[0])}" y="${f1(m[1] + 5)}" ${LABEL_FONT} text-anchor="middle" data-lbl="dim:${esc(dm.a + dm.b)}">${richTextToSvg(dm.text)}</text>`)
      all.push([m[0] - estW / 2, m[1] - 10], [m[0] + estW / 2, m[1] + 10])
      placedLabels.push(m)
    }
  }

  // nhãn cạnh: đặt ở giữa cạnh, lệch ra phía ngoài hình
  for (const lb of c.labels) {
    const pa = at(lb.a)
    const pb = at(lb.b)
    const n = outward2(pa, pb, center, false)
    const m = mid(pa, pb)
    const anchor = Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle'
    const dist = Math.abs(n[0]) > 0.7 ? 10 : n[1] < -0.5 ? 10 : 16
    const lx = m[0] + n[0] * dist
    const ly = m[1] + n[1] * dist + (Math.abs(n[0]) > 0.7 ? 5 : n[1] < -0.5 ? 0 : 4)
    parts.push(`<text x="${f1(lx)}" y="${f1(ly)}" ${LABEL_FONT} text-anchor="${anchor}" data-lbl="seg:${esc(lb.a + lb.b)}">${richTextToSvg(lb.text)}</text>`)
    const estW = Math.max(18, lb.text.length * 8)
    const x0 = anchor === 'end' ? lx - estW : anchor === 'middle' ? lx - estW / 2 : lx - 4
    const x1 = anchor === 'start' ? lx + estW : anchor === 'middle' ? lx + estW / 2 : lx + 4
    all.push([x0, ly - 14], [x1, ly + 4])
    placedLabels.push([lx, ly - 5])
  }

  for (const q of c.points) {
    const p = toPx(q.p as P2)
    all.push(p)
    if (q.hidden) continue
    if (!isFree) {
      parts.push(dot(p), label(p, q.name, len(sub(p, center)) < 1 ? add(p, [0, 1]) : center, 14))
    } else {
      parts.push(dot(p))
      const outDir = len(sub(p, center)) > 1e-3 ? unit(sub(p, center)) : ([0.7, -0.7] as P2)
      let best: P2 = add(p, mul(outDir, 15))
      let bestScore = -Infinity
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4
        const ux = Math.cos(a)
        const uy = Math.sin(a)
        const cand: P2 = [p[0] + ux * 15, p[1] + uy * 15]
        const segD = freeSegsPx.length ? Math.min(...freeSegsPx.map(([u, v]) => distToSeg(cand, u, v))) : 20
        const lblD = placedLabels.length ? Math.min(...placedLabels.map((pl) => len(sub(cand, pl)))) : 30
        const score = Math.min(segD, 18) + Math.min(lblD, 24) * 0.6 + (ux * outDir[0] + uy * outDir[1]) * 3
        if (score > bestScore + 1e-6) {
          bestScore = score
          best = cand
        }
      }
      placedLabels.push(best)
      parts.push(`<text x="${f1(best[0])}" y="${f1(best[1] + 6)}" ${FONT} text-anchor="middle" data-lbl="pt:${esc(q.name)}">${esc(q.name)}</text>`)
      all.push([best[0] - 8, best[1] - 8], [best[0] + 8, best[1] + 8])
    }
  }
}

/* ------------------------------------------------------------------ *
 * Hình không gian
 * ------------------------------------------------------------------ */

/** phép chiếu song song: trục sâu y xiên 45° lên phải, co 1/2; z hướng lên */
const SCALE = 120
const K = 0.5
const ANG = Math.PI / 4
function proj(p: P3): P2 {
  const [x, y, z] = p
  return [(x + K * y * Math.cos(ANG)) * SCALE, -(z + K * y * Math.sin(ANG)) * SCALE]
}
/** phương chiếu (mắt nhìn ngược chiều này): mặt có pháp tuyến n hướng về mắt khi n·D < 0 */
const D: P3 = [-K * Math.cos(ANG), 1, -K * Math.sin(ANG)]

const sub3 = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: P3, b: P3): P3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot3 = (a: P3, b: P3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const avg3 = (ps: P3[]): P3 => {
  const s = ps.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]] as P3, [0, 0, 0] as P3)
  return [s[0] / ps.length, s[1] / ps.length, s[2] / ps.length]
}

interface Solid {
  pts: P3[]
  /** các mặt (chỉ số đỉnh), khối lồi */
  faces: number[][]
  /** đoạn phụ (đường cao, đường chéo…) — nét liền nếu nằm trên mặt nhìn thấy, không thì đứt */
  extra: Array<[number, number]>
  /** điểm phụ (chân đường cao, tâm đáy) để ghi tên */
  /** góc vuông: [đỉnh, hướng 1, hướng 2] */
  right: Array<[number, number, number]>
  /** nhóm đoạn bằng nhau (dựng thêm) */
  ticks?: Array<Array<[number, number]>>
}

function solid(spec: Geo3dSpec): Solid {
  const h = 1.5 * spec.tall
  switch (spec.shape) {
    case 'pyramid3':
    case 'pyramid3-sa':
    case 'pyramid3-regular': {
      // A trái, B gần (dưới), C phải-xa: cạnh AC khuất, đúng hình quen thuộc trong đề
      let A: P3 = [0, 0.9, 0]
      let B: P3 = [0.75, 0, 0]
      let C: P3 = [1.9, 0.9, 0]
      if (spec.shape === 'pyramid3-regular') {
        const r = 1
        const at = (deg: number): P3 => [1 + r * Math.cos((deg * Math.PI) / 180), 0.9 + r * Math.sin((deg * Math.PI) / 180) * 1.2, 0]
        A = at(180)
        B = at(-60)
        C = at(60)
      }
      const G = avg3([A, B, C])
      const S: P3 = spec.shape === 'pyramid3-sa' ? [A[0], A[1], h] : spec.shape === 'pyramid3-regular' ? [G[0], G[1], h] : [0.95, 0.55, h]
      const foot3: P3 = [S[0], S[1], 0]
      const pts = [S, A, B, C, foot3]
      const extra: Array<[number, number]> = spec.height && spec.shape !== 'pyramid3-sa' ? [[0, 4]] : []
      const right: Array<[number, number, number]> =
        spec.shape === 'pyramid3-sa' ? [[1, 0, 2], [1, 0, 3]] : spec.height ? [[4, 0, 2]] : []
      return { pts, faces: [[1, 2, 3], [0, 1, 2], [0, 2, 3], [0, 3, 1]], extra, right }
    }
    case 'pyramid4':
    case 'pyramid4-sa':
    case 'pyramid4-regular': {
      // A trước-trái, B trước-phải, C sau-phải, D sau-trái: các cạnh qua D khuất
      const w = spec.shape === 'pyramid4' ? 1.6 : 1.5
      const dep = spec.shape === 'pyramid4' ? 1.5 : 1.5
      const sh = spec.shape === 'pyramid4' ? 0.45 : 0
      const A: P3 = [0, 0, 0]
      const B: P3 = [w, 0, 0]
      const C: P3 = [w + sh, dep, 0]
      const Dp: P3 = [sh, dep, 0]
      const O = avg3([A, B, C, Dp])
      const S: P3 = spec.shape === 'pyramid4-sa' ? [0, 0, h] : [O[0], O[1], h]
      const pts = [S, A, B, C, Dp, O]
      const extra: Array<[number, number]> = []
      if (spec.diagonals) extra.push([1, 3], [2, 4])
      if (spec.height && spec.shape !== 'pyramid4-sa') extra.push([0, 5])
      const right: Array<[number, number, number]> =
        spec.shape === 'pyramid4-sa' ? [[1, 0, 2], [1, 0, 4]] : spec.height ? [[5, 0, 2]] : []
      return { pts, faces: [[1, 2, 3, 4], [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]], extra, right }
    }
    case 'tetrahedron': {
      const A: P3 = [0, 0.9, 0]
      const B: P3 = [0.75, 0, 0]
      const C: P3 = [1.9, 0.9, 0]
      const Dt: P3 = [0.95, 0.55, h]
      return { pts: [A, B, C, Dt], faces: [[0, 1, 2], [3, 0, 1], [3, 1, 2], [3, 2, 0]], extra: [], right: [] }
    }
    case 'prism3': {
      const A: P3 = [0, 0.9, 0]
      const B: P3 = [0.75, 0, 0]
      const C: P3 = [1.9, 0.9, 0]
      const up = (p: P3): P3 => [p[0], p[1], h]
      return {
        pts: [A, B, C, up(A), up(B), up(C)],
        faces: [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]],
        extra: [],
        right: spec.marks ? [[0, 3, 1]] : [],
      }
    }
    case 'box':
    case 'cube': {
      const w = spec.shape === 'cube' ? 1.4 : 1.9
      const dep = spec.shape === 'cube' ? 1.4 : 1.3
      const hh = spec.shape === 'cube' ? 1.4 : 1.1 * spec.tall
      const base: P3[] = [[0, 0, 0], [w, 0, 0], [w, dep, 0], [0, dep, 0]]
      const top = base.map((p) => [p[0], p[1], hh] as P3)
      const extra: Array<[number, number]> = spec.diagonals ? [[0, 2], [1, 3]] : []
      return {
        pts: [...base, ...top],
        faces: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
        extra,
        right: [],
      }
    }
    default:
      return { pts: [], faces: [], extra: [], right: [] }
  }
}

/** p nằm trên mặt (đa giác lồi phẳng) không */
function onFace(p: P3, face: P3[]): boolean {
  const n = cross(sub3(face[1], face[0]), sub3(face[2], face[0]))
  const nl = Math.hypot(...n) || 1
  if (Math.abs(dot3(n, sub3(p, face[0])) / nl) > 1e-6) return false
  // cùng phía với mọi cạnh
  let sign = 0
  for (let i = 0; i < face.length; i++) {
    const a = face[i]
    const b = face[(i + 1) % face.length]
    const s = dot3(cross(sub3(b, a), sub3(p, a)), n)
    if (Math.abs(s) < 1e-9) continue
    if (sign === 0) sign = Math.sign(s)
    else if (Math.sign(s) !== sign) return false
  }
  return true
}

function renderSolid(spec: Geo3dSpec, desc: string) {
  const s = solid(spec)
  const names = [...spec.names]
  // dựng thêm: điểm mới nối vào cuối danh sách đỉnh, đoạn mới thành đoạn phụ
  const forced = new Map<string, boolean>()
  const nRight = s.right.length
  const nBase = s.pts.length
  let fills: string[][] = []
  if (spec.extras?.trim()) {
    const known = new Map<string, number[]>()
    s.pts.forEach((p, i) => names[i] && !known.has(names[i]) && known.set(names[i], p))
    const c = construct(spec.extras, known)
    for (const q of c.points) {
      s.pts.push(q.p as P3)
      names[s.pts.length - 1] = q.name
    }
    const idx = (n: string) => names.indexOf(n)
    for (const g of c.segs) {
      const a = idx(g.a)
      const b = idx(g.b)
      s.extra.push([a, b])
      if (g.dashed !== undefined) forced.set(`${a}-${b}`, g.dashed)
    }
    for (const r of c.rights) s.right.push([idx(r.at), idx(r.u), idx(r.v)])
    s.ticks = c.equals.map((grp) => grp.map(([a, b]) => [idx(a), idx(b)] as [number, number]))
    fills = c.fills
  }
  const center = avg3(s.pts.slice(0, Math.max(3, s.faces.flat().reduce((m, i) => Math.max(m, i), 0) + 1)))
  // pháp tuyến hướng ra ngoài của từng mặt + mặt đó có nhìn thấy không
  const visible = s.faces.map((f) => {
    const [a, b, c] = f.map((i) => s.pts[i])
    let n = cross(sub3(b, a), sub3(c, a))
    if (dot3(n, sub3(a, center)) < 0) n = [-n[0], -n[1], -n[2]]
    return dot3(n, D) < 0
  })
  // cạnh: nét liền nếu thuộc ít nhất một mặt nhìn thấy
  const edges = new Map<string, { a: number; b: number; vis: boolean }>()
  s.faces.forEach((f, fi) => {
    f.forEach((i, k) => {
      const j = f[(k + 1) % f.length]
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      const e = edges.get(key) ?? { a: i, b: j, vis: false }
      e.vis = e.vis || visible[fi]
      edges.set(key, e)
    })
  })
  const P = s.pts.map(proj)
  {
    const pts = new Map<string, P2>()
    s.pts.forEach((_, i) => names[i] && !pts.has(names[i]) && pts.set(names[i], P[i]))
    const segs = [...edges.values()].map((e) => [e.a, e.b]).concat(s.extra).map(([a, b]) => ({ a: names[a], b: names[b] })).filter((g) => g.a && g.b)
    const tris = s.faces.filter((f) => f.length === 3).map((f) => f.map((i) => names[i])).filter((t) => t.every(Boolean))
    lastPick = {
      points: [...pts].filter(([name]) => !isHidden(name)).map(([name, p]) => ({ name, x: p[0], y: p[1], v: s.pts[names.indexOf(name)] })),
      segs: segs.filter((g) => !isHidden(g.a) && !isHidden(g.b)),
      tris,
    }
  }
  const parts: string[] = []
  const idxOf = (n: string) => names.indexOf(n)
  for (const f of fills) {
    const d = f.map((n, k) => `${k ? 'L' : 'M'}${f1(P[idxOf(n)][0])} ${f1(P[idxOf(n)][1])}`).join('') + 'Z'
    parts.push(`<path d="${d}" fill="${FILL}" fill-opacity="0.1" stroke="none"/>`)
  }
  if (spec.circumsphere) {
    // đường viền cầu bao trọn các đỉnh (phép chiếu xiên không giữ tròn → lấy bán kính theo hình chiếu)
    const c = proj(avg3(s.pts.slice(0, nBase)))
    const r = Math.max(...P.slice(0, nBase).map((p) => len(sub(p, c)))) + 4
    parts.push(`<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="none" stroke="${STROKE}" stroke-width="1.4"/>`, ellipse(c, r, r * 0.3, true))
    P.push([c[0] - r, c[1] - r], [c[0] + r, c[1] + r])
  }
  for (const e of edges.values()) parts.push(seg(P[e.a], P[e.b], !e.vis))
  for (const [a, b] of s.extra) {
    const onVisible = s.faces.some((f, fi) => visible[fi] && onFace(s.pts[a], f.map((i) => s.pts[i])) && onFace(s.pts[b], f.map((i) => s.pts[i])))
    parts.push(seg(P[a], P[b], forced.get(`${a}-${b}`) ?? !onVisible, 1.3))
  }
  s.right.forEach(([at, u, v], k) => {
    if (spec.marks || k >= nRight) parts.push(rightMark(P[at], P[u], P[v], 9))
  })
  s.ticks?.forEach((grp, k) => grp.forEach(([a, b]) => parts.push(tick(P[a], P[b], k + 1))))

  // tên đỉnh: chỉ những điểm đang dùng (điểm phụ như O, H chỉ ghi khi có đường đi qua)
  const used = new Set<number>()
  s.faces.flat().forEach((i) => used.add(i))
  s.extra.flat().forEach((i) => used.add(i))
  for (let i = nBase; i < s.pts.length; i++) if (!isHidden(names[i])) used.add(i) // điểm dựng thêm luôn ghi tên
  // nhãn đỉnh: thử 8 hướng quanh đỉnh, lấy chỗ cách xa mọi nét vẽ (và nhãn đã đặt) nhất
  const segs: Array<[P2, P2]> = [...[...edges.values()].map((e) => [P[e.a], P[e.b]] as [P2, P2]), ...s.extra.map(([a, b]) => [P[a], P[b]] as [P2, P2])]
  const placed: P2[] = []
  s.pts.forEach((_, i) => {
    if (!used.has(i)) return
    if (isHidden(names[i])) return
    const isAux = !s.faces.flat().includes(i)
    if (isAux) parts.push(dot(P[i]))
    const r = isAux ? 13 : 16
    let best: P2 = add(P[i], [0, -r])
    let bestScore = -1
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      const q = add(P[i], [Math.cos(a) * r, Math.sin(a) * r])
      const score = Math.min(...segs.map(([u, v]) => distToSeg(q, u, v)), ...placed.map((p) => len(sub(q, p)) * 0.8))
      if (score > bestScore + 0.5) {
        bestScore = score
        best = q
      }
    }
    placed.push(best)
    const name = names[i] ?? ''
    if (name) parts.push(`<text x="${f1(best[0])}" y="${f1(best[1] + 6)}" ${FONT} text-anchor="middle" data-lbl="pt:${esc(name)}">${esc(name)}</text>`)
  })
  return frame(parts, P, desc)
}

/** elip nằm ngang (đường tròn đáy theo phép chiếu): nửa sau nét đứt */
function ellipse(c: P2, rx: number, ry: number, backDashed: boolean): string {
  const front = `M${f1(c[0] - rx)} ${f1(c[1])}A${f1(rx)} ${f1(ry)} 0 0 0 ${f1(c[0] + rx)} ${f1(c[1])}`
  const back = `M${f1(c[0] - rx)} ${f1(c[1])}A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(c[0] + rx)} ${f1(c[1])}`
  return (
    `<path d="${front}" fill="none" stroke="${STROKE}" stroke-width="1.6"/>` +
    `<path d="${back}" fill="none" stroke="${STROKE}" stroke-width="1.6"${backDashed ? ' stroke-dasharray="6 4"' : ''}/>`
  )
}

function renderRound(spec: Geo3dSpec, desc: string) {
  const R = 130
  const ry = R * 0.32
  const H = 260 * spec.tall
  const n = spec.names
  const parts: string[] = []
  const pts: P2[] = []
  if (spec.shape === 'sphere') {
    const o: P2 = [0, 0]
    parts.push(`<circle cx="0" cy="0" r="${R}" fill="none" stroke="${STROKE}" stroke-width="1.6"/>`, ellipse(o, R, ry, true), dot(o), label(o, n[0] ?? 'O', [-1, -1], 14))
    pts.push([-R, -R], [R, R])
    return frame(parts, pts, desc)
  }
  const O: P2 = [0, 0]
  const A: P2 = [R, 0]
  if (spec.shape === 'cone') {
    const S: P2 = [0, -H]
    parts.push(ellipse(O, R, ry, true), seg(S, [-R, 0]), seg(S, [R, 0]))
    if (spec.height) parts.push(seg(S, O, true, 1.3), seg(O, A, true, 1.3))
    if (spec.height && spec.marks) parts.push(rightMark(O, S, A, 9))
    parts.push(dot(O), label(S, n[0] ?? 'S', [0, 0], 16), label(O, n[1] ?? 'O', [10, -10], 14))
    if (spec.height) parts.push(label(A, n[2] ?? 'A', [0, -10], 15))
    pts.push(S, [-R, ry], [R, ry])
    return frame(parts, pts, desc)
  }
  // trụ
  const T: P2 = [0, -H]
  parts.push(ellipse(O, R, ry, true), ellipse(T, R, ry, false), seg([-R, 0], [-R, -H]), seg([R, 0], [R, -H]))
  if (spec.height) parts.push(seg(O, T, true, 1.3), seg(O, A, true, 1.3))
  parts.push(dot(O), dot(T), label(O, n[0] ?? 'O', [10, -10], 14), label(T, n[1] ?? "O'", [10, 10], 14))
  if (spec.height) parts.push(label(A, n[2] ?? 'A', [0, -10], 15))
  pts.push([-R, -H - ry], [R, ry])
  return frame(parts, pts, desc)
}

export function renderGeo3dSvg(spec: Geo3dSpec, desc: string): GeoImage {
  lastErrors = []
  lastPick = { points: [], segs: [], tris: [] }
  const isRound = spec.shape === 'cone' || spec.shape === 'cylinder' || spec.shape === 'sphere'
  if (isRound && spec.extras?.trim()) lastErrors = [{ line: 0, msg: 'nón, trụ, cầu chưa dựng thêm được' }]
  const img = isRound ? renderRound(spec, desc) : renderSolid(spec, desc)
  return { ...img, errors: lastErrors, pick: lastPick }
}
