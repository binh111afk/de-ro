import { useEffect, useRef } from 'react'

/** Khoá site của Cloudflare Turnstile; không đặt thì không hiện CAPTCHA (Supabase cũng phải để tắt). */
export const TURNSTILE_SITE_KEY = (import.meta.env?.VITE_TURNSTILE_SITE_KEY as string | undefined) || ''

type Api = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}
declare global {
  interface Window {
    turnstile?: Api
  }
}

let loading: Promise<Api> | undefined
function loadTurnstile(): Promise<Api> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  return (loading ??= new Promise<Api>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
    s.onerror = () => {
      loading = undefined
      reject(new Error('turnstile'))
    }
    document.head.appendChild(s)
  }))
}

/**
 * Ô xác minh Turnstile. `onToken(null)` khi mã hết hạn / lỗi; đổi `resetKey` để lấy mã mới
 * (mã chỉ dùng được một lần, sau mỗi lần gửi form phải đặt lại).
 */
export function Turnstile({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const host = useRef<HTMLDivElement>(null)
  const id = useRef<string | undefined>(undefined)
  const cb = useRef(onToken)
  cb.current = onToken

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let dead = false
    loadTurnstile()
      .then((api) => {
        if (dead || !host.current) return
        id.current = api.render(host.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: 'vi',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(null),
          'error-callback': () => cb.current(null),
        })
      })
      .catch(() => cb.current(null))
    return () => {
      dead = true
      if (id.current) window.turnstile?.remove(id.current)
      id.current = undefined
    }
  }, [])

  useEffect(() => {
    if (resetKey && id.current) {
      cb.current(null)
      window.turnstile?.reset(id.current)
    }
  }, [resetKey])

  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={host} className="min-h-[65px]" />
}
