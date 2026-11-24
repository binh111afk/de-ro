/**
 * Tiền xử lý lệnh scene (chạy sau khi đọc điểm khai báo, trước khi đọc lệnh vẽ):
 * - nới cú pháp: tên điểm viết cách nhau bằng dấu cách ("góc A O B") được nối thành "A-O-B";
 *   khai báo O mà viết _O (hoặc ngược lại) vẫn hiểu;
 * - dựng điểm: "M = trung điểm AB", "T = tròn O 5 góc 30", "X = AB cắt tròn O 3"…;
 * - lệnh bậc cao sinh ra nhiều lệnh thường: tiếp tuyến, đều n điểm quanh tâm, lưới tam giác / tứ giác, trụ chia lưới.
 */
import type { P } from './types'
import type { P3 } from '../scene3d'
import { COLORS, QUOTED, SIZE, toNum } from './style'
import { splitNames } from './geom'

export interface SceneLine { text: string; line: number }

const NAME = /^_?[A-Z][A-Za-z0-9']*$/

/** áp `fn` lên phần ngoài ngoặc kép của dòng */
function outsideQuotes(s: string, fn: (part: string) => string): string {
  let out = ''
  let last = 0
  for (const m of s.matchAll(new RegExp(QUOTED.source, 'g'))) {
    out += fn(s.slice(last, m.index)) + m[0]
    last = m.index! + m[0].length
  }
  return out + fn(s.slice(last))
}

export function expandScene(lines: string[], pts: Map<string, P>, pts3: Map<string, P3>): SceneLine[] {
  let gen = 0
  const hidden = (p: P) => {
    let n: string
    do n = `_g${++gen}`; while (pts.has(n))
    pts.set(n, p)
    return n
  }
  const fixName = (t: string) => {
    if (pts.has(t) || !NAME.test(t)) return t
    if (t.startsWith('_') && pts.has(t.slice(1))) return t.slice(1)
    if (pts.has('_' + t)) return '_' + t
    return t
  }
  const isPt = (t: string) => pts.has(t)

  const out: SceneLine[] = []
  lines.forEach((raw, idx) => {
    const line = idx + 1
    const fail = (msg: string): never => { throw new Error(`Dòng ${line}: ${msg}`) }
    // 0. lỗi model hay mắc: quên đóng ngoặc kép; "tô xanh nhạt" / "tô đỏ đậm" / "tô đậm" thiếu màu; chữ đặt thẳng tại (x; y)
    let rawFixed = (raw.match(/"/g)?.length ?? 0) % 2 ? raw + '"' : raw
    rawFixed = outsideQuotes(rawFixed, (part) => part
      .replace(/(^|\s)nhạt(?=\s|$)/g, '$1')
      .replace(/(^|\s)tô\s+(\S+)\s+đậm(?=\s|$)/g, (m0, s, c) => COLORS.has(c.toLowerCase()) || /^#[\da-f]{6}$/i.test(c) ? `${s}tô đậm ${c}` : m0)
      .replace(/(^|\s)tô\s+đậm(?=\s|$)(?!\s+(#[\da-fA-F]{6}|\S+))/g, '$1tô đậm đen')
      .replace(/(^|\s)tô\s+đậm\s+(\S+)/g, (m0, s, c) => COLORS.has(c.toLowerCase()) || /^#[\da-f]{6}$/i.test(c) ? m0 : `${s}tô đậm đen ${c}`)
      .replace(/(^|\s)\(\s*(-?\d+(?:\.\d+)?)\s*;\s*(-?\d+(?:\.\d+)?)\s*\)/g, (_, s, x, y) => `${s}${hidden([Number(x), Number(y)])}`))
    // góc / vuông: "góc QR P" → "góc QRP" (tên điểm viết dính một phần, cách một phần)
    rawFixed = rawFixed.replace(/^(\s*(?:góc|vuông)\s+)((?:_?[A-Z][A-Za-z0-9']*\s+)+_?[A-Z][A-Za-z0-9']*)(?=\s|$|")/u, (_, kw, ns) => kw + ns.trim().split(/\s+/).join(''))
    // "đường PQ [kéo dài]": đoạn PQ kéo thêm mỗi đầu 15%
    rawFixed = rawFixed.replace(/^\s*đường\s+(\S+)(?:\s+kéo\s+dài)?(?=\s|$)/u, (m0, arg) => {
      let n: string[]
      try { n = splitNames(arg, pts, line) } catch { return m0 }
      if (n.length !== 2 || !pts.has(n[0]) || !pts.has(n[1])) return m0
      const [a, b] = [pts.get(n[0])!, pts.get(n[1])!]
      const d: P = [(b[0] - a[0]) * 0.15, (b[1] - a[1]) * 0.15]
      return `đoạn ${hidden([a[0] - d[0], a[1] - d[1]])}-${hidden([b[0] + d[0], b[1] + d[1]])}`
    })
    // 1-2. tước ngoặc vuông bao tuỳ chọn ngoài ngoặc kép ([2] -> 2, ["A"] -> "A"), sửa tên điểm, nối tên điểm viết cách nhau
    const unbracketed = outsideQuotes(rawFixed, (part) => part.replace(/[\[\]]/g, ' '))
    const text = outsideQuotes(unbracketed, (part) => {
      const toks = part.split(/(\s+|[-,;])/)
      const fixed = toks.map((t) => (/^\s+$|^[-,;]$/.test(t) ? t : fixName(t)))
      const words = fixed.join('').split(/(\s+)/)
      const res: string[] = []
      for (let i = 0; i < words.length; i++) {
        const w = words[i]
        const prevIdx = res.length - 2
        if (isPt(w) && /^ +$/.test(res[res.length - 1] ?? '') && prevIdx >= 0 && /^(_?[A-Za-z][A-Za-z0-9']*)(-_?[A-Za-z][A-Za-z0-9']*)*$/.test(res[prevIdx]) && res[prevIdx].split('-').every(isPt)) {
          res.pop()
          res[prevIdx] += '-' + w
        } else res.push(w)
      }
      return res.join('')
    })
    const plain = text.replace(new RegExp(QUOTED.source, 'g'), ' ').replace(/[A-Z_][A-Za-z0-9_']*\s*\([^)]*\)/g, ' ').trim()
    const pt = (n: string) => pts.get(n) ?? fail(`chưa khai báo điểm "${n}"`)
    const names = (s: string) => splitNames(s, pts, line)
    const no3d = (ns: string[]) => { if (ns.some((n) => pts3.has(n))) fail('lệnh dựng chỉ dùng cho điểm 2D') }
    const len = (tok: string | undefined) => {
      if (!tok) return fail('thiếu bán kính')
      if (SIZE.test(tok)) return toNum(tok)
      const ab = names(tok)
      if (ab.length !== 2) fail(`bán kính "${tok}" phải là số hoặc tên đoạn, vd. 3 hoặc OA`)
      no3d(ab)
      const [p, q] = ab.map(pt)
      return Math.hypot(q[0] - p[0], q[1] - p[1])
    }
    const ratio = (tok: string) => {
      const f = tok.match(/^(-?\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/)
      if (f) return toNum(f[1]) / toNum(f[2])
      if (SIZE.test(tok)) return toNum(tok)
      return NaN
    }

    // dòng thừa chỉ có tuỳ chọn kiểu ("màu lam", "đứt"): bỏ qua
    if (/^(?:(?:màu|tô(?: đậm| bóng| cầu| gạch)?) \S+|đứt|dày|mảnh|nền)$/u.test(plain)) return

    // 3. dựng điểm
    const def = plain.match(/^(_?[A-Z][A-Za-z0-9']*)\s*=\s*(.+)$/u)
    if (def) {
      pts.set(def[1], construct(def[2].trim().split(/\s+/)))
      return
    }

    // 4. lệnh bậc cao
    const toks = plain.split(/\s+/)
    if (toks[0] === 'tiếp' && toks[1] === 'tuyến') {
      out.push(...tangent(toks.slice(2)).map((t) => ({ text: t, line })))
      return
    }
    if (toks[0] === 'đều' && SIZE.test(toks[1] ?? '')) {
      out.push(...regular(toks.slice(1)).map((t) => ({ text: t, line })))
      return
    }
    if (toks[0] === 'lưới' && toks[1] !== '3d') {
      out.push(...grid(toks.slice(1)).map((t) => ({ text: t, line })))
      return
    }
    if (toks[0] === 'trụ' && toks[1] === 'lưới') {
      out.push(...cylinderGrid(toks.slice(2)).map((t) => ({ text: t, line })))
      return
    }
    if (toks[0] === 'nửa' && toks[1] === 'tròn') {
      const ab = names(toks[2] ?? fail('thiếu đường kính, vd. nửa tròn AB trái'))
      if (ab.length !== 2) fail('nửa tròn cần đúng 2 điểm đường kính, vd. nửa tròn AB')
      no3d(ab)
      const hasSide = toks[3] === 'trái' || toks[3] === 'phải'
      const side = hasSide ? toks[3] : 'trái'
      const [pA, pB] = ab.map(pt)
      const mx = (pA[0] + pB[0]) / 2
      const my = (pA[1] + pB[1]) / 2
      const r = Math.hypot(pB[0] - pA[0], pB[1] - pA[1]) / 2
      if (!r) fail('hai điểm đường kính nửa tròn trùng nhau')
      const angA = (Math.atan2(pA[1] - my, pA[0] - mx) * 180) / Math.PI
      const to = side === 'phải' ? angA + 180 : angA - 180
      const m = hidden([mx, my])
      const tail = toks.slice(hasSide ? 4 : 3).join(' ')
      out.push({ text: `vùng cung ${m} ${+r.toFixed(4)} ${+angA.toFixed(4)} ${+to.toFixed(4)}; đoạn ${ab[1]}-${ab[0]}${tail ? ' ' + tail : ''}`, line })
      return
    }
    // bán kính viết bằng tên đoạn ("cung O OB1 0 40", "tròn O OA") đổi thành số
    if (/^(tròn|nút|cung|quạt)$/u.test(toks[0]) && toks[2] && !SIZE.test(toks[2]) && /^[A-Z_][A-Za-z0-9_'-]*$/.test(toks[2])) {
      let ok = false
      try { ok = names(toks[2]).length === 2 } catch { /* không phải tên đoạn */ }
      if (ok) {
        const r = len(toks[2])
        out.push({ text: text.replace(new RegExp(`(\\s)${toks[2].replace(/[.*+?^${}()|[\]\\']/g, '\\$&')}(?=\\s|$)`), `$1${+r.toFixed(4)}`), line })
        return
      }
    }
    out.push({ text, line })

    function construct(e: string[]): P {
      const w = e.join(' ')
      let m: RegExpMatchArray | null
      if ((m = w.match(/^trung điểm (\S+)$/u))) {
        const ab = names(m[1]); if (ab.length !== 2) fail('trung điểm cần 2 điểm, vd. M = trung điểm AB'); no3d(ab)
        const [p, q] = ab.map(pt); return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
      }
      if ((m = w.match(/^trọng tâm (\S+)$/u))) {
        const ns = names(m[1]); if (ns.length !== 3) fail('trọng tâm cần 3 điểm'); no3d(ns)
        const ps = ns.map(pt); return [(ps[0][0] + ps[1][0] + ps[2][0]) / 3, (ps[0][1] + ps[1][1] + ps[2][1]) / 3]
      }
      if ((m = w.match(/^hình chiếu (\S+) lên (\S+)$/u))) {
        const [a] = names(m[1]); const bc = names(m[2]); if (bc.length !== 2) fail('hình chiếu lên đường cần 2 điểm, vd. H = hình chiếu A lên BC'); no3d([a, ...bc])
        return project(pt(a), pt(bc[0]), pt(bc[1]))
      }
      if ((m = w.match(/^đối xứng (\S+) qua (\S+)$/u))) {
        const [a] = names(m[1]); const t = names(m[2]); no3d([a, ...t])
        const p = pt(a)
        if (t.length === 1) { const o = pt(t[0]); return [2 * o[0] - p[0], 2 * o[1] - p[1]] }
        const h = project(p, pt(t[0]), pt(t[1])); return [2 * h[0] - p[0], 2 * h[1] - p[1]]
      }
      if ((m = w.match(/^quay (\S+) quanh (\S+) (\S+)$/u))) {
        const [a] = names(m[1]); const [o] = names(m[2]); no3d([a, o])
        const g = (ratio(m[3]) * Math.PI) / 180; if (!Number.isFinite(g)) fail('góc quay phải là số (độ)')
        const p = pt(a); const c = pt(o); const dx = p[0] - c[0]; const dy = p[1] - c[1]
        return [c[0] + dx * Math.cos(g) - dy * Math.sin(g), c[1] + dx * Math.sin(g) + dy * Math.cos(g)]
      }
      if ((m = w.match(/^tròn (\S+) (\S+) góc (\S+)$/u))) {
        const [o] = names(m[1]); no3d([o]); const r = len(m[2]); const g = (ratio(m[3]) * Math.PI) / 180
        if (!Number.isFinite(g)) fail('góc phải là số (độ)')
        const c = pt(o); return [c[0] + r * Math.cos(g), c[1] + r * Math.sin(g)]
      }
      if ((m = w.match(/^(?:tia |đường )?(\S+) cắt tròn (\S+) (\S+)(?: (\d))?$/u))) {
        const ab = names(m[1]); if (ab.length !== 2) fail('cần đường qua 2 điểm, vd. X = AB cắt tròn O 3'); const [o] = names(m[2]); no3d([...ab, o])
        const p = pt(ab[0]); const q = pt(ab[1]); const c = pt(o); const r = len(m[3])
        const d = [q[0] - p[0], q[1] - p[1]]; const f = [p[0] - c[0], p[1] - c[1]]
        const A = d[0] ** 2 + d[1] ** 2; const B = 2 * (f[0] * d[0] + f[1] * d[1]); const C = f[0] ** 2 + f[1] ** 2 - r * r
        const disc = B * B - 4 * A * C
        if (!A || disc < 0) fail('đường thẳng không cắt đường tròn')
        const ts = [(-B - Math.sqrt(disc)) / (2 * A), (-B + Math.sqrt(disc)) / (2 * A)]
        const pos = ts.filter((t) => t > 1e-9)
        const t = (pos.length ? pos : ts)[Math.min(Number(m[4] ?? 1), pos.length || 2) - 1]
        return [p[0] + t * d[0], p[1] + t * d[1]]
      }
      if ((m = w.match(/^tròn (\S+) (\S+) cắt tròn (\S+) (\S+)(?: (\d))?$/u))) {
        const [o1] = names(m[1]); const [o2] = names(m[3]); no3d([o1, o2])
        const c1 = pt(o1); const c2 = pt(o2); const r1 = len(m[2]); const r2 = len(m[4])
        const dx = c2[0] - c1[0]; const dy = c2[1] - c1[1]; const D = Math.hypot(dx, dy)
        if (!D || D > r1 + r2 + 1e-9 || D < Math.abs(r1 - r2) - 1e-9) fail('hai đường tròn không cắt nhau')
        const a = (r1 * r1 - r2 * r2 + D * D) / (2 * D); const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
        const mx = c1[0] + (a * dx) / D; const my = c1[1] + (a * dy) / D
        const k = m[5] === '2' ? -1 : 1
        return [mx - (k * h * dy) / D, my + (k * h * dx) / D]
      }
      if ((m = w.match(/^(\S+) cắt (\S+)$/u))) {
        const ab = names(m[1]); const cd = names(m[2])
        if (ab.length !== 2 || cd.length !== 2) fail('giao điểm cần hai đường, vd. O = AC cắt BD'); no3d([...ab, ...cd])
        const [p1, p2, p3, p4] = [...ab, ...cd].map(pt)
        const den = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0])
        if (Math.abs(den) < 1e-12) fail('hai đường song song, không có giao điểm')
        const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / den
        return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]
      }
      if ((m = w.match(/^(\S+) (\S+)$/u)) && Number.isFinite(ratio(m[2]))) {
        const ab = names(m[1]); if (ab.length !== 2) fail('chia đoạn cần 2 điểm, vd. N = AB 1/3'); no3d(ab)
        const t = ratio(m[2]); const [p, q] = ab.map(pt); return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]
      }
      const missing = e.find((t) => /^_?[A-Z][A-Za-z0-9']*$/.test(t) && !pts.has(t) && !(t.startsWith('_') && pts.has(t.slice(1))) && !pts.has('_' + t))
      if (missing) return fail(`chưa khai báo điểm "${missing}"`)
      return fail(`không hiểu phép dựng "${w}"`)
    }

    function tangent(a: string[]): string[] {
      const giveNames = (want: number, from: string[]) => {
        const ns = from.filter((t) => NAME.test(t))
        return Array.from({ length: want }, (_, i) => ns[i])
      }
      if (a[0] === 'từ') {
        // tiếp tuyến từ A tới O r [T1 T2]
        const [p0] = names(a[1] ?? fail('thiếu điểm, vd. tiếp tuyến từ A tới O 3'))
        if (a[2] !== 'tới') fail('viết "tiếp tuyến từ A tới O 3"')
        const [o] = names(a[3] ?? fail('thiếu tâm')); no3d([p0, o])
        const r = len(a[4]); const p = pt(p0); const c = pt(o)
        const d = Math.hypot(p[0] - c[0], p[1] - c[1])
        if (d <= r) fail('điểm nằm trong đường tròn, không có tiếp tuyến')
        const base = Math.atan2(p[1] - c[1], p[0] - c[0]); const al = Math.acos(r / d)
        const [n1, n2] = giveNames(2, a.slice(5))
        const t1 = n1 ?? hidden([0, 0]); const t2 = n2 ?? hidden([0, 0])
        pts.set(t1, [c[0] + r * Math.cos(base + al), c[1] + r * Math.sin(base + al)])
        pts.set(t2, [c[0] + r * Math.cos(base - al), c[1] + r * Math.sin(base - al)])
        return [`${p0}-${t1}`, `${p0}-${t2}`]
      }
      // tiếp tuyến trong|ngoài O1 R O2 r [T1 T2 T3 T4]
      const kind = a[0]
      if (kind !== 'trong' && kind !== 'ngoài') fail('viết "tiếp tuyến trong O1 3 O2 1" hoặc "tiếp tuyến ngoài …" hoặc "tiếp tuyến từ A tới O 3"')
      const [o1] = names(a[1] ?? fail('thiếu tâm thứ nhất')); const r1 = len(a[2])
      const [o2] = names(a[3] ?? fail('thiếu tâm thứ hai')); const r2 = len(a[4]); no3d([o1, o2])
      const c1 = pt(o1); const c2 = pt(o2)
      const D = Math.hypot(c2[0] - c1[0], c2[1] - c1[1])
      const s = kind === 'ngoài' ? 1 : -1
      const c = (r1 - s * r2) / D
      if (!D || Math.abs(c) > 1) fail(kind === 'trong' ? 'hai đường tròn cắt nhau, không có tiếp tuyến chung trong' : 'không có tiếp tuyến chung ngoài')
      const dx = (c2[0] - c1[0]) / D; const dy = (c2[1] - c1[1]) / D; const h = Math.sqrt(1 - c * c)
      const ns = giveNames(4, a.slice(5))
      const res: string[] = []
      ;[1, -1].forEach((k, i) => {
        const n: P = [c * dx - k * h * dy, c * dy + k * h * dx]
        const ta = ns[2 * i] ?? hidden([0, 0]); const tb = ns[2 * i + 1] ?? hidden([0, 0])
        pts.set(ta, [c1[0] + r1 * n[0], c1[1] + r1 * n[1]])
        pts.set(tb, [c2[0] + s * r2 * n[0], c2[1] + s * r2 * n[1]])
        res.push(`${ta}-${tb}`)
      })
      return res
    }

    function regular(a: string[]): string[] {
      // đều n C quanh O r [góc g] [tròn s] [nối] [đa giác]
      const n = Math.round(toNum(a[0]))
      if (n < 2 || n > 36) fail('số điểm đều phải từ 2 đến 36')
      // "đều 12 O 3" (thiếu tên điểm + "quanh"): tự đặt tên ẩn
      if (a[2] !== 'quanh' && a[1] && isPt(a[1]) && SIZE.test(a[2] ?? '')) a = [a[0], '_Rg', 'quanh', ...a.slice(1)]
      const base = a[1] ?? fail('thiếu tên điểm, vd. đều 8 C quanh O 5')
      if (!/^_?[A-Z][A-Za-z']*$/.test(base)) fail(`tên điểm "${base}" không hợp lệ`)
      if (a[2] !== 'quanh') fail('viết "đều 8 C quanh O 5"')
      const [o] = names(a[3] ?? fail('thiếu tâm')); no3d([o])
      const r = len(a[4]); const c = pt(o)
      let start = 90
      const res: string[] = []
      const extra: string[] = []
      for (let i = 5; i < a.length; i++) {
        if (a[i] === 'góc') { start = ratio(a[++i] ?? ''); if (!Number.isFinite(start)) fail('góc bắt đầu phải là số') }
        else if (a[i] === 'tròn') { const s = len(a[++i]); extra.push(`tròn ${'#'} ${s}`) }
        else if (a[i] === 'nối') extra.push(`${o}-#`)
        else if (a[i] === 'đa' && a[i + 1] === 'giác') { i++; extra.push('poly') }
        else fail(`tuỳ chọn "${a[i]}" không hợp lệ (góc, tròn, nối, đa giác)`)
      }
      const ns: string[] = []
      for (let i = 0; i < n; i++) {
        const g = ((start + (360 * i) / n) * Math.PI) / 180
        const name = `${base}${i + 1}`
        pts.set(name, [c[0] + r * Math.cos(g), c[1] + r * Math.sin(g)])
        ns.push(name)
      }
      for (const e of extra) {
        if (e === 'poly') res.push(ns.join('-'))
        else for (const name of ns) res.push(e.replace('#', name))
      }
      return res
    }

    function grid(a: string[]): string[] {
      const lerp = (p: P, q: P, t: number): P => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
      if (a[0] === 'tam' && a[1] === 'giác') {
        // lưới tam giác A B C n
        const abc = names(a[2] ?? fail('thiếu 3 đỉnh, vd. lưới tam giác A B C 3'))
        if (abc.length !== 3) fail('lưới tam giác cần 3 đỉnh')
        no3d(abc)
        const n = Math.round(toNum(a[3] ?? '')); if (!(n >= 1 && n <= 20)) fail('số phần chia mỗi cạnh phải từ 1 đến 20')
        const [A, B, C] = abc.map(pt)
        const res = [abc.join('-')]
        for (let i = 1; i < n; i++) {
          const t = i / n
          res.push(`${hidden(lerp(A, B, t))}-${hidden(lerp(A, C, t))}`)
          res.push(`${hidden(lerp(B, A, t))}-${hidden(lerp(B, C, t))}`)
          res.push(`${hidden(lerp(C, A, t))}-${hidden(lerp(C, B, t))}`)
        }
        return res
      }
      // lưới ABCD m n: m cột dọc theo AB, n hàng dọc theo AD
      const q = names(a[0] ?? fail('thiếu 4 đỉnh, vd. lưới ABCD 6 4'))
      if (q.length !== 4) fail('lưới cần 4 đỉnh theo thứ tự vòng, vd. lưới ABCD 6 4 (hoặc lưới tam giác A B C 3)')
      no3d(q)
      const m = Math.round(toNum(a[1] ?? '')); const n = Math.round(toNum(a[2] ?? ''))
      if (!(m >= 1 && m <= 40 && n >= 1 && n <= 40)) fail('số cột, số hàng phải từ 1 đến 40')
      const [A, B, C, D] = q.map(pt)
      const res = [q.join('-')]
      for (let i = 1; i < m; i++) res.push(`${hidden(lerp(A, B, i / m))}-${hidden(lerp(D, C, i / m))}`)
      for (let j = 1; j < n; j++) res.push(`${hidden(lerp(A, D, j / n))}-${hidden(lerp(B, C, j / n))}`)
      return res
    }

    function cylinderGrid(a: string[]): string[] {
      // trụ lưới O r h cột hàng [tô hàng-cột hàng-cột …] (tâm đáy O; hàng đếm từ trên, cột từ trái)
      const [o] = names(a[0] ?? fail('thiếu tâm đáy, vd. trụ lưới O 2 6 6 12')); no3d([o])
      const r = len(a[1]); const h = len(a[2])
      const cols = Math.round(toNum(a[3] ?? '')); const rows = Math.round(toNum(a[4] ?? ''))
      if (!(cols >= 1 && cols <= 24 && rows >= 1 && rows <= 40)) fail('số cột (1–24), số hàng (1–40) không hợp lệ')
      const cells: Array<[number, number]> = []
      let color = 'đen'
      for (let i = 5; i < a.length; i++) {
        if (a[i] === ',') continue
        if (a[i] !== 'tô') fail(`tuỳ chọn "${a[i]}" không hợp lệ, vd. tô 1-3 2-4`)
        while (a[i + 1] && (a[i + 1] === ',' || /^\d+-\d+(?:,\s*\d+-\d+)*,?$/.test(a[i + 1]))) {
          const rawTok = a[++i]
          if (rawTok === ',') continue
          for (const cell of rawTok.replace(/,+$/, '').split(',')) {
            if (!cell) continue
            const [rr, cc] = cell.split('-').map(Number)
            cells.push([rr, cc])
          }
        }
        if (a[i + 1] && !/^\d/.test(a[i + 1]) && a[i + 1] !== ',') color = a[++i]
      }
      const c = pt(o); const ry = r * 0.3
      const ang = (k: number) => Math.PI + (k * Math.PI) / cols
      const ring = (y: number, th: number): P => [c[0] + r * Math.cos(th), y + ry * Math.sin(th)]
      const top = c[1] + h
      const yRow = (j: number) => top - (j * h) / rows // đường ranh giới thứ j tính từ trên
      const center = (y: number) => hidden([c[0], y])
      const res: string[] = []
      for (const [rr, cc] of cells) {
        if (rr < 1 || rr > rows || cc < 1 || cc > cols) fail(`ô ${rr}-${cc} ngoài lưới ${rows} hàng × ${cols} cột`)
        const th0 = ang(cc - 1); const th1 = ang(cc)
        const ps: P[] = []
        for (let s = 0; s <= 6; s++) ps.push(ring(yRow(rr - 1), th0 + ((th1 - th0) * s) / 6))
        for (let s = 6; s >= 0; s--) ps.push(ring(yRow(rr), th0 + ((th1 - th0) * s) / 6))
        res.push(`${ps.map(hidden).join('-')} tô đậm ${color} nền`)
      }
      res.push(`elip ${center(top)} ${r} ${ry}`)
      res.push(`cung elip ${center(c[1])} ${r} ${ry} 180 360`)
      res.push(`${hidden(ring(c[1], Math.PI))}-${hidden(ring(top, Math.PI))}`)
      res.push(`${hidden(ring(c[1], 0))}-${hidden(ring(top, 0))}`)
      for (let j = 1; j < rows; j++) res.push(`cung elip ${center(yRow(j))} ${r} ${ry} 180 360`)
      for (let k = 1; k < cols; k++) res.push(`${hidden(ring(c[1], ang(k)))}-${hidden(ring(top, ang(k)))}`)
      return res
    }
  })
  return out
}

function project(p: P, a: P, b: P): P {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const L = dx * dx + dy * dy
  if (!L) return a
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L
  return [a[0] + t * dx, a[1] + t * dy]
}
