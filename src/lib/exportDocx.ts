import type { ExamBlock, ExamDoc, Span } from '@/data/docTypes'
import type { Exam, Question } from '@/data/types'
import { formatPoints, plainText } from '@/lib/mathText'

/** Đề tương tác (`Exam`) → khối soạn (`ExamDoc`) để dùng chung bộ xuất .docx với trình soạn. */
export function examToDoc(exam: Exam): ExamDoc {
  const blocks: ExamBlock[] = [
    { type: 'paragraph', text: [{ text: exam.school || 'TRƯỜNG THCS ...', marks: [{ type: 'bold' }] }], format: { align: 'center' } },
    { type: 'title', text: exam.title },
    {
      type: 'meta',
      rows: [
        ['Môn', exam.subject],
        ['Lớp', exam.grade],
        ['Thời gian', `${exam.durationMinutes} phút`],
      ],
    },
    { type: 'paragraph', text: `Năm học ${exam.year} • ${exam.term}`, format: { align: 'center' } },
    { type: 'divider' },
    {
      type: 'paragraph',
      text: [{ text: 'Hãy đọc kỹ đề trước khi làm bài. Bài làm trắc nghiệm có thể trả lời bằng cách chọn một phương án đúng nhất.', marks: [{ type: 'italic' }] }],
    },
  ]
  let no = 0
  // ảnh của câu: top = trước chữ, còn lại (bottom/left/right) = sau chữ; luôn riêng một dòng
  const withImage = (q: Question, spans: Span[]): Span[] => {
    const pos = q.image?.position
    if (!q.image?.src) return spans
    const img: Span = { text: '', image: { src: q.image.src, alt: q.image.alt } }
    if (pos === 'left' || pos === 'right') {
      // % khung → px, tối đa 45% bề rộng vùng chữ (672px) để chữ còn chỗ
      img.image!.width = Math.round((Math.min(q.image.width ?? 60, 45) / 100) * 672)
      return [...spans, img]
    }
    return pos === 'top' ? [{ text: '\n' }, img, { text: '\n' }, ...spans] : [...spans, { text: '\n' }, img]
  }
  const side = (q: Question) => (q.image?.position === 'left' || q.image?.position === 'right' ? { imagePosition: q.image.position } : {})
  for (const section of exam.sections) {
    blocks.push({ type: 'heading', text: section.title, level: 1 })
    for (const q of section.questions) {
      const text = plainText(q.prompt)
      if (q.type === 'tu-luan' || q.type === 'tu-luan-dong') {
        blocks.push({ type: 'essay', no: ++no, text: withImage(q, [{ text }]), score: q.points, ...side(q) })
        continue
      }
      blocks.push({
        type: 'question',
        no: ++no,
        kind: q.type === 'dung-sai' ? 'tf' : q.type === 'tra-loi-ngan' ? 'short' : 'mcq',
        text: withImage(q, [{ text }, { text: ` (${formatPoints(q.points)}đ)`, marks: [{ type: 'italic' }] }]),
        ...side(q),
        options: (q.options ?? []).map((o) => ({ label: o.key, text: plainText(o.text) })),
      })
    }
  }
  const now = new Date().toISOString()
  return {
    id: exam.id,
    title: exam.title,
    subject: exam.subject,
    grade: exam.grade,
    term: exam.term,
    schoolYear: exam.year,
    duration: `${exam.durationMinutes} phút`,
    unit: exam.school,
    authority: '',
    blocks,
    createdAt: now,
    updatedAt: now,
  }
}

/** Tải đề tương tác về máy dưới dạng .docx thật. */
export async function exportDocx(exam: Exam): Promise<void> {
  const { buildDocxBlob } = await import('@/examEditor/docxBlocks')
  const url = URL.createObjectURL(await buildDocxBlob(examToDoc(exam)))
  const a = document.createElement('a')
  a.href = url
  a.download = `${exam.title.replace(/[\\/:*?"<>|]/g, '-').trim() || 'de-thi'}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
