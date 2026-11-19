/**
 * Tác vụ AI do SERVER ghép system prompt: client gửi `task` + dữ liệu người dùng, không gửi chữ prompt.
 * Chữ prompt nằm ở `src/lib/prompts/*` (module thuần, dùng chung với test).
 *
 * Thêm tác vụ mới: viết hàm ghép trong `src/lib/prompts/`, thêm vào `TASKS` ở đây, kiểm kiểu dữ liệu client gửi.
 */
import { ASK_ONLY_SYSTEM, buildExamSystem, type ExamTaskInput } from '../src/lib/prompts/exam.js'
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

const TASKS: Record<string, (input: unknown) => string | null> = {
  'soan-de': soanDe,
  'hoi-truoc': hoiTruoc,
}

/** system prompt của tác vụ; null nếu tên lạ hoặc dữ liệu sai kiểu */
export function buildTaskSystem(task: unknown, input: unknown): string | null {
  if (typeof task !== 'string' || !Object.hasOwn(TASKS, task)) return null
  return TASKS[task](input)
}
