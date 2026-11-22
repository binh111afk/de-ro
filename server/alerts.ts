/**
 * GET /api/alert — kiểm số liệu rồi báo bất thường qua Telegram. Gọi mỗi 5 phút bởi pg_cron (Supabase),
 * kèm `Authorization: Bearer <ALERT_SECRET>`. Mỗi loại cảnh báo chỉ báo lại sau ALERT_COOLDOWN_MIN phút (bảng `alert_state`).
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ALERT_SECRET, SUPABASE_SERVICE_ROLE_KEY. Ngưỡng đổi bằng env ALERT_*.
 */
import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, safeError, supabaseServiceConfig } from './http.js'

export type AlertMetrics = {
  signups_1h: number
  ai_total_15m: number
  ai_err_15m: number
  ai_total_10m: number
  ai_ok_10m: number
  ai_cost_today: number
  maintenance_since: string | null
  api_5xx_15m?: number
  pay_failed_1h?: number
}

const num = (name: string, fallback: number) => {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? v : fallback
}

/** Trả danh sách cảnh báo đang xảy ra: [loại, nội dung]. */
export function evaluateAlerts(m: AlertMetrics, now = Date.now()): [string, string][] {
  const out: [string, string][] = []
  const maxSignups = num('ALERT_SIGNUPS_1H', 10)
  if (m.signups_1h > maxSignups) out.push(['signups', `Tài khoản mới tăng đột biến: ${m.signups_1h} trong 1 giờ (ngưỡng ${maxSignups}).`])

  const minCalls = num('ALERT_AI_MIN_CALLS', 10)
  const maxErr = num('ALERT_AI_ERR_RATE', 0.3)
  if (m.ai_total_15m >= minCalls && m.ai_err_15m / m.ai_total_15m > maxErr) {
    out.push(['ai_errors', `Lượt AI lỗi cao: ${m.ai_err_15m}/${m.ai_total_15m} trong 15 phút (${Math.round((m.ai_err_15m / m.ai_total_15m) * 100)}%).`])
  }
  if (m.ai_total_10m >= 3 && m.ai_ok_10m === 0) out.push(['ai_down', `AI chết hẳn: ${m.ai_total_10m} lượt gọi trong 10 phút, không lượt nào thành công.`])

  const maxCost = num('ALERT_AI_COST_USD', 5)
  if (m.ai_cost_today > maxCost) out.push(['ai_cost', `Chi phí AI hôm nay ước tính $${m.ai_cost_today.toFixed(2)} (ngưỡng $${maxCost}).`])

  const maxMaint = num('ALERT_MAINTENANCE_MIN', 120)
  if (m.maintenance_since && now - Date.parse(m.maintenance_since) > maxMaint * 60_000) {
    out.push(['maintenance', `Đang bảo trì hơn ${maxMaint} phút (từ ${new Date(m.maintenance_since).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}).`])
  }

  const apiErrors = m.api_5xx_15m ?? 0
  if (apiErrors >= num('ALERT_API_5XX', 5)) out.push(['api_5xx', `API lỗi 5xx: ${apiErrors} lần trong 15 phút.`])

  const failedPayments = m.pay_failed_1h ?? 0
  if (failedPayments >= num('ALERT_PAY_FAILED', 1)) out.push(['pay_failed', `Đơn nạp PayOS lỗi: ${failedPayments} đơn trong 1 giờ.`])
  return out
}

function authorized(req: IncomingMessage): boolean {
  const secret = process.env.ALERT_SECRET ?? ''
  if (secret.length < 16) return false
  const got = Buffer.from(String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, ''))
  const want = Buffer.from(secret)
  return got.length === want.length && timingSafeEqual(got, want)
}

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? ''
  const chat = process.env.TELEGRAM_CHAT_ID ?? ''
  if (!token || !chat) return false
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  })
  return r.ok
}

export async function handleAlertRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!authorized(req)) return json(res, 401, { error: 'Không được phép.' })
  const s = supabaseServiceConfig()
  if (!s) return json(res, 503, { error: 'Thiếu cấu hình Supabase.' })
  try {
    const cutoff = new Date(Date.now() - 3 * 86_400_000).toISOString()
    const cleanup = Promise.resolve().then(() => fetch(`${s.base}/rest/v1/api_errors?at=lt.${cutoff}`, {
      method: 'DELETE',
      headers: s.headers,
      signal: AbortSignal.timeout(3_000),
    })).catch(() => {})
    const [r] = await Promise.all([
      fetch(`${s.base}/rest/v1/rpc/alert_metrics`, { method: 'POST', headers: s.headers, body: '{}', signal: AbortSignal.timeout(15_000) }),
      cleanup,
    ])
    if (!r.ok) throw new Error(`alert_metrics ${r.status}`)
    const metrics = (await r.json()) as AlertMetrics
    const active = evaluateAlerts(metrics)

    const cooldown = num('ALERT_COOLDOWN_MIN', 60) * 60_000
    const sr = await fetch(`${s.base}/rest/v1/alert_state?select=kind,last_sent_at`, { headers: s.headers, signal: AbortSignal.timeout(15_000) })
    const state = new Map<string, number>(
      sr.ok ? ((await sr.json()) as { kind: string; last_sent_at: string }[]).map((x) => [x.kind, Date.parse(x.last_sent_at)]) : [],
    )

    const sent: string[] = []
    for (const [kind, text] of active) {
      if (Date.now() - (state.get(kind) ?? 0) < cooldown) continue
      if (!(await sendTelegram(`⚠️ đề rõ\n${text}`))) continue
      sent.push(kind)
      await fetch(`${s.base}/rest/v1/alert_state?on_conflict=kind`, {
        method: 'POST',
        headers: { ...s.headers, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ kind, last_sent_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(15_000),
      })
    }
    json(res, 200, { active: active.map((a) => a[0]), sent })
  } catch (err) {
    json(res, 500, { error: safeError(err) })
  }
}
