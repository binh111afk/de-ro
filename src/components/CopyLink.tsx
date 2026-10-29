import { useState } from 'react'
import { Check, Copy, Link2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'

/** Ô hiện link kèm nút chép. */
export function CopyLink({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <div className={cn('flex items-center gap-2 rounded-[6px] bg-sunken p-1.5 pl-3.5', className)}>
      <Link2 className="size-4 shrink-0 text-ink-3" />
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Link đề"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
      />
      <Button variant="soft" size="sm" onClick={copy} className="shrink-0 bg-white">
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? 'Đã chép' : 'Chép link'}
      </Button>
    </div>
  )
}
