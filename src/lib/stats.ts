/**
 * Thống kê kiểu SGK (in trắng đen vẫn rõ): biểu đồ cột (đơn / ghép), đường gấp
 * khúc, hình quạt tròn, tần số ghép nhóm (cột liền nhau), và bảng số liệu.
 *
 * Dữ liệu gõ theo dòng:
 *   Thứ 2; Thứ 3; Thứ 4            ← dòng nhãn (không có dấu ":")
 *   Lớp 10A: 30; 25; 20            ← mỗi dãy số một dòng "tên: số; số; …"
 * Nhóm số liệu ghép nhóm ghi dạng [40; 50) [50; 60) … (tự nhận khoảng).
 */

export type ChartKind = 'bar' | 'line' | 'pie' | 'hist' | 'table' | 'pyramid'

export interface StatsSpec {
  chart: ChartKind
  title: string
  xLabel: string
  yLabel: string
  /** ghi số trên đầu cột / điểm / quạt */
  values: boolean
  data: string
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

interface Parsed {
  cats: string[]
  series: Array<{ name: string; vals: number[] }>
}

const INTERVAL = /[[(]\s*-?[\d.,]+\s*;\s*-?[\d.,]+\s*[\])]/g

function splitCats(line: string): string[] {
  const iv = line.match(INTERVAL)
  if (iv && (iv.length >= 2 || iv[0] === line)) return iv.map((s) => s.replace(/\s+/g, ' ').replace(/;\s*/, '; '))
  return line
    .split(/[;|\t]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseStats(text: string): Parsed {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) throw new Error('Chưa có dữ liệu')
  // Một số bảng có tên cột đặt ở đầu dòng nhãn, vd. "Lớp: 6A; 6B; 6C".
  if (lines.length > 1 && /^[^:]+:\s*.+[;|]/.test(lines[0]) &&
      /[\p{L}]/u.test(lines[0].slice(lines[0].indexOf(':') + 1))) {
    lines[0] = lines[0].slice(lines[0].indexOf(':') + 1).trim()
  }
  let cats: string[] = []
  const series: Parsed['series'] = []
  for (const l of lines) {
    const ci = l.lastIndexOf(':')
    // dòng nhãn: không có ":" (hoặc ":" nằm trong khoảng — không xảy ra)
    if (ci < 0) {
      if (cats.length) throw new Error(`Dòng "${l}" thiếu dấu ":" (vd. Lớp 10A: 30; 25; 20)`)
      cats = splitCats(l)
      continue
    }
    const name = l.slice(0, ci).trim()
    const vals = l
      .slice(ci + 1)
      .split(/[;|\t]|\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s.replace(',', '.')))
    if (vals.some((v) => !Number.isFinite(v))) throw new Error(`Dòng "${name}" có giá trị không phải số`)
    series.push({ name, vals })
  }
  if (!series.length) throw new Error('Thêm ít nhất một dòng số liệu, vd. Số học sinh: 3; 5; 7')
  const n = Math.max(...series.map((s) => s.vals.length))
  if (!cats.length) cats = Array.from({ length: n }, (_, i) => String(i + 1))
  // Một hàng có ô tiêu đề ở đầu, theo sau là các nhãn số.
  if (cats.length === n + 1 && n > 0 && !Number.isFinite(Number(cats[0].replace(',', '.'))) &&
      cats.slice(1).every((cat) => Number.isFinite(Number(cat.replace(',', '.'))))) cats = cats.slice(1)
  for (const s of series)
    if (s.vals.length !== cats.length) throw new Error(`Dòng "${s.name}" có ${s.vals.length} số, nhưng có ${cats.length} nhãn`)
  return { cats, series }
}

const FAM = `font-family="'Times New Roman',serif"`
const FONT = `${FAM} font-size="15"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => n.toFixed(1)
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
/** nền cột theo dãy: in trắng đen vẫn phân biệt (đậm, gạch chéo, nhạt, chấm) */
const FILLS = ['#4d4d4d', 'url(#sthatch)', '#c8c8c8', 'url(#stdots)', '#ffffff']
const MARKS = ['circle', 'square', 'triangle', 'diamond']

function niceStep(max: number) {
  const raw = max / 5
  const p = 10 ** Math.floor(Math.log10(raw || 1))
  const k = raw / p
  return (k <= 1 ? 1 : k <= 2 ? 2 : k <= 2.5 ? 2.5 : k <= 5 ? 5 : 10) * p
}

const DEFS =
  `<defs>` +
  `<pattern id="sthatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff"/><path d="M0 0V6" stroke="#333" stroke-width="1.2"/></pattern>` +
  `<pattern id="stdots" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><circle cx="3" cy="3" r="1.1" fill="#333"/></pattern>` +
  `<marker id="starr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#222"/></marker>` +
  `</defs>`

function mark(kind: string, x: number, y: number) {
  const r = 4
  if (kind === 'square') return `<rect x="${f1(x - r)}" y="${f1(y - r)}" width="${2 * r}" height="${2 * r}" fill="#222"/>`
  if (kind === 'triangle') return `<path d="M${f1(x)} ${f1(y - r - 1)}L${f1(x + r + 1)} ${f1(y + r)}L${f1(x - r - 1)} ${f1(y + r)}Z" fill="#222"/>`
  if (kind === 'diamond') return `<path d="M${f1(x)} ${f1(y - r - 1)}L${f1(x + r + 1)} ${f1(y)}L${f1(x)} ${f1(y + r + 1)}L${f1(x - r - 1)} ${f1(y)}Z" fill="#222"/>`
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#fff" stroke="#222" stroke-width="1.6"/>`
}

function wrap(W: number, H: number, desc: string, body: string) {
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${desc}${DEFS}<rect width="${W}" height="${H}" fill="#fff"/><g fill="#222">${body}</g></svg>`,
    width: W,
    height: H,
  }
}

function legend(series: Parsed['series'], x: number, y: number, kind: 'fill' | 'mark'): { svg: string; w: number } {
  let svg = ''
  let cx = x
  series.forEach((s, i) => {
    if (kind === 'fill') svg += `<rect x="${f1(cx)}" y="${f1(y - 10)}" width="16" height="12" fill="${FILLS[i % FILLS.length]}" stroke="#222" stroke-width="1"/>`
    else svg += `<path d="M${f1(cx)} ${f1(y - 4)}h18" stroke="#222" stroke-width="1.5"/>${mark(MARKS[i % MARKS.length], cx + 9, y - 4)}`
    svg += `<text x="${f1(cx + 22)}" y="${f1(y)}" ${FONT}>${esc(s.name)}</text>`
    cx += 30 + [...s.name].length * 7.5 + 14
  })
  return { svg, w: cx - x }
}

export function renderStatsSvg(spec: StatsSpec, desc: string): { svg: string; width: number; height: number } {
  const { cats, series } = parseStats(spec.data)
  const top = spec.title ? 34 : 14
  const title = (W: number) => (spec.title ? `<text x="${W / 2}" y="22" ${FAM} font-size="16" font-weight="bold" text-anchor="middle">${esc(spec.title)}</text>` : '')

  /* ---------- bảng ---------- */
  if (spec.chart === 'table') {
    const firstW = Math.max(90, ...series.map((s) => [...s.name].length * 8 + 20), [...(spec.xLabel || 'Nhóm')].length * 8 + 20)
    const cw = Math.max(52, ...cats.map((c) => [...c].length * 8 + 16))
    const W = firstW + cw * cats.length
    const rh = 32
    const H = top + rh * (series.length + 1) + 2
    let b = title(W)
    const rows = [{ name: spec.xLabel || 'Nhóm', cells: cats }, ...series.map((s) => ({ name: s.name, cells: s.vals.map(fmt) }))]
    rows.forEach((r, i) => {
      const y = top + i * rh
      b += `<text x="${firstW / 2}" y="${y + 21}" ${FONT} text-anchor="middle">${esc(r.name)}</text>`
      r.cells.forEach((c, j) => (b += `<text x="${firstW + cw * j + cw / 2}" y="${y + 21}" ${FONT} text-anchor="middle">${esc(c)}</text>`))
    })
    let grid = `M0.75 ${top}H${W - 0.75}V${H - 1.25}H0.75Z`
    for (let i = 1; i <= series.length; i++) grid += `M0 ${top + i * rh}H${W}`
    for (let j = 0; j < cats.length; j++) grid += `M${firstW + cw * j} ${top}V${H - 1.25}`
    b += `<path d="${grid}" fill="none" stroke="#222" stroke-width="1.1"/>`
    return wrap(W, H, desc, b)
  }

  /* ---------- quạt tròn ---------- */
  if (spec.chart === 'pie') {
    // Mỗi dãy có thể mô tả một tổng thể riêng. Tự cộng sẽ đổi ý nghĩa tỉ lệ.
    if (series.length !== 1) throw new Error('Biểu đồ tròn cần đúng một dãy số liệu.')
    const vals = series[0].vals
    const sum = vals.reduce((a, b) => a + b, 0)
    if (vals.some((v) => v < 0) || !(sum > 0)) throw new Error('Biểu đồ tròn cần số liệu không âm và tổng lớn hơn 0.')
    const R = 110
    const cx = R + (spec.values ? 72 : 26)
    const legendX = cx + R + (spec.values ? 80 : 36)
    const cy = top + R + 26
    const shades = ['#4d4d4d', 'url(#sthatch)', '#c8c8c8', 'url(#stdots)', '#ffffff', '#888888', '#e8e8e8']
    let b = ''
    let a0 = -Math.PI / 2
    const lab: string[] = []
    vals.forEach((v, i) => {
      if (v === 0) return
      const a1 = a0 + (v / sum) * 2 * Math.PI
      const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)]
      const p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)]
      const large = a1 - a0 > Math.PI ? 1 : 0
      b +=
        v === sum
          ? `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${shades[i % shades.length]}" stroke="#222" stroke-width="1.2"/>`
          : `<path d="M${cx} ${cy}L${f1(p0[0])} ${f1(p0[1])}A${R} ${R} 0 ${large} 1 ${f1(p1[0])} ${f1(p1[1])}Z" fill="${shades[i % shades.length]}" stroke="#222" stroke-width="1.2"/>`
      if (spec.values) {
        const am = (a0 + a1) / 2
        const pct = fmt((v / sum) * 100) + '%'
        const lx = cx + (R + 18) * Math.cos(am)
        const ly = cy + (R + 18) * Math.sin(am)
        lab.push(`<text x="${f1(lx)}" y="${f1(ly + 5)}" ${FONT} text-anchor="${Math.cos(am) > 0.3 ? 'start' : Math.cos(am) < -0.3 ? 'end' : 'middle'}" data-lbl="val:0:${i}">${pct}</text>`)
      }
      a0 = a1
    })
    // chú thích bên phải
    let leg = ''
    cats.forEach((c, i) => {
      const y = top + 20 + i * 24
      leg += `<rect x="${legendX}" y="${y - 11}" width="16" height="12" fill="${shades[i % shades.length]}" stroke="#222" stroke-width="1"/><text x="${legendX + 22}" y="${y}" ${FONT}>${esc(c)}</text>`
    })
    const W = Math.max(440, spec.title.length * 9 + 20, legendX + 32 + Math.max(...cats.map((c) => [...c].length * 7.5)))
    const H = Math.max(cy + R + 30, top + 24 * cats.length + 20)
    return wrap(W, H, desc, title(W) + b + lab.join('') + leg)
  }

  if (spec.chart === 'pyramid') {
    if (series.length !== 1 || series[0].vals.some((v) => v < 0)) throw new Error('Tháp cần một dãy số liệu không âm.')
    const W = Math.max(360, (spec.title.length + 4) * 9, spec.yLabel.length * 8 + 24)
    const cap = spec.yLabel ? 22 : 0
    const row = 34
    const vals = series[0].vals
    const H = top + cap + row * cats.length + 16
    let b = title(W)
    if (spec.yLabel) b += `<text x="${W / 2}" y="${top + 12}" ${FONT} text-anchor="middle">${esc(spec.yLabel)}</text>`
    cats.forEach((label, i) => {
      const text = label + (spec.values ? ' · ' + fmt(vals[i]) : '')
      const w = Math.max(W * (0.86 - 0.45 * (i / Math.max(1, cats.length - 1))), text.length * 8 + 20)
      const y = top + cap + row * (cats.length - i - 1)
      b += `<rect x="${(W - w) / 2}" y="${y}" width="${w}" height="${row - 3}" fill="#f1f1f1" stroke="#222"/><text x="${W / 2}" y="${y + 20}" ${FONT} text-anchor="middle">${esc(text)}</text>`
    })
    return wrap(W, H, desc, b)
  }

  /* ---------- cột / đường / ghép nhóm: hệ trục ---------- */
  const maxV = Math.max(...series.flatMap((s) => s.vals), 0)
  const minV = Math.min(...series.flatMap((s) => s.vals), 0)
  if (spec.chart === 'hist' && minV < 0) throw new Error('Tần số phải không âm.')
  const step = niceStep(maxV - minV)
  const yBottom = minV < 0 ? Math.floor(minV / step) * step : 0
  // chừa chỗ trên đầu cột cao nhất cho số liệu
  const yTop = Math.ceil((maxV * 1.08) / step) * step || step
  const left = 52
  const ns = series.length
  const hist = spec.chart === 'hist'
  const slot = hist ? 56 : spec.chart === 'line' ? 64 : Math.max(56, 26 * ns + 24)
  const plotW = slot * cats.length
  // biểu đồ đoạn thẳng có trục ngang là số tăng dần, bắt đầu từ 0 (thời gian 0, 1, 2, 3 h…):
  // vẽ như đồ thị Lý — mốc 0 nằm ngay gốc, hai trục chung một số 0, điểm đặt theo đúng giá trị.
  const nums = cats.map((c) => Number(c.trim().replace(',', '.')))
  const numeric =
    spec.chart === 'line' &&
    nums.length > 1 &&
    nums.every((v, i) => Number.isFinite(v) && cats[i].trim() !== '' && (i === 0 || v > nums[i - 1]))
  const origin = numeric && nums[0] === 0 && yBottom === 0
  const cx = (i: number) => numeric
    ? left + (origin ? 0 : slot / 2) + (nums[i] - nums[0]) / (nums.at(-1)! - nums[0]) * (plotW - slot)
    : left + i * slot + slot / 2
  const plotH = 230
  // chú thích + chỗ cho mũi tên và tên trục đứng
  const legH = (ns > 1 ? 26 : 0) + 22
  const W = left + plotW + 46
  const H = top + legH + plotH + 54
  const y0 = top + legH + plotH
  const Y = (v: number) => y0 - ((v - yBottom) / (yTop - yBottom)) * plotH
  let b = title(W)
  if (ns > 1) {
    const lg = legend(series, 0, top + 12, spec.chart === 'line' ? 'mark' : 'fill')
    b += `<g transform="translate(${f1((W - lg.w) / 2)} 0)">${lg.svg}</g>`
  }
  // lưới ngang + số trục tung
  let grid = ''
  for (let v = yBottom; v <= yTop + 1e-9; v += step) {
    if (Math.abs(v) < step * 1e-8) continue
    grid += `M${left} ${f1(Y(v))}H${left + plotW}`
    b += `<text x="${left - 6}" y="${f1(Y(v) + 5)}" ${FAM} font-size="13" text-anchor="end" data-lbl="y:${Math.round(v * 1000) / 1000}">${fmt(v)}</text>`
  }
  b += `<path d="${grid}" stroke="#bbb" stroke-width="0.8" stroke-dasharray="3 3"/>`
  // gốc: một số 0 chung cho hai trục (ở góc dưới trái) khi trục ngang là số từ 0
  b += origin
    ? `<text x="${left - 6}" y="${y0 + 16}" ${FAM} font-size="13" text-anchor="end">0</text>`
    : `<text x="${left - 6}" y="${f1(Y(0) + 5)}" ${FAM} font-size="13" text-anchor="end">0</text>`

  if (hist) {
    // cột liền nhau; mốc ở biên các khoảng
    const bounds = cats.map((c) => (c.match(/-?[\d.,]+/g) ?? []).map((s) => s.replace('.', ',')))
    series[0].vals.forEach((v, i) => {
      const x = left + i * slot
      b += `<rect x="${f1(x)}" y="${f1(Y(v))}" width="${slot}" height="${f1(y0 - Y(v))}" fill="#c8c8c8" stroke="#222" stroke-width="1.2"/>`
      if (spec.values) b += `<text x="${f1(x + slot / 2)}" y="${f1(Y(v) - 5)}" ${FAM} font-size="13" text-anchor="middle" data-lbl="val:0:${i}">${fmt(v)}</text>`
      b += `<text x="${f1(x)}" y="${y0 + 18}" ${FAM} font-size="13" text-anchor="middle">${esc(bounds[i]?.[0] ?? '')}</text>`
      if (i === cats.length - 1) b += `<text x="${f1(x + slot)}" y="${y0 + 18}" ${FAM} font-size="13" text-anchor="middle">${esc(bounds[i]?.[1] ?? '')}</text>`
    })
  } else if (spec.chart === 'line') {
    series.forEach((s, si) => {
      const pts = s.vals.map((v, i) => [cx(i), Y(v)])
      b += `<path d="M${pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')}" fill="none" stroke="#222" stroke-width="1.6"${si % 2 ? ' stroke-dasharray="6 4"' : ''}/>`
      pts.forEach((p) => (b += mark(MARKS[si % MARKS.length], p[0], p[1])))
    })
    // nhãn số: cùng một cột, xếp từ điểm cao xuống; nhãn sát nhãn trên thì đặt dưới điểm.
    // Điểm (0; 0) nằm đúng gốc (đã có số 0 chung) → không ghi thêm "0" cho khỏi trùng.
    if (spec.values)
      cats.forEach((_, i) => {
        const x = cx(i)
        const col = series.map((s, si) => ({ si, v: s.vals[i], y: Y(s.vals[i]) })).filter((p) => Number.isFinite(p.v) && !(origin && i === 0 && p.v === 0)).sort((p, q) => p.y - q.y)
        let prev = -Infinity
        for (const p of col) {
          let ty = p.y - 9
          if (ty - prev < 14) ty = Math.max(p.y + 20, prev + 14)
          b += `<text x="${f1(x + (origin && i === 0 ? 8 : 0))}" y="${f1(ty)}" ${FAM} font-size="13" text-anchor="${origin && i === 0 ? 'start' : 'middle'}" data-lbl="val:${p.si}:${i}">${fmt(p.v)}</text>`
          prev = ty
        }
      })
  } else {
    const bw = Math.min(40, (slot - 16) / ns)
    series.forEach((s, si) => {
      s.vals.forEach((v, i) => {
        const x = left + i * slot + (slot - bw * ns) / 2 + si * bw
        b += `<rect x="${f1(x)}" y="${f1(Math.min(Y(v), Y(0)))}" width="${f1(bw)}" height="${f1(Math.abs(Y(0) - Y(v)))}" fill="${FILLS[si % FILLS.length]}" stroke="#222" stroke-width="1.1"/>`
        if (spec.values) b += `<text x="${f1(x + bw / 2)}" y="${f1(Y(v) - 5)}" ${FAM} font-size="13" text-anchor="middle" data-lbl="val:${si}:${i}">${fmt(v)}</text>`
      })
    })
  }
  if (!hist)
    cats.forEach((c, i) => {
      if (origin && i === 0) return // số 0 đã ghi chung ở gốc
      if (numeric) b += `<path d="M${f1(cx(i))} ${y0 - 3}v6" stroke="#222" stroke-width="1"/>`
      b += `<text x="${f1(cx(i))}" y="${y0 + 18}" ${FAM} font-size="13" text-anchor="middle" data-lbl="x:${i}">${esc(c)}</text>`
    })
  // Trục giá trị 0 dùng làm gốc chiều cao cột, kể cả khi có giá trị âm.
  if (yBottom < 0) b += `<path d="M${left} ${f1(Y(0))}H${left + plotW}" stroke="#222" stroke-width="1.1"/>`
  // trục
  b += `<path d="M${left} ${y0}H${left + plotW + 22}" stroke="#222" stroke-width="1.2" marker-end="url(#starr)"/>`
  b += `<path d="M${left} ${y0}V${top + legH - 14}" stroke="#222" stroke-width="1.2" marker-end="url(#starr)"/>`
  if (spec.yLabel) b += `<text x="${left + 8}" y="${top + legH - 8}" ${FAM} font-size="13" data-lbl="ax:y">${esc(spec.yLabel)}</text>`
  if (spec.xLabel) b += `<text x="${left + plotW + 26}" y="${y0 + 36}" ${FAM} font-size="13" text-anchor="end" data-lbl="ax:x">${esc(spec.xLabel)}</text>`
  return wrap(W, H, desc, b)
}
