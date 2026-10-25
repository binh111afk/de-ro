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
import 'katex/dist/katex.min.css'
import { EXAM_MARKS, EXAM_NODES, TEXT_CONTENT_NODES, BaseParagraphNode } from './schema'
import { BLOCK_TEMPLATE_MIME } from './templates'
import { createSearchPlugin } from './find'
import { ChoiceLayoutExtension, choiceColsKey, measureChoiceColumns } from './choiceLayout'
import { PaginationExtension, pageGapsKey, computePagePlan } from './pagination'

/** map rỗng dùng chung — tránh tạo Map mới mỗi lượt đo. */
const EMPTY_GAPS = new Map<number, number>()
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
  const { PAGE_W, PAGE_H, MARGIN, CONTENT_W, CONTENT_H } = geo

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
      ChoiceLayoutExtension,
      PaginationExtension,
      DeleteObjects,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'doc-content',
        spellcheck: 'false',
      },
      // Kéo khối mẫu từ nav panel vào trang — port `handleDrop`/`dropRange`
      // của soandethi: thả ở nửa trên khối cấp cao nhất → chèn trước khối đó,
      // nửa dưới → chèn sau.
      handleDrop: (view, event) => {
        const raw = event.dataTransfer?.getData(BLOCK_TEMPLATE_MIME)
        if (!raw || !view.editable) return false
        event.preventDefault()
        const ed = liveRef.current
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!ed || ed.isDestroyed || !coords) return true
        const $pos = ed.state.doc.resolve(coords.pos)
        let at = coords.pos
        if ($pos.depth > 0) {
          const before = $pos.before(1)
          const dom = view.nodeDOM(before)
          const rect = dom instanceof HTMLElement ? dom.getBoundingClientRect() : null
          at = rect && event.clientY < rect.top + rect.height / 2 ? before : $pos.after(1)
        }
        try {
          ed.chain().focus().insertContentAt(at, JSON.parse(raw)).run()
        } catch {
          // payload kéo hỏng — bỏ qua, không chèn gì
        }
        return true
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

  // Bố cục phương án (1/2/3/4 cột) — đo bản clone NGOÀI editor rồi áp số cột
  // bằng decoration. Không ghi inline style/class lên node của ProseMirror:
  // làm vậy PM coi là DOM mutation ngoài → đọc lại DOM, selection nhảy.
  useEffect(() => {
    if (!editor) return
    const flow = flowRef.current
    if (!flow) return
    let raf = 0

    const run = () => {
      raf = 0
      if (editor.isDestroyed) return
      const questions = flow.querySelectorAll<HTMLElement>(
        "div[data-exam-node='examQuestion']",
      )
      const next = new Map<string, number>()
      questions.forEach((el) => {
        const id = el.dataset.id
        if (!id) return // document cũ hiếm khi thiếu id — để mặc định 2 cột
        next.set(id, measureChoiceColumns(el))
      })
      const current = choiceColsKey.getState(editor.state)
      let changed = (current?.size ?? 0) !== next.size
      if (!changed && current) {
        for (const [id, cols] of next) {
          if (current.get(id) !== cols) {
            changed = true
            break
          }
        }
      }
      if (changed) {
        editor.view.dispatch(
          editor.state.tr.setMeta(choiceColsKey, next).setMeta('addToHistory', false),
        )
      }
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(run)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(flow)
    const mo = new MutationObserver(schedule)
    mo.observe(flow, { subtree: true, childList: true, characterData: true })
    schedule()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
    }
  }, [editor])

  /**
   * Một lượt bố cục: đo khối → tính spacer ngắt trang + số tờ giấy.
   *
   * Spacer do PM quản (widget decoration). Khi đo, trừ đi các spacer đã biết để
   * lấy vị trí tự nhiên → chèn spacer không làm lệch kết quả nên hội tụ, không
   * dao động. Khối cao hơn cả trang thì để tràn (không cắt nội dung bên trong).
   */
  const layoutPass = useCallback(() => {
    const flow = flowRef.current
    if (!flow) return
    // TipTap v3 bọc `.doc-content` trong div của `EditorContent` → lấy trực tiếp
    // phần tử rồi đọc con của nó, đừng dùng `:scope > .doc-content`.
    const contentEl = flow.querySelector<HTMLElement>('.doc-content')
    if (!contentEl) {
      setPageCount(1)
      return
    }
    // bỏ qua chính các widget spacer (PM render chúng thành con của .doc-content)
    const els = (Array.from(contentEl.children) as HTMLElement[]).filter(
      (el) => !el.classList.contains('doc-page-gap'),
    )
    if (els.length === 0) {
      setPageCount(1)
      return
    }

    const current = editor ? (pageGapsKey.getState(editor.state) ?? EMPTY_GAPS) : EMPTY_GAPS
    const contentTop = contentEl.getBoundingClientRect().top
    const heights: number[] = []
    const spaces: number[] = []
    let gapAcc = 0
    let prevBottom = 0
    els.forEach((el, i) => {
      gapAcc += current.get(i) ?? 0
      const rect = el.getBoundingClientRect()
      const naturalTop = rect.top - contentTop - gapAcc
      // giữ số thực để không dồn sai số làm tròn qua nhiều khối; chỉ spacer
      // cuối cùng được làm tròn (trong computePagePlan) để ổn định vòng đo.
      spaces.push(i === 0 ? naturalTop : naturalTop - prevBottom)
      heights.push(rect.height)
      prevBottom = naturalTop + rect.height
    })

    const plan = computePagePlan(heights, spaces, CONTENT_H, PAGE_H + PAGE_GAP, MARGIN)
    setPageCount(plan.pages)

    // chỉ dispatch khi bản đồ spacer thực sự đổi
    let changed = plan.gaps.size !== current.size
    if (!changed) {
      for (const [i, h] of plan.gaps) {
        if (current.get(i) !== h) {
          changed = true
          break
        }
      }
    }
    if (changed && editor && !editor.isDestroyed) {
      editor.view.dispatch(
        editor.state.tr.setMeta(pageGapsKey, plan.gaps).setMeta('addToHistory', false),
      )
    }
  }, [editor, CONTENT_H, PAGE_H, MARGIN])

  // đo lại khi nội dung đổi, font tải xong, kích thước đổi. Mọi trigger gộp
  // vào một rAF để tránh mutation storm khi widget spacer vừa được chèn.
  useLayoutEffect(() => {
    if (!editor) return
    let raf = 0
    const schedule = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0
          layoutPass()
        })
      }
    }
    schedule()
    const t = setTimeout(schedule, 120)
    const flow = flowRef.current
    const ro = new ResizeObserver(schedule)
    if (flow) ro.observe(flow)
    const mo = new MutationObserver(schedule)
    if (flow) mo.observe(flow, { subtree: true, childList: true, characterData: true })
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      ro.disconnect()
      mo.disconnect()
    }
  }, [editor, content, layoutPass])

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
          // ngữ cảnh hình học cho CSS khối đề (khoảng cách phương án, thụt lề…)
          '--doc-content-w': `${CONTENT_W}px`,
          '--doc-margin': `${MARGIN}px`,
          '--doc-orient': pageSetup?.orientation ?? 'portrait',
        } as React.CSSProperties}
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
