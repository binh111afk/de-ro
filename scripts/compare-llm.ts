/**
 * So sánh các model ứng viên cho dự phòng 3 (thay Anthropic): FOSTA, NightRouter,
 * và Anthropic hiện tại làm mốc. Chạy cùng một bộ bài thử sát việc của app
 * (soạn đề JSON, toán có $…$, dàn ý slide JSON, văn tiếng Việt), chấm tự động
 * và đo thời gian.
 *
 *   npm run compare:llm                      # đọc .env ở thư mục hiện tại
 *   npm run compare:llm -- --env ../x/.env   # đọc .env ở chỗ khác
 *   npm run compare:llm -- --only fosta      # chỉ một bên (fosta | nightrouter | anthropic)
 *
 * Kết quả: bảng trong terminal + file compare-llm-result.md (kèm câu trả lời
 * đầy đủ để đọc bằng mắt). File kết quả không commit.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : undefined
}

function loadEnv(file: string) {
  if (!existsSync(file)) {
    console.error(`Không thấy file env: ${file}`)
    process.exit(1)
  }
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && m[2] && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv(arg('env') ?? '.env')

const TIMEOUT = 120_000
const env = (k: string) => process.env[k]?.trim() ?? ''

// ---------------------------------------------------------------- bài thử
interface Task {
  id: string
  name: string
  system: string
  user: string
  /** chấm 0–1 kèm ghi chú */
  grade: (out: string) => { score: number; note: string }
}

function parseJson(out: string): unknown {
  const s = out
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error('không thấy JSON')
  return JSON.parse(s.slice(a, b + 1))
}

const VI = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gi

const TASKS: Task[] = [
  {
    id: 'de-json',
    name: 'Soạn đề trắc nghiệm (JSON)',
    system: 'Bạn là giáo viên Toán. Chỉ trả về JSON hợp lệ, không giải thích.',
    user:
      'Soạn 4 câu trắc nghiệm Toán lớp 6, chủ đề phân số, mức độ tăng dần. ' +
      'Định dạng: {"questions":[{"q":"…","options":["…","…","…","…"],"answer":0}]} ' +
      'trong đó answer là chỉ số 0–3 của đáp án đúng. Công thức viết trong $…$.',
    grade(out) {
      try {
        const j = parseJson(out) as { questions?: Array<{ q?: string; options?: unknown[]; answer?: number }> }
        const qs = j.questions ?? []
        let ok = 0
        for (const q of qs) if (q.q && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answer) && q.answer! >= 0 && q.answer! < 4) ok++
        const answers = new Set(qs.map((q) => q.answer))
        const score = qs.length === 4 ? (ok / 4) * (answers.size > 1 ? 1 : 0.8) : (ok / 4) * 0.7
        return { score, note: `${qs.length} câu, ${ok} câu đúng khuôn, đáp án dùng ${answers.size} chữ cái` }
      } catch (e) {
        return { score: 0, note: `JSON hỏng: ${(e as Error).message}` }
      }
    },
  },
  {
    id: 'toan',
    name: 'Giải toán, công thức $…$',
    system: 'Bạn là giáo viên Toán. Trình bày ngắn gọn, mọi công thức đặt trong $…$.',
    user: 'Giải phương trình $x^2 - 5x + 6 = 0$ và hệ $\\begin{cases} x + y = 7 \\\\ x - y = 1 \\end{cases}$. Nêu rõ kết quả cuối cùng.',
    grade(out) {
      // nhận nhiều cách viết: x = 2, x_1 = 3, S = {2; 3}, x ∈ {2, 3}, (x - 2)(x - 3)…
      const has = (re: RegExp) => re.test(out)
      const roots =
        (has(/x(_\{?\d\}?)?\s*=\s*2\b/) && has(/x(_\{?\d\}?)?\s*=\s*3\b/)) || has(/\{\s*2\s*[;,]\s*\\?,?\s*3\s*\\?\}/) || has(/\{\s*3\s*[;,]\s*\\?,?\s*2\s*\\?\}/)
      const sys = (has(/x\s*=\s*4\b/) && has(/y\s*=\s*3\b/)) || has(/\(\s*4\s*[;,]\s*\\?,?\s*3\s*\)/)
      const dollars = (out.match(/\$/g) ?? []).length
      const math = dollars >= 4 && dollars % 2 === 0
      const score = (roots ? 0.4 : 0) + (sys ? 0.4 : 0) + (math ? 0.2 : 0)
      return { score, note: `nghiệm PT ${roots ? 'đúng' : 'SAI'}, hệ ${sys ? 'đúng' : 'SAI'}, $…$ ${math ? 'ổn' : 'thiếu/lẻ'}` }
    },
  },
  {
    id: 'slide-json',
    name: 'Dàn ý slide (JSON)',
    system: 'Bạn thiết kế bài giảng. Chỉ trả về JSON hợp lệ.',
    user:
      'Lập dàn ý 6 slide bài "Vòng tuần hoàn của nước" (Khoa học lớp 4). ' +
      'Định dạng: {"slides":[{"layout":"title|bullets|two-column|image-left|quiz|closing","title":"…","points":["…"]}]}. ' +
      'Slide đầu là title, slide cuối là closing, có đúng 1 slide quiz.',
    grade(out) {
      try {
        const j = parseJson(out) as { slides?: Array<{ layout?: string; title?: string }> }
        const s = j.slides ?? []
        const allowed = new Set(['title', 'bullets', 'two-column', 'image-left', 'quiz', 'closing'])
        const valid = s.filter((x) => x.title && allowed.has(String(x.layout))).length
        const rules = [s.length === 6, s[0]?.layout === 'title', s[s.length - 1]?.layout === 'closing', s.filter((x) => x.layout === 'quiz').length === 1]
        const score = (valid / Math.max(6, s.length)) * 0.5 + (rules.filter(Boolean).length / 4) * 0.5
        return { score, note: `${s.length} slide, ${valid} hợp lệ, đạt ${rules.filter(Boolean).length}/4 luật` }
      } catch (e) {
        return { score: 0, note: `JSON hỏng: ${(e as Error).message}` }
      }
    },
  },
  {
    id: 'van',
    name: 'Văn tiếng Việt',
    system: 'Bạn là giáo viên Ngữ văn THCS.',
    user: 'Viết một đoạn văn khoảng 100 chữ giới thiệu ý nghĩa của Tết Trung thu cho học sinh lớp 6. Chỉ trả về đoạn văn.',
    grade(out) {
      const words = out.trim().split(/\s+/).length
      const viRatio = (out.match(VI) ?? []).length / Math.max(1, out.replace(/\s/g, '').length)
      const len = words >= 70 && words <= 140
      const vi = viRatio > 0.12
      const noEn = !/\b(the|and|festival|children)\b/i.test(out)
      const score = (len ? 0.4 : 0.15) + (vi ? 0.4 : 0) + (noEn ? 0.2 : 0)
      return { score, note: `${words} chữ, tỉ lệ dấu ${(viRatio * 100).toFixed(0)}%${noEn ? '' : ', lẫn tiếng Anh'}` }
    },
  },
]

// ---------------------------------------------------------------- gọi model
interface Target {
  provider: string
  model: string
  call: (system: string, user: string) => Promise<{ text: string; tokens?: number }>
}

async function post(url: string, headers: Record<string, string>, body: unknown) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), TIMEOUT)
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctl.signal })
    const txt = await r.text()
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 200)}`)
    return JSON.parse(txt) as Record<string, any>
  } finally {
    clearTimeout(t)
  }
}

/** chat/completions; nếu bên đó chỉ hỗ trợ /responses thì thử lại bằng /responses */
function openaiTarget(provider: string, base: string, key: string, model: string): Target {
  let useResponses = false
  return {
    provider,
    model,
    async call(system, user) {
      const auth = { Authorization: `Bearer ${key}` }
      if (!useResponses) {
        try {
          const j = await post(`${base}/chat/completions`, auth, { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
          const text = j.choices?.[0]?.message?.content
          if (typeof text === 'string') return { text, tokens: j.usage?.total_tokens }
          throw new Error('trả về rỗng')
        } catch (e) {
          if (!/HTTP (404|400|405)/.test(String(e))) throw e
          useResponses = true
        }
      }
      const j = await post(`${base}/responses`, auth, { model, instructions: system, input: user })
      const text =
        j.output_text ??
        (j.output as any[] | undefined)?.flatMap((o) => o.content ?? []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('')
      if (!text) throw new Error('trả về rỗng (/responses)')
      return { text, tokens: j.usage?.total_tokens }
    },
  }
}

function anthropicTarget(key: string, model: string): Target {
  return {
    provider: 'anthropic',
    model,
    async call(system, user) {
      const j = await post('https://api.anthropic.com/v1/messages', { 'x-api-key': key, 'anthropic-version': '2023-06-01' }, { model, max_tokens: 2048, system, messages: [{ role: 'user', content: user }] })
      const text = (j.content as any[]).filter((c) => c.type === 'text').map((c) => c.text).join('')
      return { text, tokens: (j.usage?.input_tokens ?? 0) + (j.usage?.output_tokens ?? 0) }
    },
  }
}

async function listModels(base: string, key: string): Promise<string[]> {
  try {
    const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } })
    const j = (await r.json()) as { data?: Array<{ id: string }> }
    return (j.data ?? []).map((m) => m.id)
  } catch {
    return []
  }
}

async function buildTargets(): Promise<Target[]> {
  const only = arg('only')
  const want = (p: string) => !only || only === p
  const out: Target[] = []
  const strip = (u: string) => u.replace(/\/+$/, '')

  if (want('fosta')) {
    const key = env('FOSTA_API_KEY')
    if (!key) console.log('• FOSTA: chưa điền FOSTA_API_KEY → bỏ qua')
    else for (const m of (env('FOSTA_MODELS') || 'gpt-6.1-sol,gpt-6-astra,gpt-6-luna').split(',').map((s) => s.trim()).filter(Boolean))
      out.push(openaiTarget('fosta', strip(env('FOSTA_BASE_URL') || 'https://codex.fosta.app/v1'), key, m))
  }
  if (want('nightrouter')) {
    const key = env('NIGHTROUTER_API_KEY')
    const base = strip(env('NIGHTROUTER_BASE_URL') || 'https://api.nightrouter.ai/v1')
    if (!key) console.log('• NightRouter: chưa điền NIGHTROUTER_API_KEY → bỏ qua')
    else {
      let models = env('NIGHTROUTER_MODELS').split(',').map((s) => s.trim()).filter(Boolean)
      if (!models.length) {
        const all = await listModels(base, key)
        console.log(`• NightRouter có ${all.length} model: ${all.slice(0, 40).join(', ')}${all.length > 40 ? '…' : ''}`)
        models = all.filter((m) => /gpt/i.test(m)).slice(0, 4)
        if (!models.length) models = all.slice(0, 3)
        console.log(`  → thử: ${models.join(', ') || '(không lấy được danh sách, điền NIGHTROUTER_MODELS)'}`)
      }
      for (const m of models) out.push(openaiTarget('nightrouter', base, key, m))
    }
  }
  if (want('anthropic')) {
    const key = env('ANTHROPIC_API_KEY')
    if (key) out.push(anthropicTarget(key, env('ANTHROPIC_MODEL') || 'claude-opus-5-5'))
    else console.log('• Anthropic: không có key → không có mốc so sánh')
  }
  return out
}

// ---------------------------------------------------------------- chạy
interface Row {
  target: Target
  results: Array<{ task: Task; score: number; note: string; ms: number; tokens?: number; text: string; error?: string }>
}

async function main() {
  const targets = await buildTargets()
  if (!targets.length) {
    console.log('\nChưa có model nào để thử. Điền FOSTA_API_KEY / NIGHTROUTER_API_KEY trong .env rồi chạy lại.')
    return
  }
  // --delay: giãn cách giữa các lượt của một model (model miễn phí giới hạn ~3 lượt/phút); khi có delay các model chạy song song
  const delay = Number(arg('delay') ?? 0)
  const rows: Row[] = targets.map((target) => ({ target, results: [] }))
  const runRow = async (row: Row) => {
    const { target } = row
    for (const [ti, task] of TASKS.entries()) {
      if (delay && ti) await new Promise((r) => setTimeout(r, delay))
      const t0 = Date.now()
      try {
        const { text, tokens } = await target.call(task.system, task.user)
        const g = task.grade(text)
        row.results.push({ task, ...g, ms: Date.now() - t0, tokens, text })
        console.log(`${target.provider}/${target.model} ${task.id}: ${(g.score * 100).toFixed(0)}`)
      } catch (e) {
        row.results.push({ task, score: 0, note: 'LỖI', ms: Date.now() - t0, text: '', error: (e as Error).message })
        console.log(`${target.provider}/${target.model} ${task.id}: LỖI`)
      }
    }
  }
  if (delay) await Promise.all(rows.map(runRow))
  else for (const row of rows) await runRow(row)

  const sum = (r: Row) => r.results.reduce((s, x) => s + x.score, 0) / TASKS.length
  const avgMs = (r: Row) => r.results.reduce((s, x) => s + x.ms, 0) / r.results.length
  const fails = (r: Row) => r.results.filter((x) => x.error).length
  rows.sort((a, b) => sum(b) - sum(a) || avgMs(a) - avgMs(b))

  const head = `| Model | Điểm TB | ${TASKS.map((t) => t.name).join(' | ')} | Thời gian TB | Lỗi gọi |`
  const sep = `|${'---|'.repeat(TASKS.length + 4)}`
  const lines = rows.map(
    (r) =>
      `| ${r.target.provider}/${r.target.model} | **${(sum(r) * 100).toFixed(0)}** | ${r.results.map((x) => (x.error ? 'lỗi' : (x.score * 100).toFixed(0))).join(' | ')} | ${(avgMs(r) / 1000).toFixed(1)}s | ${fails(r)} |`,
  )
  const table = [head, sep, ...lines].join('\n')
  console.log(`\n\n${table}\n`)

  let md = `# So sánh model dự phòng 3\n\nChạy lúc ${new Date().toLocaleString('vi-VN')}\n\n${table}\n`
  for (const r of rows) {
    md += `\n## ${r.target.provider}/${r.target.model}\n`
    for (const x of r.results) {
      md += `\n### ${x.task.name}: ${x.error ? 'LỖI' : (x.score * 100).toFixed(0)} điểm, ${(x.ms / 1000).toFixed(1)}s${x.tokens ? `, ${x.tokens} token` : ''}\n\n`
      md += x.error ? `\`${x.error}\`\n` : `_${x.note}_\n\n\`\`\`\n${x.text.trim().slice(0, 3000)}\n\`\`\`\n`
    }
  }
  writeFileSync('compare-llm-result.md', md)
  console.log('Đã ghi chi tiết vào compare-llm-result.md')
}

void main()
