import assert from 'node:assert/strict'

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    key: (i) => [...values.keys()][i] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    clear: () => values.clear(),
  }
}

const local = memoryStorage()
const tab = memoryStorage()
const browser = new EventTarget()
const network = { onLine: true }
let reloads = 0
let discarded = 0
const images = new Map([['idb:ảnh', 'ảnh riêng'], ['u:idb:ảnh', '/api/files/ảnh']])
const idb = {
  open(name: string) {
    assert.equal(name, 'derou-board-images')
    const req = {
      onsuccess: () => {},
      result: {
        transaction(store: string, mode: string) {
          assert.equal(store, 'img')
          assert.equal(mode, 'readwrite')
          const tx = {
            oncomplete: () => {},
            objectStore: () => ({ clear: () => queueMicrotask(() => {
              images.clear()
              tx.oncomplete()
            }) }),
          }
          return tx
        },
      },
    }
    queueMicrotask(() => req.onsuccess())
    return req
  },
}
Object.defineProperties(globalThis, {
  localStorage: { value: local, configurable: true },
  sessionStorage: { value: tab, configurable: true },
  window: { value: Object.assign(browser, { localStorage: local, sessionStorage: tab, location: { reload: () => reloads++ } }), configurable: true },
  navigator: { value: network, configurable: true },
  indexedDB: { value: idb, configurable: true },
})

const { signOut, getSession } = await import('@/lib/auth')
const { dialog } = await import('@/components/Dialog')
const { DISCARD_USER_VIEW } = await import('@/lib/localData')
const { startSync, flushSync } = await import('@/lib/sync')
const { useOnline } = await import('@/store/online')
const { useComposeStore } = await import('@/store/compose')
const { useDocStore } = await import('@/store/docs')
const { pendingBoardSaves, useBoards } = await import('@/store/boards')
const { defaultMeta } = await import('@/lib/onlineExam')
browser.addEventListener(DISCARD_USER_VIEW, () => discarded++)

const login = (id: string) => local.setItem('dethinhbien-auth', JSON.stringify({
  access_token: id, refresh_token: 'r-' + id, expires_at: Date.now() / 1000 + 3600, user: { id, email: id + '@example.test' },
}))
const add = (title: string) => useOnline.getState().create({ meta: { ...defaultMeta(), title } })
const rows = new Map<string, any>([['server', {
  id: 'server', status: 'done', meta: { ...defaultMeta(), title: 'bản trên máy chủ' },
  questions: [], settings: {}, createdAt: '2026-01-01', updatedAt: '2026-01-01',
}]])
const posted: { kind: string; id: string; data: { title?: string }; owner_id: string }[] = []
let failId = ''
let logouts = 0
let rejectPull = true
let holdId = ''
let finishPost: (() => void) | undefined
globalThis.fetch = async (url, init) => {
  const path = String(url)
  if (path.endsWith('/logout')) {
    logouts++
    return new Response(null, { status: 204 })
  }
  assert.match(path, /\/user_items/)
  const body = init?.body ? JSON.parse(String(init.body)) : undefined
  const method = init?.method
  if (method === 'GET') {
    const online = path.includes('kind=eq.online')
    if (online && rejectPull) return Response.json({}, { status: 503 })
    return Response.json(online ? [...rows].map(([id, data]) => ({ id, data })) : [])
  }
  if (method === 'POST') {
    if (body.id === holdId) await new Promise<void>((resolve) => { finishPost = resolve })
    if (body.id === failId) return Response.json({ message: 'lỗi lưu' }, { status: 503 })
    posted.push(body)
    if (body.kind === 'online') rows.set(body.id, body.data)
    return new Response(null, { status: 204 })
  }
  assert.fail('Yêu cầu ngoài dự kiến: ' + path)
}

// Thiếu meta: giữ mục ở máy, ghi chủ sau khi kéo thành công; khởi động lại vẫn chặn mục đó.
add('nháp cũ')
const oldId = useOnline.getState().items[0].id
login('B')
let stop = await startSync()
assert.equal(local.getItem('dethinhbien-sync-online'), null)
assert.equal(useOnline.getState().items[0].id, oldId)
rejectPull = false
assert.deepEqual(await flushSync(), { ok: false })
assert.deepEqual(posted, [])
assert.ok(useOnline.getState().items.some((item) => item.id === 'server'))
assert.deepEqual(JSON.parse(local.getItem('dethinhbien-sync-online')!), { owner: 'B', synced: ['server'], unowned: [oldId] })
stop()
stop = await startSync()
assert.deepEqual(await flushSync(), { ok: false })
assert.deepEqual(posted, [])
assert.ok(useOnline.getState().items.some((item) => item.id === oldId))
useOnline.getState().remove(oldId)

// Flush vượt qua debounce, kể cả khi đang có mục khác bị lỗi.
add('mục lỗi')
failId = useOnline.getState().items[0].id
add('mục đang chờ')
const dueId = useOnline.getState().items[0].id
assert.deepEqual(await flushSync(), { ok: false })
assert.deepEqual(posted.map(({ owner_id, id }) => [owner_id, id]), [['B', dueId]])

const personalLocal = [
  'soandethi-docs', 'dethinhbien-v1', 'dethinhbien-online', 'dethinhbien-boards',
  'derou.board.old', 'dethinhbien-uploads', 'derou.ai-chat.exam.1', 'derou.ai-chat.slide.2',
  'dethinhbien-student', 'dethinhbien-student-name', 'dethinhbien-device', 'dero.adminMe',
  'dethinhbien-quota:A', 'dethinhbien-quota:B', 'dethinhbien-sync-doc', 'slide-recent-graphics',
]
const personalTab = ['dethinhbien-compose-session', 'dethinhbien-student-ok:1', 'dethinhbien-auth-flow', 'dethinhbien-return']
const deviceLocal = ['dero.terms-accepted', 'dethinhbien-mobile-view', 'dethinhbien-web-search-warned',
  'tools.subject', 'slide-grid', 'slide-snap', 'slide-template-mode', 'khóa-của-app-khác']
const deviceTab = ['announcements-seen', 'derou.chunk-reload-at']
for (const k of personalLocal) if (local.getItem(k) === null) local.setItem(k, 'cũ')
for (const k of personalTab) tab.setItem(k, 'cũ')
for (const k of deviceLocal) local.setItem(k, 'giữ')
for (const k of deviceTab) tab.setItem(k, 'giữ')

// Hộp xác nhận đang mở hoặc bị huỷ: không dọn và không kết thúc phiên.
let answer!: (v: boolean) => void
let opened!: () => void
const asking = new Promise<void>((resolve) => { opened = resolve })
dialog.confirm = () => new Promise((resolve) => { answer = resolve; opened() })
const cancelled = signOut()
assert.equal(signOut(), cancelled, 'bấm nhiều lần dùng chung một luồng')
await asking
assert.equal(getSession()?.user.id, 'B')
assert.equal(local.getItem('dero.adminMe'), 'cũ')
assert.equal(reloads, 0)
answer(false)
await cancelled
assert.equal(getSession()?.user.id, 'B')
assert.equal(images.size, 2)
assert.equal(logouts, 0)

network.onLine = false
dialog.confirm = async () => true
await signOut()
assert.equal(getSession(), null)
assert.equal(logouts, 1)
assert.equal(images.size, 0)
assert.equal(reloads, 1)
assert.equal(discarded, 1)
for (const k of [...personalLocal, 'dethinhbien-sync-online', 'dethinhbien-sync-board']) assert.equal(local.getItem(k), null, k)
for (const k of personalTab) assert.equal(tab.getItem(k), null, k)
for (const k of deviceLocal) assert.equal(local.getItem(k), 'giữ', k)
for (const k of deviceTab) assert.equal(tab.getItem(k), 'giữ', k)

dialog.confirm = async () => assert.fail('khách không hỏi xác nhận')
await signOut()
assert.equal(logouts, 1)
assert.equal(reloads, 2)

// Đăng xuất có mạng: lưu tab đang sửa và đẩy đề lên trước khi dọn, không hỏi.
useOnline.getState().replaceAll([])
useDocStore.setState(useDocStore.getInitialState(), true)
rows.clear()
network.onLine = true
local.removeItem('dethinhbien-online')
local.removeItem('soandethi-docs')
login('C')
await startSync()
const compose = useComposeStore.getState()
const docId = compose.newDoc()
compose.renameTab(docId, 'Đề chưa đến lượt tự lưu')
compose.setTabDirty(docId, true)
pendingBoardSaves.set('board-waiting', async () => {
  useBoards.getState().save('board-waiting', { v: 2, elements: [] })
  pendingBoardSaves.delete('board-waiting')
  return true
})
await signOut()
assert.ok(posted.some((item) => item.id === 'board-waiting' && item.kind === 'board' && item.owner_id === 'C'))
assert.ok(posted.some((item) => item.id === docId && item.kind === 'doc' && item.owner_id === 'C'))
assert.equal(useComposeStore.getState().tabs.length, 0)
assert.equal(local.getItem('soandethi-docs'), null)
assert.equal(reloads, 3)

// Lượt đẩy bị treo: flush có hạn chờ, phản hồi đến sau đăng xuất không ghi lại meta.
useOnline.getState().replaceAll([])
useDocStore.setState(useDocStore.getInitialState(), true)
rows.clear()
local.removeItem('dethinhbien-online')
local.removeItem('soandethi-docs')
login('D')
await startSync()
add('mục treo')
holdId = useOnline.getState().items[0].id
assert.deepEqual(await flushSync(), { ok: false })
assert.ok(finishPost)
network.onLine = false
dialog.confirm = async () => true
await signOut()
finishPost()
await new Promise((resolve) => setImmediate(resolve))
assert.equal(local.getItem('dethinhbien-sync-online'), null)
assert.equal(local.getItem('dethinhbien-online'), null)

console.log('test:signout-purge ok')
