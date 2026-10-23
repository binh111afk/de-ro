/**
 * Icon loại tài liệu — bộ nhận diện của "đề rõ":
 *
 *   đề thi    → nền xanh lam   (Nền xanh lam.svg)
 *   slide     → nền cam đất   (Nền cam đất.svg)
 *   bảng tính → nền xanh lá   (Nền xanh lá.svg)
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

/** Bảng tính — lưới ô (nền xanh lá). */
export function IconDocSheet({ size = 40, className }: DocIconProps) {
  return (
    <Frame size={size} className={className}>
      <rect width="40" height="40" rx="10" fill="#EAF4ED" />
      <path
        d="M12.75 10.75H27.25C28.355 10.75 29.25 11.645 29.25 12.75V16.75H10.75V12.75C10.75 11.645 11.645 10.75 12.75 10.75Z"
        fill="#F4E7DE"
      />
      <path
        d="M12.75 10.75H27.25C28.3546 10.75 29.25 11.6454 29.25 12.75V27.25C29.25 28.3546 28.3546 29.25 27.25 29.25H12.75C11.6454 29.25 10.75 28.3546 10.75 27.25V12.75C10.75 11.6454 11.6454 10.75 12.75 10.75Z"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M10.75 16.75H17M17 16.75H23.25M17 16.75V23M23.25 16.75H29.25M23.25 16.75V23M10.75 23H17M17 23H23.25M17 23V29.25M23.25 23H29.25M23.25 23V29.25"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#15191C"
      />
      <path
        d="M23.25 23H29.25V27.25C29.25 28.355 28.355 29.25 27.25 29.25H23.25V23Z"
        fill="#F4E7DE"
        strokeWidth="1.75"
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
  if (kind === 'sheet') return <IconDocSheet size={size} className={className} />
  return <IconDocExam size={size} className={className} />
}
