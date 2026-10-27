/**
 * Test prompt tạo ảnh: bám tiêu đề + tối đa 3 ý, bỏ ý rỗng, có fallback.
 * Không gọi mạng — phần gọi API kiểm tra riêng trong trình duyệt.
 * Chạy: npm run test:image
 */
import assert from 'node:assert/strict'
import { buildImagePrompt } from '../src/lib/imageGen.ts'

const prompt = buildImagePrompt('Phân số', ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'])
assert.ok(prompt.includes('Phân số'), 'có tiêu đề')
assert.ok(prompt.includes('Ý một') && prompt.includes('Ý ba'), 'có các ý đầu')
assert.equal(prompt.includes('Ý bốn'), false, 'chỉ lấy tối đa 3 ý')
assert.ok(prompt.includes('không có chữ'), 'chặn chữ trong ảnh')

const fallback = buildImagePrompt(undefined, ['  ', ''])
assert.ok(fallback.includes('bài học'), 'không có nội dung vẫn có chủ đề mặc định')

const plain = buildImagePrompt('Bài giảng', [])
assert.ok(plain.startsWith('Minh hoạ giáo dục chuyên nghiệp cho slide: Bài giảng.'), 'nối prompt đúng')
assert.ok(plain.includes('bố cục dọc'), 'mặc định khung ảnh dọc')
assert.ok(buildImagePrompt('Bài giảng', [], 'landscape').includes('bố cục ngang'), 'ảnh ngang')

console.log('✅ prompt ảnh: bám tiêu đề + 3 ý, fallback, không chữ trong ảnh')
console.log('\n3/3 pass, 0 fail')
