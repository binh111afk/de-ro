/** Các mảnh hiển thị của khung chat AI: tệp đính kèm, nhật ký bước, thẻ dàn ý, gợi ý. Không gọi model. */
import { useEffect, useState } from 'react'
import { IconDocExam } from '@/components/docIcons'
import { dialog } from '@/components/Dialog'
import { designById } from '@/lib/slideDesigns'
import { DECK_THEMES, PRO_THEMES } from '@/lib/slideTheme'
import type { DeckPlan } from '@/lib/aiDeck'
import { isDocx, isPdf, type PickedSource } from '@/lib/sources'
import { Markdown } from '@/lib/aiChatMarkdown'
import aiThinkingAnim from '@/assets/ai-assistant.svg'
import { IconPaperclip } from '../icons'
import type { ActStep, AiMode, ChatTurn } from './turns'

export type AttachKind = 'doc' | 'sheet' | 'pdf' | 'image'

export interface Attachment {
  id: string
  name: string
  size: number
  kind: AttachKind
  /** object URL chỉ dành cho ảnh */
  url?: string
  /** giữ File để trích nội dung trước khi gọi AI (docx/pdf/xlsx) */
  file?: File
}

export const ATTACH_ICONS: Record<Exclude<AttachKind, 'image'>, string> = {
  doc: '/brand/file-icons/doc.svg',
  sheet: '/brand/file-icons/sheet.svg',
  pdf: '/brand/file-icons/pdf.svg',
}

/** Chỉ nhận tài liệu Word/Excel/PDF và ảnh — đúng danh sách người dùng chốt. */
export const ATTACH_ACCEPT = '.doc,.docx,.xls,.xlsx,.csv,.pdf,image/*'

export function attachKind(file: { name: string; type?: string }): AttachKind | null {
  const name = file.name.toLowerCase()
  if (file.type?.startsWith('image/')) return 'image'
  if (isPdf(file.name, file.type)) return 'pdf'
  if (isDocx(file.name, file.type) || /\.(doc|rtf)$/.test(name)) return 'doc'
  if (/\.(xlsx?|csv)$/.test(name)) return 'sheet'
  return null
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const SOURCE_KIND_LABEL = {
  mine: 'Đề của tôi',
  community: 'Đề cộng đồng',
  library: 'Kho tài liệu',
}

export function SourceAttachmentIcon({ source }: { source: Pick<PickedSource, 'name' | 'kind'> }) {
  if (source.kind !== 'library') return <IconDocExam className="ai-attachment__icon" />

  const kind = attachKind({ name: source.name })
  return <img src={ATTACH_ICONS[kind && kind !== 'image' ? kind : 'doc']} alt="" className="ai-attachment__icon" />
}


export const newId = (() => {
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
export function TypedMarkdown({ text, chat, animate }: { text: string; chat: boolean; animate: boolean }) {
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

/** nhật ký kiểu app code: bước đang chạy có dòng chạy theo, bước xong để lại tóm tắt */
export function ActLog({ steps }: { steps: ActStep[] }) {
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

export function SentAttachments({ turn }: { turn: ChatTurn }) {
  const files = turn.files ?? turn.fileNames?.map((name) => ({ name, kind: attachKind({ name }), url: undefined, size: undefined }))
  if (!files?.length && !turn.refs?.length && !turn.pickedSources?.length) return null
  return (
    <div className="ai-msg-files">
      {turn.refs?.map((label, i) => (
        <span key={`ref-${i}`} className="ai-attachment ai-msg-file" data-tip={label}>
          <span className="ai-attachment__icon grid place-items-center text-clay"><RefIcon /></span>
          <span className="ai-attachment__meta">
            <span className="ai-attachment__name">{label}</span>
          </span>
        </span>
      ))}
      {files?.map((file, i) => (
        <span key={`file-${i}`} className="ai-attachment ai-msg-file" data-tip={file.name}>
          {file.url ? (
            <img src={file.url} alt="" className="ai-attachment__thumb" />
          ) : file.kind && file.kind !== 'image' ? (
            <img src={ATTACH_ICONS[file.kind]} alt="" className="ai-attachment__icon" />
          ) : (
            <span className="ai-attachment__icon grid place-items-center"><IconPaperclip size={16} /></span>
          )}
          <span className="ai-attachment__meta">
            <span className="ai-attachment__name">{file.name}</span>
            {file.size != null && <span className="ai-attachment__size">{formatSize(file.size)}</span>}
          </span>
        </span>
      ))}
      {turn.pickedSources?.map((p, i) => (
        <span key={`source-${i}`} className="ai-attachment ai-msg-file" data-tip={p.name}>
          <SourceAttachmentIcon source={p} />
          <span className="ai-attachment__meta">
            <span className="ai-attachment__name">{p.name}</span>
            <span className="ai-attachment__size">{SOURCE_KIND_LABEL[p.kind]}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

/** Nút mở danh sách nguồn đã dùng. */
export function SourcesButton({ sources, web }: { sources?: string[]; web?: Array<{ url: string; title: string }> }) {
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
      </>,
      'Nguồn',
    )
  }
  return (
    <div className="ai-sources">
      <button type="button" className="ai-sources__btn" aria-haspopup="dialog" onClick={showSources}>
        Nguồn ({n})
      </button>
    </div>
  )
}

export const STARTERS = [
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

export const BOARD_STARTERS = [
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

export function RefIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export const SLIDE_STARTERS = [
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

export function ThinkingLine({ mode, intent }: { mode: AiMode; intent?: 'doc' | 'chat' }) {
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

/** Thẻ dàn ý chờ duyệt — chặng 26a: xem trước khi sinh nội dung từng slide. */
export function PlanCard({
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
  // còn themeMagazine = chưa chọn kiểu, chưa biết bộ nào sẽ dùng
  const theme = plan.theme && !plan.themeMagazine ? [...DECK_THEMES, ...PRO_THEMES].find((t) => t.id === plan.theme) : undefined
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
export function DeckProgress({
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
  return (
    <ActLog
      steps={[{ label: 'Viết slide', state: 'active', note: `${shown}/${total} slide`, live: live ?? (current ? `Đang viết: ${current}` : undefined) }]}
    />
  )
}
