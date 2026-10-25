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
import { summarizeAiDeck } from '@/lib/aiDeck'
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
  /** thông báo lỗi nếu lượt lỗi */
  error?: string
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

/** system prompt khi đang soạn slide — yêu cầu JSON dạng deck */
const SLIDE_SYSTEM =
  'Bạn là trợ lý AI của trình soạn bài trình bày tiếng Việt. Trả lời ngắn gọn, đúng ngữ pháp. ' +
  'Khi được yêu cầu sinh hoặc sửa nội dung slide, trả về JSON hợp lệ theo cấu trúc ' +
  '{"title":"...","slides":[{"title":"...","bullets":["...","..."],"notes":"..."}]} . ' +
  'Mỗi slide có "title" (chuỗi), "bullets" (mảng chuỗi, 2-6 ý) và "notes" (mảng chuỗi ghi chú trình bày, tuỳ chọn). ' +
  'Không thêm trường khác, không bọc markdown.'

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
 * Hợp đồng: {"action":"replace|append|patch","blocks":[...],"patch":[{"id","block"}],"note":"..."}
 * - replace: soạn mới / viết lại toàn bộ → thay cả đề.
 * - append: thêm vào cuối, giữ nguyên phần đang có.
 * - patch: sửa vài khối theo id trong bản tóm tắt tài liệu.
 * - không sửa tài liệu: trả lời văn bản thường (không JSON).
 */
function examSystemPrompt(documentDigest?: string): string {
  return (
    'Bạn là trợ lý AI của trình soạn đề thi tiếng Việt (THCS/THPT). Trả lời ngắn gọn, đúng ngữ pháp.\n\n' +
    'KHI SINH HOẶC SỬA NỘI DUNG ĐỀ, chỉ trả về DUY NHẤT một JSON hợp lệ (không bọc markdown, không chữ ngoài JSON):\n' +
    '{"action":"replace"|"append"|"patch","blocks":[khối...],"patch":[{"id":"...","block":{...}}],"note":"một câu mô tả"}\n' +
    '- "replace": người dùng yêu cầu soạn đề mới hoặc viết lại toàn bộ → "blocks" là toàn bộ đề.\n' +
    '- "append": thêm câu/ý/phần vào cuối mà không đổi phần đang có → "blocks" chỉ gồm khối cần thêm.\n' +
    '- "patch": sửa một vài khối đang có → "patch" gồm {"id":"<id trong TÀI LIỆU HIỆN TẠI>","block":{...}}; không trả "blocks".\n' +
    'Khi người dùng chỉ hỏi/tư vấn, không cần sửa tài liệu: trả lời bằng văn bản thường, KHÔNG trả JSON.\n\n' +
    'CÁC LOẠI KHỐI: header, title, meta, student, heading, paragraph, bullets, grid, question, essay, answerKey, rubric, pageBreak, divider.\n' +
    'CẤU TRÚC TỪNG LOẠI KHỐI (đúng tên field, không thêm field lạ):\n' +
    '- {"type":"header","left":"dòng 1\\ndòng 2\\nĐề chính thức","right":"KỲ THI …\\nNĂM HỌC …\\nMôn thi: …\\nThời gian …"}\n' +
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
    'Block header có hai cột left/right; trong mỗi cột dùng ký tự \\n để xuống dòng (ví dụ "SỞ GIÁO DỤC\\nTỈNH …"). ' +
    'Block "grid" xếp nội dung ngắn thành nhiều cột: {"type":"grid","cols":2,"cells":["...","..."]} (cols 2 hoặc 3). ' +
    'Block có thể kèm "format":{"align":"left|center|right|justify","lineHeight":1.5,"indentLeft":0,"indentFirstLine":0,"spaceBefore":0,"spaceAfter":0}.\n\n' +
    'QUY ƯỚC ĐỀ THI VIỆT NAM:\n' +
    '- Đề mới mở đầu bằng header hai cột: trái "SỞ GIÁO DỤC VÀ ĐÀO TẠO\\nTỈNH …\\nĐề chính thức" (dòng cuối marks boxed), ' +
    'phải "KỲ THI …\\nNĂM HỌC 20… – 20…\\nMôn thi: …\\nThời gian làm bài: …" (dòng cuối italic).\n' +
    '- Sau header là title, student (họ tên/số báo danh) khi phù hợp, rồi heading từng phần, ví dụ "PHẦN I. TRẮC NGHIỆM (3,0 điểm)".\n' +
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
  contextSummary,
  documentDigest,
  mode = 'exam',
}: {
  /** nhận nội dung AI sinh ra để áp vào tài liệu; trả về một câu tóm tắt để hiện trong chat */
  onApplyBlocks?: (text: string) => string | undefined
  /** nhận nội dung AI sinh ra để áp thành slide mới (khi AI trả về JSON deck) */
  onApplySlides?: (text: string) => void
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

    const userTurn: ChatTurn = { id: `u${Date.now()}`, role: 'user', text, files: sentFiles }
    const botId = `a${Date.now()}`
    setTurns((t) => [...t, userTurn, { id: botId, role: 'assistant', text: '', pending: true }])
    setInput('')
    setFiles([])
    setBusy(true)

    const controller = new AbortController()
    abortRef.current = controller

    const history: LlmMessage[] = turns
      .filter((t) => t.text.trim() || t.files?.length)
      .map((t) => ({
        role: t.role === 'user' ? 'user' : 'assistant',
        content:
          t.text +
          (t.files?.length
            ? `\n[Tệp đính kèm: ${t.files.map((f) => f.name).join(', ')}]`
            : ''),
      }))

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content:
          mode === 'slide'
            ? SLIDE_SYSTEM +
              (contextSummary ? `\nBài trình bày hiện tại: ${contextSummary}` : '')
            : examSystemPrompt(documentDigest) +
              (contextSummary ? `\nTài liệu hiện tại: ${contextSummary}` : ''),
      },
      ...history,
      { role: 'user', content: (text || 'Hãy xử lý các tệp đính kèm sau.') + fileNote },
    ]

    try {
      const res = await callLlm(messages, { signal: controller.signal })
      if (mode === 'slide') {
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
                ? 'Mô tả chủ đề bài giảng; AI sẽ dàn ý các slide và chèn thẳng vào bài trình bày.'
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
                  <span>Đang suy luận…</span>
                </div>
              ) : (
                <TypedMarkdown text={turn.text} />
              )}
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
            placeholder="Mô tả đề cần soạn…"
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
    </div>
  )
}
