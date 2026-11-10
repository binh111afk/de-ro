import { useCallback, useEffect, useState } from 'react'
import {
  Ban,
  Check,
  Coins,
  Lock,
  Search,
  Trash2,
  Unlock,
  Users,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  inputClass,
} from '@/components/ui'
import { Pager } from '@/components/Pager'
import { Segmented } from '@/components/Segmented'
import { dialog } from '@/components/Dialog'
import {
  banUser,
  clearQuota,
  deleteUser,
  getQuota,
  grantCredits,
  listUsers,
  setQuota,
  unbanUser,
  type AdminMe,
  type AdminUser,
  type UserQuota,
  AdminError,
} from '@/lib/adminApi'
import { formatViDate, formatViDateTime, formatNumber, shortenId } from './adminUtils'

interface UsersPanelProps {
  me?: AdminMe
}

export function UsersPanel({ me: _me }: UsersPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const perPage = 20

  // Debounce tìm kiếm 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Tải danh sách người dùng
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listUsers({
        q: debouncedSearch.trim() || undefined,
        page,
        perPage,
      })
      setUsers(res.users)
      setTotal(res.total)
      // Cập nhật lại thông tin selectedUser nếu đang mở drawer
      if (selectedUser) {
        const updated = res.users.find((u) => u.id === selectedUser.id)
        if (updated) setSelectedUser(updated)
      }
    } catch (err: unknown) {
      console.error('Lỗi tải người dùng:', err)
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng'
      void dialog.alert(msg, { title: 'Lỗi nạp dữ liệu' })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, selectedUser])

  useEffect(() => {
    void loadUsers()
  }, [debouncedSearch, page])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      {/* Tiêu đề & thanh tìm kiếm */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-ink">Quản lý người dùng</h1>
          <p className="text-[13.5px] text-ink-3">
            Xem danh sách, quản lý hạn mức AI, phân quyền và khoá tài khoản ({total} người dùng).
          </p>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email hoặc tên…"
            className={`${inputClass} pl-9 pr-9 text-[13.5px]`}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-4 hover:bg-sunken hover:text-ink"
              aria-label="Xoá tìm kiếm"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Bảng người dùng */}
      <Card className="overflow-hidden border border-line shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-[13.5px]">
            <thead className="border-b border-line bg-sunken/80 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Email & Tên</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Đăng nhập gần nhất</th>
                <th className="px-4 py-3 text-right">Số đề</th>
                <th className="px-4 py-3 text-right">Số slide</th>
                <th className="px-4 py-3 text-right">Token tháng này</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Vai trò</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-ink-3">
                    <Spinner className="mr-2 text-ink-3" />
                    <span>Đang tải danh sách người dùng…</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      icon={<Users className="size-6 text-ink-4" />}
                      title="Không tìm thấy người dùng"
                      description={
                        search
                          ? `Không có tài khoản nào khớp với từ khoá "${search}".`
                          : 'Chưa có người dùng nào trên hệ thống.'
                      }
                      action={
                        search ? (
                          <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                            Xoá bộ lọc
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBanned = Boolean(u.bannedUntil && new Date(u.bannedUntil) > new Date())
                  const isSelected = selectedUser?.id === u.id

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`cursor-pointer transition-colors hover:bg-sunken/50 ${
                        isSelected ? 'bg-sunken/70' : ''
                      }`}
                    >
                      {/* Email + tên */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink hover:text-clay">
                            {u.email}
                          </span>
                          <span className="text-[12px] text-ink-3">
                            {u.name || 'Chưa đặt tên'}
                          </span>
                        </div>
                      </td>

                      {/* Ngày tạo */}
                      <td className="tnum whitespace-nowrap px-4 py-3 text-ink-2">
                        {formatViDate(u.createdAt)}
                      </td>

                      {/* Đăng nhập gần nhất */}
                      <td className="tnum whitespace-nowrap px-4 py-3 text-ink-2">
                        {u.lastSignInAt ? formatViDateTime(u.lastSignInAt) : 'Chưa từng'}
                      </td>

                      {/* Số đề */}
                      <td className="tnum whitespace-nowrap px-4 py-3 text-right font-medium text-ink-2">
                        {u.docs}
                      </td>

                      {/* Số slide */}
                      <td className="tnum whitespace-nowrap px-4 py-3 text-right font-medium text-ink-2">
                        {u.decks}
                      </td>

                      {/* Token tháng này */}
                      <td className="tnum whitespace-nowrap px-4 py-3 text-right font-medium text-ink">
                        {formatNumber(u.tokensThisMonth)}
                      </td>

                      {/* Trạng thái */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {isBanned ? (
                          <Badge tone="clay">Đang khoá</Badge>
                        ) : (
                          <Badge tone="sage">Bình thường</Badge>
                        )}
                      </td>

                      {/* Vai trò */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {u.role === 'admin' ? (
                          <Badge tone="clay">Admin</Badge>
                        ) : u.role === 'moderator' ? (
                          <Badge tone="neutral">Kiểm duyệt</Badge>
                        ) : (
                          <span className="text-[13px] text-ink-4">Người dùng</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 ? (
          <div className="border-t border-line px-4 py-3">
            <Pager page={page} pages={totalPages} go={(p) => setPage(p)} />
          </div>
        ) : null}
      </Card>

      {/* Ngăn kéo chi tiết người dùng bên phải */}
      {selectedUser ? (
        <UserDetailDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onReloadList={loadUsers}
          onUserUpdated={(updated) => setSelectedUser(updated)}
        />
      ) : null}
    </div>
  )
}

// -------------------------------------------------------------
// Drawer: Chi tiết người dùng
// -------------------------------------------------------------

interface UserDetailDrawerProps {
  user: AdminUser
  onClose: () => void
  onReloadList: () => Promise<void>
  onUserUpdated: (u: AdminUser) => void
}

const BAN_DURATIONS = [
  { key: '24', label: '1 ngày' },
  { key: '168', label: '7 ngày' },
  { key: '720', label: '30 ngày' },
  { key: 'inf', label: 'Vô thời hạn' },
] as const

function UserDetailDrawer({
  user,
  onClose,
  onReloadList,
  onUserUpdated,
}: UserDetailDrawerProps) {
  const [quota, setQuotaState] = useState<UserQuota | null>(null)
  const [quotaLoading, setQuotaLoading] = useState(true)
  const [quotaLimitInput, setQuotaLimitInput] = useState('')
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [quotaNote, setQuotaNote] = useState('')
  const [savingQuota, setSavingQuota] = useState(false)

  // Cộng điểm AI
  const [grantModalOpen, setGrantModalOpen] = useState(false)

  // Khoá tài khoản
  const [banDuration, setBanDuration] = useState<'24' | '168' | '720' | 'inf'>('24')
  const [banReason, setBanReason] = useState('')
  const [banning, setBanning] = useState(false)

  // Xoá tài khoản
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Thông báo nhanh trong drawer
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3500)
  }

  // Tải thông tin hạn mức
  const loadQuotaData = useCallback(async () => {
    setQuotaLoading(true)
    try {
      const q = await getQuota(user.id)
      setQuotaState(q)
      if (q.override) {
        if (q.override.monthlyTokens === null) {
          setIsUnlimited(true)
          setQuotaLimitInput('')
        } else {
          setIsUnlimited(false)
          setQuotaLimitInput(String(q.override.monthlyTokens))
        }
        setQuotaNote(q.override.note || '')
      } else {
        setIsUnlimited(false)
        setQuotaLimitInput(String(q.defaultLimit))
        setQuotaNote('')
      }
    } catch (err: unknown) {
      console.error('Lỗi tải hạn mức:', err)
    } finally {
      setQuotaLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    void loadQuotaData()
    setDeleteConfirmEmail('')
    setBanReason('')
  }, [loadQuotaData])

  // Lưu hạn mức mới
  const handleSaveQuota = async () => {
    setSavingQuota(true)
    try {
      const monthlyTokens = isUnlimited ? null : Number(quotaLimitInput)
      if (!isUnlimited && (isNaN(monthlyTokens as number) || (monthlyTokens as number) < 0)) {
        await dialog.alert('Vui lòng nhập hạn mức token hợp lệ (số lớn hơn hoặc bằng 0).')
        return
      }
      await setQuota(user.id, monthlyTokens, quotaNote.trim())
      showNotice('Đã cập nhật hạn mức AI thành công.')
      await loadQuotaData()
      await onReloadList()
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Có lỗi khi cập nhật hạn mức'
      await dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setSavingQuota(false)
    }
  }

  // Bỏ hạn mức riêng, về mặc định
  const handleClearQuota = async () => {
    setSavingQuota(true)
    try {
      await clearQuota(user.id)
      showNotice('Đã đưa hạn mức AI về mặc định.')
      await loadQuotaData()
      await onReloadList()
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Có lỗi khi đặt lại hạn mức'
      await dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setSavingQuota(false)
    }
  }

  // Khoá tài khoản
  const isBanned = Boolean(user.bannedUntil && new Date(user.bannedUntil) > new Date())

  const handleBan = async () => {
    const durationLabel = BAN_DURATIONS.find((d) => d.key === banDuration)?.label ?? ''
    const confirmed = await dialog.confirm(
      `Khoá tài khoản ${user.email} trong thời gian ${durationLabel}?`,
      {
        title: 'Xác nhận khoá tài khoản',
        danger: true,
        confirmLabel: 'Khoá tài khoản',
      },
    )
    if (!confirmed) return

    setBanning(true)
    try {
      const hours =
        banDuration === '24'
          ? 24
          : banDuration === '168'
          ? 168
          : banDuration === '720'
          ? 720
          : undefined
      await banUser(user.id, { reason: banReason.trim(), hours })
      showNotice('Đã khoá tài khoản.')
      // Cập nhật trạng thái người dùng
      const newBannedUntil = new Date(
        Date.now() + (hours ? hours * 3600e3 : 100 * 365 * 864e5),
      ).toISOString()
      onUserUpdated({ ...user, bannedUntil: newBannedUntil })
      await onReloadList()
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không thể khoá tài khoản'
      await dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setBanning(false)
    }
  }

  // Mở khoá tài khoản
  const handleUnban = async () => {
    const confirmed = await dialog.confirm(`Mở khoá tài khoản ${user.email}?`, {
      title: 'Mở khoá tài khoản',
      confirmLabel: 'Mở khoá',
    })
    if (!confirmed) return

    setBanning(true)
    try {
      await unbanUser(user.id)
      showNotice('Đã mở khoá tài khoản.')
      onUserUpdated({ ...user, bannedUntil: null })
      await onReloadList()
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không thể mở khoá tài khoản'
      await dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setBanning(false)
    }
  }

  // Xoá tài khoản
  const handleDeleteUser = async () => {
    if (deleteConfirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      return
    }
    const confirmed = await dialog.confirm(
      `Xoá vĩnh viễn tài khoản ${user.email}? Toàn bộ đề đã đồng bộ và tài liệu sẽ bị xoá vĩnh viễn và không thể hoàn tác!`,
      {
        title: 'Xác nhận xoá vĩnh viễn tài khoản',
        danger: true,
        confirmLabel: 'Xoá vĩnh viễn',
      },
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteUser(user.id, deleteConfirmEmail)
      await dialog.alert(`Đã xoá vĩnh viễn tài khoản ${user.email}.`, { title: 'Đã xoá' })
      onClose()
      await onReloadList()
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Không thể xoá tài khoản'
      await dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setDeleting(false)
    }
  }

  // Tiến độ hạn mức AI
  const limitValue = quota?.override
    ? quota.override.monthlyTokens
    : quota?.defaultLimit ?? 150_000
  const usedValue = quota?.usedThisMonth ?? user.tokensThisMonth
  const limitDisplay =
    limitValue === null ? 'Không giới hạn' : `${formatNumber(limitValue)} token`
  const pct =
    limitValue === null || limitValue <= 0
      ? 100
      : Math.min(100, Math.round((usedValue / limitValue) * 100))

  return (
    <>
      {/* Lớp nền mờ */}
      <div
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Ngăn kéo trượt từ phải sang */}
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-line bg-surface shadow-2xl transition-transform sm:w-[480px]"
        role="dialog"
        aria-label="Chi tiết người dùng"
      >
        {/* Header ngăn kéo */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-clay-tint font-semibold text-clay">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-bold text-ink">
                {user.name || 'Người dùng'}
              </h2>
              <p className="truncate text-[12.5px] text-ink-3">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-ink-3 hover:bg-sunken hover:text-ink"
            aria-label="Đóng ngăn"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Thông báo nhanh nếu có */}
        {notice ? (
          <div className="flex items-center gap-2 bg-sage-soft px-6 py-2.5 text-[13px] font-medium text-sage">
            <Check className="size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        ) : null}

        {/* Nội dung cuộn được */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-[13.5px]">
          {/* 1. Thông tin tài khoản */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
              Thông tin chung
            </h3>
            <div className="grid grid-cols-2 gap-3 rounded-[8px] border border-line-2 bg-sunken/40 p-4">
              <div>
                <span className="block text-[12px] text-ink-3">Mã định danh (ID)</span>
                <span className="font-mono text-[11.5px] text-ink-2" title={user.id}>
                  {shortenId(user.id)}…
                </span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Vai trò</span>
                <span className="font-medium text-ink">
                  {user.role === 'admin'
                    ? 'Quản trị viên'
                    : user.role === 'moderator'
                    ? 'Kiểm duyệt viên'
                    : 'Người dùng'}
                </span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Ngày tạo</span>
                <span className="font-medium text-ink">{formatViDateTime(user.createdAt)}</span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Đăng nhập gần nhất</span>
                <span className="font-medium text-ink">
                  {user.lastSignInAt ? formatViDateTime(user.lastSignInAt) : 'Chưa từng'}
                </span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Số đề đã soạn</span>
                <span className="tnum font-medium text-ink">{user.docs} đề</span>
              </div>
              <div>
                <span className="block text-[12px] text-ink-3">Số bài slide</span>
                <span className="tnum font-medium text-ink">{user.decks} slide</span>
              </div>
              <div className="col-span-2">
                <span className="block text-[12px] text-ink-3">Trạng thái</span>
                <div className="mt-1">
                  {isBanned ? (
                    <Badge tone="clay">Đang khoá đến {formatViDateTime(user.bannedUntil)}</Badge>
                  ) : (
                    <Badge tone="sage">Bình thường</Badge>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Hạn mức AI */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
                Hạn mức AI
              </h3>
              {quota?.override ? (
                <Badge tone="honey">Đang có hạn mức riêng</Badge>
              ) : null}
            </div>

            {quotaLoading ? (
              <div className="flex items-center justify-center py-6 text-ink-3">
                <Spinner className="mr-2" />
                <span>Đang tải hạn mức…</span>
              </div>
            ) : (
              <div className="space-y-4 rounded-[8px] border border-line-2 bg-sunken/40 p-4">
                {/* Thanh tiến độ */}
                <div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-2">Đã dùng tháng này:</span>
                    <span className="tnum font-semibold text-ink">
                      {formatNumber(usedValue)} / {limitDisplay}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sunken">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 90 ? 'bg-clay' : 'bg-sage'
                      }`}
                      style={{ width: `${limitValue === null ? 100 : pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11.5px] text-ink-3">
                    <span>{quota?.requestsThisMonth ?? 0} lượt yêu cầu</span>
                    <span>{limitValue === null ? 'Không giới hạn' : `${pct}%`}</span>
                  </div>
                </div>

                {/* Form chỉnh hạn mức */}
                <div className="space-y-3 border-t border-line-2 pt-3">
                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-ink-2">
                      Hạn mức tháng (token)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        disabled={isUnlimited}
                        value={isUnlimited ? '' : quotaLimitInput}
                        onChange={(e) => setQuotaLimitInput(e.target.value)}
                        placeholder={isUnlimited ? 'Không giới hạn' : 'Ví dụ: 300000'}
                        className={`${inputClass} flex-1 text-[13.5px]`}
                      />
                      <Button
                        type="button"
                        variant={isUnlimited ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setIsUnlimited(!isUnlimited)}
                      >
                        Không giới hạn
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-ink-2">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      value={quotaNote}
                      onChange={(e) => setQuotaNote(e.target.value)}
                      placeholder="Lý do điều chỉnh hạn mức…"
                      className={`${inputClass} text-[13.5px]`}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveQuota}
                      disabled={savingQuota}
                    >
                      {savingQuota ? 'Đang lưu…' : 'Lưu'}
                    </Button>
                    {quota?.override ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearQuota}
                        disabled={savingQuota}
                      >
                        Về mặc định
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 3. Cộng điểm AI */}
          <section className="space-y-3">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
              Cộng điểm AI
            </h3>
            <div className="flex items-center justify-between rounded-[8px] border border-line-2 bg-sunken/40 p-4">
              <div>
                <span className="block text-[12.5px] text-ink-3">Điểm cộng còn lại</span>
                <span className="tnum font-display text-[22px] font-bold text-ink">
                  {formatNumber(quota?.credits ?? 0)}
                  <span className="text-[13px] font-normal text-ink-3"> token</span>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGrantModalOpen(true)}
              >
                <Coins className="size-4" />
                <span>Cộng điểm</span>
              </Button>
            </div>
          </section>

          {/* 4. Khoá tài khoản (không hiện với admin) */}
          {user.role !== 'admin' ? (
            <section className="space-y-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-3">
                Khoá tài khoản
              </h3>
              <div className="space-y-3 rounded-[8px] border border-line-2 bg-sunken/40 p-4">
                {isBanned ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[13px] text-clay">
                      <Lock className="size-4" />
                      <span>
                        Tài khoản đang bị khoá đến: <strong>{formatViDateTime(user.bannedUntil)}</strong>
                      </span>
                    </div>
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={handleUnban}
                      disabled={banning}
                    >
                      <Unlock className="size-4" />
                      <span>{banning ? 'Đang mở khoá…' : 'Mở khoá tài khoản'}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2">
                        Thời hạn khoá
                      </span>
                      <Segmented
                        value={banDuration}
                        options={[...BAN_DURATIONS]}
                        onChange={(v) => setBanDuration(v as typeof banDuration)}
                        label="Thời hạn khoá"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12.5px] font-medium text-ink-2">
                        Lý do khoá
                      </label>
                      <input
                        type="text"
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Lý do vi phạm, gian lận…"
                        className={`${inputClass} text-[13.5px]`}
                      />
                    </div>
                    <Button
                      variant="clay"
                      size="sm"
                      onClick={handleBan}
                      disabled={banning}
                    >
                      <Ban className="size-4" />
                      <span>{banning ? 'Đang khoá…' : 'Khoá tài khoản'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* 5. Vùng đỏ: Xoá tài khoản (không hiện với admin) */}
          {user.role !== 'admin' ? (
            <section className="space-y-3 pt-2">
              <div className="rounded-[8px] border border-clay/30 bg-clay-soft/40 p-4">
                <div className="flex items-center gap-2 font-bold text-clay">
                  <Trash2 className="size-4.5" />
                  <span>Vùng nguy hiểm: Xoá tài khoản</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
                  Xoá vĩnh viễn tài khoản, đề đã đồng bộ và tài liệu của người này. Đề đã đăng lên
                  cộng đồng vẫn giữ lại. Không hoàn tác được.
                </p>

                <div className="mt-3">
                  <label className="mb-1 block text-[12px] font-medium text-ink-2">
                    Gõ lại email <strong className="text-ink">{user.email}</strong> để xác nhận:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    placeholder={user.email}
                    className={`${inputClass} text-[13px]`}
                  />
                </div>

                <div className="mt-3">
                  <Button
                    variant="clay"
                    size="sm"
                    disabled={
                      deleteConfirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase() ||
                      deleting
                    }
                    onClick={handleDeleteUser}
                  >
                    <Trash2 className="size-4" />
                    <span>{deleting ? 'Đang xoá…' : 'Xoá vĩnh viễn tài khoản'}</span>
                  </Button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </aside>

      {/* Modal cộng điểm AI */}
      {grantModalOpen ? (
        <GrantCreditsModal
          user={user}
          currentCredits={quota?.credits ?? 0}
          onClose={() => setGrantModalOpen(false)}
          onSuccess={async (newBalance) => {
            if (quota) setQuotaState({ ...quota, credits: newBalance })
            showNotice(`Đã cộng điểm thành công! Số dư mới: ${formatNumber(newBalance)} token.`)
            await onReloadList()
          }}
        />
      ) : null}
    </>
  )
}

// -------------------------------------------------------------
// Modal: Cộng điểm AI
// -------------------------------------------------------------

function GrantCreditsModal({
  user,
  currentCredits,
  onClose,
  onSuccess,
}: {
  user: AdminUser
  currentCredits: number
  onClose: () => void
  onSuccess: (newBalance: number) => Promise<void>
}) {
  const [tokensInput, setTokensInput] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultBalance, setResultBalance] = useState<number | null>(null)

  const numTokens = Number(tokensInput)
  const isValid = Number.isInteger(numTokens) && numTokens > 0 && numTokens <= 1e8

  const handleGrant = async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      const res = await grantCredits(user.id, numTokens, note.trim())
      setResultBalance(res.balance)
      await onSuccess(res.balance)
    } catch (err: unknown) {
      const msg = err instanceof AdminError || err instanceof Error ? err.message : 'Lỗi cộng điểm'
      await dialog.alert(msg, { title: 'Lỗi' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-[8px] border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-clay" />
            <h3 className="text-[17px] font-bold text-ink">Cộng điểm AI</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] p-1 text-ink-4 hover:bg-sunken hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-[13.5px]">
          <p className="text-ink-2">
            Cộng điểm token vào tài khoản <strong>{user.email}</strong>. Điểm được cộng dồn vào số dư
            và không bị mất khi sang tháng mới.
          </p>

          <div className="rounded-[6px] bg-sunken/60 p-3 text-[13px]">
            <span className="text-ink-3">Số dư điểm hiện có: </span>
            <strong className="text-ink">{formatNumber(currentCredits)} token</strong>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-ink-2">
              Số điểm cộng thêm (token)
            </label>
            <input
              type="number"
              min="1"
              step="1000"
              value={tokensInput}
              onChange={(e) => setTokensInput(e.target.value)}
              placeholder="Ví dụ: 50000"
              className={`${inputClass} text-[13.5px]`}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-medium text-ink-2">
              Ghi chú
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do cộng điểm (khuyến mại, hỗ trợ…)"
              className={`${inputClass} text-[13.5px]`}
            />
          </div>

          {resultBalance !== null ? (
            <div className="flex items-center gap-2 rounded-[6px] bg-sage-soft p-3 text-[13px] font-medium text-sage">
              <Check className="size-4 shrink-0" />
              <span>Đã cộng thành công! Số dư mới: {formatNumber(resultBalance)} token.</span>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            {resultBalance !== null ? 'Đóng' : 'Huỷ'}
          </Button>
          {resultBalance === null ? (
            <Button
              variant="primary"
              size="sm"
              disabled={!isValid || submitting}
              onClick={handleGrant}
            >
              {submitting ? 'Đang cộng…' : 'Cộng điểm'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default UsersPanel
