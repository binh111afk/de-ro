// Vercel function: /api/files/<key> được vercel.json chuyển thành /api/files?key=<key>.
// Handler dùng chung đọc key từ req.url (như dev, nơi Vite đã cắt tiền tố /api/files).
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleFileRequest } from '../server/r2'

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const key = new URL(req.url ?? '/', 'http://x').searchParams.get('key') ?? ''
  req.url = `/${key}`
  return handleFileRequest(req, res)
}
