/**
 * Nhập .docx giữ định dạng (Tệp → Nhập file): đọc thẳng OOXML trên trình duyệt thành block đề.
 * Giữ: căn lề, thụt lề, khoảng cách đoạn, giãn dòng, tiêu đề, danh sách, đậm/nghiêng/gạch/chỉ số,
 * cỡ chữ, phông, màu, tô nền, ngắt trang, bảng (gộp ô, nền ô), ảnh trong dòng.
 * Kiểu đoạn (styles.xml) được trải ra theo chuỗi basedOn, đè bằng định dạng trực tiếp.
 */
import JSZip from 'jszip'
import { ommlToLatex } from './ommlLatex'
import type { ExamBlock, FormatAttrs, Mark, Span, TableCellData } from '@/data/docTypes'

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const TW_PX = 15 // twip → px (96 dpi)
const EMU_PX = 9525
const MAX_BYTES = 12 * 1024 * 1024
/** ảnh lớn hơn thì thu lại (cạnh dài ≤ IMG_MAX px), để tài liệu không phình */
const IMG_SHRINK_BYTES = 250 * 1024
const IMG_MAX = 1600

async function shrink(blob: Blob, type: string): Promise<Blob> {
  if (blob.size <= IMG_SHRINK_BYTES || type === 'image/svg+xml' || type === 'image/gif') return blob
  try {
    const bmp = await createImageBitmap(blob)
    const k = Math.min(1, IMG_MAX / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k)
    c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    bmp.close()
    // png có thể trong suốt: webp giữ được nền trong; ảnh chụp: jpeg
    const out = await new Promise<Blob | null>((res) => c.toBlob(res, type === 'image/png' ? 'image/webp' : 'image/jpeg', 0.85))
    return out && out.size < blob.size ? out : blob
  } catch {
    return blob
  }
}

const toDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res(String(fr.result))
    fr.onerror = () => rej(fr.error)
    fr.readAsDataURL(b)
  })

const kids = (el: Element | null | undefined, name?: string) =>
  el ? Array.from(el.children).filter((c) => !name || c.localName === name) : []
const kid = (el: Element | null | undefined, name: string) => kids(el, name)[0] ?? null
const val = (el: Element | null | undefined, attr = 'val') => el?.getAttributeNS(W, attr) ?? el?.getAttribute(`w:${attr}`) ?? null
const on = (el: Element | null) => !!el && !['0', 'false', 'none'].includes(val(el) ?? '1')

interface RunProps {
  b?: boolean
  i?: boolean
  u?: boolean
  strike?: boolean
  vert?: 'sub' | 'super'
  size?: number
  font?: string
  color?: string
  highlight?: string
  caps?: boolean
}
interface ParaProps {
  align?: FormatAttrs['align']
  indentLeft?: number
  indentFirstLine?: number
  spaceBefore?: number
  spaceAfter?: number
  lineHeight?: number
  shading?: string
  outline?: number
  /** null: numId 0 — tắt số kế thừa từ kiểu (Mục lục dựa trên Heading 1) */
  num?: { id: string; level: number } | null
  pageBreakBefore?: boolean
}

const HIGHLIGHT: Record<string, string> = {
  yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff', magenta: '#ff00ff', blue: '#0000ff', red: '#ff0000',
  darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000', darkMagenta: '#800080', darkRed: '#800000',
  darkYellow: '#808000', darkGray: '#808080', lightGray: '#c0c0c0', black: '#000000',
}

function readRPr(rPr: Element | null): RunProps {
  const p: RunProps = {}
  if (!rPr) return p
  const b = kid(rPr, 'b'); if (b) p.b = on(b)
  const i = kid(rPr, 'i'); if (i) p.i = on(i)
  const u = kid(rPr, 'u'); if (u) p.u = on(u)
  const s = kid(rPr, 'strike'); if (s) p.strike = on(s)
  const caps = kid(rPr, 'caps'); if (caps) p.caps = on(caps)
  const va = val(kid(rPr, 'vertAlign'))
  if (va === 'subscript') p.vert = 'sub'
  else if (va === 'superscript') p.vert = 'super'
  const sz = Number(val(kid(rPr, 'sz')))
  if (sz) p.size = sz / 2
  const f = kid(rPr, 'rFonts')
  const font = val(f, 'ascii') ?? val(f, 'hAnsi')
  if (font) p.font = font
  const c = val(kid(rPr, 'color'))
  if (c && /^[0-9a-f]{6}$/i.test(c)) p.color = `#${c.toLowerCase()}`
  const h = val(kid(rPr, 'highlight'))
  if (h && HIGHLIGHT[h]) p.highlight = HIGHLIGHT[h]
  const shd = val(kid(rPr, 'shd'), 'fill')
  if (!p.highlight && shd && /^[0-9a-f]{6}$/i.test(shd) && shd.toLowerCase() !== 'ffffff') p.highlight = `#${shd.toLowerCase()}`
  return p
}

function readPPr(pPr: Element | null): ParaProps {
  const p: ParaProps = {}
  if (!pPr) return p
  const jc = val(kid(pPr, 'jc'))
  if (jc) p.align = jc === 'center' ? 'center' : jc === 'right' || jc === 'end' ? 'right' : jc === 'both' || jc === 'distribute' ? 'justify' : 'left'
  const ind = kid(pPr, 'ind')
  if (ind) {
    const left = val(ind, 'left') ?? val(ind, 'start')
    if (left != null) p.indentLeft = Math.round(Number(left) / TW_PX)
    const first = val(ind, 'firstLine')
    const hang = val(ind, 'hanging')
    if (first != null) p.indentFirstLine = Math.round(Number(first) / TW_PX)
    else if (hang != null) p.indentFirstLine = -Math.round(Number(hang) / TW_PX)
  }
  const sp = kid(pPr, 'spacing')
  if (sp) {
    const bf = val(sp, 'before'); if (bf != null) p.spaceBefore = Math.round(Number(bf) / TW_PX)
    const af = val(sp, 'after'); if (af != null) p.spaceAfter = Math.round(Number(af) / TW_PX)
    const line = val(sp, 'line')
    const rule = val(sp, 'lineRule') ?? 'auto'
    if (line != null && rule === 'auto') p.lineHeight = Math.round((Number(line) / 240) * 100) / 100
  }
  const shd = val(kid(pPr, 'shd'), 'fill')
  if (shd && /^[0-9a-f]{6}$/i.test(shd) && shd.toLowerCase() !== 'ffffff') p.shading = `#${shd.toLowerCase()}`
  const ol = val(kid(pPr, 'outlineLvl'))
  if (ol != null) p.outline = Number(ol)
  const numPr = kid(pPr, 'numPr')
  const numId = val(kid(numPr, 'numId'))
  if (numId === '0') p.num = null
  else if (numId) p.num = { id: numId, level: Number(val(kid(numPr, 'ilvl')) ?? 0) }
  if (kid(pPr, 'pageBreakBefore') && on(kid(pPr, 'pageBreakBefore'))) p.pageBreakBefore = true
  return p
}

interface Style { p: ParaProps; r: RunProps; name: string; basedOn?: string }

function readStyles(xml: Document | null) {
  const map = new Map<string, Style>()
  let defR: RunProps = {}
  let defP: ParaProps = {}
  let defaultPara: string | undefined
  if (!xml) return { map, defR, defP, defaultPara }
  const root = xml.documentElement
  const dd = kid(root, 'docDefaults')
  defR = readRPr(kid(kid(dd, 'rPrDefault'), 'rPr'))
  defP = readPPr(kid(kid(dd, 'pPrDefault'), 'pPr'))
  for (const s of kids(root, 'style')) {
    const id = val(s, 'styleId')
    if (!id) continue
    if (val(s, 'type') === 'paragraph' && val(s, 'default') === '1') defaultPara = id
    map.set(id, {
      p: readPPr(kid(s, 'pPr')),
      r: readRPr(kid(s, 'rPr')),
      name: (val(kid(s, 'name')) ?? id).toLowerCase(),
      basedOn: val(kid(s, 'basedOn')) ?? undefined,
    })
  }
  return { map, defR, defP, defaultPara }
}

type Styles = ReturnType<typeof readStyles>

/** kiểu đã trải theo basedOn (gốc trước, con đè sau) */
function resolveStyle(st: Styles, id: string | null | undefined): Style & { heading?: number } {
  const chain: Style[] = []
  const seen = new Set<string>()
  let cur = id ?? st.defaultPara
  while (cur && !seen.has(cur) && st.map.has(cur)) {
    seen.add(cur)
    const s = st.map.get(cur)!
    chain.unshift(s)
    cur = s.basedOn
  }
  const out: Style & { heading?: number } = { p: {}, r: {}, name: chain.at(-1)?.name ?? '' }
  for (const s of chain) {
    Object.assign(out.p, s.p)
    Object.assign(out.r, s.r)
  }
  const m = /^heading (\d)$/.exec(out.name) ?? (out.name === 'title' ? ['', '1'] : null)
  if (m) out.heading = Number(m[1])
  return out
}

interface Ctx {
  st: Styles
  zip: JSZip
  rels: Map<string, string>
  media: Map<string, Promise<string | null>>
  numFmt: Map<string, NumLevel>
  /** bộ đếm số tự động theo numId */
  counters: Map<string, number[]>
}

async function imageOf(ctx: Ctx, rid: string): Promise<string | null> {
  const target = ctx.rels.get(rid)
  if (!target) return null
  const path = target.startsWith('/') ? target.slice(1) : `word/${target}`.replace(/\/[^/]+\/\.\.\//g, '/')
  if (!ctx.media.has(path)) {
    ctx.media.set(path, (async () => {
      const f = ctx.zip.file(path)
      const ext = path.split('.').pop()?.toLowerCase() ?? ''
      const type = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'svg' ? 'image/svg+xml' : ext === 'webp' ? 'image/webp' : ''
      if (!f || !type) return null // EMF/WMF: trình duyệt không vẽ được
      const blob = new Blob([await f.async('uint8array')], { type })
      return toDataUrl(await shrink(blob, type))
    })())
  }
  return ctx.media.get(path)!
}

function marksOf(r: RunProps, base: RunProps): Mark[] {
  const m: Mark[] = []
  if (r.b) m.push({ type: 'bold' })
  if (r.i) m.push({ type: 'italic' })
  if (r.u) m.push({ type: 'underline' })
  if (r.strike) m.push({ type: 'strike' })
  if (r.vert) m.push({ type: r.vert })
  if (r.highlight) m.push({ type: 'highlight', attrs: { color: r.highlight } })
  const ts: Record<string, string> = {}
  // chỉ ghi khi khác mặc định của tệp, để chữ thường theo phông trang của app
  if (r.size && r.size !== base.size) ts.fontSize = `${r.size}pt`
  if (r.font && r.font !== base.font) ts.fontFamily = r.font
  if (r.color && r.color !== '#000000') ts.color = r.color
  if (Object.keys(ts).length) m.push({ type: 'textStyle', attrs: ts })
  return m
}

const sameMarks = (a?: Mark[], b?: Mark[]) => JSON.stringify(a ?? []) === JSON.stringify(b ?? [])

interface Line { spans: Span[]; pageBreakAfter?: boolean }

/** các run của một đoạn; ngắt dòng / ngắt trang tách thành nhiều dòng */
async function runsOf(ctx: Ctx, el: Element, pr: RunProps, lines: Line[]) {
  const push = (s: Span) => {
    const cur = lines[lines.length - 1].spans
    const last = cur[cur.length - 1]
    if (!s.image && last && !last.image && sameMarks(last.marks, s.marks)) last.text += s.text
    else cur.push(s)
  }
  for (const c of kids(el)) {
    const n = c.localName
    if (n === 'r') {
      const rs = resolveStyle(ctx.st, val(kid(kid(c, 'rPr'), 'rStyle')))
      const props: RunProps = { ...pr, ...rs.r, ...readRPr(kid(c, 'rPr')) }
      const marks = marksOf(props, ctx.st.defR)
      const mk = marks.length ? { marks } : {}
      for (const t of kids(c)) {
        const tn = t.localName
        if (tn === 't') push({ text: props.caps ? (t.textContent ?? '').toLocaleUpperCase('vi') : t.textContent ?? '', ...mk })
        else if (tn === 'tab') push({ text: '\t', ...mk })
        else if (tn === 'sym') {
          const ch = parseInt(val(t, 'char') ?? '', 16)
          // kí hiệu Wingdings không có trong phông thường: thay bằng dấu tương tự
          if (ch) push({ text: /wingdings|symbol/i.test(val(t, 'font') ?? '') ? '❧' : String.fromCharCode(ch), ...mk })
        } else if (tn === 'br' || tn === 'cr') {
          if (val(t, 'type') === 'page') lines[lines.length - 1].pageBreakAfter = true
          lines.push({ spans: [] })
        } else if (tn === 'drawing' || tn === 'pict') {
          const blip = t.getElementsByTagName('a:blip')[0] ?? t.getElementsByTagName('v:imagedata')[0]
          const rid = blip?.getAttribute('r:embed') ?? blip?.getAttribute('r:id')
          const src = rid ? await imageOf(ctx, rid) : null
          if (src) {
            const ext = t.getElementsByTagName('wp:extent')[0]
            const width = ext ? Math.round(Number(ext.getAttribute('cx')) / EMU_PX) : undefined
            push({ text: '', image: { src, ...(width ? { width } : {}) } })
          }
        }
      }
    } else if (n === 'oMath') {
      const tex = ommlToLatex(c)
      if (tex) push({ text: `$${tex}$` })
    } else if (n === 'oMathPara') {
      for (const m of kids(c, 'oMath')) {
        const tex = ommlToLatex(m)
        if (tex) push({ text: `$${tex}$` })
      }
    } else if (['hyperlink', 'ins', 'smartTag', 'fldSimple', 'customXml', 'sdt', 'sdtContent'].includes(n)) {
      await runsOf(ctx, n === 'sdt' ? kid(c, 'sdtContent') ?? c : c, pr, lines)
    }
  }
}

function formatOf(p: ParaProps, base: ParaProps): FormatAttrs | undefined {
  const f: FormatAttrs = {}
  if (p.align && p.align !== 'left') f.align = p.align
  if (p.indentLeft) f.indentLeft = p.indentLeft
  if (p.indentFirstLine) f.indentFirstLine = p.indentFirstLine
  if (p.spaceBefore != null && p.spaceBefore !== base.spaceBefore) f.spaceBefore = p.spaceBefore
  if (p.spaceAfter != null && p.spaceAfter !== base.spaceAfter) f.spaceAfter = p.spaceAfter
  if (p.lineHeight && p.lineHeight !== base.lineHeight) f.lineHeight = p.lineHeight
  if (p.shading) f.shading = p.shading
  return Object.keys(f).length ? f : undefined
}

async function paragraph(ctx: Ctx, p: Element) {
  const pPr = kid(p, 'pPr')
  const style = resolveStyle(ctx.st, val(kid(pPr, 'pStyle')))
  const props: ParaProps = { ...ctx.st.defP, ...style.p, ...readPPr(pPr) }
  const lines: Line[] = [{ spans: [] }]
  await runsOf(ctx, p, { ...ctx.st.defR, ...style.r }, lines)
  const heading = style.heading ?? (props.outline != null && props.outline < 3 ? props.outline + 1 : undefined)
  return { props, lines, heading, format: formatOf(props, ctx.st.defP) }
}

const hasContent = (spans: Span[]) => spans.some((s) => s.image || s.text.trim())

async function table(ctx: Ctx, tbl: Element): Promise<ExamBlock> {
  const grid = kids(kid(tbl, 'tblGrid'), 'gridCol').map((g) => Math.round(Number(val(g, 'w') ?? 0) / TW_PX))
  const rows: TableCellData[][] = []
  // ô gộp dọc: cột lưới → ô đang mở
  const open = new Map<number, TableCellData>()
  for (const tr of kids(tbl, 'tr')) {
    const header = !!kid(kid(tr, 'trPr'), 'tblHeader')
    const row: TableCellData[] = []
    let col = 0
    for (const tc of kids(tr, 'tc')) {
      const tcPr = kid(tc, 'tcPr')
      const span = Number(val(kid(tcPr, 'gridSpan')) ?? 1)
      const vm = kid(tcPr, 'vMerge')
      if (vm && val(vm) !== 'restart') {
        const o = open.get(col)
        if (o) o.rowSpan = (o.rowSpan ?? 1) + 1
        col += span
        continue
      }
      const spans: Span[] = []
      let align: TableCellData['align']
      for (const p of kids(tc, 'p')) {
        const para = await paragraph(ctx, p)
        if (!align && para.props.align && para.props.align !== 'justify') align = para.props.align
        for (const l of para.lines) {
          if (!hasContent(l.spans)) continue
          // nhiều đoạn trong ô (khung code, ô nhiều dòng): giữ xuống dòng
          if (spans.length) spans.push({ text: '\n' })
          spans.push(...l.spans)
        }
      }
      const fill = val(kid(tcPr, 'shd'), 'fill')
      const cell: TableCellData = {
        text: spans.length ? spans : '',
        ...(header ? { header } : {}),
        ...(span > 1 ? { colSpan: span } : {}),
        ...(align && align !== 'left' ? { align } : {}),
        ...(fill && /^[0-9a-f]{6}$/i.test(fill) && fill.toLowerCase() !== 'ffffff' ? { shading: `#${fill.toLowerCase()}` } : {}),
      }
      if (vm) open.set(col, cell)
      else open.delete(col)
      row.push(cell)
      col += span
    }
    if (row.length) rows.push(row)
  }
  return { type: 'table', rows, ...(grid.some(Boolean) ? { colWidths: grid } : {}) }
}

const roman = (n: number) => {
  const t: Array<[number, string]> = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]
  let o = ''
  for (const [v, c] of t) while (n >= v) { o += c; n -= v }
  return o
}
const letter = (n: number) => String.fromCharCode(96 + (((n - 1) % 26) + 1))

/** số tự động Word ("1/", "2.5.1/", "a)") — tăng bộ đếm cấp này, đặt lại các cấp con */
function numberText(ctx: Ctx, id: string, level: number): string {
  const lv = (i: number) => ctx.numFmt.get(`${id}:${i}`)
  const me = lv(level)
  if (!me || me.fmt === 'bullet' || me.fmt === 'none') return ''
  const c = ctx.counters.get(id) ?? []
  for (let i = 0; i <= level; i++) if (c[i] == null) c[i] = (lv(i)?.start ?? 1) - (i === level ? 1 : 0)
  c[level] += 1
  c.length = level + 1
  ctx.counters.set(id, c)
  return me.text.replace(/%(\d)/g, (_, k: string) => {
    const i = Number(k) - 1
    const n = c[i] ?? 1
    const f = lv(i)?.fmt ?? 'decimal'
    return f === 'lowerLetter' ? letter(n) : f === 'upperLetter' ? letter(n).toUpperCase() : f === 'lowerRoman' ? roman(n) : f === 'upperRoman' ? roman(n).toUpperCase() : String(n)
  })
}

async function body(ctx: Ctx, el: Element, out: ExamBlock[]) {
  let list: { items: Span[][]; levels: number[] } | null = null
  const flush = () => {
    if (list) out.push({ type: 'bullets', items: list.items, levels: list.levels })
    list = null
  }
  for (const c of kids(el)) {
    const n = c.localName
    if (n === 'p') {
      const { props, lines, heading, format } = await paragraph(ctx, c)
      if (props.pageBreakBefore && out.length) {
        flush()
        out.push({ type: 'pageBreak' })
      }
      // danh sách gạch đầu dòng; danh sách số giữ số thứ tự trong chữ cho đúng như Word
      if (props.num && ctx.numFmt.get(`${props.num.id}:${props.num.level}`)?.fmt === 'bullet' && hasContent(lines[0].spans)) {
        list ??= { items: [], levels: [] }
        list.items.push(lines.flatMap((l) => l.spans))
        list.levels.push(Math.min(2, props.num.level))
        continue
      }
      flush()
      const no = props.num && hasContent(lines[0].spans) ? numberText(ctx, props.num.id, props.num.level) : ''
      if (no) lines[0].spans.unshift({ text: `${no} `, ...(lines[0].spans[0]?.marks ? { marks: lines[0].spans[0].marks } : {}) })
      for (const l of lines) {
        if (hasContent(l.spans) || lines.length === 1) {
          const text = l.spans.length ? l.spans : ''
          if (heading && hasContent(l.spans)) out.push({ type: 'heading', level: Math.min(3, heading) as 1 | 2 | 3, text, ...(format ? { format } : {}) })
          else out.push({ type: 'paragraph', text, ...(format ? { format } : {}) })
        }
        if (l.pageBreakAfter) out.push({ type: 'pageBreak' })
      }
    } else if (n === 'tbl') {
      flush()
      out.push(await table(ctx, c))
    } else if (n === 'sdt') {
      flush()
      await body(ctx, kid(c, 'sdtContent') ?? c, out)
    }
  }
  flush()
}

interface NumLevel { fmt: string; text: string; start: number }

/** định dạng số của từng (numId, cấp): 'bullet' / 'decimal'…, mẫu "%1.%2/" và số bắt đầu */
function readNumbering(xml: Document | null): Map<string, NumLevel> {
  const out = new Map<string, NumLevel>()
  if (!xml) return out
  const abs = new Map<string, Map<number, NumLevel>>()
  for (const a of kids(xml.documentElement, 'abstractNum')) {
    const lv = new Map<number, NumLevel>()
    for (const l of kids(a, 'lvl')) {
      lv.set(Number(val(l, 'ilvl')), { fmt: val(kid(l, 'numFmt')) ?? '', text: val(kid(l, 'lvlText')) ?? '', start: Number(val(kid(l, 'start')) ?? 1) })
    }
    abs.set(val(a, 'abstractNumId') ?? '', lv)
  }
  for (const nm of kids(xml.documentElement, 'num')) {
    const lv = abs.get(val(kid(nm, 'abstractNumId')) ?? '')
    lv?.forEach((fmt, i) => out.set(`${val(nm, 'numId')}:${i}`, fmt))
  }
  return out
}

/** lề (cm, làm tròn 0,1) và hướng trang của tệp Word, lấy ở w:sectPr cuối thân */
export interface DocxPage {
  margins: { top: number; right: number; bottom: number; left: number }
  orientation: 'portrait' | 'landscape'
}

function readPage(bodyEl: Element): DocxPage | undefined {
  const sect = kid(bodyEl, 'sectPr')
  const mar = kid(sect, 'pgMar')
  if (!mar) return undefined
  // twip → cm; lề âm (chữ tràn lề) coi như 0
  const cm = (k: string) => Math.max(0, Math.round((Math.abs(Number(val(mar, k) ?? 0)) / 567) * 10) / 10)
  const sz = kid(sect, 'pgSz')
  const landscape = val(sz, 'orient') === 'landscape' || Number(val(sz, 'w')) > Number(val(sz, 'h'))
  // gáy sách (gutter) cộng vào lề trái như Word
  return {
    margins: { top: cm('top'), right: cm('right'), bottom: cm('bottom'), left: Math.round((cm('left') + cm('gutter')) * 10) / 10 },
    orientation: landscape ? 'landscape' : 'portrait',
  }
}

export async function docxToBlocks(file: Blob): Promise<ExamBlock[]> {
  return (await docxImport(file)).blocks
}

export async function docxImport(file: Blob): Promise<{ blocks: ExamBlock[]; page?: DocxPage }> {
  if (file.size > MAX_BYTES) throw new Error('Tệp quá lớn (tối đa 12 MB).')
  const zip = await JSZip.loadAsync(file)
  const parse = async (path: string) => {
    const s = await zip.file(path)?.async('string')
    return s ? new DOMParser().parseFromString(s, 'application/xml') : null
  }
  const doc = await parse('word/document.xml')
  if (!doc) throw new Error('Tệp Word không hợp lệ.')
  const relsXml = await parse('word/_rels/document.xml.rels')
  const rels = new Map<string, string>()
  for (const r of Array.from(relsXml?.getElementsByTagName('Relationship') ?? [])) {
    if (r.getAttribute('TargetMode') !== 'External') rels.set(r.getAttribute('Id') ?? '', r.getAttribute('Target') ?? '')
  }
  const ctx: Ctx = {
    st: readStyles(await parse('word/styles.xml')),
    zip,
    rels,
    media: new Map(),
    numFmt: readNumbering(await parse('word/numbering.xml')),
    counters: new Map(),
  }
  const out: ExamBlock[] = []
  const bodyEl = kid(doc.documentElement, 'body')!
  await body(ctx, bodyEl, out)
  // bỏ đoạn trống thừa ở cuối
  while (out.length && out.at(-1)!.type === 'paragraph' && !hasContent(((out.at(-1) as { text: Span[] | string }).text || []) as Span[])) out.pop()
  return { blocks: out, page: readPage(bodyEl) }
}
