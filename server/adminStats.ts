/**
 * Admin giai đoạn 5 (Số liệu): các action của /api/admin. Xem docs/prompt-admin-stats.md.
 * Đã được gộp vào ACTIONS trong server/admin.ts; chỉ cần thêm action vào object dưới.
 * Helper dùng chung import từ './admin.js': call, audit, HttpError, str, needUser, protectTarget.
 * KHÔNG gọi các helper đó ở top-level (admin.ts và file này import vòng nhau; chỉ dùng trong `run`).
 */
import type { ActionMap } from './admin.js'
import { call } from './admin.js'
import { mapAdminFunnel, type AdminFunnelRaw } from './adminFunnel.js'

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

export const STATS_ACTIONS: ActionMap = {
  /** Thống kê số liệu người dùng, tài liệu theo ngày và các tổng; days 1..90 (mặc định 7) */
  'stats.overview': {
    need: 'admin',
    run: async (ctx, b) => {
      return readStatsOverview(ctx.s, Math.min(90, Math.max(1, Math.floor(Number(b.days) || 7))))
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
