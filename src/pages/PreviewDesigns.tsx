import { useMemo } from 'react'
import { SLIDE_DESIGNS, buildDesignSlides } from '@/lib/slideDesigns'
import { normalizeTheme, themeById } from '@/lib/slideTheme'
import { skinById, themeWithSkinFonts } from '@/lib/slideSkins'
import { SlideThumb } from '@/examEditor/SlideEditor'

export default function PreviewDesigns() {
  const rows = useMemo(() => {
    return SLIDE_DESIGNS.map((d) => {
      const baseTheme = themeById(d.themeId)!
      const skin = skinById(d.id)
      const theme = normalizeTheme(skin ? themeWithSkinFonts(baseTheme, skin) : baseTheme)
      const slides = buildDesignSlides(d, theme)
      return {
        design: d,
        skin,
        theme,
        slide1: slides[0],
        slide3: slides[2],
        slide5: slides[4],
      }
    })
  }, [])

  return (
    <div id="comparison-matrix" className="min-h-screen bg-white p-8 text-ink font-sans">
      <div className="mb-6 border-b border-clay/40 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Bảng So Sánh Ngôn Ngữ Hình Khối & Bố Cục (8 Bộ Thiết Kế Slide)
        </h1>
        <p className="mt-1 text-sm text-ink-3">
          Kiểm tra độ khác biệt về hình khối, kiểu chữ, khung viền, và motif nhận diện ở Slide 1, Slide 3 và Slide 5.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {rows.map(({ design, skin, theme, slide1, slide3, slide5 }, idx) => (
          <div
            key={design.id}
            className="flex flex-col gap-2 rounded-xl border border-clay/60 bg-paper-2 p-4 shadow-sm"
          >
            <div className="flex items-baseline justify-between border-b border-clay/30 pb-2">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">
                  {idx + 1}
                </span>
                <span className="text-base font-bold text-ink">{design.name}</span>
                <code className="rounded bg-clay/20 px-1.5 py-0.5 text-xs text-ink-2">{design.id}</code>
              </div>
              <div className="text-xs text-ink-3">
                Phông: <span className="font-semibold text-ink-2">{skin?.fonts.heading}</span> • Nhịp: {design.slides.map(s => s.layout).join(' → ')}
              </div>
            </div>

            <p className="text-xs text-ink-3 italic">
              <strong>Hình khối:</strong> {skin?.geometrySummary}
            </p>

            <div className="grid grid-cols-3 gap-4 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-3">
                  Slide 1: Tiêu đề ({slide1.layout})
                </span>
                <div className="overflow-hidden rounded-lg border border-clay/40 shadow-sm">
                  <SlideThumb slide={slide1} theme={theme} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-3">
                  Slide 3: Đặc trưng 1 ({slide3.layout})
                </span>
                <div className="overflow-hidden rounded-lg border border-clay/40 shadow-sm">
                  <SlideThumb slide={slide3} theme={theme} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-ink-3">
                  Slide 5: Đặc trưng 2 ({slide5.layout})
                </span>
                <div className="overflow-hidden rounded-lg border border-clay/40 shadow-sm">
                  <SlideThumb slide={slide5} theme={theme} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
