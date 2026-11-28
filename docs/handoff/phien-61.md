# Phiên 61 (27–28/11/2026) — Morph & bảng Hiệu ứng, SenseNova chính hãng, giảm dung lượng function Vercel, sửa `new_deck`, chế độ Giữ nguyên chữ, vá bảo mật

Đã gộp `main` và push hết. Migration `20261225_ai_request_holds.sql` đã áp và kiểm trên Supabase thật.

## Việc đầu phiên sau

1. Thử trên bản chạy thật `dero.id.vn` (đăng nhập):
   - Chế độ **Giữ nguyên chữ** (nút icon `FileText` cạnh nút `🌐` trong `AiPanel`): dán chữ có `---`, đính kèm tệp Word/PDF, và bật kèm `Chuyên nghiệp`.
   - Bảng **Hiệu ứng** ở cột trái & chuyển trang **Morph** (nhân bản slide → dời/đổi cỡ phần tử → trình chiếu).
2. Ghi nhận tối ưu sau (nếu cần):
   - Tra log user thật (`rematah199.1@gmail.com`) thấy cùng 1 tệp 4 trang bị gọi `vision-source` OCR lại mỗi lần user gửi lại tin nhắn → có thể giữ lại text đã đọc để khỏi tốn điểm lặp.
   - Vercel *Functions Storage* (`10,08 / 10 GB`) tính gộp 15 project theo đỉnh ngày trong chu kỳ 30 ngày; `de-ro` đã dọn còn 3–4 bản, còn `eve-chat-template` (cũ 85 ngày) đang giữ `20+` deploy.

## Bảng Hiệu ứng kiểu Canva & chuyển trang Morph (`5b2871d` — Claude làm cuối phiên 60)

- Gộp 2 tab ribbon *Chuyển tiếp* và *Hoạt ảnh* thành tab **Hiệu ứng** (`SlideRibbon.tsx`), mở bảng **Hiệu ứng** ở cột trái (`SlideEffects.tsx`, `SlideSidePanel.tsx`): hiệu ứng cả trang (tự chạy / bấm từng phần), hiệu ứng từng đối tượng, chuyển trang, áp cho mọi trang, xoá trang này / cả bài.
- Đổi bộ màu, tông, bố cục giữ lại lựa chọn hiệu ứng đang có (`slideAnim.ts`, `slideEdit.ts`).
- **Morph** (`src/lib/slideMorph.ts`, `src/examEditor/SlideMorph.tsx`): phần tử giống slide trước trượt và đổi cỡ mượt tới vị trí mới khi trình chiếu; nhân bản slide giữ `id` phần tử để Morph ghép được. Test: `npm run test:slide-anim`.

## Tạo ảnh AI SenseNova chính hãng, bỏ Xkiro (`49357a2`)

- `server/imageProxy.ts` bỏ hẳn Xkiro (`xkiroFromZcode` và vòng poll job), đổi thứ tự mới: **SenseNova chính hãng** (`SENSENOVA_API_KEY`, `SENSENOVA_BASE_URL=https://token.sensenova.ai/v1`, `SENSENOVA_IMAGE_MODEL=sensenova-u1.6-lite`) → **Agnes** (`AGNES_*`) → **CogView-4** của Z.ai (`GLM_API_KEY`, `GLM_IMAGE_MODEL=cogview-4-250304`).
- Đo thật `1024x1024` trên `token.sensenova.ai`: `sensenova-u1.6-lite` nhanh nhất (**18,6 s** tạo / **22,6 s** tổng), `u1.5-fast` (21,7 s / 23,8 s), `u1.5-lite` (23,7 s / 27,1 s), `u1-fast` trả 404. Trên `dero.id.vn` bản thật đã chạy `image-pro` bằng `sensenova-u1.6-lite` ổn định (~20–27 s/ảnh).

## Giảm dung lượng Serverless Function Vercel ~75% (`fbbb12a`, gộp `5bab488`)

- Nguyên nhân function phình: `server/llmProxy.ts` chứa server chạy cục bộ đọc `dist/` và import `extract.ts` (kéo theo `pdfjs-dist` + `@napi-rs/canvas` ~35 MB) vào cả 4 function `llm`, `admin`, `image`, `figure-sprite`.
- Tách ra `server/appServer.ts` (server chạy cục bộ, Vercel không dùng) và `server/urlGuard.ts` (`assertPublicHttpsUrl`, `assertSafeEndpoint`). `llmProxy.ts` vẫn re-export để không vỡ script cũ. Ghi cảnh báo trong `docs/ban-do-file.md`.
- Kết quả: ước lượng 12 function giảm **199 MB → 52 MB**; thời gian build thật trên Vercel giảm từ **2 phút → 46 giây** (đóng gói 12 function từ ~90 s còn 17 s). Đã xoá 7 deploy cũ của `de-ro`.

## Sửa AI sửa slide phân biệt bài mới vs chèn trang (`d998857`, gộp `cb99a14`)

- Khắc phục 2 ca phản hồi thật (Huy Phạm 👎, Khanh Linh): đang mở bài cũ nhưng nhắn *"Tạo cho tôi thử slide về X"* (chủ đề khác hẳn) mà AI lại chèn 1 trang lạc đề (`add_slide`) thay vì lập dàn ý bài mới.
- Bổ sung luật **BÀI MỚI vs CHÈN SLIDE** trong `editSystemPrompt` (`src/lib/slideEdit.ts`), rebuild `server/generated/prompts.js`, cập nhật bản chụp `scripts/fixtures/prompt-slide-snap.json`. Đã test thật 5/5 trên `deepseek-flash`.

## Chế độ "Giữ nguyên chữ" cho slide (`4502b11`, gộp `9395407`)

- **Giao diện (`AiPanel.tsx`):** nút icon vuông nhỏ `FileText` (`Giữ nguyên chữ`, 28 px) ngay cạnh nút `🌐 Tìm trên web` khi `mode === 'slide'` (gọn 1 hàng trên panel 360 px). Tự tắt sau khi tạo xong bài để lượt sau sửa/hỏi không bị nhầm. Dùng chung được với `Tiêu chuẩn` / `Chuyên nghiệp`, `Đính kèm tệp` (DOCX/PDF/ảnh OCR) và `Thêm nguồn`.
- **Luồng (`src/lib/slidePreserve.ts`, `src/examEditor/ai/slideFlow.ts` `runSlidePreserve`, tác vụ `'slide-giu-chu'` trong `src/lib/prompts/slideTasks.ts`, `server/aiTasks.ts`, `server/ops.ts`):**
  - Tách văn bản gốc thành các đoạn đánh số `[1], [2]…` (hỗ trợ `---` tự ngắt slide).
  - 1 lượt AI duy nhất trả JSON ánh xạ ID đoạn vào bố cục (`ignoreIds` lọc riêng dòng lời dặn kiểu *"chia 2 cột giúp tôi"*; nếu chỉ hỏi đáp thường thì trả lời chữ bình thường, không dựng slide rác).
  - Code tự lắp **100% nguyên văn**, tự bù đoạn AI bỏ sót, tự tách trang khi tràn (> 6 mục / > 680 ký tự / đoạn > 460 ký tự), dựng thẳng slide không qua thẻ duyệt dàn ý.
- **Kiểm thử:** `npm run test:slide-preserve`, `test:ai-prompts-slide`, `test:slide-edit`, `test:server-imports`, `tsc`, test thật 6/6 ca trên `deepseek-flash` (1,4–5,1 s/lượt), và test trực tiếp trên trình duyệt `127.0.0.1:5184/soan-de`.

## Rà soát & vá bảo mật toàn dự án (trừ đề online — nhánh `codex/va-bao-mat-20261128`, đã gộp)

Rà soát mã nguồn chỉ-đọc bằng 3 subagent song song (Auth/Admin/RLS, API/Quota/PayOS/R2/Extract, Frontend XSS/Parsing), Codex vá toàn bộ nhóm High + các mục Medium trọng yếu và đã kiểm qua 8 bộ test + `tsc`:

- **Chống XSS SVG & khung In:** thêm `src/lib/svgAttribute.ts` + `src/lib/toolSvgDom.ts` (`parseToolSvg` chỉ giữ SVG tĩnh trước khi gắn DOM ở `LabelDragPreview.tsx` và `svgImport.ts`; thoát `"` ở `plot.ts`, `geometry.ts`, `oxy.ts`). Ở `exportBlocks.ts`: ép `b.level` (`1|2|3`), chặn biên `paper.w/h`, thoát `<`/`>` trong `bandCss`, thêm `<meta CSP script-src 'none'>` cho `printHtml`.
- **Chống replay biên nhận hoàn điểm & race condition điểm AI:** thêm migration `supabase/migrations/20261225_ai_request_holds.sql` (bảng `ai_request_holds` + 2 RPC nguyên tử `reserve_ai_request`, `finish_ai_request`, đã áp và kiểm trên Supabase: `service_role` chạy 200, `anon` bị chặn 401/42501); cập nhật `server/aiQuota.ts`, `llmProxy.ts`, `imageProxy.ts`, `sourceVision.ts`.
- **Chặn admin tự cộng điểm:** thêm `protectTarget` ở `payments.credit` (`server/adminPayments.ts`).
- **Chặn OOM native canvas & DoS DOCX (`/api/extract`):** kiểm kích thước header ảnh qua `image-size` (đưa từ `overrides` lên `dependencies`), đặt trần cạnh/pixel/số mảnh ghép, thay 2 regex bậc 2 bằng `mapXmlBlocks`, chặn biên `ilvl` (`0..8`) và `romanNum` (`1..3999`).
- **Chặn JWT cache quá hạn `exp`:** `server/guard.ts` kiểm `exp` trước khi đọc `tokenCache` và chặn `until` theo `exp`.
