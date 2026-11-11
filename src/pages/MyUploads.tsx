/**
 * Trang "Đề của tôi" (mở từ Hồ sơ): gộp đề / slide / bảng vẽ soạn trong trình soạn đề
 * với đề, tài liệu PDF / Word tự tải lên; kèm thẻ dung lượng lưu trữ.
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronLeft, Search, Trash2, Upload, X } from 'lucide-react'
import { Button, inputClass, Spinner } from '@/components/ui'
import { Pager } from '@/components/Pager'
import { dialog } from '@/components/Dialog'
import { Segmented } from '@/components/Segmented'
import { SiteSelect } from '@/components/SiteSelect'
import { ProgressBar } from '@/components/ProgressBar'
import { DocIcon } from '@/components/docIcons'
import { useSession } from '@/lib/useSession'
import { currentSession } from '@/lib/auth'
import { deleteDocument, DOC_TYPES, listDocuments, rest, uploadDocument, type UserDocument } from '@/lib/documents'
import { useSyncStatus } from '@/store/syncStatus'
import { docSize, useDocStore } from '@/store/docs'
import { useBoards } from '@/store/boards'
import { useComposeStore } from '@/store/compose'

const mb = (n: number) => {
  const v = n / 1048576
  return `${v < 0.1 && n > 0 ? '<0,1' : v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
}

export default function MyUploads() {
  const session = useSession()
  if (!session) return <Navigate to="/dang-nhap" replace />
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6 px-5 pt-10 sm:px-6 lg:pt-14">
      <Link to="/ho-so" className="-mb-2 inline-flex w-fit items-center gap-1 text-[13px] text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" /> Hồ sơ
      </Link>
      <StorageBar />
      <MyFilesCard />
    </div>
  )
}

/* ---------------- dung lượng ---------------- */

interface Storage {
  used: number
  max: number
  kinds: Record<string, { count: number; bytes: number; limit: number | null }>
}

const KIND_LABEL: [string, string][] = [['doc', 'Đề thi'], ['deck', 'Slide'], ['board', 'Bảng vẽ'], ['online', 'Đề online'], ['files', 'Tệp tải lên'], ['upload', 'Ảnh tải lên']]

async function loadStorage(): Promise<Storage> {
  const s = await currentSession()
  if (!s) throw new Error('Chưa đăng nhập')
  return rest<Storage>('/rpc/my_storage', { method: 'POST', token: s.access_token, body: {} })
}

/** Dung lượng lưu trữ trên máy chủ (đồng bộ + tệp tải lên). Giới hạn đặt ở trigger của user_items / user_documents. */
function StorageBar() {
  const [st, setSt] = useState<Storage | 'loading' | 'error'>('loading')
  const quota = useSyncStatus((s) => s.quota)
  const version = useSyncStatus((s) => s.version)
  useEffect(() => {
    let alive = true
    loadStorage()
      .then((d) => alive && setSt(d))
      .catch(() => alive && setSt('error'))
    return () => {
      alive = false
    }
  }, [quota, version])

  const pct = typeof st === 'object' && st.max > 0 ? Math.min(100, Math.round((st.used / st.max) * 100)) : 0
  return (
    <section className="rounded-[8px] bg-surface p-6 shadow-lift">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Dung lượng lưu trữ</h2>
        {typeof st === 'object' ? (
          <p className="font-display text-[22px] font-semibold text-ink tnum">
            {mb(st.used)} <span className="text-[14px] font-medium text-ink-3">/ {mb(st.max)}</span>
          </p>
        ) : (
          <p className="text-[13px] text-ink-3">{st === 'loading' ? 'Đang tải…' : 'Chưa tải được dung lượng.'}</p>
        )}
      </div>
      <ProgressBar pct={pct} label="Phần trăm dung lượng đã dùng" className="mt-3" />
      {typeof st === 'object' ? (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-3">
          {KIND_LABEL.map(([k, label]) => {
            const v = st.kinds[k]
            const full = v?.limit != null && v.count >= v.limit
            return (
              <li key={k} className={full ? 'font-semibold text-clay-deep' : ''}>
                {label}: <span className="tnum">{v?.count ?? 0}{v?.limit != null ? `/${v.limit}` : ''} · {mb(v?.bytes ?? 0)}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
      {quota ? (
        <p role="alert" className="mt-3 rounded-[6px] bg-clay-tint px-3 py-2 text-[13px] text-clay-deep">
          Chưa đồng bộ được: {quota} Tệp vẫn còn trên máy này.
        </p>
      ) : pct >= 90 ? (
        <p className="mt-3 text-[12.5px] text-clay-deep">Sắp đầy: xoá bớt tệp cũ bên dưới.</p>
      ) : null}
    </section>
  )
}

/* ---------------- danh sách ---------------- */

type Kind = 'exam' | 'slide' | 'board' | 'file'
type Item = {
  id: string
  title: string
  kind: Kind
  updatedAt: string
  size: number
  url?: string
  mime?: string
  /** card hiện ngay khi chọn tệp, trước khi tải lên xong */
  pending?: 'uploading' | 'waiting' | { error: string }
}

const KIND_PATH: Record<Kind, string> = { exam: 'Đề thi', slide: 'Bài giảng', board: 'Bảng vẽ', file: 'Tệp tải lên' }
const PER_PAGE = 8
type Filter = 'all' | 'exam' | 'slide' | 'board' | 'file'

function MyFilesCard() {
  const navigate = useNavigate()
  const myDocs = useDocStore((s) => s.myDocs)
  const myDecks = useDocStore((s) => s.myDecks)
  const boards = useBoards((s) => s.items)
  const [files, setFiles] = useState<UserDocument[] | 'loading' | 'error'>('loading')
  const [pending, setPending] = useState<Item[]>([])
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const bump = useSyncStatus((s) => s.bump)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<'new' | 'name' | 'size'>('new')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listDocuments()
      .then(setFiles)
      .catch(() => setFiles('error'))
  }, [])

  const all = useMemo<Item[]>(() => {
    const up = Array.isArray(files) ? files : []
    return [
      ...myDocs.map((d) => ({ id: d.id, title: d.title, kind: 'exam' as const, updatedAt: d.updatedAt, size: docSize(d) })),
      ...myDecks.map((dk) => ({ id: dk.id, title: dk.title, kind: 'slide' as const, updatedAt: dk.updatedAt, size: new Blob([JSON.stringify(dk)]).size })),
      ...boards.map((b) => ({ id: b.id, title: b.title, kind: 'board' as const, updatedAt: b.updatedAt, size: JSON.stringify(b.data).length })),
      ...up.map((d) => ({ id: d.id, title: d.name, kind: 'file' as const, updatedAt: d.created_at, size: d.size, url: d.url, mime: d.mime })),
    ]
  }, [myDocs, myDecks, boards, files])

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase()
    const out = all.filter((d) => (filter === 'all' || d.kind === filter) && (!k || d.title.toLowerCase().includes(k)))
    if (sort === 'name') out.sort((a, b) => a.title.localeCompare(b.title, 'vi'))
    else if (sort === 'size') out.sort((a, b) => b.size - a.size)
    else out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return out
  }, [all, q, filter, sort])
  useEffect(() => setPage(1), [q, filter, sort])
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE))
  const cur = Math.min(page, pages)
  // card đang tải lên luôn nằm đầu trang 1
  const pageItems = [...(cur === 1 ? pending : []), ...shown.slice((cur - 1) * PER_PAGE, cur * PER_PAGE)]
  const goPage = (p: number) => {
    setPage(p)
    listRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  const countOf = (k: Kind) => all.filter((d) => d.kind === k).length

  const onPick = async (ev: ChangeEvent<HTMLInputElement>) => {
    const list = [...(ev.target.files ?? [])]
    ev.target.value = ''
    if (!list.length) return
    setErr('')
    const now = new Date().toISOString()
    const jobs = list.map((f, i) => ({
      file: f,
      item: { id: `up-${Date.now()}-${i}`, title: f.name, kind: 'file' as const, updatedAt: now, size: f.size, mime: f.type, pending: 'waiting' as Item['pending'] },
    }))
    setPending((cur) => [...jobs.map((j) => j.item), ...cur])
    const patch = (id: string, p: Item['pending'] | null) =>
      setPending((cur) => (p === null ? cur.filter((x) => x.id !== id) : cur.map((x) => (x.id === id ? { ...x, pending: p } : x))))
    // tải lần lượt: uploadDocument kiểm dung lượng còn lại trước mỗi tệp
    for (const { file, item } of jobs) {
      if (!DOC_TYPES[file.type]) {
        patch(item.id, { error: 'Chỉ nhận PDF hoặc Word (.docx).' })
        continue
      }
      patch(item.id, 'uploading')
      try {
        const doc = await uploadDocument(file, null)
        setFiles((cur) => [doc, ...(Array.isArray(cur) ? cur : [])])
        patch(item.id, null)
      } catch (e) {
        patch(item.id, { error: e instanceof Error ? e.message : 'Không tải lên được.' })
      }
    }
    bump()
  }

  const open = (it: Item) => {
    if (it.pending) return
    if (it.kind === 'file') window.open(it.url, '_blank', 'noopener')
    else navigate('/soan-de', { state: { openTab: true, open: { kind: it.kind, id: it.id } } })
  }

  const onDelete = async (it: Item) => {
    if (typeof it.pending === 'object') return setPending((cur) => cur.filter((x) => x.id !== it.id))
    if (!(await dialog.confirm(`Xoá "${it.title}"? Thao tác này không thể hoàn tác.`, { title: 'Xoá tệp', danger: true, confirmLabel: 'Xoá' }))) return
    try {
      if (it.kind === 'file') {
        await deleteDocument(it.id)
        setFiles((cur) => (Array.isArray(cur) ? cur.filter((d) => d.id !== it.id) : cur))
      } else if (it.kind === 'slide') useDocStore.getState().deleteDeck(it.id)
      else if (it.kind === 'board') {
        useBoards.getState().remove(it.id)
        useComposeStore.getState().closeTab(it.id)
      } else useDocStore.getState().deleteDoc(it.id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Không xoá được.')
    }
    bump()
  }

  const empty = !all.length && !pending.length
  return (
    <section className="rounded-[8px] bg-surface p-7 shadow-lift sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-ink">Đề của tôi</h1>
          <p className="mt-1 text-[13px] text-ink-3">Đề, slide, bảng vẽ bạn soạn và đề, tài liệu (PDF, Word) tải lên. Mở ở máy nào cũng được.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          Tải tệp lên
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={onPick}
        />
      </div>
      {err ? <p role="alert" className="mt-4 rounded-[6px] bg-clay-tint px-3 py-2 text-[13px] text-clay-deep">{err}</p> : null}
      {files === 'error' ? <p className="mt-4 text-[13px] text-ink-3">Chưa tải được danh sách tệp tải lên, thử lại sau.</p> : null}
      {empty && files === 'loading' ? (
        <p className="mt-6 text-[13px] text-ink-3">Đang tải…</p>
      ) : empty ? (
        <p className="mt-6 rounded-[6px] border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-3">
          Chưa có gì. Soạn đề ở trang Soạn đề, hoặc bấm “Tải tệp lên” để thêm đề, tài liệu.
        </p>
      ) : (
        <div ref={listRef} className="mt-5 scroll-mt-24">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm trong ${all.length} mục…`}
                aria-label="Tìm đề, tệp" className={`${inputClass} h-11 pl-9 text-[13.5px]`} />
            </label>
            <SiteSelect value={sort} onChange={setSort} label="Sắp xếp" className="w-[140px]"
              options={[{ value: 'new', label: 'Mới nhất' }, { value: 'name', label: 'Tên A–Z' }, { value: 'size', label: 'Nặng nhất' }]} />
          </div>
          <Segmented value={filter} onChange={setFilter} label="Loại" className="mt-2 overflow-x-auto"
            options={[
              { key: 'all', label: 'Tất cả', count: all.length },
              { key: 'exam', label: 'Đề thi', count: countOf('exam') },
              { key: 'slide', label: 'Slide', count: countOf('slide') },
              { key: 'board', label: 'Bảng vẽ', count: countOf('board') },
              { key: 'file', label: 'Tải lên', count: countOf('file') },
            ]} />
          {!pageItems.length ? (
            <p className="mt-4 px-1 py-6 text-center text-[13px] text-ink-3">Không có mục nào khớp.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line-2">
              {pageItems.map((it) => {
                const failed = typeof it.pending === 'object' ? it.pending.error : null
                return (
                  <li key={it.id} className={`flex items-center gap-3 py-2.5 ${it.pending && !failed ? 'opacity-70' : ''}`}>
                    <span className="flex h-8 w-11 shrink-0 items-center justify-center">
                      {it.kind === 'file' ? (
                        <span className="flex h-8 w-11 items-center justify-center rounded-[5px] bg-sunken text-[11px] font-semibold text-ink-2">
                          {DOC_TYPES[it.mime ?? ''] ?? 'TỆP'}
                        </span>
                      ) : (
                        <DocIcon kind={it.kind} size={24} />
                      )}
                    </span>
                    <button type="button" onClick={() => open(it)} disabled={!!it.pending} title={it.title}
                      className="min-w-0 flex-1 text-left disabled:cursor-default">
                      <span className="block truncate text-[14px] text-ink hover:text-clay-deep">{it.title}</span>
                      <span className={`block truncate text-[12px] ${failed ? 'text-clay-deep' : 'text-ink-3'}`}>
                        {failed ?? (it.pending === 'uploading' ? 'Đang tải lên…' : it.pending === 'waiting' ? 'Chờ tải lên…' : KIND_PATH[it.kind])}
                      </span>
                    </button>
                    <span className="hidden shrink-0 text-[12.5px] text-ink-3 tnum sm:inline">{new Date(it.updatedAt).toLocaleDateString('vi-VN')}</span>
                    <span className="w-16 shrink-0 text-right text-[12.5px] text-ink-3 tnum">{mb(it.size)}</span>
                    {it.pending && !failed ? (
                      <span className="grid size-8 shrink-0 place-items-center"><Spinner /></span>
                    ) : (
                      <button type="button" onClick={() => void onDelete(it)} aria-label={failed ? `Bỏ ${it.title}` : `Xoá ${it.title}`} title={failed ? 'Bỏ' : 'Xoá'}
                        className="grid size-8 shrink-0 place-items-center rounded-[6px] text-ink-3 hover:bg-sunken hover:text-clay-deep">
                        {failed ? <X className="size-4" /> : <Trash2 className="size-4" />}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {pages > 1 ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-ink-3 tnum">{(cur - 1) * PER_PAGE + 1}–{Math.min(cur * PER_PAGE, shown.length)} / {shown.length}</span>
              <div className="[&>nav]:mt-0"><Pager page={cur} pages={pages} go={goPage} /></div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
