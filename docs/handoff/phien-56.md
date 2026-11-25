# Phiên 56 (25/11/2026) — gỡ rối phần AI (nhánh `refactor/ai`), thêm GLM (trên `main`)

## Việc đầu phiên sau: thử với AI thật

Người dùng muốn bắt đầu phiên sau bằng việc **test với AI thật** (tốn tiền thật).

### Nhánh `refactor/ai` — đã push, **chưa gộp vào `main`**

- Bước 0–3 của `docs/plan-ai.md` (file này chỉ có trên nhánh) đã xong: bộ 30 câu thử `scripts/ai-cases/`, để model tự chọn sửa hay trả lời (không ép theo từ khoá), gọn prompt (bỏ slide HTML), tách `AiPanel.tsx` thành `src/examEditor/ai/`.
- Mới thử bằng AI giả trên trình duyệt: soạn đề, hỏi đáp, xin lại bằng chữ, dàn ý + sinh slide, sửa slide, bảng vẽ.
- **Chưa thử:** AI thật trên web; đề nguồn dài chia nhiều lượt; đọc nguồn / tệp đính kèm; tìm trên web; bảng hỏi lại; gọi lại khi đề không áp được; hội thoại nhiều lượt.
- `npm run build:prompts` rồi `npm run eval:ai -- --label <tên>` (chỉ có trên nhánh; gọi DeepSeek thật). Lần đo gần nhất 30/30.
- Nhánh **chưa có GLM**. Muốn thử cả hai cùng lúc thì gộp `main` vào `refactor/ai` trước (hỏi người dùng).
- Gộp nhánh vào `main` chỉ khi người dùng bảo.

### GLM chính hãng — ưu tiên 2 (trên `main`)

- Chuỗi: DeepSeek `deepseek-flash` → **GLM `glm-5.3-flash`** → FOSTA → AnyRouter → NightRouter → Claude. Code ở `server/llmProxy.ts`.
- Biến: `GLM_API_KEY` (bắt buộc), `GLM_BASE_URL` (mặc định `https://api.z.ai/api/paas/v4`), `GLM_MODEL` (mặc định `glm-5.3-flash`). `.env` máy dev đã có dòng trống; **người dùng tự điền key và thêm vào Vercel**, rồi redeploy.
- Theo tài liệu Z.ai (đọc 25/11): model này **bắt buộc suy luận** (không gửi `thinking: disabled`), `reasoning_effort` chỉ `low / high / max`, `temperature` 0–1, giá 0,15 / 0,03 (cache) / 0,5 USD mỗi triệu token. Proxy đổi `medium` → `high`, chỗ nào trước đây tắt suy luận thì gửi `low`.
- Test giả: `npm run test:ai-stream` (2 ca GLM). **Chưa gọi GLM thật lần nào.**

Khi có key, kiểm:
1. Trang admin AI & Server → "Kiểm tra" provider `glm`.
2. Trên máy dev ép dùng GLM: gửi `model: "glm-5.3-flash"` (trang đo: `EVAL_MODEL=glm-5.3-flash npm run eval:exam` / `eval:slides`).
3. Lượt stream có trả `usage` không (proxy gửi `stream_options.include_usage`, tài liệu Z.ai không nhắc tham số này). Thiếu usage thì người dùng bị tính **mức trần**; bị 400 thì chuỗi lặng lẽ rơi xuống FOSTA.
4. URL `api.z.ai/api/paas/v4` là API trả theo lượng dùng hay không: tài liệu không ghi rõ (có "Coding Plan endpoint" riêng). Key mua gói Coding thì có thể phải đổi `GLM_BASE_URL`.
5. Chữ suy luận có ra tiếng Việt không, thời gian và chất lượng đề / slide.

GLM chưa nằm trong chuỗi đọc ảnh (`server/sourceVision.ts`, `bankVision.ts`) dù model nhận ảnh.

## Đã push `main` kèm theo

`e78dcc9` (nhật ký giữ bước "Suy nghĩ" khi server gọi lại) và `f2a1066` (câu hình khó đặt mốc tuyển sinh 10 + hình mẫu) trước đó chưa push, nay đi cùng.

## Còn treo

- Câu hình rất khó vẫn chưa đạt với `deepseek-flash` mức `low`; cần đo model mạnh hơn.
- `scripts/test-prompt-injection.ts` gọi DeepSeek thật (~108 lượt): đừng chạy nhầm. Báo cáo cũ cho thấy prompt bị lộ ở vài tác vụ.
