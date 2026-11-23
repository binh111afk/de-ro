/**
 * Kiểm tra đề tạo online: kiểm lỗi từng câu, xếp theo dạng, dựng đề, đưa đề từ trình soạn về bản nháp, đề đăng.
 * Chạy: npm run test:online
 */
import assert from 'node:assert/strict'
import { docToExam } from '../src/lib/docToExam'
import { defaultMeta, examToDraft, itemToDoc, itemToExam, newQuestion, questionIssue, sortQuestions, type OnlineItem } from '../src/lib/onlineExam'

// câu mới tạo chưa dùng được
for (const t of ['trac-nghiem', 'dung-sai', 'tra-loi-ngan'] as const) assert.ok(questionIssue(newQuestion(t)))
assert.equal(questionIssue(newQuestion('tu-luan', 'Chứng minh …')), null)

const mcq = { ...newQuestion('trac-nghiem', 'Hai cộng hai?'), options: ['1', '4'].map((text, i) => ({ key: 'AB'[i], text })), answer: 'B' }
assert.equal(questionIssue(mcq), null)
assert.match(questionIssue({ ...mcq, answer: 'C' }) ?? '', /đáp án đúng/)
assert.match(questionIssue({ ...mcq, options: [{ key: 'A', text: '' }, mcq.options[1]] }) ?? '', /Phương án A/)

const tf = { ...newQuestion('dung-sai', 'Xét các ý'), options: 'abcd'.split('').map((key) => ({ key, text: `ý ${key}` })), answer: 'ĐSĐ_' }
assert.match(questionIssue(tf) ?? '', /Đúng\/Sai/)
assert.equal(questionIssue({ ...tf, answer: 'ĐSĐS' }), null)

const short = { ...newQuestion('tra-loi-ngan', 'Tính x'), answer: '-1,5' }
assert.equal(questionIssue(short), null)
assert.ok(questionIssue({ ...short, answer: '12345' }))
assert.ok(questionIssue({ ...short, answer: 'abc' }))

// xếp theo dạng, giữ thứ tự trong dạng, đánh số 1..n
const essay = newQuestion('tu-luan', 'Bài tự luận')
const sorted = sortQuestions([essay, short, mcq, { ...mcq, id: 'm2', prompt: 'Câu trắc nghiệm thứ hai' }, tf])
assert.deepEqual(sorted.map((q) => q.type), ['trac-nghiem', 'trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan'])
assert.equal(sorted[1].id, 'm2')
assert.deepEqual(sorted.map((q) => q.number), [1, 2, 3, 4, 5])

const item: OnlineItem = {
  id: 'o1',
  status: 'done',
  meta: { ...defaultMeta(), title: 'Đề thử', durationMinutes: 30 },
  questions: sorted.map((q) => (q.type === 'dung-sai' ? { ...q, answer: 'ĐSĐS' } : q)),
  settings: { noTimeLimit: true, instantFeedback: true },
  createdAt: '2026-10-29T00:00:00.000Z',
  updatedAt: '2026-10-29T00:00:00.000Z',
}
const exam = itemToExam(item)
assert.deepEqual(exam.sections.map((s) => s.title), ['PHẦN I. TRẮC NGHIỆM', 'PHẦN II. ĐÚNG/SAI', 'PHẦN III. TRẢ LỜI NGẮN', 'PHẦN IV. TỰ LUẬN'])
assert.deepEqual(exam.settings, { noTimeLimit: true, instantFeedback: true })
assert.equal(exam.durationMinutes, 30)

// đề đăng giữ nguyên đề tương tác kèm cài đặt, và mở lại ra đúng id đăng
const doc = itemToDoc(item)
assert.equal(doc.blocks.length, 0)
const opened = docToExam(doc, 'pub-9')
assert.equal(opened.id, 'pub-9')
assert.equal(opened.settings?.instantFeedback, true)
assert.equal(opened.sections.flatMap((s) => s.questions).length, 5)

// đề từ trình soạn về bản nháp: giữ câu, đáp án đúng/sai về dạng chuẩn, giải thích
const back = examToDraft({ ...exam, sections: [{ ...exam.sections[1], questions: [{ ...exam.sections[1].questions[0], answer: 'a) Đ, b) S, c) Đ, d) S', explanation: 'Vì …' }] }] })
assert.equal(back.questions.length, 1)
assert.equal(back.questions[0].answer, 'ĐSĐS')
assert.equal(back.questions[0].explanation, 'Vì …')
assert.equal(back.meta.title, 'Đề thử')

const q = (no: number, kind?: 'tf' | 'short') => ({
  type: 'question' as const, no, kind, text: `Câu ${no}`, options: [],
})
const fallback = docToExam({ ...doc, online: undefined, blocks: [
  ...Array.from({ length: 12 }, (_, i) => q(i + 1)), q(13, 'tf'), q(14, 'tf'),
] }, 'fallback')
assert.deepEqual(fallback.sections.map((s) => s.points), [8, 2])
const explicit = docToExam({ ...doc, online: undefined, blocks: [
  { type: 'heading', level: 1, text: 'PHẦN I. Trắc nghiệm (3,00 điểm)' },
  { ...q(1), text: '(1 điểm) Tính `f(1)`' }, q(2),
  { type: 'heading', level: 1, text: 'PHẦN II. Đúng/sai (4 điểm)' }, q(3, 'tf'),
  { type: 'heading', level: 1, text: 'PHẦN III. Trả lời ngắn (3 điểm)' },
  ...Array.from({ length: 7 }, (_, i) => q(i + 4, 'short')),
] }, 'explicit')
assert.deepEqual(explicit.sections.map((s) => s.points), [3, 4, 3])
assert.deepEqual(explicit.sections[0].questions.map((b) => b.points), [1, 2])
assert.equal(explicit.sections[1].questions[0].points, 4)
assert.equal(Math.round(explicit.sections[2].questions.reduce((n, b) => n + b.points, 0) * 100), 300)

const bold = docToExam({ ...doc, online: undefined, blocks: [
  { ...q(1), text: 'Cho **hàm số $f(x)$ liên tục**. Tính `x ** 2`.' },
] }, 'bold')
assert.equal(bold.sections[0].questions[0].prompt, 'Cho **hàm số** $f(x)$ **liên tục**. Tính `x ** 2`.')

console.log('test-online-exam: OK')
