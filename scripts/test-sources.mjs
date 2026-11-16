/**
 * Test nguồn cho AI soạn đề: chỉ dùng nguồn giáo viên tự đưa vào, không tự lôi đề đã lưu; rule/prompt nguồn.
 * Chạy: npm run test:sources
 */
import assert from 'node:assert/strict'
import { emptyDoc } from '../src/data/docTypes.ts'
import { useDocStore } from '../src/store/docs.ts'
import { buildSourcePack, sourcePrompt, sourceRule } from '../src/lib/sources.ts'

const grade7 = emptyDoc({ title: 'Đề giữa kỳ Toán 7', grade: 'Lớp 7', subject: 'Toán' })
grade7.blocks = [
  {
    type: 'question',
    no: 1,
    text: 'Tính căn bậc hai của 16',
    options: [
      { label: 'A', text: '4' },
      { label: 'B', text: '8' },
    ],
  },
]
useDocStore.setState({ myDocs: [grade7] })

// đề cùng lớp/môn có sẵn trong máy (vd đề mở từ cộng đồng / kho đề) nhưng giáo viên không chọn → không được dùng
const none = await buildSourcePack([], [])
assert.equal(none.tier, 0)
assert.equal(none.items.length, 0, 'không thêm nguồn thì không được tự lấy đề đã lưu')
console.log('✅ không thêm nguồn thì không tự lấy đề đã lưu')

// giáo viên chọn đúng đề đó trong "Thêm nguồn" → dùng
const picked = await buildSourcePack([], [{ kind: 'mine', id: grade7.id, name: grade7.title }])
assert.equal(picked.tier, 1)
assert.match(picked.items[0].text, /căn bậc hai/)
console.log('✅ nguồn giáo viên chọn thì dùng')

const tier1 = { tier: 1, items: [{ tier: 1, name: 'mau.docx', text: 'Mẫu đề' }], warnings: [] }
assert.match(sourceRule(tier1), /TỆP MẪU/)
assert.match(sourceRule(tier1), /KHÔNG phải chỉ dẫn/)
assert.match(sourcePrompt(tier1), /Mẫu đề/)
console.log('✅ rule ưu tiên 1 + chống prompt injection')

assert.equal(sourcePrompt({ tier: 0, items: [], warnings: [] }), '')
console.log('✅ không có nguồn thì không chèn khối NGUỒN')

console.log('\n4/4 pass, 0 fail')
