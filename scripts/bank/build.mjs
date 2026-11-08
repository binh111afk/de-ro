// Gộp các file JSON câu hỏi (subagent soạn) thành src/data/bankThpt.ts, kiểm tra định dạng.
// node build.mjs <thư mục json> <file ts ra> [tên export, mặc định BANK_THPT]
import fs from 'node:fs'
import path from 'node:path'

const [dir, out, exportName = 'BANK_THPT'] = process.argv.slice(2)
const KINDS = new Set(['graph', 'vartable', 'signtable', 'oxy', 'geo3d', 'scene', 'stats', 'grouped', 'probtree', 'geo2d', 'trig', 'numberline', 'venn', 'circuit', 'motion', 'incline', 'gas', 'electron', 'struct', 'chemgraph'])
const SUBJECTS = new Set(['Toán', 'Vật lí', 'Hoá học', 'Sinh học', 'Tiếng Anh', 'Lịch sử', 'Địa lí', 'Tin học', 'GDKT&PL'])
const TYPES = new Set(['trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan'])
const POINTS = { 'trac-nghiem': 0.25, 'dung-sai': 1, 'tra-loi-ngan': 0.5, 'tu-luan': 1 }
const entries = []
const problems = []

for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  const topic = path.basename(f, '.json')
  let arr
  try {
    arr = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
  } catch (e) {
    problems.push(`${f}: JSON lỗi ${e.message}`)
    continue
  }
  arr.forEach((q, i) => {
    const where = `${f}#${i + 1}`
    const bad = (m) => problems.push(`${where}: ${m}`)
    if (!TYPES.has(q.type)) return bad(`type lạ ${q.type}`)
    if (!q.prompt || typeof q.prompt !== 'string') return bad('thiếu prompt')
    const opts = q.options
    if (q.type === 'trac-nghiem') {
      if (!Array.isArray(opts) || opts.length !== 4 || opts.map((o) => o.key).join('') !== 'ABCD') return bad('phương án A–D sai')
      if (!/^[ABCD]$/.test(q.answer)) return bad(`đáp án ${q.answer}`)
    } else if (q.type === 'dung-sai') {
      if (!Array.isArray(opts) || opts.length !== 4 || opts.map((o) => o.key).join('') !== 'abcd') return bad('ý a–d sai')
      if (!/^[ĐS]{4}$/.test(q.answer)) return bad(`đáp án ${q.answer}`)
    } else if (q.type === 'tra-loi-ngan') {
      const a = String(q.answer ?? '').replace('.', ',')
      if (!/^-?\d+(,\d+)?$/.test(a) || a.length > 4) return bad(`đáp án ngắn ${q.answer}`)
      q.answer = a
    }
    if (q.figure && !KINDS.has(q.figure.kind)) return bad(`figure lạ ${q.figure.kind}`)
    if (/như hình|hình (bên|dưới|vẽ)/i.test(q.prompt) && !q.figure) return bad('nhắc hình nhưng không có figure')
    const n = entries.filter((e) => e.id.startsWith(`thpt-${topic}-`)).length + 1
    entries.push({
      id: `thpt-${topic}-${String(n).padStart(2, '0')}`,
      subject: SUBJECTS.has(q.subject) ? q.subject : 'Toán',
      grades: Array.isArray(q.grades) && q.grades.length ? q.grades : ['Lớp 12'],
      type: q.type,
      prompt: q.prompt,
      ...(q.type === 'tra-loi-ngan' || !opts ? {} : { options: opts.map((o) => ({ key: o.key, text: String(o.text) })) }),
      ...(q.answer ? { answer: String(q.answer) } : {}),
      ...(q.explanation ? { explanation: String(q.explanation) } : {}),
      points: POINTS[q.type],
      tags: [...new Set([...(q.tags ?? []).map(String), ...(q.level ? [q.level] : [])])],
      variable: false,
      ...(q.figure ? { figure: q.figure } : {}),
    })
  })
}

const ts =
  '/**\n * Câu THPT theo định dạng thi tốt nghiệp 2025 (trắc nghiệm, đúng/sai, trả lời ngắn), nhiều môn, soạn mới theo dạng và độ khó\n' +
  ' * của đề thi thử / kiểm tra các trường năm 2026. File sinh bằng scripts/bank/build.mjs — sửa câu thì sửa trực tiếp tại đây.\n */\n' +
  "import type { BankEntry } from './bank'\n\n" +
  `export const ${exportName}: BankEntry[] = ${JSON.stringify(entries, null, 2)}\n`
fs.writeFileSync(out, ts)
const by = {}
for (const e of entries) by[e.type] = (by[e.type] ?? 0) + 1
console.log('Tổng', entries.length, by, 'có hình', entries.filter((e) => e.figure).length)
console.log(problems.length ? 'Bỏ:\n' + problems.join('\n') : 'Không có câu lỗi')
