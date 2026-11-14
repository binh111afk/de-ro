import { Link } from 'react-router-dom'
import { ArrowRight, Check, FileText, PenTool, Presentation } from 'lucide-react'
import { useReveal } from './reveal'

const EXAM_POINTS = [
  'Trang A4 thật, câu hỏi tự đánh số theo Phần I – II – III',
  'Gõ công thức LaTeX, chèn hình từ bộ công cụ vẽ',
  'Lập ma trận, đặc tả; xáo câu và đáp án ra nhiều mã đề',
  'Xuất Word hoặc in thẳng, công thức và hình không vỡ',
]

const SECONDARY_WORKSPACES = [
  {
    id: 'slide',
    badge: 'Slide · .pptx',
    title: 'Slide bài giảng',
    icon: Presentation,
    desc: 'Đưa dàn ý cho AI hoặc tự dựng từng trang. Công thức, hình vẽ đặt thẳng lên slide, xuất ra PowerPoint.',
    bullets: [
      'Chủ đề sáng, tối cho phòng học',
      'Đồ thị, mạch điện chèn như trong đề',
    ],
  },
  {
    id: 'board',
    badge: 'Bảng vẽ',
    title: 'Bảng vẽ',
    icon: PenTool,
    desc: 'Viết tay trên giấy trơn hay ô li. Giữ bút một nhịp là nét tay thành đường thẳng, đường tròn.',
    bullets: [
      'Thước kẻ, thước đo góc, compa',
      'Chèn hình từ bộ công cụ vẽ',
    ],
  },
]

export function WorkspaceSection() {
  const head = useReveal<HTMLDivElement>()
  const lead = useReveal<HTMLDivElement>()
  const right = useReveal<HTMLDivElement>(80)

  return (
    <section id="khong-gian" className="landing-below-fold border-b border-line bg-surface py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div {...head.revealProps} className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-clay">
            Ba chế độ
          </p>
          <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
            Một tiết dạy, ba tab.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
            Đề kiểm tra, slide và bảng của cùng một bài mở cạnh nhau, không phải nhảy qua lại giữa Word, PowerPoint và phần mềm bảng.
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
              </div>

              <h3 className="mt-4 text-[21px] font-bold leading-snug tracking-[-0.015em] text-ink">
                Đề thi đúng mẫu
              </h3>
              <p className="mt-2 text-[14.5px] leading-[1.65] text-ink-2">
                Tiêu đề Sở, Trường; trắc nghiệm, Đúng/Sai, trả lời ngắn, tự luận. Căn lề sẵn, in là dùng.
              </p>

              <ul className="stagger-kids mt-5 space-y-2.5 border-t border-line pt-5">
                {EXAM_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-clay" aria-hidden />
                    <span className="min-w-0">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <span />
              <Link
                to="/soan-de"
                className="inline-flex min-h-[38px] items-center gap-1.5 text-[14px] font-semibold text-clay hover:text-clay-deep"
              >
                Soạn đề
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Cột phải: Slide & Bảng vẽ xếp dọc không đồng đều */}
          <div {...right.revealProps} className="stagger-kids flex flex-col gap-6 lg:col-span-6">
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
