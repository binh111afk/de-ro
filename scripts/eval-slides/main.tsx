/**
 * Chạy pipeline sinh slide THẬT (dàn ý → từng slide → layout engine) cho một
 * chủ đề (`?topic=`), dựng lưới `SlideThumb` để `eval-slides.mjs` chụp ảnh.
 * Ảnh AI không được sinh (layout ảnh dùng khung chờ/graphic) để chạy nhanh và rẻ.
 */
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@/index.css'
import { createRoot } from 'react-dom/client'
import { SlideThumb } from '@/examEditor/SlideEditor'
import { SLIDE_PLAN_SYSTEM, generateSlide } from '@/examEditor/AiPanel'
import { callLlm } from '@/lib/llm'
import { parseDeckPlan } from '@/lib/aiDeck'
import { slideFromAi, withImage } from '@/lib/slideAi'
import { IMAGE_LAYOUTS, buildImagePrompt, generateSlideImage, queueImage } from '@/lib/imageGen'
import { ensureMeasureFonts } from '@/lib/slideMeasure'
import { themeById } from '@/lib/slideTheme'
import type { Slide } from '@/store/docs'

const done = (payload: unknown) => {
  document.getElementById('eval-result')!.textContent = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

async function main() {
  const topic = new URLSearchParams(location.search).get('topic') ?? 'Hàm số bậc nhất'
  await ensureMeasureFonts()
  await document.fonts.ready
  const controller = new AbortController()
  const t0 = performance.now()

  const res = await callLlm(
    [{ role: 'system', content: SLIDE_PLAN_SYSTEM }, { role: 'user', content: topic }],
    { signal: controller.signal, reasoningEffort: 'medium' },
  )
  const plan = parseDeckPlan(res.content)
  if (!plan) {
    done({ fatal: 'Không parse được dàn ý', raw: res.content })
    return
  }
  const planMs = Math.round(performance.now() - t0)

  // đồng thời 3 như AiPanel
  const pages = new Array<Awaited<ReturnType<typeof generateSlide>>>(plan.slides.length)
  let next = 0
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (next < plan.slides.length) {
        const i = next++
        try {
          pages[i] = await generateSlide(plan, plan.slides[i], i, controller.signal)
        } catch {
          pages[i] = null
        }
      }
    }),
  )

  const theme = themeById(plan.theme ?? 'sang')
  const cells: JSX.Element[] = []
  const failed: string[] = []
  const built: Array<Slide | null> = pages.map((page) => (page ? slideFromAi(page, theme) : null))
  // ?images=1: sinh ảnh AI thật cho bìa + layout ảnh (như app làm nền) rồi mới chụp
  if (new URLSearchParams(location.search).get('images')) {
    await Promise.all(
      built.map(async (slide, i) => {
        const page = pages[i]
        if (!slide || !page || !IMAGE_LAYOUTS.includes(page.layout ?? '')) return
        const isCover = page.layout === 'title'
        const bullets = page.bullets ?? page.steps ?? page.items ?? [page.subtitle ?? '']
        const orientation = isCover ? 'square' : page.layout === 'image-left' || page.layout === 'image-right' ? 'portrait' : 'landscape'
        try {
          const img = await queueImage(() => generateSlideImage(buildImagePrompt(page.title, bullets, orientation, theme.accent)))
          built[i] = withImage(slide, theme, img.dataUrl)
        } catch {
          // giữ đồ hoạ/icon
        }
      }),
    )
  }
  pages.forEach((page, i) => {
    const ps = plan.slides[i]
    const slide = built[i]
    if (!page || !slide) {
      failed.push(`${i + 1}:${ps.layout}`)
      return
    }
    cells.push(
      <div key={i} style={{ width: 620 }}>
        <div className="cap">{i + 1}. {ps.layout}{ps.tone ? `/${ps.tone}` : ''} — {ps.title}</div>
        <SlideThumb slide={slide} theme={theme} />
      </div>,
    )
  })
  createRoot(document.getElementById('host')!).render(<>{cells}</>)
  await new Promise((r) => setTimeout(r, 1200)) // FitText + font settle
  done({
    topic,
    theme: theme.id,
    stylePack: plan.stylePack,
    layouts: plan.slides.map((s) => s.layout),
    slides: plan.slides.length,
    failed,
    // vùng từng slide (toạ độ trang) để runner chụp riêng từng ảnh khi cần chấm điểm
    rects: [...document.querySelectorAll('.slide-frame')].map((el, i) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, layout: plan.slides[i]?.layout }
    }),
    planMs,
    totalMs: Math.round(performance.now() - t0),
  })
}

main().catch((err) => done({ fatal: String(err?.stack ?? err) }))
