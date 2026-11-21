/**
 * Client cho trang Admin: kiểu dữ liệu + hàm gọi `/api/admin` (server/admin.ts).
 * Giao diện CHỈ dùng các hàm ở đây. Chế độ dữ liệu giả (mock) bật bằng `?mock=1` trên URL
 * hoặc env `VITE_ADMIN_MOCK=1`, để dựng giao diện khi chưa có quyền admin / chưa có Supabase.
 * Kiểu ở đây phải khớp với `toRow` và các action trong server/admin.ts.
 */
import { apiFetch } from './apiFetch'
import { applyPricing, type PricingConfig } from './pricing'

export type AdminRole = 'admin' | 'moderator'

export interface AdminMe {
  userId: string
  role: AdminRole
}

export interface AdminUser {
  id: string
  email: string
  name: string
  /** URL ảnh đại diện; null = chưa đặt */
  avatar: string | null
  online?: boolean
  /** ISO */
  createdAt: string
  lastSignInAt: string | null
  /** đang bị khoá đến lúc nào (ISO); null = không khoá */
  bannedUntil: string | null
  role: AdminRole | null
  docs: number
  decks: number
  tokensThisMonth: number
  /** cờ theo dõi: từng cố gọi API admin khi không có quyền; null = sạch */
  flag: { strikes: number; lastAt: string; lastAction: string | null; lastIp: string | null } | null
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
  /** chưa dùng AI lần nào: `credits` là quà chào mừng sẽ nhận ở lượt đầu */
  welcomePending?: boolean
  /** lượt AI hỏng (trả rỗng, luồng đứt) trong 24 giờ qua / số lượt được miễn điểm mỗi ngày */
  emptyDay?: number
  freeEmpty?: number
}

export interface UserStorage {
  /** mức riêng; null = mặc định */
  override: { maxBytes: number; note: string } | null
  defaultBytes: number
  /** byte đã dùng (đồng bộ + tài liệu); null = không đọc được */
  used: number | null
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
  // bản thật không có dữ liệu giả: người thường mở ?mock=1 không được vào giao diện admin
  if (!import.meta.env?.DEV) return false
  if (import.meta.env?.VITE_ADMIN_MOCK === '1') return true
  try {
    return new URLSearchParams(location.search).get('mock') === '1'
  } catch {
    return false
  }
}

/** Nhớ kết quả các action chỉ đọc 60 giây để chuyển tab admin không phải tải lại; thao tác ghi xoá hết. */
const READ_ACTIONS = new Set(['db.metrics', 'me', 'users.list', 'quota.get', 'storage.get', 'audit.list', 'settings.get', 'ai.stats', 'ai.errors'])
const cache = new Map<string, { at: number; p: Promise<unknown> }>()
export const clearAdminCache = () => cache.clear()

/**
 * Gọi một action của /api/admin. `read: true` = action chỉ đọc (được nhớ 60 giây);
 * mặc định đoán theo READ_ACTIONS. Action ghi xoá toàn bộ cache. Dùng được từ file api của giai đoạn khác.
 */
export async function post<T>(action: string, body: Record<string, unknown> = {}, read = READ_ACTIONS.has(action)): Promise<T> {
  if (!read) {
    cache.clear()
    return send<T>(action, body)
  }
  const key = action + JSON.stringify(body)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < 60_000) return structuredClone(await hit.p) as T
  const p = send<T>(action, body)
  cache.set(key, { at: Date.now(), p })
  p.catch(() => cache.delete(key))
  return structuredClone(await p) as T
}

async function send<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const res = await apiFetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new AdminError(res.status, data.error ?? `Lỗi ${res.status}`)
  return data as T
}

/** Dữ liệu giả trả sau 250ms (giống mạng thật) */
export const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250))

// ---------- API ----------

/** Quyền của người đang đăng nhập. Không có quyền → ném AdminError 401/403 (giao diện hiện 404). */
export async function getMe(): Promise<AdminMe> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetMe()
  return post('me')
}

export async function listUsers(opts: { q?: string; page?: number; perPage?: number } = {}): Promise<UserPage> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockListUsers(opts)
  return post('users.list', opts)
}

/** hours bỏ trống = khoá vô thời hạn */
export async function banUser(userId: string, opts: { reason?: string; hours?: number } = {}): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockBanUser(userId, opts)
  return post('users.ban', { userId, ...opts })
}

export async function unbanUser(userId: string): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockUnbanUser(userId)
  return post('users.unban', { userId })
}

/** Gỡ cờ theo dõi (xoá số lần vi phạm). Không tự mở khoá tài khoản. */
export async function clearSecurityFlag(userId: string): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockClearSecurityFlag(userId)
  return post('security.clear', { userId })
}

/** Xoá vĩnh viễn. confirmEmail phải trùng email tài khoản. Đề cộng đồng của họ vẫn giữ (không còn chủ). */
export async function deleteUser(userId: string, confirmEmail: string): Promise<{ ok: true; filesRemoved: number }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockDeleteUser(userId, confirmEmail)
  return post('users.delete', { userId, confirmEmail })
}

export async function getQuota(userId: string): Promise<UserQuota> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetQuota(userId)
  return post('quota.get', { userId })
}

/** Cộng điểm AI: cộng dồn `tokens` vào số dư của người đó. Trả số dư mới. */
export async function grantCredits(userId: string, tokens: number, note = ''): Promise<{ ok: true; balance: number }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGrantCredits(userId, tokens)
  return post('credits.grant', { userId, tokens, note })
}

/** monthlyTokens null = không giới hạn */
export function setQuota(userId: string, monthlyTokens: number | null, note = ''): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return wait({ ok: true as const })
  return post('quota.set', { userId, monthlyTokens, note })
}

export function clearQuota(userId: string): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return wait({ ok: true as const })
  return post('quota.clear', { userId })
}

export async function getStorage(userId: string): Promise<UserStorage> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetStorage()
  return post('storage.get', { userId })
}

/** maxBytes null = về mặc định 10 MB */
export function setStorage(userId: string, maxBytes: number | null, note = ''): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return wait({ ok: true as const })
  return post('storage.set', { userId, maxBytes, note })
}

export async function listAudit(opts: { page?: number; perPage?: number } = {}): Promise<{ items: AuditEntry[]; total: number; page: number; perPage: number }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockListAudit()
  return post('audit.list', opts)
}

// ---------- giai đoạn 2: vận hành ----------

export interface MaintenanceSetting {
  on: boolean
  message?: string
  /** ISO, dự kiến xong lúc nào (chỉ để hiện) */
  until?: string | null
}
/** Một trang trong popup ở trang chủ */
export interface Announcement {
  id: string
  on: boolean
  title: string
  text: string
  /** `/api/files/img/…`, rỗng = không ảnh */
  image: string
  /** đường dẫn trong app cho nút "Dùng thử", rỗng = không có nút */
  tryPath: string
  /** ISO, quá giờ này thì tự thôi hiện */
  until: string | null
}
export interface AppSettings {
  maintenance: MaintenanceSetting
  announcements: { items: Announcement[] }
  /** null = chưa lưu lần nào, trang giá dùng mặc định */
  pricing: PricingConfig | null
  /** null = chưa đặt, server dùng AI_WELCOME_POINTS (mặc định 120) */
  aiWelcome: { points: number } | null
}
export interface AiStatRow {
  /** yyyy-mm-dd theo giờ VN */
  day: string
  model: string
  provider: string
  calls: number
  errors: number
  tokens: number
  /** USD; null = provider không báo giá */
  cost: number | null
  avgMs: number
}
export interface AiErrorRow {
  id: number
  userId: string | null
  userName?: string
  userEmail?: string
  emptyDay?: number
  model: string
  provider: string
  error: string | null
  ms: number
  createdAt: string
}
export interface HealthCheck {
  ok: boolean
  ms: number
  error?: string
}
export interface HealthReport {
  checkedAt: string
  supabase: HealthCheck
  r2: HealthCheck
  providers: Array<HealthCheck & { provider: string; model: string }>
}

export async function getSettings(): Promise<AppSettings> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetSettings()
  return post('settings.get')
}

export async function setMaintenance(v: MaintenanceSetting): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockSetMaintenance(v)
  return post('settings.set', { key: 'maintenance', value: v })
}

/** AI đọc ảnh trang đề (1-4 ảnh JPEG), trả JSON câu hỏi dạng chuỗi. Chỉ admin. */
export async function bankVision(images: string[]): Promise<{ content: string; model: string }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockBankVision()
  const res = await apiFetch('/api/admin?vision=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images }) })
  const data = (await res.json().catch(() => ({}))) as { content?: string; model?: string; error?: string }
  if (!res.ok || !data.content) throw new Error(data.error ?? 'Không đọc được ảnh đề.')
  return { content: data.content, model: data.model ?? '' }
}

export async function setAnnouncements(items: Announcement[]): Promise<{ ok: true }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockSetAnnouncements(items)
  return post('settings.set', { key: 'announcements', value: { items } })
}

export async function setPricing(v: PricingConfig): Promise<PricingConfig> {
  let saved = v
  if (import.meta.env.DEV && isAdminMock()) saved = (await import('./adminMock')).mockSetPricing(v)
  else saved = (await post<{ ok: true; value: PricingConfig }>('settings.set', { key: 'pricing', value: v })).value
  applyPricing(saved)
  return saved
}

export async function setWelcomePoints(points: number): Promise<number> {
  if (import.meta.env.DEV && isAdminMock()) return points
  return (await post<{ ok: true; value: { points: number } }>('settings.set', { key: 'ai_welcome', value: { points } })).value.points
}

export async function getAiStats(days = 7): Promise<{ days: number; rows: AiStatRow[] }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetAiStats(days)
  return post('ai.stats', { days })
}

export async function getAiErrors(limit = 30): Promise<{ items: AiErrorRow[]; freeEmpty: number }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetAiErrors(limit)
  return post('ai.errors', { limit })
}

export interface HealthProvider {
  provider: string
  /** model app đang dùng */
  model: string
  /** model trong biến môi trường */
  defaultModel: string
  endpoint: string
  defaultEndpoint: string
  /** API key đã che, server không bao giờ trả key đầy đủ */
  keyMask: string
  /** đang dùng cấu hình đã lưu trong admin */
  custom: boolean
}

export interface HealthService {
  endpoint: string
  keyMask: string
}

/** Các provider đã cấu hình, để hiện sẵn dòng kiểm tra. Không gọi thử nên không tốn token. */
export async function getHealthTargets(): Promise<{ providers: HealthProvider[]; services: { supabase: HealthService; r2: HealthService } }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetHealthTargets()
  return post('health.targets')
}

/** Lưu cấu hình provider, áp dụng cho cả app sau tối đa 30 giây. `apiKey` rỗng = giữ key đang dùng. */
export async function saveAiProvider(v: { provider: string; model: string; endpoint: string; apiKey: string }): Promise<{ providers: HealthProvider[] }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockSaveAiProvider(v)
  return post('ai.saveProvider', v)
}

/** Xoá cấu hình đã lưu, provider quay về biến môi trường. */
export async function resetAiProvider(provider: string): Promise<{ providers: HealthProvider[] }> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockResetAiProvider(provider)
  return post('ai.resetProvider', { provider })
}

export type HealthResult = Partial<HealthReport> & { checkedAt: string }

/**
 * Gọi thật (tốn ít token), chỉ chạy khi admin bấm nút. Bỏ trống `target` = kiểm tra hết, có thể mất tới ~30 giây;
 * `target` là 'supabase', 'r2' hoặc tên provider.
 */
export async function runHealth(target?: string): Promise<HealthResult> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockRunHealth(target)
  return post('health', target ? { target } : {})
}

export interface DbStatus {
  name: string
  /** mã vùng AWS, vd 'ap-southeast-1' */
  region: string
  /** gói máy Supabase, vd 'Nano' */
  compute: string
  checkedAt: string
  /** phần trăm 0..100; null = không đọc được */
  cpu: number | null
  ram: number | null
  disk: number | null
  connections: number | null
  maxConnections: number | null
}

/** CPU / RAM / ổ đĩa / kết nối của Postgres. Không tốn tiền; mất ~1 giây (lấy 2 mẫu CPU). */
export async function getDbStatus(): Promise<DbStatus> {
  if (import.meta.env.DEV && isAdminMock()) return (await import('./adminMock')).mockGetDbStatus()
  return post('db.metrics')
}

/** Tên tiếng Việt của action trong nhật ký */
export const AUDIT_LABEL: Record<string, string> = {
  'users.ban': 'Khoá tài khoản',
  'users.unban': 'Mở khoá tài khoản',
  'users.delete': 'Xoá tài khoản',
  'users.delete.failed': 'Xoá tài khoản thất bại',
  'quota.set': 'Đặt hạn mức AI',
  'credits.grant': 'Cộng điểm AI',
  'payments.credit': 'Cộng điểm đơn nạp (tay)',
  'quota.clear': 'Bỏ hạn mức riêng',
  'storage.set': 'Đặt dung lượng lưu trữ',
  'storage.clear': 'Bỏ dung lượng riêng',
  'settings.set': 'Đổi cài đặt (bảo trì / thông báo)',
  'security.strike': 'Tự động khoá: cố truy cập admin',
  'security.clear': 'Gỡ cờ theo dõi',
}
