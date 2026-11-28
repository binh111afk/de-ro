/**
 * Chế độ "Giữ nguyên chữ" cho slide:
 * - Tách văn bản gốc (hoặc chữ trích từ tệp/OCR) thành các đoạn đánh số `[1]`, `[2]`, …
 *   (hỗ trợ `---` để người dùng tự ngắt slide).
 * - AI chỉ trả JSON ánh xạ ID đoạn vào từng slide & bố cục, KHÔNG viết lại chữ.
 * - Code tự lắp đúng 100% chuỗi gốc, tự bù đoạn AI lỡ bỏ sót và tự tách sang slide kế tiếp
 *   nếu một slide quá dài — không bao giờ cắt/sửa nguyên văn.
 */
import { parseAiObject, proPlan, type AiSlidePayload, type DeckPlan, type DeckPlanSlide, type ProStyle } from './aiDeck'
import { isLayoutId, type SlideLayoutId } from './slideLayouts'
import { planDecorKit } from './slideAi'
import { DECK_THEMES } from './slideTheme'
import type { SlideTone } from '@/store/docs'

export interface PreserveBlock {
  /** số thứ tự 1-based để AI ánh xạ */
  id: number
  /** nguyên văn đoạn chữ (đã bỏ khoảng trắng thừa hai đầu dòng) */
  text: string
  /** người dùng đặt `---` ngay trước đoạn này để ngắt sang slide mới */
  breakBefore?: boolean
}

export interface PreserveSlideSpec {
  layout?: string
  tone?: string
  titleId?: number
  subtitleId?: number
  kickerId?: number
  bodyId?: number
  itemIds?: number[]
  leftTitleId?: number
  rightTitleId?: number
  leftIds?: number[]
  rightIds?: number[]
  quoteId?: number
  authorId?: number
  imagePrompt?: string
}

export interface PreserveResult {
  plan: DeckPlan
  pages: AiSlidePayload[]
  /** số đoạn gốc AI bỏ sót đã được tự bù lại */
  recovered: number
}

/** Bố cục phù hợp khi giữ nguyên văn (chịu được chữ dài, không ép vào khuôn quá ngắn như cycle/bignum). */
export const PRESERVE_STD_LAYOUTS: readonly SlideLayoutId[] = [
  'title', 'section', 'bullets', 'editorial-text', 'two-column', 'cards', 'quote', 'image-left', 'image-right', 'closing',
]
export const PRESERVE_PRO_LAYOUTS: readonly SlideLayoutId[] = [
  'photo-full', 'editorial-text', 'rules', 'manifesto', 'photo-compare',
]

const BREAK_LINE = /^\s*(?:---+|\*\*\*+|===+)\s*$/
const MAX_SLIDE_CHARS = 680
const MAX_LIST_ITEMS = 6
const MAX_SINGLE_BLOCK = 460

/** Tách một đoạn đơn lẻ quá dài theo ranh giới câu để không bị co chữ quá nhỏ, vẫn giữ đủ 100% chữ. */
export function splitLongBlock(text: string, maxChars = MAX_SINGLE_BLOCK): string[] {
  const clean = text.trim()
  if (clean.length <= maxChars) return clean ? [clean] : []
  const sentences = clean.match(/[^.!?;\n]+(?:[.!?;]+|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean]
  if (sentences.length <= 1) return [clean]
  const chunks: string[] = []
  let buf = ''
  for (const s of sentences) {
    if (!buf) {
      buf = s
    } else if (buf.length + 1 + s.length <= maxChars) {
      buf += ' ' + s
    } else {
      chunks.push(buf)
      buf = s
    }
  }
  if (buf) chunks.push(buf)
  return chunks
}

/** Tách văn bản đầu vào thành mảng đoạn đánh số (tôn trọng dấu `---` ngắt slide). */
export function splitPreserveBlocks(raw: string): PreserveBlock[] {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  const blocks: PreserveBlock[] = []
  let pendingBreak = false

  for (const line of lines) {
    if (BREAK_LINE.test(line)) {
      if (blocks.length > 0) pendingBreak = true
      continue
    }
    const text = line.trim()
    if (!text) continue
    blocks.push({
      id: blocks.length + 1,
      text,
      ...(pendingBreak ? { breakBefore: true } : {}),
    })
    pendingBreak = false
  }
  return blocks
}

/** Ghép danh sách đoạn đánh số thành tin nhắn gửi AI. */
export function formatPreserveMessage(blocks: PreserveBlock[], note?: string): string {
  const lines: string[] = []
  if (note?.trim()) lines.push(`Yêu cầu thêm về giao diện/cách chia: ${note.trim()}\n`)
  lines.push('Văn bản gốc (mỗi dòng là một đoạn đánh số — CHỈ trả ID, KHÔNG viết lại chữ):')
  for (const b of blocks) {
    if (b.breakBefore) lines.push('--- (người dùng muốn sang slide mới từ đây)')
    lines.push(`[${b.id}] ${b.text}`)
  }
  return lines.join('\n')
}

const isTone = (v: unknown): v is SlideTone => v === 'theme' || v === 'soft' || v === 'accent'
const THEME_IDS = new Set(DECK_THEMES.map((t) => t.id))

/** Tách danh sách ý quá dài / quá nhiều mục thành nhiều nhóm vừa khung 16:9. */
function chunkItems(items: string[], maxItems = MAX_LIST_ITEMS, maxChars = MAX_SLIDE_CHARS): string[][] {
  const expanded = items.flatMap((it) => splitLongBlock(it))
  if (!expanded.length) return []
  const groups: string[][] = []
  let cur: string[] = []
  let chars = 0
  for (const item of expanded) {
    if (cur.length > 0 && (cur.length >= maxItems || chars + item.length > maxChars)) {
      groups.push(cur)
      cur = []
      chars = 0
    }
    cur.push(item)
    chars += item.length
  }
  if (cur.length) groups.push(cur)
  return groups
}

function buildOverflowPages(base: AiSlidePayload, pro?: boolean): AiSlidePayload[] {
  const layout = base.layout
  if (layout === 'bullets' || layout === 'editorial-text' || layout === 'image-left' || layout === 'image-right') {
    const bullets = base.bullets ?? []
    const chunks = chunkItems(bullets, layout === 'editorial-text' ? 3 : MAX_LIST_ITEMS)
    if (chunks.length <= 1) return [base]
    return chunks.map((chunk, i) => ({
      ...base,
      ...(i > 0 ? { layout: pro ? 'editorial-text' : 'bullets', imagePrompt: undefined } : {}),
      bullets: chunk,
    }))
  }
  if (layout === 'cards') {
    const chunks = chunkItems(base.items ?? [], 6)
    if (chunks.length <= 1) return [base]
    return chunks.map((chunk) => ({ ...base, items: chunk }))
  }
  if (layout === 'rules') {
    const stats = base.stats ?? []
    if (stats.length <= 5) return [base]
    const out: AiSlidePayload[] = []
    for (let i = 0; i < stats.length; i += 5) {
      out.push({ ...base, stats: stats.slice(i, i + 5) })
    }
    return out
  }
  if (layout === 'two-column') {
    const left = (base.left ?? []).flatMap((it) => splitLongBlock(it))
    const right = (base.right ?? []).flatMap((it) => splitLongBlock(it))
    const maxN = Math.max(left.length, right.length)
    if (maxN <= 4 && [...left, ...right].join('').length <= MAX_SLIDE_CHARS) return [base]
    const out: AiSlidePayload[] = []
    for (let i = 0; i < maxN; i += 3) {
      out.push({ ...base, left: left.slice(i, i + 3), right: right.slice(i, i + 3) })
    }
    return out
  }
  if ((layout === 'manifesto' || layout === 'quote') && base.body && base.body.length > MAX_SINGLE_BLOCK) {
    const parts = splitLongBlock(base.body)
    if (parts.length > 1) {
      return parts.map((p, i) => (i === 0 ? { ...base, body: p } : { layout: pro ? 'editorial-text' : 'bullets', title: base.title, bullets: [p] }))
    }
  }
  return [base]
}

/** Tách nhãn ngắn trước dấu `:` (chỉ tách vị trí hiển thị, giữ nguyên 100% chữ gốc). */
function splitRuleStat(text: string): { value: string; label: string } {
  const m = text.match(/^([^:]{1,28}):\s+(.+)$/)
  if (m) return { value: m[1].trim(), label: m[2].trim() }
  return { value: '•', label: text }
}

/** Dựng slide dự phòng thuần từ blocks (khi AI trả JSON hỏng hoặc dùng cho đoạn bị bỏ sót). */
export function fallbackPreservePages(blocks: PreserveBlock[], pro?: boolean): AiSlidePayload[] {
  if (!blocks.length) return []
  // Chia nhóm theo dấu ngắt `---` trước
  const sections: PreserveBlock[][] = []
  let cur: PreserveBlock[] = []
  for (const b of blocks) {
    if (b.breakBefore && cur.length) {
      sections.push(cur)
      cur = []
    }
    cur.push(b)
  }
  if (cur.length) sections.push(cur)

  const pages: AiSlidePayload[] = []
  const listLayout: SlideLayoutId = pro ? 'editorial-text' : 'bullets'
  sections.forEach((sec, idx) => {
    if (idx === 0 && sec.length <= 2) {
      pages.push({
        layout: pro ? 'photo-full' : 'title',
        title: sec[0].text,
        ...(sec[1] ? { subtitle: sec[1].text } : {}),
      })
      return
    }
    const [first, ...rest] = sec
    if (!rest.length) {
      const parts = splitLongBlock(first.text)
      if (parts.length === 1 && first.text.length <= 120) {
        pages.push({ layout: pro ? 'manifesto' : 'section', ...(pro ? { body: first.text } : { title: first.text }) })
      } else {
        pages.push(...buildOverflowPages({ layout: listLayout, bullets: parts }, pro))
      }
      return
    }
    pages.push(...buildOverflowPages({ layout: listLayout, title: first.text, bullets: rest.map((r) => r.text) }, pro))
  })
  return pages
}

/** Nếu AI trả lời bằng chữ thường hoặc {"action":"chat","reply":"..."} (người dùng chỉ hỏi đáp), trả về câu trả lời. */
export function parsePreserveChat(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('{') && !/"slides"\s*:/.test(trimmed)) return trimmed
  const data = parseAiObject(trimmed) as { action?: unknown; reply?: unknown; say?: unknown } | null
  if (data?.action === 'chat') {
    const msg = typeof data.reply === 'string' ? data.reply : typeof data.say === 'string' ? data.say : ''
    if (msg.trim()) return msg.trim()
  }
  return null
}

/**
 * Đọc JSON ánh xạ của AI và lắp nguyên văn 100% từ `blocks`.
 * Trả null nếu JSON không có mảng `slides` hợp lệ (để caller gọi retry hoặc fallback).
 */
export function assemblePreservedDeck(
  raw: string,
  blocks: PreserveBlock[],
  opts?: { pro?: boolean; proStyle?: ProStyle },
): PreserveResult | null {
  if (!blocks.length) return null
  const data = parseAiObject(raw) as {
    title?: unknown
    theme?: unknown
    stylePack?: unknown
    decorKit?: unknown
    ignoreIds?: unknown
    slides?: unknown
  } | null
  if (!data || !Array.isArray(data.slides) || !data.slides.length) return null

  const pro = opts?.pro === true
  const allowed = new Set<SlideLayoutId>(pro ? PRESERVE_PRO_LAYOUTS : PRESERVE_STD_LAYOUTS)
  const byId = new Map(blocks.map((b) => [b.id, b]))
  const ignored = new Set<number>()
  if (Array.isArray(data.ignoreIds)) {
    for (const id of data.ignoreIds) {
      if (typeof id === 'number' && Number.isInteger(id) && byId.has(id)) ignored.add(id)
    }
  }
  const used = new Set<number>()

  const take = (id: unknown): string | undefined => {
    if (typeof id !== 'number' || !Number.isInteger(id)) return undefined
    const b = byId.get(id)
    if (!b || used.has(id)) return undefined
    used.add(id)
    return b.text
  }
  const takeList = (ids: unknown): string[] => {
    if (!Array.isArray(ids)) return []
    const out: string[] = []
    for (const id of ids) {
      const t = take(id)
      if (t !== undefined) out.push(t)
    }
    return out
  }

  const assembled: AiSlidePayload[] = []
  for (const item of data.slides) {
    if (!item || typeof item !== 'object') continue
    const spec = item as PreserveSlideSpec
    const rawLayout = typeof spec.layout === 'string' && isLayoutId(spec.layout) ? spec.layout : undefined
    let layout: SlideLayoutId = rawLayout && allowed.has(rawLayout) ? rawLayout : (pro ? 'editorial-text' : 'bullets')

    const title = take(spec.titleId)
    const subtitle = take(spec.subtitleId)
    const kicker = take(spec.kickerId)
    const body = take(spec.bodyId)
    const items = takeList(spec.itemIds)
    const leftTitle = take(spec.leftTitleId)
    const rightTitle = take(spec.rightTitleId)
    const left = takeList(spec.leftIds)
    const right = takeList(spec.rightIds)
    const quote = take(spec.quoteId)
    const author = take(spec.authorId)
    const imagePrompt = typeof spec.imagePrompt === 'string' && spec.imagePrompt.trim() ? spec.imagePrompt.trim() : undefined
    const tone = isTone(spec.tone) ? spec.tone : undefined

    // Bỏ qua slide rỗng (AI chỉ định toàn ID trùng/không tồn tại)
    const hasAny = !!(title || subtitle || kicker || body || items.length || left.length || right.length || quote || author)
    if (!hasAny) continue

    let page: AiSlidePayload
    if (layout === 'title' || layout === 'section' || layout === 'closing' || layout === 'photo-full') {
      const allExtra = [body, ...items, ...left, ...right].filter((x): x is string => !!x)
      if (allExtra.length) {
        layout = pro ? 'editorial-text' : 'bullets'
        page = { layout, tone, title, bullets: [subtitle, ...allExtra].filter((x): x is string => !!x), imagePrompt }
      } else {
        page = { layout, tone, title: title ?? subtitle ?? kicker ?? '', subtitle: title ? subtitle : undefined, kicker, imagePrompt }
      }
    } else if (layout === 'quote') {
      const q = quote ?? body ?? items[0] ?? title ?? ''
      page = { layout, tone, quote: q, author: author ?? subtitle }
    } else if (layout === 'manifesto') {
      const b = body ?? quote ?? title ?? items[0] ?? ''
      page = { layout, tone, body: b, kicker, author: author ?? subtitle }
    } else if (layout === 'two-column') {
      const l = left.length ? left : items.slice(0, Math.ceil(items.length / 2))
      const r = right.length ? right : items.slice(Math.ceil(items.length / 2))
      if (!l.length || !r.length) {
        page = { layout: 'bullets', tone, title, bullets: [...l, ...r, ...(body ? [body] : [])] }
      } else {
        page = { layout: 'two-column', tone, title, leftTitle, rightTitle, left: l, right: r }
      }
    } else if (layout === 'cards') {
      const cardItems = items.length ? items : [body, ...left, ...right].filter((x): x is string => !!x)
      if (cardItems.length < 2) {
        page = { layout: 'bullets', tone, title, bullets: cardItems.length ? cardItems : [title ?? ''] }
      } else {
        page = { layout: 'cards', tone, title, items: cardItems }
      }
    } else if (layout === 'rules') {
      const ruleItems = items.length ? items : [body, ...left, ...right].filter((x): x is string => !!x)
      if (!ruleItems.length) {
        page = { layout: 'editorial-text', tone, title, bullets: [subtitle ?? title ?? ''] }
      } else {
        page = { layout: 'rules', tone, title, kicker, stats: ruleItems.map(splitRuleStat) }
      }
    } else if (layout === 'photo-compare') {
      const cap1 = left[0] ?? items[0] ?? body ?? ''
      const cap2 = right[0] ?? items[1] ?? subtitle ?? ''
      if (!cap1 || !cap2) {
        page = { layout: 'editorial-text', tone, title, bullets: [cap1, cap2].filter(Boolean), imagePrompt }
      } else {
        page = { layout: 'photo-compare', tone, title, caption: cap1, caption2: cap2, imagePrompt }
      }
    } else {
      // bullets | editorial-text | image-left | image-right: giữ mọi field đã take (kể cả subtitle/author nếu AI gán nhầm)
      const bullets = [
        ...(subtitle ? [subtitle] : []),
        ...(body ? [body] : []),
        ...items,
        ...left,
        ...right,
        ...(quote ? [quote] : []),
        ...(author ? [author] : []),
      ]
      if (!bullets.length && title) {
        page = { layout: pro ? 'manifesto' : 'section', tone, ...(pro ? { body: title } : { title }) }
      } else {
        page = { layout, tone, title, kicker, bullets, imagePrompt }
      }
    }

    assembled.push(...buildOverflowPages(page, pro))
  }

  // Bù mọi đoạn AI lỡ bỏ sót để đảm bảo giữ nguyên 100% văn bản gốc (bỏ qua dòng lời dặn trong ignoreIds nếu đã có nội dung slide)
  const missing = blocks.filter((b) => !used.has(b.id) && !(assembled.length > 0 && ignored.has(b.id)))
  if (missing.length) {
    assembled.push(...fallbackPreservePages(missing, pro))
  }
  if (!assembled.length) return null

  const theme = typeof data.theme === 'string' && THEME_IDS.has(data.theme) ? data.theme : 'sang'
  const deckTitle = typeof data.title === 'string' && data.title.trim() ? data.title.trim().slice(0, 120) : blocks[0].text.slice(0, 80)
  const planSlides: DeckPlanSlide[] = assembled.map((p, i) => ({
    title: p.title || p.body?.slice(0, 50) || `Slide ${i + 1}`,
    layout: p.layout ?? 'bullets',
    ...(isTone(p.tone) ? { tone: p.tone } : {}),
    brief: '',
  }))

  let plan: DeckPlan = {
    title: deckTitle,
    theme,
    mainIdeas: [],
    ...(typeof data.stylePack === 'string' && data.stylePack.trim() ? { stylePack: data.stylePack.trim() } : {}),
    ...(typeof data.decorKit === 'string' && data.decorKit.trim() ? { decorKit: data.decorKit.trim() } : {}),
    slides: planSlides,
  }
  if (pro) plan = proPlan(plan, opts?.proStyle)
  const decorKit = planDecorKit(plan)
  const pages = assembled.map((p) => ({ ...p, decorKit }))

  return { plan, pages, recovered: missing.length }
}
