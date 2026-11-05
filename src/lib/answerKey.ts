/**
 * Bảng đáp án chia theo dạng câu như đề thật: mỗi dạng một bảng riêng, cột đều nhau.
 * - nhiều lựa chọn (A–D) và trả lời ngắn (số): lưới "Câu / Đáp án", tối đa 10 câu một hàng
 * - đúng/sai (4 ý): mỗi câu một hàng, cột a) b) c) d)
 * Dùng chung cho trình soạn (convert.ts) và bản xuất Word (docxBlocks.ts).
 */
import type { RichText } from '../data/docTypes'

export type AnswerItem = { no: number; answer: RichText }
export type AnswerGroupKind = 'choice' | 'tf' | 'short'
export interface AnswerGroup {
  kind: AnswerGroupKind
  label: string
  items: AnswerItem[]
}

const LABEL: Record<AnswerGroupKind, string> = {
  choice: 'Câu trắc nghiệm nhiều phương án lựa chọn',
  tf: 'Câu trắc nghiệm đúng/sai',
  short: 'Câu trả lời ngắn',
}

/** số câu tối đa một hàng của lưới Câu / Đáp án */
export const ANSWER_COLS = 10
export const TF_PARTS = ['a)', 'b)', 'c)', 'd)'] as const

const plain = (rt: RichText) => (typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')).trim()

export function answerKind(answer: RichText): AnswerGroupKind {
  const t = plain(answer).toUpperCase()
  if (/^[A-D]$/.test(t)) return 'choice'
  if (/^[ĐS]{4}$/.test(t.replace(/[\s,;-]/g, ''))) return 'tf'
  return 'short'
}

/** 4 ý Đ/S của một câu đúng/sai */
export const tfParts = (answer: RichText) => plain(answer).toUpperCase().replace(/[\s,;-]/g, '').split('')

/** gom đáp án theo dạng, giữ thứ tự xuất hiện; một dạng duy nhất thì không cần nhãn */
export function groupAnswers(items: AnswerItem[]): AnswerGroup[] {
  const groups: AnswerGroup[] = []
  for (const it of items) {
    const kind = answerKind(it.answer)
    const g = groups.find((x) => x.kind === kind)
    if (g) g.items.push(it)
    else groups.push({ kind, label: LABEL[kind], items: [it] })
  }
  if (groups.length === 1) groups[0].label = ''
  return groups
}

/** chia lưới thành các hàng đủ `per` ô (ô thiếu ở hàng cuối là undefined để giữ thẳng cột) */
export function gridRows(items: AnswerItem[]): { per: number; rows: Array<Array<AnswerItem | undefined>> } {
  const per = Math.min(ANSWER_COLS, items.length || 1)
  const rows: Array<Array<AnswerItem | undefined>> = []
  for (let i = 0; i < items.length; i += per) rows.push(Array.from({ length: per }, (_, k) => items[i + k]))
  return { per, rows }
}
