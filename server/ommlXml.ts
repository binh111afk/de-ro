/**
 * Chuyển đổi công thức Word (OMML `<m:oMath>`) sang LaTeX ở Node (không phụ thuộc DOM).
 * Bộ tách XML tuyến tính O(n), chia sẻ quy ước chuyển đổi với `src/lib/ommlLatex.ts`.
 */

interface XmlNode {
  localName: string
  attrs: Record<string, string>
  children: XmlNode[]
  text: string
  getAttribute(name: string): string | null
}

function decodeEntities(s: string): string {
  if (!s.includes('&')) return s
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => {
      const cp = Number(n)
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ''
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => {
      const cp = parseInt(h, 16)
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ''
    })
    .replace(/&amp;/g, '&')
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  let i = 0
  while (i < raw.length) {
    while (i < raw.length && /\s/.test(raw[i])) i++
    if (i >= raw.length) break
    const nameStart = i
    while (i < raw.length && !/[\s=/>]/.test(raw[i])) i++
    const name = raw.slice(nameStart, i)
    if (!name) { i++; continue }
    while (i < raw.length && /\s/.test(raw[i])) i++
    if (raw[i] !== '=') continue
    i++
    while (i < raw.length && /\s/.test(raw[i])) i++
    const q = raw[i]
    let val = ''
    if (q === '"' || q === "'") {
      i++
      const end = raw.indexOf(q, i)
      if (end < 0) { val = decodeEntities(raw.slice(i)); i = raw.length }
      else { val = decodeEntities(raw.slice(i, end)); i = end + 1 }
    } else {
      const valStart = i
      while (i < raw.length && !/[\s>]/.test(raw[i])) i++
      val = decodeEntities(raw.slice(valStart, i))
    }
    attrs[name] = val
    const colon = name.indexOf(':')
    if (colon >= 0) {
      const local = name.slice(colon + 1)
      if (!(local in attrs)) attrs[local] = val
    }
  }
  return attrs
}

function makeNode(localName: string, attrs: Record<string, string>): XmlNode {
  return {
    localName,
    attrs,
    children: [],
    text: '',
    getAttribute(name: string) {
      return name in this.attrs ? this.attrs[name] : null
    },
  }
}

export function parseXmlNode(xml: string): XmlNode | null {
  const root = makeNode('__root__', {})
  const stack: XmlNode[] = [root]
  let pos = 0
  const len = xml.length
  while (pos < len) {
    const lt = xml.indexOf('<', pos)
    if (lt < 0) {
      const tail = decodeEntities(xml.slice(pos))
      stack[stack.length - 1].text += tail
      break
    }
    if (lt > pos) {
      stack[stack.length - 1].text += decodeEntities(xml.slice(pos, lt))
    }
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4)
      pos = end < 0 ? len : end + 3
      continue
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9)
      if (end < 0) { stack[stack.length - 1].text += xml.slice(lt + 9); pos = len }
      else { stack[stack.length - 1].text += xml.slice(lt + 9, end); pos = end + 3 }
      continue
    }
    if (xml.startsWith('<?', lt) || xml.startsWith('<!', lt)) {
      const gt = xml.indexOf('>', lt + 2)
      pos = gt < 0 ? len : gt + 1
      continue
    }
    // Tìm '>' ngoài chuỗi thuộc tính
    let gt = -1
    let quote: string | null = null
    for (let i = lt + 1; i < len; i++) {
      const ch = xml[i]
      if (quote) {
        if (ch === quote) quote = null
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === '>') {
        gt = i
        break
      }
    }
    if (gt < 0) break
    const inside = xml.slice(lt + 1, gt).trim()
    pos = gt + 1
    if (!inside) continue
    if (inside[0] === '/') {
      const tag = inside.slice(1).trim()
      const local = tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag
      for (let k = stack.length - 1; k >= 1; k--) {
        if (stack[k].localName === local) {
          stack.length = k
          break
        }
      }
      continue
    }
    const selfClose = inside.endsWith('/')
    const body = selfClose ? inside.slice(0, -1).trimEnd() : inside
    let space = 0
    while (space < body.length && !/\s/.test(body[space])) space++
    const tag = body.slice(0, space)
    const local = tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag
    const attrs = space < body.length ? parseAttrs(body.slice(space + 1)) : {}
    const node = makeNode(local, attrs)
    stack[stack.length - 1].children.push(node)
    if (!selfClose) stack.push(node)
  }
  return root.children[0] ?? null
}

function textContentOf(el: XmlNode): string {
  let out = el.text
  for (const c of el.children) out += textContentOf(c)
  return out
}

const kids = (el: XmlNode | null | undefined, name?: string) =>
  el ? el.children.filter((c) => !name || c.localName === name) : []
const kid = (el: XmlNode | null | undefined, name: string) => kids(el, name)[0] ?? null
const mval = (el: XmlNode | null | undefined) => el?.getAttribute('m:val') ?? el?.getAttribute('val') ?? null
const prop = (el: XmlNode, pr: string, name: string) => mval(kid(kid(el, pr), name))

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
const text = (s: string) => Array.from(s).map((c) => SYM[c] ?? c).join('').replace(FN, '\\$1 ')

const NARY: Record<string, string> = { '∑': '\\sum', '∏': '\\prod', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint', '⋃': '\\bigcup', '⋂': '\\bigcap' }
const ACC: Record<string, string> = { '̂': '\\hat', '̃': '\\tilde', '̄': '\\bar', '⃗': '\\vec', '̇': '\\dot', '̈': '\\ddot', '⃖': '\\overleftarrow', '̆': '\\breve' }
const OPEN: Record<string, string> = { '(': '(', '[': '[', '{': '\\{', '|': '|', '‖': '\\|', '⟨': '\\langle', '⌊': '\\lfloor', '⌈': '\\lceil', '': '.' }
const CLOSE: Record<string, string> = { ')': ')', ']': ']', '}': '\\}', '|': '|', '‖': '\\|', '⟩': '\\rangle', '⌋': '\\rfloor', '⌉': '\\rceil', '': '.' }

const g = (s: string) => `{${s}}`
const arg = (el: XmlNode, name: string) => conv(kid(el, name))

function conv(el: XmlNode | null): string {
  if (!el) return ''
  return kids(el).map(node).join('')
}

function eqRows(el: XmlNode): string {
  return kids(el, 'e').map((e) => conv(e).replace(/\\&/g, '&')).join(' \\\\ ')
}

function node(el: XmlNode): string {
  switch (el.localName) {
    case 'r': {
      const t = kids(el, 't').map(textContentOf).join('')
      const nor = kid(kid(el, 'rPr'), 'nor')
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
      return /Pr$/.test(el.localName) ? '' : conv(el)
  }
}

/** Chuyển khối XML `<m:oMath>...</m:oMath>` thành LaTeX; trả rỗng nếu không hợp lệ. */
export function ommlXmlToLatex(oMathXml: string): string {
  try {
    const root = parseXmlNode(oMathXml)
    if (!root) return ''
    return conv(root).replace(/\s+/g, ' ').replace(/\$/g, '\\$').trim()
  } catch {
    return ''
  }
}
