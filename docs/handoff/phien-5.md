## BÀN GIAO PHIÊN 5 (28/10/2026) — trang hồ sơ, đề cộng đồng, thanh tab. Đọc mục này TRƯỚC.

### Đã làm

- **Trang hồ sơ `/ho-so`** (`src/pages/Profile.tsx`, route cần đăng nhập): đổi tên hiển thị, đổi ảnh đại diện (cắt vuông 256px, đẩy lên R2 qua `uploadImage`, lưu `avatar_url` trong `user_metadata`). Thẻ "Lượt AI tháng này" là **số mock** (`CREDIT`), chưa có backend đếm. Hàm `updateProfile` ở `src/lib/auth.ts`.
- **Header**: tên người dùng là link tới `/ho-so`, hiện ảnh đại diện nếu có.
- **Chân trang** (`src/components/Layout.tsx`): bỏ viền trên và sửa dải sóng lệch màu (`#f2f3f2` cho cả nền và sóng). Chân trang giờ là khối phẳng, dải sóng không còn hiện rõ.
- **Đăng đề lên cộng đồng** (trang `/de-cong-dong`):
  - Bảng Supabase `community_exams` (project `dethinhbien`, id `ddcyhsxytbcdpgpggexh`). RLS: ai cũng đọc được, chỉ người đăng mới thêm hoặc gỡ đề của mình. Các cột: `title, subject, grade, school, doc (jsonb), question_count, duration_minutes, total_points, preview`.
  - Nút **Đăng đề** mở modal chọn đề từ mục Gần đây (`useDocStore().myDocs`, `kind === 'exam'`). Client gọi REST trong `src/lib/community.ts`.
  - Đề đăng hiện chung lưới với đề mẫu (`ExamCard` / `ExamRow`), có nhãn "Giáo viên".
- **Xem / Làm đề cho đề đăng**: `src/lib/docToExam.ts` chuyển `ExamDoc` sang `Exam` (đáp án trắc nghiệm lấy từ khối `answerKey`, tự luận giữ nguyên). Test: `npx tsx --tsconfig tsconfig.app.json scripts/test-doc-to-exam.ts`.
- **Bộ lọc công khai**: `src/components/SiteSelect.tsx` (ô chọn riêng cho trang công khai). `Dropdown` trong `examEditor` vẫn dùng cho ribbon. `ViewToggle` (lưới/danh sách) là segmented control với thẻ trượt dùng `useSlidingThumb`.
- **Thanh tab trình soạn**:
  - Gạch chân ribbon (`RibbonTabs` trong `src/examEditor/Layout.tsx`) trượt giữa các tab (`.ribbon-tab__indicator`).
  - Đĩa trắng của tab đang chọn trong thanh tab đề (`TabStrip.tsx`, `.tab-active-plate`) trượt tới tab mới. Hover của tab không chọn vẫn dùng `.tab-plate`.

### Bẫy đã gặp

- Khối đáp án (`answerKey`) đánh số chung cho trắc nghiệm và tự luận. Một số câu có hai mục đáp án, nên `docToExam` lấy mục dạng chữ cái cho trắc nghiệm, mục còn lại cho tự luận.
- Đề đăng trước khi có cột mới sẽ hiện 0 câu, 45′, 10đ. Đã điền lại bằng `UPDATE` (một dòng). Đề đăng từ nay trở đi tự tính đúng.
- Khóa publishable không phải JWT: chỉ gửi `Authorization` khi có phiên đăng nhập, nếu không PostgREST báo lỗi.
- Trình duyệt ẩn thì không chạy transition (rAF bị dừng). Khi kiểm tra chuyển động phải đưa cửa sổ lên trước.
- Đừng ghi dữ liệu test vào Supabase công khai. Khi cần thử danh sách, chặn `fetch` trong trình duyệt để trả về dữ liệu giả.

### Chưa làm

- Chưa đăng một đề thật từ tài khoản thật (cần đăng nhập thủ công).
- Chưa có nút gỡ đề đã đăng.
- Các trang Thư viện, Đề của tôi, Chấm điểm vẫn dùng `<select>` native.
- Đề đăng có trường `unit` mặc định "TRƯỜNG THCS …" nếu người soạn chưa điền.
- Trang hồ sơ: credit AI là mock. Đổi ảnh đại diện cần `/api/upload` đang chạy (dev server).
- Advisor Supabase báo: chưa bật kiểm tra mật khẩu bị lộ (`auth_leaked_password_protection`), chưa xử lý.
