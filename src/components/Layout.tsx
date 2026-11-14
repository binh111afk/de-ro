import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LogOut, Menu, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAnimatedPresence } from '@/lib/useAnimatedPresence'
import { Button, inputClass } from '@/components/ui'
import { signOut } from '@/lib/auth'
import { useSession } from '@/lib/useSession'
import { submitFeedback } from '@/lib/community'
import { dialog } from '@/components/Dialog'

/**
 * Thanh nav chính — chỉ 4 mục, mỗi mục nằm trên MỘT dòng (không xuống
 * dòng như bản trước). Các route còn lại (Soạn slide, Đề của tôi, Chấm bài)
 * vẫn tồn tại, chỉ không đưa lên thanh nav — vào được từ footer/trang con.
 */
const NAV = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/soan-de', label: 'Soạn đề' },
  { to: '/tao-de-online', label: 'Tạo đề online' },
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
  const menuAnim = useAnimatedPresence(menuOpen, 140)
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
          <Link to="/soan-de" className="hidden xl:block">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
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
                className="whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-ink-3 transition-colors hover:text-ink"
              >
                Đăng nhập
              </Link>
              <Link to="/dang-ky">
                <Button variant="outline" size="sm" className="whitespace-nowrap">
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

      {menuAnim.mounted ? (
        <div className={cn('border-t border-line/70 bg-canvas/95 backdrop-blur-xl lg:hidden', menuAnim.closing ? 'slide-out-up' : 'anim-slide')}>
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
  const session = useSession()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleOpenFeedback = () => {
    if (session?.user.email) setEmail(session.user.email)
    setFeedbackOpen(true)
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    try {
      await submitFeedback({
        message,
        email: email || undefined,
        page: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
      })
      setFeedbackOpen(false)
      setMessage('')
      void dialog.alert('Cảm ơn bạn đã gửi góp ý! Chúng tôi sẽ tiếp thu và hoàn thiện hơn.', {
        title: 'Đã gửi góp ý',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không gửi được góp ý, thử lại sau.'
      void dialog.alert(msg, { title: 'Lỗi gửi góp ý' })
    } finally {
      setSending(false)
    }
  }

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
            <li>
              <button
                type="button"
                onClick={handleOpenFeedback}
                className="reveal inline-flex items-center gap-1.5 font-medium text-clay hover:underline"
              >
                <MessageSquare className="size-3.5" />
                <span>Gửi góp ý</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-5 py-5 sm:px-6">
          <p className="text-[12px] text-ink-4">
            © 2026 đề rõ — Dữ liệu mẫu phục vụ mục đích trình diễn.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleOpenFeedback}
              className="text-[12px] font-medium text-ink-3 hover:text-ink hover:underline"
            >
              Hòm thư góp ý
            </button>
            <p className="text-[12px] font-semibold text-ink-3">Dành cho giáo viên Việt Nam</p>
          </div>
        </div>
      </div>

      {feedbackOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-[10px] border border-line bg-surface p-6 shadow-float anim-sheet"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-clay" />
                <h3 className="font-display text-[16px] font-bold text-ink">Góp ý cho Đề Rõ</h3>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-full p-1 text-ink-3 hover:bg-sunken hover:text-ink"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-4 text-[13.5px]">
              <div>
                <label className="mb-1 block font-medium text-ink-2">
                  Email của bạn <span className="font-normal text-ink-4">(tùy chọn)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`${inputClass} w-full text-[13.5px]`}
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-ink-2">
                  Nội dung góp ý <span className="text-clay">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Chia sẻ nhận xét, báo lỗi hoặc tính năng bạn mong muốn..."
                  className={`${inputClass} w-full resize-none py-2 text-[13.5px]`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFeedbackOpen(false)} disabled={sending}>
                  Huỷ
                </Button>
                <Button type="submit" variant="clay" size="sm" disabled={sending}>
                  {sending ? 'Đang gửi…' : 'Gửi góp ý'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
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
