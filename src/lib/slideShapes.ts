/** Đường cắt (`clip-path`) của các hình khối không phải hình chữ nhật/tròn, theo % hộp của phần tử. */
import type { SlideElement } from '@/store/docs'

type Shape = NonNullable<SlideElement['shape']>

const polygon = (points: Array<[number, number]>): string => {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  // co giãn cho hình lấp đầy đúng hộp 0–100%
  return `polygon(${points.map(([x, y]) => `${(((x - x0) / (x1 - x0)) * 100).toFixed(1)}% ${(((y - y0) / (y1 - y0)) * 100).toFixed(1)}%`).join(', ')})`
}

const star = polygon(
  Array.from({ length: 10 }, (_, i): [number, number] => {
    const angle = ((-90 + i * 36) * Math.PI) / 180
    const r = i % 2 === 0 ? 1 : 0.4
    return [Math.cos(angle) * r, Math.sin(angle) * r]
  }),
)

// trái tim theo phương trình tham số cổ điển (trục y hướng xuống nên đảo dấu)
const heart = polygon(
  Array.from({ length: 64 }, (_, i): [number, number] => {
    const t = (i / 64) * 2 * Math.PI
    return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]
  }),
)

export const SHAPE_CLIP: Partial<Record<Shape, string>> = {
  triangle: 'polygon(50% 0, 100% 100%, 0 100%)',
  arrow: 'polygon(0 35%, 78% 35%, 78% 10%, 100% 50%, 78% 90%, 78% 65%, 0 65%)',
  star,
  heart,
}

/**
 * Đường thẳng có/không đầu mũi tên, vẽ bằng `clip-path` với độ dày và đầu mũi tên tính theo `cqw` (không méo khi hộp kéo dài).
 * Hộp phần tử chỉ là vùng chứa: đường chạy dọc giữa hộp, đầu mũi tên cao tối đa bằng hộp.
 */
export function lineClip(el: Pick<SlideElement, 'border' | 'lineArrow'>): string {
  const t = (el.border ?? 4) * 0.1 // độ dày (cqw)
  const hh = Math.max(t * 3.2, 1) // nửa chiều cao đầu mũi tên
  const hl = hh * 1.6 // chiều dài đầu mũi tên
  const top = `calc(50% - ${(t / 2).toFixed(2)}cqw)`
  const bottom = `calc(50% + ${(t / 2).toFixed(2)}cqw)`
  const up = `calc(50% - ${hh.toFixed(2)}cqw)`
  const down = `calc(50% + ${hh.toFixed(2)}cqw)`
  const len = `${hl.toFixed(2)}cqw`
  const end = el.lineArrow === 'end' || el.lineArrow === 'both'
  const start = el.lineArrow === 'both'
  // đi theo chiều kim đồng hồ: cạnh trên trái→phải, cạnh dưới phải→trái; mũi tên là các đỉnh nhô ra
  const pts = [
    start ? `0% 50%, ${len} ${up}, ${len} ${top}` : `0% ${top}`,
    end
      ? `calc(100% - ${len}) ${top}, calc(100% - ${len}) ${up}, 100% 50%, calc(100% - ${len}) ${down}, calc(100% - ${len}) ${bottom}`
      : `100% ${top}, 100% ${bottom}`,
    start ? `${len} ${bottom}, ${len} ${down}` : `0% ${bottom}`,
  ]
  return `polygon(${pts.join(', ')})`
}

export const shapeClipOf = (el: SlideElement): string | undefined =>
  el.shape === 'line' ? lineClip(el) : SHAPE_CLIP[el.shape ?? 'rect']
