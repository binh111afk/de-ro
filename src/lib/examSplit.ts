/**
 * Đề nguồn dài (vd 22 câu) mà soạn cả đề trong một lượt thì model hết token (trả rỗng).
 * Chia thành nhiều lượt theo PHẦN của đề nguồn, mỗi lượt tối đa CHUNK_SIZE câu, rồi ghép lại một JSON đề.
 * Các lượt chạy lần lượt: server chỉ giữ chỗ điểm một lượt mỗi người dùng.
 */
import { extractJson } from '@/lib/llm'

export const SPLIT_MIN_QUESTIONS = 10
const CHUNK_SIZE = 6

/** yêu cầu làm lại cả đề nguồn (không phải "chọn 5 câu") */
const WHOLE_COPY = /y\s*(?:chang|hệt|như)|giống|tương tự|đổi\s+(?:số|dữ)|thay\s+(?:số|dữ)|soạn\s+lại|làm\s+lại|viết\s+lại|biến\s+thể|đề\s+tương\s+đương/i
const PICK_SOME = /\b(?:chọn|lấy|trích)\s+\d+\s*câu/i

export type SplitChunk = {
  /** chữ giao cho model, nối vào cuối tin nhắn người dùng */
  note: string
  /** số câu của lượt này trong đề nguồn */
  count: number
  /** câu thứ i của lượt có hình trong đề nguồn */
  figs: boolean[]
}

type SrcQuestion = { part: string; no: number; fig: boolean }

/** quét chữ đề nguồn: các PHẦN và câu "Câu N" theo thứ tự xuất hiện */
export function scanSourceQuestions(text: string): SrcQuestion[] {
  const out: SrcQuestion[] = []
  let part = ''
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[*_#>]/g, '').trim()
    if (/\[Hình/.test(line) && out.length) out[out.length - 1].fig = true
    const p = line.match(/^PHẦN\s+([IVX]+|\d+)\b/i)
    if (p) {
      part = `PHẦN ${p[1].toUpperCase()}`
      continue
    }
    const q = line.match(/^Câu\s+(\d{1,3})\s*[:.)]/i)
    if (!q) continue
    const no = Number(q[1])
    // cùng số câu trong cùng phần = chữ lặp (vd mục lục, đáp án) → bỏ
    if (out.some((x) => x.part === part && x.no === no)) continue
    out.push({ part, no, fig: false })
  }
  return out
}

export function planExamSplit(request: string, sourceText: string): SplitChunk[] | null {
  if (!WHOLE_COPY.test(request) || PICK_SOME.test(request)) return null
  const qs = scanSourceQuestions(sourceText)
  if (qs.length < SPLIT_MIN_QUESTIONS) return null

  // nhóm theo phần, cắt mỗi phần thành các khúc đều nhau tối đa CHUNK_SIZE câu
  const parts: SrcQuestion[][] = []
  for (const q of qs) {
    const last = parts.at(-1)
    if (last && last[0].part === q.part) last.push(q)
    else parts.push([q])
  }
  const groups: Array<{ qs: SrcQuestion[]; startsPart: boolean }> = []
  for (const p of parts) {
    const n = Math.ceil(p.length / CHUNK_SIZE)
    const size = Math.ceil(p.length / n)
    for (let i = 0; i < p.length; i += size) groups.push({ qs: p.slice(i, i + size), startsPart: i === 0 })
  }
  if (groups.length < 2) return null

  let done = 0
  return groups.map((g, i) => {
    const first = g.qs[0]
    const last = g.qs.at(-1)!
    const where = `${first.part ? `${first.part}, ` : ''}${first.no === last.no ? `Câu ${first.no}` : `Câu ${first.no} đến Câu ${last.no}`}`
    const startNo = done + 1
    const withFig = g.qs.map((q, k) => (q.fig ? startNo + k : 0)).filter(Boolean)
    done += g.qs.length
    const note =
      `\n\n[LƯỢT ${i + 1}/${groups.length}] Đề nguồn dài nên được soạn thành ${groups.length} lượt. ` +
      `Lượt này CHỈ soạn ${g.qs.length} câu tương ứng với ${where} của đề nguồn (đúng thứ tự trong tệp), không viết câu nào khác. ` +
      `Trả "action":"replace", "blocks" chỉ gồm phần của lượt này. ` +
      (i === 0 ? 'Mở đầu bằng header của đề (và student nếu đề nguồn có). ' : 'KHÔNG viết header, student, tên đề. ') +
      (g.startsPart && first.part ? `Trước câu đầu tiên đặt heading của ${first.part} như đề nguồn. ` : 'KHÔNG viết heading phần. ') +
      (withFig.length ? `Chỉ các câu ${withFig.join(', ')} có hình vẽ (như câu mẫu), các câu khác KHÔNG có hình vẽ. ` : 'Không câu nào của lượt này có hình vẽ. ') +
      'Bảng số liệu có trong câu mẫu vẫn giữ. ' +
      `Số câu "no" bắt đầu từ ${startNo}. Kết thúc bằng một answerKey chỉ gồm các câu của lượt này.`
    return { note, count: g.qs.length, figs: g.qs.map((q) => q.fig) }
  })
}

type Block = Record<string, unknown> & { type?: unknown }
export type ChunkJson ={ action?: unknown; say?: unknown; name?: unknown; blocks?: unknown }

/** đọc JSON một lượt; null nếu hỏng / không có khối */
export function parseChunk(content: string): ChunkJson | null {
  try {
    const j = extractJson<ChunkJson>(content)
    return j && Array.isArray(j.blocks) && j.blocks.length ? j : null
  } catch {
    return null
  }
}

/**
 * ghép các lượt: nối khối, đánh lại số câu liên tục, gộp bảng đáp án về cuối đề.
 * `figs[i][k]`: câu thứ k của lượt i có hình trong đề nguồn — câu gốc không hình thì bỏ figure AI tự thêm (bảng số liệu vẫn giữ).
 */
export function mergeChunks(chunks: ChunkJson[], figs?: boolean[][]): string {
  const blocks: Block[] = []
  const keys: Array<{ no: number; answer: unknown }> = []
  let no = 0
  chunks.forEach((c, ci) => {
    let k = 0
    const map = new Map<number, number>()
    for (const b of c.blocks as Block[]) {
      if (!b || typeof b !== 'object') continue
      if (b.type === 'answerKey') {
        for (const it of Array.isArray(b.items) ? (b.items as Array<{ no?: unknown; answer?: unknown }>) : []) {
          const old = Number(it?.no)
          keys.push({ no: map.get(old) ?? old, answer: it?.answer })
        }
        continue
      }
      if (b.type === 'question') {
        no++
        if (Number.isFinite(Number(b.no))) map.set(Number(b.no), no)
        const src = figs?.[ci]?.[k++]
        const fig = b.figure as { kind?: unknown } | undefined
        const { figure: _drop, ...rest } = b
        blocks.push(fig && src === false && fig.kind !== 'table' ? { ...rest, no } : { ...b, no })
        continue
      }
      blocks.push(b)
    }
  })
  if (keys.length) blocks.push({ type: 'answerKey', items: keys.sort((a, b) => a.no - b.no) })
  const say = chunks.map((c) => (typeof c.say === 'string' ? c.say.trim() : '')).filter(Boolean)
  return JSON.stringify({
    action: 'replace',
    ...(typeof chunks[0]?.name === 'string' ? { name: chunks[0].name } : {}),
    say: say.length ? `Soạn ${no} câu qua ${chunks.length} lượt.\n\n${say.map((s) => `- ${s.replace(/\n+/g, ' ')}`).join('\n')}` : `Soạn ${no} câu qua ${chunks.length} lượt.`,
    blocks,
  })
}
