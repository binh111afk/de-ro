/**
 * Đo đề Toán THPT QG ở nhiều mức suy luận: token, thời gian, cấu trúc đề (12 nhiều lựa chọn,
 * 4 đúng/sai, 6 trả lời ngắn, đủ đáp án). Lưu JSON mỗi mức vào eval-out/exam-<mức>.json để đọc lại.
 * Chạy: npm run eval:exam -- max high medium low
 */
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withPage, waitFor } from './lib/cdp.mjs'

const efforts = process.argv.slice(2).length ? process.argv.slice(2) : ['max', 'high', 'medium', 'low']
const outDir = 'eval-out'
mkdirSync(outDir, { recursive: true })
const server = await createServer({ logLevel: 'error', server: { port: 0, host: '127.0.0.1' }, optimizeDeps: { entries: ['index.html', 'scripts/eval-exam/index.html'] } })
await server.listen()
const base = server.resolvedUrls.local[0]

function structure(parsed) {
  const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : []
  const qs = blocks.filter((b) => b?.type === 'question')
  const mc = qs.filter((b) => !b.kind || b.kind === 'mc').length
  const tf = qs.filter((b) => b.kind === 'tf').length
  const short = qs.filter((b) => b.kind === 'short').length
  const key = blocks.find((b) => b?.type === 'answerKey')
  const keyCount = key ? (Array.isArray(key.answers) ? key.answers.length : Object.keys(key.answers ?? key.items ?? {}).length) : 0
  return { mc, tf, short, questions: qs.length, keyCount, ok: mc === 12 && tf === 4 && short === 6 }
}

const rows = []
try {
  await Promise.all(efforts.map(async (effort) => {
    const url = `${base}scripts/eval-exam/index.html?effort=${effort}`
    const result = await withPage(url, { width: 800, height: 600 }, async ({ evaluate }) => {
      const encoded = await waitFor(evaluate, 'document.getElementById("eval-result")?.textContent', 900000)
      return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
    })
    writeFileSync(join(outDir, `exam-${effort}.json`), JSON.stringify(result, null, 2))
    if (result.fatal) { rows.push({ effort, fatal: result.fatal.slice(0, 200) }); return }
    const s = structure(result.parsed)
    const t = result.tokens
    rows.push({ effort, model: result.model, tokens: t.prompt + t.completion, prompt: t.prompt, completion: t.completion, reasoning: t.reasoning, ms: result.ms, json: !!result.parsed, ...s })
  }))
} finally {
  await server.close()
}
const order = ['max', 'high', 'medium', 'low']
rows.sort((a, b) => order.indexOf(a.effort) - order.indexOf(b.effort))
console.table(rows)
process.exit(0)
