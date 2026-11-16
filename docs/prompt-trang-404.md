# Prompt: trang 404 (đường dẫn không tồn tại)

> Đưa nguyên file này cho agent (Antigravity CLI). Làm trên **nhánh riêng** `feat/trang-404`, không đụng `main`, không commit lên `main`, không push.

---

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4). Đọc `context.md` (phần đầu, "Nguyên tắc", "Bản đồ nhanh") trước.

Hiện tại gõ đường dẫn lạ (vd. `/abc`) thì `App.tsx` hiện luôn trang chủ (`<Route path="*" element={<Home />} />`). Người dùng không biết mình gõ sai link. Cần một trang 404 riêng.

Chạy dev: `npm run dev` → `http://127.0.0.1:5184`. Thử bằng `http://127.0.0.1:5184/duong-dan-khong-co`.

## Ý tưởng giao diện (bắt buộc theo hướng này)

Web là công cụ cho **giáo viên soạn đề thi**, nên trang 404 lấy hình ảnh **một tờ đề thi bị chấm**, không dùng hình minh hoạ chung chung.

- Ở giữa là một **tờ giấy đề thi** (thẻ trắng `bg-surface`, viền `border-line`, bóng nhẹ như các thẻ khác trong web). Đầu tờ có dòng nhỏ kiểu đề thật: "ĐỀ KIỂM TRA · Mã đề 404" (dùng class `eyebrow` có sẵn).
- Trong tờ có **"Câu 404."** in đậm (`font-display`) với nội dung câu hỏi: *"Trang bạn tìm nằm ở đâu?"* và 4 phương án A, B, C, D, ví dụ:
  - A. Đã bị xoá
  - B. Đường dẫn gõ sai
  - C. Đề đã được chuyển chỗ khác
  - D. Cả ba ý trên
- **Nét bút đỏ của giáo viên** (màu `clay`) khoanh tròn phương án D, rồi một dấu tích, rồi điểm **"404"** viết tay ở góc như điểm số. Vẽ bằng SVG (`path` nét tay hơi lệch, không phải hình tròn hoàn hảo).
- Dưới tờ đề: tiêu đề **"Không tìm thấy trang"** và một câu ngắn: "Đường dẫn có thể đã cũ hoặc bị gõ sai." Không viết dài.
- Hai nút: **"Về trang chủ"** (`Button variant="primary"`, link `/`) và **"Xem đề cộng đồng"** (`Button variant="outline"`, link `/de-cong-dong`). Icon `lucide-react` nhỏ (vd. `Home`, `BookOpen`).
- Hiện đường dẫn người dùng vừa gõ, chữ nhỏ dạng mã (`font-mono`, `text-ink-3`), cắt bớt nếu quá dài (`truncate`), để họ thấy mình gõ gì sai.

## Animation (chỉ CSS, không thêm thư viện)

Chạy **một lần** khi vào trang, tổng cộng khoảng 1,6–2 giây, rồi đứng yên:

1. Tờ đề trượt nhẹ lên và hiện dần (dùng keyframe `rise` hoặc `sheet-in` đã có sẵn trong `src/index.css`).
2. Các phương án A → D hiện lần lượt, mỗi dòng cách nhau ~80ms.
3. Nét bút đỏ **tự vẽ** vòng khoanh quanh D: `stroke-dasharray` + `stroke-dashoffset` chạy từ hết về 0 (~600ms, `ease-out`). Sau đó tới dấu tích, rồi số "404".
4. Sau khi vẽ xong, chỉ một chuyển động lặp **rất nhẹ** là được (vd. tờ giấy lơ lửng lên xuống 3–4px bằng keyframe `float-soft` có sẵn, chu kỳ ≥ 6s). Không thêm gì khác lặp liên tục.

Quy định:
- Chỉ animate `transform`, `opacity`, `stroke-dashoffset`. Không animate `width`, `height`, `top`, `left`, `box-shadow`, `filter`.
- **Bắt buộc** tôn trọng `prefers-reduced-motion: reduce`: tắt hết animation, hiện ngay trạng thái cuối (nét bút đã vẽ xong). Xem cách `.auth-type/.auth-pick/.auth-stamp` làm trong `src/index.css`.
- Keyframe mới (nếu cần) thêm vào `src/index.css`, khu `/* animation */`, đặt tên có tiền tố `nf-` (vd. `nf-draw`).

## Responsive: phải đẹp trên MỌI cỡ màn hình

Kiểm từng cỡ dưới đây bằng DevTools (Toggle device toolbar), chụp màn hình từng cỡ để báo lại:

| Cỡ | Ví dụ | Yêu cầu |
|---|---|---|
| 320 × 568 | điện thoại nhỏ | Không cuộn ngang. Tờ đề rộng gần hết màn (lề 16px). Hai nút xếp dọc, rộng 100%. Chữ phương án không bị tràn. |
| 375 × 812, 414 × 896 | điện thoại thường | Như trên, khoảng trắng cân đối. |
| 740 × 360 | điện thoại xoay ngang | Thấp: không được cắt nội dung. Cho phép cuộn dọc; thu nhỏ khoảng cách trên/dưới. |
| 768 × 1024 | máy tính bảng dọc | Tờ đề rộng tối đa ~520px, căn giữa. Hai nút nằm ngang. |
| 1024 × 768, 1366 × 768 | laptop | Có thể chia 2 cột: tờ đề bên trái, tiêu đề + nút bên phải. Hoặc giữ 1 cột căn giữa, miễn cân đối. |
| 1920 × 1080 | màn rộng | Nội dung không bị kéo giãn; khối chính tối đa ~960px, căn giữa cả ngang lẫn dọc trong vùng dưới header. |
| 2560 × 1440 | màn rất lớn | Web tự phóng to (`.site-scale` trong `index.css`): kiểm không bị vỡ bố cục. |

- Dùng breakpoint Tailwind (`sm`, `md`, `lg`) và `clamp()` cho cỡ chữ lớn (vd. số "404").
- SVG nét bút dùng `viewBox`, co giãn theo tờ đề, không đặt kích thước pixel cố định.
- Nút bấm cao tối thiểu 44px trên điện thoại.

## Tránh "AI slop" (bị loại nếu có)

- Không gradient nhiều màu, không đốm màu mờ (blob) làm nền, không glassmorphism, không hiệu ứng phát sáng.
- Không emoji, không "Oops!", "Ối!", "Uh-oh", không câu đùa dài dòng.
- Không ảnh minh hoạ tải từ mạng, không icon phi hành gia / con mèo / UFO.
- Không thêm màu ngoài token có sẵn trong `@theme` của `src/index.css` (`ink`, `ink-2..4`, `surface`, `canvas`, `sunken`, `line`, `clay`, `clay-soft`, `sage`, `honey`…). Không viết mã màu hex trong component.
- Không viết chữ in hoa cả câu dài, không đổ bóng chữ.
- Bo góc, cỡ chữ, khoảng cách theo đúng phong cách các trang có sẵn (xem `src/pages/Auth.tsx`, `src/components/ui.tsx`).

## Việc cần làm

1. Tạo `src/pages/NotFound.tsx` (export default). **Dùng lại** `Button` từ `@/components/ui`, `Link` của `react-router-dom`. Không tự làm nút mới.
2. `src/App.tsx`: đổi `<Route path="*" element={<Home />} />` thành `<Route path="*" element={<NotFound />} />`. Nạp trang theo **đúng cách các trang khác** đang được nạp trong `App.tsx` (lazy hay import thường thì làm giống chúng).
3. `src/pages/admin/AdminPage.tsx`: người không có quyền hiện tại thấy `<Home />` để giấu trang admin. Đổi thành `<NotFound />`, để `/admin` trông **giống hệt** mọi đường dẫn lạ khác. Giữ nguyên phần kiểm quyền, không sửa gì khác trong file này.
4. Đặt tiêu đề tab khi ở trang này là `Không tìm thấy trang · đề rõ` (đúng cách viết thường như trong `index.html`), khi rời trang thì trả lại tiêu đề cũ (`useEffect` + cleanup).
5. Giữ nguyên kiểu xuống dòng của file (CRLF hay LF). Sau khi sửa, chạy `git diff --stat`: nếu một file bị đổi gần như toàn bộ số dòng thì là đã đổi kiểu xuống dòng, phải sửa lại.

## Không được làm

- Không cài thêm thư viện (framer-motion, lottie…).
- Không sửa `server/`, `api/`, `supabase/`, `vercel.json`.
- Không đổi các route khác trong `App.tsx`.
- Không sửa header, footer, `Layout`.

## Kiểm tra trước khi báo xong

1. `npx tsc --noEmit -p .` không lỗi.
2. `npx vite build` chạy được.
3. Mở `/duong-dan-khong-co`, `/de-cua-toi/abc/xyz`, `/admin` (chưa đăng nhập): cả ba đều hiện trang 404 giống nhau. `/` vẫn là trang chủ.
4. Bật "Emulate CSS prefers-reduced-motion: reduce" trong DevTools (Rendering): trang hiện ngay trạng thái cuối, không có chuyển động.
5. Chụp màn hình đủ các cỡ trong bảng Responsive ở trên, và quay ngắn (hoặc chụp vài khung) animation lúc vào trang.
6. Báo lại: danh sách file đã sửa, kết quả bước 1–4, ảnh chụp.
