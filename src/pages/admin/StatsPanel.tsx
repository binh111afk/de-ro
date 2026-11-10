/** Admin giai đoạn 5: Số liệu. Xem docs/prompt-admin-stats.md. */
import { ChartColumn } from 'lucide-react'
import type { AdminMe } from '@/lib/adminApi'
import { ComingSoon } from './ComingSoon'

export function StatsPanel({ me: _me }: { me: AdminMe }) {
  return <ComingSoon title="Số liệu" description="Người dùng mới, người hoạt động, đề và slide được tạo, người đang online." icon={<ChartColumn className="size-6 text-ink-3" />} />
}
