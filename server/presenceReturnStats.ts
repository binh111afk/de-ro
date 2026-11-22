export type PresenceReturnRow = {
  user_id: string
  visits: number
  active_days: number
  first_day: string | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

export function presenceReturnStats(row: Omit<PresenceReturnRow, 'user_id'> | undefined, nowMs: number) {
  const visits = row?.visits ?? 0
  const returnDays = Math.max(0, (row?.active_days ?? 0) - 1)
  const firstDay = Date.parse(row?.first_day ?? '')
  if (!Number.isFinite(firstDay) || row?.active_days == null) {
    return { visits, returnDays, returnRate: null }
  }

  // first_day là ngày lịch VN. Date.parse đọc YYYY-MM-DD ở nửa đêm UTC.
  const today = Math.floor((nowMs + VN_OFFSET_MS) / DAY_MS)
  const elapsedDays = Math.max(1, today - firstDay / DAY_MS)
  return { visits, returnDays, returnRate: Math.min(1, returnDays / elapsedDays) }
}
