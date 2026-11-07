/**
 * Kiểm tra công cụ "Đường tròn lượng giác" (chạy: npx tsx scripts/check-trig.ts).
 * - Tương thích: SVG của các cấu hình cũ phải giống hệt bản trên nhánh main
 *   (bản cũ được lấy từ env TRIG_OLD_FILE, xem lệnh git show trong README đầu ra).
 * - Các lệnh mới: tô:, đường thẳng y = / x =, nối (tô), cung, M(x; y), values, cot.
 * - Báo lỗi đúng dòng. Quét toàn bộ kho câu hỏi có hình.
 */
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { renderTool, type TrigSpec } from '../src/lib/toolSpec'
import { renderTrigSvg } from '../src/lib/mathExtra'

const BẢN_CŨ = process.env.TRIG_OLD_FILE
if (BẢN_CŨ) {
  const cũ = (await import(pathToFileURL(BẢN_CŨ).href)) as typeof import('../src/lib/mathExtra')
  const desc = '<desc>x</desc>'
  const cũSpecs: TrigSpec[] = [
    { angles: 'pi/3', projections: false, tan: false },
    { angles: 'M: pi/3', projections: true, tan: false },
    { angles: 'π/4 + kπ/2', projections: true, tan: true },
    { angles: 'x = π/3 + kπ', projections: false, tan: false },
    { angles: '150°', projections: true, tan: true },
  ]
  for (const s of cũSpecs) assert.equal(renderTrigSvg(s, desc).svg, cũ.renderTrigSvg(s, desc).svg, `SVG khác bản cũ: ${s.angles}`)
  console.log(`✓ Tương thích: ${cũSpecs.length} cấu hình cũ ra SVG y hệt bản main`)
}

// các ca cũ qua renderTool (pipeline đầy đủ)
for (const angles of ['pi/3', 'M: pi/3', 'π/4 + kπ/2', 'x = π/3 + kπ'])
  assert.ok(renderTool({ kind: 'trig', spec: { angles, projections: true, tan: false } }).svg.includes('<svg'), angles)

// 1. values: ghi giá trị đẹp trên trục, gộp nhãn trùng
{
  const img = renderTool({ kind: 'trig', spec: { angles: 'M: pi/6\nN: 5pi/6\ntô: [pi/6 → 5pi/6]\ny = 1/2', projections: true, tan: false, values: true } })
  assert.ok(img.svg.includes('stroke="#c0392b" stroke-width="4"'), 'tô: cung đậm đỏ')
  assert.ok(img.svg.includes('>√3/2<') && img.svg.includes('>−√3/2<'), 'values: √3/2 và −√3/2')
  assert.ok(img.svg.includes('>1/2<'), 'y = 1/2 ghi nhãn 1/2 ở trục sin')
  assert.equal(img.svg.match(/r="4\.5"/g)!.length, 2, 'tô: đúng 2 chấm đầu mút (ngoặc ] [ → chấm đặc)')
  // đầu mút không lấy ( ) → chấm rỗng
  assert.ok(renderTool({ kind: 'trig', spec: { angles: 'tô: [pi/6 → 5pi/6)', projections: false, tan: false } }).svg.includes('fill="#fff" stroke="#c0392b"'), 'tô: chấm rỗng ở đầu không lấy')
}
{
  // gộp nhãn trùng: họ π/3 + kπ/3 chỉ cho 4 nhãn cos khác biệt
  const img = renderTool({ kind: 'trig', spec: { angles: 'π/3 + kπ/3', projections: true, tan: false, values: true } })
  assert.equal(img.svg.match(/>1\/2</g)?.length, 1, 'gộp nhãn trùng 1/2')
  assert.ok(img.svg.includes('>−1/2<') && img.svg.includes('>1<') && img.svg.includes('>−1<'), 'values: các giá trị của lục giác')
}
// 2. cot: trục ngang y = 1, nhãn cot, nét đứt tới trục
{
  const img = renderTool({ kind: 'trig', spec: { angles: 'M: pi/4', projections: true, tan: true, cot: true } })
  assert.ok(img.svg.includes('>cot</text>'), 'nhãn cot')
  assert.ok(img.svg.includes(`M58 50H338`), 'trục cot từ trái qua phải qua y = 1')
  assert.ok(img.svg.includes(`L280 50`), 'nét đứt nối M tới trục cot tại tan giao cot (280; 50)')
}
// 3. nối tô: họ — lục giác khép kín có nền nhạt
{
  const img = renderTool({ kind: 'trig', spec: { angles: 'π/3 + kπ/3\nnối tô: họ', projections: false, tan: false } })
  assert.ok(img.svg.includes('fill="#1f5fbf" fill-opacity="0.08"'), 'nối tô: nền nhạt')
  assert.ok(img.svg.match(/M[\d.]+ [\d.]+L[\d.]+/), 'nối: đường nối các điểm')
  assert.ok(img.svg.split('Z"').length >= 2, 'nối: khép kín (Z)')
}
// 4. đường thẳng y = / x = — chấm 2 giao điểm, không nhầm với họ nghiệm
{
  const img = renderTool({ kind: 'trig', spec: { angles: 'y = 1/2\nx = -√2/2\nx = π/3 + kπ', projections: false, tan: false } })
  assert.ok(img.svg.match(/r="2\.5"/g)!.length === 4, 'chấm 4 giao điểm (2 cho mỗi đường)')
  assert.ok(img.svg.includes('>−√2/2<') && img.svg.includes('>1/2<'), 'nhãn giá trị ở đầu đường')
  assert.equal(img.svg.match(/r="3\.2"/g)?.length, 2, 'x = π/3 + kπ vẫn là họ nghiệm 2 điểm')
}
// 5. cung giữa hai điểm có tên, nhãn phía ngoài
{
  const img = renderTool({ kind: 'trig', spec: { angles: 'M: pi/4\nN: 3pi/4\ncung: M N "π/2"', projections: false, tan: false } })
  assert.ok(img.svg.match(/marker-end="url\(#mxarr\)"/g)!.length === 3, 'cung: mũi tên ở N (2 của trục + 1 của cung)')
  assert.ok(img.svg.includes('>π/2</text>'), 'cung: nhãn ở giữa cung')
}
// 6. điểm theo toạ độ: đúng chỗ, lệch quá 0,02 thì vẫn vẽ + báo lỗi dòng
{
  const img = renderTool({ kind: 'trig', spec: { angles: 'M(1/2; √3/2)\nN(0,6; 0,6)', projections: true, tan: false } })
  assert.equal(img.errors?.length, 1, 'toạ độ lệch: báo 1 lỗi')
  assert.equal(img.errors?.[0].line, 2, 'báo đúng dòng 2')
  assert.ok(img.errors?.[0].msg.includes('không nằm trên đường tròn đơn vị'), 'nội dung lỗi')
  assert.ok(img.svg.includes('>M</text>') && img.svg.includes('>N</text>'), 'hai điểm có tên')
}
// 7. cú pháp không dấu, chữ hoa thường: TO:, NOI TO:, DEN
assert.ok(renderTool({ kind: 'trig', spec: { angles: 'M: pi/6\nN: 5pi/6\nto: (pi/6 den 5pi/6)', projections: false, tan: false } }).svg.includes('#c0392b'), 'to: … den … (không dấu)')
assert.ok(renderTool({ kind: 'trig', spec: { angles: 'π/3 + kπ/3\nNOI TO: HO', projections: false, tan: false } }).svg.includes('#1f5fbf'), 'NOI TO: HO (không dấu, hoa)')

// 8. báo lỗi chỉ đúng dòng và gõ thế nào
const lỗi = (angles: string) => {
  try {
    renderTool({ kind: 'trig', spec: { angles, projections: false, tan: false } })
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
  return '(không lỗi)'
}
assert.match(lỗi('tô: π/6'), /^Dòng 1 "tô: π\/6": cần dạng tô: π\/6 → 5π\/6/, 'tô thiếu mũi tên')
assert.match(lỗi('M: pi/3\nnối: X Y'), /Dòng 2 "nối: X Y": điểm "X" chưa khai báo/, 'nối điểm lạ')
assert.match(lỗi('y = π/3'), /Dòng 1 "y = π\/3": cần dạng y = 1\/2/, 'y = góc')
assert.match(lỗi('tô: π/6 π/2'), /^Dòng 1 "tô: π\/6 π\/2": cần dạng/, 'tô cách nhau bởi dấu cách')
assert.match(lỗi('cung: M'), /cần dạng cung: M N/, 'cung thiếu điểm')
console.log('✓ Đường tròn lượng giác: đạt hết các ca kiểm tra')
// Quét kho câu hỏi (các module nạp auth.ts cần import.meta.env) chạy trong trình duyệt,
// xem mục "Kiểm tra" trong docs/prompt-trig-7-tinh-nang.md.
