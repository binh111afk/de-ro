# Phiên 11 — Kiểm file xuất, nhập đề từ file, ảnh trong câu hỏi (30/10/2026)

## Làm gì

### 1. Kiểm file tải về bằng Word, PowerPoint, LibreOffice
Soạn một đề và một bài slide trên web, tải về, mở bằng cả ba trình và đối chiếu với web (Word/PowerPoint qua COM, LibreOffice headless → PDF → PNG bằng `pymupdf`). Đề `.docx` khớp web ở cả Word và LibreOffice. Ba lỗi tìm ra và đã sửa:
- **`.docx` thang điểm "1. 1."** — `docxBlocks.ts` vừa in nhãn `1.` vừa đánh số tự động. Bỏ đánh số tự động, nhãn in đậm.
- **`.pptx` biểu đồ sai chỗ** — `addChart` của pptxgenjs không đọc toạ độ `"%"` (đặt về 1in,1in). `exportDeck.ts` đổi sang inch (slide 10 × 5,625).
- **`.pptx` icon bị kéo méo** — icon vuông bị ép theo hộp chữ nhật. Giờ là hình vuông nằm giữa hộp.
- Còn lệch nhỏ (chưa sửa): biểu đồ web tô mỗi cột một màu, `.pptx` một màu; thanh viền đầu thẻ ở layout `cards` nhô ra ngoài góc bo.

### 2. Nhập đề từ file ở trang Tạo đề online
Nút **Nhập đề từ file** (`.docx`, `.pdf`, `.txt`, `.md`) trong khung Mục lục câu hỏi của `OnlineBuilder.tsx`. Luồng: `readImportFile(file, true)` (`importFile.ts`) → `extractAttachment` (`sources.ts`) → `POST /api/extract` (`server/extract.ts`, cờ `marks`) → `parseExamText(text, images)` (`src/lib/parseExamText.ts`) → câu nối vào cuối đề, tên đề lấy từ tên file nếu còn trống.
- **Tách câu** theo chữ: "Câu N."/"Bài N.", phương án `A. B. C. D.` (hoa/thường, `a.` `a)`), ý `a) b) c) d)`, `Đáp án:`, `Lời giải:`, "(1,5 điểm)". Đề không có "Câu N." (chuyển từ PDF, đề bài là ảnh): mỗi bộ A–D là một câu. Số trang dính đầu dòng (`1d.`, `3Câu 13`) được bỏ.
- **Đáp án ở cuối đề**: `Câu 1: a. Câu 11: b.` (nhiều cặp một dòng), `1A 2B`, bảng Word (ô "Câu" 1 2 3 rồi "Đáp án" A B C). Đáp án ghi ngay trong câu thắng bảng cuối.
- **Đáp án đánh dấu trong câu**: phương án **duy nhất** được in đậm/nghiêng/gạch chân/gạch ngang/đổi màu/tô nền, hoặc có `* ✓ ✔`. Cả bốn cùng nổi bật hoặc không có thì bỏ qua. Ý đúng/sai: ý được đánh dấu là Đúng (chỉ khi không phủ hết các ý).
- **Server bọc chữ nổi bật** bằng ký tự riêng U+E000…U+E001 (chỉ khi `marks`):
  - `.docx`: đọc `word/document.xml` bằng jszip (`markEmphasis`, `isEmphasised`), rồi mammoth `extractRawText`.
  - PDF: `pdfEmphasis` — tên font gốc (`fontExtraProperties`) → đậm/nghiêng; theo dõi màu tô qua danh sách lệnh vẽ, ghép theo vị trí chữ → màu chữ; đường kẻ mảnh sát chân chữ → gạch chân/gạch ngang; hình chữ nhật tô màu phủ chữ → tô nền. Mới thử với PDF xuất từ LibreOffice và Word (`scripts/fixtures/*.pdf`).
- **Ảnh nhúng trong `.docx`** (sub agent): ảnh được thay bằng token vị trí trong text, server trả `images: string[]` (data URL, tối đa 300 ảnh/12MB, bỏ ảnh <24px, EMF/WMF, ảnh trong khung chữ). Parser gắn ảnh đầu của đề bài vào `Question.image`. Trên `qp1(1).docx` (952 ảnh nhúng, ~200 câu): 156/200 câu có ảnh, 44 chưa, 79 ảnh không gắn được.
- Test: `npm run test:parse` (kèm 2 PDF mẫu trong `scripts/fixtures`).

### 3. Ảnh trong câu hỏi
Trước đây ảnh trong trình soạn Word bị **mất** khi chuyển sang mô hình lưu (`walkInline` của `convert.ts` bỏ node `image`).
- `docTypes.ts`: `Span.image?: { src, alt?, width? }` (span ảnh có `text` rỗng). `convert.ts` giữ ảnh hai chiều (`walkInline`, `richNodes`, `splitRichLines`, không gộp span ảnh).
- `types.ts`: `Question.image?: QuestionImage` = `{ src, position?: 'top'|'bottom'|'left'|'right', width?: % khung (mặc định 60), alt? }`.
- `docToExam.ts`: `promptImage` — ảnh nằm trước mọi chữ → `top`, còn lại → `bottom`. Ảnh trong phương án chưa hỗ trợ.
- `components/QuestionBody.tsx` (làm bài + xem trước): trên/dưới xếp dọc, trái/phải xếp cạnh chữ, màn hẹp tự xếp dọc. Chưa chỉnh độ rộng: tối đa 420px; không bao giờ phóng to quá kích thước gốc.
- `components/QuestionImageField.tsx` + `lib/questionImage.ts` (`imageToSrc`: thu nhỏ ≤1280px, nén JPEG, tải R2, lỗi thì giữ data URL; `uploadQuestionImages`: tải ảnh nhập từ file lên R2, tối đa 4 ảnh song song) ở `OnlineBuilder`: nút thêm ảnh, dán Ctrl+V vào ô đề bài, 4 vị trí, thanh độ rộng, xoá.
- **Xuất `.docx`** (sub agent): `docxBlocks.ts` `ImageRun` (đọc kích thước từ header PNG/JPEG/GIF; WebP/SVG bỏ êm); `inlineDocImages` đổi `/api/files/...` thành data URL trước khi dựng. Ảnh trên/dưới là một dòng riêng; trái/phải là bảng 2 ô không viền (`QuestionBlock/EssayBlock.imagePosition`). Bản in `exportBlocks.ts` in `<img>` nhưng trái/phải chưa chia 2 cột. Câu có ảnh căn trái (căn đều làm giãn dòng).
- Test: `test:convert` (ca ảnh round-trip), `test-doc-to-exam.ts`, `test:docx`. Đã thử trên web: thêm ảnh, đổi vị trí, Làm thử.

## Chưa làm / giới hạn
- Ảnh trong phương án A–D; ảnh ở trang đề cộng đồng (`ExamView`); ghép nhiều mảnh ảnh của một đề bài; ảnh EMF/WMF và ảnh trong khung chữ; ảnh từ PDF; PDF scan/OCR.
- SVG: đang vẽ ra JPEG nền trắng (`shrink`). Nên đổi sang PNG trong suốt ~2x, lấy kích thước từ `viewBox`.
- Bản in/PDF: ảnh trái/phải chưa chia 2 cột. Chưa thử Word thật cho bảng 2 ô khi ảnh rất cao.
- Ô **dán văn bản** để tách câu (parser dùng lại được). Công thức equation của Word mất khi nhập (mammoth bỏ).
- Ảnh trên R2 không bị dọn khi xoá câu/đề (free tier 10 GB, 1M ghi, 10M đọc/tháng; còn rộng).
- PDF nhiều cột/chữ xoay chưa thử; tên font lạ (`F1`) không nhận đậm/nghiêng.
- `test:parse` dùng `@napi-rs/canvas` (có trong `node_modules`, chưa khai báo trong `package.json`).
- Chưa thử đăng thật đề có ảnh lên cộng đồng; chưa thử PDF/docx thật khác ngoài các file mẫu.

## Lưu ý khi làm việc (rút từ phiên này)
- Trình duyệt trong app từ chối `127.0.0.1`, dùng `localhost:5184`. Nút tải của trình duyệt trong app ghi file thành `<guid>.tmp` trong `Downloads` (đổi đuôi là dùng được); xoá file ở đó bị chặn.
- Tên file có dấu trong `Downloads` có thể ở dạng Unicode phân rã (NFD): `open` theo tên gõ tay báo không thấy → `cp /c/Users/.../Downloads/30*.docx` bằng glob.
- Khi viết script Python/bash có `\` (regex, `\n`) qua heredoc: dấu `\` bị xử lý hai lần, regex hỏng thầm lặng (ví dụ `\b` thành ký tự backspace). Viết file bằng công cụ Write hoặc dùng `chr(92)`.
- Chạy `tsx` có top-level await kéo theo `pptxgenjs`/`pdfjs` có thể treo: kết thúc script bằng `process.exit(0)`.
- Khi giao việc cho sub agent: chia theo tập file không giao nhau, nói rõ file cấm sửa, và đưa đường dẫn file thật (một agent đã dùng nhầm file nên báo "không có ảnh").

## Việc tiếp theo gợi ý
1. Đổi SVG → PNG trong suốt (vài chục dòng, thêm test).
2. Ảnh trong phương án A–D (cần đổi cách xếp phương án khi làm bài và khi xuất Word).
3. Ô dán văn bản để tách câu (mục 5b của `docs/viec-con-lai.md`).
4. Dọn ảnh R2 không còn dùng; hiện ảnh ở trang đề cộng đồng.
