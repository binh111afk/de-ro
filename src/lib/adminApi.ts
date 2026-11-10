/**
 * Client cho trang Admin: kiểu dữ liệu + hàm gọi `/api/admin` (server/admin.ts).
 * Giao diện CHỈ dùng các hàm ở đây. Chế độ dữ liệu giả (mock) bật bằng `?mock=1` trên URL
 * hoặc env `VITE_ADMIN_MOCK=1`, để dựng giao diện khi chưa có quyền admin / chưa có Supabase.
 * Kiểu ở đây phải khớp với `toRow` và các action trong server/admin.ts.
 */
import { apiFetch } from './apiFetch'

export type AdminRole = 'admin' | 'moderator'

export interface AdminMe {
  userId: string
  role: AdminRole
}

export interface AdminUser {
  id: string
  email: string
  name: string
  /** ISO */
  createdAt: string
  lastSignInAt: string | null
  /** đang bị khoá đến lúc nào (ISO); null = không khoá */
  bannedUntil: string | null
  role: AdminRole | null
  docs: number
  decks: number
  tokensThisMonth: number
}

export interface UserPage {
  users: AdminUser[]
  total: number
  page: number
  perPage: number
}

export interface UserQuota {
  /** hạn mức riêng; null = dùng mặc định. monthlyTokens null = không giới hạn */
  override: { monthlyTokens: number | null; note: string } | null
  defaultLimit: number
  usedThisMonth: number
  requestsThisMonth: number
  /** số dư điểm cộng (token), cộng thêm vào hạn mức tháng, không mất khi sang tháng */
  credits: number
}

export interface AuditEntry {
  id: number
  adminId: string | null
  action: string
  target: string | null
  detail: unknown
  createdAt: string
}

export class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const isAdminMock = (): boolean => {
  if (import.meta.env?.VITE_ADMIN_MOCK === '1') return true
  try {
    return new URLSearchParams(location.search).get('mock') === '1'
  } catch {
    return false
  }
}

async function post<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await apiFetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new AdminError(res.status, data.error ?? `Lỗi ${res.status}`)
  return data as T
}

// ---------- dữ liệu giả ----------
const MOCK_USERS: AdminUser[] = Array.from({ length: 57 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  email: i === 0 ? 'chu-app@example.com' : `giaovien${i}@example.com`,
  name: i === 0 ? 'Chủ app' : `Giáo viên ${i}`,
  createdAt: new Date(Date.UTC(2026, 9, 1 + (i % 40))).toISOString(),
  lastSignInAt: i % 5 === 4 ? null : new Date(Date.UTC(2026, 10, 1 + (i % 9))).toISOString(),
  bannedUntil: i === 7 ? '2126-01-01T00:00:00Z' : null,
  role: i === 0 ? 'admin' : i === 1 ? 'moderator' : null,
  docs: (i * 7) % 23,
  decks: (i * 3) % 6,
  tokensThisMonth: (i * 13_337) % 160_000,
}))
const MOCK_AUDIT: AuditEntry[] = [
  { id: 3, adminId: MOCK_USERS[0].id, action: 'users.ban', target: MOCK_USERS[7].id, detail: { reason: 'Đăng đề rác' }, createdAt: '2026-11-09T08:12:00Z' },
  { id: 2, adminId: MOCK_USERS[0].id, action: 'quota.set', target: MOCK_USERS[3].id, detail: { monthlyTokens: 500000 }, createdAt: '2026-11-08T15:40:00Z' },
  { id: 1, adminId: MOCK_USERS[0].id, action: 'users.unban', target: MOCK_USERS[9].id, detail: {}, createdAt: '2026-11-05T10:02:00Z' },
]
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250))

// ---------- API ----------

/** Quyền của người đang đăng nhập. Không có quyền → ném AdminError 401/403 (giao diện hiện 404). */
export function getMe(): Promise<AdminMe> {
  if (isAdminMock()) return wait({ userId: MOCK_USERS[0].id, role: 'admin' as const })
  return post('me')
}

export function listUsers(opts: { q?: string; page?: number; perPage?: number } = {}): Promise<UserPage> {
  if (isAdminMock()) {
    const q = (opts.q ?? '').toLowerCase()
    const page = opts.page ?? 1
    const perPage = opts.perPage ?? 20
    const all = MOCK_USERS.filter((u) => !q || u.email.includes(q) || u.name.toLowerCase().includes(q))
    return wait({ users: all.slice((page - 1) * perPage, page * perPage), total: all.length, page, perPage })
  }
  return post('users.list', opts)
}

/** hours bỏ trống = khoá vô thời hạn */
export function banUser(userId: string, opts: { reason?: string; hours?: number } = {}): Promise<{ ok: true }> {
  if (isAdminMock()) {
    const u = MOCK_USERS.find((x) => x.id === userId)
    if (u) u.bannedUntil = new Date(Date.now() + (opts.hours ? opts.hours * 3600e3 : 100 * 365 * 864e5)).toISOString()
    return wait({ ok: true as const })
  }
  return post('users.ban', { userId, ...opts })
}

export function unbanUser(userId: string): Promise<{ ok: true }> {
  if (isAdminMock()) {
    const u = MOCK_USERS.find((x) => x.id === userId)
    if (u) u.bannedUntil = null
    return wait({ ok: true as const })
  }
  return post('users.unban', { userId })
}

/** Xoá vĩnh viễn. confirmEmail phải trùng email tài khoản. Đề cộng đồng của họ vẫn giữ (không còn chủ). */
export function deleteUser(userId: string, confirmEmail: string): Promise<{ ok: true; filesRemoved: number }> {
  if (isAdminMock()) {
    const i = MOCK_USERS.findIndex((x) => x.id === userId)
    if (i < 0 || MOCK_USERS[i].email !== confirmEmail.trim().toLowerCase()) return Promise.reject(new AdminError(400, 'Email xác nhận không khớp.'))
    MOCK_USERS.splice(i, 1)
    return wait({ ok: true as const, filesRemoved: 0 })
  }
  return post('users.delete', { userId, confirmEmail })
}

export function getQuota(userId: string): Promise<UserQuota> {
  if (isAdminMock()) {
    const u = MOCK_USERS.find((x) => x.id === userId)
    return wait({ override: null, defaultLimit: 150_000, usedThisMonth: u?.tokensThisMonth ?? 0, requestsThisMonth: 12, credits: mockCredits.get(userId) ?? 0 })
  }
  return post('quota.get', { userId })
}

const mockCredits = new Map<string, number>()

/** Cộng điểm AI: cộng dồn `tokens` vào số dư của người đó. Trả số dư mới. */
export function grantCredits(userId: string, tokens: number, note = ''): Promise<{ ok: true; balance: number }> {
  if (isAdminMock()) {
    const balance = (mockCredits.get(userId) ?? 0) + Math.floor(tokens)
    mockCredits.set(userId, balance)
    return wait({ ok: true as const, balance })
  }
  return post('credits.grant', { userId, tokens, note })
}

/** monthlyTokens null = không giới hạn */
export function setQuota(userId: string, monthlyTokens: number | null, note = ''): Promise<{ ok: true }> {
  if (isAdminMock()) return wait({ ok: true as const })
  return post('quota.set', { userId, monthlyTokens, note })
}

export function clearQuota(userId: string): Promise<{ ok: true }> {
  if (isAdminMock()) return wait({ ok: true as const })
  return post('quota.clear', { userId })
}

export function listAudit(opts: { page?: number; perPage?: number } = {}): Promise<{ items: AuditEntry[]; total: number; page: number; perPage: number }> {
  if (isAdminMock()) return wait({ items: MOCK_AUDIT, total: MOCK_AUDIT.length, page: 1, perPage: 30 })
  return post('audit.list', opts)
}

/** Tên tiếng Việt của action trong nhật ký */
export const AUDIT_LABEL: Record<string, string> = {
  'users.ban': 'Khoá tài khoản',
  'users.unban': 'Mở khoá tài khoản',
  'users.delete': 'Xoá tài khoản',
  'quota.set': 'Đặt hạn mức AI',
  'credits.grant': 'Cộng điểm AI',
  'quota.clear': 'Bỏ hạn mức riêng',
}
