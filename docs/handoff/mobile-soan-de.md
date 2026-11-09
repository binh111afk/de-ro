# Bàn giao: Giao diện soạn đề trên điện thoại (feat/mobile-soan-de)

## 1. Tóm tắt công việc đã thực hiện

Đã triển khai hoàn chỉnh chế độ soạn đề trên điện thoại theo tài liệu `docs/prompt-mobile-soan-de.md`.
Toàn bộ thay đổi di động được giới hạn trong media query `@media (max-width: 767px)` hoặc đi kèm điều kiện `isMobile` / `isReflow`, **giữ nguyên 100% giao diện desktop (≥ 1024px)**, không làm thay đổi mô hình dữ liệu đề (`ExamBlock`), không ảnh hưởng việc xuất Word hay in ấn.

### Các file đã chỉnh sửa / bổ sung
1. `src/examEditor/ExamEditor.tsx`: Thêm chế độ `isReflow`, dọn sạch page gaps, hiển thị dòng chảy đơn trang không ngắt trang cố định, padding `12px 12px 60px`, bề rộng co giãn tự nhiên `--doc-content-w: 100%`.
2. `src/pages/ComposeDoc.tsx`:
   - State `mobileView` (`'reflow' | 'paged'`), tự động phát hiện thiết bị dưới 768px để mặc định vào chế độ Dàn trang (reflow), lưu lựa chọn vào `localStorage['dethinhbien-mobile-view']`.
   - Nút chuyển đổi chế độ xem trên thanh trạng thái ("Xem trang A4" / "Dàn trang").
   - Mở `NavPanel` cho mobile dưới dạng Bottom Sheet với nút tiện ích và tab "Chèn".
   - Tối giản thanh trạng thái di động: chỉ giữ số trang và nút chuyển chế độ xem.
3. `src/examEditor/Ribbon.tsx`:
   - Xếp gọn thân ribbon thành một hàng cuộn ngang dưới 768px, chiều cao tối đa < 25vh.
   - Thêm nút thu gọn/mở rộng dải ruy-băng trong `ribbon-quick` và tự động bung khi chọn tab.
   - Thêm nút mở nhanh Công cụ & Khối mẫu (`.mobile-only-inline`) ở góc trên bên phải.
   - Bổ sung nhóm "Công cụ" trong tab "Chèn" (Công cụ vẽ, Khối mẫu, Mục lục).
4. `src/examEditor/NavPanel.tsx`:
   - Dưới 768px hiển thị dạng Bottom Sheet trượt từ đáy màn hình (`max-h-[85dvh] rounded-t-2xl shadow-2xl`), có tay nắm kéo, mờ nền backdrop.
   - Gồm 3 tab: Mục lục, Khối mẫu, Công cụ. Tự động đóng sau khi chèn hoặc nhảy tới câu.
5. `src/examEditor/tools/ToolShell.tsx` & `src/examEditor/tools/GraphToolModal.tsx`:
   - Toàn màn hình trên mobile (`h-full max-h-[100dvh] rounded-none md:rounded-[8px]`), cột nhập liệu phía trên, xem trước phía dưới.
   - Nút Huỷ / Chèn cố định ở đáy (`sticky bottom-0 bg-surface border-t`) luôn nhìn thấy.
6. `src/examEditor/Layout.tsx` (`AiDock`):
   - Đặt biến `--ai-dock-h` thông qua `window.visualViewport` để đảm bảo overlay vừa khít màn hình khi bàn phím ảo xuất hiện.
7. `src/examEditor/DocSelectionAi.tsx`:
   - Chiều rộng tự co theo `min(340px, calc(100vw - 16px))` và định vị kẹp trong `visualViewport`.
8. `src/examEditor/BankModal.tsx`:
   - Layout responsive chia 2 tầng cuộn độc lập (`grid-rows-[1fr_1fr] md:grid-rows-1`) vừa chọn câu vừa xem chi tiết trên màn hình 360px.
9. `src/examEditor/compose.css`:
   - Bổ sung các quy tắc CSS cho Reflow view, Ribbon một hàng, Bottom Sheet, Floating AI Pill, TabStrip cuộn ngang, FindPanel và FileMenu responsive.
   - Đảm bảo vùng chạm tối thiểu 40px và tôn trọng `env(safe-area-inset-*)`.
   - Đảm bảo `document.documentElement.scrollWidth <= innerWidth` (không cuộn ngang cấp trang).

---

## 2. Kết quả kiểm tra ("Kiểm tra trước khi báo xong")

1. **Kiểm tra TypeScript**:
   `npx tsc -p tsconfig.app.json --noEmit` -> **Thành công (0 lỗi, exit code 0)**.

2. **Chạy các bộ unit test**:
   - `npm run test:convert` -> **13/13 pass, 0 fail**.
   - `npm run test:export` -> **7/7 pass, 0 fail**.
   - `npm run test:docx` -> **test-docx: OK**.

3. **Kiểm tra tự động trên trình duyệt thật (Chrome DevTools Protocol)**:
   - **360×740 (Điện thoại nhỏ - Samsung / iPhone SE)**:
     - `document.documentElement.scrollWidth <= window.innerWidth`: **Đạt (scrollW: 360, innerW: 360)**.
     - Mở đề, gõ chữ, xoá chữ, định dạng: **Đạt**.
     - Mở Bottom Sheet (Công cụ, Khối mẫu, Mục lục): **Đạt**.
     - Mở Kho câu hỏi (`BankModal`) và chèn câu có công thức Math/hình vẽ: **Đạt**.
     - Mở AI Dock, mô phỏng bàn phím ảo (giảm chiều cao xuống 420px): ô nhập `ai-composer` luôn hiển thị trên đáy màn hình, không bị bàn phím che: **Đạt**.
     - Chuyển "Xem trang A4" <-> "Dàn trang": hoạt động mượt mà, tải lại trang vẫn nhớ đúng trạng thái từ `localStorage`: **Đạt**.
   - **390×844 (Điện thoại tiêu chuẩn - iPhone 14)**:
     - `scrollW: 390, innerW: 390`: **Đạt, không có cuộn ngang**.
   - **768×1024 (Máy tính bảng dọc - iPad)**:
     - `scrollW: 768, innerW: 768`: **Đạt, không có cuộn ngang**.
   - **1440×900 (Desktop)**:
     - `scrollW: 1440, innerW: 1440`: **Đạt**.
     - Giao diện desktop giữ nguyên thiết kế chuẩn ban đầu: trang A4 đổ bóng, ribbon 80px, thước đo (Ruler), panel thanh bên cố định.

4. **Xuất Word (`.docx`)**:
   - Dữ liệu đề được tạo / chỉnh sửa trên mobile chuyển đổi sang khối `ExamBlock` và xuất Word cho kết quả giống hệt khi sửa trên desktop.

---

## 3. Danh sách ảnh chụp màn hình kiểm tra

Các ảnh được lưu trong thư mục `docs/handoff/mobile-anh/`:
- `360-reflow-content.png`: Màn hình soạn thảo ở chế độ Dàn trang (360px), hiển thị câu hỏi, phương án A-D, hình vẽ và công thức.
- `360-paged-a4.png`: Chế độ xem trang A4 trên màn hình 360px.
- `360-bottom-sheet-tools.png`: Ngăn kéo (bottom sheet) tab Công cụ vẽ trên màn hình 360px.
- `360-bottom-sheet-templates.png`: Ngăn kéo tab Khối mẫu.
- `360-bottom-sheet-toc.png`: Ngăn kéo tab Mục lục đề thi.
- `360-bank-modal.png`: Kho câu hỏi mở ở 360px, chia tầng cuộn chọn câu hỏi và xem chi tiết.
- `360-ai-dock-open.png`: Lớp phủ AI toàn màn hình trên điện thoại.
- `360-ai-dock-keyboard.png`: Lớp phủ AI khi xuất hiện bàn phím ảo (chiều cao 420px), ô soạn thảo nổi rõ phía trên.
- `390-reflow.png`: Chế độ dàn trang trên màn hình 390px (iPhone).
- `768-reflow.png`: Chế độ dàn trang trên máy tính bảng 768px.
- `1440-desktop.png`: Giao diện desktop (1440px) giữ nguyên hoàn toàn.

---

## 4. Chỗ chọn cách đơn giản & lý do

1. **Nút mở ngăn kéo Công cụ & Khối mẫu**:
   - *Cách chọn*: Đặt 1 icon tiện ích `Wrench` trên thanh tab ribbon (`ribbon-quick`) chỉ hiển thị trên mobile (`.mobile-only-inline`), đồng thời giữ các nút "Công cụ vẽ", "Khối mẫu", "Mục lục" trong tab "Chèn" của Ribbon.
   - *Lý do*: Thanh trạng thái ở 360px rất hẹp, chỉ đủ chỗ cho số trang và nút chuyển "Xem trang A4 / Dàn trang". Việc đặt nút mở nhanh trên ribbon giúp người dùng ở bất kỳ tab nào cũng có thể mở ngăn kéo chỉ với 1 chạm mà không làm tràn thanh trạng thái đáy.
2. **Kho câu hỏi (`BankModal`) trên mobile**:
   - *Cách chọn*: Sử dụng `grid-rows-[1fr_1fr]` thay vì tabs tách rời danh sách và chi tiết.
   - *Lý do*: Giúp người dùng vừa tick chọn nhiều câu ở nửa trên màn hình vừa lập tức xem trước toàn văn đề bài, công thức và hình vẽ ở nửa dưới, thao tác chèn nhanh chóng mà không cần chuyển qua lại giữa các màn hình con.
3. **Chống bàn phím ảo che AI Dock**:
   - *Cách chọn*: Lắng nghe sự kiện `resize` của `window.visualViewport` để set thuộc tính CSS `--ai-dock-h: ${window.visualViewport.height}px`.
   - *Lý do*: Trên iOS Safari và Android Chrome, bàn phím ảo không thu nhỏ `window.innerHeight` mà thu nhỏ `visualViewport`. Đo trực tiếp từ `visualViewport` giúp dock co lại chính xác tuyệt đối mà không cần tính toán layout phức tạp.

---

## 5. Chỗ còn có thể hoàn thiện thêm (Aesthetics / Backlog)

- Khi chọn bảng trong chế độ reflow, nếu bảng có từ 5-6 cột trở lên thì người dùng cần cuộn ngang bên trong khung bảng (`overflow-x: auto`) để xem hết các cột. Điều này là bình thường với bảng nhiều cột trên màn hình điện thoại 360px.
- Nút AI nổi hình viên thuốc hiện tại nằm ở góc dưới phải. Khi cuộn tới tận cùng chân trang, người dùng có thể thấy nút nổi che một góc nhỏ lề dưới cùng của trang giấy; tuy nhiên vùng lề này đã được bù đắp bằng padding đáy `60px`.
