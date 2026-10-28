/**
 * Registry đồ hoạ vector (chặng 2). Dữ liệu thô nằm ở `graphics.ts` (sinh tự
 * động từ contact sheet bằng `scripts/import-graphics.mjs`).
 *
 * Vai trò: AI chọn một `id` có sẵn thay vì gọi vẽ ảnh — nhanh, rẻ, không lỗi
 * chữ, và luôn đúng bộ màu. Renderer chỉ thay màu nét (#22333B) theo theme,
 * giữ nguyên khối fill pastel như bản thiết kế.
 */
import { GRAPHICS, type GraphicCategory, type SlideGraphicData } from './graphics'

export type { GraphicCategory, SlideGraphicData }

/** Icon AI được chọn; `ornament` (trang trí do layout đặt) chỉ tra được qua graphicById. */
export const SLIDE_GRAPHICS = GRAPHICS.filter((graphic) => graphic.category !== 'ornament')

const BY_ID = new Map(GRAPHICS.map((graphic) => [graphic.id, graphic]))

export const GRAPHIC_IDS = new Set(SLIDE_GRAPHICS.map((graphic) => graphic.id))

/** Màu nét gốc trong file thiết kế — thay bằng màu theme khi render. */
export const GRAPHIC_INK = '#22333B'

export const GRAPHIC_CATEGORY_LABEL: Record<GraphicCategory, string> = {
  math: 'Toán & hình học',
  sci: 'Khoa học',
  nat: 'Thiên nhiên',
  lang: 'Ngữ văn',
  soc: 'Lịch sử & địa lý',
  class: 'Lớp học',
  people: 'Người & giao tiếp',
  reward: 'Khen thưởng',
  sym: 'Ký hiệu',
  frame: 'Khung & nhãn',
  arrow: 'Mũi tên',
  decor: 'Trang trí',
  misc: 'Khác',
  cs: 'Tin học',
  prog: 'Ngôn ngữ lập trình',
  eng: 'Ngoại ngữ',
  geo: 'Địa lí',
  his: 'Lịch sử',
  lit: 'Văn học',
  bio: 'Sinh học',
  chem: 'Hoá học',
  phys: 'Vật lí',
  art: 'Nghệ thuật',
  pe: 'Thể chất',
  life: 'Kỹ năng sống',
  ornament: 'Trang trí (layout dùng, không vào catalog AI)',
}

const CATEGORY_ORDER: GraphicCategory[] = [
  'math',
  'sci',
  'nat',
  'lang',
  'soc',
  'class',
  'people',
  'reward',
  'sym',
  'frame',
  'arrow',
  'decor',
  'misc',
  'cs',
  'prog',
  'eng',
  'geo',
  'his',
  'lit',
  'bio',
  'chem',
  'phys',
  'art',
  'pe',
  'life',
]

/** Bỏ dấu tiếng Việt để search bằng chuỗi không dấu (giống pickSlideAsset). */
const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

export function isGraphicId(value: unknown): value is string {
  return typeof value === 'string' && GRAPHIC_IDS.has(value)
}

export function graphicById(id: string | undefined): SlideGraphicData | undefined {
  return id ? BY_ID.get(id) : undefined
}

/**
 * Tìm đồ hoạ theo từ khoá tiếng Việt (có dấu hay không dấu đều được).
 * Trả về xếp theo điểm khớp, tối đa `limit`.
 */
export function searchGraphics(text: string, limit = 8): SlideGraphicData[] {
  const q = norm(text).trim()
  if (!q) return []
  const tokens = q.split(/[^a-z0-9]+/).filter((token) => token.length >= 2)
  if (!tokens.length) return []
  return SLIDE_GRAPHICS.map((graphic) => {
    const hay = `${norm(graphic.name)} ${graphic.keywords} ${graphic.id.replace(/-/g, ' ')}`
    let score = 0
    for (const token of tokens) {
      if (hay.includes(token)) score += token.length > 3 ? 2 : 1
    }
    if (norm(graphic.name) === q) score += 4
    return { graphic, score }
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.graphic)
}

const words = (text: string): Set<string> =>
  new Set(norm(text).split(/[^a-z0-9]+/).filter((word) => word.length >= 3))

/**
 * Đồ hoạ AI chọn có khớp nghĩa slide không: tên/từ khoá/id của hình phải chung ít nhất một từ
 * với chữ trên slide. Không khớp thì bỏ hình (hình lệch nghĩa — cái cân cho ƯCLN — tệ hơn không hình).
 */
export function graphicFits(id: string, text: string): boolean {
  const graphic = graphicById(id)
  if (!graphic) return false
  const hay = words(`${graphic.name} ${graphic.keywords} ${graphic.id.replace(/-/g, ' ')}`)
  for (const word of words(text)) if (hay.has(word)) return true
  return false
}

/** SVG sẵn sàng nhúng: đổi màu nét, ép phủ kín hộp chứa. */
export function graphicMarkup(id: string, ink = GRAPHIC_INK): string {
  const graphic = graphicById(id)
  if (!graphic) return ''
  return graphic.svg
    .replace(/^<svg /, '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ')
    .replaceAll(GRAPHIC_INK, ink)
}

/**
 * Catalog gửi cho model: chỉ id + tên ngắn, gom theo nhóm. 232 mục ≈ 5,5K ký tự,
 * nên prompt từng slide chỉ gửi các nhóm hợp với môn (`categories`); không truyền
 * thì gửi hết (dùng khi chưa biết môn).
 */
export function graphicCatalogText(categories?: readonly string[]): string {
  return CATEGORY_ORDER.filter((category) => !categories || categories.includes(category))
    .map((category) => {
      const items = GRAPHICS.filter((graphic) => graphic.category === category)
      if (!items.length) return ''
      return `${category}: ${items.map((graphic) => `${graphic.id}=${graphic.name}`).join(', ')}`
    })
    .filter(Boolean)
    .join('\n')
}
