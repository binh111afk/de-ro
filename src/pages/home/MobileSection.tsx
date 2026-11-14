import { Link } from 'react-router-dom'
import { ArrowRight, Check, Smartphone } from 'lucide-react'
import { useReveal } from './reveal'

const MOBILE_NOTES = [
  'Vẫn gọn khi bạn để cỡ chữ máy to',
  'Xem trang A4 như lúc in',
  'Nhờ AI thêm câu hỏi ngay trên điện thoại',
]

export function MobileSection() {
  const reveal = useReveal<HTMLDivElement>()

  return (
    <section className="landing-below-fold border-b border-line bg-surface py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div
          {...reveal.revealProps}
          className="grid grid-cols-1 items-center gap-8 rounded-[14px] border border-line bg-canvas p-5 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10"
        >
          <div className="min-w-0 lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-surface px-2.5 py-1 text-[12px] font-semibold text-ink-2">
              <Smartphone className="h-3.5 w-3.5 text-clay" aria-hidden />
              <span>Điện thoại, máy tính bảng</span>
            </div>

            <h2 className="mt-4 text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-[1.2] tracking-[-0.02em] text-ink">
              Sửa đề lúc không ngồi máy tính.
            </h2>

            <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
              Mở đúng đề đang soạn trên máy tính, sửa một câu, thêm một hình.
            </p>

            <ul className="stagger-kids mt-5 space-y-2.5 border-t border-line pt-5">
              {MOBILE_NOTES.map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-clay" aria-hidden />
                  <span className="min-w-0">{n}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                to="/soan-de"
                className="inline-flex min-h-[40px] items-center gap-1.5 text-[14px] font-semibold text-clay hover:text-clay-deep"
              >
                Mở trên điện thoại
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-6">
            <div className="land-float w-full max-w-[290px] overflow-hidden rounded-[22px] border-4 border-ink bg-surface shadow-[0_12px_28px_rgba(20,24,28,0.1)] sm:max-w-[320px]">
              <div className="aspect-[390/780] w-full">
                <img
                  src="/landing/mobile-compose.webp"
                  srcSet="/landing/mobile-compose.webp 1x, /landing/mobile-compose@2x.webp 2x"
                  sizes="(min-width: 640px) 320px, 290px"
                  width={390}
                  height={780}
                  alt="Giao diện soạn đề thi trên điện thoại bề rộng 390px hiển thị rõ câu hỏi toán và đồ thị parabol"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
