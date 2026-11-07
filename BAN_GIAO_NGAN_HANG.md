# Bàn giao: mở rộng ngân hàng câu hỏi (phiên 23 → phiên sau)

Đọc `context.md` trước để nắm dự án. File này chỉ nói phần việc ngân hàng câu hỏi.

## Trạng thái hiện tại

- Commit `665d8e7` (đề AI mặc định khó hơn, có câu chốt chặn): **chưa push**.
- **Chưa commit**: phần ngân hàng 601 câu.
  - `src/data/bankThpt.ts`: 453 câu mới. Toán 270, Lý 60, Hoá 58, Sinh 30, Anh 35. Có 125 câu có hình.
  - `src/data/bank.ts`: thêm `loadFullBank()`, nạp lười `bankThpt` để bundle chính không nặng thêm.
  - `src/examEditor/BankModal.tsx`: hiển thị câu đúng/sai và trả lời ngắn; dùng `loadFullBank`.
  - `src/examEditor/bankQuestions.ts`: chèn câu `dung-sai` (kind `tf`) và `tra-loi-ngan` (kind `short`).
  - `src/pages/Home.tsx`: số câu hiển thị là 601.
- Nguồn và công cụ dựng nằm ở `C:\Users\Lenovo\AppData\Local\Temp\claude\f08747db4c79f08f\dbf70dfd-adef-4f30-82ad-98198d2d81f9\scratchpad\bank\`:
  - `BRIEF.md` (định dạng Toán), `BRIEF_MON.md` (các môn khác), `VERIFY.md` (cách kiểm).
  - `build.mjs`: gộp JSON → `bankThpt.ts`, kiểm định dạng, gán điểm. Chạy lại sẽ ghi đè comment đầu file bằng header cũ chỉ nói Toán, nhớ sửa lại.
  - 16 file JSON nguồn, `fix1.mjs`, `fix2.mjs`.
  - Thư mục này là thư mục tạm. Nên chép sang chỗ cố định trước khi dùng tiếp.

## Việc cần làm

### 1. Chip độ khó cho mọi câu

- Thêm chip **Dễ / Trung bình / Khó** vào thẻ câu và phần xem chi tiết trong `BankModal`, kèm bộ lọc "Độ khó".
- 453 câu mới có tag mức độ: NB và TH → Dễ, VD → Trung bình, VDC → Khó.
- 148 câu cũ trong `bank.ts` chưa có mức độ, phải tự đọc từng câu để đánh giá.

### 2. Soạn thêm 500 câu bằng ZCode (GLM 5.3 Flash)

- Người dùng **không muốn** dùng subagent Haiku hay Sonnet vì tốn token.
- Mở app ZCode bằng computer use (`C:\Users\Lenovo\AppData\Local\Programs\ZCode\ZCode.exe`, thường đã mở sẵn), chọn **Start Plan → GLM 5.3 Flash**.
- Đừng dùng CLI `zcode -p`: nó luôn gọi nhầm `deepseek/deepseek-v4-pro` qua Xkiro rồi lỗi. File `~/.zcode/v2/provider_config.json` có bản sao lưu `.bak-claude`.
- Số câu cần soạn:

  | Môn | Số câu |
  |---|---|
  | Toán | 150 |
  | Lý | 120 |
  | Hoá | 130 |
  | Sinh | 50 |
  | Anh | 50 |
  | Sử | 30 |
  | Địa | 30 |
  | Tin | 20 |
  | GDKT&PL | 20 |

  Cách chia 200 câu "môn khác" là đề xuất, người dùng chưa chốt. Hỏi lại nhanh nếu cần.
- Trộn đủ 3 độ khó và đủ các dạng: trắc nghiệm, đúng/sai, trả lời ngắn (đáp án ≤ 4 ký tự, dấu phẩy thập phân).
- Bảo GLM soạn theo `BRIEF.md` / `BRIEF_MON.md`, mỗi lần một lô nhỏ khoảng 20–30 câu, lưu ra file JSON.

### 3. Tự kiểm tra (bắt buộc, Claude tự làm)

- **Đáp án**: tự giải lại từng câu. GLM Flash dễ sai, nhất là câu VD/VDC và câu tính số. Sửa hoặc bỏ câu sai.
- **Câu có hình: kiểm thật kỹ.**
  - Hình phải vẽ ra được: render trên dev server (`preview_start` "dev", cổng 5185), mở ngân hàng câu hỏi, xem từng hình.
  - Hình phải đúng và ăn khớp với đề: cùng tên điểm, số liệu, kí hiệu; đủ những gì đề nhắc tới; không lộ đáp án; tỉ lệ hợp lý.
  - Câu nào nhắc "hình vẽ", "đồ thị", "bảng" thì bắt buộc phải có `figure`.
  - Không chắc một dạng hình nên trông thế nào thì search web hoặc xem đề thật trên **mapstudy.edu.vn** (dùng trình duyệt trong app) để đối chiếu cách vẽ trong đề thật.
  - Lỗi tool vẽ đã gặp:
    - Biểu đồ `stats`: nhãn phải ngăn bằng `;`.
    - Mạch điện `circuit`: hỏng khi số thập phân dùng dấu phẩy, viết `0.5 Ω` thay cho `0,5 Ω`.
    - Định dạng hình xem `FIGURE_GUIDE` trong `src/lib/docRewrite.ts`; hàm vẽ ở `src/examEditor/toolImages.ts`.
- Gộp bằng `build.mjs`, rồi chạy `npx tsc -p tsconfig.app.json --noEmit`.
- Chỉ commit khi người dùng bảo.

## Cập nhật phiên 24 (07/11/2026)

- GLM 5.3 Flash (ZCode) soạn 600 câu theo `scripts/bank/YEU_CAU_500.md` (bảng lô cộng lại 600) → `scripts/bank/new/*.json`; bản gốc chưa sửa ở `scripts/bank/new.orig/`.
- Claude tự giải lại toàn bộ: sửa đáp án ~30 câu, sửa đề/hình mơ hồ, bỏ 3 câu (1 trùng, 2 vô nghĩa). Các sửa nằm trong `fix3.mjs`, `fix3b.mjs` (lời giải), `fix3c.mjs` (hình) — chạy theo thứ tự trên bản gốc nếu cần dựng lại.
- Gộp: `node build.mjs new ../../src/data/bankThpt2.ts BANK_THPT2` → 597 câu, 62 hình (đã xem từng hình trên dev server). `loadFullBank()` nạp cả `bankThpt` và `bankThpt2`; kho tổng 1198 câu.
- Thêm môn `GDKT&PL` vào `Subject`/`SUBJECTS`.
- Chip độ khó: `src/data/bankLevel.ts` (`levelOf`): tag NB/TH → Dễ, VD → Trung bình, VDC → Khó; câu cũ theo loại câu + bảng ghi đè đánh giá tay. `BankModal` có chip ở thẻ và chi tiết, thêm bộ lọc "Độ khó".
- Graph trong kho/AI giờ nhận `yMin`/`yMax` nếu ghi sẵn (`docRewrite.ts`).
- Câu cũ trong `bank.ts` có lỗi nội dung thấy khi đánh độ khó (vd nv-09 "Lạc Long Quân (Nguyễn Du)", ls-05 "Đại hội XI (1/1976)", vl-14 là bài toán đại số nằm ở môn Lý): chưa sửa.
- Chưa commit.
