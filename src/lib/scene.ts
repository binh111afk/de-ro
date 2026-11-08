/**
 * Hình thực tế nét đơn (gấp giấy, thang dựa tường, đo chiều cao, mảnh vườn…): khung hình học
 * + mũi tên kích thước + kí hiệu góc + nét đứt + mặt đất / tường gạch chéo. Nét đen trắng như đề in.
 *
 * Mỗi dòng một lệnh (toạ độ trục y hướng lên):
 *   A(0; 0) B(4; 0) C(4; 3)        khai báo điểm (tên bắt đầu bằng "_" thì không ghi nhãn)
 *   AB, BC, CA                     đoạn thẳng;  ABCD = đa giác khép kín
 *   đứt MN                         đoạn nét đứt
 *   kích thước AB "15 cm"          mũi tên hai đầu song song AB, ghi chữ (đặt phía ngoài hình)
 *   góc ABC "60°"                  cung góc tại B;  vuông ABC = kí hiệu góc vuông tại B
 *   nhãn AB "?"                    chữ ở giữa đoạn AB (không vẽ đoạn)
 *   đất AB / tường AB              gạch chéo dưới đoạn (mặt đất) hoặc bên cạnh (bức tường)
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10

export interface SceneSpec {
  /** các lệnh, mỗi dòng một lệnh */
  text: string
}

type P = [number, number]
type Cmd =
  | { t: 'seg'; a: string; b: string; dashed: boolean }
  | { t: 'poly'; names: string[] }
  | { t: 'dim'; a: string; b: string; text: string }
  | { t: 'angle'; a: string; o: string; b: string; text: string }
  | { t: 'right'; a: string; o: string; b: string }
  | { t: 'label'; a: string; b: string; text: string }
  | { t: 'ground'; a: string; b: string; wall: boolean }

const NUM = String.raw`(-?\d+(?:[.,]\d+)?)`
const toNum = (s: string) => Number(s.replace(',', '.'))
/** tách "ABC" / "A'B" / "A1B" thành tên điểm có trong bảng */
function splitNames(s: string, pts: Map<string, P>, line: number): string[] {
  // viết tách "_G-_K" hoặc "A1-B2": mỗi phần là một tên
  if (s.includes('-'))
    return s.split('-').map((n) => {
      if (!pts.has(n)) throw new Error(`Dòng ${line}: chưa khai báo điểm "${n}"`)
      return n
    })
  const out: string[] = []
  let i = 0
  while (i < s.length) {
    // tên dài nhất khớp trước (A1, A', _M…)
    let hit = ''
    for (const n of pts.keys()) if (s.startsWith(n, i) && n.length > hit.length) hit = n
    if (!hit) throw new Error(`Dòng ${line}: chưa khai báo điểm "${s.slice(i)}"`)
    out.push(hit)
    i += hit.length
  }
  return out
}

export function parseScene(text: string): { pts: Map<string, P>; cmds: Cmd[] } {
  const pts = new Map<string, P>()
  const cmds: Cmd[] = []
  const lines = text.split('\n')
  // lượt 1: điểm (để lệnh viết trước điểm vẫn đọc được)
  const pointRe = new RegExp(String.raw`([A-Z_][A-Za-z0-9_']*)\s*\(\s*${NUM}\s*;\s*${NUM}\s*\)`, 'g')
  lines.forEach((l) => {
    for (const m of l.matchAll(pointRe)) pts.set(m[1], [toNum(m[2]), toNum(m[3])])
  })
  if (pts.size < 2) throw new Error('Cần ít nhất 2 điểm, vd. A(0; 0) B(4; 0)')
  lines.forEach((raw, idx) => {
    const line = idx + 1
    const l = raw.replace(pointRe, '').trim().replace(/^[,;]+|[,;]+$/g, '').trim()
    if (!l) return
    const quoted = l.match(/"([^"]*)"|“([^”]*)”/)
    const q = quoted ? (quoted[1] ?? quoted[2] ?? '') : ''
    const head = l.replace(/"[^"]*"|“[^”]*”/, '').trim()
    const m = head.match(/^(\S+(?:\s+(?:vuông|thước|đứt))?)\s+([A-Za-z0-9_'-]+)$/u)
    const kw = (m?.[1] ?? '').toLowerCase()
    const two = (arg: string) => {
      const n = splitNames(arg, pts, line)
      if (n.length !== 2) throw new Error(`Dòng ${line}: cần đúng 2 điểm, vd. AB`)
      return n
    }
    const three = (arg: string) => {
      const n = splitNames(arg, pts, line)
      if (n.length !== 3) throw new Error(`Dòng ${line}: cần đúng 3 điểm, vd. ABC (đỉnh ở giữa)`)
      return n
    }
    if (m && /^(kích thước|kt)$/.test(kw)) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'dim', a, b, text: q })
    } else if (m && /^(góc vuông|vuông)$/.test(kw)) {
      const [a, o, b] = three(m[2])
      cmds.push({ t: 'right', a, o, b })
    } else if (m && kw === 'góc') {
      const [a, o, b] = three(m[2])
      cmds.push({ t: 'angle', a, o, b, text: q })
    } else if (m && kw === 'nhãn') {
      const [a, b] = two(m[2])
      cmds.push({ t: 'label', a, b, text: q || '?' })
    } else if (m && (kw === 'đứt' || kw === 'nét đứt')) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'seg', a, b, dashed: true })
    } else if (m && (kw === 'đất' || kw === 'tường')) {
      const [a, b] = two(m[2])
      cmds.push({ t: 'ground', a, b, wall: kw === 'tường' })
    } else {
      // danh sách đoạn / đa giác: "AB, BC" hoặc "ABCD"
      for (const part of head.split(/[,;]\s*|\s+/).filter(Boolean)) {
        const dashed = part.endsWith('*')
        const n = splitNames(part.replace(/\*$/, ''), pts, line)
        if (n.length === 2) cmds.push({ t: 'seg', a: n[0], b: n[1], dashed })
        else if (n.length >= 3) cmds.push({ t: 'poly', names: n })
        else throw new Error(`Dòng ${line}: không hiểu "${part}"`)
      }
    }
  })
  return { pts, cmds }
}

export function renderSceneSvg(spec: SceneSpec, desc: string): { svg: string; width: number; height: number } {
  const { pts, cmds } = parseScene(spec.text)
  const xs = [...pts.values()].map((p) => p[0])
  const ys = [...pts.values()].map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const k = Math.min(300 / spanX, 230 / spanY)
  const pad = 62
  const W = Math.round(spanX * k + pad * 2)
  const H = Math.round(spanY * k + pad * 2)
  const S = ([x, y]: P): P => [pad + (x - minX) * k, H - pad - (y - minY) * k]
  const at = (n: string) => S(pts.get(n)!)
  // tâm hình: để đặt kích thước / nhãn điểm ra phía ngoài
  const cx = [...pts.values()].reduce((s, p) => s + S(p)[0], 0) / pts.size
  const cy = [...pts.values()].reduce((s, p) => s + S(p)[1], 0) / pts.size

  let b = `<defs><marker id="scarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`
  const line = (p: P, q: P, extra = '') => `<path d="M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}" stroke="#111" fill="none" ${extra}/>`
  const text = (x: number, y: number, s: string, anchor = 'middle', size = 15) =>
    `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`
  /** pháp tuyến đơn vị của PQ hướng ra xa tâm hình */
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

  // mặt đất / tường trước (nằm dưới các nét khác)
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

  for (const c of cmds) {
    if (c.t === 'poly') {
      const d = c.names.map((n, i) => `${i ? 'L' : 'M'}${f1(at(n)[0])} ${f1(at(n)[1])}`).join('') + 'Z'
      b += `<path d="${d}" stroke="#111" fill="none" stroke-width="1.6" stroke-linejoin="round"/>`
    } else if (c.t === 'seg') {
      b += line(at(c.a), at(c.b), c.dashed ? 'stroke-width="1.2" stroke-dasharray="5 4"' : 'stroke-width="1.6"')
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
      b += `<path d="M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}L${f1(p3[0])} ${f1(p3[1])}" stroke="#111" fill="none" stroke-width="1"/>`
    } else if (c.t === 'angle') {
      const o = at(c.o)
      const a1 = Math.atan2(at(c.a)[1] - o[1], at(c.a)[0] - o[0])
      let a2 = Math.atan2(at(c.b)[1] - o[1], at(c.b)[0] - o[0])
      // cung nhỏ (< 180°)
      let d = a2 - a1
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      a2 = a1 + d
      const r = 22
      const sweep = d > 0 ? 1 : 0
      b += `<path d="M${f1(o[0] + r * Math.cos(a1))} ${f1(o[1] + r * Math.sin(a1))}A${r} ${r} 0 0 ${sweep} ${f1(o[0] + r * Math.cos(a2))} ${f1(o[1] + r * Math.sin(a2))}" stroke="#111" fill="none" stroke-width="1"/>`
      if (c.text) {
        const mid = a1 + d / 2
        b += text(o[0] + 36 * Math.cos(mid), o[1] + 36 * Math.sin(mid) + 5, c.text, 'middle', 14)
      }
    } else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      const off = 18
      const p2: P = [p[0] + n[0] * off, p[1] + n[1] * off]
      const q2: P = [q[0] + n[0] * off, q[1] + n[1] * off]
      // vạch gióng
      b += line([p[0] + n[0] * 4, p[1] + n[1] * 4], [p[0] + n[0] * (off + 5), p[1] + n[1] * (off + 5)], 'stroke-width="0.8"')
      b += line([q[0] + n[0] * 4, q[1] + n[1] * 4], [q[0] + n[0] * (off + 5), q[1] + n[1] * (off + 5)], 'stroke-width="0.8"')
      b += line(p2, q2, 'stroke-width="1" marker-start="url(#scarr)" marker-end="url(#scarr)"')
      if (c.text) {
        const mx = (p2[0] + q2[0]) / 2 + n[0] * 12
        const my = (p2[1] + q2[1]) / 2 + n[1] * 12 + 5
        b += text(mx, my, c.text, Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle', 14)
      }
    } else if (c.t === 'label') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      b += text((p[0] + q[0]) / 2 + n[0] * 14, (p[1] + q[1]) / 2 + n[1] * 14 + 5, c.text, Math.abs(n[0]) > 0.7 ? (n[0] > 0 ? 'start' : 'end') : 'middle')
    }
  }

  // các nét đã vẽ, để nhãn điểm né (đoạn, cạnh đa giác, mặt đất, mũi tên kích thước)
  const segs: [P, P][] = []
  for (const c of cmds) {
    if (c.t === 'seg' || c.t === 'ground') segs.push([at(c.a), at(c.b)])
    else if (c.t === 'right') {
      // kí hiệu góc vuông: hai cạnh ô vuông 10px
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
    }
    else if (c.t === 'poly') c.names.forEach((n, i) => segs.push([at(n), at(c.names[(i + 1) % c.names.length])]))
    else if (c.t === 'dim') {
      const p = at(c.a)
      const q = at(c.b)
      const n = outward(p, q)
      segs.push([[p[0] + n[0] * 18, p[1] + n[1] * 18], [q[0] + n[0] * 18, q[1] + n[1] * 18]])
    }
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
    const [x, y] = S(p)
    let dx = x - cx
    let dy = y - cy
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    // điểm nằm trên mặt đất / tường: đẩy nhãn sang phía không gạch chéo
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
    // phía có gạch chéo của mặt đất / tường mà điểm nằm trên: không đặt nhãn vào đó
    const hatch: P[] = []
    for (const c of cmds) {
      if (c.t !== 'ground') continue
      const g1 = at(c.a)
      const g2 = at(c.b)
      if (distSeg(x, y, [g1, g2]) <= 2) hatch.push(outward(g1, g2))
    }
    let best: P = [x + dx * 13, y + dy * 13]
    let bestScore = Infinity
    for (let k = 0; k < 16; k++) {
      const a = ((k % 8) * Math.PI) / 4
      const ux = Math.cos(a)
      const uy = Math.sin(a)
      // tâm chữ (chữ cao ~11px, rộng ~9px/kí tự); vòng ngoài xa hơn, phạt nhẹ
      const rad = k < 8 ? 14 : 22
      const lx = x + ux * rad
      const ly = y + uy * rad
      let score = -(ux * dx + uy * dy) * 2 + (k < 8 ? 0 : 4)
      for (const n of hatch) if (ux * n[0] + uy * n[1] > 0.2) score += 40
      for (const sg of segs) {
        const d = distSeg(lx, ly, sg)
        if (d < 10) score += (10 - d) * 3
      }
      for (const [px, py] of placed) {
        const d = Math.hypot(lx - px, ly - py)
        if (d < 16) score += (16 - d) * 3
      }
      if (lx < 6 || lx > W - 6 || ly < 8 || ly > H - 4) score += 20
      if (score < bestScore - 1e-9) {
        bestScore = score
        best = [lx, ly]
      }
    }
    placed.push(best)
    b += text(best[0], best[1] + 5, name, 'middle', 15)
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${b}</svg>`
  return { svg, width: W, height: H }
}

export const SCENE_DEFAULT: SceneSpec = {
  text: [
    '_G(-1; 0) _K(5; 0) A(0; 0) B(4; 0) C(0; 3)',
    'đất _G-_K',
    'tường AC',
    'CB',
    'vuông CAB',
    'góc CBA "60°"',
    'kích thước AB "x"',
    'nhãn CB "5 m"',
    'nhãn AC "?"',
  ].join('\n'),
}

export const SCENE_HELP = [
  {
    group: 'Điểm, đoạn',
    items: [
      { code: 'A(0; 0) B(4; 0)', what: 'Khai báo điểm (trục y hướng lên)' },
      { code: '_M(1; 2)', what: 'Điểm không ghi tên; nối bằng gạch: _M-_N' },
      { code: 'AB, BC', what: 'Đoạn thẳng' },
      { code: 'ABCD', what: 'Đa giác khép kín' },
      { code: 'đứt MN', what: 'Đoạn nét đứt (nếp gấp, tia nhìn)' },
    ],
  },
  {
    group: 'Kí hiệu',
    items: [
      { code: 'kích thước AB "15 cm"', what: 'Mũi tên hai đầu, ghi chữ, đặt phía ngoài hình' },
      { code: 'góc ABC "60°"', what: 'Cung góc tại đỉnh B' },
      { code: 'vuông ABC', what: 'Kí hiệu góc vuông tại B' },
      { code: 'nhãn AB "?"', what: 'Chữ cạnh đoạn AB (cạnh cần tìm)' },
      { code: 'đất AB / tường AB', what: 'Gạch chéo mặt đất / bức tường' },
    ],
  },
]
