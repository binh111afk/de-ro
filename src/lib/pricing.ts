/** Khi `false`, chỉ tài khoản `admin` mới mở được `/bang-gia` và link điều hướng được ẩn. */
export const PRICING_PUBLIC = true

/** Bảng giá admin sửa được (`app_settings` key `pricing`); giá trị dưới đây là mặc định khi chưa có. */
export interface PricingConfig {
  /** số điểm cho mỗi 1.000đ */
  pointsPer1000: number
  minVnd: number
  maxVnd: number
  /** `bonus` CHỈ áp cho LẦN NẠP ĐẦU TIÊN của đúng gói đó (mỗi gói một lần); số tiền tự nhập không có thưởng. */
  packs: Array<{ vnd: number; bonus: number }>
  /** gói chọn sẵn khi mở trang */
  defaultVnd: number
}

export const DEFAULT_PRICING: PricingConfig = {
  pointsPer1000: 25,
  minVnd: 2_000,
  maxVnd: 100_000,
  packs: [
    { vnd: 2_000, bonus: 0 },
    { vnd: 5_000, bonus: 0.05 },
    { vnd: 10_000, bonus: 0.1 },
    { vnd: 20_000, bonus: 0.15 },
    { vnd: 50_000, bonus: 0.2 },
  ],
  defaultVnd: 10_000,
}

// các biến dưới đây là binding sống: `applyPricing` đổi thì mọi nơi import đọc giá trị mới
export let POINTS_PER_1000 = DEFAULT_PRICING.pointsPer1000
export let MIN_VND = DEFAULT_PRICING.minVnd
export let MAX_VND = DEFAULT_PRICING.maxVnd
export let PACKS: ReadonlyArray<{ vnd: number; bonus: number }> = DEFAULT_PRICING.packs
export let DEFAULT_PACK_VND = DEFAULT_PRICING.defaultVnd
export let MAX_POINTS = 0

export type PricingPack = { vnd: number; bonus: number }

export function applyPricing(c: PricingConfig) {
  POINTS_PER_1000 = c.pointsPer1000
  MIN_VND = c.minVnd
  MAX_VND = c.maxVnd
  PACKS = [...c.packs].sort((a, b) => a.vnd - b.vnd)
  DEFAULT_PACK_VND = PACKS.find((p) => p.vnd === c.defaultVnd)?.vnd ?? PACKS[0]?.vnd ?? MIN_VND
  MAX_POINTS = basePoints(MAX_VND)
}

let loading: Promise<void> | null = null
/** Đọc bảng giá admin đã lưu (một lần mỗi phiên); lỗi hoặc chưa có thì giữ mặc định. */
export function loadPricing(): Promise<void> {
  // file này server (server/payment.ts) cũng import để tính điểm: chỉ đọc import.meta.env khi gọi trên trình duyệt
  const env = (import.meta as unknown as { env: Record<string, string> }).env
  loading ??= fetch(`${env.VITE_SUPABASE_URL}/rest/v1/app_settings?select=value&key=eq.pricing`, {
    headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
  })
    .then((r) => (r.ok ? (r.json() as Promise<Array<{ value?: Partial<PricingConfig> }>>) : []))
    .then((rows) => {
      const v = rows[0]?.value
      if (v && Array.isArray(v.packs) && v.packs.length > 0) applyPricing({ ...DEFAULT_PRICING, ...v } as PricingConfig)
    })
    .catch(() => {})
  return loading
}

/** Ước tính điểm mỗi lượt — phải khớp Điều khoản sử dụng mục 5 (src/pages/Legal.tsx). */
export const USAGE = [
  { id: 'exam', label: 'Soạn 1 đề (vd. Toán THPT, 22 câu)', points: 20 },
  { id: 'slide', label: 'Soạn 1 bộ slide 15 trang', points: 26 },
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

MAX_POINTS = basePoints(MAX_VND)

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
