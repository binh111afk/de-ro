/**
 * Test round-trip converter: blocksToTipTap ⇄ tipTapToBlocks.
 * Chạy: npx tsx scripts/test-convert.mjs
 */
import { blocksToTipTap, tipTapToBlocks } from '../src/examEditor/convert.ts'
import assert from 'node:assert/strict'

const cases = [
  {
    name: 'marks giữ nguyên khi round-trip',
    blocks: [
      {
        type: 'paragraph',
        text: [
          { text: 'Đậm ', marks: [{ type: 'bold' }] },
          { text: 'nghiêng ', marks: [{ type: 'italic' }] },
          { text: 'thường' },
        ],
      },
    ],
  },
  {
    name: 'answerKey items không mất',
    blocks: [
      {
        type: 'answerKey',
        items: [
          { no: 1, answer: 'A' },
          { no: 2, answer: [{ text: 'B', marks: [{ type: 'bold' }] }] },
        ],
      },
    ],
  },
  {
    name: 'header trái/phải ghép lại thành 1 block',
    blocks: [{ type: 'header', left: 'TRƯỜNG THCS X', right: 'ĐỀ THI GIỮA KỲ' }],
  },
  {
    name: 'format attrs giữ nguyên',
    blocks: [
      {
        type: 'paragraph',
        text: 'Đoạn căn giữa',
        format: { align: 'center', lineHeight: 1.5, indentLeft: 24, spaceBefore: 6, spaceAfter: 6, borders: 'box', shading: '#fff2cc' },
      },
    ],
  },
  {
    name: 'question + options rich text',
    blocks: [
      {
        type: 'question',
        no: 1,
        text: [{ text: 'Câu hỏi ' }, { text: 'đậm', marks: [{ type: 'bold' }] }],
        options: [
          { label: 'A', text: 'Phương án 1' },
          { label: 'B', text: [{ text: 'Phương án 2', marks: [{ type: 'underline' }] }] },
        ],
      },
    ],
  },
  {
    name: 'màu chữ + màu tô sáng giữ attrs khi round-trip',
    blocks: [
      {
        type: 'paragraph',
        text: [
          { text: 'đỏ', marks: [{ type: 'textStyle', attrs: { color: '#ff0000' } }] },
          { text: ' và ' },
          { text: 'vàng', marks: [{ type: 'highlight', attrs: { color: '#ffff00' } }] },
        ],
      },
    ],
  },
  {
    name: 'lưới nhiều cột giữ số cột và nội dung ô',
    blocks: [
      {
        type: 'grid',
        cols: 3,
        cells: ['Cột một', [{ text: 'Cột hai', marks: [{ type: 'bold' }] }], 'Cột ba'],
      },
    ],
  },
  {
    name: 'đầu đề 2 cột: mỗi dòng thành một paragraph',
    blocks: [
      { type: 'header', left: 'SỞ GIÁO DỤC\nTỈNH …', right: 'KỲ THI …\nMôn thi: Toán' },
    ],
  },
  {
    name: 'đầu đề: mark boxed giữ nguyên',
    blocks: [
      {
        type: 'header',
        left: [{ text: 'ĐỀ CHÍNH THỨC', marks: [{ type: 'boxed' }] }],
        right: '',
      },
    ],
  },
  {
    name: 'đầu đề: mảng trộn string + span không vỡ',
    // AI đôi khi trả dạng này; chỉ cần không throw (round-trip sẽ chuẩn hoá).
    noThrow: true,
    blocks: [
      {
        type: 'header',
        left: ['SỞ GIÁO DỤC VÀ ĐÀO TẠO …\n', { text: 'Đề chính thức', marks: [{ type: 'boxed' }] }],
        right: '',
      },
    ],
  },
  {
    name: 'công thức $...$ thành node Toán và round-trip giữ nguyên',
    blocks: [
      {
        type: 'paragraph',
        text: 'Cho $x^2 + 1$ và $\\frac{a}{b}$ cùng $\\sqrt{2}$.',
      },
    ],
  },
  {
    name: 'công thức trong span có marks vẫn giữ marks khi round-trip',
    blocks: [
      {
        type: 'paragraph',
        text: [
          { text: 'Đáp án ', marks: [{ type: 'bold' }] },
          { text: '$x = 3$', marks: [{ type: 'italic' }] },
        ],
      },
    ],
  },
]

let pass = 0
let fail = 0

for (const c of cases) {
  try {
    const tipTap = blocksToTipTap(c.blocks)
    if (c.noThrow) {
      console.log(`✅ ${c.name}`)
      pass++
      continue
    }
    const round = tipTapToBlocks(tipTap)
    assert.deepEqual(round, c.blocks, `round-trip mismatch: ${JSON.stringify(round)}`)
    console.log(`✅ ${c.name}`)
    pass++
  } catch (err) {
    console.error(`❌ ${c.name}`)
    console.error('   ', err.message)
    fail++
  }
}

console.log(`\n${pass}/${cases.length} pass, ${fail} fail`)
process.exit(fail > 0 ? 1 : 0)
