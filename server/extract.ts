/**
 * Trích text từ tệp giáo viên đính kèm (docx/pdf/xlsx) để làm nguồn ưu tiên 1
 * cho AI soạn đề. Chạy server-side: không phình bundle client, parser chỉ được
 * import khi thật sự có tệp.
 */
import { imageSize } from 'image-size'
import { inflateRawSync } from 'node:zlib'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname } from 'node:path'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { json, readBody, safeError } from './http.js'
import { clientIp, guard, isLocal } from './guard.js'
import { ommlXmlToLatex } from './ommlXml.js'

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

/** Quét khối XML ngoài cùng có đếm độ lồng cho các thẻ lồng nhau (`w:p`, `w:tbl`, `m:oMath`). */
function* outerXmlBlocks(xml: string, tag: string): Generator<{ start: number; end: number; el: string; inner: string }> {
  const open = `<${tag}`
  const close = `</${tag}>`
  let pos = 0
  while (pos < xml.length) {
    const i = xml.indexOf(open, pos)
    if (i < 0) return
    if (!tagEnd(xml[i + open.length])) { pos = i + open.length; continue }
    const gt = xml.indexOf('>', i)
    if (gt < 0) return
    if (xml[gt - 1] === '/') { pos = gt + 1; continue }
    let depth = 1
    let cur = gt + 1
    let end = -1
    let closeStart = -1
    while (cur < xml.length && depth > 0) {
      const nextOpen = xml.indexOf(open, cur)
      const nextClose = xml.indexOf(close, cur)
      if (nextClose < 0) break
      if (nextOpen >= 0 && nextOpen < nextClose) {
        if (!tagEnd(xml[nextOpen + open.length])) { cur = nextOpen + open.length; continue }
        const og = xml.indexOf('>', nextOpen)
        if (og < 0) break
        if (xml[og - 1] !== '/') depth++
        cur = og + 1
      } else {
        depth--
        if (depth === 0) {
          closeStart = nextClose
          end = nextClose + close.length
          break
        }
        cur = nextClose + close.length
      }
    }
    if (end < 0) return
    yield { start: i, end, el: xml.slice(i, end), inner: xml.slice(gt + 1, closeStart) }
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

function mapOuterXmlBlocks(xml: string, tag: string, fn: (el: string, inner: string) => string): string {
  let out = ''
  let last = 0
  for (const b of outerXmlBlocks(xml, tag)) {
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

/** Giá trị thuộc tính trong một thẻ mở (thẻ ngắn, hỗ trợ nháy kép và nháy đơn). */
const attr = (tag: string, name: string): string | undefined => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = tag.match(new RegExp(`\\s${escaped}=(?:"([^"]*)"|'([^']*)')`))
  return m ? (m[1] ?? m[2]) : undefined
}

const encodeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

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

/**
 * Ký tự riêng đánh dấu chữ được nhấn mạnh khi đọc đề:
 * - U+E000 mở chung (PDF), U+E001 đóng.
 * - U+E011..U+E04F mở mang bitmask (bold=1, italic=2, underline=4, color=8, highlight=16, strike=32).
 * - U+E005 ngăn cách ô bảng, U+E006 đầu dòng bảng gọn.
 */
const EMPH_ON = '\uE000'
const EMPH_OFF = '\uE001'
const EMPH_BOLD = 1
const EMPH_ITALIC = 2
const EMPH_UNDERLINE = 4
const EMPH_COLOR = 8
const EMPH_HIGHLIGHT = 16
const EMPH_STRIKE = 32
const CELL_SEP = '\uE005'
const ROW_MARK = '\uE006'
const emphOpen = (mask: number) => (mask ? String.fromCharCode(0xe010 + mask) : '')

interface RPrFlags {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: boolean
  highlight?: boolean
  strike?: boolean
  vertAlign?: 'superscript' | 'subscript' | 'baseline'
}

interface NumRef {
  id: string
  level: number
}

interface ResolvedStyle {
  rPr: RPrFlags
  numPr?: NumRef | null
  basedOn?: string
}

function readToggle(rPr: string, tagName: string): boolean | undefined {
  const tag = openTag(rPr, tagName)
  if (!tag) return undefined
  const v = attr(tag, 'w:val') ?? attr(tag, 'val')
  if (v && /^(0|false|off|none)$/i.test(v)) return false
  return true
}

function readRPrFlags(rPr: string): RPrFlags {
  const out: RPrFlags = {}
  if (!rPr) return out
  const b = readToggle(rPr, 'w:b')
  if (b !== undefined) out.bold = b
  const i = readToggle(rPr, 'w:i')
  if (i !== undefined) out.italic = i
  const st = readToggle(rPr, 'w:strike') ?? readToggle(rPr, 'w:dstrike')
  if (st !== undefined) out.strike = st
  const uTag = openTag(rPr, 'w:u')
  if (uTag) {
    const uv = attr(uTag, 'w:val') ?? attr(uTag, 'val')
    out.underline = !(uv && /^(none|0|false)$/i.test(uv))
  }
  const hTag = openTag(rPr, 'w:highlight')
  if (hTag) {
    const hv = attr(hTag, 'w:val') ?? attr(hTag, 'val')
    out.highlight = !(hv && /^(none|0|false)$/i.test(hv))
  }
  const shdTag = openTag(rPr, 'w:shd')
  if (shdTag) {
    const fill = attr(shdTag, 'w:fill') ?? attr(shdTag, 'fill')
    if (fill) {
      if (/^(auto|ffffff)$/i.test(fill)) {
        if (out.highlight === undefined) out.highlight = false
      } else if (/^[0-9a-f]{6}$/i.test(fill)) {
        out.highlight = true
      }
    }
  }
  const cTag = openTag(rPr, 'w:color')
  if (cTag) {
    const cv = attr(cTag, 'w:val') ?? attr(cTag, 'val')
    if (cv && /^[0-9a-f]{6}$/i.test(cv)) out.color = isEmphasisColor(`#${cv}`)
    else if (cv === 'auto') out.color = false
  }
  const vaTag = openTag(rPr, 'w:vertAlign')
  if (vaTag) {
    const va = attr(vaTag, 'w:val') ?? attr(vaTag, 'val')
    if (va === 'superscript' || va === 'subscript' || va === 'baseline') out.vertAlign = va
  }
  return out
}

function mergeRPrFlags(...parts: Array<RPrFlags | undefined>): RPrFlags {
  const out: RPrFlags = {}
  for (const p of parts) {
    if (!p) continue
    if (p.bold !== undefined) out.bold = p.bold
    if (p.italic !== undefined) out.italic = p.italic
    if (p.underline !== undefined) out.underline = p.underline
    if (p.color !== undefined) out.color = p.color
    if (p.highlight !== undefined) out.highlight = p.highlight
    if (p.strike !== undefined) out.strike = p.strike
    if (p.vertAlign !== undefined) out.vertAlign = p.vertAlign
  }
  return out
}

function flagsMask(f: RPrFlags): number {
  return (
    (f.bold ? EMPH_BOLD : 0) |
    (f.italic ? EMPH_ITALIC : 0) |
    (f.underline ? EMPH_UNDERLINE : 0) |
    (f.color ? EMPH_COLOR : 0) |
    (f.highlight ? EMPH_HIGHLIGHT : 0) |
    (f.strike ? EMPH_STRIKE : 0)
  )
}

function readNumPr(pPr: string): NumRef | null | undefined {
  const np = xmlBlocks(pPr, 'w:numPr').next().value?.inner
  if (!np) return undefined
  const id = attr(openTag(np, 'w:numId'), 'w:val')
  if (!id) return undefined
  if (id === '0') return null
  const lv = Number(attr(openTag(np, 'w:ilvl'), 'w:val') ?? '0')
  return { id, level: Number.isInteger(lv) && lv >= 0 && lv <= 8 ? lv : 0 }
}

interface DocxStyles {
  defRPr: RPrFlags
  defaultParaId?: string
  map: Map<string, ResolvedStyle>
}

function parseDocxStyles(xml: string | null): DocxStyles {
  const map = new Map<string, ResolvedStyle>()
  let defRPr: RPrFlags = {}
  let defaultParaId: string | undefined
  if (!xml) return { defRPr, defaultParaId, map }
  const dd = xmlBlocks(xml, 'w:docDefaults').next().value?.inner ?? ''
  const rDef = xmlBlocks(xmlBlocks(dd, 'w:rPrDefault').next().value?.inner ?? '', 'w:rPr').next().value?.inner ?? ''
  if (rDef) defRPr = readRPrFlags(rDef)
  const raw = new Map<string, ResolvedStyle>()
  for (const st of xmlBlocks(xml, 'w:style')) {
    const tag = st.el.slice(0, st.el.indexOf('>') + 1)
    const id = attr(tag, 'w:styleId')
    if (!id) continue
    if (attr(tag, 'w:type') === 'paragraph' && attr(tag, 'w:default') === '1') defaultParaId = id
    const pPr = xmlBlocks(st.inner, 'w:pPr').next().value?.inner ?? ''
    const rPr = xmlBlocks(st.inner, 'w:rPr').next().value?.inner ?? ''
    const basedOn = attr(openTag(st.inner, 'w:basedOn'), 'w:val')
    raw.set(id, { rPr: readRPrFlags(rPr), numPr: readNumPr(pPr), basedOn })
  }
  for (const id of raw.keys()) {
    const chain: ResolvedStyle[] = []
    const seen = new Set<string>()
    let cur: string | undefined = id
    while (cur && !seen.has(cur) && raw.has(cur)) {
      seen.add(cur)
      const s: ResolvedStyle = raw.get(cur)!
      chain.unshift(s)
      cur = s.basedOn
    }
    let rPr: RPrFlags = {}
    let numPr: NumRef | null | undefined
    for (const s of chain) {
      rPr = mergeRPrFlags(rPr, s.rPr)
      if (s.numPr !== undefined) numPr = s.numPr
    }
    map.set(id, { rPr, numPr })
  }
  return { defRPr, defaultParaId, map }
}

interface NumLevel {
  fmt: string
  text: string
  start: number
}

function parseDocxNumbering(xml: string | null): Map<string, NumLevel> {
  const out = new Map<string, NumLevel>()
  if (!xml) return out
  const abs = new Map<string, Map<number, NumLevel>>()
  for (const a of xmlBlocks(xml, 'w:abstractNum')) {
    const id = attr(a.el.slice(0, a.el.indexOf('>') + 1), 'w:abstractNumId') ?? ''
    const lv = new Map<number, NumLevel>()
    for (const l of xmlBlocks(a.inner, 'w:lvl')) {
      const ilvl = Number(attr(l.el.slice(0, l.el.indexOf('>') + 1), 'w:ilvl') ?? '0')
      const fmt = attr(openTag(l.inner, 'w:numFmt'), 'w:val') ?? ''
      const text = attr(openTag(l.inner, 'w:lvlText'), 'w:val') ?? ''
      const start = Number(attr(openTag(l.inner, 'w:start'), 'w:val') ?? '1')
      lv.set(ilvl, { fmt, text, start: Number.isFinite(start) ? start : 1 })
    }
    abs.set(id, lv)
  }
  for (const nm of xmlBlocks(xml, 'w:num')) {
    const numId = attr(nm.el.slice(0, nm.el.indexOf('>') + 1), 'w:numId') ?? ''
    const absId = attr(openTag(nm.inner, 'w:abstractNumId'), 'w:val') ?? ''
    const base = abs.get(absId)
    if (!base) continue
    const merged = new Map(base)
    for (const ov of xmlBlocks(nm.inner, 'w:lvlOverride')) {
      const ilvl = Number(attr(ov.el.slice(0, ov.el.indexOf('>') + 1), 'w:ilvl') ?? '0')
      const cur = merged.get(ilvl) ?? { fmt: 'decimal', text: '%1.', start: 1 }
      const so = attr(openTag(ov.inner, 'w:startOverride'), 'w:val')
      if (so && Number.isFinite(Number(so))) merged.set(ilvl, { ...cur, start: Number(so) })
    }
    merged.forEach((fmt, i) => out.set(`${numId}:${i}`, fmt))
  }
  return out
}

const romanNum = (n: number) => {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n)
  const t: Array<[number, string]> = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]
  let o = ''
  for (const [v, c] of t) while (n >= v) { o += c; n -= v }
  return o
}
const alphaNum = (n: number) => String.fromCharCode(96 + (((n - 1) % 26) + 1))

function nextNumberLabel(numFmt: Map<string, NumLevel>, counters: Map<string, number[]>, id: string, level: number): string {
  const lv = (i: number) => numFmt.get(`${id}:${i}`)
  const me = lv(level)
  if (!me || me.fmt === 'bullet' || me.fmt === 'none') return ''
  const c = counters.get(id) ?? []
  for (let i = 0; i <= level; i++) if (c[i] == null) c[i] = (lv(i)?.start ?? 1) - (i === level ? 1 : 0)
  c[level] += 1
  c.length = level + 1
  counters.set(id, c)
  return me.text.replace(/%(\d)/g, (_, k: string) => {
    const i = Number(k) - 1
    const n = c[i] ?? 1
    const f = lv(i)?.fmt ?? 'decimal'
    return f === 'lowerLetter' ? alphaNum(n) : f === 'upperLetter' ? alphaNum(n).toUpperCase() : f === 'lowerRoman' ? romanNum(n) : f === 'upperRoman' ? romanNum(n).toUpperCase() : String(n)
  })
}

const SUP_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
}
const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
}

function formatScript(rawXmlText: string, kind: 'superscript' | 'subscript'): string {
  const plain = decodeXml(rawXmlText)
  if (!plain.trim()) return rawXmlText
  const map = kind === 'superscript' ? SUP_MAP : SUB_MAP
  const chars = Array.from(plain)
  if (chars.every((c) => c === ' ' || c in map)) {
    return encodeXml(chars.map((c) => map[c] ?? c).join(''))
  }
  return encodeXml(`${kind === 'superscript' ? '^' : '_'}{${plain}}`)
}

function convertOmmlToRuns(xmlIn: string): string {
  // Đọc thuộc tính nhấn mạnh bên trong m:oMath (nếu có) để giữ khi chuyển thành run
  const runWrap = (ommlEl: string) => {
    const tex = ommlXmlToLatex(ommlEl)
    if (!tex) return ''
    const firstRPr = xmlBlocks(ommlEl, 'w:rPr').next().value?.el ?? xmlBlocks(ommlEl, 'm:rPr').next().value?.el ?? ''
    const rPrXml = firstRPr.startsWith('<w:rPr') ? firstRPr : ''
    return `<w:r>${rPrXml}<w:t xml:space="preserve">$${encodeXml(tex)}$</w:t></w:r>`
  }
  let xml = mapOuterXmlBlocks(xmlIn, 'm:oMathPara', (paraEl) => {
    const runs: string[] = []
    for (const m of outerXmlBlocks(paraEl, 'm:oMath')) {
      const r = runWrap(m.el)
      if (r) runs.push(r)
    }
    return runs.join('<w:r><w:t xml:space="preserve"> </w:t></w:r>')
  })
  xml = mapOuterXmlBlocks(xml, 'm:oMath', (el) => runWrap(el))
  return xml
}

function processDocxParagraphs(
  xmlIn: string,
  styles: DocxStyles,
  numFmt: Map<string, NumLevel>,
  counters: Map<string, number[]>,
  withMarks: boolean,
): string {
  const processRunsChunk = (chunk: string, pBase: RPrFlags): string =>
    mapXmlBlocks(chunk, 'w:r', (run) => {
      const rPr = xmlBlocks(run, 'w:rPr').next().value?.inner ?? ''
      const rStyleId = attr(openTag(rPr, 'w:rStyle'), 'w:val')
      const rStyle = rStyleId ? styles.map.get(rStyleId)?.rPr : undefined
      const merged = mergeRPrFlags(pBase, rStyle, readRPrFlags(rPr))
      const mask = withMarks ? flagsMask(merged) : 0
      const va = merged.vertAlign === 'superscript' || merged.vertAlign === 'subscript' ? merged.vertAlign : null
      if (!mask && !va) return run
      return mapXmlBlocks(run, 'w:t', (t, inner) => {
        if (inner.includes('<')) return t
        const valText = va ? formatScript(inner, va) : inner
        const prefix = t.slice(0, t.length - inner.length - 6)
        if (!mask || !/\S/.test(inner)) return `${prefix}${valText}</w:t>`
        return `${prefix}${emphOpen(mask)}${valText}${EMPH_OFF}</w:t>`
      })
    })

  return mapOuterXmlBlocks(xmlIn, 'w:p', (pEl) => {
    const gt = pEl.indexOf('>')
    const head = pEl.slice(0, gt + 1)
    const inner = pEl.slice(gt + 1, pEl.length - 6)
    const pPrBlock = xmlBlocks(inner, 'w:pPr').next().value
    const pPr = pPrBlock?.inner ?? ''
    const pStyleId = attr(openTag(pPr, 'w:pStyle'), 'w:val') ?? styles.defaultParaId
    const pStyle = pStyleId ? styles.map.get(pStyleId) : undefined
    const pBase = mergeRPrFlags(styles.defRPr, pStyle?.rPr)
    const numRef = readNumPr(pPr) !== undefined ? readNumPr(pPr) : pStyle?.numPr

    // Xử lý phần chạy chữ ngoài <w:txbxContent>, và đệ quy riêng bên trong từng <w:txbxContent>
    let bodyOut = ''
    let last = 0
    for (const tb of outerXmlBlocks(inner, 'w:txbxContent')) {
      bodyOut += processRunsChunk(inner.slice(last, tb.start), pBase)
      const tbGt = tb.el.indexOf('>')
      bodyOut += tb.el.slice(0, tbGt + 1) + processDocxParagraphs(tb.inner, styles, numFmt, counters, withMarks) + '</w:txbxContent>'
      last = tb.end
    }
    bodyOut += processRunsChunk(inner.slice(last), pBase)

    // Chỉ đánh số khi đoạn có chữ hoặc hình (ngoài text box)
    let prefixRun = ''
    if (numRef && numFmt.size) {
      const outsideTxbx = mapOuterXmlBlocks(bodyOut, 'w:txbxContent', () => '')
      const hasText = [...xmlBlocks(outsideTxbx, 'w:t')].some((t) => /\S/.test(t.inner))
      const hasMedia = /<w:(?:drawing|pict|object)\b/.test(outsideTxbx)
      if (hasText || hasMedia) {
        const label = nextNumberLabel(numFmt, counters, numRef.id, numRef.level)
        if (label) {
          const m = withMarks ? flagsMask(pBase) : 0
          const txt = m ? `${emphOpen(m)}${encodeXml(label)} ${EMPH_OFF}` : `${encodeXml(label)} `
          prefixRun = `<w:r><w:t xml:space="preserve">${txt}</w:t></w:r>`
        }
      }
    }
    if (prefixRun) {
      if (pPrBlock) {
        const pPrEnd = bodyOut.indexOf('</w:pPr>')
        if (pPrEnd >= 0) {
          const at = pPrEnd + 8
          bodyOut = bodyOut.slice(0, at) + prefixRun + bodyOut.slice(at)
        } else bodyOut = prefixRun + bodyOut
      } else {
        bodyOut = prefixRun + bodyOut
      }
    }
    return `${head}${bodyOut}</w:p>`
  })
}

function encodeCompactTables(xmlIn: string): string {
  return mapOuterXmlBlocks(xmlIn, 'w:tbl', (tblEl, tblInner) => {
    if (/<w:tbl[\s>/]/.test(tblInner)) return tblEl
    const trs = [...outerXmlBlocks(tblInner, 'w:tr')]
    if (!trs.length) return tblEl
    // Nếu bảng dùng để dàn trang chứa "Câu N." cạnh hình ảnh hoặc ô quá dài thì giữ nguyên từng đoạn
    const rowData = trs.map((tr) => [...outerXmlBlocks(tr.inner, 'w:tc')])
    const isLayoutQuestionTable = rowData.some((cells) => {
      if (cells.length < 2) return false
      const cellTexts = cells.map((c) => [...xmlBlocks(c.inner, 'w:t')].map((t) => t.inner).join(''))
      const hasQ = cellTexts.some((txt) => /^\s*(?:Câu|Bài|Question)\s*\d+/i.test(txt.replace(/[\uE000-\uE04F]/g, '')))
      const hasImgOrLong = cellTexts.some((txt) => txt.includes(IMG_ON) || txt.length > 80)
      return hasQ && hasImgOrLong
    })
    if (isLayoutQuestionTable) return tblEl

    const compactRows: string[] = []
    for (const cells of rowData) {
      if (cells.length < 2) return tblEl
      const cellContents: string[] = []
      let hasAnyContent = false
      for (const tc of cells) {
        const ps = [...outerXmlBlocks(tc.inner, 'w:p')]
        if (ps.length > 3) return tblEl
        const parts: string[] = []
        for (const p of ps) {
          const cleanP = mapXmlBlocks(p.inner, 'w:pPr', () => '')
          const txt = [...xmlBlocks(cleanP, 'w:t')].map((t) => t.inner).join('')
          if (/\S/.test(txt) || txt.includes(IMG_ON)) hasAnyContent = true
          if (cleanP.trim()) parts.push(cleanP)
        }
        cellContents.push(parts.join('<w:r><w:t xml:space="preserve"> </w:t></w:r>'))
      }
      if (!hasAnyContent) continue // bỏ hàng ô trống (vd 4 ô trả lời ngắn)
      compactRows.push(`<w:p><w:r><w:t>${ROW_MARK}</w:t></w:r>${cellContents.join(`<w:r><w:t>${CELL_SEP}</w:t></w:r>`)}</w:p>`)
    }
    return compactRows.join('')
  })
}

const IMG_ON = ''
const IMG_OFF = ''
const MAX_RAW_IMAGES = 1500 // ảnh nhúng đọc vào (trước khi ghép các mảnh)
const MAX_IMAGES = 600 // ảnh trả về (sau khi ghép)
const MAX_IMAGE_BYTES = 600 * 1024
const MAX_RASTER_SIDE = 8192
const MAX_RASTER_PIXELS = 12_000_000
const DOCX_RASTER_PIXEL_BUDGET = 32_000_000
const MAX_STITCH_PARTS = 128
const MAX_RAW_BYTES = 40 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 12 * 1024 * 1024
const MIN_IMAGE_EMU = 24 * 9525 // ảnh có cạnh lớn nhất dưới ~24px là icon trang trí
const MIN_LINE_EMU = 4 * 9525 // cạnh nhỏ dưới ~4px là đường kẻ
const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml',
}

/** Chỉ cho canvas giải mã raster có kích thước đã được kiểm tra từ header. */
function rasterPixels(buf: Buffer): number {
  try {
    const { type, width, height } = imageSize(buf)
    const pixels = width * height
    if (type && ['png', 'jpg', 'gif', 'webp', 'bmp'].includes(type) &&
        width > 0 && height > 0 && width <= MAX_RASTER_SIDE && height <= MAX_RASTER_SIDE &&
        pixels <= MAX_RASTER_PIXELS) return pixels
  } catch { /* header hỏng hoặc định dạng không hỗ trợ */ }
  return 0
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
  const byTarget = new Map<string, number | null>()
  let total = 0
  let unsupported = 0
  let tooBig = 0
  let overLimit = 0
  let shrinkPixels = 0
  const resolve = async (rid: string): Promise<number | null> => {
    const target = rels.get(rid)
    if (!target) return null
    const previous = byTarget.get(target)
    if (previous !== undefined) return previous
    byTarget.set(target, null)
    if (images.length >= MAX_RAW_IMAGES || total >= MAX_RAW_BYTES) { overLimit++; return null }
    const ext = target.split('.').pop()?.toLowerCase() ?? ''
    const path = target.startsWith('/') ? target.slice(1) : `word/${target}`
    const file = zip.file(path)
    if (!MIME[ext] || !file) { unsupported++; return null }
    let data = await file.async('nodebuffer')
    let mime = MIME[ext]
    if (data.length > MAX_IMAGE_BYTES) {
      const pixels = ext === 'svg' ? 0 : rasterPixels(data)
      if (!pixels || shrinkPixels + pixels > DOCX_RASTER_PIXEL_BUDGET) { tooBig++; return null }
      shrinkPixels += pixels
      const small = await shrinkImage(data)
      if (!small) { tooBig++; return null }
      data = small
      mime = 'image/jpeg'
    }
    if (total + data.length > MAX_RAW_BYTES) { overLimit++; return null }
    total += data.length
    images.push(`data:${mime};base64,${data.toString('base64')}`)
    byTarget.set(target, images.length - 1)
    return images.length - 1
  }
  const parts: string[] = []
  let last = 0
  const found = [...xmlBlocks(xml, 'w:drawing'), ...xmlBlocks(xml, 'w:pict'), ...xmlBlocks(xml, 'w:object')].sort((a, b) => a.start - b.start)
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

/** Tiền xử lý .docx: đổi OMML sang LaTeX, đọc styles + numbering + chỉ số; khi `marks` bật thêm bitmask nhấn mạnh, token ảnh và cấu trúc bảng. */
async function prepareDocx(data: Buffer, marks: boolean): Promise<{ data: Buffer; images: string[]; warning?: string }> {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  const file = zip.file('word/document.xml')
  if (!file) return { data, images: [] }
  const docXml = convertOmmlToRuns(await file.async('string'))
  const styles = parseDocxStyles((await zip.file('word/styles.xml')?.async('string')) ?? null)
  const numbering = parseDocxNumbering((await zip.file('word/numbering.xml')?.async('string')) ?? null)
  const counters = new Map<string, number[]>()
  const processed = processDocxParagraphs(docXml, styles, numbering, counters, marks)
  if (!marks) {
    zip.file('word/document.xml', processed)
    return { data: await zip.generateAsync({ type: 'nodebuffer' }), images: [] }
  }
  const { xml, images, warning } = await tokenizeImages(zip, processed)
  zip.file('word/document.xml', encodeCompactTables(xml))
  return { data: await zip.generateAsync({ type: 'nodebuffer' }), images, warning }
}

/**
 * Trình đọc XML của mammoth chậm theo bình phương khi tệp có rất nhiều thẻ mở không đóng
 * (1 KB → hàng chục giây). Quét tuyến tính độ lồng thẻ của mọi phần XML trước khi đưa cho mammoth.
 */
const MAX_XML_DEPTH = 200
// số thẻ: tệp nén vài KB nhân lên hàng chục nghìn đoạn làm parser ăn hàng trăm MB; tài liệu thật xa mức này
const MAX_XML_TAGS_PART = 400_000
const MAX_XML_TAGS_TOTAL = 800_000
async function assertSaneDocxXml(data: Buffer) {
  const mod = await import('jszip')
  const zip = await mod.default.loadAsync(data)
  let tags = 0
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue
    const xml = await zip.files[name].async('string')
    let depth = 0
    let partTags = 0
    for (let i = xml.indexOf('<'); i >= 0; i = xml.indexOf('<', i + 1)) {
      const c = xml[i + 1]
      if (c === '?' || c === '!') continue
      if (++partTags > MAX_XML_TAGS_PART || ++tags > MAX_XML_TAGS_TOTAL) throw new Error('Tệp có cấu trúc bất thường, không đọc được.')
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
  const prep = await prepareDocx(data, marks)
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
  const token = new RegExp(`${IMG_ON}(\\d+)${IMG_OFF}`, 'g')
  const out = [...images]
  const loaded = new Map<number, Awaited<ReturnType<typeof loadImage>>>()
  let decodePixels = 0
  let stitchedPixels = 0
  let stitchedBytes = 0
  const load = async (i: number) => {
    const cached = loaded.get(i)
    if (cached) return cached
    const src = images[i]
    if (!src) throw new Error('Thiếu ảnh gốc.')
    const buf = Buffer.from(src.slice(src.indexOf(',') + 1), 'base64')
    const pixels = rasterPixels(buf)
    if (!pixels || decodePixels + pixels > DOCX_RASTER_PIXEL_BUDGET) throw new Error('Ảnh ghép quá lớn.')
    decodePixels += pixels
    const img = await loadImage(buf)
    loaded.set(i, img)
    return img
  }
  const cache = new Map<string, string>()
  const pieces: Array<{ before: string; idx: number }> = []
  let result = ''
  let last = 0
  for (const m of text.matchAll(run)) {
    result += text.slice(last, m.index)
    last = m.index! + m[0].length
    pieces.length = 0
    let offset = 0
    for (const part of m[0].matchAll(token)) {
      pieces.push({ before: m[0].slice(offset, part.index), idx: Number(part[1]) })
      if (pieces.length > MAX_STITCH_PARTS) break
      offset = part.index + part[0].length
    }
    if (pieces.length > MAX_STITCH_PARTS) { result += m[0]; continue }
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
        if (W > MAX_RASTER_SIDE || H > MAX_RASTER_SIDE || W * H > MAX_RASTER_PIXELS ||
            stitchedPixels + W * H > DOCX_RASTER_PIXEL_BUDGET) throw new Error('Ảnh ghép quá lớn.')
        stitchedPixels += W * H
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
        if (buf.length > MAX_IMAGE_BYTES || stitchedBytes + buf.length > MAX_TOTAL_IMAGE_BYTES) throw new Error('Ảnh ghép quá lớn.')
        stitchedBytes += buf.length
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

const PDF_MAX_PAGES = 1500
const PDF_MIN_BYTES_PER_PAGE = 60

const PDF_MAX_XREF_ENTRIES = 500_000

/** Đọc phần khai báo xref trên byte gốc, trước khi PDF.js có thể cấp phát cho từng mục. */
function assertSafePdfXref(data: Buffer) {
  const raw = data.toString('latin1')
  const header = /(?<![^\x00\t\n\f\r <>()[\]{}/%])(?:obj|trailer)(?:[\x00\t\n\f\r ]|%[^\r\n]*)*<</g
  const token = /[\x00\t\n\f\r ]+|%[^\r\n]*|<<|>>|\/[^\x00\t\n\f\r <>()[\]{}/%]*|\\[\s\S]|[<>()[\]{}/]|[^\x00\t\n\f\r <>()[\]{}/%\\]+|\\/y
  const space = /^[\x00\t\n\f\r %]/
  let cursor = 0
  const read = (): string | undefined => {
    token.lastIndex = cursor
    for (let t; (t = token.exec(raw));) {
      cursor = token.lastIndex
      if (space.test(t[0])) continue
      if (t[0] !== '(') return t[0]
      // Chuỗi PDF có thể lồng ngoặc, escape ngoặc và chứa ký tự giống tên khoá.
      let depth = 1
      for (; cursor < raw.length && depth; cursor++) {
        if (raw[cursor] === '\\') cursor++
        else if (raw[cursor] === '(') depth++
        else if (raw[cursor] === ')') depth--
      }
      return '('
    }
  }
  const name = (s: string) => s.replace(/#([\da-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
  const integer = (s?: string) => s && /^[+-]?\d+(?:\.0*)?$/.test(s) ? Number(s) : NaN
  const indirect = /(?:[\x00\t\n\f\r ]|%[^\r\n]*)+\d+(?:[\x00\t\n\f\r ]|%[^\r\n]*)+R(?=$|[\x00\t\n\f\r <>()[\]{}/%])/y
  // Giới hạn cả công quét lại nếu byte trong stream trông giống nhiều đầu từ điển lồng nhau.
  let scanBudget = raw.length * 4
  for (let start; (start = header.exec(raw));) {
    cursor = header.lastIndex
    let size = 0
    let index = 0
    let isXref = start[0].startsWith('trailer')
    let hasWidths = false
    for (let key; (key = read())?.startsWith('/');) {
      key = name(key)
      const value = read()
      if (key === '/Type' && value && name(value) === '/XRef') isXref = true
      if (key === '/W') hasWidths = true
      const n = integer(value)
      indirect.lastIndex = cursor
      const isRef = !Number.isNaN(n) && indirect.test(raw)
      if (isRef) cursor = indirect.lastIndex
      if (key === '/Size') size = Math.max(size, isRef ? Infinity : n)
      if (key === '/Index' && value !== '[') index = Infinity
      if (value === '<' || value === '[' || value === '<<') {
        const countIndex = key === '/Index' && value === '['
        let count = 0
        let items = 0
        let depth = 1
        for (let t; depth && (t = read());) {
          if (t === '[' || t === '<<' || t === '<') depth++
          else if (t === ']' || t === '>>' || t === '>') depth--
          else if (countIndex && depth === 1) {
            const n = integer(t)
            if (!Number.isSafeInteger(n) || n < 0) count = Infinity
            else if (items % 2 === 1) count += n
            items++
          }
        }
        if (countIndex) index = Math.max(index, items % 2 || depth ? Infinity : count)
      }
    }
    isXref ||= hasWidths && read() === 'stream'
    scanBudget -= cursor - header.lastIndex
    if (scanBudget < 0 || (isXref && (!Number.isSafeInteger(size) || size > PDF_MAX_XREF_ENTRIES || index > PDF_MAX_XREF_ENTRIES))) {
      throw new Error('Tệp PDF có bảng tham chiếu bất thường, không đọc được.')
    }
  }
}

async function extractPdf(data: Buffer, marks = false): Promise<string> {
  assertSafePdfXref(data)
  // Vercel đóng gói hàm nên pdf.js không tự tìm thấy pdf.worker.mjs; nạp sẵn để nó dùng luôn
  const g = globalThis as { pdfjsWorker?: unknown }
  // @ts-expect-error pdf.js không kèm kiểu cho file worker
  if (!g.pdfjsWorker) g.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs')
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const task = pdfjs.getDocument({ data: new Uint8Array(data), ...(marks ? { fontExtraProperties: true } : {}) })
  const doc = await task.promise
  const pages: string[] = []
  try {
    // trang thật tốn ít nhất vài trăm byte; cây trang lặp một trang (~6 byte/trang) là tấn công cạn bộ nhớ
    if (doc.numPages > PDF_MAX_PAGES || doc.numPages * PDF_MIN_BYTES_PER_PAGE > data.length) throw new Error('Tệp PDF có số trang bất thường, không đọc được.')
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
// trần theo tài liệu thật (tệp gửi lên ≤ 12 MB): document.xml của đề dày vài trăm trang cỡ vài MB,
// ảnh nhúng gần như không nén thêm. Trần cũ (50 / 100 MB) để tệp hợp lệ gần trần tốn ~500 MB RAM.
const ZIP_MAX_ENTRIES = 3000
const ZIP_MAX_ENTRY = 24 * 1024 * 1024
const ZIP_MAX_TOTAL = 48 * 1024 * 1024
export function assertSafeZip(buf: Buffer) {
  // tìm End Of Central Directory (0x06054b50) trong 64 KB cuối
  let eocd = -1
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('Tệp hỏng hoặc không đúng định dạng.')
  const bad = () => new Error('Tệp hỏng hoặc không đúng định dạng.')
  const declared = buf.readUInt16LE(eocd + 10)
  const cdSize = buf.readUInt32LE(eocd + 12)
  let off = buf.readUInt32LE(eocd + 16)
  if (declared === 0xffff || cdSize === 0xffffffff || off === 0xffffffff) throw new Error('Tệp quá lớn hoặc không hỗ trợ (zip64).')
  // Phải duyệt ĐÚNG danh sách mà JSZip sẽ đọc, nếu không mọi trần bên dưới chỉ áp cho một phần tệp:
  // - JSZip đi theo chữ ký bản ghi tới khi hết, không theo số khai trong EOCD → đếm theo chữ ký, rồi bắt khớp số khai;
  // - JSZip dời mọi offset khi central directory không kết thúc ngay trước EOCD (coi là có dữ liệu chèn đầu tệp)
  //   → bắt central directory nằm sát EOCD, không chèn, không thừa byte.
  if (buf.readUInt16LE(eocd + 4) !== 0 || buf.readUInt16LE(eocd + 6) !== 0 || buf.readUInt16LE(eocd + 8) !== declared) throw bad()
  if (off + cdSize !== eocd || eocd + 22 + buf.readUInt16LE(eocd + 20) !== buf.length) throw bad()
  let total = 0
  let count = 0
  for (; off < eocd; count++) {
    if (count >= ZIP_MAX_ENTRIES) throw new Error('Tệp có quá nhiều thành phần.')
    if (off + 46 > eocd || buf.readUInt32LE(off) !== 0x02014b50) throw bad()
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
  // bản ghi cuối phải kết thúc đúng tại EOCD, và số bản ghi thật phải bằng số khai
  if (off !== eocd || count !== declared) throw bad()
}

/** Đọc tệp ngay trong tiến trình này (không giới hạn bộ nhớ). Worker và test dùng; chỗ khác dùng `extractFile`. */
export async function extractFileDirect(name: string, data: Buffer, marks = false): Promise<ExtractedFile> {
  const ext = extname(name).toLowerCase()
  try {
    if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx') assertSafeZip(data)
    if (ext === '.xlsx' || ext === '.pptx') await assertSaneDocxXml(data)
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

/** trần của worker; test hạ xuống để thử đường quá tải */
export const extractLimits = { heapMb: 384, timeoutMs: 25_000 }
const NEEDS_WORKER = new Set(['.docx', '.xlsx', '.pptx', '.pdf'])

/**
 * Tệp nhị phân (pdf/docx/xlsx/pptx) được đọc trong worker có trần bộ nhớ và thời gian: tệp độc hại làm parser
 * phình RAM hay chạy mãi chỉ giết worker, hàm vẫn trả lỗi gọn. Worker không khởi động được (môi trường lạ) thì đọc ngay trong tiến trình.
 */
export async function extractFile(name: string, data: Buffer, marks = false): Promise<ExtractedFile> {
  if (!NEEDS_WORKER.has(extname(name).toLowerCase())) return extractFileDirect(name, data, marks)
  const fail = (message: string): ExtractedFile => ({ name, kind: 'unsupported', text: '', warning: `Không đọc được tệp: ${message}` })
  const url = import.meta.url
  const code = "const { workerData, parentPort } = require('node:worker_threads');" +
    "const load = workerData.url.endsWith('.ts') ? require('tsx/esm/api').tsImport(workerData.url, workerData.url) : import(workerData.url);" +
    "load.then(async (m) => { parentPort.postMessage({ ok: await m.extractFileDirect(workerData.name, Buffer.from(workerData.data), workerData.marks) }) }," +
    " (e) => parentPort.postMessage({ boot: String(e && e.message || e) }))"
  const { Worker } = await import('node:worker_threads')
  type Out = { ok?: ExtractedFile; boot?: string; error?: string }
  const out = await new Promise<Out>((resolve) => {
    let worker: InstanceType<typeof Worker>
    try {
      worker = new Worker(code, {
        eval: true,
        workerData: { url, name, data: new Uint8Array(data), marks },
        resourceLimits: { maxOldGenerationSizeMb: extractLimits.heapMb, maxYoungGenerationSizeMb: 48 },
        execArgv: [],
      })
    } catch (err) {
      return resolve({ boot: String(err) })
    }
    const timer = setTimeout(() => { resolve({ error: 'tệp quá nặng hoặc có cấu trúc bất thường.' }); void worker.terminate() }, extractLimits.timeoutMs)
    const done = (o: Out) => { clearTimeout(timer); resolve(o); void worker.terminate() }
    worker.once('message', (m: Out) => done(m))
    worker.once('error', (err: Error & { code?: string }) => done(err.code === 'ERR_WORKER_OUT_OF_MEMORY' ? { error: 'tệp quá nặng, không đọc được.' } : err.code === 'ERR_WORKER_INIT_FAILED' ? { boot: String(err.message) } : { error: 'tiến trình đọc tệp gặp lỗi.' }))
    worker.once('exit', (code) => done({ error: code ? 'tiến trình đọc tệp bị dừng.' : 'không nhận được kết quả.' }))
  })
  if (out.ok) return out.ok
  if (out.boot !== undefined) {
    console.warn('extract: worker không chạy, đọc trong tiến trình:', out.boot.slice(0, 300))
    return extractFileDirect(name, data, marks)
  }
  return fail(out.error ?? 'lỗi không rõ.')
}

export async function handleExtractRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!(await guard(req, res, 'extract'))) return
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  // ảnh trang PDF scan → chữ bằng AI nhìn ảnh (tốn điểm); nạp muộn để tránh vòng import với llmProxy
  if (new URL(req.url ?? '/', 'http://x').searchParams.has('vision')) return (await import('./sourceVision.js')).handleSourceVision(req, res)

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
    return json(res, 400, { error: safeError(err, isLocal(clientIp(req)), 'Dữ liệu không hợp lệ.') })
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
    json(res, 500, { error: safeError(err, isLocal(clientIp(req))) })
  })
}
