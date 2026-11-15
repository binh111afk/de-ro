/**
 * Icon trên slide, tải sau: thư viện ~300 icon Phosphor (`slideIconLibrary.ts`) nặng ~1 MB nên tách chunk,
 * trang slide mở trước rồi icon về sau. Bộ 27 icon của layout/AI (`slideAssets`) vẫn có ngay.
 */
import type { Icon } from '@phosphor-icons/react'
import { SLIDE_ASSETS, isSlideAssetId } from './slideAssets'

type Library = typeof import('./slideIconLibrary')
let lib: Library | null = null
let loading: Promise<Library> | null = null
const listeners = new Set<() => void>()

export function loadSlideIcons(): Promise<Library> {
  return (loading ??= import('./slideIconLibrary').then((m) => {
    lib = m
    listeners.forEach((fn) => fn())
    return m
  }))
}
export const slideIconsReady = (): boolean => lib !== null
export function subscribeSlideIcons(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
/** thư viện đầy đủ cho tab Icon; [] khi chưa tải */
export const iconLibrary = (): Library['ICON_LIBRARY'] => lib?.ICON_LIBRARY ?? []

/** Icon theo `assetId`; null khi id lạ hoặc thư viện chưa tải xong (tự kích tải). */
export function slideIconById(id: string | undefined): Icon | null {
  if (isSlideAssetId(id)) return SLIDE_ASSETS[id].icon
  if (!id) return null
  if (!lib) {
    void loadSlideIcons()
    return null
  }
  return lib.slideIconById(id)
}
