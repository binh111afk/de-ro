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
  // SVG không khai báo kích thước thì một số trình duyệt báo 0
  if (!img.naturalWidth || !img.naturalHeight) throw new Error('Ảnh SVG cần có width và height.')
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
const DATA_IMG_MD = /!\[([^\]\n]*)\]\((data:image\/[^)\s]+)\)/g

export async function uploadQuestionImages(questions: Question[]): Promise<Question[]> {
  const todo = new Set<string>()
  const collectMd = (s: string) => {
    for (const m of s.matchAll(DATA_IMG_MD)) todo.add(m[2])
  }
  for (const q of questions) {
    if (q.image?.src?.startsWith('data:')) todo.add(q.image.src)
    collectMd(q.prompt)
    for (const o of q.options ?? []) collectMd(o.text)
  }
  const list = [...todo]
  const done = new Map<string, string>()
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(4, list.length) }, async () => {
      while (next < list.length) {
        const src = list[next++]
        done.set(src, await uploadImage(src).catch(() => src))
      }
    }),
  )
  const replaceMd = (s: string) =>
    s.includes('data:image/')
      ? s.replace(DATA_IMG_MD, (full, alt: string, src: string) => (done.has(src) ? `![${alt}](${done.get(src)!})` : full))
      : s
  return questions.map((q) => ({
    ...q,
    prompt: replaceMd(q.prompt),
    ...(q.options ? { options: q.options.map((o) => ({ ...o, text: replaceMd(o.text) })) } : {}),
    ...(q.image && done.has(q.image.src) ? { image: { ...q.image, src: done.get(q.image.src)! } } : {}),
  }))
}
