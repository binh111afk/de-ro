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
Người dùng đã chốt 4 câu hỏi (cuối phiên):

| Câu hỏi | Đã chốt và làm |
|---|---|
| "Cộng điểm AI" | Nút **Cộng điểm** mở modal, nhập số điểm, **cộng dồn** vào số dư của tài khoản. Bảng `ai_credits` (balance). Hạn mức hiệu lực bằng hạn mức tháng cộng số dư. Dùng vượt hạn mức tháng thì `consume_ai_credits` trừ phần vượt vào số dư, rồi trừ khỏi `ai_usage` của tháng đó. Số dư không mất khi sang tháng. Action `credits.grant`, client `grantCredits`. Vẫn giữ `quota.set` (hạn mức riêng hoặc không giới hạn). |
| Admin là ai | Email chủ app (xem git user), đã thêm vào `user_roles` bằng SQL chạy riêng, không ghi email vào repo. |
| Ngân hàng câu hỏi | Chưa đụng (giai đoạn 4). |
| Xoá tài khoản | Đề cộng đồng **giữ lại**, `owner_id` chuyển thành null (khoá ngoại `on delete set null`). Đề cộng đồng không lưu tên tác giả. |

Đã làm:
- `supabase/migrations/20261110_admin.sql`: bảng `user_roles`, bảng `admin_audit`, hàm `admin_user_stats`. Đã áp. Thêm `20261110b_admin_credits.sql` (ai_credits, grant/consume_ai_credits, giữ đề cộng đồng), cũng đã áp. Đã thử hàm trừ điểm trên DB trong giao dịch huỷ được: cộng 500 rồi 100 ra 600; dùng 1200 trên hạn mức 1000 thì số dư còn 400.
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
1. Đưa `docs/prompt-admin-ui.md` cho Antigravity (nhánh `feat/admin-ui`), có cả modal Cộng điểm. Agent làm xong thì review ở 1440px và 360px, rồi merge.
2. Thử trên production bằng tài khoản admin: `/admin`, cộng điểm, xem hạn mức trong AiPanel. Máy dev thiếu `SUPABASE_SERVICE_ROLE_KEY`.
3. Trang Hồ sơ (`Profile.tsx`) vẫn hiện điểm AI giả (`CREDIT`). Nên nối với `ai_usage` và `ai_credits`.
4. Giai đoạn 2 (bảo trì, `ai_calls`, health).
