/**
 * Dữ liệu giả (mock) cho `src/lib/adminApi.ts` — chỉ được dynamic-import khi `import.meta.env.DEV`.
 * Bản build production không nạp file này.
 */
import type { PricingConfig } from './pricing'
import {
  AdminError,
  wait,
  type AdminMe,
  type AdminUser,
  type AiErrorRow,
  type AiStatRow,
  type Announcement,
  type AppSettings,
  type AuditEntry,
  type DbStatus,
  type HealthProvider,
  type HealthReport,
  type HealthResult,
  type HealthService,
  type MaintenanceSetting,
  type UserPage,
  type UserQuota,
  type UserStorage,
} from './adminApi'

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
  flag:
    i === 7
      ? { strikes: 2, lastAt: '2026-11-09T08:12:00Z', lastAction: 'users.list', lastIp: '203.0.113.7' }
      : i === 12
        ? { strikes: 1, lastAt: '2026-11-08T03:40:00Z', lastAction: 'quota.set', lastIp: '198.51.100.4' }
        : null,
}))

const MOCK_AUDIT: AuditEntry[] = [
  { id: 3, adminId: MOCK_USERS[0].id, action: 'users.ban', target: MOCK_USERS[7].id, detail: { reason: 'Đăng đề rác' }, createdAt: '2026-11-09T08:12:00Z' },
  { id: 2, adminId: MOCK_USERS[0].id, action: 'quota.set', target: MOCK_USERS[3].id, detail: { monthlyTokens: 500000 }, createdAt: '2026-11-08T15:40:00Z' },
  { id: 1, adminId: MOCK_USERS[0].id, action: 'users.unban', target: MOCK_USERS[9].id, detail: {}, createdAt: '2026-11-05T10:02:00Z' },
]

const mockCredits = new Map<string, number>()

const mockImage = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="960" height="540" fill="${color}"/></svg>`)}`

const mockSettings: AppSettings = {
  maintenance: { on: false, message: '' },
  pricing: null,
  aiWelcome: null,
  announcements: {
    items: [
      { id: 'mock-1', on: true, title: 'Xáo đề giữ nguyên đáp án', text: 'Tạo nhiều mã đề từ một đề gốc chỉ với một lần bấm.', image: mockImage('#c9805f'), tryPath: '/soan-de', until: null },
      { id: 'mock-2', on: true, title: 'Bảo trì cuối tuần', text: 'Tối Chủ nhật hệ thống nâng cấp khoảng 15 phút.\nBạn nhớ lưu đề trước giờ đó nhé.', image: '', tryPath: '', until: null },
      { id: 'mock-3', on: true, title: '', text: '', image: mockImage('#8a9a7b'), tryPath: '', until: null },
    ],
  },
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

export function mockGetMe(): Promise<AdminMe> {
  return wait({ userId: MOCK_USERS[0].id, role: 'admin' as const })
}

export function mockListUsers(opts: { q?: string; page?: number; perPage?: number } = {}): Promise<UserPage> {
  const q = (opts.q ?? '').toLowerCase()
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 20
  const all = MOCK_USERS.filter((u) => !q || u.email.includes(q) || u.name.toLowerCase().includes(q))
  return wait({ users: all.slice((page - 1) * perPage, page * perPage), total: all.length, page, perPage })
}

export function mockBanUser(userId: string, opts: { reason?: string; hours?: number } = {}): Promise<{ ok: true }> {
  const u = MOCK_USERS.find((x) => x.id === userId)
  if (u) u.bannedUntil = new Date(Date.now() + (opts.hours ? opts.hours * 3600e3 : 100 * 365 * 864e5)).toISOString()
  return wait({ ok: true as const })
}

export function mockUnbanUser(userId: string): Promise<{ ok: true }> {
  const u = MOCK_USERS.find((x) => x.id === userId)
  if (u) u.bannedUntil = null
  return wait({ ok: true as const })
}

export function mockClearSecurityFlag(userId: string): Promise<{ ok: true }> {
  const u = MOCK_USERS.find((x) => x.id === userId)
  if (u) u.flag = null
  return wait({ ok: true as const })
}

export function mockDeleteUser(userId: string, confirmEmail: string): Promise<{ ok: true; filesRemoved: number }> {
  const i = MOCK_USERS.findIndex((x) => x.id === userId)
  if (i < 0 || MOCK_USERS[i].email !== confirmEmail.trim().toLowerCase()) return Promise.reject(new AdminError(400, 'Email xác nhận không khớp.'))
  MOCK_USERS.splice(i, 1)
  return wait({ ok: true as const, filesRemoved: 0 })
}

export function mockGetQuota(userId: string): Promise<UserQuota> {
  const u = MOCK_USERS.find((x) => x.id === userId)
  return wait({ override: null, defaultLimit: 150_000, usedThisMonth: u?.tokensThisMonth ?? 0, requestsThisMonth: 12, credits: mockCredits.get(userId) ?? 0, emptyDay: 2, freeEmpty: 3 })
}

export function mockGrantCredits(userId: string, tokens: number): Promise<{ ok: true; balance: number }> {
  const balance = (mockCredits.get(userId) ?? 0) + Math.floor(tokens)
  mockCredits.set(userId, balance)
  return wait({ ok: true as const, balance })
}

export function mockGetStorage(): Promise<UserStorage> {
  return wait({ override: null, defaultBytes: 10 * 1024 * 1024, used: 3_400_000 })
}

export function mockListAudit(): Promise<{ items: AuditEntry[]; total: number; page: number; perPage: number }> {
  return wait({ items: MOCK_AUDIT, total: MOCK_AUDIT.length, page: 1, perPage: 30 })
}

export function mockGetSettings(): Promise<AppSettings> {
  return wait(mockSettings)
}

export function mockSetMaintenance(v: MaintenanceSetting): Promise<{ ok: true }> {
  mockSettings.maintenance = v
  return wait({ ok: true as const })
}

export async function mockBankVision(): Promise<{ content: string; model: string }> {
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

export function mockSetAnnouncements(items: Announcement[]): Promise<{ ok: true }> {
  mockSettings.announcements = { items }
  return wait({ ok: true as const })
}

export function mockSetPricing(v: PricingConfig): PricingConfig {
  mockSettings.pricing = v
  return v
}

export function mockGetAiStats(days = 7): Promise<{ days: number; rows: AiStatRow[] }> {
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

export function mockGetAiErrors(limit = 30): Promise<{ items: AiErrorRow[]; freeEmpty: number }> {
  const now = Date.now()
  const items: AiErrorRow[] = [
    { id: 3, userId: MOCK_USERS[3].id, userName: MOCK_USERS[3].name, userEmail: MOCK_USERS[3].email, emptyDay: 3, model: 'gpt-5.5', provider: 'opencode', error: 'gpt-5.5: empty content', ms: 12040, createdAt: new Date(now - 60_000).toISOString() },
    { id: 2, userId: MOCK_USERS[4].id, userEmail: MOCK_USERS[4].email, emptyDay: 1, model: 'deepseek-flash', provider: 'deepseek', error: 'deepseek-flash: empty content', ms: 9200, createdAt: new Date(now - 120_000).toISOString() },
    { id: 1, userId: null, model: 'mercury-3', provider: 'mercury', error: 'mercury-3: quá thời gian chờ 280s', ms: 280000, createdAt: new Date(now - 180_000).toISOString() },
  ]
  return wait({ items: items.slice(0, limit), freeEmpty: 3 })
}

export function mockGetHealthTargets(): Promise<{ providers: HealthProvider[]; services: { supabase: HealthService; r2: HealthService } }> {
  return wait({
    providers: mockProviders(),
    services: {
      supabase: { endpoint: 'https://mock.supabase.co', keyMask: '••••9f3c' },
      r2: { endpoint: 'https://mock.r2.cloudflarestorage.com/de-ro', keyMask: '••••77de' },
    },
  })
}

export function mockSaveAiProvider(v: { provider: string; model: string; endpoint: string; apiKey: string }): Promise<{ providers: HealthProvider[] }> {
  const p = MOCK_HEALTH.providers.find((x) => x.provider === v.provider)
  if (p) p.model = v.model.trim() || MOCK_DEFAULT_MODELS[v.provider]
  mockEndpoints[v.provider] = v.endpoint.trim().replace(/\/+$/, '') || mockEndpoint(v.provider)
  return wait({ providers: mockProviders() })
}

export function mockResetAiProvider(provider: string): Promise<{ providers: HealthProvider[] }> {
  const p = MOCK_HEALTH.providers.find((x) => x.provider === provider)
  if (p) p.model = MOCK_DEFAULT_MODELS[provider]
  delete mockEndpoints[provider]
  return wait({ providers: mockProviders() })
}

export function mockRunHealth(target?: string): Promise<HealthResult> {
  const checkedAt = new Date().toISOString()
  const result: HealthResult =
    target === 'supabase'
      ? { checkedAt, supabase: MOCK_HEALTH.supabase }
      : target === 'r2'
        ? { checkedAt, r2: MOCK_HEALTH.r2 }
        : target
          ? { checkedAt, providers: MOCK_HEALTH.providers.filter((p) => p.provider === target) }
          : { checkedAt, ...MOCK_HEALTH }
  return new Promise((r) => setTimeout(() => r(result), target ? 600 : 1200))
}

export function mockGetDbStatus(): Promise<DbStatus> {
  return wait({ name: 'Primary Database', region: 'ap-southeast-1', compute: 'Nano', checkedAt: new Date().toISOString(), cpu: 3, ram: 61, disk: 14, connections: 11, maxConnections: 60 })
}
