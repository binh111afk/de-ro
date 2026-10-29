import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Feather, Sparkles } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { MathText } from '@/components/MathText'
import { BANK } from '@/data/bank'
import { COMMUNITY_EXAMS } from '@/data/community'
import { SUBJECTS } from '@/data/types'

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Showcase />
      <CallToAction />
    </>
  )
}

/* ------------------------------------------------------------------- hero */

function Hero() {
  const [prompt, setPrompt] = useState('')
  return (
    <section className="relative overflow-hidden">
      {/* soft ambient blobs — organic, not a tech grid */}
      <div
        className="pointer-events-none absolute -left-40 -top-24 size-[520px] rounded-full opacity-70 blur-[90px] anim-drift"
        style={{ background: 'radial-gradient(circle, rgba(192,90,60,0.13), transparent 68%)' }}
      />
      <div
        className="pointer-events-none absolute -right-32 top-40 size-[460px] rounded-full opacity-60 blur-[100px] anim-drift"
        style={{
          background: 'radial-gradient(circle, rgba(91,122,94,0.14), transparent 70%)',
          animationDelay: '-9s',
        }}
      />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-16 px-5 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:pb-32 lg:pt-24">
        <div className="anim-rise">
          <Badge tone="clay" className="mb-7">
            <Sparkles className="size-3" />
            Trợ lý AI cho giáo viên Việt Nam
          </Badge>

          <h1 className="font-display text-[42px] font-semibold leading-[1.04] tracking-[-0.025em] text-ink text-balance sm:text-[56px] lg:text-[66px]">
            Đề thi trong{' '}
            <span className="relative inline-block italic" style={{ fontVariationSettings: "'SOFT' 60, 'WONK' 1" }}>
              một lần thở
            </span>
            ,
            <br className="hidden sm:block" /> không phải một buổi tối.
          </h1>

          <p className="mt-7 max-w-[44ch] text-[16px] leading-[1.75] text-ink-2 text-pretty">
            Mô tả đề bằng tiếng Việt, phần mềm dựng nốt câu hỏi, công thức và lời giải. Sửa tay khi
            cần, chuyển thành đề tương tác cho học sinh làm ngay, xuất Word một chạm.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/soan-de">
              <Button variant="primary" size="lg">
                Bắt đầu soạn đề
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/de-cong-dong">
              <Button variant="outline" size="lg">
                Xem đề cộng đồng
                <ArrowUpRight className="size-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-x-9 gap-y-4">
            {[
              [BANK.length.toLocaleString('vi-VN'), 'câu hỏi mẫu'],
              [String(SUBJECTS.length), 'môn học'],
              [String(COMMUNITY_EXAMS.length), 'đề mẫu'],
              ['0 đ', 'chi phí'],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
                  {v}
                </p>
                <p className="mt-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>

        <HeroConsole prompt={prompt} setPrompt={setPrompt} />
      </div>
    </section>
  )
}

function HeroConsole({
  prompt,
  setPrompt,
}: {
  prompt: string
  setPrompt: (v: string) => void
}) {
  return (
    <div className="anim-rise relative [animation-delay:0.14s]">
      {/* rotated paper stack behind — a physical metaphor */}
      <div
        className="absolute inset-x-6 -bottom-3 h-full rounded-[30px] bg-sunken/80"
        style={{ transform: 'rotate(-1.4deg)' }}
      />
      <div
        className="absolute inset-x-3 -bottom-1.5 h-full rounded-[30px] bg-veil/70"
        style={{ transform: 'rotate(0.9deg)' }}
      />

      <div className="relative rounded-[30px] bg-cream p-2.5 shadow-float">
        <div className="rounded-[6px] bg-surface/80 p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-clay text-[10px] font-bold text-white">
              QB
            </span>
            <p className="text-[14.5px] leading-relaxed text-ink">
              Sinh 20 câu trắc nghiệm Toán lớp 9 kèm 2 câu tự luận, thời gian 45 phút.
            </p>
          </div>

          <div className="mt-5 flex gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
              AI
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                {['Đọc yêu cầu', 'Dò kho câu hỏi', 'Cân độ khó', 'Dựng đáp án'].map((s, i) => (
                  <span
                    key={s}
                    className="rounded-full bg-sunken px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 anim-pop"
                    style={{ animationDelay: `${0.35 + i * 0.12}s` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
                Đã dựng <span className="font-semibold text-ink">22 câu</span> ·{' '}
                <span className="font-semibold text-ink tnum">7,5</span> điểm. Bạn duyệt trong khung
                soạn đề, hoặc bấm “Chuyển sang đề tương tác”.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-2 rounded-[10px] bg-canvas px-4 py-3 transition-colors focus-within:bg-white">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả đề bạn muốn…"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ink-4"
            />
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-300 hover:scale-105">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- marquee */

function Marquee() {
  const items = [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh',
    'Vật lí',
    'Hoá học',
    'Sinh học',
    'Lịch sử',
    'Địa lí',
    'Tin học',
    'Tiếng Việt',
  ]
  return (
    <div className="overflow-hidden border-y border-line/60 bg-cream/50 py-4">
      <div className="flex w-max anim-crawl">
        <div className="flex shrink-0 items-center gap-10 pr-10">
          {[...items, ...items].map((s, i) => (
            <span key={i} className="flex items-center gap-10 text-[13px] font-semibold text-ink-3">
              {s}
              <span className="size-1 rounded-full bg-clay/40" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- features */

const FEATURES = [
  {
    title: 'Soạn đề từ câu lệnh',
    body: 'Gõ “sinh 20 câu Toán lớp 9 trắc nghiệm”, đề dựng xong trong vài giây. Lọc theo môn, khối lớp và dạng bài.',
    art: 'prompt',
  },
  {
    title: 'Chuyển thành đề tương tác',
    body: 'Một cú nhấp là đề của bạn thành bài làm có đếm ngược, lưu đáp án và chấm điểm tự động.',
    art: 'quiz',
  },
  {
    title: 'Chat sửa đề cùng AI',
    body: 'Đổi số liệu, thêm câu, bỏ câu, đổi tên đầu đề — tất cả bằng tiếng Việt, không cần rời trang.',
    art: 'chat',
  },
  {
    title: 'Xuất Word và in A4',
    body: 'Đúng khổ giấy A4, công thức hiển thị chuẩn, sẵn sàng đưa vào phòng thi.',
    art: 'doc',
  },
  {
    title: 'Câu hỏi đổi số liệu',
    body: 'Mỗi đề sinh ra được nhiều phiên bản khác nhau, tránh trùng đề giữa các kỳ thi.',
    art: 'dice',
  },
  {
    title: 'Kho tài liệu mở',
    body: 'Lưu tài liệu tham khảo của bạn dưới dạng PDF hoặc Word, mở lại bất cứ lúc nào.',
    art: 'stack',
  },
]

function Features() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-6 lg:py-28">
      <div className="max-w-[38ch]">
        <p className="eyebrow mb-4">Tính năng</p>
        <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[42px]">
          Mọi thứ cần để có một đề thi hoàn chỉnh.
        </h2>
      </div>

      <div className="stagger mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="group relative overflow-hidden rounded-[8px] bg-surface p-7 shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift"
          >
            <FeatureArt kind={f.art} />
            <h3 className="mt-6 font-display text-[19px] font-semibold leading-snug tracking-[-0.01em] text-ink">
              {f.title}
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-[1.7] text-ink-3">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/** small hand-drawn-feel illustrations instead of a uniform icon grid */
function FeatureArt({ kind }: { kind: string }) {
  const base = 'flex h-24 items-center gap-2.5'

  if (kind === 'prompt') {
    return (
      <div className={base}>
        <div className="flex-1 rounded-[6px] bg-sunken px-3.5 py-2.5">
          <div className="h-2 w-3/4 rounded-full bg-ink-4/50" />
          <div className="mt-1.5 h-2 w-1/2 rounded-full bg-ink-4/30" />
        </div>
        <span className="flex size-8 items-center justify-center rounded-full bg-clay text-white">
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    )
  }

  if (kind === 'quiz') {
    return (
      <div className={base}>
        {['A', 'B', 'C'].map((k, i) => (
          <div
            key={k}
            className={
              'flex size-11 items-center justify-center rounded-[6px] text-[14px] font-bold ' +
              (i === 1 ? 'bg-clay text-white shadow-[0_6px_16px_-8px_rgba(192,90,60,0.9)]' : 'bg-sunken text-ink-3')
            }
          >
            {k}
          </div>
        ))}
        <div className="ml-1 h-11 w-px bg-line" />
        <span className="text-[12.5px] font-semibold text-ink-3">2:41</span>
      </div>
    )
  }

  if (kind === 'chat') {
    return (
      <div className={base}>
        <div className="max-w-[62%] rounded-[8px] rounded-bl-[5px] bg-ink px-3.5 py-2.5 text-[12.5px] font-medium text-paper">
          đổi số liệu câu 3
        </div>
        <div className="max-w-[62%] rounded-[8px] rounded-br-[5px] rounded-tl-[5px] bg-sunken px-3.5 py-2.5 text-[12.5px] font-medium text-ink-2">
          Đã tạo biến thể mới
        </div>
      </div>
    )
  }

  if (kind === 'doc') {
    return (
      <div className={base}>
        <div className="relative">
          <div className="h-[76px] w-[52px] rotate-[-4deg] rounded-[8px] bg-sunken" />
          <div className="absolute left-3 top-0 h-[76px] w-[52px] rotate-[3deg] rounded-[8px] bg-surface shadow-soft">
            <div className="space-y-1.5 p-2.5">
              <div className="h-1.5 w-full rounded-full bg-ink-4/45" />
              <div className="h-1.5 w-4/5 rounded-full bg-ink-4/30" />
              <div className="h-1.5 w-3/5 rounded-full bg-ink-4/30" />
            </div>
          </div>
        </div>
        <div className="ml-2">
          <p className="text-[13px] font-bold text-ink">A4</p>
          <p className="text-[11.5px] text-ink-3">sẵn sàng in</p>
        </div>
      </div>
    )
  }

  if (kind === 'dice') {
    return (
      <div className={base}>
        {['12', '24', '36'].map((n, i) => (
          <div
            key={n}
            className={
              'flex size-12 items-center justify-center rounded-[8px] text-[15px] font-bold tnum ' +
              (i === 1 ? '-rotate-6 bg-clay-soft text-clay' : 'bg-sunken text-ink-3')
            }
          >
            {n}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={base}>
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-sunken"
            style={{ width: `${74 - i * 18}px` }}
          />
        ))}
      </div>
      <div className="ml-2 rounded-[6px] bg-sage-soft px-3 py-1.5 text-[11.5px] font-semibold text-sage">
        1.200+
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ how it works */

function HowItWorks() {
  const STEPS = [
    {
      n: '01',
      t: 'Mô tả đề',
      d: 'Chọn môn, lớp, dạng bài và số câu — hoặc chỉ cần gõ một câu lệnh.',
    },
    {
      n: '02',
      t: 'Duyệt và chỉnh',
      d: 'Bạn xem trước trong khung soạn thảo đúng khổ A4, sửa từng câu thoải mái.',
    },
    {
      n: '03',
      t: 'Làm thử & xuất',
      d: 'Chuyển sang đề tương tác để kiểm tra, rồi xuất Word hoặc in ra giấy.',
    },
  ]

  return (
    <section className="border-y border-line/60 bg-cream/45">
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-28">
        <div>
          <p className="eyebrow mb-4">Quy trình</p>
          <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[42px]">
            Ba bước,
            <br />
            một buổi tối.
          </h2>
          <p className="mt-5 max-w-[36ch] text-[14.5px] leading-[1.75] text-ink-2">
            Đăng ký bằng email, không cần thẻ, không cần chờ ai duyệt. Vào là soạn.
          </p>
        </div>

        <ol className="space-y-4">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="anim-delay group flex gap-6 rounded-[6px] bg-surface p-6 shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lift"
              style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
            >
              <span className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-clay/70 transition-colors duration-400 group-hover:text-clay">
                {s.n}
              </span>
              <div>
                <h3 className="font-display text-[19px] font-semibold text-ink">{s.t}</h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.7] text-ink-3">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- showcase */

function Showcase() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-24 sm:px-6 lg:py-28">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="relative">
            <div
              className="absolute -inset-4 -z-10 rounded-[36px] bg-sunken/60 blur-sm"
              style={{ transform: 'rotate(-1.5deg)' }}
            />
            <div className="relative rounded-[8px] bg-surface p-3 shadow-lift">
              <div className="rounded-[10px] bg-white p-7">
                <p className="text-center font-display text-[15px] font-semibold tracking-[0.01em]">
                  ĐỀ KIỂM TRA GIỮA KỲ 2
                </p>
                <p className="mt-1.5 text-center text-[12px] italic text-ink-3">
                  Môn: Toán — Lớp: 9 — Thời gian: 45 phút
                </p>
                <div className="my-4 h-px bg-line-2" />
                <p className="eyebrow mb-3">Phần I. Trắc nghiệm</p>

                <div className="space-y-3.5">
                  {[
                    'Cho hàm số $f(x) = x^2 - 3x + 2$. Giá trị nhỏ nhất của $f(x)$ trên $\\mathbb{R}$ là',
                    'Số nghiệm dương của phương trình $\\sqrt{x+1} = x - 1$ bằng',
                  ].map((q, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="shrink-0 text-[13px] font-bold">Câu {i + 1}.</span>
                      <p className="text-[13px] leading-relaxed text-ink">
                        <MathText as="span" className="inline">
                          {q}
                        </MathText>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2">
                  {['A.  $-\\frac{9}{4}$', 'B.  $-\\frac{1}{4}$', 'C.  $\\frac{1}{4}$', 'D.  $\\frac{9}{4}$'].map(
                    (o) => (
                      <p key={o} className="text-[12.5px] text-ink-2">
                        <MathText as="span" className="inline">
                          {o}
                        </MathText>
                      </p>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="eyebrow mb-4">Chất lượng đầu ra</p>
          <h2 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink text-balance sm:text-[42px]">
            Công thức đúng.
            <br />
            Tiếng Việt đúng.
            <br />
            Bố cục đúng.
          </h2>
          <p className="mt-5 max-w-[42ch] text-[14.5px] leading-[1.75] text-ink-2">
            Đề sinh ra bám sát cấu trúc đề thi thật: phần trắc nghiệm, phần tự luận, thang điểm
            hợp lý, câu hỏi tăng dần độ khó và luôn có lời giải chi tiết.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              'Hiển thị công thức theo chuẩn toán học (KaTeX)',
              'Số câu và thang điểm tự cân bằng theo dạng bài',
              'Lời giải chi tiết kèm ghi chú phương pháp',
              'Bố cục in ra đúng khổ A4, dùng được ngay',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[14px] text-ink-2">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-clay" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------- cta */

function CallToAction() {
  return (
    <section className="mx-auto max-w-[1180px] px-5 pb-6 sm:px-6">
      <div className="relative overflow-hidden rounded-[34px] bg-ink px-8 py-16 text-center sm:px-14">
        <div
          className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full opacity-25 blur-[70px]"
          style={{ background: 'radial-gradient(circle, #d97a5c, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full opacity-20 blur-[80px]"
          style={{ background: 'radial-gradient(circle, #7fa384, transparent 70%)' }}
        />

        <div className="relative">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-paper">
            <Feather className="size-5" strokeWidth={1.6} />
          </span>
          <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-paper text-balance sm:text-[40px]">
            Đề thi của bạn đang chờ ở khung bên phải.
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-[1.75] text-paper/65">
            Miễn phí hoàn toàn. Một tài khoản email là đủ, không giới hạn số đề, không giới hạn số lần
            tải.
          </p>
          <Link to="/soan-de" className="mt-9 inline-block">
            <Button size="lg" className="bg-canvas text-ink hover:bg-white active:bg-sunken">
              Soạn đề ngay
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <p className="mt-6 text-[12.5px] text-paper/40">
            Trung bình 40 giây để có một đề hoàn chỉnh
          </p>
        </div>
      </div>
    </section>
  )
}
