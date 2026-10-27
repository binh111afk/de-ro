/**
 * Proxy tạo ảnh AI — API key chỉ nằm server-side.
 *
 * Xkiro dùng API ảnh bất đồng bộ (OpenAI-style):
 *   POST /images/generations        → job {id, status}
 *   GET  /images/generations/:id    → {status, data:[{url}]}
 * Model mặc định `sensenova/sensenova-u1.5-lite` (image generation, không phải
 * chat model).
 *
 * Cấu hình: `IMAGE_BASE_URL`, `IMAGE_API_KEY`, `IMAGE_MODEL` trong `.env`.
 * Không có env thì đọc provider Xkiro trong config ZCode của máy
 * (`~/.zcode/v2/provider_config.json`) — app chạy cục bộ, key không vào bundle.
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http'

const DEFAULT_BASE_URL = 'https://api.xkiro.com/v1'
const DEFAULT_MODEL = 'openai/gpt-image-2.5'
const POLL_MS = 1500
/** model ảnh thường 20–75 giây; để 3 phút cho lúc gateway chậm */
const DEADLINE_MS = 90_000
const MAX_PROMPT = 2000
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

interface ImageConfig {
  baseUrl: string
  apiKey: string
  model: string
}

/** Đọc key Xkiro từ config ZCode (chỉ đọc, không log). */
function xkiroFromZcode(): Partial<ImageConfig> {
  try {
    const file = path.join(homedir(), '.zcode', 'v2', 'provider_config.json')
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
      config?: {
        providerConfigRules?: {
          providerRules?: Array<{
            providerName?: string
            config?: { access?: { apiKey?: string }; api?: { baseUrl?: string } }
          }>
        }
      }
    }
    const rules = parsed.config?.providerConfigRules?.providerRules ?? []
    const xkiro = rules.find((rule) => /xkiro/i.test(rule.providerName ?? ''))
    const baseUrl = xkiro?.config?.api?.baseUrl
    const apiKey = xkiro?.config?.access?.apiKey
    if (typeof baseUrl === 'string' && typeof apiKey === 'string') return { baseUrl, apiKey }
  } catch {
    // máy không có config ZCode → dùng env
  }
  return {}
}

function resolveConfig(): ImageConfig {
  const fallback = xkiroFromZcode()
  return {
    baseUrl: (process.env.IMAGE_BASE_URL || fallback.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    apiKey: process.env.IMAGE_API_KEY || fallback.apiKey || '',
    model: process.env.IMAGE_MODEL || DEFAULT_MODEL,
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function upstreamJson(url: string, init: RequestInit): Promise<{
  ok: boolean
  status: number
  body: Record<string, unknown>
}> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000) })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { ok: res.ok, status: res.status, body }
}

function upstreamError(status: number, body: Record<string, unknown>): string {
  const error = body.error as { message?: string } | string | undefined
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return `Dịch vụ tạo ảnh trả lỗi ${status}`
}

/** Tải ảnh về dạng data URL để deck lưu được offline (URL CDN có thể hết hạn). */
async function imageToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Không tải được ảnh (${res.status})`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error('Ảnh trả về rỗng')
  if (buf.length > MAX_IMAGE_BYTES) throw new Error('Ảnh quá lớn (tối đa 8 MB)')
  const mime = res.headers.get('content-type')?.split(';')[0] || 'image/png'
  return `data:${mime};base64,${buf.toString('base64')}`
}

export async function handleImageRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = JSON.parse(await readBody(req)) as { prompt?: unknown }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT) : ''
    if (!prompt) return json(res, 400, { error: 'prompt là bắt buộc' })

    const config = resolveConfig()
    if (!config.apiKey) {
      return json(res, 503, {
        error: 'Chưa cấu hình IMAGE_API_KEY (hoặc chưa đăng nhập ZCode để dùng provider Xkiro).',
      })
    }
    const headers = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    }

    const start = await upstreamJson(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: config.model, prompt, n: 1, size: '1024x1024' }),
    })
    if (!start.ok) return json(res, 502, { error: upstreamError(start.status, start.body) })

    // Một số gateway trả ảnh ngay; Xkiro trả job id để poll.
    const direct = (start.body.data as Array<{ url?: string; b64_json?: string }> | undefined)?.[0]
    if (direct?.b64_json) return json(res, 200, { dataUrl: `data:image/png;base64,${direct.b64_json}` })
    if (direct?.url) return json(res, 200, { dataUrl: await imageToDataUrl(direct.url), model: config.model })

    const jobId = typeof start.body.id === 'string' ? start.body.id : ''
    if (!jobId) return json(res, 502, { error: 'Dịch vụ ảnh không trả về job id' })

    const deadline = Date.now() + DEADLINE_MS
    while (Date.now() < deadline) {
      await sleep(POLL_MS)
      const job = await upstreamJson(`${config.baseUrl}/images/generations/${encodeURIComponent(jobId)}`, {
        headers,
      })
      if (!job.ok) return json(res, 502, { error: upstreamError(job.status, job.body) })
      const status = String(job.body.status ?? '')
      if (status === 'failed' || status === 'error') {
        return json(res, 502, { error: upstreamError(job.status, job.body) })
      }
      if (status === 'succeeded' || status === 'completed') {
        const item = (job.body.data as Array<{ url?: string; b64_json?: string }> | undefined)?.[0]
        if (item?.b64_json) {
          return json(res, 200, { dataUrl: `data:image/png;base64,${item.b64_json}`, model: config.model })
        }
        if (item?.url) {
          return json(res, 200, { dataUrl: await imageToDataUrl(item.url), model: config.model })
        }
        return json(res, 502, { error: 'Job ảnh xong nhưng không có dữ liệu ảnh' })
      }
    }
    return json(res, 504, { error: 'Tạo ảnh quá lâu (quá 3 phút)' })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function imageMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleImageRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}
