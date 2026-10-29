## BÀN GIAO PHIÊN 9 (29/10/2026) — đề tốt nghiệp THPT 2025: câu Đúng/Sai, Trả lời ngắn; làm đề tương tác từ trình soạn. Đọc mục này TRƯỚC.

Nối tiếp [phien-8.md](phien-8.md) (đã gộp vào `main`, merge `99b15d3`). Việc phiên này nằm trên nhánh **`feat/dung-sai-tra-loi-ngan`** (tách từ `main`), đã commit và push, **chưa tạo PR, chưa merge vào `main`**.

### Đã làm

**1. Nút "Làm đề tương tác" trong trình soạn đề** (`Tệp → Làm đề tương tác`)
- Trước đó `docToExam` chỉ được gọi từ đề cộng đồng; trình soạn `/soan-de` không có đường chuyển. Giờ `handleStartQuiz` ở `src/pages/ComposeDoc.tsx` dựng đề từ khối đang soạn (`docToExam(activeDoc, "doc-<id>")`) rồi mở `/lam-de/<id>`.
- Mỗi lần bấm **thay bản đã chuyển trước đó** (tìm `importedFrom` rồi `deleteExam`): `importExam` chống trùng theo `importedFrom`, nếu không thay thì sửa đề rồi làm lại sẽ ra bản cũ.
- Đề không có câu nào: báo "chưa có câu hỏi". Có câu thiếu đáp án hợp lệ (trắc nghiệm, đúng/sai hoặc trả lời ngắn): hỏi xác nhận trước khi làm (`isAutoGraded`).
- Mục menu thêm bằng prop `extra` của `FileMenu` (nay có `icon` tuỳ chọn) và prop `onStartQuiz` của `Ribbon`.

**2. Hai dạng câu mới theo đề tốt nghiệp THPT từ 2025** (QĐ 764/QĐ-BGDĐT; tra từ báo chính thống, **không đọc văn bản gốc**)
- Nhiều lựa chọn A–D: 0,25 điểm/câu. Đúng/Sai: 4 ý a) b) c) d), điểm theo số ý đúng 0 / 0,1 / 0,25 / 0,5 / 1. Trả lời ngắn: đáp án là số, tối đa 4 ký tự (kể cả dấu âm và dấu phẩy), 0,5 điểm/câu môn Toán, 0,25 điểm các môn khác. Khung đề Toán: 12 + 4 + 6.
- **Mô hình:** không thêm loại khối mới. `QuestionBlock` có `kind?: 'mcq'|'tf'|'short'` (`src/data/docTypes.ts`); node `examQuestion` có attr `kind` → `data-kind` (`schema.ts`); `convert.ts` giữ `kind` hai chiều; `tf` dùng `options` nhãn chữ thường a–d, `short` không có `options`.
- **Số câu `no` đánh liên tục** qua cả ba dạng (không đánh lại từ 1 mỗi phần) để khối đáp án khớp được. Tự luận (`essay`) đánh số riêng ("Bài N") nên `no` có thể trùng với câu hỏi.
- **Trình soạn:** nút "Đúng/Sai" và "Trả lời ngắn" ở tab Chèn (`Ribbon.tsx`), hai mẫu cùng id `truefalse`, `short` trong `templates.ts` (trước đây là câu tự luận giả dạng). CSS (`index.css`): tf một ý một dòng nhãn `a)`; short vẽ 4 ô vuông bằng `::after`. `choiceLayout.ts` bỏ qua câu có `kind` (không đo số cột).
- **Xuất Word/in:** `exportBlocks.ts` (đề soạn) và `lib/exportDocx.ts` (đề tương tác): tf nhãn `a)` một cột, short bảng 4 ô.
- **AI sinh đề:** `AiPanel.tsx` prompt mô tả ba phần, điểm, cách đánh số liên tục và định dạng đáp án (đúng/sai là chuỗi Đ/S `ĐSĐS`, trả lời ngắn là số dấu phẩy). `sanitizeBlocks` (`ComposeDoc.tsx`) nhận `kind`, ép nhãn tf về chữ thường.
- **Chuyển và chấm** (`src/lib/docToExam.ts`, **`src/lib/grading.ts` mới**):
  - `QuestionType` thêm `'dung-sai'`, `'tra-loi-ngan'` (`src/data/types.ts`). Đáp án và bài làm đều là **chuỗi**: tf = `"ĐSĐS"` (bài làm dùng `_` cho ý chưa chọn), short = `"-1,5"`.
  - `docToExam`: phần I TRẮC NGHIỆM, II ĐÚNG/SAI, III TRẢ LỜI NGẮN, (IV) TỰ LUẬN theo thứ tự có mặt; tf 1 điểm/câu; short theo môn; trắc nghiệm chia phần còn lại của 10 điểm (làm tròn 2 chữ số như cũ, nên khung lệch như 12 câu khác Toán có thể ra tổng ≠ 10). Đáp án tf đọc được `ĐSĐS`, `a) Đ, b) S…`, `a-Đúng b-Sai…`; đáp án tự luận không nhặt nhầm mục của tf/short trùng `no`.
  - `scoreQuestion`/`isFullyCorrect`/`isAutoGraded`/`describeAnswer`/`sameShort`... ở `grading.ts`; `store/app.ts` `submitQuiz` dùng `scoreQuestion`.
  - `Quiz.tsx`: `TrueFalseInput` (nút Đúng/Sai từng ý), `ShortAnswerInput` (chỉ nhận chữ số, `-`, `,`; gõ `.` tự đổi thành `,`; tối đa 4 ký tự); trang kết quả hiện từng ý và điểm theo bảng. `ExamSheet.tsx`: short hiện 4 ô.

**3. Câu chữ trang chủ:** bỏ "Không cần đăng nhập" (đã có auth) ở `Home.tsx` (nhãn đầu trang, mục "Ba bước", mục kêu gọi cuối) và `Layout.tsx` (chân trang). "Miễn phí" giữ nguyên.

### Kiểm tra
`npx tsc -b --noEmit` sạch; `npm run test:grading` (mới), `test:convert` 12/12, `test:export` 5/5, `test:layout` 7/7, `npx tsx --tsconfig tsconfig.app.json scripts/test-doc-to-exam.ts` OK. Trên trình duyệt: chèn ba dạng câu, bấm Tệp → Làm đề tương tác (hộp xác nhận thiếu đáp án), chọn Đúng/Sai, gõ vào ô trả lời ngắn, nộp bài, xem kết quả.

### Chưa xong / cần biết
- **Chưa thử đường đầy đủ bằng đáp án thật qua khối "Bảng đáp án"** trong trình soạn (lần thử trên trình duyệt không có đáp án nên điểm 0). Cách chấm đã có test; đường bảng đáp án → `docToExam` chỉ được test bằng dữ liệu dựng tay.
- **Chưa thử** sinh đề bằng AI với hai dạng mới (prompt đã sửa, chưa gọi LLM), nhập tệp Word có câu đúng/sai (`textToBlocks` không nhận ra `kind`, đúng/sai nhập từ Word vẫn là tự luận), xuất Word của đề soạn có đúng/sai/trả lời ngắn (chưa mở file bằng Word).
- **Số câu liên tục, không đánh lại từ 1 mỗi phần** như đề chính thức (CSS `counter` `exam-q` đếm mọi `examQuestion`). Muốn đánh lại phải đổi cách khối đáp án định danh câu.
- Chưa làm phiếu trả lời tô bằng bút chì và mã đề. Cấu trúc điểm môn khác Toán lấy từ bài tổng hợp, nên đối chiếu đề minh họa chính thức của từng môn.
- `.claude/` vẫn chưa theo dõi (không commit). Việc tồn từ phiên 8 (xuất PPTX icon/màu mới, kéo thả thứ tự slide, Alt+bấm chọn phần tử dưới, ảnh tải lên lên R2) **chưa đụng tới**.

### Đề xuất cho phiên sau
1. Thử đường đầy đủ: sinh hoặc nhập đề có đáp án → bảng đáp án → Làm đề tương tác → nộp → khớp điểm; sửa nếu lệch.
2. Cho `textToBlocks` nhận dạng đề Word có phần đúng/sai và trả lời ngắn (nhận `a)` `b)` `c)` `d)`; "Đáp án" là số).
3. Tạo PR `feat/dung-sai-tra-loi-ngan` → `main` rồi merge.
4. Quay lại danh sách việc của phiên 8.
