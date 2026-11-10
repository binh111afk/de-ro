import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Users, FileText, BookOpen, Cpu, ArrowRight } from 'lucide-react'
import { Card, EmptyState, Spinner } from '@/components/ui'
import { listUsers, type AdminMe } from '@/lib/adminApi'
import { formatNumber } from './adminUtils'

export function OverviewPanel({ me }: { me: AdminMe }) {
  const { search } = useLocation()
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

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

        {/* Thẻ Sắp có: Nội dung */}
        <Card className="flex flex-col justify-between border border-line bg-surface/70 p-5 shadow-soft">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">Nội dung cộng đồng</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-4">
                <FileText className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-[4px] bg-sunken px-2 py-0.5 text-[12px] font-medium text-ink-3">
                Sắp có
              </span>
            </div>
          </div>
          <p className="mt-4 border-t border-line-2 pt-3 text-[12px] text-ink-4">
            Đề cộng đồng, tài liệu và báo cáo vi phạm
          </p>
        </Card>

        {/* Thẻ Sắp có: Ngân hàng */}
        <Card className="flex flex-col justify-between border border-line bg-surface/70 p-5 shadow-soft">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">Ngân hàng câu hỏi</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-4">
                <BookOpen className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-[4px] bg-sunken px-2 py-0.5 text-[12px] font-medium text-ink-3">
                Sắp có
              </span>
            </div>
          </div>
          <p className="mt-4 border-t border-line-2 pt-3 text-[12px] text-ink-4">
            1.198 câu hỏi mẫu và kho đề thi
          </p>
        </Card>

        {/* Thẻ Sắp có: AI & Server */}
        <Card className="flex flex-col justify-between border border-line bg-surface/70 p-5 shadow-soft">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink-3">AI & Máy chủ</span>
              <div className="flex size-9 items-center justify-center rounded-[6px] bg-sunken text-ink-4">
                <Cpu className="size-4.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block rounded-[4px] bg-sunken px-2 py-0.5 text-[12px] font-medium text-ink-3">
                Sắp có
              </span>
            </div>
          </div>
          <p className="mt-4 border-t border-line-2 pt-3 text-[12px] text-ink-4">
            Thống kê token, độ trễ và chi phí model
          </p>
        </Card>
      </div>

      {/* Thông tin giai đoạn */}
      <Card className="border border-line p-6 shadow-soft">
        <EmptyState
          title="Giai đoạn 1: Nền tảng & Quản lý người dùng"
          description="Hiện tại bạn có thể quản lý danh sách người dùng, thiết lập hạn mức AI, cộng điểm token, khoá tài khoản và tra cứu nhật ký thao tác."
        />
      </Card>
    </div>
  )
}
