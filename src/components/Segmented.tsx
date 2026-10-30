import { useRef, type ReactNode } from 'react'
import { useSlidingThumb } from '@/examEditor/useSlidingThumb'
import { cn } from '@/lib/cn'

/** Thanh chọn một trong vài mục (chữ + số đếm tuỳ chọn); thẻ trắng trượt tới mục đang chọn, cùng kiểu nút chuyển lưới/danh sách ở trang Cộng đồng. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Array<{ key: T; label: string; count?: number; icon?: ReactNode }>
  onChange: (v: T) => void
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(ref, '[aria-checked="true"]', value)
  return (
    <div ref={ref} role="radiogroup" aria-label={label} className="relative inline-flex h-11 max-w-full items-center rounded-[8px] bg-sunken p-[3px]">
      {thumb ? (
        <span
          aria-hidden
          className="absolute inset-y-[3px] left-0 rounded-[6px] bg-surface shadow-soft transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
        />
      ) : null}
      {options.map((o) => {
        const active = value === o.key
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className={cn(
              'relative z-10 flex h-full items-center gap-2 rounded-[6px] px-4 text-[13.5px] font-semibold transition-colors duration-200 active:scale-[0.97]',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined ? <span className="tnum text-[12px] font-medium text-ink-4">{o.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
