import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Badge, Button, inputClass } from '@/components/ui'
import { signOut, updateProfile, type Session } from '@/lib/auth'
import { uploadImage } from '@/lib/mediaStore'
import { useSession } from '@/lib/useSession'

/** Số liệu credit AI là MOCK để thử giao diện. Chưa có backend đếm lượt thật. */
const CREDIT = {
  used: 128,
  total: 200,
  resetDay: '1/11',
  breakdown: [
    { label: 'Sinh đề', n: 46 },
    { label: 'Sửa đề bằng lệnh', n: 52 },
    { label: 'Tạo slide', n: 30 },
  ],
}

export default function Profile() {
  const session = useSession()
  if (!session) return <Navigate to="/dang-nhap" replace />
  return <ProfilePage user={session.user} />
}

function ProfilePage({ user }: { user: Session['user'] }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 pt-12 sm:px-6 lg:pt-16">
      <ProfileCard user={user} />

      <div className="stagger mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <EditCard user={user} />
        <CreditCard />
      </div>

      <div className="anim-rise mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-line-2 bg-surface/60 px-7 py-5 [animation-delay:0.3s]">
        <p className="text-[14px] text-ink-3">Đăng xuất khỏi trình duyệt này. Đề và slide đã lưu vẫn còn.</p>
        <Button variant="outline" onClick={() => void signOut()}>
          <LogOut className="size-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}

/** Thẻ đầu trang: ảnh đại diện bên trái, tên và email bên phải. */
function ProfileCard({ user }: { user: Session['user'] }) {
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
    <div className="anim-rise grid overflow-hidden rounded-[8px] bg-surface shadow-lift md:grid-cols-[300px_1fr]">
      <div className="flex flex-col items-center justify-center gap-4 bg-clay-tint px-8 py-10">
        <span className="flex size-32 items-center justify-center overflow-hidden rounded-full bg-surface font-display text-[46px] font-semibold uppercase text-clay shadow-float ring-[6px] ring-white">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="size-full object-cover" />
          ) : (
            (user.name ?? user.email).charAt(0)
          )}
        </span>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Đang tải ảnh…' : 'Đổi ảnh đại diện'}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={changeAvatar} />
        {error ? <p role="alert" className="text-center text-[12.5px] font-medium text-clay-deep">{error}</p> : null}
      </div>

      <div className="flex flex-col justify-center gap-4 px-8 py-10 md:px-12">
        <h1 className="font-display text-[38px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[46px]">
          {user.name ?? 'Chưa đặt tên'}
        </h1>
        <p className="text-[15px] text-ink-3 break-all">{user.email}</p>
      </div>
    </div>
  )
}

/** Form sửa thông tin: chỉ có tên hiển thị là đổi được. */
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
    <form onSubmit={save} className="flex flex-col rounded-[8px] bg-surface p-7 shadow-lift sm:p-8" noValidate>
      <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Thông tin</h2>
      <p className="mt-1.5 text-[14px] text-ink-3">Tên hiển thị xuất hiện trên đầu trang và trong danh sách đề.</p>

      <div className="mt-7 space-y-5">
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
          <span className="block text-[13px] font-semibold text-ink-2">Email</span>
          <p className="mt-1.5 rounded-[6px] bg-sunken px-4 py-2.5 text-[14px] text-ink-3">{user.email}</p>
          <p className="mt-1.5 text-[12px] text-ink-4">Email dùng để đăng nhập, chưa đổi được ở đây.</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 pt-8">
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

/** Lượt AI: số lớn, thanh tiến độ, rồi chi tiết theo loại. Toàn bộ là số mẫu. */
function CreditCard() {
  const pct = Math.round((CREDIT.used / CREDIT.total) * 100)
  return (
    <section className="flex flex-col rounded-[8px] bg-surface p-7 shadow-lift sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Lượt AI tháng này</h2>
          <p className="mt-1.5 text-[14px] text-ink-3">Sinh đề, sửa đề và tạo slide.</p>
        </div>
        <Badge tone="honey">Số liệu mẫu</Badge>
      </div>

      <p className="mt-7 font-display text-[44px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
        {CREDIT.used}
        <span className="text-[18px] font-medium text-ink-3"> / {CREDIT.total}</span>
      </p>

      <CreditBar pct={pct} />
      <p className="mt-2.5 text-[12.5px] text-ink-3 tnum">
        Đã dùng {pct}% · làm mới ngày {CREDIT.resetDay}
      </p>

      <ul className="mt-7 divide-y divide-line border-t border-line">
        {CREDIT.breakdown.map((b, i) => (
          <li
            key={b.label}
            className="anim-delay flex items-center justify-between py-3.5 text-[14px]"
            style={{ '--delay': `${0.2 + i * 0.08}s` } as React.CSSProperties}
          >
            <span className="text-ink-2">{b.label}</span>
            <span className="font-semibold text-ink tnum">{b.n}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Thanh tiến độ, chạy từ 0 lên giá trị thật sau khi trang hiện ra. */
function CreditBar({ pct }: { pct: number }) {
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
      aria-valuenow={CREDIT.used}
      aria-label="Lượt dùng AI"
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
