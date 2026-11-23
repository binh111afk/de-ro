import { createHash, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { getUser, readAdminAiStats, readAdminQuota, readAdminUsers, readAdminUserStats, type Supa } from './admin.js'
import { readMuseFeedback } from './adminAiFeedback.js'
import { readStatsOverview } from './adminStats.js'
import { TOKENS_PER_POINT } from './aiQuota.js'
import { rateLimitOnly } from './guard.js'
import { json, safeError, supabaseServiceConfig } from './http.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const hash = (value: string) => createHash('sha256').update(value).digest()

export function isMuseStatsRequest(req: IncomingMessage): boolean {
  // Connect/Vite cắt tiền tố mount khỏi req.url; originalUrl giữ đường dẫn đầy đủ.
  const { pathname, searchParams } = new URL(
    (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? '/',
    'http://localhost',
  )
  const path = pathname.replace(/\/$/, '')
  return path === '/api/admin/muse-stats' || path === '/api/muse-stats'
    || (path === '/api/admin' && searchParams.get('muse-stats') === '1')
}

async function findWatchUser(s: Supa, identifier: string): Promise<string | undefined> {
  const key = identifier.toLowerCase()
  if (UUID.test(key)) return (await getUser(s, key))?.id

  const perPage = 100
  let match: string | undefined
  for (let page = 1; ; page++) {
    const { users } = await readAdminUsers(s, page, perPage, key)
    for (const user of users) {
      const email = user.email?.toLowerCase()
      if (!email || (key.includes('@') ? email !== key : email.split('@')[0] !== key)) continue
      if (match && match !== user.id) return undefined
      match = user.id
    }
    if (users.length < perPage) return match
  }
}

async function readWatchlist(s: Supa) {
  const identifiers = [...new Set((process.env.MUSE_WATCHLIST ?? '').split(',').map((entry) => entry.trim()).filter(Boolean))]
  const ids = await Promise.all(identifiers.map((entry) => findWatchUser(s, entry).catch(() => undefined)))
  const uniqueIds = [...new Set(ids.filter((id): id is string => typeof id === 'string' && UUID.test(id)))]
  const [stats, quotas] = await Promise.all([
    uniqueIds.length ? readAdminUserStats(s, uniqueIds).catch(() => []) : [],
    Promise.all(uniqueIds.map(async (id) => [id, await readAdminQuota(s, id).catch(() => null)] as const)),
  ])
  const byId = new Map(stats?.map((row) => [row.user_id, row]))
  const quotaById = new Map(quotas)
  return identifiers.map((email, i) => {
    const id = ids[i] ?? ''
    const counts = byId.get(id)
    const quota = quotaById.get(id)
    const limit = quota?.override ? quota.override.monthlyTokens : quota?.defaultLimit
    const pointsLeft = quota && limit != null
      ? Math.max(0, Math.floor((limit + quota.credits - quota.usedThisMonth) / TOKENS_PER_POINT))
      : null
    return { email, points_left: pointsLeft, exams: Number(counts?.docs ?? 0), slides: Number(counts?.decks ?? 0) }
  })
}

async function summarizeAi(s: Supa, days: 7 | 30) {
  const stats = await readAdminAiStats(s, days).catch(() => null)
  const rows = stats?.rows ?? []
  const calls = rows.reduce((sum, row) => sum + row.calls, 0)
  const errors = rows.reduce((sum, row) => sum + row.errors, 0)
  const tokens = rows.reduce((sum, row) => sum + row.tokens, 0)
  const cost = rows.reduce((sum, row) => sum + (row.cost ?? 0), 0)
  return { calls, tokens, cost, errorPct: calls ? Number(((100 * errors) / calls).toFixed(1)) : 0 }
}

async function readMuseStats(s: Supa) {
  const checkedAt = new Date(Date.now() + 7 * 3600_000).toISOString().replace(/\.\d{3}Z$/, '+07:00')
  const [overview, month, week, feedback, watchlist] = await Promise.all([
    readStatsOverview(s, 7).catch(() => null),
    summarizeAi(s, 30),
    summarizeAi(s, 7),
    readMuseFeedback(s),
    readWatchlist(s),
  ])
  const days = overview?.chartDays ?? []
  const today = days.find((day) => day.day === checkedAt.slice(0, 10))
  return {
    checked_at: checkedAt,
    users: {
      total: overview?.totalUsers ?? 0,
      new_today: today?.newUsers ?? 0,
      new_7d: days.reduce((sum, day) => sum + day.newUsers, 0),
      online_now: overview?.onlineCount ?? 0,
    },
    content: {
      exams_7d: days.reduce((sum, day) => sum + day.newDocs, 0),
      slides_7d: days.reduce((sum, day) => sum + day.newDecks, 0),
      exams_today: today?.newDocs ?? 0,
      slides_today: today?.newDecks ?? 0,
    },
    ai: {
      cost_30d_usd: month.cost, calls_30d: month.calls, tokens_30d: month.tokens, error_30d_pct: month.errorPct,
      cost_7d_usd: week.cost, calls_7d: week.calls, tokens_7d: week.tokens, error_7d_pct: week.errorPct,
    },
    feedback,
    watchlist,
    retention: { since: '2026-11-22', returning_pct: null },
  }
}

export async function handleMuseStats(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return json(res, 405, { error: 'Method not allowed' })
  }
  // chặn dò token: tối đa 20 lượt / 10 phút / IP trước khi kiểm token (lượt hợp lệ còn bị giới hạn 1/phút bên dưới)
  if (!rateLimitOnly(req, res, 'muse-auth', 20, { windowMs: 600_000, enforceLocal: true })) return
  const secret = process.env.MUSE_STATS_TOKEN?.trim()
  const token = req.headers['x-muse-token']
  if (!secret || typeof token !== 'string' || !timingSafeEqual(hash(token), hash(secret))) {
    return json(res, 401, { error: 'Unauthorized' })
  }
  if (!rateLimitOnly(req, res, 'muse-stats', 1, { windowMs: 60_000, enforceLocal: true })) return

  try {
    const s = supabaseServiceConfig()
    if (!s) throw new Error('Thiếu cấu hình đọc thống kê Muse.')
    return json(res, 200, await readMuseStats(s))
  } catch (err) {
    // json() ghi api_errors cho các mã 5xx khác 503.
    return json(res, 503, { error: safeError(err) })
  }
}
