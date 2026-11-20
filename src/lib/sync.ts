/**
 * Đồng bộ dữ liệu của từng người lên bảng `user_items` (owner_id, kind, id, data) của Supabase.
 * `localStorage` của từng store vẫn là bản đệm: chưa đăng nhập hay mất mạng vẫn soạn được, có mạng thì đẩy lên.
 *
 * Khi đăng nhập, với mỗi loại dữ liệu (`kind`): kéo bản trên máy chủ về; mục nào cả hai nơi đều có thì bản sửa sau thắng;
 * mục mới thuộc tài khoản này thì đẩy lên; mục từng đồng bộ mà máy chủ không còn (xoá ở máy khác) thì bỏ khỏi máy này.
 * Sau đó mỗi thay đổi được đẩy lên sau ~1,5 giây, từng mục một request nên một mục quá lớn không chặn các mục khác.
 */
import { currentSession, getSession } from '@/lib/auth'
import { rest } from '@/lib/documents'
import { uploadImage } from '@/lib/mediaStore'
import { useUploads, type Upload } from '@/store/uploads'
import { useDocStore, type Deck } from '@/store/docs'
import { useOnline } from '@/store/online'
import type { ExamDoc } from '@/data/docTypes'
import type { OnlineItem } from '@/lib/onlineExam'
import { pendingBoardSaves, useBoards, type BoardItem } from '@/store/boards'
import { IDB_PREFIX, toRemote } from '@/board/imgStore'
import { quotaMessage, useSyncStatus } from '@/store/syncStatus'

interface Item {
  id: string
  updatedAt: string
}

type ImageUpload = (src: string) => Promise<string>

/** Một loại dữ liệu cần đồng bộ: cách đọc, ghi cả danh sách và nghe thay đổi của store. */
interface Spec<T extends Item> {
  kind: string
  get: () => T[]
  set: (items: T[]) => void
  subscribe: (fn: () => void) => () => void
  /** đổi mục trước khi đẩy lên (vd. ảnh chỉ có trên máy → đường dẫn kho file); null = không đổi */
  prepare?: (item: T, upload: ImageUpload) => Promise<T | null>
}

const SPECS: Spec<any>[] = [
  {
    kind: 'online',
    get: () => useOnline.getState().items,
    set: (items: OnlineItem[]) => useOnline.getState().replaceAll(items),
    subscribe: (fn) => useOnline.subscribe(fn),
  },
  {
    kind: 'doc',
    get: () => useDocStore.getState().myDocs,
    set: (items: ExamDoc[]) => useDocStore.setState({ myDocs: items }),
    subscribe: (fn) => useDocStore.subscribe((s, p) => s.myDocs !== p.myDocs && fn()),
  },
  {
    kind: 'deck',
    get: () => useDocStore.getState().myDecks,
    set: (items: Deck[]) => useDocStore.setState({ myDecks: items }),
    subscribe: (fn) => useDocStore.subscribe((s, p) => s.myDecks !== p.myDecks && fn()),
  },
  {
    kind: 'upload',
    get: () => useUploads.getState().items,
    set: (items: Upload[]) => useUploads.getState().replaceAll(items),
    subscribe: (fn) => useUploads.subscribe(fn),
  },
]

/** bảng vẽ: ảnh còn là khoá IndexedDB hay data URL thì đẩy lên kho file, thay bằng đường dẫn */
async function boardImagesToRemote(b: BoardItem, upload: ImageUpload): Promise<BoardItem | null> {
  let changed = false
  const elements = await Promise.all(b.data.elements.map(async (e) => {
    const src = typeof e.src === 'string' ? e.src : ''
    if (!src) return e
    const url = await toRemote(src, upload)
    if (!url && src.startsWith(IDB_PREFIX)) throw new Error('Không đọc được ảnh bảng vẽ.')
    if (!url || url === src) return e
    changed = true
    return { ...e, src: url }
  }))
  return changed ? { ...b, data: { ...b.data, elements } } : null
}

SPECS.push({
  kind: 'board',
  get: () => useBoards.getState().items,
  set: (items: BoardItem[]) => useBoards.getState().replaceAll(items),
  subscribe: (fn) => useBoards.subscribe((s, p) => s.items !== p.items && fn()),
  prepare: boardImagesToRemote,
} satisfies Spec<BoardItem>)

/** mục bị máy chủ từ chối vì vượt giới hạn: `kind:id` → lời báo; còn mục nào thì báo cho người dùng */
const blocked = new Map<string, string>()
function noteQuota(kind: string, id: string, msg: string | null) {
  const k = `${kind}:${id}`
  if (msg) blocked.set(k, msg)
  else if (!blocked.delete(k)) return
  useSyncStatus.getState().setQuota(blocked.values().next().value ?? null)
}

const DELAY = 1500

/** `owner`: tài khoản của bản đệm trên máy; `synced`: id các mục đã từng có trên máy chủ. */
interface Meta {
  owner: string
  synced: string[]
  unowned?: string[]
}

const metaKey = (kind: string) => `dethinhbien-sync-${kind}`
const readMeta = (kind: string): Meta | null => {
  try {
    const m = JSON.parse(localStorage.getItem(metaKey(kind)) ?? 'null') as Meta | null
    return m && typeof m.owner === 'string' && Array.isArray(m.synced) &&
      (m.unowned === undefined || Array.isArray(m.unowned)) ? m : null
  } catch {
    return null
  }
}
const writeMeta = (kind: string, m: Meta) => {
  try {
    localStorage.setItem(metaKey(kind), JSON.stringify(m))
  } catch (err) {
    if (import.meta.env?.DEV) console.warn('Không lưu được meta đồng bộ', kind, err)
  }
}

/** Dấu vân tay nhỏ của một mục: đổi tên hay sửa nội dung đều đổi, không cần giữ cả bản JSON trong bộ nhớ. */
function fingerprint(x: unknown): string {
  const s = JSON.stringify(x)
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${s.length}:${h}`
}

interface Row {
  id: string
  data: Item
}

const DATA_IMAGE = /data:image\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g

/** Ảnh nhúng dạng base64 (dữ liệu cũ) → đẩy lên R2, thay bằng đường dẫn. Trả bản mới, hoặc null nếu không có gì để đổi. */
async function externalizeImages<T>(item: T, upload: ImageUpload): Promise<T | null> {
  const json = JSON.stringify(item)
  let out = json
  for (const url of new Set(json.match(DATA_IMAGE) ?? [])) {
    try {
      out = out.split(url).join(await upload(url))
    } catch {
      // không đẩy được: giữ ảnh nhúng, lần sau thử lại
    }
  }
  return out === json ? null : (JSON.parse(out) as T)
}

async function syncKind<T extends Item>(spec: Spec<T>, run: SyncRun): Promise<FlushKind> {
  const { kind } = spec
  const { owner, signal } = run
  const active = () => !signal.aborted && getSession()?.user.id === owner
  const meta = readMeta(kind)
  const first = await currentSession({ keepOnError: true })
  if (!first || first.user.id !== owner || !active()) throw new Error('Phiên đồng bộ đã kết thúc.')
  const remote = await rest<Row[]>(`/user_items?kind=eq.${kind}&select=id,data`, { token: first.access_token, signal })
  if (!active()) throw new Error('Phiên đồng bộ đã kết thúc.')

  const ownMeta = meta?.owner === owner ? meta : null
  const synced = new Set(ownMeta?.synced)
  const sent = new Map(remote.map((r) => [r.id, fingerprint(r.data)]))
  const local = new Map((meta && !ownMeta ? [] : spec.get()).map((it) => [it.id, it]))
  // Thiếu meta: giữ mục chưa rõ chủ trên máy (kể cả khi trùng id), chặn đẩy/xoá
  // trên máy chủ. Ghi danh sách này cùng owner sau khi kéo, để lần sau vẫn chặn.
  const unowned = new Set([...(meta ? ownMeta?.unowned ?? [] : local.keys())].filter((id) => {
    const item = local.get(id)
    return item && sent.get(id) !== fingerprint(item)
  }))
  const merged = new Map<string, T>()
  for (const r of remote) {
    const mine = local.get(r.id)
    merged.set(r.id, mine && (unowned.has(r.id) || mine.updatedAt > r.data.updatedAt) ? mine : (r.data as T))
  }
  for (const [id, it] of local) if (!sent.has(id) && (!synced.has(id) || unowned.has(id))) merged.set(id, it)

  const save = () => writeMeta(kind, { owner, synced: [...sent.keys()], unowned: [...unowned] })
  save()
  spec.set([...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))

  let timer: ReturnType<typeof setTimeout> | undefined
  let running: Promise<boolean> | undefined
  const push = async (): Promise<boolean> => {
    let ok = true
    const cs = await currentSession({ keepOnError: true })
    if (!cs || cs.user.id !== owner || !active()) return false
    const token = cs.access_token
    const upload = (src: string) => uploadImage(src, { token, signal })
    const now = spec.get()
    const ids = new Set(now.map((it) => it.id))
    for (let it of now) {
      if (!active()) return false
      if (unowned.has(it.id)) continue
      const before = fingerprint(it)
      if (sent.get(it.id) === before) continue
      try {
        const slim = (spec.prepare && (await spec.prepare(it, upload))) || (await externalizeImages(it, upload))
        if (!active()) return false
        if (slim) {
          // Chỉ ghi lại vào store nếu mục chưa đổi trong lúc tải ảnh.
          const live = spec.get().find((x) => x.id === it.id)
          if (live && fingerprint(live) === before) spec.set(spec.get().map((x) => (x.id === it.id ? slim : x)))
          it = slim
        }
        const fp = fingerprint(it)
        if (sent.get(it.id) !== fp) {
          await rest(`/user_items?on_conflict=owner_id,kind,id`, {
            method: 'POST',
            token,
            signal,
            prefer: 'resolution=merge-duplicates,return=minimal',
            body: { owner_id: owner, kind, id: it.id, data: it, updated_at: it.updatedAt },
          })
          if (!active()) return false
          sent.set(it.id, fp)
        }
        noteQuota(kind, it.id, null)
      } catch (err) {
        if (!active()) return false
        // Một mục lỗi vẫn để các mục còn lại đi tiếp.
        ok = false
        noteQuota(kind, it.id, quotaMessage(err))
      }
    }
    const gone = [...sent.keys()].filter((id) => !ids.has(id) && !unowned.has(id))
    for (const id of [...blocked.keys()]) if (id.startsWith(`${kind}:`) && !ids.has(id.slice(kind.length + 1))) noteQuota(kind, id.slice(kind.length + 1), null)
    if (gone.length && active()) {
      await rest(`/user_items?kind=eq.${kind}&id=in.(${gone.join(',')})`, { method: 'DELETE', token, signal, prefer: 'return=minimal' })
      if (!active()) return false
      for (const id of gone) sent.delete(id)
    }
    if (!active()) return false
    save()
    return ok
  }

  const pending = () => {
    const items = spec.get()
    const ids = new Set(items.map((item) => item.id))
    return items.some((item) => !unowned.has(item.id) && sent.get(item.id) !== fingerprint(item))
      || [...sent.keys()].some((id) => !unowned.has(id) && !ids.has(id))
  }

  const drain = async () => {
    do {
      clearTimeout(timer)
      running ??= push().catch(() => false).finally(() => { running = undefined })
      if (!(await running) || !active()) return false
    } while (pending())
    return true
  }
  const unsub = spec.subscribe(() => {
    run.revision++
    clearTimeout(timer)
    timer = setTimeout(() => void drain(), DELAY)
  })
  signal.addEventListener('abort', () => {
    unsub()
    clearTimeout(timer)
  }, { once: true })

  void drain()
  return async () => (await drain()) && !spec.get().some((item) => unowned.has(item.id))
}

type FlushKind = () => Promise<boolean>
interface SyncRun {
  owner: string
  signal: AbortSignal
  revision: number
  stop: () => void
  kinds: () => Promise<(FlushKind | null)[]>
}

let run: SyncRun | undefined

export function stopSync() {
  run?.stop()
}

function syncFor(owner: string): SyncRun {
  if (run?.owner === owner) return run
  stopSync()
  blocked.clear()
  useSyncStatus.getState().setQuota(null)
  const controller = new AbortController()
  const kinds = new Map<string, Promise<FlushKind | null>>()
  const next: SyncRun = {
    owner,
    signal: controller.signal,
    revision: 0,
    stop: () => {
      controller.abort()
      if (run === next) run = undefined
    },
    kinds: () => Promise.all(SPECS.map((spec) => {
      let job = kinds.get(spec.kind)
      if (!job) {
        job = syncKind(spec, next).catch(() => {
          kinds.delete(spec.kind)
          return null
        })
        kinds.set(spec.kind, job)
      }
      return job
    })),
  }
  return (run = next)
}

/** Bật đồng bộ cho phiên hiện tại, kéo mỗi loại dữ liệu rồi trả hàm tắt. */
export async function startSync(): Promise<() => void> {
  const s = getSession()
  if (!s) return () => {}
  const current = syncFor(s.user.id)
  await current.kinds()
  return current.stop
}

/** Đẩy hết thay đổi đang chờ, kể cả lượt đẩy đã chạy, trong tối đa 8 giây. */
export async function flushSync(): Promise<{ ok: boolean }> {
  const s = getSession()
  if (!s || globalThis.navigator?.onLine === false) return { ok: false }
  const current = syncFor(s.user.id)
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const flush = async () => {
      const saves = await Promise.all([...pendingBoardSaves.values()].map((save) => save()))
      const kinds = await current.kinds()
      let revision: number
      do {
        revision = current.revision
        const results = await Promise.all(kinds.map((kind) => kind?.()))
        if (!results.every(Boolean)) return false
      } while (revision !== current.revision)
      return saves.every(Boolean) && pendingBoardSaves.size === 0
    }
    const timeout = new Promise<false>((resolve) => { timer = setTimeout(() => resolve(false), 8000) })
    return { ok: await Promise.race([flush(), timeout]).catch(() => false) }
  } finally {
    clearTimeout(timer)
  }
}
