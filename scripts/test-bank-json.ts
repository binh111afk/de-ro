import assert from 'node:assert/strict'
import { importDrafts, parseJsonDrafts } from '../src/lib/bankImport'

const question = {
  type: 'trac-nghiem',
  prompt: '  Hai cộng hai bằng bao nhiêu?  ',
  options: [{ key: 'A', text: '3' }, { key: 'B', text: '4' }],
  answer: 'b',
  explanation: 'Cộng trực tiếp.',
  solution: ['Hai cộng hai bằng bốn.'],
  image: { src: 'data:image/png;base64,AA==', position: 'top', width: 60, alt: 'Hình minh họa' },
}

const source = JSON.stringify([question])
const array = parseJsonDrafts(source)
assert.equal(array.warning, undefined)
assert.equal(array.drafts.length, 1)
assert.equal(array.drafts[0].prompt, question.prompt.trim())
assert.equal(array.drafts[0].answer, 'B')
assert.equal(array.drafts[0].selected, true)
assert.deepEqual(array.drafts[0].options, question.options)
assert.equal(array.drafts[0].explanation, question.explanation)
assert.deepEqual(array.drafts[0].solution, question.solution)
assert.deepEqual(array.drafts[0].image, { ...question.image, plot: undefined })

const object = parseJsonDrafts(JSON.stringify({ questions: [question, {}, null, { ...question, answer: undefined }] }))
assert.equal(object.drafts.length, 2)
assert.equal(object.drafts[1].selected, false)
assert.match(object.warning ?? '', /Bỏ qua 2 câu.*vị trí 2/)

assert.throws(() => parseJsonDrafts('{"questions": ['), /JSON sai cú pháp/)
assert.throws(() => parseJsonDrafts('{"questions": {}}'), /questions là một mảng/)
assert.throws(() => parseJsonDrafts('[]'), /Không có câu hỏi hợp lệ.*trống/)
assert.throws(() => parseJsonDrafts('[{"type":"tu-luan"}]'), /Không có câu hỏi hợp lệ.*Bỏ qua 1 câu.*vị trí 1/)

const file = new File([source], 'de.JSON', { type: 'application/json' })
const imported = await importDrafts(file, () => assert.fail('Tệp JSON phải được đọc trực tiếp'))
assert.equal(imported.drafts[0].prompt, question.prompt.trim())

console.log('Kiểm tra nhập JSON ngân hàng câu hỏi: đạt.')
