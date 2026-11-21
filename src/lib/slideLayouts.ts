/**
 * Layout engine cho slide: catalog bố cục + dựng `SlideElement[]` từ nội dung.
 *
 * Toạ độ theo % khung slide, lề an toàn 5–8%. Mỗi phần tử có id vai trò cố định
 * (`title`, `bullets`, `card-1`, `option-2`…) để sau này AI sửa đúng chỗ như
 * command registry. Màu/font lấy từ theme + tông (theme/soft/accent), không
 * hardcode palette.
 */
import type { DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import { autoAnimate } from './slideAnim'
import { textBoxHeight } from './slideText'
import { slideFontStack } from './slideFonts'
import { fitFontSize, singleLineSize } from './slideMeasure'
import { PHOTO_CREDIT_FILL, photoScrimFill } from './slideContrast'
import { GRAPHIC_INK, graphicById, isGraphicId } from './slideGraphics'
import { DECOR_ANCHORS, decorKitById } from './slideDecor'
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
  | 'bignum'
  | 'photo-full'
  | 'photo-compare'
  | 'bars'
  | 'rules'
  | 'editorial-text'
  | 'manifesto'
  | 'timeline'
  | 'cycle'
  | 'quiz'
  | 'example'
  | 'hook'
  | 'mindmap'

export interface SlideStat {
  value?: string
  label?: string
}

export const isEditorialLayout = (id: string): boolean =>
  id === 'bignum' || id === 'photo-full' || id === 'photo-compare' || id === 'bars' ||
  id === 'rules' || id === 'editorial-text' || id === 'manifesto'

/** Bố cục dùng được trong chế độ Chuyên nghiệp: không thẻ hộp, không icon trong khung, không hoạ tiết. */
export const PRO_LAYOUT_IDS = ['photo-full', 'manifesto', 'editorial-text', 'rules', 'bignum', 'bars', 'photo-compare'] as const

export interface SlideBar {
  label: string
  value: number
  color?: string
}

export interface SlideLayoutContent {
  credit?: string
  value?: string
  label?: string
  focusX?: number
  focusY?: number
  imageCrop?: SlideElement['crop']
  image2?: string
  image2Crop?: SlideElement['crop']
  caption?: string
  caption2?: string
  textPosition?: 'bottom' | 'left'
  bars?: SlideBar[]
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
  /** bộ trang trí của deck (slideDecor.ts); thiếu thì giữ hoạ tiết mặc định của bố cục */
  decorKit?: string
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
    id: 'bignum',
    name: 'Số nổi bật',
    description: 'Một con số rất lớn, kèm nhãn, dòng phụ và ảnh bên phải nếu có.',
    fields: ['kicker', 'value', 'label', 'subtitle', 'image', 'focusX', 'focusY'],
  },
  {
    id: 'photo-full',
    name: 'Ảnh tràn nền',
    description: 'Ảnh phủ kín slide, tiêu đề và dòng phụ trên lớp phủ tối chuyển sắc.',
    fields: ['title', 'subtitle', 'image', 'textPosition', 'focusX', 'focusY'],
  },
  {
    id: 'photo-compare',
    name: 'So sánh hai ảnh',
    description: 'Tiêu đề phía trên, hai ảnh cạnh nhau và chú thích riêng.',
    fields: ['title', 'image', 'image2', 'caption', 'caption2'],
  },
  {
    id: 'bars',
    name: 'Biểu đồ thanh ngang',
    description: 'Hai đến sáu thanh ngang cùng tỉ lệ, ghi giá trị ở cuối thanh.',
    fields: ['title', 'bars'],
  },
  {
    id: 'rules',
    name: 'Danh sách kẻ dòng',
    description: 'Tiêu đề và 3–5 hàng ngăn bằng đường kẻ mảnh: mốc/nhãn ngắn bên trái (stats.value), nội dung bên phải (stats.label).',
    fields: ['kicker', 'title', 'stats'],
  },
  {
    id: 'editorial-text',
    name: 'Chữ biên tập',
    description: 'Tiêu đề lớn bên trái, vài đoạn chữ ngắn bên phải ngăn bằng đường kẻ đứng; không thẻ, không icon.',
    fields: ['kicker', 'title', 'body', 'bullets'],
  },
  {
    id: 'manifesto',
    name: 'Câu chủ đề',
    description: 'Một câu rất lớn trên nền mực đen: mở bài, luận điểm, trích dẫn (author = nguồn), lời kết.',
    fields: ['kicker', 'body', 'author'],
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
      'Mở bài gợi mở: câu hỏi/tình huống lớn canh trái, cột phải có hình + 2–3 gợi ý ngắn xếp dọc. Nền dịu.',
    fields: ['kicker', 'title', 'body', 'items'],
  },
  {
    id: 'mindmap',
    name: 'Sơ đồ tư duy',
    description:
      'Sơ đồ tư duy: nút trung tâm ("body") nối 3–6 nhánh ("items": "Nhãn nhánh: ý con; ý con"), nhánh chia hai bên, mỗi nhánh 0–3 ý con.',
    fields: ['title', 'body', 'items'],
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
  if (id === 'title' || id === 'section' || id === 'statement' || id === 'manifesto') return 'accent'
  if (id === 'quote' || id === 'quiz' || id === 'closing' || id === 'agenda' || id === 'hook') return 'soft'
  return 'theme'
}

/* ------------------------------------------------------------------ *
 * Bảng màu theo tông
 * ------------------------------------------------------------------ */
interface LayoutPalette {
  displayFont: string
  text: typeof textEl
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
    displayFont: theme.fonts.heading === 'Be Vietnam Pro' ? 'Arial Narrow, Arial' : theme.fonts.heading,
    text: (id: string, value: string | undefined, box: Box, style: Partial<SlideElement>, minScale?: number) =>
      textEl(id, value, box, style, minScale, style.variant === 'body' ? theme.fonts.body : theme.fonts.heading),
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
  const pick0 =
    tone === 'accent'
      ? { background: mixHex(theme.bg, theme.accent, theme.dark ? 0.2 : 0.07), surface: theme.bg, panelMix: theme.dark ? 0.18 : 0.14 }
      : tone === 'soft'
        ? { background: theme.surface, surface: theme.bg, panelMix: theme.dark ? 0.18 : 0.14 }
        : { background: theme.bg, surface: theme.surface, panelMix: theme.dark ? 0.18 : 0.12 }
  // Theme Chuyên nghiệp: tông "accent" là nền mực đen, chữ màu giấy.
  const proDark = !!theme.pro && tone === 'accent'
  const pick = proDark ? { background: theme.ink ?? '#161513', surface: mixHex(theme.ink ?? '#161513', theme.bg, 0.08), panelMix: 0.1 } : pick0
  const fgc = proDark ? theme.bg : theme.fg
  const accentc = proDark ? mixHex(theme.accent, '#ffffff', 0.28) : theme.accent
  const panel = mixHex(pick.background, theme.accent, pick.panelMix)
  const bgs = [pick.background, panel, pick.surface]
  return {
    ...base,
    fg: fgc,
    accent: accentc,
    background: pick.background,
    surface: pick.surface,
    panel,
    // chữ phụ/nhấn phải đọc được trên cả nền slide lẫn panel/thẻ
    muted: legible(proDark ? mixHex(theme.bg, pick.background, 0.4) : theme.muted, bgs, fgc),
    ink: legible(accentc, bgs, fgc),
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
  minScale?: number,
  inheritedFont?: string,
): SlideElement | null {
  const text = value?.trim()
  if (!text) return null
  const lineHeight = style.lineHeight ?? (style.variant === 'title' ? 1.15 : 1.4)
  const baseSize = style.fontSize ?? (style.variant === 'title' ? 4.2 : 2.6)
  // Đo trước khi đặt (chặng 1): chọn cỡ chữ vừa hộp ngay lúc dựng layout để
  // editor, thumbnail và PPTX dùng chung một cỡ. Trước đây mỗi renderer tự co
  // (FitText) còn PPTX thì không → bản xuất lệch với màn hình.
  const letterSpacing = style.letterSpacing ?? (id === 'kicker' ? 0.12 : undefined)
  const font = style.fontFamily ?? inheritedFont
  const family = font ? slideFontStack(font) : undefined
  const metrics = { family, italic: style.fontStyle === 'italic' }
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
    ...metrics,
    // Renderer mặc định title 600 / body 500 (SlideElView) — đo đúng độ đậm đó.
    weight: style.fontWeight ?? (style.variant === 'title' ? 600 : 500),
    letterSpacing,
    // Tiêu đề dài được phép co sâu hơn thân bài (55% so với 60%) — hộp tiêu đề
    // của layout chỉ cao 12–13% nên 60% không đủ cho tiêu đề 60–80 ký tự.
    minScale: minScale ?? (style.variant === 'title' ? 0.55 : undefined),
  })
  // Hộp ôm sát chữ: layout cấp khung tối đa (tiêu đề bìa cao 30%…), chữ ngắn thì
  // phần dưới trống và khung chọn dư một khoảng. Co theo chiều cao đo được, giữ
  // nguyên vị trí chữ (canh giữa/dưới thì dời y bù lại).
  const need =
    textBoxHeight(text, box.w, fontSize, lineHeight, {
      weight: style.fontWeight ?? (style.variant === 'title' ? 600 : 500),
      letterSpacing,
      ...metrics,
    }) + (id === 'bignum-value' ? 1.7 : 0.5)
  if (need < box.h - 2) {
    const spare = box.h - need
    const shift = style.valign === 'middle' ? spare / 2 : 0
    box = { ...box, y: box.y + shift, h: need }
  }
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
  const el = graphicEl(id, ornId, { x, y: centerY ? y - h / 2 : y, w, h }, ink)
  return id.startsWith('decor-') ? { ...el, decor: true } : el
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

const overlaps = (a: Box, b: Box, pad = 0.6): boolean =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad

/** Slide nhiều chữ thì để trống, trang trí chỉ làm rối. */
function textHeavy(content: SlideLayoutContent): boolean {
  const lists = [content.bullets, content.items, content.steps, content.left, content.right]
  const chars = lists.reduce((sum, list) => sum + (list ?? []).join('').length, content.body?.length ?? 0)
  return chars > 320
}

/**
 * Đặt hoạ tiết của bộ trang trí vào vị trí thiết kế sẵn của bố cục (slideDecor.ts).
 * Có bộ thì thay hoạ tiết mặc định (`decor-N`) của bố cục; vị trí nào vướng phần tử khác
 * (vd tiêu đề dài, hình chính) thì bỏ vị trí đó chứ không dời đi chỗ khác.
 */
function withKitDecor(id: SlideLayoutId, els: SlideElement[], content: SlideLayoutContent, p: LayoutPalette): SlideElement[] {
  const kit = decorKitById(content.decorKit)
  if (!kit) return els
  const base = els.filter((el) => !/^decor-\d+$/.test(el.id))
  const anchors = kit.pieces ? (DECOR_ANCHORS[id] ?? []) : []
  if (!anchors.length || textHeavy(content)) return base
  const blockers = base.filter((el) => el.w * el.h < 5000)
  const out = [...base]
  anchors.forEach((anchor, i) => {
    const graphic = graphicById(kit.pieces?.[anchor.role])
    if (!graphic) return
    // thu vừa khung theo tỉ lệ thật của hình (khung 16:9 nên đổi đơn vị cao ↔ rộng)
    const w = Math.min(anchor.w, (anchor.h * 9 * graphic.ratio) / 16)
    const h = (w * 16) / (9 * graphic.ratio)
    const mx = 2.5
    const my = (mx * 16) / 9
    const box =
      typeof anchor.at === 'object'
        ? { ...anchor.at, w, h }
        : { x: anchor.at[1] === 'l' ? mx : 100 - mx - w, y: anchor.at[0] === 't' ? my : 100 - my - h, w, h }
    if (blockers.some((el) => overlaps(box, el))) return
    out.push({ ...graphicEl(`decor-kit-${i + 1}`, graphic.id, box, p.ink), decor: true })
  })
  return out
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
    p.text('title', text, { ...box, h }, {
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

const NUMBERED_LINE = /^(bước|buoc|step)\s*\d+\s*[:.)\-–]|^\d+\s*[.)]/i
/** Các ý đã tự đánh số ("Bước 1: …", "2. …") thì bỏ chấm đầu dòng cho khỏi thừa. */
const bulletText = (items: string[]): string =>
  items.every((item) => NUMBERED_LINE.test(item)) ? items.join('\n') : items.map((item) => `• ${item}`).join('\n')

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
    p.text('kicker', content.kicker, { x: 9, y: 25, w: 56, h: 6.5 }, {
      variant: 'body', fontSize: 1.8, fontWeight: 700, textColor: p.ink,
    }),
    p.text('title', content.title, { x: 9, y, w: 58, h: 30 }, {
      variant: 'title', fontSize: 5.3, fontWeight: 700, textColor: p.fg,
    }),
    p.text('subtitle', content.subtitle, { x: 9, y: y + 34, w: 54, h: 17 }, {
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
  const graphic = chosenGraphic(content)
  return compact([
    shapeEl('section-panel', { x: 0, y: 0, w: 34, h: 100 }, p.accent),
    p.text('kicker', kicker, { x: 5, y: 27, w: 24, h: kickerH }, {
      variant: 'body', fontSize: 1.7, fontWeight: 700, textColor: p.onAccent,
    }),
    ...titleEls(p, content.title, { x: 5, y: titleY, w: 25, h: 68 - titleY }, [4.1, 3.6, 3.2, 2.8, 2.5], false, p.onAccent),
    ornament('section-rule', 'orn-ke-song-ngan', 5, 70.45, 10, p.onAccent, true),
    // có đồ hoạ: phụ đề co lại, hình tròn nền nhạt bên phải (cùng kiểu huy hiệu ở bìa)
    ...(graphic
      ? [
          shapeEl('section-graphic-plate', { x: 72, y: 32.2, w: 20, h: 35.6 }, GRAPHIC_PLATE, 'ellipse'),
          graphicEl('section-graphic', graphic, { x: 75.5, y: 38.45, w: 13, h: 23.1 }, GRAPHIC_INK),
        ]
      : []),
    p.text('subtitle', content.subtitle, { x: 42, y: 40, w: graphic ? 27 : 48, h: 20 }, {
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
    p.text('kicker', content.kicker, { x: 14, y: 18, w: 76, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    // Câu dài (> 90 ký tự) hạ cỡ để vẫn là một khối gọn thay vì tràn hộp.
    p.text('body', text, { x: 14, y: 27, w: 76, h: 42 }, {
      variant: 'title', fontSize: text.length > 90 ? 3.7 : 4.6, fontWeight: 600, textColor: p.fg,
    }),
    shapeEl('rule', { x: 14, y: 73, w: 12, h: 0.7 }, p.accent),
    p.text('author', content.author, { x: 14, y: 77, w: 76, h: 8 }, {
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
  // Có hình khớp nghĩa → cột phải cao bằng panel chữ; không có → panel chữ rộng hết cỡ (không để icon lạc quẻ).
  const textW = graphic ? 56 : 78
  const boxH = Math.min(regionH - 6, Math.max(24, textBoxHeight(text, textW, size, 1.4, { weight: 500 }) * 1.3))
  const top = regionTop + (regionH - boxH) / 2
  return compact([
    shapeEl('content-panel', { x: 7, y: top - 3, w: graphic ? 66 : 86, h: boxH + 6 }, p.panel, 'round'),
    shapeEl('accent-rail', { x: 5.6, y: top, w: 0.9, h: boxH }, p.accent),
    ...(graphic ? graphicPlate('bullet-graphic', graphic, { x: 75, y: top - 3, w: 18, h: boxH + 6 }, p) : []),
    p.text('kicker', content.kicker, { x: 8, y: 9, w: 84, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    ...header,
    p.text('bullets', text, { x: 8, y: top, w: textW, h: boxH }, {
      variant: 'body', fontSize: size, textColor: p.fg, valign: 'middle',
    }),
  ])
}

/**
 * AI hay viết nhãn đậm kiểu "**Lan:** câu…" hoặc "**Lan**: câu…" — cắt ở ":" sẽ để sót
 * một "**" mỗi bên và lộ dấu sao ra chữ. Nhãn vốn đã in đậm nên bỏ cặp ** quanh nhãn.
 */
function unboldLabel(item: string): string {
  return item.replace(/^(\s*)\*\*([^*\n:]{1,44}):\*\*/, '$1$2:').replace(/^(\s*)\*\*([^*\n:]{1,44})\*\*\s*:/, '$1$2:')
}

/** "Nhãn: mô tả" trong một mục thẻ → tiêu đề ngắn + phần mô tả. */
function splitCardItem(raw: string): { heading: string; body: string } {
  const item = unboldLabel(raw)
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
        p.text(`card-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
          x: x + 2, y: y + 2, w: badgeW, h: badgeH,
        }, {
          variant: 'body', fontSize: 1.9, fontWeight: 700, textColor: p.onAccent,
          align: 'center', valign: 'middle',
        }),
        p.text(`card-${index + 1}-heading`, heading, { x: x + 10.5, y: y + 2.5, w: cardW - 12.5 - (asset ? iconW + 1 : 0), h: 11 }, {
          variant: 'title', fontSize: heading.length > 24 ? 2.1 : 2.5, fontWeight: 700, textColor: p.fg,
        }),
        asset
          ? iconEl(`card-${index + 1}-icon`, asset, { x: x + cardW - iconW - 2, y: y + 2.5, w: iconW, h: 12 }, p.accent)
          : null,
        p.text(`card-${index + 1}`, body, bodyBox, {
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
      p.text(`card-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
        x: x + 2.5,
        y: y + 3,
        w: cardW - badgeW - 7,
        h: 7,
      }, {
        variant: 'body', fontSize: 1.35, fontWeight: 700, textColor: p.ink,
      }),
      p.text(`card-${index + 1}`, item, {
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
function splitLabel(raw: string): { label: string; text: string } {
  const item = unboldLabel(raw)
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
      p.text('body', bulletText(left), boxFor('left'), {
        variant: 'body', fontSize: size, textColor: p.fg, valign: 'middle',
      }),
      p.text('body-2', bulletText(right), boxFor('right'), {
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
          p.text(`${id}-heading`, block.label, { x: box.x, y, w: colW, h }, {
            variant: 'body', fontSize: size, fontWeight: 700, lineHeight: 1.3, textColor: p.ink,
          }),
        )
        y += h
      }
      const h = textBoxHeight(block.text, colW, size * 0.95, 1.4, { weight: 500 })
      out.push(
        p.text(id, block.text, { x: box.x, y, w: colW, h }, {
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
    p.text(x < 50 ? 'left-title' : 'right-title', title, { x: x + 2, y: 28, w: 36, h: 8 }, {
      variant: 'body', fontSize: 2.1, fontWeight: 700, textColor: color, align: 'center',
    }),
    p.text(x < 50 ? 'body' : 'body-2', bulletText(items), { x: x + 2.5, y: 38, w: 35, h: 51 }, {
      variant: 'body', fontSize: 2.8, textColor: p.fg, valign: 'middle',
    }),
  ]

  return compact([
    ...titleEls(p, content.title, HEADER_BOX, HEADER_SIZES, true),
    ...side(left, content.leftTitle, 8, p.ink),
    ...side(right, content.rightTitle, 52, p.ink),
    shapeEl('vs-badge', { x: 47.5, y: 52, w: 5, h: 8.9 }, p.accent, 'ellipse'),
    p.text('mark', 'VS', { x: 47.5, y: 52, w: 5, h: 8.9 }, {
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
    p.text('mark', '“', { x: 8, y: 12, w: 12, h: 16 }, {
      variant: 'title', fontSize: 9, fontWeight: 700, textColor: p.ink,
    }),
    shapeEl('quote-bar', { x: 8, y: 28, w: 0.5, h: 32 }, p.accent),
    p.text('quote', quote, { x: 13, y: 28, w: 75, h: 30 }, {
      variant: 'body', fontSize: 3.2, fontStyle: 'italic', textColor: p.fg,
    }),
    p.text('author', content.author, { x: 13, y: 60, w: 75, h: 8 }, {
      variant: 'body', fontSize: 1.8, fontWeight: 600, textColor: p.ink,
    }),
  ])
}

function composeClosing(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const title = content.title?.trim() || content.body?.trim()
  if (!title) return []
  const graphic = chosenGraphic(content)
  return compact([
    ornament('decor-1', 'orn-canh-la', 5, 6, 12, p.ink),
    graphic ? graphicEl('closing-graphic', graphic, { x: 45, y: 10, w: 10, h: 17.8 }, GRAPHIC_INK) : null,
    ornament('decor-2', 'orn-bo-hoa', 85, 72, 10, p.ink),
    shapeEl('accent-line', { x: 47, y: 32, w: 6, h: 0.8 }, p.accent),
    p.text('title', title, { x: 8, y: 36, w: 84, h: 18 }, {
      variant: 'title', fontSize: 5.2, fontWeight: 700, textColor: p.fg, align: 'center',
    }),
    p.text('subtitle', content.subtitle, { x: 12, y: 57, w: 76, h: 16 }, {
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
    p.text('kicker', agendaKicker, { x: 6, y: 24, w: 24, h: agendaKickerH }, {
      variant: 'body', fontSize: 1.6, fontWeight: 600, textColor: p.onAccent,
    }),
    ...titleEls(p, content.title, { x: 6, y: agendaTitleY, w: 24, h: 63 - agendaTitleY }, [3.2, 2.9, 2.6, 2.4], false, p.onAccent),
    shapeEl('rule', { x: 6, y: 66, w: 9, h: 0.7 }, p.onAccent),
    ...items.flatMap((item, index) => {
      const y = top + index * rowH
      return [
        p.text(`card-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
          x: 41, y: y + 1, w: 8, h: 7,
        }, {
          variant: 'body', fontSize: 2.2, fontWeight: 700, textColor: p.ink,
        }),
        p.text(`card-${index + 1}`, item.replace(/^\s*\d{1,2}\s*[.)·:\-–]\s*/, ''), {
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
    p.text('bullets', bulletText(lines), {
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
    p.text('title', content.title, { x: 10, y: 67, w: 48, h: 12 }, {
      variant: 'title', fontSize: 3.2, fontWeight: 700, textColor: p.fg,
    }),
    p.text('body', content.body, { x: 10, y: 79, w: 48, h: 12 }, {
      variant: 'body', fontSize: 1.8, textColor: p.muted,
    }),
  ])
}

const STAT_FALLBACK_ICONS: SlideAssetId[] = ['chart', 'target', 'idea', 'check', 'globe']

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
  // icon theo nội dung; ô nào không khớp từ khoá thì lấy icon chung chưa dùng,
  // để không có cảnh 3 thẻ mà chỉ 2 thẻ có icon (lệch hàng)
  const picked = stats.map((stat) => pickSlideAsset(`${stat.label} ${stat.value}`, usedIcons))
  if (picked.some(Boolean)) {
    const spare = STAT_FALLBACK_ICONS.filter((id) => !usedIcons.has(id))
    picked.forEach((id, i) => {
      if (!id) picked[i] = spare.shift()
    })
  }
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
    const asset = picked[index]
    return [
      panel,
      asset ? shapeEl(`stat-${index + 1}-icon-badge`, { x: x + cellW / 2 - 9, y: area.y + 2, w: 18, h: 14 }, p.accent, 'round') : null,
      asset ? iconEl(`stat-${index + 1}-icon`, asset, { x: x + cellW / 2 - 8, y: area.y + 3, w: 16, h: 12 }, p.onAccent) : null,
      p.text(`stat-${index + 1}-value`, stat.value || stat.label, { x, y: area.y + 17, w: cellW, h: 16 }, {
        variant: 'title', fontSize: 6.2, fontWeight: 700, textColor: p.ink, align: 'center', valign: 'middle',
      }),
      stat.value
        ? p.text(`stat-${index + 1}-label`, stat.label, { x, y: area.y + 35, w: cellW, h: 13 }, {
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
        p.text(`stat-${index + 1}-value`, stat.value, { x: 8, y, w: 42, h: 14 }, {
          variant: 'title', fontSize: 6.4, fontWeight: 700, textColor: p.ink,
        }),
        p.text(`stat-${index + 1}-label`, stat.label, { x: 8, y: y + 15, w: 42, h: 8 }, {
          variant: 'body', fontSize: 1.8, textColor: p.muted,
        }),
      ]
    }),
  ])
}

const EDITORIAL_TITLE = { variant: 'title', fontWeight: 800, lineHeight: 1.1, valign: 'top' } as const
const PHOTO_FOREGROUND = '#ffffff'
const PHOTO_MUTED = '#e2e0dc'

function layoutPhoto(
  id: string,
  src: string | undefined,
  box: Box,
  crop?: SlideElement['crop'],
  x = 50,
  y = 50,
): SlideElement {
  return { id, type: 'image', src, ...box, crop, imagePosition: { x, y }, radius: 0 }
}

function composeBigNum(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  const w = c.image ? 52 : 88
  const value = c.value?.trim()
  const size = value ? singleLineSize(value, w, c.image ? 20 : 23, 800, slideFontStack(p.displayFont)) : 20
  return compact([
    c.image ? layoutPhoto('image-1', c.image, { x: 60, y: 9, w: 34, h: 76 }, c.imageCrop, c.focusX, c.focusY) : null,
    p.text('kicker', upper(c.kicker), { x: 5, y: 8, w, h: 11 }, {
      variant: 'body', fontSize: 1.55, fontWeight: 700, textColor: p.muted, valign: 'top', lineHeight: 1.2,
    }),
    p.text('bignum-value', value, { x: 5, y: 19, w, h: 44 }, {
      ...EDITORIAL_TITLE, fontFamily: p.displayFont, fontSize: size, lineHeight: 1, textColor: p.ink, valign: 'middle',
    }),
    p.text('bignum-label', c.label, { x: 5, y: 67, w, h: 13 }, {
      ...EDITORIAL_TITLE, fontSize: 3.6, textColor: p.fg,
    }, 0.45),
    p.text('subtitle', c.subtitle, { x: 5, y: 80, w, h: 9 }, {
      variant: 'body', fontSize: 1.75, lineHeight: 1.18, textColor: p.muted, valign: 'top',
    }, 0.45),
  ])
}

function composePhotoFull(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  const position = c.textPosition ?? 'bottom'
  const left = position === 'left'
  const w = left ? 29 : 86
  const titleY = left ? 23 : c.subtitle ? 66 : 69
  const titleH = left ? 39 : c.subtitle ? 15 : 19
  return compact([
    layoutPhoto('image-1', c.image, { x: 0, y: 0, w: 100, h: 100 }, c.imageCrop, c.focusX, c.focusY ?? (left ? 45 : 30)),
    { ...shapeEl('photo-scrim', { x: 0, y: 0, w: 100, h: 100 }, photoScrimFill(position)), border: 0, shadowLevel: 0 },
    left && c.credit ? {
      ...shapeEl('photo-credit-scrim', { x: 0, y: 76, w: 100, h: 24 }, PHOTO_CREDIT_FILL),
      border: 0, shadowLevel: 0,
    } : null,
    p.text('title', c.title, { x: 5, y: titleY, w, h: titleH }, {
      ...EDITORIAL_TITLE, fontSize: left ? 5 : 5.6, textColor: PHOTO_FOREGROUND, valign: 'middle',
    }, 0.38),
    p.text('subtitle', c.subtitle, { x: 5, y: left ? 62 : 81, w, h: left ? 21 : 8 }, {
      variant: 'body', fontSize: 1.9, lineHeight: 1.16, textColor: PHOTO_MUTED, valign: 'top',
    }, 0.48),
  ])
}

function composePhotoCompare(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  const captions = Boolean(c.caption || c.caption2)
  const imageH = captions ? 52 : c.credit ? 62 : 67
  return compact([
    p.text('title', c.title, { x: 5, y: 6, w: 90, h: 18 }, {
      ...EDITORIAL_TITLE, fontSize: 5.3, textColor: p.fg,
    }, 0.4),
    layoutPhoto('image-1', c.image, { x: 6, y: 24, w: 43, h: imageH }, c.imageCrop),
    layoutPhoto('image-2', c.image2, { x: 51, y: 24, w: 43, h: imageH }, c.image2Crop),
    p.text('photo-caption', c.caption, { x: 5, y: 77, w: 45, h: 11 }, {
      variant: 'body', fontSize: 1.7, lineHeight: 1.16, textColor: p.muted, valign: 'top',
    }, 0.5),
    p.text('photo-caption-2', c.caption2, { x: 50, y: 77, w: 45, h: 11 }, {
      variant: 'body', fontSize: 1.7, lineHeight: 1.16, textColor: p.muted, valign: 'top',
    }, 0.5),
  ])
}

const upper = (text?: string): string | undefined => text?.toLocaleUpperCase('vi')

const hairline = (id: string, box: Box, color: string): SlideElement =>
  ({ ...shapeEl(id, box, color), border: 0, shadowLevel: 0 as const })

function composeRules(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  const rows = (c.stats ?? [])
    .map((s) => ({ value: String(s.value ?? '').trim(), label: String(s.label ?? '').trim() }))
    .filter((s) => s.value || s.label)
    .slice(0, 5)
  if (rows.length === 0) return []
  const top = 38
  const row = Math.min(14, 50 / rows.length)
  const longest = Math.max(...rows.map((r) => r.value.length))
  const valueSize = longest <= 9 ? 3.6 : longest <= 14 ? 3.1 : 2.7
  return compact([
    p.text('kicker', upper(c.kicker), { x: 5, y: 8, w: 80, h: 5 }, {
      variant: 'body', fontSize: 1.85, fontWeight: 700, textColor: p.ink, valign: 'top', lineHeight: 1.2,
    }),
    p.text('title', c.title, { x: 5, y: 13, w: 90, h: 20 }, {
      ...EDITORIAL_TITLE, fontSize: 5.3, textColor: p.fg,
    }, 0.4),
    ...rows.flatMap((r, i) => {
      const y = top + i * row
      return [
        hairline(`divider-${i + 1}`, { x: 5, y, w: 90, h: 0.18 }, p.muted),
        p.text(`item-${i + 1}-value`, r.value, { x: 5, y: y + 0.6, w: 21, h: row - 1.2 }, {
          ...EDITORIAL_TITLE, fontSize: valueSize, textColor: p.ink, valign: 'middle',
        }, 0.9),
        p.text(`item-${i + 1}-label`, r.label, { x: 28, y: y + 0.6, w: 67, h: row - 1.2 }, {
          variant: 'body', fontSize: rows.length > 4 ? 1.9 : 2.15, lineHeight: 1.22, textColor: p.fg, valign: 'middle',
        }, 0.55),
      ]
    }),
    hairline(`divider-${rows.length + 1}`, { x: 5, y: top + rows.length * row, w: 90, h: 0.18 }, p.muted),
  ])
}

function composeEditorialText(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  let lines = cleanList(c.bullets)
  if (lines.length === 0) lines = linesOf(c.body)
  if (lines.length === 0 && !c.title?.trim()) return []
  const text = lines.join('\n\n')
  return compact([
    p.text('kicker', upper(c.kicker), { x: 5, y: 8, w: 80, h: 5 }, {
      variant: 'body', fontSize: 1.85, fontWeight: 700, textColor: p.ink, valign: 'top', lineHeight: 1.2,
    }),
    p.text('title', c.title, { x: 5, y: 15, w: 40, h: 60 }, {
      ...EDITORIAL_TITLE, fontSize: 6, textColor: p.fg,
    }, 0.4),
    hairline('divider-1', { x: 48.5, y: 16, w: 0.12, h: 62 }, p.muted),
    p.text('body', text, { x: 52, y: 15, w: 43, h: 66 }, {
      variant: 'body', fontSize: lines.length > 3 ? 1.95 : 2.2, lineHeight: 1.3, textColor: p.fg, valign: 'top',
    }, 0.55),
  ])
}

function composeManifesto(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  const text = c.body?.trim() || c.quote?.trim() || cleanList(c.bullets).join(' ') || c.title?.trim() || ''
  if (!text) return []
  const size = text.length > 180 ? 3.7 : text.length > 110 ? 4.5 : 5.6
  return compact([
    p.text('kicker', upper(c.kicker), { x: 6, y: 12, w: 80, h: 5 }, {
      variant: 'body', fontSize: 1.85, fontWeight: 700, textColor: p.ink, valign: 'top', lineHeight: 1.2,
    }),
    p.text('body', text, { x: 6, y: 21, w: 86, h: 52 }, {
      ...EDITORIAL_TITLE, fontSize: size, textColor: p.fg, valign: 'top',
    }, 0.45),
    c.author?.trim() ? hairline('rule', { x: 6, y: 77, w: 8, h: 0.4 }, p.accent) : null,
    p.text('author', c.author, { x: 6, y: 79, w: 86, h: 7 }, {
      variant: 'body', fontSize: 1.8, fontWeight: 600, textColor: p.muted, valign: 'top',
    }, 0.6),
  ])
}

const BAR_INTEGER = new Intl.NumberFormat('vi-VN')

function formatBarValue(value: number): string {
  if (value > 0 && value < 0.001) return value.toExponential().replace('.', ',')
  const [integer, decimal] = String(value).split('.')
  return BAR_INTEGER.format(Number(integer)) + (decimal ? ',' + decimal : '')
}

function composeBars(p: LayoutPalette, c: SlideLayoutContent): SlideElement[] {
  const bars = (Array.isArray(c.bars) ? c.bars : []).filter((bar) => bar?.label && Number.isFinite(bar.value) && bar.value >= 0).slice(0, 6)
  const max = Math.max(...bars.map((bar) => bar.value), 0)
  const row = Math.min(24, 60 / Math.max(bars.length, 1))
  const top = 26 + (60 - row * bars.length) / 2
  const axis = 31
  return compact([
    p.text('title', c.title, { x: 5, y: 6, w: 90, h: 18 }, {
      ...EDITORIAL_TITLE, fontSize: 5.3, textColor: p.fg,
    }, 0.4),
    bars.length ? { ...shapeEl('bars-axis', { x: axis - 0.16, y: top, w: 0.16, h: row * bars.length }, p.muted), border: 0, shadowLevel: 0 } : null,
    ...bars.flatMap((bar, i) => {
      const id = 'bar-' + (i + 1)
      const y = top + i * row
      const h = Math.min(row * 0.53, 8)
      const w = max > 0 ? 46 * (bar.value / max) : 0
      const value = formatBarValue(bar.value)
      return [
        p.text(id + '-label', bar.label, { x: 5, y, w: 25, h: row }, {
          variant: 'body', fontSize: bars.length > 4 ? 1.65 : 2.05, lineHeight: 1.15, textColor: p.fg, valign: 'middle',
        }, 0.55),
        w > 0 ? {
          ...shapeEl(id + (bar.color ? '-custom' : ''), { x: axis, y: y + (row - h) / 2, w, h }, bar.color ?? p.ink),
          border: 0, shadowLevel: 0 as const,
        } : null,
        p.text(id + '-value', value, { x: axis + w + 0.35, y, w: 17.65, h: row }, {
          ...EDITORIAL_TITLE, fontSize: singleLineSize(value, 17.65, 2, 800, slideFontStack(p.displayFont)), textColor: p.fg, valign: 'middle',
        }),
      ]
    }),
  ])
}

/** Nguồn là hộp chữ chỉnh sửa được, lưu cùng các phần tử của slide. */
export function creditElement(credit: string | undefined, color: string): SlideElement | null {
  return textEl('credit', credit?.trim().replace(/\s+/g, ' '), { x: 5, y: 89, w: 89, h: 6.1 }, {
    fontSize: 1.2, fontFamily: 'Arial', lineHeight: 1.1, textColor: color, valign: 'top',
  }, 0.72)
}

export function withSlideCredit(elements: SlideElement[], credit: SlideElement | null): SlideElement[] {
  if (!credit) return elements
  const content = elements.filter((el) => el.id !== 'credit')
  const isFullHeight = (el: SlideElement) => el.y === 0 && el.h === 100 && el.type !== 'text'
  const bottom = bottomOf(content.filter((el) => !isFullHeight(el) && el.id !== 'photo-credit-scrim'))
  const scale = bottom > credit.y ? credit.y / bottom : 1
  const fitted = scale === 1 ? content : content.map((el) => {
    if (isFullHeight(el) || el.id === 'photo-credit-scrim') return el
    const sized = {
      ...el, y: el.y * scale, h: el.h * scale,
      ...(el.fontSize ? { fontSize: el.fontSize * scale } : {}),
    }
    const base = BASE_SIZE.get(el)
    if (base) BASE_SIZE.set(sized, base)
    return sized
  })
  return [...fitted, credit]
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
    const label = p.text(`item-${index + 1}`, step, {
      x: left + 1,
      y: 51,
      w: slot - 2,
      h: 29,
    }, {
      variant: 'body', fontSize: stepSize, textColor: p.fg, align: 'center',
    })
    if (tag) return [tag, label]
    return [
      p.text(`step-${index + 1}-index`, String(index + 1).padStart(2, '0'), {
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
      p.text(`item-${index + 1}`, step, {
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
      p.text(`node-${index + 1}-index`, String(index + 1), {
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
    p.text('kicker', content.kicker, { x: 8, y: 10, w: 84, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    p.text('question', question, { x: 8, y: 18, w: 84, h: 18 }, {
      variant: 'title', fontSize: 3.2, fontWeight: 700, textColor: p.fg,
    }),
    ...optionEls,
    answerText ? shapeEl('answer-bar', { x: 8, y: 77, w: 84, h: 14 }, p.surface, 'round') : null,
    answerText ? shapeEl('answer-stripe', { x: 8, y: 77, w: 0.8, h: 14 }, p.accent) : null,
    p.text('answer', answerText, { x: 10.5, y: 77, w: 80, h: 14 }, {
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
    p.text('problem-label', 'ĐỀ BÀI', { x: 10, y: top + 2, w: leftW - 4, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 700, textColor: p.ink, letterSpacing: 0.12,
    }),
    p.text('problem', problem, { x: 10, y: top + 9, w: leftW - 4, h: areaH - 11 }, {
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
              p.text(`step-${index + 1}-index`, String(index + 1), {
                x: 43, y: y + (rowH - badgeH) / 2, w: badgeW, h: badgeH,
              }, {
                variant: 'body', fontSize: 1.9, fontWeight: 700, textColor: p.onAccent, align: 'center', valign: 'middle',
              }),
            ]),
        p.text(`item-${index + 1}`, step, { x: 49, y, w: 43, h: rowH }, {
          variant: 'body', fontSize: 2.2, textColor: p.fg, valign: 'middle',
        }),
      ]
    }),
    conclusion ? shapeEl('conclusion-bar', { x: 8, y: barY, w: 84, h: barH }, p.accent, 'round') : null,
    p.text('conclusion', conclusion, { x: 10, y: barY, w: 80, h: barH }, {
      variant: 'body', fontSize: 2.4, fontWeight: 700, textColor: p.onAccent, align: 'center', valign: 'middle',
    }),
  ])
}

/**
 * Mở bài: câu hỏi/tình huống lớn canh trái bên một vạch nhấn; cột phải là panel chứa hình
 * (đồ hoạ/icon) và 2–3 gợi ý xếp dọc.
 */
function composeHook(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const body = content.body?.trim() || cleanList(content.bullets)[0]
  if (!body) return []
  const pills = cleanList(content.items).slice(0, 3)
  const graphic = chosenGraphic(content)
  const art = { x: 72, y: 14, w: 14.1, h: 25 }
  const pillH = 13
  const pillsTop = 46
  return compact([
    shapeEl('hook-bar', { x: 8, y: 13, w: 0.7, h: 74 }, p.accent),
    p.text('kicker', content.kicker, { x: 11, y: 12, w: 50, h: 6 }, {
      variant: 'body', fontSize: 1.7, fontWeight: 600, textColor: p.ink,
    }),
    ...titleEls(p, content.title, { x: 11, y: 18, w: 50, h: 14 }, [3.4, 3.0, 2.7], false),
    p.text('body', body, { x: 11, y: 36, w: 50, h: 52 }, {
      variant: 'title', fontSize: 3.3, fontWeight: 600, textColor: p.fg, valign: 'top',
    }),
    shapeEl('hook-panel', { x: 66, y: 11, w: 27, h: 80 }, p.panel, 'round'),
    ...(graphic
      ? graphicPlate('hook-graphic', graphic, art, p)
      : [iconEl('hook-icon', pickSlideAsset(`${content.title ?? ''} ${body}`) ?? 'idea', art, p.accent)]),
    pills.length
      ? p.text('hook-label', 'GỢI Ý', { x: 68.5, y: 40.5, w: 22, h: 4.5 }, {
          variant: 'body', fontSize: 1.5, fontWeight: 700, textColor: p.ink, letterSpacing: 0.12, align: 'center',
        })
      : null,
    ...pills.flatMap((pill, index) => {
      const y = pillsTop + index * (pillH + 2)
      return [
        shapeEl(`pill-${index + 1}`, { x: 68.5, y, w: 22, h: pillH }, p.background, 'round'),
        p.text(`card-${index + 1}`, pill, { x: 69.5, y, w: 20, h: pillH }, {
          variant: 'body', fontSize: 1.8, fontWeight: 600, textColor: p.fg, align: 'center', valign: 'middle',
        }),
      ]
    }),
  ])
}

/** Đường cong nối hai điểm (toạ độ % khung): S-curve tiếp tuyến ngang, vẽ bằng SVG ở renderer. */
function connectorEl(id: string, x1: number, y1: number, x2: number, y2: number, color: string, width = 3): SlideElement {
  const [xl, yl, xr, yr] = x1 <= x2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1]
  return {
    id,
    type: 'connector',
    x: xl,
    y: Math.min(yl, yr),
    w: Math.max(xr - xl, 0.1),
    h: Math.max(Math.abs(yr - yl), 0.1),
    // đường mặc định đi từ góc trên-trái xuống dưới-phải; đầu trái thấp hơn đầu phải thì lật dọc
    flipY: yl > yr,
    border: width,
    borderColor: color,
  }
}

/** "Nhãn nhánh: ý con; ý con" → nhãn + tối đa 3 ý con. */
function parseBranch(raw: string): { label: string; children: string[] } {
  const item = unboldLabel(raw)
  const at = item.indexOf(':')
  const label = (at > 0 ? item.slice(0, at) : item).trim()
  const rest = at > 0 ? item.slice(at + 1) : ''
  const children = rest
    .split(/\s*[;\n]\s*/)
    .map((c) => c.replace(/^[•\-–]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)
  return { label, children }
}

/**
 * Sơ đồ tư duy do engine bố trí: nút giữa, các nhánh chia hai cột (nửa đầu bên phải, nửa sau bên trái),
 * đường nối cong, ý con xếp dưới nhãn nhánh. AI chỉ đưa cây dữ liệu, không đưa toạ độ.
 */
function composeMindmap(p: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
  const center = content.body?.trim() || content.subtitle?.trim()
  const branches = cleanList(content.items).slice(0, 6).map(parseBranch)
  if (!center || branches.length < 2) return []
  const header = titleEls(p, content.title, { x: 8, y: 6, w: 84, h: 12 }, [3.8, 3.4, 3.1, 2.8])
  const top = Math.max(24, bottomOf(header) + 2)
  const area = 96 - top
  const cy = top + area / 2
  const colW = 25
  const labelH = 8
  const rightCount = Math.ceil(branches.length / 2)
  const colors = [p.accent, p.secondary, mixHex(p.accent, p.secondary, 0.5)]
  // Nút giữa: chủ đề ngắn dùng nút nhỏ chữ lớn; chủ đề dài nới nút ra và hạ cỡ chữ để vẫn nằm gọn trong nút.
  const long = center.length > 40
  const nodeW = long ? 26 : 18
  const nodeH = long ? 28 : 16
  const nodeSize =
    [2.2, 1.9, 1.6, 1.4, 1.2].find((s) => textBoxHeight(center, nodeW - 2, s, 1.25, { weight: 700 }) <= nodeH - 2) ?? 1.2
  const els: SlideElement[] = []
  const nodes: Array<SlideElement | null> = []

  const place = (side: 'right' | 'left', list: Array<{ branch: ReturnType<typeof parseBranch>; index: number }>) => {
    const slot = area / list.length
    const x = side === 'right' ? 100 - 6 - colW : 6
    list.forEach(({ branch, index }, k) => {
      const color = colors[index % colors.length]
      const size = [1.6, 1.45, 1.3].find(
        (s) => !branch.children.length || textBoxHeight(branch.children.join('\n'), colW - 1, s, 1.35, { weight: 500 }) <= slot - labelH - 3,
      ) ?? 1.3
      const kidsH = branch.children.length
        ? Math.min(slot - labelH - 3, textBoxHeight(branch.children.join('\n'), colW - 1, size, 1.35, { weight: 500 }))
        : 0
      const block = labelH + (kidsH ? 1 + kidsH : 0)
      const y = top + slot * k + (slot - block) / 2
      els.push(
        side === 'right'
          ? connectorEl(`link-${index + 1}`, 50 + nodeW / 2, cy, x, y + labelH / 2, color)
          : connectorEl(`link-${index + 1}`, x + colW, y + labelH / 2, 50 - nodeW / 2, cy, color),
      )
      nodes.push(
        { ...shapeEl(`card-${index + 1}-box`, { x, y, w: colW, h: labelH }, mixHex(color, p.background, 0.8), 'round'), radius: 14, border: 2, borderColor: color, shadow: false },
        p.text(`card-${index + 1}-heading`, branch.label, { x: x + 1, y, w: colW - 2, h: labelH }, {
          variant: 'body', fontSize: 1.9, fontWeight: 700, textColor: p.fg, align: 'center', valign: 'middle',
        }),
      )
      if (branch.children.length) {
        nodes.push(
          p.text(`card-${index + 1}`, branch.children.map((c) => `• ${c}`).join('\n'), { x: x + 0.5, y: y + labelH + 1, w: colW - 1, h: kidsH }, {
            variant: 'body', fontSize: size, textColor: p.fg, align: side === 'right' ? 'left' : 'right',
          }),
        )
      }
    })
  }
  const indexed = branches.map((branch, index) => ({ branch, index }))
  place('right', indexed.slice(0, rightCount))
  place('left', indexed.slice(rightCount))

  return compact([
    ...header,
    ...els,
    { ...shapeEl('center-node', { x: 50 - nodeW / 2, y: cy - nodeH / 2, w: nodeW, h: nodeH }, p.accent, 'round'), radius: 40, shadow: false },
    p.text('body', center, { x: 51 - nodeW / 2, y: cy - nodeH / 2, w: nodeW - 2, h: nodeH }, {
      variant: 'body', fontSize: nodeSize, fontWeight: 700, textColor: p.onAccent, align: 'center', valign: 'middle',
    }),
    ...nodes,
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
  const built = composeStatic(theme, layoutId, content, tone)
  const animated = autoAnimate(built, isLayoutId(layoutId) ? layoutId : 'bullets')
  // autoAnimate trả bản sao → giữ lại cỡ thiết kế để `fitRatio` còn đo được
  animated.forEach((el, i) => {
    const base = BASE_SIZE.get(built[i])
    if (base) BASE_SIZE.set(el, base)
  })
  return animated
}

function composeStatic(
  theme: DeckTheme,
  layoutId: string,
  content: SlideLayoutContent,
  tone?: SlideTone,
): SlideElement[] {
  const resolved = normalizeTheme(theme)
  const id: SlideLayoutId = isLayoutId(layoutId) ? layoutId : 'bullets'
  const palette = paletteOf(resolved, tone && isTone(tone) ? tone : defaultTone(id))
  const elements = withKitDecor(id, composeById(id, palette, content), content, palette)
  if (!elements.length) return elements
  return withSlideCredit(elements, creditElement(content.credit, id === 'photo-full' ? PHOTO_MUTED : palette.muted))
}

function composeById(id: SlideLayoutId, palette: LayoutPalette, content: SlideLayoutContent): SlideElement[] {
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
    case 'bignum':
      return composeBigNum(palette, content)
    case 'photo-full':
      return composePhotoFull(palette, content)
    case 'photo-compare':
      return composePhotoCompare(palette, content)
    case 'bars':
      return composeBars(palette, content)
    case 'rules':
      return composeRules(palette, content)
    case 'editorial-text':
      return composeEditorialText(palette, content)
    case 'manifesto':
      return composeManifesto(palette, content)
    case 'timeline':
      return composeTimeline(palette, content)
    case 'cycle':
      return composeCycle(palette, content)
    case 'quiz':
      return composeQuiz(palette, content)
    case 'mindmap':
      return composeMindmap(palette, content)
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
  'problem', 'problem-label', 'conclusion', 'answer', 'center-node',
  'credit', 'bignum-value', 'bignum-label', 'photo-caption', 'photo-caption-2',
])
const NUMBERED = /^(card|option|stat|step|item|node|left|right|link)-\d+(-value|-label|-index|-heading|-box)?$/
const BAR_TEXT = /^bar-\d+-(label|value)$/
const isRoleId = (id: string): boolean => RESERVED.has(id) || NUMBERED.test(id) || BAR_TEXT.test(id)

const SKIN_DECOR_IDS = new Set([
  'kicker-bg', 'title-left-accent', 'section-rule', 'closing-accent',
  'split-left-block', 'left-tag', 'neon-line', 'terminal-prompt',
  'flourish-top', 'flourish-bot', 'star-badge', 'title-box',
  'sub-box', 'closing-box', 'chalk-line',
])
const STATIC_LAYOUT_IDS = new Set([
  'accent-band', 'accent-bar', 'accent-line', 'accent-rail', 'accent-rule',
  'answer-bar', 'answer-stripe', 'bullet-graphic', 'bullet-graphic-plate',
  'closing-graphic', 'conclusion-bar', 'content-panel', 'divider',
  'hero-graphic', 'hero-graphic-plate', 'hero-icon', 'hero-image', 'hero-panel',
  'hook-bar', 'hook-graphic', 'hook-graphic-plate', 'hook-icon', 'hook-label', 'hook-panel',
  'image-1', 'image-2', 'image-panel', 'photo-scrim', 'photo-credit-scrim', 'bars-axis', 'left-panel', 'problem-panel', 'quote-bar',
  'right-panel', 'rule', 'scrim', 'section-graphic', 'section-graphic-plate',
  'section-panel', 'section-rule', 'side-panel', 'table', 'timeline-line',
  'timeline-panel', 'title-rule', 'vs-badge', 'decor-1', 'decor-2',
])
const NUMBERED_LAYOUT_STRUCT = /^(card|stat|step|node|pill|divider|decor|decor-kit|left|right)-\d+(-[a-z-]+)?$/

/** Phần tử trang trí/motif do skin hoặc decor kit thêm vào (không phải nội dung người dùng). */
export const isSkinDecorId = (id: string): boolean =>
  id.startsWith('skin-motif-') || SKIN_DECOR_IDS.has(id)

export const isDecorElement = (el: SlideElement): boolean =>
  Boolean(el.decor) || isSkinDecorId(el.id)

/** Phần tử được sinh ra bởi layout engine (kể cả text vai trò lẫn hình khối nền/viền của layout). */
export const isLayoutOwnedId = (id: string): boolean =>
  isRoleId(id) || NUMBERED_LAYOUT_STRUCT.test(id) || /^bar-\d+(-custom)?$/.test(id) || STATIC_LAYOUT_IDS.has(id)

/** Đọc nội dung slide đang có để đổi layout mà không mất chữ/ảnh/bảng. */
export function contentFromSlide(slide: Slide): SlideLayoutContent {
  const contentEls = slide.elements.filter((el) => !isDecorElement(el))
  const texts = contentEls.filter(
    (el): el is SlideElement & { text: string } =>
      el.type === 'text' && Boolean(el.text?.trim()),
  )
  const byId = (id: string) => texts.find((el) => el.id === id)?.text
  // deck mặc định cũ: phần tử chữ đầu tiên không giữ vai trò nào → coi là tiêu đề
  const titleEl =
    texts.find((el) => el.id === 'title') ??
    texts.find((el) => el.variant === 'title' && !isRoleId(el.id)) ??
    texts.find((el) => !isRoleId(el.id))
  const isComposedLayout = Boolean(slide.layout && isLayoutId(slide.layout)) && texts.some((el) => isRoleId(el.id))
  const bullets = [
    ...linesOf(byId('bullets')),
    ...(isComposedLayout
      ? []
      : texts
          .filter((el) => el !== titleEl && !isRoleId(el.id))
          .flatMap((el) => linesOf(el.text))),
  ]

  const optionEls = contentEls
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
  const tableEl = contentEls.find((el) => el.type === 'table')
  const images = contentEls.filter((el) => el.type === 'image')
  const imageEl = images.find((el) => el.id === 'image-1') ?? images[0]
  const image2 = images.find((el) => el.id === 'image-2') ?? images.find((el) => el !== imageEl)
  const bars = texts.filter((el) => /^bar-\d+-value$/.test(el.id)).flatMap((el) => {
    const id = el.id.replace(/-value$/, '')
    const label = byId(id + '-label')
    const value = Number(el.text.replace(/\./g, '').replace(',', '.'))
    const color = contentEls.find((item) => item.id === id + '-custom')?.fill
    return label && Number.isFinite(value) && value >= 0 ? [{ label, value, color }] : []
  })
  const graphicEl = contentEls.find(
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
  const rawTitle = byId('title') ?? titleEl?.text
  const scrim = contentEls.find((el) => el.id === 'photo-scrim')
  const rawKicker = byId('kicker')
  return {
    title: rawTitle?.replace(/^\[ ([\s\S]+) \]$/, '$1'),
    problem: byId('problem'),
    conclusion: byId('conclusion'),
    explanation: answerMatch?.[2]?.trim() || undefined,
    kicker: rawKicker?.replace(/^> EXECUTE:\s*/, '').replace(/^—\s*(.+?)\s*—$/, '$1'),
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
    imageCrop: imageEl?.crop,
    focusX: imageEl?.imagePosition?.x,
    focusY: imageEl?.imagePosition?.y,
    image2: image2?.src,
    image2Crop: image2?.crop,
    caption: byId('photo-caption'),
    caption2: byId('photo-caption-2'),
    textPosition: scrim ? (scrim.fill === photoScrimFill('left') ? 'left' : 'bottom') : undefined,
    value: byId('bignum-value'),
    label: byId('bignum-label'),
    bars: bars.length ? bars : undefined,
    credit: byId('credit'),
    graphic: graphicEl?.graphicId,
    decorKit: slide.decorKit,
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
  bignum: {
    kicker: 'MỐC THỜI GIAN',
    value: '2021',
    label: 'Một dấu mốc mới',
    subtitle: 'Có hiệu lực từ ngày 22 tháng 1.',
  },
  'photo-full': {
    title: 'Một góc nhìn khác',
    subtitle: 'Toàn cảnh nhìn từ bờ sông.',
  },
  'photo-compare': {
    title: 'Cùng một địa điểm qua thời gian',
    caption: 'Ảnh tư liệu · năm 1921',
    caption2: 'Cùng góc nhìn · năm 2019',
  },
  bars: {
    title: 'Lượng khách theo năm',
    bars: [{ label: '2022', value: 140000 }, { label: '2023', value: 70000 }],
  },
  rules: {
    kicker: 'DÒNG THỜI GIAN',
    title: 'Ba mốc làm nên bước ngoặt',
    stats: [
      { value: '1945', label: 'Sự kiện mở đầu chuỗi biến cố.' },
      { value: '1954', label: 'Mốc quyết định thay đổi cục diện.' },
      { value: '1975', label: 'Kết thúc một giai đoạn dài.' },
    ],
  },
  'editorial-text': {
    kicker: 'BỐI CẢNH',
    title: 'Một quyết định thay đổi cả cục diện',
    bullets: ['Đoạn đầu nêu dữ kiện chính của slide.', 'Đoạn hai giải thích vì sao dữ kiện đó quan trọng.'],
  },
  manifesto: {
    kicker: 'LUẬN ĐIỂM',
    body: 'Một câu đủ mạnh để cả lớp nhớ.',
    author: 'Nguồn hoặc người nói',
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
  mindmap: {
    title: 'Sơ đồ tư duy',
    body: 'Chủ đề trung tâm',
    items: ['Nhánh một: ý con A; ý con B', 'Nhánh hai: ý con C; ý con D', 'Nhánh ba: ý con E', 'Nhánh bốn: ý con F; ý con G'],
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
    case 'bignum':
      if (!has(out.value)) out.value = out.stats?.[0]?.value ?? demo.value
      if (!has(out.label)) out.label = out.stats?.[0]?.label ?? out.title ?? demo.label
      if (!has(out.subtitle)) out.subtitle = demo.subtitle
      if (!has(out.kicker)) out.kicker = demo.kicker
      break
    case 'photo-full':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.subtitle)) out.subtitle = out.body ?? demo.subtitle
      break
    case 'photo-compare':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.caption) && !has(out.image)) out.caption = demo.caption
      if (!has(out.caption2) && !has(out.image2)) out.caption2 = demo.caption2
      break
    case 'bars':
      if (!has(out.title)) out.title = demo.title
      if (!list(out.bars)) out.bars = demo.bars
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
    case 'mindmap':
      if (!has(out.title)) out.title = demo.title
      if (!has(out.body)) out.body = demo.body
      if (!list(out.items)) out.items = demo.items
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
