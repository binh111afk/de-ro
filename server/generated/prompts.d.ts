// Kiểu cho server/generated/prompts.js (file sinh tự động từ src/lib/prompts/slideTasks.ts).
import type { SourceInput } from '../../src/lib/prompts/sources.js'

/** dàn ý deck (hình dạng đầy đủ: src/lib/aiDeck.ts `DeckPlan`); khai báo gọn để tsc của server không kéo cả mã client */
export interface DeckPlan {
  slides: Array<{ title: string; layout: string }>
  [key: string]: unknown
}
export const WEB_SEARCH_SYSTEM: string
export interface SlideChatInput extends SourceInput {
  variant: 'plan' | 'chat' | 'html'
  ask?: boolean
  contextSummary?: string
  webFound?: string
}
export interface BoardInput extends SourceInput {
  ops?: boolean
  contextSummary?: string
}
export function buildSlideChatSystem(i: SlideChatInput): string
export function buildBoardSystem(i: BoardInput): string
export function buildSlideBatchSystem(plan: DeckPlan, indices: number[], think?: boolean): string
export function buildSlidePageSystem(plan: DeckPlan, index: number, pro?: boolean): string
export function buildSlideEditSystem(context: string): string
export function buildSlidePreserveSystem(pro?: boolean, think?: boolean): string
