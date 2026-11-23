/**
 * Cho AI nhìn thấy đủ phần giáo viên nhắc tới: câu "câu 4", "bài 2", phần đang bôi đen
 * → gửi nguyên văn đầy đủ của khối (JSON ExamBlock: công thức, phương án, hình, đáp án),
 * không chỉ dòng tóm tắt 320 ký tự trong bản tóm tắt đề.
 *
 * Id khối gửi cho AI là vị trí khối cấp cao nhất: `k0`, `k1`… (id lưu trong node không dùng được:
 * sinh theo thứ tự lúc chuyển đổi nên trùng nhau sau khi chèn/sửa, đoạn thường thì không có id).
 */
import type { ExamBlock, Span } from '@/data/docTypes'
import type { JSONContent } from '@tiptap/core'
import { plainText, tipTapToBlocks } from '@/examEditor/convert'

/** tối đa số khối gửi nguyên văn mỗi lượt (giáo viên nói "câu 1 đến 40" thì không gửi cả đề) */
const MAX_FOCUS = 8

export const CONTINUE_EXAM_EDIT = 'Tiếp tục yêu cầu sửa đề.'

export function examIntent(text: string): 'doc' | 'chat' {
  const request = text.normalize('NFC').toLowerCase().trim()
  if (/^(?:(?:hãy|giúp (?:tôi|mình)|cho (?:tôi|mình)|bạn có thể)\s+)*(?:giải thích|tại sao|vì sao|cách (?:làm|giải)|giải câu|(?:viết|cho) lời giải)/u.test(request) &&
      !/(?<!\p{L})(?:chèn|đưa vào đề|thêm vào đề)(?!\p{L})/u.test(request)) return 'chat'
  if (/(?<!\p{L})(?:xoá|xóa|bỏ|xáo|trộn|cập nhật|thêm|thay|chèn)(?!\p{L})/u.test(request)) return 'doc'
  const hints = ['soạn', 'sinh đề', 'tạo đề', 'viết đề', 'làm đề', 'bổ sung', 'sửa', 'rà soát', 'đổi', 'chỉnh', 'xuất đề', 'in đề', 'chọn', 'lấy', 'trích', 'ra đề', 'tạo']
  return hints.some((hint) => request.includes(hint)) ? 'doc' : 'chat'
}

export function rewritesWholeExam(text: string): boolean {
  return /(?<!\p{L})(?:(?:soạn|tạo|viết|làm|ra)\s+(?:lại\s+)?(?:một\s+)?đề\s+mới|(?:viết|soạn|làm)\s+lại\s+(?:(?:toàn bộ|toàn|cả)\s+)+(?:đề|tài liệu))/iu.test(text.normalize('NFC'))
}

/** Các lệnh xoá và xáo có phạm vi rõ, dùng số câu của đề trước khi sửa. */
export function examMaintenance(text: string): { remove: number[]; first: number } | undefined {
  const request = text.normalize('NFC').trim().replace(/[.!]+$/, '')
    .replace(/^(?:hãy|giúp mình|giúp tôi)\s+/iu, '')
  const remove = /^(?:xoá|xóa|bỏ)\s+câu\s+(\d{1,3}(?:\s*(?:,|;|-|–|đến|tới|và)\s*\d{1,3})*)/iu.exec(request)
  const rest = remove ? request.slice(remove[0].length).replace(/^\s*(?:[,;]|và)\s*/iu, '').trim() : request
  const shuffle = /^(?:xáo|trộn)\s+(?:thứ tự\s+)?(?:đáp án|phương án)\s+(?:(?:của|cho)\s+)?(\d{1,3})\s+câu\s+đầu(?:\s+tiên)?$/iu.exec(rest)
  if ((!remove && !shuffle) || (rest && !shuffle)) return undefined
  const numbers = remove ? numbersIn(remove[1]) : []
  const first = Number(shuffle?.[1] ?? 0)
  return numbers.length || first > 0 ? { remove: [...new Set(numbers)], first } : undefined
}

export const isExamMutationReply = (text: string) =>
  /^\s*(?:```(?:json)?\s*)?\{/i.test(text) && /"(?:action"\s*:\s*"(?:replace|append|patch)"|patch"\s*:\s*\[)/.test(text)

/** ảnh đồ thị: giữ cấu hình công cụ vẽ để AI biết hình vẽ gì, nhưng cắt bớt */
const MAX_PLOT = 900

export const blockKey = (index: number) => `k${index}`

/** Kết quả áp câu trả lời AI vào đề: `failed` = trông như sửa đề nhưng không áp được (panel hiện nút Thử lại). */
export interface AiApplyResult {
  text: string
  failed?: boolean
  retryable?: false
}
/** `k12` hoặc `[k12]` → 12; id không đúng dạng → -1. */
export function keyIndex(id: string): number {
  const m = /^(?:k(\d{1,5})|\[k(\d{1,5})\])$/i.exec(id.trim())
  return m ? Number(m[1] ?? m[2]) : -1
}

export interface FocusRefs {
  /** số câu (khối question) */
  q: number[]
  /** số bài tự luận (khối essay) */
  essay: number[]
}

/** dải số: "4", "4, 5 và 7", "3-5", "3 đến 5", "3 tới 5" */
function numbersIn(list: string): number[] {
  const out: number[] = []
  const tokens = list.split(/\s*(?:,|;|và|hoặc|&)\s*/i)
  for (const part of tokens) {
    const range = part.match(/^(\d{1,3})\s*(?:-|–|đến|tới|->)\s*(\d{1,3})$/i)
    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      if (b >= a && b - a < 60) for (let i = a; i <= b; i++) out.push(i)
      continue
    }
    const one = part.match(/^(\d{1,3})$/)
    if (one) out.push(Number(one[1]))
  }
  return out
}

/** Đọc các số câu / bài giáo viên nhắc tới trong yêu cầu. */
export function referencedNos(text: string): FocusRefs {
  const q = new Set<number>()
  const essay = new Set<number>()
  // không dùng \b cạnh chữ có dấu (xem bẫy trong context.md)
  const re = /(^|[^\p{L}])(câu|bài)\s+(\d{1,3}(?:\s*(?:,|;|-|–|đến|tới|->|và|hoặc|&)\s*\d{1,3})*)/giu
  for (const m of text.matchAll(re)) {
    const target = m[2].toLowerCase() === 'bài' ? essay : q
    for (const n of numbersIn(m[3].trim())) target.add(n)
  }
  return { q: [...q], essay: [...essay] }
}

/** Ẩn dữ liệu ảnh (data URL rất dài), cắt cấu hình đồ thị — phần còn lại giữ nguyên. */
export function stripImages(v: unknown, images: NonNullable<Span['image']>[] = []): unknown {
  if (Array.isArray(v)) return v.map((item) => stripImages(item, images))
  if (!v || typeof v !== 'object') return v
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (k === 'image' && val && typeof val === 'object') {
      const img = val as NonNullable<Span['image']>
      out.image = {
        ref: images.push(img) - 1,
        alt: img.alt || 'ảnh',
        ...(img.plot && img.plot.length <= MAX_PLOT ? { figure: img.plot } : {}),
      }
    } else out[k] = stripImages(val, images)
  }
  return out
}

/** Nguyên văn đầy đủ của khối cấp cao nhất thứ `index` (JSON ExamBlock, kèm id `k<index>`). */
export function fullBlockText(node: JSONContent, index: number): string {
  const blocks = tipTapToBlocks({ type: 'doc', content: [node] })
  if (!blocks.length) return ''
  const body = blocks.length === 1 ? stripImages(blocks[0]) : stripImages(blocks)
  return `[${blockKey(index)}] ${JSON.stringify(body)}`
}

const isImagePara = (n: JSONContent | undefined) =>
  !!n && (n.type === 'paragraph' || n.type === 'examParagraph') && !!n.content?.some((c) => c.type === 'image')

/**
 * Vị trí các khối giáo viên nhắc tới: câu/bài theo số + vị trí trong `extra` (phần đang bôi đen).
 * Đoạn ảnh ngay sau một câu (hình của câu đó) đi kèm luôn.
 */
export function focusIndices(doc: JSONContent | undefined, refs: FocusRefs, extra: number[] = []): number[] {
  const nodes = doc?.content ?? []
  const picked = new Set<number>()
  nodes.forEach((node, i) => {
    if (picked.size >= MAX_FOCUS) return
    const no = Number(node.attrs?.no)
    const hit =
      extra.includes(i) ||
      (node.type === 'examQuestion' && refs.q.includes(no)) ||
      (node.type === 'examEssay' && refs.essay.includes(no))
    if (!hit) return
    picked.add(i)
    if (isImagePara(nodes[i + 1])) picked.add(i + 1)
  })
  return [...picked].sort((a, b) => a - b)
}

/** Nguyên văn các khối ở các vị trí cho trước, mỗi khối một dòng. */
export function blocksText(doc: JSONContent | undefined, indices: number[]): string {
  const nodes = doc?.content ?? []
  return indices
    .map((i) => (nodes[i] ? fullBlockText(nodes[i], i) : ''))
    .filter(Boolean)
    .join('\n')
}

/** Nội dung chấm được ghi rõ thuộc bài nào (theo tiêu đề hoặc dòng nhãn). */
export function rubricEntries(blocks: ExamBlock[], no: number): string[] {
  const label = new RegExp(`^\\s*(?:[A-Z]\\.\\s*)?Bài\\s+${no}(?!\\d)`, 'iu')
  return blocks.flatMap((b) => {
    if (b.type !== 'rubric') return []
    if (b.title && label.test(plainText(b.title))) return b.items.map((item) => `${item.label} ${plainText(item.text)}`.trim())
    const entries: string[] = []
    let matches = false
    for (const item of b.items) {
      const text = plainText(item.text)
      const start = [item.label, text].find((t) => /^\s*(?:[A-Z]\.\s*)?Bài\s+\d/iu.test(t))
      if (start !== undefined) matches = label.test(start)
      if (matches) entries.push(`${item.label} ${text}`.trim())
    }
    return entries
  })
}

/** Đoạn chèn vào lượt người dùng: nguyên văn các khối được nhắc tới (rỗng nếu không nhắc khối nào). */
export function focusNote(doc: JSONContent | undefined, text: string): string {
  const refs = referencedNos(text)
  const rubric = refs.essay.length ? (doc?.content ?? []).flatMap((n, i) => n.type === 'examRubric' ? [i] : []).slice(0, 4) : []
  const body = blocksText(doc, [...new Set([...focusIndices(doc, refs), ...rubric])])
  return body ? `\n\nNGUYÊN VĂN CÁC KHỐI ĐƯỢC NHẮC TỚI (JSON đầy đủ, dùng đúng id trong ngoặc vuông khi patch):\n${body}` : ''
}

/** Gom text của một node TipTap (để tóm tắt tài liệu cho AI). */
function nodeText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  // công thức nằm ở attrs, không có node text: thiếu nhánh này thì AI thấy "Giải hệ phương trình … là" mà mất hệ phương trình
  if (node.type === 'inlineMath' || node.type === 'blockMath') return `$${String(node.attrs?.latex ?? '')}$`
  if (node.type === 'image') return `[${String(node.attrs?.alt || 'hình')}]`
  return (node.content ?? []).map(nodeText).join(' ')
}

function figureSpecs(node: JSONContent): string[] {
  if (node.type !== 'image') return (node.content ?? []).flatMap(figureSpecs)
  const plot = node.attrs?.plot
  if (typeof plot !== 'string' || !plot) return []
  return [plot.length > MAX_PLOT ? plot.slice(0, MAX_PLOT) + '…' : plot]
}

/** Tóm tắt mỗi khối bằng id, nội dung và cấu hình hình vẽ. */
export function examDigest(doc: JSONContent | undefined): string | undefined {
  const lines: string[] = []
  for (const [index, node] of (doc?.content ?? []).entries()) {
    const type = node.type ?? ''
    if (type === 'paragraph' && !node.content?.length) continue
    const shortType = type.startsWith('exam') ? type[4].toLowerCase() + type.slice(5) : type
    const text = nodeText(node).replace(/\s+/g, ' ').trim().slice(0, 320)
    const no = (type === 'examQuestion' || type === 'examEssay') && node.attrs?.no != null
      ? ` ${type === 'examEssay' ? 'Bài' : 'Câu'} ${node.attrs.no}` : ''
    const figures = figureSpecs(node).slice(0, 2)
    lines.push(`- [${blockKey(index)}] ${shortType}${no}${text ? `: ${text}` : ''}${figures.length ? ` | Dữ liệu hình: ${figures.join(' / ')}` : ''}`)
    if (lines.length >= 80) {
      if (index + 1 < (doc?.content?.length ?? 0)) lines.push('… (còn nữa)')
      break
    }
  }
  return lines.join('\n') || undefined
}
