import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge, Card, Spinner } from '@/components/ui'
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
const modeLabel = { exam: 'Soạn đề', slide: 'Slide', board: 'Bảng vẽ' }
const kindLabel = { down: 'Không thích', undo: 'Hoàn tác', resend: 'Gửi lại', complaint: 'Báo sai' }
const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 })

function FeedbackItem({ item }: { item: AiFeedbackItem }) {
  const [detail, setDetail] = useState<AiFeedbackDetail | 'loading' | null>()

  const loadDetail = () => {
    if (detail) return
    setDetail('loading')
    getAiFeedbackDetail(item.id).then(setDetail, () => setDetail(null))
  }

  return (
    <details className="group" onToggle={(event) => { if (event.currentTarget.open) loadDetail() }}>
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-sm px-2 py-2.5 text-[13px] hover:bg-sunken/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay [&::-webkit-details-marker]:hidden">
        <span className="block min-w-0 space-y-1.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
            <span className="inline-flex items-center gap-2">
              <Badge className="py-0.5">{kindLabel[item.kind]}</Badge>
              <span>{modeLabel[item.mode]}</span>
            </span>
            <time className="ml-auto text-right tabular-nums" dateTime={item.createdAt}>{formatViDateTime(item.createdAt)}</time>
          </span>
          {item.user && (item.user.name || item.user.email) && (
            <span className="flex min-w-0 gap-2">
              {item.user.name && <span className="truncate font-semibold text-ink">{item.user.name}</span>}
              {item.user.email && <span className="truncate text-ink-3">{item.user.email}</span>}
            </span>
          )}
          {item.request && (
            <span className="line-clamp-2 text-ink-2 [overflow-wrap:anywhere] group-open:hidden">{item.request}</span>
          )}
        </span>
        <ChevronDown aria-hidden className="mt-0.5 size-4 text-ink-3 group-open:rotate-180" />
      </summary>
      <div className="grid gap-3 px-2 pb-3 text-[13px]">
        {detail === 'loading' || detail === undefined ? (
          <div role="status" aria-label="Đang tải nội dung"><Spinner className="size-4" /></div>
        ) : detail === null ? (
          <p role="alert" className="text-clay">Không tải được nội dung phản hồi.</p>
        ) : (
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
    </details>
  )
}

function FeedbackOverview({ days }: { days: AiFeedbackDays }) {
  const [overview, setOverview] = useState<AiFeedbackOverview | null>()
  const listHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    let active = true
    getAiFeedbackOverview(days).then(
      (data) => { if (active) setOverview(data) },
      () => { if (active) setOverview(null) },
    )
    return () => { active = false }
  }, [days])
  const { items, page, pages, go } = usePaged(overview?.items ?? [], 10)

  if (overview === undefined) return <div className="py-6 text-center" role="status" aria-label="Đang tải phản hồi"><Spinner className="size-4" /></div>
  if (overview === null || overview.unavailable) return <p role="alert" className="py-3 text-[13px] text-clay">Không tải được phản hồi AI.</p>

  return (
    <>
      <div className="overflow-x-auto rounded-[6px] border border-line">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line bg-sunken/80 text-xs text-ink-3">
            <tr>
              <th scope="col" className="px-2 py-2.5 font-semibold sm:px-4">Chế độ</th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold sm:px-4">Lượt AI</th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold sm:px-4">Hài lòng</th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold sm:px-4">Không hài lòng</th>
              <th scope="col" className="px-2 py-2.5 text-right font-semibold sm:px-4">Tỉ lệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2 text-ink-2">
            {overview.modes.map((row) => (
              <tr key={row.mode} className="tabular-nums">
                <th scope="row" className="px-2 py-2.5 font-medium text-ink sm:px-4">{modeLabel[row.mode]}</th>
                <td className="px-2 py-2.5 text-right sm:px-4">{formatNumber(row.successfulCalls)}</td>
                <td className="px-2 py-2.5 text-right sm:px-4">{formatNumber(row.counts.up)}</td>
                <td className="px-2 py-2.5 text-right sm:px-4">{formatNumber(row.dissatisfied)}</td>
                <td className="px-2 py-2.5 text-right sm:px-4">{row.dissatisfactionRate === null ? '—' : percent.format(row.dissatisfactionRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 ref={listHeading} className="mt-5 scroll-mt-36 text-[13.5px] font-semibold text-ink">Phản hồi không hài lòng</h3>
      {items.length ? (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {items.map((item) => <li key={item.id}><FeedbackItem item={item} /></li>)}
        </ul>
      ) : <p className="mt-2 text-[13px] text-ink-3">Chưa có phản hồi không hài lòng.</p>}
      <Pager page={page} pages={pages} go={(next) => {
        go(next)
        listHeading.current?.scrollIntoView()
      }} />
    </>
  )
}

export function AiFeedbackCard() {
  const [period, setPeriod] = useState<(typeof periods)[number]['key']>('30')
  const days = Number(period) as AiFeedbackDays
  return (
    <Card as="section" className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-ink">Phản hồi AI</h2>
        <Segmented label="Khoảng thời gian" value={period} options={[...periods]} onChange={setPeriod} />
      </div>
      <FeedbackOverview key={days} days={days} />
    </Card>
  )
}
