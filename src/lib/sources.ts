/**
 * Nguồn cho AI soạn đề: CHỈ những gì giáo viên tự đưa vào — tệp đính kèm hoặc nguồn chọn trong "Thêm nguồn".
 * Không tự dò đề đã lưu hay tìm web (giáo viên không thêm nguồn mà AI vẫn lôi đề khác vào là sai ý;
 * tìm web đi qua nút "Tìm trên web" riêng). Không có nguồn — dùng kiến thức chung, phải cảnh báo.
 */
import { apiFetch } from '@/lib/apiFetch'
import { AiQuotaError, reportQuota } from '@/lib/llm'
import { MAX_PDF_PAGES, renderPdfPages } from '@/lib/pdfPages'
import { sourcePrompt as promptOf, sourceRule as ruleOf } from '@/lib/prompts/sources'
import type { ExamBlock, ExamDoc, RichText } from '@/data/docTypes'
import { plainText } from '@/examEditor/convert'
import { useDocStore } from '@/store/docs'

export interface SourceFile {
  name: string
  kind: string
  file?: File
}

export interface SourceItem {
  tier: 1
  name: string
  text: string
  url?: string
}

export interface SourcePack {
  tier: 0 | 1
  items: SourceItem[]
  warnings: string[]
}

/** mỗi nguồn giáo viên chọn tối đa bấy nhiêu chữ (vẫn chung trần MAX_SOURCE_CHARS) */
const MAX_PICKED_CHARS = 12_000
export const MAX_PICKED = 5

/** Nguồn giáo viên chọn trong modal "Thêm nguồn": đề của tôi, đề cộng đồng hoặc tệp trong kho tài liệu. */
export interface PickedSource {
  kind: 'mine' | 'community' | 'library'
  id: string
  name: string
  /** dòng phụ trong thẻ nguồn (môn · lớp, loại tệp…) */
  meta?: string
  /** tệp trong kho tài liệu: đường dẫn và loại tệp để tải về trích chữ */
  url?: string
  mime?: string
}

export const pickedKey = (p: Pick<PickedSource, 'kind' | 'id'>) => `${p.kind}:${p.id}`

const VISION_PAGES_PER_CALL = 3
const PDF_SPLIT_LETTER_RATIO = 0.03

export const isPdf = (name: string, mime?: string) =>
  /\.pdf$/i.test(name) || mime === 'application/pdf'

export const isDocx = (name: string, mime?: string) =>
  /\.docx$/i.test(name) || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function pdfTextNeedsVision(text: string): boolean {
  const normalized = text.trim().normalize('NFC')
  if (!normalized) return false

  // Chữ có dấu bị tách giữa từ thường gặp khi pdf.js làm vỡ cả chữ lẫn công thức.
  const words = normalized.match(/\p{L}+/gu) ?? []
  const splitLetters = words.filter((word) => /^(?![a-zàáôồơờởừý])\p{L}$/iu.test(word)).length
  if (splitLetters >= 3 && splitLetters > words.length * PDF_SPLIT_LETTER_RATIO) return true

  // Hình có thể biến mất khỏi bản tách chữ, kể cả khi câu dẫn vẫn đọc được.
  if (/hình\s+(?:vẽ|minh họa|bên|dưới đây)|(?:đồ thị|biểu đồ|sơ đồ)\s+(?:bên|sau|dưới đây)|bảng biến thiên/iu.test(normalized)) return true
  if (/[∫∑√≤≥≠±₀-₉]|[×÷→⇌]\s*[\dA-Z]/u.test(normalized)) return true
  if (/(?<![\p{L}\d])(?:[A-Za-z]|\d+)\s*(?:[²³]|[=+−]\s*[\w(−-])|(?:^|\n)\s*[A-D]\.\s*=/u.test(normalized)) return true

  const mathLines = normalized.split(/\r?\n/).filter((line) => /^(?:[A-Za-z\d+−–-]|=.+)$/u.test(line.trim())).length
  return mathLines >= 2 && /đồ thị|hình (?:chóp|lập phương|hộp|không gian)|hàm số|phân số|phương trình|công thức|phản ứng/iu.test(normalized)
}

type SourceReadOptions = { onProgress?: (message: string) => void; signal?: AbortSignal }

export async function readVisionPages(
  pages: HTMLCanvasElement[],
  total: number,
  { onProgress, signal, requireAll }: SourceReadOptions & { requireAll?: boolean } = {},
): Promise<{ text: string; warning?: string }> {
  const texts: string[] = []
  const failed: string[] = []

  for (let i = 0; i < pages.length; i += VISION_PAGES_PER_CALL) {
    signal?.throwIfAborted()
    const batch = pages.slice(i, i + VISION_PAGES_PER_CALL)
    const label = batch.length > 1 ? `${i + 1}-${i + batch.length}` : `${i + 1}`
    onProgress?.(`Đang đọc trang ${label}/${pages.length}…`)
    try {
      const response = await apiFetch('/api/extract?vision=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: batch.map((page) => page.toDataURL('image/jpeg', 0.82)) }),
        signal,
      })
      const payload = (await response.json().catch(() => null)) as
        | { text?: string; error?: string; code?: string; quota?: unknown }
        | null
      signal?.throwIfAborted()
      reportQuota(payload?.quota)
      if (response.status === 429 && payload?.code === 'quota') {
        throw new AiQuotaError(payload.error || 'Bạn không đủ điểm AI để đọc PDF.')
      }
      if (!response.ok || typeof payload?.text !== 'string') {
        throw new Error(payload?.error || `Không đọc được ảnh (${response.status}).`)
      }
      const text = payload.text.trim()
      if (!text) throw new Error('Không nhận được nội dung từ ảnh.')
      texts.push(text)
    } catch (err) {
      signal?.throwIfAborted()
      if (requireAll || err instanceof AiQuotaError) throw err
      failed.push(label)
    }
  }

  const warning = [
    total > MAX_PDF_PAGES ? `Chỉ đọc ${MAX_PDF_PAGES}/${total} trang đầu.` : '',
    failed.length ? `Không đọc được trang ${failed.join(', ')}.` : '',
  ].filter(Boolean).join(' ')
  return { text: texts.join('\n\n'), warning: warning || undefined }
}

export async function readPdfByVision(file: File, onProgress?: SourceReadOptions['onProgress'], signal?: AbortSignal, requireAll = false) {
  signal?.throwIfAborted()
  const { pages, total } = await renderPdfPages(file)
  return readVisionPages(pages, total, { onProgress, signal, requireAll })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Không đọc được tệp.'))
    reader.readAsDataURL(file)
  })
}

export async function extractAttachment(
  file: File,
  /** .docx: giữ ký tự đánh dấu chữ nổi bật (U+E000/U+E001) — dùng khi tách đề để tìm đáp án được tô/đậm */
  marks = false,
): Promise<{ text: string; kind?: string; slides?: string[]; images?: string[]; warning?: string }> {
  const data = await fileToBase64(file)
  const res = await apiFetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, data, ...(marks ? { marks } : {}) }),
  })
  const payload = (await res.json().catch(() => null)) as
    | { text?: string; kind?: string; slides?: string[]; images?: string[]; warning?: string; error?: string }
    | null
  if (!res.ok) throw new Error(payload?.error || `Không đọc được tệp (${res.status}).`)
  return {
    text: payload?.text ?? '',
    kind: payload?.kind,
    slides: payload?.slides,
    ...(payload?.images?.length ? { images: payload.images } : {}),
    warning: payload?.warning,
  }
}

async function extractSourceFile(file: File, name: string, warnings: string[], options: SourceReadOptions) {
  options.signal?.throwIfAborted()
  if (isDocx(file.name, file.type)) {
    try {
      const { docxToBlocks } = await import('@/lib/docxImport')
      const blocks = await docxToBlocks(file, { imagePlaceholders: true })
      options.signal?.throwIfAborted()
      const { text, imageCount } = docxBlocksToSourceText(blocks)
      if (imageCount) warnings.push(`${name}: có ${imageCount} hình, AI không đọc được nội dung hình.`)
      return { text }
    } catch {
      options.signal?.throwIfAborted()
      warnings.push(`${name}: dùng bản tách chữ, có thể thiếu công thức và hình.`)
    }
  }
  const extracted = await extractAttachment(file)
  options.signal?.throwIfAborted()
  const hasText = Boolean(extracted.text.trim())
  if (isPdf(file.name, file.type) && (!hasText || pdfTextNeedsVision(extracted.text))) {
    options.onProgress?.(`Đang chuẩn bị đọc ${name} bằng ảnh…`)
    try {
      const { text, warning } = await readPdfByVision(file, options.onProgress, options.signal, hasText)
      if (!text) throw new Error(warning || 'Không nhận được nội dung từ ảnh.')
      warnings.push(`${name}: đọc bằng AI nhìn ảnh.`)
      if (warning) warnings.push(`${name}: ${warning}`)
      return { text, warning }
    } catch (err) {
      options.signal?.throwIfAborted()
      const warning = err instanceof AiQuotaError
        ? 'PDF này cần AI đọc bằng ảnh nhưng không đủ điểm, kết quả có thể sai công thức và hình.'
        : hasText
          ? 'Không đọc được PDF bằng ảnh. Dùng chữ tách từ PDF, kết quả có thể sai công thức và hình.'
          : 'Không đọc được PDF bằng ảnh.'
      warnings.push(`${name}: ${warning}`)
      if (!hasText) return { text: extracted.text, warning }
    }
  }
  if (extracted.warning) warnings.push(`${name}: ${extracted.warning}`)
  return extracted
}

function blockText(b: ExamBlock, rt = plainText, cellText = rt): string {
  switch (b.type) {
    case 'header':
      return `[Đầu đề] ${rt(b.left)} ${rt(b.right)}`.trim()
    case 'columns':
      return b.cols.map(rt).join(' | ')
    case 'title':
      return rt(b.text)
    case 'meta':
      return b.rows.map(([k, v]) => `${k}: ${rt(v)}`).join('; ')
    case 'student':
      return rt(b.text)
    case 'heading':
      return rt(b.text)
    case 'paragraph':
      return rt(b.text)
    case 'bullets':
      return b.items.map((i) => `- ${rt(i)}`).join('\n')
    case 'grid':
      return b.cells.map((c) => rt(c)).join(' | ')
    case 'question':
      return [
        `Câu ${b.no ?? ''}. ${rt(b.text)}`,
        ...(b.options ?? []).map((o) => `${o.label}. ${rt(o.text)}`),
      ].join('\n')
    case 'essay':
      return [
        `Câu ${b.no ?? ''} (${b.score ?? 0} điểm). ${rt(b.text)}`,
        ...(b.sub ?? []).map((s) => rt(s)),
      ].join('\n')
    case 'answerKey':
      return b.items.map((i) => `Câu ${i.no}: ${rt(i.answer)}`).join('; ')
    case 'rubric':
      return [rt(b.title ?? ''), ...b.items.map((i) => `${i.label ?? ''} ${rt(i.text)}`)].join('\n')
    case 'table':
      return b.rows.map((r) => r.map((c) => cellText(c.text)).join(' | ')).join('\n')
    default:
      return ''
  }
}

export function docxBlocksToSourceText(blocks: ExamBlock[]): { text: string; imageCount: number } {
  let imageCount = 0
  const richText = (value: RichText, singleLine = false) => {
    const renderText = (text: string) => singleLine ? text.replace(/\r?\n/g, ' ') : text
    if (typeof value === 'string') return renderText(value)
    return value.map((span) => {
      if (!span.image) return renderText(span.text)
      imageCount += 1
      return '\n[Hình]\n'
    }).join('')
  }
  const text = blocks.map((b) => blockText(b, (v) => richText(v), (v) => richText(v, true)))
    .filter(Boolean).join('\n').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{2,}/g, '\n').trim()
  return { text, imageCount }
}

function docText(doc: ExamDoc): string {
  const text = doc.blocks.map((b) => blockText(b)).filter(Boolean).join('\n')
  if (text || !doc.online) return text
  // đề tạo online đăng cộng đồng: blocks rỗng, nội dung nằm trong đề tương tác
  return doc.online.sections
    .flatMap((sec) => sec.questions.map((q) => [`Câu ${q.number}. ${q.prompt}`, ...(q.options ?? []).map((o) => `${o.key}. ${o.text}`)].join('\n')))
    .join('\n\n')
}

/** Tải nội dung các nguồn giáo viên đã chọn (lúc bấm gửi, không lúc chọn). Nguồn lỗi thì bỏ qua kèm cảnh báo. */
export async function loadPickedSources(
  list: PickedSource[],
  options: SourceReadOptions = {},
): Promise<{ items: SourceItem[]; warnings: string[] }> {
  const warnings: string[] = []
  const items: SourceItem[] = []
  for (const p of list) {
    options.signal?.throwIfAborted()
    try {
      let text = ''
      if (p.kind === 'mine') {
        const doc = useDocStore.getState().myDocs.find((d) => d.id === p.id)
        if (!doc) throw new Error('đề không còn trong máy')
        text = docText(doc)
      } else if (p.kind === 'community') {
        const { getCommunityDoc } = await import('@/lib/community')
        text = docText(await getCommunityDoc(p.id))
      } else {
        if (!p.url) throw new Error('thiếu đường dẫn tệp')
        // tệp trong kho là tài liệu riêng: máy chủ chỉ trả cho chủ tệp → gửi kèm token
        const res = await apiFetch(p.url, { signal: options.signal })
        if (!res.ok) throw new Error(`không tải được tệp (${res.status})`)
        const blob = await res.blob()
        const file = new File([blob], p.name, { type: p.mime || blob.type })
        const extracted = await extractSourceFile(file, p.name, warnings, options)
        text = extracted.text
      }
      if (text.trim()) {
        items.push({ tier: 1, name: p.name, text: text.slice(0, MAX_PICKED_CHARS) })
      } else {
        warnings.push(`${p.name}: không có chữ để làm nguồn.`)
      }
    } catch (err) {
      options.signal?.throwIfAborted()
      if (err instanceof AiQuotaError) throw err
      warnings.push(`${p.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return { items, warnings }
}

export async function buildSourcePack(
  files: SourceFile[],
  picked: PickedSource[] = [],
  options: SourceReadOptions = {},
): Promise<SourcePack> {
  const loaded = await loadPickedSources(picked, options)
  const warnings: string[] = [...loaded.warnings]
  const attached: SourceItem[] = [...loaded.items]

  for (const f of files) {
    if (f.kind === 'image') {
      warnings.push(`${f.name}: ảnh chưa được OCR; hãy dùng tệp docx/pdf hoặc dán text.`)
      continue
    }
    if (!f.file) continue
    try {
      const extracted = await extractSourceFile(f.file, f.name, warnings, options)
      if (extracted.text.trim()) {
        attached.push({ tier: 1, name: f.name, text: extracted.text })
      } else if (!extracted.warning) {
        warnings.push(`${f.name}: không trích được chữ (có thể là ảnh scan).`)
      }
    } catch (err) {
      options.signal?.throwIfAborted()
      if (err instanceof AiQuotaError) throw err
      warnings.push(`${f.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return { tier: attached.length ? 1 : 0, items: attached, warnings }
}

export const sourceRule = (pack: SourcePack): string => ruleOf(pack.tier)

export const sourcePrompt = (pack: SourcePack): string => promptOf(pack.items)
