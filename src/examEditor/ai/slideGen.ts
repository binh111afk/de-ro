/** Sinh nội dung slide từ dàn ý (không đụng giao diện): AiPanel và `scripts/eval-slides` cùng dùng. */
import { AiQuotaError, callLlm, callLlmChecked, type LlmProgress } from '@/lib/llm'
import { parseAiObject, type AiSlidePayload, type DeckPlan, type DeckPlanSlide } from '@/lib/aiDeck'
import { checkSlide, parseBatchSlides, planDecorKit, repairPrompt } from '@/lib/slideAi'

/**
 * Mức suy luận của model theo việc. Đo thật (`npm run eval:exam`, `eval:slides --effort`, 11/2026, deepseek-v4.1-flash):
 * - Đề Toán THPT QG: max 34,3k token / 240 s, medium 31,1k / 214 s, low 23,6k / 160 s — đúng cấu trúc, không thấy sai ở low.
 * - 15 slide: medium 51,7k, low 44,2k token — chất lượng ngang nhau.
 * → dùng low cho cả hai.
 */
export const AI_EFFORT: { exam: 'low' | 'medium' | 'high' | 'max'; slide: 'low' | 'medium' | 'high' | 'max' } = {
  exam: 'low',
  slide: 'low',
}

/** Số slide mỗi lần gọi model: gộp để không gửi lại prompt chung cho từng slide. */
export const SLIDE_BATCH = 5

/**
 * Sinh nội dung một slide từ dàn ý đã duyệt. Sai field bắt buộc thì sửa đúng
 * một lần; vẫn sai trả null để slide đó bị bỏ, không chèn nội dung rác.
 */
export async function generateSlide(
  plan: DeckPlan,
  planSlide: DeckPlanSlide,
  index: number,
  signal: AbortSignal,
  pro?: boolean,
  recovery = false,
  retryOf?: string,
): Promise<AiSlidePayload | null> {
  // system prompt do server ghép từ dàn ý (task slide-trang)
  const task = { name: 'slide-trang', input: { plan, index, pro: pro === true || undefined } }
  const user = `Viết slide ${index + 1}: "${planSlide.title}".`
  // bộ trang trí là của cả deck (chọn ở dàn ý), gắn vào mọi trang
  const decorKit = planDecorKit(plan)
  const withKit = (page: AiSlidePayload): AiSlidePayload => ({ ...page, decorKit })
  const first = await callLlm([{ role: 'user', content: user }], { signal, reasoningEffort: AI_EFFORT.slide, task, retryOf })
  const check = checkSlide(
    parseAiObject(first.content),
    planSlide.layout,
    planSlide.tone,
  )
  if (recovery) return check.errors.length ? null : withKit(check.page)
  if (!check.errors.length && !check.readability.length) return withKit(check.page)

  return repairSlide(plan, index, first.content, check, signal, pro, first.receipt)
}

async function repairSlide(
  plan: DeckPlan, index: number, raw: string, check: ReturnType<typeof checkSlide>,
  signal: AbortSignal, pro?: boolean, retryOf?: string,
): Promise<AiSlidePayload | null> {
  const slide = plan.slides[index]
  const repaired = await callLlm(
    [
      { role: 'user', content: `Viết slide ${index + 1}: "${slide.title}".` },
      { role: 'assistant', content: raw },
      { role: 'user', content: repairPrompt([...check.errors, ...check.readability]) },
    ],
    { signal, reasoningEffort: AI_EFFORT.slide, retryOf, task: { name: 'slide-trang', input: { plan, index, pro: pro === true || undefined } } },
  ).catch((error: unknown) => {
    signal.throwIfAborted()
    if (check.errors.length && error instanceof AiQuotaError) throw error
    return null
  })

  if (repaired) {
    const next = checkSlide(parseAiObject(repaired.content), slide.layout, slide.tone)
    if (!next.errors.length) return { ...next.page, decorKit: planDecorKit(plan) }
  }
  if (!check.errors.length) return { ...check.page, decorKit: planDecorKit(plan) }
  return recoverSlide(plan, index, signal, pro, repaired?.receipt)
}

function recoverSlide(plan: DeckPlan, index: number, signal: AbortSignal, pro?: boolean, retryOf?: string): Promise<AiSlidePayload | null> {
  const slides = [...plan.slides]
  const original = slides[index]
  slides[index] = { ...original, layout: pro ? 'editorial-text' : 'bullets', tone: undefined }
  return generateSlide({ ...plan, slides }, slides[index], index, signal, pro, true, retryOf)
}

/**
 * Sinh một nhóm slide trong một lần gọi. Sửa riêng trang lỗi, thử lại với bố cục
 * đơn giản nếu vẫn thiếu trường bắt buộc.
 */
export async function generateSlideBatch(
  plan: DeckPlan,
  indices: number[],
  signal: AbortSignal,
  /** có thì gọi dạng stream để hiện tiến độ thật của lô (suy nghĩ, trang đang viết) */
  onProgress?: (p: LlmProgress) => void,
  pro?: boolean,
): Promise<Array<AiSlidePayload | null>> {
  if (indices.length === 1) return [await generateSlide(plan, plan.slides[indices[0]], indices[0], signal, pro)]
  const decorKit = planDecorKit(plan)
  const withKit = (page: AiSlidePayload): AiSlidePayload => ({ ...page, decorKit })
  // cả nhóm không đọc được (JSON hỏng/cụt) → hoàn token lượt đó, gọi lại một lần
  const res = await callLlmChecked(
    [
      { role: 'user', content: `Viết slide ${indices.map((i) => i + 1).join(', ')}.` },
    ],
    { signal, reasoningEffort: AI_EFFORT.slide, onProgress, task: { name: 'slide-lo', input: { plan, indices, think: !!onProgress, pro: pro === true || undefined } } },
    (content) => parseBatchSlides(parseAiObject(content), indices.length).some(Boolean),
  ).catch((error: unknown) => {
    signal.throwIfAborted()
    if (error instanceof AiQuotaError) throw error
    return null
  })
  const items = res ? parseBatchSlides(parseAiObject(res.content), indices.length) : []
  return Promise.all(
    indices.map(async (index, k) => {
      const planSlide = plan.slides[index]
      if (!items[k]) return generateSlide(plan, planSlide, index, signal, pro)
      const check = checkSlide(items[k], planSlide.layout, planSlide.tone)
      if (!check.errors.length && !check.readability.length) return withKit(check.page)
      return repairSlide(plan, index, JSON.stringify(items[k]), check, signal, pro)
    }).map(page => page.catch((error: unknown) => {
      signal.throwIfAborted()
      if (error instanceof AiQuotaError) throw error
      return null
    })),
  )
}

/**
 * Vòng chấm bằng mắt: giám khảo (model nhìn ảnh slide) chê gì thì nêu đúng điều đó cho
 * model viết lại slide — giữ layout, đổi cách viết/chia ý. Trả null nếu bản sửa hỏng.
 * Ảnh chụp do caller lo (app không có sẵn DOM→ảnh; xem `eval-slides --polish`).
 */
export async function polishSlide(
  plan: DeckPlan,
  planSlide: DeckPlanSlide,
  index: number,
  previous: AiSlidePayload,
  issues: string[],
  signal: AbortSignal,
  pro?: boolean,
): Promise<AiSlidePayload | null> {
  const reply = await callLlm(
    [
      { role: 'user', content: `Viết slide ${index + 1}: "${planSlide.title}".` },
      { role: 'assistant', content: JSON.stringify(previous) },
      {
        role: 'user',
        content:
          'Giám khảo nhìn ảnh slide vừa dựng và chê: ' + issues.join(' | ') +
          '. Sửa NỘI DUNG để khắc phục (chia ý rõ hơn, rút gọn chỗ dày chữ, nêu ý chính nổi bật; ' +
          'bỏ "graphic" nếu bị chê lạc nghĩa), giữ nguyên layout, trả DUY NHẤT một JSON hợp lệ.',
      },
    ],
    { signal, reasoningEffort: AI_EFFORT.slide, task: { name: 'slide-trang', input: { plan, index, pro: pro === true || undefined } } },
  )
  const check = checkSlide(parseAiObject(reply.content), planSlide.layout, planSlide.tone)
  return check.errors.length ? null : { ...check.page, decorKit: planDecorKit(plan) }
}
