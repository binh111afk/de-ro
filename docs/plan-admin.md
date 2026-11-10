# Kế hoạch trang Admin

Viết ở phiên 27 (10/11/2026) sau khi xem code và Supabase. **Chưa có dòng code nào.** Phiên sau đọc file này rồi bắt đầu từ Giai đoạn 1.

## Quyết định đã chốt với người dùng

- Làm **trong repo này**, ở đường dẫn `/admin`. Trang nạp lười (`lazy`) nên người dùng thường không phải tải thêm gì.
- Mọi thao tác quyền cao đi qua **API phía server** kiểm tra quyền admin. Code giao diện admin nằm trong file JS công khai, nên ẩn nút trên giao diện không được tính là bảo mật. Key `service_role` của Supabase chỉ dùng ở server.

## Hiện trạng (đã kiểm)

Supabase project **`dethinhbien`** (id `ddcyhsxytbcdpgpggexh`, ap-southeast-1). Các bảng trong `public`, đều đã bật RLS:

| Bảng | Nội dung | Ghi chú cho admin |
|---|---|---|
| `user_items` (owner_id, kind, id, data jsonb, updated_at) | Dữ liệu đồng bộ của người dùng (`src/lib/sync.ts`). `kind`: `doc` (đề), `deck` (slide), `online` (đề online), `upload`… | **Đếm số đề và slide** được bằng `kind` + `updated_at`. Bảng không có `created_at`, nên "số tạo mới mỗi ngày" phải thêm cột hoặc ghi sự kiện riêng. |
| `community_exams` | Đề cộng đồng (`listed` = đang hiện) | Duyệt và gỡ: đặt `listed=false` hoặc xoá. Chưa có cột trạng thái duyệt hay lý do gỡ. |
| `exam_attempts` | Lượt làm bài đề link | Thống kê lượt làm bài. |
| `user_documents` | Tài liệu tải lên (name, mime, size, url) | File nằm trên R2 (`server/r2.ts`, `api/files.ts`). Xoá tài liệu thì phải xoá cả file trên R2. |
| `ai_usage` (user_id, month, tokens, requests) | Token AI đã dùng theo tháng | Chỉ server ghi, qua RPC `add_ai_usage`. **Không ghi theo model**, nên chưa tính được chi phí từng model. |
| `ai_quota_overrides` (user_id, monthly_tokens, note) | Hạn mức riêng (null = không giới hạn) | Hiện thêm bằng SQL tay. Admin "cộng điểm AI" sẽ ghi vào đây. |

Những thứ khác đã có:
- **Tài khoản:** Supabase Auth (`auth.users`). Chưa có bảng `profiles`, chưa có cột role, chưa có cờ khoá tài khoản.
- **Kiểm tra token người gọi:** `server/guard.ts` gọi `auth/v1/user` và có cache. Admin API dùng lại phần này.
- **Hạn mức AI:** `server/aiQuota.ts`, mặc định lấy từ env `AI_MONTHLY_TOKENS`.
- **Ngân hàng câu hỏi:** đang nằm **cứng trong code**, ở `src/data/bank.ts` và `bankThpt*.ts` (khoảng 1,6MB, 1198 câu). Không có bảng nào. Muốn sửa câu qua admin thì phải chuyển ngân hàng lên Supabase, xem Giai đoạn 4.
- **Log LLM:** `writeRawLog` trong `server/llmProxy.ts` chỉ ghi file tạm ở máy dev, trên Vercel tắt. Production hiện **không lưu** model nào được dùng, model nào lỗi, hay chi phí bao nhiêu.
- **Vercel:** `api/` đang có 8 function. Gói Hobby giới hạn khoảng 12 function, nên **gom toàn bộ admin vào một file `api/admin.ts`** và chia việc theo tham số `?action=`. Không tạo mỗi việc một file.

## Việc cần làm theo giai đoạn

### Giai đoạn 1: Nền tảng + Người dùng

1. **Migration** `supabase/migrations/2026xxxx_admin.sql`:
   - Bảng `user_roles (user_id pk, role text check in ('admin','moderator'), created_at)`. Bật RLS, không tạo policy nào, chỉ service role đọc được.
   - Bảng `user_flags (user_id pk, banned boolean, banned_reason text, banned_at, banned_by)`. Hoặc dùng `ban_duration` có sẵn của Supabase Auth Admin API (`PUT /auth/v1/admin/users/{id}` với `ban_duration`). Nên dùng cách của Auth: tài khoản bị khoá không đăng nhập được, token cũ hết hạn là thôi.
   - Bảng `admin_audit (id, admin_id, action, target, detail jsonb, created_at)`.
   - Thêm chủ app vào `user_roles` bằng SQL, giống cách đang làm với `ai_quota_overrides`.
2. **`server/admin.ts` + `api/admin.ts`:**
   - Hàm `requireAdmin(req, role?)`: lấy user từ token qua `guard`, tra `user_roles`. Sai quyền thì trả 403.
   - Mỗi thao tác ghi một dòng vào `admin_audit`.
   - Các action:
     - `users.list`: tìm theo email, phân trang. Dùng `GET /auth/v1/admin/users`, ghép thêm token đã dùng tháng này, số đề, số slide.
     - `users.ban` và `users.unban`.
     - `users.delete`: xoá qua Auth Admin API. Các bảng có `on delete cascade` sẽ tự xoá theo, nhưng file trên R2 phải xoá riêng. Bắt nhập lại email để xác nhận.
     - `quota.grant`: cộng điểm AI. Đặt hoặc tăng `ai_quota_overrides.monthly_tokens`, hoặc trừ bớt `ai_usage.tokens` của tháng này. Cần chốt với người dùng "điểm AI" nghĩa là gì.
3. **Giao diện `/admin`:**
   - Route mới, lazy, layout riêng với menu trái: Tổng quan, Người dùng, Nội dung, Ngân hàng, AI & Server, Nhật ký.
   - Người không có quyền mở `/admin` thì thấy trang 404, không lộ ra là có trang admin.
4. **Test:** script kiểm `requireAdmin`. Không token, user thường và moderator gọi action của admin đều phải nhận 403.

### Giai đoạn 2: Vận hành

1. **Khoá web khi bảo trì + dải thông báo:**
   - Bảng `app_settings (key pk, value jsonb)`, RLS cho phép ai cũng đọc, chỉ service role ghi. Hai key: `maintenance` = {on, message, until} và `banner` = {text, level}.
   - App đọc khi khởi động: maintenance bật mà người xem không phải admin thì hiện trang "Đang bảo trì".
   - API AI và upload cũng kiểm tra `maintenance` ở server.
2. **Tình trạng server:** action `health` gọi thử từng provider LLM với một prompt rất ngắn, đo độ trễ, kèm kiểm tra Supabase và R2. Chỉ chạy khi admin bấm, không chạy định kỳ (tốn tiền).
3. **Thống kê và chi phí model:**
   - Bảng `ai_calls (id, user_id, model, provider, ok, error, prompt_tokens, completion_tokens, cost, ms, created_at)`.
   - `llmProxy` ghi một dòng mỗi lần gọi, cả lần lỗi lẫn lần rơi xuống dự phòng.
   - Giá: opencode trả `usage.opencode.list_cost`; NightRouter dùng header `x-si-buyer-cost-micro`, đơn vị chưa rõ; còn lại tính theo bảng giá đặt trong code.
   - Admin xem chi phí theo ngày và theo model, tỉ lệ lỗi, các lỗi gần đây.
4. **Cảnh báo chi phí** (làm sau): vượt ngưỡng mỗi ngày thì gửi email.

### Giai đoạn 3: Nội dung

1. **Đề cộng đồng:**
   - Danh sách, xem trước, gỡ (`listed=false` + lý do), xoá.
   - Thêm cột `status` ('published' | 'hidden' | 'removed') và `removed_reason`.
   - Moderator làm được phần này.
2. **Báo cáo vi phạm:** bảng `reports (id, exam_id, reporter_id, reason, status, created_at)`, nút "Báo cáo" ở trang đề cộng đồng, admin xem hàng chờ.
3. **Tài liệu tải lên:** danh sách `user_documents` (tên, người tải, dung lượng, ngày), xem và xoá (xoá cả file trên R2). Tổng dung lượng theo người dùng.
4. **Góp ý người dùng:** bảng `feedback`, ô "Góp ý" trong app, admin đọc được.

### Giai đoạn 4: Ngân hàng câu hỏi

1. **Chuyển ngân hàng lên Supabase:**
   - Bảng `bank_questions (id, subject, grade, chapter, level, kind, data jsonb, status, updated_at, updated_by)`.
   - Script nạp 1198 câu từ `src/data/bank*.ts`.
   - Trang dùng ngân hàng (`BankModal`) đổi sang đọc từ API, có cache.
   - Giữ file tĩnh làm dự phòng khi API lỗi, hoặc bỏ hẳn. Chốt với người dùng.
2. **Admin ngân hàng:** lọc theo môn, lớp, chương, độ khó; sửa; ẩn; xoá; đếm số câu theo ô.
3. **Editor thêm câu:** dùng lại khung soạn câu đã có (TipTap ở `src/examEditor`, ô ảnh câu hỏi `QuestionImageField`, công cụ vẽ). Xem trước bằng `QuestionBody`. Có thể thêm nút "AI soạn nháp" rồi admin duyệt; quy trình soạn câu xem `scripts/bank/HUONG_DAN_SOAN.md`.

### Giai đoạn 5: Số liệu

1. **Thống kê người dùng:** tổng số, đăng ký mới theo ngày (`auth.users.created_at`), hoạt động 7 và 30 ngày (dùng `last_sign_in_at`, hoặc `updated_at` của `user_items`).
2. **Số đề và slide được tạo:** thêm cột `created_at default now()` vào `user_items`. Dữ liệu cũ chỉ có `updated_at` nên không biết ngày tạo thật. Đếm theo `kind`.
3. **Traffic:** bật Vercel Web Analytics (`@vercel/analytics`), xem trên dashboard của Vercel. Muốn hiện trong admin thì gọi API của Vercel; MCP Vercel có `aggregate_pageviews`.
4. **Số người đang online:**
   - Cách nhanh: Supabase Realtime presence, gói Free cho tối đa 200 kết nối đồng thời.
   - Cách rẻ: app gửi tín hiệu mỗi 60 giây vào bảng `presence (session_id pk, user_id, last_seen)`, admin đếm số dòng có `last_seen` trong 2 phút gần nhất.

## Gợi ý đã đồng ý thêm vào

Nhật ký thao tác admin, phân quyền admin/moderator, báo cáo vi phạm, dải thông báo, lỗi AI gần đây, góp ý người dùng, cảnh báo chi phí (làm sau). Các mục này đã được xếp vào những giai đoạn ở trên.

## Chia việc (người dùng dặn)

- **Claude (phiên chính) làm logic:** migration, `server/admin.ts` và `api/admin.ts`, kiểm tra quyền, nhật ký, ghi `ai_calls` trong `llmProxy`, chuyển ngân hàng lên Supabase, và nối API vào giao diện.
- **Giao diện giao cho agent nhỏ hơn (Antigravity CLI) dựng**, theo đúng style của web:
  - Viết prompt vào `docs/prompt-admin-ui.md`, theo mẫu các file `docs/prompt-*.md` đã có.
  - Prompt chỉ rõ: dùng component sẵn có (`src/components/ui.tsx`, `Button`, `Segmented`, `Scroll`), token màu và lớp Tailwind đang dùng (`bg-surface`, `border-line`, `text-ink`/`ink-2`/`ink-3`, `clay`, `sage`, `rounded-[6px]`/`[8px]`), font Be Vietnam Pro, icon `lucide-react`. Lấy một trang có sẵn làm mẫu, ví dụ `src/pages/OnlineBuilder.tsx` hoặc `src/pages/Library.tsx`.
  - Agent chỉ dựng màn hình với dữ liệu giả (mock) theo đúng **kiểu dữ liệu Claude định nghĩa trước**, ví dụ `src/lib/adminApi.ts` có các type và hàm trả mock. Agent không đụng vào `server/`, `api/`, migration.
  - Agent làm trên worktree hoặc nhánh riêng. Claude review (tsc, xem trên dev server ở 1440px và 360px), rồi thay mock bằng API thật và merge.
- Thứ tự mỗi giai đoạn: Claude chốt type + API, rồi đưa prompt cho agent dựng UI; trong lúc agent làm, Claude viết server; xong thì Claude nối hai phần và kiểm tra.

## Cần hỏi người dùng trước khi làm

1. "Cộng điểm AI" nghĩa là gì: tăng hạn mức tháng (`monthly_tokens`), tặng một lượng token dùng một lần, hay trừ bớt số đã dùng?
2. Admin là email nào? Có cần moderator ngay không?
3. Ngân hàng câu hỏi chuyển hẳn lên Supabase, hay giữ file tĩnh làm dự phòng?
4. Xoá tài khoản thì xoá luôn đề cộng đồng của họ, hay giữ lại và đổi tác giả thành "ẩn danh"?

## Lưu ý kỹ thuật

- Migration viết vào `supabase/migrations/` như các file đang có, rồi chạy bằng MCP Supabase `apply_migration` (người dùng duyệt). Đừng sửa schema bằng tay trên dashboard nữa: các bảng gốc hiện không có file migration nào trong repo.
- Auth Admin API (`/auth/v1/admin/*`) cần key `service_role`. Env server đã có `SUPABASE_SERVICE_ROLE_KEY` (`aiQuota.ts` đang dùng).
- Mọi danh sách đều phải phân trang, không kéo cả bảng.
- Thao tác không hoàn tác được (xoá tài khoản, xoá đề, xoá câu) bắt xác nhận bằng cách gõ lại tên hoặc email.
