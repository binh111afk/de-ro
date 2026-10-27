/**
 * Trích text từ tệp giáo viên đính kèm (docx/pdf/xlsx) để làm nguồn ưu tiên 1
 * cho AI soạn đề. Chạy server-side: không phình bundle client, parser chỉ được
 * import khi thật sự có tệp.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname } from 'node:path'
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

async function extractDocx(data: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer: data })
  return result.value
}

async function extractPdf(data: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const task = pdfjs.getDocument({ data: new Uint8Array(data) })
  const doc = await task.promise
  const pages: string[] = []
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      let text = ''
      for (const item of content.items) {
        if (!('str' in item)) continue
        text += item.str
        text += item.hasEOL ? '\n' : ' '
      }
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

export async function extractFile(name: string, data: Buffer): Promise<ExtractedFile> {
  const ext = extname(name).toLowerCase()
  try {
    if (ext === '.docx') {
      const { text, warning } = capped(await extractDocx(data))
      return { name, kind: 'docx', text, warning }
    }
    if (ext === '.pdf') {
      const { text, warning } = capped(await extractPdf(data))
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
    const body = JSON.parse(await readBody(req)) as { name?: unknown; data?: unknown }
    if (typeof body.name !== 'string' || typeof body.data !== 'string') {
      return json(res, 400, { error: 'name và data (base64) là bắt buộc' })
    }
    const buf = Buffer.from(body.data, 'base64')
    if (buf.length === 0) return json(res, 400, { error: 'Tệp rỗng' })
    if (buf.length > MAX_BYTES) {
      return json(res, 413, { error: 'Tệp quá lớn (tối đa 12 MB).' })
    }
    return json(res, 200, await extractFile(body.name, buf))
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
