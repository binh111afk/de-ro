/**
 * Phương trình hoá học:
 * - Nhiều dòng (mỗi dòng một phương trình), mũi tên "->", "<=>", "=" (hoặc "→", "⇌");
 *   có thể nhiều mũi tên trên một dòng: "A -> [đk1] B -> [đk2] C".
 * - Điều kiện trên/dưới mũi tên: "[t°]" hoặc "[t°, xt, p | Fe]" đặt ngay sau mũi tên (hoặc cuối dòng khi chỉ có 1 mũi tên).
 * - Chất là công thức cấu tạo thu gọn bọc trong "{...}" (vẽ bằng bộ vẽ của `chem.ts`, căn mạch chính theo đường giữa mũi tên).
 * - Chỉ số dưới tự động qua `subscript()`, giữ hệ số đầu dòng cỡ thường; ion "^2-", "^3+";
 *   khí bay lên "^" / "↑", kết tủa "v" / "↓" (không nhầm V của Vanadi); trạng thái "(r)", "(l)", "(k)", "(dd)".
 * - Tuỳ chọn cân bằng tự động bằng khử Gauss phân số chính xác (BigInt) trên ma trận bảo toàn nguyên tố & điện tích.
 */
import { renderStructBody, subscript, type StructBody } from './chem'
import type { ToolImage } from './toolSpec'

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10

export interface ChemEqSpec {
  /** mỗi dòng một phương trình */
  equations: string
  /** cân bằng hệ số tự động khi người dùng không ghi hệ số */
  autoBalance: boolean
  /** cỡ chữ 14–22, mặc định 17 */
  fontSize: number
  /** 'center': nhiều dòng căn thẳng cột mũi tên; 'left': căn trái từng dòng */
  align: 'left' | 'center'
}

export const CHEMEQ_DEFAULT: ChemEqSpec = {
  equations: '2KMnO4 -> K2MnO4 + MnO2 + O2 [t°]\nN2 + 3H2 <=> 2NH3 [t°, xt, p | Fe]',
  autoBalance: false,
  fontSize: 17,
  align: 'center',
}

interface Term {
  coeff: string
  formula: string
  /** nếu là chất cấu tạo `{...}`: nội dung công thức cấu tạo */
  struct?: string
  charge: string
  state: string
  mark: '↑' | '↓' | ''
}

interface ArrowSeg {
  kind: '->' | '<=>'
  above: string
  below: string
}

interface ParsedEq {
  lineNo: number
  sides: Term[][]
  arrows: ArrowSeg[]
}

/* ------------------------------------------------------------------ *
 * Đo bề rộng chữ gần đúng theo Times New Roman (không cần DOM)
 * ------------------------------------------------------------------ */

const WIDE_UC = new Set(['M', 'W'])
const NARROW_UC = new Set(['I', 'J'])
const MED_UC = new Set(['B', 'C', 'E', 'F', 'L', 'P', 'S', 'T', 'Z'])
const WIDE_LC = new Set(['m', 'w'])
const NARROW_LC = new Set(['f', 'i', 'j', 'l', 'r', 't'])
const THIN_PUNCT = new Set([' ', ',', '.', '·', "'", '’', ':', ';'])
const NARROW_PUNCT = new Set(['(', ')', '[', ']', '/', '-'])

function charEm(ch: string): number {
  if (ch >= '0' && ch <= '9') return 0.5
  if (WIDE_UC.has(ch)) return 0.9
  if (NARROW_UC.has(ch)) return 0.36
  if (MED_UC.has(ch)) return 0.62
  if (ch >= 'A' && ch <= 'Z') return 0.72
  if (WIDE_LC.has(ch)) return 0.75
  if (NARROW_LC.has(ch)) return 0.31
  if (ch >= 'a' && ch <= 'z') return 0.49
  if (THIN_PUNCT.has(ch)) return 0.26
  if (NARROW_PUNCT.has(ch)) return 0.33
  if (ch === '+' || ch === '−' || ch === '=' || ch === '≡') return 0.56
  if (ch === '↑' || ch === '↓') return 0.52
  if (ch === '°') return 0.4
  // chữ cái tiếng Việt có dấu
  if (/\p{Lu}/u.test(ch)) return 0.7
  if (/\p{Ll}/u.test(ch)) return 0.49
  return 0.55
}

type RunKind = 'norm' | 'sub' | 'sup' | 'state'
interface TextRun {
  text: string
  kind: RunKind
}

function measureRuns(runs: TextRun[], fs: number): number {
  let w = 0
  for (const r of runs) {
    const scale = r.kind === 'sub' || r.kind === 'sup' ? 0.68 : r.kind === 'state' ? 0.76 : 1
    for (const ch of r.text) w += charEm(ch) * fs * scale
  }
  return w
}

/* ------------------------------------------------------------------ *
 * Phân tích cú pháp phương trình
 * ------------------------------------------------------------------ */

function checkBrackets(line: string, lineNo: number) {
  let brace = 0
  let bracket = 0
  for (const ch of line) {
    if (ch === '{') brace++
    else if (ch === '}') {
      brace--
      if (brace < 0) throw new Error(`Dòng ${lineNo}: Thừa dấu "}" đóng công thức cấu tạo`)
    } else if (brace === 0 && ch === '[') bracket++
    else if (brace === 0 && ch === ']') {
      bracket--
      if (bracket < 0) throw new Error(`Dòng ${lineNo}: Thừa dấu "]" đóng điều kiện`)
    }
  }
  if (brace > 0) throw new Error(`Dòng ${lineNo}: Thiếu dấu "}" đóng công thức cấu tạo`)
  if (bracket > 0) throw new Error(`Dòng ${lineNo}: Thiếu dấu "]" đóng điều kiện`)
}

/** Thay vùng [...] và {...} bằng khoảng trắng để tìm mũi tên bên ngoài ngoặc. */
function maskBrackets(line: string): string {
  let out = ''
  let brace = 0
  let bracket = 0
  for (const ch of line) {
    if (ch === '{') {
      brace++
      out += ' '
    } else if (ch === '}') {
      brace = Math.max(0, brace - 1)
      out += ' '
    } else if (brace === 0 && ch === '[') {
      bracket++
      out += ' '
    } else if (brace === 0 && ch === ']') {
      bracket = Math.max(0, bracket - 1)
      out += ' '
    } else {
      out += brace > 0 || bracket > 0 ? ' ' : ch
    }
  }
  return out
}

function splitCondParts(cond: string): { above: string; below: string } {
  if (!cond) return { above: '', below: '' }
  const parts = cond.split('|')
  return {
    above: parts[0].trim(),
    below: parts.slice(1).join(' | ').trim(),
  }
}

function splitArrows(line: string, lineNo: number): { sideRaws: string[]; arrows: ArrowSeg[] } {
  const masked = maskBrackets(line)
  const primary = [...masked.matchAll(/<=>|<->|⇌|⇄|->|→/g)]
  if (primary.length === 1) {
    const m = primary[0]
    const idx = m.index!
    const tok = m[0]
    const kind: '->' | '<=>' = tok === '->' || tok === '→' ? '->' : '<=>'
    const lhs = line.slice(0, idx)
    const cond = extractCondition(line.slice(idx + tok.length))
    if (!lhs.trim() || !cond.rhs.trim()) throw new Error(`Dòng ${lineNo}: Thiếu chất tham gia hoặc sản phẩm`)
    return { sideRaws: [lhs, cond.rhs], arrows: [{ kind, above: cond.above, below: cond.below }] }
  }
  if (primary.length > 1) {
    const sideRaws = [line.slice(0, primary[0].index!)]
    const arrows: ArrowSeg[] = []
    for (let k = 0; k < primary.length; k++) {
      const m = primary[k]
      const tok = m[0]
      const kind: '->' | '<=>' = tok === '->' || tok === '→' ? '->' : '<=>'
      const start = m.index! + tok.length
      const end = k + 1 < primary.length ? primary[k + 1].index! : line.length
      const seg = line.slice(start, end)
      // Nhiều mũi tên: điều kiện phải đặt ngay sau mũi tên tương ứng
      const afterArrow = /^\s*\[([^\]]*)\](.*)$/s.exec(seg)
      if (afterArrow) {
        const { above, below } = splitCondParts(afterArrow[1])
        arrows.push({ kind, above, below })
        sideRaws.push(afterArrow[2])
      } else {
        arrows.push({ kind, above: '', below: '' })
        sideRaws.push(seg)
      }
    }
    if (sideRaws.some((s) => !s.trim())) throw new Error(`Dòng ${lineNo}: Thiếu chất tham gia hoặc sản phẩm`)
    return { sideRaws, arrows }
  }
  // dấu "=" kiểu cũ: ưu tiên "=" có khoảng trắng hai bên để tránh đụng nối đôi CH2=CH2
  const spacedEq = [...masked.matchAll(/(?:\s+=\s*|\s*=\s+)/g)]
  if (spacedEq.length > 1) throw new Error(`Dòng ${lineNo}: Có nhiều dấu "=" trên cùng một phương trình`)
  if (spacedEq.length === 1) {
    const m = spacedEq[0]
    const eqAt = m.index! + m[0].indexOf('=')
    const lhs = line.slice(0, eqAt)
    const cond = extractCondition(line.slice(eqAt + 1))
    if (!lhs.trim() || !cond.rhs.trim()) throw new Error(`Dòng ${lineNo}: Thiếu chất tham gia hoặc sản phẩm`)
    return { sideRaws: [lhs, cond.rhs], arrows: [{ kind: '->', above: cond.above, below: cond.below }] }
  }
  const anyEq = [...masked.matchAll(/=/g)]
  if (anyEq.length === 1 && !/\s/.test(masked.trim())) {
    const idx = anyEq[0].index!
    const lhs = line.slice(0, idx)
    const cond = extractCondition(line.slice(idx + 1))
    if (!lhs.trim() || !cond.rhs.trim()) throw new Error(`Dòng ${lineNo}: Thiếu chất tham gia hoặc sản phẩm`)
    return { sideRaws: [lhs, cond.rhs], arrows: [{ kind: '->', above: cond.above, below: cond.below }] }
  }
  throw new Error(`Dòng ${lineNo}: Thiếu mũi tên phản ứng (->, <=> hoặc =)`)
}

function extractCondition(rhsRaw: string): { rhs: string; above: string; below: string } {
  let rhs = rhsRaw.trim()
  let cond = ''
  const afterArrow = /^\s*\[([^\]]*)\](?:\s+(.*)|$)/s.exec(rhs)
  if (afterArrow) {
    cond = afterArrow[1]
    rhs = (afterArrow[2] ?? '').trim()
  } else {
    const spacedEnd = /^(.*?)\s+\[([^\]]*)\]\s*$/s.exec(rhs)
    if (spacedEnd) {
      rhs = spacedEnd[1].trim()
      cond = spacedEnd[2]
    } else {
      const markEnd = /^(.*?)(\^|v|↑|↓)\[([^\]]*)\]\s*$/s.exec(rhs)
      if (markEnd) {
        rhs = (markEnd[1] + markEnd[2]).trim()
        cond = markEnd[3]
      } else {
        const tightEnd = /^(.*?)\[([^\]]*)\]\s*$/s.exec(rhs)
        if (tightEnd && (/([|,°]|t\^o|\bto\b|xt|đp|as|nhiệt|lạnh|đặc|loãng)/i.test(tightEnd[2]) || !tightEnd[1].trim())) {
          rhs = tightEnd[1].trim()
          cond = tightEnd[2]
        }
      }
    }
  }
  return { rhs, ...splitCondParts(cond) }
}

function splitTerms(side: string, lineNo: number): string[] {
  const s = side.trim()
  const out: string[] = []
  let cur = ''
  let paren = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(' || ch === '[' || ch === '{') paren++
    else if (ch === ')' || ch === ']' || ch === '}') paren = Math.max(0, paren - 1)
    if (ch === '+' && paren === 0) {
      // 1) Điện tích có "^" phía trước: Fe^3+, H^+, Fe^{2+}
      if (/\^\{?\d*$/.test(cur)) {
        cur += ch
        continue
      }
      // 2) Điện tích không ghi "^" gắn liền cuối chất: Ag+ + Cl-, Ag+(dd) + Cl-(dd), ... + 2H+
      if (i > 0 && !/\s/.test(s[i - 1])) {
        const rest = s.slice(i + 1).replace(/^\s*\((?:r|l|k|dd|aq|s|g)\)/, '').trimStart()
        if (!rest || rest.startsWith('+')) {
          cur += ch
          continue
        }
      }
      if (!cur.trim()) throw new Error(`Dòng ${lineNo}: Có dấu "+" thừa hoặc thiếu chất`)
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (!cur.trim()) throw new Error(`Dòng ${lineNo}: Có dấu "+" thừa hoặc thiếu chất`)
  out.push(cur.trim())
  return out
}

function parseTerm(raw: string, lineNo: number): Term {
  let s = raw.trim()
  let state = ''
  let mark: '↑' | '↓' | '' = ''

  // Gỡ trạng thái (r)/(l)/(k)/(dd) và kí hiệu ↑/↓ (chấp nhận cả hai thứ tự)
  for (let pass = 0; pass < 2; pass++) {
    if (!state) {
      const st = /\s*\((r|l|k|dd|aq|s|g)\)\s*$/.exec(s)
      if (st) {
        state = `(${st[1]})`
        s = s.slice(0, st.index).trim()
        continue
      }
    }
    if (!mark) {
      const up = /\s*(?:↑|\^)\s*$/.exec(s)
      if (up && up.index > 0) {
        mark = '↑'
        s = s.slice(0, up.index).trim()
        continue
      }
      const downSpaced = /\s+(?:↓|v)\s*$/.exec(s)
      if (downSpaced && downSpaced.index > 0) {
        mark = '↓'
        s = s.slice(0, downSpaced.index).trim()
        continue
      }
      const downArrow = /↓\s*$/.exec(s)
      if (downArrow && downArrow.index > 0) {
        mark = '↓'
        s = s.slice(0, downArrow.index).trim()
        continue
      }
      // chữ v thường đứng cuối chất (BaSO4v, Fe(OH)3v, AgClv, Sv); tránh Lv (Livermori) và V hoa (V2O5)
      if (s.length >= 2 && s.endsWith('v') && s[s.length - 2] !== 'L' && !/\s/.test(s[s.length - 2])) {
        mark = '↓'
        s = s.slice(0, -1).trim()
        continue
      }
    }
  }

  // Hệ số đứng đầu (số nguyên hoặc phân số 1/2)
  let coeff = ''
  const cm = /^(\d+(?:\s*\/\s*\d+)?)\s*(?=[A-Za-z[({])/.exec(s)
  if (cm) {
    coeff = cm[1].replace(/\s+/g, '')
    s = s.slice(cm[0].length).trim()
  }

  // Chất cấu tạo đặt trong {...}
  if (s.startsWith('{')) {
    let depth = 0
    let closeIdx = -1
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{') depth++
      else if (s[i] === '}') {
        depth--
        if (depth === 0) {
          closeIdx = i
          break
        }
      }
    }
    if (closeIdx < 0) throw new Error(`Dòng ${lineNo}: Thiếu dấu "}" đóng công thức cấu tạo ở "${raw.trim()}"`)
    const inner = s.slice(1, closeIdx).trim()
    if (!inner) throw new Error(`Dòng ${lineNo}: Công thức cấu tạo "{}" đang để trống`)
    const tail = s.slice(closeIdx + 1).trim()
    let charge = ''
    if (tail) {
      const tm = /^\^\{?(\d*[+-])\}?$/.exec(tail)
      if (tm) charge = tm[1]
      else throw new Error(`Dòng ${lineNo}: Dư kí tự sau "}" ở "${raw.trim()}"`)
    }
    return { coeff, formula: s.slice(0, closeIdx + 1), struct: inner, charge, state, mark }
  }

  // Điện tích ion: SO4^2-, Fe^3+, OH^-, Cl-, Ag+
  let charge = ''
  const explicitIon = /\^\{?(\d*[+-])\}?$/.exec(s)
  if (explicitIon && explicitIon.index > 0) {
    charge = explicitIon[1]
    s = s.slice(0, explicitIon.index).trim()
  } else if (s.length >= 2 && (s.endsWith('+') || s.endsWith('-'))) {
    charge = s.slice(-1)
    s = s.slice(0, -1).trim()
  }

  if (!s) throw new Error(`Dòng ${lineNo}: Thiếu công thức chất ở "${raw.trim()}"`)
  return { coeff, formula: s, charge, state, mark }
}

function parseEquations(text: string): ParsedEq[] {
  const rawLines = text.split(/\r?\n/)
  const eqs: ParsedEq[] = []
  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx].trim()
    if (!line) continue
    const lineNo = idx + 1
    checkBrackets(line, lineNo)
    const { sideRaws, arrows } = splitArrows(line, lineNo)
    const sides = sideRaws.map((raw) => splitTerms(raw, lineNo).map((t) => parseTerm(t, lineNo)))
    eqs.push({ lineNo, sides, arrows })
  }
  if (!eqs.length) throw new Error('Chưa có phương trình nào')
  return eqs
}

/* ------------------------------------------------------------------ *
 * Cân bằng hệ số tự động (khử Gauss phân số chính xác BigInt)
 * ------------------------------------------------------------------ */

const ELEMENTS = new Set(
  'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og D T'.split(
    ' ',
  ),
)

function parseChargeNum(charge: string): number {
  if (!charge) return 0
  const sign = charge.endsWith('-') ? -1 : 1
  const n = charge.slice(0, -1)
  return sign * (n ? Number(n) : 1)
}

function addCounts(dst: Map<string, number>, src: Map<string, number>, mul: number) {
  for (const [k, v] of src) dst.set(k, (dst.get(k) ?? 0) + v * mul)
}

function parseGroupCounts(s: string): Map<string, number> | null {
  let i = 0
  const readNum = (): number => {
    const start = i
    while (i < s.length && s[i] >= '0' && s[i] <= '9') i++
    return i > start ? Number(s.slice(start, i)) : 1
  }
  const parseBlock = (stopChar: string): Map<string, number> | null => {
    const counts = new Map<string, number>()
    while (i < s.length) {
      const ch = s[i]
      if (ch === stopChar) {
        i++
        return counts
      }
      if (ch === '-' || ch === '=' || ch === '≡' || ch === '#') {
        i++
        continue
      }
      if (ch === '(' || ch === '[') {
        const close = ch === '(' ? ')' : ']'
        i++
        const inner = parseBlock(close)
        if (!inner) return null
        const mul = readNum()
        addCounts(counts, inner, mul)
        continue
      }
      if (ch >= 'A' && ch <= 'Z') {
        i++
        let sym = ch
        while (i < s.length && s[i] >= 'a' && s[i] <= 'z') {
          sym += s[i++]
        }
        if (!ELEMENTS.has(sym)) return null
        const mul = readNum()
        counts.set(sym, (counts.get(sym) ?? 0) + mul)
        continue
      }
      return null
    }
    return stopChar ? null : counts
  }
  const res = parseBlock('')
  return i === s.length ? res : null
}

function parseFormulaCounts(formula: string, charge: string): { atoms: Map<string, number>; charge: number } | null {
  if (formula === 'e') {
    return { atoms: new Map(), charge: charge ? parseChargeNum(charge) : -1 }
  }
  const parts = formula.split(/[.·]/)
  const total = new Map<string, number>()
  for (const rawPart of parts) {
    if (!rawPart) return null
    const m = /^(\d*)(.+)$/.exec(rawPart)
    if (!m) return null
    const mul = m[1] ? Number(m[1]) : 1
    if (!Number.isFinite(mul) || mul <= 0) return null
    const g = parseGroupCounts(m[2])
    if (!g) return null
    addCounts(total, g, mul)
  }
  return { atoms: total, charge: parseChargeNum(charge) }
}

type Frac = { n: bigint; d: bigint }
const absBig = (a: bigint) => (a < 0n ? -a : a)
const gcdBig = (a: bigint, b: bigint): bigint => {
  a = absBig(a)
  b = absBig(b)
  while (b !== 0n) {
    const t = a % b
    a = b
    b = t
  }
  return a || 1n
}
const lcmBig = (a: bigint, b: bigint): bigint => (a / gcdBig(a, b)) * b
const mkFrac = (n: bigint, d = 1n): Frac => {
  if (n === 0n) return { n: 0n, d: 1n }
  if (d < 0n) {
    n = -n
    d = -d
  }
  const g = gcdBig(n, d)
  return { n: n / g, d: d / g }
}
const subF = (a: Frac, b: Frac) => mkFrac(a.n * b.d - b.n * a.d, a.d * b.d)
const mulF = (a: Frac, b: Frac) => mkFrac(a.n * b.n, a.d * b.d)
const divF = (a: Frac, b: Frac) => mkFrac(a.n * b.d, a.d * b.n)

function tryAutoBalance(eq: ParsedEq): string | null {
  // Bỏ qua dòng có nhiều mũi tên hoặc chứa chất cấu tạo {...}
  if (eq.arrows.length > 1 || eq.sides.some((side) => side.some((t) => t.struct !== undefined))) return null
  const [lhs, rhs] = eq.sides
  // Chỉ tự cân bằng khi người dùng không ghi hệ số nào trên dòng
  if (lhs.some((t) => t.coeff) || rhs.some((t) => t.coeff)) return null

  const all = [...lhs, ...rhs]
  const parsed = all.map((t) => parseFormulaCounts(t.formula, t.charge))
  if (parsed.some((p) => p === null)) {
    return 'Chưa tự cân bằng được công thức chứa ẩn hoặc kí hiệu đặc biệt (đã giữ nguyên).'
  }
  const species = parsed as Array<{ atoms: Map<string, number>; charge: number }>
  const keys = new Set<string>()
  let hasCharge = false
  for (const s of species) {
    for (const k of s.atoms.keys()) keys.add(k)
    if (s.charge !== 0) hasCharge = true
  }
  const rowNames = [...keys, ...(hasCharge ? ['__charge__'] : [])]
  if (!rowNames.length) return null

  const nL = lhs.length
  const cols = all.length
  const mat: Frac[][] = rowNames.map((name) =>
    species.map((sp, c) => {
      const val = name === '__charge__' ? sp.charge : (sp.atoms.get(name) ?? 0)
      return mkFrac(BigInt(c < nL ? val : -val))
    }),
  )

  // RREF
  let pivotRow = 0
  const pivots: Array<{ r: number; c: number }> = []
  const pivotCols = new Set<number>()
  for (let c = 0; c < cols && pivotRow < mat.length; c++) {
    let sel = -1
    for (let r = pivotRow; r < mat.length; r++) {
      if (mat[r][c].n !== 0n) {
        sel = r
        break
      }
    }
    if (sel < 0) continue
    ;[mat[pivotRow], mat[sel]] = [mat[sel], mat[pivotRow]]
    const div = mat[pivotRow][c]
    for (let j = c; j < cols; j++) mat[pivotRow][j] = divF(mat[pivotRow][j], div)
    for (let r = 0; r < mat.length; r++) {
      if (r === pivotRow || mat[r][c].n === 0n) continue
      const f = mat[r][c]
      for (let j = c; j < cols; j++) mat[r][j] = subF(mat[r][j], mulF(f, mat[pivotRow][j]))
    }
    pivots.push({ r: pivotRow, c })
    pivotCols.add(c)
    pivotRow++
  }

  const freeCols: number[] = []
  for (let c = 0; c < cols; c++) if (!pivotCols.has(c)) freeCols.push(c)

  if (freeCols.length === 0) return 'Không tìm được hệ số cân bằng phù hợp (đã giữ nguyên).'
  if (freeCols.length > 1) return 'Phương trình có vô số nghiệm cân bằng (đã giữ nguyên).'

  const f = freeCols[0]
  const sol: Frac[] = Array.from({ length: cols }, () => mkFrac(0n))
  sol[f] = mkFrac(1n)
  for (const { r, c } of pivots) sol[c] = mkFrac(-mat[r][f].n, mat[r][f].d)

  if (sol.some((x) => x.n === 0n)) return 'Không tìm được hệ số cân bằng dương cho mọi chất (đã giữ nguyên).'
  const sign = sol[0].n > 0n ? 1n : -1n
  if (sol.some((x) => (x.n > 0n ? 1n : -1n) !== sign)) {
    return 'Không cân bằng được phương trình (hệ số trái dấu, đã giữ nguyên).'
  }
  const signed = sol.map((x) => mkFrac(x.n * sign, x.d))
  const commonDen = signed.reduce((acc, x) => lcmBig(acc, x.d), 1n)
  const ints = signed.map((x) => (x.n * commonDen) / x.d)
  const g = ints.reduce((acc, x) => gcdBig(acc, x), 0n) || 1n
  const coeffs = ints.map((x) => x / g)

  all.forEach((term, i) => {
    const k = coeffs[i]
    term.coeff = k === 1n ? '' : k.toString()
  })
  return null
}

/* ------------------------------------------------------------------ *
 * Chuyển thành run chữ & vẽ SVG
 * ------------------------------------------------------------------ */

const SUB_TO_DIGIT: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
}

function pushSubscripted(runs: TextRun[], raw: string) {
  // Dùng lại subscript() từ chem.ts để nhận diện chỉ số hoá học sau chữ cái / ngoặc
  const withSub = subscript(raw)
  let buf = ''
  let subBuf = ''
  const flushNorm = () => {
    if (buf) {
      runs.push({ text: buf, kind: 'norm' })
      buf = ''
    }
  }
  const flushSub = () => {
    if (subBuf) {
      runs.push({ text: subBuf, kind: 'sub' })
      subBuf = ''
    }
  }
  for (const ch of withSub) {
    const d = SUB_TO_DIGIT[ch]
    if (d) {
      flushNorm()
      subBuf += d
    } else {
      flushSub()
      buf += ch
    }
  }
  flushSub()
  flushNorm()
}

type SidePiece =
  | { kind: 'runs'; runs: TextRun[]; w: number }
  | { kind: 'struct'; frag: StructBody; scale: number; leftPad: number; w: number; aboveMid: number; belowMid: number }

function termRuns(t: Term, out: TextRun[]) {
  if (t.coeff) out.push({ text: t.coeff.includes('/') ? `${t.coeff} ` : t.coeff, kind: 'norm' })
  pushSubscripted(out, t.formula)
  if (t.charge) out.push({ text: t.charge.replace(/-/g, '−'), kind: 'sup' })
  if (t.state) out.push({ text: t.state, kind: 'state' })
  if (t.mark) out.push({ text: t.mark, kind: 'norm' })
}

function sideToPieces(terms: Term[], fs: number, lineNo: number): SidePiece[] {
  const pieces: SidePiece[] = []
  let pending: TextRun[] = []
  const flush = () => {
    if (!pending.length) return
    pieces.push({ kind: 'runs', runs: pending, w: measureRuns(pending, fs) * 1.03 })
    pending = []
  }
  const scale = fs / 17
  terms.forEach((t, idx) => {
    if (idx > 0) pending.push({ text: ' + ', kind: 'norm' })
    if (t.struct !== undefined) {
      if (t.coeff) pending.push({ text: t.coeff.includes('/') ? `${t.coeff} ` : t.coeff, kind: 'norm' })
      flush()
      let frag: StructBody
      try {
        frag = renderStructBody({ formula: t.struct })
      } catch (e) {
        throw new Error(`Dòng ${lineNo}: ${e instanceof Error ? e.message : String(e)}`)
      }
      const leftPad = (t.coeff && !t.coeff.includes('/') ? 2 : 1) * scale
      const rightPad = 2 * scale
      const aboveMid = frag.mainY * scale
      const belowMid = (frag.height - frag.mainY) * scale
      pieces.push({
        kind: 'struct',
        frag,
        scale,
        leftPad,
        w: frag.width * scale + leftPad + rightPad,
        aboveMid,
        belowMid,
      })
      if (t.charge) pending.push({ text: t.charge.replace(/-/g, '−'), kind: 'sup' })
      if (t.state) pending.push({ text: t.state, kind: 'state' })
      if (t.mark) pending.push({ text: t.mark, kind: 'norm' })
    } else {
      termRuns(t, pending)
    }
  })
  flush()
  return pieces
}

function formatCondText(s: string): string {
  return s
    .replace(/t\^[o0°]/g, 't°')
    .replace(/(\d)\^[o0]/g, '$1°')
    .replace(/(^|[\s,;|(])to(?=$|[\s,;|)°C])/g, '$1t°')
    .replace(/(^|[\s,;])-(?=\s*[A-Z0-9])/g, '$1−')
}

function condToRuns(raw: string): TextRun[] {
  if (!raw) return []
  const normalized = formatCondText(raw)
  const runs: TextRun[] = []
  const re = /\^\{?(\d*[+-])\}?/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(normalized))) {
    if (m.index > last) pushSubscripted(runs, normalized.slice(last, m.index))
    runs.push({ text: m[1].replace(/-/g, '−'), kind: 'sup' })
    last = m.index + m[0].length
  }
  if (last < normalized.length) pushSubscripted(runs, normalized.slice(last))
  return runs
}

function runsToSvgText(runs: TextRun[], x: number, y: number, fs: number, anchor: 'start' | 'middle' | 'end'): string {
  const subSz = f1(fs * 0.68)
  const stateSz = f1(fs * 0.76)
  const subDy = f1(fs * 0.24)
  const supDy = f1(fs * 0.36)
  let curDy = 0
  let inner = ''
  for (const r of runs) {
    const targetDy = r.kind === 'sub' ? subDy : r.kind === 'sup' ? -supDy : 0
    const delta = f1(targetDy - curDy)
    curDy = targetDy
    const dyAttr = delta !== 0 ? ` dy="${delta}"` : ''
    if (r.kind === 'sub' || r.kind === 'sup') {
      inner += `<tspan font-size="${subSz}"${dyAttr}>${esc(r.text)}</tspan>`
    } else if (r.kind === 'state') {
      inner += `<tspan font-size="${stateSz}"${dyAttr}>${esc(r.text)}</tspan>`
    } else if (dyAttr) {
      inner += `<tspan${dyAttr}>${esc(r.text)}</tspan>`
    } else {
      inner += esc(r.text)
    }
  }
  const anchorAttr = anchor === 'start' ? '' : ` text-anchor="${anchor}"`
  return `<text x="${f1(x)}" y="${f1(y)}" ${FAM} font-size="${fs}" fill="#111"${anchorAttr}>${inner}</text>`
}

function reactionArrowSvg(kind: '->' | '<=>', x0: number, x1: number, midY: number, fs: number): string {
  const sw = Math.max(1.15, Math.round(fs * 0.078 * 100) / 100)
  if (kind === '->') {
    const headLen = Math.max(6.5, fs * 0.44)
    const headHalf = Math.max(2.8, fs * 0.19)
    const notch = headLen * 0.72
    const shaftEnd = x1 - notch + 0.5
    return (
      `<line x1="${f1(x0)}" y1="${f1(midY)}" x2="${f1(shaftEnd)}" y2="${f1(midY)}" stroke="#111" stroke-width="${sw}" stroke-linecap="round"/>` +
      `<path d="M${f1(x1 - headLen)} ${f1(midY - headHalf)}L${f1(x1)} ${f1(midY)}L${f1(x1 - headLen)} ${f1(midY + headHalf)}L${f1(x1 - notch)} ${f1(midY)}Z" fill="#111"/>`
    )
  }
  const gapH = Math.max(3.4, fs * 0.21)
  const yTop = midY - gapH / 2
  const yBot = midY + gapH / 2
  const hSw = Math.max(1.05, sw * 0.88)
  const headLen = Math.max(6, fs * 0.39)
  const barbH = Math.max(2.9, fs * 0.19)
  return (
    `<line x1="${f1(x0)}" y1="${f1(yTop)}" x2="${f1(x1 - 1)}" y2="${f1(yTop)}" stroke="#111" stroke-width="${hSw}" stroke-linecap="round"/>` +
    `<path d="M${f1(x1 - headLen)} ${f1(yTop - barbH)}L${f1(x1)} ${f1(yTop)}L${f1(x1 - headLen * 0.75)} ${f1(yTop)}Z" fill="#111"/>` +
    `<line x1="${f1(x0 + 1)}" y1="${f1(yBot)}" x2="${f1(x1)}" y2="${f1(yBot)}" stroke="#111" stroke-width="${hSw}" stroke-linecap="round"/>` +
    `<path d="M${f1(x0 + headLen)} ${f1(yBot + barbH)}L${f1(x0)} ${f1(yBot)}L${f1(x0 + headLen * 0.75)} ${f1(yBot)}Z" fill="#111"/>`
  )
}

/** Vẽ một dãy runs có thể có khoảng trắng đầu/cuối (SVG <text> tự nuốt khoảng trắng rìa nên phải cộng tay vào x). */
function drawTrimmedRuns(runs: TextRun[], x: number, baseY: number, fs: number): string {
  const trimmed = runs.map((r) => ({ ...r }))
  const spaceW = charEm(' ') * fs * 1.03
  let leadW = 0
  while (trimmed.length && trimmed[0].kind === 'norm' && trimmed[0].text.startsWith(' ')) {
    const m = /^ +/.exec(trimmed[0].text)!
    leadW += m[0].length * spaceW
    trimmed[0].text = trimmed[0].text.slice(m[0].length)
    if (!trimmed[0].text) trimmed.shift()
  }
  while (trimmed.length && trimmed[trimmed.length - 1].kind === 'norm' && trimmed[trimmed.length - 1].text.endsWith(' ')) {
    const last = trimmed[trimmed.length - 1]
    last.text = last.text.replace(/ +$/, '')
    if (!last.text) trimmed.pop()
  }
  return trimmed.length ? runsToSvgText(trimmed, x + leadW, baseY, fs, 'start') : ''
}

function drawSideAt(pieces: SidePiece[], x0: number, midY: number, baseY: number, fs: number): string {
  if (pieces.length === 1 && pieces[0].kind === 'runs') {
    return runsToSvgText(pieces[0].runs, x0, baseY, fs, 'start')
  }
  let curX = x0
  let out = ''
  for (const p of pieces) {
    if (p.kind === 'runs') {
      out += drawTrimmedRuns(p.runs, curX, baseY, fs)
    } else {
      const tx = f1(curX + p.leftPad)
      const ty = f1(midY - p.aboveMid)
      const sc = p.scale === 1 ? '' : ` scale(${Math.round(p.scale * 1000) / 1000})`
      out += `<g transform="translate(${tx} ${ty})${sc}">${p.frag.body}</g>`
    }
    curX += p.w
  }
  return out
}

export function renderChemEqSvg(spec: ChemEqSpec, desc: string): ToolImage {
  const fs = Math.min(22, Math.max(14, Math.round(Number(spec.fontSize) || 17)))
  const align: 'left' | 'center' = spec.align === 'left' ? 'left' : 'center'
  const condFs = Math.round(fs * 0.72 * 10) / 10
  const eqs = parseEquations(spec.equations)

  const warnings: Array<{ line: number; msg: string }> = []
  if (spec.autoBalance) {
    for (const eq of eqs) {
      const msg = tryAutoBalance(eq)
      if (msg) warnings.push({ line: eq.lineNo, msg })
    }
  }

  const minArrowW = Math.max(30, fs * 1.9)
  const gap = Math.max(8, Math.round(fs * 0.55))
  const padX = 20
  const padY = 14
  const rowGap = Math.max(10, Math.round(fs * 0.65))
  const midOff = 0.31 * fs

  const rows = eqs.map((eq) => {
    const sidePieces = eq.sides.map((s) => sideToPieces(s, fs, eq.lineNo))
    const sideWs = sidePieces.map((ps) => ps.reduce((sum, p) => sum + p.w, 0))
    const arrowInfos = eq.arrows.map((a) => {
      const aboveRuns = condToRuns(a.above)
      const belowRuns = condToRuns(a.below)
      const aboveW = measureRuns(aboveRuns, condFs) * 1.03
      const belowW = measureRuns(belowRuns, condFs) * 1.03
      const arrowW = Math.max(minArrowW, Math.max(aboveW, belowW) + 22)
      const isRev = a.kind === '<=>'
      const aboveOff = midOff + (isRev ? 9 : 7) + (aboveRuns.some((r) => r.kind === 'sub') ? 2 : 0)
      const belowOff = -midOff + (isRev ? 5.5 : 3.5) + 0.74 * condFs + 2.5 + (belowRuns.some((r) => r.kind === 'sup') ? 2 : 0)
      return { kind: a.kind, aboveRuns, belowRuns, arrowW, aboveOff, belowOff }
    })

    let topFromMid = 0.85 * fs - midOff
    let botFromMid = 0.38 * fs + midOff
    for (const a of arrowInfos) {
      if (a.aboveRuns.length) topFromMid = Math.max(topFromMid, a.aboveOff - midOff + 0.9 * condFs)
      if (a.belowRuns.length) botFromMid = Math.max(botFromMid, a.belowOff + midOff + 0.36 * condFs)
    }
    for (const ps of sidePieces) {
      for (const p of ps) {
        if (p.kind === 'struct') {
          topFromMid = Math.max(topFromMid, p.aboveMid + 2)
          botFromMid = Math.max(botFromMid, p.belowMid + 2)
        }
      }
    }

    const totalW = sideWs.reduce((s, w) => s + w, 0) + arrowInfos.reduce((s, a) => s + a.arrowW, 0) + arrowInfos.length * 2 * gap

    return { eq, sidePieces, sideWs, arrowInfos, topFromMid, botFromMid, totalW }
  })

  const singleRows = rows.filter((r) => r.arrowInfos.length === 1)
  const colL = singleRows.length ? Math.max(...singleRows.map((r) => r.sideWs[0])) : 0
  const colA = singleRows.length ? Math.max(...singleRows.map((r) => r.arrowInfos[0].arrowW)) : 0
  const colR = singleRows.length ? Math.max(...singleRows.map((r) => r.sideWs[1])) : 0
  const singleAlignedW = singleRows.length ? colL + gap + colA + gap + colR : 0
  const multiMaxW = Math.max(0, ...rows.filter((r) => r.arrowInfos.length > 1).map((r) => r.totalW))
  const contentW = align === 'center' ? Math.max(singleAlignedW, multiMaxW) : Math.max(...rows.map((r) => r.totalW))

  // khung ôm sát nội dung: phương trình ngắn không kèm khoảng trắng thừa hai bên
  const W = Math.ceil(contentW + padX * 2)

  let yCursor = padY
  let body = ''
  rows.forEach((r, idx) => {
    if (idx > 0) yCursor += rowGap
    const midY = yCursor + r.topFromMid
    const baseY = midY + midOff

    const drawArrow = (a: (typeof r.arrowInfos)[number], x0: number, x1: number) => {
      const arrowMidX = (x0 + x1) / 2
      body += reactionArrowSvg(a.kind, x0, x1, midY, fs)
      if (a.aboveRuns.length) body += runsToSvgText(a.aboveRuns, arrowMidX, baseY - a.aboveOff, condFs, 'middle')
      if (a.belowRuns.length) body += runsToSvgText(a.belowRuns, arrowMidX, baseY + a.belowOff, condFs, 'middle')
    }

    if (align === 'center' && r.arrowInfos.length === 1) {
      const blockStart = (W - singleAlignedW) / 2
      const arrowX0 = blockStart + colL + gap
      const arrowX1 = arrowX0 + colA
      const lhs = r.sidePieces[0]
      if (lhs.length === 1 && lhs[0].kind === 'runs') {
        body += runsToSvgText(lhs[0].runs, arrowX0 - gap, baseY, fs, 'end')
      } else {
        body += drawSideAt(lhs, arrowX0 - gap - r.sideWs[0], midY, baseY, fs)
      }
      drawArrow(r.arrowInfos[0], arrowX0, arrowX1)
      body += drawSideAt(r.sidePieces[1], arrowX1 + gap, midY, baseY, fs)
    } else {
      let curX = align === 'center' ? (W - r.totalW) / 2 : padX
      for (let k = 0; k < r.sidePieces.length; k++) {
        body += drawSideAt(r.sidePieces[k], curX, midY, baseY, fs)
        curX += r.sideWs[k]
        if (k < r.arrowInfos.length) {
          const a = r.arrowInfos[k]
          curX += gap
          drawArrow(a, curX, curX + a.arrowW)
          curX += a.arrowW + gap
        }
      }
    }

    yCursor = midY + r.botFromMid
  })

  const H = Math.max(52, Math.ceil(yCursor + padY))
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return warnings.length ? { svg, width: W, height: H, errors: warnings } : { svg, width: W, height: H }
}
