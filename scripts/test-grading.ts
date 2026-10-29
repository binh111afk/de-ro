/**
 * Kiểm tra chấm điểm đề tốt nghiệp THPT từ 2025: nhiều lựa chọn, đúng/sai theo số ý đúng, trả lời ngắn,
 * và chuyển đề soạn có đủ ba dạng sang đề tương tác.
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/test-grading.ts
 */
import assert from 'node:assert/strict'
import {
  describeAnswer,
  formatTrueFalse,
  isAutoGraded,
  isFullyCorrect,
  normalizeShort,
  parseTrueFalse,
  readTrueFalseAnswer,
  sameShort,
  scoreQuestion,
} from '../src/lib/grading'
import { docToExam } from '../src/lib/docToExam'
import { blocksToTipTap, tipTapToBlocks } from '../src/examEditor/convert'
import type { ExamDoc } from '../src/data/docTypes'
import type { Question } from '../src/data/types'

// ---- đọc đáp án đúng/sai ở nhiều dạng viết ----
assert.deepEqual(parseTrueFalse('ĐSĐS', 4), [true, false, true, false])
assert.deepEqual(parseTrueFalse('a) Đ, b) S, c) Đ, d) S', 4), [true, false, true, false])
assert.deepEqual(parseTrueFalse('a-Đúng b-Sai c-Sai d-Đúng', 4), [true, false, false, true])
assert.deepEqual(parseTrueFalse('đsđs', 4), [true, false, true, false])
assert.equal(parseTrueFalse('ĐSĐ', 4), null) // thiếu ý
assert.equal(parseTrueFalse('B', 4), null) // đáp án trắc nghiệm không bị nhận nhầm
assert.equal(parseTrueFalse(undefined, 4), null)
assert.equal(formatTrueFalse([true, false, null, true]), 'ĐS_Đ')
assert.deepEqual(readTrueFalseAnswer('ĐS_Đ', 4), [true, false, null, true])
assert.deepEqual(readTrueFalseAnswer(undefined, 2), [null, null])

// ---- trả lời ngắn ----
assert.equal(normalizeShort(' -1.5 '), '-1,5')
assert.ok(sameShort('0,50', '0,5'))
assert.ok(sameShort('-1.5', '-1,5'))
assert.ok(sameShort('12', '12,0'))
assert.ok(!sameShort('12', '13'))
assert.ok(!sameShort('', ''))
assert.ok(!sameShort('-', '-'))

// ---- chấm từng câu ----
const tf: Question = {
  id: 't', number: 1, type: 'dung-sai', prompt: 'x',
  options: ['a', 'b', 'c', 'd'].map((key) => ({ key, text: key })),
  answer: 'ĐSĐS', points: 1,
}
// đúng 0/1/2/3/4 ý → 0 / 0,1 / 0,25 / 0,5 / 1 điểm
const tfCases: Array<[string, number]> = [
  ['SĐSĐ', 0],
  ['ĐĐSĐ', 0.1], // chỉ ý a đúng
  ['ĐSSĐ', 0.25], // a, b đúng
  ['ĐSĐĐ', 0.5], // a, b, c đúng
  ['ĐSĐS', 1],
]
for (const [given, expected] of tfCases) assert.equal(scoreQuestion(tf, given), expected, `đúng/sai ${given}`)
assert.equal(scoreQuestion(tf, 'ĐS__'), 0.25) // ý bỏ trống tính là sai
assert.equal(scoreQuestion(tf, undefined), 0)
assert.ok(isFullyCorrect(tf, 'ĐSĐS'))
assert.ok(!isFullyCorrect(tf, 'ĐSĐĐ'))
assert.equal(scoreQuestion({ ...tf, points: 2 }, 'ĐSĐĐ'), 1) // điểm câu khác 1 thì nhân theo tỉ lệ

const short: Question = { id: 's', number: 2, type: 'tra-loi-ngan', prompt: 'x', answer: '-1,5', points: 0.5 }
assert.equal(scoreQuestion(short, '-1,5'), 0.5)
assert.equal(scoreQuestion(short, '-1.5'), 0.5)
assert.equal(scoreQuestion(short, '1,5'), 0)

const mcq: Question = { id: 'm', number: 3, type: 'trac-nghiem', prompt: 'x', answer: 'B', points: 0.25, options: [] }
assert.equal(scoreQuestion(mcq, 'B'), 0.25)
assert.equal(scoreQuestion(mcq, 'A'), 0)
const essay: Question = { id: 'e', number: 1, type: 'tu-luan', prompt: 'x', points: 2 }
assert.equal(scoreQuestion(essay, 'bất kỳ'), 0)
assert.ok(!isAutoGraded(essay))
assert.ok(isAutoGraded(tf) && isAutoGraded(short) && isAutoGraded(mcq))
assert.ok(!isAutoGraded({ ...short, answer: undefined }))

assert.equal(describeAnswer(tf, 'ĐS_Đ'), 'a) Đúng · b) Sai · c) — · d) Đúng')
assert.equal(describeAnswer(short, '-1,5'), '-1,5')

// ---- chuyển đề soạn đủ ba dạng (khung đề Toán: 12 nhiều lựa chọn + 4 đúng/sai + 6 trả lời ngắn, rút gọn) ----
const doc: ExamDoc = {
  id: 'd1', title: 'Đề Toán', subject: 'Toán', grade: 'Lớp 12', term: 'Thi thử', schoolYear: '2025 – 2026',
  duration: '90 phút', unit: 'THPT THỬ', authority: '',
  createdAt: '2026-10-29T00:00:00.000Z', updatedAt: '2026-10-29T00:00:00.000Z',
  blocks: [
    ...Array.from({ length: 12 }, (_, i) => ({
      type: 'question' as const, no: i + 1, text: `Câu hỏi ${i + 1}`,
      options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: label })),
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      type: 'question' as const, kind: 'tf' as const, no: 13 + i, text: `Đúng sai ${i + 1}`,
      options: ['a', 'b', 'c', 'd'].map((label) => ({ label, text: `ý ${label}` })),
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      type: 'question' as const, kind: 'short' as const, no: 17 + i, text: `Trả lời ngắn ${i + 1}`, options: [],
    })),
    {
      type: 'answerKey',
      items: [
        ...Array.from({ length: 12 }, (_, i) => ({ no: i + 1, answer: 'C' })),
        { no: 13, answer: 'a) Đ, b) S, c) Đ, d) S' },
        { no: 14, answer: 'ĐĐĐĐ' },
        { no: 15, answer: 'SSSS' },
        { no: 16, answer: 'ĐSSĐ' },
        { no: 17, answer: '12' },
        { no: 18, answer: '-3.5' },
        { no: 19, answer: '0,25' },
        { no: 20, answer: '7' },
        { no: 21, answer: '4' },
        { no: 22, answer: '100' },
      ],
    },
  ],
}
const exam = docToExam(doc, 'e1')
assert.deepEqual(exam.sections.map((s) => s.title), ['PHẦN I. TRẮC NGHIỆM', 'PHẦN II. ĐÚNG/SAI', 'PHẦN III. TRẢ LỜI NGẮN'])
const [s1, s2, s3] = exam.sections
assert.equal(s1.questions.length, 12)
assert.equal(s2.questions.length, 4)
assert.equal(s3.questions.length, 6)
// Toán: 12 câu × 0,25 + 4 câu × 1 + 6 câu × 0,5 = 10
assert.equal(s1.questions[0].points, 0.25)
assert.equal(s2.questions[0].points, 1)
assert.equal(s3.questions[0].points, 0.5)
assert.equal(exam.sections.reduce((n, s) => n + s.points, 0), 10)
// số câu chạy liên tục qua ba phần
assert.deepEqual([s1.questions[0].number, s2.questions[0].number, s3.questions[0].number, s3.questions[5].number], [1, 13, 17, 22])
// đáp án được chuẩn hoá
assert.equal(s1.questions[0].answer, 'C')
assert.equal(s2.questions[0].answer, 'ĐSĐS')
assert.equal(s2.questions[3].answer, 'ĐSSĐ')
assert.deepEqual(s2.questions[0].options?.map((o) => o.key), ['a', 'b', 'c', 'd'])
assert.equal(s3.questions[1].answer, '-3,5')
assert.equal(s3.questions[2].answer, '0,25')
assert.equal(s3.questions[0].options, undefined)
assert.equal(s2.questions[0].type, 'dung-sai')
assert.equal(s3.questions[0].type, 'tra-loi-ngan')

// làm đúng hết → 10 điểm; sai một ý đúng/sai → trừ điểm theo bảng
const all = exam.sections.flatMap((s) => s.questions)
const perfect = all.reduce((n, q) => n + scoreQuestion(q, q.answer), 0)
assert.equal(Math.round(perfect * 1000) / 1000, 10)
const oneOff = scoreQuestion(s2.questions[0], 'ĐSĐĐ')
assert.equal(oneOff, 0.5)

// môn khác Toán (khung 18 + 4 + 6): trả lời ngắn 0,25 điểm, 18 câu nhiều lựa chọn × 0,25 = 4,5 điểm, tổng vẫn 10
const mcqBlocks = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    type: 'question' as const, no: i + 1, text: `Câu ${i + 1}`,
    options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: label })),
  }))
const physics = docToExam({ ...doc, subject: 'Vật lí', blocks: [...mcqBlocks(18), ...doc.blocks.slice(12, 22)] }, 'e2')
assert.equal(physics.sections[0].questions[0].points, 0.25)
assert.equal(physics.sections[2].questions[0].points, 0.25)
assert.equal(Math.round(physics.sections.reduce((n, s) => n + s.points, 0) * 100) / 100, 10)

// câu đúng/sai thiếu đáp án: vẫn có trong đề nhưng không chấm được
const noKey = docToExam({ ...doc, blocks: doc.blocks.filter((b) => b.type !== 'answerKey') }, 'e3')
assert.equal(noKey.sections[1].questions[0].answer, undefined)
assert.ok(!isAutoGraded(noKey.sections[1].questions[0]))

// ---- vòng đi về editor ↔ khối giữ nguyên dạng câu ----
const kinds = doc.blocks.filter((b) => b.type === 'question').map((b) => (b.type === 'question' ? b.kind ?? 'mcq' : ''))
const back = tipTapToBlocks(blocksToTipTap(doc.blocks)).filter((b) => b.type === 'question')
assert.deepEqual(back.map((b) => (b.type === 'question' ? b.kind ?? 'mcq' : '')), kinds)
const tfBack = back.find((b) => b.type === 'question' && b.kind === 'tf')
assert.equal(tfBack?.type === 'question' && tfBack.options.length, 4)
assert.deepEqual(tfBack?.type === 'question' && tfBack.options.map((o) => o.label), ['a', 'b', 'c', 'd'])

console.log('test-grading: OK')
