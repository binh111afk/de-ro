/** Bảng vẽ — kiểu dữ liệu, mặc định, bắt dính khi kéo (dùng chung cho trình soạn và giao diện). */
import { DEFAULT_STYLE, type Bounds, type El, type Handle, type Kind, type Paper, type PenKind, type Pt, type Style, type FillStyle } from './scene'
import { type Guide, type LaserTrail, type View } from './render'
import { useBoards } from '@/store/boards'
import { type InstGuide } from './Instruments'


export type Tool = 'select' | 'hand' | Kind | 'eraser' | 'laser' | 'bucket'
export type Slot = PenKind | 'shape' | 'text'

/** tuỳ chọn của bảng (lưu cùng bản vẽ) */
export interface Opts {
  pen: PenKind
  lastShape: Kind
  paper: Paper
  snap: boolean
  eraseMode: 'stroke' | 'partial'
  eraseSize: number
  selectMode: 'box' | 'lasso'
  recentShapes: Kind[]
  /** hàng màu: màu dùng gần nhất đứng đầu (bút dạ quang có hàng riêng) */
  /** màu gần đây, mỗi công cụ một hàng: bút (recentColors), chữ, hình */
  recentColors: string[]
  recentTextColors: string[]
  recentShapeColors: string[]
  recentHighlights: string[]
  /** màu laser gần đây (màu vừa chọn lên đầu); thiếu ở bảng cũ thì lấy bộ màu laser mặc định */
  recentLaserColors?: string[]
  /** ngòi riêng của từng loại bút */
  penTips: Partial<Record<PenKind, Tip>>
  /** bút laser: màu và độ dày (hệ số) */
  laserColor: string
  laserSize: number
  /** thùng sơn: màu và kiểu tô */
  bucketFill: string
  bucketStyle: FillStyle
  /** hiện đường gióng khi kéo hình */
  guides: boolean
  /** giữ công cụ Hình sau khi vẽ xong */
  keepTool: boolean
  /** đã chuyển hình sang nét thẳng mặc định (bảng lưu trước khi đổi mặc định còn giữ kiểu vẽ tay) */
  shapeStraight?: boolean
}
export interface Tip { sharp: number; sens: number }
export const DEFAULT_TIP: Tip = { sharp: 0.5, sens: 0.5 }
export const CHALK_WHITE = '#f5f3ea'
export const LIGHT_COLORS = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#7048e8']
export const CHALK_COLORS = ['#f5f3ea', '#f7e07a', '#f4a6b8', '#9fd3f5', '#b7e4a7', '#f9b97a']

export const DEFAULT_OPTS: Opts = { pen: 'ball', lastShape: 'rectangle', paper: 'plain', snap: true, eraseMode: 'stroke', eraseSize: 1, selectMode: 'box', recentShapes: ['rectangle', 'ellipse', 'arrow', 'line'], recentColors: [...LIGHT_COLORS], recentTextColors: [...LIGHT_COLORS], recentShapeColors: [...LIGHT_COLORS], recentHighlights: ['#fab005', '#82c91e', '#f783ac', '#4dabf7', '#ff922b'], penTips: {}, laserColor: '#ff3b30', laserSize: 1, bucketFill: '#a5d8ff', bucketStyle: 'solid', guides: true, keepTool: false, shapeStraight: true }

/** mỗi loại bút / hình / chữ nhớ màu và độ dày riêng */
export const DEFAULT_STYLES: Record<Slot, Style> = {
  fountain: { ...DEFAULT_STYLE, strokeWidth: 2, stroke: '#1c3d7a' },
  ball: { ...DEFAULT_STYLE, strokeWidth: 1 },
  brush: { ...DEFAULT_STYLE, strokeWidth: 2 },
  pencil: { ...DEFAULT_STYLE, strokeWidth: 1, stroke: '#495057' },
  marker: { ...DEFAULT_STYLE, stroke: '#1971c2', strokeWidth: 2 },
  chalk: { ...DEFAULT_STYLE, stroke: CHALK_WHITE, strokeWidth: 2 },
  highlight: { ...DEFAULT_STYLE, stroke: '#fab005', strokeWidth: 8, opacity: 40 },
  // hình khối mặc định vẽ thẳng, tô đặc (kiểu vẽ tay vẫn chọn được bằng nút Vẽ tay)
  shape: { ...DEFAULT_STYLE, roughness: 0, fillStyle: 'solid' },
  text: { ...DEFAULT_STYLE },
}
export const ERASE_R = [6, 14, 28]
/** dấu ghi vào clipboard hệ thống khi sao chép hình trong bảng */
export const CLIP_MARK = 'derou-board-copy:'
export const SHAPES: Kind[] = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line']

export interface Saved {
  v: 2
  elements: El[]
  view: View
  styles?: Partial<Record<Slot, Style>>
  opts?: Partial<Opts>
}

/** nội dung bảng trong danh sách bảng vẽ (store/boards — đồng bộ theo tài khoản) */
export function load(id: string): Saved | null {
  const d = useBoards.getState().items.find((b) => b.id === id)?.data as Saved | undefined
  return d && d.v === 2 ? d : null
}

export type Drag =
  | { t: 'pan'; sx: number; sy: number; scrollX: number; scrollY: number }
  | { t: 'create'; el: El; start: Pt; guide?: InstGuide }
  | { t: 'move'; start: Pt; orig: Map<string, Pt>; moved: boolean; origBounds: Bounds | null; candidates: Bounds[] }
  | { t: 'marquee'; start: Pt; cur: Pt; base: Set<string> }
  | { t: 'resize'; handle: Handle; orig: El[]; ob: Bounds; single: boolean }
  | { t: 'endpoint'; index: number; el: El }
  | { t: 'rotate'; el: El; center: Pt }
  | { t: 'erase'; hit: boolean; last: Pt }
  | { t: 'snapped'; el: El; orig: El; center: Pt; dist: number }
  | { t: 'laser'; trail: LaserTrail }
  | { t: 'lasso'; pts: Pt[]; base: Set<string> }

/** tính bắt dính đường gióng & khoảng cách đều theo một trục (axis = 'x' hoặc 'y') */
export function snapAxis(
  mb: Bounds,
  candidates: Bounds[],
  thresh: number,
  axis: 'x' | 'y',
): { delta: number; guides: Guide[] } {
  const i0 = axis === 'x' ? 0 : 1
  const i1 = axis === 'x' ? 2 : 3
  const j0 = axis === 'x' ? 1 : 0
  const j1 = axis === 'x' ? 3 : 2
  const mPts = [mb[i0], (mb[i0] + mb[i1]) / 2, mb[i1]]
  let bestDist = thresh + 1e-6
  let bestDelta = 0
  let snapped = false
  for (const cb of candidates) {
    const cPts = [cb[i0], (cb[i0] + cb[i1]) / 2, cb[i1]]
    for (const mp of mPts) {
      for (const cp of cPts) {
        const d = cp - mp
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); bestDelta = d; snapped = true }
      }
    }
  }
  // nếu chưa hít thẳng hàng, kiểm tra cách đều giữa hai khối kề trái/phải (hoặc trên/dưới) có giao nhau theo trục còn lại
  let gapMatch: { pos: number; a: Bounds; b: Bounds; gap: number } | null = null
  if (!snapped) {
    let left: Bounds | null = null
    let right: Bounds | null = null
    for (const cb of candidates) {
      if (cb[j1] < mb[j0] || cb[j0] > mb[j1]) continue
      if (cb[i1] < mb[i0] && (!left || cb[i1] > left[i1])) left = cb
      if (cb[i0] > mb[i1] && (!right || cb[i0] < right[i0])) right = cb
    }
    if (left && right) {
      const targetCenter = (left[i1] + right[i0]) / 2
      const curCenter = (mb[i0] + mb[i1]) / 2
      const d = targetCenter - curCenter
      if (Math.abs(d) <= thresh) {
        bestDelta = d
        snapped = true
        const gap = (right[i0] - left[i1] - (mb[i1] - mb[i0])) / 2
        if (gap >= 1) {
          const overlap0 = Math.max(mb[j0], Math.min(left[j0], right[j0]))
          const overlap1 = Math.min(mb[j1], Math.max(left[j1], right[j1]))
          gapMatch = { pos: (overlap0 + overlap1) / 2, a: left, b: right, gap }
        }
      }
    }
  }
  if (!snapped) return { delta: 0, guides: [] }
  const guides: Guide[] = []
  const sm0 = mb[i0] + bestDelta, sm1 = mb[i1] + bestDelta, smc = (sm0 + sm1) / 2
  const sPts = [sm0, smc, sm1]
  const eps = 0.01
  const matchedPos = new Set<number>()
  for (const sp of sPts) {
    for (const cb of candidates) {
      for (const cp of [cb[i0], (cb[i0] + cb[i1]) / 2, cb[i1]]) {
        if (Math.abs(sp - cp) <= eps) matchedPos.add(cp)
      }
    }
  }
  for (const pos of matchedPos) {
    let from = mb[j0], to = mb[j1]
    const marks: Pt[] = axis === 'x' ? [[pos, mb[j0]], [pos, mb[j1]]] : [[mb[j0], pos], [mb[j1], pos]]
    for (const cb of candidates) {
      if (Math.abs(cb[i0] - pos) <= eps || Math.abs((cb[i0] + cb[i1]) / 2 - pos) <= eps || Math.abs(cb[i1] - pos) <= eps) {
        from = Math.min(from, cb[j0])
        to = Math.max(to, cb[j1])
        if (axis === 'x') marks.push([pos, cb[j0]], [pos, cb[j1]])
        else marks.push([cb[j0], pos], [cb[j1], pos])
      }
    }
    guides.push({ kind: 'align', axis, pos, from, to, marks })
  }
  if (gapMatch) {
    const lbl = String(Math.round(gapMatch.gap))
    guides.push(
      { kind: 'gap', axis, pos: gapMatch.pos, from: gapMatch.a[i1], to: sm0, label: lbl },
      { kind: 'gap', axis, pos: gapMatch.pos, from: sm1, to: gapMatch.b[i0], label: lbl },
    )
  }
  return { delta: bestDelta, guides }
}

export function computeSnap(
  origBounds: Bounds,
  dx: number,
  dy: number,
  candidates: Bounds[],
  thresh: number,
  lockAxis: 'x' | 'y' | null,
): { dx: number; dy: number; guides: Guide[] } {
  const mb: Bounds = [origBounds[0] + dx, origBounds[1] + dy, origBounds[2] + dx, origBounds[3] + dy]
  const rx = lockAxis === 'y' ? { delta: 0, guides: [] } : snapAxis(mb, candidates, thresh, 'x')
  const ry = lockAxis === 'x' ? { delta: 0, guides: [] } : snapAxis(mb, candidates, thresh, 'y')
  return { dx: dx + rx.delta, dy: dy + ry.delta, guides: [...rx.guides, ...ry.guides] }
}

export const TOOL_KEYS: Record<string, Tool> = {
  '1': 'select', v: 'select', h: 'hand', '2': 'rectangle', r: 'rectangle', '3': 'diamond', d: 'diamond',
  '4': 'ellipse', o: 'ellipse', '5': 'arrow', a: 'arrow', '6': 'line', l: 'line', '7': 'freedraw', p: 'freedraw',
  '8': 'text', t: 'text', '0': 'eraser', e: 'eraser', k: 'laser', g: 'bucket',
}
export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl'
export const SHAPE_KEYS: Partial<Record<Kind, string>> = { rectangle: 'R', diamond: 'D', ellipse: 'O', arrow: 'A', line: 'L' }

export const FILLS = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', '#fa5252', '#40c057', '#228be6', '#fab005', '#be4bdb']

export const CURSOR: Partial<Record<Handle, string>> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', rot: 'grab', p0: 'move', p1: 'move',
}
