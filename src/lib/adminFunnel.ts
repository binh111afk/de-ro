export const FUNNEL_STEPS = ['signedUp', 'returned', 'made', 'usedAi', 'paid'] as const

export type FunnelDays = 0 | 7 | 30 | 90
export type FunnelSteps = Record<(typeof FUNNEL_STEPS)[number], number>

export function funnelPercentages(steps: FunnelSteps) {
  const percent = (count: number, base: number) => base === 0 ? null : (count / base) * 100

  return FUNNEL_STEPS.map((key, index) => {
    const previous = FUNNEL_STEPS[index - 1]
    return {
      key,
      count: steps[key],
      fromSignup: percent(steps[key], steps.signedUp),
      fromPrevious: previous === undefined ? null : percent(steps[key], steps[previous]),
    }
  })
}
