/**
 * Quy tắc độ khó mặc định cho AI ra đề, rút từ đề Toán 12 thật (THPT Thăng Long, Diễn Châu 4, chuyên Sơn Tây — 11/2026).
 * Chỉ áp dụng khi người dùng không nói rõ độ khó. Dùng chung cho trình soạn đề (AiPanel) và đề online (onlineAi).
 */
export const DIFFICULTY_RULE =
  'ĐỘ KHÓ MẶC ĐỊNH (theo đề thi thật của các trường THPT hiện nay). Nếu người dùng nói rõ độ khó ("dễ", "trung bình", "cơ bản", "nửa dễ nửa khó", "ôn tập nhẹ"…) thì làm đúng theo lời họ và bỏ qua mục này. ' +
  'Khi người dùng chỉ nói "tạo đề …" mà không nói độ khó, đề phải có tính phân loại như đề thật, KHÔNG được dễ:\n' +
  '  • Tỉ lệ: Nhận biết ~30%, Thông hiểu ~25%, Vận dụng ~30%, Vận dụng cao ~15%. Sắp xếp từ dễ đến khó trong mỗi phần.\n' +
  '  • Đề theo định dạng 2025 (ba phần): Phần I — các câu đầu nhận biết/thông hiểu, 2–3 câu cuối là vận dụng; ' +
  'Phần II (đúng/sai) — trong mỗi câu ý a, b dễ, ý c vận dụng, ý d vận dụng hoặc vận dụng cao; ít nhất một nửa số câu là bài thực tế có hình hoặc bảng số liệu; ' +
  'Phần III (trả lời ngắn) — ít nhất 5/6 câu (hoặc tương đương tỉ lệ) là vận dụng/vận dụng cao.\n' +
  '  • Đề tự luận: ý a) thông hiểu, ý b) c) vận dụng; bài cuối là vận dụng cao.\n' +
  '  • BẮT BUỘC có câu chốt chặn: câu cuối của đề (hoặc của phần cuối) là vận dụng cao, cần 4 bước suy luận trở lên, chỉ học sinh khá giỏi làm được.\n' +
  '  • Câu vận dụng/vận dụng cao viết như đề thật: tình huống thực tế dài 3–6 dòng, nhiều dữ kiện; học sinh phải tự đặt ẩn, tự lập hàm số / hệ toạ độ / mô hình rồi mới tính. ' +
  'KHÔNG cho sẵn công thức cần dùng, KHÔNG chỉ thay số lớn hơn vào câu dễ.\n' +
  '  • Dạng câu khó hay gặp (môn Toán): tối ưu giá bán – doanh thu – chi phí; chuyển động của drone/máy bay/khinh khí cầu trong không gian Oxyz (khoảng cách, thời điểm, vùng cấm); ' +
  'xác suất có điều kiện, công thức Bayes, bài đếm có ràng buộc vị trí; khoảng cách, góc, góc nhị diện, thể tích trong hình không gian (cho một khoảng cách để suy ra kích thước); ' +
  'diện tích / thể tích khối tròn xoay bằng tích phân với hình ghép từ nhiều đường; lãi suất, trả góp, tăng lương theo chu kỳ; mô hình hàm phân thức $N(t)=\\frac{at+b}{ct+d}$ từ dữ kiện; ' +
  'cực trị khi đạo hàm là tích nhiều thừa số; tham số m. Môn khác dùng dạng tương tự: bài tổng hợp nhiều bước, tình huống thực tế, đọc đồ thị/bảng rồi suy luận.\n' +
  '  • Người dùng ghi "chuyên", "HSG", "nâng cao" thì nâng câu chốt lên mức khó hơn nữa (kết hợp nhiều chủ đề, biện luận nhiều trường hợp).\n' +
  '  • Câu càng khó càng dễ sai: tự giải lại từng câu vận dụng/vận dụng cao trước khi ghi đáp án; đáp án trả lời ngắn phải đúng sau khi làm tròn theo yêu cầu đề.\n'
