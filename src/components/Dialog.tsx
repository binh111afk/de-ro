import { useEffect, useId, useRef, useState } from 'react'
import { create } from 'zustand'
import { Button, inputClass } from '@/components/ui'

/**
 * Hộp thoại thay alert / confirm / prompt của trình duyệt. Dùng như hàm bất đồng bộ:
 *   if (!(await dialog.confirm('Xoá đề này?', { title: 'Xoá đề', danger: true }))) return
 * `<DialogHost />` gắn một lần ở App; hộp mở cùng lúc được xếp hàng, không chồng lên nhau.
 */
interface Options {
  title?: string
  /** nhãn nút xác nhận (mặc định: Đồng ý / Đã hiểu / Lưu) */
  confirmLabel?: string
  cancelLabel?: string
  /** việc không hoàn tác được: nút xác nhận màu đất */
  danger?: boolean
  /** chỉ prompt */
  label?: string
  defaultValue?: string
  placeholder?: string
}

type Spec = Options & { id: number; kind: 'alert' | 'confirm' | 'prompt'; message: string; resolve: (v: never) => void }

const useDialogs = create<{ queue: Spec[] }>(() => ({ queue: [] }))
let seq = 0

function open<T>(kind: Spec['kind'], message: string, o: Options = {}) {
  return new Promise<T>((resolve) => {
    const spec = { ...o, id: ++seq, kind, message, resolve: resolve as (v: never) => void }
    useDialogs.setState((s) => ({ queue: [...s.queue, spec] }))
  })
}

export const dialog = {
  alert: (message: string, o?: Options) => open<void>('alert', message, o),
  confirm: (message: string, o?: Options) => open<boolean>('confirm', message, o),
  /** Trả chuỗi người dùng nhập, hoặc `null` khi huỷ. */
  prompt: (message: string, o?: Options) => open<string | null>('prompt', message, o),
}

export function DialogHost() {
  const spec = useDialogs((s) => s.queue[0])
  if (!spec) return null
  return <DialogView key={spec.id} spec={spec} />
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

function DialogView({ spec }: { spec: Spec }) {
  const { kind, title, message, danger } = spec
  const [value, setValue] = useState(spec.defaultValue ?? '')
  const box = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const bodyId = useId()

  const close = (result: unknown) => {
    useDialogs.setState((s) => ({ queue: s.queue.slice(1) }))
    spec.resolve(result as never)
  }
  const cancel = () => close(kind === 'confirm' ? false : kind === 'prompt' ? null : undefined)
  const accept = () => close(kind === 'confirm' ? true : kind === 'prompt' ? value : undefined)

  // mở: nhớ chỗ đang focus, đưa focus vào hộp; đóng: trả lại
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const first = kind === 'prompt' ? box.current?.querySelector('input') : box.current?.querySelector<HTMLElement>('[data-autofocus]')
    first?.focus()
    if (first instanceof HTMLInputElement) first.select()
    return () => before?.focus?.()
  }, [kind])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      return cancel()
    }
    if (e.key === 'Enter' && kind === 'prompt') {
      e.preventDefault()
      return accept()
    }
    if (e.key !== 'Tab') return
    // giữ Tab trong hộp
    const items = [...(box.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    if (!items.length) return
    const last = items.length - 1
    if (e.shiftKey && document.activeElement === items[0]) {
      e.preventDefault()
      items[last].focus()
    } else if (!e.shiftKey && document.activeElement === items[last]) {
      e.preventDefault()
      items[0].focus()
    }
  }

  const confirmText = spec.confirmLabel ?? (kind === 'alert' ? 'Đã hiểu' : kind === 'prompt' ? 'Lưu' : 'Đồng ý')

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-ink/40 px-5 py-8 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && kind !== 'alert') cancel()
      }}
    >
      <div
        ref={box}
        role={kind === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={bodyId}
        onKeyDown={onKeyDown}
        className="anim-sheet my-auto w-full max-w-[440px] rounded-[8px] bg-surface p-6 shadow-float sm:p-7"
      >
        {title ? <h2 id={titleId} className="font-display text-[20px] font-semibold leading-snug text-ink">{title}</h2> : null}
        <p
          id={bodyId}
          className={`whitespace-pre-line break-words text-[14.5px] leading-relaxed text-ink-2 ${title ? 'mt-2' : ''}`}
        >
          {message}
        </p>

        {kind === 'prompt' ? (
          <label className="mt-5 block">
            {spec.label ? <span className="eyebrow mb-2 block">{spec.label}</span> : null}
            <input
              type="text"
              value={value}
              placeholder={spec.placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          {kind !== 'alert' ? (
            <Button data-autofocus={danger ? '' : undefined} variant="soft" onClick={cancel}>
              {spec.cancelLabel ?? 'Huỷ'}
            </Button>
          ) : null}
          <Button data-autofocus={danger ? undefined : ''} variant={danger ? 'clay' : 'primary'} onClick={accept}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
