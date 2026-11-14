/**
 * Trình soạn bài giảng trình chiếu (slide).
 *
 * Nằm trong tab slide của trình soạn chung (`/soan-de`) cùng hệ tab + AI panel;
 * mọi tài liệu được lưu về Home qua store khi đóng tab hoặc rời trang.
 *
 * Model dữ liệu (`Deck` / `Slide` / `SlideElement`) nằm ở `store/docs.ts`.
 */
import { dialog } from '@/components/Dialog'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ColorPalette } from './ColorPalette'
import { SelectionToolbar } from './SelectionToolbar'
import { SlideSidePanel } from './SlideSidePanel'
import { SlideStrip } from './SlideStrip'
import { rewriteElement } from '@/lib/slideRewrite'
import { keepCustomBg, slideBgStyle, withBackground } from '@/lib/slideBackground'
import { ChevronLeft, ChevronRight, Minimize2, MonitorPlay } from 'lucide-react'
import { alignBoxes, type AlignMode } from '@/lib/slideAlign'
import { graphicMainColor } from '@/lib/slideGraphics'
import { hasRich } from '@/lib/slideMath'
import { renderMath } from '@/lib/math'
import { autoAnimate, clearAnimation, slideSteps } from '@/lib/slideAnim'
import { EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Deck, DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import { parseAiDeck, type AiSlidePayload, type DeckPlan } from '@/lib/aiDeck'
import { exportDeckPptx } from '@/lib/exportDeck'
import { HtmlDeckBar, HtmlSlideFrame } from './HtmlSlide'
import { applyDeckDesign, applyEdits, describeSlide, recomposeSlide, type SlideEditOp } from '@/lib/slideEdit'
import { elementHeight } from '@/lib/slideText'
import { normalizeTheme, type ResolvedTheme } from '@/lib/slideTheme'
import { readableElements } from '@/lib/slideContrast'
import { type SlideDesign } from '@/lib/slideDesigns'
import { applySkin } from '@/lib/slideSkins'
import { appendSlidesToDeck, withImage } from '@/lib/slideAi'
import { IMAGE_LAYOUTS, buildImagePrompt, generateSlideImage, queueImage } from '@/lib/imageGen'
import { uploadImage } from '@/lib/mediaStore'
import { SLIDE_LAYOUTS, composeLayout, contentFromSlide, defaultTone, isLayoutId, toneBackground, withPlaceholders, type SlideLayoutId } from '@/lib/slideLayouts'
import { AiPanel } from './AiPanel'
import { AiDock } from './Layout'
import { SlideRibbon, type SlideRibbonTab } from './SlideRibbon'
import { attachToAi } from '@/lib/aiAttach'
import { SlideThumb, SlideElView } from './slideRender'
import { GroupToolbar, SnapGuides, EditableEl } from './slideEditParts'

/** Trạng thái ẩn/hiện của hiệu ứng bấm-chuột: mờ dần + trượt/phóng nhẹ (translate/scale tách khỏi transform xoay của phần tử). */
const HIDDEN_POSE = { fade: {}, rise: { translate: '0 2.4cqw' }, zoom: { scale: '0.8' } } as const
export const revealStyle = (shown: boolean, anim: SlideElement['anim'] = 'fade'): React.CSSProperties => ({
  opacity: shown ? 1 : 0,
  ...(shown ? { translate: '0 0', scale: '1' } : HIDDEN_POSE[anim]),
  transition: 'opacity 450ms ease, translate 450ms cubic-bezier(.2,.8,.2,1), scale 450ms cubic-bezier(.2,.8,.2,1)',
})

/** Lớp phủ cả slide bọc một phần tử; zoom phóng quanh tâm phần tử chứ không quanh tâm slide. */
function RevealLayer({ el, shown, children }: { el: SlideElement; shown: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: el.zIndex,
        transformOrigin: `${el.x + el.w / 2}% ${el.y + el.h / 2}%`,
        ...revealStyle(shown, el.anim),
      }}
    >
      {children}
    </div>
  )
}

/**
 * Vẽ công thức trong slide. `\frac` → `\tfrac` (phân số cỡ chữ thường): phân số
 * cỡ display cao ~2,2em làm dòng chữ phình ra và bị `FitText` co nhỏ.
 */
export const slideMathHtml = (text: string): string =>
  renderMath(text.replace(/\\(d?)frac/g, '\\tfrac')).replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')

/** Ô bảng có công thức: hiện KaTeX khi không gõ, nhấp đúp để sửa mã. */
/** hàng màu trong bảng Định dạng: bấm ô màu để mở bảng ô vuông + mã màu ngay bên dưới */
function PaneColor({ label, value, themeColors, onPick }: { label: string; value: string; themeColors: string[]; onPick: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-1.5">
      <div className="slide-format-pane__row" style={{ marginBottom: open ? 6 : 0 }}>
        <span>{label}</span>
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="h-6 w-[30px] rounded-[3px] border border-line-2"
          style={{ background: value }}
        />
      </div>
      {open && <ColorPalette value={value} themeColors={themeColors} onPick={onPick} />}
    </div>
  )
}

export function MathCell({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  if (hasRich(value) && !editing) {
    return (
      <span
        data-tip="Nhấp đúp để sửa công thức"
        onDoubleClick={() => setEditing(true)}
        dangerouslySetInnerHTML={{ __html: slideMathHtml(value) }}
      />
    )
  }
  return (
    <input
      autoFocus={editing}
      onBlur={() => setEditing(false)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none"
      style={{ color: 'inherit' }}
    />
  )
}

const uid = () => Math.random().toString(36).slice(2, 10)
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** biến màu cho hoạ tiết nền `.slide-frame[data-decor]` (slide.css) */
/**
 * Xuất PDF: dựng mọi slide thành các trang 16:9 trong lớp chỉ hiện khi in, rồi mở hộp thoại in của
 * trình duyệt (chọn "Lưu thành PDF"). Dùng đúng bộ vẽ của bản xem nên phông, công thức, màu giống hệt —
 * không phụ thuộc phông trong PowerPoint. CSS in nằm ở slide.css (`.slide-print-*`).
 */
function PrintDeck({ slides, theme, onDone }: { slides: Slide[]; theme: ResolvedTheme; onDone: () => void }) {
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    let alive = true
    const finish = () => done.current()
    window.addEventListener('afterprint', finish, { once: true })
    // đợi phông (Be Vietnam Pro, KaTeX) nạp xong rồi mới in, nếu không trang đầu in bằng phông tạm
    void (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(() => alive && window.print()))
    return () => {
      alive = false
      window.removeEventListener('afterprint', finish)
    }
  }, [])
  return createPortal(
    <div className="slide-print-root">
      {slides.map((slide) => (
        <div key={slide.id} className="slide-print-page">
          {slide.html ? null : (
            <div className="slide-frame relative h-full w-full overflow-hidden" data-decor={theme.decor} style={{ ...slideBgStyle(slide), ...decorStyle(theme) }}>
              {readableElements(slide, theme).map((el) => (
                <SlideElView key={el.id} el={el} theme={theme} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>,
    document.body,
  )
}

export const decorStyle = (theme: ResolvedTheme): React.CSSProperties =>
  ({ '--slide-decor-ink': theme.fg, '--slide-decor-accent': theme.secondary }) as React.CSSProperties

export interface SlideEditorProps {
  deck: Deck
  /** cập nhật deck (đã gộp sẵn trong store) */
  updateDeck: (patch: Partial<Deck>) => void
  /** lưu deck */
  onSave?: () => void
  /** menu Tệp: tạo bài giảng mới trong tab khác */
  onNewDeck?: () => void
  /** menu Tệp: nhập .pptx/.docx/.xlsx thành tab bài giảng mới */
  onImportFile?: (file: File) => Promise<void>
}

export function SlideEditor({
  deck,
  updateDeck,
  onSave,
  onNewDeck,
  onImportFile,
}: SlideEditorProps) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  /** chọn nhiều (Shift+bấm, Ctrl+A): ≥2 id, khi đó selectedElementId = null */
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [ribbonTab, setRibbonTab] = useState<SlideRibbonTab>('home')
  const [presenting, setPresenting] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)
  /** số lần đã bấm trong slide đang chiếu (hiệu ứng bấm-chuột-rồi-hiện) */
  const [presentStep, setPresentStep] = useState(0)
  /** vùng chuột đang đứng khi chiếu: mép trái/phải hiện mũi tên, đáy hiện thanh điều khiển */
  const [presentHover, setPresentHover] = useState<'left' | 'right' | 'bar' | null>(null)
  const [printing, setPrinting] = useState(false)
  /** hình khối đang được gõ chữ trong đó */
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null)
  // màn hẹp (tablet/điện thoại): trợ lý AI nổi đè lên slide nên mặc định đóng
  const [aiOpen, setAiOpen] = useState(() => window.innerWidth >= 1024)
  const [zoom, setZoom] = useState(100)
  const [formatPaneOpen, setFormatPaneOpen] = useState(false)
  const [clipboardElement, setClipboardElement] = useState<SlideElement | null>(null)
  /** ghi chú diễn giả đang mở (nút nhỏ ở góc slide) */
  const [notesOpen, setNotesOpen] = useState(false)
  /** AI đang sinh slide: cột thumbnail vẽ ô chờ skeleton (chặng 26b) */
  const [pendingSlides, setPendingSlides] = useState<{ done: number; total: number } | null>(null)
  const historyRef = useRef<{ past: Deck[]; future: Deck[] }>({ past: [], future: [] })
  /** deck mới nhất — ảnh AI tạo xong sau ~20s không được ghi đè sửa đổi trong lúc chờ */
  const deckRef = useRef(deck)
  /** vừa kéo/resize/xoay: bỏ qua cú click kế tiếp rơi ra ngoài phần tử */
  const didDragRef = useRef(false)
  const swipeRef = useRef<{ x: number; y: number; didSwipe: boolean } | null>(null)

  const slides = deck.slides
  /** số ô skeleton còn chờ trong cột thumbnail (trang bị bỏ cũng tính là xong) */
  const pendingCount = pendingSlides
    ? Math.max(0, pendingSlides.total - pendingSlides.done)
    : 0
  /** theme đã điền đủ token — deck cũ chỉ có bg/fg/accent vẫn dựng đúng */
  const theme = useMemo(() => normalizeTheme(deck.theme), [deck.theme])

  useEffect(() => {
    deckRef.current = deck
  }, [deck])

  const currentSlide = useMemo(
    () => slides.find((s) => s.id === selectedSlideId) ?? slides[0] ?? null,
    [slides, selectedSlideId],
  )
  const selectedElement = currentSlide?.elements.find((el) => el.id === selectedElementId) ?? null
  const groupEls = currentSlide?.elements.filter((el) => groupIds.includes(el.id)) ?? []

  useEffect(() => {
    if (selectedElementId) setGroupIds([])
  }, [selectedElementId])
  useEffect(() => setGroupIds([]), [currentSlide?.id])

  const toggleInGroup = (id: string) => {
    const base = groupIds.length ? groupIds : selectedElementId ? [selectedElementId] : []
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    if (next.length >= 2) {
      setGroupIds(next)
      setSelectedElementId(null)
    } else {
      setGroupIds([])
      setSelectedElementId(next[0] ?? null)
    }
  }

  const commitDeck = useCallback((next: Deck) => {
    historyRef.current.past = [...historyRef.current.past, deck].slice(-50)
    historyRef.current.future = []
    updateDeck(next)
  }, [deck, updateDeck])

  const undo = useCallback(() => {
    const previous = historyRef.current.past.pop()
    if (!previous) return
    historyRef.current.future.unshift(deck)
    updateDeck(previous)
  }, [deck, updateDeck])

  const redo = useCallback(() => {
    const next = historyRef.current.future.shift()
    if (!next) return
    historyRef.current.past.push(deck)
    updateDeck(next)
  }, [deck, updateDeck])

  /* ---------------------------------------------------------------- *
   * Slide helpers
   * ---------------------------------------------------------------- */
  const patchSlide = useCallback(
    (id: string, patch: Partial<Slide>) => {
      commitDeck({
        ...deck,
        slides: deck.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      })
    },
    [commitDeck, deck],
  )

  const addElement = (el: SlideElement) => {
    if (!currentSlide) return
    patchSlide(currentSlide.id, { elements: [...currentSlide.elements, el] })
  }

  /** thêm slide trống vào vị trí `index` (0..n) */
  const addSlideAt = (index: number) => {
    const s: Slide = {
      id: uid(),
      background: deck.theme.bg,
      elements: [],
      transition: 'none',
    }
    const next = [...deck.slides]
    next.splice(index, 0, s)
    commitDeck({ ...deck, slides: next })
    setSelectedSlideId(s.id)
    setSelectedElementId(null)
  }

  const addSlide = () => addSlideAt(deck.slides.length)

  /** thêm một slide mới theo bố cục có sẵn (tab Mẫu) — slide đang mở không đổi */
  const addLayoutSlide = (layoutId: SlideLayoutId) => {
    const tone = defaultTone(layoutId)
    // slide thêm tay vẫn theo bộ trang trí của deck
    const decorKit = deck.slides.find((slide) => slide.decorKit)?.decorKit
    const elements = composeLayout(deck.theme, layoutId, { ...withPlaceholders(layoutId, {}), decorKit }, tone)
    let s: Slide = {
      id: uid(),
      layout: layoutId,
      tone,
      ...(decorKit ? { decorKit } : {}),
      background: toneBackground(deck.theme, tone),
      elements,
      transition: 'none',
    }
    if (deck.design) {
      s = applySkin(s, deck.design, deck.theme, deck.slides.length, deck.slides.length + 1)
    }
    commitDeck({ ...deck, slides: [...deck.slides, s] })
    setSelectedSlideId(s.id)
    setSelectedElementId(null)
  }

  const duplicateSlide = (id: string) => {
    const idx = deck.slides.findIndex((s) => s.id === id)
    if (idx < 0) return
    const copy: Slide = {
      ...deck.slides[idx],
      id: uid(),
      elements: deck.slides[idx].elements.map((e) => ({ ...e, id: uid() })),
    }
    const next = [...deck.slides]
    next.splice(idx + 1, 0, copy)
    commitDeck({ ...deck, slides: next })
    setSelectedSlideId(copy.id)
    setSelectedElementId(null)
  }

  /** Kéo thumbnail: chèn slide `from` vào khe `insertAt` (0..n), như PowerPoint. */
  const moveSlide = (from: number, insertAt: number) => {
    const target = insertAt > from ? insertAt - 1 : insertAt
    if (target === from) return
    const next = [...deck.slides]
    const [moved] = next.splice(from, 1)
    next.splice(target, 0, moved)
    commitDeck({ ...deck, slides: next })
  }

  const removeSlide = (id: string) => {
    const next = deck.slides.filter((s) => s.id !== id)
    commitDeck({ ...deck, slides: next })
    if (selectedSlideId === id) {
      setSelectedSlideId(next[0]?.id ?? null)
      setSelectedElementId(null)
    }
  }

  const updateElement = (slideId: string, elId: string, patch: Partial<SlideElement>) => {
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === slideId
          ? { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) }
          : s,
      ),
    })
  }

  const removeElement = (slideId: string, elId: string) => {
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === slideId ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s,
      ),
    })
    setSelectedElementId(null)
  }

  /** Ghi ảnh AI xong vào đúng phần tử, dựa trên deck mới nhất lúc hoàn tất. */
  const setElementImage = (slideId: string, elId: string, src: string) => {
    const latest = deckRef.current
    historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
    historyRef.current.future = []
    updateDeck({
      slides: latest.slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map((el) => (el.id === elId ? { ...el, src } : el)),
            }
          : slide,
      ),
    })
  }

  /** Prompt lấy từ tiêu đề + ý chính của slide đang chứa ảnh. */
  const generateImageFor = async (slideId: string, elId: string) => {
    const slide = slides.find((s) => s.id === slideId)
    if (!slide) return
    const content = contentFromSlide(slide)
    const image = await generateSlideImage(buildImagePrompt(content.title, content.bullets))
    setElementImage(slideId, elId, await uploadImage(image.dataUrl))
  }

  /** Áp dụng bộ thiết kế lên toàn bộ slide hiện có (chỉ restyle, không thêm/bớt slide). */
  const applyDesignToDeck = (design: SlideDesign | null) => {
    const latest = deckRef.current
    if (latest.format === 'html') return
    commitDeck(applyDeckDesign(latest, design))
  }


  // Panel thư viện được memo để kéo phần tử (cập nhật deck mỗi lần di chuột) không vẽ lại hàng trăm đồ hoạ;
  // handler đi qua ref để callback ổn định mà vẫn luôn gọi bản mới nhất (không giữ deck cũ).
  const panelHandlers = useRef({
    insert: (_el: SlideElement) => {},
    addLayout: (_id: SlideLayoutId) => {},
    applyDesign: (_design: SlideDesign | null) => {},
  })
  panelHandlers.current = {
    insert: (el) => { addElement(el); setSelectedElementId(el.id) },
    addLayout: addLayoutSlide,
    applyDesign: applyDesignToDeck,
  }
  const insertFromPanel = useCallback((el: SlideElement) => panelHandlers.current.insert(el), [])
  const addLayoutFromPanel = useCallback((id: SlideLayoutId) => panelHandlers.current.addLayout(id), [])
  const applyDesignFromPanel = useCallback((design: SlideDesign | null) => panelHandlers.current.applyDesign(design), [])

  const previewElement = useCallback(
    (slideId: string, elId: string, patch: Partial<SlideElement>) => {
      updateDeck({
        ...deck,
        slides: deck.slides.map((s) =>
          s.id === slideId
            ? { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) }
            : s,
        ),
      })
    },
    [deck, updateDeck],
  )

  const previewMany = useCallback(
    (slideId: string, patches: Record<string, Partial<SlideElement>>) => {
      updateDeck({
        ...deck,
        slides: deck.slides.map((s) =>
          s.id === slideId ? { ...s, elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)) } : s,
        ),
      })
    },
    [deck, updateDeck],
  )

  const alignGroup = (mode: AlignMode) => {
    if (!currentSlide) return
    const patches = alignBoxes(groupEls.map((e) => ({ id: e.id, x: e.x, y: e.y, w: e.w, h: elementHeight(e) })), mode)
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) =>
        s.id === currentSlide.id ? { ...s, elements: s.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)) } : s,
      ),
    })
  }

  const removeGroup = () => {
    if (!currentSlide) return
    commitDeck({
      ...deck,
      slides: deck.slides.map((s) => (s.id === currentSlide.id ? { ...s, elements: s.elements.filter((e) => !groupIds.includes(e.id)) } : s)),
    })
    setGroupIds([])
  }

  /** Chụp trạng thái trước khi bắt đầu một thao tác kéo/đổi text để undo gộp cả thao tác. */
  const beginHistory = useCallback(() => {
    historyRef.current.past = [...historyRef.current.past, deck].slice(-50)
    historyRef.current.future = []
  }, [deck])

  useEffect(() => {
    if (!selectedElement) {
      if (['elementFormat', 'pictureFormat', 'tableDesign', 'chartDesign'].includes(ribbonTab)) {
        setRibbonTab('home')
      }
      return
    }
    const auto: Partial<Record<SlideElement['type'], SlideRibbonTab>> = {
      image: 'pictureFormat',
      shape: 'elementFormat',
      icon: 'elementFormat',
      graphic: 'elementFormat',
      connector: 'elementFormat',
      table: 'tableDesign',
      chart: 'chartDesign',
    }
    const next = auto[selectedElement.type]
    if (next) setRibbonTab(next)
  }, [selectedElement?.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = target?.closest?.('input, textarea, select, [contenteditable="true"]')
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'd' && selectedElement && currentSlide && !typing) {
        e.preventDefault()
        addElement({ ...selectedElement, id: uid(), x: selectedElement.x + 3, y: selectedElement.y + 3 })
        return
      }
      if (mod && e.key.toLowerCase() === 'a' && currentSlide && !currentSlide.html && !typing) {
        e.preventDefault()
        const ids = currentSlide.elements.map((el) => el.id)
        if (ids.length >= 2) {
          setGroupIds(ids)
          setSelectedElementId(null)
        } else setSelectedElementId(ids[0] ?? null)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && groupIds.length && !typing) {
        e.preventDefault()
        removeGroup()
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && currentSlide && !typing) {
        e.preventDefault()
        removeElement(currentSlide.id, selectedElement.id)
        return
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null)
        setGroupIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedElement, currentSlide, undo, redo, groupIds])

  /**
   * Áp kết quả AI vào deck.
   *
   * AI trả về JSON dạng:
   *   { "slides": [ { "title": "...", "elements": [ { "type": "text", "text": "..." } ] } ] }
   * Nếu không parse được thì coi như một slide text đơn giản — không làm hỏng deck.
   */
  const arrangeSelected = (action: 'front' | 'back' | 'forward' | 'backward') => {
    if (!currentSlide || !selectedElementId) return
    const index = currentSlide.elements.findIndex((el) => el.id === selectedElementId)
    if (index < 0) return
    const next = [...currentSlide.elements]
    const target = action === 'front' ? next.length - 1 : action === 'back' ? 0 : action === 'forward' ? Math.min(next.length - 1, index + 1) : Math.max(0, index - 1)
    const [element] = next.splice(index, 1)
    next.splice(target, 0, element)
    patchSlide(currentSlide.id, { elements: next })
  }

  const alignSelected = (action: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!currentSlide || !selectedElement) return
    const h = elementHeight(selectedElement)
    const patch = action === 'left' ? { x: 0 } : action === 'center' ? { x: (100 - selectedElement.w) / 2 } : action === 'right' ? { x: 100 - selectedElement.w } : action === 'top' ? { y: 0 } : action === 'middle' ? { y: (100 - h) / 2 } : { y: 100 - h }
    updateElement(currentSlide.id, selectedElement.id, patch)
  }

  const flipSelected = (axis: 'x' | 'y') => {
    if (!currentSlide || !selectedElement) return
    updateElement(currentSlide.id, selectedElement.id, axis === 'x' ? { flipX: !selectedElement.flipX } : { flipY: !selectedElement.flipY })
  }

  /**
   * Đổi theme: slide có layout được dựng lại để màu/font khớp theme mới (màu chữ
   * của layout là màu cụ thể, không tự theo theme); slide freeform giữ hành vi cũ.
   */
  const applyTheme = (nextTheme: DeckTheme) => {
    commitDeck({ ...deck, theme: nextTheme, slides: deck.slides.map((slide) => recomposeSlide(nextTheme, slide)) })
  }

  /** Đổi tông cho slide đã có layout; dựng lại phần tử theo tông mới. */
  const applyTone = (tone: SlideTone) => {
    if (!currentSlide?.layout || !isLayoutId(currentSlide.layout)) return
    const elements = composeLayout(
      deck.theme,
      currentSlide.layout,
      contentFromSlide(currentSlide),
      tone,
    )
    if (elements.length === 0) return
    // chọn tông = muốn nền theo bộ màu, nên bỏ nền riêng
    patchSlide(currentSlide.id, {
      tone,
      customBg: undefined,
      bgImage: undefined,
      background: toneBackground(deck.theme, tone),
      elements,
    })
  }

  const onUpdateSelected = (patch: Partial<SlideElement>) => {
    if (currentSlide && selectedElement) updateElement(currentSlide.id, selectedElement.id, patch)
  }

  /** Áp layout cho slide đang chọn; hỏi trước vì thay toàn bộ phần tử. */
  const applyLayout = async (layoutId: SlideLayoutId) => {
    if (!currentSlide) return
    const name = SLIDE_LAYOUTS.find((layout) => layout.id === layoutId)?.name ?? layoutId
    if (!(await dialog.confirm('Nội dung hiện tại của slide sẽ được thay.', { title: `Áp bố cục "${name}"?`, confirmLabel: 'Áp bố cục' }))) return
    const content = withPlaceholders(layoutId, contentFromSlide(currentSlide))
    const tone = defaultTone(layoutId)
    const elements = composeLayout(deck.theme, layoutId, content, tone)
    if (elements.length === 0) return
    const next = keepCustomBg(
      currentSlide,
      { ...currentSlide, layout: layoutId, tone, background: toneBackground(deck.theme, tone), elements },
      deck.theme.fg,
    )
    patchSlide(currentSlide.id, { layout: next.layout, tone: next.tone, background: next.background, elements: next.elements })
  }

  /**
   * Nối slide AI vào **deck mới nhất** (deckRef), không dùng `deck` của lần
   * render trước: các trang sinh xong cách nhau vài giây, người dùng có thể đã
   * sửa/xoá slide trong lúc chờ. Việc dựng slide + đổi theme nằm ở
   * `appendSlidesToDeck` (lib/slideAi.ts) để test được.
   */
  const appendAiSlides = (pages: AiSlidePayload[], plan?: DeckPlan): Slide[] => {
    if (!pages.length) return []
    // Bài giảng HTML không trộn với slide PPT: dựng PPT mới thì bỏ các slide HTML.
    if (deckRef.current.format === 'html') {
      deckRef.current = { ...deckRef.current, format: undefined, slides: [] }
      updateDeck({ format: undefined, slides: [] })
    }
    const latest = deckRef.current
    const { patch, added } = appendSlidesToDeck(latest, pages, plan)
    if (!added.length) return []

    historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
    historyRef.current.future = []
    deckRef.current = { ...latest, ...patch }
    updateDeck(patch)
    setSelectedSlideId(added[0].id)
    setSelectedElementId(null)
    return added
  }

  // Bấm/→ hiện phần tử kế tiếp của slide; hết hiệu ứng mới sang slide sau. Lùi: ẩn bớt, rồi về slide trước (đã hiện đủ).
  const goNext = () => {
    if (presentStep < slideSteps(slides[presentIndex]?.elements ?? [])) setPresentStep(presentStep + 1)
    else if (presentIndex < slides.length - 1) {
      setPresentIndex(presentIndex + 1)
      setPresentStep(0)
    }
  }
  const goPrev = () => {
    if (presentStep > 0) setPresentStep(presentStep - 1)
    else if (presentIndex > 0) {
      setPresentIndex(presentIndex - 1)
      setPresentStep(slideSteps(slides[presentIndex - 1]?.elements ?? []))
    }
  }

  useEffect(() => {
    if (presenting) setPresentStep(0)
  }, [presenting])

  // Chiếu toàn màn hình; Esc của trình duyệt thoát toàn màn hình thì thoát luôn trình chiếu.
  useEffect(() => {
    if (!presenting) return
    void document.documentElement.requestFullscreen?.().catch(() => {})
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      setPresentHover(null)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    }
  }, [presenting])

  // Trình chiếu: ←/→/Space/PageUp/PageDown, Esc thoát (iframe không có phím điều hướng riêng).
  useEffect(() => {
    if (!presenting) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresenting(false)
      else if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) goNext()
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /** Deck có nội dung thật (không phải một slide mặc định chưa đụng tới) → duyệt dàn ý phải hỏi ghi đè. */
  const hasContent = deck.slides.some((s) => s.html || s.layout || s.elements.length > 1)

  /** Người dùng chọn "Ghi đè": xoá hết slide cũ (hoàn tác được), slide mới sinh ra bắt đầu từ deck rỗng. */
  const clearSlides = () => {
    const next: Deck = { ...deck, format: undefined, slides: [] }
    commitDeck(next)
    deckRef.current = next
    setSelectedSlideId(null)
    setSelectedElementId(null)
  }

  /** AI sửa slide có sẵn bằng lệnh có cấu trúc; áp lên deck mới nhất, có lịch sử để hoàn tác. */
  const applyAiEdits = (ops: SlideEditOp[]): string[] => {
    const latest = deckRef.current
    const result = applyEdits(latest, ops)
    if (result.changed) {
      historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
      historyRef.current.future = []
      deckRef.current = result.deck
      updateDeck(result.deck)
    }
    return result.summary
  }

  /** Mô tả deck cho lệnh sửa: theme, phông, danh sách slide (số thứ tự bắt đầu từ 1). */
  const editContext =
    `bộ màu ${theme.id} (${theme.name}), phông tiêu đề ${theme.fonts.heading}, phông nội dung ${theme.fonts.body}; ` +
    '\n' + deck.slides.map(describeSlide).join('\n')

  /** Chế độ HTML: thay toàn bộ slide bằng các slide HTML (hoàn tác được bằng lịch sử). */
  const applyHtmlDeck = (htmls: string[]) => {
    const next: Slide[] = htmls.map((html) => ({ id: uid(), background: '#ffffff', elements: [], transition: 'none', html }))
    if (!next.length) return
    commitDeck({ ...deck, format: 'html', slides: next })
    setSelectedSlideId(next[0].id)
    setSelectedElementId(null)
  }

  /** Đường deck một lượt (dàn ý không parse được hoặc câu trả lời cũ). */
  const applyAiResult = (text: string, plan?: DeckPlan) => {
    const parsed = parseAiDeck(text)
    if (!parsed) return
    appendAiSlides(parsed.slides, plan)
  }

  /** Ghi ảnh AI vào slide theo deck mới nhất lúc ảnh về (slide có thể đã được sửa/xoá). */
  const setSlideImage = (slideId: string, image: string) => {
    const latest = deckRef.current
    const slide = latest.slides.find((s) => s.id === slideId)
    if (!slide) return
    historyRef.current.past = [...historyRef.current.past, latest].slice(-50)
    historyRef.current.future = []
    const slides = latest.slides.map((s) => (s.id === slideId ? withImage(s, normalizeTheme(latest.theme), image) : s))
    deckRef.current = { ...latest, slides }
    updateDeck({ slides })
  }

  /**
   * Đường 26b: mỗi trang xong được chèn NGAY (đúng thứ tự); ảnh AI mất 45–90 giây
   * nên sinh nền sau rồi thay vào — bìa và layout ảnh. Lỗi provider thì giữ
   * nguyên đồ hoạ/icon đang có.
   */
  const applyAiSlide = async (page: AiSlidePayload, plan: DeckPlan) => {
    const added = appendAiSlides([page], plan)
    const slide = added[0]
    if (!slide || page.image || !IMAGE_LAYOUTS.includes(page.layout ?? '')) return
    const palette = normalizeTheme(deckRef.current.theme).accent
    const isCover = page.layout === 'title'
    const bullets = page.bullets ?? page.steps ?? page.items ?? [page.subtitle ?? '']
    const orientation = isCover ? 'square' : page.layout === 'image-left' || page.layout === 'image-right' ? 'portrait' : 'landscape'
    const prompt = buildImagePrompt(page.title, bullets, orientation, palette)
    // Provider hay quá hạn/lỗi thoáng qua: thử lại một lần trong cùng lượt hàng đợi.
    void queueImage(() => generateSlideImage(prompt).catch(() => generateSlideImage(prompt)))
      .then((generated) => uploadImage(generated.dataUrl))
      .then((src) => setSlideImage(slide.id, src))
      .catch(() => {})
  }

  /* ---------------------------------------------------------------- *
   * Trình chiếu
   * ---------------------------------------------------------------- */
  if (presenting) {
    const slide = deck.slides[presentIndex]
    if (!slide) {
      setPresenting(false)
      return null
    }
    const canPrev = presentIndex > 0 || presentStep > 0
    const canNext = presentIndex < deck.slides.length - 1 || presentStep < slideSteps(slide.elements)
    const onMove = (e: React.MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window
      setPresentHover(e.clientY > h - 90 ? 'bar' : e.clientX < w * 0.12 ? 'left' : e.clientX > w * 0.88 ? 'right' : null)
    }
    const edge = (side: 'left' | 'right') => {
      const go = side === 'left' ? goPrev : goNext
      const enabled = side === 'left' ? canPrev : canNext
      const Icon = side === 'left' ? ChevronLeft : ChevronRight
      return (
        <div
          className={cn('absolute inset-y-0 z-10 flex w-[12%] items-center', side === 'left' ? 'left-0 justify-start pl-5' : 'right-0 justify-end pr-5')}
          style={{ cursor: enabled ? 'pointer' : 'default' }}
          onClick={(e) => {
            e.stopPropagation()
            go()
          }}
        >
          <span
            className="flex size-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all duration-200"
            style={{ opacity: presentHover === side && enabled ? 1 : 0, transform: presentHover === side && enabled ? 'scale(1)' : 'scale(0.85)' }}
          >
            <Icon className="size-6" />
          </span>
        </div>
      )
    }
    return (
      <div
        className="fixed inset-0 z-[100] select-none overflow-hidden bg-black touch-pan-y"
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return
          swipeRef.current = { x: e.clientX, y: e.clientY, didSwipe: false }
        }}
        onPointerUp={(e) => {
          if (e.pointerType === 'mouse' || !swipeRef.current) return
          const dx = e.clientX - swipeRef.current.x
          const dy = e.clientY - swipeRef.current.y
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            swipeRef.current.didSwipe = true
            if (dx < 0) goNext()
            else goPrev()
          }
        }}
        onClick={(e) => {
          if (swipeRef.current?.didSwipe) {
            swipeRef.current.didSwipe = false
            return
          }
          // Chạm vào phần dưới màn hình trên cảm ứng để bật/tắt thanh điều khiển
          if (e.clientY > window.innerHeight - 90) {
            setPresentHover((cur) => (cur === 'bar' ? null : 'bar'))
            return
          }
          goNext()
        }}
        onMouseMove={onMove}
        onMouseLeave={() => setPresentHover(null)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {/* vừa khít màn hình, giữ 16:9 */}
          <div
            key={slide.id}
            className={slide.transition && slide.transition !== 'none' ? `slide-enter-${slide.transition}` : undefined}
            style={{ width: 'min(100vw, calc(100vh * 16 / 9))' }}
          >
            {slide.html ? (
              <HtmlSlideFrame html={slide.html} interactive />
            ) : (
              <div
                className="slide-frame relative aspect-[16/9] w-full overflow-hidden"
                data-decor={theme.decor}
                style={{ ...slideBgStyle(slide), ...decorStyle(theme) }}
              >
                {readableElements(slide, theme).map((el) =>
                  el.step ? (
                    <RevealLayer key={el.id} el={el} shown={el.step <= presentStep}>
                      <SlideElView el={el} theme={theme} />
                    </RevealLayer>
                  ) : (
                    <SlideElView key={el.id} el={el} theme={theme} revealStep={presentStep} />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
        {edge('left')}
        {edge('right')}
        {/* thanh điều khiển trượt lên từ đáy, đè lên slide chứ không đẩy slide */}
        <div
          className="absolute inset-x-0 bottom-0 z-20 flex h-[68px] items-center justify-between px-10 text-white/85 backdrop-blur-md transition-transform duration-300 ease-out"
          style={{ background: 'rgba(52, 58, 70, 0.92)', transform: presentHover === 'bar' ? 'translateY(0)' : 'translateY(100%)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-5">
            <button type="button" aria-label="Slide trước" onClick={goPrev} disabled={!canPrev} className="rounded-md p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="size-6" />
            </button>
            <span className="tnum min-w-[4.5rem] text-center text-[17px] font-semibold text-white">
              {presentIndex + 1} / {deck.slides.length}
            </span>
            <button type="button" aria-label="Slide sau" onClick={goNext} disabled={!canNext} className="rounded-md p-1.5 transition-colors hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="size-6" />
            </button>
          </div>
          <button type="button" aria-label="Thoát trình chiếu" data-tip="Thoát trình chiếu" data-tip-kbd="Esc" onClick={() => setPresenting(false)} className="rounded-md p-1.5 transition-colors hover:bg-white/10">
            <Minimize2 className="size-6" />
          </button>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- *
   * Editor
   * ---------------------------------------------------------------- */
  return (
    // điện thoại: chừa chỗ cho thanh tab đáy (SlideSidePanel) để dải slide không bị che
    <div className="slide-editor flex min-h-0 min-w-0 flex-1 flex-col max-sm:pb-14">
      {printing && <PrintDeck slides={deck.slides} theme={theme} onDone={() => setPrinting(false)} />}
      {deck.format === 'html' ? (
        <HtmlDeckBar
          onSave={onSave}
          onPresent={() => { setPresentIndex(currentSlide ? deck.slides.indexOf(currentSlide) : 0); setPresenting(true) }}
        />
      ) : (
      <SlideRibbon
        deck={deck}
        slide={currentSlide}
        slideIndex={currentSlide ? deck.slides.indexOf(currentSlide) : 0}
        selected={selectedElement}
        activeTab={ribbonTab}
        onTabChange={setRibbonTab}
        onNewDeck={onNewDeck}
        onImportFile={onImportFile}
        onDownload={() => exportDeckPptx(deck)}
        onSave={onSave}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyRef.current.past.length > 0}
        canRedo={historyRef.current.future.length > 0}
        onAddSlide={addSlide}
        onDuplicateSlide={() => currentSlide && duplicateSlide(currentSlide.id)}
        onDeleteSlide={() => currentSlide && removeSlide(currentSlide.id)}
        onInsert={(el) => { addElement(el); setSelectedElementId(el.id) }}
        onUpdateSelected={onUpdateSelected}
        onDeleteSelected={() => selectedElement && removeElement(currentSlide?.id ?? '', selectedElement.id)}
        onCopySelected={() => selectedElement && setClipboardElement({ ...selectedElement, id: uid() })}
        onCutSelected={() => { if (!selectedElement || !currentSlide) return; setClipboardElement({ ...selectedElement, id: uid() }); removeElement(currentSlide.id, selectedElement.id) }}
        onPaste={() => clipboardElement && addElement({ ...clipboardElement, id: uid() })}
        canPaste={Boolean(clipboardElement)}
        onArrange={arrangeSelected}
        onAlign={alignSelected}
        onFlip={flipSelected}
        onTheme={applyTheme}
        onApplyLayout={applyLayout}
        onTone={applyTone}
        onTransition={(transition, allSlides) => {
          if (allSlides) commitDeck({ ...deck, slides: deck.slides.map((s) => ({ ...s, transition })) })
          else if (currentSlide) patchSlide(currentSlide.id, { transition })
        }}
        onBackground={(background, allSlides, image) =>
          commitDeck({
            ...deck,
            slides: deck.slides.map((s) =>
              s.html || (!allSlides && s.id !== currentSlide?.id)
                ? s
                : background
                  ? withBackground({ ...s, bgImage: image }, background, deck.theme.fg)
                  : recomposeSlide(deck.theme, { ...s, customBg: undefined, bgImage: undefined }),
            ),
          })
        }
        onAnimate={(mode, allSlides) =>
          commitDeck({
            ...deck,
            slides: deck.slides.map((s) =>
              s.html || (!allSlides && s.id !== currentSlide?.id)
                ? s
                : { ...s, elements: mode === 'auto' ? autoAnimate(s.elements, s.layout ?? 'bullets') : clearAnimation(s.elements) },
            ),
          })
        }
        onPresent={() => { setPresentIndex(currentSlide ? deck.slides.indexOf(currentSlide) : 0); setPresenting(true) }}
        onPresentFromStart={() => { setPresentIndex(0); setPresenting(true) }}
        onExportPdf={() => setPrinting(true)}
        formatPaneOpen={formatPaneOpen}
        onToggleFormatPane={() => setFormatPaneOpen((v) => !v)}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((v) => !v)}
        zoom={zoom}
        onZoom={setZoom}
      />
      )}
      <div className="flex min-h-0 min-w-0 flex-1">
      {/* ---------------- thư viện (cột trái, kiểu Canva): panel trượt đẩy sân giấy ---------------- */}
      <SlideSidePanel
        theme={theme}
        accent={theme.accent}
        canInsert={Boolean(currentSlide) && !currentSlide?.html}
        hint={`${deck.title} ${(currentSlide?.elements ?? []).map((e) => e.text ?? '').join(' ').replace(/<[^>]+>/g, ' ')}`}
        onAddLayoutSlide={addLayoutFromPanel}
        activeDesignId={deck.design}
        designDisabled={deck.format === 'html'}
        onApplyDesign={applyDesignFromPanel}
        onInsert={insertFromPanel}
        onOpenAi={() => setAiOpen(true)}
      />

      {/* ---------------- sân soạn (giữa) ---------------- */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* canvas */}
        <div className="slide-stage group relative min-h-0 anim-tab-in" key={deck.id}>
          {formatPaneOpen && selectedElement && currentSlide && (
            <aside className="slide-format-pane" aria-label="Bảng chọn định dạng">
              <div className="slide-format-pane__title">Định dạng</div>
              {(['x', 'y', 'w', 'h'] as const).map((key) => (
                <label key={key} className="slide-format-pane__row">
                  <span>{{ x: 'X', y: 'Y', w: 'Rộng', h: 'Cao' }[key]}</span>
                  <input
                    type="number"
                    value={Math.round(key === 'h' ? elementHeight(selectedElement) : selectedElement[key])}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      updateElement(
                        currentSlide.id,
                        selectedElement.id,
                        key === 'h' && selectedElement.type === 'text'
                          ? { h: value, fixedHeight: true }
                          : { [key]: value },
                      )
                    }}
                  />
                  <em>%</em>
                </label>
              ))}
              {selectedElement.type === 'text' && (
                <PaneColor label="Màu" value={selectedElement.textColor ?? theme.fg} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { textColor: c })} />
              )}
              {selectedElement.type === 'graphic' && (
                <>
                  <PaneColor label="Nét" value={selectedElement.textColor ?? theme.fg} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { textColor: c })} />
                  <PaneColor label="Chủ đạo" value={selectedElement.fill ?? graphicMainColor(selectedElement.graphicId)} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { fill: c })} />
                </>
              )}
              {selectedElement.type === 'icon' && (
                <PaneColor label="Màu" value={selectedElement.textColor ?? theme.accent} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { textColor: c })} />
              )}
              {(selectedElement.type === 'shape' || selectedElement.type === 'graphic' || selectedElement.type === 'icon') && (
                <label className="slide-format-pane__row">
                  <span>Trong suốt</span>
                  <input
                    type="range"
                    min={0}
                    max={90}
                    step={5}
                    value={100 - Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) => updateElement(currentSlide.id, selectedElement.id, { opacity: 1 - Number(e.target.value) / 100 })}
                  />
                  <em>{100 - Math.round((selectedElement.opacity ?? 1) * 100)}%</em>
                </label>
              )}
              {selectedElement.type === 'shape' && (
                <PaneColor label="Tô" value={selectedElement.fill ?? theme.accent} themeColors={[theme.accent, theme.fg]} onPick={(c) => updateElement(currentSlide.id, selectedElement.id, { fill: c })} />
              )}
              <button type="button" className="slide-format-pane__close" onClick={() => setFormatPaneOpen(false)}>Đóng</button>
            </aside>
          )}
          {/* zoom đặt ở lớp bọc, không đặt lên chính `.slide-frame`: frame là
              container query của `cqw`, giữ nó ở bề rộng layout thật để chữ chỉ
              bị phóng đúng một lần. */}
          <div className="slide-stage__inner" style={{ zoom: zoom / 100 }}>
            {currentSlide?.html ? (
              <HtmlSlideFrame html={currentSlide.html} interactive className="shadow-[0_2px_24px_-8px_rgba(35,32,28,0.35)]" />
            ) : currentSlide ? (
              <div
                className="slide-frame relative aspect-[16/9] w-full overflow-hidden bg-white shadow-[0_2px_24px_-8px_rgba(35,32,28,0.35)]"
                data-decor={theme.decor}
                style={{ ...slideBgStyle(currentSlide), ...decorStyle(theme) }}
                onClickCapture={(e) => {
                  // Kéo xoay/resize có thể nhả chuột ngoài phần tử; đừng để cú
                  // click rơi vào nền xoá mất vùng chọn vừa thao tác.
                  if (!didDragRef.current) return
                  e.stopPropagation()
                  didDragRef.current = false
                }}
                onClick={() => {
                  setSelectedElementId(null)
                  setGroupIds([])
                }}
              >
                <SnapGuides />
                {readableElements(currentSlide, theme).map((el) => (
                  <EditableEl
                    key={el.id}
                    el={el}
                    theme={theme}
                    selected={selectedElementId === el.id}
                    onSelect={() => setSelectedElementId(el.id)}
                    grouped={groupIds.includes(el.id)}
                    group={groupIds.includes(el.id) ? groupEls.filter((g) => g.id !== el.id).map((g) => ({ id: g.id, x: g.x, y: g.y })) : []}
                    onToggleSelect={() => toggleInGroup(el.id)}
                    onPreviewMany={(patches) => previewMany(currentSlide.id, patches)}
                    onDragEnd={() => {
                      didDragRef.current = true
                      window.setTimeout(() => {
                        didDragRef.current = false
                      }, 0)
                    }}
                    onBeginHistory={beginHistory}
                    onPreview={(patch) => previewElement(currentSlide.id, el.id, patch)}
                    onChange={(patch) => updateElement(currentSlide.id, el.id, patch)}
                    onGenerateImage={() => generateImageFor(currentSlide.id, el.id)}
                    onDropInFrame={(frameId, src) => {
                      // một lần ghi (khung nhận ảnh + bỏ ảnh kéo), dựa trên deck mới nhất
                      const latest = deckRef.current
                      commitDeck({
                        ...latest,
                        slides: latest.slides.map((s) =>
                          s.id === currentSlide.id
                            ? { ...s, elements: s.elements.flatMap((e) => (e.id === el.id ? [] : e.id === frameId ? [{ ...e, src }] : [e])) }
                            : s,
                        ),
                      })
                      setSelectedElementId(frameId)
                    }}
                    editingText={editingShapeId === el.id}
                    onEditingText={(on) => setEditingShapeId(on ? el.id : null)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<MonitorPlay className="size-7" strokeWidth={1.4} />}
                title="Chưa có slide nào"
                description="Nhấn dấu + ở thanh slide phía dưới để bắt đầu."
              />
            )}
            {groupEls.length >= 2 && currentSlide && !currentSlide.html && (
              <GroupToolbar els={groupEls} onAlign={alignGroup} onDelete={removeGroup} />
            )}
            {selectedElement && currentSlide && !currentSlide.html && (
              <SelectionToolbar
                key={selectedElement.id}
                el={selectedElement}
                onAskAi={async (instruction) => {
                  const patch = await rewriteElement(
                    selectedElement,
                    instruction,
                    currentSlide.elements.find((e) => e.id === 'title')?.text ?? '',
                  )
                  updateElement(currentSlide.id, selectedElement.id, patch)
                }}
                height={elementHeight(selectedElement)}
                accent={theme.accent}
                fg={theme.fg}
                onUpdate={(patch) => updateElement(currentSlide.id, selectedElement.id, patch)}
                onEditText={() => setEditingShapeId(selectedElement.id)}
                onAskChat={() => {
                  const el = selectedElement
                  const idx = deck.slides.findIndex((s) => s.id === currentSlide.id) + 1
                  const text = 'text' in el && typeof el.text === 'string' ? el.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
                  const kind = ({ text: 'Hộp chữ', shape: 'Hình khối', image: 'Ảnh', icon: 'Icon', graphic: 'Đồ hoạ', table: 'Bảng', chart: 'Biểu đồ' } as Record<string, string>)[el.type] ?? 'Phần tử'
                  attachToAi('slide', [{
                    id: `${currentSlide.id}-${el.id}`,
                    label: `${kind}${text ? ` “${text.slice(0, 18)}${text.length > 18 ? '…' : ''}”` : ''} · slide ${idx}`,
                    detail: `${kind} (id ${el.id}) trên slide ${idx}, vị trí x=${Math.round(el.x)}% y=${Math.round(el.y)}% rộng ${Math.round(el.w)}% cao ${Math.round(el.h)}%${text ? `, nội dung: "${text.slice(0, 1500)}"` : ''}`,
                  }])
                  setAiOpen(true)
                }}
                onDelete={() => removeElement(currentSlide.id, selectedElement.id)}
                onArrange={arrangeSelected}
                elements={currentSlide.elements}
                onSelectLayer={setSelectedElementId}
                onDuplicate={() => {
                  const copy = { ...selectedElement, id: uid(), x: selectedElement.x + 3, y: selectedElement.y + 3 }
                  addElement(copy)
                  setSelectedElementId(copy.id)
                }}
              />
            )}
          </div>
          {/* ghi chú diễn giả: nút nhỏ ở góc dưới, hiện khi di chuột vào slide. AI viết vào đây (lệnh set_notes)
              và PPTX xuất ra phần ghi chú. Lưu khi rời ô để không sinh một bước hoàn tác mỗi ký tự. */}
          {currentSlide && !currentSlide.html && (
            <div className="absolute bottom-3 left-3 z-20">
              {notesOpen && (
                <textarea
                  key={currentSlide.id}
                  className="slide-notes mb-2 block h-28 w-[320px] resize-none rounded-lg border border-line bg-white p-2.5 text-[13px] shadow-lg outline-none focus:border-clay"
                  placeholder="Nhấp để thêm ghi chú diễn giả"
                  aria-label="Ghi chú diễn giả"
                  defaultValue={currentSlide.notes ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (currentSlide.notes ?? '')) patchSlide(currentSlide.id, { notes: e.target.value })
                  }}
                />
              )}
              <button
                type="button"
                aria-pressed={notesOpen}
                onClick={() => setNotesOpen((v) => !v)}
                className={cn(
                  'rounded-full bg-white/90 px-3 py-1 text-[12px] font-medium text-ink-2 shadow transition-opacity hover:text-clay focus-visible:opacity-100 group-hover:opacity-100',
                  notesOpen ? 'opacity-100' : 'opacity-0',
                )}
              >
                Ghi chú{currentSlide.notes ? ' ·' : ''}
              </button>
            </div>
          )}
        </div>
        {/* thanh slide dưới đáy: thumbnail ngang, dấu + cuối dãy và giữa hai slide, kéo để đổi thứ tự */}
        <SlideStrip
          slides={deck.slides}
          currentId={currentSlide?.id ?? null}
          allowAdd={deck.format !== 'html'}
          pendingCount={pendingCount}
          renderThumb={(s) => <SlideThumb slide={s} theme={theme} />}
          onSelect={(id) => { setSelectedSlideId(id); setSelectedElementId(null) }}
          onAddAt={addSlideAt}
          onDuplicate={duplicateSlide}
          onRemove={removeSlide}
          onMove={moveSlide}
        />
      </div>

      {/* ---------------- AI panel (phải) — trợ lý AI nằm ở cột phải --------- */}
      <AiDock open={aiOpen} onToggle={() => setAiOpen((v) => !v)} width={360} side="right">
        <AiPanel
          mode="slide"
          attachKey="slide"
          onApplySlides={applyAiResult}
          onAppendSlide={applyAiSlide}
          onApplyHtmlDeck={applyHtmlDeck}
          existingSlideCount={hasContent ? deck.slides.length : 0}
          onClearSlides={clearSlides}
          editContext={editContext}
          onApplyEdits={applyAiEdits}
          onPendingSlides={setPendingSlides}
          contextSummary={`bài giảng "${deck.title}", ${deck.slides.length} slide`}
        />
      </AiDock>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Element views
 * ------------------------------------------------------------------ */
/**
 * Thumbnail một slide — dùng trong cột thumbnail của editor và bảng "Gần đây"
 * ở tab Bắt đầu.
 */
export { SlideThumb } from './slideRender'
