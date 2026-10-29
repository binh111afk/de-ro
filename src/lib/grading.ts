/**
 * Chấm điểm đề tương tác theo định dạng đề thi tốt nghiệp THPT từ 2025 (QĐ 764/QĐ-BGDĐT):
 * - trắc nghiệm nhiều lựa chọn: đúng thì được trọn điểm của câu;
 * - đúng/sai: 4 ý a) b) c) d), điểm theo số ý đúng (1 ý: 0,1; 2 ý: 0,25; 3 ý: 0,5; 4 ý: 1 điểm);
 * - trả lời ngắn: đáp án là số, tối đa 4 ký tự (kể cả dấu âm và dấu phẩy), đúng thì được trọn điểm;
 * - tự luận: không tự chấm.
 *
 * Đáp án và bài làm của cả hai dạng mới đều là chuỗi (`Question.answer`, `quizAnswers[id]`):
 * đúng/sai là chuỗi Đ/S theo thứ tự ý ("ĐSĐS"; bài làm chưa chọn ý nào thì dùng "_"),
 * trả lời ngắn là chính con số ("-1,5").
 */
import type { Question } from '@/data/types'

/** Điểm theo số ý đúng của câu đúng/sai 4 ý, tính trên 1 điểm (nhân với điểm của câu). */
const TF_RATIO = [0, 0.1, 0.25, 0.5, 1]

/** Số ký tự tối đa của đáp án trả lời ngắn (khớp 4 cột trên phiếu trả lời). */
export const SHORT_MAX_CHARS = 4

/**
 * Đọc Đ/S của từng ý từ một chuỗi tuỳ ý: "ĐSĐS", "a) Đ, b) S, c) Đ, d) S", "a-Đúng b-Sai …".
 * Trả `null` khi không đọc được đủ `n` ý.
 */
export function parseTrueFalse(raw: string | undefined, n: number): boolean[] | null {
  if (!raw) return null
  const letters = raw
    .toUpperCase()
    .replace(/ĐÚNG/g, 'Đ')
    .replace(/SAI/g, 'S')
    .replace(/[^ĐS]/g, '')
  if (letters.length !== n) return null
  return [...letters].map((c) => c === 'Đ')
}

/** Ghi bài làm đúng/sai thành chuỗi: Đ, S, hoặc "_" cho ý chưa chọn. */
export function formatTrueFalse(values: Array<boolean | null>): string {
  return values.map((v) => (v === null ? '_' : v ? 'Đ' : 'S')).join('')
}

/** Đọc lại bài làm đúng/sai (chuỗi Đ/S/_) thành mảng; ý chưa chọn là `null`. */
export function readTrueFalseAnswer(given: string | undefined, n: number): Array<boolean | null> {
  const chars = [...(given ?? '')].filter((c) => c === 'Đ' || c === 'S' || c === '_')
  return Array.from({ length: n }, (_, i) => (chars[i] === 'Đ' ? true : chars[i] === 'S' ? false : null))
}

/** Chuẩn hoá đáp án trả lời ngắn: bỏ khoảng trắng, dấu thập phân là dấu phẩy. */
export function normalizeShort(raw: string | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, '').replace(/\./g, ',').replace(/^\+/, '')
}

/** Đáp án trả lời ngắn bằng nhau khi cùng giá trị số ("0,50" = "0,5"). */
export function sameShort(a: string | undefined, b: string | undefined): boolean {
  const x = normalizeShort(a)
  const y = normalizeShort(b)
  // đáp án trả lời ngắn là số: chuỗi không có chữ số ("-", ",") không bao giờ được tính là khớp
  if (!/\d/.test(x) || !/\d/.test(y)) return false
  const nx = Number(x.replace(',', '.'))
  const ny = Number(y.replace(',', '.'))
  if (Number.isFinite(nx) && Number.isFinite(ny)) return Math.abs(nx - ny) < 1e-9
  return x.toLowerCase() === y.toLowerCase()
}

/** Điểm một câu theo bài làm `given` (chưa làm thì 0). */
export function scoreQuestion(q: Question, given: string | undefined): number {
  if (!given) return 0
  switch (q.type) {
    case 'trac-nghiem':
      return given === q.answer ? q.points : 0
    case 'dung-sai': {
      const n = q.options?.length ?? 0
      const key = parseTrueFalse(q.answer, n)
      if (!key) return 0
      const got = readTrueFalseAnswer(given, n)
      const right = key.filter((k, i) => got[i] === k).length
      const ratio = n === 4 ? TF_RATIO[right] : n ? right / n : 0
      return Math.round(ratio * q.points * 1000) / 1000
    }
    case 'tra-loi-ngan':
      return sameShort(given, q.answer) ? q.points : 0
    default:
      return 0
  }
}

/** Câu được trọn điểm (đúng/sai: đúng cả các ý). Câu tự luận không có đáp án tự chấm thì luôn `false`. */
export function isFullyCorrect(q: Question, given: string | undefined): boolean {
  return q.points > 0 && scoreQuestion(q, given) >= q.points
}

/** Câu có chấm tự động được không (có đáp án). */
export function isAutoGraded(q: Question): boolean {
  if (q.type === 'trac-nghiem' || q.type === 'tra-loi-ngan') return Boolean(q.answer)
  if (q.type === 'dung-sai') return parseTrueFalse(q.answer, q.options?.length ?? 0) !== null
  return false
}

/** Mô tả đáp án để hiện cho người đọc ("a) Đúng · b) Sai …", "-1,5", "B"). */
export function describeAnswer(q: Question, raw: string | undefined): string {
  if (!raw) return ''
  if (q.type === 'dung-sai') {
    const n = q.options?.length ?? 0
    return readTrueFalseAnswer(raw, n)
      .map((v, i) => `${q.options?.[i]?.key ?? String.fromCharCode(97 + i)}) ${v === null ? '—' : v ? 'Đúng' : 'Sai'}`)
      .join(' · ')
  }
  return raw
}
