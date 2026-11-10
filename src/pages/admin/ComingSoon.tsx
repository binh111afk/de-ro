import { type ReactNode } from 'react'
import { Card, EmptyState } from '@/components/ui'
import { Sparkles } from 'lucide-react'

export function ComingSoon({
  title = 'Sắp có',
  description = 'Tính năng đang được phát triển ở giai đoạn tiếp theo.',
  icon,
}: {
  title?: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <Card className="p-6 sm:p-12">
      <EmptyState
        icon={icon ?? <Sparkles className="size-6 text-ink-3" />}
        title={title}
        description={description}
      />
    </Card>
  )
}
