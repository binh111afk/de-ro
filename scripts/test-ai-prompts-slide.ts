/**
 * Prompt slide / bảng vẽ / tìm web / sửa slide do SERVER ghép (server/aiTasks.ts → server/generated/prompts.js) phải
 * giống từng byte prompt client cũ (bản chụp scripts/fixtures/prompt-slide-snap.json), và file đóng gói không bị cũ.
 *   npx tsx scripts/test-ai-prompts-slide.ts      (cũ thì chạy: npm run build:prompts)
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { buildTaskSystem } from '../server/aiTasks.ts'
import { ASK_RULE } from '../src/lib/prompts/common.ts'
import { bundlePrompts, OUT } from './build-server-prompts.mjs'

let fail = 0
const check = (name: string, cond: boolean, info?: unknown) => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${JSON.stringify(info)}`}`)
  if (!cond) fail++
}
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

const snap = JSON.parse(readFileSync(new URL('./fixtures/prompt-slide-snap.json', import.meta.url), 'utf8')) as {
  plans: Record<string, { slides: unknown[] }>
  items: Array<{ name: string; len: number; sha256: string }>
}
const want = (name: string) => snap.items.find((i) => i.name === name)!
const same = (name: string, s: string | null) => {
  const w = want(name)
  check(`${name}: khớp bản chụp`, s !== null && s.length === w.len && sha(s) === w.sha256, { len: s?.length, want: w.len })
}

// file đóng gói không cũ so với mã nguồn
check('server/generated/prompts.js đúng với mã nguồn (npm run build:prompts nếu cũ)', readFileSync(OUT, 'utf8') === (await bundlePrompts()))

// bảng vẽ, tìm web, sửa slide, HTML
const board = buildTaskSystem('bang-ve', {}) ?? ''
same('BOARD_SYSTEM', board)
const boardOps = buildTaskSystem('bang-ve', { ops: true }) ?? ''
same('BOARD_OPS_GUIDE', boardOps.slice(board.length))
same('WEB_SEARCH_SYSTEM', buildTaskSystem('tim-web', {}))
same('editSystemPrompt', buildTaskSystem('slide-sua', { context: 'Bài trình bày hiện tại (mẫu)' }))
same('HTML_DECK_SYSTEM', buildTaskSystem('slide-chat', { variant: 'html' }))
same('SLIDE_SYSTEM', buildTaskSystem('slide-chat', { variant: 'chat' }))
same('SLIDE_PLAN_SYSTEM', buildTaskSystem('slide-chat', { variant: 'plan' }))

// từng trang / từng lô trên hai dàn ý mẫu
for (const k of Object.keys(snap.plans)) {
  const plan = snap.plans[k]
  same(`pageSystemPrompt:${k}:1`, buildTaskSystem('slide-trang', { plan, index: 1 }))
  same(`pageSystemPrompt:${k}:4`, buildTaskSystem('slide-trang', { plan, index: 4 }))
  same(`batchSystemPrompt:${k}:0-4`, buildTaskSystem('slide-lo', { plan, indices: [0, 1, 2, 3, 4] }))
  same(`batchSystemPrompt:${k}:2-5`, buildTaskSystem('slide-lo', { plan, indices: [2, 3, 4, 5] }))
}

// phần ghép thêm của lượt chat: luật hỏi lại, ngữ cảnh, nguồn, web (đúng thứ tự như AiPanel cũ)
{
  const base = buildTaskSystem('slide-chat', { variant: 'chat' }) as string
  const full = buildTaskSystem('slide-chat', { variant: 'chat', ask: true, contextSummary: 'tóm tắt', withSources: true, sourceTier: 1, sources: [{ tier: 1, name: 'mau.pptx', text: 'nội dung' }], webFound: ' web ' }) as string
  check('slide-chat: ghép ask + ngữ cảnh + nguồn + web', full.startsWith(base + ASK_RULE + '\nBài trình bày hiện tại: tóm tắt\n\nNGUỒN ƯU TIÊN 1') && full.includes('--- NGUỒN 1 (ưu tiên 1)\nmau.pptx\nnội dung') && full.endsWith('\n\nNGUỒN TÌM TRÊN WEB (số liệu mới, ưu tiên dùng; số liệu lấy từ đây thì ghi nguồn ngắn trong đề/slide):\nweb'))
  const html = buildTaskSystem('slide-chat', { variant: 'html', ask: true }) as string
  check('slide-chat html: không có luật hỏi lại', !html.includes('HỎI LẠI KHI YÊU CẦU MƠ HỒ'))
  check('slide-lo: bắt suy nghĩ tiếng Việt khi think', (buildTaskSystem('slide-lo', { plan: snap.plans.toan, indices: [0, 1], think: true }) as string).includes('NGÔN NGỮ SUY NGHĨ'))
}

// dữ liệu sai kiểu bị từ chối
check('slide-chat: variant lạ → null', buildTaskSystem('slide-chat', { variant: 'x' }) === null)
check('slide-trang: index ngoài dàn ý → null', buildTaskSystem('slide-trang', { plan: snap.plans.toan, index: 99 }) === null)
check('slide-lo: chỉ số không hợp lệ → null', buildTaskSystem('slide-lo', { plan: snap.plans.toan, indices: [0, 'a'] }) === null && buildTaskSystem('slide-lo', { plan: {}, indices: [0] }) === null)
check('slide-sua: thiếu context → null', buildTaskSystem('slide-sua', {}) === null)

console.log(fail ? `\n${fail} lỗi` : '\nTất cả đều qua')
process.exit(fail ? 1 : 0)
