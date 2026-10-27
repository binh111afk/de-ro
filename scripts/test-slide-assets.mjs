import assert from 'node:assert/strict'
import { SLIDE_ASSETS, SLIDE_ASSET_IDS, isSlideAssetId, pickSlideAsset } from '../src/lib/slideAssets.ts'

assert.equal(SLIDE_ASSET_IDS.length, 25)
for (const id of SLIDE_ASSET_IDS) {
  assert.ok(SLIDE_ASSETS[id].icon, `${id} có icon`)
  assert.ok(SLIDE_ASSETS[id].tags.length > 0, `${id} có tags`)
}
assert.equal(isSlideAssetId('calculator'), true)
assert.equal(isSlideAssetId('not-real'), false)
assert.equal(pickSlideAsset('Hàm số và phép tính'), 'calculator')
assert.equal(pickSlideAsset('Chiến dịch lịch sử năm 1954'), 'history')
assert.equal(pickSlideAsset('Bài học mới'), 'book')
console.log('test-slide-assets: catalog/icon semantic/pick 5/5 pass')
