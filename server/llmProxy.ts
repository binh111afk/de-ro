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
import { homedir } from 'node:os'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { json, readBody } from './http.js'
import { clientIp, guard, isLocal, userFromToken } from './guard.js'
import { addUsage, hasQuotaStore, quotaMessage, readQuota, reserveQuota } from './aiQuota.js'
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
const DEFAULT_XKIRO_MODEL = 'google/gemini-3.8-flash'
const DEFAULT_XKIRO_FALLBACK_MODEL = 'google/gemini-3-flash'
const DEFAULT_UPSTREAM_TIMEOUT_MS = 120_000

/**
 * Thời gian chờ mỗi lượt gọi model. Model reasoning (deepseek) có thể suy luận
 * 5–10k token cho một dàn ý slide, 45s cũ không đủ → đọc `LLM_TIMEOUT_MS` trong
 * `.env` để chỉnh, mặc định 120s.
 */
function upstreamTimeoutMs(): number {
  const raw = Number(process.env.LLM_TIMEOUT_MS)
  return Number.isFinite(raw) && raw >= 10_000 ? raw : DEFAULT_UPSTREAM_TIMEOUT_MS
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

function xkiroConfig(): { apiKey: string; baseURL: string } {
  try {
    const file = path.join(homedir(), '.zcode', 'v2', 'provider_config.json')
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
      config?: { providerConfigRules?: { providerRules?: Array<{ providerName?: string; config?: { access?: { apiKey?: string }; api?: { baseUrl?: string } } }> } }
    }
    const rule = parsed.config?.providerConfigRules?.providerRules?.find((item) => /xkiro/i.test(item.providerName ?? ''))
    return { apiKey: rule?.config?.access?.apiKey ?? '', baseURL: rule?.config?.api?.baseUrl ?? 'https://api.xkiro.com/v1' }
  } catch {
    return { apiKey: '', baseURL: 'https://api.xkiro.com/v1' }
  }
}

function providerConfig() {
  const baseURL = process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL
  const xkiro = xkiroConfig()
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
    // Inception Mercury (dLLM), tương thích OpenAI
    mercuryApiKey: process.env.MERCURY_API_KEY?.trim() || '',
    mercuryBaseURL: assertAllowedUrl((process.env.MERCURY_BASE_URL?.trim() || 'https://api.inceptionlabs.ai/v1').replace(/\/+$/, '')).toString().replace(/\/+$/, ''),
    mercuryModel: process.env.MERCURY_MODEL?.trim() || 'mercury-3',
    fostaApiKey: process.env.FOSTA_API_KEY?.trim() || '',
    fostaBaseURL: assertAllowedUrl((process.env.FOSTA_BASE_URL?.trim() || 'https://codex.fosta.app/v1').replace(/\/+$/, '')).toString().replace(/\/+$/, ''),
    fostaModel: process.env.FOSTA_MODEL?.trim() || 'gpt-6-luna',
    // ZCode provider config is the source of truth for local Xkiro fallback;
    // stale shell/.env keys must not shadow the currently selected provider key.
    xkiroApiKey: xkiro.apiKey || process.env.XKIRO_API_KEY?.trim() || '',
    xkiroBaseURL: (xkiro.baseURL || process.env.XKIRO_BASE_URL?.trim() || 'https://api.xkiro.com/v1').replace(/\/+$/, ''),
    xkiroModel: process.env.XKIRO_MODEL?.trim() || DEFAULT_XKIRO_MODEL,
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
    mercuryApiKey: o.mercury?.apiKey || p.mercuryApiKey,
    mercuryBaseURL: o.mercury?.baseUrl || p.mercuryBaseURL,
    mercuryModel: o.mercury?.model || p.mercuryModel,
    fostaApiKey: o.fosta?.apiKey || p.fostaApiKey,
    fostaBaseURL: o.fosta?.baseUrl || p.fostaBaseURL,
    fostaModel: o.fosta?.model || p.fostaModel,
    xkiroApiKey: o.xkiro?.apiKey || p.xkiroApiKey,
    xkiroBaseURL: o.xkiro?.baseUrl || p.xkiroBaseURL,
    xkiroModel: o.xkiro?.model || p.xkiroModel,
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
  if (p.mercuryApiKey) list.push({ provider: 'mercury', model: p.mercuryModel, key: p.mercuryApiKey, url: `${p.mercuryBaseURL}/chat/completions` })
  if (p.fostaApiKey) list.push({ provider: 'fosta', model: p.fostaModel, key: p.fostaApiKey, url: `${p.fostaBaseURL}/chat/completions` })
  if (p.xkiroApiKey) list.push({ provider: 'xkiro', model: p.xkiroModel, key: p.xkiroApiKey, url: `${p.xkiroBaseURL}/chat/completions` })
  if (p.nightrouterApiKey) list.push({ provider: 'nightrouter', model: p.nightrouterModel, key: p.nightrouterApiKey, url: `${p.nightrouterBaseURL}/chat/completions` })
  if (p.anthropicApiKey) list.push({ provider: 'anthropic', model: p.anthropicModel, key: p.anthropicApiKey, url: p.anthropicBaseURL, anthropic: true })
  return list
}

/** Provider đọc được ảnh đề, theo thứ tự thử (Claude đắt nhất nên để cuối). */
export async function visionTargets() {
  const all = pingTargets(await liveConfig())
  return ['fosta', 'xkiro', 'anthropic'].flatMap((name) => all.filter((t) => t.provider === name))
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

/** Xử lý một lời gọi /api/llm. Luôn tự ghi response. */
export async function handleLlmRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!(await guard(req, res, 'llm'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})

  // hạn mức token theo tài khoản (tháng) / khách (ngày theo IP); máy dev không giới hạn
  const ip = clientIp(req)
  const userId = isLocal(ip) ? null : await userFromToken(req)
  const quota = isLocal(ip) ? null : await readQuota(userId, ip)
  // GET: chỉ đọc hạn mức (trang Hồ sơ), không gọi AI. null = máy dev, không giới hạn
  if (req.method === 'GET') return json(res, 200, { quota, unlimited: !!userId && quota === null && hasQuotaStore() })
  if (await maintenanceBlock(req, res)) return
  if (quota && quota.used >= quota.limit) return json(res, 429, { error: quotaMessage(quota), quota })
  const release = quota ? await reserveQuota(userId, ip, quota) : async () => {}
  if (!release) return json(res, 429, { error: 'Đang có nhiều yêu cầu AI chạy cùng lúc, vui lòng thử lại sau ít giây.', quota })

  try {
    const raw = await readBody(req)
    const body = JSON.parse(raw) as {
      messages?: Array<{ role: string; content: string }>
      maxTokens?: number
      reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
      temperature?: number
      model?: string
    }
    if (!body.messages?.length) return json(res, 400, { error: 'messages is required' })

    let prov: ReturnType<typeof providerConfig>
    try {
      prov = await liveConfig()
    } catch (err) {
      return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
    }
    if (!prov.apiKey && !prov.xkiroApiKey && !prov.anthropicApiKey && !prov.mercuryApiKey && !prov.fostaApiKey && !prov.nightrouterApiKey) {
      return json(res, 500, {
        error: 'Chưa cấu hình LLM_API_KEY, MERCURY_API_KEY, XKIRO_API_KEY, NIGHTROUTER_API_KEY hoặc ANTHROPIC_API_KEY. Kiểm tra file .env/config provider.',
      })
    }

    // Thứ tự thử: opencode (model chính [+ LLM_FALLBACK_MODEL nếu đặt]) → Mercury → FOSTA (gpt-6-luna) → xkiro → NightRouter → Claude (cuối cùng).
    // Provider dự phòng nào không có key thì bỏ qua.
    // `opencode` = gửi x-opencode-session + reasoning_effort (chỉ gateway opencode hiểu).
    // `anthropic`: gọi Claude qua SDK (Messages API), không qua fetch kiểu OpenAI.
    type Target = { model: string; url: string; key: string; opencode: boolean; anthropic?: boolean }
    // tên provider cho log ai_calls
    const providerOf = (t: Target) =>
      t.anthropic ? 'anthropic' : t.opencode ? 'opencode' : t.key === prov.mercuryApiKey ? 'mercury' : t.key === prov.fostaApiKey ? 'fosta' : t.key === prov.xkiroApiKey ? 'xkiro' : t.key === prov.nightrouterApiKey ? 'nightrouter' : 'khac'
    type Usage = { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number } | undefined
    // Vercel có thể dừng function ngay sau khi trả lời → gom promise log, chờ trước khi return
    const pending: Promise<void>[] = []
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
    // client chỉ định đúng model dự phòng → bỏ qua opencode, gọi thẳng (thử/so chất lượng)
    const wantsBackup =
      (!!prov.anthropicApiKey && body.model === prov.anthropicModel) ||
      (!!prov.mercuryApiKey && body.model === prov.mercuryModel) ||
      (!!prov.fostaApiKey && body.model === prov.fostaModel) ||
      (!!prov.nightrouterApiKey && body.model === prov.nightrouterModel)
    if (prov.apiKey && !wantsBackup) {
      for (const m of [body.model ?? prov.model, prov.fallbackModel]) {
        if (m && !targets.some((t) => t.model === m)) targets.push({ model: m, url: prov.endpoint.toString(), key: prov.apiKey, opencode: true })
      }
    }
    if (prov.mercuryApiKey) targets.push({ model: prov.mercuryModel, url: `${prov.mercuryBaseURL}/chat/completions`, key: prov.mercuryApiKey, opencode: false })
    if (prov.fostaApiKey) targets.push({ model: prov.fostaModel, url: `${prov.fostaBaseURL}/chat/completions`, key: prov.fostaApiKey, opencode: false })
    if (prov.xkiroApiKey) {
      for (const m of [prov.xkiroModel, DEFAULT_XKIRO_FALLBACK_MODEL]) {
        targets.push({ model: m, url: `${prov.xkiroBaseURL}/chat/completions`, key: prov.xkiroApiKey, opencode: false })
      }
    }
    if (prov.nightrouterApiKey)
      targets.push({ model: prov.nightrouterModel, url: `${prov.nightrouterBaseURL}/chat/completions`, key: prov.nightrouterApiKey, opencode: false })
    if (prov.anthropicApiKey) targets.push({ model: prov.anthropicModel, url: prov.anthropicBaseURL, key: prov.anthropicApiKey, opencode: false, anthropic: true })
    // model dự phòng được chỉ định → thử nó trước tiên
    if (wantsBackup) {
      const i = targets.findIndex((t) => t.model === body.model)
      if (i > 0) targets.unshift(...targets.splice(i, 1))
    }

    const errs: string[] = []
    for (const [modelIndex, target] of targets.entries()) {
      const selectedModel = target.model
      let lastErr: string | null = null
      const t0 = Date.now()
      if (target.anthropic) {
        try {
          const r = await callAnthropic({
            apiKey: target.key,
            baseURL: target.url,
            model: selectedModel,
            messages: body.messages,
            maxTokens: body.maxTokens ?? 32000,
            effort: 'medium',
            signal: AbortSignal.timeout(upstreamTimeoutMs()),
          })
          if (r.content.trim()) {
            writeRawLog(JSON.stringify(r), { _model: selectedModel, _attempt: 0, finishReason: r.finishReason, usage: r.usage, content: r.content })
            log(target, t0, true, null, r.usage)
            const [after] = await Promise.all([addUsage(userId, ip, r.usage.total_tokens, quota), release(), ...pending])
            return json(res, 200, { content: r.content, reasoning: '', usage: r.usage, model: r.model, finishReason: r.finishReason, quota: after })
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
        max_tokens: body.maxTokens ?? 32000,
        ...(target.opencode && body.reasoningEffort ? { reasoning_effort: body.reasoningEffort } : {}),
        ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
      })
      for (let attempt = 0; attempt < 2; attempt++) {
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

        const text = await upstream.text()
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
          choices?: Array<{ finish_reason?: string; message?: { content?: string; reasoning_content?: string } }>
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
          const spent = Number((data.usage as { total_tokens?: number } | undefined)?.total_tokens ?? 0)
          log(target, t0, true, null, data.usage)
          const [after] = await Promise.all([addUsage(userId, ip, spent, quota), release(), ...pending])
          return json(res, 200, { content, reasoning, usage: data.usage ?? null, model: data.model ?? selectedModel, finishReason: choice?.finish_reason ?? 'unknown', quota: after })
        }
        lastErr = `${selectedModel}: empty content (finish_reason=${choice?.finish_reason ?? 'unknown'})`
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
    await Promise.all([release(), ...pending])
    return json(res, 502, { error: `Các model AI đều không phản hồi. ${errs.join(' · ')}`.trim() })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  } finally {
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
