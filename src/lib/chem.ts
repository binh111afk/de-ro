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
/** H2O → H<sub>2</sub>O trong SVG */
function formulaSvg(s: string, sz = 17) {
  return esc(s).replace(/(\d+)/g, `<tspan font-size="${Math.round(sz * 0.68)}" dy="4">$1</tspan><tspan dy="-4">​</tspan>`)
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
 * Công thức cấu tạo thu gọn (mạch hở)
 * ------------------------------------------------------------------ */

export interface StructSpec {
  /** "CH3-CH(CH3)-CH2-OH", "CH2=CH-CH3", "CH≡C-CH3"; nhiều nhánh: "CH3-C(CH3)(CH3)-CH3" */
  formula: string
}

type Grp = { text: string; bond: string; branches: Grp[][] }

function parseChain(src: string): Grp[] {
  let i = 0
  const chain = (): Grp[] => {
    const out: Grp[] = []
    let bond = ''
    for (;;) {
      let text = ''
      while (i < src.length && !'-=≡#()'.includes(src[i])) text += src[i++]
      text = text.trim()
      if (!text) throw new Error(`Thiếu nhóm nguyên tử ở vị trí ${i + 1}`)
      const g: Grp = { text, bond, branches: [] }
      while (src[i] === '(') {
        i++
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

const tw = (s: string) => s.replace(/\d/g, '').length * 11 + s.replace(/\D/g, '').length * 6.5

function bondSvg(kind: string, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.hypot(dx, dy) || 1
  const [nx, ny] = [-dy / L, dx / L]
  const ln = (o: number) => `<line x1="${f1(x1 + nx * o)}" y1="${f1(y1 + ny * o)}" x2="${f1(x2 + nx * o)}" y2="${f1(y2 + ny * o)}" stroke="#111" stroke-width="1.4"/>`
  if (kind === '=') return ln(-2.5) + ln(2.5)
  if (kind === '≡') return ln(-4) + ln(0) + ln(4)
  return ln(0)
}

export function renderStructSvg(spec: StructSpec, desc: string) {
  const main = parseChain(spec.formula)
  const BOND = 26
  const ROW = 48
  const nodes: string[] = []
  let minY = 0
  let maxY = 0
  // nhánh dọc: luân phiên dưới / trên; nhánh của nhánh đi tiếp cùng chiều
  const drawVert = (grp: Grp[], cx: number, y0: number, dir: number) => {
    let y = y0
    for (const g of grp) {
      const ny = y + dir * ROW
      nodes.push(bondSvg(g.bond, cx, y + dir * 11, cx, ny - dir * 13))
      nodes.push(`<text x="${f1(cx)}" y="${f1(ny + 6)}" ${FAM} font-size="17" text-anchor="middle">${formulaSvg(g.text)}</text>`)
      minY = Math.min(minY, ny)
      maxY = Math.max(maxY, ny)
      g.branches.forEach((b, k) => drawVert(b, cx + (k ? 40 : 0), ny, dir))
      y = ny
    }
  }
  let x = 0
  main.forEach((g, i) => {
    const w = tw(g.text)
    if (i) {
      nodes.push(bondSvg(g.bond, x + 3, 0, x + BOND - 3, 0))
      x += BOND
    }
    const cx = x + w / 2
    nodes.push(`<text x="${f1(cx)}" y="6" ${FAM} font-size="17" text-anchor="middle">${formulaSvg(g.text)}</text>`)
    g.branches.forEach((b, k) => drawVert(b, cx, 0, k % 2 === 0 ? 1 : -1))
    x += w
  })
  const pad = 24
  const W = Math.max(160, x + pad * 2)
  const H = maxY - minY + 30 + pad * 2
  const body = `<g transform="translate(${pad} ${f1(pad + 14 - minY)})">${nodes.join('')}</g>`
  return wrap(W, H, desc, body)
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
