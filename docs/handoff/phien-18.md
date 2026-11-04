# Bàn giao phiên 18 (04/11/2026): Công cụ mở rộng, môn Lý, chuyển đề tương tác và xuất Word

## Đã làm (commit trên `main`)

| Commit | Nội dung |
|---|---|
| `b2a71e1` | Ô **Dựng thêm** cho hình học phẳng / không gian (mỗi dòng một lệnh) |
| `c862fbd` → `928ea2b` | Kéo đỉnh trên ảnh xem trước. **Đã revert** vì người dùng thấy không giúp ích |
| `6f55bf6` | Bấm cạnh để lấy điểm (hít 1/2, 1/3, 2/3, 1/4, 3/4); kéo giữa hai điểm để nối đoạn (`PickPreview`) |
| `0d133fa` | Bộ lệnh dựng hình: trung tuyến, đường cao, phân giác, trung trực, các tâm, đường tròn, song song / vuông góc, tô thiết diện. Nút **?** cạnh "Dựng thêm" mở thẻ lệnh chia nhóm. Bấm đỉnh mở menu |
| `0b0d54d` | Kéo từ đỉnh tới cạnh hít chân đường cao / trung điểm / chân phân giác |
| `9499b1e` | Toán: **Bảng xét dấu** (tự tách nhân tử), **Hệ trục Oxy** (điểm, vectơ, đường thẳng, parabol, đường tròn, miền nghiệm), **Thống kê** (cột, đường, quạt, ghép nhóm, bảng) |
| `1b75625` | Danh sách mẫu hình thu gọn thành ô chọn, có ô tìm (gõ không dấu cũng được) |
| `532ebff` | Môn **Vật lí**: công cụ **Mạch điện** (`-` nối tiếp, `//` song song, ngoặc gom cụm) |
| `169a920` → `4a4bd1b` | Chọn môn trong bảng Công cụ: lần lượt thử ô xổ, rồi thanh tab, cuối cùng chốt **chip tự xuống dòng** (đủ chỗ khi có 10 môn); máy nhớ môn đã chọn |
| `bd81cf0` | Đề tương tác: đổi bề rộng ảnh từ px (trang đề) sang % (đề online) |
| `7cc6908` | Tạo đề online: nút **Vẽ bằng công cụ** cho mỗi câu, **Sửa hình** để mở lại; `QuestionImage.plot` |
| `9226a14` | Soạn đề: **AI sang phải**, Mục lục / Khối mẫu / Công cụ sang trái (giống soạn slide). `NavPanel side="left"` |
| `2e0241d` | Đề tương tác: giữ đậm / nghiêng / gạch chân (`**`, `*`, `__` trong MathText) và căn lề (`Question.align`); ý a), b) xuống dòng; lấy tên đề từ dòng tiêu đề và thời gian từ dòng "Thời gian … N phút" |
| `c1ccfc8` | Xuất Word: bỏ `\displaystyle`, `\textstyle`, `\limits` (trước đây in ra thành chữ) |
| `0cef34d` | Ảnh đứng đầu đề bài nằm một dòng riêng phía trên "Câu N." (web: `leadImage.ts` + CSS; Word: `leadImage()` trong `docxBlocks.ts`). Đề bài theo căn lề của câu (trước đây CSS căn đều đè mất) |

## Bản đồ file mới

```
src/lib/geoConstruct.ts        construct(text, known, {triangle}): bộ lệnh dựng hình, GEO_HELP. Điểm phụ ẩn đặt tên bắt đầu "#"
src/lib/signTable.ts           autoSignTable, splitFactors, parse/text, render
src/lib/oxy.ts                 parseOxy (tự đọc phương trình bậc nhất, không eval), renderOxySvg, OXY_HELP; cắt nửa mặt phẳng bằng Sutherland–Hodgman, gạch phần KHÔNG thoả
src/lib/stats.ts               parseStats, renderStatsSvg; tô xám / gạch / chấm để in trắng đen vẫn phân biệt
src/lib/circuit.ts             parseExpr (đệ quy: nối tiếp / song song / ngoặc), layout hộp {w,h,a,draw}, ký hiệu SGK, CIRCUIT_HELP
src/examEditor/tools/PickPreview.tsx    lớp SVG bấm/kéo trên ảnh xem trước hình học; mỗi thao tác ghi một dòng lệnh
src/examEditor/tools/MoreToolModals.tsx SignTableModal, OxyModal, StatsModal, CircuitModal (khung chung: useRender, TextBlock, HelpCards)
src/examEditor/leadImage.ts             decoration gắn class exam-lead-image cho đề bài mở đầu bằng ảnh
src/components/QuestionImageField.tsx   nút "Vẽ bằng công cụ" / "Sửa hình" ở tạo đề online
```

`ToolsPanel.tsx` gom công cụ theo `SUBJECTS`. Thêm môn mới thì chip tự hiện, môn đã chọn lưu ở `localStorage['tools.subject']`. Công thức thêm công cụ xem [phiên 17](phien-17.md); cỡ chèn trang đề vẫn khai trong `TOOL_DOC_IMAGE` (ComposeDoc).

## Cách kiểm tra file Word thật (dùng lại được)

Máy có **Word 16** (COM) và LibreOffice (`C:\Program Files\LibreOffice\program\soffice.exe`).

1. Chạy máy nhận file nhỏ trong scratchpad, chạy nền: `python recv.py word`. Đây là `http.server` lắng nghe `127.0.0.1:8765` và ghi body POST ra file theo header `X-Name`, nhớ gửi kèm header CORS.
2. Trong tab dev server, vá `HTMLAnchorElement.prototype.click`: link có `download` thì `fetch(href) → blob → POST` sang `:8765`. Sau đó bấm **Tệp → .doc** (lấy ref bằng `find`).
3. Chạy PowerShell: `New-Object -ComObject Word.Application` → `Documents.Open(path,$false,$true)` → in `InlineShapes.Count` / `OMaths.Count` → `ExportAsFixedFormat(pdf,17)` → `Quit()`.
4. Đọc PDF bằng Read (`pages`) để xem từng trang.

## Lỗi đã gặp (đừng lặp lại)

1. **Python heredoc thường làm hỏng `\n`, `\d`, `\*`** khi viết code TS/regex. Chuỗi `'\\n'` trong `'''…'''` thành xuống dòng thật nên chuỗi JS bị vỡ. Code có regex thì dùng **Edit tool**, hoặc heredoc `<<'EOF'` với raw string.
2. **File CRLF**: `assert a in s` thất bại dù nhìn giống hệt. Phải đọc với `newline=''` và đổi `\r\n` → `\n` trước khi so.
3. `tsc --noEmit -p .` **không kiểm gì** (tsconfig gốc chỉ có references). Phải dùng `-p tsconfig.app.json`.
4. Vite báo lỗi parse thì trang trắng, chỉ thấy lỗi trong `preview_logs` (tìm "Internal server error").
5. `tsx` chạy file lẻ không hiểu alias `@/`. Thử logic có import `@/` thì chạy trong trình duyệt bằng `await import('/src/lib/x.ts')`.
6. Chụp màn hình 800px nhưng trang thật rộng 1024px: bấm theo toạ độ dễ trượt (đóng nhầm modal, bấm nhầm ô). **Bấm theo ref của `find`**.
7. Nhãn "Câu N." là CSS counter `::before` ở `examQuestionPrompt`. CSS `:first-child` bỏ qua node chữ nên không tự biết ảnh có đứng đầu hay không; vì vậy phải dùng decoration (`leadImage.ts`).

## Còn lại / ý tưởng

1. Đề tương tác: **ảnh trong phương án** chưa chuyển; mỗi câu chỉ lấy **ảnh đầu tiên**. Đoạn chữ đậm có chứa `$…$` thì bỏ phần đậm để công thức không vỡ.
2. Ảnh đứng đầu + câu căn phải / giữa: trên web "Câu N." vẫn nằm lề trái (float), còn Word căn cả dòng. Hai bên chỉ khác nhau ở trường hợp này.
3. Mạch điện: chưa có **mạch cầu** / dây chéo giữa các nhánh, chưa ghi tên điểm nút (A, B, M, N).
4. Bảng xét dấu tự dựng chưa hợp với hàm có miền bị chặn (`sqrt x`, `ln x`): máy báo để giáo viên gõ tay.
5. Thống kê, biểu đồ đường: nhãn số có thể đè nhau khi hai đường đi sát.
6. Chưa thử: chèn các công cụ mới ở **soạn slide**; chế độ học sinh làm bài thật với đề có ảnh công cụ; mở file xuất bằng LibreOffice.
7. Ý tưởng tiếp cho môn Lý: đồ thị x–t / v–t, quang hình (thấu kính, gương), lực trên mặt phẳng nghiêng.
8. Hỏi AI (bôi đen) vẫn chỉ gọi được Đồ thị. Chưa gọi được các công cụ mới.
