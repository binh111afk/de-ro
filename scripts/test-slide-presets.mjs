/**
 * Test thư viện hình khối: đủ 109 hình, mỗi hình ra được đường vẽ hợp lệ (không rơi về hình chữ nhật trừ khi đúng là hình chữ nhật).
 * Chạy: npm run test:slide-presets
 */
import assert from 'node:assert/strict'
import { PRESET_GROUPS, PRESET_COUNT, defaultBox, isPresetShape, presetPaths, prstOf, shapeNameOf } from '../src/lib/slidePresets.ts'

assert.equal(PRESET_COUNT, 109, 'đủ 109 hình như thư viện của GenOffice')
assert.equal(PRESET_GROUPS.length, 7)
const ids = PRESET_GROUPS.flatMap((g) => g.shapes.map((s) => s.prst))
assert.equal(new Set(ids).size, ids.length, 'không trùng hình')
assert.ok(PRESET_GROUPS.every((g) => g.shapes.every((s) => s.label.trim())), 'hình nào cũng có tên tiếng Việt')

const rectPath = (W, H) => `M 0 0 H ${W} V ${H} H 0 Z`
const fallbacks = []
for (const prst of ids) {
  if (prst === 'line' || prst === 'lineArrow' || prst === 'lineArrowDouble') continue // đường thẳng do app tự vẽ
  const p = presetPaths(prst, 30, 40)
  const d = p.both ?? p.strokeOnly ?? p.fillOnly
  assert.ok(d && d.length > 10, `${prst}: có đường vẽ`)
  assert.ok(![p.both, p.fillOnly, p.strokeOnly].some((x) => x !== undefined && /NaN|undefined/.test(x)), `${prst}: đường vẽ không chứa NaN`)
  if (p.both === rectPath(p.W, p.H) && !['rect', 'flowChartProcess'].includes(prst)) fallbacks.push(prst)
}
assert.deepEqual(fallbacks, [], `hình rơi về hình chữ nhật (chưa có công thức): ${fallbacks.join(', ')}`)

// tên cũ vẫn dùng được; hình mới lưu thẳng prst
assert.equal(prstOf('round'), 'roundRect')
assert.equal(prstOf('arrow'), 'rightArrow')
assert.equal(prstOf('hexagon'), 'hexagon')
assert.equal(shapeNameOf('roundRect'), 'round')
assert.equal(shapeNameOf('hexagon'), 'hexagon')
assert.equal(isPresetShape('hexagon'), true)
assert.equal(isPresetShape('round'), false)
assert.equal(isPresetShape('line'), false)
assert.deepEqual(defaultBox('rightArrow'), { w: 34, h: 28 })
assert.deepEqual(defaultBox('hexagon'), { w: 22, h: 39.1 })
console.log(`test-slide-presets: pass (${ids.length} hình)`)
