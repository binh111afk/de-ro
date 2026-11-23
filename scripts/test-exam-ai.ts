import assert from 'node:assert/strict'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-text-style/font-family'
import { EXAM_NODES, EXAM_MARKS, BaseParagraphNode } from '../src/examEditor/schema'
import { blocksToTipTap, tipTapToBlocks } from '../src/examEditor/convert'
import { applyExamReply } from '../src/examEditor/examAiResult'
import { figureDoc, figureImageAttrs } from '../src/examEditor/toolImages'
import { CONTINUE_EXAM_EDIT, examDigest, examIntent, focusNote, isExamMutationReply, rewritesWholeExam } from '../src/lib/aiDocContext'

const editor = new Editor({
  element: null,
  extensions: [
    StarterKit.configure({
      paragraph: false, heading: false, orderedList: false, bulletList: false, listItem: false,
      link: false, underline: false, hardBreak: false, horizontalRule: false,
    }),
    TextStyle, FontFamily, Table, TableRow, TableCell, TableHeader, ...EXAM_MARKS, ...EXAM_NODES, BaseParagraphNode,
  ],
  content: blocksToTipTap([
    { type: 'paragraph', text: 'Đề cũ' },
    { type: 'essay', no: 1, score: 2, text: 'Bài cũ' },
    { type: 'rubric', items: [{ label: 'Bài 1', text: 'Cách chấm cũ' }, { label: 'Bài 2', text: 'Giữ mục này' }] },
  ]),
})
const draw = (raw: unknown) => {
  const tool = figureDoc(raw)
  return tool ? figureImageAttrs(tool) : undefined
}
const apply = (raw: unknown, allowReplace = false) => applyExamReply(editor, JSON.stringify(raw), allowReplace, draw)
const initial = editor.getJSON()
const paragraph = (text: string) => ({ type: 'paragraph', text })
const essay = { type: 'essay', no: 1, score: 2, text: 'Bài mới' }
const essayPatch = { op: 'replace', id: 'k1', block: essay }

// Văn bản tự nhận đã sửa, JSON chỉ có lời báo, id hỏng và op lạ đều bị từ chối.
const falseClaim = applyExamReply(editor, 'Đã xoá câu hỏi. Đã sửa 8 khối trong đề.', false, draw)
assert.ok(falseClaim.failed)
assert.doesNotMatch(falseClaim.text, /Đã sửa|Đã xoá/)
for (const patch of [
  [],
  [{ op: 'delete', id: 'k0' }, { op: 'delete', id: 'k900' }],
  [{ op: 'update', id: 'k0', block: paragraph('Đề khác') }],
  [{ op: 'replace', id: 'k0', block: paragraph('Đề cũ') }],
]) {
  assert.ok(apply({ action: 'patch', say: 'Đã xong', patch }).failed)
  assert.deepEqual(editor.getJSON(), initial)
}

// Lượt sửa không hiển thị bảng hỏi làm đề mới, kể cả tiếp tục sau một bảng hỏi cũ.
const editRequest = 'Thêm sơ đồ ở câu 10 và cập nhật đáp án'
assert.equal(examIntent(editRequest), 'doc')
for (const request of ['Xoá câu 6', 'Xáo lại phương án', 'Trộn đáp án', editRequest + '\n' + CONTINUE_EXAM_EDIT]) {
  assert.equal(examIntent(request), 'doc')
  assert.equal(rewritesWholeExam(request), false)
}
assert.equal(rewritesWholeExam('Soạn một đề mới'), true)
assert.ok(apply({ action: 'replace', blocks: [paragraph('Đề khác')] }).failed)
assert.deepEqual(editor.getJSON(), initial)
assert.equal(examIntent('Giải thích cách làm câu 3 và vì sao thay x bằng 2.'), 'chat')
assert.equal(examIntent('Chèn lời giải câu 3 vào đề'), 'doc')
assert.equal(isExamMutationReply('{"action":"patch","patch":[]}'), true)

// Từ chối câu Đ/S thiếu ý và yêu cầu cập nhật rubric có nhãn bài.
assert.match(apply({ action: 'append', blocks: [{ type: 'question', no: 15, kind: 'tf', text: 'Xét các ý', options: [] }] }).text, /Câu 15.*thiếu/)
assert.match(apply({ action: 'patch', patch: [essayPatch, {
  op: 'insertAfter', id: 'k2', block: { type: 'rubric', title: 'Bài 1', items: [{ label: 'a)', text: 'Hướng dẫn mới' }] },
}] }).text, /chưa cập nhật hướng dẫn chấm/)
assert.deepEqual(editor.getJSON(), initial)
assert.ok(focusNote(initial, 'Đổi Bài 1').includes('Cách chấm cũ'))
assert.equal(apply({ action: 'patch', patch: [
  essayPatch,
  { op: 'replace', id: 'k2', block: { type: 'rubric', items: [{ label: 'Bài 1', text: 'Cách chấm mới' }, { label: 'Bài 2', text: 'Giữ mục này' }] } },
] }).failed, undefined)
assert.match(editor.getText(), /Bài mới/)
assert.match(editor.getText(), /Cách chấm mới/)
assert.doesNotMatch(editor.getText(), /Cách chấm cũ/)

// Chèn trước và sau đúng vị trí kể cả khi xoá phần tử cuối.
assert.equal(apply({ action: 'patch', patch: [
  { op: 'delete', id: '[k2]' },
  { op: 'insertBefore', id: 'k2', block: paragraph('Trước') },
  { op: 'insertAfter', id: 'k2', block: paragraph('Sau') },
] }).failed, undefined)
assert.match(editor.getText(), /Trước\s+Sau/)

const tf = { type: 'question', no: 6, kind: 'tf', text: 'Đọc bảng bên', options: ['một', 'hai', 'ba', 'bốn'] }
const result = apply({
  action: 'append',
  say: 'Đã thêm figure.\nLưu ý: Xem lại số liệu.',
  warning: 'Lưu ý: Xem lại số liệu.',
  blocks: [{ ...tf, figure: { kind: 'stats', chart: 'pie', data: 'không dùng được' } }],
})
assert.equal(result.failed, undefined)
assert.match(result.text, /Chưa dựng được hình hoặc bảng ở Câu 6/)
assert.doesNotMatch(result.text, /figure/)
assert.equal(result.text.match(/Lưu ý:/g)?.length, 1)

assert.ok(draw({ kind: 'stats', chart: 'table', data: 'Hoa đỏ; Hoa trắng\nSố cây: 705; 224' }))
assert.equal(apply({ action: 'append', blocks: [
  { type: 'table', rows: [['Điểm', '$[5;6)$'], ['Tần số', 3]] },
] }).failed, undefined)
assert.ok(tipTapToBlocks(editor.getJSON()).some((b) => b.type === 'table'))
assert.match(apply({ action: 'append', blocks: [{ type: 'table', rows: [] }] }).text, /Bảng số liệu thiếu dữ liệu/)

const grouped = { kind: 'grouped', groups: '[0; 5): 5\n[5; 10): 12\n[10; 15): 20\n[15; 20): 9\n[20; 25): 4' }
const sourceFigure = draw(grouped)
assert.ok(sourceFigure, 'vẽ được bảng ghép nhóm thật')
assert.equal(apply({ action: 'append', blocks: [{ ...tf, no: 7, figure: grouped }] }).failed, undefined)
const digest = examDigest(editor.getJSON()) ?? ''
assert.match(digest, /\[k\d+\] question Câu 7.*Dữ liệu hình:.*grouped.*12.*20.*9.*4/)
assert.doesNotMatch(digest, /data:image/)
const blocks = tipTapToBlocks(editor.getJSON())
assert.ok(blocks.some((b) => b.type === 'question' && b.no === 7 && b.options.length === 4))
editor.destroy()
console.log('test-exam-ai: OK')
