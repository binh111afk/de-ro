## BÀN GIAO PHIÊN 3 (28/10/2026, cuối phiên) — đọc mục này TRƯỚC, rồi mới tới mục "phiên trước" bên dưới

Phiên này tập trung vào **trình soạn slide cho người dùng phổ thông**: xuất file, trình chiếu, thanh công cụ nổi, nền, hình khối. Mọi thứ đã commit + push lên `main`; `.claude/` và `_ref/` là cục bộ (không commit).

### Đã làm (theo nhóm)

- **Xuất PPTX sửa lỗi** (`lib/exportDeck.ts`): chữ đậm không còn xuống dòng (mọi run cùng `align`, dòng cuối `breakLine`); bỏ `<a:pPr>` thừa PptxGenJS ghi trước MỖI run (`dedupeParagraphProps`, hậu xử lý bằng JSZip); canh giữa dọc ô có nền, padding theo % bề rộng slide, line-height cố định theo pt, letterSpacing. **Phông không có trong PowerPoint đổi sang Arial** (`pptxFont`, danh sách `SAFE_FONTS`) + hộp ghi chú trong menu Tệp (`FileMenu.downloadNote`). `buildDeckPptx(deck)` trả ArrayBuffer (test được trong Node), `exportDeckPptx` tải xuống.
- **Xuất PDF** = hộp thoại in của trình duyệt (`PrintDeck` trong SlideEditor, CSS `.slide-print-*` ở slide.css): dựng mọi slide thành trang 16:9 bằng đúng bộ vẽ của bản xem → giữ phông/công thức. Menu Tệp → Xuất PDF.
- **Hiệu ứng bấm-chuột-rồi-hiện** (`lib/slideAnim.ts`): engine tự gán `step`/`lineStep`/`anim` theo id phần tử khi `composeLayout` (AI không phải sinh gì). `bullets` hiện từng dòng (`lineStep`), thẻ/bước/nhánh theo nhóm số, quiz hiện đáp án cuối, example hiện kết luận cuối. Tab Hoạt ảnh: Tự thêm / Xoá (slide này, cả bài). **PPTX CHƯA có hiệu ứng** (PptxGenJS không hỗ trợ). `autoAnimate` trả BẢN SAO → `composeLayout` phải chép lại `BASE_SIZE` WeakMap (xem comment) nếu không `fitRatio`/`readabilityIssues` hỏng.
- **Trình chiếu kiểu Canva** (SlideEditor, nhánh `if (presenting)`): toàn màn hình (Fullscreen API, thoát bằng Esc), mép trái/phải hiện mũi tên (click = lùi/tiến), đáy hiện thanh điều khiển trượt lên (số slide + mũi tên + thu nhỏ). Chuyển tiếp (tab Chuyển tiếp) chạy thật (`.slide-enter-*` ở slide.css). "Từ đầu" chiếu từ slide 1.
- **Dọn ribbon slide**: bỏ tab Vẽ/Xem lại, 12 nút khoá, nút trùng (Trợ lý AI, Slide mới…), menu một mục; icon nhân bản đổi sang `Copy`. Thêm **ô ghi chú diễn giả** dưới sân soạn (lưu khi blur, không tạo bước hoàn tác mỗi phím).
- **Thanh công cụ nổi** (`SelectionToolbar.tsx`): cỡ chữ, đậm, nghiêng, màu (bảng màu `ColorPalette.tsx` dùng chung với ribbon), căn lề, xoá; **Hỏi AI** (`lib/slideRewrite.ts`: model chỉ trả chữ mới của ô, engine giữ phần còn lại, co cỡ chữ bằng `fitFontSize`); hình khối có Màu tô, Kiểu hình (viền, độ trong suốt, bóng 4 mức, đường thẳng: độ dày + đầu mũi tên), Thêm chữ vào hình.
- **Nền slide** (`lib/slideBackground.ts`, `BackgroundMenu.tsx`, tab Thiết kế → Màu nền): 12 màu đặc, 8 gradient, màu tuỳ ý, **ảnh từ máy** (`prepareBgImage`: cắt 16:9, 1280×720, JPEG 0,75; lớp phủ 30% màu trung bình), "áp cho tất cả". `Slide.customBg`/`bgImage`; đổi chủ đề/bố cục giữ nền riêng qua `keepCustomBg`; chữ không nằm trên thẻ tự đổi màu cho đọc được (`withBackground`). PPTX: gradient = ảnh SVG phủ trang, ảnh nền + lớp phủ trong suốt.
- **Hình khối**: model `SlideElement` có `opacity`, `shadowLevel`, `lineArrow`, `shape` (chuỗi). **109 hình OOXML từ GenOffice** (Apache-2.0): hình học chép nguyên văn ở `src/lib/vendor/presetGeometry.ts` (đừng sửa, có header bản quyền), `lib/slidePresets.ts` (nhóm + tên tiếng Việt, `presetPaths`), `ShapeGallery.tsx` (xem trước kiểu nét viền như PowerPoint). 7 hình cũ (rect/round/ellipse/triangle/arrow/star/heart) vẫn vẽ bằng CSS; hình khác vẽ bằng SVG (`PresetSvg`). Xuất PPTX giữ tên prst, chữ trong hình, bóng, viền, mũi tên.
- Sửa lỗi thumbnail lệch: thumbnail nằm trong `<button>` nên thừa kế `text-align: center` → `.slide-frame { text-align: left }`.

### Test mới (chạy ở thư mục dự án)

`npm run test:slide-anim` · `slide-rewrite` · `slide-bg` · `slide-shapes` · `slide-presets` (cùng bộ `slide-layout/edit/ai/plan` cũ). `npx tsc -b --noEmit` sạch. Chưa có test tự động cho phần gọi LLM của Hỏi AI (đã thử tay: "Ngắn gọn hơn" rút 237→175 ký tự, 2 giây).

### Chưa làm / ưu tiên tiếp theo

1. **Chế độ diễn giả** (ghi chú + đồng hồ + slide kế) — ghi chú hiện chỉ xem khi soạn, không hiện khi chiếu.
2. **Thanh chỉnh hình** (tay nắm vàng chỉnh độ bo góc/mũi tên): `adjust-handles.ts` của GenOffice là mẫu; `presetPaths` đã nhận tham số `adjust` nhưng UI chưa đặt.
3. **Ảnh nền dùng chung cả bài** (hiện mỗi slide một bản data URL → "áp tất cả" 30 slide có thể chạm giới hạn localStorage).
4. Chia sẻ qua link chiếu, kho ảnh miễn phí, danh sách dấu đầu dòng do người dùng bật, bảng có kiểu sẵn, biểu đồ chỉnh dữ liệu.
5. Hiệu ứng/chuyển tiếp chưa xuất PPTX; slide HTML chưa xuất PDF; nút "Màu chữ"/"Màu tô" trên ribbon đã dùng bảng màu, nhưng ribbon còn vài chỗ chưa cập nhật so với thanh nổi.
6. Quyết định của chủ dự án: PPTX **đổi phông sang Arial + có cảnh báo** (không nhúng phông; Gamma có nhúng nhưng PptxGenJS không làm được). Muốn giữ đúng Be Vietnam Pro thì phải tự viết nhúng `.fntdata`.
7. Chưa xem tận mắt: PPTX trong PowerPoint thật (chữ đậm, bóng, mũi tên, gradient, ảnh nền), file PDF thật từ hộp thoại in.

### Bẫy mới gặp phiên này

- Kiểm thử trong trình duyệt: Vite HMR đôi khi **tải lại cả trang** làm mất deck thử tạo bằng JS; module của app có hậu tố `?t=` — import store bằng URL lấy từ `performance.getEntriesByType('resource')`, không import `/src/store/...` trần (sẽ ra instance khác). Ảnh chụp thường **trễ một nhịp**: chụp lần hai mới thấy trạng thái mới.
- Tab thử bị **tự lưu** vào `soandethi-docs` (localStorage): dọn bằng `useComposeStore.closeTab` + `useDocStore.deleteDeck`, nếu không "Gần đây" đầy tệp thử.
- PptxGenJS: mỗi run có `pPr` riêng và tách đoạn khi `align` khác nhau giữa các run — luôn đặt `align` giống nhau trên mọi run của một hộp.
- Khi vá file bằng script Python: `s.index(end_marker)` tìm từ đầu file → có thể trúng chỗ khác TRƯỚC vị trí bắt đầu (cắt ra chuỗi rỗng, `replace('', x)` phá file). Luôn `s.index(marker, start)`.
- `scripts/test-*.mjs` import bằng `tsx --tsconfig tsconfig.app.json`; `jszip` có sẵn (dùng để đọc PPTX trong test), `fflate` thì không.
- Đường dẫn scratchpad của phiên đổi giữa chừng; ghi file tạm bằng công cụ Write rồi đọc lại bằng đường dẫn đầy đủ.

---

