/** Admin › Nạp điểm: đơn nạp PayOS, tiền đã thu, hỏi lại PayOS cho đơn treo, cộng điểm tay khi đã đối soát sao kê. */
import { useEffect, useState, type ReactNode } from 'react'
import { RefreshCw, Search, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { Portal } from '@/components/Portal'
import { useDrawerExit } from './useDrawerExit'
import { Badge, Button, Card, EmptyState, inputClass, Spinner } from '@/components/ui'
import { Pager } from '@/components/Pager'
import { Segmented } from '@/components/Segmented'
import { dialog } from '@/components/Dialog'
import { cn } from '@/lib/cn'
import { getSettings, type AppSettings } from '@/lib/adminApi'
import { creditPayment, listPayments, syncPayment, type AdminPayment, type PaymentFilter, type PaymentPage, type RevenuePeriod } from '@/lib/adminPaymentsApi'
import { formatViDateTime } from './adminUtils'
import { PricingEditor } from './PricingEditor'

const fmt = (n: number) => n.toLocaleString('vi-VN')

const PERIODS: Array<{ key: RevenuePeriod; label: string; title: string }> = [
  { key: 'day', label: 'Hôm nay', title: 'Thu hôm nay' },
  { key: 'week', label: 'Tuần này', title: 'Thu tuần này' },
  { key: 'month', label: 'Tháng này', title: 'Thu tháng này' },
  { key: 'all', label: 'Tất cả', title: 'Tổng đã thu' },
]

const PREV_LABEL = { day: 'hôm qua', week: 'tuần trước', month: 'tháng trước' } as const

/** Tăng/giảm so với kỳ trước cùng thời điểm. Không có kỳ trước (tất cả) hoặc cả hai đều 0 thì không hiện. */
function Delta({ cur, prev, label }: { cur: number; prev: number; label: string }) {
  if (cur === 0 && prev === 0) return null
  const up = cur >= prev
  const diff = cur - prev
  const text = prev === 0 ? `Mới, ${label} chưa có thu` : `${up ? '+' : '−'}${Math.round((Math.abs(diff) / prev) * 100)}% so với ${label} (${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))}đ)`
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <div className={cn('mt-1 flex items-center gap-1 text-[12.5px] font-medium', up ? 'text-sage' : 'text-clay')}>
      <Icon className="size-3.5 shrink-0" />
      <span className="min-w-0">{text}</span>
    </div>
  )
}

const STATUS: Record<AdminPayment['status'], { label: string; tone: 'sage' | 'honey' | 'neutral' | 'clay' }> = {
  paid: { label: 'Đã trả', tone: 'sage' },
  pending: { label: 'Chờ trả', tone: 'honey' },
  expired: { label: 'Hết hạn', tone: 'neutral' },
  cancelled: { label: 'Đã huỷ', tone: 'neutral' },
  failed: { label: 'Lỗi', tone: 'clay' },
}

function MonthlyRevenue({ months }: { months: PaymentPage['revenue']['months'] }) {
  const max = Math.max(1, ...months.map((m) => m.vnd))
  return (
    <Card className="border border-line px-4 py-3.5 shadow-soft">
      <div className="mb-2 text-[12.5px] text-ink-3">Thu theo tháng</div>
      <ul className="space-y-1.5">
        {months.map((m, i) => {
          const [y, mo] = m.month.split('-')
          return (
            <li key={m.month} className="flex items-center gap-3 text-[13.5px]">
              <span className="w-[72px] shrink-0 text-ink-2 tnum">{`${Number(mo)}/${y}`}</span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-sunken">
                <span className={cn('block h-full rounded-full', i === 0 ? 'bg-clay' : 'bg-sage')} style={{ width: `${Math.max(2, (m.vnd / max) * 100)}%` }} />
              </span>
              <span className="w-[92px] shrink-0 text-right font-semibold text-ink tnum">{fmt(m.vnd)}đ</span>
              <span className="hidden w-12 shrink-0 text-right text-ink-3 tnum sm:block">{m.count} đơn</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function PaymentsPanel() {
  const [tab, setTab] = useState<'orders' | 'pricing'>('orders')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [period, setPeriod] = useState<RevenuePeriod>('month')
  const [filter, setFilter] = useState<PaymentFilter>('all')
  const [page, setPage] = useState(1)
  const [code, setCode] = useState('')
  const [data, setData] = useState<PaymentPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const reload = () => setTick((t) => t + 1)

  useEffect(() => {
    if (tab !== 'pricing' || settings || pricingError !== null) return
    let alive = true
    getSettings()
      .then((result) => alive && setSettings(result))
      .catch((err: unknown) => alive && setPricingError(err instanceof Error ? err.message : 'Không tải được bảng giá.'))
    return () => {
      alive = false
    }
  }, [tab, settings, pricingError])

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
  const selected = items.find((p) => p.orderCode === open) ?? null
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  const orders = (
    <div className="space-y-6">
      {data && !data.configured ? (
        <div className="rounded-[8px] border border-honey/40 bg-honey-soft px-4 py-3 text-[13.5px] text-ink-2">Chưa cấu hình PayOS trên server (thiếu biến PAYOS_*).</div>
      ) : null}

      <div className="space-y-3">
        <Segmented
          value={period}
          onChange={setPeriod}
          label="Khoảng thời gian doanh thu"
          options={PERIODS.map(({ key, label }) => ({ key, label }))}
          className="[&>button]:px-2.5 sm:[&>button]:px-4"
        />
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: PERIODS.find((p) => p.key === period)!.title,
              value: data ? `${fmt(data.revenue[period])}đ` : '…',
              delta: data && period !== 'all' ? <Delta cur={data.revenue[period]} prev={data.revenue.prev[period].vnd} label={PREV_LABEL[period]} /> : null,
            },
            {
              label: 'Số đơn đã trả',
              value: data ? fmt(data.revenue.counts[period]) : '…',
              delta: data && period !== 'all' ? <Delta cur={data.revenue.counts[period]} prev={data.revenue.prev[period].count} label={PREV_LABEL[period]} /> : null,
            },
          ].map((c) => (
            <Card key={c.label} className="min-w-0 border border-line px-4 py-3.5 shadow-soft">
              <div className="text-[12.5px] text-ink-3">{c.label}</div>
              <div className="mt-1 truncate text-[19px] font-bold text-ink tnum sm:text-[20px]">{c.value}</div>
              {c.delta}
            </Card>
          ))}
        </div>
        {data && data.revenue.months.length > 0 ? <MonthlyRevenue months={data.revenue.months} /> : null}
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
            className={cn(inputClass, 'h-9 min-w-0 flex-1 sm:w-40 sm:flex-none')}
          />
          <Button type="submit" variant="outline" size="sm" aria-label="Tìm">
            <Search className="size-3.5" />
          </Button>
        </form>
      </div>

      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
            <thead className="whitespace-nowrap border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Tạo lúc</th>
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-right">Điểm</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {loading && !items.length ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-ink-3">
                    <Spinner className="mr-2 text-ink-3" />
                    <span>Đang tải…</span>
                  </td>
                </tr>
              ) : !items.length ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState icon={<Wallet className="size-6 text-ink-4" />} title="Chưa có đơn nạp nào" />
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr
                    key={p.orderCode}
                    onClick={() => setOpen(p.orderCode)}
                    className={cn('cursor-pointer transition-colors hover:bg-sunken/40', p.attention && 'bg-honey-soft/40', open === p.orderCode && 'bg-sunken/60')}
                  >
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

      {selected ? (
        <PaymentDrawer
          key={selected.orderCode}
          p={selected}
          busy={busy === selected.orderCode}
          onSync={() => void sync(selected)}
          onCredit={() => void credit(selected)}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold tracking-tight text-ink">Nạp điểm</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          label="Nạp điểm"
          options={[{ key: 'orders', label: 'Đơn nạp' }, { key: 'pricing', label: 'Bảng giá' }]}
        />
        {tab === 'orders' ? (
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            <span>Làm mới</span>
          </Button>
        ) : null}
      </div>
      {tab === 'orders' ? orders : null}
      {settings ? (
        <div hidden={tab !== 'pricing'}>
          <PricingEditor initial={settings.pricing} onNotice={(msg) => void dialog.alert(msg, { title: 'Bảng giá' })} />
        </div>
      ) : tab === 'pricing' ? (
        pricingError !== null ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-[13px] text-clay">{pricingError}</p>
            <Button variant="outline" size="sm" onClick={() => setPricingError(null)}>Thử lại</Button>
          </div>
        ) : (
          <p role="status" className="flex items-center gap-2 text-[13px] text-ink-3">
            <Spinner className="size-3.5" />
            Đang tải bảng giá…
          </p>
        )
      ) : null}
    </div>
  )
}

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5 sm:grid-cols-[7rem_1fr]">
      <dt className="text-[13px] text-ink-3">{label}</dt>
      <dd className={cn('min-w-0 break-all text-[13.5px] text-ink', mono && 'font-mono text-[12.5px]')}>{children}</dd>
    </div>
  )
}

function PaymentDrawer({
  p,
  busy,
  onSync,
  onCredit,
  onClose,
}: {
  p: AdminPayment
  busy: boolean
  onSync: () => void
  onCredit: () => void
  onClose: () => void
}) {
  const { close, backdropClass, panelClass } = useDrawerExit(onClose)
  return (
    <Portal>
      <div className={cn('fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs', backdropClass)} onClick={close} aria-hidden="true" />
      <aside
        className={cn('fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl sm:w-[440px]', panelClass)}
        role="dialog"
        aria-label={`Đơn ${p.orderCode}`}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-6 sm:py-4">
          <div>
            <h2 className="font-mono text-[16px] font-bold text-ink">{p.orderCode}</h2>
            <div className="mt-1">
              <Badge tone={STATUS[p.status]?.tone ?? 'neutral'}>{STATUS[p.status]?.label ?? p.status}</Badge>
            </div>
          </div>
          <button type="button" onClick={close} className="rounded-[6px] p-1.5 text-ink-3 hover:bg-sunken hover:text-ink" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>

        <dl className="flex-1 divide-y divide-line-2 overflow-y-auto px-4 py-2 sm:px-6">
          <Row label="Tài khoản">{p.email || '—'}</Row>
          <Row label="Mã người dùng" mono>
            {p.userId}
          </Row>
          <Row label="Số tiền">
            <span className="font-semibold tnum">{fmt(p.vnd)}đ</span>
          </Row>
          <Row label="Điểm">
            <span className="tnum">
              {fmt(p.points)}
              {p.bonusPoints ? <span className="ml-1 text-clay">(thưởng {fmt(p.bonusPoints)})</span> : null}
            </span>
          </Row>
          <Row label="Nội dung CK" mono>
            DR{p.orderCode}
          </Row>
          <Row label="Tạo lúc">{formatViDateTime(p.createdAt)}</Row>
          <Row label="Trả lúc">{p.paidAt ? formatViDateTime(p.paidAt) : '—'}</Row>
          <Row label="Ghi chú" mono>
            {p.reference || '—'}
          </Row>
        </dl>

        {p.status !== 'paid' ? (
          <div className="flex gap-2 border-t border-line px-4 py-3.5 sm:px-6 sm:py-4">
            <Button variant="outline" className="flex-1" disabled={busy} onClick={onSync}>
              Hỏi PayOS
            </Button>
            <Button variant="outline" className="flex-1" disabled={busy} onClick={onCredit}>
              Cộng tay
            </Button>
          </div>
        ) : null}
      </aside>
    </Portal>
  )
}
export default PaymentsPanel
