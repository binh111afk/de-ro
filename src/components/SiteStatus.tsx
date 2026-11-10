/**
 * Cài đặt app do admin đặt (bảng `app_settings`, ai cũng đọc được):
 * - `banner`: dải thông báo trên cùng, người xem đóng được (nhớ theo nội dung).
 * - `maintenance`: người thường thấy trang "Đang bảo trì"; admin/moderator vẫn dùng bình thường.
 *   Trang đăng nhập và /admin luôn mở để admin vào tắt bảo trì. Server cũng chặn AI/upload (server/ops.ts).
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Info, TriangleAlert, Wrench, X } from 'lucide-react'
import { getMe, type AppSettings } from '@/lib/adminApi'
import { useSession } from '@/lib/useSession'
import { cn } from '@/lib/cn'

const BASE = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

async function fetchSettings(): Promise<AppSettings | null> {
  if (!BASE || !KEY) return null
  const r = await fetch(`${BASE}/rest/v1/app_settings?select=key,value&key=in.(maintenance,banner)`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!r.ok) return null
  const rows = (await r.json()) as Array<{ key: string; value: never }>
  const get = (k: string) => rows.find((x) => x.key === k)?.value ?? { on: false }
  return { maintenance: get('maintenance'), banner: get('banner') }
}

const OPEN_PATHS = ['/dang-nhap', '/quen-mat-khau', '/dat-lai-mat-khau', '/admin']
const DISMISS_KEY = 'banner-dismissed'

export function SiteStatus({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const session = useSession()
  const [st, setSt] = useState<AppSettings | null>(null)
  const [staff, setStaff] = useState(false)
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY)
    } catch {
      return null
    }
  })

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

  const banner = st?.banner
  const bannerText = banner?.on ? banner.text?.trim() : ''
  const showBanner = !!bannerText && dismissed !== bannerText
  const dismiss = () => {
    setDismissed(bannerText ?? null)
    try {
      localStorage.setItem(DISMISS_KEY, bannerText ?? '')
    } catch {
      /* bỏ qua */
    }
  }

  const blocked = maintenanceOn && !staff && !OPEN_PATHS.some((p) => pathname.startsWith(p))

  return (
    <>
      {showBanner ? (
        <div
          role="status"
          className={cn(
            'flex items-start gap-2.5 px-4 py-2.5 text-[13px] sm:items-center sm:justify-center',
            banner?.level === 'warn' ? 'bg-honey-soft text-ink' : 'bg-sunken text-ink-2',
          )}
        >
          {banner?.level === 'warn' ? <TriangleAlert className="mt-0.5 size-4 shrink-0 sm:mt-0" /> : <Info className="mt-0.5 size-4 shrink-0 sm:mt-0" />}
          <span className="min-w-0 flex-1 sm:flex-none">{bannerText}</span>
          <button type="button" onClick={dismiss} aria-label="Đóng thông báo" className="shrink-0 rounded p-0.5 text-ink-3 hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {maintenanceOn && staff ? (
        <div className="bg-clay px-4 py-1.5 text-center text-[12.5px] font-medium text-white">
          Đang bật chế độ bảo trì, người dùng thường không vào được.{' '}
          <Link to="/admin/ai" className="underline">
            Tắt bảo trì
          </Link>
        </div>
      ) : null}
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
