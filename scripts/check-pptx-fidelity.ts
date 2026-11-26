import assert from 'node:assert/strict'
import { posix } from 'node:path'
import { DOMParser } from '@xmldom/xmldom'
import JSZip from 'jszip'
import type { Deck, DeckTheme, Slide, SlideElement } from '../src/store/docs'
import { buildDeckPptx } from '../src/lib/exportDeck'
import { importPptx } from '../src/lib/pptxImport'
import { BACKGROUNDS, firstColor } from '../src/lib/slideBackground'
import { readableElements } from '../src/lib/slideContrast'
import { SLIDE_DESIGNS, buildDesignSlides, designTheme } from '../src/lib/slideDesigns'
import { shouldShowSlideFooter } from '../src/lib/slideFormat'
import { graphicById, graphicMarkup, loadGraphics } from '../src/lib/slideGraphics'
import { photoFrameClip } from '../src/lib/slideShapes'
import { slideIconById } from '../src/lib/slideIconLibrary'
import {
  composeLayout, defaultTone, PRO_LAYOUT_IDS, SLIDE_LAYOUTS, toneBackground, withPlaceholders,
  type SlideLayoutContent, type SlideLayoutId,
} from '../src/lib/slideLayouts'
import { mathToPlain } from '../src/lib/slideMath'
import { isStrokeOnlyShape, prstOf } from '../src/lib/slidePresets'
import { skinById, themeWithSkinFonts } from '../src/lib/slideSkins'
import { DECK_THEMES, PRO_THEMES, normalizeTheme, readableTextOn, themeById, type ResolvedTheme } from '../src/lib/slideTheme'

const TOLERANCE = 1 // Điểm phần trăm theo từng trục, dùng kích thước ghi trong presentation.xml.
const ALPHA_TOLERANCE = 0.0051 // PptxGenJS nhận độ trong suốt theo số phần trăm nguyên.
const STROKE_TOLERANCE_PT = 0.01
const PHOTO = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#1e3a8a"/><rect x="64" width="128" height="180" fill="#eab308"/><circle cx="245" cy="60" r="35" fill="#db2777"/></svg>',
).toString('base64')
// PNG 32 × 18 với ba dải màu, không cần mạng hay dịch vụ ảnh.
// Dùng ảnh SVG riêng để kiểm asset SVG và PNG để kiểm quan hệ ảnh thông thường.
const PHOTO_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAASCAIAAAC1qksFAAAAKUlEQVR4nGOQs+pCQ682cxCDbquXE4MYRi0YtWDUglELRi0YtYAeFgAALew48jDYHokAAAAASUVORK5CYII='

type Box = [number, number, number, number]
type Category = keyof typeof counts
const counts = {
  'Vị trí / kích thước': 0, 'Màu nền': 0, 'Màu viền': 0, 'Độ dày / kiểu viền': 0,
  'Màu chữ': 0, 'Trong suốt': 0, 'Thứ tự z': 0, 'Thiếu phần tử': 0, 'Dư phần tử': 0,
  'Hình': 0, 'Nội dung chữ': 0, 'Ảnh / crop': 0,
}
const known = new Map<string, number>()
const unchecked = new Map<string, number>()
const coverage = new Map<string, { decks: number; slides: number; web: number; pptx: number; paired: number }>()
const issues: Array<{ category: Category; location: string; web: unknown; pptx: unknown }> = []
const analyses = new Map<Category, Map<string, number>>()
const tally = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1)
const display = (value: unknown) => JSON.stringify(value) ?? '—'
function issue(category: Category, location: string, web: unknown, pptx: unknown, reason: string) {
  counts[category]++
  issues.push({ category, location, web, pptx })
  const byReason = analyses.get(category) ?? new Map()
  tally(byReason, reason)
  analyses.set(category, byReason)
}

const children = (node: Node | undefined | null) =>
  Array.from(node?.childNodes ?? []).filter((child): child is Element => child.nodeType === 1)
const child = (node: Node | undefined | null, name: string) => children(node).find(n => n.tagName === name)
const attr = (node: Element | undefined | null, name: string) => node?.getAttribute(name) || undefined
const all = (node: Element | undefined, name: string) => Array.from(node?.getElementsByTagName(name) ?? [])
const readXml = (xml: string) => new DOMParser({
  errorHandler: { warning: () => {}, error: msg => { throw new Error(msg) }, fatalError: msg => { throw new Error(msg) } },
}).parseFromString(xml, 'application/xml').documentElement
const rgbChannels = (css?: string | null) => css?.trim().match(/^rgba?\((.*)\)$/i)?.[1].split(/\s*[,/]\s*|\s+/)
const color = (css?: string | null) => {
  const rgb = rgbChannels(css)
  if (rgb) {
    const byte = (v: string) => Math.round(parseFloat(v) * (v.endsWith('%') ? 255 / 100 : 1)).toString(16).padStart(2, '0')
    return '#' + rgb.slice(0, 3).map(byte).join('').toUpperCase()
  }
  const value = css?.trim().toUpperCase()
  if (!value || value === 'TRANSPARENT' || value === 'NONE') return null
  if (/^#[0-9A-F]{3,4}$/.test(value)) return '#' + [...value.slice(1)].map(c => c + c).join('').slice(0, 6)
  return /^#[0-9A-F]{8}$/.test(value) ? value.slice(0, 7) : value
}
const cssAlpha = (css?: string) => {
  if (css === 'transparent' || css === 'none') return 0
  const alpha = rgbChannels(css)?.[3]
  if (alpha !== undefined) return parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1)
  return /^#[0-9a-f]{8}$/i.test(css ?? '') ? parseInt(css!.slice(7), 16) / 255
    : /^#[0-9a-f]{4}$/i.test(css ?? '') ? parseInt(css![4], 16) / 15 : 1
}
function paint(node: Element | undefined) {
  const fill = child(node, 'a:solidFill')
  const rgb = child(fill, 'a:srgbClr')
  const scheme = child(fill, 'a:schemeClr')
  const alpha = attr(child(rgb ?? scheme, 'a:alpha'), 'val')
  return {
    color: rgb ? color('#' + attr(rgb, 'val')) : scheme ? 'scheme:' + attr(scheme, 'val') : null,
    alpha: alpha === undefined ? 1 : Number(alpha) / 100000,
  }
}
const plain = (s: string) => mathToPlain(s).replace(/\r\n?/g, '\n')
const comparableText = (s: string) => s.replace(/\s+/g, ' ').trim()
const paragraphs = (n: Element | undefined) => children(n).filter(p => p.tagName === 'a:p')
const paragraphText = (p: Element) => children(p).map(r =>
  r.tagName === 'a:br' ? '\n' : child(r, 'a:t')?.textContent ?? '').join('')
const textOf = (body: Element | undefined) => paragraphs(body).map(paragraphText).join('\n')
const runs = (body: Element | undefined) => paragraphs(body).flatMap((p, i) =>
  children(p).filter(r => child(r, 'a:t')?.textContent).map((run, j) => {
    const props = child(run, 'a:rPr')
    const fallback = child(child(p, 'a:pPr'), 'a:defRPr')
    const gradient = child(props, 'a:gradFill') ?? child(fallback, 'a:gradFill')
    return { i: i + 1, j: j + 1, text: child(run, 'a:t')!.textContent, gradient,
      ink: paint(child(props, 'a:solidFill') ? props : fallback) }
  }),
)
const isGradient = (css?: string) => /^linear-gradient\(/i.test(css ?? '')
const gradientStops = (css: string) => [...css.matchAll(/(#[0-9a-f]{8}|#[0-9a-f]{6})(?:\s+(\d+(?:\.\d+)?)%)?/gi)]
  .map(([_, hex, offset], i, stops) => [color(hex), offset === undefined ? i / (stops.length - 1) : Number(offset) / 100, cssAlpha(hex)])
const svgStops = (svg: Element | undefined) => all(svg, 'stop').map(stop => {
  const offset = attr(stop, 'offset') ?? ''
  return [color(attr(stop, 'stop-color')), Number.parseFloat(offset) / (offset.endsWith('%') ? 100 : 1), Number(attr(stop, 'stop-opacity') ?? 1)]
})
const dataBytes = (url: string) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')

function makeDeck(title: string, theme: DeckTheme, slides: Slide[], footer?: Deck['footer']): Deck {
  return { id: title, title, theme, slides, footer, createdAt: '', updatedAt: '' }
}
function compose(theme: DeckTheme, layout: SlideLayoutId, extra: SlideLayoutContent = {}): Slide {
  const tone = defaultTone(layout)
  const content = withPlaceholders(layout, extra)
  return { id: layout, layout, tone, background: toneBackground(theme, tone), elements: composeLayout(theme, layout, content, tone) }
}
function probe(id: string, type: SlideElement['type'], box: Box, props: Partial<SlideElement> = {}): SlideElement {
  const [x, y, w, h] = box
  return { id, type, x, y, w, h, ...props }
}
// Ảnh của bộ phong cách: Node không tải được '/slide-packs/...', mà phép kiểm crop giả định ảnh mẫu 16:9.
const inlinePacks = <T extends { elements?: SlideElement[] }>(slide: T): T => ({
  ...slide,
  elements: slide.elements?.map(el => el.src?.startsWith('/slide-packs/') ? { ...el, src: PHOTO_PNG } : el),
})

function cases() {
  const theme = DECK_THEMES[0]
  const photo = { image: PHOTO_PNG, image2: PHOTO, imageCrop: { l: 10, t: 5, r: 20, b: 15 }, focusX: 20, focusY: 70,
    caption: 'Trái', caption2: 'Phải', credit: 'Ảnh minh hoạ' }
  const samples: Slide[] = [
    ...BACKGROUNDS.filter(bg => isGradient(bg.value)).map(bg => ({ id: bg.label, background: bg.value, elements: [] })),
    { id: 'nền ảnh', background: '#385678', bgImage: PHOTO_PNG, elements: [
      probe('chữ trên ảnh', 'text', [20, 20, 60, 10], { text: 'Nội dung trên ảnh', textColor: '#ffffff', fixedHeight: true }),
    ] },
    { id: 'màu CSS và lớp', background: '#eff6ff', elements: [
      probe('nhóm trên', 'shape', [24, 16, 32, 20], { shape: 'hexagon', fill: '#5479ad', opacity: 0.52, border: 3, borderColor: '#813759', borderStyle: 'dashed', zIndex: 4, groupId: 'group' }),
      probe('nhóm dưới', 'shape', [10, 12, 32, 20], { shape: 'round', fill: '#ffaa33', border: 0, zIndex: -1, groupId: 'group' }),
      probe('nền rỗng', 'shape', [65, 10, 20, 15], { shape: 'rect', fill: 'transparent', border: 2 }),
      probe('hex 3 ký tự', 'shape', [65, 30, 20, 12], { fill: '#ea3', border: 0 }),
      probe('hex có alpha', 'shape', [65, 44, 20, 12], { fill: '#88552266', border: 0 }),
      probe('rgba có alpha', 'shape', [65, 60, 20, 12], { fill: 'rgba(12, 34, 56, .4)', border: 2, borderColor: '#abc8', borderStyle: 'dotted', opacity: 0.5 }),
      probe('chữ nhiều run', 'text', [12, 42, 50, 21], { text: 'Một **hai** ba\nBốn & năm < sáu', textColor: '#142438', fill: '#ffffff', fixedHeight: true }),
      probe('chữ chuyển sắc', 'text', [12, 66, 50, 13], { text: 'Màu chuyển sắc', textGradient: { from: '#284570', to: '#963452', angle: 30 }, fixedHeight: true }),
      probe('connector', 'connector', [10, 82, 30, 8], { border: 4, borderColor: '#ab2255' }),
      probe('đường thẳng', 'shape', [46, 82, 35, 4], { shape: 'line', border: 4, fill: '#ab2255', lineArrow: 'both' }),
    ] },
    { id: 'ảnh và khung', background: '#fcfaf3', elements: [
      probe('ảnh giữ tỷ lệ', 'image', [4, 4, 32, 38], { src: PHOTO_PNG, radius: 0 }),
      probe('ảnh crop', 'image', [43, 4, 27, 36], { src: PHOTO_PNG, crop: photo.imageCrop, shape: 'ellipse', border: 2, opacity: 0.63 }),
      probe('ảnh giữ tâm', 'image', [4, 45, 36, 45], { src: PHOTO_PNG, imagePosition: { x: 10, y: 75 } }),
      probe('ảnh SVG', 'image', [48, 50, 32, 32], { src: PHOTO, radius: 0 }),
      probe('khung chờ', 'image', [74, 5, 22, 25]),
    ] },
    { id: 'bảng và biểu đồ', background: '#f4eacf', elements: [
      probe('bảng', 'table', [6, 8, 44, 50], { rows: [['Tiêu đề', 'Giá trị'], ['Hàng lẻ', '3'], ['Hàng chẵn', '4']] }),
      probe('biểu đồ cột', 'chart', [54, 28, 40, 45], { zIndex: 4, chart: { type: 'bar', data: [{ label: 'A', value: 1 }, { label: 'B', value: 2 }, { label: 'C', value: 3 }] } }),
      probe('lớp chồng biểu đồ', 'shape', [52, 24, 42, 55], { fill: '#eeeeee', zIndex: 2 }),
      probe('biểu đồ tròn lặp bảng màu', 'chart', [52, 2, 20, 20], { chart: { type: 'pie',
        data: Array.from({ length: (theme.chart?.length ?? 5) + 2 }, (_, i) => ({ label: String(i), value: i + 1 })) } }),
      probe('biểu đồ đường', 'chart', [75, 2, 20, 20], { chart: { type: 'line', data: [{ label: 'A', value: 3 }, { label: 'B', value: 4 }] } }),
    ] },
  ]
  return [
    { family: 'Bộ thiết kế', decks: SLIDE_DESIGNS.map(design => {
      const palette = designTheme(design)
      const skin = skinById(design.id)
      const resolved = skin ? themeWithSkinFonts(palette, skin) : palette
      return makeDeck(design.id, resolved, buildDesignSlides(design, resolved))
    }) },
    { family: 'Bộ màu', decks: DECK_THEMES.map(t => makeDeck(t.id ?? t.bg, t, [
      compose(t, 'title'),
      { id: 'màu kế thừa', background: t.bg, elements: [
        probe('viền kế thừa', 'shape', [5, 5, 34, 25], { shape: 'rect', fill: t.surface }),
        probe('màu viền mặc định', 'shape', [54, 10, 34, 25], { shape: 'round', border: 3 }),
      ] },
    ])) },
    { family: 'Layout', decks: [makeDeck('composeLayout', theme, SLIDE_LAYOUTS.map(({ id }) => compose(theme, id)))] },
    { family: 'Chuyên nghiệp', decks: PRO_THEMES.map(t => makeDeck(t.id ?? t.bg, t,
      PRO_LAYOUT_IDS.map(id => inlinePacks(compose(t, id, ['photo-full', 'photo-compare', 'bignum'].includes(id) ? photo : {}))),
    )) },
    { family: 'Mẫu kiểm riêng', decks: [
      makeDeck('nền / thuộc tính', { ...theme, decor: 'none' }, samples),
      makeDeck('chân trang', { ...theme, decor: 'none' }, [{ id: 'chân trang', background: '#ffffff', elements: [
        probe('lớp trên chân trang', 'shape', [77, 90, 20, 10], { fill: '#dddddd', border: 0, zIndex: 11 }),
      ] }], { text: 'Đề Rõ', slideNumber: true }),
    ] },
  ]
}

async function xmlPart(zip: JSZip, path: string) {
  const file = zip.file(path)
  assert(file, `Thiếu ${path}`)
  return readXml(await file.async('string'))
}

type ObjectXml = {
  node: Element
  box: Box
  props?: Element
  text: string
  media?: Buffer
  svg?: Element
  blip?: Element
  table?: Element
  chart?: Element
}

async function objects(zip: JSZip, path: string, tree: Element, width: number, height: number) {
  const rels = await xmlPart(zip, posix.join(posix.dirname(path), '_rels', posix.basename(path) + '.rels'))
  const targets = new Map(children(rels).filter(r => attr(r, 'TargetMode') !== 'External').map(r => {
    const target = attr(r, 'Target') ?? ''
    return [attr(r, 'Id'), target.startsWith('/') ? target.slice(1) : posix.join(posix.dirname(path), target)]
  }))
  return Promise.all(children(tree).filter(n => !['p:nvGrpSpPr', 'p:grpSpPr', 'p:extLst'].includes(n.tagName)).map(async (node): Promise<ObjectXml> => {
    const props = child(node, 'p:spPr')
    const xf = child(props, 'a:xfrm') ?? child(node, 'p:xfrm')
    const off = child(xf, 'a:off')
    const ext = child(xf, 'a:ext')
    const box: Box = [
      Number(attr(off, 'x') ?? NaN) * 100 / width, Number(attr(off, 'y') ?? NaN) * 100 / height,
      Number(attr(ext, 'cx') ?? NaN) * 100 / width, Number(attr(ext, 'cy') ?? NaN) * 100 / height,
    ]
    const blip = child(child(node, 'p:blipFill'), 'a:blip')
    const svgId = attr(all(blip, 'asvg:svgBlip')[0], 'r:embed')
    const mediaTarget = targets.get(svgId ?? attr(blip, 'r:embed'))
    const media = mediaTarget ? await zip.file(mediaTarget)?.async('nodebuffer') : undefined
    const chartTarget = targets.get(attr(all(node, 'c:chart')[0], 'r:id'))
    const table = all(node, 'a:tbl')[0]
    return { node, props, box, blip, media, table, text: textOf(child(node, 'p:txBody')),
      svg: media && mediaTarget?.endsWith('.svg') ? readXml(media.toString('utf8')) : undefined,
      chart: chartTarget ? await xmlPart(zip, chartTarget) : undefined,
    }
  }))
}

const comparable = (a: unknown, b: unknown) => display(a) === display(b)
const distance = (a: Box, b: Box) => b.every(Number.isFinite)
  ? a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) : Infinity
const full: Box = [0, 0, 100, 100]
const square = (el: SlideElement): Box => {
  const w = Math.min(el.w, el.h * 9 / 16)
  const h = w * 16 / 9
  return [el.x + (el.w - w) / 2, el.y + (el.h - h) / 2, w, h]
}
const expectedBox = (el: SlideElement): Box => el.type === 'icon' ? square(el)
  : el.type === 'shape' && el.shape === 'line' ? [el.x, el.y + el.h / 2, el.w, 0]
    : [el.x, el.y, el.w, el.h]
const observedType = (el: SlideElement) => {
  if (el.type === 'image' || el.type === 'icon' || el.type === 'graphic' || (el.type === 'shape' && isGradient(el.fill))) return 'p:pic'
  if (el.type === 'table' || el.type === 'chart') return 'p:graphicFrame'
  return 'p:sp'
}
const zOf = (el: SlideElement) => el.type === 'chart' ? 0 : el.zIndex ?? 0 // ChartView không đặt z-index.
const round = (v: number) => Number(v.toFixed(4))
const isGradientPicture = (o: ObjectXml) => all(o.svg, 'linearGradient').some(g => attr(g, 'id') === 'g')
function checkBox(where: string, expected: Box, actual: Box, reason: string) {
  if (expected.some((v, i) => !Number.isFinite(actual[i]) || Math.abs(v - actual[i]) > TOLERANCE + 1e-9)) {
    const show = (box: Box) => Object.fromEntries(['x', 'y', 'cx', 'cy'].map((key, i) => [key, round(box[i])]))
    issue('Vị trí / kích thước', where, show(expected), show(actual), reason)
  }
}

function checkGradient(where: string, css: string, o: ObjectXml | undefined) {
  const expected = gradientStops(css)
  const actual = svgStops(o?.svg)
  const expectedColors = expected.map(s => s.slice(0, 2))
  const actualColors = actual.map(s => s.slice(0, 2))
  if (!comparable(expectedColors, actualColors)) {
    issue('Màu nền', where, { type: 'gradient', stops: expectedColors }, { type: o?.svg ? 'SVG' : o?.node.tagName, stops: actualColors },
      'exportDeck.ts:245–247, 264, 373–374 • gradientSvg chỉ xử lý các cú pháp đã hỗ trợ. Giữ đủ điểm dừng CSS khi chuyển sang gradient DrawingML hoặc SVG.')
  } else {
    tally(known, 'Gradient lưu bằng ảnh SVG cùng các điểm dừng')
    const a = expected.map(s => s[2])
    const b = actual.map(s => s[2])
    if (!comparable(a, b)) issue('Trong suốt', where, a, b, 'exportDeck.ts:240–241, 257, 373–374 • giữ alpha ở từng stop khi nhúng SVG gradient.')
  }
}

function backgrounds(slide: Slide, theme: ResolvedTheme, root: Element, list: ObjectXml[], where: string) {
  const bg = child(child(child(root, 'p:cSld'), 'p:bg'), 'p:bgPr')
  const expected = color(isGradient(slide.background) ? firstColor(slide.background) : slide.background)
  if (paint(bg).color !== expected) issue('Màu nền', where + ' / nền slide', expected, paint(bg).color,
    'exportDeck.ts:245–247 • nền dự phòng qua firstColor và hex. Chuẩn hoá màu CSS trước khi ghi DrawingML.')
  let layers = 0
  if (isGradient(slide.background)) {
    const o = list[layers]
    const hasGradient = Boolean(o && isGradientPicture(o))
    checkGradient(where + ' / nền slide', slide.background, hasGradient ? o : undefined)
    if (hasGradient) {
      checkBox(where + ' / nền gradient', full, o.box, 'exportDeck.ts:247 • giữ viewport gradient phủ toàn slide.')
      layers++
    }
  }
  if (slide.bgImage) {
    const o = list[layers]
    const expectedBytes = dataBytes(slide.bgImage)
    const ok = o?.node.tagName === 'p:pic' && o.media?.equals(expectedBytes)
    if (!ok) issue('Ảnh / crop', where + ' / nền ảnh', 'media đúng ảnh gốc', o?.node.tagName ?? 'thiếu',
      'exportDeck.ts:248–251 • kiểm dữ liệu nhúng và tỉ lệ phủ kín của nền ảnh.')
    if (o?.node.tagName === 'p:pic' && (ok || distance(o.box, full) <= TOLERANCE)) {
      checkBox(where + ' / nền ảnh', full, o.box, 'exportDeck.ts:250 • giữ nền ảnh phủ toàn slide.')
      layers++
    }
    const tint = list[layers]
    const tintPaint = paint(tint?.props)
    if (tintPaint.color !== expected) issue('Màu nền', where + ' / lớp phủ ảnh', expected, tintPaint.color,
      'exportDeck.ts:251 • lớp phủ phải dùng mã màu đầu tiên như slideBgStyle.')
    if (Math.abs(tintPaint.alpha - 77 / 255) > ALPHA_TOLERANCE) issue('Trong suốt', where + ' / lớp phủ ảnh', 77 / 255, tintPaint.alpha,
      'exportDeck.ts:251 • giữ độ đục #4d của lớp phủ ảnh.')
    if (tint?.node.tagName === 'p:sp' && distance(tint.box, full) <= TOLERANCE) layers++
  }
  const foreground = list.slice(layers)
  if (theme.decor === 'none') return foreground
  const name = 'slide-decor-' + theme.decor
  const index = foreground.findIndex(o => attr(all(o.node, 'p:cNvPr')[0], 'name') === name)
  const decor = foreground[index]
  const group = child(decor?.svg, 'g')
  const opacity = { dots: 0.08, grid: 0.02, waves: 0.035, confetti: 0.16, grain: 0.07, glow: 0.14, frame: 0.28 }[theme.decor]
  const markup = group?.toString().toUpperCase() ?? ''
  const colors = theme.decor === 'glow' ? [theme.secondary] : theme.decor === 'confetti' ? [theme.fg, theme.secondary] : [theme.fg]
  if (!group || !colors.every(ink => markup.includes(color(ink) ?? ''))) issue('Màu nền', where + ' / hoạ tiết CSS', theme.decor, group ? [...colors] : null,
    'PPTX cần lớp SVG hoạ tiết dùng cùng màu với slide.css.')
  if (decor) {
    checkBox(where + ' / hoạ tiết CSS', full, decor.box, 'Hoạ tiết phủ toàn slide.')
    if (Number(attr(group, 'opacity')) !== opacity) issue('Trong suốt', where + ' / hoạ tiết CSS', opacity, attr(group, 'opacity'), 'Giữ độ đục của lớp hoạ tiết CSS.')
    if (['dots', 'confetti', 'grain'].includes(theme.decor)) tally(known, 'Rìa chấm họa tiết SVG dùng hình tròn thay cho chuyển sắc rất nhỏ của CSS')
    if (theme.decor !== 'glow') tally(known, 'Họa tiết dùng kích thước pixel theo slide tham chiếu rộng 1000px')
    foreground.splice(index, 1)
  }
  return foreground
}

function checkText(el: SlideElement, theme: ResolvedTheme, body: Element | undefined, where: string, overrideInk?: string) {
  const expectedText = plain(el.text ?? '')
  const actualText = textOf(body)
  const trimmedLines = (text: string) => text.split('\n').map(line => line.trim()).join('\n')
  if (trimmedLines(expectedText) !== trimmedLines(actualText)) issue('Nội dung chữ', where, expectedText, actualText,
    'exportDeck.ts:296–318, 417–420, 494–503 • kiểm cách tạo run/đoạn để giữ đủ ký tự sau khi chuyển Markdown/công thức.')
  const ink = overrideInk ?? el.textColor ?? (el.type === 'shape' ? readableTextOn(el.fill ?? theme.accent) : theme.fg)
  for (const run of runs(body)) {
    const location = `${where} / đoạn ${run.i} run ${run.j} ${display(run.text)}`
    if (el.textGradient) {
      const { from, to, angle } = el.textGradient
      const expected = { stops: [[0, color(from)], [100000, color(to)]], angle: ((angle + 270) % 360 + 360) % 360 }
      const points = all(run.gradient, 'a:gs')
      const actual = run.gradient ? { stops: points.map(stop => [Number(attr(stop, 'pos')), color('#' + attr(child(stop, 'a:srgbClr'), 'val'))]),
        angle: Number(attr(child(run.gradient, 'a:lin'), 'ang')) / 60000 } : run.ink.color
      if (!comparable(expected, actual)) issue('Màu chữ', location, expected, actual, 'Kiểm màu hai điểm dừng và góc của gradFill.')
      const alpha = points.map(stop => Number(attr(child(child(stop, 'a:srgbClr'), 'a:alpha'), 'val') ?? 100000) / 100000)
      const expectedAlpha = [cssAlpha(from), cssAlpha(to)].map(a => a * (el.type === 'shape' ? el.opacity ?? 1 : 1))
      if (points.length === 2 && alpha.some((a, i) => Math.abs(a - expectedAlpha[i]) > ALPHA_TOLERANCE))
        issue('Trong suốt', location, expectedAlpha, alpha, 'Kiểm alpha hai điểm dừng của gradFill.')
      tally(known, 'Chữ chuyển sắc dùng DrawingML theo run, với vùng chuyển sắc có thể khác CSS.')
      continue
    }
    const expected = color(ink)
    if (expected !== run.ink.color) issue('Màu chữ', location, expected, run.ink.color,
      'Ghi đúng màu chữ đã resolve cho từng run.')
    const expectedAlpha = cssAlpha(ink) * (el.type === 'shape' || overrideInk ? el.opacity ?? 1 : 1)
    if (Math.abs(expectedAlpha - run.ink.alpha) > ALPHA_TOLERANCE) issue('Trong suốt', location, round(expectedAlpha), run.ink.alpha,
      'exportDeck.ts:36–42, 398, 537–566 • paint của chữ không nhận alpha CSS, alpha toàn hình hoặc opacity chân trang. Ghi alpha cho từng run.')
  }
  if (el.text && /\$[^$]+\$/.test(el.text)) tally(known, 'Công thức nội dòng chuyển thành chữ Unicode')
}

function checkShape(el: SlideElement, theme: ResolvedTheme, o: ObjectXml, where: string) {
  const prst = el.type === 'connector' ? 'line' : prstOf(el.shape)
  const actualPrst = attr(child(o.props, 'a:prstGeom'), 'prst')
  const strokeOnly = el.type === 'connector' || el.shape === 'line' || isStrokeOnlyShape(el.shape)
  if ((el.type === 'connector' ? 'curvedConnector3' : prst) !== actualPrst) {
    issue('Hình', where, el.type === 'connector' ? 'curvedConnector3 (Bézier)' : prst, actualPrst,
      'exportDeck.ts:367–372, 403–406 • connector Bézier bị ghi thành line, dùng đường cong hoặc customGeom từ đường web.')
  }
  if (el.shape === 'round') tally(known, 'Hình bo tròn dùng preset roundRect, bán kính cụ thể không nằm trong phép so preset')
  if (el.type === 'connector') tally(known, 'Đường nối dùng preset curvedConnector3, đường cong có thể khác Bézier SVG')
  const fillCss = el.fill ?? theme.accent
  const expectedFill = strokeOnly ? null : color(fillCss)
  const actualFill = paint(o.props)
  if (expectedFill !== actualFill.color) issue('Màu nền', where, expectedFill, actualFill.color,
    'exportDeck.ts:26–29, 393–398 • hex chỉ nhận 6 ký tự, màu rỗng/hex ngắn/hex kèm alpha bị đổi thành trắng. Tách RGB/alpha và dùng noFill cho màu rỗng.')
  const expectedAlpha = (el.opacity ?? 1) * cssAlpha(fillCss)
  if (!strokeOnly && expectedFill && Math.abs(expectedAlpha - actualFill.alpha) > ALPHA_TOLERANCE) {
    issue('Trong suốt', where + ' / nền', round(expectedAlpha), actualFill.alpha,
      'exportDeck.ts:393–399 • áp el.opacity lên fill nhưng làm mất alpha trong mã CSS. Nhân hai alpha trước khi ghi.')
  }
  const strokeCss = el.type === 'connector' ? el.borderColor ?? theme.accent
    : strokeOnly ? fillCss : el.borderColor ?? theme.borderColor
  const border = el.type === 'connector' ? el.border ?? 3 : el.shape === 'line' ? el.border ?? 4
    : strokeOnly ? Math.max(el.border ?? theme.border, 3) : el.border ?? theme.border
  const line = child(o.props, 'a:ln')
  const stroke = paint(line)
  const effectiveStroke = border > 0 ? color(strokeCss) : null
  if (stroke.color !== effectiveStroke) issue('Màu viền', where, effectiveStroke, stroke.color,
    'exportDeck.ts:399 • bỏ qua border của theme, dùng #111827 khi thiếu borderColor. Dùng các token border và borderColor đã resolve.')
  const widthPt = stroke.color ? Number(attr(line, 'w') ?? NaN) / 12700 : 0
  const expectedPt = border * 0.72
  if (!Number.isFinite(widthPt) || Math.abs(widthPt - expectedPt) > STROKE_TOLERANCE_PT) issue('Độ dày / kiểu viền', where + ' / pt', expectedPt, widthPt,
    el.type === 'connector' ? 'exportDeck.ts:371 • connector nhân 0,75 thay vì 0,72 pt/px ở hệ 1000 px. Dùng chung quy đổi theo chiều rộng slide.'
      : 'exportDeck.ts:399, 406 • chỉ dùng border cài ở phần tử. Lấy cùng chiều dày mặc định với renderer.')
  const dash = attr(child(line, 'a:prstDash'), 'val') ?? 'solid'
  const expectedDash = el.borderStyle === 'dashed' ? 'dash' : el.borderStyle === 'dotted' ? 'sysDot' : 'solid'
  if (border && el.borderStyle && dash !== expectedDash) issue('Độ dày / kiểu viền', where + ' / kiểu', expectedDash, dash,
    'exportDeck.ts:399, 406 • thiếu dashType. Ánh xạ borderStyle sang preset nét tương ứng.')
  const strokeAlpha = (el.type === 'connector' ? 1 : el.opacity ?? 1) * cssAlpha(strokeCss)
  if (stroke.color && Math.abs(stroke.alpha - strokeAlpha) > ALPHA_TOLERANCE) issue('Trong suốt', where + ' / nét', round(strokeAlpha), stroke.alpha,
    'exportDeck.ts:385–386, 398–399, 406 • alpha của hình chỉ áp lên fill. Áp alpha tương ứng lên cả nét.')
  if (el.text?.trim() && el.shape !== 'line') checkText(el, theme, child(o.node, 'p:txBody'), where)
}

function checkTable(el: SlideElement, theme: ResolvedTheme, o: ObjectXml, where: string) {
  const rows = children(o.table).filter(n => n.tagName === 'a:tr')
  const expectedRows = el.rows ?? []
  const grids = rows.map(row => children(row).filter(n => n.tagName === 'a:tc'))
  if (!comparable(expectedRows.map(row => row.length), grids.map(row => row.length))) issue('Nội dung chữ', where,
    expectedRows.map(row => row.map(plain)), grids.map(row => row.map(cell => textOf(child(cell, 'a:txBody')))),
    'exportDeck.ts:493–505 • giữ toàn bộ dòng/cột khi chuyển qua addTable.')
  grids.forEach((row, ri) => row.forEach((cell, ci) => {
    const location = `${where} / ô ${ri + 1},${ci + 1}`
    const props = child(cell, 'a:tcPr')
    const fill = color(ri === 0 ? theme.accent : ri % 2 === 0 ? theme.surface : undefined)
    const actualFill = paint(props).color
    if (actualFill !== fill || (!fill && !child(props, 'a:noFill'))) issue('Màu nền', location, fill ?? 'noFill', actualFill,
      'exportDeck.ts:491–501 • hàng lẻ được tô màu nền theme, web dùng trong suốt. Bỏ fill hàng lẻ và dùng token đã resolve.')
    for (const [edge, visible] of [['a:lnL', ci === 0], ['a:lnR', true], ['a:lnT', ri === 0], ['a:lnB', true]] as const) {
      // Đường kẻ nội bộ chỉ cần xuất hiện từ ít nhất một bên của cạnh chung.
      if (!visible) continue
      const line = child(props, edge)
      const ink = paint(line).color
      if (ink !== color(theme.muted)) issue('Màu viền', location + ' / ' + edge, color(theme.muted), ink,
        'exportDeck.ts:510 • viền bảng lấy raw theme.muted. Dùng token đã resolve.')
      const width = Number(attr(line, 'w') ?? NaN) / 12700
      if (!Number.isFinite(width) || Math.abs(width - 0.72) > STROKE_TOLERANCE_PT) issue('Độ dày / kiểu viền', location + ' / ' + edge + ' pt', 0.72, width,
        'exportDeck.ts:510 • viền bảng dùng 1 pt thay cho 1 px ở web. Quy đổi theo slide rộng 1000 px.')
    }
    if (expectedRows[ri]?.[ci] !== undefined) checkText({ ...el, text: expectedRows[ri][ci] }, theme, child(cell, 'a:txBody'), location,
      ri === 0 ? readableTextOn(theme.accent) : theme.fg)
  }))
}

function checkPicture(el: SlideElement, theme: ResolvedTheme, o: ObjectXml, where: string) {
  if (!o.media?.length) issue('Ảnh / crop', where, 'media nhúng hợp lệ', null,
    'exportDeck.ts:341–365, 464–489 • kiểm quan hệ ảnh và gói media trước khi trả PPTX.')
  if (o.svg) tally(known, 'SVG nhúng qua quan hệ asvg:svgBlip, có ảnh dự phòng riêng')
  if (el.type === 'graphic' && el.graphicId && o.svg) {
    const canonical = (svg: string) => svg.replace(/#[0-9a-f]{6}\b/gi, hex => hex.toUpperCase())
    const expected = graphicMarkup(el.graphicId, el.textColor ?? theme.fg, el.fill)
    if (canonical(expected) !== canonical(o.media!.toString('utf8'))) issue('Màu nền', where + ' / màu SVG', { ink: el.textColor ?? theme.fg, fill: el.fill },
      { fills: [...new Set((o.media?.toString('utf8') ?? '').match(/#[0-9a-f]{6}\b/gi))].slice(0, 12) },
      'exportDeck.ts:357–364 • chuẩn hoá màu thông qua hex trước khi nhuộm SVG. Giữ cùng đầu vào với GraphicFill.')
  }
  if (el.type === 'icon' && o.svg) {
    const actual = color(attr(o.svg, 'fill'))
    const expected = color(el.textColor ?? theme.accent)
    if (expected !== actual) issue('Màu nền', where + ' / màu SVG', expected, actual,
      'exportDeck.ts:341–343 • truyền cùng màu mà SlideIcon dùng cho currentColor.')
  }
  const alpha = Number(attr(child(o.blip, 'a:alphaModFix'), 'amt') ?? 100000) / 100000
  if (Math.abs((el.opacity ?? 1) - alpha) > ALPHA_TOLERANCE) issue('Trong suốt', where, el.opacity ?? 1, alpha,
    'exportDeck.ts:348–365, 373–374, 468–487 • bảo toàn opacity khi thêm ảnh/SVG.')
  if (el.type !== 'image') return
  if (!el.src) {
    const stops = svgStops(o.svg).slice(0, 6)
    const expected = [
      [color(theme.surface), 0, cssAlpha(theme.surface)],
      [color(theme.surface), 0.48, cssAlpha(theme.surface)],
      [color(theme.accent), 0.48, cssAlpha(theme.accent) * 34 / 255],
      [color(theme.accent), 0.54, cssAlpha(theme.accent) * 34 / 255],
      [color(theme.surface), 0.54, cssAlpha(theme.surface)],
      [color(theme.surface), 1, cssAlpha(theme.surface)],
    ]
    if (!comparable(stops, expected)) issue('Màu nền', where, expected, stops, 'Kiểm các điểm dừng của khung chờ ảnh.')
    const border = all(o.svg, 'path').find(path => attr(path, 'stroke'))
    const clip = photoFrameClip(el.shape)
    if ((!clip || el.border) && el.shape !== 'pill') {
      const ink = el.border ? el.borderColor ?? theme.borderColor : theme.accent
      const alpha = cssAlpha(ink) * (el.border ? 1 : 0.4)
      if (color(attr(border, 'stroke')) !== color(ink)) issue('Màu viền', where, color(ink), attr(border, 'stroke'), 'Kiểm màu viền của khung chờ ảnh.')
      if (Number(attr(border, 'stroke-opacity')) !== alpha) issue('Trong suốt', where + ' / viền', alpha, attr(border, 'stroke-opacity'), 'Kiểm alpha viền của khung chờ ảnh.')
    }
    tally(known, 'Khung chờ dùng SVG tĩnh, không mang trạng thái tạo ảnh của web')
    return
  }
  const srcRect = child(child(o.node, 'p:blipFill'), 'a:srcRect')
  const sourceUnchanged = o.media?.equals(dataBytes(el.src))
  const clip = attr(child(o.props, 'a:prstGeom'), 'prst')
  if (el.shape) tally(known, 'Khung ảnh đặc biệt có thể xuất thành picture chữ nhật với mask bake trong PNG')
  if (el.src.startsWith('data:') && !sourceUnchanged) issue('Ảnh / crop', where + ' / dữ liệu ảnh Node', 'media gốc từ fixture', 'media khác hoặc thiếu',
    'exportDeck.ts:144, 464–487 • Node trả data URL gốc, kiểm lại quan hệ media nếu nội dung thay đổi.')
  // Ảnh fixture đều có tỷ lệ 16:9, nên w/h theo trục % là tỷ lệ khung tương đối với ảnh.
  const horizontal = Math.max(0, 1 - el.w / el.h)
  const vertical = Math.max(0, 1 - el.h / el.w)
  const fx = (el.imagePosition?.x ?? 50) / 100
  const fy = (el.imagePosition?.y ?? 50) / 100
  const expected = el.crop
    ? [el.crop.l / 100, el.crop.t / 100, Math.min(el.crop.r, 90 - el.crop.l) / 100, Math.min(el.crop.b, 90 - el.crop.t) / 100]
    : [horizontal * fx, vertical * fy, horizontal * (1 - fx), vertical * (1 - fy)]
  const actual = ['l', 't', 'r', 'b'].map(key => Number(attr(srcRect, key) ?? 0) / 100000)
  if (sourceUnchanged && actual.some((v, i) => Math.abs(v - expected[i]) > 0.00002)) {
    issue('Ảnh / crop', where, expected, actual, 'Đối chiếu bốn cạnh srcRect với crop thủ công hoặc cover theo tâm ảnh.')
  }
  if (el.shape || el.radius !== 0 || el.border) tally(unchecked, 'Mask, viền và crop bake bằng canvas trình duyệt')
  if (clip === 'ellipse' && el.shape === 'ellipse') tally(known, 'Node ghi preset ellipse dự phòng cho khung ảnh ellipse')
}

function webElements(slide: Slide, deck: Deck, theme: ResolvedTheme, index: number) {
  const elements = readableElements(slide, theme).filter(el => {
    if (el.type === 'formula' || (el.type === 'graphic' && (!el.graphicId || !graphicById(el.graphicId)))) {
      tally(unchecked, 'Kiểu phần tử không được SlideElView vẽ')
      return false
    }
    if (el.type === 'icon' && !slideIconById(el.assetId)) {
      tally(unchecked, 'Icon không tìm thấy trong catalog, web chỉ có khung trống')
      return false
    }
    if (el.groupId) tally(known, 'Nhóm chỉnh sửa được xuất thành các thành viên riêng')
    return true
  })
  if (shouldShowSlideFooter(deck.footer, slide, index)) {
    // Chân trang là flex theo nội dung. Chỉ kiểm thứ tự, chữ và độ đục.
    const footer = { textColor: theme.muted, opacity: 0.85, zIndex: 10 }
    const text = deck.footer?.text?.trim()
    if (text) elements.push(probe('@footer-text', 'text', [3.5, 93.5, 75, 5], { ...footer, text }))
    if (deck.footer?.slideNumber) elements.push(probe('@footer-number', 'text', [80, 93.5, 16.5, 5], { ...footer, text: String(index + 1) }))
  }
  return elements
}

function compareElements(slide: Slide, deck: Deck, theme: ResolvedTheme, index: number, list: ObjectXml[], where: string) {
  const web = webElements(slide, deck, theme, index)
  // Ghép theo kiểu OOXML, nội dung và vị trí trước khi so z. Mỗi đối tượng chỉ được ghép một lần.
  // Việc thiếu khung chờ ảnh không thể đẩy lệch các cặp đứng sau.
  const candidates = web.flatMap((el, i) => list.flatMap((o, j) => {
    const placeholder = attr(all(o.node, 'p:cNvPr')[0], 'name') === 'slide-image-placeholder'
    if ((el.type === 'image' && !el.src) !== placeholder) return []
    if (observedType(el) !== o.node.tagName) return []
    if (el.type === 'chart' && !o.chart || el.type === 'table' && !o.table) return []
    if (o.blip && (el.type === 'shape') !== isGradientPicture(o)) return []
    const text = el.type === 'video' ? '▶ Video' : plain(el.text ?? '')
    const textCost = comparableText(text) === comparableText(o.text) ? 0 : Boolean(text) === Boolean(o.text) ? 25 : 100
    const geometry = distance(expectedBox(el), o.box)
    const fill = el.type === 'shape' && !o.blip && color(el.fill ?? theme.accent) !== paint(o.props).color ? 0.01 : 0
    return [{ i, j, cost: textCost + geometry + fill }]
  })).sort((a, b) => a.cost - b.cost)
  const matched = new Map<number, number>()
  const used = new Set<number>()
  for (const { i, j } of candidates) {
    if (matched.has(i) || used.has(j)) continue
    matched.set(i, j)
    used.add(j)
  }
  web.forEach((el, i) => {
    const location = `${where} / ${el.id} [${el.type}]`
    const j = matched.get(i)
    if (j === undefined) {
      issue('Thiếu phần tử', location, el.type === 'image' && !el.src ? 'khung chờ ảnh' : { type: el.type, box: expectedBox(el) }, null,
        el.type === 'image' && !el.src ? 'exportDeck.ts:464 • điều kiện el.src bỏ qua ảnh chờ đang hiện trên web. Xuất khung thay thế cùng vị trí.'
          : 'exportDeck.ts:254–535 • kiểm nhánh dispatch của loại phần tử bị thiếu và giữ một đối tượng cho mỗi nội dung web.')
      return
    }
    const o = list[j]
    const footer = el.id.startsWith('@footer-')
    if (footer) tally(unchecked, 'Kích thước hộp chân trang flex phụ thuộc nội dung')
    else checkBox(location, expectedBox(el), o.box,
      el.type === 'text' ? 'exportDeck.ts:261, 321 • web dùng h mô hình trong SlideElView, export đo lại elementHeight cho chữ thường. Dùng cùng hộp nguồn.'
        : el.type === 'table' ? 'exportDeck.ts:507–511 • PptxGenJS tính lại chiều cao theo hàng. Đặt chiều cao hàng và kiểm ext của graphicFrame.'
          : 'exportDeck.ts:254–261, 341–355, 464–489, 524–528 • đồng bộ hộp và tỷ lệ với renderer.')
    if (o.blip) {
      if (el.type === 'shape' && el.fill) checkGradient(location, el.fill, o)
      checkPicture(el, theme, o, location)
    } else if (el.type === 'shape' || el.type === 'connector') {
      checkShape(el, theme, o, location)
    } else if (el.type === 'text') {
      const actual = paint(o.props)
      const expected = color(el.fill)
      if (actual.color !== expected) issue('Màu nền', location, expected, actual.color,
        'exportDeck.ts:339 và hex ở 26–29 • fill ô chữ qua hex. Chuyển cùng màu CSS, giữ noFill và alpha.')
      if (expected && Math.abs(cssAlpha(el.fill) - actual.alpha) > ALPHA_TOLERANCE) issue('Trong suốt', location + ' / nền chữ', cssAlpha(el.fill), actual.alpha,
        'exportDeck.ts:339 • fill ô chữ thiếu alpha. Ghi alpha cùng với RGB.')
      checkText(el, theme, child(o.node, 'p:txBody'), location, footer ? theme.muted : undefined)
      const geom = attr(child(o.props, 'a:prstGeom'), 'prst')
      if (geom !== 'rect') issue('Hình', location, 'rect', geom, 'exportDeck.ts:319–340 • giữ preset chữ nhật của hộp chữ.')
      if (el.fill) tally(known, 'Ô chữ có nền dùng hộp rect, web bo góc CSS')
    } else if (el.type === 'table') {
      checkTable(el, theme, o, location)
    } else if (el.type === 'chart') {
      const series = all(o.chart, 'c:ser')[0]
      const palette = theme.chart.length ? theme.chart : ['#2563eb']
      const expected = el.chart?.data.map((_, k) => color(palette[el.chart?.type === 'line' ? 0 : k % palette.length])) ?? []
      const base = paint(child(series, 'c:spPr')).color
      const pointColors = new Map(all(series, 'c:dPt').map(pt => [Number(attr(child(pt, 'c:idx'), 'val')), paint(child(pt, 'c:spPr')).color]))
      const actual = expected.map((_, k) => pointColors.get(k) ?? base)
      if (!comparable(expected, actual)) issue('Màu nền', location + ' / màu cột', expected, actual,
        'exportDeck.ts:513–532 • một series chỉ lấy el.fill/accent, web lấy theme.chart theo cột. Ghi màu từng data point.')
      tally(unchecked, 'Bố cục bên trong biểu đồ native, gồm vùng vẽ, nhãn và chú giải')
    }
  })
  list.forEach((o, j) => {
    if (!used.has(j)) issue('Dư phần tử', `${where} / OOXML #${j + 1}`, null, { type: o.node.tagName, box: o.box.map(round), text: o.text },
      'exportDeck.ts:242–568 • kiểm các lớp phụ và đối tượng xuất lặp.')
  })
  const webOrder = [...matched.keys()].sort((i, j) => zOf(web[i]) - zOf(web[j]) || i - j)
  for (const [rank, i] of webOrder.entries()) {
    const j = matched.get(i)!
    for (const k of webOrder.slice(rank + 1)) {
      const l = matched.get(k)!
      if (j > l) issue('Thứ tự z', where + ' / ' + web[i].id + ' ↔ ' + web[k].id,
        { order: [web[i].id, web[k].id], z: [zOf(web[i]), zOf(web[k])] },
        { order: [web[k].id, web[i].id], spTree: [l + 1, j + 1] },
        web[i].id.startsWith('@footer-') || web[k].id.startsWith('@footer-')
          ? 'exportDeck.ts:254, 537–568 • luôn thêm chân trang cuối. Chèn chân trang vào danh sách theo z=10 như web.'
          : 'exportDeck.ts:254 • dùng zIndex nguồn cho mọi loại, ChartView tự vẽ không áp zIndex. Dùng cùng quy tắc xếp lớp cho web và PPTX.')
    }
  }
  return { web: web.length, pptx: list.length, paired: matched.size }
}

async function checkTableRoundTrip() {
  const theme = themeById('cam-nang-dong')
  const deck: Deck = {
    id: 'table', title: 'Bảng màu cam', theme, createdAt: '', updatedAt: '',
    slides: [{
      id: 'slide', background: theme.bg,
      elements: [{ id: 'table-element', type: 'table', x: 8, y: 25, w: 84, h: 55, rows: [['A', 'B'], ['1', '2']] }],
    }],
  }
  const bytes = await buildDeckPptx(deck)
  Object.assign(globalThis, {
    DOMParser: class extends DOMParser {
      parseFromString(...args: Parameters<DOMParser['parseFromString']>) {
        const parsed = super.parseFromString(...args)
        for (const el of Array.from(parsed.getElementsByTagName('*'))) {
          Object.defineProperty(el, 'children', { value: children(el) })
        }
        return parsed
      }
    },
  })
  const imported = await importPptx(new File([bytes], 'table.pptx'))
  assert.equal(imported.slides.length, 1)
  const table = imported.slides[0].elements.find(el => el.type === 'table')
  assert.deepEqual(table?.rows, [['A', 'B'], ['1', '2']])
  assert.deepEqual(table?.cellFills?.[0].map(color), [color(theme.accent), color(theme.accent)])
  const again = await importPptx(new File([await buildDeckPptx({ ...deck, theme: DECK_THEMES[0], slides: imported.slides })], 'table.pptx'))
  assert.deepEqual(again.slides[0].elements.find(el => el.type === 'table')?.cellFills?.[0].map(color), [color(theme.accent), color(theme.accent)])
}

async function main() {
  await loadGraphics()
  await checkTableRoundTrip()
  for (const { family, decks } of cases()) {
    const totals = { decks: decks.length, slides: 0, web: 0, pptx: 0, paired: 0 }
    coverage.set(family, totals)
    for (const deck of decks) {
      const theme = normalizeTheme(deck.theme)
      const zip = await JSZip.loadAsync(await buildDeckPptx(deck))
      const presentation = await xmlPart(zip, 'ppt/presentation.xml')
      const size = child(presentation, 'p:sldSz')
      const width = Number(attr(size, 'cx'))
      const height = Number(attr(size, 'cy'))
      assert.deepEqual([width, height], [9144000, 5143500], deck.title + ' / kích thước 10 × 5,625 in')
      const ids = children(child(presentation, 'p:sldIdLst'))
      assert.equal(ids.length, deck.slides.length, deck.title + ' / số slide')
      for (const [i, slide] of deck.slides.entries()) {
        const path = `ppt/slides/slide${i + 1}.xml`
        const xml = await xmlPart(zip, path)
        const tree = child(child(xml, 'p:cSld'), 'p:spTree')
        assert(tree, `Thiếu spTree trong ${path}`)
        const where = `${family} / ${deck.title} / slide ${i + 1} (${slide.layout ?? (family === 'Bộ thiết kế' ? 'tự do' : slide.id)})`
        const list = await objects(zip, path, tree, width, height)
        const totalsForSlide = compareElements(slide, deck, theme, i, backgrounds(slide, theme, xml, list, where), where)
        totals.slides++
        totals.web += totalsForSlide.web
        totals.pptx += totalsForSlide.pptx
        totals.paired += totalsForSlide.paired
      }
    }
  }

  for (const row of issues) console.log(`[${row.category}] ${row.location} | web=${display(row.web)} | pptx=${display(row.pptx)}`)
  console.log(`\nNgưỡng hình học ≤ ${TOLERANCE}% theo trục, alpha ≤ ${ALPHA_TOLERANCE}, nét ≤ ${STROKE_TOLERANCE_PT} pt. Màu RGB so khớp chính xác.`)
  const totals = { decks: 0, slides: 0, web: 0, pptx: 0, paired: 0 }
  for (const row of coverage.values()) for (const key of Object.keys(totals) as (keyof typeof totals)[]) totals[key] += row[key]
  console.table(Object.fromEntries([...coverage, ['Tổng', totals]]))
  console.table(counts)
  console.log(`Tổng sai lệch: ${issues.length} (đếm theo thuộc tính, run, cạnh ô hoặc cặp z; lớp nền không tính vào số phần tử).`)
  console.log('\nNguyên nhân và hướng sửa')
  for (const [category, reasons] of analyses) for (const [reason, n] of reasons) console.log(`- [${category}, ${n}] ${reason}`)
  console.log('\nKhác biệt đã biết')
  for (const [note, n] of known) console.log(`- ${note} (${n})`)
  console.log('\nChưa kiểm')
  for (const [note, n] of unchecked) console.log(`- ${note} (${n})`)
  console.log('- Kết quả dựng hình thực tế từ Office, SVG fallback, ảnh tải qua mạng, công thức dạng đối tượng, chữ cong và video.')
  // Đây là lệnh kiểm kê. Sai lệch được in đầy đủ, lỗi xuất/đọc tệp mới làm lệnh thất bại.
}

await main()
