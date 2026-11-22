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
  Wallet,
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
import { PaymentsPanel } from './PaymentsPanel'

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
  { path: '/admin/nap-diem', label: 'Nạp điểm', icon: Wallet, exact: false },
  { path: '/admin/ai', label: 'AI & Server', icon: Cpu, exact: false },
  { path: '/admin/nhat-ky', label: 'Nhật ký', icon: History, exact: false },
]

export function AdminLayout({ me }: AdminLayoutProps) {
  const { pathname, search } = useLocation()
  const isMock = isAdminMock()

  return (
    <div className="w-full max-w-full overflow-x-clip">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Thanh tiêu đề quản trị trên cùng */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[6px] bg-clay font-bold text-white shadow-soft">
              <Shield className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="whitespace-nowrap text-[17px] font-bold tracking-tight text-ink sm:text-[19px]">
                  Quản trị hệ thống
                </h1>
                {isMock ? (
                  <Badge tone="honey" className="whitespace-nowrap text-[11px]">
                    Dữ liệu giả (mock)
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Góc trên phải hiện vai trò (Badge): admin / kiểm duyệt */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[13px] text-ink-3">Vai trò:</span>
            <Badge tone={me.role === 'admin' ? 'clay' : 'neutral'}>
              {me.role === 'admin' ? 'admin' : 'kiểm duyệt'}
            </Badge>
          </div>
        </header>

        {/* Bố cục 2 cột (Desktop >= 1024px) / Tab ngang (Mobile & Tablet < 1024px) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Menu trái cố định (~220px) trên desktop, cuộn ngang trên mobile/tablet */}
          <nav
            aria-label="Menu quản trị"
            className="sticky top-[68px] z-30 w-full shrink-0 bg-canvas py-1.5 lg:top-[88px] lg:w-[220px] lg:bg-transparent lg:py-0"
          >
            <div className="flex flex-row gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">
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
            {/* App.tsx giữ nguyên khung admin; chỉ phần nội dung chạy hiệu ứng khi đổi mục */}
            <div key={pathname.split('/')[2] ?? ''} className="page-enter">
            <Routes>
              <Route index element={<OverviewPanel />} />
              <Route path="nguoi-dung" element={<UsersPanel me={me} />} />
              <Route path="noi-dung/*" element={<ContentPanel me={me} />} />
              <Route path="ngan-hang/*" element={<BankPanel me={me} />} />
              <Route path="so-lieu/*" element={<StatsPanel me={me} />} />
              <Route path="nap-diem" element={<PaymentsPanel />} />
              <Route path="ai" element={<OpsPanel me={me} />} />
              <Route path="nhat-ky" element={<AuditPanel />} />
              <Route path="*" element={<OverviewPanel />} />
            </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
