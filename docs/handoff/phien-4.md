## BÀN GIAO PHIÊN 4 (28/10/2026) — tài khoản, lưu trữ đám mây, email. Đọc mục này TRƯỚC.

### Đã làm (nhánh `feat/r2-image-storage`, đã push)

- **Ảnh lưu lên Cloudflare R2** (bucket `dethinhbien`, vùng ENAM): `server/r2.ts` (`POST /api/upload`, `GET /api/files/*`, ký SigV4 bằng `crypto`), `src/lib/mediaStore.ts` (`uploadImage`, `toDataUrl`). Chèn ảnh đề, ảnh slide, nền slide, ảnh AI đều đẩy lên R2; PPTX đọc về data URL trước khi nhúng. Ảnh cũ dạng data URL vẫn chạy, chưa migrate.
- **Dữ liệu đề/slide vẫn ở localStorage** (`soandethi-docs`, `dethinhbien-v1`). Chưa đồng bộ theo tài khoản. Quyết định: chưa làm vì chưa có đăng nhập và chưa có server triển khai.
- **Đăng nhập bằng Supabase Auth** (project mới `dethinhbien`, id `ddcyhsxytbcdpgpggexh`, ap-southeast-1, miễn phí). Gọi REST bằng `fetch`, không SDK: `src/lib/auth.ts` (`signUp` có tên hiển thị, `signIn`, `signOut`, `requestReset`, `setNewPassword`, `currentSession` tự refresh, `consumeAuthRedirect` đọc phiên từ hash sau khi xác nhận email). `src/lib/useSession.ts` cho header. Trang `src/pages/Auth.tsx` (một component cho 4 chế độ) có animation lặp vô hạn, tắt theo `prefers-reduced-motion`. Route `/dang-nhap`, `/dang-ky`, `/quen-mat-khau`, `/dat-lai-mat-khau`; các route này ẩn footer và vừa một màn hình.
- **Header** (`src/components/Layout.tsx`): chưa đăng nhập hiện Đăng nhập/Đăng ký; đã đăng nhập hiện tên (hoặc email) và Đăng xuất. Menu điện thoại có cùng mục.
- **Mẫu email** `supabase/email-templates/confirm.html` và `recovery.html`: tiêu đề và nội dung tiếng Việt, logo ảnh từ URL r2.dev. Đã dán vào Supabase.
- Ngoài repo: Supabase `Site URL` = `http://localhost:5184`; Redirect URLs `localhost:5184/**` và `localhost:5185/**`; SMTP = Gmail `smtp.gmail.com:465`, username `afkbinh1412007@gmail.com`, người gửi `đề rõ`. Mật khẩu là mật khẩu ứng dụng Google do bạn nhập trong dashboard.

### Biến môi trường (`.env`, không commit)

- R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=dethinhbien`.
- Cloudflare: `CLOUDFLARE_API_TOKEN` (quyền D1 Edit, Email Sending Edit), `CLOUDFLARE_ACCOUNT_ID` (cùng giá trị `R2_ACCOUNT_ID`).
- Supabase (public, đưa được vào client): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Resend: đã thử, không gửi được; không còn dùng.

### Chưa xong / cần kiểm tra

1. **Email xác nhận chưa xác nhận hiển thị logo.** Email tài khoản thử gửi lúc 13:56 vẫn dùng nội dung cũ. Mẫu email đặt bằng `monaco.editor` `setValue` không được Supabase ghi nhận; sửa bằng phím rồi lưu thì được nhưng chưa kiểm tra lại bằng email xác nhận mới. Email đặt lại mật khẩu đã có logo (kiểm tra qua Gmail API).
2. **Luồng xác nhận email rồi tự đăng nhập** chưa chạy thật: cần bấm link trong email rồi xem header.
3. **Bucket R2 đang bật Public Development URL** (r2.dev, rate-limited, không khuyến nghị cho production). Mọi object, kể cả `img/`, đọc được qua URL nếu biết đường dẫn. Cần custom domain trước khi triển khai.
4. **Không có server triển khai.** `/api/upload`, `/api/files`, `/api/llm` chỉ chạy trên Vite dev server. Bản web thật cần nơi chạy server.
5. **Project cũ `onmiexam-v2`** đang INACTIVE, chưa xoá. Bạn định xoá khi hết giới hạn 300 email Google.
6. **Tài khoản Supabase**: đã xoá hết tài khoản thử, hiện không có người dùng nào.
7. Mobile: trang xác thực không cố định chiều cao, có thể cuộn trên điện thoại (chủ ý).

### Bẫy đã gặp (đừng lặp lại)

- Supabase **không cho sửa mẫu email khi chưa bật custom SMTP** (trang Templates báo "Set up custom SMTP to edit templates").
- Trang Templates dùng **Monaco**; `monaco.editor.getModels()[0].setValue()` làm nội dung hiển thị đúng nhưng Save có thể không ghi body. Cách chắc: đổi một ký tự bằng phím rồi bấm Save, rồi gửi email thử để kiểm tra.
- Lỗi `Error sending confirmation email` từ `/auth/v1/signup`: SMTP chưa kết nối được. Kiểm tra log Resend/Gmail trước, log Auth của Supabase không hiện lỗi SMTP.
- Resend: `onboarding@resend.dev` chỉ gửi tới email chủ tài khoản Resend. Đã bỏ Resend.
- Gmail: mật khẩu ứng dụng chỉ tạo được khi đã bật Xác minh 2 bước, và phải tạo cho đúng tài khoản Gmail dùng làm username.
- Cloudflare R2 public URL nằm trong **Settings → Public Development URL**, cần gõ `allow` để xác nhận.
- Tạo project Supabase: `create_project` cần `confirm_cost` trước (kể cả gói $0).
- Bố cục: phần tử minh hoạ đặt sai trong lưới làm form nằm lệch cột. Gói chữ + minh hoạ trong một `div` cột.
- Mỗi lần `sed -i` vào file CRLF phải giữ `\r` ở cuối dòng; `grep -oE '^[A-Z_]+='` bỏ sót tên có chữ số (`R2_`).

### Lệnh hữu ích

- Dev: `npm run dev -- --port 5184 --host 127.0.0.1` (cổng bận thì Vite tự đổi).
- Test R2 thật: `npx tsx scripts/test-r2-upload.mjs` (upload → đọc lại → so khớp từng byte).
- Kiểm tra tài khoản Supabase: `GET $VITE_SUPABASE_URL/auth/v1/settings` với `apikey` = publishable key.

---

