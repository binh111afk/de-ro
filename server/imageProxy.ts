/**
 * Proxy tạo ảnh AI — API key chỉ nằm server-side.
 *
 * Thứ tự thử (đều gọi chuẩn OpenAI `POST /images/generations` trả ảnh trực tiếp):
 *   1. SenseNova chính hãng (`SENSENOVA_API_KEY`, `SENSENOVA_BASE_URL`, `SENSENOVA_IMAGE_MODEL`)
 *   2. Agnes (`AGNES_API_KEY`, `AGNES_BASE_URL`, `AGNES_IMAGE_MODEL`; miễn phí có giới hạn)
 *   3. CogView-4 của Z.ai (`GLM_API_KEY`, `GLM_BASE_URL`, `GLM_IMAGE_MODEL`; trả tiền từng ảnh)
 * Provider thiếu key bị bỏ qua.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http.js'
import { LOGIN_REQUIRED, clientIp, guard, isLocal, userFromToken } from './guard.js'
import { TOKENS_PER_POINT, addUsage, quotaMessage, readQuota, reserveQuota } from './aiQuota.js'
import { assertPublicHttpsUrl } from './urlGuard.js'
import { logAiCall } from './ops.js'

/** điểm AI trừ cho mỗi ảnh vẽ thành công (ảnh tốn tiền nhà cung cấp như chữ) */
const IMAGE_TOKENS = () => Math.max(0, Number(process.env.AI_IMAGE_POINTS ?? 5) || 0) * TOKENS_PER_POINT

const MAX_PROMPT = 2000
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

interface ImageConfig {
  baseUrl: string
  apiKey: string
  model: string
}

/**
 * Thứ tự thử: SenseNova chính hãng → Agnes (miễn phí có giới hạn) → CogView-4 của Z.ai (trả tiền từng ảnh).
 * Provider thiếu key bị bỏ qua.
 */
function resolveConfigs(): ImageConfig[] {
  const configs: ImageConfig[] = []
  const sensenovaKey = process.env.SENSENOVA_API_KEY?.trim()
  if (sensenovaKey) {
    configs.push({
      baseUrl: (process.env.SENSENOVA_BASE_URL?.trim() || 'https://token.sensenova.ai/v1').replace(/\/+$/, ''),
      apiKey: sensenovaKey,
      model: process.env.SENSENOVA_IMAGE_MODEL?.trim() || 'sensenova-u1.6-lite',
    })
  }
  const agnesKey = process.env.AGNES_API_KEY?.trim()
  if (agnesKey) {
    configs.push({
      baseUrl: (process.env.AGNES_BASE_URL?.trim() || 'https://apihub.agnes-ai.com/v1').replace(/\/+$/, ''),
      apiKey: agnesKey,
      model: process.env.AGNES_IMAGE_MODEL?.trim() || 'agnes-image-2.5-flash',
    })
  }
  const glmKey = process.env.GLM_API_KEY?.trim()
  if (glmKey) {
    configs.push({
      baseUrl: (process.env.GLM_BASE_URL?.trim() || 'https://api.z.ai/api/paas/v4').replace(/\/+$/, ''),
      apiKey: glmKey,
      model: process.env.GLM_IMAGE_MODEL?.trim() || 'cogview-4-250304',
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
  // CDN của Z.ai đôi khi chưa có file ngay khi trả link (JSON "file not exist") → đợi rồi tải lại
  let failure = ''
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(2500)
    const res = await fetch(safe, { signal: AbortSignal.timeout(30_000), redirect: 'error' })
    const buf = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type')?.split(';')[0] || 'image/png'
    if (!res.ok) failure = `Không tải được ảnh (${res.status})`
    else if (buf.length === 0 || buf[0] === 0x7b /* '{': lỗi dạng JSON */ || mime.includes('json')) failure = 'Ảnh trả về rỗng'
    else {
      if (buf.length > MAX_IMAGE_BYTES) throw new Error('Ảnh quá lớn (tối đa 8 MB)')
      return `data:${mime};base64,${buf.toString('base64')}`
    }
  }
  throw new Error(failure)
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
  // ảnh chụp (chế độ Chuyên nghiệp) dặn rõ "no text": không dặn thêm chuyện chữ tiếng Việt kẻo model vẽ chữ vào ảnh
  const fullPrompt = /\bno text\b/i.test(prompt)
    ? prompt
    : `${prompt}\n\nMọi chữ xuất hiện trong ảnh phải viết bằng tiếng Việt có dấu chính xác; không dùng chữ Trung, Nhật, Hàn.`
  // SenseNova / Agnes / CogView-4 đều trả ảnh trực tiếp trong request này (~15–30 s).
  const start = await upstreamJson(
    `${config.baseUrl}/images/generations`,
    { method: 'POST', headers, body: JSON.stringify({ model: config.model, prompt: fullPrompt, n: 1, size: '1024x1024' }) },
    120_000,
  )
  if (!start.ok) throw new ImageError(502, upstreamError(start.status, start.body))

  const direct = await itemToDataUrl((start.body.data as ImageItem[] | undefined)?.[0])
  if (direct) return direct
  throw new ImageError(502, 'Dịch vụ ảnh không trả về dữ liệu ảnh')
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
  /** getPrompt có thể đặt `kind` (nhãn log) sau khi đọc body; `photo` bật nhà cung cấp riêng cho ảnh chụp */
  tag: { kind?: string; photo?: boolean } = {},
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
    json(res, 429, { error: quota.limit - quota.used >= 1000 ? `Vẽ một ảnh cần ${cost / TOKENS_PER_POINT} điểm AI, bạn chỉ còn ${Math.floor((quota.limit - quota.used) / TOKENS_PER_POINT)} điểm.` : quotaMessage(quota), quota, code: 'quota' })
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
      json(res, 503, { error: 'Chưa cấu hình SENSENOVA_API_KEY, AGNES_API_KEY hoặc GLM_API_KEY.' })
      return null
    }
    const errors: string[] = []
    let lastStatus = 502
    for (const config of configs) {
      const t0 = Date.now()
      try {
        const dataUrl = await generate(config, prompt)
        const [after] = await Promise.all([
          addUsage(userId, ip, cost, quota),
          release(),
          logAiCall({ userId, model: config.model, provider: 'image', ok: true, ms: Date.now() - t0, kind: tag.kind ?? 'image', billed: cost }),
        ])
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
  const tag: { kind?: string; photo?: boolean } = {}
  const got = await chargeAndGenerate(req, res, async () => {
    const body = JSON.parse(await readBody(req)) as { prompt?: unknown; pro?: unknown }
    if (body.pro === true) {
      tag.kind = 'image-pro'
      tag.photo = true
    }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT - 100) : ''
    // ảnh slide không được có chữ; câu tiếng Anh này cũng khiến generate() không nối lời dặn "chữ viết tiếng Việt"
    return !prompt || /\bno text\b/i.test(prompt) ? prompt : `${prompt}\n\nNo text, no letters, no words anywhere in the image.`
  }, tag)
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
