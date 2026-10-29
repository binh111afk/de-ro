/**
 * Bố cục phương án trắc nghiệm — port từ soandethi (plugin `choiceLayout`).
 *
 * Bản gốc đặt số cột theo bề rộng **thật** của từng phương án: nếu 4 phương án
 * ngắn thì xếp 4 cột, dài thì 2, rất dài thì 1.
 *
 * Bài học từ lần làm sai đầu tiên (chặng 16b): KHÔNG được ghi inline style
 * hay toggle class trên node do ProseMirror quản lý. PM coi đó là DOM mutation
 * ngoài và đọc lại DOM để đồng bộ selection → con trỏ nhảy, block reflow loạn.
 * Vì vậy ở đây:
 *   1. Đo trên **bản clone** đặt ngoài editor (không đụng DOM thật).
 *   2. Áp số cột bằng ProseMirror **Decoration** (class do PM tự quản), CSS
 *      `.exam-cols-N` quyết định grid-template-columns.
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const OPTION = ":scope > div[data-exam-node='examOption']"
const MAX_COLS = 4

/**
 * Số cột lớn nhất mà mọi phương án còn vừa (chỉ chia đều được khi số phương án
 * chia hết cho số cột). Trả 1 khi không xếp nổi 2 cột.
 */
export function chooseColumns(
  widths: number[],
  available: number,
  gap: number,
  maxCols = MAX_COLS,
): number {
  for (let n = Math.min(widths.length, maxCols); n >= 2; n--) {
    if (widths.length % n !== 0) continue
    const cell = (available - gap * (n - 1)) / n
    if (widths.every((w) => w + 2 <= cell)) return n
  }
  return 1
}

/**
 * Đo số cột cho một câu hỏi. Clone câu hỏi vào một host `.doc-content` ẩn ngoài
 * editor để CSS (font, phương án, khoảng cách cột) áp đúng như thật, rồi cho
 * các phương án co về bề rộng nội dung bằng `.exam-choice-measuring`.
 */
export function measureChoiceColumns(question: HTMLElement): number {
  const options = Array.from(question.querySelectorAll<HTMLElement>(OPTION))
  if (options.length < 2) return 1

  // Có xuống dòng cứng hoặc công thức dạng khối → một phương án cần cả hàng.
  if (options.some((o) => o.querySelector('br:not(.ProseMirror-trailingBreak), .katex-display'))) {
    return 1
  }

  const gap = parseFloat(getComputedStyle(question).columnGap) || 0
  const available = question.clientWidth
  if (available <= 0) return 1

  const host = document.createElement('div')
  host.className = 'doc-content'
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${available}px;visibility:hidden;pointer-events:none;`
  const clone = question.cloneNode(true) as HTMLElement
  clone.classList.add('exam-choice-measuring')
  host.appendChild(clone)
  document.body.appendChild(host)
  try {
    const widths = Array.from(clone.querySelectorAll<HTMLElement>(OPTION)).map((o) =>
      Math.ceil(o.getBoundingClientRect().width),
    )
    return chooseColumns(widths, available, gap)
  } finally {
    host.remove()
  }
}

/** Meta key: Map<id câu hỏi, số cột> do effect đo gửi vào. */
export const choiceColsKey = new PluginKey<Map<string, number>>('choiceCols')

/** Id ổn định của khối câu hỏi (position đổi khi chèn/xoá khối trước nó). */
function questionKey(node: { attrs: Record<string, unknown> }, pos: number): string {
  return typeof node.attrs.id === 'string' && node.attrs.id ? node.attrs.id : `pos:${pos}`
}

/**
 * Extension: giữ bảng số cột theo id câu hỏi và render thành class
 * `exam-cols-N` bằng decoration. Class nằm trong sổ của PM nên mọi lần
 * re-render đều giữ nguyên, không cần ghi lại DOM.
 */
export const ChoiceLayoutExtension = Extension.create({
  name: 'choiceLayout',
  addProseMirrorPlugins() {
    return [
      new Plugin<Map<string, number>>({
        key: choiceColsKey,
        state: {
          init: () => new Map(),
          apply(tr, prev) {
            const meta = tr.getMeta(choiceColsKey) as Map<string, number> | undefined
            return meta ?? prev
          },
        },
        props: {
          decorations(state) {
            const cols = choiceColsKey.getState(state)
            if (!cols || cols.size === 0) return null
            const decos: Decoration[] = []
            state.doc.forEach((node, offset) => {
              // đúng/sai và trả lời ngắn có bố cục riêng (CSS theo data-kind), không đo số cột
              if (node.type.name !== 'examQuestion' || node.attrs.kind) return
              const n = cols.get(questionKey(node, offset))
              // 2 cột là mặc định trong CSS → không cần class
              if (n && n !== 2) {
                decos.push(
                  Decoration.node(offset, offset + node.nodeSize, { class: `exam-cols-${n}` }),
                )
              }
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})
