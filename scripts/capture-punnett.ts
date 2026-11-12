import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderPunnettSvg, type PunnettSpec } from '../src/lib/punnett'
// @ts-expect-error cdp.mjs is javascript
import { withPage } from './lib/cdp.mjs'

const OUT_DIR = join(process.cwd(), 'docs/handoff/punnett-screens')
mkdirSync(OUT_DIR, { recursive: true })

const spec1: PunnettSpec = {
  cross: 'AaBb x AaBb',
  traits: [
    { gene: 'A', phenotypes: ['hạt vàng', 'hạt xanh'] },
    { gene: 'B', phenotypes: ['vỏ trơn', 'vỏ nhăn'] },
  ],
  showGametes: true,
  showGrid: true,
  showGenotypeRatio: true,
  showPhenotypeRatio: true,
  colorByPhenotype: true,
  blankGrid: false,
}

const spec2: PunnettSpec = {
  cross: 'XAXa x XaY',
  traits: [{ gene: 'A', phenotypes: ['bình thường', 'bệnh máu khó đông'] }],
  showGametes: true,
  showGrid: true,
  showGenotypeRatio: true,
  showPhenotypeRatio: true,
  colorByPhenotype: true,
  blankGrid: false,
}

const spec3: PunnettSpec = {
  cross: 'AaBb x AaBb',
  showGametes: true,
  showGrid: true,
  showGenotypeRatio: true,
  showPhenotypeRatio: true,
  blankGrid: true,
  colorByPhenotype: false,
}

const svg1 = renderPunnettSvg(spec1, '<desc>AaBb x AaBb</desc>')
const svg2 = renderPunnettSvg(spec2, '<desc>XAXa x XaY</desc>')
const svg3 = renderPunnettSvg(spec3, '<desc>Blank</desc>')

// Lưu các file SVG
writeFileSync(join(OUT_DIR, 'punnett-aabb-x-aabb.svg'), svg1.svg)
writeFileSync(join(OUT_DIR, 'punnett-xaxa-x-xay.svg'), svg2.svg)
writeFileSync(join(OUT_DIR, 'punnett-blank-grid.svg'), svg3.svg)
console.log('✅ Đã lưu các file SVG vào', OUT_DIR)

// Tạo trang HTML để chụp ảnh PNG
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; padding: 24px; margin: 0; }
  .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 24px; display: inline-block; }
  h2 { margin: 0 0 12px 0; font-size: 16px; color: #334155; }
</style>
</head>
<body>
  <div id="shot1" class="card">
    <h2>1. Phép lai 2 cặp gen: AaBb × AaBb (Tô màu theo kiểu hình, KH 9 : 3 : 3 : 1)</h2>
    ${svg1.svg}
  </div>
  <br>
  <div id="shot2" class="card">
    <h2>2. Phép lai liên kết giới tính: XᴬXᵃ × XᵃY (Tách theo giới tính, con trai 1/2 bệnh)</h2>
    ${svg2.svg}
  </div>
  <br>
  <div id="shot3" class="card">
    <h2>3. Chế độ để trống cho học sinh điền (blankGrid: true)</h2>
    ${svg3.svg}
  </div>
</body>
</html>`

const htmlPath = join(OUT_DIR, 'preview.html')
writeFileSync(htmlPath, html)
console.log('✅ Đã lưu file HTML vào', htmlPath)

async function capture() {
  try {
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/')
    console.log('Đang mở headless browser để chụp PNG...')
    await withPage(
      fileUrl,
      { width: 1000, height: 1800 },
      async ({ screenshot, evaluate }: { screenshot: (clip?: { x: number; y: number; width: number; height: number; scale: number }) => Promise<Buffer>; evaluate: (code: string) => Promise<unknown> }) => {
        // Chờ font load
        await new Promise((r) => setTimeout(r, 1000))

        const allBuf = await screenshot()
        writeFileSync(join(OUT_DIR, 'punnett-all-cases.png'), allBuf)
        console.log('✅ Đã chụp thành công: punnett-all-cases.png')

        // Chụp từng card riêng biệt theo bounding box
        for (const [id, filename] of [
          ['shot1', 'punnett-aabb-x-aabb.png'],
          ['shot2', 'punnett-xaxa-x-xay.png'],
          ['shot3', 'punnett-blank-grid.png'],
        ]) {
          const clip = (await evaluate(`
            (() => {
              const el = document.getElementById('${id}');
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: Math.floor(r.left), y: Math.floor(r.top + window.scrollY), width: Math.ceil(r.width), height: Math.ceil(r.height), scale: 1 };
            })()
          `)) as { x: number; y: number; width: number; height: number; scale: number } | null

          if (clip) {
            const shotBuf = await screenshot(clip)
            writeFileSync(join(OUT_DIR, filename), shotBuf)
            console.log(`✅ Đã chụp: ${filename} (${clip.width}x${clip.height})`)
          }
        }
      },
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('Không thể chụp qua CDP:', msg)
    console.log('Các file SVG và preview.html đã được lưu đầy đủ.')
  }
}

capture()
