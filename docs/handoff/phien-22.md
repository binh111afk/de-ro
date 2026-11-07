# Phiên 22 (06–07/11/2026): hình câu trắc nghiệm trước A–D, chuỗi model dự phòng (Mercury 3, Agnes), hạn mức token AI theo tài khoản, so sánh nhà cung cấp AI

## Cấu hình ngoài code

- **Supabase (đã áp):** `ai_usage_quota` (bảng `ai_usage` + hàm `add_ai_usage`, chỉ service role gọi), `ai_quota_overrides` (ngoại lệ hạn mức; RLS bật, không policy). Tài khoản chủ app (`afkbinh1412007@gmail.com`) đã có dòng `monthly_tokens = null` = không giới hạn.
- **`.env` máy dev:** có `MERCURY_API_KEY` (Inception), `MERCURY_MODEL=mercury-3`; `AGNES_API_KEY` **đang tắt** (dòng chú thích); các dòng `KIRA_*` đã xoá.
- **Vercel: chưa có `MERCURY_API_KEY`** → bản thật chưa có dự phòng Mercury (opencode lỗi là báo lỗi). `SUPABASE_SERVICE_ROLE_KEY` có sẵn nên hạn mức chạy.
- Tuỳ chọn: `AI_MONTHLY_TOKENS` (mặc định 150 000), `AI_GUEST_DAILY_TOKENS` (mặc định 30 000).

## Đã làm

| Commit | Nội dung |
|---|---|
| `03829c5` | Prompt: bài thực tế đã mô hình hoá bằng công thức không ép có hình. `supabase/migrations/20261106c_rls_snapshot.sql` chụp RLS `community_exams`, `user_documents`, `user_items` (giống production) |
| `df0813a`, `edcb530` | **Hình câu trắc nghiệm nằm giữa đề bài và A–D, căn giữa.** AI soạn đề (`ComposeDoc.expandFigures`) và kho câu hỏi (`bankQuestions`) gắn ảnh vào cuối `text` câu hỏi thay vì đoạn riêng sau khối. CSS `compose.css` (bắt cả `img.ProseMirror-separator` đứng sau ảnh), in `.q > img:last-child`, Word `trailImage` trong `docxBlocks.ts`. Câu tự luận / đoạn văn giữ như cũ |
| `5d2fc4c` | **Chuỗi dự phòng LLM** (`server/llmProxy.ts`): danh sách `targets` (model, url, key, `opencode`, `noMaxTokens`); bỏ fallback mặc định `deepseek-v4.1-flash-free` (đã ngừng); `x-opencode-session` + `reasoning_effort` chỉ gửi opencode; **502 liệt kê lỗi từng model** (trước chỉ hiện lỗi cuối, che nguyên nhân thật); Agnes từ chối `max_tokens > 4096` → không gửi |
| `57bb0a2` | **Hạn mức token AI** (`server/aiQuota.ts`): tài khoản 150k/tháng (bảng `ai_usage`, cộng `usage.total_tokens` sau mỗi lần gọi), khách 30k/ngày theo IP (bộ nhớ), localhost không giới hạn; hết → 429 kèm thông báo; response có `quota`, khung Trợ lý AI hiện "x% tháng này". **Mercury 3** làm dự phòng đầu sau opencode (`MERCURY_*`) |
| `74c4bc7` | Bảng `ai_quota_overrides`: `monthly_tokens` null = không giới hạn, số = hạn mức riêng; server đọc trước khi kiểm hạn mức |
| (phiên này, cuối) | Gửi `model` trùng model dự phòng → thử model đó **trước tiên** (trước đó Mercury đứng trước nên "thử Agnes" thực ra ra Mercury) |

Thứ tự thử hiện tại: opencode (`LLM_MODEL` [+ `LLM_FALLBACK_MODEL`]) → Mercury → Agnes → xkiro; provider thiếu key bị bỏ qua.

## So sánh nhà cung cấp (đề Toán 12, prompt soạn đề thật của app)

Cách thử: chặn `fetch('/api/llm')` trong trình duyệt để lấy đúng body app gửi, gửi lại 5 lần song song với `model` ép sang model cần thử, đọc bằng `extractJson` của app, tự chấm từng câu.

| Model | Ra đề hợp lệ | Trắc nghiệm đúng | Thời gian | Ghi chú |
|---|---|---|---|---|
| **mercury-3** (Inception) | 5/5 | **56/60 (93%)** | 9–51 s | $0.10/$0.35 per 1M (giảm 50% dịp ra mắt; gốc $0.20/$0.70); 100 triệu token miễn phí; chỉ trả theo token |
| agnes-3.0-flash | 2/5 (thường), **1/5 (đề khó)** | ~62%; đề khó 4/12 | 18–85 s | JSON hỏng (đóng ngoặc sai); đề khó hay vô nghiệm / không có phương án đúng. **Không dùng cho đề Toán** |
| stealth/crouton-alpha (KiraAI) | 1/1 | 12/12 | 22 s | miễn phí có thời hạn; đã bỏ KiraAI |
| longcat-2.5-free (KiraAI) | quá 120 s | — | >120 s | chậm, 1 câu sai |
| deepseek-v4.1-flash (opencode, model chính) | ổn | — | vài phút | nhiều token suy nghĩ |

Gói tháng đã xem (không cái nào vừa < $5, vừa được dùng cho web, vừa chất lượng tốt): Agnes Agent Plan (Lite $2.99, được dùng cho web — bot hỗ trợ xác nhận; 1 Credit: 6 600 = $1, flash 330/990 Credits per 1M; RPM Lite 60), QwenCloud Token Plan (Lite $3, người VN cần mã số thuế, ghi "for interactive use in compatible AI tools"), Awan LLM ($5 nhưng chỉ Llama 3.1), Chutes (đã ngừng gói tháng), Cloudflare Workers AI (trả theo Neurons, đắt hơn ~2–3 lần).

Ước tính Mercury: ~20k token/đề → 100 triệu token ≈ 5 000 đề; 100 tài khoản dùng hết hạn mức 150k = 15 triệu/tháng → ~6,5 tháng; thực tế (30% dùng nhiều) ~16 tháng.

## Kiểm tra

- Hình trong đề: chèn câu bảng biến thiên vào trình soạn → hình nằm giữa đề bài và A–D, cách đều hai bên; docx sinh trong trình duyệt có thứ tự "Câu 1." → đoạn ảnh căn giữa → phương án. `test:convert` 13/13.
- Hạn mức: script giả lập Supabase 14/14 (cộng dồn, chặn khi vượt, tài khoản/IP độc lập, `AI_MONTHLY_TOKENS`, ngoại lệ null / số). Hàm `add_ai_usage` thử trực tiếp trên DB (1000 + 2500 = 3500), anon/authenticated không gọi được.
- Bản Vercel sau push: `/api/llm` khách trả `quota: {used, limit: 30000, scope: "day"}`.
- `test:docx` và `test:guard` (2/6 hỏng) lỗi **có sẵn từ trước**, không do phiên này (`test:docx` chạy ngoài Vite nên thiếu `import.meta.env`).

## Lưu ý kỹ thuật

- Dev server nạp `server/llmProxy.ts` và `.env` lúc khởi động → sửa server hoặc `.env` phải `preview_stop` + `preview_start`.
- Nút gửi trong Live Chat Agnes giới hạn 200 ký tự (gồm cả chữ cũ còn trong ô).
- Đọc key từ `~/.zcode/v2/provider_config.json` bị chặn (dò tìm thông tin đăng nhập) → nhờ người dùng dán key vào `.env`.
- Key xkiro trong cấu hình ZCode đang bị từ chối (403).

## Còn lại

1. **Thêm `MERCURY_API_KEY` vào env Vercel** rồi deploy lại.
2. Cân nhắc đưa **Mercury lên làm model chính** (nhanh, đúng 93%), opencode làm dự phòng: đổi thứ tự `targets` hoặc đặt `LLM_*` trỏ Inception.
3. Chưa kiểm trên bản thật: hạn mức tài khoản 150k và ngoại lệ chủ app (cần đăng nhập).
4. Khách (chưa đăng nhập) là kẽ hở: nhiều IP × 30k/ngày; nếu bị lạm dụng thì bắt đăng nhập mới dùng AI.
5. Xác nhận tài khoản Inception có 100 triệu token miễn phí (trang platform cần đăng nhập).
6. Giảm token mỗi đề: kiểm Mercury có cache prompt không; tách lời giải chi tiết ra lần gọi riêng.
7. Việc còn từ phiên 21: Leaked Password Protection (Supabase Auth), thông tin học sinh do trình duyệt gửi, dò đáp án đề làm nhiều lần, hạn mức lượt gọi vẫn đếm trong bộ nhớ, `gas` trục °C, `scene` đồ vật.
