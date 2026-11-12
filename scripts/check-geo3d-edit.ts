/**
 * Kiểm tra "Chỉnh cạnh" cho Hình học không gian (geo3d):
 * - phân tích A(x; y; z) / A = (x; y; z), báo lỗi sai chiều 2D/3D theo dòng
 * - ghi đè đỉnh mẫu + tính lại điểm phụ/nét khuất + ẩn kí hiệu góc vuông khi không còn đúng
 * - suy ngược toạ độ màn hình -> (x, y) trên mặt phẳng ngang
 * - kéo ngang / đứng (Shift), liên kết đỉnh lăng trụ, hít S trên tâm đáy / đỉnh / trung điểm, Alt tắt hít
 * - lưu toạ độ // kéo, Đặt lại hình, round-trip readToolDoc
 * Chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-geo3d-edit.ts
 */
import assert from 'node:assert/strict'
import { construct, extractCoords } from '../src/lib/geoConstruct'
import { renderGeo2dSvg, renderGeo3dSvg, type Geo3dSpec } from '../src/lib/geometry'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'
import {
  fitCoordTransform3d,
  hasDragCoords,
  resetDragCoords,
  savePointsCoord3d,
  snapDragPoint3d,
} from '../src/examEditor/tools/edgeSnap'

// 1. Phân tích toạ độ 3D + báo lỗi sai chiều theo dòng
const coords3 = extractCoords('S(1,5; 2; 3)\nP = (-1; 0,5; 4/2)', 3)
assert.deepEqual(coords3.get('S'), [1.5, 2, 3])
assert.deepEqual(coords3.get('P'), [-1, 0.5, 2])

const err2dWith3 = renderGeo2dSvg(
  { shape: 'triangle', names: ['A', 'B', 'C'], altitude: false, median: false, diagonals: false, circumcircle: false, marks: true, extras: 'A(1; 2; 3)' },
  '<desc/>',
)
assert.equal(err2dWith3.errors?.length, 1, 'hình phẳng báo lỗi khi nhập 3 toạ độ')
assert.equal(err2dWith3.errors![0].line, 1)

const err3dWith2 = renderGeo3dSvg(
  { shape: 'pyramid4', names: ['S', 'A', 'B', 'C', 'D', 'O'], height: true, diagonals: false, marks: true, tall: 1, extras: 'M = trung điểm AB\nP(1; 2)' },
  '<desc/>',
)
assert.equal(err3dWith2.errors?.length, 1, 'geo3d báo lỗi khi nhập 2 toạ độ')
assert.equal(err3dWith2.errors![0].line, 2)

const c3 = construct('P(2; 1; 0)\nM = trung điểm SP', new Map([['S', [0, 1, 2]]]))
assert.equal(c3.errors.length, 0)
assert.deepEqual(c3.coords, ['P'])
assert.deepEqual(c3.points.find((p) => p.name === 'M')?.p, [1, 1, 1])
console.log('✓ Phân tích A(x; y; z) + báo lỗi sai chiều 2D/3D theo dòng')

// 2. Ghi đè đỉnh mẫu, số lượng nút, tính lại trung điểm + kí hiệu góc vuông + round-trip
const pyr4Spec: Geo3dSpec = {
  shape: 'pyramid4',
  names: ['S', 'A', 'B', 'C', 'D', 'O'],
  height: true,
  diagonals: true,
  marks: true,
  tall: 1,
}
const pyr4Img = renderTool({ kind: 'geo3d', spec: pyr4Spec })
assert.equal(pyr4Img.pick?.origins?.length, 5)
assert.deepEqual(new Set(pyr4Img.pick?.origins), new Set(['S', 'A', 'B', 'C', 'D']), 'pyramid4 có đúng 5 nút (S, A, B, C, D)')

const pyrSaDefault = renderGeo3dSvg(
  { shape: 'pyramid4-sa', names: ['S', 'A', 'B', 'C', 'D', 'O'], height: true, diagonals: false, marks: true, tall: 1 },
  '<desc/>',
)
const pyrSaMoved = renderGeo3dSvg(
  {
    shape: 'pyramid4-sa',
    names: ['S', 'A', 'B', 'C', 'D', 'O'],
    height: true,
    diagonals: false,
    marks: true,
    tall: 1,
    extras: 'S(1; 0,5; 2)\nM = trung điểm SC',
  },
  '<desc/>',
)
assert.equal(pyrSaMoved.errors?.length ?? 0, 0)
assert.deepEqual(pyrSaMoved.pick!.points.find((p) => p.name === 'S')!.v, [1, 0.5, 2])
assert.deepEqual(pyrSaMoved.pick!.points.find((p) => p.name === 'M')!.v, [1.25, 1, 1], 'trung điểm SC tự tính lại theo S mới')
// SA không còn vuông góc đáy → mất kí hiệu góc vuông ở A (từ 2 path rightMark của mẫu xuống 0)
const countRightMarks = (svg: string) => (svg.match(/stroke-width="1\.1"/g) ?? []).length
assert.equal(countRightMarks(pyrSaDefault.svg), 2, 'mẫu SA ⊥ đáy có 2 kí hiệu góc vuông')
assert.equal(countRightMarks(pyrSaMoved.svg), 0, 'khi S rời khỏi trục A, kí hiệu góc vuông SA ⊥ đáy không vẽ nữa')
console.log('✓ Ghi đè đỉnh mẫu, 5 nút pyramid4, tính lại trung điểm, ẩn góc vuông không còn đúng')

// 3. Suy ngược toạ độ màn hình -> (x, y) trên mặt phẳng ngang
const pick4 = pyr4Img.pick!
const xf4 = fitCoordTransform3d(pick4.points)
for (const p of pick4.points) {
  const vb = xf4.toVb([p.v[0], p.v[1], p.v[2]])
  assert.ok(Math.hypot(vb.x - p.x, vb.y - p.y) < 0.2, `toVb khớp đỉnh ${p.name}`)
  const back = xf4.toRealHoriz({ x: p.x, y: p.y }, p.v[2])
  assert.ok(Math.hypot(back[0] - p.v[0], back[1] - p.v[1]) < 1e-6, `suy ngược toRealHoriz khớp ${p.name}`)
}
// Thử một toạ độ tuỳ ý trên mặt ngang z = 1.5
const test3d: [number, number, number] = [1.37, 0.84, 1.5]
const testVb = xf4.toVb(test3d)
const testBack = xf4.toRealHoriz(testVb, 1.5)
assert.ok(Math.hypot(testBack[0] - test3d[0], testBack[1] - test3d[1]) < 1e-6, 'suy ngược màn hình -> (x, y) chính xác')
console.log('✓ fitCoordTransform3d & suy ngược toRealHoriz chính xác')

// 4. Hít S trên tâm đáy, trên đỉnh A, Shift kéo đứng & Alt tắt hít
const vbMatch = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(pyr4Img.svg)!
const viewBox4 = { minX: Number(vbMatch[1]), minY: Number(vbMatch[2]), w: Number(vbMatch[3]), h: Number(vbMatch[4]) }
const pt4 = (n: string) => pick4.points.find((p) => p.name === n)!
const s4 = pt4('S')
const o4 = pt4('O')
const a4 = pt4('A')

// Kéo S lệch nhẹ khỏi trên O -> hít lại đúng tâm đáy O và có nét đứt S xuống O
const snapSOverO = snapDragPoint3d({
  dragName: 'S',
  rawReal: [o4.v[0] + 0.02, o4.v[1] - 0.02, s4.v[2]],
  mode: 'horiz',
  points: pick4.points,
  segs: pick4.segs,
  origins: pick4.origins,
  base: pick4.base,
  top: pick4.top,
  xform: xf4,
  pxSize: 1,
  altKey: false,
  viewBox: viewBox4,
})
assert.equal(snapSOverO.snapped, true)
assert.ok(Math.hypot(snapSOverO.real[0] - o4.v[0], snapSOverO.real[1] - o4.v[1]) < 1e-6, 'S hít ngay trên tâm đáy O')
assert.ok(snapSOverO.guides.some((g) => Math.hypot(g.x2 - o4.x, g.y2 - o4.y) < 1 || Math.hypot(g.x1 - o4.x, g.y1 - o4.y) < 1), 'có nét đứt S xuống O')

// Kéo S ngang tới gần trên A -> hít trên A, có nét đứt S xuống A
const snapSOverA = snapDragPoint3d({
  dragName: 'S',
  rawReal: [a4.v[0] + 0.02, a4.v[1] + 0.01, s4.v[2]],
  mode: 'horiz',
  points: pick4.points,
  segs: pick4.segs,
  origins: pick4.origins,
  base: pick4.base,
  top: pick4.top,
  xform: xf4,
  pxSize: 1,
  altKey: false,
  viewBox: viewBox4,
})
assert.ok(Math.hypot(snapSOverA.real[0] - a4.v[0], snapSOverA.real[1] - a4.v[1]) < 1e-6, 'S hít ngay trên đỉnh A')
assert.ok(snapSOverA.guides.some((g) => Math.hypot(g.x2 - a4.x, g.y2 - a4.y) < 1 || Math.hypot(g.x1 - a4.x, g.y1 - a4.y) < 1), 'có nét đứt S xuống A')

// Shift kéo S thẳng đứng lên gần h = 2 -> chỉ z đổi, bảng hiện h và độ dài thật 3D SA
const snapSVert = snapDragPoint3d({
  dragName: 'S',
  rawReal: [s4.v[0], s4.v[1], 1.98],
  mode: 'vert',
  points: pick4.points,
  segs: pick4.segs,
  origins: pick4.origins,
  base: pick4.base,
  top: pick4.top,
  xform: xf4,
  pxSize: 1,
  altKey: false,
  viewBox: viewBox4,
})
assert.ok(Math.abs(snapSVert.real[0] - s4.v[0]) < 1e-9 && Math.abs(snapSVert.real[1] - s4.v[1]) < 1e-9, 'Shift-kéo S chỉ đổi z')
assert.ok(Math.abs(snapSVert.real[2] - 2) < 1e-6, 'S hít cao độ h = 2,00')
assert.ok(snapSVert.readouts.some((r) => r.includes('h = 2,00')), `readout có h = 2,00 (${snapSVert.readouts.join(' | ')})`)
assert.ok(snapSVert.readouts[0].includes('đứng'), 'hiện đang kéo đứng')

// Đỉnh đáy A bỏ qua Shift (vẫn kéo ngang)
const snapABaseShift = snapDragPoint3d({
  dragName: 'A',
  rawReal: [a4.v[0] + 0.5, a4.v[1], 0],
  mode: 'vert',
  points: pick4.points,
  segs: pick4.segs,
  origins: pick4.origins,
  base: pick4.base,
  top: pick4.top,
  xform: xf4,
  pxSize: 1,
  altKey: true,
  viewBox: viewBox4,
})
assert.equal(snapABaseShift.mode, 'horiz', 'đỉnh đáy chóp bỏ qua Shift')
console.log('✓ Hít S trên tâm đáy / đỉnh A, kéo đứng Shift, đáy bỏ qua Shift')

// 5. Lăng trụ tam giác (prism3): liên kết đỉnh đáy dưới -> trên, và Shift-kéo đỉnh trên -> cả mặt trên đổi cao độ
const prismImg = renderTool({
  kind: 'geo3d',
  spec: { shape: 'prism3', names: ['A', 'B', 'C', "A'", "B'", "C'"], height: true, diagonals: false, marks: true, tall: 1 },
})
const pPick = prismImg.pick!
const xfP = fitCoordTransform3d(pPick.points)
const pVbM = /viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/.exec(prismImg.svg)!
const pBox = { minX: Number(pVbM[1]), minY: Number(pVbM[2]), w: Number(pVbM[3]), h: Number(pVbM[4]) }
const pPt = (n: string) => pPick.points.find((p) => p.name === n)!

const dragA = snapDragPoint3d({
  dragName: 'A',
  rawReal: [-0.5, 1.0, 0],
  mode: 'horiz',
  points: pPick.points,
  segs: pPick.segs,
  origins: pPick.origins,
  base: pPick.base,
  top: pPick.top,
  xform: xfP,
  pxSize: 1,
  altKey: true,
  viewBox: pBox,
})
const savedA = dragA.savePoints.find((x) => x.name === 'A')!
const savedAp = dragA.savePoints.find((x) => x.name === "A'")!
assert.ok(savedA && savedAp, "kéo A ở lăng trụ kéo theo A'")
assert.ok(Math.hypot(savedA.real[0] - savedAp.real[0], savedA.real[1] - savedAp.real[1]) < 1e-6, "A' giữ cùng (x, y) với A")

const dragApVert = snapDragPoint3d({
  dragName: "A'",
  rawReal: [pPt("A'").v[0], pPt("A'").v[1], 2.02],
  mode: 'vert',
  points: pPick.points,
  segs: pPick.segs,
  origins: pPick.origins,
  base: pPick.base,
  top: pPick.top,
  xform: xfP,
  pxSize: 1,
  altKey: false,
  viewBox: pBox,
})
assert.deepEqual(
  new Set(dragApVert.savePoints.map((x) => x.name)),
  new Set(["A'", "B'", "C'"]),
  "Shift-kéo A' kéo theo cả mặt trên A'B'C'",
)
for (const sp of dragApVert.savePoints) {
  assert.ok(Math.abs(sp.real[2] - 2) < 1e-6, `${sp.name} cùng đổi cao độ lên 2`)
}

// 6. Lưu dòng // kéo, sửa lại không nhân bản, Đặt lại hình, round-trip readToolDoc
const extras1 = savePointsCoord3d('M = trung điểm AB', dragA.savePoints, dragA.mode, dragA.snapped)
assert.ok(hasDragCoords(extras1))
assert.ok(extras1.includes("A'("), "lưu cả đỉnh đi theo A' vào Dựng thêm")
const extras2 = savePointsCoord3d(extras1, dragA.savePoints, dragA.mode, dragA.snapped)
assert.equal(extras2.split('\n').length, extras1.split('\n').length, 'kéo lại sửa dòng cũ, không nhân bản')
assert.equal(resetDragCoords(extras2), 'M = trung điểm AB', 'Đặt lại hình xoá hết dòng // kéo, giữ dòng giáo viên gõ')

const rtSpec: Geo3dSpec = { ...pyr4Spec, extras: extras1 }
const rtImg = renderTool({ kind: 'geo3d', spec: rtSpec })
assert.deepEqual(readToolDoc(rtImg.svg), { kind: 'geo3d', spec: rtSpec }, 'round-trip readToolDoc giữ nguyên extras 3D')
console.log('✓ Liên kết đỉnh lăng trụ, lưu dòng // kéo, Đặt lại hình, round-trip readToolDoc')
