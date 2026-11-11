import { useState } from 'react'

/** Ngăn kéo bên phải của admin: trượt vào khi mở, trượt ra hết (200ms của .drawer-out) rồi mới gỡ. */
export function useDrawerExit(onClose: () => void) {
  const [closing, setClosing] = useState(false)
  const close = () => {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 200)
  }
  return {
    close,
    backdropClass: closing ? 'backdrop-out' : 'backdrop-in',
    panelClass: closing ? 'drawer-out' : 'drawer-in',
  }
}
