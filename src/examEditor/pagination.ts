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

/** Meta key: Map<index khối, chiều cao spacer>. */
export const pageGapsKey = new PluginKey<Map<number, number>>('pageGaps')

/** Extension: render spacer bằng widget decoration, PM tự chèn/gỡ DOM. */
export const PaginationExtension = Extension.create({
  name: 'pageGaps',
  addProseMirrorPlugins() {
    return [
      new Plugin<Map<number, number>>({
        key: pageGapsKey,
        state: {
          init: () => new Map(),
          apply(tr, prev) {
            const meta = tr.getMeta(pageGapsKey) as Map<number, number> | undefined
            return meta ?? prev
          },
        },
        props: {
          decorations(state) {
            const gaps = pageGapsKey.getState(state)
            if (!gaps || gaps.size === 0) return null
            const decos: Decoration[] = []
            let index = 0
            state.doc.forEach((_node, offset) => {
              const h = gaps.get(index)
              if (h && h > 0) {
                const dom = document.createElement('div')
                dom.className = 'doc-page-gap'
                dom.style.height = `${h}px`
                dom.setAttribute('aria-hidden', 'true')
                dom.contentEditable = 'false'
                decos.push(Decoration.widget(offset, dom, { side: -1 }))
              }
              index++
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})
