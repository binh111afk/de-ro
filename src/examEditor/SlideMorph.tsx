/**
 * Vẽ chuyển trang Morph. Slide mới được dựng bình thường; mỗi phần tử ghép cặp diễn đường đi TỪ chỗ cũ,
 * còn nền cũ, phần bị bỏ và bản cũ của phần đổi mặt ngoài vẽ thành lớp "bóng" mờ dần phía dưới.
 * Kiểu chuyển động ở slide.css (`.slide-morph-*`).
 */
import { useLayoutEffect, useRef } from 'react'
import { slideBgStyle } from '@/lib/slideBackground'
import { startOf } from '@/lib/slideAnim'
import { boxShift, matchMorph, movesAsText, sameLook, textShift } from '@/lib/slideMorph'
import { cn } from '@/lib/cn'
import type { ResolvedTheme } from '@/lib/slideTheme'
import type { Slide, SlideElement } from '@/store/docs'
import { SlideElView } from './slideRender'

export const MORPH_MS = 700

export interface MorphPlan {
  /** id phần tử slide mới → phần tử cũ và có đổi mặt ngoài không */
  pairs: Map<string, { from: SlideElement; changed: boolean }>
  /** phần của slide cũ còn phải vẽ; `to` = đi theo phần mới trong lúc mờ dần; `hidden` = chỉ để đo cỡ chữ */
  ghosts: Array<{ el: SlideElement; to?: SlideElement; hidden?: boolean }>
}

/** `from`, `to` là hai slide đã qua `readableElements`. Phần chờ bấm không ghép: nó chưa hiện. */
export function morphPlan(from: SlideElement[], to: SlideElement[]): MorphPlan {
  const shown = to.filter((el) => startOf(el) === undefined)
  const matched = matchMorph(from, shown)
  const pairs: MorphPlan['pairs'] = new Map()
  const next = new Map<SlideElement, SlideElement>()
  for (const el of shown) {
    const prev = matched.get(el.id)
    if (!prev) continue
    pairs.set(el.id, { from: prev, changed: !sameLook(prev, el) })
    next.set(prev, el)
  }
  const ghosts = from.flatMap((el) => {
    const to = next.get(el)
    if (to) {
      const { changed } = pairs.get(to.id)!
      return changed || movesAsText(to) ? [{ el, to, hidden: !changed }] : []
    }
    return el.type === 'video' ? [] : [{ el }]
  })
  return { pairs, ghosts }
}

type Vars = React.CSSProperties & Record<`--${string}`, string | number>

const layer = (el: SlideElement): React.CSSProperties => ({ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: el.zIndex })

function textVars(on: SlideElement, other: SlideElement): Vars {
  const s = textShift(on, other)
  return { transformOrigin: s.origin, '--m-t': s.translate, '--m-s': s.scale, '--m-r': s.rotate }
}

function boxVars(on: SlideElement, other: SlideElement): Vars {
  const s = boxShift(on, other)
  return { display: 'contents', '--m-x': s.left, '--m-y': s.top, '--m-w': s.width, '--m-h': s.height, '--m-r': s.rotate }
}

/** Bọc một phần tử của slide mới đã có cặp. */
export function MorphIn({ el, from, changed, children }: { el: SlideElement; from: SlideElement; changed: boolean; children: React.ReactNode }) {
  const text = movesAsText(el)
  const ref = useRef<HTMLDivElement>(null)
  // Hộp chữ tự co cho vừa nên cỡ thật có thể khác `fontSize`: đo cả hai bản (FitText đã chạy xong) rồi chỉnh độ phóng.
  useLayoutEffect(() => {
    const own = ref.current
    if (!text || !own) return
    const ghost = own.parentElement?.querySelector<HTMLElement>(`[data-morph-ghost="${CSS.escape(el.id)}"]`)
    const size = (node?: Element | null) => parseFloat((node as HTMLElement | null)?.style.fontSize ?? '')
    const ratio = size(ghost?.firstElementChild) / size(own.firstElementChild)
    if (!ghost || !Number.isFinite(ratio) || ratio <= 0) return
    own.style.setProperty('--m-s', String(ratio))
    ghost.style.setProperty('--m-s', String(1 / ratio))
  })
  return (
    <div ref={ref} className={cn(text ? 'slide-morph-move' : 'slide-morph-box', changed && 'is-new')} style={text ? { ...layer(el), ...textVars(el, from) } : boxVars(el, from)}>
      {children}
    </div>
  )
}

/** Nền cũ và các phần của slide cũ, đặt trước các phần tử của slide mới. */
export function MorphGhosts({ plan, from, to, theme }: { plan: MorphPlan; from: Slide; to: Slide; theme: ResolvedTheme }) {
  return (
    <div className="slide-morph-ghosts" aria-hidden>
      {(from.background !== to.background || from.bgImage !== to.bgImage) && (
        <div className="slide-morph-gone" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...slideBgStyle(from) }} />
      )}
      {plan.ghosts.map(({ el, to: next, hidden }) => {
        const text = movesAsText(el)
        const className = !next ? 'slide-morph-gone' : text ? 'slide-morph-move-out' : 'slide-morph-box-out'
        const style = !next ? layer(el) : text ? { ...layer(el), ...textVars(el, next) } : boxVars(el, next)
        return (
          <div key={el.id} className={className} style={hidden ? { ...style, visibility: 'hidden' } : style} data-morph-ghost={next?.id}>
            <SlideElView el={el} theme={theme} />
          </div>
        )
      })}
    </div>
  )
}
