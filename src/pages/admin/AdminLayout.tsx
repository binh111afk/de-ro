import { Link, Route, Routes, useLocation } from 'react-router-dom'
import {
  BookOpen,
  ChartColumn,
  Cpu,
  FileText,
  History,
  LayoutDashboard,
  Shield,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { isAdminMock, type AdminMe } from '@/lib/adminApi'
import { OverviewPanel } from './OverviewPanel'
import { UsersPanel } from './UsersPanel'
import { AuditPanel } from './AuditPanel'
import { OpsPanel } from './OpsPanel'
import { ContentPanel } from './ContentPanel'
import { BankPanel } from './BankPanel'
import { StatsPanel } from './StatsPanel'

interface AdminLayoutProps {
  me: AdminMe
}

interface NavItem {
  path: string
  label: string
  icon: typeof LayoutDashboard
  exact: boolean
}

const NAV_ITEMS: NavItem[] = [
  { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { path: '/admin/nguoi-dung', label: 'Người dùng', icon: Users, exact: false },
  { path: '/admin/noi-dung', label: 'Nội dung', icon: FileText, exact: false },
  { path: '/admin/ngan-hang', label: 'Ngân hàng', icon: BookOpen, exact: false },
  { path: '/admin/so-lieu', label: 'Số liệu', icon: ChartColumn, exact: false },
  { path: '/admin/ai', label: 'AI & Server', icon: Cpu, exact: false },
  { path: '/admin/nhat-ky', label: 'Nhật ký', icon: History, exact: false },
]

export function AdminLayout({ me }: AdminLayoutProps) {
  const { pathname, search } = useLocation()
  const isMock = isAdminMock()

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-background">
      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Thanh tiêu đề quản trị trên cùng */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-[6px] bg-clay font-bold text-white shadow-soft">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[19px] font-bold tracking-tight text-ink">
                  Quản trị hệ thống
                </h1>
                {isMock ? (
                  <Badge tone="honey" className="text-[11px]">
                    Dữ liệu giả (mock)
                  </Badge>
                ) : null}
              </div>
              <p className="text-[12.5px] text-ink-3">
                Bảng điều khiển và công cụ vận hành ứng dụng
              </p>
            </div>
          </div>

          {/* Góc trên phải hiện vai trò (Badge): admin / kiểm duyệt */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-ink-3">Vai trò:</span>
            <Badge tone={me.role === 'admin' ? 'clay' : 'neutral'}>
              {me.role === 'admin' ? 'admin' : 'kiểm duyệt'}
            </Badge>
          </div>
        </header>

        {/* Bố cục 2 cột (Desktop) / Tab ngang (Mobile < 768px) */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Menu trái cố định (~220px) trên desktop, cuộn ngang trên mobile */}
          <nav
            aria-label="Menu quản trị"
            className="w-full shrink-0 md:w-[220px]"
          >
            <div className="flex flex-row gap-1.5 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === '/admin' || pathname === '/admin/'
                  : pathname.startsWith(item.path)

                return (
                  <Link
                    key={item.path}
                    to={`${item.path}${search}`}
                    className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[6px] px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                      isActive
                        ? 'bg-ink font-semibold text-white shadow-xs'
                        : 'text-ink-2 hover:bg-sunken hover:text-ink'
                    }`}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Vùng nội dung chính */}
          <main className="min-w-0 flex-1">
            <Routes>
              <Route index element={<OverviewPanel me={me} />} />
              <Route path="nguoi-dung" element={<UsersPanel me={me} />} />
              <Route path="noi-dung/*" element={<ContentPanel me={me} />} />
              <Route path="ngan-hang/*" element={<BankPanel me={me} />} />
              <Route path="so-lieu/*" element={<StatsPanel me={me} />} />
              <Route path="ai" element={<OpsPanel me={me} />} />
              <Route path="nhat-ky" element={<AuditPanel />} />
              <Route path="*" element={<OverviewPanel me={me} />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
