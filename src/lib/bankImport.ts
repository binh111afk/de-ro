/**
 * Tạo câu hỏi nháp cho Ngân hàng: AI soạn theo yêu cầu, hoặc tách từ tệp đề.
 * Word đọc bằng bộ tách có sẵn (giữ đúng chữ và ảnh nhúng, không tốn token).
 * PDF và ảnh chụp dựng thành ảnh trang rồi cho AI đọc, hình vẽ được cắt ra theo khung AI trả về.
 */
import { bankVision, isAdminMock } from '@/lib/adminApi'
import type { Option, QuestionImage, QuestionType } from '@/data/types'
import { uid } from '@/data/docTypes'
import { callLlm, extractJson } from '@/lib/llm'
import { readImportFile } from '@/lib/importFile'
import { parseExamText } from '@/lib/parseExamText'
import { imageToSrc, uploadQuestionImages } from '@/lib/questionImage'

export interface BankDraft {
  id: string
  type: QuestionType
  prompt: string
  options?: Option[]
  answer?: string
  explanation?: string
  solution?: string[]
  image?: QuestionImage
  selected: boolean
}

interface RawQuestion {
  number?: unknown
  type?: unknown
  prompt?: unknown
  options?: unknown
  answer?: unknown
  explanation?: unknown
  figure?: { page?: unknown; box?: unknown }
}

export const IMPORT_FILE_ACCEPT = '.pdf,.docx,image/png,image/jpeg,image/webp'
const MAX_PAGES = 12
const PAGES_PER_CALL = 2
const PAGE_SIDE = 1600
const MAX_BYTES = 12 * 1024 * 1024
const TYPES: QuestionType[] = ['trac-nghiem', 'dung-sai', 'tra-loi-ngan', 'tu-luan', 'tu-luan-dong']

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Câu đủ dữ liệu để lưu ngay; thiếu thì admin phải bấm Sửa */
export function draftReady(d: Pick<BankDraft, 'type' | 'prompt' | 'options' | 'answer'>): boolean {
  if (!d.prompt.trim()) return false
  if (d.type === 'trac-nghiem') return (d.options?.length ?? 0) >= 2 && !!d.options?.every((o) => o.text.trim()) && !!d.options?.some((o) => o.key === d.answer)
  if (d.type === 'dung-sai') return d.options?.length === 4 && !!d.options.every((o) => o.text.trim()) && /^[ĐS]{4}$/.test(d.answer ?? '')
  if (d.type === 'tra-loi-ngan') return !!d.answer?.trim()
  return true
}

function normalizeAnswer(type: QuestionType, raw: string): string {
  if (type === 'trac-nghiem') return raw.toUpperCase().slice(0, 1)
  if (type === 'dung-sai') return raw.toUpperCase().replace(/D/g, 'Đ').replace(/[^ĐS]/g, '')
  return raw
}

function toDraft(q: RawQuestion, fallback?: QuestionType): BankDraft | null {
  const prompt = text(q.prompt)
  if (!prompt) return null
  const type = TYPES.includes(q.type as QuestionType) ? (q.type as QuestionType) : (fallback ?? 'tu-luan')
  const options = Array.isArray(q.options)
    ? (q.options as Array<{ key?: unknown; text?: unknown }>).map((o) => ({ key: text(o?.key), text: text(o?.text) })).filter((o) => o.key)
    : []
  const draft: BankDraft = {
    id: uid(),
    type,
    prompt,
    answer: normalizeAnswer(type, text(q.answer)) || undefined,
    explanation: text(q.explanation) || undefined,
    selected: false,
    ...(options.length && (type === 'trac-nghiem' || type === 'dung-sai') ? { options } : {}),
  }
  draft.selected = draftReady(draft)
  return draft
}

export async function generateDrafts(input: { request: string; subject: string; grade: string; type: QuestionType; count: number }): Promise<BankDraft[]> {
  if (isAdminMock()) {
    await new Promise((r) => setTimeout(r, 400))
    return Array.from({ length: input.count }, (_, i) => toDraft({ type: 'trac-nghiem', prompt: `Câu mẫu ${i + 1}: tính $${i + 1} + 1$.`, options: ['A', 'B', 'C', 'D'].map((key, k) => ({ key, text: String(i + k + 1) })), answer: 'B', explanation: 'Cộng trực tiếp.' })).filter((d): d is BankDraft => !!d)
  }
  const shape =
    input.type === 'trac-nghiem'
      ? 'options có 4 phương án key A, B, C, D; answer là một chữ cái, phân bố đều các đáp án'
      : input.type === 'dung-sai'
        ? 'options có 4 ý key a, b, c, d; answer là chuỗi Đ/S theo thứ tự, ví dụ "ĐSĐS"'
        : input.type === 'tra-loi-ngan'
          ? 'answer là đáp số ngắn, không có options'
          : 'không có options, lời giải đặt ở explanation'
  const res = await callLlm(
    [
      { role: 'system', content: 'Bạn là giáo viên Việt Nam ra đề theo chương trình GDPT 2018. Câu hỏi chính xác, đáp án đúng, không trùng lặp. Công thức toán viết LaTeX trong $...$. Chỉ trả về JSON.' },
      {
        role: 'user',
        content: `Soạn ${input.count} câu hỏi môn ${input.subject}, ${input.grade}, dạng ${input.type}.\nYêu cầu: ${input.request.trim() || 'theo chương trình của khối lớp'}\nTrả về JSON dạng {"questions":[{"type":"${input.type}","prompt":"...","options":[{"key":"A","text":"..."}],"answer":"...","explanation":"..."}]}. Với dạng này: ${shape}. prompt không ghi "Câu N".`,
      },
    ],
    { reasoningEffort: 'medium', maxTokens: 16000 },
  )
  const data = extractJson<{ questions?: RawQuestion[] }>(res.content)
  const drafts = (data.questions ?? []).map((q) => toDraft(q, input.type)).filter((d): d is BankDraft => !!d)
  if (drafts.length === 0) throw new Error('AI không trả về câu hỏi nào, thử lại nhé.')
  return drafts
}

async function renderPages(file: File): Promise<{ pages: HTMLCanvasElement[]; total: number }> {
  if (file.type.startsWith('image/')) {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, PAGE_SIDE / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale)
    c.height = Math.round(bmp.height * scale)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    return { pages: [c], total: 1 }
  }
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const doc = await task.promise
  try {
    const pages: HTMLCanvasElement[] = []
    for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
      const page = await doc.getPage(n)
      const base = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: PAGE_SIDE / Math.max(base.width, base.height) })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      pages.push(canvas)
    }
    return { pages, total: doc.numPages }
  } finally {
    await task.destroy()
  }
}

async function cropFigure(page: HTMLCanvasElement, box: unknown): Promise<QuestionImage | undefined> {
  if (!Array.isArray(box) || box.length !== 4 || !box.every((n) => typeof n === 'number' && n >= 0 && n <= 1000)) return undefined
  const [x0, y0, x1, y1] = box as number[]
  if (x1 - x0 < 10 || y1 - y0 < 10) return undefined
  const pad = 8 // AI hay khoanh hụt mép hình
  const left = Math.floor((Math.max(0, x0 - pad) / 1000) * page.width)
  const top = Math.floor((Math.max(0, y0 - pad) / 1000) * page.height)
  const w = Math.ceil((Math.min(1000, x1 + pad) / 1000) * page.width) - left
  const h = Math.ceil((Math.min(1000, y1 + pad) / 1000) * page.height) - top
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d')!.drawImage(page, left, top, w, h, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'))
  return blob ? { src: await imageToSrc(blob) } : undefined
}

async function readByVision(file: File, onProgress: (msg: string) => void): Promise<{ drafts: BankDraft[]; warning?: string }> {
  onProgress('Đang dựng các trang…')
  const { pages, total } = await renderPages(file)
  const drafts: Array<BankDraft & { number?: number }> = []
  const key: Record<string, string> = {}
  const failed: string[] = []

  for (let i = 0; i < pages.length; i += PAGES_PER_CALL) {
    const batch = pages.slice(i, i + PAGES_PER_CALL)
    const label = batch.length > 1 ? `${i + 1}-${i + batch.length}` : `${i + 1}`
    onProgress(`AI đang đọc trang ${label}/${pages.length}…`)
    try {
      const res = await bankVision(batch.map((p) => p.toDataURL('image/jpeg', 0.82)))
      const data = extractJson<{ questions?: RawQuestion[]; answerKey?: Record<string, unknown> }>(res.content)
      for (const [n, a] of Object.entries(data.answerKey ?? {})) if (text(a)) key[n] = text(a)
      for (const q of data.questions ?? []) {
        const d = toDraft(q)
        if (!d) continue
        const page = batch[Number(q.figure?.page ?? 1) - 1]
        if (q.figure && page) d.image = await cropFigure(page, q.figure.box)
        drafts.push({ ...d, number: typeof q.number === 'number' ? q.number : undefined })
      }
    } catch (err) {
      failed.push(`trang ${label} (${err instanceof Error ? err.message.slice(0, 80) : 'lỗi'})`)
    }
  }

  // bảng đáp án thường ở trang cuối, khác trang với câu hỏi
  for (const d of drafts) {
    if (!d.answer && d.number != null && key[d.number]) d.answer = normalizeAnswer(d.type, key[d.number]) || undefined
    d.selected = draftReady(d)
  }
  if (drafts.length === 0 && failed.length) throw new Error(`Không đọc được: ${failed.join('; ')}`)
  const notes = [total > MAX_PAGES ? `Chỉ đọc ${MAX_PAGES}/${total} trang đầu.` : '', failed.length ? `Bỏ qua ${failed.join('; ')}.` : ''].filter(Boolean)
  return { drafts, warning: notes.join(' ') || undefined }
}

async function readDocx(file: File): Promise<{ drafts: BankDraft[]; warning?: string }> {
  const data = await readImportFile(file, true)
  const parsed = parseExamText(data.text, data.images ?? [])
  const questions = await uploadQuestionImages(parsed.questions)
  const drafts = questions.map((q): BankDraft => {
    const d: BankDraft = { id: uid(), type: q.type, prompt: q.prompt, options: q.options, answer: q.answer, explanation: q.explanation, solution: q.solution, image: q.image, selected: false }
    return { ...d, selected: draftReady(d) }
  })
  const notes = [data.warning, parsed.extraImages ? `${parsed.extraImages} ảnh trong tệp chưa gắn được vào câu nào.` : ''].filter(Boolean)
  return { drafts, warning: notes.join(' ') || undefined }
}

export async function importDrafts(file: File, onProgress: (msg: string) => void): Promise<{ drafts: BankDraft[]; warning?: string }> {
  if (file.size > MAX_BYTES) throw new Error('Tệp quá lớn (tối đa 12 MB).')
  const name = file.name.toLowerCase()
  let result: { drafts: BankDraft[]; warning?: string }
  if (name.endsWith('.docx')) {
    onProgress('Đang đọc tệp Word…')
    result = await readDocx(file)
  } else if (name.endsWith('.pdf') || file.type.startsWith('image/')) {
    result = await readByVision(file, onProgress)
  } else {
    throw new Error('Chỉ nhận PDF, Word (.docx) hoặc ảnh PNG, JPG, WEBP.')
  }
  if (result.drafts.length === 0) throw new Error('Không tìm thấy câu hỏi nào trong tệp.')
  return result
}
