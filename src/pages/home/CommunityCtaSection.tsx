import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, FolderOpen, Globe } from 'lucide-react'
import { useReveal } from './reveal'

const LIBRARY_ROUTES = [
  {
    to: '/de-cong-dong',
    icon: Globe,
    label: 'Đề cộng đồng',
    badge: '1.798 câu hỏi',
    desc: 'Đề giáo viên khác chia sẻ. Lấy về một bản rồi sửa cho lớp mình.',
    cta: 'Xem đề',
  },
  {
    to: '/kho-tai-lieu',
    icon: BookOpen,
    label: 'Kho tài liệu',
    badge: '',
    desc: 'Đề tham khảo, ma trận mẫu, đề ôn tập xếp theo khối lớp.',
    cta: 'Mở kho',
  },
  {
    to: '/de-cua-toi',
    icon: FolderOpen,
    label: 'Đề của tôi',
    badge: '',
    desc: 'Đề, slide, bảng vẽ bạn đã làm. Đăng nhập là thấy trên mọi máy.',
    cta: 'Mở',
  },
]

export function CommunityCtaSection() {
  const head = useReveal<HTMLDivElement>()
  const listRev = useReveal<HTMLDivElement>()
  const ctaRev = useReveal<HTMLDivElement>(80)

  return (
    <section className="landing-below-fold bg-canvas py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div {...head.revealProps} className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-clay-deep">
            Kho đề
          </p>
          <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
            Năm sau mở ra dùng tiếp.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
            Đề của mình nằm một chỗ, đề của đồng nghiệp ở ngay bên cạnh.
          </p>
        </div>

        <div
          {...listRev.revealProps}
          className="stagger-kids mt-8 divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface"
        >
          {LIBRARY_ROUTES.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.to}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-line bg-canvas text-clay">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16.5px] font-bold text-ink">{item.label}</h3>
                      {item.badge && (
                        <span className="rounded-[5px] bg-clay-tint px-2 py-0.5 text-[11.5px] font-semibold text-clay-deep">{item.badge}</span>
                      )}
                    </div>
                    <p className="mt-1 text-[14px] leading-[1.6] text-ink-2">{item.desc}</p>
                  </div>
                </div>

                <Link
                  to={item.to}
                  className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 text-[13.5px] font-semibold text-clay-deep hover:text-clay sm:pl-4"
                >
                  <span>{item.cta}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </div>
            )
          })}
        </div>

        {/* dải CTA kết trang: nền tối sắc nét, không phát sáng */}
        <div
          {...ctaRev.revealProps}
          className="mt-12 rounded-[14px] bg-deep px-5 py-9 text-deep-text sm:px-9 sm:py-11 lg:flex lg:items-center lg:justify-between lg:gap-10"
        >
          <div className="max-w-xl min-w-0">
            <h2 className="text-[clamp(1.45rem,2.6vw,2.05rem)] font-bold leading-[1.18] tracking-[-0.02em] text-deep-text">
              Thử với tiết dạy tuần sau.
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-[1.65] text-deep-muted sm:text-[15.5px]">
              Mở trình duyệt là dùng, không cài đặt, không mất tiền.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-0 lg:shrink-0">
            <Link
              to="/soan-de"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[8px] bg-clay px-5 py-2.5 text-center text-[15px] font-semibold leading-snug text-white transition-colors hover:bg-clay-deep active:scale-[0.98]"
            >
              <span>Bắt đầu soạn</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            <Link
              to="/de-cong-dong"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[8px] border border-white/25 bg-transparent px-4 py-2.5 text-center text-[15px] font-semibold leading-snug text-deep-text transition-colors hover:bg-white/10 active:scale-[0.98]"
            >
              Xem đề cộng đồng
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
