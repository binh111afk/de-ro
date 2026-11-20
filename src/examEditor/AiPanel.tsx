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
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '@/lib/useSession'
import { Button } from '@/components/ui'
import { aiPointsLeft, callLlm, callLlmChecked, lastAiQuota, type AiQuota, type LlmMessage, type LlmProgress } from '@/lib/llm'
import { khungPromptFor } from '@/lib/khungPrompt'
import {
  parseAiObject,
  parseDeckPlan,
  summarizeAiDeck,
  type AiSlidePayload,
  type DeckPlan,
  type DeckPlanSlide,
} from '@/lib/aiDeck'
import { checkSlide, dropRepeatedGraphic, parseBatchSlides, planDecorKit, repairPrompt } from '@/lib/slideAi'
import { DECK_THEMES } from '@/lib/slideTheme'
import { designById } from '@/lib/slideDesigns'
import { splitHtmlDeck } from '@/lib/htmlDeck'
import { looksLikeEdit, parseEditCommands, type SlideEditOp } from '@/lib/slideEdit'
import { useSlidingThumb } from './useSlidingThumb'
import { buildSourcePack, loadPickedSources, pickedKey, type PickedSource, type SourcePack } from '@/lib/sources'
import { BookOpen, Globe, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { AiApplyResult } from '@/lib/aiDocContext'
import { looksLikeComplaint, nearlySame, rememberAiTurn, reportAi } from '@/lib/aiFeedback'
import { dialog } from '@/components/Dialog'
import { SourcePicker } from './SourcePicker'
import { cn } from '@/lib/cn'
import { AI_ATTACH_EVENT, takeAiRefs, type AiRef } from '@/lib/aiAttach'
import { chatHistoryKey, encodeChatHistory, loadChatHistory, saveChatHistory } from '@/lib/aiChatHistory'
import { extractJson } from '@/lib/llm'
import aiThinkingAnim from '@/assets/ai-assistant.svg'
import { Markdown } from '@/lib/aiChatMarkdown'
import 'katex/dist/katex.min.css'
import { ASK_DEFAULT, AiAskPanel, askHistoryText, needsAskFirst, parseAsk, type AiAsk } from './AiAskPanel'
import { IconClose, IconEnter, IconPaperclip, IconStop } from './icons'

type AttachKind = 'doc' | 'sheet' | 'pdf' | 'image'

interface Attachment {
  id: string
  name: string
  size: number
  kind: AttachKind
  /** object URL chỉ dành cho ảnh */
  url?: string
  /** giữ File để trích nội dung trước khi gọi AI (docx/pdf/xlsx) */
  file?: File
}

const ATTACH_ICONS: Record<Exclude<AttachKind, 'image'>, string> = {
  doc: '/brand/file-icons/doc.svg',
  sheet: '/brand/file-icons/sheet.svg',
  pdf: '/brand/file-icons/pdf.svg',
}

/** Chỉ nhận tài liệu Word/Excel/PDF và ảnh — đúng danh sách người dùng chốt. */
const ATTACH_ACCEPT = '.doc,.docx,.xls,.xlsx,.csv,.pdf,image/*'

function attachKind(file: File): AttachKind | null {
  const name = file.name.toLowerCase()
  if (file.type.startsWith('image/')) return 'image'
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
  if (/\.(docx?|rtf)$/.test(name)) return 'doc'
  if (/\.(xlsx?|csv)$/.test(name)) return 'sheet'
  return null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const newId = (() => {
  let seq = 0
  return () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `attach-${Date.now()}-${++seq}`
})()

/** Theo dõi `prefers-reduced-motion` — hiệu ứng gõ chữ tắt khi người dùng cần. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Hiện câu trả lời dần dần như đang gõ. Tốc độ co theo độ dài để đề dài không
 * kéo dài quá ~1,6s; tắt hẳn khi `prefers-reduced-motion`.
 */
function TypedMarkdown({ text, chat, animate }: { text: string; chat: boolean; animate: boolean }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced || !animate ? text : '')

  useEffect(() => {
    if (reduced || !animate || !text) {
      setShown(text)
      return
    }
    const duration = Math.min(1600, 140 + text.length * 3)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setShown(text.slice(0, Math.ceil(progress * text.length)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, reduced, animate])

  return <Markdown text={shown} chat={chat} />
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** tệp đính kèm của lượt người dùng (để hiển thị lại trong chat) */
  files?: Attachment[]
  fileNames?: string[]
  /** thành phần đang chọn được đính kèm (bảng vẽ, câu hỏi, slide) */
  refs?: string[]
  /** true khi đang chờ model */
  pending?: boolean
  /** 'doc' = yêu cầu soạn/sửa tài liệu, 'chat' = hỏi đáp thường */
  intent?: 'doc' | 'chat'
  /** tên các nguồn đã dùng cho lượt này (tệp mẫu / tài liệu lưu / web) */
  sources?: string[]
  /** trang web lượt tìm trên web đã dẫn */
  webSources?: Array<{ url: string; title: string }>
  /** cảnh báo nguồn (tệp không đọc được, chưa cấu hình search…) */
  sourceNote?: string
  /** thông báo lỗi nếu lượt lỗi */
  error?: string
  /** dàn ý slide chờ duyệt (chặng 26a) */
  plan?: DeckPlan
  planState?: 'pending' | 'approved' | 'cancelled'
  /** tiến trình sinh từng slide (chặng 26b) */
  progress?: { done: number; total: number; current?: string; written?: number; live?: string }
  /** soạn đề: nhật ký việc AI đang làm (chỉ bước có thật), bước cuối `active` là bước đang chạy */
  log?: ActStep[]
  /** AI hỏi lại vì yêu cầu mơ hồ; 'open' = panel hỏi đang chờ trả lời */
  ask?: AiAsk
  askState?: 'open' | 'done'
  /** kết quả không áp được vào đề: yêu cầu để gửi lại bằng nút Thử lại */
  retry?: string
  /** người dùng đã bấm 👎 */
  vote?: 'up' | 'down'
}

interface ActStep {
  label: string
  state: 'active' | 'done' | 'failed'
  /** tóm tắt ngắn bên phải (vd "45 giây", "7/20 câu") */
  note?: string
  /** dòng chữ mờ chạy theo khi bước đang chạy: AI đang nghĩ gì / đang viết câu nào */
  live?: string
}

/** đóng bước đang chạy (xong / lỗi) */
const closeLog = (log: ActStep[], state: 'done' | 'failed', note?: string): ActStep[] =>
  log.map((s) => (s.state === 'active' ? { ...s, state, live: undefined, ...(note !== undefined ? { note } : {}) } : s))

/** một dòng, giữ phần cuối (chữ mới nhất) */
const tailLine = (s: string, n: number) => {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? `…${t.slice(-n)}` : t
}

/** nhật ký kiểu app code: bước đang chạy có dòng chạy theo, bước xong để lại tóm tắt */
function ActLog({ steps }: { steps: ActStep[] }) {
  return (
    <ol className="ai-steps" aria-label="AI đang làm">
      {steps.map((s, i) => (
        <li key={i} className={`ai-step ai-step--${s.state}`}>
          <span className="ai-step__icon" aria-hidden="true">
            {s.state === 'done' ? '✓' : s.state === 'failed' ? '!' : <img className="ai-step__mascot" src={aiThinkingAnim} alt="" />}
          </span>
          <span className="ai-step__label">{s.label}</span>
          {s.note ? <span className="ai-step__note">{s.note}</span> : null}
          {s.state === 'active' && s.live ? <span className="ai-step__live">{s.live}</span> : null}
        </li>
      ))}
    </ol>
  )
}

/** nút "Nguồn (n)" bấm mở danh sách nguồn + cảnh báo, thay cho dòng chữ lộ thiên dưới tin nhắn */
function SourcesButton({ sources, web, note }: { sources?: string[]; web?: Array<{ url: string; title: string }>; note?: string }) {
  const n = (sources?.length ?? 0) + (web?.length ?? 0)
  const showSources = () => {
    void dialog.show(
      <>
        {n > 0 ? (
          <ul className="max-h-[55vh] list-disc space-y-1 overflow-auto pl-5 [overflow-wrap:anywhere]">
            {sources?.map((source, i) => <li key={i}>{source}</li>)}
            {web?.map(({ url, title }, i) => {
              const parsed = URL.canParse(url) ? new URL(url) : null
              return (
                <li key={i}>
                  {parsed && (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? (
                    <>
                      <a className="underline" href={parsed.href} target="_blank" rel="noopener noreferrer">{title}</a>
                      <span className="block text-xs text-ink-3">{parsed.hostname}</span>
                    </>
                  ) : title}
                </li>
              )
            })}
          </ul>
        ) : null}
        {note ? <p className="ai-msg-source-note">{note}</p> : null}
      </>,
      'Nguồn',
    )
  }
  return (
    <div className="ai-sources">
      <button type="button" className="ai-sources__btn" aria-haspopup="dialog" onClick={showSources}>
        Nguồn ({n})
        {note ? <span className="ai-sources__dot" aria-label="có cảnh báo" /> : null}
      </button>
    </div>
  )
}

const STARTERS = [
  {
    title: 'Sinh đề trắc nghiệm',
    prompt: 'Soạn đề trắc nghiệm 20 câu môn Toán lớp 9 về hệ thức lượng, kèm đáp án.',
  },
  {
    title: 'Sinh đề tự luận',
    prompt: 'Soạn đề tự luận 4 câu môn Toán lớp 9 về hệ thức lượng, có thang điểm chi tiết.',
  },
  {
    title: 'Rà soát đề hiện tại',
    prompt: 'Đọc đề thi đang soạn, phát hiện lỗi trình bày và đề xuất chỉnh sửa.',
  },
  {
    title: 'Thêm câu hỏi',
    prompt: 'Bổ sung 5 câu trắc nghiệm vào cuối phần trắc nghiệm, độ khó tăng dần.',
  },
]

/** gợi ý riêng cho ngữ cảnh soạn slide */
/** soạn đề, soạn slide, hay bảng vẽ (chỉ trò chuyện, chưa vẽ lên bảng) */
export type AiMode = 'exam' | 'slide' | 'board'

const BOARD_STARTERS = [
  {
    title: 'Gợi ý hình minh hoạ',
    prompt: 'Tôi đang giảng định lý Pytago lớp 8. Gợi ý cách vẽ hình minh hoạ lên bảng, từng bước một.',
  },
  {
    title: 'Dàn ý trình bày bảng',
    prompt: 'Lập dàn ý chia bảng thành các phần để giảng bài "Hệ thức lượng trong tam giác vuông" lớp 9.',
  },
  {
    title: 'Ví dụ giảng nhanh',
    prompt: 'Cho 3 ví dụ ngắn, giải được ngay trên bảng, về phương trình bậc hai lớp 9.',
  },
  {
    title: 'Câu hỏi gợi mở',
    prompt: 'Gợi ý 5 câu hỏi gợi mở để hỏi học sinh khi giảng về lực ma sát lớp 10.',
  },
]

function RefIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

const SLIDE_STARTERS = [
  {
    title: 'Lập dàn ý bài giảng',
    prompt: 'Lập dàn ý bài giảng 8 slide về hệ thức lượng lớp 9, mỗi slide có tiêu đề và các ý chính.',
  },
  {
    title: 'Sinh nội dung slide',
    prompt: 'Viết nội dung chi tiết cho bài giảng về hệ thức lượng lớp 9, chia thành các slide ngắn gọn.',
  },
  {
    title: 'Tóm tắt nội dung',
    prompt: 'Tóm tắt bài giảng đang soạn thành các slide tiêu đề ngắn, dễ trình bày.',
  },
  {
    title: 'Gợi ý hình ảnh',
    prompt: 'Gợi ý hình ảnh và biểu đồ phù hợp cho từng slide trong bài giảng về hệ thức lượng.',
  },
]

/** Dải trạng thái khi chờ model. API hiện trả một lượt nên đây là tiến trình
 * mô phỏng (không phải log suy luận thật); muốn đúng từng bước cần streaming. */
const EXAM_THINKING = [
  'Đang phân tích yêu cầu…',
  'Đang lên bố cục đề…',
  'Đang viết đầu đề…',
  'Đang soạn nội dung câu hỏi…',
  'Đang kiểm tra đáp án…',
  'Đang rà soát lại đề…',
  'Đang hoàn thiện…',
]
const SLIDE_THINKING = [
  'Đang phân tích yêu cầu…',
  'Đang lên dàn ý slide…',
  'Đang viết tiêu đề slide…',
  'Đang soạn nội dung từng slide…',
  'Đang thêm ghi chú trình bày…',
  'Đang hoàn thiện…',
]
const CHAT_THINKING = [
  'Đang xem câu hỏi…',
  'Đang soạn câu trả lời…',
  'Đang kiểm tra lại…',
]

/** Đoán nhanh yêu cầu có sửa tài liệu không, để chọn dải trạng thái phù hợp. */
function detectIntent(text: string, mode: AiMode): 'doc' | 'chat' {
  if (mode === 'board') return 'chat'
  const t = text.toLowerCase()
  const hints =
    mode === 'slide'
      ? ['slide', 'bài giảng', 'dàn ý', 'tóm tắt', 'hình ảnh', 'thêm', 'sửa', 'đổi', 'soạn', 'sinh', 'viết']
      : ['soạn', 'sinh đề', 'tạo đề', 'viết đề', 'làm đề', 'thêm câu', 'bổ sung', 'sửa', 'rà soát', 'đổi', 'chỉnh', 'xuất đề', 'in đề']
  return hints.some((h) => t.includes(h)) ? 'doc' : 'chat'
}

function ThinkingLine({ mode, intent }: { mode: AiMode; intent?: 'doc' | 'chat' }) {
  const steps =
    intent === 'chat' ? CHAT_THINKING : mode === 'slide' ? SLIDE_THINKING : EXAM_THINKING
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
    const timer = setInterval(
      () => setStep((n) => Math.min(n + 1, steps.length - 1)),
      2400,
    )
    return () => clearInterval(timer)
  }, [steps])
  return (
    <div className="ai-thinking">
      {/* animation "Trợ lý giấy" do người dùng cung cấp — SVG tự chạy,
          không cần lottie-web (~450 KB JS) */}
      <img
        className="ai-thinking__anim"
        src={aiThinkingAnim}
        alt=""
        aria-hidden="true"
        width={22}
        height={22}
      />
      <span>{steps[step]}</span>
    </div>
  )
}

const WEB_WARN_KEY = 'dethinhbien-web-search-warned'

/** Lịch sử hội thoại gửi kèm mỗi lượt gọi model. */
function historyOf(turns: ChatTurn[]): LlmMessage[] {
  return turns.flatMap((t) => {
    const names = t.files?.map((f) => f.name) ?? t.fileNames
    if (!t.text.trim() && !names?.length && !t.refs?.length) return []
    return [{
      role: t.role,
      content: t.text +
        (t.ask ? `\n${askHistoryText(t.ask)}` : '') +
        (names?.length ? `\n[Tệp đính kèm: ${names.join(', ')}]` : '') +
        (t.refs?.length ? `\n[Phần đính kèm: ${t.refs.join(', ')}]` : ''),
    }]
  })
}

/** Thẻ dàn ý chờ duyệt — chặng 26a: xem trước khi sinh nội dung từng slide. */
function PlanCard({
  plan,
  state = 'pending',
  busy,
  onApprove,
  onCancel,
}: {
  plan?: DeckPlan
  state?: ChatTurn['planState']
  busy: boolean
  onApprove: (plan: DeckPlan) => void
  onCancel: () => void
}) {
  if (!plan) return null
  const theme = plan.theme ? DECK_THEMES.find((t) => t.id === plan.theme) : undefined
  const designName = plan.design ? designById(plan.design)?.name : undefined
  const tags = [`${plan.slides.length} slide`, designName, theme?.name, plan.audience].filter(Boolean) as string[]

  return (
    <div className={`ai-plan${state !== 'pending' ? ' is-done' : ''}`}>
      <div className="ai-plan-head">
        <div className="ai-plan-title">{plan.title || 'Dàn ý bài trình bày'}</div>
        <div className="ai-plan-meta">{tags.join(' · ')}</div>
      </div>
      <ol className="ai-plan-list">
        {plan.slides.map((slide, index) => (
          <li key={`${index}-${slide.title}`} className="ai-plan-row">
            <span className="ai-plan-index">{index + 1}</span>
            <div className="ai-plan-slide">
              <div className="ai-plan-slide-title">{slide.title}</div>
              {slide.brief ? (
                <div className="ai-plan-brief" title={slide.brief}>
                  {slide.brief}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {state === 'pending' ? (
        <div className="ai-plan-actions">
          <button type="button" className="ai-plan-ghost" onClick={onCancel}>
            Huỷ
          </button>
          <button
            type="button"
            className="ai-plan-primary"
            onClick={() => onApprove(plan)}
            disabled={busy}
          >
            Tạo {plan.slides.length} slide
          </button>
        </div>
      ) : (
        <div className="ai-plan-state">
          {state === 'approved' ? 'Đã tạo slide từ dàn ý này' : 'Đã huỷ'}
        </div>
      )}
    </div>
  )
}

/** Tiến trình thật khi sinh từng slide (chặng 26b). */
function DeckProgress({
  done,
  total,
  current,
  written,
  live,
}: {
  done: number
  total: number
  current?: string
  /** số trang đã viết xong (kể cả trang trong lô đang chạy, chưa chèn) */
  written?: number
  /** dòng chạy theo: AI đang nghĩ gì / đang viết trang nào */
  live?: string
}) {
  const shown = Math.max(done, written ?? 0)
  const percent = total ? Math.round((shown / total) * 100) : 0
  done = shown
  return (
    <div className="ai-progress">
      <div className="ai-progress-head">
        <img
          className="ai-thinking__anim"
          src={aiThinkingAnim}
          alt=""
          aria-hidden="true"
          width={22}
          height={22}
        />
        <span>
          {current ? `Đang viết: ${current}` : 'Đang chuẩn bị…'} · {done}/{total} slide
        </span>
      </div>
      <div
        className="ai-progress-bar"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {live ? <div className="ai-step__live ai-progress-live">{live}</div> : null}
    </div>
  )
}

/**
 * Sinh nội dung một slide từ dàn ý đã duyệt. Sai field bắt buộc thì sửa đúng
 * một lần; vẫn sai trả null để slide đó bị bỏ, không chèn nội dung rác.
 */
export async function generateSlide(
  plan: DeckPlan,
  planSlide: DeckPlanSlide,
  index: number,
  signal: AbortSignal,
): Promise<AiSlidePayload | null> {
  // system prompt do server ghép từ dàn ý (task slide-trang)
  const task = { name: 'slide-trang', input: { plan, index } }
  const user = `Viết slide ${index + 1}: "${planSlide.title}".`
  // bộ trang trí là của cả deck (chọn ở dàn ý), gắn vào mọi trang
  const decorKit = planDecorKit(plan)
  const withKit = (page: AiSlidePayload): AiSlidePayload => ({ ...page, decorKit })
  const first = await callLlm([{ role: 'user', content: user }], { signal, reasoningEffort: AI_EFFORT.slide, task })
  const check = checkSlide(
    parseAiObject(first.content),
    planSlide.layout,
    planSlide.tone,
  )
  if (!check.errors.length && !check.readability.length) return withKit(check.page)

  const repaired = await callLlm(
    [
      { role: 'user', content: user },
      { role: 'assistant', content: first.content },
      { role: 'user', content: repairPrompt([...check.errors, ...check.readability]) },
    ],
    // lượt đầu không dùng được: hoàn token lượt đó
    { signal, reasoningEffort: AI_EFFORT.slide, retryOf: first.receipt, task },
  )
  const second = checkSlide(
    parseAiObject(repaired.content),
    planSlide.layout,
    planSlide.tone,
  )
  // Lỗi cứng sau repair → bỏ slide; chỉ còn lỗi "chữ nhỏ" thì vẫn dùng (đừng mất slide vì thẩm mỹ).
  if (second.errors.length) return check.errors.length ? null : withKit(check.page)
  return withKit(second.page)
}

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
 * Sinh một nhóm slide trong MỘT lần gọi. Slide nào sai thì sửa riêng đúng một lần
 * (prompt một slide + bản lỗi); vẫn sai trả null để slide đó bị bỏ.
 */
export async function generateSlideBatch(
  plan: DeckPlan,
  indices: number[],
  signal: AbortSignal,
  /** có thì gọi dạng stream để hiện tiến độ thật của lô (suy nghĩ, trang đang viết) */
  onProgress?: (p: LlmProgress) => void,
): Promise<Array<AiSlidePayload | null>> {
  if (indices.length === 1) return [await generateSlide(plan, plan.slides[indices[0]], indices[0], signal)]
  const decorKit = planDecorKit(plan)
  const withKit = (page: AiSlidePayload): AiSlidePayload => ({ ...page, decorKit })
  // cả nhóm không đọc được (JSON hỏng/cụt) → hoàn token lượt đó, gọi lại một lần
  const res = await callLlmChecked(
    [
      { role: 'user', content: `Viết slide ${indices.map((i) => i + 1).join(', ')}.` },
    ],
    { signal, reasoningEffort: AI_EFFORT.slide, onProgress, task: { name: 'slide-lo', input: { plan, indices, think: !!onProgress } } },
    (content) => parseBatchSlides(parseAiObject(content), indices.length).some(Boolean),
  )
  const items = parseBatchSlides(parseAiObject(res.content), indices.length)
  return Promise.all(
    indices.map(async (index, k) => {
      const planSlide = plan.slides[index]
      if (!items[k]) return generateSlide(plan, planSlide, index, signal)
      const check = checkSlide(items[k], planSlide.layout, planSlide.tone)
      if (!check.errors.length && !check.readability.length) return withKit(check.page)
      const repaired = await callLlm(
        [
          { role: 'user', content: `Viết slide ${index + 1}: "${planSlide.title}".` },
          { role: 'assistant', content: JSON.stringify(items[k]) },
          { role: 'user', content: repairPrompt([...check.errors, ...check.readability]) },
        ],
        { signal, reasoningEffort: AI_EFFORT.slide, task: { name: 'slide-trang', input: { plan, index } } },
      )
      const second = checkSlide(parseAiObject(repaired.content), planSlide.layout, planSlide.tone)
      if (second.errors.length) return check.errors.length ? null : withKit(check.page)
      return withKit(second.page)
    }),
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
    { signal, reasoningEffort: AI_EFFORT.slide, task: { name: 'slide-trang', input: { plan, index } } },
  )
  const check = checkSlide(parseAiObject(reply.content), planSlide.layout, planSlide.tone)
  return check.errors.length ? null : { ...check.page, decorKit: planDecorKit(plan) }
}

/** Hạn mức AI server báo về sau mỗi lần gọi (null khi chưa gọi lần nào hoặc không giới hạn). */
function useAiQuota(): AiQuota | null {
  const [q, setQ] = useState<AiQuota | null>(lastAiQuota)
  useEffect(() => {
    const on = (e: Event) => setQ((e as CustomEvent<AiQuota>).detail)
    window.addEventListener('ai-quota', on)
    return () => window.removeEventListener('ai-quota', on)
  }, [])
  return q
}

export function AiPanel({ historyKey, ...props }: Omit<React.ComponentProps<typeof AiConversation>, 'storageKey'> & { historyKey?: string }) {
  const mode = props.mode ?? 'exam'
  const storageKey = historyKey && mode !== 'board' ? chatHistoryKey(mode, historyKey) : undefined
  return <AiConversation key={storageKey} {...props} storageKey={storageKey} />
}

function AiConversation({
  onApplyBlocks,
  onApplySlides,
  onAppendSlide,
  onApplyHtmlDeck,
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
  onBoardOps,
}: {
  /** nhận nội dung AI sinh ra để áp vào tài liệu; trả về câu báo lại (failed = không áp được) */
  onApplyBlocks?: (text: string) => AiApplyResult | undefined
  /** nguyên văn đầy đủ các khối giáo viên nhắc tới trong yêu cầu (nối vào lượt người dùng) */
  focusFor?: (request: string) => string
  /** nhận nội dung AI sinh ra để áp thành slide mới (khi AI trả về JSON deck) */
  onApplySlides?: (text: string, plan?: DeckPlan) => void
  /** chèn ngay một slide vừa sinh vào cuối deck (chặng 26b) */
  onAppendSlide?: (page: AiSlidePayload, plan: DeckPlan) => void | Promise<void>
  /** chế độ HTML: nhận danh sách slide HTML (mỗi phần tử là một tài liệu HTML) để thay vào bài giảng */
  onApplyHtmlDeck?: (htmls: string[]) => void
  /** số slide đã có nội dung: > 0 thì duyệt dàn ý sẽ hỏi ghi đè hay nối tiếp */
  existingSlideCount?: number
  /** xoá toàn bộ slide hiện có (khi người dùng chọn ghi đè) */
  onClearSlides?: () => void
  /** mô tả deck hiện tại (theme, phông, danh sách slide) cho lệnh sửa slide bằng AI */
  editContext?: string
  /** áp lệnh sửa slide có sẵn do AI trả về; trả các dòng báo lại người dùng */
  onApplyEdits?: (ops: SlideEditOp[]) => string[]
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
  const quota = useAiQuota()
  const [files, setFiles] = useState<Attachment[]>([])
  const [refs, setRefs] = useState<AiRef[]>([])
  /** nguồn chọn trong modal "Thêm nguồn" — giữ qua các lượt tới khi giáo viên bỏ */
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
  /** slide: 'deck' = layout engine (PPT), 'html' = một tệp HTML tự chứa */
  const [slideFormat, setSlideFormat] = useState<'deck' | 'html'>('deck')
  /** modal lưu ý hiện khi bấm sang HTML (chỉ trình chiếu, không sửa/xuất PPT) */
  const [htmlNotice, setHtmlNotice] = useState(false)
  /** dàn ý vừa duyệt khi deck đã có slide: chờ người dùng chọn ghi đè / nối tiếp */
  const [overwriteAsk, setOverwriteAsk] = useState<{ turnId: string; plan: DeckPlan } | null>(null)
  const segRef = useRef<HTMLDivElement>(null)
  const segThumb = useSlidingThumb(segRef, '.ai-format-opt.active', slideFormat)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<Attachment[]>([])

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
    const picked: Attachment[] = []
    for (const file of Array.from(list)) {
      const kind = attachKind(file)
      if (!kind) continue
      picked.push({
        id: newId(),
        name: file.name,
        size: file.size,
        kind,
        url: kind === 'image' ? URL.createObjectURL(file) : undefined,
        file,
      })
    }
    if (picked.length) setFiles((current) => [...current, ...picked])
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
    if ((!text && files.length === 0 && refs.length === 0) || busy || abortRef.current) return
    const sentRefs = refs
    const refNote = sentRefs.length
      ? `\n\nPhần đang chọn (người dùng hỏi về phần này):\n${sentRefs.map((r) => `- ${r.label}: ${r.detail}`).join('\n')}`
      : ''

    const sentFiles = files
    const fileNote = sentFiles.length
      ? `\n\nTệp đính kèm: ${sentFiles
          .map((f) => `${f.name} (${f.kind === 'image' ? 'ảnh' : f.kind === 'doc' ? 'Word' : f.kind === 'sheet' ? 'bảng tính' : 'PDF'})`)
          .join(', ')}`
      : ''

    // Giữ File trong `sentFiles` để trích nội dung; lượt chat chỉ lưu metadata
    // để không giữ cả tệp lớn trong state sau khi gửi.
    const displayFiles = sentFiles.map((f) => ({ ...f, file: undefined }))
    const userTurn: ChatTurn = { id: `u${Date.now()}`, role: 'user', text, files: displayFiles, refs: sentRefs.map((r) => r.label) }
    const botId = `a${Date.now()}`
    // trả lời panel hỏi lại = tiếp tục yêu cầu soạn ban đầu
    const answeringAsk = override != null && turns[turns.length - 1]?.ask != null
    // tín hiệu không hài lòng với lượt trước: "sai rồi…" hoặc gửi lại gần giống
    const prevUser = [...turns].reverse().find((t) => t.role === 'user')
    const prevBot = turns[turns.length - 1]
    if (prevUser && prevBot?.role === 'assistant' && !answeringAsk) {
      const info = { mode, request: prevUser.text, reply: prevBot.text || prevBot.error || '', context: documentDigest }
      if (looksLikeComplaint(text)) reportAi('complaint', info, text)
      else if (override == null && nearlySame(text, prevUser.text)) reportAi('resend', info, text)
    }
    const intent = answeringAsk || (sentFiles.length && !text.trim()) ? 'doc' : detectIntent(text, mode)
    setTurns((t) => [
      ...t,
      userTurn,
      { id: botId, role: 'assistant', text: '', pending: true, intent, ...(mode === 'exam' ? { log: [] } : {}) },
    ])
    // đề luôn hiện nhật ký suy nghĩ thật, kể cả lượt hỏi chuyện
    const examSteps = mode === 'exam'
    const patchTurn = (p: (turn: ChatTurn) => Partial<ChatTurn>) =>
      setTurns((t) => t.map((turn) => (turn.id === botId ? { ...turn, ...p(turn) } : turn)))
    const logSet = (f: (log: ActStep[]) => ActStep[]) => patchTurn((t) => (t.log ? { log: f(t.log) } : {}))
    /** mở bước mới (bước đang chạy trước đó coi như xong) */
    const logStart = (label: string, note?: string) => logSet((l) => [...closeLog(l, 'done'), { label, state: 'active', note }])
    const logPatch = (p: Partial<ActStep>) => logSet((l) => l.map((s, i) => (i === l.length - 1 && s.state === 'active' ? { ...s, ...p } : s)))
    if (override == null) setInput('')
    setFiles([])
    setRefs([])
    setBusy(true)

    const controller = new AbortController()
    abortRef.current = controller

    // Chỉ dùng nguồn giáo viên tự đưa vào (tệp đính kèm, "Thêm nguồn") — không tự lấy đề đã lưu hay tìm web.
    // Tệp đính kèm chỉ áp cho soạn/sửa ĐỀ; nguồn tự chọn áp cho mọi chế độ (soạn đề, slide, hỏi đáp).
    let pack: SourcePack = { tier: 0, items: [], warnings: [] }
    const sentPicked = picked
    const examDoc = intent === 'doc' && mode === 'exam'
    // yêu cầu cụt lủn ("soạn đề đi") thường bị hỏi lại: khỏi tìm nguồn web vô ích
    const vague = examDoc && !sentFiles.length && !sentPicked.length && text.split(/\s+/).length < 5 && !turns.length
    if ((examDoc && !vague) || sentPicked.length) {
      try {
        if (examDoc) pack = await buildSourcePack(sentFiles, sentPicked)
        else {
          const got = await loadPickedSources(sentPicked)
          pack = { tier: got.items.length ? 1 : 0, items: got.items, warnings: got.warnings }
        }
      } catch (err) {
        pack = {
          tier: 0,
          items: [],
          warnings: [`Không dựng được nguồn: ${err instanceof Error ? err.message : String(err)}`],
        }
      }
    }
    const sourceNames = pack.items.map((s) => s.name)
    const sourceNote = pack.warnings.length ? pack.warnings.join(' ') : undefined
    if (sourceNames.length || sourceNote) {
      setTurns((t) =>
        t.map((turn) =>
          turn.id === botId ? { ...turn, sources: sourceNames, sourceNote } : turn,
        ),
      )
    }
    if (examSteps && sourceNames.length) logSet((l) => [...l, { label: 'Đọc nguồn', state: 'done', note: `${sourceNames.length} nguồn` }])
    // khung chương trình Toán: đoán lớp/chương từ yêu cầu; lượt nối tiếp ("thêm 2 câu") thì lấy từ các lượt trước và đầu đề
    let khungBlock = ''
    if (intent === 'doc' && mode === 'exam') {
      const prev = turns.filter((t) => t.role === 'user').slice(-3).map((t) => t.text).reverse()
      khungBlock =
        (await khungPromptFor(text)) ||
        (await khungPromptFor([text, ...prev, contextSummary ?? '', (documentDigest ?? '').slice(0, 800)].join('\n')))
    }

    const history = historyOf(turns)
    // vừa hỏi lại xong thì không hỏi nữa; bảng vẽ và slide HTML không dùng panel hỏi
    const justAsked = turns.slice(-2).some((t) => t.ask)
    const askRule = !(mode === 'board' || justAsked)
    const slideDoc = mode === 'slide' && intent === 'doc'
    const htmlMode = mode === 'slide' && intent === 'doc' && slideFormat === 'html'
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
        ? { name: 'slide-chat', input: { variant: htmlMode ? 'html' : slideDoc ? 'plan' : 'chat', ask: askRule, contextSummary, ...srcInput } }
        : { name: 'soan-de', input: { text, intent, digest: documentDigest, contextSummary, ask: askRule, ...srcInput } }

    const messages: LlmMessage[] = [
      ...history,
      { role: 'user', content: (text || (sentRefs.length ? 'Giải thích hoặc góp ý cho phần đang chọn.' : 'Hãy xử lý các tệp đính kèm sau.')) + fileNote + refNote + (mode === 'exam' && focusFor ? focusFor(text) : '') },
    ]

    try {
      // Sửa slide CÓ SẴN (đổi phông/màu/theme/tông, xoá, dời slide): model chỉ trả lệnh có cấu trúc,
      // engine áp dụng. Không phải yêu cầu sửa ("action":"none") thì rơi xuống luồng soạn bình thường.
      if (mode === 'slide' && !htmlMode && existingSlideCount > 0 && onApplyEdits && looksLikeEdit(text)) {
        const editRes = await callLlm(
          [{ role: 'user', content: text }],
          { signal: controller.signal, reasoningEffort: 'low', task: { name: 'slide-sua', input: { context: editContext ?? contextSummary ?? '' } } },
        )
        const { ops, errors } = parseEditCommands(editRes.content)
        controller.signal.throwIfAborted()
        if (ops.length) {
          const lines = [...onApplyEdits(ops), ...errors.map((e) => `Bỏ qua: ${e}.`)]
          setTurns((t) =>
            t.map((turn) =>
              turn.id === botId
                ? { ...turn, text: lines.join('\n\n') + '\n\nBấm Ctrl+Z nếu muốn hoàn tác.', pending: false, intent: 'doc' }
                : turn,
            ),
          )
          return
        }
      }
      // lượt đầu, tài liệu trống, chưa nêu môn: hỏi bằng prompt ngắn (~1.000 token thay vì ~10.000).
      // Model thấy đoán được môn thì trả "proceed" và chạy luồng đầy đủ như cũ.
      if (askRule && !htmlMode && intent === 'doc' && !history.length && !documentDigest && !sentFiles.length && !sentRefs.length && !(mode === 'slide' && existingSlideCount > 0) && needsAskFirst(text)) {
        const quick = await callLlm([{ role: 'user', content: text }], { signal: controller.signal, reasoningEffort: 'low', task: { name: 'hoi-truoc' } })
        const quickAsk = parseAsk(quick.content)
        if (quickAsk) {
          patchTurn(() => ({ text: quickAsk.intro || 'Mình cần biết thêm vài điều trước khi soạn.', ask: quickAsk, askState: 'open', pending: false, log: undefined, sources: undefined, sourceNote: undefined }))
          return
        }
      }
      // bật Tìm trên web: một lượt tìm + tóm tắt nguồn (DeepSeek, tắt suy luận), rồi soạn như thường với phần tóm tắt trong prompt
      if (webSearch && intent === 'doc' && mode !== 'board') {
        if (examSteps) logStart('Tìm trên web')
        const found = await callLlm(
          [
            { role: 'user', content: [...turns.filter((t) => t.role === 'user').slice(-2).map((t) => t.text), text].filter(Boolean).join('\n') },
          ],
          { signal: controller.signal, webSearch: true, maxTokens: 4000, task: { name: 'tim-web' } },
        )
        mainTask.input.webFound = found.content.trim()
        patchTurn(() => ({ webSources: found.citations }))
        if (examSteps) logSet((l) => closeLog(l, 'done', found.citations?.length ? `${found.citations.length} trang web` : undefined))
      }
      // phần suy nghĩ hiện thẳng cho giáo viên xem → bắt suy nghĩ bằng tiếng Việt (model mặc định nghĩ tiếng Anh)
      if (examSteps) {
        mainTask.input.think = true
      }
      // nhật ký thật khi soạn đề (stream): Suy nghĩ (dòng suy luận chạy theo + số giây) → Viết đề (câu đang viết, N/T câu)
      const totalQ = Number(text.match(/(\d+)\s*câu/i)?.[1]) || 0
      // `as`: được gán trong callback nên TS không được thu hẹp kiểu về ''
      let phase = '' as '' | 'think' | 'write'
      let phaseAt = Date.now()
      let liveAt = 0
      const secs = () => {
        const s = Math.max(1, Math.round((Date.now() - phaseAt) / 1000))
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        return h ? `${h} giờ${m ? ` ${m} phút` : ''}` : m ? `${m} phút${s % 60 ? ` ${s % 60} giây` : ''}` : `${s} giây`
      }
      const onProgress = examSteps
        ? (p: LlmProgress) => {
            if (p.phase === 'retry') {
              logSet((l) => closeLog(l, 'failed', 'lỗi kết nối'))
              logStart('Thử lại với model dự phòng')
              phase = ''
              return
            }
            if (p.phase === 'think') {
              if (phase !== 'think') {
                phase = 'think'
                phaseAt = Date.now()
                logStart('Suy nghĩ')
              }
              if (Date.now() - liveAt < 200) return
              liveAt = Date.now()
              logPatch({ note: secs(), live: tailLine(p.thinking, 140) || undefined })
              return
            }
            if (phase !== 'write') {
              // tính số giây TRƯỚC khi đổi phaseAt (hàm cập nhật state chạy sau)
              const took = secs()
              if (phase === 'think') logSet((l) => closeLog(l, 'done', took))
              phase = 'write'
              phaseAt = Date.now()
              logStart(intent === 'doc' ? 'Viết đề' : 'Trả lời')
            }
            if (Date.now() - liveAt < 200) return
            liveAt = Date.now()
            const n = (p.text.match(/"type"\s*:\s*"question"/g) ?? []).length
            const stem = [...p.text.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)/g)].at(-1)?.[1]
            logPatch({
              note: n ? (totalQ ? `${Math.min(n, totalQ)}/${totalQ} câu` : `${n} câu`) : undefined,
              live: stem ? tailLine(stem.replace(/\\n/g, ' ').replace(/\\(.)/g, '$1'), 110) : undefined,
            })
          }
        : undefined
      onProgress?.({ phase: 'think', thought: 0, thinking: '', text: '' })
      // model chưa gửi gì (đang xếp hàng / suy luận không stream): số giây vẫn chạy
      const ticker = examSteps ? setInterval(() => phase === 'think' && logPatch({ note: secs() }), 1000) : undefined
      let res: Awaited<ReturnType<typeof callLlm>>
      try {
        res = await callLlm(messages, {
          signal: controller.signal,
          // Soạn slide trả JSON có schema rõ ràng; reasoning 'max' chỉ làm lượt
          // dàn ý kéo dài 30–60s (dễ vượt timeout proxy) mà không nội dung hơn.
          reasoningEffort: mode === 'slide' ? AI_EFFORT.slide : AI_EFFORT.exam,
          onProgress,
          strong: opt.strong,
          task: mainTask,
        })
      } finally {
        clearInterval(ticker)
      }
      const ask = askRule && !htmlMode ? parseAsk(res.content) : null
      if (ask) {
        patchTurn(() => ({ text: ask.intro || 'Mình cần biết thêm vài điều trước khi soạn.', ask, askState: 'open', intent: 'doc', pending: false, log: undefined, sources: undefined, sourceNote: undefined }))
        return
      }
      if (examSteps) {
        const n = (res.content.match(/"type"\s*:\s*"question"/g) ?? []).length
        const note = phase === 'write' ? (n ? `${n} câu` : undefined) : phase === 'think' ? secs() : undefined
        logSet((l) => closeLog(l, 'done', note))
        // lượt hỏi chuyện không kèm sửa đề thì không có bước này
        if (intent === 'doc' || /"(type|op)"\s*:/.test(res.content)) logStart('Đưa vào đề')
        // nhường một khung hình để bước "Đưa vào đề" kịp hiện trước khi áp đề (việc áp chạy đồng bộ)
        await new Promise((r) => setTimeout(r, 350))
      }
      controller.signal.throwIfAborted()
      if (htmlMode) {
        const fenced = res.content.match(/```(?:html)?\s*([\s\S]*?)```/i)
        const html = (fenced ? fenced[1] : res.content)
          .trim()
          .normalize('NFC')
          // Georgia/Cambria làm vỡ dấu tiếng Việt trên Windows → thay bằng Times
          .replace(/Georgia|Cambria/gi, '"Times New Roman"')
        if (!/^<!doctype html/i.test(html)) {
          setTurns((t) =>
            t.map((turn) =>
              turn.id === botId
                ? { ...turn, text: '', pending: false, error: 'AI không trả về tệp HTML hợp lệ. Thử lại với yêu cầu ngắn hơn.' }
                : turn,
            ),
          )
          return
        }
        const htmlSlides = splitHtmlDeck(html)
        if (!htmlSlides.length) {
          setTurns((t) =>
            t.map((turn) =>
              turn.id === botId
                ? { ...turn, text: '', pending: false, error: 'HTML của AI không có slide nào (<section class="slide">). Thử lại.' }
                : turn,
            ),
          )
          return
        }
        onApplyHtmlDeck?.(htmlSlides)
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId
              ? { ...turn, text: `Đã tạo ${htmlSlides.length} slide HTML trong bài giảng. Bấm Trình chiếu để xem; bản này không sửa hay xuất PPT được.`, pending: false }
              : turn,
          ),
        )
        return
      }
      if (mode === 'board') {
        let say = res.content
        let lines: string[] = []
        let appliedOps = false
        if (onBoardOps && /"ops"\s*:/.test(res.content)) {
          try {
            const raw = extractJson(res.content) as { say?: unknown; ops?: unknown }
            if (Array.isArray(raw.ops)) {
              appliedOps = true
              lines = onBoardOps(raw.ops.filter((o): o is Record<string, unknown> => !!o && typeof o === 'object'))
              say = typeof raw.say === 'string' ? raw.say : ''
            }
          } catch {
            say = 'AI trả lệnh vẽ không đọc được, bạn thử nói lại ngắn hơn nhé.'
          }
        }
        const text = [say.trim(), lines.length ? lines.map((l) => `• ${l}`).join('\n') : '', lines.length ? 'Bấm Ctrl+Z trên bảng nếu muốn hoàn tác.' : '']
          .filter(Boolean).join('\n\n')
        patchTurn(() => ({ text, pending: false, intent: appliedOps ? 'doc' : 'chat' }))
        return
      }
      if (mode === 'slide') {
        // Lượt lập dàn ý: chỉ hiện thẻ chờ duyệt, chưa chạm vào deck.
        let plan = slideDoc ? parseDeckPlan(res.content) : null
        if (slideDoc && !plan) {
          // Model thỉnh thoảng trả JSON hỏng/cụt: cho đúng một lượt sửa trước khi bỏ cuộc.
          const again = await callLlm(
            [
              ...messages,
              { role: 'assistant', content: res.content },
              {
                role: 'user',
                content:
                  'JSON dàn ý vừa trả không đọc được (sai dấu hoặc bị cắt). Trả lại DUY NHẤT một JSON hợp lệ, ' +
                  'ngắn gọn hơn: mỗi "brief" ≤ 100 ký tự, không xuống dòng trong chuỗi.',
              },
            ],
            { signal: controller.signal, reasoningEffort: AI_EFFORT.slide, retryOf: res.receipt, task: mainTask },
          )
          plan = parseDeckPlan(again.content)
          controller.signal.throwIfAborted()
        }
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
                  }
                : turn,
            ),
          )
          return
        }
        // AI trả JSON deck — hiển thị tóm tắt thay vì phun JSON thô vào khung chat
        const summary = summarizeAiDeck(res.content)
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId
              ? { ...turn, text: summary ?? res.content, pending: false, intent: summary || slideDoc ? 'doc' : 'chat' }
              : turn,
          ),
        )
        onApplySlides?.(res.content)
      } else {
        // JSON đề đã được áp vào tài liệu → hiện câu tóm tắt thay vì JSON thô;
        // câu trả lời văn bản thường (không sửa tài liệu) giữ nguyên.
        let result = onApplyBlocks?.(res.content)
        // đề trả JSON hỏng (thường bị cắt cụt): hoàn token lượt đó và soạn lại đúng một lần
        if (result?.failed && onApplyBlocks) {
          // gọi lại bằng model mạnh hơn (lượt đầu model nhanh không làm được)
          const again = await callLlm(messages, { signal: controller.signal, reasoningEffort: AI_EFFORT.exam, retryOf: res.receipt, strong: true, task: mainTask })
          controller.signal.throwIfAborted()
          result = onApplyBlocks(again.content) ?? result
        }
        // không áp được: hiện trong chat (kèm phần AI viết nếu đọc được) + nút Thử lại
        const failed = !!result?.failed
        const summary = result && !failed ? result.text : undefined
        const looksJson = failed
        const text = result?.text ?? res.content
        if (failed && import.meta.env.DEV) console.warn('[AI] JSON không áp được:', res.content)
        if (summary) rememberAiTurn({ mode, request: userTurn.text, reply: summary, context: documentDigest })
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId
              ? {
                  ...turn,
                  text,
                  pending: false,
                  intent: result ? 'doc' : 'chat',
                  ...(failed && userTurn.text ? { retry: userTurn.text } : {}),
                  // chỉ có bước khi là lượt soạn đề; trả lời thường (không JSON) thì bỏ danh sách bước
                  ...(turn.log
                    ? summary
                      ? { log: closeLog(turn.log, 'done') }
                      : looksJson
                        ? { log: closeLog(turn.log, 'failed') }
                        : { log: undefined }
                    : {}),
                }
              : turn,
          ),
        )
      }
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
              }
            : turn,
        ),
      )
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }, [input, files, refs, busy, turns, contextSummary, documentDigest, mode, onApplyBlocks, onApplySlides, slideFormat, existingSlideCount, editContext, onApplyEdits, onBoardOps])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setBusy(false)
  }, [])

  /** Lượt 2 (chặng 26b): duyệt dàn ý → sinh từng slide, chèn dần, sửa 1 lần. */
  const generateFromPlan = useCallback(
    async (planTurnId: string, plan: DeckPlan) => {
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
      let lastError = ''
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

      const worker = async () => {
        while (!controller.signal.aborted) {
          const start = nextIndex
          if (start >= total) return
          nextIndex = Math.min(total, start + SLIDE_BATCH)
          const indices = Array.from({ length: nextIndex - start }, (_, k) => start + k)
          progress(plan.slides[start].title)
          try {
            const pages = await generateSlideBatch(plan, indices, controller.signal, batchProgress(start, indices.length))
            indices.forEach((index, k) => { results[index] = pages[k] })
            inFlight.delete(start)
          } catch (err) {
            if (controller.signal.aborted) return
            lastError = (err as Error)?.message || 'Lỗi không rõ'
            indices.forEach((index) => { results[index] = null })
            inFlight.delete(start)
          }
          await landReady()
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

        const added = cursor - skipped
        if (!onAppendSlide && collected.length) {
          onApplySlides?.(JSON.stringify({ title: plan.title, slides: collected }), plan)
        }
        const message = [
          added
            ? `Đã thêm ${added} slide vào bài trình bày.`
            : 'Không thêm được slide nào.',
          skipped
            ? `Bỏ qua ${skipped} slide vì nội dung không hợp lệ${lastError ? ` (${lastError})` : ''}.`
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
                  error: aborted
                    ? 'Đã dừng.'
                    : (err as Error)?.message || 'Không gọi được AI.',
                }
              : turn,
          ),
        )
      } finally {
        setBusy(false)
        abortRef.current = null
        onPendingSlides?.(null)
      }
    },
    [busy, onAppendSlide, onApplySlides, onPendingSlides],
  )

  const cancelPlan = useCallback((planTurnId: string) => {
    setTurns((t) =>
      t.map((turn) =>
        turn.id === planTurnId ? { ...turn, planState: 'cancelled' as const } : turn,
      ),
    )
  }, [])

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
  const answerAsk = (reply: string) => {
    if (!openAsk) return
    setTurns((t) => t.map((turn) => (turn.id === openAsk.id ? { ...turn, askState: 'done' } : turn)))
    void send(reply)
  }

  return (
    <div className="ai-panel">
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
                ? slideFormat === 'html'
                  ? 'AI dựng từng slide bằng HTML (16:9) để trình chiếu trên web. Không sửa hay xuất PPT được.'
                  : 'Mô tả chủ đề bài giảng; AI lập dàn ý để bạn duyệt rồi viết nội dung từng slide.'
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
              {turn.log?.length ? <ActLog steps={turn.log} /> : null}
              {turn.pending && !turn.text ? (
                turn.log?.length ? null : turn.progress ? (
                  <DeckProgress {...turn.progress} />
                ) : (
                  <ThinkingLine mode={mode} intent={turn.intent} />
                )
              ) : (
                <TypedMarkdown
                  text={turn.text}
                  chat={turn.role === 'assistant' && turn.intent === 'chat'}
                  animate={!restoredTurnIds.has(turn.id)}
                />
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
              {turn.refs?.length ? (
                <div className="ai-msg-files">
                  {turn.refs.map((label, i) => (
                    <span key={i} className="ai-msg-file" data-tip={label}>
                      <span className="text-clay"><RefIcon /></span>
                      <span>{label}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {turn.files?.length ? (
                <div className="ai-msg-files">
                  {turn.files.map((f) => (
                    <span key={f.id} className="ai-msg-file" data-tip={f.name}>
                      {f.kind !== 'image' ? (
                        <img src={ATTACH_ICONS[f.kind]} alt="" className="ai-msg-file__icon" />
                      ) : f.url ? (
                        <img src={f.url} alt="" className="ai-msg-file__thumb" />
                      ) : null}
                      <span>{f.name}</span>
                    </span>
                  ))}
                </div>
              ) : null}
              {turn.fileNames?.length ? (
                <div className="ai-msg-files">
                  {turn.fileNames.map((name, i) => <span key={i} className="ai-msg-file" data-tip={name}><span>{name}</span></span>)}
                </div>
              ) : null}
              {turn.sources?.length || turn.webSources?.length || turn.sourceNote ? <SourcesButton sources={turn.sources} web={turn.webSources} note={turn.sourceNote} /> : null}
              {turn.error ? <div className="ai-msg-error">{turn.error}</div> : null}
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
          onSkip={() => answerAsk(ASK_DEFAULT.replace('Những gì chưa chọn: l', 'L'))}
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
                  <span className="ai-attachment__icon grid place-items-center text-clay"><BookOpen size={15} strokeWidth={1.75} /></span>
                  <span className="ai-attachment__meta">
                    <span className="ai-attachment__name" data-tip={p.name}>{p.name}</span>
                    <span className="ai-attachment__size">
                      {p.kind === 'mine' ? 'Đề của tôi' : p.kind === 'community' ? 'Đề cộng đồng' : 'Kho tài liệu'}
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
          <textarea
            ref={taRef}
            placeholder={
              mode === 'board'
                ? 'Hỏi về bài đang giảng trên bảng…'
                : mode === 'slide'
                ? slideFormat === 'html'
                  ? 'Mô tả bài trình bày cần tạo (slide HTML)…'
                  : 'Mô tả bài giảng cần soạn…'
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
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ATTACH_ACCEPT}
              className="ai-attach-input"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
            {mode === 'slide' ? (
              <div className="ai-format-seg" ref={segRef} role="tablist" aria-label="Định dạng đầu ra">
                {segThumb ? (
                  <span
                    className="ai-format-thumb"
                    style={{ transform: `translateX(${segThumb.x}px)`, width: segThumb.w }}
                  />
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={slideFormat === 'deck'}
                  className={cn('ai-format-opt', slideFormat === 'deck' && 'active')}
                  onClick={() => setSlideFormat('deck')}
                  disabled={busy}
                  data-tip="Slide dựng bằng layout engine, sửa được"
                >
                  PPT
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={slideFormat === 'html'}
                  className={cn('ai-format-opt', slideFormat === 'html' && 'active')}
                  onClick={() => (slideFormat === 'html' ? undefined : setHtmlNotice(true))}
                  disabled={busy}
                  data-tip="Slide HTML: chỉ trình chiếu trên web, không sửa/xuất PPT"
                >
                  HTML
                </button>
              </div>
            ) : null}
            <span className="ai-input-spacer" />
            {quota ? (
              <span
                className={cn('ai-quota', aiPointsLeft(quota) < 20 && 'is-low')}
                data-tip="Điểm AI còn lại"
              >
                Còn {aiPointsLeft(quota).toLocaleString('vi-VN')} điểm
              </span>
            ) : null}
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
                disabled={!input.trim() && files.length === 0}
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
      {htmlNotice ? (
        <div className="ai-html-modal" role="dialog" aria-modal="true" aria-label="Lưu ý chế độ HTML">
          <div className="ai-html-modal__box ai-html-modal__box--notice">
            <h3>Chế độ HTML chỉ dùng để trình chiếu</h3>
            <ul>
              <li>Mỗi slide do AI dựng bằng HTML nên <b>không sửa được</b> bằng trình soạn (chỉ xoá hoặc đổi thứ tự slide).</li>
              <li><b>Không xuất được PowerPoint</b>; bài giảng chỉ trình chiếu trên web.</li>
              <li>Tạo bản HTML sẽ <b>thay toàn bộ slide hiện có</b> của bài giảng này (hoàn tác được bằng Ctrl+Z). Muốn giữ bản PPT, hãy mở bài giảng mới.</li>
            </ul>
            <div className="ai-html-modal__actions">
              <button type="button" onClick={() => setHtmlNotice(false)}>Quay lại PPT</button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setSlideFormat('html')
                  setHtmlNotice(false)
                }}
              >
                Tiếp tục với HTML
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
