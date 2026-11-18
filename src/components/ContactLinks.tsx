import { Facebook, Mail } from 'lucide-react'
import { CONTACT } from '@/lib/contact'
import { cn } from '@/lib/cn'

/** Email + icon Zalo, Facebook. Icon chưa có link thì hiện mờ. */
export function ContactLinks({ className, showEmail = true }: { className?: string; showEmail?: boolean }) {
  const icon = 'flex size-8 items-center justify-center rounded-full border border-line text-ink-2 transition-colors'
  const items = [
    { label: 'Zalo', href: CONTACT.zalo, node: <ZaloIcon /> },
    { label: 'Facebook', href: CONTACT.facebook, node: <Facebook className="size-4" /> },
  ]
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {showEmail && (
        <a href={`mailto:${CONTACT.email}`} className="mr-1 inline-flex items-center gap-1.5 font-medium text-ink-2 hover:text-clay hover:underline">
          <Mail className="size-4" />
          {CONTACT.email}
        </a>
      )}
      {items.map((it) =>
        it.href ? (
          <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer" aria-label={it.label} data-tip={it.label} className={cn(icon, 'hover:border-clay hover:text-clay')}>
            {it.node}
          </a>
        ) : (
          <span key={it.label} aria-label={it.label} data-tip={it.label} className={cn(icon, 'opacity-50')}>
            {it.node}
          </span>
        ),
      )}
    </div>
  )
}

function ZaloIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="currentColor" d="M12 2.5c-5.52 0-10 3.95-10 8.83 0 2.68 1.36 5.08 3.5 6.7l-.6 3.47 3.54-1.87c1.11.34 2.31.53 3.56.53 5.52 0 10-3.95 10-8.83S17.52 2.5 12 2.5Z" opacity=".18" />
      <text x="12" y="13.9" textAnchor="middle" fontSize="6.4" fontWeight="700" fontFamily="Arial, sans-serif" fill="currentColor">Zalo</text>
    </svg>
  )
}
