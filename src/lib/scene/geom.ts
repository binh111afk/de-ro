import type { P } from './types'

export function wrapDegrees(angle: number): number {
  const rem = angle % 360
  return rem < 0 ? rem + 360 : rem
}

export function direction(angle: number): P {
  const deg = wrapDegrees(angle)
  if (deg === 0) return [1, 0]
  if (deg === 90) return [0, 1]
  if (deg === 180) return [-1, 0]
  if (deg === 270) return [0, -1]
  const rad = deg * Math.PI / 180
  return [Math.cos(rad), Math.sin(rad)]
}

export function rotateVec([x, y]: P, deg: number): P {
  if (!deg) return [x, y]
  const rad = deg * Math.PI / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return [x * c - y * s, x * s + y * c]
}

export function ellipseArcPoint([ox, oy]: P, rx: number, ry: number, angle: number, rot = 0): P {
  const [ux, uy] = direction(angle)
  const [lx, ly] = rotateVec([rx * ux, ry * uy], rot)
  return [ox + lx, oy + ly]
}

/** tách "ABC" / "A'B" / "A1B" thành tên điểm có trong bảng */
export function splitNames(s: string, pts: Map<string, P>, line: number): string[] {
  // điểm khai báo ẩn nhãn (_A) mà lệnh viết thiếu dấu _ (AB) vẫn hiểu là _A, trừ khi có sẵn điểm A
  const alias = new Map<string, string>()
  for (const n of pts.keys()) if (n.startsWith('_') && n.length > 1 && !pts.has(n.slice(1))) alias.set(n.slice(1), n)
  const real = (n: string) => (pts.has(n) ? n : alias.get(n))
  // viết tách "_G-_K" hoặc "A1-B2": mỗi phần là một tên
  if (s.includes('-'))
    return s.split('-').map((n) => {
      const r = real(n)
      if (!r) throw new Error(`Dòng ${line}: chưa khai báo điểm "${n}"`)
      return r
    })
  const out: string[] = []
  let i = 0
  while (i < s.length) {
    // tên dài nhất khớp trước (A1, A', _M…)
    let hit = ''
    for (const n of [...pts.keys(), ...alias.keys()]) if (s.startsWith(n, i) && n.length > hit.length) hit = n
    if (!hit) throw new Error(`Dòng ${line}: chưa khai báo điểm "${s.slice(i)}"`)
    out.push(real(hit) as string)
    i += hit.length
  }
  return out
}

export function parseSweep(from: number, to: number): { start: number; sweep: number } {
  const start = wrapDegrees(from)
  const delta = to - from
  let sweep: number
  if (delta >= 360) sweep = 360
  else if (delta >= 0) sweep = delta
  else sweep = wrapDegrees(Number.isFinite(delta) ? delta : wrapDegrees(to) - start) || 360
  return { start, sweep }
}
