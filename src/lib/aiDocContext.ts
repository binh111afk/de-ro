/**
 * Cho AI nhìn thấy đủ phần giáo viên nhắc tới: câu "câu 4", "bài 2", phần đang bôi đen
 * → gửi nguyên văn đầy đủ của khối (JSON ExamBlock: công thức, phương án, hình, đáp án),
 * không chỉ dòng tóm tắt 320 ký tự trong bản tóm tắt đề.
 *
 * Id khối gửi cho AI là vị trí khối cấp cao nhất: `k0`, `k1`… (id lưu trong node không dùng được:
 * sinh theo thứ tự lúc chuyển đổi nên trùng nhau sau khi chèn/sửa, đoạn thường thì không có id).
 */
import type { JSONContent } from '@tiptap/core'
import { tipTapToBlocks } from '@/examEditor/convert'

/** tối đa số khối gửi nguyên văn mỗi lượt (giáo viên nói "câu 1 đến 40" thì không gửi cả đề) */
const MAX_FOCUS = 8
/** ảnh đồ thị: giữ cấu hình công cụ vẽ để AI biết hình vẽ gì, nhưng cắt bớt */
const MAX_PLOT = 900

export const blockKey = (index: number) => `k${index}`

/** Kết quả áp câu trả lời AI vào đề: `failed` = trông như sửa đề nhưng không áp được (panel hiện nút Thử lại). */
export interface AiApplyResult {
  text: string
  failed?: boolean
}
/** `k12` → 12; id không đúng dạng → -1 */
export function keyIndex(id: string): number {
  const m = /^k(\d{1,5})$/.exec(id.trim())
  return m ? Number(m[1]) : -1
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
function stripImages(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripImages)
  if (!v || typeof v !== 'object') return v
  const out: Record<string, unknown> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (k === 'image' && val && typeof val === 'object') {
      const img = val as { alt?: string; plot?: string }
      out.image = {
        alt: img.alt || 'ảnh',
        ...(img.plot ? { figure: img.plot.length > MAX_PLOT ? `${img.plot.slice(0, MAX_PLOT)}…` : img.plot } : {}),
      }
    } else out[k] = stripImages(val)
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

/** Đoạn chèn vào lượt người dùng: nguyên văn các khối được nhắc tới (rỗng nếu không nhắc khối nào). */
export function focusNote(doc: JSONContent | undefined, text: string): string {
  const body = blocksText(doc, focusIndices(doc, referencedNos(text)))
  return body ? `\n\nNGUYÊN VĂN CÁC KHỐI ĐƯỢC NHẮC TỚI (JSON đầy đủ, dùng đúng id trong ngoặc vuông khi patch):\n${body}` : ''
}
