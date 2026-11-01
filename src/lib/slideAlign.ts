/** Căn và phân bố đều nhiều phần tử slide (hộp theo % khung, bỏ qua góc xoay). */
export type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'spreadX' | 'spreadY'
export type Box = { id: string; x: number; y: number; w: number; h: number }

export function alignBoxes(boxes: Box[], mode: AlignMode): Record<string, { x?: number; y?: number }> {
  const out: Record<string, { x?: number; y?: number }> = {}
  if (boxes.length < 2) return out
  const left = Math.min(...boxes.map((b) => b.x))
  const right = Math.max(...boxes.map((b) => b.x + b.w))
  const top = Math.min(...boxes.map((b) => b.y))
  const bottom = Math.max(...boxes.map((b) => b.y + b.h))
  for (const b of boxes) {
    if (mode === 'left') out[b.id] = { x: left }
    if (mode === 'center') out[b.id] = { x: (left + right) / 2 - b.w / 2 }
    if (mode === 'right') out[b.id] = { x: right - b.w }
    if (mode === 'top') out[b.id] = { y: top }
    if (mode === 'middle') out[b.id] = { y: (top + bottom) / 2 - b.h / 2 }
    if (mode === 'bottom') out[b.id] = { y: bottom - b.h }
  }
  // phân bố đều: giữ hai phần tử ngoài cùng, khoảng trống giữa các phần tử bằng nhau
  if (mode === 'spreadX' || mode === 'spreadY') {
    const across = mode === 'spreadX'
    const pos = (b: Box) => (across ? b.x : b.y)
    const size = (b: Box) => (across ? b.w : b.h)
    const sorted = [...boxes].sort((a, b) => pos(a) - pos(b))
    const span = (across ? right - left : bottom - top) - sorted.reduce((s, b) => s + size(b), 0)
    const gap = span / (sorted.length - 1)
    let at = across ? left : top
    for (const b of sorted) {
      out[b.id] = across ? { x: at } : { y: at }
      at += size(b) + gap
    }
  }
  return out
}
