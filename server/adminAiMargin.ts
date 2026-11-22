import { audit, call, HttpError, type ActionMap } from './admin.js'
import { summarizeAiMargin, type AiCallGroup } from './aiMargin.js'
import { DEFAULT_PRICING, type PricingConfig } from '../src/lib/pricing.js'
import type { AiMarginSettings } from '../src/lib/adminAiMarginApi.js'

type Supabase = Parameters<typeof call>[0]
const DEFAULT_SETTINGS: AiMarginSettings = { usdVnd: 25_000, unitCostUsd: {}, actual: {} }
const SETTINGS_KEY = 'ai_margin'
const DAY_MS = 86_400_000
const ID = /^[a-z0-9][a-z0-9_-]{0,39}$/
const MONTH = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/
const monthInVietnam = (now: number) => new Date(now + 7 * 3_600_000).toISOString().slice(0, 7)

function entries(value: unknown, limit: number, label: string): Array<[string, unknown]> {
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new HttpError(400, `${label} không hợp lệ.`)
  }
  const items = Object.entries(value)
  if (items.length > limit) throw new HttpError(400, `${label} có tối đa ${limit} mục.`)
  return items
}

function amount(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new HttpError(400, `${label} phải từ ${min.toLocaleString('vi-VN')} đến ${max.toLocaleString('vi-VN')}.`)
  }
  return value
}

function amounts(value: unknown, limit: number, max: number, label: string): Record<string, number> {
  return Object.fromEntries(entries(value, limit, label).map(([key, price]) => {
    if (!ID.test(key) || Object.hasOwn(Object.prototype, key)) throw new HttpError(400, `${label} có mã không hợp lệ.`)
    return [key, amount(price, 0, max, label)]
  }))
}

function validateSettings(value: unknown): AiMarginSettings {
  const fields = entries(value, 3, 'Cài đặt lãi / lỗ AI')
  if (fields.some(([key]) => !['usdVnd', 'unitCostUsd', 'actual'].includes(key))) {
    throw new HttpError(400, 'Cài đặt lãi / lỗ AI có khoá không hợp lệ.')
  }
  const { usdVnd, unitCostUsd, actual } = Object.fromEntries(fields)
  return {
    usdVnd: amount(usdVnd, 1000, 100_000, 'Tỉ giá'),
    unitCostUsd: amounts(unitCostUsd, 32, 10, 'Giá mỗi lượt'),
    actual: Object.fromEntries(entries(actual, 24, 'Chi phí thật theo tháng').map(([month, providers]) => {
      if (!MONTH.test(month)) throw new HttpError(400, 'Tháng phải có dạng YYYY-MM.')
      return [month, amounts(providers, 24, 100_000, 'Chi phí thật mỗi nhà cung cấp')]
    })),
  }
}

/** Gộp ở DB (RPC `admin_ai_margin_groups`): vài chục dòng cho dù có bao nhiêu lượt gọi. */
async function readGroups(s: Supabase, since: number, monthStart: number, now: number): Promise<AiCallGroup[]> {
  const { data } = await call<AiCallGroup[]>(s, '/rest/v1/rpc/admin_ai_margin_groups', {
    method: 'POST',
    body: JSON.stringify({
      p_since: new Date(since).toISOString(),
      p_month_start: new Date(monthStart).toISOString(),
      p_until: new Date(now).toISOString(),
    }),
  })
  return data ?? []
}

export const AI_MARGIN_ACTIONS: ActionMap = {
  'aiMargin.get': {
    need: 'admin',
    run: async ({ s }, { days }) => {
      if (days !== 7 && days !== 30 && days !== 90) throw new HttpError(400, 'Chọn 7, 30 hoặc 90 ngày.')
      const now = Date.now()
      const month = monthInVietnam(now)
      const since = now - days * DAY_MS
      const [config, groups] = await Promise.all([
        call<Array<{ key: string; value: unknown }>>(s, '/rest/v1/app_settings?select=key,value&key=in.(ai_margin,pricing)'),
        readGroups(s, since, Date.parse(`${month}-01T00:00:00+07:00`), now),
      ])
      const saved = config.data.find(({ key }) => key === SETTINGS_KEY)
      const settings = saved ? validateSettings(saved.value) : DEFAULT_SETTINGS
      const pricing = config.data.find(({ key }) => key === 'pricing')?.value as Partial<PricingConfig> | undefined
      const points = pricing?.pointsPer1000
      const pointsPer1000 = Array.isArray(pricing?.packs) && pricing.packs.length > 0 && typeof points === 'number' && Number.isFinite(points) && points > 0
        ? points : DEFAULT_PRICING.pointsPer1000
      return summarizeAiMargin(groups, settings, pointsPer1000, month)
    },
  },
  'aiMargin.settings': {
    need: 'admin',
    run: async ({ s }) => {
      const { data } = await call<Array<{ value: unknown }>>(s, `/rest/v1/app_settings?select=value&key=eq.${SETTINGS_KEY}`)
      return { month: monthInVietnam(Date.now()), settings: data.length ? validateSettings(data[0].value) : DEFAULT_SETTINGS }
    },
  },
  'aiMargin.saveSettings': {
    need: 'admin',
    run: async (ctx, body) => {
      if (Object.keys(body).some((key) => key !== 'action' && key !== 'settings')) throw new HttpError(400, 'Yêu cầu có khoá không hợp lệ.')
      const settings = validateSettings(body.settings)
      await call(ctx.s, '/rest/v1/app_settings?on_conflict=key', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ key: SETTINGS_KEY, value: settings, updated_at: new Date().toISOString() }),
      })
      await audit(ctx, 'aiMargin.saveSettings', SETTINGS_KEY)
      return { month: monthInVietnam(Date.now()), settings }
    },
  },
}
