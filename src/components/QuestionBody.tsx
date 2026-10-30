import { useState } from 'react'
import type { Question } from '@/data/types'
import { cn } from '@/lib/cn'
import { MathText } from './MathText'

const DEFAULT_WIDTH = 60
/** Chưa chỉnh độ rộng: ảnh không to quá chừng này (px) dù khung rất rộng. Kéo thanh độ rộng thì vượt được. */
const DEFAULT_MAX_PX = 420

/**
 * Đề bài của một câu kèm ảnh: ảnh trên / dưới đề bài (xếp dọc) hoặc bên trái / phải (cạnh đề bài; màn hẹp tự xếp dọc).
 * Ảnh không bao giờ phóng to quá kích thước gốc.
 */
export function QuestionBody({ q, className }: { q: Pick<Question, 'prompt' | 'image'>; className?: string }) {
  const [natural, setNatural] = useState<number>()
  const img = q.image
  const text = <MathText as="div">{q.prompt}</MathText>
  if (!img?.src) return <div className={className}>{text}</div>

  const width = img.width ?? DEFAULT_WIDTH
  const pos = img.position ?? 'bottom'
  const side = pos === 'left' || pos === 'right'
  // độ rộng ảnh: % khung (hoặc, khi chưa chỉnh, tối đa DEFAULT_MAX_PX), không vượt kích thước gốc
  const cap = [img.width ? null : `${DEFAULT_MAX_PX}px`, natural ? `${natural}px` : null].filter(Boolean)
  const size = cap.length ? `min(${width}%, ${cap.join(', ')})` : `${width}%`
  const pic = (
    <img
      src={img.src}
      alt={img.alt ?? ''}
      loading="lazy"
      onLoad={(e) => setNatural(e.currentTarget.naturalWidth)}
      className="h-auto max-w-full rounded-[6px] bg-white object-contain"
      style={side ? { width: '100%' } : { width: size }}
    />
  )
  if (side) {
    return (
      <div
        className={cn('flex flex-col gap-4 sm:items-start', pos === 'left' ? 'sm:flex-row' : 'sm:flex-row-reverse', className)}
        style={{ '--pic': size } as React.CSSProperties}
      >
        <div className="max-w-full sm:shrink-0 sm:basis-[var(--pic)]" style={natural ? { maxWidth: `${natural}px` } : undefined}>
          {pic}
        </div>
        <div className="min-w-0 flex-1">{text}</div>
      </div>
    )
  }
  return (
    <div className={cn('space-y-3', className)}>
      {pos === 'top' ? pic : null}
      {text}
      {pos === 'bottom' ? pic : null}
    </div>
  )
}
