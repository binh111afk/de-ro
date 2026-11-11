import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Đưa modal/ngăn kéo ra thẳng `body`: nằm trong khung có `transform` (.page-enter) thì `fixed` sẽ tính theo khung đó, không phủ hết màn hình. */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
