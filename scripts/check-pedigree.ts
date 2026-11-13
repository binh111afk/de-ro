/**
 * Kiểm tra công cụ Sơ đồ phả hệ (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-pedigree.ts).
 */
import assert from 'node:assert/strict'
import {
  parsePedigree,
  assignGenerations,
  layoutPedigree,
  renderPedigreeSvg,
  PEDIGREE_SAMPLE,
  PEDIGREE_SAMPLE_TWINS,
  type BoundingBox,
} from '../src/lib/pedigree'
import { readToolDoc, renderTool, parseToolJson } from '../src/lib/toolSpec'

console.log('--- Bắt đầu kiểm tra công cụ Sơ đồ phả hệ ---')

// 1. Kiểm tra phân tích cú pháp (Syntax)
{
  const text = `
    bệnh "mù màu"
    1: nam bệnh
    2: nữ
    3: nữ mang gen
    4: nam chết
    5: ?
    1 x 2 -> 3, (4 5), [6 7]
    hỏi 5
  `
  const p = parsePedigree(text)
  assert.equal(p.disease, 'mù màu', 'Đọc đúng tên bệnh')

  const p1 = p.persons.get('1')!
  assert.ok(p1, 'Tìm thấy người 1')
  assert.equal(p1.gender, 'male', 'Người 1 là nam')
  assert.equal(p1.status, 'affected', 'Người 1 bị bệnh')
  assert.equal(p1.deceased, false, 'Người 1 chưa chết')

  const p2 = p.persons.get('2')!
  assert.equal(p2.gender, 'female', 'Người 2 là nữ')
  assert.equal(p2.status, 'normal', 'Người 2 bình thường')

  const p3 = p.persons.get('3')!
  assert.equal(p3.status, 'carrier', 'Người 3 mang gen')

  const p4 = p.persons.get('4')!
  assert.equal(p4.deceased, true, 'Người 4 đã chết')

  const p5 = p.persons.get('5')!
  assert.equal(p5.gender, 'unknown', 'Người 5 chưa rõ giới tính')
  assert.equal(p5.isQuestion, true, 'Người 5 là người hỏi')

  assert.equal(p.marriages.length, 1, 'Có 1 cuộc hôn nhân')
  const m = p.marriages[0]
  assert.equal(m.parent1, '1')
  assert.equal(m.parent2, '2')
  assert.equal(m.children.length, 3, 'Có 3 nhánh con')
  assert.equal(m.children[0].type, 'single')
  assert.equal(m.children[1].type, 'identicalTwins')
  if (m.children[1].type === 'identicalTwins') {
    assert.deepEqual(m.children[1].ids, ['4', '5'], 'Sinh đôi cùng trứng 4 và 5')
  }
  assert.equal(m.children[2].type, 'fraternalTwins')
  if (m.children[2].type === 'fraternalTwins') {
    assert.deepEqual(m.children[2].ids, ['6', '7'], 'Sinh đôi khác trứng 6 và 7')
  }

  console.log('✓ Phân tích cú pháp: người, thuộc tính, sinh đôi, hỏi, bệnh')
}

// 2. Kiểm tra phát hiện lỗi cú pháp và vẽ phần đúng
{
  const badText = `
    1: nam bt
    2: nữ bt
    1 x 2 -> 3, 4
    4: nam bt
  `
  // 3 chưa được khai báo
  const p = parsePedigree(badText)
  assert.ok(p.errors.length > 0, 'Phát hiện lỗi người chưa khai báo')
  assert.ok(p.errors.some((e) => e.msg.includes('3') && e.msg.includes('chưa được khai báo')), 'Báo đúng người 3 chưa khai báo')
  // Người 3 được tự tạo tạm để hình vẫn vẽ được phần đúng
  assert.ok(p.persons.has('3'), 'Người 3 được tạo placeholder để vẽ tiếp')

  const img = renderPedigreeSvg({ text: badText })
  assert.ok(img.svg.includes('<svg'), 'Hình vẫn vẽ được phần hợp lệ')
  assert.ok(img.errors && img.errors.length > 0, 'Trả về danh sách lỗi cho modal')
  console.log('✓ Báo lỗi đúng dòng khi con chưa khai báo và vẫn vẽ phần đúng')
}

// 3. Kiểm tra suy thế hệ
{
  const pSample = parsePedigree(PEDIGREE_SAMPLE)
  const gens = assignGenerations(pSample.persons, pSample.marriages, pSample.errors)
  assert.equal(gens.get('1'), 0, '1 ở thế hệ I (0)')
  assert.equal(gens.get('2'), 0, '2 ở thế hệ I (0)')
  assert.equal(gens.get('3'), 0, '3 ở thế hệ I (0)')
  assert.equal(gens.get('4'), 0, '4 ở thế hệ I (0)')

  assert.equal(gens.get('5'), 1, '5 ở thế hệ II (1)')
  assert.equal(gens.get('6'), 1, '6 ở thế hệ II (1)')
  assert.equal(gens.get('7'), 1, '7 ở thế hệ II (1)')
  assert.equal(gens.get('8'), 1, '8 ở thế hệ II (1)')
  assert.equal(gens.get('9'), 1, '9 ở thế hệ II (1)')

  assert.equal(gens.get('10'), 2, '10 ở thế hệ III (2)')
  assert.equal(gens.get('11'), 2, '11 ở thế hệ III (2)')
  assert.equal(gens.get('12'), 2, '12 ở thế hệ III (2)')

  console.log('✓ Suy thế hệ đúng cho phả hệ mẫu 3 thế hệ (I–III)')
}

// 4. Kiểm tra người lấy vào từ ngoài
{
  const marryInText = `
    1: nam bt
    2: nữ bt
    1 x 2 -> 3, 4
    3: nam bt
    4: nữ bt
    5: nam bt
    4 x 5 -> 6
    6: nữ bt
  `
  const p = parsePedigree(marryInText)
  const gens = assignGenerations(p.persons, p.marriages, p.errors)
  assert.equal(gens.get('4'), 1, '4 ở thế hệ II')
  assert.equal(gens.get('5'), 1, 'Người lấy vào 5 cùng thế hệ II với vợ')
  assert.equal(gens.get('6'), 2, 'Con 6 ở thế hệ III')
  console.log('✓ Người lấy vào từ ngoài tự động nhận đúng thế hệ của vợ/chồng')
}

// Hàm kiểm tra không chồng lấn hộp bao
function assertNoOverlap(boxes: BoundingBox[], name: string) {
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      const xOverlap = a.x1 < b.x2 && a.x2 > b.x1
      const yOverlap = a.y1 < b.y2 && a.y2 > b.y1
      assert.ok(
        !(xOverlap && yOverlap),
        `[${name}] Hộp bao của ${a.id} ([${a.x1},${a.y1}]-[${a.x2},${a.y2}]) và ${b.id} ([${b.x1},${b.y1}]-[${b.x2},${b.y2}]) bị giao nhau!`,
      )
    }
  }
}

// 5. Kiểm tra bố cục không chồng: Phả hệ mẫu 3 thế hệ 12 người
{
  const parsed = parsePedigree(PEDIGREE_SAMPLE)
  const layout = layoutPedigree(parsed)
  assert.equal(layout.positions.size, 12, 'Đủ 12 người trong phả hệ')
  assertNoOverlap(layout.boxes, 'Phả hệ mẫu 3 thế hệ 12 người')
  console.log('✓ Bố cục phả hệ mẫu 12 người: không chồng hình')
}

// 6. Kiểm tra bố cục không chồng: Phả hệ có người lấy vào và sinh đôi
{
  const parsed = parsePedigree(PEDIGREE_SAMPLE_TWINS)
  const layout = layoutPedigree(parsed)
  assertNoOverlap(layout.boxes, 'Phả hệ có người lấy vào và sinh đôi')
  console.log('✓ Bố cục phả hệ người lấy vào và sinh đôi: không chồng hình')
}

// 7. Kiểm tra hôn nhân cận huyết
{
  const consangText = `
    1: nam bt
    2: nữ bt
    1 x 2 -> 3, 4
    3: nam bt
    4: nữ bt
    5: nữ bt
    6: nam bt
    3 x 5 -> 7
    6 x 4 -> 8
    7: nam bt
    8: nữ bt
    7 xx 8 -> 9
    9: nam bệnh
  `
  const parsed = parsePedigree(consangText)
  const layout = layoutPedigree(parsed)
  assertNoOverlap(layout.boxes, 'Hôn nhân cận huyết')

  const img = renderPedigreeSvg({ text: consangText, legend: true })
  assert.ok(img.svg.includes('stroke-width="1.6"'), 'Có đường nét đôi cho cận huyết')
  assert.ok(img.svg.includes('Kết hôn cận huyết'), 'Chú thích có mục kết hôn cận huyết')
  console.log('✓ Hôn nhân cận huyết vẽ nét đôi và chú thích đúng')
}

// 8. Kiểm tra Round-trip ToolDoc ↔ SVG
{
  const doc = {
    kind: 'pedigree' as const,
    spec: {
      text: PEDIGREE_SAMPLE,
      legend: true,
      carrierStyle: 'half' as const,
    },
  }
  const toolImg = renderTool(doc)
  assert.ok(toolImg.svg.includes('<svg'), 'Sinh SVG hợp lệ')
  assert.ok(toolImg.svg.includes('data:image/svg') === false, 'SVG là chuỗi thô')

  const parsedDoc = readToolDoc(toolImg.svg)
  assert.ok(parsedDoc, 'Đọc lại ToolDoc từ SVG')
  assert.equal(parsedDoc?.kind, 'pedigree')
  assert.deepEqual(parsedDoc, doc, 'Khớp hoàn toàn spec ban đầu sau round-trip')

  const fromJson = parseToolJson(JSON.stringify(doc))
  assert.deepEqual(fromJson, doc, 'Đọc lại từ JSON khớp')

  console.log('✓ Round-trip spec ↔ SVG thành công 100%')
}

// 9. Kiểm tra hiển thị chú thích theo đúng kí hiệu đã dùng
{
  const simpleText = `
    1: nam bt
    2: nữ bệnh
    1 x 2 -> 3
    3: nam bt
  `
  const img = renderPedigreeSvg({ text: simpleText, legend: true })
  assert.ok(img.svg.includes('Nam bình thường'), 'Có Nam bình thường')
  assert.ok(img.svg.includes('Nữ bị bệnh'), 'Có Nữ bị bệnh')
  assert.ok(!img.svg.includes('Mang gen'), 'Không có Mang gen vì không dùng')
  assert.ok(!img.svg.includes('Đã chết'), 'Không có Đã chết vì không dùng')
  assert.ok(!img.svg.includes('Chưa rõ giới tính'), 'Không có Chưa rõ giới tính vì không dùng')
  console.log('✓ Khung chú thích chỉ hiện các kí hiệu thực tế có dùng')
}

console.log('--- Mọi kiểm tra Sơ đồ phả hệ thành công hoàn hảo! ---')
