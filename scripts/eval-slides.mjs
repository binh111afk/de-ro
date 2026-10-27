/**
 * Sinh deck bằng LLM thật rồi chụp ảnh từng slide để xem bằng mắt.
 * Chạy: npm run eval:slides -- "Hàm số bậc nhất" "Chí Phèo" [--out thư-mục] [--slides] [--images]
 * Cần `.env` có LLM_API_KEY. Mỗi chủ đề ~1–3 phút; ảnh lưu `eval-out/<n>.png`.
 */
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withPage, waitFor } from './lib/cdp.mjs'

const args = process.argv.slice(2)
const outAt = args.indexOf('--out')
const outDir = outAt >= 0 ? args.splice(outAt, 2)[1] : 'eval-out'
const withImages = args.includes('--images') && args.splice(args.indexOf('--images'), 1).length > 0
const perSlide = args.includes('--slides') && args.splice(args.indexOf('--slides'), 1).length > 0
const polish = args.includes('--polish') && args.splice(args.indexOf('--polish'), 1).length > 0
const POLISH_BELOW = 6.5 // slide điểm thấp hơn mức này được viết lại một lượt rồi chấm lại
const topics = args.length ? args : ['Hàm số bậc nhất và đồ thị']
mkdirSync(outDir, { recursive: true })

const server = await createServer({
  logLevel: 'error',
  server: { port: 0, host: '127.0.0.1' },
  optimizeDeps: { entries: ['index.html', 'scripts/eval-slides/index.html'] },
})
await server.listen()
const base = server.resolvedUrls.local[0]

let exit = 0
try {
  for (const [i, topic] of topics.entries()) {
    const url = `${base}scripts/eval-slides/index.html?topic=${encodeURIComponent(topic)}${withImages ? '&images=1' : ''}`
    const { result, png, slides } = await withPage(url, { width: 1900, height: 1000 }, async ({ evaluate, screenshot }) => {
      const encoded = await waitFor(evaluate, 'document.getElementById("eval-result")?.textContent', 900000)
      const result = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
      // --slides: mỗi slide một ảnh 2× để model chấm điểm đọc được chữ nhỏ
      const slides = []
      if (perSlide && !result.fatal) {
        for (const r of result.rects) {
          slides.push(await screenshot({ x: r.x, y: r.y, width: r.w, height: r.h, scale: 2 }))
        }
      }
      // --polish (cần --slides): chấm từng slide, viết lại slide bị chê, chỉ giữ bản được điểm cao hơn
      if (polish && perSlide && !result.fatal && result.failed.length === 0) {
        const { judge } = await import('./judge-slides.mjs')
        for (let k = 0; k < slides.length; k++) {
          const before = await judge(slides[k])
          if (!before || before.overall >= POLISH_BELOW) continue
          if (!(await evaluate(`window.__polish(${k}, ${JSON.stringify(before.issues ?? [])})`))) continue
          const rect = JSON.parse(await evaluate('window.__rects()'))[k]
          const after = await screenshot({ x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale: 2 })
          const verdict = await judge(after)
          const kept = verdict && verdict.overall > before.overall
          if (kept) slides[k] = after
          console.log(`  polish ${k + 1}: ${before.overall} → ${verdict?.overall ?? '?'} ${kept ? '(giữ bản mới)' : '(giữ bản cũ)'}`)
        }
      }
      return { result, png: await screenshot(), slides }
    })
    if (result.fatal) {
      if (result.raw) writeFileSync(join(outDir, `plan-raw-${i + 1}.txt`), result.raw)
      console.error(`✗ "${topic}": ${result.fatal}${result.raw ? ` (raw → plan-raw-${i + 1}.txt)` : ''}`)
      exit = 1
      continue
    }
    const file = join(outDir, `${i + 1}.png`)
    writeFileSync(file, png)
    slides.forEach((buf, k) => writeFileSync(join(outDir, `${i + 1}-s${String(k + 1).padStart(2, '0')}.png`), buf))
    console.log(`✓ "${topic}" → ${file}`)
    console.log(`  theme=${result.theme} pack=${result.stylePack} slides=${result.slides} failed=[${result.failed}] plan=${result.planMs}ms total=${result.totalMs}ms`)
    console.log(`  layouts: ${result.layouts.join(', ')}`)
  }
} finally {
  await server.close()
}
process.exit(exit)
