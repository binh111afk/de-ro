/**
 * Proxy tạo ảnh AI — API key chỉ nằm server-side.
 *
 * Xkiro dùng API ảnh bất đồng bộ (OpenAI-style):
 *   POST /images/generations        → job {id, status}
 *   GET  /images/generations/:id    → {status, data:[{url}]}
 * Model mặc định `sensenova/sensenova-u1.5-lite` (image generation, không phải
 * chat model).
 *
 * Ưu tiên Agnes (`AGNES_API_KEY`, `AGNES_BASE_URL`, `AGNES_IMAGE_MODEL`), lỗi thì
 * quay về Xkiro: `IMAGE_BASE_URL`, `IMAGE_API_KEY`, `IMAGE_MODEL` trong `.env`.
 * Không có env thì đọc provider Xkiro trong config ZCode của máy
 * (`~/.zcode/v2/provider_config.json`) — app chạy cục bộ, key không vào bundle.
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http.js'
import { guard } from './guard.js'

const DEFAULT_BASE_URL = 'https://api.xkiro.com/v1'
const DEFAULT_MODEL = 'sensenova/sensenova-u1.5-lite'
const POLL_MS = 1500
/** model ảnh thường 20–75 giây; để 4 phút cho lúc gateway chậm */
const DEADLINE_MS = 240_000
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

/**
 * Thứ tự thử: Agnes (`AGNES_API_KEY`, trả ảnh ngay, ~12–17 s, chữ tiếng Việt
 * đúng) → Xkiro/sensenova (job + poll). Provider thiếu key bị bỏ qua.
 */
function resolveConfigs(): ImageConfig[] {
  const configs: ImageConfig[] = []
  const agnesKey = process.env.AGNES_API_KEY?.trim()
  if (agnesKey) {
    configs.push({
      baseUrl: (process.env.AGNES_BASE_URL?.trim() || 'https://apihub.agnes-ai.com/v1').replace(/\/+$/, ''),
      apiKey: agnesKey,
      model: process.env.AGNES_IMAGE_MODEL?.trim() || 'agnes-image-2.5-flash',
    })
  }
  const fallback = xkiroFromZcode()
  const apiKey = process.env.IMAGE_API_KEY || fallback.apiKey || ''
  if (apiKey) {
    configs.push({
      baseUrl: (process.env.IMAGE_BASE_URL || fallback.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
      apiKey,
      model: process.env.IMAGE_MODEL || DEFAULT_MODEL,
    })
  }
  return configs
}

class ImageError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function upstreamJson(url: string, init: RequestInit, timeoutMs = 15_000): Promise<{
  ok: boolean
  status: number
  body: Record<string, unknown>
}> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
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

type ImageItem = { url?: string; b64_json?: string }

async function itemToDataUrl(item: ImageItem | undefined): Promise<string | null> {
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`
  if (item?.url) return imageToDataUrl(item.url)
  return null
}

/** Tạo một ảnh với một provider; ném ImageError nếu thất bại. */
async function generate(config: ImageConfig, prompt: string): Promise<string> {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  }
  // Agnes đôi khi tự viết chữ tiếng Trung (đã gặp khi thử ảnh thí nghiệm) → luôn dặn chữ tiếng Việt.
  const fullPrompt = `${prompt}\n\nMọi chữ xuất hiện trong ảnh phải viết bằng tiếng Việt có dấu chính xác; không dùng chữ Trung, Nhật, Hàn.`
  // Agnes trả ảnh ngay trong request này (~12–17 s) → chờ lâu hơn mặc định 15 s.
  const start = await upstreamJson(
    `${config.baseUrl}/images/generations`,
    { method: 'POST', headers, body: JSON.stringify({ model: config.model, prompt: fullPrompt, n: 1, size: '1024x1024' }) },
    120_000,
  )
  if (!start.ok) throw new ImageError(502, upstreamError(start.status, start.body))

  // Agnes trả ảnh ngay; Xkiro trả job id để poll.
  const direct = await itemToDataUrl((start.body.data as ImageItem[] | undefined)?.[0])
  if (direct) return direct

  const jobId = typeof start.body.id === 'string' ? start.body.id : ''
  if (!jobId) throw new ImageError(502, 'Dịch vụ ảnh không trả về job id')

  const deadline = Date.now() + DEADLINE_MS
  while (Date.now() < deadline) {
    await sleep(POLL_MS)
    const job = await upstreamJson(`${config.baseUrl}/images/generations/${encodeURIComponent(jobId)}`, { headers })
    if (!job.ok) throw new ImageError(502, upstreamError(job.status, job.body))
    const status = String(job.body.status ?? '')
    if (status === 'failed' || status === 'error') throw new ImageError(502, upstreamError(job.status, job.body))
    if (status === 'succeeded' || status === 'completed') {
      const url = await itemToDataUrl((job.body.data as ImageItem[] | undefined)?.[0])
      if (url) return url
      throw new ImageError(502, 'Job ảnh xong nhưng không có dữ liệu ảnh')
    }
  }
  throw new ImageError(504, 'Tạo ảnh quá lâu (quá 4 phút)')
}

export async function handleImageRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!(await guard(req, res, 'image'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = JSON.parse(await readBody(req)) as { prompt?: unknown }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT) : ''
    if (!prompt) return json(res, 400, { error: 'prompt là bắt buộc' })

    const configs = resolveConfigs()
    if (!configs.length) {
      return json(res, 503, { error: 'Chưa cấu hình AGNES_API_KEY hoặc IMAGE_API_KEY.' })
    }
    const errors: string[] = []
    let lastStatus = 502
    for (const config of configs) {
      try {
        return json(res, 200, { dataUrl: await generate(config, prompt), model: config.model })
      } catch (err) {
        lastStatus = err instanceof ImageError ? err.status : 502
        errors.push(`${config.model}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    return json(res, lastStatus, { error: errors.join(' | ') })
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
