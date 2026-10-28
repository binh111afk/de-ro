## BÀN GIAO PHIÊN 6 (28–29/10/2026) — hồ sơ, kho câu hỏi, kho tài liệu, sửa zoom/phân trang. Đọc mục này TRƯỚC.

Nhánh `feat/ho-so-cong-dong`, đã push đến `700a571`. Working tree sạch (chỉ còn `.claude/` chưa theo dõi, không commit).

### Đã làm (commit theo thứ tự)

- `e6626fc` **Trang hồ sơ** (`src/pages/Profile.tsx`): cột hồ sơ bên trái (ảnh, tên, email, đổi ảnh, đăng xuất), phải là form thông tin và thẻ "Lượt AI" (số mock, có nhãn "Số liệu mẫu", chỉ còn số lượt và thanh tiến độ).
  Kho tài liệu dùng `SiteSelect`. Tiêu đề thẻ đề cộng đồng giới hạn 2 dòng + `title` tooltip; hai nút Xem đề / Làm đề chia đều.
- `6f5d111` **Mục lục trình soạn** (`src/examEditor/convert.ts`, `NavPanel.tsx`): thanh bên chỉ còn Mục lục + Khối mẫu. Mục lục liệt kê cả câu hỏi (`Câu N.`), bấm để nhảy.
- `bcf0ead` **Kho câu hỏi trong ribbon** (`src/examEditor/BankModal.tsx`, `bankQuestions.ts`, nút ở tab Chèn của `Ribbon.tsx`): hộp thoại hai cột, card bên trái (checkbox chọn), chi tiết bên phải (đề, phương án A–D, đáp án đúng tô sage, lời giải). Chèn một lần tại con trỏ theo thứ tự chọn, qua `insertBlockTemplate` (nhận mảng khối).
- `c4b7633` **Sửa zoom** (`compose.css`, `ExamEditor.tsx`): sân soạn canh giữa bằng `flex` + `justify-content: safe center` thay `margin: auto` (trang không bị đẩy ra ngoài khi phóng to). Bộ đo phân trang chia chiều cao cho tỉ lệ zoom (`getBoundingClientRect` đã nhân zoom, PAGE_H thì không).
- `5243ac6` **Kho tài liệu** (`src/pages/Library.tsx`, `src/lib/documents.ts`, `server/r2.ts`, `Home.tsx`): trang lưu tài liệu tải lên (PDF/DOCX, tối đa 20 MB), kéo thả, danh sách thẻ, tìm theo tên, lọc theo môn và loại, mở và xóa. `/api/upload` nhận thêm PDF/DOCX, lưu R2 trong `doc/`. Card mẫu (có nhãn "Mẫu") hiện khi chưa đăng nhập hoặc chưa có tài liệu.
- `6bc984b` **Dropdown** `SiteSelect`: mục không xuống dòng (`whitespace-nowrap`, `w-max`).
- `700a571` **Skeleton**: `SkeletonCard` trong `src/components/ui.tsx`; Đề cộng đồng và Kho tài liệu hiện thẻ chờ khi đang tải.

Đã bỏ trong phiên: tên/ảnh người tạo trên thẻ đề cộng đồng (đã gỡ cả code lẫn cột DB), tab "Kho câu hỏi" ở thanh bên (chuyển thành nút ribbon).

### Thay đổi Supabase (project `ddcyhsxytbcdpgpggexh`, đã duyệt từng bước)

- `community_exams`: thêm rồi xóa `author_name`, `author_avatar`. Bảng hiện đúng 12 cột như trước phiên.
- Bảng mới `user_documents` (`id, owner_id, name, mime, size, url, created_at, subject`), RLS 3 policy (select/insert/delete theo `auth.uid() = owner_id`). Cột `subject` nullable, thêm sau.

### Chưa xong / cần biết

- **Tải tài liệu thật chưa được thử** (cần đăng nhập). Chưa biết upload + lưu `subject` có chạy đúng không. Đây là việc kiểm tra đầu tiên của phiên sau.
- Xóa tài liệu chỉ xóa dòng DB; tệp trên R2 còn lại (chưa có endpoint xóa tệp).
- `/api/files/doc/...` không kiểm tra đăng nhập; an toàn tương đối nhờ hash 40 ký tự. Muốn khóa chặt cần kiểm tra token ở server.
- **Trang xem tài liệu trong app** (`/kho-tai-lieu/:id`, nhúng PDF, DOCX chỉ tải về): đã đề xuất, chưa có quyết định làm hay không.
- **Kho câu hỏi trong trình soạn:** `$...$` hiện nguyên chữ LaTeX trong editor (chỉ xem trước trong modal là render). Câu chèn vào không điền đáp án vào bảng đáp án cuối đề (schema `examOption` không có cờ đúng/sai). Chưa kiểm tra modal ở màn hình hẹp.
- **Phân trang khi zoom:** đã sửa và kiểm tra số trang ổn định (28 câu → 3 trang ở 50% và 110%). Chưa tái tạo đúng ảnh bảng đáp án bị đè mép trang của người dùng.
- Thanh bên trình soạn tự ẩn khi viewport < 1100px. Không thể xem trên cửa sổ tích hợp (~800px) — kiểm tra nav phải dùng cửa sổ rộng.
- `Dropdown` của trình soạn (`src/examEditor/Dropdown.tsx`) chưa kiểm tra có bị xuống dòng không; chỉ `SiteSelect` đã sửa.
- `<select>` native còn ở `Grading.tsx` và `MyDocs.tsx` (Library đã chuyển).
- Hồ sơ: credit AI là số mock (đúng ý, giữ).
- Advisor Supabase: `auth_leaked_password_protection` chưa bật (còn từ phiên 5).

### Bẫy đã gặp

- Vite báo `504 Outdated Request` khi thêm import mới: trang trắng. Dừng và chạy lại dev server (`preview_stop` rồi `preview_start`), không cần sửa code.
- Trình duyệt tích hợp rộng ~800px: `ComposeDoc` tự đóng nav pane khi viewport < 1100, nên không thấy nav để test. Đo bằng `javascript_tool` thay vì chụp ảnh.
- `Edit` đôi khi lỗi `EPERM` khi ghi file (rename tạm). Thử lại thường được.
- Lệnh `apply_migration` trên Supabase bị auto-mode chặn cho đến khi người dùng duyệt rõ ràng. Mỗi thay đổi schema cần xin duyệt trước.

### Việc tiếp theo (đề xuất)

1. Đăng nhập, tải một PDF và một DOCX trên `/kho-tai-lieu`, kiểm tra lưu và lọc môn.
2. Quyết định trang xem tài liệu trong app (xem mục trên).
3. Kiểm tra Dropdown trình soạn có xuống dòng không.
4. Kiểm tra modal kho câu hỏi và nav pane trên cửa sổ đủ rộng.
