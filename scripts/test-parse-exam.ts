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

// ảnh nhúng: token U+E002<chỉ số>U+E003 + mảng data URL
const im = (n: number) => `${n}`
const imgs = ['data:image/png;base64,AAA0', 'data:image/png;base64,AAA1', 'data:image/png;base64,AAA2', 'data:image/png;base64,AAA3', 'data:image/png;base64,AAA4']
// đề bare: ảnh đứng trước bộ A–D là đề bài của câu đó; ảnh trong phương án chỉ được đếm
const pic = parseExamText(`${im(0)}\nA. một\nB. hai\nC. ba\nD. bốn\n${im(1)}\n${im(2)}\nA. a\nB. b ${im(3)}\nC. c\nD. d\nA. x\nB. y\nC. z\nD. w`, imgs)
assert.equal(pic.questions.length, 3)
assert.deepEqual(pic.questions.map((q) => q.image?.src), [imgs[0], imgs[1], undefined])
assert.equal(pic.questions[0].image?.position, 'top')
assert.equal(pic.questions[0].prompt, '(Xem ảnh)')
assert.equal(pic.questions[2].prompt, '(Đề bài là hình ảnh trong file, chưa đọc được. Hãy nhập lại đề bài.)')
assert.equal(pic.imageCount, 2)
assert.equal(pic.extraImages, 2) // ảnh thứ hai của câu 2 và ảnh trong phương án B
assert.ok(pic.questions.every((q) => q.options?.every((o) => !/[]/.test(o.text)) && !/[]/.test(q.prompt)))
assert.equal(questionIssue(pic.questions[0]), 'Chưa chọn đáp án đúng.') // không còn lỗi "chưa có nội dung"
// đề có "Câu N.": ảnh sau chữ -> bottom, ảnh ngay sau "Câu N." chưa có chữ -> top, ảnh trước nhãn A. vẫn là đề bài
const cn = parseExamText(`Câu 1. Cho hình vẽ ${im(0)} khẳng định nào đúng?\nA. a\nB. b\nCâu 2. ${im(1)}\nA. a\nB. b\nCâu 3. Tính\n${im(2)}A. a\nB. b ${im(3)}\nĐáp án: B`, imgs)
assert.deepEqual(cn.questions.map((q) => q.image?.position), ['bottom', 'top', 'bottom'])
assert.deepEqual(cn.questions.map((q) => q.image?.src), [imgs[0], imgs[1], imgs[2]])
assert.equal(cn.questions[0].prompt, 'Cho hình vẽ  khẳng định nào đúng?')
assert.equal(cn.questions[1].prompt, '(Xem ảnh)')
assert.equal(cn.questions[2].options?.[1].text, 'b')
assert.equal(cn.extraImages, 1)
// không truyền mảng ảnh: token vẫn bị gỡ khỏi chữ, không gắn ảnh
const noArr = parseExamText(`Câu 1. Hình ${im(0)} này?\nA. a\nB. b`)
assert.equal(noArr.questions[0].prompt, 'Hình  này?')
assert.equal(noArr.imageCount, 0)

// docx thật có ảnh nhúng: server giữ thứ tự, bỏ ảnh nhỏ, nén ảnh to, đánh lại chỉ số
{
  const { default: JSZip } = await import('jszip')
  const { createCanvas } = await import('@napi-rs/canvas')
  const png = (w: number, h: number, noise = false) => {
    const c = createCanvas(w, h)
    const g = c.getContext('2d')
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h)
    if (noise) { const d = g.getImageData(0, 0, w, h); let x = 12345; for (let i = 0; i < d.data.length; i++) { x = (Math.imul(x, 1103515245) + 12345) | 0; d.data[i] = i % 4 === 3 ? 255 : (x >>> 16) & 255 }; g.putImageData(d, 0, 0) }
    return c.toBuffer('image/png')
  }
  const zip = new JSZip()
  const emu = (px: number) => px * 9525
  const drawing = (rid: string, w: number, h: number) =>
    `<w:r><w:drawing><wp:inline><wp:extent cx="${emu(w)}" cy="${emu(h)}"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="${rid}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
  const p = (...runs: string[]) => `<w:p>${runs.join('')}</w:p>`
  const t = (s: string) => `<w:r><w:t>${s}</w:t></w:r>`
  zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  zip.file('word/document.xml', `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${[
    p(drawing('rId4', 300, 13)), p(drawing('rId4', 300, 13)), // dải chữ cao 13px: giữ và ghép dọc với ảnh kế tiếp
    p(drawing('rId1', 200, 100)),
    p(t('A. một')), p(t('B. hai')), p(t('C. ba')), p(t('D. bốn')),
    p(drawing('rId2', 12, 12), drawing('rId3', 300, 300)),
    p(t('A. a')), p(t('B. b')), p(t('C. c')), p(t('D. d')),
  ].join('')}</w:body></w:document>`)
  const rel = (id: string, f: string) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${f}"/>`
  zip.file('word/_rels/document.xml.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rel('rId1', 'a.png')}${rel('rId2', 'b.png')}${rel('rId3', 'c.png')}${rel('rId4', 'd.png')}</Relationships>`)
  zip.file('word/media/a.png', png(200, 100))
  zip.file('word/media/b.png', png(12, 12))
  zip.file('word/media/d.png', png(300, 13))
  const big = png(1600, 1200, true)
  assert.ok(big.length > 600 * 1024, `ảnh thử phải lớn hơn 600KB (${big.length})`)
  zip.file('word/media/c.png', big)
  const out = await extractFile('de.docx', await zip.generateAsync({ type: 'nodebuffer' }), true)
  assert.equal(out.images?.length, 2) // ảnh 12px bị bỏ
  assert.ok(out.images!.every((u) => u.length < 900_000 * 1.4))
  assert.match(out.images![1], /^data:image\/jpeg;base64,/) // ảnh to đã nén
  const { loadImage } = await import('@napi-rs/canvas')
  const first = await loadImage(Buffer.from(out.images![0].split(',')[1], 'base64'))
  assert.deepEqual([first.width, first.height], [300, 126]) // 13 + 13 + 100 ghép dọc
  const parsed = parseExamText(out.text, out.images)
  assert.equal(parsed.questions.length, 2)
  assert.deepEqual(parsed.questions.map((q) => q.image?.src), out.images)
  const noMarks = await extractFile('de.docx', await zip.generateAsync({ type: 'nodebuffer' }))
  assert.equal(noMarks.images, undefined) // không marks: hành vi cũ, không trả ảnh
  assert.ok(!/[]/.test(noMarks.text))
}
for (const f of ['lo', 'word']) {
  const path = new URL(`./fixtures/dap-an-danh-dau-${f}.pdf`, import.meta.url)
  const text = (await extractFile('de.pdf', readFileSync(path), true)).text
  assert.deepEqual(parseExamText(text).questions.map((q) => q.answer), ['B', 'C', 'D', 'A', 'B', 'C'], f)
}
console.log('test-parse-exam: OK')
process.exit(0) // pdf.js giữ tiến trình sống
