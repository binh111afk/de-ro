/**
 * Đọc kết quả AI cho slide: dàn ý (chặng 26a) và deck JSON đầy đủ.
 *
 * AI có thể trả về JSON thuần, JSON bọc trong ```json fence, hoặc lời văn
 * kèm JSON. Ta thử bóc fence trước, rồi tìm đoạn JSON đầu tiên hợp lệ.
 */
import type { SlideElement, SlideTone } from '@/store/docs'
import { isLayoutId, isTone, SLIDE_LAYOUTS } from './slideLayouts'
import { DECK_THEMES, resolveThemeId } from './slideTheme'
import { inferSubject, isSubjectId, subjectCatalogText } from './slideSubjects'
import { isStylePackId, stylePackCatalogText } from './slideStyles'

export interface AiSlidePayload {
  title?: string
  /** id layout của lib/slideLayouts.ts; thiếu/sai thì rơi về title+bullets cũ */
  layout?: string
  /** tông nền: theme | soft | accent; thiếu thì theo mặc định của layout */
  tone?: string
  kicker?: string
  subtitle?: string
  body?: string
  /** các ý chính dạng danh sách — dạng ngắn gọn AI hay trả về */
  bullets?: string[]
  /** thẻ nội dung cho layout cards */
  items?: string[]
  /** hai cột cho layout two-column */
  left?: string[]
  right?: string[]
  /** nhãn hai bên của layout comparison */
  leftTitle?: string
  rightTitle?: string
  quote?: string
  author?: string
  /** bảng cho layout table */
  rows?: string[][]
  image?: string
  /** id đồ hoạ vector trong catalog slideGraphics (ưu tiên hơn ảnh AI) */
  graphic?: string
  /** số liệu lớn cho layout stats */
  stats?: Array<{ value?: string; label?: string }>
  /** các bước cho timeline/cycle */
  steps?: string[]
  question?: string
  options?: string[]
  answer?: string | number
  /** ghi chú trình bày cho slide */
  notes?: string[]
  /** mô tả ngắn gọn nội dung deck */
  summary?: string
  /** element do AI mô tả thêm (nếu có) */
  elements?: Array<Partial<Omit<SlideElement, 'type'>> & { type?: string }>
}

/* ------------------------------------------------------------------ *
 * Dàn ý (chặng 26a) — lượt 1 trả style + outline, chưa có nội dung chi tiết
 * ------------------------------------------------------------------ */

export interface DeckPlanSlide {
  title: string
  layout: string
  tone?: SlideTone
  kicker?: string
  /** nội dung cần trình bày ở lượt sinh chi tiết */
  brief?: string
}

export interface DeckPlan {
  title?: string
  /** id trong DECK_THEMES; id lạ bị bỏ để deck giữ theme hiện tại */
  theme?: string
  audience?: string
  /** phong cách trình bày, đưa vào prompt sinh từng slide */
  style?: string
  /** art direction (lib/slideStyles.ts); id lạ bị bỏ */
  stylePack?: string
  /** gói môn (lib/slideSubjects.ts): cấu trúc bài + luật nội dung; thiếu thì suy từ chủ đề */
  subject?: string
  mainIdeas: string[]
  slides: DeckPlanSlide[]
}

/** Số slide tối đa của một dàn ý — chặn model trả về danh sách vô hạn. */
const PLAN_MAX_SLIDES = 20

const text = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned ? cleaned.slice(0, max) : undefined
}

const textList = (value: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => text(item, maxLen))
        .filter((item): item is string => !!item)
        .slice(0, maxItems)
    : []

/** Mọi JSON đọc được trong phản hồi, theo thứ tự: fence → ngoặc ngoài → cả chuỗi. */
/**
 * Sửa các lỗi JSON model hay mắc mà vẫn cứu được nội dung: dấu phẩy thừa, ký
 * tự xuống dòng trần trong chuỗi, dấu ngoặc kép cong, và phản hồi bị cắt cụt
 * (đóng chuỗi + ngoặc còn mở). Trả `null` nếu không có gì để sửa.
 */
export function repairJson(raw: string): string | null {
  let out = ''
  let inString = false
  let escaped = false
  const stack: string[] = []
  for (const ch of raw) {
    if (inString) {
      if (escaped) {
        escaped = false
        out += ch
      } else if (ch === '\\') {
        escaped = true
        out += ch
      } else if (ch === '"') {
        inString = false
        out += ch
      } else if (ch === '\n' || ch === '\r' || ch === '\t') {
        out += ' '
      } else {
        out += ch
      }
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
    out += ch
  }
  if (inString) out += '"'
  out = out.replace(/[\s,:]+$/, '')
  out = out.replace(/,\s*([}\]])/g, '$1')
  out += stack.reverse().join('')
  out = out.replace(/,\s*([}\]])/g, '$1')
  return out === raw ? null : out
}

function jsonCandidates(raw: string): unknown[] {
  const raws: string[] = []
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) raws.push(fence[1])
  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  if (first >= 0 && last > first) raws.push(raw.slice(first, last + 1))
  // phản hồi cắt cụt thiếu `}` cuối: lấy từ `{` đầu tới hết
  if (first >= 0) raws.push(raw.slice(first))
  raws.push(raw)

  const parsed: unknown[] = []
  for (const candidate of raws) {
    for (const attempt of [candidate.trim(), repairJson(candidate.trim())]) {
      if (!attempt) continue
      try {
        parsed.push(JSON.parse(attempt))
        break
      } catch {
        // thử bản sửa / ứng viên tiếp theo
      }
    }
  }
  return parsed
}

export function parseAiDeck(raw: string): { slides: AiSlidePayload[]; title?: string } | null {
  for (const data of jsonCandidates(raw)) {
    const slides = Array.isArray(data) ? data : (data as { slides?: unknown })?.slides
    if (Array.isArray(slides) && slides.length > 0) {
      return {
        slides: slides as AiSlidePayload[],
        title: Array.isArray(data)
          ? undefined
          : text((data as { title?: unknown }).title, 160),
      }
    }
  }
  return null
}

/** Một object JSON bất kỳ trong phản hồi (dùng cho lượt sinh từng slide). */
export function parseAiObject(raw: string): unknown | null {
  for (const data of jsonCandidates(raw)) {
    if (data && typeof data === 'object' && !Array.isArray(data)) return data
  }
  return null
}

/** Layout thay thế cùng "họ nội dung" khi hai slide liền kề trùng bố cục. */
const RHYTHM_ALTERNATES: Record<string, string[]> = {
  bullets: ['cards', 'two-column'],
  cards: ['bullets', 'timeline'],
  'two-column': ['comparison', 'cards'],
  comparison: ['two-column'],
  'image-left': ['image-right'],
  'image-right': ['image-left'],
  stats: ['cards'],
  timeline: ['cycle', 'cards'],
  cycle: ['timeline'],
}

/** Tỉ lệ tối đa slide `bullets` trong một deck dài (≥ 6 slide). */
const MAX_BULLET_SHARE = 0.4

/**
 * Ép nhịp deck bằng code (prompt chỉ khuyên, model vẫn hay lặp): không có hai
 * slide liền kề cùng layout, `bullets` ≤ 40%. Slide đầu và cuối giữ nguyên.
 * Layout chỉ đổi sang "họ" nội dung tương đương nên brief vẫn dùng được.
 */
export function enforceRhythm(slides: DeckPlanSlide[]): DeckPlanSlide[] {
  const out = slides.map((slide) => ({ ...slide }))
  const swap = (i: number, avoid: Set<string>) => {
    const alt = (RHYTHM_ALTERNATES[out[i].layout] ?? []).find((id) => !avoid.has(id))
    if (alt && isLayoutId(alt)) out[i].layout = alt
  }
  for (let i = 1; i < out.length - 1; i++) {
    if (out[i].layout === out[i - 1].layout) {
      swap(i, new Set([out[i - 1].layout, out[i + 1]?.layout ?? '']))
    }
  }
  if (out.length >= 6) {
    const cap = Math.floor(out.length * MAX_BULLET_SHARE)
    let extra = out.filter((slide) => slide.layout === 'bullets').length - cap
    for (let i = out.length - 2; i > 0 && extra > 0; i--) {
      if (out[i].layout !== 'bullets') continue
      const before = out[i].layout
      swap(i, new Set([out[i - 1].layout, out[i + 1].layout]))
      if (out[i].layout !== before) extra--
    }
  }
  return out
}

/**
 * Chuẩn hoá dàn ý: bỏ slide không có tiêu đề, layout/tone lạ về mặc định,
 * theme lạ bỏ trống để không phá theme đang dùng. Trả null khi không có dàn ý.
 */
export function parseDeckPlan(raw: string): DeckPlan | null {
  for (const data of jsonCandidates(raw)) {
    if (!data || typeof data !== 'object') continue
    const outer = data as Record<string, unknown>
    const source =
      outer.plan && typeof outer.plan === 'object'
        ? (outer.plan as Record<string, unknown>)
        : outer
    const rawSlides = Array.isArray(source.slides) ? source.slides : null
    if (!rawSlides?.length) continue

    const slides: DeckPlanSlide[] = []
    for (const item of rawSlides.slice(0, PLAN_MAX_SLIDES)) {
      if (!item || typeof item !== 'object') continue
      const slide = item as Record<string, unknown>
      const title = text(slide.title, 160)
      if (!title) continue
      const kicker = text(slide.kicker, 80)
      const brief = text(slide.brief, 400)
      slides.push({
        title,
        layout:
          typeof slide.layout === 'string' && isLayoutId(slide.layout)
            ? slide.layout
            : 'bullets',
        ...(isTone(slide.tone) ? { tone: slide.tone } : {}),
        ...(kicker ? { kicker } : {}),
        ...(brief ? { brief } : {}),
      })
    }
    if (!slides.length) continue

    const themeId = text(source.theme, 40)
    const packId = text(source.stylePack, 40)
    const title = text(source.title, 160)
    const subjectId = text(source.subject, 40)
    return {
      title,
      theme: resolveThemeId(themeId),
      ...(isStylePackId(packId) ? { stylePack: packId } : {}),
      subject: isSubjectId(subjectId)
        ? subjectId
        : inferSubject([title, text(source.audience, 120), ...slides.map((s) => s.title)].join(' ')),
      audience: text(source.audience, 120),
      style: text(source.style, 600),
      mainIdeas: textList(source.mainIdeas, 6, 160),
      slides: enforceRhythm(slides),
    }
  }
  return null
}

/**
 * Catalog layout + theme dạng text cho prompt — sinh từ chính hai catalog
 * trong code để prompt không lệch khi thêm layout/theme.
 */
export function slideCatalogText(): string {
  return [
    'BỘ MÀU (chọn "theme" đúng một id — theo chủ đề, cảm xúc và đối tượng; tags chỉ là gợi ý, không bắt buộc theo môn):',
    ...DECK_THEMES.map(
      (theme) =>
        `- ${theme.id}: ${theme.name}${theme.vibe ? ` — ${theme.vibe}` : ''}${theme.tags?.length ? ` (gợi ý: ${theme.tags.join(', ')})` : ''}${theme.dark ? ' — nền tối' : ''}`,
    ),
    '',
    stylePackCatalogText(),
    '',
    subjectCatalogText(),
    '',
    'BỐ CỤC (chọn "layout" đúng một id; field trong ngoặc là field nội dung):',
    ...SLIDE_LAYOUTS.map(
      (layout) => `- ${layout.id}: ${layout.description} [${layout.fields.join(', ')}]`,
    ),
  ].join('\n')
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
