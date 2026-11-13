/**
 * Thùng sơn kiểu Paint: dò vùng kín tại điểm bấm, coi nét của MỌI hình là tường
 * (hình vuông + đường chéo → bấm vào một tam giác thì chỉ tam giác đó được tô).
 * Cách làm: vẽ nét các hình (không tô nền) lên canvas ẩn theo khung nhìn → loang từ điểm bấm
 * → nếu chạm mép khung thì vùng hở (không tô) → lấy đường viền ngoài của vùng làm đa giác.
 */
import rough from 'roughjs'
import { drawElement } from './render'
import { closedLoop, isPage, regionHoles, type El, type Pt } from './scene'

export interface RegionView { zoom: number; scrollX: number; scrollY: number }

interface Walls { key: string; data: Uint8Array; w: number; h: number; s: number; ox: number; oy: number }
let walls: Walls | null = null

/** tối đa ~2 triệu điểm ảnh cho lớp tường (màn lớn thì hạ độ phân giải) */
const MAX_PX = 2_000_000

function buildWalls(els: El[], view: RegionView, cw: number, ch: number, key: string): Walls {
  if (walls?.key === key) return walls
  const k = Math.min(1, Math.sqrt(MAX_PX / Math.max(1, cw * ch)))
  const w = Math.max(1, Math.round(cw * k)), h = Math.max(1, Math.round(ch * k))
  const s = view.zoom * k
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.setTransform(s, 0, 0, s, view.scrollX * s, view.scrollY * s)
  const rc = rough.canvas(c)
  // nét quá mảnh trên màn hình dễ lọt khe → tối thiểu ~2px
  const minW = 2 / s
  for (const e of els) {
    if (isPage(e) || e.kind === 'text' || e.kind === 'image' || e.region) continue
    drawElement(ctx, rc, {
      ...e, id: `${e.id}~wall`, fill: 'transparent', stroke: '#000', opacity: 100,
      strokeWidth: Math.max(e.strokeWidth, minW), pen: e.pen === 'highlight' ? 'marker' : e.pen,
    })
  }
  const img = ctx.getImageData(0, 0, w, h).data
  const data = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) data[i] = img[i * 4 + 3] > 60 ? 1 : 0
  walls = { key, data, w, h, s, ox: view.scrollX, oy: view.scrollY }
  return walls
}

/** vùng kín: viền ngoài + các lỗ bên trong (vd. hình tròn nhỏ nằm giữa hình vuông), toạ độ cảnh */
export interface Region { outer: Pt[]; holes: Pt[][] }

/** vùng kín chứa p (toạ độ cảnh); null nếu p nằm trên nét hoặc vùng hở */
export function regionAt(els: El[], view: RegionView, cw: number, ch: number, key: string, p: Pt): Region | null {
  const { data, w, h, s, ox, oy } = buildWalls(els, view, cw, ch, key)
  traceW = w
  const x0 = Math.floor((p[0] + ox) * s), y0 = Math.floor((p[1] + oy) * s)
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h || data[y0 * w + x0]) return null

  // loang 4 hướng; chạm mép khung nhìn = vùng hở
  const m = new Uint8Array(w * h)
  const q = new Int32Array(w * h)
  let head = 0, tail = 0
  q[tail++] = y0 * w + x0
  m[y0 * w + x0] = 1
  let bx0 = x0, by0 = y0, bx1 = x0, by1 = y0
  while (head < tail) {
    const i = q[head++]
    const x = i % w, y = (i - x) / w
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return null
    if (x < bx0) bx0 = x; else if (x > bx1) bx1 = x
    if (y < by0) by0 = y; else if (y > by1) by1 = y
    for (const j of [i - 1, i + 1, i - w, i + w]) {
      if (!m[j] && !data[j]) { m[j] = 1; q[tail++] = j }
    }
  }
  if (tail < 30) return null

  // nở vùng vào nửa bề dày nét để màu chui xuống dưới nét, không hở viền trắng
  const grow = Math.max(1, Math.round(1.5 * Math.max(1, s / view.zoom)))
  for (let g = 0; g < grow; g++) {
    const add: number[] = []
    for (let i = 0; i < w * h; i++) {
      if (m[i] || !data[i]) continue
      if (m[i - 1] || m[i + 1] || m[i - w] || m[i + w]) add.push(i)
    }
    for (const i of add) m[i] = 1
  }

  // khung bao của vùng (đã nở), rộng thêm 1px để mép khung chắc chắn nằm ngoài vùng
  const X0 = Math.max(0, bx0 - grow - 1), Y0 = Math.max(0, by0 - grow - 1)
  const X1 = Math.min(w - 1, bx1 + grow + 1), Y1 = Math.min(h - 1, by1 + grow + 1)
  const toScene = (r: Pt[]) => simplify(r, 0.8).map(([x, y]) => [(x + 0.5) / s - ox, (y + 0.5) / s - oy] as Pt)

  const outerRing = traceOuter((x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1, firstIn(m, w, X0, Y0, X1, Y1, 1))
  if (outerRing.length < 4) return null

  // lỗ = phần không thuộc vùng mà không thông ra mép khung: loang "bên ngoài" từ mép khung,
  // phần còn sót lại (bị vùng bao kín) là lỗ
  const lab = new Int32Array(w * h) // 0 chưa xét, -1 bên ngoài, >0 số hiệu lỗ
  head = tail = 0
  const pushOut = (i: number) => { if (!m[i] && !lab[i]) { lab[i] = -1; q[tail++] = i } }
  for (let x = X0; x <= X1; x++) { pushOut(Y0 * w + x); pushOut(Y1 * w + x) }
  for (let y = Y0; y <= Y1; y++) { pushOut(y * w + X0); pushOut(y * w + X1) }
  const inBox = (j: number) => { const x = j % w, y = (j - x) / w; return x >= X0 && x <= X1 && y >= Y0 && y <= Y1 }
  while (head < tail) {
    const i = q[head++]
    for (const j of [i - 1, i + 1, i - w, i + w]) if (inBox(j)) pushOut(j)
  }
  const holes: Pt[][] = []
  let id = 0
  for (let y = Y0 + 1; y < Y1; y++) {
    for (let x = X0 + 1; x < X1; x++) {
      const i0 = y * w + x
      if (m[i0] || lab[i0]) continue
      id++
      head = tail = 0
      lab[i0] = id
      q[tail++] = i0
      while (head < tail) {
        const i = q[head++]
        for (const j of [i - 1, i + 1, i - w, i + w]) if (!m[j] && !lab[j]) { lab[j] = id; q[tail++] = j }
      }
      // bỏ lỗ li ti (vụn nét, chấm nhỏ)
      if (tail < 25) continue
      const k = id
      const ring = traceOuter((xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && lab[yy * w + xx] === k, i0)
      if (ring.length >= 4) holes.push(toScene(ring))
    }
  }
  return { outer: toScene(outerRing), holes }
}

/** điểm đầu tiên (theo hàng) trong khung có giá trị v — nằm trên viền ngoài */
function firstIn(m: Uint8Array, w: number, X0: number, Y0: number, X1: number, Y1: number, v: number) {
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) if (m[y * w + x] === v) return y * w + x
  return -1
}

let traceW = 1
/** đường viền ngoài của một mảng điểm ảnh liền (dò láng giềng Moore, theo chiều kim đồng hồ).
 *  `start` phải là điểm đầu tiên của mảng theo thứ tự hàng → chắc chắn nằm trên viền ngoài */
function traceOuter(inM: (x: number, y: number) => boolean, start: number): Pt[] {
  if (start < 0) return []
  const D: Pt[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
  const w = traceW
  const sx = start % w, sy = (start - sx) / w
  let x = sx, y = sy, back = 4
  const out: Pt[] = [[x, y]]
  for (let n = 0; n < 4_000_000; n++) {
    let moved = false
    for (let k = 1; k <= 8; k++) {
      const d = (back + k) % 8
      const nx = x + D[d][0], ny = y + D[d][1]
      if (inM(nx, ny)) {
        x = nx; y = ny
        back = (d + 4) % 8
        moved = true
        break
      }
    }
    if (!moved || (x === sx && y === sy)) break
    out.push([x, y])
  }
  return out
}

/** Ramer–Douglas–Peucker cho đường khép kín */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 8) return pts
  const rdp = (a: number, b: number, keep: boolean[]) => {
    const [ax, ay] = pts[a], [bx, by] = pts[b]
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1
    let far = -1, best = eps
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len
      if (d > best) { best = d; far = i }
    }
    if (far >= 0) { keep[far] = true; rdp(a, far, keep); rdp(far, b, keep) }
  }
  const mid = Math.floor(pts.length / 2)
  const keep = pts.map(() => false)
  keep[0] = keep[mid] = keep[pts.length - 1] = true
  rdp(0, mid, keep)
  rdp(mid, pts.length - 1, keep)
  return pts.filter((_, i) => keep[i])
}

export function polyArea(pts: Pt[]) {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1])
  return Math.abs(a / 2)
}

/** diện tích phần trong của hình tô được (để biết vùng dò được có phải chính hình đó không) */
export function interiorArea(e: El): number {
  if (e.kind === 'rectangle') return Math.abs(e.w * e.h)
  if (e.kind === 'ellipse') return (Math.PI * Math.abs(e.w * e.h)) / 4
  if (e.kind === 'diamond') return Math.abs(e.w * e.h) / 2
  const lp = closedLoop(e)
  if (!lp) return 0
  return polyArea(lp) - regionHoles(e).reduce((a, r) => a + polyArea(r), 0)
}

export function regionArea(r: Region) {
  return polyArea(r.outer) - r.holes.reduce((a, h) => a + polyArea(h), 0)
}
