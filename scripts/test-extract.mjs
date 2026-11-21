/**
 * Test trích nội dung tệp phía server (dispatch theo đuôi tệp).
 * Chạy: npm run test:extract
 */
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import JSZip from 'jszip'
import { extractFile, extractLimits } from '../server/extract.ts'

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

// Dựng PDF thật nhỏ với xref stream Flate. Dữ liệu nén luôn chỉ chứa các mục của PDF mẫu.
function makePdf({ pages = 1, classic = false, size = pages + (classic ? 5 : 6), index = '[0 ' + (pages + 6) + ']' } = {}) {
  const contents = 'BT /F1 12 Tf 20 100 Td (Hello PDF) Tj ET'
  const page = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 3 0 R >> >> /Contents 4 0 R >>'
  const kids = Array.from({ length: pages }, (_, i) => (i + 5) + ' 0 R').join(' ')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [' + kids + '] /Count ' + pages + ' >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Length ' + contents.length + ' >>\nstream\n' + contents + '\nendstream',
    ...Array(pages).fill(page),
  ]
  let prefix = '%PDF-1.5\n'
  const offsets = [0]
  for (const [i, object] of objects.entries()) {
    offsets.push(prefix.length)
    prefix += (i + 1) + ' 0 obj\n' + object + '\nendobj\n'
  }
  const xrefOffset = prefix.length
  const end = '\nstartxref\n' + xrefOffset + '\n%%EOF\n'
  if (classic) {
    const entries = offsets.slice(1).map((n) => String(n).padStart(10, '0') + ' 00000 n \n').join('')
    return Buffer.from(prefix + 'xref\n0 ' + offsets.length + '\n0000000000 65535 f \n' + entries +
      'trailer\n<< /Root 1 0 R /Size ' + size + ' >>' + end)
  }
  offsets.push(xrefOffset)
  const entries = Buffer.alloc(offsets.length * 7)
  entries.writeUInt16BE(65535, 5)
  for (let i = 1; i < offsets.length; i++) {
    entries[i * 7] = 1
    entries.writeUInt32BE(offsets[i], i * 7 + 1)
  }
  const compressed = deflateSync(entries)
  return Buffer.concat([
    Buffer.from(prefix + (objects.length + 1) + ' 0 obj\n<< /Ty#70e /X#52ef /Root 1 0 R /W [1 4 2] /Si#7ae ' + size +
      ' /In#64ex ' + index + ' /Filter /FlateDecode /Length ' + compressed.length + ' >>\nstream\n'),
    compressed,
    Buffer.from('\nendstream\nendobj' + end),
  ])
}

const tooMany = 'Tệp PDF có bảng tham chiếu bất thường, không đọc được.'
const rssBefore = process.resourceUsage().maxRSS
const start = performance.now()
for (const data of [
  makePdf({ size: 20_000_000 }),
  makePdf({ index: '[0 250001 % số mục của dải thứ nhất\n 250001 250000]' }),
  makePdf({ size: 500_001, classic: true }),
]) {
  const rejected = await extractFile('xref.pdf', data)
  assert.equal(rejected.kind, 'unsupported')
  assert.ok(rejected.warning?.includes(tooMany), rejected.warning)
}
const elapsed = performance.now() - start
const peakDeltaKiB = process.resourceUsage().maxRSS - rssBefore
assert.ok(elapsed < 2000, 'Kiểm xref mất ' + elapsed.toFixed(1) + ' ms')
assert.ok(peakDeltaKiB < 16 * 1024, 'Đỉnh RSS tăng ' + peakDeltaKiB + ' KiB')
console.log('✅ PDF khai xref quá lớn bị từ chối trong ' + elapsed.toFixed(1) + ' ms, đỉnh RSS tăng ' + peakDeltaKiB + ' KiB')

for (const [data, pages] of [[makePdf(), 1], [makePdf({ classic: true }), 1], [makePdf({ pages: 250 }), 250]]) {
  const pdf = await extractFile('mau.pdf', data)
  assert.equal(pdf.kind, 'pdf', pdf.warning)
  assert.equal(pdf.text, Array(pages).fill('Hello PDF').join('\n\n'))
}
console.log('✅ PDF hợp lệ đọc được chữ với bảng xref thường và xref stream, gồm mẫu 250 trang')

const saved = { ...extractLimits }
extractLimits.heapMb = 8
const oom = await extractFile('nang.pdf', makePdf({ pages: 250 }))
assert.equal(oom.kind, 'unsupported')
assert.match(oom.warning ?? '', /quá nặng/)
extractLimits.heapMb = saved.heapMb
extractLimits.timeoutMs = 1
const slow = await extractFile('cham.pdf', makePdf())
assert.equal(slow.kind, 'unsupported')
assert.match(slow.warning ?? '', /quá nặng|bất thường/)
Object.assign(extractLimits, saved)
assert.equal((await extractFile('lai.pdf', makePdf())).kind, 'pdf')
console.log('✅ Worker quá bộ nhớ / quá giờ bị dừng, trả lỗi gọn; sau đó đọc tiếp bình thường')

console.log('\nCác kiểm tra trích nội dung đều đạt.')
