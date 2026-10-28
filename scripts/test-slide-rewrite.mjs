/**
 * Test "Hỏi AI" trên ô chữ: làm sạch câu trả lời của model và co cỡ chữ cho vừa hộp (không gọi LLM).
 * Chạy: npm run test:slide-rewrite
 */
import assert from 'node:assert/strict'
import { cleanRewrite, rewritePatch } from '../src/lib/slideRewrite.ts'

assert.equal(cleanRewrite('```\nÝ một\n```'), 'Ý một', 'bỏ hàng rào code')
assert.equal(cleanRewrite('"Câu mới"'), 'Câu mới', 'bỏ ngoặc kép bao ngoài')
assert.equal(cleanRewrite('**a** **b** **c**'), '**a** **b** c', 'chỉ giữ 2 cụm đậm')

const el = { id: 'bullets', type: 'text', x: 8, y: 30, w: 56, h: 30, text: '• Ý ngắn', variant: 'body', fontSize: 2.8 }
assert.equal(rewritePatch(el, '• Ngắn hơn').fontSize, 2.8, 'chữ ngắn giữ nguyên cỡ')
const long = Array.from({ length: 14 }, (_, i) => `• Ý số ${i + 1} khá dài để chắc chắn làm đầy hộp chữ này`).join('\n')
const shrunk = rewritePatch(el, long)
assert.ok(shrunk.fontSize < 2.8 && shrunk.fontSize >= 2.8 * 0.6 - 0.01, 'chữ dài co lại nhưng không dưới 60%')
assert.equal(shrunk.text, long)
console.log('test-slide-rewrite: pass')
