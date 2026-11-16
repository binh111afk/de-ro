/**
 * Tài liệu tải lên của từng người dùng. Tệp nằm trên R2 (qua `/api/upload`), còn danh sách
 * nằm trong bảng `user_documents` của Supabase. Client chỉ đọc danh sách của mình; thêm và xoá đều qua
 * `/api/upload` (server giữ chỗ hạn mức nguyên tử, xoá cả tệp trên R2).
 */
import { apiFetch } from '@/lib/apiFetch'
import { AuthError, currentSession } from '@/lib/auth'

const BASE = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

export const MAX_DOC_MB = 20

/** Loại tệp nhận được và nhãn hiển thị. */
export const DOC_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

export interface UserDocument {
  id: string
  name: string
  mime: string
  size: number
  url: string
  /** môn học; null với tài liệu tải lên trước khi có cột này */
  subject: string | null
  created_at: string
}

const COLUMNS = 'id,name,mime,size,url,subject,created_at'

export async function rest<T>(
  path: string,
  init: { method?: string; body?: unknown; token: string; prefer?: string },
): Promise<T> {
  const res = await fetch(`${BASE}/rest/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${init.token}`,
      'Content-Type': 'application/json',
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const data = (await res.json().catch(() => null)) as { message?: string } | null
  if (!res.ok) throw new Error(data?.message ?? `Không kết nối được máy chủ (${res.status}).`)
  return data as T
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Không đọc được tệp này.'))
    reader.readAsDataURL(file)
  })
}

/** Danh sách tài liệu của người đang đăng nhập, mới nhất trước. */
export async function listDocuments(): Promise<UserDocument[]> {
  const s = await currentSession()
  if (!s) return []
  return rest<UserDocument[]>(`/user_documents?select=${COLUMNS}&order=created_at.desc`, { token: s.access_token })
}

/** Tải một tệp PDF hoặc DOCX lên R2 rồi ghi một dòng vào danh sách, kèm môn nếu đã chọn. */
export async function uploadDocument(file: File, subject: string | null): Promise<UserDocument> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập để tải tài liệu.')
  if (!DOC_TYPES[file.type]) throw new Error('Chỉ nhận tệp PDF hoặc Word (.docx).')
  if (file.size > MAX_DOC_MB * 1024 * 1024) throw new Error(`Tệp quá lớn (tối đa ${MAX_DOC_MB} MB).`)
  // tài liệu tính vào dung lượng lưu trữ (migration 20261120): kiểm trước khi đẩy tệp lên kho file,
  // để không có tệp nằm trên R2 mà dòng trong danh sách bị từ chối
  const st = await rest<{ used: number; max: number }>('/rpc/my_storage', { method: 'POST', token: s.access_token, body: {} }).catch(() => null)
  if (st && st.used + file.size > st.max) {
    const mb = (n: number) => `${(n / 1048576).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
    throw new Error(`"${file.name}" (${mb(file.size)}) vượt dung lượng còn lại (${mb(Math.max(0, st.max - st.used))} / ${mb(st.max)}). Xoá bớt tệp ở trang Hồ sơ để tải tiếp.`)
  }

  const res = await apiFetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: await readAsDataUrl(file), name: file.name, subject }),
  })
  const data = (await res.json().catch(() => null)) as { url?: string; doc?: UserDocument; error?: string } | null
  if (!res.ok || !data?.url) throw new Error(data?.error ?? `Không tải được tệp (${res.status}).`)
  // máy chủ đã tự ghi dòng danh sách với cỡ tệp thật
  if (!data.doc) throw new Error('Máy chủ chưa ghi được tài liệu vào danh sách, thử lại sau.')
  return data.doc
}

/** Xoá tài liệu: server xoá dòng danh sách và tệp trên R2 (trả lại dung lượng). */
export async function deleteDocument(id: string): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập để xóa tài liệu.')
  const res = await apiFetch(`/api/upload?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `Không xoá được tài liệu (${res.status}).`)
  }
}

/**
 * Mở tài liệu riêng (`/api/files/doc/…`): máy chủ chỉ trả cho chủ tệp nên phải gửi kèm token —
 * tải về rồi mở bản tạm trong tab mới (PDF) hoặc lưu xuống máy (DOCX, giữ đúng tên tệp).
 * Tab được mở ngay lúc bấm để trình duyệt không chặn cửa sổ bật lên.
 */
export async function openDocument(doc: { url: string; name?: string; mime?: string }): Promise<void> {
  const isPdf = (doc.mime ?? doc.url).toLowerCase().includes('pdf')
  const tab = isPdf ? window.open('', '_blank') : null
  try {
    const res = await apiFetch(doc.url)
    if (!res.ok) throw new Error(res.status === 404 ? 'Không tìm thấy tệp hoặc bạn không có quyền mở.' : `Không mở được tệp (${res.status}).`)
    const blobUrl = URL.createObjectURL(await res.blob())
    if (isPdf) {
      if (tab) tab.location.href = blobUrl
      else window.open(blobUrl, '_blank', 'noopener')
    } else {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = doc.name ?? 'tai-lieu.docx'
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}
