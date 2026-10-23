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

export function AiPanel({
  onApplyBlocks,
  onApplySlides,
  contextSummary,
  mode = 'exam',
}: {
  /** nhận nội dung AI sinh ra để áp vào tài liệu (khi AI trả về JSON đề) */
  onApplyBlocks?: (text: string) => void
  /** nhận nội dung AI sinh ra để áp thành slide mới (khi AI trả về JSON deck) */
  onApplySlides?: (text: string) => void
  /** mô tả ngắn tài liệu hiện tại, đưa vào system prompt */
  contextSummary?: string
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
            : 'Bạn là trợ lý AI của trình soạn đề thi tiếng Việt. Trả lời ngắn gọn, đúng ngữ pháp. ' +
              'Khi được yêu cầu sinh đề, trả về JSON hợp lệ theo cấu trúc {"title":...,"blocks":[...]} ' +
              'và các loại block: header, title, meta, student, heading, paragraph, bullets, question, essay, answerKey, rubric. ' +
              'Mỗi field văn bản (text, items[], options[].text, sub[], answer, title) là chuỗi thuần, ' +
              'hoặc mảng span [{"text":"...","marks":[{"type":"bold"}]}] khi cần in đậm/nghiêng/gạch chân; ' +
              'mark type gồm: bold, italic, underline, strike, sub, super, highlight. ' +
              'Block có thể kèm "format":{"align":"left|center|right|justify","lineHeight":1.5,"indentLeft":0,"indentFirstLine":0,"spaceBefore":0,"spaceAfter":0}.' +
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
        setTurns((t) =>
          t.map((turn) =>
            turn.id === botId ? { ...turn, text: res.content, pending: false } : turn,
          ),
        )
        onApplyBlocks?.(res.content)
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
  }, [input, files, busy, turns, contextSummary, mode, onApplyBlocks, onApplySlides])

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
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span>Đang suy luận…</span>
                </div>
              ) : (
                <div>{turn.text}</div>
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
