import { useEffect, useState, useMemo } from 'react'
import {
  Activity,
  Check,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  inputClass,
} from '@/components/ui'
import { Segmented } from '@/components/Segmented'
import { dialog } from '@/components/Dialog'
import {
  AdminError,
  getSettings,
  setMaintenance,
  runHealth,
  getAiStats,
  getAiErrors,
  type AppSettings,
  type HealthReport,
  type AiStatRow,
  type AiErrorRow,
  type AdminMe,
} from '@/lib/adminApi'
import { formatNumber, formatViDateTime, toDatetimeLocalString, toIsoString } from './adminUtils'
import { cn } from '@/lib/cn'
import { DbStatusCard } from './DbStatusCard'
import { Switch } from './Switch'
import { AnnouncementsEditor } from './AnnouncementsEditor'

interface OpsPanelProps {
  me?: AdminMe
}

/** Định dạng độ trễ: nếu >= 1000 ms thì đổi sang giây dạng "0,8 s", ngược lại "84 ms" */
function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || isNaN(ms)) return '—'
  if (ms >= 1000) {
    return (ms / 1000).toFixed(1).replace('.', ',') + ' s'
  }
  return `${Math.round(ms)} ms`
}

/** Giờ và phút HH:mm theo giờ Việt Nam (UTC+7) */
function formatViTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const vn = new Date(d.getTime() + 7 * 3600 * 1000)
  const hh = String(vn.getUTCHours()).padStart(2, '0')
  const min = String(vn.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

/** Định dạng tổng chi phí (USD) từ các dòng thống kê */
function computeCostDisplay(rows: AiStatRow[]): string {
  const withCost = rows.filter((r) => r.cost !== null && r.cost !== undefined)
  if (withCost.length === 0) return 'Chưa có giá'
  const total = withCost.reduce((sum, r) => sum + (r.cost ?? 0), 0)
  if (total === 0) return '$0.00'
  if (total < 0.01) return `$${total.toFixed(4)}`
  return `$${total.toFixed(2)}`
}

export function OpsPanel({ me: _me }: OpsPanelProps) {
  // Thông báo nhanh trên đầu trang
  const [notice, setNotice] = useState<string | null>(null)
  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }

  // 1. Cài đặt bảo trì & dải thông báo
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Bảo trì
  const [maintOn, setMaintOn] = useState(false)
  const [savedMaintOn, setSavedMaintOn] = useState(false)
  const [maintMessage, setMaintMessage] = useState('')
  const [maintUntil, setMaintUntil] = useState('')
  const [savingMaint, setSavingMaint] = useState(false)

  const [opsTab, setOpsTab] = useState<'maint' | 'notice'>('maint')

  // 2. Tình trạng server
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null)
  const [runningHealth, setRunningHealth] = useState(false)

  // 3. Thống kê AI
  const [statDays, setStatDays] = useState<'7' | '30'>('7')
  const [aiStatsRows, setAiStatsRows] = useState<AiStatRow[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  // 4. Lỗi gần đây
  const [aiErrors, setAiErrors] = useState<AiErrorRow[]>([])
  const [loadingErrors, setLoadingErrors] = useState(true)

  // Tải cài đặt ban đầu
  useEffect(() => {
    let alive = true
    setLoadingSettings(true)
    getSettings()
      .then((st) => {
        if (!alive) return
        setSettings(st)
        setMaintOn(!!st.maintenance.on)
        setSavedMaintOn(!!st.maintenance.on)
        setMaintMessage(st.maintenance.message ?? '')
        setMaintUntil(toDatetimeLocalString(st.maintenance.until))
      })
      .catch((err: unknown) => {
        if (!alive) return
        const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không tải được cài đặt hệ thống'
        void dialog.alert(msg, { title: 'Lỗi tải cài đặt' })
      })
      .finally(() => {
        if (alive) setLoadingSettings(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // Tải thống kê AI theo khoảng ngày
  useEffect(() => {
    let alive = true
    setLoadingStats(true)
    const days = statDays === '30' ? 30 : 7
    getAiStats(days)
      .then((res) => {
        if (!alive) return
        setAiStatsRows(res.rows)
      })
      .catch((err: unknown) => {
        if (!alive) return
        const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không tải được thống kê AI'
        void dialog.alert(msg, { title: 'Lỗi nạp thống kê AI' })
      })
      .finally(() => {
        if (alive) setLoadingStats(false)
      })
    return () => {
      alive = false
    }
  }, [statDays])

  // Tải danh sách lỗi gần đây
  const loadErrors = () => {
    setLoadingErrors(true)
    getAiErrors(30)
      .then((res) => {
        setAiErrors(res.items)
      })
      .catch((err: unknown) => {
        const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không tải được nhật ký lỗi AI'
        void dialog.alert(msg, { title: 'Lỗi nạp danh sách lỗi' })
      })
      .finally(() => {
        setLoadingErrors(false)
      })
  }

  useEffect(() => {
    loadErrors()
  }, [])

  // Thao tác bảo trì: Bật phải hỏi xác nhận
  const handleToggleMaintenance = async (nextOn: boolean) => {
    if (nextOn) {
      const ok = await dialog.confirm(
        'Người dùng thường sẽ không vào được app và không gọi được AI. Admin vẫn dùng bình thường.',
        {
          title: 'Xác nhận bật bảo trì',
          confirmLabel: 'Bật bảo trì',
          cancelLabel: 'Huỷ',
          danger: true,
        },
      )
      if (!ok) return
    }
    setMaintOn(nextOn)
  }

  // Lưu bảo trì
  const handleSaveMaintenance = async () => {
    try {
      setSavingMaint(true)
      await setMaintenance({
        on: maintOn,
        message: maintMessage.trim() || undefined,
        until: toIsoString(maintUntil),
      })
      setSavedMaintOn(maintOn)
      showNotice('Đã lưu cấu hình chế độ bảo trì.')
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không thể lưu chế độ bảo trì'
      await dialog.alert(msg, { title: 'Lỗi lưu bảo trì' })
    } finally {
      setSavingMaint(false)
    }
  }

  // Chạy kiểm tra server
  const handleRunHealth = async () => {
    try {
      setRunningHealth(true)
      const res = await runHealth()
      setHealthReport(res)
      showNotice('Đã hoàn tất kiểm tra tình trạng máy chủ.')
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Lỗi trong quá trình kiểm tra máy chủ'
      await dialog.alert(msg, { title: 'Lỗi kiểm tra máy chủ' })
    } finally {
      setRunningHealth(false)
    }
  }

  // Xử lý dữ liệu thống kê AI
  // 1. 4 ô số liệu tổng quan
  const totalCalls = useMemo(() => aiStatsRows.reduce((sum, r) => sum + r.calls, 0), [aiStatsRows])
  const totalErrors = useMemo(() => aiStatsRows.reduce((sum, r) => sum + r.errors, 0), [aiStatsRows])
  const totalTokens = useMemo(() => aiStatsRows.reduce((sum, r) => sum + r.tokens, 0), [aiStatsRows])
  const errorRateStr = useMemo(() => {
    if (totalCalls === 0) return '0%'
    const rate = (totalErrors / totalCalls) * 100
    return rate.toFixed(1).replace('.', ',') + '%'
  }, [totalCalls, totalErrors])
  const totalCostStr = useMemo(() => computeCostDisplay(aiStatsRows), [aiStatsRows])

  // 2. Dữ liệu biểu đồ cột theo ngày (gộp theo ngày, ngày cũ bên trái)
  const chartDays = useMemo(() => {
    const map = new Map<string, { day: string; calls: number; errors: number; success: number }>()
    for (const r of aiStatsRows) {
      const cur = map.get(r.day) ?? { day: r.day, calls: 0, errors: 0, success: 0 }
      cur.calls += r.calls
      cur.errors += r.errors
      cur.success += Math.max(0, r.calls - r.errors)
      map.set(r.day, cur)
    }
    // Sắp xếp ngày cũ bên trái, ngày mới bên phải
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day))
  }, [aiStatsRows])

  const maxDailyCalls = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => d.calls))
  }, [chartDays])

  // 3. Dữ liệu bảng theo model (gộp các ngày, xếp theo lượt gọi giảm dần)
  const modelStats = useMemo(() => {
    interface AggModel {
      model: string
      provider: string
      calls: number
      errors: number
      tokens: number
      cost: number | null
      hasCost: boolean
      totalMsCalls: number
    }
    const map = new Map<string, AggModel>()
    for (const r of aiStatsRows) {
      const key = `${r.provider}:::${r.model}`
      let cur = map.get(key)
      if (!cur) {
        cur = {
          model: r.model,
          provider: r.provider,
          calls: 0,
          errors: 0,
          tokens: 0,
          cost: null,
          hasCost: false,
          totalMsCalls: 0,
        }
        map.set(key, cur)
      }
      cur.calls += r.calls
      cur.errors += r.errors
      cur.tokens += r.tokens
      if (r.cost !== null && r.cost !== undefined) {
        cur.cost = (cur.cost ?? 0) + r.cost
        cur.hasCost = true
      }
      cur.totalMsCalls += r.avgMs * r.calls
    }

    const list = Array.from(map.values()).map((m) => ({
      model: m.model,
      provider: m.provider,
      calls: m.calls,
      errors: m.errors,
      tokens: m.tokens,
      cost: m.hasCost && m.cost !== null ? (m.cost < 0.01 && m.cost > 0 ? `$${m.cost.toFixed(4)}` : `$${m.cost.toFixed(2)}`) : '—',
      avgMs: m.calls > 0 ? Math.round(m.totalMsCalls / m.calls) : 0,
    }))

    // Xếp theo lượt gọi giảm dần
    return list.sort((a, b) => b.calls - a.calls)
  }, [aiStatsRows])

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">AI & Máy chủ</h1>
          <p className="text-[13.5px] text-ink-3">
            Vận hành hệ thống: chế độ bảo trì, thông báo chung, tình trạng máy chủ và thống kê AI.
          </p>
        </div>
      </div>

      {/* Thông báo thao tác ngắn */}
      {notice ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-[6px] bg-sage-soft px-4 py-2.5 text-[13px] font-medium text-sage shadow-xs"
        >
          <Check className="size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {/* =========================================================================
          KHỐI 1: BẢO TRÌ VÀ THÔNG BÁO
          ========================================================================= */}
      <Card className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[17px] font-bold text-ink">Bảo trì và thông báo</h2>
            {savedMaintOn || maintOn ? (
              <Badge tone="clay" className="text-[11px]">
                Đang bảo trì
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {loadingSettings ? <Spinner className="size-3.5 text-ink-3" /> : null}
            <Segmented<'maint' | 'notice'>
              value={opsTab}
              onChange={setOpsTab}
              label="Bảo trì hoặc thông báo"
              options={[
                { key: 'maint', label: 'Bảo trì' },
                { key: 'notice', label: 'Thông báo' },
              ]}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Mục: Chế độ bảo trì */}
          <div className={cn('space-y-4', opsTab !== 'maint' && 'hidden')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[14.5px] font-semibold text-ink">Chế độ bảo trì</h3>
                  {savedMaintOn || maintOn ? (
                    <Badge tone="clay" className="text-[11px]">
                      Đang bảo trì
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[12.5px] text-ink-3">
                  Khi bật, người dùng thường sẽ không vào được app và không gọi được AI. Admin vẫn dùng bình thường.
                </p>
              </div>
              <Switch
                id="switch-maintenance"
                checked={maintOn}
                onChange={handleToggleMaintenance}
                disabled={savingMaint || loadingSettings}
                label={maintOn ? 'Bật bảo trì' : 'Tắt bảo trì'}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="maint-message" className="text-[13px] font-medium text-ink">
                    Lời nhắn cho người dùng
                  </label>
                  <span className="text-[11.5px] text-ink-4">{maintMessage.length}/500 ký tự</span>
                </div>
                <textarea
                  id="maint-message"
                  value={maintMessage}
                  onChange={(e) => setMaintMessage(e.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={3}
                  placeholder="Ví dụ: Hệ thống đang nâng cấp tính năng mới. Xin vui lòng quay lại sau ít phút..."
                  className={cn(inputClass, 'w-full resize-y text-[13.5px]')}
                  disabled={savingMaint || loadingSettings}
                />
              </div>

              <div>
                <label htmlFor="maint-until" className="mb-1.5 block text-[13px] font-medium text-ink">
                  Dự kiến xong lúc
                </label>
                <input
                  id="maint-until"
                  type="datetime-local"
                  value={maintUntil}
                  onChange={(e) => setMaintUntil(e.target.value)}
                  className={cn(inputClass, 'w-full text-[13.5px]')}
                  disabled={savingMaint || loadingSettings}
                />
                <p className="mt-1.5 text-[11.5px] text-ink-4">Bỏ trống nếu chưa xác định thời gian xong.</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="clay"
                size="sm"
                onClick={handleSaveMaintenance}
                disabled={savingMaint || loadingSettings}
              >
                {savingMaint ? <Spinner className="size-3.5" /> : null}
                <span>Lưu chế độ bảo trì</span>
              </Button>
            </div>
          </div>

          {settings ? (
            <div className={cn(opsTab !== 'notice' && 'hidden')}>
              <AnnouncementsEditor initial={settings.announcements.items} onNotice={showNotice} />
            </div>
          ) : null}
        </div>
      </Card>

      {/* =========================================================================
          KHỐI 2: TÌNH TRẠNG SERVER
          ========================================================================= */}
      <Card className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-[17px] font-bold text-ink">Tình trạng server</h2>
            <p className="text-[12.5px] text-ink-3">
              Kiểm tra khả năng kết nối và đo độ trễ thực tế tới Supabase, Cloudflare R2 và các provider AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {healthReport?.checkedAt ? (
              <span className="text-[12.5px] font-medium text-ink-3">
                Kiểm tra lúc {formatViTime(healthReport.checkedAt)}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunHealth}
              disabled={runningHealth}
            >
              {runningHealth ? (
                <Spinner className="size-3.5" />
              ) : (
                <Activity className="size-3.5 text-clay" />
              )}
              <span>{runningHealth ? 'Đang kiểm tra…' : 'Kiểm tra ngay'}</span>
            </Button>
          </div>
        </div>

        <DbStatusCard />

        {/* Trạng thái đang kiểm tra */}
        {runningHealth ? (
          <div className="flex flex-col items-center justify-center rounded-[8px] bg-sunken/40 py-10 text-center">
            <Spinner className="size-6 text-clay" />
            <p className="mt-3 text-[14px] font-semibold text-ink">
              Đang gọi thử từng dịch vụ, có thể mất tới 30 giây…
            </p>
            <p className="mt-1 text-[12.5px] text-ink-3">
              Hệ thống đang gửi truy vấn kiểm tra tới Supabase, R2 và các nhà cung cấp AI.
            </p>
          </div>
        ) : !healthReport ? (
          /* Chưa kiểm tra: hiện dòng hướng dẫn */
          <div className="flex flex-col items-center justify-center rounded-[8px] bg-sunken/40 py-10 text-center">
            <Server className="size-8 text-ink-4" />
            <p className="mt-3 text-[14px] font-medium text-ink">Chưa có dữ liệu kiểm tra server</p>
            <p className="mt-1 max-w-[460px] text-[12.5px] text-ink-3">
              Bấm nút <strong className="text-ink">Kiểm tra ngay</strong> ở trên để gọi thử từng dịch vụ. Thao tác này tiêu hao một lượng nhỏ token và có thể mất tới ~30 giây.
            </p>
          </div>
        ) : (
          /* Kết quả kiểm tra */
          <div className="divide-y divide-line-2 rounded-[6px] border border-line">
            {/* 1. Supabase */}
            <div className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    healthReport.supabase.ok ? 'bg-sage' : 'bg-clay',
                  )}
                />
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-ink-3" />
                  <span className="text-[13.5px] font-semibold text-ink">Supabase</span>
                  <span className="text-[12px] text-ink-4">Cơ sở dữ liệu & Xác thực</span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {healthReport.supabase.error ? (
                  <span className="max-w-[200px] truncate font-mono text-[12px] text-clay sm:max-w-[320px]" title={healthReport.supabase.error}>
                    {healthReport.supabase.error}
                  </span>
                ) : null}
                <span className="tnum font-mono text-[12.5px] text-ink-2">
                  {formatLatency(healthReport.supabase.ms)}
                </span>
                <Badge tone={healthReport.supabase.ok ? 'sage' : 'clay'}>
                  {healthReport.supabase.ok ? 'Hoạt động' : 'Lỗi'}
                </Badge>
              </div>
            </div>

            {/* 2. Cloudflare R2 */}
            <div className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    healthReport.r2.ok ? 'bg-sage' : 'bg-clay',
                  )}
                />
                <div className="flex items-center gap-2">
                  <HardDrive className="size-4 text-ink-3" />
                  <span className="text-[13.5px] font-semibold text-ink">Cloudflare R2</span>
                  <span className="text-[12px] text-ink-4">Lưu trữ tệp & tài liệu</span>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {healthReport.r2.error ? (
                  <span className="max-w-[200px] truncate font-mono text-[12px] text-clay sm:max-w-[320px]" title={healthReport.r2.error}>
                    {healthReport.r2.error}
                  </span>
                ) : null}
                <span className="tnum font-mono text-[12.5px] text-ink-2">
                  {formatLatency(healthReport.r2.ms)}
                </span>
                <Badge tone={healthReport.r2.ok ? 'sage' : 'clay'}>
                  {healthReport.r2.ok ? 'Hoạt động' : 'Lỗi'}
                </Badge>
              </div>
            </div>

            {/* 3. Từng provider AI */}
            {healthReport.providers.map((p, idx) => (
              <div
                key={`${p.provider}-${p.model}-${idx}`}
                className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'size-2.5 shrink-0 rounded-full',
                      p.ok ? 'bg-sage' : 'bg-clay',
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Cpu className="size-4 text-ink-3" />
                    <span className="text-[13.5px] font-semibold text-ink">
                      {p.provider} <span className="font-normal text-ink-4">·</span> {p.model}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {p.error ? (
                    <span className="max-w-[200px] truncate font-mono text-[12px] text-clay sm:max-w-[320px]" title={p.error}>
                      {p.error}
                    </span>
                  ) : null}
                  <span className="tnum font-mono text-[12.5px] text-ink-2">
                    {formatLatency(p.ms)}
                  </span>
                  <Badge tone={p.ok ? 'sage' : 'clay'}>
                    {p.ok ? 'Hoạt động' : 'Lỗi'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* =========================================================================
          KHỐI 3: THỐNG KÊ AI
          ========================================================================= */}
      <Card className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-[17px] font-bold text-ink">Thống kê AI</h2>
            <p className="text-[12.5px] text-ink-3">
              Theo dõi lượt gọi API, tỉ lệ lỗi, lượng token tiêu thụ và chi phí ước tính.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Segmented<'7' | '30'>
              value={statDays}
              onChange={setStatDays}
              label="Khoảng thời gian thống kê"
              options={[
                { key: '7', label: '7 ngày' },
                { key: '30', label: '30 ngày' },
              ]}
            />
          </div>
        </div>

        {/* 4 ô số liệu trên cùng */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-[6px] border border-line bg-surface p-3.5 shadow-xs sm:p-4">
            <span className="text-[12px] font-medium text-ink-3">Tổng lượt gọi</span>
            <div className="mt-1">
              {loadingStats ? (
                <Spinner className="size-4 text-ink-3" />
              ) : (
                <span className="tnum text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(totalCalls)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[6px] border border-line bg-surface p-3.5 shadow-xs sm:p-4">
            <span className="text-[12px] font-medium text-ink-3">Tỉ lệ lỗi</span>
            <div className="mt-1">
              {loadingStats ? (
                <Spinner className="size-4 text-ink-3" />
              ) : (
                <span className="tnum text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {errorRateStr}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[6px] border border-line bg-surface p-3.5 shadow-xs sm:p-4">
            <span className="text-[12px] font-medium text-ink-3">Tổng token</span>
            <div className="mt-1">
              {loadingStats ? (
                <Spinner className="size-4 text-ink-3" />
              ) : (
                <span className="tnum text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(totalTokens)}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[6px] border border-line bg-surface p-3.5 shadow-xs sm:p-4">
            <span className="text-[12px] font-medium text-ink-3">Chi phí (USD)</span>
            <div className="mt-1">
              {loadingStats ? (
                <Spinner className="size-4 text-ink-3" />
              ) : (
                <span className="tnum text-[24px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {totalCostStr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Biểu đồ cột: lượt gọi theo ngày (cột chồng: thành công / lỗi) */}
        <div className="mb-6 rounded-[6px] border border-line bg-surface p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[13.5px] font-semibold text-ink">Lượt gọi theo ngày</h3>
              <p className="text-[11.5px] text-ink-4">Ngày cũ bên trái, ngày mới bên phải</p>
            </div>
            <div className="flex items-center gap-4 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-sage" />
                <span className="text-ink-3">Thành công</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-clay" />
                <span className="text-ink-3">Lỗi</span>
              </div>
            </div>
          </div>

          {loadingStats ? (
            <div className="flex h-44 items-center justify-center text-ink-3">
              <Spinner className="mr-2 size-4" />
              <span className="text-[13px]">Đang nạp dữ liệu biểu đồ…</span>
            </div>
          ) : chartDays.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-[13px] text-ink-4">
              Chưa có dữ liệu lượt gọi trong khoảng thời gian này.
            </div>
          ) : (
            <div className="w-full overflow-x-auto pb-2">
              <div className="flex h-48 min-w-[320px] items-end gap-1.5 border-b border-line px-1 pt-6 sm:gap-2.5">
                {chartDays.map((d) => {
                  const heightPercent = Math.max(4, Math.round((d.calls / maxDailyCalls) * 100))
                  const errPercent = d.calls > 0 ? (d.errors / d.calls) * 100 : 0
                  const succPercent = 100 - errPercent
                  // Định dạng nhãn ngày: dd/MM
                  const label = `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`

                  return (
                    <div
                      key={d.day}
                      className="group relative flex h-full flex-1 min-w-[16px] flex-col items-center justify-end"
                      title={`${d.day}: ${formatNumber(d.calls)} lượt (${formatNumber(d.success)} thành công, ${formatNumber(d.errors)} lỗi)`}
                    >
                      {/* Cột chồng thành công / lỗi */}
                      <div
                        className="flex w-full max-w-[32px] flex-col justify-end overflow-hidden rounded-t-[3px] bg-sunken/40 transition-all group-hover:brightness-95"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {d.errors > 0 ? (
                          <div
                            className="w-full bg-clay transition-all"
                            style={{ height: `${errPercent}%` }}
                          />
                        ) : null}
                        <div
                          className="w-full bg-sage transition-all"
                          style={{ height: `${succPercent}%` }}
                        />
                      </div>

                      {/* Nhãn ngày dd/MM */}
                      <span className="mt-2 select-none whitespace-nowrap text-[10.5px] font-medium text-ink-4 group-hover:text-ink">
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bảng theo model */}
        <div className="space-y-2">
          <h3 className="text-[13.5px] font-semibold text-ink">Thống kê chi tiết theo model</h3>
          <div className="w-full overflow-hidden rounded-[6px] border border-line">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                <thead className="border-b border-line bg-sunken/80 text-[11.5px] font-semibold uppercase tracking-wider text-ink-3">
                  <tr>
                    <th className="px-4 py-2.5">Model</th>
                    <th className="px-4 py-2.5">Provider</th>
                    <th className="px-4 py-2.5 text-right">Lượt gọi</th>
                    <th className="px-4 py-2.5 text-right">Lỗi</th>
                    <th className="px-4 py-2.5 text-right">Token</th>
                    <th className="px-4 py-2.5 text-right">Chi phí</th>
                    <th className="px-4 py-2.5 text-right">Độ trễ TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {loadingStats ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-ink-3">
                        <Spinner className="mr-2 size-4 text-ink-3" />
                        <span>Đang tải số liệu model…</span>
                      </td>
                    </tr>
                  ) : modelStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-ink-4">
                        Chưa có dữ liệu model nào.
                      </td>
                    </tr>
                  ) : (
                    modelStats.map((item) => (
                      <tr key={`${item.provider}-${item.model}`} className="transition-colors hover:bg-sunken/30">
                        <td className="px-4 py-2.5 font-medium text-ink">{item.model}</td>
                        <td className="px-4 py-2.5 text-ink-3">{item.provider}</td>
                        <td className="tnum px-4 py-2.5 text-right font-mono text-ink">
                          {formatNumber(item.calls)}
                        </td>
                        <td className="tnum px-4 py-2.5 text-right font-mono">
                          {item.errors > 0 ? (
                            <span className="font-semibold text-clay">{formatNumber(item.errors)}</span>
                          ) : (
                            <span className="text-ink-4">0</span>
                          )}
                        </td>
                        <td className="tnum px-4 py-2.5 text-right font-mono text-ink">
                          {formatNumber(item.tokens)}
                        </td>
                        <td className="tnum px-4 py-2.5 text-right font-mono text-ink">
                          {item.cost}
                        </td>
                        <td className="tnum px-4 py-2.5 text-right font-mono text-ink-2">
                          {formatLatency(item.avgMs)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* =========================================================================
          KHỐI 4: LỖI GẦN ĐÂY
          ========================================================================= */}
      <Card className="overflow-hidden border border-line p-5 shadow-soft sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-[17px] font-bold text-ink">Lỗi gần đây</h2>
            <p className="text-[12.5px] text-ink-3">
              Danh sách tối đa 30 lỗi gọi AI phát sinh gần nhất để theo dõi và xử lý sự cố.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadErrors}
            disabled={loadingErrors}
          >
            <RefreshCw className={cn('size-3.5', loadingErrors && 'animate-spin')} />
            <span>Làm mới</span>
          </Button>
        </div>

        {loadingErrors ? (
          <div className="py-12 text-center text-ink-3">
            <Spinner className="mr-2 size-4 text-ink-3" />
            <span className="text-[13px]">Đang tải danh sách lỗi…</span>
          </div>
        ) : aiErrors.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Check className="size-6 text-sage" />}
              title="Chưa có lỗi nào"
              description="Hệ thống không ghi nhận bất kỳ sự cố gọi AI nào trong các lượt gần nhất."
            />
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-[6px] border border-line">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                <thead className="border-b border-line bg-sunken/80 text-[11.5px] font-semibold uppercase tracking-wider text-ink-3">
                  <tr>
                    <th className="px-4 py-2.5">Thời gian</th>
                    <th className="px-4 py-2.5">Model</th>
                    <th className="px-4 py-2.5">Provider</th>
                    <th className="px-4 py-2.5">Lỗi</th>
                    <th className="px-4 py-2.5 text-right">Thời gian chờ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                  {aiErrors.map((err) => (
                    <tr key={err.id} className="transition-colors hover:bg-sunken/30">
                      <td className="tnum whitespace-nowrap px-4 py-2.5 font-mono text-[12px] text-ink-3">
                        {formatViDateTime(err.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-ink">
                        {err.model}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-3">
                        {err.provider}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="block max-w-[240px] truncate font-mono text-[12px] text-clay sm:max-w-[360px] md:max-w-[460px]"
                          title={err.error ?? ''}
                        >
                          {err.error || '—'}
                        </span>
                      </td>
                      <td className="tnum whitespace-nowrap px-4 py-2.5 text-right font-mono text-ink-2">
                        {formatLatency(err.ms)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default OpsPanel
