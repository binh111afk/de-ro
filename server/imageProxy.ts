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
import { LOGIN_REQUIRED, clientIp, guard, isLocal, userFromToken } from './guard.js'
import { TOKENS_PER_POINT, addUsage, quotaMessage, readQuota, reserveQuota } from './aiQuota.js'
import { assertPublicHttpsUrl } from './llmProxy.js'

/** điểm AI trừ cho mỗi ảnh vẽ thành công (ảnh tốn tiền nhà cung cấp như chữ) */
const IMAGE_TOKENS = () => Math.max(0, Number(process.env.AI_IMAGE_POINTS ?? 5) || 0) * TOKENS_PER_POINT

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
  // URL do nhà cung cấp trả về: chỉ https tới địa chỉ công khai, không theo chuyển hướng (khỏi bị dẫn vào mạng nội bộ)
  const safe = await assertPublicHttpsUrl(url)
  const res = await fetch(safe, { signal: AbortSignal.timeout(30_000), redirect: 'error' })
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

/**
 * Đăng nhập + trừ điểm + vẽ một ảnh (thử lần lượt từng nhà cung cấp). Lỗi thì đã tự trả response và
 * cho null; được thì cho dataUrl, người gọi tự trả response. Dùng chung cho /api/image và kho hình đồ vật.
 * `prompt` có thể là hàm (đọc body sau khi đã giữ chỗ điểm).
 */
export async function chargeAndGenerate(
  req: IncomingMessage,
  res: ServerResponse,
  getPrompt: () => Promise<string>,
): Promise<{ dataUrl: string; quota: unknown } | null> {
  // vẽ ảnh AI chỉ cho người đã đăng nhập (máy dev không cần)
  const ip = clientIp(req)
  const userId = await userFromToken(req)
  if (!isLocal(ip) && !userId) {
    json(res, 401, { error: LOGIN_REQUIRED, loginRequired: true })
    return null
  }
  // trừ điểm AI: giữ chỗ trước khi vẽ, vẽ được mới tính
  const cost = IMAGE_TOKENS()
  const quota = cost ? await readQuota(userId, ip) : null
  if (quota && quota.limit - quota.used < cost) {
    json(res, 429, { error: quota.limit - quota.used >= 1000 ? `Vẽ một ảnh cần ${cost / TOKENS_PER_POINT} điểm AI, bạn chỉ còn ${Math.floor((quota.limit - quota.used) / TOKENS_PER_POINT)} điểm.` : quotaMessage(quota), quota })
    return null
  }
  const release = quota ? await reserveQuota(userId, ip, quota, cost) : async () => {}
  if (!release) {
    json(res, 429, { error: 'Đang có nhiều yêu cầu AI cùng lúc so với số điểm còn lại, thử lại sau ít giây.', quota })
    return null
  }

  try {
    const prompt = (await getPrompt()).trim().slice(0, MAX_PROMPT)
    if (!prompt) {
      await release()
      json(res, 400, { error: 'prompt là bắt buộc' })
      return null
    }
    const configs = resolveConfigs()
    if (!configs.length) {
      await release()
      json(res, 503, { error: 'Chưa cấu hình AGNES_API_KEY hoặc IMAGE_API_KEY.' })
      return null
    }
    const errors: string[] = []
    let lastStatus = 502
    for (const config of configs) {
      try {
        const dataUrl = await generate(config, prompt)
        const [after] = await Promise.all([addUsage(userId, ip, cost, quota), release()])
        return { dataUrl, quota: after }
      } catch (err) {
        lastStatus = err instanceof ImageError ? err.status : 502
        errors.push(`${config.model}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    await release()
    const detail = errors.join(' | ')
    console.error('[imageProxy]', detail)
    json(res, lastStatus, { error: isLocal(ip) ? detail : 'Không tạo được ảnh, thử lại sau.' })
    return null
  } catch (err) {
    await release()
    console.error('[imageProxy]', err)
    json(res, 500, {
      error: isLocal(ip)
        ? (err instanceof Error ? err.message : String(err))
        : 'Không tạo được ảnh, thử lại sau.',
    })
    return null
  }
}

export async function handleImageRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!(await guard(req, res, 'image'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const got = await chargeAndGenerate(req, res, async () => {
    const body = JSON.parse(await readBody(req)) as { prompt?: unknown }
    return typeof body.prompt === 'string' ? body.prompt : ''
  })
  if (got) json(res, 200, got)
}

export function imageMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleImageRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    console.error('[imageProxy]', err)
    json(res, 500, {
      error: isLocal(clientIp(req))
        ? (err instanceof Error ? err.message : String(err))
        : 'Không tạo được ảnh, thử lại sau.',
    })
  })
}
