# Phiên 43 (16/11/2026): vá Strix lần 3–5, server chuyển về Singapore, trang 404

Tiếp [phiên 42](phien-42.md). Code cuối đã push: `e033127`. Repo chỉ có nhánh `main`, một worktree (thư mục gốc).

**Migration đã áp phiên này** (theo thứ tự): `20261126_exam_attempt_locks`, `20261127_storage_atomic`, `20261128_user_items_quota_logical`, `20261129_moderation_ban_rls`.

> Người dùng vẫn dặn: **chưa tự đề xuất tính năng mới cho soạn thảo**. Áp migration / push chỉ khi được bảo. Việc bảo mật Claude tự làm, không giao agy.

## Việc còn treo

1. **Người dùng tự làm ngoài code:**
   - Tắt **r2.dev** (Public Development URL) của bucket R2. Email mẫu còn trỏ link r2.dev → đổi sang `/api/files/...`.
   - Vercel: xoá `MERCURY_*`; còn treo `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`; `DEEPSEEK_API_KEY` chưa thêm (chờ nạp tiền).
   - Tuỳ chọn: thêm `DOC_KEY_SECRET` (bí mật đặt tên tệp tài liệu, xem dưới). Không có thì dùng `R2_SECRET_ACCESS_KEY`.
   - Xoá tay 3 tệp R2 mồ côi (không còn dòng `user_documents` nào): `doc/24999022f23dc3f796c5d85d57cb63df0f32a8cd.pdf`, `doc/9ea6e47a1f27aeee3fa31f9daec8dbf522ac606b.pdf`, `doc/b3271e132963f45dbaa05e7bd401f1b6960e3b00.pdf`.
2. **Chưa thử bằng tài khoản thật trên dero.id.vn:** đề "chỉ làm một lần" (bắt đăng nhập trước khi làm), đề link giấu đáp án (nộp xong chỉ thấy "Đã nộp bài"), nút "Cho học sinh xem điểm sau khi nộp", tải / xoá tài liệu, đồng bộ đề/slide với hạn mức mới, trang 404.
3. **Điểm Strix ghi nhận nhưng chưa sửa** (đều thấp hoặc là quyết định sản phẩm):
   - `bank_questions` vẫn cho đọc cả hàng `hidden` — client cần để giấu câu tĩnh tương ứng (`mergeBank`). Muốn kín: tách view công khai không có `data` cho hàng ẩn.
   - Chủ xoá đề (chưa bị gỡ) thì báo cáo + bài làm + khoá một lần xoá theo (FK cascade).
   - Cache đề (`server/examCache.ts`) 60 s mỗi instance: rút đề khỏi cộng đồng vẫn có thể phục vụ như cũ tối đa 60 s.
   - `exam_gate` (RPC ẩn danh) lộ `listed` + "thiết bị này đã nộp chưa".
   - Đề cộng đồng (`listed`) trả đủ đáp án cho mọi người — đúng quy ước cũ, chưa ghi thành quyết định.
   - Strix chưa làm xong thử "đối chiếu" bộ kiểm ZIP với JSZip (lượt 5 ghi "inconclusive").
4. **Test hỏng từ trước** (alias `@/` không chạy dưới tsx thường): `test-attempts`, `test-online-ai`, `test-docx`, `test-sync`, `test-online-exam`. `test-r2-upload` gọi R2 thật, cần `.env`.
5. File chưa commit, hỏi người dùng trước khi đụng: `.claude/`, `.rls-audit/`, `.strix/`, `public/brand/logo-120.png`, `scripts/probe-imports.mts`.

## Đã làm (đã push)

| Commit | Nội dung |
|---|---|
| `e0e9c26` | Strix 3 mục 1: đề `oneAttempt` **bắt đăng nhập** (401 `loginRequired`, `OnlineOpen` hiện nút đăng nhập, nhớ đường quay lại `rememberReturnPath`); khoá nguyên tử bảng `exam_attempt_locks` (PK exam+user) **trước khi chấm**, trùng → 409, lỗi → 503, lưu bài lỗi thì nhả khoá. |
| `82bb41f` | Strix 3 mục 2–3: chủ tài liệu **chỉ từ metadata R2** `x-amz-meta-owner` (bỏ fallback `user_documents`); RPC `reserve_user_document` / `reserve_user_image` (khoá `pg_advisory_xact_lock('storage:'+owner)`) giữ chỗ **trước** khi ghi R2; xoá tài liệu qua `DELETE /api/upload?id=` (xoá cả R2); ảnh cũng bắt đăng nhập, tính hạn mức (`user_images`, 100 MB); client hết quyền ghi `user_documents`; `/api/files` giới hạn 600 lượt/IP/10 phút (`rateLimitOnly`), 404 đồng nhất. Script `scripts/backfill-doc-owner.mjs` (đã chạy dry-run: 0 tệp cần gắn). |
| `69a131b` | Strix 3 mục 4: `examScope(ctx)` — moderator chỉ đụng đề `listed` ở **mọi** action (list/get/setStatus/reports). |
| `9c7ecd9` | Strix 3 mục 5–6: bỏ cache khoá admin (hỏi thật mỗi request); `protectTarget` cho quota/credits/storage, lượt bị từ chối ghi `<action>.denied`. |
| `2bc4fdc` | Strix 3 mục 7: `isLocal` chỉ miễn khi `NODE_ENV=development` (vite tự đặt) hoặc `ALLOW_LOCAL_BYPASS=1`; script test đặt `NODE_ENV ??= 'development'`. Trần giải nén DOCX 3000 mục / 24 MB / 48 MB. |
| `36b51cf` | **Hàm Vercel chạy ở `sin1`** (`vercel.json` `regions`) cạnh Supabase `ap-southeast-1` — trước đó ở `iad1` (Mỹ), mỗi lượt hỏi DB ~220 ms, admin chậm hẳn. Kiểm quyền + khoá chạy song song. Người dùng xác nhận nhanh hơn hẳn. |
| `8d64c78` | Strix 4: ZIP đếm central directory **theo chữ ký**, bắt khớp số khai EOCD, CD sát EOCD (không để JSZip dời offset); **JWT kiểm chữ ký ES256 tại server** bằng JWKS (`verifyLocal`, nhớ khoá 10 phút, kid lạ tải lại ≤ 1 lần/phút) — token giả không hỏi Supabase; dự phòng đếm theo mã băm token + IP; **tài khoản bị khoá → 403 ở mọi API** (`isBannedUser`, nhớ 30 s); hoàn biên nhận AI ≤ số token lượt gọi lại tốn; migration `20261128`: cột `user_items.bytes` = `octet_length(data::text)`, trigger dùng chung khoá `storage:`, chạy mọi update, CHECK `kind`, thu TRUNCATE; `reports.resolve` ghim `exam_id`; `nosniff` cho `/api/files`. |
| `70ad2bb` | Prompt trang 404 cho agy: `docs/prompt-trang-404.md`. |
| `c0e0c09` | Strix 5: **đề giấu đáp án chỉ trả "đã nộp"** (điểm tổng cũng là máy dò: mỗi lượt làm 1 câu) — giáo viên tự bật `settings.showScore` ("Cho học sinh xem điểm sau khi nộp", mặc định tắt); `setStatus`: đề đã gỡ chỉ admin khôi phục, moderator không tự kiểm duyệt đề mình, ghim trạng thái vừa đọc (409), nhật ký giữ quyết định cũ; migration `20261129`: policy **RESTRICTIVE** `chan_tai_khoan_khoa_*` (hàm `auth_banned()`) trên `community_exams`, `user_items`, `reports`, `feedback`, `presence`; `protect_exam_moderation` theo `current_user`; chủ không xoá được đề `removed`; giới hạn báo cáo (đề đang hiện, 1 mở/đề, 10/ngày) và góp ý (10/giờ/tài khoản, 60/giờ khách); `app_settings` chỉ đọc `maintenance`, `announcements`. Server: kiểm khoá fail-closed trên Vercel, `forgetBan` khi admin khoá/mở/xoá, bộ đếm bỏ mục hết hạn thay vì xoá sạch, key tài liệu = HMAC bí mật, URL ảnh nhà cung cấp phải https công khai, search có timeout. |
| `e033127` | **Trang 404** (agy làm, Claude review): tờ đề "Câu 404" bút đỏ khoanh D, animation CSS chạy một lần (`nf-*` trong `index.css`), responsive 320–2560 px, `/admin` không quyền cũng hiện 404. |

## Lưu ý cách làm (rút ra phiên này)

- **Strix phải chạy chế độ chỉ đọc.** Lượt 4 nó tự `npm install` bản Linux vào `node_modules` (vỡ `tsx`/build, phải `npm ci`) và đổi CRLF→LF hai file. Lượt 5 có câu dặn "READ-ONLY SCAN… copy to /tmp" thì sạch. Mỗi lượt Strix xong: `git status`, `ls node_modules/@esbuild` (phải là `win32-x64`).
- **Agy làm ngay trong thư mục gốc** (tự tạo nhánh tại chỗ). Muốn sửa `main` song song: `git worktree add ../dethinhbien-main main`, nối `node_modules` bằng junction (`mklink /J dethinhbien-main\node_modules dethinhbien\node_modules`), xong gỡ junction (`rmdir`) **trước** `git worktree remove`.
- Test phủ định cho từng lỗi bảo mật nằm ở `scripts/test-guard.ts` (60 ca) và `scripts/test-admin.ts`; mỗi lần sửa đã thử đưa code về bản cũ để chắc test đỏ.
- Sửa file CRLF hàng loạt: script `rep.py` kiểu "đọc bytes, đổi `\r\n`→`\n`, thay, ghi lại `\r\n`" (Python trong heredoc của Git Bash hay làm hỏng `\\n` — dùng Edit tool cho chuỗi có `\n` trong template literal).
