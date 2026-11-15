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
import { json, readBody } from './http.js'
import { guard, isLocal, clientIp, userFromToken } from './guard.js'
import { maintenanceBlock } from './ops.js'

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

/** Thông tin để admin xem (không có secret). */
export function r2Info() {
  const c = r2Config()
  return { endpoint: c.accountId ? `https://${c.accountId}.r2.cloudflarestorage.com/${c.bucket}` : '', accessKeyId: c.accessKeyId }
}

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
  method: 'GET' | 'PUT' | 'DELETE',
  key: string,
  body: Buffer | null,
  contentType?: string,
  meta?: Record<string, string>,
): Promise<Response> {
  const cfg = r2Config()
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`
  const uri = `/${cfg.bucket}/${key}`
  const amz = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const date = amz.slice(0, 8)
  const payloadHash = sha256Hex(body ?? '')
  // metadata (x-amz-meta-*) phải nằm trong chữ ký, xếp theo tên header
  const metaHeaders = Object.entries(meta ?? {}).map(([k, v]) => [`x-amz-meta-${k.toLowerCase()}`, v] as const).sort(([a], [b]) => a.localeCompare(b))
  const signedHeaders = [contentType ? 'content-type' : '', 'host', 'x-amz-content-sha256', 'x-amz-date', ...metaHeaders.map(([k]) => k)].filter(Boolean).join(';')
  const headerLines =
    (contentType ? `content-type:${contentType}\n` : '') +
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amz}\n` +
    metaHeaders.map(([k, v]) => `${k}:${v}\n`).join('')
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
  for (const [k, v] of metaHeaders) headers[k] = v
  return fetch(`https://${host}${uri}`, {
    method,
    headers,
    body: body ? new Uint8Array(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  })
}

/** Admin kiểm tra R2: đọc một key không tồn tại; 404 = chữ ký đúng, bucket truy cập được. */
export async function pingR2(): Promise<{ ok: boolean; ms: number; error?: string }> {
  const cfg = r2Config()
  if (!cfg.accountId || !cfg.bucket) return { ok: false, ms: 0, error: 'Chưa cấu hình R2.' }
  const t0 = Date.now()
  try {
    const r = await r2Request('GET', `health-check-${t0}`, null)
    const ok = r.status === 404 || r.ok
    return { ok, ms: Date.now() - t0, ...(ok ? {} : { error: `R2 trả ${r.status}` }) }
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, error: err instanceof Error ? err.message : String(err) }
  }
}

/** Xoá một tệp trên R2 (admin xoá tài khoản / tài liệu). Key sai định dạng thì bỏ qua. */
export async function deleteR2Object(key: string): Promise<boolean> {
  if (!KEY_PATTERN.test(key)) return false
  const r = await r2Request('DELETE', key, null)
  return r.ok || r.status === 404
}

/** `/api/files/doc/<hash>.pdf` → `doc/<hash>.pdf`; không phải tệp R2 của app → null */
export function r2KeyFromUrl(url: string): string | null {
  const key = url.replace(/^.*\/api\/files\//, '')
  return KEY_PATTERN.test(key) ? key : null
}

/** Key tệp tài liệu từ `user_documents.url` (cột người dùng tự ghi được): chỉ nhận `doc/`, không bao giờ trỏ tới ảnh trong đề. */
export function r2DocKeyFromUrl(url: string): string | null {
  const key = r2KeyFromUrl(url)
  return key?.startsWith('doc/') ? key : null
}

export async function handleUploadRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'upload'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  if (await maintenanceBlock(req, res)) return

  try {
    const body = JSON.parse(await readBody(req)) as { dataUrl?: unknown; name?: unknown; subject?: unknown }
    const match = typeof body.dataUrl === 'string' ? /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl) : null
    const ext = match ? EXT[match[1]] : undefined
    if (!match || !ext) {
      return json(res, 400, { error: 'Chỉ nhận ảnh PNG, JPEG, WebP, GIF hoặc tệp PDF, DOCX dạng base64' })
    }
    const isDoc = DOC_TYPES.has(ext)
    // tài liệu riêng phải gắn với một tài khoản (máy dev thì gắn 'local')
    const owner = isDoc ? (isLocal(clientIp(req)) ? 'local' : await userFromToken(req)) : null
    if (isDoc && !owner) return json(res, 401, { error: 'Bạn cần đăng nhập để tải tài liệu lên.' })
    const buf = Buffer.from(match[2], 'base64')
    const limit = isDoc ? MAX_DOC_BYTES : MAX_BYTES
    if (buf.length === 0 || buf.length > limit) {
      return json(res, 400, { error: `Tệp rỗng hoặc quá lớn (tối đa ${limit / 1024 / 1024} MB)` })
    }
    // tài liệu: key băm cả chủ tệp → mỗi người một bản, không ghi đè chủ của người khác cùng nội dung
    const hash = isDoc ? sha256Hex(Buffer.concat([Buffer.from(`${owner}\n`), buf])) : sha256Hex(buf)
    const key = `${isDoc ? 'doc' : 'img'}/${hash.slice(0, 40)}.${ext}`
    // tài liệu: kiểm dung lượng theo cỡ THẬT trước khi ghi (trước đây cột `size` do trình duyệt tự khai)
    const sb = isDoc && owner !== 'local' ? serviceDb() : null
    if (sb) {
      const quota = await storageLeft(sb, owner as string)
      if (quota !== null && buf.length > quota) {
        return json(res, 413, { error: `Tệp vượt dung lượng còn lại (${(Math.max(0, quota) / 1048576).toFixed(1)} MB). Xoá bớt tệp ở trang Hồ sơ để tải tiếp.` })
      }
    }
    const put = await r2Request('PUT', key, buf, match[1], owner ? { owner } : undefined)
    if (!put.ok) return json(res, 502, { error: `R2 trả lỗi ${put.status}` })
    const url = `/api/files/${key}`
    // máy chủ tự ghi dòng danh sách với cỡ đo được
    if (sb) {
      const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 200) : `tai-lieu.${ext}`
      const subject = typeof body.subject === 'string' && body.subject ? body.subject.slice(0, 60) : null
      const ins = await fetch(`${sb.base}/rest/v1/user_documents?select=id,name,mime,size,url,subject,created_at`, {
        method: 'POST',
        headers: { ...sb.headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ owner_id: owner, name, mime: match[1], size: buf.length, url, subject }),
      })
      if (!ins.ok) return json(res, 502, { error: 'Không ghi được tài liệu vào danh sách.' })
      const [doc] = (await ins.json()) as unknown[]
      return json(res, 200, { url, doc })
    }
    return json(res, 200, { url })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

/**
 * Tài liệu riêng (`doc/`): chỉ chủ tệp đọc được. Chủ tệp lấy từ metadata `owner` server ghi lúc tải lên
 * — KHÔNG từ `user_documents.url` (cột người dùng tự ghi được: tự thêm một dòng trỏ vào tệp người khác là
 * từng đọc được). Tệp cũ chưa có metadata: chỉ cho khi MỌI dòng `user_documents` trỏ tới tệp đều của cùng
 * một người (không dựa vào created_at — cột đó người dùng tự ghi lùi ngày được). Có người khác tự thêm
 * dòng trỏ vào thì không ai đọc được, thà khoá còn hơn lộ.
 * (`img/` vẫn công khai: ảnh nằm trong đề đã chia sẻ / đề cộng đồng.)
 */
async function ownsDocument(userId: string | null, key: string, metaOwner: string | null): Promise<boolean> {
  if (!userId) return false
  if (metaOwner) return metaOwner === userId
  const sb = serviceDb()
  if (!sb) return false
  try {
    const url = encodeURIComponent(`/api/files/${key}`)
    const r = await fetch(`${sb.base}/rest/v1/user_documents?select=owner_id&url=eq.${url}&limit=50`, { headers: sb.headers })
    const rows = r.ok ? ((await r.json()) as Array<{ owner_id: string }>) : []
    return rows.length > 0 && rows.every((x) => x.owner_id === userId)
  } catch {
    return false
  }
}

function serviceDb(): { base: string; headers: Record<string, string> } | null {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && service ? { base, headers: { apikey: service, Authorization: `Bearer ${service}` } } : null
}

/** dung lượng còn lại (byte); null = không kiểm được (để trigger ở DB chặn) */
async function storageLeft(sb: { base: string; headers: Record<string, string> }, userId: string): Promise<number | null> {
  try {
    const call = async (fn: string) => {
      const r = await fetch(`${sb.base}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { ...sb.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_user: userId }),
      })
      return r.ok ? Number(await r.json()) : NaN
    }
    const [used, max] = await Promise.all([call('storage_used'), call('storage_max_bytes')])
    return Number.isFinite(used) && Number.isFinite(max) ? max - used : null
  } catch {
    return null
  }
}

export async function handleFileRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })
  // Vite cắt tiền tố `/api/files` khỏi req.url, còn lại `/img/<hash>.<ext>`
  const key = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\/+/, ''))
  if (!KEY_PATTERN.test(key)) return json(res, 404, { error: 'Không tìm thấy tệp' })
  const isDoc = key.startsWith('doc/')
  const userId = isDoc ? (isLocal(clientIp(req)) ? 'local' : await userFromToken(req)) : null
  // chưa đăng nhập thì khỏi hỏi R2
  if (isDoc && !userId) return json(res, 404, { error: 'Không tìm thấy tệp' })

  try {
    const got = await r2Request('GET', key, null)
    if (!got.ok) return json(res, got.status === 404 ? 404 : 502, { error: `R2 trả lỗi ${got.status}` })
    // không phải chủ thì báo 404 như không có tệp: không lộ cả việc tệp có tồn tại hay không
    if (isDoc && !(userId === 'local' || (await ownsDocument(userId, key, got.headers.get('x-amz-meta-owner'))))) {
      return json(res, 404, { error: 'Không tìm thấy tệp' })
    }
    res.writeHead(200, {
      'Content-Type': got.headers.get('content-type') ?? 'application/octet-stream',
      // tên file là hash nội dung nên không bao giờ đổi; tài liệu riêng thì không cho proxy/CDN giữ
      'Cache-Control': isDoc ? 'private, no-store' : 'public, max-age=31536000, immutable',
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
