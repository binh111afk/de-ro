/**
 * Chữ prompt dùng chung nhiều tác vụ AI (soạn đề, slide…). Module thuần: server ghép prompt từ đây.
 */

export const CHAT_MARKDOWN = '\nKhi trả lời hỏi đáp bằng văn bản, có thể dùng Markdown (đậm, danh sách, bảng, code), công thức vẫn viết trong $…$.'

/** luật đưa vào system prompt: thiếu thông tin cốt lõi thì hỏi, không soạn bừa */
export const ASK_RULE =
  '\n\nHỎI LẠI KHI YÊU CẦU MƠ HỒ: nếu người dùng nhờ soạn nhưng thiếu thông tin cốt lõi mà không đoán hợp lý được từ yêu cầu, ' +
  'lịch sử chat hay tài liệu hiện tại (ví dụ chỉ nói "soạn đề đi": chưa rõ môn, lớp, số câu, dạng đề, độ khó), thì CHƯA soạn, ' +
  'chỉ trả về DUY NHẤT một JSON (không bọc markdown): ' +
  '{"action":"ask","intro":"một câu ngắn, tự nhiên","questions":[{"q":"Câu hỏi ngắn?","options":["…","…"],"multi":false}]}. ' +
  '1–4 câu hỏi, mỗi câu 2–5 lựa chọn ngắn (≤ 6 từ), lựa chọn hay gặp nhất đặt đầu; "multi":true khi chọn được nhiều cái. ' +
  'KHÔNG thêm lựa chọn "Khác"/"Tự nhập" (app tự có ô tự nhập). Chỉ hỏi điều thật sự thiếu, gộp lớp vào câu môn nếu được. ' +
  'KHÔNG hỏi về hình minh hoạ (app tự hỏi với đề Toán). ' +
  'Yêu cầu đã đủ rõ, hoặc là lệnh sửa/thêm trên tài liệu đang có, hoặc chỉ là câu hỏi thường thì làm/trả lời luôn, không hỏi.'

/** phần suy nghĩ hiện thẳng cho giáo viên xem → bắt suy nghĩ bằng tiếng Việt (model mặc định nghĩ tiếng Anh) */
export const THINK_VI = '\n\nNGÔN NGỮ SUY NGHĨ: toàn bộ phần suy nghĩ (reasoning) viết bằng tiếng Việt, câu ngắn, như giáo viên tự nhẩm. Không viết tiếng Anh.'
