/**
 * Search web cho ưu tiên 3 (chỉ dùng khi không có tệp mẫu và không có tài liệu
 * đã lưu phù hợp). Key nằm server-side; client gọi `/api/search` cùng origin.
 *
 * Hiện chỉ hỗ trợ Tavily (endpoint cố định). Nếu chưa có key, trả
 * `configured: false` để client bỏ qua bước search thay vì lỗi.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { json, readBody } from './http'

export interface SearchResult {
  title: string
  url: string
  content: string
}

const TAVILY_ENDPOINT = 'https://api.tavily.com/search'
const MAX_RESULTS = 5
const MAX_SNIPPET = 2000

function apiKey(): string {
  return (process.env.SEARCH_API_KEY || process.env.TAVILY_API_KEY || '').trim()
}

function normalizeResults(raw: unknown): SearchResult[] {
  if (!Array.isArray(raw)) return []
  const out: SearchResult[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const url = typeof r.url === 'string' ? r.url : ''
    const title = typeof r.title === 'string' ? r.title : url
    const content = typeof r.content === 'string' ? r.content : ''
    if (!url || !content.trim()) continue
    out.push({ title: title.trim() || url, url, content: content.trim().slice(0, MAX_SNIPPET) })
    if (out.length >= MAX_RESULTS) break
  }
  return out
}

async function runSearch(query: string, key: string): Promise<SearchResult[]> {
  const upstream = await fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: 'basic',
      max_results: MAX_RESULTS,
      include_answer: false,
      include_raw_content: false,
    }),
  })
  const text = await upstream.text()
  if (!upstream.ok) throw new Error(`Tavily ${upstream.status}: ${text.slice(0, 300)}`)
  const data = JSON.parse(text) as { results?: unknown }
  return normalizeResults(data.results)
}

export async function handleSearchRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = JSON.parse(await readBody(req)) as { query?: unknown }
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (!query) return json(res, 400, { error: 'query là bắt buộc' })

    const key = apiKey()
    if (!key) {
      return json(res, 200, {
        configured: false,
        results: [],
        message:
          'Chưa cấu hình tìm kiếm web. Điền TAVILY_API_KEY (hoặc SEARCH_API_KEY) vào .env nếu muốn dùng ưu tiên 3.',
      })
    }

    const results = await runSearch(query, key)
    return json(res, 200, { configured: true, provider: 'tavily', results })
  } catch (err) {
    return json(res, 502, {
      configured: true,
      error: err instanceof Error ? err.message : String(err),
      results: [],
    })
  }
}

export function searchMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleSearchRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}
