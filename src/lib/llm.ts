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
  /** biên nhận để xin hoàn token nếu kết quả không dùng được (gửi lại qua `retryOf`) */
  receipt?: string
}

export interface LlmOptions {
  maxTokens?: number
  reasoningEffort?: 'low' | 'medium' | 'high' | 'max'
  temperature?: number
  signal?: AbortSignal
  /** biên nhận của lượt trước bị hỏng: server hoàn token lượt đó rồi mới tính lượt này */
  retryOf?: string
}

const ENDPOINT = '/api/llm'

/** Hạn mức AI server báo về (token; giao diện quy ra điểm). */
export interface AiQuota {
  used: number
  limit: number
  scope: 'month'
}
/** 1 điểm AI = 1.000 token (khớp TOKENS_PER_POINT ở server/aiQuota.ts) */
export const TOKENS_PER_POINT = 1000
export const aiPointsLeft = (q: AiQuota) => Math.max(0, Math.floor((q.limit - q.used) / TOKENS_PER_POINT))
/** Lần báo gần nhất + sự kiện `ai-quota` để giao diện cập nhật. */
export let lastAiQuota: AiQuota | null = null
function reportQuota(q: unknown) {
  if (!q || typeof q !== 'object' || typeof (q as AiQuota).limit !== 'number') return
  lastAiQuota = q as AiQuota
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<AiQuota>('ai-quota', { detail: lastAiQuota }))
}

/** Lỗi tạm (mạng, server/gateway 5xx): lượt hỏng không bị tính token nên gọi lại luôn một lần. */
class TransientLlmError extends Error {}

export async function callLlm(messages: LlmMessage[], opts: LlmOptions = {}): Promise<LlmResult> {
  try {
    return await callOnce(messages, opts)
  } catch (err) {
    if (!(err instanceof TransientLlmError) || opts.signal?.aborted) throw err
    await new Promise((r) => setTimeout(r, 1500))
    return callOnce(messages, opts)
  }
}

/**
 * Gọi rồi kiểm kết quả; không dùng được thì hoàn token lượt đó và gọi lại đúng một lần
 * (lượt gọi lại vẫn hỏng thì trả về để caller tự xử lý).
 */
export async function callLlmChecked(
  messages: LlmMessage[],
  opts: LlmOptions,
  usable: (content: string) => boolean,
): Promise<LlmResult> {
  const first = await callLlm(messages, opts)
  if (usable(first.content)) return first
  return callLlm(messages, { ...opts, retryOf: first.receipt })
}

async function callOnce(messages: LlmMessage[], opts: LlmOptions): Promise<LlmResult> {
  let res: Response
  try {
    res = await apiFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts.retryOf ? { 'x-ai-retry-of': opts.retryOf } : {}) },
      signal: opts.signal,
      body: JSON.stringify({
        messages,
        maxTokens: opts.maxTokens ?? 32000,
        reasoningEffort: opts.reasoningEffort ?? 'max',
        ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      }),
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new TransientLlmError((err as Error)?.message || 'Lỗi mạng khi gọi AI')
  }

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
    if (res.status >= 500) throw new TransientLlmError(detail)
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
