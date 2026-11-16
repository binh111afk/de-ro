/**
 * Vẽ ảnh gốc cho kho hình. Thứ tự nguồn giống server/imageProxy.ts: Agnes (AGNES_API_KEY trong .env) →
 * SenseNova qua Xkiro (IMAGE_API_KEY/IMAGE_BASE_URL trong .env, không có thì đọc provider Xkiro trong
 * config ZCode của máy). Agnes báo giới hạn (429) thì chuyển hẳn sang SenseNova. Ảnh đã có thì bỏ qua.
 *   node scripts/figure-sprites/gen.mjs <thư mục ảnh gốc> [id…]
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = {}
for (const f of ['.env', '.env.local']) {
  try {
    for (const l of fs.readFileSync(path.join(root, f), 'utf8').split(/\r?\n/)) {
      const m = l.match(/^([A-Z_]+)=(.*)$/)
      if (m && m[2].trim()) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {}
}

function xkiroFromZcode() {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.zcode', 'v2', 'provider_config.json'), 'utf8'))
    const x = (cfg.config?.providerConfigRules?.providerRules ?? []).find((r) => /xkiro/i.test(r.providerName ?? ''))
    return { baseUrl: x?.config?.api?.baseUrl, apiKey: x?.config?.access?.apiKey }
  } catch {
    return {}
  }
}

const providers = []
if (env.AGNES_API_KEY)
  providers.push({ name: 'agnes', baseUrl: (env.AGNES_BASE_URL || 'https://apihub.agnes-ai.com/v1').replace(/\/+$/, ''), apiKey: env.AGNES_API_KEY, model: env.AGNES_IMAGE_MODEL || 'agnes-image-2.5-flash' })
const z = xkiroFromZcode()
const xKey = env.IMAGE_API_KEY || z.apiKey
if (xKey)
  providers.push({ name: 'sensenova', baseUrl: (env.IMAGE_BASE_URL || z.baseUrl || 'https://api.xkiro.com/v1').replace(/\/+$/, ''), apiKey: xKey, model: env.IMAGE_MODEL || 'sensenova/sensenova-u1.5-lite' })
if (!providers.length) throw new Error('Không có key Agnes hay Xkiro')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const blocked = new Set()

async function generate(p, prompt) {
  const headers = { Authorization: `Bearer ${p.apiKey}`, 'Content-Type': 'application/json' }
  const res = await fetch(`${p.baseUrl}/images/generations`, { method: 'POST', headers, body: JSON.stringify({ model: p.model, prompt, n: 1, size: '1024x1024' }), signal: AbortSignal.timeout(180000) })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(`${res.status} ${JSON.stringify(body).slice(0, 120)}`), { status: res.status })
  let item = body.data?.[0]
  // Xkiro: trả job id, chờ xong
  if (!item && body.id) {
    for (let i = 0; i < 160 && !item; i++) {
      await sleep(1500)
      const j = await (await fetch(`${p.baseUrl}/images/generations/${encodeURIComponent(body.id)}`, { headers })).json()
      if (/fail|error/.test(String(j.status))) throw new Error(`job lỗi ${JSON.stringify(j).slice(0, 120)}`)
      if (/succeeded|completed/.test(String(j.status))) item = j.data?.[0]
    }
  }
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64')
  if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer())
  throw new Error('không có ảnh')
}

const data = JSON.parse(fs.readFileSync(path.join(root, 'scripts/figure-sprites/hinh-tieu-hoc.json'), 'utf8'))
const out = process.argv[2]
const only = process.argv.slice(3)
const rank = { cao: 0, vừa: 1, thấp: 2 }
const todo = [...data.containers, ...data.objects]
  .filter((x) => (only.length ? only.includes(x.id) : !fs.existsSync(path.join(out, `${x.id}.png`))))
  .sort((a, b) => (rank[a.freq] ?? 3) - (rank[b.freq] ?? 3))

const log = path.join(out, 'nguon.json')
const source = fs.existsSync(log) ? JSON.parse(fs.readFileSync(log, 'utf8')) : {}

for (const item of todo) {
  let done = false
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    const p = providers.find((x) => !blocked.has(x.name))
    if (!p) break
    try {
      fs.writeFileSync(path.join(out, `${item.id}.png`), await generate(p, item.prompt))
      source[item.id] = p.name
      fs.writeFileSync(log, JSON.stringify(source, null, 1))
      console.log('ok', item.id, p.name)
      done = true
    } catch (e) {
      if (e.status === 429) blocked.add(p.name)
      console.log('retry', item.id, p.name, String(e.message).slice(0, 80))
      await sleep(3000)
    }
  }
  if (!done) console.log('FAIL', item.id)
  if (blocked.size === providers.length) break
}
console.log('xong', Object.keys(source).length, 'ảnh có ghi nguồn')
