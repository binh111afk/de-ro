/**
 * Chặn lạm dụng API (gọi AI miễn phí, đổ file rác lên R2):
 * - Origin lạ (trang web khác gọi vào) → 403
 * - Người đã đăng nhập (token Supabase hợp lệ) được hạn mức rộng; khách chỉ được ít lượt / IP
 * - Quá hạn mức → 429
 * Đếm trong bộ nhớ của từng instance (Vercel tái dùng instance nên vẫn chặn được phần lớn);
 * máy dev (localhost) không bị giới hạn.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json } from './http.js'

type Api = 'llm' | 'image' | 'upload' | 'extract' | 'search'

/** số lượt mỗi cửa sổ 10 phút: [khách theo IP, người đã đăng nhập] */
const LIMITS: Record<Api, [number, number]> = {
  llm: [20, 300],
  image: [3, 40],
  upload: [20, 300],
  extract: [20, 200],
  search: [20, 200],
}
const WINDOW_MS = 10 * 60 * 1000

const hits = new Map<string, { count: number; reset: number }>()
const tokenCache = new Map<string, { userId: string | null; until: number }>()

const header = (req: IncomingMessage, name: string) => {
  const v = req.headers[name]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

const onVercel = !!process.env.VERCEL

/** IP thật: trên Vercel lấy header do Vercel tự ghi (khách không giả được); máy dev lấy địa chỉ socket. */
function clientIp(req: IncomingMessage): string {
  if (onVercel) return header(req, 'x-vercel-forwarded-for').split(',')[0].trim() || header(req, 'x-real-ip') || req.socket?.remoteAddress || ''
  return req.socket?.remoteAddress || ''
}

/** chỉ miễn hạn mức khi chạy dev ở máy, không bao giờ trên Vercel */
const isLocal = (ip: string) => !onVercel && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1')

/** Origin hợp lệ: cùng host với request, localhost, hoặc liệt kê trong ALLOWED_ORIGINS (cách nhau dấu phẩy) */
function originAllowed(req: IncomingMessage): boolean {
  const origin = header(req, 'origin')
  // trình duyệt luôn gửi Origin với POST; thiếu Origin trên Vercel → từ chối
  if (!origin) return !onVercel || req.method === 'GET' || req.method === 'HEAD'
  let host: string
  try {
    host = new URL(origin).host
  } catch {
    return false
  }
  if (host === header(req, 'host')) return true
  if (!onVercel && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return true
  const extra = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  return extra.includes(origin)
}

/** id người dùng từ token Supabase (hỏi Supabase, nhớ 5 phút); token sai/hết hạn → null */
async function userFromToken(req: IncomingMessage): Promise<string | null> {
  const token = header(req, 'authorization').replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const cached = tokenCache.get(token)
  if (cached && cached.until > Date.now()) return cached.userId
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
  if (!base || !key) return null
  let userId: string | null = null
  try {
    const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
    if (res.ok) userId = ((await res.json()) as { id?: string }).id ?? null
  } catch {
    userId = null
  }
  if (tokenCache.size > 5000) tokenCache.clear()
  tokenCache.set(token, { userId, until: Date.now() + 5 * 60 * 1000 })
  return userId
}

/** true = cho qua; false = đã trả lỗi 403/429 */
export async function guard(req: IncomingMessage, res: ServerResponse, api: Api): Promise<boolean> {
  if (req.method === 'OPTIONS') return true
  if (!originAllowed(req)) {
    json(res, 403, { error: 'Không cho phép gọi từ trang web khác.' })
    return false
  }
  const ip = clientIp(req)
  if (isLocal(ip)) return true
  const userId = await userFromToken(req)
  const [anonMax, userMax] = LIMITS[api]
  const max = userId ? userMax : anonMax
  const bucket = `${api}:${userId ? `u:${userId}` : `ip:${ip}`}`
  const now = Date.now()
  const cur = hits.get(bucket)
  if (!cur || cur.reset <= now) {
    if (hits.size > 20000) hits.clear()
    hits.set(bucket, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (cur.count >= max) {
    const mins = Math.ceil((cur.reset - now) / 60000)
    json(res, 429, {
      error: userId
        ? `Bạn dùng nhiều quá, thử lại sau khoảng ${mins} phút nhé.`
        : `Đã hết lượt dùng thử. Đăng nhập để dùng tiếp, hoặc thử lại sau khoảng ${mins} phút.`,
    })
    return false
  }
  cur.count++
  return true
}
