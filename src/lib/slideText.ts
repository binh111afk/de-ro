/**
 * Hình học hộp chữ của slide.
 *
 * Hộp chữ không hiển thị đúng chiều cao `el.h` cố định: khung chọn phải ôm theo
 * nội dung (giống text box tự co của PowerPoint). `el.h` chỉ là mức trần —
 * người dùng kéo tay nắm dọc thì đặt `fixedHeight` và chiều cao đó mới là cố định.
 *
 * Công thức đo nằm ở `slideMeasure.ts` để layout engine, hàm này và `FitText`
 * dùng chung một nguồn (chặng 1 — typography engine).
 */
import type { SlideElement } from '@/store/docs'
import { textBoxHeight } from './slideMeasure'

export { textBoxHeight } from './slideMeasure'

/**
 * Chiều cao hiển thị của phần tử. Chữ tự co theo nội dung nhưng không vượt quá
 * `el.h`; hộp rỗng giữ nguyên chiều cao để vẫn chọn/nhập được.
 */
export function elementHeight(el: SlideElement): number {
  if (el.type !== 'text' || el.fixedHeight) return el.h
  const estimate = textBoxHeight(
    el.text ?? '',
    el.w,
    el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6),
    el.lineHeight ?? 1.25,
    { weight: el.fontWeight ?? (el.variant === 'body' ? 500 : 600), letterSpacing: el.letterSpacing },
  )
  return estimate > 0 ? Math.min(el.h, Math.max(4, estimate)) : el.h
}
