/** Khối "Bảng giá" trong Nạp điểm: tỉ giá điểm, mức nạp, các gói và thưởng lần đầu. */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TrashIcon } from '@/components/appIcons'
import { Button, Card, Spinner, inputClass } from '@/components/ui'
import { dialog } from '@/components/Dialog'
import { setPricing } from '@/lib/adminApi'
import { DEFAULT_PRICING, type PricingConfig } from '@/lib/pricing'
import { cn } from '@/lib/cn'

const fmt = (n: number) => n.toLocaleString('vi-VN')
const toNum = (s: string) => Number(s.replace(/\D/g, '')) || 0

interface Row {
  key: string
  vnd: string
  bonus: string
}

const toRows = (c: PricingConfig): Row[] =>
  c.packs.map((p) => ({ key: crypto.randomUUID(), vnd: fmt(p.vnd), bonus: String(Math.round(p.bonus * 1000) / 10) }))

export function PricingEditor({ initial, onNotice }: { initial: PricingConfig | null; onNotice: (msg: string) => void }) {
  const start = initial ?? DEFAULT_PRICING
  const [rate, setRate] = useState(String(start.pointsPer1000))
  const [minVnd, setMinVnd] = useState(fmt(start.minVnd))
  const [maxVnd, setMaxVnd] = useState(fmt(start.maxVnd))
  const [rows, setRows] = useState<Row[]>(() => toRows(start))
  const [defaultKey, setDefaultKey] = useState(() => {
    const i = start.packs.findIndex((p) => p.vnd === start.defaultVnd)
    return i >= 0 ? i : 0
  })
  const [saving, setSaving] = useState(false)

  const patch = (key: string, change: Partial<Row>) => setRows((list) => list.map((r) => (r.key === key ? { ...r, ...change } : r)))
  const ratio = toNum(rate)

  const save = async () => {
    const packs = rows.map((r) => ({ vnd: toNum(r.vnd), bonus: (Number(r.bonus.replace(',', '.')) || 0) / 100 }))
    setSaving(true)
    try {
      const saved = await setPricing({
        pointsPer1000: ratio,
        minVnd: toNum(minVnd),
        maxVnd: toNum(maxVnd),
        packs,
        defaultVnd: packs[defaultKey]?.vnd ?? packs[0]?.vnd ?? 0,
      })
      setRows(toRows(saved))
      setDefaultKey(Math.max(0, saved.packs.findIndex((p) => p.vnd === saved.defaultVnd)))
      onNotice('Đã lưu bảng giá')
    } catch (err) {
      await dialog.alert(err instanceof Error ? err.message : 'Không lưu được bảng giá', { title: 'Lỗi lưu bảng giá' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
        <h2 className="text-[17px] font-bold text-ink">Bảng giá</h2>
        <Button variant="primary" size="sm" onClick={() => void save()} disabled={saving}>
          {saving ? <Spinner className="size-3.5" /> : null}
          Lưu bảng giá
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-[13px] font-semibold text-ink-2">
          Điểm mỗi 1.000đ
          <input className={cn(inputClass, 'mt-1.5')} inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="block text-[13px] font-semibold text-ink-2">
          Nạp tối thiểu (đ)
          <input className={cn(inputClass, 'mt-1.5')} inputMode="numeric" value={minVnd} onChange={(e) => setMinVnd(fmt(toNum(e.target.value)))} />
        </label>
        <label className="block text-[13px] font-semibold text-ink-2">
          Nạp tối đa (đ)
          <input className={cn(inputClass, 'mt-1.5')} inputMode="numeric" value={maxVnd} onChange={(e) => setMaxVnd(fmt(toNum(e.target.value)))} />
        </label>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="whitespace-nowrap text-left text-[12px] font-semibold text-ink-3">
              <th className="pb-2 pr-3 font-semibold">Giá gói (đ)</th>
              <th className="pb-2 pr-3 font-semibold">Thưởng lần đầu (%)</th>
              <th className="pb-2 pr-3 font-semibold">Điểm nhận</th>
              <th className="pb-2 pr-3 font-semibold">Chọn sẵn</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const base = Math.floor((toNum(r.vnd) / 1000) * ratio + 1e-9)
              const withBonus = Math.floor(base * (1 + (Number(r.bonus.replace(',', '.')) || 0) / 100) + 1e-9)
              return (
                <tr key={r.key} className="border-t border-line">
                  <td className="py-2 pr-3">
                    <input className={cn(inputClass, 'w-32')} inputMode="numeric" value={r.vnd} onChange={(e) => patch(r.key, { vnd: fmt(toNum(e.target.value)) })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input className={cn(inputClass, 'w-24')} inputMode="decimal" value={r.bonus} onChange={(e) => patch(r.key, { bonus: e.target.value.replace(/[^\d.,]/g, '') })} />
                  </td>
                  <td className="py-2 pr-3 tnum text-ink-2">
                    {fmt(base)}
                    {withBonus > base ? <span className="text-clay"> → {fmt(withBonus)}</span> : null}
                  </td>
                  <td className="py-2 pr-3">
                    <input type="radio" name="pricing-default" checked={defaultKey === i} onChange={() => setDefaultKey(i)} className="accent-clay" />
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      data-tip="Xoá gói"
                      disabled={rows.length <= 1}
                      onClick={() => {
                        setRows((list) => list.filter((x) => x.key !== r.key))
                        setDefaultKey((d) => (d === i ? 0 : d > i ? d - 1 : d))
                      }}
                      className="rounded-[6px] p-1.5 text-ink-3 hover:bg-sunken hover:text-ink disabled:opacity-40"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={rows.length >= 8}
        onClick={() => setRows((list) => [...list, { key: crypto.randomUUID(), vnd: '', bonus: '0' }])}
      >
        <Plus className="size-3.5" />
        Thêm gói
      </Button>
    </Card>
  )
}
