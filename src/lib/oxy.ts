/**
 * Hệ trục Oxy kiểu SGK lớp 10: điểm, vectơ, đoạn, đường thẳng, đường tròn,
 * parabol / đồ thị y = f(x), và miền nghiệm hệ bất phương trình bậc nhất hai ẩn
 * (gạch bỏ phần KHÔNG thoả — miền để trắng là miền nghiệm, đúng quy ước SGK).
 *
 * Mỗi dòng một lệnh (xem OXY_HELP). Hai trục cùng đơn vị.
 */
import { parseExpr } from './plot'

export interface OxySpec {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  grid: boolean
  /** hiện số trên trục */
  numbers: boolean
  items: string
}

type V = [number, number]

/* ------------------------------------------------------------------ *
 * Biểu thức bậc nhất ax + by + c (đọc tay, không eval)
 * ------------------------------------------------------------------ */

/** "2x - 3y + 1" → [a, b, c]; null nếu không phải bậc nhất */
function linear(src: string): [number, number, number] | null {
  const s = src.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/,/g, '.')
  if (!s) return [0, 0, 0]
  const terms = s.match(/[+-]?[^+-]+/g)
  if (!terms || terms.join('') !== s) return null
  let a = 0
  let b = 0
  let c = 0
  for (const t of terms) {
    const m = /^([+-]?)(\d*\.?\d*(?:\/\d+(?:\.\d+)?)?)\*?([xy]?)$/.exec(t)
    if (!m || (!m[2] && !m[3])) return null
    let k = m[2] ? (m[2].includes('/') ? Number(m[2].split('/')[0]) / Number(m[2].split('/')[1]) : Number(m[2])) : 1
    if (!Number.isFinite(k)) return null
    if (m[1] === '-') k = -k
    if (m[3] === 'x') a += k
    else if (m[3] === 'y') b += k
    else c += k
  }
  return [a, b, c]
}

function num(s: string): number | null {
  const t = s.trim().replace(/[−–]/g, '-').replace(',', '.')
  const m = /^(-?\d*\.?\d+)(?:\/(\d+(?:\.\d+)?))?$/.exec(t)
  if (!m) return null
  return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1])
}

/* ------------------------------------------------------------------ *
 * Đọc lệnh
 * ------------------------------------------------------------------ */

type Item =
  | { t: 'point'; name: string; p: V; proj: boolean }
  | { t: 'seg'; a: V; b: V; dashed: boolean }
  | { t: 'vec'; a: V; b: V; label?: string }
  | { t: 'line'; a: number; b: number; c: number; label?: string; dashed: boolean }
  | { t: 'circle'; c: V; r: number }
  | { t: 'curve'; src: string; label?: string }
  | { t: 'ineq'; a: number; b: number; c: number; strict: boolean }

export function parseOxy(text: string): { items: Item[]; errors: Array<{ line: number; msg: string }> } {
  const items: Item[] = []
  const errors: Array<{ line: number; msg: string }> = []
  const pts = new Map<string, V>()
  pts.set('O', [0, 0])
  const P = /([A-Z][0-9]*'*)\s*\(\s*([^;,()]+)\s*[;,]\s*([^;,()]+)\s*\)/

  text.split('\n').forEach((raw, i) => {
    const line = i + 1
    const s = raw.replace(/[−–]/g, '-').replace(/[≤⩽]/g, '<=').replace(/[≥⩾]/g, '>=').trim()
    if (!s || s.startsWith('//')) return
    const err = (msg: string) => errors.push({ line, msg })
    const getPt = (n: string) => {
      const p = pts.get(n)
      if (!p) err(`chưa có điểm ${n} — khai báo trước, vd. ${n}(1; 2)`)
      return p
    }
    const lower = s.toLowerCase()

    // điểm: A(1; 2) — có thể nhiều điểm một dòng; "chiếu" thêm nét đứt xuống hai trục
    if (P.test(s) && !/[<>=]/.test(s)) {
      const proj = /chiếu|hạ/i.test(s)
      const re = new RegExp(P.source, 'g')
      let m: RegExpExecArray | null
      while ((m = re.exec(s))) {
        const x = num(m[2])
        const y = num(m[3])
        if (x === null || y === null) return err(`toạ độ ${m[1]} không phải số`)
        pts.set(m[1], [x, y])
        items.push({ t: 'point', name: m[1], p: [x, y], proj })
      }
      return
    }
    // vectơ AB · vec u(2; 1) (gốc O)
    const vec = /^(?:vectơ|vecto|vec)\s+(.+)$/i.exec(s)
    if (vec) {
      const free = /^([a-z])\s*\(\s*([^;,]+)[;,]\s*([^)]+)\)$/.exec(vec[1].trim())
      if (free) {
        const x = num(free[2])
        const y = num(free[3])
        if (x === null || y === null) return err('toạ độ vectơ không phải số')
        items.push({ t: 'vec', a: [0, 0], b: [x, y], label: free[1] })
        return
      }
      const ns = vec[1].match(/[A-Z][0-9]*'*/g) ?? []
      if (ns.length !== 2) return err('ví dụ: vectơ AB hoặc vectơ u(2; 1)')
      const a = getPt(ns[0])
      const b = getPt(ns[1])
      if (a && b) items.push({ t: 'vec', a, b })
      return
    }
    // đường tròn (I; 2) · đường tròn tâm I bán kính 2 · đường tròn (1; 2) 3
    const circ = /^đường tròn\s*(.*)$/i.exec(s)
    if (circ) {
      const rest = circ[1]
      const name = /\b([A-Z][0-9]*'*)\b/.exec(rest)?.[1]
      const nums = (rest.replace(/[A-Z][0-9]*'*/g, ' ').match(/-?\d+(?:[.,]\d+)?(?:\/\d+)?/g) ?? []).map((x) => num(x)!)
      let c: V | undefined
      let r: number | undefined
      if (name) {
        c = getPt(name)
        r = nums[0]
      } else if (nums.length >= 3) {
        c = [nums[0], nums[1]]
        r = nums[2]
      }
      if (!c || r === undefined || !(r > 0)) return err('ví dụ: đường tròn (I; 2) hoặc đường tròn (1; 2) 3')
      items.push({ t: 'circle', c, r })
      return
    }
    // đường thẳng AB (kéo dài hết khung)
    const lineAB = /^(?:đường thẳng|dt)\s+([A-Z][0-9]*'*)\s*([A-Z][0-9]*'*)\s*(đứt)?$/i.exec(s)
    if (lineAB) {
      const a = getPt(lineAB[1])
      const b = getPt(lineAB[2])
      if (!a || !b) return
      const A = b[1] - a[1]
      const B = a[0] - b[0]
      items.push({ t: 'line', a: A, b: B, c: -(A * a[0] + B * a[1]), dashed: !!lineAB[3] })
      return
    }
    // bất phương trình bậc nhất: 2x + y <= 4
    const ine = /^([^<>]+?)\s*(<=|>=|<|>)\s*([^<>]+)$/.exec(s)
    if (ine) {
      const l = linear(ine[1])
      const r = linear(ine[3])
      if (!l || !r) return err('bất phương trình phải bậc nhất theo x, y, vd. 2x + y <= 4')
      // đưa về a x + b y + c ≤ 0 (hoặc < 0)
      let [a, b, c] = [l[0] - r[0], l[1] - r[1], l[2] - r[2]]
      if (ine[2].startsWith('>')) [a, b, c] = [-a, -b, -c]
      if (a === 0 && b === 0) return err('thiếu x, y')
      items.push({ t: 'ineq', a, b, c, strict: !ine[2].includes('=') })
      return
    }
    // phương trình: "d: 2x - y + 1 = 0" · "y = x^2 - 2x" · "x = 2"
    const eq = /^(?:([a-zA-Z(][^:]*):\s*)?([^=]+)=([^=]+)$/.exec(s)
    if (eq) {
      const label = eq[1]?.trim()
      const lhs = eq[2].trim()
      const rhs = eq[3].trim()
      const dashed = /\bđứt$/.test(rhs)
      const rhsC = rhs.replace(/\s*đứt$/, '')
      const l = linear(lhs)
      const r = linear(rhsC)
      if (l && r) {
        const [a, b, c] = [l[0] - r[0], l[1] - r[1], l[2] - r[2]]
        if (a === 0 && b === 0) return err('phương trình thiếu x, y')
        items.push({ t: 'line', a, b, c, label, dashed })
        return
      }
      if (lhs.toLowerCase() === 'y') {
        try {
          parseExpr(rhsC)
        } catch (e) {
          return err(e instanceof Error ? e.message : String(e))
        }
        items.push({ t: 'curve', src: rhsC, label })
        return
      }
      return err('không hiểu phương trình — dùng dạng ax + by + c = 0 hoặc y = f(x)')
    }
    // đoạn: AB, BC, CA (thêm "đứt")
    const dashed = /(^|\s)đứt$/.test(lower)
    const groups = s.replace(/\s*đứt$/i, '').split(/[\s,;]+/).filter(Boolean)
    for (const g of groups) {
      const ns = g.match(/[A-Z][0-9]*'*/g) ?? []
      if (ns.join('') !== g || ns.length < 2) return err(`không hiểu "${g}" — bấm dấu ? để xem các lệnh`)
      const ps = ns.map(getPt)
      if (ps.some((p) => !p)) return
      for (let k = 0; k + 1 < ps.length; k++) items.push({ t: 'seg', a: ps[k]!, b: ps[k + 1]!, dashed })
    }
  })
  return { items, errors }
}

/* ------------------------------------------------------------------ *
 * Vẽ
 * ------------------------------------------------------------------ */

const FAM = `font-family="'Times New Roman',serif"`
const FONT = `${FAM} font-size="16"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => n.toFixed(1)
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',')).replace('-', '−')

/** cắt đa giác lồi theo nửa mặt phẳng a x + b y + c >= 0 (Sutherland–Hodgman) */
function clipHalf(poly: V[], a: number, b: number, c: number): V[] {
  const out: V[] = []
  const val = (p: V) => a * p[0] + b * p[1] + c
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const vp = val(p)
    const vq = val(q)
    if (vp >= 0) out.push(p)
    if ((vp >= 0) !== (vq >= 0)) {
      const t = vp / (vp - vq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

export function renderOxySvg(spec: OxySpec, desc: string): { svg: string; width: number; height: number; errors: Array<{ line: number; msg: string }> } {
  const { items, errors } = parseOxy(spec.items)
  const xMin = Math.min(spec.xMin, -0.5)
  const xMax = Math.max(spec.xMax, 0.5)
  const yMin = Math.min(spec.yMin, -0.5)
  const yMax = Math.max(spec.yMax, 0.5)
  const unit = Math.max(14, Math.min(48, 380 / (xMax - xMin)))
  const pad = 26
  const W = Math.round((xMax - xMin) * unit + 2 * pad)
  const H = Math.round((yMax - yMin) * unit + 2 * pad)
  const X = (x: number) => pad + (x - xMin) * unit
  const Y = (y: number) => pad + (yMax - y) * unit
  const S = (p: V) => `${f1(X(p[0]))} ${f1(Y(p[1]))}`
  const box: V[] = [
    [xMin, yMin],
    [xMax, yMin],
    [xMax, yMax],
    [xMin, yMax],
  ]
  const back: string[] = []
  const out: string[] = []

  // lưới
  if (spec.grid) {
    let g = ''
    for (let x = Math.ceil(xMin); x <= xMax; x++) g += `M${f1(X(x))} ${f1(Y(yMin))}V${f1(Y(yMax))}`
    for (let y = Math.ceil(yMin); y <= yMax; y++) g += `M${f1(X(xMin))} ${f1(Y(y))}H${f1(X(xMax))}`
    back.push(`<path d="${g}" stroke="#d6d6d6" stroke-width="0.8"/>`)
  }
  // miền gạch bỏ (phần không thoả từng bất phương trình)
  for (const it of items) {
    if (it.t !== 'ineq') continue
    const bad = clipHalf(box, it.a, it.b, it.c) // a x + b y + c >= 0 là phần bị loại
    if (bad.length >= 3) back.push(`<path d="M${bad.map(S).join('L')}Z" fill="url(#oxyhatch)" stroke="none"/>`)
  }
  // trục
  const ax = `M${f1(X(xMin))} ${f1(Y(0))}H${f1(X(xMax) + 10)}`
  out.push(`<path d="${ax}" stroke="#222" stroke-width="1.2" marker-end="url(#oxyarr)"/>`)
  out.push(`<path d="M${f1(X(0))} ${f1(Y(yMin))}V${f1(Y(yMax) - 10)}" stroke="#222" stroke-width="1.2" marker-end="url(#oxyarr)"/>`)
  out.push(`<text x="${f1(X(xMax) + 4)}" y="${f1(Y(0) + 18)}" ${FONT} font-style="italic">x</text>`)
  out.push(`<text x="${f1(X(0) - 14)}" y="${f1(Y(yMax) - 2)}" ${FONT} font-style="italic">y</text>`)
  out.push(`<text x="${f1(X(0) - 13)}" y="${f1(Y(0) + 16)}" ${FONT} font-style="italic">O</text>`)
  // vạch chia + số
  const step = unit < 20 ? 2 : 1
  let ticks = ''
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    if (x === 0) continue
    ticks += `M${f1(X(x))} ${f1(Y(0) - 3)}v6`
    if (spec.numbers && x % step === 0) out.push(`<text x="${f1(X(x))}" y="${f1(Y(0) + 17)}" ${FAM} font-size="13" text-anchor="middle">${fmt(x)}</text>`)
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    if (y === 0) continue
    ticks += `M${f1(X(0) - 3)} ${f1(Y(y))}h6`
    if (spec.numbers && y % step === 0) out.push(`<text x="${f1(X(0) - 7)}" y="${f1(Y(y) + 4.5)}" ${FAM} font-size="13" text-anchor="end">${fmt(y)}</text>`)
  }
  out.push(`<path d="${ticks}" stroke="#222" stroke-width="1"/>`)

  // clip mọi nét theo khung
  const draw: string[] = []
  for (const it of items) {
    if (it.t === 'ineq' || it.t === 'line') {
      // đường bờ: cắt khung để lấy hai đầu
      const { a, b, c } = it
      const seg = clipHalf(clipHalf(box, a, b, c + 1e-9), -a, -b, -c + 1e-9)
      if (seg.length >= 2) {
        const xs = seg.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1])
        const p = xs[0]
        const q = xs[xs.length - 1]
        const dashed = it.t === 'ineq' ? it.strict : it.dashed
        draw.push(`<path d="M${S(p)}L${S(q)}" stroke="#222" stroke-width="1.5"${dashed ? ' stroke-dasharray="6 4"' : ''}/>`)
        if (it.t === 'line' && it.label) draw.push(`<text x="${f1(X(q[0]) - 4)}" y="${f1(Y(q[1]) - 6)}" ${FONT} font-style="italic" text-anchor="end">${esc(it.label)}</text>`)
      }
    } else if (it.t === 'seg') {
      draw.push(`<path d="M${S(it.a)}L${S(it.b)}" stroke="#222" stroke-width="1.5"${it.dashed ? ' stroke-dasharray="6 4"' : ''}/>`)
    } else if (it.t === 'vec') {
      draw.push(`<path d="M${S(it.a)}L${S(it.b)}" stroke="#222" stroke-width="1.6" marker-end="url(#oxyarr)"/>`)
      if (it.label) {
        const m: V = [(it.a[0] + it.b[0]) / 2, (it.a[1] + it.b[1]) / 2]
        const lx = X(m[0]) - 10
        const ly = Y(m[1]) - 8
        draw.push(`<text x="${f1(lx)}" y="${f1(ly)}" ${FONT} font-style="italic" text-anchor="middle">${esc(it.label)}</text>`)
        draw.push(`<path d="M${f1(lx - 5)} ${f1(ly - 14)}h10" stroke="#222" stroke-width="1" marker-end="url(#oxyarrs)"/>`)
      }
    } else if (it.t === 'circle') {
      draw.push(`<circle cx="${f1(X(it.c[0]))}" cy="${f1(Y(it.c[1]))}" r="${f1(it.r * unit)}" fill="none" stroke="#222" stroke-width="1.5"/>`)
    } else if (it.t === 'curve') {
      const f = parseExpr(it.src)
      let d = ''
      let pen = false
      let last: V | null = null
      const n = 600
      for (let k = 0; k <= n; k++) {
        const x = xMin + ((xMax - xMin) * k) / n
        const y = f(x)
        const ok = Number.isFinite(y) && y > yMin - (yMax - yMin) && y < yMax + (yMax - yMin)
        if (!ok) {
          pen = false
          continue
        }
        d += `${pen ? 'L' : 'M'}${f1(X(x))} ${f1(Y(y))}`
        pen = true
        if (y >= yMin && y <= yMax) last = [x, y]
      }
      draw.push(`<path d="${d}" fill="none" stroke="#222" stroke-width="1.6"/>`)
      if (it.label && last) draw.push(`<text x="${f1(X(last[0]) - 6)}" y="${f1(Y(last[1]) + 2)}" ${FONT} font-style="italic" text-anchor="end">${esc(it.label)}</text>`)
    }
  }
  // điểm (trên cùng) + nét chiếu xuống trục
  for (const it of items) {
    if (it.t !== 'point') continue
    const [x, y] = it.p
    if (it.proj) {
      draw.push(`<path d="M${S(it.p)}L${f1(X(x))} ${f1(Y(0))}M${S(it.p)}L${f1(X(0))} ${f1(Y(y))}" stroke="#222" stroke-width="1" stroke-dasharray="4 3"/>`)
      if (!spec.numbers || !Number.isInteger(x)) draw.push(`<text x="${f1(X(x))}" y="${f1(Y(0) + (y >= 0 ? 17 : -6))}" ${FAM} font-size="13" text-anchor="middle">${fmt(x)}</text>`)
      if (!spec.numbers || !Number.isInteger(y)) draw.push(`<text x="${f1(X(0) + (x >= 0 ? -7 : 7))}" y="${f1(Y(y) + 4.5)}" ${FAM} font-size="13" text-anchor="${x >= 0 ? 'end' : 'start'}">${fmt(y)}</text>`)
    }
    if (it.name === 'O' && x === 0 && y === 0) continue
    draw.push(`<circle cx="${f1(X(x))}" cy="${f1(Y(y))}" r="2.6" fill="#222"/>`)
    const dx = x >= 0 ? 7 : -7
    draw.push(`<text x="${f1(X(x) + dx)}" y="${f1(Y(y) - 7)}" ${FONT} font-style="italic" text-anchor="${x >= 0 ? 'start' : 'end'}">${esc(it.name)}</text>`)
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    desc +
    `<defs>` +
    `<marker id="oxyarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#222"/></marker>` +
    `<marker id="oxyarrs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#222"/></marker>` +
    `<pattern id="oxyhatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#fff" fill-opacity="0"/><path d="M0 0V7" stroke="#555" stroke-width="1.1"/></pattern>` +
    `<clipPath id="oxyclip"><rect x="${f1(X(xMin))}" y="${f1(Y(yMax))}" width="${f1((xMax - xMin) * unit)}" height="${f1((yMax - yMin) * unit)}"/></clipPath>` +
    `</defs>` +
    `<rect width="${W}" height="${H}" fill="#fff"/>` +
    back.join('') +
    out.join('') +
    `<g clip-path="url(#oxyclip)">${draw.join('')}</g>` +
    `</svg>`
  return { svg, width: W, height: H, errors }
}

export const OXY_HELP: Array<{ group: string; items: Array<{ code: string; what: string }> }> = [
  {
    group: 'Điểm, đoạn, vectơ',
    items: [
      { code: 'A(1; 2)  B(-2; 3)', what: 'Khai báo điểm (nhiều điểm một dòng được)' },
      { code: 'M(2; 3) chiếu', what: 'Điểm kèm nét đứt chiếu xuống hai trục' },
      { code: 'AB, BC, CA', what: 'Nối đoạn (thêm "đứt" để vẽ nét đứt)' },
      { code: 'vectơ AB', what: 'Vectơ từ A đến B' },
      { code: 'vectơ u(2; 1)', what: 'Vectơ u đặt tại gốc O' },
    ],
  },
  {
    group: 'Đường thẳng, đường tròn, đồ thị',
    items: [
      { code: 'd: 2x - y + 1 = 0', what: 'Đường thẳng theo phương trình, ghi tên d' },
      { code: 'đường thẳng AB', what: 'Đường thẳng qua A, B (kéo dài hết khung)' },
      { code: 'x = 2', what: 'Đường thẳng đứng' },
      { code: '(P): y = x^2 - 2x', what: 'Parabol / đồ thị hàm số bất kì' },
      { code: 'đường tròn (I; 2)', what: 'Tâm I (đã khai báo), bán kính 2' },
      { code: 'đường tròn (1; -2) 3', what: 'Tâm (1; −2), bán kính 3' },
    ],
  },
  {
    group: 'Miền nghiệm',
    items: [
      { code: 'x + y <= 4', what: 'Gạch bỏ phần không thoả; bờ nét liền' },
      { code: '2x - y > 1', what: 'Bất đẳng thức chặt: bờ nét đứt' },
      { code: 'x >= 0', what: 'Mỗi bất phương trình một dòng; miền để trắng là miền nghiệm' },
    ],
  },
]
