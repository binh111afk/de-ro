import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Flag, MessageSquare, RotateCcw, Send, ThumbsDown } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import { Segmented } from '@/components/Segmented'
import { Pager, usePaged } from '@/components/Pager'
import {
  getAiFeedbackDetail,
  getAiFeedbackOverview,
  type AiFeedbackDays,
  type AiFeedbackDetail,
  type AiFeedbackItem,
  type AiFeedbackOverview,
} from '@/lib/adminAiFeedbackApi'
import { formatNumber, formatViDateTime } from './adminUtils'

const periods = [
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
] as const
type Period = (typeof periods)[number]['key']

const modeLabel = { exam: 'Soạn đề', slide: 'Slide', board: 'Bảng vẽ' }
const kinds = {
  down: { label: 'Không thích', tone: 'clay', Icon: ThumbsDown },
  undo: { label: 'Hoàn tác', tone: 'honey', Icon: RotateCcw },
  resend: { label: 'Gửi lại', tone: 'neutral', Icon: Send },
  complaint: { label: 'Báo sai', tone: 'clay', Icon: Flag },
} as const
const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 })
const collapse = 'grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 motion-safe:ease-in-out'

function FeedbackItem({ item }: { item: AiFeedbackItem }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<AiFeedbackDetail | 'loading' | null>()
  const detailId = useId()
  const { label, tone, Icon } = kinds[item.kind]

  const toggle = () => {
    setOpen(!open)
    if (open || detail) return
    setDetail('loading')
    getAiFeedbackDetail(item.id).then(setDetail, () => setDetail(null))
  }

  return (
    <>
      <button type="button" aria-expanded={open} aria-controls={detailId} onClick={toggle} className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-start gap-2 px-3 py-2.5 text-left text-[13px] hover:bg-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay aria-expanded:bg-sunken/60 motion-safe:transition-colors">
        <span className="block min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
            <span className="inline-flex items-center gap-2">
              <Badge tone={tone} className={`py-0.5 ${item.kind === 'complaint' ? 'text-clay-deep ring-1 ring-clay-line ring-inset' : ''}`}>
                <Icon aria-hidden className="size-3" />
                {label}
              </Badge>
              <span>{modeLabel[item.mode]}</span>
            </span>
            <time className="ml-auto text-right tabular-nums" dateTime={item.createdAt}>{formatViDateTime(item.createdAt)}</time>
          </span>
          {item.user && (item.user.name || item.user.email) && (
            <span className="mt-1.5 flex min-w-0 gap-2">
              {item.user.name && <span className="truncate font-semibold text-ink">{item.user.name}</span>}
              {item.user.email && <span className="truncate text-ink-3">{item.user.email}</span>}
            </span>
          )}
          {item.request && (
            <span aria-hidden={open} className={`${collapse} ${open ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'}`}>
              <span className="min-h-0 overflow-hidden">
                <span className="mt-1.5 line-clamp-2 text-ink-2 [overflow-wrap:anywhere]">{item.request}</span>
              </span>
            </span>
          )}
        </span>
        <ChevronDown aria-hidden className={`mt-0.5 size-4 text-ink-3 motion-safe:transition-transform motion-safe:duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div id={detailId} inert={!open} className={`${collapse} ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-3 px-3 py-3 text-[13px]">
            {detail === 'loading' ? (
              <div role="status" aria-label="Đang tải nội dung" className={`grid gap-2 sm:grid-cols-2 ${open ? 'motion-safe:animate-pulse' : ''}`}>
                {[0, 1].map((index) => (
                  <div key={index} aria-hidden className="space-y-2 rounded-md bg-sunken p-2.5">
                    <div className="h-2.5 w-14 rounded-full bg-line-2" />
                    <div className="h-2 w-4/5 rounded-full bg-line-2" />
                  </div>
                ))}
              </div>
            ) : detail === null ? (
              <p role="alert" className="text-clay">Không tải được nội dung phản hồi.</p>
            ) : detail && (
              <>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div className="min-w-0 rounded-md bg-sunken p-2.5">
                    <dt className="mb-1 text-xs font-semibold text-ink">Yêu cầu</dt>
                    <dd tabIndex={0} className="max-h-48 overflow-y-auto whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{detail.request || '—'}</dd>
                  </div>
                  <div className="min-w-0 rounded-md bg-sunken p-2.5">
                    <dt className="mb-1 text-xs font-semibold text-ink">Trả lời</dt>
                    <dd tabIndex={0} className="max-h-48 overflow-y-auto whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{detail.reply || '—'}</dd>
                  </div>
                </dl>
                {item.note.trim() && item.note.trim() !== detail.request.trim() && (
                  <p className="whitespace-pre-wrap text-ink-2 [overflow-wrap:anywhere]">{item.note}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function FeedbackOverview({ overview }: { overview?: AiFeedbackOverview }) {
  const listHeading = useRef<HTMLHeadingElement>(null)
  const { items, page, pages, go } = usePaged(overview?.items ?? [], 10, overview)

  return (
    <>
      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full table-fixed text-left text-xs [overflow-wrap:anywhere] sm:text-[13px] [&_td]:px-1.5 [&_td]:py-2.5 [&_th]:px-1.5 [&_th]:py-2.5 sm:[&_td]:px-4 sm:[&_th]:px-4">
          <thead className="border-b border-line bg-sunken/80 text-xs text-ink-3">
            <tr>
              <th scope="col" className="w-[21%] font-semibold">Chế độ</th>
              <th scope="col" className="w-[17%] text-right font-semibold">Lượt AI</th>
              <th scope="col" className="w-[18%] text-right font-semibold">Hài lòng</th>
              <th scope="col" className="w-[22%] text-right font-semibold">Không hài lòng</th>
              <th scope="col" className="w-[22%] text-right font-semibold">Tỉ lệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2 text-ink-2">
            {overview ? overview.modes.map((row) => {
              const rate = row.dissatisfactionRate
              return (
                <tr key={row.mode} className="tabular-nums hover:bg-sunken/60 motion-safe:transition-colors">
                  <th scope="row" className="font-medium text-ink">{modeLabel[row.mode]}</th>
                  <td className="text-right">{formatNumber(row.successfulCalls)}</td>
                  <td className="text-right">{formatNumber(row.counts.up)}</td>
                  <td className="text-right">{formatNumber(row.dissatisfied)}</td>
                  <td className="text-right">
                    {rate === null ? '—' : (
                      <>
                        <span className="font-medium text-ink">{percent.format(rate)}</span>
                        <div aria-hidden className="mt-1 ml-auto h-1 w-full max-w-20 overflow-hidden rounded-full bg-sunken">
                          <div
                            className={`h-full rounded-full ${rate >= 0.1 ? 'bg-clay' : 'bg-sage'}`}
                            style={{ width: `${Math.min(1, Math.max(0, rate)) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              )
            }) : [0, 1, 2].map((index) => (
              <tr key={index} aria-hidden className="motion-safe:animate-pulse">
                <td><div className="h-3 w-4/5 rounded-full bg-sunken" /></td>
                {[0, 1, 2, 3].map((cell) => (
                  <td key={cell}><div className="ml-auto h-3 w-3/5 max-w-10 rounded-full bg-sunken" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 ref={listHeading} className="mt-5 scroll-mt-36 text-[13.5px] font-semibold text-ink">Phản hồi không hài lòng</h3>
      {!overview ? (
        <div className="mt-2 divide-y divide-line overflow-hidden rounded-md border border-line motion-safe:animate-pulse" aria-hidden>
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-2 px-3 py-3">
              <div className="h-4 w-24 rounded-full bg-sunken" />
              <div className="h-3 w-3/4 rounded-full bg-sunken" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <ul className="mt-2 divide-y divide-line overflow-hidden rounded-md border border-line">
          {items.map((item) => <li key={item.id}><FeedbackItem item={item} /></li>)}
        </ul>
      ) : (
        <div className="mt-2 grid justify-items-center gap-2 rounded-md border border-line bg-sunken/60 px-3 py-5 text-center text-ink-3">
          <MessageSquare aria-hidden className="size-4" />
          <p className="text-[13px]">Chưa có phản hồi không hài lòng.</p>
        </div>
      )}
      {pages > 1 && (
        <div className="max-sm:[&_nav]:gap-1 max-sm:[&_button]:min-w-7 max-sm:[&_button]:px-1">
          <Pager page={page} pages={pages} go={(next) => {
            go(next)
            listHeading.current?.scrollIntoView()
          }} />
        </div>
      )}
    </>
  )
}

export function AiFeedbackCard() {
  const [selection, setSelection] = useState<{ period: Period }>({ period: '30' })
  const [result, setResult] = useState<{ selection: typeof selection; overview: AiFeedbackOverview | null }>()
  const loading = result?.selection !== selection
  const overview = result?.overview
  const unavailable = overview === null || overview?.unavailable
  const refreshing = loading && !!overview && !unavailable

  useEffect(() => {
    let active = true
    getAiFeedbackOverview(Number(selection.period) as AiFeedbackDays).then(
      (overview) => { if (active) setResult({ selection, overview }) },
      () => { if (active) setResult({ selection, overview: null }) },
    )
    return () => { active = false }
  }, [selection])

  return (
    <Card as="section" className="min-w-0 overflow-hidden border border-line p-3 shadow-soft sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-ink">Phản hồi AI</h2>
        <Segmented label="Khoảng thời gian" value={selection.period} options={[...periods]} onChange={(period) => {
          if (period !== selection.period) setSelection({ period })
        }} />
      </div>
      {loading && <div role="status" aria-label="Đang tải phản hồi" />}
      <div aria-busy={loading} inert={refreshing} className={`motion-safe:transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
        {!loading && unavailable ? (
          <p role="alert" className="py-3 text-[13px] text-clay">Không tải được phản hồi AI.</p>
        ) : (
          <FeedbackOverview key={unavailable ? undefined : result?.selection.period} overview={unavailable ? undefined : overview ?? undefined} />
        )}
      </div>
    </Card>
  )
}
