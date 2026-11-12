/**
 * Kiểm tra nâng cấp Hình học phẳng: toạ độ, mẫu Tự do, nhãn cạnh, kích thước,
 * kéo dài, chỉnh cạnh (hít/gióng) và cập nhật/đặt lại dòng toạ độ.
 * Chạy: npx tsx scripts/check-geo-free.ts
 */
import assert from 'node:assert/strict'
import { construct, extractCoords } from '../src/lib/geoConstruct'
import { renderGeo2dSvg, renderGeo3dSvg, type Geo2dSpec } from '../src/lib/geometry'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'
import {
  fitCoordTransform,
  hasDragCoords,
  resetDragCoords,
  savePointCoord,
  snapDragPoint,
} from '../src/examEditor/tools/edgeSnap'

// 1. Hình mẫu bài toán thực tế trên mẫu "Tự do"
const sampleExtras = [
  'A(0; 4)',
  'B(0; 0)',
  'C(7; 0)',
  'M(2,5; 0)',
  'AB, AM',
  'đường BC kéo dài',
  'vuông B A C',
  'nhãn AB "4 km"',
  'kích thước BC "7 km"',
].join('\n')

const sampleSpec: Geo2dSpec = {
  shape: 'free',
  names: [],
  altitude: false,
  median: false,
  diagonals: false,
  circumcircle: false,
  marks: true,
  extras: sampleExtras,
}

const sampleImg = renderTool({ kind: 'geo2d', spec: sampleSpec })
assert.equal(sampleImg.errors?.length ?? 0, 0, 'hình mẫu không có lỗi')
assert.ok(sampleImg.svg.includes('<svg'), 'SVG hợp lệ')
assert.ok(sampleImg.svg.includes('data-lbl="seg:AB"'), 'nhãn AB gắn data-lbl="seg:AB"')
assert.ok(sampleImg.svg.includes('>4 km</text>'), 'hiện nhãn 4 km')
assert.ok(sampleImg.svg.includes('data-lbl="dim:BC"'), 'kích thước BC gắn data-lbl="dim:BC"')
assert.ok(sampleImg.svg.includes('>7 km</text>'), 'hiện nhãn 7 km')
assert.ok(sampleImg.svg.includes('stroke-dasharray="5 4"'), 'đường kích thước nét đứt')
assert.ok(sampleImg.svg.includes('marker-start="url(#geo-dim-arr)"'), 'mũi tên đầu đường kích thước')
assert.ok(sampleImg.svg.includes('marker-end="url(#geo-dim-arr)"'), 'mũi tên cuối đường kích thước')

const pick = sampleImg.pick!
const pt = (n: string) => pick.points.find((p) => p.name === n)!
assert.deepEqual(pt('A').v, [0, 4])
assert.deepEqual(pt('B').v, [0, 0])
assert.deepEqual(pt('C').v, [7, 0])
assert.deepEqual(pt('M').v, [2.5, 0])
assert.ok(pt('A').y < pt('B').y, 'trục y hướng lên nên A nằm cao hơn B trên màn hình')
assert.ok(Math.abs(pt('B').y - pt('C').y) < 0.1, 'B và C nằm ngang')
assert.deepEqual(new Set(pick.origins), new Set(['A', 'B', 'C', 'M']), 'điểm gốc gồm A, B, C, M')
assert.ok(pick.segs.some((s) => (s.a === 'B' && s.b === 'C') || (s.a === 'C' && s.b === 'B')), 'đường kéo dài cũng tham gia danh sách cạnh')

const rt = readToolDoc(sampleImg.svg)
assert.deepEqual(rt, { kind: 'geo2d', spec: sampleSpec }, 'round-trip readToolDoc đúng spec')
console.log('✓ Hình mẫu Tự do + nhãn cạnh + kích thước + kéo dài + round-trip')

// 2. Mẫu Tự do trang trắng + các biến thể cú pháp toạ độ + ghi đè đỉnh mẫu
const blankImg = renderTool({
  kind: 'geo2d',
  spec: { shape: 'free', names: [], altitude: false, median: false, diagonals: false, circumcircle: false, marks: true },
})
assert.equal(blankImg.errors?.length ?? 0, 0)
assert.ok(blankImg.svg.includes('<svg') && blankImg.svg.includes('<desc>'), 'trang trắng Tự do vẫn giữ <desc>')

const multiCoord = extractCoords('A = (0; 4), B(0; 0) M(2,5; 0)\nC(-1,5; 3/2)')
assert.deepEqual(multiCoord.get('A'), [0, 4])
assert.deepEqual(multiCoord.get('B'), [0, 0])
assert.deepEqual(multiCoord.get('M'), [2.5, 0])
assert.deepEqual(multiCoord.get('C'), [-1.5, 1.5])

// Ghi đè đỉnh A trên mẫu tam giác
const triDefault = renderGeo2dSvg(
  { shape: 'triangle', names: ['A', 'B', 'C'], altitude: false, median: false, diagonals: false, circumcircle: false, marks: true, extras: 'M = trung điểm BC\nAM' },
  '<desc/>',
)
assert.deepEqual(triDefault.pick?.origins, ['A', 'B', 'C'], 'tam giác có đúng 3 nút ở 3 đỉnh (không có trung điểm M)')

const triOver = renderGeo2dSvg(
  { shape: 'triangle', names: ['A', 'B', 'C'], altitude: true, median: false, diagonals: false, circumcircle: false, marks: true, extras: 'A(1; 5)\nM = trung điểm BC' },
  '<desc/>',
)
assert.equal(triOver.errors?.length ?? 0, 0)
assert.deepEqual(triOver.pick!.points.find((p) => p.name === 'A')!.v, [1, 5], 'A ghi đè theo toạ độ mới')
assert.equal((triOver.svg.match(/data-lbl="pt:A"/g) ?? []).length, 1, 'không vẽ trùng nhãn đỉnh A bị ghi đè')
console.log('✓ Trang trắng Tự do + A=(x;y) + nhiều điểm 1 dòng + ghi đè đỉnh mẫu')

// 3. Nhãn hỗ trợ chỉ số x_1, kích thước 4 hướng, tia BC chỉ kéo dài quá C
const subImg = renderTool({
  kind: 'geo2d',
  spec: {
    shape: 'free',
    names: [],
    altitude: false,
    median: false,
    diagonals: false,
    circumcircle: false,
    marks: true,
    extras: 'A(0; 0)\nB(5; 0)\nAB\nnhãn AB "x_1"\nkích thước AB "d_0" trên\ntia AB',
  },
})
assert.equal(subImg.errors?.length ?? 0, 0)
assert.ok(subImg.svg.includes('<tspan baseline-shift="sub" font-size="70%">1</tspan>'), 'nhãn AB hỗ trợ chỉ số x_1')
assert.ok(subImg.svg.includes('<tspan baseline-shift="sub" font-size="70%">0</tspan>'), 'kích thước AB hỗ trợ chỉ số d_0')
// tia AB chỉ kéo dài quá B (về phía phải), không kéo dài trước A
const extC = construct('A(0; 0)\nB(5; 0)\ntia AB', new Map())
assert.equal(extC.extends[0].mode, 'end')
const pathMatches = [...subImg.svg.matchAll(/<path d="M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)"/g)]
const bPx = subImg.pick!.points.find((p) => p.name === 'B')!
const aPx = subImg.pick!.points.find((p) => p.name === 'A')!
assert.ok(
  pathMatches.some((m) => Math.abs(Number(m[1]) - aPx.x) < 1 && Number(m[3]) > bPx.x + 15),
  'tia AB bắt đầu tại A và vượt quá B',
)
console.log('✓ Chỉ số x_1 trong nhãn + kích thước tuỳ chọn hướng + tia BC')

// 4. Báo lỗi cú pháp theo dòng + từ chối toạ độ ở geo3d
const errC = construct('A(0; 4)\nA(abc; 4)\nnhãn AB\nkích thước A "5"\nđường A kéo dài', new Map())
assert.equal(errC.errors.length, 4, 'báo đủ 4 lỗi theo dòng')
assert.deepEqual(
  errC.errors.map((e) => e.line),
  [2, 3, 4, 5],
)
const err3d = renderGeo3dSvg(
  { shape: 'pyramid3', names: ['S', 'A', 'B', 'C', 'H'], height: true, diagonals: false, marks: true, tall: 1, extras: 'P(1; 2)' },
  '<desc/>',
)
assert.equal(err3d.errors?.length, 1, 'geo3d báo lỗi khi gõ toạ độ 2D')
console.log('✓ Báo lỗi cú pháp theo dòng + bảo vệ geo3d')

// 5. Chỉnh cạnh: đổi toạ độ, hít đường kéo dài BC, hít thẳng đứng 90° + góc vuông tại B + Alt tắt hít
const xform = fitCoordTransform(pick.points)
for (const p of pick.points) {
  const back = xform.toVb([p.v[0], p.v[1]])
  assert.ok(Math.hypot(back.x - p.x, back.y - p.y) < 0.2, `toVb khớp điểm ${p.name}`)
}

const vbMatch = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(sampleImg.svg)!
const viewBox = { minX: Number(vbMatch[1]), minY: Number(vbMatch[2]), w: Number(vbMatch[3]), h: Number(vbMatch[4]) }
const pts2d = pick.points.map((p) => ({ name: p.name, x: p.x, y: p.y, v: p.v }))

// Kéo M lệch 2px khỏi BC → hít lại đúng BC (y = 0)
const mPt = pt('M')
const snapM = snapDragPoint({
  dragName: 'M',
  rawVb: { x: mPt.x + 2, y: mPt.y + 2.5 },
  points: pts2d,
  segs: pick.segs,
  xform,
  pxSize: 1,
  altKey: false,
  viewBox,
})
assert.ok(Math.abs(snapM.real[1]) < 1e-3, 'M hít về đúng đường BC (y = 0)')
assert.ok(snapM.guides.length >= 1, 'có đường gióng khi M hít vào BC')
assert.ok(snapM.readouts.some((r) => r.startsWith('AM = ')), 'hiện độ dài + góc cạnh AM')

// Kéo A gần (0; 4) → hít thẳng đứng (x = 0, góc 90°), góc B vuông, độ dài AB = 4,00
const aPt = pt('A')
const snapA = snapDragPoint({
  dragName: 'A',
  rawVb: { x: aPt.x + 2.5, y: aPt.y - 2 },
  points: pts2d,
  segs: pick.segs,
  xform,
  pxSize: 1,
  altKey: false,
  viewBox,
})
assert.ok(Math.abs(snapA.real[0]) < 1e-3, 'A hít thẳng đứng về x = 0')
assert.ok(Math.abs(snapA.real[1] - 4) < 1e-3, 'AB hít độ dài 4,00')
assert.ok(snapA.readouts.includes('AB = 4,00 · 90°'), `readout AB đúng chuẩn (thực tế: ${snapA.readouts.join(', ')})`)
assert.ok(snapA.rightMarks.some((m) => Math.hypot(m.at.x - pt('B').x, m.at.y - pt('B').y) < 1), 'hiện kí hiệu góc vuông tạm tại B')

// Giữ Alt → tắt hít
const noSnapA = snapDragPoint({
  dragName: 'A',
  rawVb: { x: aPt.x + 2.5, y: aPt.y - 2 },
  points: pts2d,
  segs: pick.segs,
  xform,
  pxSize: 1,
  altKey: true,
  viewBox,
})
assert.equal(noSnapA.snapped, false)
assert.equal(noSnapA.guides.length, 0)
assert.equal(noSnapA.rightMarks.length, 0)
console.log('✓ Chỉnh cạnh: fitCoordTransform + hít BC + hít AB 4,00 · 90° + góc vuông B + Alt tắt hít')

// 6. Lưu vị trí vào Dựng thêm & Đặt lại hình
const editedM = savePointCoord(sampleExtras, 'M', 3.5, 0, true)
assert.ok(editedM.includes('M(3,5; 0)'), 'sửa số ngay trong chính dòng M(...)')
assert.equal(hasDragCoords(editedM), false, 'dòng giáo viên gõ không bị đánh dấu kéo')

const draggedTri = savePointCoord('M = trung điểm BC\nAM', 'A', 2.4, 4.5, false)
assert.ok(draggedTri.startsWith('A(2,4; 4,5)'), 'đỉnh mẫu thêm dòng A(x; y) ở đầu ô Dựng thêm')
assert.equal(hasDragCoords(draggedTri), true)
const draggedTri2 = savePointCoord(draggedTri, 'A', 2.6, 4.8, false)
assert.equal(draggedTri2.split('\n').length, 3, 'kéo lại đỉnh mẫu sửa chính dòng đầu, không nhân bản')
assert.equal(resetDragCoords(draggedTri2), 'M = trung điểm BC\nAM', 'Đặt lại hình xoá dòng kéo, giữ dòng giáo viên gõ')
console.log('✓ Lưu vị trí toạ độ + Đặt lại hình (giữ dòng giáo viên gõ)')
