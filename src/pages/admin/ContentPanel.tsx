/** Admin giai đoạn 3: Nội dung. Xem docs/prompt-admin-content.md. */
import { FileText } from 'lucide-react'
import type { AdminMe } from '@/lib/adminApi'
import { ComingSoon } from './ComingSoon'

export function ContentPanel({ me: _me }: { me: AdminMe }) {
  return <ComingSoon title="Nội dung" description="Đề cộng đồng, báo cáo vi phạm, tài liệu tải lên và góp ý." icon={<FileText className="size-6 text-ink-3" />} />
}
