# Việc cho Codex: PDF scan đọc bằng AI nhìn ảnh + hiển thị tệp đính kèm ở khung chat AI

Đọc `AGENTS.md` và `context.md` trước. Không commit, không push, không thêm thư viện, không sửa `server/` (phần máy chủ đã làm xong, xem dưới). File CRLF: sửa bằng công cụ sửa file, không dùng `sed -i`; sau khi sửa chạy `git ls-files --eol <file>` và `git diff --stat` (file chỉ đổi vài dòng mà báo hàng trăm dòng là hỏng). UI tiếng Việt, không thêm chữ thừa ngoài những dòng yêu cầu dưới đây, dùng lại component có sẵn.

## Bối cảnh

Khung chat AI (`src/examEditor/AiPanel.tsx`) cho đính kèm tệp (nút kẹp giấy) và "Thêm nguồn" (Đề của tôi / Đề cộng đồng / Kho tài liệu → state `picked`). Khi gửi, tệp đi qua `buildSourcePack` / `loadPickedSources` (`src/lib/sources.ts`) → `extractAttachment` gọi `/api/extract` để tách chữ. PDF scan (không có chữ) hiện trả rỗng nên AI không đọc được.

Máy chủ đã có endpoint mới: `POST /api/extract?vision=1`, body `{ "images": ["data:image/jpeg;base64,...", ...] }`, tối đa **3 ảnh mỗi lượt** (hằng `VISION_PAGES_PER_CALL = 3` trong `server/sourceVision.ts`). Trả `{ text: string, quota }` (chữ chép lại của các trang). Cần đăng nhập (gọi bằng `apiFetch`); hết điểm trả 429 `{ error, code: 'quota' }`; lỗi khác trả `{ error }`. Mỗi lượt tốn điểm AI theo token thật.

Dựng PDF thành ảnh trang trên trình duyệt: đã có `renderPages(file)` trong `src/lib/bankImport.ts` (xem cách nó dựng canvas, `MAX_PAGES`, `PAGE_SIDE`) và nó gọi `bankVision` (endpoint admin, KHÔNG dùng cho việc này). Tách phần dựng trang dùng chung nếu cần (đặt vào file không kéo theo code admin, ví dụ `src/lib/pdfPages.ts`), đừng chép lặp.

## Việc 1 — Đọc PDF scan bằng vision

Trong `src/lib/sources.ts`:
- Thêm hàm `readPdfByVision(file: File, onProgress?)`: dựng các trang (tối đa 12 trang, cạnh dài 1600px như bankImport, JPEG 0.82), chia lô 3 trang, gọi `/api/extract?vision=1` từng lô, nối chữ các lô lại (ngăn cách bằng dòng trống), trả `{ text, warning? }`. Lô lỗi thì bỏ qua kèm cảnh báo (nêu số trang); lỗi quota (429, `code: 'quota'`) thì dừng và ném lỗi mang đúng thông báo của máy chủ. PDF dài hơn 12 trang: cảnh báo "Chỉ đọc 12/N trang đầu."
- Trong `extractAttachment`-người-gọi (`buildSourcePack` cho tệp đính kèm, `loadPickedSources` cho tệp từ Kho tài liệu): khi tệp là PDF mà `/api/extract` trả chữ rỗng (sau `trim`) thì tự gọi `readPdfByVision` thay vì báo "không trích được chữ". Có chữ thật thì KHÔNG gọi vision (không tốn điểm).
- Giữ nguyên thông báo cảnh báo hiện có cho các trường hợp khác. Sau khi vision đọc xong, thêm cảnh báo ngắn "tên.pdf: đọc bằng AI nhìn ảnh." vào danh sách cảnh báo để người dùng biết (hiện trong nút Nguồn).
- Tiến độ: nếu tiện, báo trong nhật ký suy nghĩ của lượt (`logPatch` / bước "Đọc nguồn" trong AiPanel quanh dòng ~917–939) ví dụ "Đang đọc trang 1-3/9…"; không làm nếu quá phức tạp.

## Việc 2 — Cảnh báo tốn điểm khi thêm PDF

Khi người dùng thêm một tệp **PDF** vào khung chat (qua nút đính kèm, hoặc chọn từ Kho tài liệu trong "Thêm nguồn"), hiện cảnh báo một lần cho mỗi lần thêm (dùng `dialog` có sẵn, `src/components/Dialog.tsx`, hoặc dòng cảnh báo nhỏ ngay trong khu chip tệp nếu `dialog` quá nặng). Nội dung ý: "PDF scan (không có chữ) sẽ được AI đọc bằng ảnh nên tốn thêm điểm." Ngắn gọn, giọng bình thường, không khẩu hiệu. Chỉ hiện với PDF (không hiện docx / ảnh / văn bản). Không chặn việc thêm tệp.

## Việc 3 — Tệp đính kèm hiện trên tin nhắn đã gửi, và dọn khung soạn sau khi gửi

Lỗi hiện tại: khi gửi, tin nhắn của người dùng chỉ hiện chữ; tệp đính kèm và nguồn đã chọn (`picked`, chip "Kho tài liệu" / "Đề của tôi" / "Đề cộng đồng") vẫn nằm lại trong khung soạn sau khi gửi.

Làm trong `AiPanel.tsx` (hàm gửi, quanh dòng ~860–900 nơi tạo `userTurn`; chip ở khối `ai-attachments` quanh dòng ~1660–1700):
- `userTurn` đã có `files: displayFiles` — kiểm lượt người dùng đã hiển thị các chip tệp **phía trên** chữ của tin nhắn chưa; nếu chưa hiện (hoặc chỉ hiện với tệp đính kèm mà không hiện với nguồn từ `picked`), thêm hiển thị chip (tên tệp + biểu tượng, dùng `DocIcon` nếu hợp) phía trên bong bóng chữ, cho cả tệp đính kèm lẫn nguồn đã chọn. Lưu tên/loại nguồn đã chọn vào `userTurn` (trường mới, ví dụ `sources`) để còn hiện khi tải lại lịch sử chat.
- Sau khi gửi, dọn `picked` (`setPicked([])`) giống như `setFiles([])` và `setRefs([])` đang làm. Lưu ý biến `sentPicked = picked` đã chốt trước đó nên dọn sau khi chốt là an toàn. Kiểm không còn chỗ nào đọc `picked` sau lúc dọn.
- Kiểm lịch sử chat lưu/khôi phục (tìm nơi lưu `turns`) vẫn chạy với trường mới (trường tuỳ chọn, dữ liệu cũ không có vẫn hiện bình thường).

## Kiểm

- `npx tsc -p tsconfig.app.json --noEmit` sạch.
- Nếu có test sẵn cho `sources.ts` thì chạy lại; thêm test nhỏ cho phần chia lô / nối chữ / xử lý 429 nếu viết được mà không cần trình duyệt (mock `apiFetch`).
- Không chạy dev server nếu không cần.

## Báo cáo

Liệt kê file đã sửa, kết quả tsc + test, việc nào chưa kiểm (giao diện chưa chạy thử trên trình duyệt thì nói rõ).
