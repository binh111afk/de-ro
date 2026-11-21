/**
 * Rút gọn lịch sử hội thoại gửi kèm mỗi lượt gọi AI.
 *
 * Mỗi lượt gọi gửi lại cả lịch sử nên token đầu vào cộng dồn theo độ dài cuộc trò chuyện. Giữ nguyên vài lượt
 * gần nhất; các lượt cũ hơn gộp thành một bản tóm tắt ngắn (mỗi lượt một dòng, cắt đầu) để model vẫn nhớ
 * giáo viên đã yêu cầu gì mà không phải mang cả nội dung cũ. Hội thoại ngắn giữ nguyên, không đổi gì.
 * Thuần chữ, không gọi model: không tốn thêm token để tóm tắt.
 */
import type { LlmMessage } from './llm'

export interface HistoryLimits {
  /** tổng ký tự dưới ngưỡng này thì giữ nguyên toàn bộ */
  freeChars: number
  /** số tin nhắn gần nhất giữ nguyên */
  keepRecent: number
  /** mỗi tin nhắn gần nhất dài hơn mức này thì cắt (giữ đầu) */
  recentClip: number
  /** mỗi tin nhắn cũ trong bản tóm tắt giữ tối đa chừng này ký tự */
  oldClip: number
  /** tổng độ dài bản tóm tắt; vượt thì bỏ các dòng cũ nhất */
  summaryMax: number
}

export const HISTORY_LIMITS: HistoryLimits = { freeChars: 3000, keepRecent: 6, recentClip: 1500, oldClip: 140, summaryMax: 1800 }

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text)
const total = (messages: LlmMessage[]) => messages.reduce((n, m) => n + m.content.length, 0)

export function compactHistory(messages: LlmMessage[], limits: HistoryLimits = HISTORY_LIMITS): LlmMessage[] {
  if (messages.length <= limits.keepRecent || total(messages) <= limits.freeChars) return messages

  const split = messages.length - limits.keepRecent
  const older = messages.slice(0, split)
  const recent = messages.slice(split).map((m) =>
    m.content.length > limits.recentClip ? { ...m, content: `${m.content.slice(0, limits.recentClip).trimEnd()}… [đã rút gọn]` } : m,
  )

  const lines = older
    .filter((m) => m.role !== 'system')
    .map((m) => `- ${m.role === 'user' ? 'Giáo viên' : 'Trợ lý'}: ${clip(oneLine(m.content), limits.oldClip)}`)
  let dropped = false
  while (lines.length > 1 && lines.join('\n').length > limits.summaryMax) {
    lines.shift()
    dropped = true
  }
  const summary =
    'Tóm tắt các lượt trước của cuộc trò chuyện (đã rút gọn, chỉ để nhớ ngữ cảnh' +
    (dropped ? '; các lượt cũ hơn nữa đã lược bỏ' : '') +
    `):\n${lines.join('\n')}`

  // gộp vào tin đầu tiên của phần gần nhất nếu cùng vai người dùng, tránh hai tin user liền nhau
  if (recent[0]?.role === 'user') {
    return [{ ...recent[0], content: `${summary}\n\n---\n${recent[0].content}` }, ...recent.slice(1)]
  }
  return [{ role: 'user', content: summary }, ...recent]
}
