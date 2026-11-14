import { useRef, useState } from 'react'
import { TabThumb } from './TabThumb'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass, FileUp, Highlighter, PenLine } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useReveal } from './reveal'

type BoardMode = 'pdf' | 'chalk'

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
    label: 'Ghi chú trên PDF',
    img: '/landing/board-pdf.webp',
    img2x: '/landing/board-pdf@2x.webp',
    w: 1040,
    h: 618,
    alt: 'Màn hình bảng vẽ mở tệp PDF nhiều trang với thanh trang bên trái và nét ghi chú',
  },
  {
    key: 'chalk',
    label: 'Bảng đen & phấn',
    img: '/landing/hero-board.webp',
    img2x: '/landing/hero-board@2x.webp',
    w: 1100,
    h: 653,
    alt: 'Bảng đen dạy hình học không gian S.ABCD với nét phấn vàng và xanh',
  },
]

const BOARD_SPECS = [
  {
    icon: PenLine,
    title: 'Bút và giấy',
    text: 'Sáu loại bút, bút máy có nét thanh nét đậm. Giấy trơn, ô li, kẻ dòng, bảng đen, bảng xanh.',
  },
  {
    icon: Compass,
    title: 'Thước, compa',
    text: 'Đặt thước lên bảng rồi kẻ dọc theo mép. Quay compa ra cung tròn thật.',
  },
  {
    icon: FileUp,
    title: 'Chữa đề PDF',
    text: 'Mở đề PDF, lật trang ở cột trái, ghi chú rồi xuất lại đúng khổ giấy gốc.',
  },
]

const PENS_LIST = ['Bút bi', 'Dạ quang', 'Bút máy', 'Bút lông', 'Bút chì', 'Bút phấn']
const PAPERS_LIST = ['Giấy trơn', 'Ô vuông', 'Kẻ ngang', 'Chấm bi', 'Bảng đen', 'Bảng xanh']

export function BoardSection() {
  const [mode, setMode] = useState<BoardMode>('pdf')
  const active = MODES.find((m) => m.key === mode) ?? MODES[0]
  const head = useReveal<HTMLDivElement>()
  const reveal = useReveal<HTMLDivElement>()
  const modeRef = useRef<HTMLDivElement>(null)

  return (
    <section id="bang-ve" className="landing-below-fold border-b border-ink-2/30 bg-deep py-14 text-deep-text sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div {...head.revealProps} className="max-w-2xl min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#e79d7b]">
              Bảng vẽ
            </p>
            <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-deep-text">
              Chữa bài như trên bảng lớp.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-deep-muted">
              Chiếu lên lớp hoặc chia sẻ màn hình khi dạy online. Viết phấn, quay compa, khoanh đáp án ngay trên đề.
            </p>
          </div>

          <div
            ref={modeRef}
            role="tablist"
            aria-label="Chọn chế độ xem bảng vẽ"
            className="relative flex flex-wrap gap-1.5 rounded-[9px] border border-white/15 bg-white/5 p-1"
          >
            <TabThumb active={mode} className="rounded-[6px] bg-surface" />
            {MODES.map((m) => {
              const selected = m.key === mode
              return (
                <button
                  key={m.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setMode(m.key)}
                  className={cn(
                    'relative min-h-[38px] rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    selected ? 'text-ink' : 'text-deep-muted hover:text-deep-text',
                  )}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div {...reveal.revealProps} className="mt-9 grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
          {/* Ảnh màn hình thật của Bảng vẽ / PDF */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-[12px] border border-white/15 bg-[#1b2025]">
              <div className="aspect-[1040/618] w-full">
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
          <div className="stagger-kids flex min-w-0 flex-col gap-5 lg:col-span-5">
            {BOARD_SPECS.map((sp) => {
              const Icon = sp.icon
              return (
                <div key={sp.title} className="rounded-[10px] border border-white/12 bg-white/[0.04] p-4 sm:p-5">
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

            <div className="rounded-[10px] border border-white/12 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-deep-muted">
                <Highlighter className="h-3.5 w-3.5 text-[#e79d7b]" aria-hidden />
                Có sẵn
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {PENS_LIST.map((p) => (
                  <span key={p} className="rounded-[5px] border border-white/12 bg-white/5 px-2 py-0.5 text-[12px] text-deep-text">
                    {p}
                  </span>
                ))}
                {PAPERS_LIST.map((p) => (
                  <span key={p} className="rounded-[5px] border border-white/12 bg-transparent px-2 py-0.5 text-[12px] text-deep-muted">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Link
                to="/soan-de"
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
