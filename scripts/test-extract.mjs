/**
 * Test trích nội dung tệp phía server (dispatch theo đuôi tệp).
 * Chạy: npm run test:extract
 */
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { extractFile } from '../server/extract.ts'

const csv = await extractFile('mau.csv', Buffer.from('Mẫu đề\nCâu 1,2+3', 'utf8'))
assert.equal(csv.kind, 'text')
assert.match(csv.text, /Mẫu đề/)
console.log('✅ csv đọc được nội dung')

const oldDoc = await extractFile('cu.doc', Buffer.from('x'))
assert.equal(oldDoc.kind, 'unsupported')
assert.match(oldDoc.warning ?? '', /\.docx/)
const oldPpt = await extractFile('cu.ppt', Buffer.from('x'))
assert.equal(oldPpt.kind, 'unsupported')
assert.match(oldPpt.warning ?? '', /\.pptx/)
console.log('✅ .doc/.ppt cũ báo cần lưu lại .docx/.pptx')

// pptx tối giản: đúng entry ppt/slides/*.xml, đủ để đọc text + thứ tự slide
const zip = new JSZip()
const slideXml = (lines) =>
  `<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a">${lines
    .map((t) => `<a:p><a:r><a:t>${t}</a:t></a:r></a:p>`)
    .join('')}</p:sld>`
zip.file('ppt/slides/slide10.xml', slideXml(['Slide mười']))
zip.file('ppt/slides/slide2.xml', slideXml(['Slide hai', 'Dòng &amp; phụ']))
const pptx = await extractFile('mau.pptx', await zip.generateAsync({ type: 'nodebuffer' }))
assert.equal(pptx.kind, 'pptx')
assert.deepEqual(pptx.slides, ['Slide hai\nDòng & phụ', 'Slide mười'])
assert.match(pptx.text, /Slide hai/)
console.log('✅ pptx đọc text từng slide, sắp đúng số thứ tự, giải mã XML')

console.log('\n4/4 pass, 0 fail')
