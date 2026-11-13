/**
 * Công cụ Toán: bảng xét dấu, hệ trục Oxy, thống kê. Cùng một khuôn: ô chữ
 * (mỗi dòng một hàng / một lệnh), xem trước cập nhật khi gõ, bảng lệnh mở bằng
 * dấu "?" chia nhóm.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleHelp, X, CheckCheck, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { renderTool, type ToolDoc, type ToolImage } from '@/lib/toolSpec'
import { svgDataUrl } from '@/lib/plot'
import { LabelPreview } from './LabelDragPreview'
import { TrigPickPreview } from './TrigPickPreview'
import { autoSignTable, parseSignTableText, signTableToText, type SignTableSpec } from '@/lib/signTable'
import { OXY_HELP, type OxySpec } from '@/lib/oxy'
import type { ChartKind, StatsSpec } from '@/lib/stats'
import { CIRCUIT_HELP, type CircuitSpec } from '@/lib/circuit'
import type { Dir, InclineSpec, MotionSpec } from '@/lib/physics'
import { GAS_DEFAULT, type GasAxes, type GasSpec } from '@/lib/gas'
import { SCENE_DEFAULT, SCENE_HELP, type SceneSpec } from '@/lib/scene'
import type { ChemGraphSpec, ElectronSpec, StructSpec } from '@/lib/chem'
import type { NumberLineSpec, TreeSpec, TrigSpec, VennSpec } from '@/lib/mathExtra'
import { CHEMEQ_DEFAULT, type ChemEqSpec } from '@/lib/chemEq'
import { groupedStats, parseGroups, round2, type GroupedSpec, type GroupedView } from '@/lib/grouped'
import { TABLE_DEFAULT, parseCells, parseMerges, type TableAlign, type TableBorder, type TableHeader, type TableSpec } from '@/lib/table'
import { OSC_DEFAULT, OSC_Y_DEFAULT, formatOmega, oscEquation, oscParams, oscPeriod, parseOscExpr, type OscQty, type OscSpec, type OscStart, type OscStartX0 } from '@/lib/oscillation'
import { PHASE_DEFAULT, type PhaseSpec } from '@/lib/phaseChange'
import { calcLens, fmtLensNum, LENS_DEFAULT, type LensNames, type LensRay, type LensSpec } from '@/lib/lens'
import { Segmented } from '@/components/Segmented'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { PEDIGREE_SAMPLE, PEDIGREE_SAMPLE_TWINS, type PedigreeSpec } from '@/lib/pedigree'
import { PUNNETT_DEFAULT, exportPunnettToText, parsePunnettCross, type GeneTrait, type PunnettSpec } from '@/lib/punnett'
import { DEFAULT_FOODWEB_CHAIN, DEFAULT_FOODWEB_GRASSLAND, FOODWEB_HELP, type FoodWebSpec } from '@/lib/foodweb'

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
  const [move, setMove] = useState(false)
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
      renderPreview={(img) => (
        <LabelPreview
          img={img}
          labelPos={spec.labelPos}
          onChange={(labelPos) => set({ labelPos })}
          move={move}
          onToggle={() => setMove((v) => !v)}
          fallback={<img src={svgDataUrl(img.svg)} alt="Xem trước" className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain" />}
        />
      )}
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
  const [move, setMove] = useState(false)
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
      renderPreview={(img) =>
        spec.chart === 'table' ? (
          // bảng số liệu không có nhãn kéo được → xem thường
          <img src={svgDataUrl(img.svg)} alt="Xem trước" className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain" />
        ) : (
          <LabelPreview
            img={img}
            labelPos={spec.labelPos}
            onChange={(labelPos) => set({ labelPos })}
            move={move}
            onToggle={() => setMove((v) => !v)}
            fallback={<img src={svgDataUrl(img.svg)} alt="Xem trước" className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain" />}
          />
        )
      }
    />
  )
}

const GROUPED_VIEWS: Array<{ id: GroupedView; label: string }> = [
  { id: 'htable', label: 'Bảng ngang' },
  { id: 'vtable', label: 'Bảng dọc' },
  { id: 'hist', label: 'Biểu đồ cột liền' },
]

const GROUPED_HELP: HelpGroups = [
  {
    group: 'Nhập nhóm (mỗi dòng một nhóm)',
    items: [
      { code: '[150; 155): 5', what: 'Nhóm nửa mở [a; b) : tần số' },
      { code: '[170; 175]: 4', what: 'Nhóm cuối có thể là đoạn đóng [a; b]' },
      { code: '[1,5; 2): 8', what: 'Dùng dấu phẩy thập phân kiểu Việt Nam' },
    ],
  },
  {
    group: 'Kiểu hiển thị',
    items: [
      { code: 'Bảng ngang', what: 'Hàng 1 các nhóm, hàng 2 tần số (kiểu SGK, mặc định)' },
      { code: 'Bảng dọc', what: 'Mỗi nhóm một hàng' },
      { code: 'Biểu đồ cột liền', what: 'Histogram: cột sát nhau, trục ghi mốc đầu mút; tuỳ chọn đa giác tần số' },
    ],
  },
  {
    group: 'Tuỳ chọn bảng',
    items: [
      { code: 'Giá trị đại diện', what: 'Trung điểm của mỗi nhóm' },
      { code: 'Tần số tích luỹ', what: 'Cộng dồn từ nhóm đầu' },
      { code: 'Tần số tương đối (%)', what: 'Tần số chia n nhân 100' },
      { code: 'Cột/hàng Tổng', what: 'Ghi n ở cuối bảng' },
    ],
  },
]

export function GroupedModal({ initial, submitLabel, onClose, onInsert }: Props<GroupedSpec>) {
  const [spec, setSpec] = useState<GroupedSpec>(
    initial ?? {
      groups: '[150; 155): 4\n[155; 160): 10\n[160; 165): 14\n[165; 170): 8\n[170; 175]: 4',
      label: 'Chiều cao (cm)',
      freqLabel: 'Số học sinh',
      view: 'htable',
      polygon: false,
      extras: '',
    },
  )
  const set = (p: Partial<GroupedSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'grouped', spec }), [spec])
  const { preview, error } = useRender(doc)
  const field = (k: 'label' | 'freqLabel', label: string, ph: string) => (
    <label className="flex flex-col gap-1 text-[12.5px] text-ink-3">
      {label}
      <input value={spec[k]} onChange={(e) => set({ [k]: e.target.value })} placeholder={ph} className={cn(inputClass, 'h-8 px-2 py-1 text-[13px]')} />
    </label>
  )
  const toggleExtra = (extras: string, key: string, on: boolean) => {
    const s = new Set(extras.split(/[,\s]+/).filter(Boolean))
    if (on) s.add(key)
    else s.delete(key)
    return [...s].join(',')
  }
  const isTable = spec.view !== 'hist'
  // ô "Tính giúp" chỉ hiện trong form (không vẽ lên hình để tránh lộ đáp án)
  const tinh = useMemo(() => {
    try {
      const s = groupedStats(parseGroups(spec.groups))
      return [
        ['Cỡ mẫu n', String(s.n)],
        ['Số trung bình', round2(s.mean)],
        ['Trung vị', round2(s.median)],
        ['Q1', round2(s.q1)],
        ['Q3', round2(s.q3)],
        ['Mốt', round2(s.mode)],
        ['Khoảng biến thiên', round2(s.range)],
        ['Khoảng tứ phân vị', round2(s.iqr)],
        ['Phương sai s²', round2(s.variance)],
        ['Độ lệch chuẩn s', round2(s.sd)],
      ] as Array<[string, string]>
    } catch {
      return null
    }
  }, [spec.groups])
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Kiểu hiển thị</h3>
        <div className="flex flex-wrap gap-1.5">
          {GROUPED_VIEWS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={spec.view === c.id}
              onClick={() => set({ view: c.id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                spec.view === c.id ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>
      <TextBlock
        title="Các nhóm"
        help={GROUPED_HELP}
        intro="Mỗi dòng một nhóm: [a; b): tần số. Nhóm cuối có thể đóng [a; b]."
        value={spec.groups}
        onChange={(groups) => set({ groups })}
        rows={5}
        errors={error ? [error] : []}
        label="Các nhóm"
      />
      <section className="grid grid-cols-2 gap-2">
        {field('label', 'Tên đại lượng', 'vd. Chiều cao (cm)')}
        {field('freqLabel', 'Tên tần số', 'Số học sinh')}
      </section>
      <section className="space-y-2">
        <h3 className={cn(sectionTitle, 'mb-0')}>{isTable ? 'Hàng / cột phụ' : 'Tuỳ chọn'}</h3>
        {isTable && (
          <>
            <Check checked={spec.extras.includes('mid')} onChange={(v) => set({ extras: toggleExtra(spec.extras, 'mid', v) })}>Giá trị đại diện (trung điểm)</Check>
            <Check checked={spec.extras.includes('cum')} onChange={(v) => set({ extras: toggleExtra(spec.extras, 'cum', v) })}>Tần số tích luỹ</Check>
            <Check checked={spec.extras.includes('rel')} onChange={(v) => set({ extras: toggleExtra(spec.extras, 'rel', v) })}>Tần số tương đối (%)</Check>
            <Check checked={spec.extras.includes('total')} onChange={(v) => set({ extras: toggleExtra(spec.extras, 'total', v) })}>Cột / hàng Tổng (n)</Check>
          </>
        )}
        {!isTable && <Check checked={spec.polygon} onChange={(polygon) => set({ polygon })}>Vẽ đa giác tần số</Check>}
      </section>
      {tinh && (
        <section>
          <h3 className={cn(sectionTitle, 'mb-0')}>Tính giúp (chỉ hiện ở đây)</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-[6px] border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">
            {tinh.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span>{k}</span>
                <span className="font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
  return (
    <ToolShell
      title="Bảng ghép nhóm"
      hint="Bảng tần số ghép nhóm kiểu SGK và biểu đồ cột liền; ô Tính giúp chỉ hiện ở đây, không vẽ lên hình"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật bảng' : 'Chèn bảng')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí: mạch điện
 * ------------------------------------------------------------------ */

const CIRCUIT_DEFAULT: CircuitSpec = {
  text: 'nguồn E = 12 V, r = 1 Ω\nK - A - R1=4Ω - (R2=6Ω // R3=3Ω // V) - Đ(6V-3W)',
  values: true,
}

export function CircuitModal({ initial, submitLabel, onClose, onInsert }: Props<CircuitSpec>) {
  const [spec, setSpec] = useState<CircuitSpec>(initial ?? CIRCUIT_DEFAULT)
  const set = (p: Partial<CircuitSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'circuit', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <TextBlock
        title="Mạch"
        help={CIRCUIT_HELP}
        intro={'Nối tiếp "-", song song "//", ngoặc để gom cụm. Nguồn ghi một dòng riêng bắt đầu bằng "nguồn".'}
        value={spec.text}
        onChange={(text) => set({ text })}
        rows={5}
        errors={error ? [error] : []}
        label="Mạch điện"
      />
      <section>
        <Check checked={spec.values} onChange={(values) => set({ values })}>Ghi giá trị dưới linh kiện</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Mạch điện"
      hint="Ký hiệu theo SGK; máy tự xếp các nhánh song song thành hình chữ nhật"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí: đồ thị chuyển động, mặt phẳng nghiêng
 * ------------------------------------------------------------------ */

const MOTION_KINDS: Array<{ y: string; label: string; example: string }> = [
  { y: 'v (m/s)', label: 'v – t', example: '(0; 0) (2; 4) (5; 4) (7; 0)' },
  { y: 'x (m)', label: 'x – t', example: '(0; 10) (2; 20) (4; 20) (6; 0)' },
  { y: 'd (m)', label: 'd – t', example: '(0; 0) (2; 10) (4; 10) (6; -5)' },
  { y: 'a (m/s²)', label: 'a – t', example: '(0; 2) (3; 2) (3; 0) (6; 0)' },
]
const MOTION_HELP: HelpGroups = [
  {
    group: 'Điểm',
    items: [
      { code: '(0; 0) (2; 4)', what: 'Điểm (t; giá trị), nối gấp khúc theo thứ tự' },
      { code: '(1,5; 3)', what: 'Số thập phân dùng dấu phẩy' },
      { code: '(3; 2) (3; 0)', what: 'Hai điểm cùng t: đoạn thẳng đứng (đồ thị a – t)' },
    ],
  },
]

export function MotionModal({ initial, submitLabel, onClose, onInsert }: Props<MotionSpec>) {
  const [spec, setSpec] = useState<MotionSpec>(initial ?? { yName: MOTION_KINDS[0].y, tName: 't (s)', points: MOTION_KINDS[0].example, dashed: true })
  const set = (p: Partial<MotionSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'motion', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Loại</h3>
        <div className="flex flex-wrap gap-1.5">
          {MOTION_KINDS.map((k) => (
            <button
              key={k.y}
              type="button"
              aria-pressed={spec.yName === k.y}
              onClick={() => set({ yName: k.y, ...(MOTION_KINDS.some((x) => x.example === spec.points) ? { points: k.example } : {}) })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                spec.yName === k.y ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </section>
      <TextBlock
        title="Các điểm"
        help={MOTION_HELP}
        intro="Mỗi điểm (t; giá trị), t tăng dần."
        value={spec.points}
        onChange={(points) => set({ points })}
        rows={3}
        errors={error ? [error] : []}
        label="Các điểm của đồ thị"
      />
      <section className="grid grid-cols-2 gap-2">
        <label className="text-[12.5px] text-ink-2">
          Trục dọc
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.yName} onChange={(e) => set({ yName: e.target.value })} />
        </label>
        <label className="text-[12.5px] text-ink-2">
          Trục ngang
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.tName} onChange={(e) => set({ tName: e.target.value })} />
        </label>
      </section>
      <section>
        <Check checked={spec.dashed} onChange={(dashed) => set({ dashed })}>Nét đứt chiếu xuống hai trục</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Đồ thị chuyển động"
      hint="x – t, d – t, v – t, a – t gấp khúc; số trên trục lấy đúng các điểm đã gõ"
      inputs={inputs}
      inputsWidth={360}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí 12: đồ thị trạng thái khí
 * ------------------------------------------------------------------ */

const GAS_AXES: Array<{ id: GasAxes; label: string; coord: string }> = [
  { id: 'pV', label: 'p – V', coord: '(V; p)' },
  { id: 'pT', label: 'p – T', coord: '(T; p)' },
  { id: 'VT', label: 'V – T', coord: '(T; V)' },
]
const GAS_TICKS: Array<{ id: GasSpec['ticks']; label: string }> = [
  { id: 'value', label: 'Số liệu' },
  { id: 'symbol', label: 'p₁, V₁, T₁' },
  { id: 'none', label: 'Không ghi' },
]
const GAS_HELP: HelpGroups = [
  {
    group: 'Trạng thái',
    items: [
      { code: '1: (1; 4)', what: 'Trạng thái 1, toạ độ (trục ngang; trục dọc)' },
      { code: '(2,5; 3)', what: 'Số thập phân dùng dấu phẩy' },
    ],
  },
  {
    group: 'Quá trình',
    items: [
      { code: '1-2: đẳng nhiệt', what: 'p–V: cung hypebol (p·V như nhau); p–T, V–T: đoạn đứng' },
      { code: '2-3: đẳng tích', what: 'p–V: đoạn đứng; p–T: đoạn trên đường qua O; V–T: đoạn ngang' },
      { code: '3-1: đẳng áp', what: 'p–V, p–T: đoạn ngang; V–T: đoạn trên đường qua O' },
      { code: 'a-b: đẳng áp | p_1', what: 'Thêm "| nhãn" để ghi nhãn ở đầu xa O (p_1 hoặc p₁ thành p₁)' },
      { code: '1-2', what: 'Bỏ trống loại: nối thẳng' },
    ],
  },
]

export function GasModal({ initial, submitLabel, onClose, onInsert }: Props<GasSpec>) {
  const [spec, setSpec] = useState<GasSpec>(() => (initial ? { ...initial, showStates: initial.showStates ?? true } : GAS_DEFAULT))
  const set = (p: Partial<GasSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'gas', spec }), [spec])
  const { preview, error } = useRender(doc)
  const coord = GAS_AXES.find((a) => a.id === spec.axes)?.coord ?? '(V; p)'
  const pill = (on: boolean) =>
    cn('rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors', on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4')
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Hệ trục</h3>
        <div className="flex flex-wrap gap-1.5">
          {GAS_AXES.map((a) => (
            <button key={a.id} type="button" aria-pressed={spec.axes === a.id} onClick={() => set({ axes: a.id })} className={pill(spec.axes === a.id)}>
              {a.label}
            </button>
          ))}
        </div>
      </section>
      <TextBlock
        title="Trạng thái"
        help={GAS_HELP}
        intro={`Mỗi dòng một trạng thái, toạ độ ${coord}.`}
        value={spec.states}
        onChange={(states) => set({ states })}
        rows={3}
        errors={error ? [error] : []}
        label="Các trạng thái khí"
      />
      <TextBlock
        title="Quá trình"
        help={GAS_HELP}
        errors={[]}
        intro='Mỗi dòng một quá trình: đẳng nhiệt, đẳng tích, đẳng áp (hoặc bỏ trống để nối thẳng); thêm "| nhãn" để ghi nhãn đường (vd. a-b: đẳng áp | p_1).'
        placeholder="vd. a-b: đẳng áp | p_1"
        value={spec.processes}
        onChange={(processes) => set({ processes })}
        rows={3}
        label="Các quá trình"
      />
      <section className="grid grid-cols-3 gap-2">
        {(
          [
            ['pUnit', 'Đơn vị p'],
            ['vUnit', 'Đơn vị V'],
            ['tUnit', 'Đơn vị T'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="text-[12.5px] text-ink-2">
            {label}
            <input className={cn(inputClass, 'mt-1 h-9')} value={spec[k]} onChange={(e) => set({ [k]: e.target.value })} />
          </label>
        ))}
      </section>
      <section>
        <h3 className={sectionTitle}>Nhãn trên trục</h3>
        <div className="flex flex-wrap gap-1.5">
          {GAS_TICKS.map((t) => (
            <button key={t.id} type="button" aria-pressed={spec.ticks === t.id} onClick={() => set({ ticks: t.id })} className={pill(spec.ticks === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-1.5">
        <Check checked={spec.dashed} onChange={(dashed) => set({ dashed })}>Nét đứt gióng xuống hai trục</Check>
        <Check checked={spec.arrows} onChange={(arrows) => set({ arrows })}>Mũi tên chiều quá trình</Check>
        <Check checked={spec.toOrigin} onChange={(toOrigin) => set({ toOrigin })}>Kéo dài nét đứt về gốc O (đường qua O)</Check>
        <Check checked={spec.showStates !== false} onChange={(showStates) => set({ showStates })}>Hiện điểm trạng thái</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Đồ thị trạng thái khí"
      hint="Tự vẽ đúng hình dạng từng quá trình; báo lỗi khi số liệu không khớp (vd. đẳng nhiệt mà p·V khác nhau)"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Toán: hình thực tế nét đơn có kích thước
 * ------------------------------------------------------------------ */

export function SceneModal({ initial, submitLabel, onClose, onInsert }: Props<SceneSpec>) {
  const [spec, setSpec] = useState<SceneSpec>(initial ?? SCENE_DEFAULT)
  const [move, setMove] = useState(false)
  const doc = useMemo((): ToolDoc => ({ kind: 'scene', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <TextBlock
      title="Hình vẽ"
      help={SCENE_HELP}
      intro="Khai báo điểm, rồi mỗi dòng một lệnh: đoạn, nét đứt, kích thước, góc, nhãn, mặt đất / tường."
      value={spec.text}
      onChange={(text) => setSpec((s) => ({ ...s, text }))}
      rows={12}
      errors={error ? [error] : []}
      label="Lệnh vẽ hình"
    />
  )
  return (
    <ToolShell
      title="Hình thực tế"
      hint="Nét đen trắng như đề in; kích thước và nhãn tự đặt ra phía ngoài hình"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
      renderPreview={(img) => (
        <LabelPreview
          img={img}
          labelPos={spec.labelPos}
          onChange={(labelPos) => setSpec((s) => ({ ...s, labelPos }))}
          move={move}
          onToggle={() => setMove((v) => !v)}
          fallback={<img src={svgDataUrl(img.svg)} alt="Xem trước" className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain" />}
        />
      )}
    />
  )
}

const DIRS: Array<{ id: Dir; label: string }> = [
  { id: 'none', label: 'Không' },
  { id: 'up', label: 'Lên dốc' },
  { id: 'down', label: 'Xuống dốc' },
]

function DirPick({ title, value, onChange }: { title: string; value: Dir; onChange: (d: Dir) => void }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
      <span className="w-20">{title}</span>
      {DIRS.map((d) => (
        <button
          key={d.id}
          type="button"
          aria-pressed={value === d.id}
          onClick={() => onChange(d.id)}
          className={cn('rounded-[6px] border px-2 py-0.5', value === d.id ? 'border-clay bg-clay-tint text-clay' : 'border-line hover:border-ink-4')}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}

export function InclineModal({ initial, submitLabel, onClose, onInsert }: Props<InclineSpec>) {
  const [spec, setSpec] = useState<InclineSpec>(initial ?? { angle: 30, P: true, N: true, fms: 'up', F: 'none', showAngle: true })
  const set = (p: Partial<InclineSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'incline', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Góc nghiêng: {spec.angle}°</h3>
        <input type="range" min={10} max={60} step={5} value={spec.angle} onChange={(e) => set({ angle: Number(e.target.value) })} className="w-full accent-clay" aria-label="Góc nghiêng" />
      </section>
      <section className="space-y-2">
        <h3 className={sectionTitle}>Lực</h3>
        <Check checked={spec.P} onChange={(P) => set({ P })}>Trọng lực P</Check>
        <Check checked={spec.N} onChange={(N) => set({ N })}>Phản lực N</Check>
        <DirPick title="Ma sát Fms" value={spec.fms} onChange={(fms) => set({ fms })} />
        <DirPick title="Lực kéo F" value={spec.F} onChange={(F) => set({ F })} />
      </section>
      <section>
        <Check checked={spec.showAngle} onChange={(showAngle) => set({ showAngle })}>Ghi góc α</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Mặt phẳng nghiêng"
      hint="Vật trên dốc và các lực tác dụng"
      inputs={inputs}
      inputsWidth={340}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Hoá học: cấu hình electron, công thức cấu tạo, đồ thị số mol
 * ------------------------------------------------------------------ */

export function ElectronModal({ initial, submitLabel, onClose, onInsert }: Props<ElectronSpec>) {
  const [spec, setSpec] = useState<ElectronSpec>(initial ?? { element: 'Fe', valenceOnly: false })
  const set = (p: Partial<ElectronSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'electron', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Nguyên tố hoặc ion</h3>
        <input className={cn(inputClass, 'h-9')} value={spec.element} onChange={(e) => set({ element: e.target.value })} aria-label="Nguyên tố" placeholder="Fe, 26, Fe3+, Cl-" />
        <p className="mt-1.5 text-[12px] leading-snug text-ink-3">Kí hiệu (Fe), số hiệu (26) hoặc ion (Fe3+, Cl-). Có từ H đến Ba; đã tính Cr, Cu bán bão hoà.</p>
        {error ? <p role="alert" className="mt-1.5 text-[12px] text-clay-deep">{error}</p> : null}
      </section>
      <section>
        <Check checked={spec.valenceOnly} onChange={(valenceOnly) => set({ valenceOnly })}>Chỉ vẽ ô orbital lớp ngoài cùng</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Cấu hình electron"
      hint="Dòng cấu hình và ô orbital, điền theo quy tắc Hund"
      inputs={inputs}
      inputsWidth={320}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

const STRUCT_HELP: HelpGroups = [
  {
    group: 'Mạch chính & điện tích',
    items: [
      { code: 'CH3-CH2-OH', what: 'Liên kết đơn: dấu gạch ngang' },
      { code: 'CH2=CH-CH3', what: 'Liên kết đôi: dấu bằng' },
      { code: 'CH≡C-CH3  hoặc  CH#C-CH3', what: 'Liên kết ba' },
      { code: 'NH3^+   COO^-   O^-', what: 'Điện tích sau "^" (^+, ^-, ^2+, ^2-) thành chỉ số trên' },
    ],
  },
  {
    group: 'Nhánh',
    items: [
      { code: 'CH3-CH(CH3)-CH3', what: 'Nhánh trong ngoặc, vẽ dọc dưới nhóm' },
      { code: 'CH3-C(CH3)(CH3)-CH3', what: 'Hai nhánh: một dưới, một trên' },
      { code: 'CH3-C(=O)-OH', what: 'Nhánh nối bằng liên kết đôi' },
      { code: 'CH3-CH(CH2-CH3)-CH3', what: 'Nhánh nhiều nhóm' },
    ],
  },
  {
    group: 'Vòng',
    items: [
      { code: '[benzen]  hoặc  C6H5-CH3', what: 'Vòng benzen (C6H5, C6H4, Ph hoặc [benzen])' },
      { code: '[xiclo3] … [xiclo6]', what: 'Vòng no 3–8 cạnh ([xiclo6], vòng6…)' },
      { code: '[benzen](1:CH3)(4:NO2)', what: 'Nhóm thế theo vị trí (1..6) trên vòng' },
      { code: 'CH3-CH(C6H5)-CH3', what: 'Vòng làm nhánh' },
    ],
  },
]

export function StructModal({ initial, submitLabel, onClose, onInsert }: Props<StructSpec>) {
  const [spec, setSpec] = useState<StructSpec>(initial ?? { formula: 'CH3-CH(CH3)-CH2-CH(OH)-CH3', style: 'condensed', number: false })
  const set = (p: Partial<StructSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'struct', spec }), [spec])
  const { preview, error } = useRender(doc)
  const style = spec.style ?? 'condensed'
  const ringStyle = spec.ringStyle ?? 'kekule'
  const drawRings = spec.drawRings !== false
  const insertToken = (tok: string) => {
    const f = spec.formula.trim()
    set({ formula: !f ? tok : f.endsWith('-') || f.endsWith('=') ? f + tok : `${f}-${tok}` })
  }
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Kiểu vẽ</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['condensed', 'Thu gọn'],
              ['skeletal', 'Khung (zigzag)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={style === id}
              onClick={() => set({ style: id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                style === id ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <TextBlock
        title="Công thức"
        help={STRUCT_HELP}
        intro="Gõ dạng thu gọn; chọn Khung để vẽ zigzag không ghi C, H. Vòng: [benzen], [xiclo3]…[xiclo6], nhóm thế (1:CH3)(4:NO2)."
        value={spec.formula}
        onChange={(formula) => set({ formula })}
        rows={3}
        errors={error ? [error] : []}
        label="Công thức cấu tạo"
      />
      <section>
        <h3 className={sectionTitle}>Chèn nhanh vòng &amp; ví dụ</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['[benzen]', '+ [benzen]'],
              ['[xiclo6]', '+ [xiclo6]'],
              ['[xiclo5]', '+ [xiclo5]'],
            ] as const
          ).map(([tok, label]) => (
            <button
              key={tok}
              type="button"
              onClick={() => insertToken(tok)}
              className="rounded-[6px] border border-line px-2 py-0.5 text-[12px] text-ink-2 hover:border-ink-4"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => set({ formula: '[benzen](1:CH3)(4:NO2)' })}
            className="rounded-[6px] border border-line px-2 py-0.5 text-[12px] text-ink-2 hover:border-ink-4"
          >
            p-nitrotoluen
          </button>
        </div>
      </section>
      <section>
        <h3 className={sectionTitle}>Kiểu vòng thơm</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['kekule', 'Kekulé (3 nối đôi)'],
              ['circle', 'Vòng tròn'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={ringStyle === id}
              onClick={() => set({ ringStyle: id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                ringStyle === id ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <section className="space-y-1.5">
        <Check checked={!!spec.number} onChange={(number) => set({ number })}>Đánh số mạch chính / đỉnh vòng</Check>
        {style === 'condensed' && (
          <Check checked={drawRings} onChange={(v) => set({ drawRings: v })}>Vẽ C₆H₅ thành vòng</Check>
        )}
      </section>
    </>
  )
  return (
    <ToolShell
      title="Công thức cấu tạo"
      hint="Thu gọn hoặc khung; nhánh, vòng, liên kết đơn / đôi / ba; đánh số mạch chính"
      inputs={inputs}
      inputsWidth={360}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

const CHEM_GRAPH_HELP: HelpGroups = [
  {
    group: 'Điểm',
    items: [
      { code: '(0; 0) (0,3; 0,3) (0,6; 0)', what: 'Điểm (x; y), nối gấp khúc; số thập phân dùng dấu phẩy' },
      { code: 'Trục: n CO2, n↓', what: 'Chữ số sau chữ cái tự thành chỉ số dưới' },
    ],
  },
]

export function ChemGraphModal({ initial, submitLabel, onClose, onInsert }: Props<ChemGraphSpec>) {
  const [spec, setSpec] = useState<ChemGraphSpec>(initial ?? { xName: 'n CO2', yName: 'n CaCO3', points: '(0; 0) (0,3; 0,3) (0,6; 0)', dashed: true })
  const set = (p: Partial<ChemGraphSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'chemgraph', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <TextBlock
        title="Các điểm"
        help={CHEM_GRAPH_HELP}
        intro="Mỗi điểm (x; y), x tăng dần. Vd. sục CO₂ vào Ca(OH)₂: lên rồi xuống."
        value={spec.points}
        onChange={(points) => set({ points })}
        rows={3}
        errors={error ? [error] : []}
        label="Các điểm của đồ thị"
      />
      <section className="grid grid-cols-2 gap-2">
        <label className="text-[12.5px] text-ink-2">
          Trục ngang
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.xName} onChange={(e) => set({ xName: e.target.value })} />
        </label>
        <label className="text-[12.5px] text-ink-2">
          Trục dọc
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.yName} onChange={(e) => set({ yName: e.target.value })} />
        </label>
      </section>
      <section>
        <Check checked={spec.dashed} onChange={(dashed) => set({ dashed })}>Nét đứt chiếu xuống hai trục</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Đồ thị số mol"
      hint="Kết tủa / khí theo lượng chất thêm vào; số trên trục lấy đúng các điểm đã gõ"
      inputs={inputs}
      inputsWidth={360}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Toán: đường tròn lượng giác, sơ đồ cây xác suất, trục số
 * ------------------------------------------------------------------ */

const TRIG_HELP: HelpGroups = [
  {
    group: 'Góc (mỗi dòng một góc)',
    items: [
      { code: 'π/6   -2π/3   5pi/4', what: 'Radian; gõ pi cũng được' },
      { code: '150°  hoặc  150 độ', what: 'Độ' },
    ],
  },
  {
    group: 'Họ nghiệm',
    items: [
      { code: 'π/4 + kπ/2', what: 'Các điểm ngọn cung cách đều (ở đây 4 điểm)' },
      { code: 'x = π/3 + k2π/3', what: 'Ghi "x =" ở đầu cũng được' },
    ],
  },
  {
    group: 'Đặt tên & toạ độ',
    items: [
      { code: 'M: pi/3', what: 'Điểm M ứng với góc π/3, tên hiện cạnh chấm' },
      { code: 'M(1/2; √3/2)', what: 'Điểm theo toạ độ (cos; sin); lệch quá 0,02 khỏi đường tròn sẽ được nhắc nhưng vẫn vẽ' },
      { code: 'Ô "Ghi giá trị cos, sin"', what: 'Giá trị đẹp ghi 0, ±1/2, ±√2/2, ±√3/2, ±1; góc khác ghi gần đúng 2 chữ số thập phân' },
    ],
  },
  {
    group: 'Tô cung (miền nghiệm)',
    items: [
      { code: 'tô: π/6 → 5π/6', what: 'Cung đậm chạy ngược chiều kim đồng hồ; chấm đặc hai đầu' },
      { code: 'tô: [π/6 → 5π/6)', what: '[ ] lấy đầu mút (chấm đặc), ( ) không lấy (chấm rỗng); mũi tên →, -> hoặc "đến"; nhiều dòng tô được' },
    ],
  },
  {
    group: 'Đường thẳng',
    items: [
      { code: 'y = 1/2', what: 'Nét liền ngang xuyên qua đường tròn, chấm 2 giao điểm; chấp nhận √3/2, sqrt(3)/2, 0,5' },
      { code: 'x = -√2/2', what: 'Nét liền dọc; nhãn giá trị ở trục cos (x =) hoặc trục sin (y =)' },
      { code: 'x = π/3 + kπ', what: 'Vế phải có π, k, ° thì vẫn là góc/họ nghiệm, không phải đường thẳng' },
    ],
  },
  {
    group: 'Nối & cung',
    items: [
      { code: 'nối: M N P', what: 'Đa giác khép kín qua các điểm đã khai báo (M: góc hoặc M(x; y))' },
      { code: 'nối tô: M N P', what: 'Nối kèm tô nhạt bên trong; "nối tô: họ" nối cả họ nghiệm theo thứ tự góc tăng' },
      { code: 'cung: M N "π/2"', what: 'Cung mũi tên ngược chiều kim đồng hồ từ M tới N; nhãn trong "…" tuỳ chọn' },
    ],
  },
]

export function TrigModal({ initial, submitLabel, onClose, onInsert }: Props<TrigSpec>) {
  const [spec, setSpec] = useState<TrigSpec>(initial ?? { angles: '2π/3', projections: true, tan: false, values: false, cot: false })
  const set = (p: Partial<TrigSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'trig', spec }), [spec])
  const { preview, error } = useRender(doc)
  const errs = [...(error ? [error] : []), ...(preview?.errors ?? []).map((e) => `Dòng ${e.line}: ${e.msg}`)]
  const inputs = (
    <>
      <TextBlock
        title="Góc / lệnh vẽ"
        help={TRIG_HELP}
        intro="Mỗi dòng một lệnh: góc, họ nghiệm, tô:, nối:, cung:, y =, x =, M(x; y)."
        value={spec.angles}
        onChange={(angles) => set({ angles })}
        rows={4}
        errors={errs}
        label="Các góc"
      />
      <section className="space-y-2">
        <Check checked={spec.projections} onChange={(projections) => set({ projections })}>Nét đứt chiếu xuống trục cos, sin</Check>
        <Check checked={spec.values === true} onChange={(values) => set({ values })}>Ghi giá trị cos, sin trên trục</Check>
        <Check checked={spec.tan} onChange={(tan) => set({ tan })}>Vẽ trục tan</Check>
        <Check checked={spec.cot === true} onChange={(cot) => set({ cot })}>Vẽ trục cot</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Đường tròn lượng giác"
      hint="Điểm ngọn cung, hình chiếu, họ nghiệm; tô miền nghiệm, đường thẳng y = a / x = a, nối điểm thành đa giác"
      inputs={inputs}
      inputsWidth={340}
      preview={preview}
      renderPreview={(img) => <TrigPickPreview img={img} angles={spec.angles} onAngles={(angles) => set({ angles })} />}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

const TREE_HELP: HelpGroups = [
  {
    group: 'Nhánh',
    items: [
      { code: 'A: 0,3', what: 'Tên biến cố : xác suất (0,3 · 1/3 · 30%)' },
      { code: "  B: 0,6", what: 'Thụt 2 dấu cách: nhánh con của dòng trên' },
      { code: "A'  hoặc  ~A", what: 'Biến cố đối (vẽ gạch trên)' },
    ],
  },
]

export function TreeModal({ initial, submitLabel, onClose, onInsert }: Props<TreeSpec>) {
  const [spec, setSpec] = useState<TreeSpec>(initial ?? { text: "A: 0,3\n  B: 0,6\n  B': 0,4\nA': 0,7\n  B: 0,2\n  B': 0,8", products: true })
  const set = (p: Partial<TreeSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'probtree', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <TextBlock
        title="Các nhánh"
        help={TREE_HELP}
        intro="Mỗi dòng một nhánh; thụt 2 dấu cách để thành nhánh con."
        value={spec.text}
        onChange={(text) => set({ text })}
        rows={7}
        errors={error ? [error] : []}
        label="Sơ đồ cây"
      />
      <section>
        <Check checked={spec.products} onChange={(products) => set({ products })}>Ghi tích xác suất cuối mỗi nhánh</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Sơ đồ cây xác suất"
      hint="Xác suất ghi trên nhánh; biến cố đối có gạch trên"
      inputs={inputs}
      inputsWidth={340}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

const NUMLINE_HELP: HelpGroups = [
  {
    group: 'Tập (mỗi dòng một trục)',
    items: [
      { code: '(-2; 3]', what: 'Ngoặc tròn: không lấy đầu mút; ngoặc vuông: lấy' },
      { code: '[1; +oo)   (-oo; 2)', what: 'Vô cực: oo, ∞ hoặc vc' },
      { code: '(-oo; -1) ∪ [2; 5]', what: 'Hợp nhiều khoảng: ∪ hoặc U' },
      { code: 'A = (-2; 3]', what: 'Ghi tên tập ở đầu trục' },
      { code: '{3; 5}', what: 'Điểm rời' },
    ],
  },
]

export function NumberLineModal({ initial, submitLabel, onClose, onInsert }: Props<NumberLineSpec>) {
  const [spec, setSpec] = useState<NumberLineSpec>(initial ?? { sets: 'A = (-2; 3]\nB = [1; +oo)', style: 'hatch' })
  const set = (p: Partial<NumberLineSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'numberline', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Cách biểu diễn</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['hatch', 'Gạch phần bỏ đi'],
              ['bold', 'Tô đậm phần giữ lại'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={spec.style === id}
              onClick={() => set({ style: id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                spec.style === id ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      <TextBlock
        title="Các tập"
        help={NUMLINE_HELP}
        intro="Mỗi dòng một trục số; các trục dùng chung vị trí mốc để dễ so sánh giao, hợp."
        value={spec.sets}
        onChange={(sets) => set({ sets })}
        rows={4}
        errors={error ? [error] : []}
        label="Các tập"
      />
    </>
  )
  return (
    <ToolShell
      title="Trục số"
      hint="Biểu diễn khoảng, đoạn, nửa khoảng như SGK lớp 10"
      inputs={inputs}
      inputsWidth={340}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

const VENN_HELP: HelpGroups = [
  {
    group: 'Miền tô',
    items: [
      { code: 'A ∩ B   hoặc  A n B', what: 'Giao' },
      { code: 'A ∪ B   hoặc  A u B', what: 'Hợp' },
      { code: 'A \\ B   hoặc  A - B', what: 'Hiệu' },
      { code: "A'   (A ∪ B)'", what: 'Phần bù trong U' },
      { code: '(A ∪ B) ∩ C', what: 'Ngoặc để gom' },
    ],
  },
  {
    group: 'Số phần tử (mỗi dòng một miền)',
    items: [
      { code: 'A: 5', what: 'Chỉ thuộc A' },
      { code: 'AB: 3', what: 'Thuộc A và B (không thuộc C)' },
      { code: 'ABC: 1', what: 'Thuộc cả ba' },
      { code: 'ngoài: 2', what: 'Ngoài mọi tập (trong U)' },
    ],
  },
]

export function VennModal({ initial, submitLabel, onClose, onInsert }: Props<VennSpec>) {
  const [spec, setSpec] = useState<VennSpec>(initial ?? { sets: 'A, B', shade: 'A ∩ B', counts: '', universe: true })
  const set = (p: Partial<VennSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'venn', spec }), [spec])
  const { preview, error } = useRender(doc)
  const inputs = (
    <>
      <section className="grid grid-cols-2 gap-2">
        <label className="text-[12.5px] text-ink-2">
          Các tập (2 hoặc 3)
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.sets} onChange={(e) => set({ sets: e.target.value })} placeholder="A, B, C" />
        </label>
        <label className="text-[12.5px] text-ink-2">
          Miền tô
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.shade} onChange={(e) => set({ shade: e.target.value })} placeholder="A ∩ B (trống: không tô)" />
        </label>
      </section>
      <TextBlock
        title="Số phần tử (tuỳ chọn)"
        help={VENN_HELP}
        intro="Mỗi dòng một miền, vd. A: 5 · AB: 3 · ngoài: 2. Để trống thì không ghi số."
        value={spec.counts}
        onChange={(counts) => set({ counts })}
        rows={4}
        errors={error ? [error] : []}
        label="Số phần tử"
      />
      <section>
        <Check checked={spec.universe} onChange={(universe) => set({ universe })}>Khung tập vũ trụ U</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Biểu đồ Ven"
      hint="2 hoặc 3 tập; gạch miền giao, hợp, hiệu, phần bù; ghi số phần tử"
      inputs={inputs}
      inputsWidth={360}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Khác: tạo bảng kẻ ô tuỳ biến
 * ------------------------------------------------------------------ */

const TABLE_HEADERS: Array<{ id: TableHeader; label: string }> = [
  { id: 'row', label: 'Hàng đầu' },
  { id: 'col', label: 'Cột đầu' },
  { id: 'both', label: 'Cả hai' },
  { id: 'none', label: 'Không' },
]

const TABLE_ALIGNS: Array<{ id: TableAlign; label: string }> = [
  { id: 'left', label: 'Trái' },
  { id: 'center', label: 'Giữa' },
  { id: 'right', label: 'Phải' },
]

const TABLE_BORDERS: Array<{ id: TableBorder; label: string }> = [
  { id: 'all', label: 'Đủ ô' },
  { id: 'outer', label: 'Viền ngoài' },
  { id: 'horizontal', label: 'Kẻ ngang' },
]

const TABLE_HELP: HelpGroups = [
  {
    group: 'Cách gõ ô',
    items: [
      { code: 'A | B | C', what: 'Mỗi dòng một hàng; các ô cách nhau bằng dấu |' },
      { code: 'A | | C', what: 'Ô trống: để trống giữa hai dấu |' },
      { code: 'Dòng 1\\nDòng 2 | B', what: 'Xuống dòng trong một ô: gõ \\n' },
      { code: 'x_1, x^2, x_{10}, x^(1/2)', what: 'Chỉ số dưới (_) và chỉ số trên (^)' },
    ],
  },
]

const MERGE_HELP: HelpGroups = [
  {
    group: 'Gộp ô (mỗi dòng một vùng)',
    items: [
      { code: '1,1:1,3', what: 'Gộp từ hàng 1 cột 1 đến hàng 1 cột 3 (3 ô đầu hàng 1)' },
      { code: '2,1:3,1', what: 'Gộp dọc cột 1 từ hàng 2 đến hàng 3' },
    ],
  },
]

export function TableModal({ initial, submitLabel, onClose, onInsert }: Props<TableSpec>) {
  const [spec, setSpec] = useState<TableSpec>(() => ({ ...TABLE_DEFAULT, ...(initial ?? {}) }))
  const set = (p: Partial<TableSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'table', spec }), [spec])
  const { preview, error } = useRender(doc)

  const { cellsError, mergesError } = useMemo(() => {
    let parsed: { rows: number; cols: number }
    try {
      parsed = parseCells(spec.cells)
    } catch (e) {
      return { cellsError: e instanceof Error ? e.message : String(e), mergesError: undefined }
    }
    try {
      parseMerges(spec.merges, parsed.rows, parsed.cols)
      return { cellsError: undefined, mergesError: undefined }
    } catch (e) {
      return { cellsError: undefined, mergesError: e instanceof Error ? e.message : String(e) }
    }
  }, [spec.cells, spec.merges])

  const addRow = () => {
    const lines = spec.cells
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((l) => l.trim().length > 0)
    if (!lines.length) {
      set({ cells: 'Ô 1 | Ô 2 | Ô 3' })
      return
    }
    const cols = Math.max(1, ...lines.map((l) => l.split('|').length))
    const row = Array.from({ length: cols }, () => '').join(' | ')
    const base = spec.cells.replace(/\s+$/, '')
    set({ cells: base ? `${base}\n${row}` : row })
  }

  const addCol = () => {
    const raw = spec.cells.replace(/\r\n/g, '\n')
    if (!raw.trim()) {
      set({ cells: ' | ' })
      return
    }
    const next = raw
      .split('\n')
      .map((l) => (l.trim() ? `${l.replace(/\s+$/, '')} | ` : l))
      .join('\n')
    set({ cells: next })
  }

  const pill = (on: boolean) =>
    cn('rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors', on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4')

  const inputs = (
    <>
      <div>
        <TextBlock
          title="Nội dung bảng"
          help={TABLE_HELP}
          intro="Mỗi dòng một hàng, ô cách nhau bằng | ; xuống dòng trong ô dùng \n ; chỉ số x_1, x^2."
          value={spec.cells}
          onChange={(cells) => set({ cells })}
          rows={4}
          errors={cellsError ? [cellsError] : []}
          label="Nội dung bảng"
        />
        <div className="mt-1.5 flex gap-1.5">
          <button
            type="button"
            onClick={addRow}
            className="rounded-[6px] border border-line bg-white px-2.5 py-1 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
          >
            + Thêm hàng
          </button>
          <button
            type="button"
            onClick={addCol}
            className="rounded-[6px] border border-line bg-white px-2.5 py-1 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
          >
            + Thêm cột
          </button>
        </div>
      </div>
      <section>
        <h3 className={sectionTitle}>Tiêu đề (đậm + nền nhạt)</h3>
        <div className="flex flex-wrap gap-1.5">
          {TABLE_HEADERS.map((h) => (
            <button key={h.id} type="button" aria-pressed={spec.header === h.id} onClick={() => set({ header: h.id })} className={pill(spec.header === h.id)}>
              {h.label}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className={sectionTitle}>Căn lề</h3>
        <div className="flex flex-wrap gap-1.5">
          {TABLE_ALIGNS.map((a) => (
            <button key={a.id} type="button" aria-pressed={spec.align === a.id} onClick={() => set({ align: a.id })} className={pill(spec.align === a.id)}>
              {a.label}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className={sectionTitle}>Đường kẻ</h3>
        <div className="flex flex-wrap gap-1.5">
          {TABLE_BORDERS.map((b) => (
            <button key={b.id} type="button" aria-pressed={spec.border === b.id} onClick={() => set({ border: b.id })} className={pill(spec.border === b.id)}>
              {b.label}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className={sectionTitle}>Cỡ chữ: {spec.fontSize}px</h3>
        <input
          type="range"
          min={12}
          max={20}
          step={1}
          value={spec.fontSize}
          onChange={(e) => set({ fontSize: Number(e.target.value) })}
          aria-label="Cỡ chữ bảng"
          className="w-full accent-clay"
        />
      </section>
      <TextBlock
        title="Gộp ô (tuỳ chọn)"
        help={MERGE_HELP}
        intro="Mỗi dòng một vùng: hàng,cột:hàng,cột (vd. 1,1:1,3). Để trống nếu không gộp."
        value={spec.merges}
        onChange={(merges) => set({ merges })}
        rows={2}
        errors={mergesError ? [mergesError] : []}
        label="Gộp ô"
      />
    </>
  )

  return (
    <ToolShell
      title="Tạo bảng"
      hint="Bảng kẻ ô nét rõ cho đề, slide và bảng vẽ; bấm lại vào ảnh để sửa nội dung"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật bảng' : 'Chèn bảng')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Hoá học: phương trình hoá học
 * ------------------------------------------------------------------ */

const CHEMEQ_HELP: HelpGroups = [
  {
    group: 'Mũi tên & điều kiện',
    items: [
      { code: '->  hoặc  →  hoặc  =', what: 'Mũi tên một chiều' },
      { code: '<=>  hoặc  ⇌', what: 'Mũi tên thuận nghịch (hai nửa mũi tên)' },
      { code: '[t°]   [to]   [t^o]', what: 'Điều kiện trên mũi tên (sau mũi tên hoặc cuối dòng khi có 1 mũi tên)' },
      { code: '[t°, xt, p | Fe]   [-OH^- | +H^+]', what: 'Ngăn bằng "|" để ghi 2 tầng (trên | dưới), hỗ trợ điện tích ^+ / ^-' },
      { code: 'A -> [đk1] B <=> [đk2] C', what: 'Nhiều mũi tên trên một dòng; điều kiện đặt ngay sau mỗi mũi tên' },
    ],
  },
  {
    group: 'Chất, cấu tạo, ion & kí hiệu',
    items: [
      { code: '2H2O   Ca(OH)2', what: 'Hệ số đầu giữ cỡ thường; số sau chữ/ngoặc thành chỉ số dưới' },
      { code: '{CH3-CH(NH3^+)-COO^-}   2{CH3-COOH}', what: 'Công thức cấu tạo trong {...}, giữ nhánh dọc và điện tích ^+ / ^-' },
      { code: 'SO4^2-   Fe^3+   OH^-', what: 'Điện tích sau "^" thành chỉ số trên' },
      { code: 'H2^   hoặc   H2↑', what: 'Chất khí bay lên (↑)' },
      { code: 'BaSO4v   hoặc   BaSO4↓', what: 'Chất kết tủa (↓); V2O5 vẫn giữ nguyên V' },
      { code: '(r)  (l)  (k)  (dd)', what: 'Trạng thái chất (cỡ nhỏ hơn)' },
    ],
  },
]

const CHEMEQ_QUICK: Array<{ label: string; text: string; title: string; spaceBefore?: boolean; spaceAfter?: boolean; caretOffset?: number }> = [
  { label: '→', text: '→', title: 'Chèn mũi tên một chiều', spaceBefore: true, spaceAfter: true },
  { label: '⇌', text: '⇌', title: 'Chèn mũi tên thuận nghịch', spaceBefore: true, spaceAfter: true },
  { label: '[t°]', text: '[t°]', title: 'Chèn điều kiện nhiệt độ', spaceBefore: true },
  { label: '{ }', text: '{}', title: 'Chèn cặp ngoặc chất cấu tạo', caretOffset: 1 },
  { label: '↑', text: '↑', title: 'Chèn kí hiệu khí bay lên' },
  { label: '↓', text: '↓', title: 'Chèn kí hiệu kết tủa' },
]

export function ChemEqModal({ initial, submitLabel, onClose, onInsert }: Props<ChemEqSpec>) {
  const [spec, setSpec] = useState<ChemEqSpec>(() => ({ ...CHEMEQ_DEFAULT, ...initial }))
  const [helpOpen, setHelpOpen] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const set = (p: Partial<ChemEqSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'chemeq', spec }), [spec])
  const { preview, error } = useRender(doc)
  const warnings = !error ? (preview?.errors ?? []) : []

  const insertSnippet = (q: (typeof CHEMEQ_QUICK)[number]) => {
    const el = taRef.current
    const start = el?.selectionStart ?? spec.equations.length
    const end = el?.selectionEnd ?? spec.equations.length
    const before = spec.equations.slice(0, start)
    const selected = spec.equations.slice(start, end)
    const after = spec.equations.slice(end)
    const pre = q.spaceBefore && before.length > 0 && !/[\s\n]$/.test(before) ? ' ' : ''
    const post = q.spaceAfter && (!after.length || !/^\s/.test(after)) ? ' ' : ''
    const inserted = q.caretOffset !== undefined && selected ? `${q.text.slice(0, q.caretOffset)}${selected}${q.text.slice(q.caretOffset)}` : q.text
    const next = before + pre + inserted + post + after
    set({ equations: next })
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const caret =
        q.caretOffset !== undefined && !selected
          ? start + pre.length + q.caretOffset
          : start + pre.length + inserted.length + post.length
      el.setSelectionRange(caret, caret)
    })
  }

  const inputs = (
    <>
      <section>
        <div className="mb-2 flex items-center gap-1.5">
          <h3 className={cn(sectionTitle, 'mb-0')}>Phương trình</h3>
          <HelpButton open={helpOpen} onToggle={() => setHelpOpen((v) => !v)} label="Cách gõ" />
        </div>
        {helpOpen && (
          <HelpCards
            groups={CHEMEQ_HELP}
            intro="Mỗi dòng một phương trình (có thể nhiều mũi tên); chất cấu tạo bọc trong {...}; điều kiện [trên | dưới] sau mũi tên."
            onClose={() => setHelpOpen(false)}
          />
        )}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {CHEMEQ_QUICK.map((q) => (
            <button
              key={q.label}
              type="button"
              title={q.title}
              onClick={() => insertSnippet(q)}
              className="rounded-[6px] border border-line bg-surface px-2.5 py-1 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-clay hover:text-clay"
            >
              {q.label}
            </button>
          ))}
        </div>
        <textarea
          ref={taRef}
          value={spec.equations}
          onChange={(e) => set({ equations: e.target.value })}
          spellCheck={false}
          rows={5}
          aria-label="Phương trình hoá học"
          aria-invalid={Boolean(error)}
          placeholder="2KMnO4 -> K2MnO4 + MnO2 + O2 [t°]"
          className={cn(inputClass, 'w-full resize-y px-3 py-2 font-mono text-[13px] leading-relaxed', error && 'border-clay')}
        />
        {error ? (
          <p role="alert" className="mt-1 text-[12px] leading-snug text-clay-deep">
            {error}
          </p>
        ) : null}
        {warnings.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-0.5 rounded-[6px] bg-paper-2 px-2.5 py-1.5 text-[12px] leading-snug text-ink-2">
            {warnings.map((w, i) => (
              <li key={i}>
                Dòng {w.line}: {w.msg}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <Check checked={spec.autoBalance} onChange={(autoBalance) => set({ autoBalance })}>
          Tự cân bằng hệ số (khi chưa ghi hệ số)
        </Check>
      </section>
      <section>
        <h3 className={sectionTitle}>Cỡ chữ: {spec.fontSize} px</h3>
        <input
          type="range"
          min={14}
          max={22}
          step={1}
          value={spec.fontSize}
          onChange={(e) => set({ fontSize: Number(e.target.value) })}
          className="w-full accent-clay"
          aria-label="Cỡ chữ"
        />
      </section>
      <section>
        <h3 className={sectionTitle}>Căn nhiều dòng</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['center', 'Căn giữa (thẳng mũi tên)'],
              ['left', 'Căn trái'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={spec.align === id}
              onClick={() => set({ align: id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                spec.align === id ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Phương trình hoá học"
      hint="Gõ chất, mũi tên và điều kiện trên/dưới mũi tên; hỗ trợ nhiều dòng, ion, trạng thái, khí/kết tủa"
      inputs={inputs}
      inputsWidth={380}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí 12: đồ thị chuyển thể (nhiệt độ – thời gian)
 * ------------------------------------------------------------------ */

const PHASE_KINDS: Array<{ label: string; yName: string; tName: string; points: string; extend: boolean }> = [
  {
    label: 'Nóng chảy nước đá',
    yName: 't (°C)',
    tName: 'T (phút)',
    points: '(0; -20)\n(4; 0)\n(14; 0)\n(24; 100)',
    extend: true,
  },
  {
    label: 'Mẫu đề',
    yName: 't (°C)',
    tName: 'T (phút)',
    points: '(0; -45)\nA: (15; -8,83)\nB: (27,4; -8,83)\nC: (40 = T_1; 0)\n(54 = T_2; 0)\n_(66; 16)',
    extend: false,
  },
  {
    label: 'Đông đặc',
    yName: 't (°C)',
    tName: 'T (phút)',
    points: '(0; 90)\nA: (4; 50)\nB: (12; 50)\n(18; 20)',
    extend: false,
  },
]

const PHASE_HELP: HelpGroups = [
  {
    group: 'Điểm & tên điểm',
    items: [
      { code: '(0; -45)   (4; 0)', what: 'Điểm (thời gian; nhiệt độ), nối gấp khúc theo thứ tự' },
      { code: 'A: (15; -8,83)', what: 'Đặt tên điểm A phía trên điểm; thập phân dùng dấu phẩy hoặc chấm' },
      { code: '_(66; 16)', what: 'Điểm đi tiếp cuối đường (vẽ đoạn nối, không ghi vạch số trên trục)' },
    ],
  },
  {
    group: 'Kí hiệu trên trục',
    items: [
      { code: 'C: (60 = T_1; 0)', what: 'Vẽ ở x = 60, ghi T₁ trên trục ngang (_1, _2… thành chỉ số dưới)' },
      { code: '(15; 50 = t_1)', what: 'Ghi kí hiệu t₁ trên trục dọc (dùng được cho cả hai trục)' },
    ],
  },
]

export function PhaseModal({ initial, submitLabel, onClose, onInsert }: Props<PhaseSpec>) {
  const [spec, setSpec] = useState<PhaseSpec>(() => ({ ...PHASE_DEFAULT, ...initial }))
  const [move, setMove] = useState(false)
  const set = (p: Partial<PhaseSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'phase', spec }), [spec])
  const { preview, error } = useRender(doc)

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Mẫu nhanh</h3>
        <div className="flex flex-wrap gap-1.5">
          {PHASE_KINDS.map((k) => {
            const active = spec.points === k.points && spec.extend === k.extend
            return (
              <button
                key={k.label}
                type="button"
                aria-pressed={active}
                onClick={() => set({ yName: k.yName, tName: k.tName, points: k.points, extend: k.extend, labelPos: undefined })}
                className={cn(
                  'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                  active ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
                )}
              >
                {k.label}
              </button>
            )
          })}
        </div>
      </section>
      <TextBlock
        title="Các điểm"
        help={PHASE_HELP}
        intro="Mỗi điểm dạng (thời gian; nhiệt độ), thời gian tăng dần; dùng 60 = T_1 để ghi kí hiệu trên trục."
        value={spec.points}
        onChange={(points) => set({ points })}
        rows={5}
        errors={error ? [error] : []}
        label="Các điểm của đồ thị chuyển thể"
      />
      <section className="grid grid-cols-2 gap-2">
        <label className="text-[12.5px] text-ink-2">
          Trục dọc
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.yName} onChange={(e) => set({ yName: e.target.value })} />
        </label>
        <label className="text-[12.5px] text-ink-2">
          Trục ngang
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.tName} onChange={(e) => set({ tName: e.target.value })} />
        </label>
      </section>
      <section className="space-y-1.5">
        <Check checked={spec.dashed} onChange={(dashed) => set({ dashed })}>Nét đứt gióng xuống hai trục</Check>
        <Check checked={spec.dots} onChange={(dots) => set({ dots })}>Chấm tại điểm có tên</Check>
        <Check checked={spec.extend} onChange={(extend) => set({ extend })}>Kéo dài ngang sau điểm cuối</Check>
      </section>
    </>
  )

  return (
    <ToolShell
      title="Đồ thị chuyển thể"
      hint="Nhiệt độ theo thời gian (nóng chảy, sôi, đông đặc); gốc O đặt tại giá trị nhỏ nhất của trục dọc"
      inputs={inputs}
      inputsWidth={360}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
      renderPreview={(img) => (
        <LabelPreview
          img={img}
          labelPos={spec.labelPos}
          onChange={(labelPos) => set({ labelPos })}
          move={move}
          onToggle={() => setMove((v) => !v)}
          fallback={<img src={svgDataUrl(img.svg)} alt="Xem trước" className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain" />}
        />
      )}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí 11: đồ thị dao động điều hoà
 * ------------------------------------------------------------------ */

const OSC_QTYS: Array<{ id: OscQty; label: string }> = [
  { id: 'x', label: 'Li độ x' },
  { id: 'v', label: 'Vận tốc v' },
  { id: 'a', label: 'Gia tốc a' },
]

const OSC_PERIOD_BY: Array<{ id: OscSpec['period']['by']; label: string }> = [
  { id: 'T', label: 'T (s)' },
  { id: 'f', label: 'f (Hz)' },
  { id: 'omega', label: 'ω (rad/s)' },
]

const OSC_X0S: Array<{ id: OscStartX0; label: string }> = [
  { id: '-A', label: '−A' },
  { id: '-A√3/2', label: '−A√3/2' },
  { id: '-A√2/2', label: '−A√2/2' },
  { id: '-A/2', label: '−A/2' },
  { id: '0', label: '0 (VTCB)' },
  { id: 'A/2', label: 'A/2' },
  { id: 'A√2/2', label: 'A√2/2' },
  { id: 'A√3/2', label: 'A√3/2' },
  { id: 'A', label: 'A' },
]

const OSC_PHI_PRESETS: Array<{ label: string; text: string; val: number }> = [
  { label: '0', text: '0', val: 0 },
  { label: 'π/2', text: '0,5', val: 0.5 },
  { label: '−π/2', text: '-0,5', val: -0.5 },
  { label: 'π', text: '1', val: 1 },
  { label: 'π/3', text: '1/3', val: 1 / 3 },
  { label: '−π/3', text: '-1/3', val: -1 / 3 },
]

const OSC_TEND_PRESETS: Array<{ label: string; k: number }> = [
  { label: '1T', k: 1 },
  { label: '1,25T', k: 1.25 },
  { label: '1,5T', k: 1.5 },
  { label: '2T', k: 2 },
]

const OSC_GRIDS: Array<{ id: OscSpec['grid']; label: string }> = [
  { id: 'T/8', label: 'T/8 (ô A/4)' },
  { id: 'T/4', label: 'T/4 (ô A/2)' },
  { id: 'none', label: 'Không' },
]

const OSC_TICKS: Array<{ id: OscSpec['ticks']; label: string }> = [
  { id: 'value', label: 'Số liệu' },
  { id: 'symbol', label: 'Kí hiệu (A, T…)' },
]

const fmtOscInput = (n: number) => (Number.isFinite(n) ? String(Math.round(n * 1e6) / 1e6).replace('.', ',') : '')

function OscStartPicker({
  value,
  onChange,
}: {
  value: OscStart
  onChange: (next: OscStart) => void
}) {
  const [phiText, setPhiText] = useState(() => fmtOscInput(value.by === 'phi' ? value.phiPi : 0.5))
  const pill = (on: boolean) =>
    cn(
      'rounded-[6px] border px-2 py-1 text-[12px] transition-colors',
      on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
    )

  const toPhiMode = () => {
    if (value.by === 'phi') return
    let phiPi = 0
    try {
      phiPi = oscParams({ A: 1, period: { by: 'T', value: 1 }, start: value }).phi / Math.PI
    } catch {
      phiPi = 0
    }
    setPhiText(fmtOscInput(phiPi))
    onChange({ by: 'phi', phiPi })
  }

  const toStateMode = () => {
    if (value.by === 'state') return
    onChange({ by: 'state', x0: '0', dir: 'down' })
  }

  const atBoundary = value.by === 'state' && (value.x0 === 'A' || value.x0 === '-A')

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <button type="button" aria-pressed={value.by === 'state'} onClick={toStateMode} className={pill(value.by === 'state')}>
          Từ x₀, chiều
        </button>
        <button type="button" aria-pressed={value.by === 'phi'} onClick={toPhiMode} className={pill(value.by === 'phi')}>
          Nhập pha φ
        </button>
      </div>
      {value.by === 'state' ? (
        <>
          <div className="grid grid-cols-3 gap-1">
            {OSC_X0S.map((it) => (
              <button
                key={it.id}
                type="button"
                aria-pressed={value.x0 === it.id}
                onClick={() => onChange({ by: 'state', x0: it.id, dir: value.dir })}
                className={pill(value.x0 === it.id)}
              >
                {it.label}
              </button>
            ))}
          </div>
          {atBoundary ? (
            <p className="text-[11.5px] text-ink-3">Tại biên ±A, vận tốc bằng 0 (không phân biệt chiều).</p>
          ) : (
            <div className="flex gap-1.5">
              {(
                [
                  ['up', 'Chiều dương (+)'],
                  ['down', 'Chiều âm (−)'],
                ] as const
              ).map(([d, label]) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={value.dir === d}
                  onClick={() => onChange({ by: 'state', x0: value.x0, dir: d })}
                  className={cn(pill(value.dir === d), 'flex-1')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[12.5px] text-ink-2">φ =</span>
            <input
              value={phiText}
              onChange={(e) => {
                const v = e.target.value
                setPhiText(v)
                onChange({ by: 'phi', phiPi: parseOscExpr(v, false) })
              }}
              placeholder="vd. 0,5 hoặc -1/3"
              aria-label="Pha ban đầu theo đơn vị pi"
              className={cn(inputClass, 'h-9 flex-1')}
            />
            <span className="shrink-0 text-[12.5px] text-ink-2">π (rad)</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {OSC_PHI_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setPhiText(p.text)
                  onChange({ by: 'phi', phiPi: p.val })
                }}
                className={pill(Math.abs(value.phiPi - p.val) < 1e-6)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function OscModal({ initial, submitLabel, onClose, onInsert }: Props<OscSpec>) {
  const [spec, setSpec] = useState<OscSpec>(() => (initial ? { ...OSC_DEFAULT, ...initial } : OSC_DEFAULT))
  const [aText, setAText] = useState(() => fmtOscInput(spec.A))
  const [pText, setPText] = useState(() =>
    spec.period.by === 'omega' ? formatOmega(spec.period.value) : fmtOscInput(spec.period.value),
  )
  const [tEndText, setTEndText] = useState(() => fmtOscInput(spec.tEnd))
  const [sAText, setSAText] = useState(() =>
    spec.second?.A !== undefined ? fmtOscInput(spec.second.A) : '',
  )

  const set = (p: Partial<OscSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'osc', spec }), [spec])
  const { preview, error } = useRender(doc)

  const curT = useMemo(() => {
    try {
      return oscPeriod(spec).T
    } catch {
      return null
    }
  }, [spec])

  const eqText = useMemo(() => {
    try {
      return oscEquation(spec)
    } catch {
      return null
    }
  }, [spec])

  const eq2Text = useMemo(() => {
    if (!spec.second) return null
    try {
      return oscEquation(spec, spec.second)
    } catch {
      return null
    }
  }, [spec])

  const pill = (on: boolean) =>
    cn(
      'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
      on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
    )

  const switchQty = (qty: OscQty) => {
    const isDefaultY = !spec.yName.trim() || Object.values(OSC_Y_DEFAULT).includes(spec.yName)
    set({ qty, ...(isDefaultY ? { yName: OSC_Y_DEFAULT[qty] } : {}) })
  }

  const switchPeriodBy = (by: OscSpec['period']['by']) => {
    if (by === spec.period.by) return
    if (curT) {
      const nextVal = by === 'T' ? curT : by === 'f' ? 1 / curT : (2 * Math.PI) / curT
      setPText(by === 'omega' ? formatOmega(nextVal) : fmtOscInput(nextVal))
      set({ period: { by, value: nextVal } })
    } else {
      set({ period: { by, value: spec.period.value } })
    }
  }

  const applyTEndPreset = (k: number) => {
    if (!curT) return
    const next = Math.round(k * curT * 1e6) / 1e6
    setTEndText(fmtOscInput(next))
    set({ tEnd: next })
  }

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Đại lượng</h3>
        <div className="flex flex-wrap gap-1.5">
          {OSC_QTYS.map((q) => (
            <button key={q.id} type="button" aria-pressed={spec.qty === q.id} onClick={() => switchQty(q.id)} className={pill(spec.qty === q.id)}>
              {q.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Biên độ</h3>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[13px] text-ink-2">A =</span>
          <input
            value={aText}
            onChange={(e) => {
              const v = e.target.value
              setAText(v)
              set({ A: parseOscExpr(v, false) })
            }}
            inputMode="decimal"
            aria-label="Biên độ A (cm)"
            className={cn(inputClass, 'h-9 flex-1')}
          />
          <span className="shrink-0 text-[13px] text-ink-2">cm</span>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Chu kì / Tần số</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {OSC_PERIOD_BY.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={spec.period.by === p.id}
              onClick={() => switchPeriodBy(p.id)}
              className={pill(spec.period.by === p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          value={pText}
          onChange={(e) => {
            const v = e.target.value
            setPText(v)
            set({ period: { by: spec.period.by, value: parseOscExpr(v, spec.period.by === 'omega') } })
          }}
          placeholder={spec.period.by === 'omega' ? 'vd. 2π, π hoặc 10' : 'vd. 2'}
          aria-label="Giá trị chu kì hoặc tần số"
          className={cn(inputClass, 'h-9')}
        />
      </section>

      <section>
        <h3 className={sectionTitle}>
          Trạng thái đầu (<span className="normal-case">t = 0</span>)
        </h3>
        <OscStartPicker value={spec.start} onChange={(start) => set({ start })} />
      </section>

      <section>
        <h3 className={sectionTitle}>Khoảng vẽ (từ 0 đến)</h3>
        <div className="flex items-center gap-2">
          <input
            value={tEndText}
            onChange={(e) => {
              const v = e.target.value
              setTEndText(v)
              set({ tEnd: parseOscExpr(v, false) })
            }}
            inputMode="decimal"
            aria-label="Thời gian kết thúc (s)"
            className={cn(inputClass, 'h-9 flex-1')}
          />
          <span className="shrink-0 text-[13px] text-ink-2">s</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {OSC_TEND_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              disabled={!curT}
              onClick={() => applyTEndPreset(p.k)}
              className={pill(Boolean(curT && Math.abs(spec.tEnd - p.k * curT) < 1e-6))}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Lưới ô nét đứt</h3>
        <div className="flex flex-wrap gap-1.5">
          {OSC_GRIDS.map((g) => (
            <button key={g.id} type="button" aria-pressed={spec.grid === g.id} onClick={() => set({ grid: g.id })} className={pill(spec.grid === g.id)}>
              {g.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Nhãn trên trục</h3>
        <div className="flex flex-wrap gap-1.5">
          {OSC_TICKS.map((t) => (
            <button key={t.id} type="button" aria-pressed={spec.ticks === t.id} onClick={() => set({ ticks: t.id })} className={pill(spec.ticks === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <label className="text-[12.5px] text-ink-2">
          Trục dọc
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.yName} onChange={(e) => set({ yName: e.target.value })} />
        </label>
        <label className="text-[12.5px] text-ink-2">
          Trục ngang
          <input className={cn(inputClass, 'mt-1 h-9')} value={spec.tName} onChange={(e) => set({ tName: e.target.value })} />
        </label>
      </section>

      <section>
        <Check
          checked={Boolean(spec.second)}
          onChange={(on) => {
            if (!on) {
              set({ second: null })
            } else {
              const qty: OscQty = spec.qty === 'x' ? 'v' : 'x'
              setSAText('')
              set({ second: { qty, dashed: true } })
            }
          }}
        >
          Vẽ đường thứ hai để so pha
        </Check>
        {spec.second && (
          <div className="mt-2 space-y-2.5 rounded-[8px] border border-line bg-paper-2 p-3">
            <div className="flex flex-wrap gap-1.5">
              {OSC_QTYS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  aria-pressed={spec.second?.qty === q.id}
                  onClick={() => spec.second && set({ second: { ...spec.second, qty: q.id } })}
                  className={pill(spec.second?.qty === q.id)}
                >
                  {q.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[12.5px] text-ink-2">A₂ =</span>
              <input
                value={sAText}
                onChange={(e) => {
                  const v = e.target.value
                  setSAText(v)
                  if (!spec.second) return
                  set({ second: { ...spec.second, A: v.trim() ? parseOscExpr(v, false) : undefined } })
                }}
                placeholder="Bằng A"
                aria-label="Biên độ đường thứ hai"
                className={cn(inputClass, 'h-9 flex-1')}
              />
              <span className="shrink-0 text-[12.5px] text-ink-2">cm</span>
            </div>
            <Check
              checked={!spec.second.start}
              onChange={(same) => spec.second && set({ second: { ...spec.second, start: same ? undefined : { ...spec.start } } })}
            >
              Cùng trạng thái đầu
            </Check>
            {spec.second.start && (
              <OscStartPicker
                value={spec.second.start}
                onChange={(start) => spec.second && set({ second: { ...spec.second, start } })}
              />
            )}
            <Check
              checked={spec.second.dashed}
              onChange={(dashed) => spec.second && set({ second: { ...spec.second, dashed } })}
            >
              Đường thứ hai nét đứt
            </Check>
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-[6px] bg-clay-tint px-2.5 py-1.5 text-[12px] leading-snug text-clay-deep">
          {error}
        </p>
      )}

      {eqText && (
        <div className="rounded-[6px] border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">
          <div>
            Phương trình: <span className="font-serif text-[13.5px] font-medium text-ink">{eqText}</span>
          </div>
          {eq2Text && (
            <div className="mt-0.5">
              Đường 2: <span className="font-serif text-[13.5px] font-medium text-ink">{eq2Text}</span>
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <ToolShell
      title="Đồ thị dao động điều hoà"
      hint="Nhập biên độ, chu kì và trạng thái đầu; tự tính phương trình và vẽ lưới ô kiểu đề thi"
      inputs={inputs}
      inputsWidth={390}
      preview={preview}
      renderPreview={(img) => (
        <div className="flex max-h-full max-w-full flex-col items-center gap-2.5">
          <img
            src={svgDataUrl(img.svg)}
            alt="Xem trước"
            className="min-h-0 max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain"
          />
          {eqText && (
            <div className="shrink-0 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-center text-[12.5px] text-ink-2">
              <div>
                Phương trình: <span className="font-serif text-[13.5px] font-medium text-ink">{eqText}</span>
              </div>
              {eq2Text && (
                <div className="mt-0.5">
                  Đường 2: <span className="font-serif text-[13.5px] font-medium text-ink">{eq2Text}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật đồ thị' : 'Chèn đồ thị')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Vật lí: Thấu kính mỏng (hội tụ / phân kì)
 * ------------------------------------------------------------------ */

const parseLensNum = (raw: string) => {
  const s = raw.trim().replace(',', '.').replace(/[−–]/g, '-')
  if (!s) return NaN
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

const fmtLensInput = (n: number | undefined, fallback: number) => {
  const v = n !== undefined && Number.isFinite(n) ? n : fallback
  return String(Math.round(v * 1e6) / 1e6).replace('.', ',')
}

const LENS_RAYS: Array<{ id: LensRay; label: string }> = [
  { id: 'parallel', label: 'Tia song song trục chính (→ qua F′)' },
  { id: 'center', label: 'Tia qua quang tâm O (truyền thẳng)' },
  { id: 'focal', label: 'Tia qua tiêu điểm F (→ ló song song)' },
]

const LENS_NAME_FIELDS: Array<{ key: keyof LensNames; label: string; def: string }> = [
  { key: 'A', label: 'A', def: 'A' },
  { key: 'B', label: 'B', def: 'B' },
  { key: 'APrime', label: 'A′', def: 'A′' },
  { key: 'BPrime', label: 'B′', def: 'B′' },
  { key: 'O', label: 'O', def: 'O' },
  { key: 'F', label: 'F', def: 'F' },
  { key: 'FPrime', label: 'F′', def: 'F′' },
]

export function LensModal({ initial, submitLabel, onClose, onInsert }: Props<LensSpec>) {
  const [spec, setSpec] = useState<LensSpec>(() =>
    initial
      ? {
          ...LENS_DEFAULT,
          ...initial,
          rays: initial.rays ? [...initial.rays] : [...(LENS_DEFAULT.rays ?? [])],
          names: { ...LENS_DEFAULT.names, ...initial.names },
        }
      : {
          ...LENS_DEFAULT,
          rays: [...(LENS_DEFAULT.rays ?? [])],
          names: { ...LENS_DEFAULT.names },
        },
  )
  const [fText, setFText] = useState(() => fmtLensInput(spec.f, 10))
  const [dText, setDText] = useState(() => fmtLensInput(spec.d, 30))
  const [hText, setHText] = useState(() => fmtLensInput(spec.h, 2))
  const [showNames, setShowNames] = useState(false)

  const set = (p: Partial<LensSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'lens', spec }), [spec])
  const { preview, error } = useRender(doc)

  const calc = useMemo(() => {
    try {
      return calcLens(spec)
    } catch {
      return null
    }
  }, [spec])

  const rays = spec.rays ?? ['parallel', 'center', 'focal']
  const toggleRay = (id: LensRay, on: boolean) => {
    const next = on ? (rays.includes(id) ? rays : [...rays, id]) : rays.filter((r) => r !== id)
    set({ rays: next })
  }

  const setName = (key: keyof LensNames, val: string) => {
    set({ names: { ...spec.names, [key]: val } })
  }

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Loại thấu kính</h3>
        <Segmented<'converging' | 'diverging'>
          value={spec.type}
          onChange={(type) => set({ type })}
          label="Loại thấu kính"
          className="w-full flex h-10 [&>button]:flex-1 [&>button]:justify-center"
          options={[
            { key: 'converging', label: 'Hội tụ' },
            { key: 'diverging', label: 'Phân kì' },
          ]}
        />
      </section>

      <section>
        <h3 className={sectionTitle}>Số liệu (cm)</h3>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-[12.5px] text-ink-2">
            Tiêu cự f
            <input
              value={fText}
              onChange={(e) => {
                const v = e.target.value
                setFText(v)
                set({ f: parseLensNum(v) })
              }}
              inputMode="decimal"
              aria-label="Tiêu cự f (cm)"
              className={cn(inputClass, 'mt-1 h-9')}
            />
          </label>
          <label className="text-[12.5px] text-ink-2">
            Khoảng cách d
            <input
              value={dText}
              onChange={(e) => {
                const v = e.target.value
                setDText(v)
                set({ d: parseLensNum(v) })
              }}
              inputMode="decimal"
              aria-label="Khoảng cách vật d (cm)"
              className={cn(inputClass, 'mt-1 h-9')}
            />
          </label>
          <label className="text-[12.5px] text-ink-2">
            Cao vật h
            <input
              value={hText}
              onChange={(e) => {
                const v = e.target.value
                setHText(v)
                set({ h: parseLensNum(v) })
              }}
              inputMode="decimal"
              aria-label="Chiều cao vật h (cm)"
              className={cn(inputClass, 'mt-1 h-9')}
            />
          </label>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Các tia sáng đặc biệt</h3>
        {LENS_RAYS.map((r) => (
          <Check key={r.id} checked={rays.includes(r.id)} onChange={(on) => toggleRay(r.id, on)}>
            {r.label}
          </Check>
        ))}
      </section>

      <section>
        <h3 className={sectionTitle}>Hiển thị</h3>
        <Check checked={Boolean(spec.show2F)} onChange={(show2F) => set({ show2F })}>
          Hiện các điểm 2F, 2F′
        </Check>
        <Check checked={Boolean(spec.showValues)} onChange={(showValues) => set({ showValues })}>
          Ghi kích thước d, d′, f trên hình
        </Check>
        <Check checked={Boolean(spec.hideImage)} onChange={(hideImage) => set({ hideImage })}>
          Ẩn ảnh (học sinh tự vẽ)
        </Check>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[13px] text-ink-2">Vật đặt bên</span>
          <Segmented<'left' | 'right'>
            value={spec.objectSide ?? 'left'}
            onChange={(objectSide) => set({ objectSide })}
            label="Vị trí vật"
            className="h-9"
            options={[
              { key: 'left', label: 'Trái' },
              { key: 'right', label: 'Phải' },
            ]}
          />
        </div>
      </section>

      <section>
        <button
          type="button"
          onClick={() => setShowNames((v) => !v)}
          className="text-[12.5px] font-medium text-clay hover:underline"
        >
          {showNames ? 'Thu gọn đặt tên điểm' : 'Đổi tên các điểm (A, B, A′, B′, O, F, F′)'}
        </button>
        {showNames && (
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {LENS_NAME_FIELDS.map((f) => (
              <label key={f.key} className="text-[11.5px] text-ink-3">
                {f.label}
                <input
                  value={spec.names?.[f.key] ?? f.def}
                  onChange={(e) => setName(f.key, e.target.value)}
                  className={cn(inputClass, 'mt-0.5 h-8 px-2 text-[12.5px]')}
                />
              </label>
            ))}
          </div>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-[6px] bg-clay-tint px-2.5 py-1.5 text-[12px] leading-snug text-clay-deep">
          {error}
        </p>
      )}

      {calc && (
        <div className="rounded-[6px] border border-line bg-paper-2 px-3 py-2 text-[12.5px] text-ink-2">
          <div className="font-medium text-ink">{calc.summary}</div>
          {!calc.atInfinity && calc.dPrime !== null && calc.k !== null && (
            <div className="mt-0.5 text-[12px] text-ink-3">
              d′ = {fmtLensNum(calc.dPrime)} cm · k = {fmtLensNum(calc.k)}
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <ToolShell
      title="Thấu kính mỏng"
      hint="Nhập tiêu cự f, khoảng cách d để tính ảnh đúng tỉ lệ và vẽ ba tia sáng đặc biệt"
      inputs={inputs}
      inputsWidth={370}
      preview={preview}
      renderPreview={(img) => (
        <div className="flex max-h-full max-w-full flex-col items-center gap-2.5">
          <img
            src={svgDataUrl(img.svg)}
            alt="Xem trước"
            className="min-h-0 max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain"
          />
          {calc && (
            <div className="shrink-0 rounded-[6px] border border-line bg-surface px-3 py-1.5 text-center text-[12.5px] text-ink-2">
              <span className="font-medium text-ink">{calc.summary}</span>
              {!calc.atInfinity && calc.dPrime !== null && calc.k !== null && (
                <span className="ml-2 text-ink-3">
                  (d′ = {fmtLensNum(calc.dPrime)} cm, k = {fmtLensNum(calc.k)})
                </span>
              )}
            </div>
          )}
        </div>
      )}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Sinh học: Sơ đồ phả hệ
 * ------------------------------------------------------------------ */

const PEDIGREE_HELP: HelpGroups = [
  {
    group: 'Khai báo người (mỗi dòng một người)',
    items: [
      { code: '1: nam bệnh', what: 'Nam bị bệnh (tô đen)' },
      { code: '2: nữ', what: 'Nữ bình thường (ô tròn trắng)' },
      { code: '3: nữ mang gen', what: 'Dị hợp tử (tô nửa hoặc chấm giữa)' },
      { code: '4: nam chết', what: 'Gạch chéo' },
      { code: '5: ?', what: 'Chưa rõ giới tính (hình thoi)' },
    ],
  },
  {
    group: 'Vợ chồng & Con cái',
    items: [
      { code: '1 x 2', what: 'Kết hôn bình thường (đường nối ngang)' },
      { code: '1 xx 2', what: 'Kết hôn cận huyết (đường nối đôi)' },
      { code: '1 x 2 -> 5, 6, 7', what: 'Các con theo thứ tự từ trái sang phải' },
      { code: '1 x 2 -> (8 9)', what: 'Sinh đôi cùng trứng (nhánh có gạch ngang)' },
      { code: '1 x 2 -> [8 9]', what: 'Sinh đôi khác trứng (nhánh chéo)' },
    ],
  },
  {
    group: 'Lệnh khác',
    items: [
      { code: 'hỏi 10', what: 'Đánh dấu dấu "?" cạnh người cần xác định' },
      { code: 'bệnh "mù màu"', what: 'Đặt tên bệnh hiển thị trong chú thích' },
      { code: 'chú thích: có | không', what: 'Bật/tắt khung chú thích' },
      { code: 'kiểu mang gen: tô nửa | chấm', what: 'Cách biểu diễn người mang gen' },
    ],
  },
]

export function PedigreeModal({ initial, submitLabel, onClose, onInsert }: Props<PedigreeSpec>) {
  const [spec, setSpec] = useState<PedigreeSpec>(
    initial ?? {
      text: PEDIGREE_SAMPLE,
      legend: true,
      carrierStyle: 'half',
    },
  )
  const set = (p: Partial<PedigreeSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'pedigree', spec }), [spec])
  const { preview, error } = useRender(doc)
  const errs = [...(error ? [error] : []), ...(preview?.errors ?? []).map((e) => `Dòng ${e.line}: ${e.msg}`)]

  const inputs = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-ink">Mẫu phả hệ</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => set({ text: PEDIGREE_SAMPLE })}
            className="rounded-[5px] border border-line bg-surface px-2 py-1 text-[11.5px] text-ink-2 hover:bg-sunken hover:text-ink"
          >
            Mẫu 3 thế hệ
          </button>
          <button
            type="button"
            onClick={() => set({ text: PEDIGREE_SAMPLE_TWINS })}
            className="rounded-[5px] border border-line bg-surface px-2 py-1 text-[11.5px] text-ink-2 hover:bg-sunken hover:text-ink"
          >
            Mẫu sinh đôi
          </button>
        </div>
      </div>
      <TextBlock
        title="Các dòng phả hệ"
        help={PEDIGREE_HELP}
        intro="Mỗi dòng một khai báo: người, vợ chồng, con cái. Tự động tính thế hệ và căn chỉnh bố cục."
        value={spec.text}
        onChange={(text) => set({ text })}
        rows={10}
        errors={errs}
        label="Các dòng phả hệ"
      />
      <section className="space-y-2">
        <Check checked={spec.legend !== false} onChange={(legend) => set({ legend })}>
          Hiện khung chú thích kí hiệu
        </Check>
        <div className="flex items-center gap-2 pt-1 text-[12.5px] text-ink-2">
          <span>Kiểu mang gen:</span>
          {(
            [
              ['half', 'Tô nửa'],
              ['dot', 'Chấm giữa'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => set({ carrierStyle: val })}
              className={cn(
                'rounded-[5px] border px-2 py-0.5 text-[12px] transition-colors',
                (spec.carrierStyle ?? 'half') === val
                  ? 'border-clay bg-clay-tint font-medium text-clay'
                  : 'border-line text-ink-3 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </>
  )

  return (
    <ToolShell
      title="Sơ đồ phả hệ"
      hint="Kí hiệu SGK Sinh học 12, tự dàn thế hệ, kết hôn cận huyết, sinh đôi, người mang gen"
      inputs={inputs}
      inputsWidth={370}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Sinh học: Bảng lai Punnett
 * ------------------------------------------------------------------ */

const PUNNETT_PRESETS: Array<{ label: string; cross: string }> = [
  { label: 'Aa × Aa', cross: 'Aa x Aa' },
  { label: 'AaBb × AaBb', cross: 'AaBb x AaBb' },
  { label: 'AaBb × Aabb', cross: 'AaBb x Aabb' },
  { label: 'XᴬXᵃ × XᵃY', cross: 'XAXa x XaY' },
  { label: 'AaBbDd × AaBbDd', cross: 'AaBbDd x AaBbDd' },
]

export function PunnettModal({ initial, submitLabel, onClose, onInsert }: Props<PunnettSpec>) {
  const [spec, setSpec] = useState<PunnettSpec>(() => ({ ...PUNNETT_DEFAULT, ...(initial ?? {}) }))
  const set = (p: Partial<PunnettSpec>) => setSpec((s) => ({ ...s, ...p }))
  const [copied, setCopied] = useState(false)

  const doc = useMemo((): ToolDoc => ({ kind: 'punnett', spec }), [spec])
  const { preview, error } = useRender(doc)

  const parseResult = useMemo(() => {
    try {
      return { data: parsePunnettCross(spec), error: null }
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : String(e) }
    }
  }, [spec])

  const pill = (on: boolean) =>
    cn(
      'rounded-[6px] border px-2.5 py-1 text-[12px] transition-colors',
      on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
    )

  const updateTrait = (gene: string, patch: Partial<GeneTrait>) => {
    const oldTraits = spec.traits ?? []
    const existingIdx = oldTraits.findIndex((t) => t.gene.toUpperCase() === gene.toUpperCase())
    let nextTraits: GeneTrait[]
    if (existingIdx >= 0) {
      nextTraits = oldTraits.map((t, i) => (i === existingIdx ? { ...t, ...patch } : t))
    } else {
      nextTraits = [...oldTraits, { gene, ...patch }]
    }
    set({ traits: nextTraits })
  }

  const handleCopyText = async () => {
    try {
      const text = exportPunnettToText(spec)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* bỏ qua */
    }
  }

  const detectedGenes = parseResult.data?.genes ?? []

  const inputs = (
    <>
      <section>
        <div className="mb-1 flex items-center justify-between">
          <label className={sectionTitle}>Phép lai (P)</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleCopyText}
              title="Sao chép toàn bộ kết quả dạng văn bản"
              className="inline-flex items-center gap-1 rounded-[6px] border border-line bg-surface px-2 py-0.5 text-[11.5px] text-ink-2 hover:border-ink-4 hover:text-ink"
            >
              {copied ? <CheckCheck className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
              {copied ? 'Đã chép' : 'Chép text'}
            </button>
          </div>
        </div>
        <input
          type="text"
          value={spec.cross}
          onChange={(e) => set({ cross: e.target.value })}
          placeholder="vd. AaBb × Aabb hoặc XAXa × XaY"
          className={cn(inputClass, 'font-serif text-[14px] font-medium')}
        />
        {parseResult.error && (
          <p className="mt-1.5 rounded-[6px] border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[12px] text-rose-700">
            {parseResult.error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PUNNETT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => set({ cross: p.cross })}
              className={cn(
                'rounded-[6px] border px-2 py-0.5 text-[11.5px] transition-colors',
                spec.cross.trim() === p.cross ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line bg-white text-ink-2 hover:border-ink-4',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Hiển thị các phần</h3>
        <div className="grid grid-cols-2 gap-2">
          <Check checked={spec.showGametes ?? true} onChange={(showGametes) => set({ showGametes })}>
            Giao tử (GP)
          </Check>
          <Check checked={spec.showGrid ?? true} onChange={(showGrid) => set({ showGrid })}>
            Khung Punnett
          </Check>
          <Check checked={spec.showGenotypeRatio ?? true} onChange={(showGenotypeRatio) => set({ showGenotypeRatio })}>
            Tỉ lệ kiểu gen
          </Check>
          <Check checked={spec.showPhenotypeRatio ?? true} onChange={(showPhenotypeRatio) => set({ showPhenotypeRatio })}>
            Tỉ lệ kiểu hình
          </Check>
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Tuỳ chọn khung</h3>
        <div className="flex flex-col gap-2">
          <Check checked={spec.blankGrid ?? false} onChange={(blankGrid) => set({ blankGrid })}>
            Để trống cho học sinh điền
          </Check>
          <Check checked={spec.colorByPhenotype ?? true} onChange={(colorByPhenotype) => set({ colorByPhenotype })}>
            Tô màu ô theo kiểu hình
          </Check>
        </div>
      </section>

      {detectedGenes.length > 0 && (
        <section>
          <h3 className={sectionTitle}>Kiểu hình & Trội lặn từng gen</h3>
          <div className="flex flex-col gap-3">
            {detectedGenes.map((g) => {
              const trait = spec.traits?.find((t) => t.gene.toUpperCase() === g.toUpperCase())
              const dom = trait?.dominance ?? 'complete'
              const phenos = trait?.phenotypes ?? ['', '']
              const isNonComplete = dom === 'incomplete' || dom === 'codominant'

              return (
                <div key={g} className="rounded-[8px] border border-line bg-surface p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-serif text-[13px] font-bold text-ink">Gen {g}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateTrait(g, { dominance: 'complete' })}
                        className={pill(dom === 'complete')}
                      >
                        Trội hoàn toàn
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTrait(g, { dominance: 'incomplete' })}
                        className={pill(dom === 'incomplete')}
                      >
                        Trội không HT
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTrait(g, { dominance: 'codominant' })}
                        className={pill(dom === 'codominant')}
                      >
                        Đồng trội
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="mb-0.5 block text-ink-3">Kiểu hình trội</span>
                      <input
                        type="text"
                        value={phenos[0] || ''}
                        onChange={(e) => {
                          const next: [string, string, string] | [string, string] = isNonComplete
                            ? [e.target.value, phenos[1] || '', phenos[2] || '']
                            : [e.target.value, phenos[1] || '']
                          updateTrait(g, { phenotypes: next })
                        }}
                        placeholder="vd. Hạt vàng, Hoa đỏ"
                        className={cn(inputClass, 'text-[12px]')}
                      />
                    </div>
                    <div>
                      <span className="mb-0.5 block text-ink-3">Kiểu hình lặn</span>
                      <input
                        type="text"
                        value={isNonComplete ? phenos[2] || '' : phenos[1] || ''}
                        onChange={(e) => {
                          const next: [string, string, string] | [string, string] = isNonComplete
                            ? [phenos[0] || '', phenos[1] || '', e.target.value]
                            : [phenos[0] || '', e.target.value]
                          updateTrait(g, { phenotypes: next })
                        }}
                        placeholder="vd. Hạt xanh, Hoa trắng"
                        className={cn(inputClass, 'text-[12px]')}
                      />
                    </div>
                  </div>

                  {isNonComplete && (
                    <div className="mt-2 text-[12px]">
                      <span className="mb-0.5 block text-ink-3">
                        {dom === 'incomplete' ? 'Kiểu hình trung gian' : 'Kiểu hình đồng trội'}
                      </span>
                      <input
                        type="text"
                        value={phenos[1] || ''}
                        onChange={(e) => {
                          const next: [string, string, string] = [phenos[0] || '', e.target.value, phenos[2] || '']
                          updateTrait(g, { phenotypes: next })
                        }}
                        placeholder="vd. Hoa hồng, Nhóm máu AB"
                        className={cn(inputClass, 'text-[12px]')}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className={sectionTitle}>Cỡ chữ: {spec.fontSize ?? 14}px</h3>
        <input
          type="range"
          min={12}
          max={18}
          step={1}
          value={spec.fontSize ?? 14}
          onChange={(e) => set({ fontSize: Number(e.target.value) })}
          aria-label="Cỡ chữ bảng Punnett"
          className="w-full accent-clay"
        />
      </section>
    </>
  )

  return (
    <ToolShell
      title="Bảng lai Punnett"
      hint="Nhập phép lai (vd: AaBb × Aabb, XAXa × XaY); app tự liệt kê giao tử, kẻ khung và đếm tỉ lệ kiểu gen, kiểu hình"
      inputs={inputs}
      inputsWidth={390}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật bảng lai' : 'Chèn bảng lai')}
      canSubmit={Boolean(preview) && !error && !parseResult.error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Chuỗi và lưới thức ăn (Sinh học)
 * ------------------------------------------------------------------ */

export function FoodWebModal({ initial, submitLabel, onClose, onInsert }: Props<FoodWebSpec>) {
  const [spec, setSpec] = useState<FoodWebSpec>(initial ?? DEFAULT_FOODWEB_GRASSLAND)
  const set = (p: Partial<FoodWebSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'foodweb', spec }), [spec])
  const { preview, error } = useRender(doc)

  const lineErrors = useMemo(() => {
    const list: string[] = []
    if (error) list.push(error)
    if (preview?.errors) {
      for (const err of preview.errors) {
        list.push(`Dòng ${err.line}: ${err.msg}`)
      }
    }
    return list
  }, [error, preview?.errors])

  const inputs = (
    <>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className={cn(sectionTitle, 'mb-0')}>Mẫu nhanh</h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setSpec(DEFAULT_FOODWEB_GRASSLAND)}
              className="rounded-[6px] border border-line px-2 py-0.5 text-[12px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
            >
              Lưới đồng cỏ (8 loài)
            </button>
            <button
              type="button"
              onClick={() => setSpec(DEFAULT_FOODWEB_CHAIN)}
              className="rounded-[6px] border border-line px-2 py-0.5 text-[12px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
            >
              Chuỗi đơn (4 loài)
            </button>
          </div>
        </div>
      </section>

      <TextBlock
        title="Các chuỗi / quan hệ thức ăn"
        help={FOODWEB_HELP}
        intro="Mỗi dòng một chuỗi (A -> B -> C) hoặc quan hệ (A -> B, C). Dùng ?A hoặc [A] để ẩn tên loài làm câu hỏi."
        value={spec.text}
        onChange={(text) => set({ text })}
        rows={8}
        errors={lineErrors}
        label="Lưới thức ăn"
      />

      <section>
        <h3 className={sectionTitle}>Bố cục</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['bottom-up', 'Bậc 1 ở dưới (chuẩn SGK)'],
              ['left-right', 'Trái sang phải (chuỗi đơn)'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={(spec.direction ?? 'bottom-up') === id}
              onClick={() => set({ direction: id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                (spec.direction ?? 'bottom-up') === id
                  ? 'border-clay bg-clay-tint font-medium text-clay'
                  : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className={sectionTitle}>Khung nút</h3>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['box', 'Khung bo góc'],
              ['text', 'Chỉ hiện chữ'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={(spec.nodeStyle ?? 'box') === id}
              onClick={() => set({ nodeStyle: id })}
              className={cn(
                'rounded-[6px] border px-2.5 py-1 text-[12.5px] transition-colors',
                (spec.nodeStyle ?? 'box') === id
                  ? 'border-clay bg-clay-tint font-medium text-clay'
                  : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <h3 className={sectionTitle}>Tuỳ chọn hiển thị</h3>
        <Check checked={spec.showLevels ?? false} onChange={(showLevels) => set({ showLevels })}>
          Hiện nhãn bậc dinh dưỡng (SV sản xuất, SV tiêu thụ...)
        </Check>
        <Check checked={spec.connectDecomposers ?? true} onChange={(connectDecomposers) => set({ connectDecomposers })}>
          Nối mũi tên từ các loài tới sinh vật phân giải
        </Check>
      </section>
    </>
  )

  return (
    <ToolShell
      title="Chuỗi và lưới thức ăn"
      hint="Mũi tên chỉ chiều năng lượng; máy tự tính bậc dinh dưỡng từ dưới lên"
      inputs={inputs}
      inputsWidth={360}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview) && !error}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}
