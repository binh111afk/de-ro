import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { figureImageAttrs } from '../src/examEditor/toolImages'
import { parseScene, renderSceneSvg, SCENE_DEFAULT } from '../src/lib/scene'
import { parseToolJson, readToolDoc, renderTool, type ToolDoc } from '../src/lib/toolSpec'

const star = [
  '_O(0; 0) _A(0; 3) _B(2.598076211; 1.5) _C(2.598076211; -1.5)',
  '_D(0; -3) _E(-2.598076211; -1.5) _F(-2.598076211; 1.5)',
  ...['_O', '_A', '_B', '_C', '_D', '_E', '_F'].map((p) => 'tròn ' + p + ' 0.55'),
  ...['_A', '_B', '_C', '_D', '_E', '_F'].map((p) => 'đứt _O-' + p),
].join('\n')

const cycle = [
  '_A(-2.35; 2.35) _B(2.35; 2.35) _C(2.35; -2.35) _D(-2.35; -2.35) _O(0; 0)',
  'hộp _A 2.1 1.1 "Bay hơi" bo',
  'hộp _B 2.1 1.1 tô xanh "Ngưng tụ"',
  'hộp _C 2.1 1.1 "Mưa"',
  'hộp _D 2.1 1.1 "Thấm"',
  'mũi tên _A-_B',
  'mũi tên _B-_C',
  'mũi tên _C-_D',
  'mũi tên _D-_A',
  'chữ _O "Chu trình nước" đậm',
].join('\n')

const tags = (svg: string, tag: string) => [...svg.matchAll(new RegExp('<' + tag + '\\b[^>]*>', 'g'))].map((m) => m[0])
const count = (svg: string, tag: string, n: number) => assert.equal(tags(svg, tag).length, n, tag)
const attr = (tag: string, name: string) => new RegExp('\\b' + name + '="([^"]*)"').exec(tag)?.[1]
const numAttr = (tag: string, name: string) => Number(attr(tag, name))
const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.6, actual + ' ≈ ' + expected)

// Khung tính từ biên hình theo toạ độ đã khai báo và lề 62 px.
function frame(svg: string, spanX: number, spanY: number) {
  const k = Math.min(300 / spanX, 230 / spanY)
  const w = Math.round(spanX * k + 124)
  const h = Math.round(spanY * k + 124)
  assert.equal(attr(tags(svg, 'svg')[0], 'viewBox'), '0 0 ' + w + ' ' + h)
  return { k, w, h }
}

const touching = renderSceneSvg({ text: [
  '_A(0; 0) _B(2.7; -1.5)', 'hộp _A 2 1 "Xử lý"', 'elip _B 1 0.7 "Kết thúc"', 'mũi tên _A-_B',
].join('\n') }, '').svg
const terminal = tags(touching, 'ellipse')[0]
const box = tags(touching, 'rect').at(-1)!
const nearestX = Math.min(numAttr(box, 'x') + numAttr(box, 'width'), Math.max(numAttr(box, 'x'), numAttr(terminal, 'cx')))
const nearestY = Math.min(numAttr(box, 'y') + numAttr(box, 'height'), Math.max(numAttr(box, 'y'), numAttr(terminal, 'cy')))
assert.ok(Math.hypot((nearestX - numAttr(terminal, 'cx')) / numAttr(terminal, 'rx'), (nearestY - numAttr(terminal, 'cy')) / numAttr(terminal, 'ry')) > 1)
assert.equal(touching.match(/marker-end=/g)?.length, 1)

assert.equal(parseScene(star).cmds.length, 13)
const starSvg = renderSceneSvg({ text: star }, '').svg
count(starSvg, 'circle', 7)
count(starSvg, 'ellipse', 0)
count(starSvg, 'rect', 1) // Nền trắng
count(starSvg, 'text', 0)
assert.equal(starSvg.match(/stroke-dasharray=/g)?.length, 6)
assert.ok(starSvg.lastIndexOf('stroke-dasharray=') < starSvg.indexOf('<circle'))
const starFrame = frame(starSvg, 3 * Math.sqrt(3) + 1.1, 7.1)
const circles = tags(starSvg, 'circle')
for (const circle of circles) {
  near(numAttr(circle, 'r'), 0.55 * starFrame.k)
  assert.equal(attr(circle, 'fill'), 'none')
}
near(Math.min(...circles.map((c) => numAttr(c, 'cx') - numAttr(c, 'r'))), 62)
near(Math.max(...circles.map((c) => numAttr(c, 'cx') + numAttr(c, 'r'))), starFrame.w - 62)
near(Math.min(...circles.map((c) => numAttr(c, 'cy') - numAttr(c, 'r'))), 62)
near(Math.max(...circles.map((c) => numAttr(c, 'cy') + numAttr(c, 'r'))), starFrame.h - 62)

assert.equal(parseScene(cycle).cmds.length, 9)
const cycleDoc: ToolDoc = { kind: 'scene', spec: { text: cycle } }
const cycleSvg = renderTool(cycleDoc).svg
count(cycleSvg, 'circle', 0)
count(cycleSvg, 'ellipse', 0)
count(cycleSvg, 'rect', 5)
count(cycleSvg, 'text', 5)
const { k, w, h } = { k: Math.min(300 / 6.8, 230 / 5.8), w: 394, h: 358 }
assert.equal(attr(tags(cycleSvg, 'svg')[0], 'viewBox'), '0 0 394 358')
const boxes = tags(cycleSvg, 'rect').slice(1)
assert.ok(numAttr(boxes[0], 'rx') > 0)
assert.match(attr(boxes[1], 'fill') ?? '', /^#[\da-f]{6}$/)
assert.notEqual(attr(boxes[1], 'fill'), '#ffffff')
near(numAttr(boxes[0], 'x'), 62)
near(numAttr(boxes[1], 'x') + numAttr(boxes[1], 'width'), w - 62)
near(numAttr(boxes[0], 'y'), 66)
near(numAttr(boxes[2], 'y') + numAttr(boxes[2], 'height'), h - 62)
const arrows = tags(cycleSvg, 'path').filter((p) => p.includes('marker-end='))
assert.equal(arrows.length, 4)
assert.ok(cycleSvg.lastIndexOf('marker-end=') < cycleSvg.indexOf(boxes[0]))
const [, endX, endY] = /L([\d.]+) ([\d.]+)/.exec(attr(arrows[0], 'd') ?? '')!
near(Number(endX), numAttr(boxes[1], 'x'))
near(Number(endY), numAttr(boxes[1], 'y') + 0.55 * k)
for (const label of ['Bay hơi', 'Ngưng tụ', 'Mưa', 'Thấm', 'Chu trình nước']) assert.ok(label.split(' ').every((w) => cycleSvg.includes(w)))

const labelId = attr(tags(cycleSvg, 'text').at(-1)!, 'data-lbl')!
assert.ok(labelId)
const movedDoc: ToolDoc = { kind: 'scene', spec: { text: cycle, labelPos: { [labelId]: [12, -5] } } }
const attrs = figureImageAttrs(movedDoc)
assert.deepEqual(readToolDoc(attrs.src), movedDoc)
assert.deepEqual(parseToolJson(attrs.plot), movedDoc)
assert.match(tags(renderTool(movedDoc).svg, 'text').at(-1)!, /transform="translate\(12 -5\)"/)

const extra = [
  '_O(0; 0) _A(-3; 0)',
  'elip _O 1,2 0.6 đứt tô #FF0000 “A(99; 99) & B < C”',
  'mũi tên đứt _A-_O',
].join('\n')
assert.equal(parseScene(extra).pts.size, 2)
const extraSvg = renderSceneSvg({ text: extra }, '').svg
count(extraSvg, 'ellipse', 1)
count(extraSvg, 'text', 1)
frame(extraSvg, 4.2, 1.2)
assert.match(tags(extraSvg, 'ellipse')[0], /fill="#ffcccc".*stroke-dasharray=/)
assert.match(extraSvg, /A\(99; 99\)(?: |<\/tspan><tspan[^>]*>)&amp;(?: |<\/tspan><tspan[^>]*>)B &lt; C/)
assert.match(extraSvg, /stroke-dasharray="5 4" marker-end=/)

const longLine = 'M'.repeat(60)
const textOnly = 'chữ _O "' + longLine + '\\nDòng 2" to đậm\r\n_O(0; 0)'
const wordImage = renderSceneSvg({ text: textOnly }, '')
count(wordImage.svg, 'text', 1)
count(wordImage.svg, 'tspan', 2)
assert.match(wordImage.svg, /font-size="22" font-weight="bold"/)
const [first, second] = tags(wordImage.svg, 'tspan')
near(numAttr(first, 'x'), wordImage.width / 2)
assert.ok(numAttr(first, 'x') - longLine.length * 22 / 2 >= 62)
near(numAttr(second, 'y') - numAttr(first, 'y'), 26.4)
assert.ok(numAttr(first, 'y') > 62 && numAttr(second, 'y') + 10 < wordImage.height - 62)

const sector = 'O(0; 0) A(4; 0) B(2; 3.46)\nquạt O 4 0 60 tô vàng'
const semicircle = 'O(0; 0) A(4; 0) B(-4; 0)\ncung O 4 0 180\nAB'
const stadium = [
  '_L(-3; 0) _R(3; 0) _A(-3; 1.5) _B(3; 1.5) _C(3; -1.5) _D(-3; -1.5)',
  'cung _R 1.5 -90 90',
  'cung _L 1.5 90 270',
  '_A-_B, _C-_D',
].join('\n')
const house = [
  '_A(0; 0) _B(4; 0) _C(4; 4) _D(0; 4) _E(2; 6) _O(2; 1)',
  '_A-_B-_C-_D tô trắng',
  '_D-_C-_E tô đỏ',
  '_A-_B',
  'hộp _O 1.2 2 tô nâu',
].join('\n')
const draw = (text: string) => renderSceneSvg({ text }, '').svg
const paths = (svg: string) => tags(svg, 'path').slice(1) // Bỏ đầu mũi tên trong defs.
const pathTokens = (tag: string) => attr(tag, 'd')!.match(/[MLAZ]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!
function checkPath(tag: string, expected: (string | number)[]) {
  const tokens = pathTokens(tag)
  assert.equal(tokens.length, expected.length, tag)
  expected.forEach((value, i) => {
    if (typeof value === 'number') near(Number(tokens[i]), value)
    else assert.equal(tokens[i], value)
  })
}

assert.equal(parseScene(sector).cmds.length, 1) // Hai bán kính đều nằm trong path của hình quạt.
const sectorSvg = draw(sector)
const sectorHeight = 4 * Math.sin(Math.PI / 3)
const sectorFrame = frame(sectorSvg, 4, sectorHeight)
const sectorRadius = 4 * sectorFrame.k
const [sectorPath] = paths(sectorSvg)
assert.equal(paths(sectorSvg).length, 1)
assert.equal(attr(sectorPath, 'fill'), '#fbf0ce')
assert.ok(Math.abs(Number(pathTokens(sectorPath)[7]) - sectorRadius) < 1e-8)
checkPath(sectorPath, ['M', 62, 292, 'L', 62 + sectorRadius, 292, 'A', sectorRadius, sectorRadius, '0', '0', '0', 62 + 2 * sectorFrame.k, 62, 'Z'])

assert.equal(parseScene(semicircle).cmds.length, 2)
const semiSvg = draw(semicircle)
frame(semiSvg, 8, 4) // Đỉnh y = 4 dù mọi điểm khai báo đều có y = 0.
const [diameter, semiPath] = paths(semiSvg)
checkPath(diameter, ['M', 362, 212, 'L', 62, 212])
checkPath(semiPath, ['M', 362, 212, 'A', 150, 150, '0', '0', '0', 62, 212])
assert.equal(paths(semiSvg).length, 2)
assert.equal(attr(semiPath, 'fill'), 'none')

assert.equal(parseScene(stadium).cmds.length, 4)
const stadiumSvg = draw(stadium)
frame(stadiumSvg, 9, 3) // Hai đầu ở x = ±4.5, biên ngang ở y = ±1.5.
const [topEdge, bottomEdge, rightArc, leftArc] = paths(stadiumSvg)
checkPath(topEdge, ['M', 112, 62, 'L', 312, 62])
checkPath(bottomEdge, ['M', 312, 162, 'L', 112, 162])
checkPath(rightArc, ['M', 312, 162, 'A', 50, 50, '0', '0', '0', 312, 62])
checkPath(leftArc, ['M', 112, 62, 'A', 50, 50, '0', '0', '0', 112, 162])
assert.equal(paths(stadiumSvg).length, 4)

const houseSvg = draw(house)
assert.equal(parseScene(house).cmds.length, 4)
frame(houseSvg, 4, 6)
const [base, walls, roof] = paths(houseSvg)
assert.equal(attr(base, 'fill'), 'none')
assert.equal(attr(walls, 'fill'), '#ffffff')
assert.equal(attr(roof, 'fill'), '#f7d4d4')
for (const p of [walls, roof]) assert.equal(attr(p, 'stroke'), '#111')
const door = tags(houseSvg, 'rect')[1]
assert.ok(houseSvg.indexOf(roof) < houseSvg.indexOf(door))
const captionedHouse = draw(house + '\nchữ _O "Cửa"\nnhãn _A-_B "Đáy"')
assert.ok(captionedHouse.indexOf(roof) >= 0 && captionedHouse.indexOf(roof) < captionedHouse.indexOf('<text'))
assert.match(draw('A(0; 0) B(3; 0) C(0; 3)\nABC tô #ff0000'), /stroke="#111" fill="#ffcccc"/)

// Qua 360°, cung lớn, một vòng tròn đủ và vùng tô giữa cung với dây.
const arcOnly = (command: string) => draw('_O(0; 0)\n' + command)
assert.equal(arcOnly('cung _O 4 330 390'), arcOnly('cung _O 4 330 30'))
const wrapped = arcOnly('cung _O 4 330 390')
frame(wrapped, 4, 4)
const major = arcOnly('cung _O 4 0 270 đứt tô #ff0000 "Cung & dây"')
assert.match(paths(major)[0], /A\d[^"]* 0 1 0 [^"]+" stroke="#111" fill="#ffcccc".*stroke-dasharray="5 4"/)
assert.deepEqual(pathTokens(paths(major)[0]).filter((t) => /^[MLAZ]$/.test(t)), ['M', 'A'])
assert.match(major, /data-lbl="free:_O:0"[^>]*>Cung &amp; dây<\/text>/)
const full = arcOnly('quạt _O 4 30 390 đứt')
frame(full, 8, 8)
assert.match(paths(full)[0], /stroke-dasharray="5 4"/)
assert.deepEqual(pathTokens(paths(full)[0]).filter((t) => /^[MLAZ]$/.test(t)), ['M', 'A', 'A', 'Z'])

for (const [command, message] of [
  ['tròn O', /bán kính/],
  ['tròn O 0', /lớn hơn 0/],
  ['elip O 1 -0.5', /bán kính trục y/],
  ['hộp O 2', /chiều cao/],
  ['hộp O 2 1 tô lạ', /màu tô không hợp lệ/],
  ['hộp O 2 1 tô', /thiếu màu tô/],
  ['tròn O 1 bo', /tuỳ chọn/],
  ['chữ A "chữ"', /chưa khai báo điểm/],
  ['mũi tên O', /cần đúng 2 điểm/],
  ['cung', /thiếu điểm tâm/],
  ['quạt 4 0 60', /thiếu điểm tâm/],
  ['cung A 4 0 60', /chưa khai báo điểm/],
  ['cung O', /bán kính/],
  ['quạt O -4 0 60', /lớn hơn 0/],
  ['cung O 4 sai 60', /góc đầu phải là số/],
  ['quạt O 4 0', /góc cuối phải là số/],
  ['cung O 4 0 60°', /góc cuối phải là số/],
  ['cung O 4 0 60 tô lạ', /màu tô không hợp lệ/],
  ['quạt O 4 0 60 tô', /thiếu màu tô/],
] as const) {
  assert.throws(() => parseScene('O(0; 0)\n\n' + command), (err) =>
    err instanceof Error && err.message.startsWith('Dòng 3: ') && message.test(err.message))
}
assert.throws(() => parseScene('A(0; 0) B(3; 0) C(0; 3)\nABC tô lạ'), /^Error: Dòng 2: màu tô không hợp lệ/)

// SHA-256 của SVG (cập nhật kiểu chữ SGK vòng 2: nhãn điểm 19px, nhãn cạnh/góc/kích thước 18px).
for (const [spec, hash] of [
  [SCENE_DEFAULT, '25498c4f19bc8d399e68ca7e6ee7b7dda1912fd9587145e9f10dd70f3c71c337'],
  [{ text: 'A(0; 0) B(4; 0) C(4; 3) D(0; 3) _E(2; 1)\nABCD\nA-_E*\ngóc ABC "90°"' }, '87d15e6a8802e94cce970bdfbe080ea31ea5039ae36223102f70b7882cfb9bf8'],
  [{ text: 'A(0; 0) B(4; 0) C(0; 3)\nhình cái thang CB\nhình cây AC\nnhãn CB “5 m”' }, '35254b169124d07d8eeb0eeceb58500ba0f65be5f95371899d0fa7e21a60f55e'],
] as const) {
  assert.equal(createHash('sha256').update(renderSceneSvg(spec, '').svg).digest('hex'), hash)
}

// điểm khai báo _A, _B mà lệnh viết AB / AB-BC (thiếu dấu _) vẫn ra đúng hình như viết _A-_B
{
  const hidden = renderSceneSvg({ text: '_A(0; 0) _B(4; 0) _C(2; 3)\n_A-_B\n_B-_C\n_C-_A' }, '').svg
  const lenient = renderSceneSvg({ text: '_A(0; 0) _B(4; 0) _C(2; 3)\nAB\nBC\nCA' }, '').svg
  assert.equal(lenient, hidden)
  const polygon = renderSceneSvg({ text: '_A(0; 0) _B(4; 0) _C(2; 3)\nABC tô đỏ' }, '').svg
  assert.equal(polygon, renderSceneSvg({ text: '_A(0; 0) _B(4; 0) _C(2; 3)\n_A_B_C tô đỏ' }, '').svg)
  // có sẵn điểm A thì A là A, không bị hiểu thành _A
  assert.doesNotThrow(() => renderSceneSvg({ text: 'A(0; 0) _A(1; 1) B(4; 0)\nAB' }, ''))
}

// --- Kiểm thử các tính năng nâng cấp mới ---
{
  // 1. Cung elip (nửa trước liền, nửa sau đứt, xoay góc)
  const ellArcSvg = draw('_O(0; 0)\ncung elip _O 2 0.8 180 360\ncung elip _O 2 0.8 0 180 đứt\ncung elip _O 1 0.4 0 90 xoay 30')
  assert.equal(paths(ellArcSvg).length, 3)
  assert.match(paths(ellArcSvg)[0], /A[\d.]+ [\d.]+ 0 0 0/)
  assert.match(paths(ellArcSvg)[1], /stroke-dasharray="5 4"/)
  assert.match(paths(ellArcSvg)[2], /A[\d.]+ [\d.]+ -30 0 0/)

  // 2. Đường cong mượt: 3 điểm dùng Q (parabol), >= 4 điểm dùng C, kín + mũi tên + màu
  const qSvg = draw('O(0; 0) _M(3; -1) P(6; 0)\ncong O-_M-P dày màu lam')
  assert.match(attr(paths(qSvg)[0], 'd') ?? '', /^M[\d.-]+ [\d.-]+Q[\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+$/)
  assert.match(paths(qSvg)[0], /stroke="#0284c7" stroke-width="2.2"/)

  const cSvg = draw('_A(0; 0) _B(1; 2) _C(3; 1) _D(4; 3)\ncong _A-_B-_C-_D kín tô bóng rêu không viền')
  assert.match(cSvg, /<linearGradient id="scgr-7c8a56"/)
  assert.match(attr(paths(cSvg)[0], 'd') ?? '', /^M[\d.-]+ [\d.-]+(?:C[\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+){4}Z$/)
  assert.match(paths(cSvg)[0], /stroke="none"[^>]*fill="url\(#scgr-7c8a56\)"|fill="url\(#scgr-7c8a56\)"[^>]*stroke="none"|stroke="none"/)

  // 3. Miền kín cong `vùng` + không kéo điểm tâm ẩn của cung trong vùng vào khung
  const regSvg = draw([
    '_K(0; 50)',
    '_A(-1; 0) _B(1; 0) _C(1; -1) _D(-1; -1)',
    'vùng cung _K 50.01 268.85 271.15; đoạn _B-_C; đoạn _C-_D; đoạn _D-_A tô đậm đen nền',
  ].join('\n'))
  assert.match(paths(regSvg)[0], /fill="#111111"/)
  assert.ok(regSvg.includes('viewBox="0 0 424 ')) // spanX ≈ 2, spanY ≈ 1 → k ≈ 150, không bị điểm _K(0; 50) kéo phình

  // 4. Lớp `nền`: vẽ trước đoạn thẳng & góc vuông; hình `nền` không cắt đoạn nối tâm
  const bgSvg = draw([
    '_O1(-2; 0) _O2(2; 0) _A(-2; 1) _B(2; 1)',
    'tròn _O1 1 tô xám nền',
    'tròn _O2 1 tô xám nền',
    'đứt _O1-_O2',
    'vuông _O1-_A-_B',
  ].join('\n'))
  assert.ok(bgSvg.indexOf('<circle') < bgSvg.lastIndexOf('stroke-dasharray="5 4"'))
  const centerSeg = paths(bgSvg).find((p) => p.includes('stroke-dasharray="5 4"'))!
  const [cx1, , cx2] = pathTokens(centerSeg).filter((t) => !/^[ML]$/.test(t)).map(Number)
  near(cx2 - cx1, 4 * 50) // spanX = 6 -> k = 50; không bị cắt ở mép hình tròn nền
  const centerCircle = tags(bgSvg, 'circle')[0]
  near(cx1, numAttr(centerCircle, 'cx'))

  // 5. Mũi tên hai đầu + mũi tên màu + chấm điểm + chữ $...$ nghiêng + khung W H + bán kính cung góc
  const advSvg = draw([
    'khung 500 200',
    'O(0; 0) P(5; 0)',
    'mũi tên hai đầu đứt O-P màu đỏ dày',
    'mũi tên O-P màu #00a8f3',
    'chấm O to',
    'chấm P trắng',
    'góc _X-O-P "$θ$" 0.6',
    '_X(0; 1)',
    'chữ _L "$y = f(x)$"',
    '_L(2.5; 1)',
  ].join('\n'))
  assert.match(advSvg, /<marker id="scarr-d62828".*fill="#d62828"/)
  assert.match(advSvg, /<marker id="scarr-00a8f3".*fill="#00a8f3"/)
  assert.match(advSvg, /marker-start="url\(#scarr-d62828\)" marker-end="url\(#scarr-d62828\)"/)
  assert.equal(tags(advSvg, 'circle').length, 2)
  assert.match(tags(advSvg, 'circle')[0], /r="4\.6" fill="#111111" stroke="none"/)
  assert.match(tags(advSvg, 'circle')[1], /r="3\.2" fill="#ffffff" stroke="#111111"/)
  assert.match(advSvg, /<tspan font-style="italic">y<\/tspan> = <tspan font-style="italic">f<\/tspan>\(<tspan font-style="italic">x<\/tspan>\)/)

  // 6. Báo lỗi hợp lệ cho lệnh mới
  for (const [command, message] of [
    ['khung 0 200', /chiều rộng khung/],
    ['cung elip O 2', /bán kính trục y/],
    ['cong O-_X', /ít nhất 3 điểm/],
    ['vùng', /ít nhất 1 mảnh/],
    ['chấm O tim', /màu chấm không hợp lệ/],
    ['tròn O 1 màu', /thiếu màu nét/],
    ['tròn O 1 mờ 1.5', /độ mờ/],
    ['chữ O "A" xoay x', /góc xoay/],
  ] as const) {
    assert.throws(() => parseScene('O(0; 0) _X(1; 0)\n' + command), (err) =>
      err instanceof Error && err.message.startsWith('Dòng 2: ') && message.test(err.message))
  }

  // 7. Tô gạch chéo, tô cầu, bán trong suốt mờ, xoay chữ/nhãn dọc, tên điểm chỉ số dưới, spline không đều điểm
  const hatchSvg = draw('A(0; 0) B(4; 0) C(4; 4) D(0; 4)\nABCD tô gạch\nABC tô gạch xanh')
  assert.match(hatchSvg, /<pattern id="schat-111111"[^>]*patternTransform="rotate\(45\)"/)
  assert.match(hatchSvg, /<pattern id="schat-2563eb"/)
  assert.match(hatchSvg, /fill="url\(#schat-111111\)"/)

  const sphereSvg = draw('_O(0; 0)\ntròn _O 1 tô cầu #374151 mờ 0.45\ntròn _O 0.5 tô đậm lam mờ')
  assert.match(sphereSvg, /<radialGradient id="scrg-374151"/)
  assert.match(sphereSvg, /fill="url\(#scrg-374151\)" fill-opacity="0\.45"/)
  assert.match(sphereSvg, /fill="#0284c7" fill-opacity="0\.45"/)

  const rotSubSvg = draw([
    'A_1(0; 0) B_2(3; 4)',
    'A_1-B_2',
    'nhãn A_1-B_2 "10 cm" dọc',
    'chữ A_1 "Nghiêng" xoay 30',
  ].join('\n'))
  assert.match(rotSubSvg, />A<tspan baseline-shift="sub" font-size="70%">1<\/tspan><\/text>/)
  assert.match(rotSubSvg, />B<tspan baseline-shift="sub" font-size="70%">2<\/tspan><\/text>/)
  assert.match(rotSubSvg, /data-lbl="lbl:A_1B_2" transform="rotate\(-53\.1 /)
  assert.match(rotSubSvg, /data-lbl="free:A_1:2" transform="rotate\(-30 /)

  const unevenSvg = draw('_A(0; 0) _B(0.2; 0.8) _C(3.5; 1.2) _D(3.8; 0)\ncong _A-_B-_C-_D')
  assert.ok(!unevenSvg.includes('NaN'))

  // 8. Gạch đứng/ngang + điểm 3D + mặt tự sắp chiều sâu + lưới 3D
  const hatchDirSvg = draw('A(0; 0) B(2; 0) C(2; 2) D(0; 2)\nABC tô gạch đứng\nADC tô gạch ngang đỏ')
  assert.match(hatchDirSvg, /<pattern id="schat-111111-0"[^>]*patternTransform="rotate\(0\)"/)
  assert.match(hatchDirSvg, /<pattern id="schat-d62828-90"[^>]*patternTransform="rotate\(90\)"/)

  const face3dSvg = draw([
    'góc nhìn xiên -0.4 -0.35',
    '_A(0; 0; 0) _B(0; 2; 0) _C(0; 2; 2) _D(0; 0; 2)',
    '_E(-2; 0; 0) _F(-2; 2; 0) _G(-2; 2; 2) _H(-2; 0; 2)',
    'mặt _A-_B-_C-_D tô đậm đỏ',
    'mặt _E-_F-_G-_H tô đậm xanh',
  ].join('\n'))
  assert.ok(face3dSvg.indexOf('fill="#2563eb"') > 0 && face3dSvg.indexOf('fill="#d62828"') > 0)
  // Mặt trước (#d62828) phải vẽ SAU mặt sau (#2563eb) do depth lớn hơn
  assert.ok(face3dSvg.indexOf('fill="#2563eb"') < face3dSvg.indexOf('fill="#d62828"'))

  const meshSvg = draw('_O(0; 0)\nlưới 3d tam giác _O 2 3 bước 40 góc -56 24')
  const meshPaths = paths(meshSvg)
  // steps kẹp tối đa 24, m = 6, 2 sườn => 24 * 6 * 2 = 288 ô; dải sát hai đầu nhọn gộp thành 1 mảnh: 288 - 2*2*6 + 2*2 = 268
  assert.equal(meshPaths.length, 268)
  assert.throws(() => parseScene('A(0; 0) B(1; 1; 1)\nAB'), /Dòng 2: "A" là điểm 2D, "B" là điểm 3D/)
  assert.doesNotThrow(() => parseScene('_O(0; 0) A(0; 0; 0) B(1; 0; 0)\nAB\nlưới 3d vuông _O 1 1'))
}

// 9. Nới cú pháp + dựng điểm + lệnh nhanh (thử model 24/11: mọi ca hỏng đều do các lỗi này)
{
  const near = (p: [number, number] | undefined, x: number, y: number) =>
    assert.ok(p && Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6, `${JSON.stringify(p)} ≠ (${x}; ${y})`)
  // tên điểm cách nhau bằng dấu cách, _O / O lẫn nhau, nhãn một điểm
  const loose = parseScene('O(0; 0) _S1(-1; -1) _S2(1; -1) A(2; 0) B(0; 2)\nvuông A O B\ngóc A O B "θ"\nO _S1 _S2 tô đen\ncung _O 1 0 90\nnhãn A "Cốc"')
  assert.deepEqual(loose.cmds.map((c) => c.t), ['right', 'angle', 'poly', 'arc', 'text'])
  // dựng điểm
  const { pts } = parseScene([
    'A(0; 0) B(4; 0) C(4; 4) D(0; 4) O(0; 0)',
    'M = trung điểm AB', 'N = AB 1/4', 'I = AC cắt BD', 'H = hình chiếu C lên AB',
    'P = tròn O 2 góc 90', 'Q = quay B quanh A 90', 'E = đối xứng C qua AB',
    'X = AC cắt tròn O 2', 'Y = tròn A 4 cắt tròn B 4', 'AB',
  ].join('\n'))
  near(pts.get('M'), 2, 0); near(pts.get('N'), 1, 0); near(pts.get('I'), 2, 2); near(pts.get('H'), 4, 0)
  near(pts.get('P'), 0, 2); near(pts.get('Q'), 0, 4); near(pts.get('E'), 4, -4)
  near(pts.get('X'), Math.SQRT2, Math.SQRT2); near(pts.get('Y'), 2, Math.sqrt(12))
  // tiếp tuyến: tiếp điểm nằm trên đường tròn, bán kính vuông góc tiếp tuyến
  const tg = parseScene('O1(0; 0) O2(10; 0) A(5; 0)\ntiếp tuyến trong O1 3 O2 1 T1 T2 T3 T4\ntiếp tuyến từ A tới O1 3 M N').pts
  const d = (p: [number, number], q: [number, number]) => Math.hypot(p[0] - q[0], p[1] - q[1])
  const dot = (o: [number, number], t: [number, number], u: [number, number]) => (t[0] - o[0]) * (u[0] - t[0]) + (t[1] - o[1]) * (u[1] - t[1])
  for (const [o, r, t, u] of [['O1', 3, 'T1', 'T2'], ['O2', 1, 'T2', 'T1'], ['O1', 3, 'M', 'A']] as const) {
    assert.ok(Math.abs(d(tg.get(o)!, tg.get(t)!) - r) < 1e-9)
    assert.ok(Math.abs(dot(tg.get(o)!, tg.get(t)!, tg.get(u)!)) < 1e-9)
  }
  // đều n điểm, lưới, trụ lưới
  const reg = parseScene('O(0; 0)\ntròn O 5\nđều 8 C quanh O 5 góc 0 tròn 0.8 nối')
  near(reg.pts.get('C1'), 5, 0); near(reg.pts.get('C3'), 0, 5)
  assert.equal(reg.cmds.filter((c) => c.t === 'shape').length, 9)
  assert.equal(reg.cmds.filter((c) => c.t === 'seg').length, 8)
  assert.equal(parseScene('A(0; 5) B(-3; 0) C(3; 0)\nlưới tam giác A B C 3').cmds.length, 1 + 6)
  const cyl = parseScene('_O(0; 0)\ntrụ lưới _O 2 6 6 12 tô 1-3 2-4').cmds
  assert.equal(cyl.filter((c) => c.t === 'poly' && c.fill).length, 2)
  assert.throws(() => parseScene('_O(0; 0)\ntrụ lưới _O 2 6 6 12 tô 13-1'), /Dòng 2: ô 13-1 ngoài lưới/)
  // bán kính viết bằng tên đoạn
  const arc = parseScene('O(0; 0) B(3; 0)\ncung O OB 0 90').cmds[0]
  assert.ok(arc.t === 'arc' && Math.abs(arc.rx - 3) < 1e-9)
  // nan hoa từ tâm vòng lớn tới cabin không bị cắt mất
  assert.equal((draw('O(0; 0)\ntròn O 5\nđều 4 C quanh O 5 tròn 0.8 nối').match(/<path /g) ?? []).length, 1 + 4) // đầu mũi tên + 4 nan
}

// 10. Lệnh mới: nút, nửa tròn, ray, nhãn điểm italic + chỉ số dưới
{
  const nodeSvg = draw('A(0; 0) B(4; 0)\nnút A 0.5 tô xám\nnút B 0.5 "B" tô vàng\nAB')
  assert.ok(nodeSvg.includes('font-style="italic" data-lbl="pt:A"'))
  assert.ok(!nodeSvg.includes('data-lbl="pt:B"')) // B đã ghi trong nút
  assert.equal(tags(nodeSvg, 'circle').length, 3) // nút A + chấm tâm A + nút B

  const subPtSvg = draw('A1(0; 0) O2(2; 0) B3(2; 2)\nA1-O2, O2-B3')
  assert.match(subPtSvg, /font-style="italic" data-lbl="pt:A1"[^>]*>A<tspan baseline-shift="sub" font-size="70%">1<\/tspan><\/text>/)
  assert.match(subPtSvg, /font-style="italic" data-lbl="pt:O2"[^>]*>O<tspan baseline-shift="sub" font-size="70%">2<\/tspan><\/text>/)

  const halfSvg = draw('A(0; 0) B(2; 0)\nnửa tròn AB trái tô xám')
  assert.equal(paths(halfSvg).length, 1)
  assert.match(halfSvg, /A[\d.]+ [\d.]+ 0 0 1 /)

  const halfRegSvg = draw('_T(0; 4) _B(0; -4) _T1(2; 2) _B1(2; -2)\nvùng nửa tròn _T-_B trái; nửa tròn _B1-_T1 phải tô gạch đứng')
  assert.match(halfRegSvg, /<pattern id="schat-111111-0"/)

  const railSvg = draw('_A(0; 0) _B(2; 0) _O(0; 1)\n_A-_B ray\ncung _O 1 -90 90 ray')
  assert.ok(paths(railSvg).length > 10)

  // nới cú pháp: tia AB, ["nhãn"]
  const tiaSvg = draw('O(0; 0) A(2; 0)\ntia OA\nnút O 0.4 ["O"] tô xám')
  assert.equal(paths(tiaSvg).length, 1)
}

// 11. Nới cú pháp vòng 2: dấu phẩy trong trụ lưới, ngoặc vuông bao tuỳ chọn, góc nhìn xiên|-56 24, chữ nhỏ, báo lỗi tên điểm có số
{
  const cylComma = parseScene('_O(0; 0)\ntrụ lưới _O 2 6 6 12 tô 1-3, 2-4').cmds
  assert.equal(cylComma.filter((c) => c.t === 'poly' && c.fill).length, 2)

  const bracketed = parseScene('O(0; 0) P(2; 0)\nX = tròn O 2 cắt tròn P 2 [2]\nđều 4 C quanh O 2 [góc 90]')
  assert.ok(bracketed.pts.get('X')![1] < 0)
  assert.ok(bracketed.pts.has('C1'))

  const viewPipe = parseScene('A(0; 0; 0) B(1; 0; 0)\ngóc nhìn xiên|-56 24\nAB')
  assert.equal(viewPipe.cam?.mode, 'oblique')

  const smallText = draw('_O(0; 0) _A(1; 0)\nchữ _O "bé" nhỏ')
  assert.match(smallText, /font-size="14"/)

  assert.throws(() => parseScene('A(0; 0) M(1; 0)\nX = trung điểm A M1'), /chưa khai báo điểm "M1"/)
  assert.throws(() => parseScene('A(0; 0) M(1; 0)\nAM1'), /chưa khai báo điểm "M1"/)

  assert.doesNotThrow(() => parseScene('O(0; 0; 0) x(4; 0; 0)\nO-x'))
  assert.match(draw('_O(0; 0)\ntròn _O 2 tô gạch chéo'), /<pattern id="schat-111111"/)
}

if (process.argv.includes('--svg')) {
  const dir = mkdtempSync(join(tmpdir(), 'de-ro-scene-'))
  writeFileSync(join(dir, 'hinh-sao.svg'), starSvg)
  writeFileSync(join(dir, 'chu-trinh-nuoc.svg'), cycleSvg)
  writeFileSync(join(dir, 'quat-tron.svg'), sectorSvg)
  writeFileSync(join(dir, 'ban-nguyet.svg'), semiSvg)
  writeFileSync(join(dir, 'san-van-dong.svg'), stadiumSvg)
  writeFileSync(join(dir, 'ngoi-nha.svg'), houseSvg)
  console.log(dir)
}
{
  // Chữ kích thước sát mép trái: khung phải nới ra, không cắt mất chữ
  const svg = draw('khung 600 400\nA(5; 0) B(55; 0) C(55; 36.6) E(5; 1.6)\nđất AB\nđứt EC\nkích thước AE "1,6 m"\nkích thước AB "50 m"')
  assert.ok(Number(svg.match(/viewBox="(-?[\d.]+)/)![1]) < 0, 'khung không nới cho chữ tràn mép')
}
// 12. Nới cú pháp vòng 3 (lỗi các model GPT trên bộ đề kín 24/11)
{
  const ok = (t: string) => assert.doesNotThrow(() => parseScene(t), t)
  ok('O(0; 0) A(1; 0) B(-1; 0)\nvùng cung O 1 180 360; đoạn A-B tô xanh nhạt')
  ok('A(0; 0)\nquạt A 2 0 60 tô đỏ nhạt')
  assert.match(draw('O(0; 0)\ntròn O 1 tô đậm'), /fill="#111111"/)
  assert.match(draw('O(0; 0)\ntròn O 1 tô đỏ đậm'), /fill="#d62828"/)
  assert.equal(parseScene('Q(0; 0) R(1; 0) P(1; 1)\ngóc QR P "30°').cmds[0].t, 'angle')
  assert.equal(parseScene('O1(0; 0)\nđều 12 O1 3 nối').cmds.filter((c) => c.t === 'seg').length, 12)
  assert.match(draw('_O(0; 0)\nchữ (-2.2; 1.2) "8"'), />8<\/text>/)
  assert.equal(parseScene('P(0; 3) Q(4; 3)\nđường PQ kéo dài').cmds[0].t, 'seg')
  assert.match(renderTool({ kind: 'venn', spec: { sets: 'Toán, Văn, Anh', counts: 'A: 8\nAB: 3\nABC: 12', shade: '', universe: true } } as ToolDoc).svg, />12<\/text>/)
}
console.log('test-scene-free: ok')
