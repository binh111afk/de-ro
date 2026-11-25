/**
 * Trợ lý AI — panel bên trái, port từ GenOffice
 * (`apps/docs/src/renderer/ai/AiPanel.tsx` + `packages/ui/src/AiComposer.tsx`).
 *
 * Cấu trúc giống bản gốc:
 *   - header có tiêu đề + nút thu gọn;
 *   - vùng chat: lượt người dùng (pill xám) và lượt AI (chữ thuần, không bong bóng);
 *   - trạng thái trống có tiêu đề + gợi ý dạng pill viền;
 *   - composer là thẻ bo 16px, Enter gửi, Shift+Enter xuống dòng, Esc để dừng.
 */
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/lib/useSession'
import { Button } from '@/components/ui'
import { AiQuotaRing, TopupLink } from '@/components/AiQuotaRing'
import { AiQuotaError, callLlm, TOKENS_PER_POINT, type LlmMessage } from '@/lib/llm'
import { khungPromptFor } from '@/lib/khungPrompt'
import type { AiSlidePayload, DeckPlan } from '@/lib/aiDeck'
import type { SlideEditOp } from '@/lib/slideEdit'
import { buildSourcePack, isDocx, pickedKey, type PickedSource, type SourcePack } from '@/lib/sources'
import { BookOpen, Globe, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import { SiteSelect } from '@/components/SiteSelect'
import { CONTINUE_EXAM_EDIT, chatOnly, rewritesWholeExam, startsWithJson, type AiApplyResult } from '@/lib/aiDocContext'
import { looksLikeComplaint, nearlySame, reportAi } from '@/lib/aiFeedback'
import { dialog } from '@/components/Dialog'
import { SourcePicker } from './SourcePicker'
import { cn } from '@/lib/cn'
import { AI_ATTACH_EVENT, takeAiRefs, type AiRef } from '@/lib/aiAttach'
import { chatHistoryKey, encodeChatHistory, loadChatHistory, saveChatHistory } from '@/lib/aiChatHistory'
import { planExamSplit } from '@/lib/examSplit'
import { compactHistory } from '@/lib/aiHistory'
import 'katex/dist/katex.min.css'
import { ASK_DEFAULT, AiAskPanel, needsAskFirst, parseAsk } from './AiAskPanel'
import { IconClose, IconEnter, IconPaperclip, IconStop } from './icons'
import { finishBoard } from './ai/boardFlow'
import {
  ActLog, ATTACH_ACCEPT, ATTACH_ICONS, attachKind, BOARD_STARTERS, DeckProgress, formatSize, newId, PlanCard, RefIcon,
  SentAttachments, SLIDE_STARTERS, SOURCE_KIND_LABEL, SourceAttachmentIcon, SourcesButton, STARTERS, ThinkingLine, TypedMarkdown,
  type Attachment,
} from './ai/chatParts'
import { finishExam, runExamSplit } from './ai/examFlow'
import { createLiveLog, type TurnCtx } from './ai/flowKit'
import { finishSlide, generateDeck, runSlideEdit } from './ai/slideFlow'
import { AI_EFFORT } from './ai/slideGen'
import { closeLog, detectIntent, historyOf, leftTokens, spentSince, type ActStep, type AiMode, type ChatTurn } from './ai/turns'

export type { AiMode, ChatTurn } from './ai/turns'

const SLIDE_PRO_WARN_KEY = 'dethinhbien-slide-pro-warned'
const SLIDE_MODES = [
  { value: 'std', label: 'Tiêu chuẩn' },
  { value: 'pro', label: 'Chuyên nghiệp' },
] as const
const WEB_WARN_KEY = 'dethinhbien-web-search-warned'

export function AiPanel({ historyKey, ...props }: Omit<React.ComponentProps<typeof AiConversation>, 'storageKey'> & { historyKey?: string }) {
  const mode = props.mode ?? 'exam'
  const storageKey = historyKey && mode !== 'board' ? chatHistoryKey(mode, historyKey) : undefined
  return <AiConversation key={storageKey} {...props} storageKey={storageKey} />
}

function AiConversation({
  onApplyBlocks,
  onExamMaintenance,
  onApplySlides,
  onAppendSlide,
  existingSlideCount = 0,
  onClearSlides,
  editContext,
  onApplyEdits,
  onPendingSlides,
  contextSummary,
  documentDigest,
  focusFor,
  mode = 'exam',
  attachKey,
  storageKey,
  panelOpen = true,
  onBoardOps,
}: {
  /** nhận nội dung AI sinh ra để áp vào tài liệu; trả về câu báo lại (failed = không áp được) */
  onApplyBlocks?: (text: string, allowReplace: boolean, request?: string) => AiApplyResult | undefined
  onExamMaintenance?: (request: string) => AiApplyResult | undefined
  /** nguyên văn đầy đủ các khối giáo viên nhắc tới trong yêu cầu (nối vào lượt người dùng) */
  focusFor?: (request: string) => string
  /** nhận nội dung AI sinh ra để áp thành slide mới (khi AI trả về JSON deck) */
  onApplySlides?: (text: string, plan?: DeckPlan) => number | Promise<number>
  /** chèn ngay một slide vừa sinh vào cuối deck (chặng 26b) */
  onAppendSlide?: (page: AiSlidePayload, plan: DeckPlan) => void | Promise<void>
  /** chế độ HTML: nhận danh sách slide HTML (mỗi phần tử là một tài liệu HTML) để thay vào bài giảng */
  /** số slide đã có nội dung: > 0 thì duyệt dàn ý sẽ hỏi ghi đè hay nối tiếp */
  existingSlideCount?: number
  /** xoá toàn bộ slide hiện có (khi người dùng chọn ghi đè) */
  onClearSlides?: () => void
  /** mô tả deck hiện tại (theme, phông, danh sách slide) cho lệnh sửa slide bằng AI */
  editContext?: string
  /** áp lệnh sửa slide có sẵn do AI trả về; trả các dòng báo lại người dùng */
  onApplyEdits?: (ops: SlideEditOp[], signal: AbortSignal) => string[] | Promise<string[]>
  /** báo số slide còn chờ để editor vẽ ô skeleton (null = xong/huỷ) */
  onPendingSlides?: (state: { done: number; total: number } | null) => void
  /** mô tả ngắn tài liệu hiện tại, đưa vào system prompt */
  contextSummary?: string
  /** bản tóm tắt nội dung đề (id + loại khối + trích đoạn) cho model sửa đúng chỗ */
  documentDigest?: string
  /** 'exam' = soạn đề, 'slide' = soạn bài trình bày, 'board' = bảng vẽ */
  mode?: AiMode
  /** nhận phần đính kèm "Hỏi AI" (attachToAi) có cùng khoá */
  attachKey?: string
  storageKey?: string
  panelOpen?: boolean
  /** bảng vẽ: áp các lệnh vẽ AI trả về; trả các dòng báo lại người dùng */
  onBoardOps?: (ops: Record<string, unknown>[]) => string[]
}) {
  // AI chỉ cho người đã đăng nhập (server chặn khách); máy dev vẫn dùng được
  const session = useSession()
  const needsLogin = !session && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  const starters = mode === 'slide' ? SLIDE_STARTERS : mode === 'board' ? BOARD_STARTERS : STARTERS
  const [turns, setTurns] = useState<ChatTurn[]>(() => storageKey ? loadChatHistory(storageKey) : [])
  const [restoredTurnIds] = useState(() => new Set(turns.map((turn) => turn.id)))
  const lastSaved = useRef<string | null>(null)
  useEffect(() => {
    if (!storageKey) return
    const encoded = encodeChatHistory(turns)
    if (lastSaved.current !== null && encoded !== lastSaved.current) saveChatHistory(storageKey, encoded)
    lastSaved.current = encoded
  }, [storageKey, turns])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [refs, setRefs] = useState<AiRef[]>([])
  /** nguồn chọn trong modal "Thêm nguồn" cho lượt đang soạn */
  const [picked, setPicked] = useState<PickedSource[]>([])
  // tìm trên web trước mỗi lượt soạn (tốn thêm điểm); tắt mặc định
  const [webSearch, setWebSearch] = useState(false)
  const toggleWebSearch = async () => {
    if (webSearch) return setWebSearch(false)
    let skip = false
    try {
      skip = localStorage.getItem(WEB_WARN_KEY) === '1'
    } catch {
      /* chế độ riêng tư: hỏi mỗi lần */
    }
    if (!skip) {
      const ok = await dialog.choose(
        'Mỗi lượt soạn sẽ tìm nguồn trên web trước rồi mới soạn, tốn thêm khoảng 10–15 điểm AI (thường gấp rưỡi bình thường).',
        { title: 'Tìm trên web', confirmLabel: 'Bật', altLabel: 'Bật, không hỏi lại' },
      )
      if (!ok) return
      if (ok === 'alt') {
        try {
          localStorage.setItem(WEB_WARN_KEY, '1')
        } catch {
          /* bỏ qua */
        }
      }
    }
    setWebSearch(true)
  }
  const [slidePro, setSlidePro] = useState(false)
  useEffect(() => {
    if (!panelOpen) setSlidePro(false)
  }, [panelOpen])
  const toggleSlidePro = async () => {
    let skip = false
    try {
      skip = localStorage.getItem(SLIDE_PRO_WARN_KEY) === '1'
    } catch {
      /* chế độ riêng tư: hỏi mỗi lần */
    }
    if (!skip) {
      const answer = await dialog.choose(
        'Slide có bố cục đa dạng hơn, ảnh tư liệu, số liệu nổi bật và ghi nguồn. Chế độ này tốn thêm điểm AI.',
        { title: 'Chuyên nghiệp', cancelLabel: 'Hủy', confirmLabel: 'Bật', altLabel: 'Bật, không hỏi lại' },
      )
      if (!answer) return
      if (answer === 'alt') {
        try {
          localStorage.setItem(SLIDE_PRO_WARN_KEY, '1')
        } catch {
          /* bỏ qua */
        }
      }
    }
    setSlidePro(true)
  }
  const [pickerOpen, setPickerOpen] = useState(false)
  useEffect(() => {
    if (!attachKey) return
    const take = () => {
      const got = takeAiRefs(attachKey)
      if (!got.length) return
      setRefs((cur) => [...cur, ...got.filter((g) => !cur.some((c) => c.id === g.id))])
      requestAnimationFrame(() => taRef.current?.focus())
    }
    take()
    const on = (e: Event) => { if ((e as CustomEvent).detail?.key === attachKey) take() }
    window.addEventListener(AI_ATTACH_EVENT, on)
    return () => window.removeEventListener(AI_ATTACH_EVENT, on)
  }, [attachKey])
  const [removingFiles, setRemovingFiles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  /** dàn ý vừa duyệt khi deck đã có slide: chờ người dùng chọn ghi đè / nối tiếp */
  const [overwriteAsk, setOverwriteAsk] = useState<{ turnId: string; plan: DeckPlan } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<Attachment[]>([])
  const dragDepth = useRef(0)
  const pageDrag = useRef<globalThis.DragEvent | null>(null)
  const [draggingFiles, setDraggingFiles] = useState(false)

  useEffect(() => {
    // Ảnh kéo từ trong trang cũng có thể mang kiểu Files.
    const start = (event: globalThis.DragEvent) => { pageDrag.current = event }
    const end = () => { pageDrag.current = null }
    document.addEventListener('dragstart', start, true)
    document.addEventListener('dragend', end, true)
    return () => {
      document.removeEventListener('dragstart', start, true)
      document.removeEventListener('dragend', end, true)
    }
  }, [])

  // giữ ref đồng bộ để cleanup unmount thu hồi đúng URL
  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(
    () => () => {
      abortRef.current?.abort()
      filesRef.current.forEach((f) => f.url && URL.revokeObjectURL(f.url))
    },
    [],
  )

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const added: Attachment[] = []
    for (const file of Array.from(list)) {
      const kind = attachKind(file)
      if (!kind) continue
      added.push({
        id: newId(),
        name: file.name,
        size: file.size,
        kind,
        url: kind === 'image' ? URL.createObjectURL(file) : undefined,
        file,
      })
    }
    if (added.length) setFiles((current) => [...current, ...added])
  }

  const removeFile = (id: string) => {
    setRemovingFiles((cur) => (cur.includes(id) ? cur : [...cur, id]))
    window.setTimeout(() => {
      setFiles((current) => {
        const target = current.find((f) => f.id === id)
        if (target?.url) URL.revokeObjectURL(target.url)
        return current.filter((f) => f.id !== id)
      })
      setRemovingFiles((cur) => cur.filter((f) => f !== id))
    }, 170)
  }

  // cuộn xuống cuối khi có lượt mới
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns])

  // tự động lớn dần textarea theo nội dung; đo lại khi bề rộng đổi — panel đóng sẵn có bề rộng 0,
  // đo lúc đó thì mỗi chữ một dòng, ô nhập cao vọt và giữ nguyên khi panel mở ra
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    const fit = () => {
      if (!ta.clientWidth) return
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(168, ta.scrollHeight)}px`
    }
    fit()
    let w = ta.clientWidth
    const ro = new ResizeObserver(() => { if (ta.clientWidth !== w) { w = ta.clientWidth; fit() } })
    ro.observe(ta)
    return () => ro.disconnect()
  }, [input])

  const send = useCallback(async (override?: string, opt: { strong?: boolean } = {}) => {
    const text = (override ?? input).trim()
    if ((!text && !files.length && !refs.length && !picked.length) || busy || abortRef.current) return
    const sentRefs = refs
    const refNote = sentRefs.length
      ? `\n\nPhần đang chọn (người dùng hỏi về phần này):\n${sentRefs.map((r) => `- ${r.label}: ${r.detail}`).join('\n')}`
      : ''

    const sentFiles = files
    const sentPicked = picked
    const fileNote = sentFiles.length
      ? `\n\nTệp đính kèm: ${sentFiles
          .map((f) => `${f.name} (${f.kind === 'image' ? 'ảnh' : f.kind === 'doc' ? 'Word' : f.kind === 'sheet' ? 'bảng tính' : 'PDF'})`)
          .join(', ')}`
      : ''

    // Giữ File trong `sentFiles` để trích nội dung; lượt chat chỉ lưu metadata
    // để không giữ cả tệp lớn trong state sau khi gửi.
    const displayFiles = sentFiles.map((f) => ({ ...f, file: undefined }))
    const userTurn: ChatTurn = {
      id: `u${Date.now()}`,
      role: 'user',
      text,
      files: displayFiles,
      refs: sentRefs.map((r) => r.label),
      ...(sentPicked.length ? { pickedSources: sentPicked.map(({ name, kind }) => ({ name, kind })) } : {}),
    }
    const botId = `a${Date.now()}`
    // trả lời panel hỏi lại = tiếp tục yêu cầu soạn ban đầu
    const previousTurn = turns.at(-1)
    const answeringAsk = override != null && previousTurn?.askState === 'open' && previousTurn.ask != null
    // tín hiệu không hài lòng với lượt trước: "sai rồi…" hoặc gửi lại gần giống
    const prevUser = [...turns].reverse().find((t) => t.role === 'user')
    const prevBot = turns[turns.length - 1]
    if (prevUser && prevBot?.role === 'assistant' && !answeringAsk) {
      const info = { mode, request: prevUser.text, reply: prevBot.text || prevBot.error || '', context: documentDigest }
      if (looksLikeComplaint(text)) reportAi('complaint', info, text)
      else if (override == null && nearlySame(text, prevUser.text)) reportAi('resend', info, text)
    }
    // đã có bài: gửi cả bài cho AI, nó tự chọn sửa, trả lời bằng chữ, hay xin làm bài mới (new_deck)
    const editingSlides = mode === 'slide' && existingSlideCount > 0 && !!onApplyEdits && !answeringAsk
    // đoán theo từ khoá: chỉ để hiện bước đang chạy và gắn nhãn lượt gọi
    const intent =answeringAsk || editingSlides || (!text && (sentFiles.length || sentPicked.length)) ? 'doc' : detectIntent(text, mode)
    const originalRequest = answeringAsk ? turns.at(-2)?.text ?? text : text
    const requestWithAnswer = answeringAsk && originalRequest !== text ? `${originalRequest}\n\n${text}` : text
    // đề đang có nội dung: mọi lượt đều không được thay cả đề, trừ khi giáo viên bảo làm đề mới
    const revisingExam = mode === 'exam' && !!documentDigest && !rewritesWholeExam(originalRequest)
    setTurns((t) => [
      ...t,
      userTurn,
      { id: botId, role: 'assistant', text: '', pending: true, intent, log: [] },
    ])
    const patchTurn = (p: (turn: ChatTurn) => Partial<ChatTurn>) =>
      setTurns((t) => t.map((turn) => (turn.id === botId ? { ...turn, ...p(turn) } : turn)))
    const logSet = (f: (log: ActStep[]) => ActStep[]) => patchTurn((t) => (t.log ? { log: f(t.log) } : {}))
    /** mở bước mới (bước đang chạy trước đó coi như xong) */
    const logStart = (label: string, note?: string) => logSet((l) => [...closeLog(l, 'done'), { label, state: 'active', note }])
    const logPatch = (p: Partial<ActStep>) => logSet((l) => l.map((s, i) => (i === l.length - 1 && s.state === 'active' ? { ...s, ...p } : s)))
    if (override == null) setInput('')
    setFiles([])
    setRefs([])
    setPicked([])
    setBusy(true)
    const leftAtStart = leftTokens()

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const examDoc = mode === 'exam'
      const local = examDoc && !sentFiles.length && !sentRefs.length && !sentPicked.length
        ? onExamMaintenance?.(originalRequest) : undefined
      if (local) {
        patchTurn(() => ({ text: local.text, pending: false, log: undefined }))
        return
      }
      // Ngoài luồng soạn đề, DOCX, PDF và nguồn đã chọn vẫn được đọc khi gửi.
      const sourceFiles = examDoc ? sentFiles : sentFiles.filter((f) =>
        f.kind === 'pdf' || (f.kind === 'doc' && isDocx(f.name, f.file?.type)),
      )
      let pack: SourcePack = (answeringAsk && previousTurn?.askSourcePack) || { tier: 0, items: [], warnings: [] }
      if (sourceFiles.length || sentPicked.length) {
        logStart('Đọc nguồn')
        // đọc ảnh PDF mỗi lô mất vài chục giây: đếm giây để không trông như treo
        let readNote = ''
        const readAt = Date.now()
        const readSecs = () => `${Math.max(1, Math.round((Date.now() - readAt) / 1000))} giây`
        const tick = setInterval(() => logPatch({ note: readNote ? `${readNote} · ${readSecs()}` : readSecs() }), 1000)
        const added = await buildSourcePack(sourceFiles, sentPicked, {
          onProgress: (note) => { readNote = note.replace(/…$/, ''); logPatch({ note: `${readNote} · ${readSecs()}` }) },
          signal: controller.signal,
        }).finally(() => clearInterval(tick))
        pack = { tier: pack.tier || added.tier, items: [...pack.items, ...added.items], warnings: [...pack.warnings, ...added.warnings] }
        logSet((l) => closeLog(l, 'done', `${pack.items.length} nguồn`))
      }
      const sourceNote = pack.warnings.length ? pack.warnings.join(' ') : undefined
      if (pack.items.length || sourceNote) {
        patchTurn(() => ({ sources: pack.items.map((s) => s.name), sourceNote }))
      }
      controller.signal.throwIfAborted()
      if ((sourceFiles.length || sentPicked.length) && !pack.items.length) {
        throw new Error('Không đọc được nội dung nguồn đã gửi.')
      }
      // khung chương trình Toán: đoán lớp/chương từ yêu cầu; lượt nối tiếp ("thêm 2 câu") thì lấy từ các lượt trước và đầu đề
      let khungBlock = ''
      if (mode === 'exam') {
        const prev = turns.filter((t) => t.role === 'user').slice(-3).map((t) => t.text).reverse()
        khungBlock =
          (await khungPromptFor(text)) ||
          (await khungPromptFor([text, ...prev, contextSummary ?? '', (documentDigest ?? '').slice(0, 800)].join('\n')))
      }

      // lượt cũ gộp thành bản tóm tắt ngắn để token đầu vào không phình theo độ dài cuộc trò chuyện
      const history = compactHistory(historyOf(turns))
      // vừa hỏi lại xong thì không hỏi nữa; bảng vẽ không dùng panel hỏi
      const justAsked = turns.slice(-2).some((t) => t.ask)
      const askRule = !(mode === 'board' || justAsked || revisingExam)
      // server ghép system prompt từ `task` + dữ liệu người dùng này (client không giữ chữ prompt)
      const srcInput = {
        withSources: examDoc || pack.items.length > 0,
        sourceTier: pack.tier,
        sources: pack.items.map((s) => ({ tier: s.tier, name: s.name, url: s.url, text: s.text })),
        khung: khungBlock,
      }
      const mainTask: { name: string; input: Record<string, unknown> } =
        mode === 'board'
          ? { name: 'bang-ve', input: { ops: !!onBoardOps, contextSummary, ...srcInput } }
          : mode === 'slide'
          ? { name: 'slide-chat', input: { variant: 'plan', ask: askRule, contextSummary, ...srcInput, pro: slidePro || undefined } }
          : { name: 'soan-de', input: { text: requestWithAnswer, intent, digest: documentDigest, contextSummary, ask: askRule, ...srcInput } }

      const messages: LlmMessage[] = [
        ...history,
        { role: 'user', content: (requestWithAnswer || (sentRefs.length ? 'Giải thích hoặc góp ý cho phần đang chọn.' : sentFiles.length ? 'Hãy xử lý các tệp đính kèm sau.' : 'Hãy xử lý các nguồn đã chọn.')) + fileNote + refNote + (mode === 'exam' && focusFor ? focusFor(originalRequest) : '') },
      ]

      // lượt đầu, tài liệu trống, chưa nêu môn: hỏi bằng prompt ngắn (~1.000 token thay vì ~10.000).
      // Model thấy đoán được môn thì trả "proceed" và chạy luồng đầy đủ như cũ.
      if (askRule && intent === 'doc' && !history.length && !documentDigest && !sentFiles.length && !sentRefs.length && !sentPicked.length && !(mode === 'slide' && existingSlideCount > 0) && needsAskFirst(text)) {
        logStart('Phân tích yêu cầu')
        const quick = await callLlm([{ role: 'user', content: text }], { signal: controller.signal, reasoningEffort: 'low', task: { name: 'hoi-truoc' } })
        const quickAsk = parseAsk(quick.content)
        if (!quickAsk) logSet((l) => closeLog(l, 'done'))
        if (quickAsk) {
          patchTurn(() => ({ text: quickAsk.intro || 'Mình cần biết thêm vài điều trước khi soạn.', ask: quickAsk, askState: 'open', pending: false, log: undefined }))
          return
        }
      }
      // bật Tìm trên web: một lượt tìm + tóm tắt nguồn (DeepSeek, tắt suy luận), rồi soạn như thường với phần tóm tắt trong prompt
      if (webSearch && intent === 'doc' && mode !== 'board') {
        logStart('Tìm trên web')
        const found = await callLlm(
          [
            { role: 'user', content: [...turns.filter((t) => t.role === 'user').slice(-2).map((t) => t.text), text].filter(Boolean).join('\n') },
          ],
          { signal: controller.signal, webSearch: true, maxTokens: 4000, task: { name: 'tim-web' } },
        )
        mainTask.input.webFound = found.content.trim()
        patchTurn(() => ({ webSources: found.citations }))
        logSet((l) => closeLog(l, 'done', found.citations?.length ? `${found.citations.length} trang web` : undefined))
      }
      const ctx: TurnCtx = {
        mode, text, intent, originalRequest, revisingExam, userTurn, botId, messages, mainTask, srcInput, controller,
        setTurns, patchTurn, logSet, logStart, logPatch, contextSummary, documentDigest, editContext, slidePro,
        onApplyBlocks, onApplySlides, onApplyEdits, onBoardOps,
      }
      if (editingSlides && await runSlideEdit(ctx)) return
      // phần suy nghĩ hiện thẳng cho giáo viên xem → bắt suy nghĩ bằng tiếng Việt (model mặc định nghĩ tiếng Anh)
      mainTask.input.think = true
      const live = createLiveLog(ctx)
      // đề nguồn dài + "soạn lại / đổi số liệu": chia nhiều lượt nhỏ (một lượt cả đề thì model hết token)
      const split =
        mode === 'exam' && intent === 'doc' && onApplyBlocks && pack.items.length === 1 && !revisingExam
          ? planExamSplit(originalRequest, pack.items[0].text)
          : null
      if (split) return await runExamSplit(ctx, split, live)
      live.onProgress({ phase: 'think', thought: 0, thinking: '', text: '' })
      // model chưa gửi gì (đang xếp hàng / suy luận không stream): số giây vẫn chạy
      const ticker = setInterval(() => live.phase() === 'think' && logPatch({ note: live.secs() }), 1000)
      let res: Awaited<ReturnType<typeof callLlm>>
      try {
        res = await callLlm(messages, {
          signal: controller.signal,
          // Soạn slide trả JSON có schema rõ ràng; reasoning 'max' chỉ làm lượt
          // dàn ý kéo dài 30–60s (dễ vượt timeout proxy) mà không nội dung hơn.
          reasoningEffort: mode === 'slide' ? AI_EFFORT.slide : AI_EFFORT.exam,
          onProgress: live.onProgress,
          strong: opt.strong,
          task: mainTask,
        })
      } finally {
        clearInterval(ticker)
      }
      const ask = askRule ? parseAsk(res.content) : null
      if (ask) {
        patchTurn(() => ({ text: ask.intro || 'Mình cần biết thêm vài điều trước khi soạn.', ask, askState: 'open', intent: 'doc', pending: false, log: undefined, askSourcePack: pack }))
        return
      }
      const n = (res.content.match(/"type"\s*:\s*"question"/g) ?? []).length
      const note = live.phase() === 'write' ? (n ? `${n} câu` : undefined) : live.phase() === 'think' ? live.secs() : undefined
      logSet((l) => closeLog(l, 'done', note))
      // lượt hỏi chuyện không kèm sửa đề thì không có bước này
      // slide: thẻ dàn ý hiện ngay bên dưới nên không cần bước này
      const apply = mode === 'board' ? /"ops"\s*:/.test(res.content)
        : mode === 'exam' && startsWithJson(res.content) && !chatOnly(originalRequest)
      if (apply) logStart(mode === 'board' ? 'Vẽ lên bảng' : 'Đưa vào đề')
      // nhường một khung hình để bước kịp hiện trước khi áp (việc áp chạy đồng bộ)
      if (apply) await new Promise((r) => setTimeout(r, 350))
      controller.signal.throwIfAborted()
      if (mode === 'board') return finishBoard(ctx, res)
      if (mode === 'slide') return await finishSlide(ctx, res)
      await finishExam(ctx, res)
    } catch (err) {
      const aborted = (err as Error)?.name === 'AbortError'
      setTurns((t) =>
        t.map((turn) =>
          turn.id === botId
            ? {
                ...turn,
                text: turn.text || '',
                pending: false,
                ...(turn.log ? { log: closeLog(turn.log, 'failed') } : {}),
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
      if (cost) patchTurn(() => ({ cost }))
      setBusy(false)
      abortRef.current = null
    }
  }, [input, files, refs, picked, busy, turns, contextSummary, documentDigest, mode, onApplyBlocks, onExamMaintenance, onApplySlides, slidePro, existingSlideCount, editContext, onApplyEdits, onBoardOps])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setBusy(false)
  }, [])

  /** Lượt 2 (chặng 26b): duyệt dàn ý → sinh từng slide, chèn dần, sửa 1 lần. */
  const generateFromPlan = useCallback(
    (planTurnId: string, plan: DeckPlan) =>
      generateDeck(planTurnId, plan, { busy, abortRef, setTurns, setBusy, slidePro, onAppendSlide, onApplySlides, onPendingSlides }),
    [busy, onAppendSlide, onApplySlides, onPendingSlides, slidePro],
  )

  const cancelPlan = useCallback((planTurnId: string) => {
    setTurns((t) =>
      t.map((turn) =>
        turn.id === planTurnId ? { ...turn, planState: 'cancelled' as const } : turn,
      ),
    )
  }, [])

  const chooseReplace = (turn: ChatTurn, accept: boolean) => {
    if (!turn.replace) return
    const result = accept ? onApplyBlocks?.(turn.replace.content, true, turn.replace.request) : undefined
    const text = accept ? result?.text ?? turn.text : 'Đã giữ đề cũ.'
    setTurns((ts) => ts.map((t) => (t.id === turn.id ? { ...t, text, replace: undefined } : t)))
  }

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void send()
        return
      }
      if (e.key === 'Escape' && busy) {
        e.preventDefault()
        stop()
      }
    },
    [busy, send, stop],
  )

  const empty = turns.length === 0
  const lastTurn = turns[turns.length - 1]
  const openAsk = !busy && lastTurn?.askState === 'open' && lastTurn.ask ? lastTurn : null
  const canAttachFiles = !busy && !needsLogin && !openAsk
  const isFileDrag = (e: DragEvent<HTMLDivElement>) =>
    (!pageDrag.current || pageDrag.current.defaultPrevented) &&
    e.dataTransfer.types.includes('Files') &&
    e.target instanceof Node && e.currentTarget.contains(e.target)
  const answerAsk = (reply: string) => {
    if (!openAsk) return
    setTurns((t) => t.map((turn) => (turn.id === openAsk.id ? { ...turn, askState: 'done', askSourcePack: undefined } : turn)))
    void send(reply)
  }

  return (
    <div
      className="ai-panel"
      onDragEnter={(e) => {
        if (!isFileDrag(e)) return
        if (++dragDepth.current === 1) setDraggingFiles(true)
      }}
      onDragLeave={(e) => {
        if (!isFileDrag(e) || dragDepth.current === 0) return
        if (--dragDepth.current === 0) setDraggingFiles(false)
      }}
      onDragOver={(e) => {
        if (!isFileDrag(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = canAttachFiles ? 'copy' : 'none'
      }}
      onDrop={(e) => {
        if (!isFileDrag(e)) return
        e.preventDefault()
        dragDepth.current = 0
        setDraggingFiles(false)
        if (canAttachFiles) addFiles(e.dataTransfer.files)
      }}
    >
      {canAttachFiles && draggingFiles ? (
        <div className="ai-file-drop-overlay">Thả tệp để đính kèm</div>
      ) : null}
      <div className="ai-panel-header">
        <span className="ai-panel-title">
          Trợ lý AI
        </span>
      </div>

      <div className="ai-chat" ref={scrollRef}>
        {empty ? (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-title">
              {mode === 'slide' ? 'Nhờ AI soạn slide giúp bạn' : mode === 'board' ? 'Hỏi AI khi giảng trên bảng' : 'Nhờ AI soạn đề giúp bạn'}
            </div>
            <div className="ai-chat-empty-body">
              {mode === 'board'
                ? 'Nhờ AI gợi ý cách vẽ minh hoạ, dàn ý trình bày trên bảng, ví dụ và câu hỏi gợi mở cho bài đang giảng.'
                : mode === 'slide'
                ? 'Mô tả chủ đề bài giảng; AI lập dàn ý để bạn duyệt rồi viết nội dung từng slide.'
                : 'Mô tả môn học và các ý chính, hoặc dán tài liệu tham khảo; AI sẽ viết bản nháp đầu tiên thẳng vào trang.'}
            </div>
            <div className="ai-starter-list">
              {starters.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  className="ai-starter"
                  onClick={() => {
                    setInput(s.prompt)
                    taRef.current?.focus()
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn) => (
            <div
              key={turn.id}
              className={cn(
                'ai-msg',
                turn.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant',
              )}
            >
              {turn.role === 'user' ? <SentAttachments turn={turn} /> : null}
              {turn.log?.length ? <ActLog steps={turn.log} /> : null}
              {turn.pending && !turn.text ? (
                turn.log?.length ? null : turn.progress ? (
                  <DeckProgress {...turn.progress} />
                ) : (
                  <ThinkingLine mode={mode} intent={turn.intent} />
                )
              ) : (
                turn.role === 'user' ? (
                  turn.text ? (
                    <div className="ai-msg-bubble">
                      <TypedMarkdown text={turn.text} chat={false} animate={!restoredTurnIds.has(turn.id)} />
                    </div>
                  ) : null
                ) : (
                  <TypedMarkdown text={turn.text} chat animate={!restoredTurnIds.has(turn.id)} />
                )
              )}
              <PlanCard
                plan={turn.plan}
                state={turn.planState}
                busy={busy}
                onApprove={(plan) =>
                  existingSlideCount > 0 ? setOverwriteAsk({ turnId: turn.id, plan }) : void generateFromPlan(turn.id, plan)
                }
                onCancel={() => cancelPlan(turn.id)}
              />
              {turn.sourceNote ? <p className="ai-msg-error">{turn.sourceNote}</p> : null}
              {turn.sources?.length || turn.webSources?.length ? <SourcesButton sources={turn.sources} web={turn.webSources} /> : null}
              {turn.error ? (
                <div className="ai-msg-error">
                  {turn.error}
                  {turn.topup ? <TopupLink className="ml-1.5 font-semibold underline" /> : null}
                </div>
              ) : null}
              {turn.replace && !busy && turn.id === turns[turns.length - 1]?.id ? (
                <div className="flex gap-2">
                  <button type="button" className="ai-retry" onClick={() => chooseReplace(turn, true)}>Thay cả đề</button>
                  <button type="button" className="ai-retry" onClick={() => chooseReplace(turn, false)}>Giữ đề cũ</button>
                </div>
              ) : null}
              {turn.retry && !busy && turn.id === turns[turns.length - 1]?.id ? (
                <button type="button" className="ai-retry" onClick={() => void send(turn.retry, { strong: true })}>
                  <RotateCcw size={13} /> Thử lại
                </button>
              ) : null}
              {turn.role === 'assistant' && !turn.pending && !turn.ask && (turn.text || turn.error) ? (
                <span className="ai-vote">
                  {(['up', 'down'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={cn('ai-dislike', v === 'up' && 'ai-like', turn.vote === v && 'is-on')}
                      data-tip={v === 'up' ? 'Tốt' : 'Chưa tốt'}
                      aria-label={v === 'up' ? 'Tốt' : 'Chưa tốt'}
                      aria-pressed={turn.vote === v}
                      disabled={!!turn.vote}
                      onClick={() => {
                        const i = turns.findIndex((t) => t.id === turn.id)
                        const req = [...turns.slice(0, i)].reverse().find((t) => t.role === 'user')
                        reportAi(v, { mode, request: req?.text ?? '', reply: turn.text || turn.error || '', context: documentDigest })
                        setTurns((ts) => ts.map((t) => (t.id === turn.id ? { ...t, vote: v } : t)))
                      }}
                    >
                      {v === 'up' ? <ThumbsUp size={13} /> : <ThumbsDown size={13} />}
                    </button>
                  ))}
                  {turn.cost ? (
                    <span className="ai-cost" data-tip="Điểm AI đã tiêu">
                      {Math.max(1, Math.round(turn.cost / TOKENS_PER_POINT)).toLocaleString('vi-VN')} điểm
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
          ))
        )}
      </div>

      {pickerOpen ? (
        <SourcePicker
          value={picked}
          onClose={() => setPickerOpen(false)}
          onDone={(next) => {
            setPicked(next)
            setPickerOpen(false)
            taRef.current?.focus()
          }}
        />
      ) : null}
      {needsLogin ? (
        <div className="ai-composer ai-login">
          <p>Bạn cần đăng nhập để dùng trợ lý AI.</p>
          <Link to="/dang-nhap">
            <Button variant="primary" size="sm">Đăng nhập</Button>
          </Link>
        </div>
      ) : openAsk?.ask ? (
        <AiAskPanel
          key={openAsk.id}
          ask={openAsk.ask}
          figure={mode !== 'slide'}
          request={turns.filter((t) => t.role === 'user').map((t) => t.text).join(' ')}
          onSubmit={answerAsk}
          onSkip={() => answerAsk(mode === 'exam' && documentDigest
            ? CONTINUE_EXAM_EDIT
            : ASK_DEFAULT.replace('Những gì chưa chọn: l', 'L'))}
        />
      ) : (
      <div className="ai-composer">
        <div className="ai-input-box">
          {refs.length > 0 && (
            <div className="ai-attachments">
              {refs.map((r) => (
                <div key={r.id} className="ai-attachment" data-tip={r.detail.slice(0, 300)}>
                  <span className="ai-attachment__icon grid place-items-center text-clay"><RefIcon /></span>
                  <span className="ai-attachment__meta">
                    <span className="ai-attachment__name">{r.label}</span>
                    <span className="ai-attachment__size">Đang chọn</span>
                  </span>
                  <button type="button" className="ai-attachment__remove" data-tip="Bỏ đính kèm" aria-label={`Bỏ ${r.label}`}
                    onClick={() => setRefs((cur) => cur.filter((x) => x.id !== r.id))}>
                    <IconClose size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {picked.length > 0 && (
            <div className="ai-attachments">
              {picked.map((p) => (
                <div key={pickedKey(p)} className="ai-attachment">
                  <SourceAttachmentIcon source={p} />
                  <span className="ai-attachment__meta">
                    <span className="ai-attachment__name" data-tip={p.name}>{p.name}</span>
                    <span className="ai-attachment__size">
                      {SOURCE_KIND_LABEL[p.kind]}
                    </span>
                  </span>
                  <button type="button" className="ai-attachment__remove" data-tip="Bỏ nguồn" aria-label={`Bỏ nguồn ${p.name}`}
                    onClick={() => setPicked((cur) => cur.filter((x) => pickedKey(x) !== pickedKey(p)))}>
                    <IconClose size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="ai-attachments">
              {files.map((f) => (
                <div
                  key={f.id}
                  className={cn('ai-attachment', removingFiles.includes(f.id) && 'is-removing')}
                >
                  {f.kind !== 'image' ? (
                    <img src={ATTACH_ICONS[f.kind]} alt="" className="ai-attachment__icon" />
                  ) : f.url ? (
                    <img src={f.url} alt="" className="ai-attachment__thumb" />
                  ) : null}
                  <span className="ai-attachment__meta">
                    <span className="ai-attachment__name" data-tip={f.name}>{f.name}</span>
                    <span className="ai-attachment__size">{formatSize(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="ai-attachment__remove"
                    data-tip="Bỏ tệp"
                    aria-label={`Bỏ ${f.name}`}
                    onClick={() => removeFile(f.id)}
                  >
                    <IconClose size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <p className="ai-attach-cost">Có tệp đính kèm, lượt này có thể tốn nhiều điểm hơn.</p>
          )}
          <textarea
            ref={taRef}
            placeholder={
              mode === 'board'
                ? 'Hỏi về bài đang giảng trên bảng…'
                : mode === 'slide'
                ? 'Mô tả bài giảng cần soạn…'
                : 'Mô tả đề cần soạn…'
            }
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Nhập yêu cầu cho AI"
          />
          <div className="ai-input-footer">
            <button
              type="button"
              className="ai-attach-btn"
              data-tip="Đính kèm tệp (docx, xlsx, pdf, ảnh)"
              aria-label="Đính kèm tệp"
              disabled={!canAttachFiles}
              onClick={() => fileRef.current?.click()}
            >
              <IconPaperclip size={16} />
            </button>
            <button
              type="button"
              className={cn('ai-attach-btn', picked.length > 0 && 'text-clay')}
              data-tip="Thêm nguồn"
              aria-label="Thêm nguồn"
              onClick={() => setPickerOpen(true)}
            >
              <BookOpen size={16} strokeWidth={1.75} />
            </button>
            {mode !== 'board' ? (
              <button
                type="button"
                className={cn('ai-attach-btn', webSearch && 'is-on')}
                data-tip={webSearch ? 'Tìm trên web: đang bật (tốn thêm điểm)' : 'Tìm trên web'}
                aria-label="Tìm trên web"
                aria-pressed={webSearch}
                onClick={() => void toggleWebSearch()}
              >
                <Globe size={16} strokeWidth={1.75} />
              </button>
            ) : null}
            {mode === 'slide' ? (
              <SiteSelect
                up
                label="Chế độ slide"
                value={slidePro ? 'pro' : 'std'}
                options={SLIDE_MODES}
                onChange={(v) => (v === 'pro' ? void toggleSlidePro() : setSlidePro(false))}
                triggerClassName={cn('ai-attach-btn', 'ai-attach-btn--label', slidePro && 'is-on')}
                className="shrink-0"
              />
            ) : null}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ATTACH_ACCEPT}
              className="ai-attach-input"
              disabled={!canAttachFiles}
              onChange={(e) => {
                if (canAttachFiles) addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <span className="ai-input-spacer" />
            <AiQuotaRing className="mr-1" />
            {busy ? (
              <button
                type="button"
                className="ai-send-btn is-stop"
                onClick={stop}
                data-tip="Dừng"
                aria-label="Dừng"
              >
                <IconStop size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="ai-send-btn"
                onClick={() => void send()}
                disabled={!input.trim() && !files.length && !refs.length && !picked.length}
                data-tip="Gửi"
                aria-label="Gửi"
              >
                <IconEnter size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {overwriteAsk ? (
        <div className="ai-html-modal" role="dialog" aria-modal="true" aria-label="Ghi đè slide cũ">
          <div className="ai-html-modal__box ai-html-modal__box--notice">
            <h3>Bài giảng đang có {existingSlideCount} slide</h3>
            <p className="ai-html-modal__text">Ghi đè toàn bộ slide cũ bằng dàn ý mới, hay soạn nối tiếp sau slide cũ?</p>
            <div className="ai-html-modal__actions">
              <button type="button" onClick={() => setOverwriteAsk(null)}>Huỷ</button>
              <button
                type="button"
                onClick={() => {
                  const ask = overwriteAsk
                  setOverwriteAsk(null)
                  void generateFromPlan(ask.turnId, ask.plan)
                }}
              >
                Nối tiếp
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  const ask = overwriteAsk
                  setOverwriteAsk(null)
                  onClearSlides?.()
                  void generateFromPlan(ask.turnId, ask.plan)
                }}
              >
                Ghi đè
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
