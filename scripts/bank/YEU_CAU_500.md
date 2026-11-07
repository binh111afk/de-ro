# Soạn 500 câu hỏi mới cho ngân hàng đề

Đọc kỹ trước khi làm: `scripts/bank/BRIEF.md` (định dạng chung, Toán) và `scripts/bank/BRIEF_MON.md` (môn khác). Mọi quy tắc ở đó bắt buộc.

## Cách làm
- Làm lần lượt từng lô trong bảng dưới. Mỗi lô ghi ra **một file JSON riêng** trong `scripts/bank/new/` với đúng tên file đã cho. Không gộp lô, không sửa file khác trong dự án.
- Làm xong một lô thì kiểm JSON hợp lệ (lệnh `node -e` cuối BRIEF.md), rồi làm lô tiếp. Lô nào đã có file thì bỏ qua (để chạy lại được khi bị ngắt).
- Mỗi câu có `level` (NB/TH/VD/VDC). Trong mỗi lô trộn: khoảng 40% NB+TH, 40% VD, 20% VDC.
- Trộn dạng câu theo định dạng thi 2025 của từng môn (cột "Dạng"): TN = trắc nghiệm A–D, ĐS = đúng/sai 4 ý, TLN = trả lời ngắn (đáp án số ≤ 4 ký tự, dấu phẩy thập phân).
- Môn khác Toán: mọi câu có field `subject` đúng chuỗi ở cột "subject".
- Câu có hình: chỉ dùng loại `figure` có trong BRIEF; đề nhắc "hình/đồ thị/bảng" thì phải có `figure`; hình khớp số liệu, không lộ đáp án. Mạch điện: số thập phân dùng dấu chấm (`0.5 Ω`). Biểu đồ `stats`: nhãn ngăn bằng `;`.
- Tự giải lại mọi câu tính số bằng `node -e`/`python -c`. Không chắc đúng thì sửa hoặc bỏ.
- Không trùng ý giữa các câu, kể cả giữa các lô.

## Các lô (tổng 500 câu)

| File | subject | Số câu | Nội dung | Dạng (TN/ĐS/TLN) |
|---|---|---|---|---|
| toan-a.json | (Toán, bỏ trống) | 25 | Hàm số, đạo hàm, cực trị, tiệm cận, bài toán tối ưu thực tế | 12/6/7 |
| toan-b.json | | 25 | Nguyên hàm, tích phân, diện tích, thể tích tròn xoay thực tế | 12/6/7 |
| toan-c.json | | 25 | Oxyz: đường thẳng, mặt phẳng, mặt cầu, bài drone/máy bay | 12/6/7 |
| toan-d.json | | 25 | Xác suất có điều kiện, công thức Bayes, tổ hợp có ràng buộc | 12/6/7 |
| toan-e.json | | 25 | Thống kê mẫu ghép nhóm, hình học không gian (góc, khoảng cách) | 12/6/7 |
| toan-f.json | | 25 | Lớp 10–11: lượng giác, dãy số, cấp số, mũ–logarit, vectơ | 12/6/7 |
| ly-a.json | Vật lí | 30 | Vật lí nhiệt, khí lí tưởng (dùng `gas`) | 18/4/8 |
| ly-b.json | Vật lí | 30 | Từ trường, cảm ứng điện từ, dòng điện xoay chiều | 18/4/8 |
| ly-c.json | Vật lí | 30 | Vật lí hạt nhân, phóng xạ | 18/4/8 |
| ly-d.json | Vật lí | 30 | Lớp 10–11: động học (`motion`), động lực học (`incline`), dao động, sóng, mạch điện (`circuit`) | 18/4/8 |
| hoa-a.json | Hoá học | 26 | Este–lipit, cacbohiđrat, amin–amino axit–protein, polime | 16/4/6 |
| hoa-b.json | Hoá học | 26 | Pin điện, điện phân, kim loại, ăn mòn | 16/4/6 |
| hoa-c.json | Hoá học | 26 | Nguyên tố nhóm IA, IIA, kim loại chuyển tiếp, phức chất | 16/4/6 |
| hoa-d.json | Hoá học | 26 | Hữu cơ lớp 11 (hiđrocacbon, ancol, anđehit, axit; dùng `struct`) | 16/4/6 |
| hoa-e.json | Hoá học | 26 | Lớp 10–11: cấu tạo nguyên tử (`electron`), cân bằng, tốc độ phản ứng, N–S, bài đồ thị (`chemgraph`) | 16/4/6 |
| sinh-a.json | Sinh học | 25 | Di truyền phân tử, quy luật di truyền, phả hệ, di truyền quần thể | 15/4/6 |
| sinh-b.json | Sinh học | 25 | Tiến hoá, sinh thái, sinh lí thực vật–động vật | 15/4/6 |
| anh-a.json | Tiếng Anh | 25 | Điền từ thông báo/quảng cáo, sắp xếp câu thành đoạn/thư | 25/0/0 |
| anh-b.json | Tiếng Anh | 25 | Điền câu vào đoạn văn, đọc hiểu (2 đoạn × 6–7 câu), từ vựng–ngữ pháp | 25/0/0 |
| su.json | Lịch sử | 30 | Lịch sử Việt Nam và thế giới lớp 10–12 (chương trình 2018), đoạn tư liệu | 24/6/0 |
| dia.json | Địa lí | 30 | Địa lí Việt Nam lớp 12, bảng số liệu và biểu đồ (`stats`) | 18/6/6 |
| tin.json | Tin học | 20 | Python, CSDL–SQL, mạng, HTML/CSS, đạo đức số | 16/4/0 |
| gdkt.json | GDKT&PL | 20 | Kinh tế (tăng trưởng, thuế, bảo hiểm, kinh doanh) và pháp luật (Hiến pháp, quyền nghĩa vụ công dân), tình huống | 16/4/0 |

Ghi chú: `subject` của GDKT&PL viết đúng chuỗi `"GDKT&PL"`.

## Khi xong
Trả lời một dòng cho mỗi file: tên file, số câu, số câu có hình.
