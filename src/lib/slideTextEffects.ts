import type { SlideElement } from '@/store/docs'
import { mathToPlain } from './slideMath'
import { slideFontByName } from './slideFonts'

export type SlideTextStyle = Pick<SlideElement, 'fontFamily' | 'textStroke' | 'textShadow' | 'textGradient' | 'textArc'>

export function textEffectsOf(el: SlideElement): Omit<SlideTextStyle, 'fontFamily'> {
  const { textStroke, textShadow, textGradient, textArc } = el
  return { textStroke, textShadow, textGradient, textArc }
}

export function sanitizeTextStyle(raw: unknown): SlideTextStyle {
  const obj = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const num = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : undefined
  const hex = (value: unknown) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined
  const data = obj(raw)
  const stroke = obj(data.textStroke)
  const shadow = obj(data.textShadow)
  const gradient = obj(data.textGradient)
  const width = num(stroke.width, 0, 24)
  const strokeColor = hex(stroke.color)
  const x = num(shadow.x, -32, 32)
  const y = num(shadow.y, -32, 32)
  const blur = num(shadow.blur, 0, 32)
  const shadowColor = hex(shadow.color)
  const from = hex(gradient.from)
  const to = hex(gradient.to)
  const angle = num(gradient.angle, 0, 360)
  const textArc = num(data.textArc, -180, 180)
  const fontFamily = typeof data.fontFamily === 'string' ? slideFontByName(data.fontFamily)?.family : undefined
  return {
    ...(fontFamily ? { fontFamily } : {}),
    ...(width && strokeColor ? { textStroke: { width, color: strokeColor } } : {}),
    ...(x !== undefined && y !== undefined && blur !== undefined && shadowColor ? { textShadow: { x, y, blur, color: shadowColor } } : {}),
    ...(from && to && angle !== undefined ? { textGradient: { from, to, angle } } : {}),
    ...(textArc !== undefined ? { textArc } : {}),
  }
}

export const hasTextEffects = (el: SlideElement) =>
  Boolean(el.textStroke || el.textShadow || el.textGradient || el.textArc)

export function gradientLine(w: number, h: number, angle: number) {
  const radians = angle * Math.PI / 180
  const dx = Math.sin(radians)
  const dy = -Math.cos(radians)
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2
  return [w / 2 - dx * half, h / 2 - dy * half, w / 2 + dx * half, h / 2 + dy * half] as const
}

const graphemes = new Intl.Segmenter('vi', { granularity: 'grapheme' })
let measure: CanvasRenderingContext2D | null | undefined

/** Cùng hệ tọa độ cho SVG và PNG: slide 16:9 rộng 1000 đơn vị. */
export function textArcLayout(el: SlideElement, family: string) {
  const degrees = Math.min(180, Math.abs(el.textArc ?? 0))
  const text = mathToPlain((el.text ?? '').replace(/\*\*/g, '')).replace(/\s+/g, ' ').trim()
  if (!degrees || !text || typeof document === 'undefined') return
  measure ??= document.createElement('canvas').getContext('2d')
  if (!measure) return
  const body = el.variant === 'body' || el.type === 'shape'
  const size = (el.fontSize ?? (body ? 2.4 : 3.6)) * 10
  const weight = el.fontWeight ?? (el.type === 'shape' ? 600 : body ? 500 : 600)
  const font = `${el.fontStyle ?? 'normal'} ${weight} ${size}px ${family}`
  const spacing = (el.letterSpacing ?? 0) * size
  measure.font = font
  const metrics = measure.measureText(text)
  const segments = Array.from(graphemes.segment(text), ({ segment }) => segment)
  const length = Math.max(1, metrics.width + segments.length * spacing)
  const half = Math.max(0.001, degrees * Math.PI / 360)
  const sign = (el.textArc ?? 0) > 0 ? 1 : -1
  // Nới đường dẫn hai đầu một chút để chữ cuối không mất ở mép textPath.
  const radius = length / (2 * half)
  const pathHalf = Math.min(Math.PI / 2 + 0.02, half + Math.min(0.02, half / 20))
  const point = (t: number) => ({ x: radius * Math.sin(t), y: sign * radius * (1 - Math.cos(t)) })
  const end = point(pathHalf)
  const path = `M ${-end.x} ${end.y} A ${radius} ${radius} 0 0 ${sign > 0 ? 1 : 0} 0 0 A ${radius} ${radius} 0 0 ${sign > 0 ? 1 : 0} ${end.x} ${end.y}`
  const w = Math.max(1, el.w * 10)
  const h = Math.max(1, el.h * 5.625)
  const stroke = el.textStroke?.width ?? 0
  const shadow = el.textShadow
  const pad = 2 + stroke + (shadow ? Math.max(Math.abs(shadow.x), Math.abs(shadow.y)) + shadow.blur * 2 : 0)
  // Một bao chung an toàn cho dấu tiếng Việt và các ký tự xoay gần 90°.
  const ink = Math.max(size, metrics.actualBoundingBoxAscent, metrics.actualBoundingBoxDescent) + pad
  const left = -end.x - ink
  const top = Math.min(0, end.y) - ink
  const width = 2 * (end.x + ink)
  const height = Math.abs(end.y) + 2 * ink
  const scale = Math.min(1, w / width, h / height)
  const x = (el.align === 'left' ? 0 : el.align === 'right' ? w - width * scale : (w - width * scale) / 2) - left * scale
  const y = (h - height * scale) / 2 - top * scale
  return { text, path, w, h, x, y, scale, size, weight, font, spacing, segments, radius, sign, length, point }
}

export function curvedTextPng(el: SlideElement, family: string, color: string): string | undefined {
  const layout = textArcLayout(el, family)
  if (!layout) return
  const { w, h, x, y, scale, font, spacing, segments, radius, sign, length, point } = layout
  const canvas = document.createElement('canvas')
  const density = Math.min(3, 4096 / Math.max(w, h))
  canvas.width = Math.ceil(w * density)
  canvas.height = Math.ceil(h * density)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(density, 0, 0, density, 0, 0)
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.fillStyle = color
  if (el.textShadow) {
    ctx.shadowColor = el.textShadow.color
    ctx.shadowBlur = el.textShadow.blur * scale * density
    ctx.shadowOffsetX = el.textShadow.x * scale * density
    ctx.shadowOffsetY = el.textShadow.y * scale * density
  }
  if (el.textGradient) {
    const [x1, y1, x2, y2] = gradientLine(w, h, el.textGradient.angle)
    const gradient = ctx.createLinearGradient((x1 - x) / scale, (y1 - y) / scale, (x2 - x) / scale, (y2 - y) / scale)
    gradient.addColorStop(0, el.textGradient.from)
    gradient.addColorStop(1, el.textGradient.to)
    ctx.fillStyle = gradient
  }
  if (el.textStroke) {
    ctx.strokeStyle = el.textStroke.color
    ctx.lineWidth = el.textStroke.width
    ctx.lineJoin = 'round'
  }
  // Giữ dấu tổ hợp theo ký tự và khoảng cách cặp chữ trên cùng đường dẫn SVG.
  const widths = segments.map(segment => ctx.measureText(segment).width)
  const kern = segments.map((segment, i) => i ? ctx.measureText(segments[i - 1] + segment).width - widths[i - 1] - widths[i] : 0)
  const advance = widths.reduce((sum, width, i) => sum + width + kern[i] + spacing, 0)
  let cursor = (length - advance) / 2
  for (const [i, segment] of segments.entries()) {
    cursor += kern[i]
    const center = cursor + widths[i] / 2
    cursor += widths[i] + spacing
    const t = (center - length / 2) / radius
    const p = point(t)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(sign * t)
    if (el.textStroke?.width) ctx.strokeText(segment, 0, 0)
    ctx.fillText(segment, 0, 0)
    ctx.restore()
  }
  return canvas.toDataURL('image/png')
}
