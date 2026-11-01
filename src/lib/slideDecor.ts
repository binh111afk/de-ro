/**
 * Trang trí slide theo bộ (decor kit): AI chọn MỘT bộ cho cả bài ở bước dàn ý, app đặt
 * hoạ tiết của bộ vào đúng các vị trí thiết kế sẵn của từng bố cục.
 *
 * Vì sao không để AI chọn từng slide: hoạ tiết đổi liên tục làm deck rời rạc, và vị trí
 * "chỗ nào trống thì nhét" không ăn nhập với bố cục. Ở đây AI chỉ quyết phong cách;
 * vị trí, cỡ, số lượng do bố cục quyết.
 */

/** Vai của hoạ tiết trong bộ: ôm góc slide · điểm nhấn nhỏ cạnh tiêu đề · mừng (mở đầu/kết thúc). */
export type DecorRole = 'corner' | 'accent' | 'celebrate'

export interface DecorKit {
  id: string
  name: string
  /** gợi ý khi nào hợp — đưa vào prompt dàn ý */
  vibe: string
  pieces: Record<DecorRole, string> | null
}

export const DECOR_KITS: DecorKit[] = [
  {
    id: 've-tay',
    name: 'Vẽ tay vui',
    vibe: 'lớp học, tiểu học/THCS, hoạt động, kỹ năng',
    pieces: { corner: 'orn-goc-cham-tron', accent: 'orn-sao-ve-tay', celebrate: 'orn-confetti' },
  },
  {
    id: 'la-xanh',
    name: 'Lá xanh',
    vibe: 'sinh học, địa lí, môi trường, thiên nhiên',
    pieces: { corner: 'orn-canh-la', accent: 'orn-chiec-la', celebrate: 'orn-nhanh-la-goc' },
  },
  {
    id: 'hoa-diu',
    name: 'Hoa dịu',
    vibe: 'văn học, nghệ thuật, lịch sử – văn hoá, chủ đề nhẹ nhàng',
    pieces: { corner: 'orn-goc-hoa-la', accent: 'orn-canh-hoa-roi', celebrate: 'orn-bo-hoa' },
  },
  {
    id: 'hinh-hoc',
    name: 'Hình học',
    vibe: 'toán, tin học, khoa học, phong cách hiện đại',
    pieces: { corner: 'orn-cum-hinh-hoc', accent: 'orn-cum-cham-bi', celebrate: 'orn-vong-tron-long' },
  },
  {
    id: 'lap-lanh',
    name: 'Lấp lánh',
    vibe: 'lễ hội, tổng kết, khen thưởng, truyền cảm hứng',
    pieces: { corner: 'orn-cum-sao-lap-lanh', accent: 'orn-lap-lanh', celebrate: 'orn-co-duoi-nheo' },
  },
  {
    id: 'toi-gian',
    name: 'Tối giản',
    vibe: 'báo cáo, hội thảo, chủ đề trang trọng — không trang trí',
    pieces: null,
  },
]

const KIT_IDS = new Set(DECOR_KITS.map((kit) => kit.id))

export function isDecorKitId(value: unknown): value is string {
  return typeof value === 'string' && KIT_IDS.has(value)
}

export function decorKitById(id: string | undefined): DecorKit | undefined {
  return DECOR_KITS.find((kit) => kit.id === id)
}

/**
 * Vị trí trang trí của một bố cục: khung tối đa `w` × `h` (% bề rộng × % chiều cao slide),
 * ôm vào góc `at` của slide (cách mép một lề cố định) hoặc đặt ở toạ độ {x, y} thiết kế riêng.
 * Hoạ tiết được thu vừa khung theo tỉ lệ thật và dồn về phía góc, nên bộ nào cũng vừa.
 */
export interface DecorAnchor {
  role: DecorRole
  at: 'tl' | 'tr' | 'bl' | 'br' | { x: number; y: number }
  w: number
  h: number
}

/**
 * Bố cục nào có chỗ đẹp mới có trang trí; slide nội dung tối đa một món.
 * Bố cục dày (bảng, so sánh, trắc nghiệm, ví dụ, sơ đồ) và bố cục có ảnh: không trang trí.
 * Khung đo theo phần tử của từng bố cục (xem composeX trong slideLayouts.ts).
 */
export const DECOR_ANCHORS: Record<string, DecorAnchor[]> = {
  // phía trên panel hình (panel từ y 20) · góc dưới trái, dưới phụ đề
  title: [
    { role: 'celebrate', at: 'tr', w: 11, h: 13 },
    { role: 'corner', at: 'bl', w: 13, h: 15 },
  ],
  section: [
    { role: 'accent', at: 'tr', w: 6, h: 10 },
    { role: 'corner', at: 'br', w: 13, h: 20 },
  ],
  statement: [
    { role: 'accent', at: 'tr', w: 8, h: 12 },
    { role: 'corner', at: 'bl', w: 10.5, h: 17 },
  ],
  closing: [
    { role: 'celebrate', at: 'tl', w: 12, h: 22 },
    { role: 'corner', at: 'br', w: 11, h: 20 },
  ],
  quote: [{ role: 'corner', at: 'br', w: 12, h: 20 }],
  // khe giữa tiêu đề và panel nội dung, mép phải
  bullets: [{ role: 'accent', at: { x: 88.5, y: 30.5 }, w: 5, h: 10 }],
  cards: [{ role: 'accent', at: { x: 89, y: 24 }, w: 4.5, h: 10 }],
  'two-column': [{ role: 'corner', at: 'br', w: 9, h: 14 }],
  agenda: [{ role: 'corner', at: 'br', w: 7, h: 10 }],
  stats: [{ role: 'corner', at: 'br', w: 8, h: 13 }],
  timeline: [{ role: 'corner', at: 'br', w: 8, h: 8.5 }],
  cycle: [{ role: 'corner', at: 'br', w: 11, h: 18 }],
}

/** Bộ mặc định khi dàn ý không chọn (hoặc deck cũ): theo phong cách, rồi theo môn. */
export function defaultDecorKit(stylePack?: string, subject?: string): string {
  if (stylePack === 'editorial' || stylePack === 'consulting') return 'toi-gian'
  if (stylePack === 'keynote' || stylePack === 'bold' || stylePack === 'bento') return 'hinh-hoc'
  if (subject === 'toan' || subject === 'tin') return 'hinh-hoc'
  if (subject === 'khtn') return 'la-xanh'
  if (subject === 'van' || subject === 'su-dia') return 'hoa-diu'
  return 've-tay'
}

/** Danh sách bộ trang trí cho prompt dàn ý. */
export function decorKitCatalogText(): string {
  return [
    'TRANG TRÍ (chọn "decorKit" đúng một id — một bộ hoạ tiết dùng xuyên suốt cả bài; app tự đặt):',
    ...DECOR_KITS.map((kit) => `- ${kit.id}: ${kit.name} — ${kit.vibe}`),
  ].join('\n')
}
