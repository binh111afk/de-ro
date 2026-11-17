import { Link } from 'react-router-dom'
import { ArrowRight, Compass, FileUp, Highlighter, PenLine } from 'lucide-react'
import { useReveal } from './reveal'

type BoardMode = 'pdf'

const MODES: Array<{
  key: BoardMode
  label: string
  img: string
  img2x: string
  w: number
  h: number
  alt: string
}> = [
  {
    key: 'pdf',
    label: 'Bảng vẽ',
    img: '/landing/hero-board.webp',
    img2x: '/landing/hero-board@2x.webp',
    w: 1100,
    h: 653,
    alt: 'Bảng vẽ giấy ô li: đồ thị parabol dựng bằng công cụ, bảng giá trị và ghi chú viết tay',
  },
]

const BOARD_SPECS = [
  {
    icon: PenLine,
    title: 'Bút và giấy',
    text: 'Bút bi, bút máy có nét thanh nét đậm, bút lông, bút chì, dạ quang. Giấy trơn, ô li, kẻ dòng, chấm.',
  },
  {
    icon: Compass,
    title: 'Thước, compa',
    text: 'Đặt thước lên bảng rồi kẻ theo mép thước. Dùng compa để vẽ cung tròn.',
  },
  {
    icon: FileUp,
    title: 'Chèn hình, mở PDF',
    text: 'Chèn đồ thị, hình học từ bộ công cụ vẽ. Mở file PDF để viết lời giải lên đề có sẵn.',
  },
]

const PENS_LIST = ['Bút bi', 'Dạ quang', 'Bút máy', 'Bút lông', 'Bút chì']
const PAPERS_LIST = ['Giấy trơn', 'Ô vuông', 'Kẻ ngang', 'Chấm bi']

export function BoardSection() {
  const active = MODES[0]
  const head = useReveal<HTMLDivElement>()
  const reveal = useReveal<HTMLDivElement>()

  return (
    <section id="bang-ve" className="landing-below-fold border-b border-ink-2/30 bg-deep py-10 text-deep-text sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div {...head.revealProps} className="max-w-2xl min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#e79d7b]">
              Bảng vẽ
            </p>
            <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-deep-text">
              Bảng để giảng và chữa bài
            </h2>
            <p className="mt-2.5 text-[15px] leading-[1.65] text-deep-muted md:mt-3">
              Dùng khi chiếu lên lớp hoặc dạy online. Viết tay, kẻ thước, vẽ compa và chèn đồ thị lên bảng.
            </p>
          </div>
        </div>

        <div {...reveal.revealProps} className="mt-6 grid grid-cols-1 items-start gap-5 md:mt-9 md:gap-7 lg:grid-cols-12">
          {/* Ảnh màn hình thật của Bảng vẽ */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-[12px] border border-white/15 bg-[#1b2025]">
              <div className="aspect-[1100/653] w-full">
                <img
                  key={active.key}
                  src={active.img}
                  srcSet={`${active.img} 1x, ${active.img2x} 2x`}
                  sizes="(min-width: 1024px) 720px, 100vw"
                  width={active.w}
                  height={active.h}
                  alt={active.alt}
                  loading="lazy"
                  decoding="async"
                  className="land-swap h-full w-full object-cover object-top"
                />
              </div>
            </div>
          </div>

          {/* Thông số & danh sách dụng cụ bảng */}
          <div className="stagger-kids flex min-w-0 flex-col gap-3.5 md:gap-5 lg:col-span-5">
            <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 md:mx-0 md:flex-col md:gap-5 md:overflow-visible md:px-0 md:scroll-pl-0">
              {BOARD_SPECS.map((sp) => {
                const Icon = sp.icon
                return (
                  <div key={sp.title} className="w-[80%] shrink-0 snap-start rounded-[10px] border border-white/12 bg-white/[0.04] p-4 sm:p-5 md:w-auto">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] bg-[#e79d7b]/15 text-[#e79d7b]">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-[15.5px] font-bold text-deep-text">{sp.title}</h3>
                        <p className="mt-1 text-[13.5px] leading-[1.6] text-deep-muted">{sp.text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="rounded-[10px] border border-white/12 bg-white/[0.04] p-3.5 md:p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-deep-muted">
                <Highlighter className="h-3.5 w-3.5 text-[#e79d7b]" aria-hidden />
                Có sẵn
              </div>
              <div className="no-scrollbar -mx-3.5 mt-2 flex gap-1.5 overflow-x-auto px-3.5 md:mx-0 md:mt-2.5 md:flex-wrap md:overflow-visible md:px-0">
                {PENS_LIST.map((p) => (
                  <span key={p} className="shrink-0 rounded-[5px] border border-white/12 bg-white/5 px-2 py-0.5 text-[12px] text-deep-text">
                    {p}
                  </span>
                ))}
                {PAPERS_LIST.map((p) => (
                  <span key={p} className="shrink-0 rounded-[5px] border border-white/12 bg-transparent px-2 py-0.5 text-[12px] text-deep-muted">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Link
                to="/soan-de"
                state={{ create: 'board' }}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] bg-clay px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-clay-deep active:scale-[0.98]"
              >
                <span>Mở bảng vẽ</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
