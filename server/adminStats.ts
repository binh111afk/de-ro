/**
 * Admin giai đoạn 5 (Số liệu): các action của /api/admin. Xem docs/prompt-admin-stats.md.
 * Đã được gộp vào ACTIONS trong server/admin.ts; chỉ cần thêm action vào object dưới.
 * Helper dùng chung import từ './admin.js': call, audit, HttpError, str, needUser, protectTarget.
 * KHÔNG gọi các helper đó ở top-level (admin.ts và file này import vòng nhau; chỉ dùng trong `run`).
 */
import type { ActionMap } from './admin.js'

export const STATS_ACTIONS: ActionMap = {}
