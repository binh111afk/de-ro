/**
 * Tạo ảnh minh hoạ cho slide qua `/api/image` (server giữ key Xkiro).
 *
 * Server trả data URL; ảnh được thu nhỏ về tối đa 1280px và nén JPEG trước khi
 * lưu vào deck — PNG 1024² của model nặng ~1,2 MB, JPEG cùng cỡ ~150 KB nên
 * localStorage không bị đầy sau vài ảnh.
 */

const MAX_EDGE = 1280
const JPEG_QUALITY = 0.85

export interface GeneratedImage {
  dataUrl: string
  model?: string
}

export type ImageOrientation = 'portrait' | 'landscape' | 'square'

/** Prompt tiếng Việt bám nội dung slide; model không vẽ chữ trong ảnh. */
export function buildImagePrompt(
  title?: string,
  bullets?: string[],
  orientation: ImageOrientation = 'portrait',
  /** màu nhấn của theme (hex) để ảnh ăn với bảng màu slide */
  accent?: string,
): string {
  const points = (bullets ?? [])
    .map((bullet) => bullet.trim())
    .filter(Boolean)
    .slice(0, 3)
  const topic = [title?.trim(), ...points].filter(Boolean).join('; ')
  const layout =
    orientation === 'portrait'
      ? 'bố cục dọc, chủ thể ở giữa'
      : orientation === 'square'
        ? 'bố cục vuông, một chủ thể ở giữa trên nền đơn giản (sẽ được cắt tròn)'
        : 'bố cục ngang'
  const palette = accent ? `, tông màu chủ đạo ${accent}` : ''
  return (
    `Minh hoạ giáo dục chuyên nghiệp cho slide: ${topic || 'bài học'}. ` +
    `Phong cách editorial hiện đại, hình khối rõ, tương phản vừa mạnh, màu theo bài giảng${palette}, ` +
    `một chủ thể chính dễ nhận biết, có khoảng thở cho phần chữ, ${layout}, không có chữ, ` +
    `không watermark, không logo, không bố cục trống.`
  )
}

/** Thu nhỏ + nén; lỗi canvas thì giữ nguyên ảnh gốc. */
async function shrink(dataUrl: string): Promise<string> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return dataUrl
  // JPEG không có alpha — tô trắng để ảnh không bị nền đen.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}

export async function generateSlideImage(prompt: string): Promise<GeneratedImage> {
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const body = (await res.json().catch(() => ({}))) as { dataUrl?: string; model?: string; error?: string }
  if (!res.ok) throw new Error(body.error ?? `Tạo ảnh thất bại (${res.status})`)
  const dataUrl = body.dataUrl ?? ''
  if (!dataUrl.startsWith('data:image/')) throw new Error('Máy chủ không trả về ảnh hợp lệ')
  try {
    return { dataUrl: await shrink(dataUrl), model: body.model }
  } catch {
    return { dataUrl, model: body.model }
  }
}

/** Layout được nâng cấp bằng ảnh AI sau khi slide đã hiện (bìa luôn có; layout ảnh nếu có chỗ). */
export const IMAGE_LAYOUTS = ['title', 'image-left', 'image-right', 'image-full', 'stat-image']

const MAX_PARALLEL_IMAGES = 2
let running = 0
const waiting: Array<() => void> = []

/**
 * Chạy tác vụ tạo ảnh với tối đa 2 ảnh song song — mỗi ảnh 45–90 giây nên deck 10
 * slide không được bắn cùng lúc nhiều lời gọi vào provider.
 */
export async function queueImage<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL_IMAGES) await new Promise<void>((resolve) => waiting.push(resolve))
  running++
  try {
    return await task()
  } finally {
    running--
    waiting.shift()?.()
  }
}
