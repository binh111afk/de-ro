import type { Question } from '@/data/types'
import { uploadImage } from './mediaStore'

const MAX_SIDE = 1280
/** ảnh nhỏ giữ nguyên, ảnh lớn thu về tối đa 1280px rồi nén JPEG (đề lưu trong máy, localStorage có hạn) */
const KEEP_BYTES = 300 * 1024

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error ?? new Error('Không đọc được ảnh.'))
    r.readAsDataURL(file)
  })

async function shrink(dataUrl: string): Promise<string> {
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Không mở được ảnh này.'))
    img.src = dataUrl
  })
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * Ảnh người dùng chọn/dán → chuỗi `src` lưu trong câu hỏi: thu nhỏ nếu lớn, rồi đưa lên R2 (đường dẫn ngắn);
 * chưa cấu hình R2 hay lỗi mạng thì giữ data URL.
 */
export async function imageToSrc(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Chỉ nhận tệp ảnh.')
  let dataUrl = await readAsDataUrl(file)
  const plain = /^image\/(png|jpeg|gif)$/.test(file.type)
  if (!plain || file.size > KEEP_BYTES) dataUrl = await shrink(dataUrl)
  try {
    return await uploadImage(dataUrl)
  } catch {
    return dataUrl
  }
}

/** Ảnh đang nằm trong clipboard của sự kiện dán (chụp màn hình rồi Ctrl+V), nếu có. */
export const pastedImage = (e: { clipboardData: DataTransfer | null }): File | null =>
  [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/')) ?? null

/**
 * Câu hỏi nhập từ file có ảnh dạng data URL: đưa lên R2 (mỗi ảnh một lần, tối đa 4 ảnh cùng lúc) để đề lưu trong máy không phình;
 * chưa cấu hình R2 hay lỗi thì giữ data URL.
 */
export async function uploadQuestionImages(questions: Question[]): Promise<Question[]> {
  const todo = [...new Set(questions.map((q) => q.image?.src).filter((s): s is string => Boolean(s?.startsWith('data:'))))]
  const done = new Map<string, string>()
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(4, todo.length) }, async () => {
      while (next < todo.length) {
        const src = todo[next++]
        done.set(src, await uploadImage(src).catch(() => src))
      }
    }),
  )
  return questions.map((q) => (q.image && done.has(q.image.src) ? { ...q, image: { ...q.image, src: done.get(q.image.src)! } } : q))
}
