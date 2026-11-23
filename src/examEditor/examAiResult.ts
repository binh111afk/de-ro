import type { Editor } from '@tiptap/core'
import type { Selection, Transaction } from '@tiptap/pm/state'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { ExamBlock, FormatAttrs, RichText, Span, TableCellData } from '@/data/docTypes'
import { extractJson } from '@/lib/llm'
import { examMaintenance, keyIndex, rubricEntries, stripImages, type AiApplyResult } from '@/lib/aiDocContext'
import { readKeys, shuffleQuestion } from '@/lib/shuffleExam'
import { buildScoringTable } from '@/lib/scoringTable'
import { blocksToTipTap, plainText, splitRichLines, tipTapToBlocks } from './convert'

type DrawFigure = (raw: unknown) => Span['image']

/** Hợp đồng AI trả về: thay cả đề / thêm cuối / sửa từng khối theo id (`k<vị trí>`). */
interface AiExamEnvelope {
  action?: string
  blocks?: unknown
  patch?: unknown
  /** câu trả lời ngắn cho giáo viên (đã hiểu yêu cầu thế nào, đã làm gì) — hiện trong chat */
  say?: unknown
  /** tên đề theo bài (chỉ khi replace) — đặt cho tab còn tên mặc định */
  name?: unknown
  /** một câu nhắc người dùng (vd. nội dung họ yêu cầu nằm ngoài chương trình 2018) — hiện kèm câu tóm tắt */
  warning?: unknown
}

const AI_BLOCK_TYPES = new Set([
  'header',
  'title',
  'meta',
  'student',
  'heading',
  'paragraph',
  'bullets',
  'grid',
  'question',
  'essay',
  'answerKey',
  'rubric',
  'pageBreak',
  'divider',
  'table',
])

/**
 * AI soạn đề gắn `figure` (cấu hình công cụ vẽ) vào khối cần hình → vẽ bằng công cụ,
 * đặt thành đoạn ảnh căn giữa ngay dưới khối. Ảnh tạm là SVG; `pngifyToolImages` đổi sang PNG sau
 * (xuất Word không đọc SVG). Ghi lại câu có hình lỗi để báo khi áp vào đề.
 */
function expandFigures(raw: unknown, missing: string[], draw: DrawFigure): unknown {
  if (!Array.isArray(raw)) return raw
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object' || !('figure' in item)) return [item]
    const { figure, ...block } = item as Record<string, unknown>
    // công cụ chưa tải (hiếm: tải sẵn khi mở trình soạn) thì chèn đề không kèm hình
    let img: Span['image']
    try { img = draw(figure) } catch { img = undefined }
    if (!img) {
      missing.push(block.type === 'question' ? `Câu ${block.no ?? '?'}` :
        block.type === 'essay' ? `Bài ${block.no ?? '?'}` : 'đoạn văn')
      return [block]
    }
    const { src, alt, width, plot } = img
    // câu trắc nghiệm: ảnh vào cuối đề bài (dòng riêng) để nằm TRƯỚC phương án A–D
    if (block.type === 'question' || block.type === 'essay') {
      const t = block.text
      const spans = typeof t === 'string' ? [{ text: t }] : Array.isArray(t) ? t : []
      return [{ ...block, text: [...spans, { text: '', image: { src, alt, width, plot } }] }]
    }
    return [block,{ type: 'paragraph', text: [{ text: '', image: { src, alt, width, plot } }], format: { align: 'center' } }]
  })
}

/** Đầu đề AI đôi khi thiếu dấu xuống dòng trước nhãn hoặc dòng đóng khung. */
function headerColumn(value: RichText): RichText {
  const spans = typeof value === 'string' ? [{ text: value }] : value
  const marked = spans.flatMap((span, i): Span[] => {
    if (span.image) return [span]
    const text = span.text.replace(/([^\s(])[ \t]*(?=(?:Thời gian làm bài|Môn\s*:|Năm học\s+|\(?Đề thi có\s+\d))/giu, '$1\n')
    const startsLine = /^[ \t]*(?:Thời gian làm bài|Môn\s*:|Năm học\s+|\(?Đề thi có\s+\d)/iu.test(text) ||
      (span.marks?.some((mark) => mark.type === 'boxed') && !spans[i - 1]?.marks?.some((mark) => mark.type === 'boxed'))
    if (i > 0 && startsLine && !text.startsWith('\n') && !spans[i - 1].text.endsWith('\n')) {
      return [{ text: '\n' }, { ...span, text }]
    }
    return [{ ...span, text }]
  })
  const lines = new Map<string, Span[]>()
  for (const line of splitRichLines(marked)) {
    const row = typeof line === 'string' ? [{ text: line }] : line
    const key = plainText(line).trim().replace(/[()]/g, '').replace(/\s+/g, ' ').toLowerCase()
    if (!lines.has(key) || row.some((span) => span.marks?.some((mark) => mark.type === 'boxed' || mark.type === 'italic')))
      lines.set(key, row)
  }
  return [...lines.values()].flatMap((line, i) => i ? [{ text: '\n' }, ...line] : line)
}

function sanitizeBlocks(raw: unknown, invalid: string[], missing: string[], draw: DrawFigure, originals: NonNullable<Span['image']>[] = []): ExamBlock[] {
  if (!Array.isArray(raw)) return []
  // AI có lúc trả mảng trộn string + span; chuẩn hoá về Span[] để converter/export đọc được.
  let label = 'đoạn văn'
  const rich = (v: unknown): RichText =>
    typeof v === 'string'
      ? v
      : Array.isArray(v)
        ? v.flatMap((s): Span[] => {
            if (typeof s === 'string') return [{ text: s }]
            if (!s || typeof s !== 'object') return []
            const span = s as Span
            if (typeof span.text !== 'string') return []
            if (span.image && !span.image.src) {
              const { ref, figure } = span.image as typeof span.image & { ref?: number; figure?: unknown }
              const original = typeof ref === 'number' && Number.isInteger(ref) ? originals[ref] :
                originals.length === 1 ? originals[0] : undefined
              let image = original
              if (figure != null && (!original || figure !== original.plot)) {
                try { image = draw(typeof figure === 'string' ? JSON.parse(figure) : figure) } catch { image = undefined }
                if (!image) missing.push(label)
              } else if (!image) missing.push(label)
              return image || original ? [{ ...span, image: image || original }] : []
            }
            return [{ ...span, marks: Array.isArray(span.marks) ? span.marks.filter((m) => m && typeof m.type === 'string') : undefined }]
          })
        : ''
  const fmt = (v: unknown): FormatAttrs | undefined =>
    v && typeof v === 'object' ? (v as FormatAttrs) : undefined
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
  const out: ExamBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    const type = typeof b.type === 'string' ? b.type : ''
    label = type === 'question' ? `Câu ${b.no ?? '?'}` : type === 'essay' ? `Bài ${b.no ?? '?'}` : 'đoạn văn'
    if (!AI_BLOCK_TYPES.has(type)) continue
    switch (type) {
      case 'header': {
        // dạng cũ {"type":"header","text":"…"} → đưa vào cột trái thay vì header rỗng
        const left = rich(b.left) || (typeof b.text === 'string' ? b.text : '')
        out.push({ type: 'header', left: headerColumn(left), right: headerColumn(rich(b.right)) })
        break
      }
      case 'title':
        out.push({ type: 'title', text: rich(b.text), format: fmt(b.format) })
        break
      case 'meta':
        out.push({
          type: 'meta',
          rows: list(b.rows)
            .map((row, i) =>
              Array.isArray(row)
                ? ([String(row[0] ?? ''), rich(row[1])] as [string, RichText])
                : row && typeof row === 'object'
                  ? ([
                      String((row as Record<string, unknown>).label ?? `Dòng ${i + 1}`),
                      rich((row as Record<string, unknown>).value),
                    ] as [string, RichText])
                  : null,
            )
            .filter((r): r is [string, RichText] => r !== null),
        })
        break
      case 'student':
        out.push({ type: 'student', text: rich(b.text), format: fmt(b.format) })
        break
      case 'heading':
        out.push({
          type: 'heading',
          text: rich(b.text),
          level: (b.level === 2 || b.level === 3 ? b.level : 1) as 1 | 2 | 3,
          format: fmt(b.format),
        })
        break
      case 'paragraph':
        out.push({ type: 'paragraph', text: rich(b.text), format: fmt(b.format) })
        break
      case 'bullets':
        out.push({
          type: 'bullets',
          items: list(b.items).map(rich),
          ...(b.ordered === true ? { ordered: true } : {}),
          ...(Array.isArray(b.levels) ? { levels: b.levels.map(Number) } : {}),
          format: fmt(b.format),
        })
        break
      case 'grid':
        out.push({
          type: 'grid',
          cols: b.cols === 3 ? 3 : 2,
          cells: list(b.cells).map(rich),
          format: fmt(b.format),
        })
        break
      case 'question': {
        // kind: 'tf' = đúng/sai (4 ý a–d), 'short' = trả lời ngắn (không có phương án); còn lại là trắc nghiệm A–D
        let kind: 'tf' | 'short' | undefined = b.kind === 'tf' || b.kind === 'short' ? b.kind : undefined
        // câu điền chỗ trống bằng chữ (đề đã có dòng chấm) không vẽ 4 ô đáp số của dạng trả lời ngắn
        if (kind === 'short' && /…{3,}|\.{5,}/.test(plainText(rich(b.text)))) kind = undefined
        out.push({
          type: 'question',
          no: typeof b.no === 'number' ? b.no : 1,
          ...(kind ? { kind } : {}),
          text: rich(b.text),
          // chấp nhận cả dạng viết tắt: options: ["A. …", "B. …"]
          options:
            kind === 'short'
              ? []
              : list(b.options).map((o, i) => {
                  const letter = String.fromCharCode((kind === 'tf' ? 97 : 65) + i)
                  if (typeof o === 'string') return { label: letter, text: o.replace(/^\s*[A-Da-d][.)]\s+/, '') }
                  const opt = (o ?? {}) as Record<string, unknown>
                  const label = typeof opt.label === 'string' ? opt.label.trim().replace(/[.)]$/, '') : letter
                  return {
                    label: kind === 'tf' ? label.toLowerCase() : label.toUpperCase(),
                    text: rich(opt.text),
                    format: fmt(opt.format),
                  }
                }),
          format: fmt(b.format),
        })
        const question = out.at(-1) as Extract<ExamBlock, { type: 'question' }>
        const fillIn = !kind && question.options.length === 0 && /…{2,}|\.{5,}/.test(plainText(question.text))
        if (kind !== 'short' && !fillIn && (
          question.options.length !== 4 || question.options.some((o, i) =>
            o.label.toLowerCase() !== 'abcd'[i] || !plainText(o.text).trim()
          )
        )) invalid.push(`Câu ${question.no} thiếu hoặc sai phương án`)
        break
      }
      case 'essay':
        out.push({
          type: 'essay',
          no: typeof b.no === 'number' ? b.no : 1,
          score: typeof b.score === 'number' ? b.score : 0,
          text: rich(b.text),
          sub: Array.isArray(b.sub) ? b.sub.map(rich) : undefined,
          format: fmt(b.format),
        })
        break
      case 'answerKey':
        // chấp nhận items: [{no, answer}] hoặc chuỗi rút gọn "Câu 1. A"
        out.push({
          type: 'answerKey',
          items: list(b.items).map((it, i) =>
            typeof it === 'string'
              ? { no: i + 1, answer: it }
              : {
                  no: typeof (it as Record<string, unknown>)?.no === 'number'
                    ? ((it as Record<string, unknown>).no as number)
                    : i + 1,
                  answer: rich((it as Record<string, unknown>)?.answer),
                },
          ),
        })
        break
      case 'rubric': {
        // hướng dẫn chấm tự luận dạng bảng Phần | Câu | Nội dung | Điểm
        const scoring = Array.isArray(b.parts) ? buildScoringTable(b) : null
        if (scoring) {
          out.push(scoring)
          break
        }
        out.push({
          type: 'rubric',
          title: b.title == null ? undefined : rich(b.title),
          // chấp nhận items: [{label, text}] hoặc chuỗi rút gọn
          items: list(b.items).map((it, i) =>
            typeof it === 'string'
              ? { label: `${i + 1}.`, text: it }
              : {
                  label:
                    typeof (it as Record<string, unknown>)?.label === 'string'
                      ? ((it as Record<string, unknown>).label as string)
                      : `${i + 1}.`,
                  text: rich((it as Record<string, unknown>)?.text),
                },
          ),
        })
        break
      }
      case 'table': {
        const rows = list(b.rows).filter(Array.isArray).filter((row) => row.length).map((row) =>
          row.map((cell: unknown): TableCellData => {
            if (typeof cell === 'string' || Array.isArray(cell)) return { text: rich(cell) }
            if (typeof cell === 'number') return { text: String(cell) }
            const c = (cell ?? {}) as Record<string, unknown>
            return {
              text: typeof c.text === 'number' ? String(c.text) : rich(c.text),
              ...(c.header === true ? { header: true } : {}),
              ...(typeof c.colSpan === 'number' && c.colSpan > 1 ? { colSpan: Math.min(100, Math.floor(c.colSpan)) } : {}),
              ...(typeof c.rowSpan === 'number' && c.rowSpan > 1 ? { rowSpan: Math.min(100, Math.floor(c.rowSpan)) } : {}),
              ...(c.align === 'left' || c.align === 'center' || c.align === 'right' ? { align: c.align } : {}),
              ...(typeof c.shading === 'string' ? { shading: c.shading } : {}),
            }
          }),
        )
        if (rows.some((row) => row.some((cell) => plainText(cell.text).trim())))
          out.push({ type: 'table', rows, format: fmt(b.format) })
        else invalid.push('Bảng số liệu thiếu dữ liệu')
        break
      }
      case 'pageBreak':
        out.push({ type: 'pageBreak' })
        break
      case 'divider':
        out.push({ type: 'divider' })
        break
    }
  }
  return out
}

type PatchOp = 'replace' | 'insertAfter' | 'insertBefore' | 'delete'
interface ExamPatch {
  op: PatchOp
  /** vị trí khối cấp cao nhất (id `k<vị trí>`) */
  index: number
  blocks: ExamBlock[]
}

type KeyItem = Extract<ExamBlock, { type: 'answerKey' }>['items'][number]

/** Giữ đáp án cũ theo câu gốc khi chèn/xoá làm dịch số. Mục AI trả mới được ưu tiên. */
function normalizePatchedQuestions(tr: Transaction, original: ProseMirrorNode, shuffled?: Map<number, string>) {
  const questions: Array<{ node: ProseMirrorNode; pos: number }> = []
  const tables: Array<{ node: ProseMirrorNode; pos: number; items: KeyItem[] }> = []
  const headings: Array<{ node: ProseMirrorNode; pos: number; start: number; end: number }> = []
  const oldQuestions: ProseMirrorNode[] = []
  const oldTables = new Set<ProseMirrorNode>()
  original.forEach((node) => {
    if (node.type.name === 'examQuestion') oldQuestions.push(node)
    if (node.type.name === 'examAnswerKey') oldTables.add(node)
  })
  let heading: typeof headings[number] | undefined
  tr.doc.forEach((node, pos) => {
    if (node.type.name === 'examQuestion') {
      questions.push({ node, pos })
      if (heading) heading.end = questions.length
    }
    if (node.type.name === 'examHeading' && /^phần\s/iu.test(node.textContent)) {
      heading = { node, pos, start: questions.length + 1, end: 0 }
      headings.push(heading)
    }
    if (node.type.name === 'examAnswerKey') {
      const [key] = tipTapToBlocks({ type: 'doc', content: [node.toJSON()] })
      if (key?.type === 'answerKey') tables.push({ node, pos, items: key.items })
    }
  })
  const changed = oldQuestions.length !== questions.length ||
    questions.some(({ node }, i) => node.attrs.no !== oldQuestions[i]?.attrs.no)
  const newTables = tables.filter(({ node }) => !oldTables.has(node))
  if (!shuffled?.size && !changed && (!newTables.length || oldTables.size === 0 && tables.length === 1)) return

  const fresh = newTables.flatMap(({ items }) => items)
  const prior = new Map<number, RichText>()
  const kept = new Set(tables.map(({ node }) => node))
  for (const node of oldTables) {
    if (!fresh.length && !kept.has(node)) continue
    const [key] = tipTapToBlocks({ type: 'doc', content: [node.toJSON()] })
    if (key?.type === 'answerKey') for (const item of key.items) prior.set(item.no, item.answer)
  }
  const incoming = new Map(fresh.map(({ no, answer }) => [no, answer]))
  const fullKey = fresh.length === questions.length && questions.every((_, i) => incoming.has(i + 1))
  const touched = new Set(questions.filter(({ node }) => !oldQuestions.includes(node)).map(({ node }) => Number(node.attrs.no)))
  const items = questions.flatMap(({ node, pos }, i) => {
    const oldNo = Number(node.attrs.no)
    const no = changed ? i + 1 : oldNo
    const isOld = oldQuestions.includes(node)
    const fromPatch = fullKey && changed ? incoming.get(no) :
      !isOld || !touched.has(oldNo) ? incoming.get(oldNo) : undefined
    const answer = shuffled?.get(oldNo) ?? fromPatch ?? (shuffled || isOld || !changed ? prior.get(oldNo) : undefined)
    if (no !== oldNo) tr.setNodeMarkup(pos, undefined, { ...node.attrs, no })
    return answer === undefined ? [] : [{ no, answer }]
  })

  // Chỉnh các số trong tiêu đề phần khi kiểu tiêu đề có ghi dải câu.
  const replaceRange = /((?:từ\s+)?câu\s+)(\d+)(\s*(?:đến|tới|[-–—])\s*(?:câu\s+)?)(\d+)/iu
  const edits: Array<{ pos: number; run: () => void }> = []
  if (changed) for (const { node, pos, start, end } of headings) {
    if (!end || node.childCount !== 1 || !node.firstChild?.isText) continue
    const m = replaceRange.exec(node.textContent)
    if (!m || (Number(m[2]) === start && Number(m[4]) === end)) continue
    edits.push({ pos, run: () => tr.insertText(`${m[1]}${start}${m[3]}${end}`, pos + 1 + m.index, pos + 1 + m.index + m[0].length) })
  }
  tables.forEach(({ node, pos }, i) => {
    edits.push({ pos, run: () => {
      if (i || !items.length) tr.delete(pos, pos + node.nodeSize)
      else {
        const [key] = blocksToTipTap([{ type: 'answerKey', items }]).content!
        tr.replaceWith(pos, pos + node.nodeSize, tr.doc.type.schema.nodeFromJSON(key))
      }
    } })
  })
  edits.sort((a, b) => b.pos - a.pos).forEach(({ run }) => run())
}

/** Xoá/xáo trên node gốc để giữ nguyên hình, công thức và định dạng phương án. */
export function applyExamMaintenance(editor: Editor, request: string, random = Math.random): AiApplyResult | undefined {
  const edit = examMaintenance(request)
  if (!edit) return undefined
  const { state, view } = editor
  const tr = state.tr
  const current = editor.getJSON()
  const keys = readKeys(tipTapToBlocks(current))
  const questions: Array<{ node: ProseMirrorNode; index: number }> = []
  state.doc.forEach((node, _pos, index) => {
    if (node.type.name === 'examQuestion') questions.push({ node, index })
  })
  const fail = (text: string): AiApplyResult => ({ text, failed: true, retryable: false })
  if (edit.remove.some(no => questions.filter(({ node }) => Number(node.attrs.no) === no).length !== 1))
    return fail('Mình chưa xác định được câu cần xóa. Bạn kiểm tra lại số câu nhé.')
  if (edit.first > questions.length) return fail('Đề chưa có đủ số câu để xáo đáp án.')

  const deleteIndices = new Set<number>()
  for (const { node, index } of questions) {
    if (!edit.remove.includes(Number(node.attrs.no))) continue
    deleteIndices.add(index)
    const next = current.content?.[index + 1]
    if ((next?.type === 'paragraph' || next?.type === 'examParagraph') &&
        next.content?.some(el => el.type === 'image') && next.content.every(el => el.type === 'image' || el.type === 'hardBreak')) {
      deleteIndices.add(index + 1)
    }
  }
  const updates = new Map<number, ProseMirrorNode>()
  const answers = new Map<number, string>()
  for (const { node, index } of questions.slice(0, edit.first)) {
    if (deleteIndices.has(index)) continue
    const [block] = tipTapToBlocks({ type: 'doc', content: [node.toJSON()] })
    if (block?.type !== 'question' || block.kind === 'short') continue
    const prior = keys.get(block.no) ?? []
    const first = shuffleQuestion(block, prior, true, random)
    const unchanged = (order: number[]) => order.every((from, i) => from === i)
    const { q, answer, order } = unchanged(first.order) ? shuffleQuestion(block, prior, true, () => 0) : first
    if ((prior.length && !answer) || unchanged(order)) continue
    const options = Array.from({ length: node.childCount - 1 }, (_, i) => node.child(i + 1))
    const reordered = order.map((from, i) => {
      const option = options[from]
      return option.type.create({ ...option.attrs, label: q.options[i].label }, option.content, option.marks)
    })
    updates.set(index, node.type.create(node.attrs, [node.firstChild!, ...reordered], node.marks))
    if (answer) answers.set(block.no, answer)
  }

  const changes: Array<{ node: ProseMirrorNode; pos: number; index: number }> = []
  state.doc.forEach((node, pos, index) => {
    if (deleteIndices.has(index) || updates.has(index)) changes.push({ node, pos, index })
  })
  for (const { node, pos, index } of changes.reverse()) {
    const replacement = updates.get(index)
    if (replacement) tr.replaceWith(pos, pos + node.nodeSize, replacement)
    else tr.delete(pos, pos + node.nodeSize)
  }
  if (!tr.docChanged) return fail('Chưa có phương án nào đổi chỗ được.')
  normalizePatchedQuestions(tr, state.doc, answers)
  view.dispatch(tr.scrollIntoView())
  const deleted = edit.remove.length ? `Mình đã xóa ${edit.remove.map(no => `câu ${no}`).join(', ')}.` : ''
  const shuffled = edit.first ? (updates.size ? `Đã xáo phương án của ${updates.size} câu.` : 'Chưa có phương án nào đổi chỗ được.') : ''
  return { text: [deleted, shuffled].filter(Boolean).join(' ') }
}

/** Các mục patch: {op, id, block|blocks}; thiếu op = thay khối (dạng cũ). Mục sai thì bỏ. */
function sanitizePatches(
  raw: unknown, missing: string[], invalid: string[], draw: DrawFigure,
  current: ReturnType<Editor['getJSON']>, allowImageRemoval: boolean,
): ExamPatch[] {
  if (!Array.isArray(raw)) return []
  const out: ExamPatch[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const p = item as Record<string, unknown>
    const index = typeof p.id === 'string' ? keyIndex(p.id) : -1
    if (index < 0) continue
    const op = p.op ?? 'replace'
    if (op !== 'replace' && op !== 'insertAfter' && op !== 'insertBefore' && op !== 'delete') continue
    if (op === 'delete') {
      out.push({ op, index, blocks: [] })
      continue
    }
    const list = Array.isArray(p.blocks) ? p.blocks : p.block ? [p.block] : []
    const originals: NonNullable<Span['image']>[] = []
    const node = current.content?.[index]
    if (node) stripImages(tipTapToBlocks({ type: 'doc', content: [node] }), originals)
    const blocks = sanitizeBlocks(expandFigures(list, missing, draw), invalid, missing, draw, originals)
    if (op === 'replace' && !allowImageRemoval && originals.length) {
      const retained: typeof originals = []
      stripImages(blocks, retained)
      if (retained.length < originals.length) invalid.push('Phần sửa làm mất hình đang có')
    }
    if (blocks.length) out.push({ op, index, blocks })
  }
  return out
}

/** Bản chữ của các khối (khi không áp được vào đề thì hiện trong chat để giáo viên vẫn dùng được). */
function blocksPlain(blocks: ExamBlock[]): string {
  const lines: string[] = []
  for (const b of blocks) {
    if (b.type === 'question') {
      lines.push(`**Câu ${b.no}.** ${plainText(b.text)}`)
      for (const o of b.options) lines.push(`${o.label}. ${plainText(o.text)}`)
    } else if (b.type === 'essay') {
      lines.push(`**Bài ${b.no}.** ${plainText(b.text)}`)
      for (const s of b.sub ?? []) lines.push(plainText(s))
    } else if (b.type === 'heading' || b.type === 'title') lines.push(`**${plainText(b.text)}**`)
    else if (b.type === 'paragraph' || b.type === 'student') lines.push(plainText(b.text))
    else if (b.type === 'bullets') for (const it of b.items) lines.push(`- ${plainText(it)}`)
    else if (b.type === 'answerKey') lines.push(b.items.map((it) => `${it.no}. ${plainText(it.answer)}`).join('; '))
    else if (b.type === 'rubric') for (const it of b.items) lines.push(`${it.label} ${plainText(it.text)}`)
  }
  return lines.filter((l) => l.trim()).join('\n\n')
}

/** Kiểm tra toàn bộ thao tác trước khi ghi thay đổi vào đề. */
export function applyExamReply(
  editor: Editor,
  text: string,
  allowReplace: boolean,
  draw: DrawFigure,
  onFigures?: () => void,
  onRename?: (name: string) => void,
  options: { allowImageRemoval?: boolean; requirePatch?: boolean } = {},
): AiApplyResult {
  const fail = { text: 'AI chưa trả về thay đổi hợp lệ để đưa vào đề.', failed: true }
  let raw: AiExamEnvelope
  try {
    raw = extractJson<AiExamEnvelope>(text)
  } catch {
    return fail
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail

  const clean = (value: unknown, max: number) => typeof value === 'string'
    ? value.trim().slice(0, max).replace(/\bfigure\b/gi, 'hình').trim()
    : ''
  const say = clean(raw.say, 1200).replace(/(?:^|\n)[ \t]*Đã (?:sửa|thêm|xoá|xóa) \d+ khối[^\n]*/gi, '').trim()
  if (!allowReplace && (raw.action === 'replace' || (!raw.action && Array.isArray(raw.blocks) && !raw.patch)))
    return { text: 'Mình chưa áp dụng vì phần trả về sẽ thay cả đề.', failed: true }

  if (options.requirePatch && raw.action === 'append')
    return { text: 'Mình cần sửa đúng chỗ được yêu cầu trong đề.', failed: true }

  const missing: string[] = []
  const invalid: string[] = []
  const blocks = sanitizeBlocks(expandFigures(raw.blocks, missing, draw), invalid, missing, draw)
  const patches = sanitizePatches(raw.patch, missing, invalid, draw, editor.getJSON(), options.allowImageRemoval === true)
  if (invalid.length) return { text: `Chưa đưa vào đề. ${[...new Set(invalid)].join('. ')}.`, failed: true }
  if (raw.patch != null && (!Array.isArray(raw.patch) || raw.patch.length !== patches.length)) return fail
  if (raw.action && !['replace', 'append', 'patch'].includes(raw.action)) return fail
  const hasPlot = (list: ExamBlock[]) => list.some((b) =>
    (b.type === 'paragraph' || b.type === 'question' || b.type === 'essay') &&
    Array.isArray(b.text) && b.text.some((s) => s.image?.plot)
  )
  const warningLabel = /(?:\*\*|__)?lưu ý\s*(?:\*\*|__)?\s*:(?:\*\*|__)?[ \t]*/giu
  const warning = clean(raw.warning, 300).replace(warningLabel, '').trim()
  let hasWarning = false
  const shownSay = missing.length ? '' : say.replace(warningLabel, label => {
    if (hasWarning) return ''
    hasWarning = true
    return label
  })
  const norm = (text: string) => text.normalize('NFC').toLowerCase().replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim()
  const warn = warning && !norm(shownSay).includes(norm(warning).replace(/[.!]$/, ''))
    ? `\n\n${hasWarning ? '' : 'Lưu ý: '}${warning}` : ''
  const figures = missing.length ? `\n\nChưa dựng được hình hoặc bảng ở ${[...new Set(missing)].join(', ')}.` : ''
  const action =
    raw.action === 'append' || raw.action === 'patch' || raw.action === 'replace'
      ? raw.action
      : patches.length
        ? 'patch'
        : blocks.length
          ? 'replace'
          : 'none'
  if ((action === 'patch' && blocks.length) || (action !== 'patch' && patches.length)) return fail
  const done = (line: string) => {
    if (hasPlot(blocks) || patches.some((p) => hasPlot(p.blocks)))
      onFigures?.()
    return { text: `${shownSay || (missing.length ? 'Đề đã được cập nhật.' : line)}${warn}${figures}` }
  }
  // phần AI viết mà không áp được: hiện thành chữ trong chat
  const fallback = (why: string): AiApplyResult => {
    const plain = blocksPlain([...blocks, ...patches.flatMap((p) => p.blocks)])
    return { text: `${why}${figures}${plain ? `\n\n${plain}` : ''}`, failed: true }
  }
  try {
    if (action === 'replace' && blocks.length) {
      if (!allowReplace) return { text: 'Mình chưa áp dụng vì phần trả về sẽ thay cả đề.', failed: true }
      const next = editor.state.schema.nodeFromJSON(blocksToTipTap(blocks))
      if (next.eq(editor.state.doc) || !editor.commands.setContent(next)) return fail
      // setContent thay cả tài liệu nên selection cũ được map lại tuỳ vị trí
      // → có thể rơi vào khối bất kỳ. Đặt lại con trỏ về đầu đề.
      // lấy lớp Selection từ chính editor (không import runtime ProseMirror vào trang chung)
      const Sel = editor.state.selection.constructor as typeof Selection
      editor.commands.setTextSelection(Sel.near(editor.state.doc.resolve(1)).from)
      const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 120) : ''
      if (name) onRename?.(name)
      return done('Mình soạn xong đề rồi, bạn xem qua nhé.')
    }
    if (action === 'append' && blocks.length) {
      const content = blocksToTipTap(blocks).content ?? []
      const before = editor.state.doc
      if (!editor.commands.insertContentAt(before.content.size, content) || before.eq(editor.state.doc)) return fail
      return done('Mình thêm vào cuối đề rồi, bạn xem nhé.')
    }
    if (action === 'patch' && patches.length) {
      const { state, view } = editor
      const tr = state.tr
      const count = tr.doc.childCount
      if (patches.some((p) => p.index >= count)) return fallback('Không tìm thấy chỗ cần sửa trong đề.')
      const groups = new Map<number, ExamPatch[]>()
      for (const p of patches) groups.set(p.index, [...(groups.get(p.index) ?? []), p])
      const original: number[] = []
      state.doc.forEach((_node, offset) => original.push(offset))
      for (const [index, ops] of [...groups].sort(([a], [b]) => b - a)) {
        const edits = ops.filter((p) => p.op === 'replace' || p.op === 'delete')
        if (edits.length > 1) return fail
        const node = state.doc.child(index)
        const from = original[index]
        const to = from + node.nodeSize
        const nodesFor = (parts: ExamPatch[]) => parts.flatMap((p) =>
          (blocksToTipTap(p.blocks).content ?? []).map((j) => state.schema.nodeFromJSON(j)),
        )
        const before = nodesFor(ops.filter((p) => p.op === 'insertBefore'))
        const after = nodesFor(ops.filter((p) => p.op === 'insertAfter'))
        const next = edits.length ? nodesFor(edits) : [node]
        tr.replaceWith(from, to, [...before, ...next, ...after])
      }
      const oldBlocks = tipTapToBlocks(state.doc.toJSON())
      normalizePatchedQuestions(tr, state.doc)
      const newBlocks = tipTapToBlocks(tr.doc.toJSON())
      if (JSON.stringify(newBlocks) !== JSON.stringify(oldBlocks)) {
        for (const p of patches) {
          const node = state.doc.child(p.index)
          if (node.type.name !== 'examEssay' || (p.op !== 'replace' && p.op !== 'delete')) continue
          const no = Number(node.attrs.no)
          const prior = oldBlocks.find((b) => b.type === 'essay' && b.no === no)
          const replacement = p.blocks.find((b) => b.type === 'essay' && b.no === no)
          if (prior?.type === 'essay' && replacement?.type === 'essay' && prior.score === replacement.score &&
            JSON.stringify([prior.text, ...(prior.sub ?? [])].map(plainText)) ===
            JSON.stringify([replacement.text, ...(replacement.sub ?? [])].map(plainText))) continue
          const old = rubricEntries(oldBlocks, no)
          const next = rubricEntries(newBlocks, no)
          if (old.length && old.every((entry) => next.includes(entry)))
            return { text: `AI chưa cập nhật hướng dẫn chấm của Bài ${no}. Đề hiện tại vẫn được giữ.`, failed: true }
        }
        view.dispatch(tr.scrollIntoView())
        return done('Mình sửa xong rồi, bạn xem lại nhé.')
      }
      return fallback('Không tìm thấy chỗ cần sửa trong đề.')
    }
  } catch (err) {
    // Không áp được (block lạ, vị trí sai…) — log để chẩn đoán, panel hiện nút Thử lại
    console.error('[AI] không áp được kết quả vào đề', err)
    return fallback('Chưa đưa được phần này vào đề.')
  }
  return fallback('AI chưa đưa ra thay đổi nào cho đề.')
}
