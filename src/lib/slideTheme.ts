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
const LEGACY_DECK_THEMES: DeckTheme[] = [
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
  {
    id: 'vang-nang',
    name: 'Vàng nắng',
    vibe: 'vui tươi, năng động, phong cách hoạt hình truyện tranh',
    bg: '#fffbeb',
    fg: '#1e1b4b',
    surface: '#fef08a',
    muted: '#71717a',
    accent: '#7c3aed',
    secondary: '#f97316',
    chart: ['#7c3aed', '#f97316', '#06b6d4', '#e11d48', '#10b981'],
    radius: 14,
    shadow: 'soft',
    border: 0,
    borderColor: '#e2e8f0',
    fontHeading: 'Verdana',
    fontBody: 'Verdana',
    fonts: { heading: 'Verdana', body: 'Verdana', serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['tiểu học', 'trẻ em', 'hoạt hình', 'vui tươi'],
  },
  {
    id: 'bang-den',
    name: 'Bảng đen',
    vibe: 'lớp học, sư phạm, phấn trắng trên nền bảng xanh rêu tối',
    bg: '#14231a',
    fg: '#f8fafc',
    surface: '#1b3024',
    muted: '#94a3b8',
    accent: '#fef08a',
    secondary: '#86efac',
    chart: ['#fef08a', '#86efac', '#38bdf8', '#f472b6', '#cbd5e1'],
    radius: 4,
    shadow: 'none',
    border: 0,
    borderColor: '#92400e',
    fontHeading: 'Tahoma',
    fontBody: 'Tahoma',
    fonts: { heading: 'Tahoma', body: 'Tahoma', serif: SERIF, mono: MONO },
    decor: 'none',
    dark: true,
    tags: ['lớp học', 'toán', 'bài giảng', 'bảng đen'],
  },
  {
    id: 'pastel-mam-non',
    name: 'Pastel mầm non',
    vibe: 'dịu dàng, hồng phấn và xanh bạc hà, bo tròn lớn cho tiểu học',
    bg: '#fff5f8',
    fg: '#3b1530',
    surface: '#e9faf3',
    muted: '#724060',
    accent: '#db2777',
    secondary: '#0d9488',
    chart: ['#db2777', '#0d9488', '#f59e0b', '#8b5cf6', '#06b6d4'],
    radius: 28,
    shadow: 'soft',
    border: 1,
    borderColor: '#fbcfe8',
    fontHeading: 'Nunito',
    fontBody: 'Nunito',
    fonts: { heading: 'Nunito', body: 'Nunito', serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['tiểu học', 'mầm non', 'pastel', 'vui tươi'],
  },
  {
    id: 'bien-xanh',
    name: 'Biển xanh',
    vibe: 'xanh ngọc đại dương kết hợp sắc cát ấm, dịu mắt',
    bg: '#f0fafa',
    fg: '#0b2c3c',
    surface: '#fdf6e7',
    muted: '#2e5c6e',
    accent: '#0e7490',
    secondary: '#b45309',
    chart: ['#0e7490', '#b45309', '#0284c7', '#059669', '#6366f1'],
    radius: 16,
    shadow: 'soft',
    border: 1,
    borderColor: '#a5f3fc',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'none',
    dark: false,
    tags: ['địa lý', 'sinh học biển', 'thiên nhiên'],
  },
  {
    id: 'so-tay-o-li',
    name: 'Sổ tay ô li',
    vibe: 'giấy vở kem nhẹ, mực xanh bút bi và nét chữ viết tay thân thuộc',
    bg: '#fcfaf0',
    fg: '#1e293b',
    surface: '#eef4fc',
    muted: '#475569',
    accent: '#1d4ed8',
    secondary: '#dc2626',
    chart: ['#1d4ed8', '#dc2626', '#059669', '#d97706', '#7c3aed'],
    radius: 4,
    shadow: 'none',
    border: 1,
    borderColor: '#cbd5e1',
    fontHeading: 'Patrick Hand',
    fontBody: SANS,
    fonts: { heading: "'Patrick Hand', 'Nunito', sans-serif", body: SANS, serif: SERIF, mono: MONO },
    decor: 'grain',
    dark: false,
    tags: ['ôn tập', 'ghi chép', 'sổ tay', 'lớp học'],
  },
  {
    id: 'cam-nang-dong',
    name: 'Cam năng động',
    vibe: 'thể thao, nhiệt huyết với cam cháy và xanh navy sắc nét',
    bg: '#fff9f3',
    fg: '#0f172a',
    surface: '#ffedd5',
    muted: '#475569',
    accent: '#c2410c',
    secondary: '#1e3a8a',
    chart: ['#c2410c', '#1e3a8a', '#0284c7', '#16a34a', '#9333ea'],
    radius: 6,
    shadow: 'hard',
    border: 2,
    borderColor: '#1e3a8a',
    fontHeading: 'Space Grotesk',
    fontBody: SANS,
    fonts: { heading: "'Space Grotesk', 'Be Vietnam Pro', sans-serif", body: SANS, serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['thể dục', 'kỹ năng sống', 'năng động', 'hoạt động'],
  },
  {
    id: 'lich-su-co',
    name: 'Lịch sử cổ',
    vibe: 'giấy cổ ngả vàng, nâu đỏ son và viền vàng đồng trang trọng',
    bg: '#faf3e6',
    fg: '#2c1610',
    surface: '#f1e2c8',
    muted: '#664433',
    accent: '#881337',
    secondary: '#a16207',
    chart: ['#881337', '#a16207', '#7c2d12', '#1e3a8a', '#3f6212'],
    radius: 2,
    shadow: 'none',
    border: 1.5,
    borderColor: '#b45309',
    fontHeading: 'Lora',
    fontBody: SANS,
    fonts: { heading: 'Lora', body: SANS, serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'grain',
    dark: false,
    tags: ['lịch sử', 'văn học trung đại', 'văn hoá'],
  },
  {
    id: 'phong-thi-nghiem',
    name: 'Phòng thí nghiệm',
    vibe: 'trắng sạch phòng lab, xanh lá chanh và tiêu đề chữ đơn cách chính xác',
    bg: '#f6fcf6',
    fg: '#0e281b',
    surface: '#ebf9d4',
    muted: '#3d5a48',
    accent: '#4d7c0f',
    secondary: '#0369a1',
    chart: ['#4d7c0f', '#0369a1', '#0d9488', '#d97706', '#7c3aed'],
    radius: 4,
    shadow: 'none',
    border: 1,
    borderColor: '#a3e635',
    fontHeading: 'JetBrains Mono Variable',
    fontBody: SANS,
    fonts: { heading: MONO, body: SANS, serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['hoá', 'sinh', 'thí nghiệm', 'khoa học'],
  },
  {
    id: 'bac-au-toi-gian',
    name: 'Tối giản Bắc Âu',
    vibe: 'xám ấm thanh bình và một điểm nhấn đất nung rất tiết chế',
    bg: '#f4f2ed',
    fg: '#1c1917',
    surface: '#e8e4dc',
    muted: '#57534e',
    accent: '#b93815',
    secondary: '#4d7c5b',
    chart: ['#b93815', '#4d7c5b', '#57534e', '#a16207', '#334155'],
    radius: 8,
    shadow: 'none',
    border: 0,
    borderColor: '#d6d3cd',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'none',
    dark: false,
    tags: ['mọi môn', 'họp phụ huynh', 'báo cáo', 'tối giản'],
  },
  {
    id: 'hoa-si-mau-nuoc',
    name: 'Hoạ sĩ màu nước',
    vibe: 'giấy vẽ mềm, sắc hoa hồng tím dịu và phông có chân uyển chuyển',
    bg: '#fdf7f9',
    fg: '#2e1f33',
    surface: '#f7e7f0',
    muted: '#6a4966',
    accent: '#be185d',
    secondary: '#6d28d9',
    chart: ['#be185d', '#6d28d9', '#0e7490', '#d97706', '#059669'],
    radius: 20,
    shadow: 'soft',
    border: 1,
    borderColor: '#f5d0fe',
    fontHeading: 'Lora',
    fontBody: 'Lora',
    fonts: { heading: 'Lora', body: 'Lora', serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'glow',
    dark: false,
    tags: ['mĩ thuật', 'văn', 'nghệ thuật', 'âm nhạc'],
  },
  {
    id: 'vu-tru',
    name: 'Vũ trụ',
    vibe: 'nền tối tím than sâu thẳm, xanh neon nhẹ và chấm sao thiên hà',
    bg: '#0d0b26',
    fg: '#f8fafc',
    surface: '#191642',
    muted: '#a5b4fc',
    accent: '#22d3ee',
    secondary: '#c084fc',
    chart: ['#22d3ee', '#c084fc', '#4ade80', '#f472b6', '#facc15'],
    radius: 12,
    shadow: 'none',
    border: 1,
    borderColor: '#22d3ee',
    fontHeading: 'Space Grotesk',
    fontBody: SANS,
    fonts: { heading: "'Space Grotesk', 'Be Vietnam Pro', sans-serif", body: SANS, serif: SERIF, mono: MONO },
    decor: 'glow',
    dark: true,
    tags: ['vật lý', 'thiên văn', 'tin học', 'nền tối'],
  },
  {
    id: 'rung-dem',
    name: 'Rừng đêm',
    vibe: 'xanh rêu đêm sâu lắng, ánh vàng mật ong ấm và đom đóm rừng',
    bg: '#0b1d17',
    fg: '#f5f1e6',
    surface: '#142f26',
    muted: '#9ec2b0',
    accent: '#f59e0b',
    secondary: '#4ade80',
    chart: ['#f59e0b', '#4ade80', '#38bdf8', '#fb7185', '#e2e8f0'],
    radius: 16,
    shadow: 'none',
    border: 1.2,
    borderColor: '#b45309',
    fontHeading: 'Lora',
    fontBody: SANS,
    fonts: { heading: 'Lora', body: SANS, serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'glow',
    dark: true,
    tags: ['sinh học', 'kể chuyện', 'thiên nhiên', 'nền tối'],
  },
  {
    id: 'bac-ha',
    name: 'Bạc hà',
    vibe: 'tươi mát, xanh bạc hà ngọc thanh khiết và trắng ánh lục dịu mắt cho sinh học',
    bg: '#f2fbf7',
    fg: '#0d281e',
    surface: '#e1f6ec',
    muted: '#2d5744',
    accent: '#047857',
    secondary: '#0d9488',
    chart: ['#047857', '#0d9488', '#10b981', '#0284c7', '#d97706'],
    radius: 14,
    shadow: 'soft',
    border: 1,
    borderColor: '#a7f3d0',
    fontHeading: 'Nunito',
    fontBody: SANS,
    fonts: { heading: 'Nunito', body: SANS, serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['sinh học', 'khtn', 'tươi mát', 'bạc hà', 'môi trường'],
  },
  {
    id: 'hong-dao',
    name: 'Hồng đào',
    vibe: 'kem đào ấm áp, san hô đậm đằm thắm và tinh tế cho văn học và kỹ năng sống',
    bg: '#fdf6f0',
    fg: '#2b1b17',
    surface: '#ffe8dc',
    muted: '#6e4a42',
    accent: '#b91c1c',
    secondary: '#ea580c',
    chart: ['#b91c1c', '#ea580c', '#f59e0b', '#7c3aed', '#059669'],
    radius: 18,
    shadow: 'soft',
    border: 1,
    borderColor: '#fed7aa',
    fontHeading: 'Lora',
    fontBody: SANS,
    fonts: { heading: 'Lora', body: SANS, serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['ngữ văn', 'kỹ năng sống', 'ấm áp', 'hồng đào', 'thanh lịch'],
  },
  {
    id: 'oai-huong',
    name: 'Oải hương',
    vibe: 'tím lavender nhạt mơ màng, tím than đài các cho âm nhạc và mĩ thuật',
    bg: '#f8f5fd',
    fg: '#231634',
    surface: '#ede5fc',
    muted: '#5c4a73',
    accent: '#6d28d9',
    secondary: '#9333ea',
    chart: ['#6d28d9', '#9333ea', '#ec4899', '#0284c7', '#059669'],
    radius: 16,
    shadow: 'soft',
    border: 1,
    borderColor: '#ddd6fe',
    fontHeading: 'Lora',
    fontBody: SANS,
    fonts: { heading: 'Lora', body: SANS, serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['âm nhạc', 'mĩ thuật', 'nghệ thuật', 'oải hương', 'mộng mơ'],
  },
  {
    id: 'cat-vang',
    name: 'Cát vàng',
    vibe: 'be cát ấm mộc mạc, nâu đất đằm sâu và xanh ô liu tự nhiên cho địa lí và du lịch',
    bg: '#f8f4ec',
    fg: '#261c14',
    surface: '#ede3d1',
    muted: '#635345',
    accent: '#854d0e',
    secondary: '#4d7c0f',
    chart: ['#854d0e', '#4d7c0f', '#c2410c', '#0369a1', '#7c3aed'],
    radius: 8,
    shadow: 'none',
    border: 1,
    borderColor: '#d6c7b2',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'grain',
    dark: false,
    tags: ['địa lí', 'du lịch', 'văn hoá', 'cát vàng', 'sa mạc'],
  },
  {
    id: 'chanh-tuoi',
    name: 'Chanh tươi',
    vibe: 'trắng tinh khôi, vàng chanh rực rỡ và xanh lá tươi mát cho tiểu học và trò chơi',
    bg: '#fcfee8',
    fg: '#1a2e05',
    surface: '#f4fcc4',
    muted: '#4d6328',
    accent: '#15803d',
    secondary: '#ca8a04',
    chart: ['#15803d', '#ca8a04', '#0284c7', '#ea580c', '#7c3aed'],
    radius: 20,
    shadow: 'soft',
    border: 1.5,
    borderColor: '#bef264',
    fontHeading: 'Nunito',
    fontBody: 'Nunito',
    fonts: { heading: 'Nunito', body: 'Nunito', serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['tiểu học', 'trò chơi', 'toán', 'chanh tươi', 'sôi nổi'],
  },
  {
    id: 'bau-troi',
    name: 'Bầu trời',
    vibe: 'xanh da trời dịu mát, xanh dương đậm thanh khiết và motif mây bồng bềnh cho KHTN, Vật lí',
    bg: '#f1f7fd',
    fg: '#0c2340',
    surface: '#dbeafe',
    muted: '#2d527c',
    accent: '#0369a1',
    secondary: '#0284c7',
    chart: ['#0369a1', '#0284c7', '#0d9488', '#f59e0b', '#8b5cf6'],
    radius: 16,
    shadow: 'soft',
    border: 1,
    borderColor: '#bae6fd',
    fontHeading: SANS,
    fontBody: SANS,
    fonts: FONTS_SANS,
    decor: 'none',
    dark: false,
    tags: ['khtn', 'vật lí', 'thiên nhiên', 'bầu trời', 'khoa học'],
  },
  {
    id: 'bao-tuong',
    name: 'Báo tường',
    vibe: 'phong cách tạp chí tin tức, đen trắng tương phản cao, điểm nhấn đỏ son và chữ có chân trang trọng',
    bg: '#f9f9f8',
    fg: '#111827',
    surface: '#ebeae7',
    muted: '#4b5563',
    accent: '#b91c1c',
    secondary: '#1e293b',
    chart: ['#b91c1c', '#1e293b', '#475569', '#d97706', '#0284c7'],
    radius: 0,
    shadow: 'none',
    border: 2,
    borderColor: '#111827',
    fontHeading: 'Lora',
    fontBody: SANS,
    fonts: { heading: 'Lora', body: SANS, serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['lịch sử', 'gdcd', 'tin tức', 'báo chí', 'tạp chí', 'báo tường'],
  },
  {
    id: 'hinh-hoc-mau',
    name: 'Hình học màu',
    vibe: 'trường phái Bauhaus hiện đại, các khối cơ bản xanh cobalt, vàng ochre, đỏ thắm trên nền trắng sáng',
    bg: '#fafbfc',
    fg: '#090d16',
    surface: '#e8eef8',
    muted: '#3e4c5e',
    accent: '#1d4ed8',
    secondary: '#dc2626',
    chart: ['#1d4ed8', '#dc2626', '#b45309', '#059669', '#7c3aed'],
    radius: 4,
    shadow: 'hard',
    border: 2,
    borderColor: '#090d16',
    fontHeading: 'Space Grotesk',
    fontBody: SANS,
    fonts: { heading: "'Space Grotesk', 'Be Vietnam Pro', sans-serif", body: SANS, serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['toán hình', 'mĩ thuật', 'bauhaus', 'hình học', 'kiến trúc'],
  },
  {
    id: 'bang-trang',
    name: 'Bảng trắng',
    vibe: 'bảng trắng lớp học hiện đại, nét bút dạ xanh dương và đỏ ghi chú trực quan sinh động',
    bg: '#f5f7fa',
    fg: '#18202f',
    surface: '#e4e9f2',
    muted: '#475569',
    accent: '#0369a1',
    secondary: '#e11d48',
    chart: ['#0369a1', '#e11d48', '#16a34a', '#d97706', '#9333ea'],
    radius: 10,
    shadow: 'soft',
    border: 1.5,
    borderColor: '#cbd5e1',
    fontHeading: 'Nunito',
    fontBody: SANS,
    fonts: { heading: 'Nunito', body: SANS, serif: SERIF, mono: MONO },
    decor: 'none',
    dark: false,
    tags: ['lớp học', 'bài giảng', 'bảng trắng', 'hằng ngày', 'ghi chép'],
  },
  {
    id: 'tet-xuan',
    name: 'Tết xuân',
    vibe: 'không khí lễ hội tết truyền thống, nền kem ấm, đỏ son may mắn và vàng kim rạng rỡ',
    bg: '#fff7ed',
    fg: '#31100b',
    surface: '#fceddc',
    muted: '#6e453b',
    accent: '#991b1b',
    secondary: '#b45309',
    chart: ['#991b1b', '#b45309', '#15803d', '#d97706', '#6d28d9'],
    radius: 12,
    shadow: 'soft',
    border: 1.5,
    borderColor: '#fed7aa',
    fontHeading: 'Lora',
    fontBody: SANS,
    fonts: { heading: 'Lora', body: SANS, serif: 'Lora, Georgia, serif', mono: MONO },
    decor: 'glow',
    dark: false,
    tags: ['tết', 'mùa xuân', 'lễ hội', 'sự kiện', 'truyền thống'],
  },
]

/** Id theme đã gộp ở chặng P1 → theme thay thế (deck cũ và dàn ý AI cũ vẫn chạy). */
const LEGACY_THEME_IDS: Record<string, string> = {
  'khoa-hoc': 'sang',
  'van-su-dia': 'giay-am',
  'sinh-hoc': 'rung',
  'ngoai-ngu-tin': 'tim',
}

const THEME_FONT_PAIRS: Record<string, readonly [string, string]> = {
  'dem-xanh': ['Saira Condensed', 'Inter'],
  'rung': ['Lexend', 'Be Vietnam Pro'],
  'tim': ['Montserrat', 'Nunito'],
  'do': ['Oswald', 'Inter'],
  'vang-nang': ['Barlow Condensed', 'Lexend'],
  'bien-xanh': ['Roboto Condensed', 'Inter'],
  'cam-nang-dong': ['Barlow Condensed', 'Be Vietnam Pro'],
  'lich-su-co': ['Merriweather', 'Be Vietnam Pro'],
  'phong-thi-nghiem': ['JetBrains Mono', 'Inter'],
  'bac-au-toi-gian': ['Montserrat', 'Inter'],
  'vu-tru': ['Saira Condensed', 'Space Grotesk'],
  'rung-dem': ['Source Serif 4', 'Inter'],
  'bac-ha': ['Lexend', 'Nunito'],
  'hong-dao': ['Playfair Display', 'Inter'],
  'oai-huong': ['Playfair Display', 'Lora'],
  'cat-vang': ['Merriweather', 'Roboto Condensed'],
  'chanh-tuoi': ['Caveat', 'Lexend'],
  'bau-troi': ['Roboto Condensed', 'Be Vietnam Pro'],
  'bao-tuong': ['Oswald', 'Source Serif 4'],
}

export function withThemeFonts(theme: DeckTheme, [heading, body]: readonly [string, string]): DeckTheme {
  return { ...theme, fontHeading: heading, fontBody: body, fonts: { serif: SERIF, mono: MONO, ...theme.fonts, heading, body } }
}

export const DECK_THEMES = LEGACY_DECK_THEMES.map(theme => {
  const pair = THEME_FONT_PAIRS[theme.id ?? '']
  return pair ? withThemeFonts(theme, pair) : theme
})

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
  // Deck đã lưu có thể chỉ mang id/màu, nên giá trị suy ra phải đến từ bộ phông cũ.
  const catalog = LEGACY_DECK_THEMES.find(
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
