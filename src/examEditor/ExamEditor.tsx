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
import { LeadImageExtension } from './leadImage'
import {
  PaginationExtension,
  pageGapsKey,
  computeRichPagePlan,
  type LayoutItem,
  type PageWidget,
  type SimpleLayoutItem,
  type TableCellLayout,
  type TableRowLayout,
  type TableSplitLine,
} from './pagination'

/** mảng rỗng dùng chung — tránh tạo mảng mới mỗi lượt đo. */
const EMPTY_WIDGETS: PageWidget[] = []
const SPLITTABLE_CONTAINERS = new Set(['examAnswerKey', 'examRubric', 'examEssay', 'examBullets', 'examQuestion'])

function precedingGapMap(parentEl: Element): { map: Map<Element, number>; total: number } {
  const map = new Map<Element, number>()
  let acc = 0
  for (const child of Array.from(parentEl.children)) {
    if (child.classList.contains('doc-page-gap')) {
      acc += parseFloat((child as HTMLElement).style.height) || 0
    } else {
      map.set(child, acc)
    }
  }
  return { map, total: acc }
}

function sameWidgets(a: PageWidget[], b: PageWidget[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].pos !== b[i].pos || a[i].height !== b[i].height || a[i].kind !== b[i].kind) return false
  }
  return true
}

function sameSplitLines(a: TableSplitLine[], b: TableSplitLine[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].top !== b[i].top || a[i].left !== b[i].left || a[i].width !== b[i].width) return false
  }
  return true
}
import { DeleteObjects } from './deleteActions'

import { EditorContextMenu } from './EditorContextMenu'
import { MathEdit } from './MathEdit'
import { A4_PORTRAIT_H, A4_PORTRAIT_W, CM, PAGE_GAP, marginsOf, pageGeometry, bandAt, type PageMargins, type PageSetup } from './pageSetup'
export { A4_PORTRAIT_H, A4_PORTRAIT_W, CM, PAGE_GAP, marginsOf, pageGeometry, type PageMargins, type PageSetup }

export interface ExamEditorProps {
  content: JSONContent
  onChange: (doc: JSONContent) => void
  /** nhận editor khi nó mount vào DOM (chỉ báo "đã sẵn sàng", không báo hủy) */
  onReady?: (editor: Editor) => void
  pageSetup?: PageSetup
  /** chỉ xem (trang xem đề cộng đồng): cùng giấy A4 và kiểu chữ như trình soạn, không sửa được */
  readOnly?: boolean
  /** Chế độ dàn trang theo màn hình (mobile view) */
  isReflow?: boolean
}

export function ExamEditor({ content, onChange, onReady, pageSetup, readOnly, isReflow }: ExamEditorProps) {
  const flowRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)
  const [splitLines, setSplitLines] = useState<TableSplitLine[]>([])
  const geo = pageGeometry(pageSetup ?? { marginCm: 2, orientation: 'portrait' })
  const { PAGE_W, PAGE_H, MARGIN, MARGIN_TOP, MARGIN_RIGHT, MARGIN_BOTTOM, CONTENT_W, CONTENT_H } = geo

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
      LeadImageExtension,
      PaginationExtension,
      DeleteObjects,
    ],
    content,
    editable: !readOnly,
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
    // editor cũ có thể đã bị huỷ khi đổi tab dồn dập (vd. khôi phục phiên sau F5)
    if (!editor || editor.isDestroyed) return
    try {
      const current = editor.getJSON()
      if (JSON.stringify(current) !== JSON.stringify(content)) {
        editor.commands.setContent(content, { emitUpdate: false })
      }
    } catch {
      // editor đang ở trạng thái "đã gỡ, chưa huỷ" (StrictMode gắn lại) — bộ lệnh chưa có; lần gắn sau sẽ nạp
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
   * Một lượt bố cục: đo khối (kể cả bảng, dòng bảng, ô nhiều đoạn, khối dài)
   * → tính spacer ngắt trang + số tờ giấy + đường kẻ mép bảng bị cắt.
   *
   * Spacer do PM quản (widget decoration). Khi đo, trừ đi các spacer đã biết để
   * lấy vị trí tự nhiên → chèn spacer không làm lệch kết quả nên hội tụ, không
   * dao động.
   */
  const layoutPass = useCallback(() => {
    if (isReflow) {
      setPageCount(1)
      setSplitLines((prev) => (prev.length ? [] : prev))
      if (editor && !editor.isDestroyed) {
        const current = pageGapsKey.getState(editor.state)
        if (current && current.length > 0) {
          editor.view.dispatch(
            editor.state.tr.setMeta(pageGapsKey, EMPTY_WIDGETS).setMeta('addToHistory', false),
          )
        }
      }
      return
    }
    const flow = flowRef.current
    if (!flow || !editor || editor.isDestroyed) return
    const contentEl = flow.querySelector<HTMLElement>('.doc-content')
    if (!contentEl) {
      setPageCount(1)
      setSplitLines((prev) => (prev.length ? [] : prev))
      return
    }
    const view = editor.view
    const contentRect = contentEl.getBoundingClientRect()
    const k = contentEl.offsetWidth ? contentRect.width / contentEl.offsetWidth : 1
    // contentTop = đỉnh vùng nội dung trang 1 (sau padding-top của .doc-flow)
    const contentTop = contentRect.top
    const doc = editor.state.doc

    const measureTable = (
      tableNode: typeof doc.firstChild & {},
      tablePos: number,
      tableEl: HTMLElement,
      baseGapAcc: number,
    ): { item: LayoutItem; totalGrowth: number } => {
      const tableRect = tableEl.getBoundingClientRect()
      const rows: TableRowLayout[] = []
      let rowGapAcc = 0

      tableNode.forEach((rowNode, rowRelPos) => {
        const rowPos = tablePos + 1 + rowRelPos
        const tr = view.nodeDOM(rowPos)
        if (!(tr instanceof HTMLElement)) return
        const trRect = tr.getBoundingClientRect()
        const rowNaturalTop = (trRect.top - contentTop) / k - baseGapAcc - rowGapAcc
        const cells: TableCellLayout[] = []
        let rowPushGap = 0
        const tdOwnHeights: number[] = []
        let hasAnyGap = false

        rowNode.forEach((cellNode, cellRelPos) => {
          const cellPos = rowPos + 1 + cellRelPos
          const td = view.nodeDOM(cellPos)
          if (!(td instanceof HTMLElement)) return
          const rowSpan = Number(cellNode.attrs.rowspan) || 1
          const { map: tdGaps, total: tdGapTotal } = precedingGapMap(td)
          if (tdGapTotal > 0) hasAnyGap = true
          if (td.firstElementChild?.classList.contains('doc-page-gap--row')) {
            rowPushGap = Math.max(rowPushGap, tdGapTotal)
          }

          const children: SimpleLayoutItem[] = []
          let lastPRect: DOMRect | null = null
          cellNode.forEach((_pNode, pRelPos) => {
            const pPos = cellPos + 1 + pRelPos
            const pEl = view.nodeDOM(pPos)
            if (!(pEl instanceof HTMLElement)) return
            const pRect = pEl.getBoundingClientRect()
            lastPRect = pRect
            const pGapBefore = tdGaps.get(pEl) ?? 0
            children.push({
              kind: 'block',
              pos: pPos,
              naturalTop: (pRect.top - contentTop) / k - baseGapAcc - rowGapAcc - pGapBefore,
              height: pRect.height / k,
            })
          })

          const cs = getComputedStyle(td)
          const padBottom = (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0)
          if (rowSpan <= 1 && lastPRect) {
            const tdRect = td.getBoundingClientRect()
            tdOwnHeights.push(((lastPRect as DOMRect).bottom - tdRect.top) / k - tdGapTotal + padBottom)
          }
          cells.push({ pos: cellPos, rowSpan, padBottom, children })
        })

        let rowNaturalHeight = trRect.height / k
        let rowGrowth = 0
        if (hasAnyGap) {
          if (rowPushGap > 0) {
            rowGrowth = rowPushGap
            rowNaturalHeight = Math.max(16, trRect.height / k - rowGrowth)
          } else if (tdOwnHeights.length > 0) {
            rowNaturalHeight = Math.max(16, ...tdOwnHeights)
            rowGrowth = Math.max(0, trRect.height / k - rowNaturalHeight)
          }
        }
        rowGapAcc += rowGrowth

        rows.push({
          pos: rowPos,
          naturalTop: rowNaturalTop,
          height: rowNaturalHeight,
          cells,
        })
      })

      return {
        item: {
          kind: 'table',
          pos: tablePos,
          naturalTop: (tableRect.top - contentTop) / k - baseGapAcc,
          height: Math.max(0, tableRect.height / k - rowGapAcc),
          rows,
        },
        totalGrowth: rowGapAcc,
      }
    }

    const { map: topGaps } = precedingGapMap(contentEl)
    const items: LayoutItem[] = []
    doc.forEach((node, offset) => {
      const dom = view.nodeDOM(offset)
      if (!(dom instanceof HTMLElement)) return
      const gapAcc = topGaps.get(dom) ?? 0
      const rect = dom.getBoundingClientRect()
      const naturalTop = (rect.top - contentTop) / k - gapAcc

      if (node.type.name === 'table') {
        items.push(measureTable(node, offset, dom, gapAcc).item)
        return
      }

      if (SPLITTABLE_CONTAINERS.has(node.type.name)) {
        const { map: innerGaps, total: innerGapTotal } = precedingGapMap(dom)
        let tableGrowth = 0
        const children: LayoutItem[] = []
        node.forEach((child, childRelPos) => {
          const childPos = offset + 1 + childRelPos
          const childEl = view.nodeDOM(childPos)
          if (!(childEl instanceof HTMLElement)) return
          const childGapAcc = gapAcc + (innerGaps.get(childEl) ?? 0) + tableGrowth
          if (child.type.name === 'table') {
            const res = measureTable(child, childPos, childEl, childGapAcc)
            tableGrowth += res.totalGrowth
            children.push(res.item)
          } else {
            const cRect = childEl.getBoundingClientRect()
            children.push({
              kind: 'block',
              pos: childPos,
              naturalTop: (cRect.top - contentTop) / k - childGapAcc,
              height: cRect.height / k,
            })
          }
        })
        items.push({
          kind: 'container',
          pos: offset,
          naturalTop,
          height: Math.max(0, rect.height / k - innerGapTotal - tableGrowth),
          children,
        })
        return
      }

      items.push({
        kind: 'block',
        pos: offset,
        naturalTop,
        height: rect.height / k,
      })
    })

    if (items.length === 0) {
      setPageCount(1)
      setSplitLines((prev) => (prev.length ? [] : prev))
      return
    }

    const stride = PAGE_H + PAGE_GAP
    const plan = computeRichPagePlan(items, CONTENT_H, stride, MARGIN_TOP)
    setPageCount(plan.pages)

    const current = pageGapsKey.getState(editor.state) ?? EMPTY_WIDGETS
    if (!sameWidgets(plan.widgets, current)) {
      view.dispatch(editor.state.tr.setMeta(pageGapsKey, plan.widgets).setMeta('addToHistory', false))
      return
    }

    // DOM đã ổn định → tính đường kẻ ngang đóng/mở bảng ở ranh giới trang
    const nextLines: TableSplitLine[] = []
    if (plan.pages > 1) {
      const stageRect = (flow.parentElement ?? flow).getBoundingClientRect()
      const tds = contentEl.querySelectorAll<HTMLElement>('table td, table th')
      tds.forEach((td) => {
        if (td.firstElementChild?.classList.contains('doc-page-gap--row')) return
        const tdRect = td.getBoundingClientRect()
        const tdTop = (tdRect.top - contentTop) / k + MARGIN_TOP
        const tdBottom = (tdRect.bottom - contentTop) / k + MARGIN_TOP
        const tdLeft = Math.round((tdRect.left - stageRect.left) / k)
        const tdWidth = Math.round(tdRect.width / k)
        for (let b = 0; b < plan.pages - 1; b++) {
          const cutY = MARGIN_TOP + b * stride + CONTENT_H
          const resumeY = MARGIN_TOP + (b + 1) * stride
          if (tdTop < cutY - 1 && tdBottom > resumeY + 1) {
            nextLines.push({ top: cutY - 1, left: tdLeft, width: tdWidth })
            nextLines.push({ top: resumeY, left: tdLeft, width: tdWidth })
          }
        }
      })
    }
    setSplitLines((prev) => (sameSplitLines(prev, nextLines) ? prev : nextLines))
  }, [editor, CONTENT_H, PAGE_H, MARGIN_TOP, isReflow])

  // mục lục đọc bước trang và cách đánh số trang từ storage; báo nó vẽ lại khi đổi
  const pageNumberKey = JSON.stringify(pageSetup?.pageNumber ?? null)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const st = (editor.storage as unknown as Record<string, unknown>).examToc as { stride: number; pageNumber?: PageSetup['pageNumber'] }
    st.stride = isReflow ? 0 : PAGE_H + PAGE_GAP
    st.pageNumber = pageSetup?.pageNumber
    editor.view.dispatch(editor.state.tr.setMeta('tocRefresh', true).setMeta('addToHistory', false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, PAGE_H, isReflow, pageNumberKey])

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
  let flowMask: string | undefined
  if (!isReflow && pageCount > 1) {
    const stride = PAGE_H + PAGE_GAP
    const stops = ['#000 0px']
    for (let p = 0; p < pageCount - 1; p++) {
      const cut = MARGIN_TOP + p * stride + CONTENT_H
      const resume = MARGIN_TOP + (p + 1) * stride
      stops.push(`#000 ${cut}px`, `transparent ${cut}px`, `transparent ${resume}px`, `#000 ${resume}px`)
    }
    stops.push('#000 100%')
    flowMask = `linear-gradient(to bottom, ${stops.join(', ')})`
  }

  return (
    <div
      className="doc-stage"
      style={{
        width: isReflow ? '100%' : PAGE_W,
        minHeight: isReflow ? undefined : pageCount * (PAGE_H + PAGE_GAP),
      }}
    >
      {/* lớp giấy */}
      {!isReflow && (
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
          >
            {(['top', 'bottom'] as const).map((place) => {
              const slots = bandAt(pageSetup, place, i + 1)
              if (!slots) return null
              return (
                <div
                  key={place}
                  className="doc-page-band"
                  style={{
                    left: MARGIN,
                    right: MARGIN_RIGHT,
                    // giữa lề trên/dưới, giống đầu/chân trang Word
                    ...(place === 'top'
                      ? { top: Math.max(8, MARGIN_TOP / 2 - 10) }
                      : { bottom: Math.max(8, MARGIN_BOTTOM / 2 - 10) }),
                  }}
                >
                  <span>{slots.left}</span>
                  <span>{slots.center}</span>
                  <span>{slots.right}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      )}

      {/* đường kẻ ngang đóng/mở bảng khi bảng bị cắt qua ranh giới trang */}
      {!isReflow && splitLines.length > 0 && (
        <div className="doc-split-lines" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          {splitLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                top: line.top,
                left: line.left,
                width: line.width,
                height: 1,
                background: '#000',
              }}
            />
          ))}
        </div>
      )}

      {/* lớp nội dung — 1 editor duy nhất */}
      <div
        className="doc-flow"
        ref={flowRef}
        style={{
          top: isReflow ? undefined : 0,
          left: isReflow ? undefined : 0,
          width: isReflow ? '100%' : PAGE_W,
          maxWidth: isReflow ? '100%' : undefined,
          boxSizing: 'border-box',
          padding: isReflow ? '12px 12px 60px' : `${MARGIN_TOP}px ${MARGIN_RIGHT}px ${MARGIN_BOTTOM}px ${MARGIN}px`,
          maskImage: flowMask,
          WebkitMaskImage: flowMask,
          // ngữ cảnh hình học cho CSS khối đề (khoảng cách phương án, thụt lề…)
          '--doc-content-w': isReflow ? '100%' : `${CONTENT_W}px`,
          '--doc-margin': isReflow ? '12px' : `${MARGIN}px`,
          '--doc-orient': pageSetup?.orientation ?? 'portrait',
          '--doc-paper-bg': pageColor,
        } as React.CSSProperties}
      >
        {!readOnly && !content.content?.length && (
          <button
            type="button"
            className="doc-placeholder"
            style={{ top: isReflow ? 12 : MARGIN_TOP, left: isReflow ? 12 : MARGIN }}
            onClick={() => editor?.commands.focus()}
          >
            Bắt đầu soạn đề…
          </button>
        )}
        <EditorContent editor={editor} />
        <EditorContextMenu editor={editor} />
        <MathEdit editor={editor} />
      </div>
    </div>
  )
}
