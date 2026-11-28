/**
 * Admin giai đoạn 5 (Số liệu): các action của /api/admin. Xem docs/prompt-admin-stats.md.
 * Đã được gộp vào ACTIONS trong server/admin.ts; chỉ cần thêm action vào object dưới.
 * Helper dùng chung import từ './admin.js': call, audit, HttpError, str, needUser, protectTarget.
 * KHÔNG gọi các helper đó ở top-level (admin.ts và file này import vòng nhau; chỉ dùng trong `run`).
 */
import type { ActionMap } from './admin.js'
import { call } from './admin.js'
import { mapAdminFunnel, type AdminFunnelRaw } from './adminFunnel.js'
import { TOKENS_PER_POINT } from './aiQuota.js'

interface DailyStatsRaw {
  day: string
  new_users?: number
  new_docs?: number
  new_decks?: number
  new_community_exams?: number
}

interface StatsOverviewRaw {
  total_users?: number
  active_7d?: number
  active_30d?: number
  online_count?: number
  days?: DailyStatsRaw[]
}

interface PresenceRow {
  user_id: string
  last_seen: string
}

async function readStatsUser(s: Parameters<typeof call>[0], userId: string) {
  try {
    const { data: user } = await call<{
      email?: string
      user_metadata?: { display_name?: string; full_name?: string; name?: string; avatar_url?: string; picture?: string }
    }>(s, `/auth/v1/admin/users/${encodeURIComponent(userId)}`)
    const metadata = user?.user_metadata
    return {
      email: user?.email ?? '',
      name: metadata?.display_name || metadata?.full_name || metadata?.name || '',
      avatar: metadata?.avatar_url || metadata?.picture || '',
    }
  } catch {
    return { email: '', name: '', avatar: '' }
  }
}

export async function readStatsOverview(s: Parameters<typeof call>[0], days: number) {
  const { data } = await call<StatsOverviewRaw | DailyStatsRaw[]>(
    s,
    '/rest/v1/rpc/admin_stats_overview',
    {
      method: 'POST',
      body: JSON.stringify({ p_days: days }),
    },
  )

  const isArr = Array.isArray(data)
  const rawDays: DailyStatsRaw[] = isArr ? data : data?.days ?? []
  const totalUsers = Number(isArr ? (data[0] as any)?.total_users ?? 0 : data?.total_users ?? 0)
  const active7d = Number(isArr ? (data[0] as any)?.active_7d ?? 0 : data?.active_7d ?? 0)
  const active30d = Number(isArr ? (data[0] as any)?.active_30d ?? 0 : data?.active_30d ?? 0)
  const onlineCount = Number(isArr ? (data[0] as any)?.online_count ?? 0 : data?.online_count ?? 0)

  const chartDays = rawDays.map((d) => ({
    day: String(d.day),
    newUsers: Number(d.new_users ?? 0),
    newDocs: Number(d.new_docs ?? 0),
    newDecks: Number(d.new_decks ?? 0),
    newCommunityExams: Number(d.new_community_exams ?? 0),
  }))

  return {
    days,
    totalUsers,
    active7d,
    active30d,
    onlineCount,
    chartDays,
    daily: chartDays,
  }
}

interface PointsUsedGroupRaw {
  billed?: number | string | null
  in_window?: boolean
}

/** Tổng điểm AI đã dùng của tất cả người dùng (toàn thời gian và trong `days` ngày gần nhất). */
async function readPointsUsed(
  s: Parameters<typeof call>[0],
  days: number,
): Promise<{ totalPointsUsed: number; pointsUsedInPeriod: number }> {
  const now = Date.now()
  const vnToday = new Date(now + 7 * 3_600_000)
  vnToday.setUTCHours(0, 0, 0, 0)
  const periodStart = new Date(vnToday.getTime() - (days - 1) * 86_400_000 - 7 * 3_600_000).toISOString()

  const { data } = await call<PointsUsedGroupRaw[]>(s, '/rest/v1/rpc/admin_ai_margin_groups', {
    method: 'POST',
    body: JSON.stringify({
      p_since: periodStart,
      p_month_start: '1970-01-01T00:00:00.000Z',
      p_until: new Date(now).toISOString(),
    }),
  })

  let totalBilled = 0
  let periodBilled = 0
  for (const row of data ?? []) {
    const billed = Number(row?.billed ?? 0)
    if (!Number.isFinite(billed) || billed <= 0) continue
    totalBilled += billed
    if (row.in_window) periodBilled += billed
  }

  return {
    totalPointsUsed: Math.round(totalBilled / TOKENS_PER_POINT),
    pointsUsedInPeriod: Math.round(periodBilled / TOKENS_PER_POINT),
  }
}

export const STATS_ACTIONS: ActionMap = {
  /** Thống kê số liệu người dùng, tài liệu theo ngày và các tổng; days 1..90 (mặc định 7) */
  'stats.overview': {
    need: 'admin',
    run: async (ctx, b) => {
      const days = Math.min(90, Math.max(1, Math.floor(Number(b.days) || 7)))
      const [overview, points] = await Promise.all([
        readStatsOverview(ctx.s, days),
        readPointsUsed(ctx.s, days).catch(() => ({ totalPointsUsed: 0, pointsUsedInPeriod: 0 })),
      ])
      return { ...overview, ...points }
    },
  },

  'stats.funnel': {
    need: 'admin',
    run: async ({ s }, b) => {
      const days = b.days === 7 || b.days === 30 || b.days === 90 ? b.days : 0
      const { data } = await call<AdminFunnelRaw | null>(s, '/rest/v1/rpc/admin_funnel', {
        method: 'POST',
        body: JSON.stringify({ p_days: days }),
      })
      const funnel = mapAdminFunnel(data, days)
      const hot = await Promise.all(funnel.hot.map(async (row) => {
        if (!row.userId) return row
        const { email, name } = await readStatsUser(s, row.userId)
        return { ...row, email, name }
      }))
      return { ...funnel, hot }
    },
  },

  /** Số lượng và danh sách tối đa 20 người dùng đang online (có nhịp trong vòng 2 phút) */
  'stats.online': {
    need: 'admin',
    run: async (ctx) => {
      const since = new Date(Date.now() - 2 * 60_000).toISOString()
      const { data: rows, res } = await call<PresenceRow[]>(
        ctx.s,
        `/rest/v1/presence?last_seen=gte.${encodeURIComponent(since)}&order=last_seen.desc&limit=20`,
        { headers: { Prefer: 'count=exact' } },
      )

      const cr = res.headers.get('content-range')
      const total = cr ? Number(cr.split('/')[1]) || rows.length : rows.length

      const users = await Promise.all(
        (rows || []).slice(0, 20).map(async (r) => {
          const { email, name, avatar } = await readStatsUser(ctx.s, r.user_id)
          return {
            userId: r.user_id,
            email,
            name: name || email.split('@')[0] || '',
            avatar,
            lastSeen: r.last_seen,
          }
        }),
      )

      return {
        onlineCount: total,
        emails: users.map((u) => u.email).filter(Boolean),
        users,
      }
    },
  },
}
