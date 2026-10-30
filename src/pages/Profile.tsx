import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Badge, Button, inputClass } from '@/components/ui'
import { signOut, updateProfile, type Session } from '@/lib/auth'
import { uploadImage } from '@/lib/mediaStore'
import { useSession } from '@/lib/useSession'

/** Số liệu điểm AI là MOCK để thử giao diện. Chưa có backend đếm lượt thật. */
const CREDIT = {
  used: 128,
  total: 200,
}

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
      </aside>

      <div className="stagger flex min-w-0 flex-col gap-6">
        <EditCard user={user} />
        <CreditCard />
      </div>
    </div>
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
      <span className="flex size-28 items-center justify-center overflow-hidden rounded-full bg-clay-tint font-display text-[42px] font-semibold uppercase text-clay ring-4 ring-surface">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="size-full object-cover" />
        ) : (
          (user.name ?? user.email).charAt(0)
        )}
      </span>

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

/** Điểm AI: số dư còn lại là số lớn; điểm cấp một lần, dùng hết là hết, không làm mới theo tháng. */
function CreditCard() {
  const left = CREDIT.total - CREDIT.used
  const pct = Math.round((left / CREDIT.total) * 100)
  return (
    <section className="rounded-[8px] bg-surface p-7 shadow-lift sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Điểm AI</h2>
        <Badge tone="honey">Số liệu mẫu</Badge>
      </div>

      <p className="mt-7 font-display text-[48px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
        {left}
        <span className="text-[18px] font-medium text-ink-3"> điểm còn lại</span>
      </p>
      <CreditBar pct={pct} left={left} />
      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12.5px] text-ink-3 tnum">
        <span>Đã dùng {CREDIT.used} / {CREDIT.total} điểm</span>
        <span>Điểm của tài khoản, không hết hạn và không làm mới hằng tháng</span>
      </div>
    </section>
  )
}

/** Thanh tiến độ, chạy từ 0 lên giá trị thật sau khi trang hiện ra. */
function CreditBar({ pct, left }: { pct: number; left: number }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div
      className="mt-5 h-2.5 overflow-hidden rounded-full bg-sunken"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={CREDIT.total}
      aria-valuenow={left}
      aria-label="Điểm AI còn lại"
    >
      <div
        className="h-full rounded-full bg-clay transition-[width] duration-[1200ms] ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
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
