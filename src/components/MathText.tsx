import { useMemo } from 'react'
import { renderMath } from '@/lib/math'
import { cn } from '@/lib/cn'

/**
 * Renders text that may contain `$...$` / `$$...$$` LaTeX.
 */
export function MathText({
  children,
  className,
  as: As = 'span',
}: {
  children: string
  className?: string
  as?: 'span' | 'div' | 'p'
}) {
  const html = useMemo(() => renderMath(children), [children])
  return (
    <As
      className={cn(className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
