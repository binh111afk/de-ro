/**
 * Lưới chọn bộ thiết kế (tab Mẫu → Bộ màu ở panel trái): bấm là đổi phong cách
 * toàn bài, không thêm slide. Thẻ gọn kiểu .slide-ribbon-theme-card (không dựng SlideThumb nặng).
 */
import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SLIDE_DESIGNS, type SlideDesign } from '@/lib/slideDesigns'
import { skinById } from '@/lib/slideSkins'
import { DECK_THEMES, normalizeTheme, themeById } from '@/lib/slideTheme'

interface SlideDesignGridProps {
  activeDesignId?: string
  disabled?: boolean
  onSelect: (design: SlideDesign | null) => void
}

interface DesignSwatch {
  design: SlideDesign
  bg: string
  fg: string
  accent: string
  secondary: string
  headingFont: string
}

/** bộ màu của bài slide mới — thẻ "Mặc định" đưa bài về đây */
const DEFAULT_THEME = normalizeTheme(DECK_THEMES[0])

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

export function SlideDesignGrid({
  activeDesignId,
  disabled = false,
  onSelect,
}: SlideDesignGridProps) {
  return (
    <div className="pb-4">
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
          data-tip="Về thiết kế mặc định của slide (nền sáng, phông đơn giản)"
          onClick={() => onSelect(null)}
          className={cn('slide-design-card', !activeDesignId && 'active')}
        >
          <span
            className="slide-design-card__preview slide-design-card__preview--none"
            style={{ background: DEFAULT_THEME.bg, color: DEFAULT_THEME.fg }}
          >
            <span
              className="slide-design-card__aa"
              style={{
                fontFamily: DEFAULT_THEME.fontHeading ?? 'Inter, sans-serif',
                color: DEFAULT_THEME.fg,
              }}
            >
              Aa
            </span>
            <span className="slide-design-card__bars">
              <i style={{ background: DEFAULT_THEME.accent }} />
              <i style={{ background: DEFAULT_THEME.secondary ?? DEFAULT_THEME.muted ?? '#94a3b8' }} />
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
  )
}
