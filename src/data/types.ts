export type Subject =
  | 'Toán'
  | 'Ngữ văn'
  | 'Tiếng Việt'
  | 'Tiếng Anh'
  | 'Vật lí'
  | 'Hoá học'
  | 'Sinh học'
  | 'Lịch sử'
  | 'Địa lí'
  | 'Tin học'

export type QuestionType = 'trac-nghiem' | 'dung-sai' | 'tra-loi-ngan' | 'tu-luan' | 'tu-luan-dong'

export interface Option {
  key: string
  text: string
}

/** Ảnh của câu hỏi: trên / dưới đề bài (xếp dọc), hoặc bên trái / phải (đề bài cạnh ảnh). */
export interface QuestionImage {
  src: string
  /** thiếu = dưới đề bài */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** bề rộng hiển thị, % của khung câu hỏi (thiếu = 60) */
  width?: number
  alt?: string
}

export interface Question {
  id: string
  number: number
  type: QuestionType
  prompt: string
  image?: QuestionImage
  /** trắc nghiệm: phương án A–D; đúng/sai: các ý a) b) c) d) (key là chữ cái thường) */
  options?: Option[]
  /** trắc nghiệm: chữ cái; đúng/sai: chuỗi Đ/S theo thứ tự ý ("ĐSĐS"); trả lời ngắn: con số ("-1,5") */
  answer?: string
  explanation?: string
  points: number
  /** for tự luận / tự luận động: a working + final answer */
  solution?: string[]
  /** id of the bank entry this question came from — lets the AI avoid repeats */
  sourceId?: string
}

export interface Section {
  id: string
  title: string
  points: number
  questions: Question[]
}

/** Cài đặt làm bài của đề tạo online; thiếu = mặc định (có đếm ngược, hiện đáp án sau khi nộp). */
export interface ExamSettings {
  /** true → không đếm ngược và không tự nộp */
  noTimeLimit?: boolean
  /** hiện đúng/sai và giải thích ngay sau khi chọn (trắc nghiệm); dạng khác bấm "Kiểm tra đáp án" */
  instantFeedback?: boolean
  /** đảo thứ tự câu mỗi lượt làm */
  shuffleQuestions?: boolean
}

export interface Exam {
  id: string
  title: string
  subject: Subject
  grade: string
  school: string
  year: string
  term: string
  durationMinutes: number
  /** true → the exam can be launched as an interactive quiz */
  interactive: boolean
  sections: Section[]
  author: string
  createdAt: string
  views: number
  likes: number
  shared: boolean
  cover?: string
  /** id of the community exam this was copied from — prevents duplicate imports */
  importedFrom?: string
  settings?: ExamSettings
}

export const SUBJECTS: Subject[] = [
  'Toán',
  'Ngữ văn',
  'Tiếng Việt',
  'Tiếng Anh',
  'Vật lí',
  'Hoá học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Tin học',
]

export const GRADES = [
  'Lớp 3',
  'Lớp 4',
  'Lớp 5',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
]

export const TYPE_LABEL: Record<QuestionType, string> = {
  'trac-nghiem': 'Trắc nghiệm',
  'dung-sai': 'Đúng/Sai',
  'tra-loi-ngan': 'Trả lời ngắn',
  'tu-luan': 'Tự luận',
  'tu-luan-dong': 'Tự luận động',
}

export function totalPoints(exam: Exam): number {
  return exam.sections.reduce((sum, s) => sum + s.questions.reduce((n, q) => n + q.points, 0), 0)
}

export function questionCount(exam: Exam): number {
  return exam.sections.reduce((sum, s) => sum + s.questions.length, 0)
}

export function flatQuestions(exam: Exam): Question[] {
  return exam.sections.flatMap((s) => s.questions)
}
