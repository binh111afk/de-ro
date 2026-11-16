/**
 * Kiểm tranh đếm đồ vật: số hình trong SVG phải đúng số đề hỏi (rổ × số quả mỗi rổ…).
 *   npx tsx --tsconfig tsconfig.app.json scripts/check-objects.ts
 */
import assert from 'node:assert/strict'
import { loadSprites } from '@/lib/figureSprites'
import { renderTool } from '@/lib/toolSpec'
import { toolFromRaw } from '@/lib/docRewrite'
import { normalizeObjects, resolveSpriteId } from '@/lib/objects'

await loadSprites()

const uses = (svg: string, id: string) => (svg.match(new RegExp(`href="#sp-${id}"`, 'g')) ?? []).length

// rổ: mỗi rổ vẽ 2 lần (thân + thành trước che chân), táo đúng 3 × 5
{
  const svg = renderTool(toolFromRaw({ kind: 'objects', groups: [{ container: 'basket', item: 'apple', each: 5, count: 3 }] })).svg
  assert.equal(uses(svg, 'apple'), 15)
  assert.equal(uses(svg, 'basket'), 6)
}
// đĩa: không vẽ thành trước
{
  const svg = renderTool(toolFromRaw({ kind: 'objects', groups: [{ container: 'plate', item: 'cake', each: 4, count: 2 }] })).svg
  assert.equal(uses(svg, 'cake'), 8)
  assert.equal(uses(svg, 'plate'), 2)
}
// nhóm rời
{
  const svg = renderTool(toolFromRaw({ kind: 'objects', groups: [{ item: 'flower', each: 7, count: 2, label: '7' }] })).svg
  assert.equal(uses(svg, 'flower'), 14)
}
// đồ vật không có trong kho, không có "en": bỏ cả nhóm (không vẽ rổ rỗng)
assert.equal(normalizeObjects({ groups: [{ container: 'basket', item: 'khong-co', each: 5, count: 2 }] }).groups.length, 0)
// có "en": thành id kho dùng chung, giữ tên tiếng Việt
{
  const doc = toolFromRaw({ kind: 'objects', groups: [{ item: 'ấm trà', en: 'Tea Pot', each: 4, count: 1 }] })
  assert.equal(doc.kind, 'objects')
  if (doc.kind === 'objects') assert.deepEqual(doc.spec.groups[0], { item: 'x-tea-pot', itemName: 'ấm trà', container: undefined, each: 4, count: 1, label: undefined })
}
// túi chỉ ghi số mà có đồ vật: chuyển thành nhóm rời, vẫn đủ số
{
  const g = normalizeObjects({ groups: [{ container: 'bag', item: 'apple', each: 10, count: 3, label: '10' }] }).groups
  if (g.length) assert.equal(g[0].container, undefined)
}
// giới hạn: tối đa 20 vật / đồ chứa, 10 đồ chứa / nhóm
{
  const [g] = normalizeObjects({ groups: [{ container: 'basket', item: 'apple', each: 99, count: 99 }] }).groups
  assert.equal(g.each, 20)
  assert.equal(g.count, 10)
}
// đồng hồ: kim phút 15 phút chỉ số 3 (bên phải tâm)
{
  const svg = renderTool(toolFromRaw({ kind: 'clock', hour: 8, minute: 15 })).svg
  const lines = [...svg.matchAll(/<line x1="110" y1="110" x2="([\d.]+)" y2="([\d.]+)"/g)]
  assert.equal(lines.length, 2)
  const [, mx, my] = lines[1]
  assert.ok(Number(mx) > 180 && Math.abs(Number(my) - 110) < 1)
}
// hình thực tế: "hình <vật> AB" vẽ hình vật; tên gọi khác ("cây", "thang") và từ chỉ loại đều nhận
{
  const base = '_G(-1; 0) _K(9; 0) A(0; 0) B(0; 5) C(8; 0)\nđất _G-_K\nđứt BC'
  const svg = renderTool(toolFromRaw({ kind: 'scene', text: `${base}\nhình cây AB` })).svg
  assert.equal(uses(svg, 'tree'), 1)
  assert.equal(uses(renderTool(toolFromRaw({ kind: 'scene', text: `${base}\nhình cái thang CB` })).svg, 'ladder'), 1)
  assert.equal(uses(renderTool(toolFromRaw({ kind: 'scene', text: `${base}\nhình tòa nhà AB` })).svg, 'building'), 1)
  // vật chưa có: bỏ dòng, hình học vẫn vẽ (không ném lỗi)
  const plain = renderTool(toolFromRaw({ kind: 'scene', text: `${base}\nhình con khủng long AB` })).svg
  assert.ok(!plain.includes('href="#sp-'))
  // vật ngoài kho bằng tên tiếng Anh: thành id kho dùng chung
  assert.equal(resolveSpriteId('en:Water Wheel'), 'x-water-wheel')
}
console.log('check-objects: ok')
