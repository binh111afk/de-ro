import { SLIDE_DESIGNS, buildDesignSlides } from '../src/lib/slideDesigns.ts'
import { isLayoutId } from '../src/lib/slideLayouts.ts'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'
import { DECOR_KITS } from '../src/lib/slideDecor.ts'
import { SLIDE_STYLE_PACKS } from '../src/lib/slideStyles.ts'

console.log('--- Kiểm tra 8 bộ thiết kế slide ---')

const themeIds = new Set(DECK_THEMES.map((t) => t.id))
const decorKitIds = new Set(DECOR_KITS.map((k) => k.id))
const stylePackIds = new Set(SLIDE_STYLE_PACKS.map((s) => s.id))

if (SLIDE_DESIGNS.length !== 8) {
  console.error(`❌ Cần đúng 8 bộ thiết kế, hiện có ${SLIDE_DESIGNS.length}`)
  process.exit(1)
}

let allPassed = true

for (const design of SLIDE_DESIGNS) {
  console.log(`\nKiểm tra bộ "${design.name}" (${design.id}):`)

  if (!themeIds.has(design.themeId)) {
    console.error(`  ❌ themeId "${design.themeId}" không tồn tại trong DECK_THEMES`)
    allPassed = false
  } else {
    console.log(`  ✅ themeId hợp lệ: ${design.themeId}`)
  }

  if (design.decorKit && !decorKitIds.has(design.decorKit)) {
    console.error(`  ❌ decorKit "${design.decorKit}" không tồn tại trong DECOR_KITS`)
    allPassed = false
  } else {
    console.log(`  ✅ decorKit hợp lệ: ${design.decorKit ?? 'none'}`)
  }

  if (design.stylePack && !stylePackIds.has(design.stylePack)) {
    console.error(`  ❌ stylePack "${design.stylePack}" không tồn tại trong SLIDE_STYLE_PACKS`)
    allPassed = false
  } else {
    console.log(`  ✅ stylePack hợp lệ: ${design.stylePack ?? 'none'}`)
  }

  const slideCount = design.slides.length
  if (slideCount < 6 || slideCount > 8) {
    console.error(`  ❌ Số lượng slide phải từ 6 đến 8, hiện có ${slideCount}`)
    allPassed = false
  } else {
    console.log(`  ✅ Số slide: ${slideCount} (nằm trong khoảng 6–8)`)
  }

  for (let i = 0; i < design.slides.length; i++) {
    const s = design.slides[i]
    if (!isLayoutId(s.layout)) {
      console.error(`  ❌ Slide ${i + 1}: layout "${s.layout}" không hợp lệ`)
      allPassed = false
    }
  }

  try {
    const builtSlides = buildDesignSlides(design)
    if (builtSlides.length !== slideCount) {
      console.error(`  ❌ buildDesignSlides trả về ${builtSlides.length} slide, kỳ vọng ${slideCount}`)
      allPassed = false
    }
    const emptyElements = builtSlides.filter((s) => !s.elements || s.elements.length === 0)
    if (emptyElements.length > 0) {
      console.error(`  ❌ Có ${emptyElements.length} slide không dựng được phần tử nào`)
      allPassed = false
    } else {
      console.log(`  ✅ buildDesignSlides dựng đủ ${builtSlides.length} slide thật, đều có phần tử`)
    }
  } catch (err) {
    console.error(`  ❌ Lỗi khi dựng slide:`, err)
    allPassed = false
  }
}

if (!allPassed) {
  console.error('\n❌ Có lỗi kiểm tra bộ thiết kế!')
  process.exit(1)
}

console.log('\n✅ Toàn bộ 8 bộ thiết kế đều đạt yêu cầu kiểm tra!')
