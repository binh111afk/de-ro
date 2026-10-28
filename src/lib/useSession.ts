import { useEffect, useState } from 'react'
import { AUTH_EVENT, currentSession, getSession, type Session } from '@/lib/auth'

/** Phiên đăng nhập hiện tại; cập nhật ngay khi đăng nhập hoặc đăng xuất ở nơi khác. */
export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(() => getSession())

  useEffect(() => {
    let alive = true
    const sync = () => {
      currentSession().then((s) => {
        if (alive) setSession(s)
      })
    }
    sync()
    window.addEventListener(AUTH_EVENT, sync)
    return () => {
      alive = false
      window.removeEventListener(AUTH_EVENT, sync)
    }
  }, [])

  return session
}
