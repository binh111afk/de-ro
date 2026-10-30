/**
 * Nhập tệp văn phòng vào app (Tệp → Nhập file).
 *
 * Phần đọc nhị phân nằm server-side (`/api/extract`): docx (mammoth),
 * xlsx (exceljs), pptx (jszip + XML). Trả về text thuần / text từng slide;
 * ở đây chỉ chia lại thành block đề hoặc slide của bài giảng.
 */
import type { ExamBlock } from '@/data/docTypes'
import { uid } from '@/data/docTypes'
import type { DeckTheme, Slide, SlideElement } from '@/store/docs'
import { extractAttachment } from './sources'

export const IMPORT_ACCEPT = '.docx,.doc,.xlsx,.xls,.pptx,.ppt'
const MAX_BYTES = 12 * 1024 * 1024

export interface ImportedFile {
  /** tên tệp bỏ phần mở rộng */
  title: string
  text: string
  /** pptx: text từng slide; định dạng khác rỗng */
  slides: string[]
}

function titleOf(name: string): string {
  const base = name.replace(/\.[^.]+$/, '').trim()
  return (base || 'Tài liệu nhập').slice(0, 120)
}

export async function readImportFile(file: File, marks = false): Promise<ImportedFile> {
  if (file.size > MAX_BYTES) throw new Error('Tệp quá lớn (tối đa 12 MB).')
  const payload = await extractAttachment(file, marks)
  if (payload.kind === 'unsupported') {
    throw new Error(payload.warning ?? 'Chưa đọc được định dạng này.')
  }
  const slides = (payload.slides ?? []).map((s) => s.trim()).filter(Boolean)
  const text = (payload.text ?? '').trim()
  if (!text && slides.length === 0) {
    throw new Error('Tệp không có nội dung văn bản để nhập.')
  }
  return { title: titleOf(file.name), text, slides }
}

/** Mỗi dòng có nội dung thành một đoạn văn của đề. */
export function textToBlocks(text: string): ExamBlock[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ type: 'paragraph', text: line }))
}

/** Chia text dài thành trang slide ~12 dòng / 700 ký tự. */
function chunkText(text: string): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const chunks: string[] = []
  let current: string[] = []
  let chars = 0
  for (const line of lines) {
    if (current.length && (current.length >= 12 || chars + line.length > 700)) {
      chunks.push(current.join('\n'))
      current = []
      chars = 0
    }
    current.push(line)
    chars += line.length + 1
  }
  if (current.length) chunks.push(current.join('\n'))
  return chunks
}

/**
 * pptx: mỗi slide nguồn thành một slide. docx/xlsx: chia theo lô dòng.
 * Dòng đầu của mỗi slide làm tiêu đề, phần còn lại làm nội dung.
 */
export function importedSlides(data: ImportedFile, theme: DeckTheme): Slide[] {
  const chunks = data.slides.length > 0 ? data.slides : chunkText(data.text)
  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, index) => {
      const lines = chunk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const elements: SlideElement[] = [
        {
          id: uid(),
          type: 'text',
          x: 7,
          y: 12,
          w: 86,
          h: 20,
          text: lines[0] ?? `Slide ${index + 1}`,
          variant: 'title',
        },
      ]
      const body = lines.slice(1).join('\n')
      if (body) {
        elements.push({
          id: uid(),
          type: 'text',
          x: 7,
          y: 36,
          w: 86,
          h: 50,
          text: body,
          variant: 'body',
        })
      }
      return {
        id: uid(),
        background: theme.bg,
        elements,
        transition: 'none' as const,
      }
    })
}
