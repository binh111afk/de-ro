import type { ExamBlock, ExamDoc, Span } from '@/data/docTypes'
import type { Exam, Question } from '@/data/types'
import { formatPoints } from '@/lib/mathText'

/** Đề tương tác (`Exam`) → khối soạn (`ExamDoc`) để dùng chung bộ xuất .docx với trình soạn. */
export function examToDoc(exam: Exam, opts: { withAnswers?: boolean } = {}): ExamDoc {
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
  // giữ công thức dạng `$…$` (trình soạn và bộ xuất Word đều hiểu); `$$…$$` đưa về `$…$` vì trình soạn chỉ có toán trong dòng
  const keepMath = (t: string) => t.replace(/\$\$([\s\S]+?)\$\$/g, (_, m: string) => `$${m.replace(/\n/g, ' ')}$`)
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
      const text = keepMath(q.prompt)
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
        options: (q.options ?? []).map((o) => ({ label: o.key, text: keepMath(o.text) })),
      })
    }
  }
  // mở vào trình soạn: kèm bảng đáp án + lời giải tự luận ở cuối (như đề AI soạn), để sửa tiếp và Xáo đề đọc được đáp án
  if (opts.withAnswers) {
    const all = exam.sections.flatMap((s) => s.questions)
    const items = all
      .map((q, i) => ({ no: i + 1, q }))
      .filter(({ q }) => q.type !== 'tu-luan' && q.type !== 'tu-luan-dong' && q.answer?.trim())
      .map(({ no, q }) => ({ no, answer: q.answer!.trim() }))
    const essays = all
      .map((q, i) => ({ no: i + 1, q }))
      .filter(({ q }) => (q.type === 'tu-luan' || q.type === 'tu-luan-dong') && q.solution?.some((l) => l.trim()))
    if (items.length || essays.length) blocks.push({ type: 'heading', text: 'ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM', level: 1 })
    if (items.length) blocks.push({ type: 'answerKey', items })
    for (const { no, q } of essays) {
      blocks.push({
        type: 'rubric',
        title: `Bài ${no}`,
        items: q.solution!.filter((l) => l.trim()).map((l, i) => ({ label: `${i + 1}.`, text: keepMath(l) })),
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
