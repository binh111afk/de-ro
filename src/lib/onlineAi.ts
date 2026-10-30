/**
 * Trợ lý AI trong trình tạo đề online: giáo viên nhờ bằng lời, AI trả JSON các câu hỏi, `sanitizeAiQuestions`
 * chuẩn hoá về `Question` của đề online (cùng quy tắc với `questionIssue`) để thêm thẳng vào đề.
 */
import type { Question } from '@/data/types'
import { TYPE_LABEL } from '@/data/types'
import { formatTrueFalse, normalizeShort, parseTrueFalse } from '@/lib/grading'
import { extractJson } from '@/lib/llm'
import { newQuestion, ONLINE_TYPES, type OnlineMeta } from '@/lib/onlineExam'

export const AI_MAX_QUESTIONS = 30

const SYSTEM =
  'Bạn là trợ lý soạn đề trắc nghiệm online cho giáo viên Việt Nam (THCS/THPT). Khi người dùng nhờ soạn câu hỏi, ' +
  'trả về DUY NHẤT một JSON, không kèm chữ nào ngoài JSON:\n' +
  '{"message":"một câu ngắn về nội dung và mức độ các câu vừa soạn, không nhắc lại số câu","questions":[...]}\n' +
  'Mỗi câu thuộc một trong bốn dạng:\n' +
  '- {"type":"trac-nghiem","prompt":"...","options":["...","...","...","..."],"answer":"A","explanation":"..."} — đúng 4 phương án (không ghi sẵn "A." trong chữ), answer là A, B, C hoặc D.\n' +
  '- {"type":"dung-sai","prompt":"đoạn dẫn","options":["ý a","ý b","ý c","ý d"],"answer":"ĐSĐS","explanation":"..."} — đúng 4 ý, answer là chuỗi 4 ký tự Đ hoặc S theo thứ tự ý.\n' +
  '- {"type":"tra-loi-ngan","prompt":"...","answer":"-3,5","explanation":"..."} — answer là một số, tối đa 4 ký tự kể cả dấu âm và dấu phẩy, dùng dấu phẩy làm dấu thập phân.\n' +
  '- {"type":"tu-luan","prompt":"...","explanation":"đáp án và hướng dẫn chấm gợi ý"}.\n' +
  'Quy tắc: công thức toán, lý, hoá viết bằng LaTeX giữa hai dấu $ (ví dụ $x^2+1$), không dùng markdown khác; ' +
  'kiến thức đúng theo chương trình Việt Nam; đáp án phải đúng; phương án nhiễu hợp lý, không trùng nhau; ' +
  `explanation ngắn gọn nói vì sao đúng; tối đa ${AI_MAX_QUESTIONS} câu mỗi lần; không lặp lại các câu đã có trong đề; phân bố đáp án đúng ngẫu nhiên giữa A, B, C, D. ` +
  'Nếu người dùng chỉ hỏi chung hoặc chào hỏi, không soạn câu nào: trả {"message":"trả lời ngắn","questions":[]}.'

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n) + '…' : t
}

/** Lời dặn hệ thống kèm tóm tắt đề đang soạn (môn, lớp, số câu theo dạng, vài câu gần nhất) để AI soạn tiếp đúng ngữ cảnh. */
export function systemPrompt(meta: OnlineMeta, questions: Question[]): string {
  const counts = ONLINE_TYPES.map((t) => `${questions.filter((q) => (q.type === 'tu-luan-dong' ? 'tu-luan' : q.type) === t).length} ${TYPE_LABEL[t].toLowerCase()}`).join(', ')
  const recent = questions
    .slice(-8)
    .map((q) => `${q.number}. ${clip(q.prompt, 90)}`)
    .join('\n')
  return (
    SYSTEM +
    `\n\nĐề đang soạn: "${meta.title.trim() || 'chưa đặt tên'}" · môn ${meta.subject} · ${meta.grade}. ` +
    (questions.length ? `Hiện có ${questions.length} câu (${counts}).\nCác câu gần nhất:\n${recent}` : 'Chưa có câu nào.')
  )
}

export interface AiAttachment {
  name: string
  text: string
}

const FILE_CHARS = 20_000
const TOTAL_CHARS = 40_000

/** Phần nối vào yêu cầu của giáo viên: nội dung các file đính kèm (mỗi file cắt còn 20k ký tự, tổng 40k để vừa ngữ cảnh). */
export function attachmentsPrompt(files: AiAttachment[]): string {
  let budget = TOTAL_CHARS
  const parts: string[] = []
  for (const f of files) {
    const text = f.text.trim().slice(0, Math.min(FILE_CHARS, budget))
    if (!text) continue
    budget -= text.length
    const cut = text.length < f.text.trim().length ? '\n[…đã cắt bớt phần sau…]' : ''
    parts.push(`[Tài liệu đính kèm: ${f.name}]\n${text}${cut}`)
  }
  return parts.length
    ? '\n\nGiáo viên đính kèm tài liệu sau. Dùng làm nguồn nội dung cho các câu hỏi (nếu là đề có sẵn thì soạn lại hoặc bổ sung theo yêu cầu, không chép nguyên), chỉ soạn theo đúng yêu cầu ở trên.\n\n' +
        parts.join('\n\n')
    : ''
}

const asString = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '').trim()

/** "A. nội dung" / "A) nội dung" → "nội dung" (AI đôi khi vẫn ghi sẵn nhãn). */
const stripLabel = (s: string) => s.replace(/^\s*[A-Da-d][.)]\s+/, '').trim()

function optionTexts(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((o) => stripLabel(asString(typeof o === 'object' && o ? (o as { text?: unknown }).text : o)))
}

/** Chữ cái đáp án: "B", "b.", "Đáp án B", hoặc đúng nguyên văn một phương án. */
function choiceKey(answer: string, texts: string[]): string {
  const m = /^(?:đáp án\s*)?([A-D])\b/i.exec(answer.trim())
  if (m) return m[1].toUpperCase()
  const i = texts.findIndex((t) => t && t === stripLabel(answer))
  return i >= 0 ? 'ABCD'[i] : ''
}

/** Phương án kiểu "cả A và B đều đúng" phụ thuộc thứ tự, xáo sẽ sai nghĩa. */
const ORDER_DEPENDENT = /\b(cả|tất cả|các phương án|đều (đúng|sai))\b|\b[A-D]\s*(và|,)\s*[A-D]\b/i

/** Model hay đặt đáp án đúng ở A: xáo thứ tự phương án (theo dõi đáp án đúng) để đáp án phân bố đều. */
function shuffleChoices(q: Question, rng: () => number) {
  const opts = q.options!
  if (!q.answer || opts.some((o) => ORDER_DEPENDENT.test(o.text))) return
  const order = opts.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const keys = opts.map((o) => o.key)
  const correct = order.indexOf('ABCD'.indexOf(q.answer))
  q.options = order.map((from, i) => ({ key: keys[i], text: opts[from].text }))
  q.answer = keys[correct]
}

function addExplanation(q: Question, r: Record<string, unknown>) {
  const e = asString(r.explanation ?? r.solution)
  if (e) q.explanation = e
}

/** Chuẩn hoá phản hồi của AI thành câu hỏi đề online. Câu sai dạng hoặc không có đề bài bị bỏ; câu thiếu đáp án vẫn giữ để giáo viên bổ sung. */
export function sanitizeAiQuestions(raw: unknown, rng: () => number = Math.random): Question[] {
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as { questions?: unknown })?.questions) ? (raw as { questions: unknown[] }).questions : []
  const out: Question[] = []
  for (const item of list.slice(0, AI_MAX_QUESTIONS)) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const type = asString(r.type)
    const prompt = asString(r.prompt)
    if (!prompt) continue
    if (type === 'trac-nghiem' || type === 'dung-sai') {
      const texts = optionTexts(r.options)
      if (texts.length < 4 || texts.slice(0, 4).some((t) => !t)) continue
      const q = newQuestion(type, prompt)
      q.options = q.options!.map((o, i) => ({ ...o, text: texts[i] }))
      if (type === 'trac-nghiem') {
        q.answer = choiceKey(asString(r.answer), texts)
        shuffleChoices(q, rng)
      } else {
        const given = Array.isArray(r.answer) ? r.answer.map((b) => (b === true || /^(đ|đúng|true)$/i.test(asString(b)) ? 'Đ' : 'S')).join('') : asString(r.answer)
        const tf = parseTrueFalse(given, 4)
        q.answer = tf ? formatTrueFalse(tf) : ''
      }
      addExplanation(q, r)
      out.push(q)
    } else if (type === 'tra-loi-ngan') {
      const q = newQuestion(type, prompt)
      const a = normalizeShort(asString(r.answer))
      q.answer = /^[-+]?\d+(,\d+)?$/.test(a) && a.length <= 4 ? a.replace(/^\+/, '') : ''
      addExplanation(q, r)
      out.push(q)
    } else if (type === 'tu-luan') {
      const q = newQuestion(type, prompt)
      addExplanation(q, r)
      out.push(q)
    }
  }
  return out
}

/** Đọc phản hồi của AI: `message` là lời nhắn, `questions` là các câu đã chuẩn hoá. Không phải JSON thì coi cả phản hồi là lời nhắn. */
export function parseAiReply(content: string, rng?: () => number): { message: string; questions: Question[] } {
  try {
    const raw = extractJson<{ message?: unknown; questions?: unknown }>(content)
    return { message: asString(raw.message), questions: sanitizeAiQuestions(raw, rng) }
  } catch {
    return { message: content.trim().slice(0, 600), questions: [] }
  }
}
