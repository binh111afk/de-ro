/**
 * Nhịp "đang online" phía người dùng:
 * Khi đã đăng nhập và tab đang hiện (document.visibilityState === 'visible'),
 * mỗi 60 giây upsert `presence` lên Supabase REST với token người dùng.
 * Không gửi khi tab ẩn, lỗi thì im lặng.
 */
import { currentSession } from '@/lib/auth'

const BASE = ((import.meta.env?.VITE_SUPABASE_URL as string) ?? '').replace(/\/+$/, '')
const KEY = (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ?? ''

export async function pingPresence(): Promise<void> {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return
  }
  try {
    const session = await currentSession()
    if (!session || !session.user?.id || !session.access_token || !BASE || !KEY) {
      return
    }

    await fetch(`${BASE}/rest/v1/presence`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: session.user.id,
        last_seen: new Date().toISOString(),
      }),
    })
  } catch {
    // Lỗi thì im lặng
  }
}

/**
 * Bật nhịp online cho phiên người dùng hiện tại; trả về hàm huỷ.
 */
export function startPresence(): () => void {
  void pingPresence()

  const timer = setInterval(() => {
    void pingPresence()
  }, 60_000)

  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      void pingPresence()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  return () => {
    clearInterval(timer)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}
