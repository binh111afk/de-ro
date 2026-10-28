/**
 * Nền slide do người dùng tô (màu đặc hoặc chuyển sắc). `Slide.background` là chuỗi CSS `background`;
 * `customBg` đánh dấu nền riêng để đổi chủ đề/dựng lại bố cục không ghi đè mất.
 */
import type { Slide, SlideElement } from '@/store/docs'
import { contrastRatio, readableTextOn } from './slideTheme'

export const BACKGROUNDS: Array<{ label: string; value: string }> = [
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Kem', value: '#fdf6e3' },
  { label: 'Xanh nhạt', value: '#eaf2ff' },
  { label: 'Xanh bạc hà', value: '#e8f7ee' },
  { label: 'Hồng nhạt', value: '#ffeef2' },
  { label: 'Tím nhạt', value: '#f1ecff' },
  { label: 'Vàng nhạt', value: '#fff8d6' },
  { label: 'Xám nhạt', value: '#f1f3f5' },
  { label: 'Xanh than', value: '#0f172a' },
  { label: 'Xanh rêu', value: '#064e3b' },
  { label: 'Tím đậm', value: '#2e1065' },
  { label: 'Đen', value: '#111111' },
  { label: 'Trời nhẹ', value: 'linear-gradient(135deg, #dbeafe, #ede9fe)' },
  { label: 'Hoàng hôn nhạt', value: 'linear-gradient(135deg, #fef3c7, #fecaca)' },
  { label: 'Biển mát', value: 'linear-gradient(135deg, #d1fae5, #cffafe)' },
  { label: 'Hoa cà', value: 'linear-gradient(135deg, #fce7f3, #e0e7ff)' },
  { label: 'Đêm xanh', value: 'linear-gradient(135deg, #1e3a8a, #7c3aed)' },
  { label: 'Than đá', value: 'linear-gradient(135deg, #0f172a, #334155)' },
  { label: 'Rực rỡ', value: 'linear-gradient(160deg, #f97316, #ec4899)' },
  { label: 'Rừng sâu', value: 'linear-gradient(135deg, #064e3b, #0f766e)' },
]

const HEX = /#[0-9a-f]{6}/gi
const colorsOf = (bg: string): string[] => bg.match(HEX) ?? []
export const firstColor = (bg: string, fallback = '#ffffff'): string => colorsOf(bg)[0] ?? fallback

/** SVG của nền chuyển sắc (PPTX không có nền gradient nên vẽ thành ảnh toàn trang); null nếu là màu đặc. */
export function gradientSvg(bg: string): string | null {
  const m = /linear-gradient\(\s*(-?\d+)deg\s*,\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})/i.exec(bg)
  if (!m) return null
  const rad = (Number(m[1]) * Math.PI) / 180
  const [sin, cos] = [Math.sin(rad), Math.cos(rad)]
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="none">' +
    `<defs><linearGradient id="g" x1="${50 - 50 * sin}%" y1="${50 + 50 * cos}%" x2="${50 + 50 * sin}%" y2="${50 - 50 * cos}%">` +
    `<stop offset="0" stop-color="${m[2]}"/><stop offset="1" stop-color="${m[3]}"/></linearGradient></defs>` +
    '<rect width="1280" height="720" fill="url(#g)"/></svg>'
  )
}

/**
 * Đặt nền riêng cho slide. Chữ/đồ hoạ không có nền thẻ mà quá khó đọc trên nền mới (tương phản < 3)
 * được đổi sang màu đọc được — nền đen mà chữ vẫn đen thì vô nghĩa. `fg` là màu chữ mặc định của bộ màu.
 */
export function withBackground(slide: Slide, background: string, fg: string): Slide {
  const colors = colorsOf(background)
  const ink = readableTextOn(colors[0] ?? '#ffffff')
  const unreadable = (color: string) => colors.some((c) => contrastRatio(color, c) < 3)
  // chữ nằm trên thẻ/panel có màu riêng thì nền slide không ảnh hưởng độ đọc → giữ nguyên
  const onPanel = (el: SlideElement) => {
    const [cx, cy] = [el.x + el.w / 2, el.y + el.h / 2]
    return slide.elements.some(
      (o) => o !== el && ((o.type === 'shape' && o.fill) || (o.type === 'text' && o.fill)) && cx >= o.x && cx <= o.x + o.w && cy >= o.y && cy <= o.y + o.h,
    )
  }
  const elements = slide.elements.map((el) => {
    if ((el.type !== 'text' || el.fill) && el.type !== 'graphic') return el
    return !onPanel(el) && unreadable(el.textColor ?? fg) ? { ...el, textColor: ink } : el
  })
  return { ...slide, background, customBg: true, elements }
}

/** Lớp phủ nhẹ cùng màu trung bình của ảnh: gom bớt chi tiết ảnh để chữ trên nền dễ đọc hơn. */
const scrim = (color: string) => `${color}4d`

/** CSS nền của slide: màu/gradient, thêm ảnh (phủ kín, căn giữa) nếu có. Dùng chung cho sân soạn, thumbnail, chiếu, in. */
export function slideBgStyle(slide: Pick<Slide, 'background' | 'bgImage'>): Record<string, string> {
  if (!slide.bgImage) return { background: slide.background }
  const tint = scrim(firstColor(slide.background, '#000000'))
  return {
    background: slide.background,
    backgroundImage: `linear-gradient(${tint}, ${tint}), url("${slide.bgImage}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

/**
 * Đọc file ảnh → cắt 16:9, thu về 1280×720, JPEG (nhẹ để lưu trong trình duyệt) + màu trung bình của ảnh.
 * Chỉ chạy trong trình duyệt (canvas).
 */
export async function prepareBgImage(file: File): Promise<{ image: string; color: string }> {
  if (!file.type.startsWith('image/')) throw new Error('Hãy chọn một file ảnh (jpg, png, webp…).')
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Không đọc được ảnh này, thử file khác nhé.')
  })
  const [W, H] = [1280, 720]
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  // cắt phần giữa theo tỉ lệ 16:9 (như background-size: cover)
  const scale = Math.max(W / bitmap.width, H / bitmap.height)
  const [dw, dh] = [bitmap.width * scale, bitmap.height * scale]
  ctx.drawImage(bitmap, (W - dw) / 2, (H - dh) / 2, dw, dh)
  bitmap.close()
  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  probe.getContext('2d')!.drawImage(canvas, 0, 0, 1, 1)
  const [r, g, b] = probe.getContext('2d')!.getImageData(0, 0, 1, 1).data
  const color = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
  return { image: canvas.toDataURL('image/jpeg', 0.75), color }
}

/** Dựng lại slide (đổi chủ đề, bố cục…) mà vẫn giữ nền riêng của slide cũ. */
export function keepCustomBg(prev: Slide, next: Slide, fg: string): Slide {
  return prev.customBg ? withBackground(next, prev.background, fg) : next
}
