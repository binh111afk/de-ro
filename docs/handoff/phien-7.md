## BÀN GIAO PHIÊN 7 (29/10/2026) — soạn đề (ribbon Word), trình soạn slide kiểu Canva. Đọc mục này TRƯỚC.

> Đã commit trong nhánh `feat/slide-panel-ui` ở phiên 8 (xem [phien-8.md](phien-8.md)); đoạn dưới là trạng thái lúc viết.

Nhánh `main`, **chưa commit**. Working tree có thay đổi (xem danh sách dưới) và hai file mới chưa theo dõi. Chưa đẩy lên đâu. Chưa tạo PR. Chỉ commit khi người dùng yêu cầu.

### Đã làm

**1. Ribbon trình soạn đề (Word)**
- Xóa 4 nút chết: Trái sang phải, Phải sang trái (RTL không dùng với tiếng Việt), Hiện/ẩn ký tự (không làm gì), Tỉ lệ (trùng với thu phóng ở tab Bố cục). Mã: `src/examEditor/Ribbon.tsx`.
- Làm thật ba nút danh sách (gạch đầu dòng, đánh số, nhiều cấp), chạy đầu-cuối:
  - `schema.ts`: `examBullets` có attr `ordered`, `examBullet` có attr `level` (0–2). Tab / Shift+Tab đổi cấp trong danh sách (ngoài danh sách thì để mặc định). CSS trong `index.css` vẽ dấu đầu dòng bằng `display: list-item`, đánh số bằng `counter-reset`.
  - `docTypes.ts`: `BulletsBlock` thêm `ordered?` và `levels?`.
  - `convert.ts` (hai chiều), `ComposeDoc.tsx` (đọc dữ liệu), `exportBlocks.ts` (`<ol>`/`<ul>`, lề theo cấp 24px), `templates.ts` (hai mẫu mới `numbered`, `multilevel`).
- Đã kiểm tra: round-trip qua `convert` giữ đúng `ordered` và `levels`; `buildWordHtml` xuất đúng; trên trình duyệt thấy "1. Mục 1, 2. Mục 2", Tab tăng cấp, Shift+Tab giảm cấp.

**2. Trình soạn slide: bố cục kiểu Canva** (đây là phần lớn công việc)
- **Thanh slide dưới đáy** (`src/examEditor/SlideStrip.tsx`, mới): thumbnail xếp ngang, cuộn ngang (thanh cuộn mỏng + bánh xe chuột). Dấu + cuối dãy. Di chuột vào khe giữa hai slide thì khe nở từ 16px lên 56px, đẩy hai slide ra, dấu + hiện ở giữa. Kéo thả để đổi thứ tự (đã viết, **chưa thử**). Nút nhân bản và xoá hiện khi di chuột.
- **Cột trái** (`src/examEditor/SlideSidePanel.tsx`, mới): thanh icon 64px với 4 tab, bấm tab để trượt panel 280px ra, đẩy sân giấy (không che). Bấm lại icon đang mở thì đóng. Không có tiêu đề và nút X.
  - **Mẫu:** 22 bố cục có sẵn (`SLIDE_LAYOUTS`), bấm để thêm slide mới theo bố cục. Chưa có mẫu cả bài.
  - **Thành phần:** khối tìm kiếm dính đầu panel (ô tìm kiếm + dãy chip nhóm). Bấm chip thì cuộn tới đầu nhóm (đo chiều cao khối dính). Dãy chip là một hàng cuộn ngang. Bên dưới: hình khối (`ShapeGallery`, `scroll={false}`, dùng `query` để lọc) rồi đến ~24 nhóm đồ hoạ (`GRAPHIC_CATEGORY_LABEL`). Tất cả nhóm hiện hết, không có dropdown.
  - **Icon:** 27 icon Phosphor duotone (`SLIDE_ASSETS`), có trường `group` (9 nhóm), tìm theo tên, nhóm hoặc từ khoá. Cùng kiểu khối dính.
  - **Tải lên:** PNG/JPG/WebP, tối đa 8 MB, ảnh lớn hơn 1600px được thu nhỏ bằng canvas. Chèn thành `type: 'image'` với `src` là data URL. Danh sách ảnh đã tải chỉ giữ trong phiên (state), tải lại trang là mất.
- **Ghi chú:** bỏ khung cố định dưới sân giấy. Thay bằng nút nhỏ "Ghi chú" ở góc dưới slide, hiện khi di chuột (`group-hover`). Bấm để mở ô nhập. Dữ liệu vẫn là `slide.notes`.
- **Đã bỏ:** khối tên bài giảng và "N slide" trên thanh dưới, prop `onRename` của `SlideEditor` và của `ComposeDoc`. Đổi tên bài vẫn làm ở thanh tab phía trên (`TabStrip`).
- **Tab ngữ cảnh "Thành phần"** (`SlideRibbon.tsx`, thay tab "Định dạng hình" cũ): hiện khi chọn hình khối, icon, đồ hoạ, đường nối, và tự chuyển sang khi chọn (`SlideEditor.tsx`, `useEffect` theo `selectedElement`). Chữ không có tab này (chỉnh ở Trang chủ). Các điều khiển:
  - **Màu:** màu tô (hình), màu chữ `textColor` (icon, đồ hoạ).
  - **Viền** (chỉ hình khối và đường nối): màu viền, độ dày (0–8px), kiểu nét liền / đứt / chấm.
  - **Hiệu ứng:** độ trong suốt (slider, lưu `opacity`), bóng 4 mức (`shadowLevel`), bo góc (chỉ `shape === 'round'`).
  - **Xoay** (`rotation`, độ), **Sắp xếp** (căn giữa slide, lật ngang, lật dọc), **Đối tượng** (xoá).
  - Model mới: `SlideElement.borderStyle` (`src/store/docs.ts`). `shapeCss` áp dụng cho hình CSS; `PresetSvg` áp dụng `strokeDasharray` qua `dashOf()`.
- **Kiểm tra:** thêm cuối, chèn giữa, chọn bố cục, chèn hình khối, icon, đồ hoạ, ảnh tải lên; ghi chú mở, lưu, đóng; tab Thành phần tự hiện và tự chuyển; cuộn chip và bánh xe chuột; `tsc` qua; `test:slide-layout` 10/10, `test:slide-measure` 9 nhóm pass. Test đã thêm khoảng 9 slide vào bài "Bài giảng mới" trong app (dữ liệu local, không phải lỗi code).

### Quyết định đã chốt với người dùng (đừng đảo lại nếu không hỏi)
- Thư viện nằm cột trái, mở bằng tab; không che slide.
- Thumbnail ở đáy, cuộn ngang, dấu + theo kiểu Canva.
- Panel Thành phần/Icon hiện hết (không dropdown). Chip để nhảy nhóm. Icon dùng bộ đang có (Phosphor), **không** dùng lucide (người dùng nói dùng icon nào cũng được).
- Tab ngữ cảnh "Thành phần" chỉ hiện khi chọn đối tượng.

### Chưa xong / cần biết
- **Chưa thử kéo thả đổi thứ tự slide** trên thanh dưới (`SlideStrip`). Kéo HTML5 không mô phỏng được bằng script.
- **Kiểu nét đứt/chấm chưa xem bằng mắt.** Và **chưa xuất ra PPTX**: `borderStyle`, `opacity`, `shadowLevel`, `rotation` của hình chưa thấy trong `exportDeck.ts`. Kiểm tra lại khi xuất.
- **Icon và đồ hoạ: độ trong suốt chưa chắc có hiệu lực** (chưa kiểm tra `style` của nhánh `icon` và `graphic` trong `EditableEl`).
- **Hiệu ứng cuộn mượt** khi bấm chip không hiện trong trình duyệt test (smooth scroll không chạy trong pane ẩn). Vị trí đích đã kiểm tra bằng cuộn tức thì. Cần xem trên máy thật.
- **Mẫu cả bài** (mẫu do web làm sẵn, lưu bài thành mẫu): chưa có. Hiện tab Mẫu chỉ là 22 bố cục slide. Người dùng sẽ chọn nguồn sau.
- **Ảnh tải lên:** lưu thẳng vào deck dưới dạng data URL (base64) sẽ làm bài nặng và hết hạn ngạch `localStorage` nếu có nhiều ảnh. Đề xuất đưa lên R2 (đã có `server/r2.ts`). Chưa làm.
- **SVG tải lên:** không nhận (chưa có bộ làm sạch). Khi bật phải làm sạch script và sự kiện trước.
- **Trình duyệt test ~746px rộng:** AI dock + panel Thành phần + sân giấy chồng lên nhau, không dùng để đánh giá bố cục. Đo bằng `javascript_tool` (getBoundingClientRect, elementFromPoint).
- **Danh sách trong Word (`.doc`)**: đã kiểm tra HTML xuất ra. Chưa mở file bằng Word để xem thực tế.
- **Nhóm đồ hoạ có nhãn trùng nghĩa** (`soc` "Lịch sử & địa lý" với `his` "Lịch sử", `lit` "Văn học" với `lang` "Ngữ văn", `geo` "Địa lí"). Có thể gộp, chưa làm.
- **Bộ Icon chỉ 27 cái.** Muốn mở rộng: thêm vào `SLIDE_ASSETS` với nhóm và từ khoá, `SLIDE_ASSET_IDS` đã có sẵn trong code.
- **Ribbon "Đề" (Word) vẫn có các nút sắp xếp danh sách cũ** ở tab Trang chủ không đổi, ngoài 3 nút đã làm.

### File thay đổi (chưa commit)
- Sửa: `src/data/docTypes.ts`, `src/store/docs.ts`, `src/examEditor/{Ribbon,ShapeGallery,SlideEditor,SlideRibbon,convert,exportBlocks,schema,templates}.{ts,tsx}`, `src/index.css`, `src/lib/slideAssets.ts`, `src/pages/ComposeDoc.tsx`.
- Mới: `src/examEditor/SlideStrip.tsx`, `src/examEditor/SlideSidePanel.tsx`.
- Chưa theo dõi: `.claude/` (không commit), và `docs/handoff/phien-7.md` (file này).

### Chạy và kiểm tra
- Dev server: `preview_start` với tên `dev` trong `.claude/launch.json` (cổng 5184). Route: `http://127.0.0.1:5184/soan-de`.
- Lệnh: `npx tsc -b --noEmit`, `npm run test:convert`, `npm run test:export`, `npm run test:slide-layout`, `npm run test:slide-measure`.
- Đừng dùng `.querySelector('aside ... button')` để lấy nút trong panel: nút đầu tiên là nút đóng (trước đây đã gây hiểu nhầm). Dùng `aria-label` hoặc `title`.
- Với file có CRLF (hầu hết file trong `src/examEditor`), khi sửa bằng script phải chuyển sang LF rồi ghi lại CRLF, nếu không diff sẽ bẩn.

### Việc đề xuất cho phiên sau (theo thứ tự)
1. Thử kéo thả đổi thứ tự slide trên thanh dưới, và kiểm tra hiệu ứng mở/đóng panel trên màn hình thật.
2. Kiểm tra xuất PPTX với các thuộc tính mới (viền đứt, trong suốt, bóng, xoay). Bổ sung vào `exportDeck.ts` nếu thiếu.
3. Quyết định nguồn "Mẫu cả bài" và ảnh tải lên (lưu R2 thay vì base64).
4. Gộp nhóm đồ hoạ trùng nghĩa, mở rộng bộ Icon nếu cần.
5. Commit toàn bộ thay đổi của phiên này khi người dùng yêu cầu.
