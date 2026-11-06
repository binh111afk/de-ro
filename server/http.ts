/** Helper HTTP dùng chung cho các endpoint server-side. */
import type { IncomingMessage, ServerResponse } from 'node:http'

export function json(res: ServerResponse, code: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
  res.end(payload)
}

/** Đọc body, tối đa maxBytes (mặc định 20 MB); vượt → ném lỗi và ngắt kết nối. */
export async function readBody(req: IncomingMessage, maxBytes = 20 * 1024 * 1024): Promise<string> {
  if (Number(req.headers['content-length'] ?? 0) > maxBytes) throw new Error('Dữ liệu gửi lên quá lớn.')
  const chunks: Buffer[] = []
  let size = 0
  for await (const c of req) {
    size += (c as Buffer).length
    if (size > maxBytes) {
      req.destroy()
      throw new Error('Dữ liệu gửi lên quá lớn.')
    }
    chunks.push(c as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}
