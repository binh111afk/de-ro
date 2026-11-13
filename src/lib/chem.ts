/**
 * Công cụ Hoá học:
 * - Cấu hình electron + ô orbital: gõ kí hiệu nguyên tố (Fe, Cl…) hoặc số hiệu (26).
 * - Công thức cấu tạo thu gọn mạch hở: "CH3-CH(CH3)-CH2-OH", liên kết "-", "=", "≡"; nhánh trong ngoặc.
 * - Đồ thị bài toán (số mol kết tủa / khí theo chất thêm vào): các điểm gấp khúc "(x; y)".
 */
import { renderMotionSvg } from './physics'

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
function wrap(W: number, H: number, desc: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: W, height: H }
}
/** H2O → H₂O, NH3^+ → NH₃⁺, COO^- → COO⁻ trong SVG */
function formulaSvg(s: string, sz = 17) {
  const subSz = Math.round(sz * 0.68)
  const subDy = Math.round(sz * 0.24)
  const supDy = Math.round(sz * 0.35)
  return esc(s).replace(/\^\{?(\d*[+-])\}?|(\d+)/g, (_, sup: string | undefined, sub: string | undefined) =>
    sup
      ? `<tspan font-size="${subSz}" dy="${-supDy}">${sup.replace(/-/g, '−')}</tspan><tspan dy="${supDy}">\u200B</tspan>`
      : `<tspan font-size="${subSz}" dy="${subDy}">${sub}</tspan><tspan dy="${-subDy}">\u200B</tspan>`,
  )
}
const SUB = '₀₁₂₃₄₅₆₇₈₉'
/** chữ số sau chữ cái thành chỉ số dưới Unicode: CO2 → CO₂ */
export const subscript = (s: string) => s.replace(/([A-Za-z)])(\d+)/g, (_, a: string, d: string) => a + [...d].map((c) => SUB[+c]).join(''))

/* ------------------------------------------------------------------ *
 * Cấu hình electron
 * ------------------------------------------------------------------ */

const SYMBOLS =
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba'.split(' ')
const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s']
const CAP: Record<string, number> = { s: 2, p: 6, d: 10 }

export interface ElectronSpec {
  /** "Fe", "26", hoặc "Fe2+" / "Cl-" (ion) */
  element: string
  /** chỉ vẽ ô orbital lớp ngoài cùng (và phân lớp d sát ngoài) */
  valenceOnly: boolean
}

export function electronConfig(input: string): { name: string; z: number; shells: Array<[string, number]> } {
  const m = /^\s*([A-Za-z]{1,2}|\d{1,2})\s*(?:(\d?)([+-]))?\s*$/.exec(input)
  if (!m) throw new Error('Gõ kí hiệu nguyên tố (vd. Fe, Cl) hoặc số hiệu (vd. 26); ion: Fe3+, Cl-')
  const sym = /\d/.test(m[1]) ? SYMBOLS[+m[1] - 1] : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()
  const z = SYMBOLS.indexOf(sym) + 1
  if (!z) throw new Error(`Chưa hỗ trợ nguyên tố "${m[1]}" (có từ H đến Ba, Z = 1–56)`)
  let e = z
  const fill = (n: number) => {
    const out: Array<[string, number]> = []
    let left = n
    for (const o of ORDER) {
      if (left <= 0) break
      const k = Math.min(CAP[o[1]], left)
      out.push([o, k])
      left -= k
    }
    return out
  }
  let shells = fill(e)
  // ngoại lệ bán bão hoà / bão hoà: Cr, Cu, Mo, Ag
  if ([24, 29, 42, 47].includes(z)) {
    const ns = shells.find(([o]) => o.endsWith('s') && ((z < 40 && o === '4s') || (z > 40 && o === '5s')))!
    const d = shells.find(([o]) => o === (z < 40 ? '3d' : '4d'))!
    ns[1] = 1
    d[1] += 1
  }
  if (m[3]) {
    const q = Number(m[2] || 1) * (m[3] === '+' ? 1 : -1)
    e = z - q
    if (q < 0) shells = fill(e)
    else {
      // cation: bớt electron lớp ngoài cùng (ns) trước, rồi (n−1)d
      let left = q
      // lớp n lớn nhất trước (4s trước 3d); cùng lớp thì d → p → s (Al3+: 3p rồi 3s)
      const byN = [...shells].sort((a, b) => +b[0][0] - +a[0][0] || 'dps'.indexOf(a[0][1]) - 'dps'.indexOf(b[0][1]))
      for (const sh of byN) {
        const k = Math.min(sh[1], left)
        sh[1] -= k
        left -= k
        if (!left) break
      }
      shells = shells.filter(([, k]) => k > 0)
    }
  }
  const sorted = [...shells].sort((a, b) => +a[0][0] - +b[0][0] || 'spd'.indexOf(a[0][1]) - 'spd'.indexOf(b[0][1]))
  return { name: sym + (m[3] ? `${m[2] && m[2] !== '1' ? m[2] : ''}${m[3]}` : ''), z, shells: sorted }
}

/** Fe3+ → Fe với điện tích 3+ ở trên */
function ionSvg(name: string) {
  const m = /^([A-Za-z]+)(\d?[+-])?$/.exec(name)
  return m && m[2] ? `${m[1]}<tspan font-size="11" dy="-7">${m[2].replace('-', '−')}</tspan><tspan dy="7">​</tspan>` : esc(name)
}

export function renderElectronSvg(spec: ElectronSpec, desc: string) {
  const { name, z, shells } = electronConfig(spec.element)
  const maxN = Math.max(...shells.map(([o]) => +o[0]))
  const show = spec.valenceOnly ? shells.filter(([o]) => +o[0] === maxN || (o[1] === 'd' && +o[0] === maxN - 1)) : shells
  const B = 26
  const gap = 14
  const W0 = show.reduce((w, [o]) => w + (CAP[o[1]] / 2) * B + gap, 0) - gap
  const W = Math.max(W0 + 40, 300)
  const H = 125
  let x = (W - W0) / 2
  const y = 62
  // dòng cấu hình
  const conf = shells.map(([o, k]) => `${o}<tspan font-size="11" dy="-7">${k}</tspan><tspan dy="7"> </tspan>`).join('')
  let b = `<text x="${W / 2}" y="26" ${FAM} font-size="16" text-anchor="middle">${ionSvg(name)} (Z = ${z}): ${conf}</text>`
  for (const [o, k] of show) {
    const boxes = CAP[o[1]] / 2
    // quy tắc Hund: điền mỗi ô một e ↑ trước, rồi ghép ↓
    const ups = Math.min(k, boxes)
    const downs = k - ups
    for (let i = 0; i < boxes; i++) {
      const bx = x + i * B
      b += `<rect x="${f1(bx)}" y="${y}" width="${B}" height="${B}" fill="none" stroke="#111" stroke-width="1.4"/>`
      const arr = (cx: number, up: boolean) =>
        up
          ? `<path d="M${f1(cx)} ${y + B - 5}V${y + 6}M${f1(cx - 3.5)} ${y + 10}L${f1(cx)} ${y + 5}L${f1(cx + 3.5)} ${y + 10}" stroke="#111" stroke-width="1.5" fill="none"/>`
          : `<path d="M${f1(cx)} ${y + 5}V${y + B - 6}M${f1(cx - 3.5)} ${y + B - 10}L${f1(cx)} ${y + B - 5}L${f1(cx + 3.5)} ${y + B - 10}" stroke="#111" stroke-width="1.5" fill="none"/>`
      if (i < ups) b += arr(bx + (i < downs ? B * 0.34 : B / 2), true)
      if (i < downs) b += arr(bx + B * 0.66, false)
    }
    b += `<text x="${f1(x + (boxes * B) / 2)}" y="${y + B + 22}" ${FAM} font-size="15" text-anchor="middle">${o}<tspan font-size="11" dy="-7">${k}</tspan></text>`
    x += boxes * B + gap
  }
  return wrap(W, H, desc, b)
}

/* ------------------------------------------------------------------ *
 * Công thức cấu tạo (mạch hở + vòng): thu gọn hoặc khung
 * ------------------------------------------------------------------ */

export interface StructSpec {
  /** "CH3-CH(CH3)-CH2-OH", "CH2=CH-CH3", "C6H5-CH3", "[benzen](1:CH3)(4:NO2)"; nhiều nhánh: "CH3-C(CH3)(CH3)-CH3" */
  formula: string
  /** thu gọn (mặc định) hoặc khung (zigzag, không ghi C, H) */
  style?: 'condensed' | 'skeletal'
  /** đánh số các C mạch chính / đỉnh vòng 1, 2, 3… */
  number?: boolean
  /** kiểu vòng thơm: 'kekule' (3 nối đôi xen kẽ, mặc định) hoặc 'circle' (vòng tròn) */
  ringStyle?: 'kekule' | 'circle'
  /** vẽ C6H5 / C6H4 / Ph thành vòng (mặc định true); đặt false ở kiểu thu gọn để giữ chữ */
  drawRings?: boolean
}

type RingSub = { pos: number; chain: Grp[] }
type Grp = { text: string; bond: string; branches: Grp[][]; ringSubs?: RingSub[] }

/** nhóm là vòng: [benzen], C6H5 / benzen (thơm), [xiclo3]…[xiclo6] / vòng3…vòng8 (no) */
function ringOf(text: string, allowFormulaRing = true): { n: number; aromatic: boolean } | null {
  const bracketed = text.startsWith('[') || text.endsWith(']')
  if (bracketed) {
    if (!text.startsWith('[')) throw new Error('Thiếu dấu "["')
    if (!text.endsWith(']')) throw new Error('Thiếu dấu "]"')
  }
  const raw = bracketed ? text.slice(1, -1) : text
  if (/^(benzen|benzene)$/i.test(raw)) return { n: 6, aromatic: true }
  if (/^(C6H5|C6H4|Ph)$/i.test(raw)) {
    if (!allowFormulaRing && !bracketed) return null
    return { n: 6, aromatic: true }
  }
  const m = /^(?:vòng|vong|xiclo)(\d+)$/i.exec(raw)
  if (m) {
    const n = +m[1]
    if (n < 3 || n > 8) throw new Error('Vòng từ 3 đến 8 cạnh')
    return { n, aromatic: false }
  }
  if (bracketed) throw new Error(`Chưa hỗ trợ vòng "${text}" (dùng [benzen], [xiclo3]…[xiclo6])`)
  return null
}

function parseChain(src: string): Grp[] {
  let i = 0
  const chain = (): Grp[] => {
    const out: Grp[] = []
    let bond = ''
    for (;;) {
      let text = ''
      while (i < src.length && !'-=≡#()'.includes(src[i])) {
        if (src[i] === '^') {
          const ch = /^\^(?:\{\d*[+-]\}|\d*[+-])/.exec(src.slice(i))
          if (ch) {
            text += ch[0]
            i += ch[0].length
            continue
          }
        }
        text += src[i++]
      }
      text = text.trim()
      if (!text || /^\^\{?\d*[+-]\}?$/.test(text)) throw new Error(`Thiếu nhóm nguyên tử ở vị trí ${i + 1}`)
      const ring = ringOf(text, true)
      const g: Grp = { text, bond, branches: [] }
      while (src[i] === '(') {
        i++
        if (ring) {
          const posM = /^(-?\d+):/.exec(src.slice(i))
          if (posM) {
            const pos = +posM[1]
            if (pos < 1 || pos > ring.n) throw new Error(`Vị trí nhóm thế (${pos}) phải từ 1 đến ${ring.n}`)
            i += posM[0].length
            let b = '-'
            if ('-=≡#'.includes(src[i])) b = src[i++]
            const br = chain()
            br[0].bond = b === '#' ? '≡' : b
            if (src[i] !== ')') throw new Error('Thiếu dấu ")"')
            i++
            ;(g.ringSubs ??= []).push({ pos, chain: br })
            continue
          }
        }
        // nhánh có thể bắt đầu bằng liên kết: (=O)
        let b = '-'
        if ('-=≡#'.includes(src[i])) b = src[i++]
        const br = chain()
        br[0].bond = b === '#' ? '≡' : b
        if (src[i] !== ')') throw new Error('Thiếu dấu ")"')
        i++
        g.branches.push(br)
      }
      out.push(g)
      if (i >= src.length || src[i] === ')') return out
      bond = src[i] === '#' ? '≡' : src[i]
      i++
    }
  }
  const s = src.replace(/\s+/g, '')
  if (!s) throw new Error('Chưa có công thức')
  src = s
  const res = chain()
  if (i < src.length) throw new Error('Thừa dấu ")"')
  return res
}
/** nhóm chỉ gồm C và H (CH3, CH2, CH, C): là đỉnh cacbon */
const isCarbon = (t: string) => /^C(H\d?)?$/.test(t)

const tw = (s: string) => {
  let supLen = 0
  const base = s.replace(/\^\{?(\d*[+-])\}?/g, (_, c: string) => {
    supLen += c.length
    return ''
  })
  return base.replace(/\d/g, '').length * 11 + (base.replace(/\D/g, '').length + supLen) * 6.5
}

function bondSvg(kind: string, x1: number, y1: number, x2: number, y2: number, inner = 0) {
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.hypot(dx, dy) || 1
  const [nx, ny] = [-dy / L, dx / L]
  const ln = (o: number, shrink = 0) =>
    `<line x1="${f1(x1 + nx * o + (dx / L) * shrink)}" y1="${f1(y1 + ny * o + (dy / L) * shrink)}" x2="${f1(x2 + nx * o - (dx / L) * shrink)}" y2="${f1(y2 + ny * o - (dy / L) * shrink)}" stroke="#111" stroke-width="1.4"/>`
  // khung: nét đôi lệch vào trong (inner = ±1), nét chính giữ đúng chỗ
  if (inner && kind === '=') return ln(0) + ln(5 * inner, 4)
  if (inner && kind === '≡') return ln(0) + ln(4, 3) + ln(-4, 3)
  if (kind === '=') return ln(-2.5) + ln(2.5)
  if (kind === '≡') return ln(-4) + ln(0) + ln(4)
  return ln(0)
}

/** đa giác đều tâm (cx, cy) bán kính r, đỉnh đầu ở góc a0 */
function polygon(n: number, cx: number, cy: number, r: number, a0: number): Array<[number, number]> {
  return Array.from({ length: n }, (_, k) => {
    const a = a0 + (2 * Math.PI * k) / n
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]
  })
}

export interface StructRing {
  n: number
  aromatic: boolean
  ringStyle: 'kekule' | 'circle'
  cx: number
  cy: number
  r: number
  /** Toạ độ các đỉnh theo thứ tự đánh số 1..n (index 0 là đỉnh 1) */
  vertices: Array<[number, number]>
  /** Các cạnh của vòng (index đỉnh 0..n-1) */
  edges: Array<{ from: number; to: number; order: 1 | 2 }>
}

export interface StructBond {
  x1: number
  y1: number
  x2: number
  y2: number
  kind: string
  inner?: number
}

export interface StructLabel {
  text: string
  x: number
  y: number
  box: { x0: number; y0: number; x1: number; y1: number }
}

export interface StructNumber {
  n: number
  x: number
  y: number
}

export interface StructLayout {
  rings: StructRing[]
  bonds: StructBond[]
  labels: StructLabel[]
  numbers: StructNumber[]
  bounds: { x0: number; y0: number; x1: number; y1: number }
  mainY: number
}

function makeRing(
  ring: { n: number; aromatic: boolean },
  ringStyle: 'kekule' | 'circle',
  cx: number,
  cy: number,
  r: number,
  a0: number,
): StructRing {
  const vertices = polygon(ring.n, cx, cy, r, a0)
  const edges = Array.from({ length: ring.n }, (_, k) => ({
    from: k,
    to: (k + 1) % ring.n,
    order: (ring.aromatic && ringStyle === 'kekule' && k % 2 === 0 ? 2 : 1) as 1 | 2,
  }))
  return { n: ring.n, aromatic: ring.aromatic, ringStyle, cx, cy, r, vertices, edges }
}

function ringSvgFromData(ring: StructRing): string {
  const P = ring.vertices
  let s = `<path d="M${P.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L')}Z" fill="none" stroke="#111" stroke-width="1.4"/>`
  if (ring.aromatic) {
    if (ring.ringStyle === 'circle') {
      s += `<circle cx="${f1(ring.cx)}" cy="${f1(ring.cy)}" r="${f1(ring.r * 0.58)}" fill="none" stroke="#111" stroke-width="1.2"/>`
    } else {
      for (const e of ring.edges) {
        if (e.order !== 2) continue
        const p1 = P[e.from]
        const p2 = P[e.to]
        const dx = p2[0] - p1[0]
        const dy = p2[1] - p1[1]
        const len = Math.hypot(dx, dy) || 1
        let nx = -dy / len
        let ny = dx / len
        const mx = (p1[0] + p2[0]) / 2
        const my = (p1[1] + p2[1]) / 2
        if ((ring.cx - mx) * nx + (ring.cy - my) * ny < 0) {
          nx = -nx
          ny = -ny
        }
        const off = 4.5
        const shrink = 4.5
        const ux = dx / len
        const uy = dy / len
        s += `<line x1="${f1(p1[0] + nx * off + ux * shrink)}" y1="${f1(p1[1] + ny * off + uy * shrink)}" x2="${f1(p2[0] + nx * off - ux * shrink)}" y2="${f1(p2[1] + ny * off - uy * shrink)}" stroke="#111" stroke-width="1.35"/>`
      }
    }
  }
  return s
}

const numSvg = (n: number, x: number, y: number) => `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="11" fill="#555" text-anchor="middle">${n}</text>`

/** Khung chữ nhật bao quanh các điểm đã vẽ — để tính khung SVG. */
class Bounds {
  x0 = Infinity
  y0 = Infinity
  x1 = -Infinity
  y1 = -Infinity
  add(x: number, y: number, r = 0) {
    this.x0 = Math.min(this.x0, x - r)
    this.y0 = Math.min(this.y0, y - r)
    this.x1 = Math.max(this.x1, x + r)
    this.y1 = Math.max(this.y1, y + r)
  }
}

export interface StructBody {
  body: string
  width: number
  height: number
  /** toạ độ y của mạch chính trong khung (0..height) */
  mainY: number
}

function hasAnyRing(grp: Grp[], allowFormulaRing: boolean): boolean {
  for (const g of grp) {
    if (ringOf(g.text, allowFormulaRing)) return true
    if (g.branches.some((b) => hasAnyRing(b, allowFormulaRing))) return true
  }
  return false
}

/* ---------- thu gọn ---------- */

function buildCondensed(
  main: Grp[],
  number: boolean,
  ringStyle: 'kekule' | 'circle',
  allowFormulaRing: boolean,
): { parts: string[]; layout: StructLayout } {
  const BOND = 26
  const ROW = 48
  const anyRing = hasAnyRing(main, allowFormulaRing)
  const R = anyRing ? 26 : 20
  const parts: string[] = []
  const bb = new Bounds()
  const rings: StructRing[] = []
  const bonds: StructBond[] = []
  const labels: StructLabel[] = []
  const numbers: StructNumber[] = []

  const addBond = (kind: string, x1: number, y1: number, x2: number, y2: number, inner = 0) => {
    parts.push(bondSvg(kind, x1, y1, x2, y2, inner))
    bonds.push({ x1, y1, x2, y2, kind, ...(inner ? { inner } : {}) })
  }
  const addNum = (n: number, x: number, y: number, pad = 10) => {
    parts.push(numSvg(n, x, y))
    numbers.push({ n, x, y })
    bb.add(x, y - pad)
  }
  const label = (t: string, x: number, y: number) => {
    parts.push(`<text x="${f1(x)}" y="${f1(y + 6)}" ${FAM} font-size="17" text-anchor="middle">${formulaSvg(t)}</text>`)
    const hw = tw(t) / 2
    bb.add(x - hw, y - 12)
    bb.add(x + hw, y + 10)
    labels.push({ text: t, x, y, box: { x0: x - hw, y0: y - 10, x1: x + hw, y1: y + 10 } })
  }

  const drawRingSubs = (sr: StructRing, subs: RingSub[] | undefined) => {
    if (!subs?.length) return
    const SUB_BOND = 22
    for (const sub of subs) {
      const v = sr.vertices[sub.pos - 1]
      const ux = (v[0] - sr.cx) / sr.r
      const uy = (v[1] - sr.cy) / sr.r
      const endX = v[0] + SUB_BOND * ux
      const endY = v[1] + SUB_BOND * uy
      const first = sub.chain[0]
      addBond(first.bond, v[0], v[1], endX, endY)
      const hw = tw(first.text) / 2 + 2
      const hh = 10
      const d = hw * Math.abs(ux) + hh * Math.abs(uy) + 2
      let cx = endX + d * ux
      let cy = endY + d * uy
      label(first.text, cx, cy)
      first.branches.forEach((b, k) => drawVert(b, cx + (k ? 40 : 0), cy, uy >= 0 ? 1 : -1))
      if (sub.chain.length > 1) {
        const horiz = Math.abs(ux) > 0.6
        if (horiz) {
          const sgn = ux >= 0 ? 1 : -1
          for (let j = 1; j < sub.chain.length; j++) {
            const g = sub.chain[j]
            const prevW = tw(sub.chain[j - 1].text)
            const curW = tw(g.text)
            const nx = cx + sgn * (prevW / 2 + BOND + curW / 2)
            addBond(g.bond, cx + sgn * (prevW / 2 + 3), cy, nx - sgn * (curW / 2 + 3), cy)
            label(g.text, nx, cy)
            g.branches.forEach((b, k) => drawVert(b, nx, cy, k % 2 === 0 ? 1 : -1))
            cx = nx
          }
        } else {
          drawVert(sub.chain.slice(1), cx, cy, uy >= 0 ? 1 : -1)
        }
      }
    }
  }

  const addRing = (
    ring: { n: number; aromatic: boolean },
    cx: number,
    cy: number,
    a0: number,
    subs?: RingSub[],
    numbered = false,
  ) => {
    const sr = makeRing(ring, ringStyle, cx, cy, R, a0)
    rings.push(sr)
    parts.push(ringSvgFromData(sr))
    for (const p of sr.vertices) bb.add(p[0], p[1], 2)
    if (numbered) {
      for (let k = 0; k < sr.n; k++) {
        const v = sr.vertices[k]
        const ux = (v[0] - cx) / R
        const uy = (v[1] - cy) / R
        const nx = cx + (R - 10) * ux
        const ny = cy + (R - 10) * uy + 4
        parts.push(`<text x="${f1(nx)}" y="${f1(ny)}" ${FAM} font-size="10" fill="#555" text-anchor="middle">${k + 1}</text>`)
        numbers.push({ n: k + 1, x: nx, y: ny })
      }
    }
    drawRingSubs(sr, subs)
  }

  // nhánh dọc: luân phiên dưới / trên; nhánh của nhánh đi tiếp cùng chiều
  const drawVert = (grp: Grp[], cx: number, y0: number, dir: number) => {
    let y = y0
    for (const g of grp) {
      const ring = ringOf(g.text, allowFormulaRing)
      if (ring) {
        const cy = y + dir * (14 + R + 14)
        addBond(g.bond, cx, y + dir * 11, cx, cy - dir * R)
        addRing(ring, cx, cy, dir > 0 ? -Math.PI / 2 : Math.PI / 2, g.ringSubs)
        return
      }
      const ny = y + dir * ROW
      addBond(g.bond, cx, y + dir * 11, cx, ny - dir * 13)
      label(g.text, cx, ny)
      g.branches.forEach((b, k) => drawVert(b, cx + (k ? 40 : 0), ny, dir))
      y = ny
    }
  }
  // các nhóm kề nhau cùng có 1 nhánh thì xen kẽ trên/dưới (kết thúc ở dưới để trường hợp 1 nhánh giữ nguyên như cũ)
  const singleBranchDir = main.map(() => 1)
  for (let i = 0; i < main.length; i++) {
    if (ringOf(main[i].text, allowFormulaRing) || main[i].branches.length !== 1) continue
    let end = i
    while (end + 1 < main.length && !ringOf(main[end + 1].text, allowFormulaRing) && main[end + 1].branches.length === 1) end++
    for (let j = i; j <= end; j++) singleBranchDir[j] = (end - j) % 2 === 0 ? 1 : -1
    i = end
  }
  let x = 0
  let no = 0
  main.forEach((g, i) => {
    const ring = ringOf(g.text, allowFormulaRing)
    const w = ring ? 2 * R : tw(g.text)
    if (i) {
      const prevRing = !!ringOf(main[i - 1].text, allowFormulaRing)
      addBond(g.bond, x + (prevRing ? 0 : 3), 0, x + BOND - (ring ? 0 : 3), 0)
      x += BOND
    }
    const cx = x + w / 2
    if (ring) {
      const a0 =
        main.length === 1
          ? ring.n === 4
            ? (-3 * Math.PI) / 4
            : -Math.PI / 2
          : i === 0
            ? 0
            : Math.PI
      addRing(ring, cx, 0, a0, g.ringSubs, number)
    } else {
      label(g.text, cx, 0)
      if (number && isCarbon(g.text)) {
        no++
        addNum(no, cx, -16)
      }
      if (g.branches.length === 1) drawVert(g.branches[0], cx, 0, singleBranchDir[i])
      else g.branches.forEach((b, k) => drawVert(b, cx, 0, k % 2 === 0 ? 1 : -1))
    }
    x += w
  })
  return {
    parts,
    layout: {
      rings,
      bonds,
      labels,
      numbers,
      bounds: { x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1 },
      mainY: 0,
    },
  }
}

/* ---------- khung (zigzag) ---------- */

function buildSkeletal(
  main: Grp[],
  number: boolean,
  ringStyle: 'kekule' | 'circle',
  allowFormulaRing: boolean,
): { parts: string[]; layout: StructLayout } {
  const L = 30
  const anyRing = hasAnyRing(main, allowFormulaRing)
  const R = anyRing ? 26 : 20
  const parts: string[] = []
  const bb = new Bounds()
  const rings: StructRing[] = []
  const bonds: StructBond[] = []
  const labels: StructLabel[] = []
  const numbers: StructNumber[] = []
  let minMainY = Infinity
  let maxMainY = -Infinity

  const text = (t: string, x: number, y: number) => {
    // OH, Cl, NH2… ghi chữ; nền trắng che đầu nét
    const w = tw(t) + 4
    parts.push(`<rect x="${f1(x - w / 2)}" y="${f1(y - 10)}" width="${f1(w)}" height="20" fill="#fff"/>`)
    parts.push(`<text x="${f1(x)}" y="${f1(y + 6)}" ${FAM} font-size="17" text-anchor="middle">${formulaSvg(t)}</text>`)
    bb.add(x - w / 2, y - 10)
    bb.add(x + w / 2, y + 10)
    labels.push({ text: t, x, y, box: { x0: x - w / 2, y0: y - 10, x1: x + w / 2, y1: y + 10 } })
  }

  /** vẽ một mạch từ điểm p theo hướng góc a (zigzag ±30° quanh a). */
  const walk = (grp: Grp[], p: [number, number], a: number, startSide: number, numbered: boolean, anchored = false) => {
    let cur = p
    let side = startSide
    let no = 0
    const pending: string[] = []
    const addBond = (kind: string, x1: number, y1: number, x2: number, y2: number, inner = 0) => {
      pending.push(bondSvg(kind, x1, y1, x2, y2, inner))
      bonds.push({ x1, y1, x2, y2, kind, ...(inner ? { inner } : {}) })
    }
    grp.forEach((g, i) => {
      const ring = ringOf(g.text, allowFormulaRing)
      const moves = i > 0 || anchored
      // nhánh: bước đầu đi thẳng ra ngoài, sau đó mới gấp khúc
      const dir = anchored && i === 0 ? a : a + side * (Math.PI / 6)
      if (ring) {
        // vòng đặt tiếp theo hướng mạch: đỉnh gắn = cur + bước, tâm lùi thêm R
        const att: [number, number] = moves ? [cur[0] + L * Math.cos(dir), cur[1] + L * Math.sin(dir)] : cur
        if (moves) addBond(g.bond, cur[0], cur[1], att[0], att[1])
        const cx = att[0] + R * Math.cos(a)
        const cy = att[1] + R * Math.sin(a)
        const a0 =
          !moves && grp.length === 1
            ? ring.n === 4
              ? (-3 * Math.PI) / 4
              : -Math.PI / 2
            : !moves
              ? a
              : a + Math.PI
        const sr = makeRing(ring, ringStyle, cx, cy, R, a0)
        rings.push(sr)
        pending.push(ringSvgFromData(sr))
        for (const pt of sr.vertices) bb.add(pt[0], pt[1], 2)
        if (!anchored) {
          minMainY = Math.min(minMainY, cy)
          maxMainY = Math.max(maxMainY, cy)
        }
        if (numbered) {
          for (let k = 0; k < sr.n; k++) {
            const v = sr.vertices[k]
            const ux = (v[0] - cx) / R
            const uy = (v[1] - cy) / R
            const nx = cx + (R - 10) * ux
            const ny = cy + (R - 10) * uy + 4
            pending.push(`<text x="${f1(nx)}" y="${f1(ny)}" ${FAM} font-size="10" fill="#555" text-anchor="middle">${k + 1}</text>`)
            numbers.push({ n: k + 1, x: nx, y: ny })
          }
        }
        if (g.ringSubs?.length) {
          for (const sub of g.ringSubs) {
            const v = sr.vertices[sub.pos - 1]
            const ux = (v[0] - cx) / R
            const uy = (v[1] - cy) / R
            const theta = Math.atan2(uy, ux)
            const first = sub.chain[0]
            if (isCarbon(first.text)) {
              walk(sub.chain, v, theta, 1, false, true)
            } else {
              const SUB_BOND = 22
              const endX = v[0] + SUB_BOND * ux
              const endY = v[1] + SUB_BOND * uy
              addBond(first.bond, v[0], v[1], endX, endY)
              const hw = tw(first.text) / 2 + 2
              const hh = 10
              const d = hw * Math.abs(ux) + hh * Math.abs(uy) + 2
              const lx = endX + d * ux
              const ly = endY + d * uy
              text(first.text, lx, ly)
              first.branches.forEach((b, k) => {
                const outward = theta + (Math.PI / 2) * (k ? -1 : 1)
                walk(b, [lx, ly], outward, 1, false, true)
              })
              if (sub.chain.length > 1) walk(sub.chain.slice(1), [lx, ly], theta, 1, false, true)
            }
          }
        }
        cur = [cx + R * Math.cos(a), cy + R * Math.sin(a)] // đi ra ở đỉnh đối diện
        side = -side
        return
      }
      const next: [number, number] = moves ? [cur[0] + L * Math.cos(dir), cur[1] + L * Math.sin(dir)] : cur
      if (!anchored) {
        minMainY = Math.min(minMainY, next[1])
        maxMainY = Math.max(maxMainY, next[1])
      }
      const carbon = isCarbon(g.text)
      if (moves) {
        const shrinkTo = carbon ? 0 : 10
        const ux = (next[0] - cur[0]) / L
        const uy = (next[1] - cur[1]) / L
        // liên kết đôi trong khung: nét phụ lệch vào phía lõm
        addBond(g.bond, cur[0], cur[1], next[0] - ux * shrinkTo, next[1] - uy * shrinkTo, -side)
      }
      bb.add(next[0], next[1], 2)
      if (!carbon) text(g.text, next[0], next[1])
      else if (numbered) {
        no++
        // số đặt phía ngoài góc gấp: đỉnh nhô lên thì ghi trên, đỉnh trũng thì ghi dưới
        // đỉnh có nhánh: nhánh chiếm phía ngoài nên số lùi vào trong góc, lệch sang phải
        const high = (moves ? side < 0 : startSide > 0) !== g.branches.length > 0
        const nx = next[0] + (g.branches.length ? 9 : 0)
        const ny = next[1] + (high ? -9 : 18)
        pending.push(numSvg(no, nx, ny))
        numbers.push({ n: no, x: nx, y: ny })
        bb.add(nx, ny, 6)
      }
      // nhánh: hướng ra phía lồi của đỉnh (vuông góc mạch), nhánh thứ hai phía còn lại
      g.branches.forEach((b, k) => {
        const outward = a + (Math.PI / 2) * (i === 0 ? 1 : side) * (k ? -1 : 1)
        walk(b, next, outward, 1, false, true)
      })
      cur = next
      if (moves) side = -side
    })
    parts.unshift(...pending)
  }
  walk(main, [0, 0], 0, -1, number)
  return {
    parts,
    layout: {
      rings,
      bonds,
      labels,
      numbers,
      bounds: { x0: bb.x0, y0: bb.y0, x1: bb.x1, y1: bb.y1 },
      mainY: Number.isFinite(minMainY) ? (minMainY + maxMainY) / 2 : 0,
    },
  }
}

export function layoutStruct(spec: StructSpec): StructLayout {
  const main = parseChain(spec.formula)
  const style = spec.style ?? 'condensed'
  const ringStyle = spec.ringStyle ?? 'kekule'
  const allowFormulaRing = style === 'skeletal' || spec.drawRings !== false
  const { layout } =
    style === 'skeletal'
      ? buildSkeletal(main, !!spec.number, ringStyle, allowFormulaRing)
      : buildCondensed(main, !!spec.number, ringStyle, allowFormulaRing)
  return layout
}

export function renderStructBody(spec: StructSpec): StructBody {
  const main = parseChain(spec.formula)
  const style = spec.style ?? 'condensed'
  const ringStyle = spec.ringStyle ?? 'kekule'
  const allowFormulaRing = style === 'skeletal' || spec.drawRings !== false
  const { parts, layout } =
    style === 'skeletal'
      ? buildSkeletal(main, !!spec.number, ringStyle, allowFormulaRing)
      : buildCondensed(main, !!spec.number, ringStyle, allowFormulaRing)
  const bb = layout.bounds
  return {
    body: `<g transform="translate(${f1(-bb.x0)} ${f1(-bb.y0)})">${parts.join('')}</g>`,
    width: bb.x1 - bb.x0,
    height: bb.y1 - bb.y0,
    mainY: layout.mainY - bb.y0,
  }
}

export function renderStructSvg(spec: StructSpec, desc: string) {
  const { body, width, height } = renderStructBody(spec)
  const pad = 22
  const W = Math.max(140, width + pad * 2)
  const H = Math.max(60, height + pad * 2)
  return wrap(Math.round(W), Math.round(H), desc, `<g transform="translate(${pad} ${pad})">${body}</g>`)
}

/* ------------------------------------------------------------------ *
 * Đồ thị bài toán hoá học (số mol)
 * ------------------------------------------------------------------ */

export interface ChemGraphSpec {
  /** "n CO2", "n↓"… — chữ số tự thành chỉ số dưới */
  xName: string
  yName: string
  points: string
  dashed: boolean
}

export function renderChemGraphSvg(spec: ChemGraphSpec, desc: string) {
  return renderMotionSvg({ yName: subscript(spec.yName), tName: subscript(spec.xName), points: spec.points, dashed: spec.dashed }, desc)
}
