/**
 * AI sửa slide có sẵn qua LỆNH có cấu trúc (không để model viết lại slide):
 * model chỉ trả `{"action":"edit","commands":[...]}`, engine kiểm tra từng lệnh rồi dựng lại
 * slide bằng layout engine. Lệnh sai/lạ bị bỏ kèm lý do, không làm hỏng deck.
 */
import type { Deck, DeckTheme, Slide, SlideTone } from '@/store/docs'
import { parseAiObject } from './aiDeck'
import {
  composeLayout,
  contentFromSlide,
  defaultTone,
  isLayoutId,
  isTone,
  toneBackground,
} from './slideLayouts'
import { DECK_THEMES, contrastRatio, mixHex, normalizeTheme, resolveThemeId } from './slideTheme'

export type SlideEditOp =
  | { op: 'set_theme'; theme: string }
  | { op: 'set_fonts'; heading?: string; body?: string }
  | { op: 'set_colors'; bg?: string; fg?: string; accent?: string }
  | { op: 'set_tone'; tone: SlideTone; slides?: number[] }
  | { op: 'set_transition'; transition: NonNullable<Slide['transition']>; slides?: number[] }
  | { op: 'delete_slides'; slides: number[] }
  | { op: 'move_slide'; from: number; to: number }

/** Phông cho phép: có đủ dấu tiếng Việt (Georgia/Cambria làm vỡ dấu nên không có). */
export const EDIT_FONTS = ['Be Vietnam Pro', 'Times New Roman', 'Arial', 'Tahoma', 'Verdana', 'Segoe UI', 'Calibri', 'Courier New']
const TRANSITIONS = ['none', 'fade', 'slide', 'zoom']
const HEX = /^#[0-9a-f]{6}$/i

const stackOf = (font: string): string =>
  font === 'Times New Roman'
    ? "'Times New Roman', 'Liberation Serif', serif"
    : font === 'Courier New'
      ? "'Courier New', ui-monospace, monospace"
      : font === 'Be Vietnam Pro'
        ? 'Be Vietnam Pro'
        : `'${font}', 'Be Vietnam Pro', sans-serif`

/** Câu của người dùng có vẻ là yêu cầu SỬA slide có sẵn (bước lọc rẻ trước khi gọi model). */
export const looksLikeEdit = (text: string): boolean =>
  /(đổi|thay|chuyển|sửa|chỉnh|set)[^.\n]{0,40}(phông|font|màu|theme|bộ màu|tông|nền|hiệu ứng)|(xoá|xóa|bỏ|xoa)\s+slide|(di chuyển|dời|đưa)\s+slide/i.test(
    text,
  )

/** `context`: mô tả deck hiện tại (theme, phông, danh sách slide) để model chọn đúng. */
export function editSystemPrompt(context: string): string {
  const themes = DECK_THEMES.map((t) => `${t.id}=${t.name} (${t.vibe})`).join('; ')
  return (
    'Bạn điều khiển trình soạn slide. Người dùng muốn SỬA slide đã có (không viết slide mới). ' +
    'Chỉ trả về DUY NHẤT một JSON, không chữ ngoài JSON: {"action":"edit","commands":[...]}.\n' +
    'Lệnh cho phép (slides = mảng số thứ tự bắt đầu từ 1; bỏ trống = tất cả):\n' +
    `- {"op":"set_theme","theme":"<id>"} — id: ${themes}\n` +
    `- {"op":"set_fonts","heading":"<phông>","body":"<phông>"} — phông chỉ trong: ${EDIT_FONTS.join(', ')} (heading/body chỉ cần nêu cái đổi)\n` +
    '- {"op":"set_colors","bg":"#rrggbb","fg":"#rrggbb","accent":"#rrggbb"} — chỉ nêu màu cần đổi; chữ/nền phải đủ tương phản\n' +
    '- {"op":"set_tone","tone":"theme|soft|accent","slides":[1,2]} — tông nền slide\n' +
    '- {"op":"set_transition","transition":"none|fade|slide|zoom","slides":[1,2]}\n' +
    '- {"op":"delete_slides","slides":[3]}\n' +
    '- {"op":"move_slide","from":3,"to":1}\n' +
    'Nếu yêu cầu KHÔNG phải sửa giao diện/thứ tự slide có sẵn (ví dụ soạn slide mới, viết lại nội dung), trả {"action":"none"}.\n' +
    `Bài trình bày hiện tại: ${context}`
  )
}

const isIndexList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 && value.every((n) => Number.isInteger(n))

/** Đọc câu trả lời của model → danh sách lệnh hợp lệ về hình dạng (giá trị cụ thể kiểm sau, lúc áp). */
export function parseEditCommands(raw: string): { ops: SlideEditOp[]; errors: string[] } {
  const data = parseAiObject(raw) as { action?: unknown; commands?: unknown } | null
  const ops: SlideEditOp[] = []
  const errors: string[] = []
  if (!data || data.action !== 'edit' || !Array.isArray(data.commands)) return { ops, errors }
  for (const item of data.commands.slice(0, 12)) {
    const c = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const slides = c.slides === undefined ? undefined : isIndexList(c.slides) ? c.slides : null
    switch (c.op) {
      case 'set_theme':
        if (typeof c.theme === 'string') ops.push({ op: 'set_theme', theme: c.theme })
        else errors.push('set_theme thiếu "theme"')
        break
      case 'set_fonts':
        ops.push({
          op: 'set_fonts',
          heading: typeof c.heading === 'string' ? c.heading : undefined,
          body: typeof c.body === 'string' ? c.body : undefined,
        })
        break
      case 'set_colors':
        ops.push({
          op: 'set_colors',
          bg: typeof c.bg === 'string' ? c.bg : undefined,
          fg: typeof c.fg === 'string' ? c.fg : undefined,
          accent: typeof c.accent === 'string' ? c.accent : undefined,
        })
        break
      case 'set_tone':
        if (isTone(c.tone) && slides !== null) ops.push({ op: 'set_tone', tone: c.tone, slides })
        else errors.push('set_tone sai tông hoặc danh sách slide')
        break
      case 'set_transition':
        if (typeof c.transition === 'string' && TRANSITIONS.includes(c.transition) && slides !== null) {
          ops.push({ op: 'set_transition', transition: c.transition as 'none' | 'fade' | 'slide' | 'zoom', slides })
        } else errors.push('set_transition sai hiệu ứng hoặc danh sách slide')
        break
      case 'delete_slides':
        if (isIndexList(c.slides)) ops.push({ op: 'delete_slides', slides: c.slides })
        else errors.push('delete_slides thiếu danh sách slide')
        break
      case 'move_slide':
        if (Number.isInteger(c.from) && Number.isInteger(c.to)) ops.push({ op: 'move_slide', from: c.from as number, to: c.to as number })
        else errors.push('move_slide thiếu from/to')
        break
      default:
        errors.push(`lệnh lạ: ${String(c.op)}`)
    }
  }
  return { ops, errors }
}

/** Dựng lại một slide theo theme (và tông) mới; slide HTML/không layout chỉ đổi nền. */
export function recomposeSlide(theme: DeckTheme, slide: Slide, tone?: SlideTone): Slide {
  if (slide.html) return slide
  if (slide.layout && isLayoutId(slide.layout)) {
    const t = tone ?? (isTone(slide.tone) ? slide.tone : defaultTone(slide.layout))
    const elements = composeLayout(theme, slide.layout, contentFromSlide(slide), t)
    if (elements.length > 0) return { ...slide, tone: t, background: toneBackground(theme, t), elements }
  }
  return { ...slide, background: theme.bg }
}

export interface EditResult {
  deck: Deck
  /** từng dòng báo lại cho người dùng: lệnh đã làm / lệnh bị bỏ và lý do */
  summary: string[]
  changed: boolean
}

/** Áp lần lượt các lệnh lên deck (thuần, không đụng deck gốc). Lệnh lỗi bị bỏ, lệnh còn lại vẫn chạy. */
export function applyEdits(deck: Deck, ops: SlideEditOp[]): EditResult {
  let next = deck
  const summary: string[] = []
  const html = deck.format === 'html'
  const pick = (slides: number[] | undefined, count: number): number[] =>
    (slides ?? Array.from({ length: count }, (_, i) => i + 1)).filter((n) => n >= 1 && n <= count)
  const restyle = (theme: DeckTheme, label: string) => {
    next = { ...next, theme, slides: next.slides.map((s) => recomposeSlide(theme, s)) }
    summary.push(label)
  }

  for (const op of ops) {
    if (html && ['set_theme', 'set_fonts', 'set_colors', 'set_tone'].includes(op.op)) {
      summary.push('Bỏ qua: bài giảng HTML không đổi được giao diện bằng lệnh.')
      continue
    }
    const theme = normalizeTheme(next.theme)
    switch (op.op) {
      case 'set_theme': {
        const id = resolveThemeId(op.theme)
        const target = DECK_THEMES.find((t) => t.id === id)
        if (target) {
          // Phông người dùng/AI đã đặt riêng (khác mặc định của bộ màu hiện tại) được giữ khi đổi bộ màu.
          const current = DECK_THEMES.find((t) => t.id === resolveThemeId(theme.id))
          const fonts = { ...target.fonts! }
          if (current?.fonts && theme.fonts.heading !== current.fonts.heading) fonts.heading = theme.fonts.heading
          if (current?.fonts && theme.fonts.body !== current.fonts.body) fonts.body = theme.fonts.body
          restyle({ ...target, fontHeading: fonts.heading, fontBody: fonts.body, fonts }, `Đổi bộ màu sang ${target.name}.`)
        }
        else summary.push(`Bỏ qua: không có bộ màu "${op.theme}".`)
        break
      }
      case 'set_fonts': {
        const find = (name?: string) => (name ? EDIT_FONTS.find((f) => f.toLowerCase() === name.trim().toLowerCase()) : undefined)
        const heading = find(op.heading)
        const body = find(op.body)
        if ((op.heading && !heading) || (op.body && !body)) {
          summary.push(`Bỏ qua phông không hỗ trợ (dùng: ${EDIT_FONTS.join(', ')}).`)
        }
        if (!heading && !body) break
        const h = heading ? stackOf(heading) : theme.fonts.heading
        const b = body ? stackOf(body) : theme.fonts.body
        restyle(
          { ...theme, fontHeading: h, fontBody: b, fonts: { ...theme.fonts, heading: h, body: b } },
          `Đổi phông${heading ? ` tiêu đề thành ${heading}` : ''}${heading && body ? ',' : ''}${body ? ` nội dung thành ${body}` : ''}.`,
        )
        break
      }
      case 'set_colors': {
        const bg = op.bg ?? theme.bg
        const fg = op.fg ?? theme.fg
        const accent = op.accent ?? theme.accent
        if (![op.bg, op.fg, op.accent].every((c) => c === undefined || HEX.test(c))) {
          summary.push('Bỏ qua: màu phải có dạng #rrggbb.')
          break
        }
        if (contrastRatio(bg, fg) < 4.5) {
          summary.push('Bỏ qua: chữ và nền không đủ tương phản (cần ≥ 4,5:1) nên khó đọc.')
          break
        }
        const dark = contrastRatio(bg, '#111827') < contrastRatio(bg, '#ffffff')
        restyle(
          {
            ...theme,
            bg,
            fg,
            accent,
            dark,
            surface: mixHex(bg, fg, dark ? 0.08 : 0.035),
            muted: mixHex(fg, bg, 0.4),
          },
          'Đổi màu bài trình bày.',
        )
        break
      }
      case 'set_tone': {
        const idx = pick(op.slides, next.slides.length)
        next = { ...next, slides: next.slides.map((s, i) => (idx.includes(i + 1) ? recomposeSlide(theme, s, op.tone) : s)) }
        summary.push(`Đổi tông nền ${idx.length} slide.`)
        break
      }
      case 'set_transition': {
        const idx = pick(op.slides, next.slides.length)
        next = { ...next, slides: next.slides.map((s, i) => (idx.includes(i + 1) ? { ...s, transition: op.transition } : s)) }
        summary.push(`Đặt hiệu ứng chuyển slide cho ${idx.length} slide.`)
        break
      }
      case 'delete_slides': {
        const idx = pick(op.slides, next.slides.length)
        if (!idx.length) summary.push('Bỏ qua: không có slide nào khớp số thứ tự.')
        else if (idx.length >= next.slides.length) summary.push('Bỏ qua: không xoá hết mọi slide.')
        else {
          next = { ...next, slides: next.slides.filter((_, i) => !idx.includes(i + 1)) }
          summary.push(`Xoá slide ${idx.join(', ')}.`)
        }
        break
      }
      case 'move_slide': {
        const n = next.slides.length
        if (op.from < 1 || op.from > n || op.to < 1 || op.to > n) {
          summary.push('Bỏ qua: số thứ tự slide không hợp lệ.')
          break
        }
        const slides = [...next.slides]
        const [moved] = slides.splice(op.from - 1, 1)
        slides.splice(op.to - 1, 0, moved)
        next = { ...next, slides }
        summary.push(`Chuyển slide ${op.from} tới vị trí ${op.to}.`)
        break
      }
    }
  }
  return { deck: next, summary, changed: next !== deck }
}
