import { getSprite } from '../figureSprites'
import { spriteDef } from '../objects'
import { OBJECTS } from '../objectsCatalog'
import { subscript } from '../chem'
import { richTextToSvg } from '../table'
import { DEFAULT_MESH_CAMERA, generateMesh3d } from '../scene3d'
import type { SceneSpec, P, Weight, RegionPart, Cmd, Shape, ArcCmd, CurveCmd, RegionCmd } from './types'
import { FAM, EDGE_ANCHOR, esc, f1, shadeGradientDef, sphereGradientDef, hatchPatternDef, strokeWidthAttr } from './style'
import { wrapDegrees, direction, rotateVec, ellipseArcPoint } from './geom'
import { parseScene } from './parse'

const MIN_SHAPE_TEXT = 16

export const cornerRadius = (c: Shape) => c.rounded ? Math.min(c.rx, c.ry) * 0.35 : 0

/** Khoảng cách từ tâm tới mép hình theo hướng (dx, dy). */
export function shapeEdge(c: Shape, dx: number, dy: number): number {
  const [ldx, ldy] = c.rotate ? rotateVec([dx, dy], -c.rotate) : [dx, dy]
  if (c.kind === 'thoi') return 1 / (Math.abs(ldx) / c.rx + Math.abs(ldy) / c.ry)
  if (c.kind !== 'hộp') return 1 / Math.hypot(ldx / c.rx, ldy / c.ry)
  const x = Math.abs(ldx)
  const y = Math.abs(ldy)
  let hi = Math.min(c.rx / x, c.ry / y)
  const r = cornerRadius(c)
  if (!r) return hi
  let lo = 0
  for (let i = 0; i < 20; i++) {
    const d = (lo + hi) / 2
    if (Math.hypot(Math.max(0, d * x - c.rx + r), Math.max(0, d * y - c.ry + r)) <= r) lo = d
    else hi = d
  }
  return hi
}

/** Ước lượng bề rộng chữ Times New Roman theo em, kể cả ngoài trình duyệt. */
export function textWidthEm(s: string): number {
  let width = 0
  for (const ch of s.replace(/\$/g, '').normalize('NFD').replace(/\p{Mark}/gu, '')) {
    if (/[ilIftjr\s.,;:!'|]/.test(ch)) width += 0.4
    else if (/[A-LN-VX-Z]/.test(ch)) width += 0.85
    else if (/[a-ln-vx-z0-9đ]/.test(ch)) width += 0.6
    else width += 1
  }
  return width
}

/** In nghiêng chữ cái trong đoạn toán học $...$, giữ nguyên chỉ số trên/dưới. */
export function sceneRichText(raw: string): string {
  if (!raw.includes('$')) return richTextToSvg(/^(?:[A-Z][a-z]?\d*)+$/.test(raw) ? subscript(raw) : raw)
  const out: string[] = []
  let pos = 0
  for (const m of raw.matchAll(/\$([^$]+)\$/g)) {
    const idx = m.index ?? 0
    if (idx > pos) out.push(richTextToSvg(raw.slice(pos, idx)))
    const math = m[1]
    // Tách chữ cái Latin/Hy Lạp để in nghiêng chuẩn toán học; số và dấu =, (, ) đứng thẳng.
    out.push(
      math
        .split(/([A-Za-z\u0370-\u03FF]+)/u)
        .map((part, i) => (i % 2 === 1 ? `<tspan font-style="italic">${richTextToSvg(part)}</tspan>` : richTextToSvg(part)))
        .join(''),
    )
    pos = idx + m[0].length
  }
  if (pos < raw.length) out.push(richTextToSvg(raw.slice(pos)))
  return out.join('')
}

export function catmullRomBeziers(points: P[], closed: boolean): Array<[P, P, P]> {
  const n = points.length
  const get = (idx: number): P => {
    if (closed) return points[((idx % n) + n) % n]
    if (idx < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1]]
    if (idx >= n) return [2 * points[n - 1][0] - points[n - 2][0], 2 * points[n - 1][1] - points[n - 2][1]]
    return points[idx]
  }
  const dist = (a: P, b: P) => Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 1e-4)
  const count = closed ? n : n - 1
  const out: Array<[P, P, P]> = []
  for (let i = 0; i < count; i++) {
    const p0 = get(i - 1)
    const p1 = get(i)
    const p2 = get(i + 1)
    const p3 = get(i + 2)
    // Centripetal Catmull-Rom (alpha = 0.5) tránh phình hoặc nút thắt khi khoảng cách điểm không đều.
    const t1 = Math.sqrt(dist(p0, p1))
    const t2 = Math.sqrt(dist(p1, p2))
    const t3 = Math.sqrt(dist(p2, p3))
    const m1x = t2 * ((p1[0] - p0[0]) / t1 - (p2[0] - p0[0]) / (t1 + t2) + (p2[0] - p1[0]) / t2)
    const m1y = t2 * ((p1[1] - p0[1]) / t1 - (p2[1] - p0[1]) / (t1 + t2) + (p2[1] - p1[1]) / t2)
    const m2x = t2 * ((p2[0] - p1[0]) / t2 - (p3[0] - p1[0]) / (t2 + t3) + (p3[0] - p2[0]) / t3)
    const m2y = t2 * ((p2[1] - p1[1]) / t2 - (p3[1] - p1[1]) / (t2 + t3) + (p3[1] - p2[1]) / t3)
    out.push([
      [p1[0] + m1x / 3, p1[1] + m1y / 3],
      [p2[0] - m2x / 3, p2[1] - m2y / 3],
      p2,
    ])
  }
  return out
}

export function sampleCurveWorld(points: P[], closed: boolean): P[] {
  if (points.length === 3 && !closed) {
    const [p0, p1, p2] = points
    const q: P = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2]
    const out: P[] = []
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const u = 1 - t
      out.push([u * u * p0[0] + 2 * u * t * q[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * q[1] + t * t * p2[1]])
    }
    return out
  }
  const segs = catmullRomBeziers(points, closed)
  const out: P[] = [points[0]]
  let cur = points[0]
  for (const [c1, c2, p3] of segs) {
    for (let i = 1; i <= 14; i++) {
      const t = i / 14
      const u = 1 - t
      out.push([
        u * u * u * cur[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        u * u * u * cur[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
      ])
    }
    cur = p3
  }
  return out
}

export function sampleRegionPart(part: RegionPart, pts: Map<string, P>): P[] {
  if (part.k === 'seg') return part.names.map((n) => pts.get(n)!)
  if (part.k === 'curve') return sampleCurveWorld(part.names.map((n) => pts.get(n)!), false)
  const o = pts.get(part.o)!
  const steps = Math.max(12, Math.ceil(Math.abs(part.to - part.from) / 10))
  const out: P[] = []
  for (let i = 0; i <= steps; i++) {
    const a = part.from + ((part.to - part.from) * i) / steps
    out.push(ellipseArcPoint(o, part.rx, part.ry, a, part.rotate))
  }
  return out
}

export function collectUsedPointNames(cmds: Cmd[]): Set<string> {
  const used = new Set<string>()
  for (const c of cmds) {
    if (c.t === 'seg' || c.t === 'dim' || c.t === 'label' || c.t === 'ground') { used.add(c.a); used.add(c.b) }
    else if (c.t === 'poly' || c.t === 'curve' || c.t === 'face') c.names.forEach((n) => used.add(n))
    else if (c.t === 'angle' || c.t === 'right') { used.add(c.a); used.add(c.o); used.add(c.b) }
    else if (c.t === 'sprite') { used.add(c.a); if (c.b) used.add(c.b) }
    else if (c.t === 'shape' || c.t === 'arc' || c.t === 'text' || c.t === 'dot' || c.t === 'mesh3d') used.add(c.o)
    else if (c.t === 'region') {
      for (const p of c.parts) if (p.k !== 'arc') p.names.forEach((n) => used.add(n))
    }
  }
  return used
}

export function renderSceneSvg(spec: SceneSpec, desc: string): { svg: string; width: number; height: number } {
  const { pts, cmds, depths, cam } = parseScene(spec.text)
  const shapes = cmds.filter((c): c is Shape => c.t === 'shape')
  const solidShapes = shapes.filter((s) => !s.bg)

  // Hai nút lưu đồ nối nhau cần chừa chỗ cho mũi tên, kể cả khi elip sát góc hộp.
  for (const arrow of cmds) {
    if (arrow.t !== 'seg' || !arrow.arrow) continue
    const ends = [arrow.a, arrow.b]
    const ellipse = solidShapes.find(s => s.kind === 'elip' && ends.includes(s.o))
    const box = solidShapes.find(s => s.kind === 'hộp' && ends.includes(s.o))
    if (!ellipse || !box) continue
    const [x, y] = pts.get(ellipse.o)!
    const [bx, by] = pts.get(box.o)!
    const dx = x - bx
    const dy = y - by
    const gap = Math.min(box.ry, ellipse.ry) * 0.35
    const separation = (scale: number) => Math.hypot(
      Math.max(0, Math.abs(dx) * scale - box.rx) / (ellipse.rx + gap),
      Math.max(0, Math.abs(dy) * scale - box.ry) / (ellipse.ry + gap),
    )
    if (separation(1) >= 1) continue
    if (!dx && !dy) {
      pts.set(ellipse.o, [x, y - box.ry - ellipse.ry - gap])
      continue
    }
    let lo = 1
    let hi = Math.min(dx ? (box.rx + ellipse.rx + gap) / Math.abs(dx) : Infinity,
      dy ? (box.ry + ellipse.ry + gap) / Math.abs(dy) : Infinity)
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2
      if (separation(mid) < 1) lo = mid
      else hi = mid
    }
    pts.set(ellipse.o, [bx + dx * hi, by + dy * hi])
  }

  // Điểm ẩn chỉ đóng vai trò tâm cung trong lệnh `vùng` không kéo giãn khung ảnh.
  const nonRegionUsed = collectUsedPointNames(cmds)
  const boundPts = [...pts].filter(([nm]) => !nm.startsWith('_') || nonRegionUsed.has(nm)).map(([, p]) => p)
  const px = (boundPts.length ? boundPts : [...pts.values()]).map((p) => p[0])
  const py = (boundPts.length ? boundPts : [...pts.values()]).map((p) => p[1])

  // cạnh của góc mà AI quên vẽ (thiếu "đất AB"…) thì tự vẽ, không thì cung góc lơ lửng
  const drawn = (a: string, b: string) =>
    cmds.some((c) =>
      (c.t === 'seg' || c.t === 'ground') ? (c.a === a && c.b === b) || (c.a === b && c.b === a)
      : (c.t === 'poly' || c.t === 'face') && c.names.some((n, i) => { const m = c.names[(i + 1) % c.names.length]; return (n === a && m === b) || (n === b && m === a) }))
  for (const c of [...cmds]) {
    if (c.t !== 'angle' && c.t !== 'right') continue
    for (const x of [c.a, c.b]) if (!drawn(c.o, x)) cmds.push({ t: 'seg', a: c.o, b: x, dashed: false })
  }
  // thang (vật nghiêng) mà AI quên vẽ tường: đỉnh thang nằm thẳng trên một điểm có tên ở mặt đất → tự dựng tường + góc vuông
  {
    const allX = [...pts.values()].map((p) => p[0])
    const tol = (Math.max(...allX) - Math.min(...allX) || 1) * 0.03
    for (const c of [...cmds]) {
      if (c.t !== 'sprite' || c.id !== 'ladder' || !c.b) continue
      const foot = pts.get(c.a)!
      const top = pts.get(c.b)!
      const base = [...pts].find(([nm, p]) => nm !== c.a && nm !== c.b && !nm.startsWith('_') && Math.abs(p[0] - top[0]) <= tol && Math.abs(p[1] - foot[1]) <= tol && top[1] > p[1])
      if (!base) continue
      const [w] = base
      if (!drawn(w, c.b)) cmds.push({ t: 'ground', a: w, b: c.b, wall: true })
      if (!cmds.some((g) => g.t === 'right' && g.o === w)) cmds.push({ t: 'right', a: c.a, o: w, b: c.b })
    }
  }
  // nhiều góc chung một đỉnh: góc nhỏ ở trong, góc lớn ở ngoài, bán kính tăng dần
  const angleSize = (g: Extract<Cmd, { t: 'angle' }>) => {
    const o = pts.get(g.o)!
    const pa = pts.get(g.a)!
    const pb = pts.get(g.b)!
    let d = Math.atan2(pb[1] - o[1], pb[0] - o[0]) - Math.atan2(pa[1] - o[1], pa[0] - o[0])
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    return Math.abs(d)
  }
  const ring = new Map<Cmd, number>()
  for (const o of new Set(cmds.flatMap((g) => (g.t === 'angle' ? [g.o] : [])))) {
    const group = cmds.filter((g): g is Extract<Cmd, { t: 'angle' }> => g.t === 'angle' && g.o === o)
    group.sort((x, y) => angleSize(x) - angleSize(y)).forEach((g, i) => ring.set(g, i))
  }

  const ptSpan = Math.max(Math.max(...py) - Math.min(...py), (Math.max(...px) - Math.min(...px)) * 0.5) || 1
  const named = [...pts].filter(([nm]) => !nm.startsWith('_')).map(([, p]) => p)
  const ptCx = named.reduce((s, p) => s + p[0], 0) / (named.length || 1)
  const ptCy = named.reduce((s, p) => s + p[1], 0) / (named.length || 1)
  const sprites = cmds
    .filter((c): c is Extract<Cmd, { t: 'sprite' }> => c.t === 'sprite')
    .map((c) => {
      const sp = getSprite(c.id)
      const aspect = sp ? sp.w / sp.h : 0.6
      let foot = pts.get(c.a)!
      let top: P = c.b ? pts.get(c.b)! : [foot[0], foot[1] + ptSpan * 0.25]
      const len = Math.hypot(top[0] - foot[0], top[1] - foot[1]) || ptSpan * 0.25
      const u: P = [(top[0] - foot[0]) / len, (top[1] - foot[1]) / len]
      const n: P = [u[1], -u[0]]
      const hw = (len * aspect) / 2
      const wide = EDGE_ANCHOR.has(c.id)
      const shifted = Boolean(c.b) && (Math.abs(u[0]) > 0.09 || wide)
      if (shifted) {
        const mx = (foot[0] + top[0]) / 2 - ptCx
        const my = (foot[1] + top[1]) / 2 - ptCy
        let sgn = mx * n[0] + my * n[1] >= 0 ? 1 : -1
        const ang = cmds.find((g): g is Extract<Cmd, { t: 'angle' }> =>
          g.t === 'angle' && (g.o === c.a || g.o === c.b) && [g.a, g.b].includes(g.o === c.a ? c.b! : c.a))
        if (ang) {
          const o = pts.get(ang.o)!
          const other = pts.get(ang.a === (ang.o === c.a ? c.b : c.a) ? ang.b : ang.a)!
          sgn = (other[0] - o[0]) * n[0] + (other[1] - o[1]) * n[1] >= 0 ? -1 : 1
        }
        const off = hw * (wide ? 1 : 0.5) * sgn
        foot = [foot[0] + n[0] * off, foot[1] + n[1] * off]
        top = [top[0] + n[0] * off, top[1] + n[1] * off]
      }
      const corners: P[] = [
        [foot[0] + n[0] * hw, foot[1] + n[1] * hw],
        [foot[0] - n[0] * hw, foot[1] - n[1] * hw],
        [top[0] + n[0] * hw, top[1] + n[1] * hw],
        [top[0] - n[0] * hw, top[1] - n[1] * hw],
      ]
      return { c, sp, foot, top, len, corners, shifted, hw }
    })

  const xs = [...px, ...sprites.flatMap((s) => s.corners.map((p) => p[0]))]
  const ys = [...py, ...sprites.flatMap((s) => s.corners.map((p) => p[1]))]
  for (const c of shapes) {
    const [x, y] = pts.get(c.o)!
    if (!c.rotate) {
      xs.push(x - c.rx, x + c.rx)
      ys.push(y - c.ry, y + c.ry)
    } else {
      for (let i = 0; i < 4; i++) {
        const sx = i & 1 ? c.rx : -c.rx
        const sy = i & 2 ? c.ry : -c.ry
        const [rx, ry] = rotateVec([sx, sy], c.rotate)
        xs.push(x + rx); ys.push(y + ry)
      }
    }
  }
  const arcs = cmds.filter((c): c is ArcCmd => c.t === 'arc')
  for (const c of arcs) {
    const center = pts.get(c.o)!
    const rot = c.rotate ?? 0
    if (rot) {
      const steps = Math.max(12, Math.ceil(c.sweep / 10))
      for (let i = 0; i <= steps; i++) {
        const [x, y] = ellipseArcPoint(center, c.rx, c.ry, c.start + (c.sweep * i) / steps, rot)
        xs.push(x); ys.push(y)
      }
    } else {
      const angles = [c.start, c.start + c.sweep]
      for (const angle of [0, 90, 180, 270]) {
        if (wrapDegrees(angle - c.start) <= c.sweep) angles.push(angle)
      }
      for (const angle of angles) {
        const [x, y] = ellipseArcPoint(center, c.rx, c.ry, angle)
        xs.push(x); ys.push(y)
      }
    }
  }
  const curves = cmds.filter((c): c is CurveCmd => c.t === 'curve')
  for (const c of curves) {
    for (const [x, y] of sampleCurveWorld(c.names.map((n) => pts.get(n)!), c.closed)) {
      xs.push(x); ys.push(y)
    }
  }
  const regions = cmds.filter((c): c is RegionCmd => c.t === 'region')
  for (const c of regions) {
    for (const p of c.parts) {
      for (const [x, y] of sampleRegionPart(p, pts)) {
        xs.push(x); ys.push(y)
      }
    }
  }
  const meshes = cmds
    .filter((c): c is Extract<Cmd, { t: 'mesh3d' }> => c.t === 'mesh3d')
    .map((c) => ({ c, mesh: generateMesh3d(c.meshKind, pts.get(c.o)!, c.r, c.h, c.steps, c.cam ?? cam ?? DEFAULT_MESH_CAMERA) }))
  for (const m of meshes) {
    for (const [x, y] of m.mesh.bounds) {
      xs.push(x); ys.push(y)
    }
  }

  const frameCmd = [...cmds].reverse().find((c): c is Extract<Cmd, { t: 'frame' }> => c.t === 'frame')
  const frameW = frameCmd?.w ?? 300
  const frameH = frameCmd?.h ?? 230
  const uiScale = frameCmd ? Math.max(1, Math.min(frameW / 320, frameH / 240)) : 1

  const getLabels = (k: number) => cmds.flatMap((c, i) => {
    if ((c.t !== 'shape' && c.t !== 'text' && c.t !== 'arc') || !c.text) return []
    const baseSize = c.t === 'text' && c.large ? 22 : c.t === 'text' && c.small ? 14 : 18
    let size = Math.round(baseSize * uiScale * 10) / 10
    const minShapeSize = Math.round(MIN_SHAPE_TEXT * uiScale * 10) / 10
    let lines = c.text.split('\\n')
    if (c.t === 'shape') {
      const fW = c.kind === 'hộp' ? 2 : c.kind === 'thoi' ? 1.1 : 1.6
      const fH = c.kind === 'hộp' ? 2 : c.kind === 'thoi' ? 1.1 : 1.4
      const availableW = c.rx * k * fW - 12
      const availableH = c.ry * k * fH - 5
      for (; size >= minShapeSize; size--) {
        const wrapped = lines.flatMap((line) => {
          const rows: string[] = []
          for (const word of line.split(/\s+/)) {
            const last = rows.at(-1)
            if (last && textWidthEm(last + ' ' + word) * size <= availableW) rows[rows.length - 1] += ' ' + word
            else rows.push(word)
          }
          return rows
        })
        if (wrapped.length * size * 1.2 <= availableH && wrapped.every((line) => textWidthEm(line) * size <= availableW)) {
          lines = wrapped
          break
        }
      }
      if (size < minShapeSize) {
        // chữ không vừa ở cỡ đọc được: nới hình cho vừa chữ thay vì thu chữ
        size = minShapeSize
        lines = lines.flatMap((line) => {
          const words = line.split(/\s+/)
          return words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [line]
        })
        c.rx = Math.max(c.rx, (Math.max(...lines.map(textWidthEm)) * size + 12) / (k * fW))
        c.ry = Math.max(c.ry, (lines.length * size * 1.2 + 5) / (k * fH))
      }
    }
    const center = pts.get(c.o)!
    const mid = c.t === 'arc' ? c.start + c.sweep / 2 : 0
    const point = c.t === 'arc' ? ellipseArcPoint(center, c.rx, c.ry, mid, c.rotate ?? 0) : center
    const [dx, dy] = c.t === 'arc' ? rotateVec(direction(mid), c.rotate ?? 0) : [0, 0]
    return [{
      point, dx: 14 * dx, dy: -14 * dy, id: `free:${c.o}:${i}`, lines, size, step: size * 1.2,
      bold: c.t === 'text' && c.bold, italic: Boolean(c.italic),
      rotate: c.t === 'text' ? c.rotate : undefined,
      solidLabel: c.t === 'shape' && c.fill !== 'none',
    }]
  })
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const freeLayout = shapes.length > 0 || arcs.length > 0 || curves.length > 0 || regions.length > 0 ||
    meshes.length > 0 || cmds.some((c) => c.t === 'text' || c.t === 'dot' || c.t === 'face' || (c.t === 'seg' && c.arrow))
  const spanX = maxX - minX || (freeLayout ? 0 : 1)
  const spanY = maxY - minY || (freeLayout ? 0 : 1)
  const k = spanX || spanY ? Math.min(frameW / spanX, frameH / spanY) : 1
  const labels = getLabels(k)
  const pad = 62
  const width = Math.round(spanX * k + pad * 2) - pad * 2
  const height = Math.round(spanY * k + pad * 2) - pad * 2
  const bounds = { left: 0, right: width, top: 0, bottom: height }
  for (const c of labels) {
    const [x, y] = c.point
    const lx = (x - minX) * k + c.dx
    const ly = height - (y - minY) * k + c.dy
    const hw = Math.max(...c.lines.map(textWidthEm)) * c.size / 2
    const hh = (c.lines.length - 1) * c.step / 2 + c.size
    bounds.left = Math.min(bounds.left, Math.floor(lx - hw))
    bounds.right = Math.max(bounds.right, Math.ceil(lx + hw))
    bounds.top = Math.min(bounds.top, Math.floor(ly - hh))
    bounds.bottom = Math.max(bounds.bottom, Math.ceil(ly + hh))
  }
  const W = bounds.right - bounds.left + pad * 2
  const H = bounds.bottom - bounds.top + pad * 2
  const S = ([x, y]: P): P => [pad - bounds.left + (x - minX) * k, height + pad - bounds.top - (y - minY) * k]
  const at = (n: string) => S(pts.get(n)!)
  const cxPts = boundPts.length ? boundPts : [...pts.values()]
  const cx = cxPts.reduce((s, p) => s + S(p)[0], 0) / cxPts.length
  const cy = cxPts.reduce((s, p) => s + S(p)[1], 0) / cxPts.length

  const arrowColors = new Set<string>()
  const shadeColors = new Set<string>()
  const sphereColors = new Set<string>()
  const hatchSpecs = new Map<string, { hex: string; angle: number }>()
  const noteColor = (c: { fill?: string; stroke?: string; arrow?: boolean }) => {
    if (c.arrow && c.stroke && c.stroke !== '#111' && c.stroke !== 'none') arrowColors.add(c.stroke)
    const m = c.fill ? /^url\(#(scgr|scrg|schat)-([\da-f]{6})(?:-(\d+))?\)$/.exec(c.fill) : null
    if (m?.[1] === 'scgr') shadeColors.add('#' + m[2])
    else if (m?.[1] === 'scrg') sphereColors.add('#' + m[2])
    else if (m?.[1] === 'schat') {
      const ang = m[3] ? Number(m[3]) : 45
      hatchSpecs.set(`${m[2]}-${ang}`, { hex: '#' + m[2], angle: ang })
    }
  }
  cmds.forEach((c) => {
    if (c.t === 'seg' || c.t === 'poly' || c.t === 'shape' || c.t === 'arc' || c.t === 'curve' || c.t === 'region' || c.t === 'face' || c.t === 'mesh3d') noteColor(c)
  })
  const arrowId = (stroke?: string) => (stroke && stroke !== '#111' ? `scarr-${stroke.slice(1)}` : 'scarr')
  const extraMarkers = [...arrowColors].map((c) =>
    `<marker id="scarr-${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')
  const extraGrads = [...shadeColors].map(shadeGradientDef).join('') +
    [...sphereColors].map(sphereGradientDef).join('') +
    [...hatchSpecs.values()].map((h) => hatchPatternDef(h.hex, h.angle)).join('')

  let b = `<defs><marker id="scarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker>${extraMarkers}${extraGrads}</defs>`
  const line = (p: P, q: P, extra = '', stroke = '#111') =>
    `<path d="M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}" stroke="${stroke}" fill="none" ${extra}/>`
  const ext = [0, 0, W, H] // khung chứa mọi chữ, để nới khung khi chữ tràn mép
  const text = (x: number, y: number, s: string, anchor = 'middle', size = 16, lbl?: string, italic = false, rotateSvgDeg = 0, isPoint = false) => {
    const fsize = Math.round(size * uiScale * 10) / 10
    const tr = rotateSvgDeg ? ` transform="rotate(${f1(rotateSvgDeg)} ${f1(x)} ${f1(y - 5)})"` : ''
    const content = s.includes('$') ? sceneRichText(s)
      : s.includes('_') ? richTextToSvg(s)
      : isPoint && /^[A-Z][A-Za-z']*\d+$/.test(s) ? richTextToSvg(s.replace(/(\d+)$/, '_$1'))
      : esc(s)
    if (!rotateSvgDeg) {
      const w = textWidthEm(s.replace(/[_{}]/g, '')) * fsize * 0.8
      const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x
      ext[0] = Math.min(ext[0], x0); ext[1] = Math.min(ext[1], y - fsize * 0.8)
      ext[2] = Math.max(ext[2], x0 + w); ext[3] = Math.max(ext[3], y + fsize * 0.25)
    }
    return `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="${fsize}"${italic ? ' font-style="italic"' : ''}${lbl ? ` data-lbl="${lbl}"` : ''}${tr} text-anchor="${anchor}">${content}</text>`
  }

  const outward = (p: P, q: P): P => {
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const len = Math.hypot(dx, dy) || 1
    let n: P = [-dy / len, dx / len]
    const mx = (p[0] + q[0]) / 2
    const my = (p[1] + q[1]) / 2
    if ((mx - cx) * n[0] + (my - cy) * n[1] < 0) n = [-n[0], -n[1]]
    return n
  }

  const curvePathD = (c: CurveCmd): string => {
    const world = c.names.map((n) => pts.get(n)!)
    const sp = world.map(S)
    if (sp.length === 3 && !c.closed) {
      const [p0, p1, p2] = sp
      const q: P = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2]
      return `M${f1(p0[0])} ${f1(p0[1])}Q${f1(q[0])} ${f1(q[1])} ${f1(p2[0])} ${f1(p2[1])}`
    }
    const segs = catmullRomBeziers(sp, c.closed)
    return `M${f1(sp[0][0])} ${f1(sp[0][1])}` +
      segs.map(([c1, c2, p]) => `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p[0])} ${f1(p[1])}`).join('') +
      (c.closed ? 'Z' : '')
  }

  const regionPathD = (c: RegionCmd): string => {
    let d = ''
    let cur: P | null = null
    const moveOrLine = (p: P) => {
      if (!cur) d += `M${f1(p[0])} ${f1(p[1])}`
      else if (Math.hypot(p[0] - cur[0], p[1] - cur[1]) > 0.3) d += `L${f1(p[0])} ${f1(p[1])}`
      cur = p
    }
    for (const part of c.parts) {
      if (part.k === 'seg') {
        part.names.forEach((n) => moveOrLine(at(n)))
      } else if (part.k === 'curve') {
        const sp = part.names.map(at)
        moveOrLine(sp[0])
        if (sp.length === 3) {
          const [p0, p1, p2] = sp
          const q: P = [2 * p1[0] - (p0[0] + p2[0]) / 2, 2 * p1[1] - (p0[1] + p2[1]) / 2]
          d += `Q${f1(q[0])} ${f1(q[1])} ${f1(p2[0])} ${f1(p2[1])}`
          cur = p2
        } else {
          for (const [c1, c2, p] of catmullRomBeziers(sp, false)) {
            d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p[0])} ${f1(p[1])}`
            cur = p
          }
        }
      } else {
        const center = pts.get(part.o)!
        const pStart = S(ellipseArcPoint(center, part.rx, part.ry, part.from, part.rotate))
        moveOrLine(pStart)
        const diff = part.to - part.from
        const ccw = diff >= 0
        const span = Math.abs(diff)
        const sweepFlag = ccw ? 0 : 1
        const rx = f1(part.rx * k)
        const ry = f1(part.ry * k)
        const rot = part.rotate ? f1(-part.rotate) : 0
        if (span >= 360) {
          const pMid = S(ellipseArcPoint(center, part.rx, part.ry, part.from + (ccw ? 180 : -180), part.rotate))
          d += `A${rx} ${ry} ${rot} 0 ${sweepFlag} ${f1(pMid[0])} ${f1(pMid[1])}`
          d += `A${rx} ${ry} ${rot} 0 ${sweepFlag} ${f1(pStart[0])} ${f1(pStart[1])}`
          cur = pStart
        } else if (span > 0) {
          const pEnd = S(ellipseArcPoint(center, part.rx, part.ry, part.to, part.rotate))
          const large = Number(span > 180)
          d += `A${rx} ${ry} ${rot} ${large} ${sweepFlag} ${f1(pEnd[0])} ${f1(pEnd[1])}`
          cur = pEnd
        }
      }
    }
    return d + 'Z'
  }

  const strokeWidthOnly = (stroke: string | undefined, weight: Weight | undefined, baseW: number) =>
    stroke === 'none' ? '' : ` stroke-width="${strokeWidthAttr(weight, baseW)}"`

  const strokeAttrs = (stroke: string | undefined, weight: Weight | undefined, baseW: number, dashed: boolean) => {
    const sw = strokeWidthOnly(stroke, weight, baseW)
    const dash = dashed ? ' stroke-dasharray="5 4"' : ''
    return `stroke="${stroke ?? '#111'}"${sw}${dash}`
  }

  const fillOpacityAttr = (fill: string | undefined, opacity: number | undefined) =>
    opacity !== undefined && fill && fill !== 'none' ? ` fill-opacity="${opacity}"` : ''

  const renderShapeSvg = (c: Shape) => {
    const [x, y] = at(c.o)
    const rx = c.rx * k
    const ry = c.ry * k
    const rot = c.rotate ? ` transform="rotate(${f1(-c.rotate)} ${f1(x)} ${f1(y)})"` : ''
    const sw = strokeWidthOnly(c.stroke, c.weight, 1.8)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    const style = `fill="${c.fill}"${fo} stroke="${c.stroke ?? '#111'}"${sw}${dash}`
    if (c.kind === 'tròn') return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${rx}" ${style}/>`
    if (c.kind === 'elip') return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${ry}" ${style}${rot}/>`
    if (c.kind === 'thoi') return `<path d="M${f1(x - rx)} ${f1(y)}L${f1(x)} ${f1(y - ry)}L${f1(x + rx)} ${f1(y)}L${f1(x)} ${f1(y + ry)}Z" ${style}/>`
    return `<rect x="${f1(x - rx)}" y="${f1(y - ry)}" width="${2 * rx}" height="${2 * ry}" rx="${cornerRadius(c) * k}" ${style}${rot}/>`
  }

  const renderRailArc = (c: ArcCmd) => {
    const center = pts.get(c.o)!
    const [cx0, cy0] = S(center)
    const r = c.rx * k
    const st = c.stroke ?? '#111'
    const arcPath = (rad: number) => {
      if (rad <= 0) return ''
      const ptAt = (deg: number) => {
        const a = (deg * Math.PI) / 180
        return `${f1(cx0 + rad * Math.cos(a))} ${f1(cy0 - rad * Math.sin(a))}`
      }
      const start = ptAt(c.start)
      const full = c.sweep === 360
      const turn = (end: string, large: number) => `A${f1(rad)} ${f1(rad)} 0 ${large} 0 ${end}`
      const curve = full ? turn(ptAt(c.start + 180), 0) + turn(start, 0) : turn(ptAt(c.start + c.sweep), Number(c.sweep > 180))
      return `<path d="M${start}${curve}${full ? 'Z' : ''}" stroke="${st}" fill="none" stroke-width="1.4"/>`
    }
    const arcLen = r * ((c.sweep * Math.PI) / 180)
    const steps = Math.max(2, Math.round(arcLen / 7))
    let sleepers = ''
    for (let i = 0; i < steps; i++) {
      const a = ((c.start + (c.sweep * (i + 0.5)) / steps) * Math.PI) / 180
      const ux = Math.cos(a)
      const uy = -Math.sin(a)
      sleepers += line([cx0 + (r - 5.5) * ux, cy0 + (r - 5.5) * uy], [cx0 + (r + 5.5) * ux, cy0 + (r + 5.5) * uy], 'stroke-width="1.1"', st)
    }
    return arcPath(r - 3) + arcPath(r + 3) + sleepers
  }

  const renderArcSvg = (c: ArcCmd) => {
    if (c.rail) return renderRailArc(c)
    const center = pts.get(c.o)!
    const rot = c.rotate ?? 0
    const point = (angle: number) => S(ellipseArcPoint(center, c.rx, c.ry, angle, rot)).join(' ')
    const start = point(c.start)
    const rx = c.rx * k
    const ry = c.ry * k
    const svgRot = rot ? f1(-rot) : 0
    // Trục y của SVG hướng xuống nên sweep-flag 0 đi ngược chiều kim đồng hồ.
    const turn = (end: string, large: number) => `A${rx} ${ry} ${svgRot} ${large} 0 ${end}`
    const full = c.sweep === 360
    const curve = full ? turn(point(c.start + 180), 0) + turn(start, 0) : turn(point(c.start + c.sweep), Number(c.sweep > 180))
    const d = c.kind === 'quạt' && !full ? `M${S(center).join(' ')}L${start}${curve}Z` : `M${start}${curve}${full ? 'Z' : ''}`
    const sw = strokeWidthOnly(c.stroke, c.weight, 1.9)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${d}" stroke="${c.stroke ?? '#111'}" fill="${c.fill}"${fo}${sw} stroke-linejoin="round"${dash}/>`
  }

  const renderCurveSvg = (c: CurveCmd) => {
    const aid = arrowId(c.stroke)
    const arr = c.arrow ? ` marker-end="url(#${aid})"` : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${curvePathD(c)}" ${strokeAttrs(c.stroke, c.weight, 1.9, c.dashed)} fill="${c.fill}"${fo} stroke-linecap="round" stroke-linejoin="round"${arr}/>`
  }

  const renderRegionSvg = (c: RegionCmd) => {
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${regionPathD(c)}" ${strokeAttrs(c.stroke, c.weight, 1.9, c.dashed)} fill="${c.fill}"${fo} stroke-linejoin="round"/>`
  }

  const renderPolySvg = (c: Extract<Cmd, { t: 'poly' }>) => {
    const d = c.names.map((n, i) => `${i ? 'L' : 'M'}${f1(at(n)[0])} ${f1(at(n)[1])}`).join('') + 'Z'
    const sw = strokeWidthOnly(c.stroke, c.weight, 1.9)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    return `<path d="${d}" stroke="${c.stroke ?? '#111'}" fill="${c.fill ?? 'none'}"${fo}${sw} stroke-linejoin="round"${dash}/>`
  }

  // 1. Mặt đất / tường
  for (const c of cmds) {
    if (c.t !== 'ground') continue
    const p = at(c.a)
    const q = at(c.b)
    const n = outward(p, q)
    const len = Math.hypot(q[0] - p[0], q[1] - p[1])
    const u: P = [(q[0] - p[0]) / len, (q[1] - p[1]) / len]
    b += line(p, q, 'stroke-width="2"')
    for (let s = 6; s < len; s += 9) {
      const o: P = [p[0] + u[0] * s, p[1] + u[1] * s]
      b += line(o, [o[0] + n[0] * 8 - u[0] * 6, o[1] + n[1] * 8 - u[1] * 6], 'stroke-width="0.9"')
    }
  }

  // 2. Lớp nền (`nền`): vẽ theo đúng thứ tự viết, nằm dưới sprites và mọi nét chính
  for (const c of cmds) {
    if (!('bg' in c) || !c.bg) continue
    if (c.t === 'poly') b += renderPolySvg(c)
    else if (c.t === 'region') b += renderRegionSvg(c)
    else if (c.t === 'curve') b += renderCurveSvg(c)
    else if (c.t === 'arc') b += renderArcSvg(c)
    else if (c.t === 'shape') b += renderShapeSvg(c)
  }

  // 2b. Lớp 3D: lưới mặt cong 3D & các mặt đa giác 3D sắp xếp từ xa tới gần
  for (const { c, mesh } of meshes) {
    const sw = strokeWidthOnly(c.stroke, c.weight, 0.85)
    const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
    const fo = fillOpacityAttr(c.fill, c.fillOpacity)
    for (const q of mesh.quads) {
      const d = q.pts.map((p, i) => `${i ? 'L' : 'M'}${f1(S(p)[0])} ${f1(S(p)[1])}`).join('') + 'Z'
      b += `<path d="${d}" stroke="${c.stroke ?? '#111'}" fill="${c.fill}"${fo}${sw} stroke-linejoin="round"${dash}/>`
    }
  }
  const faces = cmds.filter((c): c is Extract<Cmd, { t: 'face' }> => c.t === 'face')
  if (faces.length) {
    const sortedFaces = faces
      .map((c, idx) => ({
        c, idx,
        depth: c.names.reduce((s, n) => s + (depths.get(n) ?? 0), 0) / c.names.length,
      }))
      .sort((x, y) => x.depth - y.depth || x.idx - y.idx)
    for (const { c } of sortedFaces) {
      const d = c.names.map((n, i) => `${i ? 'L' : 'M'}${f1(at(n)[0])} ${f1(at(n)[1])}`).join('') + 'Z'
      const sw = strokeWidthOnly(c.stroke, c.weight, 1.4)
      const dash = c.dashed ? ' stroke-dasharray="5 4"' : ''
      const fo = fillOpacityAttr(c.fill, c.fillOpacity)
      b += `<path d="${d}" stroke="${c.stroke ?? '#111'}" fill="${c.fill}"${fo}${sw} stroke-linejoin="round"${dash}/>`
    }
  }

  // 3. Hình vật
  const usedSprites = new Set<string>()
  for (const s of sprites) {
    const f = S(s.foot)
    const t = S(s.top)
    const hp = s.len * k
    const deg = (Math.atan2(t[0] - f[0], f[1] - t[1]) * 180) / Math.PI
    const rot = `translate(${f1(f[0])} ${f1(f[1])}) rotate(${f1(deg)})`
    if (s.sp) {
      usedSprites.add(s.c.id)
      const sc = hp / s.sp.h
      b += `<use href="#sp-${s.c.id}" transform="${rot} translate(${f1((-s.sp.w * sc) / 2)} ${f1(-hp)}) scale(${+sc.toFixed(4)})"/>`
    } else {
      const wp = hp * 0.6
      const name = OBJECTS[s.c.id] ?? s.c.name.replace(/^en\s*:\s*/i, '')
      b += `<g transform="${rot}"><rect x="${f1(-wp / 2)}" y="${f1(-hp)}" width="${f1(wp)}" height="${f1(hp)}" fill="#fff" stroke="#888" stroke-dasharray="4 3"/><text y="${f1(-hp / 2)}" text-anchor="middle" font-size="11" fill="#666" ${FAM}>${esc(name)}</text></g>`
    }
  }
  b = b.replace('</defs>', [...usedSprites].map(spriteDef).join('') + '</defs>')

  // 4. Nét chính (giữ nguyên luật filledPolys cũ cho đa giác thường không có `nền`)
  const mainCmds = cmds.filter((c) => !('bg' in c && c.bg) && c.t !== 'face' && c.t !== 'mesh3d' && c.t !== 'view')
  const filledPolys = mainCmds.filter((c) => c.t === 'poly' && c.fill)
  const baseLine = (c: Cmd) => c.t === 'seg' || (c.t === 'poly' && !c.fill)
  const ordered = filledPolys.length ? [
    ...mainCmds.filter(baseLine), ...filledPolys, ...mainCmds.filter((c) => !baseLine(c) && c.t !== 'poly'),
  ] : mainCmds
  let topText = '' // chữ kích thước, nhãn, góc: vẽ trên cùng để hình tô không che
  const dimBoxes: Array<{ x0: number; x1: number; y0: number; y1: number }> = []
  for (const c of ordered) {
    if (c.t === 'poly') {
      b += renderPolySvg(c)
    } else if (c.t === 'region') {
      b += renderRegionSvg(c)
    } else if (c.t === 'curve') {
      b += renderCurveSvg(c)
    } else if (c.t === 'seg') {
      let p = at(c.a)
      let q = at(c.b)
      const sw = strokeWidthAttr(c.weight, c.dashed ? 1.4 : 1.9)
      const style = `stroke-width="${sw}"` + (c.dashed ? ' stroke-dasharray="5 4"' : '')
      const from = solidShapes.filter((s) => s.o === c.a)
      const to = solidShapes.filter((s) => s.o === c.b)
      if (c.arrow || (from.length && to.length) || from.some((s) => s.node) || to.some((s) => s.node)) {
        const len = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (!len) continue
        const dx = (q[0] - p[0]) / len
        const dy = (q[1] - p[1]) / len
        // hình chứa cả đầu kia (vành lớn quanh tâm, nan hoa tới cabin) không phải nút: không cắt phía đó
        const edge = (ss: Shape[]) => Math.max(0, ...ss.map((s) => shapeEdge(s, dx, dy) * k).filter((e) => e < len * 0.98))
        const start = edge(from)
        const end = edge(to)
        if (start + end >= len) continue
        p = [p[0] + dx * start, p[1] + dy * start]
        q = [q[0] - dx * end, q[1] - dy * end]
      }
      if (c.rail) {
        const len = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (!len) continue
        const ux = (q[0] - p[0]) / len
        const uy = (q[1] - p[1]) / len
        const nx = -uy
        const ny = ux
        const st = c.stroke ?? '#111'
        b += line([p[0] + nx * 3, p[1] + ny * 3], [q[0] + nx * 3, q[1] + ny * 3], 'stroke-width="1.4"', st)
        b += line([p[0] - nx * 3, p[1] - ny * 3], [q[0] - nx * 3, q[1] - ny * 3], 'stroke-width="1.4"', st)
        const steps = Math.max(2, Math.round(len / 7))
        for (let i = 0; i < steps; i++) {
          const s = (len * (i + 0.5)) / steps
          const cx0 = p[0] + ux * s
          const cy0 = p[1] + uy * s
          b += line([cx0 - nx * 5.5, cy0 - ny * 5.5], [cx0 + nx * 5.5, cy0 + ny * 5.5], 'stroke-width="1.1"', st)
        }
        continue
      }
      const aid = arrowId(c.stroke)
      const marks = (c.arrowStart ? ` marker-start="url(#${aid})"` : '') + (c.arrow ? ` marker-end="url(#${aid})"` : '')
      b += line(p, q, style + marks, c.stroke ?? '#111')
    } else if (c.t === 'right') {
      const o = at(c.o)
      const ua = at(c.a)
      const ub = at(c.b)
      const da: P = [(ua[0] - o[0]) / (Math.hypot(ua[0] - o[0], ua[1] - o[1]) || 1), (ua[1] - o[1]) / (Math.hypot(ua[0] - o[0], ua[1] - o[1]) || 1)]
      const db: P = [(ub[0] - o[0]) / (Math.hypot(ub[0] - o[0], ub[1] - o[1]) || 1), (ub[1] - o[1]) / (Math.hypot(ub[0] - o[0], ub[1] - o[1]) || 1)]
      const s = 10
      const p1: P = [o[0] + da[0] * s, o[1] + da[1] * s]
      const p2: P = [p1[0] + db[0] * s, p1[1] + db[1] * s]
      const p3: P = [o[0] + db[0] * s, o[1] + db[1] * s]
      b += `<path d="M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}" stroke="#111" fill="none" stroke-width="1.3"/>`
    } else if (c.t === 'angle') {
      const o = at(c.o)
      const a1 = Math.atan2(at(c.a)[1] - o[1], at(c.a)[0] - o[0])
      let a2 = Math.atan2(at(c.b)[1] - o[1], at(c.b)[0] - o[0])
      let d = a2 - a1
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      a2 = a1 + d
      const i = ring.get(c) ?? 0
      const r = c.radius !== undefined ? c.radius * k : 22 + i * 16
      const sweep = d > 0 ? 1 : 0
      b += `<path d="M${f1(o[0] + r * Math.cos(a1))} ${f1(o[1] + r * Math.sin(a1))}A${f1(r)} ${f1(r)} 0 0 ${sweep} ${f1(o[0] + r * Math.cos(a2))} ${f1(o[1] + r * Math.sin(a2))}" stroke="#111" fill="none" stroke-width="1.3"/>`
      if (c.text) {
        const mid = a1 + d / 2
        const rl = r + 14
        topText += text(o[0] + rl * Math.cos(mid), o[1] + rl * Math.sin(mid) + 5, c.text, 'middle', 18, `ang:${c.a}${c.o}${c.b}`, Boolean(c.italic))
      }
    } else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      // chữ kích thước không chồng chữ kích thước trước: đẩy xa thêm từng bậc
      let off = 18
      const anchor = Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle'
      const tw = c.text ? textWidthEm(c.text) * 16 : 0
      for (let lv = 0; lv < 4; lv++) {
        off = 18 + lv * 18
        const mx = (p[0] + q[0]) / 2 + n[0] * (off + 12)
        const my = (p[1] + q[1]) / 2 + n[1] * (off + 12)
        const x0 = anchor === 'start' ? mx : anchor === 'end' ? mx - tw : mx - tw / 2
        const box = { x0, x1: x0 + tw, y0: my - 10, y1: my + 10 }
        if (!dimBoxes.some((o) => box.x0 < o.x1 && o.x0 < box.x1 && box.y0 < o.y1 && o.y0 < box.y1) || lv === 3) {
          if (c.text) dimBoxes.push(box)
          break
        }
      }
      const p2: P = [p[0] + n[0] * off, p[1] + n[1] * off]
      const q2: P = [q[0] + n[0] * off, q[1] + n[1] * off]
      b += line([p[0] + n[0] * 4, p[1] + n[1] * 4], [p[0] + n[0] * (off + 5), p[1] + n[1] * (off + 5)], 'stroke-width="0.9"')
      b += line([q[0] + n[0] * 4, q[1] + n[1] * 4], [q[0] + n[0] * (off + 5), q[1] + n[1] * (off + 5)], 'stroke-width="0.9"')
      b += line(p2, q2, 'stroke-width="1.2" marker-start="url(#scarr)" marker-end="url(#scarr)"')
      if (c.text) {
        const mx = (p2[0] + q2[0]) / 2 + n[0] * 12
        const my = (p2[1] + q2[1]) / 2 + n[1] * 12 + 5
        topText += text(mx, my, c.text, Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle', 18, `dim:${c.a}${c.b}`)
      }
    } else if (c.t === 'label') {
      let p = at(c.a)
      let q = at(c.b)
      const len = Math.hypot(q[0] - p[0], q[1] - p[1])
      if (len > 0) {
        const dx = (q[0] - p[0]) / len
        const dy = (q[1] - p[1]) / len
        const from = solidShapes.filter((s) => s.o === c.a)
        const to = solidShapes.filter((s) => s.o === c.b)
        const edge = (ss: Shape[]) => Math.max(0, ...ss.map((s) => shapeEdge(s, dx, dy) * k).filter((e) => e < len * 0.98))
        const start = edge(from)
        const end = edge(to)
        if (start + end < len) {
          p = [p[0] + dx * start, p[1] + dy * start]
          q = [q[0] - dx * end, q[1] - dy * end]
        }
      }
      let n = outward(p, q)
      const alongSeg = (s: (typeof sprites)[number]) =>
        s.c.b !== undefined && ((s.c.a === c.a && s.c.b === c.b) || (s.c.a === c.b && s.c.b === c.a))
      const along = sprites.find(alongSeg)
      let off = 14
      if (along?.shifted) n = [-n[0], -n[1]]
      else if (along) off += along.hw * k
      let rotSvg = c.rotate ? -c.rotate : 0
      if (c.along) {
        let deg = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI
        if (deg > 90) deg -= 180
        if (deg <= -90) deg += 180
        rotSvg = deg
      }
      const baseMidX = (p[0] + q[0]) / 2
      const baseMidY = (p[1] + q[1]) / 2
      const hitsShape = (lx: number, ly: number) => solidShapes.some((s) => {
        const [sx, sy] = at(s.o)
        const d = Math.hypot(lx - sx, ly - sy)
        if (!d) return true
        return d < shapeEdge(s, (lx - sx) / d, (ly - sy) / d) * k + 10
      })
      if (hitsShape(baseMidX + n[0] * off, baseMidY + n[1] * off)) {
        if (!hitsShape(baseMidX - n[0] * off, baseMidY - n[1] * off)) n = [-n[0], -n[1]]
        else off += 12
      }
      const tw = textWidthEm(c.text) * 18
      const boxAt = (lx: number, ly: number) => ({ x0: lx - tw / 2 - 4, x1: lx + tw / 2 + 4, y0: ly - 11, y1: ly + 11 })
      const overlapDim = (lx: number, ly: number) => {
        const box = boxAt(lx, ly)
        return dimBoxes.some((o) => box.x0 < o.x1 && o.x0 < box.x1 && box.y0 < o.y1 && o.y0 < box.y1)
      }
      let lx = baseMidX + n[0] * off
      let ly = baseMidY + n[1] * off
      if (overlapDim(lx, ly)) {
        outer: for (const side of [1, -1]) {
          for (const t of [0.35, 0.65, 0.25, 0.75, 0.5]) {
            const cx0 = p[0] + (q[0] - p[0]) * t + n[0] * off * side
            const cy0 = p[1] + (q[1] - p[1]) * t + n[1] * off * side
            if (!hitsShape(cx0, cy0) && !overlapDim(cx0, cy0)) { lx = cx0; ly = cy0; break outer }
          }
        }
      }
      dimBoxes.push(boxAt(lx, ly))
      const anchor = rotSvg ? 'middle' : (Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle')
      topText += text(lx, ly + 5, c.text, anchor, 18, `lbl:${c.a}${c.b}`, Boolean(c.italic), rotSvg)
    }
  }

  // 5. Cung & hình tự do nổi trên nét (không có `nền`)
  for (const c of arcs) if (!c.bg) b += renderArcSvg(c)
  for (const c of shapes) if (!c.bg) b += renderShapeSvg(c)

  // 6. Chấm điểm & chấm tâm nút
  for (const c of shapes) {
    if (!c.centerDot) continue
    const [x, y] = at(c.o)
    b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.4" fill="#111111" stroke="none"/>`
  }
  for (const c of cmds) {
    if (c.t !== 'dot') continue
    const [x, y] = at(c.o)
    const st = c.stroke ? ` stroke="${c.stroke}" stroke-width="1.4"` : ' stroke="none"'
    b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${c.r}" fill="${c.fill}"${st}/>`
  }

  // 7. Nhãn trên hình tự do & chữ độc lập
  for (const c of labels) {
    const [lx0, ly0] = S(c.point)
    const x = lx0 + c.dx
    const y = ly0 + c.dy
    const start = y + c.size * 0.32 - (c.lines.length - 1) * c.step / 2
    const body = c.lines.length === 1 ? sceneRichText(c.lines[0]) : c.lines.map((s, i) =>
      `<tspan x="${f1(x)}" y="${f1(start + i * c.step)}">${sceneRichText(s)}</tspan>`).join('')
    const style = (c.solidLabel ? ' stroke="none"' : '') + (c.bold ? ' font-weight="bold"' : '') + (c.italic ? ' font-style="italic"' : '')
    const tr = c.rotate ? ` transform="rotate(${f1(-c.rotate)} ${f1(x)} ${f1(y)})"` : ''
    b += `<text x="${f1(x)}" y="${f1(start)}" ${FAM} font-size="${c.size}"${style} data-lbl="${c.id}"${tr} text-anchor="middle">${body}</text>`
  }

  // các nét đã vẽ, để nhãn điểm né
  const segs: [P, P][] = []
  for (const c of cmds) {
    if (c.t === 'seg' || c.t === 'ground') segs.push([at(c.a), at(c.b)])
    else if (c.t === 'arc' && c.kind === 'quạt' && c.sweep < 360) {
      const center = pts.get(c.o)!
      const o = S(center)
      segs.push([o, S(ellipseArcPoint(center, c.rx, c.ry, c.start, c.rotate ?? 0))], [o, S(ellipseArcPoint(center, c.rx, c.ry, c.start + c.sweep, c.rotate ?? 0))])
    } else if (c.t === 'right') {
      const o = at(c.o)
      const u = (n: string): P => {
        const q = at(n)
        const l = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1
        return [(q[0] - o[0]) / l, (q[1] - o[1]) / l]
      }
      const da = u(c.a)
      const db = u(c.b)
      const p1: P = [o[0] + da[0] * 10, o[1] + da[1] * 10]
      const p3: P = [o[0] + db[0] * 10, o[1] + db[1] * 10]
      const p2: P = [p1[0] + db[0] * 10, p1[1] + db[1] * 10]
      segs.push([p1, p2], [p2, p3])
    } else if (c.t === 'poly' || c.t === 'face') {
      c.names.forEach((n, i) => segs.push([at(n), at(c.names[(i + 1) % c.names.length])]))
    } else if (c.t === 'curve') {
      const ptsCurve = sampleCurveWorld(c.names.map((n) => pts.get(n)!), c.closed).map(S)
      for (let i = 1; i < ptsCurve.length; i++) segs.push([ptsCurve[i - 1], ptsCurve[i]])
    } else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      segs.push([[p[0] + n[0] * 18, p[1] + n[1] * 18], [q[0] + n[0] * 18, q[1] + n[1] * 18]])
    }
  }
  for (const s of sprites) {
    const c = s.corners.map(S)
    segs.push([c[0], c[2]], [c[1], c[3]], [c[2], c[3]], [c[0], c[1]])
  }
  const distSeg = (x: number, y: number, [p, q]: [P, P]) => {
    const dx = q[0] - p[0]
    const dy = q[1] - p[1]
    const t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (y - p[1]) * dy) / (dx * dx + dy * dy || 1)))
    return Math.hypot(x - p[0] - t * dx, y - p[1] - t * dy)
  }
  const placed: P[] = []

  // nhãn điểm: thử 8 hướng quanh điểm, chọn chỗ không đè nét / nhãn khác, ưu tiên phía ngoài tâm hình
  for (const [name, p] of pts) {
    if (name.startsWith('_')) continue
    if (shapes.some((s) => s.o === name && s.text && (s.node || s.text.trim() === name))) continue
    const [x, y] = S(p)
    let dx = x - cx
    let dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    for (const c of cmds) {
      if (c.t !== 'ground') continue
      const g1 = at(c.a)
      const g2 = at(c.b)
      const gl = Math.hypot(g2[0] - g1[0], g2[1] - g1[1]) || 1
      const dist = Math.abs((g2[0] - g1[0]) * (g1[1] - y) - (g1[0] - x) * (g2[1] - g1[1])) / gl
      if (dist > 2) continue
      const n = outward(g1, g2)
      const u: P = [(g2[0] - g1[0]) / gl, (g2[1] - g1[1]) / gl]
      const side = dx * u[0] + dy * u[1] >= 0 ? 1 : -1
      dx = -n[0] * 0.8 + u[0] * side * 0.6
      dy = -n[1] * 0.8 + u[1] * side * 0.6
    }
    const hatch: P[] = []
    for (const c of cmds) {
      if (c.t !== 'ground') continue
      const g1 = at(c.a)
      const g2 = at(c.b)
      if (distSeg(x, y, [g1, g2]) <= 2) hatch.push(outward(g1, g2))
    }
    let best: P = [x + dx * 13, y + dy * 13]
    let bestScore = Infinity
    for (let k = 0; k < 24; k++) {
      const a = ((k % 8) * Math.PI) / 4
      const ux = Math.cos(a)
      const uy = Math.sin(a)
      const rad = k < 8 ? 15 : k < 16 ? 23 : 31
      const lx = x + ux * rad
      const ly = y + uy * rad
      let score = -(ux * dx + uy * dy) * 2 + (k < 8 ? 0 : k < 16 ? 4 : 8)
      for (const n of hatch) if (ux * n[0] + uy * n[1] > 0.2) score += 40
      for (const sg of segs) {
        const d = distSeg(lx, ly, sg)
        if (d < 12) score += (12 - d) * 3
      }
      for (const [px0, py0] of placed) {
        const d = Math.hypot(lx - px0, ly - py0)
        if (d < 16) score += (16 - d) * 3
      }
      if (lx < 6 || lx > W - 6 || ly < 8 || ly > H - 4) score += 20
      if (score < bestScore - 1e-9) {
        bestScore = score
        best = [lx, ly]
      }
    }
    placed.push(best)
    b += text(best[0], best[1] + 5, name, 'middle', 19, `pt:${name}`, true, 0, true)
  }
  b += topText
  const vx = ext[0] < 0 ? Math.floor(ext[0] - 4) : 0, vy = ext[1] < 0 ? Math.floor(ext[1] - 4) : 0
  const vw = Math.ceil((ext[2] > W ? ext[2] + 4 : W) - vx), vh = Math.ceil((ext[3] > H ? ext[3] + 4 : H) - vy)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="${vx} ${vy} ${vw} ${vh}">${desc}<rect${vx || vy ? ` x="${vx}" y="${vy}"` : ''} width="100%" height="100%" fill="#fff"/>${b}</svg>`
  return { svg, width: vw, height: vh }
}
