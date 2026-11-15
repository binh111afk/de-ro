/**
 * Thí nghiệm giảm chi phí soạn đề (gọi thẳng DeepSeek chính hãng, không qua app).
 * Cách:
 *   A  = như hiện tại (có suy luận)
 *   B  = tắt suy luận
 *   D  = có suy luận nhưng dặn suy luận gọn (chỉ tính kiểm đáp án)
 *   C  = B + một lượt soát (có suy luận) giải lại từng câu, trả câu sai kèm bản sửa
 * Mỗi đề chấm bằng giám khảo deepseek-flash (suy luận max): giải lại từng câu, đếm câu sai.
 *
 *   node scripts/exp-exam-cost.mjs A B C --n 3
 * Cần eval-out/exp/system.txt (EVAL_DUMP=1 npm run eval:exam -- dump) và DEEPSEEK_API_KEY trong .env.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const KEY = env.DEEPSEEK_API_KEY
const BASE = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
const MODEL = env.DEEPSEEK_MODEL || 'deepseek-flash'
const JUDGE = process.env.JUDGE_MODEL || MODEL
const SYSTEM = readFileSync('eval-out/exp/system.txt', 'utf8')
const TOPIC = 'Tạo đề thi tốt nghiệp THPT môn Toán theo đúng cấu trúc đề tham khảo 2025, có đáp án.'
const OUT = 'eval-out/exp'
mkdirSync(OUT, { recursive: true })

const args = process.argv.slice(2)
const nAt = args.indexOf('--n')
const N = nAt >= 0 ? Number(args.splice(nAt, 2)[1]) : 2
const variants = args.length ? args : ['A', 'B', 'C']

async function chat(body) {
  const t0 = Date.now()
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(600_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const j = await res.json()
  const u = j.usage ?? {}
  const hit = u.prompt_cache_hit_tokens ?? 0
  return {
    content: j.choices?.[0]?.message?.content ?? '',
    usage: { prompt: u.prompt_tokens ?? 0, hit, out: u.completion_tokens ?? 0, reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0, total: u.total_tokens ?? 0, bill: Math.ceil((u.total_tokens ?? 0) - 0.9 * hit) },
    ms: Date.now() - t0,
  }
}

function json(text) {
  const s = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  return JSON.parse(s.slice(a, b + 1))
}

/** Bản gọn để soát / chấm: câu, phương án, hình (cấu hình), đáp án */
function compact(doc) {
  const blocks = doc.blocks ?? []
  const key = new Map()
  for (const b of blocks) if (b.type === 'answerKey') for (const it of b.items ?? []) key.set(Number(it.no), String(it.answer))
  const txt = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x.text ?? '')).join('') : String(v ?? ''))
  return blocks
    .filter((b) => b.type === 'question')
    .map((q) => {
      const kind = q.kind === 'tf' ? 'đúng/sai' : q.kind === 'short' ? 'trả lời ngắn' : 'trắc nghiệm'
      const opts = (q.options ?? []).map((o) => `${o.label}) ${txt(o.text)}`).join(' | ')
      return `Câu ${q.no} [${kind}]: ${txt(q.text)}${q.figure ? `\n  Hình: ${JSON.stringify(q.figure)}` : ''}${opts ? `\n  ${opts}` : ''}\n  Đáp án đề: ${key.get(Number(q.no)) ?? '(thiếu)'}`
    })
    .join('\n')
}

const BRIEF =
  '\n\nCÁCH SUY NGHĨ (tiết kiệm): trong phần suy nghĩ chỉ chọn số liệu cho đẹp và TÍNH KIỂM đáp án từng câu (ngắn gọn, mỗi câu vài dòng). ' +
  'KHÔNG viết nháp nội dung đề, KHÔNG liệt kê lại cấu trúc JSON, KHÔNG cân nhắc nhiều phương án trình bày. Viết đề trực tiếp ở câu trả lời.'

const CHECK_SYSTEM =
  'Bạn là giáo viên Toán soát đề thi tốt nghiệp THPT. Tự giải lại TỪNG câu (kể cả đọc cấu hình hình vẽ: hàm số, bảng biến thiên…) rồi so với "Đáp án đề". ' +
  'Một câu SAI khi: đáp án đề sai; câu trắc nghiệm không có hoặc có hơn một phương án đúng, hai phương án trùng giá trị; câu đúng/sai có ý đánh giá sai; ' +
  'câu trả lời ngắn có đáp số không phải số hoặc dài quá 4 ký tự; đề thiếu dữ kiện / mâu thuẫn; hình không khớp đề. ' +
  'Chỉ trả DUY NHẤT một JSON: {"fixes":[{"no":<số câu>,"issue":"lỗi ngắn gọn","question":{block question đã sửa, cùng cấu trúc JSON của đề},"answer":"đáp án mới"}]}. ' +
  'Sửa ÍT NHẤT có thể (ưu tiên sửa đáp án hoặc một phương án), giữ nguyên dạng và độ khó. Không có câu sai thì {"fixes":[]}.'

const JUDGE_SYSTEM =
  'Bạn là giám khảo Toán. Tự giải lại TỪNG câu của đề (đọc cả cấu hình hình vẽ) và so với "Đáp án đề". ' +
  'Câu được tính SAI nếu: đáp án đề sai; trắc nghiệm không có/nhiều hơn một phương án đúng hoặc hai phương án trùng; ý đúng/sai đánh giá sai; ' +
  'trả lời ngắn không phải số ≤ 4 ký tự; đề thiếu dữ kiện, mâu thuẫn, hoặc hình không khớp đề. Lỗi trình bày nhỏ không tính. ' +
  'Đồng thời chấm độ khó/tính phân loại của cả đề từ 1 (quá dễ) đến 5 (như đề thật, có câu chốt chặn). ' +
  'Chỉ trả JSON: {"wrong":[{"no":<số>,"why":"ngắn"}],"difficulty":<1-5>,"note":"nhận xét ngắn về chất lượng"}.'

function applyFixes(doc, fixes) {
  const blocks = doc.blocks.map((b) => {
    if (b.type !== 'question') return b
    const f = fixes.find((x) => Number(x.no) === Number(b.no))
    return f?.question ? { ...f.question, no: b.no } : b
  })
  for (const b of blocks) {
    if (b.type !== 'answerKey') continue
    b.items = (b.items ?? []).map((it) => {
      const f = fixes.find((x) => Number(x.no) === Number(it.no))
      return f?.answer ? { ...it, answer: String(f.answer) } : it
    })
  }
  return { ...doc, blocks }
}

async function generate(variant) {
  const calls = []
  const thinking = variant === 'A' || variant === 'D' ? {} : { thinking: { type: 'disabled' } }
  // D: vẫn suy luận nhưng dặn suy luận gọn — chỉ tính và kiểm đáp án, không nháp lại cả đề
  const brief = variant === 'D' ? BRIEF : ''
  const gen = await chat({ model: MODEL, max_tokens: 32000, messages: [{ role: 'system', content: SYSTEM + brief }, { role: 'user', content: TOPIC }], ...thinking })
  calls.push({ step: 'soạn', ...gen.usage, ms: gen.ms })
  let doc = json(gen.content)
  let fixes = []
  if (variant === 'C') {
    const chk = await chat({ model: MODEL, max_tokens: 32000, messages: [{ role: 'system', content: CHECK_SYSTEM }, { role: 'user', content: compact(doc) }] })
    calls.push({ step: 'soát', ...chk.usage, ms: chk.ms })
    fixes = json(chk.content).fixes ?? []
    doc = applyFixes(doc, fixes)
  }
  return { doc, calls, fixes }
}

async function judge(doc) {
  const r = await chat({ model: JUDGE, max_tokens: 64000, reasoning_effort: 'max', messages: [{ role: 'system', content: JUDGE_SYSTEM }, { role: 'user', content: compact(doc) }] })
  return json(r.content)
}

const jobs = variants.flatMap((v) => Array.from({ length: N }, (_, i) => ({ v, i })))
const results = await Promise.all(jobs.map(async ({ v, i }) => {
  try {
    const g = await generate(v)
    const j = await judge(g.doc)
    const r = { variant: v, run: i, calls: g.calls, fixes: g.fixes.map((f) => ({ no: f.no, issue: f.issue })), judge: j, questions: g.doc.blocks.filter((b) => b.type === 'question').length }
    writeFileSync(`${OUT}/${v}-${i}.json`, JSON.stringify({ ...r, doc: g.doc }, null, 2))
    return r
  } catch (e) {
    return { variant: v, run: i, error: String(e).slice(0, 300) }
  }
}))

const rows = results.map((r) => r.error ? { variant: r.variant, run: r.run, error: r.error } : {
  variant: r.variant,
  run: r.run,
  câu: r.questions,
  token: r.calls.reduce((n, c) => n + c.total, 0),
  suyLuận: r.calls.reduce((n, c) => n + c.reasoning, 0),
  điểm: Math.round(r.calls.reduce((n, c) => n + c.bill, 0) / 100) / 10,
  giây: Math.round(r.calls.reduce((n, c) => n + c.ms, 0) / 1000),
  soátSửa: r.fixes.length,
  câuSai: r.judge.wrong?.length ?? '?',
  độKhó: r.judge.difficulty,
})
console.table(rows)
writeFileSync(`${OUT}/summary-${Date.now()}.json`, JSON.stringify(results, null, 2))
for (const r of results) if (!r.error) console.log(`${r.variant}-${r.run} sai:`, JSON.stringify(r.judge.wrong), '|', r.judge.note)
