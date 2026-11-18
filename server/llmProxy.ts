/**
 * Proxy LLM phía server — giữ API key ngoài bundle trình duyệt.
 *
 * Cấu hình qua file `.env` ở gốc dự án (xem `.env.example`):
 *   LLM_BASE_URL  mặc định https://opencode.ai/inference/go/openai/v1
 *   LLM_API_KEY   bắt buộc — người dùng tự điền
 *   LLM_MODEL     mặc định deepseek-v4.1-flash
 *
 * Dev: Vite mount `llmMiddleware` ở `/api/llm` (xem `vite.config.ts`).
 * Prod: `node server/llmProxy.ts` phục vụ API + static `dist/`.
 */
import os from 'node:os'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { json, readBody } from './http.js'
import { LOGIN_REQUIRED, clientIp, guard, isLocal, userFromToken } from './guard.js'
import { TOKENS_PER_POINT, addUsage, checkReceipt, estimatePromptTokens, hasQuotaStore, issueReceipt, quotaMessage, readQuota, refundReceipt, requestHash, reserveQuota } from './aiQuota.js'
import { costFromUsage, logAiCall, maintenanceBlock } from './ops.js'
import { readAiOverrides } from './aiSettings.js'
import { callAnthropic } from './anthropic.js'
import { handleExtractRequest } from './extract.js'
import { handleSearchRequest } from './searchProxy.js'
import { handleImageRequest } from './imageProxy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const DEFAULT_BASE_URL = 'https://opencode.ai/inference/go/openai/v1'
const DEFAULT_MODEL = 'deepseek-v4.1-flash'
// soạn cả đề (22 câu + đáp án) mất 160–240 s; dưới mức này model chính luôn bị cắt rồi rơi sang model dự phòng (kém hơn).
// Function Vercel tối đa 300 s (vercel.json) nên còn ~50 s cho model dự phòng.
const DEFAULT_UPSTREAM_TIMEOUT_MS = 250_000
/** trần token đầu ra mỗi lượt AI (client gửi lớn hơn thì cắt về đây); app đang dùng tối đa 32.000 */
const MAX_OUTPUT_TOKENS = 32_000
/** body /api/llm tối đa (byte) và phần gửi lên tối đa (token ước) — chặn trước khi tốn tiền gọi model */
const MAX_LLM_BODY = 2 * 1024 * 1024
const MAX_PROMPT_TOKENS = 200_000

/**
 * Thời gian chờ mỗi lượt gọi model. Model reasoning (deepseek) có thể suy luận
 * 5–10k token cho một dàn ý slide, 45s cũ không đủ → đọc `LLM_TIMEOUT_MS` trong
 * `.env` để chỉnh, mặc định 120s.
 */
function upstreamTimeoutMs(): number {
  const raw = Number(process.env.LLM_TIMEOUT_MS)
  return Number.isFinite(raw) && raw >= 10_000 ? raw : DEFAULT_UPSTREAM_TIMEOUT_MS
}

/** hệ số nhân điểm khi dùng model mạnh (`STRONG_POINT_FACTOR`, mặc định 3, trong khoảng 1–10) */
function strongFactor(): number {
  const raw = Number(process.env.STRONG_POINT_FACTOR)
  return Number.isFinite(raw) && raw >= 1 && raw <= 10 ? raw : 3
}

/**
 * Gateway opencode.ai đòi header `x-opencode-session` để định tuyến/cache; thiếu
 * thì trả 400 MissingSessionID. Một id cho cả process là đủ (app chạy cục bộ).
 */
const SESSION_ID = randomUUID()

/**
 * Nạp `.env` (KEY=VALUE, bỏ qua dòng trống/comment) vào `process.env`.
 * Giá trị không rỗng trong file thắng biến môi trường sẵn có — file là nguồn
 * cấu hình người dùng sửa. Dùng chung cho Vite dev và server production.
 */
export function loadDotEnv(file = path.join(ROOT, '.env')): void {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    const value = m?.[2].replace(/^["']|["']$/g, '')
    if (m && value) process.env[m[1]] = value
  }
}

/** Dải IPv4 không được phép gọi tới (riêng / loopback / link-local / reserved). */
const BLOCKED_V4: Array<[RegExp, string]> = [
  [/^0\./, 'dải 0/8'],
  [/^10\./, 'dải riêng 10/8'],
  [/^127\./, 'loopback'],
  [/^169\.254\./, 'link-local'],
  [/^172\.(1[6-9]|2\d|3[01])\./, 'dải riêng 172.16/12'],
  [/^192\.168\./, 'dải riêng 192.168/16'],
  [/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, 'CGNAT 100.64/10'],
  [/^198\.1[89]\./, 'benchmark 198.18/15'],
  [/^192\.0\.[02]\./, 'dải đặc biệt 192.0.0/24, 192.0.2/24'],
  [/^198\.51\.100\./, 'dải tài liệu'],
  [/^203\.0\.113\./, 'dải tài liệu'],
  [/^(22[4-9]|2[3-5]\d)\./, 'multicast/reserved'],
]

/**
 * Chỉ cho phép http/https và chặn host nội bộ. URL lấy từ env do người vận hành
 * đặt, nhưng vẫn kiểm tra để một lần cấu hình nhầm không biến server thành cầu
 * nối vào mạng nội bộ.
 */
function assertAllowedUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`LLM_BASE_URL không hợp lệ: ${raw}`)
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('LLM_BASE_URL chỉ chấp nhận http/https')
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new Error('LLM_BASE_URL không được trỏ tới localhost')
  }
  if (isIP(host) === 4) {
    const blocked = BLOCKED_V4.find(([re]) => re.test(host))
    if (blocked) throw new Error(`LLM_BASE_URL trỏ tới địa chỉ nội bộ (${blocked[1]})`)
  }
  if (isIP(host) === 6) {
    // URL đã chuẩn hoá về dạng rút gọn chữ thường. ::ffff:, 64:ff9b::, 2002:, 2001:0: là các dạng bọc IPv4 bên trong
    if (host === '::1' || host === '::' || /^(::ffff:|64:ff9b:|2002:|2001:0:|2001:db8:|f[cdf]|fe[89ab])/.test(host)) {
      throw new Error('LLM_BASE_URL trỏ tới địa chỉ IPv6 nội bộ')
    }
  }
  return url
}

/** URL bên ngoài server sắp tải (vd. ảnh nhà cung cấp trả về): chỉ https, không kèm tài khoản, mọi địa chỉ DNS đều công khai. */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = assertAllowedUrl(raw)
  if (url.protocol !== 'https:') throw new Error('Địa chỉ phải dùng https.')
  if (url.username || url.password) throw new Error('Địa chỉ không được chứa tài khoản.')
  let addrs: Array<{ address: string; family: number }>
  try {
    addrs = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true })
  } catch {
    throw new Error('Không tìm thấy máy chủ.')
  }
  for (const a of addrs) assertAllowedUrl(a.family === 6 ? `https://[${a.address}]/` : `https://${a.address}/`)
  return url
}

/** Endpoint admin nhập trên giao diện: chỉ https, không kèm tài khoản/query, tên miền không trỏ vào mạng nội bộ. */
export async function assertSafeEndpoint(raw: string): Promise<void> {
  const url = assertAllowedUrl(raw)
  if (url.protocol !== 'https:') throw new Error('Endpoint phải dùng https.')
  if (url.username || url.password || url.search || url.hash) throw new Error('Endpoint không được chứa tài khoản hoặc tham số.')
  let addrs: Array<{ address: string; family: number }>
  try {
    addrs = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true })
  } catch {
    throw new Error('Không tìm thấy máy chủ của endpoint.')
  }
  for (const a of addrs) assertAllowedUrl(a.family === 6 ? `https://[${a.address}]/` : `https://${a.address}/`)
}

function providerConfig() {
  const baseURL = process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL
  return {
    apiKey: process.env.LLM_API_KEY?.trim() ?? '',
    model: process.env.LLM_MODEL?.trim() || DEFAULT_MODEL,
    // bản -free của opencode đã ngừng → không còn fallback opencode mặc định
    fallbackModel: process.env.LLM_FALLBACK_MODEL?.trim() || '',
    // NightRouter (chuẩn OpenAI) — dự phòng 3, mặc định deepseek-v4-flash-0731 (10đ/lượt, bản trả phí không giới hạn lượt)
    nightrouterApiKey: process.env.NIGHTROUTER_API_KEY?.trim() || '',
    nightrouterBaseURL: assertAllowedUrl((process.env.NIGHTROUTER_BASE_URL?.trim() || 'https://api.nightrouter.ai/v1').replace(/\/+$/, '')).toString().replace(/\/+$/, ''),
    nightrouterModel: process.env.NIGHTROUTER_MODEL?.trim() || 'deepseek-v4-flash-0731',
    // Claude (Anthropic API chính thức) — dự phòng cuối, gọi qua SDK (server/anthropic.ts)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY?.trim() || '',
    anthropicModel: process.env.ANTHROPIC_MODEL?.trim() || 'claude-opus-5-5',
    anthropicBaseURL: (process.env.ANTHROPIC_BASE_URL?.trim() || 'https://api.anthropic.com').replace(/\/+$/, ''),
    // DeepSeek chính hãng (chuẩn OpenAI) — dự phòng 1, thay Mercury (Inception đã đóng cổng API). Có cache prompt: phần trùng chỉ ~1/10 giá
    deepseekApiKey: process.env.DEEPSEEK_API_KEY?.trim() || '',
    deepseekBaseURL: assertAllowedUrl((process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, '')).toString().replace(/\/+$/, ''),
    deepseekModel: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
    // model mạnh cho lượt "Thử lại" sau khi kết quả không áp được (body.strong); trống = không có, chạy chuỗi thường
    deepseekStrongModel: process.env.DEEPSEEK_STRONG_MODEL?.trim() || '',
    fostaApiKey: process.env.FOSTA_API_KEY?.trim() || '',
    fostaBaseURL: assertAllowedUrl((process.env.FOSTA_BASE_URL?.trim() || 'https://codex.fosta.app/v1').replace(/\/+$/, '')).toString().replace(/\/+$/, ''),
    fostaModel: process.env.FOSTA_MODEL?.trim() || 'gpt-6-luna',
    // AnyRouter (chuẩn OpenAI): gọi kiểu stream, vì gọi thường thì upstream cắt sau 60s (502) khi sinh đề dài
    anyrouterApiKey: process.env.ANYROUTER_API_KEY?.trim() || '',
    anyrouterBaseURL: assertAllowedUrl((process.env.ANYROUTER_BASE_URL?.trim() || 'https://anyrouter.dev/v1').replace(/\/+$/, '')).toString().replace(/\/+$/, ''),
    anyrouterModel: process.env.ANYROUTER_MODEL?.trim() || 'openai/gpt-6.1-terra',
    endpoint: assertAllowedUrl(`${baseURL.replace(/\/+$/, '')}/chat/completions`),
  }
}

export type ProviderPing = { provider: string; model: string; ok: boolean; ms: number; error?: string }

/** Cấu hình đang chạy: như providerConfig, thêm phần admin đã lưu (model, endpoint, API key). */
async function liveConfig() {
  const p = providerConfig()
  const o = await readAiOverrides()
  return {
    ...p,
    apiKey: o.opencode?.apiKey || p.apiKey,
    model: o.opencode?.model || p.model,
    endpoint: o.opencode?.baseUrl ? new URL(`${o.opencode.baseUrl}/chat/completions`) : p.endpoint,
    deepseekApiKey: o.deepseek?.apiKey || p.deepseekApiKey,
    deepseekBaseURL: o.deepseek?.baseUrl || p.deepseekBaseURL,
    deepseekModel: o.deepseek?.model || p.deepseekModel,
    fostaApiKey: o.fosta?.apiKey || p.fostaApiKey,
    fostaBaseURL: o.fosta?.baseUrl || p.fostaBaseURL,
    fostaModel: o.fosta?.model || p.fostaModel,
    anyrouterApiKey: o.anyrouter?.apiKey || p.anyrouterApiKey,
    anyrouterBaseURL: o.anyrouter?.baseUrl || p.anyrouterBaseURL,
    anyrouterModel: o.anyrouter?.model || p.anyrouterModel,
    nightrouterApiKey: o.nightrouter?.apiKey || p.nightrouterApiKey,
    nightrouterBaseURL: o.nightrouter?.baseUrl || p.nightrouterBaseURL,
    nightrouterModel: o.nightrouter?.model || p.nightrouterModel,
    anthropicApiKey: o.anthropic?.apiKey || p.anthropicApiKey,
    anthropicBaseURL: o.anthropic?.baseUrl || p.anthropicBaseURL,
    anthropicModel: o.anthropic?.model || p.anthropicModel,
  }
}

function pingTargets(p: ReturnType<typeof providerConfig>) {
  const list: Array<{ provider: string; model: string; key: string; url: string; opencode?: boolean; anthropic?: boolean }> = []
  if (p.apiKey) list.push({ provider: 'opencode', model: p.model, key: p.apiKey, url: p.endpoint.toString(), opencode: true })
  if (p.deepseekApiKey) list.push({ provider: 'deepseek', model: p.deepseekModel, key: p.deepseekApiKey, url: `${p.deepseekBaseURL}/chat/completions` })
  if (p.fostaApiKey) list.push({ provider: 'fosta', model: p.fostaModel, key: p.fostaApiKey, url: `${p.fostaBaseURL}/chat/completions` })
  if (p.anyrouterApiKey) list.push({ provider: 'anyrouter', model: p.anyrouterModel, key: p.anyrouterApiKey, url: `${p.anyrouterBaseURL}/chat/completions` })
  if (p.nightrouterApiKey) list.push({ provider: 'nightrouter', model: p.nightrouterModel, key: p.nightrouterApiKey, url: `${p.nightrouterBaseURL}/chat/completions` })
  if (p.anthropicApiKey) list.push({ provider: 'anthropic', model: p.anthropicModel, key: p.anthropicApiKey, url: p.anthropicBaseURL, anthropic: true })
  return list
}

/** Provider đọc được ảnh đề, theo thứ tự thử (Claude đắt nhất nên để cuối). */
export async function visionTargets() {
  const all = pingTargets(await liveConfig())
  return ['fosta', 'anthropic'].flatMap((name) => all.filter((t) => t.provider === name))
}

const maskKey = (k: string) => (k ? `••••${k.length >= 8 ? k.slice(-4) : ''}` : '')
const endpointOf = (url: string) => url.replace(/\/chat\/completions$/, '')

/** Cấu hình từng provider cho trang admin, không gọi thử nên không tốn token. API key chỉ trả phần che. */
export async function listProviders() {
  const defaults = new Map(pingTargets(providerConfig()).map((t) => [t.provider, t]))
  return pingTargets(await liveConfig()).map((t) => {
    const d = defaults.get(t.provider)
    const defaultModel = d?.model ?? t.model
    const defaultEndpoint = endpointOf(d?.url ?? t.url)
    const endpoint = endpointOf(t.url)
    return { provider: t.provider, model: t.model, defaultModel, endpoint, defaultEndpoint, keyMask: maskKey(t.key), custom: t.model !== defaultModel || endpoint !== defaultEndpoint || t.key !== d?.key }
  })
}

/** Admin bấm "Kiểm tra": gọi provider đã cấu hình (tất cả, hoặc riêng `only`) một prompt rất ngắn (tốn ít token), đo độ trễ. */
export async function pingProviders(only?: string): Promise<ProviderPing[]> {
  const msg = [{ role: 'user', content: 'Trả lời đúng một chữ: OK' }]
  const list = pingTargets(await liveConfig()).filter((t) => !only || t.provider === only)
  return Promise.all(
    list.map(async (t): Promise<ProviderPing> => {
      const t0 = Date.now()
      const base = { provider: t.provider, model: t.model }
      try {
        if (t.anthropic) {
          await callAnthropic({ apiKey: t.key, baseURL: t.url, model: t.model, messages: msg, maxTokens: 64, effort: 'low', signal: AbortSignal.timeout(30_000) })
          return { ...base, ok: true, ms: Date.now() - t0 }
        }
        const r = await fetch(t.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${t.key}`,
            ...(t.opencode ? { 'x-opencode-session': SESSION_ID, 'User-Agent': 'de-ro/1.0' } : {}),
          },
          body: JSON.stringify({ model: t.model, messages: msg, max_tokens: 64, ...(t.opencode ? { reasoning_effort: 'low' } : {}) }),
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
        })
        await r.text()
        return r.ok ? { ...base, ok: true, ms: Date.now() - t0 } : { ...base, ok: false, ms: Date.now() - t0, error: `HTTP ${r.status}` }
      } catch (err) {
        return { ...base, ok: false, ms: Date.now() - t0, error: err instanceof Error ? err.message.slice(0, 200) : String(err) }
      }
    }),
  )
}

/** Ghi log raw response của upstream để chẩn đoán khi model trả rỗng. */
function writeRawLog(raw: string, parsed?: Record<string, unknown>) {
  if (process.env.VERCEL) return // không ghi log trên bản thật
  try {
    // để ngoài thư mục dự án: dev server không phục vụ được file này
    const logDir = path.join(os.tmpdir(), 'dethinhbien-llmlog')
    if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })
    const stamp = Date.now()
    writeFileSync(
      path.join(logDir, `${stamp}.json`),
      JSON.stringify({ ...(parsed ?? {}), _raw: raw.slice(0, 20000), _rawLen: raw.length }, null, 2),
    )
  } catch {
    /* bỏ qua lỗi log */
  }
}

/** Gom các dòng SSE `data: {...}` của chat/completions stream thành một body JSON như khi gọi thường. */
function sseToJson(raw: string): string {
  let content = ''
  let reasoning = ''
  let finish: string | undefined
  let usage: unknown
  let model: string | undefined
  for (const line of raw.split('\n')) {
    const l = line.trim()
    if (!l.startsWith('data:') || l === 'data: [DONE]') continue
    try {
      const j = JSON.parse(l.slice(5)) as { model?: string; usage?: unknown; choices?: Array<{ finish_reason?: string; delta?: { content?: string; reasoning_content?: string } }> }
      const c = j.choices?.[0]
      content += c?.delta?.content ?? ''
      reasoning += c?.delta?.reasoning_content ?? ''
      finish = c?.finish_reason ?? finish
      usage = j.usage ?? usage
      model = j.model ?? model
    } catch {
      /* bỏ dòng hỏng */
    }
  }
  return JSON.stringify({ model, usage, choices: [{ finish_reason: finish, message: { content, reasoning_content: reasoning } }] })
}

interface StreamedBody {
  content: string
  reasoning: string
  usage: unknown
  finish?: string
  model?: string
  /** luồng đứt giữa chừng (mạng / quá giờ) — phần đã nhận vẫn bị nhà cung cấp tính tiền */
  broken: boolean
}

/**
 * Đọc dần SSE chat/completions của upstream, gọi `onDelta` mỗi mẩu. Không ném lỗi: đứt giữa chừng thì
 * trả `broken: true` cùng phần đã nhận (để vẫn tính tiền phần đó).
 */
async function readUpstreamSse(
  upstream: Response,
  onDelta: (d: { content: string; reasoning: string }) => void,
): Promise<StreamedBody> {
  const out: StreamedBody = { content: '', reasoning: '', usage: undefined, broken: false }
  const reader = upstream.body?.getReader()
  if (!reader) return { ...out, broken: true }
  const dec = new TextDecoder()
  let buf = ''
  const eat = (line: string) => {
    const l = line.trim()
    if (!l.startsWith('data:') || l === 'data: [DONE]') return
    try {
      const j = JSON.parse(l.slice(5)) as { model?: string; usage?: unknown; choices?: Array<{ finish_reason?: string; delta?: { content?: string; reasoning_content?: string } }> }
      const c = j.choices?.[0]
      const content = c?.delta?.content ?? ''
      const reasoning = c?.delta?.reasoning_content ?? ''
      out.content += content
      out.reasoning += reasoning
      out.finish = c?.finish_reason ?? out.finish
      out.usage = j.usage ?? out.usage
      out.model = j.model ?? out.model
      if (content || reasoning) onDelta({ content, reasoning })
    } catch {
      /* bỏ dòng hỏng */
    }
  }
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        eat(buf.slice(0, nl))
        buf = buf.slice(nl + 1)
      }
    }
    if (buf) eat(buf)
  } catch {
    out.broken = true
  }
  return out
}

/** Xử lý một lời gọi /api/llm. Luôn tự ghi response. */
export async function handleLlmRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'llm'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})

  // hạn mức token theo tài khoản (tháng) / khách (ngày theo IP); máy dev không giới hạn
  const ip = clientIp(req)
  const userId = isLocal(ip) ? null : await userFromToken(req)
  let quota = isLocal(ip) ? null : await readQuota(userId, ip)
  // GET: chỉ đọc hạn mức (trang Hồ sơ), không gọi AI. null = máy dev, không giới hạn
  if (req.method === 'GET') return json(res, 200, { quota, unlimited: !!userId && quota === null && hasQuotaStore() })
  if (await maintenanceBlock(req, res)) return
  // AI chỉ cho người đã đăng nhập (máy dev không cần)
  if (!userId && !isLocal(ip)) return json(res, 401, { error: LOGIN_REQUIRED, loginRequired: true })
  // đọc body TRƯỚC khi hoàn điểm / giữ chỗ: biên nhận hoàn điểm gắn với đúng nội dung yêu cầu
  let body: {
    messages?: Array<{ role: string; content: string }>
    maxTokens?: number
    reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
    temperature?: number
    model?: string
    /** tìm trên web trước khi trả lời: chỉ DeepSeek chính hãng (tool deepseek_web_search, tắt suy luận) */
    webSearch?: boolean
    /** trả về dạng SSE (tiến độ thật): sự kiện `delta` / `retry`, cuối cùng `done` hoặc `error` */
    stream?: boolean
    /** lượt trước không dùng được: thử model mạnh (DEEPSEEK_STRONG_MODEL) trước, điểm nhân STRONG_POINT_FACTOR */
    strong?: boolean
  }
  try {
    // 2 MB chữ ≈ 700k token — đủ cho đề + nguồn tham khảo dài nhất app gửi; to hơn là lạm dụng
    body = JSON.parse(await readBody(req, MAX_LLM_BODY))
  } catch {
    return json(res, 400, { error: 'Yêu cầu không hợp lệ hoặc quá lớn.' })
  }
  if (!Array.isArray(body.messages) || !body.messages.length) return json(res, 400, { error: 'messages is required' })
  // model rỗng / không phải chuỗi = không chọn (đừng để chuỗi rỗng khớp model chưa cấu hình rồi bỏ qua model chính)
  // chỉ máy dev (script đo / so model) được chọn model: điểm tính theo một giá, người dùng chọn model đắt là trả giá rẻ (Strix 7)
  if (typeof body.model !== 'string' || !body.model.trim() || !isLocal(ip)) body.model = undefined
  // chỉ chuyển {role, content} lên model: trường lạ (name, …) cũng bị tính tiền mà trước đây không được đếm
  body.messages = body.messages.map((m) => ({ role: String(m?.role ?? 'user'), content: m?.content })) as typeof body.messages
  const promptTokens = estimatePromptTokens(body.messages)
  if (promptTokens > MAX_PROMPT_TOKENS) return json(res, 413, { error: 'Nội dung gửi cho AI quá dài, hãy rút gọn tài liệu nguồn.' })
  // trần token đầu ra mỗi lượt: không tin số client gửi (trước đây gửi 250.000 là gọi được, vượt xa hạn mức)
  const requested = Math.floor(Number(body.maxTokens ?? MAX_OUTPUT_TOKENS)) || MAX_OUTPUT_TOKENS
  let maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(256, requested))
  const reqHash = requestHash(body.messages, maxTokens, { model: body.webSearch ? `web:${body.model ?? ''}` : body.model, effort: body.reasoningEffort, temperature: body.temperature })

  // gọi lại vì lượt trước trả kết quả hỏng: biên nhận chỉ hợp lệ khi gửi lại ĐÚNG yêu cầu cũ (mã băm mọi
  // thứ quyết định giá). Lúc kiểm hạn mức tính trước phần sẽ hoàn, nhưng chỉ thật sự hoàn khi lượt gọi
  // lại thành công — không thì gọi lại cho hỏng cũng được hoàn, giữ kết quả đắt mà không mất điểm.
  const retryOf = req.headers['x-ai-retry-of']
  const receipt = typeof retryOf === 'string' && retryOf && quota ? checkReceipt(retryOf, userId, reqHash) : null
  const pendingRefund = receipt?.t ?? 0
  // biên nhận để client xin hoàn nếu kết quả không dùng được; lượt gọi lại không được hoàn tiếp
  const receiptFor = (spent: number) => (quota && !retryOf ? issueReceipt(userId, ip, spent, reqHash) : undefined)
  // hạn mức tính trên TỔNG token (đầu vào + đầu ra): phần gửi lên cũng bị tính tiền
  const remaining = quota ? quota.limit - quota.used + pendingRefund : Infinity
  if (quota && remaining - promptTokens < 256) {
    // còn điểm mà không đủ cho yêu cầu dài: nói rõ cần bao nhiêu, đừng báo "đã hết điểm"
    const pts = (n: number) => Math.max(0, Math.ceil(n / TOKENS_PER_POINT)).toLocaleString('vi-VN')
    const error = remaining >= 1000
      ? `Yêu cầu này cần khoảng ${pts(promptTokens + 256)} điểm AI nhưng bạn chỉ còn ${pts(remaining)} điểm. Hãy rút gọn tài liệu nguồn hoặc bớt nội dung gửi kèm.`
      : quotaMessage(quota)
    return json(res, 429, { error, quota })
  }
  // phần còn lại sau đầu vào mới là trần đầu ra (bỏ sàn 1.000 từng cho vượt số dư)
  if (quota) maxTokens = Math.min(maxTokens, Math.floor(remaining - promptTokens))
  // giữ chỗ đúng mức tối đa lượt này có thể tốn, để các lượt song song không cùng lọt quá hạn mức
  const reserveFor = quota && pendingRefund ? { ...quota, limit: quota.limit + pendingRefund } : quota
  const release = reserveFor ? await reserveQuota(userId, ip, reserveFor, promptTokens + maxTokens) : async () => {}
  if (!release) return json(res, 429, { error: 'Đang có nhiều yêu cầu AI chạy cùng lúc, vui lòng thử lại sau ít giây.', quota })

  // ---- chế độ stream (SSE): chỉ mở luồng khi upstream đầu tiên đã trả 200, lỗi trước đó vẫn trả JSON như cũ.
  // Client đóng tab giữa chừng thì server VẪN đọc hết upstream và tự trừ điểm (client không quyết được việc bị tính).
  const wantStream = body.stream === true && !body.webSearch
  let streaming = false
  let ping: ReturnType<typeof setInterval> | undefined
  const send = (ev: Record<string, unknown>) => {
    if (!streaming || res.writableEnded || res.destroyed) return
    try {
      res.write(`data: ${JSON.stringify(ev)}\n\n`)
    } catch {
      /* client đã đóng */
    }
  }
  const startStream = () => {
    if (streaming) return
    streaming = true
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.flushHeaders?.()
    // model suy luận lâu chưa ra chữ: giữ kết nối (mạng di động / proxy cắt kết nối im lặng)
    ping = setInterval(() => {
      if (res.writableEnded || res.destroyed) return
      try {
        res.write(': ping\n\n')
      } catch {
        /* client đã đóng */
      }
    }, 15_000)
  }
  const reply = (status: number, payload: Record<string, unknown>) => {
    if (!streaming) return json(res, status, payload)
    clearInterval(ping)
    send(status === 200 ? { type: 'done', ...payload } : { type: 'error', status, ...payload })
    if (!res.writableEnded) res.end()
  }

  try {

    let prov: ReturnType<typeof providerConfig>
    try {
      prov = await liveConfig()
    } catch (err) {
      return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
    }
    if (!prov.apiKey && !prov.anyrouterApiKey && !prov.anthropicApiKey && !prov.deepseekApiKey && !prov.fostaApiKey && !prov.nightrouterApiKey) {
      return json(res, 500, {
        error: 'Chưa cấu hình LLM_API_KEY, DEEPSEEK_API_KEY, ANYROUTER_API_KEY, NIGHTROUTER_API_KEY hoặc ANTHROPIC_API_KEY. Kiểm tra file .env/config provider.',
      })
    }

    // Thứ tự thử: opencode (model chính [+ LLM_FALLBACK_MODEL nếu đặt]) → Mercury → FOSTA (gpt-6-luna) → AnyRouter (gpt-6.1-terra) → NightRouter → Claude (cuối cùng).
    // Provider dự phòng nào không có key thì bỏ qua.
    // `opencode` = gửi x-opencode-session + reasoning_effort; `effort` = chỉ gửi reasoning_effort (DeepSeek chính hãng).
    // `anthropic`: gọi Claude qua SDK (Messages API), không qua fetch kiểu OpenAI.
    // `stream`: gọi stream:true rồi gom SSE lại (AnyRouter)
    type Target = { model: string; url: string; key: string; opencode: boolean; anthropic?: boolean; stream?: boolean; effort?: boolean; search?: boolean; strong?: boolean }
    // tên provider cho log ai_calls
    const providerOf = (t: Target) =>
      t.anthropic ? 'anthropic' : t.opencode ? 'opencode' : t.key === prov.deepseekApiKey ? 'deepseek' : t.key === prov.fostaApiKey ? 'fosta' : t.key === prov.anyrouterApiKey ? 'anyrouter' : t.key === prov.nightrouterApiKey ? 'nightrouter' : 'khac'
    type Usage = { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number } | undefined
    // Vercel có thể dừng function ngay sau khi trả lời → gom promise log, chờ trước khi return
    const pending: Promise<void>[] = []
    // token provider đã tính nhưng lượt đó hỏng (trả rỗng…): vẫn trừ vào hạn mức
    let wasted = 0
    // model mạnh đắt hơn: nhân điểm khi lượt đang chạy là model mạnh
    let billFactor = 1
    /** usage thật; provider không trả usage (stream thiếu) thì ước theo độ dài vào + ra */
    const billOf = (usage: unknown, out: string) => {
      const u = usage as { total_tokens?: number; prompt_cache_hit_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } } | undefined
      const n = Number(u?.total_tokens)
      // phần đầu vào nhà cung cấp lấy từ cache chỉ tốn ~1/10 giá → chỉ tính 1/10 điểm
      const cached = Math.max(0, Number(u?.prompt_cache_hit_tokens ?? u?.prompt_tokens_details?.cached_tokens) || 0)
      if (Number.isFinite(n) && n > 0) return Math.max(1, Math.ceil((n - Math.min(cached, n) * 0.9) * billFactor))
      // nhà cung cấp không báo usage: tính mức trần (prompt + toàn bộ phần đầu ra cho phép), không đoán thấp
      return Math.ceil((promptTokens + Math.max(maxTokens, Math.ceil(out.length / 3))) * billFactor)
    }
    /** lượt thành công: hoàn biên nhận (nếu có) rồi cộng token đã dùng */
    const settle = async (spent: number) => {
      // hoàn tối đa bằng số lượt gọi lại này tốn (xem refundReceipt)
      const q = receipt ? await refundReceipt(userId, receipt, quota, spent) : quota
      return addUsage(userId, ip, spent + wasted, q)
    }
    const log = (t: Target, t0: number, ok: boolean, error: string | null, usage?: unknown) => {
      const u = usage as Usage
      pending.push(logAiCall({
        userId,
        model: t.model,
        provider: providerOf(t),
        ok,
        error,
        promptTokens: u?.prompt_tokens ?? u?.input_tokens,
        completionTokens: u?.completion_tokens ?? u?.output_tokens,
        cost: costFromUsage(usage),
        ms: Date.now() - t0,
      }))
    }
    const targets: Target[] = []
    // client chỉ được chọn model nằm trong cấu hình của app (trước đây gửi tên model tuỳ ý là gọi được model đắt nhất của gateway)
    const knownModels = [prov.model, prov.fallbackModel, prov.anthropicModel, prov.deepseekModel, prov.fostaModel, prov.anyrouterModel, prov.nightrouterModel].filter(Boolean)
    if (body.model !== undefined && !knownModels.includes(body.model)) body.model = undefined
    // client chỉ định đúng model dự phòng → bỏ qua opencode, gọi thẳng (thử/so chất lượng)
    const wantsBackup =
      (!!prov.anthropicApiKey && body.model === prov.anthropicModel) ||
      (!!prov.deepseekApiKey && body.model === prov.deepseekModel) ||
      (!!prov.fostaApiKey && body.model === prov.fostaModel) ||
      (!!prov.anyrouterApiKey && body.model === prov.anyrouterModel) ||
      (!!prov.nightrouterApiKey && body.model === prov.nightrouterModel)
    if (prov.apiKey && !wantsBackup) {
      for (const m of [body.model ?? prov.model, prov.fallbackModel]) {
        if (m && !targets.some((t) => t.model === m)) targets.push({ model: m, url: prov.endpoint.toString(), key: prov.apiKey, opencode: true })
      }
    }
    if (prov.deepseekApiKey) targets.push({ model: prov.deepseekModel, url: `${prov.deepseekBaseURL}/chat/completions`, key: prov.deepseekApiKey, opencode: false, effort: true })
    if (prov.fostaApiKey) targets.push({ model: prov.fostaModel, url: `${prov.fostaBaseURL}/chat/completions`, key: prov.fostaApiKey, opencode: false })
    if (prov.anyrouterApiKey)
      targets.push({ model: prov.anyrouterModel, url: `${prov.anyrouterBaseURL}/chat/completions`, key: prov.anyrouterApiKey, opencode: false, stream: true })
    if (prov.nightrouterApiKey)
      targets.push({ model: prov.nightrouterModel, url: `${prov.nightrouterBaseURL}/chat/completions`, key: prov.nightrouterApiKey, opencode: false })
    if (prov.anthropicApiKey) targets.push({ model: prov.anthropicModel, url: prov.anthropicBaseURL, key: prov.anthropicApiKey, opencode: false, anthropic: true })
    // tìm trên web: chỉ DeepSeek chính hãng có tool tìm kiếm, không rơi sang model khác (sẽ trả lời không có nguồn)
    if (body.webSearch) {
      if (!prov.deepseekApiKey) return json(res, 400, { error: 'Tìm trên web chưa được bật trên máy chủ.' })
      targets.splice(0, targets.length, { model: prov.deepseekModel, url: `${prov.deepseekBaseURL}/chat/completions`, key: prov.deepseekApiKey, opencode: false, search: true })
    }
    // Thử lại sau lượt hỏng: model mạnh đứng đầu, hỏng thì vẫn rơi về chuỗi thường
    if (body.strong === true && !body.webSearch && prov.deepseekApiKey && prov.deepseekStrongModel)
      targets.unshift({ model: prov.deepseekStrongModel, url: `${prov.deepseekBaseURL}/chat/completions`, key: prov.deepseekApiKey, opencode: false, effort: true, strong: true })
    // model dự phòng được chỉ định → thử nó trước tiên
    if (wantsBackup) {
      const i = targets.findIndex((t) => t.model === body.model)
      if (i > 0) targets.unshift(...targets.splice(i, 1))
    }

    const errs: string[] = []
    for (const [modelIndex, target] of targets.entries()) {
      const selectedModel = target.model
      billFactor = target.strong ? strongFactor() : 1
      let lastErr: string | null = null
      const t0 = Date.now()
      if (target.anthropic) {
        if (modelIndex > 0) send({ type: 'retry' })
        try {
          const r = await callAnthropic({
            apiKey: target.key,
            baseURL: target.url,
            model: selectedModel,
            messages: body.messages,
            maxTokens,
            effort: 'medium',
            signal: AbortSignal.timeout(upstreamTimeoutMs()),
          })
          if (r.content.trim()) {
            writeRawLog(JSON.stringify(r), { _model: selectedModel, _attempt: 0, finishReason: r.finishReason, usage: r.usage, content: r.content })
            log(target, t0, true, null, r.usage)
            const spent = billOf(r.usage, r.content)
            const [after] = await Promise.all([settle(spent), release(), ...pending])
            return reply(200, { content: r.content, reasoning: '', usage: r.usage, model: r.model, finishReason: r.finishReason, quota: after, receipt: receiptFor(spent) })
          }
          errs.push(`${selectedModel}: empty content (finish_reason=${r.finishReason})`)
        } catch (err) {
          const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
          errs.push(`${selectedModel}: ${timedOut ? `quá thời gian chờ ${Math.round(upstreamTimeoutMs() / 1000)}s` : err instanceof Error ? err.message.slice(0, 200) : String(err)}`)
        }
        log(target, t0, false, errs[errs.length - 1] ?? 'lỗi')
        continue
      }
      let attemptBody = JSON.stringify({
        model: selectedModel,
        messages: body.messages,
        max_tokens: maxTokens,
        ...((target.opencode || target.effort) && body.reasoningEffort ? { reasoning_effort: body.reasoningEffort } : {}),
        // bật suy luận thì DeepSeek chuyển sang tìm nhiều bước (đắt gấp 2–4 lần): lượt tìm chỉ cần tóm tắt nguồn
        ...(target.search ? { tools: [{ type: 'deepseek_web_search' }], thinking: { type: 'disabled' } } : {}),
        ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
        ...(target.stream || (wantStream && !target.search) ? { stream: true, stream_options: { include_usage: true } } : {}),
      })
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0 || modelIndex > 0) send({ type: 'retry' })
        let upstream: Response
        try {
          upstream = await fetch(target.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${target.key}`,
              ...(target.opencode ? { 'x-opencode-session': SESSION_ID, 'User-Agent': 'de-ro/1.0' } : {}),
            },
            body: attemptBody,
            redirect: 'error', // không để endpoint công khai chuyển hướng server vào mạng nội bộ
            signal: AbortSignal.timeout(upstreamTimeoutMs()),
          })
        } catch (err) {
          // AbortSignal.timeout() ném DOMException 'TimeoutError'; báo đúng
          // nguyên nhân thay vì chuỗi "operation was aborted" khó hiểu.
          const timedOut =
            err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
          lastErr = `${selectedModel}: ${
            timedOut
              ? `quá thời gian chờ ${Math.round(upstreamTimeoutMs() / 1000)}s`
              : err instanceof Error
                ? err.message
                : String(err)
          }`
          break
        }

        let text: string
        if (upstream.ok && wantStream) {
          startStream()
          // gom mẩu suy luận ~250ms một lần (DeepSeek gửi từng vài ký tự) cho đỡ số sự kiện
          let thinkBuf = ''
          let thinkAt = 0
          const got = await readUpstreamSse(upstream, (d) => {
            if (d.reasoning) {
              thinkBuf += d.reasoning
              if (Date.now() - thinkAt > 250) {
                thinkAt = Date.now()
                send({ type: 'think', d: thinkBuf })
                thinkBuf = ''
              }
            }
            if (d.content) {
              if (thinkBuf) send({ type: 'think', d: thinkBuf })
              thinkBuf = ''
              send({ type: 'delta', c: d.content })
            }
          })
          if (got.broken) {
            // đứt giữa chừng: nhà cung cấp vẫn tính phần đã sinh → ước theo độ dài đã nhận (không phải mức trần)
            wasted += promptTokens + Math.ceil((got.content.length + got.reasoning.length) / 3)
            lastErr = `${selectedModel}: luồng trả lời bị ngắt giữa chừng`
            writeRawLog(got.content, { _model: selectedModel, _attempt: attempt, broken: true, reasoning: got.reasoning })
            break
          }
          text = JSON.stringify({ model: got.model, usage: got.usage, choices: [{ finish_reason: got.finish, message: { content: got.content, reasoning_content: got.reasoning } }] })
        } else {
          text = target.stream && upstream.ok ? sseToJson(await upstream.text()) : await upstream.text()
        }
        if (!upstream.ok) {
          const authFailed = upstream.status === 401 || upstream.status === 403
          lastErr = `${selectedModel}: upstream ${upstream.status}`
          if (authFailed) {
            // Một provider/model có thể bị vô hiệu nhưng fallback khác vẫn dùng được.
            // Không return sớm; tiếp tục chuỗi fallback và chỉ báo cuối nếu tất cả đều lỗi.
            lastErr = `${selectedModel}: API key bị từ chối (${upstream.status})`
            break
          }
          if ((upstream.status === 429 || upstream.status >= 500) && attempt < 1) {
            await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)))
            continue
          }
          break
        }

        let data: {
          choices?: Array<{
            finish_reason?: string
            message?: { content?: string; reasoning_content?: string; annotations?: Array<{ type?: string; url_citation?: { url?: string; title?: string } }> }
          }>
          usage?: unknown
          model?: string
        }
        try {
          data = JSON.parse(text)
        } catch {
          writeRawLog(text, { _model: selectedModel, _attempt: attempt })
          lastErr = `${selectedModel}: upstream returned non-JSON body`
          break
        }
        const choice = data.choices?.[0]
        const msg = choice?.message ?? {}
        const content = msg.content ?? ''
        const reasoning = msg.reasoning_content ?? ''
        writeRawLog(text, { _model: selectedModel, _attempt: attempt, finishReason: choice?.finish_reason, usage: data.usage, content, reasoning })

        if (content.trim()) {
          const spent = billOf(data.usage, content + reasoning)
          log(target, t0, true, null, data.usage)
          const [after] = await Promise.all([settle(spent), release(), ...pending])
          // nguồn web model đã dẫn (bỏ trùng link)
          const citations = target.search
            ? [...new Map((msg.annotations ?? []).filter((a) => a.type === 'url_citation' && a.url_citation?.url).map((a) => [a.url_citation!.url!, { url: a.url_citation!.url!, title: a.url_citation!.title || a.url_citation!.url! }])).values()].slice(0, 20)
            : undefined
          return reply(200, { content, reasoning, usage: data.usage ?? null, model: data.model ?? selectedModel, finishReason: choice?.finish_reason ?? 'unknown', quota: after, receipt: receiptFor(spent), ...(citations ? { citations } : {}) })
        }
        lastErr = `${selectedModel}: empty content (finish_reason=${choice?.finish_reason ?? 'unknown'})`
        // trả rỗng vẫn tốn token (thường là suy luận hết trần) → tính vào hạn mức
        wasted += billOf(data.usage, reasoning)
        if (attempt === 0 && target.opencode) {
          const retryBody = JSON.parse(attemptBody) as Record<string, unknown>
          retryBody.reasoning_effort = 'medium'
          attemptBody = JSON.stringify(retryBody)
        }
      }
      if (lastErr) {
        errs.push(lastErr)
        log(target, t0, false, lastErr)
      }
      if (modelIndex < targets.length - 1) await new Promise((r) => setTimeout(r, 500))
    }

    // báo lỗi TỪNG model, không chỉ cái cuối (lỗi cuối hay là fallback phụ, che mất nguyên nhân thật)
    await Promise.all([wasted ? addUsage(userId, ip, wasted, quota) : null, release(), ...pending])
    return reply(502, { error: `Các model AI đều không phản hồi. ${errs.join(' · ')}`.trim() })
  } catch (err) {
    return reply(500, { error: err instanceof Error ? err.message : String(err) })
  } finally {
    clearInterval(ping)
    await release()
  }
}

/** Connect/Vite middleware cho dev server — chỉ chặn /api/llm. */
export function llmMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  if (!['POST', 'OPTIONS', 'GET'].includes(req.method ?? '')) return next()
  handleLlmRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}

/** Server production: API LLM + static build của Vite. */
export function createAppServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (url.pathname === '/api/llm') {
      await handleLlmRequest(req, res)
      return
    }
    if (url.pathname === '/api/extract') {
      await handleExtractRequest(req, res)
      return
    }
    if (url.pathname === '/api/search') {
      await handleSearchRequest(req, res)
      return
    }
    if (url.pathname === '/api/image') {
      await handleImageRequest(req, res)
      return
    }

    // Static: mọi đường dẫn phải nằm trong `dist/` (chặn `../` thoát thư mục).
    const dist = path.resolve(ROOT, 'dist')
    let rel = 'index.html'
    if (url.pathname !== '/') {
      try {
        rel = decodeURIComponent(url.pathname).replace(/^\/+/, '')
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        return res.end('Bad request')
      }
    }
    const filePath = path.resolve(dist, rel)
    const insideDist = filePath.startsWith(dist + path.sep)
    if (!insideDist) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      return res.end('Not found')
    }

    if (existsSync(filePath)) {
      const ext = path.extname(filePath)
      const types: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.woff2': 'font/woff2',
        '.png': 'image/png',
      }
      res.writeHead(200, { 'Content-Type': types[ext] ?? 'application/octet-stream' })
      return res.end(await readFile(filePath))
    }

    // SPA fallback — chỉ cho điều hướng HTML, không nuốt asset thiếu.
    if (!path.extname(rel)) {
      const index = path.join(dist, 'index.html')
      if (existsSync(index)) {
        const html = await readFile(index, 'utf8')
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(html)
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  })
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))
if (isMain) {
  // Production: nạp .env nếu có (dev đã do Vite lo).
  loadDotEnv()
  const port = Number(process.env.PORT ?? 8787)
  createAppServer().listen(port, () => {
    console.log(`[soandethi] http://localhost:${port}`)
  })
}
