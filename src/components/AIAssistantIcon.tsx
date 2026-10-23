/**
 * Icon AI động — Lottie "Trợ lý giấy" (không nền).
 *
 * Nguồn gốc: file `ai-assistant.json` (Lottie 5.7, 64×64, 60fps, 240 frame ≈ 4s
 * loop) do người dùng cung cấp. JSON được import **trực tiếp** từ `src/assets`
 * nên Vite đóng gói sẵn — không có request mạng nào lúc chạy.
 *
 * Timing, easing và hình dạng giữ nguyên theo file gốc (không tự chỉnh).
 * Nếu hệ điều hành bật `prefers-reduced-motion`, animation dừng ở frame đầu.
 *
 * LƯU Ý về kích thước: bản vẽ trong file gốc chỉ chiếm khoảng 31/64 chiều rộng
 * viewBox (phần còn lại là lề trong suốt). Nếu render đúng bằng `size` thì hình
 * thực tế chỉ còn ~48% cạnh đó — ở 22px là khoảng 10px, quá nhỏ để nhìn ra.
 * Vì vậy hình được phóng thêm qua `scale` quanh tâm; `size` vẫn là kích thước
 * mà hình chiếm trong bố cục.
 */
import { useEffect, useRef, useState } from 'react'
import { Lottie, type LottieHandle } from 'lottie-react'
import animationData from '@/assets/ai-assistant.json'
import { cn } from '@/lib/cn'

export interface AIAssistantIconProps {
  /** kích thước hình chiếm trong bố cục, đơn vị px */
  size?: number
  /** có lặp vô hạn không (mặc định có) */
  loop?: boolean
  className?: string
  /**
   * hệ số phóng hình so với khung `size`.
   * Mặc định 1.55 — bù lại phần lề trong suốt của file gốc.
   */
  scale?: number
}

/** Theo dõi `prefers-reduced-motion` của hệ điều hành. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

export function AIAssistantIcon({
  size = 24,
  loop = true,
  className,
  scale = 1.55,
}: AIAssistantIconProps) {
  const reduced = usePrefersReducedMotion()
  const lottieRef = useRef<LottieHandle>(null)

  // Bật/tắt reduced-motion giữa chừng: dừng ở frame đầu hoặc chạy lại.
  useEffect(() => {
    const anim = lottieRef.current
    if (!anim) return
    if (reduced) {
      anim.stop()
      anim.seek(0)
    } else if (loop) {
      anim.play()
    }
  }, [reduced, loop])

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* lớp trung gian để phóng quanh tâm mà không ảnh hưởng bố cục */}
      <span
        className="flex h-full w-full items-center justify-center"
        style={{ transform: `scale(${scale})` }}
      >
        <Lottie
          lottieRef={lottieRef}
          src={animationData}
          loop={!reduced && loop}
          autoplay={!reduced}
          className="h-full w-full"
          style={{ width: size, height: size }}
        />
      </span>
    </span>
  )
}
