# Phiên 30 (11/11/2026): cấu hình AI trong admin, AI soạn câu và tách đề, xoá nhiều đề

Tiếp [phiên 29](phien-29.md). Mọi thứ dưới đây **đã lên `main`**. Migration `20261117_ai_provider_settings` **đã áp**.

## Bắt đầu phiên sau
1. Đọc `context.md`, rồi file này. File lớn (`BankPanel`, `StartTab`) dùng `grep -n` rồi đọc đoạn cần.
2. **Việc người dùng phải làm trên Vercel:** đặt `AI_SETTINGS_SECRET` (≥ 32 ký tự). Không có thì lưu cấu hình provider sẽ lỗi. Tuỳ chọn `AI_ENDPOINT_ALLOWED_HOSTS` (danh sách host được phép đổi endpoint), xem `.env.example`.
3. Dev server để chạy sẵn ở cổng 5184; người dùng không muốn bị tắt.

## Đã làm
- **Hiệu ứng admin:** ngăn kéo trượt (`useDrawerExit.ts`), chuyển tab/trang, thanh menu dính khi cuộn (`AdminLayout`).
- **Kiểm tra tình trạng** (`HealthDrawer`, `OpsPanel`): nút kiểm riêng từng dịch vụ, vẫn giữ "Kiểm tra tất cả". Bấm một provider AI mở panel sửa endpoint, key, model; Lưu là đổi cho cả app và ghi nhật ký (`ai.saveProvider`, `ai.resetProvider`). Supabase, R2 chỉ xem.
  - Lưu ở bảng `ai_provider_settings` (RLS bật, không policy, chỉ service role). Key mã hoá AES-256-GCM (`server/aiSettings.ts`). `llmProxy.liveConfig()` gộp env + override, cache 30 giây.
  - Chống SSRF: allowlist host, `assertSafeEndpoint` tra DNS chặn IP nội bộ (cả IPv6 ánh xạ, NAT64), fetch dùng `redirect:'error'`.
- **Thẻ DB:** CPU tính bằng `node_load1 / số nhân` (metrics Supabase chỉ làm mới ~60 giây nên lấy 2 mẫu không được), số kết nối tối đa lấy từ metrics. RAM ~65% là bình thường ở gói Nano (shared_buffers chiếm phần lớn); nhiều người dùng thì nâng compute Supabase, không cần đổi nhà cung cấp.
- **Thêm câu ngân hàng:** form toàn màn hình 2 cột, "Lưu và thêm câu tiếp", Ctrl+Enter.
- **Tab "AI và tệp"** (`BankAiPanel.tsx`, `src/lib/bankImport.ts`, `server/bankVision.ts`):
  - AI soạn 1-20 câu theo yêu cầu (`callLlm`).
  - Tách đề từ Word (.docx: `readImportFile` + `parseExamText`), PDF/ảnh (pdf.js dựng trang ở client, tối đa 12 trang, gửi 2 trang/lần tới `/api/admin?vision=1`, body 4 MB, kiểm admin **trước** khi đọc body). Thứ tự model đọc ảnh: fosta → xkiro → anthropic. Hình được cắt theo khung AI trả về rồi tải lên.
  - Mỗi câu nháp chia Câu hỏi / Đáp án / Ảnh, sửa được ở tab Soạn tay, câu thiếu đáp án không chọn lưu được.
  - Word 800 câu chạm giới hạn 60k ký tự và mất bảng đáp án; 150 câu vẫn ổn.
  - `vercel.json`: `api/admin.ts` maxDuration 180.
- **Tab Bắt đầu của trình soạn** (`StartTab.tsx`, `compose.css`): xoá đề có hộp xác nhận; chọn nhiều đề kiểu Gmail (ô tick hiện khi rê chuột, Shift chọn đoạn, thanh "Đã chọn N · Chọn tất cả · Xoá · Bỏ chọn"). Ô tick ở dòng tiêu đề **chỉ bật chế độ chọn**, không chọn hết (người dùng yêu cầu).

## Còn lại
- Đặt `AI_SETTINGS_SECRET` trên Vercel (người dùng làm).
- Đề Word rất dài (> ~60k ký tự) mất phần đáp án: có thể chia tệp theo đoạn nếu người dùng cần.
- Moderator mở Tổng quan vẫn bị 403 ở `users.list`, `ai.stats` (từ phiên 29).
