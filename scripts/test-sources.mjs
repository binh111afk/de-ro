/**
 * Test nguồn cho AI soạn đề: chỉ dùng nguồn giáo viên tự đưa vào, không tự lôi đề đã lưu; rule/prompt nguồn.
 * Chạy: npm run test:sources
 */
import assert from 'node:assert/strict'
import { AiQuotaError } from '../src/lib/llm.ts'
import { emptyDoc } from '../src/data/docTypes.ts'
import { useDocStore } from '../src/store/docs.ts'
import { buildSourcePack, docxBlocksToSourceText, isDocx, pdfTextNeedsVision, readVisionPages, sourcePrompt, sourceRule } from '../src/lib/sources.ts'

const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
assert.equal(isDocx('Tệp.DOCX'), true)
assert.equal(isDocx('Tệp', docxMime), true)
assert.equal(isDocx('Tệp.doc', 'application/msword'), false)
assert.deepEqual(docxBlocksToSourceText([
  { type: 'heading', text: 'Phần I. Trắc nghiệm' },
  {
    type: 'question',
    no: 3,
    text: [{ text: 'Nghiệm của phương trình ' }, { text: String.raw`$\cos x = \cos\frac{\pi}{5}$` }, { text: ' là' }],
    options: [
      { label: 'A', text: [{ text: String.raw`$x = \frac{\pi}{5}$`, marks: [{ type: 'bold' }] }] },
      { label: 'B', text: '$x = 0$' },
      { label: 'C', text: '$x = 1$' },
      { label: 'D', text: '$x = 2$' },
    ],
  },
  { type: 'table', rows: [[{ text: 'Đại lượng\nđo' }, { text: 'Giá trị' }], [{ text: '$x$' }, { text: [{ text: '$2^3$' }] }]] },
  { type: 'paragraph', text: [{ text: 'Xem hình: ' }, { text: '', image: { src: 'data:image/png;base64,AA==' } }, { text: ' Tính $y$.' }] },
  { type: 'paragraph', text: [{ text: '', image: { src: '' } }] },
]), {
  text: String.raw`Phần I. Trắc nghiệm
Câu 3. Nghiệm của phương trình $\cos x = \cos\frac{\pi}{5}$ là
A. $x = \frac{\pi}{5}$
B. $x = 0$
C. $x = 1$
D. $x = 2$
Đại lượng đo | Giá trị
$x$ | $2^3$
Xem hình:
[Hình]
Tính $y$.
[Hình]`,
  imageCount: 2,
})
console.log('✅ DOCX giữ LaTeX, số câu, đề mục, thứ tự phương án, hàng bảng và vị trí hình')

const brokenPdfText = `S Ở GIÁO D ỤC VÀ ĐÀO TẠ O
Câu 1: [MAP] Cho hình chóp S.ABC có c ạ nh bên SA vuông góc v ới đáy ( ABC) . Góc t ạ o b ở i SC và
Câu 3: [MAP] Cho hàm s ố = y f (x) xác đị nh và liên t ụ c trên − [ ; ] 2 2 và có đồ th ị là đườ ng cong
trong hình v ẽ bên. Hàm s ố f (x) đạ t c ự c ti ể u t ại điể m
A. = x 2 . B. ( ; ) 1 4 . C. = − x 1 . D. = x 1 .
Câu 4: [MAP] Cho hình h ộ p ch ữ nh ậ t ABCD.A'B'C'D' . Kh ẳng định nào dưới đây là đúng?
A.   = AB D C
 . B.   = AD A C`
assert.equal(pdfTextNeedsVision(brokenPdfText), true)
assert.equal(pdfTextNeedsVision('Hà Nội là thủ đô của Việt Nam. Thành phố nằm bên bờ sông Hồng và có lịch sử hơn một nghìn năm. Mỗi mùa thu, hàng nghìn du khách đến đây để thưởng thức cốm và ngắm hoa sữa nở.'), false)
assert.equal(pdfTextNeedsVision(''), false)
assert.equal(pdfTextNeedsVision('Cho hình lập phương ABCD.\nx\ny\n+'), true)
assert.equal(pdfTextNeedsVision('Quan sát sơ đồ bên dưới và cho biết chiều dòng điện.'), true)
assert.equal(pdfTextNeedsVision('Viết phương trình: H₂ + O₂ → H₂O.'), true)
console.log('✅ nhận diện chữ PDF tách hỏng, hình và công thức')

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
  assert.equal(capped.warning, 'Chỉ đọc 12/17 trang đầu, bỏ 5 trang cuối.')
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

  const brokenDocx = new File(['Tệp Word cũ'], 'Tệp hỏng.DOCX')
  const libraryName = 'Tệp Word trong kho'
  textRequests.length = 0
  globalThis.fetch = async (url) => {
    textRequests.push(url)
    if (url === '/api/files/word') return new Response(brokenDocx)
    return Response.json({ text: 'Chữ dự phòng' })
  }
  const fallback = await buildSourcePack(
    [{ name: brokenDocx.name, kind: 'doc', file: brokenDocx }],
    [{ kind: 'library', id: 'word', name: libraryName, mime: docxMime, url: '/api/files/word' }],
  )
  assert.deepEqual(fallback.items.map((item) => item.text), ['Chữ dự phòng', 'Chữ dự phòng'])
  assert.deepEqual(fallback.warnings, [libraryName, brokenDocx.name].map((name) => `${name}: dùng bản tách chữ, có thể thiếu công thức và hình.`))
  assert.deepEqual(textRequests, ['/api/files/word', '/api/extract', '/api/extract'])
  console.log('✅ DOCX lỗi ở cả hai nguồn dùng bộ tách chữ dự phòng và có cảnh báo')
} finally {
  globalThis.fetch = originalFetch
  globalThis.FileReader = originalFileReader
}

const png = new File(['ảnh'], 'Đề.png', { type: 'image/png' })
const imageProgress = []
Object.assign(globalThis, {
  createImageBitmap: async () => ({ width: 2000, height: 1000, close() {} }),
  document: { createElement: () => ({
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toDataURL() {
      assert.equal(this.width, 1600)
      assert.equal(this.height, 800)
      return 'data:image/jpeg;base64,AA=='
    },
  }) },
  fetch: async (url, init) => {
    assert.equal(url, '/api/extract?vision=1')
    assert.equal(JSON.parse(init.body).images.length, 1)
    return Response.json({ text: 'Bài 1. Tính diện tích.' })
  },
})
try {
  const files = [{ kind: 'image', name: png.name, file: png }]
  const pack = await buildSourcePack(files, [], { onProgress: (message) => imageProgress.push(message) })
  assert.equal(pack.items[0].text, 'Bài 1. Tính diện tích.')
  assert.match(imageProgress[0], /tốn thêm điểm/)
  globalThis.fetch = async () => Response.json({ error: 'Không đọc được ảnh.' }, { status: 502 })
  const unreadable = await buildSourcePack(files)
  assert.equal(unreadable.tier, 0)
  assert.deepEqual(unreadable.warnings, ['Đề.png: Không đọc được ảnh.'])
} finally {
  globalThis.fetch = originalFetch
  delete globalThis.document
  delete globalThis.createImageBitmap
}

console.log('\nNguồn tệp và ảnh đều qua')
