/**
 * Kiểm tra tách đề từ văn bản (nhập file ở trang Tạo đề online).
 * Chạy: npm run test:parse
 */
import assert from 'node:assert/strict'
import { parseExamText } from '../src/lib/parseExamText'
import { questionIssue } from '../src/lib/onlineExam'

const text = `ĐỀ KIỂM TRA
PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn
Câu 1. Hai cộng hai bằng?
A. 3 B. 4 C. 5 D. 6
Câu 2: Thủ đô của Việt Nam là
A. Huế
B. Hà Nội
C. Đà Nẵng
D. Cần Thơ
Đáp án: B
Lời giải: Hà Nội là thủ đô.
PHẦN II. Câu trắc nghiệm đúng sai
Câu 3. Xét các mệnh đề:
a) 1 > 0
b) 2 < 1
c) 3 = 3
d) 4 < 3
PHẦN III. Câu trả lời ngắn
Câu 4. Tính 3 + 4,5
PHẦN IV. Tự luận
Bài 1. Chứng minh rằng 1 < 2.
Bảng đáp án
Câu
1
2
3
4
Đáp án
B
B
ĐSĐS
7,5
Lời giải
Câu 1: B. Vì 2 + 2 = 4.
Bài 1: Hiển nhiên.
`

const { questions: qs, noAnswer } = parseExamText(text)
assert.deepEqual(qs.map((q) => q.type), ['trac-nghiem', 'trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan'])
assert.equal(qs[0].options?.length, 4)
assert.equal(qs[0].options?.[1].text, '4')
assert.equal(qs[0].answer, 'B')
assert.equal(qs[0].explanation, 'Vì 2 + 2 = 4.')
assert.equal(qs[1].answer, 'B') // đáp án ghi ngay trong câu thắng bảng đáp án
assert.equal(qs[1].explanation, 'Hà Nội là thủ đô.')
assert.equal(qs[2].answer, 'ĐSĐS')
assert.equal(qs[3].answer, '7,5')
assert.deepEqual(qs[4].solution, ['Hiển nhiên.'])
assert.equal(noAnswer, 0)
for (const q of qs) assert.equal(questionIssue(q), null, q.prompt)

// đáp án dạng "1.A 2.B" và câu thiếu đáp án
const r = parseExamText('Câu 1. x?\nA. 1\nB. 2\nCâu 2. y?\nA. 1\nB. 2\nĐáp án\n1.A 2.B\n')
assert.deepEqual(r.questions.map((q) => q.answer), ['A', 'B'])
assert.equal(parseExamText('Câu 1. x?\nA. 1\nB. 2').noAnswer, 1)
assert.equal(parseExamText('không có câu nào').questions.length, 0)
// tự luận có ý a) b) và điểm trong ngoặc
const e = parseExamText('PHẦN IV. Tự luận\nBài 1 (1,5 điểm). Cho hàm số.\na) Tính y.\nb) Vẽ đồ thị.\n').questions[0]
assert.equal(e.type, 'tu-luan')
assert.equal(e.points, 1.5)
assert.equal(e.prompt, 'Cho hàm số.\na) Tính y.\nb) Vẽ đồ thị.')

// đáp án đánh dấu ngay trong câu: chữ nổi bật (U+E000…U+E001), dấu *, ✓
const ON = '\uE000'
const OFF = '\uE001'
const marked = parseExamText(
  [
    `Câu 1. Đậm?\nA. sai\n${ON}B. đúng${OFF}\nC. sai\nD. sai`,
    'Câu 2. Sao?\nA. sai\nB. sai\n*C. đúng\nD. sai',
    'Câu 3. Dấu cuối?\nA. sai\nB. sai\nC. sai\nD. đúng ✓',
    `Câu 4. Cùng một dòng?\nA. sai B. sai ${ON}C. đúng${OFF} D. sai`,
    `Câu 5. Tô cả bốn?\n${ON}A. một${OFF}\n${ON}B. hai${OFF}\n${ON}C. ba${OFF}\n${ON}D. bốn${OFF}`,
  ].join('\n'),
).questions
assert.deepEqual(marked.map((q) => q.answer), ['B', 'C', 'D', 'C', undefined])
assert.equal(marked[3].options?.[2].text, 'đúng')

// phương án chữ thường "a." + bảng đáp án nhiều cặp một dòng + số trang dính đầu dòng
const low = parseExamText(
  'Câu 1. x?\na. một\nb. hai\nc. ba\n1d. bốn\n2Câu 2. y?\na. một\nb. hai\nđáp án:\nCâu 1: b. Câu 2: a.\n',
)
assert.deepEqual(low.questions.map((q) => q.type), ['trac-nghiem', 'trac-nghiem'])
assert.equal(low.questions[0].options?.length, 4)
assert.deepEqual(low.questions.map((q) => q.answer), ['B', 'A'])

// đề không có "Câu N." (đề bài là ảnh): mỗi bộ A–D là một câu, thứ tự phương án bị xáo vẫn đúng
const bare = parseExamText(`A. một\n${ON}B. hai${OFF}\nC. ba\nD. bốn\nD. d\nC. c\n${ON}A. a${OFF}\nB. b`)
assert.equal(bare.questions.length, 2)
assert.deepEqual(bare.questions.map((q) => q.answer), ['B', 'A'])
assert.deepEqual(bare.questions[1].options?.map((o) => o.key), ['A', 'B', 'C', 'D'])
assert.equal(bare.noPrompt, 2)

// PDF chữ: đậm, màu, gạch chân, nghiêng, tô nền, gạch ngang (xuất từ LibreOffice và Word) đọc ra đúng đáp án
const { extractFile } = await import('../server/extract')
const { readFileSync } = await import('node:fs')
for (const f of ['lo', 'word']) {
  const path = new URL(`./fixtures/dap-an-danh-dau-${f}.pdf`, import.meta.url)
  const text = (await extractFile('de.pdf', readFileSync(path), true)).text
  assert.deepEqual(parseExamText(text).questions.map((q) => q.answer), ['B', 'C', 'D', 'A', 'B', 'C'], f)
}
console.log('test-parse-exam: OK')
process.exit(0) // pdf.js giữ tiến trình sống
