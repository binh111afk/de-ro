/** Khi `false`, chỉ tài khoản `admin` mới mở được `/bang-gia` và link điều hướng được ẩn. */
export const PRICING_PUBLIC = false

/** Giá gốc: 1.000đ = 25 điểm (40đ/điểm). */
export const POINTS_PER_1000 = 25
export const MIN_VND = 2_000
export const MAX_VND = 100_000

/**
 * Các gói có sẵn. `bonus` CHỈ áp cho LẦN NẠP ĐẦU TIÊN của đúng gói đó (mỗi gói một lần):
 * nạp gói 5.000đ lần đầu → +5%; nạp gói 5.000đ lần hai → không thưởng; gói 10.000đ chưa nạp lần nào → vẫn +10%.
 * Số tiền tự nhập không phải gói → không có thưởng.
 */
export const PACKS = [
  { vnd: 2_000, bonus: 0 },     //   50 điểm
  { vnd: 5_000, bonus: 0.05 },  //  125 → lần đầu 131
  { vnd: 10_000, bonus: 0.10 }, //  250 → lần đầu 275
  { vnd: 20_000, bonus: 0.15 }, //  500 → lần đầu 575
  { vnd: 50_000, bonus: 0.20 }, // 1250 → lần đầu 1500
] as const

export type PricingPack = (typeof PACKS)[number]

export const DEFAULT_PACK_VND = PACKS.find((p) => p.vnd === 10_000)?.vnd ?? PACKS[0].vnd

/** Ước tính điểm mỗi lượt (số đo thật trong docs/bao-cao-chi-phi-ai.md, làm tròn lên). */
export const USAGE = [
  { id: 'exam', label: 'Soạn 1 đề (vd. Toán THPT, 22 câu)', points: 30 },
  { id: 'slide', label: 'Soạn 1 bộ slide 15 trang', points: 45 },
  { id: 'ask', label: '1 lượt AI hỏi lại trước khi soạn', points: 10 },
  { id: 'edit', label: '1 lượt sửa / hỏi thêm', points: 5 },
  { id: 'search', label: '1 lượt tìm trên web', points: 5 },
  { id: 'image', label: '1 ảnh minh hoạ AI', points: 5 },
] as const

/** Số điểm ứng với một số tiền (không tính thưởng gói). */
export function basePoints(vnd: number): number {
  if (!Number.isFinite(vnd) || vnd <= 0) return 0
  return Math.floor((vnd / 1000) * POINTS_PER_1000 + 1e-9)
}

export const MAX_POINTS = basePoints(MAX_VND)

/** Số điểm nhận được khi chọn một gói (cộng thưởng nếu là lần đầu nạp gói đó). */
export function packPoints(pack: { vnd: number; bonus: number }, firstTime: boolean): number {
  const base = basePoints(pack.vnd)
  if (!firstTime || pack.bonus <= 0) return base
  return Math.floor(base * (1 + pack.bonus) + 1e-9)
}

/** Làm tròn lên bội số 1.000đ và kẹp trong [MIN_VND, MAX_VND]. */
export function clampVnd(vnd: number): number {
  if (!Number.isFinite(vnd) || vnd <= 0) return MIN_VND
  const rounded = Math.ceil(vnd / 1000) * 1000
  return Math.min(MAX_VND, Math.max(MIN_VND, rounded))
}

/** Số tiền nhỏ nhất (bội số 1.000đ) để `basePoints(vnd) >= points`, kẹp trong [MIN_VND, MAX_VND]. */
export function vndFor(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return MIN_VND
  let vnd = Math.ceil(points / POINTS_PER_1000) * 1000
  if (basePoints(vnd) < points) vnd += 1000
  return Math.min(MAX_VND, Math.max(MIN_VND, vnd))
}

/** Số lượt ước tính cho từng loại tác vụ ứng với `points`. */
export function usesFor(points: number): Array<(typeof USAGE)[number] & { count: number }> {
  const safe = Number.isFinite(points) && points > 0 ? points : 0
  return USAGE.map((item) => ({
    ...item,
    count: Math.floor(safe / item.points),
  }))
}

/** Danh sách `vnd` của các gói mà người dùng hiện tại đã từng nạp. */
export async function boughtPacks(): Promise<number[]> {
  // TODO PayOS: đọc từ server (bảng đơn nạp)
  return []
}
