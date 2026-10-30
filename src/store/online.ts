import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultMeta, sortQuestions, type OnlineItem } from '@/lib/onlineExam'

interface OnlineState {
  /** lịch sử đề tạo online: bản đệm trên máy này, có tài khoản thì đồng bộ lên Supabase; mới sửa nhất trước; mọi thay đổi ghi ngay (đề dở tự lưu) */
  items: OnlineItem[]
  create: (init?: Partial<Pick<OnlineItem, 'meta' | 'questions' | 'settings' | 'sourceDocId'>>) => string
  update: (id: string, patch: Partial<Omit<OnlineItem, 'id'>>) => void
  remove: (id: string) => void
  /** thay cả danh sách (đồng bộ với tài khoản, `lib/syncOnline.ts`) */
  replaceAll: (items: OnlineItem[]) => void
}

export const useOnline = create<OnlineState>()(
  persist(
    (set) => ({
      items: [],

      create: (init = {}) => {
        const now = new Date().toISOString()
        const id = Math.random().toString(36).slice(2, 10)
        const item: OnlineItem = {
          id,
          status: 'draft',
          meta: init.meta ?? defaultMeta(),
          questions: sortQuestions(init.questions ?? []),
          settings: init.settings ?? {},
          sourceDocId: init.sourceDocId,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ items: [item, ...s.items] }))
        return id
      },

      update: (id, patch) =>
        set((s) => ({
          items: s.items
            .map((it) => (it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        })),

      remove: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      replaceAll: (items) => set({ items }),
    }),
    { name: 'dethinhbien-online' },
  ),
)
