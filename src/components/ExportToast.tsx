/** Thẻ tiến độ xuất file ở góc dưới phải. `<ExportToastHost />` gắn một lần ở App. */
import { useEffect, useState } from 'react'
import { DocIcon } from '@/components/docIcons'
import { Portal } from '@/components/Portal'
import type { DocKind } from '@/data/docTypes'
import { dismissExport, useExportJobs, type ExportJob } from '@/lib/exportProgress'

/** đuôi tệp → loại tài liệu sinh ra nó; còn lại (docx, zip xáo đề) là đề */
const KIND_BY_EXT: Record<string, DocKind> = { pptx: 'slide', png: 'board', pdf: 'board' }

export function ExportToastHost() {
  const jobs = useExportJobs((s) => s.jobs)
  if (!jobs.length) return null
  return (
    <Portal>
      <div className="fixed inset-x-3 bottom-3 z-[210] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:bottom-5 print:hidden">
        {jobs.map((j) => (
          <ExportCard key={j.id} job={j} />
        ))}
      </div>
    </Portal>
  )
}

function ExportCard({ job }: { job: ExportJob }) {
  const { id, name, status } = job
  const [creep, setCreep] = useState(6)
  const [closing, setClosing] = useState(false)
  const [hover, setHover] = useState(false)
  const done = status === 'done'
  const error = status === 'error'
  const pct = done ? 100 : Math.round(Math.max(creep, job.pct))
  const dot = name.lastIndexOf('.')

  // không đo được tiến độ bên trong thư viện xuất: nhích chậm dần, dừng ở 92% tới khi xong
  useEffect(() => {
    if (status !== 'running') return
    const t = setInterval(() => setCreep((c) => c + (92 - c) * 0.09), 220)
    return () => clearInterval(t)
  }, [status])

  // xong thì tự đóng; lỗi thì giữ lại tới khi bấm đóng
  useEffect(() => {
    if (!done || hover || closing) return
    const t = setTimeout(() => setClosing(true), 3200)
    return () => clearTimeout(t)
  }, [done, hover, closing])

  useEffect(() => {
    if (!closing) return
    const t = setTimeout(() => dismissExport(id), 220)
    return () => clearTimeout(t)
  }, [closing, id])

  return (
    <div
      role="status"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`${closing ? 'export-card-out' : 'export-card-in'} export-card--${status} flex w-full max-w-[320px] items-center gap-3 rounded-[10px] border-[1.5px] bg-surface p-3 shadow-float`}
    >
      <div className="relative shrink-0">
        <div className={status === 'running' ? 'export-icon-bob' : undefined}>
          <DocIcon kind={KIND_BY_EXT[name.slice(dot + 1)]} size={40} />
        </div>
        {done && (
          <span className="anim-pop absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-surface bg-sage text-white">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m3 8.5 3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {/* tên dài thì cắt phần tên, đuôi tệp luôn thấy */}
        <div className="flex text-[13.5px] font-medium text-ink" data-tip={name}>
          <span className="truncate">{name.slice(0, dot)}</span>
          <span className="shrink-0">{name.slice(dot)}</span>
        </div>
        {error ? (
          <div className="mt-1 text-[12.5px] text-clay-deep">Không xuất được file</div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken"
              role="progressbar"
              aria-label={name}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div
                className={`relative h-full overflow-hidden rounded-full transition-[width,background-color] duration-300 ease-out ${done ? 'bg-sage' : 'export-bar-run bg-clay'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-9 text-right text-[11.5px] tabular-nums text-ink-3">{pct}%</span>
          </div>
        )}
      </div>

      {status !== 'running' && (
        <button
          type="button"
          aria-label="Đóng"
          onClick={() => setClosing(true)}
          className="-mr-1 flex size-6 shrink-0 items-center justify-center self-start rounded-full text-ink-3 hover:bg-sunken hover:text-ink"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.5 3.5l9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
