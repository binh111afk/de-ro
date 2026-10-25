/**
 * Schema TipTap cho tài liệu đề thi.
 *
 * Mỗi node cấp cao nhất tương ứng 1 `ExamBlock` — nhờ vậy:
 *   - vòng lặp AI sửa doc không cần biết cấu trúc đề, chỉ thao tác node;
 *   - phân trang A4 đo theo khối top-level (giống GenOffice `pagination-slices`);
 *   - chuyển đổi hai chiều với mô hình `ExamBlock` cũ vẫn giữ được.
 *
 * Node đặc biệt: `answerKey` và `rubric` là bảng (render bằng node table chuẩn
 * của TipTap) nên mọi ô đều sửa trực tiếp được trong editor.
 */
import { Mark, Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import katex from 'katex'

/** Thuộc tính chung: id để AI/undo tham chiếu ổn định. */
export interface ExamNodeAttrs {
  id?: string
  [key: string]: unknown
}

// id node nội bộ của editor (tham chiếu undo/AI) — không dùng cho bảo mật
const uid = () => Math.random().toString(36).slice(2, 10)

/* ------------------------------------------------------------------ *
 * Marks bổ sung (StarterKit chỉ có bold/italic/strike; underline,
 * highlight, textStyle đến từ extension riêng)
 * ------------------------------------------------------------------ */

export const UnderlineMark = Mark.create({
  name: 'underline',
  parseHTML() {
    return [{ tag: 'u' }, { style: 'text-decoration', consuming: false }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(HTMLAttributes), 0]
  },
  addCommands() {
    return {
      toggleUnderline:
        () =>
        ({ commands }) => commands.toggleMark(this.name),
      unsetUnderline:
        () =>
        ({ commands }) => commands.unsetMark(this.name),
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    underline: {
      setUnderline: () => ReturnType
      toggleUnderline: () => ReturnType
      unsetUnderline: () => ReturnType
    }
  }
}

export const SubscriptMark = Mark.create({
  name: 'sub',
  parseHTML() {
    return [{ tag: 'sub' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['sub', mergeAttributes(HTMLAttributes), 0]
  },
})

export const SuperscriptMark = Mark.create({
  name: 'super',
  parseHTML() {
    return [{ tag: 'sup' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes), 0]
  },
})

/* ------------------------------------------------------------------ *
 * Format attrs chung cho mọi node text-bearing (tương ứng pPr của Word)
 * ------------------------------------------------------------------ */

function formatAttrs() {
  return {
    align: { default: null },
    dir: { default: null },
    lineHeight: { default: null },
    indentLeft: { default: null },
    indentFirstLine: { default: null },
    spaceBefore: { default: null },
    spaceAfter: { default: null },
    borders: { default: null },
    shading: { default: null },
  }
}

/**
 * Chuyển attrs cấp đoạn thành chuỗi CSS inline.
 *
 * Phải trả về **chuỗi**, không phải object: `mergeAttributes` của TipTap parse
 * `style` bằng `parseStyleEntries` — chỉ hiểu chuỗi "prop: value; ...". Truyền
 * object sẽ bị nuốt thành rỗng và mọi định dạng cấp đoạn (thụt lề, đổ bóng,
 * viền…) im lặng biến mất.
 */
function formatStyle(attrs: Record<string, unknown>): string {
  const s: Record<string, string> = {}
  const align = attrs.textAlign ?? attrs.align
  if (align) s['text-align'] = String(align)
  if (attrs.dir) s['direction'] = String(attrs.dir)
  if (attrs.lineHeight != null) s['line-height'] = String(attrs.lineHeight)
  if (attrs.indentLeft != null) s['margin-left'] = `${Number(attrs.indentLeft)}px`
  if (attrs.indentFirstLine != null) s['text-indent'] = `${Number(attrs.indentFirstLine)}px`
  if (attrs.spaceBefore != null) s['margin-top'] = `${Number(attrs.spaceBefore)}px`
  if (attrs.spaceAfter != null) s['margin-bottom'] = `${Number(attrs.spaceAfter)}px`
  if (attrs.shading) s['background-color'] = String(attrs.shading)
  const b = attrs.borders as string | null | undefined
  if (b && b !== 'none') {
    const w = '1px solid #000'
    if (b === 'box') s.border = w
    else if (b === 'top') s['border-top'] = w
    else if (b === 'bottom') s['border-bottom'] = w
    else if (b === 'left') s['border-left'] = w
    else if (b === 'right') s['border-right'] = w
  }
  return Object.entries(s)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ')
}

/**
 * `paragraph` của StarterKit chỉ có `textAlign` — thiếu `indentLeft`,
 * `shading`, `borders`… nên các nút thụt lề / đổ bóng / viền rơi vào im lặng
 * khi đoạn đang đứng là paragraph (ô bảng, dòng trả lời…).
 * Bản này thay thế nó: thêm đủ `formatAttrs` và render chúng ra inline style.
 */
export const BaseParagraphNode = Node.create({
  name: 'paragraph',
  priority: 1000,
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      textAlign: { default: null },
      ...formatAttrs(),
    }
  },
  parseHTML() {
    return [{ tag: 'p' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    // Đọc thẳng `node.attrs` chứ không dựa vào `HTMLAttributes`: TipTap chỉ
    // đưa attribute có `rendered: true` vào đó, và các attr định dạng cấp đoạn
    // của node này không đi qua đường đó.
    const { textAlign, ...rest } = {
      ...(node.attrs as Record<string, unknown>),
      ...(HTMLAttributes as Record<string, unknown>),
    }
    return [
      'p',
      mergeAttributes(
        textAlign ? { style: `text-align: ${textAlign}` } : {},
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
    }
  },
})

/** Node chỉ chứa văn bản trong một đoạn (title, heading, paragraph…). */
function textBlock(name: string, group: string, extra?: Record<string, unknown>) {
  return Node.create({
    name,
    group,
    content: 'inline*',
    defining: true,
    addAttributes() {
      return {
        id: { default: null },
        ...formatAttrs(),
        ...(extra ?? {}),
      }
    },
    parseHTML() {
      return [{ tag: `div[data-exam-node="${name}"]` }]
    },
    renderHTML({ HTMLAttributes }) {
      const { id, ...rest } = HTMLAttributes as Record<string, unknown>
      return [
        'div',
        mergeAttributes(
          { 'data-exam-node': name, ...(id ? { 'data-id': id } : {}) },
          { style: formatStyle(rest) },
        ),
        0,
      ]
    },
  })
}

/* ------------------------------------------------------------------ *
 * Node cụ thể
 * ------------------------------------------------------------------ */

/**
 * Đầu đề 2 cột — một block chứa đúng 2 `examHeaderColumn`, mỗi cột là các
 * paragraph thật (port từ soandethi). Nhờ vậy xuống dòng là chủ động, mỗi dòng
 * mang định dạng riêng (ví dụ dòng "ĐỀ CHÍNH THỨC" có mark `boxed`).
 */
export const HeaderNode = Node.create({
  name: 'examHeader',
  group: 'block',
  content: 'examHeaderColumn examHeaderColumn',
  defining: true,
  addAttributes() {
    return { id: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examHeader"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes({ 'data-exam-node': 'examHeader', ...(id ? { 'data-id': id } : {}) }),
      0,
    ]
  },
})

export const HeaderColumnNode = Node.create({
  name: 'examHeaderColumn',
  content: 'paragraph+',
  isolating: true,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="headerCol"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'headerCol' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

/** Tiêu đề đề — h1 căn giữa, in hoa. */
export const TitleNode = textBlock('examTitle', 'block')

/** Khối thông tin (năm học, môn, thời gian) — mỗi dòng là một `examMetaRow`. */
export const MetaNode = Node.create({
  name: 'examMeta',
  group: 'block',
  content: 'examMetaRow+',
  defining: true,
  addAttributes() {
    return { id: { default: null }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examMeta"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examMeta', ...(id ? { 'data-id': id } : {}) },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

export const MetaRowNode = Node.create({
  name: 'examMetaRow',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return { label: { default: '' }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examMetaRow"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { label, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes({ 'data-exam-node': 'examMetaRow', 'data-label': label }, { style: formatStyle(rest) }),
      0,
    ]
  },
})

/** Thông tin thí sinh. */
export const StudentNode = textBlock('examStudent', 'block')

/** Tiêu đề phần (PHẦN I. TRẮC NGHIỆM…). */
export const HeadingNode = textBlock('examHeading', 'block', { level: { default: 1 } })

export const ParagraphNode = textBlock('examParagraph', 'block')

/** Ngắt trang cứng. */
export const PageBreakNode = Node.create({
  name: 'examPageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return { id: { default: null }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examPageBreak"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        {
          'data-exam-node': 'examPageBreak',
          class: 'exam-pagebreak',
          ...(id ? { 'data-id': id } : {}),
        },
        { style: formatStyle(rest) },
      ),
    ]
  },
})

/** Danh sách gạch đầu dòng. */
export const BulletsNode = Node.create({
  name: 'examBullets',
  group: 'block',
  content: 'examBullet+',
  defining: true,
  addAttributes() {
    return { id: { default: null }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examBullets"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examBullets', ...(id ? { 'data-id': id } : {}) },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

export const BulletNode = Node.create({
  name: 'examBullet',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examBullet"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examBullet' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

/** Lưới nhiều cột — mỗi ô là một `examGridCell`. */
export const GridNode = Node.create({
  name: 'examGrid',
  group: 'block',
  content: 'examGridCell+',
  defining: true,
  addAttributes() {
    return { id: { default: null }, cols: { default: 2 }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examGrid"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, cols, ...rest } = HTMLAttributes as Record<string, unknown>
    const n = Math.min(3, Math.max(2, Number(cols) || 2))
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examGrid', 'data-cols': n, ...(id ? { 'data-id': id } : {}) },
        {
          // số cột đặt inline để đổi được ngay khi sửa thuộc tính
          style: `grid-template-columns: repeat(${n}, minmax(0, 1fr));${formatStyle(rest)}`,
        },
      ),
      0,
    ]
  },
})

export const GridCellNode = Node.create({
  name: 'examGridCell',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examGridCell"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examGridCell' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

/** Câu trắc nghiệm: prompt + các phương án A/B/C/D. */
export const QuestionNode = Node.create({
  name: 'examQuestion',
  group: 'block',
  content: 'examQuestionPrompt examOption*',
  defining: true,
  addAttributes() {
    return { id: { default: null }, no: { default: 1 }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examQuestion"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, no, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examQuestion', ...(id ? { 'data-id': id } : {}), 'data-no': no },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

export const QuestionPromptNode = Node.create({
  name: 'examQuestionPrompt',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examQuestionPrompt"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examQuestionPrompt' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

/** Một phương án: `label` (A/B/C/D) + nội dung. */
export const OptionNode = Node.create({
  name: 'examOption',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return { label: { default: 'A' }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examOption"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { label, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examOption', 'data-label': label },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

/** Câu tự luận: prompt + các ý nhỏ (sub). */
export const EssayNode = Node.create({
  name: 'examEssay',
  group: 'block',
  content: 'examEssayPrompt examEssaySub*',
  defining: true,
  addAttributes() {
    return { id: { default: null }, no: { default: 1 }, score: { default: 0 }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examEssay"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, no, score, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        {
          'data-exam-node': 'examEssay',
          ...(id ? { 'data-id': id } : {}),
          'data-no': no,
          'data-score': score,
        },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

export const EssayPromptNode = Node.create({
  name: 'examEssayPrompt',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examEssayPrompt"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examEssayPrompt' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

export const EssaySubNode = Node.create({
  name: 'examEssaySub',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examEssaySub"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examEssaySub' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

/** Đường kẻ ngang. */
export const DividerNode = Node.create({
  name: 'examDivider',
  group: 'block',
  atom: true,
  selectable: true,
  addAttributes() {
    return { id: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'hr[data-exam-node="examDivider"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(HTMLAttributes, { 'data-exam-node': 'examDivider' })]
  },
})

/* ------------------------------------------------------------------ *
 * Bảng đáp án / thang điểm
 * ------------------------------------------------------------------ *
 * Dùng node table chuẩn của TipTap: ô nào cũng sửa được, AI có thể
 * chèn/xoá ô, và phân trang đo được như mọi khối khác.
 */
export const AnswerKeyNode = Node.create({
  name: 'examAnswerKey',
  group: 'block',
  content: 'table',
  defining: true,
  addAttributes() {
    return { id: { default: null }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examAnswerKey"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examAnswerKey', ...(id ? { 'data-id': id } : {}) },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

export const RubricNode = Node.create({
  name: 'examRubric',
  group: 'block',
  content: 'examRubricTitle? examRubricItem+',
  defining: true,
  addAttributes() {
    return { id: { default: null }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examRubric"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { id, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examRubric', ...(id ? { 'data-id': id } : {}) },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

export const RubricTitleNode = Node.create({
  name: 'examRubricTitle',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return formatAttrs()
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examRubricTitle"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examRubricTitle' },
        { style: formatStyle(HTMLAttributes as Record<string, unknown>) },
      ),
      0,
    ]
  },
})

export const RubricItemNode = Node.create({
  name: 'examRubricItem',
  content: 'inline*',
  defining: false,
  addAttributes() {
    return { label: { default: '' }, ...formatAttrs() }
  },
  parseHTML() {
    return [{ tag: 'div[data-exam-node="examRubricItem"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const { label, ...rest } = HTMLAttributes as Record<string, unknown>
    return [
      'div',
      mergeAttributes(
        { 'data-exam-node': 'examRubricItem', 'data-label': label },
        { style: formatStyle(rest) },
      ),
      0,
    ]
  },
})

/* ------------------------------------------------------------------ *
 * Danh sách node
 * ------------------------------------------------------------------ */

/** Khung viền quanh một cụm chữ — dùng cho dòng "ĐỀ CHÍNH THỨC". */
export const BoxedMark = Mark.create({
  name: 'boxed',
  parseHTML() {
    return [
      { tag: 'span[data-boxed]' },
      { style: 'border', consuming: false },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-boxed': '', class: 'doc-boxed' }),
      0,
    ]
  },
})

export const EXAM_MARKS = [UnderlineMark, SubscriptMark, SuperscriptMark, BoxedMark]

/**
 * Công thức toán inline `$...$` — atom, render bằng KaTeX ngay trong editor.
 *
 * Mô hình lưu bền vững KHÔNG đổi: `ExamBlock` vẫn là text `$latex$`; converter
 * tách chuỗi thành node này khi dựng editor và nối lại khi lưu. Nhờ vậy Word /
 * bản in / trang xem `/de/:id` giữ đúng quy ước `$...$` sẵn có.
 */
export const InlineMathNode = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { latex: { default: '' } }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-inline-math]',
        getAttrs: (el) => ({
          latex: (el as HTMLElement).getAttribute('data-inline-math') ?? '',
        }),
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    const latex = String((HTMLAttributes as Record<string, unknown>).latex ?? '')
    return ['span', { 'data-inline-math': latex, class: 'inline-math' }, latex]
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.className = 'inline-math'
      dom.contentEditable = 'false'
      let current = node
      const paint = () => {
        dom.dataset.inlineMath = String(current.attrs.latex ?? '')
        try {
          dom.innerHTML = katex.renderToString(String(current.attrs.latex ?? ''), {
            throwOnError: false,
            strict: false,
            output: 'html',
            trust: false,
          })
        } catch {
          dom.textContent = `$${current.attrs.latex}$`
        }
      }
      paint()
      return {
        dom,
        update: (updated) => {
          if (updated.type.name !== 'inlineMath') return false
          if (updated.attrs.latex === current.attrs.latex) return true
          current = updated
          paint()
          return true
        },
      }
    }
  },
  addInputRules() {
    // gõ `$x^2$` trong editor → chuyển ngay thành công thức
    return [nodeInputRule({ find: /\$([^$\n]+)\$$/, type: this.type, getAttributes: (m) => ({ latex: m[1] }) })]
  },
})

/** Ảnh chèn inline trong khối đề (base64 data URL). */
export const ImageNode = Node.create({
  name: 'image',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: null },
    }
  },
  parseHTML() {
    return [{ tag: 'img[data-exam-image]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes({ 'data-exam-image': '' }, HTMLAttributes)]
  },
  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; width?: number }) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    }
  },
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    setImage: {
      setImage: (options: { src: string; alt?: string; width?: number }) => ReturnType
    }
  }
}

export const EXAM_NODES = [
  HeaderNode,
  HeaderColumnNode,
  TitleNode,
  MetaNode,
  MetaRowNode,
  StudentNode,
  HeadingNode,
  ParagraphNode,
  BulletsNode,  BulletNode,
  GridNode,
  GridCellNode,
  QuestionNode,
  QuestionPromptNode,
  OptionNode,
  EssayNode,
  EssayPromptNode,
  EssaySubNode,
  PageBreakNode,
  DividerNode,
  AnswerKeyNode,
  RubricNode,
  RubricTitleNode,
  RubricItemNode,
  ImageNode,
  InlineMathNode,
]

/** Node cấp cao nhất — đơn vị đo cho phân trang A4. */
export const TOP_LEVEL_EXAM_NODES = [
  'examHeader',
  'examTitle',
  'examMeta',
  'examStudent',
  'examHeading',
  'examParagraph',
  'examBullets',
  'examQuestion',
  'examEssay',
  'examPageBreak',
  'examDivider',
  'examAnswerKey',
  'examRubric',
] as const

/**
 * Mọi node chứa inline text — TextAlign/LineHeight phải đăng ký cho tất cả,
 * không chỉ node cấp cao nhất, nếu không prompt/option/bullet không căn lề được.
 */
export const TEXT_CONTENT_NODES = [
  ...TOP_LEVEL_EXAM_NODES,
  'examMetaRow',
  'examBullet',
  'examGridCell',
  'examQuestionPrompt',
  'examOption',
  'examEssayPrompt',
  'examEssaySub',
  'examRubricTitle',
  'examRubricItem',
] as const

export { uid as newExamNodeId }
