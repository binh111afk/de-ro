/**
 * Markdown tối giản cho khung chat AI.
 *
 * Văn bản và cấu trúc Markdown được vẽ bằng React. Riêng công thức dùng
 * HTML do KaTeX sinh với trust tắt.
 *
 * Nếu cả câu trả lời là JSON (trường hợp AI trả đề/slide), hiển thị trong khối
 * code thay vì để markdown biến nó thành một mớ chữ.
 */
import { Fragment, type ReactNode } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { cn } from './cn'

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'em'; text: string }
  | { type: 'math'; text: string; display: boolean }
  | { type: 'link'; text: string; href: string }

export type Block =
  | { type: 'p'; inlines: Inline[] }
  | { type: 'h'; level: number; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'code'; text: string }
  | { type: 'quote'; inlines: Inline[] }
  | { type: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { type: 'hr' }

/** Chỉ cho phép giao thức an toàn — chặn `javascript:` và `data:`. */
const SAFE_HREF = /^https?:\/\//i

const INLINE_RE =
  /(`[^`\n]+`|\*\*(?=\S)[^*\n]*?\*\*|__(?=\S)[^_\n]*?__|\*(?=\S)[^*\n]*?\*|(?<![A-Za-z0-9])_(?=\S)[^_\n]*?_(?![A-Za-z0-9])|\[[^\]\n]+\]\([^)\s]+\))/g
const INLINE_MATH_RE = /\$[^$\n]+?\$/
const MATH_RE = /\$\$[\s\S]*?\$\$|\$[^$\n]+?\$/
const markContents = (delimiter: string) => String.raw`(?:${INLINE_MATH_RE.source}|[^${delimiter}$\n]|\$(?![^$\n]+\$))*?`
const CHAT_INLINE_RE = new RegExp(MATH_RE.source + '|' + INLINE_RE.source
  .replaceAll('[^*\\n]*?', markContents('*'))
  .replaceAll('[^_\\n]*?', markContents('_')), 'g')

const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)\)$/

export function parseInline(src: string, chat = true): Inline[] {
  const out: Inline[] = []
  let last = 0

  for (const m of src.matchAll(chat ? CHAT_INLINE_RE : INLINE_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ type: 'text', text: src.slice(last, at) })

    const tok = m[0]
    if (tok.startsWith('`')) {
      out.push({ type: 'code', text: tok.slice(1, -1) })
    } else if (tok.startsWith('$')) {
      const display = tok.startsWith('$$')
      const width = display ? 2 : 1
      out.push({ type: 'math', text: tok.slice(width, -width).trim(), display })
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      out.push({ type: 'strong', text: tok.slice(2, -2) })
    } else if (tok.startsWith('[')) {
      const link = tok.match(LINK_RE)
      if (link && (SAFE_HREF.test(link[2]) || (!chat && /^mailto:/i.test(link[2])))) {
        out.push({ type: 'link', text: link[1], href: link[2] })
      } else {
        out.push({ type: 'text', text: tok })
      }
    } else {
      out.push({ type: 'em', text: tok.slice(1, -1) })
    }
    last = at + tok.length
  }

  if (last < src.length) out.push({ type: 'text', text: src.slice(last) })
  return out
}

const HEADING_RE = /^(#{1,6})\s+(.*)$/
const UL_RE = /^\s*[-*+]\s+(.*)$/
const OL_RE = /^\s*\d+[.)]\s+(.*)$/
const HR_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
const FENCE_RE = /^\s*```(.*)$/
const FENCE_END_RE = /^\s*```\s*$/
const QUOTE_RE = /^\s*>\s?(.*)$/

// Ống trong công thức, mã nội tuyến hoặc \| không ngắt ô.
function tableCells(line: string): string[] | null {
  if (!line.includes('|')) return null
  const cells = ['']
  for (const [part] of line.trim().matchAll(/`[^`]*`|\$\$.*?\$\$|\$[^$]+\$|\\\||\||[^|`$\\]+|./g)) {
    if (part === '|') cells.push('')
    else cells[cells.length - 1] += part === '\\|' ? '|' : part
  }
  if (cells.length === 1) return null
  if (!cells[0]) cells.shift()
  if (!cells.at(-1)) cells.pop()
  return cells.length ? cells.map((cell) => cell.trim()) : null
}

export function parseMarkdown(src: string, chat = true): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  const inline = (text: string) => parseInline(text, chat)
  let para: string[] = []
  const flush = () => {
    if (!para.length) return
    blocks.push({ type: 'p', inlines: inline(para.join('\n')) })
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (chat && line.trim() === '$$') {
      const end = lines.findIndex((next, j) => j > i && next.trim() === '$$')
      if (end !== -1) {
        flush()
        blocks.push({ type: 'p', inlines: [{ type: 'math', text: lines.slice(i + 1, end).join('\n').trim(), display: true }] })
        i = end
        continue
      }
    }

    if (FENCE_RE.test(line)) {
      flush()
      const body: string[] = []
      i++
      while (i < lines.length && !FENCE_END_RE.test(lines[i])) body.push(lines[i++])
      blocks.push({ type: 'code', text: body.join('\n') })
      continue
    }

    if (!line.trim()) {
      flush()
      continue
    }

    const header = chat && tableCells(line)
    const separator = header && tableCells(lines[i + 1] ?? '')
    if (separator && header.length === separator.length && separator.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      flush()
      const rows: Inline[][][] = []
      i++
      while (i + 1 < lines.length) {
        const cells = tableCells(lines[i + 1])
        if (!cells || cells.length !== header.length) break
        rows.push(cells.map(inline))
        i++
      }
      blocks.push({ type: 'table', head: header.map(inline), rows })
      continue
    }

    if (HR_RE.test(line)) {
      flush()
      blocks.push({ type: 'hr' })
      continue
    }

    const h = line.match(HEADING_RE)
    if (h) {
      flush()
      blocks.push({ type: 'h', level: h[1].length, inlines: inline(h[2].trim()) })
      continue
    }

    const quote = line.match(QUOTE_RE)
    if (quote) {
      flush()
      const body = [quote[1]]
      while (i + 1 < lines.length) {
        const next = lines[i + 1].match(QUOTE_RE)
        if (!next) break
        body.push(next[1])
        i++
      }
      blocks.push({ type: 'quote', inlines: inline(body.join('\n')) })
      continue
    }

    const ul = line.match(UL_RE)
    const ol = ul ? null : line.match(OL_RE)
    if (ul || ol) {
      flush()
      const ordered = !ul
      const items: Inline[][] = []
      while (i < lines.length) {
        const m = ordered ? lines[i].match(OL_RE) : lines[i].match(UL_RE)
        if (!m) break
        items.push(inline(m[1].trim()))
        i++
      }
      i--
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    para.push(line)
  }
  flush()

  return blocks
}

function inlineNodes(nodes: Inline[], chat: boolean): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === 'code') {
      return (
        <code key={i} className="ai-md-inline-code">
          {n.text}
        </code>
      )
    }
    if (n.type === 'math') {
      // HTML do KaTeX sinh, với lệnh tin cậy bị tắt như renderMath.
      const html = katex.renderToString(n.text, { displayMode: n.display, throwOnError: false, output: 'html', strict: false, trust: false })
      return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
    }
    const markedText = () => chat && n.text.includes('$') ? inlineNodes(parseInline(n.text), chat) : n.text
    if (n.type === 'strong') return <strong key={i}>{markedText()}</strong>
    if (n.type === 'em') return <em key={i}>{markedText()}</em>
    if (n.type === 'link') {
      return (
        <a key={i} href={n.href} target="_blank" rel="noreferrer noopener">
          {n.text}
        </a>
      )
    }
    // giữ xuống dòng bên trong một đoạn
    const parts = n.text.split('\n')
    return (
      <Fragment key={i}>
        {parts.map((part, j) => (
          <Fragment key={j}>
            {part}
            {j < parts.length - 1 ? <br /> : null}
          </Fragment>
        ))}
      </Fragment>
    )
  })
}

export function Markdown({ text, className, chat = true }: { text: string; className?: string; chat?: boolean }) {
  const trimmed = text.trim()

  // AI trả JSON (đề/slide) — hiện nguyên khối code, đừng để markdown nuốt dấu.
  if ((chat ? /^(?:\{\s*(?:"|\})|\[\s*(?:[{"\[\]]|-?\d|true\b|false\b|null\b))/ : /^[{\[]/).test(trimmed) &&
    (!chat || !/^\[[^\]\n]+\]\(/.test(trimmed))) {
    return <pre className={cn('ai-md-pre', className)}>{trimmed}</pre>
  }

  return (
    <div className={cn('ai-md', chat && 'ai-md-chat', className)}>
      {parseMarkdown(text, chat).map((b, i) => {
        const nodes = (items: Inline[]) => inlineNodes(items, chat)
        if (b.type === 'p') return <p key={i}>{nodes(b.inlines)}</p>
        if (b.type === 'h') {
          const Tag = b.level <= 2 ? 'h3' : 'h4'
          return <Tag key={i}>{nodes(b.inlines)}</Tag>
        }
        if (b.type === 'code') {
          return (
            <pre key={i} className="ai-md-pre">
              <code>{b.text}</code>
            </pre>
          )
        }
        if (b.type === 'quote') return <blockquote key={i}>{nodes(b.inlines)}</blockquote>
        if (b.type === 'hr') return <hr key={i} />
        if (b.type === 'table') return (
          <div key={i} className="ai-md-table">
            <table>
              <thead><tr>{b.head.map((cell, j) => <th key={j} scope="col">{nodes(cell)}</th>)}</tr></thead>
              <tbody>{b.rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}>{nodes(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )
        const List = b.ordered ? 'ol' : 'ul'
        return (
          <List key={i}>
            {b.items.map((item, j) => (
              <li key={j}>{nodes(item)}</li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
