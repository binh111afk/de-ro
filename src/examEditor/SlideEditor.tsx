/**
 * Trình soạn bài giảng trình chiếu (slide).
 *
 * Nằm trong tab slide của trình soạn chung (`/soan-de`) cùng hệ tab + AI panel;
 * mọi tài liệu được lưu về Home qua store khi đóng tab hoặc rời trang.
 *
 * Model dữ liệu (`Deck` / `Slide` / `SlideElement`) nằm ở `store/docs.ts`.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ColorPalette } from './ColorPalette'
import { SelectionToolbar } from './SelectionToolbar'
import { SlideSidePanel } from './SlideSidePanel'
import { SlideStrip } from './SlideStrip'
import { rewriteElement } from '@/lib/slideRewrite'
import { keepCustomBg, slideBgStyle, withBackground } from '@/lib/slideBackground'
import { shapeClipOf } from '@/lib/slideShapes'
import { isPresetShape, isStrokeOnlyShape, presetPaths, prstOf } from '@/lib/slidePresets'
import { ChevronLeft, ChevronRight, Minimize2, MonitorPlay, RotateCw } from 'lucide-react'
import { slideIconById } from '@/lib/slideIconLibrary'
import { graphicById, graphicMainColor, graphicMarkup } from '@/lib/slideGraphics'
import { hasRich } from '@/lib/slideMath'
import { renderMath } from '@/lib/math'
import { autoAnimate, clearAnimation, slideSteps } from '@/lib/slideAnim'

/** Trạng thái ẩn/hiện của hiệu ứng bấm-chuột: mờ dần + trượt/phóng nhẹ (translate/scale tách khỏi transform xoay của phần tử). */
const HIDDEN_POSE = { fade: {}, rise: { translate: '0 2.4cqw' }, zoom: { scale: '0.8' } } as const
const revealStyle = (shown: boolean, anim: SlideElement['anim'] = 'fade'): React.CSSProperties => ({
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
const slideMathHtml = (text: string): string =>
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

function MathCell({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  if (hasRich(value) && !editing) {
    return (
      <span
        title="Nhấp đúp để sửa công thức"
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
import { EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Deck, DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import { parseAiDeck, type AiSlidePayload, type DeckPlan } from '@/lib/aiDeck'
import { exportDeckPptx } from '@/lib/exportDeck'
import { HtmlDeckBar, HtmlSlideFrame } from './HtmlSlide'
import { applyEdits, describeSlide, recomposeSlide, type SlideEditOp } from '@/lib/slideEdit'
import { elementHeight } from '@/lib/slideText'
import { normalizeTheme, readableTextOn, type ResolvedTheme } from '@/lib/slideTheme'
import { appendSlidesToDeck, withImage } from '@/lib/slideAi'
import { IMAGE_LAYOUTS, buildImagePrompt, generateSlideImage, queueImage } from '@/lib/imageGen'
import { uploadImage } from '@/lib/mediaStore'
import {
  SLIDE_LAYOUTS,
  composeLayout,
  contentFromSlide,
  defaultTone,
  isLayoutId,
  toneBackground,
  withPlaceholders,
  type SlideLayoutId,
} from '@/lib/slideLayouts'
import { AiPanel } from './AiPanel'
import { AiDock } from './Layout'
import { SlideRibbon, type SlideRibbonTab } from './SlideRibbon'

const uid = () => Math.random().toString(36).slice(2, 10)
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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
              {slide.elements.map((el) => (
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

const decorStyle = (theme: ResolvedTheme): React.CSSProperties =>
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
  const [aiOpen, setAiOpen] = useState(true)
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
    const elements = composeLayout(deck.theme, layoutId, withPlaceholders(layoutId, {}), tone)
    const s: Slide = {
      id: uid(),
      layout: layoutId,
      tone,
      background: toneBackground(deck.theme, tone),
      elements,
      transition: 'none',
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

  // Panel thư viện được memo để kéo phần tử (cập nhật deck mỗi lần di chuột) không vẽ lại hàng trăm đồ hoạ;
  // handler đi qua ref để callback ổn định mà vẫn luôn gọi bản mới nhất (không giữ deck cũ).
  const panelHandlers = useRef({ insert: (_el: SlideElement) => {}, addLayout: (_id: SlideLayoutId) => {} })
  panelHandlers.current = {
    insert: (el) => { addElement(el); setSelectedElementId(el.id) },
    addLayout: addLayoutSlide,
  }
  const insertFromPanel = useCallback((el: SlideElement) => panelHandlers.current.insert(el), [])
  const addLayoutFromPanel = useCallback((id: SlideLayoutId) => panelHandlers.current.addLayout(id), [])

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
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement && currentSlide && !typing) {
        e.preventDefault()
        removeElement(currentSlide.id, selectedElement.id)
        return
      }
      if (e.key === 'Escape') setSelectedElementId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedElement, currentSlide, undo, redo])

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
  const applyLayout = (layoutId: SlideLayoutId) => {
    if (!currentSlide) return
    const name = SLIDE_LAYOUTS.find((layout) => layout.id === layoutId)?.name ?? layoutId
    if (!window.confirm(`Áp bố cục "${name}"? Nội dung hiện tại của slide sẽ được thay.`)) return
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
        className="fixed inset-0 z-[100] select-none overflow-hidden bg-black"
        onClick={goNext}
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
                {slide.elements.map((el) =>
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
          <button type="button" aria-label="Thoát trình chiếu" title="Thoát trình chiếu (Esc)" onClick={() => setPresenting(false)} className="rounded-md p-1.5 transition-colors hover:bg-white/10">
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
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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
        accent={theme.accent}
        canInsert={Boolean(currentSlide) && !currentSlide?.html}
        hint={`${deck.title} ${(currentSlide?.elements ?? []).map((e) => e.text ?? '').join(' ').replace(/<[^>]+>/g, ' ')}`}
        onAddLayoutSlide={addLayoutFromPanel}
        onInsert={insertFromPanel}
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
                onClick={() => setSelectedElementId(null)}
              >
                {currentSlide.elements.map((el) => (
                  <EditableEl
                    key={el.id}
                    el={el}
                    theme={theme}
                    selected={selectedElementId === el.id}
                    onSelect={() => setSelectedElementId(el.id)}
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
export function SlideThumb({ slide, theme }: { slide: Slide; theme: ResolvedTheme }) {
  if (slide.html) return <HtmlSlideFrame html={slide.html} />
  return (
    <div
      className="slide-frame relative aspect-[16/9] w-full overflow-hidden"
      data-decor={theme.decor}
      style={{ ...slideBgStyle(slide), ...decorStyle(theme) }}
    >
      {slide.elements.map((el) => (
        <SlideElView key={el.id} el={el} theme={theme} />
      ))}
    </div>
  )
}

/**
 * Khối chữ trong slide ở chế độ xem: tự co cỡ chữ cho tới khi nội dung
 * vừa khung, nên nội dung dài (AI sinh nhiều ý) không bị cắt.
 */
/**
 * Fit lại chữ khi webfont load xong. Font swap đổi bề rộng ký tự → số dòng đổi,
 * nhưng kích thước hộp không đổi nên ResizeObserver không bắt được. Thiếu bước
 * này, lần fit đầu (font fallback) tưởng vừa nhưng hiển thị thật lại tràn 1–2px.
 */
function refitOnFonts(fit: () => void): () => void {
  let alive = true
  const run = () => {
    if (alive) fit()
  }
  document.fonts?.ready.then(run).catch(() => {})
  document.fonts?.addEventListener('loadingdone', run)
  return () => {
    alive = false
    document.fonts?.removeEventListener('loadingdone', run)
  }
}

function FitText({
  children,
  html,
  baseSize,
  style,
}: {
  children: React.ReactNode
  /** HTML đã vẽ công thức (KaTeX) — có thì dùng thay cho `children` */
  html?: string
  /** cỡ chữ tối đa, tính bằng cqw */
  baseSize: number
  style: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(baseSize)

  useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const min = baseSize * 0.6
    const fit = () => {
      let s = baseSize
      const fits = (px: number) => {
        el.style.fontSize = `${px}cqw`
        return el.scrollHeight <= el.clientHeight + 1
      }
      if (!fits(s)) while (s > min && !fits(s)) s -= 0.1
      // giữ 2 chữ số: compose-time đã fit tới 0,01cqw, làm tròn lên 0,1 sẽ
      // biến 2,45 thành 2,5 và gây tràn đúng ở biên
      const final = Math.floor(s * 100) / 100
      setSize(final)
      el.style.fontSize = `${final}cqw`
    }
    fit()
    // hộp đổi kích thước (kéo tay nắm) cũng phải fit lại, không chỉ khi đổi chữ
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    const stopFonts = refitOnFonts(fit)
    return () => {
      stopFonts()
      ro.disconnect()
    }
  }, [children, html, baseSize])

  const box: React.CSSProperties = {
    ...style,
    fontSize: `${size}cqw`,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
  }
  // Công thức nằm trong MỘT khối con: hộp chữ canh giữa dùng flex-column, nếu để
  // chữ và `.katex` làm con trực tiếp thì mỗi phần thành một hàng riêng ("Vậy" / phân số).
  return html !== undefined ? (
    <div ref={ref} style={box}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  ) : (
    <div ref={ref} style={box}>
      {children}
    </div>
  )
}

/** transform của phần tử: xoay quanh tâm rồi lật (giữ nguyên thứ tự trong CSS). */
function elTransform(el: SlideElement): string | undefined {
  const t = [
    el.rotation ? `rotate(${el.rotation}deg)` : '',
    el.flipX ? 'scaleX(-1)' : '',
    el.flipY ? 'scaleY(-1)' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return t || undefined
}

/** font của theme đã là CSS stack đầy đủ, font người dùng chọn chỉ là tên */
function fontStack(font: string): string {
  return font.includes(',') ? font : `${font}, sans-serif`
}

/** Đường nối cong (connector): S-curve tiếp tuyến ngang trong hộp phần tử; lật dọc bằng `flipY`. */
function ConnectorSvg({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <path
        d="M0,0 C50,0 50,100 100,100"
        fill="none"
        stroke={el.borderColor ?? theme.accent}
        strokeWidth={el.border ?? 3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * CSS của hình khối (nền, bo góc, viền, bóng, đường cắt, độ đục) — dùng chung cho bản xem và bản chỉnh sửa.
 * Hình bị cắt (sao, tim, tam giác…) cắt luôn cả viền CSS, nên viền của chúng vẽ bằng lớp trong thu vào (`shapeInner`).
 */
function shapeCss(el: SlideElement, theme: ResolvedTheme): React.CSSProperties {
  // hình dựng sẵn vẽ bằng SVG (PresetSvg): chỉ cần độ đục và bóng (drop-shadow theo đúng đường viền hình)
  if (isPresetShape(el.shape)) return { opacity: el.opacity, filter: SHADOW_FILTERS[shadowLevelOf(el, theme)] }
  const isLine = el.shape === 'line'
  const border = isLine ? 0 : (el.border ?? theme.border)
  const clip = shapeClipOf(el)
  const borderColor = el.borderColor ?? theme.borderColor
  return {
    background: clip && border ? borderColor : (el.fill ?? theme.accent),
    borderRadius: el.shape === 'ellipse' ? '50%' : el.shape === 'round' ? `${el.radius ?? theme.radius}px` : 0,
    clipPath: clip,
    boxShadow: isLine ? undefined : shadowCss(el, theme),
    border: !clip && border ? `${border}px ${el.borderStyle ?? 'solid'} ${borderColor}` : undefined,
    opacity: el.opacity,
  }
}

/** Bóng đổ theo mức (0 không, 1 nhẹ, 2 vừa, 3 đậm); chưa chọn mức thì theo `shadow` và bộ màu như trước. */
const SHADOWS = [
  undefined,
  '0 0.3cqw 0.9cqw -0.2cqw rgb(15 23 42 / 0.25)',
  '0 0.8cqw 2.4cqw -0.6cqw rgb(15 23 42 / 0.28)',
  '0 1.2cqw 3.6cqw -0.5cqw rgb(15 23 42 / 0.42)',
]
const SHADOW_FILTERS = [
  undefined,
  'drop-shadow(0 0.3cqw 0.5cqw rgb(15 23 42 / 0.3))',
  'drop-shadow(0 0.7cqw 1.1cqw rgb(15 23 42 / 0.32))',
  'drop-shadow(0 1.1cqw 1.8cqw rgb(15 23 42 / 0.45))',
]
const shadowLevelOf = (el: SlideElement, theme: ResolvedTheme): 0 | 1 | 2 | 3 =>
  el.shadowLevel ?? (el.shadow === true || (el.shadow !== false && theme.shadow !== 'none') ? 2 : 0)

function shadowCss(el: SlideElement, theme: ResolvedTheme): string | undefined {
  if (el.shadowLevel !== undefined) return SHADOWS[el.shadowLevel]
  if (el.shadow === false || (el.shadow !== true && theme.shadow === 'none')) return undefined
  return theme.shadow === 'hard' ? '6px 6px 0 rgb(17 24 39 / 0.92)' : SHADOWS[2]
}

/** mẫu nét đứt/chấm theo độ dày viền (đơn vị px của SVG) */
const dashOf = (style: SlideElement['borderStyle'], width: number): string | undefined =>
  style === 'dashed' ? `${width * 3} ${width * 2}` : style === 'dotted' ? `0 ${width * 2}` : undefined

/** Hình dựng sẵn (OOXML prst) vẽ bằng SVG: nền, nét, và phần chỉ có nét/chỉ có nền của từng hình. */
function PresetSvg({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
  const { W, H, both, fillOnly, strokeOnly } = presetPaths(prstOf(el.shape), el.w, el.h)
  const fill = el.fill ?? theme.accent
  const border = el.border ?? theme.border ?? 0
  const outline = border ? el.borderColor ?? theme.borderColor : 'none'
  const common = { vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', display: 'block' }}>
      {both && <path d={both} fill={isStrokeOnlyShape(el.shape) ? 'none' : fill} stroke={outline} strokeWidth={border} strokeDasharray={dashOf(el.borderStyle, border)} {...common} />}
      {fillOnly && <path d={fillOnly} fill={fill} stroke="none" />}
      {strokeOnly && (
        // nét của đường nối/cung: dùng màu tô làm màu nét nếu hình không có nền
        <path d={strokeOnly} fill="none" stroke={both || fillOnly ? outline : fill} strokeWidth={both || fillOnly ? border || 2 : Math.max(border, 3)} {...common} />
      )}
    </svg>
  )
}

/** Phần ruột của hình bị cắt có viền: thu vào `border`px để lộ viền ở ngoài. */
function shapeInner(el: SlideElement, theme: ResolvedTheme): React.ReactNode {
  if (isPresetShape(el.shape)) return <PresetSvg el={el} theme={theme} />
  const border = el.shape === 'line' ? 0 : (el.border ?? theme.border)
  const clip = shapeClipOf(el)
  if (!clip || !border) return null
  return <div style={{ position: 'absolute', inset: border, background: el.fill ?? theme.accent, clipPath: clip }} />
}

/** Chữ nằm trong hình khối (căn giữa, tự co cho vừa); màu mặc định đọc được trên màu tô. */
function ShapeText({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
  if (!el.text?.trim() || el.shape === 'line') return null
  return (
    <FitText
      html={hasRich(el.text) ? slideMathHtml(el.text) : undefined}
      baseSize={el.fontSize ?? 2.4}
      style={{
        position: 'absolute',
        inset: '10% 12%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: el.align ?? 'center',
        color: el.textColor ?? readableTextOn(el.fill ?? theme.accent),
        fontFamily: fontStack(el.fontFamily ?? theme.fonts.body),
        fontWeight: el.fontWeight ?? 600,
        fontStyle: el.fontStyle,
        lineHeight: 1.25,
      }}
    >
      {el.text}
    </FitText>
  )
}

function SlideElView({ el, theme, revealStep }: { el: SlideElement; theme: ResolvedTheme; revealStep?: number }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex,
    transform: elTransform(el),
  }
  const isBody = el.variant === 'body'

  if (el.type === 'text') {
    const size = el.fontSize ?? (isBody ? 2.4 : 3.6)
    // trình chiếu: mỗi dòng là một khối riêng để hiện lần lượt (bố cục không đổi vì chỉ đổi opacity/translate)
    const lines = el.lineStep && revealStep !== undefined ? (el.text ?? '').split('\n') : null
    return (
      <FitText
        // công thức `$...$` vẽ bằng KaTeX (HTML do KaTeX sinh, không phải input thô)
        html={!lines && hasRich(el.text) ? slideMathHtml(el.text ?? '') : undefined}
        style={{
          ...style,
          color: el.textColor ?? theme.fg,
          background: el.fill,
          borderRadius: el.fill ? '0.6cqw' : undefined,
          fontFamily: fontStack(el.fontFamily ?? (isBody ? theme.fonts.body : theme.fonts.heading)),
          fontWeight: el.fontWeight ?? (isBody ? 500 : 600),
          fontStyle: el.fontStyle,
          textDecoration: el.textDecoration,
          textAlign: el.align,
          lineHeight: el.lineHeight ?? 1.25,
          letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
          // ô có nền canh giữa dọc: chữ nằm giữa khung thay vì dồn về phía trên
          padding: el.fill ? '1.5% 3%' : '1%',
          ...(el.fill || el.valign === 'middle'
            ? { display: 'flex', flexDirection: 'column', justifyContent: 'center' }
            : {}),
        }}
        baseSize={size}
      >
        {lines
          ? lines.map((line, i) => (
              <div key={i} style={revealStyle((el.lineStep ?? 0) + i <= (revealStep ?? 0), el.anim)}>
                {hasRich(line) ? <span dangerouslySetInnerHTML={{ __html: slideMathHtml(line) }} /> : line || ' '}
              </div>
            ))
          : el.text}
      </FitText>
    )
  }

  if (el.type === 'icon') {
    const Icon = slideIconById(el.assetId)
    return Icon ? <Icon size="100%" weight="duotone" style={{ ...style, opacity: el.opacity, padding: '1%', color: el.textColor ?? theme.accent }} /> : null
  }

  if (el.type === 'connector') {
    return (
      <div style={style}>
        <ConnectorSvg el={el} theme={theme} />
      </div>
    )
  }

  if (el.type === 'graphic') {
    if (!el.graphicId || !graphicById(el.graphicId)) return null
    return (
      <div
        style={{ ...style, opacity: el.opacity, padding: graphicById(el.graphicId)?.category === 'ornament' ? 0 : '1%' }}
        // SVG do chính app sinh ra từ file thiết kế (không phải dữ liệu người
        // dùng nhập) nên nhúng trực tiếp là an toàn.
        dangerouslySetInnerHTML={{ __html: graphicMarkup(el.graphicId, el.textColor ?? theme.fg, el.fill) }}
      />
    )
  }

  if (el.type === 'shape')
    return (
      <div style={{ ...style, ...shapeCss(el, theme) }}>
        {shapeInner(el, theme)}
        <ShapeText el={el} theme={theme} />
      </div>
    )

  if (el.type === 'image')
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // khung chờ ảnh ở bản xem là panel theme (nét đứt chỉ có ở bản chỉnh sửa)
          background: el.src ? undefined : `linear-gradient(135deg, ${theme.surface} 0 48%, ${theme.accent}22 48% 54%, ${theme.surface} 54% 100%)`,
          border: el.src ? undefined : `1px solid ${theme.accent}66`,
          borderRadius: el.shape === 'ellipse' ? '50%' : '1cqw',
          overflow: 'hidden',
          color: el.src ? theme.muted : theme.accent,
          fontSize: '1.9cqw',
          fontFamily: fontStack(theme.fonts.body),
          letterSpacing: '0.04em',
          fontWeight: el.src ? 400 : 600,
        }}
      >
        {el.src ? (
          <img
            src={el.src}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          'Ảnh minh hoạ'
        )}
      </div>
    )

  if (el.type === 'table') {
    const headerFg = readableTextOn(theme.accent)
    const rowCount = el.rows?.length ?? 0
    return (
      <table
        style={{
          ...style,
          borderCollapse: 'separate',
          borderSpacing: 0,
          border: `1px solid ${theme.muted}`,
          borderRadius: '0.8cqw',
          overflow: 'hidden',
          fontSize: '1.7cqw',
          color: theme.fg,
        }}
      >
        <tbody>
          {(el.rows ?? []).map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    borderBottom:
                      ri < rowCount - 1 ? `1px solid ${theme.muted}` : undefined,
                    borderRight: ci < r.length - 1 ? `1px solid ${theme.muted}` : undefined,
                    padding: '0.5em 0.7em',
                    background:
                      ri === 0 ? theme.accent : ri % 2 === 0 ? theme.surface : 'transparent',
                    color: ri === 0 ? headerFg : theme.fg,
                    fontWeight: ri === 0 ? 600 : 400,
                  }}
                >
                  {hasRich(c) ? <span dangerouslySetInnerHTML={{ __html: slideMathHtml(c) }} /> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (el.type === 'chart')
    return <ChartView el={el} colors={theme.chart} />

  return null
}

/**
 * `absolute` = true: tự neo theo % của khung slide (dùng trong thumbnail).
 * false: lấp đầy khung bao ngoài đã neo sẵn (dùng trong canvas soạn) — nếu
 * vẫn neo tuyệt đối lần nữa, toạ độ bị nhân đôi và biểu đồ lệch khỏi thumbnail.
 */
function ChartView({
  el,
  absolute = true,
  colors = ['#2563eb'],
}: {
  el: SlideElement
  absolute?: boolean
  /** bảng màu của theme; thiếu thì dùng xanh mặc định */
  colors?: string[]
}) {
  const palette = colors.length > 0 ? colors : ['#2563eb']
  const data = el.chart?.data ?? []
  const max = Math.max(1, ...data.map((d) => d.value))
  const type = el.chart?.type ?? 'bar'
  const pos: React.CSSProperties = absolute
    ? {
        position: 'absolute',
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h}%`,
      }
    : { width: '100%', height: '100%' }

  if (type === 'pie') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    let acc = 0
    return (
      <div style={pos}>
        <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%' }}>
          {data.map((d, i) => {
            const start = (acc / total) * 360
            acc += d.value
            const end = (acc / total) * 360
            const r = 15.915
            const rad = (a: number) => ((a - 90) * Math.PI) / 180
            const x1 = 21 + r * Math.cos(rad(start))
            const y1 = 21 + r * Math.sin(rad(start))
            const x2 = 21 + r * Math.cos(rad(end))
            const y2 = 21 + r * Math.sin(rad(end))
            const large = end - start > 180 ? 1 : 0
            return (
              <path
                key={d.label}
                d={`M 21 21 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
                fill={palette[i % palette.length]}
              />
            )
          })}
        </svg>
      </div>
    )
  }

  if (type === 'line') {
    const pts = data.map((d, i) => {
      const x = (i / Math.max(1, data.length - 1)) * 100
      const y = 100 - (d.value / max) * 90
      return `${x},${y}`
    })
    return (
      <div style={pos}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke={palette[0]}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((d, i) => {
            const x = (i / Math.max(1, data.length - 1)) * 100
            const y = 100 - (d.value / max) * 90
            return (
              <circle
                key={d.label}
                cx={x}
                cy={y}
                r="2.5"
                fill={palette[0]}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div
      style={{
        ...pos,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4%',
        padding: '0 2%',
      }}
    >
      {data.map((d, i) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            height: `${(d.value / max) * 100}%`,
            background: palette[i % palette.length],
            borderRadius: '3px 3px 0 0',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Ô chữ trong slide: tự co cỡ chữ xuống cho tới khi nội dung vừa khung,
 * nên nội dung dài (ví dụ AI sinh nhiều ý) không bị cắt.
 */
function AutoFitText({
  value,
  baseSize,
  weight,
  fontFamily,
  fontStyle,
  textDecoration,
  align,
  color,
  background,
  lineHeight,
  letterSpacing,
  valign,
  focusOnMount,
  locked,
  onDone,
  onChange,
}: {
  value: string
  /** cỡ chữ tối đa, tính bằng cqw */
  baseSize: number
  /** canh giữa dọc — khớp bản xem (SlideElView) để chữ không nhảy lên đỉnh khi chọn */
  valign?: 'top' | 'middle'
  /** focus ô chữ ngay khi hiện (gõ chữ trong hình khối) */
  focusOnMount?: boolean
  /** chưa sửa chữ: textarea không nhận chuột để bấm một lần chỉ chọn/kéo hộp, nhấp đúp mới sửa */
  locked?: boolean
  /** rời ô chữ (mất focus) */
  onDone?: () => void
  weight: number
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  align?: 'left' | 'center' | 'right'
  color?: string
  lineHeight?: number
  letterSpacing?: number
  /** nền hộp chữ (thẻ của layout cards) */
  background?: string
  onChange: (text: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const middle = valign === 'middle'
  const [size, setSize] = useState(baseSize)
  // Công thức hiển thị bằng KaTeX khi không gõ; nhấp đúp để sửa mã LaTeX.
  const [editing, setEditing] = useState(false)
  const showMath = hasRich(value) && !editing

  useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  // nhấp đúp mở khoá ô chữ: vào ô và đặt con trỏ cuối chữ (autoFocus chỉ chạy lúc gắn, ô này đã gắn sẵn)
  useEffect(() => {
    if (locked !== false) return
    const ta = ref.current
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(ta.value.length, ta.value.length)
  }, [locked])

  useLayoutEffect(() => {
    const ta = ref.current
    if (!ta) return
    const box = boxRef.current
    const min = baseSize * 0.6
    // Canh giữa dọc: textarea cao đúng bằng nội dung, hộp bọc flex căn giữa nó —
    // textarea tự nó không có valign nên trước đây chữ luôn dính đỉnh khung.
    const need = () => {
      ta.style.height = '0px'
      return ta.scrollHeight
    }
    const fit = () => {
      // co dần cho tới khi vừa khung; không nhỏ hơn 60% cỡ gốc
      let s = baseSize
      const fits = (px: number) => {
        ta.style.fontSize = `${px}cqw`
        return middle && box ? need() <= box.clientHeight + 1 : ta.scrollHeight <= ta.clientHeight + 1
      }
      if (!fits(s)) while (s > min && !fits(s)) s -= 0.1
      // giữ 2 chữ số: compose-time đã fit tới 0,01cqw, làm tròn lên 0,1 sẽ
      // biến 2,45 thành 2,5 và gây tràn đúng ở biên
      const final = Math.floor(s * 100) / 100
      setSize(final)
      ta.style.fontSize = `${final}cqw`
      if (middle && box) ta.style.height = `${Math.min(need(), box.clientHeight)}px`
    }
    fit()
    // kéo tay nắm đổi chiều cao/chiều rộng hộp → fit lại ngay khi hộp đổi
    const ro = new ResizeObserver(fit)
    ro.observe(middle && box ? box : ta)
    const stopFonts = refitOnFonts(fit)
    return () => {
      stopFonts()
      ro.disconnect()
    }
  }, [value, baseSize, showMath, middle])

  if (showMath) {
    return (
      <div className="h-full w-full" onDoubleClick={() => setEditing(true)} title="Nhấp đúp để sửa công thức">
        <FitText
          html={slideMathHtml(value)}
          baseSize={baseSize}
          style={{
            width: '100%',
            height: '100%',
            padding: background ? '1.5% 3%' : '1%',
            ...(middle ? { display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' } : {}),
            color: color ?? 'inherit',
            background,
            borderRadius: background ? '0.6cqw' : undefined,
            fontFamily: fontFamily ?? 'Be Vietnam Pro, sans-serif',
            fontWeight: weight,
            fontStyle,
            textDecoration,
            textAlign: align,
            lineHeight: lineHeight ?? 1.25,
            letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
          }}
        >
          {value}
        </FitText>
      </div>
    )
  }

  const textarea = (
    <textarea
      ref={ref}
      autoFocus={editing || focusOnMount}
      onBlur={() => {
        setEditing(false)
        onDone?.()
      }}
      readOnly={locked}
      tabIndex={locked ? -1 : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('w-full resize-none overflow-hidden bg-transparent p-[1%] outline-none', !middle && 'h-full')}
      style={{
        color: color ?? 'inherit',
        background: middle ? undefined : background,
        borderRadius: !middle && background ? '0.6cqw' : undefined,
        padding: background ? '1.5% 3%' : undefined,
        fontFamily: fontFamily ?? 'Be Vietnam Pro, sans-serif',
        fontSize: `${size}cqw`,
        fontWeight: weight,
        fontStyle,
        textDecoration,
        textAlign: align,
        lineHeight: lineHeight ?? 1.25,
        letterSpacing: letterSpacing ? `${letterSpacing}em` : undefined,
        pointerEvents: locked ? 'none' : undefined,
      }}
    />
  )
  return middle ? (
    <div
      ref={boxRef}
      className="flex h-full w-full flex-col justify-center"
      style={{ background, borderRadius: background ? '0.6cqw' : undefined }}
    >
      {textarea}
    </div>
  ) : (
    textarea
  )
}

/** Hướng tay nắm resize — 8 anchor như Transformer của bản gốc. */
type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
const HANDLE_DIRS: ResizeDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function EditableEl({
  el,
  theme,
  selected,
  onSelect,
  onBeginHistory,
  onPreview,
  onChange,
  onDragEnd,
  onGenerateImage,
  editingText,
  onEditingText,
}: {
  el: SlideElement
  theme: ResolvedTheme
  selected: boolean
  onSelect: () => void
  onBeginHistory: () => void
  onPreview: (patch: Partial<SlideElement>) => void
  onChange: (patch: Partial<SlideElement>) => void
  /** kết thúc kéo/resize/xoay — chặn cú click rơi ra ngoài phần tử làm bỏ chọn */
  onDragEnd: () => void
  /** tạo ảnh AI cho khung ảnh trống (prompt lấy từ nội dung slide) */
  onGenerateImage: () => Promise<void>
  /** đang gõ chữ trong hình khối (nhấp đúp hình hoặc nút "Thêm chữ" trên thanh nổi) */
  editingText: boolean
  onEditingText: (on: boolean) => void
}) {
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${elementHeight(el)}%`,
    zIndex: el.zIndex,
    transform: elTransform(el),
    outline: selected ? '2px solid #b4532a' : undefined,
    outlineOffset: selected ? 0 : undefined,
  }

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize', dir?: ResizeDir) => {
    if ((e.target as HTMLElement).closest('textarea, input, button, label')) {
      onSelect()
      return
    }
    e.stopPropagation()
    // Chọn và bắt đầu kéo trong cùng một thao tác, như PowerPoint.
    if (!selected) onSelect()
    e.preventDefault()
    const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const base = { x: el.x, y: el.y, w: el.w, h: elementHeight(el) }
    const startX = e.clientX
    const startY = e.clientY
    const MIN = 4
    onBeginHistory()
    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      if (mode === 'move' || !dir) {
        onPreview({ x: clamp(base.x + dx, 0, 100 - base.w), y: clamp(base.y + dy, 0, 100 - base.h) })
        return
      }
      // Resize theo trục cục bộ của phần tử (không theo trục màn hình) để
      // phần tử đã xoay/lật vẫn bám đúng con trỏ và giữ cạnh đối diện đứng yên.
      const rad = ((el.rotation ?? 0) * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const moveX = ev.clientX - startX
      const moveY = ev.clientY - startY
      // chiếu delta màn hình vào hệ trục của hộp, rồi bỏ lật
      let localX = moveX * cos + moveY * sin
      let localY = -moveX * sin + moveY * cos
      const flipX = el.flipX ? -1 : 1
      const flipY = el.flipY ? -1 : 1
      if (flipX < 0) localX = -localX
      if (flipY < 0) localY = -localY

      const wPx = (base.w / 100) * rect.width
      const hPx = (base.h / 100) * rect.height
      const minW = (MIN / 100) * rect.width
      const minH = (MIN / 100) * rect.height
      let l = -wPx / 2
      let r = wPx / 2
      let t = -hPx / 2
      let b = hPx / 2
      if (dir.includes('w')) l = Math.min(l + localX, r - minW)
      if (dir.includes('e')) r = Math.max(r + localX, l + minW)
      if (dir.includes('n')) t = Math.min(t + localY, b - minH)
      if (dir.includes('s')) b = Math.max(b + localY, t + minH)

      const nextW = r - l
      const nextH = b - t
      // tâm hộp dời nửa delta cục bộ của hai cạnh đối diện; đổi về trục slide
      const shiftX = flipX * ((l + r) / 2)
      const shiftY = flipY * ((t + b) / 2)
      const cx = ((base.x + base.w / 2) / 100) * rect.width + shiftX * cos - shiftY * sin
      const cy = ((base.y + base.h / 2) / 100) * rect.height + shiftX * sin + shiftY * cos
      let nextXPct = ((cx - nextW / 2) / rect.width) * 100
      let nextYPct = ((cy - nextH / 2) / rect.height) * 100
      let nextWPct = (nextW / rect.width) * 100
      let nextHPct = (nextH / rect.height) * 100
      if (!el.rotation) {
        // phần tử chưa xoay: giữ hộp trong trang như trước
        nextWPct = Math.min(nextWPct, 100)
        nextHPct = Math.min(nextHPct, 100)
        nextXPct = clamp(nextXPct, 0, 100 - nextWPct)
        nextYPct = clamp(nextYPct, 0, 100 - nextHPct)
      }
      const patch: Partial<SlideElement> = {
        x: nextXPct,
        y: nextYPct,
        w: nextWPct,
        h: nextHPct,
      }
      // Hộp chữ mặc định bám theo nội dung; kéo cạnh trên/dưới là chốt chiều
      // cao thủ công, từ đó khung giữ đúng kích thước người dùng đặt.
      if (el.type === 'text' && (dir.includes('n') || dir.includes('s'))) {
        patch.fixedHeight = true
      }
      // Chữ co/giãn theo chiều cao hộp (như "shrink text on overflow" của
      // PowerPoint) — nếu không, thu nhỏ hộp sẽ cắt mất chữ.
      if (el.type === 'text' && (dir.includes('n') || dir.includes('s'))) {
        const baseFont = el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)
        const ratio = nextH / hPx
        patch.fontSize = clamp(Number((baseFont * ratio).toFixed(2)), 0.8, 12)
      }
      onPreview(patch)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onDragEnd()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const common = {
    style,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect() },
    onPointerDown: (e: React.PointerEvent) => startDrag(e, 'move'),
  }

  // sát mép dưới slide thì nút xoay không còn chỗ phía dưới (bị cắt) nên lật lên đỉnh;
  // phần tử phủ gần kín slide (không còn chỗ trên lẫn dưới) thì đặt nút xoay vào trong, sát đáy
  const bottomEdge = el.y + elementHeight(el) > 88
  const rotTop = bottomEdge && el.y > 10
  const rotInside = bottomEdge && !(el.y > 10)
  // khung slide cắt phần tràn ra ngoài: cạnh nào chạm mép slide thì tay nắm resize dời vào trong để còn kéo được
  const edgeH = elementHeight(el)
  const atL = el.x < 1.5
  const atR = el.x + el.w > 98.5
  const atT = el.y < 1.5
  const atB = el.y + edgeH > 98.5

  /** Xoay quanh tâm hộp; giữ Shift để bắt góc 15°. */
  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!selected) onSelect()
    const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const cx = rect.left + ((el.x + el.w / 2) / 100) * rect.width
    const cy = rect.top + ((el.y + el.h / 2) / 100) * rect.height
    onBeginHistory()
    const move = (ev: PointerEvent) => {
      // tay nắm dưới đáy: con trỏ ở chính giữa phía dưới = 0° (−90); sát mép dưới slide thì tay nắm lật lên đỉnh (+90).
      const deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + (rotTop ? 90 : -90)
      const snapped = ev.shiftKey ? Math.round(deg / 15) * 15 : Math.round(deg)
      onPreview({ rotation: ((snapped % 360) + 360) % 360 })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      onDragEnd()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const handle = selected ? (
    <>
      {HANDLE_DIRS.map((dir) => (
        <span
          key={dir}
          className={`slide-el-handle slide-el-handle--${dir}`}
          style={{
            marginLeft: dir.includes('w') && atL ? 0 : dir.includes('e') && atR ? -10 : undefined,
            marginTop: dir.includes('n') && atT ? 0 : dir.includes('s') && atB ? -10 : undefined,
          }}
          onPointerDown={(e) => startDrag(e, 'resize', dir)}
        />
      ))}
      <span className={`slide-el-rotate${rotTop ? ' slide-el-rotate--top' : ''}${rotInside ? ' slide-el-rotate--in' : ''}`} title="Xoay" onPointerDown={startRotate}>
        <RotateCw size={11} strokeWidth={2} />
      </span>
    </>
  ) : null

  if (el.type === 'text')
    return (
      <div {...common} style={{ ...style, cursor: selected && !editingText ? 'move' : 'default' }} onDoubleClick={() => onEditingText(true)}>
        <AutoFitText
          locked={!editingText}
          focusOnMount={editingText}
          onDone={() => onEditingText(false)}
          value={el.text ?? ''}
          baseSize={el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)}
          weight={el.fontWeight ?? (el.variant === 'body' ? 500 : 600)}
          fontFamily={fontStack(
            el.fontFamily ?? (el.variant === 'body' ? theme.fonts.body : theme.fonts.heading),
          )}
          fontStyle={el.fontStyle}
          textDecoration={el.textDecoration}
          align={el.align}
          color={el.textColor ?? theme.fg}
          lineHeight={el.lineHeight}
          letterSpacing={el.letterSpacing}
          background={el.fill}
          valign={el.valign === 'middle' || el.fill ? 'middle' : 'top'}
          onChange={(text) => onChange({ text })}
        />
        {handle}
      </div>
    )

  if (el.type === 'icon') {
    const Icon = slideIconById(el.assetId)
    return Icon ? (
      <div {...common} style={{ ...style, opacity: el.opacity, color: el.textColor ?? theme.accent, cursor: selected ? 'move' : 'default' }}>
        <Icon size="100%" weight="duotone" className="h-full w-full p-[2%]" />
        {handle}
      </div>
    ) : null
  }

  if (el.type === 'connector') {
    return (
      <div {...common} style={{ ...style, cursor: selected ? 'move' : 'default' }}>
        <ConnectorSvg el={el} theme={theme} />
        {handle}
      </div>
    )
  }

  if (el.type === 'graphic') {
    if (!el.graphicId || !graphicById(el.graphicId)) return null
    return (
      <div {...common} style={{ ...style, opacity: el.opacity, cursor: selected ? 'move' : 'default' }}>
        <div
          className={`h-full w-full ${graphicById(el.graphicId)?.category === 'ornament' ? '' : 'p-[2%]'}`}
          dangerouslySetInnerHTML={{ __html: graphicMarkup(el.graphicId, el.textColor ?? theme.fg, el.fill) }}
        />
        {handle}
      </div>
    )
  }

  if (el.type === 'shape')
    return (
      <div {...common} style={{ ...style, ...shapeCss(el, theme) }} onDoubleClick={() => el.shape !== 'line' && onEditingText(true)}>
        {shapeInner(el, theme)}
        {editingText && el.shape !== 'line' ? (
          <div style={{ position: 'absolute', inset: '10% 12%' }} onBlur={() => onEditingText(false)}>
            <AutoFitText
              value={el.text ?? ''}
              baseSize={el.fontSize ?? 2.4}
              weight={el.fontWeight ?? 600}
              fontFamily={fontStack(el.fontFamily ?? theme.fonts.body)}
              fontStyle={el.fontStyle}
              align={el.align ?? 'center'}
              color={el.textColor ?? readableTextOn(el.fill ?? theme.accent)}
              valign="middle"
              focusOnMount
              onChange={(text) => onChange({ text })}
            />
          </div>
        ) : (
          <ShapeText el={el} theme={theme} />
        )}
        {handle}
      </div>
    )

  if (el.type === 'table') {
    const headerFg = readableTextOn(theme.accent)
    const rowCount = el.rows?.length ?? 0
    return (
      <div {...common}>
        <table
          className="h-full w-full"
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            border: `1px solid ${theme.muted}`,
            borderRadius: '0.8cqw',
            overflow: 'hidden',
            fontSize: '1.7cqw',
            color: theme.fg,
          }}
        >
          <tbody>
            {(el.rows ?? []).map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '0.5em 0.7em',
                      borderBottom:
                        ri < rowCount - 1 ? `1px solid ${theme.muted}` : undefined,
                      borderRight: ci < r.length - 1 ? `1px solid ${theme.muted}` : undefined,
                      background:
                        ri === 0 ? theme.accent : ri % 2 === 0 ? theme.surface : 'transparent',
                      color: ri === 0 ? headerFg : theme.fg,
                      fontWeight: ri === 0 ? 600 : 400,
                    }}
                  >
                    <MathCell
                      value={c}
                      onChange={(value) => {
                        const rows = (el.rows ?? []).map((row) => [...row])
                        rows[ri][ci] = value
                        onChange({ rows })
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {handle}
      </div>
    )
  }

  if (el.type === 'chart')
    return (
      <div {...common}>
        <ChartView el={el} absolute={false} colors={theme.chart} />
        {handle}
      </div>
    )

  if (el.type === 'image')
    return (
      <div {...common}>
        {/* ô cắt (bo góc/elip) tách khỏi khung ngoài để tay nắm resize và xoay không bị overflow-hidden cắt mất */}
        <div
          className={cn(
            'flex h-full w-full items-center justify-center overflow-hidden',
            el.shape === 'ellipse' ? 'rounded-full' : 'rounded-[1cqw]',
            el.src
              ? ''
              : 'border-2 border-dashed border-[#9ca3af] text-[1.8cqw] text-[#6b7280]',
          )}
        >
        {el.src ? (
          <img src={el.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 px-1 text-center">
            <label className="cursor-pointer hover:underline">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    uploadImage(String(reader.result))
                      .then((src) => onChange({ src }))
                      .catch((err) => setImageError(err instanceof Error ? err.message : String(err)))
                  }
                  reader.readAsDataURL(file)
                }}
              />
              Chọn ảnh
            </label>
            <button
              type="button"
              disabled={imageBusy}
              onClick={async (e) => {
                e.stopPropagation()
                setImageBusy(true)
                setImageError(null)
                try {
                  await onGenerateImage()
                } catch (err) {
                  setImageError(err instanceof Error ? err.message : String(err))
                } finally {
                  setImageBusy(false)
                }
              }}
              className="rounded border border-clay/60 px-1.5 py-0.5 text-[1.5cqw] font-semibold text-clay disabled:opacity-60"
            >
              {imageBusy ? 'Đang tạo ảnh…' : 'Tạo ảnh AI'}
            </button>
            {imageError ? (
              <span className="max-w-full truncate text-[1.3cqw] text-red-500" title={imageError}>
                Lỗi tạo ảnh
              </span>
            ) : null}
          </div>
        )}
        </div>
        {handle}
      </div>
    )

  return null
}

