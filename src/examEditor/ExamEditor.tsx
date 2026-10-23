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
import { Color } from '@tiptap/extension-text-style/color'
import { FontFamily } from '@tiptap/extension-text-style/font-family'
import { FontSize } from '@tiptap/extension-text-style/font-size'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { LineHeight } from '@tiptap/extension-text-style/line-height'
import type { Editor, JSONContent } from '@tiptap/core'
import { EXAM_MARKS, EXAM_NODES, TEXT_CONTENT_NODES, BaseParagraphNode } from './schema'
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
  /** màu nền trang giấy (mặc định trắng) */
  pageColor?: string
  /** viền trang: độ dày (px) — 0 = không viền */
  pageBorder?: number
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
  /** nhận editor khi nó mount vào DOM (chỉ báo "đã sẵn sàng", không báo hủy) */
  onReady?: (editor: Editor) => void
  pageSetup?: PageSetup
}

export function ExamEditor({ content, onChange, onReady, pageSetup }: ExamEditorProps) {
  const flowRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const geo = pageGeometry(pageSetup ?? { marginCm: 2, orientation: 'portrait' })
  const { PAGE_W, PAGE_H, MARGIN, CONTENT_H } = geo

  // `useEditor` chỉ đọc options ở lần render đầu, nên callback đưa vào
  // options phải đi qua ref để không giữ closure cũ (onChange/onReady hay
  // đổi identity theo tab).
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  /** editor đang sống — dùng để chỉ clear host khi đúng instance bị tháo */
  const liveRef = useRef<Editor | null>(null)

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
        // `paragraph` dùng bản riêng (có formatAttrs) — bản của StarterKit
        // thiếu indentLeft/shading/borders nên các nút đó im lặng.
        paragraph: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Highlight.configure({ multicolor: true }),
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
      BaseParagraphNode,
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
    // KHÔNG báo editor từ `onMount`/`onCreate`: TipTap gọi chúng trong lúc
    // `EditorContent` đang render, mà `onReady` setState ở component cha →
    // React báo "Cannot update a component while rendering a different
    // component". Effect bên dưới báo sau commit nên an toàn.
    //
    // Chỉ báo "đã sẵn sàng", KHÔNG báo "đã hủy": khi đổi tab, editor cũ bị
    // destroy sau khi editor mới đã mount, nên nếu báo `null` ở đó sẽ xóa
    // nhầm editor đang sống. Ribbon tự chặn editor đã `isDestroyed`.
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(e.getJSON())
    },
  })

  // Báo editor cho host sau khi commit. Editor instance có thể bị thay thế
  // (StrictMode remount, `key` đổi khi chuyển tab) — luôn lấy instance mới
  // nhất và bỏ qua instance đã bị destroy.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    let raf = 0
    const report = () => {
      if (editor.isDestroyed) return
      liveRef.current = editor
      onReadyRef.current?.(editor)
    }
    // `EditorContent` gắn ProseMirror view trong `componentDidMount`; effect
    // cha chạy sau nên view đã sẵn sàng, nhưng đợi thêm 1 frame cho chắc.
    raf = requestAnimationFrame(report)
    return () => cancelAnimationFrame(raf)
  }, [editor])

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
  const pageColor = pageSetup?.pageColor ?? '#ffffff'
  const pageBorder = pageSetup?.pageBorder ?? 0

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
              background: pageColor,
              border: pageBorder ? `${pageBorder}px solid #000` : undefined,
              boxSizing: 'border-box',
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
        {!content.content?.length && (
          <button
            type="button"
            className="doc-placeholder"
            style={{ top: MARGIN, left: MARGIN }}
            onClick={() => editor?.commands.focus()}
          >
            Bắt đầu soạn đề…
          </button>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
