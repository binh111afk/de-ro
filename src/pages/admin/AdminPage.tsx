/**
 * /admin: hỏi server quyền của người đang đăng nhập. Không có quyền thì hiện y như đường dẫn lạ
 * (trang chủ, giống route `*`), để không lộ là có trang admin. Bảo mật thật nằm ở server/admin.ts.
 * Giao diện từng mục (AdminLayout, UsersPanel, AuditPanel…) do agent dựng theo docs/prompt-admin-ui.md.
 */
import { useEffect, useState } from 'react'
import Home from '@/pages/Home'
import { getMe, isAdminMock, type AdminMe } from '@/lib/adminApi'
import { useSession } from '@/lib/useSession'
import AdminLayout from './AdminLayout'

export default function AdminPage() {
  const session = useSession()
  const [me, setMe] = useState<AdminMe | null | 'loading'>('loading')

  useEffect(() => {
    if (!session && !isAdminMock()) return setMe(null)
    let alive = true
    getMe()
      .then((m) => alive && setMe(m))
      .catch(() => alive && setMe(null))
    return () => {
      alive = false
    }
  }, [session])

  if (me === 'loading') return <div className="flex min-h-[50vh] items-center justify-center text-[13px] text-ink-3">Đang tải…</div>
  if (!me) return <Home />
  return <AdminLayout me={me} />
}
