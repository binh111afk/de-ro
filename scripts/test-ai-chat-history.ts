import assert from 'node:assert/strict'
import type { ChatTurn } from '../src/examEditor/AiPanel'
import { chatHistoryKey, decodeChatHistory, encodeChatHistory } from '../src/lib/aiChatHistory'

const turns: ChatTurn[] = Array.from({ length: 65 }, (_, i) => ({ id: String(i), role: 'user', text: 'Câu hỏi' }))
turns[64].pickedSources = [
  { kind: 'library', name: 'Bài tập.pdf' },
  { kind: 'mine', name: 'Đề Toán' },
  { kind: 'community', name: 'Đề mẫu' },
]
turns.push({
  id: 'answer', role: 'assistant', text: 'Trả lời', intent: 'chat',
  files: [{ id: 'file', name: 'ảnh.png', size: 32, kind: 'image', url: 'blob:private' }],
  refs: ['Câu 1'], sources: ['Tài liệu.pdf'], webSources: [{ url: 'https://example.com/', title: 'Nguồn' }],
  sourceNote: 'Cảnh báo', error: 'Lỗi', progress: { done: 1, total: 2 },
  log: [{ label: 'Đọc', state: 'done' }], retry: 'Thử lại', vote: 'up',
})
turns.push(
  { id: 'stream', role: 'assistant', text: 'Chưa xong', pending: true },
  { id: 'plan', role: 'assistant', text: 'Đợi duyệt', planState: 'pending' },
  { id: 'ask', role: 'assistant', text: 'Đợi trả lời', askState: 'open' },
)

const encoded = encodeChatHistory(turns)
const restored = decodeChatHistory(encoded)
assert.equal(restored.length, 60)
assert.equal(restored[0].id, '6')
assert.equal(restored[0].pickedSources, undefined)
assert.deepEqual(restored.at(-2)?.pickedSources, turns[64].pickedSources)
assert.deepEqual(restored.at(-1), {
  id: 'answer', role: 'assistant', text: 'Trả lời', intent: 'chat',
  fileNames: ['ảnh.png'], refs: ['Câu 1'], sources: ['Tài liệu.pdf'],
  webSources: [{ url: 'https://example.com/', title: 'Nguồn' }], sourceNote: 'Cảnh báo', error: 'Lỗi',
})
assert.doesNotMatch(encoded, /blob:|"(pending|progress|log|retry|vote|planState|askState)"|Đợi duyệt|Đợi trả lời|Chưa xong/)
assert.deepEqual(decodeChatHistory('{hỏng'), [])
assert.deepEqual(decodeChatHistory('[null, {"text": 2}]'), [])
assert.notEqual(chatHistoryKey('exam', 'same-id'), chatHistoryKey('slide', 'same-id'))
console.log('Lịch sử chat AI: tất cả đều qua')
