const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const decoded: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"' }

export const escapeSvgAttribute = (value: string) => value.replace(/[&<>"]/g, (c) => entities[c])
export const decodeSvgAttribute = (value: string) => value.replace(/&(amp|lt|gt|quot);/g, (_, name: string) => decoded[name])
