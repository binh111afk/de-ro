# Bàn giao phiên 13 (01/11/2026)

## Đã làm

**Đề online & cộng đồng** (commit `53921a3`)
- Một nút "Đăng" (bỏ chọn "Cho học sinh / Lên cộng đồng"); nút "Đăng đề" ở Cộng đồng liệt kê cả đề tạo online.
- Trang kết quả riêng `/tao-de-online/ket-qua/:id` có bục top 3; quay lại đúng tab `?tab=published`.
- Học sinh không cần tài khoản: form tên/lớp/STT, mã thiết bị, tuỳ chọn làm 1 lần, danh sách lớp; RPC `exam_gate` (migration `20261101_attempt_student_info.sql` đã chạy). Đề đăng cộng đồng thì tắt bước xác minh.
- Xem đề cộng đồng hiển thị đúng kiểu trình soạn/Word (`ExamEditor readOnly`), nút "Lưu" → đề online hoặc trình soạn.

**Trình soạn slide** (commit `de1d857`, `85bf922` và commit cuối phiên)
- Tab "Đồ hoạ" (đổi tên từ Thành phần, bỏ chip lọc). Mục Hoạ tiết: 78 (B.svg) + 60 nét tay (sheet đợt 2), chèn tay được, AI vẫn không dùng.
- Khung ảnh 38 hình (`PHOTO_FRAMES` trong `src/lib/slideShapes.ts`): kéo ảnh từ máy / tab Tải lên / ảnh trên slide vào, xem trước khi kéo, nút Chọn/Đổi ảnh khi rê chuột.
- Tay nắm kiểu Canva (chấm tròn, viên thuốc, vùng bấm 28px; góc nằm trên cạnh). Hộp chữ không có tay nắm trên/dưới; kéo góc phóng chữ, chiều cao nhân đúng tỉ lệ. Hộp chữ mới rộng 30%.
- Đồ hoạ chèn đúng tỉ lệ, kéo góc giữ tỉ lệ. Bấm Lật có chuyển động. Kéo phần tử ra ngoài mép slide được.
- Đường gióng + hút (5px, giữ Alt để tắt) và nhãn khoảng cách px (slide quy 1920×1080). Thanh định dạng nổi ẩn khi kéo.
- Tìm đồ hoạ: mọi từ phải khớp đầu từ, không dấu; tìm cả hoạ tiết và khung ảnh (`findGraphics`, `matchesWords`).
- Responsive: điện thoại có thanh tab đáy + tấm trượt, AI toàn màn hình; tablet AI nổi đè.
- Lazy-load trang và trình soạn slide (chunk chính 3,5 MB → 495 KB).
- F5 mở lại đúng các tab đang soạn (sessionStorage `dethinhbien-compose-session`, xem `restoreSession` trong `ComposeDoc.tsx`).

**Sửa icon**
- 47 icon tô hở do `fill-rule="evenodd"` trên các hình chồng → `FILL_NONZERO` trong `scripts/import-graphics.mjs`.
- Vẽ lại theo lớp: 2 hoa sen (`lit-hoa-sen`, `orn-sen` — trong `import-graphics.mjs`) và 24 icon trong `scripts/graphics-redraw.mjs`.

## Hướng dẫn sửa icon (cho phiên sau)

Kho đồ hoạ `src/lib/graphics.ts` là file **sinh tự động** — không sửa tay. Sửa trong script rồi chạy `node scripts/import-graphics.mjs`.

1. **Tìm mã icon** theo tên người dùng nói (tên có thể trùng — ví dụ 2 "Bắt tay", 2 "Kính lúp"):
   `node -e "..."` lọc `id/name/category` trong `graphics.ts`, rồi dựng bảng xem trong trình duyệt (dev server, `import('/src/lib/graphics.ts')`, chèn `<div id="__chk">` cố định chứa các svg) để chắc đúng icon. Gỡ `#__chk` khi xong.
2. **Chẩn đoán**:
   - Mảng trắng/tô hở ở chỗ hai hình chồng → thêm id vào `FILL_NONZERO` (đổi evenodd → nonzero). Kiểm bằng cách đặt bản cũ/mới cạnh nhau: lỗ cố ý (ô giữa khung ảnh) không được bị lấp.
   - Nét chồng chéo, lệch, hình kỳ → vẽ lại trong `scripts/graphics-redraw.mjs` (`REDRAWN[id] = svg(...)`).
3. **Quy ước vẽ lại** (xem helper đầu file `graphics-redraw.mjs`):
   - Khung `0 0 70 70`, chừa lề ~4px; nét `#22333B` dày 3, `stroke-linejoin/linecap="round"` (helper `fill`, `line`, `circle`, `dot`).
   - Vẽ **từ sau ra trước**; mỗi bộ phận tự tô (`fill(d, MÀU)`) để che nét phía sau → nét nối tiếp, không chồng.
   - Chỉ dùng màu pastel có sẵn (`MINT, PEACH, BEIGE, BLUE, PINK, GREEN, YELLOW, LILAC, WHITE`). Màu xuất hiện nhiều nhất là "màu chủ đạo" người dùng đổi được — giữ màu gốc của icon trừ khi gốc sai nghĩa.
   - Không dùng `<rect>`, `<text>`, `<image>`, gradient, filter (test cấm `<rect>`; vẽ hình chữ nhật bằng path `M..H..V..Z`).
   - Có thể tính toạ độ bằng JS (xem `snowflake()`), xoay cả nhóm bằng `<g transform="rotate(...)">` (xem guitar).
4. **Kiểm tra**: `node scripts/import-graphics.mjs` → tải lại trang (module cũ bị giữ đến khi reload) → xem icon ở 60px và ~180px → `npm run test:slide-graphics` (21 nhóm) → `npx tsc -b --noEmit`.

## Còn lại / chưa kiểm

- Icon "Mũi tên vòng cung" (`arrow-vong-cung`) có mảng cam vuông lệch từ file gốc — nên vẽ lại.
- Hút/đường gióng chỉ khi di chuyển, chưa khi đổi kích thước; chưa có chọn nhiều phần tử / khoảng cách đều.
- Trên điện thoại chưa có thanh công cụ theo ngữ cảnh kiểu Canva; chưa thử bằng thao tác chạm thật.
- Kho đồ hoạ (~630 KB) vẫn nằm trong chunk ComposeDoc vì `AiPanel` dùng chung cho đề và slide.
- Xuất PPTX: khung ảnh hình dạng (trừ tròn) ra chữ nhật.
- Dữ liệu thử trong máy dev: 2 bài giảng "Bài giảng mới", 1 đề "Đề thi mới" (dòng "Câu 1. Thử khôi phục phiên") — xoá được.
