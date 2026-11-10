/**
 * API trang Admin: một endpoint `/api/admin` (Vercel Hobby giới hạn số function), POST {action, ...}.
 * - Quyền đọc từ bảng `user_roles` (chỉ service role đọc được). Ẩn nút ở giao diện KHÔNG phải bảo mật:
 *   mọi action đều qua `requireAdmin` ở đây.
 * - Thao tác thay đổi dữ liệu ghi một dòng vào `admin_audit`.
 * - Tài khoản: Supabase Auth Admin API (`/auth/v1/admin/users`), cần SUPABASE_SERVICE_ROLE_KEY.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { guard, userFromToken } from './guard.js'
import { json, readBody } from './http.js'
import { deleteR2Object, r2KeyFromUrl } from './r2.js'

export type Role = 'admin' | 'moderator'

type Supa = { base: string; headers: Record<string, string> }

function supa(): Supa | null {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && key ? { base, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const month = () => new Date().toISOString().slice(0, 7)

/** quyền theo user id, nhớ 60 giây (đổi quyền có hiệu lực sau tối đa 1 phút) */
const roleCache = new Map<string, { role: Role | null; until: number }>()

export async function roleOf(s: Supa, userId: string): Promise<Role | null> {
  const hit = roleCache.get(userId)
  if (hit && hit.until > Date.now()) return hit.role
  const r = await fetch(`${s.base}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=role`, { headers: s.headers })
  if (!r.ok) throw new Error(`Không đọc được quyền (${r.status})`)
  const role = (((await r.json()) as Array<{ role: Role }>)[0]?.role ?? null) as Role | null
  if (roleCache.size > 1000) roleCache.clear()
  roleCache.set(userId, { role, until: Date.now() + 60_000 })
  return role
}

/** test gọi để xoá cache giữa các ca */
export const _resetRoleCache = () => roleCache.clear()

export type AdminCtx = { s: Supa; userId: string; role: Role }

/**
 * Người gọi phải đăng nhập và có quyền `need` (admin làm được mọi việc của moderator).
 * Sai → trả 401/403 và null. Không nói rõ lý do để khỏi lộ thông tin.
 */
export async function requireAdmin(req: IncomingMessage, res: ServerResponse, need: Role = 'admin'): Promise<AdminCtx | null> {
  const s = supa()
  if (!s) {
    json(res, 503, { error: 'Máy chủ chưa cấu hình.' })
    return null
  }
  const userId = await userFromToken(req)
  if (!userId) {
    json(res, 401, { error: 'Cần đăng nhập.' })
    return null
  }
  let role: Role | null
  try {
    role = await roleOf(s, userId)
  } catch {
    json(res, 503, { error: 'Không kiểm tra được quyền, thử lại sau.' })
    return null
  }
  if (!role || (need === 'admin' && role !== 'admin')) {
    json(res, 403, { error: 'Không có quyền.' })
    return null
  }
  return { s, userId, role }
}

async function audit(ctx: AdminCtx, action: string, target: string, detail: Record<string, unknown> = {}): Promise<void> {
  await fetch(`${ctx.s.base}/rest/v1/admin_audit`, {
    method: 'POST',
    headers: { ...ctx.s.headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ admin_id: ctx.userId, action, target, detail }),
  }).catch(() => {})
}

class HttpError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
  }
}

async function call<T>(s: Supa, path: string, init: RequestInit = {}): Promise<{ data: T; res: Response }> {
  const res = await fetch(`${s.base}${path}`, { ...init, headers: { ...s.headers, ...(init.headers as Record<string, string>) } })
  const text = await res.text()
  if (!res.ok) throw new HttpError(502, `Supabase trả lỗi ${res.status}: ${text.slice(0, 200)}`)
  return { data: (text ? JSON.parse(text) : null) as T, res }
}

interface AuthUser {
  id: string
  email?: string
  created_at: string
  last_sign_in_at?: string | null
  banned_until?: string | null
  user_metadata?: { full_name?: string; name?: string }
}

/** Dòng người dùng trả cho giao diện; giữ khớp `AdminUser` trong src/lib/adminApi.ts */
function toRow(u: AuthUser, st?: { docs: number; decks: number; tokens: number; role: Role | null }) {
  const banned = !!u.banned_until && new Date(u.banned_until).getTime() > Date.now()
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? '',
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    bannedUntil: banned ? u.banned_until! : null,
    role: st?.role ?? null,
    docs: Number(st?.docs ?? 0),
    decks: Number(st?.decks ?? 0),
    tokensThisMonth: Number(st?.tokens ?? 0),
  }
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const needUser = (v: unknown) => {
  if (typeof v !== 'string' || !UUID.test(v)) throw new HttpError(400, 'Thiếu hoặc sai mã người dùng.')
  return v
}

async function getUser(s: Supa, id: string): Promise<AuthUser> {
  return (await call<AuthUser>(s, `/auth/v1/admin/users/${id}`)).data
}

/** Không cho admin tự khoá / xoá mình, và không đụng tới tài khoản admin khác. */
async function protectTarget(ctx: AdminCtx, id: string) {
  if (id === ctx.userId) throw new HttpError(400, 'Không thao tác trên chính tài khoản của bạn.')
  if ((await roleOf(ctx.s, id)) === 'admin') throw new HttpError(400, 'Không thao tác trên tài khoản admin khác.')
}

type Body = Record<string, unknown>
type Handler = (ctx: AdminCtx, b: Body) => Promise<unknown>

const ACTIONS: Record<string, { need: Role; run: Handler }> = {
  /** giao diện hỏi "tôi có quyền gì" để quyết định hiện trang hay 404 */
  me: { need: 'moderator', run: async (ctx) => ({ userId: ctx.userId, role: ctx.role }) },

  'users.list': {
    need: 'admin',
    run: async ({ s }, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(b.perPage) || 20)))
      const q = str(b.q, 100)
      const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      if (q) qs.set('filter', q)
      const { data, res } = await call<{ users: AuthUser[]; total?: number }>(s, `/auth/v1/admin/users?${qs}`)
      const users = data.users ?? []
      const total = Number(res.headers.get('x-total-count') ?? data.total ?? users.length)
      const stats = users.length
        ? (
            await call<Array<{ user_id: string; docs: number; decks: number; tokens: number; role: Role | null }>>(s, '/rest/v1/rpc/admin_user_stats', {
              method: 'POST',
              body: JSON.stringify({ p_ids: users.map((u) => u.id), p_month: month() }),
            })
          ).data
        : []
      const byId = new Map(stats.map((x) => [x.user_id, x]))
      return { users: users.map((u) => toRow(u, byId.get(u.id))), total, page, perPage }
    },
  },

  'users.ban': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = needUser(b.userId)
      await protectTarget(ctx, id)
      // không ghi số giờ = khoá vô thời hạn (~100 năm)
      const hours = Math.floor(Number(b.hours) || 0)
      const reason = str(b.reason, 500)
      await call(ctx.s, `/auth/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ ban_duration: hours > 0 ? `${hours}h` : '876000h' }) })
      await audit(ctx, 'users.ban', id, { hours: hours || null, reason })
      return { ok: true }
    },
  },

  'users.unban': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = needUser(b.userId)
      await call(ctx.s, `/auth/v1/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ ban_duration: 'none' }) })
      await audit(ctx, 'users.unban', id)
      return { ok: true }
    },
  },

  /**
   * Xoá tài khoản: bắt gõ lại đúng email. Bảng con có `on delete cascade` (đề đồng bộ, tài liệu, hạn mức)
   * tự xoá theo; đề cộng đồng được GIỮ, chỉ mất chủ (`owner_id` → null, migration 20261110b). Tệp R2 xoá riêng, chỉ khi không còn tài khoản khác dùng chung tệp đó
   * (tên tệp là hash nội dung nên hai người tải cùng tệp sẽ trùng key).
   */
  'users.delete': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = needUser(b.userId)
      await protectTarget(ctx, id)
      const user = await getUser(ctx.s, id)
      if (!user.email || str(b.confirmEmail).toLowerCase() !== user.email.toLowerCase()) throw new HttpError(400, 'Email xác nhận không khớp.')
      const { data: docs } = await call<Array<{ url: string }>>(ctx.s, `/rest/v1/user_documents?owner_id=eq.${id}&select=url`)
      const keys = [...new Set(docs.map((d) => r2KeyFromUrl(d.url ?? '')).filter((k): k is string => !!k))]
      await call(ctx.s, `/auth/v1/admin/users/${id}`, { method: 'DELETE' })
      let removed = 0
      for (const key of keys) {
        const { data: others } = await call<unknown[]>(ctx.s, `/rest/v1/user_documents?url=eq.${encodeURIComponent(`/api/files/${key}`)}&select=id&limit=1`)
        if (!others.length && (await deleteR2Object(key).catch(() => false))) removed++
      }
      await audit(ctx, 'users.delete', id, { email: user.email, files: keys.length, filesRemoved: removed })
      return { ok: true, filesRemoved: removed }
    },
  },

  /** hạn mức AI riêng: monthlyTokens = số token / tháng, null = không giới hạn */
  'quota.set': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = needUser(b.userId)
      const raw = b.monthlyTokens
      const monthly = raw === null ? null : Math.floor(Number(raw))
      if (monthly !== null && !(monthly >= 0 && monthly <= 1e9)) throw new HttpError(400, 'Hạn mức không hợp lệ.')
      const note = str(b.note, 300)
      await call(ctx.s, '/rest/v1/ai_quota_overrides?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: id, monthly_tokens: monthly, note: note || null }),
      })
      await audit(ctx, 'quota.set', id, { monthlyTokens: monthly, note })
      return { ok: true }
    },
  },

  /** cộng điểm AI: cộng dồn `tokens` vào số dư của tài khoản (không mất khi sang tháng) */
  'credits.grant': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = needUser(b.userId)
      const tokens = Math.floor(Number(b.tokens))
      if (!(tokens > 0 && tokens <= 100_000_000)) throw new HttpError(400, 'Số điểm cộng phải là số nguyên dương.')
      const note = str(b.note, 300)
      const { data: balance } = await call<number>(ctx.s, '/rest/v1/rpc/grant_ai_credits', {
        method: 'POST',
        body: JSON.stringify({ p_user: id, p_tokens: tokens }),
      })
      await audit(ctx, 'credits.grant', id, { tokens, balance, note })
      return { ok: true, balance: Number(balance) }
    },
  },

  /** bỏ hạn mức riêng: quay về mặc định AI_MONTHLY_TOKENS */
  'quota.clear': {
    need: 'admin',
    run: async (ctx, b) => {
      const id = needUser(b.userId)
      await call(ctx.s, `/rest/v1/ai_quota_overrides?user_id=eq.${id}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } })
      await audit(ctx, 'quota.clear', id)
      return { ok: true }
    },
  },

  'quota.get': {
    need: 'admin',
    run: async ({ s }, b) => {
      const id = needUser(b.userId)
      const [{ data: ov }, { data: use }, { data: cr }] = await Promise.all([
        call<Array<{ monthly_tokens: number | null; note: string | null }>>(s, `/rest/v1/ai_quota_overrides?user_id=eq.${id}&select=monthly_tokens,note`),
        call<Array<{ tokens: number; requests: number }>>(s, `/rest/v1/ai_usage?user_id=eq.${id}&month=eq.${month()}&select=tokens,requests`),
        call<Array<{ balance: number }>>(s, `/rest/v1/ai_credits?user_id=eq.${id}&select=balance`),
      ])
      const defaultLimit = Number(process.env.AI_MONTHLY_TOKENS) > 0 ? Number(process.env.AI_MONTHLY_TOKENS) : 150_000
      return {
        override: ov[0] ? { monthlyTokens: ov[0].monthly_tokens, note: ov[0].note ?? '' } : null,
        defaultLimit,
        usedThisMonth: Number(use[0]?.tokens ?? 0),
        requestsThisMonth: Number(use[0]?.requests ?? 0),
        credits: Number(cr[0]?.balance ?? 0),
      }
    },
  },

  'audit.list': {
    need: 'admin',
    run: async ({ s }, b) => {
      const page = Math.max(1, Math.floor(Number(b.page) || 1))
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(b.perPage) || 30)))
      const from = (page - 1) * perPage
      const { data, res } = await call<Array<{ id: number; admin_id: string | null; action: string; target: string | null; detail: unknown; created_at: string }>>(
        s,
        `/rest/v1/admin_audit?select=*&order=created_at.desc&offset=${from}&limit=${perPage}`,
        { headers: { Prefer: 'count=exact' } },
      )
      const total = Number(res.headers.get('content-range')?.split('/')[1] ?? data.length)
      return {
        items: data.map((r) => ({ id: r.id, adminId: r.admin_id, action: r.action, target: r.target, detail: r.detail, createdAt: r.created_at })),
        total,
        page,
        perPage,
      }
    },
  },
}

export async function handleAdminRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'admin'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  let body: Body
  try {
    body = JSON.parse(await readBody(req, 64 * 1024)) as Body
  } catch {
    return json(res, 400, { error: 'Dữ liệu không hợp lệ.' })
  }
  const entry = ACTIONS[str(body.action, 50)]
  if (!entry) return json(res, 400, { error: 'Thao tác không tồn tại.' })
  const ctx = await requireAdmin(req, res, entry.need)
  if (!ctx) return
  try {
    return json(res, 200, await entry.run(ctx, body))
  } catch (err) {
    if (err instanceof HttpError) return json(res, err.code, { error: err.message })
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function adminMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleAdminRequest(req, res).catch((err: unknown) => json(res, 500, { error: String(err) }))
}
