/**
 * Công thức `$...$` trong chữ slide — phần thuần chuỗi (không import katex) để
 * dùng được trong test Node, đo chữ và xuất PPTX. Việc vẽ công thức bằng KaTeX
 * nằm ở `lib/math.ts` (`renderMath`), chỉ gọi từ renderer.
 */

/** Một đoạn `$...$` hợp lệ: ký tự đầu/cuối trong `$` không phải khoảng trắng ("5$ và 7$" không khớp). */
const MATH_SPAN = /\$([^ $](?:[^$]{0,200}[^ $])?)\$/g

export const hasMath = (text: string | undefined): boolean => {
  if (!text || !text.includes('$')) return false
  MATH_SPAN.lastIndex = 0
  return MATH_SPAN.test(text)
}

/**
 * Model trả JSON với `\frac` (một dấu gạch) thì `JSON.parse` âm thầm đổi thành
 * ký tự điều khiển (`\f` form-feed, `\t` tab, `\b`, `\r`, `\n`) bên trong công
 * thức. Khôi phục lại gạch chéo trong các đoạn `$...$` — chỉ chạm vào đoạn công
 * thức nên chữ thường có xuống dòng thật không bị ảnh hưởng.
 */
export function fixMathEscapes(text: string): string {
  if (!text.includes('$')) return text
  return text.replace(MATH_SPAN, (span) =>
    span
      .replace(/\f/g, '\\f')
      .replace(/\x08/g, '\\b')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n'),
  )
}

const SYMBOLS: Record<string, string> = {
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', leq: '≤', le: '≤', geq: '≥', ge: '≥',
  neq: '≠', ne: '≠', approx: '≈', equiv: '≡', to: '→', rightarrow: '→', leftarrow: '←',
  Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', leftrightarrow: '↔', infty: '∞',
  in: '∈', notin: '∉', subset: '⊂', cup: '∪', cap: '∩', emptyset: '∅', forall: '∀', exists: '∃',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', theta: 'θ', lambda: 'λ', mu: 'μ',
  pi: 'π', sigma: 'σ', Sigma: 'Σ', omega: 'ω', Omega: 'Ω', varphi: 'φ', phi: 'φ', rho: 'ρ',
  angle: '∠', perp: '⊥', parallel: '∥', circ: '°', degree: '°', ldots: '…', dots: '…',
  sum: 'Σ', prod: '∏', int: '∫', partial: '∂', nabla: '∇', sqrt: '√', hbar: 'ħ', therefore: '∴',
}

const SUPER: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', n: 'ⁿ', x: 'ˣ',
}
const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', n: 'ₙ', x: 'ₓ',
}

const script = (body: string, map: Record<string, string>): string | null => {
  const chars = [...body]
  return chars.every((ch) => map[ch]) ? chars.map((ch) => map[ch]).join('') : null
}

/**
 * LaTeX → chữ Unicode gần đúng cho đo chữ và xuất PPTX (PowerPoint không vẽ
 * được KaTeX). Phân số thành `a/b`, căn thành `√`, mũ/chỉ số thành ký tự
 * trên/dưới khi có; phần còn lại bỏ dấu `\`, `{}`. Không cần đúng tuyệt đối —
 * bản vẽ thật trên màn hình dùng KaTeX.
 */
export function latexToPlain(latex: string): string {
  let s = latex
  // \ce{...} (mhchem): bỏ vỏ, đổi mũi tên
  s = s.replace(/\\ce\{([^}]*)\}/g, (_, body: string) => body.replace(/<->|<=>/g, '⇌').replace(/->/g, '→'))
  s = s.replace(/\\(?:d|t)?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\(([^()/ ]+)\)\/\(([^()/ ]+)\)/g, '$1/$2')
  s = s.replace(/\\sqrt\[(\w+)\]\{([^{}]*)\}/g, '$1√($2)').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)').replace(/\\sqrt\s*(\w)/g, '√$1')
  s = s.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, '$1')
  s = s.replace(/\\left|\\right|\\,|\\;|\\!|\\quad|\\qquad/g, ' ')
  s = s.replace(/\^\{([^{}]+)\}/g, (_, body: string) => script(body, SUPER) ?? `^(${body})`)
  s = s.replace(/\^([^{}\s\\])/g, (_, body: string) => script(body, SUPER) ?? `^${body}`)
  s = s.replace(/_\{([^{}]+)\}/g, (_, body: string) => script(body, SUB) ?? `_(${body})`)
  s = s.replace(/_([^{}\s\\])/g, (_, body: string) => script(body, SUB) ?? `_${body}`)
  s = s.replace(/\\([a-zA-Z]+)/g, (_, name: string) => SYMBOLS[name] ?? name)
  return s.replace(/[{}\\]/g, '').replace(/\s{2,}/g, ' ').trim()
}

/** Số công thức "cao" (phân số, căn, tổng, tích phân) trong chuỗi — làm dòng chữ phình ra. */
export function tallMathCount(text: string): number {
  if (!text.includes('$')) return 0
  let count = 0
  for (const [, latex] of text.matchAll(MATH_SPAN)) {
    count += (latex.match(/\\(?:d|t)?frac|\\sqrt|\\sum|\\int|\\binom|\\prod/g) ?? []).length
  }
  return count
}

/** Chữ thuần của một chuỗi có thể chứa `$...$` — dùng đo chữ, đếm ngân sách, xuất PPTX. */
export function mathToPlain(text: string): string {
  if (!text.includes('$')) return text
  return text.replace(MATH_SPAN, (_, latex: string) => latexToPlain(latex))
}
