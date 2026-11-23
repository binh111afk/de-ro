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
const { k, w, h } = frame(cycleSvg, 6.8, 5.8)
const boxes = tags(cycleSvg, 'rect').slice(1)
assert.ok(numAttr(boxes[0], 'rx') > 0)
assert.match(attr(boxes[1], 'fill') ?? '', /^#[\da-f]{6}$/)
assert.notEqual(attr(boxes[1], 'fill'), '#ffffff')
near(numAttr(boxes[0], 'x'), 62)
near(numAttr(boxes[1], 'x') + numAttr(boxes[1], 'width'), w - 62)
near(numAttr(boxes[0], 'y'), 62)
near(numAttr(boxes[2], 'y') + numAttr(boxes[2], 'height'), h - 62)
const arrows = tags(cycleSvg, 'path').filter((p) => p.includes('marker-end='))
assert.equal(arrows.length, 4)
assert.ok(cycleSvg.lastIndexOf('marker-end=') < cycleSvg.indexOf(boxes[0]))
const [, endX, endY] = /L([\d.]+) ([\d.]+)/.exec(attr(arrows[0], 'd') ?? '')!
near(Number(endX), numAttr(boxes[1], 'x'))
near(Number(endY), numAttr(boxes[1], 'y') + 0.55 * k)
for (const label of ['Bay hơi', 'Ngưng tụ', 'Mưa', 'Thấm', 'Chu trình nước']) assert.ok(cycleSvg.includes('>' + label + '</text>'))

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
assert.match(extraSvg, /A\(99; 99\) &amp;(?: |<\/tspan><tspan[^>]*>)B &lt; C/)
assert.match(extraSvg, /stroke-dasharray="5 4" marker-end=/)

const longLine = 'M'.repeat(60)
const textOnly = 'chữ _O "' + longLine + '\\nDòng 2" to đậm\r\n_O(0; 0)'
const wordImage = renderSceneSvg({ text: textOnly }, '')
count(wordImage.svg, 'text', 1)
count(wordImage.svg, 'tspan', 2)
assert.match(wordImage.svg, /font-size="21" font-weight="bold"/)
const [first, second] = tags(wordImage.svg, 'tspan')
near(numAttr(first, 'x'), wordImage.width / 2)
assert.ok(numAttr(first, 'x') - longLine.length * 21 / 2 >= 62)
near(numAttr(second, 'y') - numAttr(first, 'y'), 25.2)
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
  ['chữ O "chưa đóng', /ngoặc kép/],
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

// SHA-256 của SVG từ git show HEAD:src/lib/scene.ts, commit 079c5ce.
for (const [spec, hash] of [
  [SCENE_DEFAULT, 'b9e3e7521500f703ea83f2e8a43213acead0502a0c82f29ed002071507e50bd3'],
  [{ text: 'A(0; 0) B(4; 0) C(4; 3) D(0; 3) _E(2; 1)\nABCD\nA-_E*\ngóc ABC "90°"' }, '4c1a0fb58be40d3e5eaafb63af675b4af6151d0ccd99a4a2e052057d8201f270'],
  [{ text: 'A(0; 0) B(4; 0) C(0; 3)\nhình cái thang CB\nhình cây AC\nnhãn CB “5 m”' }, '0134e936c228859575e98ee9d5fe3f22b2772e9152046b22a02d05b252186f80'],
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
console.log('test-scene-free: ok')
