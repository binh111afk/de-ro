import { TOKENS_PER_POINT } from './aiQuota.js'
import type { AiMarginReport, AiMarginRow, AiMarginSettings } from '../src/lib/adminAiMarginApi.js'

export type AiCall = {
  id: number
  kind: string | null
  provider: string
  ok: boolean
  billed: number | null
  cost: number | null
  created_at: string
}

const ratio = (value: number, base: number) => base === 0 ? null : value / base

const empty = () => ({ success: 0, billed: 0, costUsd: 0, missingPrice: 0 })
type Totals = ReturnType<typeof empty>

function valueTotals(totals: Totals, vndPerPoint: number, usdVnd: number): AiMarginRow {
  const points = totals.billed / TOKENS_PER_POINT
  const revenueVnd = points * vndPerPoint
  const costVnd = totals.costUsd * usdVnd
  const marginVnd = totals.missingPrice ? null : revenueVnd - costVnd
  const marginRatio = marginVnd === null ? null : ratio(marginVnd, revenueVnd)
  return { ...totals, points, revenueVnd, costVnd, marginVnd, marginPercent: marginRatio === null ? null : marginRatio * 100 }
}

export function summarizeAiMargin(
  calls: Iterable<AiCall>,
  settings: AiMarginSettings,
  pointsPer1000: number,
  since: number,
  month: string,
): AiMarginReport {
  const monthStart = Date.parse(`${month}-01T00:00:00+07:00`)
  const byKind = new Map<string, Totals>()
  const monthlyCost = new Map<string, number>()
  const unitCostKinds = new Set<string>()
  const total = empty()
  for (const row of calls) {
    const time = Date.parse(row.created_at)
    if (time >= monthStart) monthlyCost.set(row.provider, (monthlyCost.get(row.provider) ?? 0) + (row.cost ?? 0))
    if (time < since) continue

    const kind = row.kind?.trim() || 'other'
    const billed = row.billed ?? 0
    // Lượt lỗi thiếu usage không có cơ sở áp giá mỗi lượt. Chi phí đã ghi vẫn được cộng.
    const needsPrice = row.cost === null && (row.ok || billed > 0)
    if (needsPrice) unitCostKinds.add(kind)
    const manualCost = needsPrice && Object.hasOwn(settings.unitCostUsd, kind) ? settings.unitCostUsd[kind] : undefined
    const cost = row.cost ?? manualCost ?? 0
    const stats = byKind.get(kind) ?? empty()
    for (const bucket of [stats, total]) {
      bucket.success += Number(row.ok)
      bucket.billed += billed
      bucket.costUsd += cost
      bucket.missingPrice += Number(needsPrice && manualCost === undefined)
    }
    byKind.set(kind, stats)
  }

  const vndPerPoint = 1000 / pointsPer1000
  const rows = Array.from(byKind, ([kind, stats]) => ({ kind, ...valueTotals(stats, vndPerPoint, settings.usdVnd) }))
  rows.sort((a, b) => b.success - a.success || a.kind.localeCompare(b.kind))
  const actual = settings.actual[month] ?? {}
  return {
    month,
    vndPerPoint,
    rows,
    total: valueTotals(total, vndPerPoint, settings.usdVnd),
    unitCostKinds: [...unitCostKinds].sort(),
    providers: [...new Set([...monthlyCost.keys(), ...Object.keys(actual)])].sort(),
    comparison: Object.keys(actual).sort().map((provider) => {
      const estimatedUsd = monthlyCost.get(provider) ?? 0
      const actualUsd = actual[provider]
      return { provider, estimatedUsd, actualUsd, ratio: ratio(actualUsd, estimatedUsd) }
    }),
  }
}
