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
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { json, readBody } from './http.js'
import { clientIp, guard, isLocal, userFromToken } from './guard.js'
import { addUsage, quotaMessage, readQuota } from './aiQuota.js'
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
  const v4 = host.startsWith('::ffff:') ? host.slice(7) : host
  if (isIP(v4) === 4) {
    const blocked = BLOCKED_V4.find(([re]) => re.test(v4))
    if (blocked) throw new Error(`LLM_BASE_URL trỏ tới địa chỉ nội bộ (${blocked[1]})`)
  }
  if (isIP(host) === 6) {
    if (host === '::1' || host === '::' || /^f[cd]/i.test(host) || /^fe[89ab]/i.test(host)) {
      throw new Error('LLM_BASE_URL trỏ tới địa chỉ IPv6 nội bộ')
    }
  }
  return url
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
  if (quota && quota.used >= quota.limit) return json(res, 429, { error: quotaMessage(quota), quota })

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
      prov = providerConfig()
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
    if (prov.anthropicApiKey) targets.push({ model: prov.anthropicModel, url: '', key: prov.anthropicApiKey, opencode: false, anthropic: true })
    // model dự phòng được chỉ định → thử nó trước tiên
    if (wantsBackup) {
      const i = targets.findIndex((t) => t.model === body.model)
      if (i > 0) targets.unshift(...targets.splice(i, 1))
    }

    const errs: string[] = []
    for (const [modelIndex, target] of targets.entries()) {
      const selectedModel = target.model
      let lastErr: string | null = null
      if (target.anthropic) {
        try {
          const r = await callAnthropic({
            apiKey: target.key,
            model: selectedModel,
            messages: body.messages,
            maxTokens: body.maxTokens ?? 32000,
            effort: 'medium',
            signal: AbortSignal.timeout(upstreamTimeoutMs()),
          })
          if (r.content.trim()) {
            writeRawLog(JSON.stringify(r), { _model: selectedModel, _attempt: 0, finishReason: r.finishReason, usage: r.usage, content: r.content })
            const after = await addUsage(userId, ip, r.usage.total_tokens, quota)
            return json(res, 200, { content: r.content, reasoning: '', usage: r.usage, model: r.model, finishReason: r.finishReason, quota: after })
          }
          errs.push(`${selectedModel}: empty content (finish_reason=${r.finishReason})`)
        } catch (err) {
          const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
          errs.push(`${selectedModel}: ${timedOut ? `quá thời gian chờ ${Math.round(upstreamTimeoutMs() / 1000)}s` : err instanceof Error ? err.message.slice(0, 200) : String(err)}`)
        }
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
          const after = await addUsage(userId, ip, spent, quota)
          return json(res, 200, { content, reasoning, usage: data.usage ?? null, model: data.model ?? selectedModel, finishReason: choice?.finish_reason ?? 'unknown', quota: after })
        }
        lastErr = `${selectedModel}: empty content (finish_reason=${choice?.finish_reason ?? 'unknown'})`
        if (attempt === 0 && target.opencode) {
          const retryBody = JSON.parse(attemptBody) as Record<string, unknown>
          retryBody.reasoning_effort = 'medium'
          attemptBody = JSON.stringify(retryBody)
        }
      }
      if (lastErr) errs.push(lastErr)
      if (modelIndex < targets.length - 1) await new Promise((r) => setTimeout(r, 500))
    }

    // báo lỗi TỪNG model, không chỉ cái cuối (lỗi cuối hay là fallback phụ, che mất nguyên nhân thật)
    return json(res, 502, { error: `Các model AI đều không phản hồi. ${errs.join(' · ')}`.trim() })
  } catch (err) {
    return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  }
}

/** Connect/Vite middleware cho dev server — chỉ chặn /api/llm. */
export function llmMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
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
