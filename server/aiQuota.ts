import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

/**
 * Điểm AI (chỉ người đã đăng nhập; khách bị chặn ở llmProxy):
 * - Lần đầu dùng AI, tài khoản được tặng một lần AI_WELCOME_POINTS điểm (mặc định 80), cất vào
 *   số dư `ai_credits`. 1 điểm = TOKENS_PER_POINT token. Dùng hết là hết; sau này có gói nạp thêm.
 * - Hạn mức tháng (`AI_MONTHLY_TOKENS`, mặc định 0 = không có) vẫn giữ để bật lại nếu cần;
 *   ngoại lệ từng tài khoản ở `ai_quota_overrides` (monthly_tokens null = không giới hạn).
 * - Hạn mức hiệu lực = hạn mức tháng + số dư; token dùng vượt hạn mức tháng trừ vào số dư.
 * Giữ chỗ trước khi gọi AI, ghi usage và hoàn điểm cùng giao dịch trả chỗ.
 * Chi phí thực có thể khác ước tính, phần vượt vẫn được ghi vào usage.
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

/** Điểm chào mừng: admin đặt ở app_settings 'ai_welcome' (nhớ 30 giây), chưa đặt hoặc đọc lỗi thì theo AI_WELCOME_POINTS (mặc định 80). */
export async function welcomeTokens(): Promise<number> {
  if (welcomeCache && welcomeCache.until > Date.now()) return welcomeCache.v
  let points = num(process.env.AI_WELCOME_POINTS, 80)
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

type FinishQuota = (tokens?: number, refundCap?: number) => Promise<Quota | null>

/** Giữ hạn mức và biên nhận (nếu có) trước khi gọi model. */
export async function reserveQuota(userId: string | null, quota: Quota | null, amount: number, receipt?: Receipt | null): Promise<
  { finish: FinishQuota } | 'receipt_unavailable' | 'quota_exceeded'
> {
  if (!quota || !userId) return { finish: async () => quota }
  const s = supa()
  if (!s) throw new Error('Missing AI quota store')
  const id = randomUUID()
  const post = (rpc: string, args: Record<string, unknown>) => fetch(`${s.base}/rest/v1/rpc/${rpc}`, {
    method: 'POST',
    headers: s.headers,
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(5000),
  })
  const res = await post('reserve_ai_request', {
    p_id: id, p_user: userId, p_month: month(), p_base: Math.floor(quota.base ?? quota.limit),
    p_amount: Math.ceil(amount), p_receipt: receipt?.n ?? null, p_receipt_month: receipt?.m ?? null,
    p_receipt_tokens: receipt?.t ?? 0,
  })
  if (!res.ok) throw new Error(`AI quota reservation failed (${res.status})`)
  const status: unknown = await res.json()
  if (status === 'receipt_unavailable' || status === 'quota_exceeded') return status
  if (status !== 'reserved') throw new Error('Unexpected AI quota reservation result')

  let finished = false
  return {
    async finish(tokens = 0, refundCap = 0) {
      if (finished) return quota
      finished = true
      const args = { p_id: id, p_user: userId, p_tokens: Math.round(tokens), p_refund_cap: Math.floor(refundCap) }
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await post('finish_ai_request', args)
          if (!result.ok) throw new Error(`AI quota settlement failed (${result.status})`)
          const row = await result.json() as { used: number; balance: number } | null
          if (!row) {
            if (tokens > 0) throw new Error('Missing AI quota hold at settlement')
            return quota
          }
          const base = quota.base ?? quota.limit
          return { ...quota, used: Number(row.used), credits: Number(row.balance), limit: base + Number(row.balance) }
        } catch (err) {
          if (attempt === 0) continue
          if (tokens > 0) throw err
          console.error('[aiQuota] Không trả được chỗ giữ AI:', err)
        }
      }
      return quota
    },
  }
}

export function quotaMessage(q: Quota, requiredTokens?: number): string {
  const remaining = q.limit - q.used
  if (requiredTokens !== undefined && remaining > 0) {
    const needed = Math.ceil(requiredTokens / TOKENS_PER_POINT).toLocaleString('vi-VN')
    const left = Math.floor(remaining / TOKENS_PER_POINT).toLocaleString('vi-VN')
    return `Lượt này cần khoảng ${needed} điểm AI nhưng bạn chỉ còn ${left} điểm. Nạp thêm điểm để tiếp tục.`
  }
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
