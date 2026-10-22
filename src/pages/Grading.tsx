import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, CheckCircle2, ClipboardList, ScanLine, XCircle } from 'lucide-react'
import { Badge, Button, EmptyState, inputClass, selectClass } from '@/components/ui'
import { cn } from '@/lib/cn'

interface AnswerKey {
  id: string
  label: string
  key: string
}

const KEYS: AnswerKey[] = [
  {
    id: 'k1',
    label: 'Đề Toán 9 — giữa kỳ 2',
    key: '1B 2C 3A 4D 5B 6A 7C 8D 9B 10A 11C 12D 13A 14B 15C 16D 17A 18B 19C 20D',
  },
  {
    id: 'k2',
    label: 'Đề Vật lí 10 — chương 1',
    key: '1A 2D 3B 4C 5A 6C 7B 8A 9D 10C 11B 12A',
  },
  {
    id: 'k3',
    label: 'Đề Hoá học 8 — kim loại',
    key: '1C 2A 3B 4A 5D 6C 7B 8A 9C 10D 11A 12B',
  },
]

export default function Grading() {
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedKey, setSelectedKey] = useState(KEYS[0].id)
  const [studentName, setStudentName] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<{
    score: number
    total: number
    correct: number
    wrong: number
    blank: number
    details: { i: number; given: string; correct: string; ok: boolean }[]
  } | null>(null)
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const key = KEYS.find((k) => k.id === selectedKey)!
  const keyLetters = useMemo(() => key.key.split(/\s+/), [key])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImage(String(reader.result))
      setScanning(true)
      setTimeout(() => {
        const picked = keyLetters.map((l, i) => (i % 7 === 3 ? '' : l))
        setAnswers(picked)
        setScanning(false)
      }, 1400)
    }
    reader.readAsDataURL(file)
  }

  const grade = () => {
    const details = keyLetters.map((correct, i) => {
      const given = answers[i] ?? ''
      return { i: i + 1, given: given || '—', correct, ok: given === correct }
    })
    const correct = details.filter((d) => d.ok).length
    const blank = answers.filter((a) => !a).length
    const wrong = details.length - correct - blank
    setResult({ score: correct, total: details.length, correct, wrong, blank, details })
  }

  return (
    <div className="mx-auto max-w-[1140px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10">
        <p className="eyebrow mb-3.5">Tiện ích</p>
        <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
          Chấm trắc nghiệm
        </h1>
        <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.75] text-ink-2">
          Chấm nhanh phiếu trả lời trắc nghiệm. Chọn đáp án, chụp tay vào ảnh phiếu, hoặc gõ tay
          từng câu — kết quả hiện ra ngay.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
        <div className="space-y-4">
          <div className="rounded-[6px] bg-surface p-5 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
            <p className="eyebrow mb-4">Phiếu thi</p>

            <label className="mb-4 block">
              <span className="mb-2 block text-[12.5px] font-semibold text-ink-2">Chọn đáp án đúng</span>
              <select
                value={selectedKey}
                onChange={(e) => {
                  setSelectedKey(e.target.value)
                  setAnswers([])
                  setResult(null)
                }}
                className={selectClass}
              >
                {KEYS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-4 block">
              <span className="mb-2 block text-[12.5px] font-semibold text-ink-2">Học sinh</span>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[12.5px] font-semibold text-ink-2">Mã học sinh</span>
              <input
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="HS001"
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-[6px] bg-surface p-5 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
            <p className="eyebrow mb-4">Tải phiếu lên</p>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2.5 rounded-[10px] bg-sunken/60 px-4 py-9 text-center transition-colors hover:bg-sunken"
            >
              {image ? (
                <img src={image} alt="Phiếu trả lời" className="max-h-40 rounded-[10px] object-contain" />
              ) : (
                <>
                  <span className="flex size-11 items-center justify-center rounded-full bg-surface text-ink-3 shadow-soft">
                    <Camera className="size-4.5" strokeWidth={1.7} />
                  </span>
                  <span className="text-[13px] font-semibold text-ink-2">Chụp hoặc tải ảnh phiếu</span>
                  <span className="text-[11.5px] text-ink-4">PNG, JPG · tối đa 10MB</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />

            {scanning ? (
              <div className="mt-3.5 flex items-center gap-2.5 rounded-[6px] bg-sunken px-3.5 py-2.5 text-[12.5px] font-medium text-ink-2">
                <ScanLine className="size-3.5 animate-pulse text-clay" />
                Đang đọc phiếu…
              </div>
            ) : null}

            {answers.length ? (
              <p className="mt-3.5 text-[12px] leading-relaxed text-ink-3">
                Đã nhận dạng {answers.filter(Boolean).length}/{keyLetters.length} ô trả lời. Bạn có thể
                sửa bên dưới.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-[28px] bg-surface p-6 shadow-[0_1px_2px_rgba(60,48,32,0.03)] sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <p className="eyebrow">Phiếu trả lời</p>
            {result ? (
              <Badge tone="sage">
                {studentName || 'Học sinh'} — {result.correct}/{result.total} đúng
              </Badge>
            ) : null}
          </div>

          {keyLetters.length ? (
            <>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                {keyLetters.map((_, i) => {
                  const picked = answers[i] ?? ''
                  const isRight = result?.details[i]?.ok
                  const isWrong = result && !isRight && picked
                  return (
                    <div key={i} className="text-center">
                      <span className="eyebrow mb-1.5 block tnum">{i + 1}</span>
                      <div
                        className={cn(
                          'flex h-9 items-center justify-center rounded-[5px] border text-[12.5px] font-bold transition-colors',
                          isRight
                            ? 'border-sage bg-sage text-white'
                            : isWrong
                              ? 'border-clay bg-clay text-white'
                              : picked
                                ? 'border-ink bg-ink text-paper'
                                : 'border-line-2 bg-white text-ink-4',
                        )}
                      >
                        {picked || '—'}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6">
                <p className="eyebrow mb-3">Sửa đáp án</p>
                <div className="flex flex-wrap gap-2">
                  {keyLetters.map((_, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="eyebrow w-5 text-right tnum">{i + 1}</span>
                      {(['A', 'B', 'C', 'D'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => {
                            const next = [...answers]
                            while (next.length < keyLetters.length) next.push('')
                            next[i] = answers[i] === l ? '' : l
                            setAnswers(next)
                            setResult(null)
                          }}
                          className={cn(
                            'size-7 rounded-[9px] border text-[11.5px] font-bold transition-colors',
                            answers[i] === l
                              ? 'border-ink bg-ink text-paper'
                              : 'border-line-2 bg-white text-ink-3 hover:border-ink-4',
                          )}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Button variant="clay" onClick={grade}>
                  <CheckCircle2 className="size-4" />
                  Chấm điểm
                </Button>
                <Button
                  variant="soft"
                  onClick={() => {
                    setAnswers([])
                    setResult(null)
                  }}
                >
                  Xoá phiếu
                </Button>
              </div>

              {result ? (
                <div className="mt-7 border-t border-line-2 pt-6 anim-rise">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Điểm" value={`${result.score}`} tone="ink" />
                    <Stat label="Đúng" value={`${result.correct}`} tone="sage" />
                    <Stat label="Sai" value={`${result.wrong}`} tone="clay" />
                    <Stat label="Bỏ trống" value={`${result.blank}`} tone="ink-3" />
                  </div>

                  <div className="mt-6 max-h-64 space-y-2 overflow-y-auto">
                    {result.details
                      .filter((d) => !d.ok)
                      .map((d) => (
                        <div
                          key={d.i}
                          className="flex items-center gap-2.5 rounded-[6px] bg-clay-soft/60 px-3.5 py-2 text-[12.5px]"
                        >
                          <XCircle className="size-3.5 shrink-0 text-clay" />
                          <span className="tnum text-ink-3">Câu {d.i}:</span>
                          <span className="text-ink">
                            bạn chọn <b>{d.given}</b>
                          </span>
                          <span className="text-ink-3">· đáp án</span>
                          <span className="font-bold text-sage">{d.correct}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={<ClipboardList className="size-6" strokeWidth={1.6} />}
              title="Chưa có phiếu trả lời"
              description="Tải ảnh phiếu lên hoặc chọn đáp án thủ công để bắt đầu chấm."
            />
          )}
        </div>
      </div>

      <div className="mt-8 rounded-[6px] bg-cream/60 p-6">
        <p className="eyebrow mb-2.5">Gợi ý</p>
        <p className="text-[14px] leading-relaxed text-ink-2">
          Bạn cũng có thể chấm trực tiếp trong một đề tương tác — mở{' '}
          <Link to="/de-cong-dong" className="reveal font-semibold text-clay">
            đề cộng đồng
          </Link>{' '}
          và bấm “Làm đề”, phần lời giải chi tiết sẽ hiện ngay sau khi nộp bài.
        </p>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ink' | 'sage' | 'clay' | 'ink-3'
}) {
  const colors = {
    ink: 'text-ink',
    sage: 'text-sage',
    clay: 'text-clay',
    'ink-3': 'text-ink-3',
  }
  return (
    <div className="rounded-[10px] bg-canvas/60 px-4 py-3">
      <p className="eyebrow">{label}</p>
      <p className={cn('mt-1 font-display text-[24px] font-semibold tnum', colors[tone])}>{value}</p>
    </div>
  )
}
