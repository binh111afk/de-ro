/**
 * Thanh slide ở đáy trình soạn (kiểu Canva): thumbnail xếp ngang, cuộn ngang.
 * - Dấu + cuối dãy thêm slide mới.
 * - Di chuột vào khe giữa hai slide thì hiện dấu + để chèn đúng vị trí đó.
 * - Kéo thả để đổi thứ tự, giống kéo thumbnail trước đây nhưng theo chiều ngang.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Slide } from '@/store/docs'
import { useSlideViewport } from './useSlideViewport'

interface SlideStripProps {
  slides: Slide[]
  currentId: string | null
  /** deck HTML không cho thêm/nhân bản slide từ thanh này */
  allowAdd: boolean
  pendingCount: number
  renderThumb: (slide: Slide) => ReactNode
  onSelect: (id: string) => void
  /** thêm slide trống vào vị trí `index` (0..n) */
  onAddAt: (index: number) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onMove: (from: number, insertAt: number) => void
}

export function SlideStrip({
  slides,
  currentId,
  allowAdd,
  pendingCount,
  renderThumb,
  onSelect,
  onAddAt,
  onDuplicate,
  onRemove,
  onMove,
}: SlideStripProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  /** vị trí chèn khi kéo (0..n): khe trước slide `dropPos` */
  const [dropPos, setDropPos] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tabletCollapsed, setTabletCollapsed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const count = slides.length
  const { isPhone, isTablet, isCompact, isShort } = useSlideViewport()
  const currentIdx = Math.max(0, slides.findIndex((s) => s.id === currentId))

  // slide đang chọn đổi (thêm từ Mẫu, nhân bản, AI sinh, phím mũi tên…) thì cuộn thanh tới đúng thumbnail, chỉ theo chiều ngang
  useEffect(() => {
    const box = scrollRef.current
    const el = box?.querySelector<HTMLElement>(`[data-slide-id="${currentId}"]`)
    if (!box || !el) return
    const left = el.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft
    const view = box.clientWidth
    if (left < box.scrollLeft || left + el.offsetWidth > box.scrollLeft + view) {
      box.scrollTo({ left: left - (view - el.offsetWidth) / 2, behavior: 'smooth' })
    }
  }, [currentId, count])

  const thumbW = isPhone ? 'w-[96px]' : isTablet ? 'w-[108px]' : 'w-[132px]'
  const stripH = isPhone ? 'h-[88px]' : isTablet ? 'h-[108px]' : 'h-[138px]'
  const addBtnSize = isPhone ? 'h-[54px] w-[44px]' : isTablet ? 'h-[61px] w-[48px]' : 'h-[74px] w-[60px]'

  const stripContent = (
    <div
      ref={scrollRef}
      // bánh xe chuột cuộn ngang dãy slide (nhiều slide thì không phải kéo thanh cuộn)
      onWheel={(e) => {
        if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) scrollRef.current.scrollLeft += e.deltaY
      }}
      className="flex min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden px-2 pb-1.5 [scrollbar-color:var(--color-ink-3)_transparent] [scrollbar-width:thin]"
    >
      {slides.map((s, i) => (
        <div key={s.id} className="flex h-full shrink-0 items-center">
          {i > 0 && <Gap enabled={allowAdd && !isCompact} onAdd={() => onAddAt(i)} compact={isCompact} />}
          <div
            data-slide-id={s.id}
            draggable={!isPhone}
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
              setDropPos(e.clientX < r.left + r.width / 2 ? i : i + 1)
            }}
            onDrop={(e) => {
              if (dragIndex === null) return
              e.preventDefault()
              // Tính lại tại điểm thả: dragover cuối có thể chưa kịp commit.
              const r = e.currentTarget.getBoundingClientRect()
              onMove(dragIndex, e.clientX < r.left + r.width / 2 ? i : i + 1)
              setDragIndex(null)
              setDropPos(null)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setDropPos(null)
            }}
            className={cn('group relative shrink-0', thumbW, dragIndex === i && 'opacity-40')}
          >
            {dropPos === i && <span className="absolute -left-1.5 bottom-0 top-0 w-1 rounded bg-clay" />}
            {dropPos === i + 1 && i === count - 1 && (
              <span className="absolute -right-1.5 bottom-0 top-0 w-1 rounded bg-clay" />
            )}
            <button
              type="button"
              onClick={() => {
                onSelect(s.id)
                if (drawerOpen) setDrawerOpen(false)
              }}
              className={cn(
                'block w-full overflow-hidden rounded-md border-2 transition-colors',
                currentId === s.id ? 'border-clay' : 'border-line',
              )}
            >
              {renderThumb(s)}
              <span className="absolute bottom-1 left-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {i + 1}
              </span>
            </button>
            <div
              className={cn(
                'absolute right-1 top-1 flex gap-0.5 transition-opacity',
                isCompact && currentId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}
            >
              {allowAdd && !s.html && (
                <button
                  type="button"
                  onClick={() => onDuplicate(s.id)}
                  title="Nhân bản slide"
                  aria-label="Nhân bản slide"
                  className="rounded bg-white/85 p-1 text-ink-3 hover:text-ink"
                >
                  <Copy className="size-3" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                title="Xoá slide"
                aria-label="Xoá slide"
                className="rounded bg-white/85 p-1 text-ink-3 hover:text-clay"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {Array.from({ length: pendingCount }, (_, i) => (
        <div
          key={`pending-${i}`}
          className={cn('slide-skeleton ml-2 shrink-0', thumbW, isPhone ? 'h-[54px]' : 'h-[74px]')}
          aria-hidden="true"
          title="AI đang viết slide…"
        >
          <span className="slide-skeleton__bar slide-skeleton__bar--title" />
          <span className="slide-skeleton__bar" />
          <span className="slide-skeleton__index">{count + i + 1}</span>
        </div>
      ))}

      {allowAdd && (
        <button
          type="button"
          onClick={() => onAddAt(count)}
          title="Thêm slide"
          aria-label="Thêm slide"
          className={cn(
            'ml-2 flex shrink-0 items-center justify-center rounded-lg border border-dashed border-line-2 text-ink-3 transition-colors hover:border-clay hover:text-clay',
            addBtnSize,
          )}
        >
          <Plus className="size-4" />
        </button>
      )}
    </div>
  )

  if ((isCompact && isShort) || (isTablet && tabletCollapsed)) {
    return (
      <div className="relative flex h-[38px] shrink-0 items-center justify-between border-t border-line bg-surface px-2.5">
        <button
          type="button"
          onClick={() => (isCompact && isShort ? setDrawerOpen((v) => !v) : setTabletCollapsed(false))}
          className="flex min-h-[32px] items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-ink hover:bg-paper-2"
        >
          <span>Slide {count ? currentIdx + 1 : 0}/{count}</span>
          <ChevronUp className={cn('size-4 transition-transform', drawerOpen && 'rotate-180')} />
        </button>
        {allowAdd && (
          <button
            type="button"
            onClick={() => onAddAt(count)}
            aria-label="Thêm slide"
            className="flex min-h-[32px] items-center gap-1 rounded-md px-2 text-[12px] font-medium text-clay hover:bg-paper-2"
          >
            <Plus className="size-4" />
            <span>Thêm slide</span>
          </button>
        )}
        {drawerOpen && (
          <div className="absolute inset-x-0 bottom-full z-30 flex h-[96px] border-t border-line bg-surface shadow-[0_-8px_24px_-8px_rgb(0_0_0/0.2)]">
            {stripContent}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex shrink-0 border-t border-line bg-surface', stripH)}>
      {isTablet && (
        <button
          type="button"
          onClick={() => setTabletCollapsed(true)}
          title="Thu gọn dải slide"
          aria-label="Thu gọn dải slide"
          className="flex w-7 shrink-0 items-center justify-center border-r border-line text-ink-3 hover:bg-paper-2 hover:text-ink"
        >
          <ChevronDown className="size-4" />
        </button>
      )}
      {stripContent}
    </div>
  )
}

/**
 * khe giữa hai slide: rộng để con trỏ dễ rơi vào, dấu + hiện khi dừng chuột ở khe ~0,4 s
 * (lướt qua thì không hiện); rời chuột thì ẩn ngay.
 */
function Gap({ enabled, onAdd, compact }: { enabled: boolean; onAdd: () => void; compact?: boolean }) {
  return (
    <div className={cn('group/gap relative h-full shrink-0 transition-[width] duration-200 ease-out', compact ? 'w-2' : 'w-4 hover:w-14 hover:delay-[400ms]')}>
      {enabled && (
        <button
          type="button"
          onClick={onAdd}
          title="Thêm slide vào đây"
          aria-label="Thêm slide vào đây"
          className="absolute left-1/2 top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-clay text-white opacity-0 shadow transition-opacity group-hover/gap:opacity-100 group-hover/gap:delay-[400ms] focus-visible:opacity-100 focus-visible:delay-0"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  )
}
