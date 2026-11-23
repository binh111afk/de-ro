/**
 * AI sửa slide có sẵn qua LỆNH có cấu trúc (không để model viết lại slide):
 * model chỉ trả `{"action":"edit","commands":[...]}`, engine kiểm tra từng lệnh rồi dựng lại
 * slide bằng layout engine. Lệnh sai/lạ bị bỏ kèm lý do, không làm hỏng deck.
 */
import { SLIDE_FONTS, slideFontByName } from './slideFonts'
import { hasTextEffects, textEffectsOf } from './slideTextEffects'
import type { Deck, DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import { parseAiDeck, parseAiObject } from './aiDeck'
import {
  SLIDE_LAYOUTS,
  composeLayout,
  contentFromSlide,
  defaultTone,
  isDecorElement,
  isLayoutId,
  isLayoutOwnedId,
  isTone,
  toneBackground,
  type SlideLayoutContent,
  type SlideLayoutId,
} from './slideLayouts'
import { checkSlide, slideFromAi } from './slideAi'
import { keepCustomBg } from './slideBackground'
import { DECK_THEMES, contrastRatio, mixHex, normalizeTheme, resolveThemeId, themeById } from './slideTheme'
import { SLIDE_DESIGNS, designById, designTheme, type SlideDesign } from './slideDesigns'
import { applySkin } from './slideSkins'

export type SlideEditOp =
  | { op: 'set_theme'; theme: string }
  | { op: 'apply_design'; id: string }
  | { op: 'set_fonts'; heading?: string; body?: string }
  | { op: 'set_colors'; bg?: string; fg?: string; accent?: string }
  | { op: 'set_tone'; tone: SlideTone; slides?: number[] }
  | { op: 'set_transition'; transition: NonNullable<Slide['transition']>; slides?: number[] }
  | { op: 'delete_slides'; slides: number[] }
  | { op: 'move_slide'; from: number; to: number }
  /** sửa ĐÚNG các field nêu trong `fields` của một slide; field không nêu giữ nguyên */
  | { op: 'edit_slide'; slide: number; fields: Record<string, unknown> }
  | { op: 'set_layout'; slide: number; layout: string; fields?: Record<string, unknown> }
  | { op: 'add_image'; slide: number; description?: string }
  | { op: 'add_chart'; title: string; chart: NonNullable<SlideElement['chart']>; position?: number }
  /** chèn slide mới (bố cục + field) tại vị trí `position` (1-based, bỏ trống = cuối) */
  | { op: 'add_slide'; layout: string; fields: Record<string, unknown>; position?: number }
  | { op: 'duplicate_slide'; slide: number }
  | { op: 'set_notes'; slide: number; notes: string }
  | { op: 'rename_deck'; title: string }

/** Phông cho phép: có đủ dấu tiếng Việt (Georgia/Cambria làm vỡ dấu nên không có). */
export const EDIT_FONTS = SLIDE_FONTS.map(font => font.family)
const TRANSITIONS = ['none', 'fade', 'slide', 'zoom']
/** Field chữ của slide mà `edit_slide` được đổi (ảnh/đồ hoạ giữ nguyên, không cho AI đụng). */
const EDITABLE_FIELDS = [
  'title', 'kicker', 'subtitle', 'body', 'bullets', 'items', 'left', 'right', 'leftTitle', 'rightTitle',
  'quote', 'author', 'steps', 'question', 'options', 'answer', 'problem', 'conclusion', 'explanation', 'rows', 'stats', 'bars', 'value', 'label',
] as const
const FIELD_LABEL: Record<string, string> = {
  title: 'tiêu đề', kicker: 'nhãn', subtitle: 'phụ đề', body: 'nội dung', bullets: 'danh sách ý', items: 'danh sách mục',
  left: 'cột trái', right: 'cột phải', leftTitle: 'nhãn cột trái', rightTitle: 'nhãn cột phải', quote: 'trích dẫn',
  author: 'tác giả', steps: 'các bước', question: 'câu hỏi', options: 'phương án', answer: 'đáp án',
  problem: 'đề bài', conclusion: 'kết luận', explanation: 'giải thích', rows: 'bảng', stats: 'số liệu',
}
const HEX = /^#[0-9a-f]{6}$/i

function fieldLabel(field: string, layout: string): string {
  if (field === 'items' && layout === 'cards') return 'danh sách thẻ'
  if (field === 'items' && layout === 'mindmap') return 'danh sách nhánh'
  return FIELD_LABEL[field] ?? field
}

function editFailure(action: string, layout: string, errors: string[]): string {
  const reason = errors.map((error) => error.replace(/"([a-zA-Z]+)"/g, (_, field: string) => fieldLabel(field, layout)))
  const suggestSplit = errors.some((error) => /tối đa|quá nhiều chữ/.test(error))
  return `Mình chưa ${action} được vì ${reason.join(', ')}.${suggestSplit ? ' Bạn có thể chia nội dung thành hai slide để giữ đủ các mục.' : ''}`
}

function checkEditContent(patch: Record<string, unknown>, layout: SlideLayoutId, tone?: SlideTone, current?: SlideLayoutContent) {
  const fields = { ...current, ...patch }
  // "items" trên slide danh sách là yêu cầu chuyển các ý thành thẻ.
  const hasItems = Array.isArray(patch.items)
  if (hasItems && layout === 'bullets' && !Object.hasOwn(patch, 'bullets')) return checkSlide(fields, 'cards', tone)
  const check = checkSlide(fields, layout, tone)
  if (hasItems && layout === 'agenda' && check.errors.length) {
    const cards = checkSlide(fields, 'cards', tone)
    if (!cards.errors.length) return cards
  }
  return check
}

const stackOf = (font: string): string =>
  font === 'Times New Roman'
    ? "'Times New Roman', 'Liberation Serif', serif"
    : font === 'Courier New'
      ? "'Courier New', ui-monospace, monospace"
      : font === 'Be Vietnam Pro'
        ? 'Be Vietnam Pro'
        : `'${font}', 'Be Vietnam Pro', sans-serif`

/** Câu của người dùng có vẻ là yêu cầu SỬA slide có sẵn (bước lọc rẻ trước khi gọi model). */
export const looksLikeEdit = (text: string): boolean => {
  text = text.normalize('NFC').trim()
  if (/^(?:hãy\s+)?(?:soạn|tạo|viết|làm|sinh)\s+(?!thêm\s)(?:(?:cho (?:tôi|mình)|một)\s+)*(?:lại\s+)?(?:\d+\s+slide|slide\s+(?:bài|về|mới)|bài (?:giảng|trình bày))/iu.test(text)) return false
  if (/slide\s*(?:số\s*)?\d+[^.\n]{0,90}(?:tách|gộp|thêm|xóa|xoá|đổi|rút|chuyển|viết)|(?:thêm|chèn|bổ sung)\s+(?:(?:một|1|vài|\d+)\s+)?(?:slide|trang|ảnh|hình minh họa|hình minh hoạ|hiệu ứng|biểu đồ|câu hỏi trắc nghiệm)|(?:vẽ|tạo|thêm|chèn|làm)\s+(?:(?:một|1)\s+)?(?:sơ đồ tư duy|biểu đồ)/iu.test(text)) return true
  return /(đổi|thay|chuyển|sửa|chỉnh|set|áp|dùng|chọn|làm giống|theo|sang)[^.\n]{0,40}(phông|font|màu|theme|bộ màu|tông|nền|hiệu ứng|bố cục|thiết kế|bộ mẫu|mẫu slide|mẫu)|(áp dụng)[^.\n]{0,40}(thiết kế|bộ mẫu|mẫu slide|mẫu)|(xoá|xóa|bỏ|xoa)\s+slide|(di chuyển|dời|đưa)\s+slide|(sửa|đổi|thay|chỉnh|rút gọn|viết lại|thêm|bớt|bỏ|ngắn|dài)[^.\n]{0,40}(slide\s*(số\s*)?\d|tiêu đề|bố cục)|slide\s*(số\s*)?\d+[^.\n]{0,40}(sửa|đổi|thay|rút gọn|viết lại|ngắn|dài|thêm|bớt)/i.test(
    text,
  )
}

/** `context`: mô tả deck hiện tại (theme, phông, danh sách slide) để model chọn đúng. */
export function editSystemPrompt(context: string): string {
  const themes = DECK_THEMES.map((t) => `${t.id}=${t.name} (${t.vibe})`).join('; ')
  const designs = SLIDE_DESIGNS.map((d) => `${d.id}="${d.name}"`).join(', ')
  return (
    'Bạn điều khiển trình soạn slide. Sửa hoặc chèn đúng những slide người dùng yêu cầu trong bài hiện tại. ' +
    'Chỉ trả về DUY NHẤT một JSON, không chữ ngoài JSON: {"action":"edit","commands":[...]}.\n' +
    'Lệnh cho phép (slides = mảng số thứ tự bắt đầu từ 1; bỏ trống = tất cả):\n' +
    `- {"op":"apply_design","id":"<id>"} — áp dụng trọn gói một bộ thiết kế (theme + phong cách + trang trí) cho cả bài. Thiết kế có sẵn: ${designs}\n` +
    `- {"op":"set_theme","theme":"<id>"} — id: ${themes}\n` +
    `- {"op":"set_fonts","heading":"<phông>","body":"<phông>"} — phông chỉ trong: ${EDIT_FONTS.join(', ')} (heading/body chỉ cần nêu cái đổi)\n` +
    '- {"op":"set_colors","bg":"#rrggbb","fg":"#rrggbb","accent":"#rrggbb"} — chỉ nêu màu cần đổi; chữ/nền phải đủ tương phản\n' +
    '- {"op":"set_tone","tone":"theme|soft|accent","slides":[1,2]} — tông nền slide\n' +
    '- {"op":"set_transition","transition":"none|fade|slide|zoom","slides":[1,2]} — lệnh thêm hiệu ứng chung dùng fade nếu không nêu kiểu.\n' +
    '- {"op":"add_image","slide":3,"description":"chủ thể cần minh hoạ"} — thêm ảnh vào slide được nhắc; nếu không nêu số thì dùng slide đang chọn.\n' +
    '- {"op":"add_chart","title":"...","chart":{"type":"bar|line|pie","data":[{"label":"...","value":12}]},"position":3} — chèn một slide biểu đồ. Chỉ dùng số liệu người dùng đưa hoặc số có căn cứ từ nguồn. Nếu chưa đủ dữ liệu, trả {"action":"none","reason":"need_data"}.\n' +
    '- {"op":"delete_slides","slides":[3]}\n' +
    '- {"op":"move_slide","from":3,"to":1}\n' +
    `- {"op":"edit_slide","slide":3,"fields":{"title":"..."}} — sửa NỘI DUNG một slide. CHỈ nêu field cần đổi (đổi tiêu đề thì chỉ gửi title; ` +
    `KHÔNG gửi lại field không đổi). Field chữ: ${EDITABLE_FIELDS.join(', ')}; field danh sách (bullets, items…) gửi TOÀN BỘ danh sách mới. ` +
    'Công thức viết $...$, nhấn mạnh từ khoá bằng **đậm** (tối đa 2 cụm mỗi ý). Nội dung hiện tại của từng slide có trong "Bài trình bày hiện tại".\n' +
    'Bố cục "cards" chứa 2–6 thẻ trong "items", mỗi thẻ tối đa 100 ký tự. Nếu người dùng muốn tách thành các thẻ riêng, giữ tên đầy đủ của từng mục. ' +
    'Từ bố cục "bullets" có thể gửi "items" để chuyển thẳng sang thẻ. "bullets" tối đa 6 ý, "timeline"/"cycle" 3–6 bước, "mindmap" 2–6 nhánh, "quiz" 2–4 phương án. ' +
    'Nếu người dùng yêu cầu tách thành nhiều slide, dùng "edit_slide" rồi "add_slide" cho phần còn lại.\n' +
    '- {"op":"add_slide","layout":"<id>","fields":{...},"position":2} — chèn đúng số slide được yêu cầu; bỏ position để thêm cuối. Với sơ đồ tư duy dùng mindmap, fields có title, body (chủ đề) và items (3–6 nhánh ngắn). Với trắc nghiệm dùng quiz, fields có question, options (2–4 phương án), answer (chỉ số từ 0).\n' +
    '- {"op":"duplicate_slide","slide":3}\n' +
    '- {"op":"set_notes","slide":3,"notes":"ghi chú trình bày"}\n' +
    '- {"op":"rename_deck","title":"tên bài giảng"}\n' +
    `- {"op":"set_layout","slide":3,"layout":"<id>","fields":{...}} — đổi bố cục và nội dung trong cùng một lệnh. Nếu yêu cầu bảng so sánh, dùng table với title và rows (hàng đầu là nhãn cột). Nếu yêu cầu so sánh hai cột, dùng comparison với title, leftTitle, rightTitle, left, right. So sánh đúng các đối tượng được yêu cầu, tuyệt đối không chỉ đổi bố cục. Tách 5 mục trên một slide có thể dùng rules với stats gồm 5 hàng {value,label}, viết value là tên mục và label là ý ngắn. Bố cục: ${SLIDE_LAYOUTS.filter((l) => !isEditorialLayout(l.id)).map((l) => `${l.id}=${l.name}`).join(', ')}\n` +
    'Chỉ trả {"action":"none"} khi không có thao tác phù hợp. Không trả dàn ý hay cả bài.\n' +
    `Bài trình bày hiện tại: ${context}`
  )
}

const isIndexList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 && value.every((n) => Number.isInteger(n))

/** Đọc câu trả lời của model → danh sách lệnh hợp lệ về hình dạng (giá trị cụ thể kiểm sau, lúc áp). */
export function parseEditCommands(raw: string): { ops: SlideEditOp[]; errors: string[]; needsData?: boolean } {
  const data = parseAiObject(raw) as { action?: unknown; commands?: unknown; reason?: unknown } | null
  const ops: SlideEditOp[] = []
  const errors: string[] = []
  if (data?.action === 'none' && data.reason === 'need_data') return { ops, errors, needsData: true }
  if (!data || data.action !== 'edit' || !Array.isArray(data.commands)) return { ops, errors }
  for (const item of data.commands.slice(0, 12)) {
    const c = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const slides = c.slides === undefined ? undefined : isIndexList(c.slides) ? c.slides : null
    switch (c.op) {
      case 'apply_design': {
        const id = typeof c.id === 'string' ? c.id.trim() : typeof c.design === 'string' ? c.design.trim() : ''
        if (id) ops.push({ op: 'apply_design', id })
        else errors.push('apply_design thiếu "id"')
        break
      }
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
      case 'edit_slide':
        if (Number.isInteger(c.slide) && c.fields && typeof c.fields === 'object' && !Array.isArray(c.fields)) {
          ops.push({ op: 'edit_slide', slide: c.slide as number, fields: c.fields as Record<string, unknown> })
        } else errors.push('edit_slide thiếu "slide" hoặc "fields"')
        break
      case 'set_layout':
        if (Number.isInteger(c.slide) && typeof c.layout === 'string') {
          const fields = c.fields && typeof c.fields === 'object' && !Array.isArray(c.fields)
            ? c.fields as Record<string, unknown> : undefined
          ops.push({ op: 'set_layout', slide: c.slide as number, layout: c.layout, ...(fields ? { fields } : {}) })
        }
        else errors.push('set_layout thiếu "slide" hoặc "layout"')
        break
      case 'add_image':
        if (Number.isInteger(c.slide)) ops.push({ op: 'add_image', slide: c.slide as number, description: typeof c.description === 'string' ? c.description.trim().slice(0, 280) : undefined })
        else errors.push('Chưa tìm được slide để thêm ảnh')
        break
      case 'add_chart': {
        const chart = c.chart as NonNullable<SlideElement['chart']> | undefined
        if (typeof c.title === 'string' && c.title.trim() && chart && ['bar', 'line', 'pie'].includes(chart.type) &&
            Array.isArray(chart.data) && chart.data.length >= 2 && chart.data.length <= 12 &&
            chart.data.every(d => d && typeof d.label === 'string' && d.label.trim() && Number.isFinite(d.value) && (chart.type !== 'pie' || d.value >= 0)) &&
            (chart.type !== 'pie' || chart.data.some(d => d.value > 0))) {
          ops.push({
            op: 'add_chart', title: c.title.trim().slice(0, 160), position: Number.isInteger(c.position) ? c.position as number : undefined,
            chart: { type: chart.type, data: chart.data.map(d => ({ label: d.label.trim().slice(0, 60), value: d.value })) },
          })
        } else errors.push('Biểu đồ chưa đủ dữ liệu')
        break
      }
      case 'add_slide':
        if (typeof c.layout === 'string' && c.fields && typeof c.fields === 'object' && !Array.isArray(c.fields)) {
          ops.push({
            op: 'add_slide',
            layout: c.layout,
            fields: c.fields as Record<string, unknown>,
            position: Number.isInteger(c.position) ? (c.position as number) : undefined,
          })
        } else errors.push('add_slide thiếu "layout" hoặc "fields"')
        break
      case 'duplicate_slide':
        if (Number.isInteger(c.slide)) ops.push({ op: 'duplicate_slide', slide: c.slide as number })
        else errors.push('duplicate_slide thiếu "slide"')
        break
      case 'set_notes':
        if (Number.isInteger(c.slide) && typeof c.notes === 'string') ops.push({ op: 'set_notes', slide: c.slide as number, notes: c.notes })
        else errors.push('set_notes thiếu "slide" hoặc "notes"')
        break
      case 'rename_deck':
        if (typeof c.title === 'string' && c.title.trim()) ops.push({ op: 'rename_deck', title: c.title.trim().slice(0, 120) })
        else errors.push('rename_deck thiếu "title"')
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
    const cleanSlide: Slide = { ...slide, elements: slide.elements.filter((el) => !isDecorElement(el)) }
    const t = tone ?? (isTone(slide.tone) ? slide.tone : defaultTone(slide.layout))
    const previous = new Map(cleanSlide.elements.map(el => [el.id, el]))
    const elements = composeLayout(theme, slide.layout, contentFromSlide(cleanSlide), t).map(el => {
      const before = previous.get(el.id)
      return el.type === 'text' && before && hasTextEffects(before) ? { ...el, ...textEffectsOf(before) } : el
    })
    if (elements.length > 0) {
      // Giữ lại phần tử người dùng tự thêm (hình khối, icon, chữ, ảnh thứ 2…) khi đổi thiết kế/bộ màu
      const userAdded = cleanSlide.elements.filter((el) => {
        if (isLayoutOwnedId(el.id)) return false
        if (el.type === 'image' && elements.some((e) => e.type === 'image' && e.src === el.src)) return false
        if (el.type === 'table' && elements.some((e) => e.type === 'table')) return false
        if (el.type === 'graphic' && elements.some((e) => e.type === 'graphic' && e.graphicId === el.graphicId)) return false
        return true
      })
      return keepCustomBg(slide, { ...slide, tone: t, background: toneBackground(theme, t), elements: [...elements, ...userAdded] }, theme.fg)
    }
  }
  const kept = slide.elements.filter((el) => !isDecorElement(el))
  return slide.customBg ? { ...slide, elements: kept } : { ...slide, background: theme.bg, elements: kept }
}

/**
 * Áp dụng hoặc gỡ bộ thiết kế lên toàn bộ deck hiện có (thuần, không thêm/bớt slide).
 * Truyền `null` để quay về thiết kế mặc định của bài mới (DECK_THEMES[0], gỡ decor/skin).
 * `palette`: dùng bộ màu này thay cho bộ màu gốc của thiết kế (ribbon "Bộ màu": đổi màu, giữ kiểu).
 */
export function applyDeckDesign(deck: Deck, design: SlideDesign | null, palette?: DeckTheme): Deck {
  if (!design) {
    // "Mặc định" = về đúng bộ màu + phông của bài slide mới (DECK_THEMES[0])
    const currentTheme = normalizeTheme(DECK_THEMES[0])
    return {
      ...deck,
      theme: currentTheme,
      style: undefined,
      design: undefined,
      slides: deck.slides.map((s) => {
        const cleaned = { ...s, decorKit: undefined }
        return recomposeSlide(currentTheme, cleaned)
      }),
    }
  }
  const targetTheme = designTheme(design, palette)
  const total = deck.slides.length
  return {
    ...deck,
    theme: targetTheme,
    style: design.stylePack ?? design.id,
    design: design.id,
    slides: deck.slides.map((s, i) => {
      if (s.html) return s
      const nextBase = recomposeSlide(targetTheme, { ...s, decorKit: design.decorKit })
      return keepGeometry(s, nextBase, applySkin(nextBase, design.id, targetTheme, i, total, true))
    }),
  }
}

// vị trí, kích thước, căn lề, cỡ chữ: thuộc bố cục — đổi thiết kế không đụng tới
const GEOMETRY = ['x', 'y', 'w', 'h', 'rotation', 'fixedHeight', 'align', 'valign', 'fontSize', 'flipX', 'flipY'] as const

/**
 * Thiết kế chỉ đổi kiểu, không đổi bố cục: lấy màu / phông / viền / nền / motif từ bản skin,
 * nhưng vị trí + kích thước giữ như slide đang có. Khung phụ skin tự dàn cho bố cục riêng
 * của nó (trang bìa, trang kết…) bị bỏ vì sẽ lệch khỏi chữ; chỉ giữ motif trang trí góc.
 */
function keepGeometry(original: Slide, base: Slide, styled: Slide): Slide {
  const before = new Map(original.elements.map((el) => [el.id, el]))
  const skinned = new Map(styled.elements.map((el) => [el.id, el]))
  const elements: SlideElement[] = base.elements.map((el) => {
    const look = skinned.get(el.id)
    if (!look || isDecorElement(look)) return el
    const geo = before.get(el.id) ?? el
    const merged: SlideElement = { ...look, ...textEffectsOf(geo) }
    for (const k of GEOMETRY) (merged as unknown as Record<string, unknown>)[k] = geo[k]
    return merged
  })
  const motifs = styled.elements.filter(
    (el) => isDecorElement(el) && (el.id.startsWith('skin-motif-') || el.id.startsWith('decor-kit-')) && !base.elements.some((b) => b.id === el.id),
  )
  return { ...styled, elements: [...elements, ...motifs] }
}

/** Một số lượt cũ trả một slide mới dưới dạng bài trình bày. */
export function parseAddedSlide(raw: string): SlideEditOp | undefined {
  const deck = parseAiDeck(raw)
  if (deck?.slides.length !== 1) return undefined
  const page = deck.slides[0]
  if (!page || !isLayoutId(page.layout)) return undefined
  const { layout, ...fields } = page
  if (checkSlide(page, layout).errors.length) return undefined
  return { op: 'add_slide', layout, fields }
}

/** Mô tả ngắn một slide (bố cục + nội dung chữ) để đưa vào prompt cho model biết đang sửa gì. */
export function describeSlide(slide: Slide, index: number): string {
  if (slide.html) return `${index + 1}. (slide HTML, không sửa được)`
  const { image: _image, image2: _image2, graphic: _graphic, ...content } = contentFromSlide(slide)
  const json = JSON.stringify(content, (_k, v) => (v === undefined || (Array.isArray(v) && !v.length) ? undefined : v))
  return `${index + 1}. [${slide.layout ?? 'slide'}] ${json.length > 600 ? json.slice(0, 600) + '…' : json}`
}

/** Nội dung slide dựng lại cho bố cục khác: field bố cục mới cần mà chưa có thì lấy từ danh sách ý. */
function adaptContent(content: SlideLayoutContent): SlideLayoutContent {
  const list = content.bullets?.length ? content.bullets : content.items?.length ? content.items : content.steps
  const next = { ...content }
  if (list?.length) {
    next.bullets ??= list
    next.items ??= list
    next.steps ??= list
    if (!next.left && !next.right) {
      const half = Math.ceil(list.length / 2)
      next.left = list.slice(0, half)
      next.right = list.slice(half)
    }
  }
  return next
}

export interface EditResult {
  deck: Deck
  /** từng dòng báo lại cho người dùng: lệnh đã làm / lệnh bị bỏ và lý do */
  summary: string[]
  changed: boolean
  images: Array<{ slideId: string; description?: string }>
}

/** Áp lần lượt các lệnh lên deck (thuần, không đụng deck gốc). Lệnh lỗi bị bỏ, lệnh còn lại vẫn chạy. */
export function applyEdits(deck: Deck, ops: SlideEditOp[]): EditResult {
  let next = deck
  const summary: string[] = []
  const images: EditResult['images'] = []
  const html = deck.format === 'html'
  const pick = (slides: number[] | undefined, count: number): number[] =>
    (slides ?? Array.from({ length: count }, (_, i) => i + 1)).filter((n) => n >= 1 && n <= count)
  const restyle = (theme: DeckTheme, label: string) => {
    next = { ...next, theme, slides: next.slides.map((s) => recomposeSlide(theme, s)) }
    summary.push(label)
  }

  for (const op of ops) {
    if (html && ['set_theme', 'set_fonts', 'set_colors', 'set_tone', 'apply_design'].includes(op.op)) {
      summary.push('Bỏ qua: bài giảng HTML không đổi được giao diện bằng lệnh.')
      continue
    }
    const theme = normalizeTheme(next.theme)
    switch (op.op) {
      case 'apply_design': {
        const d = designById(op.id)
        if (!d) {
          summary.push(`Bỏ qua: không tìm thấy thiết kế "${op.id}".`)
          break
        }
        if (!themeById(d.themeId)) {
          summary.push(`Bỏ qua: không tìm thấy bộ màu "${d.themeId}".`)
          break
        }
        next = applyDeckDesign(next, d)
        summary.push(`Áp dụng thiết kế "${d.name}".`)
        break
      }
      case 'set_theme': {
        const id = resolveThemeId(op.theme)
        const target = DECK_THEMES.find((t) => t.id === id)
        if (target) {
          // Phông người dùng/AI đã đặt riêng (khác mặc định của bộ màu hiện tại) được giữ khi đổi bộ màu.
          const current = DECK_THEMES.find((t) => t.id === resolveThemeId(theme.id))
          const legacy = normalizeTheme({ ...theme, fonts: undefined, fontHeading: '', fontBody: '' })
          const fonts = { ...target.fonts! }
          if (current?.fonts && ![current.fonts.heading, legacy.fonts.heading].includes(theme.fonts.heading)) fonts.heading = theme.fonts.heading
          if (current?.fonts && ![current.fonts.body, legacy.fonts.body].includes(theme.fonts.body)) fonts.body = theme.fonts.body
          restyle({ ...target, fontHeading: fonts.heading, fontBody: fonts.body, fonts }, `Đổi bộ màu sang ${target.name}.`)
        }
        else summary.push(`Bỏ qua: không có bộ màu "${op.theme}".`)
        break
      }
      case 'set_fonts': {
        const find = (name?: string) => slideFontByName(name)?.family
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
      case 'edit_slide': {
        const slide = next.slides[op.slide - 1]
        if (!slide) {
          summary.push(`Bỏ qua: không có slide ${op.slide}.`)
          break
        }
        if (slide.html || !slide.layout || !isLayoutId(slide.layout)) {
          summary.push(`Bỏ qua: slide ${op.slide} không sửa nội dung được bằng lệnh.`)
          break
        }
        const patch = Object.fromEntries(Object.entries(op.fields).filter(([k]) => (EDITABLE_FIELDS as readonly string[]).includes(k)))
        if (!Object.keys(patch).length) {
          summary.push(`Bỏ qua: slide ${op.slide} không có field hợp lệ để sửa.`)
          break
        }
        const { image, image2, imageCrop, image2Crop, graphic, ...current } = contentFromSlide(slide)
        // checkSlide chuẩn hoá (cắt độ dài, giới hạn đậm, NBSP…) và báo field bắt buộc/ngân sách bị vi phạm
        const check = checkEditContent(patch, slide.layout, slide.tone, current)
        if (check.errors.length) {
          summary.push(editFailure(`sửa slide ${op.slide}`, check.page.layout, check.errors))
          break
        }
        const built = slideFromAi({ ...check.page, image, image2, imageCrop, image2Crop, graphic: check.page.graphic ?? graphic }, theme)
        const converted = check.page.layout !== slide.layout
        const rebuilt = converted && next.design ? applySkin(built, next.design, theme, op.slide - 1, next.slides.length, true) : built
        const updated = keepCustomBg(slide, { ...rebuilt, id: slide.id, notes: slide.notes, transition: slide.transition }, theme.fg)
        next = { ...next, slides: next.slides.map((s) => (s === slide ? updated : s)) }
        const fields = Object.keys(patch).map((k) => fieldLabel(k, check.page.layout)).join(', ')
        const message = converted ? `Mình đã chuyển slide ${op.slide} sang bố cục thẻ.` : `Mình đã cập nhật ${fields} ở slide ${op.slide}.`
        summary.push(message + (check.readability.length ? ' Chữ có thể hơi nhỏ.' : ''))
        break
      }
      case 'set_layout': {
        const slide = next.slides[op.slide - 1]
        if (!slide) {
          summary.push(`Bỏ qua: không có slide ${op.slide}.`)
          break
        }
        if (slide.html) {
          summary.push(`Bỏ qua: slide ${op.slide} là slide HTML, không đổi bố cục được.`)
          break
        }
        if (!isLayoutId(op.layout)) {
          summary.push('Mình chưa tìm được bố cục phù hợp.')
          break
        }
        const layoutName = SLIDE_LAYOUTS.find(l => l.id === op.layout)!.name.toLowerCase()
        const tone = defaultTone(op.layout)
        const current = contentFromSlide(slide)
        const base = adaptContent(current)
        const fields = Object.fromEntries(Object.entries(op.fields ?? {}).filter(([key]) => (EDITABLE_FIELDS as readonly string[]).includes(key)))
        const check = op.fields ? checkSlide({ ...base, ...fields }, op.layout, tone) : undefined
        const elements = check
          ? check.errors.length ? [] : composeLayout(theme, op.layout, { ...check.page, image: current.image, image2: current.image2, imageCrop: current.imageCrop, image2Crop: current.image2Crop }, tone)
          : composeLayout(theme, op.layout, base, tone)
        if (!elements.length) {
          summary.push(`Mình chưa đủ nội dung để đổi slide ${op.slide} sang dạng ${layoutName}.`)
          break
        }
        const rawUpdated: Slide = keepCustomBg(slide, { ...slide, layout: op.layout, tone, background: toneBackground(theme, tone), elements }, theme.fg)
        const updated = next.design ? applySkin(rawUpdated, next.design, theme, op.slide - 1, next.slides.length, true) : rawUpdated
        next = { ...next, slides: next.slides.map((s) => (s === slide ? updated : s)) }
        summary.push(`Mình đã đổi slide ${op.slide} sang dạng ${layoutName}.`)
        break
      }
      case 'add_image': {
        const slide = next.slides[op.slide - 1]
        if (slide && !slide.html) images.push({ slideId: slide.id, description: op.description })
        else summary.push(`Mình chưa tìm được slide ${op.slide} để thêm ảnh.`)
        break
      }
      case 'add_chart': {
        const slide = slideFromAi({ title: op.title }, theme)
        slide.elements.push({ id: `${slide.id}-chart`, type: 'chart', x: 8, y: 28, w: 84, h: 65, chart: op.chart })
        const at = Math.min(Math.max((op.position ?? next.slides.length + 1) - 1, 0), next.slides.length)
        const slides = [...next.slides]
        slides.splice(at, 0, slide)
        next = { ...next, slides }
        summary.push(`Mình đã thêm biểu đồ ở slide ${at + 1}.`)
        break
      }
      case 'add_slide': {
        if (!isLayoutId(op.layout)) {
          summary.push('Mình chưa tìm được bố cục phù hợp cho slide mới.')
          break
        }
        const patch = Object.fromEntries(Object.entries(op.fields).filter(([k]) => (EDITABLE_FIELDS as readonly string[]).includes(k)))
        const check = checkEditContent(patch, op.layout)
        if (check.errors.length) {
          summary.push(editFailure('thêm slide', check.page.layout, check.errors))
          break
        }
        const built = slideFromAi(check.page, theme)
        const at = Math.min(Math.max((op.position ?? next.slides.length + 1) - 1, 0), next.slides.length)
        const styledBuilt = next.design ? applySkin(built, next.design, theme, at, next.slides.length + 1, true) : built
        const slides = [...next.slides]
        slides.splice(at, 0, styledBuilt)
        next = { ...next, slides }
        summary.push(`Mình đã thêm slide ở vị trí ${at + 1}.`)
        break
      }
      case 'duplicate_slide': {
        const at = op.slide - 1
        const slide = next.slides[at]
        if (!slide) {
          summary.push(`Bỏ qua: không có slide ${op.slide}.`)
          break
        }
        const slides = [...next.slides]
        slides.splice(at + 1, 0, { ...slide, id: Math.random().toString(36).slice(2, 10) })
        next = { ...next, slides }
        summary.push(`Nhân bản slide ${op.slide}.`)
        break
      }
      case 'set_notes': {
        const slide = next.slides[op.slide - 1]
        if (!slide) {
          summary.push(`Bỏ qua: không có slide ${op.slide}.`)
          break
        }
        next = { ...next, slides: next.slides.map((s) => (s === slide ? { ...s, notes: op.notes.trim() || undefined } : s)) }
        summary.push(`Cập nhật ghi chú trình bày slide ${op.slide}.`)
        break
      }
      case 'rename_deck':
        next = { ...next, title: op.title }
        summary.push(`Đổi tên bài giảng thành "${op.title}".`)
        break
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
  return { deck: next, summary, changed: next !== deck, images }
}
