# Phiên 20 (05/11/2026): mượt hơn, AI gọi công cụ vẽ, kho câu hỏi có hình, bảng đáp án theo dạng, deploy Vercel, chặn lạm dụng API

## Đã làm

| Commit | Nội dung |
|---|---|
| `bb36276` | **Mượt hơn khi chuyển trang.** `App.tsx`: tải ngầm mọi trang lazy khi trình duyệt rảnh (`usePrefetchPages`); hiệu ứng vào trang `.page-enter` (mờ + trượt 8px, 260ms, `fill: backwards` để xong không còn `transform` đè `zoom`/`position: fixed`). `ComposeDoc.tsx`: tải sẵn `SlideEditor` sau 0,8s + khung giữ chỗ `SlideEditorSkeleton` thay chữ "Đang tải…" |
| `4d789ef` | **AI soạn đề tự gọi công cụ vẽ.** Prompt soạn đề (`AiPanel.tsx`) cho phép field `figure` trên khối question/essay/paragraph; `FIGURE_GUIDE` + `toolFromRaw()` trong `src/lib/docRewrite.ts` chuyển cấu hình chữ → `ToolDoc` cho **cả 17 công cụ** (trước chỉ 5). `ComposeDoc.expandFigures` chèn đoạn ảnh căn giữa ngay **dưới** khối (sau A–D), ảnh SVG tạm rồi `pngifyToolImages` đổi PNG. "Vẽ hình minh hoạ" khi bôi đen cũng dùng chung → 17 loại |
| `f38b6bb` | **Kho câu hỏi có hình.** `BankEntry.figure?` (cấu hình chữ, không lưu ảnh); 10 câu mẫu `src/data/bankFigures.ts` (bảng biến thiên, đồ thị, xét dấu, Oxy, tam giác vuông, chóp, biểu đồ cột, đường tròn LG, Ven, mạch điện). `BankModal`: nhãn "Có hình", hình nhỏ 72px (vẽ khi cuộn tới), hình cỡ thật giữa đề và A–D. Chèn: `bankQuestions.ts` thêm đoạn ảnh dưới câu. Dùng chung `src/examEditor/toolImages.ts` (`TOOL_DOC_IMAGE`, `figureDoc`, `figureImageAttrs`, `figureParagraph`, `pngifyToolImages`). `pickQuestions` **bỏ câu có hình** (màn ngoài trình soạn chưa vẽ hình) |
| `57646f9` | **Bảng đáp án theo dạng câu.** `src/lib/answerKey.ts` (`groupAnswers`, `gridRows`, `tfParts`): A–D và trả lời ngắn = lưới Câu/Đáp án ≤10 cột, hàng cuối đủ ô; đúng/sai = mỗi câu một hàng, cột a) b) c) d). Nhiều dạng thì có nhãn nghiêng đậm. Schema `examAnswerKey` thành `(paragraph | table)+`; `answerKeyItems` đọc nhiều bảng (bảng Đ/S nhận theo hàng đầu `a)`). CSS cột đều (`table-layout: fixed`, cột nhãn 5.5em). Word (`docxBlocks.ts`) cùng bố cục |
| `51594a1`, `6ae31fe`, `ecd6e56` | **Deploy Vercel.** `api/*.ts` (llm, extract, search, image, upload, files) chỉ re-export handler trong `server/`; `vercel.json`: SPA rewrite, `/api/files/:key*` → `/api/files?key=`, `maxDuration` llm 300 / image 120 / extract 60. Import trong `server/` và `api/` **phải có đuôi `.js`** (ESM trên Vercel; lỗi `ERR_MODULE_NOT_FOUND` nếu thiếu) |
| `1d91af3` | **Chặn lạm dụng API.** `server/guard.ts` chạy đầu mọi handler (trừ `/api/files` GET): Origin lạ → 403; hạn mức 10 phút khách/IP vs người đăng nhập (llm 20/300, image 3/40, upload 20/300, extract 20/200, search 20/200) → 429 lời tiếng Việt; localhost không giới hạn. Token Supabase xác minh qua `/auth/v1/user`, nhớ 5 phút. Client: `src/lib/apiFetch.ts` gắn `Authorization` (thay `fetch` ở llm, documents, imageGen, mediaStore, sources). Test `npm run test:guard` |

## Vercel

- Dự án `de-ro` (team `afkbinh1412007-7646s-projects`, `prj_mFoXGQrrbQWB1SuBZNIhhQAY284M`), nối GitHub `binh111afk/de-ro`: **push `main` là tự deploy production**. Link: https://de-ro-lac.vercel.app
- MCP Vercel trong phiên **không có quyền team** (403) → dùng **Vercel CLI** đã đăng nhập trên máy: `npx --no-install vercel ls de-ro`, `vercel inspect <url> --wait`, `vercel logs <url> --no-follow --since 10m`, `vercel env ls`.
- `vercel deploy` từ máy **không dùng được** (>15000 file vì `_ref/`, `node_modules`) → luôn deploy qua git push.
- Biến môi trường do người dùng tự nhập (Claude không nhập key). Đã có: `LLM_*`, `R2_*`, `VITE_SUPABASE_*` (+ `CLOUDFLARE_*` thừa, nên xoá). Chưa có: `XKIRO_API_KEY`, `IMAGE_API_KEY` (máy local đọc từ `~/.zcode`, Vercel thì không), `TAVILY_API_KEY`. Tuỳ chọn `ALLOWED_ORIGINS` cho tên miền khác gọi API.
- Đã kiểm bundle thật: không lộ biến bí mật, `.map` 403, `/.env` trả về index.html. Supabase advisors: không thiếu RLS; 2 cảnh báo hàm security definer (`exam_gate`, `get_shared_exam`) là cố ý.

## Kiểm tra

- `tsc` app + node sạch; `test:convert` 13/13, `test:docx`, `test:export` 7/7, `test:guard` 6/6.
- Trình duyệt: AI soạn đề thật chèn 3 hình (BBT, đồ thị, chóp) đều thành PNG; kho câu hỏi hiện hình + chèn 2 câu thành PNG; bảng đáp án 22 câu 3 dạng round-trip đủ; bản Vercel: trang, AI, R2, upload, Origin 403, 429 sau 20 lượt.

## Còn lại

1. **Supabase Redirect URLs** chưa thêm `https://de-ro-lac.vercel.app/**` (người dùng làm) → chưa thử đăng nhập trên bản thật, chưa thử hạn mức người đăng nhập.
2. Bật Leaked Password Protection trong Supabase Auth.
3. Hạn mức đếm trong bộ nhớ từng instance → lỏng hơn số danh nghĩa; muốn chặt thì Upstash Redis / bảng Supabase.
4. Hình AI / kho chèn **sau** A–D; có thể đưa lên giữa đề bài và phương án (prompt không có hardBreak, ảnh là node inline).
5. Kho câu hỏi: câu có hình nằm cuối kho (ngoài 120 câu đầu) → nên thêm lọc "Chỉ câu có hình" hoặc đưa lên đầu.
6. Bảng đáp án: chưa mở file Word thật; bảng Đ/S đang rộng hết trang (có thể thu nửa trang).
7. Màn ngoài trình soạn (ExamView, Quiz, đề ghép tự động) chưa vẽ `figure` của kho.
8. Lời gọi `/api/llm` với `maxTokens` nhỏ (50) + model reasoning trả lỗi "các model đều không phản hồi" — không ảnh hưởng app (mặc định 32000) nhưng nên để ý.
