/**
 * Admin › Nạp điểm: xem đơn nạp PayOS, hỏi lại PayOS cho đơn còn treo, cộng điểm tay cho đơn đã đối soát.
 * Gộp vào ACTIONS trong server/admin.ts. Helper từ './admin.js' chỉ dùng trong `run` (admin.ts import vòng file này).
 */
import type { ActionMap } from './admin.js'
import { audit, call, HttpError, str } from './admin.js'
import { creditOrderManually, payosConfigured, reconcileOrder } from './payment.js'

type OrderRow = {
  order_code: number
  user_id: string
  vnd: number
  points: number
  bonus_points: number
  status: string
  reference: string | null
  created_at: string
  paid_at: string | null
}

const COLS = 'order_code,user_id,vnd,points,bonus_points,status,reference,created_at,paid_at'
/** đơn còn chờ quá thời hạn link (15 phút) mà chưa đóng: cần xem lại */
const STALE_MS = 20 * 60 * 1000

const needOrder = (v: unknown) => {
  const n = Number(v)
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(400, 'Mã đơn không hợp lệ.')
  return n
}

export const PAYMENT_ACTIONS: ActionMap = {
  /**
   * Danh sách đơn nạp, mới nhất trước. filter: all | attention (chờ quá hạn / trả thiếu) | pending | paid | closed (huỷ, hết hạn, lỗi).
   * Kèm email người nạp và tổng tiền đã thu (tháng này / tất cả).
   */
  'payments.list': {
    need: 'admin',
    run: async ({ s }, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(50, Math.max(1, Math.floor(Number(b.perPage) || 20)))
      const filter = str(b.filter, 20) || 'all'
      const qs = new URLSearchParams({ select: COLS, order: 'created_at.desc', offset: String((page - 1) * perPage), limit: String(perPage) })
      if (filter === 'pending') qs.set('status', 'eq.pending')
      else if (filter === 'paid') qs.set('status', 'eq.paid')
      else if (filter === 'closed') qs.set('status', 'in.(cancelled,expired,failed)')
      else if (filter === 'attention') {
        // trả thiếu (kể cả đơn đã huỷ / hết hạn mà tiền vẫn về) hoặc đơn chờ quá lâu
        qs.set('status', 'neq.paid')
        qs.set('or', `(reference.like.THIEU*,and(status.eq.pending,created_at.lt.${new Date(Date.now() - STALE_MS).toISOString()}))`)
      }
      const code = Number(b.orderCode)
      if (Number.isSafeInteger(code) && code > 0) qs.set('order_code', `eq.${code}`)

      const [{ data: rows, res }, { data: paid }] = await Promise.all([
        call<OrderRow[]>(s, `/rest/v1/payment_orders?${qs}`, { headers: { Prefer: 'count=exact' } }),
        call<Array<{ vnd: number; paid_at: string }>>(s, '/rest/v1/payment_orders?select=vnd,paid_at&status=eq.paid&limit=100000'),
      ])
      const total = Number(res.headers.get('content-range')?.split('/')[1] ?? rows.length)
      const monthStart = new Date()
      monthStart.setUTCDate(1)
      monthStart.setUTCHours(0, 0, 0, 0)
      const sum = (list: typeof paid) => list.reduce((n, r) => n + r.vnd, 0)

      // email người nạp (mỗi trang tối đa 50 đơn)
      const ids = [...new Set(rows.map((r) => r.user_id))]
      const emails = new Map<string, string>()
      await Promise.all(
        ids.map(async (id) => {
          const u = await call<{ email?: string }>(s, `/auth/v1/admin/users/${id}`).catch(() => null)
          emails.set(id, u?.data.email ?? '')
        }),
      )
      const staleBefore = Date.now() - STALE_MS
      return {
        page,
        perPage,
        total,
        configured: payosConfigured(),
        revenue: { month: sum(paid.filter((r) => new Date(r.paid_at) >= monthStart)), all: sum(paid), paidCount: paid.length },
        items: rows.map((r) => ({
          orderCode: r.order_code,
          userId: r.user_id,
          email: emails.get(r.user_id) ?? '',
          vnd: r.vnd,
          points: r.points,
          bonusPoints: r.bonus_points,
          status: r.status,
          reference: r.reference,
          createdAt: r.created_at,
          paidAt: r.paid_at,
          attention: r.status !== 'paid' && ((r.reference ?? '').startsWith('THIEU') || (r.status === 'pending' && new Date(r.created_at).getTime() < staleBefore)),
        })),
      }
    },
  },

  /** hỏi lại PayOS cho một đơn chưa trả (lỡ webhook): trả rồi thì cộng điểm, huỷ / hết hạn thì đóng đơn */
  'payments.sync': {
    need: 'admin',
    run: async ({ s }, b) => {
      const orderCode = needOrder(b.orderCode)
      if (!payosConfigured()) throw new HttpError(503, 'Chưa cấu hình PayOS.')
      const payos = await reconcileOrder(orderCode)
      const { data } = await call<OrderRow[]>(s, `/rest/v1/payment_orders?select=status&order_code=eq.${orderCode}`)
      if (!data[0]) throw new HttpError(404, 'Không tìm thấy đơn.')
      return { payos: payos ?? null, status: data[0].status }
    },
  },

  /**
   * Cộng điểm tay cho đơn chưa được cộng (đã xem sao kê: tiền về đủ nhưng PayOS không khớp được đơn — chuyển khoản
   * sai nội dung, trả sau khi link hết hạn…). Bắt buộc ghi chú; ghi nhật ký.
   */
  'payments.credit': {
    need: 'admin',
    run: async (ctx, b) => {
      const orderCode = needOrder(b.orderCode)
      const note = str(b.note, 100)
      if (!note) throw new HttpError(400, 'Cần ghi chú lý do (vd mã giao dịch ngân hàng).')
      const { data } = await call<OrderRow[]>(ctx.s, `/rest/v1/payment_orders?select=${COLS}&order_code=eq.${orderCode}`)
      const o = data[0]
      if (!o) throw new HttpError(404, 'Không tìm thấy đơn.')
      if (o.status === 'paid') throw new HttpError(400, 'Đơn này đã được cộng điểm.')
      const result = await creditOrderManually(orderCode, o.vnd, note)
      if (result !== 'ok') throw new HttpError(502, `Không cộng được (${result}).`)
      await audit(ctx, 'payments.credit', o.user_id, { orderCode, vnd: o.vnd, points: o.points, note })
      return { ok: true }
    },
  },
}
