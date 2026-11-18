/** Admin › Nạp điểm: đơn nạp PayOS, tiền đã thu, hỏi lại PayOS cho đơn treo, cộng điểm tay khi đã đối soát sao kê. */
import { useEffect, useState } from 'react'
import { RefreshCw, Search, Wallet } from 'lucide-react'
import { Badge, Button, Card, EmptyState, inputClass, Spinner } from '@/components/ui'
import { Pager } from '@/components/Pager'
import { Segmented } from '@/components/Segmented'
import { dialog } from '@/components/Dialog'
import { cn } from '@/lib/cn'
import { creditPayment, listPayments, syncPayment, type AdminPayment, type PaymentFilter, type PaymentPage } from '@/lib/adminPaymentsApi'
import { formatViDateTime } from './adminUtils'

const fmt = (n: number) => n.toLocaleString('vi-VN')

const STATUS: Record<AdminPayment['status'], { label: string; tone: 'sage' | 'honey' | 'neutral' | 'clay' }> = {
  paid: { label: 'Đã trả', tone: 'sage' },
  pending: { label: 'Chờ trả', tone: 'honey' },
  expired: { label: 'Hết hạn', tone: 'neutral' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
  failed: { label: 'Lỗi', tone: 'clay' },
}

export function PaymentsPanel() {
  const [filter, setFilter] = useState<PaymentFilter>('all')
  const [page, setPage] = useState(1)
  const [code, setCode] = useState('')
  const [data, setData] = useState<PaymentPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const reload = () => setTick((t) => t + 1)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const orderCode = Number(code.replace(/\D/g, '')) || undefined
    listPayments({ filter, page, orderCode })
      .then((r) => alive && setData(r))
      .catch((err: unknown) => alive && void dialog.alert(err instanceof Error ? err.message : String(err), { title: 'Không tải được đơn nạp' }))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // code chỉ áp khi bấm tìm (qua tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, tick])

  const sync = async (p: AdminPayment) => {
    setBusy(p.orderCode)
    try {
      const r = await syncPayment(p.orderCode)
      const msg =
        r.status === 'paid'
          ? 'PayOS báo đã trả, đã cộng điểm.'
          : r.payos === 'UNDERPAID'
            ? 'PayOS báo trả thiếu. Đơn vẫn chờ, xem ghi chú số tiền đã nhận.'
            : `PayOS báo: ${r.payos ?? 'không trả lời'}. Trạng thái đơn: ${STATUS[r.status]?.label ?? r.status}.`
      void dialog.alert(msg, { title: `Đơn ${p.orderCode}` })
      reload()
    } catch (err) {
      void dialog.alert(err instanceof Error ? err.message : String(err), { title: 'Không hỏi được PayOS' })
    } finally {
      setBusy(null)
    }
  }

  const credit = async (p: AdminPayment) => {
    const note = await dialog.prompt(
      `Cộng ${fmt(p.points)} điểm cho ${p.email || p.userId} (đơn ${p.orderCode}, ${fmt(p.vnd)}đ). Chỉ làm khi sao kê đã có đủ tiền. Ghi mã giao dịch ngân hàng:`,
      { title: 'Cộng điểm tay', confirmLabel: 'Cộng điểm' },
    )
    if (!note?.trim()) return
    setBusy(p.orderCode)
    try {
      await creditPayment(p.orderCode, note.trim())
      reload()
    } catch (err) {
      void dialog.alert(err instanceof Error ? err.message : String(err), { title: 'Không cộng được điểm' })
    } finally {
      setBusy(null)
    }
  }

  const items = data?.items ?? []
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">Nạp điểm</h1>
        <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          <span>Làm mới</span>
        </Button>
      </div>

      {data && !data.configured ? (
        <div className="rounded-[8px] border border-honey/40 bg-honey-soft px-4 py-3 text-[13.5px] text-ink-2">Chưa cấu hình PayOS trên server (thiếu biến PAYOS_*).</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Thu tháng này', value: data ? `${fmt(data.revenue.month)}đ` : '…' },
          { label: 'Tổng đã thu', value: data ? `${fmt(data.revenue.all)}đ` : '…' },
          { label: 'Số đơn đã trả', value: data ? fmt(data.revenue.paidCount) : '…' },
        ].map((c) => (
          <Card key={c.label} className="border border-line px-4 py-3.5 shadow-soft">
            <div className="text-[12.5px] text-ink-3">{c.label}</div>
            <div className="mt-1 text-[20px] font-bold text-ink tnum">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={filter}
          onChange={(f) => {
            setFilter(f)
            setPage(1)
          }}
          label="Lọc đơn"
          options={[
            { key: 'all', label: 'Tất cả' },
            { key: 'attention', label: 'Cần xem' },
            { key: 'pending', label: 'Chờ trả' },
            { key: 'paid', label: 'Đã trả' },
            { key: 'closed', label: 'Huỷ / hết hạn' },
          ]}
        />
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            reload()
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="Mã đơn"
            aria-label="Tìm theo mã đơn"
            className={cn(inputClass, 'h-9 w-36')}
          />
          <Button type="submit" variant="outline" size="sm" aria-label="Tìm">
            <Search className="size-3.5" />
          </Button>
        </form>
      </div>

      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-[13.5px]">
            <thead className="whitespace-nowrap border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-right">Điểm</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {loading && !items.length ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink-3">
                    <Spinner className="mr-2 text-ink-3" />
                    <span>Đang tải…</span>
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState icon={<Wallet className="size-6 text-ink-4" />} title="Chưa có đơn nạp nào" />
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.orderCode} className={cn('transition-colors hover:bg-sunken/40', p.attention && 'bg-honey-soft/40')}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-ink-2">{p.orderCode}</td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-ink-2">{formatViDateTime(p.createdAt)}</td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-ink" data-tip={p.userId}>
                      {p.email || p.userId}
                    </td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">{fmt(p.vnd)}đ</td>
                    <td className="tnum whitespace-nowrap px-4 py-3 text-right text-ink-2">
                      {fmt(p.points)}
                      {p.bonusPoints ? <span className="ml-1 text-[12px] text-clay">(+{fmt(p.bonusPoints)})</span> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={STATUS[p.status]?.tone ?? 'neutral'}>{STATUS[p.status]?.label ?? p.status}</Badge>
                    </td>
                    <td className="max-w-[16rem] truncate px-4 py-3 font-mono text-[12px] text-ink-3" data-tip={p.reference ?? undefined}>
                      {p.reference ?? ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {p.status !== 'paid' ? (
                        <div className="flex justify-end gap-1.5">
                          <Button variant="outline" size="sm" disabled={busy === p.orderCode} onClick={() => void sync(p)}>
                            Hỏi PayOS
                          </Button>
                          <Button variant="outline" size="sm" disabled={busy === p.orderCode} onClick={() => void credit(p)}>
                            Cộng tay
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pager page={page} pages={pages} go={setPage} />
          </div>
        ) : null}
      </Card>
    </div>
  )
}
export default PaymentsPanel
