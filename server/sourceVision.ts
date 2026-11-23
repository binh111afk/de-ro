/**
 * Đọc ảnh đính kèm hoặc trang PDF thành chữ để làm nguồn cho khung chat AI.
 * Người dùng thường, tốn điểm AI: kiểm đăng nhập + số dư, giữ chỗ trước, chỉ trừ theo token thật của model.
 * Prompt cố định ở bankVision.ts nên đây không phải cổng gọi AI đọc ảnh tuỳ ý.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { TOKENS_PER_POINT, addUsage, quotaMessage, readQuota, reserveQuota } from './aiQuota.js'
import { readExamPages, VisionInputError } from './bankVision.js'
import { LOGIN_REQUIRED, clientIp, isLocal, userFromToken } from './guard.js'
import { json, readBody, safeError } from './http.js'
import { maintenanceBlock } from './ops.js'

/** số trang mỗi lượt gọi (client chia lô) */
export const VISION_PAGES_PER_CALL = 3
/** ước tính cao cho một lượt: ảnh + chữ chép lại; dùng để chặn trước và giữ chỗ */
const RESERVE_TOKENS = VISION_PAGES_PER_CALL * 2500 + 8000
const MAX_BODY = 6 * 1024 * 1024
/** DeepSeek trước vì rẻ nhất; model không đọc được ảnh thì tự rơi xuống provider kế */
const ORDER = ['deepseek', 'opencode', 'fosta', 'anthropic']

export async function handleSourceVision(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const ip = clientIp(req)
  const local = isLocal(ip)
  const userId = local ? null : await userFromToken(req)
  if (!userId && !local) return json(res, 401, { error: LOGIN_REQUIRED, loginRequired: true })
  if (await maintenanceBlock(req, res)) return

  let body: { images?: unknown }
  try {
    body = JSON.parse(await readBody(req, MAX_BODY)) as { images?: unknown }
  } catch {
    return json(res, 400, { error: 'Yêu cầu không hợp lệ hoặc quá lớn.' })
  }

  const quota = local ? null : await readQuota(userId, ip)
  if (quota && quota.limit - quota.used < RESERVE_TOKENS) {
    const need = Math.ceil(RESERVE_TOKENS / TOKENS_PER_POINT).toLocaleString('vi-VN')
    const left = Math.max(0, Math.floor((quota.limit - quota.used) / TOKENS_PER_POINT)).toLocaleString('vi-VN')
    return json(res, 429, { error: quota.limit - quota.used >= 1000 ? `Đọc ảnh cần khoảng ${need} điểm AI mỗi lượt nhưng bạn chỉ còn ${left} điểm.` : quotaMessage(quota), quota, code: 'quota' })
  }
  const release = quota ? await reserveQuota(userId, ip, quota, RESERVE_TOKENS) : async () => {}
  if (!release) return json(res, 429, { error: 'Đang có nhiều yêu cầu AI chạy cùng lúc, vui lòng thử lại sau ít giây.', quota })

  try {
    const r = await readExamPages(body.images, userId ?? 'local', { text: true, maxImages: VISION_PAGES_PER_CALL, order: ORDER })
    const after = await addUsage(userId, ip, r.tokens, quota)
    return json(res, 200, { text: r.content.trim(), quota: after, ...(local ? { model: r.model } : {}) })
  } catch (err) {
    // lỗi thì không trừ điểm (addUsage chỉ chạy khi đọc thành công)
    const bad = err instanceof VisionInputError
    return json(res, bad ? 400 : 502, { error: bad ? err.message : safeError(err, local, 'Không đọc được ảnh. Vui lòng thử lại sau.') })
  } finally {
    await release()
  }
}
