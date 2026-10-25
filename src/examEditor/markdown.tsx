/**
 * Markdown tối giản cho khung chat AI.
 *
 * Chỉ dùng một tập con đủ cho câu trả lời của model: đoạn văn, tiêu đề, danh
 * sách, trích dẫn, code, đậm/nghiêng/code nội tuyến và liên kết. Render thẳng
 * ra React node (không `dangerouslySetInnerHTML`) nên nội dung model trả về
 * không thể chèn HTML/script.
 *
 * Nếu cả câu trả lời là JSON (trường hợp AI trả đề/slide), hiển thị trong khối
 * code thay vì để markdown biến nó thành một mớ chữ.
 */
import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'code'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'em'; text: string }
  | { type: 'link'; text: string; href: string }

export type Block =
  | { type: 'p'; inlines: Inline[] }
  | { type: 'h'; level: number; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'code'; text: string }
  | { type: 'quote'; inlines: Inline[] }
  | { type: 'hr' }

/** Chỉ cho phép giao thức an toàn — chặn `javascript:` và `data:`. */
const SAFE_HREF = /^(https?:\/\/|mailto:)/i

const INLINE_RE =
  /(`[^`\n]+`|\*\*(?=\S)[^*\n]*?\*\*|__(?=\S)[^_\n]*?__|\*(?=\S)[^*\n]*?\*|(?<![A-Za-z0-9])_(?=\S)[^_\n]*?_(?![A-Za-z0-9])|\[[^\]\n]+\]\([^)\s]+\))/g

const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)\)$/

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let last = 0

  for (const m of src.matchAll(INLINE_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ type: 'text', text: src.slice(last, at) })

    const tok = m[0]
    if (tok.startsWith('`')) {
      out.push({ type: 'code', text: tok.slice(1, -1) })
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      out.push({ type: 'strong', text: tok.slice(2, -2) })
    } else if (tok.startsWith('[')) {
      const link = tok.match(LINK_RE)
      if (link && SAFE_HREF.test(link[2])) {
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

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (!para.length) return
    blocks.push({ type: 'p', inlines: parseInline(para.join('\n')) })
    para = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

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

    if (HR_RE.test(line)) {
      flush()
      blocks.push({ type: 'hr' })
      continue
    }

    const h = line.match(HEADING_RE)
    if (h) {
      flush()
      blocks.push({ type: 'h', level: h[1].length, inlines: parseInline(h[2].trim()) })
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
      blocks.push({ type: 'quote', inlines: parseInline(body.join('\n')) })
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
        items.push(parseInline(m[1].trim()))
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

function inlineNodes(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (n.type === 'code') {
      return (
        <code key={i} className="ai-md-inline-code">
          {n.text}
        </code>
      )
    }
    if (n.type === 'strong') return <strong key={i}>{n.text}</strong>
    if (n.type === 'em') return <em key={i}>{n.text}</em>
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

export function Markdown({ text, className }: { text: string; className?: string }) {
  const trimmed = text.trim()

  // AI trả JSON (đề/slide) — hiện nguyên khối code, đừng để markdown nuốt dấu.
  if (/^[{\[]/.test(trimmed)) {
    return <pre className={cn('ai-md-pre', className)}>{trimmed}</pre>
  }

  return (
    <div className={cn('ai-md', className)}>
      {parseMarkdown(text).map((b, i) => {
        if (b.type === 'p') return <p key={i}>{inlineNodes(b.inlines)}</p>
        if (b.type === 'h') {
          const Tag = b.level <= 2 ? 'h3' : 'h4'
          return <Tag key={i}>{inlineNodes(b.inlines)}</Tag>
        }
        if (b.type === 'code') {
          return (
            <pre key={i} className="ai-md-pre">
              <code>{b.text}</code>
            </pre>
          )
        }
        if (b.type === 'quote') return <blockquote key={i}>{inlineNodes(b.inlines)}</blockquote>
        if (b.type === 'hr') return <hr key={i} />
        const List = b.ordered ? 'ol' : 'ul'
        return (
          <List key={i}>
            {b.items.map((item, j) => (
              <li key={j}>{inlineNodes(item)}</li>
            ))}
          </List>
        )
      })}
    </div>
  )
}
