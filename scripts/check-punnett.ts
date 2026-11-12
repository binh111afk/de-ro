import { parsePunnettCross, renderPunnettSvg, formatRatioString, exportPunnettToText, type PunnettSpec } from '../src/lib/punnett'
import { renderTool, readToolDoc, parseToolJson } from '../src/lib/toolSpec'

let passed = 0
let failed = 0

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++
    console.log(`  ✓ ${msg}`)
  } else {
    failed++
    console.error(`  ✗ ${msg}`)
  }
}

console.log('=== KIỂM TRA CÔNG CỤ BẢNG LAI PUNNETT ===\n')

// 1. Aa x Aa -> KG 1 AA : 2 Aa : 1 aa; KH 3 : 1
console.log('Test 1: Aa x Aa (1 cặp gen, trội hoàn toàn)')
{
  const spec: PunnettSpec = { cross: 'Aa x Aa' }
  const res = parsePunnettCross(spec)
  const kgStr = formatRatioString(res.genotypeRatios)
  const khStr = formatRatioString(res.phenotypeRatios)
  assert(kgStr === '1 AA : 2 Aa : 1 aa', `Tỉ lệ KG: ${kgStr} (kỳ vọng 1 AA : 2 Aa : 1 aa)`)
  assert(khStr.startsWith('3') && khStr.includes(': 1'), `Tỉ lệ KH: ${khStr} (kỳ vọng 3 : 1)`)
  assert(res.grid.length === 2 && res.grid[0].length === 2, `Khung Punnett 2 × 2`)
}

// 2. AaBb x AaBb -> khung 4 × 4, KH 9 : 3 : 3 : 1
console.log('\nTest 2: AaBb x AaBb (2 cặp gen phân li độc lập)')
{
  const spec: PunnettSpec = { cross: 'AaBb x AaBb' }
  const res = parsePunnettCross(spec)
  assert(res.grid.length === 4 && res.grid[0].length === 4, `Khung Punnett 4 × 4 (${res.grid.length} × ${res.grid[0].length})`)
  const khNums = res.phenotypeRatios.map((it) => it.ratioNum).join(' : ')
  assert(khNums === '9 : 3 : 3 : 1', `Tỉ lệ KH: ${khNums} (kỳ vọng 9 : 3 : 3 : 1)`)
}

// 3. AaBb x Aabb -> khung 4 × 2, KH 3 : 3 : 1 : 1
console.log('\nTest 3: AaBb x Aabb (lai phân tích / dị hợp 1 cặp)')
{
  const spec: PunnettSpec = { cross: 'AaBb x Aabb' }
  const res = parsePunnettCross(spec)
  // Bố Aabb có 2 giao tử (Ab, ab), mẹ AaBb có 4 giao tử (AB, Ab, aB, ab)
  assert(res.grid.length === 2 && res.grid[0].length === 4, `Khung Punnett hàng = ♂ (2), cột = ♀ (4) (tổng 8 ô)`)
  const khNums = res.phenotypeRatios.map((it) => it.ratioNum).join(' : ')
  assert(khNums === '3 : 3 : 1 : 1', `Tỉ lệ KH: ${khNums} (kỳ vọng 3 : 3 : 1 : 1)`)
}

// 4. XAXa x XaY -> con trai 1/2 bệnh, tách theo giới
console.log('\nTest 4: XAXa x XaY (gen liên kết giới tính trên X)')
{
  const spec: PunnettSpec = {
    cross: 'XAXa x XaY',
    traits: [{ gene: 'A', phenotypes: ['bình thường', 'bệnh'] }],
  }
  const res = parsePunnettCross(spec)
  assert(res.isSexLinked, 'Nhận diện đúng gen liên kết giới tính X')
  assert(Boolean(res.femalePhenotypeRatios && res.malePhenotypeRatios), 'Tách tỉ lệ kiểu hình theo giới tính')

  const maleNums = res.malePhenotypeRatios?.map((it) => `${it.ratioNum} ${it.label}`).join(' : ')
  assert(
    maleNums?.includes('1 bình thường : 1 bệnh') ?? false,
    `Giới đực (♂): ${maleNums} (con trai 1/2 bệnh)`,
  )

  const femaleNums = res.femalePhenotypeRatios?.map((it) => `${it.ratioNum} ${it.label}`).join(' : ')
  assert(
    femaleNums?.includes('1 bình thường : 1 bệnh') ?? false,
    `Giới cái (♀): ${femaleNums}`,
  )
}

// 5. Aa x Aa trội không hoàn toàn -> KH 1 : 2 : 1
console.log('\nTest 5: Aa x Aa trội không hoàn toàn')
{
  const spec: PunnettSpec = {
    cross: 'Aa x Aa',
    traits: [{ gene: 'A', dominance: 'incomplete', phenotypes: ['hoa đỏ', 'hoa hồng', 'hoa trắng'] }],
  }
  const res = parsePunnettCross(spec)
  const khNums = res.phenotypeRatios.map((it) => it.ratioNum).join(' : ')
  const khStr = formatRatioString(res.phenotypeRatios)
  assert(khNums === '1 : 2 : 1', `Tỉ lệ KH: ${khNums} (kỳ vọng 1 : 2 : 1)`)
  assert(khStr.includes('hoa đỏ') && khStr.includes('hoa hồng') && khStr.includes('hoa trắng'), `Hiển thị đủ 3 kiểu hình: ${khStr}`)
}

// 6. AaBbDd x AaBbDd -> khung 8 × 8 vẫn vừa trang
console.log('\nTest 6: AaBbDd x AaBbDd (3 cặp gen, khung 8 × 8)')
{
  const spec: PunnettSpec = { cross: 'AaBbDd x AaBbDd' }
  const res = parsePunnettCross(spec)
  assert(res.grid.length === 8 && res.grid[0].length === 8, `Khung 8 × 8 (${res.grid.length} × ${res.grid[0].length} = 64 ô)`)
  const img = renderPunnettSvg(spec, '<desc>test</desc>')
  assert(img.width <= 600, `Bề rộng SVG ${img.width}px <= 600px (vừa trang in A4)`)
  assert(img.height > 0 && img.svg.includes('<svg'), `Sinh SVG thành công (chiều cao ${img.height}px)`)
}

// 7. Chế độ để trống cho học sinh điền
console.log('\nTest 7: Chế độ để trống cho học sinh điền (blankGrid)')
{
  const spec: PunnettSpec = { cross: 'AaBb x AaBb', blankGrid: true }
  const img = renderPunnettSvg(spec, '<desc>test</desc>')
  assert(!img.svg.includes('>AaBb<') && !img.svg.includes('>AABB<'), 'Các ô kiểu gen không chứa đáp án')
  assert(img.svg.includes('>AB<') && img.svg.includes('>ab<'), 'Các giao tử đầu hàng và đầu cột vẫn giữ nguyên')
}

// 8. Đặt tên kiểu hình tùy biến
console.log('\nTest 8: Đặt tên kiểu hình bằng lời cho từng gen')
{
  const spec: PunnettSpec = {
    cross: 'AaBb x Aabb',
    traits: [
      { gene: 'A', phenotypes: ['hạt vàng', 'hạt xanh'] },
      { gene: 'B', phenotypes: ['vỏ trơn', 'vỏ nhăn'] },
    ],
  }
  const res = parsePunnettCross(spec)
  const khStr = formatRatioString(res.phenotypeRatios)
  assert(khStr.includes('hạt vàng, vỏ trơn') && khStr.includes('hạt xanh, vỏ nhăn'), `Tỉ lệ kiểu hình ghi chữ: ${khStr}`)
}

// 9. Báo lỗi rõ ràng
console.log('\nTest 9: Báo lỗi phép lai không hợp lệ')
{
  let errMismatched = ''
  try {
    parsePunnettCross({ cross: 'AaBb x Aacc' })
  } catch (e) {
    errMismatched = e instanceof Error ? e.message : String(e)
  }
  assert(errMismatched.includes('không khớp'), `Báo lỗi không khớp cặp gen: "${errMismatched}"`)

  let errTooMany = ''
  try {
    parsePunnettCross({ cross: 'AaBbCcDd x AaBbCcDd' })
  } catch (e) {
    errTooMany = e instanceof Error ? e.message : String(e)
  }
  assert(errTooMany.includes('Tối đa 3 cặp gen'), `Báo lỗi quá 3 cặp gen: "${errTooMany}"`)

  let errSymbol = ''
  try {
    parsePunnettCross({ cross: 'AaB1 x AaBb' })
  } catch (e) {
    errSymbol = e instanceof Error ? e.message : String(e)
  }
  assert(errSymbol.includes('Ký hiệu lạ') || errSymbol.includes('không hợp lệ'), `Báo lỗi ký hiệu lạ: "${errSymbol}"`)
}

// 10. Round-trip toolSpec: renderTool <-> readToolDoc <-> parseToolJson
console.log('\nTest 10: Round-trip toolSpec ({kind: "punnett", spec})')
{
  const spec: PunnettSpec = {
    cross: 'AaBb x Aabb',
    traits: [{ gene: 'A', dominance: 'complete', phenotypes: ['hạt vàng', 'hạt xanh'] }],
    showGametes: true,
    showGrid: true,
    showGenotypeRatio: true,
    showPhenotypeRatio: true,
    blankGrid: false,
    colorByPhenotype: true,
    fontSize: 14,
  }
  const doc = { kind: 'punnett' as const, spec }
  const img = renderTool(doc)
  assert(img.svg.includes('<desc>'), 'SVG có chứa thẻ <desc>')

  const readBack = readToolDoc(img.svg)
  assert(readBack !== null && readBack.kind === 'punnett', 'readToolDoc đọc lại đúng kind = punnett')
  const readSpec = readBack?.spec as PunnettSpec
  assert(readSpec.cross === 'AaBb x Aabb', `readToolDoc phục hồi đúng cross: "${readSpec?.cross}"`)

  const jsonStr = JSON.stringify(doc)
  const parseBack = parseToolJson(jsonStr)
  assert(parseBack !== null && parseBack.kind === 'punnett', 'parseToolJson đọc lại đúng từ JSON attr plot')
}

console.log(`\n=== KẾT QUẢ: ${passed} PASS, ${failed} FAIL ===`)
if (failed > 0) {
  process.exit(1)
}
