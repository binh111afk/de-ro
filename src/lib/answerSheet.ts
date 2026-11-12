/**
 * Phiếu trả lời trắc nghiệm theo mẫu thi tốt nghiệp THPT từ năm 2025 (Bộ GD&ĐT).
 * Thiết kế chuẩn 1 trang A4 dọc (210mm × 297mm), in đen trắng:
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
const BUBBLE_R = 5.3

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

/** Tính toán layout và toạ độ các khối của phiếu trả lời để kiểm tra không chồng lấn và không tràn A4. */
export function getAnswerSheetLayout(opts: AnswerSheetOptions): AnswerSheetLayout {
  const code = (opts.code || '101').trim()
  const mcqCount = Math.max(0, opts.mcqCount || 0)
  const tfCount = Math.max(0, opts.tfCount || 0)
  const shortCount = Math.max(0, opts.shortCount || 0)
  const hasEssay = !!opts.hasEssay

  const markers = [
    { x: MARKER_INSET, y: MARKER_INSET, size: MARKER_SIZE },
    { x: A4_WIDTH - MARKER_INSET - MARKER_SIZE, y: MARKER_INSET, size: MARKER_SIZE },
    { x: MARKER_INSET, y: A4_HEIGHT - MARKER_INSET - MARKER_SIZE, size: MARKER_SIZE },
    { x: A4_WIDTH - MARKER_INSET - MARKER_SIZE, y: A4_HEIGHT - MARKER_INSET - MARKER_SIZE, size: MARKER_SIZE },
  ]

  const blocks: AnswerSheetBlockBox[] = [
    { id: 'header-left', label: 'Thông tin thí sinh & Hướng dẫn', x: CONTENT_X, y: 40, width: 400, height: 184 },
    { id: 'header-sbd', label: 'Số báo danh', x: 470, y: 40, width: 160, height: 184 },
    { id: 'header-code', label: 'Mã đề thi', x: 640, y: 40, width: 94, height: 184 },
  ]

  let curY = 236
  let mcqBlockCount = 0

  // Phần I: Trắc nghiệm (mcq), 10 câu/khối, tối đa 4 khối/hàng
  if (mcqCount > 0) {
    mcqBlockCount = Math.ceil(mcqCount / 10)
    const blockCols = Math.min(4, Math.max(1, mcqBlockCount))
    const totalRows = Math.ceil(mcqBlockCount / blockCols)
    const blockH = 16 + 10 * 14
    const p1Height = 20 + 4 + totalRows * blockH + (totalRows - 1) * 6
    blocks.push({
      id: 'part-1',
      label: `Phần I (${mcqCount} câu, ${mcqBlockCount} khối)`,
      x: CONTENT_X,
      y: curY,
      width: CONTENT_W,
      height: p1Height,
    })
    curY += p1Height + 10
  }

  // Phần II: Đúng / Sai (tf), mỗi câu 1 khối, tối đa 4 khối/hàng
  if (tfCount > 0) {
    const tfCols = Math.min(4, tfCount)
    const tfRows = Math.ceil(tfCount / tfCols)
    const blockH = 16 + 4 * 14
    const p2Height = 20 + 4 + tfRows * blockH + (tfRows - 1) * 6
    blocks.push({
      id: 'part-2',
      label: `Phần II (${tfCount} câu, ${tfRows} hàng)`,
      x: CONTENT_X,
      y: curY,
      width: CONTENT_W,
      height: p2Height,
    })
    curY += p2Height + 10
  }

  // Phần III: Trả lời ngắn (short), mỗi câu 1 cột 4 ô, tối đa 6 câu/hàng
  if (shortCount > 0) {
    const shortCols = Math.min(6, shortCount)
    const shortRows = Math.ceil(shortCount / shortCols)
    const blockH = 16 + 18 + 12 * 11.5 + 4
    const p3Height = 20 + 4 + shortRows * blockH + (shortRows - 1) * 6
    blocks.push({
      id: 'part-3',
      label: `Phần III (${shortCount} câu)`,
      x: CONTENT_X,
      y: curY,
      width: CONTENT_W,
      height: p3Height,
    })
    curY += p3Height + 10
  }

  // Khung tự luận nếu đề có tự luận
  if (hasEssay) {
    const essayHeight = 32
    blocks.push({
      id: 'essay-box',
      label: 'Khung phần tự luận',
      x: CONTENT_X,
      y: curY,
      width: CONTENT_W,
      height: essayHeight,
    })
    curY += essayHeight + 10
  }

  // Dòng nhắc nhở chân trang
  blocks.push({
    id: 'footer-note',
    label: 'Ghi chú chân trang',
    x: CONTENT_X,
    y: curY,
    width: CONTENT_W,
    height: 16,
  })
  curY += 16

  return {
    pageWidth: A4_WIDTH,
    pageHeight: A4_HEIGHT,
    markers,
    blocks,
    mcqBlockCount,
    tfCount,
    shortCount,
    hasEssay,
    code,
    maxBottom: curY,
  }
}

/**
 * Sinh chuỗi SVG hoàn chỉnh của Phiếu trả lời trắc nghiệm theo mẫu Bộ GD&ĐT 2025.
 * Được thiết kế để in PDF vừa khít 1 trang A4 dọc, hoặc đổi sang PNG chèn vào Word.
 */
export function generateAnswerSheetSvg(opts: AnswerSheetOptions): string {
  const code = (opts.code || '101').trim()
  const mcqCount = Math.max(0, opts.mcqCount || 0)
  const tfCount = Math.max(0, opts.tfCount || 0)
  const shortCount = Math.max(0, opts.shortCount || 0)
  const hasEssay = !!opts.hasEssay
  const title = clipText(opts.title || 'ĐỀ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG', 42)
  const subject = clipText(opts.subject || 'Toán', 22)
  const schoolOrUnit = clipText(opts.schoolOrUnit || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO', 54)

  const out: string[] = []

  // Nền trắng
  out.push(`<rect width="${A4_WIDTH}" height="${A4_HEIGHT}" fill="#ffffff"/>`)

  // 4 Dấu định vị vuông đen ở 4 góc
  const mk = [
    [MARKER_INSET, MARKER_INSET],
    [A4_WIDTH - MARKER_INSET - MARKER_SIZE, MARKER_INSET],
    [MARKER_INSET, A4_HEIGHT - MARKER_INSET - MARKER_SIZE],
    [A4_WIDTH - MARKER_INSET - MARKER_SIZE, A4_HEIGHT - MARKER_INSET - MARKER_SIZE],
  ]
  for (const [mx, my] of mk) {
    out.push(`<rect x="${mx}" y="${my}" width="${MARKER_SIZE}" height="${MARKER_SIZE}" fill="#000000"/>`)
  }

  /* ------------------------------------------------------------------ *
   * 1. KHU VỰC ĐẦU PHIẾU (y: 40 .. 224)
   * ------------------------------------------------------------------ */
  out.push(`<text x="${CONTENT_X}" y="52" font-size="10.5" font-weight="bold" fill="#111" font-family="Arial, Helvetica, sans-serif">${esc(schoolOrUnit.toUpperCase())}</text>`)
  out.push(`<text x="${CONTENT_X}" y="73" font-size="15" font-weight="bold" fill="#000" font-family="Arial, Helvetica, sans-serif" letter-spacing="0.4">PHIẾU TRẢ LỜI TRẮC NGHIỆM</text>`)
  out.push(`<text x="${CONTENT_X}" y="92" font-size="10.5" font-weight="bold" fill="#222" font-family="Arial, Helvetica, sans-serif">MÔN THI: <tspan fill="#000">${esc(subject.toUpperCase())}</tspan>  •  <tspan font-weight="normal" font-style="italic">${esc(title)}</tspan></text>`)

  // Khung thông tin thí sinh
  const infoY = 104
  out.push(`<rect x="${CONTENT_X}" y="${infoY}" width="400" height="70" rx="3" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
  out.push(`<text x="${CONTENT_X + 8}" y="${infoY + 18}" font-size="10.5" fill="#111" font-family="Arial, Helvetica, sans-serif">Họ và tên thí sinh: .....................................................................................</text>`)
  out.push(`<text x="${CONTENT_X + 8}" y="${infoY + 38}" font-size="10.5" fill="#111" font-family="Arial, Helvetica, sans-serif">Ngày sinh: ..... / ..... / .........     Giới tính:   Nam [   ]   Nữ [   ]</text>`)
  out.push(`<text x="${CONTENT_X + 8}" y="${infoY + 58}" font-size="10.5" fill="#111" font-family="Arial, Helvetica, sans-serif">Lớp: ...................................     Phòng thi: .........................................</text>`)

  // Khung hướng dẫn tô
  const guideY = 180
  out.push(`<rect x="${CONTENT_X}" y="${guideY}" width="400" height="42" rx="3" fill="#fafafa" stroke="#333333" stroke-width="0.8"/>`)
  out.push(`<text x="${CONTENT_X + 8}" y="${guideY + 15}" font-size="9.5" font-weight="bold" fill="#000" font-family="Arial, Helvetica, sans-serif">HƯỚNG DẪN TÔ:</text>`)
  out.push(`<text x="${CONTENT_X + 104}" y="${guideY + 15}" font-size="9" fill="#222" font-family="Arial, Helvetica, sans-serif">Dùng bút chì đen tô kín ô tròn. Không gấp, gập phiếu.</text>`)
  out.push(`<text x="${CONTENT_X + 8}" y="${guideY + 32}" font-size="9.5" fill="#111" font-family="Arial, Helvetica, sans-serif">Tô đúng:</text>`)
  out.push(`<circle cx="${CONTENT_X + 60}" cy="${guideY + 29}" r="${BUBBLE_R}" fill="#000000" stroke="#000000" stroke-width="0.9"/>`)
  out.push(`<text x="${CONTENT_X + 85}" y="${guideY + 32}" font-size="9.5" fill="#111" font-family="Arial, Helvetica, sans-serif">Tô sai:   ✕     ✓     ◐     ⚬</text>`)

  // Khung SỐ BÁO DANH (6 cột × 0–9)
  const sbdX = 470
  const sbdW = 160
  out.push(`<rect x="${sbdX}" y="40" width="${sbdW}" height="184" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>`)
  out.push(`<rect x="${sbdX}" y="40" width="${sbdW}" height="20" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>`)
  out.push(`<text x="${sbdX + sbdW / 2}" y="54" font-size="10" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">SỐ BÁO DANH</text>`)

  const sbdColW = 24
  const sbdStartX = sbdX + (sbdW - 6 * sbdColW) / 2
  for (let c = 0; c < 6; c++) {
    const bx = sbdStartX + c * sbdColW
    out.push(`<rect x="${bx}" y="62" width="${sbdColW}" height="20" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
  }

  const digitStartY = 94
  const digitStepY = 12.8
  for (let d = 0; d <= 9; d++) {
    const cy = digitStartY + d * digitStepY
    for (let c = 0; c < 6; c++) {
      const cx = sbdStartX + c * sbdColW + sbdColW / 2
      out.push(`<circle cx="${cx}" cy="${cy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
      out.push(`<text x="${cx}" y="${cy}" font-size="7.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">${d}</text>`)
    }
  }

  // Khung MÃ ĐỀ THI (3 cột × 0–9, in sẵn mã đề ở hàng trên)
  const codeX = 640
  const codeW = 94
  out.push(`<rect x="${codeX}" y="40" width="${codeW}" height="184" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>`)
  out.push(`<rect x="${codeX}" y="40" width="${codeW}" height="20" fill="#f0f0f0" stroke="#000000" stroke-width="1"/>`)
  out.push(`<text x="${codeX + codeW / 2}" y="54" font-size="10" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">MÃ ĐỀ</text>`)

  const codeStartX = codeX + (codeW - 3 * sbdColW) / 2
  const codeChars = code.slice(-3).padStart(3, ' ').split('')
  for (let c = 0; c < 3; c++) {
    const bx = codeStartX + c * sbdColW
    out.push(`<rect x="${bx}" y="62" width="${sbdColW}" height="20" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
    const ch = codeChars[c]?.trim()
    if (ch) {
      out.push(`<text x="${bx + sbdColW / 2}" y="76" font-size="12.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">${esc(ch)}</text>`)
    }
  }

  for (let d = 0; d <= 9; d++) {
    const cy = digitStartY + d * digitStepY
    for (let c = 0; c < 3; c++) {
      const cx = codeStartX + c * sbdColW + sbdColW / 2
      out.push(`<circle cx="${cx}" cy="${cy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
      out.push(`<text x="${cx}" y="${cy}" font-size="7.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">${d}</text>`)
    }
  }

  out.push(`<line x1="${CONTENT_X}" y1="230" x2="${CONTENT_X + CONTENT_W}" y2="230" stroke="#000000" stroke-width="1.2"/>`)

  let curY = 236

  /* ------------------------------------------------------------------ *
   * 2. PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (mcq)
   * ------------------------------------------------------------------ */
  if (mcqCount > 0) {
    const bannerH = 20
    out.push(`<rect x="${CONTENT_X}" y="${curY}" width="${CONTENT_W}" height="${bannerH}" fill="#e8e8e8" stroke="#000000" stroke-width="1"/>`)
    out.push(`<text x="${CONTENT_X + 8}" y="${curY + 14}" font-size="10" font-weight="bold" fill="#000" font-family="Arial, Helvetica, sans-serif">PHẦN I. Thí sinh trả lời từ câu 1 đến câu ${mcqCount}. Mỗi câu hỏi chỉ chọn một phương án.</text>`)
    curY += bannerH + 4

    const numBlocks = Math.ceil(mcqCount / 10)
    const blockCols = Math.min(4, Math.max(1, numBlocks))
    const blockGap = 8
    const blockW = Math.floor((CONTENT_W - (blockCols - 1) * blockGap) / blockCols)
    const rowH = 14
    const headH = 16
    const totalBlockH = headH + 10 * rowH

    for (let b = 0; b < numBlocks; b++) {
      const colIdx = b % blockCols
      const rowIdx = Math.floor(b / blockCols)
      const bx = CONTENT_X + colIdx * (blockW + blockGap)
      const by = curY + rowIdx * (totalBlockH + 6)
      const startQ = b * 10 + 1
      const endQ = Math.min(mcqCount, (b + 1) * 10)

      out.push(`<rect x="${bx}" y="${by}" width="${blockW}" height="${totalBlockH}" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
      out.push(`<rect x="${bx}" y="${by}" width="${blockW}" height="${headH}" fill="#f2f2f2" stroke="#000000" stroke-width="0.8"/>`)

      const qColW = 34
      const optW = (blockW - qColW) / 4
      out.push(`<text x="${bx + qColW / 2}" y="${by + 11.5}" font-size="8.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Câu</text>`)
      ;['A', 'B', 'C', 'D'].forEach((letter, i) => {
        const ox = bx + qColW + i * optW + optW / 2
        out.push(`<text x="${ox}" y="${by + 11.5}" font-size="8.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">${letter}</text>`)
      })

      for (let i = 0; i < 10; i++) {
        const qNum = startQ + i
        const qy = by + headH + i * rowH
        if (i > 0) {
          out.push(`<line x1="${bx}" y1="${qy}" x2="${bx + blockW}" y2="${qy}" stroke="#e0e0e0" stroke-width="0.6"/>`)
        }
        if (qNum <= endQ) {
          out.push(`<text x="${bx + qColW / 2}" y="${qy + rowH / 2}" font-size="9" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">${qNum}</text>`)
          ;['A', 'B', 'C', 'D'].forEach((letter, optIdx) => {
            const ox = bx + qColW + optIdx * optW + optW / 2
            const oy = qy + rowH / 2
            out.push(`<circle cx="${ox}" cy="${oy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
            out.push(`<text x="${ox}" y="${oy}" font-size="7.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">${letter}</text>`)
          })
        }
      }
    }

    const totalRows = Math.ceil(numBlocks / blockCols)
    curY += totalRows * totalBlockH + (totalRows - 1) * 6 + 10
  }

  /* ------------------------------------------------------------------ *
   * 3. PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (tf)
   * ------------------------------------------------------------------ */
  if (tfCount > 0) {
    const bannerH = 20
    out.push(`<rect x="${CONTENT_X}" y="${curY}" width="${CONTENT_W}" height="${bannerH}" fill="#e8e8e8" stroke="#000000" stroke-width="1"/>`)
    out.push(`<text x="${CONTENT_X + 8}" y="${curY + 14}" font-size="10" font-weight="bold" fill="#000" font-family="Arial, Helvetica, sans-serif">PHẦN II. Thí sinh trả lời từ câu 1 đến câu ${tfCount}. Trong mỗi ý a), b), c), d) chọn Đúng hoặc Sai.</text>`)
    curY += bannerH + 4

    const tfCols = Math.min(4, tfCount)
    const tfRows = Math.ceil(tfCount / tfCols)
    const blockGap = 8
    const blockW = Math.floor((CONTENT_W - (tfCols - 1) * blockGap) / tfCols)
    const headH = 16
    const rowH = 14
    const totalBlockH = headH + 4 * rowH

    for (let cIdx = 0; cIdx < tfCount; cIdx++) {
      const colIdx = cIdx % tfCols
      const rowIdx = Math.floor(cIdx / tfCols)
      const bx = CONTENT_X + colIdx * (blockW + blockGap)
      const by = curY + rowIdx * (totalBlockH + 6)
      const qNum = cIdx + 1

      out.push(`<rect x="${bx}" y="${by}" width="${blockW}" height="${totalBlockH}" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
      out.push(`<rect x="${bx}" y="${by}" width="${blockW}" height="${headH}" fill="#f2f2f2" stroke="#000000" stroke-width="0.8"/>`)

      const labelW = Math.max(38, Math.floor(blockW * 0.42))
      const colAnsW = (blockW - labelW) / 2
      out.push(`<text x="${bx + labelW / 2}" y="${by + 11.5}" font-size="8.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Câu ${qNum}</text>`)
      out.push(`<text x="${bx + labelW + colAnsW / 2}" y="${by + 11.5}" font-size="8.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Đúng</text>`)
      out.push(`<text x="${bx + labelW + colAnsW + colAnsW / 2}" y="${by + 11.5}" font-size="8.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Sai</text>`)

      ;['a', 'b', 'c', 'd'].forEach((part, pIdx) => {
        const py = by + headH + pIdx * rowH
        if (pIdx > 0) {
          out.push(`<line x1="${bx}" y1="${py}" x2="${bx + blockW}" y2="${py}" stroke="#e0e0e0" stroke-width="0.6"/>`)
        }
        out.push(`<text x="${bx + labelW / 2}" y="${py + rowH / 2}" font-size="8.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">${part})</text>`)

        const dx = bx + labelW + colAnsW / 2
        const dy = py + rowH / 2
        out.push(`<circle cx="${dx}" cy="${dy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
        out.push(`<text x="${dx}" y="${dy}" font-size="7.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">Đ</text>`)

        const sx = bx + labelW + colAnsW + colAnsW / 2
        const sy = py + rowH / 2
        out.push(`<circle cx="${sx}" cy="${sy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
        out.push(`<text x="${sx}" y="${sy}" font-size="7.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">S</text>`)
      })
    }

    curY += tfRows * totalBlockH + (tfRows - 1) * 6 + 10
  }

  /* ------------------------------------------------------------------ *
   * 4. PHẦN III: TRẢ LỜI NGẮN (short)
   * ------------------------------------------------------------------ */
  if (shortCount > 0) {
    const bannerH = 20
    out.push(`<rect x="${CONTENT_X}" y="${curY}" width="${CONTENT_W}" height="${bannerH}" fill="#e8e8e8" stroke="#000000" stroke-width="1"/>`)
    out.push(`<text x="${CONTENT_X + 8}" y="${curY + 14}" font-size="10" font-weight="bold" fill="#000" font-family="Arial, Helvetica, sans-serif">PHẦN III. Thí sinh trả lời từ câu 1 đến câu ${shortCount}. Viết kết quả vào ô vuông và tô ô tròn tương ứng.</text>`)
    curY += bannerH + 4

    const shortCols = Math.min(6, shortCount)
    const shortRows = Math.ceil(shortCount / shortCols)
    const blockGap = 8
    const blockW = Math.floor((CONTENT_W - (shortCols - 1) * blockGap) / shortCols)
    const headH = 16
    const boxH = 18
    const bubbleStepY = 11.5
    const totalShortH = headH + boxH + 12 * bubbleStepY + 4

    for (let cIdx = 0; cIdx < shortCount; cIdx++) {
      const colIdx = cIdx % shortCols
      const rowIdx = Math.floor(cIdx / shortCols)
      const bx = CONTENT_X + colIdx * (blockW + blockGap)
      const by = curY + rowIdx * (totalShortH + 6)
      const qNum = cIdx + 1

      out.push(`<rect x="${bx}" y="${by}" width="${blockW}" height="${totalShortH}" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
      out.push(`<rect x="${bx}" y="${by}" width="${blockW}" height="${headH}" fill="#f2f2f2" stroke="#000000" stroke-width="0.8"/>`)
      out.push(`<text x="${bx + blockW / 2}" y="${by + 11.5}" font-size="8.5" font-weight="bold" fill="#000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Câu ${qNum}</text>`)

      const squareW = Math.floor((blockW - 10) / 4)
      const squareStartX = bx + (blockW - 4 * squareW) / 2
      const squareY = by + headH + 2
      for (let k = 0; k < 4; k++) {
        const sx = squareStartX + k * squareW
        out.push(`<rect x="${sx}" y="${squareY}" width="${squareW}" height="${boxH}" fill="#ffffff" stroke="#000000" stroke-width="1"/>`)
      }

      const gridStartY = squareY + boxH + 7
      // Hàng 0: Dấu "−" (chỉ ô đầu tiên)
      for (let k = 0; k < 4; k++) {
        const cx = squareStartX + k * squareW + squareW / 2
        const cy = gridStartY
        if (k === 0) {
          out.push(`<circle cx="${cx}" cy="${cy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
          out.push(`<text x="${cx}" y="${cy}" font-size="8" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">−</text>`)
        } else {
          out.push(`<line x1="${cx - 4}" y1="${cy}" x2="${cx + 4}" y2="${cy}" stroke="#d0d0d0" stroke-width="0.8"/>`)
        }
      }

      // Hàng 1: Dấu ","
      const commaY = gridStartY + bubbleStepY
      for (let k = 0; k < 4; k++) {
        const cx = squareStartX + k * squareW + squareW / 2
        out.push(`<circle cx="${cx}" cy="${commaY}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
        out.push(`<text x="${cx}" y="${commaY - 1}" font-size="8.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">,</text>`)
      }

      // Hàng 2–11: 0–9
      for (let d = 0; d <= 9; d++) {
        const cy = gridStartY + (d + 2) * bubbleStepY
        for (let k = 0; k < 4; k++) {
          const cx = squareStartX + k * squareW + squareW / 2
          out.push(`<circle cx="${cx}" cy="${cy}" r="${BUBBLE_R}" fill="#ffffff" stroke="#222222" stroke-width="0.9"/>`)
          out.push(`<text x="${cx}" y="${cy}" font-size="7.5" font-weight="bold" fill="#111" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif">${d}</text>`)
        }
      }
    }

    curY += shortRows * totalShortH + (shortRows - 1) * 6 + 10
  }

  /* ------------------------------------------------------------------ *
   * 5. PHẦN TỰ LUẬN (nếu đề có tự luận)
   * ------------------------------------------------------------------ */
  if (hasEssay) {
    const essayH = 32
    out.push(`<rect x="${CONTENT_X}" y="${curY}" width="${CONTENT_W}" height="${essayH}" rx="3" fill="#fafafa" stroke="#000000" stroke-width="1" stroke-dasharray="4 2"/>`)
    out.push(`<text x="${CONTENT_X + CONTENT_W / 2}" y="${curY + 20}" font-size="10.5" font-weight="bold" fill="#000000" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">PHẦN TỰ LUẬN: Thí sinh làm bài trên giấy thi riêng, không làm bài vào phiếu này.</text>`)
    curY += essayH + 10
  }

  /* ------------------------------------------------------------------ *
   * 6. CHÂN TRANG
   * ------------------------------------------------------------------ */
  out.push(`<text x="${CONTENT_X + CONTENT_W / 2}" y="${Math.min(1062, curY + 12)}" font-size="8.5" font-style="italic" fill="#555555" text-anchor="middle" font-family="Arial, Helvetica, sans-serif">Lưu ý: Thí sinh giữ phiếu phẳng, không làm rách, nhàu hoặc đánh dấu ngoài quy định vào phiếu thi.</text>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${A4_WIDTH} ${A4_HEIGHT}" width="${A4_WIDTH}" height="${A4_HEIGHT}">\n${out.join('\n')}\n</svg>`
}
