/** Tab "AI và tệp" của form thêm câu: AI soạn hoặc tách từ tệp đề ra danh sách nháp, tách riêng câu hỏi, đáp án, ảnh. */
import { useRef, useState, type ReactNode } from 'react'
import { FileUp, ImageOff, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, Spinner, inputClass } from '@/components/ui'
import { dialog } from '@/components/Dialog'
import { MathText } from '@/components/MathText'
import { draftReady, generateDrafts, importDrafts, IMPORT_FILE_ACCEPT, type BankDraft } from '@/lib/bankImport'
import { TYPE_LABEL, type QuestionType } from '@/data/types'
import { cn } from '@/lib/cn'

const answerText = (d: BankDraft) => (d.type === 'tu-luan' || d.type === 'tu-luan-dong' ? 'Tự luận' : d.answer || 'Chưa có đáp án')

export function BankAiPanel({
  meta,
  subject,
  grade,
  type,
  drafts,
  setDrafts,
  onEdit,
  onSaveDrafts,
}: {
  meta: ReactNode
  subject: string
  grade: string
  type: QuestionType
  drafts: BankDraft[]
  setDrafts: (fn: (list: BankDraft[]) => BankDraft[]) => void
  onEdit: (d: BankDraft) => void
  onSaveDrafts: (list: BankDraft[]) => Promise<void>
}) {
  const [request, setRequest] = useState('')
  const [count, setCount] = useState(5)
  const [busy, setBusy] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const run = async (label: string, action: () => Promise<{ drafts: BankDraft[]; warning?: string }>) => {
    setBusy(label)
    setWarning(null)
    try {
      const res = await action()
      setDrafts((list) => [...list, ...res.drafts])
      setWarning(res.warning ?? null)
    } catch (err) {
      await dialog.alert(err instanceof Error ? err.message : 'Không tạo được câu hỏi.', { title: 'Lỗi' })
    } finally {
      setBusy(null)
    }
  }

  const generate = () => run('AI đang soạn…', async () => ({ drafts: await generateDrafts({ request, subject, grade, type, count }) }))
  const pickFile = (file?: File) => {
    if (file) void run('Đang đọc tệp…', () => importDrafts(file, setBusy))
  }

  const chosen = drafts.filter((d) => d.selected)
  const saveChosen = async () => {
    setSaving(true)
    try {
      await onSaveDrafts(chosen)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:overflow-hidden">
      <div className="space-y-5 p-5 lg:overflow-y-auto lg:border-r lg:border-line">
        <div className="[&_.grid]:grid-cols-2">{meta}</div>

        <div className="space-y-2.5 rounded-[8px] border border-line-2 bg-paper p-4">
          <label className="block text-[13px] font-semibold text-ink" htmlFor="ai-request">
            AI soạn câu hỏi
          </label>
          <textarea
            id="ai-request"
            rows={3}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Ví dụ: phương trình bậc hai, mức vận dụng, có bối cảnh thực tế"
            className={cn(inputClass, 'h-auto py-2.5 text-[14px]')}
          />
          <div className="flex items-center gap-2">
            <label className="text-[13px] text-ink-2" htmlFor="ai-count">
              Số câu
            </label>
            <input
              id="ai-count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
              className={cn(inputClass, 'h-9 w-20 text-[14px]')}
            />
            <Button variant="clay" size="sm" className="ml-auto" onClick={() => void generate()} disabled={!!busy}>
              <Sparkles className="size-4" />
              <span>Soạn</span>
            </Button>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (!busy) pickFile(e.dataTransfer.files[0])
          }}
          className="rounded-[8px] border border-dashed border-line-2 p-4 text-center"
        >
          <input
            ref={fileRef}
            type="file"
            accept={IMPORT_FILE_ACCEPT}
            hidden
            aria-label="Chọn tệp đề"
            onChange={(e) => {
              pickFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <p className="text-[13px] font-semibold text-ink">Tách câu hỏi từ tệp đề</p>
          <p className="mb-3 mt-1 text-[12.5px] leading-relaxed text-ink-3">PDF, Word (.docx) hoặc ảnh chụp, tối đa 12 MB. Kéo thả vào đây hoặc chọn tệp.</p>
          <Button variant="soft" size="sm" onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <FileUp className="size-4" />
            <span>Chọn tệp</span>
          </Button>
        </div>

        {busy ? (
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
            <Spinner className="size-3.5" />
            {busy}
          </p>
        ) : null}
        {warning ? <p className="text-[12.5px] leading-relaxed text-honey">{warning}</p> : null}
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          <p className="text-[13.5px] font-semibold text-ink">
            {drafts.length} câu nháp, chọn {chosen.length}
          </p>
          <Button variant="clay" size="sm" onClick={() => void saveChosen()} disabled={saving || chosen.length === 0}>
            {saving ? <Spinner className="size-3.5" /> : null}
            <span>Lưu {chosen.length} câu vào ngân hàng</span>
          </Button>
        </div>
        <div className="flex-1 space-y-3 p-5 lg:overflow-y-auto">
          {drafts.length === 0 ? (
            <EmptyState title="Chưa có câu nháp" />
          ) : (
            drafts.map((d, i) => {
              const ready = draftReady(d)
              return (
                <article key={d.id} className="rounded-[8px] border border-line p-4">
                  <div className="mb-3 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={d.selected}
                      disabled={!ready}
                      onChange={(e) => setDrafts((list) => list.map((x) => (x.id === d.id ? { ...x, selected: e.target.checked } : x)))}
                      aria-label={`Chọn câu ${i + 1}`}
                      className="size-4 rounded border-line-2 text-clay"
                    />
                    <span className="text-[13px] font-semibold text-ink">Câu {i + 1}</span>
                    <Badge tone="outline">{TYPE_LABEL[d.type]}</Badge>
                    {ready ? null : <Badge tone="honey">Cần bổ sung</Badge>}
                    <div className="ml-auto flex items-center text-ink-3">
                      <button type="button" onClick={() => onEdit(d)} aria-label={`Sửa câu ${i + 1}`} className="rounded p-1.5 hover:text-ink">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" onClick={() => setDrafts((list) => list.filter((x) => x.id !== d.id))} aria-label={`Bỏ câu ${i + 1}`} className="rounded p-1.5 hover:text-clay">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_130px]">
                    <section className="min-w-0">
                      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Câu hỏi</h4>
                      <MathText as="div" className="text-[14px] leading-relaxed text-ink">{d.prompt}</MathText>
                      {d.options?.length ? (
                        <ul className="mt-1.5 space-y-0.5 text-[13.5px] text-ink-2">
                          {d.options.map((o) => (
                            <li key={o.key}>
                              <b className="font-semibold">{o.key}.</b> <MathText as="span">{o.text}</MathText>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                    <section className="min-w-0">
                      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Đáp án</h4>
                      <p className={cn('text-[14px] font-semibold', d.answer || d.type.startsWith('tu-luan') ? 'text-ink' : 'text-honey')}>{answerText(d)}</p>
                      {d.explanation ? <MathText as="div" className="mt-1 text-[13px] leading-relaxed text-ink-3">{d.explanation}</MathText> : null}
                    </section>
                    <section>
                      <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Ảnh</h4>
                      {d.image ? (
                        <img src={d.image.src} alt={`Hình câu ${i + 1}`} className="max-h-32 w-full rounded-[6px] border border-line bg-white object-contain" />
                      ) : (
                        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-4">
                          <ImageOff className="size-3.5" />
                          Không có
                        </span>
                      )}
                    </section>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
