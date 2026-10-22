/**
 * Editor TipTap cho đề thi — dựng trang A4 thật, phân trang theo khối.
 *
 * Cách làm (giống GenOffice `pagination-slices`):
 *   1. Một ProseMirror duy nhất nằm trong `.doc-flow`, nội dung chảy tự nhiên.
 *   2. Sau mỗi lần giao diện đổi, đo chiều cao từng khối cấp cao nhất.
 *   3. Chia các khối thành "trang" theo vùng nội dung (chiều cao trang − lề).
 *   4. Vẽ lớp giấy trắng (`.doc-paper`) cho từng trang; nội dung vẫn là 1
 *      editor nên không vỡ undo/redo, không vỡ vị trí con trỏ.
 *
 * Vì lớp giấy chỉ là hình ảnh nền, nội dung vẫn "chảy" liên tục như Word.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-text-style/font-family'
import { FontSize } from '@tiptap/extension-text-style/font-size'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { LineHeight } from '@tiptap/extension-text-style/line-height'
import type { Editor, JSONContent } from '@tiptap/core'
import { EXAM_MARKS, EXAM_NODES, TEXT_CONTENT_NODES } from './schema'
import { createSearchPlugin } from './find'
import { DeleteObjects } from './deleteActions'

/** Kích thước A4 ở 96dpi: 1cm = 37.795px */
export const CM = 96 / 2.54
/** Khổ A4 dọc — tính theo orientation tại chỗ dùng, không dùng hằng số cứng */
export const A4_PORTRAIT_W = Math.round(21 * CM) // 794
export const A4_PORTRAIT_H = Math.round(29.7 * CM) // 1123
export const PAGE_GAP = 24

export interface PageSetup {
  /** lề trang (cm), đều 4 cạnh */
  marginCm: number
  /** hướng trang */
  orientation: 'portrait' | 'landscape'
}

export function pageGeometry(setup: PageSetup) {
  const w = setup.orientation === 'landscape' ? A4_PORTRAIT_H : A4_PORTRAIT_W
  const h = setup.orientation === 'landscape' ? A4_PORTRAIT_W : A4_PORTRAIT_H
  const margin = Math.round(setup.marginCm * CM)
  return {
    PAGE_W: w,
    PAGE_H: h,
    MARGIN: margin,
    CONTENT_W: w - margin * 2,
    CONTENT_H: h - margin * 2,
  }
}

export interface ExamEditorProps {
  content: JSONContent
  onChange: (doc: JSONContent) => void
  onReady?: (editor: Editor) => void
  pageSetup?: PageSetup
}

export function ExamEditor({ content, onChange, onReady, pageSetup }: ExamEditorProps) {
  const flowRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const geo = pageGeometry(pageSetup ?? { marginCm: 2, orientation: 'portrait' })
  const { PAGE_W, PAGE_H, MARGIN, CONTENT_H } = geo

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        // các node đề do schema riêng định nghĩa; Link/Underline dùng bản riêng bên dưới
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        hardBreak: false,
        link: false,
        underline: false,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['paragraph', ...TEXT_CONTENT_NODES] }),
      // GenOffice stores line spacing on the text-style mark; using node types
      // here makes setLineHeight silently create an empty span with no CSS.
      LineHeight.configure({ types: ['textStyle'] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      ...EXAM_MARKS,
      ...EXAM_NODES,
      createSearchPlugin(),
      DeleteObjects,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'doc-content',
        spellcheck: 'false',
      },
    },
    onCreate: ({ editor: e }) => {
      // EditorContent mounts its ProseMirror view immediately after this hook.
      // Notify the host on the next frame, then retry once if the view is still
      // being attached. This keeps the ribbon enabled without exposing a
      // pre-mount Editor instance.
      if (!onReady) return
      const notify = () => {
        try {
          if (e.view.dom) onReady(e)
        } catch {
          requestAnimationFrame(notify)
        }
      }
      requestAnimationFrame(notify)
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON())
    },
  })

  // Handles an editor created after the first render (React StrictMode/useEditor).
  useEffect(() => {
    if (!editor || !onReady) return
    try {
      if (editor.view.dom) onReady(editor)
    } catch {
      requestAnimationFrame(() => {
        try {
          if (editor.view.dom) onReady(editor)
        } catch {
          // EditorContent will notify through onCreate when it mounts.
        }
      })
    }
  }, [editor, onReady])

  // nạp lại nội dung khi đổi tab (component được remount bằng key nên không cần,
  // nhưng vẫn giữ để an toàn khi nạp đề từ thư viện)
  useEffect(() => {
    if (!editor) return
    const current = editor.getJSON()
    if (JSON.stringify(current) !== JSON.stringify(content)) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, content])

  /** Đo chiều cao từng khối cấp cao nhất rồi chia trang. */
  const measure = useCallback(() => {
    const flow = flowRef.current
    if (!flow) return
    const blocks = Array.from(
      flow.querySelectorAll<HTMLElement>(':scope > .doc-content > *'),
    )
    if (blocks.length === 0) {
      setPageCount(1)
      return
    }

    const flowTop = flow.getBoundingClientRect().top
    const rows: Array<{ height: number; top: number }> = blocks.map((el) => {
      const rect = el.getBoundingClientRect()
      return { height: rect.height, top: rect.top - flowTop }
    })

    // tính số trang: cộng dồn chiều cao khối cho tới khi vượt quá vùng nội dung
    let pages = 1
    let used = 0
    const gap = 12
    for (const row of rows) {
      const marginBottom = 6
      const need = row.height + marginBottom + (used > 0 ? gap : 0)
      if (used + need > CONTENT_H && used > 0) {
        pages += 1
        used = row.height + marginBottom
      } else {
        used += need
      }
    }
    setPageCount(pages)
  }, [])

  // đo lại khi nội dung đổi, khi font tải xong, khi kích thước đổi
  useLayoutEffect(() => {
    if (!editor) return
    measure()
    const id = requestAnimationFrame(measure)
    const t = setTimeout(measure, 120)
    const ro = new ResizeObserver(measure)
    if (flowRef.current) ro.observe(flowRef.current)
    return () => {
      cancelAnimationFrame(id)
      clearTimeout(t)
      ro.disconnect()
    }
  }, [editor, content, measure])

  // vẽ lớp giấy trắng cho từng trang
  const papers = Array.from({ length: pageCount }, (_, i) => i)

  return (
    <div className="doc-stage" style={{ minHeight: pageCount * (PAGE_H + PAGE_GAP) }}>
      {/* lớp giấy */}
      <div className="doc-papers" aria-hidden="true">
        {papers.map((i) => (
          <div
            key={i}
            className="doc-paper"
            style={{
              top: i * (PAGE_H + PAGE_GAP),
              width: PAGE_W,
              height: PAGE_H,
            }}
          />
        ))}
      </div>

      {/* lớp nội dung — 1 editor duy nhất */}
      <div
        className="doc-flow"
        ref={flowRef}
        style={{
          top: 0,
          left: 0,
          width: PAGE_W,
          padding: `${MARGIN}px ${MARGIN}px`,
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
