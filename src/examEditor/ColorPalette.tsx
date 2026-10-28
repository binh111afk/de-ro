/** Bảng màu dùng chung (thanh nổi + ribbon): màu của bộ màu, màu phổ biến, và chọn màu tuỳ ý. */
import { useEffect, useRef } from 'react'

/** Màu hay dùng ngoài màu của bộ màu: đủ đỏ/cam/vàng/lục/lam/tím/hồng + đen/xám/trắng. */
export const COMMON_COLORS = ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777', '#111827', '#6b7280', '#ffffff']

export function ColorPalette({
  value,
  themeColors,
  onPick,
}: {
  value: string
  themeColors: string[]
  onPick: (color: string) => void
}) {
  const customRef = useRef<HTMLInputElement>(null)
  // Hộp chọn màu gốc bắn `input` liên tục khi kéo; chỉ áp khi chọn xong (`change`) để không tràn lịch sử hoàn tác.
  useEffect(() => {
    const input = customRef.current
    if (!input) return
    const done = () => onPick(input.value)
    input.addEventListener('change', done)
    return () => input.removeEventListener('change', done)
  })
  const colors = [...new Set([...themeColors, ...COMMON_COLORS].map((c) => c.toLowerCase()))]
  return (
    <div className="w-[172px]" onMouseDown={(e) => e.preventDefault()}>
      <div className="grid grid-cols-6 gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={`Màu ${c}`}
            className="size-5 rounded-full border border-black/15 transition-transform hover:scale-110"
            style={{ background: c, outline: c === value.toLowerCase() ? '2px solid var(--color-clay)' : undefined, outlineOffset: 1 }}
            onClick={() => onPick(c)}
          />
        ))}
      </div>
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] text-ink-2">
        <input ref={customRef} type="color" defaultValue={value} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
        Màu khác…
      </label>
    </div>
  )
}
