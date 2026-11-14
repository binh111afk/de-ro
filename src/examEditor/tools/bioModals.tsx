/** Hộp công cụ Sinh: phả hệ, Punnett, lưới thức ăn. */
import { useMemo, useState } from 'react'
import { CheckCheck, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { type ToolDoc } from '@/lib/toolSpec'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { PEDIGREE_SAMPLE, PEDIGREE_SAMPLE_TWINS, type PedigreeSpec } from '@/lib/pedigree'
import { PUNNETT_DEFAULT, exportPunnettToText, parsePunnettCross, type GeneTrait, type PunnettSpec } from '@/lib/punnett'
import { DEFAULT_FOODWEB_CHAIN, DEFAULT_FOODWEB_GRASSLAND, FOODWEB_HELP, type FoodWebSpec } from '@/lib/foodweb'
import { type Props, type HelpGroups, useRender, TextBlock } from './toolModalKit'

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
              data-tip="Sao chép toàn bộ kết quả dạng văn bản"
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

/* ------------------------------------------------------------------ *
 * Đường sức điện trường / từ trường (Vật lí 11)
 * ------------------------------------------------------------------ */
