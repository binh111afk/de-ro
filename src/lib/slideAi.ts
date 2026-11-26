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
import { isStarterDeck } from './slideStarter'
import { normalizeTheme, themeById, type ResolvedTheme } from './slideTheme'
import { hasTextEffects, sanitizeTextStyle, textEffectsOf } from './slideTextEffects'
import { keepCustomBg } from './slideBackground'
import { stylePackById } from './slideStyles'
import { defaultDecorKit, isDecorKitId } from './slideDecor'
import { subjectById, subjectRulesBlock } from './slideSubjects'
import { fixMathEscapes, formatChemicalText, limitBold, mathToPlain } from './slideMath'
import { graphicShortlistText, graphicFits, isGraphicId, searchGraphics } from './slideGraphics'
import {
  composeLayout,
  contentFromSlide,
  creditElement,
  withSlideCredit,
  fitRatio,
  defaultTone,
  isLayoutId,
  isEditorialLayout,
  isTone,
  resolveAnswer,
  SLIDE_LAYOUTS,
  toneBackground,
  type SlideLayoutContent,
  type SlideLayoutId,
} from './slideLayouts'

const clean = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined
  // Tập hợp {1, 2, 3} và nhóm ngoặc ngắn không được ngắt dòng giữa chừng: đổi dấu cách trong đó thành NBSP.
  const trimmed = formatChemicalText(limitBold(fixMathEscapes(value.trim())))
    .replace(/\{[^{}$]{1,40}\}/g, (group) => group.replace(/ /g, '\u00a0'))
  return cutAtWord(trimmed, max) || undefined
}

/** Cắt tối đa `max` ký tự ở ranh giới từ, thêm "…" khi có cắt (không để câu dừng giữa từ). */
export function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const head = text.slice(0, Math.max(1, max - 1))
  const space = /\s/.test(text[head.length] ?? '') ? head.length : head.search(/\s\S*$/)
  const kept = space >= max * 0.5 ? head.slice(0, space) : head
  return kept.replace(/[\s,;:\-–—(]+$/, '') + '…'
}

const MAX_CREDIT = 140
const BAR_LABEL_MAX = 42
const BAR_VALUE_MAX = 1_000_000_000_000
const cleanSingleLine = (value: unknown, max: number) =>
  typeof value === 'string' ? cutAtWord(value.trim().replace(/\s+/g, ' '), max) || undefined : undefined

const cleanList = (value: unknown, maxItems: number, maxLen: number): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const items = value
    .map((item) => clean(item, maxLen))
    .filter((item): item is string => !!item)
    .slice(0, maxItems)
  return items.length ? items : undefined
}

export interface SlideCheck {
  page: AiSlidePayload & { layout: SlideLayoutId }
  /** lỗi cứng: thiếu field/vượt ngân sách — slide không dùng được */
  errors: string[]
  /** lỗi mềm: dựng thử layout thấy chữ bị co nhỏ — nên rút ngắn, nhưng vẫn dùng được */
  readability: string[]
}

/**
 * Chuẩn hoá phản hồi AI thành shape của `AiSlidePayload`: layout do dàn ý quyết
 * định (AI không được đổi), mọi field cắt theo giới hạn layout chịu được.
 */
export function sanitizeSlide(raw: unknown, layout: string, tone?: SlideTone): SlideCheck['page'] {
  const id = isLayoutId(layout) ? layout : 'bullets'
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  const entries = source.textStyles && typeof source.textStyles === 'object' ? Object.entries(source.textStyles).slice(0, 48) : []
  const textStyles = Object.fromEntries(entries.filter(([key]) => /^[a-z][a-z0-9-]{0,63}$/.test(key)).map(([key, value]) => [key, sanitizeTextStyle(value)]))
  const aiTone = isTone(source.tone) ? source.tone : undefined
  const limits = BUDGETS[id].fields
  const editorial = isEditorialLayout(id)
  const title = clean(source.title, editorial ? limits?.title ?? 80 : 160)
  const kicker = clean(source.kicker, id === 'bignum' ? limits!.kicker! : 80)
  const subtitle = clean(source.subtitle, id === 'bignum' || id === 'photo-full' ? limits!.subtitle! : 240)
  const rawCredit = cleanSingleLine(source.credit, MAX_CREDIT)
  const credit = editorial ? stripPhotoSources(rawCredit) : rawCredit
  const position = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : undefined
  const extra = id === 'bignum' || id === 'photo-full'
    ? { focusX: position(source.focusX), focusY: position(source.focusY) }
    : {}
  const bars = id === 'bars' && Array.isArray(source.bars)
    ? source.bars.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const { label: rawLabel, value, color } = item as Record<string, unknown>
        const label = cleanSingleLine(rawLabel, BAR_LABEL_MAX)
        if (!label || typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > BAR_VALUE_MAX) return []
        return [{
          label,
          value,
          ...(typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? { color } : {}),
        }]
      }).slice(0, 6)
    : undefined
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
  const imagePrompt = editorial ? cleanSingleLine(source.imagePrompt, 280) : undefined
  const image2Prompt = id === 'photo-compare' ? cleanSingleLine(source.image2Prompt, 280) : undefined
  const graphic =
    isGraphicId(source.graphic) &&
    graphicFits(source.graphic, [title, kicker, subtitle, body, ...(bullets ?? []), ...(items ?? [])].join(' '))
      ? source.graphic
      : undefined
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
          return { value: clean(entry.value, 24), label: clean(entry.label, id === 'rules' ? 220 : 80) }
        })
        .filter((item) => !!item.value)
        .slice(0, BUDGETS[id].stats?.max ?? 4)
    : undefined

  const answer =
    typeof source.answer === 'number' ? source.answer : clean(source.answer, 120)

  return {
    layout: id,
    ...(Object.keys(textStyles).length ? { textStyles } : {}),
    ...(credit ? { credit } : {}),
    ...extra,
    ...(id === 'bignum' ? {
      value: cleanSingleLine(source.value, limits!.value!),
      label: clean(source.label, limits!.label!),
    } : {}),
    ...(id === 'photo-full' && (source.textPosition === 'left' || source.textPosition === 'bottom')
      ? { textPosition: source.textPosition }
      : {}),
    ...(id === 'photo-compare' ? {
      image2: clean(source.image2, 2000),
      caption: clean(source.caption, limits!.caption!),
      caption2: clean(source.caption2, limits!.caption2!),
    } : {}),
    ...(bars?.length ? { bars } : {}),
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
    ...(imagePrompt ? { imagePrompt } : {}),
    ...(image2Prompt ? { image2Prompt } : {}),
    ...(graphic ? { graphic } : {}),
    ...(isDecorKitId(source.decorKit) ? { decorKit: source.decorKit } : {}),
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
const isNonemptyText = (value: unknown): boolean => typeof value === 'string' && !!value.trim()

/* ------------------------------------------------------------------ *
 * Ngân sách chữ — slide thuyết trình phải ít chữ, không để FitText thu nhỏ
 * ------------------------------------------------------------------ */
interface Budget {
  /** tổng ký tự của các field layout dùng */
  total: number
  fields?: Partial<
    Record<
      | 'title' | 'kicker' | 'subtitle' | 'body' | 'quote' | 'author' | 'question' | 'leftTitle' | 'rightTitle'
      | 'problem' | 'conclusion' | 'explanation' | 'value' | 'label' | 'caption' | 'caption2',
      number
    >
  >
  lists?: Array<{
    field: 'bullets' | 'items' | 'left' | 'right' | 'steps' | 'options'
    max: number
    itemMax: number
  }>
  table?: { rows: number; cols: number; cell: number }
  stats?: { max: number; label: number }
}

const BUDGETS: Record<SlideLayoutId, Budget> = {
  title: { total: 260, fields: { title: 80, kicker: 50, subtitle: 110 } },
  section: { total: 220, fields: { title: 60, kicker: 50, subtitle: 100 } },
  statement: { total: 160, fields: { body: 100, kicker: 40, author: 40 } },
  bullets: {
    total: 580,
    fields: { title: 80, kicker: 50 },
    lists: [{ field: 'bullets', max: 6, itemMax: 110 }],
  },
  cards: {
    total: 680,
    fields: { title: 80, kicker: 50 },
    lists: [{ field: 'items', max: 6, itemMax: 100 }],
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
  table: { total: 600, fields: { title: 80 }, table: { rows: 8, cols: 6, cell: 40 } },
  'image-left': {
    total: 380,
    fields: { title: 80 },
    lists: [{ field: 'bullets', max: 6, itemMax: 90 }],
  },
  'image-right': {
    total: 380,
    fields: { title: 80 },
    lists: [{ field: 'bullets', max: 6, itemMax: 90 }],
  },
  'image-full': { total: 260, fields: { title: 80, body: 120 } },
  stats: { total: 380, fields: { title: 80 }, stats: { max: 4, label: 45 } },
  'stat-image': { total: 420, fields: { title: 80 }, stats: { max: 2, label: 45 } },
  bignum: { total: 208, fields: { kicker: 42, value: 24, label: 52, subtitle: 90 } },
  'photo-full': { total: 180, fields: { title: 80, subtitle: 100 } },
  'photo-compare': { total: 230, fields: { title: 80, caption: 75, caption2: 75 } },
  bars: { total: 332, fields: { title: 80 } },
  rules: { total: 560, fields: { title: 70, kicker: 40 }, stats: { max: 5, label: 120 } },
  'editorial-text': {
    total: 620,
    fields: { title: 70, kicker: 40, body: 200 },
    lists: [{ field: 'bullets', max: 3, itemMax: 190 }],
  },
  manifesto: { total: 260, fields: { body: 190, kicker: 40, author: 60 } },
  timeline: {
    total: 440,
    fields: { title: 80 },
    lists: [{ field: 'steps', max: 6, itemMax: 60 }],
  },
  cycle: {
    // chữ nằm trong vòng tròn nên mỗi bước phải ngắn
    total: 296,
    fields: { title: 80 },
    lists: [{ field: 'steps', max: 6, itemMax: 36 }],
  },
  mindmap: {
    total: 520,
    fields: { title: 80, body: 40 },
    lists: [{ field: 'items', max: 6, itemMax: 90 }],
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
    if (field === 'image' || field === 'image2') return sum
    if (field === 'bars') return sum + (page.bars ?? []).reduce((n, bar) => n + bar.label.length, 0)
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

function budgetErrors(page: AiSlidePayload, id: SlideLayoutId, source?: Record<string, unknown>): string[] {
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
    const items = page[list.field] ?? []
    const raw = source?.[list.field]
    const length = Array.isArray(raw) ? raw.filter(isNonemptyText).length : items.length
    if (length > list.max) {
      errors.push(`"${list.field}" có ${length} mục (tối đa ${list.max})`)
    }
    const long = items.find((item) => item.length > list.itemMax)
    if (long) {
      errors.push(`"${list.field}" có mục dài ${long.length} ký tự (tối đa ${list.itemMax})`)
    }
  }
  if (spec.table) {
    const rows = page.rows ?? []
    const rawRows = Array.isArray(source?.rows) ? source.rows.filter(Array.isArray) : rows
    if (rawRows.length > spec.table.rows) {
      errors.push(`bảng có ${rawRows.length} hàng (tối đa ${spec.table.rows} hàng)`)
    }
    const cols = rawRows.reduce((max, row) => Math.max(max, row.length), 0)
    if (cols > spec.table.cols) {
      errors.push(`bảng có ${cols} cột (tối đa ${spec.table.cols} cột)`)
    }
    const long = rows.flat().find((cell) => cell.length > spec.table!.cell)
    if (long) {
      errors.push(`ô bảng dài ${long.length} ký tự (tối đa ${spec.table.cell})`)
    }
  }
  if (spec.stats) {
    const length = Array.isArray(source?.stats)
      ? source.stats.filter((item) => item && isNonemptyText(item.value)).length
      : page.stats?.length ?? 0
    if (length > spec.stats.max) {
      errors.push(`"stats" có ${length} mục (tối đa ${spec.stats.max})`)
    }
    for (const stat of page.stats ?? []) {
      if ((stat.label?.length ?? 0) > spec.stats.label) {
        errors.push(`nhãn số liệu dài ${stat.label!.length} ký tự (tối đa ${spec.stats.label})`)
      }
    }
  }
  return errors
}

/** Lỗi theo layout — dùng cho cả quyết định repair và prompt sửa. */
export function validateSlide(page: AiSlidePayload, layout: string, source?: Record<string, unknown>): string[] {
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
      need(count(page.bullets) >= 1, '"bullets" cần ít nhất 1 ý')
      break
    case 'cards':
      need(count(page.items) >= 2, '"items" cần ít nhất 2 thẻ')
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
      need(count(page.items) >= 1, '"items" cần ít nhất 1 mục')
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
    case 'bignum':
      need(!!page.value, 'thiếu "value"')
      break
    case 'rules':
      need(!!page.title, 'thiếu "title"')
      need((page.stats ?? []).filter((stat) => !!stat.value && !!stat.label).length >= 3, '"stats" cần 3–5 hàng có cả "value" và "label"')
      break
    case 'editorial-text':
      need(!!page.title, 'thiếu "title"')
      need(!!page.body || (page.bullets?.length ?? 0) > 0, 'cần "body" hoặc "bullets"')
      break
    case 'manifesto':
      need(!!page.body, 'thiếu "body"')
      break
    case 'bars':
      need(!!page.title, 'thiếu "title"')
      need((page.bars?.length ?? 0) >= 2, '"bars" cần 2–6 dòng hợp lệ')
      break
    case 'photo-full':
    case 'photo-compare':
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
      need(count(page.steps) >= 3, '"steps" cần ít nhất 3 bước')
      break
    case 'mindmap':
      need(!!page.body, 'thiếu "body" (nút trung tâm)')
      need(count(page.items) >= 2, '"items" cần ít nhất 2 nhánh')
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
  return [...errors, ...budgetErrors(plain, id, source)]
}

/* ------------------------------------------------------------------ *
 * Prompt từng slide
 * ------------------------------------------------------------------ */

const FIELD_HINTS: Partial<Record<keyof SlideLayoutContent, string>> = {
  // app gán từ dàn ý, không layout nào yêu cầu AI điền
  decorKit: '"decorKit" — không điền',
  title: '"title" — tiêu đề slide (chuỗi ≤ 80 ký tự, ≤ 10 từ)',
  kicker: '"kicker" — nhãn nhỏ phía trên (chuỗi ≤ 50)',
  subtitle: '"subtitle" — dòng phụ (chuỗi ≤ 110)',
  body: '"body" — một câu/đoạn ngắn (≤ 160 ký tự)',
  bullets: '"bullets" — mảng các ý ngắn',
  items: '"items" — mảng các mục',
  left: '"left" — mảng các ý cột trái',
  right: '"right" — mảng các ý cột phải',
  leftTitle: '"leftTitle" — nhãn bên trái (≤ 30 ký tự)',
  rightTitle: '"rightTitle" — nhãn bên phải (≤ 30 ký tự)',
  quote: '"quote" — câu trích (chuỗi ≤ 160)',
  author: '"author" — tên tác giả/nhân vật (chuỗi ≤ 50)',
  rows: '"rows" — mảng hàng, mỗi hàng là mảng chuỗi; ít nhất 2 hàng × 2 cột',
  image: '"image" — để trống (người dùng tự chọn ảnh)',
  graphic: '"graphic" — id đồ hoạ vector có sẵn (tuỳ chọn; xem catalog)',
  stats: '"stats" — mảng các mục {"value","label"}',
  steps: '"steps" — mảng các bước',
  question: '"question" — câu hỏi (chuỗi ≤ 140)',
  options: '"options" — mảng 2–4 phương án',
  answer: '"answer" — chỉ số 0-based của phương án đúng trong "options"',
  problem: '"problem" — đề bài/yêu cầu của ví dụ (chuỗi ≤ 170)',
  conclusion: '"conclusion" — kết luận/đáp số một dòng (≤ 90)',
  explanation: '"explanation" — giải thích ngắn vì sao đáp án đúng (≤ 150)',
  value: '"value" — con số / mốc / giá trị nổi bật, ngắn (≤ 24 ký tự, vd "08:15", "12.187", "2021", "70%")',
  label: '"label" — nhãn nói con số đó là gì (≤ 52 ký tự)',
  focusX: '"focusX" — số 0–100, vị trí ngang của chủ thể trong ảnh (50 = giữa); chỉ điền khi có ảnh',
  focusY: '"focusY" — số 0–100, vị trí dọc của chủ thể trong ảnh (40 thường hợp với chân dung)',
  image2: '"image2" — để trống (app tự lấy ảnh thứ hai)',
  caption: '"caption" — chú thích ảnh bên trái (≤ 75 ký tự: nêu ai / đâu / năm nào)',
  caption2: '"caption2" — chú thích ảnh bên phải (≤ 75 ký tự)',
  textPosition: '"textPosition" — "bottom" (chữ dưới ảnh) hoặc "left" (chữ cột trái) tuỳ chủ thể nằm đâu trong ảnh',
  bars: '"bars" — mảng 2–6 dòng {"label","value","color"}; value là SỐ (không đơn vị), color tuỳ chọn dạng "#rrggbb"; xếp từ lớn đến nhỏ',
}

/** Lưu ý riêng của từng layout, chèn sau danh sách field. */
const LAYOUT_NOTES: Partial<Record<SlideLayoutId, string>> = {
  cards:
    '- Thẻ: "items" có 2–6 mục. Mỗi thẻ giữ nguyên tên đầy đủ; viết thêm một câu ngắn nếu cần.\n',
  timeline: '- Dòng thời gian: "steps" có 3–6 bước.\n',
  cycle: '- Vòng lặp: "steps" có 3–6 bước.\n',
  mindmap:
    '- Sơ đồ tư duy: "body" là chủ đề trung tâm (≤ 40 ký tự); "items" là 2–6 nhánh, mỗi nhánh viết dạng "Nhãn nhánh: ý con 1; ý con 2" (nhãn ≤ 25 ký tự, tối đa 3 ý con, mỗi ý con ≤ 28 ký tự, ngăn bằng dấu chấm phẩy). KHÔNG đưa toạ độ.\n',
  statement:
    '- Thông điệp lớn: "body" là MỘT câu ngắn (≤ 90 ký tự) hoặc một kết quả/công thức, nêu đúng ý chính; không liệt kê, không giải thích dài (phần giải thích dành cho slide khác).\n',
  example:
    '- Ví dụ mẫu: "steps" 2–4 bước giải, mỗi bước một phép biến đổi/ý có số liệu cụ thể; "conclusion" nêu kết quả cuối. Lời giải phải ĐÚNG, tự kiểm tra lại phép tính.\n',
  hook:
    '- Mở bài: "body" là câu hỏi/tình huống gần gũi kết thúc bằng câu hỏi; "items" là 2–3 gợi ý ngắn (≤ 30 ký tự) dẫn học sinh tới bài mới.\n',
  bignum:
    '- Số nổi bật: "value" là CON SỐ chính của cả slide (một mốc, một kết quả, một tỉ lệ), đúng sự thật, không bịa; "label" nói số đó là gì; "subtitle" thêm một dòng bối cảnh. Có "imagePrompt" thì ảnh nằm bên phải.\n',
  'photo-full':
    '- Ảnh tràn nền: dùng cho slide mở đầu, chuyển chương hoặc khoảnh khắc nhấn mạnh; tiêu đề ngắn, giàu cảm xúc, đọc như một câu lớn trên ảnh. Chủ thể ảnh nằm bên nào thì đặt chữ ở bên kia ("textPosition").\n',
  'photo-compare':
    '- So sánh hai ảnh: trước / sau, xưa / nay, hai đối tượng; mỗi ảnh một "caption" nói rõ ai, đâu, khi nào; hai mô tả ảnh phải cùng góc nhìn để đặt cạnh nhau hợp lý.\n',
  bars:
    '- Biểu đồ thanh: chỉ dùng số liệu có thật và hợp lý, ghi nguồn ở "credit"; số liệu minh hoạ phải ghi "ví dụ" trong "credit". Thanh đầu là giá trị lớn nhất.\n',
  rules:
    '- Danh sách kẻ dòng: "stats" là 3–5 hàng; "value" là mốc/nhãn NGẮN bên trái (ngày tháng, năm, số thứ tự, tên riêng; ≤ 18 ký tự), "label" là nội dung một câu bên phải. Dùng cho dòng thời gian, các bước, các nhân vật, các nguyên nhân. KHÔNG dùng "bullets".\n',
  'editorial-text':
    '- Chữ biên tập: "title" nêu thẳng kết luận của slide; "bullets" là 1–3 đoạn văn ngắn (mỗi đoạn một ý, có dữ kiện cụ thể), KHÔNG gạch đầu dòng, không liệt kê vụn.\n',
  manifesto:
    '- Câu chủ đề: "body" là MỘT câu mạnh (≤ 150 ký tự) — luận điểm, câu hỏi mở bài, trích dẫn có nguồn hoặc lời kết; "author" là nguồn trích hoặc dòng phụ ngắn (bỏ trống nếu không có). Không giải thích thêm.\n',
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
  if (spec.table) parts.push(`bảng ≤ ${spec.table.rows} hàng × ${spec.table.cols} cột, mỗi ô ≤ ${spec.table.cell} ký tự`)
  if (spec.stats) parts.push(`số mục ≤ ${spec.stats.max}, nhãn số liệu ≤ ${spec.stats.label} ký tự`)
  parts.push('tiêu đề ≤ 80 ký tự')
  return `NGÂN SÁCH CHỮ: ${parts.join('; ')}.`
}

const GRAPHIC_LAYOUTS = new Set(['title', 'section', 'closing', 'hook', 'bullets', 'image-left', 'image-right'])

/** Phần riêng của một slide: layout, field, ngân sách chữ, gợi ý đồ hoạ. */
function slideSpecBlock(slide: DeckPlanSlide, pro = false): string {
  const layout = SLIDE_LAYOUTS.find((item) => item.id === slide.layout) ?? SLIDE_LAYOUTS[2]
  const fields = layout.fields.flatMap((field) => FIELD_HINTS[field] ? ['- ' + FIELD_HINTS[field]] : []).join('\n')
  const supportsGraphic = GRAPHIC_LAYOUTS.has(layout.id)
  const isImageLayout = layout.id === 'image-left' || layout.id === 'image-right'
  const hints = supportsGraphic
    ? searchGraphics(`${slide.title} ${slide.brief ?? ''}`, 6).map((g) => `${g.id}=${g.name}`)
    : []
  return (
    `LAYOUT BẮT BUỘC: "${layout.id}" (${layout.name}) — ${layout.description}\n` +
    `FIELD CẦN ĐIỀN:\n${fields}\n` +
    '- "notes" — mảng 0–6 chuỗi ghi chú trình bày (tuỳ chọn).\n' +
    (LAYOUT_NOTES[layout.id] ?? '') +
    (supportsGraphic ? '- "graphic" — id đồ hoạ có sẵn (tuỳ chọn).\n' : '') +
    `- "layout" phải đúng "${layout.id}"; không thêm field khác.\n` +
    budgetLine(layout.id) +
    (hints.length ? `\nGợi ý đồ hoạ khớp từ khoá tiêu đề (xét trước): ${hints.join(', ')}.` : '') +
    (isImageLayout
      ? '\nLayout ảnh: ĐỂ TRỐNG "image" (app tự vẽ ảnh minh hoạ nền sau 45–90 giây). Có id đồ hoạ phù hợp thì ' +
        'đặt "graphic" để slide có hình ngay trong lúc chờ ảnh.'
      : '') +
    (pro ? proSpecBlock(layout.id) : '')
  )
}

/** Chế độ Chuyên nghiệp: ảnh nền do app vẽ từ mô tả, dòng ghi nguồn ở chân slide. */
function proSpecBlock(id: SlideLayoutId): string {
  const hasPhoto = id === 'bignum' || id === 'photo-full' || id === 'photo-compare'
  return (
    '\nCHẾ ĐỘ CHUYÊN NGHIỆP:\n' +
    '- "credit" — dòng ghi nguồn SỐ LIỆU / trích dẫn ở chân slide (≤ 140 ký tự, vd "Nguồn: IAEA, 2024"); ' +
    'số liệu không chắc chắn thì ghi "số liệu minh hoạ". KHÔNG ghi nguồn ảnh (app tự thêm). Đừng bỏ trống khi slide có số liệu.\n' +
    '- KHÔNG BỊA NGUỒN: slide không có số liệu hay câu trích nguyên văn (lời khuyên, quy tắc, các bước, cam kết, định nghĩa do bạn viết) thì BỎ TRỐNG "credit". ' +
    'KHÔNG viết "theo / dựa trên / khuyến nghị / hướng dẫn của <bộ, cơ quan, tổ chức>" trừ khi tài liệu đó nằm trong phần NGUỒN được cung cấp.\n' +
    (hasPhoto
      ? '- "imagePrompt" — mô tả ảnh cần vẽ (≤ 280 ký tự, tiếng Anh, một câu): chủ thể cụ thể, bối cảnh, ánh sáng, ống kính; ' +
        'phong cách ảnh chụp thật (documentary / editorial photograph), KHÔNG chữ, KHÔNG logo, KHÔNG người nổi tiếng có thật, ' +
        'chủ thể nằm ở giữa hoặc lệch trái / phải đúng như "focusX", chừa vùng trống cho chữ.\n' +
        '- ẢNH LÀ ẢNH AI VẼ, không phải ảnh thật: chữ trên slide ("subtitle", "caption", "label", "body") KHÔNG được gọi nó là ảnh chụp / ảnh thật / ảnh từ tàu, vệ tinh, kính thiên văn / tư liệu lịch sử; chỉ mô tả nội dung hoặc ý nghĩa.\n' +
        '- Mô tả ảnh chỉ nêu cảnh, vật, người nói chung chung. TUYỆT ĐỐI không nhờ vẽ thứ AI vẽ dễ sai: cúp / huy chương cụ thể, cờ quốc gia, huy hiệu, logo, tượng đài / công trình nổi tiếng, mặt người có thật, bản đồ, đồ thị, sơ đồ khoa học, công thức, chữ. ' +
        'Chủ đề cần hình khoa học hoặc toán thì chọn vật đời thường có hình dạng liên quan (vòi nước phun thành vòng cung, quả bóng bay, cây cầu), không vẽ đồ thị.\n' +
        (id === 'photo-compare'
          ? '- "image2Prompt" — mô tả ảnh thứ hai, CÙNG một bối cảnh và góc nhìn với "imagePrompt", chỉ khác thời điểm hoặc tình trạng (trước/sau, xưa/nay); hai ảnh không được là hai nơi khác nhau.\n'
          : '')
      : '')
  )
}

/** Catalog đồ hoạ — gửi một lần nếu có slide nào cần. */
function graphicBlock(plan: DeckPlan, slides: DeckPlanSlide[]): string {
  return (
    '\n\nĐỒ HOẠ CÓ SẴN — chọn MỘT id khớp chủ đề cho field "graphic" ' +
    '(nhanh, đúng màu, không tốn lượt vẽ ảnh):\n' +
    graphicShortlistText(subjectById(plan.subject)?.graphicGroups, slides.map((s) => `${s.title} ${s.brief ?? ''}`)) +
    '\n- "graphic" chỉ dùng id trong danh sách trên; KHÔNG bịa id mới.\n' +
    '- Chọn theo NGHĨA CỦA NỘI DUNG slide, không theo hình tượng chung của môn (vd: cái cân không hợp với ƯCLN). ' +
    'NÊN chọn một hình: hình gần nghĩa (cùng chủ đề, cùng hoạt động — vd: mục tiêu → cờ đích, luyện tập → bút chì, ' +
    'tổng kết → sách/bài trắc nghiệm) vẫn tốt hơn để trống. Chỉ BỎ TRỐNG khi mọi id đều lệch hẳn nghĩa.\n'
  )
}

/** Quy tắc nội dung + bối cảnh deck + dàn ý: dùng chung mọi slide. */
function deckContextBlock(plan: DeckPlan): string {
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
  return (
    '\n\nQUY TẮC NỘI DUNG:\n' +
    '- Viết như slide thuyết trình: MỘT thông điệp chính mỗi slide, mỗi ý là cụm từ cụ thể ' +
    '8–18 từ, không viết câu dài hay đoạn văn.\n' +
    '- Ưu tiên chi tiết có thể nhìn thấy: số liệu, ví dụ, tên riêng, phép tính. Tránh ý chung chung ' +
    'kiểu "quan trọng", "hiệu quả", "đa dạng"; cắt từ nối và giải thích dài.\n' +
    '- Nếu layout có nhãn lớn (số liệu, bước, câu trích), chọn giá trị làm điểm nhấn của slide.\n' +
    '- Nhấn mạnh từ khoá bằng **đậm**: mỗi ý chọn 1–2 cụm quan trọng nhất (thuật ngữ, con số, kết quả; mỗi cụm ≤ 5 từ), ' +
      'ví dụ "tìm **ước chung** rồi lấy số **lớn nhất**". KHÔNG bôi đậm cả câu, KHÔNG dùng trong tiêu đề, KHÔNG lồng vào công thức $...$.\n' +
    '- Bám đúng brief của slide; không lặp ý các slide khác.\n' +
    '- Số liệu lịch sử, địa lý và khoa học phải lấy từ nguồn đáng tin. Giữ năm, phạm vi hoặc chú thích như "ước tính" nếu nguồn có. Không gắn "(ví dụ)" vào số liệu thật. Thiếu căn cứ thì bỏ con số; chỉ ghi "ví dụ" trong bài tập giả định.\n' +
    '- Trong cả câu chữ và bảng, viết công thức hoá học nhất quán với chỉ số dưới (H₂, H₂SO₄, SO₂, ZnCl₂). Viết đầy đủ "đặc" hoặc "loãng" khi cần nêu nồng độ axit.\n' +
    '- Công thức đơn giản (x², √, ≤, →, π, α) viết bằng ký tự Unicode. Công thức có phân số, căn dài, ' +
    'chỉ số, tích phân hoặc phương trình hoá học viết LaTeX giữa $...$ ' +
    '(vd $\frac{18}{24}=\frac{3}{4}$, $\ce{Zn + CuSO4 -> ZnSO4 + Cu}$). Trong JSON PHẢI viết hai dấu ' +
    'gạch chéo ngược (\\frac, \\sqrt, \\cdot). Chỉ dùng $ cho công thức, không dùng cho tiền.\n\n' +
    'BỐI CẢNH DECK:\n' +
    `- Tiêu đề: ${plan.title ?? '(chưa có)'}\n` +
    `- Đối tượng: ${plan.audience ?? 'học sinh'}\n` +
    `- Phong cách: ${plan.style ?? 'thuyết trình rõ ràng, có điểm nhấn: mỗi slide chốt một thông điệp, ưu tiên số liệu và ví dụ cụ thể'}\n\n` +
    packBlock +
    subjectRulesBlock(plan.subject) +
    `DÀN Ý CẢ DECK (để không lặp ý):\n${outline}\n\n`
  )
}

function slideHeading(plan: DeckPlan, slide: DeckPlanSlide, index: number): string {
  return (
    `${index + 1}/${plan.slides.length} — ${slide.title}` +
    `${slide.kicker ? ` (nhãn: ${slide.kicker})` : ''}\n` +
    (slide.brief ? `Brief: ${slide.brief}\n` : '')
  )
}

/**
 * System prompt cho một slide (dùng cho lượt sửa / chấm lại từng slide).
 */
export function pageSystemPrompt(
  plan: DeckPlan,
  slide: DeckPlanSlide,
  index: number,
  pro = false,
): string {
  return (
    'Bạn là trợ lý AI của trình soạn bài trình bày tiếng Việt. Viết nội dung cho ĐÚNG MỘT slide. ' +
    'Chỉ trả về DUY NHẤT một JSON hợp lệ, không bọc markdown, không chữ ngoài JSON.\n\n' +
    slideSpecBlock(slide, pro) +
    (GRAPHIC_LAYOUTS.has(slide.layout) ? graphicBlock(plan, [slide]) : '') +
    deckContextBlock(plan) +
    'SLIDE CẦN VIẾT: ' + slideHeading(plan, slide, index)
  )
}

/**
 * System prompt cho một nhóm slide liền nhau trong MỘT lần gọi: phần quy tắc, bối cảnh,
 * dàn ý và catalog đồ hoạ chỉ gửi một lần thay vì lặp lại cho từng slide (đỡ token).
 */
export function batchSystemPrompt(plan: DeckPlan, indices: number[], pro = false): string {
  const needsGraphic = indices.some((i) => GRAPHIC_LAYOUTS.has(plan.slides[i].layout))
  const specs = indices
    .map((i) => `### SLIDE ${slideHeading(plan, plan.slides[i], i)}${slideSpecBlock(plan.slides[i], pro)}`)
    .join('\n\n')
  return (
    'Bạn là trợ lý AI của trình soạn bài trình bày tiếng Việt. Viết nội dung cho ' +
    `${indices.length} slide liệt kê ở cuối. Chỉ trả về DUY NHẤT một JSON hợp lệ dạng ` +
    '{"slides":[{...},{...}]} — mỗi phần tử là JSON của một slide, ĐÚNG THỨ TỰ và ĐỦ số slide, ' +
    'không bọc markdown, không chữ ngoài JSON.' +
    // phần giống nhau giữa các lượt đặt TRƯỚC (cache prompt của nhà cung cấp chỉ khớp phần đầu trùng nhau)
    deckContextBlock(plan) +
    (needsGraphic ? graphicBlock(plan, indices.map((i) => plan.slides[i])) : '') +
    `CÁC SLIDE CẦN VIẾT (mỗi slide tuân thủ đúng layout, field, ngân sách chữ của nó):\n\n${specs}\n`
  )
}

/** Tách mảng slide từ phản hồi gộp; thiếu/hỏng thì phần tử đó là null. */
export function parseBatchSlides(raw: unknown, count: number): unknown[] {
  const list = raw && typeof raw === 'object' ? (raw as { slides?: unknown }).slides : null
  const arr = Array.isArray(list) ? list : []
  return Array.from({ length: count }, (_, i) => arr[i] ?? null)
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
/** Bộ trang trí của deck: dàn ý chọn, thiếu thì suy từ style pack/môn. */
export function planDecorKit(plan: DeckPlan): string {
  return plan.decorKit ?? defaultDecorKit(plan.stylePack, plan.subject)
}

/**
 * Mỗi slide được sinh riêng (song song) nên AI hay dùng lại một đồ hoạ cho bìa, khởi động
 * và kết. Gọi theo thứ tự slide: đồ hoạ đã có ở slide trước thì bỏ (layout tự lo khi thiếu).
 */
export function dropRepeatedGraphic<T extends { graphic?: string }>(page: T, used: Set<string>): T {
  if (!page.graphic) return page
  if (!used.has(page.graphic)) {
    used.add(page.graphic)
    return page
  }
  const { graphic: _drop, ...rest } = page
  return rest as T
}

export function checkSlide(raw: unknown, layout: string, tone?: SlideTone): SlideCheck {
  const page = sanitizeSlide(raw, layout, tone)
  // Kiểm số mục gốc để biết có mục bị cắt khi chuẩn hoá.
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : undefined
  const errors = validateSlide(page, layout, source)
  return { page, errors, readability: errors.length ? [] : readabilityIssues(page, layout) }
}

/** Cỡ chữ nội dung tối thiểu (cqw) ≈ 24px ở slide 1280px. */
export const READABLE_MIN = 1.9
/** Chữ bị co quá mức này so với cỡ thiết kế thì coi là nhồi quá nhiều chữ. */
const READABLE_SHRINK = 0.78
/** Nhãn/số thứ tự nhỏ theo thiết kế, không tính. */
const SMALL_BY_DESIGN = /kicker|index|mark|author|^credit$|-title$/

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
    credit: page.credit,
    value: page.value,
    label: page.label,
    focusX: page.focusX,
    focusY: page.focusY,
    imageCrop: page.imageCrop,
    image2: page.image2,
    image2Crop: page.image2Crop,
    caption: page.caption,
    caption2: page.caption2,
    textPosition: page.textPosition,
    bars: page.bars,
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
    decorKit: page.decorKit,
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
 * Dòng nguồn do AI viết cho slide biên tập chỉ giữ nguồn SỐ LIỆU: các đoạn nhắc tới ảnh / Wikimedia bị bỏ
 * (AI hay bịa nguồn ảnh; nguồn ảnh thật do app thêm sau khi tìm / vẽ ảnh, xem `mergePhotoCredit`).
 */
export function stripPhotoSources(credit: string | undefined): string | undefined {
  if (!credit) return credit
  const kept = credit.split(/\s*[·;|]\s*/).filter((part) => part && !/ảnh|wikimedia|commons|getty|shutterstock/i.test(part))
  return kept.length ? kept.join(' · ') : undefined
}

/** Nối nguồn ảnh (Wikimedia Commons hoặc "Ảnh minh hoạ do AI tạo") vào dòng nguồn số liệu của slide. */
export function mergePhotoCredit(current: string | undefined, photoCredit: string): string {
  if (current?.includes(photoCredit)) return current
  const merged = current?.trim() ? `${current.trim()} · ${photoCredit}` : photoCredit
  return merged.length > 220 ? merged.slice(0, 219).trimEnd() + '…' : merged
}

/**
 * Dựng lại slide với ảnh AI (ảnh về sau khi slide đã hiện). Đọc nội dung từ chính
 * các phần tử của slide nên chữ người dùng đã sửa trong lúc chờ ảnh không mất;
 * layout không dựng được thì giữ nguyên slide.
 */
export function withImage(slide: Slide, theme: DeckTheme, image: string, slot: 'image' | 'image2' = 'image', photoCredit?: string): Slide {
  const layout = slide.layout
  if (!layout || !isLayoutId(layout)) return slide
  const content = { ...contentFromSlide(slide), [slot]: image }
  if (photoCredit) content.credit = mergePhotoCredit(content.credit, photoCredit)
  const elements = composeLayout(theme, layout, content, slide.tone)
  return elements.length ? { ...slide, elements: elements.map(el => {
    const before = slide.elements.find(entry => entry.id === el.id)
    return el.type === 'text' && before?.type === 'text' && (hasTextEffects(before) || before.fontFamily)
      ? { ...el, ...textEffectsOf(before), ...(before.fontFamily ? { fontFamily: before.fontFamily } : {}) }
      : el
  }) } : slide
}

/** Dựng một slide AI bằng layout engine; layout lạ rơi về title + bullets. */
export function slideFromAi(page: AiSlidePayload, theme: ResolvedTheme): Slide {
  const layout = page.layout?.trim()
  const content = contentOfPage(page)
  if (layout && isEditorialLayout(layout)) {
    const { image, image2, imageCrop, image2Crop } = content
    Object.assign(content, contentOfPage(sanitizeSlide(page, layout)), {
      image: typeof image === 'string' ? image : undefined,
      image2: typeof image2 === 'string' ? image2 : undefined,
      imageCrop,
      image2Crop,
    })
  }
  if (theme.pro && layout === 'bars' && content.bars) {
    content.bars = content.bars.map(({ label, value }) => ({ label, value }))
  }
  content.credit = cleanSingleLine(content.credit, MAX_CREDIT)
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
      ...(page.decorKit ? { decorKit: page.decorKit } : {}),
      elements: page.textStyles ? composed.map(el => el.type === 'text' && Object.hasOwn(page.textStyles!, el.id) ? { ...el, ...sanitizeTextStyle(page.textStyles![el.id]) } : el) : composed,
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
      ...((el.type ?? 'text') === 'text' ? sanitizeTextStyle(el) : {}),
    })),
  ]
  return {
    id: newId(),
    background: theme.bg,
    transition: 'none',
    notes: page.notes?.join('\n') || undefined,
    elements: withSlideCredit(elements, creditElement(content.credit, theme.muted)),
  }
}

/** Slide layout cũ được dựng lại theo theme mới, giữ nội dung + notes. */
function recompose(slides: Slide[], theme: ResolvedTheme): Slide[] {
  return slides.map((slide) => {
    if (slide.layout && isLayoutId(slide.layout)) {
      const tone = isTone(slide.tone) ? slide.tone : defaultTone(slide.layout)
      const elements = composeLayout(theme, slide.layout, contentFromSlide(slide), tone)
      if (elements.length > 0) {
        return keepCustomBg(slide, { ...slide, tone, background: toneBackground(theme, tone), elements }, theme.fg)
      }
    }
    return slide.customBg ? slide : { ...slide, background: theme.bg }
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
  const previous = isStarterDeck(latest) ? [] : latest.slides
  const currentTheme = normalizeTheme(latest.theme)
  const nextTheme = plan?.theme ? themeById(plan.theme) : currentTheme
  const themeChanged = nextTheme.id !== currentTheme.id
  const kit = plan?.decorKit
  const pagesWithDecor = kit ? pages.map((page) => ({ ...page, decorKit: page.decorKit ?? kit })) : pages
  const added = pagesWithDecor.map((page) => slideFromAi(page, nextTheme))
  // Bộ chưa đặt tên thì lấy tên bài từ dàn ý AI.
  const aiTitle = plan?.title?.trim().slice(0, 120)
  const rename = aiTitle && (!latest.title.trim() || latest.title === 'Bài giảng mới')
  return {
    patch: {
      ...(rename ? { title: aiTitle } : {}),
      ...(themeChanged ? { theme: nextTheme } : {}),
      ...(plan?.style ? { style: plan.style } : {}),
      slides: [
        ...(themeChanged ? recompose(previous, nextTheme) : previous),
        ...added,
      ],
    },
    added,
  }
}
