# Phiên 42 (15–16/11/2026): số trang, vá Strix lần 2–3, DeepSeek chính hãng thay Mercury, giảm chi phí AI

Tiếp [phiên 41](phien-41.md). Code cuối đã push: `bb4e98c`. **Migration mới đã áp:** `20261125_exam_attempts_rls.sql`. Repo chỉ có nhánh `main`.

> Người dùng vẫn dặn: **chưa tự đề xuất tính năng mới cho soạn thảo**, người dùng tự quyết. Áp migration / push chỉ khi được bảo.

## Việc còn treo (làm theo thứ tự)

1. **Vá 7 lỗi Strix lần 3** — xem mục [Strix lần 3](#strix-lần-3-chưa-sửa--hướng-sửa-gốc) bên dưới. Báo cáo gốc: mở dashboard Strix người dùng gửi, hoặc đọc `.strix/v2-*/FINDINGS.md` (`v2-quota`, `v2-docacl`) và các script thử trong `.strix/v2-attempt`, `.strix/v2-admin`.
2. **Người dùng tự làm ngoài code:**
   - Tắt **r2.dev** (Public Development URL) của bucket R2 trên Cloudflare. Email mẫu còn trỏ link r2.dev → đổi sang `/api/files/...` hoặc bucket ảnh công khai riêng.
   - Vercel: **xoá `MERCURY_*`** (code không đọc nữa). **Chưa thêm `DEEPSEEK_API_KEY` lên Vercel** — người dùng sẽ nạp tiền DeepSeek rồi mới tính.
   - Kiểm trên dero.id.vn các việc còn treo từ phiên 41 (mở tài liệu, điểm AI ở Hồ sơ, đăng nhập Google trọn vòng) + vá phiên này (nộp đề "chỉ làm một lần", tải tài liệu lên, vẽ ảnh AI trừ 5 điểm).
3. **`node_modules` đã vá tay** (phiên này `npm i` bị kẹt EBUSY vì dev server giữ tệp, làm mất `package.json` của `@rollup/rollup-win32-x64-msvc`, `lightningcss-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc`; đã ghi lại tay). Khi rảnh: **tắt dev server rồi `npm ci`**. Nếu Vite báo `Cannot find module @rollup/...` / `Cannot find native binding` thì là lỗi này.
4. `scripts/test-attempts.ts` hỏng từ trước (`Cannot find package '@/lib'`) — chưa sửa.
5. File chưa commit (không phải code app, hỏi người dùng trước khi xoá/commit): `.claude/`, `.rls-audit/`, `.strix/`, `public/brand/logo-120.png`, `scripts/probe-imports.mts`.

## Đã làm (đã push)

| Commit | Nội dung |
|---|---|
| `02f501e` | **Số trang** (Ribbon → "Số trang"): bật/tắt, bắt đầu từ trang, số đầu tiên, đầu/chân trang, căn trái/giữa/phải (Segmented). Trình soạn (`.doc-page-number`), in (`@page` margin box, offset bằng `counter-increment` ở `@page :first`), Word (`docxBlocks.ts` `pageNumberSection`). Giới hạn: Word/trình duyệt chỉ ẩn được số ở trang 1, bắt đầu từ trang ≥ 3 thì trang 2 vẫn hiện số nhỏ (vd 0). |
| `ca094d0` | Vá Strix lần 1: hạn mức AI tính cả token prompt, giữ chỗ = prompt + maxTokens, lượt rỗng vẫn tính; biên nhận hoàn điểm gắn mọi yếu tố giá, chỉ hoàn khi gọi lại thành công; kiểm token đếm theo `sub` (30/10 phút) + IP (600), Supabase lỗi → 503 `TOKEN_BUSY`; tài liệu riêng xác định chủ bằng metadata R2 `x-amz-meta-owner`. |
| `0e33332` | Còn điểm nhưng không đủ cho yêu cầu dài → "Yêu cầu này cần khoảng X điểm AI nhưng bạn chỉ còn Y điểm…". |
| `2852942` | Thanh Tìm kiểu Google Docs (Ctrl/Cmd+F, Ctrl/Cmd+H) — việc treo phiên 41. |
| `eed3381` | Vá Strix lần 2: đáp án chỉ trả câu làm đúng (trừ đề cộng đồng / hiện đúng-sai ngay); prompt AI chỉ gửi `{role, content}`, thiếu usage thì tính mức trần; `/api/upload` đo cỡ thật, kiểm dung lượng, tự ghi `user_documents`; admin bị khoá không dùng quyền; `users.unban`/`security.clear` có `protectTarget`; moderator `content.exams.get` chỉ xem đề cộng đồng; vẽ ảnh AI trừ `AI_IMAGE_POINTS` (5) điểm; migration RLS `exam_attempts` (đã áp, thay policy tạo tay "Chủ đề xem bài làm"). |
| `995e7cf` | **DeepSeek chính hãng thay Mercury** (Inception đóng cổng API): `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL=https://api.deepseek.com`, `DEEPSEEK_MODEL=deepseek-flash`, vị trí dự phòng 1, gửi `reasoning_effort`. Phần prompt trúng cache tính 1/10 điểm (`billOf`). Đề chỉ gửi hướng dẫn hình hợp môn (`figureGuideFor`). Slide gộp 5/lượt (`SLIDE_BATCH`), danh mục đồ hoạ rút gọn (`graphicShortlistText`), phần chung prompt đặt trước cho cache. Script đo: `EVAL_MODEL=<model>` cho `eval:exam`/`eval:slides`. |
| `ea70656`, `bb4e98c` | Thử "cách D" (dặn model suy luận gọn) rồi **gỡ**: trên opencode không bớt token, có đề sai/hỏng cấu trúc. Chỉ bật lại nếu model chính là DeepSeek chính hãng. Script thí nghiệm `scripts/exp-exam-cost.mjs`. |

### Chi phí AI — xem [docs/bao-cao-chi-phi-ai.md](../bao-cao-chi-phi-ai.md)
- Web (opencode `deepseek-v4.1-flash`, mức low): **~21 điểm/đề Toán THPT QG**, **~41 điểm/bộ 15 slide**. Opencode không giảm giá cache (`cached_tokens: 0`).
- Nếu DeepSeek chính hãng làm model chính: ~20 điểm/đề, ~20–26 điểm/bộ slide, nhanh gấp 2–3 lần.
- Tắt suy luận (`thinking: {type: "disabled"}`) rẻ ~12 điểm/đề nhưng sai 7–9/22 câu → không dùng. `reasoning_effort: "low"` của DeepSeek chính hãng **không có tác dụng**.
- Đo lại: `node scripts/exp-exam-cost.mjs <A|B|C|D|O|OD> --n 3` (cần `eval-out/exp/system*.txt`: `EVAL_DUMP=1 npm run eval:exam -- dump`). Giám khảo mặc định `deepseek-flash` mức max — **người dùng dặn không dùng `deepseek-v4-pro`** (đắt).

## Strix lần 3 (chưa sửa) — hướng sửa gốc

Strix quét lại sau `eed3381`: **AI metering đã đóng hẳn**; còn 7 lỗi (3 cao, 2 vừa, 2 thấp). Gốc chung: quyết định bảo mật dựa vào dữ liệu client tự đặt/tự xoá được (mã thiết bị, dòng DB xoá được, trang kết quả bị cắt, cache). **Sửa ở DB + danh tính server, không vá thêm điều kiện lẻ trong handler.** Mỗi mục làm xong thì thêm test phủ định vào `scripts/test-guard.ts` / `scripts/test-admin.ts` (kiểu "moderator thấy 0 đề chưa đăng", "nộp ẩn danh đề một lần bị từ chối").

Quy ước chung: file CRLF (`server/*.ts`, nhiều file `src/`) **không sửa bằng `sed -i` hay Python `open(..., 'w')` thường** — dùng Edit tool hoặc đọc/ghi bytes giữ `\r\n`; kiểm `git ls-files --eol <file>` và `git diff --stat` (diff cả file = đã hỏng xuống dòng). Migration viết vào `supabase/migrations/`, **hỏi người dùng trước khi áp**.

### 1. (Cao) Đề "chỉ làm một lần" vẫn làm lại được → dò được cả đáp án — `server/attempt.ts`
Hiện: khoá theo `user_id` (nếu có token) **hoặc** `device_id` (trình duyệt tự đặt). Bỏ token + đổi `deviceId` là nộp lại; câu đúng trọn trả đáp án → 7 lượt lấy đủ đáp án. Thêm: lookup lỗi (non-2xx) bị coi là "chưa nộp" (fail-open); `deviceId` có `(`/`)` làm hỏng cú pháp `or=(...)` của PostgREST; không có ràng buộc unique nên 2 lượt song song cùng qua.
Sửa gốc:
- **Đề `oneAttempt` bắt buộc đăng nhập**: server `if (exam.settings?.oneAttempt && !userId) return json(res, 401, { error: LOGIN_REQUIRED, loginRequired: true })`. Client `src/pages/Quiz.tsx` + `examGate()` (`src/lib/attempts.ts`): với đề một lần, chưa đăng nhập thì hiện nút đăng nhập trước khi làm bài (đừng để học sinh làm xong mới báo).
- **Khoá nguyên tử trong DB**: migration bảng `exam_attempt_locks (exam_id uuid references community_exams(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, created_at timestamptz default now(), primary key (exam_id, user_id))`, RLS bật, không policy, revoke all từ anon/authenticated. Server (service role) **insert vào bảng khoá trước khi chấm**; trùng khoá (HTTP 409 / mã `23505`) → 409 "Em đã nộp bài cho đề này rồi."; lỗi khác → 503 (fail-closed). Lưu bài lỗi thì xoá dòng khoá.
- Bỏ hẳn truy vấn `or=(user_id...,device_id...)` (hết nối chuỗi caller vào cú pháp lọc). `device_id` chỉ còn để thống kê.
- Đề làm nhiều lần: giữ như cũ (chỉ trả đáp án câu đúng trọn).

### 2. (Cao) Tài liệu cũ (chưa có metadata owner) — `server/r2.ts` `ownsDocument`
Hiện: fallback hỏi `user_documents?select=owner_id&url=eq...&limit=50` **không order**, rồi `every(owner === me)`. Kẻ gian chèn 50 dòng trỏ vào key nạn nhân → chiếm quyền đọc; chèn 1 dòng → chủ thật bị khoá vĩnh viễn.
Sửa gốc: **bỏ fallback**, chủ tệp chỉ lấy từ metadata.
- Viết script một lần `scripts/backfill-doc-owner.mjs` (chạy tay, cần R2 + service key trong `.env`): liệt kê object `doc/` (S3 ListObjectsV2), object nào thiếu `x-amz-meta-owner` thì lấy các dòng `user_documents` có `url = /api/files/<key>`; **chỉ khi tất cả dòng cùng một `owner_id` và dòng đó `created_at` sớm nhất** thì CopyObject lên chính nó với `x-amz-metadata-directive: REPLACE` + `x-amz-meta-owner`; còn lại in ra để người dùng xử lý tay. Chạy chế độ `--dry-run` trước, cho người dùng xem.
- Sau khi backfill: `ownsDocument` → `return !!metaOwner && metaOwner === userId`. Xoá hàm fallback.
- Đồng bộ với mục 3: chặn client insert `user_documents` (dòng trỏ vào key người khác không còn tạo được).

### 3. (Cao) Hạn mức lưu trữ vẫn lách được — `server/r2.ts` `handleUploadRequest`, `src/lib/documents.ts`
Hiện: (a) xoá dòng `user_documents` (client gọi thẳng PostgREST, `deleteDocument`) giải phóng hạn mức nhưng object R2 vẫn còn → tải-xoá lặp vô hạn; (b) kiểm trước → PUT R2 → insert là 3 bước rời: 8 lượt song song 9 MB đều qua (72 MB / cap 10 MB); trigger `check_user_documents_quota` bỏ qua service_role nên không có chốt ở DB; (c) `storageLeft` lỗi → bỏ qua kiểm (fail-open); (d) client vẫn insert thẳng được với `size` tự khai; (e) ảnh (`img/`) không tính hạn mức và **khách chưa đăng nhập cũng tải lên được**.
Sửa gốc:
- **RPC nguyên tử** (migration): `reserve_user_document(p_owner uuid, p_name text, p_mime text, p_size bigint, p_url text, p_subject text) returns user_documents` security definer, `perform pg_advisory_xact_lock(hashtext(p_owner::text))`, kiểm `storage_used(p_owner) + p_size <= storage_max_bytes(p_owner)` (vượt → `raise exception 'QUOTA:...'`), rồi insert. Revoke từ anon/authenticated (chỉ service role). Server: gọi RPC **trước** PUT R2; PUT lỗi thì xoá dòng vừa tạo. RPC lỗi → 503 (fail-closed), không bỏ qua.
- **Xoá qua server**: thêm `DELETE /api/files/doc/<key>` (hoặc action trong upload handler) — xác thực chủ bằng metadata, xoá dòng `user_documents` của người đó **và** object R2 (key đã băm theo chủ nên không dùng chung). Client `deleteDocument` (`src/lib/documents.ts`, gọi ở `Library.tsx:153`, `MyUploads.tsx:225`) đổi sang gọi endpoint này.
- Migration: `revoke insert, delete on public.user_documents from authenticated` + bỏ policy insert/delete tương ứng (`20261106c_rls_snapshot.sql`). Giữ select. Bỏ nhánh client tự insert trong `uploadDocument` (nhánh fallback khi server không trả `doc`).
- **Ảnh**: `/api/upload` với ảnh cũng bắt đăng nhập (`userFromToken`, máy dev `isLocal` vẫn cho), tính vào hạn mức: bảng `user_images (owner_id, key, size, created_at, primary key (owner_id, key))` ghi qua RPC giống trên; `storage_used` cộng thêm `sum(size)` của bảng này. Ảnh trùng nội dung của cùng người không tính lại.
- Thêm giới hạn lượt cho `handleFileRequest` (đường đọc tệp hiện không có `guard`). **Đừng dùng nguyên `guard()`**: nó chặn request thiếu/khác Origin, mà ảnh `<img src="/api/files/img/...">` và link tải không gửi Origin → vỡ ảnh trong đề. Chỉ dùng phần đếm lượt theo IP (hàm `take` trong `server/guard.ts`, mức rộng vd 600/10 phút; export thêm một hàm `rateLimitOnly(req, res, key, max)` nếu cần).
- Xoá object R2 đã có sẵn `deleteR2Object(key)` trong `server/r2.ts` — dùng lại.

### 4. (Vừa) Moderator xem/gỡ được đề link riêng — `server/adminContent.ts`
Hiện: chỉ `content.exams.get` chặn đề chưa đăng; `content.exams.list` (service key, không lọc `listed`) trả tiêu đề, trường, preview câu đầu, email chủ của mọi đề; `content.exams.setStatus` đặt "removed" cho đề riêng → link học sinh thành "không tìm thấy" giữa giờ thi.
Sửa gốc (một chỗ, không vá từng action):
- Thêm hàm `examScope(ctx: AdminCtx): Record<string, string>` trả `{ listed: 'eq.true' }` khi `ctx.role !== 'admin'`, `{}` khi admin. Dùng trong **mọi** truy vấn `community_exams` của action `need: 'moderator'`: `content.exams.list` (thêm vào `qs`), `content.exams.get`, `content.exams.setStatus` (đọc đề kèm scope trước; không thấy → 404), `content.reports.list` (lọc báo cáo của đề `listed`, hoặc ẩn preview đề chưa đăng). Bỏ check tay đang có ở `content.exams.get`.
- Test trong `scripts/test-admin.ts`: moderator list → 0 đề `listed=false`; setStatus đề riêng → 404; admin vẫn thấy hết.

### 5. (Vừa/Thấp) Admin bị ban vẫn dùng quyền tới 60 giây — `server/admin.ts` `isBanned`
Hiện: `banCache` nhớ 60 s, `users.ban` / `users.unban` / tự khoá (`strikeIntruder`) không xoá cache; mỗi instance Vercel một cache.
Sửa gốc: **bỏ cache ban** — hỏi `/auth/v1/admin/users/{id}` mỗi request admin (lượng request admin rất ít). Nếu muốn giữ cache cho action đọc thì chỉ cache kết quả "không bị ban" ≤ 10 s và luôn hỏi thật cho action ghi (ban, unban, delete, quota, credits, storage, settings, ai.*).

### 6. (Thấp) `protectTarget` thiếu ở một số action — `server/admin.ts`
Hiện: `quota.set`, `quota.clear`, `credits.grant`, `storage.set` vẫn nhận admin khác làm đích; lượt bị `protectTarget` từ chối không ghi audit; admin bị ban không còn cách khôi phục trong app.
Sửa gốc:
- Gọi `protectTarget(ctx, id)` ở cả 4 action trên.
- Bọc `protectTarget`: từ chối thì `audit(ctx, '<action>.denied', id)` trước khi ném lỗi.
- Khôi phục admin bị ban: ghi vào context là làm bằng SQL/dashboard Supabase (gỡ `banned_until`), không mở đường trong app.

### 7. (Thấp) Các điểm cứng hoá khác Strix nêu
- `/api/extract` (giải nén DOCX/PDF): đã chặn zip bomb nhưng tệp hợp lệ gần trần tốn ~500 MB RAM / 10 s → hạ trần dung lượng giải nén mỗi entry / tổng xuống mức tài liệu thật cần, dừng parse khi đủ giới hạn chữ trích ra.
- `isLocal` (loopback) bỏ qua Origin/giới hạn lượt/kiểm token: an toàn trên Vercel, nhưng nếu tự host sau reverse proxy thì thành lỗ hổng. Đổi sang cờ rõ ràng (vd chỉ khi `process.env.NODE_ENV !== 'production'` hoặc `ALLOW_LOCAL_BYPASS=1`).
- 404 của tệp cấm và tệp không có khác nội dung → thống nhất một thông báo.

Sau khi sửa: chạy `npx tsc --noEmit -p .`, `npx tsx scripts/test-guard.ts`, `npx tsx scripts/test-admin.ts`, `npx tsx scripts/test-ai-abuse.ts`; báo người dùng chạy lại Strix (skill `strix`) với instruction liệt kê đúng 7 mục trên.
