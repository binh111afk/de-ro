/**
 * Chữ prompt soạn câu hỏi cho Ngân hàng — module thuần để SERVER ghép từ `task: "ngan-hang"`.
 */
const SYSTEM =
  'Bạn là giáo viên Việt Nam ra đề theo chương trình GDPT 2018. Câu hỏi chính xác, đáp án đúng, không trùng lặp. Công thức toán viết LaTeX trong $...$. Chỉ trả về JSON.'

export const buildNganHangSystem = (): string => SYSTEM
