/**
 * Trích text từ tệp giáo viên đính kèm (docx/pdf/xlsx) để làm nguồn ưu tiên 1
 * cho AI soạn đề. Chạy server-side: không phình bundle client, parser chỉ được
 * import khi thật sự có tệp.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname } from 'node:path'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { json, readBody } from './http'

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
  warning?: string
}

function clean(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
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

/** Bọc chữ của mọi run nổi bật bằng ký tự đánh dấu, để chỗ khác (tách đề) tìm đáp án đúng được tô/đậm/gạch. */
async function markEmphasis(data: Buffer): Promise<Buffer> {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  const file = zip.file('word/document.xml')
  if (!file) return data
  const xml = (await file.async('string')).replace(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (run) => {
    const rPr = run.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? ''
    if (!rPr || !isEmphasised(rPr)) return run
    return run.replace(/(<w:t(?:\s[^>]*)?>)([^<]*\S[^<]*)(<\/w:t>)/g, `$1${EMPH_ON}$2${EMPH_OFF}$3`)
  })
  zip.file('word/document.xml', xml)
  return zip.generateAsync({ type: 'nodebuffer' })
}

async function extractDocx(data: Buffer, marks = false): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer: marks ? await markEmphasis(data) : data })
  return result.value
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
        [...chunk.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXml(m[1])).join(''),
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

export async function extractFile(name: string, data: Buffer, marks = false): Promise<ExtractedFile> {
  const ext = extname(name).toLowerCase()
  try {
    if (ext === '.docx') {
      const { text, warning } = capped(await extractDocx(data, marks))
      return { name, kind: 'docx', text, warning }
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
