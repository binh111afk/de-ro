/**
 * Client gọi LLM qua proxy nội bộ (/api/llm).
 * Key nằm ở server, không bao giờ xuất hiện trong bundle.
 */
import { apiFetch } from '@/lib/apiFetch'
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmResult {
  content: string
  reasoning: string
  usage: unknown
  model: string
}

export interface LlmOptions {
  maxTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
  temperature?: number
  signal?: AbortSignal
}

const ENDPOINT = '/api/llm'

/** Hạn mức token AI server báo về (tháng với tài khoản, ngày với khách). */
export interface AiQuota {
  used: number
  limit: number
  scope: 'month' | 'day'
}
/** Lần báo gần nhất + sự kiện `ai-quota` để giao diện cập nhật. */
export let lastAiQuota: AiQuota | null = null
function reportQuota(q: unknown) {
  if (!q || typeof q !== 'object' || typeof (q as AiQuota).limit !== 'number') return
  lastAiQuota = q as AiQuota
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<AiQuota>('ai-quota', { detail: lastAiQuota }))
}

export async function callLlm(messages: LlmMessage[], opts: LlmOptions = {}): Promise<LlmResult> {
  const res = await apiFetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      messages,
      maxTokens: opts.maxTokens ?? 32000,
      reasoningEffort: opts.reasoningEffort ?? 'max',
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    let detail = text.slice(0, 500)
    try {
      const parsed = JSON.parse(text) as { error?: string; quota?: unknown }
      if (parsed.error) detail = parsed.error
      reportQuota(parsed.quota)
    } catch {
      /* giữ raw text */
    }
    throw new Error(detail)
  }
  const data = (await res.json()) as LlmResult & { quota?: unknown }
  reportQuota(data.quota)
  if (!data.content?.trim()) {
    throw new Error(
      'AI không trả về nội dung (có thể do suy luận quá dài bị cắt). Hãy thử lại hoặc rút gọn yêu cầu.',
    )
  }
  return data
}

/**
 * Bóc JSON khỏi output của model. Model có thể bọc trong ```json ... ```.
 */
export function extractJson<T>(raw: string): T {
  let text = raw.trim()
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fence) text = fence[1].trim()
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  const sliced = first >= 0 && last > first ? text.slice(first, last + 1) : text
  const fromFirst = first >= 0 ? text.slice(first) : text
  for (const attempt of [text, sliced, repairJson(sliced), repairJson(fromFirst)]) {
    try {
      return JSON.parse(attempt) as T
    } catch {
      /* thử cách tiếp theo */
    }
  }
  throw new Error('Không phân tích được JSON từ phản hồi của AI')
}

/**
 * Sửa lỗi JSON hay gặp của model: dấu `"` trong chuỗi quên escape (vd
 * `"kích thước AB \"?""`), xuống dòng thô trong chuỗi, dấu phẩy thừa, và
 * JSON bị cắt cụt (đóng nốt chuỗi / ngoặc đang mở).
 */
export function repairJson(src: string): string {
  let out = ''
  let inStr = false
  const stack: string[] = []
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inStr) {
      if (c === '\\') {
        out += c + (src[i + 1] ?? '')
        i++
      } else if (c === '"') {
        // Chỉ coi là đóng chuỗi nếu sau nó (bỏ khoảng trắng) là ký tự cấu trúc.
        let j = i + 1
        while (j < src.length && /\s/.test(src[j])) j++
        const next = src[j]
        if (next === undefined || next === ',' || next === ':' || next === '}' || next === ']') {
          inStr = false
          out += c
        } else out += '\\"'
      } else if (c === '\n') out += '\\n'
      else if (c === '\r') out += ''
      else if (c === '\t') out += '\\t'
      else out += c
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{' || c === '[') stack.push(c === '{' ? '}' : ']')
    else if (c === '}' || c === ']') stack.pop()
    out += c
  }
  if (inStr) out += '"'
  out = out.replace(/,\s*$/, '')
  while (stack.length) out += stack.pop()
  return out.replace(/,(\s*[}\]])/g, '$1')
}
