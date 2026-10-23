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
  Trash2,
} from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Deck, Slide, SlideElement } from '@/store/docs'
import { parseAiDeck } from '@/lib/aiDeck'
import { AiPanel } from './AiPanel'
import { AiDock } from './Layout'
import { SlideRibbon, type SlideRibbonTab } from './SlideRibbon'

const uid = () => Math.random().toString(36).slice(2, 10)
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export interface SlideEditorProps {
  deck: Deck
  /** cập nhật deck (đã gộp sẵn trong store) */
  updateDeck: (patch: Partial<Deck>) => void
  /** lưu deck */
  onSave?: () => void
  /** tiêu đề deck, sửa tại chỗ */
  onRename?: (title: string) => void
}

export function SlideEditor({
  deck,
  updateDeck,
  onSave,
  onRename,
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
  const historyRef = useRef<{ past: Deck[]; future: Deck[] }>({ past: [], future: [] })

  const slides = deck.slides
  const theme = deck.theme

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
    const patch = action === 'left' ? { x: 0 } : action === 'center' ? { x: (100 - selectedElement.w) / 2 } : action === 'right' ? { x: 100 - selectedElement.w } : action === 'top' ? { y: 0 } : action === 'middle' ? { y: (100 - selectedElement.h) / 2 } : { y: 100 - selectedElement.h }
    updateElement(currentSlide.id, selectedElement.id, patch)
  }

  const flipSelected = (axis: 'x' | 'y') => {
    if (!currentSlide || !selectedElement) return
    updateElement(currentSlide.id, selectedElement.id, axis === 'x' ? { flipX: !selectedElement.flipX } : { flipY: !selectedElement.flipY })
  }

  const applyTheme = (nextTheme: typeof theme) => {
    commitDeck({ ...deck, theme: nextTheme, slides: deck.slides.map((s) => ({ ...s, background: nextTheme.bg })) })
  }

  const onUpdateSelected = (patch: Partial<SlideElement>) => {
    if (currentSlide && selectedElement) updateElement(currentSlide.id, selectedElement.id, patch)
  }

  const applyAiResult = (text: string) => {
    const parsed = parseAiDeck(text)
    if (!parsed) return
    const newSlides: Slide[] = parsed.slides.map((s) => {
      const bullets = s.bullets ?? []
      // co chữ theo độ dài nội dung để không tràn khung slide
      const bodyChars = bullets.join(' ').length
      const bodySize = bodyChars > 420 ? 1.9 : bodyChars > 260 ? 2.2 : 2.5
      const elements: SlideElement[] = [
        {
          id: uid(),
          type: 'text',
          x: 8,
          y: 10,
          w: 84,
          h: 16,
          variant: 'title',
          text: s.title,
        },
        // dạng "bullets": gộp các ý thành một khối chữ, xuống dòng bằng \n
        ...(bullets.length
          ? [
              {
                id: uid(),
                type: 'text' as const,
                x: 8,
                y: 32,
                w: 84,
                h: 52,
                variant: 'body' as const,
                fontSize: bodySize,
                text: bullets.map((b) => `• ${b}`).join('\n'),
              },
            ]
          : []),
        ...(s.elements ?? []).map((e) => ({
          id: uid(),
          type: (e.type ?? 'text') as SlideElement['type'],
          x: e.x ?? 8,
          y: e.y ?? 32,
          w: e.w ?? 84,
          h: e.h ?? 24,
          text: e.text,
          shape: e.shape,
          fill: e.fill,
          src: e.src,
          rows: e.rows,
          chart: e.chart,
        })),
      ]
      return {
        id: uid(),
        background: deck.theme.bg,
        transition: 'none',
        notes: s.notes?.join('\n') || undefined,
        elements,
      }
    })
    if (newSlides.length === 0) return
    commitDeck({ ...deck, slides: [...deck.slides, ...newSlides] })
    setSelectedSlideId(newSlides[0].id)
    setSelectedElementId(null)
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
            style={{ background: slide.background }}
          >
            {slide.elements.map((el) => (
              <SlideElView key={el.id} el={el} />
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
            <div key={s.id} className="group relative">
              <button
                type="button"
                onClick={() => { setSelectedSlideId(s.id); setSelectedElementId(null) }}
                className={cn(
                  'block w-full overflow-hidden rounded-md border-2 transition-colors',
                  currentSlide?.id === s.id ? 'border-clay' : 'border-line',
                )}
              >
                <SlideThumb slide={s} />
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
                    value={Math.round(selectedElement[key])}
                    onChange={(e) => updateElement(currentSlide.id, selectedElement.id, { [key]: Number(e.target.value) })}
                  />
                  <em>%</em>
                </label>
              ))}
              {selectedElement.type === 'text' && (
                <label className="slide-format-pane__row">
                  <span>Màu</span>
                  <input
                    type="color"
                    value={selectedElement.textColor ?? '#111827'}
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
          <div className="slide-stage__inner">
            {currentSlide ? (
              <div
                className="slide-frame relative aspect-[16/9] w-full overflow-hidden bg-white shadow-[0_2px_24px_-8px_rgba(35,32,28,0.35)]"
                style={{ background: currentSlide.background, zoom: zoom / 100 }}
                onClick={() => setSelectedElementId(null)}
              >
                {currentSlide.elements.map((el) => (
                  <EditableEl
                    key={el.id}
                    el={el}
                    theme={theme}
                    selected={selectedElementId === el.id}
                    onSelect={() => setSelectedElementId(el.id)}
                    onBeginHistory={beginHistory}
                    onPreview={(patch) => previewElement(currentSlide.id, el.id, patch)}
                    onChange={(patch) => updateElement(currentSlide.id, el.id, patch)}
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
export function SlideThumb({ slide }: { slide: Slide }) {
  return (
    <div
      className="slide-frame relative aspect-[16/9] w-full overflow-hidden"
      style={{ background: slide.background }}
    >
      {slide.elements.map((el) => (
        <SlideElView key={el.id} el={el} />
      ))}
    </div>
  )
}

/**
 * Khối chữ trong slide ở chế độ xem: tự co cỡ chữ cho tới khi nội dung
 * vừa khung, nên nội dung dài (AI sinh nhiều ý) không bị cắt.
 */
function FitText({
  children,
  baseSize,
  style,
}: {
  children: React.ReactNode
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
    let s = baseSize
    const fits = (px: number) => {
      el.style.fontSize = `${px}cqw`
      return el.scrollHeight <= el.clientHeight + 1
    }
    if (fits(s)) return
    while (s > min && !fits(s)) s -= 0.1
    const final = Math.round(s * 10) / 10
    setSize(final)
    el.style.fontSize = `${final}cqw`
  }, [children, baseSize])

  return (
    <div
      ref={ref}
      style={{
        ...style,
        fontFamily: 'Figtree, sans-serif',
        fontSize: `${size}cqw`,
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function SlideElView({ el }: { el: SlideElement }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex,
    transform: `${el.flipX ? 'scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`.trim() || undefined,
  }

  if (el.type === 'text') {
    const size = el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)
    return (
      <FitText
        style={{
          ...style,
          color: el.textColor ?? '#000',
          fontFamily: el.fontFamily ? `${el.fontFamily}, sans-serif` : 'Figtree, sans-serif',
          fontWeight: el.fontWeight ?? (el.variant === 'body' ? 500 : 600),
          fontStyle: el.fontStyle,
          textDecoration: el.textDecoration,
          textAlign: el.align,
          lineHeight: 1.3,
          padding: '0 2%',
        }}
        baseSize={size}
      >
        {el.text}
      </FitText>
    )
  }

  if (el.type === 'shape') {
    const radius = el.shape === 'ellipse' ? '50%' : el.shape === 'round' ? '12px' : '0'
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
          background: el.fill ?? '#2563eb',
          borderRadius: radius,
          clipPath: clip,
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
          border: '2px dashed #9ca3af',
          color: '#6b7280',
          fontSize: '2.1cqw',
        }}
      >
        {el.src ? (
          <img
            src={el.src}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          'Hình ảnh'
        )}
      </div>
    )

  if (el.type === 'table')
    return (
      <table
        style={{
          ...style,
          borderCollapse: 'collapse',
          fontSize: '1.65cqw',
          color: '#000',
        }}
      >
        <tbody>
          {(el.rows ?? []).map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  style={{
                    border: '1px solid #9ca3af',
                    padding: '0.4em 0.6em',
                    background: ri === 0 ? '#f3f4f6' : '#fff',
                    fontWeight: ri === 0 ? 600 : 400,
                  }}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )

  if (el.type === 'chart')
    return <ChartView el={el} />

  return null
}

function ChartView({ el }: { el: SlideElement }) {
  const data = el.chart?.data ?? []
  const max = Math.max(1, ...data.map((d) => d.value))
  const type = el.chart?.type ?? 'bar'

  if (type === 'pie') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    let acc = 0
    const colors = ['#2563eb', '#c05a3c', '#16a34a', '#b8862f', '#9333ea']
    return (
      <div
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.w}%`,
          height: `${el.h}%`,
        }}
      >
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
                fill={colors[i % colors.length]}
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
      <div
        style={{
          position: 'absolute',
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.w}%`,
          height: `${el.h}%`,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke="#2563eb"
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
                fill="#2563eb"
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
        position: 'absolute',
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.w}%`,
        height: `${el.h}%`,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4%',
        padding: '0 2%',
      }}
    >
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            height: `${(d.value / max) * 100}%`,
            background: '#2563eb',
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
  onChange,
}: {
  value: string
  /** cỡ chữ tối đa, tính bằng cqw */
  baseSize: number
  weight: number
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  align?: 'left' | 'center' | 'right'
  color?: string
  onChange: (text: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [size, setSize] = useState(baseSize)

  useEffect(() => {
    setSize(baseSize)
  }, [baseSize])

  useLayoutEffect(() => {
    const ta = ref.current
    if (!ta) return
    // co dần cho tới khi vừa khung; không nhỏ hơn 60% cỡ gốc
    const min = baseSize * 0.6
    let s = baseSize
    const fits = (px: number) => {
      ta.style.fontSize = `${px}cqw`
      return ta.scrollHeight <= ta.clientHeight + 1
    }
    if (fits(s)) return
    while (s > min && !fits(s)) s -= 0.1
    setSize(Math.round(s * 10) / 10)
    ta.style.fontSize = `${Math.round(s * 10) / 10}cqw`
  }, [value, baseSize])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-full w-full resize-none overflow-hidden bg-transparent p-[1%] leading-tight outline-none"
      style={{
        color: color ?? 'inherit',
        fontFamily: fontFamily ?? 'Figtree, sans-serif',
        fontSize: `${size}cqw`,
        fontWeight: weight,
        fontStyle,
        textDecoration,
        textAlign: align,
      }}
    />
  )
}

function EditableEl({
  el,
  theme,
  selected,
  onSelect,
  onBeginHistory,
  onPreview,
  onChange,
}: {
  el: SlideElement
  theme: { fg: string; accent: string }
  selected: boolean
  onSelect: () => void
  onBeginHistory: () => void
  onPreview: (patch: Partial<SlideElement>) => void
  onChange: (patch: Partial<SlideElement>) => void
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
    zIndex: el.zIndex,
    transform: `${el.flipX ? 'scaleX(-1)' : ''}${el.flipY ? ' scaleY(-1)' : ''}`.trim() || undefined,
    outline: selected ? '2px solid #b4532a' : undefined,
    outlineOffset: selected ? '2px' : undefined,
  }

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    if ((e.target as HTMLElement).closest('textarea, input, button, label')) {
      onSelect()
      return
    }
    e.stopPropagation()
    if (!selected) {
      onSelect()
      return
    }
    e.preventDefault()
    const frame = (e.currentTarget as HTMLElement).closest('.slide-frame') as HTMLElement | null
    if (!frame) return
    const rect = frame.getBoundingClientRect()
    const base = { x: el.x, y: el.y, w: el.w, h: el.h }
    const startX = e.clientX
    const startY = e.clientY
    onBeginHistory()
    const move = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100
      const dy = ((ev.clientY - startY) / rect.height) * 100
      if (mode === 'move') {
        onPreview({ x: clamp(base.x + dx, 0, 100 - base.w), y: clamp(base.y + dy, 0, 100 - base.h) })
      } else {
        onPreview({ w: clamp(base.w + dx, 4, 100 - base.x), h: clamp(base.h + dy, 4, 100 - base.y) })
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const common = {
    style,
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect() },
    onPointerDown: (e: React.PointerEvent) => startDrag(e, 'move'),
  }

  const handle = selected ? (
    <span
      className="slide-el-handle"
      title="Kéo để đổi kích thước"
      onPointerDown={(e) => startDrag(e, 'resize')}
    />
  ) : null

  if (el.type === 'text')
    return (
      <div {...common} style={{ ...style, cursor: selected ? 'move' : 'default' }}>
        <AutoFitText
          value={el.text ?? ''}
          baseSize={el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)}
          weight={el.fontWeight ?? (el.variant === 'body' ? 500 : 600)}
          fontFamily={el.fontFamily}
          fontStyle={el.fontStyle}
          textDecoration={el.textDecoration}
          align={el.align}
          color={el.textColor}
          onChange={(text) => onChange({ text })}
        />
        {handle}
      </div>
    )

  if (el.type === 'shape')
    return (
      <div
        {...common}
        style={{
          ...style,
          background: el.fill ?? theme.accent,
          borderRadius: el.shape === 'ellipse' ? '50%' : el.shape === 'round' ? '12px' : 0,
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

  if (el.type === 'table')
    return (
      <div {...common}>
        <table
          className="h-full w-full border-collapse text-[1.65cqw]"
          style={{ color: theme.fg }}
        >
          <tbody>
            {(el.rows ?? []).map((r, ri) => (
              <tr key={ri}>
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    className="border border-[#9ca3af] px-1.5 py-1"
                    style={{ background: ri === 0 ? '#f3f4f6' : '#fff' }}
                  >
                    <input
                      value={c}
                      onChange={(e) => {
                        const rows = (el.rows ?? []).map((row) => [...row])
                        rows[ri][ci] = e.target.value
                        onChange({ rows })
                      }}
                      className="w-full bg-transparent outline-none"
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

  if (el.type === 'chart')
    return (
      <div {...common}>
        <ChartView el={el} />
        {handle}
      </div>
    )

  if (el.type === 'image')
    return (
      <div
        {...common}
        className="flex items-center justify-center border-2 border-dashed border-[#9ca3af] text-[2.1cqw] text-[#6b7280]"
      >
        {el.src ? (
          <img src={el.src} alt="" className="h-full w-full object-cover" />
        ) : (
          <label className="cursor-pointer">
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
            Nhấn để chọn ảnh
          </label>
        )}
        {handle}
      </div>
    )

  return null
}

