/**
 * Bảng biến thiên kiểu SGK: ba hàng x / y' / y, hàng y' ghi dấu từng khoảng
 * và số 0 tại điểm tới hạn, hàng y có mũi tên lên (đồng biến) / xuống (nghịch
 * biến), giá trị cực đại nằm cao, cực tiểu nằm thấp, giới hạn ±∞ ở hai đầu.
 * Điểm hàm không xác định (tiệm cận đứng) vẽ hai vạch dọc "||" xuyên y' và y.
 *
 * `autoVarTable` dựng sẵn bảng từ biểu thức (tính số), giáo viên sửa tay tiếp.
 */
import { parseExpr, type Fn } from './plot'

export type VtMark = '' | '0' | '||'
export type VtSign = '+' | '-'

export interface VtPoint {
  /** nhãn x: "-∞", "1", "√3", "+∞"… */
  x: string
  /** hàng y' tại điểm: '' (đầu mút), '0' (điểm tới hạn), '||' (không xác định) */
  mark: VtMark
  /** giá trị y tại điểm (điểm thường) */
  y: string
  /** chỉ với '||': giới hạn trái / phải */
  yLeft?: string
  yRight?: string
}

export interface VarTableSpec {
  /** tên hàm ở cột đầu: "y" hoặc "f(x)" */
  fname: string
  points: VtPoint[]
  /** dấu y' trên từng khoảng, dài points.length - 1 */
  signs: VtSign[]
}

/* ------------------------------------------------------------------ *
 * Tự dựng từ biểu thức
 * ------------------------------------------------------------------ */

/** số đẹp: nguyên, phân số mẫu ≤ 12, căn bậc hai, không thì 2 chữ số thập phân */
export function niceNum(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? '+∞' : '−∞'
  const minus = (s: string) => (v < 0 ? '−' + s : s)
  const a = Math.abs(v)
  if (a < 1e-4) return '0'
  if (Math.abs(a - Math.E) < 1e-6) return minus('e')
  if (Math.abs(a - 1 / Math.E) < 1e-6) return minus('1/e')
  if (Math.abs(a - Math.E * Math.E) < 1e-5) return minus('e²')
  if (Math.abs(a - Math.round(a)) < 1e-6) return Math.round(a) === 0 ? '0' : minus(String(Math.round(a)))
  for (let q = 2; q <= 12; q++) {
    const p = a * q
    if (Math.abs(p - Math.round(p)) < 1e-6) return minus(`${Math.round(p)}/${q}`)
  }
  const sq = a * a
  if (Math.abs(sq - Math.round(sq)) < 1e-6) return minus(surd(Math.round(sq)))
  return minus(String(Math.round(a * 100) / 100).replace('.', ','))
}

/** √n rút gọn: √108 → 6√3 */
function surd(n: number) {
  let k = 1
  let m = n
  for (let p = 2; p * p <= m; p++) {
    while (m % (p * p) === 0) {
      m /= p * p
      k *= p
    }
  }
  return m === 1 ? String(k) : `${k === 1 ? '' : k}√${m}`
}

const SEARCH = 30
const STEP = 0.002

/**
 * Bảng biến thiên của y = f(x), tìm trên [-30, 30]: điểm không xác định (tiệm
 * cận đứng), điểm đạo hàm đổi dấu (cực trị) hoặc bằng 0 không đổi dấu.
 * Ném Error khi biểu thức sai hoặc hàm không xác định đâu cả.
 */
export function autoVarTable(expr: string): VarTableSpec {
  const f: Fn = parseExpr(expr)
  const d = (x: number) => {
    const h = 1e-5
    return (f(x + h) - f(x - h)) / (2 * h)
  }
  const ok = (x: number) => Number.isFinite(f(x))

  // mẫu dày, đánh dấu chỗ không xác định
  const xs: number[] = []
  for (let x = -SEARCH; x <= SEARCH + 1e-9; x += STEP) xs.push(Math.round(x * 1e6) / 1e6)
  const defined = xs.map(ok)
  if (!defined.some(Boolean)) throw new Error('Hàm không xác định trên khoảng đang xét')

  type Crit = { x: number; kind: 'break' | 'crit' | 'domain-start' | 'domain-end' }
  /** biên miền xác định giữa mẫu xác định `a` và không xác định `b` (chia đôi) */
  const edge = (a: number, b: number) => {
    for (let k = 0; k < 50; k++) {
      const m = (a + b) / 2
      if (ok(m)) a = m
      else b = m
    }
    return snap(a)
  }
  const crits: Crit[] = []

  // điểm không xác định cô lập (tiệm cận đứng) hoặc biên miền xác định
  for (let i = 1; i < xs.length; i++) {
    if (defined[i - 1] && !defined[i]) {
      // vào vùng không xác định: tìm chỗ xác định lại
      let j = i
      while (j < xs.length && !defined[j]) j++
      const width = (j - i) * STEP
      if (j < xs.length && width < STEP * 3) {
        crits.push({ x: snap(xs[i]), kind: 'break' })
      } else {
        crits.push({ x: edge(xs[i - 1], xs[i]), kind: 'domain-end' })
        if (j < xs.length) crits.push({ x: edge(xs[j], xs[j - 1]), kind: 'domain-start' })
      }
      i = j
    } else if (i === 1 && !defined[0]) {
      let j = 0
      while (j < xs.length && !defined[j]) j++
      crits.push({ x: edge(xs[j], xs[j - 1]), kind: 'domain-start' })
      i = j
    }
  }
  // tiệm cận đứng không trúng mẫu: |f| vọt lên và đổi dấu giữa hai mẫu
  for (let i = 1; i < xs.length; i++) {
    const a = f(xs[i - 1])
    const b = f(xs[i])
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) > 1e3 && Math.abs(b) > 1e3 && Math.sign(a) !== Math.sign(b)) {
      const x0 = snap((xs[i - 1] + xs[i]) / 2)
      if (!crits.some((c) => Math.abs(c.x - x0) < 0.01)) crits.push({ x: x0, kind: 'break' })
    }
  }

  const nearBreak = (x: number) => crits.some((c) => c.kind === 'break' && Math.abs(c.x - x) < 0.02)
  // cực trị: y' đổi dấu (chia đôi cho chính xác)
  let prevX = NaN
  let prevD = NaN
  for (const x of xs) {
    if (!ok(x) || nearBreak(x)) {
      prevD = NaN
      continue
    }
    const dv = d(x)
    if (Number.isFinite(prevD) && Math.sign(dv) !== Math.sign(prevD) && Math.sign(dv) !== 0) {
      let lo = prevX
      let hi = x
      for (let k = 0; k < 40; k++) {
        const m = (lo + hi) / 2
        if (Math.sign(d(m)) === Math.sign(prevD)) lo = m
        else hi = m
      }
      const xc = snap((lo + hi) / 2)
      // bước nhảy của f (không phải cực trị thật) thì bỏ
      if (Math.abs(d(xc)) < 1e3) crits.push({ x: xc, kind: 'crit' })
    }
    if (Math.sign(dv) !== 0) {
      prevX = x
      prevD = dv
    }
  }
  // y' = 0 mà không đổi dấu (vd. x³ tại 0): |y'| gần 0 tại điểm nguyên/đẹp
  for (let k = -SEARCH; k <= SEARCH; k += 0.5) {
    // chỉ nhận điểm y' = 0 cô lập: hai bên y' khác 0 rõ (loại đuôi phẳng như e^x/x khi x → −∞)
    const isolated = Math.abs(d(k - 0.5)) > 1e-3 && Math.abs(d(k + 0.5)) > 1e-3
    if (ok(k) && Math.abs(d(k)) < 1e-6 && isolated && !crits.some((c) => Math.abs(c.x - k) < 0.01)) crits.push({ x: k, kind: 'crit' })
  }

  crits.sort((a, b) => a.x - b.x)
  const first = crits[0]
  const last = crits[crits.length - 1]
  const startsAtDomain = first?.kind === 'domain-start'
  const endsAtDomain = last?.kind === 'domain-end'

  const points: VtPoint[] = []
  const signs: VtSign[] = []
  const limitAt = (x: number, side: -1 | 1) => {
    const v = f(x + side * 1e-7)
    // tiến sát hơn mà giá trị vẫn chạy (kể cả chậm như ln) thì là vô cực
    const closer = f(x + side * 1e-12)
    if (!Number.isFinite(v) || Math.abs(v) > 1e5 || Math.abs(closer - v) > 1) return (Number.isFinite(closer) ? closer : v) > 0 ? '+∞' : '−∞'
    return niceNum(Math.round(v * 1e4) / 1e4)
  }
  const atInf = (dir: -1 | 1) => {
    const v = f(dir * 1e7)
    // tăng không chặn (kể cả chậm như √x, ln x): so với giá trị ở xa hơn
    const far = f(dir * 1e9)
    if (!Number.isFinite(v) || Math.abs(v) > 1e5 || Math.abs(far - v) > 1) return v > 0 ? '+∞' : '−∞'
    return niceNum(Math.round(v * 1e4) / 1e4)
  }

  if (!startsAtDomain) points.push({ x: '−∞', mark: '', y: atInf(-1) })
  for (const c of crits) {
    if (c.kind === 'break') points.push({ x: niceNum(c.x), mark: '||', y: '', yLeft: limitAt(c.x, -1), yRight: limitAt(c.x, 1) })
    else if (c.kind === 'crit') points.push({ x: niceNum(c.x), mark: '0', y: niceNum(f(c.x)) })
    else {
      // biên miền: hàm xác định tại biên (√x tại 0) thì lấy giá trị, không thì giới hạn một phía (ln x → −∞)
      const side = c.kind === 'domain-start' ? 1 : -1
      const at = f(c.x)
      points.push({ x: niceNum(c.x), mark: '', y: Number.isFinite(at) ? niceNum(at) : limitAt(c.x, side) })
    }
  }
  if (!endsAtDomain) points.push({ x: '+∞', mark: '', y: atInf(1) })

  // dấu y' trên từng khoảng: lấy ở điểm giữa (khoảng vô hạn thì lùi/tiến 1 đơn vị)
  const numX = (p: VtPoint, i: number) => {
    if (p.x === '−∞') return crits.length ? crits[0].x - 1 - (i === 0 ? 0 : 0) : -1
    if (p.x === '+∞') return crits.length ? crits[crits.length - 1].x + 1 : 1
    return crits.find((c) => niceNum(c.x) === p.x)?.x ?? 0
  }
  for (let i = 0; i + 1 < points.length; i++) {
    let a = numX(points[i], i)
    let b = numX(points[i + 1], i + 1)
    if (points[i].x === '−∞') a = b - 2
    if (points[i + 1].x === '+∞') b = a + 2
    const mid = (a + b) / 2
    signs.push(d(mid) >= 0 ? '+' : '-')
  }
  return { fname: 'y', points, signs }
}

/** làm tròn toạ độ tìm được về số đẹp gần nhất (1/12 hoặc 1e-4) */
export function snap(x: number) {
  const q = Math.round(x * 12) / 12
  if (Math.abs(q - x) < 2e-3) return q
  // căn bậc hai: giữ đúng giá trị để niceNum nhận ra (√3, 2√2…)
  const s = Math.round(x * x)
  if (Math.abs(Math.sqrt(s) - Math.abs(x)) < 2e-3) return Math.sign(x) * Math.sqrt(s)
  return x
}

/* ------------------------------------------------------------------ *
 * Vẽ SVG
 * ------------------------------------------------------------------ */

const W = 640
const LABEL_W = 64
const ROW_X = 36
const ROW_D = 36
const ROW_Y = 104
const FONT = `font-family="'Times New Roman',serif" font-size="17"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
/** bề rộng ước lượng của chữ (px) để mũi tên không đâm vào số */
const textW = (s: string) => Math.max(8, [...s].length * 8.5)
const pretty = (s: string) => s.replace(/-/g, '−').replace(/\+∞/g, '+∞')

/** mức (cao/thấp) của giá trị tại điểm i theo chiều mũi tên hai bên */
function levelAt(spec: VarTableSpec, i: number, side: 'left' | 'right' | 'both'): 'top' | 'bottom' | 'mid' {
  const before = spec.signs[i - 1]
  const after = spec.signs[i]
  if (side === 'left') return before === '+' ? 'top' : 'bottom'
  if (side === 'right') return after === '+' ? 'bottom' : 'top'
  if (before && after) {
    if (before === '+' && after === '-') return 'top'
    if (before === '-' && after === '+') return 'bottom'
    // y' = 0 nhưng không đổi dấu (vd. x³ tại 0): giá trị nằm giữa đường mũi tên
    return 'mid'
  }
  if (after) return after === '+' ? 'bottom' : 'top'
  return before === '+' ? 'top' : 'bottom'
}

export function renderVarTableSvg(spec: VarTableSpec, desc: string): { svg: string; width: number; height: number } {
  const n = spec.points.length
  const H = ROW_X + ROW_D + ROW_Y
  const colW = (W - LABEL_W - 40) / Math.max(1, n - 1)
  const px = (i: number) => LABEL_W + 20 + i * colW
  const out: string[] = []
  const y1 = ROW_X
  const y2 = ROW_X + ROW_D

  // khung: viền ngoài, kẻ ngang giữa các hàng, kẻ dọc sau cột nhãn
  out.push(
    `<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" fill="none" stroke="#222" stroke-width="1.2"/>`,
    `<path d="M0 ${y1}H${W}M0 ${y2}H${W}M${LABEL_W} 0V${H}" stroke="#222" stroke-width="1.2"/>`,
    `<text x="${LABEL_W / 2}" y="${y1 / 2 + 6}" ${FONT} font-style="italic" text-anchor="middle">x</text>`,
    `<text x="${LABEL_W / 2}" y="${y1 + ROW_D / 2 + 6}" ${FONT} font-style="italic" text-anchor="middle">${esc(spec.fname)}′</text>`,
    `<text x="${LABEL_W / 2}" y="${y2 + ROW_Y / 2 + 6}" ${FONT} font-style="italic" text-anchor="middle">${esc(spec.fname)}</text>`,
  )

  const yTop = y2 + 22
  const yBot = H - 12
  // vị trí (x, y) đầu/cuối mũi tên của từng điểm
  const anchors: Array<{ left: [number, number, number]; right: [number, number, number] }> = []

  spec.points.forEach((p, i) => {
    const x = px(i)
    out.push(`<text x="${x}" y="${y1 / 2 + 6}" ${FONT} text-anchor="middle">${esc(pretty(p.x))}</text>`)
    if (p.mark === '0') out.push(`<text x="${x}" y="${y1 + ROW_D / 2 + 6}" ${FONT} text-anchor="middle">0</text>`)
    if (p.mark === '||') {
      out.push(`<path d="M${x - 2} ${y1}V${H}M${x + 2} ${y1}V${H}" stroke="#222" stroke-width="1.2"/>`)
      const lv = levelAt(spec, i, 'left')
      const rv = levelAt(spec, i, 'right')
      const ly = lv === 'top' ? yTop : yBot
      const ry = rv === 'top' ? yTop : yBot
      const L = pretty(p.yLeft ?? '')
      const R = pretty(p.yRight ?? '')
      if (i > 0) out.push(`<text x="${x - 7}" y="${ly}" ${FONT} text-anchor="end">${esc(L)}</text>`)
      if (i < n - 1) out.push(`<text x="${x + 7}" y="${ry}" ${FONT} text-anchor="start">${esc(R)}</text>`)
      anchors.push({ left: [x - 7 - textW(L) / 2, ly, textW(L)], right: [x + 7 + textW(R) / 2, ry, textW(R)] })
    } else {
      const lv = levelAt(spec, i, 'both')
      const yy = lv === 'top' ? yTop : lv === 'bottom' ? yBot : (yTop + yBot) / 2
      const v = pretty(p.y)
      out.push(`<text x="${x}" y="${yy}" ${FONT} text-anchor="middle">${esc(v)}</text>`)
      anchors.push({ left: [x, yy, textW(v)], right: [x, yy, textW(v)] })
    }
  })

  // dấu y' giữa hai điểm + mũi tên ở hàng y
  const arrows: string[] = []
  for (let i = 0; i + 1 < n; i++) {
    const mx = (px(i) + px(i + 1)) / 2
    out.push(`<text x="${mx}" y="${y1 + ROW_D / 2 + 6}" ${FONT} text-anchor="middle">${spec.signs[i] === '+' ? '+' : '−'}</text>`)
    const [ax, ay, aw] = anchors[i].right
    const [bx, by, bw] = anchors[i + 1].left
    // đầu mũi tên tránh chữ: lùi theo bề rộng chữ, và lệch lên/xuống khỏi dòng số
    const sx = ax + aw / 2 + 4
    const ex = bx - bw / 2 - 4
    const lift = (yy: number) => (yy === yTop ? 4 : yy === yBot ? -10 : -5)
    const sy = ay + lift(ay)
    const ey = by + lift(by)
    if (ex - sx < 12) continue
    // mỗi mũi tên một path: marker-end chỉ gắn vào cuối path
    arrows.push(`<path d="M${sx.toFixed(1)} ${sy.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="#222" stroke-width="1.3" fill="none" marker-end="url(#vtarr)"/>`)
  }
  out.push(...arrows)

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    desc +
    `<defs><marker id="vtarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#222"/></marker></defs>` +
    `<rect width="${W}" height="${H}" fill="#fff"/>` +
    `<g fill="#222">${out.join('')}</g>` +
    `</svg>`
  return { svg, width: W, height: H }
}

/* ------------------------------------------------------------------ *
 * Nhập bằng chữ: ba dòng x / y' / y, giá trị cách nhau bằng dấu cách
 *
 *   x: -oo -1 1 +oo
 *   y': + 0 - 0 +
 *   y: -oo 4 0 +oo
 *
 * Dòng y' xen kẽ dấu khoảng (+ -) và điểm giữa (0, || khi không xác định).
 * Ở điểm ||, dòng y ghi "trái||phải", vd. -oo||+oo. Không dùng dấu phẩy để
 * tách vì 0,5 là số thập phân.
 * ------------------------------------------------------------------ */

/** chữ gõ bàn phím → kí hiệu: oo/inf → ∞, sqrt3/can3 → √3, - → − */
export function fromKeys(t: string): string {
  return t
    .replace(/(sqrt|can)\(?(\d+)\)?/gi, '√$2')
    .replace(/oo|inf|vc/gi, '∞')
    .replace(/^-/, '−')
    .replace(/^\+?∞$/, '+∞')
}

/** kí hiệu → chữ gõ (để hiện lại trong ô nhập) */
export function toKeys(t: string): string {
  return t.replace(/∞/g, 'oo').replace(/−/g, '-').replace(/√(\d+)/g, 'sqrt$1')
}

const ROW = /^\s*([^:]+?)\s*:\s*(.*)$/

export function varTableToText(spec: VarTableSpec): string {
  const xs = spec.points.map((p) => toKeys(p.x) || '?')
  const d: string[] = []
  spec.signs.forEach((g, i) => {
    d.push(g)
    const next = spec.points[i + 1]
    if (i + 1 < spec.points.length - 1) d.push(next.mark === '||' ? '||' : next.mark === '0' ? '0' : '.')
  })
  const ys = spec.points.map((p) => (p.mark === '||' ? `${toKeys(p.yLeft ?? '')}||${toKeys(p.yRight ?? '')}` : toKeys(p.y) || '?'))
  const f = spec.fname
  const fd = f === 'y' ? "y'" : f.replace('(', "'(")
  return `x: ${xs.join(' ')}\n${fd}: ${d.join(' ')}\n${f}: ${ys.join(' ')}`
}

/** Đọc ba dòng; ném Error (tiếng Việt) chỉ rõ dòng nào sai. */
export function parseVarTableText(text: string): VarTableSpec {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const rows = lines.map((l) => {
    const m = ROW.exec(l)
    if (!m) throw new Error(`Dòng "${l}" thiếu dấu ":" (vd. x: -oo 1 +oo)`)
    return { name: m[1].replace(/\s+/g, ''), vals: m[2].split(/[\s;]+/).filter(Boolean) }
  })
  const xRow = rows.find((r) => r.name === 'x')
  const dRow = rows.find((r) => r.name.includes("'") || r.name.includes('′'))
  const yRow = rows.find((r) => r !== xRow && r !== dRow)
  if (!xRow) throw new Error('Thiếu dòng x: …')
  if (!dRow) throw new Error("Thiếu dòng y': …")
  if (!yRow) throw new Error('Thiếu dòng y: …')
  const n = xRow.vals.length
  if (n < 2) throw new Error('Dòng x cần ít nhất 2 giá trị')
  if (dRow.vals.length !== 2 * n - 3)
    throw new Error(`Dòng y' cần ${2 * n - 3} kí hiệu (dấu của ${n - 1} khoảng xen với ${n - 2} điểm giữa), đang có ${dRow.vals.length}`)
  if (yRow.vals.length !== n) throw new Error(`Dòng ${yRow.name} cần ${n} giá trị cho ${n} điểm của x, đang có ${yRow.vals.length}`)

  const signs: VtSign[] = []
  const marks: VtMark[] = ['']
  dRow.vals.forEach((v, i) => {
    if (i % 2 === 0) {
      if (v !== '+' && v !== '-' && v !== '−') throw new Error(`Dòng y': kí hiệu thứ ${i + 1} phải là dấu + hoặc - (dấu của khoảng), đang là "${v}"`)
      signs.push(v === '+' ? '+' : '-')
    } else {
      if (v !== '0' && v !== '||' && v !== '.') throw new Error(`Dòng y': kí hiệu thứ ${i + 1} phải là 0, || hoặc . (tại điểm x), đang là "${v}"`)
      marks.push(v === '0' ? '0' : v === '||' ? '||' : '')
    }
  })
  marks.push('')

  const points: VtPoint[] = xRow.vals.map((x, i) => {
    const y = yRow.vals[i]
    if (marks[i] === '||') {
      const [l, r] = y.split('||')
      if (r === undefined) throw new Error(`Tại x = ${x} (điểm ||), dòng ${yRow.name} cần ghi "trái||phải", vd. -oo||+oo`)
      return { x: fromKeys(x), mark: '||', y: '', yLeft: fromKeys(l), yRight: fromKeys(r) }
    }
    return { x: fromKeys(x), mark: marks[i], y: fromKeys(y) }
  })
  const fname = yRow.name === 'y' ? 'y' : yRow.name
  return { fname, points, signs }
}
