/**
 * LaTeX (phần hay gặp trong đề Toán/Lý/Hoá) → equation Word (OMML) qua các lớp Math của thư viện `docx`.
 * Hai bước: đọc LaTeX thành cây nhỏ, rồi dựng thành phần `docx`.
 *
 * ponytail: chỉ phủ phân số, căn, mũ/chỉ số, ngoặc \left\right, tổng/tích phân/giới hạn, chữ Hy Lạp, ký hiệu hay dùng.
 * Hệ phương trình (cases/aligned) ra từng dòng cách nhau bằng "; ", chưa có dấu ngoặc nhọn bao. Lệnh lạ in tên lệnh.
 */
import {
  BuilderElement,
  MathAngledBrackets,
  MathCurlyBrackets,
  MathFraction,
  MathIntegral,
  MathLimitLower,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  MathSubSuperScript,
  MathSum,
  MathSuperScript,
} from 'docx'

type XmlComponent = InstanceType<typeof BuilderElement>
type MathComponent = ConstructorParameters<typeof MathFraction>[0]['numerator'][number]

type Node =
  | { t: 'text'; s: string }
  | { t: 'frac'; n: Node[]; d: Node[] }
  | { t: 'sqrt'; deg?: Node[]; body: Node[] }
  | { t: 'script'; base: Node[]; sub?: Node[]; sup?: Node[] }
  | { t: 'brackets'; open: string; close: string; body: Node[] }
  | { t: 'nary'; kind: 'sum' | 'int'; sub?: Node[]; sup?: Node[]; body: Node[] }
  | { t: 'lim'; name: string; sub: Node[]; body: Node[] }
  | { t: 'acc'; chr: string; body: Node[] }

const SYMBOLS: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι',
  kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', equiv: '≡', sim: '∼', propto: '∝',
  infty: '∞', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', leftrightarrow: '↔', mapsto: '↦',
  in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆', supset: '⊃', supseteq: '⊇', cup: '∪', cap: '∩', emptyset: '∅', varnothing: '∅',
  forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨', perp: '⊥', parallel: '∥', angle: '∠', triangle: '△', circ: '∘', degree: '°',
  partial: '∂', nabla: '∇', prime: '′', ldots: '…', dots: '…', cdots: '⋯', vdots: '⋮', because: '∵', therefore: '∴', setminus: '∖', star: '⋆', bullet: '•',
  langle: '⟨', rangle: '⟩', lbrace: '{', rbrace: '}', '{': '{', '}': '}', '%': '%', $: '$', _: '_', '&': '&', '#': '#',
  ',': ' ', ';': ' ', ':': ' ', ' ': ' ', quad: '  ', qquad: '    ', '!': '', '\\': ' ',
}

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'max', 'min', 'det', 'gcd', 'deg', 'dim', 'ker', 'sup', 'inf'])
/** dấu trên đầu: ký tự gộp (m:acc); `overline`/`bar` dùng gạch ngang (m:bar) nên để chr rỗng */
const ACCENTS: Record<string, string> = { vec: '⃗', overrightarrow: '⃗', overline: '', bar: '', hat: '̂', widehat: '̂', tilde: '̃', dot: '̇', ddot: '̈' }
const BLACKBOARD: Record<string, string> = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ' }
const ARRAYS = new Set(['cases', 'aligned', 'align', 'array', 'matrix', 'pmatrix', 'bmatrix', 'gathered', 'split'])

type Tok = { k: 'cmd' | 'ch' | 'open' | 'close' | 'sup' | 'sub' | 'amp'; v: string }

function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '\\') {
      const m = /^[a-zA-Z]+/.exec(src.slice(i + 1))
      if (m) {
        out.push({ k: 'cmd', v: m[0] })
        i += m[0].length
      } else {
        out.push({ k: 'cmd', v: src[i + 1] ?? '' })
        i += 1
      }
    } else if (c === '{') out.push({ k: 'open', v: c })
    else if (c === '}') out.push({ k: 'close', v: c })
    else if (c === '^') out.push({ k: 'sup', v: c })
    else if (c === '_') out.push({ k: 'sub', v: c })
    else if (c === '&') out.push({ k: 'amp', v: c })
    else if (!/\s/.test(c)) out.push({ k: 'ch', v: c })
  }
  return out
}

class Parser {
  private i = 0
  constructor(private readonly toks: Tok[]) {}

  private peek = () => this.toks[this.i]

  /** Đọc dãy phần tử tới khi gặp `}` (không nuốt) hoặc hết, hoặc tới lệnh `stop` (không nuốt). */
  seq(stop?: (t: Tok) => boolean): Node[] {
    const out: Node[] = []
    for (;;) {
      const t = this.peek()
      if (!t || t.k === 'close' || (stop && stop(t))) return out
      out.push(...this.term())
    }
  }

  /** Một phần tử kèm chỉ số trên/dưới theo sau. */
  private term(): Node[] {
    const base = this.atom()
    let sub: Node[] | undefined
    let sup: Node[] | undefined
    for (;;) {
      const t = this.peek()
      if (t?.k === 'sup' && !sup) {
        this.i++
        sup = this.arg()
      } else if (t?.k === 'sub' && !sub) {
        this.i++
        sub = this.arg()
      } else break
    }
    if (!sub && !sup) return base
    const last = base[base.length - 1]
    // tổng/tích phân/giới hạn nhận chỉ số làm cận
    if (last && (last.t === 'nary' || last.t === 'lim')) {
      Object.assign(last, last.t === 'nary' ? { sub, sup } : { sub: sub ?? [] })
      return base
    }
    // chỉ số chỉ bám vào phần tử liền trước (một ký tự), không bám cả cụm chữ
    if (last?.t === 'text' && last.s.length > 1) {
      const head = last.s.slice(0, -1)
      return [...base.slice(0, -1), { t: 'text', s: head }, { t: 'script', base: [{ t: 'text', s: last.s.slice(-1) }], sub, sup }]
    }
    return [{ t: 'script', base: base.length ? base : [{ t: 'text', s: '' }], sub, sup }]
  }

  /** Đối số của lệnh/chỉ số: `{…}` hoặc một ký tự/lệnh. */
  private arg(): Node[] {
    const t = this.peek()
    if (!t) return []
    if (t.k === 'open') {
      this.i++
      const inner = this.seq()
      if (this.peek()?.k === 'close') this.i++
      return inner
    }
    return this.atom()
  }

  private atom(): Node[] {
    const t = this.toks[this.i++]
    if (!t) return []
    if (t.k === 'open') {
      this.i--
      return this.arg()
    }
    if (t.k === 'ch') return [{ t: 'text', s: t.v }]
    if (t.k === 'amp') return [{ t: 'text', s: ' ' }]
    if (t.k === 'sup' || t.k === 'sub') return []
    return this.command(t.v)
  }

  private command(name: string): Node[] {
    switch (name) {
      case 'frac':
      case 'dfrac':
      case 'tfrac': {
        const n = this.arg()
        return [{ t: 'frac', n, d: this.arg() }]
      }
      case 'sqrt': {
        let deg: Node[] | undefined
        if (this.peek()?.k === 'ch' && this.peek()!.v === '[') {
          this.i++
          deg = this.seq((t) => t.k === 'ch' && t.v === ']')
          this.i++
        }
        return [{ t: 'sqrt', deg, body: this.arg() }]
      }
      case 'left': {
        const open = this.delim()
        const body = this.seq((t) => t.k === 'cmd' && t.v === 'right')
        if (this.peek()) this.i++
        return [{ t: 'brackets', open, close: this.delim(), body }]
      }
      case 'right':
        return []
      case 'sum':
      case 'prod':
        return [{ t: 'nary', kind: 'sum', body: [] }]
      case 'int':
      case 'iint':
      case 'oint':
        return [{ t: 'nary', kind: 'int', body: [] }]
      case 'lim':
        return [{ t: 'lim', name: 'lim', sub: [], body: [] }]
      case 'text':
      case 'textrm':
      case 'textbf':
      case 'textit':
      case 'mathrm':
      case 'mathbf':
      case 'mathit':
      case 'operatorname':
      case 'mathcal':
      case 'mathsf':
        return [{ t: 'text', s: flatText(this.arg()) }]
      case 'mathbb': {
        const s = flatText(this.arg())
        return [{ t: 'text', s: s.split('').map((c) => BLACKBOARD[c] ?? c).join('') }]
      }
      case 'begin': {
        const env = flatText(this.arg())
        if (!ARRAYS.has(env)) return []
        if (env === 'array') this.arg()
        const rows: Node[] = []
        for (;;) {
          const t = this.peek()
          if (!t || (t.k === 'cmd' && t.v === 'end')) break
          if (t.k === 'cmd' && t.v === '\\') {
            this.i++
            rows.push({ t: 'text', s: '; ' })
          } else rows.push(...this.term())
        }
        if (this.peek()) {
          this.i++
          this.arg()
        }
        return rows
      }
      case 'end':
        this.arg()
        return []
    }
    if (name in ACCENTS) return [{ t: 'acc', chr: ACCENTS[name], body: this.arg() }]
    if (FUNCTIONS.has(name)) return [{ t: 'text', s: name + ' ' }]
    if (name in SYMBOLS) return [{ t: 'text', s: SYMBOLS[name] }]
    return [{ t: 'text', s: name }]
  }

  private delim(): string {
    const t = this.toks[this.i++]
    if (!t) return '.'
    return t.k === 'cmd' ? '\\' + t.v : t.v
  }
}

const flatText = (nodes: Node[]): string =>
  nodes.map((n) => (n.t === 'text' ? n.s : n.t === 'script' ? flatText(n.base) : '')).join('')

/* ---- dựng thành phần docx ---- */

function emit(nodes: Node[]): MathComponent[] {
  const out: MathComponent[] = []
  let text = ''
  const flush = () => {
    if (text) out.push(new MathRun(text))
    text = ''
  }
  for (const n of nodes) {
    if (n.t === 'text') {
      text += n.s
      continue
    }
    flush()
    const sub = (x: Node[] | undefined) => (x ? emit(x) : undefined)
    switch (n.t) {
      case 'frac':
        out.push(new MathFraction({ numerator: emit(n.n), denominator: emit(n.d) }))
        break
      case 'sqrt':
        out.push(new MathRadical({ children: emit(n.body), degree: sub(n.deg) }))
        break
      case 'script': {
        const base = emit(n.base)
        if (n.sub && n.sup) out.push(new MathSubSuperScript({ children: base, subScript: emit(n.sub), superScript: emit(n.sup) }))
        else if (n.sup) out.push(new MathSuperScript({ children: base, superScript: emit(n.sup) }))
        else out.push(new MathSubScript({ children: base, subScript: emit(n.sub ?? []) }))
        break
      }
      case 'brackets': {
        const body = emit(n.body)
        if (n.open === '(' ) out.push(new MathRoundBrackets({ children: body }))
        else if (n.open === '[') out.push(new MathSquareBrackets({ children: body }))
        else if (n.open === '\\{') out.push(new MathCurlyBrackets({ children: body }))
        else if (n.open === '\\langle') out.push(new MathAngledBrackets({ children: body }))
        else out.push(new MathRun(n.open === '.' ? '' : n.open.replace(/^\\/, '')), ...body, new MathRun(n.close === '.' ? '' : n.close.replace(/^\\/, '')))
        break
      }
      case 'nary':
        // số hạng ngay sau tổng/tích phân đã nằm trong chuỗi tiếp theo; để trống thì Word hiện ô chờ, nên gom ở bước `group`
        out.push(n.kind === 'sum' ? new MathSum({ children: emit(n.body), subScript: sub(n.sub), superScript: sub(n.sup) }) : new MathIntegral({ children: emit(n.body), subScript: sub(n.sub), superScript: sub(n.sup) }))
        break
      case 'acc': {
        const body = new BuilderElement({ name: 'm:e', children: emit(n.body) as unknown as XmlComponent[] })
        out.push(
          (n.chr
            ? new BuilderElement({ name: 'm:acc', children: [new BuilderElement({ name: 'm:accPr', children: [new BuilderElement<{ val: string }>({ name: 'm:chr', attributes: { val: { key: 'm:val', value: n.chr } } })] }), body] })
            : new BuilderElement({ name: 'm:bar', children: [new BuilderElement({ name: 'm:barPr', children: [new BuilderElement<{ val: string }>({ name: 'm:pos', attributes: { val: { key: 'm:val', value: 'top' } } })] }), body] })) as unknown as MathComponent,
        )
        break
      }
      case 'lim':
        out.push(new MathLimitLower({ children: [new MathRun(n.name)], limit: emit(n.sub) }), ...emit(n.body))
        break
    }
  }
  flush()
  return out
}

/** Số hạng ngay sau ∑ / ∫ thành thân của nó (một phần tử, kể cả chỉ số của nó). */
function attachBodies(nodes: Node[]): Node[] {
  const out: Node[] = []
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    if (n.t === 'nary' && !n.body.length && i + 1 < nodes.length) {
      const next = nodes[i + 1]
      // lấy một số hạng: nếu là chữ nhiều ký tự chỉ lấy ký tự đầu
      if (next.t === 'text' && next.s.length > 1) {
        out.push({ ...n, body: [{ t: 'text', s: next.s[0] }] }, { t: 'text', s: next.s.slice(1) })
      } else out.push({ ...n, body: [next] })
      i++
    } else out.push(n)
  }
  return out.map((n) => {
    if (n.t === 'frac') return { ...n, n: attachBodies(n.n), d: attachBodies(n.d) }
    if (n.t === 'brackets') return { ...n, body: attachBodies(n.body) }
    if (n.t === 'sqrt' || n.t === 'acc') return { ...n, body: attachBodies(n.body) }
    return n
  })
}

/** LaTeX → thành phần equation của Word. Lỗi bất ngờ thì trả chữ thô để không mất nội dung. */
export function latexToMath(src: string): MathComponent[] {
  try {
    const parser = new Parser(tokenize(src))
    return emit(attachBodies(parser.seq(() => false)))
  } catch {
    return [new MathRun(src)]
  }
}
