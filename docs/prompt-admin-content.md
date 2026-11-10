# Prompt: Admin giai đoạn 3 — Nội dung (logic + giao diện)

> Đưa nguyên file này cho agent. Có 3 agent chạy song song trên cùng repo, nên **bắt buộc làm trong worktree riêng**, không đổi nhánh ở thư mục gốc:
>
> ```
> git worktree add ../dethinhbien-content -b feat/admin-content main
> cd ../dethinhbien-content
> npm install
> ```
>
> Mọi lệnh sau đó chạy trong `../dethinhbien-content`. Dev server dùng **cổng 5186**: `npm run dev -- --port 5186 --host 127.0.0.1`. Không merge, không push, không áp migration lên Supabase.

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4, Supabase, Vercel). Đọc `context.md` phần đầu, rồi đọc kỹ các file mẫu sau để làm cùng kiểu:
- `server/admin.ts`: API admin một endpoint, POST `{action, ...}`. Cách viết action, `requireAdmin`, ghi nhật ký `audit`, lỗi `HttpError`.
- `src/lib/adminApi.ts`: client gọi API (`post`), dữ liệu giả `?mock=1` (`isAdminMock`, `wait`).
- `src/pages/admin/UsersPanel.tsx`: phong cách giao diện admin (bảng, drawer, `dialog`, `Pager`, thông báo).
- `scripts/test-admin.ts`: cách test API bằng `fetch` giả.

**Khung đã dựng sẵn, chỉ sửa trong các file này** (đã được nối vào app, không cần đăng ký thêm):

| File | Việc |
|---|---|
| `server/adminContent.ts` | thêm action vào `CONTENT_ACTIONS` |
| `src/lib/adminContentApi.ts` | kiểu dữ liệu + hàm gọi API + dữ liệu giả |
| `src/pages/admin/ContentPanel.tsx` | giao diện `/admin/noi-dung` (route `noi-dung/*`, tab con tuỳ ý) |
| `scripts/test-admin-content.ts` | test, chạy `npm run test:admin-content` |
| `supabase/migrations/20261112_admin_content.sql` | tạo mới: bảng/cột cần thêm |

Được sửa thêm (chỉ phần nói dưới đây): `src/pages/Community.tsx`, trang xem đề cộng đồng (`src/pages/ExamView.tsx`), `src/lib/community.ts`, `src/components/Layout.tsx` (ô góp ý).

**Không được sửa**: `server/admin.ts`, `src/lib/adminApi.ts`, `src/pages/admin/AdminLayout.tsx`, `server/adminBank.ts`, `server/adminStats.ts`, các file `*Bank*`/`*Stats*`, `api/` (Vercel Hobby giới hạn số function, **không thêm file vào `api/`**), `vercel.json`, `package.json`.

Bảng đang có (Supabase):
- `community_exams (id uuid, owner_id uuid null, title, subject, grade, school, doc jsonb, created_at, question_count, duration_minutes, total_points, preview, listed bool)`. `listed=false` là đề chỉ mở bằng link.
- `user_documents (id uuid, owner_id uuid, name, mime, size int, url, created_at, subject)`. File nằm trên R2; `deleteR2Object`, `r2KeyFromUrl` trong `server/r2.ts`. **R2 dùng key theo nội dung**: chỉ xoá file R2 khi không còn dòng `user_documents` nào khác trỏ tới cùng `url` (xem action `users.delete` trong `server/admin.ts` làm mẫu).

Quyền: `moderator` làm được phần đề cộng đồng và báo cáo; xoá hẳn đề / xoá tài liệu / đọc góp ý là `admin`. Mọi thao tác thay đổi phải ghi `audit(ctx, action, target, detail)`. Thêm nhãn tiếng Việt cho action mới vào nhật ký bằng cách hiển thị trong ContentPanel (không sửa `AUDIT_LABEL` trong adminApi.ts).

## Yêu cầu

### 1. Migration `20261112_admin_content.sql`
- `community_exams`: thêm `status text not null default 'published' check (status in ('published','hidden','removed'))`, `removed_reason text`, `moderated_by uuid`, `moderated_at timestamptz`. Sửa policy đọc công khai để **chỉ đề `status='published'`** hiện cho người khác (chủ đề vẫn thấy đề của mình). Đọc các migration cũ trong `supabase/migrations/` để biết tên policy và hàm `get_shared_exam` hiện tại; hàm đó cũng phải từ chối đề `removed`.
- `reports (id bigint identity pk, exam_id uuid references community_exams on delete cascade, reporter_id uuid null references auth.users on delete set null, reason text not null, detail text, status text default 'open' check in ('open','resolved','dismissed'), created_at, resolved_by uuid, resolved_at)`. RLS: người đã đăng nhập được `insert` báo cáo của chính mình; không ai đọc qua REST (chỉ service role).
- `feedback (id bigint identity pk, user_id uuid null, email text, message text not null, page text, created_at, read bool default false)`. RLS: ai cũng `insert` (kể cả khách), không ai đọc.
- Chống spam: giới hạn độ dài bằng `check (char_length(...) <= ...)`.

### 2. Action server (`CONTENT_ACTIONS`)
- `content.exams.list` (moderator): lọc `q` (tiêu đề), `status`, `subject`; phân trang `page/perPage`; trả kèm email chủ đề (lấy qua Auth Admin API như `users.list`, hoặc để `ownerId` nếu khó) và số báo cáo đang mở.
- `content.exams.get` (moderator): trả `doc` để xem trước.
- `content.exams.setStatus` (moderator): `{examId, status: 'published'|'hidden'|'removed', reason}`; `removed` bắt buộc có lý do.
- `content.exams.delete` (admin): xoá hẳn.
- `content.reports.list` (moderator): lọc `status`, kèm tiêu đề đề thi. `content.reports.resolve` (moderator): `{reportId, status: 'resolved'|'dismissed'}`.
- `content.docs.list` (admin): tài liệu tải lên, lọc theo email/tên tệp, kèm email người tải; thêm tổng dung lượng theo người (top 20). `content.docs.delete` (admin): xoá dòng + file R2 nếu không còn ai dùng chung.
- `content.feedback.list` (admin), `content.feedback.markRead` (admin).
- Kiểm tra đầu vào chặt (uuid, độ dài, enum) như `needUser`, `str` trong `server/admin.ts`.

### 3. Giao diện `ContentPanel.tsx`
Tab con (`Segmented` hoặc route con): **Đề cộng đồng · Báo cáo · Tài liệu · Góp ý**. Ẩn tab chỉ admin khi `me.role === 'moderator'`.
- Đề cộng đồng: bảng (tiêu đề, môn/lớp, chủ đề, ngày, số câu, trạng thái `Badge`, số báo cáo). Bấm dòng mở drawer: xem trước đề (dùng component hiển thị đề có sẵn, tìm trong `src/pages/ExamView.tsx` / `src/components`), nút Ẩn / Gỡ (hỏi lý do) / Hiện lại / Xoá hẳn (admin, `dialog.confirm` danger).
- Báo cáo: hàng chờ `open` trước; mỗi dòng có link mở đề, nút Đã xử lý / Bỏ qua.
- Tài liệu: bảng tên tệp, người tải, dung lượng (KB/MB), ngày; nút Xoá; khối "Dung lượng theo người".
- Góp ý: danh sách, chưa đọc in đậm, nút Đánh dấu đã đọc.
- Dữ liệu giả đủ để xem mọi trạng thái khi `?mock=1`. 360px không cuộn ngang trang.

### 4. Phía người dùng
- Nút **Báo cáo** (nhỏ, kín đáo) ở trang xem đề cộng đồng: chọn lý do (Sai đáp án / Nội dung không phù hợp / Spam / Vi phạm bản quyền / Khác) + ô chi tiết. Chưa đăng nhập thì nhắc đăng nhập. Gửi thẳng vào Supabase REST bằng token người dùng (xem `src/lib/community.ts` cách gọi REST có token).
- Ô **Góp ý** ở chân trang (`Footer` trong `src/components/Layout.tsx`): mở hộp nhập, gửi vào `feedback` kèm đường dẫn trang hiện tại. Khách gửi được.
- Danh sách cộng đồng (`community.ts`) phải lọc `status=eq.published`.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` và `npx tsc -p tsconfig.node.json --noEmit` sạch.
2. `npm run test:admin-content`: tối thiểu kiểm tra user thường bị 403, moderator không xoá hẳn được, gỡ đề thiếu lý do → 400, xoá tài liệu không xoá file R2 khi còn dòng khác dùng chung, mọi thao tác ghi `admin_audit`. `npm run test:admin` vẫn phải đạt.
3. Xem `http://127.0.0.1:5186/admin/noi-dung?mock=1` ở 1440px và 360px (chạy `npm run dev -- --port 5186 --host 127.0.0.1`). Không cần chụp màn hình.
4. Commit vào `feat/admin-content`. Báo lại: danh sách file, những gì chưa làm được, câu hỏi còn vướng.
