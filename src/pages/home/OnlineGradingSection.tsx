import { Link } from 'react-router-dom'
import { ArrowRight, CheckSquare, Clock } from 'lucide-react'
import { useReveal } from './reveal'

export function OnlineGradingSection() {
  const onlineRev = useReveal<HTMLDivElement>()
  const gradeRev = useReveal<HTMLDivElement>(80)

  return (
    <section id="thi-va-cham" className="landing-below-fold border-b border-line bg-canvas py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-clay">
            Từ file đề sang chấm điểm
          </p>
          <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
            Giao bài làm online có tính giờ, hoặc chấm nhanh phiếu trắc nghiệm giấy.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
            Khi đã có đề hoàn chỉnh, giáo viên có thể xuất bản thành bài kiểm tra trực tuyến kèm đồng hồ đếm ngược, hoặc mở mục Chấm trắc nghiệm để đọc phiếu tô đáp án ngay trên lớp.
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
                  <span>Tạo đề online &amp; làm bài tính giờ</span>
                </div>
                <h3 className="mt-2 text-[19px] font-bold leading-snug text-ink">
                  Học sinh làm bài trực tiếp, nộp xong thấy đáp án và điểm ngay
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">
                  Hỗ trợ đầy đủ trắc nghiệm nhiều lựa chọn, câu Đúng/Sai nhiều ý và trả lời ngắn. Có bảng điều hướng từng câu và đồng hồ đếm ngược 45–90 phút.
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
                  <span>Chấm trắc nghiệm theo đáp án chuẩn</span>
                </div>
                <h3 className="mt-2 text-[19px] font-bold leading-snug text-ink">
                  Chụp ảnh phiếu hoặc bấm nhanh đáp án, ra điểm ngay lập tức
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">
                  Chọn bộ đáp án đúng từ đề có sẵn, tải ảnh phiếu trả lời hoặc tick tay trên lưới 20 câu, gắn tên học sinh và lưu danh sách điểm đã chấm.
                </p>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <Link
                  to="/cham-trac-nghiem"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-line-2 bg-white px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:border-ink-4 hover:bg-sunken/60 active:scale-[0.98]"
                >
                  <span>Mở trang chấm trắc nghiệm</span>
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
