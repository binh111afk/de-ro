/**
 * Layout engine cho slide: catalog 14 bố cục + dựng `SlideElement[]` từ nội dung.
 *
 * Toạ độ theo % khung slide, lề an toàn 5–8%. Mỗi phần tử có id vai trò cố định
 * (`title`, `bullets`, `card-1`, `option-2`…) để sau này AI sửa đúng chỗ như
 * command registry. Màu/font lấy từ theme + tông (theme/soft/accent), không
 * hardcode palette.
 */
import type { DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import { textBoxHeight } from './slideText'
import { fitFontSize } from './slideMeasure'
import { GRAPHIC_INK, graphicById, isGraphicId } from './slideGraphics'
import { pickSlideAsset, type SlideAssetId } from './slideAssets'
import { contrastRatio, mixHex, normalizeTheme, readableTextOn } from './slideTheme'

export type SlideLayoutId =
  | 'title'
  | 'section'
  | 'statement'
  | 'bullets'
  | 'cards'
  | 'two-column'
  | 'comparison'
  | 'quote'
  | 'closing'
  | 'agenda'
  | 'table'
  | 'image-left'
  | 'image-right'
  | 'image-full'
  | 'stats'
  | 'stat-image'
  | 'timeline'
  | 'cycle'
  | 'quiz'
  | 'example'
  | 'hook'

export interface SlideStat {
  value?: string
  label?: string
}

export interface SlideLayoutContent {
  title?: string
  kicker?: string
  subtitle?: string
  body?: string
  bullets?: string[]
  /** thẻ của layout cards */
  items?: string[]
  /** hai cột của layout two-column */
  left?: string[]
  right?: string[]
  /** nhãn đầu hai cột của layout comparison */
  leftTitle?: string
  rightTitle?: string
  quote?: string
  author?: string
  /** bảng của layout table — tối đa 8 hàng × 6 cột */
  rows?: string[][]
  /** ảnh của layout image-left/image-right (rỗng = khung chờ chọn ảnh) */
  image?: string
  /** id đồ hoạ vector (slideGraphics) — ưu tiên hơn ảnh AI khi phù hợp */
  graphic?: string
  /** số liệu lớn của layout stats */
  stats?: SlideStat[]
  /** các bước của timeline/cycle */
  steps?: string[]
  question?: string
  options?: string[]
  /** chỉ số (0-based), chữ cái A–D, hoặc khớp nguyên văn một phương án */
  answer?: string | number
  /** đề bài của layout example */
  problem?: string
  /** thanh kết luận của layout example */
  conclusion?: string
  /** giải thích đáp án của layout quiz */
  explanation?: string
}

export interface SlideLayoutDef {
  id: SlideLayoutId
  name: string
  description: string
  fields: Array<keyof SlideLayoutContent>
}

export const SLIDE_LAYOUTS: SlideLayoutDef[] = [
  {
    id: 'title',
    name: 'Tiêu đề',
    description: 'Trang bìa: nhãn nhỏ, tiêu đề lớn, dòng phụ — căn giữa, nền màu nhấn.',
    fields: ['kicker', 'title', 'subtitle'],
  },
  {
    id: 'section',
    name: 'Phần',
    description: 'Mở đầu một phần: nhãn, tiêu đề và mô tả ngắn căn trái.',
    fields: ['kicker', 'title', 'subtitle'],
  },
  {
    id: 'statement',
    name: 'Câu lớn',
    description: 'Một câu/ý lớn duy nhất, chữ to giữa slide — thay cho slide nhiều ý.',
    fields: ['kicker', 'body', 'author'],
  },
  {
    id: 'bullets',
    name: 'Danh sách',
    description: 'Tiêu đề + 2–6 ý chính, chữ tự co cho vừa khung.',
    fields: ['title', 'kicker', 'bullets'],
  },
  {
    id: 'cards',
    name: 'Thẻ',
    description: 'Tiêu đề + 2–6 thẻ nội dung xếp lưới (tối đa 3 cột).',
    fields: ['title', 'kicker', 'items'],
  },
  {
    id: 'two-column',
    name: 'Hai cột',
    description: 'Tiêu đề + hai cột ý chính, có vạch ngăn giữa.',
    fields: ['title', 'left', 'right'],
  },
  {
    id: 'comparison',
    name: 'So sánh',
    description: 'Hai panel đối lập (trước/sau, đúng/sai…) có nhãn riêng và huy hiệu VS ở giữa.',
    fields: ['title', 'leftTitle', 'left', 'rightTitle', 'right'],
  },
  {
    id: 'quote',
    name: 'Trích dẫn',
    description: 'Câu trích lớn, kèm tên tác giả. Nền dịu.',
    fields: ['quote', 'author'],
  },
  {
    id: 'closing',
    name: 'Kết thúc',
    description: 'Lời cảm ơn căn giữa và dòng phụ. Nền dịu.',
    fields: ['title', 'subtitle'],
  },
  {
    id: 'agenda',
    name: 'Nội dung bài',
    description: 'Panel màu bên trái + danh sách mục đánh số 01… bên phải.',
    fields: ['kicker', 'title', 'items'],
  },
  {
    id: 'table',
    name: 'Bảng',
    description: 'Tiêu đề + bảng dữ liệu (tối đa 6 cột × 8 hàng).',
    fields: ['title', 'rows'],
  },
  {
    id: 'image-left',
    name: 'Ảnh trái',
    description: 'Ảnh bên trái, tiêu đề + ý chính bên phải.',
    fields: ['title', 'image', 'bullets'],
  },
  {
    id: 'image-right',
    name: 'Ảnh phải',
    description: 'Tiêu đề + ý chính bên trái, ảnh bên phải.',
    fields: ['title', 'image', 'bullets'],
  },
  {
    id: 'image-full',
    name: 'Ảnh toàn trang',
    description: 'Ảnh phủ kín slide, thẻ chữ nhỏ ở góc dưới — slide ảnh chủ đạo.',
    fields: ['title', 'body', 'image'],
  },
  {
    id: 'stats',
    name: 'Số liệu',
    description: 'Tiêu đề + 1–4 con số nổi bật kèm nhãn.',
    fields: ['title', 'stats'],
  },
  {
    id: 'stat-image',
    name: 'Số liệu + ảnh',
    description: 'Hai số liệu lớn bên trái, ảnh phủ nửa phải.',
    fields: ['title', 'stats', 'image'],
  },
  {
    id: 'timeline',
    name: 'Tiến trình',
    description: 'Tiêu đề + 3–6 bước trên một trục ngang.',
    fields: ['title', 'steps'],
  },
  {
    id: 'cycle',
    name: 'Chu trình',
    description: 'Tiêu đề + 3–6 bước xếp vòng tròn.',
    fields: ['title', 'steps'],
  },
  {
    id: 'quiz',
    name: 'Câu hỏi',
    description: 'Câu hỏi + 2–4 phương án, đáp án đúng được tô màu, kèm thanh "Đáp án" có giải thích. Nền dịu.',
    fields: ['kicker', 'question', 'options', 'answer', 'explanation'],
  },
  {
    id: 'example',
    name: 'Ví dụ mẫu',
    description:
      'Bài mẫu có lời giải: đề bài bên trái, 2–4 bước giải đánh số bên phải, thanh kết luận ở dưới. ' +
      'Dùng cho toán/lý/hoá/tin (đề → các bước → kết quả) hoặc phân tích đoạn trích, sự kiện.',
    fields: ['title', 'problem', 'steps', 'conclusion'],
  },
  {
    id: 'hook',
    name: 'Mở bài',
    description:
      'Mở bài gợi mở: câu hỏi/tình huống trong bong bóng thoại + 2–3 gợi ý ngắn bên dưới. Nền dịu.',
    fields: ['kicker', 'title', 'body', 'items'],
  },
]

const LAYOUT_IDS = new Set<string>(SLIDE_LAYOUTS.map((layout) => layout.id))

export function isLayoutId(value: unknown): value is SlideLayoutId {
  return typeof value === 'string' && LAYOUT_IDS.has(value)
}

const TONES = new Set<string>(['theme', 'soft', 'accent'])

export function isTone(value: unknown): value is SlideTone {
  return typeof value === 'string' && TONES.has(value)
}

/** Tông mặc định theo layout (title/section nền nhấn, quote/quiz/closing nền dịu). */
export function defaultTone(layoutId: string): SlideTone {
  const id: SlideLayoutId = isLayoutId(layoutId) ? layoutId : 'bullets'
  if (id === 'title' || id === 'section' || id === 'statement') return 'accent'
  if (id === 'quote' || id === 'quiz' || id === 'closing' || id === 'agenda' || id === 'hook') return 'soft'
  return 'theme'
}

/* ------------------------------------------------------------------ *
 * Bảng màu theo tông
 * ------------------------------------------------------------------ */
interface LayoutPalette {
  tone: SlideTone
  background: string
  fg: string
  muted: string
  accent: string
  secondary: string
  surface: string
  /** nền thẻ/panel — tách khỏi nền slide đủ để nhìn thấy trên mọi theme */
  panel: string
  /** màu chữ nhấn (kicker, số thứ tự) — đậm đủ 4,5:1 trên nền */
  ink: string
  /** chữ đặt trên nền `accent` */
  onAccent: string
  /** token hình khối lấy từ theme */
  radius: number
  shadow: 'none' | 'soft' | 'hard'
  border: number
  borderColor: string
}

/** Lùi `color` về phía mực chữ tới khi đạt 4,5:1 trên **mọi** nền trong `bgs`. */
function legible(color: string, bgs: string[], fg: string): string {
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = mixHex(color, fg, t)
    if (bgs.every((bg) => contrastRatio(candidate, bg) >= 4.5)) return candidate
  }
  return fg
}

function paletteOf(theme: ReturnType<typeof normalizeTheme>, tone: SlideTone): LayoutPalette {
  const onAccent = readableTextOn(theme.accent)
  const base = {
    tone,
    fg: theme.fg,
    accent: theme.accent,
    secondary: theme.secondary,
    onAccent,
    radius: theme.radius,
    shadow: theme.shadow,
    border: theme.border,
    borderColor: theme.borderColor,
  }
  // Nền + tỉ lệ pha accent cho panel: panel đủ nhạt để chữ đọc thoải mái và
  // accent chỉ chiếm diện tích nhỏ (vạch, badge), không tô cả khối chữ.
  const pick =
    tone === 'accent'
      ? { background: mixHex(theme.bg, theme.accent, theme.dark ? 0.2 : 0.07), surface: theme.bg, panelMix: theme.dark ? 0.18 : 0.14 }
      : tone === 'soft'
        ? { background: theme.surface, surface: theme.bg, panelMix: theme.dark ? 0.18 : 0.14 }
        : { background: theme.bg, surface: theme.surface, panelMix: theme.dark ? 0.18 : 0.12 }
  const panel = mixHex(pick.background, theme.accent, pick.panelMix)
  const bgs = [pick.background, panel, pick.surface]
  return {
    ...base,
    background: pick.background,
    surface: pick.surface,
    panel,
    // chữ phụ/nhấn phải đọc được trên cả nền slide lẫn panel/thẻ
    muted: legible(theme.muted, bgs, theme.fg),
    ink: legible(theme.accent, bgs, theme.fg),
  }
}

/** Màu nền của slide ứng với tông — caller ghi vào `Slide.background`. */
export function toneBackground(theme: DeckTheme, tone: SlideTone = 'theme'): string {
  return paletteOf(normalizeTheme(theme), isTone(tone) ? tone : 'theme').background
}

/* ------------------------------------------------------------------ *
 * Dựng phần tử
 * ------------------------------------------------------------------ */
type Box = Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>

/** Cỡ chữ thiết kế (trước khi co) của hộp chữ do `textEl` dựng — để đo mức bị co. */
const BASE_SIZE = new WeakMap<SlideElement, number>()

/** Tỉ lệ cỡ chữ cuối / cỡ thiết kế (1 = không co); `undefined` nếu không phải hộp của `textEl`. */
export function fitRatio(el: SlideElement): number | undefined {
  const base = BASE_SIZE.get(el)
  return base && el.fontSize ? el.fontSize / base : undefined
}

function textEl(
  id: string,
  value: string | undefined,
  box: Box,
  style: Partial<SlideElement>,
): SlideElement | null {
  const text = value?.trim()
  if (!text) return null
  const lineHeight = style.lineHeight ?? (style.variant === 'title' ? 1.15 : 1.4)
  const baseSize = style.fontSize ?? (style.variant === 'title' ? 4.2 : 2.6)
  // Đo trước khi đặt (chặng 1): chọn cỡ chữ vừa hộp ngay lúc dựng layout để
  // editor, thumbnail và PPTX dùng chung một cỡ. Trước đây mỗi renderer tự co
  // (FitText) còn PPTX thì không → bản xuất lệch với màn hình.
  const letterSpacing = style.letterSpacing ?? (id === 'kicker' ? 0.12 : undefined)
  // Padding dọc của hộp (2cqw ≈ 3,6% chiều cao) ăn vào cả hộp thấp: một dòng
  // 1,8cqw cần ≥ 8%. Hộp canh trên thấp hơn mức đó thì nới xuống thay vì co chữ
  // xuống 60% (kicker 1,2cqw đọc không nổi). Hộp canh giữa giữ nguyên để không lệch tâm.
  const oneLine = textBoxHeight(text.split('\n')[0], 1000, baseSize, lineHeight)
  if (!style.valign && box.h < oneLine) box = { ...box, h: oneLine }
  const fontSize = fitFontSize({
    text,
    widthPct: box.w,
    heightPct: box.h,
    baseCqw: baseSize,
    lineHeight,
    // Renderer mặc định title 600 / body 500 (SlideElView) — đo đúng độ đậm đó.
    weight: style.fontWeight ?? (style.variant === 'title' ? 600 : 500),
    letterSpacing,
    // Tiêu đề dài được phép co sâu hơn thân bài (55% so với 60%) — hộp tiêu đề
    // của layout chỉ cao 12–13% nên 60% không đủ cho tiêu đề 60–80 ký tự.
    minScale: style.variant === 'title' ? 0.55 : undefined,
  })
  const el: SlideElement = {
    id,
    type: 'text',
    text,
    ...box,
    // Hộp chữ của layout giữ đúng hình học đã dựng; auto-height chỉ dành cho hộp
    // người dùng tự kéo (chặng 20) — nếu không thẻ/hai cột sẽ teo còn một dòng.
    fixedHeight: true,
    ...(id === 'kicker' ? { letterSpacing: 0.12 } : {}),
    ...style,
    fontSize,
    lineHeight,
  }
  BASE_SIZE.set(el, baseSize)
  return el
}

function shapeEl(
  id: string,
  box: Box,
  fill: string,
  shape: SlideElement['shape'] = 'rect',
): SlideElement {
  return { id, type: 'shape', shape, fill, ...box }
}

function iconEl(id: string, assetId: SlideAssetId, box: Box, color: string): SlideElement {
  return { id, type: 'icon', assetId, textColor: color, ...box }
}

/** Đồ hoạ vector có sẵn (chặng 2) — không gọi vẽ ảnh, đổi nét theo theme. */
function graphicEl(id: string, graphicId: string, box: Box, ink: string): SlideElement {
  return { id, type: 'graphic', graphicId, textColor: ink, ...box }
}

/** Asset trang trí (`orn-*`): đặt theo bề rộng, chiều cao suy từ tỉ lệ thật của hình trên khung 16:9. */
function ornament(id: string, ornId: string, x: number, y: number, w: number, ink: string, centerY = false): SlideElement | null {
  const ratio = graphicById(ornId)?.ratio
  if (!ratio) return null
  const h = (w * 16) / (9 * ratio)
  return graphicEl(id, ornId, { x, y: centerY ? y - h / 2 : y, w, h }, ink)
}

/**
 * Thẻ số 1–5 (pastel + nét tối `GRAPHIC_INK`): chỉ đặt khi nền `bg` đủ sáng để nét đọc được,
 * ngược lại trả null để caller dùng chấm/huy hiệu theo theme.
 */
function numberTag(id: string, n: number, bg: string, x: number, cy: number, w: number): SlideElement | null {
  if (n < 1 || n > 5 || contrastRatio(bg, GRAPHIC_INK) < 4.5) return null
  return ornament(id, `orn-the-so-${n}`, x, cy, w, GRAPHIC_INK, true)
}

/** Tấm nền sáng cố định cho đồ hoạ thiết kế sẵn (nét tối + mảng pastel). */
const GRAPHIC_PLATE = '#f7f9fc'

/**
 * Đồ hoạ thiết kế sẵn có nét `#22333B` và mảng pastel — đổi nét thành trắng trên
 * panel màu nhấn (hoặc nét sáng trên nền tối) làm pastel và nét lẫn vào nhau.
 * Đặt trên một tấm nền sáng cố định với đúng nét gốc: tương phản luôn tốt, mọi theme.
 */
function graphicPlate(id: string, graphicId: string, box: Box, p: LayoutPalette): SlideElement[] {
  const inset = 1.4
  const insetY = inset * (16 / 9)
  return [
    { ...shapeEl(`${id}-plate`, box, GRAPHIC_PLATE, 'round'), radius: Math.min(p.radius, 18) },
    graphicEl(id, graphicId, {
      x: box.x + inset,
      y: box.y + insetY,
      w: box.w - inset * 2,
      h: box.h - insetY * 2,
    }, GRAPHIC_INK),
  ]
}

/** Đồ hoạ AI chọn, chỉ nhận id có trong catalog. */
function chosenGraphic(content: SlideLayoutContent): string | undefined {
  return content.graphic && isGraphicId(content.graphic) ? content.graphic : undefined
}

const compact = (items: Array<SlideElement | null>): SlideElement[] =>
  items.filter((el): el is SlideElement => el !== null)

/** Vùng tiêu đề chung của các layout nội dung (y 7→23); nội dung bắt đầu từ y ≥ 24. */
const HEADER_BOX: Box = { x: 8, y: 7, w: 84, h: 16 }
const HEADER_SIZES = [4.3, 3.8, 3.4, 3.1, 2.9]

/** Đáy thấp nhất của một cụm phần tử (tiêu đề + vạch) để xếp nội dung ngay dưới. */
const bottomOf = (els: SlideElement[]): number => els.reduce((m, el) => Math.max(m, el.y + el.h), 0)

/**
 * Tiêu đề + vạch nhấn xếp chồng theo chiều cao đã đo: chọn cỡ lớn nhất trong
 * `sizes` mà tiêu đề vừa `box.h` (cho phép 2 dòng thay vì co sàn), hộp ôm đúng
 * nội dung và vạch nằm ngay dưới chữ — không còn `y` cứng cắt ngang tiêu đề.
 */
function titleEls(
  p: LayoutPalette,
  title: string | undefined,
  box: Box,
  sizes: number[],
  rule = false,
  color = p.fg,
): SlideElement[] {
  const text = title?.trim()
  if (!text) return []
  const need = (size: number) => textBoxHeight(text, box.w, size, 1.15, { weight: 700 })
  const size = sizes.find((s) => need(s) <= box.h) ?? sizes[sizes.length - 1]
  const h = Math.min(box.h, Math.max(4, need(size)))
  return compact([
    textEl('title', text, { ...box, h }, {
      variant: 'title', fontSize: size, fontWeight: 700, textColor: color,
    }),
    rule ? ornament('title-rule', 'orn-ke-song-ngan', box.x, box.y + h + 1.25, 10, p.accent, true) : null,
  ])
}

const cleanList = (list?: string[]): string[] =>
  (list ?? []).map((item) => item.trim()).filter(Boolean)

const linesOf = (text?: string): string[] =>
  (text ?? '')
    .split('\n')
    .map((line) => line.replace(/^[•\-–]\s*/, '').trim())
    .filter(Boolean)

const bulletText = (items: string[]): string => items.map((item) => `• ${item}`).join('\n')

const suffixOf = (id: string): number => Number(id.match(/(\d+)/)?.[1] ?? 0)

/** Cỡ chữ nội dung co theo lượng chữ (cqw). */
function bodySize(text: string): number {
  if (text.length > 420) return 2.25
  if (text.length > 260) return 2.6
  return 3
}

/** Ít ý thì chữ to hơn để slide không trống; nhiều ý giữ cỡ theo độ dài. */
function listSize(count: number, text: string): number {
  if (count <= 2) return 3.6
  if (count === 3) return 3.25
  return bodySize(text)
}

function composeTitle(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const hasKicker = Boolean(content.kicker?.trim())
  const y = hasKicker ? 34 : 30
  const graphic = chosenGraphic(content)
  return compact([
    // Bìa cần một neo thị giác có chủ đích: panel màu bên phải thay cho chấm trang trí rời.
    // Huy hiệu tròn (không còn khối panel cao nửa trống): vòng accent + hình đặt giữa.
    shapeEl('hero-panel', { x: 67, y: 20, w: 26, h: 46.2 }, p.accent, 'ellipse'),
    // Ảnh AI (sinh nền sau khi slide đã hiện) thay hình có sẵn: ảnh cắt tròn trong vòng accent.
    ...(content.image
      ? [{ id: 'hero-image', type: 'image' as const, shape: 'ellipse' as const, src: content.image, x: 69, y: 23.5, w: 22, h: 39.1 }]
      : graphic
      ? [
          shapeEl('hero-graphic-plate', { x: 70, y: 25.3, w: 20, h: 35.6 }, GRAPHIC_PLATE, 'ellipse'),
          graphicEl('hero-graphic', graphic, { x: 73.5, y: 31.5, w: 13, h: 23.1 }, GRAPHIC_INK),
        ]
      : [iconEl('hero-icon', pickSlideAsset(`${content.title ?? ''} ${content.kicker ?? ''}`) ?? 'idea', { x: 73, y: 30.65, w: 14, h: 24.9 }, p.onAccent)]),
    p.tone === 'accent'
      ? shapeEl('accent-band', { x: 0, y: 0, w: 100, h: 1.4 }, p.accent)
      : null,
    textEl('kicker', content.kicker, { x: 9, y: 25, w: 56, h: 6.5 }, {
      variant: 'body', fontSize: 1.8, fontWeight: 700, textColor: p.ink,
    }),
    textEl('title', content.title, { x: 9, y, w: 58, h: 30 }, {
      variant: 'title', fontSize: 5.3, fontWeight: 700, textColor: p.fg,
    }),
    textEl('subtitle', content.subtitle, { x: 9, y: y + 34, w: 54, h: 17 }, {
      variant: 'body', fontSize: 2.4, textColor: p.muted,
    }),
  ])
}

function composeSection(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  if (!content.title?.trim()) return []
  // Xếp chồng theo chiều cao đo: kicker có thể xuống 2 dòng, tiêu đề đi ngay dưới.
  const kicker = content.kicker?.trim()
  const kickerH = kicker
    ? Math.min(13, textBoxHeight(kicker, 24, 1.7, 1.4, { weight: 700, letterSpacing: 0.12 }))
    : 0
  const titleY = kicker ? 27 + kickerH + 1.5 : 34
  return compact([
    shapeEl('section-panel', { x: 0, y: 0, w: 34, h: 100 }, p.accent),
    textEl('kicker', kicker, { x: 5, y: 27, w: 24, h: kickerH }, {
      variant: 'body', fontSize: 1.7, fontWeight: 700, textColor: p.onAccent,
    }),
    ...titleEls(p, content.title, { x: 5, y: titleY, w: 25, h: 68 - titleY }, [4.1, 3.6, 3.2, 2.8, 2.5], false, p.onAccent),
    ornament('section-rule', 'orn-ke-song-ngan', 5, 70.45, 10, p.onAccent, true),
    textEl('subtitle', content.subtitle, { x: 42, y: 40, w: 48, h: 20 }, {
      variant: 'body', fontSize: 2.6, textColor: p.fg, valign: 'middle',
    }),
  ])
}

function composeStatement(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const text =
    content.body?.trim() ||
    content.quote?.trim() ||
    cleanList(content.bullets).join(' ')
  if (!text) return []
  return compact([
    ornament('decor-1', 'orn-nhanh-hoa-goc', 88, 3, 8, p.ink),
    ornament('decor-2', 'orn-canh-hoa-roi', 4, 76, 9, p.ink),
    textEl('kicker', content.kicker, { x: 14, y: 18, w: 76, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    // Câu dài (> 90 ký tự) hạ cỡ để vẫn là một khối gọn thay vì tràn hộp.
    textEl('body', text, { x: 14, y: 27, w: 76, h: 42 }, {
      variant: 'title', fontSize: text.length > 90 ? 3.7 : 4.6, fontWeight: 600, textColor: p.fg,
    }),
    shapeEl('rule', { x: 14, y: 73, w: 12, h: 0.7 }, p.accent),
    textEl('author', content.author, { x: 14, y: 77, w: 76, h: 8 }, {
      variant: 'body', fontSize: 1.8, fontWeight: 600, textColor: p.muted,
    }),
  ])
}

function composeBullets(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  let lines = cleanList(content.bullets)
  if (lines.length === 0) lines = linesOf(content.body)
  if (lines.length === 0) return []
  const text = bulletText(lines)
  const size = listSize(lines.length, text)
  const graphic = chosenGraphic(content)
  // không có kicker thì tiêu đề được nhích lên và cao hơn → 2 dòng vẫn giữ cỡ lớn
  const headerBox: Box = content.kicker?.trim() ? { x: 8, y: 15, w: 84, h: 15 } : { x: 8, y: 10, w: 84, h: 20 }
  const header = titleEls(p, content.title, headerBox, [4.2, 3.8, 3.4, 3.1, 2.8], true)
  // Vùng nội dung bắt đầu dưới tiêu đề/vạch (đã đo), không còn y cố định.
  const regionTop = Math.max(33, bottomOf(header) + 3)
  const regionH = 96 - regionTop
  // Khối ý bám chiều cao thật rồi canh giữa vùng nội dung, không dồn sát đỉnh.
  const boxH = Math.min(regionH - 6, Math.max(24, textBoxHeight(text, 56, size, 1.4, { weight: 500 }) * 1.3))
  const top = regionTop + (regionH - boxH) / 2
  return compact([
    shapeEl('content-panel', { x: 7, y: top - 3, w: 66, h: boxH + 6 }, p.panel, 'round'),
    shapeEl('accent-rail', { x: 5.6, y: top, w: 0.9, h: boxH }, p.accent),
    // Neo thị giác semantic bên phải: graph/icon theo chủ đề thay cho khối số vô nghĩa.
    ...(graphic
      ? graphicPlate('bullet-graphic', graphic, { x: 76, y: top + 2, w: 15, h: 21 }, p)
      : [
          shapeEl('bullet-anchor', { x: 76, y: top + 2, w: 15, h: 21 }, p.accent, 'round'),
          iconEl('bullet-anchor-icon', pickSlideAsset(content.title ?? text) ?? 'idea', { x: 77, y: top + 3.5, w: 13, h: 18 }, p.onAccent),
        ]),
    textEl('kicker', content.kicker, { x: 8, y: 9, w: 84, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    ...header,
    textEl('bullets', text, { x: 8, y: top, w: 56, h: boxH }, {
      variant: 'body', fontSize: size, textColor: p.fg, valign: 'middle',
    }),
  ])
}

/** "Nhãn: mô tả" trong một mục thẻ → tiêu đề ngắn + phần mô tả. */
function splitCardItem(item: string): { heading: string; body: string } {
  const at = item.indexOf(':')
  if (at <= 0 || at > 44) return { heading: item, body: '' }
  const heading = item.slice(0, at).trim()
  const body = item.slice(at + 1).trim()
  return { heading: heading || item, body }
}

function composeCards(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  let items = cleanList(content.items)
  if (items.length === 0) items = cleanList(content.bullets)
  if (items.length < 2) return []
  const picked = items.slice(0, 6)
  const used = new Set<SlideAssetId>()
  // 4 thẻ → lưới 2×2 kiểu "illustration card": badge tròn góc trái, tiêu đề cạnh
  // badge, minh hoạ trái và mô tả phải (theo mẫu slide giáo dục).
  const wide = picked.length === 4
  const cols = picked.length <= 3 ? picked.length : picked.length === 4 ? 2 : 3
  const rows = Math.ceil(picked.length / cols)
  const gap = 3
  // Vùng thẻ kết thúc ở y=93 (lề đáy ≥ 7%); trước đây thẻ chạm sát mép dưới slide.
  const area = { x: 8, y: 25, w: 84, h: 68 }
  const cardW = (area.w - gap * (cols - 1)) / cols
  const cardH = rows === 1 ? 46 : (area.h - gap * (rows - 1)) / rows
  const totalH = rows * cardH + (rows - 1) * gap
  const startY = area.y + (area.h - totalH) / 2

  const cards = picked.flatMap((item, index) => {
    const x = area.x + (index % cols) * (cardW + gap)
    const y = startY + Math.floor(index / cols) * (cardH + gap)
    const asset = pickSlideAsset(item, used)
    const split = wide ? splitCardItem(item) : { heading: '', body: item }
    // Không có "Nhãn: mô tả" mà cả mục dài → là một câu mô tả, đặt vào ô nội dung
    // (ô tiêu đề hẹp sẽ co chữ còn ~1,4cqw như thẻ "since 2020 …" trước đây).
    const longPlain = wide && !split.body && split.heading.length > 28
    const heading = longPlain ? '' : split.heading
    const body = longPlain ? split.heading : split.body

    if (wide) {
      // Thẻ 2×2: hàng đầu = badge số + tiêu đề (+ icon nhỏ góc phải nếu có), mô tả
      // chiếm cả bề rộng thẻ bên dưới — không còn nhét chữ vào cột hẹp cạnh icon.
      const badgeW = 6.6
      const badgeH = (badgeW * 16) / 9
      const iconW = 7
      // Không có tiêu đề: mô tả dùng cả khoảng bên phải badge (cao gần cả thẻ) thay vì
      // nằm dưới một hàng tiêu đề trống — chữ lớn gấp rưỡi.
      const solo = !heading
      const bodyBox: Box = solo
        ? { x: x + 10.5, y: y + 2, w: cardW - 13 - (asset ? iconW + 1 : 0), h: cardH - 4 }
        : { x: x + 2.5, y: y + 14, w: cardW - 5, h: cardH - 16 }
      const font =
        [2.5, 2.3, 2.1, 1.95, 1.85].find(
          (size) => !body || textBoxHeight(body, bodyBox.w, size, 1.45, { weight: 400 }) <= bodyBox.h,
        ) ?? 1.8
      return [
        { id: `card-${index + 1}-panel`, type: 'shape', shape: 'round', fill: p.surface, shadow: p.shadow !== 'none', radius: p.radius, border: p.border, borderColor: p.borderColor, x, y, w: cardW, h: cardH } as SlideElement,
        shapeEl(`card-${index + 1}-badge`, { x: x + 2, y: y + 2, w: badgeW, h: badgeH }, p.accent, 'ellipse'),
        textEl(`card-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
          x: x + 2, y: y + 2, w: badgeW, h: badgeH,
        }, {
          variant: 'body', fontSize: 1.9, fontWeight: 700, textColor: p.onAccent,
          align: 'center', valign: 'middle',
        }),
        textEl(`card-${index + 1}-heading`, heading, { x: x + 10.5, y: y + 2.5, w: cardW - 12.5 - (asset ? iconW + 1 : 0), h: 11 }, {
          variant: 'title', fontSize: heading.length > 24 ? 2.1 : 2.5, fontWeight: 700, textColor: p.fg,
        }),
        asset
          ? iconEl(`card-${index + 1}-icon`, asset, { x: x + cardW - iconW - 2, y: y + 2.5, w: iconW, h: 12 }, p.accent)
          : null,
        textEl(`card-${index + 1}`, body, bodyBox, {
          variant: 'body', fontSize: font, fontWeight: 400, textColor: p.fg, ...(solo ? { valign: 'middle' as const } : {}),
        }),
      ]
    }

    // Badge co theo bề rộng thẻ, không theo khung slide (thẻ 2 cột hẹp hơn 3 cột).
    const badgeW = Math.min(11, cardW * 0.26)
    const badgeH = badgeW * 1.25
    const textTop = y + 3 + badgeH + 2
    const available = y + cardH - 2 - textTop
    const font =
      [3.15, 2.9, 2.6, 2.3, 2.1, 1.9].find(
        (size) => textBoxHeight(item, cardW - 5, size, 1.4) <= available,
      ) ?? 1.8
    const panel: SlideElement = {
      id: `card-${index + 1}-panel`,
      type: 'shape',
      shape: 'round',
      fill: p.panel,
      shadow: p.shadow !== 'none',
      radius: p.radius,
      border: p.border,
      borderColor: p.borderColor,
      x,
      y,
      w: cardW,
      h: cardH,
    }
    return [
      panel,
      shapeEl(`card-${index + 1}-stripe`, { x, y, w: cardW, h: 0.9 }, p.accent),
      asset ? shapeEl(`card-${index + 1}-icon-badge`, { x: x + cardW - badgeW - 2.5, y: y + 3, w: badgeW, h: badgeH }, p.accent, 'round') : null,
      asset ? iconEl(`card-${index + 1}-icon`, asset, { x: x + cardW - badgeW - 1.8, y: y + 3.4, w: badgeW - 1.4, h: badgeH - 0.8 }, p.onAccent) : null,
      textEl(`card-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
        x: x + 2.5,
        y: y + 3,
        w: cardW - badgeW - 7,
        h: 7,
      }, {
        variant: 'body', fontSize: 1.35, fontWeight: 700, textColor: p.ink,
      }),
      textEl(`card-${index + 1}`, item, {
        x: x + 2.5,
        y: textTop,
        w: cardW - 5,
        h: cardH - (textTop - y) - 2,
      }, {
        variant: 'body', fontSize: font, fontWeight: 500, textColor: p.fg, valign: 'middle',
      }),
    ]
  })

  return compact([
    ...titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true),
    ...cards,
  ])
}

function splitTwoColumns(content: SlideLayoutContent): { left: string[]; right: string[] } {
  let left = cleanList(content.left)
  let right = cleanList(content.right)
  if (left.length === 0 && right.length === 0) {
    let lines = cleanList(content.bullets)
    if (lines.length === 0) lines = linesOf(content.body)
    const half = Math.ceil(lines.length / 2)
    left = lines.slice(0, half)
    right = lines.slice(half)
  }
  return { left, right }
}

/** "Nhãn: mô tả" → nhãn đậm + mô tả; không có nhãn ngắn thì chỉ có mô tả. */
function splitLabel(item: string): { label: string; text: string } {
  const at = item.indexOf(':')
  if (at < 2 || at > 28) return { label: '', text: item }
  const label = item.slice(0, at).trim()
  const text = item.slice(at + 1).trim()
  return label && text && !label.includes('$') ? { label, text } : { label: '', text: item }
}

function composeTwoColumn(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const { left, right } = splitTwoColumns(content)
  if (left.length === 0 && right.length === 0) return []
  const both = left.length > 0 && right.length > 0
  const boxFor = (side: 'left' | 'right'): Box =>
    both
      ? { x: side === 'left' ? 8 : 53, y: 27, w: 39, h: 60 }
      : { x: 8, y: 27, w: 84, h: 60 }
  const columns = { left: left.map(splitLabel), right: right.map(splitLabel) }
  const labelled = [...columns.left, ...columns.right].some((block) => block.label)

  if (!labelled) {
    const size = left.length + right.length <= 4 ? 3.2 : 2.8
    return compact([
      ...titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true),
      both ? shapeEl('divider', { x: 49.4, y: 27, w: 0.6, h: 60 }, p.muted) : null,
      textEl('body', bulletText(left), boxFor('left'), {
        variant: 'body', fontSize: size, textColor: p.fg, valign: 'middle',
      }),
      textEl('body-2', bulletText(right), boxFor('right'), {
        variant: 'body', fontSize: size, textColor: p.fg, valign: 'middle',
      }),
    ])
  }

  // Có "Nhãn: mô tả" (các bước, khái niệm…): mỗi ý là nhãn đậm màu nhấn + mô tả,
  // xếp chồng theo chiều cao đo và dùng CHUNG một cỡ chữ cho cả hai cột.
  const colW = both ? 39 : 84
  const blockGap = 0.9
  // Mỗi hộp có đệm dọc ~3,6%: nhãn và mô tả xếp sát nhau (nhãn bớt 1,8%) cho đỡ loãng.
  const labelH = (label: string, size: number) =>
    textBoxHeight(label, colW, size, 1.3, { weight: 700 }) - 1.8
  const heightOf = (blocks: Array<{ label: string; text: string }>, size: number) =>
    blocks.reduce(
      (sum, block) =>
        sum +
        (block.label ? labelH(block.label, size) : 0) +
        textBoxHeight(block.text, colW, size * 0.95, 1.4, { weight: 500 }) +
        blockGap,
      0,
    )
  const SIZES = [3.2, 3, 2.8, 2.6, 2.4, 2.2, 2.1, 2.0]
  const size =
    SIZES.find((s) => Math.max(heightOf(columns.left, s), heightOf(columns.right, s)) <= 62) ??
    SIZES[SIZES.length - 1]
  const used = Math.max(heightOf(columns.left, size), heightOf(columns.right, size))
  const top = 27 + Math.max(0, (60 - used) / 2)

  const column = (side: 'left' | 'right') => {
    const box = boxFor(side)
    let y = top
    return columns[side].flatMap((block, index) => {
      const out: Array<SlideElement | null> = []
      const id = `${side}-${index + 1}`
      if (block.label) {
        const h = labelH(block.label, size)
        out.push(
          textEl(`${id}-heading`, block.label, { x: box.x, y, w: colW, h }, {
            variant: 'body', fontSize: size, fontWeight: 700, lineHeight: 1.3, textColor: p.ink,
          }),
        )
        y += h
      }
      const h = textBoxHeight(block.text, colW, size * 0.95, 1.4, { weight: 500 })
      out.push(
        textEl(id, block.text, { x: box.x, y, w: colW, h }, {
          variant: 'body', fontSize: size * 0.95, textColor: p.fg,
        }),
      )
      y += h + blockGap
      return out
    })
  }

  return compact([
    ...titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true),
    both ? shapeEl('divider', { x: 49.4, y: 27, w: 0.6, h: 60 }, p.muted) : null,
    ...column('left'),
    ...column('right'),
  ])
}

function composeComparison(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const left = cleanList(content.left)
  const right = cleanList(content.right)
  if (left.length === 0 && right.length === 0) return []
  const side = (
    items: string[],
    title: string | undefined,
    x: number,
    color: string,
  ): Array<SlideElement | null> => [
    {
      id: x < 50 ? 'left-panel' : 'right-panel',
      type: 'shape',
      shape: 'round',
      fill: p.panel,
      x,
      y: 25.5,
      w: 40,
      h: 66,
    },
    textEl(x < 50 ? 'left-title' : 'right-title', title, { x: x + 2, y: 28, w: 36, h: 8 }, {
      variant: 'body', fontSize: 2.1, fontWeight: 700, textColor: color, align: 'center',
    }),
    textEl(x < 50 ? 'body' : 'body-2', bulletText(items), { x: x + 2.5, y: 38, w: 35, h: 51 }, {
      variant: 'body', fontSize: 2.8, textColor: p.fg, valign: 'middle',
    }),
  ]

  return compact([
    ...titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true),
    ...side(left, content.leftTitle, 8, p.ink),
    ...side(right, content.rightTitle, 52, p.ink),
    shapeEl('vs-badge', { x: 47.5, y: 52, w: 5, h: 8.9 }, p.accent, 'ellipse'),
    textEl('mark', 'VS', { x: 47.5, y: 52, w: 5, h: 8.9 }, {
      variant: 'body', fontSize: 1.6, fontWeight: 700, textColor: p.onAccent, align: 'center',
      valign: 'middle',
    }),
  ])
}

function composeQuote(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const quote =
    content.quote?.trim() || linesOf(content.body).join(' ') || cleanList(content.bullets)[0]
  if (!quote) return []
  return compact([
    textEl('mark', '“', { x: 8, y: 12, w: 12, h: 16 }, {
      variant: 'title', fontSize: 9, fontWeight: 700, textColor: p.ink,
    }),
    shapeEl('quote-bar', { x: 8, y: 28, w: 0.5, h: 32 }, p.accent),
    textEl('quote', quote, { x: 13, y: 28, w: 75, h: 30 }, {
      variant: 'body', fontSize: 3.2, fontStyle: 'italic', textColor: p.fg,
    }),
    textEl('author', content.author, { x: 13, y: 60, w: 75, h: 8 }, {
      variant: 'body', fontSize: 1.8, fontWeight: 600, textColor: p.ink,
    }),
  ])
}

function composeClosing(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const title = content.title?.trim() || content.body?.trim()
  if (!title) return []
  return compact([
    ornament('decor-1', 'orn-canh-la', 5, 6, 12, p.ink),
    ornament('decor-2', 'orn-bo-hoa', 85, 72, 10, p.ink),
    shapeEl('accent-line', { x: 47, y: 32, w: 6, h: 0.8 }, p.accent),
    textEl('title', title, { x: 8, y: 36, w: 84, h: 18 }, {
      variant: 'title', fontSize: 5.2, fontWeight: 700, textColor: p.fg, align: 'center',
    }),
    textEl('subtitle', content.subtitle, { x: 12, y: 57, w: 76, h: 16 }, {
      variant: 'body', fontSize: 2.2, textColor: p.muted, align: 'center',
    }),
  ])
}

/** Mục lục: panel màu bên trái, danh sách đánh số 01… bên phải. */
function composeAgenda(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const items = (cleanList(content.items).length
    ? cleanList(content.items)
    : cleanList(content.bullets)
  ).slice(0, 5)
  if (items.length === 0) return []
  const top = 22
  const rowH = 68 / items.length

  // Kicker có thể xuống 2 dòng: đo rồi đặt tiêu đề ngay dưới, không đè lên nhau.
  const agendaKicker = content.kicker?.trim()
  const agendaKickerH = agendaKicker
    ? Math.min(12, textBoxHeight(agendaKicker, 24, 1.6, 1.4, { weight: 600, letterSpacing: 0.12 }))
    : 0
  const agendaTitleY = agendaKicker ? 24 + agendaKickerH + 1.5 : 28
  return compact([
    {
      id: 'side-panel',
      type: 'shape',
      x: 0,
      y: 0,
      w: 34,
      h: 100,
      fill: p.accent,
    },
    textEl('kicker', agendaKicker, { x: 6, y: 24, w: 24, h: agendaKickerH }, {
      variant: 'body', fontSize: 1.6, fontWeight: 600, textColor: p.onAccent,
    }),
    ...titleEls(p, content.title, { x: 6, y: agendaTitleY, w: 24, h: 63 - agendaTitleY }, [3.2, 2.9, 2.6, 2.4], false, p.onAccent),
    shapeEl('rule', { x: 6, y: 66, w: 9, h: 0.7 }, p.onAccent),
    ...items.flatMap((item, index) => {
      const y = top + index * rowH
      return [
        textEl(`card-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
          x: 41, y: y + 1, w: 8, h: 7,
        }, {
          variant: 'body', fontSize: 2.2, fontWeight: 700, textColor: p.ink,
        }),
        textEl(`card-${index + 1}`, item.replace(/^\s*\d{1,2}\s*[.)·:\-–]\s*/, ''), {
          x: 51, y, w: 41, h: rowH - 2,
        }, {
          variant: 'body', fontSize: 2.3, textColor: p.fg,
        }),
        index < items.length - 1
          ? shapeEl(`divider-${index + 1}`, { x: 41, y: y + rowH - 1, w: 51, h: 0.2 }, p.muted)
          : null,
      ]
    }),
  ])
}

/** Bảng: tối đa 8 hàng × 6 cột, các hàng được pad cho đều số cột. */
function sanitizeRows(rows?: string[][]): string[][] {
  if (!Array.isArray(rows)) return []
  const cleaned = rows
    .slice(0, 8)
    .map((row) => (Array.isArray(row) ? row.slice(0, 6).map((cell) => String(cell ?? '').trim()) : []))
    .filter((row) => row.some(Boolean))
  const cols = Math.max(0, ...cleaned.map((row) => row.length))
  if (cols === 0) return []
  return cleaned.map((row) => [...row, ...Array<string>(cols - row.length).fill('')])
}

function composeTable(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const rows = sanitizeRows(content.rows)
  if (rows.length === 0) return []
  const hasTitle = Boolean(content.title?.trim())
  const table: SlideElement = {
    id: 'table',
    type: 'table',
    x: 8,
    y: hasTitle ? 28 : 12,
    w: 84,
    h: hasTitle ? 64 : 80,
    rows,
  }
  return compact([
    ...titleEls(p, content.title, { x: 8, y: 8, w: 84, h: 14 }, [3.8, 3.4, 3.1, 2.8]),
    table,
  ])
}

function composeImageSide(
  p: LayoutPalette,
  content: SlideLayoutContent,
  side: 'left' | 'right',
): SlideElement[] {
  let lines = cleanList(content.bullets)
  if (lines.length === 0) lines = linesOf(content.body)
  if (lines.length === 0) return []
  const imageOnLeft = side === 'left'
  const graphic = chosenGraphic(content)
  const imageBox: Box = { x: imageOnLeft ? 8 : 54, y: 26, w: 38, h: 60 }
  return compact([
    ...titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true),
    ...(graphic && !content.image
      ? [
          // AI chọn đồ hoạ thay ảnh: nền thẻ + hình vuông căn giữa, không gọi vẽ ảnh.
          shapeEl('image-panel', imageBox, GRAPHIC_PLATE, 'round'),
          graphicEl(
            'image-1',
            graphic,
            { x: imageBox.x + 3, y: imageBox.y + 14, w: imageBox.w - 6, h: imageBox.w - 6 },
            GRAPHIC_INK,
          ),
        ]
      : [
          {
            id: 'image-1',
            type: 'image' as const,
            src: content.image,
            ...imageBox,
          },
        ]),
    textEl('bullets', bulletText(lines), {
      x: imageOnLeft ? 50 : 8,
      y: 26,
      w: 44,
      h: 60,
    }, {
      variant: 'body', fontSize: lines.length <= 2 ? 3 : 3.2, textColor: p.fg, valign: 'middle',
    }),
  ])
}

/** Ảnh phủ kín slide, thẻ chữ nhỏ ở góc dưới (slide ảnh chủ đạo). */
function composeImageFull(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  if (!content.title?.trim() && !content.body?.trim()) return []
  return compact([
    { id: 'image-1', type: 'image', src: content.image, x: 0, y: 0, w: 100, h: 100 },
    shapeEl('scrim', { x: 6, y: 64, w: 56, h: 28 }, p.surface, 'round'),
    shapeEl('accent-bar', { x: 6, y: 64, w: 0.7, h: 28 }, p.accent),
    textEl('title', content.title, { x: 10, y: 67, w: 48, h: 12 }, {
      variant: 'title', fontSize: 3.2, fontWeight: 700, textColor: p.fg,
    }),
    textEl('body', content.body, { x: 10, y: 79, w: 48, h: 12 }, {
      variant: 'body', fontSize: 1.8, textColor: p.muted,
    }),
  ])
}

function composeStats(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const stats = (content.stats ?? [])
    .map((stat) => ({
      value: String(stat.value ?? '').trim(),
      label: String(stat.label ?? '').trim(),
    }))
    .filter((stat) => stat.value || stat.label)
    .slice(0, 4)
  if (stats.length === 0) return []
  const gap = 3
  const usedIcons = new Set<SlideAssetId>()
  const area = { x: 8, y: 27, w: 84, h: 56 }
  const cellW = (area.w - gap * (stats.length - 1)) / stats.length
  const cells = stats.flatMap((stat, index) => {
    const x = area.x + index * (cellW + gap)
    const panel: SlideElement = {
      id: `stat-${index + 1}-panel`,
      type: 'shape',
      shape: 'round',
      fill: p.panel,
      x,
      y: area.y,
      w: cellW,
      h: 52,
    }
    const asset = pickSlideAsset(`${stat.label ?? ''} ${stat.value ?? ''}`, usedIcons)
    return [
      panel,
      asset ? shapeEl(`stat-${index + 1}-icon-badge`, { x: x + cellW / 2 - 9, y: area.y + 2, w: 18, h: 14 }, p.accent, 'round') : null,
      asset ? iconEl(`stat-${index + 1}-icon`, asset, { x: x + cellW / 2 - 8, y: area.y + 3, w: 16, h: 12 }, p.onAccent) : null,
      textEl(`stat-${index + 1}-value`, stat.value || stat.label, { x, y: area.y + 17, w: cellW, h: 16 }, {
        variant: 'title', fontSize: 6.2, fontWeight: 700, textColor: p.ink, align: 'center', valign: 'middle',
      }),
      stat.value
        ? textEl(`stat-${index + 1}-label`, stat.label, { x, y: area.y + 35, w: cellW, h: 13 }, {
            variant: 'body', fontSize: 2.1, textColor: p.muted, align: 'center',
          })
        : null,
    ]
  })
  return compact([
    ...titleEls(p, content.title, { x: 8, y: 8, w: 84, h: 14 }, [3.8, 3.4, 3.1, 2.8]),
    ...cells,
  ])
}

/** Hai số liệu lớn bên trái, ảnh phủ nửa phải. */
function composeStatImage(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const stats = (content.stats ?? [])
    .map((stat) => ({
      value: String(stat.value ?? '').trim(),
      label: String(stat.label ?? '').trim(),
    }))
    .filter((stat) => !!stat.value)
    .slice(0, 2)
  if (stats.length === 0) return []
  const rowH = stats.length === 1 ? 40 : 26

  return compact([
    { id: 'image-1', type: 'image', src: content.image, x: 54, y: 0, w: 46, h: 100 },
    ...titleEls(p, content.title, { x: 8, y: 8, w: 42, h: 16 }, [3.4, 3.1, 2.8, 2.6]),
    shapeEl('accent-rule', { x: 8, y: 27, w: 10, h: 0.7 }, p.accent),
    ...stats.flatMap((stat, index) => {
      const y = 33 + index * rowH
      return [
        textEl(`stat-${index + 1}-value`, stat.value, { x: 8, y, w: 42, h: 14 }, {
          variant: 'title', fontSize: 6.4, fontWeight: 700, textColor: p.ink,
        }),
        textEl(`stat-${index + 1}-label`, stat.label, { x: 8, y: y + 15, w: 42, h: 8 }, {
          variant: 'body', fontSize: 1.8, textColor: p.muted,
        }),
      ]
    }),
  ])
}

function stepsOf(content: SlideLayoutContent): string[] {
  let steps = cleanList(content.steps)
  if (steps.length === 0) steps = cleanList(content.bullets)
  if (steps.length === 0) steps = linesOf(content.body)
  return steps.slice(0, 6)
}

function composeTimeline(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const steps = stepsOf(content)
  if (steps.length < 3) return []
  const slot = 84 / steps.length
  // Chữ bước lớn hơn khi ít bước (4 bước × 60 ký tự vẫn vừa nhờ hộp cao 30%).
  const stepSize = steps.length <= 3 ? 2.6 : steps.length === 4 ? 2.3 : 2.05
  const nodes = steps.flatMap((step, index) => {
    const center = 8 + slot * (index + 0.5)
    const left = center - slot / 2
    const tag = numberTag(`step-${index + 1}`, index + 1, p.panel, center - 2.1, 44, 4.2)
    const label = textEl(`item-${index + 1}`, step, {
      x: left + 1,
      y: 51,
      w: slot - 2,
      h: 29,
    }, {
      variant: 'body', fontSize: stepSize, textColor: p.fg, align: 'center',
    })
    if (tag) return [tag, label]
    return [
      textEl(`step-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
        x: left,
        y: 34,
        w: slot,
        h: 7,
      }, {
        variant: 'body', fontSize: 1.8, fontWeight: 700, textColor: p.ink, align: 'center',
      }),
      {
        id: `step-${index + 1}`,
        type: 'shape' as const,
        shape: 'ellipse' as const,
        fill: p.accent,
        x: center - 1.1,
        y: 42.15,
        w: 2.2,
        h: 3.9,
      },
      label,
    ]
  })
  return compact([
    ...titleEls(p, content.title, { x: 8, y: 8, w: 84, h: 14 }, [3.8, 3.4, 3.1, 2.8]),
    shapeEl('timeline-panel', { x: 6, y: 29, w: 88, h: 56 }, p.panel, 'round'),
    shapeEl('timeline-line', { x: 8, y: 44, w: 84, h: 0.4 }, p.muted),
    ...nodes,
  ])
}

function composeCycle(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const steps = stepsOf(content)
  if (steps.length < 3) return []
  const count = steps.length
  // Tỉ lệ 16:9 nên muốn hình tròn thật thì h = w × 16/9; node nhỏ hơn khi có 6 bước.
  const nodeW = count <= 4 ? 16 : 14
  const nodeH = (nodeW * 16) / 9
  const rx = count <= 4 ? 30 : 31
  const ry = count <= 4 ? 22 : 23
  const nodes = steps.flatMap((step, index) => {
    const angle = ((-90 + (360 / count) * index) * Math.PI) / 180
    const cx = 50 + rx * Math.cos(angle)
    const cy = 58 + ry * Math.sin(angle)
    return [
      {
        id: `node-${index + 1}`,
        type: 'shape' as const,
        shape: 'ellipse' as const,
        fill: p.accent,
        x: cx - nodeW / 2,
        y: cy - nodeH / 2,
        w: nodeW,
        h: nodeH,
      },
      // Chữ nằm trong hình chữ nhật nội tiếp của hình tròn (≈ 78% × 60%), không ép vào hộp 10% cố định.
      textEl(`item-${index + 1}`, step, {
        x: cx - (nodeW * 0.78) / 2,
        y: cy - (nodeH * 0.6) / 2,
        w: nodeW * 0.78,
        h: nodeH * 0.6,
      }, {
        variant: 'body', fontSize: count <= 4 ? 1.6 : 1.45, fontWeight: 600, textColor: p.onAccent,
        align: 'center', valign: 'middle',
      }),
      // Số thứ tự trên vành node: không có mũi tên nên người xem cần biết bắt đầu từ đâu.
      { ...shapeEl(`node-${index + 1}-badge`, { x: cx - nodeW / 2 - 0.6, y: cy - nodeH / 2 - 1, w: 4, h: 7.1 }, p.background, 'ellipse') },
      textEl(`node-${index + 1}-index`, String(index + 1), {
        x: cx - nodeW / 2 - 0.6, y: cy - nodeH / 2 - 1, w: 4, h: 7.1,
      }, {
        variant: 'body', fontSize: 1.6, fontWeight: 700, textColor: p.ink, align: 'center', valign: 'middle',
      }),
    ]
  })
  return compact([
    ...titleEls(p, content.title, { x: 8, y: 6, w: 84, h: 12 }, [3.8, 3.4, 3.1, 2.8]),
    ...nodes,
  ])
}

/** `answer` có thể là chỉ số, chữ cái A–D, hoặc khớp nguyên văn một phương án. */
export function resolveAnswer(answer: string | number | undefined, options: string[]): number {
  if (typeof answer === 'number') {
    return Number.isInteger(answer) && answer >= 0 && answer < options.length ? answer : -1
  }
  if (typeof answer === 'string') {
    const raw = answer.trim()
    if (!raw) return -1
    const literal = options.findIndex((option) => option.trim().toLowerCase() === raw.toLowerCase())
    if (literal >= 0) return literal
    const letter = raw.replace(/^(đáp án|phương án|option)\s*/i, '').replace(/[).:\s]/g, '')
    if (/^[a-d]$/i.test(letter)) return letter.toLowerCase().charCodeAt(0) - 97
  }
  return -1
}

function composeQuiz(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const options = cleanList(content.options).slice(0, 4)
  const question =
    content.question?.trim() ||
    content.title?.trim() ||
    linesOf(content.body)[0] ||
    cleanList(content.bullets)[0]
  if (!question || options.length < 2) return []
  const answer = resolveAnswer(content.answer, options)
  const twoColumns = options.length > 2
  const optionEls: SlideElement[] = options.map((option, index) => {
    const col = twoColumns ? index % 2 : 0
    const row = twoColumns ? Math.floor(index / 2) : index
    const correct = index === answer
    const optionW = twoColumns ? 41 : 84
    const optionText = `${String.fromCharCode(65 + index)}. ${option}`
    return {
      id: `option-${index + 1}`,
      type: 'text',
      x: twoColumns ? (col === 0 ? 8 : 51) : 8,
      y: 42 + row * 17,
      w: optionW,
      h: 14,
      text: optionText,
      variant: 'body',
      // ô có nền đệm 3% hai bên (+4cqw so với hộp thường) nên đo trên hộp thu hẹp
      fontSize: fitFontSize({ text: optionText, widthPct: optionW - 4, heightPct: 12, baseCqw: 2.3, lineHeight: 1.25, weight: 500 }),
      textColor: correct ? p.onAccent : p.fg,
      fill: correct ? p.accent : p.panel,
      fixedHeight: true,
    }
  })
  // Thanh đáp án + giải thích: giáo viên chiếu là thấy lời giải như deck mẫu.
  const explanation = content.explanation?.trim()
  const answerText =
    answer >= 0 ? `Đáp án: ${String.fromCharCode(65 + answer)}${explanation ? ` — ${explanation}` : ''}` : ''
  return compact([
    textEl('kicker', content.kicker, { x: 8, y: 10, w: 84, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    textEl('question', question, { x: 8, y: 18, w: 84, h: 18 }, {
      variant: 'title', fontSize: 3.2, fontWeight: 700, textColor: p.fg,
    }),
    ...optionEls,
    answerText ? shapeEl('answer-bar', { x: 8, y: 77, w: 84, h: 14 }, p.surface, 'round') : null,
    answerText ? shapeEl('answer-stripe', { x: 8, y: 77, w: 0.8, h: 14 }, p.accent) : null,
    textEl('answer', answerText, { x: 10.5, y: 77, w: 80, h: 14 }, {
      variant: 'body', fontSize: 2.1, fontWeight: 600, textColor: p.fg, valign: 'middle',
    }),
  ])
}

/** Ví dụ mẫu: đề bài trái, các bước đánh số phải, thanh kết luận dưới. */
function composeExample(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const steps = cleanList(content.steps).slice(0, 4)
  const problem = content.problem?.trim() || content.body?.trim()
  if (!problem || steps.length < 2) return []
  const conclusion = content.conclusion?.trim()
  const header = titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true)
  const top = Math.max(26, bottomOf(header) + 2.5)
  const barH = conclusion ? 13 : 0
  const barY = 94 - barH
  const bottom = conclusion ? barY - 3 : 94
  const areaH = bottom - top
  const leftW = 32
  const rowH = Math.min(16, areaH / steps.length)
  const stepsTop = top + (areaH - rowH * steps.length) / 2
  const badgeW = 4.2
  const badgeH = (badgeW * 16) / 9
  return compact([
    ...header,
    shapeEl('problem-panel', { x: 8, y: top, w: leftW, h: areaH }, p.panel, 'round'),
    textEl('problem-label', 'ĐỀ BÀI', { x: 10, y: top + 2, w: leftW - 4, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 700, textColor: p.ink, letterSpacing: 0.12,
    }),
    textEl('problem', problem, { x: 10, y: top + 9, w: leftW - 4, h: areaH - 11 }, {
      variant: 'body', fontSize: 2.5, textColor: p.fg,
    }),
    ...steps.flatMap((step, index) => {
      const y = stepsTop + index * rowH
      const tag = rowH >= 12 ? numberTag(`step-${index + 1}-badge`, index + 1, p.background, 43.5, y + rowH / 2, 3.2) : null
      return [
        ...(tag
          ? [tag]
          : [
              shapeEl(`step-${index + 1}-badge`, { x: 43, y: y + (rowH - badgeH) / 2, w: badgeW, h: badgeH }, p.accent, 'ellipse'),
              textEl(`step-${index + 1}-index`, String(index + 1), {
                x: 43, y: y + (rowH - badgeH) / 2, w: badgeW, h: badgeH,
              }, {
                variant: 'body', fontSize: 1.9, fontWeight: 700, textColor: p.onAccent, align: 'center', valign: 'middle',
              }),
            ]),
        textEl(`item-${index + 1}`, step, { x: 49, y, w: 43, h: rowH }, {
          variant: 'body', fontSize: 2.2, textColor: p.fg, valign: 'middle',
        }),
      ]
    }),
    conclusion ? shapeEl('conclusion-bar', { x: 8, y: barY, w: 84, h: barH }, p.accent, 'round') : null,
    textEl('conclusion', conclusion, { x: 10, y: barY, w: 80, h: barH }, {
      variant: 'body', fontSize: 2.4, fontWeight: 700, textColor: p.onAccent, align: 'center', valign: 'middle',
    }),
  ])
}

/** Mở bài: bong bóng thoại chứa câu hỏi/tình huống + gợi ý ngắn bên dưới. */
function composeHook(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const body = content.body?.trim() || cleanList(content.bullets)[0]
  if (!body) return []
  const pills = cleanList(content.items).slice(0, 3)
  const graphic = chosenGraphic(content)
  const bubbleH = pills.length ? 36 : 48
  const pillsX = 30
  const pillGap = 2.5
  const pillW = (92 - pillsX - pillGap * (pills.length - 1)) / Math.max(pills.length, 1)
  return compact([
    textEl('kicker', content.kicker, { x: 8, y: 9, w: 84, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    ...titleEls(p, content.title, { x: 8, y: 14, w: 84, h: 12 }, [3.8, 3.4, 3.1, 2.8], false),
    shapeEl('bubble', { x: 8, y: 27, w: 84, h: bubbleH }, p.panel, 'round'),
    pills.length
      ? { ...shapeEl('bubble-tail', { x: 13.5, y: 27 + bubbleH - 0.2, w: 5, h: 5.2 }, p.panel, 'triangle'), flipY: true }
      : null,
    textEl('body', body, { x: 12, y: 29, w: 76, h: bubbleH - 4 }, {
      variant: 'title', fontSize: 3.1, fontWeight: 600, textColor: p.fg, align: 'center', valign: 'middle',
    }),
    ...(pills.length && graphic ? graphicPlate('hook-graphic', graphic, { x: 8, y: 68, w: 16, h: 24 }, p) : []),
    pills.length && !graphic
      ? iconEl('hook-icon', pickSlideAsset(`${content.title ?? ''} ${body}`) ?? 'idea', { x: 9, y: 69, w: 12, h: 21 }, p.accent)
      : null,
    ...pills.flatMap((pill, index) => {
      const x = pillsX + index * (pillW + pillGap)
      return [
        shapeEl(`pill-${index + 1}`, { x, y: 73, w: pillW, h: 15 }, p.accent, 'round'),
        textEl(`card-${index + 1}`, pill, { x: x + 1, y: 73, w: pillW - 2, h: 15 }, {
          variant: 'body', fontSize: 1.9, fontWeight: 600, textColor: p.onAccent, align: 'center', valign: 'middle',
        }),
      ]
    }),
  ])
}

/**
 * Dựng phần tử cho một layout. Tông bỏ trống thì theo mặc định của layout.
 * Layout lạ rơi về `bullets` (hành vi an toàn cho AI); nội dung thiếu field
 * bắt buộc trả mảng rỗng để caller tự fallback.
 */
export function composeLayout(
  theme: DeckTheme,
  layoutId: string,
  content: SlideLayoutContent,
  tone?: SlideTone,
): SlideElement[] {
  const resolved = normalizeTheme(theme)
  const id: SlideLayoutId = isLayoutId(layoutId) ? layoutId : 'bullets'
  const palette = paletteOf(resolved, tone && isTone(tone) ? tone : defaultTone(id))
  switch (id) {
    case 'title':
      return composeTitle(palette, content)
    case 'section':
      return composeSection(palette, content)
    case 'statement':
      return composeStatement(palette, content)
    case 'cards':
      return composeCards(palette, content)
    case 'two-column':
      return composeTwoColumn(palette, content)
    case 'comparison':
      return composeComparison(palette, content)
    case 'quote':
      return composeQuote(palette, content)
    case 'example':
      return composeExample(palette, content)
    case 'hook':
      return composeHook(palette, content)
    case 'closing':
      return composeClosing(palette, content)
    case 'agenda':
      return composeAgenda(palette, content)
    case 'table':
      return composeTable(palette, content)
    case 'image-left':
      return composeImageSide(palette, content, 'left')
    case 'image-right':
      return composeImageSide(palette, content, 'right')
    case 'image-full':
      return composeImageFull(palette, content)
    case 'stats':
      return composeStats(palette, content)
    case 'stat-image':
      return composeStatImage(palette, content)
    case 'timeline':
      return composeTimeline(palette, content)
    case 'cycle':
      return composeCycle(palette, content)
    case 'quiz':
      return composeQuiz(palette, content)
    default:
      return composeBullets(palette, content)
  }
}

/* ------------------------------------------------------------------ *
 * Nội dung: lấy từ slide hiện có + mẫu cho layout
 * ------------------------------------------------------------------ */
const RESERVED = new Set([
  'title', 'kicker', 'subtitle', 'quote', 'author', 'mark',
  'bullets', 'body', 'body-2', 'question', 'left-title', 'right-title', 'bullet-anchor-mark',
  'problem', 'problem-label', 'conclusion', 'answer',
])
const NUMBERED = /^(card|option|stat|step|item|node|left|right)-\d+(-value|-label|-index|-heading)?$/
const isRoleId = (id: string): boolean => RESERVED.has(id) || NUMBERED.test(id)

/** Đọc nội dung slide đang có để đổi layout mà không mất chữ/ảnh/bảng. */
export function contentFromSlide(slide: Slide): SlideLayoutContent {
  const texts = slide.elements.filter(
    (el): el is SlideElement & { text: string } =>
      el.type === 'text' && Boolean(el.text?.trim()),
  )
  const byId = (id: string) => texts.find((el) => el.id === id)?.text
  // deck mặc định cũ: phần tử chữ đầu tiên không giữ vai trò nào → coi là tiêu đề
  const titleEl =
    texts.find((el) => el.id === 'title') ??
    texts.find((el) => el.variant === 'title' && !isRoleId(el.id)) ??
    texts.find((el) => !isRoleId(el.id))
  const bullets = [
    ...linesOf(byId('bullets')),
    ...texts
      .filter((el) => el !== titleEl && !isRoleId(el.id))
      .flatMap((el) => linesOf(el.text)),
  ]

  const optionEls = slide.elements
    .filter((el): el is SlideElement & { text: string } => el.type === 'text' && /^option-\d+$/.test(el.id))
    .sort((a, b) => suffixOf(a.id) - suffixOf(b.id))
  const fills = optionEls.map((el) => el.fill)
  const uniqueFill =
    optionEls.length > 1 ? fills.find((fill) => fill && fills.filter((f) => f === fill).length === 1) : undefined

  const statEls = texts
    .filter((el) => /^stat-\d+-value$/.test(el.id))
    .sort((a, b) => suffixOf(a.id) - suffixOf(b.id))
  const stepEls = texts
    .filter((el) => /^item-\d+$/.test(el.id))
    .sort((a, b) => suffixOf(a.id) - suffixOf(b.id))
  const tableEl = slide.elements.find((el) => el.type === 'table')
  const imageEl = slide.elements.find((el) => el.type === 'image')
  const graphicEl = slide.elements.find(
    (el) => el.type === 'graphic' && isGraphicId(el.graphicId),
  )

  // two-column có nhãn: mỗi ý là `left-N` (+ `left-N-heading`) — ghép lại "nhãn: mô tả"
  const sideItems = (side: 'left' | 'right'): string[] | undefined => {
    const els = texts
      .filter((el) => new RegExp(`^${side}-\\d+$`).test(el.id))
      .sort((a, b) => suffixOf(a.id) - suffixOf(b.id))
    if (!els.length) return undefined
    return els.map((el) => {
      const heading = byId(`${el.id}-heading`)
      return heading ? `${heading}: ${el.text}` : el.text
    })
  }
  const answerMatch = byId('answer')?.match(/^Đáp án:\s*([A-D])(?:\s*[—–-]\s*([\s\S]*))?$/i)
  return {
    title: byId('title') ?? titleEl?.text,
    problem: byId('problem'),
    conclusion: byId('conclusion'),
    explanation: answerMatch?.[2]?.trim() || undefined,
    kicker: byId('kicker'),
    subtitle: byId('subtitle'),
    body: byId('body'),
    bullets: bullets.length > 0 ? bullets : undefined,
    items: texts
      .filter((el) => /^card-\d+$/.test(el.id))
      .map((el) => {
        // thẻ 4 mục tách "tiêu đề: mô tả" — ghép lại để đổi layout không mất tiêu đề
        const heading = byId(`${el.id}-heading`)
        return heading ? `${heading}: ${el.text}` : el.text
      }),
    left: sideItems('left') ?? linesOf(byId('body')),
    right: sideItems('right') ?? linesOf(byId('body-2')),
    leftTitle: byId('left-title'),
    rightTitle: byId('right-title'),
    quote: byId('quote'),
    author: byId('author'),
    rows: tableEl?.rows,
    image: imageEl?.src,
    graphic: graphicEl?.graphicId,
    stats: statEls.length
      ? statEls.map((el) => ({
          value: el.text,
          label: byId(el.id.replace(/-value$/, '-label')) ?? '',
        }))
      : undefined,
    // bỏ nhãn do builder sinh ra để dựng lại layout không bị "1. 1." / "A. A."
    steps: stepEls.length ? stepEls.map((el) => el.text.replace(/^\d+\.\s*/, '')) : undefined,
    question: byId('question'),
    options: optionEls.length
      ? optionEls.map((el) => el.text.replace(/^[A-D]\.\s*/i, ''))
      : undefined,
    answer: answerMatch ? answerMatch[1].toUpperCase().charCodeAt(0) - 65 : uniqueFill ? fills.indexOf(uniqueFill) : undefined,
  }
}

const DEMO: Record<SlideLayoutId, SlideLayoutContent> = {
  title: { kicker: 'BÀI GIẢNG', title: 'Tiêu đề bài giảng', subtitle: 'Môn học · Lớp' },
  section: { kicker: 'PHẦN 1', title: 'Mở đầu', subtitle: 'Nội dung chính của phần này' },
  statement: {
    kicker: 'Ý CHÍNH',
    body: 'Một ý lớn, một thông điệp duy nhất.',
    author: 'Giảng viên',
  },
  bullets: {
    title: 'Nội dung chính',
    bullets: ['Ý chính thứ nhất', 'Ý chính thứ hai', 'Ý chính thứ ba'],
  },
  cards: { title: 'Ba điểm cần nhớ', items: ['Khái niệm', 'Ví dụ', 'Bài tập'] },
  'two-column': {
    title: 'So sánh hai mặt',
    left: ['Đặc điểm thứ nhất', 'Đặc điểm thứ hai'],
    right: ['Đặc điểm thứ ba', 'Đặc điểm thứ tư'],
  },
  comparison: {
    title: 'Trước và sau',
    leftTitle: 'Trước',
    left: ['Cách làm cũ', 'Mất thời gian'],
    rightTitle: 'Sau',
    right: ['Cách làm mới', 'Nhanh và rõ'],
  },
  quote: { quote: 'Học đi đôi với hành.', author: 'Tác giả' },
  closing: { title: 'Cảm ơn đã theo dõi', subtitle: 'Câu hỏi và thảo luận' },
  agenda: {
    kicker: 'NỘI DUNG',
    title: 'Bài học hôm nay',
    items: ['Khởi động', 'Khám phá', 'Luyện tập', 'Vận dụng'],
  },
  table: {
    title: 'Bảng tổng hợp',
    rows: [['Nội dung', 'Ghi chú'], ['Ý thứ nhất', '…'], ['Ý thứ hai', '…']],
  },
  'image-left': {
    title: 'Hình minh hoạ',
    bullets: ['Ý chính thứ nhất', 'Ý chính thứ hai', 'Ý chính thứ ba'],
  },
  'image-right': {
    title: 'Hình minh hoạ',
    bullets: ['Ý chính thứ nhất', 'Ý chính thứ hai', 'Ý chính thứ ba'],
  },
  'image-full': {
    title: 'Hình ảnh minh hoạ',
    body: 'Chú thích ngắn cho hình.',
  },
  stats: {
    title: 'Con số nổi bật',
    stats: [
      { value: '85%', label: 'Tỉ lệ đạt' },
      { value: '12', label: 'Bài học' },
      { value: '3', label: 'Mức độ' },
    ],
  },
  'stat-image': {
    title: 'Con số nổi bật',
    stats: [
      { value: '85%', label: 'Tỉ lệ đạt' },
      { value: '12', label: 'Bài học' },
    ],
  },
  timeline: {
    title: 'Tiến trình bài học',
    steps: ['Khởi động', 'Khám phá', 'Luyện tập', 'Vận dụng'],
  },
  cycle: {
    title: 'Chu trình học tập',
    steps: ['Trải nghiệm', 'Phân tích', 'Vận dụng', 'Đánh giá'],
  },
  quiz: {
    kicker: 'KIỂM TRA NHANH',
    question: 'Phân số nào dưới đây bằng 1/2?',
    options: ['2/4', '2/3', '3/4', '1/3'],
    answer: 0,
    explanation: 'Rút gọn 2/4 chia cả tử và mẫu cho 2 được 1/2.',
  },
  example: {
    title: 'Ví dụ mẫu',
    problem: 'Tìm ƯCLN(24, 36) bằng cách phân tích ra thừa số nguyên tố.',
    steps: [
      'Phân tích: 24 = 2³ · 3 và 36 = 2² · 3²',
      'Lấy thừa số chung với số mũ nhỏ nhất: 2² và 3',
      'Nhân lại: 2² · 3 = 12',
    ],
    conclusion: 'Kết quả: ƯCLN(24, 36) = 12',
  },
  hook: {
    kicker: 'KHỞI ĐỘNG',
    title: 'Thử thách mở đầu',
    body: 'Có 18 quyển vở và 24 bút, chia đều vào các túi quà. Chia được nhiều nhất mấy túi?',
    items: ['Chia đều 18 và 24', 'Số túi là ước chung?', 'Nhiều nhất mấy túi?'],
  },
}

/**
 * Bù chỗ trống bằng mẫu cho UI (PowerPoint cũng hiện "Click to add text").
 * Chỉ bù field mà layout cần và nội dung hiện tại thực sự chưa có.
 */
export function withPlaceholders(
  layoutId: SlideLayoutId,
  content: SlideLayoutContent,
): SlideLayoutContent {
  const demo = DEMO[layoutId]
  const out = { ...content }
  const has = (value?: string) => Boolean(value?.trim())
  const list = (value?: unknown[]) => (value?.length ?? 0) > 0

  switch (layoutId) {
    case 'title':
    case 'section':
      if (!has(out.kicker)) out.kicker = demo.kicker
      if (!has(out.title)) out.title = demo.title
      if (!has(out.subtitle)) out.subtitle = demo.subtitle
      break
    case 'statement':
      if (!has(out.kicker)) out.kicker = demo.kicker
      if (!has(out.body) && !has(out.quote) && !list(out.bullets)) out.body = demo.body
      break
    case 'bullets':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.bullets)) out.bullets = demo.bullets
      break
    case 'cards':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.items) && !list(out.bullets)) out.items = demo.items
      break
    case 'two-column':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.left) && !list(out.right) && !list(out.bullets) && !has(out.body)) {
        out.left = demo.left
        out.right = demo.right
      }
      break
    case 'comparison':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.leftTitle)) out.leftTitle = demo.leftTitle
      if (!has(out.rightTitle)) out.rightTitle = demo.rightTitle
      if (!list(out.left)) out.left = demo.left
      if (!list(out.right)) out.right = demo.right
      break
    case 'quote':
      if (!has(out.quote) && !has(out.body) && !list(out.bullets)) {
        out.quote = demo.quote
        out.author = demo.author
      }
      break
    case 'closing':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.subtitle)) out.subtitle = demo.subtitle
      break
    case 'agenda':
      if (!has(out.kicker)) out.kicker = demo.kicker
      if (!has(out.title)) out.title = demo.title
      if (!list(out.items) && !list(out.bullets)) out.items = demo.items
      break
    case 'table':
      if (!has(out.title)) out.title = demo.title
      if (sanitizeRows(out.rows).length === 0) out.rows = demo.rows
      break
    case 'image-left':
    case 'image-right':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.bullets) && !has(out.body)) out.bullets = demo.bullets
      break
    case 'image-full':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.body)) out.body = demo.body
      break
    case 'stats':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.stats)) out.stats = demo.stats
      break
    case 'stat-image':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.stats)) out.stats = demo.stats
      break
    case 'timeline':
    case 'cycle':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.steps) && !list(out.bullets) && !has(out.body)) out.steps = demo.steps
      break
    case 'quiz':
      if (!has(out.question) && !has(out.body) && !list(out.bullets)) {
        out.question = demo.question
        out.kicker = out.kicker || demo.kicker
      }
      if (!list(out.options)) {
        out.options = demo.options
        out.answer = demo.answer
        out.explanation = out.explanation || demo.explanation
      }
      break
    case 'example':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.problem) && !has(out.body)) out.problem = demo.problem
      if (!list(out.steps)) out.steps = demo.steps
      if (!has(out.conclusion)) out.conclusion = demo.conclusion
      break
    case 'hook':
      if (!has(out.kicker)) out.kicker = demo.kicker
      if (!has(out.title)) out.title = demo.title
      if (!has(out.body) && !list(out.bullets)) out.body = demo.body
      if (!list(out.items)) out.items = demo.items
      break
  }
  return out
}
