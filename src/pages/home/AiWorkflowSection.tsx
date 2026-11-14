import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useReveal } from './reveal'

const AI_STEPS = [
  {
    no: '01',
    title: 'Ra đề theo cấu trúc 2025 từ vài dòng mô tả',
    body: 'Chỉ định môn, lớp, phạm vi kiến thức và tỉ lệ mức độ; trợ lý tạo đồng bộ câu trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý và Trả lời ngắn kèm công thức LaTeX.',
    tag: 'Trong trình soạn Đề thi',
  },
  {
    no: '02',
    title: 'Tự chèn hình SVG của công cụ thay vì bịa ảnh',
    body: 'Khi bài toán cần đồ thị hàm số, bảng biến thiên, mạch điện hay sơ đồ phả hệ, trợ lý gọi thẳng bộ dựng SVG để giáo viên nhấp đúp chỉnh lại thông số.',
    tag: 'Kết nối 27 công cụ',
  },
  {
    no: '03',
    title: 'Dựng bộ slide giảng dạy theo tiết học',
    body: 'Sinh nhanh trang bìa, khối định nghĩa, bảng so sánh hoặc slide ví dụ có sẵn vùng chữ và hình minh hoạ đúng chủ đề đang mở.',
    tag: 'Trong trình soạn Slide',
  },
  {
    no: '04',
    title: 'Nhận dạng đề từ ảnh chụp trang sách hoặc đề giấy',
    body: 'Đưa ảnh đề kiểm tra cũ hoặc hình chép tay vào bảng điều khiển AI để chuyển thành khối câu hỏi và công thức gõ sửa được ngay trên trang A4.',
    tag: 'Đọc ảnh chụp đề',
  },
]

export function AiWorkflowSection() {
  const left = useReveal<HTMLDivElement>()
  const right = useReveal<HTMLOListElement>(80)

  return (
    <section id="tro-ly-ai" className="landing-below-fold border-b border-line bg-surface py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div {...left.revealProps} className="min-w-0 lg:col-span-5">
            <div className="inline-flex items-center gap-2.5 rounded-[8px] border border-line bg-canvas px-3 py-1.5">
              <img src="/brand/ai-static.svg" width={20} height={20} alt="" className="h-5 w-5 shrink-0" />
              <span className="text-[12.5px] font-semibold text-ink">Trợ lý AI tích hợp theo ngữ cảnh</span>
            </div>

            <h2 className="mt-4 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
              Viết câu hỏi, chèn đúng hình và nhận dạng đề từ ảnh chụp.
            </h2>

            <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
              Thay vì phải copy qua lại từ một cửa sổ chat rời rồi sửa lại từng công thức, bảng Trợ lý nằm ngay bên phải trình soạn và đặt nội dung trực tiếp vào vị trí con trỏ.
            </p>

            <div className="mt-6 rounded-[10px] border border-clay-line bg-clay-tint p-4 text-[13.5px] leading-[1.6] text-ink-2">
              Mọi nội dung AI tạo ra đều ở dạng khối đề hoặc khối slide chuẩn, cho phép giáo viên sửa từng chữ, đổi phương án, thay số trên hình hoặc xáo mã đề ngay lập tức.
            </div>

            <div className="mt-6">
              <Link
                to="/soan-de"
                className="inline-flex min-h-[40px] items-center gap-1.5 text-[14px] font-semibold text-clay hover:text-clay-deep"
              >
                Mở trình soạn cùng Trợ lý AI
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <ol {...right.revealProps} className="min-w-0 divide-y divide-line border-y border-line lg:col-span-7">
            {AI_STEPS.map((st) => (
              <li key={st.no} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:gap-5 sm:py-6">
                <span className="tnum shrink-0 font-mono text-[13px] font-bold text-clay">{st.no}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[16.5px] font-bold leading-snug text-ink">{st.title}</h3>
                    <span className="rounded-[5px] border border-line bg-canvas px-2 py-0.5 text-[11.5px] font-medium text-ink-3">
                      {st.tag}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-2">{st.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
