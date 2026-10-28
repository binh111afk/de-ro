import { useLayoutEffect, useRef, useState } from 'react'
import { MonitorPlay, Save } from 'lucide-react'
import { cn } from '@/lib/cn'

const W = 1280
const H = 720

/**
 * Slide HTML: tài liệu HTML của AI chạy trong iframe sandbox ở cỡ 1280×720 rồi thu/phóng
 * theo bề rộng khung chứa (thumbnail, sân soạn, trình chiếu dùng chung). `interactive` = false
 * cho thumbnail để click rơi vào nút chọn slide thay vì vào iframe.
 */
export function HtmlSlideFrame({
  html,
  interactive = false,
  className,
}: {
  html: string
  interactive?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / W)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={cn('relative aspect-[16/9] w-full overflow-hidden bg-white', className)}>
      <iframe
        title="Slide HTML"
        srcDoc={html}
        sandbox="allow-scripts"
        tabIndex={interactive ? 0 : -1}
        style={{
          width: W,
          height: H,
          border: 0,
          transformOrigin: '0 0',
          transform: `scale(${scale})`,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
    </div>
  )
}

/** Thanh công cụ rút gọn của bài giảng HTML: chỉ lưu và trình chiếu (không sửa, không xuất PPT). */
export function HtmlDeckBar({ onSave, onPresent }: { onSave?: () => void; onPresent: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-2 text-[13px]">
      <strong className="text-ink">Bản trình bày HTML</strong>
      <span className="text-ink-3">Chỉ trình chiếu trên web — không sửa bằng trình soạn, không xuất PowerPoint được.</span>
      <span className="flex-1" />
      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-semibold text-ink hover:bg-canvas"
        >
          <Save className="size-3.5" />
          Lưu
        </button>
      ) : null}
      <button
        type="button"
        onClick={onPresent}
        className="flex items-center gap-1.5 rounded-lg bg-clay px-3 py-1.5 font-semibold text-white hover:opacity-90"
      >
        <MonitorPlay className="size-3.5" />
        Trình chiếu
      </button>
    </div>
  )
}
