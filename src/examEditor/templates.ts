/**
 * Các khối mẫu dùng nhanh khi soạn đề.
 *
 * Dùng chung cho ribbon tab "Chèn" và panel "Khối mẫu" bên phải, nên nội dung
 * chỉ được định nghĩa ở một chỗ.
 */
import type { JSONContent } from '@tiptap/core'

export interface BlockTemplate {
  id: string
  label: string
  desc: string
  /** nội dung chèn, dạng JSONContent */
  build: () => JSONContent
}

const t = (text: string): JSONContent => ({ type: 'text', text })
const p = (text: string): JSONContent => ({ type: 'paragraph', content: [t(text)] })

/** Bảng 2 cột dùng cho bảng đáp án. */
function answerKeyTable(): JSONContent {
  return {
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: [
          { type: 'tableHeader', content: [p('Câu')] },
          { type: 'tableCell', content: [p('1')] },
          { type: 'tableCell', content: [p('2')] },
        ],
      },
      {
        type: 'tableRow',
        content: [
          { type: 'tableHeader', content: [p('Đáp án')] },
          { type: 'tableCell', content: [p('A')] },
          { type: 'tableCell', content: [p('B')] },
        ],
      },
    ],
  }
}

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    id: 'header',
    label: 'Đầu trang đề',
    desc: 'Cơ quan chủ quản | Tên trường',
    build: () => ({
      type: 'examHeader',
      attrs: { id: `h${Date.now()}`, side: 'left' },
      content: [t('CƠ QUAN CHỦ QUẢN')],
    }),
  },
  {
    id: 'title',
    label: 'Tiêu đề đề',
    desc: 'ĐỀ KIỂM TRA …',
    build: () => ({
      type: 'examTitle',
      attrs: { id: `t${Date.now()}` },
      content: [t('ĐỀ KIỂM TRA GIỮA KỲ I')],
    }),
  },
  {
    id: 'meta',
    label: 'Thông tin đề',
    desc: 'Năm học, môn, thời gian',
    build: () => ({
      type: 'examMeta',
      attrs: { id: `m${Date.now()}` },
      content: [
        { type: 'examMetaRow', attrs: { label: 'Năm học' }, content: [t('2025 – 2026')] },
        { type: 'examMetaRow', attrs: { label: 'Môn' }, content: [t('Toán – Lớp 9')] },
        { type: 'examMetaRow', attrs: { label: 'Thời gian' }, content: [t('90 phút')] },
      ],
    }),
  },
  {
    id: 'student',
    label: 'Thông tin thí sinh',
    desc: 'Họ tên, số báo danh',
    build: () => ({
      type: 'examStudent',
      attrs: { id: `st${Date.now()}` },
      content: [t('Họ và tên thí sinh: …………… Số báo danh: ………')],
    }),
  },
  {
    id: 'heading',
    label: 'Tiêu đề phần',
    desc: 'PHẦN I. TRẮC NGHIỆM KHÁCH QUAN',
    build: () => ({
      type: 'examHeading',
      attrs: { id: `hd${Date.now()}`, level: 1 },
      content: [t('PHẦN I. TRẮC NGHIỆM KHÁCH QUAN')],
    }),
  },
  {
    id: 'paragraph',
    label: 'Đoạn văn',
    desc: 'Đoạn hướng dẫn làm bài',
    build: () => ({
      type: 'examParagraph',
      attrs: { id: `p${Date.now()}` },
      content: [t('Hãy chọn chữ cái đứng trước phương án trả lời đúng nhất.')],
    }),
  },
  {
    id: 'bullets',
    label: 'Danh sách',
    desc: 'Các mục gạch đầu dòng',
    build: () => ({
      type: 'examBullets',
      attrs: { id: `b${Date.now()}` },
      content: [
        { type: 'examBullet', attrs: { id: 'bi0' }, content: [t('Mục 1')] },
        { type: 'examBullet', attrs: { id: 'bi1' }, content: [t('Mục 2')] },
      ],
    }),
  },
  {
    id: 'question',
    label: 'Câu trắc nghiệm',
    desc: 'Câu hỏi + 4 phương án A B C D',
    build: () => ({
      type: 'examQuestion',
      attrs: { id: `q${Date.now()}`, no: 1 },
      content: [
        { type: 'examQuestionPrompt', attrs: { id: 'qp' }, content: [t('Nội dung câu hỏi')] },
        { type: 'examOption', attrs: { id: 'qo0', label: 'A' }, content: [t('Phương án A')] },
        { type: 'examOption', attrs: { id: 'qo1', label: 'B' }, content: [t('Phương án B')] },
        { type: 'examOption', attrs: { id: 'qo2', label: 'C' }, content: [t('Phương án C')] },
        { type: 'examOption', attrs: { id: 'qo3', label: 'D' }, content: [t('Phương án D')] },
      ],
    }),
  },
  {
    id: 'essay',
    label: 'Câu tự luận',
    desc: 'Bài tự luận có điểm',
    build: () => ({
      type: 'examEssay',
      attrs: { id: `es${Date.now()}`, no: 1, score: 2 },
      content: [
        { type: 'examEssayPrompt', attrs: { id: 'ep' }, content: [t('Nội dung bài tự luận')] },
      ],
    }),
  },
  {
    id: 'answerKey',
    label: 'Bảng đáp án',
    desc: 'Bảng Câu / Đáp án',
    build: () => ({
      type: 'examAnswerKey',
      attrs: { id: `ak${Date.now()}` },
      content: [answerKeyTable()],
    }),
  },
  {
    id: 'rubric',
    label: 'Thang điểm',
    desc: 'Hướng dẫn chấm và thang điểm',
    build: () => ({
      type: 'examRubric',
      attrs: { id: `rb${Date.now()}` },
      content: [
        { type: 'examRubricTitle', attrs: { id: 'rt' }, content: [t('A. HƯỚNG DẪN CHUNG')] },
        {
          type: 'examRubricItem',
          attrs: { id: 'ri0', label: '1.' },
          content: [t('Ý đúng — 1,0 điểm')],
        },
      ],
    }),
  },
  {
    id: 'divider',
    label: 'Đường kẻ',
    desc: 'Kẻ ngang giữa các phần',
    build: () => ({ type: 'examDivider', attrs: { id: `dv${Date.now()}` } }),
  },
  {
    id: 'pageBreak',
    label: 'Ngắt trang',
    desc: 'Đẩy nội dung sang trang sau',
    build: () => ({ type: 'examPageBreak', attrs: { id: `pb${Date.now()}` } }),
  },
]

/** Tìm template theo id. */
export function templateById(id: string): BlockTemplate | undefined {
  return BLOCK_TEMPLATES.find((tpl) => tpl.id === id)
}
