/**
 * Bảng vẽ — công thức LaTeX thành SVG thuần đường nét (MathJax, không cần phông),
 * vẽ được lên canvas và xuất PNG/PDF như ảnh thường. Nạp lười khi mở hộp công thức.
 */

type Conv = (tex: string) => string

let conv: Promise<Conv> | null = null

function loadConv(): Promise<Conv> {
  conv ??= (async () => {
    const [{ mathjax }, { TeX }, { SVG }, { liteAdaptor }, { RegisterHTMLHandler }, { AllPackages }] = await Promise.all([
      import('mathjax-full/js/mathjax.js'),
      import('mathjax-full/js/input/tex.js'),
      import('mathjax-full/js/output/svg.js'),
      import('mathjax-full/js/adaptors/liteAdaptor.js'),
      import('mathjax-full/js/handlers/html.js'),
      import('mathjax-full/js/input/tex/AllPackages.js'),
    ])
    const adaptor = liteAdaptor()
    RegisterHTMLHandler(adaptor)
    const doc = mathjax.document('', {
      InputJax: new TeX({ packages: AllPackages.filter((p: string) => p !== 'bussproofs') }),
      OutputJax: new SVG({ fontCache: 'none' }),
    })
    return (tex: string) => {
      const node = doc.convert(tex, { display: true })
      return adaptor.innerHTML(node)
    }
  })()
  return conv
}

export interface FormulaSvg {
  svg: string
  w: number
  h: number
  /** MathJax báo lỗi cú pháp */
  error: string
}

/** ex của MathJax so với cỡ chữ */
const EX = 0.442

/** LaTeX → SVG cỡ `size` px, màu `color`. */
export async function texToSvg(tex: string, size: number, color: string): Promise<FormulaSvg> {
  const toSvg = await loadConv()
  let svg = toSvg(tex)
  const err = /data-mjx-error="([^"]*)"/.exec(svg)?.[1] ?? ''
  const ex = size * EX
  const num = (attr: string) => parseFloat(new RegExp(`${attr}="([\\d.]+)ex"`).exec(svg)?.[1] ?? '0') * ex
  const w = Math.max(1, num('width')), h = Math.max(1, num('height'))
  svg = svg
    .replace(/width="[\d.]+ex"/, `width="${w.toFixed(2)}"`)
    .replace(/height="[\d.]+ex"/, `height="${h.toFixed(2)}"`)
    .replace(/style="[^"]*"/, '')
    .replace(/currentColor/g, color)
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  return { svg, w, h, error: err }
}

export const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/** Mẫu chèn nhanh trong hộp công thức */
export const FORMULA_SNIPPETS: { label: string; tex: string }[] = [
  { label: 'a/b', tex: '\\frac{a}{b}' },
  { label: '√x', tex: '\\sqrt{x}' },
  { label: 'ⁿ√x', tex: '\\sqrt[n]{x}' },
  { label: 'xⁿ', tex: 'x^{n}' },
  { label: 'xₙ', tex: 'x_{n}' },
  { label: '∫', tex: '\\int_{a}^{b} f(x)\\,dx' },
  { label: 'Σ', tex: '\\sum_{i=1}^{n} a_i' },
  { label: 'lim', tex: '\\lim_{x \\to 0}' },
  { label: 'hệ', tex: '\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}' },
  { label: 'vec', tex: '\\overrightarrow{AB}' },
  { label: '°', tex: '^{\\circ}' },
  { label: '≤', tex: '\\le' },
  { label: '≥', tex: '\\ge' },
  { label: '≠', tex: '\\ne' },
  { label: '±', tex: '\\pm' },
  { label: 'π', tex: '\\pi' },
  { label: 'α', tex: '\\alpha' },
  { label: 'Δ', tex: '\\Delta' },
  { label: '∞', tex: '\\infty' },
  { label: '⇒', tex: '\\Rightarrow' },
]
