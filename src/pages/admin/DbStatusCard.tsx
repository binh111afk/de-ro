/** Thẻ "Primary Database" (giống dashboard Supabase): vùng, gói máy, CPU / ổ đĩa / RAM / số kết nối. Tự tải khi mở. */
import { useCallback, useEffect, useState } from 'react'
import { Database, RotateCw } from 'lucide-react'
import { clearAdminCache, getDbStatus, type DbStatus } from '@/lib/adminApi'
import { cn } from '@/lib/cn'

const REGION_LABEL: Record<string, string> = {
  'ap-southeast-1': 'Southeast Asia (Singapore)',
  'ap-southeast-2': 'Oceania (Sydney)',
  'ap-northeast-1': 'Northeast Asia (Tokyo)',
  'ap-northeast-2': 'Northeast Asia (Seoul)',
  'ap-south-1': 'South Asia (Mumbai)',
  'us-east-1': 'East US (North Virginia)',
  'us-west-1': 'West US (North California)',
  'eu-central-1': 'Central EU (Frankfurt)',
  'eu-west-1': 'West EU (Ireland)',
}

/** Cờ Singapore thu nhỏ (chỉ vẽ khi vùng là Singapore) */
function SgFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-5 w-[30px] shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" aria-label="Singapore">
      <rect width="30" height="10" fill="#ED2939" />
      <rect y="10" width="30" height="10" fill="#fff" />
      <circle cx="7" cy="5" r="3.4" fill="#fff" />
      <circle cx="8.3" cy="5" r="3.2" fill="#ED2939" />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (-90 + i * 72) * (Math.PI / 180)
        return <circle key={i} cx={11 + 1.9 * Math.cos(a)} cy={5 + 1.9 * Math.sin(a)} r="0.55" fill="#fff" />
      })}
    </svg>
  )
}

const tone = (v: number | null) => (v == null ? 'text-ink-3' : v >= 90 ? 'text-clay' : v >= 75 ? 'text-honey' : 'text-ink')
const fmtPct = (v: number | null) => (v == null ? '—' : `${Math.round(v)}%`)

export function DbStatusCard() {
  const [st, setSt] = useState<DbStatus | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback((fresh = false) => {
    if (fresh) clearAdminCache()
    setLoading(true)
    setErr(null)
    getDbStatus()
      .then(setSt)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : 'Không đọc được số đo.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => load(), [load])

  const conns = st?.connections != null ? `${st.connections}/${st.maxConnections ?? '?'}` : '—'
  const connPct = st?.connections != null && st.maxConnections ? (st.connections / st.maxConnections) * 100 : null

  return (
    <div className="mb-5 max-w-[420px] rounded-[10px] border border-line bg-surface shadow-xs">
      <div className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#3ecf8e] text-[#0b3d26]">
          <Database className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold text-ink">{st?.name ?? 'Primary Database'}</div>
          <div className="truncate text-[13px] text-ink-2">{st ? (REGION_LABEL[st.region] ?? st.region) : '…'}</div>
          <div className="text-[12.5px] text-ink-3">{st ? `${st.region} · ${st.compute}` : ' '}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {st?.region === 'ap-southeast-1' ? <SgFlag /> : null}
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            aria-label="Tải lại số đo"
            className="rounded p-1 text-ink-3 transition-colors hover:bg-sunken hover:text-ink disabled:opacity-40"
          >
            <RotateCw className={cn('size-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line px-4 py-2.5 text-[12.5px] text-ink-3 tnum">
        {err ? (
          <span className="text-clay">{err}</span>
        ) : (
          <>
            <span>
              CPU <b className={cn('font-semibold', tone(st?.cpu ?? null))}>{loading && !st ? '…' : fmtPct(st?.cpu ?? null)}</b>
            </span>
            <span aria-hidden>·</span>
            <span>
              Disk <b className={cn('font-semibold', tone(st?.disk ?? null))}>{loading && !st ? '…' : fmtPct(st?.disk ?? null)}</b>
            </span>
            <span aria-hidden>·</span>
            <span>
              RAM <b className={cn('font-semibold', tone(st?.ram ?? null))}>{loading && !st ? '…' : fmtPct(st?.ram ?? null)}</b>
            </span>
            <span aria-hidden>·</span>
            <span>
              <b className={cn('font-semibold', tone(connPct))}>{loading && !st ? '…' : conns}</b> conns
            </span>
          </>
        )}
      </div>
    </div>
  )
}
