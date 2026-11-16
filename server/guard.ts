/**
 * Chặn lạm dụng API (gọi AI miễn phí, đổ file rác lên R2):
 * - Origin lạ (trang web khác gọi vào) → 403
 * - Người đã đăng nhập (token Supabase hợp lệ) được hạn mức rộng; khách chỉ được ít lượt / IP
 * - Quá hạn mức → 429
 * Đếm trong bộ nhớ của từng instance (Vercel tái dùng instance nên vẫn chặn được phần lớn);
 * máy dev (localhost) không bị giới hạn.
 */
import { createHash } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json } from './http.js'

type Api = 'llm' | 'image' | 'upload' | 'extract' | 'search' | 'attempt' | 'exam' | 'admin'

/** số lượt mỗi cửa sổ 10 phút: [khách theo IP, người đã đăng nhập] */
const LIMITS: Record<Api, [number, number]> = {
  llm: [20, 300],
  image: [3, 40],
  upload: [20, 300],
  extract: [20, 200],
  search: [20, 200],
  // mở đề và nộp bài: cả lớp/cả trường thường đi chung một IP, và hai API này không gọi AI nên rẻ
  attempt: [500, 500],
  exam: [1000, 1000],
  // trang admin: khách gọi bị 401 ngay, giới hạn chặt để khỏi dò
  admin: [20, 600],
}
const WINDOW_MS = 10 * 60 * 1000

const hits = new Map<string, { count: number; reset: number }>()
/** kết quả kiểm token, khoá bằng mã băm (không giữ cả chuỗi token client gửi — có thể dài tuỳ ý) */
const tokenCache = new Map<string, { userId: string | null; until: number }>()
const TOKEN_CACHE_MAX = 5000
/**
 * Số lần hỏi Supabase /auth/v1/user trong 10 phút (token đã nhớ trong cache không tính):
 * theo từng tài khoản (`sub` trong token) và một mức chung rộng hơn nhiều cho cả IP — cả lớp đi chung
 * một IP vẫn đăng nhập được, còn một người spam token giả chỉ tự làm cạn phần của mình.
 */
const VERIFY_PER_SUB = 30
const VERIFY_PER_IP = 600
const verifyHits = new Map<string, { count: number; reset: number }>()
/** JWT của Supabase: 3 đoạn base64url, vài trăm byte – vài KB */
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

/** đếm theo cửa sổ 10 phút; true = còn lượt */
function take(map: Map<string, { count: number; reset: number }>, key: string, max: number): boolean {
  const now = Date.now()
  const cur = map.get(key)
  if (!cur || cur.reset <= now) {
    if (map.size > 20000) map.clear()
    map.set(key, { count: 1, reset: now + WINDOW_MS })
    return true
  }
  if (cur.count >= max) return false
  cur.count++
  return true
}

/**
 * Chỉ đếm lượt theo IP (không kiểm Origin, không hỏi token) — cho đường đọc tệp `/api/files/...`:
 * `<img src>` và link tải không gửi Origin nên không dùng được `guard()`. Hết lượt → 429, trả false.
 */
export function rateLimitOnly(req: IncomingMessage, res: ServerResponse, name: string, max: number): boolean {
  const ip = clientIp(req)
  if (isLocal(ip) || take(hits, `${name}:${ip}`, max)) return true
  json(res, 429, { error: 'Quá nhiều yêu cầu, thử lại sau ít phút.' })
  return false
}

const header = (req: IncomingMessage, name: string) => {
  const v = req.headers[name]
  return (Array.isArray(v) ? v[0] : v) ?? ''
}

const onVercel = !!process.env.VERCEL

/** IP thật: trên Vercel lấy header do Vercel tự ghi (khách không giả được); máy dev lấy địa chỉ socket. */
export const LOGIN_REQUIRED = 'Bạn cần đăng nhập để dùng AI.'

export function clientIp(req: IncomingMessage): string {
  if (onVercel) return header(req, 'x-vercel-forwarded-for').split(',')[0].trim() || header(req, 'x-real-ip') || req.socket?.remoteAddress || ''
  return req.socket?.remoteAddress || ''
}

/**
 * Miễn Origin / hạn mức / token cho loopback CHỈ khi bật rõ ràng: `vite` dev (tự đặt NODE_ENV=development)
 * hoặc `ALLOW_LOCAL_BYPASS=1`; không bao giờ trên Vercel. Tự host sau reverse proxy thì mọi request đều
 * đến từ 127.0.0.1 — nếu chỉ xét IP thì cả Internet được miễn.
 */
export const isLocal = (ip: string) =>
  !onVercel &&
  (process.env.NODE_ENV === 'development' || process.env.ALLOW_LOCAL_BYPASS === '1') &&
  (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1')

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

/** `sub` (id tài khoản) ghi trong token, CHƯA kiểm chữ ký — chỉ dùng làm khoá đếm lượt */
function claimedSub(token: string): string {
  try {
    const sub = (JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { sub?: unknown }).sub
    return typeof sub === 'string' ? sub.slice(0, 64) : ''
  } catch {
    return ''
  }
}

/** 'busy' = chưa kiểm được (hết lượt hỏi Supabase hoặc Supabase lỗi tạm) — KHÁC với token sai */
export type TokenCheck = { userId: string | null; busy?: boolean }
/** kết quả đã kiểm cho request này (guard kiểm trước, handler đọc lại không tốn thêm lượt) */
const checked = new WeakMap<IncomingMessage, TokenCheck>()

/**
 * Kiểm token Supabase (hỏi Supabase, nhớ 5 phút); token sai/hết hạn → userId null.
 * Chống spam: token không đúng dạng JWT hoặc quá dài thì bỏ luôn (không hỏi Supabase, không nhớ);
 * giới hạn số lần hỏi theo tài khoản và theo IP. Hết lượt hay Supabase lỗi tạm → busy, không nhớ
 * (đừng biến người dùng thật thành khách suốt 5 phút).
 */
export async function checkToken(req: IncomingMessage): Promise<TokenCheck> {
  const done = checked.get(req)
  if (done) return done
  const r = await verify(req)
  checked.set(req, r)
  return r
}

async function verify(req: IncomingMessage): Promise<TokenCheck> {
  const token = header(req, 'authorization').replace(/^Bearer\s+/i, '').trim()
  if (!token || token.length > 4096 || !JWT_SHAPE.test(token)) return { userId: null }
  const digest = createHash('sha256').update(token).digest('base64url')
  const cached = tokenCache.get(digest)
  if (cached && cached.until > Date.now()) return { userId: cached.userId }
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
  if (!base || !key) return { userId: null }
  const ip = clientIp(req)
  if (!isLocal(ip)) {
    const sub = claimedSub(token)
    // token không có sub thì không thể là token đăng nhập Supabase
    if (!sub) return { userId: null }
    if (!take(verifyHits, `s:${sub}`, VERIFY_PER_SUB) || !take(verifyHits, `ip:${ip}`, VERIFY_PER_IP)) return { userId: null, busy: true }
  }
  let userId: string | null = null
  try {
    const res = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })
    // chỉ 401/403 mới là token sai; 5xx/429 là Supabase trục trặc → thử lại sau, không nhớ
    if (!res.ok && res.status !== 401 && res.status !== 403) return { userId: null, busy: true }
    if (res.ok) userId = ((await res.json()) as { id?: string }).id ?? null
  } catch {
    return { userId: null, busy: true }
  }
  // đầy thì bỏ mục cũ nhất (Map giữ thứ tự thêm vào), không xoá sạch
  if (tokenCache.size >= TOKEN_CACHE_MAX) tokenCache.delete(tokenCache.keys().next().value as string)
  tokenCache.set(digest, { userId, until: Date.now() + 5 * 60 * 1000 })
  return { userId }
}

/** id người dùng (null = khách / token sai / chưa kiểm được) */
export async function userFromToken(req: IncomingMessage): Promise<string | null> {
  return (await checkToken(req)).userId
}

export const TOKEN_BUSY = 'Hệ thống đang bận kiểm tra đăng nhập, vui lòng thử lại sau ít giây.'

/** true = cho qua; false = đã trả lỗi 403/429 */
export async function guard(req: IncomingMessage, res: ServerResponse, api: Api): Promise<boolean> {
  if (req.method === 'OPTIONS') return true
  if (!originAllowed(req)) {
    json(res, 403, { error: 'Không cho phép gọi từ trang web khác.' })
    return false
  }
  const ip = clientIp(req)
  if (isLocal(ip)) return true
  const { userId, busy } = await checkToken(req)
  // có token mà chưa kiểm được: báo thử lại (503), đừng coi là khách rồi bắt đăng nhập lại
  if (busy) {
    json(res, 503, { error: TOKEN_BUSY, retry: true })
    return false
  }
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
