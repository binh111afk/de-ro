# Phiên 28 (10/11/2026): Xáo đề thử với đề thật, Admin giai đoạn 1 (phần logic)

## Xáo đề: đã thử, sửa một lỗi
- **Lỗi:** mở đề cộng đồng bằng "Lưu → Vào trình soạn thảo" thì mất bảng đáp án. `examToDoc` (`src/lib/exportDocx.ts`) không xuất đáp án, nên Xáo đề báo "12/12 câu chưa có đáp án".
- **Sửa:** `examToDoc(exam, { withAnswers: true })` thêm tiêu đề "ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM", khối `answerKey` và `rubric` cho từng bài tự luận có `solution`. Chỉ `ExamView` (Vào trình soạn thảo) bật tuỳ chọn này. Trang xem đề và nút Word giữ như cũ, không có đáp án.
- **Đã thử trên dev:**
  - Đề Toán 12 cộng đồng: 12/12 câu có đáp án, đáp án mới của 3 mã đều trỏ đúng phương án.
  - Đề có đúng/sai và trả lời ngắn: Đ/S đổi đúng theo thứ tự ý, trả lời ngắn giữ nguyên.
  - PDF: chặn `window.open` để đọc HTML. Có 3 tài liệu, 2 lần sang trang, công thức vẽ bằng KaTeX, lệnh in được gọi.
  - Chưa nhìn tận mắt hộp thoại in thật.
- Chưa thử với đề do AI soạn ngay trong phiên (AiPanel), vì cần gọi model. Prompt AI đã bắt buộc có `answerKey` theo đúng định dạng mà Xáo đề đọc.
- Commit `0307b55`.

## Admin giai đoạn 1: phần logic xong, chưa có giao diện thật
Bốn câu hỏi trong [plan-admin.md](../plan-admin.md) chưa hỏi được, nên đang dùng các mặc định sau:

| Câu hỏi | Mặc định đang dùng |
|---|---|
| "Cộng điểm AI" | Đặt hạn mức tháng riêng (`quota.set`, ghi `ai_quota_overrides`), có thể chọn không giới hạn. Chưa làm kiểu tặng token dùng một lần. |
| Admin là ai | Chưa thêm ai. Phải chạy SQL ở đầu migration. Đã có sẵn vai trò moderator, nhưng moderator hiện chỉ gọi được `me`. |
| Ngân hàng câu hỏi | Chưa đụng (giai đoạn 4). |
| Xoá tài khoản | Đề cộng đồng bị xoá theo, vì khoá ngoại đang `on delete cascade`. Muốn giữ lại dưới tên "ẩn danh" thì phải đổi khoá ngoại. |

Đã làm:
- `supabase/migrations/20261110_admin.sql`: bảng `user_roles`, bảng `admin_audit`, hàm `admin_user_stats`. **CHƯA áp lên Supabase**: lệnh `apply_migration` bị chặn trong chế độ tự động, người dùng phải duyệt.
- `server/admin.ts` + `api/admin.ts` (function thứ 9) + middleware trong `vite.config.ts` + `'admin'` trong `guard.ts`.
  - `requireAdmin`: không token trả 401, không đủ quyền trả 403.
  - Action: `me`, `users.list` (lọc email, phân trang, ghép số đề, slide, token), `users.ban`/`unban` (dùng `ban_duration` của Auth), `users.delete` (gõ lại email, xoá tệp R2 không còn ai dùng chung), `quota.get/set/clear`, `audit.list`.
  - Không cho thao tác trên chính mình hoặc trên admin khác. Mọi thao tác thay đổi đều ghi `admin_audit`.
- `server/r2.ts`: `deleteR2Object`, `r2KeyFromUrl`.
- `src/lib/adminApi.ts`: kiểu dữ liệu, hàm gọi API, dữ liệu giả (`?mock=1`).
- `src/pages/admin/AdminPage.tsx` + route lazy `/admin/*`: người không có quyền thấy trang chủ.
- Test `npm run test:admin` (20 ca) đạt. `test:guard`, `test:shuffle`, `test:docx` và tsc đều sạch.
- `docs/prompt-admin-ui.md`: prompt cho Antigravity dựng AdminLayout, UsersPanel, AuditPanel bằng dữ liệu giả.

## Việc tiếp theo
1. Người dùng duyệt áp migration (`supabase/migrations/20261110_admin.sql`), rồi thêm email admin vào `user_roles`.
2. Đưa `docs/prompt-admin-ui.md` cho Antigravity (nhánh `feat/admin-ui`). Agent làm xong thì review ở 1440px và 360px, rồi merge.
3. Thử với tài khoản thật trên production. Máy dev thiếu `SUPABASE_SERVICE_ROLE_KEY` nên `/api/admin` trả 503.
4. Hỏi lại 4 câu trong plan-admin.md, sửa phần mặc định nếu người dùng muốn khác.
5. Giai đoạn 2 (bảo trì, `ai_calls`, health).
