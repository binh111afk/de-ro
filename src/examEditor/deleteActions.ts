/** GenOffice-style deletion for tables, inline images, and exam blocks. */
import { Extension } from '@tiptap/core'
import { NodeSelection, Selection, TextSelection } from '@tiptap/pm/state'
import type { Node as PmNode } from '@tiptap/pm/model'
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

/** khối cấp cao nhất không còn chữ, hình hay nút nào (vd. câu hỏi đã xoá hết chữ, chỉ còn nhãn "Câu 1.") */
function isEmptyShell(node: PmNode): boolean {
  if (node.isTextblock || node.textContent.trim()) return false
  let leaf = false
  node.descendants((n) => { if (n.isLeaf && !n.isText) leaf = true; return !leaf })
  return !leaf
}

/** xoá cả khối cấp cao nhất, đặt con trỏ ở cuối khối trước (không có thì đầu khối sau) */
function removeTopBlock(editor: Editor, index: number): boolean {
  const { state, view } = editor
  const doc = state.doc
  let from = 0
  for (let i = 0; i < index; i++) from += doc.child(i).nodeSize
  const node = doc.child(index)
  const tr = doc.childCount === 1
    ? state.tr.replaceWith(0, doc.content.size, state.schema.nodes.paragraph.create())
    : state.tr.delete(from, from + node.nodeSize)
  const at = Math.min(from, tr.doc.content.size)
  const sel = (index > 0 ? Selection.findFrom(tr.doc.resolve(at), -1, true) : null) ?? Selection.findFrom(tr.doc.resolve(at), 1, true) ?? Selection.atStart(tr.doc)
  view.dispatch(tr.setSelection(sel).scrollIntoView())
  return true
}

/**
 * Backspace ở đầu / Delete ở cuối một dòng trong khối mẫu (câu hỏi, đầu đề hai cột, lưới…):
 * - khối đã rỗng → xoá luôn cả khối (không để lại "Câu 1." trơ trọi, kể cả khi khối đứng đầu đề);
 * - không nối được dòng → đưa con trỏ sang dòng kề bên, KHÔNG chọn nguyên khối bên cạnh
 *   (mặc định của ProseMirror chọn cả đoạn kề, bấm thêm lần nữa là mất đoạn đó: con trỏ "nhảy" và xoá nhầm).
 */
function deleteAtEdge(editor: Editor, dir: -1 | 1): boolean {
  const { state, view } = editor
  const sel = state.selection
  if (!(sel instanceof TextSelection) || !sel.empty) return false
  const $pos = sel.$from
  if (!$pos.parent.isTextblock) return false
  const atEdge = dir < 0 ? $pos.parentOffset === 0 : $pos.parentOffset === $pos.parent.content.size
  if (!atEdge) return false
  const topIndex = $pos.index(0)
  const top = state.doc.child(topIndex)
  if ($pos.depth >= 2 && isEmptyShell(top)) return removeTopBlock(editor, topIndex)
  // ô hình / nút đứng kề: giữ cách mặc định (chọn rồi xoá)
  const side = dir < 0 ? state.doc.resolve($pos.before()).nodeBefore : state.doc.resolve($pos.after()).nodeAfter
  if (side?.isAtom) return false
  if (dir < 0 ? editor.commands.joinBackward() : editor.commands.joinForward()) return true
  const edge = dir < 0 ? $pos.before() : $pos.after()
  const next = Selection.findFrom(state.doc.resolve(edge), dir, true)
  if (next) view.dispatch(state.tr.setSelection(next).scrollIntoView())
  return true
}

/** Keyboard deletion: selected objects, then edges of exam blocks; normal text keeps PM behavior. */
export const DeleteObjects = Extension.create({
  name: 'deleteObjects',
  addKeyboardShortcuts() {
    return {
      Backspace: () => deleteSelectedObject(this.editor) || deleteAtEdge(this.editor, -1),
      Delete: () => deleteSelectedObject(this.editor) || deleteAtEdge(this.editor, 1),
    }
  },
})
