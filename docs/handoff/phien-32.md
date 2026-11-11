# Phiên 32 (11/11/2026): Bảng vẽ hoàn thiện, đề thiếu đáp án, chống trắng màn, giới hạn lưu trữ

Tiếp [phiên 31](phien-31.md). Mọi việc dưới đây **đã lên `main`** (commit cuối của phiên ở `git log`). Hai migration mới đã áp lên Supabase: `20261118_community_missing_keys`, `20261119_user_storage_quota`, `20261120_storage_include_documents`.

## Bắt đầu phiên sau
1. Đọc `context.md`, rồi file này. `BoardEditor.tsx` đã ~2.200 dòng: `grep -n` rồi đọc đoạn cần.
2. Người dùng dặn: **chỉ commit / push / áp migration khi được bảo** (câu "Áp và push" = áp migration, kiểm trên DB, rồi push).
3. Dev server cổng 5185 trong phiên này. Pane trình duyệt ẩn thì pdf.js và requestIdle bị hãm: mở pane trước khi thử PDF.
4. Heredoc bash có chữ Việt + dấu ngoặc kép cong (“ ”) hay vỡ ("unexpected EOF"): viết script vào scratchpad bằng Write rồi `python -I` chạy, hoặc dùng Edit.

## Đã làm

### Bảng vẽ (`src/board/`)
- **Chèn công thức** (Công cụ → Toán → "Công thức", chỉ bảng vẽ truyền `onFormula` cho `ToolsPanel`): `formula.ts` (MathJax `mathjax-full` nạp lười → SVG), `BoardDialogs.tsx` `FormulaDialog`; phần tử `image` có `latex`, bấm đúp để sửa.
- **Chèn ảnh / PDF** (nút "Chèn ảnh/PDF", chọn trang PDF trong `PdfPagesDialog`), **xuất PNG / PDF** (`ExportDialog`: vùng toàn bộ / đang nhìn / đang chọn, nền, độ nét; PDF chia trang A4 do `io.ts` tự ghi, không thư viện).
- **Nét bút** (so với Excalidraw `_ref/excalidraw`): chấm bút thêm điểm thứ hai lệch 0,0001 + tắt vuốt nhọn khi nét < 1px (vuốt nhọn ≠ 0 làm perfect-freehand bỏ mất chấm); bớt lem (thinning thấp hơn, easing sine, lọc lực nhấn, chỉ bỏ điểm < 0,25px); **nét đang viết vẽ trên canvas riêng** (`renderLive`, `getContext('2d',{desynchronized:true})`), cả bảng chỉ vẽ lại khi nhấc bút; đường cong lực `0,35 + 0,65·√p` để chạm nhẹ ra nét.
- Độ dày **6 nấc**, minh hoạ chấm tròn; **laser** chọn 6 màu, 4 độ dày (mỗi vệt giữ màu lúc vẽ).
- **Ghi chú PDF** (nút "Ghi chú PDF"): trang PDF thành phần tử `image` có `page: {n, w, h}` (khổ gốc theo điểm PDF), xếp dọc, **khoá làm nền** (`isPage`: không chọn / quét / khoanh / Ctrl+A / gôm); xuất **"PDF theo trang gốc"** (`pagesToPdf`). Tối đa 100 trang mỗi lần.
- **Dán từ clipboard**: ảnh / PDF / chữ từ ngoài (`pasteHandler`, đọc `clipboardData.items`); Ctrl+C/X hình trong bảng ghi dấu `derou-board-copy:<ts>` vào clipboard hệ thống để không chặn ảnh mới chép; có đường dự phòng khi trình duyệt không bắn sự kiện paste.
- **Lưu & đồng bộ**: danh sách bảng `src/store/boards.ts` (zustand persist `dethinhbien-boards`, tự gom khoá cũ `derou.board.*`); đồng bộ lên `user_items` kind `'board'` (`lib/sync.ts`, `Spec.prepare` = `boardImagesToRemote`). Ảnh lớn trên máy nằm ở IndexedDB (`src/board/imgStore.ts`, khoá `idb:`), lúc đồng bộ đẩy lên R2 (`toRemote`) và nhớ đường dẫn (`u:<khoá>` trong IndexedDB) để không tải lại. Tab Bắt đầu liệt kê / lọc / mở / đổi tên / xoá bảng vẽ.
- Skeleton lúc tải bảng (`BoardSkeleton` trong `ComposeDoc.tsx`, cùng `bg-surface` và chiều cao thanh công cụ thật).

### Làm đề khi đề thiếu đáp án
- Điểm chỉ tính câu có đáp án (`gradableMax`, `missingKeyCount` ở `src/lib/grading.ts`; `lastResult.gradable`); đề không có đáp án nào hiện "Đề chưa có đáp án"; câu không chấm tô xám. Server `/api/attempt` trả thêm `gradable` (`max_score` cho giáo viên giữ nguyên).
- Cảnh báo trước khi làm / khi đăng (`src/lib/answerKeyWarn.ts`); thẻ đề cộng đồng có nhãn "Chưa có đáp án" / "Thiếu N đáp án" (cột `community_exams.missing_keys`, đề đăng trước migration là null → không nhãn tới khi đăng lại; `community.ts` tự bỏ cột nếu DB chưa có).

### Chống trắng màn sau deploy
- `src/lib/lazyPage.ts` (thay `React.lazy`): tải chunk lỗi → tự tải lại trang một lần / 30 giây; `vite:preloadError` ở `main.tsx`; `PageErrorBoundary` bọc Routes, bảng vẽ, slide; `vercel.json` không rewrite `/assets/` về `index.html`.

### Giới hạn lưu trữ (Hồ sơ)
- Trigger `check_user_items_quota` (user_items) và `check_user_documents_quota` (user_documents): **10 MB / người** (đồng bộ + tài liệu tải lên, `storage_used`), 100 đề / 50 slide / 30 bảng vẽ, mỗi đề 1 MB, loại khác 2 MB; sửa nhỏ đi luôn được; service role bỏ qua. Nâng mức riêng: ghi `user_quota (user_id, max_bytes)` (chưa có ô trong trang admin). Lỗi trả dạng `QUOTA:<lời báo>`.
- `my_storage()` (RPC) cho thẻ **"Dung lượng lưu trữ"**; mục **"Đề của tôi"** ở Hồ sơ: tải PDF / Word lên (dùng lại `src/lib/documents.ts`, R2 + `user_documents`), mở, xoá. `uploadDocument` kiểm dung lượng còn lại trước khi đẩy tệp lên R2. Đồng bộ bị từ chối → báo ở Hồ sơ và tab Bắt đầu (`src/store/syncStatus.ts`).

## Cách đã kiểm
- Typecheck sau mỗi bước; `vite build` một lần (qua).
- Trình duyệt: nét bút / chấm / laser / ghi chú PDF (PDF 2 trang tự tạo, xuất ra đúng khổ 595×842 và 842×595) / dán ảnh, chữ / Ctrl+C-V / tab Bắt đầu mở lại bảng / màn kết quả đề thiếu đáp án (đề thử tạo trong localStorage rồi xoá).
- DB: chạy trigger trong `do $$ … raise exception $$` (tự huỷ) đóng vai một người dùng thật: đề 2 MB bị chặn, đề nhỏ qua, tài liệu 11 MB bị chặn, 1 MB qua, `my_storage()` đúng.

## Còn lại / chưa kiểm
- **Chưa thử khi đăng nhập**: đồng bộ bảng vẽ giữa hai máy (kể cả ảnh), thẻ dung lượng và "Đề của tôi" ở Hồ sơ, chặn khi đủ số lượng / đầy 10 MB từ giao diện.
- Chưa thử bút cảm ứng thật sau khi sửa nét (lực nhấn, độ trễ).
- **Ảnh R2 chưa tính theo người** (upload ẩn danh, đặt tên theo hash); xoá tài liệu không xoá tệp trên R2; ảnh cũ trong IndexedDB không tự dọn.
- `user_documents.size` do client gửi (có ràng buộc 1 byte – 20 MB, nhưng có thể khai nhỏ hơn thật). Muốn chặt: để server ghi dòng sau khi upload.
- Hai máy cùng sửa một bảng: bản sau thắng, bảng đang mở không tự cập nhật.
- Trang admin: chưa có ô nâng `user_quota`.
- Việc treo từ phiên 30: đặt `AI_SETTINGS_SECRET` trên Vercel.
