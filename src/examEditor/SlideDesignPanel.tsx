/**
 * Panel phải chọn bộ thiết kế (Design) cho toàn bộ bài giảng slide.
 * Tái sử dụng khung dock phải + hiệu ứng trượt của AiDock/AiPanel và dạng card
 * gọn nhẹ kiểu .slide-ribbon-theme-card (không dựng SlideThumb nặng).
 */
import { useMemo, type CSSProperties } from 'react'
import { Check, Palette } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SLIDE_DESIGNS, type SlideDesign } from '@/lib/slideDesigns'
import { skinById } from '@/lib/slideSkins'
import { DECK_THEMES, themeById } from '@/lib/slideTheme'
import { useAnimatedPresence } from '@/lib/useAnimatedPresence'
import type { DeckTheme } from '@/store/docs'
import { IconChevronDown, IconChevronRight } from './icons'
import { useSlideViewport } from './useSlideViewport'

interface SlideDesignPanelProps {
  open: boolean
  activeDesignId?: string
  currentTheme: DeckTheme
  disabled?: boolean
  onSelect: (design: SlideDesign | null) => void
  onClose: () => void
}

interface DesignSwatch {
  design: SlideDesign
  bg: string
  fg: string
  accent: string
  secondary: string
  headingFont: string
}

const SWATCHES: DesignSwatch[] = SLIDE_DESIGNS.map((design) => {
  const base = themeById(design.themeId) ?? DECK_THEMES[0]
  const skin = skinById(design.id)
  const bg = skin?.getBackground ? skin.getBackground(base, 'theme') : base.bg
  return {
    design,
    bg,
    fg: base.fg,
    accent: base.accent,
    secondary: base.secondary,
    headingFont: skin?.fonts.heading ?? base.fontHeading ?? 'Inter, sans-serif',
  }
})

export function SlideDesignPanel({
  open,
  activeDesignId,
  currentTheme,
  disabled = false,
  onSelect,
  onClose,
}: SlideDesignPanelProps) {
  const dockAnim = useAnimatedPresence(open, 180)
  const { isPhone, isTablet } = useSlideViewport()

  const defaultPreviewStyle = useMemo<CSSProperties>(
    () => ({
      background: currentTheme.bg,
      color: currentTheme.fg,
    }),
    [currentTheme.bg, currentTheme.fg],
  )

  return (
    <>
      {(isPhone || isTablet) && dockAnim.mounted && (
        <div
          className={cn(
            'fixed inset-0 z-[59] bg-black/25',
            dockAnim.closing ? 'backdrop-out' : 'backdrop-in',
          )}
          aria-hidden="true"
          onClick={onClose}
        />
      )}
      <aside
        aria-label="Bảng thiết kế bài giảng"
        className={cn(
          'ai-dock ai-dock--right slide-design-dock',
          !open && 'collapsed',
          dockAnim.closing && 'ai-dock--closing',
        )}
        style={{ ['--ai-panel-width' as string]: '340px' }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        <div className="ai-dock__body" inert={!open}>
          <div className="ai-panel slide-design-panel">
            <div className="ai-panel-header">
              <span className="ai-panel-title">
                <Palette size={15} aria-hidden="true" />
                <span>Thiết kế</span>
              </span>
            </div>

            <div className="slide-design-scroll">
              {disabled && (
                <p className="mb-3 rounded-lg border border-line bg-paper px-3 py-2 text-[12px] text-ink-3">
                  Bài giảng HTML dùng định dạng riêng nên không áp dụng bộ thiết kế.
                </p>
              )}
              <p className="mb-2.5 text-[11.5px] leading-snug text-ink-3">
                Nhấp để đổi phong cách toàn bài (giữ nguyên số slide và nội dung).
              </p>

              <div className="slide-design-grid" role="list" aria-label="Danh sách bộ thiết kế">
                <button
                  type="button"
                  role="listitem"
                  disabled={disabled}
                  aria-pressed={!activeDesignId}
                  data-tip="Không dùng bộ thiết kế — giữ màu và phông đơn giản theo bố cục"
                  onClick={() => onSelect(null)}
                  className={cn('slide-design-card', !activeDesignId && 'active')}
                >
                  <span
                    className="slide-design-card__preview slide-design-card__preview--none"
                    style={defaultPreviewStyle}
                  >
                    <span
                      className="slide-design-card__aa"
                      style={{
                        fontFamily: currentTheme.fontHeading ?? 'Inter, sans-serif',
                        color: currentTheme.fg,
                      }}
                    >
                      Aa
                    </span>
                    <span className="slide-design-card__bars">
                      <i style={{ background: currentTheme.accent }} />
                      <i style={{ background: currentTheme.secondary ?? currentTheme.muted ?? '#94a3b8' }} />
                    </span>
                  </span>
                  {!activeDesignId && (
                    <span className="slide-design-card__check" aria-hidden="true">
                      <Check size={11} strokeWidth={2.8} />
                    </span>
                  )}
                  <span className="slide-design-card__name">Mặc định</span>
                </button>

                {SWATCHES.map(({ design, bg, fg, accent, secondary, headingFont }) => {
                  const isActive = activeDesignId === design.id
                  return (
                    <button
                      key={design.id}
                      type="button"
                      role="listitem"
                      disabled={disabled}
                      aria-pressed={isActive}
                      data-tip={design.description}
                      onClick={() => onSelect(design)}
                      className={cn('slide-design-card', isActive && 'active')}
                    >
                      <span
                        className="slide-design-card__preview"
                        data-motif={design.id}
                        style={
                          {
                            background: bg,
                            color: fg,
                            ['--motif-accent' as string]: accent,
                            ['--motif-secondary' as string]: secondary,
                          } as CSSProperties
                        }
                      >
                        <span
                          className="slide-design-card__aa"
                          style={{ fontFamily: headingFont, color: fg }}
                        >
                          Aa
                        </span>
                        <span className="slide-design-card__bars">
                          <i style={{ background: accent }} />
                          <i style={{ background: secondary }} />
                        </span>
                      </span>
                      {isActive && (
                        <span className="slide-design-card__check" aria-hidden="true">
                          <Check size={11} strokeWidth={2.8} />
                        </span>
                      )}
                      <span className="slide-design-card__name">{design.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {open && (
          <button
            type="button"
            className="ai-dock__collapse"
            onClick={onClose}
            data-tip="Thu gọn bảng thiết kế"
            aria-label="Thu gọn bảng thiết kế"
          >
            <span className="ai-dock__collapse-side">
              <IconChevronRight size={16} />
            </span>
            <span className="ai-dock__collapse-down">
              <IconChevronDown size={18} />
            </span>
          </button>
        )}
      </aside>
    </>
  )
}
