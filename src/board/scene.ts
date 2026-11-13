/**
 * Bảng vẽ — mô hình hình vẽ và hình học.
 * Học theo cách tổ chức của Excalidraw (https://github.com/excalidraw/excalidraw, MIT):
 * `packages/element/src/types.ts`, `bounds.ts`, `collision.ts`, `transformHandles.ts`. Viết lại gọn, không chép nguyên.
 */

export type Kind = 'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'freedraw' | 'text' | 'image'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
/** glass: nền màu trong suốt có vệt sáng như mặt kính (vẽ riêng, không qua rough) */
export type FillStyle = 'hachure' | 'solid' | 'glass'
export type Pt = [number, number]
export type PenKind = 'fountain' | 'ball' | 'brush' | 'pencil' | 'marker' | 'highlight'
export type Paper = 'plain' | 'grid' | 'lines' | 'dots'

export interface Style {
  stroke: string
  fill: string
  fillStyle: FillStyle
  strokeWidth: number
  strokeStyle: StrokeStyle
  roughness: number
  opacity: number
  fontSize: number
}

export interface El extends Style {
  id: string
  kind: Kind
  x: number
  y: number
  /** hình khối, chữ: kích thước; đường/nét bút: tính lại từ points */
  w: number
  h: number
  angle: number
  seed: number
  /** đường, mũi tên, nét bút: toạ độ so với (x, y) */
  points?: Pt[]
  /** nét bút vẽ bằng bút cảm ứng: lực nhấn từng điểm (0–1); không có thì giả lập */
  pressures?: number[]
  /** nét bút: loại bút (bút bi / bút dạ / dạ quang) */
  pen?: PenKind
  /** ngòi bút: độ nhọn (thon hai đầu) và độ nhạy lực nhấn, 0–1 */
  tipSharp?: number
  tipSens?: number
  text?: string
  /** ảnh (đồ thị, hình học… từ panel Công cụ): data URL */
  src?: string
  /** ảnh là công thức: mã LaTeX gốc (bấm đúp để sửa); màu chữ ở `stroke` */
  latex?: string
  /** trang của PDF mở để ghi chú: số trang và khổ gốc (điểm PDF). Trang khoá làm nền: không chọn / kéo / gôm được */
  page?: { n: number; w: number; h: number }
  /** mảng màu do thùng sơn tạo từ vùng kín giữa nhiều nét: không có nét, chỉ có nền */
  region?: boolean
  /** mảng màu có lỗ: vị trí bắt đầu từng vòng lỗ trong `points` (vòng ngoài = đoạn đầu).
   *  Lỗ nằm chung `points` nên di chuyển / đổi cỡ tự đi theo */
  holes?: number[]
  /** nhóm: các hình cùng groupId chọn / kéo / đổi cỡ cùng nhau */
  groupId?: string
  /** hình do công cụ vẽ dựng ra: ToolDoc (JSON) — chỉ ghi ở một phần tử của nhóm; bấm đúp để sửa lại */
  tool?: string
  /** chữ: căn dòng trong khung */
  align?: 'left' | 'center' | 'right'
  /** tăng mỗi khi hình dạng đổi (không tính di chuyển) — khoá cache nét rough */
  ver: number
}

export type Bounds = [number, number, number, number]

export const DEFAULT_STYLE: Style = {
  stroke: '#1e1e1e',
  fill: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  fontSize: 24,
}

export const newId = () => Math.random().toString(36).slice(2, 10)
export const newSeed = () => Math.floor(Math.random() * 2 ** 31)
export const hasPoints = (e: El) => e.kind === 'line' || e.kind === 'arrow' || e.kind === 'freedraw'
export const isPage = (e: El) => !!e.page
/** nét vẽ tay khép kín — tô màu được như hình khối. Kín khi: hai đầu gần nhau, hoặc nét tự cắt chính nó
 *  (vẽ lố qua điểm đầu như dấu +), hoặc một đầu chạm lại thân nét. Cache theo `ver`. */
const loopCache = new WeakMap<El, { ver: number; v: Pt[] | null }>()
/** các vòng lỗ của mảng màu (toạ độ trong hình) */
export function regionHoles(e: El): Pt[][] {
  const pts = e.points, hs = e.holes
  if (!e.region || !pts || !hs?.length) return []
  return hs.map((st, i) => pts.slice(st, hs[i + 1] ?? pts.length))
}
export function isClosedStroke(e: El) {
  return !!closedLoop(e)
}
/** phần vòng kín của nét (đã cắt đuôi thừa trước/sau chỗ nét tự cắt) — chỉ vùng này được tô */
export function closedLoop(e: El): Pt[] | null {
  const pts = e.points
  if (e.kind === 'line') return isClosedLine(e) ? pts!.slice(0, -1) : null
  if (e.kind !== 'freedraw' || !pts || pts.length < 3) return null
  if (e.region) return e.holes?.length ? pts.slice(0, e.holes[0]) : pts
  if (pts.length < 8) return null
  const c = loopCache.get(e)
  if (c && c.ver === e.ver) return c.v
  const v = computeLoop(e, pts)
  loopCache.set(e, { ver: e.ver, v })
  return v
}
/** giao điểm hai đoạn ab, cd (null nếu không cắt) */
function segCross(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const o = (p: Pt, q: Pt, r: Pt) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
  const d1 = o(a, b, c), d2 = o(a, b, d)
  if (d1 * d2 >= 0 || o(c, d, a) * o(c, d, b) >= 0) return null
  const t = d1 / (d1 - d2)
  return [c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t]
}
function computeLoop(e: El, pts: Pt[]): Pt[] | null {
  const [x1, y1, x2, y2] = localBounds(e)
  const size = Math.hypot(x2 - x1, y2 - y1)
  if (size < 20) return null
  const n = pts.length, a = pts[0], b = pts[n - 1]
  const k = Math.floor(n * 0.4)
  // 1. nét tự cắt: lấy chỗ cắt ngoài cùng (đoạn đầu sớm nhất × đoạn cuối muộn nhất) → vòng = giao điểm + phần giữa
  for (let i = 0; i < k; i++) {
    for (let j = n - 2; j >= n - k && j > i + 1; j--) {
      const x = segCross(pts[i], pts[i + 1], pts[j], pts[j + 1])
      if (x) return [x, ...pts.slice(i + 1, j + 1)]
    }
  }
  // 2. hai đầu gần nhau
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < Math.max(16, size * 0.2)) return pts
  // 3. một đầu chạm lại thân nét: bỏ đoạn đuôi phía trước / phía sau điểm chạm
  const th = Math.max(12, size * 0.08)
  for (let i = 0; i < k; i++) if (Math.hypot(b[0] - pts[i][0], b[1] - pts[i][1]) < th) return pts.slice(i)
  for (let i = n - 1; i >= n - k; i--) if (Math.hypot(a[0] - pts[i][0], a[1] - pts[i][1]) < th) return pts.slice(0, i + 1)
  return null
}
/** đường gấp khúc khép kín (điểm cuối trùng điểm đầu) — tô được như đa giác */
export function isClosedLine(e: El) {
  const p = e.points
  if (e.kind !== 'line' || !p || p.length < 4) return false
  const a = p[0], b = p[p.length - 1]
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5
}

/** thêm vào tập chọn mọi hình cùng nhóm với hình đã có trong tập */
export function withGroups(els: El[], ids: Set<string>): Set<string> {
  const gs = new Set(els.filter((e) => e.groupId && ids.has(e.id)).map((e) => e.groupId))
  if (!gs.size) return ids
  const out = new Set(ids)
  for (const e of els) if (e.groupId && gs.has(e.groupId)) out.add(e.id)
  return out
}

/** bản sao (nhân đôi / dán): id, seed mới; nhóm cũng được đổi id để bản sao là nhóm riêng */
export function copyEls(src: El[], dx: number, dy: number): El[] {
  const gmap = new Map<string, string>()
  return src.map((e) => {
    const c = { ...clone(e), id: newId(), seed: newSeed(), x: e.x + dx, y: e.y + dy }
    if (e.groupId) {
      if (!gmap.has(e.groupId)) gmap.set(e.groupId, newId())
      c.groupId = gmap.get(e.groupId)
    }
    return c
  })
}

export const isLinear = (e: El) => e.kind === 'line' || e.kind === 'arrow'

export function clone(e: El): El {
  return { ...e, points: e.points?.map((p) => [p[0], p[1]] as Pt), pressures: e.pressures?.slice() }
}

/** đổi thuộc tính; chỉ đổi x/y thì không cần vẽ lại nét rough */
export function mutate(e: El, patch: Partial<El>) {
  Object.assign(e, patch)
  if (Object.keys(patch).some((k) => k !== 'x' && k !== 'y')) e.ver++
}

/** khung chưa xoay (toạ độ cảnh) */
export function localBounds(e: El): Bounds {
  if (e.points?.length) {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity
    for (const [px, py] of e.points) {
      x1 = Math.min(x1, px); y1 = Math.min(y1, py); x2 = Math.max(x2, px); y2 = Math.max(y2, py)
    }
    return [e.x + x1, e.y + y1, e.x + x2, e.y + y2]
  }
  return [e.x, e.y, e.x + e.w, e.y + e.h]
}

export function centerOf(e: El): Pt {
  const [x1, y1, x2, y2] = localBounds(e)
  return [(x1 + x2) / 2, (y1 + y2) / 2]
}

export function rotate(p: Pt, c: Pt, a: number): Pt {
  if (!a) return p
  const cos = Math.cos(a), sin = Math.sin(a)
  const dx = p[0] - c[0], dy = p[1] - c[1]
  return [c[0] + dx * cos - dy * sin, c[1] + dx * sin + dy * cos]
}

/** khung bao sau khi xoay */
export function worldBounds(e: El): Bounds {
  const [x1, y1, x2, y2] = localBounds(e)
  if (!e.angle) return [x1, y1, x2, y2]
  const c = centerOf(e)
  const pts = ([[x1, y1], [x2, y1], [x2, y2], [x1, y2]] as Pt[]).map((p) => rotate(p, c, e.angle))
  return [
    Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])),
    Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])),
  ]
}

export function unionBounds(els: El[]): Bounds | null {
  if (!els.length) return null
  const bs = els.map(worldBounds)
  return [
    Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1])),
    Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3])),
  ]
}

function distToSeg(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = dx * dx + dy * dy
  const t = len ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

export function inPolygon(p: Pt, poly: Pt[]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** điểm p (toạ độ cảnh) có chạm hình không; tol đã chia cho zoom */
export function hitTest(e: El, p: Pt, tol: number): boolean {
  const q = rotate(p, centerOf(e), -e.angle)
  const t = tol + e.strokeWidth / 2
  const filled = e.fill !== 'transparent'
  const [x1, y1, x2, y2] = localBounds(e)
  if (q[0] < x1 - t || q[0] > x2 + t || q[1] < y1 - t || q[1] > y2 + t) return false

  switch (e.kind) {
    case 'text':
    case 'image':
      return true
    case 'rectangle': {
      if (filled) return true
      const c: Pt[] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
      return c.some((a, i) => distToSeg(q, a, c[(i + 1) % 4]) <= t)
    }
    case 'diamond': {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2
      const c: Pt[] = [[cx, y1], [x2, cy], [cx, y2], [x1, cy]]
      if (filled && inPolygon(q, c)) return true
      return c.some((a, i) => distToSeg(q, a, c[(i + 1) % 4]) <= t)
    }
    case 'ellipse': {
      const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2
      if (rx < 1 || ry < 1) return true
      const nx = (q[0] - x1 - rx) / rx, ny = (q[1] - y1 - ry) / ry
      const d = Math.hypot(nx, ny)
      if (filled && d <= 1) return true
      return Math.abs(d - 1) * Math.min(rx, ry) <= t
    }
    default: {
      {
        const lp = filled ? closedLoop(e) : null
        const lq: Pt = [q[0] - e.x, q[1] - e.y]
        if (lp && inPolygon(lq, lp)) {
          if (!regionHoles(e).some((r) => inPolygon(lq, r))) return true
          if (e.region) return false
        }
      }
      const pts = (e.points ?? []).map(([px, py]) => [e.x + px, e.y + py] as Pt)
      if (pts.length === 1) return Math.hypot(q[0] - pts[0][0], q[1] - pts[0][1]) <= t
      for (let i = 0; i < pts.length - 1; i++) if (distToSeg(q, pts[i], pts[i + 1]) <= t) return true
      return false
    }
  }
}

/* ---------- tay nắm đổi cỡ / xoay ---------- */

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rot' | 'p0' | 'p1'

/** vị trí tay nắm trong hệ toạ độ của khung (chưa xoay) */
export function handlePositions(b: Bounds, zoom: number, withRotate: boolean): Partial<Record<Handle, Pt>> {
  const [x1, y1, x2, y2] = b
  const pad = 6 / zoom
  const l = x1 - pad, r = x2 + pad, t = y1 - pad, bt = y2 + pad
  const mx = (l + r) / 2, my = (t + bt) / 2
  const h: Partial<Record<Handle, Pt>> = {
    nw: [l, t], n: [mx, t], ne: [r, t], e: [r, my], se: [r, bt], s: [mx, bt], sw: [l, bt], w: [l, my],
  }
  // khung quá nhỏ thì bỏ tay nắm giữa cạnh cho đỡ chồng nhau
  if ((r - l) * zoom < 40) { delete h.n; delete h.s }
  if ((bt - t) * zoom < 40) { delete h.e; delete h.w }
  if (withRotate) h.rot = [mx, t - 22 / zoom]
  return h
}

export function measureText(text: string, fontSize: number): { w: number; h: number } {
  const lines = text.split('\n')
  const w = Math.max(1, ...lines.map((l) => lineWidth(l, fontSize)))
  return { w: Math.ceil(w), h: Math.ceil(lines.length * fontSize * LINE_HEIGHT) }
}

/** một đoạn chữ cùng kiểu: 0 thường, 1 chỉ số trên, -1 chỉ số dưới */
export interface Run { t: string; lv: 0 | 1 | -1 }
/** tách chỉ số: `H_2O`, `x^2`, `3d^{6}`, `T_{1}`, `x^12`. Không có `_`/`^` thì là một đoạn thường.
 *  Viết `\_` / `\^` để giữ nguyên ký tự. */
export function textRuns(line: string): Run[] {
  if (!/[_^]/.test(line)) return [{ t: line, lv: 0 }]
  const out: Run[] = []
  let buf = ''
  const push = (t: string, lv: Run['lv']) => {
    if (!t) return
    const last = out[out.length - 1]
    if (last && last.lv === lv) last.t += t
    else out.push({ t, lv })
  }
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '\\' && (line[i + 1] === '_' || line[i + 1] === '^')) { buf += line[++i]; continue }
    if ((ch === '_' || ch === '^') && i + 1 < line.length) {
      let arg: string
      if (line[i + 1] === '{') {
        const end = line.indexOf('}', i + 2)
        if (end < 0) { buf += ch; continue }
        arg = line.slice(i + 2, end)
        i = end
      } else if (/[\p{L}\p{N}+\-−*′']/u.test(line[i + 1])) {
        // một ký tự; số thì lấy cả dãy số
        let j = i + 1
        if (/\d/.test(line[j])) while (j + 1 < line.length && /\d/.test(line[j + 1])) j++
        arg = line.slice(i + 1, j + 1)
        i = j
      } else { buf += ch; continue }
      push(buf, 0); buf = ''
      push(arg, ch === '^' ? 1 : -1)
      continue
    }
    buf += ch
  }
  push(buf, 0)
  return out
}
export const SUB_SCALE = 0.68
export function lineWidth(line: string, fontSize: number) {
  const ctx = measureCtx()
  let w = 0
  for (const r of textRuns(line)) {
    ctx.font = fontOf(r.lv ? fontSize * SUB_SCALE : fontSize)
    w += ctx.measureText(r.t).width
  }
  return w
}

export const LINE_HEIGHT = 1.25
export const FONT_FAMILY = "'Be Vietnam Pro', system-ui, 'Segoe UI', sans-serif"
export const fontOf = (size: number) => `${size}px ${FONT_FAMILY}`

let _ctx: CanvasRenderingContext2D | null = null
function measureCtx() {
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d')!
  return _ctx
}
