# Bàn giao: Nâng cấp Tab Mẫu (Bố cục | Thiết kế) cho Trình Soạn Slide

> Nhánh: `feat/mau-slide`  
> Người thực hiện: Antigravity Agent  
> Ngày hoàn thành: 09/11/2026  

---

## 1. Tổng quan công việc đã làm

Theo đúng hướng dẫn trong `docs/prompt-mau-slide.md`, toàn bộ tab **Mẫu** (`TemplatesPanel`) của trình soạn slide đã được nâng cấp toàn diện:
- **Phần A**: Bổ sung thanh chuyển **Bố cục** | **Thiết kế** ở trên cùng tab Mẫu bằng component `Segmented` tái sử dụng, có lưu trạng thái qua `localStorage` và hiệu ứng chuyển mượt mà (150ms).
- **Phần B**: Làm đẹp mục **Bố cục**: thay thế các khối CSS trừu tượng cũ bằng **hình xem trước thật** (16:9 thu nhỏ theo đúng theme hiện tại của bài), chia 22 bố cục thành 6 nhóm sư phạm rõ ràng với tiêu đề nhóm tinh tế, thẻ đều nhau kèm hiệu ứng hover viền `clay` nhấc nhẹ và focus rõ ràng.
- **Phần C**: Thêm **8 bộ slide Thiết kế mẫu** chuẩn mực (`SLIDE_DESIGNS` trong `src/lib/slideDesigns.ts`), mỗi bộ gồm 7 slide hoàn chỉnh nội dung tiếng Việt chuẩn lớp học. Thẻ xem trước lớn với slide bìa to + 4 slide con thu nhỏ (render theo theme của riêng bộ đó). Xử lý chèn thông minh: tự đổi theme nếu bài trống; hiển thị modal 2 lựa chọn ("Đổi cả bài" / "Giữ giao diện hiện tại") nếu bài đã có slide; hoàn tác một bước bằng Ctrl+Z.
- **Phần D**: Tích hợp 8 bộ thiết kế vào trợ lý AI: catalog thiết kế đưa vào prompt dàn ý (`SLIDE_PLAN_SYSTEM`, `aiDeck.ts`), lệnh sửa cấu trúc `apply_design` trong `slideEdit.ts`, nhận diện tên tiếng Việt có/không dấu và các alias thông dụng ("mẫu bảng đen", "kiểu tối giản"…).

---

## 2. Danh sách các file thay đổi & thêm mới

| File | Hành động | Nội dung chính |
|------|-----------|----------------|
| `src/components/Segmented.tsx` | Sửa | Thêm prop `className?: string` cho `Segmented` để hỗ trợ căn chỉnh full-width |
| `src/examEditor/slide.css` | Sửa | Thêm keyframe `@keyframes template-tab-fade` và class `.anim-template-fade` (150ms ease-out) |
| `src/examEditor/SlideSidePanel.tsx` | Sửa | Tích hợp Segmented switcher Bố cục/Thiết kế, chia nhóm 22 bố cục + hình xem trước thật (`LayoutCard`), thẻ thiết kế lớn (`DesignCard`) và hộp thoại xác nhận (`DesignPromptModal`) |
| `src/examEditor/SlideEditor.tsx` | Sửa | Truyền `theme` vào `SlideSidePanel`, hàm kiểm tra `isBlankDeck`, hàm `addDesignToDeck` ('empty' \| 'replace' \| 'keep') |
| `src/lib/slideDesigns.ts` | **Tạo mới** | Định nghĩa dữ liệu 8 bộ thiết kế (`SLIDE_DESIGNS`), `buildDesignSlides`, `resolveDesignId`, `designById`, `designCatalogText` |
| `src/lib/aiDeck.ts` | Sửa | Bổ sung `designCatalogText()` vào `slideCatalogText()`, hỗ trợ thuộc tính `design` trong `DeckPlan` và `parseDeckPlan` |
| `src/lib/slideAi.ts` | Sửa | Kế thừa `decorKit` từ `plan` khi sinh slide bằng `appendSlidesToDeck` |
| `src/lib/slideEdit.ts` | Sửa | Thêm lệnh `apply_design { id }`, cập nhật `looksLikeEdit`, `editSystemPrompt`, `parseEditCommands`, và logic áp dụng thiết kế trong `applyEdits` |
| `src/examEditor/AiPanel.tsx` | Sửa | Cập nhật `SLIDE_PLAN_SYSTEM` hướng dẫn AI chọn bộ thiết kế, hiển thị tên thiết kế trong `AiPlanCard` |
| `package.json` | Sửa | Thêm script kiểm tra tự động `"test:designs": "tsx --tsconfig tsconfig.app.json scripts/check-designs.ts"` |
| `scripts/check-designs.ts` | **Tạo mới** | Script kiểm tra tự động 8 bộ thiết kế (tính hợp lệ theme, decorKit, stylePack, số slide, dựng layout, catalog, alias tiếng Việt, lệnh sửa, dàn ý AI) |
| `docs/handoff/mau-slide.md` | **Tạo mới** | Tài liệu bàn giao đầy đủ |
| `docs/handoff/mau-slide-anh/*` | **Tạo mới** | 6 ảnh chụp màn hình kiểm tra thực tế (trước & sau ở 1280×800 và 390×844) |

---

## 3. Danh sách 8 bộ slide Thiết kế

| STT | Tên hiển thị | Mã ID | Bộ màu (`themeId`) | Bộ trang trí (`decorKit`) | Phong cách (`stylePack`) | Số slide | Lý do chọn & Phù hợp với |
|:---:|--------------|:-----:|:------------------:|:-------------------------:|:------------------------:|:--------:|--------------------------|
| 1 | **Thanh lịch tối giản** | `thanh-lich` | `sang` | `toi-gian` | `consulting` | 7 | Hiện đại, tinh tế, phông thanh thoát; thích hợp cho báo cáo khoa học, hội thảo chuyên đề, tổng kết dự án. |
| 2 | **Trẻ trung nhiều màu** | `tre-trung` | `tim` | `ve-tay` | `classroom` | 7 | Tươi sáng, hình minh hoạ ngộ nghĩnh; đặc biệt phù hợp học sinh tiểu học, bài khởi động hoặc môn năng khiếu. |
| 3 | **Học thuật nghiêm túc** | `hoc-thuat` | `do` | `hinh-hoc` | `bold` | 7 | Đỏ thẫm trang trọng, tương phản cao, uy tín; thích hợp cho cấp THPT, ôn thi tốt nghiệp, bài giảng lý thuyết chuẩn mực. |
| 4 | **Thiên nhiên xanh** | `thien-nhien` | `rung` | `la-xanh` | `bento` | 7 | Xanh lá tươi mát, cảm giác sinh thái; phù hợp môn Sinh học, Địa lý, Hoạt động trải nghiệm và Môi trường. |
| 5 | **Công nghệ tối màu** | `cong-nghe` | `dem-xanh` | `hinh-hoc` | `keynote` | 7 | Nền tối hiện đại, điểm nhấn xanh neon công nghệ cao; phù hợp môn Tin học, lập trình, trí tuệ nhân tạo, STEM và Robotics. |
| 6 | **Cổ điển giấy ấm** | `co-dien` | `giay-am` | `hoa-diu` | `editorial` | 7 | Giấy ngả vàng hoài niệm, phông có chân ấm áp; phù hợp môn Ngữ văn, Lịch sử, Giáo dục công dân và tư liệu truyền thống. |
| 7 | **Vui nhộn hoạt hình** | `vui-nhon` | `tim` | `lap-lanh` | `classroom` | 7 | Màu sắc rực rỡ, trang trí lấp lánh; tạo hứng thú cho sinh hoạt lớp, đố vui có thưởng, tiết học tương tác nhóm. |
| 8 | **Bảng đen phấn trắng** | `bang-den` | `dem-xanh` | `ve-tay` | `classroom` | 7 | Tái hiện bảng lớp học và nét phấn viết tay thân quen; phù hợp bài luyện tập Toán, Vật lý, Hoá học. |

> **Quy tắc tuân thủ**: Toàn bộ 8 bộ thiết kế đều dùng các `themeId` có sẵn trong `DECK_THEMES` (`sang`, `tim`, `do`, `rung`, `dem-xanh`, `giay-am`) kết hợp với các bộ trang trí `decorKit` và bố cục có sẵn, đảm bảo không làm phá vỡ các kiểm thử sẵn có của hệ thống (`test:slide-theme`).

---

## 4. Cách chia nhóm 22 bố cục (Phần B)

Toàn bộ 22 bố cục slide được phân loại thành **6 nhóm logic sư phạm**, giữ nguyên thứ tự gốc trong `SLIDE_LAYOUTS`:

1. **Mở đầu & kết thúc (5 bố cục)**:
   - `title`: Tiêu đề bài giảng
   - `section`: Phân đoạn / Phần
   - `closing`: Lời cảm ơn & Kết thúc
   - `agenda`: Mục lục bài học
   - `hook`: Khởi động / Mở bài gợi mở
2. **Nội dung chữ (6 bố cục)**:
   - `statement`: Ý chính / Thông điệp nổi bật
   - `bullets`: Danh sách gạch đầu dòng
   - `cards`: Thẻ nội dung
   - `two-column`: Hai cột cân bằng
   - `comparison`: So sánh đối chiếu (Trước / Sau, Ưu / Nhược)
   - `quote`: Trích dẫn / Câu nói danh nhân
3. **Hình ảnh (3 bố cục)**:
   - `image-left`: Ảnh bên trái, chữ bên phải
   - `image-right`: Ảnh bên phải, chữ bên trái
   - `image-full`: Ảnh toàn màn hình kèm chú thích
4. **Số liệu & bảng (3 bố cục)**:
   - `table`: Bảng dữ liệu hai chiều
   - `stats`: Số liệu thống kê nổi bật
   - `stat-image`: Số liệu kết hợp ảnh minh hoạ
5. **Sơ đồ (3 bố cục)**:
   - `timeline`: Tiến trình thời gian / Các bước
   - `cycle`: Chu trình tuần hoàn
   - `mindmap`: Sơ đồ tư duy dạng nhánh
6. **Câu hỏi & ví dụ (2 bố cục)**:
   - `quiz`: Câu hỏi trắc nghiệm tương tác
   - `example`: Ví dụ mẫu có lời giải chi tiết

---

## 5. Ảnh chụp giao diện Trước và Sau

Các ảnh chụp màn hình được lưu trong thư mục `docs/handoff/mau-slide-anh/`:

### 5.1. Desktop (1280×800)

| Trước nâng cấp (chỉ có bố cục CSS cũ) | Sau: Tab Bố cục (xem trước thật theo theme) | Sau: Tab Thiết kế (8 bộ slide mẫu) |
|:------------------------------------:|:-------------------------------------------:|:----------------------------------:|
| ![Trước Bố cục Desktop](mau-slide-anh/truoc-bo-cuc-1280x800.png) | ![Sau Bố cục Desktop](mau-slide-anh/sau-bo-cuc-1280x800.png) | ![Sau Thiết kế Desktop](mau-slide-anh/sau-thiet-ke-1280x800.png) |

### 5.2. Mobile (390×844)

| Trước nâng cấp | Sau: Tab Bố cục trên điện thoại | Sau: Tab Thiết kế trên điện thoại |
|:--------------:|:-------------------------------:|:---------------------------------:|
| ![Trước Bố cục Mobile](mau-slide-anh/truoc-bo-cuc-390x844.png) | ![Sau Bố cục Mobile](mau-slide-anh/sau-bo-cuc-390x844.png) | ![Sau Thiết kế Mobile](mau-slide-anh/sau-thiet-ke-390x844.png) |

---

## 6. Kết quả từng bước kiểm tra trước khi báo xong

1. **Kiểm tra TypeScript**:
   - Lệnh: `npx tsc -p tsconfig.app.json --noEmit`
   - Kết quả: **Clean 100% (0 lỗi, 0 cảnh báo)**.
2. **Kiểm tra test tự động 8 bộ thiết kế**:
   - Lệnh: `npm run test:designs` (`scripts/check-designs.ts`)
   - Kết quả: **Đạt 100%**. Dựng đủ slide, không lỗi, các trường `themeId`, `decorKit`, `stylePack`, `layout` đều hợp lệ, catalog text và alias nhận diện chuẩn xác.
3. **Kiểm tra các test hiện có của dự án**:
   - Lệnh: `npm run test:export` -> **7/7 pass**.
   - Lệnh: `npm run test:slide-theme` -> **4/4 pass**.
4. **Kiểm tra trải nghiệm tương tác (đã xác thực qua trình duyệt Chrome thật)**:
   - **Bài trống**: Bấm "Thêm vào bài" tự động đổi theme sang theme của bộ thiết kế, đặt style và chèn slide, **không hiện modal hỏi**.
   - **Bài đã có slide**: Bấm "Thêm vào bài" hiện `DesignPromptModal` với 2 lựa chọn ("Đổi cả bài sang giao diện này" / "Giữ giao diện hiện tại, chỉ thêm slide") + nút "Huỷ".
   - **Nút Huỷ**: Đóng modal ngay lập tức, không thay đổi nội dung bài giảng.
   - **Lựa chọn 1**: Cả bài chuyển sang theme mới, slide cũ tự cập nhật màu/font, giữ lại ảnh/nền người dùng tuỳ biến.
   - **Hoàn tác một bước**: Nhấn `Ctrl+Z` hoàn tác bài về đúng trạng thái ban đầu trước khi chèn chỉ trong một bước.
   - **Xuất PPTX**: Hàm `buildDeckPptx` xuất thành công tệp PowerPoint định dạng `.pptx` chuẩn (133 KB) mở được tốt.
5. **Đo hiệu năng DevTools (Performance)**:
   - Quan sát bằng `PerformanceObserver` theo dõi Long Tasks (>100ms) khi mở mục Thiết kế: **Không có tác vụ nào làm gián đoạn khung hình (render mượt mà)** nhờ `useMemo` dựng sẵn preview một lần duy nhất.
6. **Kiểm tra Trợ lý AI thực tế (với API Key thật)**:
   - Prompt: `"Tạo bài về Phân số theo thiết kế Bảng đen phấn trắng"` -> AI chọn chính xác: `theme: "dem-xanh"`, `decorKit: "ve-tay"`, `design: "bang-den"`.
   - Prompt: `"Đổi bài này sang kiểu thiết kế Công nghệ tối màu"` -> AI phát sinh lệnh: `{"op": "apply_design", "id": "cong-nghe"}` và áp dụng thành công bộ màu `dem-xanh` với thông báo: `Áp dụng thiết kế "Công nghệ tối màu".`

---

## 7. Chỗ còn có thể cải thiện thêm (Nice-to-have)

- **Lọc theo chủ đề**: Hiện 8 bộ thiết kế hiển thị cuộn dọc; sau này có thể thêm bộ lọc nhanh theo cấp học (Tiểu học, THCS, THPT) hoặc theo khối môn (Tự nhiên, Xã hội).
- **Xem trước toàn màn hình**: Có thể bổ sung nút phóng to xem từng slide của bộ thiết kế trước khi quyết định chèn.
- **Tạo bộ thiết kế cá nhân**: Cho phép giáo viên lưu bài giảng hiện tại thành một "Bộ thiết kế mẫu" của riêng mình trong tài khoản.
