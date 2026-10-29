/**
 * Kiểm tra xuất .docx thật: file là zip OOXML, mammoth (bộ đọc Word) đọc lại được, nội dung đúng thứ tự.
 * Chạy: npm run test:docx
 */
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import { Packer } from 'docx'
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
assert.ok(xml.includes('Câu 1. '), 'đánh số câu theo thứ tự khối, bỏ qua block.no')
assert.ok(xml.includes('Câu 3. '))
assert.ok(!xml.includes('Câu 9.'))
assert.ok(xml.includes('Bài 1 (2 điểm). '))
assert.ok(xml.includes('<w:caps'), 'tiêu đề in hoa')
assert.ok(xml.includes('<w:lastRenderedPageBreak') || xml.includes('w:type="page"'), 'ngắt trang')

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

if (process.env.KEEP_DOCX) {
  writeFileSync(process.env.KEEP_DOCX, buf)
  writeFileSync(process.env.KEEP_DOCX.replace(/\.docx$/, '-exam.docx'), out)
}
console.log('test-docx: OK')
