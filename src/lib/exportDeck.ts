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

const hex = (value: string | undefined, fallback = 'FFFFFF') => {
  const v = (value ?? '').replace('#', '').trim()
  return /^[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : fallback
}

/** cỡ chữ của deck là cqw (1% bề rộng); slide 16:9 rộng 10in → 1cqw = 7,2pt */
const pt = (cqw: number) => Math.round(cqw * 7.2 * 10) / 10

/** toạ độ % của deck → kiểu `Coord` của PptxGenJS (template literal) */
const pct = (value: number) => `${value}%` as `${number}%`

const SHAPES: Record<string, string> = {
  rect: 'rect',
  round: 'roundRect',
  ellipse: 'ellipse',
  triangle: 'triangle',
  arrow: 'rightArrow',
}

export async function exportDeckPptx(deck: Deck): Promise<void> {
  if (deck.format === 'html') throw new Error('Bài giảng HTML chỉ trình chiếu trên web, không xuất PowerPoint được.')
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  pptx.title = deck.title

  const slides = deck.slides.length > 0 ? deck.slides : [{ id: 'blank', background: '#ffffff', elements: [] }]
  for (const source of slides) {
    const slide = pptx.addSlide()
    slide.background = { color: hex(source.background) }

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
        // Chữ có **đậm** xuất thành các đoạn (run) để PowerPoint giữ nhấn mạnh.
        const runs = hasBold(el.text)
          ? boldRuns(el.text ?? '').map((run) => ({ text: mathToPlain(run.text), options: { bold: baseBold || run.bold } }))
          : mathToPlain(el.text ?? '')
        slide.addText(runs, {
          ...box,
          rotate,
          fontSize: pt(el.fontSize ?? (el.variant === 'body' ? 2.4 : 3.6)),
          fontFace:
            el.fontFamily ??
            (el.variant === 'body' ? deck.theme.fontBody : deck.theme.fontHeading),
          color: hex(el.textColor ?? deck.theme.fg),
          bold: (el.fontWeight ?? 400) >= 600,
          italic: el.fontStyle === 'italic',
          underline: el.textDecoration === 'underline' ? { style: 'sng' } : undefined,
          align: el.align ?? 'left',
          valign: 'top',
          margin: 0,
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
      } else if (el.type === 'shape') {
        slide.addShape((SHAPES[el.shape ?? 'rect'] ?? 'rect') as never, {
          ...box,
          rotate,
          fill: { color: hex(el.fill ?? deck.theme.accent) },
          line: { color: hex(el.fill ?? deck.theme.accent), width: 0 },
        })
      } else if (el.type === 'image' && el.src) {
        const image = el.src.startsWith('data:') ? { data: el.src } : { path: el.src }
        slide.addImage({ ...box, ...image, ...(el.shape === 'ellipse' ? { rounding: true } : {}) })
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

  const name = deck.title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'bai-giang'
  await pptx.writeFile({ fileName: `${name}.pptx` })
}
