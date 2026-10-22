/**
 * Snapshot trạng thái định dạng tại vị trí con trỏ — nguồn dữ liệu cho ribbon.
 * Tương tự `ribbon-format-state.ts` của GenOffice nhưng thu gọn cho schema đề thi.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import type { FormatAttrs } from '@/data/docTypes'

export interface FormatState {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  sub: boolean
  super: boolean
  highlight: boolean
  highlightColor: string
  color: string
  fontFamily: string
  fontSize: string
  align: 'left' | 'center' | 'right' | 'justify'
  lineHeight: number
  indentLeft: number
  indentFirstLine: number
  spaceBefore: number
  spaceAfter: number
  borders: FormatAttrs['borders']
  shading: string
  /** node block tại con trỏ — null nếu không có (ví dụ ngoài editor) */
  blockType: string | null
}

const DEFAULT_STATE: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  sub: false,
  super: false,
  highlight: false,
  highlightColor: '#fff3a3',
  color: '',
  fontFamily: '',
  fontSize: '',
  align: 'left',
  lineHeight: 1.5,
  indentLeft: 0,
  indentFirstLine: 0,
  spaceBefore: 0,
  spaceAfter: 0,
  borders: undefined,
  shading: '',
  blockType: null,
}

function num(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function computeFormatState(editor: Editor): FormatState {
  const ts = editor.getAttributes('textStyle') as Record<string, unknown>
  const parent = editor.state.selection.$from.parent
  const pa = {
    ...(parent.attrs as Record<string, unknown>),
    ...(editor.getAttributes(parent.type.name) as Record<string, unknown>),
    ...(editor.getAttributes('textAlign') as Record<string, unknown>),
  }
  return {
    bold: editor.isActive('bold'),
    italic: editor.isActive('italic'),
    underline: editor.isActive('underline'),
    strike: editor.isActive('strike'),
    sub: editor.isActive('sub'),
    super: editor.isActive('super'),
    highlight: editor.isActive('highlight'),
    highlightColor: (ts.highlight as string) ?? '#fff3a3',
    color: (ts.color as string) ?? '',
    fontFamily: (ts.fontFamily as string) ?? '',
    fontSize: (ts.fontSize as string) ?? '',
    align: editor.isActive({ textAlign: 'center' })
      ? 'center'
      : editor.isActive({ textAlign: 'right' })
        ? 'right'
        : editor.isActive({ textAlign: 'justify' })
          ? 'justify'
          : (pa.textAlign as FormatState['align']) ?? (pa.align as FormatState['align']) ?? 'left',
    lineHeight: num((editor.getAttributes('textStyle') as Record<string, unknown>).lineHeight ?? pa.lineHeight, 1.5),
    indentLeft: num(pa.indentLeft, 0),
    indentFirstLine: num(pa.indentFirstLine, 0),
    spaceBefore: num(pa.spaceBefore, 0),
    spaceAfter: num(pa.spaceAfter, 0),
    borders: (pa.borders as FormatAttrs['borders']) ?? undefined,
    shading: (pa.shading as string) ?? '',
    blockType: parent.type.name,
  }
}

/**
 * Đồng bộ trạng thái định dạng với editor. Trả về state hiện tại — dùng cho
 * ribbon (memo theo tham chiếu để tránh re-render không cần thiết).
 */
export function useFormatState(editor: Editor | null): FormatState {
  const [state, setState] = useState<FormatState>(DEFAULT_STATE)
  const ref = useRef(state)

  const sync = useCallback(() => {
    if (!editor) return
    const next = computeFormatState(editor)
    // chỉ setState khi có thay đổi (so sánh nông) để khỏi re-render ribbon liên tục
    const prev = ref.current
    const changed = (Object.keys(next) as (keyof FormatState)[]).some((k) => next[k] !== prev[k])
    if (changed) {
      ref.current = next
      setState(next)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    sync()
    editor.on('selectionUpdate', sync)
    editor.on('transaction', sync)
    return () => {
      editor.off('selectionUpdate', sync)
      editor.off('transaction', sync)
    }
  }, [editor, sync])

  return state
}

/**
 * Áp thuộc tính định dạng cấp đoạn (align/lineHeight/indent/space/borders/shading)
 * vào node text chứa con trỏ (prompt/option/bullet/paragraph…) — không phải block
 * cấp cao nhất, để giống Word: căn lề/thụt lề áp cho đoạn đang đứng.
 */
/**
 * Khôi phục selection PM từ selection DOM nếu ribbon click làm state bị trống.
 * `preventDefault` giữ selection trên DOM, nhưng một số browser/IAB không phát
 * transaction selectionchange cho ProseMirror; posAtDOM là fallback chính xác.
 */
export function syncDomSelection(editor: Editor): void {
  const domSel = window.getSelection()
  if (!domSel || domSel.rangeCount === 0 || domSel.isCollapsed) return
  // TipTap's Editor instance can exist one render before EditorContent mounts its
  // ProseMirror view. The getter itself throws before returning undefined, so
  // guard the whole view access rather than checking `editor.view` directly.
  try {
    const view = editor.view
    const root = view.dom
    const range = domSel.getRangeAt(0)
    const startInView = root === range.startContainer || root.contains(range.startContainer)
    const endInView = root === range.endContainer || root.contains(range.endContainer)
    if (!startInView || !endInView) return
    const from = view.posAtDOM(range.startContainer, range.startOffset)
    const to = view.posAtDOM(range.endContainer, range.endOffset)
    if (from !== to && (editor.state.selection.from !== from || editor.state.selection.to !== to)) {
      view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)))
    }
  } catch {
    // View may not be mounted, or DOM selection may be between nodes.
  }
}

/**
 * Tìm block text-bearing tại selection. Khi Ctrl+A chọn toàn bộ doc, `$from`
 * resolve tới depth 0 (trước block đầu tiên) nên vòng lặp depth không có gì để
 * sửa — fallback sang block đầu tiên giao với selection range.
 */
export function getSelectedBlock(editor: Editor): { node: PMNode; pos: number } | null {
  const { state } = editor
  const $from = state.selection.$from
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth)
    if (node.isBlock && node.type.name !== 'doc') return { node, pos: $from.before(depth) }
  }
  const { from, to } = state.selection
  let hit: { node: PMNode; pos: number } | null = null
  state.doc.forEach((child, offset) => {
    if (hit) return
    if (offset + child.nodeSize > from && offset < to) hit = { node: child, pos: offset }
  })
  return hit
}

export function applyFormatAttrs(editor: Editor, patch: Partial<FormatAttrs>): void {
  syncDomSelection(editor)
  const target = getSelectedBlock(editor)
  if (!target) return
  const attrs = { ...target.node.attrs, ...(patch as Record<string, unknown>) }
  editor.view.dispatch(editor.state.tr.setNodeMarkup(target.pos, undefined, attrs))
}
