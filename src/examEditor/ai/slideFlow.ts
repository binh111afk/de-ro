/** Luồng slide: sửa bài đang có, nhận dàn ý, và sinh từng slide từ dàn ý đã duyệt. */
import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { AiQuotaError, callLlm, type LlmProgress, type LlmResult } from '@/lib/llm'
import { startsWithJson } from '@/lib/aiDocContext'
import { parseDeckPlan, proPlan, type AiSlidePayload, type DeckPlan } from '@/lib/aiDeck'
import { dropRepeatedGraphic } from '@/lib/slideAi'
import { isLayoutId } from '@/lib/slideLayouts'
import { parseAddedSlide, parseEditCommands } from '@/lib/slideEdit'
import { assemblePreservedDeck, fallbackPreservePages, formatPreserveMessage, parsePreserveChat, splitPreserveBlocks } from '@/lib/slidePreserve'
import { askAgain, createLiveLog, type TurnCtx } from './flowKit'
import { AI_EFFORT, generateSlideBatch, SLIDE_BATCH } from './slideGen'
import { closeLog, leftTokens, spentSince, tailLine, type ChatTurn } from './turns'

/** Sửa bài đang mở. false = model xin làm bài mới (new_deck) → đi tiếp luồng lập dàn ý. */
export async function runSlideEdit(ctx: TurnCtx): Promise<boolean> {
  const { text, originalRequest, messages, mainTask, srcInput, controller, patchTurn, logStart, contextSummary, editContext } = ctx
  const onApplyEdits = ctx.onApplyEdits!
  logStart('Xem phần cần sửa')
  const editTask = {
    name: 'slide-sua',
    input: { context: editContext ?? contextSummary ?? '', ...srcInput, webFound: mainTask.input.webFound },
  }
  const allowLegacy = /(?:thêm|chèn|vẽ|tạo)[^.\n]*(?:sơ đồ tư duy|slide trắc nghiệm|slide câu hỏi)/iu.test(text)
  const read = (content: string) => {
    const result = parseEditCommands(content)
    const ops = result.ops.filter(op => op.op !== 'add_slide' || isLayoutId(op.layout))
    const legacy = allowLegacy && !ops.length ? parseAddedSlide(content) : undefined
    return { ...result, ops: legacy ? [legacy] : ops }
  }
  const first = await callLlm(messages, { signal: controller.signal, reasoningEffort: AI_EFFORT.slide, task: editTask })
  // AI trả lời bằng chữ (hỏi đáp, trò chuyện): hiện như câu trả lời
  if (first.content.trim() && !startsWithJson(first.content) && !/"commands"\s*:/.test(first.content)) {
    patchTurn(() => ({ text: first.content, pending: false, intent: 'chat', log: undefined }))
    return true
  }
  // bài khác từ đầu: đi tiếp xuống luồng lập dàn ý
  if (!/"action"\s*:\s*"new_deck"/.test(first.content)) {
    let result = read(first.content)
    let reply = first.content
    // nội dung quá dài / thiếu field: xin viết lại một lần trước khi áp, thay vì báo không sửa được
    const rejected = result.ops.length ? ctx.onCheckEdits?.(result.ops) ?? [] : []
    if (rejected.length || (!result.ops.length && !result.needsData && !result.say)) {
      const again = await askAgain(
        rejected.length ? [...messages, { role: 'assistant', content: first.content }] : messages,
        rejected.length
          ? `Chưa áp được vì ${rejected.join('; ')}. Viết ngắn lại cho vừa giới hạn (ngắn hơn hẳn mức tối đa), hoặc chia bớt sang slide mới bằng add_slide, rồi trả lại đủ mọi lệnh.`
          : 'Chỉ trả lệnh hợp lệ để thực hiện đúng phần được yêu cầu trên bài đang mở.',
        first,
        { signal: controller.signal, reasoningEffort: AI_EFFORT.slide, task: editTask })
      const next = read(again.content)
      if (next.ops.length || !result.ops.length) {
        result = next
        reply = again.content
      }
    }
    controller.signal.throwIfAborted()
    const lines = result.ops.length ? await onApplyEdits(result.ops, controller.signal) : []
    const notice = result.needsData ? 'Bạn gửi số liệu hoặc nguồn để mình vẽ biểu đồ nhé.'
      : lines.join('\n\n') || result.say || 'Mình chưa sửa được slide. Bạn thử gửi lại yêu cầu nhé.'
    patchTurn(() => ({
      text: notice,
      ...(lines.length ? { sent: reply } : {}),
      pending: false,
      intent: 'doc',
      log: undefined,
      ...(!lines.length && !result.needsData && !result.say ? { retry: originalRequest } : {}),
    }))
    return true
  }
  return false
}

/** Chế độ Giữ nguyên chữ: tách đoạn -> 1 lượt AI ánh xạ ID -> code lắp nguyên văn 100% và dựng slide thẳng. Trả true nếu đã tạo slide. */
export async function runSlidePreserve(ctx: TurnCtx): Promise<boolean> {
  const { text, originalRequest, sourceText, slidePro, proStyle, controller, patchTurn, logStart, logSet, logPatch, onAppendSlide, onApplySlides } = ctx
  const hasSource = !!sourceText?.trim()
  const rawText = hasSource ? sourceText! : text
  const note = hasSource ? text : undefined
  const blocks = splitPreserveBlocks(rawText)
  if (!blocks.length) {
    patchTurn(() => ({
      text: 'Bạn dán nguyên văn nội dung hoặc đính kèm tệp rồi gửi lại nhé.',
      pending: false,
      intent: 'chat',
      log: undefined,
    }))
    return false
  }

  const preserveTask = { name: 'slide-giu-chu', input: { pro: slidePro || undefined, think: true } }
  const live = createLiveLog(ctx)
  live.onProgress({ phase: 'think', thought: 0, thinking: '', text: '' })
  const ticker = setInterval(() => live.phase() === 'think' && logPatch({ note: live.secs() }), 1000)

  const userMsg = formatPreserveMessage(blocks, note)
  let res: LlmResult
  try {
    res = await callLlm(
      [{ role: 'user', content: userMsg }],
      { signal: controller.signal, reasoningEffort: AI_EFFORT.slide, onProgress: live.onProgress, task: preserveTask },
    )
  } finally {
    clearInterval(ticker)
  }
  logSet((l) => closeLog(l, 'done'))

  // Người dùng chỉ hỏi đáp bình thường (không có nội dung bài): trả lời chữ, không ép dựng slide rác
  if (!hasSource) {
    const chatReply = parsePreserveChat(res.content)
    if (chatReply) {
      patchTurn(() => ({ text: chatReply, pending: false, intent: 'chat', log: undefined }))
      return false
    }
  }

  let result = assemblePreservedDeck(res.content, blocks, { pro: slidePro, proStyle })
  if (!result) {
    const again = await askAgain(
      [{ role: 'user', content: userMsg }, { role: 'assistant', content: res.content }],
      'JSON vừa trả chưa đúng cấu trúc ánh xạ ID. Chỉ trả DUY NHẤT một JSON {"title","theme","slides":[...]} dùng đúng các ID số nguyên đã đánh số, KHÔNG viết lại chữ.',
      res,
      { signal: controller.signal, reasoningEffort: AI_EFFORT.slide, task: preserveTask },
    ).catch((err: unknown) => {
      controller.signal.throwIfAborted()
      if (err instanceof AiQuotaError) throw err
      return null
    })
    if (again) result = assemblePreservedDeck(again.content, blocks, { pro: slidePro, proStyle })
  }

  controller.signal.throwIfAborted()

  const pages = result?.pages ?? fallbackPreservePages(blocks, slidePro)
  const plan: DeckPlan = result?.plan ?? {
    title: blocks[0].text.slice(0, 80),
    theme: 'sang',
    mainIdeas: [],
    slides: pages.map((p, i) => ({ title: p.title || `Slide ${i + 1}`, layout: p.layout ?? 'bullets', brief: '' })),
  }

  logStart('Dựng slide giữ nguyên văn', `${pages.length} slide`)
  let added = 0
  if (onAppendSlide) {
    for (const page of pages) {
      controller.signal.throwIfAborted()
      await onAppendSlide(page, plan)
      added++
    }
  } else if (onApplySlides) {
    added = await onApplySlides(JSON.stringify({ title: plan.title, slides: pages }), plan)
  }
  logSet((l) => closeLog(l, added ? 'done' : 'failed'))

  const noteRecovered = result?.recovered ? ` (đã tự ghép lại ${result.recovered} đoạn bị sót)` : ''
  patchTurn(() => ({
    text: added ? `Đã tạo ${added} slide giữ nguyên văn${noteRecovered}.` : 'Mình chưa tạo được slide. Bạn thử lại nhé.',
    pending: false,
    intent: 'doc',
    log: undefined,
    ...(!added ? { retry: originalRequest } : {}),
  }))
  return added > 0
}

export async function finishSlide(ctx: TurnCtx, res: LlmResult) {
  const { intent, originalRequest, botId, messages, mainTask, controller, setTurns, patchTurn, slidePro, onApplySlides } = ctx
  // Lượt lập dàn ý: chỉ hiện thẻ chờ duyệt, chưa chạm vào deck.
  // model tự chọn: JSON là dàn ý, chữ là câu trả lời
  const planReply = startsWithJson(res.content) || (intent === 'doc' && /"slides"\s*:/.test(res.content))
  let plan = planReply ? parseDeckPlan(res.content) : null
  if (planReply && !plan) {
    // Model thỉnh thoảng trả JSON hỏng/cụt: cho đúng một lượt sửa trước khi bỏ cuộc.
    const again = await askAgain(
      [...messages, { role: 'assistant', content: res.content }],
      'JSON dàn ý vừa trả không đọc được (sai dấu hoặc bị cắt). Trả lại DUY NHẤT một JSON hợp lệ, ' +
        'ngắn gọn hơn: mỗi "brief" ≤ 100 ký tự, không xuống dòng trong chuỗi.',
      res,
      { signal: controller.signal, reasoningEffort: AI_EFFORT.slide, task: mainTask },
    )
    plan = parseDeckPlan(again.content)
    controller.signal.throwIfAborted()
  }
  if (plan && slidePro) plan = proPlan(plan, ctx.proStyle)
  if (plan) {
    setTurns((t) =>
      t.map((turn) =>
        turn.id === botId
          ? {
              ...turn,
              text: `Dàn ý ${plan.slides.length} slide đã sẵn sàng. Xem và duyệt bên dưới để mình viết nội dung.`,
              plan,
              planState: 'pending',
              pending: false,
              ...(turn.log ? { log: closeLog(turn.log, 'done') } : {}),
            }
          : turn,
      ),
    )
    return
  }
  const structured = planReply || /^\s*\[/.test(res.content) || /"commands"\s*:/.test(res.content)
  const added = structured ? await onApplySlides?.(res.content) ?? 0 : 0
  const failed = !added && structured
  patchTurn(turn => ({
    text: added ? `Mình đã thêm ${added} slide.` : failed ? 'Mình chưa tạo được slide. Bạn thử lại nhé.' : res.content,
    pending: false,
    intent: added || structured ? 'doc' : 'chat',
    ...(failed ? { retry: originalRequest } : {}),
    log: turn.log && (added || failed) ? closeLog(turn.log, failed ? 'failed' : 'done') : undefined,
  }))
}

export interface DeckEnv {
  busy: boolean
  abortRef: MutableRefObject<AbortController | null>
  setTurns: Dispatch<SetStateAction<ChatTurn[]>>
  setBusy: (busy: boolean) => void
  slidePro: boolean
  onAppendSlide?: (page: AiSlidePayload, plan: DeckPlan) => void | Promise<void>
  onApplySlides?: (text: string, plan?: DeckPlan) => number | Promise<number>
  onPendingSlides?: (state: { done: number; total: number } | null) => void
}

/** Lượt 2 (chặng 26b): duyệt dàn ý → sinh từng slide, chèn dần, sửa 1 lần. */
export async function generateDeck(planTurnId: string, plan: DeckPlan, env: DeckEnv) {
  const { busy, abortRef, setTurns, setBusy, slidePro, onAppendSlide, onApplySlides, onPendingSlides } = env
  // abortRef chặn double-click trước khi `busy` kịp render
  if (busy || abortRef.current) return
  const botId = `a${Date.now()}`
  const total = plan.slides.length
  setTurns((t) => [
    ...t.map((turn) =>
      turn.id === planTurnId ? { ...turn, planState: 'approved' as const } : turn,
    ),
    { id: `u${Date.now()}-plan`, role: 'user', text: 'Tạo slide từ dàn ý này.' },
    {
      id: botId,
      role: 'assistant',
      text: '',
      pending: true,
      intent: 'doc',
      progress: { done: 0, total },
    },
  ])
  setBusy(true)
  const leftAtStart = leftTokens()
  const controller = new AbortController()
  abortRef.current = controller
  onPendingSlides?.({ done: 0, total })

  // undefined = chưa xong · null = bỏ (lỗi/sửa không được) · object = đã qua kiểm tra
  const results: Array<AiSlidePayload | null | undefined> = new Array(total)
  const collected: AiSlidePayload[] = []
  let nextIndex = 0
  /** slide kế tiếp được chèn — giữ đúng thứ tự dàn ý dù trang khác xong trước */
  let cursor = 0
  let skipped = 0
  let quotaError: AiQuotaError | undefined
  const usedGraphics = new Set<string>()

  /** lô đang chạy (stream): số trang đã viết trong lô, theo chỉ số trang đầu lô */
  const inFlight = new Map<number, number>()
  let live: string | undefined
  let liveAt = 0
  const progress = (current?: string) => {
    // editor vẽ số ô skeleton còn lại = total - cursor (kể cả trang bị bỏ)
    onPendingSlides?.({ done: cursor, total })
    const written = Math.min(total, results.filter((r) => r !== undefined).length + [...inFlight.values()].reduce((a, b) => a + b, 0))
    setTurns((t) =>
      t.map((turn) =>
        turn.id === botId
          ? { ...turn, progress: { done: cursor, total, current: current ?? turn.progress?.current, written, live } }
          : turn,
      ),
    )
  }
  const batchProgress = (start: number, size: number) => (p: LlmProgress) => {
    if (p.phase === 'retry') {
      inFlight.set(start, 0)
      live = 'Lỗi kết nối, đang thử lại…'
      return progress()
    }
    // trang đã viết xong trong lô = số trang đã sang trang kế (mỗi trang có "layout")
    const n = Math.max(0, (p.text.match(/"layout"\s*:/g) ?? []).length - 1)
    inFlight.set(start, Math.min(size, n))
    if (Date.now() - liveAt < 250) return
    liveAt = Date.now()
    if (p.phase === 'think') live = tailLine(p.thinking, 140) || undefined
    else {
      const title = [...p.text.matchAll(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].at(-1)?.[1]
      live = title ? `Đang viết: ${title.replace(/\\(.)/g, '$1')}` : undefined
    }
    progress()
  }

  const landReady = async () => {
    while (!controller.signal.aborted && cursor < total && results[cursor] !== undefined) {
      const raw = results[cursor]
      const page = raw ? dropRepeatedGraphic(raw, usedGraphics) : raw
      if (page) {
        if (onAppendSlide) await onAppendSlide(page, plan)
        else collected.push(page)
      } else {
        skipped++
      }
      cursor++
    }
    progress()
  }

  let landing = Promise.resolve()
  const worker = async () => {
    while (!controller.signal.aborted && !quotaError) {
      const start = nextIndex
      if (start >= total) return
      nextIndex = Math.min(total, start + SLIDE_BATCH)
      const indices = Array.from({ length: nextIndex - start }, (_, k) => start + k)
      progress(plan.slides[start].title)
      try {
        const pages = await generateSlideBatch(plan, indices, controller.signal, batchProgress(start, indices.length), slidePro)
        indices.forEach((index, k) => { results[index] = pages[k] })
        inFlight.delete(start)
      } catch (err) {
        if (controller.signal.aborted) return
        if (import.meta.env.DEV) console.warn('[AI] lỗi khi tạo slide', err)
        if (err instanceof AiQuotaError) quotaError ??= err
        indices.forEach((index) => { results[index] = null })
        inFlight.delete(start)
      }
      landing = landing.then(landReady)
      await landing
    }
  }

  try {
    // hai luồng song song: đủ nhanh, vẫn tránh dồn request lên provider
    await Promise.all([worker(), worker()])

    if (controller.signal.aborted) {
      setTurns((t) =>
        t.map((turn) =>
          turn.id === botId
            ? { ...turn, text: `Đã dừng sau ${cursor}/${total} slide.`, pending: false }
            : turn,
        ),
      )
      return
    }

    const added = onAppendSlide ? cursor - skipped : collected.length
      ? await onApplySlides?.(JSON.stringify({ title: plan.title, slides: collected }), plan) ?? 0 : 0
    skipped = total - added
    if (quotaError) throw quotaError
    const message = [
      added
        ? `Đã thêm ${added} slide vào bài trình bày.`
        : 'Không thêm được slide nào.',
      skipped
        ? `Còn ${skipped} slide chưa tạo được.`
        : '',
    ]
      .filter(Boolean)
      .join(' ')
    setTurns((t) =>
      t.map((turn) =>
        turn.id === botId
          ? { ...turn, text: message, pending: false, progress: undefined }
          : turn,
      ),
    )
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError'
    setTurns((t) =>
      t.map((turn) =>
        turn.id === botId
          ? {
              ...turn,
              text: '',
              pending: false,
              progress: undefined,
              error: aborted
                ? 'Đã dừng.'
                : (err as Error)?.message || 'Không gọi được AI.',
              ...(err instanceof AiQuotaError ? { topup: true } : {}),
            }
          : turn,
      ),
    )
  } finally {
    const cost = spentSince(leftAtStart)
    if (cost) setTurns((t) => t.map((turn) => (turn.id === botId ? { ...turn, cost } : turn)))
    setBusy(false)
    abortRef.current = null
    onPendingSlides?.(null)
  }
}
