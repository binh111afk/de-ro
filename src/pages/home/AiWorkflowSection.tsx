import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useReveal } from './reveal'

const AI_STEPS = [
  {
    no: '01',
    title: 'Ra đề theo yêu cầu',
    body: 'Cho biết môn, lớp, phạm vi kiến thức và tỉ lệ mức độ, AI soạn câu trắc nghiệm, Đúng/Sai, trả lời ngắn theo cấu trúc đề mới.',
  },
  {
    no: '02',
    title: 'Hình vẽ sửa được',
    body: 'Câu cần đồ thị, bảng biến thiên hay mạch điện thì AI vẽ bằng bộ công cụ vẽ có sẵn. Số liệu sai thì nháy đúp vào hình để sửa.',
  },
  {
    no: '03',
    title: 'Slide theo dàn ý',
    body: 'AI đưa dàn ý để bạn xem và sửa trước, sau đó mới làm từng slide.',
  },
  {
    no: '04',
    title: 'Chuyển đề giấy thành đề sửa được',
    body: 'Gửi ảnh chụp đề cũ, AI gõ lại câu hỏi và công thức lên trang A4.',
  },
]

export function AiWorkflowSection() {
  const left = useReveal<HTMLDivElement>()
  const right = useReveal<HTMLOListElement>(80)

  return (
    <section id="tro-ly-ai" className="landing-below-fold border-b border-line bg-surface py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:gap-10 lg:grid-cols-12 lg:gap-12">
          <div {...left.revealProps} className="min-w-0 lg:col-span-5">
            <div className="inline-flex items-center gap-2.5 rounded-[8px] border border-line bg-canvas px-3 py-1.5">
              <img src="/brand/ai-static.svg" width={20} height={20} alt="" className="h-5 w-5 shrink-0" />
              <span className="text-[12.5px] font-semibold text-ink">Trợ lý AI</span>
            </div>

            <h2 className="mt-3 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink md:mt-4">
              Trợ lý AI trong trang soạn
            </h2>

            <p className="mt-2.5 text-[15px] leading-[1.65] text-ink-2 md:mt-3">
              Khung AI nằm bên cạnh trang đề, nội dung AI viết được chèn thẳng vào đề.
            </p>

            <div className="mt-4 rounded-[10px] border border-clay-line bg-clay-tint p-3.5 text-[13.5px] leading-[1.6] text-ink-2 md:mt-6 md:p-4">
              Câu hỏi và slide do AI viết vẫn sửa như bình thường: đổi chữ, đổi đáp án, đổi số trên hình.
            </div>

            <div className="mt-4 md:mt-6">
              <Link
                to="/soan-de"
                className="inline-flex min-h-[40px] items-center gap-1.5 text-[14px] font-semibold text-clay hover:text-clay-deep"
              >
                Thử với AI
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <ol
            {...right.revealProps}
            className="stagger-kids no-scrollbar max-md:-mx-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scroll-pl-4 max-md:gap-3 max-md:overflow-x-auto max-md:px-4 min-w-0 md:divide-y md:divide-line md:border-y md:border-line lg:col-span-7"
          >
            {AI_STEPS.map((st) => (
              <li
                key={st.no}
                className="flex flex-col gap-2 max-md:w-[80%] max-md:shrink-0 max-md:snap-start max-md:rounded-[10px] max-md:border max-md:border-line max-md:bg-canvas max-md:p-4 md:flex-row md:items-start md:gap-5 md:py-6"
              >
                <span className="tnum shrink-0 font-mono text-[13px] font-bold text-clay">{st.no}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[16.5px] font-bold leading-snug text-ink">{st.title}</h3>
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
