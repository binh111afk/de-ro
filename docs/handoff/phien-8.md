## BÀN GIAO PHIÊN 8 (29/10/2026) — trình soạn slide: panel thư viện, lớp, thanh nổi, icon. Đọc mục này TRƯỚC.

Nhánh **`feat/slide-panel-ui`** (tách từ `main`), đã commit và push lên `origin` (https://github.com/binh111afk/de-ro.git). **Chưa tạo PR, chưa merge vào `main`.** Nhánh này cũng chứa luôn phần việc phiên 7 (trước đó chưa commit; xem [phien-7.md](phien-7.md), mục "chưa commit" ở đó đã cũ).

### Đã làm

**1. Panel thư viện bên trái (`src/examEditor/SlideSidePanel.tsx`)**
- Tab **Thành phần** làm lại kiểu Canva: bỏ dãy 24 chip, thay bằng 6 chip nhóm lớn (Tất cả, Môn học, Lớp học, Ký hiệu, Khung & trang trí, Hình khối). Mỗi nhóm nhỏ là một hàng xem trước 4 mục + "Xem tất cả ›" mở trang con có nút ‹ quay lại. Tìm kiếm gom kết quả theo nhóm kèm số lượng. Hàng "Dùng gần đây" (lưu `localStorage`, khoá `slide-recent-graphics`) và "Gợi ý cho slide này" (tìm theo tiêu đề bài giảng + chữ trên slide đang mở; store chưa có trường môn học).
- Ô tìm kiếm + chip đứng ngoài vùng cuộn (`Scroll`), thanh cuộn chỉ chạy qua nội dung.
- Panel trượt đóng/mở (khung ngoài đổi `width`, khung trong cố định 280px, `inert` khi đóng) và có nút thu panel dạng viên thuốc `‹` ở mép phải. Giữ nội dung và vị trí cuộn của tab vừa mở khi đóng. Có `motion-reduce`.
- Panel được `memo` + handler đi qua `panelHandlers` ref trong `SlideEditor` để kéo phần tử (cập nhật deck mỗi lần nhích chuột) không vẽ lại hàng trăm đồ hoạ. Markup đồ hoạ mặc định có cache (`cachedMarkup`).
- Tab **Icon**: gộp 27 icon của AI/layout (`SLIDE_ASSETS`) + **298 icon Phosphor** mới ở `src/lib/slideIconLibrary.ts` (nhãn tiếng Việt, 6 nhóm; id dạng `ph-<Tên>`; hàm `slideIconById`). Tách riêng để không đổi cách AI/`pickSlideAsset` chọn icon. Bốn tên không có trong Phosphor đã bỏ (`Bacteria`, `Wifi`, `Dice`, `ChessKnight`).
- Tab Tải lên và Mẫu có đệm trên 12px.

**2. Đồ hoạ và màu**
- Đồ hoạ có **màu chủ đạo** (`el.fill`): `graphicMarkup(id, ink, main)` đổi màu pastel nhiều nhất (`dominantFill`), `graphicMainColor` lấy màu hiện tại. Hình nhiều màu ngang nhau chỉ đổi một màu.
- **Độ trong suốt** (`el.opacity`) có hiệu lực cho đồ hoạ và icon ở màn soạn, màn chiếu và xuất PPTX (`transparency`).
- Bảng chọn màu (`ColorPalette.tsx`) làm lại: lưới ô vuông 8 cột (trung tính + 3 mức nhạt/vừa/đậm), ô xem màu + ô nhập mã màu (6 số áp ngay, 3 số chờ Enter/rời ô), prop `onClose` chỉ gọi khi bấm ô màu. Bảng Định dạng dùng `PaneColor` (mở bảng này ngay trong pane, pane nới thành 244px). Ribbon tab Thành phần thêm nhóm "Chủ đạo" cho đồ hoạ và nhãn "Màu nét".

**3. Thanh nổi (`SelectionToolbar.tsx`)**
- Mọi phần tử có nút **Nhân đôi** (Ctrl+D) và **Lớp**. Đồ hoạ có Màu nét + Màu chủ đạo + trong suốt; icon có màu + trong suốt.
- Menu Lớp (`LayerTool`): lên trên cùng, lên một lớp, xuống một lớp, xuống dưới cùng (dùng lại `arrangeSelected` của ribbon) + danh sách mọi lớp trên→dưới để chọn thẳng phần tử bị che hết. Vẽ bằng portal ra `body`, toạ độ cố định kẹp trong cửa sổ, mở lên khi dưới hết chỗ, đóng khi bấm ngoài / Esc / cuộn / kéo phần tử (nghe `pointerdown` ở pha capture, vì thao tác kéo chặn lan truyền).
- Thanh đi theo phần tử ở mép phải (`alignEnd`: canh theo mép phải khi `x` > 62%; trước đây kẹp 62% nên đứng yên). Phần tử phủ gần kín slide thì thanh vào trong sát mép trên.

**4. Tay nắm và chọn**
- Nút xoay xuống **dưới** phần tử (thanh nổi ở trên); sát mép dưới (đáy > 88%) thì lật lên đỉnh; phủ gần kín thì vào trong sát đáy (`rotTop`, `rotInside`, công thức góc ±90 theo vị trí).
- Tay nắm resize dời vào trong khi cạnh chạm mép slide (khung slide cắt phần tràn).
- Khung ảnh: phần bo góc/elip (`overflow-hidden`) tách ra khung con, tay nắm nằm khung ngoài nên không bị cắt.
- **Ô chữ: bấm một lần chọn/kéo, nhấp đúp mới sửa** (`AutoFitText` có `locked`, `onDone`; `editingShapeId` dùng chung với hình khối).

**5. Đồ hoạ pastel mới**
- `src/lib/graphics.ts` (sinh tự động) giờ 412 mục (332 trong catalog + 80 ornament): người dùng đã nhập thêm 100 hình theo [prompt-100-thanh-phan.md](../prompt-100-thanh-phan.md) (sheet mới trong `scripts/graphics-extra.mjs`, test `test:slide-graphics` 21 nhóm pass). Tôi chỉ commit, không kiểm tra từng hình bằng mắt.

### Kiểm tra
`npx tsc -b --noEmit` sạch; `npm run test:slide-graphics` (21 nhóm), `npm run test:slide-layout` (10/10) pass. Đã thử trên trình duyệt: panel mở/đóng/nút thu, tìm "xe", chèn icon mới, kéo phần tử, thanh nổi đi theo, nút xoay đổi vị trí, menu lớp (xuống một lớp, danh sách chọn lớp, đóng khi kéo), bảng màu + gõ mã màu, nhân đôi, ô chữ bấm một lần / nhấp đúp.

### Chưa xong / cần biết
- **Chưa thử**: xuất PPTX với icon thư viện mới và màu chủ đạo đồ hoạ (`exportDeck.ts` đã sửa nhưng chưa mở file); kéo ô chữ bằng chuột thật sau khi đổi sang nhấp đúp; kéo thả đổi thứ tự slide ở thanh dưới (tồn từ phiên 7); độ mượt thực tế khi kéo phần tử với deck nhiều phần tử/ảnh lớn; cửa sổ rất thấp (< ~170px chỗ trống) cho menu Lớp.
- **Chưa làm**: Alt+bấm chọn phần tử nằm dưới con trỏ và Tab để duyệt phần tử (hiện chỉ có danh sách lớp).
- Viền chọn của ảnh bo tròn nay là hình chữ nhật vuông (do tách khung).
- Kéo phần tử đã **xoay**: cách tính mép cho tay nắm chỉ gần đúng.
- Bảng màu của thanh nổi có thể bị cắt mép trái trong cửa sổ rất hẹp (~800px) khi phần tử nằm giữa khung (đã mở sang trái khi `x` > 25%, chưa thử màn hình rộng).
- `context.md` còn nói "112 icon"; số đúng ở mục này.
- Thư mục `.claude/` (có `launch.json` cho preview) vẫn chưa theo dõi, không commit.

### Lưu ý khi làm tiếp
- Sửa file nhiều dòng giống nhau bằng script Python: kiểm tra chỗ trùng (trong `SlideEditor.tsx` có hai khối `useEffect`/`<input onBlur>` giống nhau ở `MathCell`/`FitText`/`AutoFitText`; đã từng thay nhầm hai lần). Heredoc `bash` chứa dấu `'` trong chuỗi tiếng Việt dễ vỡ; ghi script bằng công cụ Write rồi chạy.
- Ảnh chụp màn hình của trình duyệt test có thể trễ một nhịp so với trạng thái thật: chụp lại hoặc đo bằng `javascript_tool` trước khi kết luận.
- Mở lại panel/state kéo: `previewElement` cập nhật cả deck mỗi lần nhích chuột; đừng gắn việc nặng vào render của `SlideEditor`.

### Việc đề xuất cho phiên sau
1. Xuất thử PPTX (icon thư viện, màu chủ đạo, trong suốt, viền đứt) và sửa `exportDeck.ts` nếu lệch.
2. Tạo PR `feat/slide-panel-ui` → `main`, merge sau khi kiểm tra.
3. Alt+bấm chọn phần tử nằm dưới; Tab duyệt phần tử.
4. Ảnh tải lên: lưu R2 thay vì base64; mẫu cả bài.
5. Gộp nhóm đồ hoạ trùng nghĩa; cập nhật `context.md` số liệu nếu cần.
