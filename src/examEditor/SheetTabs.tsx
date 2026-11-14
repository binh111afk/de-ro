/**
 * Hàng tab trong sheet điện thoại (Mục lục / Khối mẫu / Công cụ, nhóm ribbon…):
 * nền tab đang chọn là một "thẻ" trượt sang tab mới, giống thanh tab bên máy tính.
 */
import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useSlidingThumb } from './useSlidingThumb'

export function SheetTabs<T extends string>({ items, value, onChange, className }: {
  items: { id: T; label: string; icon?: ReactNode }[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const thumb = useSlidingThumb(ref, '[aria-pressed="true"]', value)
  return (
    <div ref={ref} className={cn('relative flex items-center gap-1', className)}>
      {thumb && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 rounded-lg bg-clay-soft transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }}
        />
      )}
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          aria-pressed={value === t.id}
          className={cn(
            'relative flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            value === t.id ? 'text-clay-deep' : 'text-ink-3 hover:text-ink',
            !thumb && value === t.id && 'bg-clay-soft',
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}
