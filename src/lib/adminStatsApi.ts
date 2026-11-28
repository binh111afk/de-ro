/**
 * Client trang Admin giai đoạn 5 (Số liệu). Xem docs/prompt-admin-stats.md.
 * Gọi server bằng `post(action, body, read)` từ './adminApi'; dữ liệu giả khi `isAdminMock()` (dùng `wait`).
 */
import { post, isAdminMock, wait } from './adminApi'
import type { FunnelDays, FunnelSteps } from './adminFunnel'

export interface DailyStat {
  day: string // 'YYYY-MM-DD'
  newUsers: number
  newDocs: number
  newDecks: number
  newCommunityExams: number
}

export interface StatsOverview {
  days: number
  totalUsers: number
  active7d: number
  active30d: number
  onlineCount: number
  totalPointsUsed: number
  pointsUsedInPeriod: number
  chartDays: DailyStat[]
  daily?: DailyStat[]
}

export interface OnlineUser {
  userId: string
  email: string
  /** tên hiển thị (hoặc phần trước @ của email nếu chưa đặt) */
  name?: string
  avatar?: string
  lastSeen: string
}

export interface StatsOnline {
  onlineCount: number
  emails: string[]
  users: OnlineUser[]
}

export interface StatsFunnel {
  days: FunnelDays
  steps: FunnelSteps
  weeks: Array<FunnelSteps & { week: string }>
  hot: Array<{ userId: string; email: string; name: string; calls: number; billed: number }>
}

// ---------- Dữ liệu giả ----------

function mockStatsOverview(days: number): StatsOverview {
  const chartDays: DailyStat[] = []
  const now = new Date()

  // Sinh ngày theo giờ địa phương / VN, ngày cũ bên trái, ngày mới nhất hôm nay
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const day = `${yyyy}-${mm}-${dd}`

    // Tính số liệu giả dựa trên ngày để luôn cố định nhưng có biến động
    const seed = (d.getFullYear() * 1000 + (d.getMonth() + 1) * 31 + d.getDate()) % 97
    const newUsers = (seed % 6) + (i % 4 === 0 ? 3 : 1)
    const newDocs = ((seed * 3) % 12) + 3
    const newDecks = ((seed * 2) % 5) + (i % 2 === 0 ? 1 : 0)
    const newCommunityExams = seed % 5 === 0 ? 2 : seed % 3 === 0 ? 1 : 0

    chartDays.push({
      day,
      newUsers,
      newDocs,
      newDecks,
      newCommunityExams,
    })
  }

  return {
    days,
    totalUsers: 148,
    active7d: 46,
    active30d: 92,
    onlineCount: 4,
    totalPointsUsed: 4280,
    pointsUsedInPeriod: days === 7 ? 385 : days === 30 ? 1420 : 3190,
    chartDays,
    daily: chartDays,
  }
}

function mockStatsOnline(): StatsOnline {
  const users: OnlineUser[] = [
    {
      userId: '00000000-0000-4000-8000-000000000001',
      email: 'giaovien1@example.com',
      lastSeen: new Date(Date.now() - 25_000).toISOString(),
    },
    {
      userId: '00000000-0000-4000-8000-000000000002',
      email: 'giaovien2@example.com',
      lastSeen: new Date(Date.now() - 55_000).toISOString(),
    },
    {
      userId: '00000000-0000-4000-8000-000000000005',
      email: 'giaovien5@example.com',
      lastSeen: new Date(Date.now() - 85_000).toISOString(),
    },
    {
      userId: '00000000-0000-4000-8000-000000000000',
      email: 'chu-app@example.com',
      lastSeen: new Date(Date.now() - 110_000).toISOString(),
    },
  ]
  return {
    onlineCount: users.length,
    emails: users.map((u) => u.email),
    users,
  }
}

function mockStatsFunnel(days: FunnelDays): StatsFunnel {
  const weekCount = days === 0 ? 12 : Math.min(12, Math.ceil(days / 7))
  const monday = new Date()
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7)
  const weeks = Array.from({ length: weekCount }, (_, i) => ({
    week: new Date(monday.getTime() - i * 7 * 86_400_000).toISOString().slice(0, 10),
    signedUp: 12, returned: 8, made: 5, usedAi: 4, paid: 1,
  }))
  return {
    days,
    steps: { signedUp: 12 * weekCount, returned: 8 * weekCount, made: 5 * weekCount, usedAi: 4 * weekCount, paid: weekCount },
    weeks,
    hot: [{ userId: 'mock-funnel-1', email: 'giaovien1@example.com', name: 'Giáo viên 1', calls: 18, billed: 23_000 }],
  }
}

// ---------- API ----------

/**
 * Lấy dữ liệu tổng quan số liệu theo ngày và các tổng (7, 30 hoặc 90 ngày).
 * Chuyển tab admin nhớ 60 giây (read = true).
 */
export function getStatsOverview(days: 7 | 30 | 90 = 7): Promise<StatsOverview> {
  if (isAdminMock()) return wait(mockStatsOverview(days))
  return post<StatsOverview>('stats.overview', { days }, true)
}

/**
 * Lấy số lượng và danh sách tối đa 20 email người dùng đang online (nhịp 2 phút gần nhất).
 * Luôn gọi mới để cập nhật nhịp hoạt động (read = false).
 */
export function getStatsOnline(): Promise<StatsOnline> {
  if (isAdminMock()) return wait(mockStatsOnline())
  return post<StatsOnline>('stats.online', {}, false)
}

export function getStatsFunnel(days: FunnelDays): Promise<StatsFunnel> {
  if (isAdminMock()) return wait(mockStatsFunnel(days))
  return post<StatsFunnel>('stats.funnel', { days }, true)
}
