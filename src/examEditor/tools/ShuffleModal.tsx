/**
 * Công cụ "Xáo đề": từ đề đang soạn sinh nhiều mã đề (xáo câu, xáo phương án),
 * tải về Word (.zip gồm mỗi mã một file + phiếu trả lời + đáp án + bảng tổng hợp)
 * hoặc in ra PDF một lần (kèm phiếu sau mỗi mã đề và bảng đáp án tổng hợp ở trang cuối).
 */
import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import type { ExamDoc } from '@/data/docTypes'
import type { ToolImage } from '@/lib/toolSpec'
import { buildSummaryAnswers, makeCodes, shuffleExam } from '@/lib/shuffleExam'
import { A4_HEIGHT, A4_WIDTH, extractAnswerSheetInfo, generateAnswerSheetSvg } from '@/lib/answerSheet'
import { svgDataUrl, svgToPng } from '@/lib/plot'
import { cn } from '@/lib/cn'
import { Check, ToolShell, sectionTitle } from './ToolShell'

type Format = 'docx' | 'pdf'
const MAX_VERSIONS = 24
const inputCls = 'h-9 w-full rounded-[6px] border border-line bg-white px-2.5 text-[14px] text-ink outline-none focus:border-clay'

export function ShuffleModal({ doc, onClose }: { doc: ExamDoc; onClose: () => void }) {
  const [count, setCount] = useState(4)
  const [start, setStart] = useState('101')
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(true)
  const [withAnswers, setWithAnswers] = useState(true)
  const [withSheets, setWithSheets] = useState(true)
  const [withSummary, setWithSummary] = useState(true)
  const [previewSheet, setPreviewSheet] = useState(false)
  const [format, setFormat] = useState<Format>('docx')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const safeCount = Math.min(MAX_VERSIONS, Math.max(1, Math.round(count) || 1))
  const codes = useMemo(() => makeCodes(start, safeCount), [start, safeCount])
  const duplicate = new Set(codes).size !== codes.length
  // bản xem trước (chỉ để đếm câu và đọc đáp án): xáo thật lúc bấm Tạo
  const sample = useMemo(() => shuffleExam(doc, { codes: codes.slice(0, 1), shuffleQuestions: false, shuffleOptions: false }), [doc, codes])
  const sheetInfo = useMemo(() => extractAnswerSheetInfo(doc), [doc])
  const counts = useMemo(
    () => ({
      mcq: sheetInfo.mcqCount,
      tf: sheetInfo.tfCount,
      short: sheetInfo.shortCount,
      essay: doc.blocks.filter((b) => b.type === 'essay').length,
    }),
    [sheetInfo, doc],
  )
  const previewSvg = useMemo(
    () =>
      sample.questionCount > 0
        ? generateAnswerSheetSvg({ ...sheetInfo, code: codes[0] || '101' })
        : '',
    [sheetInfo, codes, sample.questionCount],
  )
  const missing = sample.questionCount - sample.answeredCount
  const canSubmit = sample.questionCount > 0 && !busy && !duplicate && start.trim() !== ''

  const run = async () => {
    setBusy(true)
    setError('')
    try {
      const res = shuffleExam(doc, { codes, shuffleQuestions, shuffleOptions })
      const summaryData = withSummary ? buildSummaryAnswers(res) : undefined
      const { docFileName, printDocs, printShuffledExams } = await import('../exportBlocks')

      if (format === 'pdf') {
        if (!withSheets && !withSummary) {
          const files = [...res.versions.map((v) => v.doc), ...(withAnswers ? [res.answerDoc] : [])]
          printDocs(files, `${doc.title} - ${codes.length} mã đề`)
        } else {
          const items = res.versions.map((v) => ({
            doc: v.doc,
            code: v.code,
            sheetSvg: withSheets ? generateAnswerSheetSvg({ ...sheetInfo, code: v.code }) : undefined,
          }))
          printShuffledExams(items, `${doc.title} - ${codes.length} mã đề`, {
            answerDoc: withAnswers ? res.answerDoc : undefined,
            summary: summaryData,
          })
        }
      } else {
        const [{ buildAnswerSheetDocxBlob, buildDocxBlob, buildSummaryDocxBlob }, { default: JSZip }] = await Promise.all([
          import('../docxBlocks'),
          import('jszip'),
        ])
        const zip = new JSZip()
        for (const v of res.versions) {
          zip.file(`${docFileName(v.doc.title)}.docx`, await buildDocxBlob(v.doc))
          if (withSheets) {
            const svg = generateAnswerSheetSvg({ ...sheetInfo, code: v.code })
            const pngUrl = await svgToPng(svg, A4_WIDTH, A4_HEIGHT, 2.5)
            zip.file(`phieu-tra-loi-${docFileName(v.code)}.docx`, await buildAnswerSheetDocxBlob(v.code, pngUrl))
          }
        }
        if (withAnswers) {
          zip.file(`${docFileName(res.answerDoc.title)}.docx`, await buildDocxBlob(res.answerDoc))
        }
        if (withSummary && summaryData) {
          zip.file('dap-an-tong-hop.docx', await buildSummaryDocxBlob(doc, summaryData))
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${docFileName(doc.title)} - ${codes.length} ma de.zip`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1500)
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const inputs = (
    <>
      <section>
        <h3 className={sectionTitle}>Số mã đề</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[12.5px] text-ink-3">
            Số đề
            <input
              type="number"
              min={1}
              max={MAX_VERSIONS}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className={cn(inputCls, 'mt-1')}
            />
          </label>
          <label className="text-[12.5px] text-ink-3">
            Mã đề đầu tiên
            <input value={start} onChange={(e) => setStart(e.target.value)} className={cn(inputCls, 'mt-1')} placeholder="101" />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {codes.map((c, i) => (
            <span key={i} className="rounded-full bg-paper-2 px-2 py-0.5 text-[12px] font-medium tabular-nums text-ink-2">
              {c}
            </span>
          ))}
        </div>
        {duplicate && <p className="mt-1.5 text-[12px] text-clay">Mã đề bị trùng, hãy đổi mã đầu tiên.</p>}
      </section>

      <section>
        <h3 className={sectionTitle}>Cách xáo</h3>
        <Check checked={shuffleQuestions} onChange={setShuffleQuestions}>
          Đổi thứ tự câu hỏi
        </Check>
        <Check checked={shuffleOptions} onChange={setShuffleOptions}>
          Đổi thứ tự phương án A, B, C, D
        </Check>
        <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
          Câu chỉ đổi chỗ trong cùng phần, không vượt qua đoạn văn dùng chung. Tự luận giữ nguyên. Câu có phương án kiểu “Cả A và B” không bị đảo phương án.
        </p>
      </section>

      <section>
        <h3 className={sectionTitle}>Tải về</h3>
        <div role="radiogroup" className="grid grid-cols-2 gap-2">
          {(
            [
              ['docx', 'Word', 'File .zip, mỗi mã một file'],
              ['pdf', 'PDF', 'In một lần, chọn “Lưu thành PDF”'],
            ] as const
          ).map(([key, label, desc]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={format === key}
              onClick={() => setFormat(key)}
              className={cn(
                'rounded-[6px] border px-3 py-2 text-left transition-colors',
                format === key ? 'border-clay bg-clay-tint' : 'border-line bg-white hover:border-ink-4',
              )}
            >
              <span className={cn('block text-[13.5px] font-semibold', format === key ? 'text-clay' : 'text-ink')}>{label}</span>
              <span className="block text-[11.5px] leading-snug text-ink-3">{desc}</span>
            </button>
          ))}
        </div>
        <Check checked={withAnswers} onChange={setWithAnswers}>
          Kèm file đáp án các mã đề
        </Check>
        <Check checked={withSheets} onChange={setWithSheets}>
          Kèm phiếu trả lời
        </Check>
        <Check checked={withSummary} onChange={setWithSummary}>
          Bảng đáp án tổng hợp
        </Check>
        <button
          type="button"
          disabled={sample.questionCount === 0}
          onClick={() => setPreviewSheet((v) => !v)}
          className={cn(
            'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
            sample.questionCount === 0
              ? 'cursor-not-allowed border-line bg-paper-2 text-ink-4 opacity-60'
              : previewSheet
                ? 'border-clay bg-clay-tint text-clay'
                : 'border-line bg-white text-ink-2 hover:border-clay hover:text-clay',
          )}
        >
          <Eye className="size-3.5" />
          {previewSheet ? 'Quay lại tóm tắt' : 'Xem trước phiếu'}
        </button>
      </section>
    </>
  )

  const summary = (
    <div className="w-full max-w-[460px] rounded-[8px] border border-line bg-white p-5 text-[13.5px] text-ink-2">
      <p className="text-[15px] font-semibold text-ink">{doc.title}</p>
      <ul className="mt-3 space-y-1">
        {counts.mcq > 0 && <li>{counts.mcq} câu trắc nghiệm</li>}
        {counts.tf > 0 && <li>{counts.tf} câu đúng / sai</li>}
        {counts.short > 0 && <li>{counts.short} câu trả lời ngắn</li>}
        {counts.essay > 0 && <li>{counts.essay} bài tự luận (giữ nguyên)</li>}
      </ul>
      {sample.questionCount === 0 ? (
        <p className="mt-4 rounded-[6px] bg-clay-tint px-3 py-2 text-clay">Đề chưa có câu trắc nghiệm, đúng/sai hay trả lời ngắn nào để xáo.</p>
      ) : missing > 0 ? (
        <p className="mt-4 rounded-[6px] bg-clay-tint px-3 py-2 text-[12.5px] text-clay">
          {missing}/{sample.questionCount} câu chưa có đáp án trong khối đáp án của đề, nên ô đáp án của các câu đó sẽ ghi “?”.
        </p>
      ) : (
        <p className="mt-4 rounded-[6px] bg-sage-soft px-3 py-2 text-[12.5px] text-sage">
          Đọc được đáp án của cả {sample.questionCount} câu, nên bảng đáp án từng mã đề sẽ tự đổi theo vị trí mới.
        </p>
      )}
      <p className="mt-4 text-[12.5px] text-ink-3">
        Sẽ tạo {codes.length} mã đề
        {withSheets ? `, ${codes.length} phiếu trả lời` : ''}
        {withAnswers ? ', 1 file đáp án từng mã' : ''}
        {withSummary ? ', 1 bảng đáp án tổng hợp' : ''}. Phần đáp án ở cuối đề gốc được bỏ khỏi đề phát cho học sinh.
      </p>
      {error && <p className="mt-3 text-[12.5px] text-clay">Lỗi: {error}</p>}
    </div>
  )

  const sheetPreviewView = (
    <div className="flex h-full w-full flex-col items-center overflow-hidden">
      <div className="mb-2 flex w-full items-center justify-between text-[12.5px] text-ink-3">
        <span>
          Phiếu trả lời mẫu — Mã đề <strong className="text-ink">{codes[0] || '101'}</strong>
        </span>
        <button
          type="button"
          onClick={() => setPreviewSheet(false)}
          className="rounded-[5px] border border-line bg-white px-2 py-0.5 text-[12px] font-medium text-ink-2 hover:border-clay hover:text-clay"
        >
          Đóng xem trước
        </button>
      </div>
      <div className="flex min-h-0 w-full flex-1 items-start justify-center overflow-auto rounded-[6px] border border-line bg-white p-2">
        {previewSvg && (
          <img
            src={svgDataUrl(previewSvg)}
            alt={`Phiếu trả lời mã đề ${codes[0] || '101'}`}
            className="h-auto w-full max-w-[460px] border border-line/60 shadow-sm"
          />
        )}
      </div>
    </div>
  )

  return (
    <ToolShell
      title="Xáo đề"
      hint="Tạo nhiều mã đề từ đề đang soạn"
      inputs={inputs}
      preview={{} as ToolImage}
      renderPreview={() => (previewSheet && sample.questionCount > 0 ? sheetPreviewView : summary)}
      submitLabel={busy ? 'Đang tạo…' : `Tạo ${codes.length} mã đề`}
      canSubmit={canSubmit}
      onSubmit={() => void run()}
      onClose={onClose}
      inputsWidth={360}
    />
  )
}
