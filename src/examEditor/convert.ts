/**
 * Chuyển đổi hai chiều giữa mô hình block `ExamBlock` và tài liệu TipTap (JSON).
 *
 * - `blocksToTipTap` : dùng khi nạp đề (từ AI, từ thư viện, từ JSON cũ).
 * - `tipTapToBlocks` : dùng khi lưu đề — giữ nguyên mô hình block để các
 *   module khác (xuất Word, in, thư viện) không phải đổi.
 *
 * Rich text: mọi field text trong `ExamBlock` là `RichText`
 * (`string` = plain text, `Span[]` = có marks). Chuyển đổi giữ nguyên marks
 * và `FormatAttrs` (align/lineHeight/indent/space/borders/shading).
 */
import type { JSONContent } from '@tiptap/core'
import type { ExamBlock, FormatAttrs, Mark, MarkType, RichText, Span } from '@/data/docTypes'

/* ------------------------------------------------------------------ *
 * Rich text helpers
 * ------------------------------------------------------------------ */

const MARK_TYPES: MarkType[] = [
  'bold',
  'italic',
  'underline',
  'strike',
  'sub',
  'super',
  'highlight',
  'textStyle',
  'boxed',
]

/** Đọc nội dung rich text từ một node TipTap (inline*), giữ nguyên marks. */
export function richOf(node: JSONContent | undefined): RichText {
  const spans: Span[] = []
  walkInline(node, [], spans)
  // gộp các span liền nhau cùng marks để dữ liệu gọn
  const merged: Span[] = []
  for (const s of spans) {
    const last = merged[merged.length - 1]
    if (last && sameMarks(last.marks, s.marks)) last.text += s.text
    else merged.push({ ...s })
  }
  // nếu toàn bộ là plain text không marks → trả về string cho gọn + tương thích ngược
  if (merged.length === 0) return ''
  if (merged.length === 1 && !merged[0].marks?.length) return merged[0].text
  return merged
}

/** Tách RichText thành từng dòng (mỗi dòng thành một paragraph trong cột đầu đề). */
export function splitRichLines(rt: RichText): RichText[] {
  // AI đôi khi trả mảng trộn string + span ("text" thuần lẫn {"text","marks"})
  // → chuẩn hoá phần tử string thành Span để không vỡ `.split`.
  const spans: Span[] =
    typeof rt === 'string'
      ? [{ text: rt }]
      : (rt as Array<Span | string>).map((s) => (typeof s === 'string' ? { text: s } : s))
  const lines: Span[][] = [[]]
  for (const s of spans) {
    const parts = s.text.split('\n')
    parts.forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ ...s, text: part })
    })
  }
  return lines.map((l) => {
    if (l.length === 0) return ''
    return l.length === 1 && !l[0].marks?.length ? l[0].text : l
  })
}

/** Nối các paragraph của một cột đầu đề thành RichText, xuống dòng bằng '\n'. */
function columnToRich(column: JSONContent | undefined): RichText {
  const lines = (column?.content ?? []).map((p) => richOf(p))
  if (lines.length <= 1) return lines[0] ?? ''
  const spans: Span[] = []
  lines.forEach((line, i) => {
    if (i > 0) spans.push({ text: '\n' })
    if (typeof line === 'string') {
      if (line) spans.push({ text: line })
    } else {
      spans.push(...line)
    }
  })
  return spans.every((s) => !s.marks?.length) ? spans.map((s) => s.text).join('') : spans
}

function walkInline(node: JSONContent | undefined, inherited: Mark[], out: Span[]): void {  if (!node) return
  if (node.type === 'text') {
    const marks = [...inherited, ...marksOf(node)]
    out.push({ text: node.text ?? '', ...(marks.length ? { marks } : {}) })
    return
  }
  // công thức inline → trả về đúng quy ước `$...$` của ExamBlock
  if (node.type === 'inlineMath') {
    const marks = [...inherited, ...marksOf(node)]
    out.push({
      text: `$${String(node.attrs?.latex ?? '')}$`,
      ...(marks.length ? { marks } : {}),
    })
    return
  }
  // node bọc inline như sub/superscript (nếu khai báo dạng wrapper) — gộp marks
  const extra = marksOf(node)
  const next = extra.length ? [...inherited, ...extra] : inherited
  for (const child of node.content ?? []) walkInline(child, next, out)
}

function marksOf(node: JSONContent): Mark[] {
  const out: Mark[] = []
  for (const m of node.marks ?? []) {
    if (!MARK_TYPES.includes(m.type as MarkType)) continue
    out.push({ type: m.type as MarkType, ...(m.attrs ? { attrs: m.attrs } : {}) })
  }
  return out
}

function sameMarks(a: Mark[] | undefined, b: Mark[] | undefined): boolean {
  const aa = a ?? []
  const bb = b ?? []
  if (aa.length !== bb.length) return false
  const key = (m: Mark) => `${m.type}:${JSON.stringify(m.attrs ?? {})}`
  const sa = aa.map(key).sort()
  const sb = bb.map(key).sort()
  return sa.every((k, i) => k === sb[i])
}

/** Chuyển `RichText` thành chuỗi thuần (khi cần text-only: mục lục, label…). */
export function plainText(rt: RichText): string {
  if (typeof rt === 'string') return rt
  return rt.map((s) => s.text).join('')
}

/** Đọc `FormatAttrs` từ attrs của node TipTap. */
function formatFromAttrs(attrs: Record<string, unknown> | undefined): FormatAttrs | undefined {
  if (!attrs) return undefined
  const f: FormatAttrs = {}
  if (attrs.align) f.align = attrs.align as FormatAttrs['align']
  if (attrs.lineHeight != null) f.lineHeight = Number(attrs.lineHeight)
  if (attrs.indentLeft != null) f.indentLeft = Number(attrs.indentLeft)
  if (attrs.indentFirstLine != null) f.indentFirstLine = Number(attrs.indentFirstLine)
  if (attrs.spaceBefore != null) f.spaceBefore = Number(attrs.spaceBefore)
  if (attrs.spaceAfter != null) f.spaceAfter = Number(attrs.spaceAfter)
  if (attrs.borders) f.borders = attrs.borders as FormatAttrs['borders']
  if (attrs.shading) f.shading = String(attrs.shading)
  return Object.keys(f).length ? f : undefined
}

/** Ghi `FormatAttrs` vào attrs của node TipTap. */
function attrsFromFormat(format: FormatAttrs | undefined): Record<string, unknown> {
  if (!format) return {}
  const a: Record<string, unknown> = {}
  if (format.align) a.align = format.align
  if (format.lineHeight != null) a.lineHeight = format.lineHeight
  if (format.indentLeft != null) a.indentLeft = format.indentLeft
  if (format.indentFirstLine != null) a.indentFirstLine = format.indentFirstLine
  if (format.spaceBefore != null) a.spaceBefore = format.spaceBefore
  if (format.spaceAfter != null) a.spaceAfter = format.spaceAfter
  if (format.borders) a.borders = format.borders
  if (format.shading) a.shading = format.shading
  return a
}

/* ------------------------------------------------------------------ *
 * TipTap -> Blocks
 * ------------------------------------------------------------------ */

export function tipTapToBlocks(doc: JSONContent): ExamBlock[] {
  const out: ExamBlock[] = []
  const nodes = doc.content ?? []
  // header trái/phải sinh thành 2 node `examHeader` — cần gộp lại thành 1 block
  let pendingHeader: { left?: RichText; right?: RichText } | null = null
  const flushHeader = () => {
    if (!pendingHeader) return
    out.push({ type: 'header', left: pendingHeader.left ?? '', right: pendingHeader.right ?? '' })
    pendingHeader = null
  }

  for (const node of nodes) {
    switch (node.type) {
      case 'examHeader': {
        const cols = (node.content ?? []).filter((c) => c.type === 'examHeaderColumn')
        pendingHeader = {
          left: columnToRich(cols[0]),
          right: columnToRich(cols[1]),
        }
        flushHeader()
        break
      }

      case 'examTitle':
        flushHeader()
        out.push({
          type: 'title',
          text: richOf(node),
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break

      case 'examMeta': {
        flushHeader()
        const rows: Array<[string, RichText]> = []
        for (const row of node.content ?? []) {
          const label = (row.attrs?.label as string | undefined) ?? plainText(richOf(row))
          // value = node inline của row (bỏ label attr); richOf đã lấy đúng nội dung
          const value = richOf(row)
          rows.push([label, value])
        }
        out.push({ type: 'meta', rows })
        break
      }

      case 'examStudent':
        flushHeader()
        out.push({
          type: 'student',
          text: richOf(node),
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break

      case 'examHeading':
        flushHeader()
        out.push({
          type: 'heading',
          text: richOf(node),
          level: (node.attrs?.level as 1 | 2 | 3 | undefined) ?? 1,
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break

      case 'examParagraph':
        flushHeader()
        out.push({
          type: 'paragraph',
          text: richOf(node),
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break

      case 'examBullets': {
        flushHeader()
        const levels = (node.content ?? []).map((li) => Number(li.attrs?.level) || 0)
        out.push({
          type: 'bullets',
          items: (node.content ?? []).map((li) => richOf(li)),
          ...(node.attrs?.ordered ? { ordered: true } : {}),
          ...(levels.some((l) => l > 0) ? { levels } : {}),
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break
      }

      case 'examGrid':
        flushHeader()
        out.push({
          type: 'grid',
          cols: Number(node.attrs?.cols) === 3 ? 3 : 2,
          cells: (node.content ?? []).map((cell) => richOf(cell)),
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break

      case 'examQuestion': {
        flushHeader()
        const children = node.content ?? []
        const promptNode = children.find((c) => c.type === 'examQuestionPrompt')
        const options = children
          .filter((c) => c.type === 'examOption')
          .map((c) => ({
            label: (c.attrs?.label as string | undefined) ?? '',
            text: richOf(c),
            ...(formatFromAttrs(c.attrs) ? { format: formatFromAttrs(c.attrs) } : {}),
          }))
        out.push({
          type: 'question',
          no: Number(node.attrs?.no ?? out.length + 1),
          text: richOf(promptNode),
          options,
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break
      }

      case 'examEssay': {
        flushHeader()
        const children = node.content ?? []
        const promptNode = children.find((c) => c.type === 'examEssayPrompt')
        const subs = children.filter((c) => c.type === 'examEssaySub').map((c) => richOf(c))
        out.push({
          type: 'essay',
          no: Number(node.attrs?.no ?? out.length + 1),
          text: richOf(promptNode),
          score: Number(node.attrs?.score ?? 0),
          ...(subs.length ? { sub: subs } : {}),
          ...(formatFromAttrs(node.attrs) ? { format: formatFromAttrs(node.attrs) } : {}),
        })
        break
      }

      case 'examAnswerKey': {
        flushHeader()
        out.push({ type: 'answerKey', items: answerKeyItems(node) })
        break
      }

      case 'examRubric': {
        flushHeader()
        const titleNode = (node.content ?? []).find((c) => c.type === 'examRubricTitle')
        const items = (node.content ?? [])
          .filter((c) => c.type === 'examRubricItem')
          .map((c) => ({
            label: (c.attrs?.label as string | undefined) ?? '',
            text: richOf(c),
          }))
        out.push({
          type: 'rubric',
          ...(titleNode ? { title: richOf(titleNode) } : {}),
          items,
        })
        break
      }

      case 'examPageBreak':
        flushHeader()
        out.push({ type: 'pageBreak' })
        break

      case 'examDivider':
        flushHeader()
        out.push({ type: 'divider' })
        break

      case 'paragraph': {
        flushHeader()
        const t = plainText(richOf(node)).trim()
        if (t) out.push({ type: 'paragraph', text: richOf(node) })
        break
      }

      default:
        flushHeader()
        break
    }
  }
  flushHeader()
  return out
}

/**
 * Đọc bảng đáp án từ node `examAnswerKey` (content = 1 node `table`).
 * Mỗi cặp 2 dòng: [Câu, no1, no2…] / [Đáp án, ans1, ans2…] — duyệt đúng
 * cấp table → tableRow → cell, bỏ qua dòng có ô đầu là `tableHeader` (nhãn
 * 'Câu'/'Đáp án'), nhưng VẪN đọc các ô dữ liệu phía sau trong dòng đó.
 */
function answerKeyItems(node: JSONContent): Array<{ no: number; answer: RichText }> {
  const table = (node.content ?? []).find((c) => c.type === 'table')
  const rows = table?.content ?? []
  const items: Array<{ no: number; answer: RichText }> = []
  for (let i = 0; i + 1 < rows.length; i += 2) {
    const noCells = rows[i].content ?? []
    const ansCells = rows[i + 1].content ?? []
    // ô đầu là tableHeader ('Câu'/'Đáp án') → dữ liệu bắt đầu từ ô 1
    const start = noCells[0]?.type === 'tableHeader' ? 1 : 0
    for (let j = start; j < noCells.length && j < ansCells.length; j++) {
      const no = Number(plainText(richOf(noCells[j])).trim())
      if (!Number.isFinite(no)) continue
      items.push({ no, answer: richOf(ansCells[j]) })
    }
  }
  return items
}

/* ------------------------------------------------------------------ *
 * Blocks -> TipTap
 * ------------------------------------------------------------------ */

/** Tách text thành các text node + node toán inline từ `$...$`. */
const MATH_RE = /\$([^$\n]+)\$/g

function splitMath(text: string, marks?: JSONContent['marks']): JSONContent[] {
  const out: JSONContent[] = []
  let last = 0
  for (const m of text.matchAll(MATH_RE)) {
    const idx = m.index ?? 0
    if (idx > last) {
      out.push({ type: 'text', text: text.slice(last, idx), ...(marks?.length ? { marks } : {}) })
    }
    out.push({
      type: 'inlineMath',
      attrs: { latex: m[1] },
      ...(marks?.length ? { marks } : {}),
    })
    last = idx + m[0].length
  }
  if (last < text.length) {
    out.push({ type: 'text', text: text.slice(last), ...(marks?.length ? { marks } : {}) })
  }
  return out
}

function richNodes(rt: RichText): JSONContent[] {
  if (typeof rt === 'string') return rt ? splitMath(rt) : []
  const out: JSONContent[] = []
  for (const s of rt) {
    const marks = s.marks?.length
      ? s.marks.map((m) => ({ type: m.type, ...(m.attrs ? { attrs: m.attrs } : {}) }))
      : undefined
    out.push(...splitMath(s.text, marks))
  }
  return out
}

export function blocksToTipTap(blocks: ExamBlock[]): JSONContent {
  const content: JSONContent[] = []

  for (const b of blocks) {
    switch (b.type) {
      case 'header': {
        const column = (rt: RichText): JSONContent => ({
          type: 'examHeaderColumn',
          content: splitRichLines(rt).map((line) => ({
            type: 'paragraph',
            content: richNodes(line),
          })),
        })
        content.push({
          type: 'examHeader',
          attrs: { id: `h${content.length}` },
          content: [column(b.left), column(b.right)],
        })
        break
      }

      case 'title':
        content.push({
          type: 'examTitle',
          attrs: { id: `t${content.length}`, ...attrsFromFormat(b.format) },
          content: richNodes(b.text),
        })
        break

      case 'meta':
        content.push({
          type: 'examMeta',
          attrs: { id: `m${content.length}` },
          content: b.rows.map(([label, value], i) => ({
            type: 'examMetaRow',
            attrs: { id: `mr${i}`, label },
            content: richNodes(value),
          })),
        })
        break

      case 'student':
        content.push({
          type: 'examStudent',
          attrs: { id: `st${content.length}`, ...attrsFromFormat(b.format) },
          content: richNodes(b.text),
        })
        break

      case 'heading':
        content.push({
          type: 'examHeading',
          attrs: { id: `hd${content.length}`, level: b.level ?? 1, ...attrsFromFormat(b.format) },
          content: richNodes(b.text),
        })
        break

      case 'paragraph':
        content.push({
          type: 'examParagraph',
          attrs: { id: `p${content.length}`, ...attrsFromFormat(b.format) },
          content: richNodes(b.text),
        })
        break

      case 'bullets':
        content.push({
          type: 'examBullets',
          attrs: { id: `b${content.length}`, ordered: b.ordered ?? null, ...attrsFromFormat(b.format) },
          content: b.items.map((item, i) => ({
            type: 'examBullet',
            attrs: { id: `bi${i}`, level: b.levels?.[i] || null },
            content: richNodes(item),
          })),
        })
        break

      case 'grid':
        content.push({
          type: 'examGrid',
          attrs: { id: `g${content.length}`, cols: b.cols ?? 2, ...attrsFromFormat(b.format) },
          content: b.cells.map((cell, i) => ({
            type: 'examGridCell',
            attrs: { id: `gc${i}` },
            content: richNodes(cell),
          })),
        })
        break

      case 'question':
        content.push({
          type: 'examQuestion',
          attrs: { id: `q${content.length}`, no: b.no, ...attrsFromFormat(b.format) },
          content: [
            {
              type: 'examQuestionPrompt',
              attrs: { id: `qp${content.length}` },
              content: richNodes(b.text),
            },
            ...b.options.map((o, i) => ({
              type: 'examOption',
              attrs: { id: `qo${i}`, label: o.label, ...attrsFromFormat(o.format) },
              content: richNodes(o.text),
            })),
          ],
        })
        break

      case 'essay':
        content.push({
          type: 'examEssay',
          attrs: {
            id: `es${content.length}`,
            no: b.no,
            score: b.score,
            ...attrsFromFormat(b.format),
          },
          content: [
            {
              type: 'examEssayPrompt',
              attrs: { id: `ep${content.length}` },
              content: richNodes(b.text),
            },
            ...(b.sub ?? []).map((s, i) => ({
              type: 'examEssaySub',
              attrs: { id: `es${i}` },
              content: richNodes(s),
            })),
          ],
        })
        break

      case 'answerKey': {
        const rows: JSONContent[] = []
        const cols = 10
        for (let i = 0; i < b.items.length; i += cols) {
          const slice = b.items.slice(i, i + cols)
          rows.push({
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Câu' }] }] },
              ...slice.map((it) => ({
                type: 'tableCell',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: String(it.no) }] }],
              })),
            ],
          })
          rows.push({
            type: 'tableRow',
            content: [
              { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Đáp án' }] }] },
              ...slice.map((it) => ({
                type: 'tableCell',
                content: [{ type: 'paragraph', content: richNodes(it.answer) }],
              })),
            ],
          })
        }
        content.push({
          type: 'examAnswerKey',
          attrs: { id: `ak${content.length}` },
          content: rows.length
            ? [{ type: 'table', content: rows }]
            : [{ type: 'table', content: [] }],
        })
        break
      }

      case 'rubric':
        content.push({
          type: 'examRubric',
          attrs: { id: `rb${content.length}` },
          content: [
            ...(b.title
              ? [{ type: 'examRubricTitle', attrs: { id: 'rt' }, content: richNodes(b.title) }]
              : []),
            ...b.items.map((it, i) => ({
              type: 'examRubricItem',
              attrs: { id: `ri${i}`, label: it.label },
              content: richNodes(it.text),
            })),
          ],
        })
        break

      case 'pageBreak':
        content.push({ type: 'examPageBreak', attrs: { id: `pb${content.length}` } })
        break

      case 'divider':
        content.push({ type: 'examDivider', attrs: { id: `dv${content.length}` } })
        break

      default:
        break
    }
  }

  return { type: 'doc', content }
}

/* ------------------------------------------------------------------ *
 * Mục lục
 * ------------------------------------------------------------------ */

export interface TocEntry {
  index: number
  level: number
  text: string
  /** heading = tiêu đề phần; question = một câu hỏi trong đề */
  kind: 'heading' | 'question'
  /** số thứ tự câu theo vị trí trong đề (chỉ với kind = question) */
  no?: number
}

/** Mục lục: tiêu đề phần và từng câu hỏi, theo đúng thứ tự trong đề. */
export function buildTocFromDoc(doc: JSONContent): TocEntry[] {
  const out: TocEntry[] = []
  let questionNo = 0
  ;(doc.content ?? []).forEach((node, index) => {
    if (node.type === 'examHeading' || node.type === 'examTitle') {
      const text = plainText(richOf(node)).trim()
      if (!text) return
      out.push({
        index,
        level: node.type === 'examTitle' ? 1 : ((node.attrs?.level as number) ?? 1),
        text,
        kind: 'heading',
      })
    } else if (node.type === 'examQuestion' || node.type === 'examEssay') {
      questionNo += 1
      const prompt = node.content?.find((c) => c.type?.endsWith('Prompt'))
      const text = plainText(richOf(prompt)).trim()
      out.push({ index, level: 2, text: text || '(chưa có nội dung)', kind: 'question', no: questionNo })
    }
  })
  return out
}
