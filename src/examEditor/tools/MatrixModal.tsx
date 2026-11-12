/**
 * Modal công cụ "Ma trận & đặc tả":
 * - Phân loại tự động các câu hỏi bằng AI theo khung chương trình GDPT 2018 (hoặc TT 27 tiểu học).
 * - Bảng sửa tay từng câu: Câu · Dạng · Chủ đề · Mức độ · Yêu cầu cần đạt · Điểm.
 * - Xem trước bảng ma trận và đặc tả cập nhật tức thì.
 * - Xuất Word riêng khổ ngang hoặc chèn vào cuối đề thi.
 */
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Download, RefreshCw, Sparkles } from 'lucide-react'
import type { ExamBlock, ExamDoc } from '@/data/docTypes'
import { Button, Badge, inputClass, selectClass } from '@/components/ui'
import { Segmented } from '@/components/Segmented'
import { ToolShell, sectionTitle, Check } from './ToolShell'
import {
  buildMatrixAndSpecExamDoc,
  buildMatrixData,
  buildMatrixTableBlock,
  buildSpecData,
  buildSpecTableBlock,
  classifyQuestionsWithAi,
  computeTotalScore,
  DEFAULT_SCORE_CONFIG,
  extractQuestionsFromDoc,
  type MatrixScoreConfig,
  type MucDo,
  type QuestionClassified,
} from '@/lib/matrixExam'
import { detectSubjectAndGrade, getChaptersFor, KHUNG_SUBJECTS } from '@/lib/khungPrompt'
import { exportDocBlocks } from '../exportBlocks'
import { cn } from '@/lib/cn'

const MUC_DO_OPTIONS_SECONDARY: Array<{ key: MucDo; label: string }> = [
  { key: 'NB', label: 'Nhận biết (NB)' },
  { key: 'TH', label: 'Thông hiểu (TH)' },
  { key: 'VD', label: 'Vận dụng (VD)' },
  { key: 'VDC', label: 'Vận dụng cao (VDC)' },
]

const MUC_DO_OPTIONS_PRIMARY: Array<{ key: MucDo; label: string }> = [
  { key: 'M1', label: 'Mức 1 (Nhận biết)' },
  { key: 'M2', label: 'Mức 2 (Kết nối)' },
  { key: 'M3', label: 'Mức 3 (Vận dụng)' },
]

const KIND_BADGES: Record<string, { label: string; tone: 'neutral' | 'clay' | 'sage' | 'honey' }> = {
  mcq: { label: 'Trắc nghiệm', tone: 'neutral' },
  tf: { label: 'Đúng / Sai', tone: 'clay' },
  short: { label: 'Trả lời ngắn', tone: 'honey' },
  essay: { label: 'Tự luận', tone: 'sage' },
}

export function MatrixModal({
  doc,
  onClose,
  onInsertBlocks,
}: {
  doc: ExamDoc
  onClose: () => void
  onInsertBlocks?: (blocks: ExamBlock[]) => void
}) {
  const detected = useMemo(() => detectSubjectAndGrade(`${doc.subject} ${doc.grade} ${doc.title}`), [doc])
  const [subject, setSubject] = useState(detected.subject || doc.subject || 'Toán')
  const [grade, setGrade] = useState<number>(detected.grade || 12)
  const isTieuHoc = grade <= 5

  const [chapters, setChapters] = useState<string[]>([])
  const [questions, setQuestions] = useState<QuestionClassified[]>(() => extractQuestionsFromDoc(doc))
  const [scoreConfig, setScoreConfig] = useState<MatrixScoreConfig>(() => DEFAULT_SCORE_CONFIG(subject))
  const [separateVdc, setSeparateVdc] = useState(false)
  const [activeTab, setActiveTab] = useState<'matran' | 'dacta'>('matran')

  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [exportingWord, setExportingWord] = useState(false)

  // Nạp danh sách chương của môn + lớp
  useEffect(() => {
    let active = true
    void getChaptersFor(subject, grade).then((list) => {
      if (!active) return
      const finalList = list.length ? list : ['Chương 1', 'Chương 2']
      setChapters(finalList)
    })
    return () => {
      active = false
    }
  }, [subject, grade])

  // Tự động chạy phân loại AI lần đầu khi mở modal
  useEffect(() => {
    if (!questions.length) return
    let active = true
    const controller = new AbortController()

    const runAi = async () => {
      setAiBusy(true)
      setAiError('')
      try {
        const chaps = await getChaptersFor(subject, grade)
        if (!active) return
        const list = chaps.length ? chaps : chapters
        const classified = await classifyQuestionsWithAi(questions, subject, grade, list, controller.signal)
        if (active) setQuestions(classified)
      } catch (err) {
        if (!active) return
        setAiError(err instanceof Error ? err.message : String(err))
      } finally {
        if (active) setAiBusy(false)
      }
    }

    void runAi()
    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Phân loại lại thủ công
  const handleReclassify = async () => {
    setAiBusy(true)
    setAiError('')
    try {
      const chaps = chapters.length ? chapters : await getChaptersFor(subject, grade)
      const classified = await classifyQuestionsWithAi(questions, subject, grade, chaps)
      setQuestions(classified)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err))
    } finally {
      setAiBusy(false)
    }
  }

  // Dữ liệu ma trận và đặc tả
  const matrixData = useMemo(
    () => buildMatrixData(questions, scoreConfig, { grade, separateVdc }),
    [questions, scoreConfig, grade, separateVdc],
  )

  const specData = useMemo(
    () => buildSpecData(questions, { grade, separateVdc }),
    [questions, grade, separateVdc],
  )

  const totalScore = useMemo(() => computeTotalScore(questions, scoreConfig), [questions, scoreConfig])
  const scoreDiff = Math.abs(totalScore - 10) > 0.001

  // Sửa trường của 1 câu
  const updateQuestion = (idx: number, patch: Partial<QuestionClassified>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  // Sửa mức độ ý đúng-sai
  const updateTfLevel = (qIdx: number, itemIdx: number, val: MucDo) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q
        const nextTf: [MucDo, MucDo, MucDo, MucDo] = [...q.mucDoTf]
        nextTf[itemIdx] = val
        return { ...q, mucDoTf: nextTf }
      }),
    )
  }

  // Xuất file Word riêng (khổ ngang, Times New Roman 13)
  const handleExportWord = async () => {
    setExportingWord(true)
    try {
      const matrixTable = buildMatrixTableBlock(matrixData)
      const specTable = buildSpecTableBlock(specData)
      const exportDoc = buildMatrixAndSpecExamDoc(doc, matrixTable, specTable, {
        subject,
        grade,
        duration: doc.duration,
        term: doc.term,
        schoolYear: doc.schoolYear,
      })
      await exportDocBlocks(exportDoc, { landscape: true, fileName: `${doc.title} - Ma tran dac ta` })
    } catch (err) {
      alert(`Lỗi xuất file Word: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExportingWord(false)
    }
  }

  // Chèn vào cuối đề thi
  const handleInsert = () => {
    if (!onInsertBlocks) return
    const matrixTable = buildMatrixTableBlock(matrixData)
    const specTable = buildSpecTableBlock(specData)
    const blocksToInsert: ExamBlock[] = [
      { type: 'pageBreak' },
      {
        type: 'title',
        text: `MA TRẬN ĐỀ KIỂM TRA ${doc.term ? doc.term.toUpperCase() : 'ĐỊNH KỲ'}`,
        format: { align: 'center' },
      },
      {
        type: 'paragraph',
        text: [{ text: `MÔN: ${subject.toUpperCase()} – LỚP ${grade}`, marks: [{ type: 'bold' }] }],
        format: { align: 'center' },
      },
      matrixTable,
      { type: 'pageBreak' },
      {
        type: 'title',
        text: `BẢN ĐẶC TẢ ĐỀ KIỂM TRA ${doc.term ? doc.term.toUpperCase() : 'ĐỊNH KỲ'}`,
        format: { align: 'center' },
      },
      {
        type: 'paragraph',
        text: [{ text: `MÔN: ${subject.toUpperCase()} – LỚP ${grade}`, marks: [{ type: 'bold' }] }],
        format: { align: 'center' },
      },
      specTable,
    ]
    onInsertBlocks(blocksToInsert)
    onClose()
  }

  const levelOptions = isTieuHoc ? MUC_DO_OPTIONS_PRIMARY : MUC_DO_OPTIONS_SECONDARY

  // Datalist id cho autocomplete chủ đề
  const datalistId = 'matrix-modal-chapters-list'

  const inputs = (
    <div className="flex flex-col gap-4 text-[13px]">
      <datalist id={datalistId}>
        {chapters.map((c) => (
          <option key={c} value={c} />
        ))}
        <option value="Khác" />
      </datalist>

      {/* Cấu hình Môn & Lớp */}
      <section className="rounded-[8px] border border-line bg-surface p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-medium text-ink-2">
              Môn:
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value)
                  setScoreConfig(DEFAULT_SCORE_CONFIG(e.target.value))
                }}
                className={cn(selectClass, 'h-8 py-1 pl-2 text-[13px] font-semibold')}
              >
                {KHUNG_SUBJECTS.map((s) => (
                  <option key={s.ten} value={s.ten}>
                    {s.ten}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-ink-2">
              Lớp:
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className={cn(selectClass, 'h-8 py-1 pl-2 text-[13px] font-semibold')}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button
            variant="soft"
            size="sm"
            disabled={aiBusy || questions.length === 0}
            onClick={() => void handleReclassify()}
            className="h-8 gap-1.5 px-3 text-[12.5px] text-clay hover:text-clay-deep"
          >
            {aiBusy ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {aiBusy ? 'Đang phân loại…' : 'Phân loại lại AI'}
          </Button>
        </div>

        {!isTieuHoc && (
          <div className="mt-2.5 border-t border-line/70 pt-2">
            <Check checked={separateVdc} onChange={setSeparateVdc}>
              Tách riêng cột Vận dụng cao (VDC) thay vì gộp vào Vận dụng (chuẩn đề 2025)
            </Check>
          </div>
        )}
      </section>

      {/* Cảnh báo AI lỗi nếu có */}
      {aiError && (
        <div className="flex items-start gap-2 rounded-[6px] border border-honey-deep/20 bg-honey-soft/50 p-2.5 text-[12.5px] text-ink-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-honey-deep" />
          <div className="flex-1">
            <span className="font-semibold text-ink">Không gọi được AI tự động:</span> {aiError}.
            <div className="mt-0.5 text-ink-3">Bạn vẫn có thể tự chọn chủ đề và mức độ cho từng câu bên dưới.</div>
          </div>
        </div>
      )}

      {/* Cấu hình điểm từng phần */}
      <section className="rounded-[8px] border border-line bg-surface p-3">
        <h3 className={sectionTitle}>Cấu hình thang điểm (2025)</h3>
        <div className="grid grid-cols-3 gap-2">
          {matrixData.parts.some((p) => p.id === 'mcq') && (
            <label className="text-[12px] text-ink-3">
              TN nhiều lựa chọn
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="2"
                  value={scoreConfig.mcqPoint}
                  onChange={(e) => setScoreConfig((c) => ({ ...c, mcqPoint: Number(e.target.value) || 0 }))}
                  className={cn(inputClass, 'h-7 px-2 py-0.5 text-[12.5px]')}
                />
                <span className="text-[11px] text-ink-4">đ/câu</span>
              </div>
            </label>
          )}

          {matrixData.parts.some((p) => p.id === 'tf') && (
            <label className="text-[12px] text-ink-3">
              Đúng - Sai
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="2"
                  value={scoreConfig.tfPointPerItem}
                  onChange={(e) => setScoreConfig((c) => ({ ...c, tfPointPerItem: Number(e.target.value) || 0 }))}
                  className={cn(inputClass, 'h-7 px-2 py-0.5 text-[12.5px]')}
                />
                <span className="text-[11px] text-ink-4">đ/ý</span>
              </div>
            </label>
          )}

          {matrixData.parts.some((p) => p.id === 'short') && (
            <label className="text-[12px] text-ink-3">
              Trả lời ngắn
              <div className="mt-1 flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="2"
                  value={scoreConfig.shortPoint}
                  onChange={(e) => setScoreConfig((c) => ({ ...c, shortPoint: Number(e.target.value) || 0 }))}
                  className={cn(inputClass, 'h-7 px-2 py-0.5 text-[12.5px]')}
                />
                <span className="text-[11px] text-ink-4">đ/câu</span>
              </div>
            </label>
          )}
        </div>

        {/* Tổng điểm báo động */}
        <div className="mt-2.5 flex items-center justify-between border-t border-line/70 pt-2 text-[12.5px]">
          <span className="font-medium text-ink-2">Tổng điểm đề thi:</span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className={cn('tabular-nums text-[14px]', scoreDiff ? 'text-clay' : 'text-sage-deep')}>
              {totalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} / 10 điểm
            </span>
            {scoreDiff ? (
              <Badge tone="clay" className="py-0.5 text-[11px]">
                Lệch 10 điểm
              </Badge>
            ) : (
              <Badge tone="sage" className="py-0.5 text-[11px]">
                Đủ 10 điểm
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Danh sách từng câu hỏi để sửa tay */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className={sectionTitle}>Chi tiết {questions.length} câu hỏi</h3>
          <span className="text-[11.5px] text-ink-3">Sửa ô nào thì ma trận cập nhật ngay</span>
        </div>

        {questions.length === 0 ? (
          <p className="rounded-[6px] border border-line bg-paper-2 p-4 text-center text-ink-3">
            Đề chưa có câu hỏi nào để lập ma trận.
          </p>
        ) : (
          <div className="flex max-h-[380px] flex-col gap-2.5 overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const badge = KIND_BADGES[q.kind] ?? KIND_BADGES.mcq
              return (
                <div
                  key={idx}
                  className="rounded-[8px] border border-line bg-white p-2.5 shadow-xs transition-colors hover:border-ink-4"
                >
                  {/* Dòng đầu: Tên câu + Badge dạng + trích đoạn + điểm */}
                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="font-bold text-ink">{q.label}</span>
                      <Badge tone={badge.tone} className="px-1.5 py-0 text-[10.5px]">
                        {badge.label}
                      </Badge>
                      <span className="truncate text-[12px] text-ink-3" title={q.textSummary}>
                        {q.textSummary}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      {q.kind === 'essay' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="10"
                            value={q.score}
                            onChange={(e) => updateQuestion(idx, { score: Number(e.target.value) || 0 })}
                            className={cn(inputClass, 'h-6 w-14 px-1 text-right text-[12px] font-semibold')}
                          />
                          <span className="text-[11px] text-ink-3">đ</span>
                        </div>
                      ) : (
                        <span className="text-[11.5px] tabular-nums font-medium text-ink-3">
                          {q.kind === 'mcq'
                            ? `${scoreConfig.mcqPoint}đ`
                            : q.kind === 'short'
                              ? `${scoreConfig.shortPoint}đ`
                              : `${scoreConfig.tfPointPerItem * 4}đ`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dòng 2: Chủ đề & Mức độ */}
                  <div className="mt-2 grid grid-cols-12 gap-2">
                    <div className="col-span-7">
                      <label className="text-[11px] text-ink-3">Chủ đề (chương):</label>
                      <input
                        list={datalistId}
                        value={q.chuDe}
                        onChange={(e) => updateQuestion(idx, { chuDe: e.target.value })}
                        placeholder="Chọn hoặc gõ chủ đề…"
                        className={cn(inputClass, 'mt-0.5 h-7 px-2 text-[12px]')}
                      />
                    </div>

                    <div className="col-span-5">
                      <label className="text-[11px] text-ink-3">Mức độ:</label>
                      {q.kind === 'tf' ? (
                        <div className="mt-0.5 grid grid-cols-4 gap-1">
                          {(['a', 'b', 'c', 'd'] as const).map((opt, optIdx) => (
                            <div key={opt} className="flex flex-col items-center">
                              <span className="text-[9.5px] font-medium text-ink-3">{opt}</span>
                              <select
                                value={q.mucDoTf[optIdx]}
                                onChange={(e) => updateTfLevel(idx, optIdx, e.target.value as MucDo)}
                                className={cn(selectClass, 'h-6 w-full px-0.5 py-0 text-[10.5px] font-semibold')}
                              >
                                {levelOptions.map((o) => (
                                  <option key={o.key} value={o.key}>
                                    {o.key}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <select
                          value={q.mucDo}
                          onChange={(e) => updateQuestion(idx, { mucDo: e.target.value as MucDo })}
                          className={cn(selectClass, 'mt-0.5 h-7 py-0 pl-2 text-[12px] font-semibold')}
                        >
                          {levelOptions.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Dòng 3: Yêu cầu cần đạt */}
                  <div className="mt-1.5">
                    <input
                      type="text"
                      value={q.yeuCau}
                      onChange={(e) => updateQuestion(idx, { yeuCau: e.target.value })}
                      placeholder="Yêu cầu cần đạt: Bắt đầu bằng động từ (Nhận biết được…, Tính được…)"
                      className={cn(inputClass, 'h-7 px-2 text-[12px] text-ink-2')}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )

  // Vùng xem trước bên phải
  const preview = (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[8px] bg-white shadow-xs">
      {/* Thanh tab chọn xem Ma trận / Đặc tả */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5 bg-paper">
        <Segmented<'matran' | 'dacta'>
          value={activeTab}
          onChange={setActiveTab}
          label="Chọn bảng"
          options={[
            { key: 'matran', label: 'Bảng Ma trận' },
            { key: 'dacta', label: 'Bản Đặc tả' },
          ]}
        />
        <div className="flex items-center gap-2 text-[12px] text-ink-3">
          <span>{questions.length} câu</span>
          <span>•</span>
          <span className="font-semibold text-ink">{totalScore} điểm</span>
        </div>
      </div>

      {/* Bảng xem trước */}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeTab === 'matran' ? (
          <div>
            <h4 className="mb-2 text-center text-[14px] font-bold uppercase tracking-wide text-ink">
              MA TRẬN ĐỀ KIỂM TRA MÔN {subject.toUpperCase()} – LỚP {grade}
            </h4>
            <div className="overflow-x-auto">
              <table className="doc-table w-full border-collapse border border-black text-center text-[12px]">
                <thead>
                  <tr className="bg-[#f2f2f2] font-bold">
                    <th rowSpan={2} className="border border-black p-1 w-10">
                      TT
                    </th>
                    <th rowSpan={2} className="border border-black p-1 text-left min-w-[140px]">
                      Chủ đề / Mạch kiến thức
                    </th>
                    {matrixData.parts.map((p) => (
                      <th key={p.id} colSpan={p.levels.length} className="border border-black p-1">
                        {p.title}
                        {p.note && <div className="text-[10.5px] font-normal text-ink-3">({p.note})</div>}
                      </th>
                    ))}
                    <th rowSpan={2} className="border border-black p-1 w-16">
                      Tổng số câu/ý
                    </th>
                    <th rowSpan={2} className="border border-black p-1 w-16">
                      Tổng điểm
                    </th>
                    <th rowSpan={2} className="border border-black p-1 w-14">
                      Tỉ lệ %
                    </th>
                  </tr>
                  <tr className="bg-[#f2f2f2] font-bold">
                    {matrixData.parts.flatMap((p) =>
                      p.levels.map((l) => (
                        <th key={`${p.id}_${l.key}`} className="border border-black p-1 text-[11px] min-w-[40px]">
                          {l.label}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.rows.map((r) => (
                    <tr key={r.stt} className="hover:bg-sunken/40">
                      <td className="border border-black p-1">{r.stt}</td>
                      <td className="border border-black p-1 text-left font-medium">{r.chuDe}</td>
                      {matrixData.parts.flatMap((p) =>
                        p.levels.map((l) => {
                          const val = r.cells[`${p.id}_${l.key}`] || 0
                          return (
                            <td key={`${p.id}_${l.key}`} className="border border-black p-1 tabular-nums">
                              {val > 0 ? val : '-'}
                            </td>
                          )
                        }),
                      )}
                      <td className="border border-black p-1 font-semibold tabular-nums">{r.totalCount}</td>
                      <td className="border border-black p-1 font-semibold tabular-nums">
                        {r.totalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border border-black p-1 tabular-nums">
                        {r.percent.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      </td>
                    </tr>
                  ))}
                  {/* Hàng Tổng số câu/ý */}
                  <tr className="bg-[#f9f9f9] font-bold">
                    <td colSpan={2} className="border border-black p-1 text-center">
                      Tổng số câu / ý
                    </td>
                    {matrixData.parts.flatMap((p) =>
                      p.levels.map((l) => {
                        const val = matrixData.summary.partTotals[`${p.id}_${l.key}`] || 0
                        return (
                          <td key={`${p.id}_${l.key}`} className="border border-black p-1 tabular-nums">
                            {val}
                          </td>
                        )
                      }),
                    )}
                    <td className="border border-black p-1 tabular-nums">{matrixData.summary.grandTotalCount}</td>
                    <td className="border border-black p-1 tabular-nums">
                      {matrixData.summary.grandTotalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-black p-1 tabular-nums">100%</td>
                  </tr>
                  {/* Hàng Tổng điểm */}
                  <tr className="bg-[#f9f9f9] font-bold">
                    <td colSpan={2} className="border border-black p-1 text-center">
                      Tổng điểm
                    </td>
                    {matrixData.parts.flatMap((p) =>
                      p.levels.map((l) => {
                        const val = matrixData.summary.partScoreTotals[`${p.id}_${l.key}`] || 0
                        return (
                          <td key={`${p.id}_${l.key}`} className="border border-black p-1 tabular-nums">
                            {val > 0 ? val.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '-'}
                          </td>
                        )
                      }),
                    )}
                    <td className="border border-black p-1">-</td>
                    <td className="border border-black p-1 tabular-nums">
                      {matrixData.summary.grandTotalScore.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-black p-1">100%</td>
                  </tr>
                  {/* Hàng Tỉ lệ % */}
                  <tr className="bg-[#f9f9f9] font-bold">
                    <td colSpan={2} className="border border-black p-1 text-center">
                      Tỉ lệ %
                    </td>
                    {matrixData.parts.flatMap((p) =>
                      p.levels.map((l) => {
                        const val = matrixData.summary.partPercentTotals[`${p.id}_${l.key}`] || 0
                        return (
                          <td key={`${p.id}_${l.key}`} className="border border-black p-1 tabular-nums">
                            {val > 0 ? `${val.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '-'}
                          </td>
                        )
                      }),
                    )}
                    <td className="border border-black p-1">-</td>
                    <td className="border border-black p-1">100%</td>
                    <td className="border border-black p-1">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tóm tắt mức độ chung */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 rounded-[6px] bg-paper p-2 text-[12px]">
              <span className="font-semibold text-ink-2">Phân bổ nhận thức:</span>
              {matrixData.levels.map((l) => (
                <span key={l.key} className="flex items-center gap-1">
                  <span className="text-ink-3">{l.label}:</span>
                  <span className="font-bold text-ink">
                    {matrixData.summary.levelScores[l.key] ?? 0}đ ({matrixData.summary.levelPercents[l.key] ?? 0}%)
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 className="mb-2 text-center text-[14px] font-bold uppercase tracking-wide text-ink">
              BẢN ĐẶC TẢ ĐỀ KIỂM TRA MÔN {subject.toUpperCase()} – LỚP {grade}
            </h4>
            <div className="overflow-x-auto">
              <table className="doc-table w-full border-collapse border border-black text-center text-[12px]">
                <thead>
                  <tr className="bg-[#f2f2f2] font-bold">
                    <th rowSpan={2} className="border border-black p-1 w-10">
                      TT
                    </th>
                    <th rowSpan={2} className="border border-black p-1 text-left w-36">
                      Chủ đề
                    </th>
                    <th rowSpan={2} className="border border-black p-1 text-left min-w-[200px]">
                      Yêu cầu cần đạt
                    </th>
                    <th colSpan={specData.levels.length} className="border border-black p-1">
                      Số câu hỏi theo mức độ nhận thức
                    </th>
                    <th rowSpan={2} className="border border-black p-1 min-w-[120px]">
                      Câu số
                    </th>
                  </tr>
                  <tr className="bg-[#f2f2f2] font-bold">
                    {specData.levels.map((l) => (
                      <th key={l.key} className="border border-black p-1 text-[11px] min-w-[40px]">
                        {l.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specData.topics.flatMap((t) => {
                    const rowCount = t.items.length || 1
                    return t.items.map((it, idx) => (
                      <tr key={`${t.stt}_${idx}`} className="hover:bg-sunken/40">
                        {idx === 0 && (
                          <>
                            <td rowSpan={rowCount} className="border border-black p-1 font-bold">
                              {t.stt}
                            </td>
                            <td rowSpan={rowCount} className="border border-black p-1 text-left font-medium">
                              {t.chuDe}
                            </td>
                          </>
                        )}
                        <td className="border border-black p-1 text-left">{it.yeuCau}</td>
                        {specData.levels.map((l) => {
                          const count = it.counts[l.key] || 0
                          return (
                            <td key={l.key} className="border border-black p-1 tabular-nums">
                              {count > 0 ? count : '-'}
                            </td>
                          )
                        })}
                        <td className="border border-black p-1 text-center font-medium text-ink-2">
                          {it.questionRefs || '-'}
                        </td>
                      </tr>
                    ))
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const canSubmit = questions.length > 0 && !aiBusy

  const extraActions = (
    <Button
      variant="outline"
      size="sm"
      disabled={exportingWord || questions.length === 0}
      onClick={() => void handleExportWord()}
      className="gap-1.5 text-[13px]"
    >
      <Download className="size-3.5" />
      {exportingWord ? 'Đang xuất Word…' : 'Xuất Word (khổ ngang)'}
    </Button>
  )

  return (
    <ToolShell
      title="Ma trận & đặc tả"
      hint="Lập bảng ma trận đề và đặc tả theo mẫu Bộ GD&ĐT (CV 7991/BGDĐT-GDTrH)"
      inputs={inputs}
      preview={null}
      renderPreview={() => preview}
      submitLabel={onInsertBlocks ? 'Chèn vào cuối đề' : 'Xong'}
      canSubmit={canSubmit}
      onSubmit={onInsertBlocks ? handleInsert : onClose}
      onClose={onClose}
      inputsWidth={500}
      maxWidth={1240}
      extraActions={extraActions}
    />
  )
}
