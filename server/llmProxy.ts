/**
 * Dev/prod proxy tới provider LLM.
 * Giữ API key ngoài bundle phía browser — app chỉ gọi /api/llm.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const CONFIG_PATHS = [
  process.env.MINISCOFT_CONFIG,
  'C:/Users/Lenovo/.minimax/config.yaml',
].filter(Boolean) as string[]

type Provider = {
  baseURL: string
  apiKey: string
  api: string
  model?: string
}

function loadProvider(providerId: string): Provider | null {
  for (const p of CONFIG_PATHS) {
    if (!existsSync(p)) continue
    const cfg = parseYaml(readFileSync(p, 'utf8')) as Record<string, any>
    const custom = (cfg.custom_provider ?? {}) as Record<string, Record<string, any>>
    const standard = (cfg.provider ?? {}) as Record<string, Record<string, any>>
    const pconf = custom[providerId] ?? standard[providerId]
    if (!pconf) continue
    const options = (pconf.options ?? {}) as Record<string, string>
    const models = (pconf.models ?? {}) as Record<string, Record<string, unknown>>
    const firstModel = Object.keys(models)[0]
    return {
      baseURL: options.baseURL ?? '',
      apiKey: options.apiKey ?? '',
      api: (pconf.api as string) ?? 'chat-completions',
      model: firstModel,
    }
  }
  return null
}

const DEFAULT_PROVIDER = 'xkiro'
const DEFAULT_MODEL = 'minimax/minimax-m3.1-flash'

function json(res: ServerResponse, code: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  })
  res.end(payload)
}

/** Ghi log raw response của upstream để chẩn đoán khi model trả rỗng. */
function writeRawLog(raw: string, parsed?: Record<string, unknown>) {
  try {
    const logDir = path.join(ROOT, '.llmlog')
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

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

/** Server này phục vụ cả API LLM và static build của Vite. */
export function createAppServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    if (req.method === 'OPTIONS') return json(res, 204, {})

    if (url.pathname === '/api/llm' && req.method === 'POST') {
      try {
        const raw = await readBody(req)
        const body = JSON.parse(raw) as {
          messages?: Array<{ role: string; content: string }>
          maxTokens?: number
          reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
          temperature?: number
          provider?: string
          model?: string
        }
        if (!body.messages?.length) return json(res, 400, { error: 'messages is required' })

        const providerId = body.provider ?? DEFAULT_PROVIDER
        const prov = loadProvider(providerId)
        if (!prov) return json(res, 500, { error: `provider '${providerId}' not found in config.yaml` })
        if (!prov.apiKey) return json(res, 500, { error: `provider '${providerId}' has no apiKey` })

        const model = body.model ?? prov.model ?? DEFAULT_MODEL

        let requestBody = JSON.stringify({
          model,
          messages: body.messages,
          max_tokens: body.maxTokens ?? 32000,
          ...(body.reasoningEffort ? { reasoning_effort: body.reasoningEffort } : {}),
          ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
        })

        // Gọi upstream, thử lại tối đa 2 lần nếu model trả về rỗng
        // (hay gặp khi reasoning quá dài và bị cắt trước khi xuất nội dung).
        let lastErr: string | null = null
        for (let attempt = 0; attempt < 2; attempt++) {
          const upstream = await fetch(`${prov.baseURL.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${prov.apiKey}`,
            },
            body: requestBody,
          })

          const text = await upstream.text()
          if (!upstream.ok) {
            // Lỗi tạm thời (quá tải, timeout, 429, 5xx) → thử lại sau khi nghỉ
            const transient = upstream.status === 429 || upstream.status >= 500
            if (transient && attempt < 2) {
              lastErr = `Upstream ${upstream.status}: ${text.slice(0, 500)}`
              await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)))
              continue
            }
            return json(res, upstream.status, {
              error: `Dịch vụ AI đang bận (${upstream.status}). Vui lòng thử lại sau.`,
              detail: text.slice(0, 800),
            })
          }
          let data: {
            choices?: Array<{
              finish_reason?: string
              message?: { content?: string; reasoning_content?: string }
            }>
            usage?: unknown
            model?: string
          }
          try {
            data = JSON.parse(text)
          } catch {
            // Upstream trả body không phải JSON — lưu lại để chẩn đoán
            writeRawLog(text, { _attempt: attempt })
            return json(res, 502, { error: 'Upstream returned non-JSON body' })
          }
          const choice = data.choices?.[0]
          const msg = choice?.message ?? {}
          const content = msg.content ?? ''
          const reasoning = msg.reasoning_content ?? ''

          // Ghi log để debug khi model trả về JSON hỏng / bị cắt
          writeRawLog(text, {
            _attempt: attempt,
            finishReason: choice?.finish_reason,
            usage: data.usage,
            content,
            reasoning,
          })

          if (content.trim()) {
            return json(res, 200, {
              content,
              reasoning,
              usage: data.usage ?? null,
              model: data.model ?? model,
              finishReason: choice?.finish_reason ?? 'unknown',
            })
          }

          // content rỗng — thử lại với reasoning nhẹ hơn để chắc chắn có output
          lastErr = `Upstream returned empty content (finish_reason=${
            choice?.finish_reason ?? 'unknown'
          }, reasoning_len=${reasoning.length})`
          if (attempt === 0) {
            try {
              const retryBody = JSON.parse(requestBody) as Record<string, unknown>
              retryBody.reasoning_effort = 'medium'
              requestBody = JSON.stringify(retryBody)
            } catch {
              /* giữ nguyên payload gốc */
            }
          }
        }

        return json(res, 502, { error: lastErr ?? 'Upstream returned empty content' })

        return json(res, 200, {
          content,
          reasoning,
          usage: data.usage ?? null,
          model: data.model ?? model,
          finishReason: choice?.finish_reason ?? 'unknown',
        })
      } catch (err) {
        return json(res, 500, { error: err instanceof Error ? err.message : String(err) })
      }
    }

    // static
    const dist = path.join(ROOT, 'dist')
    let filePath = path.join(dist, url.pathname === '/' ? 'index.html' : url.pathname)
    if (!existsSync(filePath) || url.pathname === '/') {
      const index = path.join(dist, 'index.html')
      if (existsSync(index)) {
        const html = await readFile(index, 'utf8')
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(html)
      }
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

    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  })
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))
if (isMain) {
  const port = Number(process.env.PORT ?? 8787)
  createAppServer().listen(port, () => {
    console.log(`[soandethi] http://localhost:${port}`)
  })
}
