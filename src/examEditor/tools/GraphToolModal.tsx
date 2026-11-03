/**
 * Công cụ Toán: vẽ đồ thị hàm số y = f(x). Cột trái nhập hàm + miền vẽ, cột
 * phải xem trước ngay khi gõ; "Chèn" trả về SVG để trình soạn tự đưa vào.
 */
import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Plus, Trash2, X } from 'lucide-react'
import { Button, inputClass } from '@/components/ui'
import { cn } from '@/lib/cn'
import { PLOT_COLORS, autoYRange, parseExpr, renderPlotSvg, svgDataUrl, type Fn, type PlotSpec } from '@/lib/plot'

export interface PlotImage {
  svg: string
  width: number
  height: number
}

const MAX_CURVES = 4
const fmtNum = (v: number) => String(v).replace('.', ',').replace('-', '−')
const numClass = inputClass + ' h-9 px-2.5 py-1 text-center tabular-nums'

export function GraphToolModal({
  initial,
  submitLabel,
  onClose,
  onInsert,
}: {
  /** đồ thị đã chèn, mở lại để sửa */
  initial?: PlotSpec | null
  /** nhãn nút chèn (mặc định: "Cập nhật đồ thị" khi có `initial`, không thì "Chèn đồ thị") */
  submitLabel?: string
  onClose: () => void
  onInsert: (img: PlotImage) => void
}) {
  const [exprs, setExprs] = useState<string[]>(initial?.curves.map((c) => c.expr) ?? ['x^2 - 2x - 3'])
  const [xMin, setXMin] = useState(String(initial?.xMin ?? -5))
  const [xMax, setXMax] = useState(String(initial?.xMax ?? 5))
  // đồ thị cũ giữ nguyên khung đã chèn
  const [autoY, setAutoY] = useState(!initial)
  const [yMin, setYMin] = useState(String(initial?.yMin ?? -5))
  const [yMax, setYMax] = useState(String(initial?.yMax ?? 5))
  const [grid, setGrid] = useState(initial?.grid ?? true)
  const [labels, setLabels] = useState(initial?.labels ?? false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // lỗi từng ô nhập (ô trống thì bỏ qua, không báo lỗi)
  const parsed = useMemo(
    () =>
      exprs.map((e): { fn?: Fn; error?: string } => {
        if (!e.trim()) return {}
        try {
          return { fn: parseExpr(e) }
        } catch (err) {
          return { error: (err as Error).message }
        }
      }),
    [exprs],
  )

  const x0 = Number(xMin.replace(',', '.'))
  const x1 = Number(xMax.replace(',', '.'))
  const rangeError = !(Number.isFinite(x0) && Number.isFinite(x1) && x0 < x1) ? 'Miền x chưa hợp lệ' : null

  const spec = useMemo<PlotSpec | null>(() => {
    if (rangeError) return null
    const fns = parsed.map((p) => p.fn).filter((f): f is Fn => Boolean(f))
    let lo: number, hi: number
    if (autoY) [lo, hi] = autoYRange(fns, x0, x1)
    else {
      lo = Number(yMin.replace(',', '.'))
      hi = Number(yMax.replace(',', '.'))
      if (!(Number.isFinite(lo) && Number.isFinite(hi) && lo < hi)) return null
    }
    return {
      curves: exprs.map((e, i) => ({ expr: e, color: PLOT_COLORS[i % PLOT_COLORS.length] })).filter((_, i) => parsed[i].fn),
      xMin: x0,
      xMax: x1,
      yMin: lo,
      yMax: hi,
      grid,
      labels,
    }
  }, [parsed, exprs, x0, x1, autoY, yMin, yMax, grid, labels, rangeError])

  const plot = useMemo(() => (spec ? renderPlotSvg(spec) : null), [spec])
  const canInsert = Boolean(plot && spec && spec.curves.length > 0)

  // khi bật tự động, hiện miền y đang dùng trong ô (chỉ đọc)
  const shownY = autoY && spec ? [String(spec.yMin), String(spec.yMax)] : [yMin, yMax]

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/30 p-4"
      // modal có thể render qua portal từ trong phần tử slide: chặn sự kiện lan về phần tử đó
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
        aria-label="Đồ thị hàm số"
        className="anim-pop flex max-h-[92vh] w-full max-w-[920px] flex-col md:h-[min(640px,92vh)] overflow-hidden rounded-[8px] bg-surface shadow-float"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-ink">Đồ thị hàm số</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">Gõ như viết tay: x^2 - 2x + 1, sqrt(x), sin 2x, |x - 1|, 1/x</p>
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
          {/* ---------- nhập ---------- */}
          <div className="flex shrink-0 flex-col gap-5 border-line p-5 md:w-[320px] md:overflow-y-auto md:border-r">
            <section>
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">Hàm số</h3>
              <div className="flex flex-col gap-2">
                {exprs.map((e, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: PLOT_COLORS[i % PLOT_COLORS.length] }} />
                      <span className="shrink-0 font-serif text-[15px] italic text-ink-2">y =</span>
                      <input
                        value={e}
                        autoFocus={i === exprs.length - 1}
                        onChange={(ev) => setExprs(exprs.map((v, k) => (k === i ? ev.target.value : v)))}
                        spellCheck={false}
                        aria-label={`Hàm số ${i + 1}`}
                        aria-invalid={Boolean(parsed[i].error)}
                        className={cn(inputClass, 'h-9 px-3 py-1 font-mono text-[13.5px]', parsed[i].error && 'border-clay')}
                      />
                      {exprs.length > 1 && (
                        <button
                          type="button"
                          aria-label="Xoá hàm này"
                          onClick={() => setExprs(exprs.filter((_, k) => k !== i))}
                          className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-ink-4 hover:bg-sunken hover:text-ink"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {parsed[i].error && <p className="mt-1 pl-[54px] text-[12px] text-clay">{parsed[i].error}</p>}
                  </div>
                ))}
              </div>
              {exprs.length < MAX_CURVES && (
                <button
                  type="button"
                  onClick={() => setExprs([...exprs, ''])}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-sunken hover:text-ink"
                >
                  <Plus className="size-3.5" /> Thêm hàm
                </button>
              )}
            </section>

            {/* khung hình: đa số không cần chỉnh nên gập sẵn (mở sẵn khi đang sửa đồ thị cũ hoặc nhập sai) */}
            <details className="group" open={Boolean(initial) || Boolean(rangeError)}>
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3 hover:text-ink [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
                Khung hình
                {!rangeError && spec && (
                  <span className="ml-auto font-normal normal-case tracking-normal text-ink-4 tabular-nums">
                    x {fmtNum(spec.xMin)} → {fmtNum(spec.xMax)}
                  </span>
                )}
              </summary>
              <div className="mt-2.5">
              <div className="grid grid-cols-[28px_1fr_16px_1fr] items-center gap-x-2 gap-y-2 text-[13.5px] text-ink-2">
                <span className="font-serif italic">x</span>
                <input value={xMin} onChange={(e) => setXMin(e.target.value)} aria-label="x nhỏ nhất" className={numClass} />
                <span className="text-center text-ink-4">→</span>
                <input value={xMax} onChange={(e) => setXMax(e.target.value)} aria-label="x lớn nhất" className={numClass} />
                <span className="font-serif italic">y</span>
                <input value={shownY[0]} disabled={autoY} onChange={(e) => setYMin(e.target.value)} aria-label="y nhỏ nhất" className={cn(numClass, autoY && 'bg-sunken text-ink-3')} />
                <span className="text-center text-ink-4">→</span>
                <input value={shownY[1]} disabled={autoY} onChange={(e) => setYMax(e.target.value)} aria-label="y lớn nhất" className={cn(numClass, autoY && 'bg-sunken text-ink-3')} />
              </div>
              {rangeError && <p className="mt-1 text-[12px] text-clay">{rangeError}</p>}
              <Check
                checked={autoY}
                onChange={(v) => {
                  if (!v && spec) {
                    setYMin(String(spec.yMin))
                    setYMax(String(spec.yMax))
                  }
                  setAutoY(v)
                }}
              >
                Tự chọn miền y
              </Check>
              </div>
            </details>

            <section>
              <h3 className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-3">Hiển thị</h3>
              <Check checked={grid} onChange={setGrid}>Lưới ô vuông</Check>
              <Check checked={labels} onChange={setLabels}>Ghi tên hàm cạnh đồ thị</Check>
            </section>
          </div>

          {/* ---------- xem trước ---------- */}
          <div className="flex h-[min(56vh,520px)] min-h-0 min-w-0 flex-1 items-center justify-center bg-paper-2 p-5 md:h-auto">
            {plot ? (
              // co vừa cả hai chiều: khung 1:1 có thể cao hơn rộng
              <img
                src={svgDataUrl(plot.svg)}
                alt="Xem trước đồ thị"
                className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain"
              />
            ) : (
              <p className="text-[13px] text-ink-3">Kiểm tra lại miền vẽ.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Huỷ</Button>
          <Button variant="clay" size="sm" disabled={!canInsert} onClick={() => plot && onInsert(plot)}>
            {submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="mt-2 flex cursor-pointer items-center gap-2 text-[13.5px] text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--color-clay)]" />
      {children}
    </label>
  )
}
