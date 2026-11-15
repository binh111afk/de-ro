import { Suspense, type ComponentProps } from 'react'
import { lazyPage } from '@/lib/lazyPage'
import type { ToolsPanel as Panel } from './ToolsPanel'

const Lazy = lazyPage(() => import('./ToolsPanel').then((m) => ({ default: m.ToolsPanel })))

/** Panel Công cụ (27 công cụ vẽ hình, ~80 KB gzip) tải khi mở lần đầu, để trang soạn/bảng vẽ hiện trước. */
export function ToolsPanel(props: ComponentProps<typeof Panel>) {
  return (
    <Suspense fallback={<p className="px-3 py-4 text-[13px] text-ink-3">Đang tải công cụ…</p>}>
      <Lazy {...props} />
    </Suspense>
  )
}
