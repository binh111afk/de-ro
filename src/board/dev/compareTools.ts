/**
 * Chỉ dùng khi phát triển: so SVG gốc của công cụ (trái) với bản dựng bằng phần tử bảng vẽ (phải).
 * Trên trình duyệt dev: `(await import('/src/board/dev/compareTools.ts')).compare()` hoặc `compare(['graph'])`.
 */
import rough from 'roughjs'
import { FIGURE_GUIDE, toolFromRaw } from '@/lib/docRewrite'
import { renderTool } from '@/lib/toolSpec'
import { drawElement, setImageLoadHandler } from '../render'
import { svgToElements } from '../svgImport'

/** spec mẫu: lấy từ hướng dẫn AI, thêm vài loại mà mẫu trong hướng dẫn chỉ là chỗ giữ chỗ */
export function samples(): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const seen = new Set<string>()
  const add = (raw: Record<string, unknown>) => {
    if (seen.has(raw.kind as string)) return
    try { renderTool(toolFromRaw(raw)); out.push(raw); seen.add(raw.kind as string) } catch { /* mẫu không dựng được */ }
  }
  add({ kind: 'scene', text: 'A(0; 0) B(4; 0) C(0; 3)\nAB, BC, CA\nvuông BAC\nkích thước AB "4 m"\ngóc ABC "α"' })
  add({ kind: 'stats', chart: 'bar', data: 'Thứ 2; Thứ 3; Thứ 4\nLớp 10A: 30; 25; 28\nLớp 10B: 28; 22; 24' })
  add({ kind: 'probtree', text: "A: 0,3\n  B: 0,6\n  B': 0,4\nA': 0,7" })
  add({ kind: 'numberline', sets: '(-2; 3]\n(-oo; -1) ∪ [2; 5]' })
  add({ kind: 'grouped', groups: '[150; 155): 4\n[155; 160): 7\n[160; 165]: 5', label: 'Chiều cao (cm)', freqLabel: 'Số HS', view: 'hist', polygon: true })
  add({ kind: 'gas', axes: 'pV', states: '1: (1; 4)\n2: (4; 1)\n3: (4; 4)', processes: '1-2: đẳng nhiệt\n2-3: đẳng tích\n3-1: đẳng áp', ticks: 'symbol', showStates: true })
  add({ kind: 'foodweb', text: 'Cỏ -> Thỏ, Chuột\nThỏ, Chuột -> Cáo', direction: 'bottom-up', nodeStyle: 'box', showLevels: true })
  const re = /\{"kind":"\w+"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(FIGURE_GUIDE))) {
    let d = 0, j = m.index
    for (; j < FIGURE_GUIDE.length; j++) {
      if (FIGURE_GUIDE[j] === '{') d++
      if (FIGURE_GUIDE[j] === '}' && !--d) break
    }
    try { add(JSON.parse(FIGURE_GUIDE.slice(m.index, j + 1))) } catch { /* JSON mẫu có chỗ giữ chỗ */ }
  }
  return out
}

export function compare(kinds?: string[], W = 380) {
  document.getElementById('tool-compare')?.remove()
  const box = document.createElement('div')
  box.id = 'tool-compare'
  box.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#ddd;z-index:99999;padding:8px'
  document.body.appendChild(box)
  const redraws: (() => void)[] = []
  setImageLoadHandler(() => redraws.forEach((f) => f()))
  const res: string[] = []
  for (const raw of samples().filter((r) => !kinds || kinds.includes(r.kind as string))) {
    const img = renderTool(toolFromRaw(raw))
    const H = (W * img.height) / img.width
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:flex-start'
    const lab = document.createElement('div')
    lab.textContent = raw.kind as string
    lab.style.cssText = 'width:60px;font:12px monospace'
    const im = new Image()
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(img.svg)
    im.style.cssText = `width:${W}px;background:#fff`
    const c = document.createElement('canvas')
    c.width = W * 2; c.height = H * 2
    c.style.cssText = `width:${W}px;height:${H}px;background:#fff`
    row.append(lab, im, c)
    box.appendChild(row)
    try {
      const els = svgToElements(img.svg, { x: 0, y: 0, width: W })
      const draw = () => {
        const ctx = c.getContext('2d')!
        ctx.setTransform(2, 0, 0, 2, 0, 0)
        ctx.clearRect(0, 0, W, H)
        const rc = rough.canvas(c)
        for (const e of els) drawElement(ctx, rc, e)
      }
      draw()
      redraws.push(draw)
      const imgs = els.filter((e) => e.kind === 'image').length
      res.push(`${raw.kind}:${els.length}${imgs ? ` (ảnh ${imgs})` : ''}`)
    } catch (err) {
      res.push(`${raw.kind}: LỖI ${(err as Error).message}`)
    }
  }
  return res.join(' | ')
}
