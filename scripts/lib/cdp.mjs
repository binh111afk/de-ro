/**
 * Mở Chrome headless qua CDP (không cần puppeteer/playwright) cho các script
 * kiểm tra render: `lint-slides.mjs`, `eval-slides.mjs`.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p))

/**
 * Tải `url` ở cửa sổ `width`×`height` rồi chạy `fn({ evaluate, screenshot })`.
 * Profile riêng + cổng debug: `--dump-dom` không thoát được với trang còn
 * kết nối HMR, và dùng chung profile với Chrome đang mở thì headless bị bỏ qua.
 */
export async function withPage(url, { width = 1400, height = 900 } = {}, fn) {
  if (!CHROME) throw new Error('Không tìm thấy Chrome/Edge — đặt CHROME_PATH.')
  const dir = mkdtempSync(join(tmpdir(), 'cdp-'))
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
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await send('Page.navigate', { url })
    const evaluate = async (expression) =>
      (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value
    /** Chụp toàn bộ chiều cao tài liệu, hoặc một vùng `clip` {x,y,width,height,scale}. */
    const screenshot = async (clip) => {
      const h = await evaluate('document.documentElement.scrollHeight')
      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: clip ?? { x: 0, y: 0, width, height: h, scale: 1 },
      })
      return Buffer.from(shot.result.data, 'base64')
    }
    return await fn({ evaluate, screenshot })
  } finally {
    chrome.kill()
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' })
  }
}

/** Đợi tới khi `expression` trả giá trị truthy (poll mỗi 500ms). */
export async function waitFor(evaluate, expression, timeoutMs) {
  for (let t = 0; t < timeoutMs; t += 500) {
    await sleep(500)
    const value = await evaluate(expression)
    if (value) return value
  }
  throw new Error(`Quá thời gian chờ (${timeoutMs / 1000}s): ${expression}`)
}
