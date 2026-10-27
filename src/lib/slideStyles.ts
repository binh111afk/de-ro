/**
 * Style pack cho slide — art direction rút gọn.
 *
 * Ý tưởng và cấu trúc lấy từ SlideSpeak/presentation-design-prompts (MIT):
 * https://github.com/SlideSpeak/presentation-design-prompts
 * Mỗi pack ở đây là bản rút gọn (luật bố cục + điều cần tránh), không sao chép
 * nguyên văn prompt của họ.
 */
export interface SlideStylePack {
  id: string
  name: string
  description: string
  /** theme gợi ý (id trong DECK_THEMES) */
  themeHint?: string
  rules: string[]
  avoid: string[]
}

export const SLIDE_STYLE_PACKS: SlideStylePack[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Trang báo chí: một luận điểm mỗi slide, tiêu đề nêu thẳng kết luận, một exhibit.',
    themeHint: 'giay-am',
    rules: [
      'Tiêu đề nêu thẳng luận điểm, không chỉ là nhãn chủ đề.',
      'Mỗi slide tối đa một exhibit (bảng, biểu đồ, số liệu) và 2 dòng thân bài.',
      'Nền sáng, một màu nhấn, đường kẻ mảnh; không gradient hay bóng đổ.',
    ],
    avoid: ['bullet dài hơn 3 dòng', 'nhiều màu nhấn', 'trang trí không mang thông tin'],
  },
  {
    id: 'keynote',
    name: 'Keynote',
    description: 'Kiểu TED: chữ rất lớn, một ý mỗi slide, ảnh phủ hoặc nền tối.',
    themeHint: 'dem-xanh',
    rules: [
      'Tiêu đề ≤ 8 từ; thân bài ≤ 1 dòng hoặc bỏ hẳn.',
      'Mỗi slide một ý; dùng statement/quote/image-full để tạo nhịp.',
      'Tương phản mạnh, khoảng trống lớn, không chia nhiều khối.',
    ],
    avoid: ['danh sách dài', 'nhiều khối cùng lúc', 'chữ nhỏ chú thích'],
  },
  {
    id: 'consulting',
    name: 'Consulting',
    description: 'Kiểu MBB: action title, exhibit-first, cấu trúc chặt.',
    themeHint: 'sang',
    rules: [
      'Tiêu đề là kết luận của slide (action title), không phải tên chủ đề.',
      'Exhibit là trung tâm: bảng/biểu đồ chiếm phần lớn, chữ chỉ để chú thích.',
      'Mỗi slide trả lời đúng một câu hỏi; tối đa 3 cấp chữ.',
    ],
    avoid: ['trang trí', 'ảnh minh hoạ chung chung', 'nhiều hơn 3 cấp chữ'],
  },
  {
    id: 'bento',
    name: 'Bento',
    description: 'Lưới ô không đều: một ô lớn, vài ô nhỏ, mỗi ô một ý.',
    themeHint: 'sang',
    rules: [
      'Bố cục ô không đều: 1 ô lớn + 2–4 ô nhỏ, mỗi ô một ý.',
      'Dùng cards/stats/timeline để tạo ô; giữ khoảng thở giữa các ô.',
      'Một màu nhấn, nền sáng, bo góc vừa.',
    ],
    avoid: ['ô đều tăm tắp', 'quá 6 ô', 'nhồi chữ trong một ô'],
  },
  {
    id: 'classroom',
    name: 'Lớp học',
    description: 'Bài giảng: mục tiêu → bước/ví dụ → kiểm tra nhanh.',
    themeHint: 'rung',
    rules: [
      'Mở bằng mục tiêu, giữa là các bước/ví dụ, cuối là kiểm tra nhanh.',
      'Mỗi slide 2–4 ý ngắn, kèm ví dụ cụ thể.',
      'Dùng icon/minh hoạ để neo khái niệm, không trang trí rời.',
    ],
    avoid: ['đoạn văn dài', 'thuật ngữ chưa giải thích', 'quá 4 ý mỗi slide'],
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Tương phản mạnh, số liệu lớn, statement làm điểm nhấn.',
    themeHint: 'do',
    rules: [
      'Tương phản mạnh: nền tối hoặc accent đặc với chữ trắng.',
      'Cứ 2–3 slide có một slide điểm nhấn (số lớn, statement, quote).',
      'Ít chữ, nhiều khoảng trống, một màu nhấn duy nhất.',
    ],
    avoid: ['nhiều màu', 'chi tiết vụn', 'danh sách quá 3 ý'],
  },
]

const STYLE_PACK_IDS = new Set(SLIDE_STYLE_PACKS.map((pack) => pack.id))

export function isStylePackId(value: unknown): value is string {
  return typeof value === 'string' && STYLE_PACK_IDS.has(value)
}

export function stylePackById(id: string | undefined): SlideStylePack | undefined {
  return SLIDE_STYLE_PACKS.find((pack) => pack.id === id)
}

/** Catalog gửi cho model khi lập dàn ý. */
export function stylePackCatalogText(): string {
  return [
    'STYLE PACK (chọn "stylePack" đúng một id):',
    ...SLIDE_STYLE_PACKS.map(
      (pack) =>
        `- ${pack.id}: ${pack.name} — ${pack.description}${pack.themeHint ? ` (gợi ý theme: ${pack.themeHint})` : ''}`,
    ),
  ].join('\n')
}
