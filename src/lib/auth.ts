/**
 * Đăng nhập qua Supabase Auth (REST, không cần SDK).
 * Khoá publishable là khoá công khai, an toàn đưa vào bundle; không dùng service-role ở client.
 */

const BASE = import.meta.env.VITE_SUPABASE_URL as string
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
const STORE = 'dethinhbien-auth'

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: { id: string; email: string; name?: string; avatar?: string }
}

export class AuthError extends Error {}

/** Phiên lưu trong localStorage của trình duyệt — chỉ để nhớ đăng nhập, không phải nguồn sự thật. */
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

/** Sự kiện để header và các nơi khác cập nhật khi đăng nhập / đăng xuất. */
export const AUTH_EVENT = 'dethinhbien-auth'

function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s))
    else localStorage.removeItem(STORE)
  } catch {
    // trình duyệt chặn localStorage: vẫn chạy được, chỉ không nhớ phiên
  }
  window.dispatchEvent(new Event(AUTH_EVENT))
}

async function request<T>(path: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const res = await fetch(`${BASE}/auth/v1${path}`, {
    method: init.method ?? 'POST',
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new AuthError(toVietnamese(data, res.status))
  return data as T
}

/** Supabase trả lỗi tiếng Anh; đổi các lỗi người dùng hay gặp sang tiếng Việt. */
function toVietnamese(data: Record<string, unknown>, status: number): string {
  const raw = String(data.error_description ?? data.msg ?? data.message ?? data.error ?? '')
  if (/invalid login credentials/i.test(raw)) return 'Email hoặc mật khẩu chưa đúng.'
  if (/already registered|already been registered|user already exists/i.test(raw)) return 'Email này đã có tài khoản.'
  if (/email not confirmed/i.test(raw)) return 'Bạn cần xác nhận email trước khi đăng nhập.'
  if (/password.*(at least|least|6|characters)/i.test(raw)) return 'Mật khẩu cần ít nhất 8 ký tự.'
  if (/rate limit|too many|over_email_send_rate_limit/i.test(raw)) return 'Gửi quá nhiều lần, thử lại sau ít phút.'
  if (/invalid email/i.test(raw)) return 'Email không hợp lệ.'
  if (status === 0 || status >= 500) return 'Không kết nối được máy chủ, thử lại sau.'
  return raw || 'Có lỗi xảy ra, thử lại sau.'
}

type RawUser = { id: string; email: string; user_metadata?: { display_name?: string; avatar_url?: string } }

function toUser(u: RawUser): Session['user'] {
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.display_name || undefined,
    avatar: u.user_metadata?.avatar_url || undefined,
  }
}

function toSession(data: Record<string, unknown>): Session {
  const user = data.user as RawUser
  return {
    access_token: String(data.access_token),
    refresh_token: String(data.refresh_token),
    expires_at: Number(data.expires_at ?? Math.floor(Date.now() / 1000) + Number(data.expires_in ?? 3600)),
    user: toUser(user),
  }
}

/** Đăng ký. Trả về `true` nếu cần xác nhận email (chưa có phiên). */
export async function signUp(email: string, password: string, name: string): Promise<{ needsConfirm: boolean }> {
  const data = await request<Record<string, unknown>>('/signup', {
    body: { email, password, data: { display_name: name } },
  })
  if (data.access_token) {
    saveSession(toSession(data))
    return { needsConfirm: false }
  }
  return { needsConfirm: true }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const data = await request<Record<string, unknown>>('/token?grant_type=password', { body: { email, password } })
  const s = toSession(data)
  saveSession(s)
  return s
}

export async function signOut(): Promise<void> {
  const s = getSession()
  saveSession(null)
  if (s) await request('/logout', { token: s.access_token }).catch(() => {})
}

/** Đổi tên hiển thị và/hoặc ảnh đại diện (lưu trong user_metadata, Supabase gộp các trường). */
export async function updateProfile(patch: { name?: string; avatar?: string }): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập lại.')
  const data: Record<string, string> = {}
  if (patch.name !== undefined) data.display_name = patch.name
  if (patch.avatar !== undefined) data.avatar_url = patch.avatar
  const user = await request<RawUser>('/user', { method: 'PUT', token: s.access_token, body: { data } })
  saveSession({ ...s, user: toUser(user) })
}

/** Gửi email đặt lại mật khẩu. Luôn báo thành công để không lộ email nào đã có tài khoản. */
export async function requestReset(email: string): Promise<void> {
  const redirect = `${window.location.origin}/dat-lai-mat-khau`
  await request(`/recover?redirect_to=${encodeURIComponent(redirect)}`, { body: { email } })
}

/** Đặt mật khẩu mới bằng token trong link email (nằm ở hash của URL). */
export async function setNewPassword(accessToken: string, password: string): Promise<void> {
  await request('/user', { method: 'PUT', token: accessToken, body: { password } })
}

/**
 * Supabase đưa phiên về trang web qua hash sau khi xác nhận email hoặc đăng nhập bằng link.
 * Nhận và lưu luôn để người dùng vào web là đã đăng nhập. Link đặt lại mật khẩu thì để trang
 * `/dat-lai-mat-khau` tự đọc (trả về `recovery`, không xoá hash).
 */
export async function consumeAuthRedirect(): Promise<'recovery' | 'session' | null> {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const access = hash.get('access_token')
  const refresh = hash.get('refresh_token')
  if (!access || !refresh) return null
  if (hash.get('type') === 'recovery') return 'recovery'

  const res = await fetch(`${BASE}/auth/v1/user`, {
    headers: { apikey: KEY, Authorization: `Bearer ${access}` },
  })
  if (!res.ok) return null
  const user = (await res.json()) as RawUser
  const expiresIn = Number(hash.get('expires_in') ?? 3600)
  saveSession({
    access_token: access,
    refresh_token: refresh,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: toUser(user),
  })
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
  return 'session'
}

/** Phiên còn hiệu lực; tự làm mới bằng refresh token khi sắp hết hạn. */
export async function currentSession(): Promise<Session | null> {
  const s = getSession()
  if (!s) return null
  if (s.expires_at - 60 > Date.now() / 1000) return s
  try {
    const data = await request<Record<string, unknown>>('/token?grant_type=refresh_token', {
      body: { refresh_token: s.refresh_token },
    })
    const next = toSession(data)
    saveSession(next)
    return next
  } catch {
    saveSession(null)
    return null
  }
}
