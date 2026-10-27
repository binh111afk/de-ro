/**
 * Chấm điểm thiết kế slide bằng model có thị giác (mặc định LLM_MODEL trong .env,
 * qua gateway OpenAI-compatible) theo một rubric cố định.
 *
 * Chạy: node scripts/judge-slides.mjs <thư-mục-ảnh> [--label tên] [--concurrency 3]
 * Thư mục chứa các ảnh slide `*-sNN.png` (từ `eval:slides --slides`) hoặc PNG bất kỳ
 * (mỗi ảnh một slide). Kết quả: <thư-mục>/judge.json + bảng điểm in ra màn hình.
 *
 * Lưu ý: điểm do một model chấm một lần nên có nhiễu (±1); dùng để so sánh tương
 * đối giữa các lần sửa, không phải số tuyệt đối.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const at = args.indexOf(name)
  return at >= 0 ? args.splice(at, 2)[1] : fallback
}
const label = flag('--label', 'deck')
const concurrency = Number(flag('--concurrency', 3))
const dir = args[0]
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain && !dir) {
  console.error('Thiếu thư mục ảnh.')
  process.exit(2)
}

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
)
const MODEL = process.env.JUDGE_MODEL || env.LLM_MODEL

const CRITERIA = {
  layout: 'Bố cục & căn chỉnh: bố cục cân đối, lề đều, không đè/tràn, khoảng trắng hợp lý',
  typography: 'Chữ: dễ đọc từ xa, cỡ chữ đủ lớn, phân cấp tiêu đề/nội dung rõ, không chữ quá nhỏ',
  color: 'Màu & tương phản: bảng màu hài hoà, chữ/hình tương phản tốt, không chói hay nhạt',
  hierarchy: 'Điểm nhấn & thông điệp: mắt biết nhìn đâu trước, một ý chính mỗi slide',
  imagery: 'Hình ảnh/minh hoạ: có hình hoặc biểu tượng đúng chủ đề, chất lượng tốt, không lạc nghĩa',
  polish: 'Độ hoàn thiện: nhìn như sản phẩm của nhà thiết kế (Canva/Gamma/Beautiful.ai), không "template máy"',
}

const RUBRIC = `Bạn là giám khảo thiết kế bài thuyết trình, chấm NGHIÊM và nhất quán.
Chấm ảnh MỘT slide giáo dục (tiếng Việt) theo 6 tiêu chí, mỗi tiêu chí thang 0–10:
${Object.entries(CRITERIA).map(([k, v], i) => `${i + 1}. ${k}: ${v}`).join('\n')}

THANG ĐIỂM THAM CHIẾU (áp dụng cho từng tiêu chí và tổng):
- 3: lỗi rõ (chữ tràn/đè, khó đọc, màu chọi nhau).
- 5: dùng được nhưng nghiệp dư, nhìn như template mặc định.
- 7: gọn gàng, đọc tốt, có thiết kế nhưng còn "an toàn", thiếu điểm nhấn thị giác.
- 8.5–9: ngang bài làm bằng Canva/Gamma/Beautiful.ai của nhà thiết kế tốt.
- 10: xuất sắc hiếm gặp. Đừng cho trên 9 trừ khi thật sự đẳng cấp.
Đừng nương tay; slide chỉ có chữ trên nền phẳng không quá 6 ở "imagery" và "polish".

Trả lời DUY NHẤT một JSON, không chữ ngoài JSON:
{"scores":{"layout":n,"typography":n,"color":n,"hierarchy":n,"imagery":n,"polish":n},"overall":n,"issues":["lỗi cụ thể quan trọng nhất","lỗi thứ hai (nếu có)"]}`

export async function judge(file) {
  const image = Buffer.isBuffer(file) ? file.toString('base64') : readFileSync(file).toString('base64')
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.LLM_API_KEY}`,
        'x-opencode-session': 'judge-slides',
        'User-Agent': 'de-ro/1.0',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: RUBRIC },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Chấm slide này.' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${image}` } },
            ],
          },
        ],
      }),
    }).catch(() => null)
    if (!res?.ok) continue
    const data = await res.json().catch(() => null)
    const content = data?.choices?.[0]?.message?.content ?? ''
    const json = content.match(/\{[\s\S]*\}/)?.[0]
    try {
      const parsed = JSON.parse(json)
      if (parsed?.scores && typeof parsed.overall === 'number') return parsed
    } catch {
      // thử lại
    }
  }
  return null
}

if (isMain) {
  const files = readdirSync(dir)
    .filter((name) => /\.png$/i.test(name) && /-s\d+\.png$|^ref-|^slide-/i.test(name))
    .sort()
  const results = new Array(files.length)
  let next = 0
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < files.length) {
        const i = next++
        results[i] = { file: files[i], ...(await judge(join(dir, files[i]))) }
        process.stderr.write(`\r${i + 1}/${files.length} `)
      }
    }),
  )
  process.stderr.write('\n')

  const ok = results.filter((r) => r.scores)
  const mean = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0)
  const fmt = (n) => n.toFixed(1)
  const byCriterion = Object.fromEntries(
    Object.keys(CRITERIA).map((key) => [key, mean(ok.map((r) => r.scores[key]))]),
  )
  const overall = mean(ok.map((r) => r.overall))

  // theo deck (tiền tố "<n>-s" của tên tệp)
  const decks = new Map()
  for (const r of ok) {
    const deck = r.file.match(/^(\d+)-s/)?.[1] ?? 'all'
    decks.set(deck, [...(decks.get(deck) ?? []), r.overall])
  }

  console.log(`\n=== ${label}: ${ok.length}/${files.length} slide được chấm — model ${MODEL} ===`)
  console.log(`Tổng: ${fmt(overall)}/10`)
  for (const [key, value] of Object.entries(byCriterion)) console.log(`  ${key.padEnd(11)} ${fmt(value)}`)
  if (decks.size > 1) {
    console.log('Theo deck:', [...decks].map(([k, v]) => `#${k}=${fmt(mean(v))}`).join('  '))
  }
  console.log('\n5 slide thấp nhất:')
  for (const r of [...ok].sort((a, b) => a.overall - b.overall).slice(0, 5)) {
    console.log(`  ${r.file} ${r.overall} — ${(r.issues ?? []).join(' | ')}`)
  }
  writeFileSync(join(dir, 'judge.json'), JSON.stringify({ label, model: MODEL, overall, byCriterion, results }, null, 2))
}
