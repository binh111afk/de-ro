/** Hộp công cụ Hoá: cấu hình electron, công thức cấu tạo, đồ thị, phương trình phản ứng. */
import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { inputClass } from '@/components/ui'
import { type ToolDoc } from '@/lib/toolSpec'
import type { ChemGraphSpec, ElectronSpec, StructSpec } from '@/lib/chem'
import { CHEMEQ_DEFAULT, type ChemEqSpec } from '@/lib/chemEq'
import { Check, ToolShell, sectionTitle } from './ToolShell'
import { type Props, type HelpGroups, useRender, HelpButton, HelpCards, TextBlock } from './toolModalKit'

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
              data-tip={q.title}
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
