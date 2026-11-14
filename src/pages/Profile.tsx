import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, LogOut, Shield } from 'lucide-react'
import { getMe, type AdminMe } from '@/lib/adminApi'
import { Button, inputClass } from '@/components/ui'
import { signOut, updateProfile, type Session } from '@/lib/auth'
import { uploadImage } from '@/lib/mediaStore'
import { useSession } from '@/lib/useSession'
import { apiFetch } from '@/lib/apiFetch'
import { ProgressBar } from '@/components/ProgressBar'
import { Avatar } from '@/components/Avatar'

export default function Profile() {
  const session = useSession()
  if (!session) return <Navigate to="/dang-nhap" replace />
  return <ProfilePage user={session.user} />
}

/** Hai cột: hồ sơ cố định bên trái, thông tin và điểm AI bên phải. Cột trái xếp lên trên khi màn hình hẹp. */
function ProfilePage({ user }: { user: Session['user'] }) {
  return (
    <div className="mx-auto grid max-w-[1080px] gap-8 px-5 pt-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:pt-14">
      <aside className="anim-rise lg:sticky lg:top-24 lg:self-start">
        <IdentityCard user={user} />
        <Link to="/ho-so/de-tai-len"
          className="mt-3 flex items-center gap-3 rounded-[8px] bg-surface px-4 py-3 shadow-lift transition-colors hover:bg-paper-2">
          <FileText className="size-4 text-ink-3" />
          <span className="flex-1 text-[14px] font-medium text-ink">Đề của tôi</span>
          <ChevronRight className="size-4 text-ink-3" />
        </Link>
      </aside>

      <div className="stagger flex min-w-0 flex-col gap-6">
        <AdminCard />
        <EditCard user={user} />
        <CreditCard />
      </div>
    </div>
  )
}

/** Chỉ hiện với admin/kiểm duyệt (server xác nhận qua getMe); người thường không thấy gì. */
function AdminCard() {
  const [me, setMe] = useState<AdminMe | null>(null)
  const navigate = useNavigate()
  useEffect(() => {
    let alive = true
    getMe()
      .then((m) => alive && setMe(m))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  if (!me) return null
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] bg-surface p-6 shadow-lift">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[6px] bg-clay text-white">
          <Shield className="size-5" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Bảng điều khiển</h2>
          <p className="text-[13px] text-ink-3">Bạn có quyền {me.role === 'admin' ? 'quản trị viên' : 'kiểm duyệt'}.</p>
        </div>
      </div>
      <Button variant="primary" size="sm" onClick={() => navigate('/admin')}>
        Mở bảng điều khiển
      </Button>
    </section>
  )
}

/** Cột trái: ảnh đại diện, tên, email, và đăng xuất ở cuối. */
function IdentityCard({ user }: { user: Session['user'] }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const changeAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Chọn một tệp ảnh (PNG, JPG, WebP).')
    setBusy(true)
    setError(null)
    try {
      const url = await uploadImage(await squareAvatar(file))
      await updateProfile({ avatar: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center rounded-[8px] bg-surface px-7 pb-7 pt-9 text-center shadow-lift">
      <Avatar
        src={user.avatar}
        name={user.name ?? user.email}
        className="size-28 ring-4 ring-surface"
        fallbackClassName="font-display text-[42px]"
      />

      <h1 className="mt-5 max-w-full truncate font-display text-[26px] font-semibold leading-tight tracking-[-0.01em] text-ink">
        {user.name ?? 'Chưa đặt tên'}
      </h1>
      <p className="mt-1 max-w-full break-all text-[13.5px] text-ink-3">{user.email}</p>

      <Button variant="outline" size="sm" disabled={busy} className="mt-6" onClick={() => fileRef.current?.click()}>
        {busy ? 'Đang tải ảnh…' : 'Đổi ảnh đại diện'}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={changeAvatar} />
      {error ? <p role="alert" className="mt-3 text-[12.5px] font-medium text-clay-deep">{error}</p> : null}

      <div className="mt-7 w-full border-t border-line pt-5">
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink-3 transition-colors hover:text-clay-deep"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </button>
        <p className="mt-1.5 text-[12.5px] text-ink-4">Đề và slide đã lưu vẫn còn.</p>
      </div>
    </div>
  )
}

/** Form sửa thông tin: tên đổi được, email chỉ hiển thị. */
function EditCard({ user }: { user: Session['user'] }) {
  const [name, setName] = useState(user.name ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const next = name.trim()
    setError(null)
    setNotice(null)
    if (!next) return setError('Tên hiển thị không được để trống.')
    if (next === (user.name ?? '')) return setNotice('Tên chưa thay đổi.')
    setBusy(true)
    try {
      await updateProfile({ name: next })
      setNotice('Đã lưu tên hiển thị.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="rounded-[8px] bg-surface p-7 shadow-lift sm:p-8" noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Thông tin cá nhân</h2>
        <p className="text-[13px] text-ink-4">Tên hiển thị xuất hiện trên đầu trang và trong danh sách đề.</p>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="block text-[13px] font-semibold text-ink-2">Tên hiển thị</span>
          <input
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass + ' mt-1.5 block'}
          />
        </label>

        <div>
          <span className="block text-[13px] font-semibold text-ink-2">Email đăng nhập</span>
          <p className="mt-1.5 truncate rounded-[6px] bg-sunken px-4 py-2.5 text-[14px] text-ink-3">{user.email}</p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="min-h-5 text-[13.5px]" role="status">
          {error ? <span className="font-medium text-clay-deep">{error}</span> : null}
          {!error && notice ? <span className="text-sage">{notice}</span> : null}
        </p>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  )
}

type Quota = { used: number; limit: number; base?: number; credits?: number }
const fmt = (n: number) => n.toLocaleString('vi-VN')

/** Điểm AI thật (GET /api/llm): hạn mức tháng + điểm admin cộng (không mất khi sang tháng). */
function CreditCard() {
  const [q, setQ] = useState<Quota | null | 'loading' | 'error' | 'unlimited'>('loading')
  useEffect(() => {
    let alive = true
    apiFetch('/api/llm')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { quota: Quota | null; unlimited?: boolean }) => alive && setQ(d.unlimited ? 'unlimited' : d.quota))
      .catch(() => alive && setQ('error'))
    return () => {
      alive = false
    }
  }, [])

  let body
  if (q === 'loading') body = <p className="mt-6 text-[13px] text-ink-3">Đang tải…</p>
  else if (q === 'error') body = <p className="mt-6 text-[13px] text-ink-3">Chưa tải được số liệu, thử lại sau.</p>
  else if (q === 'unlimited')
    body = (
      <>
        <p className="mt-7 font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-ink">
          ∞<span className="ml-2 text-[18px] font-medium text-ink-3">Không giới hạn</span>
        </p>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-clay/80" aria-hidden />
        <p className="mt-3 text-[12.5px] text-ink-3">
          Tài khoản của bạn được dùng AI không giới hạn token, không trừ hạn mức tháng.
        </p>
      </>
    )
  else if (q === null) body = <p className="mt-6 text-[13px] text-ink-3">Máy dev: không giới hạn token AI.</p>
  else {
    const left = Math.max(0, q.limit - q.used)
    const pct = q.limit > 0 ? Math.round((left / q.limit) * 100) : 0
    body = (
      <>
        <p className="mt-7 font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
          {fmt(left)}
          <span className="text-[18px] font-medium text-ink-3"> token còn lại</span>
        </p>
        <ProgressBar pct={pct} label="Phần trăm token AI còn lại" />
        <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12.5px] text-ink-3 tnum">
          <span>Tháng này đã dùng {fmt(q.used)} / {fmt(q.limit)} token</span>
          <span>
            Hạn mức tháng {fmt(q.base ?? q.limit)}
            {q.credits ? ` + ${fmt(q.credits)} điểm được cộng (không hết hạn)` : ''}
          </span>
        </div>
      </>
    )
  }
  return (
    <section className="rounded-[8px] bg-surface p-7 shadow-lift sm:p-8">
      <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Điểm AI</h2>
      {body}
    </section>
  )
}

/** Cắt vuông giữa ảnh, thu còn 256px, nén JPEG: ảnh đại diện không cần to hơn. */
function squareAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const size = 256
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Trình duyệt không xử lý được ảnh này.'))
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Không đọc được ảnh này.'))
    }
    img.src = url
  })
}
