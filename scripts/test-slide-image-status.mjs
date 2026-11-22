import assert from 'node:assert/strict'
import { SlideImageJobs } from '../src/examEditor/slideImageStatus.ts'

const applied = []
const jobs = new SlideImageJobs(() => {})
const apply = result => {
  applied.push(result)
  return true
}

let finishFirst
const first = jobs.start('slide-1', 'image', () => new Promise(resolve => { finishFirst = resolve }), apply)
assert.equal(jobs.status('slide-1', 'image'), 'pending')
assert.equal(jobs.status('slide-1', 'image2'), undefined)
assert.equal(jobs.status('slide-2', 'image'), undefined)

const photo = { src: '/photo.jpg', credit: 'Ảnh minh hoạ do AI tạo' }
let attempts = 0
const loadPhoto = async () => {
  if (++attempts === 1) throw new Error('Hết lần thử')
  return photo
}
const second = jobs.start('slide-1', 'image2', loadPhoto, apply)
assert.equal(jobs.status('slide-1', 'image2'), 'pending')
await second
assert.equal(jobs.status('slide-1', 'image2'), 'failed')
assert.equal(jobs.status('slide-1', 'image'), 'pending')

finishFirst({ src: '/cover.jpg' })
await first
assert.equal(jobs.status('slide-1', 'image'), undefined)
assert.equal(jobs.status('slide-1', 'image2'), 'failed')
assert.equal(jobs.justArrived('slide-1', 'image', '/cover.jpg'), true)
assert.equal(jobs.justArrived('slide-1', 'image2', '/cover.jpg'), false)

const retry = jobs.retry('slide-1', 'image2')
assert.equal(jobs.status('slide-1', 'image2'), 'pending')
assert.equal(jobs.retry('slide-1', 'image2'), undefined)
await retry
assert.equal(jobs.status('slide-1', 'image2'), undefined)
assert.equal(attempts, 2)
assert.deepEqual(applied, [{ src: '/cover.jpg' }, photo])

let finishDeleted
const deleted = jobs.start('slide-2', 'image', () => new Promise(resolve => { finishDeleted = resolve }), apply)
assert.equal(jobs.status('slide-2', 'image'), 'pending')
jobs.removeMissingSlides(new Set(['slide-1']))
assert.equal(jobs.status('slide-2', 'image'), undefined)
finishDeleted({ src: '/deleted.jpg' })
await deleted
assert.equal(applied.length, 2)
assert.equal(jobs.justArrived('slide-2', 'image', '/deleted.jpg'), false)

let failClosed
const closed = jobs.start('slide-1', 'image', () => new Promise((_, reject) => { failClosed = reject }), apply)
jobs.clear()
failClosed(new Error('Deck đã đóng'))
await closed
assert.equal(jobs.status('slide-1', 'image'), undefined)
assert.equal(jobs.retry('slide-1', 'image'), undefined)
assert.equal(jobs.justArrived('slide-1', 'image', '/cover.jpg'), false)

console.log('OK: trạng thái ảnh, thử lại, khoá theo ô và bỏ kết quả của slide đã xoá hoặc deck đã đóng')
