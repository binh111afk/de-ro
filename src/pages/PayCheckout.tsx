/**
 * Khung thanh toán tự vẽ: mã QR VietQR (chuỗi PayOS trả khi tạo đơn) + thông tin chuyển khoản, tự hỏi trạng thái đơn.
 * Thay khung nhúng của PayOS (trang ngoài, tải chậm, bị trình duyệt ép tối). Điểm chỉ cộng ở server.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'
import { Check, Copy, X } from 'lucide-react'
import { Portal } from '@/components/Portal'
import { Spinner } from '@/components/ui'
import { paymentStatus, type PaymentOrder } from '@/lib/payClient'

/** BIN Napas → tên ngân hàng (các ngân hàng PayOS hay liên kết); lạ thì hiện mã */
const BANKS: Record<string, string> = {
  '970422': 'MB Bank',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970448': 'OCB',
  '970441': 'VIB',
  '970452': 'KienlongBank',
}

const fmt = (n: number) => n.toLocaleString('vi-VN')
/** hỏi trạng thái đơn mỗi 3 giây khi khung đang mở */
const POLL_MS = 3000

function QrSvg({ text }: { text: string }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(text)
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
    return { n, d }
  }, [text])
  return (
    <svg viewBox={`-2 -2 ${cells.n + 4} ${cells.n + 4}`} className="size-full" shapeRendering="crispEdges" role="img" aria-label="Mã QR chuyển khoản">
      <rect x={-2} y={-2} width={cells.n + 4} height={cells.n + 4} fill="#fff" />
      <path d={cells.d} fill="#14181c" />
    </svg>
  )
}

/** `copy`: chuỗi chép vào bộ nhớ (bỏ trống = không có nút chép) */
function CopyRow({ label, value, copy }: { label: string; value: string; copy?: string }) {
  const [done, setDone] = useState(false)
  const onCopy = () => {
    if (!copy) return
    void navigator.clipboard?.writeText(copy).then(() => {
      setDone(true)
      window.setTimeout(() => setDone(false), 1500)
    })
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="shrink-0 text-[0.8125rem] text-ink-3">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-right text-[0.875rem] font-semibold text-ink tnum">{value}</span>
        {copy ? (
          <button
            type="button"
            onClick={onCopy}
            className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            aria-label={`Chép ${label.toLowerCase()}`}
            data-tip={done ? 'Đã chép' : 'Chép'}
          >
            {done ? <Check className="size-3.5 text-sage" /> : <Copy className="size-3.5" />}
          </button>
        ) : null}
      </span>
    </div>
  )
}

export function PayCheckout({
  order,
  onClose,
  onPaid,
}: {
  order: PaymentOrder
  onClose: () => void
  onPaid: (points: number) => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const [state, setState] = useState<'waiting' | 'expired'>('waiting')
  const box = useRef<HTMLDivElement>(null)
  const left = Math.max(0, order.expiresAt * 1000 - now)
  const expired = state === 'expired' || left === 0

  // đồng hồ đếm ngược
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  // tự hỏi trạng thái đơn; tiền về thì báo ngay
  useEffect(() => {
    let alive = true
    let timer = 0
    const tick = async () => {
      const o = await paymentStatus(order.orderCode).catch(() => null)
      if (!alive) return
      if (o?.status === 'paid') return onPaid(o.points)
      if (o && o.status !== 'pending') return setState('expired')
      timer = window.setTimeout(() => void tick(), POLL_MS)
    }
    timer = window.setTimeout(() => void tick(), POLL_MS)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.orderCode])

  useEffect(() => {
    box.current?.focus()
  }, [])

  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-ink/40 px-4 py-6 backdrop-blur-sm"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={box}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Thanh toán ${fmt(order.vnd)}đ`}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          className="anim-pop my-auto w-full max-w-[25rem] rounded-[12px] bg-surface shadow-float outline-none"
        >
          <div className="flex items-center justify-between px-5 pb-1 pt-4">
            <div>
              <div className="text-[1.125rem] font-bold text-ink tnum">{fmt(order.vnd)}đ</div>
              <div className="text-[0.8125rem] text-ink-3 tnum">{fmt(order.points)} điểm AI</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
              aria-label="Đóng"
              data-tip="Đóng"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-5 pt-3">
            <div className="relative mx-auto aspect-square w-[13.5rem] max-w-full overflow-hidden rounded-[10px] border border-line bg-white p-1.5">
              {order.qrCode ? <QrSvg text={order.qrCode} /> : null}
              {expired ? (
                <div className="absolute inset-0 grid place-items-center bg-white/90 text-[0.875rem] font-semibold text-ink-2">Mã đã hết hạn</div>
              ) : null}
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-2 text-[0.8125rem] text-ink-3">
              {expired ? (
                'Đóng lại và bấm Thanh toán để tạo mã mới.'
              ) : (
                <>
                  <Spinner className="size-3.5 text-clay" />
                  Đang chờ thanh toán · <span className="tnum">{mm}:{ss}</span>
                </>
              )}
            </div>
          </div>

          <div className="mx-5 mb-5 mt-4 divide-y divide-line rounded-[10px] border border-line px-3.5">
            <CopyRow label="Ngân hàng" value={BANKS[order.bin] ?? order.bin} />
            <CopyRow label="Số tài khoản" value={order.accountNumber} copy={order.accountNumber} />
            <CopyRow label="Chủ tài khoản" value={order.accountName} />
            <CopyRow label="Số tiền" value={`${fmt(order.vnd)}đ`} copy={String(order.vnd)} />
            <CopyRow label="Nội dung" value={order.description} copy={order.description} />
          </div>
        </div>
      </div>
    </Portal>
  )
}
