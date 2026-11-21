/**
 * Test ảnh tư liệu thật cho slide Chuyên nghiệp: lọc giấy phép, độ khớp truy vấn, chọn ảnh, ghi nguồn (không gọi mạng).
 * Chạy: npm run test:wikimedia
 */
import assert from 'node:assert/strict'
import { isReusableLicense, pickCommonsPage, relevance } from '../src/lib/wikimedia.ts'
import { mergePhotoCredit, stripPhotoSources } from '../src/lib/slideAi.ts'

// 1. Giấy phép: chỉ CC0 / public domain / CC BY / CC BY-SA
for (const ok of ['CC BY-SA 4.0', 'CC BY 2.0', 'CC0', 'Public domain', 'PD-USGov-NASA', 'CC-BY-SA-3.0']) {
  assert.equal(isReusableLicense(ok), true, ok)
}
for (const bad of ['CC BY-NC 2.0', 'CC BY-ND 4.0', 'Fair use', 'GFDL', '', undefined, 'All rights reserved']) {
  assert.equal(isReusableLicense(bad), false, String(bad))
}

// 2. Độ khớp truy vấn: bỏ dấu, bỏ từ thừa, năm là từ khoá
assert.equal(relevance('Dien Bien Phu 1954 French paratroopers', 'File:Dien Bien Phu 1954 French paratroopers.jpg'), 1)
assert.ok(relevance('Dien Bien Phu 1954', 'File:Sunset in Paris.jpg') < 0.5)
assert.equal(relevance('Hạ Long Bay', 'File:Ha Long Bay 2019.jpg'), 1)
assert.equal(relevance('the', 'anything'), 1)

// 3. Chọn ảnh: bỏ giấy phép xấu, ảnh nhỏ, logo, lệch chủ đề; ưu tiên ảnh ngang + thứ hạng cao
const page = (title, index, w, h, license, mime = 'image/jpeg') => ({
  title,
  index,
  imageinfo: [{ url: 'u', thumburl: 't', width: w, height: h, mime, extmetadata: { LicenseShortName: { value: license }, ImageDescription: { value: '<b>' + title + '</b>' } } }],
})
const pages = [
  page('File:Ha Long Bay logo.jpg', 1, 3000, 2000, 'CC BY 4.0'),
  page('File:Ha Long Bay NC.jpg', 2, 3000, 2000, 'CC BY-NC 2.0'),
  page('File:Ha Long Bay small.jpg', 3, 640, 480, 'CC BY 4.0'),
  page('File:Ha Long Bay svg.png', 4, 3000, 2000, 'CC BY 4.0', 'image/png'),
  page('File:Paris Eiffel.jpg', 5, 3000, 2000, 'CC BY 4.0'),
  page('File:Ha Long Bay portrait.jpg', 6, 1500, 2400, 'CC BY 4.0'),
  page('File:Ha Long Bay aerial.jpg', 7, 4000, 2500, 'CC BY-SA 4.0'),
]
assert.equal(pickCommonsPage(pages, 'Ha Long Bay')?.title, 'File:Ha Long Bay aerial.jpg')
assert.equal(pickCommonsPage(pages.slice(0, 5), 'Ha Long Bay'), null)

// 4. Dòng nguồn: AI chỉ giữ nguồn số liệu, nguồn ảnh do app thêm
assert.equal(stripPhotoSources('Nguồn: UNESCO · Ảnh: TTXVN / Wikimedia Commons'), 'Nguồn: UNESCO')
assert.equal(stripPhotoSources('Ảnh minh hoạ do AI tạo'), undefined)
assert.equal(stripPhotoSources(undefined), undefined)
const photo = 'Ảnh: A · CC0 · Wikimedia Commons'
assert.equal(mergePhotoCredit('Nguồn: UNESCO', photo), 'Nguồn: UNESCO · ' + photo)
assert.equal(mergePhotoCredit(undefined, photo), photo)
assert.equal(mergePhotoCredit(photo, photo), photo)
assert.ok(mergePhotoCredit('x'.repeat(300), photo).length <= 220)

console.log('test-wikimedia: 4 nhóm kiểm tra đạt')
