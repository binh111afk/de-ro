import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ExternalLink, FileText, Search, Trash2, Upload } from 'lucide-react'
import { Badge, Button, EmptyState, inputClass, SkeletonCard } from '@/components/ui'
import { SiteSelect } from '@/components/SiteSelect'
import { deleteDocument, DOC_TYPES, listDocuments, MAX_DOC_MB, uploadDocument, type UserDocument } from '@/lib/documents'
import { useSession } from '@/lib/useSession'
import { cn } from '@/lib/cn'
import { SUBJECTS } from '@/data/types'

/** Tài liệu mẫu để xem bố cục khi chưa có tài liệu thật. Không mở, không xóa được. */
const SAMPLE_DOCS: UserDocument[] = [
  {
    id: 'sample-1',
    name: 'Đề cương ôn tập Toán 9 học kỳ II',
    mime: 'application/pdf',
    size: 1258291,
    url: '',
    subject: 'Toán',
    created_at: '2026-10-20T08:00:00Z',
  },
  {
    id: 'sample-2',
    name: 'Giáo án Ngữ văn 8: chuyên đề thơ Đường',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 348160,
    url: '',
    subject: 'Ngữ văn',
    created_at: '2026-10-18T14:30:00Z',
  },
  {
    id: 'sample-3',
    name: 'Ma trận đề kiểm tra giữa kỳ Vật lí 10',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 92160,
    url: '',
    subject: 'Vật lí',
    created_at: '2026-10-12T09:15:00Z',
  },
  {
    id: 'sample-4',
    name: 'Sách bài tập Tiếng Anh lớp 6 (trích)',
    mime: 'application/pdf',
    size: 4928307,
    url: '',
    subject: 'Tiếng Anh',
    created_at: '2026-10-05T16:45:00Z',
  },
]

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
]
const SUBJECT_FILTER_OPTIONS = [{ value: '', label: 'Tất cả môn' }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]
const SUBJECT_UPLOAD_OPTIONS = [{ value: '', label: 'Chưa chọn môn' }, ...SUBJECTS.map((s) => ({ value: s, label: s }))]

/** Kho tài liệu: nơi người dùng lưu tài liệu tham khảo (PDF, Word) để mở lại bất cứ lúc nào. */
export default function Library() {
  const session = useSession()

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10">
        <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          Kho tài liệu
        </h1>
        <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.75] text-ink-2">
          Lưu tài liệu tham khảo của bạn dưới dạng PDF hoặc Word, mở lại bất cứ lúc nào.
        </p>
      </header>

      {session ? (
        <Documents />
      ) : (
        <>
          <SignInPrompt />
          <div className="mt-10">
            <DocGrid items={SAMPLE_DOCS} sample />
          </div>
        </>
      )}
    </div>
  )
}

function SignInPrompt() {
  return (
    <EmptyState
      title="Đăng nhập để lưu tài liệu"
      description="Tài liệu được lưu theo tài khoản của bạn, đăng nhập rồi quay lại trang này."
      action={
        <Link to="/dang-nhap">
          <Button variant="primary">Đăng nhập</Button>
        </Link>
      }
    />
  )
}

function Documents() {
  const [docs, setDocs] = useState<UserDocument[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // môn gán cho các tệp sắp tải lên
  const [uploadSubject, setUploadSubject] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch((err: unknown) => {
        setDocs([])
        setError(err instanceof Error ? err.message : 'Không tải được danh sách tài liệu.')
      })
  }, [])

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setBusy(true)
    setError(null)
    // tải lần lượt để một tệp lỗi không làm hỏng các tệp còn lại
    for (const file of list) {
      try {
        const row = await uploadDocument(file, uploadSubject || null)
        setDocs((d) => [row, ...(d ?? [])])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra, thử lại sau.')
      }
    }
    setBusy(false)
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (!busy && e.dataTransfer.files.length) void addFiles(e.dataTransfer.files)
  }

  const remove = async (doc: UserDocument) => {
    if (!window.confirm(`Xóa "${doc.name}" khỏi kho tài liệu?`)) return
    try {
      await deleteDocument(doc.id)
      setDocs((d) => (d ?? []).filter((x) => x.id !== doc.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được tài liệu.')
    }
  }

  const hasReal = (docs ?? []).length > 0

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <SiteSelect
          value={uploadSubject}
          options={SUBJECT_UPLOAD_OPTIONS}
          onChange={setUploadSubject}
          label="Môn cho tài liệu tải lên"
          className="w-[180px]"
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && fileRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !busy) fileRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[8px] border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-clay bg-clay-tint/50' : 'border-line-2 bg-surface hover:border-ink-4',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-sunken text-ink-2">
          <Upload className="size-5" />
        </span>
        <p className="text-[15px] font-semibold text-ink">
          {busy ? 'Đang tải lên…' : 'Kéo tệp vào đây hoặc bấm để chọn'}
        </p>
        <p className="text-[13px] text-ink-3">PDF hoặc Word (.docx), tối đa {MAX_DOC_MB} MB mỗi tệp</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={Object.keys(DOC_TYPES).join(',')}
          className="sr-only"
          onChange={onPick}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-[13.5px] font-medium text-clay-deep">
          {error}
        </p>
      ) : null}

      <div className="mt-10">
        {docs === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} variant="doc" />
            ))}
          </div>
        ) : (
          <DocGrid items={hasReal ? docs ?? [] : SAMPLE_DOCS} sample={!hasReal} onDelete={remove} />
        )}
      </div>
    </div>
  )
}

/** Thanh lọc (tên, loại tệp) và lưới thẻ tài liệu. Dùng chung cho tài liệu thật và tài liệu mẫu. */
function DocGrid({
  items,
  sample,
  onDelete,
}: {
  items: UserDocument[]
  sample: boolean
  onDelete?: (doc: UserDocument) => void
}) {
  const [q, setQ] = useState('')
  const [mime, setMime] = useState('')
  const [subject, setSubject] = useState('')

  const needle = q.trim().toLowerCase()
  const shown = items.filter(
    (d) =>
      (!mime || d.mime === mime) &&
      (!subject || d.subject === subject) &&
      (!needle || d.name.toLowerCase().includes(needle)),
  )
  const filtered = Boolean(needle || mime || subject)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3">
          <span className="tnum font-bold text-ink">{shown.length}</span> tài liệu
          {sample ? <span className="ml-2 font-semibold text-honey">· Dữ liệu mẫu</span> : null}
        </p>
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          <div className="relative min-w-[200px] flex-1 sm:w-[260px] sm:flex-none">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên tệp…"
              className={inputClass + ' h-11 pl-11'}
            />
          </div>
          <SiteSelect value={subject} options={SUBJECT_FILTER_OPTIONS} onChange={setSubject} label="Lọc theo môn" className="w-[150px]" />
          <SiteSelect value={mime} options={TYPE_OPTIONS} onChange={setMime} label="Lọc theo loại tệp" className="w-[130px]" />
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={filtered ? 'Không có tài liệu khớp bộ lọc' : 'Chưa có tài liệu nào'}
          description={filtered ? undefined : 'Tải tệp đầu tiên lên ở khung phía trên.'}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} sample={sample} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </div>
  )
}

function DocumentCard({
  doc,
  sample,
  onDelete,
}: {
  doc: UserDocument
  sample: boolean
  onDelete?: (doc: UserDocument) => void
}) {
  const kind = DOC_TYPES[doc.mime] ?? 'Tệp'
  return (
    <li className="flex flex-col rounded-[8px] bg-surface p-5 shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-clay-tint text-clay">
          <FileText className="size-5" />
        </span>
        <div className="flex items-center gap-1.5">
          {sample ? <Badge tone="honey">Mẫu</Badge> : null}
          {doc.subject ? <Badge tone="neutral">{doc.subject}</Badge> : null}
          <Badge tone={kind === 'PDF' ? 'honey' : 'clay'}>{kind}</Badge>
        </div>
      </div>

      <p title={doc.name} className="mt-4 line-clamp-2 font-display text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
        {doc.name}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-ink-3 tnum">
        <Clock className="size-3.5" />
        {formatDate(doc.created_at)} · {formatSize(doc.size)}
      </p>

      <div className="mt-auto flex items-center gap-2 pt-5">
        {sample ? (
          <span className="inline-flex h-9 flex-1 cursor-not-allowed items-center justify-center gap-1.5 rounded-[6px] bg-sunken text-[13px] font-semibold text-ink-4">
            <ExternalLink className="size-3.5" />
            Mở
          </span>
        ) : (
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[6px] bg-sunken text-[13px] font-semibold text-ink transition-colors hover:bg-veil"
          >
            <ExternalLink className="size-3.5" />
            Mở
          </a>
        )}
        {sample || !onDelete ? null : (
          <Button variant="ghost" size="sm" onClick={() => onDelete(doc)} aria-label={`Xóa ${doc.name}`}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </li>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
