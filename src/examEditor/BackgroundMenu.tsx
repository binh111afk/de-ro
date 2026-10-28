/** Bảng chọn nền slide (tab Thiết kế): màu đặc, chuyển sắc dựng sẵn, màu tuỳ ý, hoặc quay về nền theo bộ màu. */
import { useEffect, useRef, useState } from 'react'
import { BACKGROUNDS, prepareBgImage } from '@/lib/slideBackground'

export function BackgroundMenu({
  current,
  custom,
  onPick,
}: {
  /** nền hiện tại của slide đang chọn */
  current: string
  /** nền hiện tại có phải nền riêng không (để đánh dấu ô đang dùng) */
  custom: boolean
  /** `null` = bỏ nền riêng, theo bộ màu; `image` = ảnh nền (data URL), `background` lúc đó là màu trung bình của ảnh */
  onPick: (background: string | null, allSlides: boolean, image?: string) => void
}) {
  const [all, setAll] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pickImage = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const { image, color } = await prepareBgImage(file)
      onPick(color, all, image)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không dùng được ảnh này.')
    } finally {
      setBusy(false)
    }
  }
  const customRef = useRef<HTMLInputElement>(null)
  // hộp chọn màu gốc bắn `input` liên tục khi kéo; chỉ áp khi chọn xong để không tràn lịch sử hoàn tác
  useEffect(() => {
    const input = customRef.current
    if (!input) return
    const done = () => onPick(input.value, all)
    input.addEventListener('change', done)
    return () => input.removeEventListener('change', done)
  })
  return (
    <div className="w-[236px] p-1" onMouseDown={(e) => e.preventDefault()}>
      <div className="grid grid-cols-5 gap-2">
        {BACKGROUNDS.map((b) => (
          <button
            key={b.value}
            type="button"
            title={b.label}
            aria-label={`Nền ${b.label}`}
            className="h-8 rounded-md border border-black/15 transition-transform hover:scale-105"
            style={{
              background: b.value,
              outline: custom && b.value === current ? '2px solid var(--color-clay)' : undefined,
              outlineOffset: 1,
            }}
            onClick={() => onPick(b.value, all)}
          />
        ))}
      </div>
      <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-2">
        <input ref={customRef} type="color" defaultValue="#ffffff" className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
        Màu khác…
      </label>
      <button
        type="button"
        disabled={busy}
        className="mt-1.5 block text-[12.5px] text-ink-2 underline-offset-2 hover:text-clay hover:underline disabled:opacity-50"
        onClick={() => fileRef.current?.click()}
      >
        {busy ? 'Đang xử lý ảnh…' : 'Dùng ảnh từ máy…'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void pickImage(file)
        }}
      />
      {error && (
        <div role="alert" className="mt-1.5 rounded-md bg-clay-tint px-2 py-1.5 text-[12px] leading-snug text-clay-deep">
          {error}
        </div>
      )}
      <button type="button" className="mt-1.5 block text-[12.5px] text-ink-2 underline-offset-2 hover:text-clay hover:underline" onClick={() => onPick(null, all)}>
        Theo bộ màu của bài
      </button>
      <label className="mt-2 flex cursor-pointer items-center gap-2 border-t border-line pt-2 text-[12.5px] text-ink-2">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
        Áp dụng cho tất cả slide
      </label>
    </div>
  )
}
