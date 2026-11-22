import { post } from './adminApi'

export type AiMarginDays = 7 | 30 | 90

export interface AiMarginSettings {
  usdVnd: number
  unitCostUsd: Record<string, number>
  actual: Record<string, Record<string, number>>
}

export interface AiMarginRow {
  success: number
  billed: number
  points: number
  revenueVnd: number
  costUsd: number
  costVnd: number
  missingPrice: number
  marginVnd: number | null
  marginPercent: number | null
}

export interface AiMarginReport {
  month: string
  vndPerPoint: number
  rows: Array<AiMarginRow & { kind: string }>
  total: AiMarginRow
  unitCostKinds: string[]
  providers: string[]
  comparison: Array<{ provider: string; estimatedUsd: number; actualUsd: number; ratio: number | null }>
}

export const getAiMargin = (days: AiMarginDays) => post<AiMarginReport>('aiMargin.get', { days }, true)
export const getAiMarginSettings = () => post<{ month: string; settings: AiMarginSettings }>('aiMargin.settings', {}, true)
export const saveAiMarginSettings = (settings: AiMarginSettings) =>
  post<{ month: string; settings: AiMarginSettings }>('aiMargin.saveSettings', { settings })
