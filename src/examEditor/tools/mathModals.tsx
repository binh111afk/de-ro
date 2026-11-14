/** Hộp công cụ Toán: bảng xét dấu, Oxy, thống kê, ghép nhóm, lượng giác, cây, trục số, Venn, bảng. */
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { type ToolDoc } from '@/lib/toolSpec'
import { svgDataUrl } from '@/lib/plot'
import { LabelPreview } from './LabelDragPreview'
import { TrigPickPreview } from './TrigPickPreview'
import { autoSignTable, parseSignTableText, signTableToText, type SignTableSpec } from '@/lib/signTable'
import { OXY_HELP, type OxySpec } from '@/lib/oxy'
import type { ChartKind, StatsSpec } from '@/lib/stats'
import type { NumberLineSpec, TreeSpec, TrigSpec, VennSpec } from '@/lib/mathExtra'
import { groupedStats, parseGroups, round2, type GroupedSpec, type GroupedView } from '@/lib/grouped'
import { TABLE_DEFAULT, parseCells, parseMerges, type TableAlign, type TableBorder, type TableHeader, type TableSpec } from '@/lib/table'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { type Props, type HelpGroups, useRender, TextBlock } from './toolModalKit'

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
