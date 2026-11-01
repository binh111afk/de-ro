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

const polar = (n: number, r: (t: number) => number, rot = -90) =>
  polygon(
    Array.from({ length: n }, (_, i): [number, number] => {
      const t = ((rot + (i * 360) / n) * Math.PI) / 180
      return [Math.cos(t) * r(t), Math.sin(t) * r(t)]
    }),
  )

/** Khung ảnh (kiểu Canva): ảnh `type: 'image'` có `shape` là id dưới đây, ảnh tự `cover` rồi cắt theo khung. */
export const PHOTO_FRAMES: Array<{ id: string; label: string; clip: string }> = [
  { id: 'rect', label: 'Chữ nhật', clip: 'inset(0)' },
  { id: 'ellipse', label: 'Tròn', clip: 'ellipse(50% 50%)' },
  { id: 'round', label: 'Bo góc', clip: 'inset(0 round 12%)' },
  { id: 'triangle', label: 'Tam giác', clip: SHAPE_CLIP.triangle! },
  { id: 'arch', label: 'Cổng vòm', clip: 'inset(0 round 50% 50% 0 0 / 35% 35% 0 0)' },
  { id: 'leaf', label: 'Chiếc lá', clip: 'inset(0 round 50% 0)' },
  { id: 'diamond', label: 'Thoi', clip: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' },
  { id: 'pentagon', label: 'Ngũ giác', clip: polar(5, () => 1) },
  { id: 'hexagon', label: 'Lục giác', clip: polar(6, () => 1, 0) },
  { id: 'octagon', label: 'Bát giác', clip: polar(8, () => 1, 22.5) },
  { id: 'star', label: 'Ngôi sao', clip: star },
  { id: 'heart', label: 'Trái tim', clip: heart },
  { id: 'flower', label: 'Bông hoa', clip: polar(96, (t) => 1 + 0.16 * Math.cos(6 * t)) },
  { id: 'burst', label: 'Huy hiệu', clip: polar(32, (t) => 1 + 0.1 * Math.sign(Math.cos(16 * t))) },
  { id: 'blob', label: 'Giọt mềm', clip: polar(96, (t) => 1 + 0.08 * Math.sin(3 * t) + 0.06 * Math.cos(5 * t)) },
  { id: 'cross', label: 'Dấu cộng', clip: 'polygon(33% 0, 67% 0, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0 67%, 0 33%, 33% 33%)' },
  { id: 'parallelogram', label: 'Bình hành', clip: 'polygon(20% 0, 100% 0, 80% 100%, 0 100%)' },
  { id: 'pill', label: 'Viên thuốc', clip: 'inset(22% 0 round 999px)' },
  { id: 'round-lg', label: 'Bo góc lớn', clip: 'inset(0 round 28%)' },
  { id: 'arch-down', label: 'Vòm ngược', clip: 'inset(0 round 0 0 50% 50% / 0 0 35% 35%)' },
  { id: 'tab', label: 'Thẻ tab', clip: 'inset(0 round 20% 20% 0 0)' },
  { id: 'corner', label: 'Góc chéo', clip: 'inset(0 round 30% 0 30% 0)' },
  { id: 'half-circle', label: 'Bán nguyệt', clip: 'inset(0 round 50% 50% 0 0 / 100% 100% 0 0)' },
  { id: 'quarter', label: 'Góc tư', clip: 'inset(0 round 100% 0 0 0)' },
  { id: 'triangle-right', label: 'Tam giác vuông', clip: 'polygon(0 0, 100% 100%, 0 100%)' },
  { id: 'trapezoid', label: 'Hình thang', clip: 'polygon(18% 0, 82% 0, 100% 100%, 0 100%)' },
  { id: 'chevron', label: 'Mũi tên gấp', clip: 'polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%, 25% 50%)' },
  { id: 'arrow', label: 'Mũi tên', clip: SHAPE_CLIP.arrow! },
  { id: 'cut-corner', label: 'Vát góc', clip: 'polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)' },
  { id: 'ticket', label: 'Vé', clip: 'polygon(0 0, 100% 0, 100% 38%, 94% 50%, 100% 62%, 100% 100%, 0 100%, 0 62%, 6% 50%, 0 38%)' },
  { id: 'flag', label: 'Lá cờ', clip: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' },
  { id: 'shield', label: 'Khiên', clip: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)' },
  { id: 'star-4', label: 'Sao 4 cánh', clip: polar(8, (t) => 1 - 0.55 * Math.abs(Math.sin(2 * t))) },
  { id: 'star-6', label: 'Sao 6 cánh', clip: polar(12, (t) => 1 - 0.42 * Math.abs(Math.sin(3 * t))) },
  { id: 'cloud', label: 'Đám mây', clip: polar(120, (t) => 1 + 0.1 * Math.abs(Math.sin(4 * t))) },
  { id: 'wave', label: 'Gợn sóng', clip: polar(120, (t) => 1 + 0.05 * Math.sin(12 * t)) },
  { id: 'gear', label: 'Bánh răng', clip: polar(48, (t) => 1 + 0.12 * Math.sign(Math.cos(8 * t + 0.01))) },
  { id: 'bubble', label: 'Bong bóng chat', clip: 'polygon(0 0, 100% 0, 100% 78%, 40% 78%, 22% 100%, 24% 78%, 0 78%)' },
]

export const photoFrameClip = (shape?: string): string | undefined => PHOTO_FRAMES.find((f) => f.id === shape)?.clip

/** Ảnh chờ của khung ảnh (giấy kem, mặt trời, núi gấp khúc — theo màu đất sét của app), dùng ở panel và khung trống trên slide. */
export const FRAME_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbefe4"/><stop offset="1" stop-color="#f3d9c4"/></linearGradient></defs><rect width="160" height="160" fill="url(#s)"/><circle cx="108" cy="54" r="15" fill="#f2b37a"/><path d="M-4 132 46 74l30 34 18-20 70 44v52H-4z" fill="#d98a63"/><path d="M-4 150 58 104l26 18 22-14 58 42v14H-4z" fill="#b5654a"/></svg>',
)}`

/** Ảnh đang kéo từ tab Tải lên — lúc dragover trình duyệt không cho đọc dữ liệu kéo, nên giữ ở đây để khung xem trước. */
export const dragImage = { src: '' }
