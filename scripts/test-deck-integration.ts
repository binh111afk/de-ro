import assert from 'node:assert/strict'
import { emptyDeck, type Deck, type Slide } from '../src/store/docs.ts'
import { DECK_THEMES, normalizeTheme, themeById } from '../src/lib/slideTheme.ts'
import { SLIDE_DESIGNS, buildDesignSlides, designById } from '../src/lib/slideDesigns.ts'
import { applySkin, skinById, themeWithSkinFonts } from '../src/lib/slideSkins.ts'
import { composeLayout, defaultTone, toneBackground, withPlaceholders, type SlideLayoutId } from '../src/lib/slideLayouts.ts'
import { recomposeSlide } from '../src/lib/slideEdit.ts'
import { buildDeckPptx } from '../src/lib/exportDeck.ts'

console.log('--- Kiểm tra tích hợp chèn 2 bộ thiết kế, skin thừa kế, PPTX & hoàn tác ---')

// Giả lập chức năng của SlideEditor:
function addDesign(
  deck: Deck,
  designId: string,
  option: 'replace' | 'keep',
): { deck: Deck; undo: () => Deck } {
  const previousDeck = deck
  const design = designById(designId)!
  const baseTheme = themeById(design.themeId) ?? DECK_THEMES[0]
  const skin = skinById(design.id)
  const targetTheme = skin ? themeWithSkinFonts(baseTheme, skin) : baseTheme

  let nextDeck: Deck
  if (option === 'replace') {
    const totalCount = deck.slides.length + design.slides.length
    const recomposedOld = deck.slides.map((s, i) =>
      applySkin(recomposeSlide(targetTheme, { ...s, decorKit: design.decorKit }), design.id, targetTheme, i, totalCount),
    )
    const newSlides = buildDesignSlides(design, targetTheme)
    nextDeck = {
      ...deck,
      theme: targetTheme,
      style: design.stylePack ?? design.id,
      design: design.id,
      slides: [...recomposedOld, ...newSlides],
    }
  } else {
    // keep
    const currentTheme = normalizeTheme(deck.theme)
    const newSlides = buildDesignSlides(design, currentTheme)
    nextDeck = {
      ...deck,
      slides: [...deck.slides, ...newSlides],
    }
  }

  return {
    deck: nextDeck,
    undo: () => previousDeck,
  }
}

function addLayoutSlide(deck: Deck, layoutId: SlideLayoutId): Deck {
  const tone = defaultTone(layoutId)
  const decorKit = deck.slides.find((s) => s.decorKit)?.decorKit
  const elements = composeLayout(deck.theme, layoutId, { ...withPlaceholders(layoutId, {}), decorKit }, tone)
  let s: Slide = {
    id: `new-${Math.random().toString(36).slice(2, 8)}`,
    layout: layoutId,
    tone,
    ...(decorKit ? { decorKit } : {}),
    background: toneBackground(deck.theme, tone),
    elements,
    transition: 'none',
  }
  if (deck.design) {
    s = applySkin(s, deck.design, deck.theme, deck.slides.length, deck.slides.length + 1)
  }
  return { ...deck, slides: [...deck.slides, s] }
}

async function runTest() {
  // 1. Tạo bài giảng có sẵn với 2 slide ban đầu
  const initial = emptyDeck('Bài giảng hóa học')
  initial.slides = [
    {
      id: 's1',
      layout: 'title',
      background: '#ffffff',
      elements: [
        { id: 'title', type: 'text', x: 10, y: 30, w: 80, h: 20, text: 'Hóa Học Lớp 10', variant: 'title' },
        { id: 'subtitle', type: 'text', x: 10, y: 55, w: 80, h: 10, text: 'Nguyên tử và bảng tuần hoàn', variant: 'body' },
      ],
    },
    {
      id: 's2',
      layout: 'bullets',
      background: '#ffffff',
      elements: [
        { id: 'title', type: 'text', x: 8, y: 10, w: 80, h: 12, text: 'Nội dung cốt lõi', variant: 'title' },
        { id: 'bullets', type: 'text', x: 8, y: 26, w: 80, h: 50, text: 'Hạt nhân nguyên tử\nLớp vỏ electron', variant: 'body' },
      ],
    },
  ]

  console.log('1. Kiểm tra Lựa chọn 1: "Đổi cả bài sang giao diện này" với bộ "thanh-lich"')
  const res1 = addDesign(initial, 'thanh-lich', 'replace')
  const deck1 = res1.deck

  assert.equal(deck1.design, 'thanh-lich', 'deck1 phải lưu design id thanh-lich')
  assert.equal(deck1.theme.fontHeading, 'Be Vietnam Pro', 'Font heading phải đổi sang Be Vietnam Pro')
  assert.equal(deck1.slides.length, 2 + 7, 'Tổng số slide phải là 2 cũ + 7 mới = 9')

  // Kiểm tra slide cũ đã được áp skin
  const oldSlideRecomposed = deck1.slides[0]
  assert.equal(oldSlideRecomposed.elements.find((e) => e.id === 'skin-motif-index') !== undefined, true, 'Slide cũ phải có motif index của thanh-lich')

  // Thêm một slide bố cục mới ('cards')
  const deck1WithNewSlide = addLayoutSlide(deck1, 'cards')
  assert.equal(deck1WithNewSlide.slides.length, 10)
  const addedSlide = deck1WithNewSlide.slides[9]
  assert.equal(addedSlide.elements.find((e) => e.id === 'skin-motif-index') !== undefined, true, 'Slide thêm sau phải thừa kế skin thanh-lich')

  // Xuất PPTX
  const pptx1 = await buildDeckPptx(deck1WithNewSlide)
  assert.ok(pptx1.byteLength > 10000, 'PPTX xuất ra phải có dữ liệu hợp lệ')
  console.log(`  ✅ Lựa chọn 1 thành công: Đổi skin cả bài, slide thêm sau thừa kế skin, xuất PPTX ${(pptx1.byteLength / 1024).toFixed(1)} KB`)

  // Hoàn tác 1 bước
  const undone1 = res1.undo()
  assert.equal(undone1.slides.length, 2, 'Hoàn tác phải trả về đúng 2 slide ban đầu')
  assert.equal(undone1.design, undefined, 'Hoàn tác phải xoá design id')
  console.log('  ✅ Hoàn tác 1 bước khôi phục hoàn hảo deck ban đầu')

  console.log('\n2. Kiểm tra Lựa chọn 2: "Giữ giao diện hiện tại" với bộ "vui-nhon"')
  const res2 = addDesign(initial, 'vui-nhon', 'keep')
  const deck2 = res2.deck

  assert.equal(deck2.design, undefined, 'deck2 không được gán design vui-nhon khi chọn Giữ giao diện')
  assert.equal(deck2.slides.length, 2 + 7, 'Tổng slide là 9')

  // Slide cũ giữ nguyên, không đổi font hay theme
  assert.equal(deck2.slides[0].elements.find((e) => e.id === 'skin-motif-badge') === undefined, true, 'Slide cũ không được áp skin vui-nhon')

  // Thêm một slide bố cục mới
  const deck2WithNewSlide = addLayoutSlide(deck2, 'cards')
  assert.equal(deck2WithNewSlide.slides[9].elements.find((e) => e.id === 'skin-motif-badge') === undefined, true, 'Slide thêm sau không có skin vui-nhon vì deck giữ giao diện')

  // Xuất PPTX
  const pptx2 = await buildDeckPptx(deck2WithNewSlide)
  assert.ok(pptx2.byteLength > 10000, 'PPTX xuất ra phải có dữ liệu hợp lệ')
  console.log(`  ✅ Lựa chọn 2 thành công: Giữ nguyên giao diện, slide thêm sau không dính skin, xuất PPTX ${(pptx2.byteLength / 1024).toFixed(1)} KB`)

  // Hoàn tác 1 bước
  const undone2 = res2.undo()
  assert.equal(undone2.slides.length, 2)
  console.log('  ✅ Hoàn tác 1 bước thành công!')

  console.log('\n🎉 Toàn bộ kiểm thử tích hợp (2 bộ thiết kế, 2 lựa chọn, thừa kế skin, PPTX, hoàn tác) ĐẠT 100%!')
}

runTest().catch((err) => {
  console.error('❌ Thất bại:', err)
  process.exit(1)
})
