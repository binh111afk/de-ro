/**
 * Test parser markdown tối giản dùng cho khung chat AI.
 * Chạy: npx tsx scripts/test-markdown.mjs
 */
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseInline, parseMarkdown, Markdown } from '../src/examEditor/markdown.tsx'

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

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
