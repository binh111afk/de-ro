/**
 * Dựng hình thêm trên mẫu (hình phẳng và hình không gian): mỗi dòng một lệnh,
 * gõ theo kiểu giáo viên vẫn viết trong đề. Điểm là chữ in hoa (có thể kèm số
 * hoặc dấu phẩy trên: A1, S').
 *
 *   M = trung điểm SC            N = SB 1/3   (SN = 1/3 SB)
 *   O = AC cắt BD                G = trọng tâm SAB
 *   H = hình chiếu S lên (ABCD)  K = hình chiếu A lên SB
 *   AM, MN, SO                   (nối đoạn; thêm "đứt"/"liền" để ép nét)
 *   vuông H S A                  (kí hiệu góc vuông tại H, giữa HS và HA)
 *   bằng SM MC                   (gạch đánh dấu các đoạn bằng nhau)
 *
 * Tính trên toạ độ thật (2 hoặc 3 chiều), không vẽ — renderer lo phần vẽ.
 */

export type Vec = number[]

export interface Construction {
  /** điểm mới, theo thứ tự dựng */
  points: Array<{ name: string; p: Vec }>
  /** đoạn nối: tên hai đầu + ép nét (undefined = tự tính) */
  segs: Array<{ a: string; b: string; dashed?: boolean }>
  /** góc vuông tại `at` giữa hai tia tới u, v */
  rights: Array<{ at: string; u: string; v: string }>
  /** nhóm đoạn bằng nhau */
  equals: Array<Array<[string, string]>>
  /** lỗi theo dòng (số dòng bắt đầu từ 1) */
  errors: Array<{ line: number; msg: string }>
}

const vsub = (a: Vec, b: Vec) => a.map((x, i) => x - b[i])
const vadd = (a: Vec, b: Vec) => a.map((x, i) => x + b[i])
const vmul = (a: Vec, k: number) => a.map((x) => x * k)
const vdot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i], 0)
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

const NAME = /[A-Z][0-9]*'*/g
const names = (s: string) => s.replace(/[′’]/g, "'").match(NAME) ?? []

function num(s: string): number | null {
  const m = s.replace(',', '.').match(/(-?\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/)
  if (!m) return null
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1])
  return Number.isFinite(v) ? v : null
}

/** giao (gần nhất) của hai đường a+s·u và c+t·v; null nếu song song */
function intersect(a: Vec, b: Vec, c: Vec, d: Vec): Vec | null {
  const u = vsub(b, a)
  const v = vsub(d, c)
  const w = vsub(c, a)
  const uu = vdot(u, u)
  const uv = vdot(u, v)
  const vv = vdot(v, v)
  const den = uu * vv - uv * uv
  if (Math.abs(den) < 1e-9 * uu * vv) return null
  const s = (vdot(w, u) * vv - vdot(w, v) * uv) / den
  return vadd(a, vmul(u, s))
}

function footLine(p: Vec, a: Vec, b: Vec): Vec {
  const u = vsub(b, a)
  return vadd(a, vmul(u, vdot(vsub(p, a), u) / vdot(u, u)))
}

function footPlane(p: Vec, a: Vec, b: Vec, c: Vec): Vec | null {
  const n = cross(vsub(b, a), vsub(c, a))
  const nn = vdot(n, n)
  if (nn < 1e-12) return null
  return vsub(p, vmul(n, vdot(vsub(p, a), n) / nn))
}

/**
 * `known`: tên → toạ độ các điểm đã có trên hình. Trả về các điểm/đoạn dựng
 * thêm; dòng lỗi được bỏ qua (các dòng khác vẫn vẽ).
 */
export function construct(text: string, known: Map<string, Vec>): Construction {
  const pts = new Map(known)
  const out: Construction = { points: [], segs: [], rights: [], equals: [], errors: [] }
  const dim = known.values().next().value?.length ?? 2

  text.split('\n').forEach((raw, idx) => {
    const line = idx + 1
    const s = raw.replace(/[′’]/g, "'").trim()
    if (!s || s.startsWith('#')) return
    const err = (msg: string) => out.errors.push({ line, msg })
    const get = (n: string) => {
      const p = pts.get(n)
      if (!p) err(`chưa có điểm ${n}`)
      return p
    }
    const lower = s.toLowerCase()

    // --- điểm mới: "M = ..." / "M là ..."
    const def = s.match(/^([A-Z][0-9]*'*)\s*(?:=|:|là\b)\s*(.+)$/)
    if (def) {
      const [, name, rhsRaw] = def
      const rhs = rhsRaw.trim()
      const r = rhs.toLowerCase()
      const ns = names(rhs)
      let p: Vec | null | undefined = null
      if (/trung điểm|^tđ|^mid/.test(r)) {
        const flat = ns
        if (flat.length !== 2) return err('trung điểm cần hai điểm, ví dụ: M = trung điểm SC')
        const [a, b] = [get(flat[0]), get(flat[1])]
        if (!a || !b) return
        p = vmul(vadd(a, b), 0.5)
      } else if (/trọng tâm|^tt\b/.test(r)) {
        if (ns.length < 2) return err('trọng tâm cần các đỉnh, ví dụ: G = trọng tâm ABC')
        const ps = ns.map(get)
        if (ps.some((q) => !q)) return
        p = vmul((ps as Vec[]).reduce((acc, q) => vadd(acc, q)), 1 / ps.length)
      } else if (/hình chiếu|^hc\b|chân/.test(r)) {
        const [from, ...target] = ns
        if (!from || target.length < 2) return err('ví dụ: H = hình chiếu S lên (ABCD) hoặc K = hình chiếu A lên SB')
        const P = get(from)
        const T = target.map(get)
        if (!P || T.some((q) => !q)) return
        const [a, b, c] = T as Vec[]
        if (target.length === 2) p = footLine(P, a, b)
        else if (dim < 3) p = footLine(P, a, b)
        else {
          p = footPlane(P, a, b, c)
          if (!p) return err('ba điểm của mặt phẳng thẳng hàng')
        }
      } else if (/cắt|∩|giao/.test(r)) {
        if (ns.length !== 4) return err('giao điểm cần hai đường, ví dụ: O = AC cắt BD')
        const q = ns.map(get)
        if (q.some((x) => !x)) return
        const [a, b, c, d] = q as Vec[]
        p = intersect(a, b, c, d)
        if (!p) return err('hai đường song song, không cắt nhau')
      } else if (ns.length === 2 && num(rhs.replace(NAME, ' ')) !== null) {
        const t = num(rhs.replace(NAME, ' '))!
        const [a, b] = [get(ns[0]), get(ns[1])]
        if (!a || !b) return
        p = vadd(a, vmul(vsub(b, a), t))
      } else {
        return err('không hiểu cách dựng (trung điểm, trọng tâm, hình chiếu, cắt, hoặc "SB 1/3")')
      }
      if (!p) return
      if (known.has(name)) return err(`điểm ${name} đã có trên hình`)
      pts.set(name, p)
      const at = out.points.findIndex((q) => q.name === name)
      if (at >= 0) out.points[at] = { name, p }
      else out.points.push({ name, p })
      return
    }

    // --- góc vuông
    if (/^(vuông|⊥|goc vuong|góc vuông)/.test(lower)) {
      const ns = names(s)
      if (ns.length !== 3) return err('ví dụ: vuông H S A (góc vuông tại H giữa HS, HA)')
      if (!ns.every((n) => get(n))) return
      out.rights.push({ at: ns[0], u: ns[1], v: ns[2] })
      return
    }

    // --- đoạn bằng nhau
    if (/^(bằng|=)/.test(lower)) {
      const pairs = s.replace(/^(bằng|=)/i, '').split(/[\s,;]+/).filter(Boolean).map(names)
      if (pairs.length < 2 || pairs.some((p) => p.length !== 2)) return err('ví dụ: bằng SM MC')
      if (!pairs.flat().every((n) => get(n))) return
      out.equals.push(pairs.map((p) => [p[0], p[1]] as [string, string]))
      return
    }

    // --- nối đoạn: "AM, MN đứt"
    const dashed = /(^|\s)(đứt|dut)(\s|$)/.test(lower) ? true : /(^|\s)(liền|lien)(\s|$)/.test(lower) ? false : undefined
    const groups = s.replace(/(^|\s)(đứt|liền|dut|lien|nối|noi)(?=\s|$)/gi, ' ').split(/[\s,;]+/).filter(Boolean)
    if (!groups.length) return
    for (const g of groups) {
      const ns = names(g)
      if (ns.join('') !== g || ns.length < 2) return err(`không hiểu "${g}" — đoạn ghi liền hai tên điểm, ví dụ AM`)
      if (!ns.every((n) => get(n))) return
      // "SAB" = các đoạn SA, AB (đường gấp khúc)
      for (let i = 0; i + 1 < ns.length; i++) out.segs.push({ a: ns[i], b: ns[i + 1], dashed })
    }
  })
  return out
}
