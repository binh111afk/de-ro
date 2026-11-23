import assert from 'node:assert/strict'
import { toolFromRaw } from '../src/lib/docRewrite'
import { renderTool } from '../src/lib/toolSpec'
import { parseScene } from '../src/lib/scene'

const draw = (raw: Record<string, unknown>) => renderTool(toolFromRaw(raw))
const scene = draw({ kind: 'scene', text: 'O(0;0) A(-1;1) B(1;1)\nAB\ntròn O 2\nelip O 2 1' })
assert.match(scene.svg, /<circle [^>]*fill="none"/)
assert.match(scene.svg, /<ellipse [^>]*fill="none"/)
assert.equal(parseScene('A(0;0) B(1;0)\nđoạn AB\nnhãn AB "x"').cmds.length, 2)
const labels = draw({ kind: 'scene', text: '_O(0;0) _P(4;0)\nhộp _O 1.5 0.9 "Oxy hoá pyruvate và chu trình Krebs"\nchữ _P "ZnSO4"' })
assert.match(labels.svg, /<tspan [^>]*>Oxy /)
assert.match(labels.svg, /ZnSO₄/)

const tri = draw({ kind: 'geo2d', shape: 'free',
  extras: 'A(0;0) B(0;3) C(4;0)\nABC\nH(1.44;1.92)\nAH\nvuông BAC\nvuông AHC' })
assert.deepEqual(tri.errors, [])
assert.deepEqual(tri.pick?.points.find((p) => p.name === 'A')?.v, [0, 0])
assert.ok(tri.pick?.segs.some(({ a, b }) => a === 'C' && b === 'A'))
assert.match(draw({ kind: 'geo2d', shape: 'free', extras: 'A(0;0) B(3;0)\ntia AB "x"' }).svg, /data-lbl="ray:AB">x</)
assert.match(draw({ kind: 'signtable', expr: '(x-1)*(x+3)', fname: 'f′(x)' }).svg, /f′\(x\)/)

const trap = draw({ kind: 'geo3d', shape: 'pyramid4-sa',
  extras: 'S(0;0;1.5) A(0;0;0) B(2;0;0) C(1;1;0) D(0;1;0)\nM = trung điểm AD\nSM' })
const t = (name: string) => trap.pick!.points.find((p) => p.name === name)!
const [s, b, c] = ['S', 'B', 'C'].map(t)
const gap = Math.abs((b.x - s.x) * (c.y - s.y) - (b.y - s.y) * (c.x - s.x)) / Math.hypot(b.x - s.x, b.y - s.y)
assert.ok(gap > 14, 'SB và SC phải tách nhau khi chiếu')
const frustum = draw({ kind: 'geo3d', shape: 'frustum4' })
assert.equal(frustum.pick!.segs.length, 12)
const prism = draw({ kind: 'geo3d', shape: 'prism3-oblique' })
const prismPoint = (name: string) => prism.pick!.points.find((p) => p.name === name)!.v
assert.ok(prismPoint("A'")[0] > prismPoint('A')[0])
assert.equal(prism.pick!.segs.length, 9)

const graph = draw({ kind: 'graph', curves: ['x^2', '2x+3'], xMin: -2.5, xMax: 3.5, yMin: -1, yMax: 6,
  points: 'O(0;0)', asymptotes: 'x=2', shade: [0, 2], piAxis: true })
assert.match(graph.svg, /data-asymptote="x=2"/)
assert.match(graph.svg, /data-shade="true"/)
assert.match(graph.svg, />π\/2</)
assert.equal((graph.svg.match(/>O<\/text>/g) ?? []).length, 1)
const range = toolFromRaw({ kind: 'graph', curves: ['x^2', '2x+3'], xMin: -2.5, xMax: 3.5, yMin: -1, yMax: 6 })
assert.ok(range.kind === 'graph' && range.spec.yMax > 9 && !range.spec.points)

const circuit = draw({ kind: 'circuit', text: 'nguồn E=12V\nR1=10 Ω - R2=2 Ω\nV // R1\nK=đóng - Rb' })
assert.equal((circuit.svg.match(/>R<tspan[^>]*>1<\/tspan>/g) ?? []).length, 1)
assert.match(circuit.svg, />K<\/text>/)
assert.match(circuit.svg, />Rb<\/text>/)
assert.match(circuit.svg, />V<\/text>/)

const stat = (chart: string, data: string) => draw({ kind: 'stats', chart, data })
const pie = stat('pie', 'A; B\nTỉ lệ: 70; 30')
assert.match(pie.svg, />30%<\/text>/)
const full = stat('pie', 'A; B\nTỉ lệ: 100; 0')
assert.match(full.svg, /<circle /)
assert.doesNotMatch(full.svg, />0%<\/text>/)
const line = stat('line', '0; 10; 15; 25\nTần số: 5; 20; -10; 10')
const ticks = [...line.svg.matchAll(/<text x="([\d.]+)"[^>]*data-lbl="x:\d"/g)].map((m) => Number(m[1]))
assert.ok(ticks[3] - ticks[2] > 1.9 * (ticks[2] - ticks[1]))
assert.match(stat('pyramid', 'Bậc 1; Bậc 2; Bậc 3; Bậc 4\nNăng lượng: 1500000; 150000; 18000; 1500').svg, />Bậc 4 · 1500</)
const pedigree = draw({ kind: 'pedigree', text: '10: nam bt\n20: nữ bệnh\n10 x 20 -> 30\n30: nam bt', generationNumbers: true })
assert.equal((pedigree.svg.match(/>1<\/text>/g) ?? []).length, 2)
assert.doesNotMatch(pedigree.svg, />30<\/text>/)
console.log('✓ Hồi quy 11 công cụ vẽ: hình học, scene, plot, bảng xét dấu, mạch, thống kê và phả hệ')
