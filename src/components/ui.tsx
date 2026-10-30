import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'soft' | 'ghost' | 'outline' | 'clay' | 'quiet'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-deep text-deep-text hover:bg-ink active:bg-ink shadow-[0_1px_2px_rgba(20,24,28,0.16),0_8px_18px_-10px_rgba(20,24,28,0.4)]',
  clay:
    'bg-clay text-white hover:bg-clay-deep active:bg-clay-deep shadow-[0_1px_2px_rgba(180,83,42,0.2),0_10px_20px_-10px_rgba(180,83,42,0.5)]',
  soft: 'bg-sunken text-ink hover:bg-veil active:bg-veil',
  outline: 'border border-line-2 bg-white text-ink hover:border-ink-4 hover:bg-sunken/60',
  ghost: 'bg-transparent text-ink-2 hover:bg-sunken hover:text-ink',
  quiet: 'bg-transparent text-ink-3 hover:text-ink',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-[6px]',
  md: 'h-10.5 px-4.5 text-[14px] gap-2 rounded-[6px]',
  lg: 'h-12.5 px-6 text-[15px] gap-2.5 rounded-[8px]',
  icon: 'h-10 w-10 justify-center rounded-[6px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'soft', size = 'md', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold transition-all duration-300 select-none',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
})

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'clay' | 'sage' | 'honey' | 'outline'
  className?: string
}) {
  const tones = {
    neutral: 'bg-sunken text-ink-2',
    clay: 'bg-clay-soft text-clay',
    sage: 'bg-sage-soft text-sage',
    honey: 'bg-honey-soft text-honey',
    outline: 'border border-line-2 text-ink-3',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-4',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}) {
  return (
    <As
      className={cn(
        'rounded-[6px] bg-surface shadow-[0_1px_2px_rgba(60,48,32,0.03)]',
        className,
      )}
    >
      {children}
    </As>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[12px] text-ink-3">{hint}</span> : null}
    </label>
  )
}

/**
 * Thẻ chờ khi danh sách đang tải: cùng khung với thẻ thật để trang không nhảy khi dữ liệu về.
 * `exam` có dải đầu như thẻ đề cộng đồng, `doc` như thẻ tài liệu.
 */
export function SkeletonCard({ variant = 'doc' }: { variant?: 'doc' | 'exam' }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex flex-col overflow-hidden rounded-[8px] bg-surface p-5 shadow-[0_1px_2px_rgba(60,48,32,0.03)]"
    >
      {variant === 'exam' ? (
        <span className="-mx-5 -mt-5 mb-5 block h-[120px] bg-sunken/70" />
      ) : (
        <div className="flex items-start justify-between">
          <span className="size-10 rounded-[8px] bg-sunken" />
          <span className="h-5 w-14 rounded-full bg-sunken" />
        </div>
      )}
      <span className="block h-4 w-4/5 rounded bg-sunken" />
      <span className="mt-2 block h-4 w-3/5 rounded bg-sunken" />
      <span className="mt-3 block h-3 w-2/5 rounded bg-sunken" />
      <span className="mt-auto block h-9 w-full rounded-[6px] bg-sunken" />
      <span
        className="anim-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 motion-reduce:animation-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}
      />
    </div>
  )
}

/**
 * Ô tích thay `<input type="checkbox">` của trình duyệt. Vẫn là input thật (ẩn) nên bàn phím, đọc màn hình
 * và `label` hoạt động như cũ; dấu tick được vẽ dần khi bật. Nhận chữ làm `children`, hoặc dùng một mình với `aria-label`.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children?: ReactNode
  disabled?: boolean
  className?: string
  'aria-label'?: string
}) {
  return (
    <label
      className={cn(
        'inline-flex select-none items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] bg-white transition-[background-color,border-color,transform] duration-200 motion-reduce:transition-none',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-clay/30 peer-active:scale-90',
          checked ? 'border-clay bg-clay' : 'border-ink-4 peer-hover:border-ink-3',
        )}
      >
        <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M2.5 6.3 5 8.8l4.5-5.3"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={checked ? 0 : 1}
            className="transition-[stroke-dashoffset] duration-200 ease-out motion-reduce:transition-none"
            style={{ transitionDelay: checked ? '60ms' : '0ms' }}
          />
        </svg>
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-[6px] border border-line-2 bg-white px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-4 ' +
  'transition-all duration-200 hover:border-ink-4 focus:border-clay focus:bg-white focus:outline-none focus:ring-2 focus:ring-clay/15'

export const selectClass =
  inputClass +
  ' cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b757e\' stroke-width=\'2.2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-[right_1rem_center] bg-no-repeat pr-10'

/** same look, but sizes to its own content — for filter toolbars */
export const selectAutoClass = selectClass.replace('w-full ', 'w-auto min-w-[9rem] ')

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[7px] border border-line-2 bg-sunken px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
      {children}
    </kbd>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[8px] bg-sunken/60 px-8 py-16 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface text-ink-3 shadow-soft">
          {icon}
        </div>
      ) : null}
      <p className="font-display text-[21px] font-semibold tracking-[-0.01em] text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-[44ch] text-[13.5px] leading-relaxed text-ink-3">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
