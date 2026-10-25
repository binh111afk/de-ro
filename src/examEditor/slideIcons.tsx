/**
 * Icon riêng của trình soạn slide — port từ GenOffice (Apache-2.0):
 * `_ref/genoffice/apps/slides/src/renderer/components/icons.tsx`.
 *
 * Bộ icon docs (`./icons`) dùng canvas 16×16, còn bộ slide gốc dùng canvas
 * 24×24 với `pinnedStroke` giữ nét ~1.5px khi phóng to. Tách file để không trộn
 * hai hệ toạ độ; các icon trùng tên đã có trong bộ docs thì dùng lại bộ docs.
 */
import type { ReactNode } from 'react'

interface IconProps {
  size?: number
}

function pinnedStroke(size: number): number {
  const painted = size >= 20 ? 1.5 : size >= 13 ? 1.25 : 1.1
  return (painted * 24) / size
}

function Svg({ size = 24, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={pinnedStroke(size)}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/* ---------------------------------------------------------------- *
 * AI feature glyphs
 * ---------------------------------------------------------------- */
function AiFeatureSvg({ size = 24, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconAiBeautify(props: IconProps) {
  return (
    <AiFeatureSvg {...props}>
      <path d="M10.49 15.09c-.58-.54-1.37-.57-1.37-.57s-.75-.08-1.26.27c-.83.57-.85 1.74-.86 1.91-.02.53.02 1.16-.3 1.72-.47.83-1.71 1.17-1.71 1.17s.21.26.51.41c0 0 .96.55 2.94.08.54-.13 1.14-.29 1.62-.6.59-.37 1.03-.9 1.15-1.16.51-1.11.25-2.33-.72-3.23Z" />
      <path d="M18.99 4.58c-.01-.19-.21-.28-.21-.28s-.22-.04-.4.05c-.31.16-.76.35-2.95 2.85-1.52 1.73-3.41 4.06-4.5 5.39-.82.98-.89 1.69-.74 2.09.03.08.4.38.74.6.25.16.42.26.7.28.45.03.89-.28.89-.28s.24-.2.6-.68c.74-.97 2.04-2.83 3.18-4.62 1.44-2.26 2.54-4.62 2.54-4.62s.17-.46.16-.76Z" />
      <path d="M7 4l.22.6c.29.78.44 1.17.72 1.46.29.29.68.43 1.46.72L10 7l-.6.22c-.78.29-1.17.44-1.46.72-.29.29-.43.68-.72 1.46L7 10l-.22-.6c-.29-.78-.44-1.17-.72-1.46-.29-.29-.68-.43-1.46-.72L4 7l.6-.22c.78-.29 1.17-.44 1.46-.72.29-.29.43-.68.72-1.46L7 4Z" />
      <path d="M18 16l.15.4c.19.52.29.78.48.97.19.19.45.29.97.48L20 18l-.4.15c-.52.19-.78.29-.97.48-.19.19-.29.45-.48.97L18 20l-.15-.4c-.19-.52-.29-.78-.48-.97-.19-.19-.45-.29-.97-.48L16 18l.4-.15c.52-.19.78-.29.97-.48.19-.19.29-.45.48-.97L18 16Z" />
    </AiFeatureSvg>
  )
}

export function IconAiFactCheck(props: IconProps) {
  return (
    <AiFeatureSvg {...props}>
      <circle cx="11.9997" cy="12.0004" r="9.53571" />
      <path
        d="M18.2407 8.20112C18.5754 7.86675 19.118 7.86668 19.4526 8.20112C19.7873 8.53587 19.7873 9.07931 19.4526 9.41402L14.0727 14.7929C13.9119 14.9535 13.6936 15.044 13.4663 15.0439C13.2392 15.0437 13.0213 14.9535 12.8608 14.7929L11.3921 13.3222C11.1247 13.0544 11.0714 12.6529 11.2319 12.332L8.70555 14.8593C8.37087 15.194 7.82741 15.1939 7.49266 14.8593L4.53563 11.9023C4.20123 11.5676 4.20121 11.025 4.53563 10.6904C4.87039 10.3559 5.41388 10.3557 5.74852 10.6904L8.0991 13.041L12.8725 8.26753C13.2072 7.93333 13.7498 7.93331 14.0845 8.26753C14.4189 8.60218 14.4188 9.14572 14.0845 9.48042L11.6147 11.9492C11.936 11.7883 12.3371 11.8423 12.605 12.1103L13.4673 12.9736L18.2407 8.20112Z"
        fill="currentColor"
        stroke="none"
      />
    </AiFeatureSvg>
  )
}

export function IconAiImage(props: IconProps) {
  return (
    <AiFeatureSvg {...props}>
      <path d="M7.55042 9.62398C8.33741 9.62398 8.97538 8.986 8.97538 8.19902C8.97538 7.41203 8.33741 6.77405 7.55042 6.77405C6.76343 6.77405 6.12545 7.41203 6.12545 8.19902C6.12545 8.986 6.76343 9.62398 7.55042 9.62398Z" />
      <path d="M20.8474 11.05C20.8496 11.4966 20.8496 11.9708 20.8496 12.475C20.8496 16.7293 20.8496 18.8565 19.528 20.1782C18.2063 21.4998 16.0791 21.4998 11.8248 21.4998C7.57047 21.4998 5.44331 21.4998 4.12165 20.1782C2.8 18.8565 2.8 16.7293 2.8 12.475C2.8 8.22066 2.8 6.0935 4.12165 4.77184C5.44331 3.4502 7.57047 3.4502 11.8248 3.4502C12.3289 3.4502 12.8032 3.4502 13.2498 3.45239" />
      <path d="M18.4756 2.49915L18.7206 3.16131C19.0419 4.02958 19.2026 4.46372 19.5193 4.78041C19.836 5.09712 20.2701 5.25776 21.1384 5.57905L21.8006 5.82407L21.1384 6.06909C20.2701 6.39038 19.836 6.55103 19.5193 6.86772C19.2026 7.18442 19.0419 7.61856 18.7206 8.48683L18.4756 9.14899L18.2306 8.48683C17.9093 7.61856 17.7487 7.18442 17.432 6.86772C17.1153 6.55103 16.6811 6.39038 15.8128 6.06909L15.1507 5.82407L15.8128 5.57905C16.6811 5.25776 17.1153 5.09712 17.432 4.78041C17.7487 4.46372 17.9093 4.02958 18.2306 3.16131L18.4756 2.49915Z" />
      <path d="M5.17599 21.0236C9.32974 16.06 13.9862 9.51375 20.8483 13.9391" />
    </AiFeatureSvg>
  )
}

/* ---------------------------------------------------------------- *
 * Editing / slide lifecycle
 * ---------------------------------------------------------------- */
export function IconFind(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.13" cy="10.13" r="5.61" />
      <path d="M 14.41 14.41 L 19.48 19.48" />
    </Svg>
  )
}

export function IconNewSlide(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.53" y="6.4" width="14.94" height="11.21" rx="0.62" />
      <path d="M 4.53 10.13 h 14.94" />
      <path d="M 13.25 10.13 V 17.6" />
    </Svg>
  )
}

export function IconSlideLayout(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.53" y="5.15" width="14.94" height="13.69" rx="1" />
      <path d="M 7.64 8.89 h 8.72" />
      <rect x="7.64" y="11.38" width="3.74" height="4.36" rx="0.5" />
      <rect x="12.62" y="11.38" width="3.74" height="4.36" rx="0.5" />
    </Svg>
  )
}

export function IconPlayCurrent(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.49" y="5.65" width="15.02" height="10.4" rx="0.92" />
      <path d="M 10.27 8.3 v 5.08 l 4.39 -2.54 z" fill="currentColor" stroke="none" />
      <path d="M 12 16.04 v 2.31 M 9.11 18.35 h 5.78" />
    </Svg>
  )
}

export function IconPlayFromStart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19.51 11.3 V6.57 a0.92 0.92 0 0 0 -0.92 -0.92 H5.41 a0.92 0.92 0 0 0 -0.92 0.92 v8.56 a0.92 0.92 0 0 0 0.92 0.92 h8.25" />
      <path d="M10.85 14.2 l1.89 1.85 -1.89 1.85" />
      <path d="M15.3 12.7 L20.9 16.05 L15.3 19.4 Z" />
    </Svg>
  )
}

export function IconApplyAll(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9.1" y="5.25" width="10.2" height="7" rx="0.92" />
      <rect x="4.7" y="9.15" width="12.2" height="9.6" rx="0.92" fill="var(--surface, #fff)" />
      <path d="M 8 14.15 l 2.3 2.3 l 4.6 -4.6" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- *
 * Object align / flip
 * ---------------------------------------------------------------- */
export function IconObjAlignLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 5.65 4.49 v 15.02" />
      <rect x="7.96" y="6.23" width="10.4" height="4.16" rx="0.69" />
      <rect x="7.96" y="13.62" width="6.35" height="4.16" rx="0.69" />
    </Svg>
  )
}

export function IconObjAlignCenterH(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 12 4.49 v 15.02" />
      <rect x="6.23" y="6.23" width="11.55" height="4.16" rx="0.69" />
      <rect x="8.77" y="13.62" width="6.47" height="4.16" rx="0.69" />
    </Svg>
  )
}

export function IconObjAlignRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 18.35 4.49 v 15.02" />
      <rect x="5.65" y="6.23" width="10.4" height="4.16" rx="0.69" />
      <rect x="9.69" y="13.62" width="6.35" height="4.16" rx="0.69" />
    </Svg>
  )
}

export function IconObjAlignTop(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 4.49 5.65 h 15.02" />
      <rect x="6.23" y="7.96" width="4.16" height="10.4" rx="0.69" />
      <rect x="13.62" y="7.96" width="4.16" height="6.35" rx="0.69" />
    </Svg>
  )
}

export function IconObjAlignMiddle(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6.23" y="6.23" width="4.16" height="11.55" rx="0.69" />
      <rect x="13.62" y="8.77" width="4.16" height="6.47" rx="0.69" />
      <path d="M 4.49 12 H 6.23 M 10.38 12 h 3.23 M 17.77 12 h 1.73" />
    </Svg>
  )
}

export function IconObjAlignBottom(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 4.49 18.35 h 15.02" />
      <rect x="6.23" y="5.65" width="4.16" height="10.4" rx="0.69" />
      <rect x="13.62" y="9.69" width="4.16" height="6.35" rx="0.69" />
    </Svg>
  )
}

export function IconObjFlipH(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 12 4.49 v 15.02" strokeDasharray="2.4 2.1" />
      <path d="M 9.1 6.9 v 10.2 h -4.4 z M 14.9 6.9 v 10.2 h 4.4 z" />
    </Svg>
  )
}

export function IconObjFlipV(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 4.49 12 h 15.02" strokeDasharray="2.4 2.1" />
      <path d="M 6.9 9.1 h 10.2 v -4.4 z M 6.9 14.9 h 10.2 v 4.4 z" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- *
 * Shape gallery + fill
 * ---------------------------------------------------------------- */
export function IconRect(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.49" y="6.8" width="15.02" height="10.4" />
    </Svg>
  )
}

export function IconRoundRect(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.49" y="6.8" width="15.02" height="10.4" rx="2.89" />
    </Svg>
  )
}

export function IconEllipse(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="12" rx="7.51" ry="5.2" />
    </Svg>
  )
}

export function IconShapeStyle(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5" width="11" height="9" rx="1.5" />
      <rect x="9.5" y="10.5" width="10.5" height="8.5" rx="1.5" fill="var(--surface)" />
    </Svg>
  )
}

export function IconFillColor(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M 7.6 10.4 12.6 5.4 l 5.6 5.6 -6.3 6.3 a 1.4 1.4 0 0 1 -2 0 L 5.6 13 a 1.4 1.4 0 0 1 0 -2 z" />
      <path d="M 12.6 5.4 10.9 3.7" />
      <path d="M 19.7 15.4 c 0.9 1.2 1.5 2.2 1.5 3 a 1.5 1.5 0 0 1 -3 0 c 0 -0.8 0.6 -1.8 1.5 -3 z" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/* ---------------------------------------------------------------- *
 * Transition gallery
 * ---------------------------------------------------------------- */
export function IconTransNone(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.75" y="6" width="14.5" height="12" rx="1.5" />
      <path d="M6.5 16.5 17.5 7.5" />
    </Svg>
  )
}

export function IconTransFade(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.75" y="4.75" width="11" height="9.5" rx="1.4" strokeDasharray="2.4 2.2" />
      <rect x="8.25" y="9.75" width="11" height="9.5" rx="1.4" />
    </Svg>
  )
}

export function IconTransPush(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4.75" y="6" width="14.5" height="12" rx="1.5" />
      <path d="M12 15.5v-6M9.25 12.25 12 9.5l2.75 2.75" />
    </Svg>
  )
}

export function IconTransZoom(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4.75h5.25V10M19 5 13.75 10.25" />
      <path d="M10 19.25H4.75V14M5 19 10.25 13.75" />
    </Svg>
  )
}
