import type { Span } from '@/data/docTypes'

export const CODE_FONT = 'Consolas, monospace'
const MATH_PATTERN = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/.source
export const CODE_PATTERN = /```[^\r\n`]*\r?\n([\s\S]*?)\r?\n[ \t]*```|`([^`\r\n]+)`/.source

export function isCodeSpan(span: Span): boolean {
  return !!span.marks?.some((m) => m.type === 'textStyle' && m.attrs?.fontFamily === CODE_FONT)
}

/** Recognize Markdown code and older multiline snippets with indentation or language syntax. */
export function splitExamCode(span: Span): Span[] {
  if (!span.text || isCodeSpan(span)) return [span]
  const code = (text: string): Span => ({
    ...span,
    text: text.replace(/\r\n/g, '\n'),
    marks: [
      ...(span.marks ?? []).filter((m) => m.type !== 'textStyle'),
      { type: 'textStyle', attrs: { fontFamily: CODE_FONT } },
    ],
  })
  const parts: Span[] = []
  let start = 0
  for (const m of span.text.matchAll(new RegExp(`${MATH_PATTERN}|${CODE_PATTERN}`, 'g'))) {
    if (m[1] === undefined && m[2] === undefined) continue
    if (m.index > start) parts.push({ ...span, text: span.text.slice(start, m.index) })
    parts.push(code(m[1] ?? m[2]))
    start = m.index + m[0].length
  }
  if (start) {
    if (start < span.text.length) parts.push({ ...span, text: span.text.slice(start) })
    return parts
  }
  const lines = span.text.split(/\r?\n/)
  if (lines.length > 1 && !span.text.includes('$') && lines.some((line) =>
    /^\s*(?:#include\b|def\s+\w+\(|(?:print|writeln|printf)\s*\(|\w+\s*(?::=|=(?!=))\s*\S|(?:if|elif|for|while)\s+.+:\s*$)/.test(line),
  )) return [code(span.text)]
  return [span]
}

/** Đọc dấu đậm trong dữ liệu AI và đề đã lưu, giữ nguyên công thức và đoạn mã. */
export function splitExamInline(span: Span): Span[] {
  return splitExamCode(span).flatMap((part) => {
    if (isCodeSpan(part) || part.image || !part.text.includes('**')) return [part]
    const spans: Span[] = []
    const marks = part.marks?.some((mark) => mark.type === 'bold') ? part.marks : [...(part.marks ?? []), { type: 'bold' } as const]
    let start = 0
    for (const m of part.text.matchAll(new RegExp(`${MATH_PATTERN}|\\*\\*([^*\\s](?:[^\\r\\n]*?[^*\\s])?)\\*\\*`, 'g'))) {
      if (!m[1]) continue
      if (m.index > start) spans.push({ ...part, text: part.text.slice(start, m.index) })
      spans.push({ ...part, text: m[1], marks })
      start = m.index + m[0].length
    }
    if (start < part.text.length) spans.push({ ...part, text: part.text.slice(start) })
    return spans
  })
}
