import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, FileText, FolderOpen, MoreHorizontal, MonitorPlay, Share2, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState } from '@/components/ui'
import { useApp } from '@/store/app'
import { totalPoints } from '@/data/types'
import { formatPoints } from '@/lib/math'
import { cn } from '@/lib/cn'

export default function MyExams() {
  const navigate = useNavigate()
  const myExams = useApp((s) => s.myExams)
  const duplicateExam = useApp((s) => s.duplicateExam)
  const deleteExam = useApp((s) => s.deleteExam)
  const toggleShared = useApp((s) => s.toggleShared)
  const setDraft = useApp((s) => s.setDraft)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (myExams.length === 0) {
    return (
      <div className="mx-auto max-w-[820px] px-5 py-20 sm:px-6">
        <EmptyState
          icon={<FolderOpen className="size-7" strokeWidth={1.4} />}
          title="Chưa có đề nào"
          description="Những đề bạn soạn hoặc lưu từ thư viện sẽ xuất hiện ở đây. Bạn có thể mở lại, làm thử, hoặc chia sẻ."
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link to="/soan-de">
                <Button variant="primary">Soạn đề mới</Button>
              </Link>
              <Link to="/de-cong-dong">
                <Button variant="outline">Lấy từ thư viện</Button>
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-6 lg:py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Của bạn</p>
          <h1 className="font-display text-[38px] font-semibold leading-[1.06] tracking-[-0.025em] text-ink sm:text-[48px]">
            Đề của tôi
          </h1>
          <p className="mt-3 text-[14.5px] text-ink-3">
            <span className="tnum font-bold text-ink">{myExams.length}</span> đề đang lưu trên thiết
            bị này.
          </p>
        </div>
        <Link to="/soan-de">
          <Button variant="primary">
            <FileText className="size-4" />
            Soạn đề mới
          </Button>
        </Link>
      </header>

      <div className="space-y-3">
        {myExams.map((exam) => {
          const nq = exam.sections.reduce((n, s) => n + s.questions.length, 0)
          const target = confirmDelete === exam.id
          return (
            <div
              key={exam.id}
              className="group relative flex flex-wrap items-center gap-4 rounded-[6px] bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(60,48,32,0.03)] transition-all duration-300 hover:shadow-lift"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[8px] bg-sunken text-ink-2">
                <FileText className="size-4.5" strokeWidth={1.7} />
              </span>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/de/${exam.id}`}
                  className="block truncate font-display text-[16.5px] font-semibold text-ink transition-colors hover:text-clay"
                >
                  {exam.title}
                </Link>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-ink-3">
                  <span>{exam.subject}</span>
                  <span className="text-ink-4">·</span>
                  <span>{exam.grade}</span>
                  <span className="text-ink-4">·</span>
                  <span className="tnum">{nq} câu</span>
                  <span className="text-ink-4">·</span>
                  <span className="tnum">{formatPoints(totalPoints(exam))}đ</span>
                  {exam.shared ? (
                    <Badge tone="sage" className="ml-1">
                      <Share2 className="size-2.5" />
                      Đang chia sẻ
                    </Badge>
                  ) : null}
                </p>
              </div>

              {target ? (
                <div className="flex items-center gap-1.5 anim-slide">
                  <span className="text-[12.5px] text-ink-3">Xoá đề này?</span>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      deleteExam(exam.id)
                      setConfirmDelete(null)
                    }}
                    className="text-clay hover:bg-clay-soft"
                  >
                    <Trash2 className="size-3.5" />
                    Xoá
                  </Button>
                  <Button variant="quiet" size="sm" onClick={() => setConfirmDelete(null)}>
                    Huỷ
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      setDraft(exam)
                      navigate('/soan-de')
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      setDraft(exam)
                      navigate('/soan-de')
                    }}
                    title="Mở trong trình soạn đề"
                  >
                    Mở
                  </Button>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuFor(menuFor === exam.id ? null : exam.id)}
                      className="flex size-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    {menuFor === exam.id ? (
                      <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-[10px] bg-surface py-1.5 shadow-float anim-slide">
                        <MenuItem
                          icon={<MonitorPlay className="size-3.5" />}
                          onClick={() => {
                            setMenuFor(null)
                            navigate(`/lam-de/${exam.id}`)
                          }}
                        >
                          Làm đề tương tác
                        </MenuItem>
                        <MenuItem
                          icon={<Copy className="size-3.5" />}
                          onClick={() => {
                            duplicateExam(exam.id)
                            setMenuFor(null)
                          }}
                        >
                          Nhân bản
                        </MenuItem>
                        <MenuItem
                          icon={<Share2 className="size-3.5" />}
                          onClick={() => {
                            toggleShared(exam.id)
                            setMenuFor(null)
                          }}
                        >
                          {exam.shared ? 'Huỷ chia sẻ' : 'Chia sẻ'}
                        </MenuItem>
                        <div className="my-1.5 h-px bg-line-2" />
                        <MenuItem
                          icon={<Trash2 className="size-3.5" />}
                          danger
                          onClick={() => {
                            setConfirmDelete(exam.id)
                            setMenuFor(null)
                          }}
                        >
                          Xoá đề
                        </MenuItem>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold transition-colors',
        danger ? 'text-clay hover:bg-clay-soft' : 'text-ink-2 hover:bg-sunken hover:text-ink',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
