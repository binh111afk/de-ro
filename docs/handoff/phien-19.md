# Bàn giao phiên 19 (04/11/2026): Làm tiếp danh sách tồn của phiên 18

## Đã làm

| Việc | Nội dung | File |
|---|---|---|
| Đề tương tác: ảnh | Ảnh trong **phương án** và ảnh thứ 2 trở đi của đề bài đi vào chữ dạng `![alt\|rộng%](src)`; `renderMath` vẽ thành `<img>` (chỉ nhận `http(s):`, `data:image/`, `/`). Ảnh đầu tiên vẫn là `Question.image` | `docToExam.ts` (`toRich`, `withImage`), `math.ts` (`inlineImage`) |
| Ảnh đầu + căn phải/giữa | Bỏ nhãn float. Widget `exam-lead-label` (có `<br>` trước) đặt ngay sau dãy ảnh đầu nên "Câu N." đi cùng dòng chữ và theo căn lề. Word: đoạn ảnh đầu nhận `fmtOpts(b.format)` (căn cùng câu). Web và Word giờ khớp nhau | `leadImage.ts`, `index.css`, `docxBlocks.ts` |
| Mạch điện | `cầu(R1, R2, R3, R4, R5)`: mạch cầu chữ nhật, R5 dựng đứng nối M–N. `@A` ghi tên điểm nút trên dây | `circuit.ts` (`bridge`, node `pt`) |
| Bảng xét dấu | Tự tìm miền xác định một khoảng (`domainOf`): đầu mút thành số (0 thay vì −∞), kí hiệu tại đầu mút `0` / `\|\|` (`SignRow.ends`). Dạng chữ: thêm 2 kí hiệu hai đầu (2n−1). Miền gồm nhiều khoảng rời thì báo gõ tay | `signTable.ts` |
| Biểu đồ đường | Nhãn số xếp theo cột: nhãn sát nhãn trên thì xuống dưới điểm | `stats.ts` |
| Hỏi AI (bôi đen) | Nút **Vẽ hình minh hoạ**: `planTool` để AI chọn đồ thị / bảng xét dấu / Oxy / thống kê / mạch điện, trả cấu hình chữ, app tự vẽ (vẽ thử trước khi hiện). "Sửa trong công cụ" mở đúng công cụ | `docRewrite.ts`, `DocSelectionAi.tsx`, `ComposeDoc.tsx` |
| Môn Lý | **Đồ thị chuyển động** (x–t, v–t, a–t gấp khúc từ các điểm `(t; giá trị)`, nét đứt chiếu) và **Mặt phẳng nghiêng** (góc, P, N, Fms, F lên/xuống dốc) | `physics.ts`, `MoreToolModals.tsx` (`MotionModal`, `InclineModal`), `toolSpec.ts`, `ToolModal.tsx`, `ToolsPanel.tsx` |

## Đã kiểm

- `tsc -p tsconfig.app.json` sạch; test convert, export, docx, online, grading, markdown đều qua.
- Trình duyệt: logic bảng xét dấu (`√x·(x−1)`, `ln x`, `(x−2)/√(4−x)`, `√(x²−1)` báo lỗi), `docToExam` với ảnh trong phương án; hình mạch cầu, đồ thị v–t, mặt phẳng nghiêng, biểu đồ đường 2 dãy sát nhau; ảnh đầu câu căn phải/giữa/trái trong trình soạn; modal Mặt phẳng nghiêng mở từ chip Vật lí.

## Chưa kiểm / còn lại

1. Chưa mở file Word thật cho ảnh đầu căn phải (chỉ sửa code; nên chạy quy trình Word COM ở phiên 18).
2. `planTool` chưa gọi thử với LLM thật. AI chưa chọn được 2 công cụ Lý mới.
3. Vẫn chưa thử: công cụ mới ở **soạn slide**, học sinh làm bài với đề có ảnh, mở file xuất bằng LibreOffice.
4. Bảng xét dấu: miền gồm nhiều khoảng (vd. `√(x²−1)`) vẫn phải gõ tay.
5. Ảnh inline trong đề tương tác chưa có ô chỉnh độ rộng ở tạo đề online (chỉ đọc `|rộng%`).
6. Ý tưởng Lý tiếp: quang hình (thấu kính, gương).
