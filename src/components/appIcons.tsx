/**
 * Icon dùng chung toàn web, lấy theo bảng vẽ: thùng rác (thanh nổi chọn hình) và thùng sơn (công cụ tô màu).
 * Mọi chỗ xoá / tô màu dùng hai icon này để đồng bộ.
 */
export const TRASH_D = 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6'
export const BUCKET_D = 'M10.6 4.6L19 13l-7.3 7.3a1.6 1.6 0 0 1-2.2 0l-6.2-6.2a1.6 1.6 0 0 1 0-2.2zM3 13h15.5M5.4 9.8a3.6 3.6 0 1 1 5.2-5.2M20.5 15.5s2 2.3 2 3.6a2 2 0 1 1-4 0c0-1.3 2-3.6 2-3.6z'

type Props = { size?: number; className?: string; strokeWidth?: number }

function Line({ d, size = 24, className, strokeWidth = 1.6 }: Props & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}

/** Thùng rác (cùng tham số kiểu lucide: size, className, strokeWidth) */
export function TrashIcon(props: Props) {
  return <Line d={TRASH_D} {...props} />
}

/** Thùng sơn */
export function BucketIcon(props: Props) {
  return <Line d={BUCKET_D} {...props} />
}
