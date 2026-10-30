import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { QuestionImage } from '@/data/types'
import { cn } from '@/lib/cn'

const POSITIONS: Array<{ value: NonNullable<QuestionImage['position']>; label: string }> = [
  { value: 'top', label: 'Trên đề bài' },
  { value: 'bottom', label: 'Dưới đề bài' },
  { value: 'left', label: 'Bên trái' },
  { value: 'right', label: 'Bên phải' },
]

/** Chọn / đổi / xoá ảnh của câu hỏi, kèm vị trí và độ rộng. Dán ảnh (Ctrl+V) ở ô đề bài do trang xử lý. */
export function QuestionImageField({
  image,
  onChange,
  busy,
  error,
  pick,
}: {
  image: QuestionImage | undefined
  onChange: (image: QuestionImage | undefined) => void
  busy: boolean
  error: string | null
  /** chọn tệp từ máy */
  pick: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const pos = image?.position ?? 'bottom'
  return (
    <div className="mt-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) pick(f)
        }}
      />
      {image?.src ? (
        <div className="rounded-[8px] bg-sunken/70 p-3">
          <div className="flex items-center gap-3">
            <img src={image.src} alt="" className="h-16 w-24 rounded-[6px] bg-white object-contain" />
            <div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label="Vị trí ảnh">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={pos === p.value}
                  onClick={() => onChange({ ...image, position: p.value })}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                    pos === p.value ? 'bg-ink text-paper' : 'bg-white text-ink-2 hover:text-ink',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Xoá ảnh"
              title="Xoá ảnh"
              onClick={() => onChange(undefined)}
              className="flex size-9 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-clay-soft hover:text-clay"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <label className="mt-3 flex items-center gap-3 text-[12.5px] text-ink-3">
            Độ rộng
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={image.width ?? 60}
              onChange={(e) => onChange({ ...image, width: Number(e.target.value) })}
              className="flex-1 accent-clay"
            />
            <span className="tnum w-10 text-right font-semibold text-ink-2">{image.width ?? 60}%</span>
          </label>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-dashed border-line-2 px-4 py-3 text-[13px] font-semibold text-ink-3 transition-colors hover:bg-sunken/60 hover:text-ink disabled:opacity-50"
        >
          <ImagePlus className="size-4" />
          {busy ? 'Đang xử lý ảnh…' : 'Thêm ảnh cho câu hỏi (hoặc dán ảnh bằng Ctrl+V vào ô đề bài)'}
        </button>
      )}
      {error ? <p className="mt-1.5 text-[12.5px] font-medium text-clay">{error}</p> : null}
    </div>
  )
}
