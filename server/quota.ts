/**
 * GET /api/quota — chỉ đọc điểm AI (trang Hồ sơ). Tách khỏi /api/llm (kéo theo Anthropic, trích tệp, tìm kiếm,
 * tạo ảnh…) để hàm nhỏ, khởi động nguội nhanh: ô "Điểm AI" hiện số sau vài trăm ms thay vì vài giây.
 *
 * POST /api/quota — ghi tín hiệu người dùng không hài lòng với AI (bảng `ai_feedback`). Đặt chung hàm này
 * để không thêm hàm Vercel mới.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody, safeError } from './http.js'
import { clientIp, guard, isLocal, userFromToken } from './guard.js'
import { hasQuotaStore, readQuota } from './aiQuota.js'
import { AI_FEEDBACK_KINDS, logAiFeedback, type AiFeedback } from './ops.js'

const str = (v: unknown) => (typeof v === 'string' ? v : '')

async function handleFeedback(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = clientIp(req)
  const userId = await userFromToken(req)
  if (!userId && !isLocal(ip)) return json(res, 401, { error: 'Cần đăng nhập.' })
  let body: Record<string, unknown>
  try {
    body = JSON.parse(await readBody(req, 64 * 1024)) as Record<string, unknown>
  } catch {
    return json(res, 400, { error: 'Yêu cầu không hợp lệ hoặc quá lớn.' })
  }
  const kind = AI_FEEDBACK_KINDS.find((k) => k === body.kind)
  if (!kind) return json(res, 400, { error: 'kind không hợp lệ.' })
  const mode: AiFeedback['mode'] = body.mode === 'slide' || body.mode === 'board' ? body.mode : 'exam'
  const saved = await logAiFeedback({
    userId,
    kind,
    mode,
    request: str(body.request),
    reply: str(body.reply),
    context: str(body.context),
    note: str(body.note),
  })
  json(res, 200, { saved })
}

export async function handleQuotaRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'llm'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method === 'POST') return handleFeedback(req, res)
  if (req.method !== 'GET') return json(res, 405, { error: 'Chỉ hỗ trợ GET, POST.' })
  const ip = clientIp(req)
  const userId = isLocal(ip) ? null : await userFromToken(req)
  const quota = isLocal(ip) ? null : await readQuota(userId, ip)
  // null = máy dev / ngoại lệ không giới hạn (cùng quy ước với GET /api/llm)
  json(res, 200, { quota, unlimited: !!userId && quota === null && hasQuotaStore() })
}

export function quotaMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleQuotaRequest(req, res).catch((err: unknown) => json(res, 500, { error: safeError(err, isLocal(clientIp(req))) }))
}
