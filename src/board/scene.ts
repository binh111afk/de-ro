/**
 * Bảng vẽ — mô hình hình vẽ và hình học.
 * Học theo cách tổ chức của Excalidraw (https://github.com/excalidraw/excalidraw, MIT):
 * `packages/element/src/types.ts`, `bounds.ts`, `collision.ts`, `transformHandles.ts`. Viết lại gọn, không chép nguyên.
 */

export type Kind = 'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'freedraw' | 'text' | 'image'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
export type FillStyle = 'hachure' | 'solid'
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
  const ctx = measureCtx()
  ctx.font = fontOf(fontSize)
  const lines = text.split('\n')
  const w = Math.max(1, ...lines.map((l) => ctx.measureText(l).width))
  return { w: Math.ceil(w), h: Math.ceil(lines.length * fontSize * LINE_HEIGHT) }
}

export const LINE_HEIGHT = 1.25
export const FONT_FAMILY = "'Be Vietnam Pro', system-ui, 'Segoe UI', sans-serif"
export const fontOf = (size: number) => `${size}px ${FONT_FAMILY}`

let _ctx: CanvasRenderingContext2D | null = null
function measureCtx() {
  if (!_ctx) _ctx = document.createElement('canvas').getContext('2d')!
  return _ctx
}
