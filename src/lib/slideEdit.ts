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
import { keepCustomBg, withBackground } from './slideBackground'
import { keepAnim, setPageAnim } from './slideAnim'
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
  /** `replace`: thay ảnh đang có thay vì thêm ảnh nữa */
  | { op: 'add_image'; slide: number; description?: string; replace?: boolean }
  | { op: 'add_chart'; title: string; chart: NonNullable<SlideElement['chart']>; position?: number; after?: number }
  /** nền riêng cho vài slide (set_colors đổi cả bài) */
  | { op: 'set_background'; color: string; slides?: number[] }
  /** chữ / kiểu của một phần tử; `id: "*"` = mọi hộp chữ trên slide */
  | { op: 'edit_element'; slide: number; id: string; text?: string; color?: string; scale?: number; bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'; remove?: boolean }
  /** chèn slide mới (bố cục + field): sau slide `after` (0 = đầu bài) hoặc tại `position`; bỏ trống = cuối */
  | { op: 'add_slide'; layout: string; fields: Record<string, unknown>; position?: number; after?: number }
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

/** `context`: mô tả deck hiện tại (theme, phông, danh sách slide) để model chọn đúng. */
export function editSystemPrompt(context: string): string {
  const themes = DECK_THEMES.map((t) => `${t.id}=${t.name} (${t.vibe})`).join('; ')
  const designs = SLIDE_DESIGNS.map((d) => `${d.id}="${d.name}"`).join(', ')
  return (
    'Bạn điều khiển trình soạn slide. Sửa hoặc chèn đúng những slide người dùng yêu cầu trong bài hiện tại. ' +
    'TỰ XÁC ĐỊNH người dùng đang muốn gì: muốn bài thay đổi (kể cả nói lửng hay than phiền, vd "slide 3 chữ nhiều quá") thì chỉ trả về DUY NHẤT một JSON, không chữ ngoài JSON: {"action":"edit","commands":[...]}. ' +
    'Chỉ hỏi, xin nhận xét hay trò chuyện thì trả lời ngắn bằng chữ, không JSON.\n' +
    'BÀI MỚI vs CHÈN SLIDE: người dùng bảo "tạo/soạn/làm (thử) slide về X" mà X là chủ đề KHÁC hẳn bài hiện tại, hoặc muốn làm một bài mới từ đầu (không nhắc thêm/chèn vào bài đang mở, không nêu số slide hay vị trí) thì PHẢI trả {"action":"new_deck"} — KHÔNG dùng add_slide để chèn một trang lạc đề vào bài cũ. ' +
    'Chỉ dùng add_slide khi người dùng muốn thêm/chèn/bổ sung trang vào đúng bài hiện tại (cùng chủ đề, hoặc nói rõ thêm/chèn/sau slide N).\n' +
    'PHẠM VI: người dùng nhắc slide nào (số thứ tự, "slide này" = slide đang chọn) thì CHỈ ra lệnh cho đúng slide đó, không đụng slide khác. ' +
    'apply_design, set_theme, set_fonts, set_colors đổi CẢ BÀI: không dùng khi chỉ nhắc một vài slide (đổi nền vài slide dùng set_background, đổi màu / cỡ chữ dùng edit_element). ' +
    'set_tone, set_transition, set_background phải ghi "slides" khi chỉ nhắc một vài slide.\n' +
    'ĐÁNH SỐ: mọi số slide trong mọi lệnh là số trong bài hiện tại TRƯỚC khi áp lệnh nào; thêm hay xoá slide không làm đổi số của slide khác.\n' +
    'Lệnh cho phép (slides = mảng số thứ tự bắt đầu từ 1; bỏ trống = tất cả):\n' +
    `- {"op":"apply_design","id":"<id>"} — áp dụng trọn gói một bộ thiết kế (theme + phong cách + trang trí) cho cả bài. Thiết kế có sẵn: ${designs}\n` +
    `- {"op":"set_theme","theme":"<id>"} — id: ${themes}\n` +
    `- {"op":"set_fonts","heading":"<phông>","body":"<phông>"} — phông chỉ trong: ${EDIT_FONTS.join(', ')} (heading/body chỉ cần nêu cái đổi)\n` +
    '- {"op":"set_colors","bg":"#rrggbb","fg":"#rrggbb","accent":"#rrggbb"} — chỉ nêu màu cần đổi; chữ/nền phải đủ tương phản\n' +
    '- {"op":"set_tone","tone":"theme|soft|accent","slides":[1,2]} — tông nền slide\n' +
    '- {"op":"set_transition","transition":"none|fade|slide|zoom","slides":[1,2]} — lệnh thêm hiệu ứng chung dùng fade nếu không nêu kiểu.\n' +
    '- {"op":"add_image","slide":3,"description":"chủ thể cần minh hoạ","replace":false} — thêm ảnh vào slide được nhắc; nếu không nêu số thì dùng slide đang chọn. Người dùng muốn ĐỔI ảnh đang có thì "replace":true.\n' +
    '- {"op":"set_background","color":"#rrggbb","slides":[3]} — nền riêng cho đúng các slide đó.\n' +
    '- {"op":"edit_element","slide":3,"id":"title","text":"...","color":"#rrggbb","scale":1.25,"bold":true,"italic":false,"align":"left|center|right","remove":true} — sửa một phần tử theo id ghi trong mục "phần tử" của slide; chỉ gửi thuộc tính cần đổi. ' +
    '"id":"*" = mọi hộp chữ trên slide. "scale" là hệ số cỡ chữ (1.25 = to hơn, 0.8 = nhỏ hơn). Dùng cho cỡ chữ, màu chữ, căn lề, xoá ảnh / hình / hộp chữ, và sửa chữ của slide không sửa được bằng edit_slide.\n' +
    '- {"op":"add_chart","title":"...","chart":{"type":"bar|line|pie","data":[{"label":"...","value":12}]},"after":2} — chèn một slide biểu đồ. Chỉ dùng số liệu người dùng đưa hoặc số có căn cứ từ nguồn. Nếu chưa đủ dữ liệu, trả {"action":"none","reason":"need_data"}.\n' +
    '- {"op":"delete_slides","slides":[3]}\n' +
    '- {"op":"move_slide","from":3,"to":1}\n' +
    `- {"op":"edit_slide","slide":3,"fields":{"title":"..."}} — sửa NỘI DUNG một slide. CHỈ nêu field cần đổi (đổi tiêu đề thì chỉ gửi title; ` +
    `KHÔNG gửi lại field không đổi). Field chữ: ${EDITABLE_FIELDS.join(', ')}; field danh sách (bullets, items…) gửi TOÀN BỘ danh sách mới. ` +
    'Công thức viết $...$, nhấn mạnh từ khoá bằng **đậm** (tối đa 2 cụm mỗi ý). Nội dung hiện tại của từng slide có trong "Bài trình bày hiện tại".\n' +
    'Bố cục "cards" chứa 2–6 thẻ trong "items", mỗi thẻ tối đa 100 ký tự. Nếu người dùng muốn tách thành các thẻ riêng, giữ tên đầy đủ của từng mục. ' +
    'Từ bố cục "bullets" có thể gửi "items" để chuyển thẳng sang thẻ. "bullets" tối đa 6 ý, "timeline"/"cycle" 3–6 bước, "mindmap" 2–6 nhánh, "quiz" 2–4 phương án. ' +
    'TÁCH slide N thành nhiều slide: "edit_slide" slide N giữ phần đầu, rồi mỗi slide mới một "add_slide" với "after":N (theo đúng thứ tự), chia đủ nội dung cũ, không bỏ mất ý. ' +
    'GỘP slide: "edit_slide" slide giữ lại với nội dung gộp, rồi "delete_slides" slide còn lại.\n' +
    'Người dùng chê nhiều chữ, dài, rối hoặc xin gọn lại: PHẢI viết lại nội dung ngắn đi rõ rệt (bớt ít nhất một phần ba số chữ, giữ ý chính) bằng edit_slide hoặc set_layout kèm fields mới; chỉ đổi bố cục là chưa làm gì.\n' +
    '- {"op":"add_slide","layout":"<id>","fields":{...},"after":2} — chèn đúng số slide được yêu cầu, ngay sau slide "after" (0 = đầu bài); bỏ "after" để thêm cuối. Với sơ đồ tư duy dùng mindmap, fields có title, body (chủ đề) và items (3–6 nhánh ngắn). Với trắc nghiệm dùng quiz, fields có question, options (2–4 phương án), answer (chỉ số từ 0).\n' +
    '- {"op":"duplicate_slide","slide":3}\n' +
    '- {"op":"set_notes","slide":3,"notes":"ghi chú trình bày"}\n' +
    '- {"op":"rename_deck","title":"tên bài giảng"}\n' +
    `- {"op":"set_layout","slide":3,"layout":"<id>","fields":{...}} — đổi bố cục và nội dung trong cùng một lệnh. Nếu yêu cầu bảng so sánh, dùng table với title và rows (hàng đầu là nhãn cột). Nếu yêu cầu so sánh hai cột, dùng comparison với title, leftTitle, rightTitle, left, right. So sánh đúng các đối tượng được yêu cầu, tuyệt đối không chỉ đổi bố cục. Tách 5 mục trên một slide có thể dùng rules với stats gồm 5 hàng {value,label}, viết value là tên mục và label là ý ngắn. Bố cục: ${SLIDE_LAYOUTS.map((l) => `${l.id}=${l.name}`).join(', ')}\n` +
    'Không có lệnh nào làm được yêu cầu thì trả {"action":"none","say":"một câu ngắn nói rõ chưa làm được gì"}. Không chỉ tên menu hay nút của phần mềm (bạn không biết giao diện). Không trả dàn ý hay cả bài.\n' +
    `Bài trình bày hiện tại: ${context}`
  )
}

const isIndexList = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length > 0 && value.every((n) => Number.isInteger(n))

/** Đọc câu trả lời của model → danh sách lệnh hợp lệ về hình dạng (giá trị cụ thể kiểm sau, lúc áp). */
export function parseEditCommands(raw: string): { ops: SlideEditOp[]; errors: string[]; needsData?: boolean; say?: string } {
  const data = parseAiObject(raw) as { action?: unknown; commands?: unknown; reason?: unknown; say?: unknown } | null
  const ops: SlideEditOp[] = []
  const errors: string[] = []
  if (data?.action === 'none' && data.reason === 'need_data') return { ops, errors, needsData: true }
  if (data?.action === 'none' && typeof data.say === 'string' && data.say.trim()) return { ops, errors, say: data.say.trim().slice(0, 400) }
  if (!data || data.action !== 'edit' || !Array.isArray(data.commands)) return { ops, errors }
  // đủ cho "rút gọn cả bài" (mỗi slide một lệnh)
  for (const item of data.commands.slice(0, 60)) {
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
        if (Number.isInteger(c.slide)) ops.push({ op: 'add_image', slide: c.slide as number, description: typeof c.description === 'string' ? c.description.trim().slice(0, 280) : undefined, ...(c.replace === true ? { replace: true } : {}) })
        else errors.push('Chưa tìm được slide để thêm ảnh')
        break
      case 'set_background':
        if (typeof c.color === 'string' && HEX.test(c.color) && slides !== null) ops.push({ op: 'set_background', color: c.color, slides })
        else errors.push('set_background sai màu hoặc danh sách slide')
        break
      case 'edit_element': {
        if (!Number.isInteger(c.slide) || typeof c.id !== 'string' || !c.id) {
          errors.push('edit_element thiếu "slide" hoặc "id"')
          break
        }
        ops.push({
          op: 'edit_element', slide: c.slide as number, id: c.id,
          ...(typeof c.text === 'string' ? { text: c.text.slice(0, 4000) } : {}),
          ...(typeof c.color === 'string' && HEX.test(c.color) ? { color: c.color } : {}),
          ...(typeof c.scale === 'number' && Number.isFinite(c.scale) ? { scale: Math.min(2, Math.max(0.5, c.scale)) } : {}),
          ...(typeof c.bold === 'boolean' ? { bold: c.bold } : {}),
          ...(typeof c.italic === 'boolean' ? { italic: c.italic } : {}),
          ...(c.align === 'left' || c.align === 'center' || c.align === 'right' ? { align: c.align } : {}),
          ...(c.remove === true ? { remove: true } : {}),
        })
        break
      }
      case 'add_chart': {
        const chart = c.chart as NonNullable<SlideElement['chart']> | undefined
        if (typeof c.title === 'string' && c.title.trim() && chart && ['bar', 'line', 'pie'].includes(chart.type) &&
            Array.isArray(chart.data) && chart.data.length >= 2 && chart.data.length <= 12 &&
            chart.data.every(d => d && typeof d.label === 'string' && d.label.trim() && Number.isFinite(d.value) && (chart.type !== 'pie' || d.value >= 0)) &&
            (chart.type !== 'pie' || chart.data.some(d => d.value > 0))) {
          ops.push({
            op: 'add_chart', title: c.title.trim().slice(0, 160), position: Number.isInteger(c.position) ? c.position as number : undefined,
            ...(Number.isInteger(c.after) ? { after: c.after as number } : {}),
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
            ...(Number.isInteger(c.after) ? { after: c.after as number } : {}),
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
      return keepCustomBg(slide, { ...slide, tone: t, background: toneBackground(theme, t), elements: keepAnim(slide, [...elements, ...userAdded]) }, theme.fg)
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
  const composed = Boolean(slide.layout && isLayoutId(slide.layout))
  const { image: _image, image2: _image2, graphic: _graphic, ...content } = contentFromSlide(slide)
  const json = composed ? JSON.stringify(content, (_k, v) => (v === undefined || (Array.isArray(v) && !v.length) ? undefined : v)) : ''
  const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max) + '…' : text)
  // phần tử để edit_element trỏ tới; chữ do bố cục dựng đã có trong JSON nên chỉ ghi id
  const elements = slide.elements.filter((el) => !isDecorElement(el)).flatMap((el) => {
    const owned = composed && isLayoutOwnedId(el.id)
    if (el.type === 'shape' && owned) return []
    if (el.type === 'text') return [owned ? el.id : `${el.id}(chữ ${JSON.stringify(clip(el.text ?? '', 400))})`]
    return [`${el.id}(${el.type === 'image' ? 'ảnh' : el.type === 'table' ? 'bảng' : el.type === 'chart' ? 'biểu đồ' : el.type === 'shape' ? 'hình khối' : el.type})`]
  })
  return `${index + 1}. [${slide.layout ?? 'slide tự do'}] ${clip(json, 2500)}` +
    (elements.length ? ` | phần tử: ${elements.join(', ')}` : '') +
    (slide.notes ? ` | ghi chú: ${JSON.stringify(clip(slide.notes, 200))}` : '')
}

/** Phần tử người dùng tự thêm (không do bố cục dựng) và chưa có bản tương đương trong `next`. */
function userAddedOf(slide: Slide, next: SlideElement[]): SlideElement[] {
  return slide.elements.filter((el) => {
    if (isDecorElement(el) || isLayoutOwnedId(el.id)) return false
    if (next.some((e) => e.id === el.id)) return false
    if (el.type === 'image' && next.some((e) => e.type === 'image' && e.src === el.src)) return false
    if (el.type === 'table' && next.some((e) => e.type === 'table')) return false
    if (el.type === 'graphic' && next.some((e) => e.type === 'graphic' && e.graphicId === el.graphicId)) return false
    return true
  })
}

const GEOMETRY_KEYS = ['x', 'y', 'w', 'h', 'fontSize']
const CONTENT_KEYS = ['text', 'rows', 'chart']

/**
 * Sửa chữ mà giữ nguyên bố cục: so ba bản (bố cục dựng từ nội dung cũ, từ nội dung mới, slide đang có) để chỉ đổi
 * đúng chỗ nội dung đổi. Người dùng đã chỉnh vị trí / màu / cỡ hay thêm phần tử thì giữ nguyên. Số khối đổi
 * (thêm bớt ý) thì vị trí, kích thước theo bố cục mới. null = slide không còn khớp bố cục, phải dựng lại.
 */
function mergeContent(slide: Slide, base: SlideElement[], fresh: SlideElement[]): SlideElement[] | null {
  const before = new Map(base.map((el) => [el.id, el]))
  const after = new Map(fresh.map((el) => [el.id, el]))
  if (!slide.elements.some((el) => before.has(el.id))) return null
  const reflow = base.length !== fresh.length || base.some((el) => !after.has(el.id))
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const kept = slide.elements.flatMap((el) => {
    const was = before.get(el.id)
    const now = after.get(el.id)
    if (!now) return was ? [] : [el]
    if (!was) return [el]
    const merged = { ...el } as unknown as Record<string, unknown>
    const a = was as unknown as Record<string, unknown>
    const b = now as unknown as Record<string, unknown>
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const forced = reflow && GEOMETRY_KEYS.includes(key)
      if (!forced && same(a[key], b[key])) continue
      if (forced || CONTENT_KEYS.includes(key) || same(merged[key], a[key])) merged[key] = b[key]
    }
    return [merged as unknown as SlideElement]
  })
  const added = fresh.filter((el) => !before.has(el.id) && !slide.elements.some((e) => e.id === el.id))
  return [...kept, ...added]
}

/** Lỗi đã có sẵn ở field người dùng không đụng tới (tự gõ dài, nhập từ file) thì không chặn lệnh sửa. */
function newErrors(errors: string[], baseline: string[], patched: string[]): string[] {
  const shape = (e: string) => e.replace(/\d+/g, '#')
  const total = (list: string[]) => Number(list.find((e) => e.startsWith('quá nhiều chữ'))?.match(/\d+/)?.[0] ?? 0)
  return errors.filter((error) => {
    if (error.startsWith('quá nhiều chữ')) return !total(baseline) || total(errors) > total(baseline)
    const field = error.match(/"([a-zA-Z]+)"/)?.[1]
    return !baseline.some((b) => shape(b) === shape(error)) || (!!field && patched.includes(field))
  })
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
  images: Array<{ slideId: string; description?: string; replace?: boolean }>
  /** lỗi nội dung (quá dài, thiếu field) của lệnh bị bỏ — để xin model viết lại */
  rejected: string[]
}

/** Áp lần lượt các lệnh lên deck (thuần, không đụng deck gốc). Lệnh lỗi bị bỏ, lệnh còn lại vẫn chạy. */
export function applyEdits(deck: Deck, ops: SlideEditOp[]): EditResult {
  let next = deck
  const summary: string[] = []
  const images: EditResult['images'] = []
  const rejected: string[] = []
  const html = deck.format === 'html'
  const restyle = (theme: DeckTheme, label: string) => {
    next = { ...next, theme, slides: next.slides.map((s) => recomposeSlide(theme, s)) }
    summary.push(label)
  }

  // số slide trong mọi lệnh là số của bài TRƯỚC khi áp: đổi ra id để thêm / xoá giữa chừng không làm lệch
  const ids = deck.slides.map((s) => s.id)
  const slideAt = (n: number): Slide | undefined =>
    n >= 1 && n <= ids.length ? next.slides.find((s) => s.id === ids[n - 1]) : next.slides[n - 1]
  const indexesOf = (slides: number[] | undefined): number[] =>
    slides ? slides.flatMap((n) => { const s = slideAt(n); return s ? [next.slides.indexOf(s)] : [] }) : next.slides.map((_, i) => i)
  /** slide cuối cùng đã chèn sau mỗi mốc `after`, để nhiều slide mới đứng đúng thứ tự */
  const lastAfter = new Map<number, string>()
  const insertSlide = (slide: Slide, after: number | undefined, position: number | undefined): number => {
    let at = Math.min(Math.max((position ?? next.slides.length + 1) - 1, 0), next.slides.length)
    if (after !== undefined) {
      const anchor = lastAfter.get(after) ?? (after >= 1 ? slideAt(after)?.id : undefined)
      at = after <= 0 && !anchor ? 0 : anchor ? next.slides.findIndex((s) => s.id === anchor) + 1 : next.slides.length
      lastAfter.set(after, slide.id)
    }
    const slides = [...next.slides]
    slides.splice(at, 0, slide)
    next = { ...next, slides }
    return at
  }
  const replaceSlide = (old: Slide, updated: Slide) => {
    next = { ...next, slides: next.slides.map((s) => (s === old ? updated : s)) }
  }
  const editable = (fields: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(fields).filter(([k]) => (EDITABLE_FIELDS as readonly string[]).includes(k)))
  // tách slide mà phần mới không tạo được thì không cắt slide gốc, kẻo mất nội dung
  const splitFailed = new Set(ops.flatMap((op) =>
    op.op === 'add_slide' && op.after !== undefined && isLayoutId(op.layout) && checkEditContent(editable(op.fields), op.layout).errors.length ? [op.after] : []))

  for (const op of ops) {
    if ((op.op === 'edit_slide' || op.op === 'set_layout') && splitFailed.has(op.slide)) {
      summary.push(`Giữ nguyên slide ${op.slide} vì phần tách ra chưa tạo được.`)
      continue
    }
    if (html && ['set_theme', 'set_fonts', 'set_colors', 'set_tone', 'set_background', 'apply_design'].includes(op.op)) {
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
        const idx = indexesOf(op.slides)
        next = { ...next, slides: next.slides.map((s, i) => (idx.includes(i) ? recomposeSlide(theme, s, op.tone) : s)) }
        summary.push(`Đổi tông nền ${idx.length} slide.`)
        break
      }
      case 'set_transition': {
        const idx = indexesOf(op.slides)
        next = { ...next, slides: next.slides.map((s, i) => (idx.includes(i) ? { ...s, transition: op.transition } : s)) }
        summary.push(`Đặt hiệu ứng chuyển slide cho ${idx.length} slide.`)
        break
      }
      case 'delete_slides': {
        const idx = indexesOf(op.slides)
        if (!idx.length) summary.push('Bỏ qua: không có slide nào khớp số thứ tự.')
        else if (idx.length >= next.slides.length) summary.push('Bỏ qua: không xoá hết mọi slide.')
        else {
          next = { ...next, slides: next.slides.filter((_, i) => !idx.includes(i)) }
          summary.push(`Xoá slide ${op.slides.join(', ')}.`)
        }
        break
      }
      case 'set_background': {
        const idx = indexesOf(op.slides)
        if (!idx.length) {
          summary.push('Bỏ qua: không có slide nào khớp số thứ tự.')
          break
        }
        next = { ...next, slides: next.slides.map((s, i) => (idx.includes(i) && !s.html ? { ...withBackground(s, op.color, theme.fg), bgImage: undefined } : s)) }
        summary.push(op.slides ? `Đổi nền slide ${op.slides.join(', ')}.` : 'Đổi nền cả bài.')
        break
      }
      case 'edit_element': {
        const slide = slideAt(op.slide)
        const hit = (el: SlideElement) => (op.id === '*' ? el.type === 'text' && !isDecorElement(el) : el.id === op.id)
        if (!slide || slide.html || !slide.elements.some(hit)) {
          summary.push(`Mình chưa tìm được phần cần sửa ở slide ${op.slide}.`)
          break
        }
        const elements = op.remove
          ? slide.elements.filter((el) => !hit(el) || el.locked)
          : slide.elements.map((el) => !hit(el) || el.locked ? el : {
              ...el,
              ...(op.text !== undefined && op.id !== '*' && el.type === 'text' ? { text: op.text } : {}),
              ...(op.color ? { textColor: op.color, textGradient: undefined } : {}),
              ...(op.scale ? { fontSize: Math.round((el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)) * op.scale * 100) / 100 } : {}),
              ...(op.bold !== undefined ? { fontWeight: op.bold ? 700 : 400 } : {}),
              ...(op.italic !== undefined ? { fontStyle: op.italic ? 'italic' as const : 'normal' as const } : {}),
              ...(op.align ? { align: op.align } : {}),
            })
        if (JSON.stringify(elements) === JSON.stringify(slide.elements)) {
          summary.push(`Phần đó ở slide ${op.slide} đang khoá hoặc đã đúng như yêu cầu.`)
          break
        }
        replaceSlide(slide, { ...slide, elements })
        summary.push(op.remove ? `Đã xoá phần được chọn ở slide ${op.slide}.` : `Đã sửa slide ${op.slide}.`)
        break
      }
      case 'edit_slide': {
        const slide = slideAt(op.slide)
        if (!slide) {
          summary.push(`Bỏ qua: không có slide ${op.slide}.`)
          break
        }
        if (slide.html || !slide.layout || !isLayoutId(slide.layout)) {
          summary.push(`Bỏ qua: slide ${op.slide} không sửa nội dung được bằng lệnh.`)
          break
        }
        const patch = editable(op.fields)
        if (!Object.keys(patch).length) {
          summary.push(`Bỏ qua: slide ${op.slide} không có field hợp lệ để sửa.`)
          break
        }
        const current: SlideLayoutContent = { ...contentFromSlide(slide), decorKit: slide.decorKit }
        const { image: _i, image2: _i2, imageCrop: _c, image2Crop: _c2, graphic: _g, decorKit: _d, ...text } = current
        // checkSlide chuẩn hoá (cắt độ dài, giới hạn đậm, NBSP…) và báo field bắt buộc/ngân sách bị vi phạm
        const check = checkEditContent(patch, slide.layout, slide.tone, text)
        const errors = newErrors(check.errors, checkSlide(text, slide.layout, slide.tone).errors, Object.keys(patch))
        if (errors.length) {
          summary.push(editFailure(`sửa slide ${op.slide}`, check.page.layout, errors))
          rejected.push(`slide ${op.slide}: ${errors.join(', ')}`)
          break
        }
        // chỉ lấy bản chuẩn hoá của field được sửa, field khác giữ nguyên văn
        const page = check.page as unknown as Record<string, unknown>
        const content = { ...current, ...Object.fromEntries(Object.keys(patch).map((k) => [k, page[k]])) } as SlideLayoutContent
        const layout = check.page.layout
        const converted = layout !== slide.layout
        const tone = slide.tone ?? defaultTone(layout)
        const fresh = composeLayout(theme, layout, content, tone)
        if (!fresh.length) {
          summary.push(`Mình chưa sửa được slide ${op.slide}.`)
          break
        }
        const merged = converted ? null : mergeContent(slide, composeLayout(theme, layout, current, tone), fresh)
        let updated: Slide
        if (merged) updated = { ...slide, elements: merged }
        else {
          const built: Slide = { ...slide, layout, tone, background: toneBackground(theme, tone), elements: fresh }
          const skinned = next.design ? applySkin(built, next.design, theme, next.slides.indexOf(slide), next.slides.length, true) : built
          updated = keepCustomBg(slide, { ...skinned, elements: [...skinned.elements, ...userAddedOf(slide, skinned.elements)] }, theme.fg)
        }
        replaceSlide(slide, { ...updated, elements: keepAnim(slide, updated.elements) })
        const fields = Object.keys(patch).map((k) => fieldLabel(k, layout)).join(', ')
        const message = converted ? `Mình đã chuyển slide ${op.slide} sang bố cục thẻ.` : `Mình đã cập nhật ${fields} ở slide ${op.slide}.`
        summary.push(message + (checkSlide(content, layout, tone).readability.length ? ' Chữ có thể hơi nhỏ.' : ''))
        break
      }
      case 'set_layout': {
        const slide = slideAt(op.slide)
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
        const fields = editable(op.fields ?? {})
        // chỉ đổi bố cục mà không viết hai bên thì máy chia đôi danh sách: so sánh vô nghĩa
        if (op.layout === 'comparison' && slide.layout !== 'comparison' && !(Array.isArray(fields.left) && Array.isArray(fields.right))) {
          summary.push(`Mình chưa đủ nội dung để đổi slide ${op.slide} sang dạng ${layoutName}.`)
          rejected.push(`slide ${op.slide}: bố cục so sánh phải kèm fields title, leftTitle, rightTitle, left, right`)
          break
        }
        const check = op.fields ? checkSlide({ ...base, ...fields }, op.layout, tone) : undefined
        const elements = check
          ? check.errors.length ? [] : composeLayout(theme, op.layout, { ...check.page, image: current.image, image2: current.image2, imageCrop: current.imageCrop, image2Crop: current.image2Crop }, tone)
          : composeLayout(theme, op.layout, base, tone)
        if (check?.errors.length) {
          summary.push(editFailure(`đổi slide ${op.slide}`, op.layout, check.errors))
          rejected.push(`slide ${op.slide}: ${check.errors.join(', ')}`)
          break
        }
        if (!elements.length) {
          summary.push(`Mình chưa đủ nội dung để đổi slide ${op.slide} sang dạng ${layoutName}.`)
          break
        }
        const rawUpdated: Slide = keepCustomBg(slide, { ...slide, layout: op.layout, tone, background: toneBackground(theme, tone), elements }, theme.fg)
        const skinned = next.design ? applySkin(rawUpdated, next.design, theme, next.slides.indexOf(slide), next.slides.length, true) : rawUpdated
        const laidOut = [...skinned.elements, ...userAddedOf(slide, skinned.elements)]
        // đang để cả trang tự chạy thì bố cục mới không kéo theo hiệu ứng bấm
        replaceSlide(slide, slide.pageAnim ? setPageAnim({ ...skinned, elements: laidOut }, slide.pageAnim.anim, 'auto', slide.pageAnim.ms) : { ...skinned, elements: laidOut })
        summary.push(`Mình đã đổi slide ${op.slide} sang dạng ${layoutName}.`)
        break
      }
      case 'add_image': {
        const slide = slideAt(op.slide)
        if (slide && !slide.html) images.push({ slideId: slide.id, description: op.description, ...(op.replace ? { replace: true } : {}) })
        else summary.push(`Mình chưa tìm được slide ${op.slide} để thêm ảnh.`)
        break
      }
      case 'add_chart': {
        const slide = slideFromAi({ title: op.title }, theme)
        slide.elements.push({ id: `${slide.id}-chart`, type: 'chart', x: 8, y: 28, w: 84, h: 65, chart: op.chart })
        const at = insertSlide(slide, op.after, op.position)
        summary.push(`Mình đã thêm biểu đồ ở slide ${at + 1}.`)
        break
      }
      case 'add_slide': {
        if (!isLayoutId(op.layout)) {
          summary.push('Mình chưa tìm được bố cục phù hợp cho slide mới.')
          break
        }
        const check = checkEditContent(editable(op.fields), op.layout)
        if (check.errors.length) {
          summary.push(editFailure('thêm slide', check.page.layout, check.errors))
          rejected.push(`slide mới (${op.layout}): ${check.errors.join(', ')}`)
          break
        }
        // cùng bộ trang trí với slide đứng trước
        const neighbor = (op.after ? slideAt(op.after) : undefined) ?? next.slides[next.slides.length - 1]
        const built = slideFromAi({ ...check.page, ...(neighbor?.decorKit ? { decorKit: neighbor.decorKit } : {}) }, theme)
        const at = insertSlide(built, op.after, op.position)
        if (next.design) replaceSlide(built, applySkin(built, next.design, theme, at, next.slides.length, true))
        summary.push(`Mình đã thêm slide ở vị trí ${at + 1}.`)
        break
      }
      case 'duplicate_slide': {
        const slide = slideAt(op.slide)
        const at = slide ? next.slides.indexOf(slide) : -1
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
        const slide = slideAt(op.slide)
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
        const source = slideAt(op.from)
        if (!source || op.to < 1 || op.to > n) {
          summary.push('Bỏ qua: số thứ tự slide không hợp lệ.')
          break
        }
        const slides = [...next.slides]
        const [moved] = slides.splice(next.slides.indexOf(source), 1)
        slides.splice(op.to - 1, 0, moved)
        next = { ...next, slides }
        summary.push(`Chuyển slide ${op.from} tới vị trí ${op.to}.`)
        break
      }
    }
  }
  return { deck: next, summary, changed: next !== deck, images, rejected }
}
