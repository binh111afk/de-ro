import { costFromUsage, estimateCost, isDeepseekPeak } from '../server/ops.ts'

let pass = 0
let fail = 0
function check(name: string, actual: number | null, expected: number | null) {
  const ok = actual === expected || (actual !== null && expected !== null && Math.abs(actual - expected) < 1e-12)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ` (nhận ${actual}, cần ${expected})`}`)
  ok ? pass++ : fail++
}

const usage = { prompt_tokens: 1_000_000, completion_tokens: 500_000 }
const cachedUsage = { ...usage, prompt_cache_hit_tokens: 500_000 }
// Thứ Tư 03:00 UTC = cao điểm; thứ Bảy 03:00 UTC = thấp điểm (giá ngoài giờ cao điểm bằng một nửa)
const PEAK = new Date('2026-11-18T03:00:00Z')
const OFF_PEAK = new Date('2026-11-21T03:00:00Z')
const defaultCost = 0.753
const offPeakCost = 0.3765

delete process.env.AI_PRICE_DEEPSEEK
delete process.env.AI_PRICE_UNKNOWN
delete process.env.AI_PRICE_CONSTRUCTOR
process.env.AI_PRICE_OPENCODE = '2,0.5,4'

check('estimateCost thiếu usage → null', estimateCost(undefined, 'deepseek'), null)
check('costFromUsage thiếu usage → null', costFromUsage(null, 'deepseek'), null)
check('usage rỗng → null', estimateCost({}, 'deepseek'), null)
check('nhà cung cấp lạ → null', costFromUsage(usage, 'unknown'), null)
check('tên trùng thuộc tính kế thừa → null', estimateCost(usage, 'constructor'), null)
check('tính giá cache từ prompt_cache_hit_tokens', estimateCost(cachedUsage, 'deepseek', PEAK), defaultCost)
check('giờ thấp điểm: giá bằng một nửa', estimateCost(cachedUsage, 'deepseek', OFF_PEAK), offPeakCost)
check('tính giá cache từ prompt_tokens_details.cached_tokens', costFromUsage({
  ...usage,
  prompt_tokens_details: { cached_tokens: 500_000 },
}, 'deepseek', PEAK), defaultCost)
check('opencode.list_cost ưu tiên hơn ước tính', costFromUsage({
  ...usage,
  opencode: { list_cost: 0.42 },
}, 'opencode'), 0.42)
check('opencode.list_cost bằng 0 vẫn được ưu tiên', costFromUsage({
  ...usage,
  opencode: { list_cost: 0 },
}, 'opencode'), 0)
check('token trúng cache vượt prompt chỉ tính tối đa bằng prompt', estimateCost({
  prompt_tokens: 1_000_000,
  prompt_cache_hit_tokens: 2_000_000,
}, 'deepseek', PEAK), 0.006)

process.env.AI_PRICE_UNKNOWN = '2,0.5,4'
check('nhà cung cấp lạ có biến giá → null', estimateCost(usage, 'unknown'), null)
process.env.AI_PRICE_DEEPSEEK = '2, 0.5, 4'
check('AI_PRICE_DEEPSEEK hợp lệ ghi đè cả ba mức giá', estimateCost(cachedUsage, 'deepseek'), 3.25)
process.env.AI_PRICE_DEEPSEEK = '2,0,4'
check('AI_PRICE_DEEPSEEK chấp nhận giá cache bằng 0', estimateCost(cachedUsage, 'deepseek'), 3)

for (const price of ['2,4', '2,,4', '2, ,4', '2,-0.5,4', '2,abc,4']) {
  process.env.AI_PRICE_DEEPSEEK = price
  check(`AI_PRICE_DEEPSEEK=${JSON.stringify(price)} → dùng giá mặc định`, estimateCost(cachedUsage, 'deepseek', PEAK), defaultCost)
}

for (const [at, peak] of [
  ['2026-11-18T00:59:59Z', false],
  ['2026-11-18T01:00:00Z', true],
  ['2026-11-18T03:59:59Z', true],
  ['2026-11-18T04:00:00Z', false],
  ['2026-11-18T06:00:00Z', true],
  ['2026-11-18T09:59:59Z', true],
  ['2026-11-18T10:00:00Z', false],
  ['2026-11-21T03:00:00Z', false],
  ['2026-11-22T07:00:00Z', false],
  ['2026-11-23T07:00:00Z', true],
] as const) {
  check(`isDeepseekPeak(${at}) = ${peak}`, Number(isDeepseekPeak(new Date(at))), Number(peak))
}

console.log(`\n${pass}/${pass + fail} pass, ${fail} fail`)
if (fail) process.exitCode = 1
