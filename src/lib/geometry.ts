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
}

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
  return `<text x="${f1(q[0])}" y="${f1(q[1] + 6)}" ${FONT} text-anchor="middle">${esc(name)}</text>`
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
  }
}

export function renderGeo2dSvg(spec: Geo2dSpec, desc: string): { svg: string; width: number; height: number } {
  const pts = shape2d(spec.shape)
  const names = spec.names
  const parts: string[] = []
  const all: P2[] = [...pts]
  const center: P2 = mul(pts.reduce((s, p) => add(s, p), [0, 0] as P2), 1 / pts.length)

  if (spec.shape === 'circle') {
    const [o, a] = pts
    const r = len(sub(a, o))
    parts.push(`<circle cx="${o[0]}" cy="${o[1]}" r="${f1(r)}" fill="none" stroke="${STROKE}" stroke-width="1.6"/>`)
    parts.push(seg(o, a, false, 1.3), dot(o), dot(a), label(o, names[0] ?? 'O', add(o, [-1, -1])), label(a, names[1] ?? '', o))
    all.push([o[0] - r, o[1] - r], [o[0] + r, o[1] + r])
    return frame(parts, all, desc)
  }

  const poly = spec.shape === 'inscribed-triangle' ? pts.slice(0, 3) : pts
  const d = poly.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`).join('') + 'Z'
  parts.push(`<path d="${d}" fill="none" stroke="${STROKE}" stroke-width="1.6" stroke-linejoin="round"/>`)

  const isTri = poly.length === 3
  const [A, B, C] = poly
  // đường tròn ngoại tiếp (tam giác) — luôn có với "nội tiếp"
  if (isTri && (spec.circumcircle || spec.shape === 'inscribed-triangle')) {
    const o = circumcenter(A, B, C)
    const r = len(sub(A, o))
    parts.push(`<circle cx="${f1(o[0])}" cy="${f1(o[1])}" r="${f1(r)}" fill="none" stroke="${STROKE}" stroke-width="1.4"/>`)
    parts.push(dot(o), label(o, names[3] ?? 'O', add(o, [0, -1]), 14))
    all.push([o[0] - r, o[1] - r], [o[0] + r, o[1] + r])
  }
  if (isTri && spec.altitude) {
    const h = foot(A, B, C)
    parts.push(seg(A, h, false, 1.3), dot(h), label(h, 'H', A))
    if (spec.marks) parts.push(rightMark(h, A, C))
  }
  if (isTri && spec.median) {
    const m = mid(B, C)
    parts.push(seg(A, m, false, 1.3), dot(m), label(m, 'M', A))
    if (spec.marks) parts.push(tick(B, m, 2), tick(m, C, 2))
  }
  if (!isTri && spec.diagonals) {
    parts.push(seg(poly[0], poly[2], false, 1.3), seg(poly[1], poly[3], false, 1.3))
    // giao điểm hai đường chéo
    const [p, q, r, s] = poly
    const den = (p[0] - r[0]) * (q[1] - s[1]) - (p[1] - r[1]) * (q[0] - s[0])
    if (Math.abs(den) > 1e-6) {
      const t = ((p[0] - q[0]) * (q[1] - s[1]) - (p[1] - q[1]) * (q[0] - s[0])) / den
      const o: P2 = [p[0] + t * (r[0] - p[0]), p[1] + t * (r[1] - p[1])]
      parts.push(dot(o), label(o, 'O', add(o, [0, -1]), 14))
    }
  }
  if (spec.marks) {
    if (spec.shape === 'right-triangle') parts.push(rightMark(A, B, C))
    if (spec.shape === 'isosceles') parts.push(tick(A, B), tick(A, C))
    if (spec.shape === 'equilateral') parts.push(tick(A, B), tick(B, C), tick(C, A))
    if (spec.shape === 'square' || spec.shape === 'rectangle') {
      poly.forEach((p, i) => parts.push(rightMark(p, poly[(i + 1) % 4], poly[(i + 3) % 4])))
      if (spec.shape === 'square') poly.forEach((p, i) => parts.push(tick(p, poly[(i + 1) % 4])))
    }
    if (spec.shape === 'rhombus') poly.forEach((p, i) => parts.push(tick(p, poly[(i + 1) % 4])))
  }
  poly.forEach((p, i) => parts.push(label(p, names[i] ?? '', center)))
  return frame(parts, all, desc)
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
  const parts: string[] = []
  for (const e of edges.values()) parts.push(seg(P[e.a], P[e.b], !e.vis))
  for (const [a, b] of s.extra) {
    const onVisible = s.faces.some((f, fi) => visible[fi] && onFace(s.pts[a], f.map((i) => s.pts[i])) && onFace(s.pts[b], f.map((i) => s.pts[i])))
    parts.push(seg(P[a], P[b], !onVisible, 1.3))
  }
  if (spec.marks) for (const [at, u, v] of s.right) parts.push(rightMark(P[at], P[u], P[v], 9))

  // tên đỉnh: chỉ những điểm đang dùng (điểm phụ như O, H chỉ ghi khi có đường đi qua)
  const used = new Set<number>()
  s.faces.flat().forEach((i) => used.add(i))
  s.extra.flat().forEach((i) => used.add(i))
  // nhãn đỉnh: thử 8 hướng quanh đỉnh, lấy chỗ cách xa mọi nét vẽ (và nhãn đã đặt) nhất
  const segs: Array<[P2, P2]> = [...[...edges.values()].map((e) => [P[e.a], P[e.b]] as [P2, P2]), ...s.extra.map(([a, b]) => [P[a], P[b]] as [P2, P2])]
  const placed: P2[] = []
  s.pts.forEach((_, i) => {
    if (!used.has(i)) return
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
    const name = spec.names[i] ?? ''
    if (name) parts.push(`<text x="${f1(best[0])}" y="${f1(best[1] + 6)}" ${FONT} text-anchor="middle">${esc(name)}</text>`)
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

export function renderGeo3dSvg(spec: Geo3dSpec, desc: string): { svg: string; width: number; height: number } {
  if (spec.shape === 'cone' || spec.shape === 'cylinder' || spec.shape === 'sphere') return renderRound(spec, desc)
  return renderSolid(spec, desc)
}
