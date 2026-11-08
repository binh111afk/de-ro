/**
 * Khung xem trước cho phép kéo nhãn (khi nút "Di chuyển nhãn" đang bật):
 * SVG hiện inline (dangerouslySetInnerHTML, không phải <img>) để bắt được
 * event.target.closest('text[data-lbl]'). Kéo thì cập nhật transform trực tiếp
 * trên DOM cho mượt; thả chuột mới gọi onChange ghi labelPos vào spec (công cụ
 * vẽ lại). Toạ độ chuột đổi ra đơn vị viewBox giống toVb của PickPreview.
 */
import { useMemo, useRef, type ReactNode } from 'react'
import { Move, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { ToolImage } from '@/lib/toolSpec'

const n1 = (v: number) => Math.round(v * 10) / 10

/** hàng nút "Di chuyển nhãn" (bật/tắt chế độ kéo) + "Đặt lại vị trí nhãn" */
function LabelBar({ on, has, onToggle, onReset }: { on: boolean; has: boolean; onToggle: () => void; onReset: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-pressed={on}
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[12.5px] transition-colors',
          on ? 'border-clay bg-clay-tint font-medium text-clay' : 'border-line text-ink-2 hover:border-ink-4',
        )}
      >
        <Move className="size-3.5" /> Di chuyển nhãn
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={!has}
        title="Xoá mọi vị trí nhãn đã kéo"
        className="flex items-center gap-1.5 rounded-[6px] border border-line px-2 py-1 text-[12.5px] text-ink-2 transition-colors hover:border-ink-4 disabled:pointer-events-none disabled:opacity-40"
      >
        <RotateCcw className="size-3.5" /> Đặt lại vị trí nhãn
      </button>
    </div>
  )
}

/** khung SVG kéo được: con trỏ move trên nhãn, viền nhạt khi rê chuột */
function LabelDragPreview({
  img,
  labelPos,
  onChange,
}: {
  img: ToolImage
  labelPos?: Record<string, [number, number]>
  onChange: (pos: Record<string, [number, number]>) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; el: SVGTextElement; t0: string; sx: number; sy: number; ox: number; oy: number } | null>(null)
  const vb = [...img.svg.matchAll(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/g)][0]
  const [minX, minY, w, h] = vb ? vb.slice(1).map(Number) : [0, 0, img.width, img.height]
  const html = useMemo(() => img.svg.replace(/<svg[^>]*>/, (m) => m + '<style>text[data-lbl]{cursor:move}</style>'), [img.svg])

  const toVb = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect()
    const k = w / r.width
    return { x: minX + (e.clientX - r.left) * k, y: minY + (e.clientY - r.top) * k }
  }

  /** ghi vị trí mới vào spec (drag.current null thì bỏ qua — đã xử lý rồi) */
  const finishDrag = (e: { clientX: number; clientY: number }) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    const p = toVb(e)
    onChange({ ...labelPos, [d.id]: [n1(d.ox + p.x - d.sx), n1(d.oy + p.y - d.sy)] })
  }

  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center" style={{ containerType: 'size' }}>
      <div
        ref={box}
        className="relative select-none touch-none [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:rounded-[4px] [&_svg]:border [&_svg]:border-line [&_svg]:bg-white"
        style={{ aspectRatio: `${w} / ${h}`, width: `min(100cqw, 100cqh * ${w / h})` }}
        dangerouslySetInnerHTML={{ __html: html }}
        onPointerDown={(e) => {
          const t = (e.target as Element).closest('text[data-lbl]')
          if (!t) return
          const id = t.getAttribute('data-lbl')!
          e.currentTarget.setPointerCapture(e.pointerId)
          const p = toVb(e)
          drag.current = {
            id,
            el: t as SVGTextElement,
            t0: t.getAttribute('transform') ?? '',
            sx: p.x,
            sy: p.y,
            ox: labelPos?.[id]?.[0] ?? 0,
            oy: labelPos?.[id]?.[1] ?? 0,
          }
          // thả chuột ngoài khung (capture bị mất) vẫn lưu vị trí: nghe pointerup ở window;
          // thả trong khung thì handler của khung chạy trước và xoá drag.current, đây bỏ qua
          const onWinUp = (ev: PointerEvent) => {
            window.removeEventListener('pointerup', onWinUp)
            finishDrag(ev)
          }
          window.addEventListener('pointerup', onWinUp, { once: true })
        }}
        onPointerMove={(e) => {
          const d = drag.current
          if (!d) return
          const p = toVb(e)
          d.el.setAttribute('transform', `${d.t0} translate(${n1(p.x - d.sx)} ${n1(p.y - d.sy)})`)
        }}
        onPointerUp={finishDrag}
        onPointerCancel={() => (drag.current = null)}
        onPointerOver={(e) => {
          const t = (e.target as Element).closest('text[data-lbl]')
          if (t) {
            t.setAttribute('stroke', '#1f5fbf')
            t.setAttribute('stroke-width', '1.2')
          }
        }}
        onPointerOut={(e) => {
          const t = (e.target as Element).closest('text[data-lbl]')
          if (t) {
            t.removeAttribute('stroke')
            t.removeAttribute('stroke-width')
          }
        }}
      />
    </div>
  )
}

/**
 * Cột xem trước có chế độ kéo nhãn: hàng nút trên cùng, dưới là khung kéo
 * (khi bật) hoặc xem thường `fallback` (ảnh tĩnh / PickPreview).
 */
export function LabelPreview({
  img,
  labelPos,
  onChange,
  move,
  onToggle,
  fallback,
}: {
  img: ToolImage
  labelPos?: Record<string, [number, number]>
  onChange: (pos: Record<string, [number, number]> | undefined) => void
  move: boolean
  onToggle: () => void
  /** xem thường khi chế độ kéo đang tắt */
  fallback: ReactNode
}) {
  const has = Boolean(labelPos && Object.keys(labelPos).length)
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <LabelBar on={move} has={has} onToggle={onToggle} onReset={() => onChange(undefined)} />
      {move ? (
        <LabelDragPreview img={img} labelPos={labelPos} onChange={onChange} />
      ) : (
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">{fallback}</div>
      )}
    </div>
  )
}
