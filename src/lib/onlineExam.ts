/**
 * Đề tạo online: giáo viên tự nhập từng câu (không qua trình soạn Word), lưu trong lịch sử trên máy
 * (`store/online.ts`), có thể làm thử và đăng lên cộng đồng. Đề đăng giữ nguyên `Exam` kèm cài đặt.
 */
import type { ExamDoc } from '@/data/docTypes'
import { SUBJECTS, TYPE_LABEL, type Exam, type ExamSettings, type Question, type QuestionType, type Section, type Subject } from '@/data/types'
import { formatTrueFalse, normalizeShort, parseTrueFalse, SHORT_MAX_CHARS } from '@/lib/grading'
import { useApp } from '@/store/app'

export interface OnlineMeta {
  title: string
  subject: Subject
  grade: string
  school: string
  year: string
  term: string
  durationMinutes: number
}

export interface OnlineItem {
  id: string
  /** draft = đang soạn dở (tự lưu); done = đã bấm "Tạo đề" */
  status: 'draft' | 'done'
  meta: OnlineMeta
  questions: Question[]
  settings: ExamSettings
  createdAt: string
  updatedAt: string
  /** id đề trên cộng đồng sau khi đăng; không có = chỉ nằm trên máy này */
  publishedId?: string
  /** id tài liệu trong trình soạn nếu đề được chuyển từ đó (để chuyển lại không tạo trùng) */
  sourceDocId?: string
}

/** Dạng câu giáo viên tạo được, theo thứ tự xuất hiện trong đề (như đề THPT: I trắc nghiệm → IV tự luận). */
export const ONLINE_TYPES: QuestionType[] = ['trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan']

const ROMAN = ['I', 'II', 'III', 'IV']
const NUMERIC = /^[-+]?\d+(,\d+)?$/
const round2 = (n: number) => Math.round(n * 100) / 100
const uid = () => Math.random().toString(36).slice(2, 10)

export function defaultMeta(): OnlineMeta {
  return { title: '', subject: SUBJECTS[0], grade: 'Lớp 12', school: '', year: '2026 – 2027', term: 'Giữa kỳ I', durationMinutes: 45 }
}

const DEFAULT_POINTS: Record<string, number> = { 'trac-nghiem': 0.25, 'dung-sai': 1, 'tra-loi-ngan': 0.25, 'tu-luan': 1 }

export function newQuestion(type: QuestionType, prompt = ''): Question {
  const q: Question = { id: uid(), number: 0, type, prompt, points: DEFAULT_POINTS[type] ?? 1 }
  if (type === 'trac-nghiem') q.options = ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' }))
  if (type === 'dung-sai') q.options = ['a', 'b', 'c', 'd'].map((key) => ({ key, text: '' }))
  return q
}

/** Đổi dạng câu, giữ đề bài và giải thích; phương án và đáp án làm lại theo dạng mới. */
export function convertQuestion(q: Question, type: QuestionType): Question {
  if (q.type === type) return q
  return { ...newQuestion(type, q.prompt), id: q.id, explanation: q.explanation }
}

/** Xếp lại theo dạng (trắc nghiệm → đúng/sai → trả lời ngắn → tự luận), giữ thứ tự trong cùng dạng, đánh số 1..n. */
export function sortQuestions(questions: Question[]): Question[] {
  const rank = (q: Question) => Math.max(0, ONLINE_TYPES.indexOf(q.type === 'tu-luan-dong' ? 'tu-luan' : q.type))
  return questions
    .map((q, i) => ({ q, i }))
    .sort((a, b) => rank(a.q) - rank(b.q) || a.i - b.i)
    .map(({ q }, i) => ({ ...q, number: i + 1 }))
}

/** Lỗi khiến câu chưa dùng được, hoặc null nếu ổn. */
export function questionIssue(q: Question): string | null {
  if (!q.prompt.trim()) return 'Chưa có nội dung câu hỏi.'
  const opts = q.options ?? []
  if (q.type === 'trac-nghiem') {
    const blank = opts.find((o) => !o.text.trim())
    if (blank) return `Phương án ${blank.key} còn trống.`
    if (!opts.some((o) => o.key === q.answer)) return 'Chưa chọn đáp án đúng.'
  }
  if (q.type === 'dung-sai') {
    const blank = opts.find((o) => !o.text.trim())
    if (blank) return `Ý ${blank.key}) còn trống.`
    if (parseTrueFalse(q.answer, opts.length) === null) return 'Chưa chọn Đúng/Sai cho đủ các ý.'
  }
  if (q.type === 'tra-loi-ngan') {
    const a = normalizeShort(q.answer)
    if (!NUMERIC.test(a)) return 'Đáp án phải là một số, ví dụ 12, -3,5.'
    if (a.length > SHORT_MAX_CHARS) return `Đáp án tối đa ${SHORT_MAX_CHARS} ký tự (kể cả dấu âm và dấu phẩy).`
  }
  if (q.type !== 'tu-luan' && q.type !== 'tu-luan-dong' && !(q.points > 0)) return 'Điểm phải lớn hơn 0.'
  return null
}

export const totalOf = (questions: Question[]) => round2(questions.reduce((n, q) => n + q.points, 0))

/** Chia đều thang 10 cho các câu. */
export function evenPoints(questions: Question[]): Question[] {
  const each = questions.length ? round2(10 / questions.length) : 0
  return questions.map((q) => ({ ...q, points: each }))
}

/** Dựng đề tương tác từ bản đang soạn: gom câu theo dạng thành các phần I, II, III, IV. */
export function itemToExam(item: OnlineItem): Exam {
  const qs = sortQuestions(item.questions)
  const sections: Section[] = []
  for (const type of ONLINE_TYPES) {
    const questions = qs.filter((q) => (q.type === 'tu-luan-dong' ? 'tu-luan' : q.type) === type)
    if (!questions.length) continue
    sections.push({
      id: `${item.id}-s${sections.length + 1}`,
      title: `PHẦN ${ROMAN[sections.length]}. ${TYPE_LABEL[type].toUpperCase()}`,
      points: totalOf(questions),
      questions,
    })
  }
  const m = item.meta
  return {
    id: item.id,
    title: m.title.trim() || 'Đề chưa đặt tên',
    subject: m.subject,
    grade: m.grade,
    school: m.school,
    year: m.year,
    term: m.term,
    durationMinutes: m.durationMinutes,
    interactive: true,
    sections,
    author: 'Giáo viên',
    createdAt: item.createdAt,
    views: 0,
    likes: 0,
    shared: false,
    settings: item.settings,
  }
}

/** Đề từ trình soạn Word (hoặc nơi khác) thành bản nháp online để chỉnh tay. */
export function examToDraft(exam: Exam): Pick<OnlineItem, 'meta' | 'questions' | 'settings'> {
  return {
    meta: {
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      school: exam.school,
      year: exam.year,
      term: exam.term,
      durationMinutes: exam.durationMinutes,
    },
    questions: sortQuestions(
      exam.sections.flatMap((s) =>
        s.questions.map((q) => {
          const type = q.type === 'tu-luan-dong' ? 'tu-luan' : q.type
          // đáp án đúng/sai về dạng chuẩn "ĐSĐS" như ô nhập
          const parsed = type === 'dung-sai' ? parseTrueFalse(q.answer, q.options?.length ?? 0) : null
          return { ...q, type, answer: type === 'dung-sai' ? (parsed ? formatTrueFalse(parsed) : undefined) : q.answer, id: uid() }
        }),
      ),
    ),
    settings: exam.settings ?? {},
  }
}

/** Khung ExamDoc để đăng lên cộng đồng: nội dung nằm ở `online`, không có khối soạn thảo. */
export function itemToDoc(item: OnlineItem): ExamDoc {
  const exam = itemToExam(item)
  const now = new Date().toISOString()
  return {
    id: item.id,
    title: exam.title,
    subject: exam.subject,
    grade: exam.grade,
    term: exam.term,
    schoolYear: exam.year,
    duration: `${exam.durationMinutes} phút`,
    unit: exam.school,
    authority: '',
    blocks: [],
    online: exam,
    createdAt: item.createdAt,
    updatedAt: now,
  }
}

/** Nạp đề vào kho làm bài (thay bản cũ của cùng đề, để sửa rồi làm lại không ra bản trước) rồi trả id để mở `/lam-de/<id>`. */
export function loadForQuiz(item: OnlineItem): string {
  const exam = itemToExam(item)
  const app = useApp.getState()
  const prev = app.myExams.find((e) => e.importedFrom === exam.id)
  if (prev) app.deleteExam(prev.id)
  const id = app.importExam(exam)
  app.startQuiz(id)
  return id
}
