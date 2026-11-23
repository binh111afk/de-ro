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
import { blocksToTipTap, plainText, tipTapToBlocks } from '../src/examEditor/convert'
import { Packer } from 'docx'
import JSZip from 'jszip'
import { buildDocx } from '../src/examEditor/docxBlocks'
import { emptyDoc, type ExamBlock } from '../src/data/docTypes'
import { parseStats } from '../src/lib/stats'
import { applyExamMaintenance, applyExamReply } from '../src/examEditor/examAiResult'
import { figureDoc, figureImageAttrs } from '../src/examEditor/toolImages'
import { CONTINUE_EXAM_EDIT, examDigest, examIntent, focusNote, isExamMutationReply, rewritesWholeExam } from '../src/lib/aiDocContext'
import { mergeChunks, parseChunk, planExamSplit, scanSourceQuestions } from '../src/lib/examSplit'

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

const source = [
  'I. TRẮC NGHIỆM',
  ...Array.from({ length: 12 }, (_, i) => `Câu ${i + 1}. Đề bài`),
  'II. PHẦN TỰ LUẬN (7 điểm)',
  'Bài 1 (2 điểm) Tính', 'Bài 2. Tính', 'Bài 3. Vẽ [Hình: Tam giác]', 'Bài 4. Tính',
  'ĐÁP ÁN', 'Câu 30. Lời giải',
].join('\n')
const plan = planExamSplit('Soạn y chang đề mẫu, đổi số liệu', source)!
assert.deepEqual(plan.map(({ count, essay }) => [count, essay]), [[6, false], [6, false], [4, true]])
assert.match(plan[2].note, /Bài 1 đến Bài 4/)
assert.deepEqual(plan[2].figs, [false, false, true, false])
assert.deepEqual(scanSourceQuestions('Phần II. Tự luận\nCâu I. Tính\nCâu II (2 điểm) Tính').map((q) => q.essay), [true, true])
assert.equal(planExamSplit('Soạn đề tương tự 12 câu gồm 8 câu nhiều lựa chọn và 4 câu đúng sai', source), null)
assert.equal(planExamSplit('Trích 16 câu từ đề tương tự', source), null)
assert.equal(planExamSplit('Soạn y chang đề 2, đổi số liệu', `Đề 1\n${source}\nĐề 2\n${source}`), null)
assert.equal(planExamSplit('Soạn đề tương tự 16 câu', `Mã đề 0123\nMã đề 0123\n${source}`)?.length, 3)
assert.equal(parseChunk(JSON.stringify({ blocks: [essay] }), plan[2]), null)
const key = (...items: Array<[number, string]>) => ({ type: 'answerKey' as const, items: items.map(([no, answer]) => ({ no, answer })) })
const tfQuestion = (no: number) => ({ ...tf, no })
const choice = { type: 'question', no: 1, text: 'Chọn **đúng**', options: ['một', 'hai', 'ba', 'bốn'] }
const short = { type: 'question', no: 3, kind: 'short', text: 'Tính', options: [] }
const merged = JSON.parse(mergeChunks([
  { blocks: [{ ...choice, figure: grouped }, key([1, 'A'])] },
  { blocks: [tfQuestion(1), key([1, 'ĐSĐS'])] },
  { blocks: [{ ...essay, no: 1 }, { ...essay, no: 2 }, { ...essay, no: 3 }, { ...essay, no: 4 }] },
], [[false], [false], plan[2].figs]))
assert.equal(merged.blocks[0].figure.kind, 'grouped')
assert.deepEqual(merged.blocks.filter((b: { type: string }) => b.type === 'essay').map((b: { no: number }) => b.no), [1, 2, 3, 4])
assert.deepEqual(merged.blocks.at(-1), key([1, 'A'], [2, 'ĐSĐS']))
assert.ok(draw({ kind: 'stats', chart: 'line', data: 'pH; 5; 6; 7; 8; 9\nt (giây): 180; 90; 50; 70; 150' }))

// Chèn câu có số trùng một câu cũ và thêm bảng đáp án rời trong cùng patch.
const heading = (text: string) => ({ type: 'heading', text })
assert.equal(apply({ blocks: [
  choice, heading('PHẦN II. Từ câu 2 đến câu 2'), tfQuestion(2),
  heading('PHẦN III. Từ câu 3 đến câu 3'), short, key([1, 'A'], [2, 'ĐSĐS'], [3, '1,37']),
] }, true).failed, undefined)
assert.equal(apply({ action: 'patch', patch: [
  { op: 'insertAfter', id: 'k2', blocks: [tfQuestion(3), tfQuestion(4)] },
  { op: 'insertAfter', id: 'k5', block: key([3, 'ĐĐSS'], [4, 'SSĐĐ']) },
] }).failed, undefined)
const added = tipTapToBlocks(editor.getJSON())
assert.deepEqual(added.flatMap((b) => b.type === 'question' ? [b.no] : []), [1, 2, 3, 4, 5])
assert.deepEqual(added.filter((b) => b.type === 'answerKey'), [key([1, 'A'], [2, 'ĐSĐS'], [3, 'ĐĐSS'], [4, 'SSĐĐ'], [5, '1,37'])])
assert.deepEqual(added.flatMap((b) => b.type === 'heading' ? [plainText(b.text)] : []),
  ['PHẦN II. Từ câu 2 đến câu 4', 'PHẦN III. Từ câu 5 đến câu 5'])
let boldInEditor = false
editor.state.doc.descendants((node) => {
  if (node.text === 'đúng') boldInEditor = node.marks.some((mark) => mark.type.name === 'bold')
})
assert.ok(boldInEditor)
assert.equal(apply({ action: 'patch', patch: [
  { op: 'replace', id: 'k7', block: key([4, 'ĐSĐS']) },
] }).failed, undefined)
assert.deepEqual(tipTapToBlocks(editor.getJSON()).filter((b) => b.type === 'answerKey'),
  [key([1, 'A'], [2, 'ĐSĐS'], [3, 'ĐĐSS'], [4, 'ĐSĐS'], [5, '1,37'])])

// Hình trong bản JSON gửi cho AI được vẽ lại hoặc phục hồi từ ref.
const graph = draw({ kind: 'graph', curves: ['(x+1)/(x-2)'], asymptotes: 'x=2; y=1' })!
assert.ok(graph.src && graph.plot)
const header = {
  type: 'header',
  left: [{ text: 'ĐỀ THAM KHẢO' }, { text: 'Đề tham khảo', marks: [{ type: 'boxed' }] }],
  right: [{ text: 'MÔN: TOÁN' }, { text: 'Thời gian làm bài: 90 phút', marks: [{ type: 'italic' }] }],
}
assert.equal(apply({ blocks: [header, { ...choice, text: [{ text: choice.text }, { text: '', image: graph }] }] }, true).failed, undefined)
const [normalizedHeader] = tipTapToBlocks(editor.getJSON())
assert.ok(normalizedHeader.type === 'header')
assert.equal(plainText(normalizedHeader.left), 'Đề tham khảo')
assert.equal(plainText(normalizedHeader.right), 'MÔN: TOÁN\nThời gian làm bài: 90 phút')
const rawGraph = JSON.parse(graph.plot!)
rawGraph.spec.curves = ['x^3-3x']
rawGraph.spec.grid = true
const patchFigure = (figure: unknown) => apply({ action: 'patch', patch: [
  { id: 'k1', block: { ...choice, text: [{ text: choice.text }, { text: '', image: { ref: 0, figure } }] } },
] })
assert.equal(patchFigure(JSON.stringify(rawGraph)).failed, undefined)
let redrawn = tipTapToBlocks(editor.getJSON()).find((b) => b.type === 'question')
assert.ok(redrawn?.type === 'question' && Array.isArray(redrawn.text))
assert.match(redrawn.text.at(-1)?.image?.src ?? '', /^data:image/)
assert.match(redrawn.text.at(-1)?.image?.plot ?? '', /x\^3-3x/)
assert.match(patchFigure('dữ liệu hỏng').text, /Chưa dựng được hình/)
redrawn = tipTapToBlocks(editor.getJSON()).find((b) => b.type === 'question')
assert.ok(redrawn?.type === 'question' && Array.isArray(redrawn.text) && redrawn.text.at(-1)?.image?.src)
const imageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV9kAAAAASUVORK5CYII='
const pictured: ExamBlock[] = Array.from({ length: 20 }, (_, i) => ({
  type: 'question', no: i + 1,
  text: i >= 8 && i < 16 ? [{ text: `Câu gốc ${i + 1}` }, { text: '', image: { src: imageSrc } }] : `Câu gốc ${i + 1}`,
  options: ['A', 'B', 'C', 'D'].map(label => ({ label, text: `Lựa chọn ${label}` })),
}))
editor.commands.setContent(blocksToTipTap([...pictured, {
  type: 'answerKey', items: pictured.map((_, i) => ({ no: i + 1, answer: 'A' })),
}]))
const before = editor.getJSON()
assert.equal(apply({ action: 'replace', blocks: [paragraph('Đề viết lại')] }).failed, true)
assert.deepEqual(editor.getJSON(), before)
const wrongAppend = applyExamReply(editor, JSON.stringify({ action: 'append', blocks: [paragraph('Không sửa câu nào')] }),
  false, draw, undefined, undefined, { requirePatch: true })
assert.equal(wrongAppend.failed, true)
assert.deepEqual(editor.getJSON(), before)
const lostImage = apply({ action: 'patch', patch: [{ id: 'k8', block: { ...pictured[8], text: 'Câu mới mất hình' } }] })
assert.match(lostImage.text, /mất hình/)
assert.deepEqual(editor.getJSON(), before)
const local = applyExamMaintenance(editor, 'Xoá câu 6 và xáo đáp án 4 câu đầu', () => 0.99)
assert.equal(local?.failed, undefined)
assert.match(local?.text ?? '', /xóa câu 6.*4 câu/)
const edited = tipTapToBlocks(editor.getJSON())
const remaining = edited.filter(b => b.type === 'question')
assert.equal(remaining.length, 19)
assert.deepEqual(remaining.map(b => plainText(b.text)), pictured.filter((_, i) => i !== 5).map(b => b.type === 'question' ? plainText(b.text) : ''))
assert.equal(remaining.filter(b => Array.isArray(b.text) && b.text.some(s => s.image?.src === imageSrc)).length, 8)
assert.deepEqual(remaining[4].options, pictured[4].type === 'question' ? pictured[4].options : [])
const editedKey = edited.find(b => b.type === 'answerKey')
assert.deepEqual(editedKey?.items.slice(0, 5).map(it => [it.no, plainText(it.answer)]), [[1, 'D'], [2, 'D'], [3, 'D'], [4, 'D'], [5, 'A']])
const word = buildDocx({ ...emptyDoc(), title: 'Đề ảnh', blocks: edited })
const zipped = await JSZip.loadAsync(await Packer.toBuffer(word))
const documentXml = await zipped.file('word/document.xml')!.async('string')
assert.equal(documentXml.match(/<w:drawing>/g)?.length, 8)
const warned = apply({ action: 'append', blocks: [paragraph('Thêm một dòng')], say: 'Đã thêm.\n\n**Lưu ý:** Kiểm tra lại.', warning: 'Lưu ý: Kiểm tra lại số liệu.' })
assert.equal(warned.text.match(/Lưu ý:/g)?.length, 1)

assert.deepEqual(parseStats('Năm: 2021; 2022; 2023\nLớp 6A: 4; 5; 6'), {
  cats: ['2021', '2022', '2023'], series: [{ name: 'Lớp 6A', vals: [4, 5, 6] }],
})
assert.equal(parseStats('Hà Nội: 4; 5\nHuế: 6; 7').series.length, 2)
editor.destroy()
console.log('test-exam-ai: OK')
