import type { EssayBlock, ExamDoc, QuestionBlock, RichText } from '@/data/docTypes'
import type { Exam, Question, Section, Subject } from '@/data/types'
import { formatTrueFalse, normalizeShort, parseTrueFalse } from '@/lib/grading'

/** Văn bản thuần của một đoạn rich text (bỏ định dạng, giữ công thức `$…$`). */
function toPlain(rt: RichText | undefined): string {
  if (!rt) return ''
  return typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')
}

/** Đáp án trắc nghiệm là chữ cái A–D ở đầu chuỗi, ví dụ "B" hoặc "B. 12 cm". */
function letterOf(raw: string | undefined): string | undefined {
  const m = raw?.match(/^\s*([A-D])\b/i)
  return m ? m[1].toUpperCase() : undefined
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Đáp án trả lời ngắn: một số, ví dụ "12", "-3,5", "0.25". */
const NUMERIC = /^[-+]?\d+([.,]\d+)?$/

/** Số La Mã cho tên phần (tối đa 4 phần: trắc nghiệm, đúng/sai, trả lời ngắn, tự luận). */
const ROMAN = ['I', 'II', 'III', 'IV']

/**
 * Chuyển đề soạn (ExamDoc, dạng khối) sang đề tương tác (Exam) để làm bài và chấm.
 * - Trắc nghiệm: đáp án lấy từ khối `answerKey` theo số câu; điểm chia đều phần còn lại của 10 điểm.
 * - Đúng/sai (kind 'tf'): 4 ý a–d, đáp án dạng "ĐSĐS"; 1 điểm/câu, chấm theo số ý đúng (xem `grading.ts`).
 * - Trả lời ngắn (kind 'short'): đáp án là số; 0,5 điểm/câu môn Toán, 0,25 điểm các môn khác.
 * - Tự luận: giữ nội dung và điểm; đáp án (nếu có) làm lời giải tham khảo, không tự chấm.
 */
export function docToExam(doc: ExamDoc, id: string): Exam {
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

  const questionBlocks = doc.blocks.filter((b): b is QuestionBlock => b.type === 'question')
  const mcqBlocks = questionBlocks.filter((b) => b.kind !== 'tf' && b.kind !== 'short')
  const tfBlocks = questionBlocks.filter((b) => b.kind === 'tf')
  const shortBlocks = questionBlocks.filter((b) => b.kind === 'short')
  const essayBlocks = doc.blocks.filter((b): b is EssayBlock => b.type === 'essay')
  const essayTotal = essayBlocks.reduce((n, b) => n + (b.score || 0), 0)
  const shortPoints = doc.subject === 'Toán' ? 0.5 : 0.25
  const fixedTotal = essayTotal + tfBlocks.length + shortBlocks.length * shortPoints
  const mcqTotal = fixedTotal > 0 ? Math.max(10 - fixedTotal, 0) : 10
  const mcqPoints = mcqBlocks.length ? round2(mcqTotal / mcqBlocks.length) : 0

  // số câu hiển thị chạy liên tục qua trắc nghiệm, đúng/sai, trả lời ngắn (khớp "Câu N" trong trình soạn)
  let counter = 0
  const mcqs: Question[] = mcqBlocks.map((b, i) => ({
    id: `${id}-m${i}`,
    number: ++counter,
    type: 'trac-nghiem',
    prompt: toPlain(b.text),
    options: b.options.map((o) => ({ key: o.label, text: toPlain(o.text) })),
    answer: mcqAnswer(b.no),
    points: mcqPoints,
  }))

  const tfs: Question[] = tfBlocks.map((b, i) => {
    const n = b.options.length
    const raw = take(b.no, (a) => parseTrueFalse(a, n) !== null)
    const parsed = parseTrueFalse(raw, n)
    return {
      id: `${id}-t${i}`,
      number: ++counter,
      type: 'dung-sai',
      prompt: toPlain(b.text),
      options: b.options.map((o) => ({ key: o.label.toLowerCase(), text: toPlain(o.text) })),
      answer: parsed ? formatTrueFalse(parsed) : undefined,
      points: 1,
    }
  })

  const shorts: Question[] = shortBlocks.map((b, i) => {
    const raw = take(b.no, (a) => NUMERIC.test(a.replace(/\s+/g, '')))
    return {
      id: `${id}-s${i}`,
      number: ++counter,
      type: 'tra-loi-ngan',
      prompt: toPlain(b.text),
      answer: raw ? normalizeShort(raw) : undefined,
      points: shortPoints,
    }
  })

  const essays: Question[] = essayBlocks.map((b, i) => {
    const answer = essayAnswer(b.no)
    return {
      id: `${id}-e${i}`,
      number: i + 1,
      type: 'tu-luan',
      prompt: [toPlain(b.text), ...(b.sub ?? []).map(toPlain)].filter(Boolean).join('\n'),
      points: b.score,
      solution: answer ? [answer] : undefined,
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

  return {
    id,
    title: doc.title,
    subject: doc.subject as Subject,
    grade: doc.grade,
    school: doc.unit,
    year: doc.schoolYear,
    term: doc.term,
    durationMinutes: parseInt(doc.duration, 10) || 45,
    interactive: true,
    sections,
    author: 'Giáo viên',
    createdAt: doc.createdAt,
    views: 0,
    likes: 0,
    shared: true,
  }
}
