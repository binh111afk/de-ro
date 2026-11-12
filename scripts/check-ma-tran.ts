/**
 * Script kiểm tra hàm dựng ma trận + đặc tả từ dữ liệu phân loại giả (không gọi AI).
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-ma-tran.ts
 */
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { Packer } from 'docx'
import { emptyDoc, type ExamBlock, type QuestionBlock, type EssayBlock } from '../src/data/docTypes'
import {
  buildMatrixData,
  buildSpecData,
  buildMatrixTableBlock,
  buildSpecTableBlock,
  buildMatrixAndSpecExamDoc,
  computeTotalScore,
  DEFAULT_SCORE_CONFIG,
  extractQuestionsFromDoc,
  type QuestionClassified,
} from '../src/lib/matrixExam'
import { buildDocx } from '../src/examEditor/docxBlocks'

let fail = 0
const ok = (cond: boolean, msg: string) => {
  if (!cond) {
    fail++
    console.error('✗', msg)
  } else {
    console.log('✓', msg)
  }
}

console.log('=== TEST 1: Đề mẫu 22 câu Toán 12 (12 mcq, 4 tf, 6 short) ===')
const mcqBlocks: QuestionBlock[] = Array.from({ length: 12 }, (_, i) => ({
  type: 'question',
  no: i + 1,
  kind: 'mcq',
  text: `Câu hỏi trắc nghiệm ${i + 1}`,
  options: [
    { label: 'A', text: 'Phương án A' },
    { label: 'B', text: 'Phương án B' },
    { label: 'C', text: 'Phương án C' },
    { label: 'D', text: 'Phương án D' },
  ],
}))

const tfBlocks: QuestionBlock[] = Array.from({ length: 4 }, (_, i) => ({
  type: 'question',
  no: 12 + i + 1,
  kind: 'tf',
  text: `Câu đúng sai ${12 + i + 1}`,
  options: [
    { label: 'a', text: 'Mệnh đề a' },
    { label: 'b', text: 'Mệnh đề b' },
    { label: 'c', text: 'Mệnh đề c' },
    { label: 'd', text: 'Mệnh đề d' },
  ],
}))

const shortBlocks: QuestionBlock[] = Array.from({ length: 6 }, (_, i) => ({
  type: 'question',
  no: 16 + i + 1,
  kind: 'short',
  text: `Câu trả lời ngắn ${16 + i + 1}`,
  options: [],
}))

const doc22: ExamBlock[] = [...mcqBlocks, ...tfBlocks, ...shortBlocks]
const examDoc22 = {
  ...emptyDoc(),
  title: 'Đề Toán 12 mẫu 2025',
  subject: 'Toán',
  grade: '12',
  blocks: doc22,
}

const q22 = extractQuestionsFromDoc(examDoc22)
ok(q22.length === 22, `Rút trích đủ 22 câu: ${q22.length}`)

// Gán chủ đề và mức độ giả định cho 22 câu Toán 12
const ch1 = 'Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số'
const ch2 = 'Toạ độ của vectơ trong không gian'
const ch3 = 'Nguyên hàm và tích phân'

q22.forEach((q, i) => {
  if (i < 6) {
    q.chuDe = ch1
    q.mucDo = i < 4 ? 'NB' : 'TH'
    q.yeuCau = 'Nhận biết và tính đạo hàm, tính đơn điệu của hàm số'
  } else if (i < 12) {
    q.chuDe = ch2
    q.mucDo = i < 9 ? 'NB' : 'TH'
    q.yeuCau = 'Xác định toạ độ vectơ và điểm trong không gian'
  } else if (i < 16) {
    // 4 câu TF: mỗi câu 4 ý
    q.chuDe = i < 14 ? ch1 : ch3
    q.mucDoTf = ['NB', 'TH', 'TH', 'VD']
    q.yeuCau = 'Vận dụng tính chất hàm số và tích phân xét tính đúng sai'
  } else {
    // 6 câu ngắn
    q.chuDe = ch3
    q.mucDo = i < 19 ? 'VD' : 'VDC'
    q.yeuCau = 'Tính tích phân và giải bài toán thực tế'
  }
})

const configToan = DEFAULT_SCORE_CONFIG('Toán')
ok(configToan.mcqPoint === 0.25, 'MCQ Toán: 0.25đ')
ok(configToan.tfPointPerItem === 0.25, 'TF Toán: 0.25đ / ý (4 ý = 1.0đ)')
ok(configToan.shortPoint === 0.5, 'Short Toán: 0.5đ')

const totalScore22 = computeTotalScore(q22, configToan)
ok(totalScore22 === 10, `Tổng điểm 22 câu Toán 12 đúng 10 điểm: ${totalScore22}`)

const matrix22 = buildMatrixData(q22, configToan, { grade: 12, separateVdc: false })
ok(matrix22.parts.length === 3, `Ma trận có đủ 3 phần: ${matrix22.parts.map((p) => p.id).join(', ')}`)
ok(matrix22.summary.grandTotalCount === 34, `Đếm đúng-sai theo ý: 12 mcq + 16 ý tf + 6 short = 34 mục (thực tế: ${matrix22.summary.grandTotalCount})`)
ok(matrix22.summary.grandTotalScore === 10, `Tổng điểm ma trận bằng 10: ${matrix22.summary.grandTotalScore}`)

// Kiểm tra đếm số câu từng phần
const mcqSum = Object.entries(matrix22.summary.partTotals).filter(([k]) => k.startsWith('mcq_')).reduce((a, [, v]) => a + v, 0)
const tfSum = Object.entries(matrix22.summary.partTotals).filter(([k]) => k.startsWith('tf_')).reduce((a, [, v]) => a + v, 0)
const shortSum = Object.entries(matrix22.summary.partTotals).filter(([k]) => k.startsWith('short_')).reduce((a, [, v]) => a + v, 0)
ok(mcqSum === 12, `Tổng câu MCQ là 12: ${mcqSum}`)
ok(tfSum === 16, `Tổng ý TF là 16 (4 câu × 4 ý): ${tfSum}`)
ok(shortSum === 6, `Tổng câu Short là 6: ${shortSum}`)

// Kiểm tra điểm từng phần
const mcqScore = Object.entries(matrix22.summary.partScoreTotals).filter(([k]) => k.startsWith('mcq_')).reduce((a, [, v]) => a + v, 0)
const tfScore = Object.entries(matrix22.summary.partScoreTotals).filter(([k]) => k.startsWith('tf_')).reduce((a, [, v]) => a + v, 0)
const shortScore = Object.entries(matrix22.summary.partScoreTotals).filter(([k]) => k.startsWith('short_')).reduce((a, [, v]) => a + v, 0)
ok(Math.abs(mcqScore - 3.0) < 0.001, `Điểm MCQ = 3.0đ: ${mcqScore}`)
ok(Math.abs(tfScore - 4.0) < 0.001, `Điểm TF = 4.0đ: ${tfScore}`)
ok(Math.abs(shortScore - 3.0) < 0.001, `Điểm Short = 3.0đ: ${shortScore}`)

console.log('\n=== TEST 2: Đề có tự luận (lấy đúng score từng câu) ===')
const essayExamBlocks: ExamBlock[] = [
  ...Array.from({ length: 12 }, (_, i): QuestionBlock => ({
    type: 'question',
    no: i + 1,
    kind: 'mcq',
    text: `Câu trắc nghiệm ${i + 1}`,
    options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }],
  })),
  { type: 'essay', no: 1, text: 'Bài toán tự luận 1', score: 3.5 },
  { type: 'essay', no: 2, text: 'Bài toán tự luận 2', score: 3.5 },
]

const examDocEssay = {
  ...emptyDoc(),
  title: 'Đề có tự luận',
  subject: 'Toán',
  grade: '9',
  blocks: essayExamBlocks,
}

const qEssay = extractQuestionsFromDoc(examDocEssay)
ok(qEssay.length === 14, `Rút trích 14 câu (12 mcq + 2 essay): ${qEssay.length}`)
ok(qEssay[12].kind === 'essay' && qEssay[12].score === 3.5, `Bài 1 lấy đúng score 3.5đ: ${qEssay[12].score}`)
ok(qEssay[13].kind === 'essay' && qEssay[13].score === 3.5, `Bài 2 lấy đúng score 3.5đ: ${qEssay[13].score}`)

const totalScoreEssay = computeTotalScore(qEssay, configToan)
ok(totalScoreEssay === 10, `Tổng điểm đề tự luận = 12 × 0.25 + 3.5 + 3.5 = 10.0đ (thực tế: ${totalScoreEssay})`)

const matrixEssay = buildMatrixData(qEssay, configToan, { grade: 9, separateVdc: false })
ok(matrixEssay.parts.some((p) => p.id === 'essay'), 'Ma trận có cột Phần Tự luận')
const essayScoreTotal = Object.entries(matrixEssay.summary.partScoreTotals).filter(([k]) => k.startsWith('essay_')).reduce((a, [, v]) => a + v, 0)
ok(Math.abs(essayScoreTotal - 7.0) < 0.001, `Điểm tự luận trong ma trận đúng 7.0đ: ${essayScoreTotal}`)

console.log('\n=== TEST 3: Sửa mức một câu → ma trận đổi đúng ô ===')
const q22Modified: QuestionClassified[] = q22.map((q) => ({ ...q, mucDoTf: [...q.mucDoTf] as [any, any, any, any] }))
// Câu 1 đang ở NB -> đổi sang VD
ok(q22Modified[0].mucDo === 'NB', 'Câu 1 ban đầu mức NB')
const beforeNbCount = matrix22.summary.partTotals['mcq_NB']
const beforeVdCount = matrix22.summary.partTotals['mcq_VD']

q22Modified[0].mucDo = 'VD'
const matrix22Modified = buildMatrixData(q22Modified, configToan, { grade: 12, separateVdc: false })
const afterNbCount = matrix22Modified.summary.partTotals['mcq_NB']
const afterVdCount = matrix22Modified.summary.partTotals['mcq_VD']

ok(afterNbCount === beforeNbCount - 1, `Số câu MCQ NB giảm 1: ${beforeNbCount} -> ${afterNbCount}`)
ok(afterVdCount === beforeVdCount + 1, `Số câu MCQ VD tăng 1: ${beforeVdCount} -> ${afterVdCount}`)

console.log('\n=== TEST 4: Không có mạng → bảng vẫn mở, ô trống/mặc định ===')
const qFallback = extractQuestionsFromDoc(examDoc22, 'Chưa phân loại')
ok(qFallback.every((q) => q.chuDe === 'Chưa phân loại'), 'Chủ đề mặc định khi không có mạng')
ok(qFallback.every((q) => q.yeuCau === ''), 'Yêu cầu để trống để giáo viên tự chọn')
const matrixFallback = buildMatrixData(qFallback, configToan, { grade: 12, separateVdc: false })
ok(matrixFallback.rows.length === 1 && matrixFallback.rows[0].chuDe === 'Chưa phân loại', 'Dựng bảng ma trận thành công với ô trống')
ok(matrixFallback.summary.grandTotalScore === 10, 'Tổng điểm vẫn tính đúng 10đ')

console.log('\n=== TEST 5: Dựng bảng Bản đặc tả (buildSpecData & buildSpecTableBlock) ===')
const spec22 = buildSpecData(q22, { grade: 12, separateVdc: false })
ok(spec22.topics.length === 3, `Đặc tả gom thành 3 chủ đề: ${spec22.topics.length}`)
ok(spec22.topics[0].chuDe === ch1, `Chủ đề 1 đúng tên: ${spec22.topics[0].chuDe}`)
ok(spec22.topics[0].items.length > 0, 'Chủ đề 1 có yêu cầu cần đạt')
ok(spec22.topics[0].items[0].questionRefs.includes('C1'), `Liệt kê câu số có C1: ${spec22.topics[0].items[0].questionRefs}`)

const specTableBlock = buildSpecTableBlock(spec22)
ok(specTableBlock.type === 'table', 'Bản đặc tả sinh ra TableBlock')
ok(specTableBlock.rows.length >= 4, `Số hàng bản đặc tả: ${specTableBlock.rows.length}`)

const matrixTableBlock = buildMatrixTableBlock(matrix22)
ok(matrixTableBlock.type === 'table', 'Ma trận sinh ra TableBlock')
ok(matrixTableBlock.rows.length >= 5, `Số hàng ma trận: ${matrixTableBlock.rows.length}`)

console.log('\n=== TEST 6: Xuất file Word riêng (khổ ngang, Times New Roman 13) ===')
const matrixExamDoc = buildMatrixAndSpecExamDoc(examDoc22, matrixTableBlock, specTableBlock, {
  subject: 'Toán',
  grade: 12,
  duration: '90 phút',
  term: 'Cuối học kỳ II',
  schoolYear: '2025 - 2026',
})
ok(matrixExamDoc.blocks.some((b) => b.type === 'title' && String(b.text).includes('MA TRẬN')), 'Có tiêu đề MA TRẬN')
ok(matrixExamDoc.blocks.some((b) => b.type === 'title' && String(b.text).includes('BẢN ĐẶC TẢ')), 'Có tiêu đề BẢN ĐẶC TẢ')

const docxObj = buildDocx(matrixExamDoc, { landscape: true })
const docxBuf = await Packer.toBuffer(docxObj)
ok(docxBuf.subarray(0, 2).toString() === 'PK', 'File Word sinh ra là ZIP hợp lệ')

const zip = await JSZip.loadAsync(docxBuf)
const docXml = await zip.file('word/document.xml')!.async('string')
ok(docXml.includes('w:orient="landscape"'), 'Khổ giấy là Landscape (khổ ngang)')
ok(docXml.includes('MA TRẬN ĐỀ KIỂM TRA'), 'Chứa nội dung Ma trận')
ok(docXml.includes('BẢN ĐẶC TẢ ĐỀ KIỂM TRA'), 'Chứa nội dung Bản đặc tả')
ok(docXml.includes('<w:tbl>'), 'Có bảng trong file docx')

if (fail) {
  console.error(`\n❌ THẤT BẠI: có ${fail} bài test bị lỗi!`)
  process.exit(1)
} else {
  console.log('\n🎉 TẤT CẢ TEST ĐỀU ĐẠT CHUẨN (check-ma-tran: OK)!')
}
