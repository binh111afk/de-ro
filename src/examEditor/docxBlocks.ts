/**
 * Xuất tài liệu đề (ExamDoc) ra Word .docx thật (OOXML, thư viện `docx`).
 * Bố cục bám bản HTML ở `exportBlocks.ts` (A4, lề 1,8 × 1,6 cm, Times New Roman 13pt, phương án 2 cột bằng bảng).
 *
 * Công thức `$…$` / `$$…$$` thành equation Word (xem `lib/latexMath.ts`).
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  LevelFormat,
  Math as OMath,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
  type IRunOptions,
  type ParagraphChild,
} from 'docx'
import type { ExamBlock, ExamDoc, FormatAttrs, RichText, Span } from '@/data/docTypes'
import { latexToMath } from '@/lib/latexMath'
import { toDataUrl } from '@/lib/mediaStore'
import { estimateChoiceCols } from './choiceCols'
import { splitRichLines } from './convert'

/** Các tuỳ chọn của `docx` đều readonly; ta dựng dần nên cần bản ghi được. */
type Mut<T> = { -readonly [K in keyof T]: T[K] }

const PX = 15 // 1 px (96 dpi) = 15 twips
const PAGE_W = 11906
const PAGE_H = 16838
const MARGIN_V = 1020 // 1,8 cm
const MARGIN_H = 907 // 1,6 cm
const CONTENT_W = PAGE_W - 2 * MARGIN_H
const OPT_INDENT = 22 * PX
const SIZE = 26 // nửa điểm: 13pt

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }
const LINE = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const BOX = { top: LINE, bottom: LINE, left: LINE, right: LINE }

interface Base {
  bold?: boolean
  italics?: boolean
  size?: number
  /** chữ hoa như `text-transform: uppercase` của bản HTML */
  caps?: boolean
}

const hex = (c: unknown): string | undefined => {
  const m = typeof c === 'string' ? c.match(/^#?([0-9a-f]{6})$/i) : null
  return m ? m[1].toUpperCase() : undefined
}

/** '14pt' / '18px' / '14' → nửa điểm. */
function halfPoints(v: unknown): number | undefined {
  const m = String(v ?? '').match(/^([\d.]+)\s*(pt|px)?$/i)
  if (!m) return undefined
  const n = Number(m[1])
  return Math.round(m[2]?.toLowerCase() === 'px' ? n * 1.5 : n * 2)
}


/* ---------------------------- ảnh trong dòng ---------------------------- */

type ImgType = 'png' | 'jpg' | 'gif'
interface Decoded {
  type: ImgType
  data: Uint8Array
  w: number
  h: number
}

/** Đọc kích thước thật từ đầu file PNG / JPEG / GIF; định dạng khác (WebP, SVG…) trả null. */
function decodeImage(src: string): Decoded | null {
  const m = src.match(/^data:image\/[a-z+.-]+;base64,(.+)$/i)
  if (!m) return null
  let bin: string
  try {
    bin = atob(m[1])
  } catch {
    return null
  }
  const d = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  if (d.length > 24 && d[0] === 0x89 && d[1] === 0x50 && d[2] === 0x4e && d[3] === 0x47) {
    const v = new DataView(d.buffer)
    return { type: 'png', data: d, w: v.getUint32(16), h: v.getUint32(20) }
  }
  if (d.length > 10 && d[0] === 0x47 && d[1] === 0x49 && d[2] === 0x46) {
    return { type: 'gif', data: d, w: d[6] | (d[7] << 8), h: d[8] | (d[9] << 8) }
  }
  if (d.length > 4 && d[0] === 0xff && d[1] === 0xd8) {
    let i = 2
    while (i + 9 < d.length) {
      if (d[i] !== 0xff) {
        i++
        continue
      }
      const mk = d[i + 1]
      if (mk === 0xff) {
        i++
        continue
      }
      if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) {
        return { type: 'jpg', data: d, w: (d[i + 7] << 8) | d[i + 8], h: (d[i + 5] << 8) | d[i + 6] }
      }
      i += 2 + ((d[i + 2] << 8) | d[i + 3])
    }
  }
  return null
}

const IMG_MAX_PX = 672 // bề rộng vùng chữ (CONTENT_W / PX)
const IMG_DEFAULT_MAX_PX = 529 // ~14 cm

function imageRun(img: NonNullable<Span['image']>): ParagraphChild[] {
  const dec = decodeImage(img.src)
  if (!dec || !dec.w || !dec.h) return []
  let w = img.width && img.width > 0 ? Math.min(img.width, IMG_MAX_PX) : Math.min(dec.w, IMG_DEFAULT_MAX_PX)
  let h = (w * dec.h) / dec.w
  if (h > 900) {
    h = 900
    w = (h * dec.w) / dec.h
  }
  return [new ImageRun({ type: dec.type, data: dec.data, transformation: { width: Math.round(w), height: Math.round(h) }, altText: { name: 'image', description: img.alt ?? '', title: img.alt ?? '' } })]
}

/**
 * Nạp trước mọi ảnh trong tài liệu: `src` dạng `/api/files/...` → data URL (bước async), để `buildDocx` vẫn đồng bộ.
 * Ảnh không đọc được thì bỏ, không làm hỏng file.
 */
export async function inlineDocImages<T>(value: T): Promise<T> {
  if (Array.isArray(value)) return (await Promise.all(value.map((v) => inlineDocImages(v)))) as T
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(o)) {
      if (k === 'image' && v && typeof v === 'object' && typeof (v as { src?: unknown }).src === 'string' && 'text' in o) {
        const img = v as NonNullable<Span['image']>
        try {
          out[k] = { ...img, src: await toDataUrl(img.src) }
        } catch {
          // bỏ ảnh
        }
      } else out[k] = await inlineDocImages(v)
    }
    return out as T
  }
  return value
}

function spanRuns(s: Span, base: Base): ParagraphChild[] {
  if (s.image) return imageRun(s.image)
  const opts: Mut<IRunOptions> = {
    bold: base.bold,
    italics: base.italics,
    size: base.size,
    allCaps: base.caps,
  }
  for (const m of s.marks ?? []) {
    const a = m.attrs ?? {}
    switch (m.type) {
      case 'bold':
        opts.bold = true
        break
      case 'italic':
        opts.italics = true
        break
      case 'underline':
        opts.underline = {}
        break
      case 'strike':
        opts.strike = true
        break
      case 'sub':
        opts.subScript = true
        break
      case 'super':
        opts.superScript = true
        break
      case 'boxed':
        opts.border = { ...LINE, space: 1 }
        break
      case 'highlight':
        opts.shading = { type: ShadingType.CLEAR, color: 'auto', fill: hex(a.color) ?? 'FFF3A3' }
        break
      case 'textStyle': {
        const font = typeof a.fontFamily === 'string' ? a.fontFamily.split(',')[0].replace(/["']/g, '').trim() : undefined
        if (font) opts.font = font
        const size = halfPoints(a.fontSize)
        if (size) opts.size = size
        const color = hex(a.color)
        if (color) opts.color = color
        break
      }
    }
  }
  // công thức tách riêng thành equation; '\n' trong chữ thường thành xuống dòng mềm
  const out: ParagraphChild[] = []
  let at = 0
  const text = (t: string) => {
    if (t) t.split('\n').forEach((line, i) => out.push(new TextRun({ ...opts, text: line, break: i > 0 ? 1 : undefined })))
  }
  for (const m of s.text.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g)) {
    text(s.text.slice(at, m.index))
    out.push(new OMath({ children: latexToMath(m[1] ?? m[2]) }))
    at = m.index + m[0].length
  }
  text(s.text.slice(at))
  return out
}

/** Rich text → các run; `string` và mảng trộn string + span đều nhận. */
function runs(rt: RichText, base: Base = {}): ParagraphChild[] {
  const spans: Span[] = typeof rt === 'string' ? [{ text: rt }] : (rt as Array<Span | string>).map((s) => (typeof s === 'string' ? { text: s } : s))
  return spans.flatMap((s) => spanRuns(s, base))
}

const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.BOTH,
} as const

/** FormatAttrs → thuộc tính đoạn (căn lề, giãn dòng, thụt lề, khoảng cách, viền, nền). */
function fmtOpts(f: FormatAttrs | undefined): IParagraphOptions {
  if (!f) return {}
  const o: Mut<IParagraphOptions> = {}
  if (f.align) o.alignment = ALIGN[f.align]
  if (f.dir === 'rtl') o.bidirectional = true
  const spacing: Mut<NonNullable<IParagraphOptions['spacing']>> = {}
  if (f.lineHeight != null) spacing.line = Math.round(f.lineHeight * 240)
  if (f.spaceBefore != null) spacing.before = f.spaceBefore * PX
  if (f.spaceAfter != null) spacing.after = f.spaceAfter * PX
  if (Object.keys(spacing).length) o.spacing = spacing
  const indent: Mut<NonNullable<IParagraphOptions['indent']>> = {}
  if (f.indentLeft != null) indent.left = f.indentLeft * PX
  if (f.indentFirstLine != null) indent.firstLine = f.indentFirstLine * PX
  if (Object.keys(indent).length) o.indent = indent
  const fill = hex(f.shading)
  if (fill) o.shading = { type: ShadingType.CLEAR, color: 'auto', fill }
  if (f.borders && f.borders !== 'none') {
    const b = { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 }
    o.border = f.borders === 'box' ? { top: b, bottom: b, left: b, right: b } : { [f.borders]: b }
  }
  return o
}

/** Có ảnh (hoặc xuống dòng mềm) thì căn trái: căn đều sẽ giãn cả dòng đứng trước chỗ ngắt. */
const hasImage = (rt: RichText) => typeof rt !== 'string' && (rt as Array<Span | string>).some((s) => typeof s !== 'string' && s.image)
const justify = (rt: RichText) => (hasImage(rt) ? AlignmentType.LEFT : AlignmentType.BOTH)

/** Tách ảnh khỏi đề bài để đặt vào ô bên cạnh (chỉ khi imagePosition là left/right). */
function sideImage(text: RichText, pos: 'left' | 'right' | undefined) {
  if (!pos || typeof text === 'string') return null
  const spans = text as Array<Span | string>
  const imgs = spans.filter((s): s is Span => typeof s !== 'string' && !!s.image && !!decodeImage(s.image.src))
  if (!imgs.length) return null
  return { pos, imgs, rest: spans.filter((s) => !imgs.includes(s as Span)) as RichText }
}

/** Bảng 2 ô không viền: đề bài một bên, ảnh một bên. */
function sideTable(pos: 'left' | 'right', textParas: Paragraph[], imgs: Span[]) {
  const px = Math.min(Math.max(...imgs.map((s) => s.image?.width ?? 0), 1) || 1, IMG_MAX_PX)
  const imgW = Math.min(Math.round(px * PX) + 200, Math.round(CONTENT_W * 0.5))
  const imgCell = plainCell(imgW, imgs.map((s) => para(imageRun(s.image!), { alignment: AlignmentType.CENTER })))
  const txt = plainCell(CONTENT_W - imgW, textParas)
  const [a, b, wa, wb] = pos === 'left' ? [imgCell, txt, imgW, CONTENT_W - imgW] : [txt, imgCell, CONTENT_W - imgW, imgW]
  return borderless([new TableRow({ children: [a, b] })], [wa, wb])
}

const para = (children: ParagraphChild[], o: IParagraphOptions = {}) => new Paragraph({ ...o, children })

/** Ô bảng không viền; mỗi dòng (`\n`) của rich text là một đoạn riêng. */
function plainCell(width: number, lines: Paragraph[]) {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, borders: NO_BORDERS, children: lines.length ? lines : [para([])] })
}

function borderless(rows: TableRow[], widths: number[], indent = 0) {
  return new Table({
    rows,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    indent: { size: indent, type: WidthType.DXA },
    borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
  })
}

const chunk = <T>(arr: T[], n: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

const fmt = (n: number) => n.toLocaleString('vi-VN', { minimumFractionDigits: n % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })

interface Ctx {
  q: number
  essay: number
  /** mỗi danh sách đánh số một `instance` riêng để bắt đầu lại từ 1 */
  lists: number
}

type Out = Paragraph | Table

function blockToDocx(b: ExamBlock, ctx: Ctx): Out[] {
  switch (b.type) {
    case 'header': {
      const cell = (rt: RichText, w: number) =>
        plainCell(
          w,
          splitRichLines(rt).map((line) => para(runs(line, { bold: true, size: 23 }), { alignment: AlignmentType.CENTER })),
        )
      const left = Math.round(CONTENT_W * 0.31)
      return [borderless([new TableRow({ children: [cell(b.left, left), cell(b.right, CONTENT_W - left)] })], [left, CONTENT_W - left]), para([], { spacing: { after: 90 } })]
    }

    case 'title':
      return [para(runs(b.text, { bold: true, size: 30, caps: true }), { alignment: AlignmentType.CENTER, spacing: { after: 90 }, ...fmtOpts(b.format) })]

    case 'meta':
      return [
        para(
          b.rows.flatMap(([k, v], i) => [
            ...(i ? [new TextRun({ text: '  •  ', size: 24 })] : []),
            new TextRun({ text: `${k}: `, bold: true, size: 24 }),
            ...runs(v, { size: 24 }),
          ]),
          { alignment: AlignmentType.CENTER, spacing: { after: 60 } },
        ),
      ]

    case 'student':
      return [para(runs(b.text, { size: 25 }), { spacing: { before: 120, after: 150 }, ...fmtOpts(b.format) })]

    case 'heading': {
      const level = b.level ?? 1
      return [
        para(runs(b.text, { bold: true, size: level === 1 ? 26 : 25, caps: level !== 3 }), {
          alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: level === 1 ? 240 : 180, after: 120 },
          keepNext: true,
          ...fmtOpts(b.format),
        }),
      ]
    }

    case 'paragraph':
      return [para(runs(b.text), { alignment: AlignmentType.BOTH, spacing: { after: 90 }, ...fmtOpts(b.format) })]

    case 'bullets': {
      const instance = ++ctx.lists
      return b.items.map((item, n) =>
        para(runs(item), {
          numbering: { reference: b.ordered ? 'ord' : 'bul', level: Math.min(b.levels?.[n] ?? 0, 2), instance },
          ...fmtOpts(b.format),
        }),
      )
    }

    case 'grid': {
      const cols = b.cols || 2
      const w = Math.floor(CONTENT_W / cols)
      return [
        borderless(
          chunk(b.cells, cols).map(
            (row) => new TableRow({ children: Array.from({ length: cols }, (_, i) => plainCell(w, row[i] != null ? [para(runs(row[i]), fmtOpts(b.format))] : [])) }),
          ),
          Array(cols).fill(w),
        ),
      ]
    }

    case 'question': {
      ctx.q += 1
      const side = sideImage(b.text, b.imagePosition)
      const headText = side ? side.rest : b.text
      const headPara = para([new TextRun({ text: `Câu ${ctx.q}. `, bold: true }), ...runs(headText)], {
        alignment: justify(headText),
        spacing: { before: 120, after: 45 },
        keepNext: true,
        ...fmtOpts(b.format),
      })
      const head: Out = side ? sideTable(side.pos, [headPara], side.imgs) : headPara
      // trả lời ngắn: 4 ô trống điền đáp số
      if (b.kind === 'short') {
        const box = 28 * PX
        return [
          head,
          new Table({
            rows: [
              new TableRow({
                height: { value: box, rule: HeightRule.EXACT },
                children: Array.from({ length: 4 }, () => new TableCell({ width: { size: box, type: WidthType.DXA }, borders: BOX, children: [para([])] })),
              }),
            ],
            width: { size: box * 4, type: WidthType.DXA },
            columnWidths: Array(4).fill(box),
            layout: TableLayoutType.FIXED,
            indent: { size: OPT_INDENT, type: WidthType.DXA },
          }),
          para([], { spacing: { after: 60 } }),
        ]
      }
      if (!b.options.length) return [head]
      // đúng/sai: mỗi ý một dòng, nhãn "a)"; trắc nghiệm: 4/3/2/1 cột theo độ dài như trên màn hình, nhãn "A."
      const tf = b.kind === 'tf'
      const cols = tf ? 1 : estimateChoiceCols(b.options.map((o) => o.text))
      const w = Math.floor((CONTENT_W - OPT_INDENT) / cols)
      const cell = (o: (typeof b.options)[number]) =>
        plainCell(w, [para([new TextRun({ text: `${o.label}${tf ? ')' : '.'} `, bold: true }), ...runs(o.text)], fmtOpts(o.format))])
      const rows = chunk(b.options, cols).map(
        (row) => new TableRow({ children: Array.from({ length: cols }, (_, i) => (row[i] ? cell(row[i]) : plainCell(w, []))) }),
      )
      return [head, borderless(rows, Array(cols).fill(w), OPT_INDENT), para([], { spacing: { after: 30 } })]
    }

    case 'essay': {
      ctx.essay += 1
      const side = sideImage(b.text, b.imagePosition)
      const headText = side ? side.rest : b.text
      const headPara = para([new TextRun({ text: `Bài ${ctx.essay}${b.score ? ` (${fmt(b.score)} điểm)` : ''}. `, bold: true }), ...runs(headText)], {
        alignment: justify(headText),
        spacing: { before: 120, after: 45 },
        ...fmtOpts(b.format),
      })
      const out: Out[] = [side ? sideTable(side.pos, [headPara], side.imgs) : headPara]
      for (const s of b.sub ?? []) out.push(para(runs(s), { indent: { left: OPT_INDENT }, spacing: { after: 45 } }))
      return out
    }

    case 'answerKey': {
      // lưới đều: cột nhãn rộng hơn, ô thiếu ở hàng cuối để trống (có viền) cho thẳng cột
      const per = Math.min(10, b.items.length || 1)
      const labelW = 1100
      const w = Math.floor((CONTENT_W - labelW) / per)
      const cell = (children: ParagraphChild[], width: number, shade = false) =>
        new TableCell({
          width: { size: width, type: WidthType.DXA },
          borders: BOX,
          shading: shade ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F2F2F2' } : undefined,
          children: [para(children, { alignment: AlignmentType.CENTER })],
        })
      const head = (text: string) => cell([new TextRun({ text, bold: true, size: 24 })], labelW, true)
      const rows = chunk(b.items, per).flatMap((row) => {
        const full = Array.from({ length: per }, (_, i) => row[i])
        return [
          new TableRow({ children: [head('Câu'), ...full.map((c) => cell(c ? [new TextRun({ text: String(c.no), size: 24 })] : [], w))] }),
          new TableRow({ children: [head('Đáp án'), ...full.map((c) => cell(c ? runs(c.answer, { bold: true, size: 24 }) : [], w))] }),
        ]
      })
      return [
        para([], { spacing: { after: 60 } }),
        new Table({ rows, width: { size: labelW + w * per, type: WidthType.DXA }, columnWidths: [labelW, ...Array(per).fill(w)], layout: TableLayoutType.FIXED }),
        para([], { spacing: { after: 60 } }),
      ]
    }

    case 'rubric': {
      return [
        ...(b.title ? [para(runs(b.title, { bold: true, size: 25, caps: true }), { spacing: { before: 180, after: 120 }, keepNext: true })] : []),
        // nhãn "1." đã nằm trong dữ liệu, không đánh số tự động nữa (tránh "1. 1.")
        ...b.items.map((i) => para([new TextRun({ text: `${i.label} `, bold: true }), ...runs(i.text)])),
      ]
    }

    case 'pageBreak':
      return [para([new PageBreak()])]

    case 'divider':
      return [para([], { border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999', space: 1 } }, spacing: { before: 120, after: 120 } })]

    default:
      return []
  }
}

export function buildDocx(doc: ExamDoc): Document {
  const ctx: Ctx = { q: 0, essay: 0, lists: 0 }
  const children = doc.blocks.flatMap((b) => blockToDocx(b, ctx))
  const level = (i: number, format: (typeof LevelFormat)[keyof typeof LevelFormat], text: string) => ({
    level: i,
    format,
    text,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360 + i * 360, hanging: 360 } } },
  })
  return new Document({
    title: doc.title,
    creator: 'đề rõ',
    styles: { default: { document: { run: { font: 'Times New Roman', size: SIZE }, paragraph: { spacing: { line: 360 } } } } },
    numbering: {
      config: [
        { reference: 'bul', levels: [level(0, LevelFormat.BULLET, '•'), level(1, LevelFormat.BULLET, '–'), level(2, LevelFormat.BULLET, '·')] },
        { reference: 'ord', levels: [level(0, LevelFormat.DECIMAL, '%1.'), level(1, LevelFormat.LOWER_LETTER, '%2.'), level(2, LevelFormat.LOWER_ROMAN, '%3.')] },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN_V, bottom: MARGIN_V, left: MARGIN_H, right: MARGIN_H } } },
        children: children.length ? children : [para([])],
      },
    ],
  })
}

/** File .docx dạng Blob (trình duyệt). */
export const buildDocxBlob = (doc: ExamDoc): Promise<Blob> => inlineDocImages(doc).then((d) => Packer.toBlob(buildDocx(d)))
