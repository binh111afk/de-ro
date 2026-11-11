/**
 * Bảng vẽ — trình soạn (một tab trong ComposeDoc).
 * Cách tương tác học theo Excalidraw (https://github.com/excalidraw/excalidraw, MIT):
 * công cụ + phím tắt số, kéo để tạo, tay nắm đổi cỡ/xoay, kéo khung chọn, Space/chuột giữa để cuộn,
 * Ctrl + lăn chuột để phóng to. Giao diện viết lại bằng tiếng Việt theo token của app.
 * Nội dung tự lưu trong localStorage theo id tab.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  centerOf, clone, DEFAULT_STYLE, handlePositions, hasPoints, hitTest, isLinear, localBounds, measureText,
  mutate, newId, newSeed, rotate, unionBounds, worldBounds, fontOf, LINE_HEIGHT, inPolygon,
  type Bounds, type El, type Handle, type Kind, type Paper, type PenKind, type Pt, type Style,
} from './scene'
import { dropFromCache, LASER_LIFE, penOutline, render, svgPathFromStroke, type LaserTrail, type View } from './render'
import { recognize } from './recognize'

type Tool = 'select' | 'hand' | Kind | 'eraser' | 'laser'
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
  recentColors: string[]
  recentHighlights: string[]
  /** ngòi riêng của từng loại bút */
  penTips: Partial<Record<PenKind, Tip>>
}
interface Tip { sharp: number; sens: number }
const DEFAULT_TIP: Tip = { sharp: 0.5, sens: 0.5 }
const DEFAULT_OPTS: Opts = { pen: 'ball', lastShape: 'rectangle', paper: 'plain', snap: true, eraseMode: 'stroke', eraseSize: 1, selectMode: 'box', recentShapes: ['rectangle', 'ellipse', 'arrow', 'line'], recentColors: ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#7048e8'], recentHighlights: ['#fab005', '#82c91e', '#f783ac', '#4dabf7', '#ff922b'], penTips: {} }

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
const SHAPES: Kind[] = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line']

const keyOf = (id: string) => `derou.board.${id}`

interface Saved {
  v: 2
  elements: El[]
  view: View
  styles?: Partial<Record<Slot, Style>>
  opts?: Partial<Opts>
}

function load(id: string): Saved | null {
  try {
    const d = JSON.parse(localStorage.getItem(keyOf(id)) ?? 'null')
    return d && d.v === 2 ? d : null
  } catch {
    return null
  }
}

type Drag =
  | { t: 'pan'; sx: number; sy: number; scrollX: number; scrollY: number }
  | { t: 'create'; el: El; start: Pt }
  | { t: 'move'; start: Pt; orig: Map<string, Pt>; moved: boolean }
  | { t: 'marquee'; start: Pt; cur: Pt; base: Set<string> }
  | { t: 'resize'; handle: Handle; orig: El[]; ob: Bounds; single: boolean }
  | { t: 'endpoint'; index: number; el: El }
  | { t: 'rotate'; el: El; center: Pt }
  | { t: 'erase'; hit: boolean; last: Pt }
  | { t: 'snapped' }
  | { t: 'laser'; trail: LaserTrail }
  | { t: 'lasso'; pts: Pt[]; base: Set<string> }

const TOOL_KEYS: Record<string, Tool> = {
  '1': 'select', v: 'select', h: 'hand', '2': 'rectangle', r: 'rectangle', '3': 'diamond', d: 'diamond',
  '4': 'ellipse', o: 'ellipse', '5': 'arrow', a: 'arrow', '6': 'line', l: 'line', '7': 'freedraw', p: 'freedraw',
  '8': 'text', t: 'text', '0': 'eraser', e: 'eraser', k: 'laser',
}

const FILLS = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99']

const CURSOR: Partial<Record<Handle, string>> = {
  nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize',
  n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', rot: 'grab', p0: 'move', p1: 'move',
}

export default function BoardEditor({ id }: { id: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const saved = useRef(load(id))
  const els = useRef<El[]>(saved.current?.elements ?? [])
  const view = useRef<View>(saved.current?.view ?? { scrollX: 0, scrollY: 0, zoom: 1 })
  const styles = useRef<Record<Slot, Style>>({ ...DEFAULT_STYLES, ...saved.current?.styles })
  const opts = useRef<Opts>({ ...DEFAULT_OPTS, ...saved.current?.opts })
  const selected = useRef<Set<string>>(new Set())
  const drag = useRef<Drag | null>(null)
  const penSeen = useRef(false)
  const hold = useRef<{ timer: number; x: number; y: number }>({ timer: 0, x: 0, y: 0 })
  const space = useRef(false)
  const clipboard = useRef<El[]>([])
  const undoStack = useRef<string[]>([JSON.stringify(els.current)])
  const redoStack = useRef<string[]>([])

  const [tool, setTool] = useState<Tool>('select')
  const toolRef = useRef<Tool>('select')
  const [editing, setEditing] = useState<{ el: El; isNew: boolean } | null>(null)
  const editingRef = useRef<typeof editing>(null)
  editingRef.current = editing
  const [, setTick] = useState(0)
  const [pop, setPop] = useState<string | null>(null)
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
    if (t === 'laser') return `url("data:image/svg+xml,${encodeURIComponent(LASER_SVG)}") 9 9, crosshair`
    if (t === 'text') return 'text'
    if (t === 'hand') return 'grab'
    if (t === 'select') return 'default'
    return 'crosshair'
  }
  const laser = useRef<LaserTrail[]>([])
  const lasso = useRef<Pt[] | null>(null)
  const eraserAt = useRef<Pt | null>(null)

  /* ---------- vẽ + lưu ---------- */

  const raf = useRef(0)
  const marquee = useRef<Bounds | null>(null)
  const redraw = useCallback(() => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
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
      render(c, els.current, view.current, {
        selected: els.current.filter((e) => selected.current.has(e.id)),
        marquee: marquee.current,
        hiddenId: editingRef.current?.el.id ?? null,
        paper: opts.current.paper,
        lasso: lasso.current,
        laser: laser.current,
        eraser: eraserAt.current && (t === 'eraser' || drag.current?.t === 'erase')
          ? { p: eraserAt.current, r: ERASE_R[opts.current.eraseSize] / z } : null,
      })
      // laser còn vệt thì vẽ tiếp khung sau để mờ dần
      if (laser.current.some((tr) => tr.pts.length)) redrawRef.current()
    })
  }, [])
  const redrawRef = useRef(redraw)

  const saveTimer = useRef(0)
  const persist = useCallback(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        const data: Saved = { v: 2, elements: els.current, view: view.current, styles: styles.current, opts: opts.current }
        localStorage.setItem(keyOf(id), JSON.stringify(data))
      } catch {
        /* đầy bộ nhớ: bỏ qua */
      }
    }, 400)
  }, [id])

  const changed = useCallback(() => {
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
    for (const e of els.current) dropFromCache(e.id)
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
      redraw()
    })
    ro.observe(wrap)
    // phông chữ tải xong thì đo / vẽ lại chữ
    document.fonts?.ready.then(() => {
      for (const e of els.current) if (e.kind === 'text') mutate(e, measureText(e.text ?? '', e.fontSize))
      redraw()
    })
    return () => ro.disconnect()
  }, [redraw])

  /* ---------- tiện ích toạ độ ---------- */

  const toScene = (cx: number, cy: number): Pt => {
    const r = canvasRef.current!.getBoundingClientRect()
    const v = view.current
    return [(cx - r.left) / v.zoom - v.scrollX, (cy - r.top) / v.zoom - v.scrollY]
  }
  const sel = () => els.current.filter((e) => selected.current.has(e.id))
  const topHit = (p: Pt) => {
    const tol = 6 / view.current.zoom
    for (let i = els.current.length - 1; i >= 0; i--) if (hitTest(els.current[i], p, tol)) return els.current[i]
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
    } else mutate(ed.el, { text, ...measureText(text, ed.el.fontSize) })
    editingRef.current = null
    setEditing(null)
    commit()
    redraw()
  }, [commit, redraw])

  /* ---------- chuột / bút ---------- */

  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    setPop(null)
    if (editingRef.current) {
      const ta = document.getElementById(`board-text-${id}`) as HTMLTextAreaElement | null
      finishText(ta?.value ?? '')
      return
    }
    ev.currentTarget.setPointerCapture(ev.pointerId)
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

    if (t === 'laser') {
      const trail: LaserTrail = { pts: [p], ts: [performance.now()] }
      laser.current.push(trail)
      drag.current = { t: 'laser', trail }
      redraw()
      return
    }

    if (t === 'select') {
      const h = handleAt(p)
      const s = sel()
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
        if (ev.shiftKey) {
          if (selected.current.has(hit.id)) selected.current.delete(hit.id)
          else selected.current.add(hit.id)
        } else if (!selected.current.has(hit.id)) selected.current = new Set([hit.id])
        drag.current = { t: 'move', start: p, orig: new Map(sel().map((e) => [e.id, [e.x, e.y]])), moved: false }
        // Alt + kéo: nhân đôi rồi kéo bản sao
        if (ev.altKey) {
          const copies = sel().map((e) => ({ ...clone(e), id: newId(), seed: newSeed() }))
          els.current.push(...copies)
          selected.current = new Set(copies.map((c) => c.id))
          drag.current.orig = new Map(copies.map((e) => [e.id, [e.x, e.y]]))
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

    const el = newElement(t as Kind, p)
    if (el.kind === 'freedraw') {
      if (ev.pointerType === 'pen') el.pressures = [ev.pressure || 0.5]
      if (opts.current.snap) armHold(ev.clientX, ev.clientY)
    }
    els.current.push(el)
    drag.current = { t: 'create', el, start: p }
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
    dropFromCache(e.id)
    drag.current = { t: 'snapped' }
    redraw()
  }

  /** gôm tại p: cả nét, hoặc chỉ phần nét bút nằm trong vòng gôm (cắt nét làm nhiều đoạn) */
  const eraseAt = (p: Pt) => {
    const r = ERASE_R[opts.current.eraseSize] / view.current.zoom
    let hit = false
    const out: El[] = []
    for (const e of els.current) {
      if (opts.current.eraseMode === 'stroke' || e.kind !== 'freedraw') {
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
    const d = drag.current
    const p = toScene(ev.clientX, ev.clientY)
    const c = canvasRef.current!

    if (!d) {
      const t = toolRef.current
      if (t === 'eraser') { eraserAt.current = p; c.style.cursor = toolCursor(); redraw(); return }
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
          for (const ce of coalesced()) {
            const q = toScene(ce.clientX, ce.clientY)
            const last = pts[pts.length - 1]
            if (Math.hypot(q[0] - e.x - last[0], q[1] - e.y - last[1]) * view.current.zoom < 0.75) continue
            pts.push([q[0] - e.x, q[1] - e.y])
            e.pressures?.push(ce.pressure || 0.5)
          }
          e.ver++
          if (opts.current.snap && Math.hypot(ev.clientX - hold.current.x, ev.clientY - hold.current.y) > 4) armHold(ev.clientX, ev.clientY)
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
        if (ev.shiftKey) Math.abs(dx) > Math.abs(dy) ? (dy = 0) : (dx = 0)
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
          const w = worldBounds(e)
          if (w[0] >= b[0] && w[1] >= b[1] && w[2] <= b[2] && w[3] <= b[3]) next.add(e.id)
        }
        selected.current = next
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
          const pts = hasPoints(e) ? e.points!.map(([px, py]) => [e.x + px, e.y + py] as Pt) : [centerOf(e)]
          const inside = pts.filter((q) => inPolygon(q, d.pts)).length
          if (inside / pts.length >= 0.6) next.add(e.id)
        }
        selected.current = next
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
        const m = measureText(o0.text ?? '', fontSize)
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
        mutate(e, { x: nx, y: ny, fontSize, ...measureText(o.text ?? '', fontSize) })
      } else if (hasPoints(o)) mutate(e, { x: nx, y: ny, points: o.points!.map(([px, py]) => [px * sx, py * sy] as Pt) })
      else mutate(e, { x: nx, y: ny, w: o.w * sx, h: o.h * sy })
    }
  }

  const onPointerUp = () => {
    clearTimeout(hold.current.timer)
    const d = drag.current
    drag.current = null
    marquee.current = null
    lasso.current = null
    if (!d) return
    if (d.t === 'laser') return redraw()
    if (d.t === 'create') {
      const e = d.el
      const [x1, y1, x2, y2] = localBounds(e)
      const tiny = e.kind !== 'freedraw' && x2 - x1 < 3 && y2 - y1 < 3
      if (tiny) els.current = els.current.filter((x) => x !== e)
      else if (e.kind !== 'freedraw') {
        selected.current = new Set([e.id])
        pickTool('select')
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
    if (hit?.kind === 'text') return startText(hit, false)
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
    if (!selected.current.size) return
    els.current = els.current.filter((e) => !selected.current.has(e.id))
    selected.current.clear()
    commit()
  }
  const duplicate = () => {
    const copies = sel().map((e) => ({ ...clone(e), id: newId(), seed: newSeed(), x: e.x + 16, y: e.y + 16 }))
    if (!copies.length) return
    els.current.push(...copies)
    selected.current = new Set(copies.map((c) => c.id))
    commit()
  }
  const reorder = (dir: 'front' | 'back') => {
    const s = sel()
    if (!s.length) return
    const rest = els.current.filter((e) => !selected.current.has(e.id))
    els.current = dir === 'front' ? [...rest, ...s] : [...s, ...rest]
    commit()
  }

  const keyHandler = useRef<(ev: KeyboardEvent) => void>(() => {})
  keyHandler.current = (ev: KeyboardEvent) => {
    const target = ev.target as HTMLElement | null
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
    if (editingRef.current) return
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
    if (mod && k === 'a') { ev.preventDefault(); selected.current = new Set(els.current.map((e) => e.id)); pickTool('select'); toolRef.current = 'select'; return changed() }
    if (mod && k === 'd') { ev.preventDefault(); return duplicate() }
    if (mod && k === 'c') { clipboard.current = sel().map(clone); return }
    if (mod && k === 'x') { clipboard.current = sel().map(clone); return deleteSelected() }
    if (mod && k === 'v') {
      if (!clipboard.current.length) return
      ev.preventDefault()
      const copies = clipboard.current.map((e) => ({ ...clone(e), id: newId(), seed: newSeed(), x: e.x + 24, y: e.y + 24 }))
      clipboard.current = copies.map(clone)
      els.current.push(...copies)
      selected.current = new Set(copies.map((c) => c.id))
      return commit()
    }
    if (mod && (k === '=' || k === '+')) { ev.preventDefault(); return zoomAt(view.current.zoom * 1.1) }
    if (mod && k === '-') { ev.preventDefault(); return zoomAt(view.current.zoom / 1.1) }
    if (mod && k === '0') { ev.preventDefault(); return zoomAt(1) }
    if (mod) return
    if (k === 'delete' || k === 'backspace') { ev.preventDefault(); return deleteSelected() }
    if (k === 'escape') { selected.current.clear(); pickTool('select'); return changed() }
    if (k.startsWith('arrow') && selected.current.size) {
      ev.preventDefault()
      const step = ev.shiftKey ? 10 : 1
      const dx = k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0
      const dy = k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0
      for (const e of sel()) mutate(e, { x: e.x + dx, y: e.y + dy })
      return commit()
    }
    if (k === 'enter' && selected.current.size === 1) {
      const e = sel()[0]
      if (e.kind === 'text') { ev.preventDefault(); return startText(e, false) }
    }
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
  const canFill = [...kinds].some((k) => k === 'rectangle' || k === 'ellipse' || k === 'diamond')
  const hasText = kinds.has('text')
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
    if (!selection.length) style.current = { ...style.current, [k]: value }
    for (const e of selection) {
      if (k === 'fontSize' && e.kind === 'text') {
        const c = centerOf(e)
        const m = measureText(e.text ?? '', value as number)
        mutate(e, { fontSize: value as number, ...m, x: c[0] - m.w / 2, y: c[1] - m.h / 2 })
      } else mutate(e, { [k]: value } as Partial<El>)
    }
    if (selection.length) commit()
    else changed()
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
          if (ev.key === 'Escape' || (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey))) {
            ev.preventDefault()
            ev.currentTarget.blur()
          }
        }}
        onInput={(ev) => {
          const ta = ev.currentTarget
          const m = measureText(ta.value || ' ', e.fontSize)
          ta.style.width = `${(m.w + e.fontSize) * v.zoom}px`
          ta.style.height = `${m.h * v.zoom}px`
        }}
        className="absolute z-10 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none"
        style={{
          left: (e.x + v.scrollX) * v.zoom,
          top: (e.y + v.scrollY) * v.zoom,
          width: (Math.max(e.w, 1) + e.fontSize) * v.zoom,
          height: Math.max(e.h, e.fontSize * LINE_HEIGHT) * v.zoom,
          font: fontOf(fs),
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
  const recentKey = isHighlight ? 'recentHighlights' : 'recentColors'
  const colors = o[recentKey]
  /** dùng một màu: tô cho nét/hình, rồi đưa màu đó lên đầu hàng */
  const useColor = (c: string) => {
    const list = opts.current[recentKey]
    opts.current = { ...opts.current, [recentKey]: [c, ...list.filter((x) => x.toLowerCase() !== c.toLowerCase())].slice(0, list.length || 6) }
    setProp('stroke', c)
  }
  const widths = isHighlight ? [6, 8, 14] : [1, 2, 4]

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
            <button key={c} type="button" title={c} aria-label={c} onClick={() => { useColor(c); setPop(null) }}
              className={`h-[18px] w-[18px] rounded-[3px] border border-black/10 hover:scale-110 ${cur.stroke === c ? 'ring-2 ring-clay ring-offset-1' : ''}`} style={{ background: c }} />
          ))}
        </div>
        <HexInput value={cur.stroke} onPreview={(c) => setProp('stroke', c)} onCommit={useColor} />
      </Pop>
    </Group>
  )
  const widthRow = (
    <Group label="Độ dày">
      {widths.map((w, i) => (
        <Chip key={w} active={cur.strokeWidth === w} onClick={() => setProp('strokeWidth', w)} title={`Nét ${['mảnh', 'vừa', 'đậm'][i]}`}>
          <span className="w-5 rounded-full bg-current" style={{ height: Math.min(10, w * (isHighlight ? 0.7 : 1) + 0.5) }} />
        </Chip>
      ))}
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
  const strokeStyleRow = (
    <Group label="Kiểu nét">
      {(['solid', 'dashed', 'dotted'] as const).map((st, i) => (
        <Chip key={st} active={cur.strokeStyle === st} onClick={() => setProp('strokeStyle', st)} title={`Nét ${['liền', 'đứt', 'chấm'][i]}`}>
          <svg width="22" height="10" viewBox="0 0 22 10"><path d="M1 5h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={st === 'dashed' ? '5 4' : st === 'dotted' ? '0.5 4' : undefined} /></svg>
        </Chip>
      ))}
    </Group>
  )
  const roughRow = (
    <Group label="Nét vẽ">
      <Chip active={cur.roughness === 0} onClick={() => setProp('roughness', 0)} title="Nét thẳng, gọn">Thẳng</Chip>
      <Chip active={cur.roughness >= 1} onClick={() => setProp('roughness', 1)} title="Nét như vẽ tay">Vẽ tay</Chip>
    </Group>
  )
  const fillPop = (
    <Pop id="fill" pop={pop} setPop={setPop} title="Tô nền"
      face={<span className="flex items-center gap-1.5 px-1 text-[12.5px] text-ink"><span className="h-4 w-4 rounded-[4px] border border-line" style={{ background: cur.fill === 'transparent' ? NONE_BG : cur.fill }} />Tô nền</span>}>
      <PanelRow label="Màu nền">
        {FILLS.map((c) => <Swatch key={c} color={c} active={cur.fill === c} onClick={() => setProp('fill', c)} />)}
      </PanelRow>
      {cur.fill !== 'transparent' && (
        <PanelRow label="Kiểu tô">
          <Chip active={cur.fillStyle === 'hachure'} onClick={() => setProp('fillStyle', 'hachure')}>Gạch chéo</Chip>
          <Chip active={cur.fillStyle === 'solid'} onClick={() => setProp('fillStyle', 'solid')}>Đặc</Chip>
        </PanelRow>
      )}
    </Pop>
  )
  const opacityPop = (
    <Pop id="opacity" pop={pop} setPop={setPop} title="Độ trong" face={<span className="px-1 text-[12.5px] text-ink">Độ trong {cur.opacity}%</span>}>
      <div className="w-[180px]">
        <input type="range" min={10} max={100} step={10} value={cur.opacity}
          onChange={(e) => setProp('opacity', Number(e.target.value))} className="w-full accent-[#b4532a]" />
      </div>
    </Pop>
  )

  let options: ReactNode
  if (selection.length) {
    options = (
      <>
        <Group><span className="rounded-full bg-clay/15 px-2 py-0.5 text-[11.5px] font-medium text-clay">Đã chọn {selection.length}</span></Group>
        {colorRow}
        {!onlyText && widthRow}
        {hasText && fontRow}
        {!onlyText && strokeStyleRow}
        {canFill && <Group>{fillPop}</Group>}
        <Group>{opacityPop}</Group>
        <Group label="Sắp xếp">
          <IconBtn label="Đưa lên trên cùng" onClick={() => reorder('front')}><Ico d="M12 19V5m-6 6l6-6 6 6" /></IconBtn>
          <IconBtn label="Đưa xuống dưới cùng" onClick={() => reorder('back')}><Ico d="M12 5v14m6-6l-6 6-6-6" /></IconBtn>
          <IconBtn label="Nhân đôi — Ctrl+D" onClick={duplicate}><Ico d="M8 8h11v11H8zM5 16V5h11" /></IconBtn>
          <IconBtn label="Xoá — Delete" onClick={deleteSelected}><Ico d="M5 7h14M10 7V5h4v2m-7 0l1 12h8l1-12" /></IconBtn>
        </Group>
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
        {widthRow}
        {strokeStyleRow}
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
              <span className="rounded-full bg-current opacity-70" style={{ width: 5 + i * 5, height: 5 + i * 5 }} />
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
    options = null
  } else if (main === 'select') {
    options = (
      <>
        <Group label="Cách chọn">
          <Chip active={o.selectMode === 'box'} onClick={() => setOpt('selectMode', 'box')} title="Kéo khung chữ nhật để chọn"><Ico d="M4 4h16v16H4z" /><span>Khung</span></Chip>
          <Chip active={o.selectMode === 'lasso'} onClick={() => setOpt('selectMode', 'lasso')} title="Khoanh tự do quanh nét cần chọn"><Ico d={LASSO_D} /><span>Khoanh tự do</span></Chip>
        </Group>
      </>
    )
  } else if (main === 'shape') {
    options = (
      <>
        <Group label="Hình">
          {o.recentShapes.map((k) => SHAPE_BY_ID[k]).filter(Boolean).map((sd) => (
            <Chip key={sd.id} active={tool === sd.id} onClick={() => pickTool(sd.id)} title={sd.label}><Ico d={sd.icon} /></Chip>
          ))}
          <Pop id="shapes" pop={pop} setPop={setPop} title="Tất cả hình"
            face={<span className="flex items-center gap-1 px-1 text-[12.5px] text-ink">Tất cả<svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></span>}>
            {SHAPE_SECTIONS.map((sec) => (
              <div key={sec.label}>
                <div className="mb-1 text-[11.5px] text-ink-3">{sec.label}</div>
                <div className="grid grid-cols-4 gap-1">
                  {sec.ids.map((k) => SHAPE_BY_ID[k]).map((sd) => (
                    <button key={sd.id} type="button" title={sd.label} onClick={() => { pickTool(sd.id); setPop(null) }}
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
        {widthRow}
        {strokeStyleRow}
        {roughRow}
        {canFill && <Group>{fillPop}</Group>}
      </>
    )
  } else if (main === 'text') {
    options = (
      <>
        {colorRow}
        {fontRow}
      </>
    )
  } else {
    options = null
  }

  const mainTools: { id: Main; label: string; icon: string; onClick: () => void }[] = [
    { id: 'pen', label: 'Bút', icon: PEN_D, onClick: () => pickTool('freedraw') },
    { id: 'eraser', label: 'Gôm', icon: ERASER_D, onClick: () => pickTool('eraser') },
    { id: 'laser', label: 'Laser', icon: LASER_D, onClick: () => pickTool('laser') },
    { id: 'select', label: 'Chọn', icon: o.selectMode === 'lasso' ? LASSO_D : SELECT_D, onClick: () => pickTool('select') },
    { id: 'shape', label: 'Hình', icon: SHAPE_D, onClick: () => pickTool(o.lastShape) },
    { id: 'text', label: 'Chữ', icon: TEXT_D, onClick: () => pickTool('text') },
    { id: 'hand', label: 'Kéo', icon: HAND_D, onClick: () => pickTool('hand') },
  ]

  return (
    <div className="board-editor flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* tầng 1: công cụ chính · tầng 2: tuỳ chọn của công cụ đang chọn */}
      <div className="relative z-20 shrink-0 border-b border-line bg-surface">
        <div className="@container flex h-12 min-w-0 items-end gap-2 px-3 pb-1">
          <div className="flex items-center gap-0.5">
            <IconBtn label="Hoàn tác — Ctrl Z" onClick={undo} disabled={undoStack.current.length < 2}><Ico d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" /></IconBtn>
            <IconBtn label="Làm lại — Ctrl Y" onClick={redo} disabled={!redoStack.current.length}><Ico d="M15 14l5-5-5-5m5 5H9a5 5 0 0 0 0 10h3" /></IconBtn>
          </div>
          <span className="h-5 w-px bg-line" />
          <div ref={segRef} className="relative flex items-center gap-0.5 rounded-[10px] bg-sunken p-[3px]">
            {/* nền trắng trượt theo công cụ đang chọn */}
            <span
              aria-hidden
              className="absolute top-[3px] h-8 rounded-[7px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] transition-[left,width] duration-200 ease-out"
              style={{ left: seg.l, width: seg.w, opacity: seg.w ? 1 : 0 }}
            />
            {mainTools.map((m) => (
              <button
                key={m.id} type="button" title={m.label} aria-pressed={main === m.id} onClick={m.onClick}
                className={`relative flex h-8 items-center gap-1.5 rounded-[7px] px-3 text-[13px] transition-colors duration-200 ${main === m.id ? 'text-clay' : 'text-ink-2 hover:text-ink'}`}
              >
                <Ico d={m.icon} size={16} />
                <span className="hidden @[860px]:inline">{m.label}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-0.5">
            <Pop id="paper" pop={pop} setPop={setPop} title="Kiểu giấy" align="right"
              face={<span className="flex items-center gap-1.5 px-1.5 text-[13px] text-ink"><Ico d="M6 3h9l4 4v14H6zM14 3v5h5" size={16} />Giấy</span>}>
              <div className="text-[12px] font-medium text-ink-2">Kiểu giấy</div>
              <div className="grid grid-cols-2 gap-2">
                {PAPERS.map((pp) => {
                  const on = o.paper === pp.id
                  return (
                    <button key={pp.id} type="button" aria-pressed={on} onClick={() => setOpt('paper', pp.id)}
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
            <span className="mx-1.5 h-5 w-px bg-line" />
            <IconBtn label="Thu nhỏ — Ctrl −" onClick={() => zoomAt(v.zoom / 1.2)}><Ico d="M6 12h12" /></IconBtn>
            <button type="button" title="Về 100% — Ctrl 0" onClick={() => zoomAt(1)} className="h-8 w-12 rounded-[6px] text-center text-[12.5px] text-ink tnum hover:bg-sunken">
              {Math.round(v.zoom * 100)}%
            </button>
            <IconBtn label="Phóng to — Ctrl +" onClick={() => zoomAt(v.zoom * 1.2)}><Ico d="M6 12h12M12 6v12" /></IconBtn>
          </div>
        </div>
        <div className="flex h-11 items-center overflow-x-auto [scrollbar-width:none] pb-1 px-3 text-[12.5px] text-ink-2 [&>div:first-child]:pl-0">
          {options}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => { eraserAt.current = null; redraw() }}
          onDoubleClick={onDoubleClick}
          onContextMenu={(e) => e.preventDefault()}
        />
        {textarea}
      </div>
    </div>
  )
}

/* ---------- định nghĩa giao diện ---------- */

type Main = 'pen' | 'eraser' | 'laser' | 'select' | 'shape' | 'text' | 'hand'

const ERASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><g transform="rotate(-40 13 13)"><rect x="5" y="8" width="17" height="10" rx="2.5" fill="#f4a3a8" stroke="#3f3f46" stroke-width="1.3"/><rect x="5" y="8" width="6" height="10" rx="2.5" fill="#e5e7eb" stroke="#3f3f46" stroke-width="1.3"/></g></svg>'
const LASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><circle cx="9" cy="9" r="7" fill="#ff3b30" fill-opacity="0.25"/><circle cx="9" cy="9" r="3.5" fill="#ff3b30" stroke="white" stroke-width="1.2"/></svg>'
const PEN_D = 'M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16zM14 7l3 3'
const ERASER_D = 'M8 20h12M5.5 14.5l7-7a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8l-2.5-2.5a1.5 1.5 0 0 1 0-2z'
const LASER_D = 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1'
const SELECT_D = 'M5 3l14 7-6 2-2 6z'
const LASSO_D = 'M7 17c-2.5-1-4-3-4-5.5C3 7.4 7 4 12 4s9 3.4 9 7.5S17 19 12 19c-1.2 0-2.3-.2-3.3-.5M7 17a2 2 0 1 0 1.7 1.5M8.7 18.5L9 21'
const SHAPE_D = 'M3 3h9v9H3zM16.5 12a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z'
const TEXT_D = 'M5 6V4h14v2M12 4v16m-3 0h6'
const HAND_D = 'M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.9-2.5L3.6 13a1.5 1.5 0 0 1 2.4-1.8L8 13'

const FOUNTAIN_D = 'M12 3l5 7-5 11-5-11zM12 3v9m0 0a1.5 1.5 0 1 0 0 .01'
/** outside = hiện thẳng ở hàng 2; còn lại nằm trong bảng "Kiểu bút" */
const PENS: { id: PenKind; label: string; icon: string; outside?: boolean }[] = [
  { id: 'ball', label: 'Bút bi', icon: PEN_D, outside: true },
  { id: 'highlight', label: 'Dạ quang', icon: 'M4 20h7M9 16l-2 2-2-2 2-2M7 14l8-8 4 4-8 8z', outside: true },
  { id: 'fountain', label: 'Bút máy', icon: FOUNTAIN_D },
  { id: 'brush', label: 'Bút lông', icon: 'M7 21c-2 0-3-1-3-3 0-2.5 3-2 4-4l2-2 3 3-2 2c-2 1-1.5 4-4 4zM12 12l7-8 1 1-8 7' },
  { id: 'pencil', label: 'Bút chì', icon: 'M4 20l1.5-4.5L16 5l3 3L8.5 18.5zM14 7l3 3M4 20l3-1' },
  { id: 'marker', label: 'Bút dạ', icon: 'M9 15l-5 5M9 15l6-6 4 4-6 6zM15 9l2-2a2.8 2.8 0 0 1 4 4l-2 2' },
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
    <div className="w-[300px] space-y-3">
      <div className="text-[12px] font-medium text-ink-2">{label}</div>
      <div className="grid h-[104px] place-items-center rounded-[8px] border border-line bg-white">
        <svg width="280" height="104" viewBox="0 0 280 104">
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
const SHAPE_DEFS: { id: Kind; label: string; short: string; icon: string }[] = [
  { id: 'rectangle', label: 'Hình chữ nhật — R', short: 'Chữ nhật', icon: 'M4 5h16v14H4z' },
  { id: 'ellipse', label: 'Hình tròn / elip — O', short: 'Tròn', icon: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z' },
  { id: 'diamond', label: 'Hình thoi — D', short: 'Thoi', icon: 'M12 3l9 9-9 9-9-9z' },
  { id: 'arrow', label: 'Mũi tên — A', short: 'Mũi tên', icon: 'M4 20L20 4m0 0h-8m8 0v8' },
  { id: 'line', label: 'Đường thẳng — L', short: 'Đường', icon: 'M4 20L20 4' },
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
function Group({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="relative flex shrink-0 items-center gap-1 px-3 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-px before:-translate-y-1/2 before:bg-line first:before:hidden">
      {label && <span className="mr-1 whitespace-nowrap text-[11.5px] text-ink-3">{label}</span>}
      {children}
    </div>
  )
}

function Chip({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button" title={title} aria-label={title} onClick={onClick} aria-pressed={active}
      className={`flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2 text-[12.5px] transition-colors ${active ? 'bg-clay/10 text-clay' : 'text-ink hover:bg-sunken'}`}
    >
      {children}
    </button>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex h-8 items-center gap-2 rounded-[6px] px-2 text-[12.5px] text-ink hover:bg-sunken">
      <span className={`relative h-4 w-7 rounded-full transition-colors ${on ? 'bg-clay' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      {children}
    </button>
  )
}

function Pop({ id, pop, setPop, title, face, children, align }: {
  id: string; pop: string | null; setPop: (p: string | null) => void; title: string; face: ReactNode; children: ReactNode; align?: 'right'
}) {
  const open = pop === id
  return (
    <div className="relative" data-pop={id}>
      <button
        type="button" title={title} aria-label={title} aria-expanded={open} onClick={() => setPop(open ? null : id)}
        className={`flex h-8 items-center rounded-[7px] px-1 ${open ? 'bg-sunken' : 'hover:bg-sunken'}`}
      >
        {face}
      </button>
      {open && (
        <div className={`z-50 space-y-2.5 rounded-[10px] border border-line bg-surface p-3 shadow-lift ${align === 'right' ? 'absolute right-0 top-full mt-1.5 w-max' : 'fixed mt-1'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

/** ô nhập mã màu (#rrggbb) + nút mở bảng màu của máy */
function HexInput({ value, onPreview, onCommit }: { value: string; onPreview: (c: string) => void; onCommit: (c: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const valid = (t: string) => /^#?[0-9a-f]{6}$/i.test(t.trim())
  const norm = (t: string) => `#${t.trim().replace('#', '').toLowerCase()}`
  const commit = () => { if (valid(text) && norm(text) !== value.toLowerCase()) onCommit(norm(text)) }
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-[6px] border border-black/10" style={{ background: valid(text) ? norm(text) : value }} title="Mở bảng màu">
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
      <div className="flex gap-1">{children}</div>
    </div>
  )
}

const NONE_BG = 'linear-gradient(135deg, #fff 45%, #e03131 45%, #e03131 55%, #fff 55%)'

function Swatch({ color, active, onClick, round, title }: { color: string; active: boolean; onClick: () => void; round?: boolean; title?: string }) {
  const none = color === 'transparent'
  return (
    <button
      type="button" onClick={onClick} title={none ? 'Không màu' : title ?? color} aria-label={none ? 'Không màu' : `${title ?? 'Màu'} ${color}`} aria-pressed={active}
      className={`mx-[3px] h-5 w-5 shrink-0 ${round ? 'rounded-full' : 'rounded-[5px]'} border border-black/10 transition-transform hover:scale-110 ${active ? 'ring-2 ring-clay ring-offset-2 ring-offset-surface' : ''}`}
      style={{ background: none ? NONE_BG : color }}
    />
  )
}

function Ico({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )
}

function IconBtn({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-[6px] text-ink hover:bg-sunken disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}
