/**
 * Nạp điểm AI qua PayOS (https://payos.vn/docs/api/).
 *
 * POST /api/pay {vnd}           → tạo đơn + link thanh toán PayOS, trả {orderCode, checkoutUrl}
 * GET  /api/pay?order=<mã>      → trạng thái đơn của mình; đơn còn chờ thì hỏi lại PayOS (lỡ webhook vẫn cộng được điểm)
 * GET  /api/pay                 → các gói mình đã được thưởng lần đầu (để trang Bảng giá tính thưởng)
 * POST /api/pay?webhook=1       → PayOS báo đã nhận tiền (kiểm chữ ký HMAC bằng PAYOS_CHECKSUM_KEY)
 *
 * Số điểm luôn tính lại ở server từ bảng giá đã lưu (app_settings.pricing), không tin số client gửi.
 * Env: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY. Thiếu một trong ba → 503 "chưa mở thanh toán".
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http.js'
import { LOGIN_REQUIRED, guard, rateLimitOnly, userFromToken } from './guard.js'
import { DEFAULT_PRICING, MAX_VND, MIN_VND, PACKS, applyPricing, basePoints, packPoints, type PricingConfig } from '../src/lib/pricing.js'

const PAYOS_API = 'https://api-merchant.payos.vn'
/** link thanh toán hết hạn sau 15 phút */
const LINK_TTL_S = 15 * 60

const env = () => ({
  clientId: (process.env.PAYOS_CLIENT_ID ?? '').trim(),
  apiKey: (process.env.PAYOS_API_KEY ?? '').trim(),
  checksum: (process.env.PAYOS_CHECKSUM_KEY ?? '').trim(),
  base: (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, ''),
  service: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
})
export const payosConfigured = () => {
  const e = env()
  return !!(e.clientId && e.apiKey && e.checksum && e.base && e.service)
}

const hmac = (key: string, data: string) => createHmac('sha256', key).update(data).digest('hex')
const sameHex = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/** Chữ ký gửi kèm khi tạo link: 5 trường, xếp theo tên, dạng key=value&… */
export function signCreate(key: string, d: { amount: number; cancelUrl: string; description: string; orderCode: number; returnUrl: string }) {
  return hmac(key, `amount=${d.amount}&cancelUrl=${d.cancelUrl}&description=${d.description}&orderCode=${d.orderCode}&returnUrl=${d.returnUrl}`)
}

/** Chữ ký `data` của webhook (theo mẫu chính thức "Kiểm tra dữ liệu với signature"): xếp key, null → '', mảng → JSON. */
export function signData(key: string, data: Record<string, unknown>) {
  const sortObj = (o: Record<string, unknown>) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]))
  const str = Object.keys(data)
    .sort()
    .filter((k) => data[k] !== undefined)
    .map((k) => {
      let v = data[k]
      if (Array.isArray(v)) v = JSON.stringify(v.map((x) => (x && typeof x === 'object' ? sortObj(x as Record<string, unknown>) : x)))
      if (v === null || v === undefined || v === 'null' || v === 'undefined') v = ''
      return `${k}=${v}`
    })
    .join('&')
  return hmac(key, str)
}

async function db<T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const e = env()
  const r = await fetch(`${e.base}/rest/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: e.service,
      Authorization: `Bearer ${e.service}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const text = await r.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: r.ok, status: r.status, data: data as T }
}

async function payos<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<{ code: string; desc: string; data: T | null }> {
  const e = env()
  const r = await fetch(`${PAYOS_API}${path}`, {
    method: init.method ?? 'GET',
    headers: { 'x-client-id': e.clientId, 'x-api-key': e.apiKey, 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const j = (await r.json().catch(() => null)) as { code?: string; desc?: string; data?: T } | null
  return { code: String(j?.code ?? r.status), desc: String(j?.desc ?? ''), data: (j?.data ?? null) as T | null }
}

/** Bảng giá admin đã lưu; lỗi hoặc chưa có thì dùng mặc định. */
async function loadServerPricing() {
  const { ok, data } = await db<Array<{ value?: Partial<PricingConfig> }>>('/app_settings?select=value&key=eq.pricing')
  const v = ok ? data?.[0]?.value : undefined
  applyPricing(v && Array.isArray(v.packs) && v.packs.length ? ({ ...DEFAULT_PRICING, ...v } as PricingConfig) : DEFAULT_PRICING)
}

/** các gói người dùng đã được thưởng lần đầu */
async function bonusedPacks(userId: string): Promise<number[]> {
  const { ok, data } = await db<Array<{ pack_vnd: number }>>(
    `/payment_orders?select=pack_vnd&user_id=eq.${userId}&status=eq.paid&bonus_points=gt.0`,
  )
  return ok ? [...new Set(data.map((r) => r.pack_vnd))] : []
}

type Order = { order_code: number; user_id: string; vnd: number; points: number; bonus_points: number; status: string; checkout_url: string | null }

/** số tiền cổng báo: chỉ nhận số nguyên dương; thiếu / sai kiểu thì không gọi cộng điểm (để webhook / lần tra sau xử lý) */
const validAmount = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : NaN
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

async function credit(orderCode: number, amount: number | null, reference: string) {
  if (amount === null) return 'unknown_amount'
  const { ok, data } = await db<string>('/rpc/credit_payment_order', {
    method: 'POST',
    body: { p_order: orderCode, p_amount: amount, p_reference: reference },
  })
  return ok ? data : 'error'
}

function siteOrigin(req: IncomingMessage) {
  // returnUrl phải là trang của mình: lấy từ Origin trình duyệt gửi (guard đã chặn Origin lạ), không có thì dùng tên miền chính
  const o = String(req.headers.origin ?? '')
  return /^https?:\/\/[^/]+$/.test(o) ? o : process.env.PUBLIC_SITE_URL || 'https://dero.id.vn'
}

async function createOrder(req: IncomingMessage, res: ServerResponse, userId: string) {
  let body: { vnd?: unknown }
  try {
    body = JSON.parse(await readBody(req, 4 * 1024)) as { vnd?: unknown }
  } catch {
    return json(res, 400, { error: 'Yêu cầu không hợp lệ.' })
  }
  await loadServerPricing()
  const vnd = Math.round(Number(body.vnd))
  if (!Number.isFinite(vnd) || vnd < MIN_VND || vnd > MAX_VND || vnd % 1000 !== 0) {
    return json(res, 400, { error: `Số tiền nạp từ ${MIN_VND.toLocaleString('vi-VN')}đ đến ${MAX_VND.toLocaleString('vi-VN')}đ, bội số 1.000đ.` })
  }
  const pack = PACKS.find((p) => p.vnd === vnd) ?? null
  const firstTime = pack ? !(await bonusedPacks(userId)).includes(pack.vnd) : false
  const points = pack ? packPoints(pack, firstTime) : basePoints(vnd)
  const bonus = points - basePoints(vnd)

  const ins = await db<Order[]>('/payment_orders?select=order_code', {
    method: 'POST',
    prefer: 'return=representation',
    body: { user_id: userId, vnd, points, pack_vnd: pack?.vnd ?? null, bonus_points: bonus },
  })
  const orderCode = ins.ok ? Number(ins.data?.[0]?.order_code) : NaN
  if (!Number.isSafeInteger(orderCode)) return json(res, 502, { error: 'Không tạo được đơn nạp, thử lại sau.' })

  const site = siteOrigin(req)
  const returnUrl = `${site}/bang-gia?order=${orderCode}`
  const cancelUrl = `${site}/bang-gia?order=${orderCode}&huy=1`
  // tài khoản ngân hàng không liên kết qua PayOS chỉ nhận nội dung tối đa 9 ký tự
  const description = `DR${orderCode}`.slice(0, 9)
  const req0 = { orderCode, amount: vnd, description, returnUrl, cancelUrl }
  const expiresAt = Math.floor(Date.now() / 1000) + LINK_TTL_S
  const r = await payos<{ checkoutUrl: string; paymentLinkId: string; qrCode?: string; bin?: string; accountNumber?: string; accountName?: string; description?: string }>('/v2/payment-requests', {
    method: 'POST',
    body: {
      ...req0,
      expiredAt: expiresAt,
      items: [{ name: `${points} điểm AI`, quantity: 1, price: vnd }],
      signature: signCreate(env().checksum, req0),
    },
  })
  if (r.code !== '00' || !r.data?.checkoutUrl) {
    await db(`/payment_orders?order_code=eq.${orderCode}`, { method: 'PATCH', body: { status: 'failed' } })
    return json(res, 502, { error: 'Cổng thanh toán đang lỗi, thử lại sau ít phút.' })
  }
  await db(`/payment_orders?order_code=eq.${orderCode}`, {
    method: 'PATCH',
    body: { checkout_url: r.data.checkoutUrl, payment_link_id: r.data.paymentLinkId ?? null },
  })
  // trang tự vẽ QR + thông tin chuyển khoản (chuỗi VietQR PayOS trả), checkoutUrl để mở trang PayOS nếu cần
  return json(res, 200, {
    orderCode,
    checkoutUrl: r.data.checkoutUrl,
    points,
    vnd,
    qrCode: r.data.qrCode ?? '',
    bin: r.data.bin ?? '',
    accountNumber: r.data.accountNumber ?? '',
    accountName: r.data.accountName ?? '',
    // PayOS gắn thêm mã riêng vào nội dung (vd `CS9BSJTYZW1 DR100001`): phải chuyển đúng chuỗi này thì PayOS mới khớp đơn
    description: r.data.description || description,
    expiresAt,
  })
}

async function orderStatus(res: ServerResponse, userId: string, orderCode: number) {
  const get = () => db<Order[]>(`/payment_orders?select=order_code,user_id,vnd,points,bonus_points,status&order_code=eq.${orderCode}&user_id=eq.${userId}`)
  let { data } = await get()
  let o = data?.[0]
  if (!o) return json(res, 404, { error: 'Không tìm thấy đơn nạp.' })
  if (o.status === 'pending') {
    // webhook có thể đến chậm / không đến (máy dev): hỏi thẳng PayOS
    const r = await payos<{ status?: string; amount?: number; amountPaid?: number; amountRemaining?: number; transactions?: Array<{ reference?: string }> }>(
      `/v2/payment-requests/${orderCode}`,
    )
    const st = r.code === '00' ? r.data?.status : undefined
    if (st === 'PAID' || st === 'UNDERPAID') {
      // trả thiếu: hàm DB giữ đơn 'pending' + ghi chú để đối soát; trả đủ / dư thì cộng điểm
      await credit(orderCode, validAmount(r.data?.amountPaid), r.data?.transactions?.[0]?.reference ?? 'tra-cuu')
    } else if (st === 'CANCELLED' || st === 'EXPIRED') {
      await db(`/payment_orders?order_code=eq.${orderCode}&status=eq.pending`, { method: 'PATCH', body: { status: st === 'CANCELLED' ? 'cancelled' : 'expired' } })
    }
    if (st && st !== 'PENDING' && st !== 'PROCESSING') {
      ;({ data } = await get())
      o = data?.[0] ?? o
    }
  }
  return json(res, 200, { orderCode: o.order_code, status: o.status, vnd: o.vnd, points: o.points })
}

async function handleWebhook(req: IncomingMessage, res: ServerResponse) {
  if (!rateLimitOnly(req, res, 'payos-webhook', 300)) return
  let body: { code?: string; success?: boolean; data?: Record<string, unknown>; signature?: string }
  try {
    body = JSON.parse(await readBody(req, 32 * 1024))
  } catch {
    return json(res, 400, { error: 'bad json' })
  }
  const data = body.data
  const sig = typeof body.signature === 'string' ? body.signature : ''
  if (!data || typeof data !== 'object' || !sig || !sameHex(signData(env().checksum, data), sig)) {
    return json(res, 401, { error: 'invalid signature' })
  }
  const orderCode = Number(data.orderCode)
  // dữ liệu mẫu PayOS gửi khi xác nhận URL webhook (đơn không có thật) vẫn trả 200
  if (body.code === '00' && data.code === '00' && Number.isSafeInteger(orderCode)) {
    const result = await credit(orderCode, validAmount(data.amount), String(data.reference ?? ''))
    if (result === 'error') return json(res, 500, { error: 'retry' })
  }
  return json(res, 200, { ok: true })
}

export async function handlePayRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://x')
  // webhook gọi từ máy chủ PayOS: không có Origin / token, xác thực bằng chữ ký
  if (req.method === 'POST' && url.searchParams.get('webhook') === '1') {
    if (!payosConfigured()) return json(res, 503, { error: 'not configured' })
    return handleWebhook(req, res)
  }
  if (!(await guard(req, res, 'pay'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  const userId = await userFromToken(req)
  if (!userId) return json(res, 401, { error: LOGIN_REQUIRED.replace('dùng AI', 'nạp điểm'), loginRequired: true })
  if (!payosConfigured()) return json(res, 503, { error: 'Thanh toán chưa mở, bạn quay lại sau nhé.', notConfigured: true })

  try {
    if (req.method === 'POST') return await createOrder(req, res, userId)
    if (req.method === 'GET') {
      const order = Number(url.searchParams.get('order'))
      if (url.searchParams.has('order')) {
        if (!Number.isSafeInteger(order) || order <= 0) return json(res, 400, { error: 'Mã đơn không hợp lệ.' })
        return await orderStatus(res, userId, order)
      }
      return json(res, 200, { bonused: await bonusedPacks(userId) })
    }
    return json(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function payMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handlePayRequest(req, res).catch((err: unknown) => json(res, 500, { error: String(err) }))
}
