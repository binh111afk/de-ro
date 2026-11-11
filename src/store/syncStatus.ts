/** Trạng thái đồng bộ cần báo cho người dùng: máy chủ từ chối vì vượt giới hạn lưu trữ. */
import { create } from 'zustand'

interface SyncStatus {
  /** lời báo của máy chủ khi vượt mức (null = không vượt) */
  quota: string | null
  setQuota: (msg: string | null) => void
}

export const useSyncStatus = create<SyncStatus>((set) => ({
  quota: null,
  setQuota: (quota) => set({ quota }),
}))

/** lỗi giới hạn từ trigger `check_user_items_quota` có dạng "QUOTA:<lời báo>" */
export function quotaMessage(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err)
  const i = msg.indexOf('QUOTA:')
  return i >= 0 ? msg.slice(i + 6).trim() : null
}
