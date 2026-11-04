/**
 * Bảng xét dấu kiểu SGK: hàng x, (tuỳ chọn) một hàng cho từng nhân tử, hàng
 * cuối là biểu thức cần xét. Tại mỗi điểm: "0" (biểu thức bằng 0), "||" (không
 * xác định — vạch đôi), hoặc để trống.
 *
 * Nhập bằng chữ, giống bảng biến thiên:
 *   x: -oo -2 1 +oo
 *   x+2: - 0 + . +
 *   x-1: - . - 0 +
 *   f(x): + 0 - 0 +
 * Mỗi hàng (trừ x) có 2n−3 kí hiệu: dấu từng khoảng xen với điểm giữa
 * (0, || hoặc . = trống).
 *
 * `autoSignTable` dựng sẵn từ biểu thức (tách nhân tử ở tích/thương ngoài cùng).
 */
import { parseExpr, type Fn } from './plot'
import { fromKeys, niceNum, snap, toKeys } from './varTable'

export type StMark = '' | '0' | '||'
export interface SignRow {
  label: string
  signs: Array<'+' | '-'>
  /** tại các điểm giữa (dài xs.length - 2) */
  marks: StMark[]
  /** tại hai đầu khi miền xác định bị chặn (vd. √x: "0" ở x = 0; ln x: "||") */
  ends?: [StMark, StMark]
}
export interface SignTableSpec {
  /** nhãn x, gồm hai đầu (thường −∞, +∞) */
  xs: string[]
  rows: SignRow[]
}

/* ------------------------------------------------------------------ *
 * Tự dựng từ biểu thức
 * ------------------------------------------------------------------ */

/** tách tích/thương ngoài cùng: "(x-1)(x+2)/(x-3)" → [{x-1},{x+2},{x-3, den}] */
export function splitFactors(expr: string): Array<{ src: string; den: boolean }> {
  const s = expr.replace(/\s+/g, '').replace(/^(y|f\(x\))=/i, '')
  const out: Array<{ src: string; den: boolean }> = []
  let depth = 0
  let cur = ''
  let den = false
  const push = (nextDen: boolean) => {
    if (cur) out.push({ src: cur, den })
    cur = ''
    den = nextDen
  }
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') {
      // ")(" · "2(" · "x(" ở ngoài cùng: nhân tử mới (không tách sau tên hàm như sqrt)
      if (depth === 0 && /[)\dx]$/.test(cur)) push(false)
      depth++
      cur += ch
    } else if (ch === ')') {
      depth--
      cur += ch
    } else if (depth === 0 && (ch === '*' || ch === '/')) {
      push(ch === '/')
    } else if (depth === 0 && (ch === '+' || ch === '-') && cur && !/[e^]$/.test(cur)) {
      return [{ src: s, den: false }] // tổng ở ngoài cùng: không tách
    } else cur += ch
  }
  push(false)
  // bỏ hằng số dương; hằng âm giữ để dấu đúng
  return out.filter((f) => !/^\d+(\.\d+)?$/.test(f.src))
}

const strip = (s: string) => (/^\(.*\)$/.test(s) && balanced(s.slice(1, -1)) ? s.slice(1, -1) : s)
function balanced(s: string) {
  let d = 0
  for (const c of s) {
    if (c === '(') d++
    if (c === ')') d--
    if (d < 0) return false
  }
  return d === 0
}

/** nhãn hàng: x^2 → x², * bỏ, sqrt → √ */
export function prettyExpr(s: string): string {
  return s
    .replace(/\*/g, '')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/sqrt/g, '√')
    .replace(/-/g, '−')
}

const L = 30
const STEP = 0.002

/** nghiệm (đổi dấu hoặc chạm 0) và điểm không xác định của g trên [-L, L] */
function roots(g: Fn): { zeros: number[]; poles: number[] } {
  const zeros: number[] = []
  const poles: number[] = []
  const val = (x: number) => {
    const v = g(x)
    return Number.isFinite(v) ? v : NaN
  }
  let px = -L
  let pv = val(px)
  let ppv = NaN
  for (let x = -L + STEP; x <= L; x += STEP) {
    const v = val(x)
    if (Number.isFinite(pv) && Number.isFinite(v) && Math.sign(pv) !== Math.sign(v) && pv !== 0) {
      // chia đôi tìm chỗ đổi dấu
      let a = px
      let b = x
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2
        const mv = val(m)
        if (!Number.isFinite(mv)) break
        if (Math.sign(mv) === Math.sign(pv)) a = m
        else b = m
      }
      const r = (a + b) / 2
      const near = Math.max(Math.abs(val(r - 1e-7)), Math.abs(val(r + 1e-7)))
      if (near > 1e3 || !Number.isFinite(near)) poles.push(snap(r))
      else zeros.push(snap(r))
    } else if (Number.isFinite(pv) && !Number.isFinite(v)) {
      poles.push(snap(x))
    } else if (Number.isFinite(pv) && Number.isFinite(v) && Number.isFinite(ppv)) {
      // chạm 0 không đổi dấu: |g| cực tiểu cục bộ rất nhỏ
      if (Math.abs(pv) < 1e-5 && Math.abs(pv) <= Math.abs(ppv) && Math.abs(pv) <= Math.abs(v) && Math.sign(ppv) === Math.sign(v)) zeros.push(snap(px))
    }
    if (v === 0) zeros.push(snap(x))
    ppv = pv
    px = x
    pv = v
  }
  const uniq = (a: number[]) => a.sort((p, q) => p - q).filter((v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) > 1e-6)
  return { zeros: uniq(zeros), poles: uniq(poles) }
}

/**
 * Miền xác định một khoảng [lo, hi] (±∞ nếu không chặn). Miền gồm nhiều khoảng rời
 * (vd. √(x²−1)) thì báo để giáo viên gõ tay.
 */
function domainOf(f: Fn): { lo: number; hi: number } {
  const ok = (x: number) => Number.isFinite(f(x))
  const h = 0.01
  const n = Math.round((2 * L) / h)
  let first = -1
  let last = -1
  let gap = 0
  for (let k = 0; k <= n; k++) {
    const x = -L + k * h
    if (ok(x)) {
      if (first < 0) first = k
      else if (gap > 3) throw new Error('Miền xác định gồm nhiều khoảng rời nhau — gõ bảng bằng tay ở ô dưới')
      last = k
      gap = 0
    } else if (first >= 0) gap++
  }
  if (first < 0) throw new Error('Biểu thức không xác định ở đâu cả trong [−30; 30]')
  const edge = (bad: number, good: number) => {
    for (let k = 0; k < 60; k++) {
      const m = (bad + good) / 2
      if (ok(m)) good = m
      else bad = m
    }
    return snap(good)
  }
  return {
    lo: first === 0 ? -Infinity : edge(-L + (first - 1) * h, -L + first * h),
    hi: last === n ? Infinity : edge(-L + (last + 1) * h, -L + last * h),
  }
}

/** dấu tại đầu mút miền: xác định và bằng 0 → "0"; không xác định → "||"; còn lại trống */
const endMark = (g: Fn, x: number): StMark => {
  if (!Number.isFinite(x)) return ''
  const v = g(x)
  return !Number.isFinite(v) ? '||' : Math.abs(v) < 1e-9 ? '0' : ''
}

export function autoSignTable(expr: string): SignTableSpec {
  const f = parseExpr(expr)
  const { lo, hi } = domainOf(f)
  const inside = (v: number) => v > lo + 1e-6 && v < hi - 1e-6
  const factors = splitFactors(expr)
  const parts = factors.length >= 2 ? factors.map((p) => ({ ...p, fn: parseExpr(p.src) })) : []
  const all = roots(f)
  const per = parts.map((p) => roots(p.fn))
  const pts = [...all.zeros, ...all.poles, ...per.flatMap((r) => [...r.zeros, ...r.poles])]
    .sort((a, b) => a - b)
    .filter((v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) > 1e-6)
    .filter(inside)
  if (pts.length > 12) throw new Error('Quá nhiều điểm (hàm tuần hoàn?) — gõ bảng bằng tay ở ô dưới')
  const near = (list: number[], v: number) => list.some((u) => Math.abs(u - v) < 1e-6)
  const mids: number[] = []
  const bounds = [lo, ...pts, hi]
  for (let i = 0; i + 1 < bounds.length; i++) {
    const a = bounds[i]
    const b = bounds[i + 1]
    mids.push(a === -Infinity ? (b === Infinity ? 0 : b - 1) : b === Infinity ? a + 1 : (a + b) / 2)
  }
  const signOf = (g: Fn, x: number) => {
    const v = g(x)
    if (!Number.isFinite(v)) throw new Error(`Biểu thức không xác định tại x = ${niceNum(x)} — gõ bảng bằng tay ở ô dưới`)
    return v >= 0 ? '+' : '-'
  }
  const bounded = Number.isFinite(lo) || Number.isFinite(hi)
  const row = (label: string, g: Fn, r: { zeros: number[]; poles: number[] }, ends?: [StMark, StMark]): SignRow => ({
    label,
    signs: mids.map((m) => signOf(g, m)) as Array<'+' | '-'>,
    marks: pts.map((p) => (near(r.poles, p) ? '||' : near(r.zeros, p) ? '0' : '')),
    ...(bounded ? { ends: ends ?? [endMark(g, lo), endMark(g, hi)] } : {}),
  })
  const rows: SignRow[] = parts.map((p, i) => row(prettyExpr(strip(p.src)), p.fn, per[i]))
  // hàng cuối: không xác định ở mọi nghiệm của nhân tử dưới mẫu
  const denZeros = parts.flatMap((p, i) => (p.den ? per[i].zeros : []))
  rows.push(row('f(x)', f, { zeros: all.zeros.filter((z) => !near(denZeros, z)), poles: [...all.poles, ...denZeros] }))
  const end = (v: number, inf: string) => (Number.isFinite(v) ? niceNum(v) : inf)
  return { xs: [end(lo, '−∞'), ...pts.map(niceNum), end(hi, '+∞')], rows }
}

/* ------------------------------------------------------------------ *
 * Chữ ↔ bảng
 * ------------------------------------------------------------------ */

export function signTableToText(spec: SignTableSpec): string {
  const lines = [`x: ${spec.xs.map((x) => toKeys(x)).join(' ')}`]
  for (const r of spec.rows) {
    const t: string[] = []
    if (r.ends) t.push(r.ends[0] || '.')
    r.signs.forEach((s, i) => {
      t.push(s)
      if (i < r.marks.length) t.push(r.marks[i] || '.')
    })
    if (r.ends) t.push(r.ends[1] || '.')
    lines.push(`${toKeys(r.label).replace(/−/g, '-')}: ${t.join(' ')}`)
  }
  return lines.join('\n')
}

export function parseSignTableText(text: string): SignTableSpec {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) throw new Error('Chưa có dòng nào')
  const split = (l: string) => {
    const i = l.lastIndexOf(':')
    if (i < 0) throw new Error(`Dòng "${l}" thiếu dấu ":" (vd. x: -oo 1 +oo)`)
    return { name: l.slice(0, i).trim(), vals: l.slice(i + 1).split(/[\s;]+/).filter(Boolean) }
  }
  const [xr, ...rest] = lines.map(split)
  if (xr.name !== 'x') throw new Error('Dòng đầu phải là x: …')
  const n = xr.vals.length
  if (n < 2) throw new Error('Dòng x cần ít nhất 2 giá trị')
  if (!rest.length) throw new Error('Thêm ít nhất một dòng dấu, vd. f(x): + 0 -')
  const markOf = (v: string, name: string, at: number): StMark => {
    if (!['0', '||', '.', '|'].includes(v)) throw new Error(`Dòng ${name}: kí hiệu thứ ${at} phải là 0, || hoặc . (trống)`)
    return v === '0' ? '0' : v === '||' ? '||' : ''
  }
  const rows = rest.map((r): SignRow => {
    // thêm hai kí hiệu ở hai đầu (miền bị chặn): 2n−1 kí hiệu
    let ends: [StMark, StMark] | undefined
    if (r.vals.length === 2 * n - 1) {
      ends = [markOf(r.vals[0], r.name, 1), markOf(r.vals[r.vals.length - 1], r.name, r.vals.length)]
      r = { ...r, vals: r.vals.slice(1, -1) }
    }
    if (r.vals.length !== 2 * n - 3) throw new Error(`Dòng ${r.name} cần ${2 * n - 3} kí hiệu (dấu ${n - 1} khoảng xen ${n - 2} điểm; thêm 2 kí hiệu hai đầu nếu miền bị chặn), đang có ${r.vals.length}`)
    const signs: Array<'+' | '-'> = []
    const marks: StMark[] = []
    r.vals.forEach((v, i) => {
      if (i % 2 === 0) {
        if (!['+', '-', '−'].includes(v)) throw new Error(`Dòng ${r.name}: kí hiệu thứ ${i + 1} phải là + hoặc -`)
        signs.push(v === '+' ? '+' : '-')
      } else {
        if (!['0', '||', '.', '|'].includes(v)) throw new Error(`Dòng ${r.name}: kí hiệu thứ ${i + 1} phải là 0, || hoặc . (trống)`)
        marks.push(v === '0' ? '0' : v === '||' ? '||' : '')
      }
    })
    return { label: prettyExpr(r.name), signs, marks, ...(ends ? { ends } : {}) }
  })
  return { xs: xr.vals.map(fromKeys), rows }
}

/* ------------------------------------------------------------------ *
 * Vẽ
 * ------------------------------------------------------------------ */

const FONT = `font-family="'Times New Roman',serif" font-size="17"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const ROW_H = 38

export function renderSignTableSvg(spec: SignTableSpec, desc: string): { svg: string; width: number; height: number } {
  const n = spec.xs.length
  const labelW = Math.max(56, ...spec.rows.map((r) => [...r.label].length * 8.5 + 24))
  const W = Math.max(420, Math.min(680, labelW + 70 * (n - 1) + 40))
  const H = ROW_H * (spec.rows.length + 1)
  const colW = (W - labelW - 40) / Math.max(1, n - 1)
  const px = (i: number) => labelW + 20 + i * colW
  const out: string[] = []
  out.push(`<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" fill="none" stroke="#222" stroke-width="1.2"/>`)
  let lines = `M${labelW} 0V${H}`
  for (let r = 1; r <= spec.rows.length; r++) lines += `M0 ${r * ROW_H}H${W}`
  out.push(`<path d="${lines}" stroke="#222" stroke-width="1.2"/>`)
  const mid = (r: number) => r * ROW_H + ROW_H / 2 + 6
  out.push(`<text x="${labelW / 2}" y="${mid(0)}" ${FONT} font-style="italic" text-anchor="middle">x</text>`)
  spec.xs.forEach((x, i) => out.push(`<text x="${px(i)}" y="${mid(0)}" ${FONT} text-anchor="middle">${esc(x.replace(/-/g, '−'))}</text>`))
  spec.rows.forEach((row, ri) => {
    const r = ri + 1
    out.push(`<text x="${labelW / 2}" y="${mid(r)}" ${FONT} font-style="italic" text-anchor="middle">${esc(row.label)}</text>`)
    row.signs.forEach((s, i) => out.push(`<text x="${(px(i) + px(i + 1)) / 2}" y="${mid(r)}" ${FONT} text-anchor="middle">${s === '+' ? '+' : '−'}</text>`))
    const at: Array<[StMark, number]> = row.marks.map((m, k) => [m, k + 1])
    if (row.ends) at.push([row.ends[0], 0], [row.ends[1], n - 1])
    at.forEach(([m, k]) => {
      const x = px(k)
      if (m === '0') out.push(`<text x="${x}" y="${mid(r)}" ${FONT} text-anchor="middle">0</text>`)
      if (m === '||') out.push(`<path d="M${x - 2} ${r * ROW_H}V${(r + 1) * ROW_H}M${x + 2} ${r * ROW_H}V${(r + 1) * ROW_H}" stroke="#222" stroke-width="1.2"/>`)
    })
  })
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    desc +
    `<rect width="${W}" height="${H}" fill="#fff"/>` +
    `<g fill="#222">${out.join('')}</g>` +
    `</svg>`
  return { svg, width: W, height: H }
}
