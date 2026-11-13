/**
 * Phiếu trả lời trắc nghiệm theo mẫu thi tốt nghiệp THPT từ năm 2025 (Bộ GD&ĐT).
 * Thiết kế 1 trang A4 dọc (210mm × 297mm), khung và ô tròn màu đỏ như phiếu thật:
 * - 4 dấu định vị vuông đen ở 4 góc (phục vụ chấm trắc nghiệm bằng ảnh).
 * - Đầu phiếu: Thông tin trường / kỳ thi, môn, họ tên, lớp, khung SBD (6 cột × 0–9),
 *   khung Mã đề (3 cột × 0–9, in sẵn mã đề ở dòng trên lưới).
 * - Phần I (mcq): Lưới câu × A B C D, chia 10 câu/khối.
 * - Phần II (tf): Mỗi câu một khối, 4 hàng a) b) c) d) × 2 cột Đúng / Sai.
 * - Phần III (short): Mỗi câu 4 ô ký tự; dưới là các hàng tô: "-" (chỉ ô đầu), ",", 0–9.
 * - Tự luận: Nếu đề có tự luận, thêm khung "Phần tự luận: làm vào giấy thi".
 * - Bố cục lấy số câu theo đề thật; đảm bảo không tràn trang A4 ngay cả khi 40 mcq + 8 tf + 6 short.
 */
import type { ExamDoc, QuestionBlock, RichText } from '@/data/docTypes'
import { answerSectionStart } from './shuffleExam'

export interface AnswerSheetOptions {
  title?: string
  subject?: string
  schoolOrUnit?: string
  code: string
  mcqCount: number
  tfCount: number
  shortCount: number
  hasEssay?: boolean
}

export interface AnswerSheetBlockBox {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export interface AnswerSheetLayout {
  pageWidth: number
  pageHeight: number
  markers: Array<{ x: number; y: number; size: number }>
  blocks: AnswerSheetBlockBox[]
  mcqBlockCount: number
  tfCount: number
  shortCount: number
  hasEssay: boolean
  code: string
  maxBottom: number
}

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123
const MARKER_SIZE = 24
const MARKER_INSET = 28
const CONTENT_X = 60
const CONTENT_W = 674

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const plain = (rt: RichText | undefined): string =>
  rt == null ? '' : typeof rt === 'string' ? rt : rt.map((s) => s.text).join('')

function clipText(s: string, maxChars: number): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length > maxChars ? `${clean.slice(0, maxChars - 1)}…` : clean
}

/** Rút thông tin trường / kỳ thi / môn học và số câu từng phần từ `ExamDoc`. */
export function extractAnswerSheetInfo(doc: ExamDoc): Omit<AnswerSheetOptions, 'code'> {
  const cut = answerSectionStart(doc.blocks)
  const body = doc.blocks.slice(0, cut)

  let mcqCount = 0
  let tfCount = 0
  let shortCount = 0
  let hasEssay = false
  for (const b of body) {
    if (b.type === 'essay') hasEssay = true
    else if (b.type === 'question') {
      const k = (b as QuestionBlock).kind ?? 'mcq'
      if (k === 'tf') tfCount++
      else if (k === 'short') shortCount++
      else mcqCount++
    }
  }

  let schoolOrUnit = ''
  let examTitle = ''
  let subject = ''

  for (const b of body) {
    if (b.type === 'header') {
      const leftLines = plain(b.left)
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !/^đề\s*(chính thức|tham khảo|minh hoạ|số)/i.test(l))
      if (leftLines.length && !schoolOrUnit) schoolOrUnit = leftLines.join(' - ')

      const rightLines = plain(b.right)
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      for (const line of rightLines) {
        const mSub = /^môn(?:\s+thi)?\s*[:\-]\s*(.+)$/i.exec(line)
        if (mSub && !subject) subject = mSub[1].trim()
        else if (!examTitle && !/^(năm học|thời gian)/i.test(line)) examTitle = line
      }
    } else if (b.type === 'title' && !examTitle) {
      examTitle = plain(b.text).trim()
    } else if (b.type === 'meta') {
      for (const [k, v] of b.rows) {
        if (/^môn/i.test(k) && !subject) subject = plain(v).trim()
      }
    }
  }

  if (!schoolOrUnit) schoolOrUnit = doc.unit?.trim() || 'TRƯỜNG / ĐƠN VỊ TỔ CHỨC THI'
  if (!examTitle) examTitle = doc.title?.trim() || 'KỲ THI KIỂM TRA ĐÁNH GIÁ'
  if (!subject) subject = doc.subject?.trim() || 'Toán'

  return {
    schoolOrUnit,
    title: examTitle,
    subject,
    mcqCount,
    tfCount,
    shortCount,
    hasEssay,
  }
}


/* ------------------------------------------------------------------ *
 * Bố cục + vẽ phiếu (dùng chung một hàm để kiểm tra đo đúng cái được vẽ)
 * Mẫu: phiếu trả lời trắc nghiệm 3 phần kiểu đề thi TN THPT từ 2025 —
 * khung + ô tròn màu đỏ (mực "bỏ qua" khi quét), ô tròn trống, nhãn đặt ngoài ô,
 * dấu định vị lớn ở 4 góc + dấu nhỏ ở mép từng khối.
 * ------------------------------------------------------------------ */

const RED = '#c0392b'
const FONT = 'font-family="Times New Roman, Times, serif"'
const SMALL_MARK = 9

interface Built {
  layout: AnswerSheetLayout
  svg: string
}

function build(opts: AnswerSheetOptions): Built {
  const code = (opts.code || '101').trim()
  const mcqCount = Math.max(0, opts.mcqCount || 0)
  const tfCount = Math.max(0, opts.tfCount || 0)
  const shortCount = Math.max(0, opts.shortCount || 0)
  const hasEssay = !!opts.hasEssay
  const examName = clipText(opts.title || 'KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG', 52)
  const subject = clipText(opts.subject || '', 28)
  const unit = clipText(opts.schoolOrUnit || '', 60)

  const out: string[] = []
  const blocks: AnswerSheetBlockBox[] = []
  const X0 = CONTENT_X
  const W = CONTENT_W
  const X1 = X0 + W

  const text = (x: number, y: number, s: string, size = 11, extra = '') =>
    out.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" ${FONT} ${extra}>${esc(s)}</text>`)
  const bubble = (cx: number, cy: number, r: number) =>
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(2)}" fill="#ffffff" stroke="${RED}" stroke-width="0.9"/>`)
  const frame = (x: number, y: number, w: number, h: number, sw = 1.1) =>
    out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="${RED}" stroke-width="${sw}"/>`)
  const vline = (x: number, y1: number, y2: number) =>
    out.push(`<line x1="${x.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${RED}" stroke-width="0.9"/>`)
  const mark = (x: number, y: number) =>
    out.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${SMALL_MARK}" height="${SMALL_MARK}" fill="#000"/>`)

  out.push(`<rect width="${A4_WIDTH}" height="${A4_HEIGHT}" fill="#ffffff"/>`)
  const markers = [
    { x: MARKER_INSET, y: MARKER_INSET, size: MARKER_SIZE },
    { x: A4_WIDTH - MARKER_INSET - MARKER_SIZE, y: MARKER_INSET, size: MARKER_SIZE },
    { x: MARKER_INSET, y: A4_HEIGHT - MARKER_INSET - MARKER_SIZE, size: MARKER_SIZE },
    { x: A4_WIDTH - MARKER_INSET - MARKER_SIZE, y: A4_HEIGHT - MARKER_INSET - MARKER_SIZE, size: MARKER_SIZE },
  ]
  for (const m of markers) out.push(`<rect x="${m.x}" y="${m.y}" width="${m.size}" height="${m.size}" fill="#000000"/>`)

  /* ---------------- 1. Đầu phiếu ---------------- */
  const HY = 60 // dưới dấu định vị góc trên
  const leftW = 452
  if (unit) text(X0, HY - 4, unit.toUpperCase(), 9.5, 'font-weight="bold"')
  text(X0 + leftW / 2, HY + 16, 'PHIẾU TRẢ LỜI TRẮC NGHIỆM', 17, 'font-weight="bold" text-anchor="middle"')
  text(X0 + leftW / 2, HY + 36, `Kỳ thi: ${examName}`, 11, 'text-anchor="middle"')
  text(X0, HY + 56, `Bài thi: ${subject || '................................................'}`, 11)
  text(X0 + leftW, HY + 56, 'Ngày thi: ......./......./20.......', 11, 'text-anchor="end"')

  const boxY = HY + 66
  const boxH = 176
  const sigW = 118
  frame(X0, boxY, sigW, boxH)
  out.push(`<line x1="${X0}" y1="${boxY + boxH / 2}" x2="${X0 + sigW}" y2="${boxY + boxH / 2}" stroke="${RED}" stroke-width="1.1"/>`)
  for (const [i, n] of [1, 2].entries()) {
    const y = boxY + i * (boxH / 2)
    text(X0 + sigW / 2, y + 16, 'Họ tên, chữ ký', 10, 'text-anchor="middle"')
    text(X0 + sigW / 2, y + 29, `của cán bộ coi thi ${n}`, 10, 'text-anchor="middle"')
  }
  const infoX = X0 + sigW + 8
  const infoW = leftW - sigW - 8
  frame(infoX, boxY, infoW, boxH)
  const fields = ['1. Hội đồng thi:', '2. Điểm thi:', '3. Phòng thi số:', '4. Họ và tên thí sinh:', '5. Ngày sinh: ......./......./...........  (Nam/ Nữ)', '6. Chữ ký của thí sinh:']
  fields.forEach((f, i) => {
    const y = boxY + 22 + i * 28
    text(infoX + 8, y, f, 10.5)
    if (i !== 4) {
      const start = infoX + 12 + f.length * 5.2
      out.push(`<line x1="${start.toFixed(1)}" y1="${y + 1}" x2="${infoX + infoW - 8}" y2="${y + 1}" stroke="#555" stroke-width="0.7" stroke-dasharray="1 2.2"/>`)
    }
  })
  blocks.push({ id: 'header-left', label: 'Thông tin thí sinh', x: X0, y: HY - 16, width: leftW, height: boxY + boxH - (HY - 16) })

  // Số báo danh (6 cột) + Mã đề (3 cột), nhãn chữ số 0–9 bên trái
  const colW = 17.5
  const digR = 6.3
  const digStep = 17
  const gridTop = HY + 36
  const digitY0 = gridTop + 34
  const sbdX = X0 + leftW + 40
  const codeX = X1 - 3 * colW
  text(sbdX + 3 * colW, HY + 12, '7. Số báo danh', 10.5, 'text-anchor="middle"')
  text(codeX + 1.5 * colW, HY + 12, '8. Mã đề thi', 10.5, 'text-anchor="middle"')
  const gridH = 22 + 10 * digStep + 12
  const drawDigitGrid = (x: number, cols: number, preset?: string[]) => {
    for (let c = 0; c < cols; c++) {
      out.push(`<rect x="${(x + c * colW).toFixed(1)}" y="${gridTop}" width="${colW}" height="20" fill="#fff" stroke="${RED}" stroke-width="0.9"/>`)
      const ch = preset?.[c]?.trim()
      if (ch) text(x + c * colW + colW / 2, gridTop + 15, ch, 13, 'font-weight="bold" text-anchor="middle"')
    }
    frame(x, gridTop + 20, cols * colW, gridH - 20, 0.9)
    for (let c = 1; c < cols; c++) vline(x + c * colW, gridTop + 20, gridTop + gridH)
    for (let d = 0; d <= 9; d++) for (let c = 0; c < cols; c++) bubble(x + c * colW + colW / 2, digitY0 + d * digStep, digR)
  }
  drawDigitGrid(sbdX, 6)
  drawDigitGrid(codeX, 3, code.slice(-3).padStart(3, ' ').split(''))
  for (let d = 0; d <= 9; d++) {
    const cy = digitY0 + d * digStep
    out.push(`<circle cx="${sbdX - 12}" cy="${cy}" r="5.6" fill="none" stroke="${RED}" stroke-width="0.7"/>`)
    text(sbdX - 12, cy + 3.4, String(d), 9, `text-anchor="middle" fill="${RED}"`)
  }
  mark(sbdX + 6 * colW + 8, digitY0 + 4 * digStep - 4)
  mark(sbdX + 6 * colW + 8, gridTop + gridH - SMALL_MARK)
  blocks.push({ id: 'header-sbd', label: 'Số báo danh', x: sbdX - 20, y: HY - 2, width: 6 * colW + 20, height: gridTop + gridH - (HY - 2) })
  blocks.push({ id: 'header-code', label: 'Mã đề thi', x: codeX, y: HY - 2, width: 3 * colW, height: gridTop + gridH - (HY - 2) })

  const headerBottom = Math.max(boxY + boxH, gridTop + gridH)
  text(X0 + 100, headerBottom + 20, 'Chú ý: Thí sinh dùng bút chì đen tô kín ô tròn; không gấp, gập phiếu.', 11, 'font-style="italic" font-weight="bold"')

  /* ---------------- 2. Ước lượng chiều cao để giãn đều xuống hết trang ---------------- */
  const mcqBlockCount = Math.ceil(mcqCount / 10)
  const mcqRows = Math.ceil(mcqBlockCount / 4)
  const tfFrames = Math.ceil(tfCount / 2)
  const tfRows = Math.ceil(tfFrames / 4)
  const shortRows = Math.ceil(shortCount / 6)
  const LABEL_H = 20
  const GAP = 14
  const bodyTop = headerBottom + 34
  const bodyBottom = A4_HEIGHT - 60
  // chiều cao theo bước hàng s (s ≈ 16 như phiếu thật), cộng phần cố định
  const heightFor = (s: number) =>
    (mcqRows ? LABEL_H + mcqRows * (18 + 10 * s + 8) + (mcqRows - 1) * 10 + GAP : 0) +
    (tfRows ? LABEL_H + tfRows * (36 + 4 * s + 8) + (tfRows - 1) * 10 + GAP : 0) +
    (shortRows ? LABEL_H + shortRows * (44 + 12 * s + 8) + (shortRows - 1) * 10 + SMALL_MARK + 4 + GAP : 0) +
    (hasEssay ? 40 : 0)
  const avail = bodyBottom - bodyTop
  let step = 16
  if (heightFor(step) > avail) {
    while (step > 10 && heightFor(step) > avail) step -= 0.25
  } else {
    while (step < 19 && heightFor(step + 0.25) <= avail) step += 0.25
  }
  const r = Math.min(7, step * 0.4)
  const colGap = 14
  const blockW = (W - 3 * colGap) / 4
  let y = bodyTop

  const sectionLabel = (label: string, desc: string) => {
    text(X0, y + 13, label, 12.5, 'font-weight="bold"')
    text(X0 + label.length * 7.4 + 6, y + 13, desc, 9.5, 'font-style="italic" fill="#333"')
    y += LABEL_H
  }

  /* ---------------- 3. Phần I ---------------- */
  if (mcqCount > 0) {
    const top = y
    sectionLabel('PHẦN I.', `Câu 1 – ${mcqCount}: mỗi câu chọn một phương án A, B, C hoặc D.`)
    const bh = 18 + 10 * step + 8
    for (let b = 0; b < mcqBlockCount; b++) {
      const bx = X0 + (b % 4) * (blockW + colGap)
      const by = y + Math.floor(b / 4) * (bh + 10)
      frame(bx, by, blockW, bh)
      const numW = 26
      const optW = (blockW - numW - 6) / 4
      ;['A', 'B', 'C', 'D'].forEach((L, i) => text(bx + numW + i * optW + optW / 2, by + 13, L, 9, `text-anchor="middle" fill="${RED}"`))
      for (let i = 0; i < 10; i++) {
        const q = b * 10 + i + 1
        if (q > mcqCount) break
        const cy = by + 18 + i * step + step / 2
        text(bx + numW - 6, cy + 4, String(q), 11, 'font-weight="bold" text-anchor="end"')
        for (let o = 0; o < 4; o++) bubble(bx + numW + o * optW + optW / 2, cy, r)
      }
      mark(bx + blockW + 2.5, by + bh + 3)
    }
    y += mcqRows * bh + (mcqRows - 1) * 10
    blocks.push({ id: 'part-1', label: `Phần I (${mcqCount} câu, ${mcqBlockCount} khối)`, x: X0, y: top, width: W, height: y - top })
    y += GAP
  }

  /* ---------------- 4. Phần II: 2 câu một khung ---------------- */
  if (tfCount > 0) {
    const top = y
    sectionLabel('PHẦN II.', `Câu 1 – ${tfCount}: mỗi ý a), b), c), d) chọn Đúng hoặc Sai.`)
    const bh = 36 + 4 * step + 8
    for (let f = 0; f < tfFrames; f++) {
      const bx = X0 + (f % 4) * (blockW + colGap)
      const by = y + Math.floor(f / 4) * (bh + 10)
      const labW = 18
      const halfW = (blockW - labW) / 2
      const qs = [2 * f + 1, 2 * f + 2].filter((q) => q <= tfCount)
      frame(bx, by, labW + halfW * qs.length, bh)
      qs.forEach((q, k) => {
        const hx = bx + labW + k * halfW
        if (k > 0) vline(hx, by, by + bh)
        text(hx + halfW / 2, by + 14, `Câu ${q}`, 10.5, 'font-weight="bold" text-anchor="middle"')
        text(hx + halfW / 4 + 2, by + 29, 'Đúng', 9.5, 'text-anchor="middle"')
        text(hx + (3 * halfW) / 4, by + 29, 'Sai', 9.5, 'text-anchor="middle"')
        for (let p = 0; p < 4; p++) {
          const cy = by + 36 + p * step + step / 2
          bubble(hx + halfW / 4 + 2, cy, r)
          bubble(hx + (3 * halfW) / 4, cy, r)
        }
      })
      ;['a)', 'b)', 'c)', 'd)'].forEach((L, p) => text(bx + 4, by + 36 + p * step + step / 2 + 4, L, 10.5))
      mark(bx + blockW + 2.5, by + bh + 3)
    }
    y += tfRows * bh + (tfRows - 1) * 10
    blocks.push({ id: 'part-2', label: `Phần II (${tfCount} câu)`, x: X0, y: top, width: W, height: y - top })
    y += GAP
  }

  /* ---------------- 5. Phần III ---------------- */
  if (shortCount > 0) {
    const top = y
    sectionLabel('PHẦN III.', `Câu 1 – ${shortCount}: ghi kết quả vào ô vuông (dấu "−" ở ô đầu, dấu phẩy thập phân) rồi tô ô tương ứng.`)
    const cw = W / 6
    const bh = 44 + 12 * step + 8
    for (let q = 0; q < shortCount; q++) {
      const bx = X0 + (q % 6) * cw
      const by = y + Math.floor(q / 6) * (bh + 10)
      frame(bx, by, cw, bh)
      text(bx + 10, by + 15, `Câu ${q + 1}`, 10.5, 'font-weight="bold"')
      const labW = 14
      const cellW = (cw - labW - 8) / 4
      const cx0 = bx + labW + 4
      for (let k = 0; k < 4; k++) out.push(`<rect x="${(cx0 + k * cellW).toFixed(1)}" y="${by + 21}" width="${cellW.toFixed(1)}" height="17" fill="#fff" stroke="${RED}" stroke-width="0.9"/>`)
      const rowY = (i: number) => by + 44 + i * step + step / 2
      const lab = ['−', ',', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      lab.forEach((L, i) => {
        text(bx + 5, rowY(i) + 4, L, 10.5, 'font-weight="bold"')
        for (let k = 0; k < 4; k++) {
          if (i === 0 && k > 0) continue // dấu trừ chỉ ở ô đầu
          if (i === 1 && (k === 0 || k === 3)) continue // dấu phẩy chỉ ở ô 2, 3
          bubble(cx0 + k * cellW + cellW / 2, rowY(i), r)
        }
      })
      if (q % 6 === 5 || q === shortCount - 1) {
        mark(bx + cw - SMALL_MARK, by + bh + 3)
      }
      mark(bx + 2, by + bh + 3)
    }
    y += shortRows * bh + (shortRows - 1) * 10
    blocks.push({ id: 'part-3', label: `Phần III (${shortCount} câu)`, x: X0, y: top, width: W, height: y - top + SMALL_MARK + 4 })
    y += SMALL_MARK + 4 + GAP
  }

  /* ---------------- 6. Tự luận ---------------- */
  if (hasEssay) {
    out.push(`<rect x="${X0}" y="${y}" width="${W}" height="28" fill="none" stroke="${RED}" stroke-width="1" stroke-dasharray="4 2"/>`)
    text(X0 + W / 2, y + 18, 'PHẦN TỰ LUẬN: Thí sinh làm bài trên giấy thi riêng, không làm vào phiếu này.', 11, 'font-weight="bold" text-anchor="middle"')
    blocks.push({ id: 'essay-box', label: 'Khung phần tự luận', x: X0, y, width: W, height: 28 })
    y += 28 + 10
  }

  const layout: AnswerSheetLayout = {
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    markers,
    blocks,
    mcqBlockCount,
    tfCount,
    shortCount,
    hasEssay,
    code,
    maxBottom: y,
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${A4_WIDTH} ${A4_HEIGHT}" width="${A4_WIDTH}" height="${A4_HEIGHT}">\n${out.join('\n')}\n</svg>`
  return { layout, svg }
}

/** Toạ độ các khối của phiếu (để kiểm tra không chồng lấn, không tràn A4). */
export function getAnswerSheetLayout(opts: AnswerSheetOptions): AnswerSheetLayout {
  return build(opts).layout
}

/** SVG phiếu trả lời 1 trang A4 dọc: in PDF trực tiếp hoặc đổi PNG chèn Word. */
export function generateAnswerSheetSvg(opts: AnswerSheetOptions): string {
  return build(opts).svg
}
