import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button, EmptyState, Field, inputClass, Spinner } from '@/components/ui'
import { SiteSelect } from '@/components/SiteSelect'
import { getStudentDoc } from '@/lib/community'
import { docToExam } from '@/lib/docToExam'
import { examGate, loadStudent, saveStudent, type StudentInfo } from '@/lib/attempts'
import { useApp } from '@/store/app'
import type { Exam } from '@/data/types'

/** Đánh dấu học sinh đã nhập thông tin cho đề này trong phiên, để `Quiz` gửi kèm khi nộp mà không hỏi lại. */
export const studentKey = (remoteId: string) => `dethinhbien-student-ok:${remoteId}`

/**
 * Link chia sẻ của đề đã đăng. Đề ở cộng đồng: vào thẳng màn làm bài.
 * Đề chỉ-link (cho học sinh): hỏi tên, lớp, số thứ tự trước; đề "chỉ làm một lần" mà máy này đã nộp thì chặn.
 */
export default function OnlineOpen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [done, setDone] = useState(false)

  const start = (e: Exam) => {
    const app = useApp.getState()
    const localId = app.importExam(e)
    app.startQuiz(localId)
    navigate(`/lam-de/${localId}`, { replace: true })
  }

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([getStudentDoc(id), examGate(id)])
      .then(([doc, gate]) => {
        if (!alive) return
        const e = docToExam(doc, id)
        if (gate.listed) return start(e)
        if (e.settings?.oneAttempt && gate.attempted) return setDone(true)
        setExam(e)
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Không mở được đề, thử lại sau.'))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error || done)
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          icon={done ? <CheckCircle2 className="size-6" strokeWidth={1.6} /> : <AlertCircle className="size-6" strokeWidth={1.6} />}
          title={done ? 'Em đã nộp bài đề này rồi' : 'Không mở được đề'}
          description={done ? 'Đề này chỉ cho làm một lần. Kết quả của em đã được gửi cho thầy cô.' : error!}
          action={
            <Link to="/">
              <Button variant="primary">Về trang chủ</Button>
            </Link>
          }
        />
      </div>
    )

  if (exam)
    return (
      <StudentForm
        exam={exam}
        onStart={(info) => {
          saveStudent(info)
          try {
            sessionStorage.setItem(studentKey(id!), '1')
          } catch {
            /* không đánh dấu được: Quiz sẽ hỏi tên khi nộp */
          }
          start(exam)
        }}
      />
    )

  return (
    <div className="flex items-center justify-center gap-3 px-5 py-32 text-[14px] text-ink-3">
      <Spinner />
      Đang mở đề…
    </div>
  )
}

function StudentForm({ exam, onStart }: { exam: Exam; onStart: (s: StudentInfo) => void }) {
  const roster = exam.settings?.roster ?? []
  const saved = loadStudent()
  const [name, setName] = useState(saved?.name ?? '')
  const [className, setClassName] = useState(saved?.className ?? '')
  const [seat, setSeat] = useState(saved?.seat ? String(saved.seat) : '')
  const [err, setErr] = useState<string | null>(null)
  // có danh sách lớp: chọn tên, số thứ tự lấy theo dòng
  const rosterIdx = roster.indexOf(name)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setErr('Em nhập họ tên nhé.')
    if (!className.trim()) return setErr('Em nhập lớp nhé.')
    const n = roster.length ? rosterIdx + 1 : Number(seat)
    if (seat && !roster.length && !(Number.isInteger(n) && n >= 1 && n <= 999)) return setErr('Số thứ tự là số từ 1 đến 999.')
    onStart({ name: name.trim(), className: className.trim(), seat: n > 0 ? n : undefined })
  }

  return (
    <div className="mx-auto max-w-[480px] px-5 py-14">
      <form onSubmit={submit} className="rounded-[8px] bg-surface p-7 shadow-[0_1px_2px_rgba(60,48,32,0.03)]">
        <p className="eyebrow mb-2">Trước khi làm bài</p>
        <h1 className="font-display text-[24px] font-semibold leading-snug text-ink">{exam.title}</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-3">Thầy cô sẽ xem điểm theo thông tin này. Máy sẽ nhớ cho lần sau.</p>
        {exam.settings?.oneAttempt ? <p className="mt-3 rounded-[6px] bg-honey-soft px-3 py-2 text-[12.5px] text-honey">Đề này chỉ được làm một lần.</p> : null}

        <div className="mt-6 space-y-4">
          <Field label="Họ và tên">
            {roster.length ? (
              <SiteSelect
                value={rosterIdx >= 0 ? name : ''}
                options={[{ value: '', label: 'Chọn tên của em' }, ...roster.map((r, i) => ({ value: r, label: `${i + 1}. ${r}` }))]}
                onChange={setName}
                label="Chọn tên"
                className="w-full"
              />
            ) : (
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
            )}
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Lớp">
              <input className={inputClass} value={className} onChange={(e) => setClassName(e.target.value)} maxLength={30} placeholder="10A1" />
            </Field>
            <Field label="Số thứ tự">
              {roster.length ? (
                <input className={inputClass} value={rosterIdx >= 0 ? rosterIdx + 1 : ''} readOnly tabIndex={-1} />
              ) : (
                <input className={inputClass} value={seat} onChange={(e) => setSeat(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Nếu trùng tên" />
              )}
            </Field>
          </div>
        </div>

        {err ? <p role="alert" className="mt-4 text-[13px] font-medium text-clay-deep">{err}</p> : null}
        <Button variant="clay" type="submit" className="mt-6 w-full">
          Bắt đầu làm bài
          <ArrowRight className="size-4" />
        </Button>
      </form>
    </div>
  )
}
