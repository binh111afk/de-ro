/**
 * Đọc kết quả AI (dạng JSON deck) thành cấu trúc slide.
 *
 * AI có thể trả về JSON thuần, JSON bọc trong ```json fence, hoặc lời văn
 * kèm JSON. Ta thử bóc fence trước, rồi tìm đoạn JSON đầu tiên hợp lệ.
 */
import type { SlideElement } from '@/store/docs'

export interface AiSlidePayload {
  title?: string
  /** các ý chính dạng danh sách — dạng ngắn gọn AI hay trả về */
  bullets?: string[]
  /** ghi chú trình bày cho slide */
  notes?: string[]
  /** mô tả ngắn gọn nội dung deck */
  summary?: string
  /** element do AI mô tả thêm (nếu có) */
  elements?: Array<Partial<Omit<SlideElement, 'type'>> & { type?: string }>
}

export function parseAiDeck(text: string): { slides: AiSlidePayload[]; title?: string } | null {
  const candidates: string[] = []

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) candidates.push(fence[1])

  // đoạn ngoặc ngoài cùng
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1))

  candidates.push(text)

  for (const raw of candidates) {
    try {
      const data = JSON.parse(raw.trim())
      const slides = Array.isArray(data) ? data : data?.slides
      if (Array.isArray(slides) && slides.length > 0) {
        return {
          slides: slides as AiSlidePayload[],
          title: Array.isArray(data) ? undefined : data?.title,
        }
      }
    } catch {
      // thử candidate tiếp theo
    }
  }
  return null
}

/**
 * Tóm tắt kết quả AI để hiển thị trong khung chat — tránh phun ra JSON thô.
 */
export function summarizeAiDeck(text: string): string | null {
  const parsed = parseAiDeck(text)
  if (!parsed) return null
  const n = parsed.slides.length
  const lines = parsed.slides.map((s, i) => {
    const title = s.title?.trim()
    const count = s.bullets?.length ?? 0
    const detail = count > 0 ? ` (${count} ý)` : ''
    return `${i + 1}. ${title || 'Slide'}${detail}`
  })
  return `Đã tạo ${n} slide:\n${lines.join('\n')}`
}
