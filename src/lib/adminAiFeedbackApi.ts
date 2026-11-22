import { isAdminMock, post, wait } from './adminApi'
import type { AiFeedbackKind, AiTurnInfo } from './aiFeedback'

export type AiFeedbackDays = 7 | 30 | 90
export type AiFeedbackMode = AiTurnInfo['mode']
export type AiFeedbackDetail = Pick<AiTurnInfo, 'request' | 'reply'>

export interface AiFeedbackItem extends AiFeedbackDetail {
  id: number
  kind: Exclude<AiFeedbackKind, 'up'>
  mode: AiFeedbackMode
  createdAt: string
  note: string
  user: { email: string; name: string } | null
}

export interface AiFeedbackOverview {
  days: AiFeedbackDays
  modes: Array<{
    mode: AiFeedbackMode
    successfulCalls: number
    counts: Record<AiFeedbackKind, number>
    dissatisfied: number
    dissatisfactionRate: number | null
  }>
  items: AiFeedbackItem[]
  unavailable?: true
}

const mockDetail: AiFeedbackDetail = {
  request: 'Đổi câu 3 thành bài toán tìm hai số.',
  reply: 'Câu 3. Tổng của hai số là 75, hiệu của hai số là 15. Tìm hai số đó.',
}

export function getAiFeedbackOverview(days: AiFeedbackDays = 30): Promise<AiFeedbackOverview> {
  if (!isAdminMock()) return post('aiFeedback.overview', { days }, true)
  const successfulCalls = days * 3
  return wait({
    days,
    modes: [
      { mode: 'exam', successfulCalls, counts: { up: 6, down: 1, undo: 0, resend: 0, complaint: 0 }, dissatisfied: 1, dissatisfactionRate: 1 / successfulCalls },
      { mode: 'slide', successfulCalls: days, counts: { up: 2, down: 0, undo: 0, resend: 0, complaint: 0 }, dissatisfied: 0, dissatisfactionRate: 0 },
      { mode: 'board', successfulCalls: 0, counts: { up: 0, down: 0, undo: 0, resend: 0, complaint: 0 }, dissatisfied: 0, dissatisfactionRate: null },
    ],
    items: [{
      ...mockDetail, id: 1, kind: 'down', mode: 'exam', createdAt: new Date().toISOString(),
      note: 'Cần thêm điều kiện hai số tự nhiên.',
      user: { name: 'Giáo viên 1', email: 'giaovien1@example.com' },
    }],
  })
}

export function getAiFeedbackDetail(id: number): Promise<AiFeedbackDetail> {
  if (isAdminMock()) return wait(mockDetail)
  return post('aiFeedback.detail', { id }, true)
}
