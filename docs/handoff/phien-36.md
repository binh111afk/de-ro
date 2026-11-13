# Phiên 36 (13/11/2026): công cụ vẽ thành phần tử gốc, bảng vẽ nhiều tính năng mới, tooltip dùng chung

Tiếp [phiên 35](phien-35.md). Mọi việc dưới đây **đã lên `main` và đã push** (commit cuối `c577d24`). Không có migration mới. Không còn nhánh / worktree agy nào treo, các file `prompt-agy-*.md` đã xoá.

## Việc nên làm tiếp (chọn cùng người dùng)
1. **Thước kẻ, compa, thước đo góc** nổi trên bảng vẽ (Claude tự làm — tương tác hình học cần chính xác).
2. ~~**Nhiều trang + chế độ trình chiếu**~~ — người dùng quyết định **không làm** (13/11/2026).: Claude chốt cấu trúc lưu (đổi `elements` → danh sách trang, bảng cũ, hoàn tác, xuất PDF nhiều trang, AI vẽ vào trang nào), agy làm phần giao diện trình chiếu (ẩn thanh, bút / laser / gôm, phím mũi tên, toàn màn hình).
3. **Nền bảng đen / xanh + bút phấn** (giao agy, worktree riêng).
4. Ghi **số token mỗi lần gọi AI** vào thống kê admin (người dùng định dùng Kira 2.5 Flash trả theo lượt; ước lượng ~10–20k token / lượt, 100 GV dùng vừa ≈ 80k đ/tháng giá đang giảm, ~400k đ giá gốc — cần số thật).
5. Còn treo: tô một ô trong hình công cụ rồi "Sửa hình" thì màu tô mất (hình dựng lại); chưa thử thật trên điện thoại (nhấn giữ tooltip, thanh nổi); lệnh AI `figure` chưa gọi AI thật (đã chạy đúng đường với spec mẫu 29 loại). Từ phiên 35: biểu đồ kết hợp cột + đường / miền chưa giao; Vercel `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.

## Đã làm

### Công cụ vẽ trong bảng vẽ = phần tử gốc (`d1dc1ac`, `c4bfbf4`, `98c2bbb`)
Chi tiết kỹ thuật: [docs/plan-bang-ve-cong-cu.md](../plan-bang-ve-cong-cu.md).
- Nâng bảng vẽ: **nhóm** (`groupId`, Ctrl+G / Ctrl+Shift+G, chọn 1 = chọn cả nhóm), chỉ số `_` `^` trong chữ, căn chữ, `line` khép kín tô được, bấm đúp nhóm công cụ mở `ToolModal` và thay đúng chỗ.
- **Bộ chuyển SVG chung** `src/board/svgImport.ts` (`svgToElements`) thay cho 29 hàm `toBoard`: path / marker / clip hình chữ nhật / pattern gạch / tspan chỉ số / chữ serif, nghiêng, đậm, xoay. Cả 29 loại dựng được, không còn mảnh ảnh. Script so sánh `src/board/dev/compareTools.ts` (trình duyệt dev: `(await import('/src/board/dev/compareTools.ts')).compare()`).
- Thêm: hộp bo góc; `\it{..}` đảo nghiêng một đoạn chữ (`textRuns` trả `it`, `runFont`); miền gạch Ven bằng `regionsOf` (`regionFill.ts`, dò miền theo `isPointInFill`) → mảng tô có lỗ.
- Đã so với app NoteRenderer của đối thủ: họ chèn khối ảnh vector (trừ hình học 2D/3D là phần tử gốc có ràng buộc điểm); người dùng chốt giữ hướng của mình.

### Bảng vẽ: chỉnh theo phản hồi (`93f001a`)
- Đồ thị mặc định **tắt lưới ô vuông** (chèn tay + AI; AI thêm `"grid": true` nếu cần).
- Bấm **chỗ trống trong khung** hình công cụ cũng chọn được cả nhóm (`topHit`).
- Thùng sơn giữa nhiều nét: mảng màu **gom nhóm** với các nét viền (`groupWithWalls`), kéo hình thì màu đi theo.
- Chọn hình công cụ: thanh gọn (nút **Sửa hình**, ẩn độ dày / cỡ chữ / kiểu nét / tô nền).
- Khung chữ co giãn ngay khi gõ; **màu gần đây riêng** cho bút / chữ / hình (`recentTextColors`, `recentShapeColors`); laser có **Màu khác**.
- `Pop` gắn vào `document.body` (portal) — trước đó bảng bật ra bị khung cuộn ngang của thanh công cụ cắt mất.

### Agy
- **Thanh nổi hàng 3** khi chọn hình (`cc0930c`, biến `selActions`, `SelBtn`): Tô nền, Độ trong, Hỏi AI, sắp xếp, nhóm/tách, nhân đôi, xoá; hiện/ẩn mượt.
- **Tooltip dùng chung** (`221b6fe`, `src/components/Tooltip.tsx`, `<TooltipLayer />` ở `App.tsx`): `data-tip`, `data-tip-side`, `data-tip-kbd`; lật / dịch sát mép, z 150 (trong modal `role="dialog"` thì 250, có `aria-modal` thì không hiện tooltip phía sau); đổi `title=` ở 46 file. Claude chỉnh thêm hiệu ứng: hiện mờ + phóng nhẹ, trượt khi chuyển nút, mờ dần khi ẩn. **Từ nay dùng `data-tip`, không dùng `title=`.**
- **4 việc** (`e62e4e5`): căn thẳng hàng / giãn đều theo khối (`alignBlocks`, Alt+A/D/W/S/H/V); **đường gióng** khi kéo (`computeSnap`, tuỳ chọn `guides`, giữ Alt tạm tắt); kiểu chữ B / I / Aa / x² / x₂ (Ctrl+B/I/./,); **khoá hình** (`locked`, Ctrl+Shift+L, nút trong thanh nổi); **giữ công cụ Hình** (phím Q, `keepTool`).
- **Thanh công cụ** (nhánh riêng, gộp `4683f1a`): nút **"Nét"** gom độ dày / kiểu nét / thẳng–vẽ tay; phím tắt trong tooltip. Người dùng chê bộ icon agy vẽ lại → **giữ icon cũ**, chỉ lấy bố cục.
- Icon (`99d7555`, `c577d24`): bút máy + thùng sơn vẽ nét viền theo `src/board/icons/*.svg` (người dùng gửi); bút lông, dạ quang, khoanh tự do lấy từ lucide; bút dạ tự vẽ; nút Chọn luôn là con trỏ chuột.

## Lưu ý cách làm
- File CRLF (`BoardEditor.tsx`…): **không dùng `sed -i`** (đổi cả file sang LF). Sửa bằng Edit hoặc python `newline=''`; chuỗi tìm nhớ `\r\n`. Kiểm `git diff --stat` sau mỗi lần sửa.
- Agy song song cùng file: một con trên `main`, con kia **worktree + nhánh riêng** từ `origin/main`, cổng dev riêng (5190); gộp sau, giải xung đột bằng cách giữ cả hai phần. `git branch -d` nhánh đã gộp báo "not fully merged" nếu chưa push → push trước rồi xoá.
- Khung trình duyệt của Claude hay bị ẩn → CSS animation / transition đứng yên; kiểm hiệu ứng bằng giá trị đích hoặc `getAnimations().forEach(a => a.finish())`. Toạ độ ảnh chụp và toạ độ trang có thể lệch tỉ lệ → bắn sự kiện bằng JS theo `getBoundingClientRect`.
- Người dùng thích: thanh công cụ gọn, icon dễ đoán; việc giao diện dài giao agy, Claude review bằng thử thật trên bảng rồi mới commit.
