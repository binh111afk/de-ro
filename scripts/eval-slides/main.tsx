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
import { SLIDE_PLAN_SYSTEM, generateSlide, polishSlide } from '@/examEditor/AiPanel'
import { callLlm } from '@/lib/llm'
import { parseDeckPlan } from '@/lib/aiDeck'
import { slideFromAi, withImage } from '@/lib/slideAi'
import { IMAGE_LAYOUTS, buildImagePrompt, generateSlideImage, queueImage } from '@/lib/imageGen'
import { ensureMeasureFonts } from '@/lib/slideMeasure'
import { themeById } from '@/lib/slideTheme'
import type { Slide } from '@/store/docs'

/** Cộng token thật của mọi lượt gọi /api/llm (usage do gateway trả) để biết một deck tốn bao nhiêu. */
const tokens = { calls: 0, prompt: 0, completion: 0, reasoning: 0 }
const realFetch = window.fetch.bind(window)
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const res = await realFetch(...args)
  if (String(args[0]).includes('/api/llm')) {
    void res.clone().json().then((j: { usage?: { prompt_tokens?: number; completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } } }) => {
      const u = j.usage
      if (!u) return
      tokens.calls++
      tokens.prompt += u.prompt_tokens ?? 0
      tokens.completion += u.completion_tokens ?? 0
      tokens.reasoning += u.completion_tokens_details?.reasoning_tokens ?? 0
    }).catch(() => {})
  }
  return res
}

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
  const root = createRoot(document.getElementById('host')!)
  const renderAll = () =>
    root.render(
      <>
        {built.map((slide, i) =>
          slide ? (
            <div key={i} style={{ width: 620 }}>
              <div className="cap">{i + 1}. {plan.slides[i].layout}{plan.slides[i].tone ? `/${plan.slides[i].tone}` : ''} — {plan.slides[i].title}</div>
              <SlideThumb slide={slide} theme={theme} />
            </div>
          ) : null,
        )}
      </>,
    )
  built.forEach((slide, i) => {
    if (!slide) failed.push(`${i + 1}:${plan.slides[i].layout}`)
  })
  renderAll()
  const rectsOf = () =>
    [...document.querySelectorAll('.slide-frame')].map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }
    })
  // --polish: runner chấm ảnh rồi gọi lại để viết lại slide bị chê (vòng chấm bằng mắt).
  ;(window as unknown as Record<string, unknown>).__polish = async (i: number, issues: string[]) => {
    const page = pages[i]
    if (!page) return false
    const better = await polishSlide(plan, plan.slides[i], i, page, issues, controller.signal)
    if (!better) return false
    pages[i] = better
    built[i] = slideFromAi(better, theme)
    renderAll()
    await new Promise((r) => setTimeout(r, 1200))
    return true
  }
  ;(window as unknown as Record<string, unknown>).__rects = () => JSON.stringify(rectsOf())
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
    tokens,
    planMs,
    totalMs: Math.round(performance.now() - t0),
  })
}

main().catch((err) => done({ fatal: String(err?.stack ?? err) }))
