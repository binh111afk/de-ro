/**
 * Đồ thị dao động điều hoà (Vật lí 11): x(t), v(t), a(t) từ biên độ A,
 * chu kì/tần số/ω và trạng thái đầu (x₀, chiều) hoặc pha ban đầu φ.
 */
import { ARROW, FAM, esc, f1, fmt, wrap } from './physics'

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

export interface OscSpec {
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

/** Đọc số hoặc biểu thức đơn giản có dấu phẩy thập phân, phân số, pi/π (không dùng eval). */
export function parseOscExpr(raw: string, allowPi = true): number {
  let s = raw.trim().replace(/,/g, '.').replace(/[−–]/g, '-').replace(/\s+/g, '')
  if (!s) return NaN
  const piRe = /pi|π/gi
  if (!allowPi && piRe.test(s)) return NaN
  const [numPart, denPart, ...rest] = s.split('/')
  if (rest.length > 0 || !numPart || (s.includes('/') && !denPart)) return NaN
  const evalFactor = (part: string): number => {
    const tokens = part.replace(/\*/g, '').replace(/(pi|π)/gi, 'π')
    const m = /^([+-]?)(\d*(?:\.\d+)?)(π?)$/.exec(tokens)
    if (!m || (!m[2] && !m[3])) return NaN
    const sign = m[1] === '-' ? -1 : 1
    const val = m[2] ? Number(m[2]) : 1
    return sign * val * (m[3] ? Math.PI : 1)
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

export function renderOscSvg(spec: OscSpec, desc: string): { svg: string; width: number; height: number } {
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
