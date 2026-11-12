/**
 * Công cụ Toán: hình học phẳng / hình học không gian. Chọn mẫu hình, đặt tên
 * đỉnh, bật các đường phụ; hình vẽ theo quy ước SGK (không gian: phép chiếu
 * song song, cạnh khuất nét đứt).
 */
import { PickPreview } from './PickPreview'
import { LabelPreview } from './LabelDragPreview'
import { EdgeEditPreview } from './EdgeEditPreview'
import { hasDragCoords, resetDragCoords } from './edgeSnap'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { GEO2D_SHAPES, GEO3D_SHAPES, type Geo2dShape, type Geo2dSpec, type Geo3dShape, type Geo3dSpec } from '@/lib/geometry'
import { renderTool, type ToolImage } from '@/lib/toolSpec'
import { svgDataUrl } from '@/lib/plot'
import { GEO_HELP } from '@/lib/geoConstruct'
import { ChevronDown, CircleHelp, RotateCcw, Waypoints, X } from 'lucide-react'
import { Check, ToolShell, sectionTitle } from './ToolShell'

const FREE_SAMPLE = 'A(0; 4)\nB(0; 0)\nC(7; 0)\nM(2,5; 0)\nAB, AM\nđường BC kéo dài\nnhãn AB "4 km"\nkích thước BC "7 km"'

const isTri2d =(s: Geo2dShape) => ['triangle', 'right-triangle', 'isosceles', 'equilateral', 'inscribed-triangle'].includes(s)
const isQuad2d = (s: Geo2dShape) => ['square', 'rectangle', 'parallelogram', 'rhombus', 'trapezoid'].includes(s)
const isRound3d = (s: Geo3dShape) => s === 'cone' || s === 'cylinder' || s === 'sphere'
const hasBase4 = (s: Geo3dShape) => s.startsWith('pyramid4') || s === 'box' || s === 'cube'

type Props<S> = { initial?: S | null; submitLabel?: string; onClose: () => void; onInsert: (img: ToolImage) => void }

export function Geo2dModal({ initial, submitLabel, onClose, onInsert }: Props<Geo2dSpec>) {
  const [spec, setSpec] = useState<Geo2dSpec>(
    initial ?? { shape: 'triangle', names: ['A', 'B', 'C'], altitude: false, median: false, diagonals: false, circumcircle: false, marks: true },
  )
  const preview = useMemo(() => renderTool({ kind: 'geo2d', spec }), [spec])
  const set = (patch: Partial<Geo2dSpec>) => setSpec((s) => ({ ...s, ...patch }))
  const [mode, setMode] = useState<'pick' | 'label' | 'edge'>('pick')
  const hasDrag = hasDragCoords(spec.extras ?? '')

  const inputs = (
    <>
      <ShapePicker
        options={GEO2D_SHAPES}
        value={spec.shape}
        onPick={(o) =>
          // "Tự do" bắt đầu trống trơn: điền sẵn một hình mẫu để người dùng sửa số, khỏi phải nhớ cú pháp
          set(o.id === 'free' && !(spec.extras ?? '').trim() ? { shape: o.id, names: o.names, extras: FREE_SAMPLE } : { shape: o.id, names: o.names })
        }
      />
      {spec.names.length > 0 && <Names names={spec.names} onChange={(names) => set({ names })} />}
      {spec.shape !== 'free' && (
        <section>
          <h3 className={sectionTitle}>Đường phụ</h3>
          {isTri2d(spec.shape) && (
            <>
              <Check checked={spec.altitude} onChange={(altitude) => set({ altitude })}>Đường cao AH</Check>
              <Check checked={spec.median} onChange={(median) => set({ median })}>Trung tuyến AM</Check>
              {spec.shape !== 'inscribed-triangle' && (
                <Check checked={spec.circumcircle} onChange={(circumcircle) => set({ circumcircle })}>Đường tròn ngoại tiếp</Check>
              )}
            </>
          )}
          {isQuad2d(spec.shape) && <Check checked={spec.diagonals} onChange={(diagonals) => set({ diagonals })}>Hai đường chéo</Check>}
          <Check checked={spec.marks} onChange={(marks) => set({ marks })}>Kí hiệu góc vuông, cạnh bằng nhau</Check>
        </section>
      )}
      <Extras
        value={spec.extras ?? ''}
        onChange={(extras) => set({ extras })}
        errors={preview.errors}
        example={
          spec.shape === 'free'
            ? 'A(0; 4)\nB(0; 0)\nC(7; 0)\nAB, BC, CA\nvuông B A C\nnhãn AB "4 km"\nkích thước BC "7 km"'
            : 'M = trung điểm BC\nAM\nI = trung điểm AM\nH = hình chiếu A lên BC\nAH đứt\nvuông H A C'
        }
      />
    </>
  )
  const hint =
    mode === 'edge'
      ? 'Kéo nút ở đầu cạnh để xoay / đổi độ dài (giữ Alt để tắt hít)'
      : mode === 'label'
        ? 'Kéo chữ nhãn tới vị trí mong muốn'
        : 'Bấm lên cạnh để lấy điểm, kéo từ điểm này sang điểm khác để nối đoạn'
  return (
    <ToolShell
      title="Hình học phẳng"
      hint={hint}
      inputs={inputs}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit
      renderPreview={(img) => (
        <LabelPreview
          img={img}
          labelPos={spec.labelPos}
          onChange={(labelPos) => set({ labelPos })}
          move={mode === 'label'}
          onToggle={() => setMode((m) => (m === 'label' ? 'pick' : 'label'))}
          modeExtra={
            <button
              type="button"
              aria-pressed={mode === 'edge'}
              onClick={() => setMode((m) => (m === 'edge' ? 'pick' : 'edge'))}
              className={cn(
                'flex items-center gap-1 whitespace-nowrap rounded-[6px] border px-1.5 py-1 text-[11.5px] transition-colors',
                mode === 'edge' ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              <Waypoints className="size-3.5" /> Chỉnh cạnh
            </button>
          }
          extraBar={
            <button
              type="button"
              onClick={() => set({ extras: resetDragCoords(spec.extras ?? '') })}
              disabled={!hasDrag}
              title="Xoá các toạ độ do kéo sinh ra"
              className="flex items-center gap-1 whitespace-nowrap rounded-[6px] border border-line px-1.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-ink-4 disabled:pointer-events-none disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" /> Đặt lại hình
            </button>
          }
          previewOverride={mode === 'edge' ? <EdgeEditPreview img={img} extras={spec.extras ?? ''} onExtras={(extras) => set({ extras })} /> : undefined}
          fallback={<PickPreview img={img} extras={spec.extras ?? ''} onExtras={(extras) => set({ extras })} />}
        />
      )}
      onSubmit={() => onInsert(preview)}
      onClose={onClose}
    />
  )
}

export function Geo3dModal({ initial, submitLabel, onClose, onInsert }: Props<Geo3dSpec>) {
  const [spec, setSpec] = useState<Geo3dSpec>(
    initial ?? { shape: 'pyramid4-sa', names: GEO3D_SHAPES[4].names, height: true, diagonals: false, marks: true, tall: 1 },
  )
  const preview = useMemo(() => renderTool({ kind: 'geo3d', spec }), [spec])
  const set = (patch: Partial<Geo3dSpec>) => setSpec((s) => ({ ...s, ...patch }))
  const [mode, setMode] = useState<'pick' | 'label' | 'edge'>('pick')
  const round = isRound3d(spec.shape)
  const hasDrag = hasDragCoords(spec.extras ?? '')

  const inputs = (
    <>
      <ShapePicker
        options={GEO3D_SHAPES}
        value={spec.shape}
        onPick={(o) => {
          set({ shape: o.id, names: o.names })
          if (isRound3d(o.id) && mode === 'edge') setMode('pick')
        }}
      />
      <Names names={spec.names} onChange={(names) => set({ names })} />
      <section>
        <h3 className={sectionTitle}>Đường phụ</h3>
        {spec.shape !== 'sphere' && spec.shape !== 'tetrahedron' && spec.shape !== 'box' && spec.shape !== 'cube' && spec.shape !== 'prism3' && !spec.shape.endsWith('-sa') && (
          <Check checked={spec.height} onChange={(height) => set({ height })}>
            {round ? 'Đường cao, bán kính đáy' : 'Đường cao (chân là tâm/hình chiếu)'}
          </Check>
        )}
        {hasBase4(spec.shape) && <Check checked={spec.diagonals} onChange={(diagonals) => set({ diagonals })}>Đường chéo đáy AC, BD</Check>}
        <Check checked={spec.marks} onChange={(marks) => set({ marks })}>Kí hiệu góc vuông</Check>
      </section>
      {!round && (
        <Extras value={spec.extras ?? ''} onChange={(extras) => set({ extras })} errors={preview.errors} example={'M = trung điểm SC\nO = AC cắt BD\nH = hình chiếu A lên SB\nAM, SO, AH\nvuông H A S'} />
      )}
      {spec.shape !== 'sphere' && spec.shape !== 'cube' && (
        <section>
          <h3 className={sectionTitle}>Chiều cao</h3>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.1}
            value={spec.tall}
            onChange={(e) => set({ tall: Number(e.target.value) })}
            aria-label="Chiều cao hình"
            className="w-full accent-[var(--color-clay)]"
          />
        </section>
      )}
    </>
  )
  const hint =
    mode === 'edge' && !round
      ? 'Kéo nút để đổi vị trí đỉnh (giữ Shift để kéo thẳng đứng, Alt để tắt hít)'
      : mode === 'label'
        ? 'Kéo chữ nhãn tới vị trí mong muốn'
        : 'Bấm lên cạnh để lấy điểm, kéo từ điểm này sang điểm khác để nối đoạn; nét khuất tự vẽ đứt'
  return (
    <ToolShell
      title="Hình học không gian"
      hint={hint}
      inputs={inputs}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit
      renderPreview={(img) => (
        <LabelPreview
          img={img}
          labelPos={spec.labelPos}
          onChange={(labelPos) => set({ labelPos })}
          move={mode === 'label'}
          onToggle={() => setMode((m) => (m === 'label' ? 'pick' : 'label'))}
          modeExtra={
            <button
              type="button"
              disabled={round}
              aria-pressed={mode === 'edge' && !round}
              title={round ? 'Nón, trụ, cầu chưa chỉnh cạnh được' : 'Kéo nút ở đỉnh để chỉnh hình khối'}
              onClick={() => setMode((m) => (m === 'edge' ? 'pick' : 'edge'))}
              className={cn(
                'flex items-center gap-1 whitespace-nowrap rounded-[6px] border px-1.5 py-1 text-[11.5px] transition-colors disabled:pointer-events-none disabled:opacity-40',
                mode === 'edge' && !round ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
              )}
            >
              <Waypoints className="size-3.5" /> Chỉnh cạnh
            </button>
          }
          extraBar={
            <button
              type="button"
              onClick={() => set({ extras: resetDragCoords(spec.extras ?? '') })}
              disabled={!hasDrag || round}
              title="Xoá các toạ độ do kéo sinh ra"
              className="flex items-center gap-1 whitespace-nowrap rounded-[6px] border border-line px-1.5 py-1 text-[11.5px] text-ink-2 transition-colors hover:border-ink-4 disabled:pointer-events-none disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" /> Đặt lại hình
            </button>
          }
          previewOverride={
            mode === 'edge' && !round ? <EdgeEditPreview key={spec.shape} img={img} extras={spec.extras ?? ''} onExtras={(extras) => set({ extras })} /> : undefined
          }
          fallback={
            round ? (
              <img src={svgDataUrl(img.svg)} alt="Xem trước" className="max-h-full max-w-full rounded-[4px] border border-line bg-white object-contain" />
            ) : (
              <PickPreview img={img} extras={spec.extras ?? ''} onExtras={(extras) => set({ extras })} />
            )
          }
        />
      )}
      onSubmit={() => onInsert(preview)}
      onClose={onClose}
    />
  )
}

function ShapePicker<T extends string>({
  options,
  value,
  onPick,
}: {
  options: Array<{ id: T; label: string; names: string[] }>
  value: T
  onPick: (o: { id: T; label: string; names: string[] }) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const cur = options.find((o) => o.id === value)
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase()
  const list = q ? options.filter((o) => norm(o.label).includes(norm(q))) : options
  return (
    <section>
      <h3 className={sectionTitle}>Mẫu hình</h3>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-[6px] bg-clay-tint px-2.5 py-1.5 text-left text-[13px] font-medium text-clay"
      >
        <span className="truncate">{cur?.label ?? 'Chọn hình'}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1.5">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm hình…"
            className={cn(inputClass, 'mb-1 h-8 text-[13px]')}
          />
          <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
            {list.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onPick(o)
                  setOpen(false)
                  setQ('')
                }}
                aria-pressed={value === o.id}
                className={cn(
                  'rounded-[6px] px-2.5 py-1.5 text-left text-[13px] transition-colors',
                  value === o.id ? 'bg-clay-tint font-medium text-clay' : 'text-ink-2 hover:bg-sunken hover:text-ink',
                )}
              >
                {o.label}
              </button>
            ))}
            {!list.length && <p className="px-2.5 py-1.5 text-[12px] text-ink-3">Không có hình nào khớp</p>}
          </div>
        </div>
      )}
    </section>
  )
}

function Extras({ value, onChange, errors, example }: { value: string; onChange: (v: string) => void; errors?: Array<{ line: number; msg: string }>; example: string }) {
  const [help, setHelp] = useState(false)
  return (
    <section className="relative">
      <div className="mb-2 flex items-center gap-1.5">
        <h3 className={cn(sectionTitle, 'mb-0')}>Dựng thêm</h3>
        <button
          type="button"
          onClick={() => setHelp((h) => !h)}
          aria-label="Các lệnh dựng hình"
          aria-expanded={help}
          title="Các lệnh dựng hình"
          className={cn('flex size-5 items-center justify-center rounded-full transition-colors', help ? 'bg-clay text-white' : 'text-ink-3 hover:bg-sunken hover:text-clay')}
        >
          <CircleHelp className="size-4" />
        </button>
      </div>
      {help && <GeoHelp onClose={() => setHelp(false)} />}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        spellCheck={false}
        placeholder={example}
        aria-label="Dựng thêm điểm, đoạn"
        className={cn(inputClass, 'w-full resize-y font-mono text-[13px] leading-[1.5]')}
      />
      {!!errors?.length && (
        <ul className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-clay-deep">
          {errors.map((e, i) => (
            <li key={i}>{e.line ? `Dòng ${e.line}: ` : ''}{e.msg}</li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** bảng lệnh dựng hình, chia nhóm; mỗi lệnh một thẻ (mã lệnh + giải thích) */
function GeoHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-3 rounded-[8px] border border-line bg-surface p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12.5px] text-ink-2">Mỗi dòng một lệnh. Bấm lên hình cũng tự ghi lệnh vào đây.</p>
        <button type="button" onClick={onClose} aria-label="Đóng hướng dẫn" className="rounded p-0.5 text-ink-3 hover:bg-sunken hover:text-ink">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {GEO_HELP.map((g) => (
          <div key={g.group}>
            <h4 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-clay">{g.group}</h4>
            <ul className="flex flex-col gap-1">
              {g.items.map((it) => (
                <li key={it.code} className="rounded-[6px] bg-sunken px-2.5 py-1.5">
                  <code className="block font-mono text-[12.5px] text-ink">{it.code}</code>
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

function Names({ names, onChange }: { names: string[]; onChange: (names: string[]) => void }) {
  return (
    <section>
      <h3 className={sectionTitle}>Tên điểm</h3>
      <div className="flex flex-wrap gap-1.5">
        {names.map((n, i) => (
          <input
            key={i}
            value={n}
            onChange={(e) => onChange(names.map((v, k) => (k === i ? e.target.value : v)))}
            aria-label={`Tên điểm ${i + 1}`}
            className={cn(inputClass, 'h-8 w-12 px-1 py-1 text-center font-serif text-[14px] italic')}
          />
        ))}
      </div>
    </section>
  )
}
