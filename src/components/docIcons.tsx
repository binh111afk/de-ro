/**
 * Icon loại tài liệu — bộ nhận diện của "đề rõ":
 *
 *   đề thi    → nền xanh lam   (Nền xanh lam.svg)
 *   slide     → nền cam đất   (Nền cam đất.svg)
 *   bảng vẽ   → nền xanh lá   (Nền xanh lá.svg)
 *
 * Vẽ lại từ file SVG gốc (40×40) để chỉnh kích thước tuỳ ý.
 */
import type { ReactNode } from 'react'
import type { DocKind } from '@/data/docTypes'

interface DocIconProps {
  size?: number
  className?: string
}

function Frame({
  size,
  className,
  children,
}: DocIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Đề thi — tài liệu + bút chì (nền xanh lam). */
export function IconDocExam({ size = 40, className }: DocIconProps) {
  return (
    <Frame size={size} className={className}>
      <rect width="40" height="40" rx="10" fill="#EAF1FB" />
      <path
        d="M20.5 10.75H13.75C12.645 10.75 11.75 11.645 11.75 12.75V27.25C11.75 28.355 12.645 29.25 13.75 29.25H18"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M26.25 16.5L20.5 10.75V14.75C20.5 15.716 21.284 16.5 22.25 16.5H26.25ZM26.25 16.5V19"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M15.5 20H20M15.5 23.5H18"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M20.25 28.75L21.1 25.2L27 19.3C27.55 18.75 28.45 18.75 29 19.3C29.55 19.85 29.55 20.75 29 21.3L23.1 27.2L20.25 28.75Z"
        fill="#FBF4EF"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#B4532A"
      />
      <path
        d="M26 20.3L28 22.3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#B4532A"
      />
    </Frame>
  )
}

/** Slide — màn hình + biểu đồ cột (nền cam đất). */
export function IconDocSlide({ size = 40, className }: DocIconProps) {
  return (
    <Frame size={size} className={className}>
      <rect width="40" height="40" rx="10" fill="#FBECE5" />
      <path
        d="M12.75 11.5H27.25C28.3546 11.5 29.25 12.3954 29.25 13.5V22.5C29.25 23.6046 28.3546 24.5 27.25 24.5H12.75C11.6454 24.5 10.75 23.6046 10.75 22.5V13.5C10.75 12.3954 11.6454 11.5 12.75 11.5Z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M20 24.5V29M20 29H16M20 29H24"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M15.5 20V17.75M20 20V15M24.5 20V16.75"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#B4532A"
      />
    </Frame>
  )
}

/** Bảng vẽ — khung bảng, nét vẽ tay và bút chì (nền xanh lá). */
export function IconDocBoard({ size = 40, className }: DocIconProps) {
  return (
    <Frame size={size} className={className}>
      <rect width="40" height="40" rx="10" fill="#EAF4ED" />
      <path
        d="M12.75 10.75H27.25C28.3546 10.75 29.25 11.6454 29.25 12.75V27.25C29.25 28.3546 28.3546 29.25 27.25 29.25H12.75C11.6454 29.25 10.75 28.3546 10.75 27.25V12.75C10.75 11.6454 11.6454 10.75 12.75 10.75Z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M14.5 23.5C15.8 19.6 17.6 17.4 19 18.6C20.4 19.8 18.4 23.4 20.2 24C21.6 24.4 22.6 22.2 23.4 20.8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M22.4 18.2L26.6 14C27.15 13.45 28.05 13.45 28.6 14C29.15 14.55 29.15 15.45 28.6 16L24.4 20.2L21.9 20.7L22.4 18.2Z"
        fill="#F4E7DE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#B4532A"
      />
    </Frame>
  )
}

/** Icon theo loại tài liệu — mặc định là đề thi. */
export function DocIcon({
  kind = 'exam',
  size = 40,
  className,
}: DocIconProps & { kind?: DocKind }) {
  if (kind === 'slide') return <IconDocSlide size={size} className={className} />
  if (kind === 'board') return <IconDocBoard size={size} className={className} />
  return <IconDocExam size={size} className={className} />
}
