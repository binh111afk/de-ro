/**
 * Cài đặt app do admin đặt (bảng `app_settings`, ai cũng đọc được):
 * - `announcements`: popup thông báo ở trang chủ (AnnouncementPopup).
 * - `maintenance`: người thường thấy trang "Đang bảo trì"; admin/moderator vẫn dùng bình thường.
 *   Trang đăng nhập và /admin luôn mở để admin vào tắt bảo trì. Server cũng chặn AI/upload (server/ops.ts).
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { getMe, getSettings, isAdminMock, type AppSettings } from '@/lib/adminApi'
import { AnnouncementPopup } from '@/components/AnnouncementPopup'
import { useSession } from '@/lib/useSession'

const BASE = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

async function fetchSettings(): Promise<AppSettings | null> {
  if (isAdminMock()) return getSettings()
  if (!BASE || !KEY) return null
  const r = await fetch(`${BASE}/rest/v1/app_settings?select=key,value&key=in.(maintenance,announcements)`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!r.ok) return null
  const rows = (await r.json()) as Array<{ key: string; value: never }>
  const get = (k: string) => rows.find((x) => x.key === k)?.value
  return { maintenance: get('maintenance') ?? { on: false }, announcements: get('announcements') ?? { items: [] } }
}

const OPEN_PATHS = ['/dang-nhap', '/quen-mat-khau', '/dat-lai-mat-khau', '/admin']

export function SiteStatus({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const session = useSession()
  const [st, setSt] = useState<AppSettings | null>(null)
  const [staff, setStaff] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then(setSt)
      .catch(() => {})
  }, [])

  // chỉ hỏi quyền khi đang bảo trì và đã đăng nhập (đỡ gọi /api/admin cho mọi người)
  const maintenanceOn = !!st?.maintenance.on
  useEffect(() => {
    if (!maintenanceOn || !session) return setStaff(false)
    let alive = true
    getMe()
      .then(() => alive && setStaff(true))
      .catch(() => alive && setStaff(false))
    return () => {
      alive = false
    }
  }, [maintenanceOn, session])

  const blocked = maintenanceOn && !staff && !OPEN_PATHS.some((p) => pathname.startsWith(p))

  return (
    <>
      {maintenanceOn && staff ? (
        <div className="bg-clay px-4 py-1.5 text-center text-[12.5px] font-medium text-white">
          Đang bật chế độ bảo trì, người dùng thường không vào được.{' '}
          <Link to="/admin/ai" className="underline">
            Tắt bảo trì
          </Link>
        </div>
      ) : null}
      {pathname === '/' && !blocked && st ? <AnnouncementPopup items={st.announcements.items} /> : null}
      {blocked ? <Maintenance message={st?.maintenance.message} until={st?.maintenance.until} /> : children}
    </>
  )
}

function Maintenance({ message, until }: { message?: string; until?: string | null }) {
  const end = until ? new Date(until) : null
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-[10px] bg-sunken text-ink-2">
        <Wrench className="size-7" />
      </div>
      <h1 className="mt-6 font-display text-[28px] font-semibold tracking-[-0.01em] text-ink">Đang bảo trì</h1>
      <p className="mt-3 max-w-[460px] text-[14.5px] leading-relaxed text-ink-2">{message?.trim() || 'Ứng dụng đang được nâng cấp, vui lòng quay lại sau ít phút.'}</p>
      {end && !isNaN(end.getTime()) ? (
        <p className="mt-2 text-[13px] text-ink-3">Dự kiến xong lúc {end.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
      ) : null}
    </div>
  )
}
