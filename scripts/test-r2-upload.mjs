// Kiểm tra vòng đời ảnh qua R2: upload → đọc lại → so khớp từng byte.
// Chạy: npx tsx scripts/test-r2-upload.mjs (cần R2_* trong .env và quyền ghi vào bucket).
import assert from 'node:assert/strict'
import http from 'node:http'
import { loadDotEnv } from '../server/llmProxy.ts'
import { uploadMiddleware, fileMiddleware } from '../server/r2.ts'

loadDotEnv()

// PNG 1×1 đỏ, lấy đúng byte để so sánh sau khi đọc lại
const PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
const dataUrl = `data:image/png;base64,${PNG_B64}`

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/upload')) return uploadMiddleware(req, res, () => res.end())
  if (req.url.startsWith('/api/files')) {
    req.url = req.url.slice('/api/files'.length)
    return fileMiddleware(req, res, () => res.end())
  }
  res.statusCode = 404
  res.end()
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`

try {
  const up = await fetch(`${base}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  })
  const upBody = await up.json()
  assert.equal(up.status, 200, `upload lỗi: ${JSON.stringify(upBody)}`)
  assert.match(upBody.url, /^\/api\/files\/img\/[a-f0-9]{40}\.png$/)

  const got = await fetch(`${base}${upBody.url}`)
  assert.equal(got.status, 200)
  assert.equal(got.headers.get('content-type'), 'image/png')
  const back = Buffer.from(await got.arrayBuffer())
  assert.equal(back.toString('base64'), PNG_B64, 'ảnh đọc lại khác ảnh đã gửi')

  const bad = await fetch(`${base}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: 'data:text/html;base64,PGgxPg==' }),
  })
  assert.equal(bad.status, 400, 'phải từ chối file không phải ảnh')

  console.log('ok: upload → đọc lại khớp từng byte; từ chối file không phải ảnh')
  console.log('url:', upBody.url)
} finally {
  server.close()
}
