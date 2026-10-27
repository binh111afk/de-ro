/**
 * Lint slide bằng renderer thật: dựng layout × theme × nội dung trong Chrome
 * headless rồi đo DOM (tràn, đè, ngoài khung, chữ nhỏ, tương phản).
 * Chạy: npm run lint:slides [-- --all]   (mặc định chỉ in 5 ca đầu mỗi luật)
 * Thoát mã 1 nếu có lỗi mức `error`; `warn` chỉ báo.
 * Chrome: biến CHROME_PATH hoặc Chrome/Edge cài sẵn.
 */
import { createServer } from 'vite'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p))
if (!CHROME) {
  console.error('Không tìm thấy Chrome/Edge — đặt CHROME_PATH.')
  process.exit(2)
}

const server = await createServer({
  logLevel: 'error',
  server: { port: 0, host: '127.0.0.1' },
  // quét trước dependency của trang lint để Vite không reload giữa chừng
  optimizeDeps: { entries: ['index.html', 'scripts/lint-slides/index.html'] },
})
await server.listen()
const base = server.resolvedUrls.local[0]

/** Mở Chrome headless qua CDP, tải trang lint, đợi `#lint-result` có nội dung. */
async function runInChrome(url) {
  const dir = mkdtempSync(join(tmpdir(), 'lint-slides-'))
  // profile riêng + cổng debug: `--dump-dom` không thoát được với trang còn kết nối HMR
  const chrome = spawn(
    CHROME,
    ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${dir}`, 'about:blank'],
    { stdio: 'ignore' },
  )
  try {
    const portFile = join(dir, 'DevToolsActivePort')
    for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100)
    const port = readFileSync(portFile, 'utf8').split(/\r?\n/)[0]
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = reject
    })
    let nextId = 0
    const pending = new Map()
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      pending.get(msg.id)?.(msg)
    }
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const id = ++nextId
        pending.set(id, resolve)
        ws.send(JSON.stringify({ id, method, params }))
      })
    await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url })
    for (let i = 0; i < 240; i++) {
      await sleep(500)
      const res = await send('Runtime.evaluate', {
        expression: 'document.getElementById("lint-result")?.textContent ?? ""',
      })
      const text = res.result?.result?.value
      if (text) return Buffer.from(text, 'base64').toString('utf8')
    }
    throw new Error('Quá thời gian chờ kết quả lint (120s).')
  } finally {
    chrome.kill()
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' })
  }
}

let exit = 0
try {
  const result = JSON.parse(await runInChrome(`${base}scripts/lint-slides/index.html`))
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
