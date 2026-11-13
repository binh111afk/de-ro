# Kế hoạch: công cụ vẽ trong Bảng vẽ dựng bằng phần tử gốc

Chốt 13/11/2026 (phiên 36). Chưa sửa code.

## Vì sao
Hiện bảng vẽ chèn công cụ (`renderTool` → SVG) thành **một phần tử `image`** (`src/board/BoardEditor.tsx` `insertImage` ~dòng 1253, lệnh AI `figure` ~dòng 1463). Hệ quả: không tẩy / tô thùng sơn / đổi màu từng nét / kéo sửa được; bấm đúp không sửa lại được (dù SVG đã nhúng `ToolDoc` trong `<desc>`, đọc bằng `readToolDoc` — bảng vẽ chưa dùng).
Người dùng muốn: **mọi công cụ** dựng bằng phần tử của bảng vẽ (như app note hiện đại). Loại nào quá khó thì báo lại.

## Hiện trạng đã kiểm
- `src/board/scene.ts`: 8 loại phần tử (rectangle, ellipse, diamond, line, arrow, freedraw, text, image). **Không có nhóm.** Chữ: một cỡ, không chỉ số, không căn. Chỉ `freedraw` khép kín mới tô được (`fillPath` trả null với `line`).
- Tiền lệ: công thức LaTeX = `image` + trường `latex`, bấm đúp mở hộp thoại (`onDoubleClick` ~dòng 1043).
- Bảng vẽ dùng chung `ToolsPanel` của trình soạn đề (đủ 29 loại).
- SVG công cụ dùng: `marker`, `clipPath`, `pattern`, `tspan` (nhiều ở chem), ~65 `transform`, ~178 chỗ `text-anchor`, path cong/cung.

## Nguyên tắc
Mỗi công cụ một hàm `toBoard(spec): El[]` ở `src/board/tools/<kind>.ts`, **dùng lại phần tính toán** của thư viện (`src/lib/<x>.ts`), chỉ đổi đầu ra. Kết quả là một nhóm, nhóm giữ `ToolDoc` để bấm đúp sửa lại. Đầu ra SVG cho trình soạn đề **giữ nguyên**.

## Giai đoạn 0 — nâng bảng vẽ (Claude làm)
1. Nhóm / bỏ nhóm (`groupId`): chọn 1 = chọn cả nhóm, kéo / đổi cỡ theo nhóm, hoàn tác. (Trùng việc treo phiên 35: căn thẳng hàng + nhóm.)
2. Chỉ số trên/dưới trong chữ (`_`, `^`): H₂O, 3d⁶, T₁.
3. Căn chữ trái/giữa/phải (căn lúc dựng là đủ).
4. `line` nhiều điểm khép kín tô được (đa giác, nửa hình tròn, miền dưới đồ thị).
5. Đường cong → lấy mẫu thành `line` nhiều điểm, roughness 0. Mũi tên, nét đứt, hachure đã có.
6. Bấm đúp vào nhóm công cụ → mở `ToolModal` với `ToolDoc`, dựng lại.

## Giai đoạn 1 — khuôn mẫu (Claude làm)
- `venn` (dễ nhất) + `graph` (trục, vạch, cong, cắt khung) để chốt khuôn `toBoard`.
- Script kiểm: dựng mỗi công cụ với spec mẫu (lấy từ `FIGURE_GUIDE` trong `src/lib/docRewrite.ts`), so khung bao / số phần tử, chụp ảnh cạnh SVG gốc.
  Mẹo xem nhanh SVG gốc: trong trình duyệt dev `await import('/src/lib/toolSpec.ts')` rồi `renderTool(doc)`.

## Giai đoạn 2 — giao agy theo đợt (mỗi đợt một worktree, Claude review ảnh so sánh rồi gộp)
- **A (dễ)**: numberline, probtree, table, punnett, signtable, vartable, foodweb, pedigree, scene.
- **B (trục toạ độ, dùng lại trục của graph)**: oxy, motion, phase, gas, osc, stats, grouped, trig.
- **C (khó)**: geo2d, geo3d, circuit, incline, lens, field, electron, struct, chemgraph, chemeq.

## Giai đoạn 3 — chuyển hẳn
Loại đạt → bảng vẽ chèn phần tử gốc (cả `insertImage` lẫn lệnh AI `figure`); loại chưa đạt tạm giữ ảnh. Cuối cùng báo người dùng danh sách chưa làm được + lý do.

## Dự đoán khó
struct/chemgraph/chemeq (chỉ số lồng, liên kết đôi/ba, benzen), geo3d (nét khuất), field (quá nhiều đường cong → nặng). Có thể giữ ảnh + chỉ làm bấm đúp sửa.

## Đã xong Giai đoạn 0 (phiên 36, chưa commit)
- `scene.ts`: `groupId`, `tool` (ToolDoc JSON), `align`; `withGroups`, `copyEls` (bản sao đổi id nhóm); `isClosedLine` (line có điểm cuối trùng điểm đầu → tô được, kể cả thùng sơn); `textRuns`/`lineWidth` (chỉ số `_x`, `^x`, `_{..}`, `^{..}`, dãy số `x^12`; `\_` giữ nguyên).
- `render.ts`: chữ vẽ theo đoạn + căn; `fillPath` cho line kín.
- `BoardEditor.tsx`: chọn 1 = chọn cả nhóm (bấm, Shift, khung, khoanh); Ctrl+G / Ctrl+Shift+G + nút trong nhóm "Sắp xếp"; bấm đúp nhóm có `tool` hoặc ảnh SVG công cụ cũ → `ToolModal` ("Cập nhật") → `replaceTool` thay đúng chỗ, giữ bề ngang. Hiện `replaceTool` vẫn chèn ảnh — Giai đoạn 1 đổi sang `toBoard`.
- Mục 5 (lấy mẫu đường cong) để sang Giai đoạn 1, làm cùng hàm dựng `toBoard`.

## Bước kế tiếp
Giai đoạn 1: `src/board/tools/` — venn + graph, rồi cho `insertImage`/`replaceTool` dùng `toBoard` khi loại đó đã có.
