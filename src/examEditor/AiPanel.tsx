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
import { callLlm, type LlmMessage } from '@/lib/llm'
import {
  parseAiObject,
  parseDeckPlan,
  summarizeAiDeck,
  slideCatalogText,
  type AiSlidePayload,
  type DeckPlan,
  type DeckPlanSlide,
} from '@/lib/aiDeck'
import { checkSlide, pageSystemPrompt, repairPrompt } from '@/lib/slideAi'
import { SLIDE_LAYOUTS } from '@/lib/slideLayouts'
import { DECK_THEMES } from '@/lib/slideTheme'
import { stylePackById } from '@/lib/slideStyles'
import { HTML_DECK_SYSTEM } from '@/lib/htmlDeckPrompt'
import { useSlidingThumb } from './useSlidingThumb'
import { buildSourcePack, sourcePrompt, sourceRule, type SourcePack } from '@/lib/sources'
import { cn } from '@/lib/cn'
import aiThinkingAnim from '@/assets/ai-assistant.svg'
import { Markdown } from './markdown'
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
function TypedMarkdown({ text }: { text: string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? text : '')

  useEffect(() => {
    if (reduced || !text) {
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
  }, [text, reduced])

  return <Markdown text={shown} />
}

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** tệp đính kèm của lượt người dùng (để hiển thị lại trong chat) */
  files?: Attachment[]
  /** true khi đang chờ model */
  pending?: boolean
  /** 'doc' = yêu cầu soạn/sửa tài liệu, 'chat' = hỏi đáp thường */
  intent?: 'doc' | 'chat'
  /** tên các nguồn đã dùng cho lượt này (tệp mẫu / tài liệu lưu / web) */
  sources?: string[]
  /** cảnh báo nguồn (tệp không đọc được, chưa cấu hình search…) */
  sourceNote?: string
  /** thông báo lỗi nếu lượt lỗi */
  error?: string
  /** dàn ý slide chờ duyệt (chặng 26a) */
  plan?: DeckPlan
  planState?: 'pending' | 'approved' | 'cancelled'
  /** tiến trình sinh từng slide (chặng 26b) */
  progress?: { done: number; total: number; current?: string }
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
function detectIntent(text: string, mode: 'exam' | 'slide'): 'doc' | 'chat' {
  const t = text.toLowerCase()
  const hints =
    mode === 'slide'
      ? ['slide', 'bài giảng', 'dàn ý', 'tóm tắt', 'hình ảnh', 'thêm', 'sửa', 'đổi', 'soạn', 'sinh', 'viết']
      : ['soạn', 'sinh đề', 'tạo đề', 'viết đề', 'làm đề', 'thêm câu', 'bổ sung', 'sửa', 'rà soát', 'đổi', 'chỉnh', 'xuất đề', 'in đề']
  return hints.some((h) => t.includes(h)) ? 'doc' : 'chat'
}

function ThinkingLine({ mode, intent }: { mode: 'exam' | 'slide'; intent?: 'doc' | 'chat' }) {
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

/** system prompt khi đang soạn slide — yêu cầu JSON dạng deck */
const SLIDE_SYSTEM =
  'Bạn là trợ lý AI của trình soạn bài trình bày tiếng Việt. Trả lời ngắn gọn, đúng ngữ pháp. ' +
  'Khi được yêu cầu sinh hoặc sửa nội dung slide, trả về JSON hợp lệ theo cấu trúc ' +
  '{"title":"...","slides":[{"layout":"bullets","title":"...","bullets":["..."],"notes":["..."]}]} . ' +
  'Mỗi slide chọn "layout" trong: title, section, statement, bullets, cards, two-column, ' +
  'comparison, quote, closing, agenda, table, image-left, image-right, image-full, stats, ' +
  'stat-image, timeline, cycle, quiz. ' +
  'Field theo layout: title/section/closing dùng {title, kicker, subtitle}; statement dùng ' +
  '{kicker, body (một câu lớn), author}; bullets dùng {title, kicker, bullets (2-4 ý ngắn)}; ' +
  'cards dùng {title, items (2-5 thẻ)}; two-column dùng {title, left (2-3 ý), right (2-3 ý)}; ' +
  'comparison dùng {title, leftTitle, left, rightTitle, right}; quote dùng {quote, author}; ' +
  'agenda dùng {kicker, title, items (3-5 mục)}; table dùng {title, rows (2-6 hàng × 2-6 cột)}; ' +
  'image-left/image-right/image-full dùng {title, bullets (2-4) hoặc body, image (tuỳ chọn)}; ' +
  'stats dùng {title, stats (1-4 mục {value, label})}; stat-image dùng {title, stats (1-2), image}; ' +
  'timeline/cycle dùng {title, steps (3-5 bước)}; quiz dùng ' +
  '{kicker, question, options (2-4 phương án), answer (chỉ số 0-based hoặc "A")}. ' +
  '"tone" tuỳ chọn: theme | soft | accent; thiếu thì theo mặc định của layout. "notes" là mảng ' +
  'chuỗi ghi chú trình bày (tuỳ chọn). Công thức toán viết bằng ký tự Unicode (², √, ·, ×, Δ…), ' +
  'không dùng LaTeX. Không thêm trường khác, không bọc markdown.'

/** Chế độ HTML: model tự dựng một tệp HTML tự chứa (brief trong lib/htmlDeckPrompt). */
const HTML_SYSTEM = HTML_DECK_SYSTEM

/**
 * Lượt 1 của pipeline slide (chặng 26a): lập dàn ý + chọn style, chưa viết nội
 * dung chi tiết. Người dùng duyệt dàn ý rồi mới gọi lượt sinh deck.
 */
export const SLIDE_PLAN_SYSTEM =
  'Bạn là trợ lý AI của trình soạn bài trình bày tiếng Việt. Nhiệm vụ: LẬP DÀN Ý, ' +
  'chưa viết nội dung chi tiết. Chỉ trả về DUY NHẤT một JSON hợp lệ (không bọc markdown, ' +
  'không chữ ngoài JSON):\n' +
  '{"title":"...","theme":"<id>","stylePack":"<id>","subject":"<id>","audience":"...","style":"...","mainIdeas":["..."],' +
  '"slides":[{"title":"...","layout":"<id>","tone":"theme|soft|accent","kicker":"...","brief":"..."}]}\n\n' +
  slideCatalogText() +
  '\n\nQUY TẮC:\n' +
  '- Số slide theo yêu cầu; nếu không nêu thì 6–10 slide, tối đa 16. Mỗi slide chỉ một ý lớn; ' +
  'nếu một mục có quá 4 ý thì tách thành slide mới.\n' +
  '- Chọn nhịp deck theo nội dung (bài giảng / báo cáo / hội thảo / kể chuyện) — không dùng ' +
  'một chuỗi cố định kiểu tiêu đề → nội dung → 4 thẻ → ý tổng hợp → timeline cho mọi đề.\n' +
  '- Đa dạng bố cục: không dùng cùng một layout ở hai slide liền nhau; deck 6 slide phải có ' +
  'ít nhất 4 layout khác nhau; "cards" tối đa 1 lần trong 6 slide; chỉ dùng layout cần dữ liệu ' +
  '(table, stats, stat-image, quiz) khi nội dung thật có dữ liệu.\n' +
  '- Bám cấu trúc bài gợi ý của môn đã chọn (xem MÔN HỌC) nhưng gộp/bỏ bước nếu deck ngắn; ' +
  'ưu tiên layout gợi ý của môn khi nội dung hợp.\n' +
  '- Slide đầu dùng "title"; slide cuối dùng "closing" hoặc "quote" nếu phù hợp.\n' +
  '- Ưu tiên layout có bố cục rõ: "agenda" cho tổng quan, "statement" cho một thông điệp lớn, ' +
  '"comparison" khi có hai mặt đối lập, "bullets" chỉ khi thật sự có 2–4 ý ngắn.\n' +
  '- Layout ảnh ("image-left", "image-right", "image-full", "stat-image") dùng tối đa 3 slide ' +
  'trong cả deck và chỉ khi brief có hình ảnh minh hoạ.\n' +
  '- "brief" đúng 1 câu ngắn (≤ 140 ký tự) nêu dữ kiện chính; "title" ≤ 10 từ.\n' +
  '- "tone" chỉ dùng khi cần nhấn mạnh; bỏ trống để layout tự chọn.\n' +
  '- Cứ khoảng 3 slide phải có một slide điểm nhấn (statement, stats, quote hoặc title/section ' +
  'nền nhấn) để deck có nhịp, không phẳng.\n' +
  '- "theme" chọn theo chủ đề, cảm xúc và đối tượng — không bắt buộc theo môn; ' +
  'chủ đề tự do (hướng nghiệp, kỹ năng, sự kiện…) vẫn chọn bộ màu hợp tông. ' +
  '"stylePack" chọn một id trong danh sách style pack để quyết định nhịp và mật độ nội dung; ' +
  '"style" 2 câu tả phong cách (nhịp bố cục, điểm nhấn màu, số liệu, hình ảnh).\n' +
  '- Không bịa số liệu thật; số liệu minh hoạ phải ghi rõ "ví dụ". Tiếng Việt chuẩn.'

/** Tên layout để hiện trong thẻ dàn ý. */
const layoutName = (id: string) => SLIDE_LAYOUTS.find((layout) => layout.id === id)?.name ?? id

/** Lịch sử hội thoại gửi kèm mỗi lượt gọi model. */
function historyOf(turns: ChatTurn[]): LlmMessage[] {
  return turns
    .filter((t) => t.text.trim() || t.files?.length)
    .map((t) => ({
      role: t.role === 'user' ? 'user' : 'assistant',
      content:
        t.text +
        (t.files?.length
          ? `\n[Tệp đính kèm: ${t.files.map((f) => f.name).join(', ')}]`
          : ''),
    }))
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
  const themeName = plan.theme
    ? DECK_THEMES.find((theme) => theme.id === plan.theme)?.name
    : undefined
  const meta = [
    themeName ? `Bộ màu ${themeName}` : null,
    plan.stylePack ? `Style ${stylePackById(plan.stylePack)?.name ?? plan.stylePack}` : null,
    plan.audience,
    `${plan.slides.length} slide`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="ai-plan">
      <div className="ai-plan-head">
        <span className="ai-plan-title">{plan.title || 'Dàn ý bài trình bày'}</span>
        <span className="ai-plan-meta">{meta}</span>
      </div>
      {plan.mainIdeas.length ? (
        <div className="ai-plan-ideas">{plan.mainIdeas.join(' · ')}</div>
      ) : null}
      <ol className="ai-plan-list">
        {plan.slides.map((slide, index) => (
          <li key={`${index}-${slide.title}`} className="ai-plan-row">
            <span className="ai-plan-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="ai-plan-slide">
              <span className="ai-plan-slide-title">{slide.title}</span>
              <span className="ai-plan-slide-meta">
                {layoutName(slide.layout)}
                {slide.tone ? ` · ${slide.tone}` : ''}
                {slide.brief ? ` — ${slide.brief}` : ''}
              </span>
            </span>
          </li>
        ))}
      </ol>
      {plan.style ? <div className="ai-plan-style">{plan.style}</div> : null}
      {state === 'pending' ? (
        <div className="ai-plan-actions">
          <button
            type="button"
            className="ai-plan-primary"
            onClick={() => onApprove(plan)}
            disabled={busy}
          >
            Tạo slide
          </button>
          <button type="button" className="ai-plan-ghost" onClick={onCancel}>
            Huỷ
          </button>
        </div>
      ) : (
        <div className="ai-plan-state">
          {state === 'approved' ? 'Đã duyệt dàn ý.' : 'Đã huỷ dàn ý.'}
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
}: {
  done: number
  total: number
  current?: string
}) {
  const percent = total ? Math.round((done / total) * 100) : 0
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
  const system = pageSystemPrompt(plan, planSlide, index)
  const user = `Viết slide ${index + 1}: "${planSlide.title}".`
  const first = await callLlm(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { signal, reasoningEffort: 'medium' },
  )
  const check = checkSlide(
    parseAiObject(first.content),
    planSlide.layout,
    planSlide.tone,
  )
  if (!check.errors.length && !check.readability.length) return check.page

  const repaired = await callLlm(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
      { role: 'assistant', content: first.content },
      { role: 'user', content: repairPrompt([...check.errors, ...check.readability]) },
    ],
    { signal, reasoningEffort: 'medium' },
  )
  const second = checkSlide(
    parseAiObject(repaired.content),
    planSlide.layout,
    planSlide.tone,
  )
  // Lỗi cứng sau repair → bỏ slide; chỉ còn lỗi "chữ nhỏ" thì vẫn dùng (đừng mất slide vì thẩm mỹ).
  if (second.errors.length) return check.errors.length ? null : check.page
  return second.page
}

/**
 * Phạm vi trả lời — áp cho cả hai chế độ. Web này là công cụ soạn đề/bài giảng;
 * phần lớn chi phí gọi model đến từ các câu hỏi ngoài lề, nên chặn ngay ở prompt.
 */
const SCOPE_RULE =
  'Phạm vi: chỉ trả lời câu hỏi phục vụ việc soạn đề/bài giảng hoặc các chủ đề học tập, ' +
  'nghiên cứu (toán, lý, hoá, sinh, văn, sử, địa, ngoại ngữ, tin học…). ' +
  'Từ chối ngắn gọn bằng một câu tiếng Việt và hướng người dùng quay lại việc soạn đề khi được hỏi ' +
  'những việc ngoài phạm vi, ví dụ: yêu cầu viết cả một trang web/ứng dụng hoàn chỉnh, hỏi bạn là model ' +
  'gì hoặc do ai tạo, đời sống, giải trí, tin tức, tư vấn cá nhân. ' +
  'Đoạn mã ngắn để học hoặc minh hoạ kiến thức vẫn được phép trả lời.'

/**
 * System prompt cho chế độ soạn đề — hợp đồng JSON kiểu plan/patch của
 * soandethi (thu gọn còn 1 lượt gọi) + quy ước đề thi Việt Nam.
 *
 * Hợp đồng: {"action":"replace|append|patch","blocks":[...],"patch":[{"id","block"}]}
 * - replace: soạn mới / viết lại toàn bộ → thay cả đề.
 * - append: thêm vào cuối, giữ nguyên phần đang có.
 * - patch: sửa vài khối theo id trong bản tóm tắt tài liệu.
 * - không sửa tài liệu: trả lời văn bản thường (không JSON).
 */
function examSystemPrompt(documentDigest?: string): string {
  return (
    'Bạn là trợ lý AI của trình soạn đề thi tiếng Việt (THCS/THPT). Trả lời ngắn gọn, đúng ngữ pháp.\n\n' +
    'KHI SINH HOẶC SỬA NỘI DUNG ĐỀ, chỉ trả về DUY NHẤT một JSON hợp lệ (không bọc markdown, không chữ ngoài JSON):\n' +
    '{"action":"replace"|"append"|"patch","blocks":[khối...],"patch":[{"id":"...","block":{...}}]}\n' +
    '- "replace": người dùng yêu cầu soạn đề mới hoặc viết lại toàn bộ → "blocks" là toàn bộ đề.\n' +
    '- "append": thêm câu/ý/phần vào cuối mà không đổi phần đang có → "blocks" chỉ gồm khối cần thêm.\n' +
    '- "patch": sửa một vài khối đang có → "patch" gồm {"id":"<id trong TÀI LIỆU HIỆN TẠI>","block":{...}}; không trả "blocks".\n' +
    'Khi người dùng chỉ hỏi/tư vấn, không cần sửa tài liệu: trả lời bằng văn bản thường, KHÔNG trả JSON.\n\n' +
    'CÁC LOẠI KHỐI: header, title, meta, student, heading, paragraph, bullets, grid, question, essay, answerKey, rubric, pageBreak, divider.\n' +
    'CẤU TRÚC TỪNG LOẠI KHỐI (đúng tên field, không thêm field lạ):\n' +
    '- {"type":"header","left":"SỞ GIÁO DỤC VÀ ĐÀO TẠO …\\nTRƯỜNG THPT …\\nĐề chính thức","right":"ĐỀ KHẢO SÁT CHẤT LƯỢNG ĐẦU NĂM\\nNăm học 2025 – 2026\\nMôn: Toán – Lớp 9\\nThời gian làm bài: 90 phút"}\n' +
    '- {"type":"title","text":"ĐỀ KIỂM TRA …"}\n' +
    '- {"type":"meta","rows":[["Năm học","2025 – 2026"],["Môn","Toán – Lớp 9"],["Thời gian","90 phút"]]}\n' +
    '- {"type":"student","text":"Họ và tên thí sinh: …………… Số báo danh: ………"}\n' +
    '- {"type":"heading","text":"PHẦN I. TRẮC NGHIỆM (3,0 điểm)","level":1}\n' +
    '- {"type":"paragraph","text":"..."}\n' +
    '- {"type":"bullets","items":["ý 1","ý 2"]}\n' +
    '- {"type":"grid","cols":2,"cells":["cột 1","cột 2"]}\n' +
    '- {"type":"question","no":1,"text":"Nội dung câu hỏi","options":[{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}]}\n' +
    '- {"type":"essay","no":1,"score":2,"text":"Nội dung","sub":["a) …","b) …"]}\n' +
    '- {"type":"answerKey","items":[{"no":1,"answer":"A"},{"no":2,"answer":"C"}]}  (items là object {no, answer}, KHÔNG phải chuỗi)\n' +
    '- {"type":"rubric","title":"A. HƯỚNG DẪN CHUNG","items":[{"label":"1.","text":"Ý đúng — 1,0 điểm"}]}\n' +
    '- {"type":"pageBreak"} hoặc {"type":"divider"}\n' +
    'Mỗi field văn bản (text, items[], options[].text, sub[], answer, title) là chuỗi thuần, ' +
    'hoặc mảng span [{"text":"...","marks":[{"type":"bold"}]}] khi cần in đậm/nghiêng/gạch chân; ' +
    'mark type gồm: bold, italic, underline, strike, sub, super, highlight, boxed (khung viền quanh cụm chữ). ' +
    'Block header có hai cột left/right; mỗi dòng trong cột là một phần tử cách nhau bằng \\n. ' +
    'Cột trái: "SỞ GIÁO DỤC VÀ ĐÀO TẠO …\\nTRƯỜNG THPT …\\nĐề chính thức" — KHÔNG chèn \\n giữa "SỞ GIÁO DỤC VÀ ĐÀO TẠO" và tên tỉnh, để dòng tự xuống theo bề rộng cột. ' +
    'Block "grid" xếp nội dung ngắn thành nhiều cột: {"type":"grid","cols":2,"cells":["...","..."]} (cols 2 hoặc 3). ' +
    'Block có thể kèm "format":{"align":"left|center|right|justify","lineHeight":1.5,"indentLeft":0,"indentFirstLine":0,"spaceBefore":0,"spaceAfter":0}.\n\n' +
    'QUY ƯỚC ĐỀ THI VIỆT NAM:\n' +
    '- Đề mới mở đầu bằng header hai cột: trái "SỞ GIÁO DỤC VÀ ĐÀO TẠO …\\nTRƯỜNG THPT …\\nĐề chính thức" (dòng cuối marks boxed), ' +
    'phải "TÊN ĐỀ …\\nNăm học 20… – 20…\\nMôn: …\\nThời gian làm bài: …" (dòng cuối italic). ' +
    'Tên đề nằm ở dòng đầu cột phải; KHÔNG sinh thêm block title/meta trùng nội dung header.\n' +
    '- Chỉ dùng title/meta khi người dùng yêu cầu đề không có header (không ghi sở/trường). Sau header chỉ thêm student khi đề cần ô họ tên/số báo danh, rồi heading từng phần, ví dụ "PHẦN I. TRẮC NGHIỆM (3,0 điểm)".\n' +
    '- Câu trắc nghiệm: block question, đúng 4 phương án A–D, đúng một đáp án, độ khó tăng dần, không trùng ý.\n' +
    '- Câu tự luận: block essay có score, các ý a) b) trong sub.\n' +
    '- Kết thúc đề: answerKey (bảng đáp án trắc nghiệm) và/hoặc rubric (thang điểm tự luận).\n' +
    '- Công thức toán viết LaTeX trong $...$, không dùng ảnh cho công thức.\n' +
    '- Tiếng Việt chuẩn, số liệu nhất quán, mọi câu phải có đáp án đúng.\n\n' +
    (documentDigest
      ? 'TÀI LIỆU HIỆN TẠI (mỗi dòng "[id] loại khối: nội dung rút gọn" — dùng đúng id khi patch):\n' +
        documentDigest +
        '\n\n'
      : '') +
    SCOPE_RULE
  )
}

export function AiPanel({
  onApplyBlocks,
  onApplySlides,
  onAppendSlide,
  onPendingSlides,
  contextSummary,
  documentDigest,
  mode = 'exam',
}: {
  /** nhận nội dung AI sinh ra để áp vào tài liệu; trả về một câu tóm tắt để hiện trong chat */
  onApplyBlocks?: (text: string) => string | undefined
  /** nhận nội dung AI sinh ra để áp thành slide mới (khi AI trả về JSON deck) */
  onApplySlides?: (text: string, plan?: DeckPlan) => void
  /** chèn ngay một slide vừa sinh vào cuối deck (chặng 26b) */
  onAppendSlide?: (page: AiSlidePayload, plan: DeckPlan) => void | Promise<void>
  /** báo số slide còn chờ để editor vẽ ô skeleton (null = xong/huỷ) */
  onPendingSlides?: (state: { done: number; total: number } | null) => void
  /** mô tả ngắn tài liệu hiện tại, đưa vào system prompt */
  contextSummary?: string
  /** bản tóm tắt nội dung đề (id + loại khối + trích đoạn) cho model sửa đúng chỗ */
  documentDigest?: string
  /** 'exam' = soạn đề, 'slide' = soạn bài trình bày */
  mode?: 'exam' | 'slide'
}) {
  const starters = mode === 'slide' ? SLIDE_STARTERS : STARTERS
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [removingFiles, setRemovingFiles] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  /** slide: 'deck' = layout engine (PPT), 'html' = một tệp HTML tự chứa */
  const [slideFormat, setSlideFormat] = useState<'deck' | 'html'>('deck')
  const [htmlDeck, setHtmlDeck] = useState<string | null>(null)
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

  // tự động lớn dần textarea theo nội dung
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(168, ta.scrollHeight)}px`
  }, [input])

  const send = useCallback(async () => {
    const text = input.trim()
    if ((!text && files.length === 0) || busy) return

    const sentFiles = files
    const fileNote = sentFiles.length
      ? `\n\nTệp đính kèm: ${sentFiles
          .map((f) => `${f.name} (${f.kind === 'image' ? 'ảnh' : f.kind === 'doc' ? 'Word' : f.kind === 'sheet' ? 'bảng tính' : 'PDF'})`)
          .join(', ')}`
      : ''

    // Giữ File trong `sentFiles` để trích nội dung; lượt chat chỉ lưu metadata
    // để không giữ cả tệp lớn trong state sau khi gửi.
    const displayFiles = sentFiles.map((f) => ({ ...f, file: undefined }))
    const userTurn: ChatTurn = { id: `u${Date.now()}`, role: 'user', text, files: displayFiles }
    const botId = `a${Date.now()}`
    const intent = sentFiles.length && !text.trim() ? 'doc' : detectIntent(text, mode)
    setTurns((t) => [
      ...t,
      userTurn,
      { id: botId, role: 'assistant', text: '', pending: true, intent },
    ])
    setInput('')
    setFiles([])
    setBusy(true)

    const controller = new AbortController()
    abortRef.current = controller

    // Thang nguồn chỉ áp cho soạn/sửa ĐỀ; slide và câu hỏi thường không search.
    let pack: SourcePack = { tier: 0, items: [], warnings: [] }
    if (intent === 'doc' && mode === 'exam') {
      try {
        pack = await buildSourcePack(text, sentFiles)
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
    const sourceText = sourcePrompt(pack)
    const sourceBlock =
      intent === 'doc' && mode === 'exam'
        ? `\n\n${sourceRule(pack)}${sourceText ? `\n\n${sourceText}` : ''}`
        : ''

    const history = historyOf(turns)
    const slideDoc = mode === 'slide' && intent === 'doc'
    const htmlMode = mode === 'slide' && intent === 'doc' && slideFormat === 'html'
    const system =
      mode === 'slide'
        ? (htmlMode
            ? HTML_SYSTEM
            : slideDoc
              ? SLIDE_PLAN_SYSTEM
              : SLIDE_SYSTEM) + (contextSummary ? `\nBài trình bày hiện tại: ${contextSummary}` : '')
        : examSystemPrompt(documentDigest) +
          (contextSummary ? `\nTài liệu hiện tại: ${contextSummary}` : '')

    const messages: LlmMessage[] = [
      { role: 'system', content: system + sourceBlock },
      ...history,
      { role: 'user', content: (text || 'Hãy xử lý các tệp đính kèm sau.') + fileNote },
    ]

    try {
      const res = await callLlm(messages, {
        signal: controller.signal,
        // Soạn slide trả JSON có schema rõ ràng; reasoning 'max' chỉ làm lượt
        // dàn ý kéo dài 30–60s (dễ vượt timeout proxy) mà không nội dung hơn.
        ...(mode === 'slide' ? { reasoningEffort: 'medium' as const } : {}),
      })
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
        setHtmlDeck(html)
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId
              ? { ...turn, text: 'Đã tạo bản trình bày HTML. Xem trước và tải xuống bên dưới.', pending: false }
              : turn,
          ),
        )
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
            { signal: controller.signal, reasoningEffort: 'medium' },
          )
          plan = parseDeckPlan(again.content)
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
              ? { ...turn, text: summary ?? res.content, pending: false }
              : turn,
          ),
        )
        onApplySlides?.(res.content)
      } else {
        // JSON đề đã được áp vào tài liệu → hiện câu tóm tắt thay vì JSON thô;
        // câu trả lời văn bản thường (không sửa tài liệu) giữ nguyên.
        const summary = onApplyBlocks?.(res.content)
        // Áp thất bại nhưng trông như envelope JSON → nói rõ lý do thay vì để
        // người dùng tưởng AI "gửi JSON chứ không soạn đề" (thường do JSON bị
        // cắt cụt hoặc trang đang chạy code cũ). Vẫn giữ JSON gốc để đối chiếu.
        const looksJson = /^\s*[[{]/.test(res.content)
        const text =
          summary ??
          (looksJson
            ? '⚠️ AI trả về JSON nhưng chưa áp được vào đề (JSON có thể bị cắt cụt hoặc sai cấu trúc). Thử lại, hoặc yêu cầu ngắn hơn. JSON gốc:\n\n' +
              res.content
            : res.content)
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId ? { ...turn, text, pending: false } : turn,
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
  }, [input, files, busy, turns, contextSummary, documentDigest, mode, onApplyBlocks, onApplySlides])

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

      const progress = (current?: string) => {
        // editor vẽ số ô skeleton còn lại = total - cursor (kể cả trang bị bỏ)
        onPendingSlides?.({ done: cursor, total })
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId ? { ...turn, progress: { done: cursor, total, current } } : turn,
          ),
        )
      }

      const landReady = async () => {
        while (cursor < total && results[cursor] !== undefined) {
          const page = results[cursor]
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
          const index = nextIndex++
          if (index >= total) return
          const planSlide = plan.slides[index]
          progress(planSlide.title)
          try {
            results[index] = await generateSlide(plan, planSlide, index, controller.signal)
          } catch (err) {
            if (controller.signal.aborted) return
            lastError = (err as Error)?.message || 'Lỗi không rõ'
            results[index] = null
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

  const downloadHtml = () => {
    if (!htmlDeck) return
    const blob = new Blob([htmlDeck], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'bai-giang.html'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
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
              {mode === 'slide' ? 'Nhờ AI soạn slide giúp bạn' : 'Nhờ AI soạn đề giúp bạn'}
            </div>
            <div className="ai-chat-empty-body">
              {mode === 'slide'
                ? slideFormat === 'html'
                  ? 'AI tạo một tệp HTML tự chứa (16:9, có phím chuyển slide) để bạn xem trước và tải về.'
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
              {turn.pending && !turn.text ? (
                turn.progress ? (
                  <DeckProgress {...turn.progress} />
                ) : (
                  <ThinkingLine mode={mode} intent={turn.intent} />
                )
              ) : (
                <TypedMarkdown text={turn.text} />
              )}
              <PlanCard
                plan={turn.plan}
                state={turn.planState}
                busy={busy}
                onApprove={(plan) => void generateFromPlan(turn.id, plan)}
                onCancel={() => cancelPlan(turn.id)}
              />
              {turn.files?.length ? (
                <div className="ai-msg-files">
                  {turn.files.map((f) => (
                    <span key={f.id} className="ai-msg-file" title={f.name}>
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
              {turn.sources?.length || turn.sourceNote ? (
                <div className="ai-msg-sources">
                  {turn.sources?.length ? (
                    <span>Nguồn: {turn.sources.join(' · ')}</span>
                  ) : null}
                  {turn.sourceNote ? (
                    <span className="ai-msg-source-note">{turn.sourceNote}</span>
                  ) : null}
                </div>
              ) : null}
              {turn.error ? <div className="ai-msg-error">{turn.error}</div> : null}
            </div>
          ))
        )}
      </div>

      <div className="ai-composer">
        <div className="ai-input-box">
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
                    <span className="ai-attachment__name" title={f.name}>{f.name}</span>
                    <span className="ai-attachment__size">{formatSize(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="ai-attachment__remove"
                    title="Bỏ tệp"
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
              mode === 'slide'
                ? slideFormat === 'html'
                  ? 'Mô tả bài trình bày cần tạo (xuất HTML)…'
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
              title="Đính kèm tệp (docx, xlsx, pdf, ảnh)"
              aria-label="Đính kèm tệp"
              onClick={() => fileRef.current?.click()}
            >
              <IconPaperclip size={16} />
            </button>
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
                  title="Slide dựng bằng layout engine, sửa được"
                >
                  PPT
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={slideFormat === 'html'}
                  className={cn('ai-format-opt', slideFormat === 'html' && 'active')}
                  onClick={() => setSlideFormat('html')}
                  disabled={busy}
                  title="Một tệp HTML tự chứa, tải về mở bằng trình duyệt"
                >
                  HTML
                </button>
              </div>
            ) : null}
            <span className="ai-input-spacer" />
            {busy ? (
              <button
                type="button"
                className="ai-send-btn is-stop"
                onClick={stop}
                title="Dừng"
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
                title="Gửi"
                aria-label="Gửi"
              >
                <IconEnter size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {htmlDeck ? (
        <div className="ai-html-modal" role="dialog" aria-modal="true" aria-label="Bản trình bày HTML">
          <div className="ai-html-modal__box">
            <header className="ai-html-modal__head">
              <strong>Bản trình bày HTML</strong>
              <div className="ai-html-modal__actions">
                <button type="button" onClick={downloadHtml}>Tải .html</button>
                <button type="button" onClick={() => setHtmlDeck(null)}>Đóng</button>
              </div>
            </header>
            <iframe
              className="ai-html-modal__frame"
              title="Xem trước bản trình bày HTML"
              srcDoc={htmlDeck}
              sandbox="allow-scripts"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
