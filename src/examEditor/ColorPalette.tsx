/** Bảng màu dùng chung (thanh nổi + slide): ô vuông màu như bảng vẽ, kèm ô nhập mã màu. */
import { HexInput } from '@/components/HexInput'

/** Lưới 10 × 3: hàng xám, hàng màu tươi, hàng màu nhạt — giống bảng vẽ và ribbon soạn đề. */
export const COMMON_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

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
  // màu của chủ đề slide đặt hàng riêng phía trên, bỏ màu đã có trong lưới
  const theme = [...new Set(themeColors.map((c) => c.toLowerCase()))].filter((c) => !COMMON_COLORS.includes(c))

  const swatch = (c: string) => (
    <button
      key={c}
      type="button"
      data-tip={c}
      aria-label={`Màu ${c}`}
      className={`h-[18px] w-[18px] rounded-[3px] border border-black/10 hover:scale-110 ${c === current ? 'ring-2 ring-clay ring-offset-1' : ''}`}
      style={{ background: c }}
      onClick={() => {
        onPick(c)
        onClose?.()
      }}
    />
  )

  return (
    <div className="flex w-[216px] flex-col gap-2" onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
      {theme.length > 0 && <div className="flex gap-1">{theme.map(swatch)}</div>}
      <div className="grid grid-cols-10 gap-1">{COMMON_COLORS.map(swatch)}</div>
      <HexInput value={/^#[0-9a-f]{6}$/.test(current) ? current : '#000000'} onPreview={() => {}} onCommit={onPick} />
    </div>
  )
}
