/**
 * Số cột phương án trắc nghiệm khi xuất Word và in, ước lượng theo chiều dài chữ.
 * Trình soạn đo bề rộng thật trong DOM (`choiceLayout.ts`: 4/3/2/1 cột); xuất file không có DOM nên ước lượng
 * với cùng luật: lấy số cột lớn nhất mà mọi phương án còn vừa và số phương án chia hết cho số cột.
 *
 * ponytail: ước lượng bằng số ký tự (không đo font thật), có thể lệch một chút so với màn hình ở ca sát ngưỡng.
 */
import type { RichText } from '@/data/docTypes'

/** Bề rộng vùng phương án trên giấy A4 (pt): khổ 21 cm − lề 2 × 1,6 cm − thụt 22 px. */
const AVAILABLE_PT = 488
const CHAR_PT = 6 // Times New Roman 13pt, chữ thường (đo trên bản render LibreOffice: ~6 pt/ký tự)
const MATH_CHAR_PT = 7.2 // ký tự công thức rộng hơn do giãn quanh toán tử
const LABEL_PT = 22 // "A. "
const CELL_PAD_PT = 11 // lề trái/phải mặc định của ô bảng
const MAX_COLS = 4
const MATH = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g

const plain = (rt: RichText) => (typeof rt === 'string' ? rt : (rt as Array<{ text: string } | string>).map((s) => (typeof s === 'string' ? s : s.text)).join(''))

/** Số ký tự hiển thị của công thức: mỗi lệnh `\xxx` tính một ký tự, bỏ ngoặc nhóm và dấu mũ/chỉ số. */
const mathLen = (latex: string) => latex.replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}^_\s]/g, '').length

function widthPt(text: string): number {
  let w = LABEL_PT + CELL_PAD_PT
  let at = 0
  for (const m of text.matchAll(MATH)) {
    w += (m.index - at) * CHAR_PT + mathLen(m[1] ?? m[2]) * MATH_CHAR_PT
    at = m.index + m[0].length
  }
  return w + (text.length - at) * CHAR_PT
}

export function estimateChoiceCols(options: RichText[]): number {
  if (options.length < 2) return 1
  const texts = options.map(plain)
  // xuống dòng cứng hoặc công thức dạng khối: một phương án cần cả hàng
  if (texts.some((t) => t.includes('\n') || t.includes('$$'))) return 1
  const widths = texts.map(widthPt)
  for (let n = Math.min(options.length, MAX_COLS); n >= 2; n--) {
    if (options.length % n === 0 && widths.every((w) => w <= AVAILABLE_PT / n)) return n
  }
  return 1
}
