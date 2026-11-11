/**
 * Hạn mức token AI:
 * - Người đã đăng nhập: AI_MONTHLY_TOKENS token / tháng (UTC), lưu ở bảng Supabase `ai_usage`
 *   (ghi bằng service role qua hàm `add_ai_usage`, cộng dồn nguyên tử).
 * - Khách: AI_GUEST_DAILY_TOKENS token / ngày theo IP, đếm trong bộ nhớ instance.
 * Không có SUPABASE_SERVICE_ROLE_KEY (máy dev) → không giới hạn người đăng nhập.
 * Ngoại lệ từng tài khoản: bảng `ai_quota_overrides` (monthly_tokens null = không giới hạn).
 * Kiểm trước khi gọi AI (đã hết thì chặn), giữ chỗ nguyên tử (`reserveQuota`) để request song song không cùng lọt,
 * cộng sau khi có `usage` thật; request cuối có thể vượt hạn mức một chút — chấp nhận để khỏi phải đoán trước số token.
 */

const num = (v: string | undefined, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}
export const MONTHLY_LIMIT = () => num(process.env.AI_MONTHLY_TOKENS, 150_000)
const GUEST_DAILY_LIMIT = () => num(process.env.AI_GUEST_DAILY_TOKENS, 30_000)

/** limit = hạn mức tháng (base) + số dư điểm admin cộng (credits); dùng vượt base thì trừ vào credits */
export type Quota = { used: number; limit: number; scope: 'month' | 'day'; base?: number; credits?: number }

const month = () => new Date().toISOString().slice(0, 7)
const day = () => new Date().toISOString().slice(0, 10)

function supa() {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && key ? { base, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null
}

const guest = new Map<string, number>()

/** Số token đã dùng trong kỳ hiện tại; null = không giới hạn (máy dev thiếu service key). */
export async function readQuota(userId: string | null, ip: string): Promise<Quota | null> {
  if (!userId) return { used: guest.get(`${day()}:${ip}`) ?? 0, limit: GUEST_DAILY_LIMIT(), scope: 'day' }
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
    const credits = cr.ok ? Number(((await cr.json()) as Array<{ balance: number }>)[0]?.balance ?? 0) : 0
    return { used: Number(rows[0]?.tokens ?? 0), limit: base + credits, scope: 'month', base, credits }
  } catch {
    // Supabase lỗi thì không chặn người dùng (đếm lại khi cộng được)
    return { used: 0, limit: MONTHLY_LIMIT(), scope: 'month' }
  }
}

/** Cộng token vừa dùng, trả hạn mức mới (null nếu không theo dõi). */
export async function addUsage(userId: string | null, ip: string, tokens: number, prev: Quota | null): Promise<Quota | null> {
  if (!prev || tokens <= 0) return prev
  if (!userId) {
    const k = `${day()}:${ip}`
    if (guest.size > 20000) guest.clear()
    const used = (guest.get(k) ?? 0) + tokens
    guest.set(k, used)
    return { ...prev, used }
  }
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
      // vượt hạn mức tháng mà còn điểm cộng: trả phần vượt bằng điểm cộng (trừ cả hai phía, nguyên tử)
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
const guestHeld = new Map<string, number>()

/**
 * Giữ chỗ trước khi gọi model. null = hết chỗ (đang có quá nhiều request song song so với hạn mức còn lại);
 * ngược lại trả hàm trả chỗ, gọi nhiều lần không sao. Lỗi hạ tầng thì không chặn người dùng.
 */
export async function reserveQuota(userId: string | null, ip: string, q: Quota): Promise<(() => Promise<void>) | null> {
  let done = false
  const once = (fn: () => Promise<unknown> | void) => async () => {
    if (done) return
    done = true
    await Promise.resolve(fn()).catch(() => {})
  }
  if (!userId) {
    const k = `${day()}:${ip}`
    const held = guestHeld.get(k) ?? 0
    if ((guest.get(k) ?? 0) + held >= q.limit) return null
    if (guestHeld.size > 20000) guestHeld.clear()
    guestHeld.set(k, held + RESERVE)
    return once(() => {
      const left = (guestHeld.get(k) ?? 0) - RESERVE
      if (left > 0) guestHeld.set(k, left)
      else guestHeld.delete(k)
    })
  }
  const s = supa()
  if (!s) return async () => {}
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
  return q.scope === 'day'
    ? 'Bạn đã dùng hết lượt AI dùng thử hôm nay. Đăng nhập để có thêm hạn mức hằng tháng.'
    : 'Bạn đã dùng hết hạn mức AI của tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau.'
}
