/** Test nạp điểm PayOS (server/payment.ts) với Supabase + PayOS giả: tạo đơn (điểm tính ở server, chữ ký đúng),
 * webhook (chữ ký sai bị từ chối, đúng thì cộng điểm, gửi lại không cộng hai lần), tra đơn lỡ webhook. */
import { createHmac, generateKeyPairSync, sign } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

let pass = 0
let fail = 0
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? '✅' : '❌'} ${name}`)
  ok ? pass++ : fail++
}

const SB = 'http://sb-pay.test'
process.env.VITE_SUPABASE_URL = SB
process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'pk'
process.env.PAYOS_CLIENT_ID = 'cid'
process.env.PAYOS_API_KEY = 'akey'
process.env.PAYOS_CHECKSUM_KEY = 'checksum-secret'

// token ES256 thật (server kiểm chữ ký qua JWKS)
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const KID = 'kid-pay'
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'ES256', use: 'sig' }
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
const token = (sub: string) => {
  const head = b64({ alg: 'ES256', kid: KID, typ: 'JWT' })
  const body = b64({ sub, iss: `${SB}/auth/v1`, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })
  return `${head}.${body}.${sign('sha256', Buffer.from(`${head}.${body}`), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`
}

// "DB" giả: bảng đơn + hàm cộng điểm làm đúng như migration
type Row = { order_code: number; user_id: string; vnd: number; points: number; pack_vnd: number | null; bonus_points: number; status: string; checkout_url?: string; payment_link_id?: string }
const orders: Row[] = []
const balance = new Map<string, number>()
let seq = 100001
const audits: unknown[] = []
let payosStatus = 'PENDING'
/** amountPaid PayOS trả khi tra đơn: 'full' = đúng số tiền đơn, 'none' = thiếu trường, số = số tiền cụ thể */
let payosPaid: 'full' | 'none' | number = 'full'
let lastCreate: Record<string, unknown> | null = null
const creditFn = (code: number, amount: number) => {
  const o = orders.find((r) => r.order_code === code)
  if (!o) return 'missing'
  if (o.status === 'paid') return 'already'
  if (amount === null || !(amount > 0)) return 'unknown_amount'
  if (amount < o.vnd) return 'underpaid'
  let pts = o.points
  if (o.bonus_points > 0 && orders.some((p) => p !== o && p.user_id === o.user_id && p.pack_vnd === o.pack_vnd && p.status === 'paid' && p.bonus_points > 0)) {
    pts -= o.bonus_points
    o.bonus_points = 0
  }
  o.status = 'paid'
  o.points = pts
  balance.set(o.user_id, (balance.get(o.user_id) ?? 0) + pts * 1000)
  return 'ok'
}

const res200 = (o: unknown) => new Response(JSON.stringify(o), { status: 200 })
globalThis.fetch = (async (input: string | URL, init: RequestInit = {}) => {
  const url = String(input)
  const method = init.method ?? 'GET'
  const body = init.body ? JSON.parse(String(init.body)) : null
  if (url.endsWith('/auth/v1/.well-known/jwks.json')) return res200({ keys: [jwk] })
  if (url.includes('/auth/v1/admin/users/')) return res200({ id: url.split('/').pop(), email: `${url.split('/').pop()}@example.com`, banned_until: null })
  if (url.includes('/rest/v1/user_roles')) return res200(url.includes('admin-1') || url.includes('admin-2') ? [{ role: 'admin' }] : [])
  if (url.includes('/rest/v1/admin_audit')) return (audits.push(body), new Response(null, { status: 201 }))
  if (url.includes('/rest/v1/security_flags') || url.includes('/rest/v1/rpc/security_strike')) return res200([])
  if (url.includes('/rest/v1/app_settings')) return res200([])
  if (url.includes('/rest/v1/rpc/admin_revenue_ranges')) {
    // giống hàm SQL: cộng đơn paid có paid_at trong [from, to) theo từng khoảng
    const out = (body.p_from as string[]).map((f, i) => {
      const hit = orders.filter((r) => r.status === 'paid' && Date.parse('2026-11-18T00:00:00Z') >= Date.parse(f) && Date.parse('2026-11-18T00:00:00Z') < Date.parse(body.p_to[i]))
      return { idx: i + 1, vnd: hit.reduce((n, r) => n + r.vnd, 0), n: hit.length }
    })
    return res200(out)
  }
  if (url.includes('/rest/v1/rpc/admin_revenue_monthly')) return res200([{ month: '2026-11', vnd: 7000, n: 2 }, { month: '2026-10', vnd: 3000, n: 1 }])
  if (url.includes('/rest/v1/rpc/credit_payment_order')) return res200(creditFn(body.p_order, body.p_amount))
  if (url.includes('/rest/v1/payment_orders')) {
    const q = new URL(url).searchParams
    const eq = (k: string) => q.get(k)?.replace(/^eq\./, '')
    if (method === 'POST') {
      const row: Row = { order_code: seq++, status: 'pending', ...body }
      orders.push(row)
      return new Response(JSON.stringify([row]), { status: 201 })
    }
    let rows = orders.filter((r) => (!eq('order_code') || String(r.order_code) === eq('order_code')) && (!eq('user_id') || r.user_id === eq('user_id')))
    if (q.get('status')?.startsWith('neq.')) rows = rows.filter((r) => r.status !== q.get('status')!.slice(4))
    else if (eq('status') && !q.get('status')?.startsWith('in.(')) rows = rows.filter((r) => r.status === eq('status'))
    if (q.get('status')?.startsWith('in.(')) rows = rows.filter((r) => q.get('status')!.slice(4, -1).split(',').includes(r.status))
    if (q.get('bonus_points') === 'gt.0') rows = rows.filter((r) => r.bonus_points > 0)
    if (method === 'PATCH') {
      rows.forEach((r) => Object.assign(r, body))
      return new Response(null, { status: 204 })
    }
    if (q.has('limit') && q.get('limit') !== '100000') {
      const all = [...rows].reverse()
      const page = all.slice(Number(q.get('offset') ?? 0), Number(q.get('offset') ?? 0) + Number(q.get('limit')))
      return new Response(JSON.stringify(page.map((r) => ({ created_at: '2026-11-18T00:00:00Z', paid_at: r.status === 'paid' ? '2026-11-18T00:00:00Z' : null, reference: null, ...r }))), {
        status: 200,
        headers: { 'content-range': `0-${page.length - 1}/${all.length}` },
      })
    }
    return res200(rows.map((r) => ({ paid_at: '2026-11-18T00:00:00Z', created_at: new Date().toISOString(), ...r })))
  }
  if (url === 'https://api-merchant.payos.vn/v2/payment-requests' && method === 'POST') {
    lastCreate = body
    return res200({ code: '00', desc: 'success', data: { checkoutUrl: `https://pay.payos.vn/web/${body.orderCode}`, paymentLinkId: `pl${body.orderCode}` } })
  }
  if (url.startsWith('https://api-merchant.payos.vn/v2/payment-requests/')) {
    const code = Number(url.split('/').pop())
    const o = orders.find((r) => r.order_code === code)
    // 'full' = trả đủ khi PayOS báo PAID; đơn chờ / huỷ / hết hạn chưa có tiền thì amountPaid = 0
    const paid = payosPaid === 'full' ? (payosStatus === 'PAID' ? o?.vnd : 0) : payosPaid
    return res200({ code: '00', desc: 'success', data: { status: payosStatus, ...(payosPaid === 'none' ? {} : { amountPaid: paid }), transactions: [{ reference: 'FT123' }] } })
  }
  return new Response('{}', { status: 404 })
}) as typeof fetch

const { handlePayRequest, signData } = await import('../server/payment.ts')

let ipN = 10
async function call(method: string, path: string, opts: { body?: unknown; auth?: string; origin?: string | null } = {}) {
  const raw = Buffer.from(opts.body === undefined ? '' : JSON.stringify(opts.body))
  const headers: Record<string, string> = { host: 'de-ro-lac.vercel.app' }
  if (opts.origin !== null) headers.origin = opts.origin ?? 'https://de-ro-lac.vercel.app'
  if (opts.auth) headers.authorization = `Bearer ${opts.auth}`
  const req = Object.assign((async function* () { if (raw.length) yield raw })(), {
    method,
    url: path,
    headers,
    socket: { remoteAddress: `198.51.100.${ipN++}` },
  }) as unknown as IncomingMessage
  const out = { status: 0, body: '' }
  const res = {
    headersSent: false,
    setHeader() {},
    writeHead(c: number) {
      out.status = c
      return this
    },
    end(b?: string) {
      out.body = b ?? ''
    },
  } as unknown as ServerResponse
  await handlePayRequest(req, res)
  return { status: out.status, data: JSON.parse(out.body || '{}') as Record<string, unknown> }
}
const U = 'user-a'
const tk = token(U)

check('trang nạp mở: người dùng thường tạo đơn → 200', (await call('POST', '/api/pay', { body: { vnd: 10000 }, auth: token('user-b') })).status === 200)
check('khách tạo đơn → 401', (await call('POST', '/api/pay', { body: { vnd: 10000 } })).status === 401)
check('số tiền ngoài khoảng → 400', (await call('POST', '/api/pay', { body: { vnd: 500 }, auth: tk })).status === 400)
check('số tiền lẻ (không bội 1.000) → 400', (await call('POST', '/api/pay', { body: { vnd: 10500 }, auth: tk })).status === 400)

const c1 = await call('POST', '/api/pay', { body: { vnd: 10000, points: 999999 }, auth: tk })
const o1 = orders[orders.length - 1]
check('tạo đơn gói 10.000đ → 200 + link PayOS', c1.status === 200 && String(c1.data.checkoutUrl).startsWith('https://pay.payos.vn/'))
check('điểm tính ở server (bỏ qua số client gửi): 250 + 10% = 275', o1.points === 275 && o1.bonus_points === 25)
const sigStr = `amount=${lastCreate?.amount}&cancelUrl=${lastCreate?.cancelUrl}&description=${lastCreate?.description}&orderCode=${lastCreate?.orderCode}&returnUrl=${lastCreate?.returnUrl}`
check('chữ ký tạo link đúng chuẩn PayOS', lastCreate?.signature === createHmac('sha256', 'checksum-secret').update(sigStr).digest('hex'))
check('nội dung chuyển khoản ≤ 9 ký tự', String(lastCreate?.description).length <= 9)
check('returnUrl về đúng trang mình', String(lastCreate?.returnUrl).startsWith('https://de-ro-lac.vercel.app/bang-gia?order='))

// webhook
const hookData = { orderCode: o1.order_code, amount: 10000, description: 'DR', accountNumber: '1', reference: 'FT1', transactionDateTime: '2026-11-18 10:00:00', currency: 'VND', paymentLinkId: 'pl', code: '00', desc: 'success', counterAccountBankId: null, counterAccountBankName: '', counterAccountName: null, counterAccountNumber: null, virtualAccountName: null, virtualAccountNumber: '' }
const hook = (data: Record<string, unknown>, sig?: string) =>
  call('POST', '/api/pay?webhook=1', { origin: null, body: { code: '00', desc: 'success', success: true, data, signature: sig ?? signData('checksum-secret', data) } })
check('webhook chữ ký sai → 401, không cộng', (await hook(hookData, 'ab'.repeat(32))).status === 401 && !balance.get(U))
check('webhook sửa số tiền (chữ ký cũ) → 401', (await hook({ ...hookData, amount: 1 }, signData('checksum-secret', hookData))).status === 401)
payosStatus = 'PAID'
payosPaid = 'full'
check('webhook hợp lệ → 200, cộng 275 điểm', (await hook(hookData)).status === 200 && balance.get(U) === 275_000)
check('webhook gửi lại → không cộng lần hai', (await hook(hookData)).status === 200 && balance.get(U) === 275_000)
check('webhook dữ liệu mẫu (đơn không có) → vẫn 200', (await hook({ ...hookData, orderCode: 123 })).status === 200)
payosStatus = 'PENDING'

// gói đã thưởng: lần sau chỉ điểm gốc
const b = await call('GET', '/api/pay', { auth: tk })
check('GET /api/pay báo gói 10.000đ đã thưởng', JSON.stringify(b.data.bonused) === '[10000]')
await call('POST', '/api/pay', { body: { vnd: 10000 }, auth: tk })
check('nạp lại gói 10.000đ → 250 điểm, không thưởng', orders[orders.length - 1].points === 250 && orders[orders.length - 1].bonus_points === 0)

// lỡ webhook: tra đơn thì hỏi PayOS rồi cộng
const o3 = (await call('POST', '/api/pay', { body: { vnd: 20000 }, auth: tk }), orders[orders.length - 1])
check('tra đơn còn chờ → pending', (await call('GET', `/api/pay?order=${o3.order_code}`, { auth: tk })).data.status === 'pending')
payosStatus = 'PAID'
const st = await call('GET', `/api/pay?order=${o3.order_code}`, { auth: tk })
check('PayOS báo đã trả → tra đơn tự cộng điểm (575)', st.data.status === 'paid' && balance.get(U) === 275_000 + 575_000)
// Strix ce3e: số tiền thiếu / lệch / trả thiếu không được làm đơn 'failed' vĩnh viễn, cũng không được cộng điểm
const o4 = (await call('POST', '/api/pay', { body: { vnd: 5000 }, auth: tk }), orders[orders.length - 1])
const before = balance.get(U)
payosPaid = 'none'
const s4 = await call('GET', `/api/pay?order=${o4.order_code}`, { auth: tk })
check('PAID nhưng thiếu amountPaid → vẫn pending, không cộng', s4.data.status === 'pending' && balance.get(U) === before)
payosPaid = 'full'
const s7 = await call('GET', `/api/pay?order=${o4.order_code}`, { auth: tk })
check('sau đó PayOS báo số tiền đủ → tra lại được và cộng điểm', s7.data.status === 'paid' && balance.get(U)! > before!)
// chuyển thiếu: cộng theo giá nạp lẻ trên số tiền thực nhận, đóng link PayOS
const oU = (await call('POST', '/api/pay', { body: { vnd: 10000 }, auth: tk }), orders[orders.length - 1])
payosStatus = 'UNDERPAID'
payosPaid = 4000
const balU = balance.get(U)!
const sU = await call('GET', `/api/pay?order=${oU.order_code}`, { auth: tk })
check('UNDERPAID 4.000đ/10.000đ → cộng 100 điểm (nạp lẻ), đơn paid ghi số tiền thật', sU.data.status === 'paid' && balance.get(U) === balU + 100_000 && oU.vnd === 4000 && oU.bonus_points === 0)
// Strix a70c: webhook không tin `amount` trong body (10.000đ), số tiền lấy từ PayOS
const oW = (await call('POST', '/api/pay', { body: { vnd: 10000 }, auth: tk }), orders[orders.length - 1])
payosPaid = 2000
const balW = balance.get(U)!
check('webhook ghi 10.000đ nhưng PayOS báo 2.000đ → chỉ cộng 50 điểm', (await hook({ ...hookData, orderCode: oW.order_code })).status === 200 && balance.get(U) === balW + 50_000)
payosPaid = 10
const oT = (await call('POST', '/api/pay', { body: { vnd: 10000 }, auth: tk }), orders[orders.length - 1])
const balT = balance.get(U)!
check('chuyển quá ít (chưa đủ 1 điểm) → không cộng, đơn còn để admin xử lý', (await call('GET', `/api/pay?order=${oT.order_code}`, { auth: tk })).status === 200 && oT.status === 'pending' && balance.get(U) === balT)
payosStatus = 'PAID'
payosPaid = 'full'
const o5 = (await call('POST', '/api/pay', { body: { vnd: 3000 }, auth: tk }), orders[orders.length - 1])
const bal5 = balance.get(U)
payosPaid = 'none'
check('webhook mà PayOS không báo số tiền → 200, đơn vẫn pending, không cộng', (await hook({ ...hookData, orderCode: o5.order_code })).status === 200 && o5.status === 'pending' && balance.get(U) === bal5)
payosPaid = 'full'
check('người khác không xem được đơn của mình → 404', (await call('GET', `/api/pay?order=${o3.order_code}`, { auth: token('user-b') })).status === 404)

// màn admin Nạp điểm (server/adminPayments.ts qua /api/admin)
const { handleAdminRequest } = await import('../server/admin.ts')
async function admin(action: string, body: Record<string, unknown>, who = 'admin-1') {
  const raw = Buffer.from(JSON.stringify({ action, ...body }))
  const req = Object.assign((async function* () { yield raw })(), {
    method: 'POST',
    url: '/api/admin',
    headers: { host: 'de-ro-lac.vercel.app', origin: 'https://de-ro-lac.vercel.app', authorization: `Bearer ${token(who)}` },
    socket: { remoteAddress: `198.51.100.${ipN++}` },
  }) as unknown as IncomingMessage
  const out = { status: 0, body: '' }
  const res = { headersSent: false, setHeader() {}, writeHead(c: number) { out.status = c; return this }, end(b?: string) { out.body = b ?? '' } } as unknown as ServerResponse
  await handleAdminRequest(req, res)
  return { status: out.status, data: JSON.parse(out.body || '{}') as Record<string, unknown> }
}
check('người không phải admin xem đơn nạp → bị chặn', [401, 403].includes((await admin('payments.list', {}, 'user-c')).status))
const lst = await admin('payments.list', { filter: 'all' })
const its = lst.data.items as Array<Record<string, unknown>>
const rev = lst.data.revenue as { day: number; week: number; month: number; all: number; counts: Record<'day' | 'week' | 'month' | 'all', number>; paidCount: number }
check(
  'admin xem danh sách đơn: có email + doanh thu ngày/tuần/tháng/tất cả + số đơn',
  lst.status === 200 &&
    its.length > 0 &&
    String(its[0].email).endsWith('@example.com') &&
    rev.all > 0 &&
    typeof rev.day === 'number' &&
    typeof rev.week === 'number' &&
    typeof rev.month === 'number' &&
    rev.counts.all === rev.paidCount &&
    typeof rev.counts.day === 'number' &&
    typeof rev.counts.week === 'number' &&
    typeof rev.counts.month === 'number' &&
    typeof (rev as unknown as { prev: { day: { vnd: number } } }).prev.day.vnd === 'number' &&
    (rev as unknown as { months: unknown[] }).months.length === 2,
)

// kiểm mốc ngày / tuần (thứ Hai) / tháng theo giờ Việt Nam (UTC+7)
const { vnPeriodStarts, revenueRanges, buildRevenue } = await import('../server/adminPayments.ts')
// Thứ Hai 2026-11-23 00:30 giờ VN = Chủ Nhật 2026-11-22T17:30:00Z (UTC vẫn là Chủ Nhật)
const monEarlyVn = Date.parse('2026-11-22T17:30:00Z')
const monStarts = vnPeriodStarts(monEarlyVn)
check(
  'mốc 0h VN sáng thứ Hai (UTC vẫn Chủ Nhật): đầu ngày và đầu tuần đều là 2026-11-22T17:00:00Z, đầu tháng là 2026-10-31T17:00:00Z',
  monStarts.day === Date.parse('2026-11-22T17:00:00Z') &&
    monStarts.week === Date.parse('2026-11-22T17:00:00Z') &&
    monStarts.month === Date.parse('2026-10-31T17:00:00Z'),
)
// Chủ Nhật 2026-11-22 23:30 giờ VN = 2026-11-22T16:30:00Z -> tuần bắt đầu thứ Hai 16/11 0h VN (15/11T17:00Z)
const sunLateVn = Date.parse('2026-11-22T16:30:00Z')
const sunStarts = vnPeriodStarts(sunLateVn)
check(
  'mốc tối Chủ Nhật giờ VN: tuần bắt đầu từ 0h thứ Hai tuần đó',
  sunStarts.day === Date.parse('2026-11-21T17:00:00Z') &&
    sunStarts.week === Date.parse('2026-11-15T17:00:00Z') &&
    sunStarts.month === Date.parse('2026-10-31T17:00:00Z'),
)
// Thứ Ba 2026-12-01 01:00 giờ VN = 2026-11-30T18:00:00Z -> tuần bắt đầu thứ Hai 30/11 (tháng trước), tháng bắt đầu 1/12
const dec1Vn = Date.parse('2026-11-30T18:00:00Z')
const decStarts = vnPeriodStarts(dec1Vn)
check(
  'mốc đầu tháng giao tuần (T3 1/12 giờ VN): tuần lùi về T2 30/11, tháng bắt đầu 1/12 0h VN',
  decStarts.day === Date.parse('2026-11-30T17:00:00Z') &&
    decStarts.week === Date.parse('2026-11-29T17:00:00Z') &&
    decStarts.month === Date.parse('2026-11-30T17:00:00Z'),
)
// kỳ trước cùng thời điểm: thứ Hai 23/11/2026 00:30 giờ VN
const rg = revenueRanges(monEarlyVn)
const t = (k: number, side: 'from' | 'to') => Date.parse(rg[side][k])
check(
  'khoảng so sánh: hôm qua tới cùng giờ, tuần trước tới cùng thứ + giờ, tháng trước tới cùng ngày + giờ',
  rg.from.length === 7 &&
    t(1, 'from') === Date.parse('2026-11-21T17:00:00Z') &&
    t(1, 'to') === Date.parse('2026-11-21T17:30:00Z') &&
    t(3, 'from') === Date.parse('2026-11-15T17:00:00Z') &&
    t(3, 'to') === Date.parse('2026-11-15T17:30:00Z') &&
    t(5, 'from') === Date.parse('2026-09-30T17:00:00Z') &&
    t(5, 'to') === Date.parse('2026-10-22T17:30:00Z'),
)
// 31/3 -> tháng trước (2 tháng) ngắn hơn: kỳ trước không vượt sang tháng này
const longRg = revenueRanges(Date.parse('2026-03-30T16:00:00Z')) // 30/3 23:00 VN... đầu tháng 3, đã trôi 29 ngày 23h
check('tháng trước ngắn hơn thì kỳ so sánh bị chặn ở hết tháng trước', Date.parse(longRg.to[5]) <= Date.parse(longRg.from[4]))
const built = buildRevenue(
  [
    { idx: 1, vnd: 10000, n: 1 }, { idx: 2, vnd: 5000, n: 1 }, { idx: 3, vnd: 30000, n: 2 }, { idx: 4, vnd: 20000, n: 1 },
    { idx: 5, vnd: 70000, n: 3 }, { idx: 6, vnd: 0, n: 0 }, { idx: 7, vnd: 180000, n: 7 },
  ],
  [{ month: '2026-11', vnd: '70000', n: '3' }],
)
check(
  'gộp doanh thu: kỳ này, kỳ trước, tất cả và theo tháng',
  built.day === 10000 && built.week === 30000 && built.month === 70000 && built.all === 180000 &&
    built.counts.all === 7 && built.paidCount === 7 &&
    built.prev.day.vnd === 5000 && built.prev.week.count === 1 && built.prev.month.vnd === 0 &&
    built.months[0].month === '2026-11' && built.months[0].vnd === 70000,
)
const o6 = (await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: tk }), orders[orders.length - 1])
payosStatus = 'PENDING'
const bal6 = balance.get(U)
check('cộng tay thiếu ghi chú → 400', (await admin('payments.credit', { orderCode: o6.order_code })).status === 400)
const cr = await admin('payments.credit', { orderCode: o6.order_code, note: 'FT999 sao kê' })
check('cộng tay có ghi chú → cộng đúng điểm đơn + ghi nhật ký', cr.status === 200 && balance.get(U) === bal6! + 50_000 && audits.length === 1)
check('cộng tay lần hai cùng đơn → 400, không cộng thêm', (await admin('payments.credit', { orderCode: o6.order_code, note: 'x' })).status === 400 && balance.get(U) === bal6! + 50_000)
for (const owner of ['admin-1', 'admin-2']) {
  const made = await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: token(owner) })
  const order = orders.at(-1)!
  const rejected = await admin('payments.credit', { orderCode: order.order_code, note: 'đối soát thử' })
  check(`cộng tay vào đơn của ${owner} → 400 và không cộng điểm`, made.status === 200 && order.user_id === owner &&
    rejected.status === 400 && order.status === 'pending' && !balance.get(owner))
}
const o7 = (await call('POST', '/api/pay', { body: { vnd: 4000 }, auth: tk }), orders[orders.length - 1])
payosStatus = 'PAID'
const sy = await admin('payments.sync', { orderCode: o7.order_code })
check('Hỏi PayOS: PayOS báo đã trả → đơn paid, cộng điểm', sy.status === 200 && sy.data.status === 'paid' && o7.status === 'paid')

// huỷ đơn: đóng khung / tạo đơn mới
payosStatus = 'PENDING'
const o8 = (await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: tk }), orders[orders.length - 1])
check('khách khác huỷ đơn của mình → 404, đơn vẫn chờ', (await call('POST', `/api/pay?cancel=${o8.order_code}`, { auth: token('user-b') })).status === 404 && o8.status === 'pending')
payosStatus = 'CANCELLED'
const cx = await call('POST', `/api/pay?cancel=${o8.order_code}`, { auth: tk })
check('huỷ đơn của mình → cancelled', cx.status === 200 && cx.data.status === 'cancelled' && o8.status === 'cancelled')
payosStatus = 'PENDING'
const o9 = (await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: tk }), orders[orders.length - 1])
payosStatus = 'CANCELLED'
const o10 = (await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: tk }), orders[orders.length - 1])
check('tạo đơn mới → đơn chờ cũ bị huỷ, đơn mới vẫn chờ', o9.status === 'cancelled' && o10.status === 'pending')
payosStatus = 'PAID'
const bal10 = balance.get(U)!
const c10 = await call('POST', `/api/pay?cancel=${o10.order_code}`, { auth: tk })
check('huỷ đơn lỡ đã trả → vẫn cộng điểm, báo paid', c10.data.status === 'paid' && balance.get(U) === bal10 + 50_000)
// Strix a70c: tiền về sau khi đơn đã huỷ (đóng khung / tạo đơn mới) vẫn được cộng
const bal9 = balance.get(U)!
check('đơn đã huỷ, tiền về sau → tra đơn tự cộng điểm', (await call('GET', `/api/pay?order=${o9.order_code}`, { auth: tk })).data.status === 'paid' && balance.get(U) === bal9 + 50_000)
payosStatus = 'PENDING'
const o11 = (await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: tk }), orders[orders.length - 1])
payosStatus = 'PAID'
const bal11 = balance.get(U)!
check('webhook đến khi đơn đã huỷ → vẫn cộng điểm', (o11.status = 'cancelled', (await hook({ ...hookData, orderCode: o11.order_code })).status === 200) && o11.status === 'paid' && balance.get(U) === bal11 + 50_000)
payosStatus = 'CANCELLED'
payosPaid = 1000
const o12 = (await call('POST', '/api/pay', { body: { vnd: 2000 }, auth: tk }), orders[orders.length - 1])
o12.status = 'cancelled'
const bal12 = balance.get(U)!
check('đơn huỷ có tiền về thiếu 1.000đ → cộng 25 điểm', (await call('GET', `/api/pay?order=${o12.order_code}`, { auth: tk })).status === 200 && o12.status === 'paid' && balance.get(U) === bal12 + 25_000)
payosPaid = 'full'

// thiếu cấu hình
delete process.env.PAYOS_CHECKSUM_KEY
check('chưa cấu hình PayOS → 503 notConfigured', (await call('POST', '/api/pay', { body: { vnd: 10000 }, auth: tk })).data.notConfigured === true)

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
if (fail) process.exit(1)
