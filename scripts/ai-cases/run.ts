/**
 * Chạy bộ yêu cầu thử qua DeepSeek (TỐN TIỀN THẬT) rồi chấm như web sẽ xử lý.
 *   npm run build:prompts && npm run eval:ai -- --label ten-dot [--only id1,id2] [--dry]
 * --dry: không gọi model, chỉ in web định gửi tác vụ nào. Kết quả ở eval-out/ai-cases/<label>/.
 * Đường đi (đoán loại lượt, nhận kết quả) chép theo `send` trong AiPanel.tsx: sửa bên đó thì sửa cả đây.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-text-style/font-family'
import { EXAM_NODES, EXAM_MARKS, BaseParagraphNode } from '../../src/examEditor/schema'
import { blocksToTipTap, tipTapToBlocks } from '../../src/examEditor/convert'
import { applyExamReply } from '../../src/examEditor/examAiResult'
import { figureDoc, figureImageAttrs } from '../../src/examEditor/toolImages'
import { chatOnly, examDigest, examIntent, focusNote, isExamMutationReply, rewritesWholeExam } from '../../src/lib/aiDocContext'
import { parseAsk } from '../../src/examEditor/AiAskPanel'
import { parseDeckPlan } from '../../src/lib/aiDeck'
import { looksLikeEdit, parseEditCommands } from '../../src/lib/slideEdit'
import { extractJson } from '../../src/lib/llm'
import { buildTaskSystem } from '../../server/aiTasks'
import { BOARD_CASES, EXAM, EXAM_CASES, SLIDE_CASES, SLIDE_CONTEXT, type BoardCase, type ExamCase, type SlideCase } from './cases'

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i < 0 ? undefined : process.argv[i + 1]
}
const dry = process.argv.includes('--dry')
const label = arg('label') ?? 'moi'
const only = arg('only')?.split(',')
const dir = `eval-out/ai-cases/${label}`

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).flatMap((l) => {
  const m = /^(DEEPSEEK_\w+)=(.*)$/.exec(l)
  return m ? [[m[1], m[2].trim().replace(/^["']|["']$/g, '')]] : []
}))
const base = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')

interface Reply { content: string; tokens: number; seconds: number; finish: string }
async function ask(task: string, input: unknown, user: string): Promise<Reply> {
  const system = buildTaskSystem(task, input)
  if (!system) throw new Error(`tác vụ ${task} không dựng được prompt`)
  const t0 = Date.now()
  const res = await fetch(`${base}${base.endsWith('/v1') ? '' : '/v1'}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: env.DEEPSEEK_MODEL || 'deepseek-flash', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 32000, reasoning_effort: 'low' }),
    signal: AbortSignal.timeout(280_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json() as { choices?: { message?: { content?: string }; finish_reason?: string }[]; usage?: { completion_tokens?: number } }
  return { content: data.choices?.[0]?.message?.content ?? '', tokens: data.usage?.completion_tokens ?? 0, seconds: Math.round((Date.now() - t0) / 1000), finish: data.choices?.[0]?.finish_reason ?? '' }
}

const newEditor = (empty: boolean) => new Editor({
  element: null,
  extensions: [
    StarterKit.configure({
      paragraph: false, heading: false, orderedList: false, bulletList: false, listItem: false,
      link: false, underline: false, hardBreak: false, horizontalRule: false,
    }),
    TextStyle, FontFamily, Table, TableRow, TableCell, TableHeader, ...EXAM_MARKS, ...EXAM_NODES, BaseParagraphNode,
  ],
  content: empty ? { type: 'doc', content: [{ type: 'paragraph' }] } : blocksToTipTap(EXAM),
})
const draw = (raw: unknown) => {
  const tool = figureDoc(raw)
  return tool ? figureImageAttrs(tool) : undefined
}
const questions = (editor: Editor) => tipTapToBlocks(editor.getJSON()).flatMap((b) => (b.type === 'question' ? [b] : []))
const body = (q: object) => JSON.stringify({ ...q, no: 0 })

interface Result { id: string; mode: string; pass: boolean; got: string; why?: string; task: string; tokens: number; seconds: number; reply: string }

async function runExam(c: ExamCase): Promise<Result> {
  const editor = newEditor(!!c.empty)
  const digest = examDigest(editor.getJSON())
  const intent = examIntent(c.text)
  const revising = intent === 'doc' && !!digest && !rewritesWholeExam(c.text)
  const askRule = !(intent === 'chat' || revising)
  const task = `soan-de/${intent}`
  const done = (got: string, why: string | undefined, r?: Reply): Result => {
    editor.destroy()
    return { id: c.id, mode: 'de', pass: !why, got, why, task, tokens: r?.tokens ?? 0, seconds: r?.seconds ?? 0, reply: r?.content ?? '' }
  }
  if (dry) return done('-', undefined)
  const r = await ask('soan-de', { text: c.text, intent, digest, revising, ask: askRule, think: true }, c.text + focusNote(editor.getJSON(), c.text))
  const before = questions(editor)
  const beforeJson = JSON.stringify(editor.getJSON())
  const guessedChat = intent === 'chat' && isExamMutationReply(r.content)
  const asEdit = intent === 'doc' || (guessedChat && !chatOnly(c.text))
  let got: string
  let note = ''
  if (askRule && parseAsk(r.content)) got = 'ask'
  else if (asEdit && /^\s*(?:```(?:json)?\s*)?\{/i.test(r.content)) {
    const allowReplace = intent === 'doc' ? !revising : !digest || rewritesWholeExam(c.text)
    // tuỳ chọn như handleAiResult (ComposeDoc.tsx)
    const res = applyExamReply(editor, r.content, allowReplace, draw, undefined, undefined, {
      allowImageRemoval: /(?:xoá|xóa|bỏ|gỡ)\s+(?:bớt\s+)?(?:hình|ảnh)/iu.test(c.text),
      requirePatch: !allowReplace && /(?<!\p{L})(?:xoá|xóa|bỏ|xáo|trộn|sửa|đổi|chỉnh|cập nhật)(?!\p{L})/iu.test(c.text),
    })
    got = res.failed ? 'failed' : 'edit'
    note = res.text
  } else if (!asEdit && isExamMutationReply(r.content)) got = 'json-trong-chat'
  else got = r.content.trim() ? 'text' : `rong (${r.finish})`

  const why: string[] = []
  if (got !== c.want) why.push(`cần ${c.want}, được ${got}${note ? `: ${note.slice(0, 150)}` : ''}`)
  if (got === 'edit') {
    const after = questions(editor)
    const lost = (c.keep ?? []).filter((no) => {
      const q = before.find((b) => b.no === no)
      return q && !after.some((a) => body(a) === body(q))
    })
    if (lost.length) why.push(`đụng câu ${lost.join(', ')}`)
    if (c.minQuestions && after.length < c.minQuestions) why.push(`chỉ có ${after.length} câu`)
    if (c.figure && !JSON.stringify(editor.getJSON()).includes('data:image')) why.push('không có hình')
    if (/Chưa dựng được/.test(note)) why.push('có hình không dựng được')
  }
  if (c.want !== 'edit' && JSON.stringify(editor.getJSON()) !== beforeJson) why.push('đề bị đổi')
  return done(got, why.join('; ') || undefined, r)
}

async function runSlide(c: SlideCase): Promise<Result> {
  const editing = c.existing > 0 && looksLikeEdit(c.text)
  const hints = ['slide', 'bài giảng', 'dàn ý', 'tóm tắt', 'hình ảnh', 'thêm', 'sửa', 'đổi', 'soạn', 'sinh', 'viết'] // như detectIntent
  const doc = editing || hints.some((h) => c.text.toLowerCase().includes(h))
  const task = editing ? 'slide-sua' : `slide-chat/${doc ? 'plan' : 'chat'}`
  const done = (got: string, why: string | undefined, r?: Reply): Result =>
    ({ id: c.id, mode: 'slide', pass: !why, got, why, task, tokens: r?.tokens ?? 0, seconds: r?.seconds ?? 0, reply: r?.content ?? '' })
  if (dry) return done('-', undefined)
  const context = c.existing ? SLIDE_CONTEXT : undefined
  const r = editing
    ? await ask('slide-sua', { context }, c.text)
    : await ask('slide-chat', { variant: doc ? 'plan' : 'chat', ask: true, contextSummary: context, think: true }, c.text)
  let got: string
  if (editing) got = parseEditCommands(r.content).ops.length ? 'commands' : 'failed'
  else if (doc) got = parseAsk(r.content) ? 'ask' : parseDeckPlan(r.content) ? 'plan' : /^\s*(?:```(?:json)?\s*)?[{[]/.test(r.content) ? 'failed' : 'text'
  else got = /^\s*(?:```(?:json)?\s*)?[{[]/i.test(r.content) || /"(?:slides|commands)"\s*:/.test(r.content) ? 'json-trong-chat' : 'text'
  // bài đã có slide mà web đi lập dàn ý mới là sai đường, không phải sửa
  return done(got, got === c.want ? undefined : `cần ${c.want}, được ${got}`, r)
}

async function runBoard(c: BoardCase): Promise<Result> {
  const done = (got: string, why: string | undefined, r?: Reply): Result =>
    ({ id: c.id, mode: 'bang', pass: !why, got, why, task: 'bang-ve', tokens: r?.tokens ?? 0, seconds: r?.seconds ?? 0, reply: r?.content ?? '' })
  if (dry) return done('-', undefined)
  const r = await ask('bang-ve', { ops: true, contextSummary: 'Bảng đang trống. Vùng nhìn thấy: x 0..1200, y 0..700.', think: true }, c.text)
  let got = 'text'
  if (/"ops"\s*:/.test(r.content)) {
    try {
      got = Array.isArray(extractJson<{ ops?: unknown }>(r.content).ops) ? 'ops' : 'failed'
    } catch {
      got = 'failed'
    }
  }
  return done(got, got === c.want ? undefined : `cần ${c.want}, được ${got}`, r)
}

const jobs = [
  ...EXAM_CASES.map((c) => ({ id: c.id, run: () => runExam(c) })),
  ...SLIDE_CASES.map((c) => ({ id: c.id, run: () => runSlide(c) })),
  ...BOARD_CASES.map((c) => ({ id: c.id, run: () => runBoard(c) })),
].filter((j) => !only || only.includes(j.id))

mkdirSync(dir, { recursive: true })
const results: Result[] = []
let next = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++]
    const r = await job.run().catch((e: Error): Result => ({ id: job.id, mode: '?', pass: false, got: 'lỗi', why: e.message, task: '', tokens: 0, seconds: 0, reply: '' }))
    results.push(r)
    console.log(`${dry ? '·' : r.pass ? '✓' : '✗'} ${r.id} [${r.task}] ${r.got} ${r.seconds}s ${r.tokens}tk${r.why ? ` — ${r.why}` : ''}`)
    writeFileSync(`${dir}/results.json`, JSON.stringify(results, null, 1))
  }
}))
const sum = (key: 'tokens' | 'seconds') => results.reduce((s, r) => s + r[key], 0)
console.log(`\n${label}: đạt ${results.filter((r) => r.pass).length}/${results.length} · ${sum('tokens')} token ra · ${sum('seconds')} giây cộng dồn`)
process.exit(0)
