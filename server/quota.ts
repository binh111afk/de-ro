/**
 * GET /api/quota — chỉ đọc điểm AI (trang Hồ sơ). Tách khỏi /api/llm (kéo theo Anthropic, trích tệp, tìm kiếm,
 * tạo ảnh…) để hàm nhỏ, khởi động nguội nhanh: ô "Điểm AI" hiện số sau vài trăm ms thay vì vài giây.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json } from './http.js'
import { clientIp, guard, isLocal, userFromToken } from './guard.js'
import { hasQuotaStore, readQuota } from './aiQuota.js'

export async function handleQuotaRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'llm'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'GET') return json(res, 405, { error: 'Chỉ hỗ trợ GET.' })
  const ip = clientIp(req)
  const userId = isLocal(ip) ? null : await userFromToken(req)
  const quota = isLocal(ip) ? null : await readQuota(userId, ip)
  // null = máy dev / ngoại lệ không giới hạn (cùng quy ước với GET /api/llm)
  json(res, 200, { quota, unlimited: !!userId && quota === null && hasQuotaStore() })
}

export function quotaMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') return next()
  handleQuotaRequest(req, res).catch((err: unknown) => json(res, 500, { error: String(err) }))
}
