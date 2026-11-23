/**
 * Nhập .pptx giữ bố cục: đọc thẳng XML trong trình duyệt (jszip + DOMParser) → Slide/SlideElement.
 * Giữ: vị trí/cỡ/xoay/lật, hình khối (prst) + màu tô/viền, chữ (cỡ, đậm, nghiêng, gạch chân, màu, phông,
 * căn lề, căn giữa dọc), ảnh (kèm vùng cắt), bảng, nhóm, đường nối, nền slide (màu, chuyển màu, ảnh),
 * hình trang trí của layout/master. Placeholder thiếu vị trí/cỡ chữ thì kế thừa từ layout → master.
 * Không giữ: hiệu ứng, SmartArt, biểu đồ, chữ nhiều kiểu trong cùng hộp (lấy kiểu của lượt chữ đầu, giữ đậm).
 */
import JSZip from 'jszip'
import { uid } from '@/data/docTypes'
import type { Slide, SlideElement } from '@/store/docs'
import { imageToSrc } from './questionImage'
import { prepareBgImage } from './slideBackground'

const MAX_SLIDES = 150

type El = Element
const kids = (el: El | null | undefined, name: string): El[] =>
  el ? Array.from(el.children).filter((c) => c.localName === name) : []
const kid = (el: El | null | undefined, name: string): El | null => kids(el, name)[0] ?? null
const path = (el: El | null | undefined, ...names: string[]): El | null => {
  let cur: El | null = el ?? null
  for (const n of names) cur = kid(cur, n)
  return cur
}
const deep = (el: El | null | undefined, name: string): El[] => (el ? Array.from(el.getElementsByTagNameNS('*', name)) : [])
const num = (v: string | null | undefined, d = 0): number => (v == null || v === '' ? d : Number(v) || d)
const rid = (el: El | null | undefined, name: string): string | null =>
  el?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', name) ?? null

interface Part {
  doc: Document
  rels: Map<string, string>
  dir: string
}
interface Theme {
  colors: Record<string, string>
  major: string
  minor: string
}
interface Box {
  x: number
  y: number
  w: number
  h: number
  rot: number
  flipH: boolean
  flipV: boolean
}
/** biến đổi toạ độ con của nhóm → toạ độ slide (EMU) */
type Tf = (b: Box) => Box

const ident: Tf = (b) => b

function resolvePath(dir: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = (dir ? dir.split('/') : []).concat(target.split('/'))
  const out: string[] = []
  for (const p of parts) {
    if (p === '..') out.pop()
    else if (p && p !== '.') out.push(p)
  }
  return out.join('/')
}

async function loadPart(zip: JSZip, file: string): Promise<Part | null> {
  const xml = await zip.file(file)?.async('string')
  if (!xml) return null
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const dir = file.split('/').slice(0, -1).join('/')
  const relsFile = `${dir}/_rels/${file.split('/').pop()}.rels`
  const rels = new Map<string, string>()
  const relXml = await zip.file(relsFile)?.async('string')
  if (relXml) {
    const rdoc = new DOMParser().parseFromString(relXml, 'application/xml')
    for (const r of deep(rdoc.documentElement, 'Relationship')) {
      if (r.getAttribute('TargetMode') === 'External') continue
      rels.set(r.getAttribute('Id') ?? '', resolvePath(dir, r.getAttribute('Target') ?? ''))
    }
  }
  return { doc, rels, dir }
}

const relOfType = (part: Part, suffix: string): string | null => {
  // rels không giữ kiểu: đoán theo đường dẫn đích
  for (const t of part.rels.values()) if (t.includes(suffix)) return t
  return null
}

/* ------------------------------ màu ------------------------------ */

const SCHEME_ALIAS: Record<string, string> = { tx1: 'dk1', bg1: 'lt1', tx2: 'dk2', bg2: 'lt2' }

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}
function hslToHex(h: number, s: number, l: number): string {
  const f = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r = l, g = l, b = l
  if (s) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3)
  }
  return `#${[r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('')}`
}

/** a:solidFill / a:fgClr … → '#rrggbb' (+ alpha 0–1) */
function colorOf(holder: El | null, theme: Theme): { hex: string; alpha: number } | null {
  if (!holder) return null
  const c = Array.from(holder.children).find((k) => ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'scrgbClr'].includes(k.localName))
  if (!c) return null
  let hex: string | null = null
  if (c.localName === 'srgbClr') hex = `#${c.getAttribute('val')}`
  else if (c.localName === 'sysClr') hex = `#${c.getAttribute('lastClr') ?? '000000'}`
  else if (c.localName === 'schemeClr') {
    const v = c.getAttribute('val') ?? ''
    hex = theme.colors[SCHEME_ALIAS[v] ?? v] ?? null
  } else if (c.localName === 'prstClr') {
    const named: Record<string, string> = { black: '#000000', white: '#ffffff', red: '#ff0000', blue: '#0000ff', green: '#008000', yellow: '#ffff00', gray: '#808080' }
    hex = named[c.getAttribute('val') ?? ''] ?? '#000000'
  } else if (c.localName === 'scrgbClr') {
    hex = `#${['r', 'g', 'b'].map((k) => Math.round((num(c.getAttribute(k)) / 100000) * 255).toString(16).padStart(2, '0')).join('')}`
  }
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null
  let [h, s, l] = rgbToHsl(...hexToRgb(hex))
  let alpha = 1
  for (const m of Array.from(c.children)) {
    const v = num(m.getAttribute('val')) / 100000
    if (m.localName === 'lumMod') l *= v
    else if (m.localName === 'lumOff') l += v
    else if (m.localName === 'tint') l = l + (1 - l) * (1 - v)
    else if (m.localName === 'shade') l *= v
    else if (m.localName === 'satMod') s *= v
    else if (m.localName === 'alpha') alpha = v
  }
  return { hex: hslToHex(h, Math.min(1, s), Math.min(1, Math.max(0, l))), alpha }
}

function cssColor(c: { hex: string; alpha: number } | null): string | undefined {
  if (!c) return undefined
  if (c.alpha >= 0.999) return c.hex
  const [r, g, b] = hexToRgb(c.hex)
  return `rgba(${r}, ${g}, ${b}, ${Math.round(c.alpha * 100) / 100})`
}

function gradientOf(grad: El, theme: Theme): string | undefined {
  const stops = kids(kid(grad, 'gsLst'), 'gs')
    .map((gs) => ({ pos: num(gs.getAttribute('pos')) / 1000, c: cssColor(colorOf(gs, theme)) }))
    .filter((s) => s.c)
  if (stops.length < 2) return stops[0]?.c
  const ang = num(kid(grad, 'lin')?.getAttribute('ang'), 5400000) / 60000
  return `linear-gradient(${Math.round(ang + 90)}deg, ${stops.map((s) => `${s.c} ${Math.round(s.pos)}%`).join(', ')})`
}

/* ------------------------------ theme ------------------------------ */

function readTheme(part: Part | null): Theme {
  const t: Theme = { colors: {}, major: '', minor: '' }
  if (!part) return t
  const scheme = deep(part.doc.documentElement, 'clrScheme')[0]
  for (const c of scheme ? Array.from(scheme.children) : []) {
    const v = kid(c, 'srgbClr')?.getAttribute('val') ?? kid(c, 'sysClr')?.getAttribute('lastClr')
    if (v) t.colors[c.localName] = `#${v}`
  }
  t.major = path(deep(part.doc.documentElement, 'majorFont')[0], 'latin')?.getAttribute('typeface') ?? ''
  t.minor = path(deep(part.doc.documentElement, 'minorFont')[0], 'latin')?.getAttribute('typeface') ?? ''
  return t
}

/* ------------------------------ placeholder ------------------------------ */

interface PhKey {
  type: string
  idx: string | null
}
const phOf = (sp: El): PhKey | null => {
  const ph = deep(path(sp, 'nvSpPr', 'nvPr') ?? path(sp, 'nvPicPr', 'nvPr'), 'ph')[0]
  if (!ph) return null
  return { type: ph.getAttribute('type') ?? 'body', idx: ph.getAttribute('idx') }
}
const normType = (t: string) => (t === 'ctrTitle' ? 'title' : t === 'subTitle' ? 'body' : t)

function findPh(part: Part | null, key: PhKey): El | null {
  if (!part) return null
  const sps = deep(part.doc.documentElement, 'sp')
  const withPh = sps.map((s) => ({ s, k: phOf(s) })).filter((x) => x.k)
  if (key.idx != null) {
    const byIdx = withPh.find((x) => x.k!.idx === key.idx)
    if (byIdx) return byIdx.s
  }
  return withPh.find((x) => normType(x.k!.type) === normType(key.type))?.s ?? null
}

/* ------------------------------ ngữ cảnh slide ------------------------------ */

interface Ctx {
  zip: JSZip
  theme: Theme
  W: number
  H: number
  part: Part
  layout: Part | null
  master: Part | null
  out: SlideElement[]
}

const xfrmBox = (sp: El): Box | null => {
  const x = deep(sp, 'xfrm')[0]
  const off = kid(x, 'off')
  const ext = kid(x, 'ext')
  if (!x || !off || !ext) return null
  return {
    x: num(off.getAttribute('x')),
    y: num(off.getAttribute('y')),
    w: num(ext.getAttribute('cx')),
    h: num(ext.getAttribute('cy')),
    rot: num(x.getAttribute('rot')) / 60000,
    flipH: x.getAttribute('flipH') === '1',
    flipV: x.getAttribute('flipV') === '1',
  }
}

function boxOf(ctx: Ctx, sp: El): Box | null {
  const own = xfrmBox(sp)
  if (own) return own
  const key = phOf(sp)
  if (!key) return null
  const l = findPh(ctx.layout, key)
  const fromLayout = l && xfrmBox(l)
  if (fromLayout) return fromLayout
  const m = findPh(ctx.master, key)
  return m ? xfrmBox(m) : null
}

const pct = (ctx: Ctx, b: Box) => ({
  x: (b.x / ctx.W) * 100,
  y: (b.y / ctx.H) * 100,
  w: Math.max(0.5, (b.w / ctx.W) * 100),
  h: Math.max(0.5, (b.h / ctx.H) * 100),
})

function placeBox(ctx: Ctx, b: Box): Pick<SlideElement, 'x' | 'y' | 'w' | 'h' | 'rotation' | 'flipX' | 'flipY'> {
  const p = pct(ctx, b)
  return {
    ...p,
    ...(b.rot ? { rotation: Math.round(b.rot * 10) / 10 } : {}),
    ...(b.flipH ? { flipX: true } : {}),
    ...(b.flipV ? { flipY: true } : {}),
  }
}

/* ------------------------------ chữ ------------------------------ */

const ALIGN: Record<string, SlideElement['align']> = { l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' }

/** cỡ chữ mặc định (phần trăm pt) theo lstStyle của placeholder layout/master hoặc txStyles của master */
function inheritedSize(ctx: Ctx, sp: El, lvl: number): number | null {
  const key = phOf(sp)
  const tag = `lvl${lvl + 1}pPr`
  const fromLst = (s: El | null) => {
    const v = path(s, 'txBody', 'lstStyle', tag, 'defRPr')?.getAttribute('sz')
    return v ? num(v) : null
  }
  if (key) {
    const v = fromLst(findPh(ctx.layout, key)) ?? fromLst(findPh(ctx.master, key))
    if (v) return v
    const styles = deep(ctx.master?.doc.documentElement, 'txStyles')[0]
    const t = normType(key.type)
    const style = kid(styles, t === 'title' ? 'titleStyle' : t === 'body' || t === 'obj' ? 'bodyStyle' : 'otherStyle')
    const s = path(style, tag, 'defRPr')?.getAttribute('sz')
    if (s) return num(s)
    return t === 'title' ? 4400 : 2400
  }
  return null
}

function inheritedAttr(ctx: Ctx, sp: El, attr: 'anchor'): string | null {
  const own = path(sp, 'txBody', 'bodyPr')?.getAttribute(attr)
  if (own) return own
  const key = phOf(sp)
  if (!key) return null
  return (
    path(findPh(ctx.layout, key), 'txBody', 'bodyPr')?.getAttribute(attr) ??
    path(findPh(ctx.master, key), 'txBody', 'bodyPr')?.getAttribute(attr) ??
    null
  )
}

function textOf(ctx: Ctx, sp: El, box: Box): SlideElement | null {
  const body = kid(sp, 'txBody')
  if (!body) return null
  const paras = kids(body, 'p')
  const lines: string[] = []
  let firstR: El | null = null
  let firstP: El | null = null
  let allBold = true
  let anyRun = false
  for (const p of paras) {
    const pPr = kid(p, 'pPr')
    let line = ''
    for (const r of Array.from(p.children)) {
      if (r.localName === 'br') {
        line += '\n'
        continue
      }
      if (r.localName !== 'r' && r.localName !== 'fld') continue
      const t = kid(r, 't')?.textContent ?? ''
      if (!t) continue
      const rPr = kid(r, 'rPr')
      if (!firstR && t.trim()) {
        firstR = r
        firstP = p
      }
      anyRun = true
      const bold = rPr?.getAttribute('b') === '1'
      if (!bold && t.trim()) allBold = false
      line += bold && t.trim() ? `**${t.trim()}**${/\s$/.test(t) ? ' ' : ''}` : t
    }
    const bullet = pPr && kid(pPr, 'buChar') ? `${kid(pPr, 'buChar')!.getAttribute('char') ?? '•'} ` : ''
    lines.push(line.trim() ? bullet + line : line)
  }
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  while (lines.length && !lines[0].trim()) lines.shift()
  if (!anyRun || !lines.length) return null
  let text = lines.join('\n')
  // cả hộp đậm: dùng fontWeight thay vì ** từng đoạn
  if (allBold) text = text.replace(/\*\*([^*\n]+?)\*\*/g, '$1')

  const rPr = kid(firstR, 'rPr')
  const lvl = num(kid(firstP, 'pPr')?.getAttribute('lvl'))
  let sz = num(rPr?.getAttribute('sz')) || inheritedSize(ctx, sp, lvl) || 1800
  const scale = path(body, 'bodyPr', 'normAutofit')?.getAttribute('fontScale')
  if (scale) sz *= num(scale) / 100000
  const fontCqw = ((sz / 100) * 12700 * 100) / ctx.W
  const color = colorOf(kid(rPr, 'solidFill'), ctx.theme)
  let face = kid(rPr, 'latin')?.getAttribute('typeface') ?? ''
  const isTitle = ['title', 'ctrTitle'].includes(phOf(sp)?.type ?? '')
  if (face === '+mj-lt' || (!face && isTitle)) face = ctx.theme.major
  else if (face === '+mn-lt' || !face) face = ctx.theme.minor
  const algn = kid(firstP, 'pPr')?.getAttribute('algn') ?? (isTitle && phOf(sp)?.type === 'ctrTitle' ? 'ctr' : null)
  const anchor = inheritedAttr(ctx, sp, 'anchor')
  const u = rPr?.getAttribute('u')
  const strike = rPr?.getAttribute('strike')
  return {
    id: uid(),
    type: 'text',
    ...placeBox(ctx, box),
    text,
    variant: isTitle ? 'title' : 'body',
    fontSize: Math.round(fontCqw * 100) / 100,
    lineHeight: 1.2,
    fixedHeight: true,
    textColor: cssColor(color) ?? ctx.theme.colors.dk1 ?? '#000000',
    ...(face ? { fontFamily: face } : {}),
    fontWeight: allBold ? 700 : 400,
    ...(rPr?.getAttribute('i') === '1' ? { fontStyle: 'italic' as const } : {}),
    ...(u && u !== 'none' ? { textDecoration: 'underline' as const } : strike && strike !== 'noStrike' ? { textDecoration: 'line-through' as const } : {}),
    ...(algn && ALIGN[algn] ? { align: ALIGN[algn] } : {}),
    ...(anchor === 'ctr' ? { valign: 'middle' as const } : {}),
  }
}

/* ------------------------------ hình ------------------------------ */

function shapeOf(ctx: Ctx, sp: El, box: Box, line = false): SlideElement | null {
  const spPr = kid(sp, 'spPr')
  const prst = path(spPr, 'prstGeom')?.getAttribute('prst') ?? (kid(spPr, 'custGeom') ? 'rect' : null)
  const styleFill = colorOf(path(sp, 'style', 'fillRef'), ctx.theme)
  const styleLine = colorOf(path(sp, 'style', 'lnRef'), ctx.theme)
  let fill: string | undefined
  if (kid(spPr, 'noFill')) fill = undefined
  else if (kid(spPr, 'solidFill')) fill = cssColor(colorOf(kid(spPr, 'solidFill'), ctx.theme))
  else if (kid(spPr, 'gradFill')) fill = gradientOf(kid(spPr, 'gradFill')!, ctx.theme)
  else if (styleFill && num(path(sp, 'style', 'fillRef')?.getAttribute('idx')) > 0) fill = cssColor(styleFill)
  const ln = kid(spPr, 'ln')
  let borderColor: string | undefined
  if (ln && kid(ln, 'noFill')) borderColor = undefined
  else if (ln && kid(ln, 'solidFill')) borderColor = cssColor(colorOf(kid(ln, 'solidFill'), ctx.theme))
  else if (styleLine && num(path(sp, 'style', 'lnRef')?.getAttribute('idx')) > 0) borderColor = cssColor(styleLine)
  const border = borderColor ? Math.max(0.5, Math.round((num(ln?.getAttribute('w'), 12700) / 12700) * 1.333 * 10) / 10) : undefined
  const dash = path(ln, 'prstDash')?.getAttribute('val')
  const isLine = line || prst === 'line' || prst?.startsWith('straightConnector') || prst?.startsWith('bentConnector') || prst?.startsWith('curvedConnector')
  if (!isLine && !fill && !borderColor) return null
  if (!prst && !isLine) return null
  const tail = path(ln, 'tailEnd')?.getAttribute('type')
  const head = path(ln, 'headEnd')?.getAttribute('type')
  return {
    id: uid(),
    type: 'shape',
    ...placeBox(ctx, box),
    shape: isLine ? 'line' : prst === 'rect' ? 'rect' : prst === 'ellipse' ? 'ellipse' : prst === 'roundRect' ? 'round' : prst!,
    ...(isLine ? { lineArrow: (head && head !== 'none' ? 'both' : tail && tail !== 'none' ? 'end' : 'none') as SlideElement['lineArrow'] } : {}),
    fill: isLine ? undefined : fill ?? 'transparent',
    ...(border ? { border: isLine ? Math.max(1, border) : border, borderColor: borderColor ?? '#000000' } : isLine ? { border: 1.5, borderColor: '#000000' } : { border: 0 }),
    ...(dash && dash !== 'solid' ? { borderStyle: (dash.includes('dot') && !dash.includes('ash') ? 'dotted' : 'dashed') as SlideElement['borderStyle'] } : {}),
  }
}

async function mediaSrc(ctx: Ctx, part: Part, embed: string | null): Promise<string | null> {
  if (!embed) return null
  const target = part.rels.get(embed)
  if (!target) return null
  const f = ctx.zip.file(target)
  if (!f) return null
  const ext = (target.split('.').pop() ?? '').toLowerCase()
  const mime: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' }
  if (!mime[ext]) return null // emf/wmf: trình duyệt không vẽ được
  const blob = new Blob([await f.async('arraybuffer')], { type: mime[ext] })
  try {
    return await imageToSrc(blob)
  } catch {
    return null
  }
}

async function picOf(ctx: Ctx, part: Part, pic: El, box: Box): Promise<SlideElement | null> {
  const blip = path(pic, 'blipFill', 'blip')
  const src = await mediaSrc(ctx, part, rid(blip, 'embed'))
  if (!src) return null
  const r = path(pic, 'blipFill', 'srcRect')
  const crop = r
    ? { l: num(r.getAttribute('l')) / 1000, t: num(r.getAttribute('t')) / 1000, r: num(r.getAttribute('r')) / 1000, b: num(r.getAttribute('b')) / 1000 }
    : null
  return {
    id: uid(),
    type: 'image',
    ...placeBox(ctx, box),
    src,
    ...(crop && (crop.l || crop.t || crop.r || crop.b) ? { crop } : {}),
  }
}

function tableOf(ctx: Ctx, frame: El, box: Box): SlideElement | null {
  const tbl = deep(frame, 'tbl')[0]
  if (!tbl) return null
  const cells = kids(tbl, 'tr').map((tr) => kids(tr, 'tc'))
  const rows = cells.map((row) =>
    row.map((tc) =>
      kids(kid(tc, 'txBody'), 'p')
        .map((p) => deep(p, 't').map((t) => t.textContent ?? '').join(''))
        .join('\n')
        .trim(),
    ),
  )
  if (!rows.length) return null
  const cellFills = cells.map((row) => row.map((tc) => {
    const props = kid(tc, 'tcPr')
    if (kid(props, 'noFill')) return 'transparent'
    return cssColor(colorOf(kid(props, 'solidFill'), ctx.theme)) ?? null
  }))
  return { id: uid(), type: 'table', ...placeBox(ctx, box), rows, cellFills }
}

/* ------------------------------ duyệt cây ------------------------------ */

function groupTf(grp: El, parent: Tf): Tf {
  const x = path(grp, 'grpSpPr', 'xfrm')
  const off = kid(x, 'off'), ext = kid(x, 'ext'), chOff = kid(x, 'chOff'), chExt = kid(x, 'chExt')
  if (!off || !ext || !chOff || !chExt) return parent
  const ox = num(off.getAttribute('x')), oy = num(off.getAttribute('y'))
  const sx = num(ext.getAttribute('cx')) / (num(chExt.getAttribute('cx')) || 1)
  const sy = num(ext.getAttribute('cy')) / (num(chExt.getAttribute('cy')) || 1)
  const cx = num(chOff.getAttribute('x')), cy = num(chOff.getAttribute('y'))
  return (b) => parent({ ...b, x: ox + (b.x - cx) * sx, y: oy + (b.y - cy) * sy, w: b.w * sx, h: b.h * sy })
}

async function walk(ctx: Ctx, part: Part, tree: El, tf: Tf, skipPh: boolean): Promise<void> {
  for (const node of Array.from(tree.children)) {
    const name = node.localName
    if (name === 'grpSp') {
      await walk(ctx, part, node, groupTf(node, tf), skipPh)
      continue
    }
    if (name === 'AlternateContent') {
      const fallback = kid(node, 'Fallback') ?? kid(node, 'Choice')
      if (fallback) await walk(ctx, part, fallback, tf, skipPh)
      continue
    }
    if (!['sp', 'pic', 'cxnSp', 'graphicFrame'].includes(name)) continue
    // layout/master: chỉ lấy hình trang trí, bỏ khung placeholder (chữ mẫu "Nhấp để thêm tiêu đề")
    if (skipPh && phOf(node)) continue
    const raw = name === 'graphicFrame' ? frameBox(node) : boxOf(ctx, node)
    if (!raw) continue
    const box = tf(raw)
    if (name === 'pic') {
      const el = await picOf(ctx, part, node, box)
      if (el) ctx.out.push(el)
    } else if (name === 'graphicFrame') {
      const el = tableOf(ctx, node, box)
      if (el) ctx.out.push(el)
    } else if (name === 'cxnSp') {
      const el = shapeOf(ctx, node, box, true)
      if (el) ctx.out.push(el)
    } else {
      const blipFill = path(node, 'spPr', 'blipFill')
      if (blipFill) {
        const src = await mediaSrc(ctx, part, rid(kid(blipFill, 'blip'), 'embed'))
        if (src) ctx.out.push({ id: uid(), type: 'image', ...placeBox(ctx, box), src })
      } else {
        const shape = shapeOf(ctx, node, box)
        if (shape) ctx.out.push(shape)
      }
      const text = textOf(ctx, node, box)
      if (text) ctx.out.push(text)
    }
  }
}

function frameBox(frame: El): Box | null {
  const x = kid(frame, 'xfrm')
  const off = kid(x, 'off'), ext = kid(x, 'ext')
  if (!off || !ext) return null
  return { x: num(off.getAttribute('x')), y: num(off.getAttribute('y')), w: num(ext.getAttribute('cx')), h: num(ext.getAttribute('cy')), rot: 0, flipH: false, flipV: false }
}

/* ------------------------------ nền ------------------------------ */

async function backgroundOf(ctx: Ctx): Promise<{ background: string; bgImage?: string } | null> {
  for (const part of [ctx.part, ctx.layout, ctx.master]) {
    if (!part) continue
    const bg = deep(part.doc.documentElement, 'bg')[0]
    if (!bg) continue
    const bgPr = kid(bg, 'bgPr')
    if (bgPr) {
      if (kid(bgPr, 'solidFill')) return { background: cssColor(colorOf(kid(bgPr, 'solidFill'), ctx.theme)) ?? '#ffffff' }
      if (kid(bgPr, 'gradFill')) return { background: gradientOf(kid(bgPr, 'gradFill')!, ctx.theme) ?? '#ffffff' }
      const blip = path(bgPr, 'blipFill', 'blip')
      const target = blip && part.rels.get(rid(blip, 'embed') ?? '')
      const f = target && ctx.zip.file(target)
      if (f) {
        try {
          const blob = await f.async('blob')
          const { image, color } = await prepareBgImage(new File([blob], 'bg', { type: /\.png$/i.test(target!) ? 'image/png' : 'image/jpeg' }))
          return { background: color, bgImage: image }
        } catch {
          /* ảnh nền hỏng: thử tầng sau */
        }
      }
    }
    const ref = kid(bg, 'bgRef')
    if (ref) {
      const c = cssColor(colorOf(ref, ctx.theme))
      if (c) return { background: c }
    }
  }
  return null
}

/* ------------------------------ vào ------------------------------ */

export async function importPptx(file: File): Promise<{ title: string; slides: Slide[] }> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer())
  } catch {
    throw new Error('Không đọc được tệp .pptx này.')
  }
  const pres = await loadPart(zip, 'ppt/presentation.xml')
  if (!pres) throw new Error('Tệp .pptx thiếu nội dung trình chiếu.')
  const sz = deep(pres.doc.documentElement, 'sldSz')[0]
  const W = num(sz?.getAttribute('cx'), 12192000)
  const H = num(sz?.getAttribute('cy'), 6858000)
  const ids = deep(pres.doc.documentElement, 'sldId').slice(0, MAX_SLIDES)
  const themeCache = new Map<string, Theme>()
  const partCache = new Map<string, Part | null>()
  const cached = async (p: string | null) => {
    if (!p) return null
    if (!partCache.has(p)) partCache.set(p, await loadPart(zip, p))
    return partCache.get(p)!
  }

  const slides: Slide[] = []
  for (const s of ids) {
    const target = pres.rels.get(rid(s, 'id') ?? '')
    const part = target ? await loadPart(zip, target) : null
    if (!part) continue
    const layout = await cached(relOfType(part, 'slideLayouts/'))
    const master = layout ? await cached(relOfType(layout, 'slideMasters/')) : null
    const themePath = master ? relOfType(master, 'theme/') : null
    let theme = themePath ? themeCache.get(themePath) : undefined
    if (!theme) {
      theme = readTheme(await cached(themePath))
      if (themePath) themeCache.set(themePath, theme)
    }
    const ctx: Ctx = { zip, theme, W, H, part, layout, master, out: [] }
    const showMaster = (p: Part | null) => p?.doc.documentElement.getAttribute('showMasterSp') !== '0'
    if (showMaster(part) && showMaster(layout) && master) {
      const tree = deep(master.doc.documentElement, 'spTree')[0]
      if (tree) await walk(ctx, master, tree, ident, true)
    }
    if (showMaster(part) && layout) {
      const tree = deep(layout.doc.documentElement, 'spTree')[0]
      if (tree) await walk(ctx, layout, tree, ident, true)
    }
    const tree = deep(part.doc.documentElement, 'spTree')[0]
    if (tree) await walk(ctx, part, tree, ident, false)
    const bg = (await backgroundOf(ctx)) ?? { background: theme.colors.lt1 ?? '#ffffff' }
    slides.push({
      id: uid(),
      ...bg,
      customBg: true,
      elements: ctx.out.map((el, i) => ({ ...el, zIndex: i + 1 })),
      transition: 'none',
    })
  }
  if (!slides.length) throw new Error('Tệp .pptx không có slide nào.')
  return { title: file.name.replace(/\.[^.]+$/, '').trim().slice(0, 120) || 'Bài giảng nhập', slides }
}
