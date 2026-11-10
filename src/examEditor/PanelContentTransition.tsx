/**
 * Chuyển đổi nội dung mượt giữa các tab của cột trái (Việc 2):
 * - Khi đổi tab trong khi panel đang mở: nội dung cũ mờ đi và dịch nhẹ 6-8px,
 *   nội dung mới hiện vào và trượt từ hướng tương ứng (theo thứ tự tab trên thanh).
 * - Không chớp trắng (cross-fade trong grid cùng ô), không giật chiều cao, không xô lệch trang giấy.
 * - Giữ vị trí cuộn riêng của từng tab khi chuyển qua lại.
 * - Tôn trọng prefers-reduced-motion: tắt chuyển động, đổi tức thì.
 * - Khi đóng/mở panel: giữ hoạt cảnh co giãn bề rộng hiện có, không chạy hiệu ứng dọc này.
 */
import React, { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from './NavRailIndicator'

export interface PanelContentTransitionProps {
  /** Tab đang mở (hoặc null khi panel đóng) */
  activeTab: string | null
  /** Thứ tự các tab từ trên xuống dưới (để tính chiều trượt: 'up' | 'down') */
  tabOrder: string[]
  /** Tắt hiệu ứng (ví dụ trên mobile) */
  disabled?: boolean
  /** Render nội dung cho từng tab */
  children: (tab: string) => React.ReactNode
}

interface ActivePaneState {
  tab: string
  direction: 'up' | 'down' | null
}

interface ExitingPaneState {
  tab: string
  direction: 'up' | 'down'
}

function findScrollElement(root: HTMLElement): HTMLElement | null {
  const known = root.querySelector<HTMLElement>('.nav-body, [class*="overflow-y-auto"], .overflow-y-auto')
  if (known) return known
  if (root.scrollHeight > root.clientHeight) return root
  const all = root.querySelectorAll<HTMLElement>('*')
  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    if (el.scrollHeight > el.clientHeight) {
      const oy = window.getComputedStyle(el).overflowY
      if (oy === 'auto' || oy === 'scroll') return el
    }
  }
  return null
}

function TabPane({
  tab,
  isExiting,
  direction,
  savedScrolls,
  children,
}: {
  tab: string
  isExiting: boolean
  direction: 'up' | 'down' | null
  savedScrolls: React.MutableRefObject<Record<string, number>>
  children: React.ReactNode
}) {
  const paneRef = useRef<HTMLDivElement>(null)

  // Bắt sự kiện cuộn từ bất kỳ vùng cuộn nào bên trong tab (capture phase)
  const handleScrollCapture = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement
    if (el && typeof el.scrollTop === 'number') {
      savedScrolls.current[tab] = el.scrollTop
    }
  }

  // Khôi phục vị trí cuộn khi tab này xuất hiện
  useLayoutEffect(() => {
    if (isExiting) return
    const targetTop = savedScrolls.current[tab]
    if (targetTop === undefined || targetTop === 0) return

    const apply = () => {
      const pane = paneRef.current
      if (!pane) return
      const scrollEl = findScrollElement(pane)
      if (scrollEl && scrollEl.scrollTop !== targetTop) {
        scrollEl.scrollTop = targetTop
      }
    }

    apply()
    const rafId = requestAnimationFrame(apply)
    const timer = setTimeout(apply, 30)
    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
    }
  }, [tab, isExiting, savedScrolls])

  let animClass = ''
  if (direction) {
    if (isExiting) {
      animClass = direction === 'up' ? 'panel-tab-exit-up' : 'panel-tab-exit-down'
    } else {
      animClass = direction === 'up' ? 'panel-tab-enter-up' : 'panel-tab-enter-down'
    }
  }

  return (
    <div
      ref={paneRef}
      onScrollCapture={handleScrollCapture}
      aria-hidden={isExiting ? true : undefined}
      className={cn(
        'panel-tab-pane col-start-1 row-start-1 flex h-full w-full min-h-0 flex-col overflow-hidden',
        animClass,
      )}
    >
      {children}
    </div>
  )
}

export function PanelContentTransition({
  activeTab,
  tabOrder,
  disabled = false,
  children,
}: PanelContentTransitionProps) {
  const reducedMotion = usePrefersReducedMotion()
  const isReduced = disabled || reducedMotion

  // Tab đang hiển thị
  const [current, setCurrent] = useState<ActivePaneState>(() => ({
    tab: activeTab ?? tabOrder[0] ?? '',
    direction: null,
  }))

  // Tab đang trượt biến mất (nếu có animation)
  const [exiting, setExiting] = useState<ExitingPaneState | null>(null)

  const savedScrolls = useRef<Record<string, number>>({})
  const prevActiveRef = useRef<string | null>(activeTab)
  const isMountedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true
      if (activeTab) {
        setCurrent({ tab: activeTab, direction: null })
      }
      prevActiveRef.current = activeTab
      return
    }

    const prevActive = prevActiveRef.current
    prevActiveRef.current = activeTab

    // Panel vừa đóng: không đổi tab, chỉ để panel co chiều rộng tự nhiên
    if (!activeTab) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setExiting(null)
      return
    }

    // Panel vừa mở lại từ trạng thái đóng: không chạy hiệu ứng dọc, chỉ hiện tab chọn
    if (!prevActive) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setExiting(null)
      setCurrent({ tab: activeTab, direction: null })
      return
    }

    // Bấm lại chính tab đang mở: không làm gì
    if (prevActive === activeTab) return

    // Chuyển giữa 2 tab khi panel ĐANG MỞ: chạy hiệu ứng trượt dọc mượt
    if (isReduced) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setExiting(null)
      setCurrent({ tab: activeTab, direction: null })
      return
    }

    const oldIdx = tabOrder.indexOf(prevActive)
    const newIdx = tabOrder.indexOf(activeTab)
    // Nếu tab mới nằm dưới tab cũ (newIdx > oldIdx): nội dung trượt từ dưới lên ('up')
    // Nếu tab mới nằm trên tab cũ (newIdx < oldIdx): nội dung trượt từ trên xuống ('down')
    const direction: 'up' | 'down' = newIdx >= 0 && oldIdx >= 0 && newIdx < oldIdx ? 'down' : 'up'

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setExiting({ tab: prevActive, direction })
    setCurrent({ tab: activeTab, direction })

    timerRef.current = setTimeout(() => {
      setExiting(null)
      setCurrent((cur) => (cur.tab === activeTab ? { tab: activeTab, direction: null } : cur))
      timerRef.current = null
    }, 200)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [activeTab, tabOrder, isReduced])

  return (
    <div className="panel-tab-stage relative grid flex-1 min-h-0 w-full grid-cols-1 grid-rows-1 overflow-hidden">
      {exiting && (
        <TabPane
          key={exiting.tab}
          tab={exiting.tab}
          isExiting={true}
          direction={exiting.direction}
          savedScrolls={savedScrolls}
        >
          {children(exiting.tab)}
        </TabPane>
      )}
      <TabPane
        key={current.tab}
        tab={current.tab}
        isExiting={false}
        direction={current.direction}
        savedScrolls={savedScrolls}
      >
        {children(current.tab)}
      </TabPane>
    </div>
  )
}
