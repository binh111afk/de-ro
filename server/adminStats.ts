/**
 * Admin giai đoạn 5 (Số liệu): các action của /api/admin. Xem docs/prompt-admin-stats.md.
 * Đã được gộp vào ACTIONS trong server/admin.ts; chỉ cần thêm action vào object dưới.
 * Helper dùng chung import từ './admin.js': call, audit, HttpError, str, needUser, protectTarget.
 * KHÔNG gọi các helper đó ở top-level (admin.ts và file này import vòng nhau; chỉ dùng trong `run`).
 */
import type { ActionMap } from './admin.js'
import { call } from './admin.js'

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

export const STATS_ACTIONS: ActionMap = {
  /** Thống kê số liệu người dùng, tài liệu theo ngày và các tổng; days 1..90 (mặc định 7) */
  'stats.overview': {
    need: 'admin',
    run: async (ctx, b) => {
      const days = Math.min(90, Math.max(1, Math.floor(Number(b.days) || 7)))
      const { data } = await call<StatsOverviewRaw | DailyStatsRaw[]>(
        ctx.s,
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
          let email = ''
          try {
            const { data: u } = await call<{ id: string; email?: string }>(
              ctx.s,
              `/auth/v1/admin/users/${r.user_id}`,
            )
            email = u?.email ?? ''
          } catch {
            // bỏ qua lỗi nếu không đọc được user
          }
          return {
            userId: r.user_id,
            email,
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
