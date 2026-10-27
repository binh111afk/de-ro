/**
 * Theme v2 cho slide — catalog token đầy đủ + chuẩn hoá theme cũ.
 *
 * `DeckTheme` giữ nguyên bộ ba `bg/fg/accent` (deck lưu trước chặng 21 vẫn đọc
 * được); các token còn lại là optional và do `normalizeTheme` suy ra khi thiếu.
 * Không nhân bản dữ liệu: `bg/fg/accent` vẫn là nguồn duy nhất cho nền/chữ/màu
 * nhấn, `surface/muted/secondary/chart` chỉ bổ sung cho layout sau này.
 */
import type { DeckFonts, DeckTheme, ThemeDecor } from '@/store/docs'

const SANS = 'Be Vietnam Pro'
const SERIF = "'Times New Roman', 'Liberation Serif', serif"
const MONO = "'JetBrains Mono Variable', ui-monospace, monospace"

/**
 * OKLCH → hex sRGB. Palette dựng từ một hue duy nhất nên các màu cùng "độ sáng
 * cảm nhận" và tương phản đoán trước được (tối ưu hơn chọn tay từng mã hex).
 */
function oklch(l: number, c: number, hue: number): string {
  const a = c * Math.cos((hue * Math.PI) / 180)
  const b = c * Math.sin((hue * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  const encode = (x: number) => {
    const v = Math.max(0, Math.min(1, x))
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
  }
  return `#${linear.map((v) => Math.round(encode(v) * 255).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Bộ màu từ một hue: nền gần trắng/đen ngả hue, **một** màu nhấn, màu phụ lệch
 * 150°. Accent đủ đậm để chữ trắng trên accent đạt ≥ 4,5:1 (light) và ngược lại
 * ở nền tối — test theme kiểm tra bất biến này.
 */
function palette(hue: number, opts: { chroma?: number; dark?: boolean } = {}) {
  const { chroma = 0.15, dark = false } = opts
  const hue2 = hue + 150
  return dark
    ? {
        bg: oklch(0.2, 0.03, hue),
        fg: oklch(0.96, 0.01, hue),
        surface: oklch(0.27, 0.035, hue),
        muted: oklch(0.76, 0.03, hue),
        accent: oklch(0.78, chroma * 0.85, hue),
        secondary: oklch(0.78, 0.1, hue2),
        chart: [0, 60, -60, 120, 210].map((d, i) => oklch(0.76, i ? 0.11 : chroma * 0.85, hue + d)),
      }
    : {
        bg: oklch(0.985, 0.008, hue),
        fg: oklch(0.24, 0.035, hue),
        surface: oklch(0.955, 0.02, hue),
        muted: oklch(0.46, 0.03, hue),
        accent: oklch(0.5, chroma, hue),
        secondary: oklch(0.5, 0.1, hue2),
        chart: [0, 150, 60, -60, 210].map((d, i) => oklch(i ? 0.58 : 0.5, i ? 0.11 : chroma, hue + d)),
      }
}

const FONTS_SANS = { heading: SANS, body: SANS, serif: SERIF, mono: MONO }
const FONTS_SERIF = { heading: SERIF, body: SANS, serif: SERIF, mono: MONO }

/**
 * 6 theme, mỗi theme một hue và một "tính cách". Gộp theo môn vào `tags`
 * (khoa học → Sáng, văn sử địa → Giấy ấm, sinh → Rừng, ngoại ngữ/nghệ thuật →
 * Tím). Bỏ hoạ tiết ồn (confetti/waves/grid/dots): hoạ tiết chỉ còn vân giấy và
 * vệt sáng góc. Id cũ vẫn tra được qua `LEGACY_THEME_IDS`.
 */
export const DECK_THEMES: DeckTheme[] = [
  {
    id: 'sang',
    name: 'Sáng',
    vibe: 'tin cậy, học thuật, chính xác — an toàn cho mọi chủ đề, hợp toán lý hoá',
    ...palette(262, { chroma: 0.17 }),
    radius: 14,
    shadow: 'soft',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'none',
    dark: false,
    tags: ['cơ bản', 'toán', 'lý', 'hoá', 'khoa học', 'tự nhiên'],
  },
  {
    id: 'dem-xanh',
    name: 'Đêm xanh',
    vibe: 'công nghệ, hiện đại, trình chiếu trong phòng tối',
    ...palette(240, { chroma: 0.15, dark: true }),
    radius: 14,
    shadow: 'none',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'none',
    dark: true,
    tags: ['cơ bản', 'công nghệ', 'tin học'],
  },
  {
    id: 'giay-am',
    name: 'Giấy ấm',
    vibe: 'ấm, truyền thống, văn chương, lịch sử, hoài niệm',
    ...palette(50, { chroma: 0.13 }),
    radius: 24,
    shadow: 'soft',
    fontHeading: SERIF,
    fontBody: SANS,
    fonts: FONTS_SERIF,
    decor: 'grain',
    dark: false,
    tags: ['cơ bản', 'văn', 'sử', 'địa', 'xã hội'],
  },
  {
    id: 'rung',
    name: 'Rừng',
    vibe: 'tươi, dịu, tự nhiên, sinh thái, sinh học',
    ...palette(155, { chroma: 0.12 }),
    radius: 18,
    shadow: 'soft',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'none',
    dark: false,
    tags: ['cơ bản', 'sinh', 'sinh học', 'tự nhiên'],
  },
  {
    id: 'tim',
    name: 'Tím',
    vibe: 'sáng tạo, trẻ trung, nghệ thuật, ngoại ngữ',
    ...palette(305, { chroma: 0.16 }),
    radius: 24,
    shadow: 'soft',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'glow',
    dark: false,
    tags: ['cơ bản', 'ngoại ngữ', 'tiếng anh', 'nghệ thuật'],
  },
  {
    id: 'do',
    name: 'Đỏ',
    vibe: 'mạnh, cảnh báo, năng lượng cao — kiểu poster',
    ...palette(28, { chroma: 0.18 }),
    radius: 0,
    shadow: 'hard',
    border: 2,
    borderColor: oklch(0.24, 0.035, 28),
    fontHeading: SERIF,
    fontBody: SANS,
    fonts: FONTS_SERIF,
    decor: 'none',
    dark: false,
    tags: ['cơ bản'],
  },
]

/** Id theme đã gộp ở chặng P1 → theme thay thế (deck cũ và dàn ý AI cũ vẫn chạy). */
const LEGACY_THEME_IDS: Record<string, string> = {
  'khoa-hoc': 'sang',
  'van-su-dia': 'giay-am',
  'sinh-hoc': 'rung',
  'ngoai-ngu-tin': 'tim',
}

/** Id catalog hợp lệ (đã đổi id cũ sang id mới), hoặc `undefined` nếu lạ. */
export function resolveThemeId(id?: string): string | undefined {
  if (!id) return undefined
  const mapped = LEGACY_THEME_IDS[id] ?? id
  return DECK_THEMES.some((t) => t.id === mapped) ? mapped : undefined
}

/* ------------------------------------------------------------------ *
 * Màu: parse/mix/tương phản
 * ------------------------------------------------------------------ */
function rgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const n = Number.parseInt(full, 16)
  if (full.length !== 6 || !Number.isFinite(n)) return [255, 255, 255]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')
}

/** Trộn `a` về phía `b` theo tỉ lệ 0–1 (dùng cho nền tông nhấn, màu phụ…). */
export function mixHex(a: string, b: string, ratio: number): string {
  const [r1, g1, b1] = rgb(a)
  const [r2, g2, b2] = rgb(b)
  return `#${toHex(r1 + (r2 - r1) * ratio)}${toHex(g1 + (g2 - g1) * ratio)}${toHex(b1 + (b2 - b1) * ratio)}`
}

function relativeLuminance(hex: string): number {
  const channel = (value: number) => {
    const s = value / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = rgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Tỉ lệ tương phản WCAG giữa hai màu (1–21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Chữ đọc được trên nền `bg` — chọn giữa mực đậm và trắng theo tương phản. */
export function readableTextOn(bg: string): string {
  return contrastRatio(bg, '#111827') >= contrastRatio(bg, '#ffffff') ? '#111827' : '#ffffff'
}

/* ------------------------------------------------------------------ *
 * Resolve
 * ------------------------------------------------------------------ */
export interface ResolvedTheme extends DeckTheme {
  id: string
  name: string
  tags: string[]
  dark: boolean
  surface: string
  muted: string
  secondary: string
  decor: ThemeDecor
  chart: string[]
  fonts: DeckFonts
  radius: number
  shadow: 'none' | 'soft' | 'hard'
  border: number
  borderColor: string
}

/**
 * Điền mọi token còn thiếu cho theme (kể cả theme cũ chỉ có bg/fg/accent).
 *
 * Theme của người dùng thắng catalog cùng `id` (hoặc cùng `bg` khi deck cũ
 * không lưu id); catalog chỉ cấp giá trị mặc định cho token thiếu.
 */
export function normalizeTheme(theme?: DeckTheme | null): ResolvedTheme {
  const source = theme ?? DECK_THEMES[0]
  const sourceId = resolveThemeId(source.id)
  const catalog = DECK_THEMES.find(
    (t) => (sourceId && t.id === sourceId) || (t.bg && source.bg && t.bg.toLowerCase() === source.bg.toLowerCase()),
  )
  const bg = source.bg || catalog?.bg || '#ffffff'
  const fg = source.fg || catalog?.fg || readableTextOn(bg)
  const accent = source.accent || catalog?.accent || '#2563eb'
  const secondary = source.secondary ?? catalog?.secondary ?? mixHex(accent, fg, 0.25)
  const fontHeading = source.fontHeading || catalog?.fontHeading || SANS
  const fontBody = source.fontBody || catalog?.fontBody || SANS
  const fonts: DeckFonts = {
    heading: source.fonts?.heading ?? fontHeading,
    body: source.fonts?.body ?? fontBody,
    serif: source.fonts?.serif ?? catalog?.fonts?.serif ?? SERIF,
    mono: source.fonts?.mono ?? catalog?.fonts?.mono ?? MONO,
  }

  return {
    ...catalog,
    ...source,
    id: source.id ?? catalog?.id ?? 'custom',
    name: source.name ?? catalog?.name ?? 'Tùy chỉnh',
    bg,
    fg,
    accent,
    fontHeading: fonts.heading,
    fontBody: fonts.body,
    tags: source.tags ?? catalog?.tags ?? [],
    dark: source.dark ?? catalog?.dark ?? readableTextOn(bg) === '#ffffff',
    surface: source.surface ?? catalog?.surface ?? mixHex(bg, fg, 0.06),
    muted: source.muted ?? catalog?.muted ?? mixHex(bg, fg, 0.55),
    secondary,
    decor: source.decor ?? catalog?.decor ?? 'none',
    chart: source.chart ?? catalog?.chart ?? [accent, secondary, mixHex(accent, fg, 0.2), mixHex(accent, bg, 0.35)],
    fonts,
    radius: source.radius ?? catalog?.radius ?? 12,
    shadow: source.shadow ?? catalog?.shadow ?? 'none',
    border: source.border ?? catalog?.border ?? 0,
    borderColor: source.borderColor ?? catalog?.borderColor ?? mixHex(fg, bg, 0.35),
  }
}

/** Theme theo id; id lạ rơi về theme đầu tiên thay vì làm hỏng deck. */
export function themeById(id: string): ResolvedTheme {
  const mapped = resolveThemeId(id)
  return normalizeTheme(DECK_THEMES.find((t) => t.id === mapped) ?? DECK_THEMES[0])
}
