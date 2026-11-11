/**
 * Cảnh báo đề thiếu đáp án: trước khi học sinh bấm "Làm đề", và trước khi người đăng đăng đề.
 */
import { dialog } from '@/components/Dialog'
import type { Exam } from '@/data/types'
import { gradableMax, missingKeyCount } from '@/lib/grading'

const allQuestions = (exam: Exam) => exam.sections.flatMap((s) => s.questions)

/** Học sinh sắp làm đề: thiếu đáp án thì báo trước. Trả false nếu người dùng thôi không làm. */
export async function confirmQuizWithoutKey(exam: Exam): Promise<boolean> {
  const qs = allQuestions(exam)
  if (!qs.length) return true
  if (gradableMax(qs) <= 0) {
    return dialog.confirm('Đề này chưa có đáp án nên bài làm sẽ không được chấm điểm. Em vẫn làm được và tự đối chiếu sau khi nộp.', {
      title: 'Đề chưa có đáp án',
      confirmLabel: 'Vẫn làm đề',
      cancelLabel: 'Thôi',
    })
  }
  const missing = missingKeyCount(qs)
  if (!missing) return true
  return dialog.confirm(`${missing} câu trong đề chưa có đáp án, các câu đó sẽ không được tính điểm.`, {
    title: 'Đề thiếu đáp án',
    confirmLabel: 'Vẫn làm đề',
    cancelLabel: 'Thôi',
  })
}

/** Người đăng sắp đăng đề: còn câu thiếu đáp án thì nhắc (vẫn cho đăng). Trả false nếu muốn quay lại sửa. */
export async function confirmPublishWithoutKey(exam: Exam): Promise<boolean> {
  const missing = missingKeyCount(allQuestions(exam))
  if (!missing) return true
  return dialog.confirm(
    `${missing} câu trắc nghiệm / đúng-sai / trả lời ngắn chưa có đáp án. Học sinh làm đề sẽ không được chấm các câu này.`,
    { title: 'Đề còn thiếu đáp án', confirmLabel: 'Vẫn đăng', cancelLabel: 'Quay lại sửa' },
  )
}
