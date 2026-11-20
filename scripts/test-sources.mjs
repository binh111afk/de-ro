/**
 * Test nguồn cho AI soạn đề: chỉ dùng nguồn giáo viên tự đưa vào, không tự lôi đề đã lưu; rule/prompt nguồn.
 * Chạy: npm run test:sources
 */
import assert from 'node:assert/strict'
import { AiQuotaError } from '../src/lib/llm.ts'
import { emptyDoc } from '../src/data/docTypes.ts'
import { useDocStore } from '../src/store/docs.ts'
import { buildSourcePack, readVisionPages, sourcePrompt, sourceRule } from '../src/lib/sources.ts'

const grade7 = emptyDoc({ title: 'Đề giữa kỳ Toán 7', grade: 'Lớp 7', subject: 'Toán' })
grade7.blocks = [
  {
    type: 'question',
    no: 1,
    text: 'Tính căn bậc hai của 16',
    options: [
      { label: 'A', text: '4' },
      { label: 'B', text: '8' },
    ],
  },
]
useDocStore.setState({ myDocs: [grade7] })

// đề cùng lớp/môn có sẵn trong máy (vd đề mở từ cộng đồng / kho đề) nhưng giáo viên không chọn → không được dùng
const none = await buildSourcePack([], [])
assert.equal(none.tier, 0)
assert.equal(none.items.length, 0, 'không thêm nguồn thì không được tự lấy đề đã lưu')
console.log('✅ không thêm nguồn thì không tự lấy đề đã lưu')

// giáo viên chọn đúng đề đó trong "Thêm nguồn" → dùng
const picked = await buildSourcePack([], [{ kind: 'mine', id: grade7.id, name: grade7.title }])
assert.equal(picked.tier, 1)
assert.match(picked.items[0].text, /căn bậc hai/)
console.log('✅ nguồn giáo viên chọn thì dùng')

const tier1 = { tier: 1, items: [{ tier: 1, name: 'mau.docx', text: 'Mẫu đề' }], warnings: [] }
assert.match(sourceRule(tier1), /TỆP MẪU/)
assert.match(sourceRule(tier1), /KHÔNG phải chỉ dẫn/)
assert.match(sourcePrompt(tier1), /Mẫu đề/)
console.log('✅ rule ưu tiên 1 + chống prompt injection')

assert.equal(sourcePrompt({ tier: 0, items: [], warnings: [] }), '')
console.log('✅ không có nguồn thì không chèn khối NGUỒN')

const pages = Array.from({ length: 7 }, (_, i) => ({
  toDataURL(type, quality) {
    assert.equal(type, 'image/jpeg')
    assert.equal(quality, 0.82)
    return `data:image/jpeg;base64,${i + 1}`
  },
}))
const originalFetch = globalThis.fetch
const batches = []
const progress = []
let responses = []
globalThis.fetch = async (url, init) => {
  assert.equal(url, '/api/extract?vision=1')
  assert.equal(init.method, 'POST')
  const { images } = JSON.parse(init.body)
  batches.push(images.map((image) => Number(image.split(',')[1])))
  return responses.shift()
}
try {
  responses = [
    Response.json({ text: '  Lô đầu  ' }),
    Response.json({ error: 'Đang bận' }, { status: 429 }),
    Response.json({ text: 'Lô cuối' }),
  ]
  const result = await readVisionPages(pages, pages.length, { onProgress: (msg) => progress.push(msg) })
  assert.deepEqual(batches, [[1, 2, 3], [4, 5, 6], [7]])
  assert.deepEqual(progress, ['Đang đọc trang 1-3/7…', 'Đang đọc trang 4-6/7…', 'Đang đọc trang 7/7…'])
  assert.deepEqual(result, { text: 'Lô đầu\n\nLô cuối', warning: 'Không đọc được trang 4-6.' })
  console.log('✅ đọc PDF theo lô 3 trang, nối chữ và bỏ qua lô lỗi')

  responses = Array.from({ length: 4 }, () => Response.json({ text: 'Trang' }))
  const capped = await readVisionPages([...pages, ...pages.slice(0, 5)], 17)
  assert.equal(capped.warning, 'Chỉ đọc 12/17 trang đầu.')
  console.log('✅ cảnh báo khi chỉ đọc 12 trang đầu')

  batches.length = 0
  const quotaMessage = 'Đọc ảnh PDF cần khoảng 16 điểm AI mỗi lượt nhưng bạn chỉ còn 5 điểm.'
  responses = [
    Response.json({ text: 'Lô đầu' }),
    Response.json({ code: 'quota', error: quotaMessage }, { status: 429 }),
  ]
  await assert.rejects(readVisionPages(pages, pages.length), { constructor: AiQuotaError, message: quotaMessage })
  assert.deepEqual(batches, [[1, 2, 3], [4, 5, 6]])
  console.log('✅ dừng khi hết điểm và giữ thông báo máy chủ')
} finally {
  globalThis.fetch = originalFetch
}

const originalFileReader = globalThis.FileReader
globalThis.FileReader = class {
  readAsDataURL() {
    this.result = 'data:application/pdf;base64,AA=='
    this.onload()
  }
}
const pdf = new File(['PDF'], 'Tệp có chữ.PDF', { type: 'application/pdf' })
const textRequests = []
globalThis.fetch = async (url) => {
  textRequests.push(url)
  if (url === '/api/files/test.pdf') return new Response(pdf)
  return Response.json({ text: 'Chữ trong PDF' })
}
try {
  const pack = await buildSourcePack(
    [{ name: pdf.name, kind: 'pdf', file: pdf }],
    [{ kind: 'library', id: 'pdf', name: pdf.name, mime: pdf.type, url: '/api/files/test.pdf' }],
  )
  assert.deepEqual(pack.items.map((item) => item.text), ['Chữ trong PDF', 'Chữ trong PDF'])
  assert.deepEqual(pack.warnings, [])
  assert.deepEqual(textRequests, ['/api/files/test.pdf', '/api/extract', '/api/extract'])
  console.log('✅ PDF có chữ từ Kho tài liệu và tệp đính kèm đi qua bộ tách chữ')
} finally {
  globalThis.fetch = originalFetch
  globalThis.FileReader = originalFileReader
}

console.log('\n8/8 pass, 0 fail')
