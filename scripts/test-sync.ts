/**
 * Kiểm đồng bộ (`lib/sync.ts`) với máy chủ giả trong bộ nhớ: kéo/gộp khi đăng nhập, đẩy thay đổi (kể cả chỉ đổi tên),
 * xoá, mục xoá ở máy khác, bản đệm của người khác, và một mục lỗi không chặn các mục khác. Chạy: `npm run test:sync`.
 */
import assert from 'node:assert/strict'

const mem = new Map<string, string>()
;(globalThis as any).window = globalThis
;(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
}

/** bảng `user_items` giả: owner → kind → id → dữ liệu */
type Kinds = Map<string, Map<string, any>>
const server = new Map<string, Kinds>()
let requests = 0
let failId = ''
const owner = () => (JSON.parse(mem.get('dethinhbien-auth') ?? 'null')?.user.id as string) ?? ''
const table = (kind: string) => {
  const kinds = server.get(owner()) ?? server.set(owner(), new Map()).get(owner())!
  return kinds.get(kind) ?? kinds.set(kind, new Map()).get(kind)!
}
;(globalThis as any).fetch = async (url: string, init: any = {}) => {
  if (url === '/api/upload') return { ok: true, status: 200, json: async () => ({ url: '/api/files/moi.png' }) }
  requests++
  assert.ok(String(init.headers?.Authorization).startsWith('Bearer '), 'thiếu token')
  const kind = /kind=eq\.(\w+)/.exec(url)?.[1] ?? JSON.parse(init.body ?? '{}').kind
  const rows = table(kind)
  const method = init.method ?? 'GET'
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body })
  if (method === 'GET') return ok([...rows].map(([id, data]) => ({ id, data })))
  if (method === 'POST') {
    const r = JSON.parse(init.body)
    if (r.id === failId) return { ok: false, status: 413, json: async () => ({ message: 'quá lớn' }) }
    rows.set(r.id, r.data)
    return ok(null)
  }
  for (const id of /id=in\.\(([^)]*)\)/.exec(url)![1].split(',')) rows.delete(id)
  return ok(null)
}

const login = (id: string) =>
  mem.set('dethinhbien-auth', JSON.stringify({ access_token: 't', refresh_token: 'r', expires_at: Date.now() / 1000 + 3600, user: { id, email: `${id}@x` } }))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const { useOnline } = await import('@/store/online')
const { useDocStore } = await import('@/store/docs')
const { startSync } = await import('@/lib/sync')
const { defaultMeta } = await import('@/lib/onlineExam')
const { emptyDoc } = await import('@/data/docTypes')

const titles = () => useOnline.getState().items.map((it) => it.meta.title).sort()
const remote = (u: string, kind: string) => [...(server.get(u)?.get(kind)?.values() ?? [])].map((d) => d.meta?.title ?? d.title).sort()
const add = (title: string) => useOnline.getState().create({ meta: { ...defaultMeta(), title } })
const online = (title: string, updatedAt: string) => ({ id: 'r1', status: 'done', meta: { ...defaultMeta(), title }, questions: [], settings: {}, createdAt: 'a', updatedAt })

// 1. chưa đăng nhập: không gọi máy chủ
add('nháp khi chưa đăng nhập')
const none = await startSync()
assert.equal(requests, 0)
none()

// 2. đăng nhập A: mục trên máy được đẩy lên, mục trên máy chủ được kéo về
server.set('A', new Map([['online', new Map([['r1', online('từ máy chủ', '2026-01-01T00:00:00.000Z')]])]]))
login('A')
let stop = await startSync()
await wait(50)
assert.deepEqual(titles(), ['nháp khi chưa đăng nhập', 'từ máy chủ'])
assert.deepEqual(remote('A', 'online'), ['nháp khi chưa đăng nhập', 'từ máy chủ'])

// 3. sửa và xoá được đẩy lên sau độ trễ, không có gì đổi thì không gọi lại
const localId = useOnline.getState().items.find((it) => it.meta.title.startsWith('nháp'))!.id
useOnline.getState().update(localId, { meta: { ...defaultMeta(), title: 'đã sửa' } })
useOnline.getState().remove('r1')
await wait(1800)
assert.deepEqual(remote('A', 'online'), ['đã sửa'])
const before = requests
useOnline.getState().replaceAll(useOnline.getState().items)
await wait(1800)
assert.equal(requests, before, 'không có gì đổi thì không gọi máy chủ')

// 4. đề và bài giảng trong trình soạn: thêm, chỉ đổi tên, xoá
const doc = emptyDoc({ title: 'Đề Toán' })
useDocStore.getState().saveDocById(doc)
useDocStore.getState().saveDeckById({ id: 'd1', title: 'Bài giảng 1', theme: {} as any, slides: [], createdAt: 'a', updatedAt: '2026-10-30T00:00:00.000Z' })
await wait(1800)
assert.deepEqual(remote('A', 'doc'), ['Đề Toán'])
assert.deepEqual(remote('A', 'deck'), ['Bài giảng 1'])
useDocStore.getState().renameDoc(doc.id, 'Đề Toán đổi tên')
await wait(1800)
assert.deepEqual(remote('A', 'doc'), ['Đề Toán đổi tên'], 'chỉ đổi tên cũng được đẩy lên')
useDocStore.getState().deleteDeck('d1')
await wait(1800)
assert.deepEqual(remote('A', 'deck'), [])

// 5. một mục lỗi (quá lớn) không chặn mục khác
const big = emptyDoc({ title: 'Đề quá lớn' })
failId = big.id
useDocStore.getState().saveDocById(big)
useDocStore.getState().saveDocById(emptyDoc({ title: 'Đề nhỏ' }))
await wait(1800)
assert.deepEqual(remote('A', 'doc'), ['Đề Toán đổi tên', 'Đề nhỏ'])
failId = ''
stop()

// 5b. ảnh nhúng base64 (dữ liệu cũ) được chuyển lên R2 rồi mới đẩy, cả trên máy lẫn trên máy chủ
login('A')
stop = await startSync()
const img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='
const withImg = emptyDoc({ title: 'Đề có ảnh' })
withImg.blocks = [{ id: 'b', type: 'paragraph', spans: [{ text: 'x', image: { src: img } }] } as any]
useDocStore.getState().saveDocById(withImg)
await wait(1800)
assert.ok(!JSON.stringify(server.get('A')!.get('doc')!.get(withImg.id)).includes('data:image'), 'máy chủ không giữ base64')
assert.ok(JSON.stringify(server.get('A')!.get('doc')!.get(withImg.id)).includes('/api/files/moi.png'))
assert.ok(!JSON.stringify(useDocStore.getState().myDocs.find((d) => d.id === withImg.id)).includes('data:image'), 'máy này cũng được đổi')
stop()

// 6. máy khác đã xoá mục: khởi động lại thì máy này cũng bỏ nó
server.get('A')!.get('online')!.delete(localId)
stop = await startSync()
assert.deepEqual(titles(), [])
stop()

// 7. tài khoản B dùng chung máy: bản đệm của A bị bỏ, không đẩy sang B
add('của A còn sót')
login('B')
stop = await startSync()
await wait(50)
assert.deepEqual(titles(), [])
assert.equal(useDocStore.getState().myDocs.length, 0)
assert.deepEqual(remote('B', 'online'), [])
assert.deepEqual(remote('B', 'doc'), [])
stop()

console.log('test:sync ok')
