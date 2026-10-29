# Phiên 10 — Tạo đề online, xem lại bài, lời giải cuối tài liệu (29/10/2026)

## Làm gì

- **Xem lại bài** (`src/pages/Quiz.tsx`): nút "Xem lại bài" không còn gọi `resetQuiz()` (trước đây xoá hết bài làm). Giờ mở `ReviewView`: lưới số câu tô xanh/đỏ/xám, từng câu hiện đáp án đúng (kể cả câu bỏ trống), phương án chọn sai, đúng/sai theo ý, trả lời ngắn, lời giải tự luận, giải thích.
- **Lời giải cuối tài liệu** (`src/lib/docToExam.ts`): phần cuối có tiêu đề chứa "Lời giải / Hướng dẫn giải / Giải thích", rồi "Câu N: …" (trắc nghiệm, đúng/sai, trả lời ngắn) và "Bài N: …" (tự luận, khớp nhãn khi xuất Word). Đoạn không bắt đầu bằng "Câu/Bài N" nối vào mục trước. Câu thiếu thì không hiện khung giải thích.
- **Tab Tạo đề online** (`/tao-de-online`, nav "Tạo đề online"):
  - `OnlineList.tsx`: lịch sử đề trên máy (đề dở tự lưu, mọi thay đổi ghi ngay vào `store/online.ts`, key `dethinhbien-online`). Mỗi thẻ: Soạn tiếp/Sửa, Làm thử, Đăng lên cộng đồng (tuỳ chọn), chép link, xoá.
  - `OnlineBuilder.tsx` (`/tao-de-online/:id`): 3 bước (Soạn câu hỏi → Thông tin & cài đặt → Hoàn tất). Mục lục câu hỏi bên trái gom theo dạng, soạn từng câu bên phải; 4 dạng: trắc nghiệm (2–6 phương án), đúng/sai (4 ý), trả lời ngắn (≤4 ký tự), tự luận; công thức `$…$` có xem trước; giải thích/lời giải; nhân đôi, đổi chỗ, chia đều thang 10.
  - Cài đặt (`Exam.settings`): không giới hạn thời gian, hiện đáp án và giải thích ngay (trắc nghiệm chọn xong hiện luôn; dạng khác có nút "Kiểm tra đáp án"/"Xem lời giải"), đảo thứ tự câu. Quiz đọc các cài đặt này.
  - `OnlineOpen.tsx` (`/de-online/:id`): link chia sẻ của đề đã đăng, tải từ cộng đồng rồi vào thẳng màn làm bài.
  - `Tệp → Làm đề tương tác` ở trình soạn giờ chuyển đề sang bản nháp ở trang này (`examToDraft`), không vào thẳng làm bài. Chuyển lại thì hỏi mở bản đã chỉnh hay chuyển lại từ đầu.
- Header: ẩn nút "Soạn đề miễn phí" dưới `xl` (thêm tab làm hàng nút vỡ ở 1024px).

## Xuất Word thành .docx thật (sau khi đã gộp main)

Trước đây "Tải Word" lưu một trang HTML đổi đuôi `.doc` (Word mở được nhưng hay cảnh báo, Google Docs/điện thoại dễ vỡ). Giờ xuất `.docx` thật bằng thư viện `docx`:

- `src/examEditor/docxBlocks.ts`: `buildDocx(ExamDoc)` dựng OOXML bám bố cục bản HTML (A4, lề 1,8 × 1,6 cm, Times New Roman 13pt, phương án 2 cột bằng bảng, 4 ô trả lời ngắn, bảng đáp án lưới đều, danh sách đánh số, ngắt trang, định dạng đoạn/mark). Nạp động (chunk riêng ~188 kB), không nằm trong bundle chính.
- `exportBlocks.ts`: `exportDocBlocks` gọi bản trên, tải `<tên>.docx`. `buildWordHtml` vẫn còn vì bản in và `test:export` dùng chung CSS.
- `src/lib/exportDocx.ts`: `examToDoc(Exam)` đổi đề tương tác sang khối soạn rồi dùng chung bộ xuất (nút Tải Word ở trang xem đề cộng đồng, trước đây cũng là `.doc`).
- `src/lib/mathText.ts`: `plainText`/`formatPoints` tách khỏi `math.ts` (file này nạp CSS KaTeX nên không chạy được bằng Node); `math.ts` re-export.
- Test: `npm run test:docx` (zip OOXML, mammoth đọc lại được, thứ tự câu, tiêu đề in hoa, ngắt trang); đã mở file mẫu bằng LibreOffice → PDF để xem bố cục.
- **Giới hạn:** công thức `$…$` vẫn ra dạng chữ như bản `.doc` cũ (chưa đổi LaTeX sang equation của Word); chưa mở bằng Microsoft Word thật.

## Đăng lên cộng đồng

Không đổi schema Supabase: đề online được đăng vào `community_exams.doc` dạng `ExamDoc` rỗng khối + trường `online` (cả `Exam` kèm `settings`). `docToExam` thấy `doc.online` thì trả nguyên đề đó. Đề đăng sẽ hiện trong trang Đề cộng đồng như đề thường. Bản đăng không tự cập nhật khi sửa đề (có nút "Đăng lại bản mới").

## Chưa kiểm chứng / giới hạn

- **Chưa thử đăng thật** (cần tài khoản đăng nhập + Supabase); đường đăng/mở link chỉ được kiểm bằng test và typecheck.
- Chưa thử luồng `Tệp → Làm đề tương tác` bằng tay trong trình soạn.
- Đề online chỉ lưu `localStorage` của máy; xoá dữ liệu trình duyệt là mất lịch sử.
- Test: `npm run test:online`, `test:grading`, `scripts/test-doc-to-exam.ts`.
