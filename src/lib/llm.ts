/**
 * Client gọi LLM qua proxy nội bộ (/api/llm).
 * Key nằm ở server, không bao giờ xuất hiện trong bundle.
 */
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

export async function callLlm(messages: LlmMessage[], opts: LlmOptions = {}): Promise<LlmResult> {
  const res = await fetch(ENDPOINT, {
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
      const parsed = JSON.parse(text) as { error?: string }
      if (parsed.error) detail = parsed.error
    } catch {
      /* giữ raw text */
    }
    throw new Error(detail)
  }
  const data = (await res.json()) as LlmResult
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
  try {
    return JSON.parse(text) as T
  } catch {
    // Cắt tới object đầu tiên / cuối cùng rồi thử lại
    const first = text.indexOf('{')
    const last = text.lastIndexOf('}')
    if (first >= 0 && last > first) {
      return JSON.parse(text.slice(first, last + 1)) as T
    }
    throw new Error('Không phân tích được JSON từ phản hồi của AI')
  }
}
