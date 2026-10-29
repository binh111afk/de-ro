/** Chữ/số thuần, không phụ thuộc KaTeX (dùng được cả ở môi trường chạy test bằng Node). */

/** Strip math markup down to plain text — used for search indexing and previews. */
export function plainText(input: string): string {
  return input
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
}

/** Points use the Vietnamese comma: 0,25 */
export function formatPoints(p: number): string {
  return p.toLocaleString('vi-VN', {
    minimumFractionDigits: p % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
