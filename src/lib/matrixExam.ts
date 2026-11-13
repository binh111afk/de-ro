/**
 * Logic dựng Ma trận đề và Bản đặc tả theo mẫu Bộ GD&ĐT (CV 7991/BGDĐT-GDTrH, mẫu THPT 2025 ba phần, TT 27/2020 tiểu học).
 */
import type { ExamBlock, ExamDoc, TableBlock, TableCellData } from '@/data/docTypes'
import { callLlm, extractJson, type LlmMessage } from '@/lib/llm'

export type MucDo = 'NB' | 'TH' | 'VD' | 'VDC' | 'M1' | 'M2' | 'M3'

export interface QuestionClassified {
  no: number
  kind: 'mcq' | 'tf' | 'short' | 'essay'
  label: string
  textSummary: string
  chuDe: string
  mucDo: MucDo
  mucDoTf: [MucDo, MucDo, MucDo, MucDo]
  yeuCau: string
  score: number
}

export interface MatrixScoreConfig {
  mcqPoint: number
  tfPointPerItem: number
  shortPoint: number
}

export interface LevelCol {
  key: string
  label: string
}

export interface PartCol {
  id: 'mcq' | 'tf' | 'short' | 'essay'
  title: string
  note?: string
  levels: LevelCol[]
}

export interface MatrixTopicRow {
  stt: number
  chuDe: string
  cells: Record<string, number> // key: `${partId}_${levelKey}` -> count
  totalCount: number
  totalScore: number
  percent: number
}

export interface MatrixSummary {
  partTotals: Record<string, number> // key: `${partId}_${levelKey}` -> count
  partScoreTotals: Record<string, number> // key: `${partId}_${levelKey}` -> score
  partPercentTotals: Record<string, number> // key: `${partId}_${levelKey}` -> percent
  grandTotalCount: number
  grandTotalScore: number
  levelCounts: Record<string, number> // key: levelKey -> total count across parts
  levelScores: Record<string, number> // key: levelKey -> total score across parts
  levelPercents: Record<string, number> // key: levelKey -> percent across parts
}

export interface MatrixData {
  parts: PartCol[]
  levels: LevelCol[]
  rows: MatrixTopicRow[]
  summary: MatrixSummary
  isTieuHoc: boolean
  separateVdc: boolean
}

export interface SpecGroupItem {
  yeuCau: string
  counts: Record<string, number> // levelKey -> count
  questionRefs: string
}

export interface SpecTopicGroup {
  stt: number
  chuDe: string
  items: SpecGroupItem[]
}

export interface SpecData {
  levels: LevelCol[]
  topics: SpecTopicGroup[]
  isTieuHoc: boolean
  separateVdc: boolean
}

export const DEFAULT_SCORE_CONFIG = (subject: string): MatrixScoreConfig => ({
  mcqPoint: 0.25,
  tfPointPerItem: 0.25,
  shortPoint: subject === 'Toán' ? 0.5 : 0.25,
})

const plain = (rt: unknown): string => {
  if (!rt) return ''
  if (typeof rt === 'string') return rt
  if (Array.isArray(rt)) return rt.map((s) => (typeof s === 'string' ? s : s.text ?? '')).join('')
  return ''
}

/** Rút trích câu hỏi từ ExamDoc để đưa vào bảng phân loại. */
export function extractQuestionsFromDoc(doc: ExamDoc, defaultChapter = 'Khác'): QuestionClassified[] {
  const out: QuestionClassified[] = []
  let qNo = 0
  let essayNo = 0

  for (const b of doc.blocks) {
    if (b.type === 'question') {
      qNo++
      const kind = b.kind ?? 'mcq'
      const text = plain(b.text).trim()
      const opts = (b.options ?? []).map((o) => `${o.label}. ${plain(o.text)}`).join('  ')
      const summary = opts ? `${text} [${opts}]` : text
      out.push({
        no: b.no ?? qNo,
        kind,
        label: `Câu ${qNo}`,
        textSummary: summary.slice(0, 300),
        chuDe: defaultChapter,
        mucDo: 'NB',
        mucDoTf: ['NB', 'NB', 'TH', 'TH'],
        yeuCau: '',
        score: 0.25,
      })
    } else if (b.type === 'essay') {
      essayNo++
      const text = plain(b.text).trim()
      const subs = (b.sub ?? []).map((s) => plain(s)).join('  ')
      const summary = subs ? `${text} [${subs}]` : text
      out.push({
        no: b.no ?? essayNo,
        kind: 'essay',
        label: `Bài ${essayNo}`,
        textSummary: summary.slice(0, 300),
        chuDe: defaultChapter,
        mucDo: 'VD',
        mucDoTf: ['VD', 'VD', 'VD', 'VD'],
        yeuCau: '',
        score: b.score || 1,
      })
    }
  }

  return out
}

/** Prompt phân loại gửi cho AI */
export function buildClassificationPrompt(
  questions: QuestionClassified[],
  subject: string,
  grade: number,
  chapters: string[],
): LlmMessage[] {
  const isTieuHoc = grade <= 5
  const chapList = chapters.map((c) => `- "${c}"`).join('\n')

  const system =
    `Bạn là chuyên gia khảo thí và giáo dục phổ thông Việt Nam (Chương trình GDPT 2018).\n` +
    `Nhiệm vụ: Phân loại từng câu hỏi trong đề thi theo chuẩn ma trận & đặc tả của Bộ GD&ĐT.\n\n` +
    `Môn: ${subject}, Lớp: ${grade}.\n\n` +
    `QUY TẮC CHỦ ĐỀ:\n` +
    `BẮT BUỘC chọn 'chuDe' từ danh sách chương sau (chính xác từng ký tự):\n` +
    `${chapList}\n` +
    `- "Khác" (chỉ chọn khi câu hỏi không thuộc bất kỳ chương nào ở trên)\n\n` +
    `QUY TẮC MỨC ĐỘ ('mucDo'):\n` +
    (isTieuHoc
      ? `- Tiểu học (TT 27/2020): dùng đúng 3 mức "M1", "M2", "M3".\n`
      : `- THCS/THPT: dùng 4 mức "NB" (Nhận biết), "TH" (Thông hiểu), "VD" (Vận dụng), "VDC" (Vận dụng cao).\n`) +
    `- Với câu trắc nghiệm ('mcq'), trả lời ngắn ('short'), tự luận ('essay'): 'mucDo' là một chuỗi (vd "NB" hoặc "M1").\n` +
    `- Với câu đúng - sai ('tf'): Mỗi câu có 4 ý a, b, c, d có thể khác mức. PHẢI trả về 'mucDo' là một mảng 4 phần tử [ý a, ý b, ý c, ý d], ví dụ: ["NB", "TH", "TH", "VD"] hoặc ["M1", "M1", "M2", "M3"].\n\n` +
    `QUY TẮC YÊU CẦU CẦN ĐẠT ('yeuCau'):\n` +
    `- Một câu ngắn gọn mô tả yêu cầu cần đạt, BẮT ĐẦU BẰNG ĐỘNG TỪ (vd: "Nhận biết được...", "Tính được...", "Vận dụng được...", "Giải quyết được...").\n\n` +
    `ĐỊNH DẠNG TRẢ VỀ: Duy nhất một JSON object dạng:\n` +
    `{\n` +
    `  "items": [\n` +
    `    {\n` +
    `      "no": 1,\n` +
    `      "chuDe": "tên chương chính xác",\n` +
    `      "mucDo": "NB",\n` +
    `      "yeuCau": "Nhận biết được..."\n` +
    `    },\n` +
    `    {\n` +
    `      "no": 2,\n` +
    `      "chuDe": "...",\n` +
    `      "mucDo": ["NB", "TH", "TH", "VD"],\n` +
    `      "yeuCau": "Xác định được tính đúng sai của..."\n` +
    `    }\n` +
    `  ]\n` +
    `}`

  const user =
    `Dưới đây là danh sách ${questions.length} câu hỏi cần phân loại (trả "no" đúng như số no ghi ở mỗi câu):\n\n` +
    questions
      .map((q, i) => `[${q.label}] (Dạng: ${q.kind}, no: ${i + 1}): ${q.textSummary}`)
      .join('\n\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/** Gọi AI để phân loại đề thi */
export async function classifyQuestionsWithAi(
  questions: QuestionClassified[],
  subject: string,
  grade: number,
  chapters: string[],
  signal?: AbortSignal,
): Promise<QuestionClassified[]> {
  const isTieuHoc = grade <= 5
  const messages = buildClassificationPrompt(questions, subject, grade, chapters)
  const res = await callLlm(messages, { temperature: 0.1, signal })
  const parsed = extractJson<{ items?: Array<{ no?: number; chuDe?: string; mucDo?: string | string[]; yeuCau?: string }> }>(res.content)
  const items = Array.isArray(parsed?.items) ? parsed.items : []

  const itemMap = new Map<number, { chuDe?: string; mucDo?: string | string[]; yeuCau?: string }>()
  for (const it of items) {
    if (typeof it.no === 'number') itemMap.set(it.no, it)
  }

  const validLevels: Set<string> = isTieuHoc
    ? new Set(['M1', 'M2', 'M3'])
    : new Set(['NB', 'TH', 'VD', 'VDC'])

  const normalizeLevel = (raw: unknown, fallback: MucDo): MucDo => {
    if (typeof raw === 'string') {
      const u = raw.toUpperCase()
      if (validLevels.has(u)) return u as MucDo
      if (isTieuHoc) {
        if (u === 'NB' || u === 'M1') return 'M1'
        if (u === 'TH' || u === 'M2') return 'M2'
        return 'M3'
      } else {
        if (u === 'M1' || u === 'NB') return 'NB'
        if (u === 'M2' || u === 'TH') return 'TH'
        if (u === 'M3' || u === 'VD') return 'VD'
        if (u === 'VDC') return 'VDC'
      }
    }
    return fallback
  }

  const chapterSet = new Set(chapters)

  return questions.map((q, idx) => {
    const ai = itemMap.get(idx + 1) ?? items[idx]
    if (!ai) return q

    let chuDe = q.chuDe
    if (ai.chuDe && typeof ai.chuDe === 'string') {
      const match = chapters.find((c) => c.toLowerCase() === ai.chuDe!.trim().toLowerCase())
      chuDe = match ?? (chapterSet.has(ai.chuDe.trim()) ? ai.chuDe.trim() : 'Khác')
    }

    const defaultSingle = isTieuHoc ? ('M1' as MucDo) : ('NB' as MucDo)
    const defaultTf: [MucDo, MucDo, MucDo, MucDo] = isTieuHoc ? ['M1', 'M1', 'M2', 'M2'] : ['NB', 'NB', 'TH', 'TH']

    let mucDo = q.mucDo
    let mucDoTf = q.mucDoTf

    if (q.kind === 'tf') {
      if (Array.isArray(ai.mucDo)) {
        mucDoTf = [
          normalizeLevel(ai.mucDo[0], defaultTf[0]),
          normalizeLevel(ai.mucDo[1], defaultTf[1]),
          normalizeLevel(ai.mucDo[2], defaultTf[2]),
          normalizeLevel(ai.mucDo[3], defaultTf[3]),
        ]
      } else if (typeof ai.mucDo === 'string') {
        const lvl = normalizeLevel(ai.mucDo, defaultSingle)
        mucDoTf = [lvl, lvl, lvl, lvl]
      }
    } else {
      if (typeof ai.mucDo === 'string') {
        mucDo = normalizeLevel(ai.mucDo, defaultSingle)
      } else if (Array.isArray(ai.mucDo) && ai.mucDo.length > 0) {
        mucDo = normalizeLevel(ai.mucDo[0], defaultSingle)
      }
    }

    const yeuCau = (typeof ai.yeuCau === 'string' && ai.yeuCau.trim()) ? ai.yeuCau.trim() : q.yeuCau

    return {
      ...q,
      chuDe,
      mucDo,
      mucDoTf,
      yeuCau,
    }
  })
}

/** Tính tổng điểm toàn đề */
export function computeTotalScore(questions: QuestionClassified[], config: MatrixScoreConfig): number {
  let sum = 0
  for (const q of questions) {
    if (q.kind === 'mcq') sum += config.mcqPoint
    else if (q.kind === 'tf') sum += 4 * config.tfPointPerItem
    else if (q.kind === 'short') sum += config.shortPoint
    else if (q.kind === 'essay') sum += q.score || 0
  }
  return Math.round(sum * 100) / 100
}

/** Dựng dữ liệu bảng Ma trận */
export function buildMatrixData(
  questions: QuestionClassified[],
  config: MatrixScoreConfig,
  opts: { grade: number; separateVdc: boolean },
): MatrixData {
  const isTieuHoc = opts.grade <= 5
  const separateVdc = !isTieuHoc && opts.separateVdc

  const levels: LevelCol[] = isTieuHoc
    ? [
        { key: 'M1', label: 'Mức 1' },
        { key: 'M2', label: 'Mức 2' },
        { key: 'M3', label: 'Mức 3' },
      ]
    : separateVdc
      ? [
          { key: 'NB', label: 'Nhận biết' },
          { key: 'TH', label: 'Thông hiểu' },
          { key: 'VD', label: 'Vận dụng' },
          { key: 'VDC', label: 'VDC' },
        ]
      : [
          { key: 'NB', label: 'Nhận biết' },
          { key: 'TH', label: 'Thông hiểu' },
          { key: 'VD', label: 'Vận dụng' },
        ]

  const hasKind = (k: QuestionClassified['kind']) => questions.some((q) => q.kind === k)

  const parts: PartCol[] = []
  if (hasKind('mcq')) {
    parts.push({
      id: 'mcq',
      title: 'Phần I. Nhiều lựa chọn',
      note: 'Số câu',
      levels,
    })
  }
  if (hasKind('tf')) {
    parts.push({
      id: 'tf',
      title: 'Phần II. Đúng - Sai',
      note: 'Số ý',
      levels,
    })
  }
  if (hasKind('short')) {
    parts.push({
      id: 'short',
      title: 'Phần III. Trả lời ngắn',
      note: 'Số câu',
      levels,
    })
  }
  if (hasKind('essay')) {
    parts.push({
      id: 'essay',
      title: 'Phần IV. Tự luận',
      note: 'Số câu',
      levels,
    })
  }

  // Danh sách chủ đề duy nhất theo thứ tự xuất hiện
  const topics: string[] = []
  for (const q of questions) {
    const c = q.chuDe || 'Khác'
    if (!topics.includes(c)) topics.push(c)
  }
  if (!topics.length) topics.push('Chung')

  const mapLevelKey = (m: MucDo): string => {
    if (isTieuHoc) {
      if (m === 'M1' || m === 'M2' || m === 'M3') return m
      if (m === 'NB') return 'M1'
      if (m === 'TH') return 'M2'
      return 'M3'
    }
    if (!separateVdc && m === 'VDC') return 'VD'
    if (m === 'M1') return 'NB'
    if (m === 'M2') return 'TH'
    if (m === 'M3') return 'VD'
    return m
  }

  const grandTotalScore = computeTotalScore(questions, config)

  const rows: MatrixTopicRow[] = topics.map((chuDe, i) => {
    const cells: Record<string, number> = {}
    for (const p of parts) {
      for (const l of p.levels) cells[`${p.id}_${l.key}`] = 0
    }

    let topicTotalCount = 0
    let topicTotalScore = 0

    const qs = questions.filter((q) => (q.chuDe || 'Khác') === chuDe)
    for (const q of qs) {
      if (q.kind === 'tf') {
        // đếm từng ý của câu đúng-sai
        for (const itemLevel of q.mucDoTf) {
          const lKey = mapLevelKey(itemLevel)
          const k = `tf_${lKey}`
          if (cells[k] !== undefined) cells[k]++
          topicTotalCount++
          topicTotalScore += config.tfPointPerItem
        }
      } else {
        const lKey = mapLevelKey(q.mucDo)
        const k = `${q.kind}_${lKey}`
        if (cells[k] !== undefined) cells[k]++
        topicTotalCount++
        if (q.kind === 'mcq') topicTotalScore += config.mcqPoint
        else if (q.kind === 'short') topicTotalScore += config.shortPoint
        else if (q.kind === 'essay') topicTotalScore += q.score || 0
      }
    }

    const percent = grandTotalScore > 0 ? (topicTotalScore / grandTotalScore) * 100 : 0

    return {
      stt: i + 1,
      chuDe,
      cells,
      totalCount: topicTotalCount,
      totalScore: Math.round(topicTotalScore * 100) / 100,
      percent: Math.round(percent * 10) / 10,
    }
  })

  // Tính summary dòng tổng
  const partTotals: Record<string, number> = {}
  const partScoreTotals: Record<string, number> = {}
  const partPercentTotals: Record<string, number> = {}

  for (const p of parts) {
    for (const l of p.levels) {
      const key = `${p.id}_${l.key}`
      const sum = rows.reduce((acc, r) => acc + (r.cells[key] ?? 0), 0)
      partTotals[key] = sum

      let sc = 0
      if (p.id === 'mcq') sc = sum * config.mcqPoint
      else if (p.id === 'tf') sc = sum * config.tfPointPerItem
      else if (p.id === 'short') sc = sum * config.shortPoint
      else if (p.id === 'essay') {
        sc = questions
          .filter((q) => q.kind === 'essay' && mapLevelKey(q.mucDo) === l.key)
          .reduce((acc, q) => acc + (q.score || 0), 0)
      }
      partScoreTotals[key] = Math.round(sc * 100) / 100
      partPercentTotals[key] = grandTotalScore > 0 ? Math.round((sc / grandTotalScore) * 1000) / 10 : 0
    }
  }

  const grandTotalCount = rows.reduce((acc, r) => acc + r.totalCount, 0)

  // Tổng hợp theo mức độ (across all parts)
  const levelCounts: Record<string, number> = {}
  const levelScores: Record<string, number> = {}
  const levelPercents: Record<string, number> = {}

  for (const l of levels) {
    let cSum = 0
    let sSum = 0
    for (const p of parts) {
      const k = `${p.id}_${l.key}`
      cSum += partTotals[k] ?? 0
      sSum += partScoreTotals[k] ?? 0
    }
    levelCounts[l.key] = cSum
    levelScores[l.key] = Math.round(sSum * 100) / 100
    levelPercents[l.key] = grandTotalScore > 0 ? Math.round((sSum / grandTotalScore) * 1000) / 10 : 0
  }

  return {
    parts,
    levels,
    rows,
    summary: {
      partTotals,
      partScoreTotals,
      partPercentTotals,
      grandTotalCount,
      grandTotalScore,
      levelCounts,
      levelScores,
      levelPercents,
    },
    isTieuHoc,
    separateVdc,
  }
}

/** Dựng dữ liệu Bản đặc tả */
export function buildSpecData(
  questions: QuestionClassified[],
  opts: { grade: number; separateVdc: boolean },
): SpecData {
  const isTieuHoc = opts.grade <= 5
  const separateVdc = !isTieuHoc && opts.separateVdc

  const levels: LevelCol[] = isTieuHoc
    ? [
        { key: 'M1', label: 'Mức 1' },
        { key: 'M2', label: 'Mức 2' },
        { key: 'M3', label: 'Mức 3' },
      ]
    : separateVdc
      ? [
          { key: 'NB', label: 'Nhận biết' },
          { key: 'TH', label: 'Thông hiểu' },
          { key: 'VD', label: 'Vận dụng' },
          { key: 'VDC', label: 'Vận dụng cao' },
        ]
      : [
          { key: 'NB', label: 'Nhận biết' },
          { key: 'TH', label: 'Thông hiểu' },
          { key: 'VD', label: 'Vận dụng' },
        ]

  const mapLevelKey = (m: MucDo): string => {
    if (isTieuHoc) {
      if (m === 'M1' || m === 'M2' || m === 'M3') return m
      if (m === 'NB') return 'M1'
      if (m === 'TH') return 'M2'
      return 'M3'
    }
    if (!separateVdc && m === 'VDC') return 'VD'
    if (m === 'M1') return 'NB'
    if (m === 'M2') return 'TH'
    if (m === 'M3') return 'VD'
    return m
  }

  // Danh sách chủ đề theo thứ tự
  const topics: string[] = []
  for (const q of questions) {
    const c = q.chuDe || 'Khác'
    if (!topics.includes(c)) topics.push(c)
  }
  if (!topics.length) topics.push('Chung')

  const groups: SpecTopicGroup[] = topics.map((chuDe, stt) => {
    const qs = questions.filter((q) => (q.chuDe || 'Khác') === chuDe)

    // Gom câu hỏi theo yêu cầu cần đạt (hoặc theo câu nếu yêu cầu rỗng)
    const mapYeuCau = new Map<string, { qs: QuestionClassified[]; tfItems: Array<{ q: QuestionClassified; opt: string; level: MucDo }> }>()

    for (const q of qs) {
      const yKey = q.yeuCau.trim() || `Yêu cầu cần đạt của ${q.label}`
      if (!mapYeuCau.has(yKey)) mapYeuCau.set(yKey, { qs: [], tfItems: [] })
      const entry = mapYeuCau.get(yKey)!
      if (q.kind === 'tf') {
        const letters = ['a', 'b', 'c', 'd']
        q.mucDoTf.forEach((lvl, idx) => {
          entry.tfItems.push({ q, opt: letters[idx] ?? `${idx + 1}`, level: lvl })
        })
      } else {
        entry.qs.push(q)
      }
    }

    const items: SpecGroupItem[] = []
    for (const [yeuCau, { qs: qList, tfItems }] of mapYeuCau.entries()) {
      const counts: Record<string, number> = {}
      for (const l of levels) counts[l.key] = 0

      for (const q of qList) {
        const lKey = mapLevelKey(q.mucDo)
        if (counts[lKey] !== undefined) counts[lKey]++
      }
      for (const it of tfItems) {
        const lKey = mapLevelKey(it.level)
        if (counts[lKey] !== undefined) counts[lKey]++
      }

      // Liệt kê các câu số
      const refParts: string[] = []
      if (qList.length) {
        refParts.push(qList.map((q) => (q.kind === 'essay' ? q.label : `C${q.no}`)).join(', '))
      }
      if (tfItems.length) {
        // Gom theo câu TF
        const byTfQ = new Map<number, string[]>()
        for (const it of tfItems) {
          const arr = byTfQ.get(it.q.no) ?? []
          arr.push(it.opt)
          byTfQ.set(it.q.no, arr)
        }
        for (const [no, opts] of byTfQ) {
          refParts.push(`C${no} (${opts.join(',')})`)
        }
      }

      items.push({
        yeuCau,
        counts,
        questionRefs: refParts.join('; '),
      })
    }

    return {
      stt: stt + 1,
      chuDe,
      items,
    }
  })

  return {
    levels,
    topics: groups,
    isTieuHoc,
    separateVdc,
  }
}

/** Chuyển Ma trận thành TableBlock (dùng cho TipTap, Word, in HTML) */
export function buildMatrixTableBlock(data: MatrixData): TableBlock {
  const rows: TableCellData[][] = []

  // Hàng 1 tiêu đề
  const r1: TableCellData[] = [
    { text: 'TT', header: true, rowSpan: 2, align: 'center' },
    { text: 'Chủ đề / Mạch kiến thức', header: true, rowSpan: 2, align: 'center' },
  ]
  for (const p of data.parts) {
    r1.push({
      text: `${p.title}${p.note ? `\n(${p.note})` : ''}`,
      header: true,
      colSpan: p.levels.length,
      align: 'center',
    })
  }
  r1.push(
    { text: 'Tổng số câu/ý', header: true, rowSpan: 2, align: 'center' },
    { text: 'Tổng điểm', header: true, rowSpan: 2, align: 'center' },
    { text: 'Tỉ lệ %', header: true, rowSpan: 2, align: 'center' },
  )
  rows.push(r1)

  // Hàng 2 tiêu đề mức độ
  const r2: TableCellData[] = []
  for (const p of data.parts) {
    for (const l of p.levels) {
      r2.push({ text: l.label, header: true, align: 'center' })
    }
  }
  rows.push(r2)

  // Các hàng chủ đề
  for (const r of data.rows) {
    const rowCells: TableCellData[] = [
      { text: String(r.stt), align: 'center' },
      { text: r.chuDe, align: 'left' },
    ]
    for (const p of data.parts) {
      for (const l of p.levels) {
        const val = r.cells[`${p.id}_${l.key}`] || 0
        rowCells.push({ text: val > 0 ? String(val) : '-', align: 'center' })
      }
    }
    rowCells.push(
      { text: String(r.totalCount), align: 'center' },
      { text: r.totalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }), align: 'center' },
      { text: `${r.percent.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`, align: 'center' },
    )
    rows.push(rowCells)
  }

  // Dòng Tổng số câu/ý
  const rSumCount: TableCellData[] = [
    { text: 'Tổng số câu / ý', header: true, colSpan: 2, align: 'center' },
  ]
  for (const p of data.parts) {
    for (const l of p.levels) {
      const val = data.summary.partTotals[`${p.id}_${l.key}`] || 0
      rSumCount.push({ text: String(val), header: true, align: 'center' })
    }
  }
  rSumCount.push(
    { text: String(data.summary.grandTotalCount), header: true, align: 'center' },
    { text: data.summary.grandTotalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }), header: true, align: 'center' },
    { text: '100%', header: true, align: 'center' },
  )
  rows.push(rSumCount)

  // Dòng Tổng điểm
  const rSumScore: TableCellData[] = [
    { text: 'Tổng điểm', header: true, colSpan: 2, align: 'center' },
  ]
  for (const p of data.parts) {
    for (const l of p.levels) {
      const val = data.summary.partScoreTotals[`${p.id}_${l.key}`] || 0
      rSumScore.push({
        text: val > 0 ? val.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '-',
        header: true,
        align: 'center',
      })
    }
  }
  rSumScore.push(
    { text: '-', header: true, align: 'center' },
    { text: data.summary.grandTotalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }), header: true, align: 'center' },
    { text: '100%', header: true, align: 'center' },
  )
  rows.push(rSumScore)

  // Dòng Tỉ lệ %
  const rSumPercent: TableCellData[] = [
    { text: 'Tỉ lệ %', header: true, colSpan: 2, align: 'center' },
  ]
  for (const p of data.parts) {
    for (const l of p.levels) {
      const val = data.summary.partPercentTotals[`${p.id}_${l.key}`] || 0
      rSumPercent.push({
        text: val > 0 ? `${val.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '-',
        header: true,
        align: 'center',
      })
    }
  }
  rSumPercent.push(
    { text: '-', header: true, align: 'center' },
    { text: '100%', header: true, align: 'center' },
    { text: '100%', header: true, align: 'center' },
  )
  rows.push(rSumPercent)

  return {
    type: 'table',
    rows,
  }
}

/** Chuyển Bản đặc tả thành TableBlock */
export function buildSpecTableBlock(data: SpecData): TableBlock {
  const rows: TableCellData[][] = []

  // Hàng tiêu đề 1
  const r1: TableCellData[] = [
    { text: 'TT', header: true, rowSpan: 2, align: 'center' },
    { text: 'Chủ đề', header: true, rowSpan: 2, align: 'center' },
    { text: 'Yêu cầu cần đạt', header: true, rowSpan: 2, align: 'center' },
    { text: 'Số câu hỏi theo mức độ nhận thức', header: true, colSpan: data.levels.length, align: 'center' },
    { text: 'Câu số', header: true, rowSpan: 2, align: 'center' },
  ]
  rows.push(r1)

  // Hàng tiêu đề 2
  const r2: TableCellData[] = data.levels.map((l) => ({
    text: l.label,
    header: true,
    align: 'center',
  }))
  rows.push(r2)

  // Dữ liệu từng chủ đề
  for (const t of data.topics) {
    const totalItems = t.items.length || 1
    t.items.forEach((it, idx) => {
      const rowCells: TableCellData[] = []
      if (idx === 0) {
        rowCells.push({ text: String(t.stt), rowSpan: totalItems, align: 'center' })
        rowCells.push({ text: t.chuDe, rowSpan: totalItems, align: 'left' })
      }
      rowCells.push({ text: it.yeuCau, align: 'left' })
      for (const l of data.levels) {
        const count = it.counts[l.key] || 0
        rowCells.push({ text: count > 0 ? String(count) : '-', align: 'center' })
      }
      rowCells.push({ text: it.questionRefs || '-', align: 'center' })
      rows.push(rowCells)
    })
  }

  return {
    type: 'table',
    rows,
  }
}

/** Dựng toàn bộ tài liệu ExamDoc chứa ma trận và đặc tả để xuất Word riêng khổ ngang */
export function buildMatrixAndSpecExamDoc(
  doc: ExamDoc,
  matrixTable: TableBlock,
  specTable: TableBlock,
  meta: { subject: string; grade: number; duration?: string; term?: string; schoolYear?: string },
): ExamDoc {
  const blocks: ExamBlock[] = [
    {
      type: 'title',
      text: `MA TRẬN ĐỀ KIỂM TRA ${meta.term ? meta.term.toUpperCase() : 'ĐỊNH KỲ'}`,
      format: { align: 'center' },
    },
    {
      type: 'paragraph',
      text: [
        { text: `MÔN: ${meta.subject.toUpperCase()} – LỚP ${meta.grade}`, marks: [{ type: 'bold' }] },
        ...(meta.duration ? [{ text: `  •  Thời gian: ${meta.duration}` }] : []),
        ...(meta.schoolYear ? [{ text: `  •  Năm học: ${meta.schoolYear}` }] : []),
      ],
      format: { align: 'center' },
    },
    { type: 'paragraph', text: '' },
    matrixTable,
    { type: 'pageBreak' },
    {
      type: 'title',
      text: `BẢN ĐẶC TẢ ĐỀ KIỂM TRA ${meta.term ? meta.term.toUpperCase() : 'ĐỊNH KỲ'}`,
      format: { align: 'center' },
    },
    {
      type: 'paragraph',
      text: [
        { text: `MÔN: ${meta.subject.toUpperCase()} – LỚP ${meta.grade}`, marks: [{ type: 'bold' }] },
      ],
      format: { align: 'center' },
    },
    { type: 'paragraph', text: '' },
    specTable,
  ]

  return {
    ...doc,
    title: `${doc.title} - Ma trận & Đặc tả`,
    blocks,
  }
}
