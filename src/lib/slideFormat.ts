import type { DeckFooter, Slide, SlideElement } from '../store/docs'
import { stripBold } from './slideMath'

export interface TextFormatSample {
  fontWeight?: number
  fontStyle?: SlideElement['fontStyle']
  textDecoration?: SlideElement['textDecoration']
  textColor?: string
  fontFamily?: string
  highlight?: string
  letterSpacing?: number
  lineHeight?: number
  fontSize?: number
  align?: SlideElement['align']
}

export const UNICODE_SUPERSCRIPTS = ['²', '³', 'ⁿ'] as const
export const UNICODE_SUBSCRIPTS = ['₁', '₂', 'ₙ'] as const

export const SLIDE_SYMBOLS: ReadonlyArray<{ label: string; chars: readonly string[] }> = [
  {
    label: 'Toán',
    chars: ['±', '×', '÷', '≠', '≈', '≤', '≥', '∞', '√', '∑', '∫', 'π', '∈', '∉', '⊂', '∪', '∩', '∅', '∀', '∃', '⇒', '⇔', '∠', '⊥', '∥', '△', '°'],
  },
  {
    label: 'Hy Lạp',
    chars: ['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'σ', 'φ', 'ω', 'Δ', 'Ω'],
  },
  {
    label: 'Mũi tên',
    chars: ['→', '←', '↑', '↓', '↔', '⇌'],
  },
  {
    label: 'Khác',
    chars: ['•', '✓', '✗', '★', '©', '®', '‰', '§', '€'],
  },
]

/**
 * Chuẩn hoá URL liên kết cho phần tử slide:
 * - Tự thêm `https://` nếu người dùng chỉ nhập tên miền (vd `vi.wikipedia.org`).
 * - Chỉ cho phép `http:` / `https:`, từ chối `javascript:`, `data:`, v.v.
 */
export function normalizeSlideHref(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || /\s/.test(trimmed)) return null
  const hasExplicitScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  if (hasExplicitScheme && !/^https?:/i.test(trimmed)) return null
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : hasExplicitScheme ? null : `https://${trimmed}`
  if (!candidate) return null
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.hostname || (!url.hostname.includes('.') && url.hostname !== 'localhost')) return null
    return url.href
  } catch {
    return null
  }
}

/**
 * Xoá các thuộc tính định dạng chữ (giữ cỡ chữ, căn lề, vị trí và nội dung),
 * đồng thời bỏ cặp đánh dấu đậm `**...**` trong chuỗi văn bản.
 */
export function clearTextFormatting(el: SlideElement): Partial<SlideElement> {
  const patch: Partial<SlideElement> = {
    fontWeight: undefined,
    fontStyle: undefined,
    textDecoration: undefined,
    textColor: undefined,
    fontFamily: undefined,
    highlight: undefined,
    letterSpacing: undefined,
    lineHeight: undefined,
  }
  if (el.text !== undefined) {
    patch.text = stripBold(el.text)
  }
  return patch
}

export function captureTextFormat(el: SlideElement | undefined): TextFormatSample | null {
  if (!el || el.type !== 'text') return null
  return {
    fontWeight: el.fontWeight,
    fontStyle: el.fontStyle,
    textDecoration: el.textDecoration,
    textColor: el.textColor,
    fontFamily: el.fontFamily,
    highlight: el.highlight,
    letterSpacing: el.letterSpacing,
    lineHeight: el.lineHeight,
    fontSize: el.fontSize,
    align: el.align,
  }
}

export function applyTextFormat(sample: TextFormatSample): Partial<SlideElement> {
  return {
    fontWeight: sample.fontWeight,
    fontStyle: sample.fontStyle,
    textDecoration: sample.textDecoration,
    textColor: sample.textColor,
    fontFamily: sample.fontFamily,
    highlight: sample.highlight,
    letterSpacing: sample.letterSpacing,
    lineHeight: sample.lineHeight,
    fontSize: sample.fontSize,
    align: sample.align,
  }
}

export function shouldShowSlideFooter(
  footer: DeckFooter | undefined,
  slide: Pick<Slide, 'layout'> | undefined,
  slideIndex: number | undefined,
): boolean {
  if (!footer) return false
  const hasContent = Boolean(footer.slideNumber || footer.text?.trim())
  if (!hasContent) return false
  if (footer.skipTitle && (slideIndex === 0 || slide?.layout === 'title')) return false
  return true
}
