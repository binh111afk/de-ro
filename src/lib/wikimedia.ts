/**
 * Ảnh tư liệu thật từ Wikimedia Commons cho slide Chuyên nghiệp.
 * Chỉ nhận ảnh có giấy phép dùng lại được (CC0, public domain, CC BY, CC BY-SA); trả kèm dòng ghi nguồn
 * "Ảnh: <tác giả> · <giấy phép> · Wikimedia Commons" để đặt ở chân slide. API Commons cho phép gọi từ trình duyệt (origin=*).
 */

export interface CommonsPhoto {
  dataUrl: string
  credit: string
  title: string
}

interface ImageInfo {
  url: string
  thumburl?: string
  width: number
  height: number
  mime: string
  extmetadata?: Record<string, { value?: string } | undefined>
}

interface Page {
  title: string
  index?: number
  imageinfo?: ImageInfo[]
}

const API = 'https://commons.wikimedia.org/w/api.php'
const THUMB_WIDTH = 1280
const BAD_TITLE = /\b(logo|flag|stamp|coat of arms|signature|diagram|map|chart|poster|cover|icon|banner|screenshot)\b/i

/** CC0 / public domain / CC BY / CC BY-SA; loại NC, ND và mọi giấy phép lạ. */
export function isReusableLicense(license: string | undefined): boolean {
  const text = (license ?? '').trim()
  if (!text || /\b(NC|ND)\b|non-?commercial|no.?deriv|fair use/i.test(text)) return false
  return /^(CC0|Public domain|PD[ -]|CC[ -]BY(-SA)?\b)/i.test(text)
}

const plain = (html: string | undefined): string => {
  if (!html) return ''
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const box = document.createElement('div')
  box.innerHTML = html
  return (box.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function creditOf(info: ImageInfo): string {
  const meta = info.extmetadata ?? {}
  let artist = plain(meta.Artist?.value).replace(/^(user|by)[:\s]+/i, '')
  if (/unknown|không rõ|anonymous|^$/i.test(artist)) artist = 'Không rõ tác giả'
  if (artist.length > 42) artist = artist.slice(0, 41).trimEnd() + '…'
  const license = plain(meta.LicenseShortName?.value) || 'Wikimedia Commons'
  return `Ảnh: ${artist} · ${license} · Wikimedia Commons`
}

const STOP = new Set(['the', 'and', 'from', 'with', 'view', 'photo', 'image', 'picture', 'near', 'for'])
const fold = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Tỉ lệ từ khoá của truy vấn xuất hiện trong tên file + mô tả (tìm kiếm Commons khá lỏng, hay trả ảnh lệch chủ đề). */
export function relevance(query: string, haystack: string): number {
  const tokens = fold(query).split(/[^a-z0-9]+/).filter((t) => (t.length >= 3 || /^\d+$/.test(t)) && !STOP.has(t))
  if (tokens.length === 0) return 1
  const text = fold(haystack)
  return tokens.filter((t) => text.includes(t)).length / tokens.length
}

/** Chọn ảnh tốt nhất trong kết quả tìm: khớp truy vấn, ngang, đủ lớn, đúng giấy phép, thứ hạng tìm kiếm cao. */
export function pickCommonsPage(pages: Page[], query = ''): Page | null {
  let best: Page | null = null
  let bestScore = -Infinity
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info || !/^image\/jpeg$/.test(info.mime) || BAD_TITLE.test(page.title)) continue
    if (info.width < 1000 || info.height < 600) continue
    if (!isReusableLicense(info.extmetadata?.LicenseShortName?.value)) continue
    if (query && relevance(query, `${page.title} ${plain(info.extmetadata?.ImageDescription?.value)}`) < 0.5) continue
    const ratio = info.width / info.height
    const score =
      -(page.index ?? 20) * 0.6 +
      (ratio >= 1.2 && ratio <= 2.3 ? 4 : ratio >= 0.9 ? 1 : -3) +
      Math.min(3, (info.width * info.height) / 2_000_000)
    if (score > bestScore) {
      best = page
      bestScore = score
    }
  }
  return best
}

async function toDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/** Tìm một ảnh Commons theo truy vấn tiếng Anh ngắn; không có ảnh hợp lệ thì trả null. */
export async function findCommonsPhoto(query: string, signal?: AbortSignal): Promise<CommonsPhoto | null> {
  const q = query.trim()
  if (!q) return null
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '15',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiextmetadatafilter: 'Artist|LicenseShortName|ImageDescription',
    iiurlwidth: String(THUMB_WIDTH),
  })
  const res = await fetch(`${API}?${params}`, { signal: signal ?? AbortSignal.timeout(15_000) })
  if (!res.ok) return null
  const body = (await res.json()) as { query?: { pages?: Record<string, Page> } }
  const pages = Object.values(body.query?.pages ?? {})
  const page = pickCommonsPage(pages, q)
  const info = page?.imageinfo?.[0]
  const url = info?.thumburl ?? info?.url
  if (!page || !info || !url) return null
  const image = await fetch(url, { signal: signal ?? AbortSignal.timeout(30_000) })
  if (!image.ok) return null
  return { dataUrl: await toDataUrl(await image.blob()), credit: creditOf(info), title: page.title.replace(/^File:/, '') }
}
