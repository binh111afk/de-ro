import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button, EmptyState, Spinner } from '@/components/ui'
import { getCommunityDoc } from '@/lib/community'
import { docToExam } from '@/lib/docToExam'
import { useApp } from '@/store/app'

/** Link chia sẻ của đề đã đăng: tải đề từ cộng đồng rồi vào thẳng màn làm bài. */
export default function OnlineOpen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    getCommunityDoc(id)
      .then((doc) => {
        if (!alive) return
        const app = useApp.getState()
        const localId = app.importExam(docToExam(doc, id))
        app.startQuiz(localId)
        navigate(`/lam-de/${localId}`, { replace: true })
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : 'Không mở được đề, thử lại sau.'))
    return () => {
      alive = false
    }
  }, [id, navigate])

  if (error)
    return (
      <div className="mx-auto max-w-[700px] px-5 py-20">
        <EmptyState
          icon={<AlertCircle className="size-6" strokeWidth={1.6} />}
          title="Không mở được đề"
          description={error}
          action={
            <Link to="/de-cong-dong">
              <Button variant="primary">Xem đề cộng đồng</Button>
            </Link>
          }
        />
      </div>
    )

  return (
    <div className="flex items-center justify-center gap-3 px-5 py-32 text-[14px] text-ink-3">
      <Spinner />
      Đang mở đề…
    </div>
  )
}
