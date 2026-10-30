/** Kiểm lib/onlineAi.ts: chuẩn hoá câu hỏi AI trả về về đúng định dạng đề online. Chạy: `npm run test:online-ai`. */
import assert from 'node:assert/strict'
import { attachmentsPrompt, parseAiReply, sanitizeAiQuestions } from '../src/lib/onlineAi'
import { questionIssue } from '../src/lib/onlineExam'

const json = JSON.stringify({
  message: 'Đã soạn 5 câu',
  questions: [
    { type: 'trac-nghiem', prompt: 'Tính $1+1$', options: ['A. 1', 'B) 2', '3', '4'], answer: 'B', explanation: 'Vì 1+1=2' },
    { type: 'trac-nghiem', prompt: 'Chọn theo nguyên văn', options: ['một', 'hai', 'ba', 'bốn'], answer: 'hai' },
    { type: 'dung-sai', prompt: 'Cho hàm số…', options: ['a', 'b', 'c', 'd'], answer: ['Đ', 'S', true, false] },
    { type: 'dung-sai', prompt: 'Thiếu ý', options: ['a', 'b'], answer: 'ĐS' },
    { type: 'tra-loi-ngan', prompt: 'Tìm x', answer: '-3.5' },
    { type: 'tra-loi-ngan', prompt: 'Đáp án quá dài', answer: '123456' },
    { type: 'tu-luan', prompt: 'Chứng minh…', explanation: 'Gợi ý' },
    { type: 'khac', prompt: 'dạng lạ' },
    { type: 'tu-luan', prompt: '   ' },
  ],
})
const fenced = '```json\n' + json + '\n```'

const { message, questions: qs } = parseAiReply(fenced, () => 0.9999) // 0,9999: mỗi bước xáo giữ nguyên chỗ
assert.equal(message, 'Đã soạn 5 câu')
assert.equal(qs.length, 6, 'bỏ câu thiếu ý, dạng lạ, đề bài rỗng')

const [mc, byText, tf, short, longShort, essay] = qs
assert.deepEqual(mc.options!.map((o) => o.text), ['1', '2', '3', '4'], 'bỏ nhãn A. B) AI ghi sẵn')
assert.equal(mc.answer, 'B')
assert.equal(questionIssue(mc), null)
assert.equal(byText.answer, 'B', 'đáp án ghi nguyên văn thì đổi sang chữ cái')
assert.equal(tf.answer, 'ĐSĐS', 'mảng Đ/S/true/false')
assert.equal(questionIssue(tf), null)
assert.equal(short.answer, '-3,5', 'dấu chấm thập phân thành dấu phẩy')
assert.equal(longShort.answer, '', 'quá 4 ký tự thì để trống cho giáo viên bổ sung')
assert.ok(questionIssue(longShort))
assert.equal(essay.type, 'tu-luan')
assert.equal(essay.explanation, 'Gợi ý')

// xáo phương án vẫn giữ đúng đáp án; câu kiểu "cả A và B" không xáo
const pick = (opts: string[], answer: string, rng: () => number) =>
  sanitizeAiQuestions([{ type: 'trac-nghiem', prompt: 'x', options: opts, answer }], rng)[0]
for (const rng of [() => 0, () => 0.5, () => 0.99, Math.random]) {
  const q = pick(['một', 'hai', 'ba', 'bốn'], 'C', rng)
  assert.equal(q.options!.find((o) => o.key === q.answer)!.text, 'ba', 'đáp án đúng vẫn là "ba" sau khi xáo')
  assert.deepEqual(q.options!.map((o) => o.text).sort(), ['bốn', 'ba', 'hai', 'một'].sort())
}
assert.notEqual(pick(['một', 'hai', 'ba', 'bốn'], 'A', () => 0).answer, 'A', 'rng cố định làm đáp án rời khỏi A')
const keep = pick(['1', '2', 'Cả A và B đều đúng', '4'], 'C', () => 0)
assert.equal(keep.answer, 'C')
assert.deepEqual(keep.options!.map((o) => o.text), ['1', '2', 'Cả A và B đều đúng', '4'])

// phản hồi không phải JSON → coi là lời nhắn, không có câu nào
const chat = parseAiReply('Chào bạn, mình giúp được gì?')
assert.equal(chat.questions.length, 0)
assert.match(chat.message, /Chào bạn/)

assert.equal(sanitizeAiQuestions({ questions: Array.from({ length: 50 }, () => ({ type: 'tu-luan', prompt: 'x' })) }).length, 30, 'tối đa 30 câu')
assert.deepEqual(sanitizeAiQuestions(null), [])

// file đính kèm: mỗi file cắt 20k, tổng 40k, file rỗng bị bỏ
assert.equal(attachmentsPrompt([]), '')
assert.equal(attachmentsPrompt([{ name: 'rong.txt', text: '  ' }]), '')
const long = 'x'.repeat(25_000)
const att = attachmentsPrompt([{ name: 'a.docx', text: long }, { name: 'b.pdf', text: long }, { name: 'c.txt', text: 'dư' }])
assert.match(att, /\[Tài liệu đính kèm: a\.docx\]/)
assert.match(att, /đã cắt bớt/)
assert.ok(!att.includes('c.txt'), 'hết ngân sách 40k thì bỏ file sau')
assert.ok(att.length < 41_000 + 700)
console.log('test:online-ai ok')
