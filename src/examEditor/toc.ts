/**
 * Mục lục tự động (Chèn → Mục lục): khối atom liệt kê các đề mục (examHeading cấp 1–3)
 * kèm số trang, tự cập nhật khi sửa đề hoặc khi phân trang đổi. Bấm một dòng để nhảy tới đề mục.
 *
 * Số trang đo từ DOM như phân trang (vị trí đề mục / bước trang), nên luôn khớp tờ giấy đang vẽ;
 * bước trang và cách đánh số trang do ExamEditor ghi vào `editor.storage.examToc`.
 */
import { Node, mergeAttributes, type Editor } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'
import { pageGapsKey } from './pagination'
import { pageNumberAt, type PageNumberSetup } from './pageSetup'

export interface TocStorage {
  /** PAGE_H + PAGE_GAP (px gốc, chưa thu phóng) */
  stride: number
  pageNumber?: PageNumberSetup
}

interface Entry { text: string; level: number; pos: number; page: number | null }

function entries(editor: Editor): Entry[] {
  const st = (editor.storage as unknown as Record<string, TocStorage>).examToc
  const view = editor.view
  const stage = (view.dom as HTMLElement).closest('.doc-stage') as HTMLElement | null
  const k = stage && stage.offsetWidth ? stage.getBoundingClientRect().width / stage.offsetWidth : 1
  const top = stage?.getBoundingClientRect().top ?? 0
  const out: Entry[] = []
  editor.state.doc.forEach((node, pos) => {
    if (node.type.name !== 'examHeading') return
    const text = node.textContent.trim()
    if (!text) return
    const dom = view.nodeDOM(pos) as HTMLElement | null
    let page: number | null = null
    if (dom && stage && st.stride) {
      const y = (dom.getBoundingClientRect().top - top) / k
      const physical = Math.floor(y / st.stride) + 1
      // theo số in ở chân trang; tài liệu không đánh số thì dùng số tờ
      page = st.pageNumber?.show ? pageNumberAt(st.pageNumber, physical) : physical
    }
    out.push({ text, level: Math.min(3, Number(node.attrs.level) || 1), pos, page })
  })
  return out
}

export const TocNode = Node.create<Record<string, never>, TocStorage>({
  name: 'examToc',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addStorage() {
    return { stride: 0 }
  },

  addAttributes() {
    return { id: { default: null } }
  },

  parseHTML() {
    return [{ tag: 'div[data-exam-node="examToc"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-exam-node': 'examToc', class: 'exam-toc' })]
  },

  addNodeView() {
    return ({ editor, getPos }) => {
      const dom = document.createElement('div')
      dom.className = 'exam-toc'
      dom.setAttribute('data-exam-node', 'examToc')
      dom.contentEditable = 'false'
      const title = document.createElement('div')
      title.className = 'exam-toc__title'
      title.textContent = 'MỤC LỤC'
      const list = document.createElement('div')
      list.className = 'exam-toc__list'
      dom.append(title, list)

      let last = ''
      let raf = 0
      const render = () => {
        raf = 0
        if (editor.isDestroyed) return
        const self = typeof getPos === 'function' ? getPos() : undefined
        // chỉ các đề mục SAU khối mục lục, như Word đặt mục lục ở đầu tài liệu
        const items = entries(editor).filter((e) => self == null || e.pos > self)
        const key = JSON.stringify(items.map((e) => [e.text, e.level, e.page]))
        if (key === last) return
        last = key
        list.replaceChildren(
          ...(items.length
            ? items.map((e) => {
                const row = document.createElement('button')
                row.type = 'button'
                row.className = `exam-toc__row exam-toc__row--l${e.level}`
                const t = document.createElement('span')
                t.className = 'exam-toc__text'
                t.textContent = e.text
                const dots = document.createElement('span')
                dots.className = 'exam-toc__dots'
                const pg = document.createElement('span')
                pg.className = 'exam-toc__page'
                pg.textContent = e.page == null ? '' : String(e.page)
                row.append(t, dots, pg)
                row.addEventListener('mousedown', (ev) => ev.preventDefault())
                row.addEventListener('click', () => {
                  // đặt con trỏ trước rồi mới cuộn: focus của editor có thể tự cuộn về chỗ cũ
                  editor.chain().setTextSelection(e.pos + 1).focus(undefined, { scrollIntoView: false }).run()
                  requestAnimationFrame(() => {
                    const target = editor.view.nodeDOM(e.pos) as HTMLElement | null
                    target?.scrollIntoView({ block: 'start' })
                  })
                })
                return row
              })
            : [Object.assign(document.createElement('div'), { className: 'exam-toc__empty', textContent: 'Chưa có đề mục nào sau mục lục.' })]),
        )
      }
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(render)
      }
      const onTr = ({ transaction }: { transaction: Transaction }) => {
        if (transaction.docChanged || transaction.getMeta(pageGapsKey) || transaction.getMeta('tocRefresh')) schedule()
      }
      editor.on('transaction', onTr)
      schedule()

      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: (ev) => ev.target instanceof HTMLElement && !!ev.target.closest('.exam-toc__row'),
        destroy: () => {
          editor.off('transaction', onTr)
          if (raf) cancelAnimationFrame(raf)
        },
      }
    }
  },
})
