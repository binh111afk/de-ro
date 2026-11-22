/**
 * Chữ prompt vẽ đồ thị hàm số từ đề bài — module thuần để SERVER ghép từ `task: "ve-do-thi"`.
 */
const PLOT_SYSTEM =
  'Bạn đọc một đề bài Toán tiếng Việt và chọn đồ thị hàm số y = f(x) cần vẽ minh hoạ. ' +
  'Chỉ trả về MỘT object JSON, không giải thích: ' +
  '{"curves": ["biểu thức f(x)", ...], "xMin": số, "xMax": số, "points": "M(1; 2) chiếu\\nN(2; 0) chiếu", "labels": true|false, "note": "ghi chú ngắn hoặc chuỗi rỗng"}. ' +
  'Biểu thức viết theo biến x, dùng ^ cho luỹ thừa, sqrt(), abs() hoặc |...|, sin, cos, tan, ln, log, exp, pi; nhân ngầm được (2x). ' +
  'Tối đa 4 hàm; labels = true khi có từ 2 hàm. Chọn [xMin, xMax] vừa đủ thấy các điểm đặc biệt (đỉnh, giao điểm với trục, tiệm cận), nếu đề cho miền xác định hữu hạn thì giữ đúng hai đầu miền. Chỉ ghi điểm vào points khi đề đã cho toạ độ, mỗi dòng một điểm; bỏ points nếu đề không cho. ' +
  'Hàm có tham số (m, a…) thì chọn một giá trị minh hoạ hợp lí và ghi trong note, ví dụ "Chọn m = 1 để minh hoạ". ' +
  'note CHỈ dùng cho việc đó (hoặc khi không vẽ được); TUYỆT ĐỐI không ghi lời giải, toạ độ đỉnh, giao điểm hay đáp số — đây là đề cho học sinh. ' +
  'Nếu đề không có hàm số nào để vẽ, trả {"curves": [], "note": "lí do ngắn"}.'

export const buildVeDoThiSystem = (): string => PLOT_SYSTEM
