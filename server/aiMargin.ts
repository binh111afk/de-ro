import { TOKENS_PER_POINT } from './aiQuota.js'
import type { AiMarginReport, AiMarginRow, AiMarginSettings } from '../src/lib/adminAiMarginApi.js'

/** Một nhóm lượt gọi đã cộng sẵn ở DB (RPC `admin_ai_margin_groups`); số có thể về dạng chuỗi (numeric). */
export type AiCallGroup = {
  kind: string
  provider: string
  ok: boolean
  cost_null: boolean
  billed_pos: boolean
  in_window: boolean
  in_month: boolean
  n: number | string
  billed: number | string
  cost: number | string
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
  groups: Iterable<AiCallGroup>,
  settings: AiMarginSettings,
  pointsPer1000: number,
  month: string,
): AiMarginReport {
  const byKind = new Map<string, Totals>()
  const monthlyCost = new Map<string, number>()
  const unitCostKinds = new Set<string>()
  const total = empty()
  for (const group of groups) {
    const count = Number(group.n)
    const billed = Number(group.billed)
    const recordedCost = Number(group.cost)
    if (group.in_month) monthlyCost.set(group.provider, (monthlyCost.get(group.provider) ?? 0) + recordedCost)
    if (!group.in_window) continue

    const kind = group.kind || 'other'
    // Lượt lỗi thiếu usage không có cơ sở áp giá mỗi lượt. Chi phí đã ghi vẫn được cộng.
    const needsPrice = group.cost_null && (group.ok || group.billed_pos)
    if (needsPrice) unitCostKinds.add(kind)
    const manualCost = needsPrice && Object.hasOwn(settings.unitCostUsd, kind) ? settings.unitCostUsd[kind] : undefined
    const cost = group.cost_null ? (manualCost ?? 0) * count : recordedCost
    const stats = byKind.get(kind) ?? empty()
    for (const bucket of [stats, total]) {
      bucket.success += group.ok ? count : 0
      bucket.billed += billed
      bucket.costUsd += cost
      bucket.missingPrice += needsPrice && manualCost === undefined ? count : 0
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
