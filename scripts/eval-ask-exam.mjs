/**
 * Đo hội thoại 2 lượt (#2 lượt hỏi lại + #3 lượt soạn sau khi trả lời) bằng đúng code AiPanel/AiAskPanel.
 * Chạy: node scripts/eval-ask-exam.mjs [--effort low] [--out eval-out/ask-1.json]
 */
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { withPage, waitFor } from './lib/cdp.mjs'
process.env.NODE_ENV ??= 'development'

const args = process.argv.slice(2)
const takeOpt = (flag, fallback) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args.splice(i, 2)[1] : fallback
}
const effort = takeOpt('--effort', 'low')
const topic = takeOpt('--topic', 'soạn đề đi')
const outFile = takeOpt('--out', 'eval-out/ask-run.json')
mkdirSync(dirname(outFile), { recursive: true })

function inspectExam(parsed) {
  const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : []
  const qs = blocks.filter((b) => b?.type === 'question')
  const essays = blocks.filter((b) => b?.type === 'essay')
  const mc = qs.filter((b) => !b.kind || b.kind === 'mc').length
  const tf = qs.filter((b) => b.kind === 'tf').length
  const short = qs.filter((b) => b.kind === 'short').length
  const figs = blocks.filter((b) => b?.figure).length
  const key = blocks.find((b) => b?.type === 'answerKey')
  const keyCount = key ? (Array.isArray(key.items) ? key.items.length : Array.isArray(key.answers) ? key.answers.length : Object.keys(key.answers ?? {}).length) : 0
  const rubric = blocks.find((b) => b?.type === 'rubric')
  return { mc, tf, short, essays: essays.length, questions: qs.length, figs, keyCount, hasRubric: !!rubric }
}

const server = await createServer({
  logLevel: 'error',
  server: { port: 0, host: '127.0.0.1' },
  optimizeDeps: { entries: ['index.html', 'scripts/eval-ask-exam/index.html'] },
})
await server.listen()
const base = server.resolvedUrls.local[0]

try {
  const url = `${base}scripts/eval-ask-exam/index.html?effort=${effort}&topic=${encodeURIComponent(topic)}${process.env.EVAL_MODEL ? `&model=${encodeURIComponent(process.env.EVAL_MODEL)}` : ''}`
  const result = await withPage(url, { width: 800, height: 600 }, async ({ evaluate }) => {
    const encoded = await waitFor(evaluate, 'document.getElementById("eval-result")?.textContent', 900000)
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
  })
  writeFileSync(outFile, JSON.stringify(result, null, 2))
  if (result.fatal) {
    console.error('FATAL:', result.fatal)
    process.exitCode = 1
  } else {
    const t1 = result.turn1
    const t2 = result.turn2
    console.log('Turn 1 (#2 ask):', {
      model: t1.model,
      ms: t1.ms,
      askOk: t1.askOk,
      questions: t1.ask?.questions?.length ?? 0,
      ...t1.usage,
    })
    if (t2) {
      const s = inspectExam(t2.parsed)
      console.log('Turn 2 (#3 gen):', {
        model: t2.model,
        ms: t2.ms,
        askedAgain: t2.askedAgain,
        json: !!t2.parsed,
        hasDefault: t2.reply.includes('Những gì chưa chọn'),
        ...t2.usage,
        ...s,
      })
      const sumTotal = (t1.usage?.total ?? 0) + (t2.usage?.total ?? 0)
      console.log('Sum (#2 + #3) tokens:', sumTotal, 'points:', Math.ceil(sumTotal / 1000))
    }
  }
} finally {
  await server.close()
}
process.exit(process.exitCode ?? 0)
