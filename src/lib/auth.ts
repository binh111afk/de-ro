/**
 * Đăng nhập qua Supabase Auth (REST, không cần SDK).
 * Khoá publishable là khoá công khai, an toàn đưa vào bundle; không dùng service-role ở client.
 */

const BASE = import.meta.env?.VITE_SUPABASE_URL as string // ?. để script Node (test) nạp được file này
const KEY = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string
const STORE = 'dethinhbien-auth'

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: { id: string; email: string; name?: string; avatar?: string; created_at?: string }
}

export class AuthError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
  }
}

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

async function request<T>(path: string, init: { method?: string; body?: unknown; token?: string; keepalive?: boolean } = {}): Promise<T> {
  const res = await fetch(`${BASE}/auth/v1${path}`, {
    method: init.method ?? 'POST',
    keepalive: init.keepalive,
    headers: {
      apikey: KEY,
      'Content-Type': 'application/json',
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new AuthError(toVietnamese(data, res.status), res.status)
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

type RawUser = { id: string; email: string; created_at?: string; user_metadata?: { display_name?: string; full_name?: string; name?: string; avatar_url?: string; picture?: string } }

function toUser(u: RawUser): Session['user'] {
  return {
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || undefined,
    avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined,
  }
}

/** Phiên đã lưu trước khi có created_at cần đọc lại ngày tạo từ Supabase. */
export async function getAccountCreatedAt(userId: string): Promise<string | undefined> {
  const session = await currentSession()
  if (session?.user.id !== userId) return
  if (session.user.created_at) return session.user.created_at
  const user = await request<RawUser>('/user', { method: 'GET', token: session.access_token })
  if (user.id === userId) return user.created_at
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

/**
 * Đăng nhập bằng Google: chuyển sang trang uỷ quyền của Supabase (luồng implicit).
 * Google xong sẽ quay về `<origin>/#access_token=…`, `consumeAuthRedirect()` ở App nhận và lưu phiên.
 */
const AUTH_FLOW_KEY = 'dethinhbien-auth-flow'

export function signInWithGoogle(): void {
  // nonce của luồng do CHÍNH tab này bắt đầu: link lạ kèm token người khác không gài được phiên (login CSRF)
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
  try {
    sessionStorage.setItem(AUTH_FLOW_KEY, nonce)
  } catch {
    return
  }
  const redirect = `${window.location.origin}/?auth_flow=${nonce}`
  window.location.assign(`${BASE}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`)
}

/** Đăng ký. Trả về `true` nếu cần xác nhận email (chưa có phiên). */
export async function signUp(email: string, password: string, name: string, captchaToken?: string): Promise<{ needsConfirm: boolean }> {
  const data = await request<Record<string, unknown>>('/signup', {
    body: { email, password, data: { display_name: name }, ...captcha(captchaToken) },
  })
  // Email đã có tài khoản (kể cả tài khoản tạo bằng Google): Supabase không tạo mới mà trả user giả
  // với `identities: []`. Báo trùng để không ai tưởng đăng ký được thêm tài khoản (và thêm điểm AI).
  const user = (data.user ?? data) as { identities?: unknown[] }
  if (Array.isArray(user.identities) && user.identities.length === 0) {
    throw new AuthError('Email này đã có tài khoản (có thể đã đăng nhập bằng Google). Hãy đăng nhập thay vì đăng ký.')
  }
  if (data.access_token) {
    saveSession(toSession(data))
    return { needsConfirm: false }
  }
  return { needsConfirm: true }
}

/** Mã Turnstile (khi Supabase bật CAPTCHA, đăng ký / đăng nhập / quên mật khẩu đều phải kèm). */
const captcha = (token?: string) => (token ? { gotrue_meta_security: { captcha_token: token } } : {})

export async function signIn(email: string, password: string, captchaToken?: string): Promise<Session> {
  const data = await request<Record<string, unknown>>('/token?grant_type=password', { body: { email, password, ...captcha(captchaToken) } })
  const s = toSession(data)
  saveSession(s)
  return s
}

let signingOut: Promise<void> | undefined

export function signOut(): Promise<void> {
  return (signingOut ??= finishSignOut().finally(() => { signingOut = undefined }))
}

async function finishSignOut(): Promise<void> {
  const session = getSession()
  const [{ flushSync, stopSync }, { useComposeStore }, { pendingBoardSaves }, { purgeUserData, DISCARD_USER_VIEW }] = await Promise.all([
    import('@/lib/sync'), import('@/store/compose'), import('@/store/boards'), import('@/lib/localData'),
  ])
  const compose = useComposeStore.getState()
  if (session) {
    let ok = false
    try {
      // Tab đang mở có thể chưa đến lượt tự lưu, nên ghi vào store trước khi đẩy.
      for (const tab of compose.tabs) if (tab.dirty) compose.saveTab(tab.id)
      const flushed = await flushSync()
      ok = flushed.ok && !useComposeStore.getState().tabs.some((tab) => tab.dirty)
    } catch {
      // Lưu trên máy cũng có thể lỗi khi trình duyệt hết chỗ.
    }
    if (!ok) {
      const { dialog } = await import('@/components/Dialog')
      if (!(await dialog.confirm('Còn mục chưa đồng bộ lên tài khoản, đăng xuất sẽ xoá khỏi máy này. Vẫn đăng xuất?', {
        cancelLabel: 'Huỷ', confirmLabel: 'Vẫn đăng xuất', danger: true,
      }))) return
    }
  }
  const current = getSession()
  if (current && current.user.id !== session?.user.id) return

  stopSync()
  pendingBoardSaves.clear()
  useComposeStore.setState(useComposeStore.getInitialState(), true)
  // Tháo giao diện trước khi dọn để huỷ hiệu ứng và tránh tự lưu lại khi reload.
  window.dispatchEvent(new Event(DISCARD_USER_VIEW))
  saveSession(null)
  const token = current?.access_token ?? session?.access_token
  if (token) void request('/logout', { token, keepalive: true }).catch(() => {})
  try {
    await purgeUserData()
  } catch (err) {
    console.warn('Không dọn được ảnh bảng vẽ', err)
  }
  window.location.reload()
}

/** Đổi tên hiển thị và/hoặc ảnh đại diện (lưu trong user_metadata, Supabase gộp các trường). */
export async function updateProfile(patch: { name?: string; avatar?: string }): Promise<void> {
  const s = await currentSession()
  if (!s) throw new AuthError('Bạn cần đăng nhập lại.')
  const data: Record<string, string> = {}
  if (patch.name !== undefined) data.display_name = patch.name
  if (patch.avatar !== undefined) data.avatar_url = patch.avatar
  const user = await request<RawUser>('/user', { method: 'PUT', token: s.access_token, body: { data } })
  const current = getSession()
  if (current?.user.id === s.user.id) saveSession({ ...current, user: toUser(user) })
}

/** Gửi email đặt lại mật khẩu. Luôn báo thành công để không lộ email nào đã có tài khoản. */
export async function requestReset(email: string, captchaToken?: string): Promise<void> {
  const redirect = `${window.location.origin}/dat-lai-mat-khau`
  await request(`/recover?redirect_to=${encodeURIComponent(redirect)}`, { body: { email, ...captcha(captchaToken) } })
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

  const params = new URLSearchParams(window.location.search)
  const expected = params.get('auth_flow')
  let started = false
  try {
    started = !!expected && sessionStorage.getItem(AUTH_FLOW_KEY) === expected
    sessionStorage.removeItem(AUTH_FLOW_KEY)
  } catch {
    started = false
  }
  params.delete('auth_flow')
  const cleanUrl = window.location.pathname + (params.size ? `?${params}` : '')
  if (!started) {
    window.history.replaceState(null, '', cleanUrl)
    return null
  }

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
  const back = takeReturnPath()
  if (back) window.location.replace(back)
  else window.history.replaceState(null, '', cleanUrl)
  return 'session'
}

const RETURN_KEY = 'dethinhbien-return'
/** Nhớ trang cần quay lại sau khi đăng nhập (vd link đề "chỉ làm một lần"). Chỉ nhận đường dẫn nội bộ. */
export function rememberReturnPath(path: string): void {
  try {
    if (/^\/(?![/\\])/.test(path)) sessionStorage.setItem(RETURN_KEY, path)
  } catch {
    /* không nhớ được thì về trang chủ */
  }
}
/** Lấy (và xoá) trang cần quay lại; null nếu không có. */
export function takeReturnPath(): string | null {
  try {
    const p = sessionStorage.getItem(RETURN_KEY)
    sessionStorage.removeItem(RETURN_KEY)
    return p && /^\/(?![/\\])/.test(p) ? p : null
  } catch {
    return null
  }
}

/** Phiên còn hiệu lực; tự làm mới bằng refresh token khi sắp hết hạn. */
let refreshing: { token: string; result: Promise<Session> } | undefined

export async function currentSession({ keepOnError = false } = {}): Promise<Session | null> {
  const s = getSession()
  if (!s) return null
  if (s.expires_at - 60 > Date.now() / 1000) return s
  if (refreshing?.token !== s.refresh_token) {
    const token = s.refresh_token
    const result = request<Record<string, unknown>>('/token?grant_type=refresh_token', {
      body: { refresh_token: token },
    }).then(toSession).finally(() => {
      if (refreshing?.result === result) refreshing = undefined
    })
    refreshing = { token, result }
  }
  try {
    const next = await refreshing.result
    const current = getSession()
    // Lượt refresh đang chờ có thể về sau khi đã đăng xuất hoặc đổi tài khoản.
    if (current?.refresh_token !== s.refresh_token) return current?.user.id === s.user.id ? current : null
    saveSession(next)
    return next
  } catch (e) {
    // Chỉ bỏ phiên khi máy chủ từ chối refresh token. Mất mạng, lỗi 5xx, 429 thì giữ phiên để lần sau thử lại.
    const rejected = e instanceof AuthError && (e.status === 400 || e.status === 401 || e.status === 403 || e.status === 422)
    if (rejected && !keepOnError && getSession()?.refresh_token === s.refresh_token) saveSession(null)
    return null
  }
}
