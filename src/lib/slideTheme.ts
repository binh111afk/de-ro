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

/** 10 theme: 6 theme cũ (đổi tên/font cho đúng font đang nạp) + 4 theme theo môn. */
export const DECK_THEMES: DeckTheme[] = [
  {
    id: 'sang',
    radius: 14,
    shadow: 'soft',
    name: 'Sáng',
    vibe: 'tin cậy, học thuật, an toàn cho mọi chủ đề',
    bg: '#ffffff',
    fg: '#111827',
    accent: '#2563eb',
    surface: '#f3f6fb',
    muted: '#6b7280',
    secondary: '#0f766e',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#2563eb', '#0f766e', '#c05a3c', '#b8862f', '#9333ea'],
    decor: 'none',
    dark: false,
    tags: ['cơ bản'],
  },
  {
    id: 'dem-xanh',
    radius: 14,
    shadow: 'none',
    name: 'Đêm xanh',
    vibe: 'công nghệ, hiện đại, trình chiếu trong phòng tối',
    bg: '#0f172a',
    fg: '#f8fafc',
    accent: '#38bdf8',
    surface: '#1e293b',
    muted: '#94a3b8',
    secondary: '#a78bfa',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#38bdf8', '#a78bfa', '#f472b6', '#facc15', '#4ade80'],
    decor: 'none',
    dark: true,
    tags: ['cơ bản'],
  },
  {
    id: 'giay-am',
    radius: 24,
    shadow: 'soft',
    decor: 'grain',
    name: 'Giấy ấm',
    vibe: 'ấm, truyền thống, văn chương, hoài niệm',
    bg: '#fdf6ec',
    fg: '#3f2d1c',
    accent: '#c05a3c',
    surface: '#f4e7d5',
    muted: '#8a6f57',
    secondary: '#7c6a3f',
    fontHeading: SERIF,
    fontBody: SANS,
    fonts: { heading: SERIF, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#c05a3c', '#7c6a3f', '#0f766e', '#b8862f', '#6b4f7a'],
    dark: false,
    tags: ['cơ bản'],
  },
  {
    id: 'rung',
    radius: 18,
    shadow: 'soft',
    decor: 'dots',
    name: 'Rừng',
    vibe: 'tươi, tự nhiên, sinh thái',
    bg: '#f0fdf4',
    fg: '#14532d',
    accent: '#16a34a',
    surface: '#dcfce7',
    muted: '#4d7c5f',
    secondary: '#0e7490',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#16a34a', '#0e7490', '#b8862f', '#7c6a3f', '#4d7c5f'],
    dark: false,
    tags: ['cơ bản'],
  },
  {
    id: 'do',
    radius: 0,
    shadow: 'hard',
    border: 2,
    borderColor: '#111827',
    name: 'Đỏ',
    vibe: 'mạnh, cảnh báo, năng lượng cao',
    bg: '#fef2f2',
    fg: '#7f1d1d',
    accent: '#dc2626',
    surface: '#fee2e2',
    muted: '#9a5b5b',
    secondary: '#b45309',
    fontHeading: SERIF,
    fontBody: SANS,
    fonts: { heading: SERIF, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#dc2626', '#b45309', '#7f1d1d', '#9a5b5b', '#0f766e'],
    decor: 'none',
    dark: false,
    tags: ['cơ bản'],
  },
  {
    id: 'tim',
    radius: 24,
    shadow: 'soft',
    decor: 'glow',
    name: 'Tím',
    vibe: 'sáng tạo, trẻ trung, nghệ thuật',
    bg: '#faf5ff',
    fg: '#4c1d95',
    accent: '#9333ea',
    surface: '#f3e8ff',
    muted: '#7e6a9e',
    secondary: '#db2777',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#9333ea', '#db2777', '#2563eb', '#0f766e', '#b45309'],
    dark: false,
    tags: ['cơ bản'],
  },
  {
    id: 'khoa-hoc',
    radius: 12,
    shadow: 'soft',
    name: 'Khoa học',
    vibe: 'chính xác, logic, kỹ thuật',
    bg: '#f4f8ff',
    fg: '#12233f',
    accent: '#1d4ed8',
    surface: '#e5edfb',
    muted: '#5b6b85',
    secondary: '#0f766e',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#1d4ed8', '#0f766e', '#b45309', '#9333ea', '#0e7490'],
    decor: 'grid',
    dark: false,
    tags: ['toán', 'lý', 'hoá', 'khoa học', 'tự nhiên'],
  },
  {
    id: 'van-su-dia',
    radius: 20,
    shadow: 'soft',
    name: 'Văn Sử Địa',
    vibe: 'cổ điển, lịch sử, trang trọng',
    bg: '#fbf7f0',
    fg: '#3a2a1f',
    accent: '#a24a2b',
    surface: '#f3e9db',
    muted: '#7d6a58',
    secondary: '#7c6a3f',
    fontHeading: SERIF,
    fontBody: SANS,
    fonts: { heading: SERIF, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#a24a2b', '#7c6a3f', '#8a5a44', '#b8862f', '#5d6b4a'],
    decor: 'waves',
    dark: false,
    tags: ['văn', 'sử', 'địa', 'xã hội'],
  },
  {
    id: 'sinh-hoc',
    radius: 24,
    shadow: 'soft',
    decor: 'grain',
    name: 'Sinh học',
    vibe: 'dịu, hữu cơ, tự nhiên',
    bg: '#f2fbf4',
    fg: '#14351f',
    accent: '#15803d',
    surface: '#e0f4e6',
    muted: '#547a60',
    secondary: '#0e7490',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#15803d', '#0e7490', '#b8862f', '#0f766e', '#4d7c5f'],
    dark: false,
    tags: ['sinh', 'sinh học', 'tự nhiên'],
  },
  {
    id: 'ngoai-ngu-tin',
    radius: 16,
    shadow: 'soft',
    name: 'Ngoại ngữ & Tin',
    vibe: 'năng động, đa văn hoá, công nghệ trẻ',
    bg: '#f7f5ff',
    fg: '#241a4a',
    accent: '#6d28d9',
    surface: '#ece7fb',
    muted: '#6b6383',
    secondary: '#c026d3',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: { heading: SANS, body: SANS, serif: SERIF, mono: MONO },
    chart: ['#6d28d9', '#c026d3', '#2563eb', '#0f766e', '#b45309'],
    decor: 'confetti',
    dark: false,
    tags: ['tiếng anh', 'tin học', 'ngoại ngữ'],
  },
]

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
  const catalog = DECK_THEMES.find(
    (t) => (source.id && t.id === source.id) || (t.bg && source.bg && t.bg.toLowerCase() === source.bg.toLowerCase()),
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
  return normalizeTheme(DECK_THEMES.find((t) => t.id === id) ?? DECK_THEMES[0])
}
