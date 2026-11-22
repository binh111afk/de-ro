import { useEffect, useState, type FormEvent } from 'react'
import { dialog } from '@/components/Dialog'
import { Segmented } from '@/components/Segmented'
import { Button, Card, inputClass, Spinner } from '@/components/ui'
import {
  getAiMargin, getAiMarginSettings, saveAiMarginSettings,
  type AiMarginDays, type AiMarginReport, type AiMarginRow, type AiMarginSettings,
} from '@/lib/adminAiMarginApi'
import { cn } from '@/lib/cn'

const periods = [
  { key: '7', label: '7 ngày' }, { key: '30', label: '30 ngày' }, { key: '90', label: '90 ngày' },
] as const
type Period = (typeof periods)[number]['key']
const labels: Record<string, string> = {
  other: 'Khác', untagged: 'Chưa phân loại', image: 'Ảnh AI', 'image-pro': 'Ảnh AI Pro',
  'task-doc': 'Soạn đề', 'task-exam-online': 'Đề online', question: 'Hỏi AI', 'ask-clarify': 'Hỏi lại',
  'task-slide': 'Soạn slide', 'task-slide-pro': 'Soạn slide Pro', 'task-slide-html': 'Soạn slide HTML',
  'edit-slide': 'Sửa slide', 'edit-question': 'Sửa câu hỏi', board: 'Bảng vẽ', 'web-search': 'Tìm trên web',
  figure: 'Hình minh hoạ', bank: 'Ngân hàng', matrix: 'Ma trận', 'vision-source': 'Đọc nguồn', 'vision-bank': 'Đọc đề',
}
const kindLabel = (kind: string) => Object.hasOwn(labels, kind) ? labels[kind] : kind
const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const usd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 })
const cell = 'px-3 py-2 text-right tabular-nums whitespace-nowrap'
const tableClass = 'w-full border-collapse text-left text-[13px] [&>tbody>tr]:border-t [&>tbody>tr]:border-line-2'
const headClass = 'bg-sunken/80 text-[12px] text-ink-3'

type Draft = { usdVnd: string; unitCostUsd: Record<string, string>; actual: Record<string, string> }
type State<T> = { data: T } | { error: string } | null

const asText = (values: Record<string, number>) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]))
const asNumbers = (values: Record<string, string>) => Object.fromEntries(
  Object.entries(values).filter(([, value]) => value !== '').map(([key, value]) => [key, Number(value)]),
)
const toDraft = ({ usdVnd, unitCostUsd, actual }: AiMarginSettings, month: string): Draft => ({
  usdVnd: String(usdVnd), unitCostUsd: asText(unitCostUsd), actual: asText(actual[month] ?? {}),
})
const message = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback

function MarginRow({ label, row }: { label: string; row: AiMarginRow }) {
  return (
    <tr className={row.missingPrice ? 'bg-clay/5' : undefined}>
      <th scope="row" className="px-3 py-2 font-medium">{label}</th>
      <td className={cell}>{number.format(row.success)}</td>
      <td className={cell}>{number.format(row.points)}</td>
      <td className={cell}>{vnd.format(row.revenueVnd)}</td>
      <td className={cell}>
        {(row.costUsd > 0 || !row.missingPrice) && <span data-tip={usd.format(row.costUsd)}>{vnd.format(row.costVnd)}</span>}
        {row.missingPrice > 0 && <span className="block font-medium text-clay">Chưa có giá ({number.format(row.missingPrice)})</span>}
      </td>
      <td className={cn(cell, row.marginVnd !== null && row.marginVnd < 0 && 'text-clay')}>
        {row.marginPercent === null ? '—' : `${number.format(row.marginPercent)}%`}
        {row.marginVnd !== null && <span className="block text-[12px]">{vnd.format(row.marginVnd)}</span>}
      </td>
    </tr>
  )
}

function Status({ state, loading }: { state: State<unknown>; loading: string }) {
  if (!state) return <p role="status" className="text-[13px] text-ink-3"><Spinner className="mr-2 size-4" />{loading}</p>
  return 'error' in state ? <p role="alert" className="text-[13px] text-clay">{state.error}</p> : null
}

export function AiMarginCard({ onNotice }: { onNotice: (message: string) => void }) {
  const [period, setPeriod] = useState<Period>('7')
  const [report, setReport] = useState<State<AiMarginReport>>(null)
  const [config, setConfig] = useState<State<{ month: string; settings: AiMarginSettings }>>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [newProvider, setNewProvider] = useState('')
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    getAiMargin(Number(period) as AiMarginDays).then(
      (data) => { if (active) setReport({ data }) },
      (error: unknown) => { if (active) setReport({ error: message(error, 'Không tải được lãi / lỗ AI.') }) },
    )
    return () => { active = false }
  }, [period, revision])

  useEffect(() => {
    let active = true
    getAiMarginSettings().then(
      (data) => {
        if (!active) return
        setConfig({ data })
        setDraft(toDraft(data.settings, data.month))
      },
      (error: unknown) => { if (active) setConfig({ error: message(error, 'Không tải được giá nhập tay.') }) },
    )
    return () => { active = false }
  }, [])

  const data = report && 'data' in report ? report.data : null
  const saved = config && 'data' in config ? config.data : null
  const kinds = [...new Set(['image', 'image-pro', ...(data?.unitCostKinds ?? []), ...Object.keys(draft?.unitCostUsd ?? {})])]
  const providers = [...new Set([...(data && data.month === saved?.month ? data.providers : []), ...Object.keys(draft?.actual ?? {})])].sort()
  const provider = newProvider.trim().toLowerCase()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft || !saved || saving) return
    setSaving(true)
    try {
      const actual = { ...saved.settings.actual }
      const current = asNumbers(draft.actual)
      if (Object.keys(current).length) actual[saved.month] = current
      else delete actual[saved.month]
      const result = await saveAiMarginSettings({ usdVnd: Number(draft.usdVnd), unitCostUsd: asNumbers(draft.unitCostUsd), actual })
      setConfig({ data: result })
      setDraft(toDraft(result.settings, result.month))
      setNewProvider('')
      setReport(null)
      setRevision((value) => value + 1)
      onNotice('Đã lưu giá nhập tay')
    } catch (error) {
      await dialog.alert(message(error, 'Không lưu được giá nhập tay.'), { title: 'Lỗi lưu giá nhập tay' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="min-w-0 space-y-5 border border-line p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h2 className="text-[17px] font-bold text-ink">Lãi / lỗ AI</h2>
        <Segmented<Period> label="Khoảng thời gian" value={period} options={[...periods]} onChange={(value) => {
          if (value === period) return
          setReport(null)
          setPeriod(value)
        }} />
      </div>

      <Status state={report} loading="Đang tải lãi / lỗ AI…" />
      {data && (
        <div className="overflow-x-auto rounded-[6px] border border-line">
          <table className={tableClass}>
            <thead className={headClass}>
              <tr>
                <th scope="col" className="px-3 py-2">Tác vụ</th>
                <th scope="col" className={cell}>Lượt thành công</th>
                <th scope="col" className={cell}>Điểm đã trừ</th>
                <th scope="col" className={cell} data-tip={`${number.format(data.vndPerPoint)} đ/điểm theo giá nạp cơ bản`}>Doanh thu quy đổi</th>
                <th scope="col" className={cell}>Chi phí ước tính</th>
                <th scope="col" className={cell}>Biên %</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => <MarginRow key={row.kind} label={kindLabel(row.kind)} row={row} />)}
              {!data.rows.length && <tr><td colSpan={6} className="px-3 py-4 text-center text-ink-3">Chưa có lượt gọi</td></tr>}
            </tbody>
            <tfoot className="border-t border-line bg-sunken/40 font-semibold"><MarginRow label="Tổng" row={data.total} /></tfoot>
          </table>
        </div>
      )}

      <div className="space-y-3 border-t border-line pt-4">
        <h3 className="text-[14px] font-semibold text-ink">Giá nhập tay</h3>
        <Status state={config} loading="Đang tải giá nhập tay…" />
        {draft && saved && (
          <form onSubmit={save}>
            <fieldset disabled={saving} className="min-w-0 space-y-4">
              <label className="block max-w-44 space-y-1 text-[13px] font-medium">
                <span>Tỉ giá (VND/USD)</span>
                <input className={inputClass} type="number" min={1000} max={100000} step="any" required value={draft.usdVnd}
                  onChange={(e) => setDraft({ ...draft, usdVnd: e.target.value })} />
              </label>

              <fieldset className="min-w-0">
                <legend className="mb-2 text-[13px] font-semibold">Giá mỗi lượt (USD)</legend>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3">
                  {kinds.map((kind) => (
                    <label key={kind} className="min-w-0 space-y-1 text-[13px]">
                      <span className="block break-all">{kindLabel(kind)}</span>
                      <input className={inputClass} type="number" min={0} max={10} step="any" value={draft.unitCostUsd[kind] ?? ''}
                        onChange={(e) => setDraft({ ...draft, unitCostUsd: { ...draft.unitCostUsd, [kind]: e.target.value } })} />
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="min-w-0">
                <legend className="mb-2 text-[13px] font-semibold">Chi phí thật {saved.month.slice(5)}/{saved.month.slice(0, 4)} (USD)</legend>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3">
                  {providers.map((name) => (
                    <label key={name} className="min-w-0 space-y-1 text-[13px]">
                      <span className="block break-all">{name}</span>
                      <input className={inputClass} type="number" min={0} max={100000} step="any" value={draft.actual[name] ?? ''}
                        onChange={(e) => setDraft({ ...draft, actual: { ...draft.actual, [name]: e.target.value } })} />
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input className={cn(inputClass, 'w-44')} aria-label="Mã nhà cung cấp" placeholder="Mã nhà cung cấp"
                    maxLength={40} value={newProvider} onChange={(e) => setNewProvider(e.target.value)} />
                  <Button type="button" size="sm" variant="outline" disabled={!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(provider) || Object.hasOwn(Object.prototype, provider) || providers.includes(provider)}
                    onClick={() => {
                      setDraft({ ...draft, actual: { ...draft.actual, [provider]: '' } })
                      setNewProvider('')
                    }}>Thêm nhà cung cấp</Button>
                </div>
              </fieldset>

              <Button type="submit" variant="clay" size="sm" disabled={saving}>
                {saving && <Spinner className="size-3.5" />} Lưu
              </Button>
            </fieldset>
          </form>
        )}
      </div>

      {data && (
        <div className="space-y-2 border-t border-line pt-4">
          <h3 className="text-[14px] font-semibold text-ink">Đối chiếu {data.month.slice(5)}/{data.month.slice(0, 4)}</h3>
          <div className="overflow-x-auto rounded-[6px] border border-line">
            <table className={tableClass}>
              <thead className={headClass}>
                <tr>
                  <th scope="col" className="px-3 py-2">Nhà cung cấp</th>
                  <th scope="col" className={cell}>Ước tính</th>
                  <th scope="col" className={cell}>Thực trả</th>
                  <th scope="col" className={cell}>Hệ số</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((row) => (
                  <tr key={row.provider}>
                    <th scope="row" className="px-3 py-2 font-medium">{row.provider}</th>
                    <td className={cell}>{usd.format(row.estimatedUsd)}</td>
                    <td className={cell}>{usd.format(row.actualUsd)}</td>
                    <td className={cell}>{row.ratio === null ? '—' : `${number.format(row.ratio)}×`}</td>
                  </tr>
                ))}
                {!data.comparison.length && <tr><td colSpan={4} className="px-3 py-4 text-center text-ink-3">Chưa nhập chi phí thật</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
