import { Link } from 'react-router-dom'
import { ArrowRight, Check, FileText, PenTool, Presentation } from 'lucide-react'
import { useReveal } from './reveal'

const EXAM_POINTS = [
  'Khổ giấy A4 chuẩn in ấn, đánh số câu tự động theo Phần I – II – III',
  'Gõ trực tiếp LaTeX ($...$, $$...$$) và chèn hình vẽ từ 27 công cụ',
  'Ma trận & đặc tả BGD 2025, xáo câu hỏi & phương án ra nhiều mã đề',
  'Xuất file Word (.docx) hoặc PDF, giữ nguyên công thức và hình vẽ',
]

const SECONDARY_WORKSPACES = [
  {
    id: 'slide',
    badge: 'Slide · .pptx',
    title: 'Trình soạn bài giảng có sẵn toán, hình và chủ đề',
    icon: Presentation,
    desc: 'Chọn bố cục trang bìa, bảng đối chiếu hay bài toán mẫu; kéo thả khối chữ, công thức và hình vẽ trực tiếp rồi xuất tệp PowerPoint (.pptx).',
    bullets: [
      'Thư viện chủ đề sáng / tối dịu mắt khi chiếu lớp',
      'Chèn đồ thị, bảng biến thiên, mạch điện thẳng vào slide',
    ],
  },
  {
    id: 'board',
    badge: 'Bảng vẽ · PDF',
    title: 'Bảng viết dạy học kiêm công cụ ghi chú trên đề PDF',
    icon: PenTool,
    desc: 'Chuyển nhanh giữa giấy trơn, ô li, bảng đen hay bảng xanh; viết tay hoặc giữ nét để nắn thẳng thành đoạn thẳng, đường tròn, hình chữ nhật.',
    bullets: [
      'Bộ thước kẻ, thước đo góc và compa xoay trực tiếp trên bảng',
      'Mở đề PDF nhiều trang để gạch chân, khoanh đáp án và xuất bản đã chú thích',
    ],
  },
]

export function WorkspaceSection() {
  const lead = useReveal<HTMLDivElement>()
  const right = useReveal<HTMLDivElement>(80)

  return (
    <section id="khong-gian" className="landing-below-fold border-b border-line bg-surface py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-clay">
            Một cửa sổ · Ba chế độ
          </p>
          <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
            Mở tab mới trên dải tab, chuyển mượt từ đề thi sang bài giảng và bảng dạy.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
            Thay vì dùng ba phần mềm rời rạc để gõ Word, dựng PowerPoint và viết bảng phụ, mọi tài liệu của một tiết dạy nằm cạnh nhau trên cùng thanh tab.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Thẻ chính: Trình soạn Đề thi */}
          <div
            {...lead.revealProps}
            className="flex flex-col justify-between rounded-[12px] border border-line bg-canvas p-5 sm:p-7 lg:col-span-6"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 rounded-[6px] bg-clay-soft px-2.5 py-1 text-[12px] font-semibold text-clay">
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  Đề thi · .docx &amp; .pdf
                </span>
                <span className="text-[12px] font-medium text-ink-3">Trình soạn A4 nhiều trang</span>
              </div>

              <h3 className="mt-4 text-[21px] font-bold leading-snug tracking-[-0.015em] text-ink">
                Soạn đề đúng mẫu Việt Nam ngay trên trình duyệt
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.65] text-ink-2">
                Từ tiêu đề Sở/Trường, câu trắc nghiệm 4 lựa chọn, câu Đúng/Sai nhiều ý đến bài tự luận có biểu điểm — toàn bộ được căn lề sẵn để in hoặc xuất Word sửa tiếp.
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                {EXAM_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-clay" aria-hidden />
                    <span className="min-w-0">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium text-ink-3">
                <span className="rounded-[5px] border border-line bg-surface px-2 py-0.5 text-ink-2">Ma trận 2025</span>
                <span className="rounded-[5px] border border-line bg-surface px-2 py-0.5 text-ink-2">Xáo nhiều mã đề</span>
                <span className="rounded-[5px] border border-line bg-surface px-2 py-0.5 text-ink-2">Chèn hình SVG</span>
              </div>
              <Link
                to="/soan-de"
                className="inline-flex min-h-[38px] items-center gap-1.5 text-[14px] font-semibold text-clay hover:text-clay-deep"
              >
                Mở trình soạn đề
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Cột phải: Slide & Bảng vẽ xếp dọc không đồng đều */}
          <div {...right.revealProps} className="flex flex-col gap-6 lg:col-span-6">
            {SECONDARY_WORKSPACES.map((ws) => {
              const Icon = ws.icon
              return (
                <div
                  key={ws.id}
                  className="flex flex-1 flex-col justify-between rounded-[12px] border border-line bg-surface p-5 sm:p-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-sunken px-2.5 py-1 text-[12px] font-semibold text-ink-2">
                        <Icon className="h-3.5 w-3.5 text-clay" aria-hidden />
                        {ws.badge}
                      </span>
                      <Link
                        to="/soan-de"
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-clay hover:text-clay-deep"
                      >
                        Mở ngay
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>

                    <h3 className="mt-3.5 text-[18px] font-bold leading-snug tracking-[-0.015em] text-ink">
                      {ws.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-[1.6] text-ink-2">{ws.desc}</p>
                  </div>

                  <ul className="mt-4 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-2">
                    {ws.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] leading-snug text-ink-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay" aria-hidden />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
