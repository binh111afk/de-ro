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
const PICK_SOME = /(?<!\p{L})(?:chọn|lấy|trích)\s+\d+\s*(?:câu|bài)/iu
const REQUESTED_COUNT = /(?<![\p{L}\d])(\d{1,3})\s*(câu|bài)(?!\p{L})/giu

export type SplitChunk = {
  /** chữ giao cho model, nối vào cuối tin nhắn người dùng */
  note: string
  /** số câu của lượt này trong đề nguồn */
  count: number
  essay: boolean
  sourceRange: string
  /** câu thứ i của lượt có hình trong đề nguồn */
  figs: boolean[]
}

type SrcQuestion = { part: string; label: string; essay: boolean; fig: boolean }

/** Giữ nhãn gốc để chỉ đúng câu khi số lặp giữa các phần. */
export function scanSourceQuestions(text: string): SrcQuestion[] {
  const out: SrcQuestion[] = []
  let part = ''
  let essayPart = false
  for (const raw of text.normalize('NFC').split(/\r?\n/)) {
    const line = raw.replace(/[*_#>]/g, '').trim()
    if (/^(?:[-–— ]*HẾT[-–— ]*$|(?:BẢNG\s+)?ĐÁP ÁN\b|HƯỚNG DẪN CHẤM)/iu.test(line)) break
    if (/^PHẦN\s+(?:[IVXLCDM]+|\d+)\b|^(?:(?:[IVXLCDM]+|\d+)\s*[.):]\s*)?(?:PHẦN\s+)?(?:TỰ LUẬN|TRẮC NGHIỆM)(?!\p{L})/iu.test(line)) {
      part = line
      essayPart = /tự luận/iu.test(line) && !/trả lời ngắn/iu.test(line)
      continue
    }
    const q = /^(Câu|Bài)\s+(\d{1,3}|[IVXLCDM]+)\s*(?:\([^)]*điểm\)|[:.)]|$)/iu.exec(line)
    if (q) {
      const isBai = q[1].toLowerCase() === 'bài'
      const label = (isBai ? 'Bài ' : 'Câu ') + q[2].toUpperCase()
      if (!out.some((x) => x.part === part && x.label === label))
        out.push({ part, label, essay: essayPart || isBai || !/^\d/.test(q[2]), fig: false })
    }
    if (/\[Hình(?:[:\]]| chưa)/iu.test(line) && out.length) out[out.length - 1].fig = true
  }
  return out
}

export function planExamSplit(request: string, sourceText: string): SplitChunk[] | null {
  if (!WHOLE_COPY.test(request) || PICK_SOME.test(request)) return null
  const qs = scanSourceQuestions(sourceText)
  if (qs.length < SPLIT_MIN_QUESTIONS) return null
  const essayCount = qs.filter((q) => q.essay).length
  if ([...request.matchAll(REQUESTED_COUNT)].some((m) =>
    Number(m[1]) !== (m[2].toLowerCase() === 'bài' ? essayCount : qs.length),
  )) return null
  // Để model chọn đúng mã đề khi tài liệu chứa nhiều đề.
  const codes = [...sourceText.matchAll(/^\s*(?:mã\s+)?đề\s*(?:số\s*|[:.]\s*)?(\d+)\b/gimu)].map((m) => m[1])
  if (new Set(codes).size > 1) return null

  // nhóm theo phần, cắt mỗi phần thành các khúc đều nhau tối đa CHUNK_SIZE câu
  const parts: SrcQuestion[][] = []
  for (const q of qs) {
    const last = parts.at(-1)
    if (last && last[0].part === q.part && last[0].essay === q.essay) last.push(q)
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
  let essays = 0
  return groups.map((g, i) => {
    const first = g.qs[0]
    const last = g.qs.at(-1)!
    const where = `${first.part ? `phần “${first.part}”, ` : ''}${first === last ? first.label : `${first.label} đến ${last.label}`}`
    const startNo = (first.essay ? essays : done) + 1
    const withFig = g.qs.map((q, k) => (q.fig ? startNo + k : 0)).filter(Boolean)
    if (first.essay) essays += g.qs.length
    else done += g.qs.length
    const note =
      `\n\n[LƯỢT ${i + 1}/${groups.length}] Đề nguồn dài nên được soạn thành ${groups.length} lượt. ` +
      `Lượt này CHỈ soạn ${g.qs.length} câu tương ứng với ${where} của đề nguồn (đúng thứ tự trong tệp), không viết câu nào khác. ` +
      `Trả "action":"replace", "blocks" chỉ gồm phần của lượt này. ` +
      (i === 0 ? 'Mở đầu bằng header của đề (và student nếu đề nguồn có). ' : 'KHÔNG viết header, student, tên đề. ') +
      (g.startsPart && first.part ? `Trước câu đầu tiên đặt heading của ${first.part} như đề nguồn. ` : 'KHÔNG viết heading phần. ') +
      (withFig.length ? `Chỉ các câu ${withFig.join(', ')} có hình vẽ (như câu mẫu), các câu khác KHÔNG có hình vẽ. ` : 'Không câu nào của lượt này có hình vẽ. ') +
      'Bảng số liệu có trong câu mẫu vẫn giữ. ' +
      `Số "no" bắt đầu từ ${startNo}. ` +
      (first.essay ? 'Dùng block essay, giữ đủ ý và điểm. Nếu có hướng dẫn chấm, chỉ ghi các bài của lượt này.' :
        'Kết thúc bằng một answerKey chỉ gồm các câu của lượt này.')
    return { note, sourceRange: where, count: g.qs.length, essay: first.essay, figs: g.qs.map((q) => q.fig) }
  })
}

type Block = Record<string, unknown> & { type?: unknown }
export type ChunkJson ={ action?: unknown; say?: unknown; name?: unknown; blocks?: unknown }

/** đọc JSON một lượt; null nếu hỏng / không có khối */
export function parseChunk(content: string, expected?: SplitChunk): ChunkJson | null {
  try {
    const j = extractJson<ChunkJson>(content)
    if (!j || !Array.isArray(j.blocks) || !j.blocks.length) return null
    if (expected) {
      const questions = j.blocks.filter((block) => block?.type === 'question' || block?.type === 'essay')
      if (questions.length !== expected.count || questions.some((block) =>
        block.type !== (expected.essay ? 'essay' : 'question'),
      )) return null
    }
    return j
  } catch {
    return null
  }
}

/**
 * ghép các lượt: nối khối, đánh lại số câu liên tục, gộp bảng đáp án về cuối đề.
 * `figs[i][k]`: câu thứ k của lượt i có hình trong đề nguồn — câu gốc không hình thì bỏ figure AI tự thêm (bảng số liệu vẫn giữ).
 */
export function mergeChunks(chunks: ChunkJson[], figs?: boolean[][], complete = true): string {
  const blocks: Block[] = []
  const keys = new Map<number, unknown>()
  let no = 0
  let essayNo = 0
  chunks.forEach((c, ci) => {
    let k = 0
    const map = new Map<number, number>()
    const answers: Array<{ no?: unknown; answer?: unknown }> = []
    for (const b of c.blocks as Block[]) {
      if (!b || typeof b !== 'object') continue
      if (b.type === 'answerKey') {
        if (Array.isArray(b.items)) answers.push(...b.items)
        continue
      }
      if (b.type === 'question' || b.type === 'essay') {
        const number = b.type === 'essay' ? ++essayNo : ++no
        if (b.type === 'question' && Number.isFinite(Number(b.no))) map.set(Number(b.no), number)
        const src = figs?.[ci]?.[k++]
        const fig = b.figure as { kind?: unknown } | undefined
        const { figure: _drop, ...rest } = b
        blocks.push(fig && src === false && fig.kind !== 'table' && fig.kind !== 'grouped' ? { ...rest, no: number } : { ...b, no: number })
        continue
      }
      blocks.push(b)
    }
    for (const answer of answers) {
      const number = map.get(Number(answer?.no))
      if (number != null) keys.set(number, answer.answer)
    }
  })
  if (keys.size) blocks.push({ type: 'answerKey', items: [...keys].sort(([a], [b]) => a - b).map(([no, answer]) => ({ no, answer })) })
  // lời báo từng lượt dài và lộ "lượt i/n" → chỉ báo gọn số câu + câu có hình
  const withFig = blocks.filter((b) => b.type === 'question' && b.figure).map((b) => b.no)
  return JSON.stringify({
    action: 'replace',
    ...(typeof chunks[0]?.name === 'string' ? { name: chunks[0].name } : {}),
    say:
      (complete ? `Mình đã soạn đề ${no + essayNo} câu theo mẫu. ` : `Mình đã soạn được ${no + essayNo} câu. `) +
      (withFig.length ? `Các câu ${withFig.join(', ')} có hình như đề gốc, mình đã vẽ lại theo số liệu mới. ` : '') +
      (keys.size ? 'Đáp án ở cuối đề.' : ''),
    blocks,
  })
}
