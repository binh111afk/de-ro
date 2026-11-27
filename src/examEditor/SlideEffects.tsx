/**
 * Hiệu ứng slide: bảng "Hiệu ứng" ở cột trái (cả trang, từng đối tượng, chuyển trang), lớp bọc diễn
 * hiệu ứng vào trang và bản xem thử đè lên khung soạn. Logic dữ liệu ở lib/slideAnim.ts.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { Button, Checkbox } from '@/components/ui'
import { Segmented } from '@/components/Segmented'
import { SiteSelect } from '@/components/SiteSelect'
import { cn } from '@/lib/cn'
import { ANIM_EFFECTS, ANIM_SPEEDS, HIDDEN_POSE, pageDelays, pageState, setPageAnim, startOf, type ElementAnimAction, type PageMode } from '@/lib/slideAnim'
import { slideBgStyle } from '@/lib/slideBackground'
import { readableElements } from '@/lib/slideContrast'
import { settleDeck } from '@/lib/slideMorph'
import type { ResolvedTheme } from '@/lib/slideTheme'
import type { Slide, SlideElement } from '@/store/docs'
import { MORPH_MS, MorphGhosts, MorphIn, morphPlan } from './SlideMorph'
import { SlideElView } from './slideRender'

type Anim = NonNullable<SlideElement['anim']>
type Transition = NonNullable<Slide['transition']>

/** bản xem thử: slide như khi đã áp lựa chọn; `transition` = chỉ diễn chuyển trang */
export interface EffectsPreviewSpec {
  slide: Slide
  transition?: boolean
  /** slide đứng trước, để diễn Morph */
  from?: Slide
}

export interface SlideEffectsApi {
  slide: Slide | null
  selected: SlideElement | null
  /** slide đứng ngay trước (Morph cần có) */
  previous: Slide | null
  onElement: (action: ElementAnimAction) => void
  onPage: (anim: Anim | 'none' | null, mode: PageMode, ms: number) => void
  onPageAll: () => void
  onTransition: (transition: Transition, allSlides: boolean) => void
  onClear: (allSlides: boolean) => void
  onPreview: (preview: EffectsPreviewSpec | null) => void
}

/** đi qua context để cột trái (đã memo) không vẽ lại mỗi lần sửa slide */
export const SlideEffectsContext = createContext<SlideEffectsApi | null>(null)

/** Lớp phủ cả slide bọc một phần tử, diễn hiệu ứng vào một lần. */
export function AnimLayer({ el, anim, ms = 450, delay, children }: { el: SlideElement; anim: Anim; ms?: number; delay: number; children: React.ReactNode }) {
  // khối phủ kín trang chỉ hiện dần: trượt / xoay sẽ lộ nền phía sau
  const pose = HIDDEN_POSE[el.w >= 99 && el.h >= 99 ? 'fade' : anim] ?? {}
  return (
    <div
      className="slide-page-in"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: el.zIndex,
        transformOrigin: `${el.x + el.w / 2}% ${el.y + el.h / 2}%`,
        animationDuration: `${ms}ms`,
        animationDelay: `${delay}ms`,
        ['--pa-t' as string]: pose.translate ?? '0 0',
        ['--pa-s' as string]: pose.scale ?? '1',
        ['--pa-r' as string]: pose.rotate ?? '0deg',
      }}
    >
      {children}
    </div>
  )
}

const CLICK_GAP = 350

/** Diễn thử ngay trên khung soạn (đè bản thật), xong tự tắt. */
export function EffectsPreview({ preview, theme, decor, onDone }: { preview: EffectsPreviewSpec; theme: ResolvedTheme; decor: React.CSSProperties; onDone: () => void }) {
  const { transition } = preview
  const from = transition && preview.slide.transition === 'morph' && !preview.from?.html ? preview.from : undefined
  const slide = from ? settleDeck([from, preview.slide])[1] : preview.slide
  const elements = readableElements(slide, theme)
  const morph = from ? morphPlan(readableElements(from, theme), elements) : null
  const delays = pageDelays(slide.elements)
  const plan = (el: SlideElement) => {
    if (transition) return null
    if (slide.pageAnim && delays.has(el.id)) return { anim: slide.pageAnim.anim, ms: slide.pageAnim.ms, delay: delays.get(el.id)! }
    const start = startOf(el)
    return start === undefined ? null : { anim: el.anim ?? ('fade' as const), ms: el.animMs, delay: (start - 1) * CLICK_GAP }
  }
  const total = slide.elements.reduce((max, el) => {
    const p = plan(el)
    return p ? Math.max(max, p.delay + (p.ms ?? 450)) : max
  }, morph ? MORPH_MS : 450)
  useEffect(() => {
    const t = window.setTimeout(onDone, total + 500)
    return () => window.clearTimeout(t)
  }, [preview, total, onDone])
  return (
    <div
      className={cn('slide-frame absolute inset-0 overflow-hidden', transition && !morph && slide.transition && slide.transition !== 'none' && `slide-enter-${slide.transition}`)}
      data-decor={theme.decor}
      style={{ ...slideBgStyle(slide), ...decor, zIndex: 9998, pointerEvents: 'none' }}
      aria-hidden
    >
      {morph && <MorphGhosts plan={morph} from={from!} to={slide} theme={theme} />}
      {elements.map((el) => {
        const pair = morph?.pairs.get(el.id)
        if (pair) {
          return (
            <MorphIn key={el.id} el={el} from={pair.from} changed={pair.changed}>
              <SlideElView el={el} theme={theme} />
            </MorphIn>
          )
        }
        const p = morph ? { anim: 'fade' as const, ms: 400, delay: MORPH_MS / 2 } : plan(el)
        return p ? (
          <AnimLayer key={el.id} el={el} anim={p.anim} ms={p.ms} delay={p.delay}>
            <SlideElView el={el} theme={theme} />
          </AnimLayer>
        ) : (
          <SlideElView key={el.id} el={el} theme={theme} />
        )
      })}
    </div>
  )
}

const TRANSITIONS: Array<{ id: Transition; label: string; demo: string }> = [
  { id: 'none', label: 'Không', demo: 'none' },
  { id: 'fade', label: 'Mờ dần', demo: 'fade' },
  { id: 'slide', label: 'Trượt', demo: 'right' },
  { id: 'zoom', label: 'Thu phóng', demo: 'zoom' },
  { id: 'morph', label: 'Morph', demo: 'morph' },
]

function Chip({ demo, label, active, onClick, onHover, disabled, tip }: { demo: string; label: string; active: boolean; onClick: () => void; onHover: (on: boolean) => void; disabled?: boolean; tip?: string }) {
  return (
    <button
      type="button"
      className={cn('slide-anim-chip', active && 'is-active')}
      aria-pressed={active}
      disabled={disabled}
      data-tip={tip}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <span className="slide-anim-chip__stage">
        <span className="slide-anim-chip__demo" data-anim={demo} />
      </span>
      <span className="slide-anim-chip__label">{label}</span>
    </button>
  )
}

function Speed({ ms, onPick }: { ms: number; onPick: (ms: number) => void }) {
  return (
    <SiteSelect
      inline
      label="Tốc độ hiệu ứng"
      value={String(ms)}
      options={ANIM_SPEEDS.map((s) => ({ value: String(s.ms), label: s.label }))}
      onChange={(v) => onPick(Number(v))}
    />
  )
}

const GRID = 'grid grid-cols-3 gap-1.5'

export function SlideEffectsPanel() {
  const api = useContext(SlideEffectsContext)
  const [pref, setPref] = useState<PageMode>('auto')
  const [scope, setScope] = useState<'page' | 'element'>('element')
  const selectedId = api?.selected?.id
  useEffect(() => setScope('element'), [selectedId])
  if (!api?.slide || api.slide.html) return null
  const { slide, selected, onElement, onPage, onPreview } = api

  const state = pageState(slide)
  const mode = state.mode ?? pref
  const onElementPane = Boolean(selected) && scope === 'element'
  const start = selected ? startOf(selected) : undefined
  const multiLine = selected?.type === 'text' && (selected.text ?? '').split('\n').length > 1
  const previewPage = (anim: Anim | 'none') => ({ slide: setPageAnim(slide, anim, mode, state.ms) })
  const pickPage = (anim: Anim | 'none') => {
    onPage(anim, mode, state.ms)
    onPreview(anim === 'none' ? null : previewPage(anim))
  }
  const transition = slide.transition ?? 'none'
  const previewTransition = (id: Transition): EffectsPreviewSpec => ({ slide: { ...slide, transition: id }, transition: true, from: api.previous ?? undefined })

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3 pt-3">
      {selected && (
        <Segmented
          label="Áp hiệu ứng cho"
          className="w-full [&>button]:flex-1 [&>button]:justify-center"
          value={scope}
          options={[
            { key: 'element', label: 'Đối tượng' },
            { key: 'page', label: 'Cả trang' },
          ]}
          onChange={setScope}
        />
      )}

      {onElementPane ? (
        <section className="space-y-2">
          <h3 className="text-[12.5px] font-semibold text-ink">{start === undefined ? 'Bấm chuột rồi hiện' : `Hiện ở lần bấm ${start}`}</h3>
          <div className={GRID}>
            <Chip demo="none" label="Không" active={start === undefined} onClick={() => onElement({ type: 'none' })} onHover={() => {}} />
            {ANIM_EFFECTS.map((fx) => (
              <Chip
                key={fx.id}
                demo={fx.id}
                label={fx.label}
                active={start !== undefined && (selected!.anim ?? 'fade') === fx.id}
                onClick={() => onElement({ type: 'set', anim: fx.id })}
                onHover={() => {}}
              />
            ))}
          </div>
          {start !== undefined && (
            <>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" disabled={start === 1} onClick={() => onElement({ type: 'move', dir: -1 })}>
                  Sớm hơn
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => onElement({ type: 'move', dir: 1 })}>
                  Muộn hơn
                </Button>
              </div>
              <Speed ms={selected!.animMs ?? 450} onPick={(ms) => onElement({ type: 'speed', ms })} />
              {multiLine && (
                <Checkbox className="text-[13px] text-ink-2" checked={selected!.lineStep !== undefined} onChange={(on) => onElement({ type: 'byLine', on })}>
                  Hiện từng dòng
                </Checkbox>
              )}
            </>
          )}
        </section>
      ) : (
        <section className="space-y-2">
          <h3 className="text-[12.5px] font-semibold text-ink">Cả trang</h3>
          <Segmented
            label="Cách chạy"
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
            value={mode}
            options={[
              { key: 'auto', label: 'Tự chạy' },
              { key: 'click', label: 'Bấm từng phần' },
            ]}
            onChange={(next) => {
              setPref(next)
              if (state.anim !== 'none') onPage(state.anim, next, state.ms)
            }}
          />
          <div className={GRID}>
            <Chip demo="none" label="Không" active={state.anim === 'none'} onClick={() => pickPage('none')} onHover={() => {}} />
            {ANIM_EFFECTS.map((fx) => (
              <Chip
                key={fx.id}
                demo={fx.id}
                label={fx.label}
                active={state.anim === fx.id}
                onClick={() => pickPage(fx.id)}
                onHover={(on) => onPreview(on ? previewPage(fx.id) : null)}
              />
            ))}
          </div>
          {state.anim !== 'none' && <Speed ms={state.ms} onPick={(ms) => onPage(state.anim, mode, ms)} />}
          <Button size="sm" variant="soft" className="w-full" onClick={api.onPageAll}>
            Áp dụng cho mọi trang
          </Button>
        </section>
      )}

      <section className="space-y-2 border-t border-line pt-3">
        <h3 className="text-[12.5px] font-semibold text-ink">Chuyển trang</h3>
        <div className={GRID}>
          {TRANSITIONS.map((t) => (
            <Chip
              key={t.id}
              demo={t.demo}
              label={t.label}
              active={transition === t.id}
              disabled={t.id === 'morph' && !api.previous}
              tip={t.id === 'morph' ? (api.previous ? 'Phần giống slide trước trượt tới chỗ mới' : 'Dùng được từ slide thứ hai') : undefined}
              onClick={() => {
                api.onTransition(t.id, false)
                onPreview(t.id === 'none' ? null : previewTransition(t.id))
              }}
              onHover={(on) => onPreview(on && t.id !== 'none' ? previewTransition(t.id) : null)}
            />
          ))}
        </div>
        <Button size="sm" variant="soft" className="w-full" onClick={() => api.onTransition(transition, true)}>
          Áp dụng cho mọi trang
        </Button>
      </section>

      <section className="space-y-2 border-t border-line pt-3">
        <Button size="sm" variant="outline" className="w-full" onClick={() => api.onClear(false)}>
          Xoá hiệu ứng trang này
        </Button>
        <Button size="sm" variant="outline" className="w-full" onClick={() => api.onClear(true)}>
          Xoá hiệu ứng cả bài
        </Button>
      </section>
    </div>
  )
}
