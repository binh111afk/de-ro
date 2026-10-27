/**
 * Trình soạn bài giảng trình chiếu (slide).
 *
 * Nằm trong tab slide của trình soạn chung (`/soan-de`) cùng hệ tab + AI panel;
 * mọi tài liệu được lưu về Home qua store khi đóng tab hoặc rời trang.
 *
 * Model dữ liệu (`Deck` / `Slide` / `SlideElement`) nằm ở `store/docs.ts`.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  MonitorPlay,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react'
import { SLIDE_ASSETS, isSlideAssetId } from '@/lib/slideAssets'
import { graphicMarkup, isGraphicId } from '@/lib/slideGraphics'
import { hasMath } from '@/lib/slideMath'
import { renderMath } from '@/lib/math'

/**
 * Vẽ công thức trong slide. `\frac` → `\tfrac` (phân số cỡ chữ thường): phân số
 * cỡ display cao ~2,2em làm dòng chữ phình ra và bị `FitText` co nhỏ.
 */
const slideMathHtml = (text: string): string => renderMath(text.replace(/\\(d?)frac/g, '\\tfrac'))

/** Ô bảng có công thức: hiện KaTeX khi không gõ, nhấp đúp để sửa mã. */
function MathCell({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false)
  if (hasMath(value) && !editing) {
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
import { elementHeight } from '@/lib/slideText'
import { normalizeTheme, readableTextOn, type ResolvedTheme } from '@/lib/slideTheme'
import { appendSlidesToDeck, withImage } from '@/lib/slideAi'
import { IMAGE_LAYOUTS, buildImagePrompt, generateSlideImage, queueImage } from '@/lib/imageGen'
import {
  SLIDE_LAYOUTS,
  composeLayout,
  contentFromSlide,
  defaultTone,
  isLayoutId,
  isTone,
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
const decorStyle = (theme: ResolvedTheme): React.CSSProperties =>
  ({ '--slide-decor-ink': theme.fg, '--slide-decor-accent': theme.secondary }) as React.CSSProperties

export interface SlideEditorProps {
  deck: Deck
  /** cập nhật deck (đã gộp sẵn trong store) */
  updateDeck: (patch: Partial<Deck>) => void
  /** lưu deck */
  onSave?: () => void
  /** tiêu đề deck, sửa tại chỗ */
  onRename?: (title: string) => void
  /** menu Tệp: tạo bài giảng mới trong tab khác */
  onNewDeck?: () => void
  /** menu Tệp: nhập .pptx/.docx/.xlsx thành tab bài giảng mới */
  onImportFile?: (file: File) => Promise<void>
}

export function SlideEditor({
  deck,
  updateDeck,
  onSave,
  onRename,
  onNewDeck,
  onImportFile,
}: SlideEditorProps) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [ribbonTab, setRibbonTab] = useState<SlideRibbonTab>('home')
  const [presenting, setPresenting] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)
  const [aiOpen, setAiOpen] = useState(true)
  const [zoom, setZoom] = useState(100)
  const [formatPaneOpen, setFormatPaneOpen] = useState(false)
  const [clipboardElement, setClipboardElement] = useState<SlideElement | null>(null)
  /** chỉ số slide đang kéo + vị trí chèn (0..n) khi kéo thumbnail */
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropPos, setDropPos] = useState<number | null>(null)
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

  const addSlide = () => {
    const s: Slide = {
      id: uid(),
      background: deck.theme.bg,
      elements: [],
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
    setElementImage(slideId, elId, image.dataUrl)
  }

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
      if (['shapeFormat', 'pictureFormat', 'tableDesign', 'chartDesign'].includes(ribbonTab)) {
        setRibbonTab('home')
      }
      return
    }
    const auto: Partial<Record<SlideElement['type'], SlideRibbonTab>> = {
      image: 'pictureFormat',
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
    commitDeck({
      ...deck,
      theme: nextTheme,
      slides: deck.slides.map((slide) => {
        if (slide.layout && isLayoutId(slide.layout)) {
          const tone = isTone(slide.tone) ? slide.tone : defaultTone(slide.layout)
          const elements = composeLayout(
            nextTheme,
            slide.layout,
            contentFromSlide(slide),
            tone,
          )
          if (elements.length > 0) {
            return { ...slide, tone, background: toneBackground(nextTheme, tone), elements }
          }
        }
        return { ...slide, background: nextTheme.bg }
      }),
    })
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
    patchSlide(currentSlide.id, {
      tone,
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
    patchSlide(currentSlide.id, {
      layout: layoutId,
      tone,
      background: toneBackground(deck.theme, tone),
      elements,
    })
  }

  /**
   * Nối slide AI vào **deck mới nhất** (deckRef), không dùng `deck` của lần
   * render trước: các trang sinh xong cách nhau vài giây, người dùng có thể đã
   * sửa/xoá slide trong lúc chờ. Việc dựng slide + đổi theme nằm ở
   * `appendSlidesToDeck` (lib/slideAi.ts) để test được.
   */
  const appendAiSlides = (pages: AiSlidePayload[], plan?: DeckPlan): Slide[] => {
    if (!pages.length) return []
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
    void queueImage(() =>
      generateSlideImage(buildImagePrompt(page.title, bullets, orientation, palette)),
    )
      .then((generated) => setSlideImage(slide.id, generated.dataUrl))
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
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black">
        <div className="flex flex-1 items-center justify-center p-6">
          <div
            className="slide-frame relative aspect-[16/9] w-full max-w-[1200px] overflow-hidden shadow-2xl"
            data-decor={theme.decor}
            style={{ background: slide.background, ...decorStyle(theme) }}
          >
            {slide.elements.map((el) => (
              <SlideElView key={el.id} el={el} theme={theme} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pb-5 text-white/80">
          <button
            type="button"
            onClick={() => setPresentIndex((i) => Math.max(0, i - 1))}
            disabled={presentIndex === 0}
            className="rounded-md p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="tnum text-[13px]">
            {presentIndex + 1} / {deck.slides.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setPresentIndex((i) => Math.min(deck.slides.length - 1, i + 1))
            }
            disabled={presentIndex === deck.slides.length - 1}
            className="rounded-md p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setPresenting(false)}
            className="ml-4 rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-white/10"
          >
            Thoát
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
        onPresent={() => { setPresentIndex(currentSlide ? deck.slides.indexOf(currentSlide) : 0); setPresenting(true) }}
        formatPaneOpen={formatPaneOpen}
        onToggleFormatPane={() => setFormatPaneOpen((v) => !v)}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((v) => !v)}
        zoom={zoom}
        onZoom={setZoom}
      />
      <div className="flex min-h-0 min-w-0 flex-1">
      {/* ---------------- cột slide (thumbnail) ---------------- */}
      <aside className="flex w-[190px] shrink-0 flex-col overflow-hidden border-r border-line bg-surface">
        <div className="slide-rail-head">
          {onRename ? (
            <input
              value={deck.title}
              onChange={(e) => onRename(e.target.value)}
              aria-label="Tên bài giảng"
              className="slide-rail-title"
            />
          ) : (
            <span className="slide-rail-title">{deck.title}</span>
          )}
        </div>
        <div className="border-b border-line px-3 py-2">
          <button
            type="button"
            onClick={addSlide}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-2 py-1.5 text-[12.5px] font-semibold text-ink-3 transition-colors hover:border-clay hover:text-clay"
          >
            <Plus className="size-3.5" />
            Thêm slide
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {deck.slides.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(i))
                setDragIndex(i)
              }}
              onDragOver={(e) => {
                if (dragIndex === null) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                const r = e.currentTarget.getBoundingClientRect()
                setDropPos(e.clientY < r.top + r.height / 2 ? i : i + 1)
              }}
              onDrop={(e) => {
                if (dragIndex === null) return
                e.preventDefault()
                // Tính lại tại điểm thả: dragover cuối có thể chưa kịp commit.
                const r = e.currentTarget.getBoundingClientRect()
                const pos = e.clientY < r.top + r.height / 2 ? i : i + 1
                moveSlide(dragIndex, pos)
                setDragIndex(null)
                setDropPos(null)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setDropPos(null)
              }}
              className={cn(
                'group relative',
                dragIndex === i && 'thumb-dragging',
                dropPos === i && 'thumb-drop-before',
                dropPos === i + 1 && i === deck.slides.length - 1 && 'thumb-drop-after',
              )}
            >
              <button
                type="button"
                onClick={() => { setSelectedSlideId(s.id); setSelectedElementId(null) }}
                className={cn(
                  'block w-full overflow-hidden rounded-md border-2 transition-colors',
                  currentSlide?.id === s.id ? 'border-clay' : 'border-line',
                )}
              >
                <SlideThumb slide={s} theme={theme} />
                <span className="absolute bottom-1 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
              </button>
              <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => duplicateSlide(s.id)}
                  title="Nhân bản slide"
                  className="rounded bg-white/85 p-1 text-ink-3 hover:text-ink"
                >
                  <LayoutTemplate className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSlide(s.id)}
                  title="Xoá slide"
                  className="rounded bg-white/85 p-1 text-ink-3 hover:text-clay"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
          {Array.from({ length: pendingCount }, (_, i) => (
            <div
              key={`pending-${i}`}
              className="slide-skeleton"
              aria-hidden="true"
              title="AI đang viết slide…"
            >
              <span className="slide-skeleton__bar slide-skeleton__bar--title" />
              <span className="slide-skeleton__bar" />
              <span className="slide-skeleton__bar slide-skeleton__bar--short" />
              <span className="slide-skeleton__index">{deck.slides.length + i + 1}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ---------------- sân soạn (giữa) ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* canvas */}
        <div className="slide-stage anim-tab-in" key={deck.id}>
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
                <label className="slide-format-pane__row">
                  <span>Màu</span>
                  <input
                    type="color"
                    value={selectedElement.textColor ?? theme.fg}
                    onChange={(e) => updateElement(currentSlide.id, selectedElement.id, { textColor: e.target.value })}
                  />
                </label>
              )}
              {selectedElement.type === 'shape' && (
                <label className="slide-format-pane__row">
                  <span>Tô</span>
                  <input
                    type="color"
                    value={selectedElement.fill ?? theme.accent}
                    onChange={(e) => updateElement(currentSlide.id, selectedElement.id, { fill: e.target.value })}
                  />
                </label>
              )}
              <button type="button" className="slide-format-pane__close" onClick={() => setFormatPaneOpen(false)}>Đóng</button>
            </aside>
          )}
          {/* zoom đặt ở lớp bọc, không đặt lên chính `.slide-frame`: frame là
              container query của `cqw`, giữ nó ở bề rộng layout thật để chữ chỉ
              bị phóng đúng một lần. */}
          <div className="slide-stage__inner" style={{ zoom: zoom / 100 }}>
            {currentSlide ? (
              <div
                className="slide-frame relative aspect-[16/9] w-full overflow-hidden bg-white shadow-[0_2px_24px_-8px_rgba(35,32,28,0.35)]"
                data-decor={theme.decor}
                style={{ background: currentSlide.background, ...decorStyle(theme) }}
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
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<MonitorPlay className="size-7" strokeWidth={1.4} />}
                title="Chưa có slide nào"
                description="Nhấn Thêm slide ở cột bên trái để bắt đầu."
              />
            )}
          </div>
        </div>
      </div>

      {/* ---------------- AI panel (phải) — trợ lý AI nằm ở cột phải --------- */}
      <AiDock open={aiOpen} onToggle={() => setAiOpen((v) => !v)} width={360} side="right">
        <AiPanel
          mode="slide"
          onApplySlides={applyAiResult}
          onAppendSlide={applyAiSlide}
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
  return (
    <div
      className="slide-frame relative aspect-[16/9] w-full overflow-hidden"
      data-decor={theme.decor}
      style={{ background: slide.background, ...decorStyle(theme) }}
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

function SlideElView({ el, theme }: { el: SlideElement; theme: ResolvedTheme }) {
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
    return (
      <FitText
        // công thức `$...$` vẽ bằng KaTeX (HTML do KaTeX sinh, không phải input thô)
        html={hasMath(el.text) ? slideMathHtml(el.text ?? '') : undefined}
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
        {el.text}
      </FitText>
    )
  }

  if (el.type === 'icon') {
    const Icon = isSlideAssetId(el.assetId) ? SLIDE_ASSETS[el.assetId].icon : null
    return Icon ? <Icon size="100%" weight="duotone" style={{ ...style, padding: '1%', color: el.textColor ?? theme.accent }} /> : null
  }

  if (el.type === 'graphic') {
    if (!isGraphicId(el.graphicId)) return null
    return (
      <div
        style={{ ...style, padding: '1%' }}
        // SVG do chính app sinh ra từ file thiết kế (không phải dữ liệu người
        // dùng nhập) nên nhúng trực tiếp là an toàn.
        dangerouslySetInnerHTML={{ __html: graphicMarkup(el.graphicId, el.textColor ?? theme.fg) }}
      />
    )
  }

  if (el.type === 'shape') {
    const radius =
      el.shape === 'ellipse'
        ? '50%'
        : el.shape === 'round'
          ? `${el.radius ?? theme.radius}px`
          : '0'
    const shadow =
      el.shadow === false || (el.shadow !== true && theme.shadow === 'none')
        ? undefined
        : theme.shadow === 'hard'
          ? '6px 6px 0 rgb(17 24 39 / 0.92)'
          : '0 0.8cqw 2.4cqw -0.6cqw rgb(15 23 42 / 0.28)'
    const border = el.border ?? theme.border
    const clip =
      el.shape === 'triangle'
        ? 'polygon(50% 0, 100% 100%, 0 100%)'
        : el.shape === 'arrow'
          ? 'polygon(0 35%, 78% 35%, 78% 10%, 100% 50%, 78% 90%, 78% 65%, 0 65%)'
          : undefined
    return (
      <div
        style={{
          ...style,
          background: el.fill ?? theme.accent,
          borderRadius: radius,
          clipPath: clip,
          boxShadow: shadow,
          border: border ? `${border}px solid ${el.borderColor ?? theme.borderColor}` : undefined,
        }}
      />
    )
  }

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
                  {hasMath(c) ? <span dangerouslySetInnerHTML={{ __html: slideMathHtml(c) }} /> : c}
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
  onChange,
}: {
  value: string
  /** cỡ chữ tối đa, tính bằng cqw */
  baseSize: number
  /** canh giữa dọc — khớp bản xem (SlideElView) để chữ không nhảy lên đỉnh khi chọn */
  valign?: 'top' | 'middle'
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
  const showMath = hasMath(value) && !editing

  useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

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
      autoFocus={editing}
      onBlur={() => setEditing(false)}
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
      // +90 vì tay nắm nằm trên đỉnh: con trỏ ở chính giữa phía trên = 0°.
      const deg = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90
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
          onPointerDown={(e) => startDrag(e, 'resize', dir)}
        />
      ))}
      <span className="slide-el-rotate" title="Xoay" onPointerDown={startRotate}>
        <RotateCw size={11} strokeWidth={2} />
      </span>
    </>
  ) : null

  if (el.type === 'text')
    return (
      <div {...common} style={{ ...style, cursor: selected ? 'move' : 'default' }}>
        <AutoFitText
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
    const Icon = isSlideAssetId(el.assetId) ? SLIDE_ASSETS[el.assetId].icon : null
    return Icon ? (
      <div {...common} style={{ ...style, color: el.textColor ?? theme.accent, cursor: selected ? 'move' : 'default' }}>
        <Icon size="100%" weight="duotone" className="h-full w-full p-[2%]" />
        {handle}
      </div>
    ) : null
  }

  if (el.type === 'graphic') {
    if (!isGraphicId(el.graphicId)) return null
    return (
      <div {...common} style={{ ...style, cursor: selected ? 'move' : 'default' }}>
        <div
          className="h-full w-full p-[2%]"
          dangerouslySetInnerHTML={{ __html: graphicMarkup(el.graphicId, el.textColor ?? theme.fg) }}
        />
        {handle}
      </div>
    )
  }

  if (el.type === 'shape')
    return (
      <div
        {...common}
        style={{
          ...style,
          background: el.fill ?? theme.accent,
          borderRadius:
            el.shape === 'ellipse'
              ? '50%'
              : el.shape === 'round'
                ? `${el.radius ?? theme.radius}px`
                : 0,
          boxShadow:
            el.shadow === false || (el.shadow !== true && theme.shadow === 'none')
              ? undefined
              : theme.shadow === 'hard'
                ? '6px 6px 0 rgb(17 24 39 / 0.92)'
                : '0 0.8cqw 2.4cqw -0.6cqw rgb(15 23 42 / 0.28)',
          border: (el.border ?? theme.border)
            ? `${el.border ?? theme.border}px solid ${el.borderColor ?? theme.borderColor}`
            : undefined,
          clipPath:
            el.shape === 'triangle'
              ? 'polygon(50% 0, 100% 100%, 0 100%)'
              : el.shape === 'arrow'
                ? 'polygon(0 35%, 78% 35%, 78% 10%, 100% 50%, 78% 90%, 78% 65%, 0 65%)'
                : undefined,
        }}
      >
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
      <div
        {...common}
        className={cn(
          'flex items-center justify-center overflow-hidden',
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
                  reader.onload = () => onChange({ src: String(reader.result) })
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
        {handle}
      </div>
    )

  return null
}

