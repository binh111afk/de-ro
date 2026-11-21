import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from './ui'

export interface SiteSelectOption<K extends string> {
  value: K
  label: string
}

const fold = (text: string) => text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd')

/** Ô chọn dùng chung. Trong vùng cuộn, `inline` dành chỗ cho danh sách ngay dưới nút. */
export function SiteSelect<K extends string>({
  value,
  options,
  onChange,
  label,
  className,
  inline = false,
  searchable = false,
  up = false,
  triggerClassName,
}: {
  value: K
  options: ReadonlyArray<SiteSelectOption<K>>
  onChange: (value: K) => void
  label: string
  className?: string
  inline?: boolean
  searchable?: boolean
  /** danh sách mở lên trên nút (nút nằm sát đáy khung) */
  up?: boolean
  /** thay kiểu mặc định của nút (vd nút nhỏ trong thanh công cụ) */
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)
  const needle = fold(query.trim())
  const visible = searchable && needle ? options.filter((o) => fold(o.label).includes(needle)) : options

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    if (inline) root?.scrollIntoView({ block: 'nearest' })
    searchRef.current?.focus({ preventScroll: true })
    const onDown = (e: MouseEvent) => {
      if (!root?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (inline) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (inline || searchable) triggerRef.current?.focus({ preventScroll: true })
      setOpen(false)
    }
    // capture: vẫn nhận được khi khung chứa (vd BankModal) chặn mousedown bằng stopPropagation,
    // nếu không thì mở ô khác mà ô cũ không đóng
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [inline, open, searchable])

  const pick = (option: SiteSelectOption<K>) => {
    onChange(option.value)
    setOpen(false)
    if (inline || searchable) triggerRef.current?.focus({ preventScroll: true })
  }

  const moveFocus = (e: ReactKeyboardEvent) => {
    const buttons = Array.from(listRef.current?.querySelectorAll('button') ?? [])
    if (!buttons.length) return
    const index = buttons.indexOf(e.target as HTMLButtonElement)
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1
      : e.key === 'ArrowDown' ? Math.min(index + 1, buttons.length - 1)
      : e.key === 'ArrowUp' ? (index < 0 ? buttons.length - 1 : Math.max(index - 1, 0)) : -1
    if (next < 0) return
    e.preventDefault()
    buttons[next].focus()
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onBlur={inline || searchable ? (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      } : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          setQuery('')
          setOpen(!open)
        }}
        onKeyDown={inline && open ? moveFocus : undefined}
        className={triggerClassName ?? cn(
          'flex w-full items-center justify-between rounded-[6px] border border-line-2 bg-white font-semibold text-ink transition-all duration-200 hover:border-ink-4 focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/15',
          inline ? 'h-8 gap-2 px-2 text-[13px]' : 'h-11 gap-3 px-4 text-[14.5px]',
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={cn('shrink-0 transition-transform duration-200', triggerClassName ? 'size-3.5' : 'size-4 text-ink-3', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div
          className={cn(
            'rounded-[8px] bg-surface p-1.5 shadow-float',
            inline ? 'mt-1 w-full border border-line'
              : up ? 'anim-pop-up absolute bottom-[calc(100%+10px)] left-0 z-30 w-max min-w-[9.5rem] border border-line'
              : 'anim-pop absolute left-0 top-[calc(100%+8px)] z-30 w-max min-w-full',
          )}
        >
          {searchable && (
            <input
              ref={searchRef}
              type="search"
              aria-label={`Tìm ${label.toLowerCase()}`}
              placeholder="Tìm kiếm…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || !visible.length) return
                if (e.key === 'ArrowDown') moveFocus(e)
                if (e.key === 'Enter' && needle) {
                  e.preventDefault()
                  pick(visible[0])
                }
              }}
              className={cn(inputClass, 'mb-1 h-8 px-2 py-1 text-[13px]')}
            />
          )}
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            onKeyDown={inline || searchable ? moveFocus : undefined}
            className={cn('overflow-y-auto', inline ? 'max-h-[min(14rem,35dvh)] overscroll-contain' : 'max-h-[308px]')}
          >
            {visible.map((o) => {
              const active = o.value === value
              return (
                <li key={o.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(o)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-[6px] text-left transition-colors',
                      inline ? 'min-h-8 gap-2 px-2 py-1 text-[13px] break-words'
                        : up ? 'min-h-8 gap-4 whitespace-nowrap px-2.5 py-1.5 text-[13px]'
                        : 'gap-6 whitespace-nowrap px-3.5 py-2.5 text-[14.5px]',
                      active ? 'bg-clay-soft font-semibold text-clay' : 'text-ink-2 hover:bg-sunken hover:text-ink',
                    )}
                  >
                    <span className="min-w-0">{o.label}</span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
          {visible.length === 0 && <p role="status" className="px-2 py-1 text-[13px] text-ink-3">Không tìm thấy</p>}
        </div>
      ) : null}
    </div>
  )
}
