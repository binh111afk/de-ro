/**
 * Test công thức trong slide: nhận diện `$...$`, khôi phục gạch chéo bị JSON
 * nuốt, đổi LaTeX → Unicode cho đo chữ/xuất PPTX.
 * Chạy: npm run test:slide-math
 */
import assert from 'node:assert/strict'
import { boldRuns, fixMathEscapes, hasBold, hasMath, latexToPlain, limitBold, mathToPlain } from '../src/lib/slideMath.ts'
import { repairJson } from '../src/lib/aiDeck.ts'

assert.equal(hasMath('Giá 5$ và 7$ thôi'), false, 'tiền đô không phải công thức')
assert.equal(hasMath('Cho $x^2 = 4$ nên x = 2'), true)
assert.equal(hasMath('không có gì'), false)

// JSON.parse nuốt \frac → form-feed + "rac", \times → tab + "imes"; khôi phục trong đoạn $...$
const frac = JSON.parse('{"t":"$\\frac{1}{2}$"}').t
assert.ok(frac.includes('\f'), 'điều kiện: JSON thật sự nuốt \\f')
assert.equal(fixMathEscapes(frac), '$\\frac{1}{2}$')
assert.equal(fixMathEscapes(JSON.parse('{"t":"$2 \\times 3$"}').t), '$2 \\times 3$')
assert.equal(fixMathEscapes('xuống\ndòng thường'), 'xuống\ndòng thường', 'ngoài công thức không đụng')

assert.equal(latexToPlain('\\frac{18}{24} = \\frac{3}{4}'), '18/24 = 3/4')
assert.equal(latexToPlain('x^2 + y^{10}'), 'x² + y¹⁰')
assert.equal(latexToPlain('\\sqrt{b^2 - 4ac}'), '√(b² - 4ac)')
assert.equal(latexToPlain('a_1 \\cdot a_n \\leq \\pi'), 'a₁ · aₙ ≤ π')
assert.equal(latexToPlain('\\ce{Zn + CuSO4 -> ZnSO4 + Cu}'), 'Zn + CuSO4 → ZnSO4 + Cu')
assert.equal(mathToPlain('Ta có $\\frac{a}{b}$ nên đúng'), 'Ta có a/b nên đúng')
assert.equal(mathToPlain('chữ thường'), 'chữ thường')

// backslash lạ (\c của \cdot, \( ) làm hỏng JSON → repairJson nhân đôi để cứu
const bad = '{"t":"$a \\cdot b$ và \\(x\\)"}'
assert.throws(() => JSON.parse(bad))
const fixed = repairJson(bad)
assert.ok(fixed)
assert.equal(JSON.parse(fixed).t, '$a \\cdot b$ và \\(x\\)')

// **đậm**: nhận diện, chữ thuần (đo/xuất), giới hạn 2 cụm × 6 từ, bỏ ** lẻ, tách run cho PPTX
assert.equal(hasBold('tìm **ước chung** lớn nhất'), true)
assert.equal(hasBold('2 ** 3 và 5'), false, '** lẻ không phải cặp')
assert.equal(mathToPlain('tìm **ước chung** của $\\frac{1}{2}$'), 'tìm ước chung của 1/2')
assert.equal(limitBold('**a** và **b** và **c**'), '**a** và **b** và c', 'tối đa 2 cụm')
assert.equal(limitBold('**cả câu này rất dài không nên in đậm hết**'), 'cả câu này rất dài không nên in đậm hết', 'cụm > 6 từ thành thường')
assert.equal(limitBold('lẻ ** một dấu'), 'lẻ  một dấu')
assert.deepEqual(boldRuns('a **b** c'), [{ text: 'a ', bold: false }, { text: 'b', bold: true }, { text: ' c', bold: false }])

console.log('test-slide-math: công thức nhận diện/khôi phục/đổi Unicode/sửa JSON pass')
