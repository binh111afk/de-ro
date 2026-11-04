import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Cắt danh sách theo trang; `reset` đổi (bộ lọc, từ khoá…) thì quay về trang 1. */
export function usePaged<T>(list: T[], size = 12, reset?: unknown) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(list.length / size))
  useEffect(() => setPage(1), [reset])
  const cur = Math.min(page, pages)
  const go = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return { items: list.slice((cur - 1) * size, cur * size), page: cur, pages, go, offset: (cur - 1) * size }
}

/** 1 … 4 5 6 … 20 */
function numbers(page: number, pages: number): Array<number | '…'> {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))
  const out: Array<number | '…'> = []
  let prev = 0
  for (const n of [...set].sort((a, b) => a - b)) {
    if (n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

export function Pager({ page, pages, go }: { page: number; pages: number; go: (p: number) => void }) {
  if (pages <= 1) return null
  const btn = 'flex h-9 min-w-9 items-center justify-center rounded-[6px] px-2 text-[13.5px] transition-colors disabled:opacity-35'
  return (
    <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-1.5">
      <button type="button" className={cn(btn, 'text-ink-2 hover:bg-paper-2')} disabled={page === 1} onClick={() => go(page - 1)} aria-label="Trang trước">
        <ChevronLeft className="size-4" />
      </button>
      {numbers(page, pages).map((n, i) =>
        n === '…' ? (
          <span key={`e${i}`} className="px-1 text-ink-4">…</span>
        ) : (
          <button
            key={n}
            type="button"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => go(n)}
            className={cn(btn, n === page ? 'bg-ink font-semibold text-white' : 'text-ink-2 hover:bg-paper-2')}
          >
            {n}
          </button>
        ),
      )}
      <button type="button" className={cn(btn, 'text-ink-2 hover:bg-paper-2')} disabled={page === pages} onClick={() => go(page + 1)} aria-label="Trang sau">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
