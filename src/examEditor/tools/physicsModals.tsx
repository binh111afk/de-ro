/** Hộp công cụ Vật lí: mạch điện, chuyển động, chất khí, cảnh vật, mặt phẳng nghiêng, chuyển thể, thấu kính, điện trường. */
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { type ToolDoc } from '@/lib/toolSpec'
import { svgDataUrl } from '@/lib/plot'
import { LabelPreview } from './LabelDragPreview'
import { CIRCUIT_HELP, type CircuitSpec } from '@/lib/circuit'
import type { Dir, InclineSpec, MotionSpec } from '@/lib/physics'
import { GAS_DEFAULT, type GasAxes, type GasSpec } from '@/lib/gas'
import { SCENE_DEFAULT, SCENE_HELP, type SceneSpec } from '@/lib/scene'
import { PHASE_DEFAULT, type PhaseSpec } from '@/lib/phaseChange'
import { calcLens, fmtLensNum, LENS_DEFAULT, type LensNames, type LensRay, type LensSpec } from '@/lib/lens'
import { Segmented } from '@/components/Segmented'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { FIELD_DEFAULT, type FieldScene, type FieldSpec } from '@/lib/field'
import { type Props, type HelpGroups, useRender, TextBlock } from './toolModalKit'

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


const FIELD_SCENE_OPTIONS: Array<{ key: FieldScene['type']; label: string }> = [
  { key: 'charge', label: '1 điện tích' },
  { key: 'two-charges', label: '2 điện tích' },
  { key: 'plates', label: 'Bản tụ' },
  { key: 'wire', label: 'Dây ⊙/⊗' },
  { key: 'wire-side', label: 'Dây thẳng' },
  { key: 'loop', label: 'Vòng dây' },
  { key: 'solenoid', label: 'Ống dây' },
  { key: 'magnet', label: 'Nam châm' },
]

function defaultFieldScene(type: FieldScene['type']): FieldScene {
  switch (type) {
    case 'charge':
      return { type: 'charge', sign: '+' }
    case 'two-charges':
      return { type: 'two-charges', signs: ['+', '-'], ratio: 1 }
    case 'plates':
      return { type: 'plates' }
    case 'wire':
      return { type: 'wire', current: 'out' }
    case 'wire-side':
      return { type: 'wire-side', current: 'up' }
    case 'loop':
      return { type: 'loop', current: 'ccw' }
    case 'solenoid':
      return { type: 'solenoid', current: 'right' }
    case 'magnet':
      return { type: 'magnet', orient: 'h' }
  }
}

export function FieldModal({ initial, submitLabel, onClose, onInsert }: Props<FieldSpec>) {
  const [spec, setSpec] = useState<FieldSpec>(() =>
    initial
      ? { ...FIELD_DEFAULT, ...initial }
      : { ...FIELD_DEFAULT },
  )
  const set = (p: Partial<FieldSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'field', spec }), [spec])
  const { preview, error } = useRender(doc)

  const sc = spec.scene
  const isMagnetic = sc.type === 'wire' || sc.type === 'wire-side' || sc.type === 'loop' || sc.type === 'solenoid' || sc.type === 'magnet'

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Cảnh đường sức</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {FIELD_SCENE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={sc.type === opt.key}
              onClick={() => {
                const nextScene = defaultFieldScene(opt.key)
                const nextVec = opt.key === 'wire' || opt.key === 'wire-side' || opt.key === 'loop' || opt.key === 'solenoid' || opt.key === 'magnet' ? 'B' : 'E'
                set({
                  scene: nextScene,
                  ...(spec.probe ? { probe: { ...spec.probe, vector: nextVec } } : {}),
                })
              }}
              className={cn(
                'rounded-[6px] border px-2.5 py-1.5 text-[12.5px] text-left transition-colors',
                sc.type === opt.key
                  ? 'border-clay bg-clay-tint font-medium text-clay'
                  : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {sc.type === 'charge' && (
        <section>
          <h3 className={sectionTitle}>Dấu điện tích</h3>
          <Segmented<'+' | '-'>
            value={sc.sign}
            onChange={(sign) => set({ scene: { type: 'charge', sign } })}
            label="Dấu điện tích"
            className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
            options={[
              { key: '+', label: 'Dương (+)' },
              { key: '-', label: 'Âm (−)' },
            ]}
          />
        </section>
      )}

      {sc.type === 'two-charges' && (
        <section className="flex flex-col gap-2">
          <h3 className={sectionTitle}>Hai điện tích</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[12px] text-ink-3">Điện tích trái (q₁)</span>
              <Segmented<'+' | '-'>
                value={sc.signs[0]}
                onChange={(s0) => set({ scene: { ...sc, signs: [s0, sc.signs[1]] } })}
                label="Dấu q1"
                className="mt-1 w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
                options={[
                  { key: '+', label: '+' },
                  { key: '-', label: '−' },
                ]}
              />
            </div>
            <div>
              <span className="text-[12px] text-ink-3">Điện tích phải (q₂)</span>
              <Segmented<'+' | '-'>
                value={sc.signs[1]}
                onChange={(s1) => set({ scene: { ...sc, signs: [sc.signs[0], s1] } })}
                label="Dấu q2"
                className="mt-1 w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
                options={[
                  { key: '+', label: '+' },
                  { key: '-', label: '−' },
                ]}
              />
            </div>
          </div>
          <label className="text-[12.5px] text-ink-2">
            Tỉ số độ lớn |q₂| / |q₁| ({(sc.ratio ?? 1).toFixed(1).replace('.', ',')})
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.5}
              value={sc.ratio ?? 1}
              onChange={(e) => set({ scene: { ...sc, ratio: Number(e.target.value) } })}
              className="mt-1 w-full accent-clay"
            />
          </label>
        </section>
      )}

      {sc.type === 'wire' && (
        <section>
          <h3 className={sectionTitle}>Chiều dòng điện</h3>
          <Segmented<'out' | 'in'>
            value={sc.current}
            onChange={(current) => set({ scene: { type: 'wire', current } })}
            label="Chiều dòng điện"
            className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
            options={[
              { key: 'out', label: 'Đi ra (⊙)' },
              { key: 'in', label: 'Đi vào (⊗)' },
            ]}
          />
        </section>
      )}

      {sc.type === 'wire-side' && (
        <section>
          <h3 className={sectionTitle}>Chiều dòng điện</h3>
          <Segmented<'up' | 'down'>
            value={sc.current}
            onChange={(current) => set({ scene: { type: 'wire-side', current } })}
            label="Chiều dòng điện"
            className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
            options={[
              { key: 'up', label: 'Đi lên (↑)' },
              { key: 'down', label: 'Đi xuống (↓)' },
            ]}
          />
        </section>
      )}

      {sc.type === 'loop' && (
        <section>
          <h3 className={sectionTitle}>Chiều dòng điện (mặt cắt)</h3>
          <Segmented<'ccw' | 'cw'>
            value={sc.current}
            onChange={(current) => set({ scene: { type: 'loop', current } })}
            label="Chiều dòng điện vòng dây"
            className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
            options={[
              { key: 'ccw', label: 'Trên ⊙, dưới ⊗' },
              { key: 'cw', label: 'Trên ⊗, dưới ⊙' },
            ]}
          />
        </section>
      )}

      {sc.type === 'solenoid' && (
        <section>
          <h3 className={sectionTitle}>Chiều dòng điện qua ống dây</h3>
          <Segmented<'right' | 'left'>
            value={sc.current}
            onChange={(current) => set({ scene: { type: 'solenoid', current } })}
            label="Chiều dòng điện ống dây"
            className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
            options={[
              { key: 'right', label: 'Trái → phải (mặt trước ↑)' },
              { key: 'left', label: 'Phải → trái (mặt trước ↓)' },
            ]}
          />
        </section>
      )}

      {sc.type === 'magnet' && (
        <section>
          <h3 className={sectionTitle}>Hướng nam châm</h3>
          <Segmented<'h' | 'v'>
            value={sc.orient}
            onChange={(orient) => set({ scene: { type: 'magnet', orient } })}
            label="Hướng nam châm"
            className="w-full flex h-9 [&>button]:flex-1 [&>button]:justify-center"
            options={[
              { key: 'h', label: 'Nằm ngang (N–S)' },
              { key: 'v', label: 'Thẳng đứng' },
            ]}
          />
        </section>
      )}

      <section className="flex flex-col gap-1.5">
        <h3 className={sectionTitle}>Đường sức &amp; hiển thị</h3>
        <label className="text-[12.5px] text-ink-2">
          Số đường sức: {spec.lines}
          <input
            type="range"
            min={4}
            max={16}
            step={2}
            value={spec.lines}
            onChange={(e) => set({ lines: Number(e.target.value) })}
            className="mt-1 w-full accent-clay"
          />
        </label>
        <Check checked={spec.showArrows} onChange={(showArrows) => set({ showArrows })}>
          Hiện mũi tên chiều trên đường sức
        </Check>
        <Check checked={spec.labels} onChange={(labels) => set({ labels })}>
          Hiện nhãn (q, I, N, S, E⃗/B⃗)
        </Check>
        {sc.type !== 'wire-side' && (
          <Check
            checked={Boolean(spec.probe)}
            onChange={(on) =>
              set({
                probe: on ? { x: 0, y: 0.65, vector: isMagnetic ? 'B' : 'E' } : undefined,
              })
            }
          >
            Vẽ vectơ tại điểm M
          </Check>
        )}
        {spec.probe && sc.type !== 'wire-side' && (
          <div className="grid grid-cols-2 gap-2 pl-6">
            <label className="text-[12px] text-ink-3">
              xM ({spec.probe.x.toFixed(1).replace('.', ',')})
              <input
                type="range"
                min={-1.8}
                max={1.8}
                step={0.1}
                value={spec.probe.x}
                onChange={(e) =>
                  set({ probe: { ...spec.probe!, x: Number(e.target.value) } })
                }
                className="mt-0.5 w-full accent-clay"
              />
            </label>
            <label className="text-[12px] text-ink-3">
              yM ({spec.probe.y.toFixed(1).replace('.', ',')})
              <input
                type="range"
                min={-1.2}
                max={1.2}
                step={0.1}
                value={spec.probe.y}
                onChange={(e) =>
                  set({ probe: { ...spec.probe!, y: Number(e.target.value) } })
                }
                className="mt-0.5 w-full accent-clay"
              />
            </label>
          </div>
        )}
      </section>
    </>
  )

  return (
    <ToolShell
      title="Đường sức điện trường / từ trường"
      hint="Vẽ đường sức chuẩn SGK Vật lí 11 (in đen trắng rõ nét)"
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
