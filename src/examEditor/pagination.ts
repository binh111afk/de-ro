/**
 * Phân trang theo KHỐI trên màn hình (không cắt nội dung trong khối).
 *
 * Mục tiêu: khối cấp cao nhất không còn chạy qua mép tờ giấy. Khi một khối
 * không đủ chỗ ở trang hiện tại, chèn một **spacer** để nó bắt đầu ở đầu vùng
 * nội dung của trang sau — giống cách soandethi dùng Decoration spacer, nhưng
 * làm ở cấp khối nên không phải cắt bảng/đoạn.
 *
 * Spacer là ProseMirror decoration (PM tự quản DOM), không ghi trực tiếp vào
 * node của editor — xem bài học ở [[exam-block-dom-contract]] / context §3.28.
 */
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface PagePlan {
  /** index khối cấp cao nhất → chiều cao spacer (px) chèn trước khối */
  gaps: Map<number, number>
  /** số tờ giấy cần vẽ */
  pages: number
}

/**
 * Tính vị trí ngắt trang từ chiều cao thật của từng khối.
 *
 * @param heights     chiều cao khối (px, không tính margin)
 * @param spaces      khoảng cách tự nhiên TRƯỚC mỗi khối (px; phần tử 0 bỏ qua)
 * @param contentH    chiều cao vùng nội dung trong một trang
 * @param stride      khoảng cách giữa hai mép trên tờ giấy (PAGE_H + gap)
 * @param marginTop   lề trên của trang (vị trí bắt đầu vùng nội dung trang 1)
 */
export function computePagePlan(
  heights: number[],
  spaces: number[],
  contentH: number,
  stride: number,
  marginTop: number,
): PagePlan {
  const gaps = new Map<number, number>()
  // gốc = đỉnh vùng nội dung trang 1; khối đầu có thể có margin-top riêng
  let y = spaces[0] ?? 0
  let page = 0

  for (let i = 0; i < heights.length; i++) {
    if (i > 0) y += spaces[i] ?? 0
    const h = heights[i]
    const pageStart = page * stride
    const pageEnd = pageStart + contentH

    // không còn đủ chỗ và khối còn vừa một trang → đẩy sang đầu trang sau.
    // Khối cao hơn cả một trang thì đành để tràn (không cắt nội dung bên trong).
    if (y + h > pageEnd + 0.5 && y > pageStart + 1 && h <= contentH) {
      // LÀM TRÒN px: đo DOM trả số lẻ; nếu dispatch số lẻ thì lượt đo sau lệch
      // dưới 1px lại dispatch tiếp → vòng lặp vô hạn làm treo trang.
      const gap = Math.round(pageStart + stride - y)
      if (gap > 0) {
        gaps.set(i, gap)
        y += gap
        page += 1
      }
    }
    y += h
  }

  const pages = Math.max(1, Math.floor((marginTop + y - 1) / stride) + 1)
  return { gaps, pages }
}

/** Meta key: danh sách widget spacer (khối, bảng, dòng bảng, đoạn trong ô). */
export const pageGapsKey = new PluginKey<PageWidget[]>('pageGaps')

export interface PageWidget {
  /** Vị trí ProseMirror chèn widget spacer */
  pos: number
  /** Chiều cao spacer (px) */
  height: number
  /** 'block' = khoảng trống bình thường; 'row' = đẩy cả dòng bảng (che viền dọc phía trên) */
  kind: 'block' | 'row'
}

export interface TableSplitLine {
  top: number
  left: number
  width: number
}

export interface SimpleLayoutItem {
  kind: 'block'
  pos: number
  naturalTop: number
  height: number
}

export interface ContainerLayoutItem {
  kind: 'container'
  pos: number
  naturalTop: number
  height: number
  children: LayoutItem[]
}

export interface TableCellLayout {
  pos: number
  rowSpan: number
  padBottom?: number
  children: SimpleLayoutItem[]
}

export interface TableRowLayout {
  pos: number
  naturalTop: number
  height: number
  cells: TableCellLayout[]
}

export interface TableLayoutItem {
  kind: 'table'
  pos: number
  naturalTop: number
  height: number
  rows: TableRowLayout[]
}

export type LayoutItem = SimpleLayoutItem | ContainerLayoutItem | TableLayoutItem

export interface RichPagePlan {
  widgets: PageWidget[]
  pages: number
}

/** Ngưỡng chiều cao dòng bảng: dòng cao hơn ngưỡng này và có nhiều đoạn sẽ ngắt giữa các đoạn trong ô. */
const TALL_ROW_SPLIT_THRESHOLD = 240

/**
 * Tính vị trí ngắt trang cho cây khối (hỗ trợ bảng nhiều trang, gộp hàng rowspan,
 * ô cao nhiều đoạn, khối tự luận / rubric / đáp án dài).
 */
export function computeRichPagePlan(
  items: LayoutItem[],
  contentH: number,
  stride: number,
  marginTop: number,
): RichPagePlan {
  const widgets: PageWidget[] = []
  let shift = 0
  let page = 0
  let maxBottom = 0

  const syncPage = (y: number) => {
    while (y >= (page + 1) * stride - 0.5) page++
  }

  const processSimple = (item: SimpleLayoutItem) => {
    let y = item.naturalTop + shift
    syncPage(y)
    const pageStart = page * stride
    const pageEnd = pageStart + contentH
    if (y + item.height > pageEnd + 0.5 && y > pageStart + 1 && item.height <= contentH) {
      const gap = Math.round(pageStart + stride - y)
      if (gap > 0) {
        widgets.push({ pos: item.pos, height: gap, kind: 'block' })
        shift += gap
        y += gap
        page += 1
      }
    }
    maxBottom = Math.max(maxBottom, y + item.height)
    syncPage(y + item.height)
  }

  const processTable = (item: TableLayoutItem) => {
    const tableY = item.naturalTop + shift
    syncPage(tableY)
    const firstRow = item.rows[0]
    if (tableY + item.height <= page * stride + contentH + 0.5) {
      maxBottom = Math.max(maxBottom, tableY + item.height)
      return
    }
    if (
      firstRow &&
      tableY + firstRow.height > page * stride + contentH + 0.5 &&
      tableY > page * stride + 1 &&
      firstRow.height <= contentH
    ) {
      const gap = Math.round(page * stride + stride - tableY)
      if (gap > 0) {
        widgets.push({ pos: item.pos, height: gap, kind: 'block' })
        shift += gap
        page += 1
      }
    }

    for (let r = 0; r < item.rows.length; r++) {
      const row = item.rows[r]
      const rowY = row.naturalTop + shift
      syncPage(rowY)
      const pageStart = page * stride
      const pageEnd = pageStart + contentH

      if (rowY + row.height <= pageEnd + 0.5) {
        maxBottom = Math.max(maxBottom, rowY + row.height)
        continue
      }

      const canPushRow = r > 0 && rowY > pageStart + 1 && row.height <= contentH
      const hasInternalBreak =
        row.height > TALL_ROW_SPLIT_THRESHOLD &&
        row.cells.some(
          (c) =>
            c.children.length > 1 &&
            c.children[0].naturalTop + shift + c.children[0].height <= pageEnd + 0.5,
        )

      if (canPushRow && !hasInternalBreak) {
        const gap = Math.round(pageStart + stride - rowY)
        if (gap > 0) {
          for (const cell of row.cells) {
            widgets.push({ pos: cell.pos + 1, height: gap, kind: 'row' })
          }
          shift += gap
          page += 1
        }
        maxBottom = Math.max(maxBottom, rowY + (gap > 0 ? gap : 0) + row.height)
        continue
      }

      // Ngắt giữa các đoạn bên trong từng ô của dòng cao
      let newRowBottom = rowY + row.height
      let maxCellPage = page
      for (const cell of row.cells) {
        let cellShift = shift
        let cellPage = page
        for (const p of cell.children) {
          let py = p.naturalTop + cellShift
          while (py >= (cellPage + 1) * stride - 0.5) cellPage++
          const cPageStart = cellPage * stride
          const cPageEnd = cPageStart + contentH
          if (py + p.height > cPageEnd + 0.5 && py > cPageStart + 1 && p.height <= contentH) {
            const gap = Math.round(cPageStart + stride - py)
            if (gap > 0) {
              widgets.push({ pos: p.pos, height: gap, kind: 'block' })
              cellShift += gap
              py += gap
              cellPage += 1
            }
          }
          while (py + p.height >= (cellPage + 1) * stride - 0.5) cellPage++
        }
        if (cell.rowSpan <= 1 && cell.children.length > 0) {
          const lastP = cell.children[cell.children.length - 1]
          const cellBottom = lastP.naturalTop + cellShift + lastP.height + (cell.padBottom ?? 4)
          if (cellBottom > newRowBottom) newRowBottom = cellBottom
        }
        if (cellPage > maxCellPage) maxCellPage = cellPage
      }
      shift = newRowBottom - (row.naturalTop + row.height)
      page = maxCellPage
      maxBottom = Math.max(maxBottom, newRowBottom)
    }
  }

  const processItem = (item: LayoutItem) => {
    if (item.kind === 'block') {
      processSimple(item)
      return
    }
    if (item.kind === 'table') {
      processTable(item)
      return
    }
    const y = item.naturalTop + shift
    syncPage(y)
    const pageStart = page * stride
    const pageEnd = pageStart + contentH
    if (y + item.height <= pageEnd + 0.5) {
      maxBottom = Math.max(maxBottom, y + item.height)
      return
    }
    if (y > pageStart + 1 && item.height <= contentH) {
      const gap = Math.round(pageStart + stride - y)
      if (gap > 0) {
        widgets.push({ pos: item.pos, height: gap, kind: 'block' })
        shift += gap
        page += 1
      }
      maxBottom = Math.max(maxBottom, y + (gap > 0 ? gap : 0) + item.height)
      return
    }
    for (const child of item.children) processItem(child)
    maxBottom = Math.max(maxBottom, item.naturalTop + shift + item.height)
  }

  for (const item of items) processItem(item)

  const pages = items.length === 0 ? 1 : Math.max(1, Math.floor((marginTop + maxBottom - 1) / stride) + 1)
  return { widgets, pages }
}

/** Extension: render spacer bằng widget decoration, PM tự chèn/gỡ DOM. */
export const PaginationExtension = Extension.create({
  name: 'pageGaps',
  addProseMirrorPlugins() {
    return [
      new Plugin<PageWidget[]>({
        key: pageGapsKey,
        state: {
          init: () => [],
          apply(tr, prev) {
            const meta = tr.getMeta(pageGapsKey) as PageWidget[] | undefined
            if (meta) return meta
            if (tr.docChanged && prev.length > 0) {
              const size = tr.doc.content.size
              return prev
                .map((w) => ({ ...w, pos: tr.mapping.map(w.pos, -1) }))
                .filter((w) => w.pos >= 0 && w.pos <= size)
            }
            return prev
          },
        },
        props: {
          decorations(state) {
            const widgets = pageGapsKey.getState(state)
            if (!widgets || widgets.length === 0) return null
            const size = state.doc.content.size
            const decos: Decoration[] = []
            for (const w of widgets) {
              if (w.height <= 0 || w.pos < 0 || w.pos > size) continue
              const dom = document.createElement('div')
              dom.className = w.kind === 'row' ? 'doc-page-gap doc-page-gap--row' : 'doc-page-gap'
              dom.style.height = `${w.height}px`
              dom.setAttribute('aria-hidden', 'true')
              dom.contentEditable = 'false'
              decos.push(Decoration.widget(w.pos, dom, { side: -1 }))
            }
            return decos.length ? DecorationSet.create(state.doc, decos) : null
          },
        },
      }),
    ]
  },
})
