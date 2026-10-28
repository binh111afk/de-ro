/**
 * Lưu ảnh lên Cloudflare R2 — khoá truy cập chỉ nằm server-side (`.env`).
 *
 * POST /api/upload  {dataUrl}  → {url}   ghi ảnh (img/) hoặc tệp PDF/DOCX (doc/), tên theo hash nội dung
 * GET  /api/files/<key>        → ảnh     đọc lại qua server (bucket để private)
 *
 * Cấu hình: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
 * Ký request theo AWS SigV4 (R2 dùng chuẩn S3, region `auto`).
 */
import { createHash, createHmac } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http'

const MAX_BYTES = 8 * 1024 * 1024
const MAX_DOC_BYTES = 20 * 1024 * 1024
const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}
const DOC_TYPES = new Set(['pdf', 'docx'])
const KEY_PATTERN = /^(img|doc)\/[a-f0-9]{40}\.(png|jpg|webp|gif|pdf|docx)$/

const sha256Hex = (data: Buffer | string) => createHash('sha256').update(data).digest('hex')
const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest()

function r2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secret: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET ?? '',
  }
}

/** Gọi R2 với chữ ký SigV4; `body` là null khi đọc. */
async function r2Request(
  method: 'GET' | 'PUT',
  key: string,
  body: Buffer | null,
  contentType?: string,
): Promise<Response> {
  const cfg = r2Config()
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`
  const uri = `/${cfg.bucket}/${key}`
  const amz = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const date = amz.slice(0, 8)
  const payloadHash = sha256Hex(body ?? '')
  const signedHeaders = contentType
    ? 'content-type;host;x-amz-content-sha256;x-amz-date'
    : 'host;x-amz-content-sha256;x-amz-date'
  const headerLines =
    (contentType ? `content-type:${contentType}\n` : '') +
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amz}\n`
  const canonical = [method, uri, '', headerLines, signedHeaders, payloadHash].join('\n')
  const scope = `${date}/auto/s3/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', amz, scope, sha256Hex(canonical)].join('\n')
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secret}`, date), 'auto'), 's3'), 'aws4_request')
  const signature = createHmac('sha256', signingKey).update(toSign).digest('hex')

  const headers: Record<string, string> = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amz,
    Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  }
  if (contentType) headers['content-type'] = contentType
  return fetch(`https://${host}${uri}`, {
    method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  })
}

export async function handleUploadRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = JSON.parse(await readBody(req)) as { dataUrl?: unknown }
    const match = typeof body.dataUrl === 'string' ? /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl) : null
    const ext = match ? EXT[match[1]] : undefined
    if (!match || !ext) {
      return json(res, 400, { error: 'Chỉ nhận ảnh PNG, JPEG, WebP, GIF hoặc tệp PDF, DOCX dạng base64' })
    }
    const isDoc = DOC_TYPES.has(ext)
    const buf = Buffer.from(match[2], 'base64')
    const limit = isDoc ? MAX_DOC_BYTES : MAX_BYTES
    if (buf.length === 0 || buf.length > limit) {
      return json(res, 400, { error: `Tệp rỗng hoặc quá lớn (tối đa ${limit / 1024 / 1024} MB)` })
    }
    const key = `${isDoc ? 'doc' : 'img'}/${sha256Hex(buf).slice(0, 40)}.${ext}`
    const put = await r2Request('PUT', key, buf, match[1])
    if (!put.ok) return json(res, 502, { error: `R2 trả lỗi ${put.status}` })
    return json(res, 200, { url: `/api/files/${key}` })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

export async function handleFileRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })
  // Vite cắt tiền tố `/api/files` khỏi req.url, còn lại `/img/<hash>.<ext>`
  const key = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\/+/, ''))
  if (!KEY_PATTERN.test(key)) return json(res, 404, { error: 'Không tìm thấy tệp' })

  try {
    const got = await r2Request('GET', key, null)
    if (!got.ok) return json(res, got.status === 404 ? 404 : 502, { error: `R2 trả lỗi ${got.status}` })
    res.writeHead(200, {
      'Content-Type': got.headers.get('content-type') ?? 'application/octet-stream',
      // tên file là hash nội dung nên không bao giờ đổi
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    res.end(Buffer.from(await got.arrayBuffer()))
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function uploadMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleUploadRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}

export function fileMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'GET') return next()
  handleFileRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}
