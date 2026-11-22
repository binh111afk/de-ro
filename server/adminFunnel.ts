import type { FunnelDays, FunnelSteps } from '../src/lib/adminFunnel.js'
import type { StatsFunnel } from '../src/lib/adminStatsApi.js'

type RawCount = number | string | null
type RawSteps = Partial<Record<'signed_up' | 'returned' | 'made' | 'used_ai' | 'paid', RawCount>>

export type AdminFunnelRaw = RawSteps & {
  weeks?: Array<(RawSteps & { week?: string }) | null> | null
  hot?: Array<{ user_id?: string; calls?: RawCount; billed?: RawCount } | null> | null
}

function mapSteps(raw: RawSteps | null): FunnelSteps {
  return {
    signedUp: Number(raw?.signed_up ?? 0),
    returned: Number(raw?.returned ?? 0),
    made: Number(raw?.made ?? 0),
    usedAi: Number(raw?.used_ai ?? 0),
    paid: Number(raw?.paid ?? 0),
  }
}

export function mapAdminFunnel(raw: AdminFunnelRaw | null, days: FunnelDays): StatsFunnel {
  return {
    days,
    steps: mapSteps(raw),
    weeks: (raw?.weeks ?? []).map((row) => ({ week: row?.week ?? '', ...mapSteps(row) })),
    hot: (raw?.hot ?? []).map((row) => ({
      userId: row?.user_id ?? '',
      email: '',
      name: '',
      calls: Number(row?.calls ?? 0),
      billed: Number(row?.billed ?? 0),
    })),
  }
}
