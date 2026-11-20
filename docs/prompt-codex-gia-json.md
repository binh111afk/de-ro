# Việc cho Codex: chuyển sửa bảng giá + nhập JSON cho ngân hàng câu hỏi

Đọc `AGENTS.md` và `context.md` trước. Không commit, không push, không thêm thư viện. File CRLF: sửa bằng công cụ sửa file, không dùng `sed -i`; sau khi sửa chạy `git ls-files --eol <file>` và `git diff --stat` (file chỉ đổi vài dòng mà báo hàng trăm dòng là hỏng). UI tiếng Việt, không thêm chữ thừa, dùng lại component có sẵn (`Segmented`, `Button`, `dialog`, `Card`, `inputClass`).

## Việc 1 — Chuyển bảng giá sang mục Nạp điểm (admin)

Hiện `PricingEditor` (`src/pages/admin/PricingEditor.tsx`) nằm trong `src/pages/admin/OpsPanel.tsx` (dòng ~493, nhận `settings.pricing` đã tải trong OpsPanel). Mục Nạp điểm là `PaymentsPanel` (`src/pages/admin/PaymentsPanel.tsx`, route `nap-diem` ở `AdminLayout.tsx`).

Làm:
- Bỏ `<PricingEditor …/>` khỏi OpsPanel (xoá import thừa nếu không còn dùng).
- Trong `PaymentsPanel` thêm nút chuyển (dùng `Segmented`) giữa hai chế độ: "Đơn nạp" (nội dung hiện tại) và "Bảng giá" (hiện `PricingEditor`). Mặc định "Đơn nạp".
- `PaymentsPanel` phải tự tải settings như OpsPanel làm (xem cách OpsPanel gọi API lấy `AppSettings`, tái dùng hàm trong `src/lib/adminApi.ts`), chỉ tải khi mở tab Bảng giá. `onNotice` dùng `dialog` hoặc cơ chế thông báo tương tự OpsPanel đang dùng (`showNotice`).
- Không đổi hành vi lưu của `PricingEditor`.

## Việc 2 — Nhập JSON vào ngân hàng câu hỏi (admin)

Mục Ngân hàng: `src/pages/admin/BankPanel.tsx`, panel nhập/tạo bản nháp bằng AI: `src/pages/admin/BankAiPanel.tsx`, logic nhập: `src/lib/bankImport.ts` (kiểu `BankDraft`, `toDraft`, `draftReady`, `importDrafts` nhận file, `RawQuestion`). Bản nháp sau khi tạo hiện trong danh sách để duyệt rồi lưu qua `onSaveDrafts`.

Làm:
- Thêm hàm `parseJsonDrafts(text: string): { drafts: BankDraft[]; warning?: string }` trong `bankImport.ts`: parse JSON (chấp nhận mảng câu hỏi, hoặc object có `questions`), dùng `toDraft` cho từng phần tử; báo lỗi rõ khi JSON sai cú pháp hoặc không có câu hợp lệ (nêu số câu bị bỏ, vị trí câu đầu bị lỗi). Định dạng mỗi câu theo `RawQuestion` hiện có (`type`, `prompt`, `options` [{key,text}], `answer`, `explanation`, `solution`, `image`…) — đọc kiểu đó để khớp, đừng tự đặt trường mới.
- Trong `BankAiPanel` thêm cách nhập JSON: nút chọn file `.json` (đọc text) và ô dán JSON (textarea) với nút "Nhập"; kết quả đi vào cùng danh sách bản nháp như các cách nhập khác (dùng lại hàm `run` và hiển thị `warning`). Không gọi AI, không tốn điểm.
- Thêm test nhỏ `scripts/test-bank-json.ts` (theo kiểu các script test khác trong `scripts/`, chạy bằng tsx; nếu `bankImport.ts` import alias `@/` mà tsx không hiểu thì tách `parseJsonDrafts` + phần cần thiết ra file thuần không alias, hoặc test logic qua cách các test hiện có làm) và thêm `"test:bank-json"` vào `package.json`. Test: mảng hợp lệ, object `{questions}`, JSON hỏng, câu thiếu trường.

## Kiểm

- `npx tsc -p tsconfig.app.json --noEmit` phải sạch.
- `npm run test:bank-json` phải qua.
- Không chạy dev server nếu không cần.

## Báo cáo

Liệt kê file đã sửa, kết quả tsc + test, và việc nào chưa kiểm (giao diện chưa chạy thử trên trình duyệt thì nói rõ).
