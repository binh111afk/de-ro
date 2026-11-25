/** Luồng bảng vẽ: câu trả lời có lệnh vẽ thì áp lên bảng, không thì là câu trả lời chữ. */
import { extractJson, type LlmResult } from '@/lib/llm'
import type { TurnCtx } from './flowKit'
import { closeLog } from './turns'

export function finishBoard({ patchTurn, onBoardOps }: TurnCtx, res: LlmResult) {
  let say = res.content
  let lines: string[] = []
  let appliedOps = false
  if (onBoardOps && /"ops"\s*:/.test(res.content)) {
    try {
      const raw = extractJson(res.content) as { say?: unknown; ops?: unknown }
      if (Array.isArray(raw.ops)) {
        appliedOps = true
        lines = onBoardOps(raw.ops.filter((o): o is Record<string, unknown> => !!o && typeof o === 'object'))
        say = typeof raw.say === 'string' ? raw.say : ''
      }
    } catch {
      say = 'AI trả lệnh vẽ không đọc được, bạn thử nói lại ngắn hơn nhé.'
    }
  }
  const text = [say.trim(), lines.length ? lines.map((l) => `• ${l}`).join('\n') : '', lines.length ? 'Bấm Ctrl+Z trên bảng nếu muốn hoàn tác.' : '']
    .filter(Boolean).join('\n\n')
  patchTurn((t) => ({ text, pending: false, intent: appliedOps ? 'doc' : 'chat', ...(t.log ? { log: appliedOps ? closeLog(t.log, 'done') : undefined } : {}) }))
}
