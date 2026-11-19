import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import NotFound from '@/pages/NotFound'
import { Segmented } from '@/components/Segmented'
import { Button, inputClass } from '@/components/ui'
import { dialog } from '@/components/Dialog'
import { usePricingAccess } from '@/lib/usePricingAccess'
import { rememberReturnPath } from '@/lib/auth'
import { cn } from '@/lib/cn'
import {
  basePoints,
  clampVnd,
  DEFAULT_PACK_VND,
  loadPricing,
  MAX_POINTS,
  MAX_VND,
  MIN_VND,
  PACKS,
  packPoints,
  usesFor,
  vndFor,
  type PricingPack,
} from '@/lib/pricing'
import { useSession } from '@/lib/useSession'
import { boughtPacks, createPayment, paymentStatus, type PaymentOrder } from '@/lib/payClient'
import { PayCheckout } from '@/pages/PayCheckout'

type InputMode = 'vnd' | 'points'

const fmt = (n: number) => n.toLocaleString('vi-VN')

function parseDigits(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Đếm chữ số trước con trỏ để giữ đúng vị trí sau khi chèn dấu chấm ngăn hàng nghìn. */
function countDigitsBefore(text: string, pos: number): number {
  let count = 0
  for (let i = 0; i < Math.min(pos, text.length); i++) {
    if (text[i] >= '0' && text[i] <= '9') count++
  }
  return count
}

function caretPosAfterDigits(text: string, targetDigits: number): number {
  if (targetDigits <= 0) return 0
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] >= '0' && text[i] <= '9') {
      seen++
      if (seen === targetDigits) return i + 1
    }
  }
  return text.length
}

export default function Pricing() {
  const allowed = usePricingAccess()
  const [priced, setPriced] = useState(false)

  useEffect(() => {
    void loadPricing().then(() => setPriced(true))
  }, [])


  useEffect(() => {
    if (allowed !== true) return
    const prev = document.title
    document.title = 'Bảng giá điểm AI · đề rõ'
    return () => {
      document.title = prev
    }
  }, [allowed])

  if (allowed === 'loading' || (allowed && !priced)) return <PricingSkeleton />
  if (!allowed) return <NotFound />
  return <PricingContent />
}

function PricingSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Đang tải bảng giá"
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10"
    >
      <div className="h-8 w-44 rounded-[6px] bg-sunken" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
            {PACKS.map((p) => (
              <div key={p.vnd} className="h-24 rounded-[10px] bg-sunken" />
            ))}
          </div>
          <div className="h-32 rounded-[10px] bg-sunken" />
          <div className="h-56 rounded-[10px] bg-sunken" />
        </div>
        <div className="h-96 rounded-[10px] bg-sunken lg:col-span-5 xl:col-span-4" />
      </div>
    </section>
  )
}

function PricingContent() {
  const session = useSession()
  const navigate = useNavigate()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCaretDigits = useRef<number | null>(null)

  const [bought, setBought] = useState<number[]>([])
  const [selectedPackVnd, setSelectedPackVnd] = useState<number | null>(DEFAULT_PACK_VND)
  const [mode, setMode] = useState<InputMode>('vnd')
  const [rawInput, setRawInput] = useState(() => fmt(DEFAULT_PACK_VND))
  const [inputError, setInputError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  /** đơn đang mở khung thanh toán (QR tự vẽ) */
  const [checkout, setCheckout] = useState<PaymentOrder | null>(null)
  const [params, setParams] = useSearchParams()
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  /** hỏi server trạng thái đơn vài lần (webhook có thể đến sau vài giây); điểm chỉ cộng ở server */
  const confirmOrder = async (order: number) => {
    for (let i = 0; i < 8 && aliveRef.current; i++) {
      const o = await paymentStatus(order).catch(() => null)
      if (!aliveRef.current) return
      if (o?.status === 'paid') {
        setBought(await boughtPacks().catch(() => []))
        void dialog.alert(`Đã cộng ${fmt(o.points)} điểm vào tài khoản.`, { title: 'Nạp điểm thành công' })
        return
      }
      if (o && o.status !== 'pending') return
      await new Promise((r) => setTimeout(r, 2500))
    }
    if (aliveRef.current) {
      void dialog.alert('Đang xác nhận thanh toán. Nếu bạn đã chuyển khoản, điểm sẽ được cộng trong ít phút.', { title: 'Đang xác nhận' })
    }
  }

  // quay về từ trang PayOS (?order=…, khi link thanh toán mở ở tab riêng hoặc trên điện thoại)
  useEffect(() => {
    const order = Number(params.get('order'))
    if (!session || !Number.isSafeInteger(order) || order <= 0) return
    const cancelled = params.get('huy') === '1'
    setParams({}, { replace: true })
    if (!cancelled) void confirmOrder(order)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])


  useEffect(() => {
    if (!session) return
    let alive = true
    boughtPacks()
      .then((list) => {
        if (alive) setBought(list)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [session])

  useLayoutEffect(() => {
    const digits = pendingCaretDigits.current
    if (digits === null || !inputRef.current) return
    pendingCaretDigits.current = null
    const pos = caretPosAfterDigits(rawInput, digits)
    inputRef.current.setSelectionRange(pos, pos)
  }, [rawInput])

  const boughtSet = useMemo(() => new Set(bought), [bought])
  const parsedInput = parseDigits(rawInput)

  const summary = useMemo(() => {
    if (selectedPackVnd !== null) {
      const pack = PACKS.find((p) => p.vnd === selectedPackVnd)
      if (pack) {
        const firstTime = !boughtSet.has(pack.vnd)
        return {
          vnd: pack.vnd,
          points: packPoints(pack, firstTime),
          pack,
          firstTime,
        }
      }
    }

    if (mode === 'vnd') {
      const validVnd = parsedInput >= MIN_VND && parsedInput <= MAX_VND ? parsedInput : clampVnd(parsedInput)
      return {
        vnd: validVnd,
        points: basePoints(validVnd),
        pack: null as PricingPack | null,
        firstTime: false,
      }
    }

    const clampedPts = parsedInput > 0 ? Math.min(MAX_POINTS, parsedInput) : basePoints(MIN_VND)
    const vnd = vndFor(clampedPts)
    return {
      vnd,
      points: basePoints(vnd),
      pack: null as PricingPack | null,
      firstTime: false,
    }
  }, [selectedPackVnd, boughtSet, mode, parsedInput])

  const estimatedUses = useMemo(() => usesFor(summary.points), [summary.points])

  const selectPack = (pack: PricingPack) => {
    const firstTime = !boughtSet.has(pack.vnd)
    setSelectedPackVnd(pack.vnd)
    setInputError(null)
    setRawInput(mode === 'vnd' ? fmt(pack.vnd) : fmt(packPoints(pack, firstTime)))
  }

  const handleModeChange = (nextMode: InputMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setInputError(null)
    setRawInput(nextMode === 'vnd' ? fmt(summary.vnd) : fmt(summary.points))
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value
    const sel = e.target.selectionStart ?? nextVal.length
    pendingCaretDigits.current = countDigitsBefore(nextVal, sel)

    const digits = nextVal.replace(/\D/g, '')
    if (!digits) {
      setRawInput('')
      setSelectedPackVnd(null)
      setInputError(null)
      return
    }

    const num = Number(digits)
    setRawInput(fmt(num))

    if (mode === 'vnd') {
      if (num < MIN_VND) {
        setSelectedPackVnd(null)
        setInputError(`Tối thiểu ${fmt(MIN_VND)}đ`)
        return
      }
      if (num > MAX_VND) {
        setSelectedPackVnd(null)
        setInputError(`Tối đa ${fmt(MAX_VND)}đ`)
        return
      }
      setInputError(null)
      const matched = PACKS.find((p) => p.vnd === num)
      setSelectedPackVnd(matched ? matched.vnd : null)
      return
    }

    setSelectedPackVnd(null)
    if (num > MAX_POINTS) {
      setInputError(`Tối đa ${fmt(MAX_POINTS)} điểm (${fmt(MAX_VND)}đ)`)
    } else if (num <= 0) {
      setInputError('Tối thiểu 1 điểm')
    } else {
      setInputError(null)
    }
  }

  const handleInputBlur = () => {
    if (mode === 'vnd') {
      const clamped = clampVnd(parsedInput)
      setRawInput(fmt(clamped))
      setInputError(null)
      const matched = PACKS.find((p) => p.vnd === clamped)
      setSelectedPackVnd(matched ? matched.vnd : null)
      return
    }

    const fallback = basePoints(MIN_VND)
    const clampedPts = Math.min(MAX_POINTS, Math.max(1, parsedInput || fallback))
    setRawInput(fmt(clampedPts))
    setInputError(null)
  }

  const handlePayClick = () => {
    if (!session) {
      rememberReturnPath('/bang-gia')
      navigate('/dang-nhap')
      return
    }
    setPaying(true)
    createPayment(summary.vnd)
      .then((r) => (r.qrCode ? setCheckout(r) : window.location.assign(r.checkoutUrl)))
      .catch((err: unknown) => {
        void dialog.alert(err instanceof Error ? err.message : 'Có lỗi xảy ra, thử lại sau.', { title: 'Chưa tạo được đơn nạp' })
      })
      .finally(() => setPaying(false))
  }

  // tự đóng khung thanh toán: hỏi lại đơn một lần (có thể vừa trả xong ngay trước khi đóng)
  const closeCheckout = () => {
    const order = checkout?.orderCode
    setCheckout(null)
    if (order) {
      void paymentStatus(order)
        .then((o) => {
          if (o.status === 'paid' && aliveRef.current) void confirmOrder(order)
        })
        .catch(() => {})
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[2rem]">
        Bảng giá điểm AI
      </h1>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 space-y-6 lg:col-span-7 xl:col-span-8">
          {/* 1. Chọn gói */}
          <section aria-labelledby="pricing-packs-heading">
            <h2 id="pricing-packs-heading" className="text-[0.9375rem] font-semibold text-ink">
              Chọn gói
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
              {PACKS.map((pack) => {
                const firstTime = !boughtSet.has(pack.vnd)
                const base = basePoints(pack.vnd)
                const pts = packPoints(pack, firstTime)
                const hasBonus = firstTime && pack.bonus > 0
                const selected = selectedPackVnd === pack.vnd
                return (
                  <button
                    key={pack.vnd}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectPack(pack)}
                    className={cn(
                      'relative flex min-w-0 flex-col rounded-[10px] border px-4 pb-3.5 pt-4 text-left transition-[border-color,background-color] duration-150 motion-reduce:transition-none',
                      selected
                        ? 'border-clay bg-clay-tint shadow-[inset_0_0_0_1px_var(--color-clay)]'
                        : 'border-line bg-surface hover:border-line-2',
                    )}
                  >
                    <span className="text-[1.25rem] font-bold leading-tight text-ink tnum">
                      {fmt(pack.vnd)}đ
                    </span>

                    <div className="mt-3 border-t border-line pt-2.5">
                      <div className="text-[0.9375rem] font-semibold text-ink-2 tnum">{fmt(pts)} điểm</div>
                      {/* luôn giữ chỗ dòng nhãn để các thẻ cao bằng nhau */}
                      <div className="mt-1 h-[1.125rem]">
                        {hasBonus ? (
                          <span
                            data-tip={`Thưởng lần đầu nạp gói này: +${fmt(pts - base)} điểm`}
                            className="inline-block rounded-full bg-clay-soft px-1.5 py-px text-[0.6875rem] font-semibold leading-snug text-clay tnum"
                          >
                            +{Math.round(pack.bonus * 100)}%
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 2. Tự nhập */}
          <section
            aria-labelledby="pricing-custom-heading"
            className="rounded-[10px] border border-line bg-surface p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="pricing-custom-heading" className="text-[0.9375rem] font-semibold text-ink">
                Tự nhập
              </h2>
              <Segmented
                value={mode}
                onChange={handleModeChange}
                label="Chế độ nhập"
                className="h-auto min-h-11"
                options={[
                  { key: 'vnd', label: 'Số tiền' },
                  { key: 'points', label: 'Số điểm' },
                ]}
              />
            </div>

            <div className="mt-3.5">
              <label htmlFor={inputId} className="sr-only">
                {mode === 'vnd' ? 'Nhập số tiền (VNĐ)' : 'Nhập số điểm'}
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  id={inputId}
                  type="text"
                  inputMode="numeric"
                  value={rawInput}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  aria-invalid={inputError ? true : undefined}
                  placeholder={mode === 'vnd' ? fmt(DEFAULT_PACK_VND) : fmt(basePoints(DEFAULT_PACK_VND))}
                  className={cn(inputClass, 'min-h-11 pr-16 text-[1rem] font-semibold tnum')}
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[0.875rem] font-medium text-ink-3">
                  {mode === 'vnd' ? 'đ' : 'điểm'}
                </span>
              </div>

              {inputError ? (
                <p role="alert" className="mt-1.5 text-[0.8125rem] font-medium text-clay-deep">
                  {inputError}
                </p>
              ) : (
                <p className="mt-2 text-[0.875rem] text-ink-2 tnum">
                  {mode === 'vnd' ? (
                    <>
                      Nhận được{' '}
                      <strong className="font-semibold text-ink">{fmt(summary.points)} điểm</strong>
                    </>
                  ) : (
                    <>
                      Số tiền{' '}
                      <strong className="font-semibold text-ink">{fmt(summary.vnd)}đ</strong>
                      {' · '}Thực nhận{' '}
                      <strong className="font-semibold text-ink">{fmt(summary.points)} điểm</strong>
                    </>
                  )}
                </p>
              )}
            </div>
          </section>

          {/* 3. Dùng được khoảng */}
          <section
            aria-labelledby="pricing-usage-heading"
            className="rounded-[10px] border border-line bg-surface p-4 sm:p-5"
          >
            <h2 id="pricing-usage-heading" className="text-[0.9375rem] font-semibold text-ink">
              Dùng được khoảng
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {estimatedUses.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-[0.875rem]"
                >
                  <span className="min-w-[10rem] flex-1 text-ink">{item.label}</span>
                  <div className="ml-auto flex shrink-0 flex-wrap items-baseline justify-end gap-x-3 gap-y-0.5 text-right tnum">
                    <span className="text-[0.8125rem] text-ink-3">{item.min !== item.points ? `${fmt(item.min)}–${fmt(item.points)}` : fmt(item.points)} điểm/lượt</span>
                    <span className="min-w-[5rem] font-semibold text-ink">
                      ≈ {fmt(item.count)} lượt
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.75rem] text-ink-3">
              Số điểm mỗi lượt là ước tính, tuỳ độ dài yêu cầu.
            </p>
          </section>
        </div>

        {/* 4. Thanh toán */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:col-span-5 xl:col-span-4">
          <div className="rounded-[10px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="text-[0.9375rem] font-semibold text-ink">Thanh toán</h2>

            <dl className="mt-3 space-y-2 border-b border-line pb-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-[0.875rem] text-ink-3">Số tiền</dt>
                <dd className="text-[1rem] font-semibold text-ink tnum">{fmt(summary.vnd)}đ</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-[0.875rem] text-ink-3">Số điểm</dt>
                <dd className="flex flex-wrap items-baseline justify-end gap-2">
                  {summary.pack && summary.firstTime && summary.pack.bonus > 0 ? (
                    <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-clay">
                      +{Math.round(summary.pack.bonus * 100)}% lần đầu
                    </span>
                  ) : null}
                  <span className="text-[1.25rem] font-bold leading-tight text-clay tnum">
                    {fmt(summary.points)} điểm
                  </span>
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="clay"
              onClick={handlePayClick}
              disabled={paying || !!inputError}
              className="mt-4 h-auto min-h-11 w-full whitespace-normal py-2.5 text-[0.9375rem]"
            >
              {session ? (paying ? 'Đang tạo đơn…' : `Thanh toán ${fmt(summary.vnd)}đ`) : 'Đăng nhập để thanh toán'}
            </Button>
          </div>
        </aside>
      </div>

      {checkout ? (
        <PayCheckout
          order={checkout}
          onClose={closeCheckout}
          onPaid={(points) => {
            setCheckout(null)
            void boughtPacks().then(setBought).catch(() => {})
            void dialog.alert(`Đã cộng ${fmt(points)} điểm vào tài khoản.`, { title: 'Nạp điểm thành công' })
          }}
        />
      ) : null}
    </section>
  )
}
