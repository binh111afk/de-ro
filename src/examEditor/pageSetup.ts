/** Khổ trang A4, lề, hình học trang — tách khỏi ExamEditor để nơi chỉ cần số đo không kéo theo cả TipTap. */
/** Kích thước A4 ở 96dpi: 1cm = 37.795px */
export const CM = 96 / 2.54
/** Khổ A4 dọc — tính theo orientation tại chỗ dùng, không dùng hằng số cứng */
export const A4_PORTRAIT_W = Math.round(21 * CM) // 794
export const A4_PORTRAIT_H = Math.round(29.7 * CM) // 1123
export const PAGE_GAP = 24

export interface PageSetup {
  /** lề trang (cm) mặc định cho cả 4 cạnh */
  marginCm: number
  /** lề riêng từng cạnh (cm); cạnh nào thiếu thì lấy `marginCm` */
  margins?: Partial<PageMargins>
  /** hướng trang */
  orientation: 'portrait' | 'landscape'
  /** màu nền trang giấy (mặc định trắng) */
  pageColor?: string
  /** viền trang: độ dày (px) — 0 = không viền */
  pageBorder?: number
}

export type PageMargins = { top: number; right: number; bottom: number; left: number }

/** lề 4 cạnh (cm) sau khi gộp `margins` với `marginCm` */
export function marginsOf(setup: PageSetup): PageMargins {
  const m = setup.margins ?? {}
  const d = setup.marginCm
  return { top: m.top ?? d, right: m.right ?? d, bottom: m.bottom ?? d, left: m.left ?? d }
}

export function pageGeometry(setup: PageSetup) {
  const w = setup.orientation === 'landscape' ? A4_PORTRAIT_H : A4_PORTRAIT_W
  const h = setup.orientation === 'landscape' ? A4_PORTRAIT_W : A4_PORTRAIT_H
  const m = marginsOf(setup)
  const [top, right, bottom, left] = [m.top, m.right, m.bottom, m.left].map((cm) => Math.round(cm * CM))
  return {
    PAGE_W: w,
    PAGE_H: h,
    /** lề trái (px) — giữ tên cũ cho thước và CSS */
    MARGIN: left,
    MARGIN_TOP: top,
    MARGIN_RIGHT: right,
    MARGIN_BOTTOM: bottom,
    CONTENT_W: w - left - right,
    CONTENT_H: h - top - bottom,
  }
}
