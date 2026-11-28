/**
 * Test chế độ "Giữ nguyên chữ" cho slide (src/lib/slidePreserve.ts):
 * - Tách đoạn đánh số + dấu ngắt `---`
 * - Lắp đúng 100% chuỗi gốc từ JSON ánh xạ của AI (không mất/không đổi ký tự)
 * - Tự bù đoạn AI bỏ sót
 * - Tự tách sang trang kế tiếp khi danh sách / đoạn quá dài
 * - Dựng được SlideElement[] qua slideFromAi mà không lỗi
 *
 * Chạy: npm run test:slide-preserve
 */
import assert from 'node:assert/strict'
import { assemblePreservedDeck, fallbackPreservePages, formatPreserveMessage, parsePreserveChat, splitLongBlock, splitPreserveBlocks } from '../src/lib/slidePreserve.ts'
import { slideFromAi } from '../src/lib/slideAi.ts'
import { DECK_THEMES } from '../src/lib/slideTheme.ts'

const theme = DECK_THEMES[0]

/** Gom mọi chuỗi nội dung từ mảng AiSlidePayload để kiểm tra không mất 1 đoạn gốc nào. */
const allTextOf = (pages) =>
  pages.flatMap((p) => [
    p.title, p.subtitle, p.kicker, p.body, p.quote, p.author, p.caption, p.caption2,
    ...(p.bullets ?? []), ...(p.items ?? []), ...(p.left ?? []), ...(p.right ?? []),
    ...(p.stats ?? []).flatMap((s) => [s.value, s.label]),
  ]).filter(Boolean).join('\n')

// 1. Tách đoạn và tôn trọng dấu ---
{
  const raw = [
    'Đảng bộ tỉnh Quảng Trị lãnh đạo phát triển du lịch (2010–2020)',
    'Khoa Lịch sử · ĐH KHXH&NV - ĐHQGHN',
    '---',
    'Bối cảnh trước năm 2010',
    'Quảng Trị có 509 di tích lịch sử - văn hóa được công nhận.',
    'Năm 2010 đón 915.000 lượt khách nhưng lưu trú bình quân chỉ 1,07 ngày.',
  ].join('\n')

  const blocks = splitPreserveBlocks(raw)
  assert.equal(blocks.length, 5)
  assert.equal(blocks[0].id, 1)
  assert.equal(blocks[2].breakBefore, true, 'dấu --- gắn breakBefore cho đoạn kế')
  assert.match(formatPreserveMessage(blocks), /\[1\].*---\s*\(người dùng muốn sang slide mới/s)

  const aiJson = JSON.stringify({
    title: 'Du lịch Quảng Trị 2010–2020',
    theme: 'sang',
    slides: [
      { layout: 'title', titleId: 1, subtitleId: 2 },
      { layout: 'bullets', titleId: 3, itemIds: [4, 5] },
    ],
  })
  const res = assemblePreservedDeck(aiJson, blocks)
  assert.ok(res)
  assert.equal(res.recovered, 0)
  assert.equal(res.pages.length, 2)
  assert.equal(res.pages[0].title, blocks[0].text)
  assert.equal(res.pages[0].subtitle, blocks[1].text)
  assert.deepEqual(res.pages[1].bullets, [blocks[3].text, blocks[4].text])
  // Dựng được SlideElement[] thật qua slideFromAi
  for (const p of res.pages) {
    const s = slideFromAi(p, theme)
    assert.ok(s.elements.length > 0)
  }
}

// 2. AI lỡ bỏ sót đoạn -> code tự bù đủ 100%, không mất 1 chữ
{
  const blocks = splitPreserveBlocks('Tiêu đề A\nÝ 1 giữ nguyên\nÝ 2 AI quên mất\nÝ 3 AI cũng quên')
  const aiJson = JSON.stringify({
    title: 'Tiêu đề A',
    slides: [{ layout: 'bullets', titleId: 1, itemIds: [2] }],
  })
  const res = assemblePreservedDeck(aiJson, blocks)
  assert.ok(res)
  assert.equal(res.recovered, 2)
  const joined = allTextOf(res.pages)
  for (const b of blocks) assert.ok(joined.includes(b.text), `không được mất đoạn: ${b.text}`)
}

// 3. Tự tách trang khi slide có quá nhiều mục (> 6) hoặc 1 đoạn quá dài (> 460 ký tự)
{
  const many = Array.from({ length: 10 }, (_, i) => `Mục nguyên văn số ${i + 1} với công thức $a^2 + b^2 = c^2$`).join('\n')
  const blocks = splitPreserveBlocks('Danh sách 10 mục\n' + many)
  const aiJson = JSON.stringify({
    title: 'Danh sách 10 mục',
    slides: [{ layout: 'bullets', titleId: 1, itemIds: blocks.slice(1).map((b) => b.id) }],
  })
  const res = assemblePreservedDeck(aiJson, blocks)
  assert.ok(res)
  assert.ok(res.pages.length >= 2, '10 mục phải tự tách ra ít nhất 2 slide')
  const joined = allTextOf(res.pages)
  for (const b of blocks) assert.ok(joined.includes(b.text), `mục ${b.id} phải còn nguyên văn`)

  const longPara = Array.from({ length: 8 }, (_, i) => `Đây là câu văn khá dài số ${i + 1} dùng để kiểm tra việc tách mềm theo câu mà không mất chữ nào.`).join(' ')
  const parts = splitLongBlock(longPara, 300)
  assert.ok(parts.length >= 2)
  assert.equal(parts.join(' '), longPara, 'ghép lại đúng từng ký tự')
}

// 4. Chế độ Pro + rules + fallback khi JSON hỏng
{
  const blocks = splitPreserveBlocks('Chủ đề Pro\n---\nQuy hoạch: Lập quy hoạch 15 khu du lịch.\nHạ tầng: Nâng cấp QL1A và đường ven biển.')
  const aiJson = JSON.stringify({
    title: 'Chủ đề Pro',
    slides: [
      { layout: 'photo-full', titleId: 1, imagePrompt: 'Coastal landscape of Quang Tri' },
      { layout: 'rules', itemIds: [2, 3] },
    ],
  })
  const res = assemblePreservedDeck(aiJson, blocks, { pro: true })
  assert.ok(res)
  assert.equal(res.pages[0].layout, 'photo-full')
  assert.equal(res.pages[0].imagePrompt, 'Coastal landscape of Quang Tri')
  assert.equal(res.pages[1].layout, 'rules')
  assert.equal(res.pages[1].stats?.[0].value, 'Quy hoạch')
  assert.equal(res.pages[1].stats?.[0].label, 'Lập quy hoạch 15 khu du lịch.')

  // Fallback thuần khi AI trả rác
  assert.equal(assemblePreservedDeck('không phải json', blocks), null)
  const fb = fallbackPreservePages(blocks, false)
  assert.equal(fb.length, 2)
  const fbText = allTextOf(fb)
  for (const b of blocks) assert.ok(fbText.includes(b.text))
}

// 5. Lọc dòng lời dặn (ignoreIds) và câu hỏi chat thường (parsePreserveChat)
{
  const blocks = splitPreserveBlocks('Tạo slide giúp tôi, chia 2 cột nhé:\nƯu điểm\nNhanh và giữ nguyên văn\nNhược điểm\nCần chuẩn bị sẵn nội dung')
  const aiJson = JSON.stringify({
    title: 'So sánh',
    ignoreIds: [1],
    slides: [{ layout: 'two-column', leftTitleId: 2, leftIds: [3], rightTitleId: 4, rightIds: [5] }],
  })
  const res = assemblePreservedDeck(aiJson, blocks)
  assert.ok(res)
  assert.equal(res.recovered, 0, 'dòng lời dặn trong ignoreIds không bị bù ngược lên slide')
  assert.equal(res.pages.length, 1)
  assert.equal(res.pages[0].layout, 'two-column')
  const txt = allTextOf(res.pages)
  assert.ok(!txt.includes('Tạo slide giúp tôi'), 'không dính câu dặn lên slide')
  assert.ok(txt.includes('Nhanh và giữ nguyên văn') && txt.includes('Cần chuẩn bị sẵn nội dung'))

  assert.equal(parsePreserveChat('Chào bạn, bạn dán nội dung bài giảng vào đây nhé.'), 'Chào bạn, bạn dán nội dung bài giảng vào đây nhé.')
  assert.equal(parsePreserveChat('{"action":"chat","reply":"Slide 2 ổn rồi."}'), 'Slide 2 ổn rồi.')
  assert.equal(parsePreserveChat('{"title":"A","slides":[{"layout":"title","titleId":1}]}'), null)
}

console.log('test-slide-preserve: tất cả đều qua')
