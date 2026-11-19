/**
 * Đo hội thoại 2 lượt cho panel hỏi lại (trường hợp #2 và #3):
 *   Lượt 1: yêu cầu mơ hồ ("soạn đề đi") → AI trả {"action":"ask",...}
 *   Lượt 2: trả lời (Toán lớp 9, 1 tiết, có hình, còn lại bỏ trống → ASK_DEFAULT) → AI soạn đề
 * Dựng lịch sử giống hệt `historyOf` và `askAnswerText` trong AiPanel / AiAskPanel.
 */
import '../lib/forceModel'
import { ASK_ONLY_SYSTEM, buildExamSystem } from '@/lib/prompts/exam'
import { askAnswerText, askHistoryText, needsAskFirst, parseAsk, type AiAskQuestion } from '@/examEditor/AiAskPanel'
import { callLlm, extractJson, type LlmMessage } from '@/lib/llm'

interface CallUsage {
  prompt: number
  completion: number
  reasoning: number
  total: number
  cached: number
}

const usages: CallUsage[] = []
const realFetch = window.fetch.bind(window)
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const res = await realFetch(...args)
  if (String(args[0]).includes('/api/llm')) {
    void res.clone().json().then((j: {
      usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
        prompt_cache_hit_tokens?: number
        prompt_tokens_details?: { cached_tokens?: number }
        completion_tokens_details?: { reasoning_tokens?: number }
      }
    }) => {
      const u = j.usage
      if (!u) return
      usages.push({
        prompt: u.prompt_tokens ?? 0,
        completion: u.completion_tokens ?? 0,
        reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0,
        total: u.total_tokens ?? ((u.prompt_tokens ?? 0) + (u.completion_tokens ?? 0)),
        cached: u.prompt_cache_hit_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0,
      })
    }).catch(() => {})
  }
  return res
}

const done = (payload: unknown) => {
  document.getElementById('eval-result')!.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

const FIG_MEANING_YES = 'Có — chỉ vẽ hình (figure) cho câu nào phải nhìn hình mới làm được, không ép tỉ lệ câu có hình'
const FIG_Q: AiAskQuestion = { q: 'Đề có cần hình minh hoạ không?', options: ['Có, câu nào cần hình thì vẽ', 'Không cần hình'] }

function pickAnswers(questions: AiAskQuestion[]): string[][] {
  let pickedSubject = false
  let pickedGrade = false
  let pickedType = false
  return questions.map((q) => {
    const text = q.q.toLowerCase()
    if (q === FIG_Q || /minh ho[ạa]|hình vẽ|có hình/.test(text)) {
      return [FIG_MEANING_YES]
    }
    if (!pickedSubject && !pickedGrade && /môn/.test(text) && /lớp|khối/.test(text)) {
      pickedSubject = true
      pickedGrade = true
      return ['Toán lớp 9']
    }
    if (!pickedSubject && /môn/.test(text)) {
      pickedSubject = true
      const hasBoth = q.options.some((o) => /toán/i.test(o) && /9/.test(o))
      if (hasBoth) {
        pickedGrade = true
        return ['Toán lớp 9']
      }
      // AI thường gộp lớp vào câu môn dù câu hỏi chỉ ghi "Môn học?"
      if (!questions.some((x) => /lớp|khối/i.test(x.q))) {
        pickedGrade = true
        return ['Toán lớp 9']
      }
      return ['Toán']
    }
    if (!pickedGrade && /lớp|khối/.test(text)) {
      pickedGrade = true
      return ['Lớp 9']
    }
    if (!pickedType && /dạng|loại|thời gian|thời lượng|kiểm tra|kì thi|hình thức/.test(text)) {
      pickedType = true
      const match = q.options.find((o) => /1\s*tiết|45\s*phút/i.test(o))
      return [match ?? 'Kiểm tra 1 tiết (45 phút)']
    }
    return []
  })
}

async function main() {
  const q = new URLSearchParams(location.search)
  const effort = (q.get('effort') ?? 'low') as 'low' | 'medium' | 'high' | 'max'
  const topic = q.get('topic') ?? 'soạn đề đi'

  // Lượt 1 (#2): yêu cầu mơ hồ
  // như AiPanel: lượt đầu chưa nêu môn thì dùng prompt hỏi ngắn
  // prompt do server ghép từ `task` (đúng đường app chạy); sys1 / sys2 chỉ để báo số ký tự
  const askFirst = needsAskFirst(topic)
  const sys1 = askFirst ? ASK_ONLY_SYSTEM : buildExamSystem({ text: topic, ask: true })
  const t0 = performance.now()
  const res1 = await callLlm([{ role: 'user', content: topic }], {
    reasoningEffort: effort,
    task: askFirst ? { name: 'hoi-truoc' } : { name: 'soan-de', input: { text: topic, ask: true } },
  })
  const ms1 = Math.round(performance.now() - t0)
  await new Promise((r) => setTimeout(r, 200))
  const ask = parseAsk(res1.content)
  if (!ask) {
    done({
      effort,
      topic,
      turn1: { model: res1.model, ms: ms1, usage: usages[0] ?? null, askOk: false, raw: res1.content },
      turn2: null,
    })
    return
  }

  // Chuẩn bị câu trả lời theo đúng AiAskPanel.tsx
  const askedFig = ask.questions.some((x) => /minh ho[ạa]|hình vẽ|có hình/i.test(x.q))
  const questions = !askedFig ? [...ask.questions, FIG_Q] : ask.questions
  const answers = pickAnswers(questions)
  const reply = askAnswerText(questions, answers)

  const askBotText = ask.intro || 'Mình cần biết thêm vài điều trước khi soạn.'
  const history: LlmMessage[] = [
    { role: 'user', content: topic },
    { role: 'assistant', content: `${askBotText}\n${askHistoryText(ask)}` },
  ]

  // Lượt 2 (#3): justAsked = true nên không gửi ASK_RULE
  const sys2 = buildExamSystem({ text: reply })
  const t1 = performance.now()
  const res2 = await callLlm([...history, { role: 'user', content: reply }], {
    reasoningEffort: effort,
    task: { name: 'soan-de', input: { text: reply } },
  })
  const ms2 = Math.round(performance.now() - t1)
  await new Promise((r) => setTimeout(r, 200))

  const ask2 = parseAsk(res2.content)
  let parsed2: unknown = null
  try {
    parsed2 = extractJson(res2.content)
  } catch {
    /* JSON hỏng */
  }

  done({
    effort,
    topic,
    turn1: {
      model: res1.model,
      ms: ms1,
      promptChars: sys1.length,
      usage: usages[0] ?? null,
      askOk: true,
      ask,
      raw: res1.content,
    },
    turn2: {
      model: res2.model,
      ms: ms2,
      promptChars: sys2.length,
      reply,
      history,
      usage: usages[1] ?? null,
      askedAgain: !!ask2,
      raw: res2.content,
      parsed: parsed2,
    },
  })
}

main().catch((err) => done({ fatal: String(err?.stack ?? err) }))
