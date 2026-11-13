/**
 * Khung modal chung của các công cụ: tiêu đề, cột nhập bên trái, xem trước bên
 * phải, chân có Huỷ / Chèn. Chặn sự kiện lan ra ngoài (modal có thể render qua
 * portal từ trong phần tử slide).
 */
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui'
import { svgDataUrl } from '@/lib/plot'
import { cn } from '@/lib/cn'
import type { ToolImage } from '@/lib/toolSpec'

export function ToolShell({
  title,
  hint,
  inputs,
  preview,
  emptyText = 'Chưa có gì để xem trước.',
  submitLabel,
  canSubmit,
  onSubmit,
  onClose,
  inputsWidth = 340,
  maxWidth,
  renderPreview,
  extraActions,
}: {
  title: string
  hint?: string
  inputs: ReactNode
  preview: ToolImage | null
  emptyText?: string
  submitLabel: string
  canSubmit: boolean
  onSubmit: () => void
  onClose: () => void
  inputsWidth?: number
  maxWidth?: number | string
  /** thay ảnh xem trước mặc định (vd. khung bấm/kéo để dựng hình) */
  renderPreview?: (preview: ToolImage) => ReactNode
  extraActions?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/30 p-0 md:p-4"
      onMouseDown={(e) => {
        e.stopPropagation()
        onClose()
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'anim-pop flex h-full max-h-[100dvh] w-full flex-col overflow-hidden rounded-none bg-surface shadow-float md:h-[min(660px,92vh)] md:max-h-[92vh] md:rounded-[8px]',
          !maxWidth && 'max-w-[980px]',
        )}
        style={{ maxWidth: maxWidth ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 md:px-6 md:py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
            {hint && <p className="mt-0.5 text-[12.5px] text-ink-3">{hint}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div
            className="flex shrink-0 flex-col gap-5 border-line p-5 md:w-[var(--inputs-w)] md:overflow-y-auto md:border-r"
            style={{ ['--inputs-w' as string]: `${inputsWidth}px` }}
          >
            {inputs}
          </div>
          <div
            className={cn(
              'flex h-[min(56vh,520px)] min-h-0 min-w-0 flex-1 bg-paper-2 p-4 md:h-auto',
              renderPreview && !preview ? 'flex-col items-stretch justify-start' : 'items-center justify-center',
            )}
          >
            {renderPreview ? (
              renderPreview(preview ?? ({} as ToolImage))
            ) : preview ? (
              <img
                src={svgDataUrl(preview.svg)}
                alt="Xem trước"
                className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain"
              />
            ) : (
              <p className="text-[13px] text-ink-3">{emptyText}</p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-2 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-3.5">
          <div className="flex items-center gap-2">{extraActions}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Huỷ
            </Button>
            <Button variant="clay" size="sm" disabled={!canSubmit} onClick={onSubmit}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const sectionTitle = 'mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3'

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13.5px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--color-clay)]" />
      {children}
    </label>
  )
}
