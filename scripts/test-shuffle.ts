/** Test xáo đề: đáp án mới phải trỏ đúng phương án đúng cũ, khối chen giữa giữ chỗ, phần đáp án tách ra. */
import { emptyDoc, type ExamBlock, type QuestionBlock } from '../src/data/docTypes'
import { makeCodes, shuffleExam } from '../src/lib/shuffleExam'

let fail = 0
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fail++
    console.error('✗', msg)
  }
}
const text = (rt: unknown) => (typeof rt === 'string' ? rt : (rt as { text: string }[]).map((s) => s.text).join(''))

const mcq = (no: number, correct: number): QuestionBlock => ({
  type: 'question',
  no,
  text: `Câu hỏi ${no}`,
  options: ['A', 'B', 'C', 'D'].map((l, i) => ({ label: l, text: i === correct ? `đúng-${no}` : `sai-${no}-${i}` })),
})
const blocks: ExamBlock[] = [
  { type: 'title', text: 'ĐỀ KIỂM TRA' },
  { type: 'heading', text: 'PHẦN I. TRẮC NGHIỆM' },
  mcq(1, 0),
  mcq(2, 1),
  mcq(3, 2),
  { type: 'paragraph', text: 'Đọc đoạn văn sau và trả lời câu 4–5' },
  mcq(4, 3),
  mcq(5, 0),
  {
    type: 'question',
    no: 6,
    text: 'Câu khoá',
    options: [
      { label: 'A', text: 'x' },
      { label: 'B', text: 'y' },
      { label: 'C', text: 'z' },
      { label: 'D', text: 'Cả A và B' },
    ],
  },
  {
    type: 'question',
    no: 7,
    kind: 'tf',
    text: 'Đúng sai',
    options: ['a', 'b', 'c', 'd'].map((l, i) => ({ label: l, text: `ý-${i}` })),
  },
  { type: 'question', no: 8, kind: 'short', text: 'Trả lời ngắn', options: [] },
  { type: 'essay', no: 1, text: 'Bài tự luận', score: 2 },
  { type: 'heading', text: 'ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM' },
  {
    type: 'answerKey',
    items: [
      { no: 1, answer: 'A' },
      { no: 2, answer: 'B' },
      { no: 3, answer: 'C' },
      { no: 4, answer: 'D' },
      { no: 5, answer: 'A' },
      { no: 6, answer: 'D' },
      { no: 7, answer: 'ĐSĐS' },
      { no: 8, answer: '12' },
    ],
  },
  { type: 'paragraph', text: 'Câu 3: lời giải cũ' },
  { type: 'rubric', title: 'Bài 1', items: [{ label: 'a)', text: '1 điểm' }] },
]
const doc = { ...emptyDoc(), title: 'Đề gốc', blocks }

let seed = 7
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const codes = makeCodes('101', 4)
ok(codes.join() === '101,102,103,104', `makeCodes: ${codes}`)
ok(makeCodes('A09', 2).join() === 'A09,A10', 'makeCodes có chữ')

const res = shuffleExam(doc, { codes, shuffleQuestions: true, shuffleOptions: true, random })
ok(res.versions.length === 4, '4 mã đề')
ok(res.questionCount === 8 && res.answeredCount === 8, `đọc đủ đáp án: ${res.answeredCount}/${res.questionCount}`)

const orders = new Set<string>()
for (const v of res.versions) {
  const b = v.doc.blocks
  ok(!b.some((x) => x.type === 'answerKey' || x.type === 'rubric'), `${v.code}: đề học sinh không còn đáp án`)
  ok(b.some((x) => x.type === 'paragraph' && text(x.text) === 'Mã đề: ' + v.code), `${v.code}: có dòng mã đề`)
  const qs = b.filter((x): x is QuestionBlock => x.type === 'question')
  ok(qs.map((q) => q.no).join() === '1,2,3,4,5,6,7,8', `${v.code}: đánh số lại liên tục`)
  orders.add(qs.map((q) => text(q.text)).join('|'))
  // nhóm câu 1–3 ở trước đoạn văn, 4–6 ở sau
  const para = b.findIndex((x) => x.type === 'paragraph' && text(x.text).startsWith('Đọc đoạn'))
  const before = b.slice(0, para).filter((x): x is QuestionBlock => x.type === 'question').map((q) => text(q.text))
  ok(before.sort().join() === 'Câu hỏi 1,Câu hỏi 2,Câu hỏi 3', `${v.code}: câu không vượt qua đoạn văn (${before})`)
  for (const [i, q] of qs.entries()) {
    const ans = v.answers[i].answer
    if (!q.kind) {
      const picked = q.options.find((o) => o.label === ans)
      if (text(q.text) === 'Câu khoá') ok(text(q.options[3].text) === 'Cả A và B' && ans === 'D', `${v.code}: câu khoá không xáo phương án`)
      else ok(!!picked && text(picked.text).startsWith('đúng-'), `${v.code} câu ${q.no}: đáp án ${ans} trỏ đúng`)
      ok(q.options.map((o) => o.label).join('') === 'ABCD', `${v.code}: nhãn A–D theo thứ tự`)
    } else if (q.kind === 'tf') {
      const truth = ['Đ', 'S', 'Đ', 'S']
      const expect = q.options.map((o) => truth[Number(text(o.text).slice(2))]).join('')
      ok(ans === expect, `${v.code}: đúng/sai ${ans} khớp ${expect}`)
    } else ok(ans === '12', `${v.code}: trả lời ngắn giữ đáp án`)
  }
}
ok(orders.size > 1, 'các mã đề khác nhau')

const ad = res.answerDoc.blocks
ok(ad.filter((x) => x.type === 'answerKey').length === 4, 'đáp án có 4 bảng')
ok(ad.some((x) => x.type === 'rubric'), 'giữ hướng dẫn chấm tự luận')
ok(!ad.some((x) => x.type === 'paragraph' && text(x.text).startsWith('Câu 3')), 'bỏ lời giải đánh số cũ')

const keep = shuffleExam(doc, { codes: ['1'], shuffleQuestions: false, shuffleOptions: false })
ok(keep.versions[0].answers.map((a) => a.answer).join() === 'A,B,C,D,A,D,ĐSĐS,12', 'không xáo thì đáp án y nguyên')

if (fail) {
  console.error(`${fail} lỗi`)
  process.exit(1)
}
console.log('test-shuffle: OK')
