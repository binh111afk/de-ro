/**
 * Câu trong kho câu hỏi thành khối của trình soạn. Gom nhiều câu thành một khối mẫu
 * để chèn một lần qua đường chèn chung (`insertBlockTemplate`), nên thứ tự chọn được giữ nguyên.
 */
import type { JSONContent } from '@tiptap/core'
import type { BankEntry } from '@/data/bank'
import type { BlockTemplate } from './templates'

const text = (s: string): JSONContent => ({ type: 'text', text: s })

/** Một câu thành khối: trắc nghiệm có phương án → khối câu trắc nghiệm; còn lại → khối tự luận. */
function entryBlock(entry: BankEntry, seq: number): JSONContent {
  const stamp = `${Date.now()}-${seq}`
  if (entry.type === 'trac-nghiem' && entry.options?.length) {
    return {
      type: 'examQuestion',
      attrs: { id: `q${stamp}`, no: 1 },
      content: [
        { type: 'examQuestionPrompt', attrs: { id: `qp${stamp}` }, content: [text(entry.prompt)] },
        ...entry.options.map((o) => ({
          type: 'examOption',
          attrs: { id: `qo${stamp}-${o.key}`, label: o.key },
          content: [text(o.text)],
        })),
      ],
    }
  }
  return {
    type: 'examEssay',
    attrs: { id: `es${stamp}`, no: 1, score: entry.points },
    content: [{ type: 'examEssayPrompt', attrs: { id: `ep${stamp}` }, content: [text(entry.prompt)] }],
  }
}

/** Các câu đã chọn, theo đúng thứ tự chọn, thành một khối mẫu để chèn tại con trỏ. */
export function bankSelectionTemplate(entries: BankEntry[]): BlockTemplate {
  return {
    id: 'bank-selection',
    group: 'Câu hỏi',
    label: 'Câu từ kho',
    desc: '',
    build: () => entries.map(entryBlock),
  }
}
