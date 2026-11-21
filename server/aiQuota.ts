import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

/**
 * Điểm AI (chỉ người đã đăng nhập; khách bị chặn ở llmProxy):
 * - Lần đầu dùng AI, tài khoản được tặng một lần AI_WELCOME_POINTS điểm (mặc định 120), cất vào
 *   số dư `ai_credits`. 1 điểm = TOKENS_PER_POINT token. Dùng hết là hết; sau này có gói nạp thêm.
 * - Hạn mức tháng (`AI_MONTHLY_TOKENS`, mặc định 0 = không có) vẫn giữ để bật lại nếu cần;
 *   ngoại lệ từng tài khoản ở `ai_quota_overrides` (monthly_tokens null = không giới hạn).
 * - Hạn mức hiệu lực = hạn mức tháng + số dư; token dùng vượt hạn mức tháng trừ vào số dư.
 * Kiểm trước khi gọi AI, giữ chỗ nguyên tử (`reserveQuota`) để request song song không cùng lọt,
 * cộng sau khi có `usage` thật; request cuối có thể vượt một chút — chấp nhận để khỏi đoán trước số token.
 * Không có SUPABASE_SERVICE_ROLE_KEY (máy dev) → không giới hạn.
 */

const num = (v: string | undefined, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && v !== undefined && v !== '' ? n : d
}
export const TOKENS_PER_POINT = 1000
export const MONTHLY_LIMIT = () => num(process.env.AI_MONTHLY_TOKENS, 0)

let welcomeCache: { v: number; until: number } | null = null
export const resetWelcomeCache = () => (welcomeCache = null)

/** Điểm chào mừng: admin đặt ở app_settings 'ai_welcome' (nhớ 30 giây), chưa đặt hoặc đọc lỗi thì theo AI_WELCOME_POINTS (mặc định 120). */
export async function welcomeTokens(): Promise<number> {
  if (welcomeCache && welcomeCache.until > Date.now()) return welcomeCache.v
  let points = num(process.env.AI_WELCOME_POINTS, 120)
  const s = supa()
  if (s) {
    try {
      const r = await fetch(`${s.base}/rest/v1/app_settings?key=eq.ai_welcome&select=value`, { headers: s.headers, signal: AbortSignal.timeout(3000) })
      if (r.ok) {
        const p = ((await r.json()) as Array<{ value?: { points?: unknown } }>)[0]?.value?.points
        if (typeof p === 'number' && Number.isInteger(p) && p >= 0) points = p
      } else if (welcomeCache) return welcomeCache.v
    } catch {
      if (welcomeCache) return welcomeCache.v
    }
  }
  welcomeCache = { v: points * TOKENS_PER_POINT, until: Date.now() + 30_000 }
  return welcomeCache.v
}

/** limit = hạn mức tháng (base) + số dư điểm (credits); dùng vượt base thì trừ vào credits */
export type Quota = { used: number; limit: number; scope: 'month'; base?: number; credits?: number }

const month = () => new Date().toISOString().slice(0, 7)

export const hasQuotaStore = () => supa() != null

function supa() {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && key ? { base, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null
}

/** Hạn mức hiện tại; null = không giới hạn (máy dev thiếu service key, hoặc ngoại lệ không giới hạn). */
export async function readQuota(userId: string | null, _ip?: string): Promise<Quota | null> {
  if (!userId) return null
  const s = supa()
  if (!s) return null
  try {
    const uid = encodeURIComponent(userId)
    const [ov, r, cr] = await Promise.all([
      fetch(`${s.base}/rest/v1/ai_quota_overrides?user_id=eq.${uid}&select=monthly_tokens`, { headers: s.headers }),
      fetch(`${s.base}/rest/v1/ai_usage?user_id=eq.${uid}&month=eq.${month()}&select=tokens`, { headers: s.headers }),
      fetch(`${s.base}/rest/v1/ai_credits?user_id=eq.${uid}&select=balance`, { headers: s.headers }),
    ])
    // ngoại lệ: monthly_tokens null = không giới hạn, số = hạn mức riêng
    const override = ov.ok ? ((await ov.json()) as Array<{ monthly_tokens: number | null }>)[0] : undefined
    if (override && override.monthly_tokens == null) return null
    const rows = r.ok ? ((await r.json()) as Array<{ tokens: number }>) : []
    const base = override ? Number(override.monthly_tokens) : MONTHLY_LIMIT()
    const credit = cr.ok ? ((await cr.json()) as Array<{ balance: number }>)[0] : undefined
    // chưa có dòng số dư = chưa nhận quà chào mừng → tặng đúng một lần (nguyên tử ở DB)
    const credits = credit ? Number(credit.balance) : cr.ok ? await claimWelcome(userId) : 0
    return { used: Number(rows[0]?.tokens ?? 0), limit: base + credits, scope: 'month', base, credits }
  } catch {
    // Supabase lỗi thì không chặn người dùng (đếm lại khi cộng được)
    return { used: 0, limit: Math.max(MONTHLY_LIMIT(), 1), scope: 'month' }
  }
}

/** Tổng token đã được cộng (quà chào mừng, admin tặng, nạp) theo `ai_credit_events`; lỗi thì 0. */
export async function readGranted(userId: string): Promise<number> {
  const s = supa()
  if (!s) return 0
  try {
    const r = await fetch(`${s.base}/rest/v1/ai_credit_events?user_id=eq.${encodeURIComponent(userId)}&select=tokens&limit=1000`, { headers: s.headers })
    if (!r.ok) return 0
    return ((await r.json()) as Array<{ tokens: number }>).reduce((sum, e) => sum + Number(e.tokens || 0), 0)
  } catch {
    return 0
  }
}

/** Tặng điểm chào mừng; trả số dư sau khi tặng (đã có dòng thì không tặng lại). */
async function claimWelcome(userId: string): Promise<number> {
  const s = supa()
  if (!s) return 0
  const r = await fetch(`${s.base}/rest/v1/rpc/claim_ai_welcome`, {
    method: 'POST',
    headers: s.headers,
    body: JSON.stringify({ p_user: userId, p_tokens: await welcomeTokens() }),
  })
  return r.ok ? Number(await r.json()) : 0
}

/** Cộng token vừa dùng, trả hạn mức mới (null nếu không theo dõi). */
export async function addUsage(userId: string | null, _ip: string, tokens: number, prev: Quota | null): Promise<Quota | null> {
  if (!prev || !userId || tokens <= 0) return prev
  const s = supa()
  if (!s) return prev
  try {
    const r = await fetch(`${s.base}/rest/v1/rpc/add_ai_usage`, {
      method: 'POST',
      headers: s.headers,
      body: JSON.stringify({ p_user: userId, p_month: month(), p_tokens: Math.round(tokens) }),
    })
    if (r.ok) {
      const used = Number(await r.json())
      // vượt hạn mức tháng mà còn điểm: trả phần vượt bằng điểm (trừ cả hai phía, nguyên tử)
      if (prev.credits && prev.base != null && used > prev.base) {
        const c = await fetch(`${s.base}/rest/v1/rpc/consume_ai_credits`, {
          method: 'POST',
          headers: s.headers,
          body: JSON.stringify({ p_user: userId, p_month: month(), p_base: prev.base }),
        })
        const row = c.ok ? ((await c.json()) as Array<{ used: number; balance: number }>)[0] : undefined
        if (row) return { ...prev, used: Number(row.used), credits: Number(row.balance), limit: prev.base + Number(row.balance) }
      }
      return { ...prev, used }
    }
  } catch {
    /* bỏ qua: không làm hỏng câu trả lời AI vì lỗi đếm */
  }
  return { ...prev, used: prev.used + tokens }
}

/**
 * Ước số token của phần gửi lên (không cần tokenizer): ~3 ký tự/token cho tiếng Việt lẫn JSON,
 * cộng phụ phí mỗi tin nhắn. Thà ước cao một chút — dùng để chặn trước khi gọi, số tính tiền vẫn là `usage` thật.
 */
export function estimatePromptTokens(messages: unknown[]): number {
  // đếm cả object (mọi trường đều được gửi lên model), không chỉ `content`
  let chars = 0
  for (const m of messages) chars += typeof m === 'string' ? m.length : JSON.stringify(m ?? '').length
  return Math.ceil(chars / 3) + messages.length * 8
}

/**
 * Giữ chỗ trước khi gọi model. null = hết chỗ (đang có quá nhiều request song song so với hạn mức còn lại);
 * ngược lại trả hàm trả chỗ, gọi nhiều lần không sao. Lỗi hạ tầng thì không chặn người dùng.
 */
export async function reserveQuota(userId: string | null, _ip: string, q: Quota, amount: number): Promise<(() => Promise<void>) | null> {
  let done = false
  const once = (fn: () => Promise<unknown> | void) => async () => {
    if (done) return
    done = true
    await Promise.resolve(fn()).catch(() => {})
  }
  const s = supa()
  if (!s || !userId) return async () => {}
  const m = month()
  try {
    const r = await fetch(`${s.base}/rest/v1/rpc/reserve_ai_quota`, {
      method: 'POST',
      headers: s.headers,
      body: JSON.stringify({ p_user: userId, p_month: m, p_limit: q.limit, p_amount: amount }),
    })
    if (r.ok && (await r.json()) === false) return null
    if (!r.ok) return async () => {}
  } catch {
    return async () => {}
  }
  return once(() =>
    fetch(`${s.base}/rest/v1/rpc/release_ai_quota`, {
      method: 'POST',
      headers: s.headers,
      body: JSON.stringify({ p_user: userId, p_month: m, p_amount: amount }),
    }),
  )
}

export function quotaMessage(q: Quota): string {
  return q.base
    ? 'Bạn đã dùng hết điểm AI của tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau.'
    : 'Bạn đã hết điểm AI. Nạp thêm điểm để tiếp tục.'
}

/*
 * Biên nhận hoàn điểm: mỗi lượt AI thành công (có tính hạn mức) trả về một chuỗi ký HMAC
 * gồm người dùng, tháng, số token. Kết quả không dùng được (JSON hỏng…) thì client gửi lại
 * biên nhận kèm lượt gọi lại → server hoàn số token đó. Lượt gọi lại không có biên nhận
 * (không hoàn hai lần liền), biên nhận sống 15 phút, mỗi biên nhận hoàn một lần, và chỉ hoàn khi lượt gọi lại
 * gửi đúng yêu cầu cũ (mã băm `h`) — để không ai giữ kết quả đắt rồi "gọi lại" bằng câu rẻ cho được hoàn điểm.
 */

const RECEIPT_TTL = 15 * 60_000
const receiptKey = () => process.env.AI_RECEIPT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const sign = (data: string) => createHmac('sha256', receiptKey()).update(data).digest('base64url')
/** h = mã băm yêu cầu đã sinh ra biên nhận: chỉ gửi lại ĐÚNG yêu cầu đó mới được hoàn */
type Receipt = { u: string; m: string; t: number; e: number; n: string; h?: string }

/** mã băm MỌI thứ quyết định giá của yêu cầu AI (messages, trần token, model, mức suy luận, nhiệt độ) để gắn biên nhận với đúng lượt gọi lại */
export function requestHash(messages: unknown, maxTokens: number, extra: { model?: unknown; effort?: unknown; temperature?: unknown } = {}): string {
  return createHash('sha256')
    .update(JSON.stringify(messages ?? null))
    .update(`|${maxTokens}|${JSON.stringify([extra.model ?? null, extra.effort ?? null, extra.temperature ?? null])}`)
    .digest('base64url')
    .slice(0, 22)
}

export function issueReceipt(userId: string | null, _ip: string, tokens: number, hash?: string): string | undefined {
  if (!userId || !receiptKey() || tokens <= 0) return undefined
  const r: Receipt = { u: userId, m: month(), t: Math.round(tokens), e: Date.now() + RECEIPT_TTL, n: randomUUID(), h: hash }
  const data = Buffer.from(JSON.stringify(r)).toString('base64url')
  return `${data}.${sign(data)}`
}

export function readReceipt(receipt: string, userId: string): Receipt | null {
  const [data, mac] = receipt.split('.')
  if (!data || !mac || !receiptKey()) return null
  const want = Buffer.from(sign(data))
  const got = Buffer.from(mac)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const r = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as Receipt
    return r.u === userId && r.e > Date.now() && r.t > 0 ? r : null
  } catch {
    return null
  }
}

/** Biên nhận hợp lệ cho đúng yêu cầu này (cùng mã băm) → trả biên nhận để hoàn SAU khi lượt gọi lại thành công. */
export function checkReceipt(receipt: string, userId: string | null, hash: string): Receipt | null {
  if (!userId) return null
  const r = readReceipt(receipt, userId)
  // lượt gọi lại phải là đúng yêu cầu cũ; biên nhận không có mã băm (bản cũ) thì không hoàn
  return r && r.h && r.h === hash ? r : null
}

/**
 * Hoàn token theo biên nhận đã kiểm (vào số đã dùng tháng trước, phần còn lại trả về số dư điểm); trả hạn mức mới.
 * `cap` = số token chính lượt gọi lại vừa tốn: hoàn KHÔNG vượt mức đó. Lượt gọi lại là đúng yêu cầu cũ nên trúng
 * cache prompt, chỉ tốn ~1/10; hoàn đủ biên nhận thì cặp "gọi + gọi lại" chỉ tốn 1/10 → nuôi được ~20 lần hạn mức.
 * Có trần thì cặp đó luôn tốn ít nhất bằng lượt đắt hơn trong hai lượt.
 */
export async function refundReceipt(userId: string | null, r: Receipt | null, prev: Quota | null, cap: number): Promise<Quota | null> {
  if (!prev || !userId || !r) return prev
  const s = supa()
  if (!s) return prev
  const tokens = Math.min(r.t, Math.max(0, Math.floor(cap)))
  if (!(tokens > 0)) return prev
  try {
    const res = await fetch(`${s.base}/rest/v1/rpc/refund_ai_usage`, {
      method: 'POST',
      headers: s.headers,
      body: JSON.stringify({ p_user: userId, p_month: r.m, p_receipt: r.n, p_tokens: tokens }),
    })
    return res.ok && (await res.json()) != null ? await readQuota(userId) : prev
  } catch {
    return prev
  }
}
