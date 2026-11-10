/** Admin giai đoạn 4: Ngân hàng. Xem docs/prompt-admin-bank.md. */
import { BookOpen } from 'lucide-react'
import type { AdminMe } from '@/lib/adminApi'
import { ComingSoon } from './ComingSoon'

export function BankPanel({ me: _me }: { me: AdminMe }) {
  return <ComingSoon title="Ngân hàng" description="Quản lý ngân hàng câu hỏi theo môn, lớp, chương và độ khó." icon={<BookOpen className="size-6 text-ink-3" />} />
}
