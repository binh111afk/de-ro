// Gom tín hiệu "người dùng không hài lòng với AI" (bảng ai_feedback) thành bộ ca thử.
// Chạy: node --env-file=.env scripts/export-ai-feedback.mjs [--days 30] [--kind down,undo,resend,complaint]
// Ra: eval-out/feedback-cases.json — mỗi ca: yêu cầu, tài liệu lúc đó, câu trả lời bị chê, ghi chú.
// Mỗi lần đổi prompt: chạy lại các ca này (cùng scripts/exp-exam-cost.mjs, eval:slides) xem còn hỏng không.
import { mkdirSync, writeFileSync } from 'node:fs'

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : def
}
const days = Math.max(1, Math.min(365, Number(arg('days', '30')) || 30))
const kinds = arg('kind', 'up,down,undo,resend,complaint').split(',').map((k) => k.trim()).filter(Boolean)

const base = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
if (!base || !key) {
  console.error('Thiếu VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env')
  process.exit(1)
}
const since = new Date(Date.now() - days * 86400_000).toISOString()
const url = `${base}/rest/v1/ai_feedback?select=id,kind,mode,request,reply,context,note,created_at&created_at=gte.${since}&kind=in.(${kinds.join(',')})&order=created_at.desc&limit=1000`
const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
if (!r.ok) {
  console.error('Không đọc được ai_feedback:', r.status, await r.text())
  process.exit(1)
}
const rows = await r.json()
// cùng yêu cầu bị chê nhiều lần (bấm 👎 rồi gửi lại…) → một ca
const cases = new Map()
for (const row of rows) {
  const k = `${row.mode}|${row.request.trim().toLowerCase()}`
  const c = cases.get(k) ?? { mode: row.mode, request: row.request, context: row.context, replies: [], signals: [], notes: [] }
  c.signals.push(row.kind)
  // 👍 = ca mẫu tốt: đổi prompt xong phải vẫn làm tốt như vậy; còn lại = ca hỏng cần sửa
  c.good = c.signals.every((s) => s === 'up')
  if (row.reply && !c.replies.includes(row.reply)) c.replies.push(row.reply)
  if (row.note) c.notes.push(row.note)
  cases.set(k, c)
}
mkdirSync('eval-out', { recursive: true })
const out = [...cases.values()].sort((a, b) => b.signals.length - a.signals.length)
writeFileSync('eval-out/feedback-cases.json', JSON.stringify(out, null, 2))
console.log(`${rows.length} tín hiệu → ${out.length} ca, ghi eval-out/feedback-cases.json`)
