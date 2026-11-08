/**
 * Bảng ghép nhóm (mẫu số liệu ghép nhóm) kiểu SGK, in trắng đen vẫn rõ:
 * bảng tần số ngang / dọc và biểu đồ cột liền (histogram) kèm đa giác tần số.
 *
 * Dữ liệu nhập, mỗi dòng một nhóm:
 *   [150; 155): 5
 *   [155; 160): 12
 * Nhóm cuối được phép là đoạn đóng [a; b]. Dùng dấu phẩy thập phân: [1,5; 2).
 *
 * Các hàm tính (trung bình, trung vị, tứ phân vị, mốt…) là hàm thuần để test được;
 * kết quả chỉ hiện trong ô "Tính giúp" của form, KHÔNG vẽ lên hình (tránh lộ đáp án).
 */

export type GroupedView = 'htable' | 'vtable' | 'hist'

export interface GroupedSpec {
  /** mỗi dòng một nhóm "[150; 155): 5" */
  groups: string
  /** tên đại lượng, vd "Chiều cao (cm)" */
  label: string
  /** tên tần số, để trống thì dùng "Số học sinh" */
  freqLabel: string
  view: GroupedView
  /** chỉ cho hist: vẽ thêm đa giác tần số */
  polygon: boolean
  /** chỉ cho bảng: "mid,cum,rel,total" — giá trị đại diện, tích luỹ, tương đối %, cột/hàng Tổng */
  extras: string
}

export interface GroupRow {
  lo: number
  hi: number
  /** nhóm cuối có thể đóng [a; b] */
  closed: boolean
  /** chữ hiển thị của hai đầu mút (giữ dấu phẩy thập phân như người gõ) */
  loTxt: string
  hiTxt: string
  freq: number
}

const GROUP_LINE = /^\[([^[\];]+?)\s*;\s*([^[\];]+?)\s*([\])])\s*:\s*(-?[\d.,]+)$/

/** số "1,5" / "1.5" / "−2" → số */
const toNum = (s: string) => {
  const v = Number(s.trim().replace(/−/g, '-').replace(',', '.'))
  if (!Number.isFinite(v)) throw new Error(`Không đọc được số "${s.trim()}"`)
  return v
}
/** số → chữ hiển thị, dấu phẩy thập phân và trừ dài */
const showNum = (v: number) => String(v).replace('.', ',').replace('-', '−')

/** đọc khối dữ liệu các nhóm; sai cú pháp thì ném lỗi kèm số dòng */
export function parseGroups(text: string): GroupRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) throw new Error('Gõ ít nhất một nhóm, vd. [150; 155): 5')
  const rows: GroupRow[] = []
  lines.forEach((line, i) => {
    const m = line.match(GROUP_LINE)
    if (!m)
      throw new Error(
        `Dòng ${i + 1} "${line}": cần dạng [150; 155): 5 (nhóm cuối có thể đóng [a; b]; dấu phẩy thập phân được)`,
      )
    const lo = toNum(m[1])
    const hi = toNum(m[2])
    if (hi <= lo) throw new Error(`Dòng ${i + 1} "${line}": đầu phải lớn hơn đầu trái`)
    const freq = Number(m[4].replace(',', '.'))
    if (!(freq > 0)) throw new Error(`Dòng ${i + 1} "${line}": tần số phải là số dương`)
    rows.push({ lo, hi, closed: m[3] === ']', loTxt: showNum(lo), hiTxt: showNum(hi), freq })
  })
  return rows
}

/** chuỗi extras "mid,cum,rel,total" → tập cờ */
export function parseExtras(extras: string): Set<string> {
  return new Set(
    extras
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

export const groupMid = (g: GroupRow) => (g.lo + g.hi) / 2

/* ------------------------------------------------------------------ *
 * Các hàm tính theo công thức SGK (thuần, để test)
 * ------------------------------------------------------------------ */

export interface GroupedStats {
  /** tổng tần số n */
  n: number
  mean: number
  median: number
  q1: number
  q3: number
  mode: number
  range: number
  iqr: number
  variance: number
  sd: number
}

/** tứ phân vị loại k (k = 1, 2, 3): Q = u_m + ((k·n/4 − C)/n_m)·(u_{m+1} − u_m) */
export function groupedQuantile(rows: GroupRow[], k: number): number {
  const n = rows.reduce((s, g) => s + g.freq, 0)
  const pos = (k * n) / 4
  let cum = 0
  for (const g of rows) {
    if (cum < pos && cum + g.freq >= pos) return g.lo + ((pos - cum) / g.freq) * (g.hi - g.lo)
    cum += g.freq
  }
  const last = rows[rows.length - 1]
  return last.hi
}

/** mốt: M_o = u_m + ((n_m − n_{m−1})/((n_m − n_{m−1}) + (n_m − n_{m+1})))·h */
export function groupedMode(rows: GroupRow[]): number {
  let mi = 0
  rows.forEach((g, i) => {
    if (g.freq > rows[mi].freq) mi = i
  })
  const d1 = rows[mi].freq - (rows[mi - 1]?.freq ?? 0)
  const d2 = rows[mi].freq - (rows[mi + 1]?.freq ?? 0)
  const den = d1 + d2
  // ponytail: mọi tần số bằng nhau (d1 = d2 = 0) thì trả trung điểm nhóm
  if (den <= 0) return groupMid(rows[mi])
  return rows[mi].lo + (d1 / den) * (rows[mi].hi - rows[mi].lo)
}

export function groupedStats(rows: GroupRow[]): GroupedStats {
  const n = rows.reduce((s, g) => s + g.freq, 0)
  const sum = rows.reduce((s, g) => s + g.freq * groupMid(g), 0)
  const mean = sum / n
  const q1 = groupedQuantile(rows, 1)
  const q3 = groupedQuantile(rows, 3)
  const sqSum = rows.reduce((s, g) => s + g.freq * groupMid(g) ** 2, 0)
  const variance = sqSum / n - mean ** 2
  return {
    n,
    mean,
    median: groupedQuantile(rows, 2),
    q1,
    q3,
    mode: groupedMode(rows),
    range: rows[rows.length - 1].hi - rows[0].lo,
    iqr: q3 - q1,
    variance,
    sd: Math.sqrt(variance),
  }
}

/** làm tròn 2 chữ số, dấu phẩy thập phân (dùng trong ô "Tính giúp") */
export const round2 = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',')

/* ------------------------------------------------------------------ *
 * Vẽ SVG
 * ------------------------------------------------------------------ */

const FAM = `font-family="'Times New Roman',serif"`
const FONT = `${FAM} font-size="15"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => (Math.round(n * 10) / 10).toString()
const DEFS =
  `<defs><marker id="gparr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#222"/></marker></defs>`
function wrap(W: number, H: number, desc: string, body: string) {
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${desc}${DEFS}<rect width="${W}" height="${H}" fill="#fff"/><g fill="#222">${body}</g></svg>`,
    width: W,
    height: H,
  }
}

const groupTxt = (g: GroupRow) => `[${g.loTxt}; ${g.hiTxt}${g.closed ? ']' : ')'}`
const numTxt = (v: number) => String(v).replace('.', ',')

function niceStep(max: number) {
  const raw = max / 5
  const p = 10 ** Math.floor(Math.log10(raw || 1))
  const k = raw / p
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10) * p
}

export function renderGroupedSvg(spec: GroupedSpec, desc: string): { svg: string; width: number; height: number } {
  const rows = parseGroups(spec.groups)
  const fl = spec.freqLabel.trim() || 'Số học sinh'
  const label = spec.label.trim() || 'Nhóm'
  const ex = parseExtras(spec.extras)
  const n = rows.reduce((s, g) => s + g.freq, 0)
  const mids = rows.map(groupMid)
  const cums: number[] = []
  rows.reduce((s, g, i) => ((cums[i] = s + g.freq), cums[i]), 0)

  /* ---------- bảng ngang kiểu SGK ---------- */
  if (spec.view === 'htable') {
    const rowDefs: Array<{ key: string; name: string; cells: string[] }> = [
      { key: 'grp', name: label, cells: rows.map(groupTxt) },
      { key: 'freq', name: fl, cells: rows.map((g) => numTxt(g.freq)) },
    ]
    if (ex.has('mid')) rowDefs.push({ key: 'mid', name: 'Giá trị đại diện', cells: mids.map((v) => round2(v)) })
    if (ex.has('cum')) rowDefs.push({ key: 'cum', name: 'Tần số tích luỹ', cells: cums.map(numTxt) })
    if (ex.has('rel')) rowDefs.push({ key: 'rel', name: 'Tần số tương đối (%)', cells: rows.map((g) => round2((g.freq / n) * 100)) })
    if (ex.has('total')) {
      const totalOf: Record<string, string> = { grp: 'Tổng', freq: numTxt(n), mid: '', cum: numTxt(n), rel: '100' }
      for (const r of rowDefs) r.cells.push(totalOf[r.key] ?? '')
    }
    const firstW = Math.max(90, ...rowDefs.map((r) => [...r.name].length * 8 + 20))
    const cw = Math.max(52, ...rowDefs[0].cells.map((c) => [...c].length * 8 + 16))
    const W = firstW + cw * rowDefs[0].cells.length
    const rh = 32
    const H = 16 + rh * rowDefs.length + 4
    let b = ''
    rowDefs.forEach((r, i) => {
      const y = 16 + i * rh
      b += `<text x="${f1(firstW / 2)}" y="${f1(y + 21)}" ${FONT} text-anchor="middle">${esc(r.name)}</text>`
      r.cells.forEach((c, j) => (b += `<text x="${f1(firstW + cw * j + cw / 2)}" y="${f1(y + 21)}" ${FONT} text-anchor="middle">${esc(c)}</text>`))
    })
    let grid = `M0.75 16H${W - 0.75}V${H - 1.25}H0.75Z`
    for (let i = 1; i < rowDefs.length; i++) grid += `M0 ${f1(16 + i * rh)}H${W}`
    for (let j = 0; j < rowDefs[0].cells.length; j++) grid += `M${f1(firstW + cw * j)} 16V${H - 1.25}`
    b += `<path d="${grid}" fill="none" stroke="#222" stroke-width="1.1"/>`
    return wrap(W, H, desc, b)
  }

  /* ---------- bảng dọc ---------- */
  if (spec.view === 'vtable') {
    const heads = [label, fl]
    if (ex.has('mid')) heads.push('Giá trị đại diện')
    if (ex.has('cum')) heads.push('Tần số tích luỹ')
    if (ex.has('rel')) heads.push('Tần số tương đối (%)')
    const makeCells = (g: GroupRow, i: number): string[] => {
      const c = [groupTxt(g), numTxt(g.freq)]
      if (ex.has('mid')) c.push(round2(mids[i]))
      if (ex.has('cum')) c.push(numTxt(cums[i]))
      if (ex.has('rel')) c.push(round2((g.freq / n) * 100))
      return c
    }
    const table = rows.map(makeCells)
    if (ex.has('total')) {
      table.push([
        'Tổng',
        numTxt(n),
        ...(ex.has('mid') ? [''] : []),
        ...(ex.has('cum') ? [numTxt(n)] : []),
        ...(ex.has('rel') ? ['100'] : []),
      ])
    }
    const colW = heads.map((h, i) => Math.max(52, ...[h, ...table.map((r) => r[i] ?? '')].map((c) => [...c].length * 8 + 20)))
    const W = colW.reduce((a, b) => a + b, 0)
    const rh = 32
    const H = 16 + rh * (table.length + 1) + 4
    let b = ''
    let x = 0
    heads.forEach((h, i) => {
      b += `<text x="${f1(x + colW[i] / 2)}" y="${f1(16 + 21)}" ${FONT} text-anchor="middle">${esc(h)}</text>`
      x += colW[i]
    })
    table.forEach((r, ri) => {
      const y = 16 + (ri + 1) * rh
      let cx = 0
      r.forEach((c, ci) => {
        b += `<text x="${f1(cx + colW[ci] / 2)}" y="${f1(y + 21)}" ${FONT} text-anchor="middle">${esc(c)}</text>`
        cx += colW[ci]
      })
    })
    let grid = `M0.75 16H${W - 0.75}V${H - 1.25}H0.75Z`
    for (let i = 1; i <= table.length; i++) grid += `M0 ${f1(16 + i * rh)}H${W}`
    let gx = 0
    colW.slice(0, -1).forEach((w) => {
      gx += w
      grid += `M${f1(gx)} 16V${H - 1.25}`
    })
    b += `<path d="${grid}" fill="none" stroke="#222" stroke-width="1.1"/>`
    return wrap(W, H, desc, b)
  }

  /* ---------- biểu đồ cột liền (histogram) ---------- */
  const maxF = Math.max(...rows.map((g) => g.freq))
  const step = niceStep(maxF)
  const yTop = Math.ceil((maxF * 1.08) / step) * step || step
  const left = 52
  const slot = 56
  const plotW = slot * rows.length
  const plotH = 230
  const W = left + plotW + 46
  const H = 14 + 22 + plotH + 54
  const y0 = 14 + 22 + plotH
  const Y = (v: number) => y0 - (v / yTop) * plotH
  let b = ''
  // lưới ngang + số trục đứng
  let grid = ''
  for (let v = step; v <= yTop + 1e-9; v += step) {
    grid += `M${left} ${f1(Y(v))}H${left + plotW}`
    b += `<text x="${f1(left - 6)}" y="${f1(Y(v) + 5)}" ${FAM} font-size="13" text-anchor="end">${numTxt(v)}</text>`
  }
  b += `<path d="${grid}" stroke="#bbb" stroke-width="0.8" stroke-dasharray="3 3"/>`
  b += `<text x="${f1(left - 6)}" y="${f1(y0 + 5)}" ${FAM} font-size="13" text-anchor="end">0</text>`
  rows.forEach((g, i) => {
    const x = left + i * slot
    b += `<rect x="${f1(x)}" y="${f1(Y(g.freq))}" width="${slot}" height="${f1(y0 - Y(g.freq))}" fill="#c8c8c8" stroke="#222" stroke-width="1.2"/>`
    b += `<text x="${f1(x)}" y="${f1(y0 + 18)}" ${FAM} font-size="13" text-anchor="middle">${esc(g.loTxt)}</text>`
    if (i === rows.length - 1) b += `<text x="${f1(x + slot)}" y="${f1(y0 + 18)}" ${FAM} font-size="13" text-anchor="middle">${esc(g.hiTxt)}</text>`
  })
  if (spec.polygon) {
    // đa giác tần số: nối trung điểm đỉnh các cột, kéo về hai đầu xuống trục
    const pts: Array<[number, number]> = [[left - slot / 2, y0]]
    rows.forEach((g, i) => pts.push([left + i * slot + slot / 2, Y(g.freq)]))
    pts.push([left + plotW + slot / 2, y0])
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`).join('')
    b += `<path d="${d}" fill="none" stroke="#222" stroke-width="1.6"/>`
    for (const p of pts.slice(1, -1)) b += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="4" fill="#fff" stroke="#222" stroke-width="1.6"/>`
  }
  b += `<path d="M${left} ${y0}H${left + plotW + 22}" stroke="#222" stroke-width="1.2" marker-end="url(#gparr)"/>`
  b += `<path d="M${left} ${y0}V${y0 - plotH - 12}" stroke="#222" stroke-width="1.2" marker-end="url(#gparr)"/>`
  if (fl) b += `<text x="${f1(left + 8)}" y="${f1(y0 - plotH - 6)}" ${FAM} font-size="13">${esc(fl)}</text>`
  if (label) b += `<text x="${f1(left + plotW + 26)}" y="${f1(y0 + 36)}" ${FAM} font-size="13" text-anchor="end">${esc(label)}</text>`
  return wrap(W, H, desc, b)
}
