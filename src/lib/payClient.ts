/** Gọi /api/pay (nạp điểm qua PayOS, xem server/payment.ts). */
import { apiFetch } from './apiFetch'

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await apiFetch(url, init)
  const j = (await r.json().catch(() => ({}))) as T & { error?: string }
  if (!r.ok) throw new Error(j.error || `Không kết nối được máy chủ (${r.status}).`)
  return j
}

/** Các gói đã được thưởng lần đầu (lần sau nạp gói đó không còn thưởng). */
export async function boughtPacks(): Promise<number[]> {
  const j = await call<{ bonused?: number[] }>('/api/pay')
  return Array.isArray(j.bonused) ? j.bonused : []
}

/** Tạo đơn nạp; trả link trang thanh toán PayOS. */
export type PaymentOrder = {
  orderCode: number
  checkoutUrl: string
  points: number
  vnd: number
  /** chuỗi VietQR để vẽ mã QR */
  qrCode: string
  /** mã ngân hàng (BIN Napas) của tài khoản nhận */
  bin: string
  accountNumber: string
  accountName: string
  /** nội dung chuyển khoản */
  description: string
  /** hết hạn (giây Unix) */
  expiresAt: number
}
export function createPayment(vnd: number) {
  return call<PaymentOrder>('/api/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vnd }),
  })
}

export type PayStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed'
export function paymentStatus(orderCode: number) {
  return call<{ orderCode: number; status: PayStatus; vnd: number; points: number }>(`/api/pay?order=${orderCode}`)
}
