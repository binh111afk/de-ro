import katex from 'katex'
import 'katex/dist/katex.min.css'

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

/** Strip math markup down to plain text — used for search indexing and previews. */
export function plainText(input: string): string {
  return input
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
}

/** Vietnamese-friendly number formatting for the UI (1.234,5). */
export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })
}

/** Points use the Vietnamese comma: 0,25 */
export function formatPoints(p: number): string {
  return p.toLocaleString('vi-VN', {
    minimumFractionDigits: p % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
