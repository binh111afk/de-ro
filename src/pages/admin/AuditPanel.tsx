import { useEffect, useState } from 'react'
import { History, RefreshCw } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner } from '@/components/ui'
import { Pager } from '@/components/Pager'
import { listAudit, AUDIT_LABEL, type AuditEntry } from '@/lib/adminApi'
import { formatViDateTime, formatAuditDetail, shortenId } from './adminUtils'

export function AuditPanel() {
  const [items, setItems] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [reloadTick, setReloadTick] = useState(0)
  const perPage = 20

  useEffect(() => {
    let alive = true
    setLoading(true)
    listAudit({ page, perPage })
      .then((res) => {
        if (!alive) return
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((err) => {
        if (!alive) return
        console.error('Lỗi tải nhật ký:', err)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [page, reloadTick])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      {/* Tiêu đề & nút tải lại */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Nhật ký hoạt động</h1>
          <p className="text-[13.5px] text-ink-3">
            Lịch sử các thao tác quản trị viên đã thực hiện trên hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadTick((t) => t + 1)}
            disabled={loading}
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Bảng nhật ký */}
      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
            <thead className="border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Thao tác</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-ink-3">
                    <Spinner className="mr-2 text-ink-3" />
                    <span>Đang tải nhật ký…</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12">
                    <EmptyState
                      icon={<History className="size-6 text-ink-4" />}
                      title="Chưa có nhật ký nào"
                      description="Các thao tác như khoá tài khoản, đổi hạn mức AI sẽ được ghi lại tại đây."
                    />
                  </td>
                </tr>
              ) : (
                items.map((entry) => {
                  const actionLabel = AUDIT_LABEL[entry.action] ?? entry.action
                  const isBan = entry.action === 'users.ban'
                  const isUnban = entry.action === 'users.unban'
                  const isDelete = entry.action === 'users.delete'
                  const isQuota = entry.action.startsWith('quota.') || entry.action.startsWith('credits.')

                  return (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-sunken/40"
                    >
                      {/* Thời gian */}
                      <td className="tnum whitespace-nowrap px-4 py-3 font-medium text-ink-2">
                        {formatViDateTime(entry.createdAt)}
                      </td>

                      {/* Thao tác */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          tone={
                            isBan || isDelete
                              ? 'clay'
                              : isUnban
                              ? 'sage'
                              : isQuota
                              ? 'honey'
                              : 'neutral'
                          }
                        >
                          {actionLabel}
                        </Badge>
                      </td>

                      {/* Đối tượng */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-ink-3">
                        <span title={entry.target ?? undefined}>
                          {shortenId(entry.target)}
                        </span>
                      </td>

                      {/* Chi tiết */}
                      <td className="px-4 py-3 text-[13px] text-ink-2">
                        {formatAuditDetail(entry.action, entry.detail)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pager page={page} pages={totalPages} go={(p) => setPage(p)} />
          </div>
        ) : null}
      </Card>
    </div>
  )
}
export default AuditPanel
