/** Bảng màu dùng chung (thanh nổi + ribbon): ô vuông màu của bộ màu và màu phổ biến, kèm ô nhập mã màu. */
import { useEffect, useState } from 'react'

/** Màu hay dùng ngoài màu của bộ màu: hàng trung tính, rồi mỗi sắc độ ba mức (nhạt, vừa, đậm). */
export const COMMON_COLORS = [
  '#ffffff', '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#111827', '#000000',
  '#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#99f6e4', '#bfdbfe', '#ddd6fe', '#fbcfe8',
  '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777',
  '#991b1b', '#9a3412', '#92400e', '#166534', '#115e59', '#1e40af', '#5b21b6', '#9d174d',
]

/** "#abc" / "abc" / "#aabbcc" → "#aabbcc"; không hợp lệ thì null */
function parseHex(text: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim())
  if (!m) return null
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
  return `#${h.toLowerCase()}`
}

export function ColorPalette({
  value,
  themeColors,
  onPick,
  onClose,
}: {
  value: string
  themeColors: string[]
  onPick: (color: string) => void
  /** gọi sau khi bấm một ô màu (ô nhập mã màu thì không đóng bảng) */
  onClose?: () => void
}) {
  const current = value.toLowerCase()
  const [hex, setHex] = useState(current)
  useEffect(() => setHex(current), [current])
  const colors = [...new Set([...themeColors, ...COMMON_COLORS].map((c) => c.toLowerCase()))]

  const commit = () => {
    const color = parseHex(hex)
    if (color && color !== current) onPick(color)
    else setHex(current)
  }

  return (
    <div className="w-[216px]" onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
      <div className="grid grid-cols-8 gap-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            aria-label={`Màu ${c}`}
            className="size-6 rounded-md border border-black/15 transition-transform hover:scale-110"
            style={{ background: c, outline: c === current ? '2px solid var(--color-clay)' : undefined, outlineOffset: 1 }}
            onClick={() => {
              onPick(c)
              onClose?.()
            }}
          />
        ))}
      </div>
      <label className="mt-2.5 flex items-center gap-2 text-[12px] text-ink-2">
        <span className="size-7 shrink-0 rounded-md border border-black/15" style={{ background: parseHex(hex) ?? current }} />
        <input
          value={hex}
          maxLength={7}
          spellCheck={false}
          aria-label="Mã màu"
          placeholder="#000000"
          className="min-w-0 flex-1 rounded-md border border-line px-2 py-1.5 font-mono text-[12.5px] uppercase outline-none focus:border-clay"
          onChange={(e) => {
            setHex(e.target.value)
            // đủ 6 số thì áp ngay; mã 3 số chờ Enter hoặc rời ô để không nhảy giữa chừng khi đang gõ
            const typed = e.target.value.replace('#', '')
            if (typed.length === 6) {
              const color = parseHex(typed)
              if (color && color !== current) onPick(color)
            }
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
        />
      </label>
    </div>
  )
}
