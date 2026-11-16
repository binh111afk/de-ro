/**
 * Kho hình nét đen trắng (tiểu học) cho tranh đếm:
 * - kho có sẵn: vector trong src/data/figureSprites.json (ảnh gốc do model ảnh vẽ, đổi bằng potrace —
 *   xem scripts/figure-sprites/). Mỗi hình có `ink` (nét) và `body` (bóng hình đặc, tô trắng che vật phía sau).
 *   Tệp khá nặng nên nạp sau, cùng lúc với công cụ vẽ.
 * - kho dùng chung trên server (id `x-<tên tiếng Anh>`): đồ vật ngoài kho có sẵn, vẽ một lần rồi lưu R2
 *   (server/figureSprite.ts); máy khách tải về, tách nền thành ảnh PNG nhỏ (`href`) rồi giữ trong bộ nhớ.
 */
export type Sprite = { w: number; h: number; ink: string; body: string; href?: undefined } | { w: number; h: number; href: string; ink?: undefined; body?: undefined }

let lib: Record<string, Sprite> | null = null
let loading: Promise<Record<string, Sprite>> | null = null
const dynamic: Record<string, Sprite> = {}

export function loadSprites(): Promise<Record<string, Sprite>> {
  return (loading ??= import('@/data/figureSprites.json').then((m) => (lib = m.default as Record<string, Sprite>)))
}

/** null khi kho chưa nạp xong hoặc không có hình này */
export const getSprite = (id: string): Sprite | null => lib?.[id] ?? dynamic[id] ?? null
export const spritesReady = () => lib !== null

/** id đồ vật của kho dùng chung: "x-" + tên tiếng Anh viết thường nối gạch ngang (khớp figureSlug ở server) */
export const DYNAMIC_ID = /^x-[a-z0-9-]{2,40}$/
export function dynamicId(en: string): string | null {
  const words = en.trim().toLowerCase()
  if (!/^[a-z][a-z \-]{1,39}$/.test(words)) return null
  const slug = words.replace(/[\s-]+/g, '-').replace(/^-|-$/g, '')
  return slug.length >= 2 ? `x-${slug}` : null
}

const pending = new Map<string, Promise<boolean>>()

/**
 * Bảo đảm có hình cho các id kho dùng chung: có sẵn trên server thì tải về (không tốn điểm), chưa có thì
 * nhờ server vẽ (trừ điểm như vẽ ảnh AI). Hình nào lỗi thì bỏ qua — tranh vẫn vẽ, chỗ đó hiện ô tên đồ vật.
 */
export async function ensureSprites(ids: Iterable<string>): Promise<void> {
  await Promise.all(
    [...new Set(ids)]
      .filter((id) => DYNAMIC_ID.test(id) && !dynamic[id])
      .map((id) => {
        let p = pending.get(id)
        if (!p) {
          p = fetchDynamic(id).catch(() => false)
          pending.set(id, p)
          // lỗi thì lần sau cho thử lại
          void p.then((ok) => !ok && pending.delete(id))
        }
        return p
      }),
  )
}

async function fetchDynamic(id: string): Promise<boolean> {
  const slug = id.slice(2)
  let url = `/api/files/fig/${slug}.png`
  let res = await fetch(url)
  if (res.status === 404) {
    // nạp lúc cần: toolSpec (kéo theo tệp này) còn chạy trong script Node, không có phiên đăng nhập
    const { apiFetch } = await import('./apiFetch')
    const made = await apiFetch('/api/figure-sprite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: slug.replace(/-/g, ' ') }),
    })
    const body = (await made.json().catch(() => ({}))) as { url?: string }
    if (!made.ok || !body.url) return false
    url = body.url
    res = await fetch(url)
  }
  if (!res.ok) return false
  const sprite = await cutOut(await res.blob())
  if (sprite) dynamic[id] = sprite
  return Boolean(sprite)
}

const MAX_SIDE = 240

/** ảnh nét đen nền trắng → PNG nhỏ: ngoài hình trong suốt, trong hình trắng đục (che vật phía sau), nét đen */
async function cutOut(blob: Blob): Promise<Sprite | null> {
  const bmp = await createImageBitmap(blob)
  const W0 = bmp.width
  const H0 = bmp.height
  const c0 = document.createElement('canvas')
  c0.width = W0
  c0.height = H0
  const g0 = c0.getContext('2d', { willReadFrequently: true })
  if (!g0) return null
  g0.drawImage(bmp, 0, 0)
  const p0 = g0.getImageData(0, 0, W0, H0).data
  let x0 = W0
  let y0 = H0
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < H0; y++)
    for (let x = 0; x < W0; x++) {
      const i = (y * W0 + x) * 4
      if ((p0[i] + p0[i + 1] + p0[i + 2]) / 3 < 150) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  if (x1 < 0) return null
  const pad = 6
  const sw = x1 - x0 + 1 + pad * 2
  const sh = y1 - y0 + 1 + pad * 2
  const s = Math.min(1, MAX_SIDE / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * s))
  const h = Math.max(1, Math.round(sh * s))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.fillStyle = '#fff'
  g.fillRect(0, 0, w, h)
  g.imageSmoothingQuality = 'high'
  g.drawImage(c0, x0 - pad, y0 - pad, sw, sh, 0, 0, w, h)
  const img = g.getImageData(0, 0, w, h)
  const p = img.data
  const lum = (i: number) => (p[i * 4] + p[i * 4 + 1] + p[i * 4 + 2]) / 3
  // bên ngoài = vùng sáng loang được từ mép (nét giãn 1px để bịt khe nhỏ)
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) ink[i] = lum(i) < 170 ? 1 : 0
  const wall = new Uint8Array(w * h)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (ink[y * w + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx
        const Y = y + dy
        if (X >= 0 && Y >= 0 && X < w && Y < h) wall[Y * w + X] = 1
      }
  const outside = new Uint8Array(w * h)
  const stack: number[] = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()!
    if (outside[i] || wall[i]) continue
    outside[i] = 1
    const x = i % w
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (i >= w) stack.push(i - w)
    if (i < w * (h - 1)) stack.push(i + w)
  }
  for (let i = 0; i < w * h; i++) {
    const l = lum(i)
    if (outside[i]) {
      // ngoài hình: chỉ giữ nét (mờ dần theo độ sáng)
      const a = Math.max(0, Math.min(255, ((235 - l) * 255) / 200))
      p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = 17
      p[i * 4 + 3] = a
    } else {
      p[i * 4] = p[i * 4 + 1] = p[i * 4 + 2] = l < 200 ? Math.round(l * 0.4) : 255
      p[i * 4 + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  return { w, h, href: c.toDataURL('image/png') }
}
