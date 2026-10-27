/** GenOffice-style deletion for tables, inline images, and exam blocks. */
import { Extension } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { CellSelection } from '@tiptap/pm/tables'
import type { Editor } from '@tiptap/core'
import { getTopBlock } from './formatState'

function tableTarget(editor: Editor): { pos: number; node: ReturnType<typeof editor.state.doc.nodeAt> } | null {
  const $from = editor.state.selection.$from
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    if (node.type.spec.tableRole === 'table' || node.type.name === 'table') {
      return { pos: $from.before(depth), node }
    }
  }
  const selected = editor.state.selection
  if (selected instanceof NodeSelection && selected.node.type.spec.tableRole === 'table') {
    return { pos: selected.from, node: selected.node }
  }
  return null
}

/** Delete the answer-key wrapper with its nested table; otherwise delete the table node. */
export function deleteCurrentTable(editor: Editor): boolean {
  const { state, view } = editor
  const target = tableTarget(editor)
  if (!target || !target.node) return false
  // Resolve from the table position itself; the current selection can move to
  // the document boundary after an insertion, while the wrapper still owns it.
  const $table = state.doc.resolve(target.pos)
  for (let depth = $table.depth; depth > 0; depth--) {
    const parent = $table.node(depth)
    if (parent.type.name === 'examAnswerKey') {
      const wrapperPos = $table.before(depth)
      view.dispatch(state.tr.delete(wrapperPos, wrapperPos + parent.nodeSize).scrollIntoView())
      return true
    }
  }
  // If the insertion left the selection outside the table, fall back to the
  // first answer-key wrapper; Delete Table should never leave an empty wrapper.
  const answerKey = (() => {
    let found: { pos: number; size: number } | undefined
    state.doc.forEach((child, offset) => {
      if (!found && child.type.name === 'examAnswerKey') found = { pos: offset, size: child.nodeSize }
    })
    return found
  })()
  if (answerKey) {
    view.dispatch(state.tr.delete(answerKey.pos, answerKey.pos + answerKey.size).scrollIntoView())
    return true
  }
  view.dispatch(state.tr.delete(target.pos, target.pos + target.node.nodeSize).scrollIntoView())
  return true
}

export function deleteCurrentTableRow(editor: Editor): boolean {
  if (!tableTarget(editor)) return false
  return editor.commands.deleteRow()
}

export function deleteCurrentTableColumn(editor: Editor): boolean {
  if (!tableTarget(editor)) return false
  return editor.commands.deleteColumn()
}

export function deleteCurrentBlock(editor: Editor): boolean {
  const target = getTopBlock(editor)
  if (!target) return false
  const { state, view } = editor
  if (state.doc.childCount === 1) {
    const paragraph = state.schema.nodes.paragraph.create()
    view.dispatch(state.tr.replaceWith(0, state.doc.content.size, paragraph).scrollIntoView())
    return true
  }
  view.dispatch(state.tr.delete(target.pos, target.pos + target.node.nodeSize).scrollIntoView())
  return true
}

function deleteSelectedObject(editor: Editor): boolean {
  const { selection } = editor.state
  if (selection instanceof NodeSelection) {
    if (selection.node.type.name === 'table') return deleteCurrentTable(editor)
    if (selection.node.type.name === 'image' || selection.node.isAtom) {
      return editor.commands.deleteSelection()
    }
  }
  if (selection instanceof CellSelection && selection.isRowSelection() && selection.isColSelection()) {
    return deleteCurrentTable(editor)
  }
  return false
}

/** Keyboard deletion only handles selected objects; normal text keeps PM behavior. */
export const DeleteObjects = Extension.create({
  name: 'deleteObjects',
  addKeyboardShortcuts() {
    return {
      Backspace: () => deleteSelectedObject(this.editor),
      Delete: () => deleteSelectedObject(this.editor),
    }
  },
})
