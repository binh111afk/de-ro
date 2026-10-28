/**
 * Tài liệu tải lên của từng người dùng. Tệp nằm trên R2 (qua `/api/upload`), còn danh sách
 * nằm trong bảng `user_documents` của Supabase. RLS: chỉ chủ tài liệu đọc, thêm và xóa được.
 */
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

async function rest<T>(
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

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: await readAsDataUrl(file) }),
  })
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
  if (!res.ok || !data?.url) throw new Error(data?.error ?? `Không tải được tệp (${res.status}).`)

  const [row] = await rest<UserDocument[]>(`/user_documents?select=${COLUMNS}`, {
    method: 'POST',
    token: s.access_token,
    prefer: 'return=representation',
    body: { name: file.name, mime: file.type, size: file.size, url: data.url, subject },
  })
  return row
}

/** Xóa dòng trong danh sách. Tệp trên R2 vẫn còn; chưa có endpoint xóa tệp. */
export async function deleteDocument(id: string): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập để xóa tài liệu.')
  await rest<null>(`/user_documents?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token: s.access_token })
}
