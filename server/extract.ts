/**
 * Trích text từ tệp giáo viên đính kèm (docx/pdf/xlsx) để làm nguồn ưu tiên 1
 * cho AI soạn đề. Chạy server-side: không phình bundle client, parser chỉ được
 * import khi thật sự có tệp.
 */
import { inflateRawSync } from 'node:zlib'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname } from 'node:path'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { json, readBody } from './http.js'
import { guard } from './guard.js'

const MAX_BYTES = 12 * 1024 * 1024
const MAX_TEXT = 60_000
const MAX_ROWS = 200
const MAX_COLS = 20

export interface ExtractedFile {
  name: string
  kind: 'docx' | 'pdf' | 'xlsx' | 'pptx' | 'text' | 'unsupported'
  text: string
  /** chỉ có với .pptx: text từng slide, đúng thứ tự */
  slides?: string[]
  /** chỉ .docx khi `marks` bật: ảnh nhúng (data URL), tra theo chỉ số trong token U+E002<chỉ số>U+E003 chèn vào text đúng chỗ ảnh */
  images?: string[]
  warning?: string
}

/**
 * Quét khối XML `<tag ...>…</tag>` bằng indexOf (thời gian tuyến tính). Không dùng regex `[\s\S]*?`
 * trên cả tệp: tệp cố tình thiếu thẻ đóng làm regex quét lại từ mọi vị trí (thời gian bình phương).
 * Sau tên thẻ phải là khoảng trắng, `>` hoặc `/` (để `<w:r` không khớp `<w:rPr`).
 */
const tagEnd = (c: string | undefined) => c === ' ' || c === '>' || c === '/' || c === '\t' || c === '\n' || c === '\r'

function* xmlBlocks(xml: string, tag: string): Generator<{ start: number; end: number; el: string; inner: string }> {
  const open = `<${tag}`
  const close = `</${tag}>`
  let pos = 0
  while (pos < xml.length) {
    const i = xml.indexOf(open, pos)
    if (i < 0) return
    if (!tagEnd(xml[i + open.length])) { pos = i + open.length; continue }
    const gt = xml.indexOf('>', i)
    if (gt < 0) return
    if (xml[gt - 1] === '/') { pos = gt + 1; continue } // thẻ tự đóng: không có nội dung
    const j = xml.indexOf(close, gt)
    if (j < 0) return
    const end = j + close.length
    yield { start: i, end, el: xml.slice(i, end), inner: xml.slice(gt + 1, j) }
    pos = end
  }
}

/** Thay từng khối `<tag>…</tag>` bằng kết quả của `fn` (tuyến tính). */
function mapXmlBlocks(xml: string, tag: string, fn: (el: string, inner: string) => string): string {
  let out = ''
  let last = 0
  for (const b of xmlBlocks(xml, tag)) {
    out += xml.slice(last, b.start) + fn(b.el, b.inner)
    last = b.end
  }
  return out + xml.slice(last)
}

/** Thẻ mở đầu tiên `<tag ...>` (chỉ phần trong `<…>`), để đọc thuộc tính bằng regex ngắn. */
function openTag(xml: string, tag: string): string {
  let pos = 0
  for (;;) {
    const i = xml.indexOf(`<${tag}`, pos)
    if (i < 0) return ''
    const gt = xml.indexOf('>', i)
    if (gt < 0) return ''
    if (tagEnd(xml[i + tag.length + 1])) return xml.slice(i, gt + 1)
    pos = gt + 1
  }
}

/** Giá trị thuộc tính trong một thẻ mở (thẻ ngắn, regex không lặp lồng). */
const attr = (tag: string, name: string): string | undefined => {
  const at = tag.indexOf(` ${name}="`) >= 0 ? tag.indexOf(` ${name}="`) : tag.search(new RegExp(`\s${name}="`))
  if (at < 0) return undefined
  const from = at + name.length + 3
  const to = tag.indexOf('"', from)
  return to < 0 ? undefined : tag.slice(from, to)
}

function clean(text: string): string {
  return text
    .replace(/\r/g, '')
    .split('\n').map((l) => l.replace(/[ \t]+$/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function capped(text: string, warning?: string): { text: string; warning?: string } {
  const t = clean(text)
  if (t.length <= MAX_TEXT) return { text: t, warning }
  return { text: t.slice(0, MAX_TEXT), warning: 'Tệp dài; chỉ đọc phần đầu.' }
}

/** Ký tự riêng đánh dấu chữ được nhấn mạnh (đậm, nghiêng, gạch chân, gạch ngang, màu, tô nền) khi đọc đề: U+E000 mở, U+E001 đóng. */
const EMPH_ON = '\uE000'
const EMPH_OFF = '\uE001'

/** Run có định dạng nổi bật: đậm, nghiêng, gạch chân, gạch ngang, chữ màu (không đen), tô sáng hoặc tô nền. */
function isEmphasised(rPr: string): boolean {
  if (/<w:(b|i|strike|dstrike)\s*\/>|<w:(b|i|strike|dstrike)\s+w:val="(1|true|on)"/.test(rPr)) return true
  if (/<w:u\s+w:val="(?!none")/.test(rPr)) return true
  if (/<w:highlight\s+w:val="(?!none")/.test(rPr)) return true
  if (/<w:shd\b[^>]*w:fill="(?!auto"|FFFFFF")/i.test(rPr)) return true
  const color = rPr.match(/<w:color\s+w:val="([0-9A-Fa-f]{6})"/)?.[1]
  if (!color) return false
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(color.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b) > 40 || Math.max(r, g, b) > 110 // có sắc hoặc xám sáng; đen/xám đậm là chữ thường
}

const IMG_ON = ''
const IMG_OFF = ''
const MAX_RAW_IMAGES = 1500 // ảnh nhúng đọc vào (trước khi ghép các mảnh)
const MAX_IMAGES = 600 // ảnh trả về (sau khi ghép)
const MAX_IMAGE_BYTES = 600 * 1024
const MAX_RAW_BYTES = 40 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024
const MIN_IMAGE_EMU = 24 * 9525 // ảnh có cạnh lớn nhất dưới ~24px là icon trang trí
const MIN_LINE_EMU = 4 * 9525 // cạnh nhỏ dưới ~4px là đường kẻ
const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml',
}

/** Thu nhỏ / nén ảnh quá lớn bằng @napi-rs/canvas nếu có; null nếu không làm được. */
async function shrinkImage(buf: Buffer): Promise<Buffer | null> {
  try {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas')
    const img = await loadImage(buf)
    for (const [maxSide, quality] of [[1400, 82], [1000, 70], [700, 60]] as const) {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = createCanvas(Math.max(1, Math.round(img.width * k)), Math.max(1, Math.round(img.height * k)))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const out = canvas.toBuffer('image/jpeg', quality)
      if (out.length <= MAX_IMAGE_BYTES) return out
    }
  } catch { /* không có canvas hoặc ảnh hỏng */ }
  return null
}

/**
 * Thay mỗi ảnh nhúng trong document.xml bằng một run chữ `U+E002<chỉ số>U+E003` (đúng vị trí trong đoạn),
 * để mammoth `extractRawText` giữ nguyên thứ tự. Bỏ ảnh trang trí (<~24px), ảnh EMF/WMF, ảnh vượt giới hạn.
 */
async function tokenizeImages(zip: import('jszip'), xmlIn: string): Promise<{ xml: string; images: string[]; warning?: string }> {
  const relsFile = zip.file('word/_rels/document.xml.rels')
  if (!relsFile) return { xml: xmlIn, images: [] }
  const rels = new Map<string, string>()
  const relsXml = await relsFile.async('string')
  for (let at = relsXml.indexOf('<Relationship'); at >= 0; at = relsXml.indexOf('<Relationship', at + 1)) {
    const gt = relsXml.indexOf('>', at)
    if (gt < 0) break
    const m = [relsXml.slice(at, gt + 1)]
    const id = m[0].match(/\bId="([^"]+)"/)?.[1]
    const target = m[0].match(/\bTarget="([^"]+)"/)?.[1]
    if (id && target && /\/image$/.test(m[0].match(/\bType="([^"]+)"/)?.[1] ?? '')) rels.set(id, target)
  }
  if (!rels.size) return { xml: xmlIn, images: [] }
  // mc:AlternateContent: giữ phần Choice (tránh đếm ảnh hai lần cùng phần Fallback VML)
  const xml = mapXmlBlocks(xmlIn, 'mc:AlternateContent', (block) => xmlBlocks(block, 'mc:Choice').next().value?.inner ?? block)
  const images: string[] = []
  const byTarget = new Map<string, number>()
  let total = 0
  let unsupported = 0
  let tooBig = 0
  let overLimit = 0
  const resolve = async (rid: string): Promise<number | null> => {
    const target = rels.get(rid)
    if (!target) return null
    if (byTarget.has(target)) return byTarget.get(target)!
    const ext = target.split('.').pop()?.toLowerCase() ?? ''
    const path = target.startsWith('/') ? target.slice(1) : `word/${target}`
    const file = zip.file(path)
    if (!MIME[ext] || !file) { unsupported++; return null }
    let data = await file.async('nodebuffer')
    let mime = MIME[ext]
    if (data.length > MAX_IMAGE_BYTES) {
      const small = ext === 'svg' ? null : await shrinkImage(data)
      if (!small) { tooBig++; return null }
      data = small
      mime = 'image/jpeg'
    }
    if (images.length >= MAX_RAW_IMAGES || total + data.length > MAX_RAW_BYTES) { overLimit++; return null }
    total += data.length
    images.push(`data:${mime};base64,${data.toString('base64')}`)
    byTarget.set(target, images.length - 1)
    return images.length - 1
  }
  const parts: string[] = []
  let last = 0
  const found = [...xmlBlocks(xml, 'w:drawing'), ...xmlBlocks(xml, 'w:pict')].sort((a, b) => a.start - b.start)
  for (const m of found) {
    if (m.start < last) continue // khối lồng trong khối trước
    parts.push(xml.slice(last, m.start))
    last = m.end
    const el = m.el
    if (el.includes('<w:txbxContent')) { parts.push(el); continue } // khung chữ: để mammoth đọc
    const rid = attr(openTag(el, 'a:blip'), 'r:embed') || attr(openTag(el, 'v:imagedata'), 'r:id')
    if (!rid) { parts.push(el); continue }
    const extTag = openTag(el, 'wp:extent')
    const cx = attr(extTag, 'cx')
    const cy = attr(extTag, 'cy')
    const ext = cx && cy && /^\d+$/.test(cx) && /^\d+$/.test(cy) ? [extTag, cx, cy] : null
    const pt = (attr(openTag(el, 'v:shape'), 'style') ?? '').match(/width:([\d.]+)pt;\s*height:([\d.]+)pt/)
    const [w, h] = ext ? [Number(ext[1]), Number(ext[2])] : pt ? [Number(pt[1]) * 12700, Number(pt[2]) * 12700] : [Infinity, Infinity]
    // bỏ ảnh trang trí: cả hai cạnh nhỏ (icon) hoặc một cạnh mỏng như đường kẻ. Dải chữ cao ~13px nhưng rộng thì giữ.
    if (Math.max(w, h) < MIN_IMAGE_EMU || Math.min(w, h) < MIN_LINE_EMU) continue
    const idx = await resolve(rid)
    if (idx !== null) parts.push(`<w:t>${IMG_ON}${idx}${IMG_OFF}</w:t>`)
  }
  parts.push(xml.slice(last))
  const notes = [
    unsupported && `${unsupported} ảnh định dạng chưa hỗ trợ (EMF/WMF…) bị bỏ`,
    tooBig && `${tooBig} ảnh quá lớn bị bỏ`,
    overLimit && `${overLimit} ảnh vượt giới hạn (tối đa ${MAX_RAW_IMAGES} ảnh) bị bỏ`,
  ].filter(Boolean)
  return { xml: parts.join(''), images, warning: notes.length ? `${notes.join('; ')}.` : undefined }
}

/** Tiền xử lý .docx khi `marks`: đánh dấu chữ nổi bật và thay ảnh bằng token vị trí. */
async function prepareDocx(data: Buffer): Promise<{ data: Buffer; images: string[]; warning?: string }> {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  const file = zip.file('word/document.xml')
  if (!file) return { data, images: [] }
  const marked = mapXmlBlocks(await file.async('string'), 'w:r', (run) => {
    const rPr = xmlBlocks(run, 'w:rPr').next().value?.el ?? ''
    if (!rPr || !isEmphasised(rPr)) return run
    return mapXmlBlocks(run, 'w:t', (t, inner) =>
      /\S/.test(inner) && !inner.includes('<') ? `${t.slice(0, t.length - inner.length - 6)}${EMPH_ON}${inner}${EMPH_OFF}</w:t>` : t,
    )
  })
  const { xml, images, warning } = await tokenizeImages(zip, marked)
  zip.file('word/document.xml', xml)
  return { data: await zip.generateAsync({ type: 'nodebuffer' }), images, warning }
}

/**
 * Trình đọc XML của mammoth chậm theo bình phương khi tệp có rất nhiều thẻ mở không đóng
 * (1 KB → hàng chục giây). Quét tuyến tính độ lồng thẻ của mọi phần XML trước khi đưa cho mammoth.
 */
const MAX_XML_DEPTH = 200
async function assertSaneDocxXml(data: Buffer) {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue
    const xml = await zip.files[name].async('string')
    let depth = 0
    for (let i = xml.indexOf('<'); i >= 0; i = xml.indexOf('<', i + 1)) {
      const c = xml[i + 1]
      if (c === '?' || c === '!') continue
      if (c === '/') { depth--; continue }
      const gt = xml.indexOf('>', i)
      if (gt < 0) throw new Error('Tệp Word hỏng.')
      if (xml[gt - 1] !== '/') depth++
      if (depth > MAX_XML_DEPTH) throw new Error('Tệp Word có cấu trúc bất thường, không đọc được.')
      i = gt
    }
  }
}

async function extractDocx(data: Buffer, marks = false): Promise<{ text: string; images: string[]; warning?: string }> {
  const mammoth = await import('mammoth')
  await assertSaneDocxXml(data)
  const prep = marks ? await prepareDocx(data) : { data, images: [] as string[], warning: undefined }
  const result = await mammoth.extractRawText({ buffer: prep.data })
  return { text: result.value, images: prep.images, warning: prep.warning }
}

/**
 * Đề dạng ảnh thường chia đề bài thành nhiều mảnh (mỗi dòng chữ là một ảnh mảnh). Các token ảnh đứng liền nhau
 * (chỉ cách bằng khoảng trắng / xuống dòng) được ghép thành MỘT ảnh: cùng dòng thì xếp ngang, khác dòng thì xếp dọc.
 * Không có @napi-rs/canvas thì giữ nguyên các mảnh (parser sẽ gắn mảnh đầu và đếm phần còn lại).
 */
async function stitchRuns(text: string, images: string[]): Promise<{ text: string; images: string[] }> {
  let canvasMod: typeof import('@napi-rs/canvas')
  try { canvasMod = await import('@napi-rs/canvas') } catch { return { text, images } }
  const { createCanvas, loadImage } = canvasMod
  const tok = `${IMG_ON}\\d+${IMG_OFF}`
  const run = new RegExp(`${tok}(?:[ \\t\\u00a0\\n]*${tok})+`, 'g')
  const out = [...images]
  const loaded = new Map<number, Awaited<ReturnType<typeof loadImage>>>()
  const load = async (i: number) => {
    if (!loaded.has(i)) loaded.set(i, await loadImage(Buffer.from(images[i].slice(images[i].indexOf(',') + 1), 'base64')))
    return loaded.get(i)!
  }
  const cache = new Map<string, string>()
  const pieces: Array<{ before: string; idx: number }> = []
  let result = ''
  let last = 0
  for (const m of text.matchAll(run)) {
    result += text.slice(last, m.index)
    last = m.index! + m[0].length
    pieces.length = 0
    let gap = ''
    for (const part of m[0].split(new RegExp(`(${tok})`)).filter((x) => x !== '')) {
      const t = part.match(new RegExp(`^${IMG_ON}(\\d+)${IMG_OFF}$`))
      if (t) { pieces.push({ before: gap, idx: Number(t[1]) }); gap = '' } else gap += part
    }
    const key = pieces.map((p) => `${p.before.includes('\n') ? '|' : ','}${p.idx}`).join('')
    if (!cache.has(key)) {
      try {
        const rows: Array<Awaited<ReturnType<typeof loadImage>>[]> = []
        for (const p of pieces) {
          const img = await load(p.idx)
          if (!rows.length || p.before.includes('\n')) rows.push([img])
          else rows[rows.length - 1].push(img)
        }
        const rowW = rows.map((r) => r.reduce((n, i) => n + i.width, 0))
        const rowH = rows.map((r) => Math.max(...r.map((i) => i.height)))
        const W = Math.max(...rowW)
        const H = rowH.reduce((n, h) => n + h, 0)
        const canvas = createCanvas(W, H)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, W, H)
        let y = 0
        rows.forEach((r, ri) => {
          let x = 0
          for (const img of r) { ctx.drawImage(img, x, y + (rowH[ri] - img.height) / 2); x += img.width }
          y += rowH[ri]
        })
        let buf = canvas.toBuffer('image/png')
        let mime = 'image/png'
        if (buf.length > MAX_IMAGE_BYTES) { buf = canvas.toBuffer('image/jpeg', 82); mime = 'image/jpeg' }
        out.push(`data:${mime};base64,${buf.toString('base64')}`)
        cache.set(key, `${IMG_ON}${out.length - 1}${IMG_OFF}`)
      } catch { cache.set(key, m[0]) }
    }
    result += cache.get(key)
  }
  return { text: result + text.slice(last), images: out }
}

/** Sau khi cắt text: bỏ ảnh không còn token nào, đánh lại chỉ số liền nhau. */
function compactImages(text: string, images: string[]): { text: string; images: string[] } {
  const map = new Map<number, number>()
  const out: string[] = []
  const next = text.replace(new RegExp(`${IMG_ON}(\\d+)${IMG_OFF}`, 'g'), (_, n: string) => {
    const old = Number(n)
    if (!map.has(old)) { map.set(old, out.length); out.push(images[old]) }
    return `${IMG_ON}${map.get(old)}${IMG_OFF}`
  })
  return { text: next, images: out }
}

/** Giới hạn cuối: tối đa MAX_IMAGES ảnh và MAX_TOTAL_IMAGE_BYTES; token của ảnh bị bỏ được gỡ khỏi text. */
function capImages(text: string, images: string[]): { text: string; images: string[]; dropped: number } {
  let total = 0
  let keep = 0
  while (keep < images.length && keep < MAX_IMAGES && total + images[keep].length * 0.75 <= MAX_TOTAL_IMAGE_BYTES) total += images[keep++].length * 0.75
  if (keep === images.length) return { text, images, dropped: 0 }
  const next = text.replace(new RegExp(`${IMG_ON}(\\d+)${IMG_OFF}`, 'g'), (t, n: string) => (Number(n) < keep ? t : ''))
  return { text: next, images: images.slice(0, keep), dropped: images.length - keep }
}

/** Màu chữ "nổi bật": có sắc hoặc xám sáng; đen và xám đậm là chữ thường. */
function isEmphasisColor(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b) > 40 || Math.max(r, g, b) > 110
}

interface Seg { x1: number; x2: number; y1: number; y2: number; color: string }

/**
 * PDF không lưu "đậm / màu / gạch chân" cùng chữ nên phải ghép lại (cách làm: pdf.js
 * `fontExtraProperties` cho tên font gốc → đậm/nghiêng; theo dõi màu tô qua danh sách lệnh vẽ → màu chữ;
 * đường kẻ mảnh sát chân chữ → gạch chân / gạch ngang; hình chữ nhật tô màu phủ chữ → tô nền).
 * Trả về, theo thứ tự của `getTextContent`, chữ nào nổi bật.
 */
async function pdfEmphasis(
  pdfjs: typeof import('pdfjs-dist/legacy/build/pdf.mjs'),
  page: import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy,
  items: Array<{ str: string; transform: number[]; width: number }>,
): Promise<boolean[]> {
  const { OPS } = pdfjs
  const ops = await page.getOperatorList()
  const showOps = new Set<number>([OPS.showText, OPS.showSpacedText, OPS.nextLineShowText, OPS.nextLineSetSpacingShowText])
  const paintOps = new Set<number>([OPS.stroke, OPS.closeStroke, OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke])
  const fillOps = new Set<number>([OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke, OPS.closeFillStroke, OPS.closeEOFillStroke])
  const colorOps = new Set<number>([OPS.setFillRGBColor, OPS.setFillGray, OPS.setFillCMYKColor])
  let ctm = [1, 0, 0, 1, 0, 0]
  const stack: number[][] = []
  let fill = '#000000'
  let stroke = '#000000'
  const runs: Array<{ x: number; y: number; color: string }> = []
  let tm = [1, 0, 0, 1, 0, 0]
  let leading = 0
  const move = (tx: number, ty: number) => {
    tm = [tm[0], tm[1], tm[2], tm[3], tx * tm[0] + ty * tm[2] + tm[4], tx * tm[1] + ty * tm[3] + tm[5]]
  }
  const showAt = () =>
    runs.push({ x: ctm[0] * tm[4] + ctm[2] * tm[5] + ctm[4], y: ctm[1] * tm[4] + ctm[3] * tm[5] + ctm[5], color: fill })
  const lines: Seg[] = []
  const rects: Seg[] = []
  for (let i = 0; i < ops.fnArray.length; i++) {
    const op = ops.fnArray[i]
    const args = ops.argsArray[i] as unknown[]
    if (op === OPS.save) stack.push(ctm)
    else if (op === OPS.restore) ctm = stack.pop() ?? ctm
    else if (op === OPS.transform) {
      const [a, b, c, d, e, f] = args as number[]
      const [A, B, C, D, E, F] = ctm
      ctm = [A * a + C * b, B * a + D * b, A * c + C * d, B * c + D * d, A * e + C * f + E, B * e + D * f + F]
    } else if (colorOps.has(op) && typeof args[0] === 'string') fill = args[0] as string
    else if (op === OPS.setStrokeRGBColor && typeof args[0] === 'string') stroke = args[0] as string
    else if (op === OPS.beginText) tm = [1, 0, 0, 1, 0, 0]
    else if (op === OPS.setTextMatrix) {
      // pdf.js trả ma trận lúc là 6 số, lúc là một đối tượng {0..5}
      const m = args.length === 1 && typeof args[0] === 'object' ? (args[0] as Record<number, number>) : (args as number[])
      tm = [0, 1, 2, 3, 4, 5].map((k) => m[k])
    }
    else if (op === OPS.moveText) move(args[0] as number, args[1] as number)
    else if (op === OPS.setLeadingMoveText) { leading = -(args[1] as number); move(args[0] as number, args[1] as number) }
    else if (op === OPS.setLeading) leading = args[0] as number
    else if (op === OPS.nextLine) move(0, -leading)
    else if (showOps.has(op)) {
      if (op === OPS.nextLineShowText || op === OPS.nextLineSetSpacingShowText) move(0, -leading)
      const glyphs = Array.isArray(args[0]) ? (args[0] as Array<{ unicode?: string } | number>) : []
      if (glyphs.some((g) => typeof g === 'object' && g?.unicode?.trim())) showAt() // bỏ lần hiện chỉ có dấu cách
    }
    else if (op === OPS.constructPath) {
      const [paint, , box] = args as [number, unknown, Record<number, number>]
      if (!paintOps.has(paint) || !box) continue
      const pts = [[box[0], box[1]], [box[2], box[3]]].map(([x, y]) => [ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]])
      const seg = { x1: Math.min(pts[0][0], pts[1][0]), x2: Math.max(pts[0][0], pts[1][0]), y1: Math.min(pts[0][1], pts[1][1]), y2: Math.max(pts[0][1], pts[1][1]), color: fillOps.has(paint) ? fill : stroke }
      if (seg.y2 - seg.y1 <= 1.5 && seg.x2 - seg.x1 > 2) lines.push(seg)
      else if (fillOps.has(paint) && !/^#(?:[ef][0-9a-f]){3}$/i.test(seg.color)) rects.push(seg)
    }
  }
  return items.map((it) => {
    if (it.str === '') return false
    const [, , , size, x, y] = it.transform
    const h = Math.abs(size) || 10
    const overlap = (s: Seg) => Math.min(x + it.width, s.x2) - Math.max(x, s.x1)
    // màu chữ: các lần hiện chữ (theo vị trí) nằm trong khung của mục này, đa số có màu nổi bật
    const inside = runs.filter((r) => Math.abs(r.y - y) < 0.3 * h && r.x >= x - 1 && r.x <= x + it.width + 1)
    const colored = inside.length > 0 && inside.filter((r) => isEmphasisColor(r.color)).length * 2 >= inside.length
    const underlined = lines.some((s) => overlap(s) >= it.width * 0.5 && s.y1 >= y - 0.35 * h && s.y2 <= y + 0.5 * h)
    const highlighted = rects.some((s) => overlap(s) >= it.width * 0.6 && s.y1 <= y + 0.1 * h && s.y2 >= y + 0.6 * h && s.y2 - s.y1 < 2.5 * h)
    return colored || underlined || highlighted
  })
}

/** Font đậm/nghiêng theo tên font gốc (Arial-BoldMT, TimesNewRomanPS-ItalicMT, …). */
async function fontStyleOf(page: import('pdfjs-dist/legacy/build/pdf.mjs').PDFPageProxy, fontName: string): Promise<boolean> {
  const font = await new Promise<{ name?: string } | undefined>((resolve) => {
    try { page.commonObjs.get(fontName, resolve) } catch { resolve(undefined) }
  })
  return /bold|italic|oblique|black|heavy/i.test(font?.name ?? '')
}

async function extractPdf(data: Buffer, marks = false): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const task = pdfjs.getDocument({ data: new Uint8Array(data), ...(marks ? { fontExtraProperties: true } : {}) })
  const doc = await task.promise
  const pages: string[] = []
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const items = content.items.filter((it): it is TextItem => 'str' in it)
      let flags: boolean[] = []
      if (marks) {
        flags = await pdfEmphasis(pdfjs, page, items)
        const styled = new Map<string, boolean>()
        for (let i = 0; i < items.length; i++) {
          const name = (items[i] as { fontName?: string }).fontName ?? ''
          if (!styled.has(name)) styled.set(name, await fontStyleOf(page, name))
          if (items[i].str !== '' && styled.get(name)) flags[i] = true
        }
      }
      let text = ''
      items.forEach((item, i) => {
        text += flags[i] && item.str.trim() ? `${EMPH_ON}${item.str}${EMPH_OFF}` : item.str
        text += item.hasEOL ? '\n' : ' '
      })
      pages.push(text.trim())
      if (pages.join('\n\n').length > MAX_TEXT * 1.2) break
    }
  } finally {
    await task.destroy()
  }
  return pages.join('\n\n')
}

function cellText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    if (typeof v.text === 'string') return v.text
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((part) => (part && typeof part === 'object' ? String((part as { text?: unknown }).text ?? '') : ''))
        .join('')
    }
    if (v.result != null) return String(v.result)
    if (typeof v.hyperlink === 'string' && typeof v.text === 'string') return v.text
  }
  return ''
}

async function extractXlsx(data: Buffer): Promise<string> {
  // exceljs là CJS; dynamic import cho default tuỳ runtime.
  const mod = await import('exceljs')
  const ExcelJS: any = (mod as unknown as { default?: any }).default ?? mod
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(data)
  const out: string[] = []
  wb.eachSheet((ws: any) => {
    out.push(`## ${ws.name}`)
    let rows = 0
    ws.eachRow((row: any) => {
      if (rows++ >= MAX_ROWS) return
      const values = (row.values as unknown[]).slice(1, MAX_COLS + 1)
      const line = values.map(cellText).join(' | ').trim()
      if (line) out.push(line)
    })
  })
  return out.join('\n')
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
}

/**
 * Đọc text từng slide của .pptx (zip XML). Mỗi đoạn `<a:p>` là một dòng;
 * các run `<a:t>` trong cùng đoạn nối liền. Giữ thứ tự slide theo số hiệu tệp.
 */
async function extractPptxSlides(data: Buffer): Promise<string[]> {
  const mod = await import('jszip')
  const JSZip: any = (mod as unknown as { default?: any }).default ?? mod
  const zip = await JSZip.loadAsync(data)
  const files = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/slide(\d+)/)![1]) - Number(b.match(/slide(\d+)/)![1]))

  const slides: string[] = []
  let budget = MAX_TEXT
  for (const name of files) {
    const entry = zip.files[name]
    if (!entry) continue
    const xml = await entry.async('string')
    const lines = (xml.split(/<\/a:p>/) as string[])
      .map((chunk: string) =>
        [...xmlBlocks(chunk, 'a:t')].map((m) => decodeXml(m.inner)).join(''),
      )
      .map((line: string) => line.trim())
      .filter(Boolean)
    const slide = lines.join('\n')
    if (!slide) continue
    if (slide.length > budget) {
      slides.push(slide.slice(0, Math.max(0, budget)))
      break
    }
    slides.push(slide)
    budget -= slide.length
    if (budget <= 0) break
  }
  return slides
}

/**
 * Chặn "zip bomb": đọc central directory (không giải nén) và từ chối nếu quá nhiều mục
 * hoặc tổng/mỗi mục khai báo giải nén quá lớn.
 */
const ZIP_MAX_ENTRIES = 5000
const ZIP_MAX_ENTRY = 50 * 1024 * 1024
const ZIP_MAX_TOTAL = 100 * 1024 * 1024
function assertSafeZip(buf: Buffer) {
  // tìm End Of Central Directory (0x06054b50) trong 64 KB cuối
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('Tệp hỏng hoặc không đúng định dạng.')
  const count = buf.readUInt16LE(eocd + 10)
  let off = buf.readUInt32LE(eocd + 16)
  if (count === 0xffff || off === 0xffffffff) throw new Error('Tệp quá lớn hoặc không hỗ trợ (zip64).')
  if (count > ZIP_MAX_ENTRIES) throw new Error('Tệp có quá nhiều thành phần.')
  let total = 0
  for (let n = 0; n < count; n++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) throw new Error('Tệp hỏng hoặc không đúng định dạng.')
    const method = buf.readUInt16LE(off + 10)
    const csize = buf.readUInt32LE(off + 20)
    const size = buf.readUInt32LE(off + 24)
    if (size > ZIP_MAX_ENTRY) throw new Error('Tệp chứa thành phần quá lớn.')
    // kích thước khai báo có thể là giả: giải nén thật với giới hạn đầu ra (zlib dừng ngay khi vượt)
    const local = buf.readUInt32LE(off + 42)
    if (local + 30 > buf.length || buf.readUInt32LE(local) !== 0x04034b50) throw new Error('Tệp hỏng hoặc không đúng định dạng.')
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const budget = Math.min(ZIP_MAX_ENTRY, ZIP_MAX_TOTAL - total)
    let real = csize
    if (method === 8) {
      try {
        // giải nén tối đa đúng số byte khai báo (+1): khai gian thì zlib dừng ngay, tốn rất ít
        real = inflateRawSync(buf.subarray(start, start + csize), { maxOutputLength: Math.max(1, Math.min(budget, size + 1)) }).length
        if (real > size) throw new RangeError('size')
      } catch (err) {
        if (err instanceof RangeError) throw new Error('Tệp giải nén ra quá lớn.')
        throw new Error('Tệp hỏng hoặc không đúng định dạng.')
      }
    } else if (method !== 0) throw new Error('Tệp nén theo kiểu không hỗ trợ.')
    total += Math.max(real, size)
    if (total > ZIP_MAX_TOTAL) throw new Error('Tệp giải nén ra quá lớn.')
    off += 46 + buf.readUInt16LE(off + 28) + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32)
  }
}

export async function extractFile(name: string, data: Buffer, marks = false): Promise<ExtractedFile> {
  const ext = extname(name).toLowerCase()
  try {
    if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx') assertSafeZip(data)
    if (ext === '.docx') {
      const doc = await extractDocx(data, marks)
      const cut = capped(doc.text)
      const warning = [doc.warning, cut.warning].filter(Boolean).join(' ') || undefined
      if (!marks) return { name, kind: 'docx', text: cut.text, warning }
      const stitched = await stitchRuns(cut.text, doc.images)
      const first = compactImages(stitched.text, stitched.images)
      const capped2 = capImages(first.text, first.images)
      const packed = compactImages(capped2.text, capped2.images)
      const note = capped2.dropped ? `${capped2.dropped} ảnh vượt giới hạn trả về bị bỏ.` : undefined
      return { name, kind: 'docx', text: packed.text, ...(packed.images.length ? { images: packed.images } : {}), warning: [warning, note].filter(Boolean).join(' ') || undefined }
    }
    if (ext === '.pdf') {
      const { text, warning } = capped(await extractPdf(data, marks))
      return { name, kind: 'pdf', text, warning }
    }
    if (ext === '.xlsx') {
      const { text, warning } = capped(await extractXlsx(data))
      return { name, kind: 'xlsx', text, warning }
    }
    if (ext === '.pptx') {
      const slides = await extractPptxSlides(data)
      const { text, warning } = capped(slides.join('\n\n'))
      return { name, kind: 'pptx', text, slides, warning }
    }
    if (ext === '.csv' || ext === '.txt' || ext === '.md' || ext === '.json') {
      const { text, warning } = capped(data.toString('utf8'))
      return { name, kind: 'text', text, warning }
    }
    if (ext === '.doc' || ext === '.xls' || ext === '.ppt') {
      return {
        name,
        kind: 'unsupported',
        text: '',
        warning: 'Định dạng .doc/.xls/.ppt cũ chưa đọc được; hãy lưu lại thành .docx/.xlsx/.pptx.',
      }
    }
    return { name, kind: 'unsupported', text: '', warning: 'Chưa hỗ trợ đọc nội dung định dạng này.' }
  } catch (err) {
    return {
      name,
      kind: 'unsupported',
      text: '',
      warning: `Không đọc được tệp: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export async function handleExtractRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!(await guard(req, res, 'extract'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const body = JSON.parse(await readBody(req)) as { name?: unknown; data?: unknown; marks?: unknown }
    if (typeof body.name !== 'string' || typeof body.data !== 'string') {
      return json(res, 400, { error: 'name và data (base64) là bắt buộc' })
    }
    const buf = Buffer.from(body.data, 'base64')
    if (buf.length === 0) return json(res, 400, { error: 'Tệp rỗng' })
    if (buf.length > MAX_BYTES) {
      return json(res, 413, { error: 'Tệp quá lớn (tối đa 12 MB).' })
    }
    return json(res, 200, await extractFile(body.name, buf, body.marks === true))
  } catch (err) {
    return json(res, 400, { error: err instanceof Error ? err.message : String(err) })
  }
}

export function extractMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
): void {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') return next()
  handleExtractRequest(req, res).catch((err: unknown) => {
    if (res.headersSent) return res.end()
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
  })
}
