/** Hộp công cụ tiểu học: tranh đếm đồ vật (ghép từ kho hình) và đồng hồ kim. */
import { useEffect, useId, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { SiteSelect } from '@/components/SiteSelect'
import { type ToolDoc } from '@/lib/toolSpec'
import { CLOCK_DEFAULT, OBJECTS_DEFAULT, prepareObjects, type ClockSpec, type ObjectsGroup, type ObjectsSpec } from '@/lib/objects'
import { CONTAINERS, OBJECTS } from '@/lib/objectsCatalog'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { type Props, useRender } from './toolModalKit'

const numInput = cn(inputClass, 'h-8 w-14 px-2 py-1 text-[13px]')
const groupInput = cn(inputClass, 'h-8 px-2 py-1 text-[13px]')
const ITEM_OPTIONS = [{ value: '', label: 'Không có' }, ...Object.entries(OBJECTS).map(([value, label]) => ({ value, label }))]
const CONT_OPTIONS = [{ value: '', label: 'Để rời' }, ...Object.entries(CONTAINERS).map(([value, c]) => ({ value, label: c.name }))]

function GroupRow({ g, onChange, onRemove }: { g: ObjectsGroup; onChange: (p: Partial<ObjectsGroup>) => void; onRemove?: () => void }) {
  const id = useId()
  const num = (v: string, d: number) => (v === '' || !Number.isFinite(Number(v)) ? d : Number(v))
  const itemOptions = g.item && !OBJECTS[g.item]
    ? [...ITEM_OPTIONS, { value: g.item, label: g.itemName ?? g.item.replace(/^x-/, '').replace(/-/g, ' ') }]
    : ITEM_OPTIONS
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] content-start items-start gap-x-2 gap-y-1.5 rounded-[8px] border border-line p-2.5 text-[13px] text-ink-2">
      <span>Đồ chứa</span>
      <label htmlFor={`${id}-count`}>Số nhóm</label>
      <SiteSelect inline value={g.container ?? ''} options={CONT_OPTIONS} onChange={(v) => onChange({ container: v || undefined })} label="Đồ chứa" />
      <input id={`${id}-count`} type="number" min={1} max={10} value={g.count} onChange={(e) => onChange({ count: num(e.target.value, 1) })} className={groupInput} />

      <span>Đồ vật</span>
      <label htmlFor={`${id}-each`}>Số mỗi nhóm</label>
      <SiteSelect inline searchable value={g.item ?? ''} options={itemOptions} onChange={(v) => onChange({ item: v || undefined })} label="Đồ vật" />
      <input id={`${id}-each`} type="number" min={0} max={20} value={g.each} onChange={(e) => onChange({ each: num(e.target.value, 0) })} className={groupInput} />

      <label htmlFor={`${id}-label`} className="col-span-2">Ghi số</label>
      <input id={`${id}-label`} value={g.label ?? ''} maxLength={8} onChange={(e) => onChange({ label: e.target.value || undefined })} className={groupInput} placeholder="10" />
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label="Xoá nhóm" className="flex size-8 items-center justify-center justify-self-end rounded text-ink-3 hover:bg-sunken hover:text-clay">
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export function ObjectsModal({ initial, submitLabel, onClose, onInsert }: Props<ObjectsSpec>) {
  const [spec, setSpec] = useState<ObjectsSpec>(initial ?? OBJECTS_DEFAULT)
  // kho hình nạp sau: xong thì vẽ lại xem trước (trước đó là ô trống)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    // gồm cả đồ vật kho dùng chung có trong hình cũ (nhấp đúp để sửa)
    void prepareObjects(initial ?? OBJECTS_DEFAULT).finally(() => setReady(true))
  }, [initial])
  const doc = useMemo((): ToolDoc => ({ kind: 'objects', spec: ready ? spec : { ...spec } }), [spec, ready])
  const { preview, error } = useRender(doc)
  const setGroup = (i: number, p: Partial<ObjectsGroup>) => setSpec((s) => ({ groups: s.groups.map((g, j) => (j === i ? { ...g, ...p } : g)) }))
  const inputs = (
    <section>
      <h3 className={sectionTitle}>Nhóm đồ vật</h3>
      <div className="flex flex-col gap-2">
        {spec.groups.map((g, i) => (
          <GroupRow key={i} g={g} onChange={(p) => setGroup(i, p)} onRemove={spec.groups.length > 1 ? () => setSpec((s) => ({ groups: s.groups.filter((_, j) => j !== i) })) : undefined} />
        ))}
      </div>
      {spec.groups.length < 4 ? (
        <button
          type="button"
          onClick={() => setSpec((s) => ({ groups: [...s.groups, { item: 'apple', each: 3, count: 1 }] }))}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-clay hover:text-clay-deep"
        >
          <Plus className="size-4" /> Thêm nhóm
        </button>
      ) : null}
      {error ? <p role="alert" className="mt-1.5 text-[12px] text-clay-deep">{error}</p> : null}
    </section>
  )
  return (
    <ToolShell
      title="Tranh đếm đồ vật"
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

export function ClockModal({ initial, submitLabel, onClose, onInsert }: Props<ClockSpec>) {
  const [spec, setSpec] = useState<ClockSpec>(initial ?? CLOCK_DEFAULT)
  const set = (p: Partial<ClockSpec>) => setSpec((s) => ({ ...s, ...p }))
  const doc = useMemo((): ToolDoc => ({ kind: 'clock', spec }), [spec])
  const { preview } = useRender(doc)
  const field = (k: 'hour' | 'minute', label: string, max: number) => (
    <label className="flex items-center gap-2 text-[13px] text-ink-2">
      <input type="number" min={0} max={max} value={spec[k]} onChange={(e) => e.target.value !== '' && set({ [k]: Math.max(0, Math.min(max, Number(e.target.value))) })} className={numInput} />
      {label}
    </label>
  )
  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Giờ</h3>
        <div className="flex items-center gap-3">
          {field('hour', 'giờ', 23)}
          {field('minute', 'phút', 59)}
        </div>
      </section>
      <section>
        <Check checked={spec.numbers !== false} onChange={(numbers) => set({ numbers })}>Ghi số trên mặt đồng hồ</Check>
      </section>
    </>
  )
  return (
    <ToolShell
      title="Đồng hồ"
      inputs={inputs}
      inputsWidth={260}
      preview={preview}
      submitLabel={submitLabel ?? (initial ? 'Cập nhật hình' : 'Chèn hình')}
      canSubmit={Boolean(preview)}
      onSubmit={() => preview && onInsert(preview)}
      onClose={onClose}
    />
  )
}
