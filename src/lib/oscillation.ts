/**
 * Đồ thị dao động điều hoà (Vật lí 11), điện xoay chiều u-i và sóng dừng (Vật lí 12).
 */
import { ARROW, FAM, esc, f1, fmt, wrap } from './physics'

export type OscMode = 'osc' | 'ac' | 'standing'
export type OscQty = 'x' | 'v' | 'a'
export type OscStartX0 =
  | 'A'
  | '-A'
  | '0'
  | 'A/2'
  | '-A/2'
  | 'A√2/2'
  | '-A√2/2'
  | 'A√3/2'
  | '-A√3/2'

export type OscStart =
  | { by: 'state'; x0: OscStartX0; dir: 'up' | 'down' }
  | { by: 'phi'; phiPi: number }

export interface AcSpec {
  U0: number
  I0: number
  period: { by: 'T' | 'f' | 'omega'; value: number }
  phiUPi: number
  phiIPi: number
  tEnd: number
  grid: 'none' | 'T/4' | 'T/8'
  ticks: 'value' | 'symbol'
  showPhaseDiff: boolean
  phaseDiffLabel?: 'dt' | 'phi'
}

export interface StandingSpec {
  length: number
  k: number
  ends: 'fixed-fixed' | 'fixed-free'
  A: number
  showNodes: boolean
  showAntinodes: boolean
  showDim: boolean
}

export interface OscSpec {
  mode?: OscMode
  qty: OscQty
  A: number
  period: { by: 'T' | 'f' | 'omega'; value: number }
  /** trạng thái đầu: chọn sẵn x₀ + chiều hoặc nhập φ (đơn vị π, vd 0.5 = π/2) */
  start: OscStart
  tEnd: number
  yName: string
  tName: string
  grid: 'none' | 'T/4' | 'T/8'
  ticks: 'value' | 'symbol'
  /** đường thứ hai để so pha (tuỳ chọn) */
  second: null | { qty: OscQty; A?: number; start?: OscStart; dashed: boolean }
  ac?: AcSpec
  standing?: StandingSpec
}

export const AC_DEFAULT: AcSpec = {
  U0: 220 * Math.SQRT2,
  I0: 2,
  period: { by: 'f', value: 50 },
  phiUPi: 0,
  phiIPi: -1 / 3,
  tEnd: 0.03,
  grid: 'T/8',
  ticks: 'value',
  showPhaseDiff: true,
  phaseDiffLabel: 'dt',
}

export const STANDING_DEFAULT: StandingSpec = {
  length: 60,
  k: 3,
  ends: 'fixed-fixed',
  A: 4,
  showNodes: true,
  showAntinodes: true,
  showDim: true,
}

export const OSC_Y_DEFAULT: Record<OscQty, string> = {
  x: 'x (cm)',
  v: 'v (cm/s)',
  a: 'a (cm/s²)',
}

export const OSC_DEFAULT: OscSpec = {
  qty: 'x',
  A: 8,
  period: { by: 'T', value: 2 },
  start: { by: 'state', x0: '0', dir: 'down' },
  tEnd: 2.5,
  yName: 'x (cm)',
  tName: 't (s)',
  grid: 'T/8',
  ticks: 'value',
  second: null,
}

const X0_ABS_PHI: Record<OscStartX0, number> = {
  A: 0,
  '-A': Math.PI,
  '0': Math.PI / 2,
  'A/2': Math.PI / 3,
  '-A/2': (2 * Math.PI) / 3,
  'A√2/2': Math.PI / 4,
  '-A√2/2': (3 * Math.PI) / 4,
  'A√3/2': Math.PI / 6,
  '-A√3/2': (5 * Math.PI) / 6,
}

const SUB = '₀₁₂₃₄₅₆₇₈₉'
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** Đưa pha về khoảng (−π; π]. */
export function normPhi(phi: number): number {
  let p = phi % (2 * Math.PI)
  if (p <= -Math.PI + 1e-12) p += 2 * Math.PI
  if (p > Math.PI + 1e-12) p -= 2 * Math.PI
  return Math.abs(p) < 1e-12 ? 0 : p
}

/** Tính chu kì T (s) và tần số góc ω (rad/s) từ spec.period. */
export function oscPeriod(spec: Pick<OscSpec, 'period'>): { T: number; omega: number } {
  const val = spec.period?.value
  if (!Number.isFinite(val) || val <= 0) {
    throw new Error(
      spec.period?.by === 'f'
        ? 'Tần số f phải lớn hơn 0'
        : spec.period?.by === 'omega'
          ? 'Tần số góc ω phải lớn hơn 0'
          : 'Chu kì T phải lớn hơn 0',
    )
  }
  if (spec.period.by === 'T') return { T: val, omega: (2 * Math.PI) / val }
  if (spec.period.by === 'f') return { T: 1 / val, omega: 2 * Math.PI * val }
  return { T: (2 * Math.PI) / val, omega: val }
}

function startToPhi(start: OscStart): number {
  if (start.by === 'phi') {
    if (!Number.isFinite(start.phiPi)) throw new Error('Pha ban đầu φ không hợp lệ')
    return normPhi(start.phiPi * Math.PI)
  }
  const base = X0_ABS_PHI[start.x0]
  if (base === undefined) throw new Error('Vị trí ban đầu x₀ không hợp lệ')
  if (start.x0 === 'A' || start.x0 === '-A') return base
  return start.dir === 'up' ? -base : base
}

/** Tính biên độ li độ A (cm), tần số góc ω (rad/s) và pha ban đầu φ (rad) của x = A·cos(ωt + φ). */
export function oscParams(spec: Pick<OscSpec, 'A' | 'period' | 'start'>): { A: number; omega: number; phi: number } {
  if (!Number.isFinite(spec.A) || spec.A <= 0) throw new Error('Biên độ A phải lớn hơn 0')
  const { omega } = oscPeriod(spec)
  const phi = startToPhi(spec.start)
  return { A: spec.A, omega, phi }
}

/** Tính biên độ cực đại, ω và pha riêng của đại lượng cần vẽ (x, v hoặc a). */
export function oscCurveParams(
  spec: Pick<OscSpec, 'qty' | 'A' | 'period' | 'start'>,
  override?: { qty?: OscQty; A?: number; start?: OscStart },
): { qty: OscQty; amp: number; omega: number; phi: number; T: number } {
  const base = oscParams({
    A: override?.A !== undefined ? override.A : spec.A,
    period: spec.period,
    start: override?.start ?? spec.start,
  })
  const { T } = oscPeriod(spec)
  const qty = override?.qty ?? spec.qty
  if (qty === 'v') return { qty, amp: base.omega * base.A, omega: base.omega, phi: normPhi(base.phi + Math.PI / 2), T }
  if (qty === 'a') return { qty, amp: base.omega * base.omega * base.A, omega: base.omega, phi: normPhi(base.phi + Math.PI), T }
  return { qty, amp: base.A, omega: base.omega, phi: base.phi, T }
}

/** Làm tròn tối đa 2 chữ số thập phân (tới 4 chữ số nếu biên độ rất nhỏ) và đổi sang dấu phẩy thập phân. */
export function fmtOscNum(n: number): string {
  if (Math.abs(n) < 1e-9) return '0'
  const abs = Math.abs(n)
  const dec = abs < 0.05 ? 4 : abs < 0.5 ? 3 : 2
  const k = 10 ** dec
  const r = Math.round(n * k) / k
  return String(Math.abs(r) < 1e-9 ? 0 : r).replace('.', ',').replace('-', '−')
}

function matchPiFraction(ratio: number, dens: readonly number[]): { num: number; den: number } | null {
  for (const den of dens) {
    const num = Math.round(ratio * den)
    if (Math.abs(ratio - num / den) < 1e-6) return { num, den }
  }
  return null
}

/** Định dạng ω (vd. π, 2π, π/2, 10) để hiển thị trong ô nhập hoặc phương trình. */
export function formatOmega(omega: number): string {
  const frac = matchPiFraction(omega / Math.PI, [1, 2, 3, 4, 6])
  if (frac && frac.num > 0) {
    if (frac.den === 1) return frac.num === 1 ? 'π' : `${frac.num}π`
    if (frac.den === 2 && frac.num > 1) return `${fmt(frac.num / 2)}π`
    return frac.num === 1 ? `π/${frac.den}` : `${frac.num}π/${frac.den}`
  }
  return fmtOscNum(omega)
}

function formatPhiTerm(phi: number): string {
  if (Math.abs(phi) < 1e-9) return ''
  const sign = phi > 0 ? ' + ' : ' − '
  const absRatio = Math.abs(phi) / Math.PI
  const frac = matchPiFraction(absRatio, [1, 2, 3, 4, 6, 8, 12])
  if (frac && frac.num > 0) {
    if (frac.den === 1) return sign + (frac.num === 1 ? 'π' : `${frac.num}π`)
    return sign + (frac.num === 1 ? `π/${frac.den}` : `${frac.num}π/${frac.den}`)
  }
  return `${sign}${fmtOscNum(absRatio)}π`
}

/** Viết phương trình dạng chuẩn để hiện dưới form, vd. "x = 8cos(πt + π/2) (cm)". */
export function oscEquation(
  spec: Pick<OscSpec, 'qty' | 'A' | 'period' | 'start'>,
  override?: { qty?: OscQty; A?: number; start?: OscStart },
): string {
  const c = oscCurveParams(spec, override)
  const unit = c.qty === 'x' ? 'cm' : c.qty === 'v' ? 'cm/s' : 'cm/s²'
  const wStr = formatOmega(c.omega)
  const wPart = wStr.includes('/') ? `(${wStr})t` : `${wStr}t`
  return `${c.qty} = ${fmtOscNum(c.amp)}cos(${wPart}${formatPhiTerm(c.phi)}) (${unit})`
}

/** Định dạng biên độ điện xoay chiều, nhận ra bội nguyên của √2, √3 (vd. 220√2). */
export function fmtAcAmp(n: number): string {
  for (const r of [2, 3]) {
    const k = n / Math.sqrt(r)
    const kr = Math.round(k)
    if (kr >= 1 && Math.abs(k - kr) < 1e-5) {
      return kr === 1 ? `√${r}` : `${kr}√${r}`
    }
  }
  return fmtOscNum(n)
}

/** Viết cặp phương trình u(t), i(t) cho điện xoay chiều. */
export function acEquation(spec: Pick<OscSpec, 'ac'>): { u: string; i: string } {
  const ac = spec.ac ?? AC_DEFAULT
  if (!Number.isFinite(ac.U0) || ac.U0 <= 0) throw new Error('Biên độ U₀ phải lớn hơn 0')
  if (!Number.isFinite(ac.I0) || ac.I0 <= 0) throw new Error('Biên độ I₀ phải lớn hơn 0')
  if (!Number.isFinite(ac.phiUPi)) throw new Error('Pha ban đầu φᵤ không hợp lệ')
  if (!Number.isFinite(ac.phiIPi)) throw new Error('Pha ban đầu φᵢ không hợp lệ')
  const { omega } = oscPeriod({ period: ac.period })
  const phiU = normPhi(ac.phiUPi * Math.PI)
  const phiI = normPhi(ac.phiIPi * Math.PI)
  const wStr = formatOmega(omega)
  const wPart = wStr.includes('/') ? `(${wStr})t` : `${wStr}t`
  return {
    u: `u = ${fmtAcAmp(ac.U0)}cos(${wPart}${formatPhiTerm(phiU)}) (V)`,
    i: `i = ${fmtAcAmp(ac.I0)}cos(${wPart}${formatPhiTerm(phiI)}) (A)`,
  }
}

/** Tính bước sóng λ, vị trí các nút và các bụng của sóng dừng. */
export function standingInfo(st: StandingSpec): { lambda: number; nodes: number[]; antinodes: number[] } {
  if (!Number.isFinite(st.length) || st.length <= 0) throw new Error('Chiều dài dây ℓ phải lớn hơn 0')
  if (!Number.isInteger(st.k) || st.k < 1 || st.k > 10) throw new Error('Số bó sóng k phải là số nguyên từ 1 đến 10')
  if (!Number.isFinite(st.A) || st.A <= 0) throw new Error('Biên độ bụng A phải lớn hơn 0')
  const lambda = st.ends === 'fixed-fixed' ? (2 * st.length) / st.k : (4 * st.length) / (2 * st.k - 1)
  const nodeCount = st.ends === 'fixed-fixed' ? st.k + 1 : st.k
  const nodes = Array.from({ length: nodeCount }, (_, idx) => (idx * lambda) / 2)
  const antinodes = Array.from({ length: st.k }, (_, idx) => ((idx + 0.5) * lambda) / 2)
  return { lambda, nodes, antinodes }
}

/** Đọc số hoặc biểu thức đơn giản có dấu phẩy thập phân, phân số, √2/√3, pi/π (không dùng eval). */
export function parseOscExpr(raw: string, allowPi = true): number {
  let s = raw.trim().replace(/,/g, '.').replace(/[−–]/g, '-').replace(/\s+/g, '')
  if (!s) return NaN
  const piRe = /pi|π/gi
  if (!allowPi && piRe.test(s)) return NaN
  const [numPart, denPart, ...rest] = s.split('/')
  if (rest.length > 0 || !numPart || (s.includes('/') && !denPart)) return NaN
  const evalFactor = (part: string): number => {
    const tokens = part.replace(/\*/g, '').replace(/(pi|π)/gi, 'π').replace(/sqrt\(?(\d+)\)?/gi, '√$1')
    const m = /^([+-]?)(\d*(?:\.\d+)?)(?:√(\d+))?(π?)$/.exec(tokens)
    if (!m || (!m[2] && !m[3] && !m[4])) return NaN
    const sign = m[1] === '-' ? -1 : 1
    const val = m[2] ? Number(m[2]) : 1
    const sqrtVal = m[3] ? Math.sqrt(Number(m[3])) : 1
    return sign * val * sqrtVal * (m[4] ? Math.PI : 1)
  }
  const num = evalFactor(numPart)
  if (!Number.isFinite(num)) return NaN
  if (!denPart) return num
  const den = evalFactor(denPart)
  return Number.isFinite(den) && den !== 0 ? num / den : NaN
}

/** Đổi _1 → ₁, _max → chỉ số dưới, ^2 → ² như quy ước gas.ts/table.ts. */
function formatAxisText(raw: string): string {
  const applySubSup = (txt: string) =>
    esc(txt)
      .replace(/_\{([^{}]+)\}|_([\p{L}\p{N}]+)/gu, (_, braced?: string, plain?: string) => {
        const s = braced ?? plain ?? ''
        return /^\d+$/.test(s) ? [...s].map((c) => SUB[Number(c)]).join('') : `<tspan baseline-shift="sub" font-size="70%">${s}</tspan>`
      })
      .replace(/\^\{([^{}]+)\}|\^([+-]?\d+)/g, (_, braced?: string, plain?: string) => {
        const s = braced ?? plain ?? ''
        return /^\d+$/.test(s) ? [...s].map((c) => SUP[Number(c)]).join('') : `<tspan baseline-shift="super" font-size="70%">${s}</tspan>`
      })
  const idx = raw.indexOf('(')
  if (idx > 0) {
    const sym = raw.slice(0, idx).trim()
    const unit = raw.slice(idx).trim()
    return `<tspan font-style="italic">${applySubSup(sym)}</tspan> ${applySubSup(unit)}`
  }
  return `<tspan font-style="italic">${applySubSup(raw)}</tspan>`
}

function formatSymbolT(kQuarter: number): string {
  const g = kQuarter % 4 === 0 ? 4 : kQuarter % 2 === 0 ? 2 : 1
  const num = kQuarter / g
  const den = 4 / g
  const prefix = num === 1 ? '' : String(num)
  return den === 1 ? `${prefix}T` : `${prefix}T/${den}`
}

interface SampledPoint {
  t: number
  px: number
  py: number
}

function sampleCurve(
  amp: number,
  omega: number,
  phi: number,
  T: number,
  tEnd: number,
  X: (t: number) => number,
  Y: (v: number) => number,
): SampledPoint[] {
  const steps = Math.max(96, Math.ceil((96 * tEnd) / T))
  const ts: number[] = [0, tEnd]
  for (let i = 1; i < steps; i++) ts.push((tEnd * i) / steps)

  // Chèn đúng thời điểm qua VTCB (cos = 0), đỉnh/đáy (sin = 0) và bội T/8
  const kMin = Math.floor((phi / Math.PI) * 2) - 2
  const kMax = Math.ceil(((omega * tEnd + phi) / Math.PI) * 2) + 2
  for (let k = kMin; k <= kMax; k++) {
    const t = ((k * Math.PI) / 2 - phi) / omega
    if (t > 1e-11 && t < tEnd - 1e-11) ts.push(t)
  }
  for (let t = T / 8; t < tEnd - 1e-11; t += T / 8) ts.push(t)

  ts.sort((a, b) => a - b)
  const unique: number[] = []
  for (const t of ts) {
    if (!unique.length || t - unique[unique.length - 1] > 1e-9) unique.push(t)
  }
  return unique.map((t) => {
    const v = amp * Math.cos(omega * t + phi)
    return { t, px: X(t), py: Y(v) }
  })
}

function renderAcSvg(spec: OscSpec, desc: string): { svg: string; width: number; height: number } {
  const ac = spec.ac ?? AC_DEFAULT
  acEquation({ ac }) // xác thực đầu vào
  const { T, omega } = oscPeriod({ period: ac.period })
  if (!Number.isFinite(ac.tEnd) || ac.tEnd <= 0) throw new Error('Thời gian vẽ phải lớn hơn 0')
  if (ac.tEnd > 10 * T + 1e-9) throw new Error('Thời gian vẽ tối đa 10 chu kì (10T)')

  const phiU = normPhi(ac.phiUPi * Math.PI)
  const phiI = normPhi(ac.phiIPi * Math.PI)

  const W = 460
  const H = 296
  const left = 62
  const right = W - 62
  const top = 54
  const bottom = H - 30
  const y0 = (top + bottom) / 2
  const halfH = (bottom - top) / 2
  const X = (t: number) => left + (t / ac.tEnd) * (right - left)
  const Yu = (v: number) => y0 - (v / ac.U0) * halfH
  const Yi = (v: number) => y0 - (v / ac.I0) * halfH

  let b = ARROW

  // 1. Lưới ô nét đứt
  if (ac.grid !== 'none') {
    const rawTStep = ac.grid === 'T/8' ? T / 8 : T / 4
    const tStep = ac.tEnd / rawTStep > 64 ? T / 4 : rawTStep
    const nDiv = ac.grid === 'T/8' ? 4 : 2
    const gridSegs: string[] = []
    for (let k = 1; ; k++) {
      const t = k * tStep
      if (t > ac.tEnd + 1e-9) break
      const gx = f1(X(Math.min(t, ac.tEnd)))
      gridSegs.push(`M${gx} ${top}V${bottom}`)
    }
    for (let j = -nDiv; j <= nDiv; j++) {
      if (j === 0) continue
      const gy = f1(y0 - (j / nDiv) * halfH)
      gridSegs.push(`M${left} ${gy}H${right}`)
    }
    if (gridSegs.length) {
      b += `<path d="${gridSegs.join('')}" stroke="#a3abb6" stroke-width="0.8" stroke-dasharray="3 3" fill="none"/>`
    }
  }

  // 2. Hai trục tung u (V) bên trái, i (A) bên phải + trục t (s) chung gốc O
  b += `<path d="M${left} ${f1(y0)}H${right + 36}" stroke="#111" stroke-width="1.3" marker-end="url(#pharr)"/>`
  b += `<path d="M${left} ${bottom + 10}V${top - 28}" stroke="#111" stroke-width="1.3" marker-end="url(#pharr)"/>`
  b += `<path d="M${right} ${bottom + 10}V${top - 28}" stroke="#1d4ed8" stroke-width="1.2" marker-end="url(#pharr)"/>`
  b += `<text x="${left + 8}" y="${top - 32}" ${FAM} font-size="14">${formatAxisText('u (V)')}</text>`
  b += `<text x="${right - 8}" y="${top - 32}" ${FAM} font-size="14" text-anchor="end" fill="#1d4ed8">${formatAxisText('i (A)')}</text>`
  b += `<text x="${W - 6}" y="${f1(y0 - 9)}" ${FAM} font-size="14" text-anchor="end">${formatAxisText('t (s)')}</text>`
  b += `<text x="${left - 6}" y="${f1(y0 + 16)}" ${FAM} font-size="13" font-style="italic" text-anchor="end">O</text>`

  // 3. Vạch chia trục tung trái (u) và phải (i)
  const fracs = ac.grid !== 'none' ? [1, 0.5, -0.5, -1] : [1, -1]
  for (const fr of fracs) {
    const py = f1(y0 - fr * halfH)
    const sign = fr < 0 ? '−' : ''
    const isHalf = Math.abs(Math.abs(fr) - 0.5) < 1e-9
    b += `<path d="M${left - 3} ${py}H${left + 3}" stroke="#111" stroke-width="1.1"/>`
    b += `<path d="M${right - 3} ${py}H${right + 3}" stroke="#1d4ed8" stroke-width="1.1"/>`
    const uLabel = ac.ticks === 'symbol' ? `${sign}U₀${isHalf ? '/2' : ''}` : fmtAcAmp(Math.abs(fr) * ac.U0).replace(/^/, sign)
    const iLabel = ac.ticks === 'symbol' ? `${sign}I₀${isHalf ? '/2' : ''}` : fmtAcAmp(Math.abs(fr) * ac.I0).replace(/^/, sign)
    b += `<text x="${left - 7}" y="${f1(py + 4.5)}" ${FAM} font-size="12.5"${ac.ticks === 'symbol' ? ' font-style="italic"' : ''} text-anchor="end">${esc(uLabel)}</text>`
    b += `<text x="${right + 7}" y="${f1(py + 4.5)}" ${FAM} font-size="12.5" fill="#1d4ed8"${ac.ticks === 'symbol' ? ' font-style="italic"' : ''} text-anchor="start">${esc(iLabel)}</text>`
  }

  // 4. Lấy mẫu đường cong u(t) và i(t)
  const ptsU = sampleCurve(ac.U0, omega, phiU, T, ac.tEnd, X, Yu)
  const ptsI = sampleCurve(ac.I0, omega, phiI, T, ac.tEnd, X, Yi)
  const allCurvePts = [...ptsU, ...ptsI]

  // 5. Vạch chia và nhãn trục ngang t
  const rawTickStep = ac.grid === 'T/8' ? T / 8 : T / 4
  const tTickStep = ac.tEnd / rawTickStep > 48 ? T / 2 : rawTickStep
  for (let k = 1; ; k++) {
    const t = k * tTickStep
    if (t > ac.tEnd + 1e-9) break
    b += `<path d="M${f1(X(Math.min(t, ac.tEnd)))} ${f1(y0 - 3)}V${f1(y0 + 3)}" stroke="#111" stroke-width="1.1"/>`
  }

  const labelTicks: Array<{ t: number; text: string }> = []
  if (ac.ticks === 'symbol') {
    const stepK = [1, 2, 4, 8, 16].find((k) => X((k * T) / 4) - X(0) >= 30) ?? 16
    for (let k = stepK; ; k += stepK) {
      const t = (k * T) / 4
      if (t > ac.tEnd + 1e-9) break
      labelTicks.push({ t: Math.min(t, ac.tEnd), text: formatSymbolT(k) })
    }
  } else {
    const stepH = [0.5 * T, T, 2 * T, 4 * T].find((s) => X(s) - X(0) >= 38) ?? 4 * T
    for (let k = 1; ; k++) {
      const t = k * stepH
      if (t > ac.tEnd + 1e-9) break
      labelTicks.push({ t: Math.min(t, ac.tEnd), text: fmtOscNum(Math.min(t, ac.tEnd)) })
    }
    const last = labelTicks[labelTicks.length - 1]
    const already = last && Math.abs(last.t - ac.tEnd) < 1e-6
    if (!already && (!last || X(ac.tEnd) - X(last.t) >= 32)) {
      labelTicks.push({ t: ac.tEnd, text: fmtOscNum(ac.tEnd) })
    }
  }

  const placedBoxes: Array<{ x0: number; x1: number; y0: number; y1: number }> = [
    { x0: right - 12, x1: W, y0: y0 - 24, y1: y0 + 20 },
  ]
  for (const tk of labelTicks) {
    const tx = X(tk.t)
    const w = tk.text.length * 7.2 + 4
    const candidates = [
      { ax: tx, ay: y0 + 17, anchor: 'middle', x0: tx - w / 2, x1: tx + w / 2, by0: y0 + 5, by1: y0 + 19 },
      { ax: tx, ay: y0 - 7, anchor: 'middle', x0: tx - w / 2, x1: tx + w / 2, by0: y0 - 19, by1: y0 - 5 },
      { ax: tx - 4, ay: y0 + 17, anchor: 'end', x0: tx - w - 4, x1: tx - 4, by0: y0 + 5, by1: y0 + 19 },
      { ax: tx + 4, ay: y0 + 17, anchor: 'start', x0: tx + 4, x1: tx + w + 4, by0: y0 + 5, by1: y0 + 19 },
    ]
    let best = candidates[0]
    let bestScore = Infinity
    for (const c of candidates) {
      let score = 0
      if (c.x0 < left + 4 || c.x1 > right - 4) score += 1000
      for (const box of placedBoxes) {
        if (c.x0 < box.x1 + 3 && c.x1 + 3 > box.x0 && c.by0 < box.y1 && c.by1 > box.y0) score += 500
      }
      for (const p of allCurvePts) {
        if (p.px >= c.x0 - 2 && p.px <= c.x1 + 2 && p.py >= c.by0 - 2 && p.py <= c.by1 + 2) score += 1
      }
      if (score < bestScore) {
        bestScore = score
        best = c
        if (score === 0) break
      }
    }
    placedBoxes.push({ x0: best.x0, x1: best.x1, y0: best.by0, y1: best.by1 })
    b += `<text x="${f1(best.ax)}" y="${f1(best.ay)}" ${FAM} font-size="12.5"${ac.ticks === 'symbol' ? ' font-style="italic"' : ''} text-anchor="${best.anchor}">${esc(tk.text)}</text>`
  }

  // 6. Vẽ đường u (nét liền) và i (nét đứt)
  const toPath = (pts: SampledPoint[]) => pts.map((p, idx) => `${idx ? 'L' : 'M'}${f1(p.px)} ${f1(p.py)}`).join('')
  b += `<path data-curve="u" d="${toPath(ptsU)}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
  b += `<path data-curve="i" d="${toPath(ptsI)}" fill="none" stroke="#1d4ed8" stroke-width="1.8" stroke-dasharray="6 4" stroke-linejoin="round" stroke-linecap="round"/>`

  // 7. Nhãn đường "u", "i" ở cuối mỗi đường
  let uyEnd = Yu(ac.U0 * Math.cos(omega * ac.tEnd + phiU))
  let iyEnd = Yi(ac.I0 * Math.cos(omega * ac.tEnd + phiI))
  if (Math.abs(uyEnd - iyEnd) < 16) {
    if (uyEnd <= iyEnd) {
      uyEnd -= 8
      iyEnd += 10
    } else {
      iyEnd -= 8
      uyEnd += 10
    }
  }
  const clampY = (y: number) => Math.max(top + 12, Math.min(bottom - 4, y))
  b += `<text x="${right - 8}" y="${f1(clampY(uyEnd - 5))}" ${FAM} font-size="14" font-style="italic" font-weight="bold" text-anchor="end">u</text>`
  b += `<text x="${right - 8}" y="${f1(clampY(iyEnd - 5))}" ${FAM} font-size="14" font-style="italic" font-weight="bold" fill="#1d4ed8" text-anchor="end">i</text>`

  // 8. Mũi tên độ lệch pha giữa hai đỉnh gần nhau (tuỳ chọn)
  if (ac.showPhaseDiff) {
    let kU = Math.ceil(phiU / (2 * Math.PI) - 1e-9)
    let tU = (2 * kU * Math.PI - phiU) / omega
    while (tU < -1e-9) {
      kU += 1
      tU = (2 * kU * Math.PI - phiU) / omega
    }
    if (tU <= ac.tEnd + 1e-9) {
      let bestTI: number | null = null
      let bestDist = Infinity
      const kMin = Math.floor(phiI / (2 * Math.PI)) - 1
      const kMax = Math.ceil((omega * ac.tEnd + phiI) / (2 * Math.PI)) + 1
      for (let k = kMin; k <= kMax; k++) {
        const t = (2 * k * Math.PI - phiI) / omega
        if (t >= -1e-9 && t <= ac.tEnd + 1e-9) {
          const d = Math.abs(t - tU)
          if (d < bestDist) {
            bestDist = d
            bestTI = t
          }
        }
      }
      if (bestTI !== null && Math.abs(X(bestTI) - X(tU)) >= 4) {
        const x1 = f1(X(Math.min(tU, bestTI)))
        const x2 = f1(X(Math.max(tU, bestTI)))
        const yArr = top - 11
        b += `<path d="M${x1} ${top}V${yArr - 4}M${x2} ${top}V${yArr - 4}" stroke="#64748b" stroke-width="0.9" stroke-dasharray="3 2"/>`
        b += `<path d="M${x1} ${yArr}H${x2}" stroke="#111" stroke-width="1.2" marker-start="url(#pharr)" marker-end="url(#pharr)"/>`
        const lbl = ac.phaseDiffLabel === 'phi' ? 'φ' : 'Δt'
        b += `<text x="${f1((x1 + x2) / 2)}" y="${yArr - 4}" ${FAM} font-size="12.5" font-style="italic" text-anchor="middle">${lbl}</text>`
      }
    }
  }

  return wrap(W, H, desc, b)
}

function renderStandingSvg(spec: OscSpec, desc: string): { svg: string; width: number; height: number } {
  const st = spec.standing ?? STANDING_DEFAULT
  const { lambda, nodes, antinodes } = standingInfo(st)

  const W = 460
  const H = 260
  const left = 48
  const right = W - 48
  const y0 = 126
  const ampPx = 56
  const X = (x: number) => left + (x / st.length) * (right - left)

  let b = ARROW

  // 1. Trục cân bằng
  b += `<path d="M${left} ${y0}H${right}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 3"/>`

  // 2. Giá đỡ hai đầu
  const wallTop = y0 - ampPx - 10
  const wallBot = y0 + ampPx + 10
  b += `<path d="M${left} ${wallTop}V${wallBot}" stroke="#111" stroke-width="2"/>`
  for (let y = wallTop + 4; y <= wallBot - 2; y += 8) {
    b += `<path d="M${left - 6} ${y + 4}L${left} ${y}" stroke="#64748b" stroke-width="1"/>`
  }
  if (st.ends === 'fixed-fixed') {
    b += `<path d="M${right} ${wallTop}V${wallBot}" stroke="#111" stroke-width="2"/>`
    for (let y = wallTop + 4; y <= wallBot - 2; y += 8) {
      b += `<path d="M${right} ${y + 4}L${right + 6} ${y}" stroke="#64748b" stroke-width="1"/>`
    }
  } else {
    b += `<path d="M${right} ${y0 - ampPx - 4}V${y0 + ampPx + 4}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3"/>`
    b += `<circle cx="${right}" cy="${y0}" r="3.2" fill="#fff" stroke="#111" stroke-width="1.3"/>`
  }

  // 3. Lấy mẫu hai biên độ đối xứng của dây
  const steps = Math.max(120, st.k * 32)
  const xs: number[] = [0, st.length]
  for (let i = 1; i < steps; i++) xs.push((st.length * i) / steps)
  for (const nx of nodes) xs.push(nx)
  for (const ax of antinodes) xs.push(ax)
  xs.sort((a, c) => a - c)
  const uniqueX: number[] = []
  for (const x of xs) {
    if (!uniqueX.length || x - uniqueX[uniqueX.length - 1] > 1e-9) uniqueX.push(x)
  }
  const upperPath = uniqueX
    .map((x, idx) => {
      const py = y0 - Math.sin((2 * Math.PI * x) / lambda) * ampPx
      return `${idx ? 'L' : 'M'}${f1(X(x))} ${f1(py)}`
    })
    .join('')
  const lowerPath = uniqueX
    .map((x, idx) => {
      const py = y0 + Math.sin((2 * Math.PI * x) / lambda) * ampPx
      return `${idx ? 'L' : 'M'}${f1(X(x))} ${f1(py)}`
    })
    .join('')

  b += `<path d="${upperPath}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
  b += `<path d="${lowerPath}" fill="none" stroke="#111" stroke-width="1.6" stroke-dasharray="6 4" stroke-linejoin="round" stroke-linecap="round"/>`

  // 4. Đánh dấu nút (chấm tròn đặc, nhãn N) và bụng (nhãn B)
  if (st.showNodes) {
    for (let idx = 0; idx < nodes.length; idx++) {
      const nx = nodes[idx]
      const px = f1(X(nx))
      const attrVal = Math.round(nx * 1e6) / 1e6
      b += `<circle cx="${px}" cy="${y0}" r="3.8" fill="#111" data-node="${attrVal}"/>`
      const lx = idx === 0 ? px + 8 : idx === nodes.length - 1 && st.ends === 'fixed-fixed' ? px - 8 : px
      b += `<text x="${lx}" y="${y0 + 16}" ${FAM} font-size="13" font-style="italic" text-anchor="middle">N</text>`
    }
  }
  if (st.showAntinodes) {
    for (let idx = 0; idx < antinodes.length; idx++) {
      const ax = antinodes[idx]
      const px = f1(X(ax))
      const attrVal = Math.round(ax * 1e6) / 1e6
      const lx = idx === antinodes.length - 1 && st.ends === 'fixed-free' ? px - 6 : px
      b += `<text x="${lx}" y="${y0 - ampPx - 8}" ${FAM} font-size="13" font-style="italic" text-anchor="middle" data-antinode="${attrVal}">B</text>`
    }
  }

  // 5. Kích thước λ/2 (hoặc λ/4 nếu chỉ có 1 nút) và chiều dài ℓ
  if (st.showDim) {
    const yDimTop = y0 - ampPx - 28
    const dimX1 = X(nodes[0])
    const dimX2 = nodes.length >= 2 ? X(nodes[1]) : X(st.length)
    const dimLbl = nodes.length >= 2 ? 'λ/2' : 'λ/4'
    b += `<path d="M${f1(dimX1)} ${y0 - 4}V${yDimTop - 4}M${f1(dimX2)} ${y0 - 4}V${yDimTop - 4}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="3 2"/>`
    b += `<path d="M${f1(dimX1)} ${yDimTop}H${f1(dimX2)}" stroke="#111" stroke-width="1.1" marker-start="url(#pharr)" marker-end="url(#pharr)"/>`
    b += `<text x="${f1((dimX1 + dimX2) / 2)}" y="${yDimTop - 5}" ${FAM} font-size="12.5" font-style="italic" text-anchor="middle">${dimLbl}</text>`

    const yDimBot = y0 + ampPx + 32
    b += `<path d="M${left} ${wallBot + 2}V${yDimBot + 4}M${right} ${wallBot + 2}V${yDimBot + 4}" stroke="#64748b" stroke-width="0.8"/>`
    b += `<path d="M${left} ${yDimBot}H${right}" stroke="#111" stroke-width="1.2" marker-start="url(#pharr)" marker-end="url(#pharr)"/>`
    b += `<text x="${f1((left + right) / 2)}" y="${yDimBot + 16}" ${FAM} font-size="13" text-anchor="middle"><tspan font-style="italic">ℓ</tspan> = ${esc(fmtOscNum(st.length))} cm</text>`
  }

  return wrap(W, H, desc, b)
}

export function renderOscSvg(spec: OscSpec, desc: string): { svg: string; width: number; height: number } {
  if (spec.mode === 'ac') return renderAcSvg(spec, desc)
  if (spec.mode === 'standing') return renderStandingSvg(spec, desc)
  const c1 = oscCurveParams(spec)
  const { T } = c1
  if (!Number.isFinite(spec.tEnd) || spec.tEnd <= 0) throw new Error('Thời gian vẽ phải lớn hơn 0')
  if (spec.tEnd > 10 * T + 1e-9) throw new Error('Thời gian vẽ tối đa 10 chu kì (10T)')

  const c2Raw = spec.second
    ? oscCurveParams(spec, { qty: spec.second.qty, A: spec.second.A, start: spec.second.start })
    : null
  let c2Scale = 1
  let yMax = c1.amp
  if (c2Raw) {
    if (c2Raw.qty === c1.qty) {
      yMax = Math.max(c1.amp, c2Raw.amp)
    } else {
      const ratio = spec.second?.A !== undefined ? spec.second.A / spec.A : 1
      const amp2Visual = c1.amp * ratio
      c2Scale = amp2Visual / c2Raw.amp
      yMax = Math.max(c1.amp, amp2Visual)
    }
  }

  const W = 440
  const H = 290
  const left = 62
  const right = W - 46
  const top = 42
  const bottom = H - 30
  const y0 = (top + bottom) / 2
  const halfH = (bottom - top) / 2
  const X = (t: number) => left + (t / spec.tEnd) * (right - left)
  const Y = (v: number) => y0 - (v / yMax) * halfH

  let b = ARROW

  // 1. Lưới ô nét đứt
  if (spec.grid !== 'none') {
    const rawTStep = spec.grid === 'T/8' ? T / 8 : T / 4
    const tStep = spec.tEnd / rawTStep > 64 ? T / 4 : rawTStep
    const nDiv = spec.grid === 'T/8' ? 4 : 2
    const gridSegs: string[] = []
    for (let k = 1; ; k++) {
      const t = k * tStep
      if (t > spec.tEnd + 1e-9) break
      const gx = f1(X(Math.min(t, spec.tEnd)))
      gridSegs.push(`M${gx} ${top}V${bottom}`)
    }
    for (let i = -nDiv; i <= nDiv; i++) {
      if (i === 0) continue
      const gy = f1(Y((yMax * i) / nDiv))
      gridSegs.push(`M${left} ${gy}H${right}`)
    }
    if (gridSegs.length) {
      b += `<path d="${gridSegs.join('')}" stroke="#a3abb6" stroke-width="0.8" stroke-dasharray="3 3" fill="none"/>`
    }
  }

  // 2. Hai trục toạ độ + mũi tên + nhãn trục + gốc O
  b += `<path d="M${left} ${f1(y0)}H${right + 28}" stroke="#111" stroke-width="1.3" marker-end="url(#pharr)"/>`
  b += `<path d="M${left} ${bottom + 10}V${top - 22}" stroke="#111" stroke-width="1.3" marker-end="url(#pharr)"/>`
  const yLabel = (spec.yName || '').trim() || OSC_Y_DEFAULT[c1.qty]
  const tLabel = (spec.tName || '').trim() || 't (s)'
  b += `<text x="${left + 8}" y="${top - 22}" ${FAM} font-size="14">${formatAxisText(yLabel)}</text>`
  b += `<text x="${W - 10}" y="${f1(y0 - 9)}" ${FAM} font-size="14" text-anchor="end">${formatAxisText(tLabel)}</text>`
  b += `<text x="${left - 6}" y="${f1(y0 + 16)}" ${FAM} font-size="13" font-style="italic" text-anchor="end">O</text>`

  // 3. Vạch chia trục dọc (đặt bên trái trục, không đè đường cong)
  const yTicks = spec.grid !== 'none' ? [yMax, yMax / 2, -yMax / 2, -yMax] : [yMax, -yMax]
  const symBase = c1.qty === 'x' ? 'A' : c1.qty === 'v' ? 'ωA' : 'ω²A'
  const symSame = Math.abs(yMax - c1.amp) < 1e-9
  const symRatio = Math.round((yMax / c1.amp) * 100) / 100
  const symTop = symSame ? symBase : Number.isInteger(symRatio) ? `${symRatio}${symBase}` : fmtOscNum(yMax)
  for (const v of yTicks) {
    const py = f1(Y(v))
    b += `<path d="M${left - 3} ${py}H${left + 3}" stroke="#111" stroke-width="1.1"/>`
    let label: string
    if (spec.ticks === 'symbol') {
      const isHalf = Math.abs(Math.abs(v) - yMax / 2) < 1e-9
      const sign = v < 0 ? '−' : ''
      if (isHalf) {
        if (symSame) label = `${sign}${symBase}/2`
        else if (Math.abs(Math.abs(v) - c1.amp) < 1e-9) label = `${sign}${symBase}`
        else label = `${sign}${fmtOscNum(Math.abs(v))}`
      } else {
        label = symTop === fmtOscNum(yMax) ? fmtOscNum(v) : `${sign}${symTop}`
      }
    } else {
      label = fmtOscNum(v)
    }
    b += `<text x="${left - 7}" y="${f1(py + 4.5)}" ${FAM} font-size="13"${spec.ticks === 'symbol' ? ' font-style="italic"' : ''} text-anchor="end">${esc(label)}</text>`
  }

  // 4. Lấy mẫu đường cong (vẽ đường 2 trước nếu liền, hoặc vẽ sau nếu nét đứt; lấy mẫu trước để tránh nhãn đè nét)
  const pts1 = sampleCurve(c1.amp, c1.omega, c1.phi, T, spec.tEnd, X, Y)
  const pts2 = c2Raw ? sampleCurve(c2Raw.amp * c2Scale, c2Raw.omega, c2Raw.phi, T, spec.tEnd, X, Y) : null
  const allCurvePts = pts2 ? [...pts1, ...pts2] : pts1

  // 5. Vạch chia và nhãn trục ngang (tránh đè đường cong và nhãn khác)
  const rawTickStep = spec.grid === 'T/8' ? T / 8 : T / 4
  const tTickStep = spec.tEnd / rawTickStep > 48 ? T / 2 : rawTickStep
  for (let k = 1; ; k++) {
    const t = k * tTickStep
    if (t > spec.tEnd + 1e-9) break
    b += `<path d="M${f1(X(Math.min(t, spec.tEnd)))} ${f1(y0 - 3)}V${f1(y0 + 3)}" stroke="#111" stroke-width="1.1"/>`
  }

  const labelTicks: Array<{ t: number; text: string }> = []
  if (spec.ticks === 'symbol') {
    const stepK = [1, 2, 4, 8, 16].find((k) => X((k * T) / 4) - X(0) >= 30) ?? 16
    for (let k = stepK; ; k += stepK) {
      const t = (k * T) / 4
      if (t > spec.tEnd + 1e-9) break
      labelTicks.push({ t: Math.min(t, spec.tEnd), text: formatSymbolT(k) })
    }
  } else {
    const stepH = [0.5 * T, T, 2 * T, 4 * T].find((s) => X(s) - X(0) >= 34) ?? 4 * T
    for (let k = 1; ; k++) {
      const t = k * stepH
      if (t > spec.tEnd + 1e-9) break
      labelTicks.push({ t: Math.min(t, spec.tEnd), text: fmt(Math.min(t, spec.tEnd)) })
    }
    const last = labelTicks[labelTicks.length - 1]
    const tEndClean = Math.abs(spec.tEnd - Math.round(spec.tEnd * 100) / 100) < 1e-6
    const already = last && Math.abs(last.t - spec.tEnd) < 1e-6
    if (!already && tEndClean && (!last || X(spec.tEnd) - X(last.t) >= 28)) {
      labelTicks.push({ t: spec.tEnd, text: fmt(spec.tEnd) })
    }
  }

  // Đặt sẵn vùng nhãn trục t (s) để các mốc cuối (như tEnd) không đè lên nhãn trục
  const tLabelWidth = Math.max(28, tLabel.length * 7.2)
  const placedBoxes: Array<{ x0: number; x1: number; y0: number; y1: number }> = [
    { x0: W - 10 - tLabelWidth - 4, x1: W, y0: y0 - 24, y1: y0 - 2 },
  ]
  for (const tk of labelTicks) {
    const tx = X(tk.t)
    const w = tk.text.length * 7.2 + 4
    const candidates = [
      { ax: tx, ay: y0 + 17, anchor: 'middle', x0: tx - w / 2, x1: tx + w / 2, by0: y0 + 5, by1: y0 + 19 },
      { ax: tx, ay: y0 - 7, anchor: 'middle', x0: tx - w / 2, x1: tx + w / 2, by0: y0 - 19, by1: y0 - 5 },
      { ax: tx - 4, ay: y0 + 17, anchor: 'end', x0: tx - w - 4, x1: tx - 4, by0: y0 + 5, by1: y0 + 19 },
      { ax: tx + 4, ay: y0 + 17, anchor: 'start', x0: tx + 4, x1: tx + w + 4, by0: y0 + 5, by1: y0 + 19 },
      { ax: tx - 4, ay: y0 - 7, anchor: 'end', x0: tx - w - 4, x1: tx - 4, by0: y0 - 19, by1: y0 - 5 },
      { ax: tx + 4, ay: y0 - 7, anchor: 'start', x0: tx + 4, x1: tx + w + 4, by0: y0 - 19, by1: y0 - 5 },
    ]
    let best = candidates[0]
    let bestScore = Infinity
    for (const c of candidates) {
      let score = 0
      if (c.x0 < left + 4) score += 1000
      for (const box of placedBoxes) {
        if (c.x0 < box.x1 + 3 && c.x1 + 3 > box.x0 && c.by0 < box.y1 && c.by1 > box.y0) score += 500
      }
      for (const p of allCurvePts) {
        if (p.px >= c.x0 - 2 && p.px <= c.x1 + 2 && p.py >= c.by0 - 2 && p.py <= c.by1 + 2) score += 1
      }
      if (score < bestScore) {
        bestScore = score
        best = c
        if (score === 0) break
      }
    }
    placedBoxes.push({ x0: best.x0, x1: best.x1, y0: best.by0, y1: best.by1 })
    b += `<text x="${f1(best.ax)}" y="${f1(best.ay)}" ${FAM} font-size="13"${spec.ticks === 'symbol' ? ' font-style="italic"' : ''} text-anchor="${best.anchor}">${esc(tk.text)}</text>`
  }

  // 6. Vẽ đường cong
  const toPath = (pts: SampledPoint[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p.px)} ${f1(p.py)}`).join('')
  b += `<path d="${toPath(pts1)}" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`
  if (pts2 && spec.second) {
    const dash = spec.second.dashed ? ' stroke-dasharray="6 4"' : ''
    const c2Color = spec.second.dashed ? '#111' : '#1d4ed8'
    b += `<path d="${toPath(pts2)}" fill="none" stroke="${c2Color}" stroke-width="1.8"${dash} stroke-linejoin="round" stroke-linecap="round"/>`

    // Chú thích 2 đường gọn ở góc trên phải
    const sameQty = spec.second.qty === c1.qty
    const l1 = sameQty ? `${c1.qty}₁` : c1.qty
    const l2 = sameQty ? `${spec.second.qty}₂` : spec.second.qty
    const ly = top - 22
    const x2Start = right - 38
    const x1Start = x2Start - 54
    b += `<path d="M${x1Start} ${ly - 4}h18" stroke="#111" stroke-width="2"/>`
    b += `<text x="${x1Start + 22}" y="${ly}" ${FAM} font-size="13" font-style="italic">${esc(l1)}</text>`
    b += `<path d="M${x2Start} ${ly - 4}h18" stroke="${c2Color}" stroke-width="1.8"${dash}/>`
    b += `<text x="${x2Start + 22}" y="${ly}" ${FAM} font-size="13" font-style="italic">${esc(l2)}</text>`
  }

  return wrap(W, H, desc, b)
}
