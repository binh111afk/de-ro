/**
 * Đề bài mở đầu bằng ảnh: gắn class `exam-lead-image` để CSS đặt ảnh một dòng
 * riêng phía trên, nhãn "Câu N." xuống dòng dưới cùng đề bài — giống bản Word.
 * CSS không tự biết ảnh có đứng trước mọi chữ không (`:first-child` bỏ qua chữ),
 * nên đánh dấu bằng decoration theo dữ liệu thật.
 */
import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const PROMPTS = new Set(['examQuestionPrompt', 'examEssayPrompt'])

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
              if (node.firstChild?.type.name === 'image') decos.push(Decoration.node(pos, pos + node.nodeSize, { class: 'exam-lead-image' }))
              return false
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})
