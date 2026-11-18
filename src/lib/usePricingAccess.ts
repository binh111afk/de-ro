/** Ai được thấy trang Bảng giá / nút Nạp điểm: mọi người khi PRICING_PUBLIC, không thì chỉ admin (server cũng chặn tạo đơn). */
import { useEffect, useState } from 'react'
import { getMe, isAdminMock } from './adminApi'
import { PRICING_PUBLIC } from './pricing'
import { useSession } from './useSession'

/** nhớ kết quả theo tài khoản: thanh đầu trang gọi ở mọi trang, chỉ hỏi server một lần */
let cache: { uid: string; ok: Promise<boolean> } | null = null

export function usePricingAccess(): 'loading' | boolean {
  const session = useSession()
  const [allowed, setAllowed] = useState<'loading' | boolean>(() => (PRICING_PUBLIC ? true : 'loading'))
  const uid = session?.user.id ?? (isAdminMock() ? 'mock' : '')
  useEffect(() => {
    if (PRICING_PUBLIC) return setAllowed(true)
    if (!uid) return setAllowed(false)
    if (cache?.uid !== uid) {
      // không phải admin thì server trả 403: nhớ luôn là không (đổi tài khoản thì hỏi lại)
      const ok = getMe().then((m) => m.role === 'admin', () => false)
      cache = { uid, ok }
    }
    let alive = true
    void cache.ok.then((v) => alive && setAllowed(v))
    return () => {
      alive = false
    }
  }, [uid])
  return allowed
}
