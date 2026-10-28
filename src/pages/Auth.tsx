import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Feather } from 'lucide-react'
import { Button } from '@/components/ui'
import { AuthError, requestReset, setNewPassword, signIn, signUp } from '@/lib/auth'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

const COPY: Record<Mode, { eyebrow: string; title: string; body: string; submit: string }> = {
  login: {
    eyebrow: 'Đăng nhập',
    title: 'Chào bạn quay lại.',
    body: 'Đề và slide của bạn đang chờ. Đăng nhập để mở lại trên bất kỳ máy nào.',
    submit: 'Đăng nhập',
  },
  register: {
    eyebrow: 'Tạo tài khoản',
    title: 'Mở là soạn, không cần thẻ.',
    body: 'Một tài khoản để giữ đề, slide và ảnh của bạn. Miễn phí, chỉ cần email và mật khẩu.',
    submit: 'Tạo tài khoản',
  },
  forgot: {
    eyebrow: 'Quên mật khẩu',
    title: 'Lấy lại quyền vào tài khoản.',
    body: 'Nhập email đã đăng ký. Chúng tôi gửi một liên kết để bạn đặt mật khẩu mới.',
    submit: 'Gửi liên kết',
  },
  reset: {
    eyebrow: 'Mật khẩu mới',
    title: 'Đặt mật khẩu mới.',
    body: 'Chọn một mật khẩu mà bạn chưa dùng ở đâu khác.',
    submit: 'Lưu mật khẩu',
  },
}

const MIN_PASSWORD = 8

export default function Auth({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const copy = COPY[mode]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)

  // Link đặt lại mật khẩu từ email trả token trong hash: #access_token=...&type=recovery
  useEffect(() => {
    if (mode !== 'reset') return
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const token = hash.get('access_token')
    setRecoveryToken(token && hash.get('type') === 'recovery' ? token : null)
  }, [mode])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (mode === 'register' && !name.trim()) return setError('Nhập tên hiển thị của bạn.')
    if (mode === 'register' || mode === 'reset') {
      if (password.length < MIN_PASSWORD) return setError(`Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`)
      if (password !== confirm) return setError('Hai mật khẩu chưa khớp.')
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        navigate('/soan-de')
      } else if (mode === 'register') {
        const { needsConfirm } = await signUp(email.trim(), password, name.trim())
        if (needsConfirm) setNotice('Đã gửi email xác nhận. Mở email và bấm liên kết để kích hoạt tài khoản.')
        else navigate('/soan-de')
      } else if (mode === 'forgot') {
        await requestReset(email.trim())
        setNotice('Nếu email này có tài khoản, liên kết đặt lại mật khẩu đã được gửi. Kiểm tra cả hộp thư rác.')
      } else if (mode === 'reset' && recoveryToken) {
        await setNewPassword(recoveryToken, password)
        setNotice('Đã đổi mật khẩu. Đăng nhập bằng mật khẩu mới.')
        setPassword('')
        setConfirm('')
      }
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Có lỗi xảy ra, thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  const showEmail = mode === 'login' || mode === 'register' || mode === 'forgot'
  const showPassword = mode === 'login' || mode === 'register' || mode === 'reset'
  const showConfirm = mode === 'register' || mode === 'reset'
  const resetInvalid = mode === 'reset' && recoveryToken === null

  return (
    <section className="mx-auto grid max-w-[1180px] items-center gap-8 px-4 py-8 sm:h-[calc(100dvh-69px)] sm:gap-10 sm:overflow-hidden sm:px-6 sm:py-6 lg:grid-cols-[1fr_440px] lg:gap-20">
      <div className="flex flex-col gap-8">
      <div className="anim-rise">
        <p className="eyebrow mb-4">{copy.eyebrow}</p>
        <h1 className="font-display text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] text-ink text-balance sm:text-[48px]">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-[42ch] text-[15px] leading-[1.75] text-ink-2 text-pretty">{copy.body}</p>
      </div>

      <AuthArt />
      </div>

      <div className="anim-rise [animation-delay:0.12s]">
        <div className="rounded-[8px] bg-surface p-6 shadow-lift sm:p-7">
          <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-clay-soft text-clay">
            <Feather className="size-4" strokeWidth={1.8} />
          </span>

          {resetInvalid ? (
            <div className="space-y-5">
              <p className="text-[14.5px] leading-relaxed text-ink-2">
                Liên kết này không hợp lệ hoặc đã hết hạn. Yêu cầu một liên kết mới.
              </p>
              <Link to="/quen-mat-khau" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-clay hover:underline">
                Gửi lại liên kết <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3.5" noValidate>
              {mode === 'register' && (
                <Field label="Tên hiển thị">
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
              {showEmail && (
                <Field label="Email">
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
              {showPassword && (
                <Field label={mode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}>
                  <input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}
              {showConfirm && (
                <Field label="Nhập lại mật khẩu">
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}

              {error && <p role="alert" className="text-[13.5px] font-medium text-clay-deep">{error}</p>}
              {notice && <p role="status" className="rounded-[6px] bg-sage-soft px-3.5 py-2.5 text-[13.5px] leading-relaxed text-sage">{notice}</p>}

              <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Đang xử lý…' : copy.submit}
                {!busy && <ArrowRight className="size-4" />}
              </Button>

              <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 pt-2 text-[13.5px] text-ink-3">
                {mode === 'login' && (
                  <>
                    <Link to="/quen-mat-khau" className="hover:text-clay hover:underline">Quên mật khẩu?</Link>
                    <Link to="/dang-ky" className="font-semibold text-ink hover:text-clay">Tạo tài khoản</Link>
                  </>
                )}
                {mode === 'register' && (
                  <Link to="/dang-nhap" className="ml-auto font-semibold text-ink hover:text-clay">Đã có tài khoản? Đăng nhập</Link>
                )}
                {(mode === 'forgot' || mode === 'reset') && (
                  <Link to="/dang-nhap" className="ml-auto font-semibold text-ink hover:text-clay">Quay lại đăng nhập</Link>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/** Tờ đề đang được soạn: các dòng hiện lần lượt, cuối cùng có dấu "đã lưu". Chỉ trang trí. */
function AuthArt() {
  const lines = ['w-4/5', 'w-full', 'w-3/5', 'w-11/12']
  return (
    <div aria-hidden className="relative mx-auto hidden h-[220px] w-full max-w-[420px] sm:block max-[780px]:hidden lg:mx-0 anim-rise [animation-delay:0.2s]">
      <div className="absolute inset-x-5 bottom-0 top-5 rounded-[22px] bg-sunken/80" style={{ transform: 'rotate(-2.4deg)' }} />
      <div className="absolute inset-0 rounded-[18px] bg-surface p-6 shadow-float" style={{ transform: 'rotate(1.4deg)' }}>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-clay" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Đề kiểm tra 15 phút</span>
        </div>

        <div className="mt-5 space-y-3">
          {lines.map((w, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full bg-sunken auth-type ${w}`}
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          {['A', 'B', 'C', 'D'].map((k, i) => (
            <span
              key={k}
              className={
                'flex size-9 items-center justify-center rounded-[8px] text-[13px] font-bold ' +
                (i === 2 ? 'auth-pick bg-clay text-white' : 'bg-canvas text-ink-3')
              }
            >
              {k}
            </span>
          ))}
        </div>

        <span
          className="auth-stamp absolute bottom-5 right-5 rounded-full bg-sage-soft px-3 py-1.5 text-[12px] font-semibold text-sage"
        >
          ✓ Đã lưu
        </span>
      </div>
    </div>
  )
}

const inputClass =
  'mt-1.5 w-full rounded-[6px] border border-line bg-canvas px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-clay focus:bg-surface'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
    </label>
  )
}
