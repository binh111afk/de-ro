/**
 * Trang Soạn slide — trình soạn bài giảng trình chiếu.
 * Có: danh sách slide, chèn text/shape/image/table/chart, theme, chuyển cảnh, trình chiếu.
 */
import { useMemo, useState } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Circle,
  Image as ImageIcon,
  LayoutTemplate,
  Minus,
  MonitorPlay,
  Palette,
  Play,
  Plus,
  Presentation,
  RectangleHorizontal,
  Save,
  Square,
  Table2,
  Trash2,
  Triangle,
  Type,
} from 'lucide-react'
import { Button, EmptyState, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  DECK_THEMES,
  useDocStore,
  type Deck,
  type Slide,
  type SlideElement,
} from '@/store/docs'

const uid = () => Math.random().toString(36).slice(2, 10)

const TRANSITIONS: Array<{ id: NonNullable<Slide['transition']>; label: string }> = [
  { id: 'none', label: 'Không' },
  { id: 'fade', label: 'Mờ dần' },
  { id: 'slide', label: 'Trượt' },
  { id: 'zoom', label: 'Thu phóng' },
]

export default function Slides() {
  const { deck, myDecks, openDeck, newDeck, updateDeck, saveDeck, deleteDeck } = useDocStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)

  const slides = deck?.slides ?? []

  const currentSlide = useMemo(
    () => slides.find((s) => s.id === selected) ?? slides[0] ?? null,
    [slides, selected],
  )

  /* ---------------------------------------------------------------- *
   * Slide helpers
   * ---------------------------------------------------------------- */
  const patchSlide = (id: string, patch: Partial<Slide>) => {
    if (!deck) return
    updateDeck({
      slides: deck.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })
  }

  const addElement = (el: SlideElement) => {
    if (!currentSlide) return
    patchSlide(currentSlide.id, { elements: [...currentSlide.elements, el] })
  }

  const addSlide = () => {
    if (!deck) return
    const s: Slide = {
      id: uid(),
      background: deck.theme.bg,
      elements: [],
      transition: 'none',
    }
    updateDeck({ slides: [...deck.slides, s] })
    setSelected(s.id)
  }

  const duplicateSlide = (id: string) => {
    if (!deck) return
    const idx = deck.slides.findIndex((s) => s.id === id)
    if (idx < 0) return
    const copy: Slide = {
      ...deck.slides[idx],
      id: uid(),
      elements: deck.slides[idx].elements.map((e) => ({ ...e, id: uid() })),
    }
    const next = [...deck.slides]
    next.splice(idx + 1, 0, copy)
    updateDeck({ slides: next })
    setSelected(copy.id)
  }

  const removeSlide = (id: string) => {
    if (!deck) return
    const next = deck.slides.filter((s) => s.id !== id)
    updateDeck({ slides: next })
    if (selected === id) setSelected(next[0]?.id ?? null)
  }

  const updateElement = (slideId: string, elId: string, patch: Partial<SlideElement>) => {
    if (!deck) return
    updateDeck({
      slides: deck.slides.map((s) =>
        s.id === slideId
          ? { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) }
          : s,
      ),
    })
  }

  const removeElement = (slideId: string, elId: string) => {
    if (!deck) return
    updateDeck({
      slides: deck.slides.map((s) =>
        s.id === slideId ? { ...s, elements: s.elements.filter((e) => e.id !== elId) } : s,
      ),
    })
  }

  /* ---------------------------------------------------------------- *
   * Trình chiếu
   * ---------------------------------------------------------------- */
  if (presenting && deck) {
    const slide = deck.slides[presentIndex]
    if (!slide) {
      setPresenting(false)
      return null
    }
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black">
        <div className="flex flex-1 items-center justify-center p-6">
          <div
            className="relative aspect-[16/9] w-full max-w-[1200px] overflow-hidden shadow-2xl"
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
            className="rounded-md p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            disabled={presentIndex === 0}
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="tnum text-[13px]">
            {presentIndex + 1} / {deck.slides.length}
          </span>
          <button
            type="button"
            onClick={() => setPresentIndex((i) => Math.min(deck.slides.length - 1, i + 1))}
            className="rounded-md p-2 transition-colors hover:bg-white/10 disabled:opacity-30"
            disabled={presentIndex === deck.slides.length - 1}
          >
            <ChevronRight className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setPresenting(false)}
            className="ml-4 rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-white/10"
          >
            Thoát (Esc)
          </button>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- *
   * Danh sách (không mở deck)
   * ---------------------------------------------------------------- */
  if (!deck) {
    return (
      <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
        <header className="mb-8">
          <p className="eyebrow mb-3">Trình chiếu</p>
          <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
            Soạn slide
          </h1>
          <p className="mt-3 text-[14.5px] text-ink-3">
            Tạo bài giảng trình chiếu cho lớp học — kèm biểu đồ, bảng, hình ảnh và chuyển cảnh.
          </p>
        </header>

        {myDecks.length === 0 ? (
          <EmptyState
            icon={<Presentation className="size-7" strokeWidth={1.4} />}
            title="Chưa có bài giảng nào"
            description="Tạo bài giảng đầu tiên, thêm slide, hình ảnh và biểu đồ rồi trình chiếu."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  newDeck()
                  saveDeck()
                }}
              >
                <Plus className="size-4" />
                Tạo bài giảng mới
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myDecks.map((d) => (
              <div
                key={d.id}
                className="group relative overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => openDeck(d)}
                  className="block w-full px-5 py-6 text-left"
                >
                  <div
                    className="mb-3 aspect-[16/9] rounded-lg border border-line"
                    style={{ background: d.theme.bg }}
                  />
                  <h3 className="font-display text-[16px] font-semibold text-ink">{d.title}</h3>
                  <p className="mt-1 text-[12px] text-ink-4">{d.slides.length} slide</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Xoá "${d.title}"?`)) deleteDeck(d.id)
                  }}
                  className="absolute right-2 top-2 rounded-md p-1.5 text-ink-3 opacity-0 transition-all hover:bg-clay-soft hover:text-clay group-hover:opacity-100"
                  aria-label="Xoá"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                newDeck()
                saveDeck()
              }}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 text-ink-3 transition-colors hover:border-clay hover:text-clay"
            >
              <Plus className="size-5" />
              <span className="text-[13px] font-semibold">Bài giảng mới</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  /* ---------------------------------------------------------------- *
   * Editor
   * ---------------------------------------------------------------- */
  const theme = deck.theme

  return (
    <div className="flex h-[calc(100dvh-68px)] flex-col bg-sunken/40">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2">
        <button
          type="button"
          onClick={() => openDeck(null as unknown as Deck)}
          className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
          title="Về danh sách"
        >
          <ChevronLeft className="size-4" />
        </button>
        <input
          value={deck.title}
          onChange={(e) => updateDeck({ title: e.target.value })}
          className="w-[260px] truncate rounded-md px-2 py-1 text-[13.5px] font-semibold text-ink outline-none hover:bg-sunken focus:bg-sunken"
        />
        <span className="text-[12px] text-ink-4">{deck.slides.length} slide</span>

        <div className="mx-1 h-4 w-px bg-line" />

        <span className="text-[12px] font-semibold text-ink-3">Chèn:</span>
        <ToolBtn icon={Type} label="Chữ" onClick={() => addElement({ id: uid(), type: 'text', x: 10, y: 44, w: 80, h: 10, text: 'Văn bản' })} />
        <ToolBtn icon={RectangleHorizontal} label="Hình chữ nhật" onClick={() => addElement({ id: uid(), type: 'shape', x: 20, y: 38, w: 60, h: 24, shape: 'rect', fill: theme.accent })} />
        <ToolBtn icon={Circle} label="Hình tròn" onClick={() => addElement({ id: uid(), type: 'shape', x: 35, y: 38, w: 30, h: 30, shape: 'ellipse', fill: theme.accent })} />
        <ToolBtn icon={Triangle} label="Tam giác" onClick={() => addElement({ id: uid(), type: 'shape', x: 35, y: 38, w: 30, h: 26, shape: 'triangle', fill: theme.accent })} />
        <ToolBtn icon={Minus} label="Mũi tên" onClick={() => addElement({ id: uid(), type: 'shape', x: 20, y: 45, w: 60, h: 8, shape: 'arrow', fill: theme.accent })} />
        <ToolBtn icon={Table2} label="Bảng" onClick={() => addElement({ id: uid(), type: 'table', x: 18, y: 32, w: 64, h: 30, rows: [['Cột 1', 'Cột 2'], ['Ô 1', 'Ô 2'], ['Ô 3', 'Ô 4']] })} />
        <ToolBtn icon={BarChart3} label="Biểu đồ" onClick={() => addElement({ id: uid(), type: 'chart', x: 22, y: 28, w: 56, h: 44, chart: { type: 'bar', data: [{ label: 'A', value: 12 }, { label: 'B', value: 24 }, { label: 'C', value: 18 }] } })} />
        <ToolBtn icon={ImageIcon} label="Hình ảnh" onClick={() => addElement({ id: uid(), type: 'image', x: 25, y: 30, w: 50, h: 40, src: '' })} />

        <div className="ml-auto flex items-center gap-2">
          <select
            value={currentSlide?.transition ?? 'none'}
            onChange={(e) =>
              currentSlide &&
              patchSlide(currentSlide.id, {
                transition: e.target.value as NonNullable<Slide['transition']>,
              })
            }
            className={cn(inputClass, 'w-auto !py-1 !text-[12.5px]')}
          >
            {TRANSITIONS.map((t) => (
              <option key={t.id} value={t.id}>
                Chuyển cảnh: {t.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={() => saveDeck()}>
            <Save className="size-3.5" />
            Lưu
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setPresentIndex(0)
              setPresenting(true)
            }}
          >
            <Play className="size-3.5" />
            Trình chiếu
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* slide list */}
        <aside className="flex w-[190px] shrink-0 flex-col border-r border-line bg-surface">
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
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    'block w-full overflow-hidden rounded-lg border-2 text-left transition-colors',
                    currentSlide?.id === s.id
                      ? 'border-clay'
                      : 'border-transparent hover:border-line-2',
                  )}
                >
                  <div
                    className="aspect-[16/9] w-full"
                    style={{ background: s.background }}
                  >
                    <div className="relative h-full w-full scale-[0.16] origin-top-left">
                      {s.elements.map((el) => (
                        <SlideElView key={el.id} el={el} />
                      ))}
                    </div>
                  </div>
                  <span className="absolute bottom-1 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {i + 1}
                  </span>
                </button>
                <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => duplicateSlide(s.id)}
                    className="rounded bg-white/85 p-1 text-ink-3 hover:text-ink"
                    title="Nhân bản"
                  >
                    <LayoutTemplate className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(s.id)}
                    className="rounded bg-white/85 p-1 text-ink-3 hover:text-clay"
                    title="Xoá"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* canvas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-2">
            <Palette className="size-3.5 text-ink-3" />
            <span className="text-[12px] font-semibold text-ink-3">Màu chủ đề</span>
            {DECK_THEMES.map((t) => (
              <button
                key={t.bg}
                type="button"
                onClick={() => {
                  updateDeck({ theme: t })
                  updateDeck({
                    slides: deck.slides.map((s) => ({ ...s, background: t.bg })),
                  })
                }}
                className={cn(
                  'size-6 rounded-full border-2 transition-transform hover:scale-110',
                  theme.bg === t.bg ? 'border-clay' : 'border-line-2',
                )}
                style={{ background: t.bg }}
                title={t.bg}
              />
            ))}
            <span className="ml-auto text-[12px] text-ink-4">
              Nhấp vào phần tử để chỉnh sửa nội dung
            </span>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="mx-auto w-full max-w-[900px]">
              {currentSlide ? (
                <div
                  className="relative aspect-[16/9] w-full overflow-hidden shadow-[0_2px_24px_-8px_rgba(35,32,28,0.25)]"
                  style={{ background: currentSlide.background }}
                >
                  {currentSlide.elements.map((el) => (
                    <EditableEl
                      key={el.id}
                      el={el}
                      theme={theme}
                      onChange={(patch) => updateElement(currentSlide.id, el.id, patch)}
                      onRemove={() => removeElement(currentSlide.id, el.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Presentation className="size-7" strokeWidth={1.4} />}
                  title="Chưa có slide nào"
                  description="Nhấn Thêm slide ở cột bên trái để bắt đầu."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Element views
 * ------------------------------------------------------------------ */
function ToolBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Type
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
    >
      <Icon className="size-4" />
    </button>
  )
}

function SlideElView({ el }: { el: SlideElement }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
  }

  if (el.type === 'text')
    return (
      <div
        style={{ ...style, color: '#000', fontFamily: 'Figtree, sans-serif', fontSize: '2.4vw', fontWeight: 600, lineHeight: 1.25, padding: '0 2%' }}
      >
        {el.text}
      </div>
    )

  if (el.type === 'shape') {
    const radius = el.shape === 'ellipse' ? '50%' : el.shape === 'round' ? '12px' : '0'
    const clip = el.shape === 'triangle'
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
          fontSize: '1.4vw',
        }}
      >
        {el.src ? <img src={el.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Hình ảnh'}
      </div>
    )

  if (el.type === 'table')
    return (
      <table
        style={{
          ...style,
          borderCollapse: 'collapse',
          fontSize: '1.1vw',
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
      <div style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` }}>
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
      <div style={{ position: 'absolute', left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <polyline points={pts.join(' ')} fill="none" stroke="#2563eb" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {data.map((d, i) => {
            const x = (i / Math.max(1, data.length - 1)) * 100
            const y = 100 - (d.value / max) * 90
            return <circle key={d.label} cx={x} cy={y} r="2.5" fill="#2563eb" vectorEffect="non-scaling-stroke" />
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

function EditableEl({
  el,
  theme,
  onChange,
  onRemove,
}: {
  el: SlideElement
  theme: { fg: string; accent: string }
  onChange: (patch: Partial<SlideElement>) => void
  onRemove: () => void
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}%`,
    top: `${el.y}%`,
    width: `${el.w}%`,
    height: `${el.h}%`,
  }

  const common = {
    style,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  }

  if (el.type === 'text')
    return (
      <div {...common}>
        <textarea
          value={el.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
          className="h-full w-full resize-none bg-transparent p-[1%] text-[2.4vw] font-semibold leading-tight outline-none"
          style={{ color: theme.fg, fontFamily: 'Figtree, sans-serif' }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-2 -top-2 hidden size-5 items-center justify-center rounded-full bg-clay text-white group-hover:flex"
        >
          <Trash2 className="size-3" />
        </button>
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
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-2 -top-2 hidden size-5 items-center justify-center rounded-full bg-clay text-white hover:flex"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    )

  if (el.type === 'table')
    return (
      <div {...common}>
        <table className="h-full w-full border-collapse text-[1.1vw]" style={{ color: theme.fg }}>
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
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-2 -top-2 hidden size-5 items-center justify-center rounded-full bg-clay text-white hover:flex"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    )

  if (el.type === 'chart')
    return (
      <div {...common}>
        <ChartView el={el} />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-2 -top-2 hidden size-5 items-center justify-center rounded-full bg-clay text-white hover:flex"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    )

  if (el.type === 'image')
    return (
      <div
        {...common}
        className="flex items-center justify-center border-2 border-dashed border-[#9ca3af] text-[1.4vw] text-[#6b7280]"
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
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-2 -top-2 hidden size-5 items-center justify-center rounded-full bg-clay text-white hover:flex"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    )

  return null
}

void MonitorPlay
void Square
