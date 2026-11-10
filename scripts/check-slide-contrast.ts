// Kiểm chữ đọc được trên nền ngay dưới: 8 bộ thiết kế × mọi bộ màu, sau readableElements
// không còn khối chữ nào tương phản < 3:1. Chạy: npm run test:slide-contrast
import assert from 'node:assert/strict'
import { SLIDE_DESIGNS, buildDesignSlides } from '../src/lib/slideDesigns'
import { DECK_THEMES, themeById } from '../src/lib/slideTheme'
import { readableElements } from '../src/lib/slideContrast'

let changed = 0
let checked = 0
for (const d of SLIDE_DESIGNS) {
  for (const t of [themeById(d.themeId), ...DECK_THEMES.map((x) => themeById(x.id))]) {
    for (const s of buildDesignSlides(d, t)) {
      const fixed = readableElements(s, t)
      const again = readableElements({ ...s, elements: fixed }, t)
      assert.equal(again, fixed, `${d.id}/${t.id}: sau khi sửa vẫn còn chữ khó đọc`)
      s.elements.forEach((el, i) => {
        if (el.type !== 'text') return
        checked++
        if (fixed[i].textColor !== el.textColor) changed++
      })
    }
  }
}
console.log(`test-slide-contrast: ${checked} khối chữ, đổi màu ${changed}, không còn chữ < 3:1`)
