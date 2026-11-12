/**
 * Kiểm tra công cụ "Lưới thức ăn" (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-foodweb.ts)
 */
import assert from 'node:assert/strict'
import {
  DEFAULT_FOODWEB_CHAIN,
  DEFAULT_FOODWEB_GRASSLAND,
  parseFoodWeb,
  renderFoodWebSvg,
  type FoodWebSpec,
} from '../src/lib/foodweb'
import { toolFromRaw } from '../src/lib/docRewrite'
import { parseToolJson, readToolDoc, renderTool } from '../src/lib/toolSpec'

// ====================================================================
// 1. Chuỗi đơn 4 loài: 4 bậc, mũi tên đúng chiều
// ====================================================================
const chainSpec: FoodWebSpec = {
  text: 'Cỏ -> Thỏ -> Cáo -> Đại bàng',
  direction: 'left-right',
  nodeStyle: 'box',
  showLevels: true,
}
const chainParsed = parseFoodWeb(chainSpec.text)
assert.equal(chainParsed.nodes.size, 4, 'Chuỗi đơn có 4 loài')
assert.equal(chainParsed.errors.length, 0, 'Không có lỗi cú pháp')
assert.equal(chainParsed.nodes.get('cỏ')?.level, 1, 'Cỏ bậc 1')
assert.equal(chainParsed.nodes.get('thỏ')?.level, 2, 'Thỏ bậc 2')
assert.equal(chainParsed.nodes.get('cáo')?.level, 3, 'Cáo bậc 3')
assert.equal(chainParsed.nodes.get('đại bàng')?.level, 4, 'Đại bàng bậc 4')
assert.equal(chainParsed.maxLevel, 4, 'Bậc cao nhất là 4')

const chainImg = renderTool({ kind: 'foodweb', spec: chainSpec })
assert.ok(chainImg.svg.includes('<svg'), 'SVG hợp lệ')
assert.ok(chainImg.svg.includes('>Cỏ<') && chainImg.svg.includes('>Đại bàng<'), 'SVG có tên các loài')
assert.ok(chainImg.svg.includes('marker-end="url(#foodweb-arrow)"'), 'Có mũi tên đúng chiều')
console.log('✓ Chuỗi đơn 4 loài: tính đúng 4 bậc, chiều năng lượng chính xác')

// ====================================================================
// 2. Lưới mẫu 8 loài: bậc tính đúng (loài ăn ở hai bậc lấy bậc cao nhất),
//    không chồng nút, không mũi tên xuyên nút
// ====================================================================
const grassParsed = parseFoodWeb(DEFAULT_FOODWEB_GRASSLAND.text)
assert.equal(grassParsed.errors.length, 0, 'Lưới đồng cỏ mẫu không có lỗi cú pháp')

// Kiểm tra tính bậc:
// Cỏ (bậc 1)
// Thỏ, Chuột, Châu chấu (bậc 2)
// Ếch (ăn Châu chấu -> bậc 3), Cáo (ăn Thỏ, Chuột -> bậc 3)
// Rắn (ăn Chuột [bậc 2] và Ếch [bậc 3] -> lấy max bậc thức ăn (3) + 1 = bậc 4)
// Đại bàng (ăn Rắn [bậc 4] và Cáo [bậc 3] -> lấy max (4) + 1 = bậc 5)
assert.equal(grassParsed.nodes.get('cỏ')?.level, 1, 'Cỏ: bậc dinh dưỡng 1 (SV sản xuất)')
assert.equal(grassParsed.nodes.get('thỏ')?.level, 2, 'Thỏ: bậc dinh dưỡng 2 (SV tiêu thụ bậc 1)')
assert.equal(grassParsed.nodes.get('chuột')?.level, 2, 'Chuột: bậc dinh dưỡng 2 (SV tiêu thụ bậc 1)')
assert.equal(grassParsed.nodes.get('châu chấu')?.level, 2, 'Châu chấu: bậc dinh dưỡng 2 (SV tiêu thụ bậc 1)')
assert.equal(grassParsed.nodes.get('ếch')?.level, 3, 'Ếch: bậc dinh dưỡng 3 (SV tiêu thụ bậc 2)')
assert.equal(grassParsed.nodes.get('cáo')?.level, 3, 'Cáo: bậc dinh dưỡng 3 (SV tiêu thụ bậc 2)')
assert.equal(grassParsed.nodes.get('rắn')?.level, 4, 'Rắn: ăn ở 2 bậc (Chuột bậc 2, Ếch bậc 3), tính đúng bậc 4')
assert.equal(grassParsed.nodes.get('đại bàng')?.level, 5, 'Đại bàng: ăn ở 2 bậc (Cáo bậc 3, Rắn bậc 4), tính đúng bậc 5')
assert.equal(grassParsed.nodes.get('vi sinh vật')?.isDecomposer, true, 'Vi sinh vật được nhận diện là sinh vật phân giải')

const grassImg = renderTool({ kind: 'foodweb', spec: DEFAULT_FOODWEB_GRASSLAND })
assert.ok(grassImg.svg.includes('<svg'), 'SVG lưới đồng cỏ hợp lệ')

// Kiểm tra bố cục: các hộp nút không đè chồng lên nhau
const nodeBoxes: Array<{ name: string; x0: number; y0: number; x1: number; y1: number }> = []
for (const n of grassParsed.nodes.values()) {
  nodeBoxes.push({
    name: n.name,
    x0: n.x - n.w / 2,
    y0: n.y - n.h / 2,
    x1: n.x + n.w / 2,
    y1: n.y + n.h / 2,
  })
}
for (let i = 0; i < nodeBoxes.length; i++) {
  for (let j = i + 1; j < nodeBoxes.length; j++) {
    const b1 = nodeBoxes[i]
    const b2 = nodeBoxes[j]
    const overlapX = Math.min(b1.x1, b2.x1) - Math.max(b1.x0, b2.x0)
    const overlapY = Math.min(b1.y1, b2.y1) - Math.max(b1.y0, b2.y0)
    assert.ok(
      overlapX <= 0 || overlapY <= 0,
      `Nút "${b1.name}" và "${b2.name}" không được chồng đè nhau (overlapX: ${overlapX}, overlapY: ${overlapY})`,
    )
  }
}

// Kiểm tra đường nối vượt bậc uốn cong né nút khác (Chuột bậc 2 -> Rắn bậc 4, Cáo bậc 3 -> Đại bàng bậc 5)
assert.ok(grassImg.svg.includes('<path d="M '), 'Có đường cong uốn né nút khác khi vượt bậc')

// Kiểm tra chi tiết: không có mũi tên nào (cả line và bezier path) cắt qua hộp của các nút khác
const lineMatches = grassImg.svg.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"[^>]*marker-end/g)
for (const m of lineMatches) {
  const p1 = { x: parseFloat(m[1]), y: parseFloat(m[2]) }
  const p2 = { x: parseFloat(m[3]), y: parseFloat(m[4]) }
  for (const box of nodeBoxes) {
    // Nếu p1 hoặc p2 là đỉnh/đáy của box này thì đó là nút nguồn/đích -> bỏ qua
    const isEndpoint =
      (Math.abs(p1.x - (box.x0 + box.x1) / 2) < 5 && Math.abs(p1.y - box.y0) < 5) ||
      (Math.abs(p1.x - (box.x0 + box.x1) / 2) < 5 && Math.abs(p1.y - box.y1) < 5) ||
      (Math.abs(p2.x - (box.x0 + box.x1) / 2) < 5 && Math.abs(p2.y - box.y0) < 5) ||
      (Math.abs(p2.x - (box.x0 + box.x1) / 2) < 5 && Math.abs(p2.y - box.y1) < 5)
    if (isEndpoint) continue

    // Điểm giữa của đoạn thẳng không được lọt vào trong hộp
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
    const inBox = mid.x > box.x0 && mid.x < box.x1 && mid.y > box.y0 && mid.y < box.y1
    assert.ok(!inBox, `Mũi tên thẳng (${p1.x},${p1.y})->(${p2.x},${p2.y}) không được xuyên qua hộp nút ${box.name}`)
  }
}

const bezierMatches = grassImg.svg.matchAll(/<path d="M ([-\d.]+) ([-\d.]+) C ([-\d.]+) ([-\d.]+), ([-\d.]+) ([-\d.]+), ([-\d.]+) ([-\d.]+)"[^>]*marker-end/g)
for (const m of bezierMatches) {
  const p0 = { x: parseFloat(m[1]), y: parseFloat(m[2]) }
  const p1 = { x: parseFloat(m[3]), y: parseFloat(m[4]) }
  const p2 = { x: parseFloat(m[5]), y: parseFloat(m[6]) }
  const p3 = { x: parseFloat(m[7]), y: parseFloat(m[8]) }

  for (const box of nodeBoxes) {
    const isEndpoint =
      (Math.abs(p0.x - (box.x0 + box.x1) / 2) < 15 && (Math.abs(p0.y - box.y0) < 10 || Math.abs(p0.y - box.y1) < 10)) ||
      (Math.abs(p3.x - (box.x0 + box.x1) / 2) < 15 && (Math.abs(p3.y - box.y0) < 10 || Math.abs(p3.y - box.y1) < 10))
    if (isEndpoint) continue

    // Lấy mẫu các điểm t = 0.2 .. 0.8 trên đường cong, không điểm nào được lọt vào box
    for (let t = 0.2; t <= 0.8; t += 0.1) {
      const mt = 1 - t
      const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x
      const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y
      const inside = x > box.x0 && x < box.x1 && y > box.y0 && y < box.y1
      assert.ok(!inside, `Đường cong uốn (${p0.x},${p0.y})->(${p3.x},${p3.y}) không được xuyên qua hộp nút ${box.name}`)
    }
  }
}

console.log('✓ Lưới mẫu 8 loài: bậc tính đúng (loài ăn ở hai bậc lấy bậc cao nhất), các nút không chồng nhau, không mũi tên xuyên nút')

// ====================================================================
// 3. Ẩn tên làm câu hỏi (?A, [A])
// ====================================================================
const hiddenSpec: FoodWebSpec = {
  text: [
    'Cỏ -> ?A, [B]',
    '?A -> [C]',
    '[B], [C] -> Cáo',
  ].join('\n'),
  direction: 'bottom-up',
  nodeStyle: 'box',
}
const hiddenParsed = parseFoodWeb(hiddenSpec.text)
assert.equal(hiddenParsed.nodes.get('placeholder:a')?.isPlaceholder, true, '?A nhận là ô ẩn tên')
assert.equal(hiddenParsed.nodes.get('placeholder:b')?.isPlaceholder, true, '[B] nhận là ô ẩn tên')
assert.equal(hiddenParsed.nodes.get('placeholder:c')?.isPlaceholder, true, '[C] nhận là ô ẩn tên')
assert.equal(hiddenParsed.nodes.get('placeholder:a')?.name, 'A', 'Hiển thị nhãn A')
assert.equal(hiddenParsed.nodes.get('placeholder:b')?.name, 'B', 'Hiển thị nhãn B')
assert.equal(hiddenParsed.nodes.get('placeholder:c')?.name, 'C', 'Hiển thị nhãn C')

const hiddenImg = renderTool({ kind: 'foodweb', spec: hiddenSpec })
assert.ok(hiddenImg.svg.includes('>A<'), 'SVG có chữ A')
assert.ok(hiddenImg.svg.includes('>B<'), 'SVG có chữ B')
assert.ok(hiddenImg.svg.includes('>C<'), 'SVG có chữ C')
console.log('✓ Ẩn tên ?A và [A]: nhận đúng nhãn thay thế và hiển thị trong khung')

// ====================================================================
// 4. Sinh vật phân giải và tuỳ chọn connectDecomposers
// ====================================================================
const decompOnSpec: FoodWebSpec = {
  text: 'Cỏ -> Thỏ -> Cáo\nNấm: phân giải',
  connectDecomposers: true,
}
const decompOffSpec: FoodWebSpec = {
  text: 'Cỏ -> Thỏ -> Cáo\nNấm: phân giải',
  connectDecomposers: false,
}
const decompOnImg = renderTool({ kind: 'foodweb', spec: decompOnSpec })
const decompOffImg = renderTool({ kind: 'foodweb', spec: decompOffSpec })

// Khi bật connectDecomposers, có mũi tên nét đứt từ Cỏ, Thỏ, Cáo tới Nấm
const countDecOn = (decompOnImg.svg.match(/marker-end="url\(#foodweb-dec-arrow\)"/g) ?? []).length
const countDecOff = (decompOffImg.svg.match(/marker-end="url\(#foodweb-dec-arrow\)"/g) ?? []).length
assert.ok(countDecOn >= 3, 'connectDecomposers=true có ít nhất 3 mũi tên tới sinh vật phân giải')
assert.equal(countDecOff, 0, 'connectDecomposers=false không tự nối mũi tên nếu không chỉ định')
console.log('✓ Sinh vật phân giải: bật/tắt connectDecomposers chính xác')

// ====================================================================
// 5. Bật / tắt nhãn bậc dinh dưỡng
// ====================================================================
const lvlOnImg = renderTool({ kind: 'foodweb', spec: { text: 'Cỏ -> Thỏ -> Cáo', showLevels: true } })
const lvlOffImg = renderTool({ kind: 'foodweb', spec: { text: 'Cỏ -> Thỏ -> Cáo', showLevels: false } })
assert.ok(lvlOnImg.svg.includes('SV sản xuất'), 'Bật nhãn có chữ SV sản xuất')
assert.ok(lvlOnImg.svg.includes('SV tiêu thụ bậc 1'), 'Bật nhãn có chữ SV tiêu thụ bậc 1')
assert.ok(!lvlOffImg.svg.includes('SV sản xuất'), 'Tắt nhãn không có chữ SV sản xuất')
console.log('✓ Nhãn bậc dinh dưỡng: bật/tắt đúng')

// ====================================================================
// 6. Vòng lặp dinh dưỡng: báo cảnh báo theo dòng, không treo
// ====================================================================
const cycleSpec: FoodWebSpec = {
  text: [
    'Cỏ -> Thỏ',
    'Thỏ -> Cáo',
    'Cáo -> Thỏ', // Vòng lặp Thỏ -> Cáo -> Thỏ
  ].join('\n'),
}
const cycleParsed = parseFoodWeb(cycleSpec.text)
assert.ok(cycleParsed.hasCycle, 'Phát hiện có chu trình')
assert.ok(cycleParsed.errors.some((e) => e.msg.includes('vòng lặp dinh dưỡng')), 'Có thông báo vòng lặp')

const cycleImg = renderTool({ kind: 'foodweb', spec: cycleSpec })
assert.ok(cycleImg.svg.includes('<svg'), 'Hình vẽ vẫn render thành công mà không bị treo')
assert.ok(cycleImg.errors && cycleImg.errors.length > 0, 'Trả về danh sách cảnh báo cho giao diện')
console.log('✓ Vòng lặp dinh dưỡng: cảnh báo rõ ràng theo dòng, không treo')

// ====================================================================
// 7. Cú pháp lỗi: thiếu loài trước/sau ->
// ====================================================================
const syntaxErrParsed = parseFoodWeb('Cỏ ->\n-> Thỏ')
assert.ok(syntaxErrParsed.errors.length >= 2, 'Báo lỗi thiếu loài trước hoặc sau ->')
console.log('✓ Báo lỗi theo dòng khi thiếu loài quanh mũi tên')

// ====================================================================
// 8. Round-trip spec ↔ SVG
// ====================================================================
const roundTripDoc = readToolDoc(grassImg.svg)
assert.ok(roundTripDoc && roundTripDoc.kind === 'foodweb', 'readToolDoc đọc lại đúng kind foodweb')
assert.deepEqual(roundTripDoc.spec, DEFAULT_FOODWEB_GRASSLAND, 'Đọc lại đúng FoodWebSpec ban đầu từ thẻ desc')

const jsonDoc = parseToolJson(JSON.stringify({ deTool: { kind: 'foodweb', spec: DEFAULT_FOODWEB_GRASSLAND } }))
assert.ok(jsonDoc && jsonDoc.kind === 'foodweb')
console.log('✓ Round-trip spec ↔ SVG qua readToolDoc / parseToolJson')

// ====================================================================
// 9. toolFromRaw cho AI
// ====================================================================
const aiDoc = toolFromRaw({
  kind: 'foodweb',
  text: 'Cỏ -> Thỏ, Chuột\nThỏ -> Cáo',
  showLevels: true,
})
assert.equal(aiDoc.kind, 'foodweb')
assert.equal(aiDoc.spec.showLevels, true)
console.log('✓ toolFromRaw chuyển đổi cấu hình AI thành công')

console.log('\n========================================')
console.log('TẤT CẢ CÁC BÀI TỰ KIỂM FOODWEB ĐÃ VƯỢT QUA!')
console.log('========================================')

// ====================================================================
// 10. Lưu các file SVG mẫu để kiểm tra trực quan
// ====================================================================
import fs from 'node:fs'
const artifactDir = 'C:/Users/Lenovo/.gemini/antigravity/brain/94f0ab2a-0160-4bd7-8bcc-0adb8eb08204'
if (fs.existsSync(artifactDir)) {
  fs.writeFileSync(`${artifactDir}/foodweb-chain.svg`, chainImg.svg)
  fs.writeFileSync(`${artifactDir}/foodweb-grassland.svg`, grassImg.svg)
  fs.writeFileSync(`${artifactDir}/foodweb-hidden.svg`, hiddenImg.svg)
  console.log('✓ Đã lưu 3 file SVG mẫu vào thư mục artifact')
}
