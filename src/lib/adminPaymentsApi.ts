/** Admin › Nạp điểm: gọi các action `payments.*` của /api/admin (server/adminPayments.ts). */
import { isAdminMock, post, wait } from './adminApi'

export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed'
export type PaymentFilter = 'all' | 'attention' | 'pending' | 'paid' | 'closed'

export interface AdminPayment {
  orderCode: number
  userId: string
  email: string
  vnd: number
  points: number
  bonusPoints: number
  status: PaymentStatus
  /** mã giao dịch ngân hàng, hoặc ghi chú `THIEU …` (trả thiếu) / `TAY …` (cộng tay) */
  reference: string | null
  createdAt: string
  paidAt: string | null
  /** chờ quá hạn link hoặc trả thiếu: cần xem lại */
  attention: boolean
}

export interface PaymentPage {
  page: number
  perPage: number
  total: number
  configured: boolean
  revenue: { month: number; all: number; paidCount: number }
  items: AdminPayment[]
}

const MOCK: AdminPayment[] = [
  { orderCode: 100007, userId: 'u1', email: 'giaovien1@example.com', vnd: 10000, points: 275, bonusPoints: 25, status: 'paid', reference: 'FT26322123456', createdAt: '2026-11-18T07:10:00Z', paidAt: '2026-11-18T07:11:30Z', attention: false },
  { orderCode: 100006, userId: 'u2', email: 'giaovien2@example.com', vnd: 5000, points: 131, bonusPoints: 6, status: 'pending', reference: 'THIEU 3000d/5000d FT26322999', createdAt: '2026-11-18T06:40:00Z', paidAt: null, attention: true },
  { orderCode: 100005, userId: 'u3', email: 'giaovien3@example.com', vnd: 20000, points: 575, bonusPoints: 75, status: 'pending', reference: null, createdAt: '2026-11-18T05:00:00Z', paidAt: null, attention: true },
  { orderCode: 100004, userId: 'u1', email: 'giaovien1@example.com', vnd: 2000, points: 50, bonusPoints: 0, status: 'expired', reference: null, createdAt: '2026-11-17T12:00:00Z', paidAt: null, attention: false },
  { orderCode: 100003, userId: 'u4', email: 'giaovien4@example.com', vnd: 50000, points: 1500, bonusPoints: 250, status: 'paid', reference: 'TAY sao kê FT2632100001', createdAt: '2026-11-16T09:00:00Z', paidAt: '2026-11-16T10:00:00Z', attention: false },
]

export function listPayments(opts: { filter?: PaymentFilter; page?: number; orderCode?: number } = {}): Promise<PaymentPage> {
  if (isAdminMock()) {
    const f = opts.filter ?? 'all'
    const items = MOCK.filter((p) =>
      f === 'all' ? true : f === 'attention' ? p.attention : f === 'closed' ? ['cancelled', 'expired', 'failed'].includes(p.status) : p.status === f,
    ).filter((p) => !opts.orderCode || p.orderCode === opts.orderCode)
    return wait({ page: 1, perPage: 20, total: items.length, configured: true, revenue: { month: 60000, all: 60000, paidCount: 2 }, items })
  }
  return post('payments.list', { filter: opts.filter ?? 'all', page: opts.page ?? 1, orderCode: opts.orderCode }, false)
}

export function syncPayment(orderCode: number): Promise<{ payos: string | null; status: PaymentStatus }> {
  if (isAdminMock()) return wait({ payos: 'PENDING', status: 'pending' as const })
  return post('payments.sync', { orderCode })
}

export function creditPayment(orderCode: number, note: string): Promise<{ ok: true }> {
  if (isAdminMock()) return wait({ ok: true as const })
  return post('payments.credit', { orderCode, note })
}
