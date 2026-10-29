/**
 * Mô hình tài liệu đề thi — dùng chung cho AI sinh đề, editor rich-text và xuất Word.
 * Một đề là một danh sách block có thứ tự, mỗi block có `type` riêng.
 */

/* ------------------------------------------------------------------ *
 * Rich text — văn bản có định dạng inline
 * ------------------------------------------------------------------ */

export type MarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'sub'
  | 'super'
  | 'highlight'
  | 'textStyle'
  | 'boxed'

export interface Mark {
  type: MarkType
  /** Với 'textStyle': { fontFamily?, fontSize?, color?, highlight? } */
  attrs?: Record<string, unknown>
}

/** Một đoạn văn bản liền nhau dùng chung một bộ mark. */
export interface Span {
  text: string
  marks?: Mark[]
}

/**
 * Nội dung văn bản của một block/đoạn con.
 * `string` = văn bản thuần (tương thích ngược với dữ liệu cũ), `Span[]` = rich text.
 */
export type RichText = string | Span[]

/** Thuộc tính định dạng cấp đoạn (tương ứng pPr của Word). */
export interface FormatAttrs {
  align?: 'left' | 'center' | 'right' | 'justify'
  /** hướng viết: trái→phải hoặc phải→trái (RTL) */
  dir?: 'ltr' | 'rtl'
  lineHeight?: number
  indentLeft?: number
  indentFirstLine?: number
  spaceBefore?: number
  spaceAfter?: number
  borders?: 'top' | 'bottom' | 'left' | 'right' | 'box' | 'none'
  shading?: string
}

export type BlockType =
  | 'header'
  | 'title'
  | 'meta'
  | 'student'
  | 'heading'
  | 'paragraph'
  | 'bullets'
  | 'grid'
  | 'question'
  | 'essay'
  | 'answerKey'
  | 'rubric'
  | 'pageBreak'
  | 'divider'

export interface HeaderBlock {
  type: 'header'
  left: RichText
  right: RichText
}

export interface TitleBlock {
  type: 'title'
  text: RichText
  format?: FormatAttrs
}

export interface MetaBlock {
  type: 'meta'
  rows: Array<[string, RichText]>
}

export interface StudentBlock {
  type: 'student'
  text: RichText
  format?: FormatAttrs
}

export interface HeadingBlock {
  type: 'heading'
  text: RichText
  level?: 1 | 2 | 3
  format?: FormatAttrs
}

export interface ParagraphBlock {
  type: 'paragraph'
  text: RichText
  format?: FormatAttrs
}

export interface BulletsBlock {
  type: 'bullets'
  items: RichText[]
  /** đánh số 1, 2, 3… thay vì gạch đầu dòng */
  ordered?: boolean
  /** cấp lồng của từng mục (0–2), cùng độ dài với `items`; bỏ qua nếu không có */
  levels?: number[]
  format?: FormatAttrs
}

/** Lưới nhiều cột — xếp nội dung ngắn cạnh nhau (ý nhỏ, hình, đáp án phụ). */
export interface GridBlock {
  type: 'grid'
  /** số cột, 2 hoặc 3 */
  cols: 2 | 3
  cells: RichText[]
  format?: FormatAttrs
}

export interface QuestionBlock {
  type: 'question'
  no: number
  text: RichText
  options: Array<{ label: string; text: RichText; format?: FormatAttrs }>
  /** định dạng cho prompt (câu hỏi); format cho từng option nằm trong options[i] */
  format?: FormatAttrs
}

export interface EssayBlock {
  type: 'essay'
  no: number
  text: RichText
  score: number
  sub?: RichText[]
  format?: FormatAttrs
}

export interface AnswerKeyBlock {
  type: 'answerKey'
  items: Array<{ no: number; answer: RichText }>
}

export interface RubricBlock {
  type: 'rubric'
  title?: RichText
  items: Array<{ label: string; text: RichText }>
}

export interface PageBreakBlock {
  type: 'pageBreak'
}

export interface DividerBlock {
  type: 'divider'
}

export type ExamBlock =
  | HeaderBlock
  | TitleBlock
  | MetaBlock
  | StudentBlock
  | HeadingBlock
  | ParagraphBlock
  | BulletsBlock
  | GridBlock
  | QuestionBlock
  | EssayBlock
  | AnswerKeyBlock
  | RubricBlock
  | PageBreakBlock
  | DividerBlock

/** Loại tài liệu — quyết định icon hiển thị trên tab và thẻ loại ở trang bắt đầu. */
export type DocKind = 'exam' | 'slide' | 'sheet'

export interface ExamDoc {
  id: string
  title: string
  /** loại tài liệu — mặc định 'exam' (đề thi) */
  kind?: DocKind
  subject: string
  grade: string
  term: string
  schoolYear: string
  duration: string
  unit: string
  authority: string
  blocks: ExamBlock[]
  /** tiêu đề hiển thị trên tab */
  createdAt: string
  updatedAt: string
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export function emptyDoc(overrides: Partial<ExamDoc> = {}): ExamDoc {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: 'Đề thi mới',
    subject: 'Toán',
    grade: 'Lớp 9',
    term: 'Giữa kỳ I',
    schoolYear: '2025 – 2026',
    duration: '90 phút',
    unit: 'TRƯỜNG THCS …',
    authority: 'UBND XÃ/PHƯỜNG …',
    blocks: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
