/**
 * Tải trang / khung soạn theo chunk, chịu được lúc vừa deploy bản mới.
 *
 * Mỗi lần deploy, tên file JS đổi (có mã băm). Tab đang mở bản cũ bấm sang trang khác sẽ đòi file cũ
 * không còn trên máy chủ → import lỗi → trước đây cả cây React sập thành màn trắng.
 * Ở đây: lỗi tải chunk thì tải lại trang một lần để lấy bản mới; vẫn lỗi thì ném ra cho PageErrorBoundary.
 */
import { lazy, type ComponentType } from 'react'

const KEY = 'derou.chunk-reload-at'

/** lỗi do không tải được file JS (khác với lỗi trong code) */
export function isChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.name} ${err.message}` : String(err)
  return /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically|ChunkLoadError|Unable to preload CSS|text\/html/i.test(msg)
}

/** tải lại trang để lấy bản mới — tối đa một lần mỗi 30 giây (tránh vòng lặp khi mạng hỏng thật) */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() =>
    load().catch((err: unknown) => {
      // đang tải lại trang: treo promise để không chớp màn lỗi trước khi trang mới lên
      if (isChunkError(err) && reloadForNewVersion()) return new Promise<{ default: T }>(() => {})
      throw err
    }),
  )
}
