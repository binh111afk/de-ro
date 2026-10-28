/**
 * Xuất bài giảng ra .pptx (Tệp → Tải xuống file).
 *
 * `pptxgenjs` được nạp động: chỉ tải khi người dùng bấm tải, không nằm trong
 * bundle chính. Toạ độ của deck là % (0–100) nên truyền thẳng dạng `"12%"`
 * — PptxGenJS hiểu % theo kích thước slide 16:9.
 */
import { boldRuns, hasBold, mathToPlain } from './slideMath'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Deck } from '@/store/docs'
import { elementHeight } from './slideText'
import { readableTextOn } from './slideTheme'
import { isSlideAssetId, SLIDE_ASSETS } from './slideAssets'
import { graphicMarkup } from './slideGraphics'
import { firstColor, gradientSvg } from './slideBackground'
import { isStrokeOnlyShape, prstOf } from './slidePresets'
import { toDataUrl } from './mediaStore'

const hex = (value: string | undefined, fallback = 'FFFFFF') => {
  const v = (value ?? '').replace('#', '').trim()
  return /^[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : fallback
}

/** Phông có sẵn trên Windows/Mac cùng PowerPoint; phông web (Be Vietnam Pro…) không nằm trong .pptx nên đổi sang Arial. */
const SAFE_FONTS = ['Times New Roman', 'Arial', 'Georgia', 'Tahoma', 'Verdana', 'Segoe UI', 'Calibri', 'Courier New']
const pptxFont = (stack: string | undefined) => {
  const first = (stack ?? '').split(',')[0].replace(/['"]/g, '').trim()
  return SAFE_FONTS.find((f) => f.toLowerCase() === first.toLowerCase()) ?? 'Arial'
}

/** cỡ chữ của deck là cqw (1% bề rộng); slide 16:9 rộng 10in → 1cqw = 7,2pt */
const pt = (cqw: number) => Math.round(cqw * 7.2 * 10) / 10

/** toạ độ % của deck → kiểu `Coord` của PptxGenJS (template literal) */
const pct = (value: number) => `${value}%` as `${number}%`


/** PptxGenJS ghi `<a:pPr>` trước MỖI run, trong khi OOXML chỉ cho một `<a:pPr>` đầu đoạn — giữ cái đầu, bỏ phần thừa. */
export const dedupeParagraphProps = (xml: string): string =>
  xml.replace(/<a:p>[\s\S]*?<\/a:p>/g, (para) => {
    let seen = false
    return para.replace(/<a:pPr\b[^>]*?(?:\/>|>[\s\S]*?<\/a:pPr>)/g, (m) => (seen ? '' : ((seen = true), m)))
  })

export async function exportDeckPptx(deck: Deck): Promise<void> {
  const data = await buildDeckPptx(deck)
  const name = deck.title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'bai-giang'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }))
  a.download = `${name}.pptx`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function buildDeckPptx(deck: Deck): Promise<ArrayBuffer> {
  if (deck.format === 'html') throw new Error('Bài giảng HTML chỉ trình chiếu trên web, không xuất PowerPoint được.')
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.title = deck.title

  const slides = deck.slides.length > 0 ? deck.slides : [{ id: 'blank', background: '#ffffff', elements: [] }]
  for (const source of slides) {
    const slide = pptx.addSlide()
    // nền gradient: PPTX chỉ có nền màu đặc nên đặt màu đầu làm nền dự phòng rồi phủ ảnh gradient toàn trang
    slide.background = { color: hex(firstColor(source.background)) }
    const gradient = gradientSvg(source.background)
    if (gradient) slide.addImage({ data: `data:image/svg+xml;base64,${btoa(gradient)}`, x: 0, y: 0, w: '100%', h: '100%' })
    if (source.bgImage) {
      // ảnh đã cắt sẵn 16:9; lớp phủ cùng màu trung bình 30% như bản xem (`slideBgStyle`)
      slide.addImage({ data: await toDataUrl(source.bgImage), x: 0, y: 0, w: '100%', h: '100%' })
      slide.addShape('rect' as never, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: hex(source.background), transparency: 70 }, line: { type: 'none' } } as never)
    }

    const elements = [...source.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    for (const el of elements) {
      const box = {
        x: pct(el.x),
        y: pct(el.y),
        w: pct(el.w),
        h: pct(el.type === 'text' ? elementHeight(el) : el.h),
      }
      const rotate = el.rotation ?? 0
      if (el.type === 'text') {
        const baseBold = (el.fontWeight ?? 400) >= 600
        const size = pt(el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6))
        const align = el.align ?? 'left'
        // Bản xem canh giữa dọc ô có nền / valign=middle và để padding theo % bề rộng slide (1% = 7,2pt).
        const centered = !!el.fill || el.valign === 'middle'
        const padX = (el.fill ? 3 : 1) * 7.2
        const padY = (el.fill ? 1.5 : 1) * 7.2
        // Mỗi dòng là một đoạn, chữ **đậm** là run riêng. Mọi run mang cùng `align` và dòng cuối có
        // `breakLine`: PptxGenJS tách đoạn mỗi khi `align` của run đổi → trước đây chữ đậm nhảy xuống dòng.
        const runs: { text: string; options: { bold: boolean; align: typeof align; breakLine?: boolean } }[] = []
        for (const run of hasBold(el.text) ? boldRuns(el.text ?? '') : [{ text: el.text ?? '', bold: false }]) {
          mathToPlain(run.text)
            .split('\n')
            .forEach((part, i) => {
              if (i > 0 && runs.length) runs[runs.length - 1].options.breakLine = true
              runs.push({ text: part, options: { bold: baseBold || run.bold, align } })
            })
        }
        slide.addText(runs.length ? runs : '', {
          ...box,
          h: pct(centered ? el.h : elementHeight(el)),
          rotate,
          fontSize: size,
          // khoảng cách dòng cố định theo pt, khớp line-height của bản xem (PowerPoint mặc định là 1,0)
          lineSpacing: Math.round(size * (el.lineHeight ?? 1.25) * 10) / 10,
          charSpacing: el.letterSpacing ? Math.round(el.letterSpacing * size * 10) / 10 : undefined,
          fontFace: pptxFont(el.fontFamily ?? (el.variant === 'body' ? deck.theme.fontBody : deck.theme.fontHeading)),
          color: hex(el.textColor ?? deck.theme.fg),
          bold: (el.fontWeight ?? 400) >= 600,
          italic: el.fontStyle === 'italic',
          underline: el.textDecoration === 'underline' ? { style: 'sng' } : undefined,
          align,
          valign: centered ? 'middle' : 'top',
          margin: [padX, padX, padY, padY],
          fit: 'shrink',
          fill: el.fill ? { color: hex(el.fill) } : undefined,
        })
      } else if (el.type === 'icon' && isSlideAssetId(el.assetId)) {
        const Icon = SLIDE_ASSETS[el.assetId].icon
        const svg = renderToStaticMarkup(createElement(Icon, { xmlns: 'http://www.w3.org/2000/svg', weight: 'duotone', color: `#${hex(el.textColor ?? deck.theme.accent)}`, size: 256 }))
        slide.addImage({ ...box, data: `data:image/svg+xml;base64,${btoa(svg)}` })
      } else if (el.type === 'graphic' && el.graphicId) {
        const svg = graphicMarkup(el.graphicId, `#${hex(el.textColor ?? deck.theme.fg)}`)
        if (svg) {
          slide.addImage({ ...box, data: `data:image/svg+xml;base64,${btoa(svg)}` })
        }
      } else if (el.type === 'connector') {
        slide.addShape('line' as never, {
          ...box,
          flipV: el.flipY,
          line: { color: hex(el.borderColor ?? deck.theme.accent), width: (el.border ?? 3) * 0.75 },
        } as never)
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
            color: hex(el.fill ?? deck.theme.accent),
            width: (el.border ?? 4) * 0.72,
            ...(arrow === 'both' ? { beginArrowType: 'triangle' } : {}),
            ...(arrow !== 'none' ? { endArrowType: 'triangle' } : {}),
          },
        } as never)
      } else if (el.type === 'shape') {
        // viền/độ đục/bóng theo bản xem (canvas 1000px ↔ slide 720pt nên 1px ≈ 0,72pt)
        const fill = hex(el.fill ?? deck.theme.accent)
        const level = el.shadowLevel ?? (el.shadow === true ? 2 : 0)
        const options = {
          ...box,
          rotate,
          fill: { color: fill, transparency: Math.round((1 - (el.opacity ?? 1)) * 100) },
          line: el.border ? { color: hex(el.borderColor ?? '#111827'), width: el.border * 0.72 } : { type: 'none' },
          ...(level > 0 ? { shadow: { type: 'outer', blur: [0, 4, 8, 14][level], offset: [0, 2, 4, 6][level], angle: 90, color: '0F172A', opacity: [0, 0.25, 0.3, 0.4][level] } } : {}),
        }
        const kind = prstOf(el.shape) as never
        if (isStrokeOnlyShape(el.shape)) {
          // đường nối gấp khúc/cong: chỉ có nét, màu nét lấy từ màu tô
          slide.addShape(kind, { ...box, rotate, line: { color: fill, width: Math.max(el.border ?? 0, 3) * 0.72 } } as never)
          continue
        }
        if (el.text?.trim()) {
          // hình có chữ: PowerPoint giữ chữ bên trong hình (sửa được), không phải hộp chữ chồng lên
          slide.addText(mathToPlain(el.text), {
            ...options,
            shape: kind,
            align: el.align ?? 'center',
            valign: 'middle',
            margin: 4,
            fit: 'shrink',
            fontSize: pt(el.fontSize ?? 2.4),
            fontFace: pptxFont(el.fontFamily ?? deck.theme.fontBody),
            color: hex(el.textColor ?? readableTextOn(el.fill ?? deck.theme.accent)),
            bold: (el.fontWeight ?? 600) >= 600,
            italic: el.fontStyle === 'italic',
          } as never)
        } else {
          slide.addShape(kind, options as never)
        }
      } else if (el.type === 'image' && el.src) {
        slide.addImage({ ...box, data: await toDataUrl(el.src), ...(el.shape === 'ellipse' ? { rounding: true } : {}) })
      } else if (el.type === 'table' && el.rows?.length) {
        const headerFg = readableTextOn(deck.theme.accent)
        const bodyBg = deck.theme.surface ?? deck.theme.bg
        slide.addTable(
          el.rows.map((row, ri) =>
            row.map((cell) => ({
              text: mathToPlain(cell),
              options: {
                fill: {
                  color: hex(ri === 0 ? deck.theme.accent : ri % 2 === 0 ? bodyBg : deck.theme.bg),
                },
                color: hex(ri === 0 ? headerFg : deck.theme.fg),
                bold: ri === 0,
              },
            })),
          ),
          {
            ...box,
            fontSize: 12,
            valign: 'middle',
            border: { type: 'solid', color: hex(deck.theme.muted, 'BFBFBF'), pt: 1 },
          },
        )
      } else if (el.type === 'chart' && el.chart?.data.length) {
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
            ...box,
            showLegend: true,
            showValue: true,
            chartColors: [hex(el.fill ?? deck.theme.accent)],
          },
        )
      }
    }

    if (source.notes?.trim()) slide.addNotes(source.notes)
  }

  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync((await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer)
  for (const path of Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))) {
    zip.file(path, dedupeParagraphProps(await zip.file(path)!.async('string')))
  }
  return zip.generateAsync({ type: 'arraybuffer' })
}
