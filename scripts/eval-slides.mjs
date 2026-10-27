/**
 * Sinh deck bằng LLM thật rồi chụp ảnh từng slide để xem bằng mắt.
 * Chạy: npm run eval:slides -- "Hàm số bậc nhất" "Chí Phèo" [--out thư-mục]
 * Cần `.env` có LLM_API_KEY. Mỗi chủ đề ~1–3 phút; ảnh lưu `eval-out/<n>.png`.
 */
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withPage, waitFor } from './lib/cdp.mjs'

const args = process.argv.slice(2)
const outAt = args.indexOf('--out')
const outDir = outAt >= 0 ? args.splice(outAt, 2)[1] : 'eval-out'
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
    const url = `${base}scripts/eval-slides/index.html?topic=${encodeURIComponent(topic)}`
    const { result, png } = await withPage(url, { width: 1900, height: 1000 }, async ({ evaluate, screenshot }) => {
      const encoded = await waitFor(evaluate, 'document.getElementById("eval-result")?.textContent', 360000)
      return { result: JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')), png: await screenshot() }
    })
    if (result.fatal) {
      console.error(`✗ "${topic}": ${result.fatal}`)
      exit = 1
      continue
    }
    const file = join(outDir, `${i + 1}.png`)
    writeFileSync(file, png)
    console.log(`✓ "${topic}" → ${file}`)
    console.log(`  theme=${result.theme} pack=${result.stylePack} slides=${result.slides} failed=[${result.failed}] plan=${result.planMs}ms total=${result.totalMs}ms`)
    console.log(`  layouts: ${result.layouts.join(', ')}`)
  }
} finally {
  await server.close()
}
process.exit(exit)
