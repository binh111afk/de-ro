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

/** Chi phí từ usage của opencode (`usage.opencode.list_cost`, USD) nếu có. */
export function costFromUsage(usage: unknown): number | null {
  const v = (usage as { opencode?: { list_cost?: unknown } } | undefined)?.opencode?.list_cost
  return typeof v === 'number' && Number.isFinite(v) ? v : null
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
