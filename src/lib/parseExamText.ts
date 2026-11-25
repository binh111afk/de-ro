/**
 * Tách văn bản thuần của một đề (docx/pdf/txt đã qua `/api/extract`) thành câu hỏi của đề online.
 *
 * Nhận dạng theo chữ: "Câu N."/"Bài N."/"Question N."/"N.", phương án A. A) (A) A/ a. a), ý a) b) c) d),
 * "Đáp án: …", "Đáp án …", "Chọn …", bảng đáp án (ngang, dọc 2/4 cột, bảng 6 cột Đúng/Sai) và phần lời giải.
 *
 * Đáp án đúng còn được đoán từ bitmask nhấn mạnh (màu, tô nền, gạch chân, đậm, gạch ngang, nghiêng;
 * server bọc chữ nổi bật bằng U+E000 hoặc U+E011..U+E04F tới U+E001), hoặc ký hiệu * ✓ ✔ (*), [B].
 */
import type { Question, QuestionType } from '@/data/types'
import { formatTrueFalse, normalizeShort, parseTrueFalse } from './grading.js'

const DEFAULT_POINTS: Record<string, number> = { 'trac-nghiem': 0.25, 'dung-sai': 1, 'tra-loi-ngan': 0.25, 'tu-luan': 1 }
const qid = () => Math.random().toString(36).slice(2, 10)
function makeQuestion(type: QuestionType, prompt = ''): Question {
  const q: Question = { id: qid(), number: 0, type, prompt, points: DEFAULT_POINTS[type] ?? 1 }
  if (type === 'trac-nghiem') q.options = ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' }))
  if (type === 'dung-sai') q.options = ['a', 'b', 'c', 'd'].map((key) => ({ key, text: '' }))
  return q
}

const ON = '\uE000'
const OFF = '\uE001'
/** token vị trí ảnh nhúng do server chèn vào text: U+E002 <chỉ số> U+E003 (chỉ số tra trong mảng `images`) */
const IMG_SPLIT = /\uE002(\d+)\uE003/
const CELL_SEP = '\uE005'
const ROW_MARK = '\uE006'

const BIT_BOLD = 1
const BIT_ITALIC = 2
const BIT_UNDERLINE = 4
const BIT_COLOR = 8
const BIT_HIGHLIGHT = 16
const BIT_STRIKE = 32
const EMPH_PRIORITY = [BIT_COLOR, BIT_HIGHLIGHT, BIT_UNDERLINE, BIT_BOLD, BIT_STRIKE, BIT_ITALIC]

const START = /^\s*(Câu|Bài|Question)\s*(\d+)\s*(?:[.:)–-]\s*|\s+)(.*)$/i
const NUM_START = /^\s*(\d{1,3})\s*[.)]\s+(\S.*)$/
const SECTION = /^\s*(?:(?:phần|dạng)\s+[ivx\d]+|(?:[IVX]{1,4}|[A-D])\s*[.)]\s*(?:câu\s+)?(?:trắc nghiệm|đúng[\s/]*sai|trả lời ngắn|tự luận)\b)/i
const TAIL_HEAD = /^\s*(?:bảng\s+)?(?:đáp án(?:\s+(?:chi tiết|tham khảo|đề\s*\d+|và\s+(?:hướng dẫn\s+)?(?:giải|chấm)))?|hướng dẫn\s+(?:giải|chấm)|lời\s+giải(?:\s+chi tiết)?)\s*[:：]?\s*$/iu
const INLINE_ANS = /^\s*(?:(?:=>|->|→)\s*)?(?:đáp\s+án(?:\s+đúng)?|đ\/a|đa|đáp\s+số|key|(?:=>|->|→)\s*chọn|chọn(?=\s+(?:[A-D]\s*$|đáp\s+án\s+[A-D])))\s*(?:[:：.]|\s+(?=(?:[A-D](?![\p{L}\d])|[ĐS]{2,6}|[DTF](?:\s*[-,/]\s*[STF]){1,5}|[-+]?\d)))[\s:：.]*(.+)$/iu
const INLINE_SOL = /^\s*(lời giải|hướng dẫn giải|giải thích)\s*[:：.]?\s*(.*)$/i
const EXAM_END = /^\s*(?:-+\s*HẾT\s*-*|HẾT\s*!?|Thí sinh không được sử dụng tài liệu|Giám thị không giải thích)/i
const BOX_NOTE = /^\s*(?:Lưu ý|Ghi chú|Chú ý)\s*(?:trong\s+\w+\s*)?:/i
const PASSAGE_HEAD = /^\s*(?:Read\s+the\s+(?:following|next)\s+passage|Đọc\s+(?:đoạn\s+(?:văn|trích|thông tin)|văn bản)\s+(?:sau|dưới đây)|Dựa\s+vào\s+(?:đoạn\s+thông tin|bảng|đoạn\s+trích)\s+sau)\b/i
const NUMERIC = /^[-+]?\d+([.,]\d+)?$/
const TAG = /^[*✓✔]\s*/
const TAG_END = /\s*(?:[*✓✔]|\(\*\))\s*$/
const TF_INLINE_TAG = /\s*\(\s*(Đ|ĐÚNG|S|SAI)\s*\)\s*$/iu
/**
 * Nhãn phương án: A. A) *B. B*. B.* (A) A/ [B]. [B] a. a).
 * Dùng lookbehind `(?<=^|\s)` để phương án rỗng (`A. \tB. `) không ăn mất dấu ngăn cách của phương án sau.
 */
const MARK = /(?<=^|\s)(?:(\*)?\[([A-D])\]\.?|(\*)?\(([A-D])\)|(\*)?([A-D])\/(?=\s|$)|(\*)?([A-Da-d])(\*)?([.)])(\*)?)[ \t]*/g

/** Một dòng chữ kèm bitmask nhấn mạnh trên từng ký tự và ảnh nhúng (cùng các ô nếu là dòng bảng). */
interface Line {
  text: string
  mask: number[]
  /** ảnh nhúng trong dòng: `at` là vị trí trong `text` (ảnh nằm trước ký tự thứ `at`), `idx` là chỉ số ảnh */
  imgs: Array<{ at: number; idx: number }>
  cells?: Line[]
}

function readCellLine(raw: string): Line {
  let text = ''
  const mask: number[] = []
  const imgs: Line['imgs'] = []
  let curMask = 0
  const parts = raw.split(IMG_SPLIT)
  parts.forEach((part, i) => {
    if (i % 2) { imgs.push({ at: text.length, idx: Number(part) }); return }
    for (const ch of part) {
      const code = ch.charCodeAt(0)
      if (ch === ON) curMask = BIT_BOLD
      else if (ch === OFF) curMask = 0
      else if (code >= 0xe011 && code <= 0xe04f) curMask = code - 0xe010
      else {
        for (const unit of ch) { text += unit; mask.push(curMask) }
      }
    }
  })
  return trimLine({ text, mask, imgs })
}

function readLine(raw: string): Line {
  if (raw.startsWith(ROW_MARK)) {
    const cells = raw.slice(1).split(CELL_SEP).map(readCellLine)
    return {
      text: cells.map((c) => c.text).join(' | '),
      mask: [],
      imgs: cells.flatMap((c) => c.imgs),
      cells,
    }
  }
  return readCellLine(raw)
}

/** Cắt khoảng trắng hai đầu và số trang dính đầu dòng ("1d. …", "3Câu 13") do đề chuyển từ PDF. */
function trimLine(l: Line): Line {
  let from = l.text.length - l.text.trimStart().length
  const page = l.text.slice(from).match(/^\d{1,3}(?=(?:Câu|Bài|Question)\s*\d|[A-Da-d][.)]\s)/i)
  if (page) from += page[0].length
  const text = l.text.slice(from).trimEnd()
  return {
    text,
    mask: l.mask.slice(from, from + text.length),
    imgs: l.imgs.map((im) => ({ idx: im.idx, at: Math.min(text.length, Math.max(0, im.at - from)) })),
  }
}

const sectionType = (line: string): QuestionType | null => {
  const s = line.toLowerCase()
  if (s.length > 200 || START.test(line)) return null
  if (s.includes('đúng') && s.includes('sai')) return 'dung-sai'
  if (s.includes('trả lời ngắn')) return 'tra-loi-ngan'
  if (s.includes('trắc nghiệm') || s.includes('nhiều phương án')) return 'trac-nghiem'
  if (s.includes('tự luận')) return 'tu-luan'
  return null
}

function maskSummary(masks: number[], chars: string[]): number {
  const nonSpace = chars.map((c, i) => ({ c, m: masks[i] ?? 0 })).filter((x) => /\S/.test(x.c))
  if (!nonSpace.length) return 0
  let out = 0
  for (const bit of [BIT_BOLD, BIT_ITALIC, BIT_UNDERLINE, BIT_COLOR, BIT_HIGHLIGHT, BIT_STRIKE]) {
    if (nonSpace.filter((x) => (x.m & bit) !== 0).length / nonSpace.length >= 0.6) out |= bit
  }
  return out
}

interface Opt {
  key: string
  text: string
  paren: boolean
  dot: boolean
  bracket: boolean
  /** được đánh dấu là đúng: dấu * ✓ ✔ */
  star: boolean
  /** bitmask nhấn mạnh trên nhãn ("B.") và trên phần nội dung */
  labelMask: number
  bodyMask: number
}

/** Tách "A. x B. y …" thành các phương án; null nếu dòng không mở đầu bằng nhãn. */
function splitOptions(line: Line, images: string[] = []): Opt[] | null {
  if (line.cells) return splitTableOptions(line.cells, images)
  const lead = line.text.match(TAG)?.[0].length ?? 0
  const text = line.text.slice(lead)
  const mask = line.mask.slice(lead)
  const imgs = line.imgs.map((im) => ({ ...im, at: im.at - lead }))
  const marks: Array<{
    index: number
    length: number
    labelLen: number
    key: string
    paren: boolean
    dot: boolean
    bracket: boolean
    star: boolean
  }> = []
  for (const m of text.matchAll(MARK)) {
    const key = m[2] ?? m[4] ?? m[6] ?? m[8]
    if (!key) continue
    const lower = key === key.toLowerCase()
    const prev = marks.at(-1)
    if (prev && lower && key.charCodeAt(0) !== prev.key.charCodeAt(0) + 1) continue
    const rawMatch = m[0]
    const labelLen = rawMatch.replace(/[ \t]+$/, '').length
    const paren = Boolean(m[4]) || m[10] === ')'
    const dot = Boolean(m[2]) || Boolean(m[6]) || m[10] === '.'
    const bracket = Boolean(m[2])
    const star = Boolean(m[1] || m[3] || m[5] || m[7] || m[9] || m[11])
    marks.push({ index: m.index!, length: rawMatch.length, labelLen, key, paren, dot, bracket, star })
  }
  if (!marks.length || marks[0].index !== 0) return null
  return marks.map((m, i) => {
    const from = m.index + m.length
    const to = i + 1 < marks.length ? marks[i + 1].index : text.length
    let seg = text.slice(from, to)
    const bodyMasks = mask.slice(from, to)
    const tail = seg.match(TAG_END)
    const bodyMask = maskSummary(bodyMasks, [...seg])
    const labelMask = maskSummary(mask.slice(m.index, m.index + m.labelLen), [...text.slice(m.index, m.index + m.labelLen)])
    if (tail) seg = seg.slice(0, tail.index)
    let optText = seg.trim()
    if (!optText) {
      const im = imgs.find((x) => x.at >= m.index && (i + 1 < marks.length ? x.at <= marks[i + 1].index : true))
      if (im && im.idx in images) optText = `![Hình ${m.key}](${images[im.idx]})`
    }
    return {
      key: m.key,
      text: optText,
      paren: m.paren,
      dot: m.dot,
      bracket: m.bracket,
      star: m.star || Boolean(tail) || (i === 0 && lead > 0),
      labelMask,
      bodyMask,
    }
  })
}

const STANDALONE_LABEL = /^\s*(?:(\*)?\[([A-D])\]\.?|(\*)?\(([A-D])\)|(\*)?([A-D])\/|(\*)?([A-Da-d])(\*)?([.)])(\*)?)\s*$/

/** Bảng phương án: hoặc dạng `| A. 1 | B. 2 |`, hoặc dạng tách ô `| A. | 5 | B. | 6 |`. */
function splitTableOptions(cells: Line[], images: string[]): Opt[] | null {
  const nonEmpty = cells.filter((c) => c.text.trim() || c.imgs.length)
  if (nonEmpty.length < 2) return null
  // Dạng tách nhãn và nội dung: | A. | 5 | B. | 6 |
  if (cells.length >= 4 && cells.length % 2 === 0) {
    let pairsOk = true
    const paired: Opt[] = []
    for (let i = 0; i < cells.length; i += 2) {
      const lm = cells[i].text.match(STANDALONE_LABEL)
      if (!lm) { pairsOk = false; break }
      const key = lm[2] ?? lm[4] ?? lm[6] ?? lm[8]
      const val = cells[i + 1]
      const tail = val.text.match(TAG_END)
      let seg = tail ? val.text.slice(0, tail.index) : val.text
      let optText = seg.trim()
      if (!optText && val.imgs[0] && val.imgs[0].idx in images) {
        optText = `![Hình ${key}](${images[val.imgs[0].idx]})`
      }
      paired.push({
        key,
        text: optText,
        paren: Boolean(lm[4]) || lm[10] === ')',
        dot: Boolean(lm[2]) || Boolean(lm[6]) || lm[10] === '.',
        bracket: Boolean(lm[2]),
        star: Boolean(lm[1] || lm[3] || lm[5] || lm[7] || lm[9] || lm[11] || tail),
        labelMask: maskSummary(cells[i].mask, [...cells[i].text]),
        bodyMask: maskSummary(val.mask, [...val.text]),
      })
    }
    if (pairsOk && paired.length >= 2) return paired
  }
  // Dạng mỗi ô là một phương án đầy đủ: | A. 1 | B. 2 |
  const out: Opt[] = []
  for (const c of nonEmpty) {
    const parsed = splitOptions({ ...c, cells: undefined }, images)
    if (!parsed) return null
    out.push(...parsed)
  }
  return out.length >= 2 ? out : null
}

/** Chọn phương án duy nhất được đánh dấu bằng bitmask (ưu tiên nội dung trước nhãn, và màu/gạch chân trước đậm/nghiêng). */
function pickByEmphasis(opts: Opt[]): Opt | undefined {
  for (const field of ['bodyMask', 'labelMask'] as const) {
    for (const bit of EMPH_PRIORITY) {
      const hits = opts.filter((o) => (o[field] & bit) !== 0)
      if (hits.length === 1) return hits[0]
    }
  }
  return undefined
}

function normalizeFraction(raw: string): string | null {
  const m = raw.trim().match(/^(-?\d+)\s*\/\s*(\d+)$/)
  if (!m) return null
  const num = Number(m[1])
  const den = Number(m[2])
  if (!den) return null
  const v = num / den
  if (!Number.isFinite(v)) return null
  for (const scale of [1, 10, 100, 1000]) {
    if (Math.abs(Math.round(v * scale) - v * scale) < 1e-9) {
      return String(Math.round(v * scale) / scale).replace('.', ',')
    }
  }
  return null
}

function parseShortValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const s = raw.trim()
  const frac = normalizeFraction(s)
  if (frac) return frac
  const numUnit = s.match(/^([-+]?\d+(?:[.,]\d+)?)(?:\s+[a-zA-Z°%µμ²³\\/]+(?:\s*[a-zA-Z²³\\/]*)*)?$/i)
  if (numUnit) return normalizeShort(numUnit[1])
  const n = normalizeShort(s)
  return NUMERIC.test(n.replace(',', '.')) ? n : undefined
}

interface TailData {
  byTag: Map<string, string[]>
  byTypedTag: Map<string, string[]>
  solutions: Map<string, string>
}

/** Đáp án từ phần cuối: "Câu 1: B …", "1.A 2.B", nhiều cặp một dòng, bảng ngang/dọc, bảng 6 cột Đúng/Sai. */
function parseTail(lines: Line[]): TailData {
  const byTag = new Map<string, string[]>()
  const byTypedTag = new Map<string, string[]>()
  const solutions = new Map<string, string>()
  let cur = ''
  let tailHint: QuestionType | null = null
  let mode: 'nums' | 'ans' | null = null
  let nums: string[] = []
  let ans: string[] = []
  let horizNums: string[] = []
  let tfCols = 0

  const addAns = (tag: string, val: string) => {
    const v = val.trim()
    if (!v) return
    byTag.set(tag, [...(byTag.get(tag) ?? []), v])
    if (tailHint) byTypedTag.set(`${tailHint}:${tag}`, [...(byTypedTag.get(`${tailHint}:${tag}`) ?? []), v])
  }

  for (const rawLine of lines) {
    if (rawLine.cells) {
      mode = null
      const cells = rawLine.cells.map((c) => c.text.trim())
      // Bảng Đúng/Sai 6 cột của web: Câu | a) | b) | c) | d)
      if (/^câu$/i.test(cells[0]) && cells.slice(1).filter((c) => /^[a-d][.)]?$/i.test(c)).length >= 2) {
        tfCols = cells.slice(1).filter((c) => /^[a-d][.)]?$/i.test(c)).length
        horizNums = []
        continue
      }
      if (tfCols > 0 && /^\d+$/.test(cells[0])) {
        const vals = cells.slice(1, 1 + tfCols).join('')
        if (parseTrueFalse(vals, tfCols)) {
          tailHint = 'dung-sai'
          addAns(`c${Number(cells[0])}`, vals)
          continue
        }
      }
      tfCols = 0
      // Bảng ngang: Câu | 1 | 2 | 3 ... / Đáp án | A | B | C ...
      if (/^câu$/i.test(cells[0]) && cells.slice(1).some((c) => /^\d+$/.test(c)) && !cells.some((c) => /^đáp\s*án$/i.test(c))) {
        horizNums = cells.slice(1).filter((c) => /^\d+$/.test(c))
        continue
      }
      if (/^đáp\s*án$/i.test(cells[0]) && horizNums.length) {
        horizNums.forEach((n, i) => {
          if (cells[i + 1]) addAns(`c${Number(n)}`, cells[i + 1])
        })
        horizNums = []
        continue
      }
      horizNums = []
      // Dòng tiêu đề bảng dọc: Câu | Đáp án | Câu | Đáp án
      if (cells.every((c) => !c || /^(?:câu|đáp\s*án|stt|lời\s*giải|điểm)$/i.test(c))) continue
      // Bảng dọc 2 cột hoặc 4 cột: 1 | A | 3 | C
      let matchedPair = false
      for (let i = 0; i + 1 < cells.length; i += 2) {
        const nm = cells[i].match(/^(?:Câu\s*)?(\d+)$/i)
        if (nm && cells[i + 1]) {
          addAns(`c${Number(nm[1])}`, cells[i + 1])
          matchedPair = true
        }
      }
      if (matchedPair) continue
    }

    const line = rawLine.text
    if (/^câu$/i.test(line)) { mode = 'nums'; nums = []; ans = []; continue }
    if (/^đáp\s*án$/i.test(line)) { mode = 'ans'; continue }
    if (mode === 'nums' && /^\d+$/.test(line)) { nums.push(line); continue }
    if (mode === 'ans' && nums.length && !START.test(line)) {
      ans.push(line.trim())
      if (ans.length === nums.length) { nums.forEach((n, i) => addAns(`c${Number(n)}`, ans[i])); mode = null }
      continue
    }
    mode = null

    const sec = sectionType(line)
    const partHead = line.match(/^\s*phần\s+([ivx\d]+)\s*[:.]\s*(.*)$/i)
    if (partHead) {
      const rom: Record<string, QuestionType> = { i: 'trac-nghiem', ii: 'dung-sai', iii: 'tra-loi-ngan', iv: 'tu-luan' }
      tailHint = sec ?? rom[partHead[1].toLowerCase()] ?? tailHint
    } else if (sec) {
      tailHint = sec
      continue
    }
    const cleanLine = partHead ? partHead[2].trim() : line
    if (!cleanLine) continue

    const pairs = [...cleanLine.matchAll(/(?:Câu\s*)?(\d+)\s*[.\-:)]?\s*([A-Da-d])(?![\p{L}\d])[.,;]?/giu)]
    const rest = pairs.reduce((s, p) => s.replace(p[0], ''), cleanLine).replace(/[\s.,;:|–—-]+/g, '')
    if (pairs.length && (pairs.length >= 2 || !START.test(cleanLine)) && !rest) {
      pairs.forEach((p) => addAns(`c${Number(p[1])}`, p[2].toUpperCase()))
      continue
    }

    const m = cleanLine.match(START)
    if (m) {
      cur = (m[1].toLowerCase() === 'bài' ? 'b' : 'c') + Number(m[2])
      const rest2 = m[3].trim()
      if (parseTrueFalse(rest2, 4)) {
        addAns(cur, rest2)
      } else {
        const lead = rest2.match(/^([A-D]|[ĐS]{2,6}|[-+]?\d+(?:[.,]\d+)?)(?![\p{L}\d])[.:)]?\s*(.*)$/iu)
        if (lead) {
          addAns(cur, lead[1])
          if (lead[2]) solutions.set(cur, lead[2])
        } else if (rest2) {
          solutions.set(cur, rest2)
        }
      }
    } else if (cur && cleanLine.trim()) {
      solutions.set(cur, `${solutions.get(cur) ?? ''}\n${cleanLine.trim()}`.trim())
    }
  }
  return { byTag, byTypedTag, solutions }
}

interface Raw {
  tag: string
  head: string
  hint: QuestionType | null
  lines: Line[]
  /** bitmask nhấn mạnh của dòng mở đầu câu hỏi (để phân biệt đề toàn chữ đậm với đáp án tô đậm) */
  promptMask: number
  /** ảnh nằm ngay trên dòng "Câu N." ; `before` = đã có chữ của đề bài đứng trước ảnh */
  headImgs: Array<{ idx: number; before: boolean }>
  passagePrefix?: string
}

export interface ParsedExam {
  questions: Question[]
  /** số câu chưa tìm thấy đáp án */
  noAnswer: number
  /** số câu không có đề bài bằng chữ (đề bài là ảnh) */
  noPrompt: number
  /** số câu có ảnh đính kèm (`question.image`) */
  imageCount: number
  /** số ảnh trong file không gắn được vào câu nào (ảnh thứ hai trở đi của đề bài, ảnh trong phương án) */
  extraImages: number
}

/** Đề bài chỉ có ảnh, không có chữ */
export const IMAGE_ONLY_PROMPT = '(Xem ảnh)'
const IMAGE_PROMPT = '(Đề bài là hình ảnh trong file, chưa đọc được. Hãy nhập lại đề bài.)'

function formatMarkdownTable(rows: Line[]): string {
  if (!rows.length) return ''
  const cols = Math.max(...rows.map((r) => r.cells?.length ?? 0))
  if (!cols) return ''
  const norm = (r: Line) =>
    `| ${Array.from({ length: cols }, (_, i) => (r.cells?.[i]?.text ?? '').replace(/\|/g, '/').trim()).join(' | ')} |`
  const out = [norm(rows[0])]
  if (rows.length >= 2) {
    out.push(`| ${Array.from({ length: cols }, () => '---').join(' | ')} |`)
    for (const r of rows.slice(1)) out.push(norm(r))
  }
  return out.join('\n')
}

/** `images`: mảng data URL, tra theo chỉ số trong token ảnh của `text` (xem `/api/extract`, docx với marks). */
export function parseExamText(text: string, images: string[] = []): ParsedExam {
  const lines = text.split(/\r?\n/).map(readLine).filter((l) => l.text || l.imgs.length)
  // Chỉ dùng chế độ bare khi không có dòng Câu/Bài/Question VÀ không có dòng "1." đứng trước phương án A..D
  const hasExplicitStart = lines.some((l) => START.test(l.text))
  const hasNumBeforeOpts = lines.some((l, idx) => NUM_START.test(l.text) && Boolean(lines[idx + 1] && splitOptions(lines[idx + 1], images)))
  const bare = !hasExplicitStart && !hasNumBeforeOpts

  const raws: Raw[] = []
  let hint: QuestionType | null = null
  let tailAt = lines.length
  let afterEnd = false
  let inPassage = false
  let pendingPassage: string[] = []
  // chế độ bare: dòng chỉ có ảnh đứng sau bộ phương án của câu trước là đề bài của câu kế tiếp
  let pending: Line[] = []

  const curHasOptionsOrAns = (r: Raw | undefined) =>
    Boolean(r && r.lines.some((x) => Boolean(splitOptions(x, images)) || INLINE_ANS.test(x.text)))

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (raws.length && TAIL_HEAD.test(line.text)) { tailAt = i + 1; break }
    if (EXAM_END.test(line.text)) { afterEnd = true; inPassage = false; continue }
    if (SECTION.test(line.text)) {
      hint = sectionType(line.text) ?? hint
      afterEnd = false
      inPassage = false
      continue
    }
    const m = line.text.match(START)
    const nm = !m && !bare ? line.text.match(NUM_START) : null
    const canNumStart = Boolean(
      nm &&
        (curHasOptionsOrAns(raws.at(-1)) ||
          (!raws.length && lines.slice(i + 1, i + 4).some((x) => Boolean(splitOptions(x, images))))),
    )
    if (m || canNumStart) {
      afterEnd = false
      inPassage = false
      const tag = m ? (m[1].toLowerCase() === 'bài' ? 'b' : 'c') + Number(m[2]) : `c${Number(nm![1])}`
      const headText = m ? m[3] : nm![2]
      const from = line.text.length - headText.length
      const headImgs = line.imgs.map((im) => ({ idx: im.idx, before: im.at > from && line.text.slice(from, im.at).trim() !== '' }))
      const passagePrefix = pendingPassage.length ? pendingPassage.join('\n') : undefined
      pendingPassage = []
      raws.push({
        tag,
        head: headText,
        hint,
        lines: [],
        promptMask: maskSummary(line.mask, [...line.text]),
        headImgs,
        passagePrefix,
      })
      continue
    }
    if (PASSAGE_HEAD.test(line.text)) {
      inPassage = true
      pendingPassage.push(line.text)
      continue
    }
    if (inPassage) {
      pendingPassage.push(line.text)
      continue
    }
    if (afterEnd) continue
    if (!raws.length) {
      hint = sectionType(line.text) ?? hint
      if (bare) {
        const opts = splitOptions(line, images)
        if (!opts) {
          if (!line.text && line.imgs.length) pending.push(line)
          else pending = []
          continue
        }
      } else continue
    }
    if (bare) {
      const opts = splitOptions(line, images)
      if (opts) {
        const cur = raws.at(-1)
        const keys = new Set(cur?.lines.flatMap((x) => splitOptions(x, images)?.map((o) => o.key.toUpperCase()) ?? []))
        if (!cur || keys.size >= 4 || opts.some((o) => keys.has(o.key.toUpperCase()))) {
          raws.push({ tag: `c${raws.length + 1}`, head: '', hint, lines: pending, promptMask: 0, headImgs: [] })
        } else cur.lines.push(...pending)
        pending = []
        // dòng phương án cuối (D.) mà Word neo kèm ảnh: đó là các mảnh đề bài của câu kế tiếp
        if (opts[0].key.toUpperCase() === 'D' && line.imgs.length && !opts.some((o) => o.text.startsWith('![Hình'))) {
          pending.push({ text: '', mask: [], imgs: line.imgs })
          lines[i] = { ...line, imgs: [] }
          raws.at(-1)!.lines.push(lines[i])
          continue
        }
      } else if (!line.text) {
        const cur = raws.at(-1)
        const have = new Set(cur?.lines.flatMap((x) => splitOptions(x, images)?.map((o) => o.key.toUpperCase()) ?? []))
        if (!cur || have.size >= 4 || have.has('D')) { pending.push(line); continue }
      }
    }
    raws.at(-1)?.lines.push(line)
  }

  const tail = parseTail(lines.slice(tailAt))
  const usedTail = new Map<string, number[]>()
  const pickTail = (keyMap: Map<string, string[]>, mapKey: string, pred: (v: string) => boolean): string | undefined => {
    const list = keyMap.get(mapKey) ?? []
    const used = usedTail.get(mapKey) ?? []
    const idx = list.findIndex((v, i) => !used.includes(i) && pred(v))
    if (idx < 0) return undefined
    usedTail.set(mapKey, [...used, idx])
    return list[idx]
  }

  let extraImages = 0
  const questions = raws.map((r): Question => {
    let head = r.head
    const pts = head.match(/^\(\s*(\d+(?:[.,]\d+)?)\s*điểm\s*\)\s*[.:]?\s*/i)
    if (pts) head = head.slice(pts[0].length)
    head = head.replace(/^(?:\(\s*(?:NB|TH|VD|VDC|Nhận biết|Thông hiểu|Vận dụng(?:\s+cao)?)\s*\)|\[\s*(?:NB|TH|VD|VDC)\s*\])\s*[.:]?\s*/i, '')

    const promptParts: string[] = []
    if (r.passagePrefix) promptParts.push(r.passagePrefix)
    if (head) promptParts.push(head)

    const optLines: string[] = []
    const options: Opt[] = []
    let inline: string | undefined
    let solution: string | undefined
    let tableRows: Line[] = []
    const flushTable = () => {
      if (tableRows.length) {
        promptParts.push(formatMarkdownTable(tableRows))
        tableRows = []
      }
    }

    // ảnh: ảnh đầu tiên của đề bài thành `question.image`; ảnh sau xen trong chữ (không bare) nhúng inline Markdown
    let main: { idx: number; before: boolean } | undefined
    const extra = new Set<number>()
    const inlinePromptImgs: number[] = []
    const addImg = (idx: number, before: boolean, inPrompt: boolean, canInlineInPrompt = false) => {
      if (!(idx in images)) return
      if (inPrompt && !main) { main = { idx, before }; return }
      if (inPrompt && canInlineInPrompt && main?.idx !== idx) { inlinePromptImgs.push(idx); return }
      if (main?.idx !== idx) extra.add(idx)
    }

    r.headImgs.forEach((im) => addImg(im.idx, im.before, true, !bare))
    if (inlinePromptImgs.length && promptParts.length) {
      promptParts[promptParts.length - 1] += ' ' + inlinePromptImgs.splice(0).map((idx) => `![Hình](${images[idx]})`).join(' ')
    }

    for (const line of r.lines) {
      const a = line.text.match(INLINE_ANS)
      const s = line.text.match(INLINE_SOL)
      const opts = solution === undefined ? splitOptions(line, images) : null
      const promptHasText = promptParts.some((t) => t.trim())
      const canInline = !bare && promptHasText && line.text.trim() !== ''

      if (solution === undefined && !a && !opts?.some((o) => o.text.startsWith('![Hình'))) {
        for (const im of line.imgs) {
          const inPrompt = (!options.length && (!opts || im.at <= 0)) || (!main && !line.text)
          addImg(im.idx, promptHasText || line.text.slice(0, im.at).trim() !== '', inPrompt, canInline && inPrompt)
        }
      }
      if (!line.text) {
        if (inlinePromptImgs.length && promptParts.length) {
          promptParts[promptParts.length - 1] += ' ' + inlinePromptImgs.splice(0).map((idx) => `![Hình](${images[idx]})`).join(' ')
        }
        // Dòng chỉ có ảnh ngay sau phương án rỗng -> gắn vào phương án đó
        if (!bare && line.imgs.length && options.length && !options.at(-1)!.text) {
          const im = line.imgs[0]
          if (im.idx in images) {
            options.at(-1)!.text = `![Hình ${options.at(-1)!.key}](${images[im.idx]})`
            extra.delete(im.idx)
          }
        }
        continue
      }
      if (a) { flushTable(); inline = a[1].trim() }
      else if (s) { flushTable(); solution = s[2] }
      else if (solution !== undefined) { flushTable(); solution += `\n${line.text}` }
      else if (opts) { flushTable(); options.push(...opts); optLines.push(line.text) }
      else if (line.cells && !options.length) tableRows.push(line)
      else if (options.length) {
        // Không nối chữ vào phương án D khi đã có đáp án inline hoặc là chú thích TextBox
        if (inline === undefined && !(options.length >= 4 && BOX_NOTE.test(line.text))) {
          options[options.length - 1].text += ` ${line.text}`
        }
      } else {
        flushTable()
        let txt = line.text
        if (inlinePromptImgs.length) {
          txt += ' ' + inlinePromptImgs.splice(0).map((idx) => `![Hình](${images[idx]})`).join(' ')
        }
        promptParts.push(txt)
      }
    }
    flushTable()

    const bracketCount = options.filter((o) => o.bracket).length
    if (bracketCount === options.length) options.forEach((o) => { o.bracket = false })
    for (const o of options) if (o.bracket) o.star = true

    const lower = options.filter((o) => o.key === o.key.toLowerCase())
    const upper = options.filter((o) => o.key !== o.key.toLowerCase())

    // Nhận diện nhanh nếu tất cả/nhiều phương án cuối có nhãn (Đ)/(S)
    const inlineTfMarks = lower.map((o) => o.text.match(TF_INLINE_TAG))
    const hasInlineTfTags = lower.length >= 2 && inlineTfMarks.every(Boolean)

    const pickTailFor = (typeHint: QuestionType, pred: (v: string) => boolean) =>
      pickTail(tail.byTypedTag, `${typeHint}:${r.tag}`, pred) ?? pickTail(tail.byTag, r.tag, pred)

    const peekRaw = inline ?? tail.byTypedTag.get(`${r.hint ?? 'trac-nghiem'}:${r.tag}`)?.[0] ?? tail.byTag.get(r.tag)?.[0]
    const letterAns = /^\s*[A-D]\b/i.test(peekRaw ?? '')

    const tf =
      lower.length >= 2 &&
      (r.hint === 'dung-sai' ? lower.every((o) => o.paren || o.dot) : lower.every((o) => o.paren)) &&
      r.tag[0] === 'c' &&
      r.hint !== 'tu-luan' &&
      r.hint !== 'trac-nghiem' &&
      (r.hint === 'dung-sai' || !letterAns || hasInlineTfTags)
    const lowerMcq = lower.length >= 2 && !tf && r.tag[0] === 'c' && r.hint !== 'tu-luan'
    const mcq = upper.length >= 2 ? upper : lowerMcq ? lower : []
    const type: QuestionType = tf
      ? 'dung-sai'
      : mcq.length
        ? 'trac-nghiem'
        : r.hint === 'tra-loi-ngan'
          ? 'tra-loi-ngan'
          : 'tu-luan'

    if (type === 'tu-luan') promptParts.push(...optLines)
    const mainImg = main as { idx: number; before: boolean } | undefined
    const promptText = promptParts.join('\n') || (mainImg ? IMAGE_ONLY_PROMPT : bare && options.length ? IMAGE_PROMPT : '')
    const q = makeQuestion(type, promptText)
    if (mainImg) q.image = { src: images[mainImg.idx], position: mainImg.before ? 'bottom' : 'top' }
    extraImages += extra.size
    if (pts) q.points = Number(pts[1].replace(',', '.'))

    if (type === 'trac-nghiem') {
      const raw = inline ?? pickTailFor('trac-nghiem', (v) => /^\s*[A-D](?![\p{L}\d])/iu.test(v))
      q.options = mcq
        .map((o) => ({ key: o.key.toUpperCase(), text: o.text }))
        .sort((x, y) => x.key.localeCompare(y.key))
      const letter = raw?.match(/^\s*([A-D])(?![\p{L}\d])/iu)?.[1].toUpperCase()
      const starred = mcq.filter((o) => o.star)
      const picked = starred.length === 1 ? starred[0] : pickByEmphasis(mcq)
      if (letter) q.answer = letter
      else if (picked) q.answer = picked.key.toUpperCase()
    } else if (type === 'dung-sai') {
      q.options = lower.map((o, idx) => ({
        key: o.key,
        text: hasInlineTfTags ? o.text.replace(TF_INLINE_TAG, '').trim() : o.text,
        _idx: idx,
      })).map(({ key, text }) => ({ key, text }))

      const raw = inline ?? pickTailFor('dung-sai', (v) => parseTrueFalse(v, lower.length) !== null)
      const tfAns = parseTrueFalse(raw, lower.length)
      if (tfAns) q.answer = formatTrueFalse(tfAns)
      else if (hasInlineTfTags) {
        const vals = inlineTfMarks.map((m) => /^đ/i.test(m![1]))
        q.answer = formatTrueFalse(vals)
      } else {
        const starMarks = lower.map((o) => o.star)
        const starCount = starMarks.filter(Boolean).length
        if (starCount > 0 && starCount < lower.length) {
          q.answer = formatTrueFalse(starMarks)
        } else {
          // Tìm bitmask đánh dấu 1..n-1 ý trên nội dung (hoặc trên nhãn), hoặc đậm/màu cả n ý khi đề bài không đậm
          let resolved: boolean[] | null = null
          for (const field of ['bodyMask', 'labelMask'] as const) {
            for (const bit of EMPH_PRIORITY) {
              const marks = lower.map((o) => (o[field] & bit) !== 0)
              const count = marks.filter(Boolean).length
              if (count > 0 && count < lower.length) { resolved = marks; break }
            }
            if (resolved) break
          }
          if (!resolved) {
            for (const bit of [BIT_COLOR, BIT_HIGHLIGHT, BIT_UNDERLINE, BIT_BOLD]) {
              if ((r.promptMask & bit) === 0 && lower.every((o) => (o.bodyMask & bit) !== 0)) {
                resolved = lower.map(() => true)
                break
              }
            }
          }
          if (resolved) q.answer = formatTrueFalse(resolved)
        }
      }
    } else if (type === 'tra-loi-ngan') {
      const raw = inline ?? pickTailFor('tra-loi-ngan', (v) => parseShortValue(v) !== undefined)
      const parsedVal = parseShortValue(raw)
      if (parsedVal !== undefined) q.answer = parsedVal
    }

    const rawSol = type === 'tu-luan' ? (inline ?? pickTailFor('tu-luan', () => true)) : undefined
    const expl = (solution ?? tail.solutions.get(r.tag))?.trim()
    if (type === 'tu-luan') {
      const out = [rawSol, expl].filter((x): x is string => Boolean(x))
      if (out.length) q.solution = out.join('\n').split('\n')
    } else if (expl) q.explanation = expl
    return q
  })
  return {
    questions,
    noAnswer: questions.filter((q) => q.type !== 'tu-luan' && !q.answer).length,
    noPrompt: questions.filter((q) => q.prompt === IMAGE_PROMPT).length,
    imageCount: questions.filter((q) => q.image).length,
    extraImages,
  }
}
