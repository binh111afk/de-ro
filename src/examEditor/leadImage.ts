/**
 * Đề bài mở đầu bằng ảnh: gắn class `exam-lead-image` (ẩn nhãn ::before) và chèn widget
 * nhãn "Câu N." / "Bài N." ngay sau các ảnh đầu, có xuống dòng trước nhãn. Nhờ vậy ảnh nằm
 * dòng riêng phía trên, nhãn đi cùng dòng chữ và theo căn lề của câu — giống bản Word.
 * CSS không tự biết ảnh có đứng trước mọi chữ không (`:first-child` bỏ qua chữ),
 * nên đánh dấu bằng decoration theo dữ liệu thật.
 */
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const PROMPTS = new Set(['examQuestionPrompt', 'examEssayPrompt'])

function label(kind: 'q' | 'e') {
  const wrap = document.createElement('span')
  wrap.className = 'exam-lead-wrap'
  wrap.contentEditable = 'false'
  wrap.append(document.createElement('br'))
  const s = document.createElement('span')
  s.className = `exam-lead-label exam-lead-label-${kind}`
  wrap.append(s)
  return wrap
}

export const LeadImageExtension = Extension.create({
  name: 'leadImage',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decos: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (!PROMPTS.has(node.type.name)) return true
              if (node.firstChild?.type.name !== 'image') return false
              decos.push(Decoration.node(pos, pos + node.nodeSize, { class: 'exam-lead-image' }))
              // nhãn đặt sau dãy ảnh đầu
              let at = pos + 1
              node.forEach((child, offset) => {
                if (at === pos + 1 + offset && child.type.name === 'image') at = pos + 1 + offset + child.nodeSize
              })
              const kind = node.type.name === 'examQuestionPrompt' ? 'q' : 'e'
              decos.push(Decoration.widget(at, () => label(kind), { side: -1, key: `lead-${kind}` }))
              return false
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})
