/**
 * Store cho tài liệu đề (doc-based) và bài giảng slide.
 * Tách khỏi store `app.ts` vốn gắn với model câu hỏi rời rạc dùng cho quiz/chấm bài.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamBlock, ExamDoc } from '@/data/docTypes'
import { emptyDoc, uid } from '@/data/docTypes'
import { DECK_THEMES } from '@/lib/slideTheme'

/* ------------------------------------------------------------------ *
 * Slide
 * ------------------------------------------------------------------ */
export type SlideElType = 'text' | 'shape' | 'image' | 'icon' | 'graphic' | 'table' | 'chart' | 'formula'

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
  /** bóng đổ mềm cho thẻ/panel (renderer web; PPTX bỏ qua) */
  shadow?: boolean
  /** bo góc ghi đè theme (px) */
  radius?: number
  /** viền ghi đè theme (px, màu lấy `borderColor`) */
  border?: number
  borderColor?: string
  src?: string
  /** icon semantic trong catalog slideAssets — optional để deck cũ không đổi */
  assetId?: string
  /** id đồ hoạ vector trong catalog slideGraphics (chặng 2) */
  graphicId?: string
  rows?: string[][]
  chart?: { type: 'bar' | 'line' | 'pie'; data: Array<{ label: string; value: number }> }
  /** kiểu chữ: tiêu đề to hơn, nội dung nhỏ hơn */
  variant?: 'title' | 'body'
  /** cỡ chữ tính bằng cqw (1% bề rộng khung slide) — ghi đè khi cần */
  fontSize?: number
  /** khoảng cách dòng (bội số cỡ chữ); mặc định 1.25 khi không có */
  lineHeight?: number
  /** khoảng cách chữ tính bằng em (vd. 0.12 cho nhãn in hoa) */
  letterSpacing?: number
  /** canh giữa dọc nội dung trong hộp (mặc định đỉnh hộp) */
  valign?: 'top' | 'middle'
  fontWeight?: number
  fontFamily?: string
  textColor?: string
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline'
  align?: 'left' | 'center' | 'right'
  zIndex?: number
  flipX?: boolean
  flipY?: boolean
  /** góc xoay (độ, quanh tâm) — deck cũ không có field này vẫn đọc được */
  rotation?: number
  /**
   * Hộp chữ đã được kéo cao/thấp thủ công. Mặc định (undefined) chiều cao bám
   * theo nội dung; xem `elementHeight` trong `lib/slideText.ts`.
   */
  fixedHeight?: boolean
}

export type SlideTone = 'theme' | 'soft' | 'accent'

export interface Slide {
  id: string
  background: string
  elements: SlideElement[]
  notes?: string
  transition?: 'none' | 'fade' | 'slide' | 'zoom'
  /** id layout đã dựng slide (lib/slideLayouts.ts); deck cũ không có vẫn đọc được */
  layout?: string
  /** tông nền do layout/AI chọn; thiếu thì theo mặc định của layout */
  tone?: SlideTone
  /** slide HTML (chế độ HTML): tài liệu HTML đầy đủ của riêng slide này; chỉ trình chiếu, không có elements */
  html?: string
}

export interface Deck {
  id: string
  title: string
  theme: DeckTheme
  slides: Slide[]
  /** phong cách AI đã chọn cho cả deck (từ dàn ý); chỉ để tái dùng khi sinh/sửa */
  style?: string
  /** 'html' = bài giảng HTML của AI: chỉ trình chiếu trên web, không sửa trong trình soạn, không xuất PPT */
  format?: 'html'
  createdAt: string
  updatedAt: string
}

export type ThemeDecor = 'none' | 'dots' | 'grid' | 'waves' | 'confetti' | 'grain' | 'glow' | 'frame'

export interface DeckFonts {
  heading: string
  body: string
  serif: string
  mono: string
}

/**
 * Theme slide. `bg/fg/accent/fontHeading/fontBody` là bộ token gốc mà mọi deck
 * (kể cả deck lưu trước chặng 21) đều có; các token sau là optional và được
 * `normalizeTheme` (lib/slideTheme.ts) điền khi thiếu.
 */
export interface DeckTheme {
  bg: string
  fg: string
  accent: string
  fontHeading: string
  fontBody: string
  id?: string
  name?: string
  tags?: string[]
  /** mô tả ngắn về cảm giác/tông — để AI chọn theme cho chủ đề bất kỳ */
  vibe?: string
  decor?: ThemeDecor
  dark?: boolean
  surface?: string
  muted?: string
  secondary?: string
  chart?: string[]
  fonts?: DeckFonts
  /** bo góc mặc định của thẻ/panel (px trên canvas 1280) */
  radius?: number
  /** kiểu bóng: soft (mềm), hard (khối lệch kiểu poster), none */
  shadow?: 'none' | 'soft' | 'hard'
  /** viền mặc định cho thẻ/panel (px) */
  border?: number
  borderColor?: string
}

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
  renameDeck: (id: string, title: string) => void
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

      renameDeck: (id, title) =>
        set((s) => ({
          myDecks: s.myDecks.map((d) => (d.id === id ? { ...d, title } : d)),
          deck: s.deck?.id === id ? { ...s.deck, title } : s.deck,
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
