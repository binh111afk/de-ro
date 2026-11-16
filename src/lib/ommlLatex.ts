/**
 * Công thức Word (OMML, thẻ m:oMath) → LaTeX để app hiện bằng inlineMath.
 * Phủ các cấu trúc hay gặp trong đề: phân số, mũ/chỉ số, căn, ngoặc, tổng/tích phân,
 * hàm, dấu mũ/gạch trên, giới hạn, hệ phương trình, ma trận.
 */

const kids = (el: Element | null | undefined, name?: string) =>
  el ? Array.from(el.children).filter((c) => !name || c.localName === name) : []
const kid = (el: Element | null | undefined, name: string) => kids(el, name)[0] ?? null
const mval = (el: Element | null | undefined) => el?.getAttribute('m:val') ?? el?.getAttribute('val') ?? null
const prop = (el: Element, pr: string, name: string) => mval(kid(kid(el, pr), name))

const SYM: Record<string, string> = {
  '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '±': '\\pm ', '∓': '\\mp ', '×': '\\times ', '÷': '\\div ', '·': '\\cdot ', '⋅': '\\cdot ',
  '∞': '\\infty ', '→': '\\to ', '⇒': '\\Rightarrow ', '⇔': '\\Leftrightarrow ', '←': '\\leftarrow ', '↔': '\\leftrightarrow ',
  '∈': '\\in ', '∉': '\\notin ', '⊂': '\\subset ', '⊃': '\\supset ', '⊆': '\\subseteq ', '∪': '\\cup ', '∩': '\\cap ', '∅': '\\varnothing ',
  '∀': '\\forall ', '∃': '\\exists ', '≈': '\\approx ', '≡': '\\equiv ', '∼': '\\sim ', '∝': '\\propto ', '°': '^\\circ ', '∠': '\\angle ',
  '⊥': '\\perp ', '∥': '\\parallel ', '△': '\\triangle ', '∆': '\\Delta ', '…': '\\ldots ', '⋯': '\\cdots ', '′': "'", '−': '-',
  'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'ε': '\\varepsilon ', 'θ': '\\theta ', 'λ': '\\lambda ', 'μ': '\\mu ',
  'π': '\\pi ', 'ρ': '\\rho ', 'σ': '\\sigma ', 'τ': '\\tau ', 'φ': '\\varphi ', 'ω': '\\omega ', 'Ω': '\\Omega ', 'Δ': '\\Delta ',
  'Σ': '\\Sigma ', 'Φ': '\\Phi ', 'Π': '\\Pi ', 'Γ': '\\Gamma ', 'Λ': '\\Lambda ', 'ℝ': '\\mathbb{R}', 'ℕ': '\\mathbb{N}', 'ℤ': '\\mathbb{Z}', 'ℚ': '\\mathbb{Q}',
  '{': '\\{', '}': '\\}', '%': '\\%', '#': '\\#', '&': '\\&', '$': '\\$', '_': '\\_',
}
const FN = /(?<![A-Za-z\\])(arcsin|arccos|arctan|sinh|cosh|tanh|sin|cos|tan|cot|log|ln|lg|exp|lim|max|min|det|gcd)(?![A-Za-z])/g
// tên hàm gõ thẳng trong ô công thức (không qua m:func) vẫn ra \sin… cho đứng thẳng, không thành tích các biến
const text = (s: string) => Array.from(s).map((c) => SYM[c] ?? c).join('').replace(FN, '\\$1 ')

const NARY: Record<string, string> = { '∑': '\\sum', '∏': '\\prod', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '⋃': '\\bigcup', '⋂': '\\bigcap' }
const ACC: Record<string, string> = { '̂': '\\hat', '̃': '\\tilde', '̄': '\\bar', '⃗': '\\vec', '̇': '\\dot', '̈': '\\ddot', '⃖': '\\overleftarrow', '̆': '\\breve' }
const OPEN: Record<string, string> = { '(': '(', '[': '[', '{': '\\{', '|': '|', '‖': '\\|', '⟨': '\\langle', '⌊': '\\lfloor', '⌈': '\\lceil', '': '.' }
const CLOSE: Record<string, string> = { ')': ')', ']': ']', '}': '\\}', '|': '|', '‖': '\\|', '⟩': '\\rangle', '⌋': '\\rfloor', '⌉': '\\rceil', '': '.' }

const g = (s: string) => `{${s}}`
const arg = (el: Element, name: string) => conv(kid(el, name))

function conv(el: Element | null): string {
  if (!el) return ''
  return kids(el).map(node).join('')
}

function node(el: Element): string {
  switch (el.localName) {
    case 'r': {
      const t = kids(el, 't').map((x) => x.textContent ?? '').join('')
      const nor = kid(kid(el, 'rPr'), 'nor')
      // chữ thường (không nghiêng) nhiều kí tự: \text cho khỏi dính thành tích các biến
      if (nor && /[A-Za-zÀ-ỹ]{2,}/.test(t)) return `\\text{${t}}`
      return text(t)
    }
    case 'f': {
      const type = prop(el, 'fPr', 'type')
      const n = arg(el, 'num')
      const d = arg(el, 'den')
      return type === 'lin' ? `${n}/${d}` : type === 'noBar' ? `\\binom${g(n)}${g(d)}` : `\\frac${g(n)}${g(d)}`
    }
    case 'sSup': return `${g(arg(el, 'e'))}^${g(arg(el, 'sup'))}`
    case 'sSub': return `${g(arg(el, 'e'))}_${g(arg(el, 'sub'))}`
    case 'sSubSup': return `${g(arg(el, 'e'))}_${g(arg(el, 'sub'))}^${g(arg(el, 'sup'))}`
    case 'sPre': return `{}_${g(arg(el, 'sub'))}^${g(arg(el, 'sup'))}${g(arg(el, 'e'))}`
    case 'rad': {
      const deg = arg(el, 'deg')
      const hide = prop(el, 'radPr', 'degHide')
      return deg && hide !== '1' && hide !== 'on' ? `\\sqrt[${deg}]${g(arg(el, 'e'))}` : `\\sqrt${g(arg(el, 'e'))}`
    }
    case 'd': {
      const pr = kid(el, 'dPr')
      const beg = mval(kid(pr, 'begChr')) ?? '('
      const end = mval(kid(pr, 'endChr')) ?? ')'
      const sep = mval(kid(pr, 'sepChr')) ?? ','
      const inner = kids(el, 'e').map(conv).join(sep === '|' ? ' \\mid ' : text(sep))
      // hệ phương trình: { + eqArr
      if (beg === '{' && end === '' && kid(kid(el, 'e'), 'eqArr')) return `\\begin{cases}${eqRows(kid(kid(el, 'e'), 'eqArr')!)}\\end{cases}`
      return `\\left${OPEN[beg] ?? beg}${inner}\\right${CLOSE[end] ?? end}`
    }
    case 'nary': {
      const pr = kid(el, 'naryPr')
      const chr = mval(kid(pr, 'chr')) ?? '∫'
      const op = NARY[chr] ?? text(chr)
      const sub = arg(el, 'sub')
      const sup = arg(el, 'sup')
      return `${op}${sub ? `_${g(sub)}` : ''}${sup ? `^${g(sup)}` : ''} ${arg(el, 'e')}`
    }
    case 'func': {
      const name = conv(kid(el, 'fName')).replace(/\\text\{([^}]*)\}/g, '$1').replace(/^\s*\\(?=[a-z]+\s*$)/, '')
      const known = /^(sin|cos|tan|cot|log|ln|lg|exp|lim|max|min|sup|inf|arcsin|arccos|arctan|sinh|cosh|tanh|det|gcd)$/.test(name.trim())
      return `${known ? `\\${name.trim()}` : `\\operatorname{${name}}`} ${arg(el, 'e')}`
    }
    case 'limLow': return `${g(arg(el, 'e'))}_${g(arg(el, 'lim'))}`
    case 'limUpp': return `${g(arg(el, 'e'))}^${g(arg(el, 'lim'))}`
    case 'acc': {
      const chr = prop(el, 'accPr', 'chr') ?? '̂'
      return `${ACC[chr] ?? '\\hat'}${g(arg(el, 'e'))}`
    }
    case 'bar': return prop(el, 'barPr', 'pos') === 'bot' ? `\\underline${g(arg(el, 'e'))}` : `\\overline${g(arg(el, 'e'))}`
    case 'groupChr': {
      const chr = prop(el, 'groupChrPr', 'chr') ?? '⏟'
      const pos = prop(el, 'groupChrPr', 'pos') ?? 'bot'
      if (chr === '→' || chr === '⟶') return `\\xrightarrow${g(arg(el, 'e'))}`
      return pos === 'top' ? `\\overbrace${g(arg(el, 'e'))}` : `\\underbrace${g(arg(el, 'e'))}`
    }
    case 'eqArr': return `\\begin{aligned}${eqRows(el)}\\end{aligned}`
    case 'm': {
      const rows = kids(el, 'mr').map((r) => kids(r, 'e').map(conv).join(' & '))
      return `\\begin{matrix}${rows.join(' \\\\ ')}\\end{matrix}`
    }
    case 'box':
    case 'borderBox':
    case 'phant':
    case 'e':
    case 'oMath':
      return conv(el)
    default:
      // thẻ thuộc tính (…Pr), w:bookmark…: bỏ
      return /Pr$/.test(el.localName) ? '' : conv(el)
  }
}

function eqRows(el: Element): string {
  // & trong hàng là dấu căn cột của Word
  return kids(el, 'e').map((e) => conv(e).replace(/\\&/g, '&')).join(' \\\\ ')
}

/** LaTeX của một m:oMath; rỗng nếu không có gì */
export function ommlToLatex(oMath: Element): string {
  return conv(oMath).replace(/\s+/g, ' ').replace(/\$/g, '\\$').trim()
}
