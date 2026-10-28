import type { EssayBlock, ExamDoc, QuestionBlock, RichText } from '@/data/docTypes'
import type { Exam, Question, Section, Subject } from '@/data/types'

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

/**
 * Chuyển đề soạn (ExamDoc, dạng khối) sang đề tương tác (Exam) để làm bài và chấm.
 * - Trắc nghiệm: đáp án lấy từ khối `answerKey` theo số câu; điểm chia đều phần 10 trừ tự luận.
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
  const essayAnswer = (no: number) => (keys.get(no) ?? []).find((a) => !letterOf(a))

  const mcqBlocks = doc.blocks.filter((b): b is QuestionBlock => b.type === 'question')
  const essayBlocks = doc.blocks.filter((b): b is EssayBlock => b.type === 'essay')
  const essayTotal = essayBlocks.reduce((n, b) => n + (b.score || 0), 0)
  const mcqTotal = essayBlocks.length ? Math.max(10 - essayTotal, 0) : 10
  const mcqPoints = mcqBlocks.length ? round2(mcqTotal / mcqBlocks.length) : 0

  const mcqs: Question[] = mcqBlocks.map((b, i) => ({
    id: `${id}-m${i}`,
    number: i + 1,
    type: 'trac-nghiem',
    prompt: toPlain(b.text),
    options: b.options.map((o) => ({ key: o.label, text: toPlain(o.text) })),
    answer: mcqAnswer(b.no),
    points: mcqPoints,
  }))

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
  if (mcqs.length) {
    sections.push({
      id: `${id}-s1`,
      title: 'PHẦN I. TRẮC NGHIỆM',
      points: round2(mcqs.reduce((n, q) => n + q.points, 0)),
      questions: mcqs,
    })
  }
  if (essays.length) {
    sections.push({
      id: `${id}-s2`,
      title: 'PHẦN II. TỰ LUẬN',
      points: essayTotal,
      questions: essays,
    })
  }

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
