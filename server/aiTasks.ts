/**
 * Tác vụ AI do SERVER ghép system prompt: client gửi `task` + dữ liệu người dùng, không gửi chữ prompt.
 * Chữ prompt nằm ở `src/lib/prompts/*` (module thuần, dùng chung với test).
 *
 * Thêm tác vụ mới: viết hàm ghép trong `src/lib/prompts/`, thêm vào `TASKS` ở đây, kiểm kiểu dữ liệu client gửi.
 */
import { ASK_ONLY_SYSTEM, buildExamSystem, type ExamTaskInput } from '../src/lib/prompts/exam.js'
import type { PromptSource } from '../src/lib/prompts/sources.js'
import {
  WEB_SEARCH_SYSTEM,
  buildBoardSystem,
  buildSlideBatchSystem,
  buildSlideChatSystem,
  buildSlideEditSystem,
  buildSlidePageSystem,
  type DeckPlan,
} from './generated/prompts.js'

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

/** phần nguồn dùng chung của các tác vụ có nguồn giáo viên đưa vào */
function sourceFields(o: Record<string, unknown>) {
  return {
    withSources: o.withSources === true,
    sourceTier: Number(o.sourceTier) === 1 ? 1 : 0,
    sources: sources(o.sources),
    khung: str(o.khung),
  }
}

const strs = (v: unknown, n: number, max: number): string[] | undefined =>
  Array.isArray(v) ? v.slice(0, n).filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, max)) : undefined

/** dàn ý deck client gửi: chỉ nhận chuỗi, tối đa 40 slide */
function planOf(v: unknown): DeckPlan | null {
  const o = (v ?? {}) as Record<string, unknown>
  if (!Array.isArray(o.slides) || !o.slides.length) return null
  const slides = o.slides.slice(0, 40).map((s) => {
    const x = (s ?? {}) as Record<string, unknown>
    return { title: str(x.title, 300) ?? '', layout: str(x.layout, 40) ?? 'bullets', tone: str(x.tone, 20), kicker: str(x.kicker, 200), brief: str(x.brief, 1000) }
  })
  return {
    title: str(o.title, 300),
    theme: str(o.theme, 40),
    stylePack: str(o.stylePack, 40),
    decorKit: str(o.decorKit, 40),
    subject: str(o.subject, 40),
    audience: str(o.audience, 300),
    style: str(o.style, 1000),
    mainIdeas: strs(o.mainIdeas, 20, 500),
    slides,
  }
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

/** `slide-chat`: lượt chat trong trình soạn slide (variant: plan = lập dàn ý, chat, html). */
function slideChat(raw: unknown): string | null {
  const o = (raw ?? {}) as Record<string, unknown>
  if (o.variant !== 'plan' && o.variant !== 'chat' && o.variant !== 'html') return null
  return buildSlideChatSystem({ variant: o.variant, ask: o.ask === true, contextSummary: str(o.contextSummary), webFound: str(o.webFound), ...sourceFields(o) })
}

/** `bang-ve`: trợ lý bảng vẽ (hỏi đáp, hoặc nhận lệnh vẽ khi `ops`). */
function bangVe(raw: unknown): string {
  const o = (raw ?? {}) as Record<string, unknown>
  return buildBoardSystem({ ops: o.ops === true, contextSummary: str(o.contextSummary), ...sourceFields(o) })
}

/** `slide-lo`: viết một nhóm slide liền nhau trong một lượt. */
function slideLo(raw: unknown): string | null {
  const o = (raw ?? {}) as Record<string, unknown>
  const plan = planOf(o.plan)
  const idx = Array.isArray(o.indices) ? o.indices.slice(0, 40).map(Number) : []
  if (!plan || !idx.length || idx.some((i) => !Number.isInteger(i) || i < 0 || i >= plan.slides.length)) return null
  return buildSlideBatchSystem(plan, idx, o.think === true)
}

/** `slide-trang`: viết / sửa lỗi / chấm lại MỘT slide của dàn ý. */
function slideTrang(raw: unknown): string | null {
  const o = (raw ?? {}) as Record<string, unknown>
  const plan = planOf(o.plan)
  const i = Number(o.index)
  if (!plan || !Number.isInteger(i) || i < 0 || i >= plan.slides.length) return null
  return buildSlidePageSystem(plan, i)
}

/** `slide-sua`: sửa slide có sẵn bằng lệnh có cấu trúc (đổi phông, màu, bố cục…). */
function slideSua(raw: unknown): string | null {
  const context = str(((raw ?? {}) as Record<string, unknown>).context)
  return context === undefined ? null : buildSlideEditSystem(context)
}

const TASKS: Record<string, (input: unknown) => string | null> = {
  'slide-chat': slideChat,
  'bang-ve': bangVe,
  'slide-lo': slideLo,
  'slide-trang': slideTrang,
  'slide-sua': slideSua,
  'tim-web': () => WEB_SEARCH_SYSTEM,
  'soan-de': soanDe,
  'hoi-truoc': hoiTruoc,
}

/** system prompt của tác vụ; null nếu tên lạ hoặc dữ liệu sai kiểu */
export function buildTaskSystem(task: unknown, input: unknown): string | null {
  if (typeof task !== 'string' || !Object.hasOwn(TASKS, task)) return null
  return TASKS[task](input)
}
