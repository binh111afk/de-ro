/**
 * Công cụ Toán: hình học phẳng / hình học không gian. Chọn mẫu hình, đặt tên
 * đỉnh, bật các đường phụ; hình vẽ theo quy ước SGK (không gian: phép chiếu
 * song song, cạnh khuất nét đứt).
 */
import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { GEO2D_SHAPES, GEO3D_SHAPES, type Geo2dShape, type Geo2dSpec, type Geo3dShape, type Geo3dSpec } from '@/lib/geometry'
import { renderTool, type ToolImage } from '@/lib/toolSpec'
import { Check, ToolShell, sectionTitle } from './ToolShell'

const isTri2d = (s: Geo2dShape) => ['triangle', 'right-triangle', 'isosceles', 'equilateral', 'inscribed-triangle'].includes(s)
const isQuad2d = (s: Geo2dShape) => ['square', 'rectangle', 'parallelogram', 'rhombus', 'trapezoid'].includes(s)
const isRound3d = (s: Geo3dShape) => s === 'cone' || s === 'cylinder' || s === 'sphere'
const hasBase4 = (s: Geo3dShape) => s.startsWith('pyramid4') || s === 'box' || s === 'cube'

type Props<S> = { initial?: S | null; submitLabel?: string; onClose: () => void; onInsert: (img: ToolImage) => void }

export function Geo2dModal({ initial, submitLabel, onClose, onInsert }: Props<Geo2dSpec>) {
  const [spec, setSpec] = useState<Geo2dSpec>(
    initial ?? { shape: 'triangle', names: GEO2D_SHAPES[0].names, altitude: false, median: false, diagonals: false, circumcircle: false, marks: true },
  )
  const preview = useMemo(() => renderTool({ kind: 'geo2d', spec }), [spec])
  const set = (patch: Partial<Geo2dSpec>) => setSpec((s) => ({ ...s, ...patch }))

  const inputs = (
    <>
      <ShapePicker
        options={GEO2D_SHAPES}
        value={spec.shape}
        onPick={(o) => set({ shape: o.id, names: o.names })}
      />
      <Names names={spec.names} onChange={(names) => set({ names })} />
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
    </>
  )
  return (
    <ToolShell
      title="Hình học phẳng"
      hint="Chọn mẫu hình, đổi tên đỉnh, bật đường phụ cần dùng"
      inputs={inputs}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit
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
  const round = isRound3d(spec.shape)

  const inputs = (
    <>
      <ShapePicker options={GEO3D_SHAPES} value={spec.shape} onPick={(o) => set({ shape: o.id, names: o.names })} />
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
  return (
    <ToolShell
      title="Hình học không gian"
      hint="Hình biểu diễn theo phép chiếu song song, cạnh khuất vẽ nét đứt"
      inputs={inputs}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit
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
  return (
    <section>
      <h3 className={sectionTitle}>Mẫu hình</h3>
      <div className="flex flex-col gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o)}
            aria-pressed={value === o.id}
            className={cn(
              'rounded-[6px] px-2.5 py-1.5 text-left text-[13px] transition-colors',
              value === o.id ? 'bg-clay-tint font-medium text-clay' : 'text-ink-2 hover:bg-sunken hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
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
