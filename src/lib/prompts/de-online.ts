/**
 * Chữ prompt trợ lý AI đề online — module thuần (không import client) để SERVER ghép system prompt từ `task: "de-online"`.
 */
import { TYPE_LABEL, type QuestionType } from '../../data/types.js'
import { DIFFICULTY_RULE } from '../difficulty.js'

export const AI_MAX_QUESTIONS = 30

const ONLINE_TYPES: QuestionType[] = ['trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan']

const SYSTEM =
  'Bạn là trợ lý soạn đề trắc nghiệm online cho giáo viên Việt Nam (THCS/THPT). Khi người dùng nhờ soạn câu hỏi, ' +
  'trả về DUY NHẤT một JSON, không kèm chữ nào ngoài JSON:\n' +
  '{"message":"một câu ngắn về nội dung và mức độ các câu vừa soạn, không nhắc lại số câu","questions":[...]}\n' +
  'Mỗi câu thuộc một trong bốn dạng:\n' +
  '- {"type":"trac-nghiem","prompt":"...","options":["...","...","...","..."],"answer":"A","explanation":"..."} — đúng 4 phương án (không ghi sẵn "A." trong chữ), answer là A, B, C hoặc D.\n' +
  '- {"type":"dung-sai","prompt":"đoạn dẫn","options":["ý a","ý b","ý c","ý d"],"answer":"ĐSĐS","explanation":"..."} — đúng 4 ý, answer là chuỗi 4 ký tự Đ hoặc S theo thứ tự ý.\n' +
  '- {"type":"tra-loi-ngan","prompt":"...","answer":"-3,5","explanation":"..."} — answer là một số, tối đa 4 ký tự kể cả dấu âm và dấu phẩy, dùng dấu phẩy làm dấu thập phân.\n' +
  '- {"type":"tu-luan","prompt":"...","explanation":"đáp án và hướng dẫn chấm gợi ý"}.\n' +
  'Quy tắc: công thức toán, lý, hoá viết bằng LaTeX giữa hai dấu $ (ví dụ $x^2+1$), không dùng markdown khác; ' +
  'kiến thức đúng theo chương trình Việt Nam; đáp án phải đúng; phương án nhiễu hợp lý, không trùng nhau; ' +
  `explanation ngắn gọn nói vì sao đúng; tối đa ${AI_MAX_QUESTIONS} câu mỗi lần; không lặp lại các câu đã có trong đề; phân bố đáp án đúng ngẫu nhiên giữa A, B, C, D. ` +
  'Nếu người dùng chỉ hỏi chung hoặc chào hỏi, không soạn câu nào: trả {"message":"trả lời ngắn","questions":[]}.'

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n) + '…' : t
}

export interface DeOnlineMeta {
  title?: string
  subject: string
  grade: string
}

export interface DeOnlineQuestionSummary {
  number: number
  type: QuestionType | string
  prompt: string
}

export interface DeOnlineInput {
  meta: DeOnlineMeta
  questions: DeOnlineQuestionSummary[]
}

/** Lời dặn hệ thống kèm tóm tắt đề đang soạn (môn, lớp, số câu theo dạng, vài câu gần nhất) để AI soạn tiếp đúng ngữ cảnh. */
export function buildDeOnlineSystem({ meta, questions }: DeOnlineInput): string {
  const counts = ONLINE_TYPES.map((t) => `${questions.filter((q) => (q.type === 'tu-luan-dong' ? 'tu-luan' : q.type) === t).length} ${TYPE_LABEL[t].toLowerCase()}`).join(', ')
  const recent = questions
    .slice(-8)
    .map((q) => `${q.number}. ${clip(q.prompt, 90)}`)
    .join('\n')
  return (
    SYSTEM +
    '\n\n' +
    DIFFICULTY_RULE +
    `\nĐề đang soạn: "${(meta.title ?? '').trim() || 'chưa đặt tên'}" · môn ${meta.subject} · ${meta.grade}. ` +
    (questions.length ? `Hiện có ${questions.length} câu (${counts}).\nCác câu gần nhất:\n${recent}` : 'Chưa có câu nào.')
  )
}
