# Bàn giao phiên 17 (03/11/2026) — tab Công cụ (Toán)

## Đã làm (commit trên `main`)

| Commit | Nội dung |
|---|---|
| `25b934d` | Cột phải soạn đề thành thanh icon dọc + panel trượt 280px (giống thư viện soạn slide) |
| `66d293e` | Tab **Công cụ** ở soạn đề (cột phải) và soạn slide (cột trái); công cụ **Đồ thị hàm số** |
| `844f817` | Ảnh trong trang đề có 4 tay nắm góc đổi cỡ (bù CSS zoom của trang) |
| `3cb0bca` | Thanh nổi **Hỏi AI** khi bôi đen chữ trong soạn đề (sửa nhanh + **Vẽ đồ thị** chèn dưới câu hỏi) |
| `0b372bb` | **Bảng biến thiên**, **Hình học phẳng** (11 mẫu), **Hình học không gian** (13 mẫu) |

## Bản đồ file công cụ

```
src/lib/plot.ts          đọc biểu thức (parseExpr, tự viết, không thư viện) + vẽ đồ thị SVG, svgToPng, svgDataUrl
src/lib/varTable.ts      autoVarTable(expr) (tính số), renderVarTableSvg, ô nhập chữ parseVarTableText / varTableToText
src/lib/geometry.ts      GEO2D_SHAPES / GEO3D_SHAPES, renderGeo2dSvg, renderGeo3dSvg (phép chiếu song song, nét khuất tự tính)
src/lib/toolSpec.ts      ToolDoc = {kind, spec}; renderTool, readToolDoc (từ SVG), parseToolJson (attr `plot`)
src/lib/docRewrite.ts    Hỏi AI: rewriteSelection, planPlot (AI chỉ trả cấu hình JSON), wantsPlot
src/examEditor/tools/    ToolsPanel (danh sách theo môn), ToolModal (switch theo kind), ToolShell (khung modal chung),
                         GraphToolModal, VarTableModal, GeometryModal (Geo2dModal, Geo3dModal)
src/examEditor/DocSelectionAi.tsx   thanh nổi Hỏi AI (soạn đề)
```

Nối vào trình soạn:
- **Soạn đề** (`pages/ComposeDoc.tsx`): `handleInsertPlot(img, target)` — chèn **PNG** (xuất Word không đọc SVG), cấu hình JSON ở attr `plot` của node ảnh (`schema.ts` ImageNode, `convert.ts`, `docTypes.ts` `image.plot`). `target`: `{replace: pos}` thay ảnh cũ, `{after: pos}` chèn thành đoạn căn giữa (dưới câu hỏi). Nhấp đúp `img[data-plot]` → `ToolModal`. Cỡ mặc định theo kind ở `TOOL_DOC_IMAGE`.
- **Soạn slide**: chèn **SVG** data URL (`SlideSidePanel` tab `tools`), cấu hình nằm trong `<desc>` của SVG; nhấp đúp ảnh trong `EditableEl` (SlideEditor) → `readToolDoc(el.src)` → `ToolModal` qua portal.
- `<desc>`: công cụ mới dùng `{"deTool":{kind,spec}}`; đồ thị giữ `{"dePlot":spec}` cũ — `readToolDoc` đọc cả hai.

## Thêm một công cụ mới (công thức)

1. `src/lib/<ten>.ts`: kiểu spec + `render<Ten>Svg(spec, desc)` trả `{svg, width, height}`; nhét `desc` ngay sau thẻ `<svg>`; nền `<rect fill="#fff">`; chữ `font-family Times New Roman` cho giống đề in.
2. `toolSpec.ts`: thêm nhánh vào `ToolDoc` + `renderTool`.
3. `tools/<Ten>Modal.tsx` dùng `ToolShell` (inputs + preview + submit); thêm case vào `ToolModal`.
4. `ToolsPanel.tsx`: thêm vào `SUBJECTS` (môn mới thì thêm nhóm). `ComposeDoc.tsx`: thêm cỡ vào `TOOL_DOC_IMAGE`.
5. Thử: tsx script cho phần tính toán, rồi lưới SVG trong trình duyệt (xem "Cách làm nhanh" dưới).

## Quy ước vẽ đã chốt (SGK/đề VN)

- **Bảng biến thiên**: 3 hàng x / y′ / y, kẻ viền + 2 kẻ ngang + 1 kẻ dọc sau cột nhãn. y′: dấu ở giữa khoảng, `0` tại cực trị, `||` (vạch đôi xuyên y′ và y) chỗ không xác định với giới hạn trái/phải hai bên vạch. Cực đại cao, cực tiểu thấp; y′ = 0 mà không đổi dấu (x³) → giá trị nằm giữa. Mỗi mũi tên một `<path>` (marker-end chỉ gắn cuối path).
- **Ô nhập bảng**: `x: -oo -1 1 +oo` / `y': + 0 - 0 +` / `y: -oo 4 0 +oo`; tách bằng dấu cách (không dùng dấu phẩy vì `0,5`); `oo`=∞, `sqrt3`=√3, `a||b` ở điểm `||`. Dòng y′ có đúng `2n−3` kí hiệu.
- **Đồ thị**: hai trục cùng đơn vị (chiều cao ảnh theo miền y, kẹp 220–720px); khung 4–20 đơn vị chia vạch từng 1; miền y tự chọn = cửa sổ dài ≤ miền x phủ nhiều điểm nhất và chứa Ox (xa Ox thì bỏ ràng buộc).
- **Hình không gian**: chiếu song song, trục sâu xiên 45° co 1/2, nhìn từ trước-phải-trên. Mặt nhìn thấy ⇔ pháp tuyến ngoài n·D < 0 (D là phương chiếu); cạnh liền nếu thuộc ≥1 mặt nhìn thấy; đoạn phụ (đường cao, chéo đáy) liền chỉ khi nằm trên mặt nhìn thấy. Đáy chóp tứ giác: A trước-trái, B trước-phải, C sau-phải, D sau-trái (cạnh qua D khuất). Chóp tam giác: A trái, B gần, C phải-xa (AC khuất). Đáy tròn = elip, nửa sau đứt.
- **Nhãn đỉnh 3D**: thử 8 hướng, lấy chỗ xa mọi nét vẽ/nhãn khác nhất (`distToSeg`).

## Lỗi đã gặp (đừng lặp lại)

1. **SVG trùng thuộc tính** (`fill` vừa trong biến font vừa ghi thêm) → XML hỏng, `<img>` lỗi im lặng ("Không dựng được ảnh"). Kiểm bằng `new DOMParser().parseFromString(svg,'image/svg+xml').querySelector('parsererror')`.
2. **Xuất Word không đọc SVG** (`docxBlocks.decodeImage` chỉ PNG/JPG/GIF) → trang đề luôn chèn PNG (`svgToPng`, ×2).
3. **CSS `zoom` của trang soạn đề** thu nhỏ tay nắm/viền → bù bằng biến `--page-zoom` (đặt ở `.compose-canvas`) và `calc(Npx / var(--page-zoom))`. Đổi cỡ bằng pointer capture để không nhầm với kéo ảnh (node `draggable`).
4. **Modal render trong phần tử slide** (portal vẫn nổi sự kiện React) → nền modal phải `stopPropagation` mousedown/click/dblclick.
5. **Bảng nổi đo cao trước khi ảnh tải** → tràn mép trên; đặt lại vị trí ở `onLoad` của ảnh.
6. **AI ghi chú lộ lời giải** (toạ độ giao điểm) → prompt cấm rõ; ghi chú chỉ cho việc chọn tham số.
7. **Tự dựng BBT**: `ln x` tại 0 phải là −∞ (so giá trị ở 1e−7 và 1e−12, không chỉ ngưỡng 1e5); `√x` tại +∞ tương tự (so 1e7 và 1e9); điểm "y′=0 không đổi dấu" phải cô lập (không thì đuôi phẳng `eˣ/x` sinh hàng chục điểm); nghiệm √3 đừng làm tròn 1e−4 (snap về √n).

## Cách làm nhanh hơn, tốn ít token hơn

- **Tính toán trước, giao diện sau**: thử logic bằng script tạm chạy `npx tsx tmpt.mts` ở gốc repo (import `./src/lib/x.ts`), in kết quả một dòng/ca — rẻ hơn nhiều so với thử qua UI.
- **Soi hình bằng lưới**: trong tab dev server chạy `import('/src/lib/toolSpec.ts?x='+Date.now())` (thêm query để không dính cache module), render nhiều SVG vào một `div#__chk` fixed phủ trang, chụp 1 ảnh. Vite có thể reload trang sau khi sửa code — chờ 2s rồi chèn lại.
- **Thao tác UI bằng JS** (`click()` theo text nút, set value qua `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set` + `dispatchEvent('input')`) rồi đọc `editor.state.doc` — thay vì chụp màn hình từng bước. Chỉ chụp màn hình cho kết quả cuối.
- Toạ độ chuột: khung chụp 800px còn trang 1024px → nhân `800/innerWidth`. Đừng bấm theo toạ độ khi panel đang trượt; dùng `find` lấy ref.
- **Sửa nhiều chỗ một lần** bằng python heredoc với `assert a in s` trước mỗi `replace` — sai là biết ngay, không sửa nhầm.
- Đề thử trong trình soạn **chưa lưu** sẽ mất khi trang reload — dựng lại bằng `editor.commands.setContent(...)`.
- Gọi AI thật (Hỏi AI) mất ~8–12s/lần; chỉ thử một lần cho mỗi luồng.

## Việc tiếp theo cho phần Công cụ

1. **Hỏi AI gọi các công cụ mới**: bôi đen đề → "Lập bảng biến thiên" (AI trả biểu thức → `autoVarTable`, hoặc trả thẳng 3 dòng chữ) / "Vẽ hình" (AI chọn `shape` + tên đỉnh trong `GEO3D_SHAPES`/`GEO2D_SHAPES`). Theo khuôn `planPlot` trong `docRewrite.ts`; `DocSelectionAi` hiện chỉ biết `kind: 'graph'` (`onEditPlot`).
2. **Lọc theo môn + ô tìm** trong ToolsPanel khi có công cụ môn thứ hai — xem `docs/viec-con-lai.md` mục 6.1c.
3. Hình học: kéo đỉnh tự do / thêm điểm–đoạn tuỳ ý (hiện chỉ theo mẫu); thêm mẫu (hình thang vuông, chóp có mặt bên ⊥ đáy, lăng trụ xiên).
4. Chưa có test tự động cho `plot.ts` / `varTable.ts` / `geometry.ts` — nên thêm `scripts/test-tools.mjs` + `npm run test:tools` từ các ca đã thử (danh sách hàm ở mục Lỗi 7 và tin nhắn commit).
5. Môn khác (ý tưởng): Lí — mạch điện (kí hiệu SGK đã có trong kho icon `phys`), Hoá — công thức cấu tạo.
