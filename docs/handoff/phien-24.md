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

### 4. Kiểm công cụ "Bảng ghép nhóm" (agent khác làm, Claude kiểm)
- **Người làm**: một agent khác trong dự án, theo prompt Claude đưa ở phiên 24. Agent làm trên nhánh **`feat/bang-ghep-nhom`**, tách từ `feat/trig-7-tinh-nang` để tránh xung đột `docRewrite.ts` / `MoreToolModals.tsx`. Commit `feat(tools): công cụ Bảng ghép nhóm`, đã push, không merge. Nếu nhánh chưa có trên remote thì agent chưa làm xong, hỏi người dùng.
- **Agent được giao**: kind `grouped`, tên "Bảng ghép nhóm", nằm trong nhóm Toán cạnh "Thống kê".
  - Nhập mỗi dòng một nhóm `[a; b): tần số` (nhóm cuối có thể là `[a; b]`, dấu phẩy thập phân), kèm tên đại lượng và tên tần số.
  - Ba kiểu hiển thị: bảng ngang (mặc định), bảng dọc, biểu đồ cột liền (tuỳ chọn đa giác tần số).
  - Hàng phụ tuỳ chọn: giá trị đại diện, tần số tích luỹ, tần số tương đối, tổng n.
  - Ô "Tính giúp" chỉ hiện trong form: trung bình, trung vị, Q1, Q3, mốt, khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn. Viết thành hàm thuần, test ở `scripts/check-grouped.ts`.
  - Đủ 7 chỗ của một công cụ, gồm cả FIGURE_GUIDE và toolFromRaw.
  - Không sửa câu cũ trong kho, chỉ đếm các câu ghép nhóm đang vẽ bằng `stats` `hist`.
- **Cách kiểm** (làm trên nhánh `feat/bang-ghep-nhom`; trước khi checkout xem `git status` để không đè việc dở):
  1. `git diff feat/trig-7-tinh-nang...feat/bang-ghep-nhom --stat`: chỉ có các file của công cụ (đủ 7 chỗ) cộng file test. Không sửa lan sang chỗ khác.
  2. `npx tsc -p tsconfig.app.json --noEmit`.
  3. **Công thức**: tự tính tay một mẫu SGK để đối chiếu với `check-grouped.ts`. Hay sai ở: trung vị/Q1/Q3 lấy sai nhóm (phải là nhóm đầu tiên có tần số tích luỹ ≥ k·n/4); mốt khi nhóm mốt nằm ở đầu hoặc cuối (n_{m−1} hoặc n_{m+1} lấy bằng 0); phương sai phải chia cho n (SGK), không phải n−1; nhóm có độ rộng không đều.
  4. **Hình** trong trình duyệt: cả 3 kiểu hiển thị, có 8–10 nhóm không tràn khung, dấu phẩy thập phân, histogram cột sát nhau và mốc trục đúng đầu mút. Bảng phải giống SGK (ô "Nhóm"/"Tần số" ở đầu hàng). Kết quả "Tính giúp" **không** xuất hiện trên hình.
  5. Nhập sai cú pháp thì báo lỗi rõ ràng, không trắng trang. Dữ liệu cũ khi mở lại công cụ không mất.
  6. Xuất Word một đề có hình này (ảnh PNG có mặt, rõ nét); in hoặc xem trước.
  7. AI: soạn một câu Toán 11 về trung vị mẫu ghép nhóm. AI phải dùng `grouped` với cú pháp đúng như FIGURE_GUIDE. Kho câu hỏi: một câu có `figure` kind `grouped` hiển thị đúng trong BankModal.
- **Sau khi đạt**: báo người dùng. Nếu người dùng đồng ý thì chuyển các câu ghép nhóm trong kho sang `grouped`, bao gồm các câu ghép nhóm trong 600 câu ở mục 2. Thứ tự merge dự kiến: trig, rồi bảng ghép nhóm, rồi main. Chỉ merge khi người dùng bảo.

### Việc tồn từ phiên 23
Xem [phiên 23](phien-23.md), mục "Còn lại" (lỗi nội dung câu cũ trong bank.ts, nhãn signtable f'(x)).

## Ghi chú
- Kích cỡ kho câu hỏi: mức "ổn" là khoảng 600 câu cho mỗi lớp mỗi môn Toán. Quan trọng hơn là phân bố đều theo chủ đề × dạng câu × độ khó. Sau khi gộp 600 câu nên đếm theo các ô này để thấy ô nào còn thiếu.
- Prompt mẫu cho agent ngoài soạn khung chương trình nằm trong transcript phiên 24. Muốn làm môn khác thì chép lại và đổi tên môn, nguồn.
