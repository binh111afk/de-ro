/**
 * Công cụ Toán: bảng xét dấu, hệ trục Oxy, thống kê. Cùng một khuôn: ô chữ
 * (mỗi dòng một hàng / một lệnh), xem trước cập nhật khi gõ, bảng lệnh mở bằng
 * dấu "?" chia nhóm.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { CircleHelp, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { renderTool, type ToolDoc, type ToolImage } from '@/lib/toolSpec'
import { autoSignTable, parseSignTableText, signTableToText, type SignTableSpec } from '@/lib/signTable'
import { OXY_HELP, type OxySpec } from '@/lib/oxy'
import type { ChartKind, StatsSpec } from '@/lib/stats'
import { Check, ToolShell, sectionTitle } from './ToolShell'

type Props<S> = { initial?: S | null; submitLabel?: string; onClose: () => void; onInsert: (img: ToolImage) => void }
type HelpGroups = Array<{ group: string; items: Array<{ code: string; what: string }> }>

/** vẽ thử; lỗi thì giữ ảnh đúng gần nhất để xem trước không nhấp nháy */
function useRender(doc: ToolDoc | null) {
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

function HelpButton({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={open}
      title={label}
      className={cn('flex size-5 items-center justify-center rounded-full transition-colors', open ? 'bg-clay text-white' : 'text-ink-3 hover:bg-sunken hover:text-clay')}
    >
      <CircleHelp className="size-4" />
    </button>
  )
}

function HelpCards({ groups, intro, onClose }: { groups: HelpGroups; intro: ReactNode; onClose: () => void }) {
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
function TextBlock({
  title,
  help,
  intro,
  value,
  onChange,
  rows,
  errors,
  label,
}: {
  title: string
  help: HelpGroups
  intro: ReactNode
  value: string
  onChange: (v: string) => void
  rows: number
  errors: string[]
  label: string
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

const SIGN_HELP: HelpGroups = [
  {
    group: 'Các dòng',
    items: [
      { code: 'x: -oo -2 1 +oo', what: 'Dòng đầu: các mốc x (oo = ∞, sqrt3 = √3, 1/2)' },
      { code: 'x+2: - 0 + . +', what: 'Hàng một nhân tử (tuỳ chọn, bao nhiêu hàng cũng được)' },
      { code: 'f(x): + 0 - || +', what: 'Hàng cuối: biểu thức cần xét dấu' },
    ],
  },
  {
    group: 'Kí hiệu trong hàng',
    items: [
      { code: '+  -', what: 'Dấu trên từng khoảng' },
      { code: '0', what: 'Tại mốc: biểu thức bằng 0' },
      { code: '||', what: 'Tại mốc: không xác định (vạch đôi)' },
      { code: '.', what: 'Tại mốc: để trống' },
    ],
  },
]

export function SignTableModal({ initial, submitLabel, onClose, onInsert }: Props<SignTableSpec>) {
  const [expr, setExpr] = useState(initial ? '' : '(x-1)(x+2)/(x-3)')
  const [exprError, setExprError] = useState<string | null>(null)
  const [text, setText] = useState(() => (initial ? signTableToText(initial) : signTableToText(autoSignTable('(x-1)(x+2)/(x-3)'))))
  const parsed = useMemo((): { spec?: SignTableSpec; error?: string } => {
    try {
      return { spec: parseSignTableText(text) }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) }
    }
  }, [text])
  const doc = useMemo((): ToolDoc | null => (parsed.spec ? { kind: 'signtable', spec: parsed.spec } : null), [parsed.spec])
  const { preview } = useRender(doc)

  const build = () => {
    try {
      setText(signTableToText(autoSignTable(expr)))
      setExprError(null)
    } catch (e) {
      setExprError(e instanceof Error ? e.message : String(e))
    }
  }

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Tạo từ biểu thức</h3>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            build()
          }}
        >
          <span className="shrink-0 font-serif text-[15px] italic text-ink-2">f(x) =</span>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            spellCheck={false}
            placeholder="vd. (x-1)(x+2)/(x-3)"
            aria-label="Biểu thức"
            className={cn(inputClass, 'h-9 px-3 py-1 font-mono text-[13.5px]', exprError && 'border-clay')}
          />
          <button type="submit" disabled={!expr.trim()} className="h-9 shrink-0 rounded-[6px] bg-clay px-3 text-[12.5px] font-semibold text-white disabled:opacity-40">
            Tạo bảng
          </button>
        </form>
        {exprError && <p className="mt-1 text-[12px] text-clay">{exprError}</p>}
        <p className="mt-1.5 text-[12px] leading-snug text-ink-4">Tích, thương ở ngoài cùng được tách thành từng hàng nhân tử.</p>
      </section>
      <TextBlock
        title="Nội dung bảng"
        help={SIGN_HELP}
        intro="Mỗi dòng một hàng, các kí hiệu cách nhau bằng dấu cách."
        value={text}
        onChange={setText}
        rows={5}
        errors={parsed.error ? [parsed.error] : []}
        label="Nội dung bảng xét dấu"
      />
    </>
  )
  return (
    <ToolShell
      title="Bảng xét dấu"
      hint="Gõ biểu thức để tạo sẵn, hoặc sửa tay từng hàng"
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

/* ------------------------------------------------------------------ *
 * Hệ trục Oxy
 * ------------------------------------------------------------------ */

const OXY_DEFAULT: OxySpec = {
  xMin: -1,
  xMax: 5,
  yMin: -1,
  yMax: 5,
  grid: false,
  numbers: true,
  items: 'x + y <= 4\nx >= 0\ny >= 0\nA(1; 2) chiếu',
}

export function OxyModal({ initial, submitLabel, onClose, onInsert }: Props<OxySpec>) {
  const [spec, setSpec] = useState<OxySpec>(initial ?? OXY_DEFAULT)
  const set = (p: Partial<OxySpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'oxy', spec }), [spec])
  const { preview } = useRender(doc)
  const errors = (preview?.errors ?? []).map((e) => `Dòng ${e.line}: ${e.msg}`)
  const range = (k: keyof OxySpec, label: string) => (
    <label className="flex items-center gap-1.5 text-[13px] text-ink-2">
      <span className="w-9 shrink-0 font-serif italic">{label}</span>
      <input
        type="number"
        value={spec[k] as number}
        onChange={(e) => e.target.value !== '' && set({ [k]: Number(e.target.value) })}
        className={cn(inputClass, 'h-8 w-full px-2 py-1 text-[13px]')}
      />
    </label>
  )
  const inputs = (
    <>
      <TextBlock
        title="Nội dung"
        help={OXY_HELP}
        intro="Mỗi dòng một lệnh. Toạ độ ghi (x; y), số thập phân dùng dấu phẩy hoặc chấm."
        value={spec.items}
        onChange={(items) => set({ items })}
        rows={7}
        errors={errors}
        label="Nội dung hệ trục"
      />
      <section>
        <h3 className={sectionTitle}>Khung hình</h3>
        <div className="grid grid-cols-2 gap-2">
          {range('xMin', 'x từ')}
          {range('xMax', 'đến')}
          {range('yMin', 'y từ')}
          {range('yMax', 'đến')}
        </div>
        <Check checked={spec.numbers} onChange={(numbers) => set({ numbers })}>Ghi số trên trục</Check>
        <Check checked={spec.grid} onChange={(grid) => set({ grid })}>Lưới ô vuông</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Hệ trục Oxy"
      hint="Điểm, vectơ, đường thẳng, đường tròn, parabol; miền nghiệm gạch bỏ phần không thoả"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview)}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Thống kê
 * ------------------------------------------------------------------ */

const CHARTS: Array<{ id: ChartKind; label: string; example: string }> = [
  { id: 'bar', label: 'Cột', example: 'Thứ 2; Thứ 3; Thứ 4; Thứ 5\nLớp 10A: 30; 25; 20; 28\nLớp 10B: 28; 22; 26; 24' },
  { id: 'line', label: 'Đường gấp khúc', example: '2019; 2020; 2021; 2022\nSản lượng: 12; 15; 14; 18' },
  { id: 'pie', label: 'Quạt tròn', example: 'Giỏi; Khá; Trung bình; Yếu\nSố học sinh: 8; 20; 10; 2' },
  { id: 'hist', label: 'Ghép nhóm', example: '[40; 50) [50; 60) [60; 70) [70; 80)\nSố học sinh: 4; 10; 14; 6' },
  { id: 'table', label: 'Bảng số liệu', example: '[40; 50) [50; 60) [60; 70) [70; 80)\nTần số: 4; 10; 14; 6' },
]

const STATS_HELP: HelpGroups = [
  {
    group: 'Dữ liệu',
    items: [
      { code: 'Thứ 2; Thứ 3; Thứ 4', what: 'Dòng nhãn (không có dấu ":"), cách nhau bằng ";"' },
      { code: 'Lớp 10A: 30; 25; 20', what: 'Một dãy số: tên, dấu ":", rồi các số' },
      { code: 'Lớp 10B: 28; 22; 26', what: 'Thêm dòng để vẽ cột ghép / nhiều đường' },
      { code: '[40; 50) [50; 60)', what: 'Ghép nhóm: ghi các khoảng, máy tự nhận' },
    ],
  },
  {
    group: 'Ghi chú',
    items: [
      { code: 'Quạt tròn', what: 'Chỉ dùng dòng số đầu tiên, tự tính phần trăm' },
      { code: 'Số thập phân', what: 'Dùng dấu phẩy hoặc chấm: 2,5 hay 2.5' },
    ],
  },
]

export function StatsModal({ initial, submitLabel, onClose, onInsert }: Props<StatsSpec>) {
  const [spec, setSpec] = useState<StatsSpec>(initial ?? { chart: 'bar', title: '', xLabel: '', yLabel: '', values: true, data: CHARTS[0].example })
  const set = (p: Partial<StatsSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'stats', spec }), [spec])
  const { preview, error } = useRender(doc)
  const field = (k: 'title' | 'xLabel' | 'yLabel', label: string, ph: string) => (
    <label className="flex flex-col gap-1 text-[12.5px] text-ink-3">
      {label}
      <input value={spec[k]} onChange={(e) => set({ [k]: e.target.value })} placeholder={ph} className={cn(inputClass, 'h-8 px-2 py-1 text-[13px]')} />
    </label>
  )
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Loại</h3>
        <div className="flex flex-wrap gap-1.5">
          {CHARTS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={spec.chart === c.id}
              onClick={() => {
                // đổi loại: nếu dữ liệu vẫn là ví dụ cũ thì thay bằng ví dụ hợp loại mới
                const isExample = CHARTS.some((x) => x.example === spec.data)
                set({ chart: c.id, ...(isExample ? { data: c.example } : {}) })
              }}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                spec.chart === c.id ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>
      <TextBlock
        title="Số liệu"
        help={STATS_HELP}
        intro="Một dòng nhãn, rồi mỗi dãy số một dòng."
        value={spec.data}
        onChange={(data) => set({ data })}
        rows={5}
        errors={error ? [error] : []}
        label="Số liệu"
      />
      <section className="flex flex-col gap-2">
        <h3 className={cn(sectionTitle, 'mb-0')}>Chữ trên hình</h3>
        {field('title', 'Tên biểu đồ', 'vd. Điểm thi môn Toán')}
        {spec.chart !== 'pie' && (
          <div className="grid grid-cols-2 gap-2">
            {field('xLabel', spec.chart === 'table' ? 'Tên hàng đầu' : 'Trục ngang', spec.chart === 'table' ? 'Nhóm' : 'vd. Lớp')}
            {spec.chart !== 'table' && field('yLabel', 'Trục đứng', 'vd. Số HS')}
          </div>
        )}
        {spec.chart !== 'table' && <Check checked={spec.values} onChange={(values) => set({ values })}>Ghi số liệu trên hình</Check>}
      </section>
    </>
  )
  return (
    <ToolShell
      title="Thống kê"
      hint="Biểu đồ in trắng đen vẫn rõ: cột tô đậm, gạch chéo, chấm để phân biệt"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật biểu đồ' : 'Chèn biểu đồ')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}
