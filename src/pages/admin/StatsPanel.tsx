/**
 * Admin giai đoạn 5: Số liệu (/admin/so-lieu).
 * Xem docs/prompt-admin-stats.md.
 */
import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Activity,
  ArrowUpRight,
  Calendar,
  Radio,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { Button, Card, Spinner } from '@/components/ui'
import { Segmented } from '@/components/Segmented'
import {
  getStatsOverview,
  getStatsOnline,
  type StatsOverview,
  type StatsOnline,
  type OnlineUser,
} from '@/lib/adminStatsApi'
import type { AdminMe } from '@/lib/adminApi'
import { formatNumber, shortenId } from './adminUtils'
import { Portal } from '@/components/Portal'
import { cn } from '@/lib/cn'

interface StatsPanelProps {
  me: AdminMe
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  if (isNaN(ms) || ms < 0) return 'Vừa xong'
  const secs = Math.floor(ms / 1000)
  if (secs < 30) return 'Vừa xong'
  if (secs < 60) return `${secs} giây trước`
  const mins = Math.floor(secs / 60)
  return `${mins} phút trước`
}

export function StatsPanel({ me: _me }: StatsPanelProps) {
  const [days, setDays] = useState<'7' | '30' | '90'>('7')
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [onlineData, setOnlineData] = useState<StatsOnline | null>(null)
  const [loadingOnline, setLoadingOnline] = useState(false)
  const [showOnlineModal, setShowOnlineModal] = useState(false)

  // Tải dữ liệu tổng quan theo khoảng ngày
  const loadOverview = useCallback(async (selectedDays: '7' | '30' | '90', isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const numDays = Number(selectedDays) as 7 | 30 | 90
      const data = await getStatsOverview(numDays)
      setStats(data)
    } catch {
      // Giữ dữ liệu cũ nếu lỗi
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Tải thông tin người dùng đang online
  const loadOnline = useCallback(async (showLoading = false) => {
    if (showLoading) setLoadingOnline(true)
    try {
      const data = await getStatsOnline()
      setOnlineData(data)
    } catch {
      // bỏ qua lỗi
    } finally {
      if (showLoading) setLoadingOnline(false)
    }
  }, [])

  // Khi chọn khoảng ngày khác: tải lại overview
  useEffect(() => {
    void loadOverview(days)
  }, [days, loadOverview])

  // Tải nhịp online ban đầu và tự động tải lại mỗi 60 giây khi trang mở
  useEffect(() => {
    void loadOnline()
    const timer = setInterval(() => {
      void loadOnline()
    }, 60_000)
    return () => clearInterval(timer)
  }, [loadOnline])

  // Xử lý mở modal danh sách online
  const handleOpenOnlineModal = () => {
    setShowOnlineModal(true)
    void loadOnline(true)
  }

  const chartDays = stats?.chartDays ?? []

  // Tổng số đăng ký mới trong khoảng đang chọn
  const newUsersInPeriod = useMemo(() => {
    return chartDays.reduce((acc, d) => acc + (d.newUsers || 0), 0)
  }, [chartDays])

  // Giá trị max để căn tỷ lệ biểu đồ 1 (đăng ký mới)
  const maxDailyNewUsers = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => d.newUsers || 0))
  }, [chartDays])

  // Giá trị max để căn tỷ lệ biểu đồ 2 (đề + slide)
  const maxDailyItems = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => (d.newDocs || 0) + (d.newDecks || 0)))
  }, [chartDays])

  // Tổng số đề và slide trong khoảng
  const totalItemsInPeriod = useMemo(() => {
    return chartDays.reduce((acc, d) => acc + (d.newDocs || 0) + (d.newDecks || 0), 0)
  }, [chartDays])

  // Danh sách email đang online
  const onlineUsers: OnlineUser[] = onlineData?.users ?? []
  const currentOnlineCount = onlineData?.onlineCount ?? stats?.onlineCount ?? 0

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      {/* Tiêu đề trang + bộ chọn khoảng thời gian */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Thống kê số liệu</h1>
          <p className="text-[13px] text-ink-3">
            Theo dõi người dùng mới, hoạt động tạo đề & slide và người đang online.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented<'7' | '30' | '90'>
            value={days}
            onChange={setDays}
            label="Khoảng thời gian thống kê"
            options={[
              { key: '7', label: '7 ngày' },
              { key: '30', label: '30 ngày' },
              { key: '90', label: '90 ngày' },
            ]}
          />

          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              void loadOverview(days, true)
              void loadOnline()
            }}
            disabled={loading || refreshing}
            title="Làm mới số liệu"
            aria-label="Làm mới số liệu"
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Hàng thẻ số liệu chính */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-lg:[&>*:nth-child(3)]:col-span-2 lg:grid-cols-6 lg:*:col-span-2 lg:[&>*:nth-child(n+4)]:col-span-3">
        {/* Thẻ 1: Tổng người dùng */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink-3">Tổng người dùng</span>
              <div className="flex size-8 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <Users className="size-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <div className="flex h-9 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(stats?.totalUsers)}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 border-t border-line-2 pt-2.5 text-[11.5px] text-ink-4">
            Toàn bộ tài khoản
          </p>
        </Card>

        {/* Thẻ 2: Đăng ký mới (trong khoảng) */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink-3">Đăng ký mới</span>
              <div className="flex size-8 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <UserPlus className="size-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <div className="flex h-9 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(newUsersInPeriod)}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 border-t border-line-2 pt-2.5 text-[11.5px] text-ink-4">
            Trong {days} ngày qua
          </p>
        </Card>

        {/* Thẻ 5: Đang online (bấm xem danh sách) */}
        <button
          type="button"
          onClick={handleOpenOnlineModal}
          className="group block w-full text-left rounded-[6px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
        >
          <Card className="flex h-full flex-col justify-between border border-line p-5 shadow-soft transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-50/20 group-active:scale-[0.99]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-ink">Đang online</span>
                </div>
                <div className="flex size-8 items-center justify-center rounded-[6px] bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <Radio className="size-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="tnum text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(currentOnlineCount)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line-2 pt-2.5 text-[11.5px] text-ink-4">
              <span className="truncate">Chỉ tính người đã đăng nhập</span>
              <ArrowUpRight className="size-3.5 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink" />
            </div>
          </Card>
        </button>

        {/* Thẻ 3: Hoạt động 7 ngày */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink-3">Hoạt động 7 ngày</span>
              <div className="flex size-8 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <div className="flex h-9 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(stats?.active7d)}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 border-t border-line-2 pt-2.5 text-[11.5px] text-ink-4">
            Đăng nhập hoặc có nhịp
          </p>
        </Card>

        {/* Thẻ 4: Hoạt động 30 ngày */}
        <Card className="flex flex-col justify-between border border-line p-5 shadow-soft transition-all hover:border-line-2">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink-3">Hoạt động 30 ngày</span>
              <div className="flex size-8 items-center justify-center rounded-[6px] bg-sunken text-ink-2">
                <Calendar className="size-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <div className="flex h-9 items-center">
                  <Spinner className="text-ink-3" />
                </div>
              ) : (
                <div className="tnum text-[26px] font-bold tracking-tight text-ink sm:text-[28px]">
                  {formatNumber(stats?.active30d)}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 border-t border-line-2 pt-2.5 text-[11.5px] text-ink-4">
            Đăng nhập hoặc có nhịp
          </p>
        </Card>
      </div>

      {/* Biểu đồ 1: Đăng ký mới theo ngày */}
      <div className="rounded-[6px] border border-line bg-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Đăng ký mới theo ngày</h3>
            <p className="text-[12px] text-ink-4">Ngày cũ bên trái, ngày mới bên phải</p>
          </div>
          <div className="text-[12px] text-ink-3">
            Tổng:{' '}
            <span className="font-semibold text-ink">{formatNumber(newUsersInPeriod)}</span> tài khoản
          </div>
        </div>

        {loading ? (
          <div className="flex h-44 items-center justify-center text-ink-3">
            <Spinner className="mr-2 size-4" />
            <span className="text-[13px]">Đang nạp dữ liệu biểu đồ…</span>
          </div>
        ) : chartDays.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-[13px] text-ink-4">
            Chưa có dữ liệu đăng ký trong khoảng thời gian này.
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-2 touch-pan-x">
            <div className="flex h-48 min-w-[320px] items-end gap-1 border-b border-line px-1 pt-6 sm:gap-2">
              {chartDays.map((d, idx) => {
                const heightPercent =
                  d.newUsers > 0
                    ? Math.max(6, Math.round((d.newUsers / maxDailyNewUsers) * 100))
                    : 2
                const label = `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`

                // Giảm bớt nhãn ngày khi hiển thị 30 hoặc 90 ngày để không bị chen chúc
                const showLabel =
                  days === '7' ||
                  (days === '30' && (idx % 3 === 0 || idx === chartDays.length - 1)) ||
                  (days === '90' && (idx % 7 === 0 || idx === chartDays.length - 1))

                return (
                  <div
                    key={d.day}
                    className="group relative flex h-full flex-1 min-w-[8px] flex-col items-center justify-end"
                    title={`${d.day}: ${formatNumber(d.newUsers)} người đăng ký mới`}
                  >
                    <div
                      className={cn(
                        'w-full max-w-[28px] rounded-t-[3px] transition-all group-hover:brightness-90',
                        d.newUsers > 0 ? 'bg-sage/80' : 'bg-sunken/60',
                      )}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span
                      className={cn(
                        'mt-2 select-none whitespace-nowrap text-[10px] font-medium transition-colors sm:text-[11px]',
                        showLabel ? 'text-ink-4 group-hover:text-ink' : 'opacity-0',
                      )}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Biểu đồ 2: Đề và bài giảng slide tạo mới theo ngày */}
      <div className="rounded-[6px] border border-line bg-surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">
              Đề và slide tạo mới theo ngày
            </h3>
            <p className="text-[12px] text-ink-4">Ngày cũ bên trái, ngày mới bên phải</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-sage" />
              <span className="text-ink-3">Đề thi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-clay" />
              <span className="text-ink-3">Bài giảng slide</span>
            </div>
            <div className="text-ink-4">
              Tổng:{' '}
              <span className="font-semibold text-ink">{formatNumber(totalItemsInPeriod)}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-44 items-center justify-center text-ink-3">
            <Spinner className="mr-2 size-4" />
            <span className="text-[13px]">Đang nạp dữ liệu biểu đồ…</span>
          </div>
        ) : chartDays.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-[13px] text-ink-4">
            Chưa có dữ liệu đề hoặc slide tạo trong khoảng thời gian này.
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-2 touch-pan-x">
            <div className="flex h-48 min-w-[320px] items-end gap-1 border-b border-line px-1 pt-6 sm:gap-2">
              {chartDays.map((d, idx) => {
                const total = (d.newDocs || 0) + (d.newDecks || 0)
                const heightPercent =
                  total > 0
                    ? Math.max(6, Math.round((total / maxDailyItems) * 100))
                    : 2
                const deckPercent = total > 0 ? ((d.newDecks || 0) / total) * 100 : 0
                const docPercent = 100 - deckPercent
                const label = `${d.day.slice(8, 10)}/${d.day.slice(5, 7)}`

                const showLabel =
                  days === '7' ||
                  (days === '30' && (idx % 3 === 0 || idx === chartDays.length - 1)) ||
                  (days === '90' && (idx % 7 === 0 || idx === chartDays.length - 1))

                return (
                  <div
                    key={d.day}
                    className="group relative flex h-full flex-1 min-w-[8px] flex-col items-center justify-end"
                    title={`${d.day}: ${formatNumber(d.newDocs)} đề thi, ${formatNumber(d.newDecks)} slide${d.newCommunityExams > 0 ? `, ${formatNumber(d.newCommunityExams)} đề cộng đồng` : ''}`}
                  >
                    <div
                      className={cn(
                        'flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t-[3px] transition-all group-hover:brightness-95',
                        total > 0 ? 'bg-sunken/40' : 'bg-sunken/60',
                      )}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {d.newDecks > 0 ? (
                        <div
                          className="w-full bg-clay transition-all"
                          style={{ height: `${deckPercent}%` }}
                        />
                      ) : null}
                      {d.newDocs > 0 ? (
                        <div
                          className="w-full bg-sage transition-all"
                          style={{ height: `${docPercent}%` }}
                        />
                      ) : null}
                    </div>

                    <span
                      className={cn(
                        'mt-2 select-none whitespace-nowrap text-[10px] font-medium transition-colors sm:text-[11px]',
                        showLabel ? 'text-ink-4 group-hover:text-ink' : 'opacity-0',
                      )}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <p className="mt-3 text-[12px] text-ink-4">
          * Đề tạo trước ngày bật thống kê không có ngày tạo nên không tính.
        </p>
      </div>

      {/* Modal danh sách người dùng đang online */}
      {showOnlineModal ? (
        <Portal>
        <div
          role="presentation"
          onClick={() => setShowOnlineModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="online-users-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[8px] border border-line bg-surface p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <h3 id="online-users-modal-title" className="text-[17px] font-bold text-ink">
                    Người dùng đang online ({formatNumber(currentOnlineCount)})
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-3">
                  Chỉ tính người đã đăng nhập (hoạt động trong 2 phút gần nhất)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowOnlineModal(false)}
                className="rounded-[6px] p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 max-h-[55vh] divide-y divide-line-2 overflow-y-auto">
              {loadingOnline ? (
                <div className="flex h-32 items-center justify-center text-ink-3">
                  <Spinner className="mr-2 size-4" />
                  <span className="text-[13px]">Đang tải danh sách…</span>
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-ink-3">
                  Hiện không có người dùng nào đang online.
                </div>
              ) : (
                onlineUsers.map((u, i) => (
                  <div
                    key={u.userId || i}
                    className="flex items-center justify-between gap-2 py-2.5 text-[13px]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold text-ink-3">
                        {u.email ? u.email[0].toUpperCase() : '?'}
                      </div>
                      <span className="truncate font-medium text-ink" title={u.email}>
                        {u.email || shortenId(u.userId)}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-ink-4">
                      {formatRelativeTime(u.lastSeen)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line-2 pt-4">
              <span className="text-[11.5px] text-ink-4">Tối đa 20 người dùng gần nhất</span>
              <Button variant="soft" size="sm" onClick={() => setShowOnlineModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
        </Portal>
      ) : null}
    </div>
  )
}
