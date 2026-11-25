/** Luồng soạn đề: chia nhiều lượt khi đề nguồn dài, và xử lý câu trả lời (áp vào đề hay hiện trong chat). */
import { callLlm, type LlmMessage, type LlmProgress, type LlmResult } from '@/lib/llm'
import { chatOnly, isExamMutationReply, startsWithJson } from '@/lib/aiDocContext'
import { rememberAiTurn } from '@/lib/aiFeedback'
import { mergeChunks, parseChunk, type ChunkJson, type SplitChunk } from '@/lib/examSplit'
import { askAgain, type LiveLog, type TurnCtx } from './flowKit'
import { AI_EFFORT } from './slideGen'
import { closeLog, tailLine } from './turns'

export async function runExamSplit(ctx: TurnCtx, split: SplitChunk[], live: LiveLog) {
  const { mode, userTurn, documentDigest, messages, mainTask, controller, patchTurn, logSet, logStart, logPatch, onApplyBlocks } = ctx
  const parts: ChunkJson[] = []
  const skipped: number[] = []
  const figsOf: boolean[][] = []
  const splitTask = { ...mainTask, input: { ...mainTask.input, ask: false } }
  const lastMsg = messages[messages.length - 1]
  // nhật ký như một lượt thường: Suy nghĩ → Viết đề (N/T câu); suy nghĩ của các lượt sau chạy ngay trong bước Viết đề
  const total = split.reduce((s, c) => s + c.count, 0)
  let doneQ = 0
  const chunkProgress = (p: LlmProgress) => {
        if (p.phase === 'retry') return
        if (p.phase === 'think' && live.phase() !== 'write') return live.onProgress(p)
        // '{' để bước mở ra ghi "Viết đề" (chữ rỗng bị hiểu là đang trả lời)
        if (live.phase() !== 'write') live.onProgress({ ...p, phase: 'write', text: '{' })
        if (live.throttled()) return
        const n = (p.text.match(/"type"\s*:\s*"(?:question|essay)"/g) ?? []).length
        const stem = [...p.text.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/g)].at(-1)?.[1]
        const line = p.phase === 'think' ? tailLine(p.thinking, 140) : stem ? tailLine(stem.replace(/\\n/g, ' ').replace(/\\(.)/g, '$1'), 110) : ''
        logPatch({ note: `${Math.min(doneQ + n, total)}/${total} câu`, live: line || undefined })
      }
  for (let i = 0; i < split.length; i++) {
    controller.signal.throwIfAborted()
    const msgs: LlmMessage[] = [...messages.slice(0, -1), { role: 'user', content: lastMsg.content + split[i].note }]
    const opts = { signal: controller.signal, reasoningEffort: AI_EFFORT.exam, task: splitTask, onProgress: chunkProgress }
    let r = await callLlm(msgs, opts)
    let part = parseChunk(r.content, split[i])
    if (!part) {
      controller.signal.throwIfAborted()
      r = await callLlm(msgs, { ...opts, retryOf: r.receipt, strong: true })
      part = parseChunk(r.content, split[i])
    }
    if (part) {
      parts.push(part)
      figsOf.push(split[i].figs)
    } else skipped.push(i + 1)
    doneQ += split[i].count
  }
  controller.signal.throwIfAborted()
  if (!parts.length) throw new Error('AI không soạn được đề, bạn thử lại nhé.')
  logSet((l) => closeLog(l, 'done', `${doneQ - skipped.reduce((s, k) => s + split[k - 1].count, 0)} câu`))
  logStart('Đưa vào đề')
  await new Promise((r) => setTimeout(r, 350))
  const result = onApplyBlocks!(mergeChunks(parts, figsOf, !skipped.length), true)
  const ok = !!result && !result.failed
  const missing = skipped.map((k) => split[k - 1].sourceRange)
  const note = missing.length ? `\n\nCòn thiếu ${missing.join('; ')} trong đề mẫu.` : ''
  if (ok) rememberAiTurn({ mode, request: userTurn.text, reply: result.text, context: documentDigest })
  patchTurn((t) => ({
    text: (result?.text ?? '') + note,
    pending: false,
    intent: 'doc',
    ...(!ok && userTurn.text ? { retry: userTurn.text } : {}),
    ...(t.log ? { log: closeLog(t.log, ok ? 'done' : 'failed') } : {}),
  }))
}

export async function finishExam(ctx: TurnCtx, res: LlmResult) {
  const { mode, originalRequest, revisingExam, userTurn, botId, documentDigest, messages, mainTask, controller, setTurns, onApplyBlocks } = ctx
  // JSON đề đã được áp vào tài liệu → hiện câu tóm tắt thay vì JSON thô;
  // câu trả lời văn bản thường (không sửa tài liệu) giữ nguyên.
  // model tự chọn: JSON thì áp vào đề, chữ thì hiện trong chat. Ngoại lệ: giáo viên bảo chỉ xem trong chat.
  const only = chatOnly(originalRequest)
  const apply = (content: string) => onApplyBlocks?.(content, !revisingExam, originalRequest)
  let reply = res.content
  // giáo viên bảo chỉ xem trong chat mà AI vẫn trả JSON: xin lại bằng chữ một lần
  if (only && isExamMutationReply(res.content)) {
    const again = await askAgain(messages, 'Trả lời bằng chữ ngay trong chat, không trả JSON, không sửa đề.', res,
      { signal: controller.signal, reasoningEffort: AI_EFFORT.exam, task: mainTask })
    controller.signal.throwIfAborted()
    reply = again.content
  }
  const invalidChat = only && isExamMutationReply(reply)
  let result = !only && startsWithJson(res.content) ? apply(res.content) : undefined
  let applied = res.content
  // đề trả JSON hỏng (thường bị cắt cụt): hoàn token lượt đó và soạn lại đúng một lần
  if (result?.failed && !result.needsConfirm && result.retryable !== false && onApplyBlocks) {
    // gọi lại bằng model mạnh hơn (lượt đầu model nhanh không làm được)
    const again = await askAgain(messages, 'Kết quả trước chưa đưa được vào đề. Hãy trả đủ thao tác hợp lệ với đúng id và nội dung, không chỉ báo đã hoàn tất.', res,
      { signal: controller.signal, reasoningEffort: AI_EFFORT.exam, strong: true, task: mainTask })
    controller.signal.throwIfAborted()
    result = apply(again.content) ?? result
    applied = again.content
  }
  const confirm = !!result?.needsConfirm
  // không áp được: hiện trong chat (kèm phần AI viết nếu đọc được) + nút Thử lại
  const failed = !!result?.failed || invalidChat
  const summary = result && !failed ? result.text : undefined
  const text = invalidChat ? 'AI chưa trả lời được câu hỏi này.' : result?.text ?? reply
  if (failed && import.meta.env.DEV) console.warn('[AI] JSON không áp được:', res.content)
  if (summary) rememberAiTurn({ mode, request: userTurn.text, reply: summary, context: documentDigest })
  setTurns((t) =>
    t.map((turn) =>
      turn.id === botId
        ? {
            ...turn,
            text,
            pending: false,
            intent: result ? 'doc' : 'chat',
            ...(confirm ? { replace: { content: applied, request: originalRequest } } : failed && originalRequest ? { retry: originalRequest } : {}),
            // chỉ có bước khi là lượt soạn đề; trả lời thường (không JSON) thì bỏ danh sách bước
            ...(turn.log
              ? confirm
                // chưa đưa gì vào đề nên không giữ bước "Đưa vào đề"
                ? { log: closeLog(turn.log.filter((s) => s.label !== 'Đưa vào đề'), 'done') }
                : summary
                ? { log: closeLog(turn.log, 'done') }
                : result?.failed
                  ? { log: closeLog(turn.log, 'failed') }
                  : { log: undefined }
              : {}),
          }
        : turn,
    ),
  )
}
