/**
 * Hợp đồng sinh **một** slide (chặng 26b).
 *
 * Mỗi slide được gọi riêng với prompt ngắn (layout của dàn ý + brief + style),
 * rồi chuẩn hoá/kiểm tra trước khi dựng bằng layout engine. Sai field bắt buộc
 * thì sửa đúng một lần; vẫn sai thì bỏ slide thay vì chèn nội dung rác.
 */
import type { AiSlidePayload } from './aiDeck'
import type { DeckPlan, DeckPlanSlide } from './aiDeck'
import type { Deck, DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import { normalizeTheme, themeById, type ResolvedTheme } from './slideTheme'
import { stylePackById } from './slideStyles'
import { subjectById, subjectRulesBlock } from './slideSubjects'
import { fixMathEscapes, mathToPlain } from './slideMath'
import { graphicCatalogText, isGraphicId } from './slideGraphics'
import {
  composeLayout,
  contentFromSlide,
  fitRatio,
  defaultTone,
  isLayoutId,
  isTone,
  resolveAnswer,
  SLIDE_LAYOUTS,
  toneBackground,
  type SlideLayoutContent,
  type SlideLayoutId,
} from './slideLayouts'

const clean = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = fixMathEscapes(value.trim()).slice(0, max)
  return trimmed || undefined
}

const cleanList = (value: unknown, maxItems: number, maxLen: number): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const items = value
    .map((item) => clean(item, maxLen))
    .filter((item): item is string => !!item)
    .slice(0, maxItems)
  return items.length ? items : undefined
}

export interface SlideCheck {
  page: AiSlidePayload
  /** lỗi cứng: thiếu field/vượt ngân sách — slide không dùng được */
  errors: string[]
  /** lỗi mềm: dựng thử layout thấy chữ bị co nhỏ — nên rút ngắn, nhưng vẫn dùng được */
  readability: string[]
}

/**
 * Chuẩn hoá phản hồi AI thành shape của `AiSlidePayload`: layout do dàn ý quyết
 * định (AI không được đổi), mọi field cắt theo giới hạn layout chịu được.
 */
export function sanitizeSlide(raw: unknown, layout: string, tone?: SlideTone): AiSlidePayload {
  const id = isLayoutId(layout) ? layout : 'bullets'
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const aiTone = isTone(source.tone) ? source.tone : undefined
  const title = clean(source.title, 160)
  const kicker = clean(source.kicker, 80)
  const subtitle = clean(source.subtitle, 240)
  const body = clean(source.body, 1200)
  const bullets = cleanList(source.bullets, 6, 220)
  const items = cleanList(source.items, 6, 220)
  const left = cleanList(source.left, 5, 180)
  const right = cleanList(source.right, 5, 180)
  const leftTitle = clean(source.leftTitle, 30)
  const rightTitle = clean(source.rightTitle, 30)
  const quote = clean(source.quote, 300)
  const author = clean(source.author, 80)
  const image = clean(source.image, 2000)
  const graphic = isGraphicId(source.graphic) ? source.graphic : undefined
  const steps = cleanList(source.steps, 6, 160)
  const question = clean(source.question, 300)
  const options = cleanList(source.options, 4, 120)
  const notes = cleanList(source.notes, 6, 300)
  const problem = clean(source.problem, 240)
  const conclusion = clean(source.conclusion, 140)
  const explanation = clean(source.explanation, 240)

  const rows = Array.isArray(source.rows)
    ? source.rows
        .filter((row): row is unknown[] => Array.isArray(row))
        .slice(0, 8)
        .map((row) => row.slice(0, 6).map((cell) => clean(cell, 80) ?? ''))
    : undefined

  const stats = Array.isArray(source.stats)
    ? source.stats
        .map((item) => {
          const entry = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
          return { value: clean(entry.value, 24), label: clean(entry.label, 80) }
        })
        .filter((item) => !!item.value)
        .slice(0, 4)
    : undefined

  const answer =
    typeof source.answer === 'number' ? source.answer : clean(source.answer, 120)

  return {
    layout: id,
    ...((tone ?? aiTone) ? { tone: tone ?? aiTone } : {}),
    ...(title ? { title } : {}),
    ...(kicker ? { kicker } : {}),
    ...(subtitle ? { subtitle } : {}),
    ...(body ? { body } : {}),
    ...(bullets ? { bullets } : {}),
    ...(items ? { items } : {}),
    ...(left ? { left } : {}),
    ...(right ? { right } : {}),
    ...(leftTitle ? { leftTitle } : {}),
    ...(rightTitle ? { rightTitle } : {}),
    ...(quote ? { quote } : {}),
    ...(author ? { author } : {}),
    ...(rows?.length ? { rows } : {}),
    ...(image ? { image } : {}),
    ...(graphic ? { graphic } : {}),
    ...(stats?.length ? { stats } : {}),
    ...(steps ? { steps } : {}),
    ...(question ? { question } : {}),
    ...(options ? { options } : {}),
    ...(answer !== undefined ? { answer } : {}),
    ...(problem ? { problem } : {}),
    ...(conclusion ? { conclusion } : {}),
    ...(explanation ? { explanation } : {}),
    ...(notes ? { notes } : {}),
  }
}

const count = (list?: string[]) => list?.filter((item) => item.trim()).length ?? 0

/* ------------------------------------------------------------------ *
 * Ngân sách chữ — slide thuyết trình phải ít chữ, không để FitText thu nhỏ
 * ------------------------------------------------------------------ */
interface Budget {
  /** tổng ký tự của các field layout dùng */
  total: number
  fields?: Partial<
    Record<
      | 'title' | 'kicker' | 'subtitle' | 'body' | 'quote' | 'author' | 'question' | 'leftTitle' | 'rightTitle'
      | 'problem' | 'conclusion' | 'explanation',
      number
    >
  >
  lists?: Array<{
    field: 'bullets' | 'items' | 'left' | 'right' | 'steps' | 'options'
    max: number
    itemMax: number
  }>
  table?: { rows: number; cell: number }
  stats?: { label: number }
}

const BUDGETS: Record<SlideLayoutId, Budget> = {
  title: { total: 260, fields: { title: 80, kicker: 50, subtitle: 110 } },
  section: { total: 220, fields: { title: 60, kicker: 50, subtitle: 100 } },
  statement: { total: 220, fields: { body: 160, kicker: 50, author: 50 } },
  bullets: {
    total: 460,
    fields: { title: 80, kicker: 50 },
    lists: [{ field: 'bullets', max: 4, itemMax: 110 }],
  },
  cards: {
    total: 460,
    fields: { title: 80, kicker: 50 },
    lists: [{ field: 'items', max: 4, itemMax: 100 }],
  },
  'two-column': {
    total: 660,
    fields: { title: 80 },
    lists: [
      { field: 'left', max: 3, itemMax: 100 },
      { field: 'right', max: 3, itemMax: 100 },
    ],
  },
  comparison: {
    total: 660,
    fields: { title: 80, leftTitle: 30, rightTitle: 30 },
    lists: [
      { field: 'left', max: 3, itemMax: 70 },
      { field: 'right', max: 3, itemMax: 70 },
    ],
  },
  quote: { total: 220, fields: { quote: 160, author: 50 } },
  closing: { total: 260, fields: { title: 80, subtitle: 110 } },
  agenda: {
    total: 420,
    fields: { title: 80, kicker: 50 },
    lists: [{ field: 'items', max: 5, itemMax: 60 }],
  },
  table: { total: 500, fields: { title: 80 }, table: { rows: 6, cell: 40 } },
  'image-left': {
    total: 380,
    fields: { title: 80 },
    lists: [{ field: 'bullets', max: 4, itemMax: 90 }],
  },
  'image-right': {
    total: 380,
    fields: { title: 80 },
    lists: [{ field: 'bullets', max: 4, itemMax: 90 }],
  },
  'image-full': { total: 260, fields: { title: 80, body: 120 } },
  stats: { total: 380, fields: { title: 80 }, stats: { label: 45 } },
  'stat-image': { total: 420, fields: { title: 80 }, stats: { label: 45 } },
  timeline: {
    total: 420,
    fields: { title: 80 },
    lists: [{ field: 'steps', max: 5, itemMax: 60 }],
  },
  cycle: {
    // chữ nằm trong vòng tròn nên mỗi bước phải ngắn
    total: 260,
    fields: { title: 80 },
    lists: [{ field: 'steps', max: 5, itemMax: 36 }],
  },
  quiz: {
    total: 520,
    fields: { question: 140, kicker: 50, explanation: 150 },
    lists: [{ field: 'options', max: 4, itemMax: 60 }],
  },
  example: {
    total: 520,
    fields: { title: 80, problem: 170, conclusion: 90 },
    lists: [{ field: 'steps', max: 4, itemMax: 70 }],
  },
  hook: {
    total: 280,
    fields: { title: 80, kicker: 50, body: 150 },
    lists: [{ field: 'items', max: 3, itemMax: 30 }],
  },
}

const DEFAULT_BUDGET: Budget = { total: 420 }
const budgetOf = (id: SlideLayoutId) => BUDGETS[id] ?? DEFAULT_BUDGET

/** Tổng ký tự của đúng các field layout dùng (không cộng field thừa AI trả về). */
function totalChars(page: AiSlidePayload, fields: Array<keyof SlideLayoutContent>): number {
  return fields.reduce((sum, field) => {
    if (field === 'rows') return sum + (page.rows ?? []).flat().join('').length
    if (field === 'stats') {
      return (
        sum +
        (page.stats ?? []).reduce(
          (n, stat) => n + (stat.value?.length ?? 0) + (stat.label?.length ?? 0),
          0,
        )
      )
    }
    const value = page[field]
    if (Array.isArray(value)) return sum + value.join('').length
    return sum + (typeof value === 'string' ? value.length : 0)
  }, 0)
}

function budgetErrors(page: AiSlidePayload, id: SlideLayoutId): string[] {
  const spec = budgetOf(id)
  const def = SLIDE_LAYOUTS.find((layout) => layout.id === id)
  const errors: string[] = []
  const total = def ? totalChars(page, def.fields) : 0
  if (total > spec.total) {
    errors.push(`quá nhiều chữ (${total}/${spec.total} ký tự) — rút còn ý chính`)
  }
  for (const [field, max] of Object.entries(spec.fields ?? {})) {
    const value = page[field as keyof AiSlidePayload]
    if (typeof value === 'string' && value.length > max!) {
      errors.push(`"${field}" dài ${value.length} ký tự (tối đa ${max})`)
    }
  }
  for (const list of spec.lists ?? []) {
    const items = page[list.field]
    if (!items?.length) continue
    if (items.length > list.max) {
      errors.push(`"${list.field}" có ${items.length} mục (tối đa ${list.max})`)
    }
    const long = items.find((item) => item.length > list.itemMax)
    if (long) {
      errors.push(`"${list.field}" có mục dài ${long.length} ký tự (tối đa ${list.itemMax})`)
    }
  }
  if (spec.table) {
    const rows = page.rows ?? []
    if (rows.length > spec.table.rows) {
      errors.push(`bảng có ${rows.length} hàng (tối đa ${spec.table.rows} hàng)`)
    }
    const long = rows.flat().find((cell) => cell.length > spec.table!.cell)
    if (long) {
      errors.push(`ô bảng dài ${long.length} ký tự (tối đa ${spec.table.cell})`)
    }
  }
  if (spec.stats) {
    for (const stat of page.stats ?? []) {
      if ((stat.label?.length ?? 0) > spec.stats.label) {
        errors.push(`nhãn số liệu dài ${stat.label!.length} ký tự (tối đa ${spec.stats.label})`)
      }
    }
  }
  return errors
}

/** Lỗi theo layout — dùng cho cả quyết định repair và prompt sửa. */
export function validateSlide(page: AiSlidePayload, layout: string): string[] {
  const id = isLayoutId(layout) ? layout : isLayoutId(page.layout) ? page.layout : 'bullets'
  const errors: string[] = []
  const need = (ok: boolean, message: string) => {
    if (!ok) errors.push(message)
  }

  switch (id) {
    case 'title':
    case 'section':
    case 'closing':
      need(!!page.title, 'thiếu "title"')
      break
    case 'statement':
      need(!!page.body, 'thiếu "body" (một câu/ý lớn)')
      break
    case 'bullets':
      need(count(page.bullets) >= 1, '"bullets" cần ít nhất 1 ý (nên 2–4)')
      break
    case 'cards':
      need(count(page.items) >= 2, '"items" cần 2–5 thẻ')
      break
    case 'two-column':
      need(count(page.left) + count(page.right) >= 2, 'cần ít nhất 2 ý ở "left"/"right"')
      break
    case 'comparison':
      need(count(page.left) >= 1 && count(page.right) >= 1, 'so sánh cần ý ở cả hai bên')
      need(!!page.leftTitle && !!page.rightTitle, 'thiếu nhãn "leftTitle"/"rightTitle"')
      break
    case 'quote':
      need(!!page.quote, 'thiếu "quote"')
      break
    case 'example':
      need(!!page.problem, 'thiếu "problem" (đề bài)')
      need(count(page.steps) >= 2, '"steps" cần 2–4 bước giải')
      need(!!page.conclusion, 'thiếu "conclusion" (kết luận)')
      break
    case 'hook':
      need(!!page.body, 'thiếu "body" (câu hỏi/tình huống mở bài)')
      break
    case 'agenda':
      need(count(page.items) >= 3, '"items" cần ít nhất 3 mục')
      break
    case 'table': {
      const rows = page.rows ?? []
      const cols = rows.reduce((max, row) => Math.max(max, row.length), 0)
      need(rows.length >= 2 && cols >= 2, '"rows" cần ít nhất 2 hàng × 2 cột')
      break
    }
    case 'image-left':
    case 'image-right':
      need(!!page.title, 'thiếu "title"')
      break
    case 'image-full':
      need(!!page.title, 'thiếu "title"')
      break
    case 'stats':
      need(
        (page.stats ?? []).some((stat) => !!stat.value),
        '"stats" cần ít nhất 1 mục có "value"',
      )
      break
    case 'stat-image':
      need(
        (page.stats ?? []).filter((stat) => !!stat.value).length >= 1,
        '"stats" cần ít nhất 1 mục có "value"',
      )
      break
    case 'timeline':
    case 'cycle':
      need(count(page.steps) >= 2, '"steps" cần 2–5 bước')
      break
    case 'quiz': {
      need(!!page.question, 'thiếu "question"')
      const options = page.options ?? []
      need(options.length >= 2, '"options" cần 2–4 phương án')
      const index = resolveAnswer(page.answer, options)
      need(
        index >= 0 && index < options.length,
        '"answer" phải là chỉ số 0-based của một phương án',
      )
      break
    }
  }
  // Ngân sách tính theo chữ hiển thị: `$\frac{a}{b}$` đếm như "a/b", không đếm mã LaTeX.
  const plain = JSON.parse(JSON.stringify(page), (_key, value) =>
    typeof value === 'string' ? mathToPlain(value) : value,
  ) as AiSlidePayload
  return [...errors, ...budgetErrors(plain, id)]
}

/* ------------------------------------------------------------------ *
 * Prompt từng slide
 * ------------------------------------------------------------------ */

const FIELD_HINTS: Record<keyof SlideLayoutContent, string> = {
  title: '"title" — tiêu đề slide (chuỗi ≤ 80 ký tự, ≤ 10 từ)',
  kicker: '"kicker" — nhãn nhỏ phía trên (chuỗi ≤ 50)',
  subtitle: '"subtitle" — dòng phụ (chuỗi ≤ 110)',
  body: '"body" — một câu/đoạn ngắn (≤ 160 ký tự)',
  bullets: '"bullets" — mảng 2–4 ý, mỗi ý ≤ 110 ký tự',
  items: '"items" — mảng 2–4 mục, mỗi mục ≤ 100 ký tự',
  left: '"left" — mảng 2–3 ý cột trái, mỗi ý ≤ 100',
  right: '"right" — mảng 2–3 ý cột phải, mỗi ý ≤ 100',
  leftTitle: '"leftTitle" — nhãn bên trái (≤ 30 ký tự)',
  rightTitle: '"rightTitle" — nhãn bên phải (≤ 30 ký tự)',
  quote: '"quote" — câu trích (chuỗi ≤ 160)',
  author: '"author" — tên tác giả/nhân vật (chuỗi ≤ 50)',
  rows: '"rows" — mảng hàng, mỗi hàng là mảng chuỗi; 2–6 hàng × 2–6 cột, ô ≤ 40 ký tự',
  image: '"image" — để trống (người dùng tự chọn ảnh)',
  graphic: '"graphic" — id đồ hoạ vector có sẵn (tuỳ chọn; xem catalog)',
  stats: '"stats" — mảng 1–2 mục {"value","label"}, nhãn ≤ 45',
  steps: '"steps" — mảng 3–5 bước, mỗi bước ≤ 60 ký tự',
  question: '"question" — câu hỏi (chuỗi ≤ 140)',
  options: '"options" — mảng 2–4 phương án, mỗi phương án ≤ 60',
  answer: '"answer" — chỉ số 0-based của phương án đúng trong "options"',
  problem: '"problem" — đề bài/yêu cầu của ví dụ (chuỗi ≤ 170)',
  conclusion: '"conclusion" — kết luận/đáp số một dòng (≤ 90)',
  explanation: '"explanation" — giải thích ngắn vì sao đáp án đúng (≤ 150)',
}

/** Lưu ý riêng của từng layout, chèn sau danh sách field. */
const LAYOUT_NOTES: Partial<Record<SlideLayoutId, string>> = {
  example:
    '- Ví dụ mẫu: "steps" 2–4 bước giải, mỗi bước một phép biến đổi/ý có số liệu cụ thể; "conclusion" nêu kết quả cuối. Lời giải phải ĐÚNG, tự kiểm tra lại phép tính.\n',
  hook:
    '- Mở bài: "body" là câu hỏi/tình huống gần gũi kết thúc bằng câu hỏi; "items" là 2–3 gợi ý ngắn (≤ 30 ký tự) dẫn học sinh tới bài mới.\n',
  quiz:
    '- Quiz: chỉ MỘT đáp án đúng chắc chắn; "explanation" nêu lý do ngắn gọn (kể cả vì sao các phương án khác sai khi cần).\n',
}

const LIST_LABEL: Record<'bullets' | 'items' | 'left' | 'right' | 'steps' | 'options', string> = {
  bullets: 'số ý',
  items: 'số mục',
  left: 'số ý cột trái',
  right: 'số ý cột phải',
  steps: 'số bước',
  options: 'số phương án',
}

/** Một dòng ngân sách chữ, sinh từ đúng BUDGETS để prompt không lệch validate. */
function budgetLine(id: SlideLayoutId): string {
  const spec = budgetOf(id)
  const parts = [`tổng ≤ ${spec.total} ký tự`]
  for (const list of spec.lists ?? []) {
    parts.push(`${LIST_LABEL[list.field]} ≤ ${list.max}, mỗi mục ≤ ${list.itemMax} ký tự`)
  }
  if (spec.table) parts.push(`bảng ≤ ${spec.table.rows} hàng, mỗi ô ≤ ${spec.table.cell} ký tự`)
  if (spec.stats) parts.push(`nhãn số liệu ≤ ${spec.stats.label} ký tự`)
  parts.push('tiêu đề ≤ 80 ký tự')
  return `NGÂN SÁCH CHỮ: ${parts.join('; ')}.`
}

/**
 * System prompt cho một slide. Có đủ layout bắt buộc, field cần điền và dàn ý
 * cả deck (để không lặp ý) nhưng không gửi catalog 14 layout.
 */
export function pageSystemPrompt(
  plan: DeckPlan,
  slide: DeckPlanSlide,
  index: number,
): string {
  const layout = SLIDE_LAYOUTS.find((item) => item.id === slide.layout) ?? SLIDE_LAYOUTS[2]
  const fields = layout.fields.map((field) => `- ${FIELD_HINTS[field]}`).join('\n')
  const outline = plan.slides
    .map(
      (item, i) =>
        `${i + 1}. [${item.layout}] ${item.title}${item.brief ? ` — ${item.brief}` : ''}`,
    )
    .join('\n')
  const pack = stylePackById(plan.stylePack)
  const packBlock = pack
    ? 'ART DIRECTION (style pack):\n' +
      pack.rules.map((rule) => `- ${rule}`).join('\n') +
      '\nTRÁNH: ' +
      pack.avoid.join('; ') +
      '.\n\n'
    : ''
  // Chỉ những layout đang dùng đồ hoạ; không nhồi catalog 112 mục vào mọi lượt gọi.
  const supportsGraphic =
    layout.id === 'title' ||
    layout.id === 'bullets' ||
    layout.id === 'image-left' ||
    layout.id === 'image-right'
  const isImageLayout = layout.id === 'image-left' || layout.id === 'image-right'
  const graphicBlock = supportsGraphic
    ? '\n\nĐỒ HOẠ CÓ SẴN — chọn MỘT id khớp chủ đề cho field "graphic" ' +
      '(nhanh, đúng màu, không tốn lượt vẽ ảnh; không có id phù hợp thì bỏ trống):\n' +
      graphicCatalogText(subjectById(plan.subject)?.graphicGroups) +
      '\n- "graphic" chỉ dùng id trong danh sách trên; KHÔNG bịa id mới.\n' +
      (isImageLayout
        ? '- Layout ảnh: ĐỂ TRỐNG "image" (app tự vẽ ảnh minh hoạ nền sau 45–90 giây). Có id đồ hoạ phù hợp thì ' +
          'đặt "graphic" để slide có hình ngay trong lúc chờ ảnh.\n'
        : '')
    : ''

  return (
    'Bạn là trợ lý AI của trình soạn bài trình bày tiếng Việt. Viết nội dung cho ĐÚNG MỘT slide. ' +
    'Chỉ trả về DUY NHẤT một JSON hợp lệ, không bọc markdown, không chữ ngoài JSON.\n\n' +
    `LAYOUT BẮT BUỘC: "${layout.id}" (${layout.name}) — ${layout.description}\n` +
    `FIELD CẦN ĐIỀN:\n${fields}\n` +
    '- "notes" — mảng 0–6 chuỗi ghi chú trình bày (tuỳ chọn).\n' +
    (LAYOUT_NOTES[layout.id] ?? '') +
    (supportsGraphic ? '- "graphic" — id đồ hoạ có sẵn (tuỳ chọn).\n' : '') +
    `- "layout" phải đúng "${layout.id}"; không thêm field khác.\n\n` +
    budgetLine(layout.id) +
    graphicBlock +
    '\n\nQUY TẮC NỘI DUNG:\n' +
    '- Viết như slide thuyết trình: MỘT thông điệp chính mỗi slide, mỗi ý là cụm từ cụ thể ' +
    '8–18 từ, không viết câu dài hay đoạn văn.\n' +
    '- Ưu tiên chi tiết có thể nhìn thấy: số liệu, ví dụ, tên riêng, phép tính. Tránh ý chung chung ' +
    'kiểu "quan trọng", "hiệu quả", "đa dạng"; cắt từ nối và giải thích dài.\n' +
    '- Nếu layout có nhãn lớn (số liệu, bước, câu trích), chọn giá trị làm điểm nhấn của slide.\n' +
    '- Bám đúng brief của slide; không lặp ý các slide khác.\n' +
    '- Không bịa số liệu thật; số liệu minh hoạ phải ghi rõ "ví dụ".\n' +
    '- Công thức đơn giản (x², √, ≤, →, π, α) viết bằng ký tự Unicode. Công thức có phân số, căn dài, ' +
    'chỉ số, tích phân hoặc phương trình hoá học viết LaTeX giữa $...$ ' +
    '(vd $\\frac{18}{24}=\\frac{3}{4}$, $\\ce{Zn + CuSO4 -> ZnSO4 + Cu}$). Trong JSON PHẢI viết hai dấu ' +
    'gạch chéo ngược (\\\\frac, \\\\sqrt, \\\\cdot). Chỉ dùng $ cho công thức, không dùng cho tiền.\n\n' +
    'BỐI CẢNH DECK:\n' +
    `- Tiêu đề: ${plan.title ?? '(chưa có)'}\n` +
    `- Đối tượng: ${plan.audience ?? 'học sinh'}\n` +
    `- Phong cách: ${plan.style ?? 'thuyết trình rõ ràng, có điểm nhấn: mỗi slide chốt một thông điệp, ưu tiên số liệu và ví dụ cụ thể'}\n\n` +
    packBlock +
    subjectRulesBlock(plan.subject) +
    `DÀN Ý CẢ DECK (để không lặp ý):\n${outline}\n\n` +
    `SLIDE CẦN VIẾT: ${index + 1}/${plan.slides.length} — ${slide.title}` +
    `${slide.kicker ? ` (nhãn: ${slide.kicker})` : ''}\n` +
    (slide.brief ? `Brief: ${slide.brief}\n` : '')
  )
}

/** Lượt sửa duy nhất: nêu đúng lỗi để model sửa thay vì viết lại mù. */
export function repairPrompt(errors: string[]): string {
  return (
    'JSON vừa trả chưa dùng được: ' +
    errors.join('; ') +
    '. Sửa đúng các lỗi trên, giữ nguyên layout và trả lại DUY NHẤT một JSON hợp lệ.'
  )
}

/** Tiện cho test và nơi cần kiểm tra nhanh một phản hồi thô. */
export function checkSlide(raw: unknown, layout: string, tone?: SlideTone): SlideCheck {
  const page = sanitizeSlide(raw, layout, tone)
  const errors = validateSlide(page, layout)
  return { page, errors, readability: errors.length ? [] : readabilityIssues(page, layout) }
}

/** Cỡ chữ nội dung tối thiểu (cqw) ≈ 24px ở slide 1280px. */
export const READABLE_MIN = 1.9
/** Chữ bị co quá mức này so với cỡ thiết kế thì coi là nhồi quá nhiều chữ. */
const READABLE_SHRINK = 0.78
/** Nhãn/số thứ tự nhỏ theo thiết kế, không tính. */
const SMALL_BY_DESIGN = /kicker|index|mark|author|-title$/

/**
 * Dựng thử slide bằng layout engine (hình học không phụ thuộc theme) và báo hộp
 * chữ nào bị co còn < 78% cỡ thiết kế và < 1,9cqw. Thay cho ngân sách ký tự đoán
 * mò: ngân sách chỉ chặn quá đà, còn đây đo đúng hộp của layout đang dùng.
 */
export function readabilityIssues(page: AiSlidePayload, layout: string): string[] {
  const id = isLayoutId(layout) ? layout : 'bullets'
  const tone = isTone(page.tone) ? page.tone : defaultTone(id)
  const issues: string[] = []
  for (const el of composeLayout(themeById('sang'), id, contentOfPage(page), tone)) {
    if (el.type !== 'text' || !el.text || SMALL_BY_DESIGN.test(el.id)) continue
    const ratio = fitRatio(el)
    if (ratio === undefined || ratio >= READABLE_SHRINK || (el.fontSize ?? 0) >= READABLE_MIN) continue
    const excerpt = el.text.replace(/\s+/g, ' ').slice(0, 36)
    issues.push(`chữ "${excerpt}…" quá dài cho khung, bị co còn ${Math.round(ratio * 100)}% — rút ngắn ý này`)
  }
  return issues.slice(0, 3)
}

/* ------------------------------------------------------------------ *
 * AI → deck: mỗi trang xong được nối ngay, giữ đúng thứ tự dàn ý
 * ------------------------------------------------------------------ */

let seq = 0
const newId = () => `ai-${Date.now().toString(36)}-${(seq++).toString(36)}`

function contentOfPage(page: AiSlidePayload): SlideLayoutContent {
  return {
    title: page.title,
    kicker: page.kicker,
    subtitle: page.subtitle,
    body: page.body,
    bullets: page.bullets,
    items: page.items,
    left: page.left,
    right: page.right,
    leftTitle: page.leftTitle,
    rightTitle: page.rightTitle,
    quote: page.quote,
    author: page.author,
    rows: page.rows,
    image: page.image,
    graphic: page.graphic,
    stats: page.stats,
    steps: page.steps,
    question: page.question,
    options: page.options,
    answer: page.answer,
    problem: page.problem,
    conclusion: page.conclusion,
    explanation: page.explanation,
  }
}

/**
 * Dựng lại slide với ảnh AI (ảnh về sau khi slide đã hiện). Đọc nội dung từ chính
 * các phần tử của slide nên chữ người dùng đã sửa trong lúc chờ ảnh không mất;
 * layout không dựng được thì giữ nguyên slide.
 */
export function withImage(slide: Slide, theme: DeckTheme, image: string): Slide {
  const layout = slide.layout
  if (!layout || !isLayoutId(layout)) return slide
  const elements = composeLayout(theme, layout, { ...contentFromSlide(slide), image }, slide.tone)
  return elements.length ? { ...slide, elements } : slide
}

/** Dựng một slide AI bằng layout engine; layout lạ rơi về title + bullets. */
export function slideFromAi(page: AiSlidePayload, theme: ResolvedTheme): Slide {
  const content = contentOfPage(page)
  const layout = page.layout?.trim()
  const tone = isTone(page.tone) ? page.tone : defaultTone(layout ?? 'bullets')
  const composed =
    layout && isLayoutId(layout) ? composeLayout(theme, layout, content, tone) : []
  if (composed.length > 0) {
    return {
      id: newId(),
      background: toneBackground(theme, tone),
      transition: 'none',
      notes: page.notes?.join('\n') || undefined,
      layout,
      tone,
      elements: composed,
    }
  }

  const bullets = page.bullets ?? []
  const bodyChars = bullets.join(' ').length
  const bodySize = bodyChars > 420 ? 1.9 : bodyChars > 260 ? 2.2 : 2.5
  const elements: SlideElement[] = [
    {
      id: newId(),
      type: 'text',
      x: 8,
      y: 10,
      w: 84,
      h: 16,
      variant: 'title',
      text: page.title,
    },
    ...(bullets.length
      ? [
          {
            id: newId(),
            type: 'text' as const,
            x: 8,
            y: 32,
            w: 84,
            h: 52,
            variant: 'body' as const,
            fontSize: bodySize,
            text: bullets.map((bullet) => `• ${bullet}`).join('\n'),
          },
        ]
      : []),
    ...(page.elements ?? []).map((el) => ({
      id: newId(),
      type: (el.type ?? 'text') as SlideElement['type'],
      x: el.x ?? 8,
      y: el.y ?? 32,
      w: el.w ?? 84,
      h: el.h ?? 24,
      text: el.text,
      shape: el.shape,
      fill: el.fill,
      src: el.src,
      rows: el.rows,
      chart: el.chart,
    })),
  ]
  return {
    id: newId(),
    background: theme.bg,
    transition: 'none',
    notes: page.notes?.join('\n') || undefined,
    elements,
  }
}

/** Slide layout cũ được dựng lại theo theme mới, giữ nội dung + notes. */
function recompose(slides: Slide[], theme: ResolvedTheme): Slide[] {
  return slides.map((slide) => {
    if (slide.layout && isLayoutId(slide.layout)) {
      const tone = isTone(slide.tone) ? slide.tone : defaultTone(slide.layout)
      const elements = composeLayout(theme, slide.layout, contentFromSlide(slide), tone)
      if (elements.length > 0) {
        return { ...slide, tone, background: toneBackground(theme, tone), elements }
      }
    }
    return { ...slide, background: theme.bg }
  })
}

/**
 * Ghép các trang vừa sinh vào bản deck **mới nhất** (không dùng bản của lần
 * render trước). Trang đầu tiên còn áp theme + style của dàn ý cho cả deck;
 * các trang sau chỉ nối thêm. Trả patch để editor ghi vào store.
 */
export function appendSlidesToDeck(
  latest: Deck,
  pages: AiSlidePayload[],
  plan?: DeckPlan,
): { patch: Partial<Deck>; added: Slide[] } {
  if (!pages.length) return { patch: {}, added: [] }
  const currentTheme = normalizeTheme(latest.theme)
  const nextTheme = plan?.theme ? themeById(plan.theme) : currentTheme
  const themeChanged = nextTheme.id !== currentTheme.id
  const added = pages.map((page) => slideFromAi(page, nextTheme))
  return {
    patch: {
      ...(themeChanged ? { theme: nextTheme } : {}),
      ...(plan?.style ? { style: plan.style } : {}),
      slides: [
        ...(themeChanged ? recompose(latest.slides, nextTheme) : latest.slides),
        ...added,
      ],
    },
    added,
  }
}
