/**
 * Dropdown thay thế <select> native — port theo `packages/ui/src/dropdown.tsx`
 * của GenOffice: trigger có viền (giá trị hiện tại + caret) mở popover tùy chọn.
 *
 * Khác <select> native: popover do app vẽ nên theo theme, không bị container
 * `overflow: hidden` của ribbon cắt, và hỗ trợ phím mũi tên / Enter / Esc /
 * Home / End khi trigger đang giữ focus.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface DropdownOption<K extends string = string> {
  value: K
  /** nhãn hiển thị khi không có `render`, đồng thời là aria-label */
  label: string
  /** nội dung tùy chỉnh (preview font, icon…) */
  render?: ReactNode
  disabled?: boolean
}

function nextEnabled(options: ReadonlyArray<DropdownOption>, start: number, step: 1 | -1): number {
  for (let i = start; i >= 0 && i < options.length; i += step) {
    if (!options[i].disabled) return i
  }
  return -1
}

export function Dropdown<K extends string>({
  value,
  options,
  onPick,
  className,
  ariaLabel,
  disabled,
  width,
}: {
  value: K
  options: ReadonlyArray<DropdownOption<K>>
  onPick: (value: K) => void
  className?: string
  ariaLabel?: string
  disabled?: boolean
  /** bề rộng trigger (px) — thay cho class cố định */
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => {
    const i = options.findIndex((o) => o.value === value)
    return i >= 0 ? i : 0
  })
  const [popPos, setPopPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const selected = options.find((o) => o.value === value)

  // neo popover theo tọa độ trigger (position: fixed) — thoát khỏi mọi
  // overflow clipping của ribbon body, đúng cách GenOffice làm với dropdown.
  useLayoutEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPopPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
  }, [open])

  // giữ vị trí đúng khi cuộn/resize
  useEffect(() => {
    if (!open) return
    const sync = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setPopPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
    }
    window.addEventListener('scroll', sync, true)
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('scroll', sync, true)
      window.removeEventListener('resize', sync)
    }
  }, [open])

  // đồng bộ active theo value khi đóng/mở
  useEffect(() => {
    if (!open) return
    const i = options.findIndex((o) => o.value === value)
    setActive(i >= 0 ? i : 0)
  }, [open, value, options])

  // click ngoài để đóng
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // cuộn mục active vào tầm nhìn
  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const pick = (i: number) => {
    const opt = options[i]
    if (!opt || opt.disabled) return
    onPick(opt.value)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((a) => nextEnabled(options, Math.min(a + 1, options.length - 1), 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((a) => nextEnabled(options, Math.max(a - 1, 0), -1))
        break
      case 'Home':
        e.preventDefault()
        setActive(nextEnabled(options, 0, 1))
        break
      case 'End':
        e.preventDefault()
        setActive(nextEnabled(options, options.length - 1, -1))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        pick(active)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div className={cn('gs-dd', className)} ref={rootRef} style={width ? { width } : undefined}>
      <button
        ref={triggerRef}
        type="button"
        className={cn('gs-dd-trigger', open && 'open')}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? selected?.label}
        aria-controls={open ? id : undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="gs-dd-value">{selected?.render ?? selected?.label ?? value}</span>
        <span className="gs-dd-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && popPos && (
        <div
          className="gs-dd-pop"
          role="listbox"
          id={id}
          ref={listRef}
          aria-label={ariaLabel}
          style={{ position: 'fixed', top: popPos.top, left: popPos.left, width: popPos.width }}
        >
          {options.map((o, i) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              data-active={i === active}
              className={cn(
                'gs-dd-item',
                o.value === value && 'selected',
                i === active && 'active',
                o.disabled && 'disabled',
              )}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(i)
              }}
            >
              {o.render ?? o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
