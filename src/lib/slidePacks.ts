/**
 * Bộ phong cách của chế độ Chuyên nghiệp: nền / khung / hình trang trí vẽ sẵn
 * (public/slide-packs) đặt quanh chữ. Mỗi bộ dựng riêng các bố cục biên tập,
 * giữ nguyên id phần tử (title, kicker, body, item-N-…) để sửa, AI sửa và dựng
 * lại bố cục vẫn đọc được nội dung. Toạ độ viết theo px trên slide 1280×720.
 */
import type { SlideElement } from '@/store/docs'
import type { SlideLayoutContent } from './slideLayouts'

export type SlidePackId = 'co-dien' | 'dan-gian' | 'khoa-hoc' | 'toan' | 'vat-ly' | 'hoa-hoc' | 'tin-hoc' | 'tam-ly' | 'sinh-hoc'

export const PACK_COLORS = {
  'co-dien': { background: '#8b0000', fg: '#8b0000', ink: '#8b0000', accent: '#8b0000', muted: '#7a3b2e', surface: '#fdeed3', panel: '#f7e2bd', onAccent: '#fdeed3' },
  'dan-gian': { background: '#faf3e6', fg: '#4a2c1d', ink: '#962a0e', accent: '#b4461a', muted: '#7a5a45', surface: '#fff7e8', panel: '#ffe9b8', onAccent: '#ffffff' },
  'khoa-hoc': { background: '#f7f5ee', fg: '#2c4256', ink: '#173f5f', accent: '#0f7c8c', muted: '#53687a', surface: '#ffffff', panel: '#e2f0ec', onAccent: '#ffffff' },
  toan: { background: '#fbfcff', fg: '#34446b', ink: '#1d3f8f', accent: '#2f6fd6', muted: '#56658a', surface: '#ffffff', panel: '#eef4ff', onAccent: '#ffffff' },
  'vat-ly': { background: '#fbfaf6', fg: '#3d4a68', ink: '#2f3c6e', accent: '#3d6399', muted: '#5f6a85', surface: '#ffffff', panel: '#e4eef8', onAccent: '#ffffff' },
  'sinh-hoc': { background: '#fafaf4', fg: '#3f4a36', ink: '#34603a', accent: '#a5503f', muted: '#66705c', surface: '#ffffff', panel: '#e6f1dd', onAccent: '#ffffff' },
  'hoa-hoc': { background: '#faf9f6', fg: '#5a3a44', ink: '#7a4455', accent: '#4a7573', muted: '#77606a', surface: '#ffffff', panel: '#eaf1ef', onAccent: '#ffffff' },
  'tin-hoc': { background: '#f8f7fc', fg: '#3a3560', ink: '#241d4d', accent: '#5a3ee0', muted: '#635d85', surface: '#ffffff', panel: '#ece8fd', onAccent: '#ffffff' },
  'tam-ly': { background: '#fbf4ec', fg: '#53392f', ink: '#5a2c1c', accent: '#a8532f', muted: '#7d6257', surface: '#fffaf5', panel: '#f8e4da', onAccent: '#ffffff' },
} as const

const CREAM = '#fdeed3'

/** kích thước gốc của hình trang trí (để giữ đúng tỉ lệ khi chỉ định bề rộng) */
const ART: Record<string, [number, number]> = {
  'co-dien/canh-mai': [800, 394], 'co-dien/canh-tung': [800, 281], 'co-dien/chim-en': [800, 609], 'co-dien/chim-hac': [473, 800],
  'co-dien/goc-hoa-van': [800, 659], 'co-dien/hoa-sen': [663, 800], 'co-dien/mat-troi': [785, 800], 'co-dien/may': [800, 152], 'co-dien/nui': [800, 236],
  'dan-gian/canh-tre': [800, 529], 'dan-gian/chuon-chuon': [800, 527], 'dan-gian/den-long': [653, 800], 'dan-gian/dieu': [800, 503],
  'dan-gian/hoa-sen': [800, 673], 'dan-gian/mai-dinh': [800, 382], 'dan-gian/may': [800, 136], 'dan-gian/non-la': [800, 672], 'dan-gian/sach': [800, 658],
  'khoa-hoc/binh-tam-giac': [358, 540], 'khoa-hoc/bong-den': [480, 540], 'khoa-hoc/dna': [221, 540], 'khoa-hoc/hanh-tinh': [540, 315],
  'khoa-hoc/kinh-hien-vi': [299, 540], 'khoa-hoc/la-cay': [379, 540], 'khoa-hoc/nam-cham': [402, 540], 'khoa-hoc/nguyen-tu': [540, 529],
  'khoa-hoc/ong-nghiem': [540, 450], 'khoa-hoc/te-bao': [484, 540],
  'toan/ban-tinh': [503, 540], 'toan/but-chi': [477, 540], 'toan/compa': [395, 540], 'toan/dau-phep-tinh': [540, 524], 'toan/e-ke': [533, 540],
  'toan/hinh-tru-lang-tru': [540, 310], 'toan/khoi-hinh': [540, 205], 'toan/may-tinh': [423, 540], 'toan/thuoc-do-goc': [540, 323], 'toan/thuoc-ke': [539, 540],
  // dot 2
  'vat-ly/con-lac': [488, 540], 'vat-ly/cum-sao': [502, 540], 'vat-ly/dai-song': [540, 110], 'vat-ly/hanh-tinh': [540, 363], 'vat-ly/kinh-thien-van': [489, 540],
  'vat-ly/lang-kinh': [540, 196], 'vat-ly/lo-xo': [331, 540], 'vat-ly/mach-dien': [540, 469], 'vat-ly/nam-cham': [540, 455], 'vat-ly/nguyen-tu': [509, 540],
  'vat-ly/ten-lua': [489, 540],
  'hoa-hoc/binh-cau': [358, 540], 'hoa-hoc/binh-tam-giac': [416, 540], 'hoa-hoc/coc-dong': [506, 540], 'hoa-hoc/cum-vi-khuan': [522, 540], 'hoa-hoc/dai-te-bao': [540, 229],
  'hoa-hoc/dna': [252, 540], 'hoa-hoc/gia-ong-nghiem': [540, 387], 'hoa-hoc/kinh-hien-vi': [324, 540], 'hoa-hoc/nguyen-tu': [540, 430], 'hoa-hoc/ong-nghiem-doi': [494, 540],
  'hoa-hoc/phan-tu': [540, 471],
  'tin-hoc/banh-rang': [540, 493], 'tin-hoc/chuot-ban-phim': [540, 347], 'tin-hoc/dam-may': [540, 434], 'tin-hoc/dien-thoai': [319, 540], 'tin-hoc/khien-bao-mat': [463, 540],
  'tin-hoc/mang-luoi': [514, 540], 'tin-hoc/may-chu': [352, 540], 'tin-hoc/may-tinh-xach-tay': [540, 540], 'tin-hoc/robot': [373, 540], 'tin-hoc/vi-mach': [540, 496],
  'tam-ly/bong-thoai': [540, 402], 'tam-ly/guong': [310, 540], 'tam-ly/mam-cay': [346, 540], 'tam-ly/manh-ghep': [540, 315], 'tam-ly/may-mat-troi': [540, 358],
  'tam-ly/nao-cay': [419, 540], 'tam-ly/so-tay': [540, 402], 'tam-ly/thien': [484, 540], 'tam-ly/trai-tim': [470, 540], 'tam-ly/tro-chuyen': [540, 435],
  'sinh-hoc/buom': [540, 412], 'sinh-hoc/cum-vi-khuan': [536, 540], 'sinh-hoc/dai-te-bao': [540, 409], 'sinh-hoc/dna': [250, 540], 'sinh-hoc/kinh-hien-vi': [338, 540],
  'sinh-hoc/la-cay': [468, 540], 'sinh-hoc/mam-cay': [264, 540], 'sinh-hoc/no-ron': [528, 540], 'sinh-hoc/te-bao-dong-vat': [540, 536], 'sinh-hoc/te-bao-thuc-vat': [540, 532],
  'sinh-hoc/trai-tim': [357, 540],
  // het dot 2
}

type Box = Pick<SlideElement, 'x' | 'y' | 'w' | 'h'>
type Text = (id: string, value: string | undefined, box: Box, style: Partial<SlideElement>, minScale?: number) => SlideElement | null

const box = (x: number, y: number, w: number, h: number): Box => ({ x: x / 12.8, y: y / 7.2, w: w / 12.8, h: h / 7.2 })
/** cỡ chữ px (slide 1280) → cqw */
const fs = (px: number) => px / 12.8

const image = (id: string, src: string | undefined, b: Box, extra: Partial<SlideElement> = {}): SlideElement => ({
  id, type: 'image', src, ...b, radius: 0, border: 0, shadowLevel: 0, ...extra,
})

/** hình trang trí, cao theo tỉ lệ gốc */
function art(n: number, name: string, x: number, y: number, w: number, extra: Partial<SlideElement> = {}): SlideElement {
  const [aw, ah] = ART[name]
  return image(`decor-kit-${n}`, `/slide-packs/${name}.png`, box(x, y, w, (w * ah) / aw), { decor: true, ...extra })
}

const full = (name: string): SlideElement =>
  image('decor-kit-0', `/slide-packs/${name}.png`, box(0, 0, 1280, 720), { decor: true, locked: true })

const list = (value?: string[]) => (value ?? []).map((v) => String(v ?? '').trim()).filter(Boolean)
const upper = (text?: string) => text?.trim().toLocaleUpperCase('vi') || undefined

const rowsOf = (c: SlideLayoutContent) => (c.stats ?? [])
  .map((s) => ({ value: String(s.value ?? '').trim(), label: String(s.label ?? '').trim() }))
  .filter((s) => s.value || s.label)
  .slice(0, 5)

const paragraphs = (c: SlideLayoutContent) => {
  const bullets = list(c.bullets)
  return (bullets.length ? bullets : list(c.body?.split('\n'))).join('\n\n')
}

const statement = (c: SlideLayoutContent) =>
  c.body?.trim() || c.quote?.trim() || list(c.bullets).join(' ') || c.title?.trim() || ''

interface Kit {
  text: Text
  title: (id: string, value: string | undefined, b: Box, px: number, color: string, extra?: Partial<SlideElement>) => SlideElement | null
  body: (id: string, value: string | undefined, b: Box, px: number, color: string, extra?: Partial<SlideElement>) => SlideElement | null
}

function kitOf(text: Text): Kit {
  return {
    text,
    title: (id, value, b, px, color, extra) =>
      text(id, value, b, { variant: 'title', fontWeight: 800, lineHeight: 1.15, valign: 'top', fontSize: fs(px), textColor: color, ...extra }, 0.4),
    body: (id, value, b, px, color, extra) =>
      text(id, value, b, { variant: 'body', lineHeight: 1.45, valign: 'top', fontSize: fs(px), textColor: color, ...extra }, 0.55),
  }
}

type Built = Array<SlideElement | null>

/* ------------------------------------------------------------------ *
 * Cổ điển đỏ kem: khung tem thư
 * ------------------------------------------------------------------ */
function coDien(id: string, c: SlideLayoutContent, { title, body }: Kit): Built | null {
  const red = PACK_COLORS['co-dien'].ink
  switch (id) {
    case 'photo-full':
      if (c.image) return [
        full('co-dien/tem-day'),
        image('image-1', c.image, box(660, 110, 510, 500), { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, border: 6, borderColor: red }),
        art(1, 'co-dien/chim-en', 540, 50, 170),
        body('kicker', upper(c.kicker), box(100, 91, 520, 58), 24, red, { fontWeight: 700 }),
        title('title', c.title, box(100, 160, 520, 280), 68, red, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(100, 470, 520, 140), 26, red),
      ]
      return [
        full('co-dien/tem-bia'),
        art(1, 'co-dien/mat-troi', 830, 50, 300),
        art(2, 'co-dien/nui', 380, 470, 700, { opacity: 0.9 }),
        art(3, 'co-dien/may', 730, 260, 260),
        art(4, 'co-dien/chim-hac', 850, 80, 378),
        body('kicker', upper(c.kicker), box(100, 87, 600, 58), 24, red, { fontWeight: 700 }),
        title('title', c.title, box(96, 150, 640, 290), 96, red, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(100, 468, 520, 140), 28, red),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        full('co-dien/tem-tren'),
        art(1, 'co-dien/chim-en', 1130, 6, 130),
        art(2, 'co-dien/may', 60, 282, 260),
        body('kicker', upper(c.kicker), box(140, 31, 1000, 54), 22, red, { fontWeight: 700, align: 'center' }),
        title('body', text, box(160, 84, 960, 230), text.length > 150 ? 42 : text.length > 80 ? 52 : 68, red, { align: 'center', valign: 'middle' }),
        body('author', c.author, box(190, 420, 900, 120), 28, CREAM, { align: 'center' }),
      ]
    }
    case 'editorial-text':
      return [
        full('co-dien/tem-ben'),
        art(1, 'co-dien/canh-mai', 880, 500, 340),
        // nhãn dựng dọc bên trái: hộp ngang xoay 90° quanh tâm (125, 360)
        title('kicker', upper(c.kicker), box(-165, 315, 580, 90), 54, CREAM, { align: 'center', valign: 'middle', rotation: -90, letterSpacing: 0.02 }),
        title('title', c.title, box(310, 66, 870, 170), 52, red, { valign: 'middle' }),
        body('body', paragraphs(c), box(310, 262, 640, 390), 27, red),
      ]
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const h = Math.min(130, 390 / rows.length)
      return [
        full('co-dien/tem-day'),
        art(1, 'co-dien/canh-tung', 860, 36, 360),
        body('kicker', upper(c.kicker), box(96, 57, 700, 54), 22, red, { fontWeight: 700 }),
        title('title', c.title, box(96, 104, 780, 130), 52, red, { valign: 'middle' }),
        ...rows.flatMap((row, i) => {
          const y = 256 + i * h
          return [
            { id: `divider-${i + 1}`, type: 'shape', shape: 'rect', fill: red, opacity: 0.35, border: 0, shadowLevel: 0, ...box(100, y, 1080, 2) } as SlideElement,
            title(`item-${i + 1}-value`, row.value, box(96, y + 4, 240, h - 8), 38, red, { valign: 'middle' }),
            body(`item-${i + 1}-label`, row.label, box(360, y + 4, 820, h - 8), 26, red, { valign: 'middle', lineHeight: 1.3 }),
          ]
        }),
      ]
    }
    case 'bignum':
      return [
        full('co-dien/tem-day'),
        c.image
          ? image('image-1', c.image, box(730, 110, 440, 500), { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, border: 6, borderColor: red })
          : art(1, 'co-dien/hoa-sen', 830, 220, 340),
        art(2, 'co-dien/chim-en', c.image ? 620 : 990, 50, 150),
        body('kicker', upper(c.kicker), box(100, 81, 560, 58), 24, red, { fontWeight: 700 }),
        title('bignum-value', c.value, box(96, 140, 600, 270), 190, red, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(100, 430, 580, 100), 40, red),
        body('subtitle', c.subtitle, box(100, 545, 580, 80), 24, red),
      ]
    default:
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Dân gian: giấy kẻ ô, màu nước
 * ------------------------------------------------------------------ */
function danGian(id: string, c: SlideLayoutContent, { title, body }: Kit): Built | null {
  const { ink, fg } = PACK_COLORS['dan-gian']
  const paper = full('dan-gian/giay-o')
  const blob = (x: number, y: number, size: number): SlideElement =>
    ({ id: 'decor-kit-9', type: 'shape', shape: 'ellipse', fill: '#ffe2a8', border: 0, shadowLevel: 0, decor: true, ...box(x, y, size, size) })
  const photo = (b: Box, extra: Partial<SlideElement> = {}) =>
    image('image-1', c.image!, b, { imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop, ...extra })
  switch (id) {
    case 'photo-full':
      return [
        paper,
        ...(c.image
          ? [blob(640, 50, 640), photo(box(700, 110, 520, 520), { shape: 'ellipse' }), art(1, 'dan-gian/canh-tre', 990, -40, 330)]
          : [art(1, 'dan-gian/may', -80, -20, 700, { opacity: 0.85 }), art(2, 'dan-gian/mai-dinh', 590, 400, 700), art(3, 'dan-gian/canh-tre', 910, -40, 400)]),
        art(4, 'dan-gian/chuon-chuon', 530, 90, 150),
        body('kicker', upper(c.kicker), box(100, 161, 540, 62), 28, fg, { fontWeight: 800 }),
        title('title', c.title, box(96, 226, 600, 250), c.image ? 70 : 84, ink, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(100, 496, 480, 130), 28, fg),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        paper,
        { id: 'decor-kit-8', type: 'shape', shape: 'round', fill: '#ffdca4', radius: 32, border: 0, shadowLevel: 0, decor: true, ...box(160, 140, 960, 440) },
        art(1, 'dan-gian/canh-tre', -40, -40, 400, { flipX: true }),
        art(2, 'dan-gian/hoa-sen', 940, 450, 330),
        art(3, 'dan-gian/chuon-chuon', 940, 60, 140),
        body('kicker', upper(c.kicker), box(240, 169, 800, 54), 24, fg, { fontWeight: 800, align: 'center' }),
        title('body', text, box(230, 226, 820, 260), text.length > 150 ? 40 : text.length > 80 ? 50 : 66, ink, { align: 'center', valign: 'middle' }),
        body('author', c.author, box(260, 502, 760, 56), 24, fg, { align: 'center' }),
      ]
    }
    case 'editorial-text': {
      // đổi hình theo độ dài tiêu đề để hai slide chữ không giống hệt nhau
      const kite = (c.title?.length ?? 0) % 2 === 0
      return [
        paper,
        blob(800, 20, 700),
        ...(kite
          ? [art(1, 'dan-gian/dieu', 740, 160, 500), art(2, 'dan-gian/may', 760, 650, 520)]
          : [art(1, 'dan-gian/den-long', 880, -10, 290), art(2, 'dan-gian/non-la', 850, 420, 360)]),
        body('kicker', upper(c.kicker), box(96, 61, 640, 54), 24, fg, { fontWeight: 800 }),
        title('title', c.title, box(96, 112, 640, 170), 56, ink, { valign: 'middle' }),
        body('body', paragraphs(c), box(100, 310, 610, 350), 27, fg),
      ]
    }
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const head = [
        paper,
        art(1, 'dan-gian/sach', 1030, 0, 220),
        art(2, 'dan-gian/chuon-chuon', 20, 10, 100, { flipX: true }),
        body('kicker', upper(c.kicker), box(90, 49, 700, 54), 22, fg, { fontWeight: 800 }),
        title('title', c.title, box(90, 98, 920, 140), 54, ink, { valign: 'middle' }),
      ]
      // ba ý trở xuống: thẻ viền lượn; nhiều hơn: danh sách hàng ngang
      if (rows.length <= 3) {
        const colors = ['the-vang', 'the-xanh', 'the-tim']
        const left = 640 - (rows.length * 360 + (rows.length - 1) * 30) / 2
        return [...head, ...rows.flatMap((row, i) => {
          const x = left + i * 390
          return [
            image(`decor-kit-${3 + i}`, `/slide-packs/dan-gian/${colors[i]}.png`, box(x, 270, 360, 360), { decor: true }),
            title(`item-${i + 1}-value`, row.value, box(x + 24, 310, 312, 90), 36, ink, { align: 'center', valign: 'middle' }),
            body(`item-${i + 1}-label`, row.label, box(x + 28, 412, 304, 190), 26, fg, { align: 'center' }),
          ]
        })]
      }
      const h = Math.min(110, 400 / rows.length)
      return [...head, ...rows.flatMap((row, i) => {
        const y = 262 + i * h
        return [
          { id: `divider-${i + 1}`, type: 'shape', shape: 'rect', fill: ink, opacity: 0.3, border: 0, shadowLevel: 0, ...box(100, y, 1080, 2) } as SlideElement,
          title(`item-${i + 1}-value`, row.value, box(96, y + 4, 240, h - 8), 34, ink, { valign: 'middle' }),
          body(`item-${i + 1}-label`, row.label, box(360, y + 4, 820, h - 8), 25, fg, { valign: 'middle', lineHeight: 1.3 }),
        ]
      })]
    }
    case 'bignum':
      return [
        paper,
        blob(720, 80, 560),
        c.image ? photo(box(770, 130, 460, 460), { shape: 'ellipse' }) : art(1, 'dan-gian/non-la', 800, 170, 420),
        art(2, 'dan-gian/chuon-chuon', 620, 40, 140),
        body('kicker', upper(c.kicker), box(100, 81, 560, 58), 24, fg, { fontWeight: 800 }),
        title('bignum-value', c.value, box(96, 140, 600, 270), 180, ink, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(100, 430, 580, 100), 40, fg),
        body('subtitle', c.subtitle, box(100, 545, 580, 80), 24, fg),
      ]
    default:
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Các bộ theo môn: chung một khung bố cục, mỗi bộ chỉ khai báo màu,
 * kiểu thẻ và chỗ đặt hình. Thêm bộ mới = thêm một mục vào STUDY.
 * ------------------------------------------------------------------ */
type StudyId = 'khoa-hoc' | 'toan' | 'vat-ly' | 'hoa-hoc' | 'tin-hoc' | 'tam-ly' | 'sinh-hoc'

/** hình đặt gọn trong một ô: [tên, x, y, rộng, cao] (px trên slide 1280×720) */
type Slot = [string, number, number, number, number]

interface StudyStyle {
  /** màu luân phiên cho số thứ tự và thẻ, kèm màu chữ trên từng màu */
  cycle: string[]
  onCycle: string[]
  /** outline: viền màu; strip: dải màu trên; window: thanh cửa sổ; tint: nền pha nhạt */
  cards: 'outline' | 'strip' | 'window' | 'tint'
  tints?: string[]
  card: string
  line: string
  radius: number
  /** ý đánh số có thẻ nền riêng; số nằm trong hình tròn hay ô vuông bo */
  rowCards: boolean
  round: boolean
  /** nhãn trên tiêu đề */
  tag: { fill: string; text: string; pill: boolean }
  /** nhãn câu trích: viên thuốc đậm trên mép thẻ, không có thì chữ thường trong thẻ */
  quoteTag?: { fill: string; text: string }
  /** băng dính trang trí kiểu sổ tay */
  tape?: string
  big: string
  formula: string
  halo: string
  frame: string
  cover: Slot[]
  quote: Slot[]
  list: Slot[]
  listHalo?: boolean
  corner: Slot
  bignum: Slot[]
  bignumHalo?: boolean
  backdrop: Slot
  /** bố cục căn giữa, hình đặt hai bên, các ý chia cột (không dùng thẻ) */
  centered?: boolean
  /** hình góc trái của slide thẻ trong bộ căn giữa */
  extra?: Slot
}

const STUDY: Record<StudyId, StudyStyle> = {
  'khoa-hoc': {
    cycle: ['#0f7c8c', '#e4695a', '#e9b949'], onCycle: ['#ffffff', '#ffffff', '#173f5f'],
    cards: 'strip', card: '#ffffff', line: '#dcd8cc', radius: 0, rowCards: false, round: true,
    tag: { fill: '#f6cf63', text: '#173f5f', pill: false }, tape: '#e9b949',
    big: '#173f5f', formula: '#0f7c8c', halo: '#e2f0ec', frame: '#ffffff',
    cover: [['kinh-hien-vi', 800, 106, 340, 614], ['nguyen-tu', 660, 36, 180, 176], ['binh-tam-giac', 670, 430, 180, 271]],
    quote: [['dna', 46, 380, 120, 293], ['bong-den', 1096, 440, 160, 180]],
    list: [['te-bao', 866, 200, 330, 368], ['la-cay', 1100, 14, 140, 200]], listHalo: true,
    corner: ['ong-nghiem', 1010, 40, 180, 150],
    bignum: [['hanh-tinh', 690, 170, 520, 303], ['nam-cham', 1070, 500, 130, 175]],
    backdrop: ['nguyen-tu', 1170, 8, 90, 88],
  },
  toan: {
    cycle: ['#2f6fd6', '#e8702f', '#2f9e7f'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'outline', card: '#ffffff', line: '#dbe7fb', radius: 28, rowCards: true, round: false,
    tag: { fill: '#f6cf63', text: '#1d3f8f', pill: true }, quoteTag: { fill: '#2f6fd6', text: '#ffffff' },
    big: '#d9611f', formula: '#c4561a', halo: '#fff1c9', frame: '#2f6fd6',
    cover: [['e-ke', 800, 150, 370, 375], ['compa', 700, 40, 160, 219], ['but-chi', 1090, 440, 160, 181], ['khoi-hinh', 660, 520, 380, 144]],
    quote: [['thuoc-do-goc', 30, 560, 220, 132], ['thuoc-ke', 1070, 30, 180, 180]],
    list: [['ban-tinh', 872, 264, 330, 354], ['dau-phep-tinh', 1060, 40, 160, 155]],
    corner: ['hinh-tru-lang-tru', 930, 60, 290, 166],
    bignum: [['may-tinh', 870, 170, 285, 364], ['but-chi', 700, 40, 140, 158]], bignumHalo: true,
    backdrop: ['dau-phep-tinh', 1180, 8, 80, 78],
  },
  'vat-ly': {
    cycle: ['#3d6399', '#a8503c', '#7a6118'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'tint', tints: ['#e4eef8', '#fbe7e2', '#faf0d4'], card: '#ffffff', line: '#dddbd6', radius: 24, rowCards: false, round: true,
    tag: { fill: '#e4eef8', text: '#2f4a73', pill: true },
    big: '#3d6399', formula: '#3d6399', halo: '#e4eef8', frame: '#a9cdee', centered: true,
    cover: [['nguyen-tu', 16, 16, 250, 340], ['dai-song', 890, 0, 390, 230], ['kinh-thien-van', 985, 300, 285, 415], ['nam-cham', 24, 440, 260, 270]],
    quote: [['con-lac', 0, 300, 240, 420], ['lo-xo', 1040, 0, 240, 420]],
    list: [['nguyen-tu', 24, 20, 190, 160], ['ten-lua', 1100, 20, 150, 180], ['cum-sao', 1110, 545, 160, 160]],
    corner: ['lang-kinh', 1020, 36, 240, 140], extra: ['hanh-tinh', 40, 28, 180, 180],
    bignum: [['hanh-tinh', 760, 50, 340, 290], ['mach-dien', 800, 390, 400, 290], ['cum-sao', 1140, 40, 110, 120]],
    backdrop: ['nguyen-tu', 1150, 14, 110, 100],
  },
  'hoa-hoc': {
    cycle: ['#4a7573', '#a5566a', '#7a6520'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'tint', tints: ['#e3efec', '#f4e5e8', '#f7f1d6'], card: '#ffffff', line: '#dddbd6', radius: 24, rowCards: false, round: true,
    tag: { fill: '#e3efec', text: '#37605e', pill: true },
    big: '#4a7573', formula: '#4a7573', halo: '#e3efec', frame: '#a9d3c0', centered: true,
    cover: [['binh-cau', 16, 16, 250, 340], ['dai-te-bao', 890, 0, 390, 230], ['binh-tam-giac', 985, 300, 285, 415], ['cum-vi-khuan', 24, 440, 260, 270]],
    quote: [['dna', 0, 300, 240, 420], ['dna', 1040, 0, 240, 420]],
    list: [['phan-tu', 24, 20, 190, 160], ['ong-nghiem-doi', 1100, 20, 150, 180], ['nguyen-tu', 1110, 545, 160, 160]],
    corner: ['coc-dong', 1085, 30, 150, 180], extra: ['gia-ong-nghiem', 40, 28, 180, 180],
    bignum: [['phan-tu', 760, 50, 340, 290], ['dai-te-bao', 880, 400, 400, 320], ['kinh-hien-vi', 740, 350, 220, 320]],
    backdrop: ['phan-tu', 1150, 14, 110, 100],
  },
  'tin-hoc': {
    cycle: ['#5a3ee0', '#0b7d6d', '#c93a63'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'window', card: '#ffffff', line: '#e4e0f5', radius: 14, rowCards: true, round: false,
    tag: { fill: '#241d4d', text: '#ffffff', pill: false },
    big: '#5a3ee0', formula: '#5a3ee0', halo: '#ece8fd', frame: '#6c4cf1',
    cover: [['may-tinh-xach-tay', 740, 150, 490, 450], ['dam-may', 660, 40, 200, 170], ['banh-rang', 1080, 500, 170, 180]],
    quote: [['robot', 30, 430, 170, 260], ['khien-bao-mat', 1085, 450, 170, 220]],
    list: [['may-chu', 880, 220, 320, 390], ['mang-luoi', 1070, 24, 170, 170]], listHalo: true,
    corner: ['vi-mach', 1010, 34, 200, 180],
    bignum: [['dien-thoai', 820, 130, 360, 450], ['chuot-ban-phim', 1010, 550, 230, 140]], bignumHalo: true,
    backdrop: ['vi-mach', 1170, 10, 90, 90],
  },
  'sinh-hoc': {
    cycle: ['#3f6f43', '#a5503f', '#7a6118'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'tint', tints: ['#e6f1dd', '#fbe9e5', '#faf1d6'], card: '#ffffff', line: '#dddbd6', radius: 24, rowCards: false, round: true,
    tag: { fill: '#e6f1dd', text: '#34603a', pill: true },
    big: '#3f6f43', formula: '#3f6f43', halo: '#e6f1dd', frame: '#a9cf8e', centered: true,
    cover: [['la-cay', 16, 16, 250, 340], ['dai-te-bao', 890, 0, 390, 230], ['kinh-hien-vi', 985, 300, 285, 415], ['cum-vi-khuan', 24, 440, 260, 270]],
    quote: [['dna', 0, 300, 240, 420], ['dna', 1040, 0, 240, 420]],
    list: [['te-bao-dong-vat', 24, 20, 190, 160], ['mam-cay', 1100, 20, 150, 180], ['buom', 1110, 545, 160, 160]],
    corner: ['te-bao-thuc-vat', 1085, 30, 150, 180], extra: ['no-ron', 40, 28, 180, 180],
    bignum: [['trai-tim', 760, 50, 340, 290], ['dai-te-bao', 880, 400, 400, 320], ['te-bao-thuc-vat', 740, 350, 220, 320]],
    backdrop: ['te-bao-dong-vat', 1150, 14, 110, 100],
  },
  'tam-ly': {
    cycle: ['#a8532f', '#4f7350', '#4c5c92'], onCycle: ['#ffffff', '#ffffff', '#ffffff'],
    cards: 'tint', tints: ['#f8e4da', '#e6eee3', '#fbefd3'], card: '#fffaf5', line: '#f0ddd0', radius: 40, rowCards: true, round: true,
    tag: { fill: '#f4d6c6', text: '#5a2c1c', pill: true },
    big: '#a8532f', formula: '#a8532f', halo: '#f8e4da', frame: '#f2a58c',
    cover: [['nao-cay', 770, 110, 440, 540], ['bong-thoai', 650, 40, 190, 170], ['mam-cay', 650, 460, 180, 220]],
    quote: [['thien', 28, 430, 190, 260], ['guong', 1085, 440, 170, 240]],
    list: [['tro-chuyen', 850, 230, 370, 350], ['may-mat-troi', 1060, 30, 180, 160]], listHalo: true,
    corner: ['manh-ghep', 1010, 34, 200, 180],
    bignum: [['trai-tim', 800, 150, 400, 410], ['so-tay', 1040, 540, 200, 140]], bignumHalo: true,
    backdrop: ['mam-cay', 1175, 8, 80, 100],
  },
}

const isStudy = (pack: SlidePackId): pack is StudyId => pack in STUDY

/** đặt hình vào giữa ô, giữ tỉ lệ gốc */
function fit(pack: StudyId, n: number, [name, x, y, w, h]: Slot): SlideElement {
  const [aw, ah] = ART[`${pack}/${name}`]
  const k = Math.min(w / aw, h / ah)
  return art(n, `${pack}/${name}`, x + (w - aw * k) / 2, y + (h - ah * k) / 2, aw * k)
}

const shape = (id: string, b: Box, fill: string, extra: Partial<SlideElement> = {}): SlideElement =>
  ({ id, type: 'shape', shape: 'rect', fill, border: 0, shadowLevel: 0, ...b, ...extra })

const deco = (n: number, b: Box, fill: string, extra: Partial<SlideElement> = {}) =>
  shape(`decor-kit-${n}`, b, fill, { decor: true, ...extra })

const rounded = (radius: number): Partial<SlideElement> => (radius ? { shape: 'round', radius } : {})

/** nhãn nhỏ trên tiêu đề */
function tag(value: string | undefined, x: number, y: number, { body }: Kit, look: { fill: string; text: string; pill: boolean }, center = false): Built {
  const label = upper(value)
  if (!label) return []
  const w = Math.min(760, 60 + label.length * 17)
  const left = center ? x - w / 2 : x
  return [
    deco(40, box(left, y, w, 50), look.fill, look.pill ? rounded(25) : { rotation: -1.2, opacity: 0.95 }),
    body('kicker', label, box(left, y + 2, w, 48), 22, look.text, { fontWeight: 700, align: 'center', valign: 'middle', lineHeight: 1.2 }),
  ]
}

const studyHead = (pack: StudyId, c: SlideLayoutContent, kit: Kit): Built => STUDY[pack].centered
  ? [
      ...tag(c.kicker, 640, 52, kit, STUDY[pack].tag, true),
      kit.title('title', c.title, box(230, 112, 820, 136), 66, PACK_COLORS[pack].ink, { align: 'center', valign: 'middle' }),
    ]
  : [
      ...tag(c.kicker, 106, 58, kit, STUDY[pack].tag),
      kit.title('title', c.title, box(106, 118, 760, 132), 54, PACK_COLORS[pack].ink, { valign: 'middle' }),
    ]

/** bộ căn giữa: bìa, câu trích, các ý chia cột, thẻ không nền */
function centeredStudy(pack: StudyId, id: string, c: SlideLayoutContent, kit: Kit): Built | null {
  const { title, body } = kit
  const { ink, fg } = PACK_COLORS[pack]
  const style = STUDY[pack]
  const paper = full(`${pack}/giay`)
  const arts = (slots: Slot[]) => slots.map((slot, i) => fit(pack, i + 1, slot))
  const middle = { align: 'center' as const, valign: 'middle' as const }
  switch (id) {
    case 'photo-full':
      if (c.image) return null
      return [
        paper,
        ...arts(style.cover),
        ...tag(c.kicker, 640, 112, kit, style.tag, true),
        title('title', c.title, box(270, 176, 740, 290), 104, ink, { ...middle, lineHeight: 1.05 }),
        body('subtitle', c.subtitle, box(320, 490, 640, 110), 30, style.big, { align: 'center', fontWeight: 700 }),
      ]
    case 'manifesto': {
      const text = statement(c)
      return [
        paper,
        ...arts(style.quote),
        title('kicker', upper(c.kicker), box(290, 110, 700, 90), 50, ink, middle),
        title('body', text, box(250, 220, 780, 270), text.length > 150 ? 42 : text.length > 90 ? 50 : 60, fg, { ...middle, fontWeight: 600, lineHeight: 1.25 }),
        body('author', c.author, box(300, 520, 680, 80), 28, style.big, { align: 'center', fontWeight: 700 }),
      ]
    }
    case 'editorial-text':
    case 'bullets': {
      const bullets = list(c.bullets)
      const items = bullets.length ? bullets : list(c.body?.split('\n'))
      if (id === 'bullets' && !items.length) return []
      let content: Built
      if (items.length < 2 || items.length > 4) {
        const text = items.length > 1 ? items.map((item) => `• ${item}`).join('\n') : items[0]
        content = [body(bullets.length ? 'bullets' : 'body', text, box(210, 272, 860, 390), (text?.length ?? 0) > 320 ? 26 : 32, fg, { ...middle, lineHeight: 1.6 })]
      } else {
        const grid = items.length === 4
        const per = grid ? 2 : items.length
        const w = (920 - (per - 1) * 40) / per
        content = items.flatMap((item, i) => {
          const x = 180 + (i % per) * (w + 40)
          const y = grid ? 262 + Math.floor(i / per) * 205 : 282
          const color = style.cycle[i % style.cycle.length]
          return [
            title(`decor-kit-${70 + i}`, `0${i + 1}`, box(x, y - (grid ? 12 : 0), w, grid ? 92 : 90), grid ? 56 : 76, color, { ...middle, decor: true, lineHeight: 1 }),
            body(`bullet-${i + 1}`, item, box(x, y + (grid ? 80 : 108), w, grid ? 118 : 250), grid ? 29 : 30, fg, { align: 'center', lineHeight: 1.45 }),
          ]
        })
      }
      return [paper, ...arts(style.list), ...studyHead(pack, c, kit), ...content]
    }
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      const w = (960 - (Math.min(rows.length, 3) - 1) * 50) / Math.min(rows.length, 3)
      const left = 640 - (rows.length * w + (rows.length - 1) * 50) / 2
      return [
        paper,
        fit(pack, 1, style.corner),
        style.extra ? fit(pack, 2, style.extra) : null,
        ...studyHead(pack, c, kit),
        ...(rows.length > 3
          ? cards(pack, rows, kit)
          : rows.flatMap((row, i) => {
              const x = left + i * (w + 50)
              return [
                title(`item-${i + 1}-value`, row.value, box(x, 296, w, 96), 44, style.cycle[i % style.cycle.length], middle),
                body(`item-${i + 1}-label`, row.label, box(x, 410, w, 220), 28, fg, { align: 'center' }),
              ]
            })),
      ]
    }
    case 'bignum':
      if (c.image) return null
      return [
        paper,
        ...arts(style.bignum),
        ...tag(c.kicker, 130, 100, kit, style.tag),
        title('bignum-value', c.value, box(124, 160, 580, 250), 230, style.big, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(130, 420, 580, 130), 64, ink),
        body('subtitle', c.subtitle, box(130, 566, 560, 90), 28, fg),
      ]
    default:
      return null
  }
}

/** hai tới bốn ý đánh số; còn lại là một khối chữ */
function steps(pack: StudyId, c: SlideLayoutContent, { title, body }: Kit): Built {
  const bullets = list(c.bullets)
  const items = bullets.length ? bullets : list(c.body?.split('\n'))
  const { fg } = PACK_COLORS[pack]
  const style = STUDY[pack]
  if (!items.length) return []
  if (items.length < 2 || items.length > 4) {
    const text = items.length > 1 ? items.map((item) => `• ${item}`).join('\n') : items[0]
    return [body(bullets.length ? 'bullets' : 'body', text, box(110, 276, 690, 390), text.length > 320 ? 24 : 28, fg, { valign: 'middle', lineHeight: 1.6 })]
  }
  const h = Math.min(126, 390 / items.length)
  return items.flatMap((item, i) => {
    const y = 272 + i * h
    const k = i % style.cycle.length
    const at = box(128, y + (h - 18 - 56) / 2, 56, 56)
    return [
      style.rowCards
        ? deco(50 + i, box(106, y, 710, h - 18), style.card, { ...rounded(Math.min(style.radius, 28)), border: 3, borderColor: style.line })
        : null,
      deco(60 + i, at, style.cycle[k], style.round ? { shape: 'ellipse' } : rounded(14)),
      title(`decor-kit-${70 + i}`, String(i + 1), at, 26, style.onCycle[k], { align: 'center', valign: 'middle', decor: true, lineHeight: 1.1 }),
      body(`bullet-${i + 1}`, item, box(206, y, 590, h - 18), 27, fg, { valign: 'middle', lineHeight: 1.35 }),
    ]
  })
}

/** tối đa ba thẻ dọc; nhiều hơn thì danh sách hàng ngang */
function cards(pack: StudyId, rows: Array<{ value: string; label: string }>, { title, body }: Kit): Built {
  const { ink, fg } = PACK_COLORS[pack]
  const style = STUDY[pack]
  if (rows.length > 3) {
    const h = Math.min(104, 400 / rows.length)
    return rows.flatMap((row, i) => {
      const y = 272 + i * h
      return [
        shape(`divider-${i + 1}`, box(106, y, 1070, 2), ink, { opacity: 0.25 }),
        title(`item-${i + 1}-value`, row.value, box(106, y + 4, 250, h - 8), 32, ink, { valign: 'middle' }),
        body(`item-${i + 1}-label`, row.label, box(376, y + 4, 800, h - 8), 25, fg, { valign: 'middle', lineHeight: 1.3 }),
      ]
    })
  }
  const left = 664 - (rows.length * 336 + (rows.length - 1) * 36) / 2
  return rows.flatMap((row, i) => {
    const x = left + i * 372
    const k = i % style.cycle.length
    const color = style.cycle[k]
    const whole = box(x, 276, 336, 356)
    const back: SlideElement[] =
      style.cards === 'outline' ? [deco(50 + i, whole, style.card, { ...rounded(style.radius), border: 4, borderColor: color, shadowLevel: 1 })]
        : style.cards === 'tint' ? [deco(50 + i, whole, style.tints![k], rounded(style.radius))]
          : style.cards === 'window'
            ? [
                deco(50 + i, whole, style.card, { border: 3, borderColor: style.line, shadowLevel: 1 }),
                deco(60 + i, box(x, 276, 336, 34), color),
                ...[0, 1, 2].map((d) => deco(80 + i * 3 + d, box(x + 16 + d * 22, 286, 13, 13), '#ffffff', { shape: 'ellipse' })),
              ]
            : [
                deco(50 + i, whole, style.card, { shadowLevel: 1 }),
                deco(60 + i, box(x, 276, 336, 10), color),
                deco(70 + i, box(x + 108, 258, 120, 36), '#cfe3df', { opacity: 0.8, rotation: [-4, 3, -2][i] }),
              ]
    return [
      ...back,
      title(`item-${i + 1}-value`, row.value, box(x + 18, 320, 300, 90), 36, ink, { align: 'center', valign: 'middle' }),
      body(`item-${i + 1}-label`, row.label, box(x + 28, 424, 280, 188), 25, fg, { align: 'center' }),
    ]
  })
}

function study(pack: StudyId, id: string, c: SlideLayoutContent, kit: Kit): Built | null {
  const { title, body } = kit
  const { ink, fg, accent } = PACK_COLORS[pack]
  const style = STUDY[pack]
  if (style.centered) {
    const built = centeredStudy(pack, id, c, kit)
    if (built) return built
  }
  const paper = full(`${pack}/giay`)
  const arts = (slots: Slot[]) => slots.map((slot, i) => fit(pack, i + 1, slot))
  const halo = (x: number, y: number, size: number) => deco(8, box(x, y, size, size), style.halo, { shape: 'ellipse' })
  /** ảnh: khung màu của bộ, hoặc tờ ảnh dán băng dính */
  const photo = (x: number, y: number, w: number, h: number): Built => [
    style.tape ? deco(30, box(x - 16, y - 16, w + 32, h + 32), '#ffffff', { shadowLevel: 2 }) : null,
    image('image-1', c.image, box(x, y, w, h), {
      imagePosition: { x: c.focusX ?? 50, y: c.focusY ?? 40 }, crop: c.imageCrop,
      ...(style.tape ? {} : { ...rounded(style.radius), border: 6, borderColor: style.frame }),
    }),
    style.tape ? deco(31, box(x + w / 2 - 70, y - 32, 140, 38), style.tape, { opacity: 0.8, rotation: -3 }) : null,
  ]
  switch (id) {
    case 'photo-full':
      return [
        paper,
        ...(c.image ? photo(730, 130, 450, 460) : arts(style.cover)),
        ...tag(c.kicker, 110, 128, kit, style.tag),
        title('title', c.title, box(106, 200, 590, 260), c.image ? 62 : 74, ink, { valign: 'middle' }),
        body('subtitle', c.subtitle, box(110, 478, 520, 130), 27, fg),
      ]
    case 'manifesto': {
      const text = statement(c)
      // dòng cuối là công thức thì cho to và nổi, là tên người / nguồn thì để nhỏ
      const formula = /[=≤≥]/.test(c.author ?? '')
      return [
        paper,
        style.tape
          ? deco(8, box(190, 130, 900, 450), style.card, { shadowLevel: 2 })
          : deco(8, box(180, 150, 920, 430), style.card, { ...rounded(style.radius), border: 4, borderColor: style.frame, shadowLevel: 1 }),
        ...(style.tape
          ? [
              deco(9, box(148, 128, 150, 36), style.tape, { opacity: 0.8, rotation: -32 }),
              deco(10, box(982, 126, 150, 36), style.tape, { opacity: 0.8, rotation: 32 }),
            ]
          : []),
        ...arts(style.quote),
        ...(style.quoteTag
          ? tag(c.kicker, 640, 126, kit, { ...style.quoteTag, pill: true }, true)
          : [body('kicker', upper(c.kicker), box(240, 172, 800, 54), 22, accent, { fontWeight: 700, align: 'center' })]),
        title('body', text, box(250, 232, 780, 214), text.length > 150 ? 36 : text.length > 90 ? 44 : 56, ink, { align: 'center', valign: 'middle' }),
        formula
          ? title('author', c.author, box(220, 458, 840, 100), 52, style.formula, { align: 'center', valign: 'middle' })
          : body('author', c.author, box(240, 484, 800, 66), 24, fg, { align: 'center' }),
      ]
    }
    case 'editorial-text':
    case 'bullets': {
      const items = steps(pack, c, kit)
      if (id === 'bullets' && !items.length) return []
      return [
        paper,
        style.listHalo ? halo(836, 190, 390) : null,
        ...arts(style.list),
        ...studyHead(pack, c, kit),
        ...items,
      ]
    }
    case 'rules': {
      const rows = rowsOf(c)
      if (!rows.length) return []
      return [paper, fit(pack, 1, style.corner), ...studyHead(pack, c, kit), ...cards(pack, rows, kit)]
    }
    case 'bignum':
      return [
        paper,
        ...(c.image
          ? photo(750, 130, 440, 460)
          : [style.bignumHalo ? halo(780, 130, 440) : null, ...arts(style.bignum)]),
        ...tag(c.kicker, 110, 100, kit, style.tag),
        title('bignum-value', c.value, box(106, 168, 600, 250), 200, style.big, { valign: 'middle', lineHeight: 1 }),
        title('bignum-label', c.label, box(110, 436, 590, 100), 40, ink),
        body('subtitle', c.subtitle, box(110, 556, 570, 90), 25, fg),
      ]
    default:
      return null
  }
}

/* ------------------------------------------------------------------ *
 * Gạch đầu dòng, so sánh ảnh, biểu đồ cột: cùng khung và hình của bộ
 * ------------------------------------------------------------------ */
function shared(pack: SlidePackId, id: string, c: SlideLayoutContent, kit: Kit, standard: () => SlideElement[]): Built | null {
  if (id !== 'bullets' && id !== 'photo-compare' && id !== 'bars') return null
  const { title, body } = kit
  const learn: StudyId | null = isStudy(pack) ? pack : null
  const red = pack === 'co-dien'
  const { ink, fg } = PACK_COLORS[pack]
  const rule: SlideElement = { id: 'divider-1', type: 'shape', shape: 'rect', fill: ink, opacity: 0.45, border: 0, shadowLevel: 0, ...box(100, (c.title?.length ?? 0) > 36 ? 250 : 206, 120, 5) }
  const head = (): Built => learn ? studyHead(learn, c, kit) : [
    body('kicker', upper(c.kicker), box(96, 57, 700, 54), 22, red ? ink : fg, { fontWeight: red ? 700 : 800 }),
    title('title', c.title, box(96, 114, 860, 130), 52, ink, { valign: 'top' }),
    rule,
  ]
  const paper = full(learn ? `${learn}/giay` : red ? 'co-dien/tem-day' : 'dan-gian/giay-o')
  const corner = (): SlideElement =>
    learn ? fit(learn, 1, STUDY[learn].corner)
        : red ? art(1, 'co-dien/canh-tung', 900, 50, 320)
          : id === 'bars' ? art(1, 'dan-gian/sach', 1030, 0, 220) : art(1, 'dan-gian/canh-tre', 990, -40, 330)

  if (id === 'bullets') {
    const items = list(c.bullets).length ? list(c.bullets) : list(c.body?.split('\n'))
    if (!items.length) return []
    const numbered = items.every((item) => /^\d+[.)]\s/.test(item))
    const text = items.map((item) => (numbered ? item : `• ${item}`)).join('\n')
    const size = text.length > 320 ? 24 : text.length > 180 ? 28 : 34
    return [
      paper,
      ...(red
        ? [art(1, 'co-dien/hoa-sen', 905, 300, 270), art(2, 'co-dien/chim-en', 1000, 52, 150)]
        : [
            { id: 'decor-kit-8', type: 'shape', shape: 'round', fill: '#ffe9b8', radius: 28, border: 0, shadowLevel: 0, decor: true, ...box(76, 274, 820, 396) } as SlideElement,
            art(1, 'dan-gian/hoa-sen', 920, 400, 340),
            art(2, 'dan-gian/chuon-chuon', 960, 90, 170),
          ]),
      ...head(),
      body('bullets', text, red ? box(100, 278, 780, 380) : box(110, 292, 750, 360), size, red ? ink : fg, { valign: 'middle', lineHeight: 1.7 }),
    ]
  }

  if (id === 'photo-compare') {
    const captions = Boolean(c.caption || c.caption2)
    const h = captions ? 300 : 370
    const frame = red ? { border: 6, borderColor: ink }
      : learn
        ? { ...rounded(STUDY[learn].radius), border: 6, borderColor: STUDY[learn].frame, ...(STUDY[learn].tape ? { shadowLevel: 2 as const } : {}) }
        : { shape: 'round' as const, radius: 28, border: 6, borderColor: '#ffd98a' }
    return [
      paper,
      corner(),
      ...head(),
      image('image-1', c.image, box(100, 280, 525, h), { crop: c.imageCrop, ...frame }),
      image('image-2', c.image2, box(655, 280, 525, h), { crop: c.image2Crop, ...frame }),
      body('photo-caption', c.caption, box(100, 594, 525, 66), 22, fg, { align: 'center' }),
      body('photo-caption-2', c.caption2, box(655, 594, 525, 66), 22, fg, { align: 'center' }),
    ]
  }

  // biểu đồ cột: giữ các phần tử của bố cục thường, dời xuống dưới tiêu đề của bộ
  const chart = standard().filter((el) => el.id.startsWith('bar'))
  if (!chart.length) return []
  for (const el of chart) {
    el.x = 8 + (el.x - 5) * 0.93
    el.y = 38 + (el.y - 26) * 0.84
    el.w *= 0.93
    el.h *= 0.84
  }
  return [
    paper,
    corner(),
    ...head(),
    ...chart,
  ]
}

/** Nền / trang trí đặt dưới các bố cục còn lại. */
function backdrop(pack: SlidePackId): SlideElement[] {
  if (isStudy(pack)) return [full(`${pack}/giay`), fit(pack, 1, STUDY[pack].backdrop)]
  switch (pack) {
    case 'co-dien': return [full('co-dien/tem-day'), art(1, 'co-dien/goc-hoa-van', 44, 36, 110)]
    case 'dan-gian': return [full('dan-gian/giay-o'), art(1, 'dan-gian/chuon-chuon', 1130, 6, 110)]
  }
}

export function composePack(
  pack: SlidePackId,
  layoutId: string,
  content: SlideLayoutContent,
  text: Text,
  standard: () => SlideElement[],
): SlideElement[] {
  const kit = kitOf(text)
  const own = pack === 'co-dien' ? coDien(layoutId, content, kit)
    : pack === 'dan-gian' ? danGian(layoutId, content, kit)
      : study(pack, layoutId, content, kit)
  const built = own ?? shared(pack, layoutId, content, kit, standard)
  if (built) return built.filter((el): el is SlideElement => Boolean(el))
  const elements = standard()
  if (!elements.length) return elements
  // bố cục thường tính lề theo slide trơn; khung tem lấn vào nên thu vào trong tờ giấy
  if (pack === 'co-dien') for (const el of elements) {
    el.x = 5 + el.x * 0.9
    el.y = 6 + el.y * 0.88
    el.w *= 0.9
    el.h *= 0.88
    if (el.fontSize) el.fontSize *= 0.9
  }
  // gáy sổ / đường lề bên trái
  if (pack === 'khoa-hoc' || pack === 'toan') for (const el of elements) {
    el.x = 3.5 + el.x * 0.94
    el.w *= 0.94
  }
  return [...backdrop(pack), ...elements]
}

/** Màu dòng nguồn: slide câu lớn của bộ cổ điển có chân nền đỏ. */
export function packCreditColor(pack: SlidePackId, layoutId: string): string {
  return pack === 'co-dien' && layoutId === 'manifesto' ? CREAM : PACK_COLORS[pack].muted
}
