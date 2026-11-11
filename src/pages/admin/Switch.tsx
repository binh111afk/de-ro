import { cn } from '@/lib/cn'

/** Công tắc Bật/Tắt gạt ngang */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}) {
  return (
    <div className="inline-flex select-none items-center gap-2.5">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40',
          disabled && 'cursor-not-allowed opacity-40',
          checked ? 'bg-clay' : 'bg-line-2 hover:bg-ink-4',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            'cursor-pointer text-[13.5px] font-medium text-ink',
            disabled && 'cursor-not-allowed opacity-40',
          )}
          onClick={() => !disabled && onChange(!checked)}
        >
          {label}
        </label>
      ) : null}
    </div>
  )
}
