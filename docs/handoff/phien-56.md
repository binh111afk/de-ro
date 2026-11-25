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
- Biến: `GLM_API_KEY` (bắt buộc), `GLM_BASE_URL` (mặc định `https://api.z.ai/api/paas/v4`), `GLM_MODEL` (mặc định `glm-5.3-flash`). Người dùng đã điền key vào `.env` máy dev và thêm vào Vercel.
- Theo tài liệu Z.ai (đọc 25/11): model này **bắt buộc suy luận** (không gửi `thinking: disabled`), `reasoning_effort` chỉ `low / high / max`, `temperature` 0–1, giá 0,15 / 0,03 (cache) / 0,5 USD mỗi triệu token. Proxy đổi `medium` → `high`, chỗ nào trước đây tắt suy luận thì gửi `low`.
- Test giả: `npm run test:ai-stream` (2 ca GLM).

**Đã thử thật (25/11, máy dev):**
- Gọi thẳng Z.ai bằng key trong `.env`: 2 giây. `api.z.ai/api/paas/v4` dùng được với key này.
- Qua `/api/llm` (`model: "glm-5.3-flash"`, stream, soạn 2 câu Toán 9): JSON đề đọc được, suy luận tiếng Việt, 36 giây lượt đầu, 7 giây lượt hai (chữ đầu ~1 giây, 10.816 token đầu vào trúng cache).
- Stream có trả `usage` (kèm `cached_tokens`, `reasoning_tokens`) → không bị tính mức trần.
- Vercel: ba biến `GLM_*` đã có ở Production, deploy sau khi thêm đã Ready.

**Chưa thử:** GLM trên bản thật (chỉ được gọi khi DeepSeek lỗi; admin bấm "Kiểm tra" provider `glm` ở AI & Server); đáp án và chất lượng đề; slide; nhánh `refactor/ai` với GLM. Trang đo ép dùng GLM: `EVAL_MODEL=glm-5.3-flash npm run eval:exam` / `eval:slides`.

GLM chưa nằm trong chuỗi đọc ảnh (`server/sourceVision.ts`, `bankVision.ts`) dù model nhận ảnh.

## Đã push `main` kèm theo

`e78dcc9` (nhật ký giữ bước "Suy nghĩ" khi server gọi lại) và `f2a1066` (câu hình khó đặt mốc tuyển sinh 10 + hình mẫu) trước đó chưa push, nay đi cùng.

## Còn treo

- Câu hình rất khó vẫn chưa đạt với `deepseek-flash` mức `low`; cần đo model mạnh hơn.
- `scripts/test-prompt-injection.ts` gọi DeepSeek thật (~108 lượt): đừng chạy nhầm. Báo cáo cũ cho thấy prompt bị lộ ở vài tác vụ.
