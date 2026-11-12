/**
 * Xáo đề: từ một đề đã soạn (ExamDoc) sinh nhiều mã đề.
 * - Xáo thứ tự câu trong từng nhóm câu liền nhau cùng dạng (trắc nghiệm / đúng-sai / trả lời ngắn).
 *   Khối khác chen giữa (đoạn văn dùng chung, tiêu đề phần, hình) giữ nguyên chỗ và chia nhóm,
 *   nên câu "Đọc đoạn văn sau…" không bị tách khỏi đoạn văn của nó.
 * - Xáo phương án A–D (và ý a–d của câu đúng/sai), trừ câu có phương án kiểu "Cả A và B", "Tất cả đều đúng".
 * - Tự luận giữ nguyên thứ tự.
 * - Phần đáp án / hướng dẫn chấm ở cuối đề được tách khỏi đề phát cho học sinh;
 *   đáp án mới của từng mã gom vào một tài liệu riêng.
 */
import type { AnswerKeyBlock, ExamBlock, ExamDoc, QuestionBlock, RichText } from '@/data/docTypes'
import { uid } from '@/data/docTypes'

export interface ShuffleOptions {
  codes: string[]
  shuffleQuestions: boolean
  shuffleOptions: boolean
  /** cho test: hàm ngẫu nhiên [0,1) */
  random?: () => number
}

export interface VersionAnswer {
  no: number
  answer: string
  /** số thứ tự câu trong đề gốc (1..questionCount) */
  origNo?: number
  kind?: 'mcq' | 'tf' | 'short'
}

export interface SummaryAnswerRow {
  no: number
  kind: 'mcq' | 'tf' | 'short'
  /** đáp án ở từng mã đề (theo đúng thứ tự `codes`); '?' nếu câu chưa có đáp án */
  answers: string[]
}

export interface SummaryAnswerData {
  codes: string[]
  /** Bảng 1: hàng = câu theo thứ tự đề gốc, cột = từng mã đề */
  byOriginal: SummaryAnswerRow[]
  /** Bảng 2: hàng = câu theo thứ tự của từng mã đề (để chấm tay) */
  byVersion: SummaryAnswerRow[]
}

export interface ShuffledVersion {
  code: string
  doc: ExamDoc
  answers: VersionAnswer[]
}

export interface ShuffleResult {
  versions: ShuffledVersion[]
  /** đáp án mọi mã đề + phần tự luận chung */
  answerDoc: ExamDoc
  /** số câu được xáo (trắc nghiệm, đúng/sai, trả lời ngắn) */
  questionCount: number
  /** số câu có đáp án đọc được từ khối đáp án */
  answeredCount: number
}

const plain = (rt: RichText | undefined): string =>
  rt == null ? '' : typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')

const ANSWER_HEADING = /^\s*(phần\s+)?(đáp án|hướng dẫn chấm|lời giải|bảng đáp án)/i
/** phương án nhắc tới phương án khác: đổi chỗ sẽ sai nghĩa */
const LOCKED_OPTION = /(cả\s+[A-D]\b|[A-D]\s*(và|,)\s*[A-D]\b|các đáp án trên|các phương án trên|tất cả (đều|các)|đều đúng|đều sai|không có (đáp án|phương án))/i
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const TF_LABELS = ['a', 'b', 'c', 'd', 'e', 'f']

/** Vị trí bắt đầu phần đáp án (khối đáp án, hướng dẫn chấm, hoặc tiêu đề "ĐÁP ÁN…"); không có thì = độ dài. */
export function answerSectionStart(blocks: ExamBlock[]): number {
  const i = blocks.findIndex((b) => {
    if (b.type === 'answerKey' || b.type === 'rubric') return true
    if (b.type === 'heading' || b.type === 'title' || b.type === 'paragraph') return ANSWER_HEADING.test(plain(b.text))
    return false
  })
  return i < 0 ? blocks.length : i
}

const kindOf = (b: QuestionBlock) => b.kind ?? 'mcq'

function shuffled<T>(arr: T[], random: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** đáp án gốc theo `no` của câu (khối đáp án có thể ghi nhiều mục cùng số: trắc nghiệm và tự luận) */
function readKeys(blocks: ExamBlock[]): Map<number, string[]> {
  const keys = new Map<number, string[]>()
  for (const b of blocks) {
    if (b.type !== 'answerKey') continue
    for (const it of b.items) keys.set(it.no, [...(keys.get(it.no) ?? []), plain(it.answer).trim()])
  }
  return keys
}

const letterOf = (s: string) => /^\s*([A-F])\s*[.)]?\s*$/i.exec(s)?.[1].toUpperCase()
/** "ĐSĐS", "Đ S Đ S", "a) Đ b) S …" → mảng true/false; sai định dạng → null */
function parseTf(s: string, n: number): boolean[] | null {
  const marks = s
    .replace(/[a-f]\)/gi, '')
    .toUpperCase()
    .replace(/ĐÚNG/g, 'Đ')
    .replace(/SAI/g, 'S')
    .replace(/[^ĐDS]/g, '')
  if (marks.length !== n) return null
  return [...marks].map((c) => c !== 'S')
}

/** Xáo phương án một câu; trả về câu mới và đáp án mới (chuỗi rỗng nếu không biết đáp án gốc). */
function shuffleQuestion(q: QuestionBlock, keys: string[], doOptions: boolean, random: () => number): { q: QuestionBlock; answer: string } {
  const kind = kindOf(q)
  if (kind === 'short' || q.options.length < 2) {
    const ans = keys.find((k) => !letterOf(k)) ?? ''
    return { q: { ...q, options: q.options.map((o) => ({ ...o })) }, answer: ans }
  }
  const locked = q.options.some((o) => LOCKED_OPTION.test(plain(o.text)))
  const order = doOptions && !locked ? shuffled(q.options.map((_, i) => i), random) : q.options.map((_, i) => i)
  const labels = kind === 'tf' ? TF_LABELS : LETTERS
  const options = order.map((from, i) => ({ ...q.options[from], label: labels[i] ?? q.options[from].label }))

  if (kind === 'tf') {
    const raw = keys.map((k) => parseTf(k, q.options.length)).find(Boolean)
    const answer = raw ? order.map((from) => (raw[from] ? 'Đ' : 'S')).join('') : ''
    return { q: { ...q, options }, answer }
  }
  const old = keys.map(letterOf).find(Boolean)
  const oldIndex = old ? q.options.findIndex((o) => o.label.toUpperCase() === old) : -1
  const answer = oldIndex >= 0 ? labels[order.indexOf(oldIndex)] : ''
  return { q: { ...q, options }, answer }
}

function withCode(blocks: ExamBlock[], code: string): ExamBlock[] {
  const label = `Mã đề: ${code}`
  // đề có bảng thông tin (meta) thì thêm một dòng; không thì chèn dòng canh phải ngay sau tiêu đề đề
  const metaIndex = blocks.findIndex((b) => b.type === 'meta')
  if (metaIndex >= 0) {
    const meta = blocks[metaIndex] as Extract<ExamBlock, { type: 'meta' }>
    const rows = meta.rows.filter(([k]) => !/^mã đề/i.test(k))
    return blocks.map((b, i) => (i === metaIndex ? { ...meta, rows: [...rows, ['Mã đề', code]] } : b))
  }
  const titleIndex = blocks.findIndex((b) => b.type === 'title')
  const line: ExamBlock = { type: 'paragraph', text: [{ text: label, marks: [{ type: 'bold' }] }], format: { align: 'right' } }
  const at = titleIndex >= 0 ? titleIndex + 1 : blocks.findIndex((b) => b.type === 'question' || b.type === 'heading')
  const pos = at < 0 ? 0 : at
  return [...blocks.slice(0, pos), line, ...blocks.slice(pos)]
}

export function shuffleExam(doc: ExamDoc, opts: ShuffleOptions): ShuffleResult {
  const random = opts.random ?? Math.random
  const cut = answerSectionStart(doc.blocks)
  const body = doc.blocks.slice(0, cut)
  const keySection = doc.blocks.slice(cut)
  const keys = readKeys(doc.blocks)
  const questions = body.filter((b): b is QuestionBlock => b.type === 'question')
  const origMeta = new WeakMap<QuestionBlock, { origNo: number; kind: 'mcq' | 'tf' | 'short' }>()
  questions.forEach((q, idx) => origMeta.set(q, { origNo: idx + 1, kind: kindOf(q) }))

  const versions: ShuffledVersion[] = opts.codes.map((code) => {
    // chia nhóm: dãy câu liền nhau cùng dạng
    const out: ExamBlock[] = []
    let run: QuestionBlock[] = []
    const flush = () => {
      if (run.length) out.push(...(opts.shuffleQuestions ? shuffled(run, random) : run))
      run = []
    }
    for (const b of body) {
      if (b.type === 'question') {
        if (run.length && kindOf(run[0]) !== kindOf(b)) flush()
        run.push(b)
      } else {
        flush()
        out.push(b)
      }
    }
    flush()

    // đánh số lại liên tục và xáo phương án
    let n = 0
    const answers: VersionAnswer[] = []
    const blocks = out.map((b) => {
      if (b.type !== 'question') return b
      const meta = origMeta.get(b)
      const { q, answer } = shuffleQuestion(b, keys.get(b.no) ?? [], opts.shuffleOptions, random)
      n += 1
      answers.push({ no: n, answer, origNo: meta?.origNo, kind: meta?.kind })
      return { ...q, no: n }
    })

    return {
      code,
      answers,
      doc: { ...doc, id: uid(), title: `${doc.title} - Mã ${code}`, blocks: withCode(blocks, code) },
    }
  })

  // tài liệu đáp án: bảng đáp án từng mã + phần tự luận (không đổi giữa các mã)
  const answerBlocks: ExamBlock[] = [
    { type: 'title', text: `ĐÁP ÁN CÁC MÃ ĐỀ`, format: { align: 'center' } },
    { type: 'paragraph', text: doc.title, format: { align: 'center' } },
  ]
  for (const v of versions) {
    answerBlocks.push({ type: 'heading', level: 2, text: `Mã đề ${v.code}` })
    const items: AnswerKeyBlock['items'] = v.answers.map((a) => ({ no: a.no, answer: a.answer || '?' }))
    if (items.length) answerBlocks.push({ type: 'answerKey', items })
  }
  const essayKey = essayPart(keySection, new Set(questions.map((q) => q.no)), doc.blocks.some((b) => b.type === 'essay'))
  if (essayKey.length) {
    answerBlocks.push({ type: 'heading', level: 2, text: 'Phần tự luận (chung cho mọi mã đề)' }, ...essayKey)
  }

  return {
    versions,
    answerDoc: { ...doc, id: uid(), title: `${doc.title} - Đáp án`, blocks: answerBlocks },
    questionCount: questions.length,
    answeredCount: versions[0]?.answers.filter((a) => a.answer).length ?? 0,
  }
}

/**
 * Dựng dữ liệu Bảng đáp án tổng hợp từ kết quả xáo đề:
 * - byOriginal: hàng = câu theo thứ tự đề gốc, cột = từng mã đề (đối chiếu giữa các mã).
 * - byVersion: hàng = câu theo thứ tự của từng mã đề (để chấm tay).
 * Câu chưa có đáp án ghi '?'.
 */
export function buildSummaryAnswers(res: ShuffleResult): SummaryAnswerData {
  const codes = res.versions.map((v) => v.code)
  const n = res.questionCount
  const firstByOrig = new Map<number, VersionAnswer>()
  for (const a of res.versions[0]?.answers ?? []) {
    if (a.origNo != null) firstByOrig.set(a.origNo, a)
  }

  const byOriginal: SummaryAnswerRow[] = Array.from({ length: n }, (_, idx) => {
    const origNo = idx + 1
    const kind = firstByOrig.get(origNo)?.kind ?? 'mcq'
    const answers = res.versions.map((v) => {
      const hit = v.answers.find((a) => a.origNo === origNo) ?? v.answers[idx]
      return hit?.answer || '?'
    })
    return { no: origNo, kind, answers }
  })

  const byVersion: SummaryAnswerRow[] = Array.from({ length: n }, (_, idx) => {
    const no = idx + 1
    const kind = res.versions[0]?.answers[idx]?.kind ?? 'mcq'
    const answers = res.versions.map((v) => v.answers[idx]?.answer || '?')
    return { no, kind, answers }
  })

  return { codes, byOriginal, byVersion }
}

/**
 * Phần hướng dẫn chấm tự luận lấy từ phần đáp án gốc: bỏ bảng đáp án trắc nghiệm và các lời giải
 * "Câu N…" (số câu cũ, không còn khớp sau khi xáo); giữ hướng dẫn chấm, lời giải "Bài N", bảng điểm.
 */
function essayPart(keySection: ExamBlock[], questionNos: Set<number>, hasEssay: boolean): ExamBlock[] {
  if (!hasEssay) return []
  const out: ExamBlock[] = []
  for (const b of keySection) {
    if (b.type === 'answerKey') {
      // mục tự luận: đáp án không phải chữ cái / Đ-S / số ngắn
      const items = b.items.filter((it) => {
        const a = plain(it.answer).trim()
        return !(questionNos.has(it.no) && (letterOf(a) || /^[ĐDS\s]+$/i.test(a) || /^-?[\d.,]+$/.test(a)))
      })
      if (items.length) out.push({ ...b, items })
      continue
    }
    if ((b.type === 'heading' || b.type === 'title') && ANSWER_HEADING.test(plain(b.text)) && !/tự luận/i.test(plain(b.text))) continue
    if ((b.type === 'paragraph' || b.type === 'heading') && /^\s*câu\s+\d+/i.test(plain(b.text))) continue
    out.push(b)
  }
  return out
}

/** "101" + 4 → ["101","102","103","104"]; mã có chữ ("A1") thì tăng phần số cuối. */
export function makeCodes(start: string, count: number): string[] {
  const m = /^(.*?)(\d+)$/.exec(start.trim())
  if (!m) return Array.from({ length: count }, (_, i) => `${start.trim() || 'Mã'}${i + 1}`)
  const [, prefix, num] = m
  return Array.from({ length: count }, (_, i) => `${prefix}${String(Number(num) + i).padStart(num.length, '0')}`)
}
