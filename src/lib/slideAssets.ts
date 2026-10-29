/**
 * Bộ biểu tượng semantic cho slide — Phosphor Duotone (MIT).
 *
 * Duotone cho mỗi biểu tượng một khối nền nhạt + nét đậm nên dày hơn icon
 * line 1px khi chiếu, và đổi màu theo theme qua `currentColor`.
 * Nguồn: https://github.com/phosphor-icons/react (MIT).
 */
import {
  Atom,
  BookOpen,
  BookOpenText,
  Brain,
  Calculator,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  ClockCounterClockwise,
  Code,
  DeviceMobile,
  Dna,
  Flask,
  Function as FunctionIcon,
  GlobeHemisphereWest,
  Heartbeat,
  Leaf,
  Lightbulb,
  MapTrifold,
  Microscope,
  MusicNotes,
  Palette,
  PencilSimple,
  Scroll,
  Sigma,
  Target,
  TestTube,
  Translate,
  UsersThree,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

export const SLIDE_ASSET_IDS = [
  'book', 'calculator', 'sigma', 'flask', 'microscope', 'atom', 'globe', 'map',
  'history', 'idea', 'chart', 'check', 'target', 'brain', 'pen', 'leaf',
  'literature', 'language', 'code', 'function', 'art', 'music', 'health', 'economy', 'scroll',
  'people', 'phone',
] as const

export type SlideAssetId = (typeof SLIDE_ASSET_IDS)[number]

export const SLIDE_ASSETS: Record<SlideAssetId, { icon: Icon; tags: string[]; group: string }> = {
  book: { icon: BookOpen, group: 'Học tập', tags: ['sách', 'đọc', 'giáo trình', 'tài liệu'] },
  calculator: { icon: Calculator, group: 'Toán', tags: ['toán', 'tính', 'số', 'phép tính', 'nghiệm', 'phân số'] },
  sigma: { icon: Sigma, group: 'Toán', tags: ['toán', 'hàm số', 'đại số', 'công thức', 'nghiệm', 'phương trình'] },
  flask: { icon: Flask, group: 'Khoa học', tags: ['thí nghiệm', 'hoá', 'khoa học', 'phản ứng', 'dung dịch'] },
  microscope: { icon: Microscope, group: 'Khoa học', tags: ['sinh', 'sinh học', 'quan sát', 'khoa học', 'tế bào'] },
  atom: { icon: Atom, group: 'Khoa học', tags: ['lý', 'vật lý', 'nguyên tử', 'khoa học'] },
  globe: { icon: GlobeHemisphereWest, group: 'Lịch sử & địa lý', tags: ['địa', 'địa lý', 'thế giới', 'toàn cầu'] },
  map: { icon: MapTrifold, group: 'Lịch sử & địa lý', tags: ['bản đồ', 'địa lý', 'vị trí', 'lịch sử'] },
  history: { icon: ClockCounterClockwise, group: 'Lịch sử & địa lý', tags: ['sử', 'lịch sử', 'mốc', 'thời gian', 'giờ', 'phút', 'lịch', 'hạn', 'trì hoãn'] },
  idea: { icon: Lightbulb, group: 'Học tập', tags: ['ý tưởng', 'ghi nhớ', 'mẹo', 'khái niệm', 'kế hoạch', 'ưu tiên'] },
  chart: { icon: ChartBar, group: 'Kinh tế & số liệu', tags: ['số liệu', 'biểu đồ', 'thống kê', 'dữ liệu', 'trục', 'tỉ lệ', 'tiến độ'] },
  check: { icon: CheckCircle, group: 'Học tập', tags: ['kiểm tra', 'đáp án', 'đúng', 'bài tập', 'kết quả', 'hoàn thành', 'thói quen'] },
  target: { icon: Target, group: 'Học tập', tags: ['mục tiêu', 'đỉnh', 'giá trị', 'ưu tiên', 'tập trung'] },
  brain: { icon: Brain, group: 'Học tập', tags: ['tư duy', 'phân tích', 'kiến thức', 'học tập', 'tập trung', 'trí nhớ'] },
  pen: { icon: PencilSimple, group: 'Ngữ văn & ngoại ngữ', tags: ['viết', 'ngữ văn', 'ghi chú'] },
  leaf: { icon: Leaf, group: 'Khoa học', tags: ['thực vật', 'sinh thái', 'lá', 'quang hợp'] },
  literature: { icon: BookOpenText, group: 'Ngữ văn & ngoại ngữ', tags: ['văn', 'ngữ văn', 'tác phẩm', 'thơ', 'đọc hiểu'] },
  language: { icon: Translate, group: 'Ngữ văn & ngoại ngữ', tags: ['anh', 'ngoại ngữ', 'tiếng anh', 'dịch', 'ngôn ngữ'] },
  code: { icon: Code, group: 'Tin học & công nghệ', tags: ['tin', 'tin học', 'lập trình', 'code', 'thuật toán'] },
  function: { icon: FunctionIcon, group: 'Toán', tags: ['toán', 'hàm số', 'đồ thị', 'biến thiên'] },
  art: { icon: Palette, group: 'Nghệ thuật & âm nhạc', tags: ['mỹ thuật', 'nghệ thuật', 'màu sắc', 'thiết kế'] },
  music: { icon: MusicNotes, group: 'Nghệ thuật & âm nhạc', tags: ['nhạc', 'âm nhạc', 'ca khúc', 'giai điệu'] },
  health: { icon: Heartbeat, group: 'Con người & sức khoẻ', tags: ['thể dục', 'sức khoẻ', 'y tế', 'sinh lý'] },
  economy: { icon: ChartLineUp, group: 'Kinh tế & số liệu', tags: ['kinh tế', 'tài chính', 'tăng trưởng', 'thị trường'] },
  scroll: { icon: Scroll, group: 'Lịch sử & địa lý', tags: ['sử', 'lịch sử', 'văn bản cổ', 'sự kiện'] },
  people: { icon: UsersThree, group: 'Con người & sức khoẻ', tags: ['bạn bè', 'nhóm', 'cộng đồng', 'người', 'làng'] },
  phone: { icon: DeviceMobile, group: 'Tin học & công nghệ', tags: ['điện thoại', 'mạng xã hội', 'tiktok', 'facebook', 'thông báo', 'màn hình'] },
}

/** Danh sách phụ kiện cho nơi cần icon dạng linh hoạt (không bắt buộc dùng). */
export const SLIDE_ASSET_EXTRAS = { TestTube, Dna }

export function isSlideAssetId(value: unknown): value is SlideAssetId {
  return typeof value === 'string' && value in SLIDE_ASSETS
}

/** Từ khoá ngắn ("anh", "sử", "tin") phải khớp cả từ — tránh "Anh đáp trả" thành tiếng Anh. */
function hasTag(haystack: string, tag: string): boolean {
  if (tag.length > 3) return haystack.includes(tag)
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-zà-ỹ0-9])${escaped}([^a-zà-ỹ0-9]|$)`, 'i').test(haystack)
}

/**
 * Icon khớp nghĩa nhất với `text`, hoặc `undefined` khi không từ khoá nào khớp —
 * không còn icon sách mặc định (slide ba thẻ ba icon sách là rác thị giác).
 * Truyền `used` để một slide không lặp icon: icon đã dùng bị bỏ qua và icon vừa
 * chọn được thêm vào `used`.
 */
export function pickSlideAsset(text: string, used?: Set<SlideAssetId>): SlideAssetId | undefined {
  const haystack = text.toLowerCase()
  let best: SlideAssetId | undefined
  let bestScore = 0
  for (const id of SLIDE_ASSET_IDS) {
    if (used?.has(id)) continue
    const score = SLIDE_ASSETS[id].tags.reduce((sum, tag) => sum + (hasTag(haystack, tag) ? 1 : 0), 0)
    if (score > bestScore) {
      best = id
      bestScore = score
    }
  }
  if (best) used?.add(best)
  return best
}
