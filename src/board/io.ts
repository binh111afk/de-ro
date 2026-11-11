/**
 * Bảng vẽ — chèn ảnh / trang PDF từ máy, xuất PNG / PDF (chia trang A4).
 * PDF xuất tự ghi (mỗi trang một ảnh JPEG), không cần thư viện; đọc PDF dùng pdfjs-dist (nạp lười).
 */
import type { Bounds, El, Paper } from './scene'
import { drawElement, drawPaper } from './render'
import rough from 'roughjs'

/* ---------------- nhập ---------------- */

export interface Picture { src: string; w: number; h: number }

const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, fail) => {
  const img = new Image()
  img.onload = () => ok(img)
  img.onerror = () => fail(new Error('Không đọc được ảnh'))
  img.src = src
})

const readDataUrl = (f: Blob) => new Promise<string>((ok, fail) => {
  const r = new FileReader()
  r.onload = () => ok(String(r.result))
  r.onerror = () => fail(r.error)
  r.readAsDataURL(f)
})

/** ảnh từ máy; ảnh quá to thì thu về cạnh dài `max` px (bảng lưu trong localStorage, dung lượng có hạn) */
export async function readImageFile(f: File, max = 1800): Promise<Picture> {
  const url = await readDataUrl(f)
  const img = await loadImg(url)
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  if (k === 1 && f.size < 600_000) return { src: url, w: img.naturalWidth, h: img.naturalHeight }
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * k)
  c.height = Math.round(img.naturalHeight * k)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  // PNG có nền trong suốt thì giữ PNG, còn lại JPEG cho nhẹ
  const png = f.type === 'image/png' && f.size < 1_500_000
  return { src: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.88), w: c.width, h: c.height }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<any>; close: () => void }

export async function openPdf(f: File): Promise<PdfDoc> {
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) })
  const doc = await task.promise
  return { numPages: doc.numPages, getPage: (n) => doc.getPage(n), close: () => { void task.destroy() } }
}

/** khổ trang theo điểm PDF (1/72 inch) */
export async function pdfPageSize(doc: PdfDoc, n: number): Promise<{ w: number; h: number }> {
  const vp = (await doc.getPage(n)).getViewport({ scale: 1 })
  return { w: vp.width, h: vp.height }
}

/** một trang PDF thành ảnh rộng `width` px */
export async function renderPdfPage(doc: PdfDoc, n: number, width: number, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<Picture> {
  const page = await doc.getPage(n)
  const base = page.getViewport({ scale: 1 })
  const vp = page.getViewport({ scale: width / base.width })
  const c = document.createElement('canvas')
  c.width = Math.round(vp.width)
  c.height = Math.round(vp.height)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, c.width, c.height)
  await page.render({ canvasContext: ctx, viewport: vp, canvas: c }).promise
  return { src: c.toDataURL(type, 0.85), w: c.width, h: c.height }
}

/* ---------------- xuất ---------------- */

export type ExportBg = 'paper' | 'white' | 'none'

/** đợi mọi ảnh trong bảng nạp xong (xuất ngay sau khi mở bảng thì ảnh có thể chưa kịp nạp) */
async function preload(els: El[]) {
  await Promise.all(els.filter((e) => e.kind === 'image' && e.src).map((e) => loadImg(e.src!).catch(() => null)))
}

/** vẽ các hình trong vùng `b` (toạ độ bảng) ra canvas, `scale` px mỗi đơn vị */
export async function renderRegion(els: El[], b: Bounds, scale: number, bg: ExportBg, paper: Paper): Promise<HTMLCanvasElement> {
  await preload(els)
  const [x1, y1, x2, y2] = b
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil((x2 - x1) * scale))
  c.height = Math.max(1, Math.ceil((y2 - y1) * scale))
  const ctx = c.getContext('2d')!
  if (bg !== 'none') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
  }
  ctx.setTransform(scale, 0, 0, scale, -x1 * scale, -y1 * scale)
  if (bg === 'paper') drawPaper(ctx, paper, { zoom: scale, scrollX: -x1, scrollY: -y1 }, c.width, c.height)
  const rc = rough.canvas(c)
  for (const e of els) drawElement(ctx, rc, e)
  return c
}

export function download(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function savePng(c: HTMLCanvasElement, name: string) {
  return new Promise<void>((ok, fail) => c.toBlob((b) => {
    if (!b) return fail(new Error('Không tạo được ảnh (vùng quá lớn?)'))
    download(URL.createObjectURL(b), name)
    ok()
  }, 'image/png'))
}

/** A4 theo điểm PDF (1/72 inch) */
const A4: [number, number] = [595.28, 841.89]
const MARGIN = 28

/**
 * Chia canvas thành các trang A4: nội dung rộng hơn cao thì để trang ngang.
 * Bề ngang nội dung vừa khít trang, chiều dọc cắt thành nhiều trang.
 */
export function canvasToA4Pdf(c: HTMLCanvasElement): Blob {
  const landscape = c.width > c.height
  const [pw, ph] = landscape ? [A4[1], A4[0]] : A4
  const iw = pw - MARGIN * 2, ih = ph - MARGIN * 2
  // không phóng ảnh nhỏ quá cỡ thật (96 dpi → 0,75 pt/px)
  const k = Math.min(iw / c.width, 0.75 * 2)
  const sliceH = Math.max(1, Math.floor(ih / k))
  const pages: PdfImagePage[] = []
  for (let y = 0; y < c.height; y += sliceH) {
    const h = Math.min(sliceH, c.height - y)
    const s = document.createElement('canvas')
    s.width = c.width
    s.height = h
    const sc = s.getContext('2d')!
    sc.fillStyle = '#fff'
    sc.fillRect(0, 0, s.width, s.height)
    sc.drawImage(c, 0, y, c.width, h, 0, 0, c.width, h)
    const dh = h * k
    pages.push({ jpg: jpegBytes(s), w: s.width, h, pw, ph, x: MARGIN, y: ph - MARGIN - dh, dw: c.width * k, dh })
  }
  return buildPdf(pages)
}

function jpegBytes(c: HTMLCanvasElement) {
  const bin = atob(c.toDataURL('image/jpeg', 0.92).split(',')[1])
  const jpg = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) jpg[i] = bin.charCodeAt(i)
  return jpg
}

/** PDF theo trang gốc: mỗi canvas phủ kín một trang khổ `pw`×`ph` điểm */
export function pagesToPdf(items: { c: HTMLCanvasElement; pw: number; ph: number }[]): Blob {
  return buildPdf(items.map(({ c, pw, ph }) => ({ jpg: jpegBytes(c), w: c.width, h: c.height, pw, ph, x: 0, y: 0, dw: pw, dh: ph })))
}

/** PDF tối giản: mỗi trang một ảnh JPEG (DCTDecode) đặt tại (x, y) điểm, tính từ góc dưới-trái */
type PdfImagePage = { jpg: Uint8Array; w: number; h: number; pw: number; ph: number; x: number; y: number; dw: number; dh: number }
function buildPdf(pages: PdfImagePage[]): Blob {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let len = 0
  const push = (x: string | Uint8Array) => {
    const u = typeof x === 'string' ? enc.encode(x) : x
    parts.push(u)
    len += u.length
  }
  const n = pages.length
  // 1 catalog, 2 pages, rồi mỗi trang 3 đối tượng: page, content, image
  const total = 2 + n * 3
  const obj = (i: number) => { offsets[i] = len; push(`${i} 0 obj\n`) }
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  obj(1); push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')
  obj(2); push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>\nendobj\n`)
  const f = (v: number) => v.toFixed(2)
  pages.forEach((p, i) => {
    const pg = 3 + i * 3, ct = pg + 1, im = pg + 2
    obj(pg)
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(p.pw)} ${f(p.ph)}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>\nendobj\n`)
    const stream = `q ${f(p.dw)} 0 0 ${f(p.dh)} ${f(p.x)} ${f(p.y)} cm /Im${i} Do Q`
    obj(ct); push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`)
    obj(im)
    push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`)
    push(p.jpg)
    push('\nendstream\nendobj\n')
  })
  const xref = len
  let x = `xref\n0 ${total + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= total; i++) x += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  push(x)
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
}
