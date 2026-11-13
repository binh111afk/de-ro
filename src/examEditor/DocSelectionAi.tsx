/**
 * Thanh nổi "Hỏi AI" khi bôi đen chữ trong trình soạn đề: gợi ý nhanh + ô gõ
 * yêu cầu, AI trả bản xem trước, bấm "Thay thế" mới đổi chữ trong trang.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { ChartSpline, Check, Copy, MessageSquarePlus, PencilRuler, RotateCcw, Sparkles, X } from 'lucide-react'
import { DOC_REWRITE_PRESETS, planTool, rewriteSelection, wantsPlot, type ToolPlan } from '@/lib/docRewrite'
import { svgDataUrl } from '@/lib/plot'
import { renderTool, type ToolDoc } from '@/lib/toolSpec'
import type { PlotImage } from './tools/GraphToolModal'

type Range = { from: number; to: number; text: string }
type Phase = 'pill' | 'ask' | 'busy' | 'result' | 'plot'

const MIN_CHARS = 2
const TOOL_NAME: Record<ToolDoc['kind'], string> = {
  graph: 'Đồ thị',
  vartable: 'Bảng biến thiên',
  geo2d: 'Hình phẳng',
  geo3d: 'Hình không gian',
  signtable: 'Bảng xét dấu',
  oxy: 'Hệ trục Oxy',
  stats: 'Biểu đồ thống kê',
  circuit: 'Mạch điện',
  motion: 'Đồ thị chuyển động',
  incline: 'Mặt phẳng nghiêng',
  gas: 'Đồ thị trạng thái khí',
  scene: 'Hình thực tế',
  electron: 'Cấu hình electron',
  struct: 'Công thức cấu tạo',
  chemgraph: 'Đồ thị số mol',
  chemeq: 'Phương trình hoá học',
  trig: 'Đường tròn lượng giác',
  probtree: 'Sơ đồ cây xác suất',
  numberline: 'Trục số',
  venn: 'Biểu đồ Ven',
  grouped: 'Bảng ghép nhóm',
  table: 'Bảng số liệu',
  phase: 'Đồ thị chuyển thể',
  osc: 'Đồ thị dao động',
  lens: 'Thấu kính',
  pedigree: 'Sơ đồ phả hệ',
  punnett: 'Bảng lai Punnett',
}
const PLOT_ASK = 'Vẽ hình minh hoạ cho đề này'
const PANEL_W = 340

export function DocSelectionAi({
  editor,
  context,
  onInsertPlot,
  onEditPlot,
  onAskChat,
}: {
  editor: Editor | null
  context?: string
  /** chèn đồ thị AI dựng thành đoạn mới tại `after` (ngay sau khối chứa đoạn chọn) */
  onInsertPlot?: (img: PlotImage, after: number) => void
  /** mở công cụ Đồ thị với cấu hình AI điền sẵn, chèn vào `after` */
  onEditPlot?: (doc: ToolDoc, after: number) => void
  /** "Đưa vào chat": đính kèm đoạn đang chọn vào khung Trợ lý AI */
  onAskChat?: (text: string) => void
}) {
  const [range, setRange] = useState<Range | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null)
  const [phase, setPhase] = useState<Phase>('pill')
  const [ask, setAsk] = useState('')
  const [lastAsk, setLastAsk] = useState('')
  const [lastLabel, setLastLabel] = useState('')
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<ToolPlan | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // đang giữ chuột trong trang: chờ thả chuột mới hiện thanh (khỏi nhấp nháy khi kéo bôi đen)
  const pointerDown = useRef(false)
  const phaseRef = useRef<Phase>('pill')
  phaseRef.current = phase

  const close = useCallback(() => {
    abortRef.current?.abort()
    setRange(null)
    setPhase('pill')
    setPlan(null)
    setAsk('')
    setResult('')
    setError(null)
  }, [])

  // đặt thanh ngay trên đầu vùng chọn (sát mép trên màn hình thì xuống dưới)
  const place = useCallback(
    (r: Range | null) => {
      if (!editor || editor.isDestroyed || !r) return setPos(null)
      const a = editor.view.coordsAtPos(r.from)
      const b = editor.view.coordsAtPos(r.to)
      const vv = typeof window !== 'undefined' ? window.visualViewport : null
      const viewH = vv ? vv.height : window.innerHeight
      const viewW = vv ? vv.width : window.innerWidth
      const viewTop = vv ? vv.offsetTop : 0
      const viewLeft = vv ? vv.offsetLeft : 0

      const panelW = Math.min(PANEL_W, viewW - 16)
      const boxH = boxRef.current?.offsetHeight ?? 40
      const need = boxH + 16

      // không đủ chỗ phía trên cho thanh/bảng (đo ở lần vẽ trước) thì đặt xuống dưới vùng chọn
      const spaceAbove = a.top - viewTop
      const spaceBelow = viewTop + viewH - b.bottom
      const below = spaceAbove < Math.max(120, need) && spaceBelow > spaceAbove
      const top = below
        ? Math.min(b.bottom + 8, viewTop + viewH - boxH - 8)
        : Math.max(viewTop + 8, a.top - 8)
      const left = Math.max(viewLeft + 8, Math.min(a.left, viewLeft + viewW - panelW - 8))
      setPos({ left, top, below })
    },
    [editor],
  )

  const readSelection = useCallback(() => {
    if (!editor || editor.isDestroyed) return
    const { selection, doc } = editor.state
    if (!(selection instanceof TextSelection) || selection.empty) {
      // đang hỏi/xem kết quả thì giữ, chỉ thu khi còn ở dạng nút
      setRange((cur) => (cur && phaseRef.current !== 'pill' ? cur : null))
      return
    }
    const text = doc.textBetween(selection.from, selection.to, '\n', ' ').trim()
    if (text.length < MIN_CHARS) return setRange(null)
    if (phaseRef.current !== 'pill') return
    const r = { from: selection.from, to: selection.to, text }
    setRange(r)
    place(r)
  }, [editor, place])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    const onDown = () => {
      pointerDown.current = true
      if (phaseRef.current === 'pill') setRange(null)
    }
    const onUp = () => {
      pointerDown.current = false
      // chờ ProseMirror cập nhật vùng chọn sau mouseup
      setTimeout(readSelection, 0)
    }
    const onSel = () => {
      if (!pointerDown.current) readSelection()
    }
    dom.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    editor.on('selectionUpdate', onSel)
    return () => {
      dom.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      editor.off('selectionUpdate', onSel)
    }
  }, [editor, readSelection])

  // bảng đổi cỡ (mở ô hỏi, có kết quả, có ảnh xem trước): đặt lại cho khỏi tràn mép màn hình
  useLayoutEffect(() => {
    if (range) place(range)
  }, [phase, plan, result, error]) // eslint-disable-line react-hooks/exhaustive-deps

  // cuộn trang / đổi cỡ cửa sổ / bàn phím ảo: dời thanh theo vùng chọn
  useEffect(() => {
    if (!range) return
    const onMove = () => place(range)
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    vv?.addEventListener('resize', onMove)
    vv?.addEventListener('scroll', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
      vv?.removeEventListener('resize', onMove)
      vv?.removeEventListener('scroll', onMove)
    }
  }, [range, place])

  // bấm ra ngoài khi đang hỏi/xem kết quả thì đóng; Esc cũng đóng
  useEffect(() => {
    if (!range || phase === 'pill') return
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [range, phase, close])

  const send = async (instruction: string, label = instruction) => {
    if (!range || !instruction.trim()) return
    if (onInsertPlot && wantsPlot(instruction)) return void askPlot()
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLastAsk(instruction)
    setLastLabel(label)
    setPhase('busy')
    setError(null)
    try {
      const out = await rewriteSelection(range.text, instruction.trim(), context ?? '', ctrl.signal)
      if (ctrl.signal.aborted) return
      setResult(out)
      setPhase('result')
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(err instanceof Error ? err.message : 'AI chưa trả lời được, thử lại nhé.')
      setPhase('ask')
    }
  }

  // AI đọc đề → cấu hình đồ thị; ảnh do lib/plot.ts vẽ nên luôn đúng toán
  const askPlot = async () => {
    if (!range) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLastAsk(PLOT_ASK)
    setLastLabel('Vẽ hình')
    setPhase('busy')
    setError(null)
    try {
      const p = await planTool(range.text, context ?? '', ctrl.signal)
      if (ctrl.signal.aborted) return
      setPlan(p)
      setPhase('plot')
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(err instanceof Error ? err.message : 'AI chưa đọc được đề, thử lại nhé.')
      setPhase('ask')
    }
  }

  /** ngay sau khối cấp đầu (câu hỏi, đoạn văn…) chứa cuối đoạn chọn */
  const afterPos = () => {
    if (!editor || !range) return null
    const { doc } = editor.state
    if (range.to > doc.content.size) return null
    const $to = doc.resolve(range.to)
    return $to.depth >= 1 ? $to.after(1) : range.to
  }

  const replace = () => {
    if (!editor || editor.isDestroyed || !range) return
    const { doc } = editor.state
    // trang đã đổi trong lúc chờ AI: không thay nhầm chỗ
    const now = range.to <= doc.content.size ? doc.textBetween(range.from, range.to, '\n', ' ').trim() : ''
    if (now !== range.text) {
      setError('Đoạn chữ đã thay đổi trong lúc chờ AI. Bôi đen lại rồi hỏi lại nhé.')
      return
    }
    const sameBlock = doc.resolve(range.from).sameParent(doc.resolve(range.to))
    const text = sameBlock ? result.replace(/\s*\n+\s*/g, ' ') : result
    const tr = editor.state.tr.insertText(text, range.from, range.to)
    tr.setSelection(TextSelection.create(tr.doc, range.from, range.from + text.length))
    editor.view.dispatch(tr)
    editor.commands.focus()
    close()
  }

  if (!range || !pos) return null
  const plotImg = phase === 'plot' && plan ? renderTool(plan.doc) : null

  const keep = (e: React.MouseEvent) => {
    // giữ vùng chọn trong trang khi bấm nút (ô nhập thì cho focus bình thường)
    if (!(e.target as HTMLElement).closest('input,textarea')) e.preventDefault()
  }

  return createPortal(
    <div
      ref={boxRef}
      className="fixed z-[90]"
      style={{ left: pos.left, top: pos.top, transform: pos.below ? undefined : 'translateY(-100%)' }}
      onMouseDown={keep}
    >
      {phase === 'pill' ? (
        <div className="flex h-8 items-stretch overflow-hidden rounded-lg border border-line bg-surface text-[12.5px] font-semibold text-clay shadow-[0_6px_18px_-6px_rgba(35,32,28,0.35)]">
          <button type="button" onClick={() => setPhase('ask')} className="flex items-center gap-1.5 px-2.5 transition-colors hover:bg-paper-2">
            <Sparkles className="size-3.5" />
            Hỏi AI
          </button>
          {onAskChat && range && (
            <button
              type="button"
              title="Đính kèm đoạn đang chọn vào khung chat Trợ lý AI"
              onClick={() => { onAskChat(range.text); close() }}
              className="flex items-center gap-1.5 border-l border-line px-2.5 transition-colors hover:bg-paper-2"
            >
              <MessageSquarePlus className="size-3.5" />
              Đưa vào chat
            </button>
          )}
        </div>
      ) : (
        <div
          role="dialog"
          aria-label="Hỏi AI"
          className="rounded-lg border border-line bg-surface p-2.5 shadow-[0_8px_24px_-6px_rgba(35,32,28,0.3)]"
          style={{ width: `min(${PANEL_W}px, calc(100vw - 16px))`, maxWidth: `calc(100vw - 16px)` }}
        >
          {phase === 'plot' && plan && plotImg ? (
            <>
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
                <ChartSpline className="size-3.5 text-clay" />
                {plan.doc.kind === 'graph' ? `Đồ thị ${plan.doc.spec.curves.map((c) => `y = ${c.expr}`).join('; ')}` : TOOL_NAME[plan.doc.kind]}
              </div>
              <img src={svgDataUrl(plotImg.svg)} alt="Xem trước hình" onLoad={() => place(range)} className="mx-auto block max-h-[260px] max-w-full rounded-md border border-line bg-white" />
              {plan.note && <p className="mt-1.5 text-[12px] leading-snug text-ink-3">{plan.note}</p>}
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const at = afterPos()
                    if (at === null) return setError('Đoạn chữ đã thay đổi, bôi đen lại nhé.')
                    onInsertPlot?.(plotImg, at)
                    close()
                  }}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-md bg-clay px-3 text-[12.5px] font-semibold text-white hover:bg-clay-deep"
                >
                  <Check className="size-3.5" /> Chèn dưới câu hỏi
                </button>
                {onEditPlot && (
                  <button
                    type="button"
                    onClick={() => {
                      const at = afterPos()
                      if (at === null) return setError('Đoạn chữ đã thay đổi, bôi đen lại nhé.')
                      onEditPlot(plan.doc, at)
                      close()
                    }}
                    className="flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[12.5px] text-ink-2 hover:bg-paper-2"
                  >
                    <PencilRuler className="size-3.5" /> Sửa trong công cụ
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Bỏ"
                  onClick={close}
                  className="ml-auto flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-paper-2 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
              {error && (
                <div role="alert" className="mt-2 rounded-md bg-clay-tint px-2 py-1.5 text-[12px] leading-snug text-clay-deep">
                  {error}
                </div>
              )}
            </>
          ) : phase === 'result' ? (
            <>
              <div className="mb-1.5 flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-ink-3">
                <Sparkles className="size-3 text-clay" />
                <span className="truncate">{lastLabel}</span>
              </div>
              <div className="max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-md bg-paper-2 px-2.5 py-2 text-[13px] leading-relaxed text-ink">
                {result}
              </div>
              {error && (
                <div role="alert" className="mt-2 rounded-md bg-clay-tint px-2 py-1.5 text-[12px] leading-snug text-clay-deep">
                  {error}
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={replace}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-md bg-clay px-3 text-[12.5px] font-semibold text-white hover:bg-clay-deep"
                >
                  <Check className="size-3.5" /> Thay thế
                </button>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(result)}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[12.5px] text-ink-2 hover:bg-paper-2"
                >
                  <Copy className="size-3.5" /> Sao chép
                </button>
                <button
                  type="button"
                  onClick={() => void send(lastAsk, lastLabel)}
                  className="flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-[12.5px] text-ink-2 hover:bg-paper-2"
                >
                  <RotateCcw className="size-3.5" /> Thử lại
                </button>
                <button
                  type="button"
                  aria-label="Bỏ"
                  onClick={close}
                  className="ml-auto flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-paper-2 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {onInsertPlot && (
                  <button
                    type="button"
                    disabled={phase === 'busy'}
                    onClick={() => void askPlot()}
                    className="flex items-center gap-1 rounded-full border border-clay/40 bg-clay-tint px-2.5 py-1 text-[12px] font-medium text-clay transition-colors hover:border-clay disabled:opacity-40"
                  >
                    <ChartSpline className="size-3.5" /> Vẽ hình minh hoạ
                  </button>
                )}
                {DOC_REWRITE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={phase === 'busy'}
                    onClick={() => void send(p.ask, p.label)}
                    className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 transition-colors hover:border-clay hover:text-clay disabled:opacity-40"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <form
                className="mt-2 flex gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send(ask)
                }}
              >
                <input
                  autoFocus
                  value={ask}
                  disabled={phase === 'busy'}
                  onChange={(e) => setAsk(e.target.value)}
                  placeholder="Hoặc gõ yêu cầu, câu hỏi…"
                  className="min-w-0 flex-1 rounded-md border border-line px-2 py-1.5 text-[12.5px] outline-none focus:border-clay"
                />
                <button
                  type="submit"
                  disabled={phase === 'busy' || !ask.trim()}
                  className="rounded-md bg-clay px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
                >
                  Gửi
                </button>
              </form>
              {phase === 'busy' && <div className="mt-2 text-[12px] text-ink-3">AI đang viết…</div>}
              {error && (
                <div role="alert" className="mt-2 rounded-md bg-clay-tint px-2 py-1.5 text-[12px] leading-snug text-clay-deep">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>,
    document.body,
  )
}
