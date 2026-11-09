# Prompt: làm đẹp panel "Mẫu slide" (soạn slide)

> **Nhánh mới** `feat/mau-slide` tạo từ `main` mới nhất, trong **thư mục riêng** (thư mục dự án chính đang có agent khác làm):
> ```
> git fetch origin && git worktree add ../dethinhbien-mau-slide -b feat/mau-slide origin/main
> ```
> Làm trong `../dethinhbien-mau-slide`; chạy `npm install` trước. Không làm trên `main`, không push `--force`.

---

## Phạm vi: CHỈ panel Mẫu slide

Cột trái soạn slide → tab **Mẫu** (`TemplatesPanel` trong `src/examEditor/SlideSidePanel.tsx`). Bấm một mẫu thì thêm slide mới theo bố cục đó. Có 22 bố cục khai báo trong `SLIDE_LAYOUTS` (`src/lib/slideLayouts.ts`).

Không đụng các tab khác (Đồ hoạ, Icon, Tải lên, Công cụ), thanh icon, ribbon, editor slide.

## Vì sao trông cứng, kì

Hình nhỏ hiện tại là các khối CSS trừu tượng (`.slide-layout-thumb--<id>` với 3 thẻ `<i>`, CSS trong `src/examEditor/compose.css`):
- Hình nhỏ chỉ khoảng 60×32px, lọt thỏm giữa ô to, thừa nhiều khoảng trắng.
- Nét quá trừu tượng, mờ, khó đoán bố cục thật (ví dụ "Bảng", "Câu hỏi", "Ví dụ mẫu").
- 22 mẫu xếp một danh sách dài, không chia nhóm.
- Ô đầu tiên có nền xám, các ô khác không có, nên trông không đều; rê chuột cũng ít phản hồi.

## Yêu cầu

1. **Hình xem trước thật:** mỗi mẫu hiện một slide thu nhỏ đúng tỉ lệ 16:9, rộng gần hết ô (khoảng 118px ở panel 280px, 2 cột). Nội dung là bố cục thật với nội dung giữ chỗ, theo **giao diện (theme) hiện tại của bài trình chiếu**, để người dùng thấy đúng cái sẽ được thêm.
   - Tạo slide xem trước bằng chính đường thêm slide hiện có. Tìm `addLayout` trong `src/examEditor/SlideEditor.tsx` (gọi qua `panelHandlers.current.addLayout`), cùng `composeLayout` / `withPlaceholders` trong `src/lib/slideLayouts.ts`. Vẽ bằng `SlideThumb` (`SlideEditor.tsx`), đây là thứ thanh danh sách slide đang dùng. Truyền theme vào `SlideSidePanel` qua prop nếu chưa có.
   - Hiệu năng: tạo 22 slide xem trước một lần mỗi khi theme đổi (`useMemo`); chỉ render ô đang thấy, hoặc render sau một nhịp (`requestIdleCallback` / `IntersectionObserver`). Mở tab Mẫu không được khựng.
   - Nếu một bố cục không dựng được bản xem trước thì dùng lại hình CSS cũ cho riêng bố cục đó, không để ô trống.
2. **Chia nhóm** có tiêu đề nhỏ, ví dụ: Mở đầu & kết thúc / Nội dung chữ / Hình ảnh / Số liệu & bảng / Sơ đồ / Câu hỏi & ví dụ. Tự xếp 22 bố cục vào nhóm hợp lý, giữ thứ tự trong nhóm theo `SLIDE_LAYOUTS`. Tiêu đề nhóm cùng kiểu với tiêu đề nhóm ở tab Đồ hoạ.
3. **Thẻ mẫu đều nhau:** mọi ô cùng nền và viền mảnh (bỏ việc ô đầu có nền xám). Hình nhỏ bo góc, viền 1px nhạt, bóng rất nhẹ. Tên mẫu dưới hình, cỡ chữ 12px, một dòng, dài thì cắt bằng `…`.
4. **Phản hồi khi tương tác:** rê chuột thì viền chuyển màu cam (`clay`) và hình nhấc nhẹ (bóng đậm hơn, `translateY(-1px)`), khoảng 150ms. Nhấn có hiệu ứng ấn xuống. Focus bàn phím có viền rõ. Giữ `title` mô tả. Nếu dễ làm thì thêm nút "+" nhỏ hiện khi rê chuột ở góc hình.
5. **Kéo thả** (nếu thẻ mẫu hiện kéo được vào sân slide) thì phải giữ nguyên. Nếu chưa kéo được thì không cần thêm.
6. **Trên điện thoại** (ngăn kéo đáy, `mobile` trong `SlideSidePanel`): vẫn 2 cột, hình co theo bề ngang, bấm xong tự đóng ngăn kéo như hiện tại.

## Không được

- Không đổi chức năng: bấm mẫu nào thì thêm đúng slide bố cục đó như hiện nay.
- Không đổi `SLIDE_LAYOUTS`, cách dựng slide, xuất PPTX.
- Không đổi tab khác của cột trái.
- Không thêm thư viện.
- Không ghi đường dẫn tuyệt đối ra ngoài dự án vào code.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch (**không** dùng `tsc -p .`).
2. Dev: `npm run dev -- --port 5186 --host 127.0.0.1`, mở `/soan-de`, tạo một slide. Chụp ảnh tab Mẫu **trước và sau** khi sửa, ở 1280×800 và 390×844. Lưu ảnh ở `docs/handoff/mau-slide-anh/`.
3. Đổi theme bài trình chiếu 2–3 lần, kiểm tra hình xem trước đổi theo.
4. Bấm thử mỗi nhóm ít nhất 2 mẫu, kiểm tra slide được thêm đúng bố cục.
5. Mở tab Mẫu, đo thời gian bằng Performance của DevTools. Ghi số ms, kiểm tra không có tác vụ dài quá 100ms.

## Bàn giao

Commit nhỏ, message tiếng Việt, push nhánh `feat/mau-slide`. Viết `docs/handoff/mau-slide.md`: đã làm gì, file nào, cách chia nhóm, ảnh trước/sau, số đo, chỗ còn chưa ưng.
