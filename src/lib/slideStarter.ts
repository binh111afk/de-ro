import type { Deck } from '@/store/docs'
import { DECK_THEMES } from './slideTheme'

export const STARTER_TEXT = 'Tiêu đề bài giảng'

export function isStarterDeck(deck: Deck): boolean {
  if (deck.slides.length !== 1) return false
  const [slide] = deck.slides
  const [el] = slide.elements
  return !slide.layout && !slide.html && !slide.notes && !slide.customBg && !slide.bgImage &&
    slide.background === DECK_THEMES[0].bg && (!slide.transition || slide.transition === 'none') &&
    slide.elements.length === 1 && el.type === 'text' && el.text === STARTER_TEXT &&
    el.x === 8 && el.y === 42 && el.w === 84 && el.h === 16 && Object.keys(el).length === 7
}
