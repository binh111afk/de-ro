/**
 * Bảng vẽ — trình soạn (một tab trong ComposeDoc).
 * Cách tương tác học theo Excalidraw (https://github.com/excalidraw/excalidraw, MIT):
 * công cụ + phím tắt số, kéo để tạo, tay nắm đổi cỡ/xoay, kéo khung chọn, Space/chuột giữa để cuộn,
 * Ctrl + lăn chuột để phóng to. Giao diện viết lại bằng tiếng Việt theo token của app.
 * Nội dung tự lưu trong localStorage theo id tab.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  alignBlocks, centerOf, clone, DEFAULT_STYLE, groupBlocks, handlePositions, hasPoints, hitTest, isLinear, isPage, localBounds, measureText,
  mutate, newId, newSeed, rotate, unionBounds, worldBounds, fontOf, LINE_HEIGHT, inPolygon,
  type AlignKind, type Bounds, type El, type Handle, type Kind, type Paper, type PenKind, type Pt, type Style,
  isClosedStroke, type FillStyle, withGroups, copyEls,
} from './scene'
import { dropFromCache, LASER_LIFE, penOutline, render, renderLive, setImageLoadHandler, svgPathFromStroke, type Guide, type LaserTrail, type View } from './render'
import { AiPanel } from '@/examEditor/AiPanel'
import { ToolsPanel } from '@/examEditor/tools/ToolsPanel'
import { svgDataUrl } from '@/lib/plot'
import { renderTool, readToolDoc, parseToolJson, type ToolDoc, type ToolImage } from '@/lib/toolSpec'
import { ToolModal } from '@/examEditor/tools/ToolModal'
import { svgToElements } from './svgImport'
import { createPortal } from 'react-dom'
import { interiorArea, regionArea, regionAt, type Region } from './regionFill'
import { figureDoc } from '@/examEditor/toolImages'
import { attachToAi, type AiRef } from '@/lib/aiAttach'
import { recognize } from './recognize'
import { ExportDialog, FormulaDialog, PdfPagesDialog, type ExportChoice, type FormulaResult } from './BoardDialogs'
import { canvasToA4Pdf, download, openPdf, pagesToPdf, pdfPageSize, readImageFile, renderPdfPage, renderRegion, savePng, type Picture } from './io'
import { cachedSrc, IDB_PREFIX, stash, unstash } from './imgStore'
import { useBoards, type BoardData } from '@/store/boards'
import { splitTipKbd } from '@/components/Tooltip'
import { texToSvg } from './formula'
import { bindToScene, guideAt, Instruments, placeInstrument, projectGuide, type InstApi, type InstGuide, type InstKind, type InstState } from './Instruments'

type Tool = 'select' | 'hand' | Kind | 'eraser' | 'laser' | 'bucket'
type Slot = PenKind | 'shape' | 'text'

/** tuỳ chọn của bảng (lưu cùng bản vẽ) */
interface Opts {
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
}
interface Tip { sharp: number; sens: number }
const DEFAULT_TIP: Tip = { sharp: 0.5, sens: 0.5 }
const DEFAULT_OPTS: Opts = { pen: 'ball', lastShape: 'rectangle', paper: 'plain', snap: true, eraseMode: 'stroke', eraseSize: 1, selectMode: 'box', recentShapes: ['rectangle', 'ellipse', 'arrow', 'line'], recentColors: ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#7048e8'], recentTextColors: ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#7048e8'], recentShapeColors: ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#7048e8'], recentHighlights: ['#fab005', '#82c91e', '#f783ac', '#4dabf7', '#ff922b'], penTips: {}, laserColor: '#ff3b30', laserSize: 1, bucketFill: '#a5d8ff', bucketStyle: 'solid', guides: true, keepTool: false }

/** mỗi loại bút / hình / chữ nhớ màu và độ dày riêng */
const DEFAULT_STYLES: Record<Slot, Style> = {
  fountain: { ...DEFAULT_STYLE, strokeWidth: 2, stroke: '#1c3d7a' },
  ball: { ...DEFAULT_STYLE, strokeWidth: 1 },
  brush: { ...DEFAULT_STYLE, strokeWidth: 2 },
  pencil: { ...DEFAULT_STYLE, strokeWidth: 1, stroke: '#495057' },
  marker: { ...DEFAULT_STYLE, stroke: '#1971c2', strokeWidth: 2 },
  highlight: { ...DEFAULT_STYLE, stroke: '#fab005', strokeWidth: 8, opacity: 40 },
  shape: { ...DEFAULT_STYLE },
  text: { ...DEFAULT_STYLE },
}
const ERASE_R = [6, 14, 28]
/** dấu ghi vào clipboard hệ thống khi sao chép hình trong bảng */
const CLIP_MARK = 'derou-board-copy:'
const SHAPES: Kind[] = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line']

interface Saved {
  v: 2
  elements: El[]
  view: View
  styles?: Partial<Record<Slot, Style>>
  opts?: Partial<Opts>
}

/** nội dung bảng trong danh sách bảng vẽ (store/boards — đồng bộ theo tài khoản) */
function load(id: string): Saved | null {
  const d = useBoards.getState().items.find((b) => b.id === id)?.data as Saved | undefined
  return d && d.v === 2 ? d : null
}

type Drag =
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
function snapAxis(
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

function computeSnap(
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

const TOOL_KEYS: Record<string, Tool> = {
  '1': 'select', v: 'select', h: 'hand', '2': 'rectangle', r: 'rectangle', '3': 'diamond', d: 'diamond',
  '4': 'ellipse', o: 'ellipse', '5': 'arrow', a: 'arrow', '6': 'line', l: 'line', '7': 'freedraw', p: 'freedraw',
  '8': 'text', t: 'text', '0': 'eraser', e: 'eraser', k: 'laser', g: 'bucket',
}
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl'
const SHAPE_KEYS: Partial<Record<Kind, string>> = { rectangle: 'R', diamond: 'D', ellipse: 'O', arrow: 'A', line: 'L' }

const FILLS = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', '#fa5252', '#40c057', '#228be6', '#fab005', '#be4bdb']

const CURSOR: Partial<Record<Handle, string>> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', rot: 'grab', p0: 'move', p1: 'move',
}

export default function BoardEditor({ id }: { id: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  /** tăng mỗi khi cảnh đổi — khoá cache lớp "tường" của thùng sơn */
  const sceneVer = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /** canvas trong suốt nằm trên, chỉ vẽ nét bút đang viết */
  const liveRef = useRef<HTMLCanvasElement>(null)
  const live = useRef<El | null>(null)
  const liveRaf = useRef(0)
  const saved = useRef(load(id))
  const els = useRef<El[]>(saved.current?.elements ?? [])
  const view = useRef<View>(saved.current?.view ?? { scrollX: 0, scrollY: 0, zoom: 1 })
  const styles = useRef<Record<Slot, Style>>({ ...DEFAULT_STYLES, ...saved.current?.styles })
  const opts = useRef<Opts>({ ...DEFAULT_OPTS, ...saved.current?.opts })
  const selected = useRef<Set<string>>(new Set())
  const drag = useRef<Drag | null>(null)
  const touches = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinching = useRef(false)
  const penSeen = useRef(false)
  const hold = useRef<{ timer: number; x: number; y: number }>({ timer: 0, x: 0, y: 0 })
  const space = useRef(false)
  const clipboard = useRef<El[]>([])
  const clipMark = useRef('')
  const pasteFallback = useRef(0)
  const undoStack = useRef<string[]>([JSON.stringify(els.current)])
  const redoStack = useRef<string[]>([])

  const [tool, setTool] = useState<Tool>('freedraw')
  const toolRef = useRef<Tool>('freedraw')
  const [editing, setEditing] = useState<{ el: El; isNew: boolean } | null>(null)
  const editingRef = useRef<typeof editing>(null)
  editingRef.current = editing
  const [, setTick] = useState(0)
  const [pop, setPop] = useState<string | null>(null)
  /** hiệu ứng hiện/ẩn thanh nổi hàng 3 khi chọn/bỏ chọn */
  const [selBarMounted, setSelBarMounted] = useState(false)
  const [selBarVisible, setSelBarVisible] = useState(false)
  const lastSelActionsRef = useRef<ReactNode>(null)
  /** ô Tô nền: mở bảng màu đầy đủ */
  const [moreFill, setMoreFill] = useState(false)
  /** panel bên: trợ lý (trái), công cụ (phải) */
  const [side, setSide] = useState<SideTab | null>(null)
  const [dialog, setDialog] = useState<{ t: 'formula'; el?: El } | { t: 'pdf'; file: File } | { t: 'export' } | { t: 'tool'; doc: ToolDoc; ids: string[] } | null>(null)
  const dialogRef = useRef(dialog)
  dialogRef.current = dialog
  const [saveErr, setSaveErr] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState('')
  /** đã từng mở tab nào: giữ nội dung (lịch sử trò chuyện) khi đóng / đổi tab */
  const [mounted, setMounted] = useState<Set<SideTab>>(new Set())
  const toggleSide = (t: SideTab) => {
    setMounted((m) => (m.has(t) ? m : new Set(m).add(t)))
    setSide((cur) => (cur === t ? null : t))
  }
  const bump = useCallback(() => setTick((t) => t + 1), [])

  /** kiểu nét đang dùng — theo công cụ (và loại bút) hiện tại */
  const slot = (): Slot => {
    const t = toolRef.current
    return t === 'freedraw' ? opts.current.pen : t === 'text' ? 'text' : 'shape'
  }
  const style = {
    get current() { return styles.current[slot()] },
    set current(v: Style) { styles.current[slot()] = v },
  }
  /** con trỏ: bút = chấm tròn đúng màu và cỡ nét, gôm = cục gôm, laser = chấm đỏ */
  const toolCursor = () => {
    const t = toolRef.current
    if (t === 'freedraw') {
      const st = style.current
      const d = Math.max(4, Math.min(24, st.strokeWidth * 2.6 * view.current.zoom))
      const n = Math.ceil(d) + 4, r = d / 2, c = n / 2
      const fill = st.stroke
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}"><circle cx="${c}" cy="${c}" r="${r}" fill="${fill}" fill-opacity="${st.opacity / 100}" stroke="white" stroke-width="1.2"/></svg>`
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${c} ${c}, crosshair`
    }
    if (t === 'eraser') return `url("data:image/svg+xml,${encodeURIComponent(ERASER_SVG)}") 6 22, cell`
    if (t === 'bucket') return `url("data:image/svg+xml,${encodeURIComponent(BUCKET_SVG.replaceAll('#4dabf7', opts.current.bucketFill === 'transparent' ? '#ffffff' : opts.current.bucketFill))}") 4 21, crosshair`
    if (t === 'laser') return `url("data:image/svg+xml,${encodeURIComponent(LASER_SVG.replaceAll('#ff3b30', opts.current.laserColor))}") 9 9, crosshair`
    if (t === 'text') return 'text'
    if (t === 'hand') return 'grab'
    if (t === 'select') return 'default'
    return 'crosshair'
  }
  const laser = useRef<LaserTrail[]>([])
  const lasso = useRef<Pt[] | null>(null)
  const eraserAt = useRef<Pt | null>(null)
  /** thùng sơn / kéo màu: hình sắp được tô (xem trước) và hiệu ứng màu lan */
  const fillHover = useRef<{ el: El; color: string } | null>(null)
  const spread = useRef<{ id: string; prev: El; p: Pt; t0: number; rMax: number } | null>(null)

  /* ---------- vẽ + lưu ---------- */

  const raf = useRef(0)
  const marquee = useRef<Bounds | null>(null)
  const guidesRef = useRef<Guide[]>([])
  /** vẽ ngay (đồng bộ) */
  const paint = useCallback(() => {
    {
      const c = canvasRef.current
      if (!c) return
      const now = performance.now()
      const active = drag.current?.t === 'laser' ? drag.current.trail : null
      for (const tr of laser.current) {
        let i = 0
        while (i < tr.ts.length && now - tr.ts[i] > LASER_LIFE) i++
        if (i) { tr.pts.splice(0, i); tr.ts.splice(0, i) }
      }
      laser.current = laser.current.filter((tr) => tr.pts.length || tr === active)
      const z = view.current.zoom
      const t = toolRef.current
      const lv = live.current
      // lan xong thì thôi vẽ bản cũ bên dưới (gạch chéo / kính sẽ lộ màu cũ)
      if (spread.current && now - spread.current.t0 >= SPREAD_MS) spread.current = null
      const sp = spread.current
      const spT = sp ? Math.min(1, (now - sp.t0) / SPREAD_MS) : 0
      render(c, lv ? els.current.filter((e) => e !== lv) : els.current, view.current, {
        selected: els.current.filter((e) => selected.current.has(e.id)),
        marquee: marquee.current,
        hiddenId: editingRef.current?.el.id ?? null,
        paper: opts.current.paper,
        lasso: lasso.current,
        laser: laser.current,
        eraser: eraserAt.current && (t === 'eraser' || drag.current?.t === 'erase')
          ? { p: eraserAt.current, r: ERASE_R[opts.current.eraseSize] / z } : null,
        guides: guidesRef.current,
        fillHover: fillHover.current,
        spread: sp ? { id: sp.id, prev: sp.prev, p: sp.p, r: sp.rMax * (1 - (1 - spT) ** 3) } : null,
      })
      if (liveRef.current) renderLive(liveRef.current, lv, view.current)
      // dụng cụ hình học đi theo vùng nhìn
      instG.current?.setAttribute('transform', `scale(${z}) translate(${view.current.scrollX} ${view.current.scrollY})`)
      // laser còn vệt thì vẽ tiếp khung sau để mờ dần
      if (laser.current.some((tr) => tr.pts.length)) redrawRef.current()
      // màu đang lan / viền xem trước đang chạy → vẽ tiếp
      else if (spread.current || fillHover.current) redrawRef.current()
    }
  }, [])
  /** vẽ ở khung hình kế tiếp (gộp nhiều lần gọi) */
  const redraw = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(paint)
  }, [paint])
  const redrawRef = useRef(redraw)
  /** chỉ vẽ lại nét đang viết */
  const redrawLive = useCallback(() => {
    cancelAnimationFrame(liveRaf.current)
    liveRaf.current = requestAnimationFrame(() => { if (liveRef.current) renderLive(liveRef.current, live.current, view.current) })
  }, [])

  const saveTimer = useRef(0)
  const persist = useCallback(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(async () => {
      try {
        // ảnh lớn (ảnh chèn, trang PDF) cất vào IndexedDB, bản lưu chỉ giữ khoá
        const elements = await Promise.all(els.current.map(async (e) => (e.src ? { ...e, src: await stash(e.src) } : e)))
        const data: Saved = { v: 2, elements, view: view.current, styles: styles.current, opts: opts.current }
        useBoards.getState().save(id, data as unknown as BoardData)
        setSaveErr(false)
      } catch {
        // đầy bộ nhớ trình duyệt (thường do ảnh / PDF lớn): báo để người dùng biết bảng chưa được lưu
        setSaveErr(true)
      }
    }, 400)
  }, [id])

  const changed = useCallback(() => {
    sceneVer.current++
    redraw()
    persist()
    bump()
  }, [redraw, persist, bump])

  /** chốt một bước vào lịch sử hoàn tác (chỉ khi thật sự đổi) */
  const commit = useCallback(() => {
    const snap = JSON.stringify(els.current)
    if (snap === undoStack.current[undoStack.current.length - 1]) return
    undoStack.current.push(snap)
    if (undoStack.current.length > 200) undoStack.current.shift()
    redoStack.current = []
    changed()
  }, [changed])

  const restore = (snap: string) => {
    els.current = JSON.parse(snap)
    for (const e of els.current) {
      if (e.src?.startsWith(IDB_PREFIX)) e.src = cachedSrc(e.src) ?? e.src
      dropFromCache(e.id)
    }
    const ids = new Set(els.current.map((e) => e.id))
    selected.current = new Set([...selected.current].filter((s) => ids.has(s)))
    changed()
  }
  const undo = () => {
    if (undoStack.current.length < 2) return
    redoStack.current.push(undoStack.current.pop()!)
    restore(undoStack.current[undoStack.current.length - 1])
  }
  const redo = () => {
    const s = redoStack.current.pop()
    if (!s) return
    undoStack.current.push(s)
    restore(s)
  }

  /* ---------- mở bảng: đọc ảnh lớn từ IndexedDB ---------- */

  useEffect(() => {
    const need = els.current.filter((e) => e.src?.startsWith(IDB_PREFIX))
    if (!need.length) return
    void Promise.all(need.map(async (e) => {
      const src = await unstash(e.src!).catch(() => '')
      if (src) { e.src = src; dropFromCache(e.id) }
    })).then(() => redraw())
  }, [redraw])

  /* ---------- kích thước canvas ---------- */

  useEffect(() => {
    const wrap = wrapRef.current, c = canvasRef.current
    if (!wrap || !c) return
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1
      c.width = Math.round(wrap.clientWidth * dpr)
      c.height = Math.round(wrap.clientHeight * dpr)
      c.style.width = `${wrap.clientWidth}px`
      c.style.height = `${wrap.clientHeight}px`
      const lc = liveRef.current
      if (lc) { lc.width = c.width; lc.height = c.height }
      // đổi cỡ canvas xoá trắng nó: vẽ lại ngay trong cùng khung hình, không đợi khung sau (tránh chớp khi panel trượt)
      cancelAnimationFrame(raf.current)
      paint()
    })
    ro.observe(wrap)
    // phông chữ tải xong thì đo / vẽ lại chữ
    document.fonts?.ready.then(() => {
      for (const e of els.current) if (e.kind === 'text') mutate(e, measureText(e.text ?? '', e.fontSize, e))
      redraw()
    })
    return () => ro.disconnect()
  }, [redraw, paint])

  /* ---------- dụng cụ hình học (thước kẻ, thước đo góc, compa) ---------- */

  const [inst, setInst] = useState<InstState>({})
  const instRef = useRef(inst)
  instRef.current = inst
  const instG = useRef<SVGGElement>(null)
  useLayoutEffect(() => { redraw() }, [inst, redraw])
  const toggleInst = (k: InstKind) => setInst((s) => {
    if (s[k]) { const n = { ...s }; delete n[k]; return n }
    const c = canvasRef.current, v = view.current
    const center: Pt = [(c?.clientWidth ?? 800) / 2 / v.zoom - v.scrollX, (c?.clientHeight ?? 600) / 2 / v.zoom - v.scrollY]
    return { ...s, [k]: placeInstrument(k, center) }
  })
  /** compa vẽ cung: một nét bút bình thường (kiểu bút đang chọn) */
  const arcEl = useRef<El | null>(null)
  const instApi: InstApi = {
    toScene: (x, y) => toScene(x, y),
    arcStart: (p) => {
      const el = newElement('freedraw', p)
      Object.assign(el, styles.current[opts.current.pen], { pen: opts.current.pen })
      arcEl.current = el
      live.current = el
      els.current.push(el)
      redraw()
    },
    arcPoint: (p) => {
      const e = arcEl.current
      if (!e) return
      e.points!.push([p[0] - e.x, p[1] - e.y])
      e.ver++
      redrawLive()
    },
    arcEnd: () => {
      const e = arcEl.current
      arcEl.current = null
      live.current = null
      if (e && e.points!.length < 2) els.current = els.current.filter((x) => x !== e)
      commit()
      redraw()
    },
  }

  /* ---------- tiện ích toạ độ ---------- */

  const toScene = (cx: number, cy: number): Pt => {
    const r = canvasRef.current!.getBoundingClientRect()
    const v = view.current
    return [(cx - r.left) / v.zoom - v.scrollX, (cy - r.top) / v.zoom - v.scrollY]
  }
  bindToScene(toScene)
  const sel = () => els.current.filter((e) => selected.current.has(e.id))
  /** hình tô được nằm trên cùng tại p — tính cả phần trong của hình chưa tô */
  const fillTarget = (p: Pt) => {
    const tol = 6 / view.current.zoom
    for (let i = els.current.length - 1; i >= 0; i--) {
      const e = els.current[i]
      const ok = e.kind === 'rectangle' || e.kind === 'ellipse' || e.kind === 'diamond' || isClosedStroke(e)
      if (ok && !isPage(e) && hitTest({ ...e, fill: '#000' }, p, tol)) return e
    }
    return null
  }
  /** thùng sơn tại p: vùng kín giữa các nét (kiểu Paint). Nếu vùng đó chính là phần trong của một hình
   *  (hoặc mảng màu đã tô trước) thì tô lại hình đó; vùng hở thì quay về tô hình dưới con trỏ */
  const bucketTarget = (p: Pt): { el: El } | { region: Region } | null => {
    const v = view.current, c = canvasRef.current
    const el = fillTarget(p)
    if (!c) return el ? { el } : null
    const key = `${sceneVer.current}|${v.zoom}|${v.scrollX}|${v.scrollY}|${c.clientWidth}x${c.clientHeight}`
    const region = regionAt(els.current, v, c.clientWidth, c.clientHeight, key, p)
    if (!region) return el ? { el } : null
    const area = regionArea(region)
    const same = (e: El) => { const r = area / Math.max(1, interiorArea(e)); return r > 0.85 && r < 1.2 }
    // vùng này đã có mảng màu (tô lần trước) → đổi màu mảng đó, không chồng thêm mảng mới
    const tol = 2 / v.zoom
    for (let i = els.current.length - 1; i >= 0; i--) {
      const e = els.current[i]
      if (e.region && hitTest({ ...e, fill: '#000' }, p, tol) && same(e)) return { el: e }
    }
    // vùng có lỗ không bao giờ là "cả hình" (tô cả hình sẽ đè mất lỗ)
    if (el && !region.holes.length && same(el)) return { el }
    return { region }
  }
  /** mảng màu từ vùng kín: vòng ngoài rồi tới các vòng lỗ, chung một `points` */
  const regionEl = ({ outer, holes }: Region, fs: FillStyle): El => {
    const x = Math.min(...outer.map((q) => q[0])), y = Math.min(...outer.map((q) => q[1]))
    const ring = (r: Pt[]) => [...r, r[0]].map(([px, py]) => [px - x, py - y] as Pt)
    const points = ring(outer)
    const starts: number[] = []
    for (const h of holes) { starts.push(points.length); points.push(...ring(h)) }
    return {
      ...DEFAULT_STYLE, id: newId(), kind: 'freedraw', x, y, w: 0, h: 0, angle: 0, seed: newSeed(), ver: 0,
      points, pen: 'ball', region: true, holes: starts.length ? starts : undefined,
      stroke: 'transparent', strokeWidth: 1, fill: 'transparent', fillStyle: fs,
    }
  }
  /** xem trước cho thùng sơn / kéo màu */
  const bucketPreview = (p: Pt, color: string) => {
    const t = bucketTarget(p)
    const prev = fillHover.current
    const same = t && prev && ('el' in t ? prev.el === t.el : !!prev.el.region && !prev.el.ver && Math.abs(prev.el.x - Math.min(...t.region.outer.map((q) => q[0]))) < 0.5 && Math.abs(prev.el.y - Math.min(...t.region.outer.map((q) => q[1]))) < 0.5 && (prev.el.holes?.length ?? 0) === t.region.holes.length)
    if (same || (!t && !prev)) return
    fillHover.current = t ? { el: 'el' in t ? t.el : regionEl(t.region, opts.current.bucketStyle), color } : null
    redraw()
  }
  const bucketFill = (p: Pt, color: string, fs: FillStyle) => {
    const t = bucketTarget(p)
    if (!t) return
    if ('el' in t) return applyFill(t.el, color, fs, p)
    if (color === 'transparent') return
    const e = regionEl(t.region, fs)
    // nằm dưới mọi nét, trên các trang PDF làm nền
    let at = 0
    els.current.forEach((x, i) => { if (isPage(x)) at = i + 1 })
    els.current.splice(at, 0, e)
    groupWithWalls(e, t.region)
    applyFill(e, color, fs, p)
  }
  /** mảng màu tô giữa nhiều nét: gom vào cùng nhóm với các nét làm viền để kéo hình thì màu chạy theo.
   *  Viền đã thuộc một nhóm (vd hình công cụ) thì vào nhóm đó; chưa có thì tạo nhóm mới */
  const groupWithWalls = (e: El, { outer, holes }: Region) => {
    const tol = 6 / view.current.zoom
    const walls = new Set<El>()
    for (const ring of [outer, ...holes]) {
      const step = Math.max(1, Math.floor(ring.length / 120))
      for (let i = 0; i < ring.length; i += step) {
        for (const o of els.current) {
          if (o === e || o.region || isPage(o) || walls.has(o)) continue
          if (hitTest(o, ring[i], tol + o.strokeWidth)) walls.add(o)
        }
      }
    }
    if (!walls.size) return
    const gid = [...walls].find((o) => o.groupId)?.groupId ?? newId()
    for (const o of walls) if (!o.groupId) mutate(o, { groupId: gid })
    mutate(e, { groupId: gid })
  }
  /** tô hình e, màu lan ra từ điểm p */
  const applyFill = (e: El, color: string, fs: FillStyle, p: Pt) => {
    if (e.fill === color && (color === 'transparent' || e.fillStyle === fs)) return
    const prev = clone(e)
    mutate(e, { fill: color, fillStyle: fs })
    const [x1, y1, x2, y2] = worldBounds(e)
    const rMax = Math.max(...[[x1, y1], [x2, y1], [x1, y2], [x2, y2]].map(([x, y]) => Math.hypot(x - p[0], y - p[1])))
    spread.current = { id: e.id, prev, p, t0: performance.now(), rMax }
    commit()
  }
  const topHit = (p: Pt) => {
    const tol = 6 / view.current.zoom
    // trang PDF khoá làm nền: không bấm chọn được
    for (let i = els.current.length - 1; i >= 0; i--) if (!isPage(els.current[i]) && hitTest(els.current[i], p, tol)) return els.current[i]
    // hình công cụ (đồ thị, sơ đồ…) là nhiều nét rời: bấm chỗ trống trong khung của nhóm cũng chọn được
    for (let i = els.current.length - 1; i >= 0; i--) {
      const e = els.current[i]
      if (!e.tool || !e.groupId) continue
      const b = unionBounds(els.current.filter((o) => o.groupId === e.groupId))
      if (b && p[0] >= b[0] - tol && p[0] <= b[2] + tol && p[1] >= b[1] - tol && p[1] <= b[3] + tol) return e
    }
    return null
  }

  /** tay nắm dưới con trỏ (nếu có) */
  const handleAt = (p: Pt): Handle | null => {
    const s = sel()
    const z = view.current.zoom
    const r = 7 / z
    if (s.length === 1) {
      const e = s[0]
      if (isLinear(e)) {
        const pts = e.points ?? []
        const ends: [Handle, Pt][] = [['p0', pts[0]], ['p1', pts[pts.length - 1]]]
        for (const [h, q] of ends) if (q && Math.hypot(p[0] - e.x - q[0], p[1] - e.y - q[1]) <= r) return h
        return null
      }
      const q = rotate(p, centerOf(e), -e.angle)
      for (const [h, hp] of Object.entries(handlePositions(localBounds(e), z, true)))
        if (Math.abs(q[0] - hp![0]) <= r && Math.abs(q[1] - hp![1]) <= r) return h as Handle
    } else if (s.length > 1) {
      const b = unionBounds(s)!
      for (const [h, hp] of Object.entries(handlePositions(b, z, false)))
        if (Math.abs(p[0] - hp![0]) <= r && Math.abs(p[1] - hp![1]) <= r) return h as Handle
    }
    return null
  }

  const pickTool = useCallback((t: Tool) => {
    toolRef.current = t
    fillHover.current = null
    if (SHAPES.includes(t as Kind)) {
      const k = t as Kind
      opts.current.lastShape = k
      opts.current.recentShapes = [k, ...opts.current.recentShapes.filter((x) => x !== k)].slice(0, 4)
    }
    setTool(t)
    if (t !== 'select') selected.current.clear()
    redraw()
  }, [redraw])

  const newElement = (kind: Kind, p: Pt): El => ({
    ...style.current,
    pen: kind === 'freedraw' ? opts.current.pen : undefined,
    ...(kind === 'freedraw' ? (() => { const tp = opts.current.penTips[opts.current.pen] ?? DEFAULT_TIP; return { tipSharp: tp.sharp, tipSens: tp.sens } })() : {}),
    id: newId(),
    kind,
    x: p[0],
    y: p[1],
    w: 0,
    h: 0,
    angle: 0,
    seed: newSeed(),
    ver: 0,
    points: kind === 'line' || kind === 'arrow' ? [[0, 0], [0, 0]] : kind === 'freedraw' ? [[0, 0]] : undefined,
    text: kind === 'text' ? '' : undefined,
  })

  /* ---------- chữ ---------- */

  const startText = (el: El, isNew: boolean) => {
    if (isNew) els.current.push(el)
    selected.current = new Set([el.id])
    setEditing({ el, isNew })
    redraw()
  }

  const finishText = useCallback((value: string) => {
    const ed = editingRef.current
    if (!ed) return
    const text = value.replace(/\s+$/, '')
    if (!text) {
      els.current = els.current.filter((e) => e.id !== ed.el.id)
      selected.current.delete(ed.el.id)
    } else mutate(ed.el, { text, ...measureText(text, ed.el.fontSize, ed.el) })
    editingRef.current = null
    setEditing(null)
    commit()
    redraw()
  }, [commit, redraw])

  /* ---------- chuột / bút ---------- */

  const cancelDrag = () => {
    clearTimeout(hold.current.timer)
    const d = drag.current
    drag.current = null
    marquee.current = null
    lasso.current = null
    guidesRef.current = []
    if (!d) return
    live.current = null
    redrawLive()
    if (d.t === 'create' || d.t === 'snapped') {
      els.current = els.current.filter((x) => x !== d.el)
      dropFromCache(d.el.id)
      redraw()
    } else if (d.t === 'laser') {
      laser.current = laser.current.filter((x) => x !== d.trail)
      redraw()
    } else if (d.t === 'marquee' || d.t === 'lasso') {
      selected.current = d.base
      bump()
      redraw()
    } else if (d.t !== 'pan') {
      const snap = undoStack.current.at(-1)
      if (snap) els.current = JSON.parse(snap)
      redraw()
    }
  }

  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    setPop(null)
    if (editingRef.current) {
      const ta = document.getElementById(`board-text-${id}`) as HTMLTextAreaElement | null
      finishText(ta?.value ?? '')
      return
    }
    try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch {}
    if (ev.pointerType === 'touch') {
      touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      if (touches.current.size >= 2) {
        pinching.current = true
        cancelDrag()
        return
      }
      if (pinching.current) return
    }
    const p = toScene(ev.clientX, ev.clientY)
    // lật đầu gôm của bút hoặc giữ nút trên thân bút → gôm tạm thời
    const flip = ev.pointerType === 'pen' && (ev.button === 5 || ev.button === 2 || (ev.buttons & 32) !== 0)
    const t: Tool = flip ? 'eraser' : toolRef.current
    const v = view.current

    if (ev.pointerType === 'pen') penSeen.current = true
    if (ev.button === 1 || t === 'hand' || space.current || (ev.pointerType === 'touch' && penSeen.current)) {
      drag.current = { t: 'pan', sx: ev.clientX, sy: ev.clientY, scrollX: v.scrollX, scrollY: v.scrollY }
      return
    }
    if (ev.button !== 0 && !flip) return

    if (t === 'bucket') {
      fillHover.current = null
      bucketFill(p, opts.current.bucketFill, opts.current.bucketStyle)
      return
    }
    if (t === 'laser') {
      const trail: LaserTrail = { pts: [p], ts: [performance.now()], color: opts.current.laserColor, size: opts.current.laserSize }
      laser.current.push(trail)
      drag.current = { t: 'laser', trail }
      redraw()
      return
    }

    if (t === 'select') {
      const s = sel()
      const h = s.some((e) => e.locked) ? null : handleAt(p)
      if (h === 'p0' || h === 'p1') {
        drag.current = { t: 'endpoint', index: h === 'p0' ? 0 : (s[0].points!.length - 1), el: s[0] }
        return
      }
      if (h === 'rot') {
        drag.current = { t: 'rotate', el: s[0], center: centerOf(s[0]) }
        return
      }
      if (h) {
        const single = s.length === 1
        drag.current = { t: 'resize', handle: h, orig: s.map(clone), ob: single ? localBounds(s[0]) : unionBounds(s)!, single }
        return
      }
      const hit = topHit(p)
      if (hit) {
        const grp = withGroups(els.current, new Set([hit.id]))
        if (ev.shiftKey) {
          const on = !selected.current.has(hit.id)
          for (const id of grp) on ? selected.current.add(id) : selected.current.delete(id)
        } else if (!selected.current.has(hit.id)) selected.current = grp
        let moving = sel()
        if (moving.some((e) => e.locked)) {
          bump()
          redraw()
          return
        }
        // Alt + kéo: nhân đôi rồi kéo bản sao
        if (ev.altKey) {
          const copies = copyEls(moving, 0, 0)
          els.current.push(...copies)
          selected.current = new Set(copies.map((c) => c.id))
          moving = copies
        }
        const movingIds = selected.current
        const v = view.current, cw = canvasRef.current?.clientWidth ?? 2000, ch = canvasRef.current?.clientHeight ?? 1200
        const vx0 = -v.scrollX, vy0 = -v.scrollY, vx1 = vx0 + cw / v.zoom, vy1 = vy0 + ch / v.zoom
        const candidates = groupBlocks(els.current.filter((e) => !movingIds.has(e.id) && !isPage(e)))
          .map((b) => b.bounds)
          .filter((b) => b[2] >= vx0 && b[0] <= vx1 && b[3] >= vy0 && b[1] <= vy1)
        drag.current = {
          t: 'move',
          start: p,
          orig: new Map(moving.map((e) => [e.id, [e.x, e.y]])),
          moved: false,
          origBounds: unionBounds(moving),
          candidates,
        }
      } else {
        if (!ev.shiftKey) selected.current.clear()
        drag.current = opts.current.selectMode === 'lasso'
          ? { t: 'lasso', pts: [p], base: new Set(selected.current) }
          : { t: 'marquee', start: p, cur: p, base: new Set(selected.current) }
      }
      bump()
      redraw()
      return
    }

    if (t === 'eraser') {
      drag.current = { t: 'erase', hit: false, last: p }
      eraserAt.current = p
      eraseAt(p)
      return
    }

    if (t === 'text') {
      ev.preventDefault()
      const el = newElement('text', p)
      Object.assign(el, measureText('', el.fontSize))
      el.y -= (el.fontSize * LINE_HEIGHT) / 2
      startText(el, true)
      pickTool('select')
      return
    }

    // bút đặt sát mép thước → nét bám theo mép
    const guide = t === 'freedraw' ? guideAt(instRef.current, p, 14 / v.zoom) ?? undefined : undefined
    const el = newElement(t as Kind, guide ? projectGuide(guide, p) : p)
    if (el.kind === 'freedraw') {
      if (ev.pointerType === 'pen') el.pressures = [ev.pressure || 0.5]
      if (opts.current.snap && !guide) armHold(ev.clientX, ev.clientY)
      live.current = el
      if (liveRef.current) liveRef.current.style.mixBlendMode = el.pen === 'highlight' ? 'multiply' : 'normal'
    }
    els.current.push(el)
    drag.current = { t: 'create', el, start: p, guide }
    redraw()
  }

  /* giữ bút yên ~0,5 giây cuối nét → nắn thành hình */
  const armHold = (x: number, y: number) => {
    clearTimeout(hold.current.timer)
    hold.current = { x, y, timer: window.setTimeout(snapShape, 550) }
  }

  const snapShape = () => {
    const d = drag.current
    if (d?.t !== 'create' || d.el.kind !== 'freedraw') return
    const e = d.el
    const shape = recognize((e.points ?? []).map(([px, py]) => [e.x + px, e.y + py] as Pt))
    if (!shape) return
    const look = { stroke: e.stroke, strokeWidth: e.strokeWidth, opacity: e.opacity, roughness: 0, strokeStyle: e.strokeStyle, fill: 'transparent' }
    let el: El
    if (shape.kind === 'line') {
      const [o] = shape.points
      el = { ...newElement('line', o), ...look, points: shape.points.map(([px, py]) => [px - o[0], py - o[1]] as Pt) }
    } else {
      el = { ...newElement(shape.kind, [shape.x, shape.y]), ...look, w: shape.w, h: shape.h }
    }
    els.current = els.current.map((x) => (x === e ? el : x))
    live.current = null
    dropFromCache(e.id)
    // vẫn giữ bút: kéo tiếp để kéo dài đường thẳng / đổi cỡ hình quanh tâm
    const center = centerOf(el)
    const tip = (e.points ?? []).at(-1) ?? [0, 0]
    const at: Pt = [e.x + tip[0], e.y + tip[1]]
    drag.current = { t: 'snapped', el, orig: clone(el), center, dist: Math.max(1, Math.hypot(at[0] - center[0], at[1] - center[1])) }
    redraw()
  }

  /** gôm tại p: cả nét, hoặc chỉ phần nét bút nằm trong vòng gôm (cắt nét làm nhiều đoạn) */
  const eraseAt = (p: Pt) => {
    const r = ERASE_R[opts.current.eraseSize] / view.current.zoom
    let hit = false
    const out: El[] = []
    for (const e of els.current) {
      if (isPage(e) || e.locked) { out.push(e); continue }
      if (opts.current.eraseMode === 'stroke' || e.kind !== 'freedraw' || e.region) {
        if (hitTest(e, p, r)) { hit = true; selected.current.delete(e.id); dropFromCache(e.id) } else out.push(e)
        continue
      }
      const rr = r + e.strokeWidth * 1.3
      const [x1, y1, x2, y2] = localBounds(e)
      if (p[0] < x1 - rr || p[0] > x2 + rr || p[1] < y1 - rr || p[1] > y2 + rr) { out.push(e); continue }
      const pts = e.points ?? []
      const runs: number[][] = []
      let run: number[] = []
      for (let i = 0; i < pts.length; i++) {
        if (Math.hypot(e.x + pts[i][0] - p[0], e.y + pts[i][1] - p[1]) > rr) run.push(i)
        else { if (run.length) runs.push(run); run = [] }
      }
      if (run.length) runs.push(run)
      if (runs.length === 1 && runs[0].length === pts.length) { out.push(e); continue }
      hit = true
      selected.current.delete(e.id)
      dropFromCache(e.id)
      for (const ri of runs) {
        if (ri.length < 2) continue
        out.push({ ...e, id: newId(), ver: 0, points: ri.map((i) => pts[i]), pressures: e.pressures && ri.map((i) => e.pressures![i]) })
      }
    }
    if (hit) {
      els.current = out
      if (drag.current?.t === 'erase') drag.current.hit = true
    }
    redraw()
  }

  const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (ev.pointerType === 'touch' && touches.current.has(ev.pointerId)) {
      if (pinching.current) {
        if (touches.current.size === 2) {
          const prev = [...touches.current.values()]
          const m0x = (prev[0].x + prev[1].x) / 2, m0y = (prev[0].y + prev[1].y) / 2
          const d0 = Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y)
          touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
          const next = [...touches.current.values()]
          const m1x = (next[0].x + next[1].x) / 2, m1y = (next[0].y + next[1].y) / 2
          const d1 = Math.hypot(next[1].x - next[0].x, next[1].y - next[0].y)
          const v = view.current
          v.scrollX += (m1x - m0x) / v.zoom
          v.scrollY += (m1y - m0y) / v.zoom
          if (d0 > 0 && d1 > 0 && d1 !== d0) zoomAt(v.zoom * (d1 / d0), m1x, m1y)
          else { redraw(); persist() }
        } else {
          touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
        }
        return
      }
      touches.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    }
    const d = drag.current
    const p = toScene(ev.clientX, ev.clientY)
    const c = canvasRef.current!

    if (!d) {
      const t = toolRef.current
      if (t === 'eraser') { eraserAt.current = p; c.style.cursor = toolCursor(); redraw(); return }
      if (t === 'bucket') {
        c.style.cursor = toolCursor()
        bucketPreview(p, opts.current.bucketFill)
        return
      }
      if (space.current || t === 'hand') c.style.cursor = 'grab'
      else if (t === 'select') {
        const h = handleAt(p)
        c.style.cursor = h ? CURSOR[h]! : topHit(p) ? 'move' : 'default'
      } else c.style.cursor = toolCursor()
      return
    }
    const coalesced = () => {
      const evs = ev.nativeEvent.getCoalescedEvents?.() ?? []
      return evs.length ? evs : [ev.nativeEvent]
    }

    switch (d.t) {
      case 'pan': {
        const v = view.current
        v.scrollX = d.scrollX + (ev.clientX - d.sx) / v.zoom
        v.scrollY = d.scrollY + (ev.clientY - d.sy) / v.zoom
        c.style.cursor = 'grabbing'
        redraw()
        persist()
        return
      }
      case 'create': {
        const e = d.el
        let dx = p[0] - d.start[0], dy = p[1] - d.start[1]
        if (e.kind === 'freedraw') {
          const pts = e.points!
          // lấy cả các điểm trình duyệt gộp lại giữa hai khung hình → nét không bị gãy khi viết nhanh
          const pr = e.pressures
          for (const ce of coalesced()) {
            let q = toScene(ce.clientX, ce.clientY)
            if (d.guide) q = projectGuide(d.guide, q)
            const last = pts[pts.length - 1]
            // chỉ bỏ điểm gần như trùng (bỏ quá tay thì chỗ đi bút chậm bị vón cục)
            if (Math.hypot(q[0] - e.x - last[0], q[1] - e.y - last[1]) * view.current.zoom < 0.25) continue
            pts.push([q[0] - e.x, q[1] - e.y])
            if (pr) {
              // lực nhấn nhảy từng điểm làm mép nét lồi lõm: lọc cho êm; lực 0 (mất tín hiệu) thì giữ lực trước
              const prev = pr[pr.length - 1]
              pr.push(ce.pressure > 0 ? prev * 0.5 + ce.pressure * 0.5 : prev)
            }
          }
          e.ver++
          if (opts.current.snap && !d.guide && Math.hypot(ev.clientX - hold.current.x, ev.clientY - hold.current.y) > 4) armHold(ev.clientX, ev.clientY)
          if (live.current === e) { redrawLive(); return }
        } else if (isLinear(e)) {
          if (ev.shiftKey) {
            const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
            const len = Math.hypot(dx, dy)
            dx = len * Math.cos(a)
            dy = len * Math.sin(a)
          }
          mutate(e, { points: [[0, 0], [dx, dy]] })
        } else {
          if (ev.shiftKey) {
            const m = Math.max(Math.abs(dx), Math.abs(dy))
            dx = Math.sign(dx || 1) * m
            dy = Math.sign(dy || 1) * m
          }
          mutate(e, {
            x: Math.min(d.start[0], d.start[0] + dx), y: Math.min(d.start[1], d.start[1] + dy),
            w: Math.abs(dx), h: Math.abs(dy),
          })
        }
        redraw()
        return
      }
      case 'move': {
        let dx = p[0] - d.start[0], dy = p[1] - d.start[1]
        let lockAxis: 'x' | 'y' | null = null
        if (ev.shiftKey) {
          if (Math.abs(dx) > Math.abs(dy)) { dy = 0; lockAxis = 'x' }
          else { dx = 0; lockAxis = 'y' }
        }
        if (opts.current.guides && !ev.altKey && d.origBounds && d.candidates.length) {
          const snapped = computeSnap(d.origBounds, dx, dy, d.candidates, 5 / view.current.zoom, lockAxis)
          dx = snapped.dx
          dy = snapped.dy
          guidesRef.current = snapped.guides
        } else guidesRef.current = []
        for (const e of sel()) {
          const o = d.orig.get(e.id)
          if (o) mutate(e, { x: o[0] + dx, y: o[1] + dy })
        }
        d.moved = true
        redraw()
        return
      }
      case 'marquee': {
        d.cur = p
        const b: Bounds = [Math.min(d.start[0], p[0]), Math.min(d.start[1], p[1]), Math.max(d.start[0], p[0]), Math.max(d.start[1], p[1])]
        marquee.current = b
        const next = new Set(d.base)
        for (const e of els.current) {
          if (isPage(e) || e.locked) continue
          const w = worldBounds(e)
          if (w[0] >= b[0] && w[1] >= b[1] && w[2] <= b[2] && w[3] <= b[3]) next.add(e.id)
        }
        selected.current = withGroups(els.current, next)
        redraw()
        return
      }
      case 'endpoint': {
        const e = d.el
        const pts = e.points!.map((q) => [q[0], q[1]] as Pt)
        let q: Pt = [p[0] - e.x, p[1] - e.y]
        if (ev.shiftKey) {
          const other = pts[d.index === 0 ? pts.length - 1 : 0]
          const dx = q[0] - other[0], dy = q[1] - other[1]
          const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
          const len = Math.hypot(dx, dy)
          q = [other[0] + len * Math.cos(a), other[1] + len * Math.sin(a)]
        }
        pts[d.index] = q
        mutate(e, { points: pts })
        redraw()
        return
      }
      case 'rotate': {
        let a = Math.atan2(p[1] - d.center[1], p[0] - d.center[0]) + Math.PI / 2
        if (ev.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12)
        mutate(d.el, { angle: ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) })
        redraw()
        return
      }
      case 'resize':
        resize(d, p, ev.shiftKey)
        redraw()
        return
      case 'erase': {
        // nội suy giữa hai lần di để gôm nhanh không sót
        const step = ERASE_R[opts.current.eraseSize] / view.current.zoom / 2
        const n = Math.max(1, Math.ceil(Math.hypot(p[0] - d.last[0], p[1] - d.last[1]) / step))
        eraserAt.current = p
        for (let i = 1; i <= n; i++) eraseAt([d.last[0] + ((p[0] - d.last[0]) * i) / n, d.last[1] + ((p[1] - d.last[1]) * i) / n])
        d.last = p
        return
      }
      case 'snapped': {
        const { el, orig } = d
        const pts = orig.points
        if (el.kind === 'line' && pts?.length === 2) {
          // đường thẳng: đầu cuối theo bút, gần ngang / dọc / chéo 45° thì bắt thẳng
          let dx = p[0] - orig.x, dy = p[1] - orig.y
          const len = Math.hypot(dx, dy)
          const a = Math.atan2(dy, dx), step = Math.PI / 4, snapA = Math.round(a / step) * step
          if (Math.abs(snapA - a) < (7 * Math.PI) / 180) { dx = len * Math.cos(snapA); dy = len * Math.sin(snapA) }
          mutate(el, { points: [[0, 0], [dx, dy]] })
        } else {
          // hình: phóng to / thu nhỏ quanh tâm theo khoảng cách bút – tâm
          const k = Math.max(0.05, Math.hypot(p[0] - d.center[0], p[1] - d.center[1]) / d.dist)
          const [cx, cy] = d.center
          if (pts) {
            const P = pts.map(([px, py]) => [cx + (orig.x + px - cx) * k, cy + (orig.y + py - cy) * k] as Pt)
            mutate(el, { x: P[0][0], y: P[0][1], points: P.map(([x, y]) => [x - P[0][0], y - P[0][1]] as Pt) })
          } else {
            const w = orig.w * k, h = orig.h * k
            mutate(el, { x: cx - w / 2, y: cy - h / 2, w, h })
          }
        }
        redraw()
        return
      }
      case 'laser': {
        const now = performance.now()
        for (const ce of coalesced()) {
          d.trail.pts.push(toScene(ce.clientX, ce.clientY))
          d.trail.ts.push(now)
        }
        redraw()
        return
      }
      case 'lasso': {
        d.pts.push(p)
        lasso.current = d.pts
        const next = new Set(d.base)
        for (const e of els.current) {
          if (isPage(e) || e.locked) continue
          const pts = hasPoints(e) ? e.points!.map(([px, py]) => [e.x + px, e.y + py] as Pt) : [centerOf(e)]
          const inside = pts.filter((q) => inPolygon(q, d.pts)).length
          if (inside / pts.length >= 0.6) next.add(e.id)
        }
        selected.current = withGroups(els.current, next)
        redraw()
        return
      }
    }
  }

  const resize = (d: Extract<Drag, { t: 'resize' }>, p: Pt, keepRatio: boolean) => {
    const [ox1, oy1, ox2, oy2] = d.ob
    const o0 = d.orig[0]
    const oc: Pt = [(ox1 + ox2) / 2, (oy1 + oy2) / 2]
    // một hình đã xoay: đổi con trỏ về hệ toạ độ của hình
    const q = d.single ? rotate(p, oc, -o0.angle) : p
    let [x1, y1, x2, y2] = d.ob
    const h = d.handle
    if (h.includes('w')) x1 = Math.min(q[0], x2 - 1)
    if (h.includes('e')) x2 = Math.max(q[0], x1 + 1)
    if (h.includes('n')) y1 = Math.min(q[1], y2 - 1)
    if (h.includes('s')) y2 = Math.max(q[1], y1 + 1)
    const ow = ox2 - ox1 || 1, oh = oy2 - oy1 || 1
    let sx = (x2 - x1) / ow, sy = (y2 - y1) / oh
    const corner = h.length === 2
    const isText = d.single && o0.kind === 'text'
    if ((keepRatio || isText) && corner) {
      const s = Math.max(sx, sy)
      sx = sy = s
      if (h.includes('w')) x1 = x2 - ow * s
      else x2 = x1 + ow * s
      if (h.includes('n')) y1 = y2 - oh * s
      else y2 = y1 + oh * s
    }
    if (isText && !corner) return

    if (d.single) {
      const e = els.current.find((x) => x.id === o0.id)
      if (!e) return
      // tâm mới (hệ toạ độ hình) xoay ngược về toạ độ cảnh quanh tâm cũ
      const C = rotate([(x1 + x2) / 2, (y1 + y2) / 2], oc, o0.angle)
      if (o0.kind === 'text') {
        const fontSize = Math.max(6, o0.fontSize * sx)
        const m = measureText(o0.text ?? '', fontSize, o0)
        mutate(e, { fontSize, ...m, x: C[0] - m.w / 2, y: C[1] - m.h / 2 })
      } else if (hasPoints(o0)) {
        const [bx1, by1] = localBounds(o0)
        const pts = o0.points!.map(([px, py]) => [(o0.x + px - bx1) * sx, (o0.y + py - by1) * sy] as Pt)
        const w = (x2 - x1), hh = (y2 - y1)
        mutate(e, { points: pts, x: C[0] - w / 2, y: C[1] - hh / 2 })
      } else {
        const w = x2 - x1, hh = y2 - y1
        mutate(e, { w, h: hh, x: C[0] - w / 2, y: C[1] - hh / 2 })
      }
      return
    }

    for (const o of d.orig) {
      const e = els.current.find((x) => x.id === o.id)
      if (!e) continue
      const nx = x1 + (o.x - ox1) * sx, ny = y1 + (o.y - oy1) * sy
      if (o.kind === 'text') {
        const fontSize = Math.max(6, o.fontSize * Math.min(sx, sy))
        mutate(e, { x: nx, y: ny, fontSize, ...measureText(o.text ?? '', fontSize, o) })
      } else if (hasPoints(o)) mutate(e, { x: nx, y: ny, points: o.points!.map(([px, py]) => [px * sx, py * sy] as Pt) })
      else mutate(e, { x: nx, y: ny, w: o.w * sx, h: o.h * sy })
    }
  }

  const onPointerUp = (ev?: React.PointerEvent<HTMLCanvasElement>) => {
    if (ev?.pointerType === 'touch') {
      touches.current.delete(ev.pointerId)
      if (pinching.current) {
        if (touches.current.size === 0) pinching.current = false
        return
      }
    }
    clearTimeout(hold.current.timer)
    const d = drag.current
    drag.current = null
    marquee.current = null
    lasso.current = null
    guidesRef.current = []
    if (!d) return
    if (d.t === 'laser') return redraw()
    live.current = null
    if (d.t === 'create') {
      const e = d.el
      if (e.kind === 'freedraw') {
        // chấm bút: thêm điểm thứ hai lệch rất nhỏ để nét không dài bằng 0 (cách của Excalidraw)
        const pts = e.points!
        if (pts.every((q) => Math.hypot(q[0], q[1]) * view.current.zoom < 1)) {
          e.points = [[0, 0], [0.0001, 0.0001]]
          if (e.pressures) { const p0 = Math.max(0.5, ...e.pressures); e.pressures = [p0, p0] }
          e.ver++
        }
      }
      const [x1, y1, x2, y2] = localBounds(e)
      const tiny = e.kind !== 'freedraw' && x2 - x1 < 3 && y2 - y1 < 3
      if (tiny) els.current = els.current.filter((x) => x !== e)
      else if (e.kind !== 'freedraw') {
        if (opts.current.keepTool && SHAPES.includes(e.kind)) selected.current.clear()
        else { selected.current = new Set([e.id]); pickTool('select') }
      }
      commit()
    } else if (d.t === 'pan') {
      canvasRef.current!.style.cursor = toolRef.current === 'hand' ? 'grab' : 'default'
    } else commit()
    bump()
    redraw()
  }

  const onDoubleClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolRef.current !== 'select') return
    const p = toScene(ev.clientX, ev.clientY)
    const hit = topHit(p)
    if (hit?.locked) return
    if (hit?.kind === 'text') return startText(hit, false)
    if (hit?.latex) return setDialog({ t: 'formula', el: hit })
    // hình của công cụ vẽ: nhóm dựng bằng phần tử (ToolDoc ở trường tool) hoặc ảnh SVG cũ (ToolDoc trong <desc>)
    if (hit?.groupId) {
      const members = els.current.filter((e) => e.groupId === hit.groupId)
      const doc = parseToolJson(members.find((e) => e.tool)?.tool)
      if (doc) return setDialog({ t: 'tool', doc, ids: members.map((e) => e.id) })
    }
    if (hit?.kind === 'image' && !hit.page) {
      const doc = readToolDoc(hit.src)
      if (doc) return setDialog({ t: 'tool', doc, ids: [hit.id] })
    }
    if (hit) return
    const el = newElement('text', p)
    Object.assign(el, measureText('', el.fontSize))
    el.y -= (el.fontSize * LINE_HEIGHT) / 2
    startText(el, true)
  }

  /* ---------- lăn chuột: cuộn / phóng to ---------- */

  const zoomAt = useCallback((next: number, cx?: number, cy?: number) => {
    const c = canvasRef.current
    if (!c) return
    const v = view.current
    const z = Math.min(4, Math.max(0.1, next))
    const r = c.getBoundingClientRect()
    const sx = cx ?? r.left + r.width / 2, sy = cy ?? r.top + r.height / 2
    const before = [(sx - r.left) / v.zoom - v.scrollX, (sy - r.top) / v.zoom - v.scrollY]
    v.zoom = z
    v.scrollX = (sx - r.left) / z - before[0]
    v.scrollY = (sy - r.top) / z - before[1]
    changed()
  }, [changed])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      const v = view.current
      if (ev.ctrlKey || ev.metaKey) zoomAt(v.zoom * Math.exp(-ev.deltaY * 0.0015), ev.clientX, ev.clientY)
      else {
        const dx = ev.shiftKey ? ev.deltaY : ev.deltaX, dy = ev.shiftKey ? 0 : ev.deltaY
        v.scrollX -= dx / v.zoom
        v.scrollY -= dy / v.zoom
        redraw()
        persist()
      }
    }
    c.addEventListener('wheel', onWheel, { passive: false })
    return () => c.removeEventListener('wheel', onWheel)
  }, [zoomAt, redraw, persist])

  /* ---------- phím tắt ---------- */

  const deleteSelected = () => {
    const victims = new Set(sel().filter((e) => !e.locked).map((e) => e.id))
    if (!victims.size) return
    els.current = els.current.filter((e) => !victims.has(e.id))
    for (const vid of victims) selected.current.delete(vid)
    commit()
  }
  const toggleLock = () => {
    const s = sel()
    if (!s.length) return
    const next = !s.every((e) => e.locked)
    for (const e of s) mutate(e, { locked: next || undefined })
    commit()
  }
  const duplicate = () => {
    const copies = copyEls(sel(), 16, 16)
    if (!copies.length) return
    els.current.push(...copies)
    selected.current = new Set(copies.map((c) => c.id))
    commit()
  }
  /** gộp các hình đang chọn thành một nhóm / tách nhóm */
  const group = () => {
    const s = sel()
    if (s.length < 2) return
    const g = newId()
    for (const e of s) e.groupId = g
    commit()
  }
  const ungroup = () => {
    const s = sel().filter((e) => e.groupId)
    if (!s.length) return
    for (const e of s) { delete e.groupId; delete e.tool }
    commit()
  }
  const align = (kind: AlignKind) => {
    if (alignBlocks(sel(), kind)) commit()
  }
  const reorder = (dir: 'front' | 'back') => {
    const s = sel()
    if (!s.length) return
    const rest = els.current.filter((e) => !selected.current.has(e.id))
    els.current = dir === 'front' ? [...rest, ...s] : [...s, ...rest]
    commit()
  }

  const pasteInternal = () => {
    const copies = copyEls(clipboard.current, 24, 24)
    clipboard.current = copies.map(clone)
    els.current.push(...copies)
    pickTool('select')
    selected.current = new Set(copies.map((c) => c.id))
    commit()
  }

  /** dán: hình đã sao chép trong bảng, ảnh / PDF từ ngoài, hoặc chữ */
  const pasteHandler = useRef<(ev: ClipboardEvent) => void>(() => {})
  pasteHandler.current = (ev: ClipboardEvent) => {
    const target = ev.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    if (editingRef.current || dialogRef.current) return
    // nhiều tab bảng vẽ cùng mở: chỉ bảng đang hiện mới nhận
    if (!canvasRef.current?.offsetParent) return
    clearTimeout(pasteFallback.current)
    const dt = ev.clipboardData
    const text = dt?.getData('text/plain') ?? ''
    // ảnh chép từ trình duyệt / công cụ chụp màn hình nằm trong items (files có khi rỗng)
    const files = [...(dt?.items ?? [])].filter((i) => i.kind === 'file').map((i) => i.getAsFile()).filter((f): f is File => !!f)
    const ours = clipboard.current.length > 0 && (text.startsWith(CLIP_MARK) ? text === clipMark.current : !clipMark.current && !files.length && !text)
    ev.preventDefault()
    if (ours) return pasteInternal()
    const pdf = files.find((f) => f.type === 'application/pdf')
    if (pdf) return setDialog({ t: 'pdf', file: pdf })
    const imgs = files.filter((f) => f.type.startsWith('image/'))
    if (imgs.length) {
      void Promise.all(imgs.map((f) => readImageFile(f).catch(() => null))).then((pics) => placePictures(pics.filter((p): p is Picture => !!p)))
      return
    }
    if (text.trim() && !text.startsWith(CLIP_MARK)) {
      const c = canvasRef.current!
      const v = view.current
      const r = c.getBoundingClientRect()
      const el = newElement('text', [r.width / 2 / v.zoom - v.scrollX, r.height / 2 / v.zoom - v.scrollY])
      el.text = text.replace(/\r\n?/g, '\n').slice(0, 5000)
      Object.assign(el, measureText(el.text, el.fontSize, el))
      el.x -= el.w / 2
      el.y -= el.h / 2
      els.current.push(el)
      pickTool('select')
      selected.current = new Set([el.id])
      commit()
    }
  }
  useEffect(() => {
    const on = (ev: ClipboardEvent) => pasteHandler.current(ev)
    window.addEventListener('paste', on)
    return () => window.removeEventListener('paste', on)
  }, [])

  const keyHandler = useRef<(ev: KeyboardEvent) => void>(() => {})
  keyHandler.current = (ev: KeyboardEvent) => {
    const target = ev.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    if (editingRef.current || dialogRef.current) return
    const k = ev.key.toLowerCase()
    const mod = ev.ctrlKey || ev.metaKey
    if (k === ' ' && !space.current) {
      space.current = true
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
      ev.preventDefault()
      return
    }
    if (mod && k === 'z') { ev.preventDefault(); return ev.shiftKey ? redo() : undo() }
    if (mod && k === 'y') { ev.preventDefault(); return redo() }
    if (mod && k === 'a') { ev.preventDefault(); selected.current = new Set(els.current.filter((e) => !isPage(e) && !e.locked).map((e) => e.id)); pickTool('select'); toolRef.current = 'select'; return changed() }
    if (mod && k === 'd') { ev.preventDefault(); return duplicate() }
    if (mod && k === 'g') { ev.preventDefault(); return ev.shiftKey ? ungroup() : group() }
    if (mod && ev.shiftKey && k === 'l') { ev.preventDefault(); return toggleLock() }
    if (mod && (k === 'c' || k === 'x')) {
      if (!selected.current.size) return
      clipboard.current = sel().map(clone)
      // ghi dấu vào clipboard hệ thống: lúc dán, còn đúng dấu này thì dán hình của bảng,
      // còn nếu người dùng đã sao chép thứ khác (ảnh, chữ) thì dán thứ đó
      clipMark.current = `${CLIP_MARK}${Date.now()}`
      navigator.clipboard?.writeText(clipMark.current).catch(() => { clipMark.current = '' })
      if (k === 'x') deleteSelected()
      return
    }
    // Ctrl+V: để trình duyệt bắn sự kiện paste (pasteHandler). Dự phòng: không có sự kiện paste
    // (trình duyệt chặn clipboard) thì vẫn dán hình đã sao chép trong bảng
    if (mod && k === 'v' && clipboard.current.length) {
      clearTimeout(pasteFallback.current)
      pasteFallback.current = window.setTimeout(pasteInternal, 120)
      return
    }
    if (mod && (k === '=' || k === '+')) { ev.preventDefault(); return zoomAt(view.current.zoom * 1.1) }
    if (mod && k === '-') { ev.preventDefault(); return zoomAt(view.current.zoom / 1.1) }
    if (mod && k === '0') { ev.preventDefault(); return zoomAt(1) }
    if (mod) return
    if (k === 'delete' || k === 'backspace') { ev.preventDefault(); return deleteSelected() }
    if (k === 'escape') { selected.current.clear(); pickTool('select'); return changed() }
    if (k.startsWith('arrow') && selected.current.size) {
      ev.preventDefault()
      const movable = sel().filter((e) => !e.locked)
      if (!movable.length) return
      const step = ev.shiftKey ? 10 : 1
      const dx = k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0
      const dy = k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0
      for (const e of movable) mutate(e, { x: e.x + dx, y: e.y + dy })
      return commit()
    }
    if (k === 'enter' && selected.current.size === 1) {
      const e = sel()[0]
      if (e.kind === 'text' && !e.locked) { ev.preventDefault(); return startText(e, false) }
    }
    if (ev.altKey && !mod && !ev.shiftKey) {
      const ak: Record<string, AlignKind> = { a: 'left', d: 'right', w: 'top', s: 'bottom', h: 'centerX', v: 'centerY' }
      if (ak[k] && selected.current.size > 1) { ev.preventDefault(); return align(ak[k]) }
      return
    }
    if (k === 'q') { setOpt('keepTool', !opts.current.keepTool); return }
    const t = TOOL_KEYS[k]
    if (t) pickTool(t)
  }

  useEffect(() => {
    const down = (ev: KeyboardEvent) => keyHandler.current(ev)
    const up = (ev: KeyboardEvent) => {
      if (ev.key === ' ') {
        space.current = false
        if (canvasRef.current) canvasRef.current.style.cursor = ''
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current && !drag.current) canvasRef.current.style.cursor = toolCursor()
  })

  /** chèn hình từ panel Công cụ (đồ thị, hình học…) vào giữa khung nhìn, chọn sẵn để kéo / đổi cỡ */
  /** chỗ trống gần (x, y): nếu đã có hình đặt đúng chỗ đó (chèn liên tiếp) thì lệch xuống-phải từng nấc */
  const freeSpot = (x: number, y: number): Pt => {
    const step = 28 / view.current.zoom, near = 6 / view.current.zoom
    for (let k = 0; k < 30; k++) {
      if (!els.current.some((e) => !isPage(e) && Math.abs(e.x - x) < near && Math.abs(e.y - y) < near)) break
      x += step; y += step
    }
    return [x, y]
  }
  const insertImage = (img: ToolImage) => {
    const c = canvasRef.current
    if (!c) return
    const v = view.current
    const r = c.getBoundingClientRect()
    const w = Math.min(420, (r.width / v.zoom) * 0.6)
    const h = (w * img.height) / img.width
    const cx = r.width / 2 / v.zoom - v.scrollX, cy = r.height / 2 / v.zoom - v.scrollY
    const [x, y] = freeSpot(cx - w / 2, cy - h / 2)
    const added = toolEls(img, x, y, w)
    els.current.push(...added)
    pickTool('select')
    selected.current = new Set(added.map((e) => e.id))
    commit()
  }
  /** hình công cụ → phần tử gốc của bảng (một nhóm giữ ToolDoc); không chuyển được thì để ảnh như cũ */
  const toolEls = (img: ToolImage, x: number, y: number, w: number): El[] => {
    const doc = readToolDoc(img.svg)
    let out: El[] = []
    try { out = svgToElements(img.svg, { x, y, width: w, tool: doc ? JSON.stringify(doc) : undefined }) } catch (err) { console.warn('svgToElements', err) }
    if (out.length) return out
    return [{ ...newElement('image', [x, y]), w, h: (w * img.height) / img.width, src: svgDataUrl(img.svg), opacity: 100 }]
  }

  /** sửa lại hình công cụ (bấm đúp): thay đúng chỗ cũ, giữ bề ngang, cùng lớp */
  const replaceTool = (ids: string[], oldDoc: ToolDoc, img: ToolImage) => {
    const old = els.current.filter((e) => ids.includes(e.id))
    const b = unionBounds(old)
    if (!b) return
    // vị trí, tỉ lệ của hình cũ: ảnh thì chính khung ảnh; nhóm thì dựng lại hình cũ ở tỉ lệ 1 rồi so khung
    // (khung nhóm không gồm nền trắng / lề nên không dùng thẳng được, nhóm có thể đã bị kéo / đổi cỡ)
    let x = b[0], y = b[1], w = b[2] - b[0]
    if (!(old.length === 1 && old[0].kind === 'image')) {
      const ref = renderTool(oldDoc)
      const bo = unionBounds(svgToElements(ref.svg, { x: 0, y: 0, width: ref.width }))
      if (bo && bo[2] > bo[0]) {
        const sc = (b[2] - b[0]) / (bo[2] - bo[0])
        x = b[0] - bo[0] * sc; y = b[1] - bo[1] * sc; w = ref.width * sc
      }
    }
    const added = toolEls(img, x, y, w)
    const at = els.current.findIndex((e) => ids.includes(e.id))
    els.current = els.current.filter((e) => !ids.includes(e.id))
    els.current.splice(Math.min(at, els.current.length), 0, ...added)
    selected.current = new Set(added.map((e) => e.id))
    commit()
  }

  /** đặt các ảnh (ảnh từ máy, trang PDF) xếp dọc giữa khung nhìn, chọn sẵn */
  const placePictures = (pics: Picture[]) => {
    const c = canvasRef.current
    if (!c || !pics.length) return
    const v = view.current
    const r = c.getBoundingClientRect()
    const maxW = Math.min(pics.length > 1 ? 640 : 520, (r.width / v.zoom) * 0.7)
    const gap = 24
    const sizes = pics.map((p) => { const w = Math.min(maxW, p.w); return [w, (w * p.h) / p.w] })
    const totalH = sizes.reduce((a, s) => a + s[1], 0) + gap * (pics.length - 1)
    const cx = r.width / 2 / v.zoom - v.scrollX
    let y = pics.length > 1 ? 40 / v.zoom - v.scrollY : r.height / 2 / v.zoom - v.scrollY - totalH / 2
    const added = pics.map((p, i) => {
      const [w, h] = sizes[i]
      const el: El = { ...newElement('image', [cx - w / 2, y]), w, h, src: p.src, opacity: 100 }
      y += h + gap
      return el
    })
    els.current.push(...added)
    pickTool('select')
    selected.current = new Set(added.map((e) => e.id))
    commit()
  }

  const onPickFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(ev.target.files ?? [])]
    ev.target.value = ''
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdf) return setDialog({ t: 'pdf', file: pdf })
    const pics: Picture[] = []
    for (const f of files) if (f.type.startsWith('image/')) {
      try { pics.push(await readImageFile(f)) } catch { /* bỏ file hỏng */ }
    }
    placePictures(pics)
  }

  /** mở PDF để ghi chú: các trang xếp dọc dưới cùng, khoá làm nền */
  const onOpenPdfNotes = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    const c = canvasRef.current
    if (!f || !c) return
    const MAX = 100
    setBusy('Đang mở PDF…')
    try {
      const doc = await openPdf(f)
      try {
        const n = Math.min(doc.numPages, MAX)
        const W = 800, GAP = 32
        const v = view.current
        const r = c.getBoundingClientRect()
        const cx = r.width / 2 / v.zoom - v.scrollX
        // đặt dưới nội dung đang có, bảng trống thì từ mép trên khung nhìn
        const u = unionBounds(els.current)
        let y = u ? u[3] + 80 : 40 / v.zoom - v.scrollY
        const top = y
        const pages: El[] = []
        for (let i = 1; i <= n; i++) {
          setBusy(`Đang mở PDF… trang ${i}/${n}`)
          const size = await pdfPageSize(doc, i)
          const pic = await renderPdfPage(doc, i, 1400)
          const h = (W * size.h) / size.w
          pages.push({ ...newElement('image', [cx - W / 2, y]), w: W, h, src: pic.src, opacity: 100, page: { n: i, w: size.w, h: size.h } })
          y += h + GAP
        }
        els.current = [...pages, ...els.current]
        // phóng cho trang vừa bề ngang khung nhìn, cuộn tới trang đầu
        v.zoom = Math.max(0.2, Math.min(1.2, (r.width - 48) / W))
        v.scrollX = r.width / 2 / v.zoom - cx
        v.scrollY = -top + 24 / v.zoom
        pickTool('freedraw')
        commit()
        if (doc.numPages > MAX) window.alert(`PDF có ${doc.numPages} trang, bảng chỉ mở ${MAX} trang đầu.`)
      } finally {
        doc.close()
      }
    } catch {
      window.alert('Không mở được file PDF này.')
    } finally {
      setBusy('')
    }
  }

  const onFormula = async (r: FormulaResult) => {
    const old = dialogRef.current?.t === 'formula' ? dialogRef.current.el : undefined
    setDialog(null)
    if (old) {
      const cur = els.current.find((e) => e.id === old.id)
      if (!cur) return
      // giữ tỉ lệ phóng to người dùng đã kéo
      const base = await texToSvg(cur.latex ?? '', 32, cur.stroke)
      const k = base.w > 1 ? cur.w / base.w : 1
      mutate(cur, { latex: r.latex, src: r.src, w: r.w * k, h: r.h * k })
      selected.current = new Set([cur.id])
      return commit()
    }
    const c = canvasRef.current
    if (!c) return
    const v = view.current
    const rc = c.getBoundingClientRect()
    const cx = rc.width / 2 / v.zoom - v.scrollX, cy = rc.height / 2 / v.zoom - v.scrollY
    const el: El = { ...newElement('image', freeSpot(cx - r.w / 2, cy - r.h / 2)), w: r.w, h: r.h, src: r.src, latex: r.latex, stroke: style.current.stroke, opacity: 100 }
    els.current.push(el)
    pickTool('select')
    selected.current = new Set([el.id])
    commit()
  }

  const onExport = async (ch: ExportChoice) => {
    const c = canvasRef.current
    if (!c) return
    if (ch.format === 'pdf-pages') {
      // mỗi trang PDF gốc ra một trang, đúng khổ, kèm nét vẽ đè lên
      const pages = els.current.filter(isPage).sort((a, b) => a.y - b.y || a.x - b.x)
      if (!pages.length) throw new Error('Bảng chưa có trang PDF nào.')
      const items = []
      for (const pg of pages) {
        const k = Math.min(1600, pg.page!.w * ch.scale * 1.1) / pg.w
        items.push({ c: await renderRegion(els.current, [pg.x, pg.y, pg.x + pg.w, pg.y + pg.h], k, 'white', 'plain'), pw: pg.page!.w, ph: pg.page!.h })
      }
      download(URL.createObjectURL(pagesToPdf(items)), `ghi-chu-${new Date().toISOString().slice(0, 10)}.pdf`)
      return setDialog(null)
    }
    const v = view.current
    const r = c.getBoundingClientRect()
    const pool = ch.area === 'selection' ? els.current.filter((e) => selected.current.has(e.id)) : els.current
    let b: Bounds | null
    if (ch.area === 'view') b = [-v.scrollX, -v.scrollY, -v.scrollX + r.width / v.zoom, -v.scrollY + r.height / v.zoom]
    else {
      const u = unionBounds(pool)
      b = u && [u[0] - 20, u[1] - 20, u[2] + 20, u[3] + 20]
    }
    if (!b || !pool.length) throw new Error('Bảng chưa có gì để xuất.')
    // canvas của trình duyệt giới hạn ~16 nghìn px mỗi cạnh
    const scale = Math.min(ch.scale, 16000 / (b[2] - b[0]), 16000 / (b[3] - b[1]))
    const out = await renderRegion(pool, b, scale, ch.bg, opts.current.paper)
    const name = `bang-ve-${new Date().toISOString().slice(0, 10)}`
    if (ch.format === 'png') await savePng(out, `${name}.png`)
    else download(URL.createObjectURL(canvasToA4Pdf(out)), `${name}.pdf`)
    setDialog(null)
  }

  useEffect(() => {
    setImageLoadHandler(redraw)
    return () => setImageLoadHandler(null)
  }, [redraw])

  /* ---------- AI: mô tả bảng, lệnh vẽ, "Hỏi AI" theo phần đang chọn ---------- */

  const aiKey = `board-${id}`
  const r1 = (n: number) => Math.round(n)
  const describeEl = (e: El) => {
    const [x1, y1, x2, y2] = worldBounds(e)
    const what = e.kind === 'freedraw' ? `nét ${PENS.find((pn) => pn.id === e.pen)?.label.toLowerCase() ?? 'bút'}` : KIND_LABEL[e.kind]
    const extra = [
      e.kind === 'text' ? `chữ "${(e.text ?? '').slice(0, 80)}"` : '',
      e.latex ? `công thức LaTeX "${e.latex.slice(0, 120)}"` : '',
      e.kind !== 'image' ? `màu ${e.stroke}` : '',
      e.fill !== 'transparent' && e.kind !== 'image' && e.kind !== 'text' ? `nền ${e.fill}` : '',
    ].filter(Boolean).join(', ')
    return `id=${e.id} ${what} tại x=${r1(x1)} y=${r1(y1)} rộng ${r1(x2 - x1)} cao ${r1(y2 - y1)}${extra ? `, ${extra}` : ''}`
  }
  const boardSummary = () => {
    const c = canvasRef.current
    const v = view.current
    const W = (c?.clientWidth ?? 800) / v.zoom, H = (c?.clientHeight ?? 600) / v.zoom
    const head = `Vùng nhìn thấy: x từ ${r1(-v.scrollX)} đến ${r1(-v.scrollX + W)}, y từ ${r1(-v.scrollY)} đến ${r1(-v.scrollY + H)}. Giấy: ${PAPERS.find((pp) => pp.id === opts.current.paper)?.label}.`
    const list = els.current.slice(-80).map(describeEl)
    return `${head}\n${list.length ? `Các hình trên bảng (${els.current.length}):\n${list.join('\n')}` : 'Bảng đang trống.'}`
  }

  /** "Hỏi AI": đính kèm các hình đang chọn vào khung chat rồi mở Trợ lý */
  const askAi = () => {
    const refs: AiRef[] = sel().map((e) => ({ id: e.id, label: e.kind === 'text' ? `Chữ "${(e.text ?? '').slice(0, 18)}"` : KIND_LABEL[e.kind] ?? 'Hình', detail: describeEl(e) }))
    if (!refs.length) return
    attachToAi(aiKey, refs)
    setMounted((m) => (m.has('ai') ? m : new Set(m).add('ai')))
    setSide('ai')
  }

  /** thực hiện các lệnh vẽ của AI; cả lượt là một bước hoàn tác */
  const applyBoardOps = (ops: Record<string, unknown>[]): string[] => {
    const out: string[] = []
    const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
    const str = (v: unknown, d: string) => (typeof v === 'string' && v ? v : d)
    const color = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v) ? v : v === 'transparent' ? 'transparent' : d)
    const pts = (v: unknown): Pt[] => (Array.isArray(v) ? v.filter((p) => Array.isArray(p) && p.length >= 2).map((p) => [Number(p[0]), Number(p[1])] as Pt).filter((p) => p.every(Number.isFinite)) : [])
    const c = canvasRef.current
    const v = view.current
    const cx = ((c?.clientWidth ?? 800) / 2) / v.zoom - v.scrollX, cy = ((c?.clientHeight ?? 600) / 2) / v.zoom - v.scrollY
    const added: El[] = []
    const base = (kind: Kind, slot: Slot, x: number, y: number): El => ({ ...newElement(kind, [x, y]), ...styles.current[slot], pen: undefined, x, y })
    for (const op of ops) {
      try {
        switch (op.op) {
          case 'figure': {
            const doc = figureDoc(op.figure)
            if (!doc) { out.push('Không dựng được hình theo cấu hình AI gửi.'); break }
            const img = renderTool(doc)
            const w = num(op.w, 360), h = (w * img.height) / img.width
            added.push(...toolEls(img, num(op.x, cx - w / 2), num(op.y, cy - h / 2), w))
            out.push(`Đã vẽ ${TOOL_LABEL[doc.kind] ?? 'hình'}.`)
            break
          }
          case 'shape': {
            const kind = (['rectangle', 'ellipse', 'diamond'] as const).find((k) => k === op.shape) ?? 'rectangle'
            const el = base(kind, 'shape', num(op.x, cx - 80), num(op.y, cy - 45))
            Object.assign(el, {
              w: Math.max(4, num(op.w, 160)), h: Math.max(4, num(op.h, 90)),
              stroke: color(op.stroke, el.stroke), fill: color(op.fill, 'transparent'),
              fillStyle: op.fillStyle === 'solid' || op.fillStyle === 'glass' ? op.fillStyle : 'hachure',
              strokeStyle: (['solid', 'dashed', 'dotted'] as const).find((k) => k === op.strokeStyle) ?? 'solid',
              strokeWidth: num(op.strokeWidth, 2), roughness: op.rough === false ? 0 : 1,
            })
            added.push(el)
            if (typeof op.label === 'string' && op.label.trim()) {
              const fs = Math.min(28, Math.max(14, el.h / 3))
              const m = measureText(op.label, fs)
              added.push({ ...base('text', 'text', el.x + el.w / 2 - m.w / 2, el.y + el.h / 2 - m.h / 2), text: op.label, fontSize: fs, ...m, stroke: el.stroke })
            }
            out.push(`Đã vẽ ${KIND_LABEL[kind].toLowerCase()}.`)
            break
          }
          case 'line': {
            const P = pts(op.points)
            if (P.length < 2) break
            const el = base(op.arrow ? 'arrow' : 'line', 'shape', P[0][0], P[0][1])
            Object.assign(el, {
              points: P.map(([x, y]) => [x - P[0][0], y - P[0][1]] as Pt),
              stroke: color(op.stroke, el.stroke), strokeWidth: num(op.strokeWidth, 2), roughness: 0,
              strokeStyle: (['solid', 'dashed', 'dotted'] as const).find((k) => k === op.strokeStyle) ?? 'solid',
            })
            added.push(el)
            out.push(op.arrow ? 'Đã vẽ mũi tên.' : 'Đã vẽ đường thẳng.')
            break
          }
          case 'text': {
            const t = str(op.text, '').slice(0, 400)
            if (!t) break
            const fs = Math.min(96, Math.max(10, num(op.fontSize, 24)))
            const m = measureText(t, fs)
            added.push({ ...base('text', 'text', num(op.x, cx - m.w / 2), num(op.y, cy)), text: t, fontSize: fs, ...m, stroke: color(op.color, '#1e1e1e') })
            out.push(`Đã ghi "${t.slice(0, 30)}${t.length > 30 ? '…' : ''}".`)
            break
          }
          case 'pen': {
            const pen = PENS.find((pn) => pn.id === op.pen)?.id ?? 'ball'
            let P = pts(op.points)
            const cv = op.curve as Record<string, unknown> | undefined
            if (!P.length && cv) P = curvePoints(cv, cx, cy)
            if (P.length < 2) break
            const el: El = {
              ...newElement('freedraw', P[0]), ...styles.current[pen], pen,
              stroke: color(op.color, styles.current[pen].stroke), strokeWidth: num(op.width, styles.current[pen].strokeWidth),
              points: densify(P).map(([x, y]) => [x - P[0][0], y - P[0][1]] as Pt), pressures: undefined,
            }
            const tp = opts.current.penTips[pen] ?? DEFAULT_TIP
            el.tipSharp = tp.sharp
            el.tipSens = tp.sens
            added.push(el)
            out.push(`Đã vẽ bằng ${PENS.find((pn) => pn.id === pen)!.label.toLowerCase()}.`)
            break
          }
          case 'update': {
            const e = els.current.find((x) => x.id === op.id)
            if (!e) break
            const patch: Partial<El> = {}
            if (op.stroke) patch.stroke = color(op.stroke, e.stroke)
            if (op.fill) patch.fill = color(op.fill, e.fill)
            if (typeof op.x === 'number') patch.x = op.x
            if (typeof op.y === 'number') patch.y = op.y
            if (typeof op.w === 'number' && !hasPoints(e)) patch.w = op.w
            if (typeof op.h === 'number' && !hasPoints(e)) patch.h = op.h
            if (typeof op.text === 'string' && e.kind === 'text') Object.assign(patch, { text: op.text, ...measureText(op.text, e.fontSize, e) })
            mutate(e, patch)
            out.push(`Đã sửa ${KIND_LABEL[e.kind]?.toLowerCase() ?? 'hình'}.`)
            break
          }
          case 'delete': {
            const ids = new Set(Array.isArray(op.ids) ? op.ids.map(String) : [])
            const before = els.current.length
            els.current = els.current.filter((e) => !ids.has(e.id))
            for (const i of ids) selected.current.delete(i)
            if (before !== els.current.length) out.push(`Đã xoá ${before - els.current.length} hình.`)
            break
          }
        }
      } catch {
        out.push('Bỏ qua một lệnh vẽ bị lỗi.')
      }
    }
    if (added.length) {
      els.current.push(...added)
      pickTool('select')
      selected.current = new Set(added.map((e) => e.id))
    }
    commit()
    redraw()
    return out.length ? out : ['AI không gửi lệnh vẽ nào dùng được.']
  }

  /* menu thả xuống: bấm ra ngoài hoặc Esc thì đóng */
  useEffect(() => {
    if (!pop) return
    const down = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.(`[data-pop="${pop}"]`)) setPop(null)
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setPop(null) }
    document.addEventListener('pointerdown', down, true)
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('pointerdown', down, true)
      document.removeEventListener('keydown', key, true)
    }
  }, [pop])

  /* vị trí nền trượt của hàng công cụ: đo nút đang chọn sau mỗi lần vẽ và khi đổi cỡ */
  const segRef = useRef<HTMLDivElement>(null)
  const [seg, setSeg] = useState({ l: 0, w: 0 })
  useLayoutEffect(() => {
    const el = segRef.current?.querySelector<HTMLElement>('button[aria-pressed="true"]')
    const next = el ? { l: el.offsetLeft, w: el.offsetWidth } : { l: 0, w: 0 }
    if (next.l !== seg.l || next.w !== seg.w) setSeg(next)
  })
  useEffect(() => {
    const el = segRef.current
    if (!el) return
    const ro = new ResizeObserver(() => bump())
    ro.observe(el)
    return () => ro.disconnect()
  }, [bump])

  /* ---------- thanh công cụ ---------- */

  const selection = sel()
  const cur: Style = selection[0] ?? style.current
  const ctxKinds: Kind[] = selection.length
    ? selection.map((e) => e.kind)
    : tool === 'freedraw' || tool === 'text' || SHAPES.includes(tool as Kind) ? [tool as Kind] : []
  const kinds = new Set(ctxKinds)
  const onlyText = kinds.size > 0 && [...kinds].every((k) => k === 'text')
  const canFill = [...kinds].some((k) => k === 'rectangle' || k === 'ellipse' || k === 'diamond') || selection.some(isClosedStroke)
  const hasText = kinds.has('text')
  const onlyImage = kinds.size > 0 && [...kinds].every((k) => k === 'image')
  // đang chọn đúng một hình công cụ (đồ thị, sơ đồ…): thanh gọn, đổi nét / chữ qua bảng thông số
  const toolDoc = selection.length && selection.every((e) => e.groupId && e.groupId === selection[0].groupId)
    ? parseToolJson(selection.find((e) => e.tool)?.tool) : null
  const o = opts.current
  const setOpt = <K extends keyof Opts>(k: K, value: Opts[K]) => {
    opts.current = { ...opts.current, [k]: value }
    changed()
  }
  const pickPen = (pen: PenKind) => {
    opts.current = { ...opts.current, pen }
    pickTool('freedraw')
    changed()
  }

  const setProp = <K extends keyof Style>(k: K, value: Style[K]) => {
    const ed = editingRef.current
    if (ed && (k === 'bold' || k === 'italic' || k === 'font' || k === 'fontSize')) {
      const e = ed.el
      const ta = document.getElementById(`board-text-${id}`) as HTMLTextAreaElement | null
      const txt = ta?.value ?? e.text ?? ''
      const next = { ...e, [k]: value }
      const m = measureText(txt || ' ', next.fontSize, next)
      mutate(e, { [k]: value, ...m } as Partial<El>)
      if (ta) {
        ta.style.width = `${(m.w + next.fontSize) * view.current.zoom}px`
        ta.style.height = `${m.h * view.current.zoom}px`
      }
      bump()
      redraw()
      return
    }
    if (!selection.length) style.current = { ...style.current, [k]: value }
    for (const e of selection) {
      if (e.kind === 'text' && (k === 'fontSize' || k === 'bold' || k === 'italic' || k === 'font')) {
        const next = { ...e, [k]: value }
        const m = measureText(e.text ?? '', next.fontSize, next)
        if (k === 'fontSize') {
          const c = centerOf(e)
          mutate(e, { fontSize: value as number, ...m, x: c[0] - m.w / 2, y: c[1] - m.h / 2 })
        } else mutate(e, { [k]: value, ...m } as Partial<El>)
      } else mutate(e, { [k]: value } as Partial<El>)
    }
    if (selection.length) commit()
    else changed()
  }

  /** chèn hoặc bọc đoạn đang bôi đen thành chỉ số trên (^{...}) / chỉ số dưới (_{...}) khi đang gõ chữ */
  const wrapScript = (ch: '^' | '_') => {
    const ed = editingRef.current
    if (!ed) return
    const ta = document.getElementById(`board-text-${id}`) as HTMLTextAreaElement | null
    if (!ta) return
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    const val = ta.value
    const selText = val.slice(start, end)
    const nextVal = `${val.slice(0, start)}${ch}{${selText}}${val.slice(end)}`
    ta.value = nextVal
    const caret = selText.length ? start + 2 + selText.length + 1 : start + 2
    ta.setSelectionRange(caret, caret)
    const e = ed.el
    const m = measureText(nextVal || ' ', e.fontSize, e)
    ta.style.width = `${(m.w + e.fontSize) * view.current.zoom}px`
    ta.style.height = `${m.h * view.current.zoom}px`
    mutate(e, { w: m.w, h: m.h })
    redraw()
  }

  /* ---------- ô nhập chữ ---------- */

  const v = view.current
  let textarea: ReactNode = null
  if (editing) {
    const e = editing.el
    const c = centerOf(e)
    const fs = e.fontSize * v.zoom
    textarea = (
      <textarea
        id={`board-text-${id}`}
        autoFocus
        defaultValue={e.text}
        spellCheck={false}
        onBlur={(ev) => finishText(ev.currentTarget.value)}
        onKeyDown={(ev) => {
          const mod = ev.ctrlKey || ev.metaKey
          const k = ev.key.toLowerCase()
          if (mod && k === 'b') { ev.preventDefault(); setProp('bold', !e.bold); return }
          if (mod && k === 'i') { ev.preventDefault(); setProp('italic', !e.italic); return }
          if (mod && ev.key === '.') { ev.preventDefault(); wrapScript('^'); return }
          if (mod && ev.key === ',') { ev.preventDefault(); wrapScript('_'); return }
          if (ev.key === 'Escape' || (ev.key === 'Enter' && mod)) {
            ev.preventDefault()
            ev.currentTarget.blur()
          }
        }}
        onInput={(ev) => {
          const ta = ev.currentTarget
          const m = measureText(ta.value || ' ', e.fontSize, e)
          ta.style.width = `${(m.w + e.fontSize) * v.zoom}px`
          ta.style.height = `${m.h * v.zoom}px`
          // khung chọn co giãn theo chữ ngay lúc gõ (không đợi gõ xong)
          mutate(e, { w: m.w, h: m.h })
          redraw()
        }}
        className="absolute z-10 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
        style={{
          left: (e.x + v.scrollX) * v.zoom,
          top: (e.y + v.scrollY) * v.zoom,
          width: (Math.max(e.w, 1) + e.fontSize) * v.zoom,
          height: Math.max(e.h, e.fontSize * LINE_HEIGHT) * v.zoom,
          font: fontOf(fs, e),
          lineHeight: LINE_HEIGHT,
          color: e.stroke,
          opacity: e.opacity / 100,
          transform: e.angle ? `rotate(${e.angle}rad)` : undefined,
          transformOrigin: `${(c[0] - e.x) * v.zoom}px ${(c[1] - e.y) * v.zoom}px`,
          whiteSpace: 'pre',
        }}
      />
    )
  }

  const main: Main = tool === 'freedraw' ? 'pen' : SHAPES.includes(tool as Kind) ? 'shape' : (tool as Main)
  const isHighlight = tool === 'freedraw' && o.pen === 'highlight' && !selection.length
  const hasShape = main === 'shape' || [...kinds].some((k) => SHAPES.includes(k))
  // hàng màu gần đây riêng theo công cụ (đang chọn hình thì theo loại hình được chọn)
  const ctxTool = selection.length
    ? selection.every((e) => e.kind === 'text') ? 'text' : selection.every((e) => e.kind === 'freedraw') ? 'pen' : 'shape'
    : tool === 'text' ? 'text' : tool === 'freedraw' ? 'pen' : 'shape'
  const recentKey = isHighlight ? 'recentHighlights' : ctxTool === 'text' ? 'recentTextColors' : ctxTool === 'shape' ? 'recentShapeColors' : 'recentColors'
  const colors = o[recentKey] ?? DEFAULT_OPTS[recentKey]
  /** dùng một màu: tô cho nét/hình, rồi đưa màu đó lên đầu hàng */
  const useColor = (c: string) => {
    const list = opts.current[recentKey] ?? DEFAULT_OPTS[recentKey]
    opts.current = { ...opts.current, [recentKey]: [c, ...list.filter((x) => x.toLowerCase() !== c.toLowerCase())].slice(0, list.length || 6) }
    setProp('stroke', c)
  }
  const widths = isHighlight ? [4, 6, 8, 11, 14, 18] : [0.5, 1, 1.5, 2, 3, 5]
  const WIDTH_NAMES = ['rất mảnh', 'mảnh', 'vừa', 'hơi đậm', 'đậm', 'rất đậm']

  /* nhóm tuỳ chọn dùng lại giữa các công cụ */
  const colorRow = (
    <Group label="Màu">
      {colors.map((c) => (
        <Swatch key={c} color={c} round active={cur.stroke.toLowerCase() === c.toLowerCase()} onClick={() => useColor(c)} title={onlyText ? 'Màu chữ' : 'Màu nét'} />
      ))}
      <Pop id="color" pop={pop} setPop={setPop} title="Màu khác"
        face={<span className="mx-[3px] block h-5 w-5 rounded-full border border-black/10" style={{ background: 'conic-gradient(#e03131, #f08c00, #fab005, #2f9e44, #1971c2, #7048e8, #e03131)' }} />}>
        <div className="grid grid-cols-10 gap-1">
          {THEME_COLORS.map((c) => (
            <button key={c} type="button" data-tip={c} aria-label={c} onClick={() => { useColor(c); setPop(null) }}
              className={`h-[18px] w-[18px] rounded-[3px] border border-black/10 hover:scale-110 ${cur.stroke === c ? 'ring-2 ring-clay ring-offset-1' : ''}`} style={{ background: c }} />
          ))}
        </div>
        <HexInput value={cur.stroke} onPreview={(c) => setProp('stroke', c)} onCommit={useColor} />
      </Pop>
    </Group>
  )
  const fontRow = (
    <Group label="Cỡ chữ">
      {[16, 24, 36, 56].map((s, i) => (
        <Chip key={s} active={cur.fontSize === s} onClick={() => setProp('fontSize', s)} title={`Chữ ${['nhỏ', 'vừa', 'lớn', 'rất lớn'][i]}`}>
          <span className="font-semibold" style={{ fontSize: 10 + i * 3 }}>A</span>
        </Chip>
      ))}
    </Group>
  )
  const keepFocus = (ev: React.MouseEvent) => ev.preventDefault()
  const subHint = 'Bấm đúp vào chữ để gõ rồi chọn phần cần làm chỉ số'
  const textStyleRow = (
    <Group label="Kiểu chữ">
      <Chip active={!!cur.bold} onMouseDown={keepFocus} onClick={() => setProp('bold', !cur.bold)} title="Đậm — Ctrl+B">
        <span className="font-bold text-[13.5px]">B</span>
      </Chip>
      <Chip active={!!cur.italic} onMouseDown={keepFocus} onClick={() => setProp('italic', !cur.italic)} title="Nghiêng — Ctrl+I">
        <span className="font-serif italic text-[14px]">I</span>
      </Chip>
      <Chip active={cur.font === 'serif'} onMouseDown={keepFocus} onClick={() => setProp('font', cur.font === 'serif' ? undefined : 'serif')} title="Chữ có chân (Serif)">
        <span className="font-serif text-[13px]">Aa</span>
      </Chip>
      <Chip active={false} onMouseDown={keepFocus} onClick={() => { if (editing) wrapScript('^') }} title={editing ? 'Chỉ số trên — Ctrl+.' : subHint}>
        <span className={`text-[12.5px] leading-none ${editing ? '' : 'opacity-40'}`}>x<sup className="text-[9px]">2</sup></span>
      </Chip>
      <Chip active={false} onMouseDown={keepFocus} onClick={() => { if (editing) wrapScript('_') }} title={editing ? 'Chỉ số dưới — Ctrl+,' : subHint}>
        <span className={`text-[12.5px] leading-none ${editing ? '' : 'opacity-40'}`}>x<sub className="text-[9px]">2</sub></span>
      </Chip>
    </Group>
  )
  const strokeDash = cur.strokeStyle === 'dashed' ? '5 4' : cur.strokeStyle === 'dotted' ? '0.5 4' : undefined
  const previewW = Math.min(7, Math.max(1, cur.strokeWidth * (isHighlight ? 0.38 : 1.2)))
  const strokePop = (
    <Pop id="stroke" pop={pop} setPop={setPop} title="Nét"
      face={(
        <span className="flex items-center gap-1.5 px-1 text-[12.5px] text-ink">
          <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden>
            <path
              d="M2 6h24"
              stroke={cur.stroke}
              strokeOpacity={isHighlight ? 0.5 : 1}
              strokeWidth={previewW}
              strokeLinecap="round"
              strokeDasharray={strokeDash}
            />
          </svg>
          <span className="hidden sm:inline">Nét</span>
        </span>
      )}>
      <PanelRow label="Độ dày">
        {widths.map((w, i) => (
          <Chip key={w} active={cur.strokeWidth === w} onClick={() => setProp('strokeWidth', w)} title={`Nét ${WIDTH_NAMES[i]}`}>
            <span className="flex h-4 w-5 items-center justify-center">
              <span className="block w-4 rounded-full bg-current" style={{ height: [1, 1.5, 2.5, 3.5, 5, 7][i] }} />
            </span>
          </Chip>
        ))}
      </PanelRow>
      <PanelRow label="Kiểu nét">
        {(['solid', 'dashed', 'dotted'] as const).map((st, i) => (
          <Chip key={st} active={cur.strokeStyle === st} onClick={() => setProp('strokeStyle', st)} title={`Nét ${['liền', 'đứt', 'chấm'][i]}`}>
            <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden>
              <path d="M1 5h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={st === 'dashed' ? '5 4' : st === 'dotted' ? '0.5 4' : undefined} />
            </svg>
          </Chip>
        ))}
      </PanelRow>
      {hasShape && (
        <PanelRow label="Nét vẽ">
          <Chip active={cur.roughness === 0} onClick={() => setProp('roughness', 0)} title="Nét thẳng, gọn">Thẳng</Chip>
          <Chip active={cur.roughness >= 1} onClick={() => setProp('roughness', 1)} title="Nét như vẽ tay">Vẽ tay</Chip>
        </PanelRow>
      )}
      {selection.length > 0 && !onlyText && hasText && (
        <PanelRow label="Cỡ chữ">
          {[16, 24, 36, 56].map((s, i) => (
            <Chip key={s} active={cur.fontSize === s} onClick={() => setProp('fontSize', s)} title={`Chữ ${['nhỏ', 'vừa', 'lớn', 'rất lớn'][i]}`}>
              <span className="font-semibold" style={{ fontSize: 10 + i * 3 }}>A</span>
            </Chip>
          ))}
        </PanelRow>
      )}
    </Pop>
  )
  const fillPopBody = (
    <>
      <PanelRow label="Màu nền">
        {FILLS.map((c) => <Swatch key={c} color={c} drag={cur.fillStyle} active={cur.fill === c} onClick={() => setProp('fill', c)} />)}
        <button type="button" data-tip="Màu khác" aria-label="Màu khác" aria-expanded={moreFill} onClick={() => setMoreFill((v) => !v)}
          className={`mx-[3px] h-5 w-5 shrink-0 rounded-[5px] border border-black/10 hover:scale-110 ${moreFill || (cur.fill !== 'transparent' && !FILLS.includes(cur.fill)) ? 'ring-2 ring-clay ring-offset-2 ring-offset-surface' : ''}`}
          style={{ background: 'conic-gradient(#e03131, #f08c00, #fab005, #2f9e44, #1971c2, #7048e8, #e03131)' }} />
      </PanelRow>
      {moreFill && <MoreColors value={cur.fill} drag={cur.fillStyle} onPick={(c) => setProp('fill', c)} onPreview={(c) => setProp('fill', c)} />}
      {cur.fill !== 'transparent' && (
        <PanelRow label="Kiểu tô">
          <Chip active={cur.fillStyle === 'hachure'} onClick={() => setProp('fillStyle', 'hachure')}>Gạch chéo</Chip>
          <Chip active={cur.fillStyle === 'solid'} onClick={() => setProp('fillStyle', 'solid')}>Đặc</Chip>
          <Chip active={cur.fillStyle === 'glass'} onClick={() => setProp('fillStyle', 'glass')} title="Màu trong suốt như kính, nhìn xuyên được hình phía sau">Kính</Chip>
        </PanelRow>
      )}
    </>
  )
  const fillPop = (
    <Pop id="fill" pop={pop} setPop={setPop} title="Tô nền"
      face={<span className="flex items-center gap-1.5 px-1 text-[12.5px] text-ink"><span className="h-4 w-4 rounded-[4px] border border-line" style={{ background: cur.fill === 'transparent' ? NONE_BG : cur.fill }} />Tô nền</span>}>
      {fillPopBody}
    </Pop>
  )
  const opacityPopBody = (
    <div className="w-[180px]">
      <input type="range" min={10} max={100} step={10} value={cur.opacity}
        onChange={(e) => setProp('opacity', Number(e.target.value))} className="w-full accent-[#b4532a]" />
    </div>
  )

  const selPillBtn = 'flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-ink transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 sm:h-8 sm:min-w-8'

  let options: ReactNode
  /** hàng thứ 3 khi đang chọn: thao tác với phần đang chọn, thanh viên thuốc nổi trên bảng */
  let selActions: ReactNode = null
  if (selection.length) {
    const canGroup = selection.length > 1 && !selection.every((e) => e.groupId && e.groupId === selection[0].groupId)
    const canUngroup = selection.some((e) => e.groupId)
    const blocks = groupBlocks(selection)
    const movableBlocks = blocks.filter((b) => !b.locked)
    const canAlign = blocks.length >= 2 && movableBlocks.length >= 1
    const canDist = movableBlocks.length >= 3
    const alignItems: { id: AlignKind; tip: string; kbd?: string; disabled?: boolean; icon: ReactNode }[] = [
      {
        id: 'left', tip: 'Căn trái', kbd: 'Alt+A',
        icon: <><path d="M4 4v16" /><rect x="7" y="6" width="12" height="4.5" rx="1" /><rect x="7" y="13.5" width="7" height="4.5" rx="1" /></>,
      },
      {
        id: 'centerX', tip: 'Căn giữa ngang', kbd: 'Alt+H',
        icon: <><path d="M12 3v3M12 10.5v3M12 18v3" /><rect x="5" y="6" width="14" height="4.5" rx="1" /><rect x="7.5" y="13.5" width="9" height="4.5" rx="1" /></>,
      },
      {
        id: 'right', tip: 'Căn phải', kbd: 'Alt+D',
        icon: <><path d="M20 4v16" /><rect x="5" y="6" width="12" height="4.5" rx="1" /><rect x="10" y="13.5" width="7" height="4.5" rx="1" /></>,
      },
      {
        id: 'top', tip: 'Căn trên', kbd: 'Alt+W',
        icon: <><path d="M4 4h16" /><rect x="6" y="7" width="4.5" height="12" rx="1" /><rect x="13.5" y="7" width="4.5" height="7" rx="1" /></>,
      },
      {
        id: 'centerY', tip: 'Căn giữa dọc', kbd: 'Alt+V',
        icon: <><path d="M3 12h3M10.5 12h3M18 12h3" /><rect x="6" y="5" width="4.5" height="14" rx="1" /><rect x="13.5" y="7.5" width="4.5" height="9" rx="1" /></>,
      },
      {
        id: 'bottom', tip: 'Căn dưới', kbd: 'Alt+S',
        icon: <><path d="M4 20h16" /><rect x="6" y="5" width="4.5" height="12" rx="1" /><rect x="13.5" y="10" width="4.5" height="7" rx="1" /></>,
      },
      {
        id: 'distX', tip: 'Giãn đều ngang (cần ≥ 3 khối)', disabled: !canDist,
        icon: <><path d="M4 4v16M20 4v16" /><rect x="7" y="7" width="3.5" height="10" rx="1" /><rect x="13.5" y="7" width="3.5" height="10" rx="1" /></>,
      },
      {
        id: 'distY', tip: 'Giãn đều dọc (cần ≥ 3 khối)', disabled: !canDist,
        icon: <><path d="M4 4h16M4 20h16" /><rect x="7" y="7" width="10" height="3.5" rx="1" /><rect x="7" y="13.5" width="10" height="3.5" rx="1" /></>,
      },
    ]
    const hasLocked = selection.some((e) => e.locked)
    const allLocked = selection.every((e) => e.locked)
    const lockBtn = (
      <SelBtn label={allLocked ? 'Mở khoá — Ctrl+Shift+L' : 'Khoá hình — Ctrl+Shift+L'} onClick={toggleLock}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          {allLocked
            ? <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            : <path d="M8 11V7a4 4 0 0 1 7.6-1.7" />}
        </svg>
      </SelBtn>
    )
    const dupBtn = (
      <SelBtn label="Nhân đôi — Ctrl+D" onClick={duplicate}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      </SelBtn>
    )
    const askAiBtn = (
      <button
        type="button" onClick={askAi} data-tip="Đính kèm phần đang chọn vào khung chat Trợ lý AI" aria-label="Đính kèm phần đang chọn vào khung chat Trợ lý AI"
        className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-medium text-ink transition-all hover:bg-sunken active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 sm:h-8"
      >
        <AiIcon size={16} /><span>Hỏi AI</span>
      </button>
    )
    selActions = hasLocked ? (
      <>
        {lockBtn}
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />
        {dupBtn}
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />
        {askAiBtn}
      </>
    ) : (
      <>
        {/* cụm 1: tô nền + độ trong */}
        <div className="flex shrink-0 items-center gap-0.5">
          {!toolDoc && canFill && (
            <Pop id="fill" pop={pop} setPop={setPop} title="Tô nền"
              btnClassName={`${selPillBtn} w-9 px-0 sm:w-8 sm:px-0`}
              face={(
                <span className="flex flex-col items-center justify-center gap-[2px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11z" />
                    <path d="M5 2l5 5M2 13h15" />
                    <path d="M21 15s1.8 2.1 1.8 3.3a1.8 1.8 0 1 1-3.6 0c0-1.2 1.8-3.3 1.8-3.3z" />
                  </svg>
                  <span className="h-[3px] w-4 rounded-full border border-black/15" style={{ background: cur.fill === 'transparent' ? NONE_BG : cur.fill }} />
                </span>
              )}>
              {fillPopBody}
            </Pop>
          )}
          <Pop id="opacity" pop={pop} setPop={setPop} title="Độ trong"
            btnClassName={selPillBtn}
            face={(
              <span className="flex items-center gap-1.5 text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none" />
                </svg>
                <span className="text-[11.5px] font-medium tabular-nums leading-none">{cur.opacity}%</span>
              </span>
            )}>
            {opacityPopBody}
          </Pop>
        </div>

        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />

        {/* cụm 2: hỏi AI */}
        {askAiBtn}

        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />

        {canAlign && (
          <>
            <Pop id="align" pop={pop} setPop={setPop} title="Căn chỉnh"
              btnClassName={`${selPillBtn} w-9 px-0 sm:w-8 sm:px-0`}
              face={(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 4v16" />
                  <rect x="7" y="6" width="12" height="4.5" rx="1" />
                  <rect x="7" y="13.5" width="7" height="4.5" rx="1" />
                </svg>
              )}>
              <div className="grid grid-cols-3 gap-1 p-0.5">
                {alignItems.slice(0, 6).map((it) => (
                  <button
                    key={it.id} type="button" data-tip={it.tip} data-tip-kbd={it.kbd} aria-label={it.tip}
                    onClick={() => { align(it.id); setPop(null) }}
                    className="grid h-9 w-9 place-items-center rounded-[7px] text-ink transition-colors hover:bg-sunken active:scale-95 sm:h-8 sm:w-8"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {it.icon}
                    </svg>
                  </button>
                ))}
              </div>
              <div className="my-1 h-px bg-line" />
              <div className="grid grid-cols-2 gap-1 p-0.5">
                {alignItems.slice(6).map((it) => (
                  <button
                    key={it.id} type="button" disabled={it.disabled} data-tip={it.tip} aria-label={it.tip}
                    onClick={() => { align(it.id); setPop(null) }}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-[7px] px-2 text-[11.5px] text-ink transition-colors hover:bg-sunken active:scale-95 disabled:pointer-events-none disabled:opacity-35 sm:h-8"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {it.icon}
                    </svg>
                    <span>{it.id === 'distX' ? 'Ngang' : 'Dọc'}</span>
                  </button>
                ))}
              </div>
            </Pop>
            <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />
          </>
        )}

        {/* cụm 3: sắp xếp & nhân đôi */}
        <div className="flex shrink-0 items-center gap-0.5">
          <SelBtn label="Đưa lên trên cùng" onClick={() => reorder('front')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="10" height="10" rx="2" fill="currentColor" />
              <path d="M15 11h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4" />
              <path d="M17.5 8.5V3m-2.2 2.2L17.5 3l2.2 2.2" />
            </svg>
          </SelBtn>
          <SelBtn label="Đưa xuống dưới cùng" onClick={() => reorder('back')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="10" height="10" rx="2" />
              <rect x="11" y="11" width="10" height="10" rx="2" fill="currentColor" />
              <path d="M17.5 3v5.5m-2.2-2.2 2.2 2.2 2.2-2.2" />
            </svg>
          </SelBtn>
          {canGroup && (
            <SelBtn label="Nhóm lại — Ctrl+G" onClick={group}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="3 2.5" />
                <rect x="6.5" y="6.5" width="5" height="5" rx="1" />
                <rect x="12.5" y="12.5" width="5" height="5" rx="1" />
              </svg>
            </SelBtn>
          )}
          {canUngroup && (
            <SelBtn label="Tách nhóm — Ctrl+Shift+G" onClick={ungroup}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 3h5a2 2 0 0 1 2 2v5M10 21H5a2 2 0 0 1-2-2v-5" strokeDasharray="2.5 2.5" />
                <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
                <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
              </svg>
            </SelBtn>
          )}
          {dupBtn}
        </div>

        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />

        {lockBtn}

        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line" />

        {/* cụm 4: xoá */}
        <SelBtn label="Xoá — Delete" onClick={deleteSelected} danger>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" />
          </svg>
        </SelBtn>
      </>
    )
    options = (
      <>
        <Group><span className="rounded-full bg-clay/15 px-2 py-0.5 text-[11.5px] font-medium text-clay">Đã chọn {selection.length}{hasLocked ? ' · Đã khoá' : ''}</span></Group>
        {tool === 'select' && (
          <Group>
            <Chip active={o.selectMode === 'box'} onClick={() => setOpt('selectMode', 'box')} title="Chọn bằng khung chữ nhật"><Ico d="M4 4h16v16H4z" /></Chip>
            <Chip active={o.selectMode === 'lasso'} onClick={() => setOpt('selectMode', 'lasso')} title="Chọn bằng khoanh tự do"><Ico d={LASSO_D} /></Chip>
          </Group>
        )}
        {!hasLocked && toolDoc && (
          <Group>
            <Chip onClick={() => setDialog({ t: 'tool', doc: toolDoc, ids: selection.map((e) => e.id) })} title="Mở lại bảng thông số của hình (như bấm đúp)">
              <Ico d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" /><span>Sửa hình</span>
            </Chip>
          </Group>
        )}
        {!hasLocked && !onlyImage && colorRow}
        {!hasLocked && !toolDoc && !onlyText && !onlyImage && <Group>{strokePop}</Group>}
        {!hasLocked && !toolDoc && onlyText && fontRow}
        {!hasLocked && !toolDoc && hasText && textStyleRow}
      </>
    )
  } else if (main === 'pen') {
    options = (
      <>
        <Group label="Bút">
          {PENS.filter((pn) => pn.outside).map((pn) => (
            <Chip key={pn.id} active={o.pen === pn.id} onClick={() => pickPen(pn.id)} title={pn.label}>
              <Ico d={pn.icon} />
              <span>{pn.label}</span>
            </Chip>
          ))}
          <Pop id="pens" pop={pop} setPop={setPop} title="Kiểu bút"
            face={(() => {
              const inner = PENS.find((pn) => pn.id === o.pen && !pn.outside)
              return (
                <span className={`flex h-8 items-center gap-1.5 rounded-[7px] px-1.5 text-[12.5px] ${inner ? 'bg-clay/10 text-clay' : 'text-ink'}`}>
                  <Ico d={inner?.icon ?? FOUNTAIN_D} />
                  {inner?.label ?? 'Kiểu bút'}
                  <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                </span>
              )
            })()}>
            <PenPanel
              pen={o.pen} color={styles.current[o.pen].stroke} width={styles.current[o.pen].strokeWidth}
              tip={o.penTips[o.pen] ?? DEFAULT_TIP}
              onPen={pickPen}
              onTip={(tp) => setOpt('penTips', { ...o.penTips, [o.pen]: tp })}
            />
          </Pop>
        </Group>
        {colorRow}
        <Group>{strokePop}</Group>
        <Group>
          <Toggle on={o.snap} onClick={() => setOpt('snap', !o.snap)}>Giữ bút để nắn hình</Toggle>
        </Group>
      </>
    )
  } else if (main === 'eraser') {
    options = (
      <>
        <Group label="Cách gôm">
          <Chip active={o.eraseMode === 'stroke'} onClick={() => setOpt('eraseMode', 'stroke')} title="Chạm vào nét nào xoá cả nét đó">
            <Ico d="M4 15c3-6 6-6 8-2s5 4 8-2M9 7l6 6M15 7l-6 6" /><span>Cả nét</span>
          </Chip>
          <Chip active={o.eraseMode === 'partial'} onClick={() => setOpt('eraseMode', 'partial')} title="Chỉ xoá phần nét bút đi qua">
            <Ico d="M3 14c2-4 4-4 5-2M16 12c1 2 3 2 5-2M10.5 9.5a2.5 2.5 0 1 0 3 3" /><span>Từng phần</span>
          </Chip>
        </Group>
        <Group label="Cỡ gôm">
          {ERASE_R.map((r, i) => (
            <Chip key={r} active={o.eraseSize === i} onClick={() => setOpt('eraseSize', i)} title={`Gôm ${['nhỏ', 'vừa', 'to'][i]}`}>
              <span className="rounded-full bg-current opacity-70" style={{ width: 6 + i * 4, height: 6 + i * 4 }} />
            </Chip>
          ))}
        </Group>
        <Group>
          <Chip onClick={() => { if (!els.current.length) return; els.current = []; selected.current.clear(); commit() }} title="Xoá mọi thứ trên bảng (Ctrl+Z để lấy lại)">
            <Ico d="M5 7h14M10 7V5h4v2m-7 0l1 12h8l1-12" /><span>Xoá cả bảng</span>
          </Chip>
        </Group>
      </>
    )
  } else if (main === 'laser') {
    options = (
      <>
        <Group label="Màu">
          {LASER_COLORS.map((c) => (
            <Swatch key={c} color={c} round active={o.laserColor === c} onClick={() => setOpt('laserColor', c)} title="Màu laser" />
          ))}
          <Pop id="laserColor" pop={pop} setPop={setPop} title="Màu khác"
            face={<span className={`mx-[3px] block h-5 w-5 rounded-full border border-black/10 ${!LASER_COLORS.includes(o.laserColor) ? 'ring-2 ring-clay ring-offset-2 ring-offset-surface' : ''}`} style={{ background: 'conic-gradient(#e03131, #f08c00, #fab005, #2f9e44, #1971c2, #7048e8, #e03131)' }} />}>
            <div className="grid grid-cols-10 gap-1">
              {THEME_COLORS.map((c) => (
                <button key={c} type="button" data-tip={c} aria-label={c} onClick={() => { setOpt('laserColor', c); setPop(null) }}
                  className={`h-[18px] w-[18px] rounded-[3px] border border-black/10 hover:scale-110 ${o.laserColor === c ? 'ring-2 ring-clay ring-offset-1' : ''}`} style={{ background: c }} />
              ))}
            </div>
            <HexInput value={o.laserColor} onPreview={(c) => setOpt('laserColor', c)} onCommit={(c) => setOpt('laserColor', c)} />
          </Pop>
        </Group>
        <Group label="Độ dày">
          {LASER_SIZES.map((sz, i) => (
            <Chip key={sz} active={o.laserSize === sz} onClick={() => setOpt('laserSize', sz)} title={`Laser ${WIDTH_NAMES[i + 1]}`}>
              <span className="flex size-4 items-center justify-center">
                <span className="rounded-full" style={{ width: DOT_SIZES[i + 1], height: DOT_SIZES[i + 1], background: o.laserColor }} />
              </span>
            </Chip>
          ))}
        </Group>
      </>
    )
  } else if (main === 'bucket') {
    options = (
      <>
        <Group label="Màu tô">
          {FILLS.map((c) => (
            <Swatch key={c} color={c} drag={o.bucketStyle} active={o.bucketFill === c} onClick={() => setOpt('bucketFill', c)} title="Bấm vào hình để tô, hoặc kéo màu thả vào hình" />
          ))}
          <Pop id="bucketMore" pop={pop} setPop={setPop} title="Màu khác"
            face={<span className={`mx-[3px] block h-5 w-5 rounded-[5px] border border-black/10 ${!FILLS.includes(o.bucketFill) ? 'ring-2 ring-clay ring-offset-2 ring-offset-surface' : ''}`} style={{ background: 'conic-gradient(#e03131, #f08c00, #fab005, #2f9e44, #1971c2, #7048e8, #e03131)' }} />}>
            <MoreColors value={o.bucketFill} drag={o.bucketStyle} onPick={(c) => setOpt('bucketFill', c)} onPreview={(c) => setOpt('bucketFill', c)} />
          </Pop>
        </Group>
        <Group label="Kiểu tô">
          <Chip active={o.bucketStyle === 'solid'} onClick={() => setOpt('bucketStyle', 'solid')}>Đặc</Chip>
          <Chip active={o.bucketStyle === 'glass'} onClick={() => setOpt('bucketStyle', 'glass')} title="Màu trong suốt như kính, nhìn xuyên được hình phía sau">Kính</Chip>
          <Chip active={o.bucketStyle === 'hachure'} onClick={() => setOpt('bucketStyle', 'hachure')}>Gạch chéo</Chip>
        </Group>
        <Group><span className="text-[12px] text-ink-3">Bấm vào trong hình để tô · kéo ô màu thả vào hình cũng được</span></Group>
      </>
    )
  } else if (main === 'select') {
    options = (
      <>
        <Group label="Cách chọn">
          <Chip active={o.selectMode === 'box'} onClick={() => setOpt('selectMode', 'box')} title="Kéo khung chữ nhật để chọn"><Ico d="M4 4h16v16H4z" /><span>Khung</span></Chip>
          <Chip active={o.selectMode === 'lasso'} onClick={() => setOpt('selectMode', 'lasso')} title="Khoanh tự do quanh nét cần chọn"><Ico d={LASSO_D} /><span>Khoanh tự do</span></Chip>
        </Group>
        <Group>
          <Toggle on={o.guides} onClick={() => setOpt('guides', !o.guides)}>Đường gióng</Toggle>
        </Group>
      </>
    )
  } else if (main === 'shape') {
    options = (
      <>
        <Group label="Hình">
          {o.recentShapes.map((k) => SHAPE_BY_ID[k]).filter(Boolean).map((sd) => (
            <Chip key={sd.id} active={tool === sd.id} onClick={() => pickTool(sd.id)} title={sd.label} kbd={sd.kbd}><Ico d={sd.icon} /></Chip>
          ))}
          <Pop id="shapes" pop={pop} setPop={setPop} title="Tất cả hình"
            face={<span className="flex items-center gap-1 px-1 text-[12.5px] text-ink">Tất cả<svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></span>}>
            {SHAPE_SECTIONS.map((sec) => (
              <div key={sec.label}>
                <div className="mb-1 text-[11.5px] text-ink-3">{sec.label}</div>
                <div className="grid grid-cols-4 gap-1">
                  {sec.ids.map((k) => SHAPE_BY_ID[k]).map((sd) => (
                    <button key={sd.id} type="button" data-tip={sd.label} data-tip-kbd={sd.kbd} aria-label={sd.label} onClick={() => { pickTool(sd.id); setPop(null) }}
                      className={`flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-[7px] text-[11px] ${tool === sd.id ? 'bg-clay/15 text-clay' : 'text-ink hover:bg-sunken'}`}>
                      <Ico d={sd.icon} size={18} />
                      <span>{sd.short}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Pop>
        </Group>
        {colorRow}
        <Group>{strokePop}</Group>
        {canFill && <Group>{fillPop}</Group>}
        <Group>
          <Toggle on={o.keepTool} onClick={() => setOpt('keepTool', !o.keepTool)} title="Vẽ xong vẫn giữ công cụ Hình để vẽ tiếp — Q">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span>Giữ công cụ</span>
          </Toggle>
        </Group>
      </>
    )
  } else if (main === 'text') {
    options = (
      <>
        {colorRow}
        {fontRow}
        {textStyleRow}
      </>
    )
  } else {
    options = null
  }

  const hasSel = selection.length > 0
  if (selActions) lastSelActionsRef.current = selActions
  useEffect(() => {
    if (hasSel) {
      setSelBarMounted(true)
      const raf = requestAnimationFrame(() => setSelBarVisible(true))
      return () => cancelAnimationFrame(raf)
    }
    setSelBarVisible(false)
    const t = window.setTimeout(() => {
      setSelBarMounted(false)
      lastSelActionsRef.current = null
    }, 150)
    return () => window.clearTimeout(t)
  }, [hasSel])

  const mainTools: { id: Main; label: string; tip: string; kbd: string; icon: string; onClick: () => void }[] = [
    { id: 'pen', label: 'Bút', tip: 'Bút vẽ', kbd: 'P', icon: PEN_D, onClick: () => pickTool('freedraw') },
    { id: 'eraser', label: 'Gôm', tip: 'Gôm', kbd: 'E', icon: ERASER_D, onClick: () => pickTool('eraser') },
    { id: 'laser', label: 'Laser', tip: 'Bút laser (chỉ trỏ, tự mờ)', kbd: 'K', icon: LASER_D, onClick: () => pickTool('laser') },
    { id: 'select', label: 'Chọn', tip: 'Chọn', kbd: 'V', icon: SELECT_D, onClick: () => pickTool('select') },
    { id: 'shape', label: 'Hình', tip: 'Hình', kbd: SHAPE_KEYS[o.lastShape] ?? 'R', icon: SHAPE_D, onClick: () => pickTool(o.lastShape) },
    { id: 'bucket', label: 'Tô màu', tip: 'Tô màu vùng kín', kbd: 'G', icon: BUCKET_D, onClick: () => pickTool('bucket') },
    { id: 'text', label: 'Chữ', tip: 'Chữ', kbd: 'T', icon: TEXT_D, onClick: () => pickTool('text') },
    { id: 'hand', label: 'Kéo', tip: 'Kéo bảng', kbd: 'H', icon: HAND_D, onClick: () => pickTool('hand') },
  ]

  return (
    <div className="board-editor flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* tầng 1: công cụ chính · tầng 2: tuỳ chọn của công cụ đang chọn */}
      <div className="relative z-20 shrink-0 border-b border-line bg-surface">
        <div className="@container flex h-12 min-w-0 items-end gap-1.5 px-2 pb-1 sm:gap-2 sm:px-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] sm:flex-none sm:gap-2 sm:overflow-visible">
            <div className="flex shrink-0 items-center gap-0.5">
              <IconBtn label={`Hoàn tác — ${MOD_KEY}+Z`} onClick={undo} disabled={undoStack.current.length < 2}><Ico d={UNDO_D} /></IconBtn>
              <IconBtn label={`Làm lại — ${MOD_KEY}+Y`} onClick={redo} disabled={!redoStack.current.length}><Ico d={REDO_D} /></IconBtn>
            </div>
            <span className="h-5 w-px shrink-0 bg-line" />
            <div ref={segRef} className="relative flex shrink-0 items-center gap-0.5 rounded-[10px] bg-sunken p-[3px]">
              {/* nền trắng trượt theo công cụ đang chọn */}
              <span
                aria-hidden
                className="absolute top-[3px] h-9 rounded-[7px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] transition-[left,width] duration-200 ease-out sm:h-8"
                style={{ left: seg.l, width: seg.w, opacity: seg.w ? 1 : 0 }}
              />
              {mainTools.map((m) => (
                <button
                  key={m.id} type="button" data-tip={m.tip} data-tip-kbd={m.kbd} aria-label={m.tip} aria-pressed={main === m.id} onClick={m.onClick}
                  className={`${m.id === 'laser' || m.id === 'hand' ? 'hidden sm:flex' : 'flex'} relative h-9 min-w-9 items-center justify-center gap-1.5 rounded-[7px] px-2 text-[13px] transition-colors duration-200 sm:h-8 sm:min-w-0 sm:px-3 ${main === m.id ? 'text-clay' : 'text-ink-2 hover:text-ink'}`}
                >
                  <Ico d={m.icon} size={16} />
                  <span className="hidden @[1300px]:inline">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <Pop id="insert" pop={pop} setPop={setPop} title="Chèn" align="right" className="hidden sm:block"
              face={<span className="flex items-center gap-1.5 px-1.5 text-[13px] text-ink"><Ico d={PLUS_D} size={16} />Chèn</span>}>
              <button type="button" onClick={() => { setPop(null); fileRef.current?.click() }} className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-ink hover:bg-sunken">
                <Ico d={IMG_D} size={16} />Ảnh hoặc PDF vào bảng
              </button>
              <button type="button" onClick={() => { setPop(null); pdfRef.current?.click() }} className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-ink hover:bg-sunken">
                <Ico d={PDF_NOTE_D} size={16} />Mở PDF để ghi chú từng trang
              </button>
            </Pop>
            <input ref={pdfRef} type="file" hidden accept="application/pdf,.pdf" onChange={onOpenPdfNotes} />
            <input ref={fileRef} type="file" hidden multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf" onChange={onPickFile} />
            <button type="button" data-tip="Xuất PNG / PDF" onClick={() => setDialog({ t: 'export' })}
              className="hidden h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] text-ink hover:bg-sunken sm:flex">
              <Ico d={EXPORT_D} size={16} />Xuất
            </button>
            {busy && <span className="ml-1 text-[12px] text-ink-2">{busy}</span>}
            {saveErr && <span className="ml-1 text-[12px] text-red-600" data-tip="Bộ nhớ trình duyệt đã đầy: xoá bớt ảnh/trang PDF hoặc xuất bảng ra file để giữ lại">Chưa lưu được (đầy bộ nhớ)</span>}
            <span className="mx-1.5 hidden h-5 w-px bg-line @[1000px]:block" />
            <Pop id="inst" pop={pop} setPop={setPop} title="Dụng cụ hình học" align="right" className="hidden @[1000px]:block"
              face={<span className="flex items-center gap-1.5 px-1.5 text-[13px] text-ink"><Ico d={RULER_D} size={16} />Dụng cụ</span>}>
              <div className="text-[12px] font-medium text-ink-2">Dụng cụ hình học</div>
              {([['ruler', 'Thước kẻ', 'Vẽ sát mép thước thành đường thẳng'], ['protractor', 'Thước đo góc', 'Kéo kim đỏ để đo góc'], ['compass', 'Compa', 'Kéo núm xanh quanh kim để vẽ cung']] as const).map(([k, label, hint]) => (
                <button key={k} type="button" aria-pressed={!!inst[k]} onClick={() => toggleInst(k)}
                  className={`flex w-full flex-col items-start rounded-[6px] px-2 py-1.5 text-left text-[13px] hover:bg-sunken ${inst[k] ? 'text-clay' : 'text-ink'}`}>
                  <span className="flex items-center gap-2">{inst[k] ? '✓ ' : ''}{label}</span>
                  <span className="text-[11.5px] text-ink-2">{hint}</span>
                </button>
              ))}
            </Pop>
            <Pop id="paper" pop={pop} setPop={setPop} title="Kiểu giấy" align="right" className="hidden @[1000px]:block"
              face={<span className="flex items-center gap-1.5 px-1.5 text-[13px] text-ink"><Ico d={PAPER_D} size={16} />Giấy</span>}>
              <div className="text-[12px] font-medium text-ink-2">Kiểu giấy</div>
              <div className="grid grid-cols-2 gap-2">
                {PAPERS.map((pp) => {
                  const on = o.paper === pp.id
                  return (
                    <button key={pp.id} type="button" aria-pressed={on} onClick={() => { setOpt('paper', pp.id); setPop(null) }}
                      className="group flex flex-col items-center gap-1.5 rounded-[8px] p-1 text-[12px]">
                      <span
                        className={`relative block h-[64px] w-[88px] rounded-[6px] border bg-white transition-shadow ${on ? 'border-clay ring-2 ring-clay/30' : 'border-line group-hover:border-ink-3'}`}
                        style={{ backgroundImage: pp.bg, backgroundSize: '11px 11px', backgroundPosition: '5px 5px' }}
                      >
                        {on && (
                          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-clay text-white">
                            <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 5.2l2 2 4-4.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                        )}
                      </span>
                      <span className={on ? 'font-medium text-clay' : 'text-ink-2'}>{pp.label}</span>
                    </button>
                  )
                })}
              </div>
            </Pop>
            <div className="ml-1 hidden items-center rounded-[8px] border border-line sm:flex">
              <IconBtn label={`Thu nhỏ — ${MOD_KEY}+-`} onClick={() => zoomAt(v.zoom / 1.2)}><Ico d="M6 12h12" /></IconBtn>
              <button type="button" data-tip="Về 100%" data-tip-kbd={`${MOD_KEY}+0`} onClick={() => zoomAt(1)} className="h-8 w-12 rounded-[6px] text-center text-[12.5px] text-ink tnum hover:bg-sunken">
                {Math.round(v.zoom * 100)}%
              </button>
              <IconBtn label={`Phóng to — ${MOD_KEY}++`} onClick={() => zoomAt(v.zoom * 1.2)}><Ico d="M6 12h12M12 6v12" /></IconBtn>
            </div>
            <span className="mx-1.5 hidden h-5 w-px bg-line @[1000px]:block" />
            <div className="hidden items-center gap-0.5 @[1000px]:flex">
              <SideBtn label="Công cụ" on={side === 'tools'} onClick={() => toggleSide('tools')}><Ico d={WRENCH_D} size={16} /></SideBtn>
              <SideBtn label="Trợ lý" on={side === 'ai'} onClick={() => toggleSide('ai')}><AiIcon /></SideBtn>
            </div>
            <Pop id="more" pop={pop} setPop={setPop} title="Thêm" align="right" className="@[1000px]:hidden"
              face={<span className="flex items-center justify-center px-1 text-ink"><Ico d="M5 12h.01M12 12h.01M19 12h.01" size={18} /></span>}>
              <div className="w-[232px] space-y-2.5">
                <div className="space-y-1.5 sm:hidden">
                  <div className="grid grid-cols-2 gap-1.5">
                    {mainTools.filter((m) => m.id === 'laser' || m.id === 'hand').map((m) => (
                      <button key={m.id} type="button" aria-pressed={main === m.id} onClick={() => { setPop(null); m.onClick() }}
                        className={`flex h-9 items-center gap-2 rounded-[7px] border px-2 text-[13px] ${main === m.id ? 'border-clay bg-clay/10 font-medium text-clay' : 'border-line text-ink hover:bg-sunken'}`}>
                        <Ico d={m.icon} size={16} />{m.id === 'hand' ? 'Kéo trang' : m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-[8px] border border-line px-1 py-0.5">
                    <IconBtn label={`Thu nhỏ — ${MOD_KEY}+-`} onClick={() => zoomAt(v.zoom / 1.2)}><Ico d="M6 12h12" /></IconBtn>
                    <button type="button" data-tip="Về 100%" data-tip-kbd={`${MOD_KEY}+0`} onClick={() => zoomAt(1)} className="h-9 flex-1 rounded-[6px] text-center text-[12.5px] text-ink tnum hover:bg-sunken">
                      {Math.round(v.zoom * 100)}%
                    </button>
                    <IconBtn label={`Phóng to — ${MOD_KEY}++`} onClick={() => zoomAt(v.zoom * 1.2)}><Ico d="M6 12h12M12 6v12" /></IconBtn>
                  </div>
                  <button type="button" onClick={() => { setPop(null); fileRef.current?.click() }} className="flex h-9 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] text-ink hover:bg-sunken">
                    <Ico d={IMG_D} size={16} />Chèn ảnh / PDF vào bảng
                  </button>
                  <button type="button" onClick={() => { setPop(null); pdfRef.current?.click() }} className="flex h-9 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] text-ink hover:bg-sunken">
                    <Ico d={PDF_NOTE_D} size={16} />Mở PDF để ghi chú
                  </button>
                  <button type="button" onClick={() => { setPop(null); setDialog({ t: 'export' }) }} className="flex h-9 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] text-ink hover:bg-sunken">
                    <Ico d={EXPORT_D} size={16} />Xuất PNG / PDF
                  </button>
                  <div className="border-t border-line" />
                </div>
                <div>
                  <div className="mb-1.5 text-[12px] font-medium text-ink-2">Kiểu giấy</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAPERS.map((pp) => {
                      const on = o.paper === pp.id
                      return (
                        <button key={pp.id} type="button" aria-pressed={on} onClick={() => { setOpt('paper', pp.id); setPop(null) }}
                          className={`flex h-9 items-center gap-2 rounded-[7px] border px-2 text-[12px] ${on ? 'border-clay bg-clay/10 font-medium text-clay' : 'border-line text-ink-2 hover:bg-sunken'}`}>
                          <span className="h-4 w-4 shrink-0 rounded-[3px] border border-line bg-white" style={{ backgroundImage: pp.bg, backgroundSize: '8px 8px' }} />
                          <span>{pp.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="border-t border-line pt-1.5 space-y-1">
                  <Toggle on={o.guides} onClick={() => setOpt('guides', !o.guides)}>Đường gióng</Toggle>
                  <button type="button" onClick={() => { setPop(null); toggleSide('tools') }} className={`flex h-9 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] ${side === 'tools' ? 'bg-clay/10 font-medium text-clay' : 'text-ink hover:bg-sunken'}`}>
                    <Ico d={WRENCH_D} size={16} />Công cụ
                  </button>
                  <button type="button" onClick={() => { setPop(null); toggleSide('ai') }} className={`flex h-9 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] ${side === 'ai' ? 'bg-clay/10 font-medium text-clay' : 'text-ink hover:bg-sunken'}`}>
                    <AiIcon size={16} />Trợ lý AI
                  </button>
                </div>
              </div>
            </Pop>
          </div>
        </div>
        <div className="flex h-12 items-center overflow-x-auto [scrollbar-width:none] px-2 pb-1 text-[12.5px] text-ink-2 sm:h-11 sm:px-3 [&>div:first-child]:pl-0 max-xl:[mask-image:linear-gradient(to_right,#000_calc(100%-28px),transparent)]">
          {options}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
      <div className="relative min-w-0 flex-1 overflow-hidden" ref={wrapRef}>
        {selBarMounted && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 max-w-[calc(100%-16px)] -translate-x-1/2">
            <div
              className={`flex h-10 items-center rounded-full border border-line bg-surface px-1.5 text-[12.5px] text-ink-2 shadow-lift transition-[opacity,transform] duration-150 ease-out motion-reduce:translate-y-0 ${selBarVisible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'}`}
            >
              <div className="flex items-center overflow-x-auto [scrollbar-width:none] max-sm:[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]">
                {selActions ?? lastSelActionsRef.current}
              </div>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => { eraserAt.current = null; fillHover.current = null; redraw() }}
          onDoubleClick={onDoubleClick}
          onContextMenu={(e) => e.preventDefault()}
          onDragOver={(ev) => {
            if (!draggingFill) return
            ev.preventDefault()
            ev.dataTransfer.dropEffect = 'copy'
            bucketPreview(toScene(ev.clientX, ev.clientY), draggingFill.color)
          }}
          onDragLeave={() => { if (fillHover.current) { fillHover.current = null; redraw() } }}
          onDrop={(ev) => {
            const d = draggingFill
            if (!d) return
            ev.preventDefault()
            fillHover.current = null
            bucketFill(toScene(ev.clientX, ev.clientY), d.color, d.style)
            redraw()
          }}
        />
        <canvas ref={liveRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        <Instruments s={inst} set={setInst} gRef={instG} api={instApi} />
        {textarea}
      </div>
      {dialog?.t === 'formula' && (
        <FormulaDialog initial={dialog.el?.latex} color={dialog.el?.stroke ?? style.current.stroke} onClose={() => setDialog(null)} onDone={onFormula} />
      )}
      {dialog?.t === 'tool' && createPortal(
        <ToolModal
          kind={dialog.doc.kind}
          initial={dialog.doc.spec}
          submitLabel="Cập nhật"
          onClose={() => setDialog(null)}
          onInsert={(img) => { const { ids, doc } = dialog; setDialog(null); replaceTool(ids, doc, img) }}
        />,
        document.body,
      )}
      {dialog?.t === 'pdf' && (
        <PdfPagesDialog file={dialog.file} onClose={() => setDialog(null)} onDone={(pages) => { setDialog(null); placePictures(pages) }} />
      )}
      {dialog?.t === 'export' && (
        <ExportDialog hasSelection={selected.current.size > 0} hasPages={els.current.some(isPage)} onClose={() => setDialog(null)} onDone={onExport} />
      )}

      {side && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSide(null)}
          aria-hidden
        />
      )}

      {/* panel phải: điện thoại phủ toàn màn hình, máy tính bảng trượt đè lên canvas, desktop đẩy canvas */}
      <div
        className={`${side ? 'fixed inset-0 z-40 sm:inset-auto sm:absolute sm:inset-y-0 sm:right-0 sm:w-[min(360px,90vw)]' : 'hidden'} lg:static lg:inset-auto lg:z-auto lg:block lg:h-full lg:w-[var(--side-w)] lg:min-h-0 lg:shrink-0 lg:overflow-hidden lg:transition-[width] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none`}
        style={{ '--side-w': side ? `${SIDE_W}px` : '0px' } as React.CSSProperties}
        inert={!side}
      >
        <aside className="flex h-full min-h-0 w-full flex-col border-l border-line bg-surface lg:w-[360px]" aria-label={side === 'tools' ? 'Công cụ' : 'Trợ lý'}>
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3 text-[13.5px] font-medium text-ink sm:h-11">
            <span className="text-clay">{side === 'tools' ? <Ico d={WRENCH_D} size={17} /> : <AiIcon size={17} />}</span>
            {side === 'tools' ? 'Công cụ' : 'Trợ lý AI'}
            <button type="button" onClick={() => setSide(null)} data-tip="Đóng" aria-label="Đóng panel" className="ml-auto grid h-9 w-9 place-items-center rounded-[6px] text-ink-3 hover:bg-sunken hover:text-ink sm:h-7 sm:w-7">
              <Ico d="M6 6l12 12M18 6L6 18" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            {mounted.has('ai') && (
              <div className={`absolute inset-0 flex flex-col [&>.ai-panel]:min-h-0 [&>.ai-panel]:w-full [&>.ai-panel]:flex-1 [&>.ai-panel]:border-0 [&_.ai-panel-header]:hidden ${side === 'ai' ? '' : 'invisible'}`}>
                <AiPanel mode="board" attachKey={aiKey} onBoardOps={applyBoardOps} contextSummary={side === 'ai' ? boardSummary() : ''} />
              </div>
            )}
            {mounted.has('tools') && (
              <div className={`absolute inset-0 overflow-y-auto px-3 pb-3 ${side === 'tools' ? '' : 'invisible'}`}>
                <ToolsPanel onInsertPlot={insertImage} onFormula={() => setDialog({ t: 'formula' })} />
              </div>
            )}
          </div>
        </aside>
      </div>
      </div>
    </div>
  )
}

/* ---------- định nghĩa giao diện ---------- */

type Main = 'pen' | 'eraser' | 'laser' | 'select' | 'shape' | 'bucket' | 'text' | 'hand'

const ERASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><g transform="rotate(-40 13 13)"><rect x="5" y="8" width="17" height="10" rx="2.5" fill="#f4a3a8" stroke="#3f3f46" stroke-width="1.3"/><rect x="5" y="8" width="6" height="10" rx="2.5" fill="#e5e7eb" stroke="#3f3f46" stroke-width="1.3"/></g></svg>'
const LASER_COLORS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2']
const LASER_SIZES = [0.6, 1, 1.6, 2.4]
const LASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="7" fill="#ff3b30" fill-opacity="0.25"/><circle cx="9" cy="9" r="3.5" fill="#ff3b30" stroke="white" stroke-width="1.2"/></svg>'
const KIND_LABEL: Record<Kind, string> = {
  rectangle: 'Hình chữ nhật', ellipse: 'Hình elip', diamond: 'Hình thoi', line: 'Đường thẳng', arrow: 'Mũi tên',
  freedraw: 'Nét bút', text: 'Chữ', image: 'Hình vẽ công cụ',
}
const TOOL_LABEL: Record<string, string> = {
  graph: 'đồ thị', vartable: 'bảng biến thiên', signtable: 'bảng xét dấu', oxy: 'hệ trục Oxy', geo2d: 'hình phẳng', geo3d: 'hình không gian',
  stats: 'biểu đồ', circuit: 'mạch điện', motion: 'đồ thị chuyển động', incline: 'mặt phẳng nghiêng', gas: 'đồ thị trạng thái khí',
  scene: 'hình minh hoạ', electron: 'cấu hình electron', struct: 'công thức cấu tạo', chemgraph: 'đồ thị số mol', chemeq: 'phương trình hoá học', trig: 'đường tròn lượng giác',
  probtree: 'sơ đồ cây', numberline: 'trục số', venn: 'biểu đồ Ven', grouped: 'bảng ghép nhóm', table: 'bảng',
  phase: 'đồ thị chuyển thể', osc: 'đồ thị dao động', lens: 'thấu kính', foodweb: 'lưới thức ăn', pedigree: 'sơ đồ phả hệ', punnett: 'bảng lai',
}

/** nét bút AI vẽ theo dạng có sẵn (tròn, elip, sóng, sao, đa giác) */
function curvePoints(cv: Record<string, unknown>, dx: number, dy: number): Pt[] {
  const n = (k: string, d: number) => (typeof cv[k] === 'number' && Number.isFinite(cv[k]) ? (cv[k] as number) : d)
  const cx = n('cx', dx), cy = n('cy', dy)
  const out: Pt[] = []
  switch (cv.type) {
    case 'circle':
    case 'ellipse': {
      const rx = n('rx', n('r', 60)), ry = n('ry', n('r', 60))
      for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]) }
      break
    }
    case 'wave': {
      const len = n('len', 300), amp = n('amp', 20), waves = n('n', 3)
      for (let i = 0; i <= 120; i++) { const t = i / 120; out.push([cx - len / 2 + t * len, cy + amp * Math.sin(t * Math.PI * 2 * waves)]) }
      break
    }
    case 'star': {
      const r = n('r', 60), k = Math.max(3, Math.round(n('n', 5)))
      for (let i = 0; i <= k * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / k, rr = i % 2 ? r * 0.45 : r; out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]) }
      break
    }
    case 'polygon': {
      const P = Array.isArray(cv.points) ? (cv.points as unknown[]).filter((p): p is number[] => Array.isArray(p)).map((p) => [Number(p[0]), Number(p[1])] as Pt) : []
      if (P.length) out.push(...P, P[0])
      else {
        const r = n('r', 60), k = Math.max(3, Math.round(n('n', 6)))
        for (let i = 0; i <= k; i++) { const a = -Math.PI / 2 + (i / k) * Math.PI * 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]) }
      }
      break
    }
  }
  return out
}

/** chèn thêm điểm giữa các đỉnh xa nhau để nét bút (perfect-freehand) đều và trơn */
function densify(P: Pt[]): Pt[] {
  const out: Pt[] = [P[0]]
  for (let i = 1; i < P.length; i++) {
    const [ax, ay] = P[i - 1], [bx, by] = P[i]
    const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6))
    for (let j = 1; j <= k; j++) out.push([ax + ((bx - ax) * j) / k, ay + ((by - ay) * j) / k])
  }
  return out
}

type SideTab = 'ai' | 'tools'
const SIDE_W = 360
const WRENCH_D = 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3.6 17.4a1.4 1.4 0 0 0 2 2l5.7-5.7a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-.5-.5-2z'
const PEN_D = 'M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16zM14 7l3 3'
const ERASER_D = 'M8 20h12M5.5 14.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8l-2.5-2.5a1.5 1.5 0 0 1 0-2z'
const LASER_D = 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1'
const SELECT_D = 'M5 3l14 7-6 2-2 6z'
/** khoanh tự do: lucide lasso-select */
const LASSO_D = 'M7 22a5 5 0 0 1-2-4M7 16.93c.96.43 1.96.74 2.99.91M3.34 14A6.8 6.8 0 0 1 2 10c0-4.42 4.48-8 10-8s10 3.58 10 8a7.19 7.19 0 0 1-.33 2M5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14.33 22h-.09a.35.35 0 0 1-.24-.32v-10a.34.34 0 0 1 .33-.34c.08 0 .15.03.21.08l7.34 6a.33.33 0 0 1-.21.59h-4.49l-2.57 3.85a.35.35 0 0 1-.28.14z'
const SHAPE_D = 'M3 3h9v9H3zM16.5 12a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z'
const TEXT_D = 'M5 6V4h14v2M12 4v16m-3 0h6'
const DOT_SIZES = [4, 6, 8, 10, 12, 14]
/** thùng sơn: vẽ lại dạng nét viền theo icons/paint-bucket.svg */
const BUCKET_D = 'M10.6 4.6L19 13l-7.3 7.3a1.6 1.6 0 0 1-2.2 0l-6.2-6.2a1.6 1.6 0 0 1 0-2.2zM3 13h15.5M5.4 9.8a3.6 3.6 0 1 1 5.2-5.2M20.5 15.5s2 2.3 2 3.6a2 2 0 1 1-4 0c0-1.3 2-3.6 2-3.6z'
const HAND_D = 'M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.9-2.5L3.6 13a1.5 1.5 0 0 1 2.4-1.8L8 13'

const UNDO_D = 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3'
const REDO_D = 'M15 14l5-5-5-5m5 5H9a5 5 0 0 0 0 10h3'
const PLUS_D = 'M12 5v14M5 12h14'
const IMG_D = 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01'
const PDF_NOTE_D = 'M6 3h9l4 4v14H6zM14 3v5h5M9 17l5-5 2 2-5 5H9z'
const EXPORT_D = 'M12 4v11M7 10l5 5 5-5M5 20h14'
const PAPER_D = 'M6 3h9l4 4v14H6zM14 3v5h5'
const RULER_D = 'M3 15.5L15.5 3l5.5 5.5L8.5 21zM7 11.5l2 2M10 8.5l1.5 1.5M13 5.5l2 2M5.5 14l1 1M11.5 10l1 1'
/** bút máy: vẽ lại dạng nét viền theo icons/pen-nib.svg */
const FOUNTAIN_D = 'M13 6l-5.2 1.5a2.4 2.4 0 0 0-1.7 1.8L3 21l11.7-3.1a2.4 2.4 0 0 0 1.8-1.7L18 11M13 6l2.2-2.2a1.3 1.3 0 0 1 1.8 0l3.2 3.2a1.3 1.3 0 0 1 0 1.8L18 11M13 6l5 5M3 21l5.4-5.4M11 14.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0'
/** outside = hiện thẳng ở hàng 2; còn lại nằm trong bảng "Kiểu bút" */
const PENS: { id: PenKind; label: string; icon: string; outside?: boolean }[] = [
  { id: 'ball', label: 'Bút bi', icon: PEN_D, outside: true },
  { id: 'highlight', label: 'Dạ quang', icon: 'M9 11l-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4', outside: true },
  { id: 'fountain', label: 'Bút máy', icon: FOUNTAIN_D },
  { id: 'brush', label: 'Bút lông', icon: 'm9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z' },
  { id: 'pencil', label: 'Bút chì', icon: 'M4 20l1.5-4.5L16 5l3 3L8.5 18.5zM14 7l3 3M4 20l3-1' },
  { id: 'marker', label: 'Bút dạ', icon: 'M10 13l6.5-6.5 3.5 3.5-6.5 6.5zM16.5 6.5l1.4-1.4a1.6 1.6 0 0 1 2.2 0l1.3 1.3a1.6 1.6 0 0 1 0 2.2L20 10M10 13l-2.3 2.3 3.5 3.5 2.3-2.3M7.7 15.3L4 20.5l.5.5 5.2-3.7' },
]

/** bảng Kiểu bút: nét mẫu xem trước + các loại ngòi + độ nhọn / độ nhạy lực nhấn */
function PenPanel({ pen, color, width, tip, onPen, onTip }: {
  pen: PenKind; color: string; width: number; tip: Tip; onPen: (p: PenKind) => void; onTip: (t: Tip) => void
}) {
  const label = PENS.find((p) => p.id === pen)?.label ?? ''
  // đường cong chữ S, lực nhấn tăng rồi giảm như khi viết thật
  const pts: number[][] = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    pts.push([24 + t * 232, 52 - Math.sin(t * Math.PI * 2 - 0.4) * 26, 0.25 + 0.7 * Math.sin(t * Math.PI)])
  }
  const d = svgPathFromStroke(penOutline(pts, { pen, width: Math.max(width, 1.5), sharp: tip.sharp, sens: tip.sens, real: true }))
  const tunable = pen !== 'highlight' && pen !== 'marker'
  return (
    <div className="w-[min(300px,calc(100vw-40px))] space-y-3">
      <div className="text-[12px] font-medium text-ink-2">{label}</div>
      <div className="grid h-[104px] place-items-center rounded-[8px] border border-line bg-white">
        <svg className="w-full" height="104" viewBox="0 0 280 104">
          <path d={d} fill={color} fillOpacity={pen === 'highlight' ? 0.45 : pen === 'pencil' ? 0.8 : 1} />
        </svg>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {PENS.filter((p) => !p.outside).map((p) => (
          <button key={p.id} type="button" onClick={() => onPen(p.id)} aria-pressed={pen === p.id}
            className={`flex flex-col items-center gap-1 rounded-[8px] py-2 text-[11.5px] ${pen === p.id ? 'bg-clay/15 font-medium text-clay' : 'text-ink hover:bg-sunken'}`}>
            <Ico d={p.icon} size={20} />
            {p.label}
          </button>
        ))}
      </div>
      {tunable && (
        <div className="space-y-2.5 border-t border-line pt-3">
          <Slider label="Độ nhọn ngòi" value={tip.sharp} onChange={(v) => onTip({ ...tip, sharp: v })} />
          <Slider label="Độ nhạy lực nhấn" value={tip.sens} onChange={(v) => onTip({ ...tip, sens: v })} />
        </div>
      )}
    </div>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <div className="mb-1 flex justify-between text-[11.5px] text-ink-3">
        <span>{label}</span>
        <span className="tnum">{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#b4532a]" />
    </label>
  )
}

/** thêm hình mới: khai báo ở đây và đưa vào một mục của SHAPE_SECTIONS */
const SHAPE_DEFS: { id: Kind; label: string; short: string; kbd: string; icon: string }[] = [
  { id: 'rectangle', label: 'Hình chữ nhật', short: 'Chữ nhật', kbd: 'R', icon: 'M4 5h16v14H4z' },
  { id: 'ellipse', label: 'Hình tròn / elip', short: 'Tròn', kbd: 'O', icon: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z' },
  { id: 'diamond', label: 'Hình thoi', short: 'Thoi', kbd: 'D', icon: 'M12 3l9 9-9 9-9-9z' },
  { id: 'arrow', label: 'Mũi tên', short: 'Mũi tên', kbd: 'A', icon: 'M4 20L20 4m0 0h-8m8 0v8' },
  { id: 'line', label: 'Đường thẳng', short: 'Đường', kbd: 'L', icon: 'M4 20L20 4' },
]
const SHAPE_BY_ID = Object.fromEntries(SHAPE_DEFS.map((d) => [d.id, d])) as Record<Kind, (typeof SHAPE_DEFS)[number]>
const SHAPE_SECTIONS: { label: string; ids: Kind[] }[] = [
  { label: 'Khối cơ bản', ids: ['rectangle', 'ellipse', 'diamond'] },
  { label: 'Đường nối', ids: ['arrow', 'line'] },
]

/** cùng bảng màu với trình soạn thảo */
const THEME_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

const PAPERS: { id: Paper; label: string; bg?: string }[] = [
  { id: 'plain', label: 'Trắng' },
  { id: 'grid', label: 'Kẻ ô', bg: 'linear-gradient(#e2ddd7 1px, transparent 1px), linear-gradient(90deg, #e2ddd7 1px, transparent 1px)' },
  { id: 'lines', label: 'Kẻ dòng', bg: 'linear-gradient(#cfe0ee 1px, transparent 1px)' },
  { id: 'dots', label: 'Chấm', bg: 'radial-gradient(#bdb6ae 1px, transparent 1.2px)' },
]

/** một nhóm tuỳ chọn ở tầng 2: nhãn nhỏ + các nút; vạch ngăn giữa các nhóm cao đều nhau */
/** "Trợ lý giấy" của app, bản nét rỗng (theo /brand/ai-static.svg) */
function AiIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={size > 24 ? 2.6 : 4.4} strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M17 22.6l-6.1 2.9a6.4 6.4 0 0 0-3.1 8.5l7.4 15.9" />
      <path d="M49.7 22.6l5.6 2.6a6.4 6.4 0 0 1 3.1 8.5l-7.6 16.3" />
      <path d="M24.1 7.6h14.1l11.5 11.5v26.9a7.7 7.7 0 0 1-7.7 7.7H24.1a7.7 7.7 0 0 1-7.7-7.7V15.3a7.7 7.7 0 0 1 7.7-7.7z" />
      <path d="M38.2 7.6v6.4a5.1 5.1 0 0 0 5.1 5.1h6.4" />
      <path d="M26.3 27.8v3.2M39.8 27.8v3.2" strokeWidth={size > 24 ? 4 : 6} />
      <path d="M26.7 39.7c3.6 3.8 9.2 3.8 12.8 0" />
    </svg>
  )
}

function SideBtn({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" data-tip={label} aria-label={label} aria-pressed={on} onClick={onClick}
      className={`flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] transition-colors ${on ? 'bg-clay/10 text-clay' : 'text-ink hover:bg-sunken'}`}>
      {children}
      <span className="hidden whitespace-nowrap @[980px]:inline">{label}</span>
    </button>
  )
}

function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="relative flex shrink-0 items-center gap-1 px-3 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-px before:-translate-y-1/2 before:bg-line first:before:hidden">
      {label && <span className="mr-1 whitespace-nowrap text-[11.5px] text-ink-3">{label}</span>}
      {children}
    </div>
  )
}

function Chip({ active, disabled, onClick, onMouseDown, children, title, kbd: kbdProp }: { kbd?: string; active?: boolean; disabled?: boolean; onClick: () => void; onMouseDown?: (ev: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode; title?: string }) {
  const split = splitTipKbd(title ?? '')
  const tip = split.tip, kbd = kbdProp ?? split.kbd
  return (
    <button
      type="button" data-tip={tip || undefined} data-tip-kbd={kbd} aria-label={tip || undefined} disabled={disabled}
      onClick={onClick} onMouseDown={onMouseDown} aria-pressed={active}
      className={`flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 text-[12.5px] transition-colors disabled:pointer-events-none disabled:opacity-35 sm:h-8 sm:min-w-8 sm:px-2 ${active ? 'bg-clay/10 text-clay' : 'text-ink hover:bg-sunken'}`}
    >
      {children}
    </button>
  )
}

function Toggle({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  const { tip, kbd } = splitTipKbd(title ?? '')
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} data-tip={tip || undefined} data-tip-kbd={kbd} className="flex h-9 items-center gap-2 whitespace-nowrap rounded-[6px] px-2 text-[12.5px] text-ink hover:bg-sunken sm:h-8">
      <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? 'bg-clay' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      {children}
    </button>
  )
}

function Pop({ id, pop, setPop, title, face, children, align, className, btnClassName }: {
  id: string; pop: string | null; setPop: (p: string | null) => void; title: string; face: ReactNode; children: ReactNode; align?: 'right'; className?: string; btnClassName?: string
}) {
  const open = pop === id
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const btn = btnRef.current
      const panel = panelRef.current
      if (!btn || !panel) return
      const br = btn.getBoundingClientRect()
      const pr = panel.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      const vh = document.documentElement.clientHeight
      const rawLeft = align === 'right' ? br.right - pr.width : br.left
      const left = Math.max(8, Math.min(rawLeft, vw - pr.width - 8))
      const top = Math.max(8, Math.min(br.bottom + 6, vh - pr.height - 8))
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
    }
    place()
    const ro = new ResizeObserver(place)
    if (panelRef.current) ro.observe(panelRef.current)
    window.addEventListener('resize', place)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [open, align])

  return (
    <div className={`relative ${className ?? ''}`} data-pop={id}>
      <button
        ref={btnRef}
        type="button" data-tip={title} aria-label={title} aria-expanded={open} onClick={() => setPop(open ? null : id)}
        className={`${btnClassName ?? 'flex h-9 min-w-9 items-center justify-center rounded-[7px] px-1.5 sm:h-8 sm:min-w-0 sm:px-1'} ${open ? 'bg-sunken' : 'hover:bg-sunken'}`}
      >
        {face}
      </button>
      {/* gắn vào body: thanh công cụ cuộn ngang (overflow) sẽ cắt mất bảng nếu để bên trong */}
      {open && createPortal(
        <div
          ref={panelRef}
          data-pop={id}
          className="fixed z-50 max-h-[calc(100dvh-120px)] max-w-[calc(100vw-16px)] space-y-2.5 overflow-auto rounded-[10px] border border-line bg-surface p-3 shadow-lift"
        >
          {children}
        </div>,
        document.body,
      )}
    </div>
  )
}

/** ô nhập mã màu (#rrggbb) + nút mở bảng màu của máy */
/** bảng màu đầy đủ + ô nhập mã màu; dùng cho màu nền (kéo thả được như ô màu thường) */
function MoreColors({ value, onPick, onPreview, drag }: { value: string; onPick: (c: string) => void; onPreview: (c: string) => void; drag?: FillStyle }) {
  return (
    <>
      <div className="grid grid-cols-10 gap-1">
        {THEME_COLORS.map((c) => (
          <button key={c} type="button" data-tip={c} aria-label={c} onClick={() => onPick(c)}
            draggable={!!drag}
            onDragStart={drag ? (ev) => startFillDrag(ev, c, drag) : undefined}
            onDragEnd={drag ? () => { draggingFill = null } : undefined}
            className={`h-[18px] w-[18px] rounded-[3px] border border-black/10 hover:scale-110 ${value === c ? 'ring-2 ring-clay ring-offset-1' : ''}`} style={{ background: c }} />
        ))}
      </div>
      <HexInput value={value === 'transparent' ? '#ffffff' : value} onPreview={onPreview} onCommit={onPick} />
    </>
  )
}

function HexInput({ value, onPreview, onCommit }: { value: string; onPreview: (c: string) => void; onCommit: (c: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const valid = (t: string) => /^#?[0-9a-f]{6}$/i.test(t.trim())
  const norm = (t: string) => `#${t.trim().replace('#', '').toLowerCase()}`
  const commit = () => { if (valid(text) && norm(text) !== value.toLowerCase()) onCommit(norm(text)) }
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-[6px] border border-black/10" style={{ background: valid(text) ? norm(text) : value }} data-tip="Mở bảng màu">
        <input type="color" value={valid(text) ? norm(text) : '#000000'} className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => { setText(e.target.value); onPreview(e.target.value) }} onBlur={(e) => onCommit(e.target.value)} />
      </label>
      <div className={`flex h-7 flex-1 items-center rounded-[6px] border bg-surface px-2 ${valid(text) ? 'border-line focus-within:border-clay' : 'border-red-400'}`}>
        <span className="whitespace-nowrap text-[12px] text-ink-3">Mã màu</span>
        <input
          value={text} spellCheck={false} maxLength={7} aria-label="Mã màu"
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } e.stopPropagation() }}
          className="ml-2 w-full min-w-0 bg-transparent font-mono text-[12.5px] uppercase text-ink outline-none"
        />
      </div>
    </div>
  )
}

function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 whitespace-nowrap text-[11.5px] text-ink-3">{label}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

const NONE_BG = 'linear-gradient(135deg, #fff 45%, #e03131 45%, #e03131 55%, #fff 55%)'

/** kéo ô màu nền thả vào hình để tô. Lúc kéo (dragover) trình duyệt không cho đọc dữ liệu nên giữ màu ở đây */
const FILL_MIME = 'application/x-board-fill'
let draggingFill: { color: string; style: FillStyle } | null = null
const SPREAD_MS = 380
const BUCKET_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11 3l8 8-7 7-8-8z" fill="#fff" stroke="#27272a" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 10l8 8 3-3H4z" fill="#4dabf7"/><path d="M20 14s2 2.6 2 4a2 2 0 0 1-4 0c0-1.4 2-4 2-4z" fill="#4dabf7" stroke="#27272a" stroke-width="1.2"/></svg>'

/** ảnh đi theo con trỏ khi kéo: giọt màu tròn có bóng */
function startFillDrag(ev: React.DragEvent, color: string, style: FillStyle) {
  draggingFill = { color, style }
  ev.dataTransfer.setData(FILL_MIME, color)
  ev.dataTransfer.effectAllowed = 'copy'
  const g = document.createElement('div')
  const none = color === 'transparent'
  g.style.cssText = `position:fixed;top:-100px;left:-100px;width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${none ? '#fff' : color};border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25),inset -4px -4px 0 rgba(0,0,0,.08)`
  document.body.appendChild(g)
  ev.dataTransfer.setDragImage(g, 6, 28)
  setTimeout(() => g.remove(), 0)
}

function Swatch({ color, active, onClick, round, title, drag }: { color: string; active: boolean; onClick: () => void; round?: boolean; title?: string; drag?: FillStyle }) {
  const none = color === 'transparent'
  return (
    <button
      type="button" onClick={onClick}
      draggable={!!drag}
      onDragStart={drag ? (ev) => startFillDrag(ev, color, drag) : undefined}
      onDragEnd={drag ? () => { draggingFill = null } : undefined} data-tip={none ? 'Không màu' : title ?? color} aria-label={none ? 'Không màu' : `${title ?? 'Màu'} ${color}`} aria-pressed={active}
      className={`mx-[3px] h-5 w-5 shrink-0 ${round ? 'rounded-full' : 'rounded-[5px]'} border border-black/10 transition-transform hover:scale-110 ${active ? 'ring-2 ring-clay ring-offset-2 ring-offset-surface' : ''}`}
      style={{ background: none ? NONE_BG : color }}
    />
  )
}

function Ico({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
  )
}

function IconBtn({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  const { tip, kbd } = splitTipKbd(label)
  return (
    <button
      type="button" data-tip={tip} data-tip-kbd={kbd} aria-label={tip} onClick={onClick} disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-[6px] text-ink hover:bg-sunken disabled:opacity-35 disabled:hover:bg-transparent sm:h-8 sm:w-8"
    >
      {children}
    </button>
  )
}

/** nút icon trong thanh nổi hàng 3 */
function SelBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  const { tip, kbd } = splitTipKbd(label)
  return (
    <button
      type="button" data-tip={tip} data-tip-kbd={kbd} aria-label={tip} onClick={onClick}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 sm:h-8 sm:w-8 ${danger ? 'hover:bg-red-500/10 hover:text-red-600' : 'hover:bg-sunken'}`}
    >
      {children}
    </button>
  )
}
