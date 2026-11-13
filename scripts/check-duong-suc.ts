/**
 * Kiểm tra công cụ "Đường sức" (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-duong-suc.ts).
 */
import assert from 'node:assert/strict'
import { fieldLines, solenoidNorthSide, type FieldScene, type FieldSpec } from '../src/lib/field'
import { renderTool } from '../src/lib/toolSpec'
import { FIGURE_GUIDE, toolFromRaw } from '../src/lib/docRewrite'

// 1. Một điện tích (+): mọi đường sức đi thẳng ra xa tâm (khoảng cách tới tâm tăng dần dọc đường), số đường = lines
{
  const spec: FieldSpec = { scene: { type: 'charge', sign: '+' }, lines: 8, showArrows: true, labels: true }
  const lines = fieldLines(spec)
  assert.equal(lines.length, spec.lines, `Số đường sức phải bằng ${spec.lines}`)
  for (const poly of lines) {
    assert.ok(poly.points.length >= 2)
    for (let i = 1; i < poly.points.length; i++) {
      const rPrev = Math.hypot(poly.points[i - 1].x, poly.points[i - 1].y)
      const rCurr = Math.hypot(poly.points[i].x, poly.points[i].y)
      assert.ok(rCurr > rPrev, `Khoảng cách tới tâm phải tăng dần: ${rPrev} -> ${rCurr}`)
    }
  }
  console.log('✓ 1. Một điện tích (+): 8 đường sức hướng tâm đi thẳng ra xa tâm')
}

// 2. Hai điện tích trái dấu bằng nhau (+q tại (-1,0), -q tại (1,0)):
//    - ít nhất 1 đường xuất phát từ +q kết thúc trong bán kính 0.1 của -q
//    - đường đi theo trục nối (xuất phát góc 0) là đoạn thẳng y = 0
{
  const spec: FieldSpec = {
    scene: { type: 'two-charges', signs: ['+', '-'], ratio: 1 },
    lines: 8,
    showArrows: true,
    labels: true,
  }
  const lines = fieldLines(spec)
  const endedAtNeg = lines.filter((poly) => {
    const last = poly.points[poly.points.length - 1]
    return Math.hypot(last.x - 1, last.y) <= 0.1
  })
  assert.ok(endedAtNeg.length >= 1, 'Phải có ít nhất 1 đường xuất phát từ +q kết thúc trong bán kính 0.1 của -q')

  const axisLine = lines.find((poly) => {
    const first = poly.points[0]
    const last = poly.points[poly.points.length - 1]
    return first.x < 0 && last.x > 0 && Math.abs(first.y) < 1e-9
  })
  assert.ok(axisLine, 'Phải có đường đi theo trục nối xuất phát góc 0 từ +q')
  for (const p of axisLine.points) {
    assert.ok(Math.abs(p.y) < 1e-6, `Đường trục nối phải là đoạn thẳng y = 0, gặp y = ${p.y}`)
  }
  console.log(`✓ 2. Hai điện tích trái dấu (+q, -q): ${endedAtNeg.length} đường kết thúc trong bán kính 0.1 của -q; đường trục nối y = 0`)
}

// 3. Hai điện tích cùng dấu bằng nhau:
//    - không đường nào đi qua trung điểm (0,0) trong bán kính 0.05 (điểm trung hoà)
//    - hình đối xứng qua trục tung (so toạ độ các polyline, sai số < 1e-3)
{
  const spec: FieldSpec = {
    scene: { type: 'two-charges', signs: ['+', '+'], ratio: 1 },
    lines: 8,
    showArrows: true,
    labels: true,
  }
  const lines = fieldLines(spec)
  assert.equal(lines.length, 16)
  for (const poly of lines) {
    for (const p of poly.points) {
      const dist = Math.hypot(p.x, p.y)
      assert.ok(dist > 0.05, `Không đường nào được đi qua (0,0) trong bán kính 0.05, gặp r = ${dist}`)
    }
  }

  // Kiểm đối xứng qua trục tung x = 0: nửa đầu (từ q1) đối xứng với nửa sau (từ q2)
  const half = lines.length / 2
  let maxErr = 0
  for (let i = 0; i < half; i++) {
    const a = lines[i].points
    const b = lines[half + i].points
    assert.equal(a.length, b.length, `Độ dài polyline đối xứng ${i} phải bằng nhau`)
    for (let j = 0; j < a.length; j++) {
      const err = Math.hypot(a[j].x + b[j].x, a[j].y - b[j].y)
      if (err > maxErr) maxErr = err
      assert.ok(err < 1e-3, `Sai số đối xứng quá lớn tại (${i},${j}): ${err}`)
    }
  }
  console.log(`✓ 3. Hai điện tích cùng dấu (+q, +q): tránh điểm trung hoà (0,0) r > 0.05; đối xứng trục tung (sai số max = ${maxErr.toExponential(2)})`)
}

// 4. Dây dòng ra (⊙): đường sức là vòng tròn đồng tâm (độ lệch bán kính < 1%),
//    mũi tên ngược chiều kim đồng hồ (tích có hướng r x t > 0 trong hệ trục toán học)
{
  const spec: FieldSpec = { scene: { type: 'wire', current: 'out' }, lines: 8, showArrows: true, labels: true }
  const lines = fieldLines(spec)
  assert.ok(lines.length >= 3)
  let maxRelDev = 0
  for (const poly of lines) {
    const radii = poly.points.map((p) => Math.hypot(p.x, p.y))
    const rMean = radii.reduce((s, r) => s + r, 0) / radii.length
    for (const r of radii) {
      const rel = Math.abs(r - rMean) / rMean
      if (rel > maxRelDev) maxRelDev = rel
      assert.ok(rel < 0.01, `Độ lệch bán kính phải < 1%, gặp ${(rel * 100).toFixed(3)}%`)
    }
    for (let i = 1; i < poly.points.length; i++) {
      const p0 = poly.points[i - 1]
      const p1 = poly.points[i]
      const tx = p1.x - p0.x
      const ty = p1.y - p0.y
      const cross = p0.x * ty - p0.y * tx
      assert.ok(cross > 0, `Dây dòng ra (⊙) phải quay ngược chiều kim đồng hồ (r x t > 0), gặp ${cross}`)
    }
  }
  console.log(`✓ 4. Dây dòng ra (⊙): ${lines.length} vòng tròn đồng tâm (độ lệch ${(maxRelDev * 100).toFixed(4)}% < 1%), ngược chiều kim đồng hồ`)
}

// 5. Ống dây current: 'right' -> cực N theo quy tắc nắm tay phải
//    Quy ước: dòng điện qua ống dây theo chiều trái -> phải, ở mặt trước ống dây dòng đi LÊN;
//    nắm bàn tay phải sao cho 4 ngón tay chỉ lên theo dòng mặt trước -> ngón cái chỉ sang TRÁI => cực Bắc (N) ở bên TRÁI.
{
  const nSide = solenoidNorthSide('right')
  assert.equal(nSide, 'left', 'Theo quy ước mặt trước đi lên (current: right), cực N ở bên trái')
  const img = renderTool({
    kind: 'field',
    spec: { scene: { type: 'solenoid', current: 'right' }, lines: 8, showArrows: true, labels: true },
  })
  const nMatch = /<text x="(-?[\d.]+)"[^>]*data-pole="N">N<\/text>/.exec(img.svg)
  const sMatch = /<text x="(-?[\d.]+)"[^>]*data-pole="S">S<\/text>/.exec(img.svg)
  assert.ok(nMatch && sMatch, 'SVG ống dây phải có nhãn cực N và S')
  const xN = Number(nMatch[1])
  const xS = Number(sMatch[1])
  assert.ok(xN < xS, `Nhãn N (x=${xN}) phải ở bên trái nhãn S (x=${xS})`)
  console.log(`✓ 5. Ống dây current='right': cực N ở bên trái (xN=${xN} < xS=${xS}) theo quy tắc nắm tay phải`)
}

// 6. toolFromRaw đọc được JSON ví dụ trong FIGURE_GUIDE; renderTool mọi cảnh không lỗi, SVG không có NaN
{
  const guideMatch = /26\) Đường sức[^:]*:\s*(\{[^\n]+?\})\./.exec(FIGURE_GUIDE)
  assert.ok(guideMatch, 'Phải tìm thấy JSON ví dụ mục 26 trong FIGURE_GUIDE')
  const exampleRaw = JSON.parse(guideMatch[1]) as Record<string, unknown>
  const parsedDoc = toolFromRaw(exampleRaw)
  assert.equal(parsedDoc.kind, 'field')

  const allScenes: FieldScene[] = [
    { type: 'charge', sign: '+' },
    { type: 'charge', sign: '-' },
    { type: 'two-charges', signs: ['+', '-'], ratio: 1 },
    { type: 'two-charges', signs: ['+', '+'], ratio: 1 },
    { type: 'two-charges', signs: ['+', '-'], ratio: 2 },
    { type: 'plates' },
    { type: 'wire', current: 'out' },
    { type: 'wire', current: 'in' },
    { type: 'wire-side', current: 'up' },
    { type: 'wire-side', current: 'down' },
    { type: 'loop', current: 'ccw' },
    { type: 'loop', current: 'cw' },
    { type: 'solenoid', current: 'right' },
    { type: 'solenoid', current: 'left' },
    { type: 'magnet', orient: 'h' },
    { type: 'magnet', orient: 'v' },
  ]

  for (const scene of allScenes) {
    const img = renderTool({
      kind: 'field',
      spec: {
        scene,
        lines: 8,
        showArrows: true,
        labels: true,
        probe: scene.type === 'wire-side' ? undefined : { x: 0.4, y: 0.5, vector: 'E' },
      },
    })
    assert.ok(img.svg.includes('<svg') && !img.svg.includes('NaN'), `SVG cảnh ${scene.type} không được chứa NaN`)
  }
  console.log(`✓ 6. toolFromRaw đọc JSON FIGURE_GUIDE thành công; renderTool ${allScenes.length} biến thể không lỗi, không NaN`)
}
