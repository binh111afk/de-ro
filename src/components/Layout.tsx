import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui'
import { signOut } from '@/lib/auth'
import { useSession } from '@/lib/useSession'

/**
 * Thanh nav chính — chỉ 4 mục, mỗi mục nằm trên MỘT dòng (không xuống
 * dòng như bản trước). Các route còn lại (Soạn slide, Đề của tôi, Chấm bài)
 * vẫn tồn tại, chỉ không đưa lên thanh nav — vào được từ footer/trang con.
 */
const NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/soan-de', label: 'Soạn đề' },
  { to: '/de-cong-dong', label: 'Đề cộng đồng' },
  { to: '/kho-tai-lieu', label: 'Kho tài liệu' },
]

/**
 * Logo "đề rõ" — file SVG gốc ở `public/brand/logo-de-ro.svg`
 * (mark + chữ, 194×72). Dùng thẳng file gốc để giữ nguyên nét chữ.
 */
function Logo({ className }: { className?: string }) {
  return (
    <img src="/brand/logo-de-ro.svg" alt="đề rõ" width={194} height={72} className={className} />
  )
}

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const session = useSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-500',
        scrolled
          ? 'border-b border-line/70 bg-canvas/80 backdrop-blur-xl backdrop-saturate-150'
          : 'border-b border-transparent bg-canvas',
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center gap-3 px-5 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-center" aria-label="đề rõ — trang chủ">
          <Logo className="h-9 w-auto transition-transform duration-500 group-hover:scale-105" />
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors duration-300',
                  isActive ? 'text-ink' : 'text-ink-3 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? (
                    <span className="absolute inset-x-3.5 -bottom-0.5 h-[3px] rounded-full bg-clay/70" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/soan-de" className="hidden sm:block">
            <Button variant="primary" size="sm">
              Soạn đề miễn phí
            </Button>
          </Link>

          {session ? (
            <div className="hidden items-center gap-1 md:flex">
              <Link
                to="/ho-so"
                className="flex max-w-[220px] items-center gap-2 rounded-full bg-cream py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-ink shadow-soft transition-colors hover:text-clay"
              >
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay text-[10.5px] font-bold uppercase text-white">
                  {session.user.avatar ? (
                    <img src={session.user.avatar} alt="" className="size-full object-cover" />
                  ) : (
                    (session.user.name ?? session.user.email).charAt(0)
                  )}
                </span>
                <span className="truncate">{session.user.name ?? session.user.email}</span>
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"
              >
                <LogOut className="size-3.5" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link
                to="/dang-nhap"
                className="rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-ink-3 transition-colors hover:text-ink"
              >
                Đăng nhập
              </Link>
              <Link to="/dang-ky">
                <Button variant="outline" size="sm">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-[6px] bg-cream text-ink shadow-soft lg:hidden"
            aria-label="Menu"
          >
            {menuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-line/70 bg-canvas/95 backdrop-blur-xl lg:hidden anim-slide">
          <div className="mx-auto max-w-[1180px] px-5 py-2.5 sm:px-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded-[6px] px-3 py-2.5 text-[14.5px] font-semibold',
                    isActive ? 'bg-sunken text-clay' : 'text-ink-2',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/soan-de" className="mt-2 block sm:hidden">
              <Button variant="primary" className="w-full">
                Soạn đề miễn phí
              </Button>
            </Link>
            <div className="mt-2 border-t border-line/70 pt-2 md:hidden">
              {session ? (
                <>
                  <Link to="/ho-so" className="block rounded-[6px] px-3 py-2.5 text-[14.5px] font-semibold text-ink-2">
                    Hồ sơ
                  </Link>
                  <p className="truncate px-3 py-2 text-[13.5px] text-ink-3">
                    {session.user.name ? `${session.user.name} · ${session.user.email}` : session.user.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="block w-full rounded-[6px] px-3 py-2.5 text-left text-[14.5px] font-semibold text-ink-2"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dang-nhap" className="block rounded-[6px] px-3 py-2.5 text-[14.5px] font-semibold text-ink-2">
                    Đăng nhập
                  </Link>
                  <Link to="/dang-ky" className="block rounded-[6px] px-3 py-2.5 text-[14.5px] font-semibold text-ink-2">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-24 overflow-hidden bg-[#f2f3f2]">
      {/* soft organic blob, not a hard divider */}
      <div className="pointer-events-none -mt-16 h-24 w-full">
        <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M0,64 C150,100 320,8 520,26 C720,44 860,92 1200,40 L1200,100 L0,100 Z"
            fill="#f2f3f2"
          />
        </svg>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 pb-14 pt-2 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-auto" />
          </div>
          <p className="mt-3.5 max-w-[32ch] text-[13px] leading-relaxed text-ink-3">
            Trợ lý soạn đề thi miễn phí cho giáo viên. Soạn đề, xuất Word, làm đề tương tác và
            chấm điểm tự động.
          </p>
        </div>

        <FooterCol
          title="Khám phá"
          items={[
            { label: 'Soạn đề', to: '/soan-de' },
            { label: 'Đề thi cộng đồng', to: '/de-cong-dong' },
            { label: 'Đề của tôi', to: '/de-cua-toi' },
            { label: 'Kho tài liệu', to: '/kho-tai-lieu' },
          ]}
        />
        <FooterCol
          title="Công cụ"
          items={[
            { label: 'Chấm trắc nghiệm', to: '/cham-trac-nghiem' },
            { label: 'Làm đề tương tác', to: '/de-cong-dong' },
            { label: 'Xuất Word', to: '/soan-de' },
            { label: 'In đề A4', to: '/soan-de' },
          ]}
        />
        <div>
          <p className="eyebrow mb-3.5">Liên hệ</p>
          <ul className="space-y-2.5 text-[13px] text-ink-3">
            <li>quanbinh@example.edu.vn</li>
            <li>Zalo: 0909 000 000</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-5 py-5 sm:px-6">
          <p className="text-[12px] text-ink-4">
            © 2026 đề rõ — Dữ liệu mẫu phục vụ mục đích trình diễn.
          </p>
          <p className="text-[12px] font-semibold text-ink-3">Dành cho giáo viên Việt Nam</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  items,
}: {
  title: string
  items: { label: string; to: string }[]
}) {
  return (
    <div>
      <p className="eyebrow mb-3.5">{title}</p>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              to={i.to}
              className="reveal text-[13px] font-medium text-ink-2 transition-colors hover:text-ink"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
