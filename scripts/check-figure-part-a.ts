import assert from 'node:assert/strict'
import { toolFromRaw } from '../src/lib/docRewrite'
import { renderTool } from '../src/lib/toolSpec'
import { layoutStruct } from '../src/lib/chem'
import { toolImageWidth } from '../src/examEditor/toolImages'

const draw = (raw: Record<string, unknown>) => renderTool(toolFromRaw(raw))

// 1. Biểu đồ Venn với tên tập tiếng Việt có dấu (NFC & NFD)
for (const sets of ['Toán, Lí, Hoá', 'Toán, Lí, Hoá']) {
  const venn = draw({
    kind: 'venn',
    sets,
    shade: '(Toán ∩ Lí) \\ Hoá',
    counts: 'Toán: 12\nToánLí: 5\nLí: 8\nHoá: 10',
    universe: true,
  })
  assert.match(venn.svg, />Toán</)
  assert.match(venn.svg, />Lí</)
  assert.match(venn.svg, />Hoá</)
}

// 2. Công thức cấu tạo Hoá có nhánh / vòng benzen đánh số: số thứ tự không đè lên liên kết
function minDistToBonds(px: number, py: number, bonds: Array<{ x1: number; y1: number; x2: number; y2: number }>) {
  let best = Infinity
  for (const b of bonds) {
    const dx = b.x2 - b.x1
    const dy = b.y2 - b.y1
    const l2 = dx * dx + dy * dy
    const t = l2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((px - b.x1) * dx + (py - b.y1) * dy) / l2))
    const d = Math.hypot(px - (b.x1 + t * dx), py - (b.y1 + t * dy))
    if (d < best) best = d
  }
  return best
}

for (const spec of [
  { formula: 'CH3-CH(CH3)-CH(CH3)-CH3', style: 'condensed' as const, number: true },
  { formula: 'CH3-C(CH3)(CH3)-CH3', style: 'condensed' as const, number: true },
  { formula: '[benzen](1:CH3)(4:NO2)', style: 'condensed' as const, ringStyle: 'kekule' as const, number: true },
  { formula: '[benzen](1:CH3)(3:Cl)', style: 'skeletal' as const, ringStyle: 'circle' as const, number: true },
  { formula: 'CH3-CH(CH3)-C(CH3)(CH3)-CH2-CH3', style: 'skeletal' as const, number: true },
]) {
  const lay = layoutStruct(spec)
  assert.ok(lay.numbers.length > 0, `Phải có số thứ tự cho ${spec.formula}`)
  for (const num of lay.numbers) {
    const d = minDistToBonds(num.x, num.y - 4, lay.bonds)
    assert.ok(d >= 6, `Số ${num.n} ở ${spec.formula} quá sát liên kết (d=${d.toFixed(1)})`)
  }
}

// 3. Cấu hình electron dài (Ba): xuống dòng để không co chữ quá nhỏ ở chiều rộng mặc định
const ba = draw({ kind: 'electron', element: 'Ba', valenceOnly: false })
assert.ok(ba.width <= 520, `Cấu hình Ba phải xuống dòng (width=${ba.width})`)
assert.ok(ba.height >= 150, `Cấu hình Ba phải có >= 2 hàng (height=${ba.height})`)
const baDocW = toolImageWidth('electron', ba.width)
assert.ok(baDocW / ba.width >= 0.9, `Tỉ lệ hiển thị Ba phải >= 90% (${baDocW}/${ba.width})`)

// 4. Hình chóp đáy thang vuông (AB=2, AD=CD=1, M trung điểm AD): cạnh sâu đủ dài, D và M tách rõ A
const trap = draw({
  kind: 'geo3d',
  shape: 'pyramid4-sa',
  names: ['S', 'A', 'B', 'C', 'D'],
  extras: 'S(0;0;1.5) A(0;0;0) B(2;0;0) C(1;1;0) D(0;1;0)\nM = trung điểm AD\nSM',
})
const pt = (name: string) => trap.pick!.points.find((p) => p.name === name)!
const [S, A, B, C, D, M] = ['S', 'A', 'B', 'C', 'D', 'M'].map(pt)
assert.ok(D.x > A.x + 50, `D phải nằm chếch lên-phải khỏi A (D.x=${D.x}, A.x=${A.x})`)
assert.ok(Math.hypot(M.x - A.x, M.y - A.y) > 40, 'M phải tách rõ khỏi A')
assert.ok(Math.hypot(D.x - M.x, D.y - M.y) > 40, 'D phải tách rõ khỏi M')
const gapBC = Math.abs((B.x - S.x) * (C.y - S.y) - (B.y - S.y) * (C.x - S.x)) / Math.hypot(B.x - S.x, B.y - S.y)
assert.ok(gapBC > 20, `SB và SC phải tách nhau rõ (gap=${gapBC.toFixed(1)})`)

console.log('✓ Hồi quy 4 lỗi Phần A: Venn tiếng Việt, CTCT đánh số, Electron Ba, Chóp đáy thang vuông')
