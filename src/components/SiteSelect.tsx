import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SiteSelectOption<K extends string> {
  value: K
  label: string
}

/**
 * Ô chọn cho trang công khai (thư viện, trang chủ): cùng kiểu với ô nhập, bo góc và bóng như thẻ.
 * Có phím Esc để đóng và bấm ra ngoài để đóng. Dùng trong trình soạn thì dùng `Dropdown`.
 */
export function SiteSelect<K extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: K
  options: ReadonlyArray<SiteSelectOption<K>>
  onChange: (value: K) => void
  label: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-[6px] border border-line-2 bg-white px-4 text-[14.5px] font-semibold text-ink transition-all duration-200 hover:border-ink-4 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/15"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-ink-3 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={label}
          className="anim-pop absolute left-0 top-[calc(100%+8px)] z-30 max-h-[320px] w-max min-w-full overflow-y-auto rounded-[8px] bg-surface p-1.5 shadow-float"
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-6 whitespace-nowrap rounded-[6px] px-3.5 py-2.5 text-left text-[14.5px] transition-colors',
                    active ? 'bg-clay-soft font-semibold text-clay' : 'text-ink-2 hover:bg-sunken hover:text-ink',
                  )}
                >
                  {o.label}
                  {active ? <Check className="size-4 shrink-0" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
