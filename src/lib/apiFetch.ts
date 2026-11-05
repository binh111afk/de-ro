/**
 * fetch tới API của app (`/api/...`), tự gắn token đăng nhập nếu có:
 * server cho người đã đăng nhập hạn mức rộng hơn khách (xem server/guard.ts).
 */
import { currentSession } from './auth'

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const session = await currentSession().catch(() => null)
  const headers = new Headers(init.headers)
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`)
  return fetch(url, { ...init, headers })
}
