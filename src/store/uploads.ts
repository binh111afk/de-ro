import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Ảnh người dùng đã tải lên cho slide (panel Tải lên). `src` là đường dẫn trên R2; danh sách đồng bộ theo tài khoản (`lib/sync.ts`). */
export interface Upload {
  id: string
  src: string
  /** tỉ lệ cao/rộng của ảnh gốc, để giữ đúng dáng khi chèn */
  ratio: number
  updatedAt: string
}

interface UploadsState {
  items: Upload[]
  add: (u: Omit<Upload, 'updatedAt'>) => void
  remove: (id: string) => void
  replaceAll: (items: Upload[]) => void
}

export const useUploads = create<UploadsState>()(
  persist(
    (set) => ({
      items: [],
      add: (u) => set((s) => ({ items: [{ ...u, updatedAt: new Date().toISOString() }, ...s.items] })),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      replaceAll: (items) => set({ items }),
    }),
    { name: 'dethinhbien-uploads' },
  ),
)
