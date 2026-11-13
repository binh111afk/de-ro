/**
 * Đường sức điện trường và từ trường (Vật lí 11):
 * - 1 điện tích điểm, 2 điện tích (tích phân số RK4 theo định luật Coulomb), bản tụ phẳng.
 * - Dây dẫn thẳng vuông góc mặt phẳng (⊙/⊗), dây dẫn nằm trong mặt phẳng,
 *   vòng dây tròn (mặt cắt), ống dây (quy tắc nắm tay phải), nam châm thẳng.
 * - Tách hàm tính đường sức `fieldLines(spec)` khỏi `renderFieldSvg` để kiểm tra bằng số.
 */
import type { LabelPos } from './toolSpec'
import { ARROW, FAM, esc, f1, wrap } from './physics'

export type FieldScene =
  | { type: 'charge'; sign: '+' | '-' }
  | { type: 'two-charges'; signs: ['+' | '-', '+' | '-']; ratio?: number }
  | { type: 'plates' }
  | { type: 'wire'; current: 'out' | 'in' }
  | { type: 'wire-side'; current: 'up' | 'down' }
  | { type: 'loop'; current: 'cw' | 'ccw' }
  | { type: 'solenoid'; current: 'left' | 'right' }
  | { type: 'magnet'; orient: 'h' | 'v' }

export interface FieldSpec {
  scene: FieldScene
  /** số đường sức (4–16) */
  lines: number
  /** mũi tên chiều trên đường sức */
  showArrows: boolean
  /** nhãn q, I, N, S, B⃗/E⃗ */
  labels: boolean
  /** tuỳ chọn: vẽ vectơ tại 1 điểm M (toạ độ toán học) */
  probe?: { x: number; y: number; vector: 'E' | 'B' }
  labelPos?: LabelPos
}

export interface FieldPoint {
  x: number
  y: number
}

export interface FieldPolyline {
  points: FieldPoint[]
  closed?: boolean
}

export const FIELD_DEFAULT: FieldSpec = {
  scene: { type: 'two-charges', signs: ['+', '-'], ratio: 1 },
  lines: 8,
  showArrows: true,
  labels: true,
}

const X_LIM = 2.35
const Y_LIM = 1.65

function clampLines(n: number): number {
  if (!Number.isFinite(n)) return 8
  return Math.max(4, Math.min(16, Math.round(n)))
}

function clampRatio(r: number | undefined): number {
  if (r === undefined || !Number.isFinite(r) || r <= 0) return 1
  return Math.max(0.25, Math.min(4, r))
}

function clipToBox(p0: FieldPoint, p1: FieldPoint): FieldPoint {
  let t = 1
  if (p1.x > X_LIM && p1.x !== p0.x) t = Math.min(t, (X_LIM - p0.x) / (p1.x - p0.x))
  if (p1.x < -X_LIM && p1.x !== p0.x) t = Math.min(t, (-X_LIM - p0.x) / (p1.x - p0.x))
  if (p1.y > Y_LIM && p1.y !== p0.y) t = Math.min(t, (Y_LIM - p0.y) / (p1.y - p0.y))
  if (p1.y < -Y_LIM && p1.y !== p0.y) t = Math.min(t, (-Y_LIM - p0.y) / (p1.y - p0.y))
  t = Math.max(0, Math.min(1, t))
  return { x: p0.x + t * (p1.x - p0.x), y: p0.y + t * (p1.y - p0.y) }
}

function inBox(p: FieldPoint): boolean {
  return Math.abs(p.x) <= X_LIM && Math.abs(p.y) <= Y_LIM
}

/** Trường điện tại (x, y) cho hệ 2 điện tích tại (-1, 0) và (1, 0). */
function twoChargeField(x: number, y: number, q1: number, q2: number): [number, number] {
  const dx1 = x + 1
  const dy1 = y
  const r1Sq = dx1 * dx1 + dy1 * dy1
  const r1 = Math.sqrt(r1Sq)
  const dx2 = x - 1
  const dy2 = y
  const r2Sq = dx2 * dx2 + dy2 * dy2
  const r2 = Math.sqrt(r2Sq)
  if (r1 < 1e-6 || r2 < 1e-6) return [0, 0]
  const ex = (q1 * dx1) / (r1Sq * r1) + (q2 * dx2) / (r2Sq * r2)
  const ey = (q1 * dy1) / (r1Sq * r1) + (q2 * dy2) / (r2Sq * r2)
  return [ex, ey]
}

/** Trường từ 2D (mặt cắt vòng dây tròn) tại (x, y) với 2 dây tại (0, a) và (0, -a). */
function loopCrossField(x: number, y: number, dir: 'cw' | 'ccw'): [number, number] {
  // ccw nhìn từ phải: dây trên (0, a) dòng hướng ra (+1), dây dưới (0, -a) dòng hướng vào (-1)
  // -> tại tâm (0, 0), B hướng sang phải (+x)
  const s = dir === 'ccw' ? 1 : -1
  const a = 0.72
  const dy1 = y - a
  const r1Sq = x * x + dy1 * dy1
  const dy2 = y + a
  const r2Sq = x * x + dy2 * dy2
  if (r1Sq < 1e-8 || r2Sq < 1e-8) return [0, 0]
  const bx = s * (-dy1 / r1Sq + dy2 / r2Sq)
  const by = s * (x / r1Sq - x / r2Sq)
  return [bx, by]
}

/** Tích phân RK4 theo hướng chuẩn hoá của trường vector. */
function traceRK4(
  start: FieldPoint,
  dirSign: 1 | -1,
  fieldFn: (x: number, y: number) => [number, number],
  opts: {
    step?: number
    maxSteps?: number
    stopCenters?: Array<{ x: number; y: number; r: number }>
    stopNearStart?: boolean
  } = {},
): FieldPolyline {
  const ds = opts.step ?? 0.03
  const maxSteps = opts.maxSteps ?? 420
  const pts: FieldPoint[] = [start]

  const unit = (x: number, y: number): [number, number] | null => {
    const [fx, fy] = fieldFn(x, y)
    const mag = Math.hypot(fx, fy)
    if (mag < 1e-7) return null
    return [(dirSign * fx) / mag, (dirSign * fy) / mag]
  }

  let cur = start
  let closed = false

  for (let i = 0; i < maxSteps; i++) {
    const k1 = unit(cur.x, cur.y)
    if (!k1) break
    const k2 = unit(cur.x + 0.5 * ds * k1[0], cur.y + 0.5 * ds * k1[1])
    if (!k2) break
    const k3 = unit(cur.x + 0.5 * ds * k2[0], cur.y + 0.5 * ds * k2[1])
    if (!k3) break
    const k4 = unit(cur.x + ds * k3[0], cur.y + ds * k3[1])
    if (!k4) break

    const next: FieldPoint = {
      x: cur.x + (ds / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      y: cur.y + (ds / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    }

    if (!inBox(next)) {
      pts.push(clipToBox(cur, next))
      break
    }

    pts.push(next)
    cur = next

    if (opts.stopCenters?.some((c) => Math.hypot(cur.x - c.x, cur.y - c.y) <= c.r)) {
      break
    }

    if (opts.stopNearStart && i > 12 && Math.hypot(cur.x - start.x, cur.y - start.y) < ds * 1.1) {
      pts.push(start)
      closed = true
      break
    }
  }

  return { points: pts, closed }
}

/**
 * Quy ước ống dây (SGK Vật lí 11 — quy tắc nắm tay phải):
 * - `current: 'right'`: dòng điện chạy qua ống dây theo chiều từ trái sang phải, với các vòng dây mặt trước hướng LÊN.
 *   Nắm bàn tay phải sao cho bốn ngón tay hướng theo chiều dòng điện mặt trước (đi lên) -> ngón cái choãi ra chỉ sang TRÁI -> cực Bắc (N) ở bên TRÁI, cực Nam (S) ở bên PHẢI.
 * - `current: 'left'`: dòng điện mặt trước hướng XUỐNG -> ngón cái chỉ sang PHẢI -> cực Bắc (N) ở bên PHẢI, cực Nam (S) ở bên TRÁI.
 */
export function solenoidNorthSide(current: 'left' | 'right'): 'left' | 'right' {
  return current === 'right' ? 'left' : 'right'
}

/** Tính danh sách đường sức (toạ độ toán học, gốc O ở tâm, +x sang phải, +y lên trên). */
export function fieldLines(spec: FieldSpec): FieldPolyline[] {
  const N = clampLines(spec.lines)
  const sc = spec.scene

  switch (sc.type) {
    case 'charge': {
      const r0 = 0.14
      const r1 = 1.55
      const out: FieldPolyline[] = []
      for (let i = 0; i < N; i++) {
        const a = (2 * Math.PI * i) / N
        const pIn: FieldPoint = { x: r0 * Math.cos(a), y: r0 * Math.sin(a) }
        const pOut: FieldPoint = { x: r1 * Math.cos(a), y: r1 * Math.sin(a) }
        const pMid: FieldPoint = { x: 0.5 * (pIn.x + pOut.x), y: 0.5 * (pIn.y + pOut.y) }
        out.push({ points: sc.sign === '+' ? [pIn, pMid, pOut] : [pOut, pMid, pIn] })
      }
      return out
    }

    case 'two-charges': {
      const q1 = sc.signs[0] === '+' ? 1 : -1
      const q2 = (sc.signs[1] === '+' ? 1 : -1) * clampRatio(sc.ratio)
      const rStart = 0.14
      const rStop = 0.08
      const sameSign = q1 * q2 > 0
      const fn = (x: number, y: number) => twoChargeField(x, y, q1, q2)
      const out: FieldPolyline[] = []

      if (sameSign) {
        // Cùng dấu: lệch nửa bước góc để không có đường nào đâm thẳng vào điểm trung hoà (0, 0),
        // đồng thời đối xứng qua trục tung x = 0 khi |q1| = |q2|.
        const ratio = Math.abs(q2 / q1)
        const n1 = ratio > 1 ? Math.max(4, Math.round(N / ratio)) : N
        const n2 = ratio < 1 ? Math.max(4, Math.round(N * ratio)) : N
        const dir: 1 | -1 = q1 > 0 ? 1 : -1

        for (let i = 0; i < n1; i++) {
          const a = (2 * Math.PI * (i + 0.5)) / n1
          const start = { x: -1 + rStart * Math.cos(a), y: rStart * Math.sin(a) }
          const poly = traceRK4(start, dir, fn, { stopCenters: [{ x: 1, y: 0, r: rStop }] })
          if (dir === -1) poly.points.reverse()
          out.push(poly)
        }
        for (let i = 0; i < n2; i++) {
          const a = Math.PI - (2 * Math.PI * (i + 0.5)) / n2
          const start = { x: 1 + rStart * Math.cos(a), y: rStart * Math.sin(a) }
          const poly = traceRK4(start, dir, fn, { stopCenters: [{ x: -1, y: 0, r: rStop }] })
          if (dir === -1) poly.points.reverse()
          out.push(poly)
        }
        return out
      }

      // Trái dấu: xuất phát từ điện tích dương (hoặc vào điện tích âm nếu điện tích âm lớn hơn)
      const posX = q1 > 0 ? -1 : 1
      const negX = q1 > 0 ? 1 : -1
      const absPos = q1 > 0 ? Math.abs(q1) : Math.abs(q2)
      const absNeg = q1 > 0 ? Math.abs(q2) : Math.abs(q1)
      const nPos = absNeg > absPos ? Math.max(4, Math.round((N * absPos) / absNeg)) : N

      for (let i = 0; i < nPos; i++) {
        const a = (2 * Math.PI * i) / nPos
        const start = { x: posX + rStart * Math.cos(a), y: rStart * Math.sin(a) }
        out.push(traceRK4(start, 1, fn, { stopCenters: [{ x: negX, y: 0, r: rStop }] }))
      }

      // Đường đối xứng trên trục nối đi vào điện tích âm từ phía ngoài (hoặc thêm đường khi |q-| > |q+|)
      const extraNeg = absNeg > absPos ? N - nPos : 0
      if (extraNeg > 0) {
        const nNeg = N
        for (let i = 0; i < nNeg; i++) {
          const a = (2 * Math.PI * i) / nNeg
          // Bỏ qua các góc hướng về điện tích dương đã có đường nối
          const towardPos = posX < negX ? Math.cos(a) < 0 : Math.cos(a) > 0
          if (towardPos && Math.abs(Math.sin(a)) < 0.7) continue
          const start = { x: negX + rStart * Math.cos(a), y: rStart * Math.sin(a) }
          const poly = traceRK4(start, -1, fn, { stopCenters: [{ x: posX, y: 0, r: rStop }] })
          const endsAtPos = Math.hypot(poly.points[poly.points.length - 1].x - posX, poly.points[poly.points.length - 1].y) <= rStop + 0.05
          if (!endsAtPos) {
            poly.points.reverse()
            out.push(poly)
          }
        }
      } else {
        // Đường trục ngoài đi vào điện tích âm
        const outerX = negX > 0 ? X_LIM : -X_LIM
        const endX = negX > 0 ? negX + rStop : negX - rStop
        out.push({ points: [{ x: outerX, y: 0 }, { x: 0.5 * (outerX + endX), y: 0 }, { x: endX, y: 0 }] })
      }
      return out
    }

    case 'plates': {
      const out: FieldPolyline[] = []
      const ySpan = 1.05
      for (let i = 0; i < N; i++) {
        const y = N === 1 ? 0 : -ySpan + (2 * ySpan * i) / (N - 1)
        out.push({ points: [{ x: -1.12, y }, { x: 0, y }, { x: 1.12, y }] })
      }
      return out
    }

    case 'wire': {
      const count = Math.min(8, Math.max(3, Math.round(N / 2)))
      const out: FieldPolyline[] = []
      const M = 64
      const dir = sc.current === 'out' ? 1 : -1
      for (let k = 0; k < count; k++) {
        const R = 0.34 + (1.15 * k) / Math.max(1, count - 1)
        const pts: FieldPoint[] = []
        for (let i = 0; i <= M; i++) {
          const theta = dir * ((2 * Math.PI * i) / M)
          pts.push({ x: R * Math.cos(theta), y: R * Math.sin(theta) })
        }
        out.push({ points: pts, closed: true })
      }
      return out
    }

    case 'wire-side': {
      // Dây dẫn thẳng nằm trong mặt phẳng (trục tung x = 0): hai bên là các ký hiệu ⊙ và ⊗, không có đường sức cong trong mặt phẳng
      return []
    }

    case 'loop': {
      const out: FieldPolyline[] = []
      // Đường sức thẳng dọc trục vòng dây (y = 0)
      const dir = sc.current === 'ccw' ? 1 : -1
      out.push({
        points: dir > 0 ? [{ x: -2.1, y: 0 }, { x: 0, y: 0 }, { x: 2.1, y: 0 }] : [{ x: 2.1, y: 0 }, { x: 0, y: 0 }, { x: -2.1, y: 0 }],
      })
      const a = 0.72
      const rings = Math.max(2, Math.min(5, Math.floor(N / 2)))
      const fn = (x: number, y: number) => loopCrossField(x, y, sc.current)
      for (let k = 0; k < rings; k++) {
        const offset = 0.16 + 0.13 * k
        // Nửa trên quanh (0, a)
        out.push(traceRK4({ x: 0, y: a - offset }, 1, fn, { step: 0.025, maxSteps: 600, stopNearStart: true }))
        // Nửa dưới quanh (0, -a)
        out.push(traceRK4({ x: 0, y: -a + offset }, 1, fn, { step: 0.025, maxSteps: 600, stopNearStart: true }))
      }
      return out
    }

    case 'solenoid': {
      return barLikeFieldLines(N, solenoidNorthSide(sc.current), 'h', 1.05, 0.42)
    }

    case 'magnet': {
      return barLikeFieldLines(N, 'left', sc.orient, 1.05, 0.34)
    }
  }
}

/** Tạo đường sức kiểu nam châm thẳng / ống dây: song song trong lòng, khép kín bên ngoài, đi ra từ cực N vào cực S. */
function barLikeFieldLines(
  N: number,
  northSide: 'left' | 'right',
  orient: 'h' | 'v',
  halfLen: number,
  halfThick: number,
): FieldPolyline[] {
  const out: FieldPolyline[] = []
  const dir = northSide === 'left' ? -1 : 1 // bên trong đi từ S -> N (nên nếu N ở trái thì bên trong đi sang trái: -1)
  const M = 48

  const mapPt = (u: number, v: number): FieldPoint => (orient === 'h' ? { x: u, y: v } : { x: v, y: -u })

  // Đường trục chính đi qua tâm: đi từ S -> N rồi ra ngoài
  out.push({
    points: [
      mapPt(-dir * 2.15, 0),
      mapPt(0, 0),
      mapPt(dir * 2.15, 0),
    ],
  })

  const pairs = Math.max(2, Math.min(6, Math.floor(N / 2)))
  for (let k = 1; k <= pairs; k++) {
    const frac = k / (pairs + 0.6)
    const vIn = halfThick * 0.72 * frac
    const vOut = halfThick + 0.28 + 0.24 * (k - 1)
    const uEnd = halfLen + 0.15 + 0.14 * (k - 1)

    for (const sign of [1, -1] as const) {
      const pts: FieldPoint[] = []
      // Đoạn trong lòng: từ S (-dir * halfLen) -> N (dir * halfLen)
      for (let i = 0; i <= 12; i++) {
        const u = (-dir + (2 * dir * i) / 12) * halfLen
        pts.push(mapPt(u, sign * vIn))
      }
      // Vòng cung ngoài từ N quay về S
      for (let i = 1; i <= M; i++) {
        const t = i / M
        const theta = Math.PI * t // 0 tại N, π tại S
        const u = dir * uEnd * Math.cos(theta)
        const v = sign * (vIn + (vOut - vIn) * Math.sin(theta))
        pts.push(mapPt(u, v))
      }
      pts.push(pts[0])
      out.push({ points: pts, closed: true })
    }
  }
  return out
}

/** Tính vectơ trường chuẩn hoá tại điểm M(x, y) để vẽ mũi tên probe. */
export function fieldVectorAt(scene: FieldScene, x: number, y: number): { vx: number; vy: number } | null {
  let fx = 0
  let fy = 0
  switch (scene.type) {
    case 'charge': {
      const r = Math.hypot(x, y)
      if (r < 1e-6) return null
      const s = scene.sign === '+' ? 1 : -1
      fx = (s * x) / r
      fy = (s * y) / r
      break
    }
    case 'two-charges': {
      const q1 = scene.signs[0] === '+' ? 1 : -1
      const q2 = (scene.signs[1] === '+' ? 1 : -1) * clampRatio(scene.ratio)
      ;[fx, fy] = twoChargeField(x, y, q1, q2)
      break
    }
    case 'plates':
      fx = 1
      fy = 0
      break
    case 'wire': {
      const r = Math.hypot(x, y)
      if (r < 1e-6) return null
      const s = scene.current === 'out' ? 1 : -1
      fx = (-s * y) / r
      fy = (s * x) / r
      break
    }
    case 'wire-side':
      return null
    case 'loop':
      ;[fx, fy] = loopCrossField(x, y, scene.current)
      break
    case 'solenoid': {
      const dir = solenoidNorthSide(scene.current) === 'left' ? -1 : 1
      const inside = Math.abs(x) < 1.05 && Math.abs(y) < 0.42
      fx = inside ? dir : -dir
      fy = 0
      break
    }
    case 'magnet': {
      const dir = -1
      if (scene.orient === 'h') {
        const inside = Math.abs(x) < 1.05 && Math.abs(y) < 0.34
        fx = inside ? dir : -dir
        fy = 0
      } else {
        const inside = Math.abs(y) < 1.05 && Math.abs(x) < 0.34
        fx = 0
        fy = inside ? -dir : dir
      }
      break
    }
  }
  const mag = Math.hypot(fx, fy)
  if (mag < 1e-7) return null
  return { vx: fx / mag, vy: fy / mag }
}

/* ------------------------------------------------------------------ *
 * Vẽ SVG
 * ------------------------------------------------------------------ */

const W = 460
const H = 320
const SCALE = 92
const sx = (x: number) => W / 2 + x * SCALE
const sy = (y: number) => H / 2 - y * SCALE

/** Ký hiệu ⊙ (chấm trong tròn) vẽ bằng SVG. */
function drawDotSymbol(cx: number, cy: number, r = 10): string {
  return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="#fff" stroke="#111" stroke-width="1.4"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="2.5" fill="#111"/>`
}

/** Ký hiệu ⊗ (chéo trong tròn) vẽ bằng SVG. */
function drawCrossSymbol(cx: number, cy: number, r = 10): string {
  const d = r * 0.62
  return (
    `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="#fff" stroke="#111" stroke-width="1.4"/>` +
    `<path d="M${f1(cx - d)} ${f1(cy - d)}L${f1(cx + d)} ${f1(cy + d)}M${f1(cx + d)} ${f1(cy - d)}L${f1(cx - d)} ${f1(cy + d)}" stroke="#111" stroke-width="1.4"/>`
  )
}

/** Ký hiệu điện tích điểm (+) hoặc (−). */
function drawCharge(cx: number, cy: number, sign: '+' | '-', label?: string): string {
  let b = `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="11" fill="#fff" stroke="#111" stroke-width="1.5"/>`
  b += `<path d="M${f1(cx - 5)} ${f1(cy)}H${f1(cx + 5)}" stroke="#111" stroke-width="1.7"/>`
  if (sign === '+') {
    b += `<path d="M${f1(cx)} ${f1(cy - 5)}V${f1(cy + 5)}" stroke="#111" stroke-width="1.7"/>`
  }
  if (label) {
    b += `<text x="${f1(cx)}" y="${f1(cy + 24)}" ${FAM} font-size="14" font-style="italic" text-anchor="middle">${esc(label)}</text>`
  }
  return b
}

/** Vẽ mũi tên nhọn tại điểm (px, py) theo hướng (ux, uy) trên màn hình. */
function drawArrowHead(px: number, py: number, ux: number, uy: number, size = 7): string {
  const nx = -uy
  const ny = ux
  const tipX = px + ux * size * 0.55
  const tipY = py + uy * size * 0.55
  const b1x = px - ux * size * 0.45 + nx * size * 0.36
  const b1y = py - uy * size * 0.45 + ny * size * 0.36
  const b2x = px - ux * size * 0.45 - nx * size * 0.36
  const b2y = py - uy * size * 0.45 - ny * size * 0.36
  return `<path d="M${f1(tipX)} ${f1(tipY)}L${f1(b1x)} ${f1(b1y)}L${f1(b2x)} ${f1(b2y)}Z" fill="#111"/>`
}

/** Vẽ nhãn vectơ E⃗ hoặc B⃗ với mũi tên nhỏ phía trên. */
function drawVectorLabel(x: number, y: number, ch: 'E' | 'B'): string {
  return (
    `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="16" font-style="italic" font-weight="bold" text-anchor="middle">${ch}</text>` +
    `<path d="M${f1(x - 5)} ${f1(y - 15)}h9l-2.5 -2m2.5 2l-2.5 2" fill="none" stroke="#111" stroke-width="1"/>`
  )
}

/** Vẽ polyline đường sức + mũi tên theo tỉ lệ cung. */
function drawFieldPolyline(poly: FieldPolyline, showArrows: boolean): string {
  if (poly.points.length < 2) return ''
  const d =
    'M' +
    poly.points.map((p) => `${f1(sx(p.x))} ${f1(sy(p.y))}`).join('L') +
    (poly.closed ? 'Z' : '')
  let b = `<path d="${d}" fill="none" stroke="#111" stroke-width="1.15"/>`

  if (!showArrows) return b

  // Tính tổng chiều dài cung
  const cum: number[] = [0]
  for (let i = 1; i < poly.points.length; i++) {
    const dx = sx(poly.points[i].x) - sx(poly.points[i - 1].x)
    const dy = sy(poly.points[i].y) - sy(poly.points[i - 1].y)
    cum.push(cum[i - 1] + Math.hypot(dx, dy))
  }
  const total = cum[cum.length - 1]
  if (total < 16) return b

  const fracs = poly.closed && total > 180 ? [0.25, 0.75] : [0.5]
  for (const frac of fracs) {
    const target = total * frac
    let idx = 1
    while (idx < cum.length - 1 && cum[idx] < target) idx++
    const p0 = poly.points[idx - 1]
    const p1 = poly.points[idx]
    const segLen = Math.hypot(sx(p1.x) - sx(p0.x), sy(p1.y) - sy(p0.y))
    if (segLen < 1e-4) continue
    const t = (target - cum[idx - 1]) / segLen
    const px = sx(p0.x) + t * (sx(p1.x) - sx(p0.x))
    const py = sy(p0.y) + t * (sy(p1.y) - sy(p0.y))
    const ux = (sx(p1.x) - sx(p0.x)) / segLen
    const uy = (sy(p1.y) - sy(p0.y)) / segLen
    b += drawArrowHead(px, py, ux, uy, 7)
  }
  return b
}

export function renderFieldSvg(spec: FieldSpec, desc: string): { svg: string; width: number; height: number } {
  const lines = fieldLines(spec)
  const sc = spec.scene
  let b = ARROW

  // 1. Vẽ các đường sức
  for (const poly of lines) {
    b += drawFieldPolyline(poly, spec.showArrows)
  }

  // 2. Vẽ vật nguồn tạo trường + nhãn theo SGK
  switch (sc.type) {
    case 'charge': {
      b += drawCharge(sx(0), sy(0), sc.sign, spec.labels ? (sc.sign === '+' ? 'q > 0' : 'q < 0') : undefined)
      if (spec.labels) b += drawVectorLabel(sx(1.68), sy(1.25), 'E')
      break
    }

    case 'two-charges': {
      const q1Label = spec.labels ? (sc.signs[0] === '+' ? 'q₁ > 0' : 'q₁ < 0') : undefined
      const q2Label = spec.labels ? (sc.signs[1] === '+' ? 'q₂ > 0' : 'q₂ < 0') : undefined
      b += drawCharge(sx(-1), sy(0), sc.signs[0], q1Label)
      b += drawCharge(sx(1), sy(0), sc.signs[1], q2Label)
      if (spec.labels) b += drawVectorLabel(sx(1.85), sy(1.3), 'E')
      break
    }

    case 'plates': {
      const xL = sx(-1.16)
      const xR = sx(1.16)
      const yTop = sy(1.2)
      const yBot = sy(-1.2)
      b += `<rect x="${f1(xL - 8)}" y="${f1(yTop)}" width="8" height="${f1(yBot - yTop)}" fill="#fff" stroke="#111" stroke-width="1.5"/>`
      b += `<rect x="${f1(xR)}" y="${f1(yTop)}" width="8" height="${f1(yBot - yTop)}" fill="#fff" stroke="#111" stroke-width="1.5"/>`
      if (spec.labels) {
        for (let k = -1; k <= 1; k++) {
          b += `<text x="${f1(xL - 18)}" y="${f1(sy(k * 0.7) + 5)}" ${FAM} font-size="16" font-weight="bold" text-anchor="middle">+</text>`
          b += `<text x="${f1(xR + 18)}" y="${f1(sy(k * 0.7) + 5)}" ${FAM} font-size="16" font-weight="bold" text-anchor="middle">−</text>`
        }
        b += drawVectorLabel(sx(0), sy(1.28), 'E')
      }
      break
    }

    case 'wire': {
      b += sc.current === 'out' ? drawDotSymbol(sx(0), sy(0), 11) : drawCrossSymbol(sx(0), sy(0), 11)
      if (spec.labels) {
        b += `<text x="${f1(sx(0) + 18)}" y="${f1(sy(0) + 5)}" ${FAM} font-size="15" font-style="italic">I</text>`
        b += drawVectorLabel(sx(1.75), sy(1.25), 'B')
      }
      break
    }

    case 'wire-side': {
      // Dây dẫn thẳng nằm trong mặt phẳng (x = 0)
      const x0 = sx(0)
      b += `<path d="M${f1(x0)} ${f1(sy(-1.35))}V${f1(sy(1.35))}" stroke="#111" stroke-width="2.2"/>`
      const arrowY = sc.current === 'up' ? sy(0.85) : sy(-0.85)
      b += drawArrowHead(x0, arrowY, 0, sc.current === 'up' ? -1 : 1, 9)
      if (spec.labels) {
        b += `<text x="${f1(x0 + 13)}" y="${f1(arrowY + 5)}" ${FAM} font-size="16" font-style="italic">I</text>`
      }

      // Quy tắc nắm tay phải: dòng lên -> trái ⊙, phải ⊗; dòng xuống -> trái ⊗, phải ⊙
      const cols = Math.max(2, Math.min(4, Math.round(clampLines(spec.lines) / 4)))
      const rows = 3
      const leftIsOut = sc.current === 'up'
      for (let r = 0; r < rows; r++) {
        const y = sy(-0.85 + (1.7 * r) / (rows - 1))
        for (let c = 1; c <= cols; c++) {
          const dx = 0.45 + 0.45 * (c - 1)
          b += leftIsOut ? drawDotSymbol(sx(-dx), y, 8.5) : drawCrossSymbol(sx(-dx), y, 8.5)
          b += leftIsOut ? drawCrossSymbol(sx(dx), y, 8.5) : drawDotSymbol(sx(dx), y, 8.5)
        }
      }
      if (spec.labels) {
        b += drawVectorLabel(sx(-1.75), sy(1.25), 'B')
        b += drawVectorLabel(sx(1.75), sy(1.25), 'B')
      }
      break
    }

    case 'loop': {
      const a = 0.72
      const topOut = sc.current === 'ccw'
      b += `<path d="M${f1(sx(0))} ${f1(sy(a))}V${f1(sy(-a))}" stroke="#111" stroke-width="1.2" stroke-dasharray="4 3"/>`
      b += topOut ? drawDotSymbol(sx(0), sy(a), 10) : drawCrossSymbol(sx(0), sy(a), 10)
      b += topOut ? drawCrossSymbol(sx(0), sy(-a), 10) : drawDotSymbol(sx(0), sy(-a), 10)
      if (spec.labels) {
        b += `<text x="${f1(sx(0) + 16)}" y="${f1(sy(a) + 5)}" ${FAM} font-size="14" font-style="italic">I</text>`
        b += drawVectorLabel(sx(1.75), sy(1.25), 'B')
      }
      break
    }

    case 'solenoid': {
      const halfL = 1.05
      const halfH = 0.42
      const turns = 6
      const xStart = sx(-halfL)
      const xEnd = sx(halfL)
      const yTop = sy(halfH)
      const yBot = sy(-halfH)
      const dx = (xEnd - xStart) / turns

      // Nửa sau các vòng dây (nét đứt)
      for (let i = 0; i < turns; i++) {
        const cx = xStart + (i + 0.5) * dx
        b += `<path d="M${f1(cx - dx * 0.25)} ${f1(yTop)}C${f1(cx - dx * 0.5)} ${f1(yTop + 8)},${f1(cx - dx * 0.5)} ${f1(yBot - 8)},${f1(cx - dx * 0.25)} ${f1(yBot)}" fill="none" stroke="#111" stroke-width="1.1" stroke-dasharray="3 3"/>`
      }
      // Nửa trước các vòng dây (nét liền đậm + mũi tên chiều I)
      for (let i = 0; i < turns; i++) {
        const cx = xStart + (i + 0.5) * dx
        b += `<path d="M${f1(cx)} ${f1(yTop)}C${f1(cx + dx * 0.28)} ${f1(yTop + 8)},${f1(cx + dx * 0.28)} ${f1(yBot - 8)},${f1(cx)} ${f1(yBot)}" fill="none" stroke="#111" stroke-width="1.6"/>`
        if (i === 2 || i === 3) {
          const uy = sc.current === 'right' ? -1 : 1
          b += drawArrowHead(cx + dx * 0.21, sy(0), 0, uy, 6.5)
        }
      }
      // Dây dẫn vào/ra ở hai đầu
      b += `<path d="M${f1(xStart)} ${f1(yBot)}H${f1(xStart - 28)}M${f1(xEnd)} ${f1(yBot)}H${f1(xEnd + 28)}" stroke="#111" stroke-width="1.5"/>`
      b += drawArrowHead(xStart - 16, yBot, sc.current === 'right' ? 1 : -1, 0, 6.5)
      b += drawArrowHead(xEnd + 16, yBot, sc.current === 'right' ? 1 : -1, 0, 6.5)

      if (spec.labels) {
        const nSide = solenoidNorthSide(sc.current)
        const nX = nSide === 'left' ? xStart - 16 : xEnd + 16
        const sX = nSide === 'left' ? xEnd + 16 : xStart - 16
        b += `<text x="${f1(nX)}" y="${f1(yTop - 10)}" ${FAM} font-size="16" font-weight="bold" text-anchor="middle" data-pole="N">N</text>`
        b += `<text x="${f1(sX)}" y="${f1(yTop - 10)}" ${FAM} font-size="16" font-weight="bold" text-anchor="middle" data-pole="S">S</text>`
        b += `<text x="${f1(xStart - 18)}" y="${f1(yBot + 16)}" ${FAM} font-size="14" font-style="italic" text-anchor="middle">I</text>`
        b += drawVectorLabel(sx(1.8), sy(1.25), 'B')
      }
      break
    }

    case 'magnet': {
      const halfL = 1.05
      const halfH = 0.34
      if (sc.orient === 'h') {
        const xL = sx(-halfL)
        const xM = sx(0)
        const xR = sx(halfL)
        const yT = sy(halfH)
        const yB = sy(-halfH)
        b += `<rect x="${f1(xL)}" y="${f1(yT)}" width="${f1(xR - xL)}" height="${f1(yB - yT)}" fill="#fff" stroke="#111" stroke-width="1.6"/>`
        b += `<path d="M${f1(xM)} ${f1(yT)}V${f1(yB)}" stroke="#111" stroke-width="1.3"/>`
        if (spec.labels) {
          b += `<text x="${f1((xL + xM) / 2)}" y="${f1(sy(0) + 6)}" ${FAM} font-size="17" font-weight="bold" text-anchor="middle" data-pole="N">N</text>`
          b += `<text x="${f1((xM + xR) / 2)}" y="${f1(sy(0) + 6)}" ${FAM} font-size="17" font-weight="bold" text-anchor="middle" data-pole="S">S</text>`
          b += drawVectorLabel(sx(1.8), sy(1.25), 'B')
        }
      } else {
        const xL = sx(-halfH)
        const xR = sx(halfH)
        const yT = sy(halfL)
        const yM = sy(0)
        const yB = sy(-halfL)
        b += `<rect x="${f1(xL)}" y="${f1(yT)}" width="${f1(xR - xL)}" height="${f1(yB - yT)}" fill="#fff" stroke="#111" stroke-width="1.6"/>`
        b += `<path d="M${f1(xL)} ${f1(yM)}H${f1(xR)}" stroke="#111" stroke-width="1.3"/>`
        if (spec.labels) {
          b += `<text x="${f1(sx(0))}" y="${f1((yT + yM) / 2 + 6)}" ${FAM} font-size="17" font-weight="bold" text-anchor="middle" data-pole="N">N</text>`
          b += `<text x="${f1(sx(0))}" y="${f1((yM + yB) / 2 + 6)}" ${FAM} font-size="17" font-weight="bold" text-anchor="middle" data-pole="S">S</text>`
          b += drawVectorLabel(sx(1.8), sy(1.25), 'B')
        }
      }
      break
    }
  }

  // 3. Điểm khảo sát M và vectơ tại M (tuỳ chọn)
  if (spec.probe) {
    const px = Math.max(-2.1, Math.min(2.1, spec.probe.x))
    const py = Math.max(-1.4, Math.min(1.4, spec.probe.y))
    const vec = fieldVectorAt(sc, px, py)
    const mx = sx(px)
    const my = sy(py)
    b += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="3" fill="#111"/>`
    b += `<text x="${f1(mx - 8)}" y="${f1(my + 15)}" ${FAM} font-size="14" font-style="italic" text-anchor="end">M</text>`
    if (vec) {
      const len = 46
      const ex = mx + vec.vx * len
      const ey = my - vec.vy * len
      b += `<path d="M${f1(mx)} ${f1(my)}L${f1(ex)} ${f1(ey)}" stroke="#111" stroke-width="1.8" marker-end="url(#pharr)"/>`
      b += drawVectorLabel(ex + vec.vx * 12, ey - vec.vy * 12 + 5, spec.probe.vector)
    }
  }

  return wrap(W, H, desc, b)
}
