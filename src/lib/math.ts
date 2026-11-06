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
  // ảnh chèn giữa chữ (đề tương tác): ![alt|rộng%](src)
  const token = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|!\[[^\]\n]*\]\((?:https?:|data:image\/|\/)[^)\s]+\))/g
  let match: RegExpExecArray | null

  while ((match = token.exec(input)) !== null) {
    if (match.index > cursor) out.push(inlineMarks(escapeHtml(input.slice(cursor, match.index))))
    const raw = match[0]
    if (raw.startsWith('![')) {
      out.push(inlineImage(raw))
      cursor = match.index + raw.length
      continue
    }
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
  if (cursor < input.length) out.push(inlineMarks(escapeHtml(input.slice(cursor))))
  return out.join('')
}

function inlineImage(raw: string): string {
  // token khớp ở trên cho phép mọi chữ sau "|": không khớp mẫu đầy đủ thì giữ nguyên chữ, không làm sập trang
  const m = /^!\[([^\]|]*)(?:\|([^\]]*))?\]\(([^)]+)\)$/.exec(raw)
  if (!m) return escapeHtml(raw)
  const pct = Number.parseInt(m[2] ?? '', 10)
  const w = pct >= 1 && pct <= 100 ? `width:${pct}%;` : 'max-width:min(100%,420px);'
  return `<img src="${escapeHtml(m[3])}" alt="${escapeHtml(m[1])}" loading="lazy" style="${w}height:auto;display:block;margin:6px 0;background:#fff;border-radius:6px">`
}

/** **đậm**, __gạch chân__, *nghiêng* (dấu sát chữ, không qua dòng) — chỉ ở phần chữ, không đụng công thức */
function inlineMarks(html: string): string {
  return html
    .replace(/\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
    .replace(/__(?=\S)([^_\n]+?)(?<=\S)__/g, '<u>$1</u>')
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]+?)(?<=\S)\*(?![*\w])/g, '$1<em>$2</em>')
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

