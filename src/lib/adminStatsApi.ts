/**
 * Client trang Admin giai đoạn 5 (Số liệu). Xem docs/prompt-admin-stats.md.
 * Gọi server bằng `post(action, body, read)` từ './adminApi'; dữ liệu giả khi `isAdminMock()` (dùng `wait`).
 */
import { post, isAdminMock, wait } from './adminApi'

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
  chartDays: DailyStat[]
  daily?: DailyStat[]
}

export interface OnlineUser {
  userId: string
  email: string
  lastSeen: string
}

export interface StatsOnline {
  onlineCount: number
  emails: string[]
  users: OnlineUser[]
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
