import assert from 'node:assert/strict'
import { SLIDE_ASSETS, SLIDE_ASSET_IDS, isSlideAssetId, pickSlideAsset } from '../src/lib/slideAssets.ts'

assert.equal(SLIDE_ASSET_IDS.length, 27)
for (const id of SLIDE_ASSET_IDS) {
  assert.ok(SLIDE_ASSETS[id].icon, `${id} có icon`)
  assert.ok(SLIDE_ASSETS[id].tags.length > 0, `${id} có tags`)
}
assert.equal(isSlideAssetId('calculator'), true)
assert.equal(isSlideAssetId('not-real'), false)
assert.equal(pickSlideAsset('Hàm số và phép tính'), 'calculator')
assert.equal(pickSlideAsset('Chiến dịch lịch sử năm 1954'), 'history')
assert.equal(pickSlideAsset('Bài học mới'), undefined, 'không khớp thì không có icon mặc định')
assert.equal(pickSlideAsset('Mạng xã hội'), 'phone')
const used = new Set()
assert.equal(pickSlideAsset('Giờ học và thời gian', used), 'history')
assert.notEqual(pickSlideAsset('Giờ học và thời gian', used), 'history', 'không lặp icon trong cùng slide')
// từ khoá ngắn khớp một mình không đủ — lỗi thật từ deck AI (Hoá 10, Tấm Cám)
assert.equal(pickSlideAsset('Chất oxi hoá nhận electron, số oxi hoá giảm xuống'), undefined, '"số" không ra máy tính')
assert.equal(pickSlideAsset('Yếu tố thần kỳ: Bụt, bống, chim vàng anh'), undefined, '"vàng anh" không ra tiếng Anh')
assert.equal(pickSlideAsset('Từ vựng tiếng Anh về lễ hội'), 'language')
console.log('test-slide-assets: catalog/icon semantic/pick pass')
