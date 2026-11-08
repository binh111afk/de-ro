/** Kiểm cắt khung chương trình cho prompt soạn đề (chạy: npx tsx scripts/check-khung.ts) */
import assert from 'node:assert/strict'
import { khungPromptFor } from '../src/lib/khungPrompt'

const head = async (t: string) => (await khungPromptFor(t)).split('\n')[1] ?? ''

assert.match(await head('Soạn đề trắc nghiệm 20 câu môn Toán lớp 9 về hệ thức lượng'), /lớp 9, các chương: Hệ thức lượng trong tam giác vuông/)
assert.match(await head('Đề kiểm tra giữa kì 1 Toán 11'), /lớp 11, giữa học kỳ 1/)
assert.match(await head('Đề thi thử tốt nghiệp THPT môn Toán'), /tốt nghiệp THPT/)
assert.match(await head('Soạn 10 câu tích phân'), /lớp 12, các chương: Nguyên hàm và Tích phân/)
assert.match(await head('Soạn đề Toán 10 xác suất và tổ hợp'), /Đại số tổ hợp; Tính xác suất/)
assert.match(await head('Đề Toán lớp 7 cuối học kỳ 2'), /lớp 7, học kỳ 2/)
assert.match(await head('Đề Vật lí lớp 10 về vectơ vận tốc'), /Vật lí lớp 10/, 'môn khác dùng khung riêng')
assert.match(await head('Đề Khoa học lớp 4 về năng lượng'), /Khoa học lớp 4, các chương: Chủ đề 2. Năng lượng/)
assert.match(await head('Đề Tin học 12'), /Tin học lớp 12/)
assert.match(await head('Đề tiếng Anh lớp 8 unit 3'), /Tiếng Anh lớp 8, các chương/)
assert.match(await head('Đề Lịch sử và Địa lí lớp 7 cuối kì 1'), /Lịch sử và Địa lí lớp 7, học kỳ 1/)
assert.match(await khungPromptFor('Đề Toán lớp 3 cuối học kỳ 1'), /Mức 1/)
const ly7 = await khungPromptFor('Đề Vật lí lớp 7 cuối kì 1')
assert.match(ly7, /Đề Vật lí lớp 7/)
assert.ok(!ly7.includes("; Hoá)") && !ly7.includes("; Sinh)"), "Vật lí 7 chỉ lấy mạch Lý của KHTN")
assert.ok((await khungPromptFor("Đề KHTN lớp 7")).includes("; Sinh)"))
assert.equal(await khungPromptFor('Viết đoạn văn về mùa thu lớp 6'), '')
assert.equal(await khungPromptFor('Thêm 2 câu khó nữa'), '', 'lượt nối tiếp tự nó không có phạm vi')
// lượt nối tiếp: AiPanel ghép thêm đầu đề ("Môn: Toán – Lớp 9")
assert.match(await head('Thêm 2 câu khó nữa\nMôn: Toán – Lớp 9'), /lớp 9/)
const tn = await khungPromptFor('Đề thi tốt nghiệp THPT môn Toán')
assert.ok(tn.length < 12000, `đề tốt nghiệp quá dài: ${tn.length}`)
assert.match(tn, /CẤU TRÚC ĐỀ THAM KHẢO/)
console.log('✓ Khung chương trình: đạt hết các ca kiểm tra (đề tốt nghiệp', tn.length, 'ký tự)')
