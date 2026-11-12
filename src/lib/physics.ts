/**
 * Hình Vật lí vẽ theo số liệu:
 * - Đồ thị chuyển động (x–t, v–t, a–t): gõ các điểm gấp khúc "(t; giá trị)", nét đứt chiếu xuống trục.
 * - Mặt phẳng nghiêng: góc α, vật trên dốc và các lực P, N, Fms, F.
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
const fmt = (n: number) => String(Math.round(n * 1000) / 1000).replace('.', ',').replace('-', '−')
const ARROW = `<defs><marker id="pharr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`

/* ------------------------------------------------------------------ *
 * Đồ thị chuyển động
 * ------------------------------------------------------------------ */

export interface MotionSpec {
  /** "x (m)", "v (m/s)", "a (m/s²)" */
  yName: string
  tName: string
  /** các điểm "(0; 0) (2; 4) (5; 4) (7; 0)" — xuống dòng hoặc dấu cách đều được */
  points: string
  /** nét đứt chiếu từ các điểm gãy xuống hai trục */
  dashed: boolean
}

export function parseMotionPoints(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const re = /\(\s*(-?\d+(?:[.,]\d+)?)\s*;\s*(-?\d+(?:[.,]\d+)?)\s*\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push([Number(m[1].replace(',', '.')), Number(m[2].replace(',', '.'))])
  if (out.length < 2) throw new Error('Cần ít nhất 2 điểm dạng (t; giá trị), vd. (0; 0) (2; 4)')
  for (let i = 1; i < out.length; i++) if (out[i][0] < out[i - 1][0]) throw new Error('Thời gian t phải tăng dần')
  return out
}

/** bước chia trục "đẹp" */
function step(span: number) {
  const raw = span / 6
  const p = 10 ** Math.floor(Math.log10(raw || 1))
  return [1, 2, 5, 10].map((k) => k * p).find((s) => s >= raw) ?? p * 10
}

export function renderMotionSvg(spec: MotionSpec, desc: string): { svg: string; width: number; height: number } {
  const pts = parseMotionPoints(spec.points)
  const tMax = Math.max(...pts.map((p) => p[0]))
  const yMaxV = Math.max(0, ...pts.map((p) => p[1]))
  const yMinV = Math.min(0, ...pts.map((p) => p[1]))
  const W = 420
  const H = 300
  const left = 50
  const right = W - 40
  const top = 34
  const bottom = H - 40
  const span = yMaxV - yMinV || 1
  const X = (t: number) => left + (t / (tMax || 1)) * (right - left - 10)
  const Y = (v: number) => top + 10 + ((yMaxV - v) / span) * (bottom - top - 10)
  const y0 = Y(0)
  let b = ARROW
  b += `<path d="M${left} ${f1(y0)}H${right + 18}" stroke="#111" stroke-width="1.3" marker-end="url(#pharr)"/>`
  b += `<path d="M${left} ${bottom + 6}V${top - 16}" stroke="#111" stroke-width="1.3" marker-end="url(#pharr)"/>`
  // điểm cuối âm thì số trục ngang ghi phía trên trục: đưa tên trục xuống dưới để khỏi đè
  const lastNeg = pts[pts.length - 1][1] < 0
  b += `<text x="${right + 20}" y="${f1(lastNeg ? y0 + 18 : y0 - 8)}" ${FAM} font-size="14" font-style="italic" text-anchor="end">${esc(spec.tName)}</text>`
  b += `<text x="${left + 8}" y="${top - 10}" ${FAM} font-size="14" font-style="italic">${esc(spec.yName)}</text>`
  b += `<text x="${left - 6}" y="${f1(y0 + 15)}" ${FAM} font-size="13" text-anchor="end">O</text>`
  // vạch số: các giá trị tại điểm gãy (đúng số liệu đề), không thì chia đều
  const ts = [...new Set(pts.map((p) => p[0]).filter((t) => t !== 0))]
  const ys = [...new Set(pts.map((p) => p[1]).filter((v) => v !== 0))]
  if (!spec.dashed) {
    const st = step(tMax)
    for (let t = st; t <= tMax + 1e-9; t += st) if (!ts.includes(t)) ts.push(t)
  }
  for (const t of ts) {
    b += `<path d="M${f1(X(t))} ${f1(y0 - 3)}V${f1(y0 + 3)}" stroke="#111"/>`
    b += `<text x="${f1(X(t))}" y="${f1(y0 + (yMinV < 0 && pts.some((p) => p[0] === t && p[1] < 0) ? -8 : 17))}" ${FAM} font-size="13" text-anchor="middle">${fmt(t)}</text>`
  }
  for (const v of ys) {
    b += `<path d="M${left - 3} ${f1(Y(v))}H${left + 3}" stroke="#111"/>`
    b += `<text x="${left - 7}" y="${f1(Y(v) + 4.5)}" ${FAM} font-size="13" text-anchor="end">${fmt(v)}</text>`
  }
  if (spec.dashed)
    for (const [t, v] of pts) {
      if (t === 0 && v === 0) continue
      if (t !== 0) b += `<path d="M${f1(X(t))} ${f1(Y(v))}V${f1(y0)}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
      if (v !== 0) b += `<path d="M${left} ${f1(Y(v))}H${f1(X(t))}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
    }
  b += `<path d="M${pts.map(([t, v]) => `${f1(X(t))} ${f1(Y(v))}`).join('L')}" fill="none" stroke="#111" stroke-width="2"/>`
  return wrap(W, H, desc, b)
}

/* ------------------------------------------------------------------ *
 * Mặt phẳng nghiêng
 * ------------------------------------------------------------------ */

export type Dir = 'none' | 'up' | 'down'
export interface InclineSpec {
  /** góc nghiêng (độ) */
  angle: number
  P: boolean
  N: boolean
  /** lực ma sát dọc dốc */
  fms: Dir
  /** lực kéo dọc dốc */
  F: Dir
  /** ghi α ở chân dốc */
  showAngle: boolean
}

export function renderInclineSvg(spec: InclineSpec, desc: string): { svg: string; width: number; height: number } {
  const a = (Math.min(60, Math.max(10, spec.angle || 30)) * Math.PI) / 180
  const W = 440
  const base = 340
  const h = base * Math.tan(a)
  const x0 = 50
  const yb = 40 + h + 30
  const H = Math.round(yb + 40)
  // dốc đi lên từ phải sang trái: chân dốc ở phải (góc α), đỉnh ở trái
  const A: [number, number] = [x0, yb - h]
  const B: [number, number] = [x0, yb]
  const C: [number, number] = [x0 + base, yb]
  let b = ARROW
  b += `<path d="M${f1(A[0])} ${f1(A[1])}L${B[0]} ${B[1]}L${C[0]} ${C[1]}Z" fill="#f2f2f2" stroke="#111" stroke-width="1.6"/>`
  b += `<path d="M${x0 - 20} ${yb}H${C[0] + 30}" stroke="#111" stroke-width="1.2"/>`
  if (spec.showAngle) {
    const r = 34
    b += `<path d="M${C[0] - r} ${yb}A${r} ${r} 0 0 1 ${f1(C[0] - r * Math.cos(a))} ${f1(yb - r * Math.sin(a))}" fill="none" stroke="#111" stroke-width="1.2"/>`
    b += `<text x="${f1(C[0] - r - 14)}" y="${yb - 7}" ${FAM} font-size="16" font-style="italic">α</text>`
  }
  // vật: hình vuông nằm trên dốc, ở giữa dốc
  const u: [number, number] = [-Math.cos(a), -Math.sin(a)] // dọc dốc, hướng lên
  const n: [number, number] = [-Math.sin(a), Math.cos(a)].map((v) => -v) as [number, number] // pháp tuyến hướng ra ngoài
  const s = 46
  const mid: [number, number] = [C[0] + u[0] * base * 0.5 / Math.cos(a), yb + u[1] * base * 0.5 / Math.cos(a)]
  const p = (k: number, m: number): [number, number] => [mid[0] + u[0] * k + n[0] * m, mid[1] + u[1] * k + n[1] * m]
  const box = [p(-s / 2, 0), p(s / 2, 0), p(s / 2, s), p(-s / 2, s)]
  b += `<path d="M${box.map((q) => `${f1(q[0])} ${f1(q[1])}`).join('L')}Z" fill="#fff" stroke="#111" stroke-width="1.6"/>`
  const G = p(0, s / 2)
  b += `<circle cx="${f1(G[0])}" cy="${f1(G[1])}" r="2.5" fill="#111"/>`
  const arrow = (from: [number, number], d: [number, number], len: number, name: string, side = 1) => {
    const to: [number, number] = [from[0] + d[0] * len, from[1] + d[1] * len]
    const lx = to[0] + d[0] * 10 + -d[1] * 12 * side
    const ly = to[1] + d[1] * 10 + d[0] * 12 * side + 5
    const sub = /^(F)(ms|k)$/.exec(name)
    const label = sub ? `${sub[1]}<tspan font-size="11" dy="4">${sub[2]}</tspan>` : esc(name)
    return (
      `<path d="M${f1(from[0])} ${f1(from[1])}L${f1(to[0])} ${f1(to[1])}" stroke="#111" stroke-width="1.8" marker-end="url(#pharr)"/>` +
      `<text x="${f1(lx)}" y="${f1(ly)}" ${FAM} font-size="16" font-style="italic" text-anchor="middle">${label}</text>` +
      `<path d="M${f1(lx - 5)} ${f1(ly - 15)}h10" stroke="#111" stroke-width="0.9"/>`
    )
  }
  if (spec.P) b += arrow(G, [0, 1], 70, 'P')
  if (spec.N) b += arrow(p(0, s), n, 56, 'N', -1)
  const along = (d: Dir): [number, number] => (d === 'up' ? u : [-u[0], -u[1]])
  if (spec.fms !== 'none') b += arrow(p(spec.fms === 'up' ? s / 2 : -s / 2, 0), along(spec.fms), 50, 'Fms')
  if (spec.F !== 'none') b += arrow(p(spec.F === 'up' ? s / 2 : -s / 2, s * 0.7), along(spec.F), 60, 'F', -1)
  return wrap(W, H, desc, b)
}

function wrap(W: number, H: number, desc: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: W, height: H }
}

export { ARROW, FAM, esc, f1, fmt, wrap }
