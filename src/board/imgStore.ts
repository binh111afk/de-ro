/**
 * Bảng vẽ — ảnh lớn (ảnh chèn, trang PDF) lưu trong IndexedDB thay vì localStorage (~5MB).
 * Trong bản lưu, `src` của ảnh lớn được thay bằng khoá `idb:…`; mở bảng thì đọc ảnh về lại.
 */
const DB = 'derou-board-images'
const STORE = 'img'
export const IDB_PREFIX = 'idb:'
/** ảnh nhỏ hơn ngưỡng này (công thức, hình công cụ) vẫn lưu thẳng trong localStorage */
const MIN = 16_000

let dbp: Promise<IDBDatabase> | null = null
function db() {
  dbp ??= new Promise((ok, fail) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => ok(r.result)
    r.onerror = () => fail(r.error)
  })
  return dbp
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  return db().then((d) => new Promise<T>((ok, fail) => {
    const r = fn(d.transaction(STORE, mode).objectStore(STORE))
    r.onsuccess = () => ok(r.result)
    r.onerror = () => fail(r.error)
  }))
}

/** khoá theo nội dung (FNV-1a lấy mẫu) — cùng ảnh thì cùng khoá */
function keyOf(src: string) {
  let h = 0x811c9dc5
  const step = Math.max(1, Math.floor(src.length / 4096))
  for (let i = 0; i < src.length; i += step) h = Math.imul(h ^ src.charCodeAt(i), 0x01000193)
  return `${IDB_PREFIX}${src.length.toString(36)}-${(h >>> 0).toString(36)}`
}

const keys = new Map<string, string>() // src → khoá đã ghi
const srcs = new Map<string, string>() // khoá → src đã đọc

/** đổi src lớn thành khoá (ghi ảnh vào IndexedDB nếu chưa có) */
export async function stash(src: string): Promise<string> {
  if (src.length < MIN || !src.startsWith('data:')) return src
  let k = keys.get(src)
  if (!k) {
    k = keyOf(src)
    await tx('readwrite', (s) => s.put(src, k!))
    keys.set(src, k)
    srcs.set(k, src)
  }
  return k
}

/** đọc ảnh theo khoá; không có thì trả '' */
export async function unstash(k: string): Promise<string> {
  const hit = srcs.get(k)
  if (hit) return hit
  const src = (await tx<string | undefined>('readonly', (s) => s.get(k))) ?? ''
  if (src) { srcs.set(k, src); keys.set(src, k) }
  return src
}

/** ảnh đã đọc trong phiên (dùng khi hoàn tác về bản có khoá) */
export const cachedSrc = (k: string) => srcs.get(k)
