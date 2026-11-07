# context.md — đề rõ (trình soạn đề thi)

Bản đồ ngắn của dự án. **Chỉ đọc file này khi bắt đầu phiên**; các file khác mở khi việc đang làm cần tới (bảng "Đọc thêm khi nào" bên dưới). Cập nhật: 07/11/2026 (phiên 24). **Đang ở nhánh `feat/trig-7-tinh-nang`, chưa merge — xem phiên 24.**

## Dự án

Web app soạn đề thi tiếng Việt kiểu Word: React 19 + TypeScript + Vite 6 + Tailwind v4 + TipTap 3. Thư mục `C:\Users\Lenovo\Desktop\workspace\dethinhbien`, nhánh `main`, remote `binh111afk/de-ro`.

- `/soan-de`: trình soạn chính (tab Bắt đầu tạo đề / slide). Soạn đề: AI bên **phải**; Mục lục / Khối mẫu / Công cụ bên **trái**. Soạn slide: AI bên phải.
- Màn khác: Đề cộng đồng, Tạo đề online (lịch sử, đề đã xuất bản, kết quả), Đề của tôi, Thư viện, Chấm điểm, Quiz.
- Tài khoản Supabase (`user_items`, `community_exams`, `exam_attempts`, `ai_usage`), file trên R2.
- AI: `server/llmProxy.ts` thử opencode (`LLM_*`) → Mercury 3 (`MERCURY_*`) → Agnes (`AGNES_*`, đang tắt) → xkiro. Hạn mức token `server/aiQuota.ts`: tài khoản 150k/tháng, khách 30k/ngày, ngoại lệ ở bảng `ai_quota_overrides`.
- Chạy thật: Vercel https://de-ro-lac.vercel.app, push `main` là tự deploy. `api/*.ts` chỉ re-export handler `server/`; `server/guard.ts` chặn Origin lạ + giới hạn lượt.

## Nguyên tắc không được phá

1. `ExamBlock` (`src/data/docTypes.ts`) là mô hình lưu bền vững; AI, thư viện, xuất Word, in đều đi qua nó. TipTap chỉ là lớp trình bày.
2. Một editor TipTap liên tục; trang A4 chỉ là nền vẽ phía sau (`zoom` CSS, không `transform`).
3. Key LLM ở server, gọi qua proxy `/api/llm`; không đưa key vào bundle. Client gọi API bằng `apiFetch` (gắn token đăng nhập).
4. Giao diện tiếng Việt, bám Word / GenOffice.

## Lệnh

```powershell
npm run dev -- --port 5184 --host 127.0.0.1     # http://127.0.0.1:5184/soan-de (hoặc preview_start "dev")
npx tsc -p tsconfig.app.json --noEmit           # KHÔNG dùng `tsc -p .` (không kiểm gì)
npm run test:convert | test:export | test:docx | test:online | test:grading | test:markdown | test:guard   # bộ hay dùng
```

Danh sách đủ: `package.json` → `scripts`. `.env` cần `LLM_API_KEY` (mẫu `.env.example`).

## Bản đồ nhanh

| Vùng | File chính |
|---|---|
| Trình soạn đề | `src/pages/ComposeDoc.tsx`, `src/examEditor/` (schema, convert ExamBlock↔TipTap, Ribbon, FileMenu, AiPanel, DocSelectionAi) |
| Xuất Word | `src/examEditor/docxBlocks.ts` (phương án A–D xếp bằng tab stop), test `scripts/test-docx.ts` |
| Đề tương tác | `src/lib/docToExam.ts`, `src/lib/math.ts` (renderMath: `$…$`, `**đậm**`, ảnh `![alt\|rộng%](src)`) |
| Công cụ vẽ | `src/lib/toolSpec.ts` (ToolDoc + renderTool), `src/examEditor/tools/` (ToolsPanel = SUBJECTS, ToolModal, MoreToolModals), `src/examEditor/toolImages.ts` (ảnh công cụ trong đề, đổi PNG). Thư viện vẽ: `plot, varTable, geometry, signTable, oxy, stats, mathExtra` (Toán), `circuit, physics` (Lý), `chem` (Hoá). AI dùng qua `FIGURE_GUIDE` + `toolFromRaw` (`src/lib/docRewrite.ts`) |
| Bảng đáp án | `src/lib/answerKey.ts` (chia theo dạng câu, dùng cho trình soạn + Word) |
| Khung chương trình | `src/data/khungToan.json` (Toán 6–12 GDPT 2018, chưa nối vào prompt) |
| Kho câu hỏi | `src/data/bank.ts` + `bankThpt.ts`/`bankThpt2.ts` (nạp lười), độ khó `bankLevel.ts`, câu có hình `src/data/bankFigures.ts` (field `figure`), `src/examEditor/BankModal.tsx` |
| Slide | `src/examEditor/SlideEditor.tsx`, `slide.css`; đồ hoạ `src/lib/graphics.ts` là file **sinh tự động** |
| Danh sách có phân trang | `src/components/Pager.tsx` |

**Thêm một công cụ vẽ** = 7 chỗ: `toolSpec.ts`, `ToolModal.tsx`, `ToolsPanel.tsx`, `MoreToolModals.tsx`, `toolImages.ts` (`TOOL_DOC_IMAGE`), `DocSelectionAi.tsx` (`TOOL_NAME`), `docRewrite.ts` (`FIGURE_GUIDE` + `toolFromRaw`, để AI dùng được).

## Bẫy hay gặp (chi tiết: docs/bai-hoc-va-loi.md)

- Code có `\` (regex) → viết bằng Write/Edit; heredoc bash/Python dễ nuốt `\`.
- File CRLF: đổi `\r\n` → `\n` trước khi so chuỗi, ghi lại đúng kiểu xuống dòng.
- `tsx` chạy file lẻ không hiểu alias `@/` → thử logic trong trình duyệt: `await import('/src/lib/x.ts')`.
- Bấm trong trình duyệt theo ref của `find`, không theo toạ độ; khung trình duyệt hẹp thì thanh bên bị ẩn (resize 1366×768).
- Căn lề câu hỏi lưu ở nút `examQuestion`, không phải `examQuestionPrompt`.
- Sau khi chạy Strix (Docker Linux) phải `npm install` lại, nếu không dev server thiếu `@rollup/rollup-win32-x64-msvc`. Regex với chữ có dấu không dùng ``.
- Import trong `server/`, `api/` phải có đuôi `.js` (Vercel ESM). Vercel: dùng CLI (`npx --no-install vercel …`), MCP không có quyền team; không `vercel deploy` từ máy (quá nhiều file).

## Đọc thêm khi nào

| Khi làm | Mở |
|---|---|
| Tiếp việc phiên trước | [phiên 24](docs/handoff/phien-24.md) (kiểm trig + 600 câu, khung chương trình, công cụ ghép nhóm) |
| Khung chương trình các môn (chống AI ra đề vượt lớp): soạn prompt cho agent ngoài, kiểm file gửi về | [docs/khung-chuong-trinh.md](docs/khung-chuong-trinh.md) |
| Soạn thêm câu cho kho câu hỏi | [scripts/bank/HUONG_DAN_SOAN.md](scripts/bank/HUONG_DAN_SOAN.md) |
| Model AI, nhà cung cấp, hạn mức token, chi phí | [phiên 22](docs/handoff/phien-22.md), mục "So sánh nhà cung cấp" |
| Chấm điểm server, giấu đáp án đề link, bảo mật API, env Vercel/Supabase | [phiên 21](docs/handoff/phien-21.md), mục "Cấu hình ngoài code" và "Đã làm" |
| Deploy / biến môi trường / bảo vệ API | [phiên 20](docs/handoff/phien-20.md), mục "Vercel" |
| Tìm phiên cũ theo chủ đề | [docs/handoff/README.md](docs/handoff/README.md) |
| Công cụ vẽ (quy ước SGK, thử nhanh) | [phiên 17](docs/handoff/phien-17.md) |
| Kiểm file Word thật (Word COM → PDF) | [phiên 18](docs/handoff/phien-18.md), mục "Cách kiểm tra file Word thật" |
| Icon / đồ hoạ slide | [phiên 14](docs/handoff/phien-14.md) "Quy trình tạo icon", [phiên 16](docs/handoff/phien-16.md) "Chèn / sửa icon" |
| Chọn việc mới | [docs/viec-con-lai.md](docs/viec-con-lai.md) |
| Không tìm thấy file | [docs/ban-do-file.md](docs/ban-do-file.md) |
| Bản quyền phần port từ GenOffice (`_ref/genoffice`, Apache-2.0) | [docs/ban-quyen.md](docs/ban-quyen.md) |
| Lịch sử các chặng cũ | [docs/history/muc-3-lich-su.md](docs/history/muc-3-lich-su.md) |
