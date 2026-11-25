/** Phần dùng chung của ba luồng đề / slide / bảng vẽ: ngữ cảnh một lượt, gọi lại, nhật ký chạy theo stream. */
import type { Dispatch, SetStateAction } from 'react'
import { callLlm, type LlmMessage, type LlmProgress } from '@/lib/llm'
import type { AiApplyResult } from '@/lib/aiDocContext'
import type { DeckPlan } from '@/lib/aiDeck'
import type { SlideEditOp } from '@/lib/slideEdit'
import { closeLog, tailLine, type ActStep, type AiMode, type ChatTurn } from './turns'

export type AiTask = { name: string; input: Record<string, unknown> }

/** Mọi thứ một lượt gửi cần, dựng trong `send` (AiPanel) rồi đưa cho luồng tương ứng. */
export interface TurnCtx {
  mode: AiMode
  text: string
  intent: 'doc' | 'chat'
  originalRequest: string
  revisingExam: boolean
  userTurn: ChatTurn
  botId: string
  messages: LlmMessage[]
  mainTask: AiTask
  srcInput: Record<string, unknown>
  controller: AbortController
  setTurns: Dispatch<SetStateAction<ChatTurn[]>>
  patchTurn: (p: (turn: ChatTurn) => Partial<ChatTurn>) => void
  logSet: (f: (log: ActStep[]) => ActStep[]) => void
  logStart: (label: string, note?: string) => void
  logPatch: (p: Partial<ActStep>) => void
  contextSummary?: string
  documentDigest?: string
  editContext?: string
  slidePro: boolean
  onApplyBlocks?: (text: string, allowReplace: boolean, request?: string) => AiApplyResult | undefined
  onApplySlides?: (text: string, plan?: DeckPlan) => number | Promise<number>
  onApplyEdits?: (ops: SlideEditOp[], signal: AbortSignal) => string[] | Promise<string[]>
  /** lỗi nội dung nếu áp thử các lệnh (không đổi bài) */
  onCheckEdits?: (ops: SlideEditOp[]) => string[]
  onBoardOps?: (ops: Record<string, unknown>[]) => string[]
}

/** Gọi lại một lượt chưa dùng được: nối thêm lời dặn, hoàn điểm lượt trước qua `retryOf`. */
export const askAgain = (prior: LlmMessage[], note: string, first: { receipt?: string }, opts: Parameters<typeof callLlm>[1]) =>
  callLlm([...prior, { role: 'user', content: note }], { ...opts, retryOf: first.receipt })

/** Nhật ký thật theo stream: Suy nghĩ → Viết đề / Trả lời… */
export function createLiveLog({ mode, text, logSet, logStart, logPatch }: Pick<TurnCtx, 'mode' | 'text' | 'logSet' | 'logStart' | 'logPatch'>) {
  // nhật ký thật khi soạn đề (stream): Suy nghĩ (dòng suy luận chạy theo + số giây) → Viết đề (câu đang viết, N/T câu)
  const totalQ = Number(text.match(/(\d+)\s*câu/i)?.[1]) || 0
  // `as`: được gán trong callback nên TS không được thu hẹp kiểu về ''
  let phase = '' as '' | 'think' | 'write'
  let phaseAt = Date.now()
  let liveAt = 0
  const secs = () => {
    const s = Math.max(1, Math.round((Date.now() - phaseAt) / 1000))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return h ? `${h} giờ${m ? ` ${m} phút` : ''}` : m ? `${m} phút${s % 60 ? ` ${s % 60} giây` : ''}` : `${s} giây`
  }
  const onProgress = (p: LlmProgress) => {
    // server gọi lại / chuyển nguồn AI: giáo viên không cần biết. Bước đang chạy quay về "Suy nghĩ" (đếm giây tiếp),
    // không để nhật ký trống (nguồn mới có thể không stream suy luận)
    if (p.phase === 'retry') {
      if (phase !== 'think') phaseAt = Date.now()
      phase = 'think'
      logSet((l) => [...l.filter((s) => s.state !== 'active' && s.label !== 'Suy nghĩ'), { label: 'Suy nghĩ', state: 'active' }])
      return
    }
    if (p.phase === 'think') {
      if (phase !== 'think') {
        phase = 'think'
        phaseAt = Date.now()
        logStart('Suy nghĩ')
      }
      if (Date.now() - liveAt < 200) return
      liveAt = Date.now()
      logPatch({ note: secs(), live: tailLine(p.thinking, 140) || undefined })
      return
    }
    if (phase !== 'write') {
      // tính số giây TRƯỚC khi đổi phaseAt (hàm cập nhật state chạy sau)
      const took = secs()
      if (phase === 'think') logSet((l) => closeLog(l, 'done', took))
      phase = 'write'
      phaseAt = Date.now()
      // theo chữ model đang viết: JSON thì đang làm bài, chữ thường thì đang trả lời
      logStart(!/^\s*[`{[]/.test(p.text) ? 'Trả lời' : mode === 'slide' ? 'Lập dàn ý' : mode === 'board' ? 'Chuẩn bị nét vẽ' : 'Viết đề')
    }
    if (Date.now() - liveAt < 200) return
    liveAt = Date.now()
    const n = (p.text.match(/"type"\s*:\s*"question"/g) ?? []).length
    const stem = [...p.text.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/g)].at(-1)?.[1]
    logPatch({
      note: n ? (totalQ ? `${Math.min(n, totalQ)}/${totalQ} câu` : `${n} câu`) : undefined,
      live: stem ? tailLine(stem.replace(/\\n/g, ' ').replace(/\\(.)/g, '$1'), 110) : undefined,
    })
  }
  return {
    onProgress,
    secs,
    phase: () => phase,
    /** true = vừa cập nhật chưa đầy 200 ms, bỏ qua lần này */
    throttled: () => {
      if (Date.now() - liveAt < 200) return true
      liveAt = Date.now()
      return false
    },
  }
}

export type LiveLog = ReturnType<typeof createLiveLog>
