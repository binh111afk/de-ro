import { call, HttpError, type ActionMap, type AdminCtx } from './admin.js'
import { AI_FEEDBACK_KINDS, type AiFeedback } from './ops.js'
import type { AiFeedbackOverview } from '../src/lib/adminAiFeedbackApi.js'

type Mode = AiFeedback['mode']
type Kind = AiFeedback['kind']
type Counts = Record<Kind, number>
type FeedbackText = Pick<AiFeedback, 'request' | 'reply'>
type FeedbackRow = FeedbackText & {
  id: number
  user_id: string | null
  kind: Exclude<Kind, 'up'>
  mode: Mode
  note: string
  created_at: string
}
type Supa = AdminCtx['s']

const modes = ['exam', 'slide', 'board'] as const
const callKinds: Record<Mode, string[]> = {
  exam: ['task-doc', 'question', 'ask-clarify', 'task-exam-online', 'vision-source'],
  slide: ['task-slide', 'task-slide-pro'],
  board: ['board'],
}
const negativeKinds = AI_FEEDBACK_KINDS.filter((kind) => kind !== 'up')
const negativeFilter = `kind=in.(${negativeKinds.join(',')})`
const emptyCounts = (): Counts => ({ up: 0, down: 0, undo: 0, resend: 0, complaint: 0 })

export function summarizeAiFeedback(
  calls: Partial<Record<Mode, number>>,
  feedback: Partial<Record<Mode, Counts>>,
): AiFeedbackOverview['modes'] {
  return modes.map((mode) => {
    const successfulCalls = calls[mode] ?? 0
    const counts = { ...emptyCounts(), ...feedback[mode] }
    const dissatisfied = negativeKinds.reduce((total, kind) => total + counts[kind], 0)
    return { mode, successfulCalls, counts, dissatisfied, dissatisfactionRate: successfulCalls ? dissatisfied / successfulCalls : null }
  })
}

async function readCallCounts(s: Supa, period: string) {
  return Object.fromEntries(await Promise.all(modes.map(async (mode) => {
    const { res } = await call(s, `/rest/v1/ai_calls?select=id&${period}&ok=eq.true&kind=in.(${callKinds[mode].join(',')})&limit=1`, {
      method: 'HEAD',
      headers: { Prefer: 'count=exact' },
    })
    const value = res.headers.get('content-range')?.split('/')[1]
    const count = Number(value)
    if (!value || !Number.isSafeInteger(count) || count < 0) throw new Error('Thiếu số lượt AI.')
    return [mode, count] as const
  })))
}

async function readFeedbackCounts(s: Supa, period: string) {
  const feedback = { exam: emptyCounts(), slide: emptyCounts(), board: emptyCounts() }
  const pageSize = 1000
  let cursor = ''
  for (;;) {
    const { data } = await call<Array<Pick<FeedbackRow, 'id' | 'mode'> & { kind: Kind }>>(
      s, `/rest/v1/ai_feedback?select=id,mode,kind&${period}&order=id.desc&limit=${pageSize}${cursor}`,
    )
    if (!data.length) return feedback
    for (const { mode, kind } of data) feedback[mode][kind]++
    cursor = `&id=lt.${data[data.length - 1].id}`
  }
}

async function readUser(s: Supa, id: string) {
  try {
    const { data } = await call<{
      email?: string
      user_metadata?: { display_name?: string; full_name?: string; name?: string }
    }>(s, `/auth/v1/admin/users/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(5000) })
    const metadata = data?.user_metadata
    return { email: data?.email ?? '', name: metadata?.display_name || metadata?.full_name || metadata?.name || '' }
  } catch {
    return null
  }
}

export function maskMuseEmail(email: string): string {
  const match = /^([^@\s]+)@([^@\s]+)$/.exec(email)
  return match ? `${match[1].slice(0, Math.min(2, match[1].length - 1))}***@${match[2]}` : 'Ẩn danh'
}

export async function readMuseFeedback(s: Supa) {
  const [count, recent] = await Promise.all([
    call(s, '/rest/v1/ai_feedback?select=id&kind=eq.down&limit=1', {
      method: 'HEAD',
      headers: { Prefer: 'count=exact' },
    }).then(({ res }) => Number(res.headers.get('content-range')?.split('/')[1]) || 0).catch(() => 0),
    call<Array<Pick<FeedbackRow, 'user_id' | 'mode' | 'created_at'>>>(
      s, `/rest/v1/ai_feedback?select=user_id,mode,created_at&${negativeFilter}&order=created_at.desc,id.desc&limit=10`,
    ).then(({ data }) => (data ?? []).slice(0, 10)).catch(() => []),
  ])
  const userIds = [...new Set(recent.flatMap((row) => row.user_id ? [row.user_id] : []))]
  const users = new Map(await Promise.all(userIds.map(async (id) => [id, await readUser(s, id)] as const)))
  return {
    dislikes_total: count,
    recent: recent.map((row) => {
      const email = row.user_id ? users.get(row.user_id)?.email ?? '' : ''
      return { at: row.created_at, kind: row.mode, user: maskMuseEmail(email) }
    }),
  }
}

export const AI_FEEDBACK_ACTIONS: ActionMap = {
  'aiFeedback.overview': {
    need: 'admin',
    run: async ({ s }, body): Promise<AiFeedbackOverview> => {
      const days = body.days === 7 || body.days === 90 ? body.days : 30
      const now = Date.now()
      const since = new Date(now - days * 86_400_000).toISOString()
      const period = `created_at=gte.${since}&created_at=lte.${new Date(now).toISOString()}`
      try {
        const [calls, feedback, recent] = await Promise.all([
          readCallCounts(s, period),
          readFeedbackCounts(s, period),
          call<FeedbackRow[]>(s, `/rest/v1/ai_feedback?select=id,user_id,kind,mode,created_at,request,reply,note&${period}&${negativeFilter}&order=created_at.desc,id.desc&limit=50`),
        ])
        const rows = recent.data.slice(0, 50)
        const userIds = [...new Set(rows.flatMap((row) => row.user_id ? [row.user_id] : []))]
        const users = new Map(await Promise.all(userIds.map(async (id) => [id, await readUser(s, id)] as const)))
        const items = rows.map((row) => ({
          id: row.id,
          kind: row.kind,
          mode: row.mode,
          createdAt: row.created_at,
          request: Array.from(row.request).slice(0, 300).join(''),
          reply: Array.from(row.reply).slice(0, 300).join(''),
          note: row.note,
          user: row.user_id ? users.get(row.user_id) ?? null : null,
        }))
        return { days, modes: summarizeAiFeedback(calls, feedback), items }
      } catch {
        return { days, modes: summarizeAiFeedback({}, {}), items: [], unavailable: true }
      }
    },
  },
  'aiFeedback.detail': {
    need: 'admin',
    run: async ({ s }, { id }): Promise<FeedbackText> => {
      if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) {
        throw new HttpError(400, 'Mã phản hồi không hợp lệ.')
      }
      const result = await call<FeedbackText[]>(
        s, `/rest/v1/ai_feedback?select=request,reply&id=eq.${id}&${negativeFilter}&limit=1`,
      ).catch(() => { throw new HttpError(502, 'Không tải được nội dung phản hồi.') })
      const detail = result.data?.[0]
      if (!detail) throw new HttpError(404, 'Không tìm thấy phản hồi.')
      return detail
    },
  },
}
