/**
 * Lưu ảnh lên Cloudflare R2 — khoá truy cập chỉ nằm server-side (`.env`).
 *
 * POST /api/upload  {dataUrl}  → {url}   ghi ảnh (img/) hoặc tệp PDF/DOCX (doc/), tên theo hash nội dung
 * DELETE /api/upload?id=<uuid>          xoá tài liệu của mình (dòng danh sách + tệp R2)
 * GET  /api/files/<key>        → ảnh     đọc lại qua server (bucket để private)
 *
 * Cấu hình: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.
 * Ký request theo AWS SigV4 (R2 dùng chuẩn S3, region `auto`).
 */
import { createHash, createHmac } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http.js'
import { guard, isLocal, clientIp, rateLimitOnly, userFromToken } from './guard.js'
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
  method: 'GET' | 'HEAD' | 'PUT' | 'DELETE',
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

type Sb = { base: string; headers: Record<string, string> }

/** gọi RPC bằng service key; lỗi QUOTA:<lời báo> của DB tách riêng để báo người dùng */
async function rpc<T>(sb: Sb, fn: string, body: unknown): Promise<{ data?: T; quota?: string; failed?: boolean }> {
  try {
    const r = await fetch(`${sb.base}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { ...sb.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await r.json().catch(() => null)) as (T & { message?: string }) | null
    if (r.ok) return { data: data as T }
    const msg = typeof data?.message === 'string' ? data.message : ''
    return msg.includes('QUOTA:') ? { quota: msg.replace(/^.*QUOTA:/, '') } : { failed: true }
  } catch {
    return { failed: true }
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function handleUploadRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'upload'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method === 'DELETE') return handleDeleteDocument(req, res)
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
    // mọi tệp (cả ảnh) phải gắn với một tài khoản để tính hạn mức; máy dev thì gắn 'local', không tính
    const owner = isLocal(clientIp(req)) ? 'local' : await userFromToken(req)
    if (!owner) return json(res, 401, { error: `Bạn cần đăng nhập để tải ${isDoc ? 'tài liệu' : 'ảnh'} lên.`, loginRequired: true })
    const buf = Buffer.from(match[2], 'base64')
    const limit = isDoc ? MAX_DOC_BYTES : MAX_BYTES
    if (buf.length === 0 || buf.length > limit) {
      return json(res, 400, { error: `Tệp rỗng hoặc quá lớn (tối đa ${limit / 1024 / 1024} MB)` })
    }
    // tài liệu: key băm cả chủ tệp → mỗi người một bản, không ghi đè chủ của người khác cùng nội dung
    const hash = isDoc ? sha256Hex(Buffer.concat([Buffer.from(`${owner}\n`), buf])) : sha256Hex(buf)
    const key = `${isDoc ? 'doc' : 'img'}/${hash.slice(0, 40)}.${ext}`
    const url = `/api/files/${key}`

    // giữ chỗ trong hạn mức TRƯỚC khi ghi R2, nguyên tử ở DB (khoá theo chủ). Không kiểm được → từ chối.
    const sb = owner === 'local' ? null : serviceDb()
    if (owner !== 'local' && !sb) return json(res, 503, { error: 'Máy chủ chưa cấu hình lưu trữ.' })
    let doc: { id: string } | undefined
    let newImage = false
    if (sb) {
      const r = isDoc
        ? await rpc<{ id: string }>(sb, 'reserve_user_document', {
            p_owner: owner,
            p_name: typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 200) : `tai-lieu.${ext}`,
            p_mime: match[1],
            p_size: buf.length,
            p_url: url,
            p_subject: typeof body.subject === 'string' && body.subject ? body.subject.slice(0, 60) : null,
          })
        : await rpc<boolean>(sb, 'reserve_user_image', { p_owner: owner, p_key: key, p_size: buf.length })
      if (r.quota) return json(res, 413, { error: r.quota })
      if (r.failed || r.data == null) return json(res, 503, { error: 'Máy chủ bận, thử lại sau ít phút.' })
      if (isDoc) doc = r.data as { id: string }
      else newImage = r.data === true
    }
    const put = await r2Request('PUT', key, buf, match[1], isDoc ? { owner } : undefined).catch(() => null)
    if (!put?.ok) {
      // ghi tệp lỗi: trả lại phần hạn mức vừa giữ
      if (sb && doc) await fetch(`${sb.base}/rest/v1/user_documents?id=eq.${doc.id}`, { method: 'DELETE', headers: sb.headers }).catch(() => undefined)
      if (sb && newImage) {
        await fetch(`${sb.base}/rest/v1/user_images?owner_id=eq.${owner}&key=eq.${encodeURIComponent(key)}`, { method: 'DELETE', headers: sb.headers }).catch(() => undefined)
      }
      return json(res, 502, { error: `R2 trả lỗi ${put?.status ?? 'mạng'}` })
    }
    return json(res, 200, doc ? { url, doc } : { url })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

/**
 * DELETE /api/upload?id=<uuid>: xoá tài liệu của chính mình — dòng `user_documents` VÀ tệp trên R2
 * (trước đây client xoá thẳng dòng: được trả dung lượng mà tệp vẫn nằm đó, tải-xoá lặp vô hạn).
 * Tệp R2 chỉ xoá khi metadata owner đúng là người này và không còn dòng nào khác của họ trỏ tới.
 */
async function handleDeleteDocument(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const id = new URL(req.url ?? '/', 'http://x').searchParams.get('id') ?? ''
  if (!UUID.test(id)) return json(res, 400, { error: 'Thiếu mã tài liệu.' })
  const owner = await userFromToken(req)
  if (!owner) return json(res, 401, { error: 'Bạn cần đăng nhập để xoá tài liệu.', loginRequired: true })
  const sb = serviceDb()
  if (!sb) return json(res, 503, { error: 'Máy chủ chưa cấu hình lưu trữ.' })
  try {
    const q = await fetch(`${sb.base}/rest/v1/user_documents?id=eq.${id}&owner_id=eq.${owner}&select=id,url`, { headers: sb.headers })
    if (!q.ok) return json(res, 503, { error: 'Máy chủ bận, thử lại sau ít phút.' })
    const [row] = (await q.json()) as Array<{ id: string; url: string }>
    if (!row) return json(res, 404, { error: 'Không tìm thấy tài liệu.' })
    const key = r2DocKeyFromUrl(row.url)
    if (key) {
      const others = await fetch(
        `${sb.base}/rest/v1/user_documents?owner_id=eq.${owner}&url=eq.${encodeURIComponent(row.url)}&id=neq.${id}&select=id&limit=1`,
        { headers: sb.headers },
      )
      if (!others.ok) return json(res, 503, { error: 'Máy chủ bận, thử lại sau ít phút.' })
      if (!((await others.json()) as unknown[]).length) {
        const head = await r2Request('HEAD', key, null)
        if (head.ok && head.headers.get('x-amz-meta-owner') === owner && !(await deleteR2Object(key))) {
          return json(res, 502, { error: 'Không xoá được tệp, thử lại sau.' })
        }
      }
    }
    const del = await fetch(`${sb.base}/rest/v1/user_documents?id=eq.${id}&owner_id=eq.${owner}`, { method: 'DELETE', headers: sb.headers })
    if (!del.ok) return json(res, 503, { error: 'Máy chủ bận, thử lại sau ít phút.' })
    return json(res, 200, { ok: true })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

/**
 * Tài liệu riêng (`doc/`): chỉ chủ tệp đọc được. Chủ tệp CHỈ lấy từ metadata `owner` server ghi lúc tải lên
 * — không bao giờ từ `user_documents` (từng là cột người dùng tự ghi được). Tệp cũ thiếu metadata được
 * gắn chủ bằng `scripts/backfill-doc-owner.mjs`; tệp nào còn thiếu thì không ai đọc được.
 * (`img/` vẫn công khai: ảnh nằm trong đề đã chia sẻ / đề cộng đồng.)
 */
function ownsDocument(userId: string | null, metaOwner: string | null): boolean {
  return !!userId && !!metaOwner && metaOwner === userId
}

function serviceDb(): Sb | null {
  const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return base && service ? { base, headers: { apikey: service, Authorization: `Bearer ${service}` } } : null
}

const NOT_FOUND = { error: 'Không tìm thấy tệp' }

export async function handleFileRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })
  // đếm lượt theo IP (không dùng guard(): <img src> không gửi Origin); mức rộng vì một đề có nhiều ảnh
  if (!rateLimitOnly(req, res, 'files', 600)) return
  // Vite cắt tiền tố `/api/files` khỏi req.url, còn lại `/img/<hash>.<ext>`
  const key = decodeURIComponent((req.url ?? '').split('?')[0].replace(/^\/+/, ''))
  if (!KEY_PATTERN.test(key)) return json(res, 404, NOT_FOUND)
  const isDoc = key.startsWith('doc/')
  const userId = isDoc ? (isLocal(clientIp(req)) ? 'local' : await userFromToken(req)) : null
  // chưa đăng nhập thì khỏi hỏi R2
  if (isDoc && !userId) return json(res, 404, NOT_FOUND)

  try {
    const got = await r2Request('GET', key, null)
    // tệp không có và tệp không phải của mình trả cùng một câu: không lộ tệp có tồn tại hay không
    if (got.status === 404) return json(res, 404, NOT_FOUND)
    if (!got.ok) return json(res, 502, { error: 'Kho tệp đang lỗi, thử lại sau.' })
    if (isDoc && !(userId === 'local' || ownsDocument(userId, got.headers.get('x-amz-meta-owner')))) {
      return json(res, 404, NOT_FOUND)
    }
    res.writeHead(200, {
      'Content-Type': got.headers.get('content-type') ?? 'application/octet-stream',
      // không cho trình duyệt đoán lại kiểu (tệp người dùng gửi lên bị đoán thành HTML/JS chạy trong origin)
      'X-Content-Type-Options': 'nosniff',
      // tên file là hash nội dung nên không bao giờ đổi; tài liệu riêng thì không cho proxy/CDN giữ
      'Cache-Control': isDoc ? 'private, no-store' : 'public, max-age=31536000, immutable',
    })
    res.end(Buffer.from(await got.arrayBuffer()))
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function uploadMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'DELETE' && req.method !== 'OPTIONS') return next()
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
