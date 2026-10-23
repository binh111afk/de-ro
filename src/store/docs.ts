/**
 * Store cho tài liệu đề (doc-based) và bài giảng slide.
 * Tách khỏi store `app.ts` vốn gắn với model câu hỏi rời rạc dùng cho quiz/chấm bài.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamBlock, ExamDoc } from '@/data/docTypes'
import { emptyDoc, uid } from '@/data/docTypes'

/* ------------------------------------------------------------------ *
 * Slide
 * ------------------------------------------------------------------ */
export type SlideElType = 'text' | 'shape' | 'image' | 'table' | 'chart' | 'formula'

export interface SlideElement {
  id: string
  type: SlideElType
  x: number
  y: number
  w: number
  h: number
  text?: string
  shape?: 'rect' | 'round' | 'ellipse' | 'triangle' | 'arrow'
  fill?: string
  src?: string
  rows?: string[][]
  chart?: { type: 'bar' | 'line' | 'pie'; data: Array<{ label: string; value: number }> }
  /** kiểu chữ: tiêu đề to hơn, nội dung nhỏ hơn */
  variant?: 'title' | 'body'
  /** cỡ chữ tính bằng cqw (1% bề rộng khung slide) — ghi đè khi cần */
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  textColor?: string
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  align?: 'left' | 'center' | 'right'
  zIndex?: number
  flipX?: boolean
  flipY?: boolean
}

export interface Slide {
  id: string
  background: string
  elements: SlideElement[]
  notes?: string
  transition?: 'none' | 'fade' | 'slide' | 'zoom'
}

export interface Deck {
  id: string
  title: string
  theme: DeckTheme
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

export interface DeckTheme {
  bg: string
  fg: string
  accent: string
  fontHeading: string
  fontBody: string
}

export const DECK_THEMES: DeckTheme[] = [
  { bg: '#ffffff', fg: '#111827', accent: '#2563eb', fontHeading: 'Figtree', fontBody: 'Figtree' },
  { bg: '#0f172a', fg: '#f8fafc', accent: '#38bdf8', fontHeading: 'Figtree', fontBody: 'Figtree' },
  { bg: '#fdf6ec', fg: '#3f2d1c', accent: '#c05a3c', fontHeading: 'Fraunces', fontBody: 'Figtree' },
  { bg: '#f0fdf4', fg: '#14532d', accent: '#16a34a', fontHeading: 'Figtree', fontBody: 'Figtree' },
  { bg: '#fef2f2', fg: '#7f1d1d', accent: '#dc2626', fontHeading: 'Fraunces', fontBody: 'Figtree' },
  { bg: '#faf5ff', fg: '#4c1d95', accent: '#9333ea', fontHeading: 'Figtree', fontBody: 'Figtree' },
]

export function emptyDeck(title = 'Bài giảng mới'): Deck {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title,
    theme: DECK_THEMES[0],
    slides: [
      {
        id: uid(),
        background: DECK_THEMES[0].bg,
        elements: [
          {
            id: uid(),
            type: 'text',
            x: 8,
            y: 42,
            w: 84,
            h: 16,
            text: 'Tiêu đề bài giảng',
          },
        ],
        transition: 'none',
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

/* ------------------------------------------------------------------ *
 * State
 * ------------------------------------------------------------------ */
export interface DocStore {
  /** tài liệu đề đang mở trong trình soạn */
  doc: ExamDoc | null
  /** các đề đã lưu của người dùng */
  myDocs: ExamDoc[]
  /** bài giảng slide */
  myDecks: Deck[]
  deck: Deck | null

  openDoc: (doc: ExamDoc) => void
  newDoc: () => void
  updateDoc: (patch: Partial<ExamDoc>) => void
  updateBlock: (index: number, patch: Partial<ExamBlock>) => void
  replaceBlocks: (blocks: ExamBlock[]) => void
  insertBlock: (index: number, block: ExamBlock) => void
  removeBlock: (index: number) => void
  moveBlock: (index: number, dir: -1 | 1) => void
  saveDoc: () => void
  saveDocById: (doc: ExamDoc) => void
  renameDoc: (id: string, title: string) => void
  deleteDoc: (id: string) => void

  openDeck: (deck: Deck) => void
  newDeck: () => void
  updateDeck: (patch: Partial<Deck>) => void
  saveDeck: () => void
  /** lưu một deck theo id (dùng khi soạn slide trong tab) */
  saveDeckById: (deck: Deck) => void
  deleteDeck: (id: string) => void
}

export const useDocStore = create<DocStore>()(
  persist(
    (set) => ({
      doc: null,
      myDocs: [],
      myDecks: [],
      deck: null,

      openDoc: (doc) => set({ doc }),
      newDoc: () => set({ doc: emptyDoc() }),

      updateDoc: (patch) =>
        set((s) => (s.doc ? { doc: { ...s.doc, ...patch, updatedAt: new Date().toISOString() } } : s)),

      updateBlock: (index, patch) =>
        set((s) => {
          if (!s.doc) return s
          const blocks = s.doc.blocks.map((b, i) => (i === index ? ({ ...b, ...patch } as ExamBlock) : b))
          return { doc: { ...s.doc, blocks, updatedAt: new Date().toISOString() } }
        }),

      replaceBlocks: (blocks) =>
        set((s) =>
          s.doc
            ? { doc: { ...s.doc, blocks, updatedAt: new Date().toISOString() } }
            : s,
        ),

      insertBlock: (index, block) =>
        set((s) => {
          if (!s.doc) return s
          const blocks = [...s.doc.blocks]
          blocks.splice(index, 0, block)
          return { doc: { ...s.doc, blocks, updatedAt: new Date().toISOString() } }
        }),

      removeBlock: (index) =>
        set((s) => {
          if (!s.doc) return s
          const blocks = s.doc.blocks.filter((_, i) => i !== index)
          return { doc: { ...s.doc, blocks, updatedAt: new Date().toISOString() } }
        }),

      moveBlock: (index, dir) =>
        set((s) => {
          if (!s.doc) return s
          const blocks = [...s.doc.blocks]
          const target = index + dir
          if (target < 0 || target >= blocks.length) return s
          const [item] = blocks.splice(index, 1)
          blocks.splice(target, 0, item)
          return { doc: { ...s.doc, blocks, updatedAt: new Date().toISOString() } }
        }),

      saveDoc: () =>
        set((s) => {
          if (!s.doc) return s
          const exists = s.myDocs.some((d) => d.id === s.doc!.id)
          const myDocs = exists
            ? s.myDocs.map((d) => (d.id === s.doc!.id ? s.doc! : d))
            : [s.doc!, ...s.myDocs]
          return { myDocs }
        }),

      saveDocById: (doc) =>
        set((s) => {
          const exists = s.myDocs.some((d) => d.id === doc.id)
          const myDocs = exists
            ? s.myDocs.map((d) => (d.id === doc.id ? doc : d))
            : [doc, ...s.myDocs]
          return { myDocs }
        }),

      renameDoc: (id, title) =>
        set((s) => ({
          myDocs: s.myDocs.map((d) => (d.id === id ? { ...d, title } : d)),
          doc: s.doc?.id === id ? { ...s.doc, title } : s.doc,
        })),

      deleteDoc: (id) =>
        set((s) => ({
          myDocs: s.myDocs.filter((d) => d.id !== id),
          doc: s.doc?.id === id ? null : s.doc,
        })),

      openDeck: (deck) => set({ deck }),
      newDeck: () => set({ deck: emptyDeck() }),

      updateDeck: (patch) =>
        set((s) =>
          s.deck
            ? { deck: { ...s.deck, ...patch, updatedAt: new Date().toISOString() } }
            : s,
        ),

      saveDeck: () =>
        set((s) => {
          if (!s.deck) return s
          const exists = s.myDecks.some((d) => d.id === s.deck!.id)
          const myDecks = exists
            ? s.myDecks.map((d) => (d.id === s.deck!.id ? s.deck! : d))
            : [s.deck!, ...s.myDecks]
          return { myDecks }
        }),

      deleteDeck: (id) =>
        set((s) => ({
          myDecks: s.myDecks.filter((d) => d.id !== id),
          deck: s.deck?.id === id ? null : s.deck,
        })),

      saveDeckById: (deck) =>
        set((s) => ({
          myDecks: s.myDecks.some((d) => d.id === deck.id)
            ? s.myDecks.map((d) => (d.id === deck.id ? deck : d))
            : [deck, ...s.myDecks],
        })),
    }),
    {
      name: 'soandethi-docs',
      partialize: (s) => ({ myDocs: s.myDocs, myDecks: s.myDecks }),
    },
  ),
)

/* ------------------------------------------------------------------ *
 * Quota: 10 MB cho tài liệu đề (giống app gốc)
 * ------------------------------------------------------------------ */
export const STORAGE_QUOTA = 10 * 1024 * 1024

export function docSize(doc: ExamDoc): number {
  return new Blob([JSON.stringify(doc)]).size
}

export function totalDocSize(docs: ExamDoc[]): number {
  return docs.reduce((sum, d) => sum + docSize(d), 0)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export { getDocStoreSize }
function getDocStoreSize(): number {
  return totalDocSize(useDocStore.getState().myDocs)
}
