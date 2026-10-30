/**
 * Tách văn bản thuần của một đề (docx/pdf/txt đã qua `/api/extract`) thành câu hỏi của đề online.
 *
 * Nhận dạng theo chữ: "Câu N."/"Bài N.", phương án A. B. C. D. (hoa hoặc thường, "a." "a)"), ý a) b) c) d),
 * "Đáp án: …", "Lời giải: …", bảng đáp án / phần lời giải ở cuối ("Câu 1: a. Câu 11: b.", "1A 2B", bảng Word).
 *
 * Đáp án đúng còn được đoán từ cách đánh dấu ngay trong câu: phương án duy nhất được in đậm / nghiêng /
 * gạch chân / gạch ngang / đổi màu / tô nền (server bọc chữ nổi bật bằng U+E000…U+E001, chỉ với .docx),
 * hoặc có dấu * ✓ ✔ ở đầu hoặc cuối. Nếu cả bốn cùng nổi bật thì bỏ qua (không biết đáp án).
 */
import type { Question, QuestionType } from '@/data/types'
import { formatTrueFalse, normalizeShort, parseTrueFalse } from './grading'
import { newQuestion } from './onlineExam'

const ON = ''
const OFF = ''
const START = /^\s*(Câu|Bài)\s*(\d+)\s*[.:)–-]?\s*(.*)$/i
const SECTION = /^\s*(phần|dạng)\s+[ivx\d]+/i
const TAIL_HEAD = /^\s*(bảng\s+)?(đáp án|hướng dẫn giải|lời giải)[^:：]{0,40}[:：]?\s*$/i
const INLINE_ANS = /^\s*(đáp án|đ\/a|đáp số)\s*[:：.]\s*(.+)$/i
const INLINE_SOL = /^\s*(lời giải|hướng dẫn giải|giải thích)\s*[:：.]?\s*(.*)$/i
const NUMERIC = /^[-+]?\d+([.,]\d+)?$/
const TAG = /^[*✓✔]\s*/
const TAG_END = /\s*(?:[*✓✔]|\(\*\))\s*$/
/** nhãn phương án: "A." "A)" "a." "a)" ở đầu dòng hoặc sau khoảng trắng */
const MARK = /(^|\s)([A-Da-d])([.)])\s*/g

/** Một dòng chữ kèm mặt nạ: ký tự nào nằm trong vùng nổi bật. */
interface Line {
  text: string
  mask: boolean[]
}

function readLine(raw: string): Line {
  let text = ''
  const mask: boolean[] = []
  let on = false
  for (const ch of raw.replace(new RegExp(`${OFF}(\\s*)${ON}`, 'g'), '$1')) {
    if (ch === ON) on = true
    else if (ch === OFF) on = false
    else for (const unit of ch) { text += unit; mask.push(on) }
  }
  return trimLine({ text, mask })
}

/** Cắt khoảng trắng hai đầu và số trang dính đầu dòng ("1d. …", "3Câu 13") do đề chuyển từ PDF. */
function trimLine(l: Line): Line {
  let from = l.text.length - l.text.trimStart().length
  const page = l.text.slice(from).match(/^\d{1,3}(?=(?:Câu|Bài)\s*\d|[A-Da-d][.)]\s)/i)
  if (page) from += page[0].length
  const text = l.text.slice(from).trimEnd()
  return { text, mask: l.mask.slice(from, from + text.length) }
}

const sectionType = (line: string): QuestionType | null => {
  const s = line.toLowerCase()
  if (s.length > 200 || START.test(line)) return null
  if (s.includes('đúng') && s.includes('sai')) return 'dung-sai'
  if (s.includes('trả lời ngắn')) return 'tra-loi-ngan'
  if (s.includes('trắc nghiệm')) return 'trac-nghiem'
  if (s.includes('tự luận')) return 'tu-luan'
  return null
}

interface Opt {
  key: string
  text: string
  paren: boolean
  /** được đánh dấu là đúng: dấu * ✓ hoặc chữ nổi bật */
  star: boolean
  emph: boolean
}

/** Tách "A. x B. y …" thành các phương án; null nếu dòng không mở đầu bằng nhãn. */
function splitOptions(line: Line): Opt[] | null {
  const lead = line.text.match(TAG)?.[0].length ?? 0
  const text = line.text.slice(lead)
  const mask = line.mask.slice(lead)
  const marks: RegExpMatchArray[] = []
  for (const m of text.matchAll(MARK)) {
    const prev = marks.at(-1)
    const lower = m[2] === m[2].toLowerCase()
    // nhãn thường ("a.") giữa dòng chỉ tính khi đúng thứ tự sau nhãn trước, tránh cắt nhầm câu văn
    if (prev && lower && m[2].charCodeAt(0) !== prev[2].charCodeAt(0) + 1) continue
    marks.push(m)
  }
  if (!marks.length || marks[0].index! + marks[0][1].length !== 0) return null
  return marks.map((m, i) => {
    const from = m.index! + m[0].length
    const to = i + 1 < marks.length ? marks[i + 1].index! : text.length
    let seg = text.slice(from, to)
    const tail = seg.match(TAG_END)
    const letters = [...seg].map((c, j) => ({ c, on: mask[from + j] })).filter((x) => /\S/.test(x.c))
    const share = letters.length ? letters.filter((x) => x.on).length / letters.length : 0
    if (tail) seg = seg.slice(0, tail.index)
    return {
      key: m[2],
      text: seg.trim(),
      paren: m[3] === ')',
      star: Boolean(tail) || (i === 0 && lead > 0),
      emph: share >= 0.6 && letters.length >= 1,
    }
  })
}

/** Đáp án từ phần cuối: "Câu 1: B …", "1.A 2.B", nhiều cặp một dòng, hoặc bảng (ô "Câu" 1 2 3 rồi "Đáp án" A B C). */
function parseTail(lines: string[]) {
  const answers = new Map<string, string>()
  const solutions = new Map<string, string>()
  let cur = ''
  let mode: 'nums' | 'ans' | null = null
  let nums: string[] = []
  let ans: string[] = []
  for (const line of lines) {
    if (/^câu$/i.test(line)) { mode = 'nums'; nums = []; ans = []; continue }
    if (/^đáp án$/i.test(line)) { mode = 'ans'; continue }
    if (mode === 'nums' && /^\d+$/.test(line)) { nums.push(line); continue }
    if (mode === 'ans' && nums.length && !START.test(line)) {
      ans.push(line.trim())
      if (ans.length === nums.length) { nums.forEach((n, i) => answers.set(`c${n}`, ans[i])); mode = null }
      continue
    }
    mode = null
    const pairs = [...line.matchAll(/(?:Câu\s*)?(\d+)\s*[.\-:)]?\s*([A-Da-d])(?![\p{L}\d])[.,;]?/giu)]
    const rest = pairs.reduce((s, p) => s.replace(p[0], ''), line).replace(/[\s.,;|-]/g, '')
    if (pairs.length && (pairs.length >= 2 || !START.test(line)) && !rest) {
      pairs.forEach((p) => answers.set(`c${p[1]}`, p[2].toUpperCase()))
      continue
    }
    const m = line.match(START)
    if (m) {
      cur = (m[1].toLowerCase() === 'bài' ? 'b' : 'c') + m[2]
      const rest2 = m[3].trim()
      const lead = rest2.match(/^([A-D]|[ĐS]{2,6}|[-+]?\d+(?:[.,]\d+)?)\b[.:)]?\s*(.*)$/i)
      if (lead) { answers.set(cur, lead[1]); if (lead[2]) solutions.set(cur, lead[2]) } else solutions.set(cur, rest2)
    } else if (cur && line.trim()) solutions.set(cur, `${solutions.get(cur) ?? ''}\n${line.trim()}`.trim())
  }
  return { answers, solutions }
}

interface Raw {
  tag: string
  head: string
  hint: QuestionType | null
  lines: Line[]
}

export interface ParsedExam {
  questions: Question[]
  /** số câu chưa tìm thấy đáp án */
  noAnswer: number
  /** số câu không có đề bài bằng chữ (đề bài là ảnh) */
  noPrompt: number
}

const IMAGE_PROMPT = '(Đề bài là hình ảnh trong file, chưa đọc được. Hãy nhập lại đề bài.)'

export function parseExamText(text: string): ParsedExam {
  const lines = text.split(/\r?\n/).map(readLine).filter((l) => l.text)
  // đề không có "Câu N." (hay gặp ở đề chuyển từ PDF, đề bài là ảnh): cứ một bộ phương án là một câu
  const bare = !lines.some((l) => START.test(l.text))
  const raws: Raw[] = []
  let hint: QuestionType | null = null
  let tailAt = lines.length
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (raws.length && TAIL_HEAD.test(line.text)) { tailAt = i + 1; break }
    const m = line.text.match(START)
    if (m) {
      raws.push({ tag: (m[1].toLowerCase() === 'bài' ? 'b' : 'c') + m[2], head: m[3], hint, lines: [] })
      continue
    }
    if (SECTION.test(line.text)) { hint = sectionType(line.text) ?? hint; continue } // tiêu đề phần không thuộc câu nào
    if (!raws.length) hint = sectionType(line.text) ?? hint
    if (bare) {
      const opts = splitOptions(line)
      if (opts) {
        const cur = raws.at(-1)
        const keys = new Set(cur?.lines.flatMap((x) => splitOptions(x)?.map((o) => o.key.toUpperCase()) ?? []))
        if (!cur || keys.size >= 4 || opts.some((o) => keys.has(o.key.toUpperCase()))) {
          raws.push({ tag: `c${raws.length + 1}`, head: '', hint, lines: [] })
        }
      } else if (!raws.length) continue
    }
    raws.at(-1)?.lines.push(line)
  }
  const tail = parseTail(lines.slice(tailAt).map((l) => l.text))

  const questions = raws.map((r): Question => {
    const pts = r.head.match(/^\(\s*(\d+(?:[.,]\d+)?)\s*điểm\s*\)\s*[.:]?\s*/i)
    const head = r.head.slice(pts?.[0].length ?? 0)
    const prompt: string[] = head ? [head] : []
    const optLines: string[] = []
    const options: Opt[] = []
    let inline: string | undefined
    let solution: string | undefined
    for (const line of r.lines) {
      const a = line.text.match(INLINE_ANS)
      const s = line.text.match(INLINE_SOL)
      const opts = solution === undefined ? splitOptions(line) : null
      if (a) inline = a[2].trim()
      else if (s) solution = s[2]
      else if (solution !== undefined) solution += `\n${line.text}`
      else if (opts) { options.push(...opts); optLines.push(line.text) }
      else if (options.length) options[options.length - 1].text += ` ${line.text}`
      else prompt.push(line.text)
    }
    const raw = inline ?? tail.answers.get(r.tag)
    const lower = options.filter((o) => o.key === o.key.toLowerCase())
    const upper = options.filter((o) => o.key !== o.key.toLowerCase())
    const letterAns = /^\s*[A-D]\b/i.test(raw ?? '')
    // "a) b) c) d)" là các ý đúng/sai, trừ khi tiêu đề phần hay đáp án (một chữ cái) cho biết đó là trắc nghiệm
    const tf =
      lower.length >= 2 && lower.every((o) => o.paren) && r.tag[0] === 'c' &&
      r.hint !== 'tu-luan' && r.hint !== 'trac-nghiem' && (r.hint === 'dung-sai' || !letterAns)
    const lowerMcq = lower.length >= 2 && !tf && r.tag[0] === 'c' && r.hint !== 'tu-luan'
    const mcq = upper.length >= 2 ? upper : lowerMcq ? lower : []
    const type: QuestionType = tf
      ? 'dung-sai'
      : mcq.length
        ? 'trac-nghiem'
        : r.hint === 'tra-loi-ngan'
          ? 'tra-loi-ngan'
          : 'tu-luan'
    // tự luận: "a) …" là ý nhỏ của đề bài, không phải phương án
    if (type === 'tu-luan') prompt.push(...optLines)
    const q = newQuestion(type, prompt.join('\n') || (bare && options.length ? IMAGE_PROMPT : ''))
    if (pts) q.points = Number(pts[1].replace(',', '.'))
    if (type === 'trac-nghiem') {
      q.options = mcq
        .map((o) => ({ key: o.key.toUpperCase(), text: o.text }))
        .sort((x, y) => x.key.localeCompare(y.key))
      const letter = raw?.match(/^\s*([A-D])\b/i)?.[1].toUpperCase()
      // không có đáp án ghi bằng chữ: lấy phương án duy nhất được đánh dấu (dấu * ưu tiên hơn chữ nổi bật)
      const starred = mcq.filter((o) => o.star)
      const picked = starred.length ? starred : mcq.filter((o) => o.emph)
      if (letter) q.answer = letter
      else if (picked.length === 1) q.answer = picked[0].key.toUpperCase()
    } else if (type === 'dung-sai') {
      q.options = lower.map((o) => ({ key: o.key, text: o.text }))
      const tfAns = parseTrueFalse(raw, lower.length)
      if (tfAns) q.answer = formatTrueFalse(tfAns)
      else {
        // ý được đánh dấu là đúng, ý còn lại sai; chỉ tin khi có đánh dấu không phủ hết các ý
        const marked = lower.map((o) => o.star || o.emph)
        const n = marked.filter(Boolean).length
        if (n > 0 && n < lower.length) q.answer = formatTrueFalse(marked)
      }
    } else if (type === 'tra-loi-ngan') {
      const n = normalizeShort(raw)
      if (NUMERIC.test(n.replace(',', '.'))) q.answer = n
    }
    const expl = (solution ?? tail.solutions.get(r.tag))?.trim()
    if (type === 'tu-luan') {
      const out = [raw, expl].filter((x): x is string => Boolean(x))
      if (out.length) q.solution = out.join('\n').split('\n')
    } else if (expl) q.explanation = expl
    return q
  })
  return {
    questions,
    noAnswer: questions.filter((q) => q.type !== 'tu-luan' && !q.answer).length,
    noPrompt: questions.filter((q) => q.prompt === IMAGE_PROMPT).length,
  }
}
