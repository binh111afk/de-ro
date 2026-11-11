/**
 * Nhận dạng hình từ nét vẽ tay (giữ bút yên cuối nét để nắn).
 * Đường thẳng, tam giác, chữ nhật, thoi, elip. Đơn giản hoá đường bằng Ramer–Douglas–Peucker.
 */
import type { Pt } from './scene'

export type Shape =
  | { kind: 'line'; points: Pt[] } // toạ độ cảnh; điểm đầu = điểm cuối nếu là đa giác kín
  | { kind: 'rectangle' | 'ellipse' | 'diamond'; x: number; y: number; w: number; h: number }

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

function segDist(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const l = dx * dx + dy * dy
  const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

function rdp(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts
  let idx = 0, max = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = segDist(pts[i], pts[0], pts[pts.length - 1])
    if (d > max) { max = d; idx = i }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]]
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
}

/** bỏ đỉnh gần như thẳng hàng hoặc quá sát nhau trên đa giác kín */
function cleanPolygon(v: Pt[], minLen: number): Pt[] {
  let out = v.slice()
  let changed = true
  while (changed && out.length > 3) {
    changed = false
    for (let i = 0; i < out.length; i++) {
      const a = out[(i - 1 + out.length) % out.length], b = out[i], c = out[(i + 1) % out.length]
      const ang = Math.abs(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(a[1] - b[1], a[0] - b[0]))
      const turn = Math.min(ang, Math.PI * 2 - ang) // 180° = thẳng hàng
      if (turn > (155 * Math.PI) / 180 || dist(a, b) < minLen) {
        out = out.filter((_, j) => j !== i)
        changed = true
        break
      }
    }
  }
  return out
}

function snapAngle(a: Pt, b: Pt): Pt {
  const len = dist(a, b)
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
  const step = Math.PI / 4
  const snapped = Math.round(ang / step) * step
  const use = Math.abs(snapped - ang) < (7 * Math.PI) / 180 ? snapped : ang
  return [a[0] + len * Math.cos(use), a[1] + len * Math.sin(use)]
}

export function recognize(pts: Pt[]): Shape | null {
  if (pts.length < 5) return null
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity, len = 0
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i]
    x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y)
    if (i) len += dist(pts[i - 1], pts[i])
  }
  const w = x2 - x1, h = y2 - y1, diag = Math.hypot(w, h)
  if (diag < 12) return null
  const a = pts[0], b = pts[pts.length - 1]

  // đường thẳng: gần như không lệch khỏi dây cung
  const chord = dist(a, b)
  if (chord / len > 0.85) {
    let dev = 0
    for (const p of pts) dev = Math.max(dev, segDist(p, a, b))
    if (dev < Math.max(6, chord * 0.07)) return { kind: 'line', points: [a, snapAngle(a, b)] }
  }

  const closed = chord < Math.max(18, Math.max(w, h) * 0.25)
  if (!closed) return null

  // đa giác
  const poly = cleanPolygon(rdp(pts, diag * 0.06).slice(0, -1), diag * 0.12)

  // elip: khoảng cách chuẩn hoá tới tâm khung gần như không đổi
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = w / 2 || 1, ry = h / 2 || 1
  const ds = pts.map(([x, y]) => Math.hypot((x - cx) / rx, (y - cy) / ry))
  const mean = ds.reduce((s, d) => s + d, 0) / ds.length
  const std = Math.sqrt(ds.reduce((s, d) => s + (d - mean) ** 2, 0) / ds.length)
  if (poly.length >= 5 || (std < 0.09 && poly.length !== 3)) {
    if (std < 0.16) return { kind: 'ellipse', x: x1, y: y1, w, h }
    return null
  }

  if (poly.length === 3) return { kind: 'line', points: [...poly, poly[0]] }

  if (poly.length === 4) {
    // thoi: các đỉnh nằm gần trung điểm các cạnh khung
    const mids: Pt[] = [[cx, y1], [x2, cy], [cx, y2], [x1, cy]]
    if (poly.every((p) => mids.some((m) => dist(p, m) < diag * 0.15))) return { kind: 'diamond', x: x1, y: y1, w, h }
    // chữ nhật thẳng trục
    const corners: Pt[] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
    if (poly.every((p) => corners.some((c) => dist(p, c) < diag * 0.15))) return { kind: 'rectangle', x: x1, y: y1, w, h }
    // tứ giác xiên
    return { kind: 'line', points: [...poly, poly[0]] }
  }
  return null
}
