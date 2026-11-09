# Prompt: làm đẹp và mượt cột trái (soạn đề + soạn slide)

> Làm **tiếp trên nhánh `feat/mobile-soan-de`**, **sau khi** đã xong và commit hết 5 mục của `docs/prompt-mobile-soan-de.md`. Không tạo nhánh mới, không làm trên `main`.
> Lấy file này về nhánh bằng: `git fetch origin && git merge origin/main` (chỉ thêm file docs, không xung đột code).

---

## Bối cảnh

Màn soạn có cột trái gồm một thanh icon dọc và một panel trượt ra cạnh thanh đó:

| Màn | Component | Nội dung |
|---|---|---|
| Soạn đề | `src/examEditor/NavPanel.tsx` (dùng `NavPane` trong `src/examEditor/Layout.tsx`) | Mục lục / Khối mẫu / Công cụ |
| Soạn slide | `src/examEditor/SlideSidePanel.tsx` | Mẫu / Đồ hoạ / Icon / Tải lên / Công cụ |

Hai bên dùng chung `src/examEditor/tools/ToolsPanel.tsx` (danh sách công cụ theo môn) và `ShapeGallery.tsx`. CSS ở `src/examEditor/compose.css` (tìm `.nav-pane`, `.nav-panel`, `.nav-pane-resizer` và các class của SlideSidePanel).

Người dùng thấy cột trái **chưa thẩm mỹ và chưa mượt**. Việc của bạn là làm cho nó đẹp, gọn, mượt như Canva / Word, **không đổi chức năng**.

## Bước 1: rà soát trước, rồi mới sửa

Chạy dev (`npm run dev -- --port 5184 --host 127.0.0.1`, mở `/soan-de`), ở bề rộng 1440×900 và 1280×800. Với **cả hai màn**, chụp ảnh từng tab của cột trái lúc mở, lúc đóng, và lúc đang mở/đóng (nếu chụp được).

Ghi vào `docs/handoff/leftbar.md` một danh sách vấn đề cụ thể, mỗi dòng một vấn đề kèm ảnh. Ví dụ những thứ cần soi:
- **Độ mượt:** mở/đóng panel có hoạt cảnh không, có giật không? Sân soạn / trang giấy có nhảy, chớp, hay tính lại bố cục từng khung hình trong lúc panel trượt không? Kéo thanh đổi bề rộng có giật không? Đổi tab có chớp trắng không? Danh sách dài (icon, đồ hoạ) cuộn có giật không?
- **Thẩm mỹ:** thanh icon dọc của hai màn có cùng một kiểu không (bề rộng, cỡ icon, chữ dưới icon, màu nền, trạng thái đang chọn / rê chuột)? Khoảng cách trong panel có theo một lưới đều không? Tiêu đề nhóm, ô tìm kiếm, thẻ mẫu có cùng phong cách không? Có đường viền / bóng thừa, chữ bị cắt, icon lệch tâm không? Trạng thái rỗng (chưa có mục lục, chưa tải ảnh) trông thế nào?

Sau đó sửa theo danh sách này.

## Bước 2: yêu cầu khi sửa

1. **Một kiểu thống nhất cho cả hai màn:** cùng bề rộng thanh icon, cùng cỡ icon và chữ, cùng màu nền, cùng thanh chỉ báo tab đang chọn, cùng hiệu ứng rê chuột / nhấn, cùng phần đầu panel (tiêu đề + nút đóng), cùng kiểu ô tìm kiếm và tiêu đề nhóm. Dùng lại màu và token đã có trong `compose.css` / theme, không đặt mã màu mới rải rác.
2. **Mở/đóng mượt:** hoạt cảnh khoảng 180–220ms, easing `cubic-bezier(.2,.8,.2,1)` hoặc tương đương. Ưu tiên `transform` / `opacity` cho phần nội dung panel. Nếu phải đổi bề rộng để đẩy sân soạn thì chỉ đổi một lần bằng CSS transition, **không** để React render lại theo từng khung hình. Tôn trọng `prefers-reduced-motion` (tắt hoạt cảnh).
3. **Đổi bề rộng bằng kéo mượt:** cập nhật bằng `requestAnimationFrame`, chỉ lưu state khi thả chuột. Có giới hạn tối thiểu / tối đa. Nhấp đúp vào tay kéo thì về bề rộng mặc định.
4. **Đổi tab không chớp:** giữ nội dung tab đã mở, hoặc mờ dần nhẹ. Giữ vị trí cuộn của từng tab khi quay lại.
5. **Danh sách dài cuộn mượt:** ảnh/SVG xem trước dùng `loading="lazy"`; nếu danh sách rất dài (icon) thì chỉ render phần đang thấy hoặc render theo trang. Phần đầu panel và ô tìm kiếm dính trên cùng (`position: sticky`) khi cuộn.
6. **Chi tiết nhỏ:** vùng bấm tối thiểu 36px; focus bằng bàn phím có viền rõ; tooltip cho icon khi panel đóng; chữ dài cắt bằng dấu `…` thay vì tràn.
7. **Trên điện thoại:** cột trái soạn đề đã thành ngăn kéo ở mục 3 của prompt mobile. Giữ nguyên hành vi đó, chỉ áp cùng phong cách mới cho nó.

## Không được

- Không đổi chức năng: các tab, nội dung, kéo thả khối mẫu / đồ hoạ vào trang, chèn công cụ, mục lục nhảy tới câu đều phải chạy như cũ.
- Không đổi màn khác ngoài hai cột trái này, ribbon và panel AI (trừ khi cần sửa nhỏ để khớp kiểu).
- Không thêm thư viện mới (kể cả thư viện hoạt cảnh hay danh sách ảo). Tự viết bằng CSS / React.
- Không phá phần mobile vừa làm.
- Không commit lên `main`, không push `--force`.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch (**không** dùng `tsc -p .`). Chạy `npm run test:convert`, phải đạt.
2. Chụp ảnh **sau khi sửa** đúng các cảnh đã chụp ở bước 1, đặt cạnh ảnh trước trong `docs/handoff/leftbar.md` (lưu ảnh ở `docs/handoff/leftbar-anh/`).
3. Đo độ mượt: dùng Performance của DevTools (hoặc `requestAnimationFrame` đếm khung hình) khi mở/đóng panel và khi kéo đổi bề rộng. Ghi số khung hình bị trễ trước và sau.
4. Thử lại đủ chức năng: kéo khối mẫu vào trang, chèn đồ thị từ Công cụ, bấm mục lục nhảy tới câu, thêm slide từ Mẫu, kéo icon vào slide, tải ảnh lên.
5. Thử lại ở 390×844 (mobile) để chắc ngăn kéo vẫn chạy.

## Bàn giao

- Commit nhỏ, message tiếng Việt, push nhánh `feat/mobile-soan-de`.
- `docs/handoff/leftbar.md`: danh sách vấn đề → đã sửa thế nào, ảnh trước/sau, số đo độ mượt, chỗ còn chưa ưng.
