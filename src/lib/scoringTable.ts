/**
 * Dựng bảng hướng dẫn chấm tự luận chuẩn mẫu Bộ GD&ĐT (4 cột: Phần | Câu | Nội dung | Điểm)
 * và chuẩn hoá khối `table` từ JSON AI trả về.
 *
 * AI chỉ cần trả cấu trúc theo phần → câu → (ý tiêu chí a, b, c…), không phải tự đếm `rowSpan`;
 * module này tính chính xác `rowSpan`, `colSpan`, độ rộng 4 cột, căn lề cột Điểm, và dòng Tổng điểm.
 */
import type { FormatAttrs, Mark, RichText, Span, TableBlock, TableCellData } from '@/data/docTypes'

/** Độ rộng 4 cột Phần | Câu | Nội dung | Điểm (px, tổng 642px ≈ khổ nội dung A4 — tỉ lệ 9,0% | 7,5% | 74,1% | 9,3%). */
export const SCORING_COL_WIDTHS = [58, 48, 476, 60] as const

const TABLE_REF_W = 642
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const ALIGNS = new Set(['left', 'center', 'right', 'justify'])

type Align = NonNullable<TableCellData['align']>

const asAlign = (v: unknown): Align | undefined =>
  typeof v === 'string' && ALIGNS.has(v) ? (v as Align) : undefined

function mergeMarks(base: Mark[] | undefined, extra: Mark[] | undefined): Mark[] | undefined {
  if (!base?.length && !extra?.length) return undefined
  const out: Mark[] = [...(base ?? [])]
  for (const m of extra ?? []) {
    if (!out.some((x) => x.type === m.type)) out.push(m)
  }
  return out.length ? out : undefined
}

function sameMarks(a: Mark[] | undefined, b: Mark[] | undefined): boolean {
  const aa = a ?? []
  const bb = b ?? []
  if (aa.length !== bb.length) return false
  const k = (m: Mark) => `${m.type}:${JSON.stringify(m.attrs ?? {})}`
  const sa = aa.map(k).sort()
  const sb = bb.map(k).sort()
  return sa.every((v, i) => v === sb[i])
}

function compactSpans(spans: Span[]): RichText {
  const merged: Span[] = []
  for (const s of spans) {
    if (!s.text && !s.image) continue
    const last = merged[merged.length - 1]
    if (last && !last.image && !s.image && sameMarks(last.marks, s.marks)) last.text += s.text
    else merged.push({ ...s })
  }
  if (!merged.length) return ''
  if (merged.length === 1 && !merged[0].marks?.length && !merged[0].image) return merged[0].text
  return merged
}

function toSpans(rt: RichText): Span[] {
  if (typeof rt === 'string') return rt ? [{ text: rt }] : []
  return (rt as Array<Span | string>).map((s) => (typeof s === 'string' ? { text: s } : s))
}

/** Tách chuỗi có **đậm** / *nghiêng* thành Span[] (bỏ qua công thức $...$ / $$...$$). */
function parseInlineEmphasis(text: string, baseMarks?: Mark[]): Span[] {
  const out: Span[] = []
  const mathRe = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let last = 0
  const pushPlain = (seg: string) => {
    if (!seg) return
    const empRe = /\*\*\*([^\n*](?:[^\n]*?[^\n*])?)\*\*\*|\*\*([^\n*](?:[^\n]*?[^\n*])?)\*\*|(?<!\*)\*([^\s*\n](?:[^\n*]*?[^\s*\n])?)\*(?!\*)/g
    let at = 0
    for (const m of seg.matchAll(empRe)) {
      const idx = m.index ?? 0
      if (idx > at) out.push({ text: seg.slice(at, idx), ...(baseMarks?.length ? { marks: baseMarks } : {}) })
      if (m[1] !== undefined) {
        const marks = mergeMarks(baseMarks, [{ type: 'bold' }, { type: 'italic' }])
        out.push({ text: m[1], ...(marks ? { marks } : {}) })
      } else if (m[2] !== undefined) {
        const marks = mergeMarks(baseMarks, [{ type: 'bold' }])
        out.push({ text: m[2], ...(marks ? { marks } : {}) })
      } else if (m[3] !== undefined) {
        const marks = mergeMarks(baseMarks, [{ type: 'italic' }])
        out.push({ text: m[3], ...(marks ? { marks } : {}) })
      }
      at = idx + m[0].length
    }
    if (at < seg.length) out.push({ text: seg.slice(at), ...(baseMarks?.length ? { marks: baseMarks } : {}) })
  }

  for (const m of text.matchAll(mathRe)) {
    const idx = m.index ?? 0
    if (idx > last) pushPlain(text.slice(last, idx))
    out.push({ text: m[0], ...(baseMarks?.length ? { marks: baseMarks } : {}) })
    last = idx + m[0].length
  }
  if (last < text.length) pushPlain(text.slice(last))
  return out
}

/** Chuyển nội dung ô (string, string[], hoặc Span[]) sang RichText, hỗ trợ **đậm** và *nghiêng*. */
export function parseCellRich(v: unknown, extraMarks?: Mark[]): RichText {
  if (v == null) return ''
  if (typeof v === 'number') return compactSpans([{ text: String(v), ...(extraMarks?.length ? { marks: extraMarks } : {}) }])
  if (typeof v === 'string') {
    const clean = v.replace(/\r\n/g, '\n')
    return compactSpans(parseInlineEmphasis(clean, extraMarks))
  }
  if (Array.isArray(v)) {
    if (v.every((x) => typeof x === 'string')) {
      return parseCellRich((v as string[]).join('\n'), extraMarks)
    }
    const spans: Span[] = []
    for (const item of v) {
      if (typeof item === 'string') {
        spans.push(...parseInlineEmphasis(item.replace(/\r\n/g, '\n'), extraMarks))
      } else if (item && typeof item === 'object') {
        const s = item as Span
        const marks = mergeMarks(s.marks, extraMarks)
        if (s.image) spans.push({ text: '', image: s.image })
        else if (typeof s.text === 'string') spans.push({ text: s.text.replace(/\r\n/g, '\n'), ...(marks ? { marks } : {}) })
      }
    }
    return compactSpans(spans)
  }
  return ''
}

const boldText = (s: string): RichText => (s ? [{ text: s, marks: [{ type: 'bold' }] }] : '')

const plainOf = (rt: RichText): string =>
  typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')

const countLines = (rt: RichText): number => Math.max(1, plainOf(rt).split('\n').length)

/** Đọc giá trị số của điểm (chấp nhận cả dấu phẩy và dấu chấm). */
export function parseNumericScore(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v !== 'string') return null
  const m = v.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:điểm|đ)?$/i)
  if (!m) return null
  const n = Number(m[1].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Định dạng điểm theo chuẩn Bộ GD&ĐT: dấu phẩy thập phân (0,25; 0,5; 1,0; 4,0; 10,0). */
export function formatScore(v: unknown): string {
  if (v == null || v === '') return ''
  const num = parseNumericScore(v)
  if (num !== null) {
    const rounded = Math.round(num * 100) / 100
    const digits = Math.round(rounded * 100) % 10 !== 0 ? 2 : 1
    return rounded.toFixed(digits).replace('.', ',')
  }
  return String(v)
    .trim()
    .replace(/\s*(?:điểm|đ)$/i, '')
    .replace(/(\d)\.(\d)/g, '$1,$2')
}

function sumScores(values: unknown[]): number | null {
  let sum = 0
  let count = 0
  for (const v of values) {
    const n = parseNumericScore(v)
    if (n !== null) {
      sum += n
      count++
    }
  }
  return count > 0 ? Math.round(sum * 100) / 100 : null
}

function cleanQuestionNo(v: unknown, fallback: number): string {
  if (v == null || v === '') return String(fallback)
  const s = String(v).trim().replace(/^(?:câu|bài)\s+/i, '').replace(/[.:]$/, '').trim()
  return s || String(fallback)
}

function cleanPartLabel(v: unknown, index: number): string {
  if (v == null || v === '') return ROMAN[index] ?? String(index + 1)
  const s = String(v).trim().replace(/^phần\s+/i, '').replace(/[.:]$/, '').trim()
  return s || (ROMAN[index] ?? String(index + 1))
}

/** Ghép hai đoạn RichText thành hai phần phân tách bởi `\n`. */
function joinRichWithNewline(first: RichText, second: RichText): RichText {
  const a = toSpans(first)
  const b = toSpans(second)
  if (!a.length) return second
  if (!b.length) return first
  return compactSpans([...a, { text: '\n' }, ...b])
}

/**
 * Dựng bảng 4 cột Phần | Câu | Nội dung | Điểm từ khối `rubric` dạng `parts`.
 * Trả `null` nếu không có phần hợp lệ.
 */
export function buildScoringTable(raw: Record<string, unknown>): TableBlock | null {
  const rawParts = Array.isArray(raw.parts) ? raw.parts : null
  if (!rawParts || !rawParts.length) return null

  const rows: TableCellData[][] = [
    [
      { text: boldText('Phần'), header: true, align: 'center' },
      { text: boldText('Câu'), header: true, align: 'center' },
      { text: boldText('Nội dung'), header: true, align: 'center' },
      { text: boldText('Điểm'), header: true, align: 'center' },
    ],
  ]

  const partScoreValues: unknown[] = []

  rawParts.forEach((pItem, pIdx) => {
    if (!pItem || typeof pItem !== 'object') return
    const p = pItem as Record<string, unknown>
    const partLabel = cleanPartLabel(p.part ?? p.label, pIdx)
    const partTitleRaw = p.title ?? p.name ?? ''
    const partNoteRaw = p.note ?? p.intro ?? p.guide
    const rawQs = Array.isArray(p.questions) ? p.questions : Array.isArray(p.items) ? p.items : []

    const qRows: TableCellData[][] = []
    const qScores: unknown[] = []

    rawQs.forEach((qItem, qIdx) => {
      if (!qItem || typeof qItem !== 'object') return
      const q = qItem as Record<string, unknown>
      const qNo = cleanQuestionNo(q.no ?? q.cau ?? q.label, qIdx + 1)
      const rawCriteria = Array.isArray(q.criteria)
        ? q.criteria
        : Array.isArray(q.sub)
          ? q.sub
          : Array.isArray(q.steps)
            ? q.steps
            : []

      if (rawCriteria.length > 0) {
        const critEntries = rawCriteria
          .map((cItem): { content: RichText; score: unknown } | null => {
            if (typeof cItem === 'string') return { content: parseCellRich(cItem), score: '' }
            if (!cItem || typeof cItem !== 'object') return null
            const c = cItem as Record<string, unknown>
            const label = typeof c.label === 'string' ? c.label.trim() : ''
            const bodyRaw = c.content ?? c.text ?? c.answer ?? ''
            let content = parseCellRich(bodyRaw)
            if (label && !plainOf(content).trimStart().toLowerCase().startsWith(label.toLowerCase())) {
              content = compactSpans([{ text: `${label} ` }, ...toSpans(content)])
            }
            return { content, score: c.score ?? c.points ?? '' }
          })
          .filter((x): x is { content: RichText; score: unknown } => x !== null)

        if (!critEntries.length) return

        const summaryRaw = q.title ?? q.prompt ?? q.content ?? q.text
        const hasSummary = summaryRaw != null && plainOf(parseCellRich(summaryRaw)).trim() !== ''
        const qScoreRaw = q.score ?? q.points ?? sumScores(critEntries.map((c) => c.score))
        qScores.push(qScoreRaw)

        const qSpan = (hasSummary ? 1 : 0) + critEntries.length

        if (hasSummary) {
          const summaryRich = parseCellRich(summaryRaw, [{ type: 'bold' }])
          const qScoreStr = formatScore(qScoreRaw)
          qRows.push([
            { text: boldText(qNo), align: 'center', ...(qSpan > 1 ? { rowSpan: qSpan } : {}) },
            { text: summaryRich },
            { text: qScoreStr ? boldText(qScoreStr) : '', align: 'center' },
          ])
          for (const crit of critEntries) {
            qRows.push([
              { text: crit.content },
              { text: formatScore(crit.score), align: 'center' },
            ])
          }
        } else {
          critEntries.forEach((crit, ci) => {
            if (ci === 0) {
              qRows.push([
                { text: boldText(qNo), align: 'center', ...(qSpan > 1 ? { rowSpan: qSpan } : {}) },
                { text: crit.content },
                { text: formatScore(crit.score), align: 'center' },
              ])
            } else {
              qRows.push([
                { text: crit.content },
                { text: formatScore(crit.score), align: 'center' },
              ])
            }
          })
        }
      } else {
        const contentRaw = q.content ?? q.text ?? q.answer ?? q.title ?? ''
        const qScoreRaw = q.score ?? q.points ?? ''
        qScores.push(qScoreRaw)
        qRows.push([
          { text: boldText(qNo), align: 'center' },
          { text: parseCellRich(contentRaw) },
          { text: formatScore(qScoreRaw), align: 'center' },
        ])
      }
    })

    const partScoreRaw = p.score ?? p.points ?? sumScores(qScores)
    partScoreValues.push(partScoreRaw)
    const partScoreStr = formatScore(partScoreRaw)
    const partSpan = 1 + qRows.length

    const titleRich = parseCellRich(partTitleRaw || 'TỰ LUẬN', [{ type: 'bold' }])
    const noteRich = partNoteRaw != null ? parseCellRich(partNoteRaw) : ''
    const hasNote = plainOf(noteRich).trim() !== ''

    const partContentCell: TableCellData = hasNote
      ? {
          text: joinRichWithNewline(titleRich, noteRich),
          lineAligns: [
            ...Array<Align>(countLines(titleRich)).fill('center'),
            ...Array<Align>(countLines(noteRich)).fill('left'),
          ],
        }
      : { text: titleRich, align: 'center' }

    rows.push([
      { text: boldText(partLabel), align: 'center', ...(partSpan > 1 ? { rowSpan: partSpan } : {}) },
      { text: '' },
      partContentCell,
      { text: partScoreStr ? boldText(partScoreStr) : '', align: 'center' },
    ])
    rows.push(...qRows)
  })

  if (rows.length <= 1) return null

  const totalRaw = raw.total ?? raw.totalScore ?? sumScores(partScoreValues)
  const totalStr = formatScore(totalRaw)
  if (totalStr) {
    rows.push([
      { text: boldText('Tổng điểm'), colSpan: 3, align: 'center' },
      { text: boldText(totalStr), align: 'center' },
    ])
  }

  return {
    type: 'table',
    colWidths: [...SCORING_COL_WIDTHS],
    rows,
  }
}

/** Chuẩn hoá mảng colWidths (đổi tỉ lệ phần trăm ≤ 105 sang px tổng 642px để TipTap không bó cột nhỏ). */
function normalizeColWidths(raw: unknown, numCols: number): number[] | undefined {
  if (!Array.isArray(raw) || raw.length !== numCols) return undefined
  const nums = raw.map((x) => Number(x))
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return undefined
  const sum = nums.reduce((a, b) => a + b, 0)
  if (sum <= 105) {
    const scaled = nums.map((n) => Math.max(30, Math.round((n / sum) * TABLE_REF_W)))
    return scaled
  }
  return nums.map((n) => Math.round(n))
}

/** Chuẩn hoá khối `table` tự do AI trả về, kiểm tra/sửa `rowSpan` để không lệch cột trong TipTap hay Word. */
export function sanitizeTableBlock(raw: Record<string, unknown>): TableBlock | null {
  const rawRows = Array.isArray(raw.rows) ? raw.rows : []
  if (!rawRows.length) return null

  const rich = (v: unknown): RichText =>
    typeof v === 'string'
      ? v.replace(/\r\n/g, '\n')
      : Array.isArray(v)
        ? compactSpans(
            v.map((s) =>
              typeof s === 'string' ? { text: s.replace(/\r\n/g, '\n') } : (s as Span),
            ),
          )
        : ''

  const parsedRows: TableCellData[][] = []
  for (const rItem of rawRows) {
    if (!Array.isArray(rItem) || !rItem.length) continue
    const cells: TableCellData[] = []
    for (const cItem of rItem) {
      if (typeof cItem === 'string' || Array.isArray(cItem)) {
        cells.push({ text: rich(cItem) })
        continue
      }
      if (!cItem || typeof cItem !== 'object') {
        cells.push({ text: '' })
        continue
      }
      const c = cItem as Record<string, unknown>
      const cs = Math.max(1, Math.floor(Number(c.colSpan ?? c.colspan ?? 1) || 1))
      const rs = Math.max(1, Math.floor(Number(c.rowSpan ?? c.rowspan ?? 1) || 1))
      const align = asAlign(c.align)
      const lineAligns = Array.isArray(c.lineAligns)
        ? c.lineAligns.map((a) => asAlign(a) ?? null)
        : undefined
      const cell: TableCellData = {
        text: rich(c.text),
        ...(c.header === true ? { header: true } : {}),
        ...(cs > 1 ? { colSpan: cs } : {}),
        ...(rs > 1 ? { rowSpan: rs } : {}),
        ...(align ? { align } : {}),
        ...(lineAligns?.some(Boolean) ? { lineAligns } : {}),
        ...(typeof c.shading === 'string' && c.shading.trim() ? { shading: c.shading.trim() } : {}),
        ...(c.format && typeof c.format === 'object' ? { format: c.format as FormatAttrs } : {}),
      }
      cells.push(cell)
    }
    if (cells.length) parsedRows.push(cells)
  }

  if (!parsedRows.length) return null

  // Kiểm tra lưới: kẹp rowSpan không vượt số hàng còn lại và xác định số cột tối đa
  const totalRows = parsedRows.length
  const occupied = new Set<string>()
  let maxCols = 0
  const safeRows: TableCellData[][] = parsedRows.map((row, r) => {
    let col = 0
    const nextRow: TableCellData[] = []
    for (const cell of row) {
      while (occupied.has(`${r},${col}`)) col++
      const cs = cell.colSpan ?? 1
      const maxRs = totalRows - r
      let rs = Math.min(cell.rowSpan ?? 1, maxRs)
      // nếu ô mở rộng xuống chạm ô đã bị chiếm (hiếm) → kẹp lại
      for (let dr = 1; dr < rs; dr++) {
        let hit = false
        for (let dc = 0; dc < cs; dc++) {
          if (occupied.has(`${r + dr},${col + dc}`)) hit = true
        }
        if (hit) {
          rs = dr
          break
        }
      }
      for (let dr = 0; dr < rs; dr++) {
        for (let dc = 0; dc < cs; dc++) occupied.add(`${r + dr},${col + dc}`)
      }
      col += cs
      if (col > maxCols) maxCols = col
      const outCell: TableCellData = { ...cell }
      if (rs > 1) outCell.rowSpan = rs
      else delete outCell.rowSpan
      nextRow.push(outCell)
    }
    return nextRow
  })

  if (maxCols <= 0) return null
  const colWidths = normalizeColWidths(raw.colWidths, maxCols)
  const format = raw.format && typeof raw.format === 'object' ? (raw.format as FormatAttrs) : undefined
  return {
    type: 'table',
    rows: safeRows,
    ...(colWidths ? { colWidths } : {}),
    ...(format ? { format } : {}),
  }
}
