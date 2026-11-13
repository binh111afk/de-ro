# Phiên 35 (13/11/2026): 3 công cụ agy (xoay chiều, đường sức, mạch vòng), tô màu bảng vẽ (Kính, thùng sơn theo vùng kín), responsive bảng vẽ / soạn đề / slide, kiểm thử bảng vẽ

Tiếp [phiên 34](phien-34.md). Mọi việc dưới đây **đã lên `main` và đã push** (commit cuối `6804a39`). Không có migration mới. Không còn nhánh / worktree agy nào treo; các file `prompt-agy-*.md`, báo cáo kiểm thử, ảnh `qa-bang-ve/` đã xoá.

## Việc nên làm tiếp (chọn cùng người dùng)
1. **3 gợi ý từ kiểm thử bảng vẽ** (agy soạn trọn bài "Hàm số bậc hai", chấm 4/5):
   - căn thẳng hàng (trái / giữa / phải, chia đều) + **nhóm / bỏ nhóm** khi chọn nhiều;
   - **khoá công cụ Hình** để vẽ nhiều hình liên tiếp (hiện vẽ xong tự về Chọn);
   - đậm / nghiêng / chỉ số trên–dưới ngay trong công cụ Chữ.
2. Mục 8 nhóm "ưu tiên vừa" phiên 34 **chưa giao**: biểu đồ kết hợp cột + đường, biểu đồ miền (`src/lib/stats.ts`, hai trục tung).
3. Thùng sơn theo vùng kín còn giới hạn (xem dưới) — đáng làm nhất: mảng màu đi theo nét khi kéo hình.
4. Chưa thử trên **điện thoại / máy tính bảng thật** cả 3 trình soạn (chỉ giả lập khổ màn hình + PointerEvent touch); chưa so file `.pptx` trước/sau responsive slide.
5. Vẫn treo trên Vercel từ phiên trước: `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.

## Đã làm

### Agy: 3 công cụ vẽ (gộp `09ff08e`, `2569985`, `64a0566`)
- **Điện xoay chiều + sóng dừng** (Lí 12): mở rộng `osc` (`src/lib/oscillation.ts`) thêm `mode: 'ac' | 'standing'` — u, i lệch pha; sóng dừng hai đầu cố định / một đầu tự do. Spec cũ không có `mode` vẽ như trước. Script `scripts/check-dien-xoay-chieu.ts`.
- **Đường sức điện trường / từ trường** (Lí 11): công cụ mới kind `field` (`src/lib/field.ts`): điện tích điểm, hai điện tích cùng/trái dấu, dây dẫn ⊙ ⊗, vòng dây, ống dây (quy tắc nắm tay phải). Script `scripts/check-duong-suc.ts`.
- **Công thức cấu tạo mạch vòng** (Hoá 11–12): nâng `struct` (`src/lib/chem.ts`): `[benzen]`, `[xiclo3]`…`[xiclo6]`, nhóm thế theo vị trí `[benzen](1:CH3)(4:NO2)`, `C6H5-` nay vẽ thành vòng; mạch hở cũ giữ nguyên SVG (so mã băm với commit gốc). Script `scripts/check-mach-vong.ts`. Agy quên commit, mình commit hộ.
- Review: model mới của agy viết script kiểm chặt hơn hẳn; nhánh xoay chiều thụt lề lại khối cũ trong `MoreToolModals.tsx` (phạm luật "chỉ thêm dòng") nhưng gộp không xung đột.

### Bảng vẽ: tô màu
- **Kiểu tô Kính** (`8aee575`): `FillStyle` thêm `'glass'`; `drawGlass` trong `render.ts` (màu trong suốt + vệt sáng + viền trong). Thêm màu nền đậm.
- **Công cụ Tô màu / thùng sơn** (phím **G**, `e813f7c`): rê chuột xem trước (màu mờ + viền chạy), bấm thì **màu lan** từ chỗ bấm (`spread`, 380 ms). **Kéo ô màu** thả vào hình (giọt màu theo con trỏ, `startFillDrag`, biến `draggingFill`). Bỏ Tô nền khỏi thanh Bút. **Ô "Màu khác"** (bảng 30 màu + mã màu) cho thanh Tô màu và ô Tô nền (`5fc86bd`, component `MoreColors`).
- **Nét vẽ tay khép kín tô được** (`scene.ts` `closedLoop` / `isClosedStroke`): kín khi hai đầu gần nhau, nét tự cắt, hoặc đầu chạm lại thân; chỉ tô phần vòng kín (bỏ đuôi thừa). Vùng tô bo góc theo nét (chia đều ~4px + trung bình trượt ±3 điểm) để không lòi màu.
- **Thùng sơn theo vùng kín kiểu Paint** (`0ee03d2`, file mới `src/board/regionFill.ts`): vẽ nét mọi hình (không nền) lên canvas ẩn theo khung nhìn → loang từ chỗ bấm → chạm mép = vùng hở. Vùng thành **mảng màu** = `El` freedraw `region: true`, `stroke: 'transparent'`, nằm dưới mọi nét (trên trang PDF). **Có lỗ** (`holes`: vị trí bắt đầu từng vòng lỗ trong `points`, tô `evenodd`) → hình tròn giữa hình vuông được chừa. Bấm lại vùng đã tô thì đổi màu mảng cũ. Vùng trùng phần trong một hình (tỉ lệ diện tích 0,85–1,2, không có lỗ) thì tô chính hình đó. Cache lớp tường theo `sceneVer` + khung nhìn.
  - Giới hạn: mảng màu **không đi theo** khi kéo hình; chỉ dò trong phần đang hiện trên màn hình (vùng lớn hơn màn hình → coi là hở, quay về tô hình dưới con trỏ); nét đứt/chấm lọt màu; chữ, ảnh, trang PDF không phải tường; mép hơi răng cưa khi phóng to nhiều sau khi tô.
- Lỗi đã sửa: màu cũ lộ dưới gạch chéo/kính ở khung cuối hiệu ứng lan; vùng có lỗ bị nhận nhầm là "cả hình".

### Bảng vẽ: giao diện
- Thanh trên gọn lại (`f65f7ff`): `[+ Chèn ▾] [Xuất] | [Giấy] [− 100% +] | [Công cụ] [Trợ lý]`.
- Chấm độ dày / cỡ gôm / laser dùng cỡ chẵn nguyên px (`DOT_SIZES`) cho tròn đều.
- Mở bảng vẽ là chọn sẵn **Bút** (`40e238b`).
- **Responsive** (agy, `1083267`): điện thoại nút "⋯" (zoom, chèn, xuất, giấy, Công cụ, Trợ lý, Laser, Kéo trang), bảng bên phủ màn hình; máy tính bảng bảng bên đè từ mép phải; `Pop` tự canh trong màn hình; **hai ngón** cuộn + chụm phóng, chạm ngón thứ hai huỷ nét dở.
- Sửa theo kiểm thử (`6804a39`): thanh trên co theo **container query** (`@[1000px]`, nhãn `@[1300px]`) thay vì `lg:` — khổ 1024px không còn cắt nút; điện thoại 6 công cụ chính luôn thấy; thanh tuỳ chọn mờ mép khi còn cuộn; chọn giấy xong tự đóng; chèn liên tiếp từ Công cụ / Công thức lệch dần (`freeSpot`); đang chọn hình vẫn đổi Khung / Khoanh tự do.

### Agy: responsive soạn đề + slide (gộp `3ae9ea0`, `3f878b5`, sửa `3ba8513`)
- **Soạn đề**: ribbon tách thành danh sách nhóm `groupsByTab`, vẽ theo `layoutMode` desktop / tablet / phone (`src/examEditor/RibbonAdaptive.tsx` mới: `PhoneRibbon` hàng định dạng nhanh + bottom sheet, `TabletRibbonBody` gom nhóm thừa vào "Thêm"). Trang A4 co vừa bề ngang; `Dropdown` / `useAnchoredPopover` không tràn mép.
- **Slide**: `useSlideViewport.ts` (matchMedia), slide luôn co vừa 16:9, điện thoại dải slide dưới + thanh tab đáy (Mẫu, Đồ hoạ, Icon, Tải lên, Công cụ, Trợ lý AI), kéo bằng ngón tay, vuốt khi trình chiếu. Trợ lý AI chỉ mở sẵn khi màn ≥ 1024px.
- Đã kiểm: khổ desktop 1400px **giữ y nguyên** (so vị trí + cỡ 58 nút ribbon đề, 33 nút ribbon slide trước/sau gộp). Sửa thêm: bottom sheet của ribbon điện thoại đưa ra `document.body` (portal) vì nút nổi "Trợ lý AI" đè lên.

### Kiểm thử bảng vẽ (agy, chỉ báo cáo)
- 0 lỗi nghiêm trọng; xuất PNG / PDF đúng mọi thành phần (Kính, vùng có lỗ, chữ Việt, ảnh 4200px, công thức, PDF ghi chú mỗi trang gốc một trang). Lỗi "vệt màu cũ" là agy chụp lúc màu đang lan, không phải lỗi. 6 lỗi thật đã sửa ở `6804a39`. Trợ lý AI và cảnh báo đầy bộ nhớ chưa kiểm được.

## Lưu ý cách làm
- Giao agy y như phiên 34: mỗi việc một `prompt-agy-<tên>.md` (không commit) + worktree riêng; câu dán ngắn: `Đọc và làm theo prompt-agy-<tên>.md ở gốc repo. Tạo worktree trước như Bước 0, không push, không merge, xong thì báo lại theo mục "Báo lại".` Nhiều agy chạy song song thì **chia file rõ ràng** trong prompt (vd. soạn đề không đụng file slide).
- Review nhánh agy chạy thử bằng cấu hình riêng trong `.claude/launch.json` (`npm --prefix ../dethinhbien-<tên> run dev -- --port 51xx`) thay vì gộp trước.
- Kiểm "desktop giữ nguyên" khi gộp responsive: lưu danh sách `title@x,y,w,h` của nút ribbon vào `localStorage` trước, gộp, tải lại, so.
- Trình duyệt trong app: tab Bắt đầu / tab tài liệu không ăn `click()` thường → bắn chuỗi `pointerdown/mousedown/pointerup/mouseup/click`; ảnh chụp có lúc trễ một khung → chụp lại trước khi kết luận. Tạo bảng vẽ mới trên điện thoại: thẻ "Bảng vẽ" (`button.quick-card` có chữ "Vẽ tay").
- Hệ thống chặn `git push` / xoá worktree nếu người dùng chưa nói rõ trong lượt đó → commit trước, hỏi push sau.
