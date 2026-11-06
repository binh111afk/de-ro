/**
 * Hạn mức token AI:
 * - Người đã đăng nhập: AI_MONTHLY_TOKENS token / tháng (UTC), lưu ở bảng Supabase `ai_usage`
 *   (ghi bằng service role qua hàm `add_ai_usage`, cộng dồn nguyên tử).
 * - Khách: AI_GUEST_DAILY_TOKENS token / ngày theo IP, đếm trong bộ nhớ instance.
 * Không có SUPABASE_SERVICE_ROLE_KEY (máy dev) → không giới hạn người đăng nhập.
 * Kiểm trước khi gọi AI (đã hết thì chặn), cộng sau khi có `usage` thật; một request có thể
 * vượt hạn mức một chút ở lần cuối — chấp nhận để khỏi phải đoán trước số token.
 */

const num = (v: string | undefined, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}
export const MONTHLY_LIMIT = () => num(process.env.AI_MONTHLY_TOKENS, 150_000)
const GUEST_DAILY_LIMIT = () => num(process.env.AI_GUEST_DAILY_TOKENS, 30_000)

export type Quota = { used: number; limit: number; scope: 'month' | 'day' }

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
    const r = await fetch(`${s.base}/rest/v1/ai_usage?user_id=eq.${encodeURIComponent(userId)}&month=eq.${month()}&select=tokens`, { headers: s.headers })
    const rows = r.ok ? ((await r.json()) as Array<{ tokens: number }>) : []
    return { used: Number(rows[0]?.tokens ?? 0), limit: MONTHLY_LIMIT(), scope: 'month' }
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
    if (r.ok) return { ...prev, used: Number(await r.json()) }
  } catch {
    /* bỏ qua: không làm hỏng câu trả lời AI vì lỗi đếm */
  }
  return { ...prev, used: prev.used + tokens }
}

export function quotaMessage(q: Quota): string {
  return q.scope === 'day'
    ? 'Bạn đã dùng hết lượt AI dùng thử hôm nay. Đăng nhập để có thêm hạn mức hằng tháng.'
    : 'Bạn đã dùng hết hạn mức AI của tháng này. Hạn mức sẽ được làm mới vào đầu tháng sau.'
}
