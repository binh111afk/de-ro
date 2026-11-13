# Phiên 34 (12–13/11/2026): AnyRouter thay xkiro, Chỉnh cạnh 3D, 6 công cụ mới (ma trận, phiếu trả lời, thấu kính, phả hệ, Punnett, lưới thức ăn)

Tiếp [phiên 33](phien-33.md). Mọi việc dưới đây **đã lên `main` và đã push** (commit cuối `acc51a8`). Không có migration mới. Không còn nhánh / worktree agy nào treo.

## ⚠️ Việc đầu tiên phiên sau: viết prompt và giao agy nhóm "ưu tiên vừa"
Người dùng dặn: **phiên sau giao cho agy làm các công cụ "ưu tiên vừa" (người dùng gọi là 7, 8, 9)**. Danh sách đề xuất gốc trong phiên này đánh số 1–8, nhóm "ưu tiên vừa" là 4 mục dưới đây (số 5–8 trong danh sách gốc). **Hỏi lại người dùng một câu** xem "7 8 9" là cả nhóm hay chỉ mục nào, rồi mới viết prompt.

| Mục gốc | Công cụ | Ghi chú để viết prompt |
|---|---|---|
| 5 | **Đồ thị điện xoay chiều + sóng** (Lí 12) | u, i theo t lệch pha φ; sóng dừng có nút/bụng, bước sóng λ. Mở rộng từ `osc` (`src/lib/oscillation.ts`, `OscModal`), không làm công cụ rời nếu được. |
| 6 | **Đường sức điện trường / từ trường** (Lí 11) | điện tích điểm (+/−, hai điện tích), dây dẫn thẳng, vòng dây, ống dây; chiều dòng điện, kí hiệu ⊙ ⊗. |
| 7 | **Công thức cấu tạo mạch vòng** (Hoá 11–12) | vòng benzen, xiclo; nâng cấp `struct` (`src/lib/chem.ts`, `renderStructSvg`) — hiện chỉ vẽ mạch hở. |
| 8 | **Biểu đồ kết hợp cột + đường, biểu đồ miền** (Địa lí) | thêm kiểu biểu đồ vào `stats` (`src/lib/stats.ts`), hai trục tung trái/phải. |

Cách giao (làm y như phiên này, chi tiết ở [phiên 33](phien-33.md) mục "Lưu ý cách làm"):
- Mỗi việc một file `prompt-agy-<tên>.md` ở gốc repo (file tạm, **không commit**), mỗi việc **một worktree + nhánh riêng** (`git worktree add -b feat/x ../dethinhbien-x origin/main`). Push `main` trước khi giao.
- Prompt phải có: file mẫu để bắt chước, spec, ví dụ tự kiểm có số liệu, script `scripts/check-<tên>.ts`, ràng buộc "không push, không merge, không commit ảnh chụp/file thử; ở file dùng chung chỉ thêm dòng".
- Câu giao cho agy (người dùng tự dán): `Đọc file prompt-agy-<tên>.md ở gốc dự án rồi làm đúng theo đó, từ bước tạo worktree, các việc cần làm, phần tự kiểm cho đến ràng buộc. Xong thì báo lại theo mục "Báo lại" ở cuối file.`

## Đã làm

### AI dự phòng: AnyRouter `openai/gpt-6.1-terra` thay xkiro (`bb79777`)
- Chuỗi mới trong `server/llmProxy.ts`: opencode → Mercury → FOSTA → **AnyRouter** → NightRouter → Claude. Bỏ hẳn xkiro (kể cả đọc key từ `~/.zcode`). Đọc ảnh đề (`server/bankVision.ts`) còn FOSTA → Claude.
- Biến `ANYROUTER_API_KEY`, `ANYROUTER_BASE_URL` (mặc định `https://anyrouter.dev/v1`), `ANYROUTER_MODEL` (mặc định `openai/gpt-6.1-terra`). **Gọi kiểu stream** rồi gom SSE (`sseToJson`) — gọi thường thì AnyRouter cắt sau 60 s (502) khi sinh đề dài.
- Đã thử kỹ: giải đề 40 câu 39–40/40, sinh đề 5 môn 5/5 (stream), ~$0,002/đề, sai ~2,5% đáp án Toán. AnyRouter mới mở, từng 502 liên tục → chỉ để dự phòng.
- `imageProxy.ts` (ảnh minh hoạ slide) **vẫn dùng xkiro** — chưa đổi.
- **Treo trên Vercel:** thêm `ANYROUTER_API_KEY` (không có thì production bỏ qua AnyRouter). Vẫn treo `AI_SETTINGS_SECRET` từ [phiên 30](phien-30.md).
- Đã thử rồi bỏ: FreeModel (freemodel.in, ẩn danh, không tắt được suy luận, bảo trì nhiều) — biến môi trường đã xoá. Tham khảo giá DeepSeek chính hãng: Flash ~$0,024/đề giờ cao điểm (8–11h, 13–17h giờ VN ngày thường), ~400 đề/$10.

### Agy: Chỉnh cạnh cho Hình học không gian (`0cf69aa`, sửa `16bbf30`)
- Toạ độ `A(x; y; z)` trong "Dựng thêm" ghi đè đỉnh mẫu; nút "Chỉnh cạnh" ở `Geo3dModal`: kéo trên mặt ngang, **Shift** kéo đứng, lăng trụ/hộp đáy trên đi theo, Shift kéo đỉnh trên = cả mặt trên; hít theo trục, S ngay trên điểm đặc biệt của đáy, độ dài 3D tròn; bảng độ dài thật. Ký hiệu góc vuông mẫu chỉ vẽ khi còn vuông.
- Sửa thêm: đổi mẫu hình thì xoá dòng `// kéo`; bảng ghi tên cạnh theo đỉnh đang kéo (SA, SB).

### Agy: 6 công cụ mới (gộp `c5b694c`…`5dc4fb6`, sửa `4547031`, phiếu mới `acc51a8`)
- **Ma trận & đặc tả** (nhóm Khác, chỉ ở đề; `MatrixModal.tsx`, `src/lib/matrixExam.ts`): AI phân loại chủ đề (theo tên chương trong `khung*.json`) + mức NB/TH/VD/VDC (tiểu học M1–3, đúng-sai theo từng ý), sửa tay từng câu, ma trận + bản đặc tả, xuất Word khổ ngang hoặc chèn cuối đề. Kèm **loại khối `table` mới** trong `docTypes.ts` (trước đây bảng trong đề có thể mất khi lưu) — có ở `convert.ts`, `docxBlocks.ts`, `exportBlocks.ts`, `sources.ts`.
- **Phiếu trả lời** (trong Xáo đề; `src/lib/answerSheet.ts`): phiếu theo mẫu phiếu thật 3 phần (khung + ô đỏ, chữ ký cán bộ coi thi, mục 1–8, SBD 6 cột, mã đề in sẵn, Phần II 2 câu/khung, Phần III dấu "−" cột đầu, dấu phẩy cột 2–3, dấu định vị), số câu mỗi phần lấy theo đề, tự giãn cỡ ô; + bảng đáp án tổng hợp theo mã. PDF là đường chính, Word chèn ảnh PNG.
- **Thấu kính** (Vật lí, `src/lib/lens.ts`): hội tụ/phân kì, f, d, h → ảnh tự tính, 3 tia, ảnh ảo nét đứt, d = f vô cực, ẩn ảnh.
- **Nhóm "Sinh học" mới**: **Sơ đồ phả hệ** (`pedigree.ts`, gõ `1: nam bệnh`, `1 x 2 -> 5, 6`, sinh đôi, cận huyết, `hỏi 12`), **Bảng lai Punnett** (`punnett.ts`, tới 3 cặp gen, gen X, trội không hoàn toàn; chèn dạng **ảnh** như "Tạo bảng", không phải bảng sửa được trong Word), **Lưới thức ăn** (`foodweb.ts`, tự tính bậc dinh dưỡng, `?A` ẩn tên).
- Lỗi đã sửa khi review: phả hệ báo "chưa khai báo" với mẫu có sẵn + xếp sai thế hệ + vợ chồng đứng xa; ma trận ghép kết quả AI nhầm khi câu và bài tự luận trùng số; `ToolShell` bị đổi căn giữa xem trước của mọi công cụ vẽ; xoá trang `/preview-ma-tran` và ảnh chụp agy commit.

## Lưu ý cách làm (rút từ phiên này)
- **Script tự kiểm của agy qua hết vẫn có thể sai** (phả hệ): luôn mở công cụ trên trình duyệt, bấm thử mẫu có sẵn.
- Gộp 4 nhánh cùng thêm công cụ: xung đột ở `ToolsPanel.tsx`, `toolSpec.ts`, `toolImages.ts`, `ToolModal.tsx`, `MoreToolModals.tsx`, `docRewrite.ts`, `BoardEditor.tsx`, `DocSelectionAi.tsx`. Gộp "giữ cả hai bên" được hầu hết; riêng `MoreToolModals.tsx` git cắt đan xen form → dựng lại = bản HEAD + import mới + khối nối đuôi sau `OscModal` của nhánh. Sau đó sửa tay các dòng trùng (`FIT_KINDS`, bảng tên công cụ trong `BoardEditor`), đánh lại số mục `FIGURE_GUIDE`. **Kiểm `tsc` + dấu `<<<<<<<` trước mỗi commit gộp** (phiên này lỡ commit gộp hỏng, phải `reset --hard` về commit gộp tốt — chỉ làm được vì chưa push).
- Xem SVG trên trình duyệt: chép vào `public/_x.svg`, chạy dev, mở bằng `<img style="width:100%">` qua `javascript_tool`; xoá file sau khi xem.
- Push/commit chỉ khi người dùng bảo trong lượt đó (bộ phân loại chặn push khi lượt không yêu cầu).

## Còn lại / chưa kiểm
- Ma trận & đặc tả và phiếu trả lời **chưa thử trên trình duyệt với đề có câu hỏi thật** (bước AI phân loại, xuất Word, chèn vào đề, in PDF phiếu) — chỉ kiểm bằng script.
- Chỉnh cạnh 3D: bảng hiện 2 chữ số thập phân nhưng lưu làm tròn 0,1; điểm dựng thêm chưa chạy theo khi đang kéo; khung hình dịch nhẹ sau mỗi lần thả.
- Vercel: `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`.
- `imageProxy.ts` vẫn dùng xkiro (ảnh minh hoạ slide).
