/**
 * Test HTML xuất Word/in: đánh số câu theo thứ tự và phương án 2 cột.
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/test-export.mjs
 */
import assert from 'node:assert/strict'
import { buildWordHtml } from '../src/examEditor/exportBlocks.ts'

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

const doc = (blocks) => ({ id: 'd1', title: 'Đề thử', blocks, createdAt: '', updatedAt: '' })

check('đánh số câu theo thứ tự khối, bỏ qua block.no cũ', () => {
  const html = buildWordHtml(
    doc([
      {
        type: 'question',
        no: 99,
        text: 'Câu đầu',
        options: [
          { label: 'A', text: 'a' },
          { label: 'B', text: 'b' },
        ],
      },
      {
        type: 'question',
        no: 5,
        text: 'Câu hai',
        options: [{ label: 'A', text: 'a' }],
      },
    ]),
  )
  assert.match(html, /<b>Câu 1\.<\/b> Câu đầu/)
  assert.match(html, /<b>Câu 2\.<\/b> Câu hai/)
  assert.ok(!html.includes('Câu 99.'))
})

check('bài tự luận đánh số riêng', () => {
  const html = buildWordHtml(
    doc([
      { type: 'essay', no: 7, score: 2, text: 'Bài đầu', sub: ['ý 1'] },
      { type: 'essay', no: 8, score: 1, text: 'Bài hai' },
    ]),
  )
  assert.match(html, /<b>Bài 1 \(2 điểm\)\.<\/b> Bài đầu/)
  assert.match(html, /<b>Bài 2 \(1 điểm\)\.<\/b> Bài hai/)
})

check('phương án là bảng 2 cột (Word không hiểu flex)', () => {
  const html = buildWordHtml(
    doc([
      {
        type: 'question',
        no: 1,
        text: 'Chọn',
        options: [
          { label: 'A', text: 'a' },
          { label: 'B', text: 'b' },
          { label: 'C', text: 'c' },
        ],
      },
    ]),
  )
  assert.match(html, /<div class="opts c\d"><table><tr><td class="opt"/)
  assert.equal((html.match(/<td class="opt/g) || []).length, 3)
  assert.ok(!/\.opts \{[^}]*display: flex/.test(html))
  assert.match(html, /\.opts td \{[^}]*width: 50%/)
})

check('số cột phương án theo độ dài như màn hình: 4 / 2 / 1', () => {
  const q = (texts) => ({ type: 'question', no: 1, text: 'Chọn', options: texts.map((t, i) => ({ label: 'ABCD'[i], text: t })) })
  const cols = (texts) => buildWordHtml(doc([q(texts)])).match(/class="opts c(\d)"/)[1]
  assert.equal(cols(['2', '4', '6', '8']), '4')
  assert.equal(cols(['$(-\\infty;-1)$', '$(-1;1)$', '$(1;+\\infty)$', '$(-\\infty;+\\infty)$']), '4')
  assert.equal(cols(['Một câu trả lời dài vừa phải', 'Đáp án thứ hai cũng vừa phải', 'Phương án thứ ba đây', 'Phương án thứ bốn đây']), '2')
  assert.equal(cols(['Một câu trả lời rất rất dài '.repeat(5), 'b', 'c', 'd']), '1')
})

check('công thức $…$ xuất MathML (bản in/PDF không còn dấu $ thô)', () => {
  const html = buildWordHtml(doc([{ type: 'paragraph', text: 'Tính $\\frac{a}{b}$ và $x^2$; giá 5 đồng' }]))
  assert.match(html, /<math[^>]*>[\s\S]*<mfrac>/)
  assert.match(html, /<msup>/)
  assert.ok(!html.includes('$'))
  assert.ok(html.includes('giá 5 đồng'))
})

check('CSS dùng chung cho Word và bản in', () => {
  const html = buildWordHtml(doc([{ type: 'paragraph', text: 'x' }]))
  assert.match(html, /@page \{ size: A4; margin: 1\.8cm 1\.6cm; \}/)
  assert.match(html, /\.rub \{ margin: 0 0 8px 22px; \}/)
})

check('đầu đề 2 cột: xuống dòng + mark boxed khi xuất Word', () => {
  const html = buildWordHtml(
    doc([
      {
        type: 'header',
        left: [{ text: 'ĐỀ CHÍNH THỨC', marks: [{ type: 'boxed' }] }],
        right: 'KỲ THI …\nMôn thi: Toán',
      },
    ]),
  )
  assert.match(html, /<span style="border:1px solid #000[^"]*">ĐỀ CHÍNH THỨC<\/span>/)
  assert.match(html, /KỲ THI …<br>Môn thi: Toán/)
  assert.match(html, /\.hdr td \{[^}]*text-align: center/)
})

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
