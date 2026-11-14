import { useEffect, useRef, useState } from 'react'
import { TabThumb } from './TabThumb'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, PenTool, Presentation } from 'lucide-react'
import { cn } from '@/lib/cn'
import { prefersReducedMotion, useCountUpRef, useReveal } from './reveal'

const ROTATE_MS = 6000

type HeroTab = 'exam' | 'slide' | 'board'

const TABS: Array<{
  key: HeroTab
  label: string
  ext: string
  icon: typeof FileText
  img: string
  img760?: string
  img2x: string
  alt: string
  caption: string
}> = [
  {
    key: 'exam',
    label: 'Đề thi',
    ext: '.docx',
    icon: FileText,
    img760: '/landing/hero-exam-760.webp',
    img: '/landing/hero-exam.webp',
    img2x: '/landing/hero-exam@2x.webp',
    alt: 'Trình soạn đề thi Toán lớp 10 trên đề rõ với công thức KaTeX và đồ thị parabol',
    caption: 'Gõ thẳng lên trang A4, công thức và đồ thị giữ nguyên khi xuất Word.',
  },
  {
    key: 'slide',
    label: 'Slide bài giảng',
    ext: '.pptx',
    icon: Presentation,
    img: '/landing/hero-slide.webp',
    img2x: '/landing/hero-slide@2x.webp',
    alt: 'Trình soạn slide bài giảng Định luật Bảo toàn Năng lượng trên đề rõ',
    caption: 'Dàn ý thành slide, sửa trên khung, xuất PowerPoint mang lên lớp.',
  },
  {
    key: 'board',
    label: 'Bảng vẽ',
    ext: 'PDF',
    icon: PenTool,
    img: '/landing/board-pdf.webp',
    img2x: '/landing/board-pdf@2x.webp',
    alt: 'Bảng vẽ mở đề PDF nhiều trang, có cột trang thu nhỏ bên trái và nét ghi chú trên đề',
    caption: 'Viết tay, kẻ thước, quay compa, khoanh thẳng lên đề PDF.',
  },
]

const STATS = [
  { num: 1798, suffix: '', label: 'câu hỏi mẫu' },
  { num: 27, suffix: '', label: 'công cụ vẽ hình' },
  { num: 11, suffix: '', label: 'môn học' },
]

export function HeroSection() {
  const [tab, setTab] = useState<HeroTab>('exam')
  // tự chuyển Đề thi → Slide → Bảng vẽ; dừng khi rê chuột vào khung hoặc khi người dùng đã tự bấm tab
  const [auto, setAuto] = useState(() => !prefersReducedMotion())
  const [hover, setHover] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!auto || hover) return
    const t = window.setTimeout(() => {
      setTab((cur) => TABS[(TABS.findIndex((x) => x.key === cur) + 1) % TABS.length].key)
    }, ROTATE_MS)
    return () => window.clearTimeout(t)
  }, [auto, hover, tab])
  const active = TABS.find((t) => t.key === tab) ?? TABS[0]
  const statsReveal = useReveal<HTMLDListElement>()
  const r0 = useCountUpRef(STATS[0].num, statsReveal.shown)
  const r1 = useCountUpRef(STATS[1].num, statsReveal.shown)
  const r2 = useCountUpRef(STATS[2].num, statsReveal.shown)
  const countRefs = [r0, r1, r2]

  return (
    <section className="border-b border-line bg-canvas pt-6 pb-10 sm:pt-9 sm:pb-12 lg:pt-10 lg:pb-14">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Cột nội dung chính */}
          <div className="min-w-0 lg:col-span-5">
            <p style={{ '--d': '0ms' } as React.CSSProperties} className="land-rise inline-flex items-center gap-2 rounded-full border border-clay-line bg-clay-tint px-3 py-1 text-[12px] font-semibold text-clay-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden />
              Miễn phí cho giáo viên Việt Nam
            </p>

            <h1 style={{ '--d': '80ms' } as React.CSSProperties} className="land-rise mt-4 text-[clamp(1.75rem,3.6vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.025em] text-ink">
              Đề thi, bài giảng, bảng dạy — cùng một chỗ.
            </h1>

            <p style={{ '--d': '170ms' } as React.CSSProperties} className="land-rise mt-4 text-[15px] leading-[1.65] text-ink-2 sm:text-[16px]">
              Soạn đề trên trang A4, vẽ hình Toán – Lí – Hoá – Sinh bằng vài thông số, làm slide, chữa bài trên bảng. Xong thì xuất Word, PowerPoint hoặc giao bài online.
            </p>

            <div style={{ '--d': '260ms' } as React.CSSProperties} className="land-rise mt-6 flex flex-col items-start gap-3 min-[460px]:flex-row min-[460px]:flex-wrap min-[460px]:items-center">
              <Link
                to="/soan-de"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[8px] bg-clay px-5 py-2.5 text-center text-[15px] font-semibold leading-snug text-white shadow-[0_1px_2px_rgba(180,83,42,0.2),0_10px_20px_-10px_rgba(180,83,42,0.5)] transition-colors hover:bg-clay-deep active:scale-[0.98]"
              >
                <span>Bắt đầu soạn</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link
                to="/de-cong-dong"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[8px] border border-line-2 bg-white px-4 py-2.5 text-center text-[15px] font-semibold leading-snug text-ink transition-colors hover:border-ink-4 hover:bg-sunken/60 active:scale-[0.98]"
              >
                Xem đề cộng đồng
              </Link>
            </div>

            <dl
              ref={statsReveal.ref}
              className="mt-7 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-line pt-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
            >
              {STATS.map((s, idx) => (
                <div key={s.label} className="min-w-0">
                  <dt className="text-[12px] font-medium text-ink-2">{s.label}</dt>
                  <dd
                    ref={countRefs[idx]}
                    className="tnum mt-0.5 text-[18px] font-bold tracking-[-0.02em] text-ink"
                  >
                    {s.num.toLocaleString('vi-VN')}
                  </dd>
                </div>
              ))}
              <div className="min-w-0">
                <dt className="text-[12px] font-medium text-ink-2">tài khoản miễn phí</dt>
                <dd className="tnum mt-0.5 text-[18px] font-bold tracking-[-0.02em] text-clay-deep">0 đ</dd>
              </div>
            </dl>
          </div>

          {/* Cột xem trước sản phẩm thật với 3 tab chuyển */}
          <div style={{ '--d': '200ms' } as React.CSSProperties} className="land-rise min-w-0 lg:col-span-7" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="overflow-hidden rounded-[12px] border border-line bg-surface shadow-[0_12px_32px_rgba(20,24,28,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-sunken px-3 py-2 sm:px-4">
                <div ref={tabsRef} role="tablist" aria-label="Xem trước" className="relative flex flex-wrap gap-1">
                  <TabThumb active={tab} className="rounded-[7px] bg-surface shadow-xs ring-1 ring-line" />
                  {TABS.map((item) => {
                    const Icon = item.icon
                    const isSelected = item.key === tab
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => { setTab(item.key); setAuto(false) }}
                        className={cn(
                          'relative inline-flex min-h-[38px] items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors',
                          isSelected ? 'text-ink' : 'text-ink-2 hover:text-ink',
                        )}
                      >
                        <Icon className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'text-clay' : 'text-ink-2')} aria-hidden />
                        <span>{item.label}</span>
                        <span className="hidden text-[11px] font-medium text-ink-2 sm:inline">{item.ext}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="relative aspect-[1100/653] w-full bg-sunken">
                <img
                  key={active.key}
                  src={active.img}
                  srcSet={
                    active.img760
                      ? `${active.img760} 760w, ${active.img} 1100w, ${active.img2x} 2200w`
                      : `${active.img} 1100w, ${active.img2x} 2200w`
                  }
                  sizes="(min-width: 1024px) 680px, calc(100vw - 32px)"
                  width={1100}
                  height={653}
                  alt={active.alt}
                  loading="eager"
                  fetchPriority="high"
                  className="land-swap h-full w-full object-cover object-top"
                />
                {auto && !hover && (
                  <span key={`progress-${tab}`} aria-hidden style={{ '--dur': `${ROTATE_MS}ms` } as React.CSSProperties} className="land-progress absolute inset-x-0 top-0 h-[2px] bg-clay/70" />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-3.5 py-2.5 sm:px-4">
                <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-2">{active.caption}</p>
                <Link
                  to="/soan-de"
                  className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-clay hover:text-clay-deep"
                >
                  Thử ngay
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
