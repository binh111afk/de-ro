/**
 * Thanh slide ở đáy trình soạn (kiểu Canva): thumbnail xếp ngang, cuộn ngang.
 * - Dấu + cuối dãy thêm slide mới.
 * - Di chuột vào khe giữa hai slide thì hiện dấu + để chèn đúng vị trí đó.
 * - Kéo thả để đổi thứ tự, giống kéo thumbnail trước đây nhưng theo chiều ngang.
 */
import { useRef, useState, type ReactNode } from 'react'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Slide } from '@/store/docs'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const count = slides.length

  return (
    <div className="flex h-[138px] shrink-0 border-t border-line bg-surface">
      <div
        ref={scrollRef}
        // bánh xe chuột cuộn ngang dãy slide (nhiều slide thì không phải kéo thanh cuộn)
        onWheel={(e) => {
          if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) scrollRef.current.scrollLeft += e.deltaY
        }}
        className="flex min-w-0 flex-1 items-center overflow-x-auto overflow-y-hidden px-2 pb-2 [scrollbar-color:var(--color-ink-3)_transparent] [scrollbar-width:thin]"
      >
        {slides.map((s, i) => (
          <div key={s.id} className="flex h-full shrink-0 items-center">
            {i > 0 && <Gap enabled={allowAdd} onAdd={() => onAddAt(i)} />}
            <div
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
              className={cn('group relative w-[132px] shrink-0', dragIndex === i && 'opacity-40')}
            >
              {dropPos === i && <span className="absolute -left-1.5 bottom-0 top-0 w-1 rounded bg-clay" />}
              {dropPos === i + 1 && i === count - 1 && (
                <span className="absolute -right-1.5 bottom-0 top-0 w-1 rounded bg-clay" />
              )}
              <button
                type="button"
                onClick={() => onSelect(s.id)}
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
              <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
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
            className="slide-skeleton ml-2 h-[74px] w-[132px] shrink-0"
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
            className="ml-2 flex h-[74px] w-[60px] shrink-0 items-center justify-center rounded-lg border border-dashed border-line-2 text-ink-3 transition-colors hover:border-clay hover:text-clay"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

/** khe giữa hai slide: rộng để con trỏ dễ rơi vào, dấu + hiện khi di chuột vào giữa khe */
function Gap({ enabled, onAdd }: { enabled: boolean; onAdd: () => void }) {
  return (
    <div className="group/gap relative h-full w-4 shrink-0 transition-[width] duration-200 ease-out hover:w-14">
      {enabled && (
        <button
          type="button"
          onClick={onAdd}
          title="Thêm slide vào đây"
          aria-label="Thêm slide vào đây"
          className="absolute left-1/2 top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-clay text-white opacity-0 shadow transition-opacity group-hover/gap:opacity-100 focus-visible:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  )
}
