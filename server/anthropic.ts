/**
 * Claude (Anthropic API chính thức) — lớp dự phòng CUỐI của /api/llm.
 * Nhận messages kiểu OpenAI ({role, content}) như các provider khác, trả {content, usage}
 * với usage quy về dạng OpenAI (prompt/completion/total_tokens) để hạn mức token đếm chung.
 * Streaming + finalMessage() vì max_tokens lớn (tránh timeout HTTP của SDK).
 */
import Anthropic from '@anthropic-ai/sdk'

type InMsg = { role: string; content: string }
export type AnthropicResult = {
  content: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  model: string
  finishReason: string
}

let client: { sig: string; c: Anthropic } | null = null
function getClient(apiKey: string, baseURL?: string): Anthropic {
  const sig = `${apiKey}|${baseURL ?? ''}`
  // maxRetries 1: proxy đã có chuỗi dự phòng; timeout do caller đặt qua signal
  if (client?.sig !== sig) client = { sig, c: new Anthropic({ apiKey, maxRetries: 1, fetchOptions: { redirect: 'error' }, ...(baseURL ? { baseURL } : {}) }) }
  return client.c
}

export async function callAnthropic(opts: {
  apiKey: string
  baseURL?: string
  model: string
  messages: InMsg[]
  maxTokens: number
  effort?: 'low' | 'medium' | 'high' | 'max'
  signal?: AbortSignal
}): Promise<AnthropicResult> {
  // tin "system" (kể cả nằm giữa) gộp vào tham số system; còn lại giữ user/assistant theo thứ tự
  const system = opts.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n')
  const messages: Anthropic.Beta.BetaMessageParam[] = opts.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  // Messages API không cho kết thúc bằng assistant (prefill) trên model hiện tại
  while (messages.length && messages[messages.length - 1].role === 'assistant') messages.pop()
  if (!messages.length) throw new Error('Không có tin nhắn người dùng')

  const stream = getClient(opts.apiKey, opts.baseURL).beta.messages.stream(
    {
      model: opts.model,
      max_tokens: opts.maxTokens,
      ...(system ? { system } : {}),
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort: opts.effort ?? 'medium' },
      // bị từ chối vì phân loại an toàn → server tự chạy lại trên model phù hợp
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    },
    { signal: opts.signal },
  )
  const msg = await stream.finalMessage()

  if (msg.stop_reason === 'refusal') throw new Error(`Claude từ chối yêu cầu (${msg.stop_details?.category ?? 'không rõ'})`)
  const content = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const input = msg.usage.input_tokens + (msg.usage.cache_read_input_tokens ?? 0) + (msg.usage.cache_creation_input_tokens ?? 0)
  return {
    content,
    usage: { prompt_tokens: input, completion_tokens: msg.usage.output_tokens, total_tokens: input + msg.usage.output_tokens },
    model: msg.model,
    finishReason: msg.stop_reason ?? 'unknown',
  }
}
