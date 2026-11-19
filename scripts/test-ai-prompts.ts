/**
 * Prompt soạn đề ghép ở SERVER phải giống từng byte prompt client cũ (chụp trước khi chuyển, 7 đề: Toán 12, Toán 8, Lý 11,
 * Hoá 10, Văn 9, Sử 12, Toán 9 có hình). Chất lượng không đổi vì model nhận đúng chữ như trước.
 *   npx tsx scripts/test-ai-prompts.ts
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { ASK_RULE, THINK_VI } from '../src/lib/prompts/common.ts'
import { ASK_ONLY_SYSTEM, buildExamSystem, examSystemPrompt } from '../src/lib/prompts/exam.ts'
import { buildDeOnlineSystem, type DeOnlineInput } from '../src/lib/prompts/de-online.ts'
import { buildSuaCauSystem } from '../src/lib/prompts/sua-cau.ts'
import { sourcePrompt, sourceRule } from '../src/lib/prompts/sources.ts'

let fail = 0
const check = (name: string, cond: boolean, info?: unknown) => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : ` — ${JSON.stringify(info)}`}`)
  if (!cond) fail++
}
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

const snaps = JSON.parse(readFileSync(new URL('./fixtures/prompt-exam-snap.json', import.meta.url), 'utf8')) as Array<{ name: string; topic: string; len: number; sha256: string }>
for (const s of snaps) {
  // đúng cách harness cũ ghép: examSystemPrompt(không tài liệu, yêu cầu) + luật hỏi lại
  const legacy = examSystemPrompt(undefined, s.topic) + ASK_RULE
  check(`${s.name}: prompt hàm cũ khớp bản chụp`, legacy.length === s.len && sha(legacy) === s.sha256, { len: legacy.length, want: s.len })
  const viaTask = buildExamSystem({ text: s.topic, ask: true })
  check(`${s.name}: buildExamSystem (task soan-de) khớp bản chụp`, viaTask === legacy, { len: viaTask.length })
}

// các phần ghép thêm: nguồn, khung, web, suy nghĩ — đúng thứ tự và ngăn cách như AiPanel cũ
{
  const items = [{ tier: 1, name: 'de-mau.docx', text: 'Câu 1. …' }]
  const full = buildExamSystem({ text: 'soạn đề', contextSummary: 'tóm tắt', ask: true, withSources: true, sourceTier: 1, sources: items, khung: 'KHUNG', webFound: ' web ', think: true })
  const want =
    examSystemPrompt(undefined, 'soạn đề\ntóm tắt') + ASK_RULE + '\nTài liệu hiện tại: tóm tắt' +
    `\n\n${sourceRule(1)}\n\n${sourcePrompt(items)}\n\nKHUNG` +
    '\n\nNGUỒN TÌM TRÊN WEB (số liệu mới, ưu tiên dùng; số liệu lấy từ đây thì ghi nguồn ngắn trong đề/slide):\nweb' + THINK_VI
  check('ghép đủ nguồn + khung + web + suy nghĩ', full === want)
  check('không có nguồn: không thêm phần nguồn', !buildExamSystem({ text: 'x' }).includes('NGUỒN'))
  check('withSources không nguồn: có luật "không có nguồn"', buildExamSystem({ text: 'x', withSources: true }).includes('KHÔNG CÓ NGUỒN CHO LƯỢT NÀY'))
}

// prompt hỏi trước (chưa nêu môn) giữ nguyên chữ cũ ở AiAskPanel
check('ASK_ONLY_SYSTEM đúng chữ cũ', ASK_ONLY_SYSTEM === 'Bạn là trợ lý soạn đề thi và bài giảng cho giáo viên Việt Nam.' + ASK_RULE + '\nNếu từ yêu cầu đoán hợp lý được môn và nội dung (vd "đề phương trình bậc hai" là Toán) thì KHÔNG hỏi, chỉ trả đúng {"action":"proceed"}.')

// de-online
{
  const snaps = JSON.parse(readFileSync(new URL('./fixtures/prompt-de-online-snap.json', import.meta.url), 'utf8')) as Array<{
    name: string
    meta: DeOnlineInput['meta']
    questions: DeOnlineInput['questions']
    len: number
    sha256: string
  }>
  for (const s of snaps) {
    const built = buildDeOnlineSystem({ meta: s.meta, questions: s.questions })
    check(`de-online (${s.name}): khớp bản chụp`, built.length === s.len && sha(built) === s.sha256, { len: built.length, want: s.len })
  }
}

// sua-cau
{
  const snaps = JSON.parse(readFileSync(new URL('./fixtures/prompt-sua-cau-snap.json', import.meta.url), 'utf8')) as Array<{ name: string; len: number; sha256: string }>
  for (const s of snaps) {
    const built = buildSuaCauSystem()
    check(`sua-cau (${s.name}): khớp bản chụp`, built.length === s.len && sha(built) === s.sha256, { len: built.length, want: s.len })
  }
}

console.log(fail ? `\n${fail} lỗi` : '\nTất cả đều qua')
process.exit(fail ? 1 : 0)
