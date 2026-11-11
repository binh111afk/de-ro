import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Users, FileText, BookOpen, Cpu, ArrowRight } from 'lucide-react'
import { Card, Spinner } from '@/components/ui'
import { listUsers, getAiStats, type AdminMe } from '@/lib/adminApi'
import { listContentExams, listContentReports } from '@/lib/adminContentApi'
import { loadFullBank } from '@/data/bank'
import { formatNumber } from './adminUtils'

export function OverviewPanel({ me }: { me: AdminMe }) {
  const { search } = useLocation()
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiCalls7d, setAiCalls7d] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  // undefined = đang tải, null = lỗi
  const [examCount, setExamCount] = useState<number | null>()
  const [openReports, setOpenReports] = useState(0)
  const [bankCount, setBankCount] = useState<number | null>()

  useEffect(() => {
    let alive = true
    listUsers({ perPage: 1 })
      .then((res) => {
        if (alive) setTotalUsers(res.total)
      })
      .catch(() => {
        if (alive) setTotalUsers(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    getAiStats(7)
      .then((res) => {
        if (!alive) return
        const sum = res.rows.reduce((acc, r) => acc + r.calls, 0)
        setAiCalls7d(sum)
      })
      .catch(() => {
        if (alive) setAiCalls7d(null)
      })
      .finally(() => {
        if (alive) setAiLoading(false)
      })

    listContentExams({ perPage: 1 })
      .then((res) => alive && setExamCount(res.total))
      .catch(() => alive && setExamCount(null))
    listContentReports({ status: 'open', perPage: 1 })
      .then((res) => alive && setOpenReports(res.total))
      .catch(() => {})
    loadFullBank()
      .then((b) => alive && setBankCount(b.length))
      .catch(() => alive && setBankCount(null))

    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header chào */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Tổng quan quản trị</h1>
          <p className="text-[13.5px] text-ink-3">
            Xin chào, vai trò của bạn là{' '}
            <span className="font-semibold text-ink">
              {me.role === 'admin' ? 'Quản trị viên (admin)' : 'Kiểm duyệt viên'}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Lưới thẻ số liệu */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Thẻ người dùng thật */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">Tổng người dùng</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <Users className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              {loading ? (
                <div className="flex h-10 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[32px] font-bold tracking-tight text-ink">
                  {formatNumber(totalUsers)}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-line-2 pt-3">
            <Link
              to={`/admin/nguoi-dung${search}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-clay transition-colors hover:text-clay-deep"
            >
              <span>Xem danh sách</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Thẻ Nội dung */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">Nội dung cộng đồng</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <FileText className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              {examCount === undefined ? (
                <div className="flex h-10 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[32px] font-bold tracking-tight text-ink">
                  {examCount === null ? '—' : formatNumber(examCount)}
                  <span className="ml-1.5 text-[12.5px] font-normal text-ink-3">đề</span>
                </div>
              )}
            </div>
            {openReports ? (
              <p className="mt-1 text-[12.5px] font-medium text-clay">{formatNumber(openReports)} báo cáo chờ xử lý</p>
            ) : null}
          </div>
          <div className="mt-4 border-t border-line-2 pt-3">
            <Link
              to={`/admin/noi-dung${search}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-clay transition-colors hover:text-clay-deep"
            >
              <span>Quản lý nội dung</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Thẻ Ngân hàng */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">Ngân hàng câu hỏi</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <BookOpen className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              {bankCount === undefined ? (
                <div className="flex h-10 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[32px] font-bold tracking-tight text-ink">
                  {bankCount === null ? '—' : formatNumber(bankCount)}
                  <span className="ml-1.5 text-[12.5px] font-normal text-ink-3">câu</span>
                </div>
              )}
            </div>

          </div>
          <div className="mt-4 border-t border-line-2 pt-3">
            <Link
              to={`/admin/ngan-hang${search}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-clay transition-colors hover:text-clay-deep"
            >
              <span>Quản lý câu hỏi</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>

        {/* Thẻ AI & Máy chủ */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">AI & Máy chủ</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <Cpu className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              {aiLoading ? (
                <div className="flex h-10 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[32px] font-bold tracking-tight text-ink">
                  {formatNumber(aiCalls7d)}
                  <span className="ml-1.5 text-[12.5px] font-normal text-ink-3">
                    lượt / 7 ngày
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-line-2 pt-3">
            <Link
              to={`/admin/ai${search}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-clay transition-colors hover:text-clay-deep"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
