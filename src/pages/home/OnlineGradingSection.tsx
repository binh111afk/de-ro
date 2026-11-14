import { Link } from 'react-router-dom'
import { ArrowRight, CheckSquare, Clock } from 'lucide-react'
import { useReveal } from './reveal'

export function OnlineGradingSection() {
  const head = useReveal<HTMLDivElement>()
  const onlineRev = useReveal<HTMLDivElement>()
  const gradeRev = useReveal<HTMLDivElement>(80)

  return (
    <section id="thi-va-cham" className="landing-below-fold border-b border-line bg-canvas py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div {...head.revealProps} className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-clay">
            Giao bài, chấm bài
          </p>
          <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
            Làm bài trên điện thoại, hoặc chấm phiếu giấy.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
            Đề soạn xong có thể gửi link cho học sinh làm có tính giờ, hoặc in ra rồi chấm phiếu.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Màn hình Làm bài online */}
          <div
            {...onlineRev.revealProps}
            className="flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface lg:col-span-6"
          >
            <div className="border-b border-line bg-sunken/70 p-3 sm:p-4">
              <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
                <div className="aspect-[960/540] w-full">
                  <img
                    src="/landing/online-quiz.webp"
                    srcSet="/landing/online-quiz.webp 1x, /landing/online-quiz@2x.webp 2x"
                    sizes="(min-width: 1024px) 580px, 100vw"
                    width={960}
                    height={540}
                    alt="Giao diện học sinh làm đề trắc nghiệm trực tuyến với đồng hồ đếm ngược và bảng số câu"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-clay">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Đề online</span>
                </div>
                <h3 className="mt-2 text-[19px] font-bold leading-snug text-ink">
                  Nộp bài là có điểm
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">
                  Trắc nghiệm, Đúng/Sai, trả lời ngắn. Học sinh thấy đồng hồ và bảng câu đã làm.
                </p>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <Link
                  to="/tao-de-online"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-line-2 bg-white px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-sunken/60 active:scale-[0.98]"
                >
                  <span>Tạo đề làm online</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          {/* Màn hình Chấm phiếu trắc nghiệm */}
          <div
            {...gradeRev.revealProps}
            className="flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface lg:col-span-6"
          >
            <div className="border-b border-line bg-sunken/70 p-3 sm:p-4">
              <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
                <div className="aspect-[960/509] w-full">
                  <img
                    src="/landing/grading-omr.webp"
                    srcSet="/landing/grading-omr.webp 1x, /landing/grading-omr@2x.webp 2x"
                    sizes="(min-width: 1024px) 580px, 100vw"
                    width={960}
                    height={509}
                    alt="Giao diện chấm phiếu trắc nghiệm với danh sách 20 câu đáp án A B C D và nút tải ảnh phiếu"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-clay">
                  <CheckSquare className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Chấm trắc nghiệm</span>
                </div>
                <h3 className="mt-2 text-[19px] font-bold leading-snug text-ink">
                  Chụp phiếu, ra điểm
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">
                  Lấy đáp án từ đề đã soạn, chụp hoặc nhập phiếu từng em, lưu bảng điểm cả lớp.
                </p>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <Link
                  to="/cham-trac-nghiem"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-line-2 bg-white px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-sunken/60 active:scale-[0.98]"
                >
                  <span>Chấm thử</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
