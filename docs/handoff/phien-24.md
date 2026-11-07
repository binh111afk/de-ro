# Phiên 24 — 07/11/2026

## Trạng thái git
- Đang ở nhánh **`feat/trig-7-tinh-nang`** (KHÔNG phải main). Nhánh này có 2 commit của agent khác, chưa ai kiểm:
  - `4afe5e8` feat(trig): 7 tính năng mới cho công cụ đường tròn lượng giác.
  - `69eb60d` chore(bank): 600 câu Toán 10–12 trong `scripts/bank/toan600/` (chưa kiểm, chưa gộp vào kho).
- `main` đã push tới `fac19af`: composer AI có các bước + nút "Nguồn (n)", delay 400 ms cho dấu + giữa slide, hậu tố "chữ tiếng Việt" cho prompt ảnh, ảnh dùng Agnes trước rồi mới tới sensenova.
- Chưa commit: `src/data/khungToan.json` (khung chương trình Toán, mục 3), `docs/prompt-trig-7-tinh-nang.md`, file này, `context.md`.
- **Không merge nhánh feat vào main khi người dùng chưa đồng ý.** Chỉ commit/push khi được bảo.
- Người dùng vẫn phải tự thêm env Vercel `AGNES_API_KEY`, `AGNES_BASE_URL`, `AGNES_IMAGE_MODEL` (production). Classifier chặn Claude làm việc này.

## Còn lại (theo thứ tự)

### 1. Kiểm code công cụ đường tròn lượng giác (commit 4afe5e8)
- Đề bài agent kia nhận: `docs/prompt-trig-7-tinh-nang.md` (7 tính năng: tô cung, trục cot, đường thẳng `y=`/`x=`, nối đa giác, cung giữa 2 điểm, điểm theo toạ độ, giá trị trên trục).
- File bị sửa: xem bằng `git diff main...feat/trig-7-tinh-nang --stat`. Chủ yếu là `src/lib/mathExtra.ts`, `src/examEditor/tools/MoreToolModals.tsx` (`TRIG_HELP`), `src/lib/docRewrite.ts` (FIGURE_GUIDE/toolFromRaw), cộng thêm `scripts/check-trig.ts`.
- Kiểm: `npx tsc -p tsconfig.app.json --noEmit`; mở công cụ trong trình duyệt và thử từng cú pháp trong TRIG_HELP; xem hình khi xuất Word (toolImages → PNG); cho AI soạn một câu có hình trig để xem FIGURE_GUIDE hoạt động; cú pháp cũ (`M: pi/3`, họ nghiệm) vẫn phải chạy như trước.

### 2. Kiểm 600 câu Toán (commit 69eb60d, `scripts/bank/toan600/`, 24 file × 25 câu)
- Đề bài agent kia nhận: `scripts/bank/YEU_CAU_toan600.md`. Quy trình chung: `scripts/bank/HUONG_DAN_SOAN.md` (build.mjs → dump.mjs → giải lại → fix_*.mjs → xem hình → gộp vào `bankThpt*.ts`).
- Kiểm kỹ: (a) đáp án câu Đúng/Sai **từng ý**; (b) `grades` đúng lớp (thiếu field này thì build gán Lớp 12); (c) hình có đủ các điểm mà đề gọi tên; (d) đúng chương trình. Đối chiếu với `src/data/khungToan.json`, nhất là trường `chua_duoc_dung`.
- Lỗi đã biết từ đề bài: lô `t12-gtln-tiemcan` có ghi "khảo sát bậc bốn trùng phương". Chương trình 2018 **không có bài khảo sát** hàm trùng phương (cực trị, GTLN thì vẫn được). Câu nào bắt khảo sát hoặc vẽ đồ thị hàm trùng phương thì sửa hoặc bỏ.
- Câu dùng cú pháp trig mới chỉ hiển thị đúng khi có code của nhánh feat. Vì vậy phải gộp kho cùng lúc với nhánh đó.

### 3. Khung chương trình Toán 6–12 → chèn vào prompt soạn đề
- `src/data/khungToan.json` (~150 KB) do agent ngoài tổng hợp, Claude đã rà và sửa. Đã thêm 3 chương: `t9-phuong-trinh-quy-ve-bac-nhat`, `t9-da-giac-deu-phep-quay`, `t11-mau-so-lieu-ghep-nhom`. Đã sửa: ghép nhóm học ở lớp 9/11/12; lớp 11 có công thức cộng xác suất tổng quát; lớp 12 hàm trùng phương (xem mục 2); chuyên đề lớp 10/11. Cuối mỗi lớp có `ghi_chu_chua_chac`.
- Cấu trúc: `lop[].chuong[]` gồm `id, ten, hoc_ky, ten_theo_sach{KNTT,CTST,CD}, yeu_cau_can_dat, kien_thuc_duoc_dung, chua_duoc_dung, dang_bai_dien_hinh, luu_y_ra_de`; `cau_truc_de[]` (tốt nghiệp 2025, định kỳ THCS, định kỳ THPT).
- Việc cần làm: khi soạn đề Toán, xác định lớp + chương (hoặc kỳ) từ yêu cầu hay lựa chọn của người dùng, cắt đúng các chương đó (khoảng 300–3.000 token) rồi chèn vào prompt soạn đề (`AiPanel.tsx` / `docRewrite.ts`), kèm cấu trúc đề phù hợp. **Không nạp cả file vào prompt.** Nạp JSON lười (dynamic import) để không làm nặng bundle. Có thể thêm bước AI tự kiểm "vượt chương trình" sau khi soạn.
- Các môn khác làm sau, theo cùng mẫu: người dùng nhờ agent ngoài soạn từng môn.

### 4. Công cụ vẽ mới: mẫu số liệu ghép nhóm
- Người dùng chỉ đặt tên là "mẫu số liệu ghép nhóm"; tên hiển thị tuỳ chọn. Đề xuất **"Bảng ghép nhóm"**, kind `grouped`.
- Lý do cần: ghép nhóm có ở lớp 9 (lập bảng, biểu đồ), lớp 11 (trung bình, trung vị, tứ phân vị, mốt) và lớp 12 (khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn). Kho câu hỏi và đề thi dùng loại này rất nhiều. `stats` hiện chỉ có biểu đồ `hist`, không có bảng ghép nhóm chuẩn SGK.
- Gợi ý chức năng: nhập các nhóm `[a; b)` và tần số → vẽ **bảng tần số ghép nhóm** kiểu SGK (ngang hoặc dọc; tuỳ chọn thêm hàng giá trị đại diện, tần số tích luỹ, tần số tương đối) và/hoặc **biểu đồ cột liền** (histogram) có thể kèm đa giác tần số. Có thể có ô "tính giúp" ra trung bình, trung vị, Q1, Q3, mốt, phương sai, độ lệch chuẩn (theo công thức SGK) để giáo viên soát đáp án. Kết quả tính không vẽ lên hình, tránh lộ đáp án.
- Thêm công cụ = 7 chỗ (xem context.md mục "Thêm một công cụ vẽ"). Nhớ thêm vào FIGURE_GUIDE để AI và kho câu hỏi dùng được (`{"kind":"grouped",...}`), rồi có thể đổi các câu ghép nhóm trong kho đang vẽ bằng `stats` sang công cụ này.
- Nên làm trên main hoặc nhánh riêng. Không đụng nhánh trig nếu nhánh đó chưa merge (cả hai cùng sửa `docRewrite.ts` và `MoreToolModals.tsx`, dễ xung đột).

### Việc tồn từ phiên 23
Xem [phiên 23](phien-23.md), mục "Còn lại" (lỗi nội dung câu cũ trong bank.ts, nhãn signtable f'(x)).

## Ghi chú
- Kích cỡ kho câu hỏi: mức "ổn" là khoảng 600 câu cho mỗi lớp mỗi môn Toán. Quan trọng hơn là phân bố đều theo chủ đề × dạng câu × độ khó. Sau khi gộp 600 câu nên đếm theo các ô này để thấy ô nào còn thiếu.
- Prompt mẫu cho agent ngoài soạn khung chương trình nằm trong transcript phiên 24. Muốn làm môn khác thì chép lại và đổi tên môn, nguồn.
