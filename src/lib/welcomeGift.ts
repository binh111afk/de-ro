const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function isNewAccount(createdAt: string | undefined, now: number): boolean {
  const age = now - Date.parse(createdAt ?? '')
  return age >= 0 && age <= SEVEN_DAYS_MS
}

export function shouldShowWelcomeGift({ userId, createdAt, now, points, unlimited, seen }: {
  userId: string | undefined
  createdAt: string | undefined
  now: number
  points: number
  unlimited: boolean
  seen: boolean
}): boolean {
  return !!userId && !seen && !unlimited && Number.isFinite(points) && points > 0 && isNewAccount(createdAt, now)
}

export const WELCOME_GIFT_COUNT_MS = 900

export function welcomeGiftCount(points: number, elapsedMs: number): number {
  const progress = Math.min(1, Math.max(0, elapsedMs / WELCOME_GIFT_COUNT_MS))
  return Math.floor(points * (1 - (1 - progress) ** 3))
}
