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
import { cn } from '@/lib/cn'
import { IconSend, IconSparkle, IconStop } from './icons'

export interface ChatTurn {
  id: string
  role: 'user' | 'assistant'
  text: string
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

export function AiPanel({
  onApplyBlocks,
  contextSummary,
}: {
  /** nhận nội dung AI sinh ra để áp vào tài liệu (khi AI trả về JSON đề) */
  onApplyBlocks?: (text: string) => void
  /** mô tả ngắn tài liệu hiện tại, đưa vào system prompt */
  contextSummary?: string
}) {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

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
    if (!text || busy) return

    const userTurn: ChatTurn = { id: `u${Date.now()}`, role: 'user', text }
    const botId = `a${Date.now()}`
    setTurns((t) => [...t, userTurn, { id: botId, role: 'assistant', text: '', pending: true }])
    setInput('')
    setBusy(true)

    const controller = new AbortController()
    abortRef.current = controller

    const history: LlmMessage[] = turns
      .filter((t) => t.text.trim())
      .map((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text }))

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content:
          'Bạn là trợ lý AI của trình soạn đề thi tiếng Việt. Trả lời ngắn gọn, đúng ngữ pháp. ' +
          'Khi được yêu cầu sinh đề, trả về JSON hợp lệ theo cấu trúc {"title":...,"blocks":[...]} ' +
          'và các loại block: header, title, meta, student, heading, paragraph, bullets, question, essay, answerKey, rubric. ' +
          'Mỗi field văn bản (text, items[], options[].text, sub[], answer, title) là chuỗi thuần, ' +
          'hoặc mảng span [{"text":"...","marks":[{"type":"bold"}]}] khi cần in đậm/nghiêng/gạch chân; ' +
          'mark type gồm: bold, italic, underline, strike, sub, super, highlight. ' +
          'Block có thể kèm "format":{"align":"left|center|right|justify","lineHeight":1.5,"indentLeft":0,"indentFirstLine":0,"spaceBefore":0,"spaceAfter":0}.' +
          (contextSummary ? `\nTài liệu hiện tại: ${contextSummary}` : ''),
      },
      ...history,
      { role: 'user', content: text },
    ]

    try {
      const res = await callLlm(messages, { signal: controller.signal })
      setTurns((t) =>
        t.map((turn) =>
          turn.id === botId ? { ...turn, text: res.content, pending: false } : turn,
        ),
      )
      onApplyBlocks?.(res.content)
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
  }, [input, busy, turns, contextSummary, onApplyBlocks])

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
          <IconSparkle size={18} />
          Trợ lý AI
        </span>
      </div>

      <div className="ai-chat" ref={scrollRef}>
        {empty ? (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-title">Nhờ AI soạn đề giúp bạn</div>
            <div className="ai-chat-empty-body">
              Mô tả môn học và các ý chính, hoặc dán tài liệu tham khảo; AI sẽ viết bản
              nháp đầu tiên thẳng vào trang.
            </div>
            <div className="ai-starter-list">
              {STARTERS.map((s) => (
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
              {turn.error ? <div className="ai-msg-error">{turn.error}</div> : null}
            </div>
          ))
        )}
      </div>

      <div className="ai-composer">
        <div className="ai-input-box">
          <textarea
            ref={taRef}
            placeholder="Mô tả bài toán soạn thảo, hoặc đặt câu hỏi"
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Nhập yêu cầu cho AI"
          />
          <div className="ai-input-footer">
            <span className="ai-input-hint">Enter gửi · Shift+Enter xuống dòng</span>
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
                disabled={!input.trim()}
                title="Gửi"
                aria-label="Gửi"
              >
                <IconSend size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
