const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Chỉ tài khoản tạo từ mốc này (22/11/2026 10:25 giờ VN) mới có popup; người đăng ký trước đó không hiện. */
export const WELCOME_GIFT_SINCE = Date.parse('2026-11-22T03:25:00Z')

export function isNewAccount(createdAt: string | undefined, now: number): boolean {
  const created = Date.parse(createdAt ?? '')
  const age = now - created
  return created >= WELCOME_GIFT_SINCE && age >= 0 && age <= SEVEN_DAYS_MS
}

/** `welcome` = số điểm quà hiện hành; chỉ hiện khi quà còn nguyên (đã dùng một phần thì không còn là "quà mới"). */
export function shouldShowWelcomeGift({ userId, createdAt, now, points, welcome, unlimited, seen }: {
  userId: string | undefined
  createdAt: string | undefined
  now: number
  points: number
  welcome: number
  unlimited: boolean
  seen: boolean
}): boolean {
  return !!userId && !seen && !unlimited && Number.isFinite(points) && welcome > 0 && points >= welcome && isNewAccount(createdAt, now)
}

export const WELCOME_GIFT_COUNT_MS = 900

export function welcomeGiftCount(points: number, elapsedMs: number): number {
  const progress = Math.min(1, Math.max(0, elapsedMs / WELCOME_GIFT_COUNT_MS))
  return Math.floor(points * (1 - (1 - progress) ** 3))
}
