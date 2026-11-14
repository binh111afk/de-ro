# Prompt: hiệu ứng trượt cho các panel hiện ra trên điện thoại / máy tính bảng

> Làm trên **nhánh mới** `agy/mobile-panel-truot` tạo từ `origin/main` mới nhất:
> `git fetch origin && git switch -c agy/mobile-panel-truot origin/main`.
> Không làm trên `main`. Không push, không merge. Xong thì commit trên nhánh và báo lại.
> Chạy dev: `npm run dev -- --port 5192 --host 127.0.0.1`.

---

## Bối cảnh

Đọc phần đầu `context.md` (nguyên tắc, lệnh, bẫy hay gặp). Web app soạn đề tiếng Việt: React 19 + TypeScript + Vite + Tailwind v4.

Trên điện thoại (< 640px) và máy tính bảng (640–1023px) có nhiều **panel / sheet / ngăn kéo / menu bật lên** làm riêng cho màn nhỏ, ví dụ panel "Công cụ", panel thêm công cụ vẽ, panel AI, danh sách trang / slide, menu ribbon thu gọn… Nhiều cái đang **hiện ra / biến mất tức thì**, không có hiệu ứng trượt.

Chỗ nên tìm (không chỉ giới hạn ở đây): `src/examEditor/` (`compose.css` có luật `@media (max-width: 1023px)` và `@media (max-width: 639px)`, `AiPanel.tsx`, `NavPanel.tsx`, `RibbonAdaptive.tsx`, `SlideRibbon.tsx`, `SlideSidePanel.tsx`, `SlideStrip.tsx`, `tools/ToolsPanel.tsx`, `Layout.tsx`), `src/board/BoardEditor.tsx` (+ `boardUi.tsx`: `Pop`, panel bên `SideBtn`…), `src/components/` (`Layout.tsx`, `Dialog.tsx`…), `src/pages/`.
Trong `compose.css` đã có sẵn keyframes trượt (`panelTabInUp`, `panelTabOutUp`, `panelTabInDown`, `panelTabOutDown`, `attach-in` / `attach-out`): **dùng lại** hoặc theo cùng kiểu, đừng tạo nhiều bộ hiệu ứng khác nhau.

**Bẫy:** `src/board/BoardEditor.tsx` là file **CRLF**, không dùng `sed -i` (đổi cả file sang LF). Sửa bằng công cụ Edit hoặc Python mở với `newline=''`, xong chạy `git diff --stat` để chắc chỉ đổi vài dòng. Tooltip dùng `data-tip`, không dùng `title=`. Dùng lại component có sẵn, không tự làm mới.

## Yêu cầu

### 1. Lập danh sách trước
Mở app ở bề rộng **390px** và **768px**, đi qua các màn: `/soan-de` (tab Bắt đầu, soạn đề, slide, bảng vẽ), trang chủ, các trang có menu. Bấm **mọi** nút làm hiện panel / sheet / menu / ngăn kéo / lớp phủ. Ghi vào báo cáo dạng bảng: tên panel, file + component, hiện tại có trượt chưa (vào / ra).

### 2. Thêm hiệu ứng cho những cái chưa có
- Panel nằm **dưới đáy** (bottom sheet): trượt **từ dưới lên** khi mở, trượt xuống khi đóng.
- Panel bám **cạnh trái / phải**: trượt từ cạnh đó vào, ra lại cạnh đó.
- Menu / popover nhỏ: mờ dần + dịch nhẹ 4–8px (không cần trượt cả màn).
- Lớp nền tối phía sau (nếu có): mờ dần cùng lúc.
- Thời lượng **180–260ms**, `ease-out` khi vào, nhanh hơn một chút khi ra. Đồng bộ một bộ giá trị cho cả app (đặt biến CSS, ví dụ `--sheet-dur`).
- **Phải có hiệu ứng khi đóng**: component hiện đang bỏ khỏi DOM ngay khi đóng (`{open && <Panel/>}`) thì giữ lại trong DOM đến khi chạy xong hiệu ứng ra (trạng thái "đang đóng" + `onAnimationEnd`), hoặc luôn render rồi ẩn bằng `transform` + `visibility`. Chọn cách ít đụng logic nhất.
- Tôn trọng `@media (prefers-reduced-motion: reduce)`: tắt trượt, chỉ hiện / ẩn.
- Chỉ dùng `transform` / `opacity` (không animate `height`, `top`, `left` — giật trên điện thoại).

### 3. Không được đổi
- Logic mở / đóng, dữ liệu, chữ hiển thị.
- Giao diện máy tính (≥ 1024px) giữ như cũ, trừ khi panel đó trên máy tính cũng đang hiện tức thì và thêm trượt không làm vướng (ghi rõ trong báo cáo nếu có đổi).
- Không thêm thư viện hiệu ứng.

## Kiểm tra trước khi báo xong
1. `npx tsc -p tsconfig.app.json --noEmit` không lỗi (không dùng `tsc -p .`).
2. `npx vite build` chạy được.
3. Ở 390px và 768px: mở / đóng từng panel trong danh sách, thấy trượt cả lúc vào lẫn lúc ra; bấm mở / đóng liên tục nhanh không bị kẹt panel nửa chừng hay không đóng được; bấm ra ngoài / phím Esc (nếu có) vẫn đóng như cũ.
4. Ở 1366px: giao diện như trước.
5. Báo lại: bảng danh sách panel (đã có / đã thêm / bỏ qua + lý do), file đã sửa.
