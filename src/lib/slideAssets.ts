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
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

export const SLIDE_ASSET_IDS = [
  'book', 'calculator', 'sigma', 'flask', 'microscope', 'atom', 'globe', 'map',
  'history', 'idea', 'chart', 'check', 'target', 'brain', 'pen', 'leaf',
  'literature', 'language', 'code', 'function', 'art', 'music', 'health', 'economy', 'scroll',
] as const

export type SlideAssetId = (typeof SLIDE_ASSET_IDS)[number]

export const SLIDE_ASSETS: Record<SlideAssetId, { icon: Icon; tags: string[] }> = {
  book: { icon: BookOpen, tags: ['sách', 'đọc', 'văn', 'bài học', 'nội dung'] },
  calculator: { icon: Calculator, tags: ['toán', 'tính', 'số', 'phép tính', 'nghiệm', 'phân số'] },
  sigma: { icon: Sigma, tags: ['toán', 'hàm số', 'đại số', 'công thức', 'nghiệm', 'phương trình'] },
  flask: { icon: Flask, tags: ['thí nghiệm', 'hoá', 'khoa học', 'phản ứng', 'dung dịch'] },
  microscope: { icon: Microscope, tags: ['sinh', 'sinh học', 'quan sát', 'khoa học', 'tế bào'] },
  atom: { icon: Atom, tags: ['lý', 'vật lý', 'nguyên tử', 'khoa học'] },
  globe: { icon: GlobeHemisphereWest, tags: ['địa', 'địa lý', 'thế giới', 'toàn cầu'] },
  map: { icon: MapTrifold, tags: ['bản đồ', 'địa lý', 'vị trí', 'lịch sử'] },
  history: { icon: ClockCounterClockwise, tags: ['sử', 'lịch sử', 'mốc', 'thời gian'] },
  idea: { icon: Lightbulb, tags: ['ý tưởng', 'ghi nhớ', 'mẹo', 'khái niệm'] },
  chart: { icon: ChartBar, tags: ['số liệu', 'biểu đồ', 'thống kê', 'dữ liệu', 'trục', 'tỉ lệ'] },
  check: { icon: CheckCircle, tags: ['kiểm tra', 'đáp án', 'đúng', 'bài tập', 'kết quả'] },
  target: { icon: Target, tags: ['mục tiêu', 'kết quả', 'bài học', 'đỉnh', 'giá trị'] },
  brain: { icon: Brain, tags: ['tư duy', 'phân tích', 'kiến thức'] },
  pen: { icon: PencilSimple, tags: ['viết', 'ngữ văn', 'ghi chú'] },
  leaf: { icon: Leaf, tags: ['thực vật', 'sinh thái', 'lá', 'quang hợp'] },
  literature: { icon: BookOpenText, tags: ['văn', 'ngữ văn', 'tác phẩm', 'thơ', 'đọc hiểu'] },
  language: { icon: Translate, tags: ['anh', 'ngoại ngữ', 'tiếng anh', 'dịch', 'ngôn ngữ'] },
  code: { icon: Code, tags: ['tin', 'tin học', 'lập trình', 'code', 'thuật toán'] },
  function: { icon: FunctionIcon, tags: ['toán', 'hàm số', 'đồ thị', 'biến thiên'] },
  art: { icon: Palette, tags: ['mỹ thuật', 'nghệ thuật', 'màu sắc', 'thiết kế'] },
  music: { icon: MusicNotes, tags: ['nhạc', 'âm nhạc', 'ca khúc', 'giai điệu'] },
  health: { icon: Heartbeat, tags: ['thể dục', 'sức khoẻ', 'y tế', 'sinh lý'] },
  economy: { icon: ChartLineUp, tags: ['kinh tế', 'tài chính', 'tăng trưởng', 'thị trường'] },
  scroll: { icon: Scroll, tags: ['sử', 'lịch sử', 'văn bản cổ', 'sự kiện'] },
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

export function pickSlideAsset(text: string): SlideAssetId {
  const haystack = text.toLowerCase()
  let best: SlideAssetId = 'book'
  let bestScore = 0
  for (const id of SLIDE_ASSET_IDS) {
    const score = SLIDE_ASSETS[id].tags.reduce((sum, tag) => sum + (hasTag(haystack, tag) ? 1 : 0), 0)
    if (score > bestScore) {
      best = id
      bestScore = score
    }
  }
  return best
}
