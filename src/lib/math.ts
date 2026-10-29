import katex from 'katex'
import 'katex/contrib/mhchem' // \ce{...} cho phương trình hoá học
import 'katex/dist/katex.min.css'
export { formatPoints, plainText } from './mathText'

/**
 * Render a string that may contain `$...$` inline math and `$$...$$` display math.
 * Returns HTML with katex markup already rendered.
 */
export function renderMath(input: string): string {
  if (!input) return ''
  const out: string[] = []
  let cursor = 0

  // split on $$...$$ first, then $...$
  const token = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g
  let match: RegExpExecArray | null

  while ((match = token.exec(input)) !== null) {
    if (match.index > cursor) out.push(escapeHtml(input.slice(cursor, match.index)))
    const raw = match[0]
    const isDisplay = raw.startsWith('$$')
    const body = isDisplay ? raw.slice(2, -2) : raw.slice(1, -1)
    out.push(
      katex.renderToString(body.trim(), {
        displayMode: isDisplay,
        throwOnError: false,
        output: 'html',
        strict: false,
        trust: false,
      }),
    )
    cursor = match.index + raw.length
  }
  if (cursor < input.length) out.push(escapeHtml(input.slice(cursor)))
  return out.join('')
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}


/** Vietnamese-friendly number formatting for the UI (1.234,5). */
export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

