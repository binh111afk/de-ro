/**
 * Công cụ Toán bổ sung:
 * - Đường tròn lượng giác: các góc "π/6", "150°", "-2π/3"; họ nghiệm "π/4 + kπ/2".
 * - Sơ đồ cây xác suất: thụt lề 2 dấu cách mỗi tầng, "A: 0,3"; "A'" hoặc "~A" là biến cố đối (gạch trên).
 * - Trục số: mỗi dòng một tập "(-2; 3]", "(-oo; -1) ∪ [2; 5]", "A = [1; +oo)".
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
const ARROW = `<defs><marker id="mxarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`
function wrap(W: number, H: number, desc: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${Math.round(W)} ${Math.round(H)}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: Math.round(W), height: Math.round(H) }
}
const num = (s: string) => Number(s.replace(',', '.'))

/* ------------------------------------------------------------------ *
 * Đường tròn lượng giác
 * ------------------------------------------------------------------ */

export interface TrigSpec {
  /** mỗi dòng (hoặc dấu phẩy… không: dùng dòng) một góc hoặc một họ nghiệm */
  angles: string
  /** nét đứt chiếu xuống trục cos, sin */
  projections: boolean
  /** vẽ trục tan */
  tan: boolean
}

/** "π/6", "-2π/3", "5pi/4", "150°", "2" (radian) → radian */
export function parseAngle(raw: string): number {
  const s = raw.replace(/\s+/g, '').replace(/pi/gi, 'π').replace(/−/g, '-')
  const deg = /^([+-]?\d+(?:[.,]\d+)?)(?:°|độ|do)$/i.exec(s)
  if (deg) return (num(deg[1]) * Math.PI) / 180
  const m = /^([+-]?)(\d*)(π?)(?:\/(\d+))?$/.exec(s)
  if (!m || (!m[2] && !m[3])) throw new Error(`Không đọc được góc "${raw}" — gõ vd. π/6, -2π/3, 150°`)
  const k = (m[2] ? +m[2] : 1) * (m[3] ? Math.PI : 1)
  return (m[1] === '-' ? -1 : 1) * (k / (m[4] ? +m[4] : 1))
}

/** một dòng → các điểm (radian) cùng nhãn hiển thị */
function anglesOf(line: string): Array<{ a: number; label: string; name?: string }> {
  // "M: π/3" → điểm tên M biểu diễn góc π/3
  const named = /^([A-Z][A-Za-z0-9']*)\s*:\s*(.+)$/.exec(line.trim())
  if (named) return anglesOf(named[2]).map((p, k) => ({ ...p, name: k === 0 ? named[1] : undefined }))
  const t = line.replace(/^x\s*=\s*/i, '').trim()
  // họ nghiệm: α + kβ (k ∈ Z)
  const fam = /^(.*?)\s*\+\s*k\s*(.*?)(?:\s*,?\s*\(?k\s*∈\s*[ZℤR]\)?)?$/i.exec(t)
  if (fam) {
    const a0 = fam[1] ? parseAngle(fam[1]) : 0
    const step = parseAngle(fam[2] || '1')
    if (Math.abs(step) < 1e-9) throw new Error('Bước của họ nghiệm phải khác 0')
    const n = Math.round((2 * Math.PI) / Math.abs(step))
    if (n > 24 || Math.abs(n * Math.abs(step) - 2 * Math.PI) > 1e-6) throw new Error(`Bước ${fam[2]} không chia hết 2π (hoặc quá nhỏ) — cần dạng 2π/n`)
    return Array.from({ length: n }, (_, k) => ({ a: a0 + k * step, label: k === 0 ? (fam[1] || '0') : '' }))
  }
  return [{ a: parseAngle(t), label: t }]
}

const prettyAngle = (s: string) => s.replace(/pi/gi, 'π').replace(/-/g, '−')

export function renderTrigSvg(spec: TrigSpec, desc: string) {
  const lines = spec.angles
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) throw new Error('Gõ ít nhất một góc, vd. π/6')
  const pts = lines.flatMap(anglesOf)
  const R = 110
  const cx = 170
  const cy = 160
  const W = spec.tan ? 380 : 340
  const H = 320
  let b = ARROW
  b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#111" stroke-width="1.5"/>`
  b += `<path d="M${cx - R - 30} ${cy}H${cx + R + 32}" stroke="#111" stroke-width="1.2" marker-end="url(#mxarr)"/>`
  b += `<path d="M${cx} ${cy + R + 28}V${cy - R - 30}" stroke="#111" stroke-width="1.2" marker-end="url(#mxarr)"/>`
  b += `<text x="${cx + R + 30}" y="${cy + 18}" ${FAM} font-size="14" font-style="italic" text-anchor="end">cos</text>`
  b += `<text x="${cx + 8}" y="${cy - R - 20}" ${FAM} font-size="14" font-style="italic">sin</text>`
  b += `<text x="${cx - 9}" y="${cy + 16}" ${FAM} font-size="14" font-style="italic" text-anchor="end">O</text>`
  // điểm gốc A, A', B, B'
  const corner = (t: string, x: number, y: number, anchor = 'middle') => `<text x="${x}" y="${y}" ${FAM} font-size="14" font-style="italic" text-anchor="${anchor}">${t}</text>`
  b += corner('A', cx + R + 6, cy - 6, 'start') + corner("A'", cx - R - 6, cy - 6, 'end') + corner('B', cx + 8, cy - R - 4, 'start') + corner("B'", cx + 8, cy + R + 16, 'start')
  if (spec.tan) {
    b += `<path d="M${cx + R} ${cy + R + 10}V${cy - R - 20}" stroke="#111" stroke-width="1.1" marker-end="url(#mxarr)"/>`
    b += `<text x="${cx + R + 6}" y="${cy - R - 12}" ${FAM} font-size="14" font-style="italic">tan</text>`
  }
  const single = pts.length === 1
  for (const { a, label: angleLabel, name } of pts) {
    // điểm có tên: ghi tên ở điểm; một góc thì ghi số đo cạnh cung
    const label = name ?? angleLabel
    if (name && single && angleLabel) {
      const m = a / 2
      b += `<text x="${f1(cx + 44 * Math.cos(m))}" y="${f1(cy - 44 * Math.sin(m) + 5)}" ${FAM} font-size="13" text-anchor="middle">${esc(prettyAngle(angleLabel))}</text>`
    }
    const x = cx + R * Math.cos(a)
    const y = cy - R * Math.sin(a)
    if (spec.projections) {
      b += `<path d="M${f1(x)} ${f1(y)}V${cy}M${f1(x)} ${f1(y)}H${cx}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
    }
    if (single || spec.tan) b += `<line x1="${cx}" y1="${cy}" x2="${f1(x)}" y2="${f1(y)}" stroke="#111" stroke-width="1.2"/>`
    if (spec.tan && Math.abs(Math.cos(a)) > 0.15) {
      const ty = cy - R * Math.tan(a)
      if (Math.abs(ty - cy) < R + 10)
        b += `<path d="M${f1(x)} ${f1(y)}L${cx + R} ${f1(ty)}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/><circle cx="${cx + R}" cy="${f1(ty)}" r="2.5" fill="#111"/>`
    }
    b += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.2" fill="#111"/>`
    if (label) {
      const lx = x + 16 * Math.cos(a)
      const ly = y - 16 * Math.sin(a) + 5
      b += `<text x="${f1(lx)}" y="${f1(ly)}" ${FAM} font-size="14" text-anchor="${Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle'}">${esc(prettyAngle(label))}</text>`
    }
  }
  // một góc: cung từ A tới điểm
  if (single) {
    const a = pts[0].a
    const r = 26
    const large = Math.abs(a) % (2 * Math.PI) > Math.PI ? 1 : 0
    const ex = cx + r * Math.cos(a)
    const ey = cy - r * Math.sin(a)
    b += `<path d="M${cx + r} ${cy}A${r} ${r} 0 ${large} ${a >= 0 ? 0 : 1} ${f1(ex)} ${f1(ey)}" fill="none" stroke="#111" stroke-width="1.1" marker-end="url(#mxarr)"/>`
  }
  return wrap(W, H, desc, b)
}

/* ------------------------------------------------------------------ *
 * Sơ đồ cây xác suất
 * ------------------------------------------------------------------ */

export interface TreeSpec {
  text: string
  /** ghi tích xác suất ở cuối mỗi nhánh */
  products: boolean
}

type TNode = { name: string; p: string; kids: TNode[] }

function parseTree(text: string): TNode[] {
  const root: TNode = { name: '', p: '', kids: [] }
  const stack: Array<{ depth: number; node: TNode }> = [{ depth: -1, node: root }]
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue
    const depth = Math.floor((raw.match(/^\s*/)![0].replace(/\t/g, '  ').length) / 2)
    const m = /^\s*([^:]+?)\s*:\s*(\S+)\s*$/.exec(raw)
    if (!m) throw new Error(`Dòng "${raw.trim()}" cần dạng Tên: xác suất, vd. A: 0,3`)
    while (stack[stack.length - 1].depth >= depth) stack.pop()
    const node: TNode = { name: m[1], p: m[2], kids: [] }
    stack[stack.length - 1].node.kids.push(node)
    stack.push({ depth, node })
  }
  if (!root.kids.length) throw new Error('Chưa có nhánh nào, vd. A: 0,3')
  return root.kids
}

/** "0,3" "1/3" "30%" → số */
function prob(s: string): number {
  const t = s.replace(',', '.')
  if (/^\d+\/\d+$/.test(t)) {
    const [a, b] = t.split('/').map(Number)
    return a / b
  }
  if (/%$/.test(t)) return Number(t.slice(0, -1)) / 100
  return Number(t)
}
const fmtP = (v: number) => String(Math.round(v * 10000) / 10000).replace('.', ',')

/** "A'" / "~A" / "Ā" → tên + có gạch trên */
function eventLabel(name: string, x: number, y: number, anchor: string) {
  const bar = /^~|'$/.test(name)
  const core = name.replace(/^~|'$/g, '')
  const w = [...core].length * 9
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    `<text x="${x}" y="${y}" ${FAM} font-size="16" font-style="italic" text-anchor="${anchor}">${esc(core)}</text>` +
    (bar ? `<line x1="${f1(x0)}" y1="${y - 14}" x2="${f1(x0 + w)}" y2="${y - 14}" stroke="#111" stroke-width="1"/>` : '')
  )
}

export function renderTreeSvg(spec: TreeSpec, desc: string) {
  const top = parseTree(spec.text)
  const depthOf = (n: TNode): number => (n.kids.length ? 1 + Math.max(...n.kids.map(depthOf)) : 1)
  const D = Math.max(...top.map(depthOf))
  const COL = 120
  const ROW = 44
  let leaf = 0
  // lá xếp từ trên xuống; nút trong nằm giữa các con
  type P = { n: TNode; x: number; y: number; acc: number; parent?: P }
  const nodes: P[] = []
  const lay = (n: TNode, depth: number, acc: number, parent?: P): P => {
    const me: P = { n, x: 40 + (depth + 1) * COL, y: 0, acc: acc * prob(n.p), parent }
    if (n.kids.length) {
      const ch = n.kids.map((k) => lay(k, depth + 1, me.acc, me))
      me.y = (ch[0].y + ch[ch.length - 1].y) / 2
    } else me.y = 30 + leaf++ * ROW
    nodes.push(me)
    return me
  }
  const roots = top.map((n) => lay(n, 0, 1))
  const rootY = (roots[0].y + roots[roots.length - 1].y) / 2
  const rootX = 40
  let b = `<circle cx="${rootX}" cy="${f1(rootY)}" r="3" fill="#111"/>`
  for (const p of nodes) {
    const sx = p.parent ? p.parent.x + 22 : rootX
    const sy = p.parent ? p.parent.y : rootY
    const ex = p.x - 14
    b += `<line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex)}" y2="${f1(p.y)}" stroke="#111" stroke-width="1.2"/>`
    // xác suất trên nhánh, lệch lên trên / xuống dưới theo hướng nhánh
    const mx = (sx + ex) / 2
    const my = (sy + p.y) / 2 + (p.y <= sy ? -6 : 14)
    b += `<text x="${f1(mx)}" y="${f1(my)}" ${FAM} font-size="13" text-anchor="middle">${esc(p.n.p)}</text>`
    b += eventLabel(p.n.name, p.x, p.y + 5, 'middle')
    if (spec.products && !p.n.kids.length) {
      const chain: string[] = []
      for (let q: P | undefined = p; q; q = q.parent) chain.unshift(q.n.p)
      b += `<text x="${f1(p.x + 26)}" y="${f1(p.y + 5)}" ${FAM} font-size="13">→ ${esc(chain.join(' · '))} = ${fmtP(p.acc)}</text>`
    }
  }
  const W = 40 + (D + 1) * COL + (spec.products ? 40 + D * 46 + 70 : 30)
  const H = leaf * ROW + 20
  return wrap(W, Math.max(H, 90), desc, b)
}

/* ------------------------------------------------------------------ *
 * Trục số
 * ------------------------------------------------------------------ */

export interface NumberLineSpec {
  /** mỗi dòng một tập: "(-2; 3]", "(-oo; -1) ∪ [2; 5]", "A = [1; +oo)", "{3}" */
  sets: string
  /** gạch: gạch chéo phần bỏ đi (SGK); đậm: tô đậm phần giữ lại */
  style: 'hatch' | 'bold'
}

type Iv = { a: number; b: number; la: '(' | '['; rb: ')' | ']'; ta: string; tb: string }

function parseSet(src: string): { name: string; ivs: Iv[]; pts: Array<{ v: number; t: string }> } {
  let s = src.trim()
  let name = ''
  const nm = /^([A-Za-z]\w*)\s*=\s*(.+)$/.exec(s)
  if (nm) {
    name = nm[1]
    s = nm[2]
  }
  const ivs: Iv[] = []
  const pts: Array<{ v: number; t: string }> = []
  const val = (t: string) => {
    const u = t.trim().replace(/−/g, '-')
    if (/^\+?(oo|∞|vc)$/i.test(u)) return Infinity
    if (/^-(oo|∞|vc)$/i.test(u)) return -Infinity
    if (/^-?\d+(?:[.,]\d+)?$/.test(u)) return num(u)
    if (/^-?\d+\/\d+$/.test(u)) {
      const [a, b] = u.split('/').map(Number)
      return a / b
    }
    if (/^-?√\d+$/.test(u)) return (u.startsWith('-') ? -1 : 1) * Math.sqrt(Number(u.replace(/[-√]/g, '')))
    throw new Error(`Không đọc được số "${t.trim()}"`)
  }
  const show = (t: string) => {
    const u = t.trim().replace(/-/g, '−')
    return /oo|vc/i.test(u) ? u.replace(/oo|vc/i, '∞') : u
  }
  for (const part of s.split(/∪|\bU\b|\bhợp\b/)) {
    const p = part.trim()
    if (!p) continue
    const iv = /^([([])\s*([^;]+);\s*([^)\]]+)([)\]])$/.exec(p)
    if (iv) {
      const a = val(iv[2])
      const b = val(iv[3])
      if (!(a < b)) throw new Error(`Khoảng "${p}": đầu trái phải nhỏ hơn đầu phải`)
      ivs.push({ a, b, la: iv[1] as '(' | '[', rb: iv[4] as ')' | ']', ta: show(iv[2]), tb: show(iv[3]) })
      continue
    }
    const set = /^\{(.+)\}$/.exec(p)
    if (set) {
      for (const t of set[1].split(/[;,]/)) pts.push({ v: val(t), t: show(t) })
      continue
    }
    throw new Error(`Không đọc được "${p}" — gõ vd. (-2; 3], [1; +oo), {3}`)
  }
  return { name, ivs, pts }
}

export function renderNumberLineSvg(spec: NumberLineSpec, desc: string) {
  const rows = spec.sets
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseSet)
  if (!rows.length) throw new Error('Gõ ít nhất một tập, vd. (-2; 3]')
  // các mốc hữu hạn của mọi dòng, xếp đều (trục số SGK không theo tỉ lệ)
  const marks = [...new Set(rows.flatMap((r) => [...r.ivs.flatMap((iv) => [iv.a, iv.b]), ...r.pts.map((p) => p.v)]).filter(Number.isFinite))].sort((a, b) => a - b)
  const GAP = 70
  const named = rows.some((r) => r.name)
  const left = named ? 70 : 30
  const x0 = left + 30
  const X = (v: number) => (v === -Infinity ? left : v === Infinity ? x0 + Math.max(1, marks.length) * GAP + 30 : x0 + marks.indexOf(v) * GAP)
  const right = x0 + Math.max(1, marks.length) * GAP + 30
  const W = right + 30
  const RH = 64
  let b = ARROW
  b += `<defs><pattern id="nlh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1.1"/></pattern></defs>`
  rows.forEach((r, ri) => {
    const y = 34 + ri * RH
    if (r.name) b += `<text x="${left - 14}" y="${y + 5}" ${FAM} font-size="16" font-style="italic" text-anchor="end">${esc(r.name)}</text>`
    b += `<path d="M${left} ${y}H${right + 6}" stroke="#111" stroke-width="1.2" marker-end="url(#mxarr)"/>`
    // phần giữ lại theo thứ tự trên trục
    const keep = [...r.ivs].sort((p, q) => p.a - q.a)
    if (spec.style === 'hatch') {
      // gạch các khoảng trống giữa phần giữ lại
      let cur = left
      const gaps: Array<[number, number]> = []
      for (const iv of keep) {
        if (X(iv.a) > cur + 0.5) gaps.push([cur, X(iv.a)])
        cur = Math.max(cur, X(iv.b))
      }
      if (cur < right - 0.5) gaps.push([cur, right])
      if (!keep.length) gaps.length = 0 // chỉ có điểm rời: không gạch
      for (const [g0, g1] of gaps) b += `<rect x="${f1(g0)}" y="${y - 7}" width="${f1(g1 - g0)}" height="7" fill="url(#nlh)"/>`
    } else {
      for (const iv of keep) b += `<line x1="${f1(X(iv.a))}" y1="${y}" x2="${f1(X(iv.b))}" y2="${y}" stroke="#111" stroke-width="4"/>`
    }
    // ngoặc ở đầu mút hữu hạn: "(" / ")" mở, "[" / "]" đóng
    const bracket = (x: number, ch: string) => `<text x="${f1(x)}" y="${y + 7}" ${FAM} font-size="22" text-anchor="middle">${ch}</text>`
    for (const iv of keep) {
      if (Number.isFinite(iv.a)) b += bracket(X(iv.a) + 1, iv.la)
      if (Number.isFinite(iv.b)) b += bracket(X(iv.b) - 1, iv.rb)
    }
    for (const p of r.pts) b += `<circle cx="${f1(X(p.v))}" cy="${y}" r="3.5" fill="#111"/>`
    // số ở dưới các mốc dòng này dùng
    const used = new Map<number, string>()
    for (const iv of keep) {
      if (Number.isFinite(iv.a)) used.set(iv.a, iv.ta)
      if (Number.isFinite(iv.b)) used.set(iv.b, iv.tb)
    }
    for (const p of r.pts) used.set(p.v, p.t)
    for (const [v, t] of used) b += `<text x="${f1(X(v))}" y="${y + 26}" ${FAM} font-size="14" text-anchor="middle">${esc(t)}</text>`
  })
  return wrap(W, 34 + rows.length * RH - 10, desc, b)
}

/* ------------------------------------------------------------------ *
 * Biểu đồ Ven
 * ------------------------------------------------------------------ */

export interface VennSpec {
  /** tên các tập, 2 hoặc 3: "A, B" / "A, B, C" */
  sets: string
  /** miền tô (để trống = không tô): "A ∩ B", "A ∪ B", "A \ B", "(A ∪ B)'", "A n B" … */
  shade: string
  /** số phần tử từng miền, mỗi dòng "A: 5" (chỉ A), "AB: 3" (A và B, không C), "ABC: 1", "ngoài: 4" */
  counts: string
  /** khung chữ nhật tập vũ trụ U */
  universe: boolean
}

/** biểu thức tập → hàm kiểm tra một miền (mảng thuộc / không thuộc từng tập) */
function setExpr(src: string, names: string[]): (inside: boolean[]) => boolean {
  // "A n B" / "A u B" (chữ n, u thay ∩, ∪) đổi trước khi bỏ dấu cách
  const s = src
    .replace(/\s+n\s+|&/g, '∩')
    .replace(/\s+u\s+|\|/g, '∪')
    .replace(/\s+/g, '')
    .replace(/\\|−|-/g, '\\')
  let i = 0
  type F = (m: boolean[]) => boolean
  const atom = (): F => {
    let f: F
    if (s[i] === '(') {
      i++
      f = union()
      if (s[i] !== ')') throw new Error('Thiếu dấu ")"')
      i++
    } else {
      const m = /^[A-Za-z]\w*/.exec(s.slice(i))
      if (!m) throw new Error(`Không đọc được miền tô ở "${s.slice(i, i + 5) || 'cuối'}"`)
      const k = names.indexOf(m[0])
      if (k < 0) {
        if (m[0] === 'U') f = () => true
        else throw new Error(`Không có tập "${m[0]}" (các tập: ${names.join(', ')})`)
      } else f = (mm) => mm[k]
      i += m[0].length
    }
    while (s[i] === "'" || s[i] === '’') {
      const g = f
      f = (mm) => !g(mm)
      i++
    }
    return f
  }
  const inter = (): F => {
    let f = atom()
    while (s[i] === '∩' || s[i] === '\\') {
      const op = s[i++]
      const g = f
      const h = atom()
      f = op === '∩' ? (m) => g(m) && h(m) : (m) => g(m) && !h(m)
    }
    return f
  }
  function union(): F {
    let f = inter()
    while (s[i] === '∪') {
      i++
      const g = f
      const h = inter()
      f = (m) => g(m) || h(m)
    }
    return f
  }
  const f = union()
  if (i < s.length) throw new Error(`Thừa "${s.slice(i)}" trong miền tô`)
  return f
}

export function renderVennSvg(spec: VennSpec, desc: string) {
  const names = spec.sets
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (names.length < 2 || names.length > 3) throw new Error('Gõ 2 hoặc 3 tên tập, vd. A, B, C')
  const three = names.length === 3
  const r = 78
  const W = 360
  const H = three ? 345 : 230
  const cx = W / 2
  const cy = three ? 175 : H / 2
  const C: Array<[number, number]> = three
    ? [
        [cx - 46, cy - 30],
        [cx + 46, cy - 30],
        [cx, cy + 48],
      ]
    : [
        [cx - 50, cy],
        [cx + 50, cy],
      ]
  const ins = (x: number, y: number) => C.map(([a, b]) => (x - a) ** 2 + (y - b) ** 2 <= r * r)
  const key = (m: boolean[]) => m.map((v, k) => (v ? names[k] : '')).join('') || 'ngoài'
  const box = { x: 14, y: 14, w: W - 28, h: H - 28 }
  // lấy mẫu lưới: điểm đại diện (tâm) mỗi miền để ghi số
  const sum = new Map<string, [number, number, number]>()
  for (let x = box.x + 4; x < box.x + box.w; x += 4)
    for (let y = box.y + 4; y < box.y + box.h; y += 4) {
      const k = key(ins(x, y))
      const s = sum.get(k) ?? [0, 0, 0]
      sum.set(k, [s[0] + x, s[1] + y, s[2] + 1])
    }
  let b = `<defs><pattern id="vnh" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#555" stroke-width="1.6"/></pattern>`
  C.forEach(([a, c], k) => (b += `<clipPath id="vc${k}"><circle cx="${a}" cy="${c}" r="${r}"/></clipPath>`))
  b += `<mask id="vall" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/></mask></defs>`
  // tô: mỗi miền nguyên tử thoả biểu thức → giao các hình tròn "thuộc", trừ các hình tròn "không thuộc"
  if (spec.shade.trim()) {
    const f = setExpr(spec.shade, names)
    const combos = Array.from({ length: 2 ** names.length }, (_, n) => names.map((_, k) => Boolean(n & (1 << k))))
    combos.forEach((m, n) => {
      if (!f(m)) return
      const maskId = `vm${n}`
      b += `<mask id="${maskId}" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${C.map(([a, c], k) => (m[k] ? '' : `<circle cx="${a}" cy="${c}" r="${r}" fill="#000"/>`)).join('')}</mask>`
      let shape = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#vnh)" mask="url(#${maskId})"/>`
      m.forEach((v, k) => {
        if (v) shape = `<g clip-path="url(#vc${k})">${shape}</g>`
      })
      b += shape
    })
  }
  if (spec.universe) {
    b += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="none" stroke="#111" stroke-width="1.4"/>`
    b += `<text x="${box.x + 8}" y="${box.y + 20}" ${FAM} font-size="16" font-style="italic">U</text>`
  }
  C.forEach(([a, c], k) => {
    b += `<circle cx="${a}" cy="${c}" r="${r}" fill="none" stroke="#111" stroke-width="1.6"/>`
    // tên tập ngoài vòng, phía xa tâm chung
    const dx = a - cx
    const dy = c - (three ? cy + 6 : cy)
    const L = Math.hypot(dx, dy) || 1
    const lx = a + (dx / L) * (r + 12)
    const ly = c + (three ? (dy / L) * (r + 12) : -r - 6) + 5
    b += `<text x="${f1(three ? lx : a + (k ? 40 : -40))}" y="${f1(three ? ly : ly)}" ${FAM} font-size="17" font-style="italic" text-anchor="middle">${esc(names[k])}</text>`
  })
  // số phần tử
  for (const raw of spec.counts.split('\n')) {
    const t = raw.trim()
    if (!t) continue
    const m = /^([^:]+):\s*(.+)$/.exec(t)
    if (!m) throw new Error(`Dòng "${t}" cần dạng Miền: số, vd. AB: 3`)
    let k = m[1].replace(/\s+|∩/g, '')
    if (/^(ngoài|ngoai|U)$/i.test(k)) k = 'ngoài'
    else k = names.filter((n) => k.includes(n)).join('')
    const s = sum.get(k)
    if (!s) throw new Error(`Không có miền "${m[1].trim()}"`)
    const [x, y] = k === 'ngoài' ? [box.x + box.w - 22, box.y + box.h - 14] : [s[0] / s[2], s[1] / s[2]]
    b += `<text x="${f1(x)}" y="${f1(y + 5)}" ${FAM} font-size="15" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(m[2].trim())}</text>`
  }
  return wrap(W, H, desc, b)
}
