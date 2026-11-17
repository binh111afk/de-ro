# context.md — đề rõ (trình soạn đề thi)

> Luật làm việc chung cho mọi AI: **[AGENTS.md](AGENTS.md) — đọc trước file này.**

Bản đồ ngắn của dự án. **Chỉ đọc file này khi bắt đầu phiên**; các file khác mở khi việc đang làm cần tới (bảng "Đọc thêm khi nào" bên dưới). Cập nhật: 16/11/2026 (phiên 45). Đọc [phiên 45](docs/handoff/phien-45.md), [phiên 44](docs/handoff/phien-44.md) và [phiên 43](docs/handoff/phien-43.md) — mục "Việc còn treo". **Không thêm chữ thừa trên UI** (dòng phụ, hướng dẫn hiển nhiên, giọng khẩu hiệu). **Người dùng dặn: chưa tự đề xuất tính năng mới cho soạn thảo, người dùng sẽ tự quyết.** Phiên 43: vá hết Strix lần 3–5 (đề một lần bắt đăng nhập + khoá nguyên tử, đề giấu đáp án chỉ báo "đã nộp" trừ khi giáo viên bật `showScore`, JWT kiểm chữ ký ES256 tại server, tài khoản bị khoá chặn ở mọi API và ở tầng DB, hạn mức lưu trữ nguyên tử theo dung lượng thật); hàm Vercel chạy ở `sin1` cạnh Supabase; trang 404. Migration đến `20261130` đã áp (Strix 6). Repo chỉ còn nhánh `main`. **Strix phải chạy chế độ chỉ đọc** (lượt 4 từng cài `node_modules` Linux). **Nhiều file CRLF — đừng sửa bằng `sed -i`/Python ghi text thường; kiểm `git ls-files --eol` + `git diff --stat`.** Tooltip dùng `data-tip` (không `title=`). Test admin dùng token dạng JWT giả `h.<tên>.s`. Vercel còn treo: `ANYROUTER_API_KEY`, `AI_SETTINGS_SECRET`; nên xoá `MERCURY_*`. Người dùng còn phải tắt r2.dev của bucket R2.

## Dự án

Web app soạn đề thi tiếng Việt kiểu Word: React 19 + TypeScript + Vite 6 + Tailwind v4 + TipTap 3. Thư mục `C:\Users\Lenovo\Desktop\workspace\dethinhbien`, nhánh `main`, remote `binh111afk/de-ro`.

- `/soan-de`: trình soạn chính (tab Bắt đầu tạo đề / slide / bảng vẽ). Soạn đề: AI bên **phải**; Mục lục / Khối mẫu / Công cụ bên **trái**. Soạn slide: AI bên phải.
- Màn khác: Đề cộng đồng, Tạo đề online (lịch sử, đề đã xuất bản, kết quả), Đề của tôi, Thư viện, Chấm điểm, Quiz.
- Tài khoản Supabase (`user_items`, `community_exams`, `exam_attempts`, `ai_usage`), file trên R2.
- AI: `server/llmProxy.ts` thử opencode (`LLM_*`) → DeepSeek chính hãng `deepseek-flash` (`DEEPSEEK_*`, có cache prompt — phần trúng cache tính 1/10 điểm; hiện chỉ có key ở máy dev) → FOSTA gpt-6-luna (`FOSTA_*`) → AnyRouter gpt-6.1-terra (`ANYROUTER_*`, gọi stream) → NightRouter deepseek-v4-flash-0731 (`NIGHTROUTER_*`) → Claude (`ANTHROPIC_*`); mỗi model chờ tối đa 250 s. Mức suy luận theo việc: `AI_EFFORT` trong `AiPanel.tsx` (đề + slide = low). So sánh model: `npm run compare:llm`; đo token/chất lượng: `npm run eval:exam`, `npm run eval:slides -- … --batch --effort low` (thêm `EVAL_MODEL=<model>` để đo model dự phòng), thí nghiệm có giám khảo chấm câu sai: `node scripts/exp-exam-cost.mjs` (giám khảo flash mức max, **không dùng deepseek-v4-pro**). **Chỉ người đăng nhập dùng AI** (khách 401). Điểm AI `server/aiQuota.ts`: tặng một lần `AI_WELCOME_POINTS` (120) điểm vào `ai_credits`, 1 điểm = 1.000 token, hạn mức tháng mặc định 0, ngoại lệ ở `ai_quota_overrides`; kết quả hỏng được hoàn điểm qua biên nhận (`x-ai-retry-of`, bảng `ai_refunds`). Log từng lượt gọi: bảng `ai_calls`.
- Chạy thật: Vercel https://de-ro-lac.vercel.app, push `main` là tự deploy. `api/*.ts` chỉ re-export handler `server/`; `server/guard.ts` chặn Origin lạ + giới hạn lượt.

## Nguyên tắc không được phá

1. `ExamBlock` (`src/data/docTypes.ts`) là mô hình lưu bền vững; AI, thư viện, xuất Word, in đều đi qua nó. TipTap chỉ là lớp trình bày.
2. Một editor TipTap liên tục; trang A4 chỉ là nền vẽ phía sau (`zoom` CSS, không `transform`).
3. Key LLM ở server, gọi qua proxy `/api/llm`; không đưa key vào bundle. Client gọi API bằng `apiFetch` (gắn token đăng nhập).
4. Giao diện tiếng Việt, bám Word / GenOffice.
5. KHÔNG ghi đường dẫn tuyệt đối ra ngoài dự án (`C:/Users/.../Downloads/...`, worktree, scratchpad) vào code hay script. Người dùng gửi file từ Downloads thì chép vào dự án trước (icon: `scripts/nguon-icon/`, khung chương trình: `scripts/khung/ban-goc/`), rồi đọc bằng đường dẫn tương đối (`new URL('./…', import.meta.url)`).

## Lệnh

```powershell
npm run dev -- --port 5184 --host 127.0.0.1     # http://127.0.0.1:5184/soan-de (hoặc preview_start "dev")
npx tsc -p tsconfig.app.json --noEmit           # KHÔNG dùng `tsc -p .` (không kiểm gì)
npm run test:convert | test:export | test:docx | test:online | test:grading | test:markdown | test:guard | test:admin | test:admin-content | test:admin-bank | test:admin-stats   # bộ hay dùng
```

Danh sách đủ: `package.json` → `scripts`. `.env` cần `LLM_API_KEY` (mẫu `.env.example`).

## Bản đồ nhanh

| Vùng | File chính |
|---|---|
| Trình soạn đề | `src/pages/ComposeDoc.tsx`, `src/examEditor/` (schema, convert ExamBlock↔TipTap, Ribbon + `RibbonAdaptive.tsx` (ribbon điện thoại/bảng), FileMenu, AiPanel, DocSelectionAi) |
| Nhập Word | `src/lib/docxImport.ts` (OOXML → ExamBlock trên trình duyệt), `src/lib/ommlLatex.ts` (công thức Word → LaTeX) |
| Xuất Word | `src/examEditor/docxBlocks.ts` (phương án A–D xếp bằng tab stop), test `scripts/test-docx.ts` |
| Đề tương tác | `src/lib/docToExam.ts`, `src/lib/math.ts` (renderMath: `$…$`, `**đậm**`, ảnh `![alt\|rộng%](src)`) |
| Công cụ vẽ | `src/lib/toolSpec.ts` (ToolDoc + renderTool), `src/examEditor/tools/` (ToolsPanel = SUBJECTS, ToolModal, MoreToolModals), `src/examEditor/toolImages.ts` (ảnh công cụ trong đề, đổi PNG). Thư viện vẽ: `plot, varTable, geometry, signTable, oxy, stats, mathExtra` (Toán), `circuit, physics` (Lý), `chem` (Hoá), `objects` (tranh đếm, đồng hồ; kho hình `figureSprites.ts`, danh mục sinh tự động `objectsCatalog.ts`, script `scripts/figure-sprites/`). AI dùng qua `FIGURE_GUIDE` + `toolFromRaw` (`src/lib/docRewrite.ts`) |
| Bảng đáp án | `src/lib/answerKey.ts` (chia theo dạng câu, dùng cho trình soạn + Word) |
| Khung chương trình | `src/data/khungToan.json` (Toán 6–12 GDPT 2018); `src/lib/khungPrompt.ts` đoán lớp/chương/học kỳ từ yêu cầu, cắt phần cần rồi chèn vào prompt soạn đề Toán (`AiPanel.tsx`), test `scripts/check-khung.ts` |
| Kho câu hỏi | `src/data/bank.ts` + `bankThpt.ts`/`bankThpt2.ts` (nạp lười), độ khó `bankLevel.ts`, câu có hình `src/data/bankFigures.ts` (field `figure`), `src/examEditor/BankModal.tsx` |
| Slide | `src/examEditor/SlideEditor.tsx`, `SlideRibbon.tsx`, `SlideSidePanel.tsx` (panel trái, Mẫu › Bố cục / Bộ màu), `slideRender.tsx` (vẽ chung soạn/thumbnail/chiếu), `slide.css`, `useSlideViewport.ts`; bộ màu `src/lib/slideDesigns.ts` + `slideSkins.ts` + `slideTheme.ts`, áp bằng `applyDeckDesign` (`slideEdit.ts`, chỉ đổi kiểu); hiệu ứng `src/lib/slideAnim.ts`; định dạng chữ / link / chân trang `src/lib/slideFormat.ts`; AI slide `src/lib/slideAi.ts` (gộp 4 slide / lần); đồ hoạ `src/lib/graphics.ts` là file **sinh tự động** |
| Bảng vẽ | `src/board/` (`BoardEditor.tsx` giao diện + thao tác + lệnh vẽ của AI, `render.ts`, `scene.ts`, `recognize.ts` nắn hình, `regionFill.ts` thùng sơn theo vùng kín, `io.ts` nhập/xuất PNG-PDF, `formula.ts`, `imgStore.ts` ảnh IndexedDB ↔ R2); danh sách + nội dung ở `src/store/boards.ts`, đồng bộ `user_items` kind `board` |
| Lưu trữ / giới hạn | `src/lib/sync.ts` (đồng bộ `user_items`), `src/lib/documents.ts` (tài liệu tải lên), trigger quota trong migration `20261119`/`20261120`, Hồ sơ `src/pages/Profile.tsx` |
| Tải trang an toàn sau deploy | `src/lib/lazyPage.ts`, `src/components/PageErrorBoundary.tsx` |
| "Đưa vào chat" (đính kèm phần đang chọn vào AiPanel) | `src/lib/aiAttach.ts`, `AiPanel` prop `attachKey` (khoá `exam` / `slide` / `board-<id>`) |
| Danh sách có phân trang | `src/components/Pager.tsx` |

**Thêm một công cụ vẽ** = 7 chỗ: `toolSpec.ts`, `ToolModal.tsx`, `ToolsPanel.tsx`, `MoreToolModals.tsx`, `toolImages.ts` (`TOOL_DOC_IMAGE`), `DocSelectionAi.tsx` (`TOOL_NAME`), `docRewrite.ts` (`FIGURE_GUIDE` + `toolFromRaw`, để AI dùng được).

## Bẫy hay gặp (chi tiết: docs/bai-hoc-va-loi.md)

- Code có `\` (regex) → viết bằng Write/Edit; heredoc bash/Python dễ nuốt `\`.
- File CRLF: đổi `\r\n` → `\n` trước khi so chuỗi, ghi lại đúng kiểu xuống dòng.
- `tsx` chạy file lẻ không hiểu alias `@/` → thử logic trong trình duyệt: `await import('/src/lib/x.ts')`.
- Bấm trong trình duyệt theo ref của `find`, không theo toạ độ; khung trình duyệt hẹp thì thanh bên bị ẩn (resize 1366×768).
- Căn lề câu hỏi lưu ở nút `examQuestion`, không phải `examQuestionPrompt`.
- Sau khi chạy Strix (Docker Linux) phải `npm install` lại (tắt dev server trước, không thì EBUSY làm mất `package.json` của gói native rollup/lightningcss/tailwind oxide), nếu không dev server thiếu `@rollup/rollup-win32-x64-msvc`. Regex với chữ có dấu không dùng ``.
- Import trong `server/`, `api/` phải có đuôi `.js` (Vercel ESM). Vercel: dùng CLI (`npx --no-install vercel …`), MCP không có quyền team; không `vercel deploy` từ máy (quá nhiều file).

## Đọc thêm khi nào

| Khi làm | Mở |
|---|---|
| Trang Admin (bản đồ file, quyết định, việc còn lại) | [phiên 29](docs/handoff/phien-29.md), kế hoạch gốc [docs/plan-admin.md](docs/plan-admin.md) |
| Tiếp việc phiên trước | [phiên 45](docs/handoff/phien-45.md) (panel AI hỏi lại, nhập Word giữ định dạng + công thức, vectơ, thước, mục lục tự động, Tìm trên web qua DeepSeek, chi phí AI đo lại) · [phiên 44](docs/handoff/phien-44.md) (tranh đếm, đồng hồ, hình vật, kho hình dùng chung, admin điểm AI) · [phiên 43](docs/handoff/phien-43.md) (vá Strix 3–5, Vercel sin1, trang 404, lưu ý chạy Strix chỉ đọc + worktree khi agy làm song song) · [phiên 42](docs/handoff/phien-42.md) (số trang, vá Strix 1–2 + hướng sửa Strix lần 3, DeepSeek chính hãng, giảm chi phí AI) · [phiên 41](docs/handoff/phien-41.md) (đăng nhập Google, SEO, tải sau phần nặng, /api/quota, vá Strix, thanh Tìm) · [phiên 40](docs/handoff/phien-40.md) (trình chiếu, nhóm/khoá, video + ảnh slide, hoạt ảnh chạy thử, lịch sử điểm AI, lề trang soạn đề, dero.id.vn) · [phiên 39](docs/handoff/phien-39.md) (bộ màu slide, gộp slide AI, hoàn điểm, điểm AI tặng một lần, mức suy luận low, ribbon slide, hoạt hình từng đối tượng) · [phiên 38](docs/handoff/phien-38.md) (tên miền dero.id.vn chưa chạy, Thêm nguồn cho AI, sắp xếp lại ribbon soạn đề + slide, tác giả đề cộng đồng, sửa vặt bảng vẽ) · [phiên 37](docs/handoff/phien-37.md) (dụng cụ hình học, ghi chú PDF, tách file lớn, sửa lỗi Android, landing mới) · [phiên 36](docs/handoff/phien-36.md) (công cụ vẽ = phần tử gốc, thanh nổi, căn chỉnh, đường gióng, khoá hình, tooltip dùng chung) · [phiên 35](docs/handoff/phien-35.md) (3 công cụ agy, tô màu + thùng sơn vùng kín, responsive 3 trình soạn, kiểm thử bảng vẽ) · [phiên 34](docs/handoff/phien-34.md) (giao agy nhóm ưu tiên vừa, AnyRouter, 6 công cụ mới, gộp nhiều nhánh) · [phiên 33](docs/handoff/phien-33.md) (review agy chỉnh cạnh 3D, công cụ vẽ mới, Đề của tôi, quy trình giao/gộp agy) · [phiên 32](docs/handoff/phien-32.md) (bảng vẽ, đề thiếu đáp án, giới hạn lưu trữ) · [phiên 31](docs/handoff/phien-31.md) (Bảng vẽ, AI vẽ, Đưa vào chat) · [phiên 30](docs/handoff/phien-30.md) (cấu hình AI admin, AI ngân hàng) · [phiên 29](docs/handoff/phien-29.md) (Admin G1-5, tự khoá, pentest) · [phiên 28](docs/handoff/phien-28.md) (Xáo đề giữ đáp án) · [phiên 27](docs/handoff/phien-27.md) (Xáo đề, mẫu slide, LLM dự phòng, so model) · [phiên 26](docs/handoff/phien-26.md) (gộp 3 nhánh agent) · [phiên 25](docs/handoff/phien-25.md) (khung chương trình, trục đồ thị) |
| Khung chương trình các môn (chống AI ra đề vượt lớp): soạn prompt cho agent ngoài, kiểm file gửi về | [docs/khung-chuong-trinh.md](docs/khung-chuong-trinh.md) |
| Giao việc cho agent rẻ hơn (mẫu prompt, chạy song song bằng worktree) | `docs/prompt-*.md`, [phiên 26](docs/handoff/phien-26.md) mục "Lưu ý cách làm" |
| Soạn thêm câu cho kho câu hỏi | [scripts/bank/HUONG_DAN_SOAN.md](scripts/bank/HUONG_DAN_SOAN.md) |
| Model AI, nhà cung cấp, hạn mức token, chi phí | [báo cáo chi phí AI](docs/bao-cao-chi-phi-ai.md) (token/điểm mỗi đề và slide, cache, các cách đã thử) · [phiên 42](docs/handoff/phien-42.md) · [phiên 39](docs/handoff/phien-39.md) (đo token theo mức suy luận, điểm AI, hoàn điểm) · [phiên 22](docs/handoff/phien-22.md), mục "So sánh nhà cung cấp" · [phiên 27](docs/handoff/phien-27.md) (FOSTA, NightRouter, qwen) |
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
