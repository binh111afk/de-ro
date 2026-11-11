/**
 * Danh sách bảng vẽ của người dùng: tên, lúc sửa, nội dung (hình vẽ, khung nhìn, tuỳ chọn).
 * Lưu localStorage làm bản đệm và đồng bộ lên `user_items` (kind 'board') như đề và slide — xem lib/sync.ts.
 * Ảnh lớn trong bảng: trên máy là khoá `idb:` (IndexedDB), lúc đồng bộ được đẩy lên kho file thành đường dẫn `/api/files/…`.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** nội dung một bảng (định dạng `Saved` của BoardEditor) */
export type BoardData = { v: 2; elements: Array<Record<string, unknown>>; [k: string]: unknown }

export interface BoardItem {
  id: string
  title: string
  updatedAt: string
  data: BoardData
}

interface BoardsState {
  items: BoardItem[]
  /** ghi nội dung (tạo mới nếu chưa có) */
  save: (id: string, data: BoardData) => void
  rename: (id: string, title: string) => void
  remove: (id: string) => void
  replaceAll: (items: BoardItem[]) => void
}

export const defaultBoardTitle = () => `Bảng vẽ ${new Date().toLocaleDateString('vi-VN')}`

export const useBoards = create<BoardsState>()(
  persist(
    (set) => ({
      items: [],
      save: (id, data) =>
        set((s) => {
          const now = new Date().toISOString()
          const cur = s.items.find((b) => b.id === id)
          const next: BoardItem = cur ? { ...cur, data, updatedAt: now } : { id, title: defaultBoardTitle(), updatedAt: now, data }
          return { items: [next, ...s.items.filter((b) => b.id !== id)] }
        }),
      rename: (id, title) =>
        set((s) => ({ items: s.items.map((b) => (b.id === id ? { ...b, title, updatedAt: new Date().toISOString() } : b)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((b) => b.id !== id) })),
      replaceAll: (items) => set({ items }),
    }),
    {
      name: 'dethinhbien-boards',
      // bảng vẽ trước đây lưu riêng từng khoá `derou.board.<id>`: gom về danh sách (một lần), rồi xoá khoá cũ
      onRehydrateStorage: () => (state) => {
        if (!state) return
        try {
          const legacy = Object.keys(localStorage).filter((k) => k.startsWith('derou.board.'))
          if (!legacy.length) return
          const have = new Set(state.items.map((b) => b.id))
          const add: BoardItem[] = []
          for (const k of legacy) {
            const id = k.slice('derou.board.'.length)
            const data = JSON.parse(localStorage.getItem(k) ?? 'null') as BoardData | null
            if (!have.has(id) && data?.v === 2) add.push({ id, title: defaultBoardTitle(), updatedAt: new Date().toISOString(), data })
          }
          if (add.length) state.replaceAll([...add, ...state.items])
          for (const k of legacy) localStorage.removeItem(k)
        } catch {
          /* hết chỗ lưu / dữ liệu hỏng: để nguyên khoá cũ, lần sau thử lại */
        }
      },
    },
  ),
)
