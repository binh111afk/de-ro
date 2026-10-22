/**
 * Store cho trình soạn đề nhiều tab (kiểu GenOffice / VS Code).
 *
 * Mỗi tab là một tài liệu TipTap độc lập, kèm lịch sử undo/redo riêng.
 * Tài liệu đã lưu nằm ở `useDocStore().myDocs` — store này chỉ giữ phiên làm việc.
 */
import { create } from 'zustand'
import type { JSONContent } from '@tiptap/core'
import { useDocStore } from './docs'
import { blocksToTipTap, tipTapToBlocks } from '@/examEditor/convert'
import { emptyDoc, uid, type ExamDoc } from '@/data/docTypes'

export interface OpenTab {
  id: string
  title: string
  dirty: boolean
}

interface History {
  past: JSONContent[]
  future: JSONContent[]
}

export interface ComposeStore {
  tabs: OpenTab[]
  activeId: string | null
  /** nội dung TipTap hiện tại của từng tab */
  contents: Record<string, JSONContent>
  /** lịch sử undo/redo của từng tab */
  histories: Record<string, History>

  newDoc: () => string
  /** mở tab đầu tiên nếu chưa có — idempotent, an toàn với StrictMode */
  ensureDoc: () => string
  openDoc: (doc: ExamDoc) => string
  closeTab: (id: string) => void
  setActive: (id: string) => void
  renameTab: (id: string, title: string) => void
  setContent: (
    id: string,
    doc: JSONContent,
    opts?: { pushHistory?: boolean },
  ) => void
  undo: (id: string) => void
  redo: (id: string) => void
  saveDoc: (id: string) => void
  myDocs: () => ExamDoc[]
}

const emptyHistory = (): History => ({ past: [], future: [] })

export const useComposeStore = create<ComposeStore>()((set, get) => ({
  tabs: [],
  activeId: null,
  contents: {},
  histories: {},

  newDoc: () => {
    const doc = emptyDoc()
    const id = doc.id
    set((s) => ({
      tabs: [...s.tabs, { id, title: doc.title, dirty: false }],
      activeId: id,
      contents: { ...s.contents, [id]: { type: 'doc', content: [] } },
      histories: { ...s.histories, [id]: emptyHistory() },
    }))
    return id
  },

  /**
   * Bảo đảm có ít nhất một tab.
   *
   * Kiểm tra `get().tabs.length` tại thời điểm gọi (không đọc từ closure của
   * component) nên gọi hai lần liên tiếp — đúng tình huống StrictMode gọi effect
   * hai lần — chỉ tạo ra một tab. `newDoc` vẫn cố ý tạo tab mới mỗi lần gọi.
   */
  ensureDoc: () => {
    const s = get()
    if (s.tabs.length > 0) return s.activeId ?? s.tabs[0].id
    return s.newDoc()
  },

  openDoc: (doc) => {
    const existing = get().tabs.find((t) => t.id === doc.id)
    if (existing) {
      set({ activeId: doc.id })
      return doc.id
    }
    set((s) => ({
      tabs: [...s.tabs, { id: doc.id, title: doc.title, dirty: false }],
      activeId: doc.id,
      contents: { ...s.contents, [doc.id]: blocksToTipTap(doc.blocks) },
      histories: { ...s.histories, [doc.id]: emptyHistory() },
    }))
    return doc.id
  },

  closeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id)
      const { [id]: _removedContent, ...contents } = s.contents
      const { [id]: _removedHistory, ...histories } = s.histories
      const activeId =
        s.activeId === id ? (tabs[tabs.length - 1]?.id ?? null) : s.activeId
      return { tabs, contents, histories, activeId }
    }),

  setActive: (id) => set({ activeId: id }),

  renameTab: (id, title) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    })),

  setContent: (id, doc, opts) =>
    set((s) => {
      if (!s.contents[id]) return s
      const h = s.histories[id] ?? emptyHistory()
      const push = opts?.pushHistory !== false
      const prev = s.contents[id]
      return {
        contents: { ...s.contents, [id]: doc },
        histories: {
          ...s.histories,
          [id]: push
            ? { past: [...h.past, prev].slice(-100), future: [] }
            : h,
        },
        tabs: s.tabs.map((t) => (t.id === id && !t.dirty ? { ...t, dirty: true } : t)),
      }
    }),

  undo: (id) =>
    set((s) => {
      const h = s.histories[id]
      if (!h || h.past.length === 0) return s
      const prev = h.past[h.past.length - 1]
      return {
        contents: { ...s.contents, [id]: prev },
        histories: {
          ...s.histories,
          [id]: {
            past: h.past.slice(0, -1),
            future: [s.contents[id], ...h.future].slice(0, 100),
          },
        },
      }
    }),

  redo: (id) =>
    set((s) => {
      const h = s.histories[id]
      if (!h || h.future.length === 0) return s
      const next = h.future[0]
      return {
        contents: { ...s.contents, [id]: next },
        histories: {
          ...s.histories,
          [id]: {
            past: [...h.past, s.contents[id]].slice(-100),
            future: h.future.slice(1),
          },
        },
      }
    }),

  saveDoc: (id) => {
    const s = get()
    const content = s.contents[id]
    if (!content) return
    const tab = s.tabs.find((t) => t.id === id)
    const existing = s.myDocs().find((d) => d.id === id)
    const now = new Date().toISOString()
    const doc: ExamDoc = {
      ...(existing ?? emptyDoc({ id })),
      id,
      title: tab?.title ?? existing?.title ?? 'Đề thi mới',
      blocks: tipTapToBlocks(content),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    useDocStore.getState().saveDocById(doc)
    set((st) => ({
      tabs: st.tabs.map((t) => (t.id === id ? { ...t, dirty: false } : t)),
    }))
  },

  myDocs: () => useDocStore.getState().myDocs,
}))

/** id phục vụ việc tạo đề mới, đảm bảo không trùng. */
export function newDocId(): string {
  return uid()
}
