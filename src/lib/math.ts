import { CODE_PATTERN } from './examCode'
import katex from 'katex'
import 'katex/contrib/mhchem' // \ce{...} cho phương trình hoá học
import 'katex/dist/katex.min.css'
export { formatPoints, plainText } from './mathText'

const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_SEP = /^\s*\|\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)+\|?\s*$/

/**
 * Render a string that may contain `$...$` inline math, `$$...$$` display math,
 * inline images, code spans, and Markdown tables.
 */
export function renderMath(input: string): string {
  if (!input) return ''
  const lines = input.split('\n')
  if (lines.some((l) => TABLE_SEP.test(l))) {
    const chunks: string[] = []
    let plain: string[] = []
    const flushPlain = () => {
      if (!plain.length) return
      chunks.push(renderInlineMath(plain.join('\n')))
      plain = []
    }
    for (let i = 0; i < lines.length; i++) {
      if (i + 1 < lines.length && TABLE_ROW.test(lines[i]) && TABLE_SEP.test(lines[i + 1])) {
        flushPlain()
        const header = splitTableRow(lines[i])
        const body: string[][] = []
        i += 2
        while (i < lines.length && TABLE_ROW.test(lines[i])) {
          body.push(splitTableRow(lines[i]))
          i++
        }
        i--
        const ths = header.map((c) => `<th class="border border-line px-2.5 py-1.5 text-left font-semibold bg-sunken/70">${renderInlineMath(c)}</th>`).join('')
        const trs = body
          .map((row) => `<tr>${header.map((_, ci) => `<td class="border border-line px-2.5 py-1.5">${renderInlineMath(row[ci] ?? '')}</td>`).join('')}</tr>`)
          .join('')
        chunks.push(`<table class="my-2 w-full border-collapse text-[14px]"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`)
      } else {
        plain.push(lines[i])
      }
    }
    flushPlain()
    return chunks.join('\n')
  }
  return renderInlineMath(input)
}

function splitTableRow(line: string): string[] {
  const s = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return s.split('|').map((c) => c.trim())
}

function renderInlineMath(input: string): string {
  if (!input) return ''
  const out: string[] = []
  let cursor = 0

  // split on $$...$$ first, then $...$
  // ảnh chèn giữa chữ (đề tương tác): ![alt|rộng%](src)
  const mathOrImage = /\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|!\[[^\]\n]*\]\((?:https?:|data:image\/|\/)[^)\s]+\)/.source
  const token = new RegExp(`${mathOrImage}|${CODE_PATTERN}`, 'g')
  let match: RegExpExecArray | null

  while ((match = token.exec(input)) !== null) {
    if (match.index > cursor) out.push(inlineMarks(escapeHtml(input.slice(cursor, match.index))))
    const raw = match[0]
    const code = match[1] ?? match[2]
    if (code !== undefined) {
      out.push(`<code style="white-space:pre-wrap;tab-size:4;font-family:Consolas,monospace">${escapeHtml(code)}</code>`)
      cursor = match.index + raw.length
      continue
    }
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

