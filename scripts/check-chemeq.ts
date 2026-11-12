/**
 * Kiểm tra công cụ Cấu tạo & Phương trình hoá học (chạy: npx tsx --tsconfig tsconfig.app.json scripts/check-chemeq.ts).
 */
import assert from 'node:assert/strict'
import { renderStructBody, renderStructSvg } from '../src/lib/chem'
import { CHEMEQ_DEFAULT, renderChemEqSvg } from '../src/lib/chemEq'
import { toolFromRaw } from '../src/lib/docRewrite'
import { readToolDoc, renderTool } from '../src/lib/toolSpec'

const bodyOf = (svg: string) => svg.replace(/<desc>[\s\S]*?<\/desc>/, '')

// 1. Điện tích trong công thức cấu tạo (thu gọn & khung)
const zwitter = renderTool({ kind: 'struct', spec: { formula: 'CH3-CH(CH3)-CH(NH3^+)-COO^-', style: 'condensed' } })
assert.ok(!bodyOf(zwitter.svg).includes('^+'), 'không còn chữ thô ^+ trong SVG')
assert.ok(!bodyOf(zwitter.svg).includes('^-'), 'không còn chữ thô ^- trong SVG')
assert.ok(zwitter.svg.includes('>−<'), 'dấu trừ điện tích dùng U+2212 (−)')
assert.ok(zwitter.svg.includes('>+<'), 'dấu cộng điện tích +')

const skeletalIon = renderTool({ kind: 'struct', spec: { formula: 'CH3-CH(CH3)-CH(NH3^+)-COO^-', style: 'skeletal' } })
assert.ok(!bodyOf(skeletalIon.svg).includes('^+'), 'kiểu khung không còn ^+')
assert.ok(skeletalIon.svg.includes('>−<') && skeletalIon.svg.includes('>+<'), 'kiểu khung có điện tích chỉ số trên')

const phenolate = renderTool({ kind: 'struct', spec: { formula: 'C6H5-O^-', style: 'condensed' } })
assert.ok(phenolate.svg.includes('>−<'), 'O^- vẽ được thành O⁻')

const sulfateLike = renderStructSvg({ formula: 'CH3-SO3^2-', style: 'condensed' }, '')
assert.ok(sulfateLike.svg.includes('>2−<'), 'điện tích 2- thành 2−')

assert.throws(() => renderStructSvg({ formula: 'CH3-COO-', style: 'condensed' }, ''), /Thiếu nhóm nguyên tử/)
console.log('✓ Điện tích trong công thức cấu tạo (thu gọn & khung)')

// 2. Các công thức cấu tạo cũ giữ nguyên hành vi
const old1 = renderStructBody({ formula: 'CH3-CH(CH3)-CH2-OH', style: 'condensed' })
assert.ok(old1.height - old1.mainY > 40 && old1.mainY < 20, '1 nhánh đơn vẫn vẽ xuống dưới mạch chính')
const old2 = renderTool({ kind: 'struct', spec: { formula: 'CH3-C(=O)-O-CH2-CH2-CH2-CH3', style: 'skeletal' } })
assert.ok(old2.svg.includes('<svg'), 'công thức khung cũ vẽ bình thường')
console.log('✓ Công thức cấu tạo cũ giữ nguyên')

// 3. Ví dụ valin (3 chất cấu tạo + 2 mũi tên ⇌ + điều kiện −OH⁻ / +H⁺)
const valinEq =
  '{CH3-CH(CH3)-CH(NH3^+)-COOH} <=> [-OH^- | +H^+] {CH3-CH(CH3)-CH(NH3^+)-COO^-} <=> [-OH^- | +H^+] {CH3-CH(CH3)-CH(NH2)-COO^-}'
const valinDoc = {
  kind: 'chemeq' as const,
  spec: { equations: valinEq, autoBalance: true, fontSize: 17, align: 'center' as const },
}
const valinImg = renderTool(valinDoc)
assert.equal(valinImg.errors, undefined, 'tự cân bằng bỏ qua dòng có {...} và nhiều mũi tên mà không báo lỗi')
assert.deepEqual(readToolDoc(valinImg.svg), valinDoc, 'round-trip ToolDoc từ SVG')
assert.ok(valinImg.svg.includes('−OH'), 'điều kiện có dấu trừ U+2212 (−OH)')
assert.ok(valinImg.svg.includes('+H'), 'điều kiện có +H')
assert.ok(!bodyOf(valinImg.svg).includes('^+'), 'không còn ^+ thô trong SVG valin')
assert.ok(!bodyOf(valinImg.svg).includes('^-'), 'không còn ^- thô trong SVG valin')
// Kiểm tra hướng nhánh của valin: CH3 ở trên (mainY > 40), NH3+ ở dưới (height - mainY > 40)
const valinFrag = renderStructBody({ formula: 'CH3-CH(CH3)-CH(NH3^+)-COOH', style: 'condensed' })
assert.ok(valinFrag.mainY > 40, 'nhánh CH3 đầu vẽ lên trên mạch chính')
assert.ok(valinFrag.height - valinFrag.mainY > 40, 'nhánh NH3+ sau vẽ xuống dưới mạch chính')
console.log('✓ Ví dụ valin cân bằng 3 chất, 2 mũi tên, −OH⁻ / +H⁺, nhánh CH3 trên / NH3+ dưới')

// 4. Hệ số trước {...}, nối đôi = trong {...}, nhiều dòng căn giữa / trái
const mixedImg = renderChemEqSvg(
  {
    equations: [
      '2{CH3-CH2-OH} + 2Na -> 2{CH3-CH2-ONa} + H2^',
      '{CH2=CH2} + H2 -> [Ni, t°] {CH3-CH3}',
      'A -> [t°] B -> [xt] C',
    ].join('\n'),
    autoBalance: false,
    fontSize: 17,
    align: 'center',
  },
  '',
)
assert.ok(mixedImg.svg.includes('>2<') && mixedImg.svg.includes('Ni, t°'), 'hệ số trước {...} và nối đôi = trong {...}')

// Điều kiện cuối dòng không áp cho dòng nhiều mũi tên
const multiTrail = renderChemEqSvg(
  { equations: 'A -> [dk1] B -> C [t°]', autoBalance: false, fontSize: 17, align: 'left' },
  '',
)
assert.ok(multiTrail.svg.includes('C [t°]'), 'điều kiện cuối dòng không gắn lên mũi tên thứ 2 khi có nhiều mũi tên')

// 5. Các phương trình cũ + tự cân bằng vẫn chạy đúng
const defImg = renderTool({ kind: 'chemeq', spec: CHEMEQ_DEFAULT })
assert.ok(defImg.svg.includes('KMnO') && defImg.svg.includes('NH'), 'ví dụ mặc định vẫn vẽ đúng')

const kmno4 = renderChemEqSvg(
  { equations: 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', autoBalance: true, fontSize: 17, align: 'center' },
  '',
)
assert.equal(kmno4.errors, undefined)
assert.ok(kmno4.svg.includes('>2KMnO') && kmno4.svg.includes('16HCl') && kmno4.svg.includes('5Cl') && kmno4.svg.includes('8H'), 'tự cân bằng KMnO4 + HCl')

const alHno3 = renderChemEqSvg(
  { equations: 'Al + HNO3 -> Al(NO3)3 + NO + H2O', autoBalance: true, fontSize: 17, align: 'center' },
  '',
)
assert.equal(alHno3.errors, undefined)
assert.ok(alHno3.svg.includes('4HNO') && alHno3.svg.includes('2H'), 'tự cân bằng Al + HNO3')
console.log('✓ Phương trình cũ + tự cân bằng KMnO4 + HCl, Al + HNO3')

// 6. AI toolFromRaw + kiểm lỗi nhập
const aiEq = toolFromRaw({ kind: 'chemeq', equations: valinEq, autoBalance: false })
assert.equal(aiEq.kind, 'chemeq')
const aiStruct = toolFromRaw({ kind: 'struct', formula: 'CH3-CH(NH3^+)-COO^-' })
assert.equal(aiStruct.kind, 'struct')

assert.throws(() => renderChemEqSvg({ ...CHEMEQ_DEFAULT, equations: '{} -> A' }, ''), /trống/)
assert.throws(() => renderChemEqSvg({ ...CHEMEQ_DEFAULT, equations: '{CH3-} -> A' }, ''), /Dòng 1:/)
assert.throws(() => renderChemEqSvg({ ...CHEMEQ_DEFAULT, equations: '{CH3-COOH -> A' }, ''), /Thiếu dấu "}"/)
assert.throws(() => renderChemEqSvg({ ...CHEMEQ_DEFAULT, equations: 'A -> -> B' }, ''), /Thiếu chất/)
console.log('✓ AI toolFromRaw & bắt lỗi nhập liệu')
