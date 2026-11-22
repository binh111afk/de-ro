/** Helper HTTP dùng chung cho các endpoint server-side. */
import type { IncomingMessage, ServerResponse } from 'node:http'

export function supabaseServiceConfig() {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && key ? { base, headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' } } : null
}

const apiErrorWrites: number[] = []

async function recordApiError(res: ServerResponse, status: number) {
  const url = res.req?.url
  const path = url ? new URL(url, 'http://localhost').pathname : ''
  if (path === '/api/alert' || path === '/api/alert/') return
  const s = supabaseServiceConfig()
  if (!s) return

  const now = Date.now()
  while (apiErrorWrites.length && apiErrorWrites[0] <= now - 60_000) apiErrorWrites.shift()
  if (apiErrorWrites.length >= 20) return
  apiErrorWrites.push(now)

  await fetch(s.base + '/rest/v1/api_errors', {
    method: 'POST',
    headers: s.headers,
    body: JSON.stringify({ status, path: path.slice(0, 200) }),
    signal: AbortSignal.timeout(3_000),
  })
}

export function json(res: ServerResponse, code: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-ai-retry-of',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
  res.end(payload)
  if (code >= 500 && code !== 503) void recordApiError(res, code).catch(() => {})
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

/** Trả thông báo lỗi an toàn cho client: máy dev giữ chi tiết, production trả câu chung và log server. */
export function safeError(err: unknown, local = false, fallback = 'Máy chủ đang bận, thử lại sau.'): string {
  if (local) return err instanceof Error ? err.message : String(err)
  console.error('[server]', err)
  return fallback
}
