/**
 * Bảng vẽ — hộp thoại: công thức, chọn trang PDF, xuất PNG/PDF.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FORMULA_SNIPPETS, svgToDataUrl, texToSvg } from './formula'
import { openPdf, renderPdfPage, type ExportBg } from './io'

function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-4" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col rounded-[12px] bg-surface shadow-xl ${wide ? 'max-w-[760px]' : 'max-w-[520px]'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <b className="text-[14px] text-ink">{title}</b>
          <button type="button" aria-label="Đóng" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-[6px] text-ink-2 hover:bg-sunken">✕</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">{children}</div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>
      </div>
    </div>
  )
}

const btn = 'h-8 rounded-[7px] px-3 text-[13px] border border-line text-ink hover:bg-sunken disabled:opacity-50'
const primary = 'h-8 rounded-[7px] px-3 text-[13px] bg-clay text-white hover:brightness-95 disabled:opacity-50'

/* ---------------- công thức ---------------- */

export interface FormulaResult { latex: string; src: string; w: number; h: number }

export function FormulaDialog({ initial, color, onClose, onDone }: {
  initial?: string
  color: string
  onClose: () => void
  onDone: (r: FormulaResult) => void
}) {
  const [tex, setTex] = useState(initial ?? '')
  const [prev, setPrev] = useState<{ src: string; w: number; h: number; error: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => {
    let off = false
    const t = window.setTimeout(async () => {
      if (!tex.trim()) { setPrev(null); setLoading(false); return }
      const r = await texToSvg(tex, 32, color)
      if (!off) { setPrev({ src: svgToDataUrl(r.svg), w: r.w, h: r.h, error: r.error }); setLoading(false) }
    }, 150)
    return () => { off = true; window.clearTimeout(t) }
  }, [tex, color])

  const add = (s: string) => {
    const ta = ref.current
    if (!ta) return setTex(tex + s)
    const a = ta.selectionStart, b = ta.selectionEnd
    setTex(tex.slice(0, a) + s + tex.slice(b))
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = a + s.length })
  }
  const ok = !!prev && !prev.error && !!tex.trim()
  const done = () => { if (ok) onDone({ latex: tex.trim(), src: prev!.src, w: prev!.w, h: prev!.h }) }

  return (
    <Modal title={initial ? 'Sửa công thức' : 'Chèn công thức'} onClose={onClose}
      footer={<><button type="button" className={btn} onClick={onClose}>Huỷ</button><button type="button" className={primary} disabled={!ok} onClick={done}>{initial ? 'Cập nhật' : 'Chèn'}</button></>}>
      <div className="mb-2 flex flex-wrap gap-1">
        {FORMULA_SNIPPETS.map((s) => (
          <button key={s.label} type="button" data-tip={s.tex} onClick={() => add(s.tex)}
            className="h-7 min-w-8 rounded-[6px] border border-line px-2 text-[13px] text-ink hover:bg-sunken">{s.label}</button>
        ))}
      </div>
      <textarea
        ref={ref} rows={3} value={tex} onChange={(e) => setTex(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); done() } }}
        placeholder="Nhập LaTeX, ví dụ: x = \frac{-b \pm \sqrt{\Delta}}{2a}"
        className="w-full resize-y rounded-[8px] border border-line bg-white p-2 font-mono text-[13px] text-ink outline-none focus:border-clay"
      />
      <div className="mt-2 grid min-h-[90px] place-items-center overflow-auto rounded-[8px] border border-dashed border-line bg-white p-3">
        {loading ? <span className="text-[12px] text-ink-3">Đang tải bộ vẽ công thức…</span>
          : !prev ? <span className="text-[12px] text-ink-3">Xem trước công thức ở đây</span>
          : prev.error ? <span className="text-[12px] text-red-600">Lỗi: {prev.error}</span>
          : <img src={prev.src} width={prev.w} height={prev.h} alt="Xem trước công thức" />}
      </div>
      <p className="mt-2 text-[11.5px] text-ink-3">Ctrl + Enter để {initial ? 'cập nhật' : 'chèn'}. Bấm đúp vào công thức trên bảng để sửa lại.</p>
    </Modal>
  )
}

/* ---------------- chọn trang PDF ---------------- */

export function PdfPagesDialog({ file, onClose, onDone }: {
  file: File
  onClose: () => void
  onDone: (pages: { src: string; w: number; h: number }[]) => void
}) {
  const [doc, setDoc] = useState<Awaited<ReturnType<typeof openPdf>> | null>(null)
  const [thumbs, setThumbs] = useState<string[]>([])
  const [pick, setPick] = useState<Set<number>>(new Set())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let off = false
    let d: Awaited<ReturnType<typeof openPdf>> | null = null
    ;(async () => {
      try {
        d = await openPdf(file)
        if (off) return
        setDoc(d)
        setPick(new Set(d.numPages <= 10 ? Array.from({ length: d.numPages }, (_, i) => i + 1) : [1]))
        for (let i = 1; i <= Math.min(d.numPages, 60); i++) {
          const p = await renderPdfPage(d, i, 160)
          if (off) return
          setThumbs((t) => [...t, p.src])
        }
      } catch {
        if (!off) setErr('Không mở được file PDF này.')
      }
    })()
    return () => { off = true; d?.close() }
  }, [file])

  const n = doc?.numPages ?? 0
  const toggle = (i: number) => setPick((s) => { const x = new Set(s); if (x.has(i)) x.delete(i); else x.add(i); return x })
  const done = async () => {
    if (!doc || !pick.size) return
    setBusy(true)
    try {
      const out = []
      for (const i of [...pick].sort((a, b) => a - b)) out.push(await renderPdfPage(doc, i, 1240))
      onDone(out)
    } catch {
      setErr('Lỗi khi đọc trang PDF.')
      setBusy(false)
    }
  }

  return (
    <Modal wide title={`Chèn PDF — ${file.name}`} onClose={onClose}
      footer={<>
        <span className="mr-auto self-center text-[12px] text-ink-3">{n ? `Đã chọn ${pick.size}/${n} trang${n > 60 ? ' (chỉ hiện 60 trang đầu)' : ''}` : ''}</span>
        <button type="button" className={btn} onClick={() => setPick(new Set(Array.from({ length: Math.min(n, 60) }, (_, i) => i + 1)))} disabled={!n}>Chọn hết</button>
        <button type="button" className={btn} onClick={() => setPick(new Set())} disabled={!pick.size}>Bỏ chọn</button>
        <button type="button" className={btn} onClick={onClose}>Huỷ</button>
        <button type="button" className={primary} disabled={!pick.size || busy} onClick={done}>{busy ? 'Đang chèn…' : `Chèn ${pick.size} trang`}</button>
      </>}>
      {err ? <p className="text-[13px] text-red-600">{err}</p>
        : !doc ? <p className="text-[13px] text-ink-3">Đang mở PDF…</p>
        : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
            {Array.from({ length: Math.min(n, 60) }, (_, k) => k + 1).map((i) => {
              const on = pick.has(i)
              return (
                <button key={i} type="button" aria-pressed={on} onClick={() => toggle(i)} className="flex flex-col items-center gap-1 text-[12px]">
                  <span className={`relative block w-full overflow-hidden rounded-[6px] border bg-white ${on ? 'border-clay ring-2 ring-clay/30' : 'border-line'}`}>
                    {thumbs[i - 1] ? <img src={thumbs[i - 1]} alt={`Trang ${i}`} className="block w-full" /> : <span className="block aspect-[3/4]" />}
                    <span className={`absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border text-[11px] ${on ? 'border-clay bg-clay text-white' : 'border-line bg-white text-transparent'}`}>✓</span>
                  </span>
                  <span className={on ? 'font-medium text-clay' : 'text-ink-2'}>Trang {i}</span>
                </button>
              )
            })}
          </div>
        )}
    </Modal>
  )
}

/* ---------------- xuất ---------------- */

export type ExportArea = 'all' | 'view' | 'selection'
export interface ExportChoice { format: 'png' | 'pdf' | 'pdf-pages'; area: ExportArea; bg: ExportBg; scale: number }

export function ExportDialog({ hasSelection, hasPages, onClose, onDone }: {
  hasSelection: boolean
  /** bảng có trang PDF mở để ghi chú: cho xuất theo trang gốc (mặc định) */
  hasPages?: boolean
  onClose: () => void
  onDone: (c: ExportChoice) => Promise<void>
}) {
  const [c, setC] = useState<ExportChoice>({ format: hasPages ? 'pdf-pages' : 'png', area: hasSelection ? 'selection' : 'all', bg: 'white', scale: 2 })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = <K extends keyof ExportChoice>(k: K, v: ExportChoice[K]) => setC((o) => ({ ...o, [k]: v, ...(k === 'format' && v === 'pdf' && o.bg === 'none' ? { bg: 'white' as ExportBg } : {}) }))
  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="mb-3"><div className="mb-1 text-[12px] font-medium text-ink-2">{label}</div><div className="flex flex-wrap gap-1.5">{children}</div></div>
  )
  const Opt = ({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) => (
    <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick}
      className={`h-8 rounded-[7px] border px-3 text-[13px] disabled:opacity-40 ${on ? 'border-clay bg-clay/10 text-clay' : 'border-line text-ink hover:bg-sunken'}`}>{children}</button>
  )
  const go = async () => {
    setBusy(true)
    setErr('')
    try {
      await onDone(c)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Xuất thất bại')
      setBusy(false)
    }
  }
  return (
    <Modal title="Xuất bảng vẽ" onClose={onClose}
      footer={<><button type="button" className={btn} onClick={onClose}>Huỷ</button><button type="button" className={primary} disabled={busy} onClick={go}>{busy ? 'Đang xuất…' : `Xuất ${c.format === 'png' ? 'PNG' : 'PDF'}`}</button></>}>
      <Row label="Định dạng">
        <Opt on={c.format === 'png'} onClick={() => set('format', 'png')}>Ảnh PNG</Opt>
        <Opt on={c.format === 'pdf'} onClick={() => set('format', 'pdf')}>PDF (chia trang A4)</Opt>
        {hasPages && <Opt on={c.format === 'pdf-pages'} onClick={() => set('format', 'pdf-pages')}>PDF theo trang gốc</Opt>}
      </Row>
      {c.format === 'pdf-pages' && <p className="mb-3 text-[12px] text-ink-2">Mỗi trang PDF đã mở ra một trang, đúng khổ giấy gốc, kèm nét vẽ trên trang đó.</p>}
      {c.format !== 'pdf-pages' && <>
      <Row label="Vùng xuất">
        <Opt on={c.area === 'all'} onClick={() => set('area', 'all')}>Toàn bộ nội dung</Opt>
        <Opt on={c.area === 'view'} onClick={() => set('area', 'view')}>Vùng đang nhìn</Opt>
        <Opt on={c.area === 'selection'} disabled={!hasSelection} onClick={() => set('area', 'selection')}>Hình đang chọn</Opt>
      </Row>
      <Row label="Nền">
        <Opt on={c.bg === 'white'} onClick={() => set('bg', 'white')}>Trắng</Opt>
        <Opt on={c.bg === 'paper'} onClick={() => set('bg', 'paper')}>Giữ kiểu giấy</Opt>
        <Opt on={c.bg === 'none'} disabled={c.format === 'pdf'} onClick={() => set('bg', 'none')}>Trong suốt</Opt>
      </Row>
      </>}
      <Row label="Độ nét">
        {[1, 2, 3].map((s) => <Opt key={s} on={c.scale === s} onClick={() => set('scale', s)}>{s}×</Opt>)}
      </Row>
      {err && <p className="text-[12.5px] text-red-600">{err}</p>}
    </Modal>
  )
}
