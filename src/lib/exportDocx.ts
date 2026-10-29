import type { Exam } from '@/data/types'
import { plainText } from './math'

/**
 * Exports an exam to a Word-compatible .doc file (HTML with Word namespace).
 * Word, LibreOffice and Google Docs all open this correctly, and it keeps
 * the A4 layout without needing a heavy docx library.
 */
export async function exportDocx(exam: Exam): Promise<void> {
  const html = buildWordHtml(exam)
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitize(exam.title)}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function sanitize(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '-').trim()
}

function buildWordHtml(exam: Exam): string {
  const questions = exam.sections.flatMap((s) => s.questions)
  const total = questions.reduce((n, q) => n + q.points, 0)

  const sectionsHtml = exam.sections
    .map((section) => {
      const qs = section.questions
        .map((q) => {
          const body = plainText(q.prompt)
          if (q.type === 'tra-loi-ngan') {
            return `<p class="q"><b>Câu ${q.number}.</b> ${escapeHtml(body)} <i>(${fmt(q.points)}đ)</i></p><table class="sa" cellspacing="0"><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table>`
          }
          if (q.options?.length) {
            const mark = q.type === 'dung-sai' ? ')' : '.'
            const opts = q.options
              .map(
                (o) =>
                  `<p class="opt"><b>${o.key}${mark}</b> ${escapeHtml(plainText(o.text))}</p>`,
              )
              .join('')
            return `<p class="q"><b>Câu ${q.number}.</b> ${escapeHtml(body)} <i>(${fmt(q.points)}đ)</i></p>${opts}`
          }
          return `<p class="q"><b>Câu ${q.number}.</b> ${escapeHtml(body)} <i>(${fmt(q.points)}đ)</i></p><p class="blank">................................................................................................</p>`
        })
        .join('')
      return `<h2>${escapeHtml(section.title)}</h2>${qs}`
    })
    .join('')

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(exam.title)}</title>
<style>
  @page { size: A4; margin: 1.8cm 1.6cm; }
  body { font-family: "Times New Roman", serif; font-size: 13pt; line-height: 1.5; color: #000; }
  .school { text-align: center; font-weight: bold; font-size: 13pt; margin: 0 0 4px; }
  .title { text-align: center; font-weight: bold; font-size: 15pt; margin: 0 0 4px; text-transform: uppercase; }
  .meta { text-align: center; font-style: italic; font-size: 12pt; margin: 0 0 4px; }
  .term { text-align: center; font-size: 11pt; margin: 0 0 10px; }
  .hr { border-bottom: 1px solid #000; margin: 8px 0 12px; }
  .note { font-style: italic; font-size: 12pt; margin: 0 0 12px; }
  h2 { font-size: 13pt; font-weight: bold; text-align: center; margin: 16px 0 10px; text-transform: uppercase; }
  .q { margin: 0 0 6px; }
  .opt { margin: 0 0 3px 26px; }
  .blank { margin: 0 0 10px 26px; color: #666; }
  .sa { margin: 2px 0 8px 26px; border-collapse: collapse; }
  .sa td { width: 28px; height: 28px; border: 1px solid #000; }
  .foot { margin-top: 22px; font-size: 11pt; border-top: 1px solid #999; padding-top: 6px; }
  .foot td { border: none; }
</style>
</head>
<body>
  <p class="school">${escapeHtml(exam.school || 'TRƯỜNG THCS ...')}</p>
  <p class="title">${escapeHtml(exam.title)}</p>
  <p class="meta">Môn: ${escapeHtml(exam.subject)} &nbsp;&mdash;&nbsp; Lớp: ${escapeHtml(exam.grade)} &nbsp;&mdash;&nbsp; Thời gian: ${exam.durationMinutes} phút</p>
  <p class="term">Năm học ${escapeHtml(exam.year)} &nbsp;&bull;&nbsp; ${escapeHtml(exam.term)}</p>
  <div class="hr"></div>
  <p class="note">Hãy đọc kỹ đề trước khi làm bài. Bài làm trắc nghiệm có thể trả lời bằng cách chọn một phương án đúng nhất.</p>
  ${sectionsHtml}
  <table class="foot" width="100%"><tr>
    <td>${escapeHtml(exam.subject)} &mdash; ${escapeHtml(exam.grade)}</td>
    <td align="right">${questions.length} câu &mdash; ${fmt(total)} điểm</td>
  </tr></table>
</body>
</html>`
}

function fmt(n: number): string {
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
