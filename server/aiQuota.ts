import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

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
const WELCOME_TOKENS = () => num(process.env.AI_WELCOME_POINTS, 120) * TOKENS_PER_POINT

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

/** Tặng điểm chào mừng; trả số dư sau khi tặng (đã có dòng thì không tặng lại). */
async function claimWelcome(userId: string): Promise<number> {
  const s = supa()
  if (!s) return 0
  const r = await fetch(`${s.base}/rest/v1/rpc/claim_ai_welcome`, {
    method: 'POST',
    headers: s.headers,
    body: JSON.stringify({ p_user: userId, p_tokens: WELCOME_TOKENS() }),
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

/** Số token giữ chỗ mỗi request đang chạy (app chạy song song tối đa 2 request AI). */
const RESERVE = 20_000

/**
 * Giữ chỗ trước khi gọi model. null = hết chỗ (đang có quá nhiều request song song so với hạn mức còn lại);
 * ngược lại trả hàm trả chỗ, gọi nhiều lần không sao. Lỗi hạ tầng thì không chặn người dùng.
 */
export async function reserveQuota(userId: string | null, _ip: string, q: Quota): Promise<(() => Promise<void>) | null> {
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
      body: JSON.stringify({ p_user: userId, p_month: m, p_limit: q.limit, p_amount: RESERVE }),
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
      body: JSON.stringify({ p_user: userId, p_month: m, p_amount: RESERVE }),
    }),
  )
}

export function quotaMessage(q: Quota): string {
  return q.base
    ? 'Bạn đã dùng hết điểm AI của tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau.'
    : 'Bạn đã dùng hết điểm AI. Gói nạp thêm điểm sẽ sớm có.'
}

/*
 * Biên nhận hoàn điểm: mỗi lượt AI thành công (có tính hạn mức) trả về một chuỗi ký HMAC
 * gồm người dùng, tháng, số token. Kết quả không dùng được (JSON hỏng…) thì client gửi lại
 * biên nhận kèm lượt gọi lại → server hoàn số token đó. Lượt gọi lại không có biên nhận
 * (không hoàn hai lần liền), biên nhận sống 15 phút, mỗi biên nhận hoàn một lần.
 */

const RECEIPT_TTL = 15 * 60_000
const receiptKey = () => process.env.AI_RECEIPT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const sign = (data: string) => createHmac('sha256', receiptKey()).update(data).digest('base64url')
type Receipt = { u: string; m: string; t: number; e: number; n: string }

export function issueReceipt(userId: string | null, _ip: string, tokens: number): string | undefined {
  if (!userId || !receiptKey() || tokens <= 0) return undefined
  const r: Receipt = { u: userId, m: month(), t: Math.round(tokens), e: Date.now() + RECEIPT_TTL, n: randomUUID() }
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

/** Hoàn token theo biên nhận (vào số đã dùng tháng trước, phần còn lại trả về số dư điểm); trả hạn mức mới. */
export async function refundReceipt(userId: string | null, _ip: string, receipt: string, prev: Quota | null): Promise<Quota | null> {
  if (!prev || !userId) return prev
  const r = readReceipt(receipt, userId)
  const s = supa()
  if (!r || !s) return prev
  try {
    const res = await fetch(`${s.base}/rest/v1/rpc/refund_ai_usage`, {
      method: 'POST',
      headers: s.headers,
      body: JSON.stringify({ p_user: userId, p_month: r.m, p_receipt: r.n, p_tokens: r.t }),
    })
    return res.ok && (await res.json()) != null ? await readQuota(userId) : prev
  } catch {
    return prev
  }
}
