/**
 * Kiểm tra xuất .docx thật: file là zip OOXML, mammoth (bộ đọc Word) đọc lại được, nội dung đúng thứ tự.
 * Chạy: npm run test:docx
 */
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import { Packer } from 'docx'
import { deflateSync } from 'node:zlib'
import { buildDocx } from '../src/examEditor/docxBlocks'
import { examToDoc } from '../src/lib/exportDocx'
import { COMMUNITY_EXAMS } from '../src/data/community'
import type { ExamDoc } from '../src/data/docTypes'

const doc: ExamDoc = {
  id: 'd1',
  title: 'Đề thử',
  subject: 'Toán',
  grade: 'Lớp 12',
  term: 'Giữa kỳ I',
  schoolYear: '2026 – 2027',
  duration: '45 phút',
  unit: 'TRƯỜNG THPT THỬ',
  authority: '',
  createdAt: '',
  updatedAt: '',
  blocks: [
    { type: 'header', left: [{ text: 'ĐỀ CHÍNH THỨC', marks: [{ type: 'boxed' }] }], right: 'KỲ THI THỬ\nMôn thi: Toán' },
    { type: 'title', text: 'Đề kiểm tra' },
    { type: 'meta', rows: [['Thời gian', '45 phút']] },
    { type: 'heading', text: 'PHẦN I. TRẮC NGHIỆM', level: 1 },
    { type: 'question', no: 9, text: 'Giá trị của $x^2$ khi $x=2$?', options: ['2', '4', '6', '8'].map((t, i) => ({ label: 'ABCD'[i], text: i === 1 ? [{ text: t, marks: [{ type: 'bold' }] }] : t })) },
    { type: 'question', no: 2, kind: 'tf', text: 'Xét các ý', options: ['a', 'b'].map((l) => ({ label: l, text: `Ý ${l}` })) },
    { type: 'question', no: 3, kind: 'short', text: 'Tìm x', options: [] },
    { type: 'bullets', items: ['Một', 'Hai'], ordered: true },
    {
      type: 'paragraph',
      text: 'Công thức: $\\frac{a+b}{2}$, $x^2+\\sqrt{3}$, $\\sqrt[3]{8}=2$, $\\sum_{i=1}^{n} a_i$, $\\int_0^1 x^2\\,dx$, $\\left(\\frac{1}{2}\\right)^2$, $\\lim_{x\\to 0}\\frac{\\sin x}{x}=1$, $\\vec{AB}\\cdot\\vec{AC}$, $\\alpha \\le \\beta$, $H_2O$, $x_1^2$, $\\mathbb{R}$',
    },
    { type: 'paragraph', text: '$$\\Delta = b^2 - 4ac$$' },
    { type: 'essay', no: 1, score: 2, text: 'Chứng minh …', sub: ['a) Ý một'] },
    { type: 'pageBreak' },
    { type: 'answerKey', items: [{ no: 1, answer: 'B' }, { no: 2, answer: 'ĐS' }] },
    { type: 'rubric', title: 'Thang điểm', items: [{ label: '0,5đ:', text: 'Đúng hướng' }] },
  ],
}

const buf = await Packer.toBuffer(buildDocx(doc))
assert.equal(buf.subarray(0, 2).toString(), 'PK', 'phải là zip')

const zip = await JSZip.loadAsync(buf)
for (const name of ['[Content_Types].xml', 'word/document.xml', 'word/numbering.xml']) assert.ok(zip.file(name), `thiếu ${name}`)
const xml = await zip.file('word/document.xml')!.async('string')
assert.match(xml, /w:w="11906"/, 'khổ A4')
assert.ok(xml.includes('<w:gridCol w:w="2440"/>'), 'phương án ngắn xếp 4 cột như trên màn hình')
assert.ok(xml.includes('Câu 1. '), 'đánh số câu theo thứ tự khối, bỏ qua block.no')
assert.ok(xml.includes('Câu 3. '))
assert.ok(!xml.includes('Câu 9.'))
assert.ok(xml.includes('Bài 1 (2 điểm). '))
assert.ok(xml.includes('<w:caps'), 'tiêu đề in hoa')
assert.ok(xml.includes('<w:lastRenderedPageBreak') || xml.includes('w:type="page"'), 'ngắt trang')

// công thức thành equation Word (OMML), không còn dấu $ hay lệnh LaTeX thô
for (const tag of ['<m:f>', '<m:rad>', '<m:sSup>', '<m:sSub>', '<m:sSubSup>', '<m:nary>', '<m:limLow>', '<m:d>']) assert.ok(xml.includes(tag), `thiếu ${tag}`)
assert.ok(!xml.includes('\\frac') && !xml.includes('\\sqrt') && !/>[^<]*\$[^<]*</.test(xml), 'còn LaTeX thô')

// mammoth đọc lại được và thấy đủ nội dung
const text = (await mammoth.extractRawText({ buffer: buf })).value
for (const s of ['ĐỀ CHÍNH THỨC', 'Môn thi: Toán', 'Đề kiểm tra', 'A. 2', 'B. 4', 'a) Ý a', 'Chứng minh', 'Đáp án', 'Thang điểm', 'Đúng hướng']) {
  assert.ok(text.includes(s), `thiếu "${s}" trong nội dung đọc lại`)
}
assert.ok(text.indexOf('Câu 1.') < text.indexOf('Câu 2.') && text.indexOf('Câu 2.') < text.indexOf('Bài 1'))

// đề tương tác (đề cộng đồng) cũng xuất được
const exam = COMMUNITY_EXAMS[0]
const out = await Packer.toBuffer(buildDocx(examToDoc(exam)))
const examText = (await mammoth.extractRawText({ buffer: out })).value
assert.ok(examText.includes(exam.title))
assert.ok(examText.includes('Câu 1.'))

// ảnh: PNG nhỏ (data URL) trong câu trắc nghiệm (dưới/trên đề) và qua examToDoc → có word/media, mammoth đọc lại được
function png(w: number, h: number, rgb: [number, number, number]): string {
  const crcT = Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  const crc = (b: Buffer) => {
    let c = 0xffffffff
    for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }
  const chunk = (t: string, d: Buffer) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(d.length)
    const td = Buffer.concat([Buffer.from(t), d])
    const c = Buffer.alloc(4)
    c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())])
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
  const out = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
  return `data:image/png;base64,${out.toString('base64')}`
}
const imgDoc: ExamDoc = {
  ...doc,
  blocks: [
    { type: 'question', no: 1, text: [{ text: 'Cho hình sau.' }, { text: '\n' }, { text: '', image: { src: png(120, 60, [200, 40, 40]), alt: 'hình 1' } }], options: ['1', '2', '3', '4'].map((t, i) => ({ label: 'ABCD'[i], text: t })) },
    { type: 'question', no: 2, text: [{ text: '\n' }, { text: '', image: { src: png(40, 40, [40, 80, 200]), width: 150 } }, { text: '\n' }, { text: 'Hình trên là gì?' }], options: [{ label: 'A', text: 'x' }] },
    { type: 'paragraph', text: [{ text: '', image: { src: 'data:image/webp;base64,AAAA' } }, { text: 'WebP bị bỏ qua êm' }] },
  ],
}
const imgBuf = await Packer.toBuffer(buildDocx(imgDoc))
const imgZip = await JSZip.loadAsync(imgBuf)
const media = Object.keys(imgZip.files).filter((n) => n.startsWith('word/media/'))
assert.equal(media.length, 2, 'có 2 ảnh trong word/media')
const imgXml = await imgZip.file('word/document.xml')!.async('string')
assert.ok(imgXml.includes('<w:drawing>'), 'có drawing')
assert.ok(imgXml.includes(`cx="${150 * 9525}"`) && imgXml.includes(`cy="${150 * 9525}"`), 'width px giữ tỉ lệ 1:1')
assert.ok(imgXml.includes(`cx="${120 * 9525}"`) && imgXml.includes(`cy="${60 * 9525}"`), 'không có width thì dùng cỡ thật')
const imgText = (await mammoth.extractRawText({ buffer: imgBuf })).value
assert.ok(imgText.includes('Cho hình sau.') && imgText.includes('WebP bị bỏ qua êm'))
const html = (await mammoth.convertToHtml({ buffer: imgBuf })).value
assert.equal((html.match(/<img /g) ?? []).length, 2, 'mammoth thấy 2 ảnh')

// examToDoc: Question.image top / bottom
const qExam = structuredClone(exam)
const [q1, q2] = qExam.sections[0].questions
q1.image = { src: png(30, 30, [0, 160, 0]), position: 'top' }
q2.image = { src: png(30, 20, [0, 0, 0]) }
const qBuf = await Packer.toBuffer(buildDocx(examToDoc(qExam)))
assert.equal(Object.keys((await JSZip.loadAsync(qBuf)).files).filter((n) => n.startsWith('word/media/')).length, 2, 'Question.image thành ảnh trong docx')

// ảnh left/right: bảng 2 ô, ảnh ở ô đúng phía; phương án vẫn nằm dưới
const sideExam = structuredClone(exam)
const sq = sideExam.sections[0].questions
sq[0].image = { src: png(80, 60, [200, 120, 0]), position: 'left', width: 30 }
sq[1].image = { src: png(80, 60, [120, 0, 160]), position: 'right' }
const sideBuf = await Packer.toBuffer(buildDocx(examToDoc(sideExam)))
const sideXml = await (await JSZip.loadAsync(sideBuf)).file('word/document.xml')!.async('string')
const qStart = sideXml.indexOf('Câu 1. ')
const tblStart = sideXml.lastIndexOf('<w:tbl>', qStart)
assert.ok(tblStart > sideXml.lastIndexOf('</w:tbl>', qStart), 'đề bài nằm trong bảng')
const firstRow = sideXml.slice(tblStart, sideXml.indexOf('</w:tr>', tblStart))
assert.ok(firstRow.indexOf('<w:drawing>') < firstRow.indexOf('Câu 1. '), 'left: ảnh ở ô trái')
const qi2 = sideXml.indexOf('Câu 2. ')
const row2 = sideXml.slice(sideXml.lastIndexOf('<w:tbl>', qi2), sideXml.indexOf('</w:tr>', qi2))
assert.ok(row2.indexOf('Câu 2. ') < row2.indexOf('<w:drawing>'), 'right: ảnh ở ô phải')
assert.ok((await mammoth.extractRawText({ buffer: sideBuf })).value.includes('Câu 2.'))

if (process.env.KEEP_DOCX) {
  writeFileSync(process.env.KEEP_DOCX, buf)
  writeFileSync(process.env.KEEP_DOCX.replace(/\.docx$/, '-exam.docx'), out)
  writeFileSync(process.env.KEEP_DOCX.replace(/\.docx$/, '-img.docx'), imgBuf)
  writeFileSync(process.env.KEEP_DOCX.replace(/\.docx$/, '-side.docx'), sideBuf)
}
console.log('test-docx: OK')
