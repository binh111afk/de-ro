/** Menu chuột phải dùng chung (slide): hiện tại chỗ chuột, tự lật vào trong khung nhìn, có menu con. */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Portal } from '@/components/Portal'

export type MenuEntry =
  | { label: string; icon?: ReactNode; hint?: string; disabled?: boolean; onClick?: () => void; children?: MenuEntry[] }
  | 'sep'

export type MenuState = { x: number; y: number; items: MenuEntry[] } | null

/** bỏ vạch ngăn thừa ở đầu/cuối hoặc đứng liền nhau */
const tidy = (items: MenuEntry[]) => items.filter((it, i, a) => it !== 'sep' || (i > 0 && i < a.length - 1 && a[i - 1] !== 'sep'))

/** Một bảng menu đặt tại (x, y); `alt` = toạ độ x khi phải lật sang trái (menu con). */
function MenuPanel({ x, y, alt, items, onDone, root }: { x: number; y: number; alt?: number; items: MenuEntry[]; onDone: () => void; root?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<{ x: number; y: number } | null>(null)
  const [sub, setSub] = useState<{ index: number; x: number; y: number; alt: number } | null>(null)
  const timer = useRef<number>(0)

  useLayoutEffect(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const nx = x + r.width > window.innerWidth - 8 ? Math.max(8, (alt ?? x) - r.width) : x
    const ny = y + r.height > window.innerHeight - 8 ? Math.max(8, window.innerHeight - 8 - r.height) : y
    setPlace({ x: nx, y: ny })
  }, [x, y, alt, items])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const list = tidy(items)
  const openSub = (i: number, el: HTMLElement) => {
    window.clearTimeout(timer.current)
    const r = el.getBoundingClientRect()
    setSub({ index: i, x: r.right + 2, y: r.top - 6, alt: r.left - 2 })
  }

  return (
    <>
      <div
        ref={ref}
        className="rb-color-menu ctx-menu"
        role="menu"
        aria-label={root ? 'Menu chuột phải' : undefined}
        data-ctx-menu
        style={{ left: (place ?? { x }).x, top: (place ?? { y }).y, visibility: place ? 'visible' : 'hidden' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {list.map((it, i) =>
          it === 'sep' ? (
            <div key={`s${i}`} className="ctx-sep" role="separator" />
          ) : (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              aria-haspopup={it.children ? 'menu' : undefined}
              aria-expanded={it.children ? sub?.index === i : undefined}
              className={`rb-color-item ctx-item${sub?.index === i ? ' is-open' : ''}`}
              disabled={it.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={(e) => {
                if (it.children && !it.disabled) openSub(i, e.currentTarget)
                else {
                  // rời sang mục khác thì đóng menu con sau một nhịp, kẻo lướt chéo qua là mất
                  window.clearTimeout(timer.current)
                  timer.current = window.setTimeout(() => setSub(null), 180)
                }
              }}
              onClick={(e) => {
                if (it.children) {
                  openSub(i, e.currentTarget)
                  return
                }
                onDone()
                it.onClick?.()
              }}
            >
              <span className="ctx-item__icon">{it.icon}</span>
              <span className="rb-color-item__label">{it.label}</span>
              {it.hint && <kbd className="ctx-item__hint">{it.hint}</kbd>}
              {it.children && <ChevronRight className="ctx-item__chev" size={15} strokeWidth={1.8} />}
            </button>
          ),
        )}
      </div>
      {sub && list[sub.index] !== 'sep' && (list[sub.index] as { children?: MenuEntry[] }).children && (
        <div onMouseEnter={() => window.clearTimeout(timer.current)}>
          <MenuPanel x={sub.x} y={sub.y} alt={sub.alt} items={(list[sub.index] as { children: MenuEntry[] }).children} onDone={onDone} />
        </div>
      )}
    </>
  )
}

export function ContextMenu({ menu, onClose }: { menu: MenuState; onClose: () => void }) {
  useEffect(() => {
    if (!menu) return
    const close = (e: Event) => {
      if (e instanceof MouseEvent && (e.target as HTMLElement | null)?.closest?.('[data-ctx-menu]')) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu, onClose])

  if (!menu) return null
  return (
    <Portal>
      <MenuPanel key={`${menu.x},${menu.y}`} x={menu.x} y={menu.y} items={menu.items} onDone={onClose} root />
    </Portal>
  )
}
