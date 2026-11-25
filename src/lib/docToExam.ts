import { isCodeSpan, splitExamInline } from './examCode.js'
import type { EssayBlock, ExamBlock, ExamDoc, QuestionBlock, RichText, Span, TableBlock } from '@/data/docTypes'
import type { Exam, Question, QuestionImage, Section, Subject } from '@/data/types'
import { mathTableImageSrc, renderExamTableSvg } from './table.js'
import { svgDataUrl } from './plot.js'
import { formatTrueFalse, normalizeShort, parseTrueFalse } from './grading.js'
import { parseExamText } from './parseExamText.js'

/**
 * Chữ của một đoạn rich text cho đề tương tác: giữ công thức `$…$`, đậm/nghiêng/gạch chân
 * thành **…** / *…* / __…__ (MathText vẽ lại). Đoạn có công thức không bọc dấu để khỏi vỡ công thức.
 */
function toRich(rt: RichText | undefined, skip?: unknown): string {
  if (!rt) return ''
  const spans = typeof rt === 'string' ? [{ text: rt }] : rt
  return spans.flatMap(splitExamInline)
    .map((s) => {
      if (s.image) {
        if (s.image === skip) return ''
        const { alt, width } = s.image
        const src = mathTableImageSrc(s.image.src, s.image.plot)
        const pct = width ? Math.min(100, Math.max(10, Math.round((width / 643) * 100))) : 0
        return `\n![${(alt ?? '').replace(/[\]|\n]/g, ' ')}${pct ? `|${pct}` : ''}](${src})\n`
      }
      if (isCodeSpan(s)) return /[\n`]/.test(s.text) ? `\n\`\`\`\n${s.text}\n\`\`\`\n` : `\`${s.text}\``
      const has = (t: string) => s.marks?.some((m) => m.type === t)
      if (!s.marks?.length) return s.text
      return s.text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g).map((part, i) => {
        const core = part.trim()
        if (i % 2 || !core || part.includes('$')) return part
        let w = core
        if (has('italic')) w = `*${w}*`
        if (has('bold')) w = `**${w}**`
        if (has('underline')) w = `__${w}__`
        return part.replace(core, w)
      }).join('')
    })
    .join('')
}

const ALIGN = new Set(['center', 'right', 'justify'])
const alignOf = (b: QuestionBlock | EssayBlock) => {
  const a = (b as { format?: { align?: string } }).format?.align
  return a && ALIGN.has(a) ? { align: a as 'center' | 'right' | 'justify' } : {}
}

/** Văn bản thuần của một đoạn rich text (bỏ định dạng, giữ công thức `$…$`). */
function toPlain(rt: RichText | undefined): string {
  if (!rt) return ''
  return typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')
}

/**
 * Ảnh đầu tiên chèn trong đề bài: nằm trước mọi chữ thì xếp trên đề bài, còn lại xếp dưới.
 * Các ảnh còn lại (và ảnh trong phương án) đi vào chữ dạng `![alt|rộng%](src)` (xem `toRich`).
 */
function promptImage(...parts: Array<RichText | undefined>): (QuestionImage & { _from?: unknown }) | undefined {
  for (const rt of parts) {
    if (!rt || typeof rt === 'string') continue
    const at = rt.findIndex((sp) => sp.image)
    if (at < 0) continue
    const { src: storedSrc, alt, width, plot } = rt[at].image!
    const src = mathTableImageSrc(storedSrc, plot)
    const first = !rt.slice(0, at).some((sp) => sp.text.trim())
    // width trong trang đề là px; đề tương tác dùng % — quy theo bề ngang chữ trang A4 (~643px)
    const pct = width ? Math.min(100, Math.max(10, Math.round((width / 643) * 100))) : undefined
    return { src, _from: rt[at].image, position: first ? 'top' : 'bottom', ...(alt ? { alt } : {}), ...(plot ? { plot } : {}), ...(pct ? { width: pct } : {}) }
  }
  return undefined
}

/** Đề bài + ảnh chính; ảnh chính không lặp lại trong chữ. */
function withImage(...parts: Array<RichText | undefined>): { prompt: string; image?: QuestionImage } {
  const img = promptImage(...parts)
  const prompt = parts.map((p) => toRich(p, img?._from).trim()).filter(Boolean).join('\n')
  if (!img) return { prompt }
  const { _from, ...image } = img
  void _from
  return { prompt, image }
}

/** Đáp án trắc nghiệm là chữ cái A–D ở đầu chuỗi, ví dụ "B" hoặc "B. 12 cm". */
function letterOf(raw: string | undefined): string | undefined {
  const m = raw?.match(/^\s*([A-D])\b/i)
  return m ? m[1].toUpperCase() : undefined
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Đáp án trả lời ngắn: một số, ví dụ "12", "-3,5", "0.25". */
const NUMERIC = /^[-+]?\d+([.,]\d+)?$/

const SOLUTION_HEAD = /lời giải|hướng dẫn giải|giải thích/i

/**
 * Phần lời giải luôn là phần cuối tài liệu: một tiêu đề ("Lời giải", "Hướng dẫn giải", "Giải thích")
 * rồi các đoạn "Câu N: …" (trắc nghiệm, đúng/sai, trả lời ngắn) và "Bài N: …" (tự luận, khớp nhãn khi xuất Word).
 * Đoạn không bắt đầu bằng "Câu/Bài N" nối vào mục trước. Khoá trả về: `c<N>` hoặc `b<N>`.
 */
function explanations(blocks: ExamDoc['blocks']): Map<string, string> {
  const out = new Map<string, string>()
  let at = -1
  blocks.forEach((b, i) => {
    if ((b.type === 'heading' || b.type === 'title') && SOLUTION_HEAD.test(toPlain(b.text))) at = i
  })
  let cur = ''
  for (const b of blocks.slice(at + 1)) {
    if (at < 0) break
    const lines = b.type === 'paragraph' ? [toPlain(b.text)] : b.type === 'bullets' ? b.items.map(toPlain) : []
    for (const line of lines) {
      const m = line.match(/^\s*(Câu|Bài)\s*(\d+)\s*[.:)–-]?\s*([\s\S]*)$/i)
      if (m) {
        cur = (m[1].toLowerCase() === 'bài' ? 'b' : 'c') + m[2]
        out.set(cur, m[3].trim())
      } else if (cur && line.trim()) out.set(cur, `${out.get(cur)}\n${line.trim()}`.trim())
    }
  }
  return out
}

type ScoredBlock = QuestionBlock | EssayBlock
const POINTS = /(\d+(?:[.,]\d{1,2})?)\s*(?:điểm|đ)(?!\p{L})/iu
const asCents = (s: string) => Math.round(Number(s.replace(',', '.')) * 100)

function sourceScores(doc: ExamDoc): Map<ScoredBlock, number> {
  const scores = new Map<ScoredBlock, number>()
  const all: ScoredBlock[] = []
  const sections: { total: number; blocks: ScoredBlock[] }[] = []
  let section: (typeof sections)[number] | undefined
  let rate: number | undefined
  for (const block of doc.blocks) {
    if (block.type === 'heading' || block.type === 'paragraph' || block.type === 'title') {
      const title = toPlain(block.text).normalize('NFC')
      const sectionTitle = /^\s*(?:phần|mục)\s+[\divxlc]+\b/iu.test(title)
      const amount = POINTS.exec(title)
      if (block.type !== 'heading' && !sectionTitle) continue
      if (!amount && (block.type !== 'heading' || block.level !== 1) && !sectionTitle) continue
      section = undefined
      rate = undefined
      if (amount) {
        const cents = asCents(amount[1])
        if (/^\s*(?:\/|mỗi\s+)\s*(?:câu|bài)/iu.test(title.slice(amount.index + amount[0].length))) rate = cents
        else {
          section = { total: cents, blocks: [] }
          sections.push(section)
        }
      }
      continue
    }
    if (block.type !== 'question' && block.type !== 'essay') continue
    all.push(block)
    section?.blocks.push(block)
    const text = toPlain(block.text).trim()
    const scoreLabel = /[([]\s*(\d+(?:[.,]\d{1,2})?)\s*(?:điểm|đ)\s*[)\]]/giu
    const stated = [...text.matchAll(scoreLabel)].find((m) =>
      m.index === 0 || /^[.\s]*$/.test(text.slice(m.index + m[0].length)),
    )?.[1]
    if (block.type === 'essay' && block.score > 0) scores.set(block, Math.round(block.score * 100))
    else if (stated !== undefined) scores.set(block, asCents(stated))
    else if (rate !== undefined) scores.set(block, rate)
  }

  const assigned = (blocks: ScoredBlock[]) => blocks.reduce((sum, b) => sum + (scores.get(b) ?? 0), 0)
  const distribute = (blocks: ScoredBlock[], total: number, weight = (_: ScoredBlock) => 1) => {
    const sum = blocks.reduce((n, b) => n + weight(b), 0)
    let cumulative = 0
    let previous = 0
    for (const block of blocks) {
      cumulative += weight(block)
      const next = Math.round(Math.max(0, total) * cumulative / sum)
      scores.set(block, next - previous)
      previous = next
    }
  }
  for (const s of sections) distribute(s.blocks.filter((b) => !scores.has(b)), s.total - assigned(s.blocks))
  const open = all.filter((b) => !scores.has(b))
  const defaultPoints = (b: ScoredBlock) => b.type === 'essay' || b.kind === 'tf' ? 100
    : b.kind === 'short' && doc.subject === 'Toán' ? 50 : 25
  const mcq = open.filter((b) => b.type === 'question' && b.kind !== 'tf' && b.kind !== 'short')
  const other = open.filter((b) => !mcq.includes(b))
  const remaining = 1000 - assigned(all)
  const reserved = other.reduce((n, b) => n + defaultPoints(b), 0)
  if (mcq.length && reserved <= remaining) {
    for (const b of other) scores.set(b, defaultPoints(b))
    distribute(mcq, remaining - reserved)
  } else distribute(open, remaining, defaultPoints)
  return scores
}

const SUP_CHARS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
}
const SUB_CHARS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
}

function isColorEmph(hex: unknown): boolean {
  if (typeof hex !== 'string') return false
  const m = hex.match(/^#?([0-9a-f]{6})$/i)
  if (!m) return false
  const c = m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b) > 40 || Math.max(r, g, b) > 110
}

function scriptText(text: string, kind: 'super' | 'sub'): string {
  const map = kind === 'super' ? SUP_CHARS : SUB_CHARS
  const chars = Array.from(text)
  if (chars.every((c) => c === ' ' || c in map)) return chars.map((c) => map[c] ?? c).join('')
  return `${kind === 'super' ? '^' : '_'}{${text}}`
}

/** Chuyển tài liệu chỉ gồm đoạn văn/bảng (như nhập từ .docx vào trình soạn) sang câu hỏi tương tác qua `parseExamText`. */
function blocksToParsedQuestions(blocks: ExamBlock[]): Question[] {
  const images: string[] = []
  const addImg = (src: string) => {
    let idx = images.indexOf(src)
    if (idx < 0) { idx = images.length; images.push(src) }
    return `\uE002${idx}\uE003`
  }
  const rtMarked = (rt: RichText | undefined): string => {
    if (!rt) return ''
    const spans: Span[] = typeof rt === 'string' ? [{ text: rt }] : rt
    return spans.map((s) => {
      if (s.image?.src) return addImg(mathTableImageSrc(s.image.src, s.image.plot))
      let txt = s.text
      if (!txt) return ''
      let mask = 0
      let script: 'super' | 'sub' | null = null
      for (const m of s.marks ?? []) {
        if (m.type === 'bold') mask |= 1
        else if (m.type === 'italic') mask |= 2
        else if (m.type === 'underline') mask |= 4
        else if (m.type === 'textStyle' && isColorEmph(m.attrs?.color)) mask |= 8
        else if (m.type === 'highlight') mask |= 16
        else if (m.type === 'strike') mask |= 32
        else if (m.type === 'super') script = 'super'
        else if (m.type === 'sub') script = 'sub'
      }
      if (script && txt.trim()) txt = scriptText(txt, script)
      if (!mask) return txt
      const open = String.fromCharCode(0xe010 + mask)
      return txt.split('\n').map((part) => (/\S/.test(part) ? `${open}${part}\uE001` : part)).join('\n')
    }).join('')
  }

  const lines: string[] = []
  for (const b of blocks) {
    if (b.type === 'title' || b.type === 'heading' || b.type === 'paragraph' || b.type === 'student') {
      lines.push(rtMarked(b.text))
    } else if (b.type === 'bullets') {
      for (const it of b.items) lines.push(rtMarked(it))
    } else if (b.type === 'table') {
      const hasLayoutQ = b.rows.some((row) => row.length >= 2 && row.some((c) => /^\s*(?:Câu|Bài|Question)\s*\d+/i.test(toPlain(c.text))) && row.some((c) => (typeof c.text !== 'string' && c.text.some((s) => s.image)) || toPlain(c.text).length > 80))
      if (hasLayoutQ) {
        for (const row of b.rows) for (const c of row) lines.push(rtMarked(c.text))
      } else {
        for (const row of b.rows) {
          if (row.length >= 2) {
            const cells = row.map((c) => rtMarked(c.text).replace(/\n+/g, ' ').trim())
            if (cells.some(Boolean)) lines.push(`\uE006${cells.join('\uE005')}`)
          } else if (row[0]) {
            lines.push(rtMarked(row[0].text))
          }
        }
      }
    } else if (b.type === 'columns') {
      for (const c of b.cols) lines.push(rtMarked(c))
    }
  }
  return parseExamText(lines.join('\n'), images).questions
}

/** Số La Mã cho tên phần (tối đa 4 phần: trắc nghiệm, đúng/sai, trả lời ngắn, tự luận). */
const ROMAN = ['I', 'II', 'III', 'IV']

/**
 * Chuyển đề soạn (ExamDoc, dạng khối) sang đề tương tác (Exam) để làm bài và chấm.
 * Giữ điểm ghi trong đề trước khi chia điểm còn thiếu. Đáp án được đọc theo số câu và dạng;
 * lời giải của bài tự luận dùng làm đáp án tham khảo.
 */
export function docToExam(doc: ExamDoc, id: string): Exam {
  if (doc.online) return { ...doc.online, id }
  // Khối đáp án đánh số chung cho cả trắc nghiệm và tự luận nên một số câu có thể có
  // nhiều mục: trắc nghiệm lấy mục dạng chữ cái (A–D), tự luận lấy mục còn lại.
  const keys = new Map<number, string[]>()
  for (const b of doc.blocks) {
    if (b.type !== 'answerKey') continue
    for (const it of b.items) {
      keys.set(it.no, [...(keys.get(it.no) ?? []), toPlain(it.answer).trim()])
    }
  }
  const mcqAnswer = (no: number) => (keys.get(no) ?? []).map(letterOf).find(Boolean)
  // đáp án đúng/sai và trả lời ngắn cùng đánh số `no` liên tục với trắc nghiệm; tự luận đánh số riêng
  // nên có thể trùng `no`: ghi lại mục đã dùng để tự luận không nhặt nhầm
  const used = new Map<number, string[]>()
  const take = (no: number, pick: (a: string) => boolean): string | undefined => {
    const found = (keys.get(no) ?? []).find(pick)
    if (found !== undefined) used.set(no, [...(used.get(no) ?? []), found])
    return found
  }
  const essayAnswer = (no: number) =>
    (keys.get(no) ?? []).find((a) => !letterOf(a) && !(used.get(no) ?? []).includes(a))

  const explain = explanations(doc.blocks)
  // Chỉ gắn bảng đứng ngay sau câu dẫn nhắc tới bảng.
  const tables = new Map<QuestionBlock | EssayBlock, TableBlock[]>()
  let owner: QuestionBlock | EssayBlock | undefined
  for (const block of doc.blocks) {
    if (block.type === 'question' || block.type === 'essay') owner = /(?<!\p{L})bảng(?!\p{L})/iu.test(toPlain(block.text)) ? block : undefined
    else if (block.type === 'table' && owner) {
      tables.set(owner, [...(tables.get(owner) ?? []), block])
    } else owner = undefined
  }
  const tableImages = (block: QuestionBlock | EssayBlock): string[] =>
    (tables.get(block) ?? []).flatMap((table) => {
      const img = renderExamTableSvg(table)
      if (!img) return []
      const pct = Math.min(100, Math.max(10, Math.round((img.width / 643) * 100)))
      return [`![Bảng số liệu|${pct}%](${svgDataUrl(img.svg)})`]
    })
  const questionContent = (block: QuestionBlock | EssayBlock) => {
    const extra = block.type === 'essay' ? block.sub ?? [] : []
    const content = withImage(block.text, ...extra)
    return { ...content, prompt: [content.prompt, ...tableImages(block)].filter(Boolean).join('\n') }
  }
  const questionBlocks = doc.blocks.filter((b): b is QuestionBlock => b.type === 'question')
  const essayBlocks = doc.blocks.filter((b): b is EssayBlock => b.type === 'essay')
  const fallback = questionBlocks.length === 0 && essayBlocks.length === 0 ? blocksToParsedQuestions(doc.blocks) : null
  const mcqBlocks = questionBlocks.filter((b) => b.kind !== 'tf' && b.kind !== 'short')
  const tfBlocks = questionBlocks.filter((b) => b.kind === 'tf')
  const shortBlocks = questionBlocks.filter((b) => b.kind === 'short')
  const scores = sourceScores(doc)
  const points = (b: ScoredBlock) => (scores.get(b) ?? 0) / 100

  // số câu hiển thị chạy liên tục qua trắc nghiệm, đúng/sai, trả lời ngắn (khớp "Câu N" trong trình soạn)
  let counter = 0
  const mcqs: Question[] = fallback
    ? fallback.filter((q) => q.type === 'trac-nghiem').map((q, i) => ({ ...q, id: `${id}-m${i}`, number: ++counter }))
    : mcqBlocks.map((b, i) => ({
        id: `${id}-m${i}`,
        number: ++counter,
        type: 'trac-nghiem',
        ...questionContent(b),
        ...alignOf(b),
        options: b.options.map((o) => ({ key: o.label, text: toRich(o.text).trim() })),
        answer: mcqAnswer(b.no),
        explanation: explain.get(`c${b.no}`) || undefined,
        points: points(b),
      }))

  const tfs: Question[] = fallback
    ? fallback.filter((q) => q.type === 'dung-sai').map((q, i) => ({ ...q, id: `${id}-t${i}`, number: ++counter }))
    : tfBlocks.map((b, i) => {
        const n = b.options.length
        const raw = take(b.no, (a) => parseTrueFalse(a, n) !== null)
        const parsed = parseTrueFalse(raw, n)
        return {
          id: `${id}-t${i}`,
          number: ++counter,
          type: 'dung-sai',
          ...questionContent(b),
          ...alignOf(b),
          options: b.options.map((o) => ({ key: o.label.toLowerCase(), text: toRich(o.text).trim() })),
          answer: parsed ? formatTrueFalse(parsed) : undefined,
          explanation: explain.get(`c${b.no}`) || undefined,
          points: points(b),
        }
      })

  const shorts: Question[] = fallback
    ? fallback.filter((q) => q.type === 'tra-loi-ngan').map((q, i) => ({ ...q, id: `${id}-s${i}`, number: ++counter }))
    : shortBlocks.map((b, i) => {
        const raw = take(b.no, (a) => NUMERIC.test(a.replace(/\s+/g, '')))
        return {
          id: `${id}-s${i}`,
          number: ++counter,
          type: 'tra-loi-ngan',
          ...questionContent(b),
          ...alignOf(b),
          answer: raw ? normalizeShort(raw) : undefined,
          explanation: explain.get(`c${b.no}`) || undefined,
          points: points(b),
        }
      })

  const essays: Question[] = fallback
    ? fallback.filter((q) => q.type === 'tu-luan' || q.type === 'tu-luan-dong').map((q, i) => ({ ...q, id: `${id}-e${i}`, number: i + 1 }))
    : essayBlocks.map((b, i) => {
        const answer = essayAnswer(b.no)
        const written = explain.get(`b${b.no}`)
        return {
          id: `${id}-e${i}`,
          number: i + 1,
          type: 'tu-luan',
          ...questionContent(b),
          ...alignOf(b),
          points: points(b),
          solution: written ? written.split('\n') : answer ? [answer] : undefined,
        }
      })

  const sections: Section[] = []
  const addSection = (name: string, questions: Question[]) => {
    if (!questions.length) return
    sections.push({
      id: `${id}-s${sections.length + 1}`,
      title: `PHẦN ${ROMAN[sections.length]}. ${name}`,
      points: round2(questions.reduce((n, q) => n + q.points, 0)),
      questions,
    })
  }
  addSection('TRẮC NGHIỆM', mcqs)
  addSection('ĐÚNG/SAI', tfs)
  addSection('TRẢ LỜI NGẮN', shorts)
  addSection('TỰ LUẬN', essays)

  // tên đề: tab còn tên mặc định thì lấy dòng tiêu đề trong trang
  const heading = doc.blocks.find((b) => b.type === 'title')
  const headTitle = heading && 'text' in heading ? toPlain(heading.text as RichText).trim() : ''
  const title = (!doc.title.trim() || doc.title === 'Đề thi mới') && headTitle ? headTitle : doc.title
  // thời gian: dòng "Thời gian … N phút" ghi trong trang thắng giá trị mặc định
  const pageText = doc.blocks.flatMap((b) => ('text' in b && b.type !== 'question' && b.type !== 'essay' ? [toPlain(b.text as RichText)] : []))
  const timeLine = pageText.map((t) => /thời gian[^\d]{0,30}(\d{1,3})\s*phút/i.exec(t)?.[1]).find(Boolean)

  return {
    id,
    title,
    subject: doc.subject as Subject,
    grade: doc.grade,
    school: doc.unit,
    year: doc.schoolYear,
    term: doc.term,
    durationMinutes: Number(timeLine) || parseInt(doc.duration, 10) || 45,
    interactive: true,
    sections,
    author: 'Giáo viên',
    createdAt: doc.createdAt,
    views: 0,
    likes: 0,
    shared: true,
  }
}
