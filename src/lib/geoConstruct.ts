/**
 * Dựng hình thêm trên mẫu (hình phẳng và hình không gian): mỗi dòng một lệnh,
 * gõ theo kiểu giáo viên vẫn viết trong đề. Điểm là chữ in hoa (có thể kèm số
 * hoặc dấu phẩy trên: A1, S'). Danh sách lệnh đầy đủ: GEO_HELP (dưới cùng).
 *
 * Tính trên toạ độ thật (2 hoặc 3 chiều), không vẽ — renderer lo phần vẽ.
 * Điểm phụ không tên (đầu mút đường trung trực, trung điểm ẩn) có tên bắt đầu
 * bằng "#" và `hidden: true` — không ghi nhãn, không chấm.
 */

export type Vec = number[]

export interface Construction {
  /** điểm mới, theo thứ tự dựng */
  points: Array<{ name: string; p: Vec; hidden?: boolean }>
  /** tên điểm khai báo trực tiếp theo toạ độ A(x; y) */
  coords: string[]
  /** đoạn nối: tên hai đầu + ép nét (undefined = tự tính) */
  segs: Array<{ a: string; b: string; dashed?: boolean }>
  /** đoạn kéo dài (hình phẳng): 'both' = đường BC kéo dài, 'end' = tia BC */
  extends: Array<{ a: string; b: string; mode: 'both' | 'end'; dashed?: boolean }>
  /** nhãn ghi trên cạnh: nhãn AB "4 km" */
  labels: Array<{ a: string; b: string; text: string }>
  /** đường kích thước: kích thước BC "7 km" */
  dims: Array<{ a: string; b: string; text: string; side?: 'up' | 'down' | 'left' | 'right' }>
  /** góc vuông tại `at` giữa hai tia tới u, v */
  rights: Array<{ at: string; u: string; v: string }>
  /** nhóm đoạn bằng nhau */
  equals: Array<Array<[string, string]>>
  /** đường tròn (chỉ hình phẳng) */
  circles: Array<{ c: Vec; r: number }>
  /** đa giác tô nhạt (thiết diện, mặt phẳng) */
  fills: string[][]
  /** lỗi theo dòng (số dòng bắt đầu từ 1) */
  errors: Array<{ line: number; msg: string }>
}

const vsub = (a: Vec, b: Vec) => a.map((x, i) => x - b[i])
const vadd = (a: Vec, b: Vec) => a.map((x, i) => x + b[i])
const vmul = (a: Vec, k: number) => a.map((x) => x * k)
const vdot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i], 0)
const vlen = (a: Vec) => Math.sqrt(vdot(a, a))
const to3 = (a: Vec): Vec => [a[0], a[1], a[2] ?? 0]
const cross = (a: Vec, b: Vec): Vec => {
  const [p, q] = [to3(a), to3(b)]
  return [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]]
}

const NAME = /[A-Z][0-9]*'*/g
const names = (s: string) => s.replace(/[′’]/g, "'").match(NAME) ?? []

function num(s: string): number | null {
  const m = s.replace(',', '.').match(/(-?\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?/)
  if (!m) return null
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1])
  return Number.isFinite(v) ? v : null
}

function parseNumStrict(s: string): number | null {
  const t = s.trim().replace(/[−–]/g, '-').replace(',', '.')
  const m = /^(-?\d+(?:\.\d+)?)(?:\s*\/\s*(-?\d+(?:\.\d+)?))?$/.exec(t)
  if (!m) return null
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1])
  return Number.isFinite(v) ? v : null
}

function parseCoordPair(inner: string): [number, number] | null {
  const parts = inner.includes(';') ? inner.split(';') : inner.split(',')
  if (parts.length !== 2) return null
  const x = parseNumStrict(parts[0])
  const y = parseNumStrict(parts[1])
  return x !== null && y !== null ? [x, y] : null
}

const COORD_HEAD = /^[A-Z][0-9]*'*\s*(?:=\s*)?\(/
const COORD_ONE = /([A-Z][0-9]*'*)\s*(?:=\s*)?\(([^()]*)\)/g
const cleanConstructLine = (raw: string) =>
  raw.replace(/[′’]/g, "'").replace(/\s*\/\/\s*kéo\s*$/i, '').replace(/\s+/g, ' ').trim()

function parseCoordLine(s: string): { items: Array<{ name: string; p: [number, number] }>; error?: string } | null {
  if (!COORD_HEAD.test(s)) return null
  const items: Array<{ name: string; p: [number, number] }> = []
  const re = new RegExp(COORD_ONE.source, 'g')
  let rest = ''
  let last = 0
  for (const m of s.matchAll(re)) {
    const idx = m.index ?? 0
    rest += s.slice(last, idx)
    last = idx + m[0].length
    const p = parseCoordPair(m[2])
    if (!p) return { items: [], error: `toạ độ ${m[1]} không hợp lệ — ví dụ: ${m[1]}(0; 4) hoặc M(2,5; 0)` }
    items.push({ name: m[1], p })
  }
  rest += s.slice(last)
  if (!items.length || rest.replace(/[\s,;]+/g, '').length > 0) {
    return { items: [], error: 'ví dụ: A(0; 4) hoặc A = (0; 4) hoặc M(2,5; 0)' }
  }
  return { items }
}

/** đọc trước các lệnh khai báo toạ độ A(x; y) để ghi đè đỉnh mẫu trước khi dựng */
export function extractCoords(text: string): Map<string, [number, number]> {
  const map = new Map<string, [number, number]>()
  for (const raw of text.split('\n')) {
    const s = cleanConstructLine(raw)
    if (!s || s.startsWith('//')) continue
    const parsed = parseCoordLine(s)
    if (parsed && !parsed.error) for (const it of parsed.items) map.set(it.name, it.p)
  }
  return map
}

const SIDE_MAP: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  trên: 'up',
  tren: 'up',
  dưới: 'down',
  duoi: 'down',
  trái: 'left',
  trai: 'left',
  phải: 'right',
  phai: 'right',
}

/** giao (gần nhất) của hai đường a+s·u và c+t·v; null nếu song song */
function intersectDir(a: Vec, u: Vec, c: Vec, v: Vec): Vec | null {
  const w = vsub(c, a)
  const uu = vdot(u, u)
  const uv = vdot(u, v)
  const vv = vdot(v, v)
  const den = uu * vv - uv * uv
  if (Math.abs(den) < 1e-9 * uu * vv) return null
  const s = (vdot(w, u) * vv - vdot(w, v) * uv) / den
  return vadd(a, vmul(u, s))
}
const intersect = (a: Vec, b: Vec, c: Vec, d: Vec) => intersectDir(a, vsub(b, a), c, vsub(d, c))

function footLine(p: Vec, a: Vec, b: Vec): Vec {
  const u = vsub(b, a)
  return vadd(a, vmul(u, vdot(vsub(p, a), u) / vdot(u, u)))
}

function footPlane(p: Vec, a: Vec, b: Vec, c: Vec): Vec | null {
  const n = cross(vsub(b, a), vsub(c, a))
  const nn = vdot(n, n)
  if (nn < 1e-12) return null
  return vsub(p, vmul(n, vdot(vsub(to3(p), to3(a)), n) / nn)).slice(0, p.length)
}

/** tâm ngoại tiếp tam giác (2 hoặc 3 chiều) */
function circumcenter(A: Vec, B: Vec, C: Vec): Vec | null {
  const a = vsub(to3(A), to3(C))
  const b = vsub(to3(B), to3(C))
  const axb = cross(a, b)
  const d = 2 * vdot(axb, axb)
  if (d < 1e-12) return null
  const t = cross(vsub(vmul(b, vdot(a, a)), vmul(a, vdot(b, b))), axb)
  return vadd(to3(C), vmul(t, 1 / d)).slice(0, A.length)
}

function incenter(A: Vec, B: Vec, C: Vec): Vec {
  const a = vlen(vsub(B, C))
  const b = vlen(vsub(A, C))
  const c = vlen(vsub(A, B))
  return vmul(vadd(vadd(vmul(A, a), vmul(B, b)), vmul(C, c)), 1 / (a + b + c))
}

/** hướng vuông góc với BC, nằm trong mặt phẳng chứa BC và điểm `p` (2D: quay 90°) */
function perpDir(p: Vec | null, B: Vec, C: Vec): Vec | null {
  const u = vsub(C, B)
  if (B.length === 2) return [-u[1], u[0]]
  if (!p) return null
  const d = vsub(p, footLine(p, B, C))
  return vlen(d) < 1e-9 ? null : d
}

export interface ConstructOptions {
  /** tam giác mặc định cho "trung tuyến AM", "đường cao AH"… khi không ghi "trong ABC" */
  triangle?: string[]
}

/**
 * `known`: tên → toạ độ các điểm đã có trên hình. Trả về các điểm/đoạn dựng
 * thêm; dòng lỗi được bỏ qua (các dòng khác vẫn vẽ).
 */
export function construct(text: string, known: Map<string, Vec>, opts: ConstructOptions = {}): Construction {
  const pts = new Map(known)
  const out: Construction = {
    points: [],
    coords: [],
    segs: [],
    extends: [],
    labels: [],
    dims: [],
    rights: [],
    equals: [],
    circles: [],
    fills: [],
    errors: [],
  }
  const dim = known.values().next().value?.length ?? 2
  let hid = 0

  const addPoint = (name: string, p: Vec, hidden = false) => {
    pts.set(name, p)
    const at = out.points.findIndex((q) => q.name === name)
    if (at >= 0) out.points[at] = { name, p, hidden }
    else out.points.push({ name, p, hidden })
  }
  const hidden = (p: Vec) => {
    const n = `#${++hid}`
    addPoint(n, p, true)
    return n
  }
  const seg = (a: string, b: string, dashed?: boolean) => out.segs.push({ a, b, dashed })

  text.split('\n').forEach((raw, idx) => {
    const line = idx + 1
    const s = cleanConstructLine(raw)
    if (!s || s.startsWith('//')) return
    const err = (msg: string) => {
      out.errors.push({ line, msg })
    }
    const get = (n: string) => {
      const p = pts.get(n)
      if (!p) err(`chưa có điểm ${n}`)
      return p
    }
    const getAll = (ns: string[]) => {
      const ps = ns.map((n) => pts.get(n))
      const miss = ns.find((_, i) => !ps[i])
      if (miss) {
        err(`chưa có điểm ${miss}`)
        return null
      }
      return ps as Vec[]
    }
    const fresh = (n: string) => {
      if (known.has(n)) {
        err(`điểm ${n} đã có trên hình — đặt tên khác`)
        return false
      }
      return true
    }

    // ---------- điểm theo toạ độ: A(0; 4) hoặc A = (0; 4)
    const coordParsed = parseCoordLine(s)
    if (coordParsed) {
      if (coordParsed.error) return err(coordParsed.error)
      if (dim !== 2) return err('toạ độ A(x; y) chỉ dùng cho hình phẳng')
      for (const it of coordParsed.items) {
        if (!out.coords.includes(it.name)) out.coords.push(it.name)
        // đỉnh mẫu đã có trong `known` → ghi đè toạ độ, không thêm trùng vào `out.points`
        if (known.has(it.name)) pts.set(it.name, it.p)
        else addPoint(it.name, it.p)
      }
      return
    }

    const lower = s.toLowerCase()

    // ---------- "trong ABC": tam giác cho các đường trong tam giác
    const inTri = (() => {
      const m = s.match(/\btrong\s*\(?\s*([A-Z][0-9A-Z']*)\)?\s*$/i)
      return m ? names(m[1]) : null
    })()
    const body = inTri ? s.replace(/\btrong\s*\(?\s*[A-Z][0-9A-Z']*\)?\s*$/i, '').trim() : s
    const triFor = (v: string): string[] | null => {
      const t = inTri ?? opts.triangle
      if (!t || t.length !== 3) {
        err('ghi thêm tam giác, ví dụ: … trong SAB')
        return null
      }
      if (!t.includes(v)) {
        err(`${v} không phải đỉnh của tam giác ${t.join('')}`)
        return null
      }
      return t
    }

    // ---------- đường trong tam giác: trung tuyến / đường cao / phân giác
    const tri = body.match(/^(trung tuyến|đường cao|phân giác)\s+(?:từ\s+)?(.+)$/i)
    if (tri) {
      const kind = tri[1].toLowerCase()
      const ns = names(tri[2])
      const v = ns[0]
      const newName = ns[1] ?? (kind === 'trung tuyến' ? 'M' : kind === 'đường cao' ? 'H' : 'D')
      if (!v) return err(`ví dụ: ${kind} AM`)
      const t = triFor(v)
      if (!t) return
      const [b, c] = t.filter((x) => x !== v)
      const ps = getAll([v, b, c])
      if (!ps) return
      const [A, B, C] = ps
      if (pts.has(newName) && !out.points.some((q) => q.name === newName)) return err(`điểm ${newName} đã có trên hình — đặt tên khác, ví dụ: ${kind} ${v}K`)
      let p: Vec
      if (kind === 'trung tuyến') {
        p = vmul(vadd(B, C), 0.5)
        out.equals.push([[b, newName], [newName, c]])
      } else if (kind === 'đường cao') {
        p = footLine(A, B, C)
        out.rights.push({ at: newName, u: v, v: vlen(vsub(C, p)) > vlen(vsub(B, p)) ? c : b })
      } else {
        const ab = vlen(vsub(A, B))
        const ac = vlen(vsub(A, C))
        p = vmul(vadd(vmul(B, ac), vmul(C, ab)), 1 / (ab + ac))
      }
      addPoint(newName, p)
      seg(v, newName)
      // đường cao rơi ra ngoài cạnh: kéo dài cạnh tới chân đường cao (nét đứt)
      if (kind === 'đường cao') {
        const u = vsub(C, B)
        const tt = vdot(vsub(p, B), u) / vdot(u, u)
        if (tt < -1e-6) seg(b, newName, true)
        if (tt > 1 + 1e-6) seg(c, newName, true)
      }
      return
    }

    // ---------- trung trực BC
    const tt = body.match(/^trung trực\s+(.+)$/i)
    if (tt) {
      const ns = names(tt[1])
      if (ns.length < 2) return err('ví dụ: trung trực BC')
      const [b, c, midName] = ns as [string, string, string | undefined]
      const ps = getAll([b, c])
      if (!ps) return
      const [B, C] = ps
      const third = inTri?.find((x) => x !== b && x !== c)
      const T = third ? pts.get(third) ?? null : null
      const d = perpDir(T, B, C)
      if (!d) return err('hình không gian: ghi thêm mặt phẳng, ví dụ: trung trực BC trong ABC')
      const I = vmul(vadd(B, C), 0.5)
      const half = (0.65 * vlen(vsub(C, B))) / vlen(d)
      const iName = midName ?? hidden(I)
      if (midName) addPoint(midName, I)
      const p1 = hidden(vadd(I, vmul(d, half)))
      const p2 = hidden(vsub(I, vmul(d, half)))
      seg(p1, p2)
      out.rights.push({ at: iName, u: p1, v: c })
      out.equals.push([[b, iName], [iName, c]])
      return
    }

    // ---------- đường tròn (hình phẳng)
    const circ = body.match(/^đường tròn\s*(.*)$/i)
    if (circ) {
      if (dim !== 2) return err('đường tròn chỉ vẽ được ở hình phẳng')
      const rest = circ[1].toLowerCase()
      const ns = names(circ[1])
      let c: Vec | null = null
      let r = 0
      if (/ngoại tiếp/.test(rest) && ns.length === 3) {
        const ps = getAll(ns)
        if (!ps) return
        c = circumcenter(ps[0], ps[1], ps[2])
        if (!c) return err('ba điểm thẳng hàng')
        r = vlen(vsub(ps[0], c))
      } else if (/nội tiếp/.test(rest) && ns.length === 3) {
        const ps = getAll(ns)
        if (!ps) return
        c = incenter(ps[0], ps[1], ps[2])
        r = vlen(vsub(c, footLine(c, ps[0], ps[1])))
      } else if (/đường kính/.test(rest) && ns.length === 2) {
        const ps = getAll(ns)
        if (!ps) return
        c = vmul(vadd(ps[0], ps[1]), 0.5)
        r = vlen(vsub(ps[0], c))
      } else if (ns.length >= 2) {
        // (O, OA) · tâm O qua A · (O, AB) = tâm O bán kính AB
        const ps = getAll(ns.slice(0, 3))
        if (!ps) return
        c = ps[0]
        r = ns.length === 2 ? vlen(vsub(ps[1], ps[0])) : vlen(vsub(ps[2], ps[1]))
      } else {
        return err('ví dụ: đường tròn (O, OA) · đường tròn ngoại tiếp ABC · đường tròn đường kính AB')
      }
      if (!c || r < 1e-9) return err('bán kính bằng 0')
      out.circles.push({ c, r })
      return
    }

    // ---------- qua M song song / vuông góc AB (cắt CD tại N)
    const thr = body.match(/^qua\s+([A-Z][0-9]*'*)\s+(song song|\/\/|∥|vuông góc|⊥)\s+(?:với\s+)?(.+)$/i)
    if (thr) {
      const [, m, how, rest] = thr
      const cut = rest.match(/^(.*?)\s*cắt\s+(.+?)\s+tại\s+([A-Z][0-9]*'*)\s*$/i)
      const target = names(cut ? cut[1] : rest)
      if (target.length !== 2) return err('ví dụ: qua M song song AB cắt SC tại N')
      const ps = getAll([m, ...target])
      if (!ps) return
      const [M, A, B] = ps
      const parallel = !/vuông|⊥/i.test(how)
      let dir: Vec | null = parallel ? vsub(B, A) : perpDir(M, A, B)
      if (!dir) return err('M nằm trên đường AB — không dựng được đường vuông góc')
      if (!cut) {
        if (parallel) return err('ghi điểm cắt, ví dụ: qua M song song AB cắt SC tại N')
        // vuông góc không ghi cắt: chân đường vuông góc
        const H = footLine(M, A, B)
        dir = null
        const hName = 'H'
        if (pts.has(hName)) return err('ghi điểm cắt, ví dụ: qua M vuông góc AB cắt AB tại K')
        addPoint(hName, H)
        seg(m, hName)
        out.rights.push({ at: hName, u: m, v: target[1] })
        return
      }
      const line2 = names(cut[2])
      const nName = cut[3]
      if (line2.length !== 2) return err('ví dụ: … cắt SC tại N')
      const ps2 = getAll(line2)
      if (!ps2) return
      if (!fresh(nName)) return
      const N = intersectDir(M, dir, ps2[0], vsub(ps2[1], ps2[0]))
      if (!N) return err('hai đường song song, không cắt nhau')
      // trong không gian: kiểm hai đường có thật sự cắt nhau
      if (dim === 3) {
        const onL2 = footLine(N, ps2[0], ps2[1])
        if (vlen(vsub(onL2, N)) > 1e-6 * (1 + vlen(vsub(ps2[1], ps2[0])))) return err(`đường qua ${m} không cắt ${line2.join('')} (chéo nhau)`)
      }
      addPoint(nName, N)
      seg(m, nName)
      if (!parallel) {
        const foot = footLine(M, A, B)
        // kí hiệu góc vuông tại giao điểm với AB (nếu nằm trên đoạn đã vẽ)
        const fn = hidden(foot)
        out.rights.push({ at: fn, u: m, v: target[1] })
        if (vlen(vsub(foot, N)) > 1e-6 && vlen(vsub(foot, M)) > 1e-6) {
          const between = vdot(vsub(foot, M), vsub(N, foot)) > 0
          if (!between) seg(m, fn)
        }
      }
      return
    }

    // ---------- tô (MNP)
    const fill = body.match(/^tô\s+(.+)$/i)
    if (fill) {
      const ns = names(fill[1])
      if (ns.length < 3) return err('ví dụ: tô MNP')
      if (!getAll(ns)) return
      out.fills.push(ns)
      return
    }

    // ---------- nhãn cạnh: nhãn AB "4 km"
    const lblCmd = body.match(/^(?:nhãn|nhan)\s+(.+)$/i)
    if (lblCmd) {
      if (dim !== 2) return err('nhãn cạnh chỉ dùng cho hình phẳng')
      const rest = lblCmd[1]
      const quoted = rest.match(/"([^"]*)"|“([^”]*)”/)
      if (!quoted) return err('ví dụ: nhãn AB "4 km"')
      const text = (quoted[1] ?? quoted[2] ?? '').trim()
      if (!text) return err('nội dung nhãn trống — ví dụ: nhãn AB "4 km"')
      const clean = rest.replace(quoted[0], ' ').trim()
      const ns = names(clean)
      if (ns.length !== 2 || ns.join('') !== clean.replace(/[\s-]+/g, '')) return err('ví dụ: nhãn AB "4 km"')
      if (!getAll(ns)) return
      out.labels.push({ a: ns[0], b: ns[1], text })
      return
    }

    // ---------- đường kích thước: kích thước BC "7 km" [trên|dưới|trái|phải]
    const dimCmd = body.match(/^(?:kích thước|kich thuoc|kt)\s+(.+)$/i)
    if (dimCmd) {
      if (dim !== 2) return err('đường kích thước chỉ dùng cho hình phẳng')
      const rest = dimCmd[1]
      const quoted = rest.match(/"([^"]*)"|“([^”]*)”/)
      if (!quoted) return err('ví dụ: kích thước BC "7 km"')
      const text = (quoted[1] ?? quoted[2] ?? '').trim()
      let clean = rest.replace(quoted[0], ' ').trim()
      let side: 'up' | 'down' | 'left' | 'right' | undefined
      const sideM = clean.match(/(?:^|\s)(trên|tren|dưới|duoi|trái|trai|phải|phai)(?=\s|$)/i)
      if (sideM) {
        side = SIDE_MAP[sideM[1].toLowerCase()]
        clean = clean.replace(sideM[0], ' ').trim()
      }
      const ns = names(clean)
      if (ns.length !== 2 || ns.join('') !== clean.replace(/[\s-]+/g, '')) return err('ví dụ: kích thước BC "7 km"')
      if (!getAll(ns)) return
      out.dims.push({ a: ns[0], b: ns[1], text, side })
      return
    }

    // ---------- kéo dài đoạn: "đường BC kéo dài" (hai phía) hoặc "tia BC" (một phía, quá C)
    const extLine = body.match(
      /^(?:(?:đường|duong)(?:\s+(?:thẳng|thang))?\s+(.+?)\s+(?:kéo\s+dài|keo\s+dai)|(.+?)\s+(?:kéo\s+dài|keo\s+dai)|(?:kéo\s+dài|keo\s+dai)\s+(.+?))(?:\s+(đứt|dut|liền|lien))?$/i,
    )
    const extRay = !extLine ? body.match(/^tia\s+(.+?)(?:\s+(?:kéo\s+dài|keo\s+dai))?(?:\s+(đứt|dut|liền|lien))?$/i) : null
    if (extLine || extRay) {
      if (dim !== 2) return err('kéo dài đường/tia chỉ dùng cho hình phẳng')
      const arg = (extLine ? extLine[1] ?? extLine[2] ?? extLine[3] : extRay![1]).trim()
      const styleWord = (extLine ? extLine[4] : extRay![2])?.toLowerCase()
      const dashed = styleWord === 'đứt' || styleWord === 'dut'
      const ns = names(arg)
      if (ns.length !== 2 || ns.join('') !== arg.replace(/[\s-]+/g, '')) {
        return err(extRay ? 'ví dụ: tia BC' : 'ví dụ: đường BC kéo dài')
      }
      const ps = getAll(ns)
      if (!ps) return
      if (vlen(vsub(ps[1], ps[0])) < 1e-9) return err(`hai điểm ${ns[0]} và ${ns[1]} trùng nhau`)
      out.extends.push({ a: ns[0], b: ns[1], mode: extRay ? 'end' : 'both', dashed })
      return
    }

    // ---------- điểm mới: "M = ..." / "M là ..."
    const def = body.match(/^([A-Z][0-9]*'*)\s*(?:=|:|là\b)\s*(.+)$/)
    if (def) {
      const [, name, rhsRaw] = def
      const rhs = rhsRaw.trim()
      const r = rhs.toLowerCase()
      const ns = names(rhs)
      let p: Vec | null | undefined = null
      const tri3 = () => {
        if (ns.length !== 3) {
          err('cần ba đỉnh, ví dụ: ABC')
          return null
        }
        return getAll(ns)
      }
      if (/trung điểm|^tđ|^mid/.test(r)) {
        if (ns.length !== 2) return err('trung điểm cần hai điểm, ví dụ: M = trung điểm SC')
        const ps = getAll(ns)
        if (!ps) return
        p = vmul(vadd(ps[0], ps[1]), 0.5)
      } else if (/trọng tâm|^tt\b/.test(r)) {
        if (ns.length < 2) return err('trọng tâm cần các đỉnh, ví dụ: G = trọng tâm ABC')
        const ps = getAll(ns)
        if (!ps) return
        p = vmul(ps.reduce((acc, q) => vadd(acc, q)), 1 / ps.length)
      } else if (/trực tâm/.test(r)) {
        const ps = tri3()
        if (!ps) return
        const O = circumcenter(ps[0], ps[1], ps[2])
        if (!O) return err('ba điểm thẳng hàng')
        p = vsub(vadd(vadd(ps[0], ps[1]), ps[2]), vmul(O, 2))
      } else if (/ngoại tiếp/.test(r)) {
        const ps = tri3()
        if (!ps) return
        p = circumcenter(ps[0], ps[1], ps[2])
        if (!p) return err('ba điểm thẳng hàng')
      } else if (/nội tiếp/.test(r)) {
        const ps = tri3()
        if (!ps) return
        p = incenter(ps[0], ps[1], ps[2])
      } else if (/hình chiếu|^hc\b|chân/.test(r)) {
        const [from, ...target] = ns
        if (!from || target.length < 2) return err('ví dụ: H = hình chiếu S lên (ABCD) hoặc K = hình chiếu A lên SB')
        const P = get(from)
        const T = getAll(target)
        if (!P || !T) return
        const [a, b, c] = T
        if (target.length === 2 || dim < 3) p = footLine(P, a, b)
        else {
          p = footPlane(P, a, b, c)
          if (!p) return err('ba điểm của mặt phẳng thẳng hàng')
        }
      } else if (/cắt|∩|giao/.test(r)) {
        if (ns.length !== 4) return err('giao điểm cần hai đường, ví dụ: O = AC cắt BD')
        const q = getAll(ns)
        if (!q) return
        p = intersect(q[0], q[1], q[2], q[3])
        if (!p) return err('hai đường song song, không cắt nhau')
      } else if (ns.length === 2 && num(rhs.replace(NAME, ' ')) !== null) {
        const t = num(rhs.replace(NAME, ' '))!
        const ps = getAll(ns)
        if (!ps) return
        p = vadd(ps[0], vmul(vsub(ps[1], ps[0]), t))
      } else {
        return err('không hiểu cách dựng — bấm dấu ? cạnh "Dựng thêm" để xem các lệnh')
      }
      if (!p) return
      if (!fresh(name)) return
      addPoint(name, p)
      return
    }

    // ---------- góc vuông
    if (/^(vuông|⊥|góc vuông)/.test(lower)) {
      const ns = names(s)
      if (ns.length !== 3) return err('ví dụ: vuông H S A (góc vuông tại H giữa HS, HA)')
      if (!getAll(ns)) return
      out.rights.push({ at: ns[0], u: ns[1], v: ns[2] })
      return
    }

    // ---------- đoạn bằng nhau
    if (/^(bằng|=)/.test(lower)) {
      const pairs = s.replace(/^(bằng|=)/i, '').split(/[\s,;=]+/).filter(Boolean).map(names)
      if (pairs.length < 2 || pairs.some((p) => p.length !== 2)) return err('ví dụ: bằng SM MC')
      if (!getAll(pairs.flat())) return
      out.equals.push(pairs.map((p) => [p[0], p[1]] as [string, string]))
      return
    }

    // ---------- nối đoạn: "AM, MN đứt"
    const dashed = /(^|\s)(đứt|dut)(\s|$)/.test(lower) ? true : /(^|\s)(liền|lien)(\s|$)/.test(lower) ? false : undefined
    const groups = s.replace(/(^|\s)(đứt|liền|dut|lien|nối|noi)(?=\s|$)/gi, ' ').split(/[\s,;]+/).filter(Boolean)
    if (!groups.length) return
    for (const g of groups) {
      const ns = names(g)
      if (ns.join('') !== g || ns.length < 2) return err(`không hiểu "${g}" — bấm dấu ? cạnh "Dựng thêm" để xem các lệnh`)
      if (!getAll(ns)) return
      // "SAB" = các đoạn SA, AB (đường gấp khúc)
      for (let i = 0; i + 1 < ns.length; i++) seg(ns[i], ns[i + 1], dashed)
    }
  })
  return out
}

/** hướng dẫn lệnh, chia nhóm — hiện ở bảng "?" cạnh ô Dựng thêm */
export const GEO_HELP: Array<{ group: string; items: Array<{ code: string; what: string }> }> = [
  {
    group: 'Lấy điểm',
    items: [
      { code: 'M = trung điểm SC', what: 'Trung điểm của đoạn' },
      { code: 'N = SB 1/3', what: 'Điểm trên SB với SN = 1/3 SB' },
      { code: 'O = AC cắt BD', what: 'Giao điểm hai đường thẳng' },
      { code: 'H = hình chiếu S lên (ABCD)', what: 'Chân đường vuông góc xuống mặt phẳng' },
      { code: 'K = hình chiếu A lên SB', what: 'Chân đường vuông góc xuống đường thẳng' },
    ],
  },
  {
    group: 'Đường trong tam giác',
    items: [
      { code: 'trung tuyến AM', what: 'M là trung điểm cạnh đối diện, tự nối AM' },
      { code: 'đường cao AH', what: 'H là chân đường cao, có kí hiệu góc vuông' },
      { code: 'phân giác AD', what: 'D là chân đường phân giác trên cạnh đối diện' },
      { code: 'trung trực BC', what: 'Đường trung trực của BC (hình phẳng)' },
      { code: 'đường cao SK trong SBC', what: 'Hình không gian: ghi thêm tam giác chứa đường' },
    ],
  },
  {
    group: 'Tâm và đường tròn',
    items: [
      { code: 'G = trọng tâm ABC', what: 'Trọng tâm' },
      { code: 'H = trực tâm ABC', what: 'Trực tâm' },
      { code: 'O = tâm ngoại tiếp ABC', what: 'Tâm đường tròn ngoại tiếp' },
      { code: 'I = tâm nội tiếp ABC', what: 'Tâm đường tròn nội tiếp' },
      { code: 'đường tròn (O, OA)', what: 'Đường tròn tâm O qua A (hình phẳng)' },
      { code: 'đường tròn ngoại tiếp ABC', what: 'Cũng có: nội tiếp ABC, đường kính AB' },
    ],
  },
  {
    group: 'Song song, vuông góc',
    items: [
      { code: 'qua M song song AB cắt SC tại N', what: 'Dựng đường song song, lấy giao điểm' },
      { code: 'qua M vuông góc BC cắt AC tại K', what: 'Dựng đường vuông góc, lấy giao điểm' },
    ],
  },
  {
    group: 'Toạ độ, nhãn, kích thước (hình phẳng)',
    items: [
      { code: 'A(0; 4) hoặc A = (0; 4)', what: 'Đặt điểm theo toạ độ (trùng tên đỉnh mẫu sẽ ghi đè)' },
      { code: 'nhãn AB "4 km"', what: 'Ghi chữ cạnh đoạn AB (hỗ trợ chỉ số x_1, kéo chỉnh được)' },
      { code: 'kích thước BC "7 km"', what: 'Đoạn kích thước nét đứt hai mũi tên (thêm trên/dưới/trái/phải)' },
      { code: 'đường BC kéo dài', what: 'Kéo dài đoạn BC ra hai phía (hoặc "tia BC" quá C)' },
    ],
  },
  {
    group: 'Nối, đánh dấu, tô',
    items: [
      { code: 'AM, MN, SO', what: 'Nối đoạn (nét khuất tự vẽ đứt)' },
      { code: 'AM đứt', what: 'Ép nét đứt (hoặc "liền")' },
      { code: 'vuông H S A', what: 'Kí hiệu góc vuông tại H, giữa HS và HA' },
      { code: 'bằng SM MC', what: 'Gạch đánh dấu các đoạn bằng nhau' },
      { code: 'tô MNP', what: 'Tô nhạt thiết diện / mặt phẳng' },
    ],
  },
]
