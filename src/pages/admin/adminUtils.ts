/**
 * Tiện ích định dạng ngày giờ, số liệu và chi tiết nhật ký cho trang Admin.
 */

/** Định dạng ngày giờ dd/MM/yyyy HH:mm theo giờ Việt Nam (UTC+7) */
export function formatViDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  const dd = String(vn.getUTCDate()).padStart(2, '0')
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = vn.getUTCFullYear()
  const hh = String(vn.getUTCHours()).padStart(2, '0')
  const min = String(vn.getUTCMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

/** Định dạng ngày dd/MM/yyyy theo giờ Việt Nam (UTC+7) */
export function formatViDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  const dd = String(vn.getUTCDate()).padStart(2, '0')
  const mm = String(vn.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = vn.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/** Định dạng số có dấu phân cách hàng nghìn (tiếng Việt: dấu chấm) */
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '0'
  return n.toLocaleString('vi-VN')
}

/** Rút gọn id (8 ký tự đầu) */
export function shortenId(id: string | null | undefined): string {
  if (!id) return '—'
  return id.length > 8 ? id.slice(0, 8) : id
}

/** Diễn giải chi tiết nhật ký sang tiếng Việt thân thiện */
export function formatAuditDetail(_action: string, detail: unknown): string {
  if (!detail || typeof detail !== 'object') return '—'
  const d = detail as Record<string, unknown>
  const parts: string[] = []

  if (d.reason && typeof d.reason === 'string') {
    parts.push(`Lý do: ${d.reason}`)
  }
  if ('monthlyTokens' in d) {
    if (d.monthlyTokens === null) {
      parts.push('Hạn mức: Không giới hạn')
    } else {
      parts.push(`Hạn mức: ${formatNumber(Number(d.monthlyTokens))} token`)
    }
  }
  if (d.tokens !== undefined) {
    const num = Number(d.tokens)
    const sign = num > 0 ? '+' : ''
    const noteStr = d.note ? ` (${d.note})` : ''
    parts.push(`Số điểm: ${sign}${formatNumber(num)} token${noteStr}`)
  }
  if (d.hours !== undefined) {
    parts.push(`Thời hạn: ${d.hours} giờ`)
  }
  if (d.filesRemoved !== undefined) {
    parts.push(`Đã dọn: ${d.filesRemoved} tệp`)
  }

  if (parts.length > 0) return parts.join(' · ')
  const keys = Object.keys(d)
  if (keys.length === 0) return '—'
  try {
    return JSON.stringify(d)
  } catch {
    return '—'
  }
}
