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
]

let pass = 0
let fail = 0

for (const c of cases) {
  try {
    const tipTap = blocksToTipTap(c.blocks)
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
