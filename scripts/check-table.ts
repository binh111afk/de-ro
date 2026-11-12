/**
 * Kiểm tra công cụ "Tạo bảng" (chạy: npx tsx scripts/check-table.ts).
 */
import assert from 'node:assert/strict'
import { TABLE_DEFAULT, parseCells, parseMerges, type TableSpec } from '../src/lib/table'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'

// 1. Bảng mặc định 3x4 có hàng tiêu đề + đọc lại spec từ SVG
const defGrid = parseCells(TABLE_DEFAULT.cells)
assert.equal(defGrid.rows, 3, 'mặc định 3 hàng')
assert.equal(defGrid.cols, 4, 'mặc định 4 cột')
const defImg = renderTool({ kind: 'table', spec: TABLE_DEFAULT })
assert.ok(defImg.svg.includes('<svg'), 'SVG hợp lệ')
assert.ok(defImg.svg.includes('baseline-shift="sub"'), 'chỉ số dưới x_1')
assert.ok(defImg.svg.includes('fill="#efefef"'), 'tô nền hàng tiêu đề')
const roundTrip = readToolDoc(defImg.svg)
assert.deepEqual(roundTrip, { kind: 'table', spec: TABLE_DEFAULT }, 'đọc lại đúng spec từ SVG')
console.log('✓ Bảng mặc định 3x4 + round-trip readToolDoc')

// 2. Gộp ô 1,1:1,3 + chỉ số x_1, x^2 + xuống dòng \n trong ô
const mergedSpec: TableSpec = {
  cells: [
    'Bảng tần số lớp 10A | | | Ghi chú',
    'Giá trị x_i | x_1 = 2 | x_2 = 5 | x^2 + 1',
    'Tần số\\n(học sinh) | 4 | 10 | 6',
  ].join('\n'),
  header: 'both',
  align: 'center',
  merges: '1,1:1,3',
  border: 'all',
  fontSize: 15,
}
const mergedImg = renderTool({ kind: 'table', spec: mergedSpec })
assert.ok(mergedImg.svg.includes('<tspan baseline-shift="sub" font-size="70%">1</tspan>'), 'x_1')
assert.ok(mergedImg.svg.includes('<tspan baseline-shift="super" font-size="70%">2</tspan>'), 'x^2')
assert.ok(mergedImg.svg.includes('>Tần số<') && mergedImg.svg.includes('>(học sinh)<'), 'ô xuống dòng')
assert.ok(mergedImg.height > defImg.height, 'hàng có ô 2 dòng phải cao hơn')
// Kiểm tra không có nét dọc c=1,2 bên trong hàng 0 đã gộp (y từ 4 đến 4+rowH[0]), nét dọc bắt đầu từ rowY[1]
const pathMatch = /<path d="([^"]+)"/.exec(mergedImg.svg)
assert.ok(pathMatch, 'có path lưới')
const pathD = pathMatch[1]
// col 0..4: với gộp 1,1:1,3 thì col 0, col 3 (sau 3 ô gộp) và col 4 (biên phải) bắt đầu từ y=4; col 1 và col 2 chỉ bắt đầu từ hàng 2
assert.equal(pathD.match(/ 4V/g)?.length ?? 0, 3, 'chỉ col 0, col 3, col 4 bắt đầu tại y=4 (col 1, col 2 bị bỏ qua ở hàng gộp)')
console.log('✓ Gộp ô 1,1:1,3 + chỉ số x_1, x^2 + ô 2 dòng')

// 3. Các kiểu tiêu đề, căn lề, đường kẻ, cỡ chữ
for (const header of ['none', 'row', 'col', 'both'] as const) {
  const img = renderTool({ kind: 'table', spec: { ...TABLE_DEFAULT, header } })
  const fills = (img.svg.match(/fill="#efefef"/g) ?? []).length
  if (header === 'none') assert.equal(fills, 0)
  if (header === 'row') assert.equal(fills, 4)
  if (header === 'col') assert.equal(fills, 3)
  if (header === 'both') assert.equal(fills, 6)
}
const horizImg = renderTool({ kind: 'table', spec: { ...TABLE_DEFAULT, border: 'horizontal' } })
const horizPath = /<path d="([^"]+)"/.exec(horizImg.svg)?.[1] ?? ''
assert.ok(!horizPath.includes('V'), 'border horizontal không có nét dọc')
const outerImg = renderTool({ kind: 'table', spec: { ...TABLE_DEFAULT, border: 'outer' } })
const outerPath = /<path d="([^"]+)"/.exec(outerImg.svg)?.[1] ?? ''
assert.equal((outerPath.match(/M/g) ?? []).length, 4, 'border outer chỉ có 4 cạnh ngoài')
const leftImg = renderTool({ kind: 'table', spec: { ...TABLE_DEFAULT, align: 'left', fontSize: 18 } })
assert.ok(leftImg.svg.includes('text-anchor="start"') && leftImg.svg.includes('font-size="18"'))
console.log('✓ Tiêu đề (none/row/col/both) + đường kẻ (all/outer/horizontal) + căn lề + cỡ chữ')

// 4. Báo lỗi gộp ô ngoài bảng / chồng nhau / sai cú pháp / ô rỗng
assert.throws(() => parseCells('   \n  '), /Nhập ít nhất một hàng/)
assert.throws(() => parseMerges('1,1:1,5', 3, 4), /vượt ra ngoài bảng/)
assert.throws(() => parseMerges('1,1:4,2', 3, 4), /vượt ra ngoài bảng/)
assert.throws(() => parseMerges('1,1:2,2\n2,2:3,3', 3, 4), /chồng lên vùng/)
assert.throws(() => parseMerges('2,2:1,1', 3, 4), /ô cuối phải nằm sau/)
assert.throws(() => parseMerges('abc', 3, 4), /cần dạng hàng,cột:hàng,cột/)
console.log('✓ Kiểm tra báo lỗi ngoài bảng, chồng nhau, sai cú pháp')
