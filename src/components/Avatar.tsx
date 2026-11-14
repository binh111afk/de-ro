import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

/** Ảnh đại diện tròn; chưa có ảnh hoặc ảnh lỗi (`onError`) thì hiện chữ cái đầu của tên. */
export function Avatar({
  src,
  name,
  className,
  fallbackClassName,
}: {
  src?: string | null
  name?: string | null
  className?: string
  fallbackClassName?: string
}) {
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [src])

  const letter = (name ?? '').trim().charAt(0).toUpperCase() || '?'
  const showImg = Boolean(src && !broken)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none',
        showImg ? 'bg-sunken' : 'bg-clay-tint font-semibold uppercase text-clay',
        className,
        !showImg && fallbackClassName,
      )}
    >
      {showImg ? (
        <img
          src={src!}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="block size-full object-cover"
        />
      ) : (
        letter
      )}
    </span>
  )
}
