import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ToolDoc, ToolImage } from '@/lib/toolSpec'
import { cn } from '@/lib/cn'
import { useReveal } from './reveal'
import { SUBJECT_GROUPS, type SubjectKey } from './toolDemos'

type RenderFn = (doc: ToolDoc) => ToolImage

export function DrawingToolsSection() {
  const [subject, setSubject] = useState<SubjectKey>('math')
  const [renderFn, setRenderFn] = useState<RenderFn | null>(null)
  const headerReveal = useReveal<HTMLDivElement>()
  const gridReveal = useReveal<HTMLDivElement>(80)

  // Chỉ nạp bộ dựng SVG khi phần Công cụ vào gần khung nhìn hoặc người dùng chọn môn, tránh chặn TBT tải đầu
  useEffect(() => {
    if (!gridReveal.shown || renderFn) return
    let cancelled = false
    void import('@/lib/toolSpec').then((m) => {
      if (!cancelled) setRenderFn(() => m.renderTool)
    })
    return () => {
      cancelled = true
    }
  }, [gridReveal.shown, renderFn])

  const group = SUBJECT_GROUPS.find((g) => g.key === subject) ?? SUBJECT_GROUPS[0]

  return (
    <section id="cong-cu" className="landing-below-fold border-b border-line bg-canvas py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6">
        <div {...headerReveal.revealProps} className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-clay">
              27 công cụ vẽ hình chuyên môn
            </p>
            <h2 className="mt-2 text-[clamp(1.45rem,2.7vw,2.1rem)] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
              Hình chuẩn sách giáo khoa cho Toán, Vật lí, Hoá học và Sinh học.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
              Không cần vẽ thủ công trong Paint hay tải ảnh mờ từ mạng. Nhập thông số là có ngay hình SVG sắc nét để chèn vào đề thi, slide hoặc bảng vẽ — nhấp đúp là sửa lại thông số cũ.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Chọn môn học xem công cụ vẽ hình"
            className="flex flex-wrap gap-1.5 rounded-[10px] border border-line bg-sunken p-1"
          >
            {SUBJECT_GROUPS.map((g) => {
              const active = g.key === subject
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSubject(g.key)}
                  className={cn(
                    'inline-flex min-h-[40px] items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[13.5px] font-semibold transition-colors',
                    active
                      ? 'bg-surface text-ink shadow-xs ring-1 ring-line'
                      : 'text-ink-2 hover:text-ink',
                  )}
                >
                  <span>{g.label}</span>
                  <span
                    className={cn(
                      'tnum rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold',
                      active ? 'bg-clay-soft text-clay-deep' : 'bg-veil text-ink-2',
                    )}
                  >
                    {g.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Giới thiệu ngắn môn đang chọn + toàn bộ công cụ trong nhóm */}
        <div className="mt-6 flex flex-col gap-3 rounded-[10px] border border-line bg-surface px-4 py-3.5 sm:px-5">
          <p className="text-[14px] leading-relaxed text-ink-2">{group.summary}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.allTools.map((name) => (
              <span
                key={name}
                className="rounded-[5px] border border-line bg-canvas px-2.5 py-1 text-[12px] font-medium text-ink-2"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* 3 hình vector thật dựng trực tiếp từ bộ máy vẽ hình của app */}
        <div
          {...gridReveal.revealProps}
          className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {group.demos.map((demo) => {
            let svgHtml = ''
            if (renderFn) {
              try {
                svgHtml = renderFn(demo.doc).svg
              } catch {
                svgHtml = ''
              }
            }
            return (
              <div
                key={demo.id}
                className="flex flex-col overflow-hidden rounded-[12px] border border-line bg-surface"
              >
                <div className="flex aspect-[4/3] w-full items-center justify-center border-b border-line bg-white p-3">
                  {svgHtml ? (
                    <div
                      role="img"
                      aria-label={demo.title}
                      className="flex h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-[6px] bg-sunken/70" aria-hidden />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-[15.5px] font-bold text-ink">{demo.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{demo.caption}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Thanh bổ sung Ma trận & đặc tả + Xáo đề */}
        <div className="mt-6 flex flex-col gap-3 rounded-[10px] border border-clay-line bg-clay-tint px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">Đi kèm trong tab Công cụ:</strong>{' '}
            lập <strong>Ma trận &amp; bản đặc tả BGD 2025</strong> (Nhận biết · Thông hiểu · Vận dụng),
            <strong> Xáo đề trắc nghiệm</strong> thành nhiều mã đề kèm đáp án, và tạo nhanh bảng số liệu.
          </div>
          <Link
            to="/soan-de"
            className="inline-flex min-h-[38px] shrink-0 self-start items-center gap-1.5 text-[13.5px] font-semibold text-clay-deep hover:text-clay sm:self-center"
          >
            Thử các công cụ trong trình soạn
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
