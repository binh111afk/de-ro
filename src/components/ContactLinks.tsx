import { Mail } from 'lucide-react'
import { CONTACT } from '@/lib/contact'
import { cn } from '@/lib/cn'

const SOCIAL = [
  { label: 'Zalo', tip: `Zalo: ${CONTACT.phone}`, href: CONTACT.zalo, src: '/brand/social/zalo.svg' },
  { label: 'Facebook', tip: 'Facebook', href: CONTACT.facebook, src: '/brand/social/facebook.svg' },
  { label: 'Threads', tip: 'Threads', href: CONTACT.threads, src: '/brand/social/threads.svg' },
]

/** Email + icon Zalo, Facebook, Threads. */
export function ContactLinks({ className, showEmail = true }: { className?: string; showEmail?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {showEmail && (
        <a href={`mailto:${CONTACT.email}`} className="mr-1 inline-flex items-center gap-1.5 font-medium text-ink-2 hover:text-clay hover:underline">
          <Mail className="size-4" />
          {CONTACT.email}
        </a>
      )}
      {SOCIAL.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.tip}
          data-tip={s.tip}
          className="block size-8 shrink-0 rounded-[8px] transition-transform hover:-translate-y-0.5"
        >
          <img src={s.src} alt="" width={32} height={32} className="size-8" />
        </a>
      ))}
    </div>
  )
}
