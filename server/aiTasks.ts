/**
 * Tác vụ AI do SERVER ghép system prompt: client gửi `task` + dữ liệu người dùng, không gửi chữ prompt.
 * Chữ prompt nằm ở `src/lib/prompts/*` (module thuần, dùng chung với test).
 *
 * Thêm tác vụ mới: viết hàm ghép trong `src/lib/prompts/`, thêm vào `TASKS` ở đây, kiểm kiểu dữ liệu client gửi.
 */
import { ASK_ONLY_SYSTEM, buildExamSystem, type ExamTaskInput } from '../src/lib/prompts/exam.js'
import { buildDeOnlineSystem, type DeOnlineQuestionSummary } from '../src/lib/prompts/de-online.js'
import { buildSuaCauSystem } from '../src/lib/prompts/sua-cau.js'
import { buildVeDoThiSystem } from '../src/lib/prompts/ve-do-thi.js'
import { buildChonHinhSystem } from '../src/lib/prompts/chon-hinh.js'
import { buildNganHangSystem } from '../src/lib/prompts/ngan-hang.js'
import type { PromptSource } from '../src/lib/prompts/sources.js'

const MAX_FIELD = 600_000
const MAX_SOURCES = 40

const str = (v: unknown, max = MAX_FIELD): string | undefined => (typeof v === 'string' ? v.slice(0, max) : undefined)

function sources(v: unknown): PromptSource[] {
  if (!Array.isArray(v)) return []
  const out: PromptSource[] = []
  for (const s of v.slice(0, MAX_SOURCES)) {
    const o = (s ?? {}) as Record<string, unknown>
    const text = str(o.text)
    if (typeof o.name !== 'string' || text === undefined) continue
    out.push({ tier: Number(o.tier) === 1 ? 1 : 0, name: o.name.slice(0, 300), url: str(o.url, 1000), text })
  }
  return out
}

/** `soan-de`: soạn / sửa đề trong trình soạn. */
function soanDe(raw: unknown): string | null {
  const o = (raw ?? {}) as Record<string, unknown>
  const text = str(o.text)
  if (text === undefined) return null
  const input: ExamTaskInput = {
    text,
    digest: str(o.digest),
    contextSummary: str(o.contextSummary),
    ask: o.ask === true,
    withSources: o.withSources === true,
    sourceTier: Number(o.sourceTier) === 1 ? 1 : 0,
    sources: sources(o.sources),
    khung: str(o.khung),
    webFound: str(o.webFound),
    think: o.think === true,
  }
  return buildExamSystem(input)
}

/** `hoi-truoc`: yêu cầu ngắn chưa nêu môn — hỏi lại bằng prompt ngắn trước khi soạn. */
const hoiTruoc = (): string => ASK_ONLY_SYSTEM

/** `de-online`: trợ lý AI trong trình tạo đề online. */
function deOnline(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!o.meta || typeof o.meta !== 'object' || Array.isArray(o.meta)) return null
  const m = o.meta as Record<string, unknown>
  const subject = str(m.subject, 100)
  const grade = str(m.grade, 100)
  if (subject === undefined || grade === undefined) return null
  if (!Array.isArray(o.questions)) return null
  const questions: DeOnlineQuestionSummary[] = o.questions.slice(0, 500).map((item, i) => {
    const q = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      number: typeof q.number === 'number' && Number.isFinite(q.number) ? q.number : i + 1,
      type: str(q.type, 50) ?? 'trac-nghiem',
      prompt: str(q.prompt, 10_000) ?? '',
    }
  })
  return buildDeOnlineSystem({ meta: { title: str(m.title, 500) ?? '', subject, grade }, questions })
}

const TASKS: Record<string, (input: unknown) => string | null> = {
  'soan-de': soanDe,
  'hoi-truoc': hoiTruoc,
  'de-online': deOnline,
  'sua-cau': buildSuaCauSystem,
  've-do-thi': buildVeDoThiSystem,
  'chon-hinh': buildChonHinhSystem,
  'ngan-hang': buildNganHangSystem,
}

/** system prompt của tác vụ; null nếu tên lạ hoặc dữ liệu sai kiểu */
export function buildTaskSystem(task: unknown, input: unknown): string | null {
  if (typeof task !== 'string' || !Object.hasOwn(TASKS, task)) return null
  return TASKS[task](input)
}
