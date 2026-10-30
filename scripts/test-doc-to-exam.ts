/**
 * Kiểm tra chuyển đề soạn (ExamDoc) sang đề tương tác (Exam): đáp án, điểm, tự luận.
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/test-doc-to-exam.ts
 */
import assert from 'node:assert/strict'
import { docToExam } from '../src/lib/docToExam'
import type { ExamDoc } from '../src/data/docTypes'

const doc: ExamDoc = {
  id: 'd1',
  title: 'Đề thử',
  subject: 'Toán',
  grade: 'Lớp 9',
  term: 'Giữa kỳ I',
  schoolYear: '2025 – 2026',
  duration: '45 phút',
  unit: 'TRƯỜNG THCS THỬ',
  authority: '',
  createdAt: '2026-10-28T00:00:00.000Z',
  updatedAt: '2026-10-28T00:00:00.000Z',
  blocks: [
    { type: 'question', no: 1, text: [{ text: 'Giá trị của $x^2$ khi $x=2$?' }], options: [
      { label: 'A', text: '2' }, { label: 'B', text: [{ text: '4', marks: [{ type: 'bold' }] }] },
    ] },
    { type: 'question', no: 2, text: 'Số nào là số nguyên tố?', options: [{ label: 'A', text: '4' }, { label: 'B', text: '7' }] },
    { type: 'essay', no: 1, text: 'Giải phương trình $x+1=0$', score: 2, sub: ['a) Nêu cách giải'] },
    { type: 'answerKey', items: [{ no: 1, answer: 'B. 4' }, { no: 2, answer: 'B' }, { no: 1, answer: 'x = -1' }] },
  ],
}

const exam = docToExam(doc, 'pub-1')

assert.equal(exam.id, 'pub-1')
assert.equal(exam.durationMinutes, 45)
assert.equal(exam.sections.length, 2)

const [mcq, essay] = exam.sections
assert.equal(mcq.questions.length, 2)
// Trắc nghiệm chia đều phần 10 trừ tự luận (10 - 2 = 8 → 4 điểm mỗi câu)
assert.equal(mcq.questions[0].points, 4)
assert.equal(mcq.questions[0].answer, 'B')
assert.equal(mcq.questions[1].answer, 'B')
assert.deepEqual(mcq.questions[1].options, [{ key: 'A', text: '4' }, { key: 'B', text: '7' }])
assert.equal(mcq.questions[0].prompt, 'Giá trị của $x^2$ khi $x=2$?')
assert.equal(mcq.questions[0].options?.[1].text, '4')

assert.equal(essay.questions.length, 1)
assert.equal(essay.questions[0].type, 'tu-luan')
assert.equal(essay.questions[0].points, 2)
assert.equal(essay.questions[0].prompt, 'Giải phương trình $x+1=0$\na) Nêu cách giải')
// Đáp án tự luận nằm cùng số câu với trắc nghiệm nhưng không phải chữ cái, không được lẫn vào
assert.deepEqual(essay.questions[0].solution, ['x = -1'])

// Đề không có tự luận: toàn bộ 10 điểm cho trắc nghiệm
const onlyMcq = docToExam({ ...doc, blocks: doc.blocks.slice(0, 2) }, 'pub-2')
assert.equal(onlyMcq.sections.length, 1)
assert.equal(onlyMcq.sections[0].questions[0].points, 5)

// Phần lời giải cuối tài liệu: "Câu N: …" gán theo số câu, đoạn tiếp theo nối vào câu trước, câu thiếu thì bỏ trống
const withSolutions = docToExam(
  {
    ...doc,
    blocks: [
      ...doc.blocks,
      { type: 'heading', text: 'HƯỚNG DẪN GIẢI' },
      { type: 'paragraph', text: 'Câu 1: Thay $x=2$ được 4.' },
      { type: 'paragraph', text: 'Vậy chọn B.' },
      { type: 'paragraph', text: 'Bài 1: Chuyển vế được x = -1.' },
    ],
  },
  'pub-3',
)
const [m3, e3] = withSolutions.sections
// "Bài N" là tự luận, không đụng "Câu N" trắc nghiệm cùng số
assert.deepEqual(e3.questions[0].solution, ['Chuyển vế được x = -1.'])
assert.equal(m3.questions[0].explanation, 'Thay $x=2$ được 4.\nVậy chọn B.')
assert.equal(m3.questions[1].explanation, undefined)
assert.equal(exam.sections[0].questions[0].explanation, undefined)

// ảnh trong đề bài: trước mọi chữ → trên, sau chữ → dưới; không ảnh → không có trường image
const png = 'data:image/png;base64,AAAA'
const withImg = docToExam(
  {
    ...doc,
    blocks: [
      { type: 'question', no: 1, text: [{ text: '', image: { src: png, width: 40 } }, { text: 'Cho hình vẽ.' }], options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }] },
      { type: 'question', no: 2, text: [{ text: 'Xem hình:' }, { text: '', image: { src: '/api/files/x.png' } }], options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }] },
      { type: 'question', no: 3, text: 'Không ảnh', options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }] },
    ],
  },
  'img',
)
const [q1, q2, q3] = withImg.sections[0].questions
assert.deepEqual(q1.image, { src: png, position: 'top', width: 40 })
assert.equal(q1.prompt, 'Cho hình vẽ.')
assert.deepEqual(q2.image, { src: '/api/files/x.png', position: 'bottom' })
assert.equal(q3.image, undefined)

console.log('test-doc-to-exam: OK')
