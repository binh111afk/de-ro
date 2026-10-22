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

function walkInline(node: JSONContent | undefined, inherited: Mark[], out: Span[]): void {
  if (!node) return
  if (node.type === 'text') {
    const marks = [...inherited, ...marksOf(node)]
    out.push({ text: node.text ?? '', ...(marks.length ? { marks } : {}) })
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
        const side = (node.attrs?.side as string | undefined) ?? 'left'
        const text = richOf(node)
        if (!pendingHeader) pendingHeader = {}
        if (side === 'right') pendingHeader.right = text
        else pendingHeader.left = text
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

      case 'examBullets':
        flushHeader()
        out.push({
          type: 'bullets',
          items: (node.content ?? []).map((li) => richOf(li)),
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

function richNodes(rt: RichText): JSONContent[] {
  if (typeof rt === 'string') return rt ? [{ type: 'text', text: rt }] : []
  return rt.map((s) => ({
    type: 'text',
    text: s.text,
    ...(s.marks?.length
      ? { marks: s.marks.map((m) => ({ type: m.type, ...(m.attrs ? { attrs: m.attrs } : {}) })) }
      : {}),
  }))
}

export function blocksToTipTap(blocks: ExamBlock[]): JSONContent {
  const content: JSONContent[] = []

  for (const b of blocks) {
    switch (b.type) {
      case 'header':
        content.push({
          type: 'examHeader',
          attrs: { id: `h${content.length}`, side: 'left' },
          content: richNodes(b.left),
        })
        if (plainText(b.right)) {
          content.push({
            type: 'examHeader',
            attrs: { id: `h${content.length}`, side: 'right' },
            content: richNodes(b.right),
          })
        }
        break

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
          attrs: { id: `b${content.length}`, ...attrsFromFormat(b.format) },
          content: b.items.map((item, i) => ({
            type: 'examBullet',
            attrs: { id: `bi${i}` },
            content: richNodes(item),
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
}

/** Lấy mục lục từ các node tiêu đề trong tài liệu TipTap. */
export function buildTocFromDoc(doc: JSONContent): TocEntry[] {
  const out: TocEntry[] = []
  const nodes = doc.content ?? []
  nodes.forEach((node, index) => {
    if (node.type === 'examHeading' || node.type === 'examTitle') {
      const text = plainText(richOf(node)).trim()
      if (!text) return
      out.push({
        index,
        level: node.type === 'examTitle' ? 1 : ((node.attrs?.level as number) ?? 1),
        text,
      })
    }
  })
  return out
}
