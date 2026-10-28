/**
 * Test hình khối: đường cắt sao/tim lấp đầy hộp, xuất PPTX giữ màu, độ trong suốt, viền và loại hình.
 * Chạy: npm run test:slide-shapes
 */
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { SHAPE_CLIP, lineClip, shapeClipOf } from '../src/lib/slideShapes.ts'
import { buildDeckPptx } from '../src/lib/exportDeck.ts'

const points = (css) => [...css.matchAll(/([\d.]+)% ([\d.]+)%/g)].map((m) => [Number(m[1]), Number(m[2])])
for (const shape of ['star', 'heart']) {
  const pts = points(SHAPE_CLIP[shape])
  assert.equal(pts.length, shape === 'star' ? 10 : 64, `${shape}: số đỉnh`)
  const [xs, ys] = [pts.map((p) => p[0]), pts.map((p) => p[1])]
  assert.deepEqual([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)], [0, 100, 0, 100], `${shape}: lấp đầy hộp`)
}

const deck = {
  id: 'd',
  title: 't',
  theme: { fontBody: 'Arial', fontHeading: 'Arial', fg: '#111111', accent: '#285cc2', bg: '#ffffff' },
  slides: [
    {
      id: 's',
      background: '#ffffff',
      elements: [
        { id: 'a', type: 'shape', shape: 'star', x: 10, y: 10, w: 20, h: 35, fill: '#dc2626', opacity: 0.5, border: 4, borderColor: '#111827' },
        { id: 'b', type: 'shape', shape: 'heart', x: 40, y: 10, w: 20, h: 35, fill: '#16a34a' },
        { id: 'c', type: 'shape', shape: 'round', x: 10, y: 55, w: 30, h: 20, fill: '#285cc2', text: 'Chữ trong hình', shadowLevel: 3 },
        { id: 'e', type: 'shape', shape: 'hexagon', x: 70, y: 10, w: 20, h: 35, fill: '#0d9488', text: 'Lục giác' },
        { id: 'f', type: 'shape', shape: 'flowChartDecision', x: 70, y: 50, w: 20, h: 35, fill: '#7c3aed' },
        { id: 'g', type: 'shape', shape: 'bentConnector3', x: 5, y: 85, w: 30, h: 10, fill: '#111111' },
        { id: 'd', type: 'shape', shape: 'line', x: 50, y: 60, w: 40, h: 5, fill: '#111111', border: 4, lineArrow: 'both' },
      ],
    },
  ],
}
const zip = await JSZip.loadAsync(await buildDeckPptx(deck))
const xml = await zip.file('ppt/slides/slide1.xml').async('string')
assert.match(xml, /prst="star5"/)
assert.match(xml, /prst="heart"/)
assert.match(xml, /<a:srgbClr val="DC2626"><a:alpha val="50000"\/>/, 'độ trong suốt 50%')
assert.match(xml, /<a:ln w="\d+"><a:solidFill><a:srgbClr val="111827"/, 'viền màu #111827')
assert.match(xml, /prst="hexagon"/, 'hình dựng sẵn giữ tên prst')
assert.match(xml, /prst="flowChartDecision"/)
assert.match(xml, /prst="bentConnector3"/, 'đường nối gấp khúc')
assert.match(xml, /Chữ trong hình/, 'chữ nằm trong hình')
assert.match(xml, /<a:outerShdw/, 'bóng đổ mức đậm')
assert.match(xml, /headEnd type="triangle"/, 'đầu mũi tên đầu')
assert.match(xml, /tailEnd type="triangle"/, 'đầu mũi tên cuối')

// đường thẳng: đầu mũi tên đổi hình cắt; không mũi tên là dải mỏng 4 đỉnh
assert.notEqual(lineClip({ border: 4, lineArrow: 'none' }), lineClip({ border: 4, lineArrow: 'end' }))
assert.notEqual(lineClip({ border: 4, lineArrow: 'end' }), lineClip({ border: 4, lineArrow: 'both' }))
assert.ok(lineClip({ border: 8, lineArrow: 'none' }).includes('0.40cqw'), 'độ dày theo border')
assert.equal(shapeClipOf({ shape: 'line', lineArrow: 'end' }).startsWith('polygon('), true)
assert.equal(shapeClipOf({ shape: 'rect' }), undefined)
console.log('test-slide-shapes: pass')
