# Prompt: responsive tab "Bắt đầu" (màn chào + danh sách tệp gần đây) cho điện thoại và máy tính bảng

> Làm trên **nhánh mới** `agy/responsive-bat-dau` tạo từ `origin/main` mới nhất:
> `git fetch origin && git switch -c agy/responsive-bat-dau origin/main`.
> Không làm trên `main`. Không push, không merge. Xong thì commit trên nhánh và báo lại.

---

## Bối cảnh

Đọc phần đầu `context.md` (nguyên tắc, lệnh). Web app soạn đề tiếng Việt: React 19 + TypeScript + Vite + Tailwind v4.

Việc này **chỉ** làm tab **Bắt đầu** ở `/soan-de` (màn hiện ra khi chưa mở tệp nào):
- Lời chào "Chào buổi tối. / Bắt đầu từ một đề trống nhé?"
- 3 thẻ tạo mới: Đề thi (AI, .docx), Slide (AI, .pptx), Bảng vẽ.
- Hàng công cụ: nút lọc Tất cả / Đề thi / Slide / Bảng vẽ, ô "Tìm tên đề…", chữ "Gần đây · N tệp".
- Bảng tệp gần đây: cột ô chọn, TÊN, VỊ TRÍ, SỬA ĐỔI, KÍCH THƯỚC; khi chọn nhiều tệp có thanh thao tác hàng loạt.

File:
- `src/examEditor/StartTab.tsx`: giao diện (class `start-scroll`, `start`, `start-hero`, `quick-cards`, `quick-card`, `recents`, `recents-toolbar`, `filter-pills`, `file-search`, `recents-heading`, `recent-table`, `recent-columns`, `recent-columns--bulk`…).
- `src/examEditor/compose.css`: CSS của các class trên. **Hiện chưa có luật responsive nào cho màn này.** Các luật mobile khác của app nằm ở `@media (max-width: 1023px)` và `@media (max-width: 639px)` gần cuối file. Theo đúng 2 mốc này: **điện thoại < 640px**, **máy tính bảng 640–1023px**.
- Thanh tab trên cùng ("Bắt đầu", "Bảng vẽ 12/11/2026", "+") là `src/examEditor/TabStrip.tsx`, đã có luật mobile; chỉ cần kiểm tra lại là không tràn ngang trên màn này.

**Không được đổi:** logic (lọc, tìm, sắp xếp, chọn nhiều, mở / xoá / đổi tên tệp), dữ liệu, chữ hiển thị, giao diện trên máy tính (≥ 1024px phải y như cũ). Chỉ sửa CSS, chỉ thêm class / phần tử phụ trong `StartTab.tsx` khi CSS không làm được.

## Yêu cầu

### Máy tính bảng (640–1023px)
- Lề hai bên khoảng 24px, nội dung chiếm hết bề ngang (bỏ bề rộng cố định nếu có).
- 3 thẻ tạo mới vẫn nằm một hàng 3 cột, thu nhỏ padding cho vừa.
- Hàng công cụ: nút lọc + ô tìm cùng một hàng (ô tìm co giãn); "Gần đây · N tệp" có thể xuống hàng hoặc ẩn chữ "Gần đây", giữ số tệp.
- Bảng: ẩn cột **KÍCH THƯỚC**; cột VỊ TRÍ thu hẹp; tên dài thì cắt bằng dấu "…" (`text-overflow: ellipsis`), không đẩy cột khác.

### Điện thoại (< 640px)
- Lề hai bên 16px, **không cuộn ngang trang** ở bất kỳ bề rộng nào từ 360px.
- Lời chào: cỡ chữ nhỏ lại (khoảng 22–24px), xuống dòng tự nhiên.
- 3 thẻ tạo mới: **3 cột nhỏ gọn** (icon trên, tên dưới, ẩn dòng phụ ".docx / .pptx / Vẽ tay, sơ đồ"), hoặc một hàng cuộn ngang; mỗi thẻ cao ≥ 72px, bấm dễ. Giữ chip "AI".
- Hàng công cụ xếp 2 hàng: hàng 1 ô tìm kiếm rộng hết bề ngang; hàng 2 nút lọc (cuộn ngang được nếu thiếu chỗ) + số tệp bên phải.
- Bảng chuyển thành **danh sách dạng thẻ / dòng 2 tầng**, bỏ hàng tiêu đề cột:
  - Tầng 1: icon loại tệp + tên (cắt "…").
  - Tầng 2 (chữ nhỏ, màu nhạt): "Vị trí · Sửa đổi" (ví dụ "Bảng vẽ của tôi · Hôm nay 23:11"). Ẩn kích thước.
  - Mỗi dòng cao ≥ 56px.
  - Ô chọn: chỉ hiện khi đang ở chế độ chọn nhiều, hoặc giữ ở đầu dòng nhưng vùng bấm ≥ 40px. Menu thao tác của từng dòng (nếu có, ví dụ nút "…") phải bấm được bằng ngón tay, không chỉ hiện khi hover (thiết bị cảm ứng không có hover; dùng `@media (hover: none)`).
  - Thanh thao tác hàng loạt (khi đã chọn tệp) không tràn ngang; nếu dài thì cuộn ngang hoặc gom bớt vào menu.
- Trạng thái trống ("Chưa có tệp nào") và dòng báo hạn mức (`start-quota`) không tràn.

### Chung
- Dùng biến màu / token sẵn có trong `compose.css`, không thêm màu cứng mới.
- Tooltip dùng `data-tip` (không dùng `title=`), theo quy ước của dự án.
- Không thêm thư viện.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` không lỗi (không dùng `tsc -p .`).
2. Chạy `npm run dev -- --port 5190 --host 127.0.0.1`, mở `http://127.0.0.1:5190/soan-de`, xem ở các bề rộng **360, 390, 768, 1024, 1366px**:
   - Không có thanh cuộn ngang trang (`document.documentElement.scrollWidth <= innerWidth`).
   - Có ít nhất vài tệp trong danh sách (tạo thử 2–3 bảng vẽ / đề nếu trống), thử: lọc, tìm, chọn nhiều, mở một tệp.
   - Ở 1366px giao diện **giống hệt trước khi sửa**.
3. Chụp ảnh màn hình ở 390px và 768px gửi kèm báo cáo.
4. Báo lại: danh sách file đã sửa, những chỗ chưa làm được hoặc phải chọn khác yêu cầu, và lý do.
