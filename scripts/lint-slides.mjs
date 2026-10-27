/**
 * Lint slide bằng renderer thật: dựng layout × theme × nội dung trong Chrome
 * headless rồi đo DOM (tràn, đè, ngoài khung, chữ nhỏ, tương phản).
 * Chạy: npm run lint:slides [-- --all]   (mặc định chỉ in 5 ca đầu mỗi luật)
 * Thoát mã 1 nếu có lỗi mức `error`; `warn` chỉ báo.
 * Chrome: biến CHROME_PATH hoặc Chrome/Edge cài sẵn (xem lib/cdp.mjs).
 */
import { createServer } from 'vite'
import { withPage, waitFor } from './lib/cdp.mjs'

const server = await createServer({
  logLevel: 'error',
  server: { port: 0, host: '127.0.0.1' },
  // quét trước dependency của trang lint để Vite không reload giữa chừng
  optimizeDeps: { entries: ['index.html', 'scripts/lint-slides/index.html'] },
})
await server.listen()
const base = server.resolvedUrls.local[0]

let exit = 0
try {
  const encoded = await withPage(`${base}scripts/lint-slides/index.html`, {}, ({ evaluate }) =>
    waitFor(evaluate, 'document.getElementById("lint-result")?.textContent', 120000),
  )
  const result = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
  if (result.fatal) throw new Error(result.fatal)

  const all = process.argv.includes('--all')
  const byRule = new Map()
  for (const issue of result.issues) {
    const key = `${issue.severity}:${issue.rule}`
    byRule.set(key, [...(byRule.get(key) ?? []), issue])
  }
  console.log(`\nlint-slides: ${result.slides} slide, ${result.issues.length} vấn đề`)
  for (const [key, list] of [...byRule].sort()) {
    console.log(`\n[${key}] ${list.length}`)
    for (const i of list.slice(0, all ? list.length : 5)) {
      console.log(`  ${i.theme}/${i.layout}/${i.tone}/${i.content}  ${i.element}  ${i.detail}`)
    }
    if (!all && list.length > 5) console.log(`  … +${list.length - 5} (thêm --all)`)
  }
  if (result.issues.some((i) => i.severity === 'error')) exit = 1
  else console.log('\n✅ không có lỗi mức error')
} catch (err) {
  console.error(err.message)
  exit = 2
} finally {
  await server.close()
}
process.exit(exit)
