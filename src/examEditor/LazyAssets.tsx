/** Đồ hoạ và icon slide tải sau (xem `loadGraphics`, `loadSlideIcons`): vẽ trống trước, về là hiện. */
import { useSyncExternalStore, type CSSProperties } from 'react'
import { graphicMarkup, graphicsReady, subscribeGraphics } from '@/lib/slideGraphics'
import { slideIconById, slideIconsReady, subscribeSlideIcons } from '@/lib/slideIcons'

export const useGraphicsReady = () => useSyncExternalStore(subscribeGraphics, graphicsReady)
export const useSlideIconsReady = () => useSyncExternalStore(subscribeSlideIcons, slideIconsReady)

/** Hình đồ hoạ phủ kín hộp cha. SVG do chính app sinh từ file thiết kế (không phải dữ liệu người dùng) nên nhúng trực tiếp là an toàn. */
export function GraphicFill({ id, ink, fill, className = 'h-full w-full' }: { id: string; ink?: string; fill?: string; className?: string }) {
  useGraphicsReady()
  return <div className={className} dangerouslySetInnerHTML={{ __html: graphicMarkup(id, ink, fill) }} />
}

/** Icon slide (Phosphor duotone); chưa tải thì giữ chỗ bằng khối trống cùng kích thước. */
export function SlideIcon({ id, style, className }: { id: string | undefined; style?: CSSProperties; className?: string }) {
  useSlideIconsReady()
  const Icon = slideIconById(id)
  return Icon ? <Icon size="100%" weight="duotone" style={style} className={className} /> : <span style={{ display: 'block', ...style }} className={className} />
}
