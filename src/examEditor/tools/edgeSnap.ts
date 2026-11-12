/**
 * Toán học hít/gióng (snap) và cập nhật lệnh toạ độ khi kéo nút đầu cạnh.
 * Tách riêng thành module thuần để dễ dùng lại và kiểm thử bằng `tsx`.
 */

export type Pt = { x: number; y: number }

export interface PickPt {
  name: string
  x: number
  y: number
  v: number[]
}

export interface CoordXform {
  scale: number
  toVb: (v: [number, number]) => Pt
  toReal: (p: Pt) => [number, number]
}

export interface SnapResult {
  vb: Pt
  real: [number, number]
  snapped: boolean
  guides: Array<{ x1: number; y1: number; x2: number; y2: number }>
  rightMarks: Array<{ at: Pt; u: Pt; v: Pt }>
  readouts: string[]
}

export function fitCoordTransform(points: PickPt[]): CoordXform {
  let bestI = -1
  let bestJ = -1
  let bestDistV = 0
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dv = Math.hypot(points[j].v[0] - points[i].v[0], points[j].v[1] - points[i].v[1])
      if (dv > bestDistV) {
        bestDistV = dv
        bestI = i
        bestJ = j
      }
    }
  }
  let sx = 50
  let sy = -50
  let x0 = 0
  let y0 = 0
  if (bestI >= 0 && bestDistV > 1e-6) {
    const p1 = points[bestI]
    const p2 = points[bestJ]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dvx = p2.v[0] - p1.v[0]
    const dvy = p2.v[1] - p1.v[1]
    const scale = Math.hypot(dx, dy) / bestDistV
    sx = Math.abs(dvx) > 1e-6 && dx * dvx < 0 ? -scale : scale
    sy = Math.abs(dvy) > 1e-6 && dy * dvy > 0 ? scale : -scale
    x0 = p1.x - sx * p1.v[0]
    y0 = p1.y - sy * p1.v[1]
  } else if (points.length >= 1) {
    const p = points[0]
    x0 = p.x - sx * p.v[0]
    y0 = p.y - sy * p.v[1]
  }
  const scale = Math.abs(sx)
  return {
    scale,
    toVb: ([vx, vy]) => ({ x: x0 + sx * vx, y: y0 + sy * vy }),
    toReal: (p) => [(p.x - x0) / sx, (p.y - y0) / sy],
  }
}

type LineCand = {
  p0: Pt
  dir: Pt
  dist: number
  kind: 'align' | 'angle15' | 'right90' | 'ext'
  rightMark?: { at: Pt; u: Pt }
}

type CircleCand = {
  center: Pt
  rad: number
  dist: number
  kind: 'right90_at_p' | 'len'
  q1?: Pt
  q2?: Pt
}

const distPt = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

function distPointToLine(p: Pt, l: { p0: Pt; dir: Pt }): number {
  return Math.abs((p.x - l.p0.x) * -l.dir.y + (p.y - l.p0.y) * l.dir.x)
}

function projPointOnLine(p: Pt, l: { p0: Pt; dir: Pt }): Pt {
  const t = (p.x - l.p0.x) * l.dir.x + (p.y - l.p0.y) * l.dir.y
  return { x: l.p0.x + t * l.dir.x, y: l.p0.y + t * l.dir.y }
}

function intersectLines(a: { p0: Pt; dir: Pt }, b: { p0: Pt; dir: Pt }): Pt | null {
  const det = a.dir.x * -b.dir.y - a.dir.y * -b.dir.x
  if (Math.abs(det) < 1e-6) return null
  const wx = b.p0.x - a.p0.x
  const wy = b.p0.y - a.p0.y
  const s = (wx * -b.dir.y - wy * -b.dir.x) / det
  return { x: a.p0.x + s * a.dir.x, y: a.p0.y + s * a.dir.y }
}

function intersectLineCircle(l: { p0: Pt; dir: Pt }, c: Pt, r: number, near: Pt): Pt | null {
  const fx = l.p0.x - c.x
  const fy = l.p0.y - c.y
  const b = fx * l.dir.x + fy * l.dir.y
  const disc = b * b - (fx * fx + fy * fy - r * r)
  if (disc < -1e-6) return null
  const sq = Math.sqrt(Math.max(0, disc))
  const p1 = { x: l.p0.x + (-b + sq) * l.dir.x, y: l.p0.y + (-b + sq) * l.dir.y }
  const p2 = { x: l.p0.x + (-b - sq) * l.dir.x, y: l.p0.y + (-b - sq) * l.dir.y }
  return distPt(p1, near) <= distPt(p2, near) ? p1 : p2
}

function intersectCircles(c1: Pt, r1: number, c2: Pt, r2: number, near: Pt): Pt | null {
  const d = distPt(c1, c2)
  if (d < 1e-6 || d > r1 + r2 + 1e-6 || d < Math.abs(r1 - r2) - 1e-6) return null
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
  const ux = (c2.x - c1.x) / d
  const uy = (c2.y - c1.y) / d
  const mx = c1.x + a * ux
  const my = c1.y + a * uy
  const p1 = { x: mx - h * uy, y: my + h * ux }
  const p2 = { x: mx + h * uy, y: my - h * ux }
  return distPt(p1, near) <= distPt(p2, near) ? p1 : p2
}

function clipLineToBox(
  p0: Pt,
  dir: Pt,
  vb: { minX: number; minY: number; w: number; h: number },
): { x1: number; y1: number; x2: number; y2: number } | null {
  const xMin = vb.minX
  const xMax = vb.minX + vb.w
  const yMin = vb.minY
  const yMax = vb.minY + vb.h
  const ts: number[] = []
  if (Math.abs(dir.x) > 1e-7) {
    for (const bx of [xMin, xMax]) {
      const t = (bx - p0.x) / dir.x
      const y = p0.y + t * dir.y
      if (y >= yMin - 1e-3 && y <= yMax + 1e-3) ts.push(t)
    }
  }
  if (Math.abs(dir.y) > 1e-7) {
    for (const by of [yMin, yMax]) {
      const t = (by - p0.y) / dir.y
      const x = p0.x + t * dir.x
      if (x >= xMin - 1e-3 && x <= xMax + 1e-3) ts.push(t)
    }
  }
  if (ts.length < 2) return null
  const t0 = Math.min(...ts)
  const t1 = Math.max(...ts)
  if (t1 - t0 < 1e-3) return null
  return {
    x1: p0.x + t0 * dir.x,
    y1: p0.y + t0 * dir.y,
    x2: p0.x + t1 * dir.x,
    y2: p0.y + t1 * dir.y,
  }
}

export function snapDragPoint({
  dragName,
  rawVb,
  points,
  segs,
  xform,
  pxSize,
  altKey,
  viewBox,
}: {
  dragName: string
  rawVb: Pt
  points: PickPt[]
  segs: Array<{ a: string; b: string }>
  xform: CoordXform
  pxSize: number
  altKey: boolean
  viewBox: { minX: number; minY: number; w: number; h: number }
}): SnapResult {
  const ptMap = new Map(points.map((p) => [p.name, p]))
  // cạnh kề (không trùng)
  const adj = new Map<string, Set<string>>()
  const edgeNames = new Map<string, string>()
  const uniqueSegs: Array<{ a: string; b: string }> = []
  const seenSeg = new Set<string>()
  for (const s of segs) {
    if (s.a === s.b || !ptMap.has(s.a) || !ptMap.has(s.b)) continue
    const key = s.a < s.b ? `${s.a}\0${s.b}` : `${s.b}\0${s.a}`
    if (!seenSeg.has(key)) {
      seenSeg.add(key)
      uniqueSegs.push(s)
    }
    if (!adj.has(s.a)) adj.set(s.a, new Set())
    if (!adj.has(s.b)) adj.set(s.b, new Set())
    adj.get(s.a)!.add(s.b)
    adj.get(s.b)!.add(s.a)
    edgeNames.set(key, `${s.a}${s.b}`)
  }

  const neighbors = [...(adj.get(dragName) ?? [])]
  let finalVb: Pt = rawVb
  let snapped = false
  const guides: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  const rightMarks: Array<{ at: Pt; u: Pt; v: Pt }> = []

  if (!altKey) {
    const T = 6 * pxSize
    const lines: LineCand[] = []
    const circles: CircleCand[] = []
    const rawReal = xform.toReal(rawVb)

    // 1. Thẳng hàng ngang / dọc với nút khác
    for (const o of points) {
      if (o.name === dragName) continue
      const dy = Math.abs(rawVb.y - o.y)
      if (dy < T) lines.push({ p0: o, dir: { x: 1, y: 0 }, dist: dy, kind: 'align' })
      const dx = Math.abs(rawVb.x - o.x)
      if (dx < T) lines.push({ p0: o, dir: { x: 0, y: 1 }, dist: dx, kind: 'align' })
    }

    // 2. Góc cạnh tròn 15° (bao gồm 0° ngang, 90° đứng)
    for (const qn of neighbors) {
      const Q = ptMap.get(qn)!
      const dx = rawVb.x - Q.x
      const dy = rawVb.y - Q.y
      const r = Math.hypot(dx, dy)
      if (r <= 10 * pxSize) continue
      const ang = Math.atan2(dy, dx)
      const step = Math.PI / 12
      const snapAng = Math.round(ang / step) * step
      const dir = { x: Math.cos(snapAng), y: Math.sin(snapAng) }
      const d = Math.abs(dx * -dir.y + dy * dir.x)
      if (d < T && dx * dir.x + dy * dir.y > 0) {
        lines.push({ p0: Q, dir, dist: d, kind: 'angle15' })
      }
    }

    // 3a. Góc giữa hai cạnh tại nút kề Q gần 90°
    for (const qn of neighbors) {
      const Q = ptMap.get(qn)!
      if (distPt(rawVb, Q) <= 10 * pxSize) continue
      for (const rn of adj.get(qn) ?? []) {
        if (rn === dragName) continue
        const R = ptMap.get(rn)!
        const l = Math.hypot(R.x - Q.x, R.y - Q.y)
        if (l < 1e-6) continue
        const ux = (R.x - Q.x) / l
        const uy = (R.y - Q.y) / l
        const d = Math.abs((rawVb.x - Q.x) * ux + (rawVb.y - Q.y) * uy)
        if (d < T) {
          lines.push({
            p0: Q,
            dir: { x: -uy, y: ux },
            dist: d,
            kind: 'right90',
            rightMark: { at: Q, u: R },
          })
        }
      }
    }

    // 4. Nằm trên đường kéo dài của một cạnh khác
    for (const s of uniqueSegs) {
      if (s.a === dragName || s.b === dragName) continue
      const U = ptMap.get(s.a)!
      const V = ptMap.get(s.b)!
      const l = Math.hypot(V.x - U.x, V.y - U.y)
      if (l < 1e-6) continue
      const dir = { x: (V.x - U.x) / l, y: (V.y - U.y) / l }
      const d = Math.abs((rawVb.x - U.x) * -dir.y + (rawVb.y - U.y) * dir.x)
      if (d < T) lines.push({ p0: U, dir, dist: d, kind: 'ext' })
    }

    // 3b. Góc giữa hai cạnh tại chính nút đang kéo gần 90°
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const Q1 = ptMap.get(neighbors[i])!
        const Q2 = ptMap.get(neighbors[j])!
        const c = { x: (Q1.x + Q2.x) / 2, y: (Q1.y + Q2.y) / 2 }
        const rad = distPt(Q1, Q2) / 2
        if (rad <= 6 * pxSize) continue
        if (distPt(rawVb, Q1) <= 10 * pxSize || distPt(rawVb, Q2) <= 10 * pxSize) continue
        const d = Math.abs(distPt(rawVb, c) - rad)
        if (d < T) circles.push({ center: c, rad, dist: d, kind: 'right90_at_p', q1: Q1, q2: Q2 })
      }
    }

    // 5. Độ dài cạnh gần số nguyên hoặc bội 0,5
    for (const qn of neighbors) {
      const Q = ptMap.get(qn)!
      const rReal = Math.hypot(rawReal[0] - Q.v[0], rawReal[1] - Q.v[1])
      const rSnap = Math.round(rReal * 2) / 2
      if (rSnap <= 0) continue
      const rad = rSnap * xform.scale
      const d = Math.abs(distPt(rawVb, Q) - rad)
      if (d < T) circles.push({ center: Q, rad, dist: d, kind: 'len' })
    }

    lines.sort((a, b) => a.dist - b.dist)
    circles.sort((a, b) => (a.kind !== b.kind ? (a.kind === 'right90_at_p' ? -1 : 1) : a.dist - b.dist))

    if (lines.length) {
      const L1 = lines[0]
      let solved: Pt | null = null
      for (let i = 1; i < lines.length; i++) {
        const L2 = lines[i]
        if (Math.abs(L1.dir.x * L2.dir.y - L1.dir.y * L2.dir.x) <= 0.15) continue
        const hit = intersectLines(L1, L2)
        if (hit && distPt(hit, rawVb) < 1.6 * T) {
          solved = hit
          break
        }
      }
      if (!solved) {
        const proj = projPointOnLine(rawVb, L1)
        for (const C of circles) {
          const hit = intersectLineCircle(L1, C.center, C.rad, proj)
          if (hit && distPt(hit, proj) < 1.6 * T) {
            solved = hit
            break
          }
        }
        solved = solved ?? proj
      }
      finalVb = solved
      snapped = true
    } else if (circles.length) {
      const C1 = circles[0]
      const r = distPt(rawVb, C1.center) || 1
      let solved: Pt = {
        x: C1.center.x + ((rawVb.x - C1.center.x) / r) * C1.rad,
        y: C1.center.y + ((rawVb.y - C1.center.y) / r) * C1.rad,
      }
      if (C1.kind === 'right90_at_p') {
        for (let i = 1; i < circles.length; i++) {
          const C2 = circles[i]
          const hit = intersectCircles(C1.center, C1.rad, C2.center, C2.rad, solved)
          if (hit && distPt(hit, solved) < 1.6 * T) {
            solved = hit
            break
          }
        }
      }
      finalVb = solved
      snapped = true
    }

    // gom đường gióng + góc vuông tạm đang khớp với vị trí cuối
    const tol = 0.75 * pxSize
    const seenGuide = new Set<string>()
    const seenRight = new Set<string>()
    for (const l of lines) {
      if (distPointToLine(finalVb, l) > tol) continue
      const segClip = clipLineToBox(l.p0, l.dir, viewBox)
      if (segClip) {
        const pA = `${Math.round(segClip.x1)}:${Math.round(segClip.y1)}`
        const pB = `${Math.round(segClip.x2)}:${Math.round(segClip.y2)}`
        const gk = pA < pB ? `${pA}|${pB}` : `${pB}|${pA}`
        if (!seenGuide.has(gk)) {
          seenGuide.add(gk)
          guides.push(segClip)
        }
      }
      if (l.rightMark) {
        const rk = `${Math.round(l.rightMark.at.x)}:${Math.round(l.rightMark.at.y)}`
        if (!seenRight.has(rk)) {
          seenRight.add(rk)
          rightMarks.push({ at: l.rightMark.at, u: l.rightMark.u, v: finalVb })
        }
      }
    }
    for (const c of circles) {
      if (c.kind !== 'right90_at_p' || !c.q1 || !c.q2) continue
      if (Math.abs(distPt(finalVb, c.center) - c.rad) > tol) continue
      rightMarks.push({ at: finalVb, u: c.q1, v: c.q2 })
    }
  }

  const finalReal = xform.toReal(finalVb)
  const readouts: string[] = []
  for (const qn of neighbors) {
    const Q = ptMap.get(qn)!
    const dx = finalReal[0] - Q.v[0]
    const dy = finalReal[1] - Q.v[1]
    const lenStr = Math.hypot(dx, dy).toFixed(2).replace('.', ',')
    let deg = ((Math.atan2(dy, dx) * 180) / Math.PI) % 180
    if (deg < 0) deg += 180
    let degInt = Math.round(deg)
    if (degInt === 180) degInt = 0
    const key = dragName < qn ? `${dragName}\0${qn}` : `${qn}\0${dragName}`
    const segLabel = edgeNames.get(key) ?? `${dragName}${qn}`
    readouts.push(`${segLabel} = ${lenStr} · ${degInt}°`)
  }
  if (!readouts.length) {
    readouts.push(`${dragName}(${fmtCoord(finalReal[0], snapped)}; ${fmtCoord(finalReal[1], snapped)})`)
  }

  return { vb: finalVb, real: finalReal, snapped, guides, rightMarks, readouts }
}

export function fmtCoord(n: number, snapped: boolean): string {
  const factor = snapped ? 100 : 10
  let r = Math.round(n * factor) / factor
  if (snapped && Math.abs(r - Math.round(r * 10) / 10) < 0.005) {
    r = Math.round(r * 10) / 10
  }
  if (Math.abs(r) < 1e-9) r = 0
  return String(r).replace('.', ',')
}

const DRAG_MARK_RE = /\s*\/\/\s*kéo\s*$/i
const COORD_HEAD = /^[A-Z][0-9]*'*\s*(?:=\s*)?\(/

export function hasDragCoords(extras: string): boolean {
  return extras.split('\n').some((l) => DRAG_MARK_RE.test(l))
}

export function resetDragCoords(extras: string): string {
  return extras
    .split('\n')
    .filter((l) => !DRAG_MARK_RE.test(l))
    .join('\n')
}

export function savePointCoord(extras: string, name: string, x: number, y: number, snapped: boolean): string {
  const pair = `${fmtCoord(x, snapped)}; ${fmtCoord(y, snapped)}`
  const lines = extras ? extras.split('\n') : []
  const escName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const itemRe = new RegExp(`(^|[\\s,;])(${escName}\\s*(?:=\\s*)?)\\([^()]*\\)`, 'g')
  for (let i = lines.length - 1; i >= 0; i--) {
    const clean = lines[i].replace(/[′’]/g, "'").replace(DRAG_MARK_RE, '').trim()
    if (!COORD_HEAD.test(clean)) continue
    let lastMatch: RegExpExecArray | null = null
    itemRe.lastIndex = 0
    for (const m of lines[i].matchAll(itemRe)) lastMatch = m
    if (lastMatch && lastMatch.index !== undefined) {
      const idx = lastMatch.index
      const before = lines[i].slice(0, idx)
      const after = lines[i].slice(idx + lastMatch[0].length)
      lines[i] = `${before}${lastMatch[1]}${lastMatch[2]}(${pair})${after}`
      return lines.join('\n')
    }
  }
  const newLine = `${name}(${pair}) // kéo`
  return extras.trim() ? `${newLine}\n${extras}` : newLine
}
