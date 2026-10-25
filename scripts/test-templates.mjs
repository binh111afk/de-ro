/**
 * Test bộ khối mẫu: mọi mẫu dựng được node hợp lệ theo schema, và vị trí
 * "cuối đề" (examFooterPos — port insertExamFooter của soandethi).
 * Chạy: npm run test:templates
 */
import assert from 'node:assert/strict'
import { getSchema } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Fragment } from '@tiptap/pm/model'
import { EXAM_MARKS, EXAM_NODES, BaseParagraphNode } from '../src/examEditor/schema.ts'
import { BLOCK_TEMPLATES, examFooterPos, templateById } from '../src/examEditor/templates.ts'
import { blocksToTipTap } from '../src/examEditor/convert.ts'

// schema giống hệt danh sách extension trong ExamEditor (đủ node + mark)
const schema = getSchema([
  StarterKit.configure({
    heading: false,
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false,
    hardBreak: false,
    link: false,
    underline: false,
    paragraph: false,
  }),
  ...EXAM_MARKS,
  ...EXAM_NODES,
  BaseParagraphNode,
  Table,
  TableRow,
  TableHeader,
  TableCell,
])

const docOf = (blocks) => schema.nodeFromJSON(blocksToTipTap(blocks))

const offsetOf = (doc, typeName) => {
  let pos = -1
  doc.forEach((node, offset) => {
    if (pos < 0 && node.type.name === typeName) pos = offset
  })
  return pos
}

let pass = 0
let fail = 0
const check = (name, fn) => {
  try {
    fn()
    pass++
    console.log('✅', name)
  } catch (err) {
    fail++
    console.log('❌', name, '-', err.message)
  }
}

// ------------------------------------------------------------------
// 1. Mọi mẫu dựng được nội dung hợp lệ ở cấp tài liệu
// ------------------------------------------------------------------
check('mọi mẫu build() ra node hợp lệ theo schema', () => {
  for (const tpl of BLOCK_TEMPLATES) {
    const json = tpl.build()
    const arr = Array.isArray(json) ? json : [json]
    try {
      const nodes = arr.map((n) => schema.nodeFromJSON(n))
      const doc = schema.topNodeType.createChecked(null, Fragment.fromArray(nodes))
      doc.check()
    } catch (err) {
      assert.fail(`mẫu "${tpl.id}": ${err.message}`)
    }
  }
})

check('id mẫu không trùng, nhóm luôn thuộc 4 nhóm chuẩn', () => {
  const ids = new Set(BLOCK_TEMPLATES.map((tpl) => tpl.id))
  assert.equal(ids.size, BLOCK_TEMPLATES.length)
  const groups = new Set(['Đầu đề', 'Câu hỏi', 'Nội dung', 'Bố cục'])
  for (const tpl of BLOCK_TEMPLATES) assert.ok(groups.has(tpl.group), `${tpl.id}: nhóm lạ ${tpl.group}`)
})

check('mẫu đặc biệt khai báo place đúng (student/footer)', () => {
  assert.equal(templateById('student')?.place, 'student')
  assert.equal(templateById('divider')?.place, 'footer')
  assert.equal(templateById('question')?.place, undefined)
})

// ------------------------------------------------------------------
// 2. Vị trí "cuối đề" — examFooterPos
// ------------------------------------------------------------------
const headerQG = docOf([
  { type: 'header', left: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO', right: 'KỲ THI TỐT NGHIỆP THPT' },
  { type: 'paragraph', text: 'Nội dung' },
  { type: 'question', no: 1, text: 'Hỏi gì?', options: [{ label: 'A', text: '…' }] },
])

check('đề THPT QG: mẫu thí sinh chèn ngay sau đầu đề', () => {
  assert.equal(examFooterPos(headerQG, 'student'), headerQG.firstChild.nodeSize)
})

check('đề không có phần chấm: footer = cuối tài liệu', () => {
  assert.equal(examFooterPos(headerQG, 'footer'), headerQG.content.size)
})

const withRubric = docOf([
  { type: 'header', left: 'SỞ GD&ĐT', right: 'KỲ THI KHÁC' },
  { type: 'paragraph', text: 'Nội dung' },
  { type: 'pageBreak' },
  { type: 'rubric', title: 'HƯỚNG DẪN CHẤM', items: [{ label: '1.', text: 'Ý' }] },
])

check('footer = trước phần chấm, lùi qua pageBreak đứng liền trước', () => {
  const expected = offsetOf(withRubric, 'examPageBreak')
  assert.equal(examFooterPos(withRubric, 'footer'), expected)
})

check('đề không phải THPT QG: thí sinh vẫn chèn cuối đề', () => {
  assert.equal(examFooterPos(withRubric, 'student'), offsetOf(withRubric, 'examPageBreak'))
})

const withAnswerHeading = docOf([
  { type: 'paragraph', text: 'Nội dung' },
  { type: 'heading', text: 'ĐÁP ÁN VÀ THANG ĐIỂM', level: 1 },
])

check('heading bắt đầu bằng ĐÁP ÁN được coi là ranh giới phần chấm', () => {
  assert.equal(examFooterPos(withAnswerHeading, 'footer'), offsetOf(withAnswerHeading, 'examHeading'))
})

const plain = docOf([{ type: 'paragraph', text: 'Chỉ một đoạn' }])

check('đề thường không đầu đề: footer = cuối tài liệu', () => {
  assert.equal(examFooterPos(plain, 'student'), plain.content.size)
})

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
process.exit(fail ? 1 : 0)
