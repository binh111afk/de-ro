# Phiên 23 (07/11/2026): ngân hàng câu hỏi 1198 câu, chip độ khó

## Đã làm (đã push, `d7b431b`)
- Kho câu hỏi thêm 1050 câu THPT theo định dạng 2025: `src/data/bankThpt.ts` (453, Toán là chính) và `bankThpt2.ts` (597: Toán 150, Lý 119, Hoá 130, Sinh 50, Anh 50, Sử 30, Địa 28, Tin 20, GDKT&PL 20; 62 câu có hình). Nạp lười qua `loadFullBank()` (`src/data/bank.ts`).
- 600 câu đợt 2 do GLM 5.3 Flash (ZCode) soạn; Claude tự giải lại hết, sửa ~30 đáp án, viết lại đề mơ hồ, chỉnh hình, bỏ 3 câu.
- `BankModal`: hiện câu đúng/sai và trả lời ngắn; chip **Dễ / Trung bình / Khó** ở thẻ và chi tiết, bộ lọc "Độ khó". Logic ở `src/data/bankLevel.ts` (tag NB/TH/VD/VDC; câu cũ theo loại câu + bảng ghi đè).
- Thêm môn `GDKT&PL` (`src/data/types.ts`).
- Hình `graph` nhận `yMin`/`yMax` ghi sẵn (`src/lib/docRewrite.ts`).
- Nguồn JSON, script dựng/sửa ở `scripts/bank/` (đã commit). **Soạn thêm câu: đọc `scripts/bank/HUONG_DAN_SOAN.md`.**

## Còn lại
- Câu cũ trong `src/data/bank.ts` có lỗi nội dung chưa sửa: nv-09 ("Lạc Long Quân" của Nguyễn Du), ls-05 ("Đại hội XI 1/1976"), vl-14 (bài đại số nằm ở môn Lý), sh-02/sh-06/sh-07 (chữ lỗi), vl-11 ("môi trường nạt").
- Nhãn hàng dưới bảng xét dấu (`signtable`) luôn là `f(x)`, câu cho `f'(x)` thì nhãn chưa khớp (thpt-toan-a-11).
- Chưa kiểm bản deploy Vercel sau push.
