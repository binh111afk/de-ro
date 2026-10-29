/**
 * Các khối mẫu dùng nhanh khi soạn đề.
 *
 * Dùng chung cho ribbon tab "Chèn" và panel "Khối mẫu" bên phải, nên nội dung
 * chỉ được định nghĩa ở một chỗ. Bố cục nhóm + cách chèn (kéo-thả, chèn cuối
 * đề) port theo tab "Mẫu đề thi" của soandethi.
 */
import type { Editor, JSONContent } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { getTopBlock, syncDomSelection } from './formatState'

export type TplGroup = 'Đầu đề' | 'Câu hỏi' | 'Nội dung' | 'Bố cục'

export interface BlockTemplate {
  id: string
  group: TplGroup
  label: string
  desc: string
  /**
   * Chèn theo vị trí đặc biệt thay vì tại con trỏ (port `insertExamFooter`
   * của soandethi): 'student' = cuối đề, lên ngay sau đầu đề nếu đề kiểu
   * THPT Quốc gia; 'footer' = cuối đề (trước phần hướng dẫn chấm nếu có).
   */
  place?: 'student' | 'footer'
  /** nội dung chèn, dạng JSONContent (hoặc mảng khi một mẫu gồm nhiều khối) */
  build: () => JSONContent | JSONContent[]
}

const t = (text: string, marks?: Array<{ type: string }>): JSONContent => ({
  type: 'text',
  text,
  ...(marks?.length ? { marks } : {}),
})
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
    group: 'Đầu đề',
    label: 'Đầu đề hai cột',
    desc: 'Sở/trường bên trái · kỳ thi bên phải',
    build: () => {
      const line = (text: string, marks?: Array<{ type: string }>) => ({
        type: 'paragraph',
        content: [t(text, marks)],
      })
      return {
        type: 'examHeader',
        attrs: { id: `h${Date.now()}` },
        content: [
          {
            type: 'examHeaderColumn',
            content: [
              line('SỞ GIÁO DỤC VÀ ĐÀO TẠO …'),
              line('TRƯỜNG THPT …'),
              line('Đề chính thức', [{ type: 'boxed' }]),
            ],
          },
          {
            type: 'examHeaderColumn',
            content: [
              line('KỲ THI …'),
              line('NĂM HỌC 20… – 20…'),
              line('Môn thi: …'),
              line('Thời gian làm bài: 90 phút (không kể thời gian phát đề)', [
                { type: 'italic' },
              ]),
            ],
          },
        ],
      }
    },
  },
  {
    id: 'title',
    group: 'Đầu đề',
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
    group: 'Đầu đề',
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
    group: 'Đầu đề',
    label: 'Thông tin thí sinh',
    desc: 'Họ tên, số báo danh — chèn cuối đề (đề THPT ở đầu)',
    place: 'student',
    build: () => ({
      type: 'examStudent',
      attrs: { id: `st${Date.now()}` },
      content: [t('Họ và tên thí sinh: …………… Số báo danh: ………')],
    }),
  },
  {
    id: 'rubric-header',
    group: 'Đầu đề',
    label: 'Đầu hướng dẫn chấm',
    desc: 'Sang trang mới + phần barem',
    build: () => [
      { type: 'examPageBreak', attrs: { id: `pb${Date.now()}` } },
      {
        type: 'examHeading',
        attrs: { id: `hd${Date.now()}`, level: 1 },
        content: [t('HƯỚNG DẪN CHẤM')],
      },
      {
        type: 'examRubric',
        attrs: { id: `rb${Date.now()}` },
        content: [
          { type: 'examRubricTitle', attrs: { id: 'rt0' }, content: [t('A. HƯỚNG DẪN CHUNG')] },
          {
            type: 'examRubricItem',
            attrs: { id: 'ri0' },
            content: [t('Thí sinh làm cách khác đúng vẫn cho điểm tối đa.')],
          },
        ],
      },
      {
        type: 'examHeading',
        attrs: { id: `hd${Date.now()}`, level: 2 },
        content: [t('B. ĐÁP ÁN VÀ THANG ĐIỂM')],
      },
    ],
  },
  {
    id: 'heading',
    group: 'Câu hỏi',
    label: 'Tiêu đề phần',
    desc: 'PHẦN I. TRẮC NGHIỆM (3,0 điểm)',
    build: () => ({
      type: 'examHeading',
      attrs: { id: `hd${Date.now()}`, level: 1 },
      content: [t('PHẦN I. TRẮC NGHIỆM (3,0 điểm)')],
    }),
  },
  {
    id: 'question',
    group: 'Câu hỏi',
    label: 'Câu trắc nghiệm',
    desc: 'Câu hỏi + 4 phương án A B C D (tự xếp cột)',
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
    group: 'Câu hỏi',
    label: 'Câu tự luận',
    desc: 'Câu hỏi có điểm + các ý',
    build: () => ({
      type: 'examEssay',
      attrs: { id: `es${Date.now()}`, no: 1, score: 1 },
      content: [
        { type: 'examEssayPrompt', attrs: { id: 'ep' }, content: [t('Nội dung câu tự luận')] },
        { type: 'examEssaySub', attrs: { id: 'es0' }, content: [t('a) …')] },
        { type: 'examEssaySub', attrs: { id: 'es1' }, content: [t('b) …')] },
      ],
    }),
  },
  {
    id: 'truefalse',
    group: 'Câu hỏi',
    label: 'Câu đúng / sai',
    desc: 'Lời dẫn + 4 ý a) b) c) d)',
    build: () => ({
      type: 'examEssay',
      attrs: { id: `es${Date.now()}`, no: 1, score: 1 },
      content: [
        { type: 'examEssayPrompt', attrs: { id: 'ep' }, content: [t('Trong mỗi ý sau, chọn đúng/sai:')] },
        { type: 'examEssaySub', attrs: { id: 'es0' }, content: [t('a) …')] },
        { type: 'examEssaySub', attrs: { id: 'es1' }, content: [t('b) …')] },
        { type: 'examEssaySub', attrs: { id: 'es2' }, content: [t('c) …')] },
        { type: 'examEssaySub', attrs: { id: 'es3' }, content: [t('d) …')] },
      ],
    }),
  },
  {
    id: 'short',
    group: 'Câu hỏi',
    label: 'Câu trả lời ngắn',
    desc: 'Nội dung + dòng đáp số',
    build: () => ({
      type: 'examEssay',
      attrs: { id: `es${Date.now()}`, no: 1, score: 1 },
      content: [
        { type: 'examEssayPrompt', attrs: { id: 'ep' }, content: [t('Nội dung câu hỏi')] },
        {
          type: 'examEssaySub',
          attrs: { id: 'es0' },
          content: [t('Đáp số: ……………', [{ type: 'italic' }])],
        },
      ],
    }),
  },
  {
    id: 'passage',
    group: 'Câu hỏi',
    label: 'Ngữ liệu / đoạn trích',
    desc: 'Lời dẫn + đoạn thơ căn giữa + tác giả',
    build: () => [
      {
        type: 'examParagraph',
        attrs: { id: `p${Date.now()}` },
        content: [t('Đọc đoạn trích sau và thực hiện các yêu cầu:')],
      },
      {
        type: 'examParagraph',
        attrs: { id: `p${Date.now()}`, align: 'center' },
        content: [t('Câu thơ thứ nhất', [{ type: 'italic' }])],
      },
      {
        type: 'examParagraph',
        attrs: { id: `p${Date.now()}`, align: 'center' },
        content: [t('Câu thơ thứ hai', [{ type: 'italic' }])],
      },
      {
        type: 'examParagraph',
        attrs: { id: `p${Date.now()}`, align: 'right' },
        content: [t('(Tác giả, Tên tác phẩm)', [{ type: 'italic' }])],
      },
    ],
  },
  {
    id: 'paragraph',
    group: 'Nội dung',
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
    group: 'Nội dung',
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
    id: 'numbered',
    group: 'Nội dung',
    label: 'Danh sách đánh số',
    desc: 'Các mục đánh số 1, 2, 3',
    build: () => ({
      type: 'examBullets',
      attrs: { id: `b${Date.now()}`, ordered: true },
      content: [
        { type: 'examBullet', attrs: { id: 'bi0' }, content: [t('Mục 1')] },
        { type: 'examBullet', attrs: { id: 'bi1' }, content: [t('Mục 2')] },
      ],
    }),
  },
  {
    id: 'multilevel',
    group: 'Nội dung',
    label: 'Danh sách nhiều cấp',
    desc: 'Mục lồng nhau — Tab để lùi vào, Shift+Tab để đưa ra',
    build: () => ({
      type: 'examBullets',
      attrs: { id: `b${Date.now()}` },
      content: [
        { type: 'examBullet', attrs: { id: 'bi0' }, content: [t('Mục cấp 1')] },
        { type: 'examBullet', attrs: { id: 'bi1', level: 1 }, content: [t('Mục cấp 2')] },
        { type: 'examBullet', attrs: { id: 'bi2', level: 2 }, content: [t('Mục cấp 3')] },
      ],
    }),
  },
  {
    id: 'grid2',
    group: 'Nội dung',
    label: 'Lưới 2 cột',
    desc: 'Hai khối nội dung cạnh nhau',
    build: () => ({
      type: 'examGrid',
      attrs: { id: `g${Date.now()}`, cols: 2 },
      content: [
        { type: 'examGridCell', attrs: { id: 'gc0' }, content: [t('Cột 1')] },
        { type: 'examGridCell', attrs: { id: 'gc1' }, content: [t('Cột 2')] },
      ],
    }),
  },
  {
    id: 'grid3',
    group: 'Nội dung',
    label: 'Lưới 3 cột',
    desc: 'Ba khối nội dung cạnh nhau',
    build: () => ({
      type: 'examGrid',
      attrs: { id: `g${Date.now()}`, cols: 3 },
      content: [
        { type: 'examGridCell', attrs: { id: 'gc0' }, content: [t('Cột 1')] },
        { type: 'examGridCell', attrs: { id: 'gc1' }, content: [t('Cột 2')] },
        { type: 'examGridCell', attrs: { id: 'gc2' }, content: [t('Cột 3')] },
      ],
    }),
  },
  {
    id: 'answerKey',
    group: 'Nội dung',
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
    group: 'Nội dung',
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
    id: 'end',
    group: 'Bố cục',
    label: 'Dòng HẾT',
    desc: '--------- HẾT --------- căn giữa',
    build: () => ({
      type: 'examParagraph',
      attrs: { id: `p${Date.now()}`, align: 'center' },
      content: [t('--------- HẾT ---------', [{ type: 'bold' }])],
    }),
  },
  {
    id: 'divider',
    group: 'Bố cục',
    label: 'Đường kẻ',
    desc: 'Kẻ ngang ở cuối đề',
    place: 'footer',
    build: () => ({ type: 'examDivider', attrs: { id: `dv${Date.now()}` } }),
  },
  {
    id: 'pageBreak',
    group: 'Bố cục',
    label: 'Ngắt trang',
    desc: 'Đẩy nội dung sang trang sau',
    build: () => ({ type: 'examPageBreak', attrs: { id: `pb${Date.now()}` } }),
  },
]

/** Tìm template theo id. */
export function templateById(id: string): BlockTemplate | undefined {
  return BLOCK_TEMPLATES.find((tpl) => tpl.id === id)
}

/** MIME dùng khi kéo khối mẫu từ nav panel vào trang. */
export const BLOCK_TEMPLATE_MIME = 'application/x-exam-block'

/**
 * Vị trí "cuối đề" — port `insertExamFooter` của soandethi: ngay trước phần
 * hướng dẫn chấm / đáp án (nhảy lùi qua pageBreak đứng liền trước). Với
 * 'student': đề có đầu đề kiểu THPT Quốc gia thì chèn ngay sau đầu đề.
 */
export function examFooterPos(doc: PMNode, place: 'student' | 'footer'): number {
  let boundary = doc.content.size
  let afterHeader = 0
  let thptQG = false
  doc.forEach((node, offset) => {
    if (offset >= boundary) return
    const text = node.textContent.trim()
    if (
      node.type.name === 'examRubric' ||
      node.type.name === 'examAnswerKey' ||
      /^(?:HƯỚNG DẪN CHẤM|ĐÁP ÁN|LỜI GIẢI)/i.test(text)
    ) {
      boundary = offset
      return
    }
    if (node.type.name === 'examHeader' && !afterHeader) {
      afterHeader = offset + node.nodeSize
      thptQG =
        /THPT\s+QUỐC\s+GIA|TỐT\s+NGHIỆP\s+(?:THPT|TRUNG\s+HỌC\s+PHỔ\s+THÔNG)/i.test(
          node.textContent,
        )
    }
  })
  let pos = boundary
  const before = doc.resolve(pos).nodeBefore
  if (before?.type.name === 'examPageBreak') pos -= before.nodeSize
  return place === 'student' && thptQG ? afterHeader : pos
}

/**
 * Chèn khối mẫu — đường chèn duy nhất cho cả ribbon và nav panel.
 *
 * Theo thứ tự: đề trống → thay toàn bộ; mẫu có `place` → vị trí cuối đề;
 * đoạn văn cấp cao nhất đang trống → thay thế đoạn đó (không để sót đoạn
 * trống); còn lại → chèn sau khối cấp cao nhất đang chứa con trỏ.
 */
export function insertBlockTemplate(editor: Editor, tpl: BlockTemplate): void {
  if (editor.isDestroyed) return
  syncDomSelection(editor)
  const json = tpl.build()
  const { doc } = editor.state

  if (doc.childCount === 1 && doc.firstChild?.type.name === 'paragraph' && doc.firstChild.content.size === 0) {
    // thay toàn bộ doc (giống insertExamFooter của bản gốc) — insertContentAt
    // với range 0..size vẫn để sót paragraph rỗng phía sau
    editor.chain().setContent({ type: 'doc', content: Array.isArray(json) ? json : [json] }, { emitUpdate: true }).run()
    // setContent có thể để lại AllSelection (chọn cả doc) → đặt con trỏ về cuối
    editor.chain().focus('end').run()
    return
  }
  if (tpl.place) {
    editor.chain().focus().insertContentAt(examFooterPos(doc, tpl.place), json).run()
    return
  }
  const target = getTopBlock(editor)
  if (!target) {
    editor.chain().focus().insertContent(json).run()
    return
  }
  if (target.node.type.name === 'paragraph' && target.node.content.size === 0) {
    editor
      .chain()
      .focus()
      .insertContentAt({ from: target.pos, to: target.pos + target.node.nodeSize }, json)
      .run()
    return
  }
  editor.chain().focus().insertContentAt(target.pos + target.node.nodeSize, json).run()
}
