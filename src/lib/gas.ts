/**
 * Đồ thị trạng thái khí lí tưởng (Vật lí 12): hệ trục p–V, p–T hoặc V–T, các trạng thái 1, 2, 3…
 * nối bằng quá trình đẳng nhiệt / đẳng tích / đẳng áp. App tự vẽ đúng hình dạng theo hệ trục
 * (đẳng nhiệt trên p–V là cung hypebol, đẳng tích trên p–T là đoạn nằm trên đường qua O…)
 * và báo lỗi khi số liệu không khớp quá trình đã ghi (bắt lỗi AI ra đề sai).
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
const fmt = (n: number) => String(Math.round(n * 1000) / 1000).replace('.', ',').replace('-', '−')
const ARROW = `<defs><marker id="gasarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`

export type GasAxes = 'pV' | 'pT' | 'VT'
export type GasProcess = 'isothermal' | 'isochoric' | 'isobaric' | 'line'

export interface GasSpec {
  /** hệ trục: trục dọc – trục ngang */
  axes: GasAxes
  /** mỗi dòng một trạng thái "1: (2; 3)" — toạ độ (ngang; dọc): p–V là (V; p), p–T là (T; p), V–T là (T; V) */
  states: string
  /** mỗi dòng một quá trình "1-2: đẳng nhiệt" (đẳng tích, đẳng áp, thẳng); thêm "| nhãn" để ghi nhãn đường */
  processes: string
  /** đơn vị trên trục, vd "atm", "L", "K" (trống = không ghi) */
  pUnit: string
  vUnit: string
  tUnit: string
  /** nhãn vạch trên trục: số liệu, kí hiệu p₁ V₁ T₁, hoặc không ghi */
  ticks: 'value' | 'symbol' | 'none'
  /** nét đứt gióng từ các trạng thái xuống hai trục */
  dashed: boolean
  /** mũi tên chiều quá trình */
  arrows: boolean
  /** kéo dài nét đứt về gốc O cho đoạn nằm trên đường qua O (đẳng tích trên p–T, đẳng áp trên V–T) */
  toOrigin: boolean
  /** hiện chấm tròn và nhãn tên các trạng thái (mặc định true) */
  showStates?: boolean
}

export const GAS_PROCESS_LABEL: Record<GasProcess, string> = {
  isothermal: 'đẳng nhiệt',
  isochoric: 'đẳng tích',
  isobaric: 'đẳng áp',
  line: 'thẳng',
}

const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`
const toNum = (s: string) => Number(s.replace(',', '.'))

export function parseGasStates(text: string): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>()
  const re = new RegExp(String.raw`([\p{L}\p{N}'’]+)\s*[:=]?\s*\(\s*${NUM}\s*;\s*${NUM}\s*\)`, 'gu')
  for (const m of text.matchAll(re)) {
    const x = toNum(m[2])
    const y = toNum(m[3])
    if (x < 0 || y < 0) throw new Error(`Trạng thái ${m[1]}: p, V, T phải không âm`)
    out.set(m[1], [x, y])
  }
  if (out.size < 2) throw new Error('Cần ít nhất 2 trạng thái dạng "1: (2; 3)"')
  return out
}

function processOf(word: string): GasProcess | null {
  const w = word.toLowerCase().normalize('NFC')
  // không dùng \b: với chữ có dấu, \b của JS coi "t" trong "tích" là một từ riêng
  if (/nhiệt|isotherm|^t\s*=?\s*const/.test(w)) return 'isothermal'
  if (/tích|isochor|^v\s*=?\s*const/.test(w)) return 'isochoric'
  if (/áp|isobar|^p\s*=?\s*const/.test(w)) return 'isobaric'
  if (/thẳng|line|đoạn/.test(w)) return 'line'
  return null
}

export function parseGasProcesses(
  text: string,
  states: Map<string, [number, number]>,
): Array<{ from: string; to: string; kind: GasProcess; label?: string }> {
  const out: Array<{ from: string; to: string; kind: GasProcess; label?: string }> = []
  for (const raw of text.split(/\n|;/)) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^([\p{L}\p{N}'’]+)\s*(?:-|–|→|->)\s*([\p{L}\p{N}'’]+)\s*[:=]?\s*(.*)$/u)
    if (!m) throw new Error(`Không đọc được quá trình "${line}". Viết dạng "1-2: đẳng nhiệt"`)
    if (!states.has(m[1])) throw new Error(`Chưa khai báo trạng thái ${m[1]}`)
    if (!states.has(m[2])) throw new Error(`Chưa khai báo trạng thái ${m[2]}`)
    const bar = m[3].indexOf('|')
    const procRaw = (bar >= 0 ? m[3].slice(0, bar) : m[3]).trim()
    const label = (bar >= 0 ? m[3].slice(bar + 1) : '').trim()
    const kind = procRaw ? processOf(procRaw) : 'line'
    if (!kind) throw new Error(`Quá trình ${m[1]}-${m[2]}: chỉ nhận đẳng nhiệt, đẳng tích, đẳng áp hoặc thẳng`)
    out.push(label ? { from: m[1], to: m[2], kind, label } : { from: m[1], to: m[2], kind })
  }
  return out
}

/** tên trục ngang/dọc theo hệ trục */
function axisVars(axes: GasAxes): { x: 'V' | 'T'; y: 'p' | 'V' } {
  return axes === 'pV' ? { x: 'V', y: 'p' } : axes === 'pT' ? { x: 'T', y: 'p' } : { x: 'T', y: 'V' }
}

const near = (a: number, b: number) => Math.abs(a - b) <= 0.03 * Math.max(Math.abs(a), Math.abs(b), 1e-9)

/** điểm trên đường đi của quá trình (toạ độ số liệu) + có nằm trên đường qua O không */
function processPath(axes: GasAxes, kind: GasProcess, A: [number, number], B: [number, number], label: string): { pts: Array<[number, number]>; throughOrigin: boolean } {
  const straight = { pts: [A, B], throughOrigin: false }
  const fail = (why: string) => {
    throw new Error(`Quá trình ${label} (${GAS_PROCESS_LABEL[kind]}): ${why}`)
  }
  if (kind === 'line') return straight
  const [x1, y1] = A
  const [x2, y2] = B
  // đẳng nhiệt
  if (kind === 'isothermal') {
    if (axes === 'pV') {
      // p·V không đổi → cung hypebol p = C/V
      if (!near(x1 * y1, x2 * y2)) fail(`p·V phải bằng nhau (${fmt(x1 * y1)} ≠ ${fmt(x2 * y2)})`)
      if (x1 <= 0 || x2 <= 0) fail('V phải dương')
      const C = (x1 * y1 + x2 * y2) / 2
      const pts: Array<[number, number]> = []
      for (let i = 0; i <= 40; i++) {
        const v = x1 + ((x2 - x1) * i) / 40
        pts.push([v, C / v])
      }
      pts[0] = A
      pts[40] = B
      return { pts, throughOrigin: false }
    }
    // p–T, V–T: T không đổi → đoạn thẳng đứng
    if (!near(x1, x2)) fail('nhiệt độ T của hai trạng thái phải bằng nhau')
    return straight
  }
  if (kind === 'isochoric') {
    if (axes === 'pV') {
      if (!near(x1, x2)) fail('thể tích V của hai trạng thái phải bằng nhau')
      return straight
    }
    if (axes === 'VT') {
      if (!near(y1, y2)) fail('thể tích V của hai trạng thái phải bằng nhau')
      return straight
    }
    // p–T: p/T không đổi → nằm trên đường qua O
    if (x1 <= 0 || x2 <= 0) fail('T phải dương')
    if (!near(y1 / x1, y2 / x2)) fail('p/T phải bằng nhau (đoạn nằm trên đường thẳng qua O)')
    return { pts: [A, B], throughOrigin: true }
  }
  // đẳng áp
  if (axes === 'pV' || axes === 'pT') {
    if (!near(y1, y2)) fail('áp suất p của hai trạng thái phải bằng nhau')
    return straight
  }
  // V–T: V/T không đổi
  if (x1 <= 0 || x2 <= 0) fail('T phải dương')
  if (!near(y1 / x1, y2 / x2)) fail('V/T phải bằng nhau (đoạn nằm trên đường thẳng qua O)')
  return { pts: [A, B], throughOrigin: true }
}

const SUB = '₀₁₂₃₄₅₆₇₈₉'
const sub = (name: string) => (/^\d+$/.test(name) ? [...name].map((c) => SUB[Number(c)]).join('') : name)
const formatProcLabel = (raw: string) =>
  esc(raw).replace(/_\{([^{}]+)\}|_([\p{L}\p{N}]+)/gu, (_, braced?: string, plain?: string) => {
    const s = braced ?? plain ?? ''
    return /^\d+$/.test(s) ? sub(s) : `<tspan baseline-shift="sub" font-size="70%">${s}</tspan>`
  })

export function renderGasSvg(spec: GasSpec, desc: string): { svg: string; width: number; height: number } {
  const states = parseGasStates(spec.states)
  const procs = parseGasProcesses(spec.processes ?? '', states)
  const { x: xv, y: yv } = axisVars(spec.axes)
  const paths = procs.map((p) => ({ ...p, ...processPath(spec.axes, p.kind, states.get(p.from)!, states.get(p.to)!, `${p.from}-${p.to}`) }))

  const all = [...states.values(), ...paths.flatMap((p) => p.pts)]
  const xMax = Math.max(...all.map((p) => p[0])) * 1.18 || 1
  const yMax = Math.max(...all.map((p) => p[1])) * 1.18 || 1
  const W = 420
  const H = 320
  const left = 52
  const right = W - 44
  const top = 36
  const bottom = H - 42
  const X = (v: number) => left + (v / xMax) * (right - left)
  const Y = (v: number) => bottom - (v / yMax) * (bottom - top)
  const unit = (u: string) => (u.trim() ? ` (${esc(u.trim())})` : '')
  const unitOf = (v: 'p' | 'V' | 'T') => (v === 'p' ? spec.pUnit : v === 'V' ? spec.vUnit : spec.tUnit) ?? ''

  let b = ARROW
  // trục
  b += `<path d="M${left} ${bottom}H${right + 22}" stroke="#111" stroke-width="1.3" marker-end="url(#gasarr)"/>`
  b += `<path d="M${left} ${bottom}V${top - 20}" stroke="#111" stroke-width="1.3" marker-end="url(#gasarr)"/>`
  b += `<text x="${right + 22}" y="${bottom + 20}" ${FAM} font-size="15" text-anchor="end"><tspan font-style="italic">${xv}</tspan>${unit(unitOf(xv))}</text>`
  b += `<text x="${left + 8}" y="${top - 12}" ${FAM} font-size="15"><tspan font-style="italic">${yv}</tspan>${unit(unitOf(yv))}</text>`
  b += `<text x="${left - 6}" y="${bottom + 16}" ${FAM} font-size="14" text-anchor="end">O</text>`

  // vạch + nhãn vạch (gom trạng thái trùng giá trị)
  const ticks = (axis: 0 | 1) => {
    const m = new Map<number, string[]>()
    for (const [name, p] of states) {
      const v = Math.round(p[axis] * 1e6) / 1e6
      if (v === 0) continue
      m.set(v, [...(m.get(v) ?? []), name])
    }
    return m
  }
  // p₁ = p₂: chữ biến nghiêng, tên trạng thái làm chỉ số dưới (số dùng kí tự ₁₂, chữ dùng tspan hạ dòng)
  const one = (v: string, name: string) =>
    /^\d+$/.test(name)
      ? `<tspan font-style="italic">${v}</tspan>${sub(name)}`
      : `<tspan font-style="italic">${v}</tspan><tspan font-size="10" dy="4">${esc(name)}</tspan><tspan dy="-4">​</tspan>`
  const symbol = (v: string, names: string[]) => names.map((n) => one(v, n)).join(' = ')
  if (spec.ticks !== 'none') {
    for (const [v, names] of ticks(0)) {
      b += `<path d="M${f1(X(v))} ${bottom - 3}V${bottom + 3}" stroke="#111"/>`
      const label = spec.ticks === 'symbol' ? symbol(xv, names) : fmt(v)
      b += `<text x="${f1(X(v))}" y="${bottom + 18}" ${FAM} font-size="14" text-anchor="middle">${label}</text>`
    }
    for (const [v, names] of ticks(1)) {
      b += `<path d="M${left - 3} ${f1(Y(v))}H${left + 3}" stroke="#111"/>`
      const label = spec.ticks === 'symbol' ? symbol(yv, names) : fmt(v)
      b += `<text x="${left - 7}" y="${f1(Y(v) + 5)}" ${FAM} font-size="14" text-anchor="end">${label}</text>`
    }
  }

  // gióng
  if (spec.dashed)
    for (const [x, y] of states.values()) {
      if (x > 0) b += `<path d="M${f1(X(x))} ${f1(Y(y))}V${bottom}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
      if (y > 0) b += `<path d="M${left} ${f1(Y(y))}H${f1(X(x))}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
    }

  // kéo dài về O
  if (spec.toOrigin)
    for (const p of paths) {
      if (!p.throughOrigin) continue
      const near0 = p.pts[0][0] <= p.pts[p.pts.length - 1][0] ? p.pts[0] : p.pts[p.pts.length - 1]
      b += `<path d="M${left} ${bottom}L${f1(X(near0[0]))} ${f1(Y(near0[1]))}" stroke="#111" stroke-width="1" stroke-dasharray="5 4"/>`
    }

  // quá trình + mũi tên ở giữa
  const cx = (left + right) / 2
  const cy = (top + bottom) / 2
  const showStates = spec.showStates !== false
  for (const p of paths) {
    const d = p.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(X(x))} ${f1(Y(y))}`).join('')
    b += `<path d="${d}" fill="none" stroke="#111" stroke-width="2"/>`
    if (spec.arrows) {
      const n = p.pts.length
      const i = Math.max(1, Math.floor(n / 2))
      const a = n === 2 ? [(p.pts[0][0] + p.pts[1][0]) / 2, (p.pts[0][1] + p.pts[1][1]) / 2] : p.pts[i]
      const prev = n === 2 ? p.pts[0] : p.pts[i - 1]
      const ax = X(a[0])
      const ay = Y(a[1])
      let dx = ax - X(prev[0])
      let dy = ay - Y(prev[1])
      const len = Math.hypot(dx, dy) || 1
      dx /= len
      dy /= len
      b += `<path d="M${f1(ax - dx * 8)} ${f1(ay - dy * 8)}L${f1(ax + dx * 2)} ${f1(ay + dy * 2)}" stroke="#111" stroke-width="2" marker-end="url(#gasarr)"/>`
    }
    if (p.label) {
      const p0 = p.pts[0]
      const p1 = p.pts[p.pts.length - 1]
      const d0 = Math.hypot(X(p0[0]) - left, bottom - Y(p0[1]))
      const d1 = Math.hypot(X(p1[0]) - left, bottom - Y(p1[1]))
      const farEnd = d1 >= d0
      const far = farEnd ? p1 : p0
      const adj = farEnd ? p.pts[p.pts.length - 2] : p.pts[1]
      const fx = X(far[0])
      const fy = Y(far[1])
      let vx = fx - X(adj[0])
      let vy = fy - Y(adj[1])
      let len = Math.hypot(vx, vy)
      if (len < 1e-6) {
        vx = fx - left
        vy = fy - bottom
        len = Math.hypot(vx, vy) || 1
      }
      const ux = vx / len
      const uy = vy / len
      const dist = 11 + (Math.abs(uy) > 0.7 ? 2 : 0)
      let anchor = ux > 0.25 ? 'start' : ux < -0.25 ? 'end' : 'middle'
      let lx = fx + ux * dist
      let ly = fy + uy * dist + 5
      // nếu vẫn hiện nhãn trạng thái, tránh đè lên "(tên)" tại cùng đầu mút
      if (showStates) {
        if (anchor === 'middle' && fy <= cy) {
          anchor = fx >= cx ? 'end' : 'start'
          lx = fx + (fx >= cx ? -6 : 6)
        } else if ((anchor === 'start' && fx >= cx) || (anchor === 'end' && fx < cx)) {
          ly = fy <= cy ? Math.max(ly, fy + 14) : Math.min(ly, fy - 5)
        }
      }
      ly = Math.max(18, Math.min(H - 6, ly))
      b += `<text x="${f1(lx)}" y="${f1(ly)}" ${FAM} font-size="15" text-anchor="${anchor}">${formatProcLabel(p.label)}</text>`
    }
  }

  // trạng thái
  if (showStates) {
    for (const [name, [x, y]] of states) {
      const px = X(x)
      const py = Y(y)
      b += `<circle cx="${f1(px)}" cy="${f1(py)}" r="3" fill="#111"/>`
      // đặt nhãn ra phía ngoài so với tâm khung để đỡ đè đường
      const lx = px + (px >= cx ? 9 : -9)
      const ly = py + (py <= cy ? -7 : 16)
      b += `<text x="${f1(lx)}" y="${f1(ly)}" ${FAM} font-size="15" text-anchor="${px >= cx ? 'start' : 'end'}">(${esc(name)})</text>`
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${b}</svg>`
  return { svg, width: W, height: H }
}

export const GAS_DEFAULT: GasSpec = {
  axes: 'pV',
  states: '1: (1; 4)\n2: (4; 1)\n3: (4; 4)',
  processes: '1-2: đẳng nhiệt\n2-3: đẳng tích\n3-1: đẳng áp',
  pUnit: 'atm',
  vUnit: 'L',
  tUnit: 'K',
  ticks: 'value',
  dashed: true,
  arrows: true,
  toOrigin: true,
  showStates: true,
}
