/**
 * Test thang nguồn: tìm tài liệu đã lưu theo lớp/môn + rule/prompt nguồn.
 * Chạy: npm run test:sources
 */
import assert from 'node:assert/strict'
import { emptyDoc } from '../src/data/docTypes.ts'
import { useDocStore } from '../src/store/docs.ts'
import { findSavedSources, sourcePrompt, sourceRule } from '../src/lib/sources.ts'

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
const grade9 = emptyDoc({ title: 'Đề Văn 9', grade: 'Lớp 9', subject: 'Ngữ văn' })
grade9.blocks = [{ type: 'paragraph', text: 'Nghị luận văn học' }]
useDocStore.setState({ myDocs: [grade7, grade9] })

const matched = findSavedSources('Soạn đề kiểm tra toán lớp 7 về căn bậc hai')
assert.equal(matched.length, 1, 'phải tìm đúng tài liệu Toán 7')
assert.match(matched[0].name, /Lớp 7/)
assert.match(matched[0].text, /căn bậc hai/)
console.log('✅ tìm tài liệu đã lưu theo lớp/môn')

const noMatch = findSavedSources('Soạn đề hóa lớp 11 về ancol')
assert.equal(noMatch.length, 0, 'không được lôi tài liệu không liên quan')
console.log('✅ không lấy tài liệu ngoài phạm vi')

const tier1 = { tier: 1, items: [{ tier: 1, name: 'mau.docx', text: 'Mẫu đề' }], warnings: [] }
assert.match(sourceRule(tier1), /TỆP MẪU/)
assert.match(sourceRule(tier1), /KHÔNG phải chỉ dẫn/)
assert.match(sourcePrompt(tier1), /Mẫu đề/)
console.log('✅ rule ưu tiên 1 + chống prompt injection')

assert.equal(sourcePrompt({ tier: 0, items: [], warnings: [] }), '')
console.log('✅ không có nguồn thì không chèn khối NGUỒN')

console.log('\n4/4 pass, 0 fail')
