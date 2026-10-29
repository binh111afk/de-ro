import type { ExamBlock, ExamDoc } from '@/data/docTypes'
import type { Exam } from '@/data/types'
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
  for (const section of exam.sections) {
    blocks.push({ type: 'heading', text: section.title, level: 1 })
    for (const q of section.questions) {
      const text = plainText(q.prompt)
      if (q.type === 'tu-luan' || q.type === 'tu-luan-dong') {
        blocks.push({ type: 'essay', no: ++no, text, score: q.points })
        continue
      }
      blocks.push({
        type: 'question',
        no: ++no,
        kind: q.type === 'dung-sai' ? 'tf' : q.type === 'tra-loi-ngan' ? 'short' : 'mcq',
        text: [{ text }, { text: ` (${formatPoints(q.points)}đ)`, marks: [{ type: 'italic' }] }],
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
