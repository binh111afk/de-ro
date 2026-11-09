# Prompt: làm màn soạn đề (kiểu Word) dùng được trên điện thoại

> Tạo **nhánh mới** `feat/mobile-soan-de` từ `main` mới nhất (`git fetch origin && git switch -c feat/mobile-soan-de origin/main`). Không làm trên `main`, không làm trên `feat/keo-nhan`.

---

## Bối cảnh

Đọc phần đầu `context.md` trước (nguyên tắc, lệnh, bản đồ nhanh). Phần này chỉ làm **màn soạn đề** ở `/soan-de`, tab soạn đề. Màn soạn **slide** không làm.

File chính:
- `src/pages/ComposeDoc.tsx`: bố cục màn soạn. Gồm: thanh tab nhiều đề → `Ribbon` → thân (`NavPanel` trái, sân soạn giữa, `AiDock` + `AiPanel` phải) → thanh trạng thái.
- `src/examEditor/compose.css`: CSS màn soạn. Đã có sẵn một ít luật mobile ở `@media (max-width: 1023px)` và `@media (max-width: 767px)` (gần cuối file): AI dock thành lớp phủ toàn màn, nút AI nổi, hàng tab ribbon cuộn ngang.
- `src/examEditor/Ribbon.tsx`, `Layout.tsx` (`AiDock`, `Ruler`, `useViewportSize`), `NavPanel`, `SelectionToolbar.tsx`, `FindPanel`, `src/examEditor/tools/ToolShell.tsx` (khung modal các công cụ vẽ), `BankModal.tsx`.

**Nguyên tắc không được phá** (trích `context.md`):
1. `ExamBlock` là dữ liệu lưu; TipTap chỉ là lớp trình bày. Mobile **không** được đổi dữ liệu đề, xuất Word, in.
2. Một editor TipTap liên tục; trang A4 chỉ là nền vẽ phía sau, co bằng CSS `zoom`, **không** dùng `transform`.

## Tình trạng hiện tại trên điện thoại (360–430px)

- Trang A4 tự co cho vừa bề ngang, sàn 25% (`fitScale` trong `ComposeDoc.tsx`). Trên 390px chữ còn khoảng 40%, **không đọc, không gõ nổi**.
- `NavPanel` (Mục lục / Khối mẫu / Công cụ) bị **ẩn hẳn** dưới 768px (`viewport.w >= 768 &&`). Người dùng điện thoại **không mở được công cụ vẽ, khối mẫu, mục lục**.
- Ribbon chỉ có hàng tab cuộn ngang; thân ribbon (các nhóm nút) tràn hoặc bị bóp.
- Thước kẻ, thanh trạng thái, thanh chọn văn bản chưa tính cho màn hẹp.

## Yêu cầu

### 1. Chế độ xem soạn trên điện thoại (quan trọng nhất)

Dưới 768px mặc định dùng **"chế độ dàn trang theo màn hình"**, giống "Mobile view" của Word:
- Trang rộng bằng màn hình (trừ lề nhỏ khoảng 12px). Chữ cỡ thật, **không** co còn 40%.
- Ẩn thước kẻ và nền trang A4; nội dung chảy liền một cột.
- Bảng, ảnh, phương án A–D xếp bằng tab stop, công thức: không được tràn ngang khỏi màn. Bảng rộng thì cuộn ngang **trong** khung bảng, ảnh co `max-width: 100%`.
- Có nút chuyển **"Xem trang A4"** (quay về cách co cả trang như hiện nay, cho phép cuộn và thu phóng để kiểm bố cục in). Nhớ lựa chọn bằng `localStorage`, bọc trong try/catch.
- Chỉ là cách **hiển thị**. Lề, khổ giấy, xuất Word, in giữ nguyên theo `pageSetup`.

Làm bằng CSS và một class trên `.compose-app` hoặc `.compose-canvas` (ví dụ `is-reflow`). Ở chế độ này cho `zoom: 1` và bỏ bề rộng cố định `PAGE_W`. Đọc kỹ cách `ExamEditor` / CSS trang đang ấn định bề rộng A4 và chia trang trước khi sửa. Nếu phần chia trang / vẽ nền trang tính theo bề rộng px cố định, ở chế độ này **tắt phần vẽ ngắt trang**, đừng sửa thuật toán chia trang.

### 2. Ribbon gọn trên điện thoại

- Hàng tab giữ cuộn ngang như hiện có.
- Thân ribbon: các nhóm nút xếp thành **một hàng cuộn ngang**, nút cao tối thiểu 40px. Nhãn chữ dài thì ẩn, giữ icon + `aria-label`/`title`. Nhóm nào quá phức tạp (thước lề, màu trang…) có thể chuyển vào menu "Thêm".
- Không để ribbon chiếm quá khoảng 1/4 chiều cao màn. Có thể cho thu gọn ribbon (chỉ còn hàng tab) bằng một nút.

### 3. Mở được Mục lục / Khối mẫu / Công cụ trên điện thoại

- Bỏ việc ẩn hẳn `NavPanel` dưới 768px. Thay bằng **ngăn kéo từ dưới lên (bottom sheet)** hoặc lớp phủ toàn màn, mở bằng một nút trên ribbon hoặc thanh dưới.
- Chọn một mục (chèn khối mẫu, chèn hình công cụ, nhảy tới khối) xong thì tự đóng ngăn kéo.
- Modal công cụ vẽ (`ToolShell`): trên điện thoại hiển thị toàn màn; cột nhập ở trên, xem trước ở dưới (đã có `md:flex-row`, kiểm tra lại cho đủ dùng); nút Huỷ / Chèn luôn nhìn thấy ở đáy.

### 4. AI

`AiDock` trên điện thoại đã là lớp phủ toàn màn + nút nổi. Kiểm tra: nút nổi không che nội dung đang gõ và không đè thanh trạng thái; ô nhập không bị bàn phím ảo che (dùng `visualViewport` hoặc `dvh` nếu cần).

### 5. Chi tiết khác

- Thanh trạng thái: chỉ giữ số trang và nút chuyển chế độ xem; phần còn lại ẩn.
- Thanh công cụ khi chọn chữ (`SelectionToolbar`) và `DocSelectionAi`: không tràn khỏi màn, không bị bàn phím che.
- Thanh tab nhiều đề (`TabStrip`): cuộn ngang, tab không bị bóp méo chữ.
- `FindPanel`, `BankModal`, menu Tệp (`FileMenu`): dùng được ở 360px.
- Không có cuộn ngang ở cấp trang. Vùng chạm tối thiểu 40px. Tôn trọng `env(safe-area-inset-*)`.

## Không được

- Không đổi giao diện desktop (≥ 1024px). Mọi thay đổi nằm trong media query < 1024px / < 768px, hoặc sau điều kiện bề rộng.
- Không đổi dữ liệu đề, `ExamBlock`, xuất Word, in.
- Không dùng `transform: scale` cho trang (phá vị trí con trỏ TipTap). Giữ CSS `zoom`.
- Không thêm thư viện UI mới.
- Không ghi đường dẫn tuyệt đối ra ngoài dự án vào code.
- Không commit lên `main`, không push `--force`.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch. **Không** dùng `tsc -p .`.
2. Chạy `npm run test:convert`, `npm run test:export`, `npm run test:docx`, tất cả phải đạt.
3. Dev server: `npm run dev -- --port 5184 --host 127.0.0.1`, mở `http://127.0.0.1:5184/soan-de`. Giả lập ở ba bề rộng **360×740, 390×844, 768×1024**, và **1440×900** để chắc desktop không đổi. Mỗi cỡ chụp ảnh màn hình và thử:
   - mở một đề có bảng, ảnh công cụ, công thức, câu trắc nghiệm A–D; gõ và xoá chữ; chọn chữ và in đậm;
   - mở ngăn kéo Công cụ, chèn một đồ thị; mở Khối mẫu, chèn một khối; mở Mục lục, nhảy tới câu;
   - mở AI, gõ một yêu cầu (không cần gửi), kiểm tra bàn phím ảo không che ô nhập (giả lập bằng cách giảm chiều cao khung);
   - chuyển "Xem trang A4" rồi chuyển lại; tải lại trang, kiểm tra lựa chọn được nhớ;
   - kiểm tra **không có cuộn ngang cấp trang**: `document.documentElement.scrollWidth <= innerWidth`.
4. Xuất Word một đề sau khi sửa trên mobile, kiểm tra file giống hệt khi sửa trên desktop.

## Bàn giao

- Commit nhỏ theo từng mục (1–5), message tiếng Việt. Push nhánh `feat/mobile-soan-de`.
- Viết `docs/handoff/mobile-soan-de.md`: đã làm gì, file nào, ảnh chụp ở từng bề rộng (lưu trong `docs/handoff/mobile-anh/`), chỗ còn chưa đẹp, chỗ chọn cách đơn giản và lý do. Người review sẽ đọc file này trước.
