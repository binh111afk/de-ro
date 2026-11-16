/** Khổ trang A4, lề, hình học trang — tách khỏi ExamEditor để nơi chỉ cần số đo không kéo theo cả TipTap. */
/** Kích thước A4 ở 96dpi: 1cm = 37.795px */
export const CM = 96 / 2.54
/** Khổ A4 dọc — tính theo orientation tại chỗ dùng, không dùng hằng số cứng */
export const A4_PORTRAIT_W = Math.round(21 * CM) // 794
export const A4_PORTRAIT_H = Math.round(29.7 * CM) // 1123
export const PAGE_GAP = 24

/** khổ giấy (cm, chiều dọc: rộng × cao) */
export const PAGE_SIZES = {
  A4: { label: 'A4', w: 21, h: 29.7 },
  A3: { label: 'A3', w: 29.7, h: 42 },
  A5: { label: 'A5', w: 14.8, h: 21 },
  B5: { label: 'B5', w: 17.6, h: 25 },
  Letter: { label: 'Letter', w: 21.59, h: 27.94 },
  Legal: { label: 'Legal', w: 21.59, h: 35.56 },
} as const
export type PageSizeId = keyof typeof PAGE_SIZES

/** khổ giấy (cm) sau khi xoay theo hướng trang */
export function paperCm(setup: Pick<PageSetup, 'size' | 'orientation'>): { w: number; h: number } {
  const p = PAGE_SIZES[setup.size ?? 'A4'] ?? PAGE_SIZES.A4
  return setup.orientation === 'landscape' ? { w: p.h, h: p.w } : { w: p.w, h: p.h }
}

export interface PageSetup {
  /** lề trang (cm) mặc định cho cả 4 cạnh */
  marginCm: number
  /** lề riêng từng cạnh (cm); cạnh nào thiếu thì lấy `marginCm` */
  margins?: Partial<PageMargins>
  /** khổ giấy (thiếu = A4) */
  size?: PageSizeId
  /** hướng trang */
  orientation: 'portrait' | 'landscape'
  /** màu nền trang giấy (mặc định trắng) */
  pageColor?: string
  /** viền trang: độ dày (px) — 0 = không viền */
  pageBorder?: number
  /** số trang ở chân trang (không có = không đánh số) */
  pageNumber?: PageNumberSetup
  /** chữ ở đầu trang / chân trang */
  header?: BandSetup
  footer?: BandSetup
}

export interface BandSetup {
  text: string
  align: 'left' | 'center' | 'right'
  /** không in ở trang 1 (trang bìa) */
  skipFirst?: boolean
}

export type BandSlots = { left: string; center: string; right: string }

/**
 * Nội dung một dải đầu/chân trang ở trang `page`: chữ header/footer và số trang
 * (nếu đặt cùng phía) gộp theo vị trí căn — cùng ô thì nối bằng " – ".
 */
export function bandAt(setup: PageSetup | undefined, place: 'top' | 'bottom', page: number): BandSlots | null {
  const slots: BandSlots = { left: '', center: '', right: '' }
  const band = place === 'top' ? setup?.header : setup?.footer
  if (band?.text.trim() && !(band.skipFirst && page === 1)) slots[band.align] = band.text.trim()
  const pn = setup?.pageNumber
  const n = pageNumberAt(pn, page)
  if (n !== null && (pn?.place ?? 'bottom') === place) {
    const a = pn!.align
    slots[a] = slots[a] ? `${slots[a]} – ${n}` : String(n)
  }
  return slots.left || slots.center || slots.right ? slots : null
}

export interface PageNumberSetup {
  show: boolean
  /** trang (đếm từ 1) bắt đầu hiện số — các trang trước để trống, vd. bỏ trang bìa */
  from: number
  /** số hiện ở trang `from` */
  startAt: number
  align: 'left' | 'center' | 'right'
  /** đầu trang hay chân trang (thiếu = chân trang) */
  place?: 'top' | 'bottom'
}

export const DEFAULT_PAGE_NUMBER: PageNumberSetup = { show: true, from: 1, startAt: 1, align: 'center' }

/** số in ở trang `page` (đếm từ 1), `null` = trang này không đánh số */
export function pageNumberAt(pn: PageNumberSetup | undefined, page: number): number | null {
  if (!pn?.show || page < pn.from) return null
  return pn.startAt + page - pn.from
}

export type PageMargins = { top: number; right: number; bottom: number; left: number }

/** lề 4 cạnh (cm) sau khi gộp `margins` với `marginCm` */
export function marginsOf(setup: PageSetup): PageMargins {
  const m = setup.margins ?? {}
  const d = setup.marginCm
  return { top: m.top ?? d, right: m.right ?? d, bottom: m.bottom ?? d, left: m.left ?? d }
}

export function pageGeometry(setup: PageSetup) {
  const paper = paperCm(setup)
  const w = Math.round(paper.w * CM)
  const h = Math.round(paper.h * CM)
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
