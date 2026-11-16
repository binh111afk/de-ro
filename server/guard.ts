/**
 * Chặn lạm dụng API (gọi AI miễn phí, đổ file rác lên R2):
 * - Origin lạ (trang web khác gọi vào) → 403
 * - Người đã đăng nhập (token Supabase hợp lệ) được hạn mức rộng; khách chỉ được ít lượt / IP
 * - Quá hạn mức → 429
 * Đếm trong bộ nhớ của từng instance (Vercel tái dùng instance nên vẫn chặn được phần lớn);
 * máy dev (localhost) không bị giới hạn.
 */
import { createHash, createPublicKey, verify as cryptoVerify, type KeyObject } from 'node:crypto'
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
 * Đường dự phòng (token không kiểm được bằng khoá công khai — xem verifyLocal): số lần hỏi Supabase
 * /auth/v1/user trong 10 phút, theo MÃ BĂM của token (kẻ khác không tạo được trùng) và theo IP.
 * Không khoá theo `sub` chưa kiểm chữ ký: ai biết UUID nạn nhân cũng đốt hết lượt của họ.
 */
const VERIFY_PER_TOKEN = 5
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

const b64json = (part: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as unknown
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

const supaBase = () => (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')

/**
 * Khoá công khai Supabase dùng ký access token (`/auth/v1/.well-known/jwks.json`), nhớ 10 phút.
 * Gặp `kid` lạ thì tải lại, nhưng tối đa 1 lần / phút (token giả mang kid bịa không ép tải liên tục).
 */
let jwks: { keys: Map<string, { alg: string; key: KeyObject }>; until: number; tried: number } = { keys: new Map(), until: 0, tried: 0 }
export const _resetJwks = () => {
  jwks = { keys: new Map(), until: 0, tried: 0 }
}

async function loadJwks(force: boolean): Promise<void> {
  const now = Date.now()
  if (!force && jwks.until > now) return
  if (now - jwks.tried < 60_000) return
  jwks.tried = now
  try {
    const r = await fetch(`${supaBase()}/auth/v1/.well-known/jwks.json`, { signal: AbortSignal.timeout(3000) })
    if (!r.ok) return
    const body = (await r.json()) as { keys?: Array<JsonWebKey & { kid?: string; alg?: string }> }
    const keys = new Map<string, { alg: string; key: KeyObject }>()
    for (const k of body.keys ?? []) {
      if (!k.kid || (k.alg !== 'ES256' && k.alg !== 'RS256')) continue
      try {
        keys.set(k.kid, { alg: k.alg, key: createPublicKey({ key: k, format: 'jwk' }) })
      } catch {
        // khoá hỏng thì bỏ qua khoá đó
      }
    }
    jwks = { keys, until: now + 10 * 60_000, tried: now }
  } catch {
    // mạng lỗi: giữ bộ khoá cũ
  }
}

/**
 * Kiểm token NGAY TẠI SERVER bằng khoá công khai: không gọi mạng nên token giả không tốn gì và không đốt
 * hạn mức của ai. Trả id người dùng, `false` = chắc chắn sai (chữ ký, hết hạn, sai issuer/audience),
 * `null` = không kiểm được theo cách này (thuật toán khác, kid lạ, chưa có khoá) → dùng đường dự phòng.
 */
async function verifyLocal(token: string): Promise<string | false | null> {
  const [h, p, s] = token.split('.')
  const head = b64json(h)
  const alg = head?.alg
  const kid = typeof head?.kid === 'string' ? head.kid : ''
  if ((alg !== 'ES256' && alg !== 'RS256') || !kid) return null
  await loadJwks(false)
  if (!jwks.keys.has(kid)) await loadJwks(true)
  const k = jwks.keys.get(kid)
  if (!k) return null
  if (k.alg !== alg) return false
  const ok = cryptoVerify('sha256', Buffer.from(`${h}.${p}`), alg === 'ES256' ? { key: k.key, dsaEncoding: 'ieee-p1363' } : k.key, Buffer.from(s, 'base64url'))
  if (!ok) return false
  const c = b64json(p)
  const aud = c?.aud
  const audOk = aud === 'authenticated' || (Array.isArray(aud) && aud.includes('authenticated'))
  if (!c || typeof c.exp !== 'number' || c.exp * 1000 <= Date.now() || c.iss !== `${supaBase()}/auth/v1` || !audOk || c.role !== 'authenticated') return false
  return typeof c.sub === 'string' && c.sub ? c.sub : false
}

/**
 * Tài khoản admin đã khoá (`banned_until` trong Supabase Auth) hoặc đã xoá: hỏi Auth Admin API, nhớ 30 giây.
 * Áp cho MỌI API qua checkToken (không chỉ trang admin) — token cũ còn hạn cũng không dùng được nữa.
 * Lỗi mạng → ném lỗi (người gọi trả "bận", không bao giờ coi là chưa bị khoá). Thiếu service key (máy dev) → bỏ qua.
 */
const banCache = new Map<string, { banned: boolean; until: number }>()
export const _resetBanCache = () => banCache.clear()

async function isBannedUser(userId: string): Promise<boolean> {
  const hit = banCache.get(userId)
  if (hit && hit.until > Date.now()) return hit.banned
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!supaBase() || !key) return false
  const r = await fetch(`${supaBase()}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(5000),
  })
  let banned: boolean
  if (r.status === 404) banned = true
  else if (!r.ok) throw new Error(`auth ${r.status}`)
  else {
    const u = (await r.json()) as { banned_until?: string | null; deleted_at?: string | null }
    banned = !!u.deleted_at || (!!u.banned_until && new Date(u.banned_until).getTime() > Date.now())
  }
  if (banCache.size > 5000) banCache.clear()
  banCache.set(userId, { banned, until: Date.now() + 30_000 })
  return banned
}

/** 'busy' = chưa kiểm được (hết lượt hỏi Supabase hoặc Supabase lỗi tạm) — KHÁC với token sai; 'banned' = tài khoản bị khoá */
export type TokenCheck = { userId: string | null; busy?: boolean; banned?: boolean }
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
  let r = await verify(req)
  if (r.userId) {
    try {
      if (await isBannedUser(r.userId)) r = { userId: null, banned: true }
    } catch {
      r = { userId: null, busy: true }
    }
  }
  checked.set(req, r)
  return r
}

async function verify(req: IncomingMessage): Promise<TokenCheck> {
  const token = header(req, 'authorization').replace(/^Bearer\s+/i, '').trim()
  if (!token || token.length > 4096 || !JWT_SHAPE.test(token)) return { userId: null }
  const digest = createHash('sha256').update(token).digest('base64url')
  const cached = tokenCache.get(digest)
  if (cached && cached.until > Date.now()) return { userId: cached.userId }
  const base = supaBase()
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
  if (!base || !key) return { userId: null }
  // đường chính: kiểm chữ ký tại chỗ (không mạng, token giả bị loại ngay, không đụng hạn mức nào)
  const local = await verifyLocal(token)
  if (local !== null) {
    if (local) remember(digest, local)
    return { userId: local || null }
  }
  // dự phòng (token ký kiểu cũ / chưa tải được khoá): hỏi Supabase, giới hạn theo mã băm token + IP
  const ip = clientIp(req)
  if (!isLocal(ip)) {
    if (!b64json(token.split('.')[1])?.sub) return { userId: null }
    if (!take(verifyHits, `t:${digest}`, VERIFY_PER_TOKEN) || !take(verifyHits, `ip:${ip}`, VERIFY_PER_IP)) return { userId: null, busy: true }
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
  remember(digest, userId)
  return { userId }
}

function remember(digest: string, userId: string | null) {
  // đầy thì bỏ mục cũ nhất (Map giữ thứ tự thêm vào), không xoá sạch
  if (tokenCache.size >= TOKEN_CACHE_MAX) tokenCache.delete(tokenCache.keys().next().value as string)
  tokenCache.set(digest, { userId, until: Date.now() + 5 * 60 * 1000 })
}

/** id người dùng (null = khách / token sai / chưa kiểm được) */
export async function userFromToken(req: IncomingMessage): Promise<string | null> {
  return (await checkToken(req)).userId
}

export const BANNED = 'Tài khoản đang bị khoá.'
export const TOKEN_BUSY ='Hệ thống đang bận kiểm tra đăng nhập, vui lòng thử lại sau ít giây.'

/** true = cho qua; false = đã trả lỗi 403/429 */
export async function guard(req: IncomingMessage, res: ServerResponse, api: Api): Promise<boolean> {
  if (req.method === 'OPTIONS') return true
  if (!originAllowed(req)) {
    json(res, 403, { error: 'Không cho phép gọi từ trang web khác.' })
    return false
  }
  const ip = clientIp(req)
  if (isLocal(ip)) return true
  const { userId, busy, banned } = await checkToken(req)
  // có token mà chưa kiểm được: báo thử lại (503), đừng coi là khách rồi bắt đăng nhập lại
  if (busy) {
    json(res, 503, { error: TOKEN_BUSY, retry: true })
    return false
  }
  if (banned) {
    json(res, 403, { error: BANNED })
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
