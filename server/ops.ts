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
  /** nhãn loại việc (xem aiKind) */
  kind?: string
  /** token tính vào hạn mức người dùng cho lượt này (chỉ lượt thành công) */
  billed?: number
}

/**
 * Nhãn loại việc của một lượt gọi AI, suy ra từ tên task + dữ liệu client gửi (không tin chữ client tự đặt nhãn).
 *   task-doc      soạn / sửa đề         question       hỏi đáp chữ thường (đề, slide)
 *   ask-clarify   hỏi lại trước khi soạn task-slide     lập dàn ý / viết slide
 *   task-slide-pro lập dàn ý / viết slide chế độ Chuyên nghiệp (task-slide = chế độ thường)
 *   edit-slide    sửa slide có sẵn bằng lệnh
 *   board         bảng vẽ               web-search     tìm trên web
 *   task-exam-online đề tương tác       edit-question  sửa một câu / một đoạn
 *   figure        hình / đồ thị         bank           ngân hàng câu hỏi (admin)
 *   matrix        ma trận đề            image          vẽ ảnh (image-pro = ảnh slide Chuyên nghiệp)
 *   vision-source đọc ảnh PDF làm nguồn vision-bank    đọc ảnh đề cho ngân hàng
 */
export function aiKind(task?: unknown, input?: unknown): string {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  switch (task) {
    case 'soan-de':
      return o.intent === 'chat' ? 'question' : 'task-doc'
    case 'hoi-truoc':
      return 'ask-clarify'
    case 'slide-chat':
      return o.variant === 'chat' ? 'question' : o.pro === true ? 'task-slide-pro' : 'task-slide'
    case 'slide-lo':
    case 'slide-trang':
      return o.pro === true ? 'task-slide-pro' : 'task-slide'
    case 'slide-sua':
    case 'sua-slide':
      return 'edit-slide'
    case 'bang-ve':
      return 'board'
    case 'tim-web':
      return 'web-search'
    case 'de-online':
      return 'task-exam-online'
    case 'sua-cau':
      return 'edit-question'
    case 've-do-thi':
    case 'chon-hinh':
      return 'figure'
    case 'ngan-hang':
      return 'bank'
    case 'ma-tran':
      return 'matrix'
    default:
      return typeof task === 'string' ? 'other' : 'untagged'
  }
}

export async function logAiCall(c: AiCall): Promise<void> {
  const s = supa()
  if (!s) return
  const row = {
    user_id: c.userId,
    model: c.model.slice(0, 120),
    provider: c.provider.slice(0, 40),
    ok: c.ok,
    error: c.error ? c.error.slice(0, 500) : null,
    prompt_tokens: Math.max(0, Math.round(c.promptTokens ?? 0)),
    completion_tokens: Math.max(0, Math.round(c.completionTokens ?? 0)),
    cost: c.cost ?? null,
    ms: Math.max(0, Math.round(c.ms)),
  }
  const post = (body: object) =>
    fetch(`${s.base}/rest/v1/ai_calls`, {
      method: 'POST',
      headers: { ...s.headers, Prefer: 'return=minimal' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    })
  try {
    const r = await post({
      ...row,
      kind: c.kind ? c.kind.slice(0, 40) : null,
      billed: c.billed === undefined ? null : Math.max(0, Math.round(c.billed)),
    })
    // chưa áp migration cột kind / billed: ghi lại không có hai cột đó để log (và luật miễn điểm lượt hỏng) không mất
    if (r.status === 400) await post(row)
  } catch {
    /* log hỏng thì thôi */
  }
}

/** Số lượt hỏng (người dùng không nhận được gì) mỗi người được miễn điểm trong 24 giờ; từ lượt kế tiếp tính điểm như thường. */
export const EMPTY_FREE_PER_DAY = 3

/** Điều kiện lọc ai_calls (PostgREST) cho lượt hỏng được miễn điểm: model trả rỗng (hết trần token…) hoặc luồng đứt giữa chừng. Dùng chung cho đếm và admin. */
export const FREE_FAIL_FILTER = `ok=eq.false&or=(error.like.*empty%20content*,error.like.*${encodeURIComponent('ngắt giữa chừng')}*)`

/** Số lượt hỏng được miễn điểm gần nhất của người dùng trong 24 giờ qua (đếm tối đa `limit`). Không đọc được DB thì coi như đã hết lượt miễn (tính điểm bình thường). */
export async function recentFreeFails(userId: string, limit = EMPTY_FREE_PER_DAY): Promise<number> {
  const s = supa()
  if (!s) return 0
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const q = `user_id=eq.${encodeURIComponent(userId)}&${FREE_FAIL_FILTER}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=${limit}`
    const r = await fetch(`${s.base}/rest/v1/ai_calls?${q}`, { headers: s.headers, signal: AbortSignal.timeout(3000) })
    if (!r.ok) return limit
    const rows = (await r.json()) as unknown
    return Array.isArray(rows) ? rows.length : limit
  } catch {
    return limit
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
export function costFromUsage(usage: unknown, provider?: string, at: Date = new Date()): number | null {
  const v = (usage as { opencode?: { list_cost?: unknown } } | undefined)?.opencode?.list_cost
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return provider ? estimateCost(usage, provider, at) : null
}

/** DeepSeek deepseek-flash (api-docs.deepseek.com/quick_start/pricing): giờ thấp điểm bằng một nửa giờ cao điểm. */
const DEEPSEEK_PEAK: [number, number, number] = [0.3, 0.006, 1.2]
const DEEPSEEK_OFF_PEAK: [number, number, number] = [0.15, 0.003, 0.6]

/** Cao điểm: thứ Hai–thứ Sáu, 01:00–04:00 và 06:00–10:00 UTC. Không biết ngày lễ Trung Quốc (ngày đó tính cao hơn thật). */
export function isDeepseekPeak(at: Date): boolean {
  const day = at.getUTCDay()
  const hour = at.getUTCHours()
  return day >= 1 && day <= 5 && ((hour >= 1 && hour < 4) || (hour >= 6 && hour < 10))
}

/** Giá ước tính USD / 1 triệu token: [đầu vào, đầu vào trúng cache, đầu ra]. Đặt lại bằng env AI_PRICE_<NHÀ_CUNG_CẤP>="vào,cache,ra". */
const DEFAULT_PRICE: Record<string, [number, number, number]> = {
  deepseek: DEEPSEEK_PEAK,
  opencode: [0.27, 0.27, 1.1],
  fosta: [0.27, 0.27, 1.1],
  anyrouter: [0.27, 0.27, 1.1],
  nightrouter: [0.27, 0.27, 1.1],
  anthropic: [3, 0.3, 15],
}

/** Provider không báo giá (mọi nơi trừ opencode): ước theo token × bảng giá. Không có usage thì null. */
export function estimateCost(usage: unknown, provider: string, at: Date = new Date()): number | null {
  const u = usage as
    | { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number; prompt_cache_hit_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } }
    | undefined
  const inTok = Number(u?.prompt_tokens ?? u?.input_tokens) || 0
  const outTok = Number(u?.completion_tokens ?? u?.output_tokens) || 0
  if (inTok + outTok <= 0 || !Object.hasOwn(DEFAULT_PRICE, provider)) return null
  const raw = process.env[`AI_PRICE_${provider.toUpperCase()}`]
  const fromEnv = raw ? raw.split(',').map((part) => part.trim() ? Number(part) : NaN) : []
  const p = fromEnv.length === 3 && fromEnv.every((n) => Number.isFinite(n) && n >= 0) ? (fromEnv as [number, number, number]) : provider === 'deepseek' && !isDeepseekPeak(at) ? DEEPSEEK_OFF_PEAK : DEFAULT_PRICE[provider]
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
