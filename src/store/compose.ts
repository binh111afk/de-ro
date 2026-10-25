/**
 * Store cho trình soạn đề nhiều tab (kiểu GenOffice / VS Code).
 *
 * Mỗi tab là một tài liệu TipTap độc lập; lịch sử hoàn tác nằm ở chính editor
 * (một sổ duy nhất, xem `Ribbon.tsx`), không nhân bản vào store.
 * Tài liệu đã lưu nằm ở `useDocStore().myDocs` — store này chỉ giữ phiên làm việc.
 */
import { create } from 'zustand'
import type { JSONContent } from '@tiptap/core'
import { useDocStore } from './docs'
import { blocksToTipTap, tipTapToBlocks } from '@/examEditor/convert'
import { emptyDoc, uid, type DocKind, type ExamDoc } from '@/data/docTypes'
import { emptyDeck, type Deck } from './docs'

export interface OpenTab {
  id: string
  title: string
  dirty: boolean
  /** loại tài liệu — quyết định icon trên tab */
  kind: DocKind
}

export interface ComposeStore {
  tabs: OpenTab[]
  activeId: string | null
  /** nội dung TipTap hiện tại của từng tab */
  contents: Record<string, JSONContent>

  newDoc: () => string
  /** mở tab đầu tiên nếu chưa có — idempotent, an toàn với StrictMode */
  ensureDoc: () => string
  openDoc: (doc: ExamDoc) => string
  /** tạo bài trình bày mới, mở thành tab slide */
  newSlide: () => string
  /** mở một bài trình bày đã lưu */
  openDeck: (deck: Deck) => string
  /** nội dung deck của các tab slide, theo id tab */
  decks: Record<string, Deck>
  /** cập nhật deck của một tab slide */
  updateDeck: (id: string, patch: Partial<Deck>) => void
  closeTab: (id: string) => void
  setActive: (id: string) => void
  renameTab: (id: string, title: string) => void
  /** đánh dấu tab đã lưu / chưa lưu */
  setTabDirty: (id: string, dirty: boolean) => void
  setContent: (id: string, doc: JSONContent) => void
  saveDoc: (id: string) => void
  /** lưu một tab bất kỳ (đề hoặc slide) vào kho tài liệu của Home */
  saveTab: (id: string) => void
  /** lưu toàn bộ tab đang mở — gọi khi đóng tab / rời trang / pagehide */
  saveAll: () => void
  myDocs: () => ExamDoc[]
}

export const useComposeStore = create<ComposeStore>()((set, get) => ({
  tabs: [],
  activeId: null,
  contents: {},
  decks: {},

  newDoc: () => {
    const doc = emptyDoc()
    const id = doc.id
    set((s) => ({
      tabs: [...s.tabs, { id, title: doc.title, dirty: false, kind: doc.kind ?? 'exam' }],
      activeId: id,
      contents: { ...s.contents, [id]: { type: 'doc', content: [] } },
    }))
    return id
  },

  newSlide: () => {
    const deck = emptyDeck()
    const id = deck.id
    set((s) => ({
      tabs: [...s.tabs, { id, title: deck.title, dirty: false, kind: 'slide' }],
      activeId: id,
      decks: { ...s.decks, [id]: deck },
    }))
    return id
  },

  openDeck: (deck) => {
    const existing = get().tabs.find((t) => t.id === deck.id)
    if (existing) {
      set({ activeId: deck.id })
      return deck.id
    }
    set((s) => ({
      tabs: [...s.tabs, { id: deck.id, title: deck.title, dirty: false, kind: 'slide' }],
      activeId: deck.id,
      decks: { ...s.decks, [deck.id]: deck },
    }))
    return deck.id
  },

  updateDeck: (id, patch) =>
    set((s) => {
      const deck = s.decks[id]
      if (!deck) return s
      return {
        decks: { ...s.decks, [id]: { ...deck, ...patch } },
        tabs: s.tabs.map((t) =>
          t.id === id
            ? {
                ...t,
                dirty: true,
                title: patch.title ?? t.title,
              }
            : t,
        ),
      }
    }),

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
      tabs: [...s.tabs, { id: doc.id, title: doc.title, dirty: false, kind: doc.kind ?? 'exam' }],
      activeId: doc.id,
      contents: { ...s.contents, [doc.id]: blocksToTipTap(doc.blocks) },
    }))
    return doc.id
  },

  closeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id)
      const { [id]: _removedContent, ...contents } = s.contents
      const { [id]: _removedDeck, ...decks } = s.decks
      const activeId =
        s.activeId === id ? (tabs[tabs.length - 1]?.id ?? null) : s.activeId
      return { tabs, contents, decks, activeId }
    }),

  setActive: (id) => set({ activeId: id }),

  renameTab: (id, title) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    })),

  setTabDirty: (id, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, dirty } : t)),
    })),

  setContent: (id, doc) =>
    set((s) => {
      if (!s.contents[id]) return s
      return {
        contents: { ...s.contents, [id]: doc },
        tabs: s.tabs.map((t) => (t.id === id && !t.dirty ? { ...t, dirty: true } : t)),
      }
    }),

  saveDoc: (id) => get().saveTab(id),

  saveTab: (id) => {
    const s = get()
    const tab = s.tabs.find((t) => t.id === id)
    if (!tab) return
    const now = new Date().toISOString()
    const store = useDocStore.getState()

    if (tab.kind === 'slide') {
      const deck = s.decks[id]
      if (!deck) return
      const exists = store.myDecks.some((d) => d.id === id)
      // tab chưa từng sửa và chưa có trong Home thì không tạo bản ghi rỗng
      if (!tab.dirty && !exists) return
      store.saveDeckById({ ...deck, title: tab.title, updatedAt: now })
    } else {
      const content = s.contents[id]
      if (!content) return
      const existing = store.myDocs.find((d) => d.id === id)
      if (!tab.dirty && !existing) return
      const doc: ExamDoc = {
        ...(existing ?? emptyDoc({ id })),
        id,
        title: tab.title,
        blocks: tipTapToBlocks(content),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      store.saveDocById(doc)
    }

    set((st) => ({
      tabs: st.tabs.map((t) => (t.id === id ? { ...t, dirty: false } : t)),
    }))
  },

  saveAll: () => {
    const s = get()
    for (const tab of s.tabs) s.saveTab(tab.id)
  },

  myDocs: () => useDocStore.getState().myDocs,
}))

/** id phục vụ việc tạo đề mới, đảm bảo không trùng. */
export function newDocId(): string {
  return uid()
}
