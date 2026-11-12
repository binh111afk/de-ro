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

function buildEdgeGraph(points: PickPt[], segs: Array<{ a: string; b: string }>) {
  const ptMap = new Map(points.map((p) => [p.name, p]))
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
  return { ptMap, adj, edgeNames, uniqueSegs }
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
  const { ptMap, adj, edgeNames, uniqueSegs } = buildEdgeGraph(points, segs)

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

function fmtKeep(n: number): string {
  let r = Math.round(n * 1000) / 1000
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

function upsertCoordInExtras(extras: string, name: string, tuple: string): string {
  const lines = extras ? extras.split('\n') : []
  const escName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['′’]")
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
      lines[i] = `${before}${lastMatch[1]}${lastMatch[2]}(${tuple})${after}`
      return lines.join('\n')
    }
  }
  const newLine = `${name}(${tuple}) // kéo`
  return extras.trim() ? `${newLine}\n${extras}` : newLine
}

export function savePointCoord(extras: string, name: string, x: number, y: number, snapped: boolean): string {
  return upsertCoordInExtras(extras, name, `${fmtCoord(x, snapped)}; ${fmtCoord(y, snapped)}`)
}

/* ------------------------------------------------------------------ *
 * Hình không gian (3D): phép chiếu xiên, kéo ngang / đứng (Shift), liên kết đỉnh, hít
 * ------------------------------------------------------------------ */

export type P3 = [number, number, number]

export interface CoordXform3d {
  scale: number
  c: number
  s: number
  x0: number
  y0: number
  toVb: (v: P3) => Pt
  toRealHoriz: (p: Pt, z: number) => P3
}

export interface Drag3dBehavior {
  allowVert: boolean
  linked: string[]
  baseSpecials: boolean
  followFoot?: { foot: string; apex: string }
}

export interface Snap3dResult {
  vb: Pt
  real: P3
  snapped: boolean
  mode: 'horiz' | 'vert'
  guides: Array<{ x1: number; y1: number; x2: number; y2: number }>
  moved: Map<string, { vb: Pt; real: P3 }>
  savePoints: Array<{ name: string; real: P3; orig: P3 }>
  readouts: string[]
}

const K3D = 0.5
const ANG3D = Math.PI / 4

export function fitCoordTransform3d(points: PickPt[]): CoordXform3d {
  const c = K3D * Math.cos(ANG3D)
  const s = K3D * Math.sin(ANG3D)
  const projUnit = (v: number[]): [number, number] => [v[0] + c * v[1], -(v[2] ?? 0) - s * v[1]]

  let bestI = -1
  let bestJ = -1
  let bestDistU = 0
  for (let i = 0; i < points.length; i++) {
    const ui = projUnit(points[i].v)
    for (let j = i + 1; j < points.length; j++) {
      const uj = projUnit(points[j].v)
      const du = Math.hypot(uj[0] - ui[0], uj[1] - ui[1])
      if (du > bestDistU) {
        bestDistU = du
        bestI = i
        bestJ = j
      }
    }
  }
  let scale = 120
  let x0 = 0
  let y0 = 0
  if (bestI >= 0 && bestDistU > 1e-6) {
    const p1 = points[bestI]
    const p2 = points[bestJ]
    const u1 = projUnit(p1.v)
    scale = Math.hypot(p2.x - p1.x, p2.y - p1.y) / bestDistU
    x0 = p1.x - scale * u1[0]
    y0 = p1.y - scale * u1[1]
  } else if (points.length >= 1) {
    const p = points[0]
    const u = projUnit(p.v)
    x0 = p.x - scale * u[0]
    y0 = p.y - scale * u[1]
  }
  return {
    scale,
    c,
    s,
    x0,
    y0,
    toVb: ([vx, vy, vz]) => ({ x: x0 + scale * (vx + c * vy), y: y0 - scale * (vz + s * vy) }),
    toRealHoriz: (p, z) => {
      const vy = ((y0 - p.y) / scale - z) / s
      const vx = (p.x - x0) / scale - c * vy
      return [vx, vy, z]
    },
  }
}

export function getDrag3dBehavior({
  dragName,
  base,
  top,
  footOf,
}: {
  dragName: string
  base?: string[]
  top?: string[]
  footOf?: { foot: string; apex: string }
}): Drag3dBehavior {
  const baseIdx = base ? base.indexOf(dragName) : -1
  if (baseIdx >= 0) {
    return {
      allowVert: false,
      linked: top && top[baseIdx] ? [top[baseIdx]] : [],
      baseSpecials: false,
    }
  }
  if (top && top.includes(dragName)) {
    return {
      allowVert: true,
      linked: top.filter((n) => n !== dragName),
      baseSpecials: true,
    }
  }
  return {
    allowVert: true,
    linked: [],
    baseSpecials: Boolean(base && base.length >= 3),
    followFoot: footOf && footOf.apex === dragName ? footOf : undefined,
  }
}

function cross3(a: P3, b: P3): P3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function sub3(a: P3, b: P3): P3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function dot3(a: P3, b: P3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function footPlane3(p: P3, a: P3, b: P3, c: P3): P3 {
  const n = cross3(sub3(b, a), sub3(c, a))
  const nn = dot3(n, n)
  if (nn < 1e-12) return [p[0], p[1], a[2]]
  const t = dot3(sub3(p, a), n) / nn
  return [p[0] - n[0] * t, p[1] - n[1] * t, p[2] - n[2] * t]
}

function intersectCoplanar3(a: P3, b: P3, c: P3, d: P3): P3 | null {
  const u = sub3(b, a)
  const v = sub3(d, c)
  const w = sub3(c, a)
  const uu = dot3(u, u)
  const uv = dot3(u, v)
  const vv = dot3(v, v)
  const den = uu * vv - uv * uv
  if (Math.abs(den) < 1e-9 * uu * vv) return null
  const s = (dot3(w, u) * vv - dot3(w, v) * uv) / den
  const t = (dot3(w, u) * uv - dot3(w, v) * uu) / den
  const p1: P3 = [a[0] + s * u[0], a[1] + s * u[1], a[2] + s * u[2]]
  const p2: P3 = [c[0] + t * v[0], c[1] + t * v[1], c[2] + t * v[2]]
  if (Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]) > 1e-4) return null
  return p1
}

function computeBaseSpecials(base: string[], ptMap: Map<string, PickPt>): P3[] {
  const vs = base.map((n) => ptMap.get(n)?.v as P3 | undefined).filter((v): v is P3 => Boolean(v && v.length >= 3))
  if (vs.length < 3) return []
  const raw: P3[] = [...vs]
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i]
    const b = vs[(i + 1) % vs.length]
    raw.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2])
  }
  if (vs.length === 3) {
    raw.push([(vs[0][0] + vs[1][0] + vs[2][0]) / 3, (vs[0][1] + vs[1][1] + vs[2][1]) / 3, (vs[0][2] + vs[1][2] + vs[2][2]) / 3])
  } else if (vs.length === 4) {
    const diag = intersectCoplanar3(vs[0], vs[2], vs[1], vs[3])
    if (diag) raw.push(diag)
    raw.push([
      (vs[0][0] + vs[1][0] + vs[2][0] + vs[3][0]) / 4,
      (vs[0][1] + vs[1][1] + vs[2][1] + vs[3][1]) / 4,
      (vs[0][2] + vs[1][2] + vs[2][2] + vs[3][2]) / 4,
    ])
  }
  const out: P3[] = []
  for (const p of raw) {
    if (!out.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-5)) out.push(p)
  }
  return out
}

export function snapDragPoint3d({
  dragName,
  rawReal,
  mode,
  points,
  segs,
  origins,
  base,
  top,
  footOf,
  xform,
  pxSize,
  altKey,
  viewBox,
}: {
  dragName: string
  rawReal: P3
  mode: 'horiz' | 'vert'
  points: PickPt[]
  segs: Array<{ a: string; b: string }>
  origins?: string[]
  base?: string[]
  top?: string[]
  footOf?: { foot: string; apex: string }
  xform: CoordXform3d
  pxSize: number
  altKey: boolean
  viewBox: { minX: number; minY: number; w: number; h: number }
}): Snap3dResult {
  const { ptMap, adj, edgeNames } = buildEdgeGraph(points, segs)
  const neighbors = [...(adj.get(dragName) ?? [])]
  const behavior = getDrag3dBehavior({ dragName, base, top, footOf })
  const effMode: 'horiz' | 'vert' = behavior.allowVert && mode === 'vert' ? 'vert' : 'horiz'
  const excluded = new Set<string>([dragName, ...behavior.linked, ...(behavior.followFoot ? [behavior.followFoot.foot] : [])])
  const visibleNames = new Set<string>([...(origins ?? []), ...segs.flatMap((s) => [s.a, s.b])])
  const visiblePts = points.filter((p) => !excluded.has(p.name) && visibleNames.has(p.name))

  const rawVb = xform.toVb(rawReal)
  let finalReal: P3 = [...rawReal] as P3
  let finalVb: Pt = rawVb
  let snapped = false
  const guides: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
  const seenGuide = new Set<string>()
  const pushGuide = (g: { x1: number; y1: number; x2: number; y2: number } | null) => {
    if (!g || Math.hypot(g.x2 - g.x1, g.y2 - g.y1) < 1) return
    const pA = `${Math.round(g.x1)}:${Math.round(g.y1)}`
    const pB = `${Math.round(g.x2)}:${Math.round(g.y2)}`
    const k = pA < pB ? `${pA}|${pB}` : `${pB}|${pA}`
    if (!seenGuide.has(k)) {
      seenGuide.add(k)
      guides.push(g)
    }
  }

  if (!altKey) {
    const T = 6 * pxSize
    const dirX: Pt = { x: 1, y: 0 }
    const ly = Math.hypot(xform.c, -xform.s) || 1
    const dirY: Pt = { x: xform.c / ly, y: -xform.s / ly }

    if (effMode === 'horiz') {
      const z0 = rawReal[2]
      type PtCand = { v: P3; vb: Pt; dist: number; guideFrom: Pt }
      type AxisCand = { axis: 'x' | 'y'; val: number; refVb: Pt; dirVb: Pt; dist: number; isNeighbor: boolean }
      type LenCand = { qv: P3; rXy: number; cand3d: P3; dist: number }

      const ptCands: PtCand[] = []
      const axisCands: AxisCand[] = []
      const lenCands: LenCand[] = []

      // 1. Đỉnh S / đỉnh trên nằm ngay trên điểm đặc biệt của đáy (đỉnh, trung điểm cạnh, tâm đáy / giao hai đường chéo)
      if (behavior.baseSpecials && base) {
        for (const sp of computeBaseSpecials(base, ptMap)) {
          const cand3d: P3 = [sp[0], sp[1], z0]
          const candVb = xform.toVb(cand3d)
          const d = distPt(rawVb, candVb)
          if (d < T) ptCands.push({ v: cand3d, vb: candVb, dist: d, guideFrom: xform.toVb(sp) })
        }
      }

      // 2. Thẳng hàng theo trục z với một điểm khác (cùng x, y) + đường thẳng song song trục x / y (cùng z)
      for (const o of visiblePts) {
        const candZ3d: P3 = [o.v[0], o.v[1], z0]
        const candZVb = xform.toVb(candZ3d)
        const dzDist = distPt(rawVb, candZVb)
        if (dzDist < T) ptCands.push({ v: candZ3d, vb: candZVb, dist: dzDist, guideFrom: { x: o.x, y: o.y } })

        if (Math.abs((o.v[2] ?? 0) - z0) < 1e-4) {
          const isNb = neighbors.includes(o.name)
          const refVb = { x: o.x, y: o.y }
          const dxLine = distPointToLine(rawVb, { p0: refVb, dir: dirX })
          if (dxLine < T) axisCands.push({ axis: 'x', val: o.v[1], refVb, dirVb: dirX, dist: dxLine, isNeighbor: isNb })
          const dyLine = distPointToLine(rawVb, { p0: refVb, dir: dirY })
          if (dyLine < T) axisCands.push({ axis: 'y', val: o.v[0], refVb, dirVb: dirY, dist: dyLine, isNeighbor: isNb })
        }
      }

      // 3. Độ dài thật 3D của cạnh kề gần số nguyên hoặc bội 0,5
      for (const qn of neighbors) {
        if (excluded.has(qn)) continue
        const Q = ptMap.get(qn)!
        const qv = Q.v as P3
        const dz = z0 - qv[2]
        const dx = rawReal[0] - qv[0]
        const dy = rawReal[1] - qv[1]
        const dXy = Math.hypot(dx, dy)
        if (dXy < 1e-6) continue
        const len3 = Math.hypot(dx, dy, dz)
        const lenSnap = Math.round(len3 * 2) / 2
        if (lenSnap <= Math.abs(dz) + 1e-6) continue
        const rXy = Math.sqrt(lenSnap * lenSnap - dz * dz)
        const cand3d: P3 = [qv[0] + (dx / dXy) * rXy, qv[1] + (dy / dXy) * rXy, z0]
        const candVb = xform.toVb(cand3d)
        const d = distPt(rawVb, candVb)
        if (d < T) lenCands.push({ qv, rXy, cand3d, dist: d })
      }

      ptCands.sort((a, b) => a.dist - b.dist)
      axisCands.sort((a, b) => a.dist - b.dist)
      lenCands.sort((a, b) => a.dist - b.dist)

      if (ptCands.length) {
        finalReal = ptCands[0].v
        finalVb = ptCands[0].vb
        snapped = true
      } else if (axisCands.length) {
        const L1 = axisCands[0]
        let solved: P3 | null = null
        for (let i = 1; i < axisCands.length; i++) {
          const L2 = axisCands[i]
          if (L2.axis === L1.axis) continue
          const cand: P3 = L1.axis === 'x' ? [L2.val, L1.val, z0] : [L1.val, L2.val, z0]
          if (distPt(xform.toVb(cand), rawVb) < 1.6 * T) {
            solved = cand
            break
          }
        }
        if (!solved) {
          const proj3d: P3 = L1.axis === 'x' ? [rawReal[0], L1.val, z0] : [L1.val, rawReal[1], z0]
          const projVb = xform.toVb(proj3d)
          for (const C of lenCands) {
            if (L1.axis === 'x') {
              const dyC = L1.val - C.qv[1]
              if (Math.abs(dyC) > C.rXy) continue
              const dxC = Math.sqrt(C.rXy * C.rXy - dyC * dyC)
              const xHit = Math.abs(proj3d[0] - (C.qv[0] + dxC)) <= Math.abs(proj3d[0] - (C.qv[0] - dxC)) ? C.qv[0] + dxC : C.qv[0] - dxC
              const cand: P3 = [xHit, L1.val, z0]
              if (distPt(xform.toVb(cand), projVb) < 1.6 * T) {
                solved = cand
                break
              }
            } else {
              const dxC = L1.val - C.qv[0]
              if (Math.abs(dxC) > C.rXy) continue
              const dyC = Math.sqrt(C.rXy * C.rXy - dxC * dxC)
              const yHit = Math.abs(proj3d[1] - (C.qv[1] + dyC)) <= Math.abs(proj3d[1] - (C.qv[1] - dyC)) ? C.qv[1] + dyC : C.qv[1] - dyC
              const cand: P3 = [L1.val, yHit, z0]
              if (distPt(xform.toVb(cand), projVb) < 1.6 * T) {
                solved = cand
                break
              }
            }
          }
          solved = solved ?? proj3d
        }
        finalReal = solved
        finalVb = xform.toVb(solved)
        snapped = true
      } else if (lenCands.length) {
        finalReal = lenCands[0].cand3d
        finalVb = xform.toVb(finalReal)
        snapped = true
      }

      // gom đường gióng đang khớp với vị trí cuối
      for (const pc of ptCands) {
        if (Math.hypot(finalReal[0] - pc.v[0], finalReal[1] - pc.v[1]) < 1e-4) {
          pushGuide({ x1: finalVb.x, y1: finalVb.y, x2: pc.guideFrom.x, y2: pc.guideFrom.y })
        }
      }
      for (const ac of axisCands) {
        const hit = ac.axis === 'x' ? Math.abs(finalReal[1] - ac.val) < 1e-4 : Math.abs(finalReal[0] - ac.val) < 1e-4
        if (!hit) continue
        if (ac.isNeighbor) pushGuide(clipLineToBox(ac.refVb, ac.dirVb, viewBox))
        else pushGuide({ x1: ac.refVb.x, y1: ac.refVb.y, x2: finalVb.x, y2: finalVb.y })
      }
    } else {
      // Kéo thẳng đứng (Shift): giữ x, y, chỉ đổi z
      const [x0, y0] = [rawReal[0], rawReal[1]]
      type ZCand = { z: number; dist: number }
      const zCands: ZCand[] = []

      for (const o of visiblePts) {
        const d = Math.abs(rawReal[2] - (o.v[2] ?? 0)) * xform.scale
        if (d < T) zCands.push({ z: o.v[2] ?? 0, dist: d })
      }
      const zHalf = Math.round(rawReal[2] * 2) / 2
      const dzHalf = Math.abs(rawReal[2] - zHalf) * xform.scale
      if (dzHalf < T) zCands.push({ z: zHalf, dist: dzHalf })

      for (const qn of neighbors) {
        if (excluded.has(qn)) continue
        const qv = ptMap.get(qn)!.v as P3
        const dXy = Math.hypot(x0 - qv[0], y0 - qv[1])
        const len3 = Math.hypot(dXy, rawReal[2] - qv[2])
        const lenSnap = Math.round(len3 * 2) / 2
        if (lenSnap <= 0 || lenSnap < dXy - 1e-9) continue
        const dzAbs = Math.sqrt(Math.max(0, lenSnap * lenSnap - dXy * dXy))
        const zCand = qv[2] + (rawReal[2] >= qv[2] ? dzAbs : -dzAbs)
        const d = Math.abs(rawReal[2] - zCand) * xform.scale
        if (d < T) zCands.push({ z: zCand, dist: d })
      }

      zCands.sort((a, b) => a.dist - b.dist)
      if (zCands.length) {
        finalReal = [x0, y0, zCands[0].z]
        finalVb = xform.toVb(finalReal)
        snapped = true
      }

      // Đường gióng dọc (trùng x, y) hoặc cùng cao độ z / thẳng hàng trục x, y
      for (const o of visiblePts) {
        const ov = o.v as P3
        const sameX = Math.abs(finalReal[0] - ov[0]) < 1e-4
        const sameY = Math.abs(finalReal[1] - ov[1]) < 1e-4
        const sameZ = Math.abs(finalReal[2] - ov[2]) < 1e-4
        if (sameX && sameY) {
          pushGuide({ x1: o.x, y1: o.y, x2: finalVb.x, y2: finalVb.y })
        } else if (sameZ && (sameX || sameY)) {
          if (neighbors.includes(o.name)) pushGuide(clipLineToBox({ x: o.x, y: o.y }, sameY ? dirX : dirY, viewBox))
          else pushGuide({ x1: o.x, y1: o.y, x2: finalVb.x, y2: finalVb.y })
        } else if (sameZ && snapped) {
          pushGuide({ x1: o.x, y1: o.y, x2: finalVb.x, y2: finalVb.y })
        }
      }
    }
  }

  // Tính vị trí các đỉnh đi theo (lăng trụ / hộp / lập phương + chân đường cao S.ABC)
  const moved = new Map<string, { vb: Pt; real: P3 }>()
  moved.set(dragName, { vb: finalVb, real: finalReal })
  const dragOrig = ptMap.get(dragName)!.v as P3
  const savePoints: Array<{ name: string; real: P3; orig: P3 }> = [{ name: dragName, real: finalReal, orig: dragOrig }]
  const delta: P3 = [finalReal[0] - dragOrig[0], finalReal[1] - dragOrig[1], finalReal[2] - dragOrig[2]]
  for (const ln of behavior.linked) {
    const lp = ptMap.get(ln)
    if (!lp) continue
    const lo = lp.v as P3
    const lr: P3 = [lo[0] + delta[0], lo[1] + delta[1], lo[2] + delta[2]]
    moved.set(ln, { real: lr, vb: xform.toVb(lr) })
    savePoints.push({ name: ln, real: lr, orig: lo })
  }
  if (behavior.followFoot && base && base.length >= 3) {
    const bp = base.map((n) => ptMap.get(n)?.v as P3 | undefined).filter((v): v is P3 => Boolean(v))
    if (bp.length >= 3) {
      const foot3d = footPlane3(finalReal, bp[0], bp[1], bp[2])
      moved.set(behavior.followFoot.foot, { real: foot3d, vb: xform.toVb(foot3d) })
    }
  }

  // Bảng cạnh con trỏ: độ dài thật 3D từng cạnh nối vào nút + chiều cao h
  const items: string[] = []
  for (const qn of neighbors) {
    const Q = ptMap.get(qn)!
    const qReal = moved.get(qn)?.real ?? (Q.v as P3)
    const d3 = Math.hypot(finalReal[0] - qReal[0], finalReal[1] - qReal[1], finalReal[2] - qReal[2])
    const key = dragName < qn ? `${dragName}\0${qn}` : `${qn}\0${dragName}`
    const segLabel = edgeNames.get(key) ?? `${dragName}${qn}`
    items.push(`${segLabel} = ${d3.toFixed(2).replace('.', ',')}`)
  }
  items.push(`h = ${finalReal[2].toFixed(2).replace('.', ',')}`)
  const readouts: string[] = [effMode === 'horiz' ? 'Kéo ngang (Shift: đứng)' : 'Kéo đứng']
  for (let i = 0; i < items.length; i += 3) {
    readouts.push(items.slice(i, i + 3).join(' · '))
  }

  return { vb: finalVb, real: finalReal, snapped, mode: effMode, guides, moved, savePoints, readouts }
}

export function savePointsCoord3d(
  extras: string,
  items: Array<{ name: string; real: P3; orig?: P3 }>,
  mode: 'horiz' | 'vert',
  snapped: boolean,
): string {
  let out = extras
  for (const it of items) {
    const [x, y, z] = it.real
    const xyChanged = it.orig ? Math.hypot(x - it.orig[0], y - it.orig[1]) > 1e-6 : mode === 'horiz'
    const zChanged = it.orig ? Math.abs(z - it.orig[2]) > 1e-6 : mode === 'vert'
    const sx = xyChanged ? fmtCoord(x, snapped) : fmtKeep(x)
    const sy = xyChanged ? fmtCoord(y, snapped) : fmtKeep(y)
    const sz = zChanged ? fmtCoord(z, snapped) : fmtKeep(z)
    out = upsertCoordInExtras(out, it.name, `${sx}; ${sy}; ${sz}`)
  }
  return out
}
