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
  /** URL ảnh đại diện; null = chưa đặt */
  avatar: string | null
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

// ---------- dữ liệu giả ----------
const MOCK_USERS: AdminUser[] = Array.from({ length: 57 }, (_, i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  email: i === 0 ? 'chu-app@example.com' : `giaovien${i}@example.com`,
  name: i === 0 ? 'Chủ app' : `Giáo viên ${i}`,
  avatar: i % 3 === 1 ? `https://i.pravatar.cc/96?img=${i % 70}` : null,
  createdAt: new Date(Date.UTC(2026, 9, 1 + (i % 40))).toISOString(),
  lastSignInAt: i % 5 === 4 ? null : new Date(Date.UTC(2026, 10, 1 + (i % 9))).toISOString(),
  bannedUntil: i === 7 ? '2126-01-01T00:00:00Z' : null,
  role: i === 0 ? 'admin' : i === 1 ? 'moderator' : null,
  docs: (i * 7) % 23,
  decks: (i * 3) % 6,
  tokensThisMonth: (i * 13_337) % 160_000,
  flag: i === 7 ? { strikes: 2, lastAt: '2026-11-09T08:12:00Z', lastAction: 'users.list', lastIp: '203.0.113.7' } : i === 12 ? { strikes: 1, lastAt: '2026-11-08T03:40:00Z', lastAction: 'quota.set', lastIp: '198.51.100.4' } : null,
}))
const MOCK_AUDIT: AuditEntry[] = [
  { id: 3, adminId: MOCK_USERS[0].id, action: 'users.ban', target: MOCK_USERS[7].id, detail: { reason: 'Đăng đề rác' }, createdAt: '2026-11-09T08:12:00Z' },
  { id: 2, adminId: MOCK_USERS[0].id, action: 'quota.set', target: MOCK_USERS[3].id, detail: { monthlyTokens: 500000 }, createdAt: '2026-11-08T15:40:00Z' },
  { id: 1, adminId: MOCK_USERS[0].id, action: 'users.unban', target: MOCK_USERS[9].id, detail: {}, createdAt: '2026-11-05T10:02:00Z' },
]
/** Dữ liệu giả trả sau 250ms (giống mạng thật) */
export const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 250))

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

/** Gỡ cờ theo dõi (xoá số lần vi phạm). Không tự mở khoá tài khoản. */
export function clearSecurityFlag(userId: string): Promise<{ ok: true }> {
  if (isAdminMock()) {
    const u = MOCK_USERS.find((x) => x.id === userId)
    if (u) u.flag = null
    return wait({ ok: true as const })
  }
  return post('security.clear', { userId })
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

export function getStorage(userId: string): Promise<UserStorage> {
  if (isAdminMock()) return wait({ override: null, defaultBytes: 10 * 1024 * 1024, used: 3_400_000 })
  return post('storage.get', { userId })
}

/** maxBytes null = về mặc định 10 MB */
export function setStorage(userId: string, maxBytes: number | null, note = ''): Promise<{ ok: true }> {
  if (isAdminMock()) return wait({ ok: true as const })
  return post('storage.set', { userId, maxBytes, note })
}

export function listAudit(opts: { page?: number; perPage?: number } = {}): Promise<{ items: AuditEntry[]; total: number; page: number; perPage: number }> {
  if (isAdminMock()) return wait({ items: MOCK_AUDIT, total: MOCK_AUDIT.length, page: 1, perPage: 30 })
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

const mockImage = (color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="${color}"/></svg>`)}`
const mockSettings: AppSettings = {
  maintenance: { on: false, message: '' },
  announcements: {
    items: [
      { id: 'mock-1', on: true, title: 'Xáo đề giữ nguyên đáp án', text: 'Tạo nhiều mã đề từ một đề gốc chỉ với một lần bấm.', image: mockImage('#c9805f'), tryPath: '/soan-de', until: null },
      { id: 'mock-2', on: true, title: 'Bảo trì cuối tuần', text: 'Tối Chủ nhật hệ thống nâng cấp khoảng 15 phút.\nBạn nhớ lưu đề trước giờ đó nhé.', image: '', tryPath: '', until: null },
      { id: 'mock-3', on: true, title: '', text: '', image: mockImage('#8a9a7b'), tryPath: '', until: null },
    ],
  },
}

export function getSettings(): Promise<AppSettings> {
  if (isAdminMock()) return wait(mockSettings)
  return post('settings.get')
}

export function setMaintenance(v: MaintenanceSetting): Promise<{ ok: true }> {
  if (isAdminMock()) {
    mockSettings.maintenance = v
    return wait({ ok: true as const })
  }
  return post('settings.set', { key: 'maintenance', value: v })
}

/** AI đọc ảnh trang đề (1-4 ảnh JPEG), trả JSON câu hỏi dạng chuỗi. Chỉ admin. */
export async function bankVision(images: string[]): Promise<{ content: string; model: string }> {
  if (isAdminMock()) {
    await new Promise((r) => setTimeout(r, 300))
    return {
      model: 'mock',
      content: JSON.stringify({
        questions: [
          { number: 1, type: 'trac-nghiem', prompt: 'Câu đọc từ trang đề, có hình.', options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: 'Phương án ' + key })), answer: '', figure: { page: 1, box: [100, 100, 600, 400] } },
          { number: 2, type: 'tra-loi-ngan', prompt: 'Câu chưa có đáp án trong đề.', answer: '' },
        ],
        answerKey: { '1': 'C' },
      }),
    }
  }
  const res = await apiFetch('/api/admin?vision=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ images }) })
  const data = (await res.json().catch(() => ({}))) as { content?: string; model?: string; error?: string }
  if (!res.ok || !data.content) throw new Error(data.error ?? 'Không đọc được ảnh đề.')
  return { content: data.content, model: data.model ?? '' }
}

export function setAnnouncements(items: Announcement[]): Promise<{ ok: true }> {
  if (isAdminMock()) {
    mockSettings.announcements = { items }
    return wait({ ok: true as const })
  }
  return post('settings.set', { key: 'announcements', value: { items } })
}

export function getAiStats(days = 7): Promise<{ days: number; rows: AiStatRow[] }> {
  if (isAdminMock()) {
    const models = [
      ['gpt-5.5', 'opencode', 0.012],
      ['mercury-3', 'mercury', null],
      ['claude-opus-5-5', 'anthropic', null],
    ] as const
    const rows: AiStatRow[] = []
    for (let d = 0; d < days; d++) {
      const day = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)
      models.forEach(([model, provider, unit], i) => {
        const calls = ((d * 7 + i * 13) % 40) + (i === 0 ? 30 : 2)
        rows.push({ day, model, provider, calls, errors: (d + i) % 4, tokens: calls * 6200, cost: unit == null ? null : +(calls * unit).toFixed(4), avgMs: 4000 + i * 3500 + d * 120 })
      })
    }
    return wait({ days, rows })
  }
  return post('ai.stats', { days })
}

export function getAiErrors(limit = 30): Promise<{ items: AiErrorRow[] }> {
  if (isAdminMock())
    return wait({
      items: [
        { id: 2, userId: MOCK_USERS[3].id, model: 'gpt-5.5', provider: 'opencode', error: 'gpt-5.5: upstream 503', ms: 12040, createdAt: '2026-11-10T09:12:00Z' },
        { id: 1, userId: null, model: 'mercury-3', provider: 'mercury', error: 'mercury-3: quá thời gian chờ 280s', ms: 280000, createdAt: '2026-11-09T14:30:00Z' },
      ].slice(0, limit),
    })
  return post('ai.errors', { limit })
}

const MOCK_HEALTH: Omit<HealthReport, 'checkedAt'> = {
  supabase: { ok: true, ms: 84 },
  r2: { ok: true, ms: 212 },
  providers: [
    { provider: 'opencode', model: 'gpt-5.5', ok: true, ms: 2310 },
    { provider: 'mercury', model: 'mercury-3', ok: true, ms: 640 },
    { provider: 'nightrouter', model: 'deepseek-v4-flash-0731', ok: false, ms: 30000, error: 'HTTP 502' },
  ],
}

const MOCK_DEFAULT_MODELS = Object.fromEntries(MOCK_HEALTH.providers.map((p) => [p.provider, p.model]))
const mockEndpoint = (provider: string) => `https://api.${provider}.example/v1`
const mockEndpoints: Record<string, string> = {}
const mockProviders = (): HealthProvider[] =>
  MOCK_HEALTH.providers.map(({ provider, model }) => {
    const defaultEndpoint = mockEndpoint(provider)
    const endpoint = mockEndpoints[provider] ?? defaultEndpoint
    const defaultModel = MOCK_DEFAULT_MODELS[provider]
    return { provider, model, defaultModel, endpoint, defaultEndpoint, keyMask: '••••a1b2', custom: model !== defaultModel || endpoint !== defaultEndpoint }
  })

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
export function getHealthTargets(): Promise<{ providers: HealthProvider[]; services: { supabase: HealthService; r2: HealthService } }> {
  if (isAdminMock())
    return wait({
      providers: mockProviders(),
      services: { supabase: { endpoint: 'https://mock.supabase.co', keyMask: '••••9f3c' }, r2: { endpoint: 'https://mock.r2.cloudflarestorage.com/de-ro', keyMask: '••••77de' } },
    })
  return post('health.targets')
}

/** Lưu cấu hình provider, áp dụng cho cả app sau tối đa 30 giây. `apiKey` rỗng = giữ key đang dùng. */
export function saveAiProvider(v: { provider: string; model: string; endpoint: string; apiKey: string }): Promise<{ providers: HealthProvider[] }> {
  if (isAdminMock()) {
    const p = MOCK_HEALTH.providers.find((x) => x.provider === v.provider)
    if (p) p.model = v.model.trim() || MOCK_DEFAULT_MODELS[v.provider]
    mockEndpoints[v.provider] = v.endpoint.trim().replace(/\/+$/, '') || mockEndpoint(v.provider)
    return wait({ providers: mockProviders() })
  }
  return post('ai.saveProvider', v)
}

/** Xoá cấu hình đã lưu, provider quay về biến môi trường. */
export function resetAiProvider(provider: string): Promise<{ providers: HealthProvider[] }> {
  if (isAdminMock()) {
    const p = MOCK_HEALTH.providers.find((x) => x.provider === provider)
    if (p) p.model = MOCK_DEFAULT_MODELS[provider]
    delete mockEndpoints[provider]
    return wait({ providers: mockProviders() })
  }
  return post('ai.resetProvider', { provider })
}

export type HealthResult = Partial<HealthReport> & { checkedAt: string }

/**
 * Gọi thật (tốn ít token), chỉ chạy khi admin bấm nút. Bỏ trống `target` = kiểm tra hết, có thể mất tới ~30 giây;
 * `target` là 'supabase', 'r2' hoặc tên provider.
 */
export function runHealth(target?: string): Promise<HealthResult> {
  if (isAdminMock()) {
    const checkedAt = new Date().toISOString()
    const result: HealthResult =
      target === 'supabase' ? { checkedAt, supabase: MOCK_HEALTH.supabase }
      : target === 'r2' ? { checkedAt, r2: MOCK_HEALTH.r2 }
      : target ? { checkedAt, providers: MOCK_HEALTH.providers.filter((p) => p.provider === target) }
      : { checkedAt, ...MOCK_HEALTH }
    return new Promise((r) => setTimeout(() => r(result), target ? 600 : 1200))
  }
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
export function getDbStatus(): Promise<DbStatus> {
  if (isAdminMock())
    return wait({ name: 'Primary Database', region: 'ap-southeast-1', compute: 'Nano', checkedAt: new Date().toISOString(), cpu: 3, ram: 61, disk: 14, connections: 11, maxConnections: 60 })
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
  'quota.clear': 'Bỏ hạn mức riêng',
  'storage.set': 'Đặt dung lượng lưu trữ',
  'storage.clear': 'Bỏ dung lượng riêng',
  'settings.set': 'Đổi cài đặt (bảo trì / thông báo)',
  'security.strike': 'Tự động khoá: cố truy cập admin',
  'security.clear': 'Gỡ cờ theo dõi',
}
