/**
 * Test typography engine (chặng 1):
 *  - công thức đo chiều cao khối chữ
 *  - fitFontSize: co vừa hộp, không phóng to, sàn 60%
 *  - bất biến trên cả 19 layout: chữ do layout dựng ra phải nằm trong hộp
 *    (hoặc đã chạm sàn), để editor/thumbnail/PPTX dùng chung một cỡ.
 * Chạy: npm run test:slide-measure
 */
import assert from 'node:assert/strict'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'
import { SLIDE_LAYOUTS, composeLayout } from '../src/lib/slideLayouts.ts'
import { MIN_FIT_SCALE, fitFontSize, textBoxHeight } from '../src/lib/slideMeasure.ts'

let passed = 0
const check = (name, fn) => {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (err) {
    console.error(`  ✗ ${name}`)
    throw err
  }
}

console.log('\n[1] textBoxHeight')

check('rỗng → 0', () => {
  assert.equal(textBoxHeight('', 50, 3), 0)
  assert.equal(textBoxHeight('   ', 50, 3), 0)
})

check('nhiều chữ → cao hơn', () => {
  const one = textBoxHeight('Một dòng', 60, 3, 1.4)
  const many = textBoxHeight('Một dòng\nHai dòng\nBa dòng', 60, 3, 1.4)
  assert.ok(many > one)
})

check('hộp hẹp → cần nhiều dòng hơn', () => {
  const text = 'Một câu khá dài để phải xuống dòng khi hộp hẹp lại'
  assert.ok(textBoxHeight(text, 30, 3, 1.4) > textBoxHeight(text, 80, 3, 1.4))
})

check('chữ to → cao hơn', () => {
  assert.ok(textBoxHeight('Nội dung', 50, 4, 1.4) > textBoxHeight('Nội dung', 50, 2, 1.4))
})

console.log('\n[2] fitFontSize')

check('chữ ngắn giữ nguyên cỡ gốc (không phóng to)', () => {
  const size = fitFontSize({ text: 'Ba ý ngắn', widthPct: 56, heightPct: 40, baseCqw: 3.2 })
  assert.equal(size, 3.2)
})

check('chữ dài bị co nhưng không dưới sàn', () => {
  const text = Array.from({ length: 8 }, (_, i) => `Ý số ${i + 1} viết khá dài để chắc chắn phải xuống dòng`).join('\n')
  const size = fitFontSize({ text, widthPct: 50, heightPct: 30, baseCqw: 3.2 })
  assert.ok(size < 3.2, 'phải co xuống')
  assert.ok(size >= 3.2 * MIN_FIT_SCALE - 0.001, 'không dưới sàn 60%')
  assert.ok(textBoxHeight(text, 50, size, 1.4) <= 30 + 0.1 || size === Math.round(3.2 * MIN_FIT_SCALE * 100) / 100)
})

check('kết quả ổn định (cùng input → cùng output)', () => {
  const opts = { text: 'Nội dung dài '.repeat(12), widthPct: 46, heightPct: 22, baseCqw: 2.8 }
  assert.equal(fitFontSize(opts), fitFontSize(opts))
})

console.log('\n[3] bất biến 19 layout: chữ nằm trong hộp')

const theme = DECK_THEMES[0]
const stress = {
  title: 'Tổng quan về hàm số bậc hai và ứng dụng trong thực tiễn đời sống',
  kicker: 'CHƯƠNG TRÌNH TOÁN LỚP 10',
  subtitle: 'Định nghĩa, đồ thị, sự biến thiên và các bài toán ứng dụng thường gặp trong đề thi',
  body:
    'Hàm số bậc hai có dạng y = ax² + bx + c với a ≠ 0. Đồ thị là một parabol có trục đối xứng ' +
    'x = −b/2a và đỉnh I(−b/2a; −Δ/4a). Khi a > 0 parabol bề lõm hướng lên, hàm số nghịch biến ' +
    'trên khoảng (−∞; −b/2a) và đồng biến trên khoảng (−b/2a; +∞).',
  bullets: [
    'Định nghĩa hàm số bậc hai và điều kiện a khác 0 trong chương trình lớp 10',
    'Cách xác định toạ độ đỉnh, trục đối xứng và hướng bề lõm của parabol',
    'Lập bảng biến thiên và vẽ đồ thị hàm số bậc hai một cách chính xác',
    'Ứng dụng vào bài toán tìm giá trị lớn nhất, nhỏ nhất trong thực tế',
  ],
  items: [
    'Định nghĩa: hàm số có dạng y = ax² + bx + c với a khác 0',
    'Đồ thị: parabol nhận đường thẳng x = −b/2a làm trục đối xứng',
    'Đỉnh: điểm I có toạ độ (−b/2a; −Δ/4a) là điểm cao nhất hoặc thấp nhất',
    'Biến thiên: phụ thuộc dấu của hệ số a và khoảng giá trị của x',
    'Bảng biến thiên: tóm tắt chiều biến thiên và giá trị cực trị',
    'Ứng dụng: giải bài toán tối ưu và mô hình hoá tình huống thực tế',
  ],
  left: ['Tập xác định là toàn bộ trục số thực', 'Đồ thị luôn là một parabol', 'Có một điểm cực trị duy nhất'],
  right: ['Có thể có hai nghiệm phân biệt', 'Có thể vô nghiệm trên tập số thực', 'Giá trị nhỏ nhất phụ thuộc dấu a'],
  leftTitle: 'Tính chất cơ bản',
  rightTitle: 'Lưu ý khi giải toán',
  quote: 'Toán học là môn thể thao trí tuệ, nơi mỗi bài toán là một sân chơi để rèn luyện tư duy logic và sự kiên nhẫn.',
  author: 'Giáo viên bộ môn Toán — Trường THPT Nguyễn Du',
  rows: [
    ['Đại lượng', 'Công thức', 'Ý nghĩa', 'Ghi chú'],
    ['Toạ độ đỉnh', 'x = −b/2a', 'Trục đối xứng của parabol', 'Bắt buộc nhớ'],
    ['Giá trị đỉnh', 'y = −Δ/4a', 'Giá trị lớn nhất hoặc nhỏ nhất', 'Tuỳ dấu a'],
    ['Delta', 'Δ = b² − 4ac', 'Quyết định số nghiệm', 'Δ ≥ 0 có nghiệm'],
    ['Nghiệm', 'x = (−b ± √Δ)/2a', 'Giao điểm với trục hoành', 'Kiểm tra lại'],
    ['Hướng lõm', 'a > 0 hướng lên', 'Quyết định chiều biến thiên', 'a < 0 hướng xuống'],
  ],
  stats: [
    { value: '1.234.567', label: 'Tỉ lệ học sinh đạt điểm khá giỏi toàn trường' },
    { value: '98,5%', label: 'Số bài kiểm tra đã hoàn thành đúng hạn' },
    { value: '12', label: 'Chuyên đề ôn tập trong học kỳ' },
  ],
  steps: [
    'Xác định hệ số a, b, c từ đề bài đã cho',
    'Tính toạ độ đỉnh và trục đối xứng của parabol',
    'Lập bảng biến thiên và xét dấu hệ số a',
    'Tìm giao điểm với các trục toạ độ',
    'Vẽ đồ thị và kết luận theo yêu cầu',
  ],
  question: 'Cho hàm số y = x² − 4x + 3. Toạ độ đỉnh của parabol là điểm nào dưới đây?',
  options: ['I(2; −1)', 'I(−2; 1)', 'I(1; 2)', 'I(−1; −2)'],
  answer: 0,
}

const offenders = []
for (const layout of SLIDE_LAYOUTS) {
  const elements = composeLayout(theme, layout.id, stress)
  for (const el of elements) {
    if (el.type !== 'text' || !el.text) continue
    const needed = textBoxHeight(el.text, el.w, el.fontSize ?? 2.6, el.lineHeight ?? 1.4)
    if (needed > el.h + 0.15) {
      offenders.push({ layout: layout.id, id: el.id, needed, h: el.h, fontSize: el.fontSize })
    }
  }
}

check('19 layout không có hộp chữ nào tràn (dung sai 0,15%)', () => {
  assert.deepEqual(offenders, [])
})

check('layout ngắn giữ đúng cỡ thiết kế (bullets 3 ý = 3.25cqw)', () => {
  const elements = composeLayout(theme, 'bullets', {
    title: 'Ba ý ngắn',
    bullets: ['Ý một', 'Ý hai', 'Ý ba'],
  })
  const bullets = elements.find((el) => el.id === 'bullets')
  assert.ok(bullets)
  assert.equal(bullets.fontSize, 3.25)
})

console.log(`\n${passed} nhóm test pass.`)
