/** Bấm đúp vào công thức trong đề → mở hộp thoại Công thức điền sẵn LaTeX để sửa. */
import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { EquationDialog } from './InsertMenus'

export function MathEdit({ editor }: { editor: Editor | null }) {
  const [edit, setEdit] = useState<{ pos: number; latex: string } | null>(null)

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    const onDbl = (e: MouseEvent) => {
      if (!editor.isEditable) return
      const el = (e.target as HTMLElement).closest<HTMLElement>('.inline-math')
      if (!el) return
      const pos = editor.view.posAtDOM(el, 0)
      const node = editor.state.doc.nodeAt(pos)
      if (node?.type.name !== 'inlineMath') return
      e.preventDefault()
      setEdit({ pos, latex: String(node.attrs.latex ?? '') })
    }
    dom.addEventListener('dblclick', onDbl)
    return () => dom.removeEventListener('dblclick', onDbl)
  }, [editor])

  if (!edit || !editor || editor.isDestroyed) return null
  return (
    <EquationDialog
      editor={editor}
      initial={edit.latex}
      onClose={() => setEdit(null)}
      onSave={(latex) => {
        const node = editor.state.doc.nodeAt(edit.pos)
        if (node?.type.name !== 'inlineMath') return
        editor.chain().focus().command(({ tr }) => {
          tr.setNodeMarkup(edit.pos, undefined, { ...node.attrs, latex })
          return true
        }).setNodeSelection(edit.pos).run()
      }}
    />
  )
}
