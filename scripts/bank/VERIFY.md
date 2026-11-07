# Rà soát đáp án ngân hàng câu hỏi

Bạn được giao MỘT file JSON (mảng câu hỏi; định dạng mô tả trong BRIEF.md cùng thư mục). Nhiệm vụ: kiểm tra từng câu như một giáo viên chấm đề, rồi SỬA TRỰC TIẾP file.

Với mỗi câu:
1. Tự giải lại độc lập (đừng tin `answer`/`explanation` có sẵn). Câu có số liệu thì tính bằng `node -e` hoặc `python -c` để chắc.
2. Kiểm tra:
   - `answer` đúng không (trắc nghiệm: đúng chữ cái và chỉ một phương án đúng; đúng/sai: từng ý a–d; trả lời ngắn: con số, làm tròn đúng như đề yêu cầu, ≤ 4 ký tự, dấu phẩy thập phân).
   - Đề có đủ dữ kiện, không mâu thuẫn, không có hai cách hiểu.
   - `explanation` khớp đáp án.
   - `figure` (nếu có) khớp số liệu đề và không lộ đáp án; đề nhắc "như hình" thì phải có figure.
   - Kiến thức đúng chương trình Việt Nam hiện hành; tiếng Việt/tiếng Anh chuẩn.
3. Sai thì sửa cho đúng (ưu tiên sửa `answer`/`explanation`, hoặc chỉnh số liệu đề cho sạch). Câu hỏng không cứu được thì XOÁ khỏi mảng.
4. Không đổi định dạng field, giữ dấu `\\` của LaTeX hợp lệ trong JSON.

Sau khi ghi file, chạy `node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" <file>` để chắc JSON hợp lệ.

Trả lời cuối cùng NGẮN: tổng số câu đã rà, số câu đã sửa (liệt kê số thứ tự + lỗi một dòng mỗi câu), số câu đã xoá.
