# Phiên 57 (25/11/2026) — thử AI thật, sửa lỗi, gộp `refactor/ai` vào `main`

## Việc phiên sau: thử trên bản chạy thật

`refactor/ai` đã gộp vào `main` (`16c5ba4`) và cùng bản sửa slide (`4757030`) đã push; Vercel báo Ready, `/soan-de` trả 200. **Chưa đăng nhập thử trên web thật.** Nên thử:

- Soạn đề, hỏi đáp, sửa đề; "Thay cả đề…" → nút "Thay cả đề" / "Giữ đề cũ".
- Đính kèm đề dài khi đề đang mở có nội dung → bảng hỏi "thay đề" hay "chỉ thêm vài câu".
- Sửa slide, gồm "chữ nhiều quá"; xem điểm có được hoàn cho lượt gọi lại (máy dev bỏ qua điểm nên chưa kiểm).
- Admin bấm "Kiểm tra" provider `glm` ở AI & Server.
- Tạo đề online: "Lấy link cho học sinh" rồi mở link bằng cửa sổ ẩn danh (máy dev không đăng nhập nên chưa thử tạo link thật).

## Đã làm (sau lần ghi đầu, đã push tới `335c83c`)

- Thêm lại nút lấy link chỉ-link, không đăng cộng đồng (bị gỡ từ phiên 13): màn "Đề đã tạo xong" và thẻ Lịch sử tạo đề (`e6332ca`).
- Trang Đề cộng đồng: nút sao chép link trên thẻ và dòng (`CopyLinkButton` trong `src/components/CopyLink.tsx`, `f727393`). Link `/de-online/<id>` đưa người mở vào làm bài ngay (hành vi cũ). Dạng danh sách chưa xem bằng mắt.
- Sửa công thức mất dấu `\` trong đề mẫu, ngân hàng THCS / THPT, khung chương trình (`950b528`). Câu giáo viên đã chép vào đề của họ trước đó vẫn giữ công thức cũ.
- agy sửa file nguồn (`scripts/bank/new/`, `scripts/khung/ban-goc/`) và thêm **`npm run test:formulas`**; gộp ở `335c83c`. Sửa / thêm dữ liệu câu hỏi hay khung thì chạy test này.

## Đã làm trước đó

- agy thử nhánh `refactor/ai` + `main` trên máy dev: `eval:ai` 30/30. Báo cáo: `eval-out/agy-ai-worktree/agy-bao-cao-ai-that.md` (chỉ có trên máy này).
- AI viết lại cả đề khi không chắc người dùng muốn thay: không vứt kết quả, hỏi "Thay cả đề" / "Giữ đề cũ" (`needsConfirm` trong `examAiResult.ts`, nút ở `AiPanel.tsx`). `rewritesWholeExam` nhận thêm "thay / đổi cả đề".
- Đề nguồn dài trong khi đề đang mở có nội dung: hỏi trước rồi mới chia lượt (`SPLIT_ASK` ở `AiPanel.tsx`). Bỏ input `revising` khỏi prompt soạn đề.
- Sửa slide: nội dung quá dài / thiếu field thì gọi lại một lần kèm lỗi cụ thể trước khi áp (`EditResult.rejected`, `onCheckEdits`, `slideFlow.ts`). Prompt `slide-sua`: chê nhiều chữ thì phải bớt chữ. Đo thật: slide 417 → ~220–270 chữ; trên web một ca chỉ bớt ~29%.
- Xoá nhánh `refactor/ai` (`cef096a`, cả GitHub), `feat/test-de-tuong-tac` (`70b21ae`) và worktree `dethinhbien-agy-ai`. Repo chỉ còn `main`.

**Quyết định người dùng:** không vứt kết quả AI dựa trên đoán từ khoá; chỗ nào không chắc thì hỏi người dùng.

## So DeepSeek và GLM (đề Toán, mức `low`)

- Câu lỗi: DeepSeek 1/64, GLM 7/80 (giám khảo là AI).
- Giá một đề 8 câu: DeepSeek ≈ 0,0059 USD (giờ thấp điểm) / 0,012 (cao điểm), GLM ≈ 0,0038.
- Giữ thứ tự chuỗi như cũ. Dữ liệu thô: `eval-out/agy-ai-worktree/so-model/`.

## Còn lỗi, chưa sửa

- Vẽ hình thất bại nhưng câu "như hình bên" vẫn vào đề.
- Bảng vẽ: sơ đồ tự do báo đã vẽ mà không có gì (agy báo, chưa tự kiểm).
- Bảng hỏi lại đang mở thì che ô nhập (do thiết kế, chờ người dùng quyết).
- GLM ở mức `low` có câu Toán sai đáp án.
- Có sẵn từ trước: `npm run test:pricing` hỏng (thiếu export `boughtPacks`); `npm run build` (`tsc -b`) báo 77 lỗi kiểu (Vercel chỉ chạy `vite build` nên vẫn deploy được).

## Bẫy

- Khung trình duyệt bị ẩn thì `requestAnimationFrame` đứng → báo giả "Đề đã thay đổi trong khi AI xử lý". Vá trong trang: `window.requestAnimationFrame = f => setTimeout(() => f(performance.now()), 16)` trước khi mở đề.
- Worktree dùng junction `node_modules` thì đọc PDF bằng ảnh trên dev lỗi giả (`Invalid workerSrc type`).
- Sửa prompt slide: `npm run build:prompts`, rồi cập nhật `len` + `sha256` trong `scripts/fixtures/prompt-slide-snap.json`.
- Ghi LaTeX vào chuỗi JS / JSON phải viết `\\`: `"\frac"`, `"\text"`, `"\ne"` bị đọc thành ký tự điều khiển / xuống dòng. Heredoc của Bash cũng nuốt `\\` → viết script bằng công cụ ghi file.
- Công cụ sửa file có lúc đổi file LF thành CRLF (`CopyLink.tsx`, `bankThpt2.ts`): luôn xem `git diff --stat` sau khi sửa.
