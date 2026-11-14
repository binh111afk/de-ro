# Prompt: làm lại landing page (trang chủ `/`) cho đúng các tính năng hiện tại

> Làm trong **worktree riêng + nhánh riêng** tạo từ `origin/main` mới nhất:
> ```
> git fetch origin
> git worktree add ../dethinhbien-landing -b agy/landing-page origin/main
> cd ../dethinhbien-landing
> npm install
> npm run dev -- --port 5194 --host 127.0.0.1
> ```
> Không làm trên `main`, không push, không merge. Commit trên nhánh theo từng phần (mỗi section một commit cũng được), xong thì báo lại.

---

## Bối cảnh

Đọc phần đầu `context.md` (nguyên tắc, lệnh, bẫy hay gặp). Web app soạn đề tiếng Việt "đề rõ": React 19 + TypeScript + Vite + Tailwind v4.

Trang chủ `src/pages/Home.tsx` (Hero + HeroConsole, Marquee, Features với 6 thẻ, HowItWorks, Showcase, CallToAction) được viết từ **lúc web mới có vài tính năng** (soạn đề từ câu lệnh, đề tương tác, chat sửa đề, xuất Word, đổi số liệu, kho tài liệu). Giờ web đã nhiều hơn hẳn, trang chủ **không còn phản ánh đúng**. Việc này: **thiết kế và viết lại trang chủ**.

### Tính năng hiện có (tự mở web kiểm tra lại từng cái trước khi viết, đừng chép mù danh sách này)
- **Soạn đề** (`/soan-de`, tab Đề thi): trình soạn kiểu Word có ribbon, trang A4, mục lục, khối mẫu; **AI sinh đề** trắc nghiệm / tự luận theo mô tả, rà soát đề, chat sửa đề; xuất **.docx**, in A4.
- **Công cụ vẽ hình cho đề** (panel Công cụ, `src/examEditor/tools/`): Toán (đồ thị hàm số, bảng biến thiên, bảng xét dấu, hệ trục Oxy, thống kê, ghép nhóm, hình phẳng, hình không gian, đường tròn lượng giác, sơ đồ cây, trục số, Venn, bảng); Vật lí (mạch điện, chuyển động, chất khí, mặt phẳng nghiêng, chuyển thể, dao động, thấu kính, điện trường); Hoá (cấu hình electron, công thức cấu tạo, đồ thị, phương trình phản ứng); Sinh (phả hệ, bảng Punnett, lưới thức ăn). Đây là điểm khác biệt lớn — nên có section riêng.
- **Soạn slide bài giảng** (tab Slide): AI lập dàn ý → sinh slide, theme, hiệu ứng, xuất **.pptx**.
- **Bảng vẽ** (tab Bảng vẽ): bút máy / bút bi / bút lông / bút chì / bút phấn / dạ quang, nền giấy kẻ / bảng đen / bảng xanh, thước kẻ / thước đo góc / compa, **ghi chú lên PDF** (cột trang thu nhỏ), chèn hình từ công cụ vẽ, trợ lý AI vẽ theo lệnh, xuất PNG / PDF có xem trước.
- **Đề online / đề tương tác**: tạo đề làm trực tuyến (`/tao-de-online`), học sinh làm bài (`/lam-de/:id`), xem kết quả.
- **Chấm trắc nghiệm** (`/cham-trac-nghiem`).
- **Kho tài liệu** (`/kho-tai-lieu`), **Đề cộng đồng** (`/de-cong-dong`), **Đề của tôi** (`/de-cua-toi`).
- Dùng được trên **điện thoại / máy tính bảng** (giao diện riêng cho màn nhỏ).
- Miễn phí (giữ đúng các con số / thông tin thật đang có trên trang; không bịa số liệu người dùng, đánh giá, logo trường).

## Yêu cầu thiết kế

### Nội dung
- Thông điệp chính: giáo viên soạn **đề thi, bài giảng, bảng vẽ** trong một chỗ, có AI hỗ trợ, có công cụ vẽ hình chuyên môn theo môn, xuất đúng định dạng Word / PowerPoint.
- Bố cục gợi ý (được đổi nếu có lý do tốt): Hero → dải 3 "sản phẩm" (Đề thi · Slide · Bảng vẽ) → **Công cụ vẽ hình theo môn** (cho xem nhiều hình thật) → AI trong quy trình (sinh đề / rà soát / sinh slide / vẽ theo lệnh) → Đề online & chấm bài → Dùng mọi thiết bị → Kho tài liệu / cộng đồng → Kêu gọi bắt đầu.
- Chữ tiếng Việt tự nhiên, ngắn, cụ thể, giọng của người làm giáo dục. **Không** dùng câu sáo kiểu "cách mạng hoá", "trải nghiệm vượt trội", "sức mạnh của AI", "nâng tầm"…
- Mọi nút "Bắt đầu / Thử ngay" dẫn đúng chỗ (`/soan-de`, tab tương ứng nếu có cách mở trực tiếp; nếu không có thì `/soan-de`).

### Minh hoạ: **dùng giao diện thật của web**
- Không vẽ mockup giả, không ảnh stock, không minh hoạ AI tạo.
- Cách làm: **chụp màn hình giao diện thật** (chạy dev, dựng nội dung mẫu đẹp: một đề có hình đồ thị, một bộ slide, một bảng vẽ có nét phấn trên bảng đen, ghi chú PDF…), lưu ảnh vào `public/landing/` dạng **WebP** (kèm bản 2x cho màn nét), có `width`/`height` để không giật bố cục, `loading="lazy"` cho ảnh dưới màn đầu. Hoặc **nhúng component thật** ở chế độ chỉ xem nếu nhẹ (ví dụ hình SVG xuất từ `renderTool` trong `src/lib/toolSpec` cho section công cụ vẽ — hình vector thật, sắc nét mọi cỡ màn).
- Ảnh chụp không chứa thông tin cá nhân, email, tên thật.
- Tổng dung lượng ảnh trang chủ nên dưới ~1.5MB; ảnh màn đầu (hero) dưới ~250KB.

### Phong cách — đẹp, có chủ đích, **không "AI slop"**
- Giữ nhận diện hiện có: font, bảng màu token trong `src/index.css` (`clay`, `ink`, `paper`, `cream`…), logo `public/brand/`. Không thêm font mới nếu không thật cần.
- **Tránh**: gradient tím-xanh, chữ gradient, nền blob mờ, kính mờ (glassmorphism) tràn lan, emoji trang trí, lưới 3×N thẻ icon giống hệt nhau, icon sparkle ✨ cho mọi thứ AI, bóng đổ nặng, bo góc quá to, mọi section cùng một khuôn "tiêu đề giữa + 3 cột".
- **Nên**: nhịp bố cục thay đổi giữa các section (ảnh lớn lệch trái/phải, lưới ảnh không đều, section tối xen sáng), typography có cấp bậc rõ, khoảng trắng rộng, chi tiết nhỏ chăm chút (chú thích ảnh, nhãn môn học, con trỏ / nét bút minh hoạ thao tác).
- Tham khảo cách làm (không sao chép): trang của Linear, Notion, Excalidraw, Things, Arc — chú ý cách họ dùng ảnh sản phẩm thật.

### Animation
- Có chuyển động nhưng **tiết chế, có nghĩa**: xuất hiện khi cuộn tới (mờ dần + dịch 12–24px, so le nhẹ), ảnh sản phẩm chuyển cảnh (ví dụ hero luân phiên Đề thi → Slide → Bảng vẽ), section công cụ vẽ có thể chạy chậm dải hình hoặc vẽ nét SVG (`stroke-dashoffset`), số liệu đếm lên.
- Chỉ animate `transform` / `opacity` (và `stroke-dashoffset` cho SVG). Dùng `IntersectionObserver` + CSS, **không thêm thư viện animation**. Hiện đã có class `stagger`, `page-enter`, `float-soft` — xem và dùng lại nếu hợp.
- Tôn trọng `@media (prefers-reduced-motion: reduce)`: tắt chuyển động, hiện nội dung ngay.
- Không làm giật cuộn (không scroll-jacking), không chặn tương tác khi đang chạy.

### Responsive — bắt buộc kiểm đủ
| Màn | Bề rộng kiểm | Ghi chú |
|---|---|---|
| Điện thoại | 360, 390 | 1 cột, ảnh vừa khung, chữ hero ~30–36px, nút ≥ 44px |
| Chữ hệ thống phóng to | 260, 280, 320 | không tràn ngang, không cắt chữ (xem `docs/prompt-co-chu-he-thong.md`) |
| Máy tính bảng | 768, 1024 | 2 cột hợp lý, ảnh không bị bóp méo |
| 15 inch | 1366, 1536 | nội dung trọn trong khung, màn đầu thấy được hero + nút chính ở cao 768px |
| 30 inch | 2560 | app tự phóng `.site-scale` 115% ở ≥ 2200px (xem cuối `src/index.css`) — kiểm cho đẹp, không lọt thỏm, ảnh không vỡ (dùng bản 2x) |

- Không có thanh cuộn ngang ở bất kỳ bề rộng nào (`document.documentElement.scrollWidth <= innerWidth`).

### Kỹ thuật
- Có thể tách `Home.tsx` thành các file section trong `src/pages/home/` cho gọn (mỗi file < ~300 dòng).
- Tooltip dùng `data-tip`, không `title=`. Dùng lại component có sẵn (`src/components/ui.tsx`, `Segmented`…).
- Giữ SEO: `<title>`, mô tả trong `index.html` cập nhật cho đúng nội dung mới; thẻ heading đúng thứ tự (một `h1`).
- Hiệu năng: trang chủ không kéo theo code trình soạn nặng (không import `ComposeDoc`, `BoardEditor`… vào Home). Lighthouse (mobile) Performance ≥ 85, CLS < 0.1.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` không lỗi (không dùng `tsc -p .`); `npx vite build` chạy được.
2. Xem đủ các bề rộng trong bảng trên, chạy kiểm tra tràn ngang ở từng bề rộng.
3. Bật `prefers-reduced-motion` (DevTools → Rendering) thấy nội dung hiện đủ, không chuyển động.
4. Bấm thử mọi nút / link trên trang chủ, đều dẫn đúng chỗ.
5. Chụp ảnh toàn trang ở 390px, 1024px, 1440px, 2560px gửi kèm báo cáo.
6. Báo lại: bố cục các section và lý do chọn, danh sách ảnh đã chụp (đường dẫn, dung lượng), file đã sửa, điểm Lighthouse, chỗ chưa làm được.
