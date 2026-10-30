import { useEffect, useRef, useState } from 'react'
import { ArrowUp, FileText, Plus, Square, X } from 'lucide-react'
import thinkingAnim from '@/assets/ai-assistant.svg'
import { dialog } from '@/components/Dialog'
import { Button } from '@/components/ui'
import type { Question } from '@/data/types'
import { readImportFile } from '@/lib/importFile'
import { callLlm } from '@/lib/llm'
import { attachmentsPrompt, parseAiReply, systemPrompt, type AiAttachment } from '@/lib/onlineAi'
import type { OnlineMeta } from '@/lib/onlineExam'

const ACCEPT = '.docx,.pdf,.txt,.md'
const MAX_FILES = 5

/**
 * Trợ lý AI trong vùng soạn của trình tạo đề online: gõ một yêu cầu ("thêm 5 câu trắc nghiệm về đạo hàm"), AI soạn rồi
 * tự thêm thẳng vào đề. Dấu + đính kèm file (đề mẫu, bài giảng, tài liệu…) làm nguồn cho AI; các file hiện thành một chip
 * "N file đính kèm": bấm chip mở danh sách file (bỏ từng file hoặc thêm file), nút X trên chip bỏ tất cả. Chỉ có một ô nhập, không có khung hay dòng phản hồi nào bên dưới; lúc chờ thì hình trợ lý
 * chuyển sang bản động. Chỉ khi lỗi hoặc AI không soạn được câu nào mới hiện một hộp thoại.
 */
export function OnlineAiBox({
  meta,
  questions,
  onAdd,
}: {
  meta: OnlineMeta
  questions: Question[]
  onAdd: (qs: Question[]) => void
}) {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [files, setFiles] = useState<AiAttachment[]>([])
  const [reading, setReading] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // lời gọi AI chạy lâu: dùng onAdd mới nhất khi xong, không phải bản lúc bấm gửi
  const latest = useRef(onAdd)
  latest.current = onAdd

  useEffect(() => () => abort.current?.abort(), [])

  const attach = async (picked: File[]) => {
    if (!picked.length) return
    if (files.length + picked.length > MAX_FILES) return void dialog.alert(`Đính kèm tối đa ${MAX_FILES} file mỗi lần.`, { title: 'Quá nhiều file' })
    setReading(true)
    const added: AiAttachment[] = []
    for (const f of picked) {
      try {
        const data = await readImportFile(f)
        added.push({ name: f.name, text: data.text })
      } catch (err) {
        await dialog.alert(err instanceof Error ? err.message : 'Không đọc được file này.', { title: `Không đọc được "${f.name}"` })
      }
    }
    setFiles((list) => [...list, ...added])
    setReading(false)
  }

  const send = async () => {
    const text = input.trim()
    if ((!text && !files.length) || busy || reading) return
    const attached = files
    setInput('')
    setFiles([])
    setBusy(true)
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      const res = await callLlm(
        [
          { role: 'system', content: systemPrompt(meta, questions) },
          { role: 'user', content: (text || 'Dựa vào tài liệu đính kèm, soạn các câu hỏi phù hợp cho đề này.') + attachmentsPrompt(attached) },
        ],
        { signal: ctrl.signal, reasoningEffort: 'medium', maxTokens: 12000 },
      )
      const { message, questions: qs } = parseAiReply(res.content)
      if (qs.length) latest.current(qs)
      else await dialog.alert(message || 'Bạn nói rõ số câu, dạng câu và nội dung giúp mình nhé.', { title: 'Mình chưa soạn được câu nào' })
    } catch (err) {
      if (!ctrl.signal.aborted) await dialog.alert(err instanceof Error ? err.message : 'Không gọi được AI, thử lại sau.', { title: 'Không soạn được' })
    } finally {
      abort.current = null
      setBusy(false)
    }
  }

  const canSend = (input.trim() !== '' || files.length > 0) && !reading

  return (
    <section aria-label="Trợ lý AI soạn câu hỏi" className="mb-5 rounded-[8px] bg-surface p-4 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
      <form
        className="flex items-end gap-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        {/* "Trợ lý giấy" của app: bản tĩnh lúc nghỉ, bản động lúc AI đang soạn (giảm chuyển động thì giữ bản tĩnh) */}
        <span className="relative mb-0.5 size-10 shrink-0" aria-hidden="true">
          <img src="/brand/ai-static.svg" alt="" width={40} height={40} className={`size-10 ${busy ? 'motion-safe:hidden' : ''}`} />
          {busy ? <img src={thinkingAnim} alt="" width={40} height={40} className="absolute inset-0 size-10 motion-reduce:hidden" /> : null}
        </span>

        <div
          className={`flex min-h-[44px] min-w-0 flex-1 items-end gap-1.5 rounded-[6px] border border-line-2 bg-white pl-1.5 transition-all duration-200 focus-within:border-clay focus-within:ring-2 focus-within:ring-clay/15 hover:border-ink-4 ${busy ? 'bg-sunken/60' : ''}`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const picked = [...(e.target.files ?? [])]
              e.target.value = ''
              void attach(picked)
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy || reading}
            aria-label="Đính kèm file"
            title="Đính kèm file (Word, PDF, văn bản)"
            className="mb-[5px] flex size-8 shrink-0 items-center justify-center rounded-[5px] text-ink-3 transition-colors hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            {reading ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Plus className="size-4" />}
          </button>

          {files.length > 0 ? (
            <span className="mb-[7px] inline-flex shrink-0 items-center rounded-full bg-clay-tint text-[12.5px] font-semibold text-clay-deep">
              <button
                type="button"
                onClick={() => setListOpen(true)}
                title={files.map((f) => f.name).join('\n')}
                aria-label={`Xem ${files.length} file đính kèm`}
                className="inline-flex items-center gap-1 rounded-l-full py-1 pl-2.5 pr-1 transition-colors hover:bg-clay/10"
              >
                <span className="tnum">{files.length}</span>
                <span className="hidden sm:inline">file đính kèm</span>
                <span className="sm:hidden">file</span>
              </button>
              <button
                type="button"
                onClick={() => setFiles([])}
                disabled={busy}
                aria-label="Bỏ các file đính kèm"
                className="mr-1 flex size-5 items-center justify-center rounded-full transition-colors hover:bg-clay/15 disabled:pointer-events-none"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <textarea
            rows={1}
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                void send()
              }
            }}
            aria-label="Yêu cầu cho trợ lý AI"
            aria-busy={busy}
            placeholder={busy ? 'AI đang soạn câu hỏi…' : files.length ? 'Nhờ AI soạn câu hỏi từ file…' : 'Nhờ AI soạn câu hỏi, ví dụ: thêm 5 câu trắc nghiệm về đạo hàm'}
            className="max-h-[120px] min-h-[42px] min-w-0 flex-1 resize-none bg-transparent [overflow-wrap:anywhere] px-2 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-ink-4 focus:outline-none"
          />
        </div>

        {busy ? (
          <button
            type="button"
            onClick={() => abort.current?.abort()}
            aria-label="Dừng"
            title="Dừng"
            className="flex size-11 shrink-0 items-center justify-center rounded-[6px] bg-sunken text-ink-2 transition-colors hover:text-ink"
          >
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Gửi"
            title="Gửi (Enter)"
            className="flex size-11 shrink-0 items-center justify-center rounded-[6px] bg-clay text-white transition-colors hover:bg-clay-deep disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        )}
      </form>

      {listOpen && files.length > 0 ? (
        <AttachmentsModal
          files={files}
          reading={reading}
          onAdd={() => fileRef.current?.click()}
          onRemove={(i) => {
            const next = files.filter((_, j) => j !== i)
            setFiles(next)
            if (!next.length) setListOpen(false)
          }}
          onClose={() => setListOpen(false)}
        />
      ) : null}
    </section>
  )
}

const kchars = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10} nghìn ký tự`.replace('.', ',') : `${n} ký tự`)

/** Danh sách file đính kèm: bỏ từng file, thêm file; Esc hoặc bấm ra ngoài để đóng. */
function AttachmentsModal({
  files,
  reading,
  onAdd,
  onRemove,
  onClose,
}: {
  files: AiAttachment[]
  reading: boolean
  onAdd: () => void
  onRemove: (i: number) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 px-5 py-8 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="File đính kèm" className="anim-sheet my-auto w-full max-w-[460px] rounded-[8px] bg-surface p-6 shadow-float sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[20px] font-semibold leading-snug text-ink">File đính kèm</h2>
            <p className="mt-1 text-[13px] text-ink-3">AI dùng nội dung các file này khi soạn câu hỏi.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-3 transition-colors hover:text-ink">
            <X className="size-4" />
          </button>
        </div>

        <ul className="mt-5 max-h-[320px] divide-y divide-line overflow-y-auto rounded-[6px] border border-line">
          {files.map((f, i) => (
            <li key={f.name + i} className="flex items-center gap-3 px-3.5 py-2.5">
              <FileText className="size-4 shrink-0 text-ink-3" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink" title={f.name}>{f.name}</p>
                <p className="tnum text-[12px] text-ink-3">{kchars(f.text.length)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Bỏ ${f.name}`}
                title="Bỏ file này"
                className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-clay-soft hover:text-clay"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="soft" onClick={onAdd} disabled={reading || files.length >= MAX_FILES} title={files.length >= MAX_FILES ? `Tối đa ${MAX_FILES} file` : undefined}>
            <Plus className="size-4" />
            Thêm file
          </Button>
          <Button variant="primary" onClick={onClose}>
            Xong
          </Button>
        </div>
      </div>
    </div>
  )
}
