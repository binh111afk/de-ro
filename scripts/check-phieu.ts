/**
 * Tự kiểm cho tính năng Phiếu trả lời trắc nghiệm THPT 2025 & Bảng đáp án tổng hợp:
 * - Bố cục phiếu (số khối, toạ độ không chồng nhau, nằm trong A4, 4 dấu định vị, in sẵn mã đề).
 * - Đề 22 câu (12 mcq, 4 tf, 6 short), 4 mã: mỗi phiếu đúng 12/4/6, bảng tổng hợp khớp đáp án từng mã.
 * - Đề chỉ có 40 mcq: chỉ có Phần I (4 khối × 10 câu), bỏ Phần II & III.
 * - Đề nặng nhất (40 mcq + 8 tf + 6 short + tự luận): nằm trọn trong 1 trang A4 dọc.
 * - Đề không có câu nào: questionCount === 0 (nút tạo bị khoá).
 * - Câu thiếu đáp án → ô ghi '?' và answeredCount < questionCount.
 * - Xuất Word (.docx) bảng tổng hợp & phiếu trả lời đọc lại được bằng mammoth.
 *
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-phieu.ts
 */
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import { Packer } from 'docx'
import { emptyDoc, type ExamBlock, type ExamDoc, type QuestionBlock } from '../src/data/docTypes'
import {
  A4_HEIGHT,
  A4_WIDTH,
  extractAnswerSheetInfo,
  generateAnswerSheetSvg,
  getAnswerSheetLayout,
  type AnswerSheetBlockBox,
} from '../src/lib/answerSheet'
import { buildSummaryAnswers, makeCodes, shuffleExam } from '../src/lib/shuffleExam'
import { buildAnswerSheetDocx, buildSummaryDocx } from '../src/examEditor/docxBlocks'
import { buildShuffledPrintHtml } from '../src/examEditor/exportBlocks'

const mcq = (no: number, ansIdx: number): QuestionBlock => ({
  type: 'question',
  no,
  text: `Câu trắc nghiệm ${no}`,
  options: ['A', 'B', 'C', 'D'].map((l, i) => ({
    label: l,
    text: i === ansIdx ? `Đúng-${no}` : `Sai-${no}-${i}`,
  })),
})

const tf = (no: number): QuestionBlock => ({
  type: 'question',
  no,
  kind: 'tf',
  text: `Câu đúng sai ${no}`,
  options: ['a', 'b', 'c', 'd'].map((l, i) => ({ label: l, text: `Ý-${no}-${i}` })),
})

const short = (no: number): QuestionBlock => ({
  type: 'question',
  no,
  kind: 'short',
  text: `Câu trả lời ngắn ${no}`,
  options: [],
})

function boxesOverlap(a: AnswerSheetBlockBox, b: AnswerSheetBlockBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function assertValidLayout(
  label: string,
  opts: Parameters<typeof getAnswerSheetLayout>[0],
  expect: { mcqBlocks: number; tf: number; short: number; hasEssay: boolean },
) {
  const layout = getAnswerSheetLayout(opts)
  assert.equal(layout.pageWidth, A4_WIDTH, `${label}: pageWidth`)
  assert.equal(layout.pageHeight, A4_HEIGHT, `${label}: pageHeight`)
  assert.equal(layout.markers.length, 4, `${label}: phải có đúng 4 dấu định vị`)
  assert.equal(layout.mcqBlockCount, expect.mcqBlocks, `${label}: số khối Phần I`)
  assert.equal(layout.tfCount, expect.tf, `${label}: số câu Phần II`)
  assert.equal(layout.shortCount, expect.short, `${label}: số câu Phần III`)
  assert.equal(layout.hasEssay, expect.hasEssay, `${label}: trạng thái tự luận`)

  // Mọi khối nằm trong khổ A4 và không chạm vùng dấu định vị dưới
  assert.ok(layout.maxBottom <= A4_HEIGHT - 60, `${label}: tràn trang A4 (maxBottom=${layout.maxBottom})`)
  for (const b of layout.blocks) {
    assert.ok(b.x >= 0 && b.y >= 0, `${label}: khối ${b.id} toạ độ âm`)
    assert.ok(b.x + b.width <= A4_WIDTH, `${label}: khối ${b.id} tràn phải`)
    assert.ok(b.y + b.height <= A4_HEIGHT, `${label}: khối ${b.id} tràn dưới`)
  }

  // Không có 2 khối nào chồng lên nhau
  for (let i = 0; i < layout.blocks.length; i++) {
    for (let j = i + 1; j < layout.blocks.length; j++) {
      assert.ok(
        !boxesOverlap(layout.blocks[i], layout.blocks[j]),
        `${label}: ${layout.blocks[i].id} chồng lên ${layout.blocks[j].id}`,
      )
    }
  }

  // Không khối nội dung nào chồng lên 4 dấu định vị
  for (const [mi, m] of layout.markers.entries()) {
    const mBox: AnswerSheetBlockBox = { id: `marker-${mi}`, label: 'marker', x: m.x, y: m.y, width: m.size, height: m.size }
    for (const b of layout.blocks) {
      assert.ok(!boxesOverlap(mBox, b), `${label}: ${b.id} đè lên dấu định vị ${mi}`)
    }
  }

  // Kiểm SVG không dùng entity HTML lỗi XML (&nbsp;) và đủ số dấu định vị + mã đề
  const svg = generateAnswerSheetSvg(opts)
  assert.ok(svg.startsWith('<svg ') && svg.endsWith('</svg>'), `${label}: SVG hợp lệ`)
  assert.ok(!svg.includes('&nbsp;'), `${label}: SVG không được chứa &nbsp;`)
  const blackMarkers = svg.match(/width="24" height="24" fill="#000000"/g) ?? []
  assert.equal(blackMarkers.length, 4, `${label}: SVG có 4 dấu định vị đen`)
  assert.equal(svg.includes('PHẦN I.'), expect.mcqBlocks > 0, `${label}: hiển thị Phần I`)
  assert.equal(svg.includes('PHẦN II.'), expect.tf > 0, `${label}: hiển thị Phần II`)
  assert.equal(svg.includes('PHẦN III.'), expect.short > 0, `${label}: hiển thị Phần III`)
  assert.equal(svg.includes('PHẦN TỰ LUẬN:'), expect.hasEssay, `${label}: hiển thị khung tự luận`)
  return { layout, svg }
}

/* ------------------------------------------------------------------ *
 * Ca 1: Đề 22 câu (12 mcq, 4 tf, 6 short), 4 mã
 * ------------------------------------------------------------------ */
const blocks22: ExamBlock[] = [
  { type: 'header', left: 'SỞ GD&ĐT HÀ NỘI\nTRƯỜNG THPT CHU VĂN AN', right: 'KỲ THI THỬ TỐT NGHIỆP THPT 2025\nMôn thi: Toán' },
  { type: 'title', text: 'ĐỀ THI THỬ MÔN TOÁN' },
  { type: 'heading', text: 'PHẦN I. TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN' },
  ...Array.from({ length: 12 }, (_, i) => mcq(i + 1, i % 4)),
  { type: 'heading', text: 'PHẦN II. TRẮC NGHIỆM ĐÚNG SAI' },
  ...Array.from({ length: 4 }, (_, i) => tf(13 + i)),
  { type: 'heading', text: 'PHẦN III. TRẢ LỜI NGẮN' },
  ...Array.from({ length: 6 }, (_, i) => short(17 + i)),
  { type: 'heading', text: 'ĐÁP ÁN' },
  {
    type: 'answerKey',
    items: [
      ...Array.from({ length: 12 }, (_, i) => ({ no: i + 1, answer: 'ABCD'[i % 4] })),
      ...Array.from({ length: 4 }, (_, i) => ({ no: 13 + i, answer: i % 2 === 0 ? 'ĐSĐĐ' : 'SĐĐS' })),
      { no: 17, answer: '-1,5' },
      { no: 18, answer: '2025' },
      { no: 19, answer: '0,25' },
      { no: 20, answer: '12' },
      { no: 21, answer: '-4' },
      { no: 22, answer: '9,8' },
    ],
  },
]
const doc22: ExamDoc = { ...emptyDoc({ title: 'Đề thi thử Toán 2025', subject: 'Toán', unit: 'TRƯỜNG THPT CHU VĂN AN' }), blocks: blocks22 }
const info22 = extractAnswerSheetInfo(doc22)
assert.equal(info22.mcqCount, 12)
assert.equal(info22.tfCount, 4)
assert.equal(info22.shortCount, 6)
assert.equal(info22.hasEssay, false)
assert.ok(info22.schoolOrUnit?.includes('CHU VĂN AN'))
assert.equal(info22.subject, 'Toán')

let seed = 42
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const codes = makeCodes('101', 4)
const res22 = shuffleExam(doc22, { codes, shuffleQuestions: true, shuffleOptions: true, random })
assert.equal(res22.questionCount, 22)
assert.equal(res22.answeredCount, 22)

for (const v of res22.versions) {
  const { svg } = assertValidLayout(
    `22-cau-${v.code}`,
    { ...info22, code: v.code },
    { mcqBlocks: 2, tf: 4, short: 6, hasEssay: false },
  )
  // Mã đề in sẵn trong 3 ô trên lưới
  for (const ch of v.code) {
    assert.ok(svg.includes(`>${ch}</text>`), `Mã đề ${v.code} thiếu ký tự ${ch}`)
  }
}

// Kiểm tra bảng đáp án tổng hợp khớp đáp án từng mã đề sau xáo
const sum22 = buildSummaryAnswers(res22)
assert.deepEqual(sum22.codes, ['101', '102', '103', '104'])
assert.equal(sum22.byOriginal.length, 22)
assert.equal(sum22.byVersion.length, 22)

// Bảng 2 (theo thứ tự từng mã) phải khớp 1-1 với res22.versions[c].answers & answerKey trong answerDoc
const answerDocKeys = res22.answerDoc.blocks.filter((b) => b.type === 'answerKey')
assert.equal(answerDocKeys.length, 4)
for (let c = 0; c < codes.length; c++) {
  const v = res22.versions[c]
  const akItems = answerDocKeys[c].items
  for (let i = 0; i < 22; i++) {
    assert.equal(sum22.byVersion[i].answers[c], v.answers[i].answer, `Bảng 2 lệch ở mã ${v.code} câu ${i + 1}`)
    assert.equal(sum22.byVersion[i].answers[c], akItems[i].answer, `Bảng 2 lệch so với answerDoc mã ${v.code} câu ${i + 1}`)
  }
}

// Bảng 1 (theo thứ tự đề gốc) phải khớp đáp án của câu gốc đó trong từng mã
for (let origIdx = 0; origIdx < 22; origIdx++) {
  const row = sum22.byOriginal[origIdx]
  assert.equal(row.no, origIdx + 1)
  for (let c = 0; c < codes.length; c++) {
    const v = res22.versions[c]
    const hit = v.answers.find((a) => a.origNo === origIdx + 1)
    assert.ok(hit, `Thiếu origNo=${origIdx + 1} ở mã ${v.code}`)
    assert.equal(row.answers[c], hit.answer, `Bảng 1 lệch ở câu gốc ${origIdx + 1} mã ${v.code}`)
  }
}

/* ------------------------------------------------------------------ *
 * Ca 2: Đề chỉ có 40 mcq → chỉ có Phần I (4 khối × 10 câu)
 * ------------------------------------------------------------------ */
const doc40: ExamDoc = {
  ...emptyDoc({ title: 'Đề 40 câu MCQ', subject: 'Vật lí' }),
  blocks: [
    { type: 'title', text: 'ĐỀ KIỂM TRA VẬT LÍ' },
    ...Array.from({ length: 40 }, (_, i) => mcq(i + 1, i % 4)),
  ],
}
const info40 = extractAnswerSheetInfo(doc40)
assert.equal(info40.mcqCount, 40)
assert.equal(info40.tfCount, 0)
assert.equal(info40.shortCount, 0)
assertValidLayout('40-mcq-only', { ...info40, code: '201' }, { mcqBlocks: 4, tf: 0, short: 0, hasEssay: false })

/* ------------------------------------------------------------------ *
 * Ca 3: Đề nặng nhất 40 mcq + 8 tf + 6 short + tự luận → không tràn A4
 * ------------------------------------------------------------------ */
assertValidLayout(
  'max-40-8-6-essay',
  { title: 'Đề tối đa', subject: 'Toán', schoolOrUnit: 'SỞ GD&ĐT', code: '305', mcqCount: 40, tfCount: 8, shortCount: 6, hasEssay: true },
  { mcqBlocks: 4, tf: 8, short: 6, hasEssay: true },
)

/* ------------------------------------------------------------------ *
 * Ca 4: Đề không có câu nào → questionCount === 0 (nút tạo bị khoá)
 * ------------------------------------------------------------------ */
const emptyExam = { ...emptyDoc({ title: 'Đề trống' }), blocks: [{ type: 'paragraph', text: 'Chưa có câu hỏi' }] as ExamBlock[] }
const emptyRes = shuffleExam(emptyExam, { codes: ['101'], shuffleQuestions: true, shuffleOptions: true })
assert.equal(emptyRes.questionCount, 0, 'Đề rỗng có questionCount === 0')

/* ------------------------------------------------------------------ *
 * Ca 5: Thiếu đáp án → '?' trong bảng tổng hợp và answeredCount < questionCount
 * ------------------------------------------------------------------ */
const partialDoc: ExamDoc = {
  ...emptyDoc({ title: 'Đề thiếu đáp án' }),
  blocks: [
    mcq(1, 0),
    mcq(2, 1),
    { type: 'answerKey', items: [{ no: 1, answer: 'A' }] },
  ],
}
const partialRes = shuffleExam(partialDoc, { codes: ['101', '102'], shuffleQuestions: false, shuffleOptions: false })
assert.equal(partialRes.questionCount, 2)
assert.equal(partialRes.answeredCount, 1)
const partialSum = buildSummaryAnswers(partialRes)
assert.deepEqual(partialSum.byOriginal[0].answers, ['A', 'A'])
assert.deepEqual(partialSum.byOriginal[1].answers, ['?', '?'])

/* ------------------------------------------------------------------ *
 * Ca 6: Kiểm xuất Word (.docx) & HTML in PDF
 * ------------------------------------------------------------------ */
const sumBuf = await Packer.toBuffer(buildSummaryDocx(doc22, sum22))
const sumZip = await JSZip.loadAsync(sumBuf)
assert.ok(sumZip.file('word/document.xml'), 'dap-an-tong-hop.docx thiếu word/document.xml')
const sumText = (await mammoth.extractRawText({ buffer: sumBuf })).value
assert.ok(sumText.includes('BẢNG ĐÁP ÁN TỔNG HỢP'), 'Thiếu tiêu đề bảng tổng hợp')
assert.ok(sumText.includes('Mã 101') && sumText.includes('Mã 104'), 'Thiếu cột mã đề trong Word')
assert.ok(sumText.includes('Câu 22'), 'Thiếu câu 22 trong Word')

// Tạo PNG giả lập kiểm buildAnswerSheetDocx
function makeDummyPng(w: number, h: number): string {
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 255)])
  const raw = Buffer.concat(Array.from({ length: h }, () => row))
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
  const ch = (t: string, d: Buffer) => {
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
  const buf = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ch('IHDR', ihdr), ch('IDAT', deflateSync(raw)), ch('IEND', Buffer.alloc(0))])
  return `data:image/png;base64,${buf.toString('base64')}`
}

const sheetBuf = await Packer.toBuffer(buildAnswerSheetDocx('101', makeDummyPng(1985, 2808)))
const sheetZip = await JSZip.loadAsync(sheetBuf)
assert.ok(Object.keys(sheetZip.files).some((k) => k.startsWith('word/media/')), 'phieu-tra-loi.docx phải chứa ảnh PNG trong word/media/')

const printHtml = buildShuffledPrintHtml(
  res22.versions.map((v) => ({
    doc: v.doc,
    code: v.code,
    sheetSvg: generateAnswerSheetSvg({ ...info22, code: v.code }),
  })),
  'Kiểm tra PDF',
  { answerDoc: res22.answerDoc, summary: sum22 },
)
assert.ok(printHtml.includes('class="sheet-wrapper"'), 'HTML in PDF phải có trang phiếu')
assert.ok(printHtml.includes('BẢNG ĐÁP ÁN TỔNG HỢP'), 'HTML in PDF phải có trang bảng đáp án tổng hợp')

console.log('check-phieu: ALL OK')
