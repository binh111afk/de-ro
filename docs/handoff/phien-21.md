# Phiên 21 (06/11/2026): vá bảo mật theo Strix (3 lượt), server chấm điểm + giấu đáp án đề link, thử tải, AI chia độ khó + chủ động chèn hình, công cụ đồ thị trạng thái khí và hình thực tế

## Cấu hình ngoài code (đã làm trên dashboard)

- **Supabase Auth:** Redirect URLs thêm `https://de-ro-lac.vercel.app/**`; Site URL = `https://de-ro-lac.vercel.app`.
- **Vercel env:** thêm `SUPABASE_SERVICE_ROLE_KEY` (Production) — bắt buộc cho `/api/attempt`, `/api/exam`. `LLM_MODEL` đổi `deepseek-v4.1-flash-free` → `deepseek-v4.1-flash` (bản `-free` bị opencode báo "Model is unavailable" → AI soạn đề 502). Biến tạo bằng CLI nên hiện "Hidden/Secret".
- **Supabase migration đã áp:** `attempt_server_grading` (bỏ policy insert `exam_attempts` cho anon/authenticated), `hide_link_exam_answers` (`get_shared_exam` chỉ trả đề `listed` hoặc của chính chủ). File trong `supabase/migrations/`.
- `.env` máy dev **chưa có** `SUPABASE_SERVICE_ROLE_KEY` → mở đề link / nộp bài ở localhost trả 503.

## Đã làm

| Commit | Nội dung |
|---|---|
| `f31e376` | **Strix lượt 1.** XSS in đề (`exportBlocks.ts`: `css()` lọc giá trị style, `escapeHtml` thoát nháy) và đồ hoạ slide (`slideGraphics.ts`: `safeColor`). `guard.ts`: IP lấy `x-vercel-forwarded-for` trên Vercel, socket ở máy; miễn hạn mức localhost chỉ khi không phải Vercel; POST thiếu Origin bị chặn trên Vercel; bỏ tin `X-Forwarded-Host`. `http.ts readBody` giới hạn 20 MB. `extract.ts assertSafeZip` (central directory). Log LLM ra `os.tmpdir()`, tắt trên Vercel |
| `58cd411` | **Server tự chấm.** `server/attempt.ts` + `api/attempt.ts`: tải đề bằng service role, `docToExam` + `scoreQuestion`, ghi `exam_attempts`. Client gửi đáp án, không gửi điểm. `docToExam.ts` import `./grading.js` (dùng chung với server); `tsconfig.node.json` có alias `@/` |
| `9bce14f` | **Strix lượt 2.** `extract.ts`: bỏ regex `[\s\S]*?` (bình phương) → `xmlBlocks`/`mapXmlBlocks`/`openTag`/`attr` quét indexOf; `assertSaneDocxXml` chặn độ lồng thẻ > 200 trước mammoth (1 KB từng treo 21 s). katex 0.19.1; `overrides` image-size ^2.0.4, uuid ^11.1.1 (`npm audit` 0) |
| `5b98ca7` | **Giấu đáp án đề link.** `server/exam.ts` + `api/exam.ts`: đề `listed` trả nguyên; đề link trả `online` đã bỏ đáp án. `OnlineOpen` dùng `getStudentDoc`. Nộp xong `/api/attempt` trả `{score, max, key}`, store `applyGrading` gắn vào đề + kết quả |
| `127ace3` | **Sửa chấm luôn 0.** `importExam` đổi id câu → server không khớp. `Question.srcId` lưu id gốc; nộp/nhận đáp án theo `srcId`; bản nhập cũ thiếu `srcId` thì nhập lại. Không có học sinh thật bị ảnh hưởng (đã kiểm bảng) |
| `92b871b` | Hạn mức theo IP: `attempt` 500, `exam` 1000 / 10 phút (cả lớp chung một IP) |
| `5d00f8d` | `server/examCache.ts`: nhớ `doc` đề 60 s/instance, request cùng lúc dùng chung một Promise |
| `e72b9a5` | **Strix lượt 3.** `/api/exam` dùng allowlist trường câu (id, number, type, prompt, align, image, options, points) — `solution` tự luận không lọt; đề bật `instantFeedback` giữ nguyên đáp án. `/api/attempt`: đề link làm nhiều lần chỉ trả đáp án câu đúng trọn; đề `oneAttempt` bắt buộc `deviceId` và chặn nộp lại. Zip: giải nén thật từng mục với `maxOutputLength` = kích thước khai báo + 1 (khai gian → từ chối). `math.ts inlineImage` không `!` → cú pháp `|độ rộng` sai không sập trang |
| `b9bd5f7` | **Prompt soạn đề** (`AiPanel.tsx`): ma trận NB 40 / TH 30 / VD 20 / VDC 10 (12 câu: 5-4-2-1), xếp dễ → khó, tự luận ý a TH ý b VD; môn tự nhiên 25–35% câu có `figure`, ví dụ câu có figure; phương án nhiễu theo lỗi sai thường gặp. Thử Toán 12: 1 hình → 4 hình |
| `4337ec3` | **Công cụ đồ thị trạng thái khí** (`src/lib/gas.ts`, kind `gas`, tab Vật lí): trục p–V / p–T / V–T; trạng thái `1: (V; p)`; quá trình `1-2: đẳng nhiệt|đẳng tích|đẳng áp|thẳng` tự vẽ đúng (hypebol, đoạn qua O), mũi tên, gióng, nhãn số hoặc p₁ V₁ T₁, kéo về O; **báo lỗi khi số liệu không khớp quá trình**. `GasModal`, `FIGURE_GUIDE` mục 15b |
| `e609935`, `0dadc91` | **Hình thực tế nét đơn** (`src/lib/scene.ts`, kind `scene`): điểm, đoạn, đa giác, `đứt`, `kích thước AB "15 cm"`, `góc ABC "60°"`, `vuông ABC`, `nhãn AB "?"`, `đất`/`tường`; điểm `_X` ẩn tên, nối bằng gạch `_G-_K`. **Đã ẩn khỏi ô Công cụ** theo yêu cầu; AI vẫn dùng (`FIGURE_GUIDE` 5b), nhấp đúp ảnh vẫn mở `SceneModal` |

## Kiểm tra

- Bản Vercel: nộp bài qua giao diện → điểm server khớp, xem lại hiện đáp án; ghi thẳng `exam_attempts` bằng publishable key → 401; đề link không còn `answer`/`solution`; nộp bài trống → `key: {}`; file Word độc hại bị từ chối ~1 s; đọc docx/pptx/xlsx mẫu < 1 s; `/api/llm` sau khi đổi model trả lời bình thường.
- Thử tải bản Vercel (từ một máy, bắn cùng lúc): 300/300 thành công. Nộp bài trung vị 21 s → 12 s sau cache đề; mở đề 3–5 s; trang chủ < 1 s. Bài giả `LOADTEST-*` đã xoá.
- Regression `extract`: 18 file docx/pptx mẫu cho kết quả giống hệt bản cũ.
- Máy dev: AI soạn đề Toán 12 (4 hình, có VD/VDC), Vật lí 12 khí (3 hình `gas`, đáp án khớp), Toán 9 thực tế (4 hình `scene`, toạ độ đúng tỉ lệ).
- Mọi bài thử `KIEM-TRA-CLAUDE` / `LOADTEST` đã xoá khỏi `exam_attempts`.

## Lưu ý kỹ thuật

- **Strix chạy trong Docker Linux** và cài lại `node_modules` → mất `@rollup/rollup-win32-x64-msvc`, dev server tắt ngay. Sửa: `npm install` (hoặc `npm i --no-save @rollup/rollup-win32-x64-msvc@<bản rollup>`).
- Regex với chữ có dấu: **không dùng `\b`** (JS coi "t" trong "tích" là một từ) — đã dính ở `gas.ts`.
- Script Python sửa file trên Windows: dùng `io.open(..., encoding='utf8', newline='')`, chuỗi `r'...'`; heredoc bash + `\n` trong Python dễ làm hỏng chuỗi TS.

## Còn lại

1. **Bật Leaked Password Protection** trong Supabase Auth (từ phiên 20).
2. Chưa thử trên bản Vercel: soạn trọn một đề bằng AI, in đề / xuất Word, lấy đề cộng đồng, báo cáo bài làm (cần tài khoản giáo viên), hai công cụ mới.
3. Thông tin học sinh (tên, lớp, số thứ tự, thời gian) vẫn do trình duyệt gửi → muốn chặn mạo danh phải bắt học sinh đăng nhập.
4. Đề làm nhiều lần: vẫn dò được đáp án trắc nghiệm bằng nộp lại (≤4 lần/câu); muốn kín thì bật "chỉ làm một lần". Danh sách lớp (`roster`) vẫn gửi kèm đề link.
5. Hạn mức vẫn đếm trong bộ nhớ từng instance (Upstash / bảng Supabase nếu cần chặt).
6. RLS các bảng khác (`community_exams`, `user_documents`) chưa nằm trong `supabase/migrations/`.
7. `gas`: chưa có trục °C (vạch −273); nhãn "(a)" đôi khi sát đường. `scene`: chưa có hình đồ vật (cây, người…, chỉ cần cho THCS); AI hay dùng `nhãn` thay `kích thước`; hướng dẫn "phóng to đoạn quá ngắn" chưa chạy lại kiểm.
8. Prompt: bài thực tế đã mô hình hoá bằng công thức (đề THPT kiểu mới) không cần ép có hình — có thể thêm một câu vào prompt.
9. Đề THPT 2025+ (xem trên mapstudy.edu.vn): hình đồ thị Vật lí/Hoá thường có điểm + gióng nét đứt — `motion`/`chemgraph` đã có gióng, nên rà thêm.
