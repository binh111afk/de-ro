/**
 * Công cụ Toán: bảng biến thiên. Gõ hàm số → "Tạo bảng" điền sẵn ô nhập; hoặc
 * gõ thẳng ba dòng x / y' / y bằng phím thường (oo = ∞, sqrt3 = √3), xem trước
 * cập nhật ngay khi gõ.
 */
import { useMemo, useState } from 'react'
import { CircleHelp, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { autoVarTable, parseVarTableText, varTableToText, type VarTableSpec } from '@/lib/varTable'
import { renderTool, type ToolImage } from '@/lib/toolSpec'
import { ToolShell, sectionTitle } from './ToolShell'

const HELP = (
  <>
    <ul className="list-disc space-y-0.5 pl-4">
      <li>Mỗi dòng là một hàng của bảng, các giá trị cách nhau bằng <b>dấu cách</b>.</li>
      <li>
        Dòng <code className="font-mono">y'</code>: dấu từng khoảng xen với điểm giữa — <code className="font-mono">0</code> tại cực trị,{' '}
        <code className="font-mono">||</code> chỗ không xác định.
      </li>
      <li>
        Ở điểm <code className="font-mono">||</code>, dòng y ghi giới hạn <code className="font-mono">trái||phải</code>.
      </li>
      <li>
        <code className="font-mono">oo</code> = ∞, <code className="font-mono">sqrt3</code> = √3, phân số <code className="font-mono">1/2</code>, thập phân{' '}
        <code className="font-mono">0,5</code>.
      </li>
    </ul>
    <p className="mb-1 mt-2 font-semibold text-ink-2">Ví dụ có tiệm cận đứng</p>
    <pre className="font-mono text-[12px] text-ink-2">{"x: -oo 1 +oo\ny': - || -\ny: 2 -oo||+oo 2"}</pre>
  </>
)

const EXAMPLE = "x: -oo -1 1 +oo\ny': + 0 - 0 +\ny: -oo 4 0 +oo"

export function VarTableModal({
  initial,
  submitLabel,
  onClose,
  onInsert,
}: {
  initial?: VarTableSpec | null
  submitLabel?: string
  onClose: () => void
  onInsert: (img: ToolImage) => void
}) {
  const [expr, setExpr] = useState(initial ? '' : 'x^3 - 3x + 2')
  const [exprError, setExprError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [text, setText] = useState(initial ? varTableToText(initial) : EXAMPLE)

  // đọc ô nhập; sai thì giữ bảng đúng gần nhất để xem trước không nhấp nháy
  const parsed = useMemo((): { spec?: VarTableSpec; error?: string } => {
    try {
      return { spec: parseVarTableText(text) }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  }, [text])
  const [lastGood, setLastGood] = useState<VarTableSpec | null>(null)
  if (parsed.spec && parsed.spec !== lastGood) setLastGood(parsed.spec)
  const spec = parsed.spec ?? lastGood
  const preview = useMemo(() => (spec ? renderTool({ kind: 'vartable', spec }) : null), [spec])

  const build = () => {
    try {
      setText(varTableToText(autoVarTable(expr)))
      setExprError(null)
    } catch (err) {
      setExprError(err instanceof Error ? err.message : String(err))
    }
  }

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Tạo từ hàm số</h3>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            build()
          }}
        >
          <span className="shrink-0 font-serif text-[15px] italic text-ink-2">y =</span>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            spellCheck={false}
            placeholder="vd. (2x+1)/(x-1)"
            aria-label="Hàm số"
            className={cn(inputClass, 'h-9 px-3 py-1 font-mono text-[13.5px]', exprError && 'border-clay')}
          />
          <button type="submit" disabled={!expr.trim()} className="h-9 shrink-0 rounded-[6px] bg-clay px-3 text-[12.5px] font-semibold text-white disabled:opacity-40">
            Tạo bảng
          </button>
        </form>
        {exprError && <p className="mt-1 text-[12px] text-clay">{exprError}</p>}
        <p className="mt-1.5 text-[12px] leading-snug text-ink-4">Máy tự tìm cực trị, tiệm cận đứng, giới hạn rồi điền vào ô dưới.</p>
      </section>

      <section className="relative">
        <div className="mb-2 flex items-center gap-1.5">
          <h3 className={cn(sectionTitle, 'mb-0')}>Nội dung bảng</h3>
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-expanded={helpOpen}
            aria-label="Cách gõ nội dung bảng"
            data-tip="Cách gõ"
            className={cn(
              'flex size-5 items-center justify-center rounded-full transition-colors',
              helpOpen ? 'bg-clay-tint text-clay' : 'text-ink-4 hover:bg-sunken hover:text-ink',
            )}
          >
            <CircleHelp className="size-4" />
          </button>
        </div>
        {helpOpen && (
          <div
            role="dialog"
            aria-label="Cách gõ"
            className="absolute left-0 right-0 top-7 z-10 rounded-[6px] border border-line bg-surface px-3 py-2.5 text-[12px] leading-relaxed text-ink-3 shadow-[0_8px_24px_-6px_rgba(35,32,28,0.3)]"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="font-semibold text-ink-2">Cách gõ</p>
              <button type="button" aria-label="Đóng" onClick={() => setHelpOpen(false)} className="rounded p-0.5 text-ink-4 hover:bg-sunken hover:text-ink">
                <X className="size-3.5" />
              </button>
            </div>
            {HELP}
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={4}
          aria-label="Nội dung bảng biến thiên"
          aria-invalid={Boolean(parsed.error)}
          className={cn(inputClass, 'resize-y px-3 py-2 font-mono text-[13.5px] leading-relaxed', parsed.error && 'border-clay')}
        />
        {parsed.error && <p className="mt-1 text-[12px] leading-snug text-clay">{parsed.error}</p>}

      </section>
    </>
  )

  return (
    <ToolShell
      title="Bảng biến thiên"
      hint="Ba hàng x, y′, y kiểu SGK: mũi tên lên là đồng biến, xuống là nghịch biến"
      inputs={inputs}
      inputsWidth={400}
      preview={preview}
      emptyText="Gõ nội dung bảng để xem trước."
      submitLabel={submitLabel ?? (initial ? 'Cập nhật bảng' : 'Chèn bảng')}
      canSubmit={Boolean(parsed.spec && preview)}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}
