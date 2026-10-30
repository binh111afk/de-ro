/**
 * Đồng bộ dữ liệu của từng người lên bảng `user_items` (owner_id, kind, id, data) của Supabase.
 * `localStorage` của từng store vẫn là bản đệm: chưa đăng nhập hay mất mạng vẫn soạn được, có mạng thì đẩy lên.
 *
 * Khi đăng nhập, với mỗi loại dữ liệu (`kind`): kéo bản trên máy chủ về; mục nào cả hai nơi đều có thì bản sửa sau thắng;
 * mục chỉ có trên máy này mà chưa từng đồng bộ thì đẩy lên; mục từng đồng bộ mà máy chủ không còn (xoá ở máy khác) thì bỏ khỏi máy này.
 * Sau đó mỗi thay đổi được đẩy lên sau ~1,5 giây, từng mục một request nên một mục quá lớn không chặn các mục khác.
 */
import { currentSession } from '@/lib/auth'
import { rest } from '@/lib/documents'
import { uploadImage } from '@/lib/mediaStore'
import { useUploads, type Upload } from '@/store/uploads'
import { useDocStore, type Deck } from '@/store/docs'
import { useOnline } from '@/store/online'
import type { ExamDoc } from '@/data/docTypes'
import type { OnlineItem } from '@/lib/onlineExam'

interface Item {
  id: string
  updatedAt: string
}

/** Một loại dữ liệu cần đồng bộ: cách đọc, ghi cả danh sách và nghe thay đổi của store. */
interface Spec<T extends Item> {
  kind: string
  get: () => T[]
  set: (items: T[]) => void
  subscribe: (fn: () => void) => () => void
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

const DELAY = 1500

/** `owner`: tài khoản của bản đệm trên máy; `synced`: id các mục đã từng có trên máy chủ. */
interface Meta {
  owner: string
  synced: string[]
}

const metaKey = (kind: string) => `dethinhbien-sync-${kind}`
const readMeta = (kind: string): Meta | null => {
  try {
    return JSON.parse(localStorage.getItem(metaKey(kind)) ?? 'null')
  } catch {
    return null
  }
}
const writeMeta = (kind: string, m: Meta) => {
  try {
    localStorage.setItem(metaKey(kind), JSON.stringify(m))
  } catch {
    /* hết chỗ lưu: lần sau đồng bộ lại từ đầu */
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
async function externalizeImages<T>(item: T): Promise<T | null> {
  const json = JSON.stringify(item)
  let out = json
  for (const url of new Set(json.match(DATA_IMAGE) ?? [])) {
    try {
      out = out.split(url).join(await uploadImage(url))
    } catch {
      // không đẩy được: giữ ảnh nhúng, lần sau thử lại
    }
  }
  return out === json ? null : (JSON.parse(out) as T)
}

async function syncKind<T extends Item>(spec: Spec<T>, owner: string): Promise<() => void> {
  const { kind } = spec
  const meta = readMeta(kind)
  // bản đệm của người khác (dùng chung máy): bỏ, không đẩy lên tài khoản này
  if (meta && meta.owner !== owner) spec.set([])
  const synced = new Set(meta?.owner === owner ? meta.synced : [])

  const first = await currentSession()
  if (!first) return () => {}
  const remote = await rest<Row[]>(`/user_items?kind=eq.${kind}&select=id,data`, { token: first.access_token })
  const remoteIds = new Set(remote.map((r) => r.id))
  const local = new Map(spec.get().map((it) => [it.id, it]))

  const merged = new Map<string, T>()
  for (const r of remote) {
    const mine = local.get(r.id)
    merged.set(r.id, mine && mine.updatedAt > r.data.updatedAt ? mine : (r.data as T))
  }
  for (const [id, it] of local) if (!remoteIds.has(id) && !synced.has(id)) merged.set(id, it)
  spec.set([...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))

  // trạng thái đã có trên máy chủ: id → dấu vân tay, để chỉ đẩy phần thay đổi
  // (bản local mới hơn bản máy chủ thì để dấu rỗng để đẩy lên; dấu của bản máy chủ lấy từ chính đối tượng đang nằm trong store)
  const sent = new Map(remote.map((r) => [r.id, merged.get(r.id) === r.data ? fingerprint(r.data) : '']))
  const save = () => writeMeta(kind, { owner, synced: [...sent.keys()] })
  save()

  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  const push = async () => {
    if (running) return void (timer = setTimeout(push, DELAY))
    running = true
    try {
      const cs = await currentSession() // lấy lại phiên: token có thể đã được làm mới
      if (!cs) return
      const token = cs.access_token
      const now = spec.get()
      const ids = new Set(now.map((it) => it.id))
      for (let it of now) {
        const before = fingerprint(it)
        const slim = await externalizeImages(it)
        if (slim) {
          // chỉ ghi lại vào store nếu người dùng chưa sửa gì trong lúc tải ảnh
          const live = spec.get().find((x) => x.id === it.id)
          if (live && fingerprint(live) === before) {
            spec.set(spec.get().map((x) => (x.id === it.id ? slim : x)))
            it = slim
          }
        }
        const fp = fingerprint(it)
        if (sent.get(it.id) === fp) continue
        try {
          await rest(`/user_items?on_conflict=owner_id,kind,id`, {
            method: 'POST',
            token,
            prefer: 'resolution=merge-duplicates,return=minimal',
            body: { owner_id: owner, kind, id: it.id, data: it, updated_at: it.updatedAt },
          })
          sent.set(it.id, fp)
        } catch {
          // mục này lỗi (quá lớn, mất mạng…): giữ trên máy, các mục khác vẫn đi tiếp; lần thay đổi sau thử lại
        }
      }
      const gone = [...sent.keys()].filter((id) => !ids.has(id))
      if (gone.length) {
        await rest(`/user_items?kind=eq.${kind}&id=in.(${gone.join(',')})`, { method: 'DELETE', token, prefer: 'return=minimal' })
        for (const id of gone) sent.delete(id)
      }
      save()
    } catch {
      // mất mạng hay lỗi tạm: giữ nguyên, lần thay đổi sau sẽ thử lại
    } finally {
      running = false
    }
  }

  const unsub = spec.subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(push, DELAY)
  })
  void push() // đẩy ngay các mục chỉ có trên máy này
  return () => {
    unsub()
    clearTimeout(timer)
  }
}

/** Bật đồng bộ cho phiên hiện tại (lịch sử đề online, đề trong trình soạn, bài giảng slide, ảnh đã tải lên); trả hàm tắt. Không làm gì nếu chưa đăng nhập. */
export async function startSync(): Promise<() => void> {
  const s = await currentSession()
  if (!s) return () => {}
  const stops = await Promise.all(SPECS.map((spec) => syncKind(spec, s.user.id).catch(() => () => {})))
  return () => stops.forEach((stop) => stop())
}
