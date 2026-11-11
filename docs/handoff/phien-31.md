# Phiên 31 (11/11/2026): Bảng vẽ tự viết, AI vẽ lên bảng, "Đưa vào chat"

Tiếp [phiên 30](phien-30.md). Đã lên `main` tới commit `266d9ad`. **Chưa commit:** kéo tiếp sau khi nắn hình (`src/board/BoardEditor.tsx`, nhánh `case 'snapped'` trong `onPointerMove`), xem mục "Còn lại".

## Bắt đầu phiên sau
1. Đọc `context.md`, rồi file này. `BoardEditor.tsx` ~1.700 dòng, `AiPanel.tsx` lớn: `grep -n` rồi đọc đoạn cần.
2. Dev server chạy ở cổng 5184 (preview "dev"). Nếu Vite báo lỗi optimize-deps sau khi đổi gói: dừng server, xoá `node_modules/.vite`, chạy lại.
3. Người dùng dặn: **chỉ commit/push khi được bảo**; tính năng lưu bảng vẽ vào tài khoản / xuất ảnh **chỉ làm khi người dùng ra lệnh**.

## Đã làm
- **Điểm AI không giới hạn** ở Hồ sơ (`server/aiQuota.ts` `hasQuotaStore`, `llmProxy` trả `unlimited`, `Profile.tsx` hiện "∞ Không giới hạn").
- **Bảng vẽ thay Bảng tính**: tab `kind: 'board'` trong trình soạn (`store/compose.ts` `newBoard`, `ComposeDoc.tsx` nạp lười `src/pages/Board.tsx`, `/bang-ve` chuyển về `/soan-de`). Bỏ gói `@excalidraw/excalidraw`, tự viết ở `src/board/` (học theo Excalidraw MIT, bản clone tham khảo `_ref/excalidraw` không commit; ghi công ở `docs/ban-quyen.md`). Thư viện: `roughjs` (nét vẽ tay), `perfect-freehand` (nét bút).
  - `scene.ts`: kiểu `El` (rectangle, ellipse, diamond, line, arrow, freedraw, text, image), khung bao, hit test, tay nắm.
  - `render.ts`: vẽ canvas, cache theo `ver`, giấy (trắng/ô/dòng/chấm), laser, vòng khoanh, con trỏ gôm, `penOutline` (6 loại ngòi), vân bút chì, ảnh.
  - `recognize.ts`: nắn hình khi giữ bút yên ~0,55 giây (đường thẳng, tam giác, chữ nhật, thoi, tứ giác, elip).
  - `BoardEditor.tsx`: thanh 2 hàng (hàng 1: hoàn tác, khối công cụ có nền trượt kiểu segmented, Trợ lý, Công cụ, Giấy, phóng to; hàng 2 đổi theo công cụ), 6 bút (bi, dạ quang ở ngoài; máy, lông, chì, dạ trong bảng "Kiểu bút" có xem trước, độ nhọn ngòi, độ nhạy lực nhấn), mỗi bút nhớ màu/độ dày/kiểu nét riêng, màu gần đây lên đầu + mã màu, lực nhấn thật + coalesced events, chạm tay thành kéo bảng khi đã dùng bút, lật đầu gôm / nút thân bút để gôm, gôm cả nét / từng phần, khoanh chọn tự do, nét đứt cho bút, con trỏ theo công cụ, menu đóng khi bấm ra ngoài / Esc.
  - Lưu `localStorage` khoá `derou.board.<id>` dạng `{v:2, elements, view, styles, opts}`. Không có lưu tài khoản, không xuất ảnh (người dùng chủ động hoãn).
- **Panel phải của bảng vẽ** (co giãn bề rộng 360px, đẩy mặt vẽ): Công cụ = `ToolsPanel` của soạn đề (hình chèn thành phần tử `image`), Trợ lý = `AiPanel mode="board"`. Đổi cỡ canvas vẽ lại ngay (`paint()`), không chớp.
- **AI vẽ lên bảng**: `AiPanel` chế độ `board` có `BOARD_SYSTEM` + `BOARD_OPS_GUIDE` (+ `FIGURE_GUIDE`). AI trả `{"say","ops"}`; `BoardEditor.applyBoardOps` thực hiện `figure` (qua `figureDoc` + `renderTool`), `shape`, `line`, `text`, `pen` (points hoặc `curve`: circle/ellipse/wave/star/polygon), `update`, `delete`; cả lượt là một bước hoàn tác. Bảng gửi kèm vùng nhìn thấy + danh sách hình (`boardSummary`, tối đa 80).
- **"Đưa vào chat"** (`src/lib/aiAttach.ts`: `attachToAi(key, refs)` / `takeAiRefs`, sự kiện `ai-attach`; `AiPanel` prop `attachKey`, hiện thẻ "Đang chọn", gửi kèm `Phần đang chọn` trong tin nhắn):
  - Bảng vẽ: nút "Hỏi AI" ở hàng 2 khi đang chọn hình (khoá `board-<id>`).
  - Soạn đề: nút "Đưa vào chat" cạnh "Hỏi AI" khi bôi đen (`DocSelectionAi` prop `onAskChat`, khoá `exam`).
  - Soạn slide: nút "Đưa vào chat" trên `SelectionToolbar` cho mọi phần tử (khoá `slide`).

## Cách đã kiểm
- Typecheck `npx tsc -p tsconfig.app.json --noEmit` sau mỗi bước.
- Trong trình duyệt: giả lập bút bằng `PointerEvent` (`pointerType:'pen'`, gán `Element.prototype.setPointerCapture = () => {}`); giả lập AI bằng cách chặn `window.fetch` cho `/api/llm` và trả `{content, reasoning, usage, model}`. **Chưa gọi AI thật** cho chế độ board, chưa thử trên bảng vẽ điện tử thật (lật đầu gôm phụ thuộc hãng bút).
- Khung bút xem trước / chụp màn hình trong pane hay bị trễ một khung hoặc chỉ chụp 800px trái của viewport 1024px: kiểm bằng `aria-pressed` / `getBoundingClientRect` thay vì tin ảnh.

## Còn lại
- **Commit thay đổi chưa commit**: kéo tiếp sau khi nắn (đường thẳng kéo dài theo bút, bắt 0/45/90°; hình phóng to quanh tâm). Đã thử bằng bút giả lập.
- Người dùng nên thử trên bảng vẽ điện tử thật: cảm giác nét, thời gian giữ bút để nắn, lật đầu gôm.
- Trong lúc thử đã tạo tab "Đề thi mới" và "Bài giảng mới" trên máy người dùng (có thể đã tự lưu): nhắc người dùng xoá.
- Chưa làm (chờ lệnh): lưu bảng vẽ vào tài khoản, xuất PNG/PDF, chèn bảng vẽ vào đề/slide, chèn ảnh từ máy lên bảng.
- AI chế độ board không nhìn thấy nét tay (chỉ có danh sách hình); nếu cần "đọc chữ viết tay" phải gửi ảnh canvas cho model có vision.
