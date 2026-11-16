/**
 * Kho hình đồ vật dùng chung (tranh đếm tiểu học): đồ vật ngoài kho có sẵn của app được vẽ MỘT lần
 * bằng AI rồi lưu R2 `fig/<tên>.png`; lần sau ai cần cùng đồ vật thì đọc lại, không tốn điểm.
 *
 * POST /api/figure-sprite {en: "teapot"} → {url, cached}
 *   - đã có trong kho: trả url, không trừ điểm
 *   - chưa có: trừ điểm như vẽ ảnh AI (/api/image), vẽ nét đen trắng, lưu kho rồi trả url
 * Đọc ảnh: GET /api/files/fig/<tên>.png (công khai, như ảnh trong đề). Tên = tên tiếng Anh viết thường,
 * nối bằng gạch ngang; prompt chỉ dựng từ tên đó nên ai gửi cũng ra cùng một kiểu hình.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http.js'
import { guard } from './guard.js'
import { chargeAndGenerate } from './imageProxy.js'
import { r2Exists, r2Put } from './r2.js'

const STYLE =
  "black and white line art, clean bold outlines, no shading, no color, no background, no text, centered, children's textbook illustration style, coloring book style, entire object fully visible with generous margin, uniform bold outline weight, white background"

/** "Red Apple" → "red-apple"; tên lạ (số, kí tự đặc biệt, quá dài) → null */
export function figureSlug(en: unknown): string | null {
  if (typeof en !== 'string') return null
  const words = en.trim().toLowerCase()
  if (!/^[a-z][a-z \-]{1,39}$/.test(words)) return null
  const slug = words.replace(/[\s-]+/g, '-').replace(/^-|-$/g, '')
  return slug.length >= 2 ? slug : null
}

export async function handleFigureSpriteRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'image'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  let slug: string | null = null
  try {
    const body = JSON.parse(await readBody(req, 4096)) as { en?: unknown }
    slug = figureSlug(body.en)
  } catch {
    // body hỏng: báo như tên sai
  }
  if (!slug) return json(res, 400, { error: 'Tên đồ vật (tiếng Anh) không hợp lệ.' })
  const key = `fig/${slug}.png`
  const url = `/api/files/${key}`
  try {
    if (await r2Exists(key)) return json(res, 200, { url, cached: true })
  } catch {
    return json(res, 502, { error: 'Kho hình đang lỗi, thử lại sau.' })
  }
  const got = await chargeAndGenerate(req, res, async () => `A single ${slug.replace(/-/g, ' ')}, ${STYLE}`)
  if (!got) return
  const m = /^data:image\/png;base64,(.+)$/.exec(got.dataUrl)
  if (!m) return json(res, 502, { error: 'Ảnh vẽ ra không phải PNG.' })
  const ok = await r2Put(key, Buffer.from(m[1], 'base64'), 'image/png').catch(() => false)
  if (!ok) return json(res, 502, { error: 'Không lưu được hình vào kho.' })
  return json(res, 200, { url, cached: false, quota: got.quota })
}

export function figureSpriteMiddleware(req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleFigureSpriteRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}
