/**
 * Tín hiệu người dùng không hài lòng với AI (việc 4 phiên 46), gửi về bảng `ai_feedback` qua POST /api/quota:
 * - `down`: bấm 👎 dưới câu trả lời
 * - `undo`: bấm hoàn tác ngay sau khi AI sửa đề
 * - `resend`: gửi lại yêu cầu gần giống lượt trước
 * - `complaint`: nhắn kiểu "sai rồi", "không đúng"
 * Gửi lặng lẽ, lỗi thì bỏ qua.
 */
import { apiFetch } from '@/lib/apiFetch'

export type AiFeedbackKind = 'up' | 'down' | 'undo' | 'resend' | 'complaint'
export interface AiTurnInfo {
  mode: 'exam' | 'slide' | 'board'
  request: string
  reply: string
  /** tóm tắt tài liệu lúc gửi, để dựng lại ca thử */
  context?: string
}

/** lượt AI gần nhất đã sửa tài liệu (cho tín hiệu hoàn tác ở trình soạn) */
let lastTurn: (AiTurnInfo & { at: number }) | null = null
export function rememberAiTurn(t: AiTurnInfo) {
  lastTurn = { ...t, at: Date.now() }
}
/** lượt AI vừa sửa tài liệu trong `withinMs` gần đây; lấy xong thì xoá (mỗi lượt báo hoàn tác một lần) */
export function takeRecentAiTurn(withinMs = 120_000): AiTurnInfo | null {
  const t = lastTurn
  if (!t || Date.now() - t.at > withinMs) return null
  lastTurn = null
  return t
}

export function reportAi(kind: AiFeedbackKind, t: AiTurnInfo, note = '') {
  void apiFetch('/api/quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, mode: t.mode, request: t.request, reply: t.reply, context: t.context ?? '', note }),
  }).catch(() => {})
}

const COMPLAINT = /(sai rồi|vẫn sai|chưa đúng|không đúng|không phải (thế|vậy|như vậy)|làm lại đi|tệ quá|chán quá|không hiểu (gì|à)|bị lỗi|hỏng rồi)/iu
/** tin nhắn kiểu "sai rồi" */
export const looksLikeComplaint = (text: string) => COMPLAINT.test(text)

const words = (s: string) => new Set(s.toLowerCase().normalize('NFC').match(/[\p{L}\p{N}]+/gu) ?? [])
/** yêu cầu gần giống lượt trước (gửi lại vì lượt trước không như ý) */
export function nearlySame(a: string, b: string): boolean {
  const x = words(a)
  const y = words(b)
  if (x.size < 3 || y.size < 3) return false
  let same = 0
  for (const w of x) if (y.has(w)) same++
  return same / Math.max(x.size, y.size) >= 0.8
}
