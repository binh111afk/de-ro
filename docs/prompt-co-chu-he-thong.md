# Prompt: app chạy được khi người dùng phóng to cỡ chữ hệ thống (màn hình hẹp 260–320px)

> Làm trên **nhánh mới** `agy/co-chu-he-thong` tạo từ `origin/main` mới nhất, **trong worktree riêng** (thư mục chính có thể đang có việc khác):
> ```
> git fetch origin
> git worktree add ../dethinhbien-co-chu -b agy/co-chu-he-thong origin/main
> cd ../dethinhbien-co-chu
> npm install
> npm run dev -- --port 5193 --host 127.0.0.1
> ```
> Không làm trên `main`, không push, không merge. Xong thì commit trên nhánh và báo lại.

---

## Bối cảnh

Đọc phần đầu `context.md` (nguyên tắc, lệnh, bẫy hay gặp). Web app soạn đề tiếng Việt: React 19 + TypeScript + Vite + Tailwind v4.

Trên Android (Chrome, Cốc Cốc, Samsung Internet…), khi người dùng tăng cỡ chữ trong cài đặt máy, trình duyệt **phóng to cả trang** (như zoom). Trên iPhone, người dùng phóng bằng nút "aA" của Safari — kết quả giống vậy. Với CSS, điều này tương đương **màn hình hẹp đi**: điện thoại 390px + cỡ chữ 130% ≈ 300px, 150% ≈ 260px.

App hiện chỉ được kiểm tra từ 360px. Việc này: làm cho app **dùng được ở 260–320px** mà không thêm chế độ riêng nào.

Luật responsive hiện có: `@media (max-width: 1023px)` (máy tính bảng) và `@media (max-width: 639px)` (điện thoại) trong `src/examEditor/compose.css`, `src/index.css`, `src/examEditor/slide.css` và class Tailwind `sm:` / `lg:` trong component. Có thể thêm mốc `@media (max-width: 359px)` cho màn rất hẹp nếu cần, nhưng ưu tiên sửa sao cho bố cục tự co giãn (flex-wrap, min-width: 0, overflow cuộn) thay vì thêm mốc.

**Bẫy:** các file **CRLF** (`src/board/BoardEditor.tsx`, `src/examEditor/NavPanel.tsx`, `src/examEditor/RibbonAdaptive.tsx`, `src/examEditor/TabStrip.tsx`… — kiểm bằng `file <tên>`): không dùng `sed -i`. Sửa bằng công cụ Edit hoặc Python với `newline=''`, sau đó `git diff --stat` để chắc chỉ đổi vài dòng. Tooltip dùng `data-tip`, không dùng `title=`. Dùng lại component có sẵn (`Segmented`, `SheetTabs`, `Pop`…), không tự làm mới.

## Yêu cầu

### 1. Kiểm tra và lập danh sách trước
Dùng chế độ giả lập thiết bị của trình duyệt, xem ở bề rộng **320px, 280px, 260px** (chiều cao 640px), và thêm một lượt **390px với zoom trình duyệt 150%** để chắc kết quả giống. Đi qua các màn:
- Trang chủ, đăng nhập, các trang có menu (`src/pages/`).
- `/soan-de`: tab **Bắt đầu**; **soạn đề** (ribbon điện thoại, sheet công cụ, sheet Mục lục / Khối mẫu / Công cụ, panel AI, menu Tệp, các hộp công cụ vẽ đồ thị / bảng…); **slide** (thanh đáy, panel bên, dải slide); **bảng vẽ** (thanh công cụ, hàng bút / màu, các menu bật lên, panel Công cụ / Trợ lý, hộp Xuất, bảng PDF).
- Trang làm bài (`Quiz`), xem đề (`ExamView`).

Với mỗi màn ghi lại: chỗ bị **tràn ngang** (trang cuộn ngang: `document.documentElement.scrollWidth > innerWidth`), **bị cắt / che**, **nút không bấm được**, **hộp thoại / sheet cao quá màn hình mà không cuộn được**, **chữ đè lên nhau**.

### 2. Sửa
- **Không có thanh cuộn ngang toàn trang** ở bất kỳ màn nào từ 260px. Thanh công cụ / hàng tab / hàng nút dài thì **cuộn ngang bên trong** (overflow-x: auto, ẩn thanh cuộn) hoặc gom bớt vào nút "…" có sẵn.
- **Không đặt chiều cao cố định** cho phần tử chứa chữ (nút, thẻ, ô, tiêu đề); dùng `min-height` để chữ to hơn vẫn vừa.
- Chữ dài: **xuống dòng** nếu là nội dung, **cắt "…"** nếu là nhãn một dòng (tên tệp, tên tab) — luôn kèm `min-width: 0` cho phần tử flex cha.
- **Hộp thoại, sheet, menu bật lên**: tối đa bằng chiều cao màn hình (`max-height: 100dvh` hoặc tương đương trừ lề), phần thân **cuộn được bên trong**, nút đóng / nút chính luôn nhìn thấy.
- Vùng bấm vẫn **≥ 36px** ở màn hẹp.
- Bảng vẽ: canvas phải chiếm phần còn lại sau thanh công cụ, không bị thanh công cụ xuống nhiều dòng đẩy mất.

### 3. Không được đổi
- Logic, dữ liệu, chữ hiển thị.
- Giao diện ở **≥ 360px** giữ như hiện tại; ở **≥ 1024px** phải **y như cũ**.
- Không thêm thư viện.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` không lỗi (không dùng `tsc -p .`).
2. `npx vite build` chạy được.
3. Ở 260px, 280px, 320px: chạy `document.documentElement.scrollWidth <= innerWidth` trên từng màn trong danh sách → đều `true`; mở / đóng từng sheet, menu, hộp thoại, thấy đủ nút đóng và nút chính.
4. Ở 390px và 1366px: so với trước khi sửa, không khác.
5. Chụp ảnh ở 280px: tab Bắt đầu, soạn đề (có sheet công cụ mở), slide, bảng vẽ (có một menu bật lên), một hộp thoại.
6. Báo lại: bảng danh sách vấn đề tìm được (màn, mô tả, đã sửa / bỏ qua + lý do), danh sách file đã sửa.
