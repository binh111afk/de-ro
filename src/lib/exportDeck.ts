/**
 * Xuất bài giảng ra .pptx (Tệp → Tải xuống file).
 *
 * `pptxgenjs` được nạp động: chỉ tải khi người dùng bấm tải, không nằm trong
 * bundle chính. Toạ độ của deck là % (0–100) nên truyền thẳng dạng `"12%"`
 * — PptxGenJS hiểu % theo kích thước slide 16:9.
 */
import { readableElements } from './slideContrast'
import { boldRuns, hasBold, mathToPlain } from './slideMath'
import { normalizeSlideHref, shouldShowSlideFooter } from './slideFormat'
import { parseSlideVideo } from './slideVideo'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Deck, SlideElement } from '@/store/docs'
import { mixHex, normalizeTheme, readableTextOn, type ResolvedTheme } from './slideTheme'
import { ensureFonts, primaryFont, slideFontStack } from './slideFonts'
import { curvedTextPng } from './slideTextEffects'
import { slideIconById } from './slideIconLibrary'
import { graphicMarkup, loadGraphics } from './slideGraphics'
import { firstColor, gradientSvg } from './slideBackground'
import { isStrokeOnlyShape, prstOf } from './slidePresets'
import { FRAME_PLACEHOLDER, photoFrameClip, photoFrameRadius } from './slideShapes'
import { toDataUrl } from './mediaStore'
import { trackExport } from './exportProgress'
import { decorSvg } from './pptxDecor'

function parseColor(value: string | undefined) {
  const css = value?.trim().toLowerCase() ?? ''
  const raw = css.match(/^#?([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/)?.[1]
  if (raw) {
    const expanded = raw.length <= 4 ? raw.replace(/./g, digit => digit + digit) : raw
    return { color: expanded.slice(0, 6).toUpperCase(), alpha: expanded.length === 8 ? parseInt(expanded.slice(6), 16) / 255 : 1 }
  }
  if (css === 'transparent' || css === 'none') return { color: '000000', alpha: 0 }
  const rgb = css.match(/^rgba?\((.+)\)$/)?.[1].trim().split(/\s*[,/]\s*|\s+/)
  if (!rgb || (rgb.length !== 3 && rgb.length !== 4) || !rgb.every(part => /^[+-]?(?:\d+\.?\d*|\.\d+)%?$/.test(part))) return
  const channel = (part: string, max: number) =>
    Math.max(0, Math.min(max, parseFloat(part) * (part.endsWith('%') ? max / 100 : 1)))
  const color = rgb.slice(0, 3).map(part => Math.round(channel(part, 255)).toString(16).padStart(2, '0')).join('').toUpperCase()
  return { color, alpha: channel(rgb[3] ?? '1', 1) }
}

const hex = (value: string | undefined, fallback = 'FFFFFF') => parseColor(value)?.color ?? fallback

function pptxPaint(value: string | undefined, opacity = 1) {
  const paint = parseColor(value)
  return paint && { color: paint.color, transparency: (1 - paint.alpha * opacity) * 100 }
}

function pptxFill(value: string | undefined, opacity = 1) {
  const paint = pptxPaint(value, opacity)
  return paint && paint.transparency < 100 ? paint : undefined
}

export const pptxFont = (stack: string | undefined) => {
  const face = primaryFont(stack)
  return face === 'JetBrains Mono Variable' ? 'JetBrains Mono' : face || 'Arial'
}

function pptxTextEffects(el: SlideElement, fallback: string) {
  const stroke = el.textStroke
  const gradient = el.textGradient
  return {
    ...pptxPaint(gradient ? mixHex(gradient.from, gradient.to, 0.5) : el.textColor ?? fallback, el.type === 'shape' ? el.opacity : undefined),
    ...(stroke?.width ? { outline: { color: hex(stroke.color), size: stroke.width * 0.72 } } : {}),
  }
}

function runGradient(el: SlideElement): string | undefined {
  const gradient = el.textGradient
  if (!gradient) return
  const from = parseColor(gradient.from)
  const to = parseColor(gradient.to)
  if (!from || !to) return
  const opacity = el.type === 'shape' ? el.opacity ?? 1 : 1
  const stop = (paint: typeof from, position: number) =>
    `<a:gs pos="${position}"><a:srgbClr val="${paint.color}"><a:alpha val="${Math.round(paint.alpha * opacity * 100000)}"/></a:srgbClr></a:gs>`
  const angle = Math.round(((gradient.angle - 90) % 360 + 360) % 360 * 60000)
  return `<a:gradFill><a:gsLst>${stop(from, 0)}${stop(to, 100000)}</a:gsLst><a:lin ang="${angle}" scaled="0"/></a:gradFill>`
}

// PptxGenJS không hỗ trợ gradFill hoặc bóng riêng trên run.
function applyRunEffects(xml: string, effects: Map<string, SlideElement>): string {
  if (!effects.size) return xml
  return xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, shape => {
    const key = shape.match(/<p:cNvPr\b[^>]*\bname="(slide-text-(?:shadow|gradient)-\d+)"/)?.[1]
    const el = key ? effects.get(key) : undefined
    if (!el) return shape
    const gradient = runGradient(el)
    if (gradient) {
      // Màu chữ đứng ngay sau thẻ mở hoặc sau nét viền chữ.
      shape = shape.replace(/(<a:(?:rPr|defRPr)\b[^>]*>(?:<a:ln\b[^>]*>[\s\S]*?<\/a:ln>)?)<a:solidFill>[\s\S]*?<\/a:solidFill>/g, '$1' + gradient)
    }
    const shadow = el.textShadow
    if (!shadow) return shape
    const blur = Math.round(Math.max(0, shadow.blur) * 9144)
    const offset = Math.round(Math.hypot(shadow.x, shadow.y) * 9144)
    const angle = Math.round((Math.atan2(shadow.y, shadow.x) * 180 / Math.PI + 360) % 360 * 60000)
    const effect = `<a:effectLst><a:outerShdw blurRad="${blur}" dist="${offset}" dir="${angle}" algn="ctr" rotWithShape="0"><a:srgbClr val="${hex(shadow.color, '000000')}" /></a:outerShdw></a:effectLst>`
    return shape.replace(/(<a:rPr\b[^>]*>(?:(?!<\/a:rPr>)[\s\S])*?)(<a:latin\b)/g, (_match, props, latin) => props + effect + latin)
  })
}

/** cỡ chữ của deck là cqw (1% bề rộng); slide 16:9 rộng 10in → 1cqw = 7,2pt */
const pt = (cqw: number) => Math.round(cqw * 7.2 * 10) / 10

/** Canvas tham chiếu 1000px, slide rộng 720pt. */
const strokePt = (px: number) => px * 0.72

function pptxLine(value: string, width: number, style?: SlideElement['borderStyle'], opacity?: number) {
  const paint = pptxPaint(value, opacity)
  if (!width || !paint) return { type: 'none' as const }
  const dashType = style === 'dashed' ? 'dash' as const : style === 'dotted' ? 'sysDot' as const : 'solid' as const
  return { ...paint, width: strokePt(width), dashType }
}

/** toạ độ % của deck → kiểu `Coord` của PptxGenJS (template literal) */
const pct = (value: number) => `${value}%` as `${number}%`


/** Chuyển CSS border-radius (1..4 giá trị mỗi chiều hoặc "X / Y") thành 8 bán kính pixel chuẩn CSS. */
function parseBorderRadii(spec: string, cw: number, ch: number): [number, number, number, number, number, number, number, number] {
  const [hStr, vStr] = spec.split('/').map((s) => s.trim())
  const expand4 = (raw: string, ref: number) => {
    const parts = raw.split(/\s+/).filter(Boolean).map((tok) => {
      if (tok.endsWith('%')) return (parseFloat(tok) / 100) * ref
      if (tok.endsWith('cqw')) return (parseFloat(tok) / 100) * cw
      return parseFloat(tok) || 0
    })
    const [a = 0, b = a, c = a, d = b] = parts
    return [a, b, c, d] as const
  }
  const [tlX, trX, brX, blX] = expand4(hStr, cw)
  const [tlY, trY, brY, blY] = expand4(vStr ?? hStr, ch)
  // Co đồng bộ nếu tổng bán kính vượt quá cạnh hộp (giống CSS border-radius)
  const scale = Math.min(
    1,
    cw / Math.max(1e-6, tlX + trX),
    cw / Math.max(1e-6, blX + brX),
    ch / Math.max(1e-6, tlY + blY),
    ch / Math.max(1e-6, trY + brY),
  )
  return [tlX * scale, tlY * scale, trX * scale, trY * scale, brX * scale, brY * scale, blX * scale, blY * scale]
}

function buildImagePath(el: Deck['slides'][number]['elements'][number], cw: number, ch: number): Path2D {
  const path = new Path2D()
  const clip = photoFrameClip(el.shape)
  const frameRad = photoFrameRadius(el.shape)
  if (el.shape === 'pill') {
    const ry = ch * 0.22
    const rh = ch * 0.56
    path.roundRect(0, ry, cw, rh, Math.min(cw, rh) / 2)
    return path
  }
  if (clip && !frameRad && clip.startsWith('polygon(')) {
    const pts = clip
      .slice(8, -1)
      .split(',')
      .map((pair) => {
        const [xStr, yStr] = pair.trim().split(/\s+/)
        return [(parseFloat(xStr) / 100) * cw, (parseFloat(yStr) / 100) * ch] as const
      })
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    if (pts.length >= 3) {
      path.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1])
      path.closePath()
      return path
    }
  }
  const cqwPx = cw / Math.max(1, el.w)
  const radSpec = frameRad ?? (el.radius !== undefined ? `${(el.radius / 10) * cqwPx}px` : `${cqwPx}px`)
  const [tlX, tlY, trX, trY, brX, brY, blX, blY] = parseBorderRadii(radSpec, cw, ch)
  path.moveTo(tlX, 0)
  path.lineTo(cw - trX, 0)
  if (trX > 0 && trY > 0) path.ellipse(cw - trX, trY, trX, trY, 0, -Math.PI / 2, 0)
  else path.lineTo(cw, 0)
  path.lineTo(cw, ch - brY)
  if (brX > 0 && brY > 0) path.ellipse(cw - brX, ch - brY, brX, brY, 0, 0, Math.PI / 2)
  else path.lineTo(cw, ch)
  path.lineTo(blX, ch)
  if (blX > 0 && blY > 0) path.ellipse(blX, ch - blY, blX, blY, 0, Math.PI / 2, Math.PI)
  else path.lineTo(0, ch)
  path.lineTo(0, tlY)
  if (tlX > 0 && tlY > 0) path.ellipse(tlX, tlY, tlX, tlY, 0, Math.PI, Math.PI * 1.5)
  else path.lineTo(0, 0)
  path.closePath()
  return path
}

function imagePlaceholderSvg(el: SlideElement, theme: ResolvedTheme) {
  const w = Math.max(1, el.w * 10)
  const h = Math.max(1, el.h * 5.625)
  const clip = photoFrameClip(el.shape)
  const frameRadius = photoFrameRadius(el.shape)
  const width = el.border ? Math.max(1, el.border) : clip ? 0 : 1
  const accent = parseColor(theme.accent) ?? { color: '2563EB', alpha: 1 }
  const surface = parseColor(theme.surface) ?? { color: 'FFFFFF', alpha: 1 }
  const border = el.border ? parseColor(el.borderColor ?? theme.borderColor) ?? accent : accent
  const borderAlpha = border.alpha * (el.border ? 1 : 0.4)
  const dash = el.borderStyle === 'dashed' ? `${width * 3} ${width * 2}`
    : el.borderStyle === 'dotted' ? `${width} ${width * 1.5}` : ''
  let path: string
  if (clip?.startsWith('polygon(') && !frameRadius) {
    const points = clip.slice(8, -1).split(',').map(pair => {
      const [x, y] = pair.trim().split(/\s+/).map(parseFloat)
      return `${x / 100 * w},${y / 100 * h}`
    })
    path = `M${points.join(' L')}Z`
  } else {
    const pill = el.shape === 'pill'
    const inset = pill ? h * 0.22 : 0
    const bottom = h - inset
    const [ax, ay, bx, by, cx, cy, dx, dy] = parseBorderRadii(frameRadius ?? (pill ? '999px' : `${clip ? 0 : el.radius ?? 10}px`), w, bottom - inset)
    path = `M${ax},${inset} H${w - bx} A${bx},${by} 0 0 1 ${w},${inset + by} V${bottom - cy} A${cx},${cy} 0 0 1 ${w - cx},${bottom} H${dx} A${dx},${dy} 0 0 1 0,${bottom - dy} V${inset + ay} A${ax},${ay} 0 0 1 ${ax},${inset}Z`
  }
  const half = (w + h) / 4
  const art = clip ? decodeURIComponent(FRAME_PLACEHOLDER.split(',')[1]).replace('<svg ', `<svg width="${w}" height="${h}" `)
    : `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="600" fill="#${accent.color}" fill-opacity="${accent.alpha}">&#7842;nh minh ho&#7841;</text>`
  const stop = (offset: number, paint: typeof surface, alpha = 1) =>
    `<stop offset="${offset}" stop-color="#${paint.color}" stop-opacity="${paint.alpha * alpha}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <defs><clipPath id="frame"><path d="${path}"/></clipPath>
    <linearGradient id="placeholder-fill" gradientUnits="userSpaceOnUse" x1="${w / 2 - half}" y1="${h / 2 - half}" x2="${w / 2 + half}" y2="${h / 2 + half}">
    ${stop(0, surface)}${stop(0.48, surface)}${stop(0.48, accent, 34 / 255)}${stop(0.54, accent, 34 / 255)}${stop(0.54, surface)}${stop(1, surface)}
    </linearGradient></defs>
    <g clip-path="url(#frame)"><path d="${path}" fill="url(#placeholder-fill)"/>${art}
    ${width && el.shape !== 'pill' ? `<path d="${path}" fill="none" stroke="#${border.color}" stroke-opacity="${borderAlpha}" stroke-width="${2 * width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` : ''}</g></svg>`
}

function loadPptxImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
}

async function imageRatio(dataUrl: string) {
  try {
    if (typeof Image !== 'undefined') {
      const image = await loadPptxImage(dataUrl)
      return image.naturalWidth / image.naturalHeight
    }
    const { imageSize } = await import('image-size')
    const comma = dataUrl.indexOf(',')
    const data = dataUrl.slice(comma + 1)
    const bytes = dataUrl.slice(0, comma).endsWith(';base64')
      ? Uint8Array.from(atob(data), byte => byte.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(data))
    const { width, height, orientation } = imageSize(bytes)
    return orientation && orientation >= 5 ? height / width : width / height
  } catch {
    return undefined
  }
}

/** Vùng nhìn thấy, theo phần của ảnh gốc. Cùng công thức cho canvas và a:srcRect. */
function imageCrop(el: SlideElement, ratio: number, boxRatio: number) {
  if (el.crop) {
    const { l, t, r, b } = el.crop
    return [l / 100, t / 100, Math.max(10, 100 - l - r) / 100, Math.max(10, 100 - t - b) / 100] as const
  }
  const w = Math.min(1, boxRatio / ratio)
  const h = Math.min(1, ratio / boxRatio)
  return [(1 - w) * (el.imagePosition?.x ?? 50) / 100, (1 - h) * (el.imagePosition?.y ?? 50) / 100, w, h] as const
}

async function nativeImageCrop(el: SlideElement, dataUrl: string) {
  const boxRatio = (el.w * 16) / (el.h * 9)
  const ratio = el.crop ? boxRatio : await imageRatio(dataUrl)
  if (!ratio || !Number.isFinite(ratio) || !(boxRatio > 0) || !Number.isFinite(boxRatio)) return
  const [left, top, visibleW, visibleH] = imageCrop(el, ratio, boxRatio)
  if (visibleW === 1 && visibleH === 1 && !left && !top) return
  const w = el.w / visibleW
  const h = el.h / visibleH
  return {
    w: pct(w), h: pct(h),
    sizing: { type: 'crop' as const, x: pct(w * left), y: pct(h * top), w: pct(el.w), h: pct(el.h) },
  }
}

/** Bake crop, bo góc, khung hình và viền ảnh thành PNG nền trong suốt cho PowerPoint/LibreOffice. */
async function renderImageForPptx(
  el: Deck['slides'][number]['elements'][number],
  dataUrl: string,
  defaultBorderColor: string,
): Promise<string> {
  if (typeof document === 'undefined') return dataUrl
  const needsCanvas = Boolean((el.shape && el.shape !== 'rect') ||
    (el.shape !== 'rect' && (el.radius ?? 10) > 0) || (el.border ?? 0) > 0)
  if (!needsCanvas) return dataUrl
  try {
    const img = await loadPptxImage(dataUrl)
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    const cw = Math.max(1, Math.min(1920, Math.round(el.w * 19.2)))
    const ch = Math.max(1, Math.min(1080, Math.round(el.h * 10.8)))
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl

    const path = buildImagePath(el, cw, ch)
    ctx.save()
    ctx.clip(path)

    const [left, top, w, h] = imageCrop(el, nw / nh, (el.w * 16) / (el.h * 9))
    ctx.drawImage(img, left * nw, top * nh, w * nw, h * nh, 0, 0, cw, ch)

    if ((el.border ?? 0) > 0 && el.shape !== 'pill') {
      const cqwPx = cw / Math.max(1, el.w)
      const borderPx = Math.max(1.5, ((el.border ?? 0) / 10) * cqwPx)
      ctx.strokeStyle = el.borderColor ?? defaultBorderColor
      ctx.lineWidth = borderPx * 2
      if (el.borderStyle === 'dashed') ctx.setLineDash([borderPx * 3, borderPx * 2])
      else if (el.borderStyle === 'dotted') ctx.setLineDash([borderPx, borderPx * 1.5])
      ctx.stroke(path)
    }

    ctx.restore()
    return canvas.toDataURL('image/png')
  } catch {
    return dataUrl
  }
}

/** PptxGenJS ghi `<a:pPr>` trước MỖI run, trong khi OOXML chỉ cho một `<a:pPr>` đầu đoạn — giữ cái đầu, bỏ phần thừa. */
export const dedupeParagraphProps = (xml: string): string =>
  xml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (para) => {
    let seen = false
    return para.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (m) => (seen ? '' : ((seen = true), m)))
  })

/** PptxGenJS ghi một bản ảnh cho mỗi lần chèn — giữ một bản cho mỗi nội dung, trỏ các slide về bản đó. */
export async function dedupeMedia(zip: import('jszip')): Promise<void> {
  const kept = new Map<string, string>()
  const moved = new Map<string, string>()
  for (const path of Object.keys(zip.files).filter((p) => p.startsWith('ppt/media/') && !zip.files[p].dir)) {
    const key = `${path.slice(path.lastIndexOf('.'))}:${await zip.file(path)!.async('base64')}`
    const name = path.slice('ppt/media/'.length)
    const first = kept.get(key)
    if (first === undefined) kept.set(key, name)
    else {
      moved.set(name, first)
      zip.remove(path)
    }
  }
  if (!moved.size) return
  for (const path of Object.keys(zip.files).filter((p) => p.endsWith('.rels'))) {
    const xml = await zip.file(path)!.async('string')
    zip.file(path, xml.replace(/(Target="[^"]*\/media\/)([^"]+)"/g, (_m, head: string, name: string) => `${head}${moved.get(name) ?? name}"`))
  }
}

export async function exportDeckPptx(deck: Deck): Promise<void> {
  const name = `${deck.title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'bai-giang'}.pptx`
  await trackExport(name, async () => {
    const data = await buildDeckPptx(deck)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }))
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  })
}

export async function buildDeckPptx(deck: Deck): Promise<ArrayBuffer> {
  if (deck.format === 'html') throw new Error('Bài giảng HTML chỉ trình chiếu trên web, không xuất PowerPoint được.')
  const theme = normalizeTheme(deck.theme)
  const [{ default: PptxGenJS }] = await Promise.all([import('pptxgenjs'), loadGraphics(), ensureFonts({ theme, slides: deck.slides })])
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.title = deck.title
  const textEffects = new Map<string, SlideElement>()
  const textEffectsName = (el: SlideElement) => {
    if (!el.textShadow && !el.textGradient) return undefined
    const name = `slide-text-${el.textShadow ? 'shadow' : 'gradient'}-${textEffects.size}`
    textEffects.set(name, el)
    return name
  }

  const slides = deck.slides.length > 0 ? deck.slides : [{ id: 'blank', background: '#ffffff', elements: [] }]
  for (const [slideIndex, source] of slides.entries()) {
    const slide = pptx.addSlide()
    // nền gradient: PPTX chỉ có nền màu đặc nên đặt màu đầu làm nền dự phòng rồi phủ ảnh gradient toàn trang
    slide.background = pptxPaint(source.background) ?? { color: hex(firstColor(source.background)) }
    const gradient = gradientSvg(source.background)
    if (gradient) slide.addImage({ data: `data:image/svg+xml;base64,${btoa(gradient)}`, x: 0, y: 0, w: '100%', h: '100%' })
    if (source.bgImage) {
      // ảnh đã cắt sẵn 16:9; lớp phủ cùng màu trung bình 30% như bản xem (`slideBgStyle`)
      slide.addImage({ data: await toDataUrl(source.bgImage), x: 0, y: 0, w: '100%', h: '100%' })
      slide.addShape('rect' as never, { x: 0, y: 0, w: '100%', h: '100%', fill: pptxFill(firstColor(source.background, '#000000'), 77 / 255), line: { type: 'none' } } as never)
    }

    const decor = decorSvg(theme.decor, `#${hex(theme.fg)}`, `#${hex(theme.secondary)}`)
    const addDecor = () => {
      if (decor) slide.addImage({ data: `data:image/svg+xml;base64,${btoa(decor)}`, x: 0, y: 0, w: '100%', h: '100%', objectName: `slide-decor-${theme.decor}` })
    }
    const addFooter = () => {
      if (!shouldShowSlideFooter(deck.footer, source, slideIndex)) return
      const ink = pptxPaint(theme.muted, 0.85)
      const footerFont = pptxFont(deck.theme.fontBody)
      const footerText = deck.footer?.text?.trim()
      if (footerText) {
        slide.addText(footerText, {
          x: pct(3.5),
          y: pct(93.5),
          w: pct(75),
          h: pct(5),
          fontSize: 10,
          fontFace: footerFont,
          ...ink,
          align: 'left',
          valign: 'bottom',
          margin: 0,
        })
      }
      if (deck.footer?.slideNumber) {
        slide.addText(String(slideIndex + 1), {
          x: pct(80),
          y: pct(93.5),
          w: pct(16.5),
          h: pct(5),
          fontSize: 10,
          fontFace: footerFont,
          ...ink,
          align: 'right',
          valign: 'bottom',
          margin: 0,
        })
      }
    }
    // ChartView có vị trí tuyệt đối và z-index mặc định. Footer nằm sau nội dung cùng z=10.
    const layers = [
      { z: 0, draw: addDecor },
      ...readableElements(source, theme).map(el => ({ z: el.type === 'chart' ? 0 : el.zIndex ?? 0, el })),
      { z: 10, draw: addFooter },
    ].sort((a, b) => a.z - b.z)
    for (const layer of layers) {
      if ('draw' in layer) {
        layer.draw()
        continue
      }
      const { el } = layer
      const inheritedFace = el.variant === 'body' ? theme.fontBody : theme.fontHeading
      const box = {
        x: pct(el.x),
        y: pct(el.y),
        w: pct(el.w),
        h: pct(el.h),
      }
      const rotate = el.rotation ?? 0
      const gradientFill = el.type === 'shape' && el.fill?.startsWith('linear-gradient(') ? gradientSvg(el.fill) : null
      if (el.type === 'text') {
        const face = el.fontFamily ?? inheritedFace
        const png = el.textArc ? curvedTextPng(el, slideFontStack(face), el.textColor ?? theme.fg) : undefined
        if (png) {
          const fill = pptxFill(el.fill)
          if (fill) slide.addShape('rect', { ...box, rotate, fill, line: { type: 'none' } })
          const href = el.href && normalizeSlideHref(el.href)
          slide.addImage({ ...box, data: png, rotate, flipH: el.flipX, flipV: el.flipY, hyperlink: href ? { url: href } : undefined, altText: el.text })
          continue
        }
        const baseBold = (el.fontWeight ?? 400) >= 600
        const size = pt(el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6))
        const align = el.align ?? 'left'
        // Bản xem canh giữa dọc ô có nền / valign=middle và để padding theo % bề rộng slide (1% = 7,2pt).
        const centered = !!el.fill || el.valign === 'middle'
        const padX = (el.fill ? 3 : 1) * 7.2
        const padY = (el.fill ? 1.5 : 1) * 7.2
        const safeHref = el.href ? normalizeSlideHref(el.href) : null
        const hyperlink = safeHref ? { url: safeHref } : undefined
        const highlight = pptxFill(el.highlight)?.color
        const strike = el.textDecoration === 'line-through' ? ('sngStrike' as const) : undefined
        const underline = el.textDecoration === 'underline' ? ({ style: 'sng' } as const) : undefined
        // Mỗi dòng là một đoạn, chữ **đậm** là run riêng. Mọi run mang cùng `align` và dòng cuối có
        // `breakLine`: PptxGenJS tách đoạn mỗi khi `align` của run đổi → trước đây chữ đậm nhảy xuống dòng.
        const runs: {
          text: string
          options: {
            bold: boolean
            align: typeof align
            breakLine?: boolean
            hyperlink?: { url: string }
            highlight?: string
            strike?: 'sngStrike'
            underline?: { style: 'sng' }
          }
        }[] = []
        for (const run of hasBold(el.text) ? boldRuns(el.text ?? '') : [{ text: el.text ?? '', bold: false }]) {
          (el.caps ? mathToPlain(run.text).toLocaleUpperCase('vi') : mathToPlain(run.text))
            .split('\n')
            .forEach((part, i) => {
              if (i > 0 && runs.length) runs[runs.length - 1].options.breakLine = true
              runs.push({
                text: part,
                options: {
                  bold: baseBold || run.bold,
                  align,
                  ...(hyperlink ? { hyperlink } : {}),
                  ...(highlight ? { highlight } : {}),
                  ...(strike ? { strike } : {}),
                  ...(underline ? { underline } : {}),
                },
              })
            })
        }
        slide.addText(runs.length ? runs : '', {
          ...box,
          rotate,
          fontSize: size,
          // khoảng cách dòng cố định theo pt, khớp line-height của bản xem (PowerPoint mặc định là 1,0)
          lineSpacing: Math.round(size * (el.lineHeight ?? 1.25) * 10) / 10,
          charSpacing: el.letterSpacing ? Math.round(el.letterSpacing * size * 10) / 10 : undefined,
          fontFace: pptxFont(face),
          objectName: textEffectsName(el),
          ...pptxTextEffects(el, theme.fg),
          bold: (el.fontWeight ?? 400) >= 600,
          italic: el.fontStyle === 'italic',
          underline,
          strike,
          highlight,
          align,
          valign: centered ? 'middle' : 'top',
          margin: [padX, padX, padY, padY],
          fit: 'shrink',
          fill: pptxFill(el.fill),
        })
      } else if (el.type === 'icon' && slideIconById(el.assetId)) {
        const Icon = slideIconById(el.assetId)!
        const svg = renderToStaticMarkup(createElement(Icon, { xmlns: 'http://www.w3.org/2000/svg', weight: 'duotone', color: el.textColor ?? theme.accent, size: 256 }))
        // icon vuông: đặt hình vuông nằm giữa hộp như bản web, không kéo giãn theo hộp chữ nhật (slide 10 × 5,625in)
        const w = (el.w / 100) * 10
        const h = (el.h / 100) * 5.625
        const side = Math.min(w, h)
        slide.addImage({
          data: `data:image/svg+xml;base64,${btoa(svg)}`,
          x: (el.x / 100) * 10 + (w - side) / 2,
          y: (el.y / 100) * 5.625 + (h - side) / 2,
          w: side,
          h: side,
          transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
          ...(el.href ? { hyperlink: { url: el.href } } : {}),
        })
      } else if (el.type === 'graphic' && el.graphicId) {
        const svg = graphicMarkup(el.graphicId, el.textColor ?? theme.fg, el.fill)
        if (svg) {
          slide.addImage({
            ...box,
            data: `data:image/svg+xml;base64,${btoa(svg)}`,
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            ...(el.href ? { hyperlink: { url: el.href } } : {}),
          })
        }
      } else if (el.type === 'connector') {
        // OOXML có preset này, dù union kiểu của PptxGenJS chưa liệt kê.
        slide.addShape('curvedConnector3' as Parameters<typeof slide.addShape>[0], {
          ...box,
          rotate,
          flipH: el.flipX,
          flipV: el.flipY,
          line: pptxLine(el.borderColor ?? theme.accent, el.border ?? 3, el.borderStyle),
        })
      } else if (gradientFill) {
        slide.addImage({ ...box, rotate, data: `data:image/svg+xml;base64,${btoa(gradientFill)}` })
      } else if (el.type === 'shape' && el.shape === 'line') {
        // đường thẳng: chạy dọc giữa hộp; đầu mũi tên là thuộc tính của nét
        const arrow = el.lineArrow ?? 'none'
        slide.addShape('line' as never, {
          x: box.x,
          y: pct(el.y + el.h / 2),
          w: box.w,
          h: pct(0),
          rotate,
          line: {
            ...pptxLine(el.fill ?? theme.accent, el.border ?? 4, el.borderStyle, el.opacity),
            ...(arrow === 'both' ? { beginArrowType: 'triangle' } : {}),
            ...(arrow !== 'none' ? { endArrowType: 'triangle' } : {}),
          },
        } as never)
      } else if (el.type === 'shape') {
        // viền/độ đục/bóng theo bản xem (canvas 1000px ↔ slide 720pt nên 1px ≈ 0,72pt)
        const level = el.shadowLevel ?? (el.shadow === true ? 2 : 0)
        const options = {
          ...box,
          rotate,
          fill: pptxFill(el.fill ?? theme.accent, el.opacity),
          line: pptxLine(el.borderColor ?? theme.borderColor, el.border ?? theme.border, el.borderStyle, el.opacity),
          ...(el.href ? { hyperlink: { url: el.href } } : {}),
          ...(level > 0 ? { shadow: { type: 'outer', blur: [0, 4, 8, 14][level], offset: [0, 2, 4, 6][level], angle: 90, color: '0F172A', opacity: [0, 0.25, 0.3, 0.4][level] } } : {}),
        }
        const kind = prstOf(el.shape) as never
        if (isStrokeOnlyShape(el.shape)) {
          // đường nối gấp khúc/cong: chỉ có nét, màu nét lấy từ màu tô
          slide.addShape(kind, { ...box, rotate, line: pptxLine(el.fill ?? theme.accent, Math.max(el.border ?? theme.border, 3), el.borderStyle, el.opacity), ...(el.href ? { hyperlink: { url: el.href } } : {}) } as never)
          continue
        }
        if (el.text?.trim()) {
          const curvedBox = { ...el, w: el.w * 0.76, h: el.h * 0.8, align: el.align ?? 'center' as const }
          const png = el.textArc ? curvedTextPng(curvedBox, slideFontStack(el.fontFamily ?? theme.fontBody), el.textColor ?? readableTextOn(el.fill ?? theme.accent)) : undefined
          if (png) {
            slide.addShape(kind, options as never)
            slide.addImage({ data: png, x: pct(el.x + el.w * 0.12), y: pct(el.y + el.h * 0.1), w: pct(curvedBox.w), h: pct(curvedBox.h), rotate, flipH: el.flipX, flipV: el.flipY, altText: el.text })
            continue
          }
          // hình có chữ: PowerPoint giữ chữ bên trong hình (sửa được), không phải hộp chữ chồng lên
          const plainShapeText = mathToPlain(el.text)
          slide.addText(
            [{ text: plainShapeText, options: el.href ? { hyperlink: { url: el.href } } : {} }],
            {
              ...options,
              shape: kind,
              align: el.align ?? 'center',
              valign: 'middle',
              margin: 4,
              fit: 'shrink',
              fontSize: pt(el.fontSize ?? 2.4),
              fontFace: pptxFont(el.fontFamily ?? theme.fontBody),
              objectName: textEffectsName(el),
              ...pptxTextEffects(el, readableTextOn(el.fill ?? theme.accent)),
              bold: (el.fontWeight ?? 600) >= 600,
              italic: el.fontStyle === 'italic',
              strike: el.textDecoration === 'line-through' ? 'sngStrike' : undefined,
              underline: el.textDecoration === 'underline' ? { style: 'sng' } : undefined,
            } as never,
          )
        } else {
          slide.addShape(kind, options as never)
        }
      } else if (el.type === 'video') {
        // YouTube nhúng được (PowerPoint mới phát trực tuyến); Vimeo/tệp: khung đen có nút ▶ bấm mở link
        const v = parseSlideVideo(el.src)
        if (v?.kind === 'youtube') {
          let cover: string | undefined
          try {
            cover = await toDataUrl(v.thumb)
          } catch {
            cover = undefined
          }
          slide.addMedia({ ...box, type: 'online', link: v.link, ...(cover ? { cover } : {}) })
        } else {
          slide.addText('▶  Video', {
            ...box,
            shape: 'rect',
            fill: { color: '111111' },
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
            fontSize: 20,
            ...(v ? { hyperlink: { url: v.link } } : {}),
          } as never)
        }
      } else if (el.type === 'image' && !el.src) {
        slide.addImage({
          ...box, rotate, flipH: el.flipX, flipV: el.flipY,
          data: `data:image/svg+xml;base64,${btoa(imagePlaceholderSvg(el, theme))}`,
          transparency: (1 - (el.opacity ?? 1)) * 100,
          objectName: 'slide-image-placeholder',
        })
      } else if (el.type === 'image' && el.src) {
        const rawUrl = await toDataUrl(el.src)
        const bakedUrl = await renderImageForPptx(el, rawUrl, theme.borderColor)
        const level = el.shadowLevel ?? 0
        slide.addImage({
          ...box,
          ...(bakedUrl === rawUrl ? await nativeImageCrop(el, rawUrl) : {}),
          data: bakedUrl,
          ...(rotate ? { rotate } : {}),
          ...(el.flipX ? { flipH: true } : {}),
          ...(el.flipY ? { flipV: true } : {}),
          ...(el.opacity !== undefined && el.opacity < 1 ? { transparency: Math.round((1 - el.opacity) * 100) } : {}),
          ...(level > 0
            ? {
                shadow: {
                  type: 'outer',
                  blur: [0, 4, 8, 14][level],
                  offset: [0, 2, 4, 6][level],
                  angle: 90,
                  color: '0F172A',
                  opacity: [0, 0.25, 0.3, 0.4][level],
                },
              }
            : {}),
          ...(typeof document === 'undefined' && el.shape === 'ellipse' ? { rounding: true } : {}),
          ...(el.href ? { hyperlink: { url: el.href } } : {}),
        })
      } else if (el.type === 'table' && el.rows?.length) {
        slide.addTable(
          el.rows.map((row, ri) =>
            row.map((cell, ci) => {
              const customFill = el.cellFills?.[ri]?.[ci]
              const fill = customFill ?? (ri === 0 ? theme.accent : ri % 2 === 0 ? theme.surface : undefined)
              const foreground = fill && fill !== 'transparent' && (ri === 0 || customFill) ? readableTextOn(fill) : theme.fg
              return {
                text: mathToPlain(cell),
                options: {
                  fill: pptxFill(fill),
                  ...pptxPaint(foreground),
                  bold: ri === 0,
                },
              }
            }),
          ),
          {
            ...box,
            fontSize: 12,
            valign: 'middle',
            border: { type: 'solid', color: hex(theme.muted, 'BFBFBF'), pt: strokePt(1) },
          },
        )
      } else if (el.type === 'chart' && el.chart?.data.length) {
        const palette = theme.chart.length ? theme.chart : ['#2563eb']
        const chartColors = el.chart.type === 'line' ? [hex(palette[0])]
          : el.chart.data.map((_, i) => hex(palette[i % palette.length]))
        slide.addChart(
          el.chart.type as never,
          [
            {
              name: 'Dữ liệu',
              labels: el.chart.data.map((d) => d.label),
              values: el.chart.data.map((d) => d.value),
            },
          ],
          {
            // addChart không đọc toạ độ dạng "%" (đặt về 1in,1in) → đổi sang inch của slide 10 × 5,625
            x: (el.x / 100) * 10,
            y: (el.y / 100) * 5.625,
            w: (el.w / 100) * 10,
            h: (el.h / 100) * 5.625,
            showLegend: true,
            showValue: true,
            chartColors,
          },
        )
      }
    }

    if (source.notes?.trim()) slide.addNotes(source.notes)
  }

  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync((await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer)
  for (const path of Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))) {
    const xml = dedupeParagraphProps(await zip.file(path)!.async('string'))
    // PptxGenJS bỏ phần fill của ô khi không truyền màu; ghi noFill để không kế thừa kiểu bảng.
    const tableFills = xml.replace(/(<\/a:lnB>)(\s*<\/a:tcPr>)/g, '$1<a:noFill/>$2')
    zip.file(path, applyRunEffects(tableFills, textEffects))
  }
  await dedupeMedia(zip)
  return zip.generateAsync({ type: 'arraybuffer' })
}
