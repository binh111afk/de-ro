import { useEffect, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Home } from 'lucide-react'
import { Button } from '@/components/ui'

const OPTIONS = [
  { key: 'A', text: 'Đã bị xoá', delay: 280 },
  { key: 'B', text: 'Đường dẫn gõ sai', delay: 360 },
  { key: 'C', text: 'Đề đã được chuyển chỗ khác', delay: 440 },
  { key: 'D', text: 'Cả ba ý trên', delay: 520 },
] as const

const TAB_TITLE = 'Không tìm thấy trang · đề rõ'

function delayStyle(ms: number, dur?: number): CSSProperties {
  return {
    '--nf-d': `${ms}ms`,
    ...(dur !== undefined ? { '--nf-dur': `${dur}ms` } : {}),
  } as CSSProperties
}

export default function NotFound() {
  const { pathname, search } = useLocation()
  const requestedPath = `${pathname}${search}`

  useEffect(() => {
    const prev = document.title
    document.title = TAB_TITLE
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-[960px] flex-col px-4 py-6 sm:px-6 sm:py-10 [@media(max-height:480px)]:py-4">
      <div className="my-auto grid w-full items-center gap-7 sm:gap-9 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:gap-12">
        {/* Tờ đề thi bị chấm */}
        <div className="nf-paper mx-auto w-full max-w-[520px] min-w-0 lg:mx-0">
          <div className="nf-float relative rounded-[10px] border border-line bg-surface p-5 shadow-soft sm:p-7">
            <div className="flex items-start justify-between gap-3 border-b border-line pb-3.5">
              <p className="eyebrow pt-1.5 leading-snug">ĐỀ KIỂM TRA · Mã đề 404</p>

              {/* Điểm 404 viết tay bằng bút đỏ ở góc */}
              <svg
                viewBox="0 0 96 46"
                className="-mr-1 -mt-1 h-auto w-[clamp(72px,17vw,98px)] shrink-0 -rotate-6 text-clay"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M 19 6 C 15 12, 11 17, 7 22 C 13 21.5, 20 21, 27 21 M 21.5 11 C 20.5 18, 19.8 25, 19 32"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={3.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nf-draw"
                  style={delayStyle(1520, 160)}
                />
                <path
                  d="M 47 8 C 38 8, 34 15, 35 23 C 36 30, 44 32, 51 28 C 57 24, 57 12, 49 8 C 46 7, 43 8, 42 10"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={3.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nf-draw"
                  style={delayStyle(1650, 170)}
                />
                <path
                  d="M 77 5 C 73 11, 69 16, 65 21 C 72 20.5, 79 20, 87 20 M 80 10 C 79.2 17, 78.6 24, 78 31"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={3.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="nf-draw"
                  style={delayStyle(1780, 160)}
                />
                <path
                  d="M 8 38 C 33 35.5, 63 34.5, 87 36.5"
                  pathLength={1}
                  stroke="currentColor"
                  strokeWidth={2.3}
                  strokeLinecap="round"
                  className="nf-draw"
                  style={delayStyle(1900, 180)}
                />
              </svg>
            </div>

            <div className="mt-4 sm:mt-5">
              <p
                className="nf-step text-[15px] leading-relaxed text-ink sm:text-[16px]"
                style={delayStyle(180)}
              >
                <strong className="font-display font-bold text-ink">Câu 404.</strong>{' '}
                <span>Trang bạn tìm nằm ở đâu?</span>
              </p>

              <ul className="mt-3.5 space-y-2.5 text-[14.5px] leading-snug text-ink-2 sm:mt-4 sm:space-y-3 sm:text-[15px]">
                {OPTIONS.map((opt) => {
                  const picked = opt.key === 'D'
                  return (
                    <li
                      key={opt.key}
                      className="nf-step flex min-w-0 items-baseline gap-2.5"
                      style={delayStyle(opt.delay)}
                    >
                      <span
                        className={
                          picked
                            ? 'relative inline-flex shrink-0 items-center justify-center font-semibold text-clay'
                            : 'inline-flex shrink-0 font-semibold text-ink'
                        }
                      >
                        {opt.key}.
                        {picked && (
                          <svg
                            viewBox="0 0 46 36"
                            className="pointer-events-none absolute -inset-x-2 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+16px)] overflow-visible text-clay"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M 30 6 C 18 3, 5 9, 4 19 C 3 29, 16 33, 29 31 C 41 29, 44 19, 40 11 C 37 6, 27 5, 20 8"
                              pathLength={1}
                              stroke="currentColor"
                              strokeWidth={2.3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="nf-draw"
                              style={delayStyle(820, 550)}
                            />
                          </svg>
                        )}
                      </span>
                      <span className={picked ? 'min-w-0 font-medium text-ink' : 'min-w-0'}>
                        {opt.text}
                      </span>
                      {picked && (
                        <svg
                          viewBox="0 0 32 24"
                          className="ml-0.5 h-[1.15em] w-auto shrink-0 self-center overflow-visible text-clay"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M 4 13 C 7 15.5, 10 18.5, 11.5 20 C 16 14, 21.5 8.5, 28 4"
                            pathLength={1}
                            stroke="currentColor"
                            strokeWidth={2.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="nf-draw"
                            style={delayStyle(1320, 240)}
                          />
                        </svg>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Tiêu đề, đường dẫn sai và nút điều hướng */}
        <div
          className="nf-step mx-auto w-full max-w-[520px] min-w-0 text-center lg:mx-0 lg:text-left"
          style={delayStyle(180)}
        >
          <h1 className="font-display text-[clamp(1.5rem,3vw,2.125rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink">
            Không tìm thấy trang
          </h1>
          <p className="mt-2.5 text-[15px] leading-[1.65] text-ink-2">
            Đường dẫn có thể đã cũ hoặc bị gõ sai.
          </p>

          <div className="mt-4 flex justify-center lg:justify-start">
            <p className="inline-flex max-w-full min-w-0 items-center rounded-[6px] border border-line bg-sunken/70 px-3 py-1.5 font-mono text-[12.5px] text-ink-3">
              <span className="truncate">{requestedPath}</span>
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="min-h-11 w-full sm:w-auto">
                <Home className="size-4" />
                Về trang chủ
              </Button>
            </Link>
            <Link to="/de-cong-dong" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="min-h-11 w-full sm:w-auto">
                <BookOpen className="size-4" />
                Xem đề cộng đồng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
