/**
 * Ảnh người dùng đưa vào đi lên R2 qua server (`/api/upload`); deck chỉ giữ đường dẫn `/api/files/...`
 * thay vì base64 nặng trong localStorage. Ảnh cũ dạng data URL vẫn chạy bình thường.
 */

/** Đẩy data URL lên R2, trả về đường dẫn. Chuỗi không phải data URL thì giữ nguyên. */
export async function uploadImage(src: string): Promise<string> {
  if (!src.startsWith('data:image/')) return src
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: src }),
  })
  const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !body.url) throw new Error(body.error ?? `Không tải ảnh lên được (${res.status})`)
  return body.url
}

/** Lấy ảnh về dạng data URL (để xuất PPTX/DOCX cần nhúng ảnh vào file). */
export async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) return src
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Không đọc được ảnh (${res.status})`)
  const blob = await res.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
