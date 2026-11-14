/** Khuôn dùng chung của các hộp công cụ: xem trước, nút "?" + bảng lệnh, ô chữ nhiều dòng. */
import { useMemo, useState, type ReactNode } from 'react'
import { CircleHelp, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { renderTool, type ToolDoc, type ToolImage } from '@/lib/toolSpec'
import { sectionTitle } from './ToolShell'

export type Props<S> = { initial?: S | null; submitLabel?: string; onClose: () => void; onInsert: (img: ToolImage) => void }
export type HelpGroups = Array<{ group: string; items: Array<{ code: string; what: string }> }>

/** vẽ thử; lỗi thì giữ ảnh đúng gần nhất để xem trước không nhấp nháy */
export function useRender(doc: ToolDoc | null) {
  const res = useMemo((): { img?: ToolImage; error?: string } => {
    if (!doc) return {}
    try {
      return { img: renderTool(doc) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [doc])
  const [last, setLast] = useState<ToolImage | null>(null)
  if (res.img && res.img !== last) setLast(res.img)
  return { preview: res.img ?? last, error: res.error, ok: Boolean(res.img) }
}

export function HelpButton({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={open}
      data-tip={label}
      className={cn('flex size-5 items-center justify-center rounded-full transition-colors', open ? 'bg-clay text-white' : 'text-ink-3 hover:bg-sunken hover:text-clay')}
    >
      <CircleHelp className="size-4" />
    </button>
  )
}

export function HelpCards({ groups, intro, onClose }: { groups: HelpGroups; intro: ReactNode; onClose: () => void }) {
  return (
    <div className="mb-3 rounded-[8px] border border-line bg-surface p-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[12.5px] text-ink-2">{intro}</p>
        <button type="button" onClick={onClose} aria-label="Đóng hướng dẫn" className="rounded p-0.5 text-ink-3 hover:bg-sunken hover:text-ink">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.group}>
            <h4 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-clay">{g.group}</h4>
            <ul className="flex flex-col gap-1">
              {g.items.map((it) => (
                <li key={it.code} className="rounded-[6px] bg-sunken px-2.5 py-1.5">
                  <code className="block whitespace-pre-wrap font-mono text-[12.5px] text-ink">{it.code}</code>
                  <span className="text-[11.5px] text-ink-3">{it.what}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/** ô chữ có tiêu đề + nút "?" + báo lỗi */
export function TextBlock({
  title,
  help,
  intro,
  value,
  onChange,
  rows,
  errors,
  label,
  placeholder,
}: {
  title: string
  help: HelpGroups
  intro: ReactNode
  value: string
  onChange: (v: string) => void
  rows: number
  errors: string[]
  label: string
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5">
        <h3 className={cn(sectionTitle, 'mb-0')}>{title}</h3>
        <HelpButton open={open} onToggle={() => setOpen((v) => !v)} label="Cách gõ" />
      </div>
      {open && <HelpCards groups={help} intro={intro} onClose={() => setOpen(false)} />}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        rows={rows}
        aria-label={label}
        aria-invalid={errors.length > 0}
        className={cn(inputClass, 'w-full resize-y px-3 py-2 font-mono text-[13px] leading-relaxed', errors.length > 0 && 'border-clay')}
      />
      {errors.length > 0 && (
        <ul className="mt-1 flex flex-col gap-0.5 text-[12px] leading-snug text-clay-deep">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Bảng xét dấu
 * ------------------------------------------------------------------ */
