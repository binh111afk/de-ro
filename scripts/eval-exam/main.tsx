/**
 * Sinh đề THẬT bằng đúng prompt của AiPanel ở một mức suy luận (`?effort=`), đếm token
 * do gateway trả về. `eval-exam.mjs` đọc kết quả để so chất lượng giữa các mức.
 */
import { examSystemPrompt } from '@/examEditor/AiPanel'
import { callLlm, extractJson } from '@/lib/llm'

const tokens = { calls: 0, prompt: 0, completion: 0, reasoning: 0 }
const realFetch = window.fetch.bind(window)
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const res = await realFetch(...args)
  if (String(args[0]).includes('/api/llm')) {
    void res.clone().json().then((j: { usage?: { prompt_tokens?: number; completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } } }) => {
      const u = j.usage
      if (!u) return
      tokens.calls++
      tokens.prompt += u.prompt_tokens ?? 0
      tokens.completion += u.completion_tokens ?? 0
      tokens.reasoning += u.completion_tokens_details?.reasoning_tokens ?? 0
    }).catch(() => {})
  }
  return res
}

const done = (payload: unknown) => {
  document.getElementById('eval-result')!.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

async function main() {
  const q = new URLSearchParams(location.search)
  const effort = (q.get('effort') ?? 'max') as 'low' | 'medium' | 'high' | 'max'
  const topic = q.get('topic') ?? 'Tạo đề thi tốt nghiệp THPT môn Toán theo đúng cấu trúc đề tham khảo 2025, có đáp án.'
  const t0 = performance.now()
  const res = await callLlm(
    [
      { role: 'system', content: examSystemPrompt() },
      { role: 'user', content: topic },
    ],
    { reasoningEffort: effort },
  )
  await new Promise((r) => setTimeout(r, 300))
  let parsed: unknown = null
  try {
    parsed = extractJson(res.content)
  } catch {
    /* JSON hỏng */
  }
  done({ effort, model: res.model, ms: Math.round(performance.now() - t0), tokens, raw: res.content, parsed })
}

main().catch((err) => done({ fatal: String(err?.stack ?? err) }))
