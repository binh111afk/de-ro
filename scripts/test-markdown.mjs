/**
 * Test parser markdown tối giản dùng cho khung chat AI.
 * Chạy: npx tsx scripts/test-markdown.mjs
 */
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseInline, parseMarkdown, Markdown } from '../src/lib/aiChatMarkdown.tsx'

let pass = 0
let fail = 0
const check = (name, fn) => {
  try {
    fn()
    pass++
    console.log('✅', name)
  } catch (err) {
    fail++
    console.log('❌', name, '-', err.message)
  }
}

check('đậm và chữ thường', () => {
  assert.deepEqual(parseInline('a **b** c'), [
    { type: 'text', text: 'a ' },
    { type: 'strong', text: 'b' },
    { type: 'text', text: ' c' },
  ])
})

check('nghiêng bằng * và _', () => {
  assert.deepEqual(parseInline('*a* _b_'), [
    { type: 'em', text: 'a' },
    { type: 'text', text: ' ' },
    { type: 'em', text: 'b' },
  ])
})

check('snake_case không bị coi là nghiêng', () => {
  assert.deepEqual(parseInline('ai_deck_config'), [{ type: 'text', text: 'ai_deck_config' }])
})

check('code nội tuyến', () => {
  assert.deepEqual(parseInline('dùng `x = 1` nhé'), [
    { type: 'text', text: 'dùng ' },
    { type: 'code', text: 'x = 1' },
    { type: 'text', text: ' nhé' },
  ])
})

check('link http được nhận', () => {
  const out = parseInline('[xem](https://example.com/a)')
  assert.deepEqual(out, [{ type: 'link', text: 'xem', href: 'https://example.com/a' }])
})

check('javascript: bị chặn, giữ nguyên chữ', () => {
  const out = parseInline('[bấm](javascript:alert(1))')
  assert.equal(out[0].type, 'text')
})

check('danh sách gạch đầu dòng', () => {
  const blocks = parseMarkdown('- một\n- hai')
  assert.equal(blocks.length, 1)
  assert.equal(blocks[0].type, 'list')
  assert.equal(blocks[0].ordered, false)
  assert.equal(blocks[0].items.length, 2)
  assert.equal(blocks[0].items[1][0].text, 'hai')
})

check('danh sách đánh số', () => {
  const blocks = parseMarkdown('1. một\n2. hai')
  assert.equal(blocks[0].type, 'list')
  assert.equal(blocks[0].ordered, true)
})

check('khối code giữ nguyên nội dung', () => {
  const blocks = parseMarkdown('```\n**không đậm**\n```')
  assert.deepEqual(blocks, [{ type: 'code', text: '**không đậm**' }])
})

check('tiêu đề và đoạn văn', () => {
  const blocks = parseMarkdown('## Mục\nnội dung')
  assert.equal(blocks[0].type, 'h')
  assert.equal(blocks[0].level, 2)
  assert.equal(blocks[1].type, 'p')
  assert.deepEqual(blocks[1].inlines, [{ type: 'text', text: 'nội dung' }])
})

check('xuống dòng trong đoạn được giữ', () => {
  const blocks = parseMarkdown('dòng 1\ndòng 2')
  assert.equal(blocks.length, 1)
  assert.deepEqual(blocks[0].inlines, [{ type: 'text', text: 'dòng 1\ndòng 2' }])
})

const render = (text) => renderToStaticMarkup(createElement(Markdown, { text }))

check('render React: đậm, danh sách, khối code', () => {
  const html = render('**đậm**\n\n- một\n- hai\n\n```\ncode\n```')
  assert.match(html, /<strong>đậm<\/strong>/)
  assert.match(html, /<ul><li>một<\/li><li>hai<\/li><\/ul>/)
  assert.match(html, /<pre class="ai-md-pre"><code>code<\/code><\/pre>/)
})

check('render React: JSON hiện trong khối pre', () => {
  const html = render('{"title":"A","blocks":[]}')
  assert.match(html, /^<pre class="ai-md-pre">/)
  assert.match(html, /&quot;title&quot;/)
})

check('render React: không chèn HTML thô từ model', () => {
  const html = render('<img src=x onerror=alert(1)>')
  assert.ok(!html.includes('<img'))
})

check('bảng: giữ dấu | trong công thức và mã nội tuyến', () => {
  const [table] = parseMarkdown('| Đại lượng | Biểu thức |\n| --- | ---: |\n| **Giá trị** | $|x|$ |\n| Mã | `a|b` |')
  assert.equal(table.type, 'table')
  assert.deepEqual(table.rows[0][1], [{ type: 'math', text: '|x|', display: false }])
  assert.deepEqual(table.rows[1][1], [{ type: 'code', text: 'a|b' }])
  assert.match(render('| A | B |\n| --- | --- |\n| 1 | 2 |'), /<table><thead>.*<tbody>/)
})

check('KaTeX trong văn bản, công thức khối và mã nguyên văn', () => {
  const html = render('**$x^2$**\n\n$$\n\\frac{1}{2}\n$$\n\n```text\n$x^2$\n```')
  assert.match(html, /<strong>.*class="katex"/)
  assert.match(html, /class="katex-display"/)
  assert.match(render('**$a*b$** và _$x_1$_'), /<strong>.*class="katex".*<\/strong>.*<em>.*class="katex"/)
  assert.match(html, /<code>\$x\^2\$<\/code>/)
  assert.doesNotMatch(render('$\\href{javascript:alert(1)}{Bấm}$'), /<a\b|href="javascript:/)
})

check('giữ dấu đô la của giá tiền cạnh công thức', () => {
  const html = render('**Giá $50** hay $60. Tính $S.ABCD$ với $AB=2$.\n\n- $$x^2$$\n- `$x$`')
  assert.match(html, /<strong>Giá \$50<\/strong> hay \$60\./)
  assert.equal((html.match(/class="katex"/g) ?? []).length, 3)
  assert.match(html, /<code[^>]*>\$x\$<\/code>/)
  assert.match(render('| Giá A | Giá B |\n| --- | --- |\n| $50 | $60 |'), /<td>\$50<\/td><td>\$60<\/td>/)
})

check('link đầu tin và các giao thức bị chặn', () => {
  assert.match(render('[Tài liệu](https://example.com/)'), /href="https:\/\/example\.com\/" target="_blank" rel="noreferrer noopener"/)
  for (const href of ['mailto:a@example.com', 'javascript:alert', 'data:text/html,a', '/soan-de']) {
    assert.doesNotMatch(render(`[Bấm](${href})`), /<a\b/)
  }
})

check('tin thường và tóm tắt tài liệu giữ cách hiển thị cũ', () => {
  const html = renderToStaticMarkup(createElement(Markdown, { text: '$x^2$\n\n| A |\n| --- |\n| B |', chat: false }))
  assert.match(html, /\$x\^2\$/)
  assert.doesNotMatch(html, /<table>|class="katex"/)
})

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
