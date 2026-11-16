// Gắn chủ (metadata x-amz-meta-owner) cho tài liệu cũ trên R2 (doc/) — chạy MỘT lần, bằng tay, TRƯỚC khi
// deploy bản bỏ fallback của ownsDocument (Strix lần 3 mục 2). Sau khi deploy, tệp nào còn thiếu metadata
// thì không ai đọc được.
//
// Chạy thử (không ghi gì):  npx tsx scripts/backfill-doc-owner.mjs --dry-run
// Chạy thật:                npx tsx scripts/backfill-doc-owner.mjs
// Cần trong .env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
//
// Quy tắc: chỉ gắn chủ khi MỌI dòng user_documents trỏ tới tệp đều của cùng một owner_id. Không có dòng nào,
// hoặc có dòng của nhiều người (có thể là kẻ gian tự thêm dòng trỏ vào tệp người khác) → in ra để xử lý tay.
import { createHash, createHmac } from 'node:crypto'
import { loadDotEnv } from '../server/llmProxy.ts'

loadDotEnv()
const DRY = process.argv.includes('--dry-run')

const { R2_ACCOUNT_ID: acc, R2_ACCESS_KEY_ID: keyId, R2_SECRET_ACCESS_KEY: secret, R2_BUCKET: bucket } = process.env
const SB = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
if (!acc || !keyId || !secret || !bucket || !SB || !SVC) {
  console.error('Thiếu biến môi trường R2_* hoặc Supabase trong .env')
  process.exit(1)
}
const host = `${acc}.r2.cloudflarestorage.com`
const sha = (d) => createHash('sha256').update(d).digest('hex')
const hmac = (k, d) => createHmac('sha256', k).update(d).digest()
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)

/** request S3 ký SigV4; query là object, headers thêm (x-amz-*) cũng được ký */
async function s3(method, key, query = {}, extra = {}) {
  const amz = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  const date = amz.slice(0, 8)
  const uri = `/${bucket}${key ? `/${key.split('/').map(enc).join('/')}` : ''}`
  const qs = Object.keys(query).sort().map((k) => `${enc(k)}=${enc(query[k])}`).join('&')
  const payload = sha('')
  const h = { host, 'x-amz-content-sha256': payload, 'x-amz-date': amz, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k.toLowerCase(), v])) }
  const names = Object.keys(h).sort()
  const canonical = [method, uri, qs, names.map((n) => `${n}:${String(h[n]).trim()}\n`).join(''), names.join(';'), payload].join('\n')
  const scope = `${date}/auto/s3/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', amz, scope, sha(canonical)].join('\n')
  const sk = hmac(hmac(hmac(hmac(`AWS4${secret}`, date), 'auto'), 's3'), 'aws4_request')
  const sig = createHmac('sha256', sk).update(toSign).digest('hex')
  const { host: _h, ...send } = h
  return fetch(`https://${host}${uri}${qs ? `?${qs}` : ''}`, {
    method,
    headers: { ...send, Authorization: `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${sig}` },
  })
}

async function listDocKeys() {
  const keys = []
  let token
  do {
    const r = await s3('GET', '', { 'list-type': '2', prefix: 'doc/', ...(token ? { 'continuation-token': token } : {}) })
    if (!r.ok) throw new Error(`ListObjectsV2 lỗi ${r.status}: ${await r.text()}`)
    const xml = await r.text()
    for (const m of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.push(m[1])
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(xml)?.[1] : undefined
  } while (token)
  return keys
}

async function ownersOf(key) {
  const url = encodeURIComponent(`/api/files/${key}`)
  const r = await fetch(`${SB}/rest/v1/user_documents?select=owner_id,created_at&url=eq.${url}&order=created_at.asc`, {
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
  })
  if (!r.ok) throw new Error(`Supabase lỗi ${r.status}`)
  return r.json()
}

const keys = await listDocKeys()
console.log(`${keys.length} tệp doc/ trên R2${DRY ? ' (chạy thử, không ghi)' : ''}`)
let has = 0
let fixed = 0
const manual = []
for (const key of keys) {
  const head = await s3('HEAD', key)
  if (!head.ok) {
    manual.push(`${key} — HEAD lỗi ${head.status}`)
    continue
  }
  if (head.headers.get('x-amz-meta-owner')) {
    has++
    continue
  }
  const rows = await ownersOf(key)
  const owners = [...new Set(rows.map((r) => r.owner_id))]
  if (owners.length !== 1) {
    manual.push(`${key} — ${rows.length ? `nhiều chủ: ${owners.join(', ')}` : 'không có dòng user_documents nào'}`)
    continue
  }
  const owner = owners[0]
  if (DRY) {
    console.log(`sẽ gắn ${key} → ${owner}`)
    fixed++
    continue
  }
  const copy = await s3('PUT', key, {}, {
    'x-amz-copy-source': `/${bucket}/${key}`,
    'x-amz-metadata-directive': 'REPLACE',
    'x-amz-meta-owner': owner,
    'content-type': head.headers.get('content-type') ?? 'application/octet-stream',
  })
  if (!copy.ok) {
    manual.push(`${key} — CopyObject lỗi ${copy.status}: ${(await copy.text()).slice(0, 200)}`)
    continue
  }
  console.log(`đã gắn ${key} → ${owner}`)
  fixed++
}
console.log(`\nĐã có chủ: ${has} · ${DRY ? 'sẽ gắn' : 'đã gắn'}: ${fixed} · cần xử lý tay: ${manual.length}`)
for (const m of manual) console.log(`  - ${m}`)
