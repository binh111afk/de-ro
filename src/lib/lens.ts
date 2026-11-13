/**
 * Sơ đồ tạo ảnh qua thấu kính mỏng (Vật lí 11):
 * - Thấu kính hội tụ (f > 0) và phân kì (f < 0).
 * - Tính d′, k = −d′/d, chiều cao ảnh h′ theo đúng công thức 1/f = 1/d + 1/d′.
 * - Vẽ 3 tia đặc biệt (song song trục chính, qua quang tâm O, qua tiêu điểm F),
 *   đường kéo dài nét đứt cho ảnh ảo, trường hợp d = f (ảnh ở vô cực) và |d′| > 6f (ảnh ở xa).
 */
import { FAM, esc, f1, wrap } from './physics'

export type LensType = 'converging' | 'diverging'
export type LensRay = 'parallel' | 'center' | 'focal'

export interface LensNames {
  A?: string
  B?: string
  APrime?: string
  BPrime?: string
  O?: string
  F?: string
  FPrime?: string
}

export interface LensSpec {
  type: LensType
  /** tiêu cự f > 0 (cm) */
  f: number
  /** khoảng cách vật d > 0 (cm) */
  d: number
  /** chiều cao vật h > 0 (cm), mặc định 2 */
  h?: number
  /** các tia đặc biệt cần vẽ, mặc định đủ cả 3 */
  rays?: LensRay[]
  /** hiện thêm các điểm 2F, 2F′ */
  show2F?: boolean
  /** ghi kích thước d, d′, f trên hình */
  showValues?: boolean
  /** tuỳ chỉnh tên các điểm A, B, A′, B′, O, F, F′ */
  names?: LensNames
  /** vật đặt bên trái (mặc định) hay bên phải */
  objectSide?: 'left' | 'right'
  /** chế độ ẩn ảnh + tia ló (cho đề bắt học sinh tự vẽ) */
  hideImage?: boolean
}

export const LENS_DEFAULT: LensSpec = {
  type: 'converging',
  f: 10,
  d: 30,
  h: 2,
  rays: ['parallel', 'center', 'focal'],
  show2F: false,
  showValues: false,
  names: {
    A: 'A',
    B: 'B',
    APrime: 'A′',
    BPrime: 'B′',
    O: 'O',
    F: 'F',
    FPrime: 'F′',
  },
  objectSide: 'left',
  hideImage: false,
}

export interface LensCalc {
  fAlg: number
  d: number
  h: number
  atInfinity: boolean
  dPrime: number | null
  k: number | null
  hPrime: number | null
  isReal: boolean
  upright: boolean
  farAway: boolean
  summary: string
}

/** Định dạng số kiểu SGK Việt Nam: tối đa 2 chữ số thập phân, dấu phẩy thập phân, dấu trừ Unicode. */
export function fmtLensNum(n: number): string {
  if (Math.abs(n) < 1e-9) return '0'
  const r = Math.round(n * 100) / 100
  return String(Math.abs(r) < 1e-9 ? 0 : r).replace('.', ',').replace('-', '−')
}

/** Tính toán vị trí, độ phóng đại, tính chất ảnh từ LensSpec. */
export function calcLens(spec: Pick<LensSpec, 'type' | 'f' | 'd' | 'h'>): LensCalc {
  if (!Number.isFinite(spec.f) || spec.f <= 0) throw new Error('Tiêu cự f phải lớn hơn 0')
  if (!Number.isFinite(spec.d) || spec.d <= 0) throw new Error('Khoảng cách vật d phải lớn hơn 0')
  const h = spec.h ?? 2
  if (!Number.isFinite(h) || h <= 0) throw new Error('Chiều cao vật h phải lớn hơn 0')

  const fAlg = spec.type === 'converging' ? spec.f : -spec.f
  const denom = spec.d - fAlg

  if (Math.abs(denom) <= 1e-9 * Math.max(1, spec.f)) {
    return {
      fAlg,
      d: spec.d,
      h,
      atInfinity: true,
      dPrime: null,
      k: null,
      hPrime: null,
      isReal: false,
      upright: true,
      farAway: false,
      summary: 'Ảnh ở vô cực (các tia ló song song)',
    }
  }

  const dPrime = (spec.d * fAlg) / denom
  const k = -dPrime / spec.d
  const hPrime = k * h
  const isReal = dPrime > 0
  const upright = k > 0
  const farAway = Math.abs(dPrime) > 6 * spec.f

  const absK = Math.abs(k)
  let sizeDesc: string
  if (Math.abs(absK - 1) < 1e-4) {
    sizeDesc = 'bằng vật'
  } else if (absK > 1) {
    sizeDesc = `lớn gấp ${fmtLensNum(absK)} lần vật`
  } else {
    sizeDesc = `nhỏ bằng ${fmtLensNum(absK)} lần vật`
  }

  const summary = `${isReal ? 'Ảnh thật' : 'Ảnh ảo'}, ${upright ? 'cùng chiều' : 'ngược chiều'}, ${sizeDesc}`

  return {
    fAlg,
    d: spec.d,
    h,
    atInfinity: false,
    dPrime,
    k,
    hPrime,
    isReal,
    upright,
    farAway,
    summary,
  }
}

export interface Point2D {
  x: number
  y: number
}

export interface RaySegment {
  ray: LensRay
  kind: 'real' | 'virtual'
  from: Point2D
  to: Point2D
  arrow: boolean
}

export interface LensGeometry {
  width: number
  height: number
  dir: 1 | -1
  calc: LensCalc
  y0: number
  xO: number
  lensTopY: number
  lensBotY: number
  A: Point2D
  B: Point2D
  F: Point2D
  FPrime: Point2D
  F2: Point2D
  F2Prime: Point2D
  APrime: Point2D | null
  BPrime: Point2D | null
  drawnImage: boolean
  segments: RaySegment[]
}

const CLIP_PAD_X = 16
const CLIP_PAD_TOP = 16

function clipRayT(
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): number {
  let tMax = Infinity
  if (Math.abs(dx) > 1e-9) {
    const tx = dx > 0 ? (maxX - x0) / dx : (minX - x0) / dx
    if (tx > 0) tMax = Math.min(tMax, tx)
  }
  if (Math.abs(dy) > 1e-9) {
    const ty = dy > 0 ? (maxY - y0) / dy : (minY - y0) / dy
    if (ty > 0) tMax = Math.min(tMax, ty)
  }
  return Number.isFinite(tMax) ? Math.max(0, tMax) : 0
}

/** Tính toán toạ độ điểm và các đoạn tia sáng trên khung SVG. */
export function computeLensGeometry(spec: LensSpec): LensGeometry {
  const calc = calcLens(spec)
  const dir: 1 | -1 = spec.objectSide === 'right' ? -1 : 1
  const rays: LensRay[] = spec.rays ? [...spec.rays] : ['parallel', 'center', 'focal']
  const hideImage = Boolean(spec.hideImage)

  const W = 520
  const H = spec.showValues ? 345 : 300
  const topArea = 34
  const botArea = spec.showValues ? 86 : 38
  const availHalfH = (H - topArea - botArea) / 2
  const y0 = topArea + availHalfH

  const xA_opt = -dir * calc.d
  const xF_opt = spec.type === 'converging' ? -dir * spec.f : dir * spec.f
  const xFPrime_opt = spec.type === 'converging' ? dir * spec.f : -dir * spec.f
  const drawnImage = !hideImage && !calc.atInfinity && !calc.farAway
  const xAPrime_opt = !calc.atInfinity ? dir * calc.dPrime! : null

  const xs = [0, xA_opt, xF_opt, xFPrime_opt]
  if (spec.show2F) xs.push(2 * xF_opt, 2 * xFPrime_opt)
  if (drawnImage && xAPrime_opt !== null) xs.push(xAPrime_opt)
  // Giữ khoảng trống hợp lí ở hai phía thấu kính
  xs.push(-dir * Math.max(spec.f * 1.35, calc.d * 0.45))
  xs.push(dir * Math.max(spec.f * 1.55, calc.d * 0.55))

  const minOptX = Math.min(...xs)
  const maxOptX = Math.max(...xs)
  const spanX = Math.max(maxOptX - minOptX, 1e-6)
  const padLeft = 42
  const padRight = 42
  const usableW = W - padLeft - padRight
  const scaleX = usableW / spanX
  const xO = padLeft + (0 - minOptX) * scaleX
  const X = (optX: number) => xO + optX * scaleX

  // Co giãn trục dọc sao cho vật, ảnh và độ cao thấu kính vừa khung
  const maxImgH = drawnImage ? Math.abs(calc.hPrime!) : 0
  const maxExtentY = Math.max(calc.h * 1.5, maxImgH * 1.28)
  const scaleY = (availHalfH - 12) / maxExtentY
  const hPx = calc.h * scaleY
  const hPrimePx = !calc.atInfinity ? calc.hPrime! * scaleY : null

  const maxRayYPx = Math.max(hPx, drawnImage && hPrimePx !== null ? Math.abs(hPrimePx) : 0)
  const lensHalfPx = Math.min(availHalfH - 8, Math.max(maxRayYPx + 16, hPx * 1.4, 70))
  const lensTopY = y0 - lensHalfPx
  const lensBotY = y0 + lensHalfPx

  const A: Point2D = { x: X(xA_opt), y: y0 }
  const B: Point2D = { x: X(xA_opt), y: y0 - hPx }
  const F: Point2D = { x: X(xF_opt), y: y0 }
  const FPrime: Point2D = { x: X(xFPrime_opt), y: y0 }
  const F2: Point2D = { x: X(2 * xF_opt), y: y0 }
  const F2Prime: Point2D = { x: X(2 * xFPrime_opt), y: y0 }
  const APrime: Point2D | null = xAPrime_opt !== null ? { x: X(xAPrime_opt), y: y0 } : null
  const BPrime: Point2D | null =
    xAPrime_opt !== null && hPrimePx !== null ? { x: X(xAPrime_opt), y: y0 - hPrimePx } : null

  const minX = CLIP_PAD_X
  const maxX = W - CLIP_PAD_X
  const minY = CLIP_PAD_TOP
  const maxY = H - botArea + 12

  const segments: RaySegment[] = []

  if (!hideImage) {
    // 1. Tia song song trục chính
    if (rays.includes('parallel')) {
      const I: Point2D = { x: xO, y: B.y }
      segments.push({ ray: 'parallel', kind: 'real', from: B, to: I, arrow: true })

      if (spec.type === 'converging') {
        const dx = FPrime.x - I.x
        const dy = FPrime.y - I.y
        const tMax = clipRayT(I.x, I.y, dx, dy, minX, maxX, minY, maxY)
        let tEnd = tMax
        if (drawnImage && calc.isReal && BPrime) {
          const tB = (BPrime.x - I.x) / dx
          tEnd = Math.min(tMax, tB + Math.min(0.35, 32 / Math.hypot(dx, dy)))
        }
        segments.push({
          ray: 'parallel',
          kind: 'real',
          from: I,
          to: { x: I.x + dx * tEnd, y: I.y + dy * tEnd },
          arrow: true,
        })

        // Tia ảo kéo dài ngược chiều truyền sáng
        if (!calc.atInfinity && !calc.isReal) {
          if (drawnImage && BPrime) {
            segments.push({ ray: 'parallel', kind: 'virtual', from: I, to: BPrime, arrow: false })
          } else if (calc.farAway) {
            const tBack = clipRayT(I.x, I.y, -dx, -dy, minX, maxX, minY, maxY)
            segments.push({
              ray: 'parallel',
              kind: 'virtual',
              from: I,
              to: { x: I.x - dx * tBack, y: I.y - dy * tBack },
              arrow: false,
            })
          }
        }
      } else {
        // Thấu kính phân kì: tia ló hướng ra xa trục chính, đường kéo dài qua F'
        const dx = I.x - FPrime.x
        const dy = I.y - FPrime.y
        const tMax = clipRayT(I.x, I.y, dx, dy, minX, maxX, minY, maxY)
        const tOut = Math.min(tMax, 130 / Math.hypot(dx, dy))
        segments.push({
          ray: 'parallel',
          kind: 'real',
          from: I,
          to: { x: I.x + dx * tOut, y: I.y + dy * tOut },
          arrow: true,
        })
        segments.push({ ray: 'parallel', kind: 'virtual', from: I, to: FPrime, arrow: false })
      }
    }

    // 2. Tia qua quang tâm O (truyền thẳng)
    if (rays.includes('center')) {
      const O: Point2D = { x: xO, y: y0 }
      const dx = O.x - B.x
      const dy = O.y - B.y
      segments.push({ ray: 'center', kind: 'real', from: B, to: O, arrow: true })

      const tMax = clipRayT(O.x, O.y, dx, dy, minX, maxX, minY, maxY)
      let tEnd = Math.min(tMax, 135 / Math.hypot(dx, dy))
      if (drawnImage && calc.isReal && BPrime) {
        const tB = (BPrime.x - O.x) / dx
        tEnd = Math.min(tMax, tB + Math.min(0.35, 32 / Math.hypot(dx, dy)))
      } else if (calc.atInfinity || calc.farAway) {
        tEnd = tMax
      }
      segments.push({
        ray: 'center',
        kind: 'real',
        from: O,
        to: { x: O.x + dx * tEnd, y: O.y + dy * tEnd },
        arrow: true,
      })

      if (!calc.atInfinity && !calc.isReal && spec.type === 'converging') {
        if (drawnImage && BPrime) {
          segments.push({ ray: 'center', kind: 'virtual', from: B, to: BPrime, arrow: false })
        } else if (calc.farAway) {
          const tBack = clipRayT(B.x, B.y, -dx, -dy, minX, maxX, minY, maxY)
          segments.push({
            ray: 'center',
            kind: 'virtual',
            from: B,
            to: { x: B.x - dx * tBack, y: B.y - dy * tBack },
            arrow: false,
          })
        }
      }
    }

    // 3. Tia qua tiêu điểm F → ló song song trục chính
    if (rays.includes('focal') && !calc.atInfinity) {
      const slopeBF = (F.y - B.y) / (F.x - B.x)
      const yJ = B.y + slopeBF * (xO - B.x)
      if (Math.abs(yJ - y0) <= lensHalfPx + 2) {
        const J: Point2D = { x: xO, y: yJ }
        segments.push({ ray: 'focal', kind: 'real', from: B, to: J, arrow: true })

        if (spec.type === 'converging' && calc.d < spec.f) {
          // Tia tới có đường kéo dài qua F nằm phía sau vật
          segments.push({ ray: 'focal', kind: 'virtual', from: B, to: F, arrow: false })
        } else if (spec.type === 'diverging') {
          // Tia tới hướng về tiêu điểm vật F ở sau thấu kính
          segments.push({ ray: 'focal', kind: 'virtual', from: J, to: F, arrow: false })
        }

        const tMaxOut = clipRayT(J.x, J.y, dir, 0, minX, maxX, minY, maxY)
        let outLen = Math.min(tMaxOut, 130)
        if (drawnImage && calc.isReal && BPrime) {
          outLen = Math.min(tMaxOut, Math.abs(BPrime.x - J.x) + 32)
        } else if (calc.farAway) {
          outLen = tMaxOut
        }
        segments.push({
          ray: 'focal',
          kind: 'real',
          from: J,
          to: { x: J.x + dir * outLen, y: J.y },
          arrow: true,
        })

        if (!calc.isReal) {
          if (drawnImage && BPrime) {
            segments.push({ ray: 'focal', kind: 'virtual', from: J, to: BPrime, arrow: false })
          } else if (calc.farAway) {
            const tBack = clipRayT(J.x, J.y, -dir, 0, minX, maxX, minY, maxY)
            segments.push({
              ray: 'focal',
              kind: 'virtual',
              from: J,
              to: { x: J.x - dir * tBack, y: J.y },
              arrow: false,
            })
          }
        }
      }
    }
  }

  return {
    width: W,
    height: H,
    dir,
    calc,
    y0,
    xO,
    lensTopY,
    lensBotY,
    A,
    B,
    F,
    FPrime,
    F2,
    F2Prime,
    APrime,
    BPrime,
    drawnImage,
    segments,
  }
}

function midArrowSvg(from: Point2D, to: Point2D): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len < 14) return ''
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI
  return `<path d="M-4 -2.8L4 0L-4 2.8z" fill="#111" transform="translate(${f1(mx)} ${f1(my)}) rotate(${f1(deg)})"/>`
}

function verticalArrowSvg(x: number, yStart: number, yTip: number, dashed: boolean): string {
  const dy = yTip - yStart
  if (Math.abs(dy) < 4) return ''
  const sign = dy > 0 ? 1 : -1
  const lineEnd = yTip - sign * 5
  const dashAttr = dashed ? ' stroke-dasharray="4 3"' : ''
  const deg = sign > 0 ? 90 : -90
  return (
    `<path d="M${f1(x)} ${f1(yStart)}L${f1(x)} ${f1(lineEnd)}" stroke="#111" stroke-width="1.9"${dashAttr}/>` +
    `<path d="M-6 -3.5L2 0L-6 3.5z" fill="#111" transform="translate(${f1(x)} ${f1(yTip - sign * 2)}) rotate(${deg})"/>`
  )
}

function lensSymbolSvg(type: LensType, x: number, yTop: number, yBot: number): string {
  const w = 5.5
  const h = 7
  let s = `<path d="M${f1(x)} ${f1(yTop)}V${f1(yBot)}" stroke="#111" stroke-width="1.8"/>`
  if (type === 'converging') {
    // Mũi tên hai đầu hướng ra ngoài
    s += `<path d="M${f1(x - w)} ${f1(yTop + h)}L${f1(x)} ${f1(yTop)}L${f1(x + w)} ${f1(yTop + h)}" fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`
    s += `<path d="M${f1(x - w)} ${f1(yBot - h)}L${f1(x)} ${f1(yBot)}L${f1(x + w)} ${f1(yBot - h)}" fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`
  } else {
    // Mũi tên hai đầu hướng vào trong
    s += `<path d="M${f1(x - w)} ${f1(yTop - h)}L${f1(x)} ${f1(yTop)}L${f1(x + w)} ${f1(yTop - h)}" fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`
    s += `<path d="M${f1(x - w)} ${f1(yBot + h)}L${f1(x)} ${f1(yBot)}L${f1(x + w)} ${f1(yBot + h)}" fill="none" stroke="#111" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`
  }
  return s
}

function dimBarSvg(x1: number, x2: number, y: number, yAxis: number, label: string): string {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  if (right - left < 4) return ''
  let s = ''
  s += `<path d="M${f1(left)} ${f1(yAxis + 4)}V${f1(y + 4)}M${f1(right)} ${f1(yAxis + 4)}V${f1(y + 4)}" stroke="#888" stroke-width="0.7" stroke-dasharray="2 2"/>`
  s += `<path d="M${f1(left + 3)} ${f1(y)}H${f1(right - 3)}" stroke="#444" stroke-width="1"/>`
  s += `<path d="M${f1(left + 5)} ${f1(y - 2.5)}L${f1(left)} ${f1(y)}L${f1(left + 5)} ${f1(y + 2.5)}z" fill="#444"/>`
  s += `<path d="M${f1(right - 5)} ${f1(y - 2.5)}L${f1(right)} ${f1(y)}L${f1(right - 5)} ${f1(y + 2.5)}z" fill="#444"/>`
  s += `<text x="${f1((left + right) / 2)}" y="${f1(y + 4)}" ${FAM} font-size="12" fill="#222" text-anchor="middle">${esc(label)}</text>`
  return s
}

/** Vẽ SVG sơ đồ tạo ảnh qua thấu kính mỏng. */
export function renderLensSvg(spec: LensSpec, desc: string): { svg: string; width: number; height: number } {
  const g = computeLensGeometry(spec)
  const { width: W, height: H, y0, xO, lensTopY, lensBotY, A, B, F, FPrime, F2, F2Prime, APrime, BPrime, drawnImage, calc } = g

  const names = {
    A: spec.names?.A?.trim() || 'A',
    B: spec.names?.B?.trim() || 'B',
    APrime: spec.names?.APrime?.trim() || 'A′',
    BPrime: spec.names?.BPrime?.trim() || 'B′',
    O: spec.names?.O?.trim() || 'O',
    F: spec.names?.F?.trim() || 'F',
    FPrime: spec.names?.FPrime?.trim() || 'F′',
  }

  let body = ''

  // 1. Trục chính nằm ngang
  body += `<path d="M12 ${f1(y0)}H${W - 12}" stroke="#111" stroke-width="1.1"/>`

  // 2. Thấu kính
  body += lensSymbolSvg(spec.type, xO, lensTopY, lensBotY)

  // 3. Các điểm tiêu cự trên trục chính
  const focalTicks: Array<{ x: number; label: string }> = [
    { x: F.x, label: names.F },
    { x: FPrime.x, label: names.FPrime },
  ]
  if (spec.show2F) {
    focalTicks.push({ x: F2.x, label: `2${names.F}` }, { x: F2Prime.x, label: `2${names.FPrime}` })
  }
  for (const pt of focalTicks) {
    body += `<circle cx="${f1(pt.x)}" cy="${f1(y0)}" r="2.2" fill="#111"/>`
  }

  // 4. Các tia sáng (nét liền có mũi tên giữa tia; đường kéo dài ảo nét đứt không mũi tên)
  for (const seg of g.segments) {
    const dash = seg.kind === 'virtual' ? ' stroke-dasharray="4 3"' : ''
    const sw = seg.kind === 'virtual' ? '1.15' : '1.3'
    body += `<path data-ray="${seg.ray}" data-kind="${seg.kind}" d="M${f1(seg.from.x)} ${f1(seg.from.y)}L${f1(seg.to.x)} ${f1(seg.to.y)}" fill="none" stroke="#111" stroke-width="${sw}"${dash}/>`
    if (seg.arrow && seg.kind === 'real') {
      body += midArrowSvg(seg.from, seg.to)
    }
  }

  // 5. Vật AB và ảnh A'B'
  body += verticalArrowSvg(A.x, A.y, B.y, false)
  if (drawnImage && APrime && BPrime) {
    body += verticalArrowSvg(APrime.x, APrime.y, BPrime.y, !calc.isReal)
  }

  // 6. Đặt nhãn trục chính tránh đè nhau
  interface AxisLabel {
    x: number
    text: string
    side: 'above' | 'below'
    anchor?: 'start' | 'middle' | 'end'
    dx?: number
  }
  const axisLabels: AxisLabel[] = [
    { x: xO, text: names.O, side: 'below', anchor: g.dir === 1 ? 'end' : 'start', dx: g.dir === 1 ? -5 : 5 },
    { x: A.x, text: names.A, side: 'below', anchor: 'middle' },
  ]
  for (const pt of focalTicks) {
    axisLabels.push({ x: pt.x, text: pt.label, side: 'below', anchor: 'middle' })
  }
  if (drawnImage && APrime && BPrime) {
    axisLabels.push({
      x: APrime.x,
      text: names.APrime,
      side: calc.upright ? 'below' : 'above',
      anchor: 'middle',
    })
  }

  const placedBelow: number[] = []
  const placedAbove: number[] = []
  for (const lbl of axisLabels) {
    const px = lbl.x + (lbl.dx ?? 0)
    if (lbl.side === 'below') {
      const overlaps = placedBelow.filter((ox) => Math.abs(ox - px) < 17).length
      placedBelow.push(px)
      const ly = y0 + 16 + overlaps * 14
      body += `<text x="${f1(px)}" y="${f1(ly)}" ${FAM} font-size="14" font-style="italic" text-anchor="${lbl.anchor ?? 'middle'}">${esc(lbl.text)}</text>`
    } else {
      const overlaps = placedAbove.filter((ox) => Math.abs(ox - px) < 17).length
      placedAbove.push(px)
      const ly = y0 - 8 - overlaps * 14
      body += `<text x="${f1(px)}" y="${f1(ly)}" ${FAM} font-size="14" font-style="italic" text-anchor="${lbl.anchor ?? 'middle'}">${esc(lbl.text)}</text>`
    }
  }

  // Nhãn ngọn vật B và ảnh B'
  body += `<text x="${f1(B.x)}" y="${f1(B.y - 8)}" ${FAM} font-size="14" font-style="italic" text-anchor="middle">${esc(names.B)}</text>`
  if (drawnImage && BPrime) {
    const bPrimeY = calc.upright ? BPrime.y - 8 : BPrime.y + 16
    body += `<text x="${f1(BPrime.x)}" y="${f1(bPrimeY)}" ${FAM} font-size="14" font-style="italic" text-anchor="middle">${esc(names.BPrime)}</text>`
  }

  // 7. Ghi chú vô cực hoặc ở xa
  if (!spec.hideImage) {
    if (calc.atInfinity) {
      const tx = g.dir === 1 ? W - 18 : 18
      const anchor = g.dir === 1 ? 'end' : 'start'
      body += `<text x="${tx}" y="${f1(y0 - 10)}" ${FAM} font-size="13" font-style="italic" fill="#333" text-anchor="${anchor}">ảnh ở vô cực</text>`
    } else if (calc.farAway) {
      const sideDir = calc.isReal ? g.dir : -g.dir
      const tx = sideDir === 1 ? W - 18 : 18
      const anchor = sideDir === 1 ? 'end' : 'start'
      body += `<text x="${tx}" y="${f1(y0 - 10)}" ${FAM} font-size="13" font-style="italic" fill="#333" text-anchor="${anchor}">ảnh ở xa</text>`
    }
  }

  // 8. Kích thước f, d, d'
  if (spec.showValues) {
    const fTargetX = spec.type === 'converging' ? FPrime.x : FPrime.x
    body += dimBarSvg(xO, fTargetX, H - 56, y0, `f = ${fmtLensNum(spec.f)} cm`)
    body += dimBarSvg(A.x, xO, H - 36, y0, `d = ${fmtLensNum(calc.d)} cm`)
    if (drawnImage && APrime) {
      body += dimBarSvg(xO, APrime.x, H - 16, y0, `d′ = ${fmtLensNum(calc.dPrime!)} cm`)
    }
  }

  return wrap(W, H, desc, body)
}
