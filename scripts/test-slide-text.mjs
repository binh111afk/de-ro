/**
 * Test chiều cao hộp chữ của slide: khung chọn phải ôm nội dung, trừ khi người
 * dùng đã kéo cao/thấp thủ công.
 * Chạy: npm run test:slide-text
 */
import assert from 'node:assert/strict'
import { textBoxHeight, elementHeight } from '../src/lib/slideText.ts'

const oneLine = textBoxHeight('Tiêu đề bài giảng', 84, 3.6)
assert.ok(oneLine > 10 && oneLine < 13, `một dòng tiêu đề ≈ 11.6%, nhận ${oneLine}`)

const threeLines = textBoxHeight('Dòng một\nDòng hai\nDòng ba', 84, 2.4)
assert.ok(threeLines > oneLine * 1.2, 'nhiều dòng phải cao hơn một dòng')

const text = { id: 't', type: 'text', x: 8, y: 42, w: 84, h: 20, text: 'Tiêu đề bài giảng' }
assert.ok(elementHeight(text) < 20, 'hộp chữ tự co theo nội dung')
assert.equal(elementHeight({ ...text, fixedHeight: true }), 20, 'kéo thủ công thì giữ chiều cao')
assert.equal(elementHeight({ ...text, text: '' }), 20, 'hộp rỗng giữ chiều cao để còn chọn được')
assert.equal(elementHeight({ ...text, type: 'shape' }), 20, 'không phải text thì giữ nguyên')

console.log('✅ khung chọn ôm nội dung, tôn trọng chiều cao thủ công')
console.log('\n5/5 pass, 0 fail')
