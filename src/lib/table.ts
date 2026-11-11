/**
 * Công cụ "Tạo bảng": vẽ bảng kẻ ô tuỳ biến thành ảnh SVG nét rõ, hỗ trợ tiêu đề
 * hàng/cột, căn lề, gộp ô (r1,c1:r2,c2), xuống dòng trong ô (\n), và chỉ số
 * dưới/trên (x_1, x^2, x^{n+1}, x^(1/2)).
 */

export type TableHeader = 'none' | 'row' | 'col' | 'both'
export type TableAlign = 'left' | 'center' | 'right'
export type TableBorder = 'all' | 'outer' | 'horizontal'

export interface TableSpec {
  /** mỗi dòng một hàng, ô cách nhau bằng | ; ô trống để trống giữa hai dấu | ; xuống dòng trong ô dùng \n */
  cells: string
  header: TableHeader
  align: TableAlign
  /** gộp ô: mỗi dòng "r1,c1:r2,c2", ví dụ "1,1:1,3" gộp 3 ô hàng 1 */
  merges: string
  border: TableBorder
  /** cỡ chữ 12–20, mặc định 15 */
  fontSize: number
}

export const TABLE_DEFAULT: TableSpec = {
  cells: ['Giá trị | x_1 | x_2 | x_3', 'Tần số | 4 | 10 | 6', 'Tỉ lệ (%) | 20 | 50 | 30'].join('\n'),
  header: 'row',
  align: 'center',
  merges: '',
  border: 'all',
  fontSize: 15,
}

export interface TableMerge {
  /** chỉ số 0-based bao gồm cả hai đầu mút */
  r1: number
  c1: number
  r2: number
  c2: number
  raw: string
}

interface RichToken {
  kind: 'text' | 'sub' | 'sup'
  text: string
}

const SUB_SUP_RE = /([_^])(?:\{([^}]+)\}|\(([^)]+)\)|([+-]?(?:\d+|[A-Za-z])))/g

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => String(Math.round(n * 10) / 10)

/** tách chuỗi chứa x_1, x^2, x^{n+1}, x^(1/2) thành các đoạn thường / chỉ số */
function tokenizeRich(raw: string): RichToken[] {
  const out: RichToken[] = []
  let last = 0
  SUB_SUP_RE.lastIndex = 0
  for (const m of raw.matchAll(SUB_SUP_RE)) {
    const idx = m.index ?? 0
    if (idx > last) out.push({ kind: 'text', text: raw.slice(last, idx) })
    const body = m[2] ?? m[3] ?? m[4] ?? ''
    out.push({ kind: m[1] === '_' ? 'sub' : 'sup', text: body })
    last = idx + m[0].length
  }
  if (last < raw.length) out.push({ kind: 'text', text: raw.slice(last) })
  return out
}

function richToSvg(tokens: RichToken[]): string {
  return tokens
    .map((t) => {
      const s = esc(t.text)
      if (t.kind === 'sub') return `<tspan baseline-shift="sub" font-size="70%">${s}</tspan>`
      if (t.kind === 'sup') return `<tspan baseline-shift="super" font-size="70%">${s}</tspan>`
      return s
    })
    .join('')
}

/** ước lượng bề rộng dòng chữ Times New Roman (px) */
function measureTokens(tokens: RichToken[], fontSize: number, bold: boolean): number {
  let w = 0
  for (const t of tokens) {
    const scale = t.kind === 'text' ? 1 : 0.72
    for (const ch of t.text) {
      let cw = 0.5
      if (/[MWmŵw@#%&]/.test(ch)) cw = 0.76
      else if (/[I1.,:;!|()[\]' ]/.test(ch)) cw = 0.34
      else if (ch !== ch.toLowerCase() || /[0-9]/.test(ch)) cw = 0.58
      else if (/[iljtfrìíỉĩị]/.test(ch)) cw = 0.34
      w += cw * scale
    }
  }
  return w * fontSize * (bold ? 1.07 : 1)
}

/** đọc lưới ô từ văn bản nhiều dòng, các ô cách nhau bằng | */
export function parseCells(text: string): { grid: string[][]; rows: number; cols: number } {
  const rawLines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0)
  if (!rawLines.length) throw new Error('Nhập ít nhất một hàng dữ liệu, các ô cách nhau bằng |')
  const parsed = rawLines.map((line) => line.split('|').map((c) => c.trim()))
  const cols = Math.max(...parsed.map((r) => r.length))
  if (cols === 0) throw new Error('Nhập ít nhất một ô dữ liệu')
  const grid = parsed.map((r) => (r.length < cols ? [...r, ...Array(cols - r.length).fill('')] : r))
  return { grid, rows: grid.length, cols }
}

const MERGE_RE = /^\(?\s*r?(\d+)\s*[,c;]\s*(\d+)\s*\)?\s*[:\-→]+\s*\(?\s*r?(\d+)\s*[,c;]\s*(\d+)\s*\)?$/i

/** đọc các vùng gộp ô dạng "r1,c1:r2,c2" (1-based); ném Error khi ngoài bảng hoặc chồng nhau */
export function parseMerges(text: string, numRows: number, numCols: number): { merges: TableMerge[]; owner: number[][] } {
  const owner = Array.from({ length: numRows }, () => Array<number>(numCols).fill(-1))
  const merges: TableMerge[] = []
  const lines = text
    .replace(/\r\n/g, '\n')
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  lines.forEach((line, idx) => {
    const m = line.match(MERGE_RE)
    if (!m) {
      throw new Error(`Dòng gộp ô ${idx + 1} "${line}": cần dạng hàng,cột:hàng,cột (vd. 1,1:1,3)`)
    }
    const r1 = Number(m[1])
    const c1 = Number(m[2])
    const r2 = Number(m[3])
    const c2 = Number(m[4])
    if (r1 < 1 || c1 < 1 || r2 < 1 || c2 < 1) {
      throw new Error(`Vùng gộp "${line}": chỉ số hàng, cột bắt đầu từ 1`)
    }
    if (r2 < r1 || c2 < c1) {
      throw new Error(`Vùng gộp "${line}": ô cuối phải nằm sau hoặc ngang ô đầu (r2 ≥ r1, c2 ≥ c1)`)
    }
    if (r2 > numRows || c2 > numCols) {
      throw new Error(`Vùng gộp "${line}" vượt ra ngoài bảng (${numRows} hàng × ${numCols} cột)`)
    }
    const mergeIdx = merges.length
    for (let r = r1 - 1; r <= r2 - 1; r++) {
      for (let c = c1 - 1; c <= c2 - 1; c++) {
        if (owner[r][c] !== -1) {
          const prev = merges[owner[r][c]].raw
          throw new Error(`Vùng gộp "${line}" chồng lên vùng "${prev}" tại ô (${r + 1},${c + 1})`)
        }
        owner[r][c] = mergeIdx
      }
    }
    merges.push({ r1: r1 - 1, c1: c1 - 1, r2: r2 - 1, c2: c2 - 1, raw: line })
  })
  return { merges, owner }
}

interface CellBox {
  id: number
  r1: number
  c1: number
  r2: number
  c2: number
  lines: RichToken[][]
  isHeader: boolean
}

export function renderTableSvg(spec: TableSpec, desc: string): { svg: string; width: number; height: number } {
  const { grid, rows, cols } = parseCells(spec.cells)
  const { merges, owner } = parseMerges(spec.merges ?? '', rows, cols)
  const header: TableHeader = spec.header ?? 'row'
  const align: TableAlign = spec.align ?? 'center'
  const border: TableBorder = spec.border ?? 'all'
  const fontSize = Math.min(20, Math.max(12, Math.round(Number(spec.fontSize) || 15)))

  const padX = Math.max(10, Math.round(fontSize * 0.75))
  const padY = Math.round(fontSize * 0.55)
  const lineH = Math.round(fontSize * 1.35)
  const minColW = Math.max(44, Math.round(fontSize * 3))
  const minRowH = Math.round(fontSize * 2.1)

  const cellId = Array.from({ length: rows }, () => Array<number>(cols).fill(0))
  const boxes: CellBox[] = []

  const isHeaderAt = (r: number, c: number) =>
    ((header === 'row' || header === 'both') && r === 0) || ((header === 'col' || header === 'both') && c === 0)

  const toLines = (raw: string) => raw.split('\\n').map((s) => tokenizeRich(s.trim()))

  merges.forEach((m, idx) => {
    const id = rows * cols + idx + 1
    for (let r = m.r1; r <= m.r2; r++) {
      for (let c = m.c1; c <= m.c2; c++) cellId[r][c] = id
    }
    boxes.push({
      id,
      r1: m.r1,
      c1: m.c1,
      r2: m.r2,
      c2: m.c2,
      lines: toLines(grid[m.r1][m.c1]),
      isHeader: isHeaderAt(m.r1, m.c1),
    })
  })

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (owner[r][c] !== -1) continue
      const id = r * cols + c + 1
      cellId[r][c] = id
      boxes.push({
        id,
        r1: r,
        c1: c,
        r2: r,
        c2: c,
        lines: toLines(grid[r][c]),
        isHeader: isHeaderAt(r, c),
      })
    }
  }

  // lượt 1: đo kích thước các ô đơn (không gộp theo chiều đang xét)
  const colW = Array<number>(cols).fill(minColW)
  const rowH = Array<number>(rows).fill(minRowH)

  const boxNeedW = (box: CellBox) => {
    const maxLineW = Math.max(0, ...box.lines.map((tk) => measureTokens(tk, fontSize, box.isHeader)))
    return Math.ceil(maxLineW + padX * 2)
  }
  const boxNeedH = (box: CellBox) => {
    const n = box.lines.length
    if (n <= 1) return minRowH
    return Math.max(minRowH, Math.ceil((n - 1) * lineH + fontSize + padY * 2))
  }

  for (const box of boxes) {
    if (box.c1 === box.c2) colW[box.c1] = Math.max(colW[box.c1], boxNeedW(box))
    if (box.r1 === box.r2) rowH[box.r1] = Math.max(rowH[box.r1], boxNeedH(box))
  }

  // lượt 2: nếu ô gộp cần rộng/cao hơn tổng các cột/hàng thành phần thì nới đều
  for (const box of boxes) {
    if (box.c2 > box.c1) {
      const span = box.c2 - box.c1 + 1
      let cur = 0
      for (let c = box.c1; c <= box.c2; c++) cur += colW[c]
      const need = boxNeedW(box)
      if (need > cur) {
        const extra = Math.ceil((need - cur) / span)
        for (let c = box.c1; c <= box.c2; c++) colW[c] += extra
      }
    }
    if (box.r2 > box.r1) {
      const span = box.r2 - box.r1 + 1
      let cur = 0
      for (let r = box.r1; r <= box.r2; r++) cur += rowH[r]
      const need = boxNeedH(box)
      if (need > cur) {
        const extra = Math.ceil((need - cur) / span)
        for (let r = box.r1; r <= box.r2; r++) rowH[r] += extra
      }
    }
  }

  const PAD = 4
  const colX = [PAD]
  for (let c = 0; c < cols; c++) colX.push(colX[c] + colW[c])
  const rowY = [PAD]
  for (let r = 0; r < rows; r++) rowY.push(rowY[r] + rowH[r])

  const W = colX[cols] + PAD
  const H = rowY[rows] + PAD
  const FAM = `font-family="'Times New Roman',serif"`
  const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle'

  let fills = ''
  let texts = ''

  for (const box of boxes) {
    const x0 = colX[box.c1]
    const y0 = rowY[box.r1]
    const w = colX[box.c2 + 1] - x0
    const h = rowY[box.r2 + 1] - y0
    if (box.isHeader) {
      fills += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(w)}" height="${f1(h)}" fill="#efefef"/>`
    }
    if (box.lines.every((tk) => tk.length === 0)) continue
    const tx = align === 'left' ? x0 + padX : align === 'right' ? x0 + w - padX : x0 + w / 2
    const n = box.lines.length
    const yFirst = y0 + (h - (n - 1) * lineH) / 2 + fontSize * 0.34
    const boldAttr = box.isHeader ? ' font-weight="bold"' : ''
    box.lines.forEach((tk, li) => {
      if (tk.length === 0) return
      const ty = yFirst + li * lineH
      texts += `<text x="${f1(tx)}" y="${f1(ty)}" ${FAM} font-size="${fontSize}"${boldAttr} text-anchor="${anchor}" stroke="none">${richToSvg(tk)}</text>`
    })
  }

  // đường kẻ bảng: bỏ qua cạnh nội bộ bên trong ô đã gộp
  let gridPath = ''
  for (let r = 0; r <= rows; r++) {
    const isOuter = r === 0 || r === rows
    if (!isOuter && border === 'outer') continue
    let c = 0
    while (c < cols) {
      const skip = !isOuter && cellId[r - 1][c] === cellId[r][c]
      if (skip) {
        c++
        continue
      }
      const start = c
      while (c < cols && (isOuter || cellId[r - 1][c] !== cellId[r][c])) c++
      gridPath += `M${f1(colX[start])} ${f1(rowY[r])}H${f1(colX[c])}`
    }
  }

  if (border !== 'horizontal') {
    for (let c = 0; c <= cols; c++) {
      const isOuter = c === 0 || c === cols
      if (!isOuter && border === 'outer') continue
      let r = 0
      while (r < rows) {
        const skip = !isOuter && cellId[r][c - 1] === cellId[r][c]
        if (skip) {
          r++
          continue
        }
        const start = r
        while (r < rows && (isOuter || cellId[r][c - 1] !== cellId[r][c])) r++
        gridPath += `M${f1(colX[c])} ${f1(rowY[start])}V${f1(rowY[r])}`
      }
    }
  }

  const body = `${fills}<path d="${gridPath}" fill="none" stroke="#222" stroke-width="1.2" stroke-linecap="square"/>${texts}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${desc}<rect width="${W}" height="${H}" fill="#fff"/><g fill="#222">${body}</g></svg>`
  return { svg, width: W, height: H }
}
