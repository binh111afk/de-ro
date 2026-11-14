# Phiên 37 (13–14/11/2026): dụng cụ hình học, ghi chú PDF, tách file lớn, sửa lỗi điện thoại, landing page mới

Tiếp [phiên 36](phien-36.md). Mọi việc dưới đây **đã lên `main` và đã push** (commit cuối `77a0f79`). Không có migration mới. Không còn nhánh / worktree agy nào treo (đã gộp và xoá `agy/responsive-bat-dau`, `agy/bang-den-but-phan`, `agy/mobile-panel-truot`, `agy/co-chu-he-thong`, `agy/landing-page`).

## Việc nên làm tiếp (chọn cùng người dùng)
1. **Ghi số token mỗi lần gọi AI** vào thống kê admin — người dùng hỏi chi phí Gemini 4 Hydrogen (≈ 1,5 / 7,5 USD mỗi triệu token vào / ra, nguồn bên thứ ba); ước tính sơ 100 GV/tháng ≈ 340–1.170 USD tuỳ mức dùng, cần số đo thật. Gợi ý thêm: giới hạn lượt / GV, hạ mức "thinking" cho việc nhẹ.
2. Thử thật trên **Android**: bảng vẽ hết đen chưa (nguyên nhân chốt: canvas `desynchronized`, xem dưới), hiệu ứng trượt panel AI, nền tab trượt.
3. `BoardEditor.tsx` vẫn ~2.900 dòng (một component): muốn gọn hơn thì tách phần PDF và phần AI thành hook riêng — sửa cách gọi nhau, không còn là chuyển code đơn thuần, nên làm riêng một lượt.
4. Landing: agy chưa gửi điểm Lighthouse; vài câu nên đối chiếu tính năng thật ("ma trận và đặc tả", "đề giấy thành đề sửa được" từ ảnh chụp). Phần Bảng vẽ trên landing đang nền tối (`bg-deep`) — đổi sang sáng nếu người dùng thấy giống bảng đen.
5. Còn treo từ trước: Vercel `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`; tô ô trong hình công cụ rồi "Sửa hình" thì mất màu tô.

## Đã làm

### Bảng vẽ
- **Thước kẻ, thước đo góc, compa** nổi trên bảng (`src/board/Instruments.tsx`, nút "Dụng cụ"). Núm xoay và nút cất đặt giữa, ngoài mép. Kẻ theo thước: vùng bám rộng, lố hai đầu 3 cm vẫn bám, chạm mép giữa nét cũng bám (`guideAt`, `projectGuide`). Compa ra cung thật (`arcEl`).
- **Bút máy** ngòi dẹt 45° (thanh / đậm theo hướng, `nibPressure`), **bút lông** loe khi chậm, vuốt khi nhanh (`brushPressure`) — `render.ts`.
- **Nền bảng đen / xanh + bút phấn** (agy). Icon phấn theo `src/board/icons/chalk-goc.svg`. **Người dùng không thích quảng bá phấn** — đừng đưa lên landing / chỗ nổi bật.
- **Ghi chú PDF** kiểu trình đọc PDF: nền xám, trang có bóng giả (không dùng `shadowBlur`), cột trang thu nhỏ (ẩn / hiện có trượt, ảnh thu nhỏ có cả nét vẽ, tự cập nhật), số trang "1 / 2", chỉ cuộn trong phạm vi trang (`clampRef`, đọc thẳng `els.current`), mở PDF ở ~100% cho nét sắc.
- **Hộp Xuất có xem trước** bên cạnh (`BoardDialogs.tsx` `ExportDialog` + `buildExport` dùng chung cho xem trước và xuất thật). Tên lựa chọn: "PDF tài liệu kèm ghi chú" / "PDF cả bảng (cắt khổ A4)".

### Soạn đề / chung
- **Thanh tab nhiều tab**: lăn chuột cuộn ngang, tự cuộn tới tab đang mở, mép mờ, nút ⌄ liệt kê tab. Menu "+" và ⌄ **gắn vào `document.body`** (trước bị bảng vẽ đè trên điện thoại).
- **Nút con mắt** xem / ẩn mật khẩu: `PasswordInput` trong `src/components/ui.tsx` (đăng nhập, đăng ký, đặt lại mật khẩu, API key admin).
- **Màn laptop (< 1440px)** mở AI thì cột Mục lục tự thu (`ComposeDoc.tsx`). **Màn ≥ 2200px** phóng cả web 115% (≥ 2800px: 130%) bằng `.site-scale { zoom }` (`App.tsx` + cuối `index.css`), **không áp cho trình soạn** (fullscreen) và để ngoài lớp tooltip / hộp thoại.

### Điện thoại / máy tính bảng
- **Bảng vẽ đen kín trên Android**: nguyên nhân thật là lớp canvas nét đang vẽ dùng `getContext('2d', { desynchronized: true })` → Android ghép như lớp đục. Đã bỏ (`render.ts` `renderLive`). Hai sửa trước đó (`color-scheme: only light`, bỏ `shadowBlur` trang PDF) vẫn giữ. **Không dùng lại `desynchronized`.**
- **Hiệu ứng trượt** cho panel / sheet / menu (agy, hook `src/lib/useAnimatedPresence.ts`, keyframes + biến `--sheet-dur` ở `index.css`). Panel AI điện thoại: chỉ trượt từ đáy (tắt transition bề rộng của bản desktop dưới 1023px), nút đóng là mũi tên chỉ xuống.
- Ô nhập chat AI không còn cao vọt (đo lại chiều cao khi bề rộng đổi — `AiPanel.tsx`).
- Hàng tab trong sheet điện thoại có **nền trượt**: `src/examEditor/SheetTabs.tsx` (dùng `useSlidingThumb`).
- **Cỡ chữ hệ thống phóng to** (agy): app dùng được ở 260–320px, mốc `max-[359px]`. Từ nay việc giao diện kiểm thêm 280px.
- **Responsive tab Bắt đầu** (agy).

### Tách file lớn (chỉ chuyển code, không đổi logic)
- `examEditor/tools/MoreToolModals.tsx` 4.000 → 6 dòng (chỉ re-export): `toolModalKit.tsx`, `mathModals.tsx`, `physicsModals.tsx`, `oscModal.tsx`, `chemModals.tsx`, `bioModals.tsx`.
- `board/BoardEditor.tsx` 3.530 → 2.880: `boardModel.tsx` (kiểu, mặc định, bắt dính), `boardUi.tsx` (icon, PENS/PAPERS, Pop, Swatch…).
- `examEditor/SlideEditor.tsx` 2.840 → 1.316: `slideRender.tsx` (hiển thị, `SlideThumb` — vẫn re-export từ SlideEditor), `slideEditParts.tsx` (kéo / đổi cỡ / gióng).

### Landing page (`src/pages/home/*`)
- Agy làm lại theo tính năng hiện tại (8 phần, ảnh chụp thật ở `public/landing/*.webp`, hình công cụ vẽ là SVG thật dựng bằng `renderTool`). Claude sửa tiếp:
  - **Chữ**: bỏ nhãn thừa ("Ảnh chụp từ ứng dụng thật"…), câu ngắn, giọng giáo viên, không thuật ngữ kỹ thuật. Người dùng rất ghét văn "AI slop".
  - **Animation**: chữ đầu trang nổi lên lần lượt; ảnh đầu trang tự chuyển Đề thi → Slide → Bảng vẽ mỗi 6 s (dừng khi rê chuột / bấm), có vạch đếm giờ; hình công cụ **tự vẽ nét** (`pathLength=1` + `stroke-dashoffset`); khối / danh sách hiện so le khi cuộn (`.stagger-kids`, `useReveal` bật khi khối đã lên ~12% trên mép dưới); nền tab trượt (`home/TabThumb.tsx`, tự lấy tablist là phần tử cha).
  - Lỗi đã sửa: trùng `key` giữa ảnh và vạch đếm giờ (ảnh chồng hàng dọc, tab lệch); nền tab không hiện lúc mở trang (đo trước khi ref cha gắn).
  - **Bảng vẽ trên landing = bảng viết thường** (ảnh `hero-board.webp`: đồ thị parabol từ công cụ, bảng giá trị, ghi chú tay); PDF chỉ một câu phụ; không nhắc phấn.

## Lưu ý cách làm
- **Chụp ảnh landing**: khung trình duyệt của Claude hay bị ẩn (không cuộn được, chụp timeout). Dùng Chrome headless qua CDP (python `websockets` + PIL có sẵn): dựng bảng bằng `useBoards.getState().save()` + `useComposeStore.getState().newBoard()`, **mở tab bằng `Input.dispatchMouseEvent`** (click JS không ăn), chụp `deviceScaleFactor: 2`, lưu WebP 1x + @2x. Script mẫu đã dùng nằm ở scratchpad phiên (không lưu trong repo). Chạy python bằng `-I` nếu thư mục script có file trùng tên module chuẩn (`copy.py`…).
- **Đổi nhánh khi dev server đang chạy** → Vite có thể giữ CSS cũ: tải lại không đủ thì khởi động lại dev server.
- Agy làm **trong thư mục chính** (không worktree) thì đừng sửa chung — sửa nóng cho `main` bằng worktree tạm (`git worktree add ../dethinhbien-hotfix main`), commit rồi xoá.
- File CRLF: `BoardEditor.tsx`, `NavPanel.tsx`, `RibbonAdaptive.tsx`, `TabStrip.tsx`, `ComposeDoc.tsx`, `BoardDialogs.tsx`… — sửa bằng python `newline=''`. Kiểm `git diff --stat` (cả file đổi = hỏng xuống dòng; so bằng `--ignore-cr-at-eol`).
