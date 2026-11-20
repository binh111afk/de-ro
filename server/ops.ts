/**
 * Vận hành (admin giai đoạn 2), dùng chung cho llmProxy / r2 / admin:
 * - `logAiCall`: ghi một dòng `ai_calls` cho mỗi lần thử một model. Lỗi ghi log không bao giờ làm hỏng request.
 * - `maintenanceBlock`: đang bảo trì và người gọi không phải admin/moderator thì trả 503.
 * Cần SUPABASE_SERVICE_ROLE_KEY; thiếu thì bỏ qua (máy dev).
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { userFromToken } from './guard.js'
import { json } from './http.js'

type Supa = { base: string; headers: Record<string, string> }
function supa(): Supa | null {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && key ? { base, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } } : null
}

export type AiCall = {
  userId: string | null
  model: string
  provider: string
  ok: boolean
  error?: string | null
  promptTokens?: number
  completionTokens?: number
  cost?: number | null
  ms: number
}

export async function logAiCall(c: AiCall): Promise<void> {
  const s = supa()
  if (!s) return
  try {
    await fetch(`${s.base}/rest/v1/ai_calls`, {
      method: 'POST',
      headers: { ...s.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: c.userId,
        model: c.model.slice(0, 120),
        provider: c.provider.slice(0, 40),
        ok: c.ok,
        error: c.error ? c.error.slice(0, 500) : null,
        prompt_tokens: Math.max(0, Math.round(c.promptTokens ?? 0)),
        completion_tokens: Math.max(0, Math.round(c.completionTokens ?? 0)),
        cost: c.cost ?? null,
        ms: Math.max(0, Math.round(c.ms)),
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    /* log hỏng thì thôi */
  }
}

/** Số lượt trả rỗng (hết trần token…) mỗi người được miễn điểm trong 24 giờ; từ lượt kế tiếp tính điểm như thường. */
export const EMPTY_FREE_PER_DAY = 3

/** Số lượt trả rỗng gần nhất của người dùng trong 24 giờ qua (đếm tối đa `limit`). Không đọc được DB thì coi là 0 (miễn điểm). */
export async function recentEmptyCalls(userId: string, limit = EMPTY_FREE_PER_DAY): Promise<number> {
  const s = supa()
  if (!s) return 0
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const q = `user_id=eq.${encodeURIComponent(userId)}&ok=eq.false&error=like.*empty%20content*&created_at=gte.${encodeURIComponent(since)}&select=id&limit=${limit}`
    const r = await fetch(`${s.base}/rest/v1/ai_calls?${q}`, { headers: s.headers, signal: AbortSignal.timeout(3000) })
    if (!r.ok) return 0
    const rows = (await r.json()) as unknown
    return Array.isArray(rows) ? rows.length : 0
  } catch {
    return 0
  }
}

export const AI_FEEDBACK_KINDS = ['up', 'down', 'undo', 'resend', 'complaint'] as const
export type AiFeedback = {
  userId: string | null
  kind: (typeof AI_FEEDBACK_KINDS)[number]
  mode: 'exam' | 'slide' | 'board'
  request: string
  reply: string
  context: string
  note: string
}

/** Ghi một dòng `ai_feedback` (người dùng không hài lòng với câu trả lời AI). Trả false nếu không ghi được. */
export async function logAiFeedback(f: AiFeedback): Promise<boolean> {
  const s = supa()
  if (!s) return false
  try {
    const r = await fetch(`${s.base}/rest/v1/ai_feedback`, {
      method: 'POST',
      headers: { ...s.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: f.userId,
        kind: f.kind,
        mode: f.mode,
        request: f.request.slice(0, 4000),
        reply: f.reply.slice(0, 8000),
        context: f.context.slice(0, 12000),
        note: f.note.slice(0, 500),
      }),
      signal: AbortSignal.timeout(3000),
    })
    return r.ok
  } catch {
    return false
  }
}

/** Chi phí từ usage của opencode (`usage.opencode.list_cost`, USD) nếu có. */
export function costFromUsage(usage: unknown, provider?: string): number | null {
  const v = (usage as { opencode?: { list_cost?: unknown } } | undefined)?.opencode?.list_cost
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return provider ? estimateCost(usage, provider) : null
}

/** Giá ước tính USD / 1 triệu token: [đầu vào, đầu vào trúng cache, đầu ra]. Đặt lại bằng env AI_PRICE_<NHÀ_CUNG_CẤP>="vào,cache,ra". */
const DEFAULT_PRICE: Record<string, [number, number, number]> = {
  deepseek: [0.27, 0.027, 1.1],
  opencode: [0.27, 0.27, 1.1],
  fosta: [0.27, 0.27, 1.1],
  anyrouter: [0.27, 0.27, 1.1],
  nightrouter: [0.27, 0.27, 1.1],
  anthropic: [3, 0.3, 15],
}

/** Provider không báo giá (mọi nơi trừ opencode): ước theo token × bảng giá. Không có usage thì null. */
export function estimateCost(usage: unknown, provider: string): number | null {
  const u = usage as
    | { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number; prompt_cache_hit_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }
    | undefined
  const inTok = Number(u?.prompt_tokens ?? u?.input_tokens) || 0
  const outTok = Number(u?.completion_tokens ?? u?.output_tokens) || 0
  if (inTok + outTok <= 0 || !Object.hasOwn(DEFAULT_PRICE, provider)) return null
  const raw = process.env[`AI_PRICE_${provider.toUpperCase()}`]
  const fromEnv = raw ? raw.split(',').map((part) => part.trim() ? Number(part) : NaN) : []
  const p = fromEnv.length === 3 && fromEnv.every((n) => Number.isFinite(n) && n >= 0) ? (fromEnv as [number, number, number]) : DEFAULT_PRICE[provider]
  const cached = Math.min(inTok, Math.max(0, Number(u?.prompt_cache_hit_tokens ?? u?.prompt_tokens_details?.cached_tokens) || 0))
  return ((inTok - cached) * p[0] + cached * p[1] + outTok * p[2]) / 1_000_000
}

export type Maintenance = { on: boolean; message?: string; until?: string | null }

let cache: { v: Maintenance; until: number } | null = null
export const _resetOpsCache = () => (cache = null)

/** Đọc cài đặt bảo trì, nhớ 30 giây (bật/tắt có hiệu lực ở server sau tối đa 30s). */
export async function readMaintenance(): Promise<Maintenance> {
  if (cache && cache.until > Date.now()) return cache.v
  const s = supa()
  let v: Maintenance = { on: false }
  if (s) {
    try {
      const r = await fetch(`${s.base}/rest/v1/app_settings?key=eq.maintenance&select=value`, { headers: s.headers, signal: AbortSignal.timeout(3000) })
      const row = r.ok ? ((await r.json()) as Array<{ value: Maintenance }>)[0] : undefined
      if (row?.value?.on) v = row.value
    } catch {
      /* đọc lỗi thì coi như không bảo trì */
    }
  }
  cache = { v, until: Date.now() + 30_000 }
  return v
}

/** true = đã trả 503 (đang bảo trì, người gọi không có quyền admin/moderator). */
export async function maintenanceBlock(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const m = await readMaintenance()
  if (!m.on) return false
  const s = supa()
  const uid = await userFromToken(req)
  if (s && uid) {
    try {
      const r = await fetch(`${s.base}/rest/v1/user_roles?user_id=eq.${uid}&select=role`, { headers: s.headers })
      if (r.ok && ((await r.json()) as unknown[]).length) return false
    } catch {
      /* lỗi thì chặn như người thường */
    }
  }
  json(res, 503, { error: m.message?.trim() || 'Ứng dụng đang bảo trì, vui lòng quay lại sau.', maintenance: true })
  return true
}
