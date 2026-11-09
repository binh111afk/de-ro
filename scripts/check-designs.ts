import { SLIDE_DESIGNS, buildDesignSlides, designById, designCatalogText, resolveDesignId } from '../src/lib/slideDesigns.ts'
import { isLayoutId } from '../src/lib/slideLayouts.ts'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'
import { DECOR_KITS } from '../src/lib/slideDecor.ts'
import { SLIDE_STYLE_PACKS } from '../src/lib/slideStyles.ts'
import { applyEdits, looksLikeEdit, parseEditCommands } from '../src/lib/slideEdit.ts'
import { parseDeckPlan } from '../src/lib/aiDeck.ts'
import { emptyDeck } from '../src/store/docs.ts'

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

console.log('\n--- Kiểm tra AI & lệnh sửa thiết kế ---')

// 1. Catalog text
const catalog = designCatalogText()
for (const d of SLIDE_DESIGNS) {
  if (!catalog.includes(d.id)) {
    console.error(`  ❌ Catalog thiếu id "${d.id}"`)
    allPassed = false
  }
}
console.log('  ✅ designCatalogText liệt kê đủ 8 bộ thiết kế')

// 2. resolveDesignId & alias
const testAliases: Array<[string, string]> = [
  ['thanh-lich', 'thanh-lich'],
  ['Thanh lịch', 'thanh-lich'],
  ['thanh lich toi gian', 'thanh-lich'],
  ['mẫu bảng đen', 'bang-den'],
  ['kiểu tối giản', 'thanh-lich'],
  ['tiểu học', 'tre-trung'],
  ['vintage', 'co-dien'],
  ['hoạt hình', 'vui-nhon'],
  ['tin hoc', 'cong-nghe'],
  ['sinh thai', 'thien-nhien'],
  ['nghiem tuc', 'hoc-thuat'],
]
for (const [input, expected] of testAliases) {
  const actual = resolveDesignId(input)
  if (actual !== expected) {
    console.error(`  ❌ resolveDesignId("${input}") = "${actual}", kỳ vọng "${expected}"`)
    allPassed = false
  }
}
console.log('  ✅ resolveDesignId nhận diện chính xác các alias có/không dấu')

// 3. looksLikeEdit
const editPhrases = [
  'đổi bài này sang kiểu thiết kế Công nghệ',
  'áp dụng thiết kế bảng đen',
  'làm giống thiết kế Thanh lịch',
  'theo mẫu bảng đen',
]
for (const phrase of editPhrases) {
  if (!looksLikeEdit(phrase)) {
    console.error(`  ❌ looksLikeEdit không nhận diện câu: "${phrase}"`)
    allPassed = false
  }
}
console.log('  ✅ looksLikeEdit nhận diện đúng các câu lệnh thiết kế')

// 4. parseEditCommands
const editJson = '{"action":"edit","commands":[{"op":"apply_design","id":"bang-den"}]}'
const parsedCmds = parseEditCommands(editJson)
if (parsedCmds.ops.length !== 1 || parsedCmds.ops[0].op !== 'apply_design' || (parsedCmds.ops[0] as any).id !== 'bang-den') {
  console.error('  ❌ parseEditCommands không parse được apply_design:', parsedCmds)
  allPassed = false
} else {
  console.log('  ✅ parseEditCommands phân tích đúng lệnh apply_design')
}

// 5. applyEdits
const deck = emptyDeck('Bài kiểm tra')
const editRes = applyEdits(deck, [{ op: 'apply_design', id: 'bang-den' }])
if (!editRes.changed || editRes.deck.theme.id !== 'dem-xanh') {
  console.error('  ❌ applyEdits không đổi theme sang dem-xanh:', editRes.deck.theme.id)
  allPassed = false
} else {
  console.log('  ✅ applyEdits áp dụng đúng thiết kế bang-den (theme dem-xanh)')
}

// 6. parseDeckPlan
const planJson = '{"title":"Bài học","design":"thanh-lich","slides":[{"title":"Giới thiệu","layout":"title"}]}'
const plan = parseDeckPlan(planJson)
if (!plan || plan.design !== 'thanh-lich' || plan.theme !== 'sang' || plan.decorKit !== 'toi-gian') {
  console.error('  ❌ parseDeckPlan không suy được theme/decorKit từ design:', plan)
  allPassed = false
} else {
  console.log('  ✅ parseDeckPlan điền đúng theme/decorKit từ design')
}

if (!allPassed) {
  console.error('\n❌ Có lỗi kiểm tra bộ thiết kế!')
  process.exit(1)
}

console.log('\n✅ Toàn bộ 8 bộ thiết kế đều đạt yêu cầu kiểm tra!')
